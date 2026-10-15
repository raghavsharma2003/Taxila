// Round 5, stream 3 (main's ask, 14.2): what the child hears in a THROTTLED minute. server/azure.js (2c2273f) moves a CHAT
// call whose deployment 429s to its twin on the overflow account (southindia) at once. Two arms, interleaved, one call at
// a time:
//   normal  the primary (eastus2) answers as it does today
//   forced  every request to the PRIMARY host answers 429 at once (a stubbed fetch; the overflow host is untouched), so the
//           call pays the 429 round trip in-process (~0 ms here; a real 429 is one RTT) and the overflow twin answers for real
// Two call shapes per arm: the reply lane (chat with the reply hedge, taxila-fast: whole reply) and the agent lane
// (chatStream with the strict JSON schema, "say" first: first speakable clause and whole call, evals/latency/agent-json.mjs).
//   node evals/latency/overflow-arm.mjs --root <a tree with 2c2273f> [--n 20] [--reply taxila-fast] [--agent taxila-gpt6] [--out f.json]
// The overflow account's endpoint and key come from .env.local's southindia names, set on process.env in THIS process only
// (never printed, never written).
import fs from "node:fs";

const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; };
const ROOT = (arg("--root", new URL("../..", import.meta.url).pathname)).replace(/\/?$/, "/");
const N = Number(arg("--n", 20)), OUT = arg("--out");
const REPLY = arg("--reply", "taxila-fast"), AGENT = arg("--agent", "taxila-gpt6");
for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
process.env.AZURE_OPENAI_ENDPOINT_OVERFLOW ||= process.env.AZURE_OPENAI_ENDPOINT_SIN;
process.env.AZURE_OPENAI_API_KEY_OVERFLOW ||= process.env.AZURE_OPENAI_API_KEY_SIN;
process.env.TAXILA_OVERFLOW_DEPLOYMENTS = [...new Set([REPLY, AGENT])].join(",");
if (!process.env.AZURE_OPENAI_ENDPOINT_OVERFLOW || !process.env.AZURE_OPENAI_API_KEY_OVERFLOW) { console.error("no overflow account in .env.local"); process.exit(2); }

const azure = await import(ROOT + "server/azure.js");
if (typeof azure.overflowFor !== "function") { console.error(`${ROOT} has no overflow (server/azure.js overflowFor)`); process.exit(2); }
const { chat, chatStream } = azure;
const { sayDeltasOf, clauseSplitter } = await import(ROOT + "server/latency/speech-stream.js");
const host = (u) => { try { return new URL(u).host; } catch { return ""; } };
const PRIMARY = host(process.env.AZURE_OPENAI_ENDPOINT), OVER = host(process.env.AZURE_OPENAI_ENDPOINT_OVERFLOW);
if (!PRIMARY || PRIMARY === OVER) { console.error("primary and overflow hosts must differ"); process.exit(2); }

const realFetch = globalThis.fetch;
let force = false;
const hits = { primary: 0, overflow: 0 };
globalThis.fetch = async (input, init) => {
  const h = host(typeof input === "string" ? input : input?.url);
  if (h === PRIMARY) hits.primary++; else if (h === OVER) hits.overflow++;
  if (force && h === PRIMARY) return new Response(JSON.stringify({ error: { code: "429", message: "stubbed throttle" } }), { status: 429, headers: { "content-type": "application/json", "retry-after": "1" } });
  return realFetch(input, init);
};

const SYSTEM_REPLY = "You are Asha, an AI teacher for an Indian class 4 child, speaking aloud in Hinglish. One or two short sentences. Never grade yourself.";
const SCHEMA = { type: "object", additionalProperties: false, required: ["say", "actions"], properties: {
  say: { type: "string", description: "what she says aloud now, first" },
  actions: { type: "array", items: { type: "object", additionalProperties: false, required: ["kind", "arg"], properties: { kind: { type: "string", enum: ["pose_item", "board", "read", "plan", "none"] }, arg: { type: "string" } } } },
} };
const STATE = { child: { class: 4, lang: "Hinglish", address: "tum" }, goal: "unit fractions: 1/3 vs 1/5", learner: { compare: "not: said 1/5 > 1/3 because 5 > 3" }, screen: "number line 0..1 in quarters" };
const SYSTEM_AGENT = `You are Asha, an AI teacher for an Indian child, speaking aloud. Reply as JSON: "say" FIRST (one or two short sentences in the child's language mix), then "actions". Never grade yourself. State: ${JSON.stringify(STATE)}`;
const SAYS = ["haan 3 logon mein zyada milegi, toh 1/3 bada hai!", "pata nahi didi", "matlab 1/5 chhota hai?", "phir se batao", "1/5 bada hai kyunki 5 bada hai"];

