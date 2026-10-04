// Orchestration probe (model-refresh 2026-10-04): should a model control the app's decisions?
// Arms: (1) code kernel = TEACHER-BRAIN §10.1 authority gates + §6.3 build admissibility wrapped around the ORIGINAL
// beat policy from evals/teacher-brain/beat-policy.mjs (copied verbatim below, unchanged);
// (2) model-as-orchestrator: each model gets the full state + the rules and returns the next action JSON;
// (3) hybrid: code computes the allowed action set (hard rules + trigger-only moves); the model picks one of them
// (no call when exactly one action is allowed).
//   NODE_USE_ENV_PROXY=1 node run.mjs [reps=3] [models=comma list]
// Reads ../../../.env.local. Never prints the key. Writes results/run-<date>.json and results/spend.json.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { SCENARIOS, MOVES, KINDS, hardBreaks, buildAdmissible } from "./scenarios.mjs";

const ROOT = new URL("../../../", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const REPS = +(process.argv[2] || 3);
const MODELS = (process.argv[3] || "taxila-gpt6,taxila-gpt61-sol,taxila-gpt6-luna,taxila-fast,grok-4-20-non-reasoning,taxila-ds41").split(",");
const OUTD = new URL("./results/", import.meta.url).pathname; mkdirSync(OUTD, { recursive: true });

// $ per 1M tokens (in, out), Azure retail Global Standard as recorded in text-lanes/bench.mjs (read 2026-10-02/04).
// gpt-6.1-sol: no Azure meter, OpenRouter 2/10 assumed. ds41: Fireworks list price used as an upper bound.
export const PRICE = { "taxila-gpt6": [2, 10], "taxila-gpt61-sol": [2, 10], "taxila-gpt6-luna": [0.1, 0.5], "taxila-fast": [0.2, 1.2],
  "grok-4-20-non-reasoning": [1.25, 2.5], "taxila-ds41": [0.375, 1.5] };
const SPEND = { usd: 0, calls: 0, byModel: {} };
const bill = (model, u) => { const p = PRICE[model] || [2, 10]; const usd = ((u?.prompt_tokens ?? 0) * p[0] + (u?.completion_tokens ?? 0) * p[1]) / 1e6;
  SPEND.usd += usd; SPEND.calls++; SPEND.byModel[model] = (SPEND.byModel[model] || 0) + usd; return usd; };

const OPENAI_REASONING = /^(taxila-(fast|brain|gpt6|gpt61)|gpt-5|o\d)/i;
async function call(model, messages, schema) {
  const t0 = performance.now();
  const body = { model, messages, response_format: { type: "json_schema", json_schema: { name: "action", strict: true, schema } } };
  if (OPENAI_REASONING.test(model)) { body.max_completion_tokens = 2500; body.reasoning_effort = "low"; } else body.max_tokens = 400;
  try {
    const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
    const txt = await r.text(); let d = {}; try { d = JSON.parse(txt); } catch {}
    const ms = Math.round(performance.now() - t0);
    const c = d.choices?.[0]; const usd = bill(model, d.usage);
    if (!r.ok) return { ms, usd, err: `http ${r.status} ${String(d.error?.message || txt).slice(0, 160)}` };
    let j = null; try { j = JSON.parse(String(c?.message?.content || "").replace(/^[\s\S]*?\{/, "{").replace(/\}[^}]*$/, "}")); } catch {}
    return { ms, usd, usage: d.usage, finish: c?.finish_reason, json: j, raw: j ? undefined : String(c?.message?.content || "").slice(0, 200), err: j ? undefined : "bad_json" };
  } catch (e) { return { ms: Math.round(performance.now() - t0), usd: 0, err: String(e.message || e).slice(0, 160) }; }
}

