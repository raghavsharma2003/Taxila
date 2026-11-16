// Gate 2 for galti-pakdo/kaapi (RULINGS-2026-11-16-gate2-answers.md, answer 2 under "a computed default for every family's
// picks": exact pickOptions family by family, and the habit battery over each family as it is added). The habit children
// run through sessions as the server serves them (tests/_habit-children.mjs), naming forced on inside the battery only.
// galti-pakdo is not in NAMING_OFF: what the battery proves is the naming the product does.
//
// The pick: the verdict (sab sahi, or the first line that breaks: one of n among a working of n lines) and the line the
// claim is weighed in first (any of the n). galtiLogic.pickOptions lists them exactly, so p is 1/n (neat-correct,
// right-answer) and (n - at)/n (check-later); k is the computed default (server/play/levels.js namingSpec).
//
// sudhaaro makes the same verdict before its fix. It was not a declared pick, so a mix-up there was named from one level:
// a blind verdict in 0.38 of sessions, the same slip every level ("the option below": on a neat working whose break is its
// last line, sab sahi) in 0.6-0.75. It is a chance pick now (galtiLogic.chancePicks), named on a repeat with the computed
// default as pakdo's. The negative control runs always: with the declaration taken away inside this file, the same children
// must show the failure.
//
// galti-pakdo's kind of working (sahi, lucky, neat) is the seed's first draw, so a session's kinds hang on the child id alone:
// the battery runs with `cellIds` (each cell meets its own children's ids), else the whole sweep would meet `seeds` kinds.
//
// Run time (this container, one core): gate sweep (every fade, pL and door sequence; two sessions a cell for every child, the
// random ones too, one for each constant over two pL) about 28 s; HABIT_FULL=1 (ten, thirty and four sessions a cell) about
// 5 min. HABIT_PRINT=<file> writes the table (BATTERY.md's).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { runBattery, batteryTable, overLine, holders, listedCells, worstNonHolder, rowOf, sweep, memoAgrees, childrenFor, LINE, DOOR_SEQS, FADES, PLS } from "./_habit-children.mjs";
import { coverage, blindChance, defaultK } from "../server/play/levels.js";
import { NAMING_OFF, namingOn } from "../shared/play.ts";
import { galtiLogic, workingOf } from "../src/play/families/galti-pakdo/galti.logic.ts";

const S = sweep();
const OPTS = { ...S, cellIds: true, ...(S.full ? {} : { randomSeeds: 2 }) };
const GOALS = ["pakdo", "sudhaaro"];
const KITS = coverage().entries.find((e) => e.family === "galti-pakdo" && e.goal === "pakdo").misMap;
let RES = null, OLD = null, over = [];
/** the rules from before this battery for sudhaaro (not a declared pick), inside one synchronous run, put back after */
async function withoutSudhaaroPick(fn) {
  const was = galtiLogic.chancePicks;
  delete galtiLogic.chancePicks;
  try { return await fn(); } finally { galtiLogic.chancePicks = was; }
}
const OLD_KIDS = new Set(["blind", "slip:the option below"]);
before(async () => {
  RES = await runBattery("galti-pakdo/kaapi", OPTS);
  OLD = await withoutSudhaaroPick(() => runBattery("galti-pakdo/kaapi", { ...OPTS, goals: ["sudhaaro"], only: (c) => OLD_KIDS.has(c.id) }));
  over = overLine(RES);
  if (process.env.HABIT_PRINT) writeFileSync(process.env.HABIT_PRINT, `${batteryTable(RES)}\n\nsweep: ${JSON.stringify(OPTS)}; ${RES.ms} ms\n`);
});

test("the battery: every child at every fade, pL and door sequence, through the served path; galti-pakdo names (not in NAMING_OFF)", () => {
  assert.ok(!NAMING_OFF.has("galti-pakdo/kaapi") && namingOn("galti-pakdo", "kaapi"));
  assert.deepEqual(galtiLogic.chancePicks, ["sudhaaro"]);
  const pls = OPTS.pls ?? PLS;
  for (const goal of GOALS) {
    const G = RES.goals[goal];
    assert.ok(G.rows.length >= 25, `${goal}: ${G.rows.length} children`);
    for (const r of G.rows) {
      const per = r.random ? OPTS.randomSeeds : r.constant ? OPTS.constSeeds : OPTS.seeds, n = r.constant && OPTS.constPls ? OPTS.constPls.length : pls.length;
      assert.equal(r.sessions, FADES.length * n * DOOR_SEQS.length * per, `${goal} ${r.label}`);
    }
    // every value she could give: sab, each line flagged (1-3), each line weighed first (0-3), the question weighed then sab
    assert.equal(G.rows.filter((r) => r.constant).length, 9);
  }
  // the ruling's children are all there
  const ids = new Set(childrenFor("galti-pakdo/kaapi", "pakdo").map((c) => c.id));
  for (const id of ["blind", "slip-random", "slip:the option above", "slip:the option below", "last-first", "last-key", "opt-first", "opt-last-line", "opt-middle", "const:sab"]) assert.ok(ids.has(id), id);
});

