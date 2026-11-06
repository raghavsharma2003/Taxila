// A fake Azure for the M3/M4 keeper and verifier (tests/m3-plan.test.mjs, tests/m4-break.test.mjs): a blob store with
// ETags, conditional writes and BLOB LEASES on a settable clock; Azure OpenAI chat, Speech TTS and List Blobs, each
// counted and each with a fault hook; Cost Management for the verifier. No network. Not a suite (no .test. in the name).
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

/** $ per 1M tokens of the fake deployments the keeper env below names. */
export const DEP_PRICES = { "dep-fast": { in: 0.2, out: 1.2 }, "dep-fb": { in: 4, out: 20 }, "dep-fb2": { in: 0.2, out: 1.2 } };

/**
 * @param {{ failGet?: (name: string) => number|boolean, failPut?: (name: string, n: number) => number|boolean,
 *   chat?: (body: object, url: URL) => object, tts?: (region: string) => number|null, list?: () => number|null, down?: () => boolean }} hooks
 * chat returns { status } to fail or { prompt_tokens, completion_tokens }; tts / list return a status to fail; down() → every
 * storage request throws (a network outage) while it returns true.
 */
export function fakeAzure({ failGet = () => false, failPut = () => false, chat = () => ({ prompt_tokens: 80, completion_tokens: 4000 }),
  tts = () => null, list = () => null, down = () => false, slow = () => 0 } = {}) {
  const blobs = new Map(), calls = { chat: 0, chatOk: 0, tts: 0, ttsOk: 0, list: 0, put: 0, lease: 0 };
  const spent = { models: 0, tts: 0, storage: 0 }, byDep = {};
  let etagN = 0, now = Date.parse("2026-11-05T00:00:00Z");
  const active = (b) => b?.lease && b.lease.until > now;
  const fetch = async (url, init = {}) => {
    const u = new URL(url), method = init.method || "GET";
    const h = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const ms = slow(u, method);
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
    if (u.hostname === "acct.blob.core.windows.net") {
      assert.match(h.authorization, /^SharedKey acct:[A-Za-z0-9+/]+=*$/);
      if (down()) throw new TypeError("fetch failed (fake outage)");
      if (u.searchParams.get("comp") === "list") {
        calls.list++;
        const st = list();
        if (st) return new Response("", { status: st });
        spent.storage += 0.0001;
        return new Response("<EnumerationResults/>", { status: 200 });
      }
      const name = decodeURIComponent(u.pathname.replace(/^\/m3-ledger\//, ""));
      if (u.searchParams.get("comp") === "lease") {
        calls.lease++;
        const b = blobs.get(name);
        if (!b) return new Response("", { status: 404 });
        const act = h["x-ms-lease-action"];
        if (act === "acquire") {
          if (active(b)) return new Response("", { status: 409 });
          b.lease = { id: h["x-ms-proposed-lease-id"] || randomUUID(), until: now + Number(h["x-ms-lease-duration"]) * 1000 };
          return new Response("", { status: 201, headers: { "x-ms-lease-id": b.lease.id } });
        }
        if (!active(b) || b.lease.id !== h["x-ms-lease-id"]) return new Response("", { status: 409 });
        if (act === "renew") { b.lease.until = now + 60_000; return new Response("", { status: 200, headers: { "x-ms-lease-id": b.lease.id } }); }
        if (act === "release") { b.lease = null; return new Response("", { status: 200 }); }
        return new Response("", { status: 400 });
      }
      if (method === "GET") {
        const f = failGet(name);
        if (f) return new Response("", { status: f === true ? 500 : f });
        const b = blobs.get(name);
        return b ? new Response(b.body, { status: 200, headers: { etag: b.etag } }) : new Response("", { status: 404 });
      }
      calls.put++;
      const f = failPut(name, calls.put);
      if (f) return new Response("", { status: f === true ? 500 : f });
      const cur = blobs.get(name);
      if (h["if-none-match"] === "*" && cur) return new Response("", { status: 409 });
      if (h["if-match"] && cur?.etag !== h["if-match"]) return new Response("", { status: 412 });
      if (active(cur) && h["x-ms-lease-id"] !== cur.lease.id) return new Response("", { status: 412 });   // LeaseIdMissing / LeaseIdMismatch
      const etag = `"0x${++etagN}"`;
      blobs.set(name, { body: Buffer.from(init.body).toString(), etag, lease: cur?.lease || null });
      return new Response("", { status: 201, headers: { etag } });
    }
    if (u.pathname.endsWith("/chat/completions")) {
      calls.chat++;
      const body = JSON.parse(init.body);
      assert.ok(["aoai-secret", "fb2-secret"].includes(h["api-key"]));
      const r = chat(body, u);
      if (r.status) return new Response(JSON.stringify({ error: { code: "x" } }), { status: r.status, headers: { "retry-after-ms": "1" } });
      calls.chatOk++;
      const p = DEP_PRICES[body.model] || DEP_PRICES["dep-fast"];
      const usd = (r.prompt_tokens * p.in + r.completion_tokens * p.out) / 1e6;
      spent.models += usd; byDep[body.model] = (byDep[body.model] || 0) + usd;
      return Response.json({ choices: [{ message: { content: "…" } }], usage: { ...r, prompt_tokens_details: { cached_tokens: 0 } } });
    }
    if (u.hostname.endsWith(".tts.speech.microsoft.com")) {
      calls.tts++;
      const st = tts(u.hostname.split(".")[0]);
      if (st) return new Response("", { status: st });
      calls.ttsOk++;
      spent.tts += ([...String(init.body).replace(/<[^>]+>/g, "")].length * 15) / 1e6;
      return new Response(new Uint8Array(64), { status: 200 });
    }
    throw new Error(`unexpected fetch ${u.host}${u.pathname}`);
  };
  return { fetch, blobs, calls, byDep, spent: () => ({ ...spent }),
    ledger: (d) => JSON.parse(blobs.get(`ledger/${d}.json`)?.body || "null"),
    put: (name, obj) => blobs.set(name, { body: typeof obj === "string" ? obj : JSON.stringify(obj), etag: `"0x${++etagN}"`, lease: blobs.get(name)?.lease || null }),
    lease: (name) => blobs.get(name)?.lease || null,
    at: (iso) => { now = Date.parse(iso); }, now: () => now };
}

/** The keeper env of the fake: three lanes, a 3-deployment models chain, one speech region (+ a fallback when asked). */
export const KEEPER_ENV = { M3_UNTIL: "2027-01-31", M3_SINCE: "2026-11-01", M3_MODELS_TARGET: "1.35", M3_MODELS_CAP: "2", M3_TTS_TARGET: "1.35", M3_TTS_CAP: "2",
  M3_STORAGE_TARGET: "1.25", M3_STORAGE_CAP: "2", M3_RAISE_FLOOR: "1.2", M3_RAISE_MAX: "2.5",
  M3_AOAI_ENDPOINT: "https://example.openai.azure.com/openai/v1", M3_AOAI_KEY: "aoai-secret", M3_AOAI_DEPLOYMENT: "dep-fast", M3_AOAI_PRICE_IN: "0.2", M3_AOAI_PRICE_CACHED: "0.02", M3_AOAI_PRICE_OUT: "1.2",
  M3_AOAI_FALLBACK_DEPLOYMENT: "dep-fb", M3_AOAI_FALLBACK_PRICE_IN: "4", M3_AOAI_FALLBACK_PRICE_CACHED: "0.4", M3_AOAI_FALLBACK_PRICE_OUT: "20",
  M3_SPEECH_REGION: "centralindia", M3_SPEECH_KEY: "speech-secret", M3_TTS_PRICE_PER_MCHARS: "15", M3_STORAGE_OP_USD: "0.0001", M3_STORAGE_BATCH: "2000" };

/**
 * Run the keeper's main once at `at` (ISO) against `az`, with KEEPER_ENV + `env` set only for the run (restored after,
 * so nothing leaks into another suite under the one-process `npm test`). → { code, lines, lane(id), alerts }
 */
export async function runKeeper(K, az, at, env = {}) {
  const set = { ...KEEPER_ENV, ...env };
  const saved = Object.fromEntries(Object.keys(set).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(set)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  const lines = [], log = console.log, f = globalThis.fetch;
  console.log = (s) => lines.push(String(s));
  globalThis.fetch = az.fetch;
  az.at(at);
  try {
    const code = await K.main(new Date(at));
    const m3 = lines.filter((l) => l.startsWith("M3 ")).map((l) => JSON.parse(l.slice(3)));
    return { code, lines, lane: (id) => m3.find((x) => x.lane === id), alerts: lines.filter((l) => l.startsWith("M3-ALERT ")).map((l) => JSON.parse(l.slice(9))) };
  } finally {
    console.log = log; globalThis.fetch = f;
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}
