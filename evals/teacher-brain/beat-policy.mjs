// TEACHER-BRAIN probe M1 (docs/design/superhuman/TEACHER-BRAIN.md §14): who should make the BEAT decision
// (what to teach next, and whether / what to build live)? Code policy vs an LLM proposer, on the same compact
// BrainState. Measures: admissible-decision rate against labels written BEFORE any run (single rater, the spec
// author: a weak instrument, stated), latency p50/p90, schema validity, and reproducibility (same input x3).
//
//   NODE_USE_ENV_PROXY=1 node evals/teacher-brain/beat-policy.mjs [reps=3] [models=taxila-fast,grok-4-20-non-reasoning,DeepSeek-V4-Flash]
// Never prints the key. Scenarios are eval inputs, never prompt text for the product.
import fs from "node:fs";
import { loadEnv } from "../live-studio/models.mjs";
loadEnv();
const { chat } = await import("../../server/azure.js");

const REPS = +(process.argv[2] || 3);
const MODELS = (process.argv[3] || "taxila-fast,grok-4-20-non-reasoning,DeepSeek-V4-Flash").split(",");
const KINDS = ["none", "game", "simulation", "explorable", "animation", "diagram", "chart", "image"];
const MOVES = ["explain", "worked_example", "contrast_misconception", "probe_why", "practice", "step_down", "break_choice", "explore_question", "recap"];
const REPS_ = ["concrete", "pictorial", "symbolic"];

