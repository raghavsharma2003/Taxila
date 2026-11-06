// The production-latency replay (main, after director7: "pin the true production figure"). director7's 16 lessons — the same
// 4 topics × 4 personas and the same reactive child (evals/child-sim/reactive.mjs, H1.2) — driven through the REAL turn path:
// POST /api/lesson/start and POST /api/lesson/turn on the in-process API (server/index.js handle), spoken cascade turns, the
// clause stream (Accept: text/event-stream). Every production path runs: perceive / speculate (the likely replies written
// while the classifier is out), the distress read, the note, the guards, the store.
//
// Per teacher turn it records, in ms from the moment the turn request is sent:
//   firstAudioReadyMs  the first speakable clause is guarded and sent (the first `clause` event): what TTS starts on, so the
//                      child's first teacher sound is this plus TTS first byte (Voice measures that; no TTS is called here)
//   turnMs             the `turn` event (the whole reply stored and the response written)
//   plus the server's own phase marks (debug.timings: @classified, @planned, @replied, @stored …), the speculation outcome
//   (debug.speculation), whether the first clause was the locked early clause (guard.clause), and the guard's rewrite flags.
//
// The database: a THROWAWAY local Postgres only (TAXILA_REPLAY_DB, host localhost/127.0.0.1, every migration applied to
// it). Never Neon: the turn path writes, and the shared branches are read-only for evals. The process refuses any other host.
// TLS is required by server/db.js, so the local server runs ssl=on and NODE_EXTRA_CA_CERTS names its certificate.
//
//   NODE_EXTRA_CA_CERTS=<server.crt> TAXILA_REPLAY_DB='postgres://taxila@localhost:55432/taxila?sslmode=require' \
//     TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/turn-replay.mjs [--dry] [--cap 3000 --usd 2] \
//     [--topics a,b] [--personas steady,stuck] [--out dir]
//   --dry   no Azure call leaves the process: each one is counted and answered with a stub (a short line; "{}" for a
//           structured call), so the count sizes the cap. The stub never answers like a model, so the dry lessons diverge
//           from live ones; live ≈ dry × the director runs' calibration is an estimate, said so.
// Scores nothing (judging is the Claude session's). Writes <out>/<persona>-<topic>.json, <out>/summary.json, <out>/meter.json.
import http from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const TOPICS = arg("topics", "c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01").split(",");
const PERSONAS = arg("personas", "steady,offtopic,stuck,steering").split(",");
const CAP = Number(arg("cap", "200"));
const USD_CAP = Number(arg("usd", "0.2"));
const OUT = arg("out", `evals/turn-replay/results/${new Date().toISOString().slice(0, 10)}${DRY ? "-dry" : ""}`);

// ── the database: the throwaway local one, or nothing ──
const DB = process.env.TAXILA_REPLAY_DB ?? "";
const host = (() => { try { return new URL(DB).hostname; } catch { return ""; } })();
if (!["localhost", "127.0.0.1"].includes(host)) { console.error("TAXILA_REPLAY_DB must be a local throwaway Postgres (localhost); refusing"); process.exit(2); }
for (const k of ["TAXILA_DB", "DATABASE_URL_DIRECT", "CONDUCTOR_TEST_DATABASE_URL", "TEST_DATABASE_URL"]) delete process.env[k];
process.env.DATABASE_URL = DB;
process.env.DB_DRIVER = "pg";
// no TTS: first-audio-ready is measured to the first guarded clause (what TTS starts on); Voice owns the TTS first byte, and
// the server's TTS prewarm (server/voice/prewarm.js) would only add a paid speech call per turn here
process.env.TAXILA_TTS_PREWARM = "0";
// dc-r7-code-spec: the eval tree runs code-classified speculation on unless the run says otherwise (production: off by default)
process.env.TAXILA_CODE_SPEC ??= "on";
// only the chat models are reachable: speech, storage, search and every other Azure service are removed (no TTS, no blobs)
for (const k of Object.keys(process.env)) if (/^AZURE_|ENDPOINT$|_KEY$/.test(k) && !/^AZURE_OPENAI_/.test(k)) delete process.env[k];
if (DRY) { process.env.AZURE_OPENAI_ENDPOINT = "https://dry.invalid/openai/v1"; process.env.AZURE_OPENAI_API_KEY = "dry"; for (const k of Object.keys(process.env)) if (/^AZURE_OPENAI_ENDPOINT_/.test(k)) delete process.env[k]; }
else if (!process.env.AZURE_OPENAI_ENDPOINT) { console.error("no AZURE_OPENAI_ENDPOINT: run with node --env-file=.env.local, or --dry"); process.exit(2); }

