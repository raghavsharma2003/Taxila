// Gate 2, H2 for kon/name (RULINGS-2026-11-16-gate2.md, dc-r8-gate2-habit-children): the habit children run through
// sessions as the server serves them (tests/_habit-children.mjs), naming forced on inside the battery only (NAMING_OFF in
// shared/play.ts is unchanged: nothing a child sees or the lesson receives changes).
//
// H3 (dc-r8-gate2-habit-children) is built: in say an order error is a sighting only when it is confirmed on the same level,
// her name after the play-out being again a name with the vertex at an end (kon.logic.ts confirmSay). A slip is corrected
// once she has seen which angle her name means (the battery's children then do the solve); a belief is not (the holders
// name it their way again; the blind guessers guess again: `again` in the battery). Every non-holder child is asserted
// under 1 in 10 at every fade, in both goals.
//
// The negative control runs always: the same children under the rules from before H3 (the battery's `legacy`) must still
// show the judge's failure: in say, the same order slip on every level (two taps swapped; a tap missed and its letter added
// last) gives the mix-up's name on every level, and "the levels differ" does nothing against a habit that does not depend
// on the level; reading the three letters across the screen does the same on every say level served.
//
// Run time (this container, one core): gate sweep about 20 s; HABIT_FULL=1 about 80 s. HABIT_PRINT=<file> writes the table.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { runBattery, batteryTable, overLine, holders, rowOf, sweep, memoAgrees, LINE, DOOR_SEQS, FADES, PLS } from "./_habit-children.mjs";
import { coverage } from "../server/play/levels.js";
import { NAMING_OFF } from "../shared/play.ts";

const S = sweep();
const KIT = coverage().entries.find((e) => e.family === "kon" && e.mode === "name" && e.goal === "say").misMap["vertex-name"];
let RES = null, OLD = null, over = [];
// the negative control's children, run under the rules from before H3
const OLD_KIDS = new Set(["slip:swap 1-2", "slip:swap 2-3", "slip:miss 1, added last", "slip:miss 2, added last", "blind", ...Array.from({ length: 8 }, (_, k) => `read:${k}`)]);
before(async () => {
  RES = await runBattery("kon/name", S);
  OLD = await runBattery("kon/name", { ...S, legacy: true, only: (c) => OLD_KIDS.has(c.id) });
  over = overLine(RES);
  if (process.env.HABIT_PRINT) writeFileSync(process.env.HABIT_PRINT, `${batteryTable(RES)}\n\nsweep: ${JSON.stringify(S)}; ${RES.ms} ms\n`);
});

test("the battery: every child at every fade, pL and door sequence, through the served path; naming stays off for the product", () => {
  assert.ok(NAMING_OFF.has("kon/name"), "the product's switch is untouched");
  for (const goal of ["say", "find"]) {
    const G = RES.goals[goal];
    for (const r of G.rows) {
      const per = r.random ? S.randomSeeds : r.constant ? S.constSeeds : S.seeds, pls = r.constant && S.constPls ? S.constPls.length : PLS.length;
      assert.equal(r.sessions, FADES.length * pls * DOOR_SEQS.length * per, `${goal} ${r.label}`);
    }
  }
  // every three taps she could make (four points), every arc she could press; the eight reading directions
  assert.equal(RES.goals.say.rows.filter((r) => r.constant).length, 64);
  assert.equal(RES.goals.find.rows.filter((r) => r.constant).length, 5);
  assert.equal(RES.goals.say.rows.filter((r) => r.child.startsWith("read:")).length, 8);
});

test("the generator memo changes nothing (the same served sessions with and without it)", () => {
  for (const goal of ["say", "find"]) { const m = memoAgrees("kon/name", goal); assert.ok(m.same, goal); assert.ok(m.sessions >= 50); }
});

test("children who hold the mix-up: listed with why, and how often each is named (fewer than half is reported, not failed)", (t) => {
  const H = holders(RES);
  for (const h of H) t.diagnostic(`${h.goal} · ${h.label}: named ${h.all.toFixed(3)} (${h.half}); holds it because ${h.why}`);
  assert.deepEqual(H.map((h) => `${h.goal}:${h.child}`).sort(), ["find:first-letter", "find:last-letter", "say:v-any", "say:v-first", "say:v-last"]);
  // the positive control
  assert.ok(rowOf(RES, "say", "v-first").all[KIT] >= 0.9);
  assert.ok(rowOf(RES, "find", "first-letter").all[KIT] > 0);
});

test("negative control: under the rules from before H3 the judge's failure shows (say: the same swap, the missed tap added last, reading across)", () => {
  const kids = ["slip:swap 1-2", "slip:swap 2-3", "slip:miss 1, added last", "slip:miss 2, added last", ...Array.from({ length: 8 }, (_, k) => `read:${k}`)];
  for (const c of kids) {
    const r = rowOf(OLD, "say", c);
    assert.ok(r.all[KIT] >= 0.9, `${c}: named in ${r.all[KIT]} of her sessions (old rules)`);
    // under H3 the same child is under the line
    assert.ok(rowOf(RES, "say", c).worstFade[KIT].share < LINE, `${c} under H3`);
  }
  // and the children the tables model are under the line, old rules and new
  for (const R of [OLD, RES]) for (const g of ["say", "find"]) assert.ok(rowOf(R, g, "blind").worstFade[KIT].share < LINE, `${g} blind`);
});

test("say: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", () => {
  const o = over.filter((x) => x.goal === "say");
  assert.deepEqual(o, [], o.map((x) => `${x.label}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
});

test("find: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", () => {
  const o = over.filter((x) => x.goal === "find");
  assert.deepEqual(o, [], o.map((x) => `${x.label}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
});
