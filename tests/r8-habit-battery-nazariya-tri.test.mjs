// Gate 2 for nazariya/tri (RULINGS-2026-11-16-gate2-answers.md, answer 2 under "a computed default for every family's
// picks": exact pickOptions family by family, and the habit battery over each family as it is added). The habit children
// run through sessions as the server serves them (tests/_habit-children.mjs), naming forced on inside the battery only.
// nazariya/tri is not in NAMING_OFF: what the battery proves is the naming the product does.
//
// The pick: more's corner, any grid point above the base, (w + 1) × zb of them (triLogic.pickOptions); shape-looks shows
// on the w points of A's top line other than A's corner, so p is w / ((w + 1) zb), 0.10 to 0.31 (it was read as 1 in 2),
// and the computed default asks 2 or 3 sightings (it asked 4).
//
// With the exact k the battery found what the old k had hidden only partly: the careful child's point (one row above A's
// top line, over the base's middle) has three neighbours ON A's top line, so one random slip a level was named in 0.32 of
// sessions and the same slip every level in 0.9-1.0 (the old k: 0.6-1.0). Two rules, both the gate-2 modes' tools:
// - H1 (triLogic.sightingOf): the point she put the corner on is the sighting's value; the same point twice is one act
//   (a constant point every level; what I did last time).
// - H3's shape (tri.logic.ts confirmMore): a sighting counts only when her next corner after the play-out (the cloths come
//   out the same) is again on A's top line off A's corner. A slip is corrected, a belief is not. Nothing she sees changes.
// The negative control runs always: the same children under the rules from before (the battery's `legacy`: HABIT_RULES off)
// must still show the slips named.
//
// Run time (this container, one core): gate sweep about 15 s; HABIT_FULL=1 about 2 min. HABIT_PRINT=<file> writes the table.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { runBattery, batteryTable, overLine, holders, listedCells, worstNonHolder, rowOf, sweep, memoAgrees, childrenFor, LINE, DOOR_SEQS, FADES, PLS } from "./_habit-children.mjs";
import { coverage, blindChance, defaultK, defaultSightings } from "../server/play/levels.js";
import { NAMING_OFF, namingOn } from "../shared/play.ts";
import { triLogic, area2 } from "../src/play/families/nazariya/tri.logic.ts";

const S = sweep();
const OPTS = { ...S, cellIds: true };
const E = coverage().entries.find((e) => e.family === "nazariya" && e.mode === "tri" && e.goal === "more");
const KIT = E.misMap["shape-looks"];
let RES = null, OLD = null, over = [];
const OLD_KIDS = new Set(["slip-random", "slip:down", "slip:down-left", "slip:down-right", "const:6,3", "last-first"]);
before(async () => {
  RES = await runBattery("nazariya/tri", OPTS);
  OLD = await runBattery("nazariya/tri", { ...OPTS, legacy: true, only: (c) => OLD_KIDS.has(c.id) });
  over = overLine(RES);
  if (process.env.HABIT_PRINT) writeFileSync(process.env.HABIT_PRINT, `${batteryTable(RES)}\n\nsweep: ${JSON.stringify(OPTS)}; ${RES.ms} ms\n`);
});

test("the battery: every child at every fade, pL and door sequence, through the served path; nazariya/tri names (not in NAMING_OFF)", () => {
  assert.ok(!NAMING_OFF.has("nazariya/tri") && namingOn("nazariya", "tri"));
  const G = RES.goals.more;
  for (const r of G.rows) {
    const per = r.random ? OPTS.randomSeeds : r.constant ? OPTS.constSeeds : OPTS.seeds, n = r.constant && OPTS.constPls ? OPTS.constPls.length : PLS.length;
    assert.equal(r.sessions, FADES.length * n * DOOR_SEQS.length * per, r.label);
  }
  // every point she could put the corner on (13 × 9), the eight slips, both ways
  assert.equal(G.rows.filter((r) => r.constant).length, 117);
  const ids = new Set(childrenFor("nazariya/tri", "more").map((c) => c.id));
  for (const id of ["blind", "slip-random", "slip:down", "last-first", "last-key", "opt-first", "opt-last", "opt-middle"]) assert.ok(ids.has(id), id);
});

test("the generator memo changes nothing (the same served sessions with and without it)", () => {
  const m = memoAgrees("nazariya/tri", "more"); assert.ok(m.same); assert.ok(m.sessions >= 50);
});

test("pickOptions: every point above the base; p = w / ((w + 1) zb) and k follows", () => {
  let seen = 0;
  for (const seed of [1, 2, 3, 5, 8, 13]) for (const fade of [1, 2, 3]) for (const c of triLogic.generate({ family: "nazariya", mode: "tri", goal: "more", topicId: E.topicId, skillId: E.skillId, classLevel: 6, fade, mis: {}, misMap: E.misMap, grammar: E.grammar, recent: [], seed })) {
    const v = triLogic.validate(c.level), p = v.params, t = p.tri, b = blindChance(v, KIT), want = p.w / ((p.w + 1) * t.zb);
    assert.ok(area2(t) > 0);
    assert.equal(b.options, (p.w + 1) * t.zb);
    assert.ok(Math.abs(b.p - want) < 1e-12, `p ${b.p} for ${JSON.stringify(t)}`);
    assert.equal(defaultK(v, KIT), defaultSightings(want));
    assert.ok([2, 3].includes(defaultK(v, KIT)));
    seen++;
  }
  assert.ok(seen > 500, `${seen}`);
});

test("children who hold the mix-up: listed with why, and how often each is named", (t) => {
  const H = holders(RES);
  for (const h of H) t.diagnostic(`${h.label}: named ${h.all.toFixed(3)} (${h.half}); holds it because ${h.why}`);
  assert.deepEqual(H.map((h) => h.child).sort(), ["holder-far", "holder-mid", "holder-slide"]);
  for (const h of H) assert.ok(h.all >= 0.9, `${h.label}: ${h.all}`);
});

test("negative control: under the rules from before H1 and the confirmation, the slips and the constant point are named", () => {
  assert.ok(rowOf(OLD, "more", "slip-random").worstFade[KIT].share >= LINE);
  for (const id of ["slip:down", "slip:down-left", "slip:down-right"]) assert.ok(rowOf(OLD, "more", id).worstFade[KIT].share >= 0.5, id);
  // and under the rules now, each is under the line
  for (const id of OLD_KIDS) assert.ok(rowOf(RES, "more", id).worstFade[KIT].share < LINE && rowOf(RES, "more", id).worstDoor[KIT].share < LINE, id);
});

test("more: every child who does not hold the mix-up is named in fewer than 1 session in 10 (worst fade; worst door sequence)", (t) => {
  const w = worstNonHolder(RES, "more");
  t.diagnostic(`worst non-holder by fade ${w.fade.share.toFixed(3)} (${w.fade.label}, fade ${w.fade.at}); by door sequence ${w.door.share.toFixed(3)} (${w.door.label}, ${w.door.at})`);
  for (const x of listedCells(RES)) t.diagnostic(`listed: ${x.label}: worst cell ${x.worstCell.share.toFixed(3)} at ${x.worstCell.at}; ${x.served.toFixed(3)} of her sessions`);
  assert.deepEqual(over, [], over.map((x) => `${x.label}: ${x.share.toFixed(3)} at ${x.fade}`).join("\n"));
});