async function reply(said) {
  const t0 = performance.now(), r = { shape: "reply", ok: false, done: null };
  try { await chat(REPLY, [{ role: "system", content: SYSTEM_REPLY }, { role: "user", content: said }], { maxTokens: 220, effort: "none", timeoutMs: 6000, hedgeMs: 2200, quotaLane: "hot" }); r.ok = true; }
  catch (e) { r.error = String(e?.status ?? e?.code ?? e?.message).slice(0, 80); }
  r.done = Math.round(performance.now() - t0);
  return r;
}
async function agent(said) {
  const t0 = performance.now(), r = { shape: "agent", ok: false, clause: null, done: null };
  const q = []; let wake = null, ended = false;
  const deltas = (async function* () { for (;;) { if (q.length) { yield q.shift(); continue; } if (ended) return; await new Promise((res) => { wake = res; }); wake = null; } })();
  const reader = (async () => {
    const split = clauseSplitter();
    let said0 = false;
    for await (const d of sayDeltasOf(deltas)) { said0 = true; if (r.clause == null && split.push(d).length) r.clause = Math.round(performance.now() - t0); }
    if (r.clause == null && said0) r.clause = Math.round(performance.now() - t0);
  })();
  try {
    await chatStream(AGENT, [{ role: "system", content: SYSTEM_AGENT }, { role: "user", content: `(the child said) ${said}` }], {
      api: "chat", effort: "none", maxTokens: 600, timeoutMs: 20_000, stallMs: 10_000, quotaLane: "hot", schema: SCHEMA, schemaName: "turn",
      onDelta: (d) => { q.push(d); wake?.(); } });
    r.ok = true;
  } catch (e) { r.error = String(e?.status ?? e?.code ?? e?.message).slice(0, 80); }
  ended = true; wake?.();
  await reader.catch(() => {});
  r.done = Math.round(performance.now() - t0);
  return r;
}

const rows = [];
for (let i = 0; i < N; i++) {
  const arms = i % 2 ? ["forced", "normal"] : ["normal", "forced"];
  for (const arm of arms) for (const shape of [reply, agent]) {
    force = arm === "forced";
    const before = { ...hits };
    const r = await shape(SAYS[i % SAYS.length]);
    r.primaryCalls = hits.primary - before.primary; r.overflowCalls = hits.overflow - before.overflow;
    rows.push({ i, arm, ...r });
    console.log(`[${i}] ${arm.padEnd(6)} ${r.shape.padEnd(5)} clause ${r.clause ?? "-"} done ${r.done} calls p${r.primaryCalls}/o${r.overflowCalls} ${r.error ?? ""}`);
    await new Promise((res) => setTimeout(res, 250));
  }
}
force = false;
const pct = (a, p) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const summary = {};
for (const arm of ["normal", "forced"]) for (const shape of ["reply", "agent"]) {
  const R = rows.filter((r) => r.arm === arm && r.shape === shape), ok = R.filter((r) => r.ok);
  summary[`${arm}/${shape}`] = { n: R.length, ok: ok.length, clause: shape === "agent" ? [pct(ok.map((r) => r.clause), 0.5), pct(ok.map((r) => r.clause), 0.9)] : undefined,
    done: [pct(ok.map((r) => r.done), 0.5), pct(ok.map((r) => r.done), 0.9)], overflowCalls: R.reduce((s, r) => s + r.overflowCalls, 0), errors: R.filter((r) => !r.ok).map((r) => r.error) };
}
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), n: N, reply: REPLY, agent: AGENT, summary, rows }, null, 1));
process.exit(0);