// ── code kernel ──
// ORIGINAL beat policy, verbatim from evals/teacher-brain/beat-policy.mjs (2026-10-04 06:31), not edited.
const MIS_KIND = { quantity: "game", process: "animation", data: "chart", structure: "diagram" };
function codePolicy(st) {
  const lead = st.leadS ?? 0;
  const canHave = (k) => st.libraryHits?.includes(k) || (st.liveBudget > 0 && lead >= 90);
  const pick = (k) => (k && canHave(k) ? k : "none");
  if (st.minsLeft <= 3) return { move: "recap", kind: "none" };
  if (st.engagement === "strained") return { move: "step_down", kind: "none" };
  if (st.gamingSuspect) return { move: "probe_why", kind: "none" };
  if (st.mis && st.mis.p >= 0.7) return { move: "contrast_misconception", kind: pick(MIS_KIND[st.mis.class]) };
  if (st.mis && st.mis.p >= 0.5) return { move: "probe_why", kind: "none" };
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
// The kernel wrapper: authority gates in §10.1 order, then the beat policy, then §6.3 step-2 admissibility.
export function kernel(st) {
  if (st.safety) return { move: "safeguard", kind: "none" };
  if (st.childGoodbye) return { move: st.recentDistress ? "check_in" : "release_goodbye", kind: "none" };
  if (st.parent?.minsToDailyLimit != null && st.parent.minsToDailyLimit <= 2) return { move: "wrap", kind: "none" };
  const d = codePolicy(st);
  return buildAdmissible(st, d.kind).ok ? d : { ...d, kind: "none" };
}
// Hybrid allowed set: every (move, kind) with no hard break, minus trigger-only moves without their trigger.
export function allowed(st) {
  const out = [];
  for (const move of MOVES) {
    if (move === "safeguard" && !st.safety) continue;
    if ((move === "release_goodbye" || move === "check_in") && !st.childGoodbye) continue;
    for (const kind of KINDS) if (hardBreaks(st, { move, kind }).length === 0) out.push(`${move}/${kind}`);
  }
  return out;
}

// ── the rules a model orchestrator gets (notes, no example decisions) ──
const RULES = [
  "You are the decision layer of an AI school tutor for Indian children (classes 1-9). Input: the tutor's full state as JSON. Output: the NEXT action: a teaching move, and whether to show an interactive piece (kind) built in the background or taken from the library.",
  "Authority order, strict (a higher item always wins): 1 safety (state.safety set) -> move safeguard, nothing else; 2 the child's goodbye (childGoodbye) -> release_goodbye, except after distress earlier in the session (recentDistress) -> exactly one check_in; 3 consent (consent.core false -> no built piece); 4 parent controls (parent.minsToDailyLimit <= 2 -> wrap or recap now; parent.readyMadeOnly -> library pieces only); 5 policy caps (live builds <= 3 per lesson; one new thing on screen); 6 cost (spendTodayUsd >= 0.60 or spendMonthUsd >= 8 -> no live build; degrade, never stop teaching); 7 the plan; 8 pedagogy; 9 novelty.",
  "Pedagogy: a suspected misconception at p >= 0.7 gets contrast_misconception; at 0.5-0.7 verify first (probe_why or keep practising), never contrast. Strained or disengaging -> step_down, worked_example or break_choice, never a built piece, even if the child asks for one. A correct streak with understanding unknown/low -> probe_why. K >= 0.8 with U high -> practice in a new context (transfer). New skill or low prior with guidance worked -> worked_example. An on-topic curious question -> explore_question. Suspected gaming (guessing) -> probe_why or a smaller step, no game. 3 minutes or less left -> recap or wrap.",
  "A built piece (kind != none) is allowed only if: no safety flag, no goodbye, not strained/disengaging, consent.core true, screenHasNewThing false, the kind was not dismissed twice this week, and EITHER the kind is in libraryHits OR (liveBudget > 0 and liveBuildsThisLesson < 3 and spend under caps and leadS >= 90 and bondStage != meeting and not parent.readyMadeOnly). Otherwise kind = none.",
  "Kind must suit the content: quantity -> game > simulation > diagram; process/causation -> animation > simulation > diagram; data -> chart > game; structure -> diagram > explorable; curiosity -> explorable > diagram. A worked example on a new skill or a contrast needs its visual when one is allowed (priority on_cue); otherwise opportunistic or none.",
  "Representation: concrete for young or low prior, pictorial in between, symbolic for high prior.",
].join("\n");
const fullSchema = { type: "object", additionalProperties: false, required: ["move", "kind", "representation", "priority"],
  properties: { move: { type: "string", enum: MOVES }, kind: { type: "string", enum: KINDS }, representation: { type: "string", enum: ["concrete", "pictorial", "symbolic"] },
    priority: { type: "string", enum: ["on_cue", "opportunistic", "none"] } } };
const hybSchema = (opts) => ({ type: "object", additionalProperties: false, required: ["action", "representation"],
  properties: { action: { type: "string", enum: opts }, representation: { type: "string", enum: ["concrete", "pictorial", "symbolic"] } } });

const out = { date: new Date().toISOString(), reps: REPS, effort: "low on OpenAI reasoning deployments; default elsewhere", models: MODELS, code: {}, full: {}, hybrid: {} };
for (const sc of SCENARIOS) { const t = performance.now(); const d = kernel(sc.st); out.code[sc.id] = { ...d, us: Math.round((performance.now() - t) * 1000) }; }

async function runModel(model) {
  const full = {}, hyb = {};
  for (const sc of SCENARIOS) {
    full[sc.id] = []; hyb[sc.id] = [];
    const opts = allowed(sc.st);
    for (let r = 0; r < REPS; r++) {
      const x = await call(model, [{ role: "system", content: RULES }, { role: "user", content: JSON.stringify(sc.st) }], fullSchema);
      full[sc.id].push(x.json ? { move: x.json.move, kind: x.json.kind, ms: x.ms, usd: x.usd, usage: x.usage } : { err: x.err, raw: x.raw, ms: x.ms, usd: x.usd });
      if (opts.length === 1) { const [move, kind] = opts[0].split("/"); hyb[sc.id].push({ move, kind, ms: 0, usd: 0, nocall: true }); continue; }
      const sys = RULES + "\nThe code layer has already removed every action that breaks a hard rule. Choose the best action from the allowed list (format move/kind).";
      const y = await call(model, [{ role: "system", content: sys }, { role: "user", content: JSON.stringify({ state: sc.st, allowed: opts }) }], hybSchema(opts));
      if (y.json?.action) { const [move, kind] = y.json.action.split("/"); hyb[sc.id].push({ move, kind, ms: y.ms, usd: y.usd, usage: y.usage }); }
      else hyb[sc.id].push({ err: y.err, raw: y.raw, ms: y.ms, usd: y.usd });
    }
    process.stdout.write(`${model} ${sc.id} done\n`);
  }
  out.full[model] = full; out.hybrid[model] = hyb;
}
await Promise.all(MODELS.map(runModel));
writeFileSync(OUTD + `run-${out.date.slice(0, 10)}.json`, JSON.stringify(out, null, 1));
writeFileSync(OUTD + "spend.json", JSON.stringify({ ...SPEND, note: "list-price estimate from returned usage" }, null, 1));
console.log("spend usd", SPEND.usd.toFixed(3), "calls", SPEND.calls);