// ── the meter (every Azure request, counted before it is sent; a cap stops the run) ──
const meter = { calls: 0, usd: 0, byDeployment: {}, byPath: {} };
const { usdOf, normUsage } = await import("../server/azure.js");
const realFetch = globalThis.fetch;
const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (!/openai|azure|cognitiveservices|models\.ai|dry\.invalid/i.test(u)) return realFetch(url, init);
  let body = {};
  try { body = JSON.parse(String(init.body ?? "{}")); } catch { /* not JSON */ }
  const dep = body.model ?? u.match(/deployments\/([^/]+)/)?.[1] ?? "?";
  if (meter.calls >= CAP || meter.usd >= USD_CAP) { console.error(`STOP: cap reached (${meter.calls} calls, ~$${meter.usd.toFixed(3)})`); stopWith(4, "cap"); }
  meter.calls++;
  meter.byDeployment[dep] = (meter.byDeployment[dep] ?? 0) + 1;
  const path = u.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");
  meter.byPath[path] = (meter.byPath[path] ?? 0) + 1;
  // (the same conservative estimate as the director runs: input = body/4 tokens, 300 out)
  meter.usd += usdOf(dep, { in: Math.round(String(init.body ?? "").length / 4), cached: 0, out: 300, reasoning: 0 });
  if (DRY) return stubResponse(path, body);
  const res = await realFetch(url, init);
  if (res.status === 401 || res.status === 403) { console.error(`STOP: HTTP ${res.status} from ${dep} (auth): not retried`); stopWith(3, `auth ${res.status}`); }
  return res;
};
function stubResponse(path, body) {
  const structured = !!(body.response_format || body.text?.format);
  const text = structured ? "{}" : STUB;
  if (body.stream) {
    const ev = path.endsWith("/responses")
      ? [{ type: "response.output_text.delta", delta: text }, { type: "response.completed", response: { status: "completed", usage: { input_tokens: 1, output_tokens: 1 } } }]
      : [{ choices: [{ delta: { content: text } }] }, { choices: [{ delta: {}, finish_reason: "stop" }] }, { usage: { prompt_tokens: 1, completion_tokens: 1 } }];
    const sse = ev.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n";
    return new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } });
  }
  const json = path.endsWith("/responses")
    ? { output_text: text, output: [{ type: "message", content: [{ type: "output_text", text }] }], usage: { input_tokens: 1, output_tokens: 1 } }
    : { choices: [{ message: { content: text }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
  return new Response(JSON.stringify(json), { status: 200, headers: { "content-type": "application/json" } });
}
function stopWith(code, why) {
  try { mkdirSync(OUT, { recursive: true }); writeFileSync(`${OUT}/meter.json`, JSON.stringify({ stopped: why, dry: DRY, ...meterOut() }, null, 1) + "\n"); } catch { /* the exit matters more */ }
  process.exit(code);
}
const meterOut = () => ({ calls: meter.calls, usdEstimate: +meter.usd.toFixed(3), byDeployment: meter.byDeployment, byPath: meter.byPath, cap: CAP, usdCap: USD_CAP });

// ── the API, in process ──
const { q, one } = await import("../server/db.js");
const { handle } = await import("../server/index.js");
const { kitFor } = await import("../server/brain/rows.js");
const { findItem } = await import("../server/director/items.js");
const { createReactiveChild, maxTurnsFor } = await import("./child-sim/reactive.mjs");
const { scriptWhyNot } = await import("../server/director/script.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const bad = TOPICS.map((t) => [t, scriptWhyNot(kitFromFile(getTopic(t)))]).filter(([, w]) => w);
if (bad.length) { console.error(`NO SCRIPT: ${bad.map(([t, w]) => `${t}: ${w}`).join("; ")}`); process.exit(5); }

const server = http.createServer(handle);
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const RUN = randomUUID().slice(0, 8);
const guardian = (await one("insert into guardian (email, pw_hash, name) values ($1, 'x', 'replay') returning id", [`replay+${RUN}@test.invalid`])).id;
const token = randomUUID() + randomUUID();
await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(token).digest("hex"), guardian]);
for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [guardian, p]);
const post = (path, body) => realFetch(base + path, { method: "POST", headers: { cookie: `tx_session=${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });

/** One turn on the clause stream: { firstAudioReadyMs, turnMs, clauses, turn }. */
async function streamTurn(body) {
  const t0 = performance.now();
  const res = await realFetch(base + "/api/lesson/turn", { method: "POST", headers: { cookie: `tx_session=${token}`, "content-type": "application/json", accept: "text/event-stream" }, body: JSON.stringify(body) });
  if (!/event-stream/.test(res.headers.get("content-type") ?? "")) return { error: `${res.status} ${await res.text().catch(() => "")}`.slice(0, 300) };
  let buf = "", first = null, turn = null, turnMs = null;
  const clauses = [];
  const dec = new TextDecoder();
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let k;
    while ((k = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, k); buf = buf.slice(k + 2);
      const ev = raw.match(/^event: (\w+)/m)?.[1], data = raw.match(/^data: (.*)$/m)?.[1];
      if (!ev || data == null) continue;
      const d = JSON.parse(data);
      const ms = Math.round(performance.now() - t0);
      if (ev === "clause") { if (d.text && first == null) first = ms; clauses.push({ i: d.i, ms, final: d.final, chars: String(d.text ?? "").length }); }
      if (ev === "turn") { turn = d; turnMs = ms; }
    }
  }
  return { firstAudioReadyMs: first ?? turnMs, turnMs, clauses, turn };
}

/** The reactive child's view of the lesson (as evals/hybrid-side-by-side.mjs builds it), from the stored lesson state. */
function childView(s, kit) {
  const live = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
  const keyed = live?.scriptAsk ?? live?.scriptCheck ?? live?.scriptThen ?? null;
  const card = live ? { itemId: live.id, key: String(live.answer), accept: live.acceptable ?? [], misses: s.misses?.[live.id] ?? 0 } : null;
  const ask = keyed ? { key: String(live.answer), accept: live.acceptable ?? [], targets: keyed.targets ?? null, wrongIfMis: keyed.wrongIfMis ?? null } : null;
  const sb = s.lastMove?.scriptBeat;
  return { teacher: [...(s.recent ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "", beat: sb ? { skillId: sb.skillId, kind: sb.kind, beatId: sb.beatId } : null,
    card, ask, lang: s.ctx?.lang ?? "hinglish", ...(["probe", "teachback"].includes(s.lastMove?.kind) ? { probe: true } : {}) };
}

mkdirSync(OUT, { recursive: true });
const all = [];
for (const topicId of TOPICS) {
  const kit = await kitFor(topicId, {});
  const classLevel = Number(String(topicId).match(/^c(\d)/)?.[1] ?? 5);
  for (const persona of PERSONAS) {
    const name = `${persona}-${topicId}`;
    const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1,'Riya',$2,'hinglish','asha') returning id", [guardian, classLevel])).id;
    const s0 = await post("/api/lesson/start", { childId: kid, mode: "cascade", purpose: "practice", topicId });
    const sb = await s0.json().catch(() => null);
    if (s0.status !== 201) { console.error(`${name}: start ${s0.status} ${JSON.stringify(sb).slice(0, 200)}`); continue; }
    const lessonId = sb.lessonId;
    const child = createReactiveChild({ persona, seed: 7, kit, name: "Riya" });
    const rows = [];
    for (let i = 0; i < maxTurnsFor(persona); i++) {
      const { state } = await one("select state from lesson where id = $1", [lessonId]);
      const out = child.reply({ turn: i, ...childView(state, kit), boardUp: false });
      if (out?.text == null || out.kind === "leave") break;
      const r = await streamTurn({ lessonId, childText: out.text, asrConfidence: 0.95, turnSeq: i + 1 });
      if (r.error) { console.error(`${name} turn ${i + 1}: ${r.error}`); break; }
      const d = r.turn?.debug ?? {};
      const marks = Object.fromEntries((d.timings ?? []).filter((x) => String(x.kind).startsWith("@")).map((x) => [String(x.kind).slice(1), x.ms]));
      rows.push({ turn: i + 1, firstAudioReadyMs: r.firstAudioReadyMs, turnMs: r.turnMs, clauses: r.clauses.length,
        earlyClause: !!d.guard?.clause?.sent, s1Ms: d.guard?.clause?.s1Ms ?? null, speculation: d.speculation ?? null,
        classifySource: d.classification?.source ?? null, outcome: d.classification?.outcome ?? null,
        rewrite: !!d.guard?.rewritten, rewriteSkipped: d.guard?.rewriteSkipped ?? null, marks,
        models: (d.timings ?? []).filter((x) => !String(x.kind).startsWith("@")).map((x) => ({ kind: x.kind, deployment: x.deployment, ms: x.ms, status: x.status })) });
    }
    const v = rows.map((x) => x.firstAudioReadyMs).filter(Number.isFinite).sort((a, b) => a - b);
    const p50 = v.length ? v[Math.floor(v.length / 2)] : null;
    console.log(`${name}: ${rows.length} turns · first-audio-ready p50 ${p50} ms · calls so far ${meter.calls} (~$${meter.usd.toFixed(3)})`);
    writeFileSync(`${OUT}/${name}.json`, JSON.stringify({ topicId, persona, dry: DRY, lessonId: null, rows }, null, 1) + "\n");
    all.push({ name, rows });
  }
}
const q50 = (v, p) => { const s = v.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null; };
const flat = all.flatMap((x) => x.rows);
const cat = (f) => { const r = flat.filter(f); return { turns: r.length, firstAudioReady: { p50: q50(r.map((x) => x.firstAudioReadyMs), 0.5), p90: q50(r.map((x) => x.firstAudioReadyMs), 0.9) }, turn: { p50: q50(r.map((x) => x.turnMs), 0.5), p90: q50(r.map((x) => x.turnMs), 0.9) } }; };
const summary = { dry: DRY, lessons: all.length, all: cat(() => true), earlyClause: cat((x) => x.earlyClause), noEarlyClause: cat((x) => !x.earlyClause),
  speculationHit: cat((x) => x.speculation?.hit === true), speculationMiss: cat((x) => x.speculation?.hit === false), rewritten: cat((x) => x.rewrite), rewriteSkipped: cat((x) => !!x.rewriteSkipped), meter: meterOut() };
writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 1) + "\n");
writeFileSync(`${OUT}/meter.json`, JSON.stringify({ dry: DRY, ...meterOut() }, null, 1) + "\n");
console.log(`done: ${meter.calls} model calls, ~$${meter.usd.toFixed(3)} estimated`);
server.close();
process.exit(0);
