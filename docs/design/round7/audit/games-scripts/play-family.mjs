// Games audit: play every coverage entry's logic against its own kit, through the same path the server uses
// (coverage entry -> currentLevel -> logic.validate -> replay -> grade). No network, no database, no model.
//   node docs/design/round7/audit/games-scripts/play-family.mjs [familyOrFamily/mode ...] [--json out.json] [--trials N]
// Checks per level (fade 1..3, garam and teekha door, several seeds):
//   R  the solver's own acts are accepted: validate ok, goalMet, server grade "solved"
//   I  the goal is not already met at init, and a bare "done/run/check" claim at init does not win
//   W  each mal-rule's acts (a child holding that wrong belief) do NOT reach goalMet
//   P  a perturbed solution (one act's number/id changed) that STILL wins is listed for a human to judge
//   T  random tapping (acts drawn from the solution's own act shapes with random arguments) wins how often
import { writeFileSync } from "node:fs";
import { logicFor } from "../../../../../src/play/families/index.ts";
import { replayAll } from "../../../../../src/play/core/replay.ts";
import { mulberry32 } from "../../../../../src/play/core/rng.ts";
import { coverage, currentLevel, entryKey, seedOf } from "../../../../../server/play/levels.js";
import { gradeActs } from "../../../../../server/play/grade.js";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const jsonOut = opt("--json", null);
const TRIALS = Number(opt("--trials", 150));
const only = args;
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: 100 * (i + 1), via: "touch", act }));
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

function randomAct(rng, shapes, vocab, nums) {
  const base = shapes[Math.floor(rng() * shapes.length)];
  const act = { ...base };
  const hi = Math.max(12, Math.min(400, 2 * Math.max(0, ...nums.map(Math.abs))));
  for (const [k, v] of Object.entries(act)) {
    if (k === "kind") continue;
    if (isNum(v)) act[k] = rng() < 0.4 && nums.length ? nums[Math.floor(rng() * nums.length)] : Math.floor(rng() * (hi + 2)) - 1;   // a number from the level, or any whole number on the board
    else if (typeof v === "string") act[k] = vocab[Math.floor(rng() * vocab.length)];
    else if (typeof v === "boolean") act[k] = rng() < 0.5;
  }
  return act;
}
function perturb(act, rng) {
  const keys = Object.keys(act).filter((k) => k !== "kind" && (isNum(act[k]) || typeof act[k] === "boolean"));
  if (!keys.length) return null;
  const k = keys[Math.floor(rng() * keys.length)], out = { ...act };
  out[k] = typeof act[k] === "boolean" ? !act[k] : act[k] + (rng() < 0.5 ? 1 : -1) * (1 + Math.floor(rng() * 3));
  return out;
}

const cov = coverage();
const report = { entries: 0, levels: 0, byEntry: [], problems: [] };
const problem = (entry, code, detail, extra = {}) => report.problems.push({ entry: entryKey(entry), family: entry.family, code, detail, ...extra });