// ── scenarios: BrainState snapshot (telegraphic, as the Brain holds it) + admissible labels ──
// ok = admissible {move, kind} pairs (kind "*" = any kind incl. none). Labels fixed 2026-10-04 before the first run.
const S = [
  { id: "mis-quantity", st: { band: "B2", lang: "hinglish", skill: "c4 compare unit fractions", beat: "practice", last: "1/4 bada hai kyunki 4 bada hai", verdicts: "w,w", mis: { id: "bigger-denominator-bigger", p: 0.82, class: "quantity" }, K: 0.35, U: "low", engagement: "engaged", guidance: "faded", libraryHits: ["game"], liveBudget: 2, leadS: 40, minsLeft: 14, formatHistory: { game: "2/2 next-unaided after", animation: "0/1" } },
    ok: [["contrast_misconception", "game"]] },
  { id: "mis-process", st: { band: "B3", lang: "hinglish", skill: "c7 photosynthesis inputs", beat: "explain", last: "plants mitti khaate hain", verdicts: "w", mis: { id: "plants-eat-soil", p: 0.74, class: "process" }, K: 0.4, U: "unknown", engagement: "engaged", guidance: "worked", libraryHits: [], liveBudget: 3, leadS: 120, minsLeft: 20, formatHistory: {} },
    ok: [["contrast_misconception", "animation"], ["contrast_misconception", "simulation"]] },
  { id: "strained", st: { band: "B2", lang: "hindi", skill: "c4 carry in addition", beat: "practice", last: "pata nahi", verdicts: "w,w,idk,idk", mis: null, K: 0.3, U: "unknown", engagement: "strained", guidance: "attempt", libraryHits: ["game"], liveBudget: 3, leadS: 60, minsLeft: 12, formatHistory: { game: "1/3" } },
    ok: [["step_down", "none"], ["break_choice", "none"], ["worked_example", "none"]] },
  { id: "streak-why", st: { band: "B3", lang: "english", skill: "c6 integer comparison", beat: "practice", last: "-2", verdicts: "c,c,c", mis: null, K: 0.86, U: "unknown", engagement: "engaged", guidance: "attempt", libraryHits: ["game"], liveBudget: 3, leadS: 30, minsLeft: 15, formatHistory: {} },
    ok: [["probe_why", "none"]] },
  { id: "curious-q", st: { band: "B3", lang: "hinglish", skill: "c6 latitude longitude", beat: "explain", last: "toh India mein time alag alag kyun nahi hai?", verdicts: "c", mis: null, K: 0.6, U: "mid", engagement: "engaged", guidance: "faded", libraryHits: [], liveBudget: 2, leadS: 90, minsLeft: 18, formatHistory: { explorable: "1/1" } },
    ok: [["explore_question", "explorable"], ["explore_question", "diagram"], ["explore_question", "none"], ["explain", "diagram"]] },
  { id: "new-skill-low", st: { band: "B2", lang: "hinglish", skill: "c4 equivalent fractions (new)", beat: "teach_start", last: "ok", verdicts: "", mis: null, K: 0.15, U: "unknown", engagement: "warming", guidance: "worked", baselineTercile: "low", libraryHits: ["animation"], liveBudget: 3, leadS: 100, minsLeft: 22, formatHistory: {} },
    ok: [["worked_example", "animation"], ["worked_example", "none"], ["explain", "animation"]] },
  { id: "wrap-time", st: { band: "B3", lang: "english", skill: "c5 bar graphs", beat: "practice", last: "8", verdicts: "c,w,c", mis: null, K: 0.7, U: "mid", engagement: "engaged", guidance: "attempt", libraryHits: ["chart"], liveBudget: 1, leadS: 20, minsLeft: 2, formatHistory: {} },
    ok: [["recap", "none"]] },
  { id: "budget-out", st: { band: "B3", lang: "hinglish", skill: "c8 pressure and area", beat: "explain", last: "nukeeli cheez zyada chubhti hai na?", verdicts: "c", mis: null, K: 0.5, U: "low", engagement: "engaged", guidance: "faded", libraryHits: [], liveBudget: 0, leadS: 120, minsLeft: 16, formatHistory: { simulation: "1/1" } },
    ok: [["explain", "none"], ["probe_why", "none"], ["worked_example", "none"]] },
  { id: "young-data", st: { band: "B1", lang: "hindi", skill: "c2 tally and pictograph", beat: "teach_start", last: "haan", verdicts: "", mis: null, K: 0.2, U: "unknown", engagement: "engaged", guidance: "worked", libraryHits: ["chart", "game"], liveBudget: 3, leadS: 90, minsLeft: 12, formatHistory: {} },
    ok: [["worked_example", "chart"], ["worked_example", "game"], ["explain", "chart"], ["explain", "game"]] },
  { id: "short-lead", st: { band: "B3", lang: "hinglish", skill: "c7 food chains", beat: "practice", last: "snake grass khata hai", verdicts: "w", mis: { id: "arrow-direction", p: 0.55, class: "structure" }, K: 0.45, U: "low", engagement: "engaged", guidance: "faded", libraryHits: [], liveBudget: 3, leadS: 15, minsLeft: 10, formatHistory: {} },
    ok: [["probe_why", "none"], ["contrast_misconception", "none"], ["contrast_misconception", "diagram"], ["practice", "none"]] },
  { id: "transfer-ready", st: { band: "B3", lang: "english", skill: "c6 ratio", beat: "practice", last: "because 2 for every 3", verdicts: "c,c,why-full", mis: null, K: 0.9, U: "high", T: "unknown", engagement: "engaged", guidance: "attempt", libraryHits: ["simulation"], liveBudget: 2, leadS: 60, minsLeft: 9, formatHistory: {} },
    ok: [["practice", "simulation"], ["practice", "none"], ["probe_why", "none"]] },
  { id: "gaming", st: { band: "B2", lang: "hinglish", skill: "c4 place value", beat: "practice", last: "3 ... 4 ... 5", verdicts: "w,w,c", gamingSuspect: true, mis: null, K: 0.4, U: "unknown", engagement: "engaged", guidance: "attempt", libraryHits: ["game"], liveBudget: 3, leadS: 40, minsLeft: 13, formatHistory: { game: "1/2" } },
    ok: [["probe_why", "none"], ["worked_example", "none"], ["step_down", "none"]] },
];

// ── the code policy (prototype of server/brain/policy.js beatPolicy) ──
const MIS_KIND = { quantity: "game", process: "animation", data: "chart", structure: "diagram" };
export function codePolicy(st) {
  const lead = st.leadS ?? 0;
  const canHave = (k) => st.libraryHits?.includes(k) || (st.liveBudget > 0 && lead >= 90);
  const pick = (k) => (k && canHave(k) ? k : "none");
  if (st.minsLeft <= 3) return { move: "recap", kind: "none" };
  if (st.engagement === "strained") return { move: "step_down", kind: "none" };
  if (st.gamingSuspect) return { move: "probe_why", kind: "none" };
  if (st.mis && st.mis.p >= 0.7) return { move: "contrast_misconception", kind: pick(MIS_KIND[st.mis.class]) };
  if (st.mis && st.mis.p >= 0.5) return { move: "probe_why", kind: "none" }; // verify before contrasting (fusion rule 2)
  if (/\?\s*$/.test(st.last ?? "") && st.beat === "explain") return { move: "explore_question", kind: pick("explorable") === "none" ? pick("diagram") : "explorable" };
  if (st.K >= 0.8 && (st.U === "unknown" || st.U === "low")) return { move: "probe_why", kind: "none" };
  if (st.K >= 0.8 && st.U === "high") return { move: "practice", kind: pick(st.libraryHits?.[0]) };
  if (st.guidance === "worked") {
    const k = st.libraryHits?.find((x) => ["animation", "chart", "game", "diagram"].includes(x)) ?? null;
    return { move: "worked_example", kind: pick(k) };
  }
  if (st.beat === "explain") return { move: "explain", kind: "none" };
  return { move: "practice", kind: pick(st.libraryHits?.[0]) };
}

