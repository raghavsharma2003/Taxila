import { agentTurn, eventOf } from "/home/user/Taxila/server/agent/agent.js";
import { speakStreamed } from "/home/user/Taxila/server/latency/speech-stream.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
const kit = kitFromFile(getTopic("c4-maths-ch05-t01"));
const tools = { now: () => ({ on: "nothing", words: "nothing is on the screen", texts: [] }), show: async () => ({ ok: false, refused: { why: "bench" } }), clear: () => ({ on: "nothing" }), picture: () => ({ ok: false }), slot: () => null, news: () => [], game: async () => ({ ok: false }) };
const EVENTS = ['the child said (speech recognition confidence 0.91): "mujhe samajh nahi aaya, phir se batao"', 'the child said (speech recognition confidence 0.90): "1/3 bada hai kyunki 3 bada hai"', 'the child said (speech recognition confidence 0.93): "haan theek hai, aage chalo"', 'the child said (speech recognition confidence 0.88): "ek game khelna hai"'];
const rows = [];
for (let n = 0; n < Number(process.argv[2] ?? 20); n++) {
  const state = { turn: 3 + n, phase: "teach", ctx: { firstName: "Riya", classLevel: 4, lang: "hinglish" }, itemsDone: [], skipped: [] };
  const t0 = performance.now();
  let speech = null;
  try {
    const out = await agentTurn({ state, kit, event: EVENTS[n % EVENTS.length], lessonId: `bench-${n}`, lane: "voice", tools,
      onSay: (deltas, gate) => { speech = speakStreamed({ deltas, gate, synth: async function* (c) { yield Buffer.from(c); }, emit: () => {}, now: () => performance.now() - 0 }); } });
    const whole = Math.round(performance.now() - t0);
    const sp = await speech;
    rows.push({ firstSayMs: out.firstSayMs, firstClauseMs: sp.firstClauseMs != null ? Math.round(sp.firstClauseMs) : null, whole, clauses: sp.spoken.length });
  } catch (e) { rows.push({ error: String(e.message).slice(0, 80), whole: Math.round(performance.now() - t0) }); }
}
const q = (xs, p) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const ok = rows.filter((r) => !r.error);
// speakStreamed's clock starts when onSay is called (≈ the request start), so firstClauseMs ≈ ms from the agent call to her first clause
console.log(JSON.stringify({ n: rows.length, errors: rows.length - ok.length, firstClause: { p50: q(ok.map((r) => r.firstClauseMs), 0.5), p90: q(ok.map((r) => r.firstClauseMs), 0.9) },
  firstSay: { p50: q(ok.map((r) => r.firstSayMs), 0.5), p90: q(ok.map((r) => r.firstSayMs), 0.9) }, whole: { p50: q(ok.map((r) => r.whole), 0.5), p90: q(ok.map((r) => r.whole), 0.9) }, clausesP50: q(ok.map((r) => r.clauses), 0.5) }));
console.log(JSON.stringify(rows.slice(0, 6)));
