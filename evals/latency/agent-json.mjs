// Round 5, stream 3: 4A's agent call shape (server/agent/agent.js agentTurn): ONE streamed strict json_schema call, "say"
// FIRST in the schema, no function tools; the say string is read out of the partial JSON (server/latency/speech-stream.js
// sayDeltasOf) and split into speakable clauses (clauseSplitter). Per call: ttft (first JSON token), say (first character
// of "say"), clause (its first speakable clause complete), done. Interleaved across models, one call at a time.
//   node evals/latency/agent-json.mjs [--n 20] [--models a,b] [--out file.json]
// US container -> the deployments' regions; synthetic state (agent-models.mjs's), not a child.
import fs from "node:fs";

const REPO = new URL("../..", import.meta.url).pathname;
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
const argv = process.argv;
const arg = (k, d) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : d; };
const N = Number(arg("--n", 20)), OUT = arg("--out");
const MODELS = arg("--models", "taxila-gpt6,taxila-fast,taxila-gpt6-astra,taxila-gpt61-sol").split(",");
const { chatStream } = await import(REPO + "server/azure.js");
const { sayDeltasOf, clauseSplitter } = await import(REPO + "server/latency/speech-stream.js");

const SCHEMA = { type: "object", additionalProperties: false, required: ["say", "actions"], properties: {
  say: { type: "string", description: "what she says aloud now, first" },
  actions: { type: "array", items: { type: "object", additionalProperties: false, required: ["kind", "arg"], properties: { kind: { type: "string", enum: ["pose_item", "board", "read", "plan", "none"] }, arg: { type: "string" } } } },
} };
const STATE = { child: { class: 4, lang: "Hinglish", address: "tum" }, goal: "unit fractions: 1/3 vs 1/5", learner: { compare: "not: said 1/5 > 1/3 because 5 > 3" },
  screen: "number line 0..1 in quarters", plan: ["re-explain with a roti split", "check with one compare item"] };
const SYSTEM = `You are Asha, an AI teacher for an Indian child, speaking aloud. Reply as JSON: "say" FIRST (one or two short sentences in the child's language mix), then "actions". Never grade yourself. State: ${JSON.stringify(STATE)}`;
const SAYS = ["haan 3 logon mein zyada milegi, toh 1/3 bada hai!", "pata nahi didi", "matlab 1/5 chhota hai?", "kya hum game khel sakte hain?", "phir se batao"];
const RESPONSES = /^(taxila-gpt61-sol|taxila-gpt6-astra)/i;

async function one(dep, said) {
  const t0 = performance.now(), r = { dep, ttft: null, say: null, clause: null, done: null, ok: false };
  const q = []; let wake = null, ended = false;
  const deltas = (async function* () { for (;;) { if (q.length) { yield q.shift(); continue; } if (ended) return; await new Promise((res) => { wake = res; }); wake = null; } })();
  const reader = (async () => {
    const split = clauseSplitter();
    for await (const d of sayDeltasOf(deltas)) {
      if (r.say == null) r.say = Math.round(performance.now() - t0);
      if (r.clause == null && split.push(d).length) r.clause = Math.round(performance.now() - t0);
    }
    if (r.clause == null && r.say != null) r.clause = Math.round(performance.now() - t0); // a one-clause say: its end
  })();
  try {
    await chatStream(dep, [{ role: "system", content: SYSTEM }, { role: "user", content: `(the child said) ${said}` }], {
      api: RESPONSES.test(dep) ? "responses" : "chat", effort: "none", maxTokens: 600, timeoutMs: 20_000, stallMs: 10_000, quotaLane: "hot",
      schema: SCHEMA, schemaName: "turn", onDelta: (d) => { if (r.ttft == null) r.ttft = Math.round(performance.now() - t0); q.push(d); wake?.(); },
    });
    r.ok = true;
  } catch (e) { r.error = String(e?.message ?? e).slice(0, 160); }
  ended = true; wake?.();
  await reader.catch(() => {});
  r.done = Math.round(performance.now() - t0);
  return r;
}

const rows = [];
for (let i = 0; i < N; i++) for (const dep of MODELS) {
  const r = await one(dep, SAYS[i % SAYS.length]);
  rows.push({ i, ...r });
  console.log(`[${i}] ${dep.padEnd(20)} ttft ${r.ttft} say ${r.say} clause ${r.clause} done ${r.done} ${r.error ?? ""}`);
  await new Promise((res) => setTimeout(res, 300));
}
const pct = (a, p) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const summary = Object.fromEntries(MODELS.map((dep) => { const R = rows.filter((r) => r.dep === dep && r.ok); const c = (k) => R.map((r) => r[k]);
  return [dep, { ok: R.length, ttft: [pct(c("ttft"), 0.5), pct(c("ttft"), 0.9)], say: [pct(c("say"), 0.5), pct(c("say"), 0.9)], clause: [pct(c("clause"), 0.5), pct(c("clause"), 0.9)], done: [pct(c("done"), 0.5), pct(c("done"), 0.9)] }]; }));
console.log(JSON.stringify(summary, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), n: N, summary, rows }, null, 1));
process.exit(0);