const schema = { type: "object", additionalProperties: false, required: ["move", "kind", "representation", "priority"],
  properties: { move: { type: "string", enum: MOVES }, kind: { type: "string", enum: KINDS }, representation: { type: "string", enum: REPS_ },
    priority: { type: "string", enum: ["on_cue", "opportunistic", "none"] } } };
// System prompt = rules as notes (what a real proposer would get). No example decisions (recitation law).
const SYS = [
  "You decide the NEXT BEAT for an AI school tutor (classes 1-9, India). Input: the tutor brain's state as JSON. Output: the next teaching move, and whether to show an interactive piece built in the background.",
  "Notes: a suspected misconception at p >= 0.7 gets a contrast; at 0.5-0.7 verify it first with a why/probe. Strain means smaller steps or a break, never a new build. A correct streak with unknown understanding gets a why-probe. Low prior or new skill gets a worked example. Near the end (<= 3 min) recap.",
  "A built piece is possible only if its kind is in libraryHits, or liveBudget > 0 and leadS >= 90 (live builds need ~90 s). kind must suit the content: quantity -> game, process -> animation or simulation, data -> chart, structure -> diagram, curiosity -> explorable. Otherwise kind = none.",
  "Representation: concrete for young or low-prior, pictorial in between, symbolic for high prior.",
].join("\n");

async function llm(model, st) {
  const t = performance.now();
  const opts = { schema, schemaName: "beat", maxTokens: model === "taxila-fast" ? 1200 : 200, timeoutMs: 30_000 };
  if (model === "taxila-fast") opts.effort = "low";
  const r = await chat(model, [{ role: "system", content: SYS }, { role: "user", content: JSON.stringify(st) }], opts);
  return { ms: performance.now() - t, d: r.json, usage: r.usage };
}
const isOk = (sc, d) => sc.ok.some(([m, k]) => m === d.move && (k === "*" || k === d.kind));
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]); };

const out = { date: new Date().toISOString(), reps: REPS, labels: "single rater, written before run", code: {}, models: {} };
let codeOk = 0;
for (const sc of S) { const d = codePolicy(sc.st); const ok = isOk(sc, d); codeOk += ok; out.code[sc.id] = { ...d, ok }; }
out.codeScore = `${codeOk}/${S.length}`;
console.log("code policy", out.codeScore);
for (const model of MODELS) {
  const m = { lat: [], ok: 0, n: 0, err: 0, stable: 0, perScenario: {} };
  for (const sc of S) {
    const runs = [];
    for (let r = 0; r < REPS; r++) {
      try { const x = await llm(model, sc.st); m.lat.push(x.ms); m.n++; const ok = isOk(sc, x.d); m.ok += ok; runs.push({ ...x.d, ok }); }
      catch (e) { m.err++; runs.push({ err: String(e.message).slice(0, 100) }); }
    }
    const keys = runs.filter((x) => !x.err).map((x) => `${x.move}/${x.kind}`);
    if (keys.length === REPS && new Set(keys).size === 1) m.stable++;
    m.perScenario[sc.id] = runs;
  }
  out.models[model] = { admissible: `${m.ok}/${m.n}`, errors: m.err, stableScenarios: `${m.stable}/${S.length}`, p50: pct(m.lat, 0.5), p90: pct(m.lat, 0.9), perScenario: m.perScenario };
  console.log(model, JSON.stringify({ admissible: `${m.ok}/${m.n}`, err: m.err, stable: `${m.stable}/${S.length}`, p50: pct(m.lat, 0.5), p90: pct(m.lat, 0.9) }));
}
fs.mkdirSync(new URL("./results/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`./results/beat-policy-${out.date.slice(0, 10)}.json`, import.meta.url), JSON.stringify(out, null, 1));