for (const entry of cov.entries) {
  const fm = `${entry.family}/${entry.mode}`;
  if (only.length && !only.some((o) => o === entry.family || o === fm)) continue;
  const logic = logicFor(entry.family, entry.mode);
  const key = entryKey(entry);
  report.entries++;
  if (!logic) { problem(entry, "NO_LOGIC", "coverage entry names a family/mode with no registered logic"); continue; }
  const row = { key, levels: 0, noLevel: 0, solveFail: 0, rejectRight: 0, winInit: 0, malWin: 0, perturbWin: 0, tapWins: 0, tapTrials: 0 };
  for (const fade of [1, 2, 3]) for (const door of ["garam", "teekha"]) for (let n = 0; n < 3; n++) {
    const s = { childId: "audit-child", key, skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null, mis: {}, secure: false, n, seed: seedOf("audit-child", key, n), door, recent: [], hist: null };
    let level;
    try { level = currentLevel(s, entry, "Asha"); } catch (e) { problem(entry, "LEVEL_THROWS", String(e.message).slice(0, 160), { fade, door, n }); continue; }
    if (!level) { row.noLevel++; continue; }
    row.levels++; report.levels++;
    const where = { fade, door, n, levelId: level.levelId, goal: level.goal };
    const v = logic.validate(level);
    if (!v) { problem(entry, "VALIDATE_REJECTS_SERVED", "the server's own level fails validate", where); continue; }
    const rng = mulberry32(seedOf("audit", key, fade * 10 + n));
    // R: right answer accepted
    let sol = null;
    try { sol = logic.solve(v); } catch (e) { problem(entry, "SOLVE_THROWS", String(e.message).slice(0, 160), where); }
    if (!sol) { row.solveFail++; problem(entry, "NO_SOLUTION", "solve() returned null on a served level", where); continue; }
    const g = gradeActs(level, env(sol), { final: true });
    const r = replayAll(logic, v, env(sol));
    if (!logic.goalMet(v, r.state)) { row.rejectRight++; problem(entry, "RIGHT_REJECTED", "solver acts do not reach goalMet", { ...where, acts: sol.length, refusals: r.refusals.slice(0, 3) }); continue; }
    if (g?.grade?.verdict !== "solved") { row.rejectRight++; problem(entry, "RIGHT_NOT_SOLVED", `goalMet but grade verdict is ${g?.grade?.verdict}`, where); }
    // I: nothing is won before anything is done
    const s0 = logic.init(v);
    if (logic.goalMet(v, s0)) { row.winInit++; problem(entry, "WON_AT_INIT", "goalMet true before any act", where); }
    for (const kind of ["done", "run", "check", "commit", "fire", "weigh"]) {
      let r0; try { r0 = logic.apply(v, s0, { kind }, 1); } catch { continue; }
      if (!r0.refused && logic.goalMet(v, r0.state)) { row.winInit++; problem(entry, "BARE_CLAIM_WINS", `a bare {kind:"${kind}"} at init wins`, where); }
    }
    // W: wrong belief does not win
    for (const mal of logic.malRules) {
      let ma = null; try { ma = logic.malActs(v, mal); } catch { /* none */ }
      if (!ma?.length) continue;
      const rm = replayAll(logic, v, env(ma));
      if (logic.goalMet(v, rm.state)) { row.malWin++; problem(entry, "MAL_RULE_WINS", `mal-rule ${mal} reaches the goal`, where); }
    }
    // P: perturbed solution
    const shapes = sol.filter((a) => a && a.kind && a.kind !== "undo");
    for (let i = 0; i < Math.min(sol.length, 12); i++) {
      const pa = perturb(sol[i], rng); if (!pa) continue;
      const acts = sol.slice(); acts[i] = pa;
      const rp = replayAll(logic, v, env(acts));
      if (logic.goalMet(v, rp.state) && !rp.refused) { row.perturbWin++; problem(entry, "PERTURBED_STILL_WINS", `act ${i} ${JSON.stringify(sol[i])} -> ${JSON.stringify(pa)} still reaches the goal with no refusal`, where); }
    }
    // T: random tapping
    const nums = [...new Set((JSON.stringify(v.params).match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number))].filter((x) => Math.abs(x) <= 400).slice(0, 60);
    const vocab = [...new Set(JSON.stringify(v.params).match(/"([A-Za-z0-9_\-:.]{1,16})"/g)?.map((x) => x.slice(1, -1)) ?? ["a"])].slice(0, 40);
    if (shapes.length) for (let t = 0; t < TRIALS; t++) {
      const len = 5 + Math.floor(rng() * Math.max(10, sol.length * 2));
      const acts = Array.from({ length: len }, () => randomAct(rng, shapes, vocab, nums));
      const rt = replayAll(logic, v, env(acts));
      row.tapTrials++;
      if (logic.goalMet(v, rt.state)) { row.tapWins++; const gr = logic.grade(v, env(acts)); const ev = (gr.evidence ?? []).map((e) => e.outcome).join("+") || "none"; row.tapVerdicts = row.tapVerdicts ?? {}; const vk = `${gr.verdict}/clean=${gr.clean}/ev=${ev}`; row.tapVerdicts[vk] = (row.tapVerdicts[vk] ?? 0) + 1; if (row.tapWins <= 1) problem(entry, "RANDOM_TAPPING_WINS", `random acts from the solution's own shapes reach the goal (${len} acts)`, { ...where, sample: acts.slice(0, 8) }); }
    }
  }
  report.byEntry.push(row);
}
const tot = report.byEntry.reduce((a, r) => ({ levels: a.levels + r.levels, tapWins: a.tapWins + r.tapWins, tapTrials: a.tapTrials + r.tapTrials }), { levels: 0, tapWins: 0, tapTrials: 0 });
const codes = {}; for (const p of report.problems) codes[p.code] = (codes[p.code] ?? 0) + 1;
console.log(`entries ${report.entries}  levels ${tot.levels}  random-tap wins ${tot.tapWins}/${tot.tapTrials}`);
console.log("problems by code:", JSON.stringify(codes));
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(report, null, 1));
for (const p of report.problems.slice(0, 60)) console.log(`  ${p.code} ${p.entry}  ${p.detail}`);