test("the generator memo changes nothing (the same served sessions with and without it)", () => {
  for (const goal of GOALS) { const m = memoAgrees("galti-pakdo/kaapi", goal); assert.ok(m.same, goal); assert.ok(m.sessions >= 50); }
});

test("pickOptions: p is one in the working's lines (n - at of them for check-later), and k follows", () => {
  const L = galtiLogic, e = coverage().entries.find((x) => x.family === "galti-pakdo" && x.goal === "pakdo");
  let seen = 0;
  for (let seed = 1; seed < 40; seed++) for (const fade of [1, 2, 3]) for (const c of L.generate({ family: "galti-pakdo", mode: "kaapi", goal: "pakdo", topicId: e.topicId, skillId: e.skillId, classLevel: 7, fade, mis: {}, misMap: e.misMap, grammar: e.grammar, recent: [], seed })) {
    const v = L.validate(c.level), p = v.params, n = workingOf(p).lines.length;
    for (const [rule, kit] of Object.entries(v.mal)) {
      const b = blindChance(v, kit), on = (rule === "right-answer" ? p.kind === "lucky" : p.kind === "neat");
      if (!on) { assert.equal(L.pickOptions(v, rule), null, `${rule} on a ${p.kind} working`); continue; }
      const want = rule === "check-later" ? (n - p.at) / n : 1 / n;
      assert.equal(b ? b.p : null, want < 1 ? want : null, `${rule} ${p.form} at ${p.at}`);
      if (b) assert.equal(b.options, n);
      assert.ok(Number.isFinite(defaultK(v, kit)) || want > 0.56, `${rule}: k ${defaultK(v, kit)} at p ${want}`);
      seen++;
    }
  }
  assert.ok(seen > 200, `${seen}`);
});

test("children who hold a mix-up: listed with why, and how often each is named (fewer than half is reported, not failed)", (t) => {
  const H = holders(RES);
  for (const h of H) t.diagnostic(`${h.goal} · ${h.label} (${h.rule}): named ${h.all.toFixed(3)} (${h.half}); holds it because ${h.why}`);
  for (const goal of GOALS) for (const id of ["holder-neat", "holder-right", "holder-later", "holder-later-friend", "holder-later-any", "const:sab", "const:weigh0-sab", "const:weigh1", "const:weigh2", "const:weigh3"]) assert.ok(H.some((h) => h.goal === goal && h.child === id), `${goal} ${id}`);
  // the positive control: the battery sees naming at all (the default asks three or four sightings in four levels, and a
  // working is neat, lucky or right a third of the time each, so a holder is named rarely: reported, as the ruling expected)
  assert.ok(GOALS.some((g) => rowOf(RES, g, "holder-right").all[KITS["right-answer"]] > 0), "right-answer is named in some session");
});

test("negative control: sudhaaro named from one pick (before it was declared one), the blind verdict and the same slip are over the line", () => {
  for (const id of OLD_KIDS) {
    const r = rowOf(OLD, "sudhaaro", id), w = Math.max(...Object.values(KITS).map((k) => r.worstFade[k].share));
    assert.ok(w >= LINE, `${id}: worst fade ${w}`);
    const now = rowOf(RES, "sudhaaro", id);
    assert.ok(Object.values(KITS).every((k) => now.worstFade[k].share < LINE && now.worstDoor[k].share < LINE), `${id} under the line now`);
  }
});

for (const goal of GOALS) test(`${goal}: every child who does not hold the mix-up is named in fewer than 1 session in 10 (worst fade; worst door sequence)`, (t) => {
  const o = over.filter((x) => x.goal === goal);
  const w = worstNonHolder(RES, goal);
  t.diagnostic(`${goal}: worst non-holder by fade ${w.fade.share.toFixed(3)} (${w.fade.label}, ${w.fade.rule}, fade ${w.fade.at}); by door sequence ${w.door.share.toFixed(3)} (${w.door.label}, ${w.door.rule}, ${w.door.at})`);
  for (const x of listedCells(RES).filter((y) => y.goal === goal)) t.diagnostic(`listed: ${x.label} (${x.rule}): worst cell ${x.worstCell.share.toFixed(3)} at ${x.worstCell.at}; ${x.served.toFixed(3)} of her sessions`);
  assert.deepEqual(o, [], o.map((x) => `${x.label} (${x.rule}): ${x.share.toFixed(3)} at ${x.fade}`).join("\n"));
});
