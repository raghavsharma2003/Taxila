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
import { runBattery, runSession, withGenMemo, childrenFor, batteryTable, overLine, holders, listedCells, worstNonHolder, rowOf, sweep, memoAgrees, LINE, DOOR_SEQS, FADES, PLS } from "./_habit-children.mjs";
import { coverage } from "../server/play/levels.js";
import { NAMING_OFF } from "../shared/play.ts";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import { readsAcrossAll } from "../src/play/families/kon/kon.name.ts";

const S = sweep();
const KIT = coverage().entries.find((e) => e.family === "kon" && e.mode === "name" && e.goal === "say").misMap["vertex-name"];
// (discriminating say levels, as a session steered to one is served them: dc-r8-gate2-discriminating-level, answer 2)
const SAY = coverage().entries.find((e) => e.family === "kon" && e.mode === "name" && e.goal === "say");
const LEVELS_D = [1, 2, 3].flatMap((fade) => [1, 7, 42, 99].flatMap((seed) => konLogic.generate({ family: "kon", mode: "name", goal: "say", topicId: SAY.topicId, skillId: SAY.skillId, classLevel: 6, fade, mis: {}, misMap: SAY.misMap, grammar: SAY.grammar, recent: ["name:say:0:50:50:0:0"], seed, focus: KIT }).map((c) => konLogic.validate(c.level)).filter((l) => l && readsAcrossAll(l.params))));
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

test("answer 3 (dc-r8-gate2-discriminating-level): the worst door sequence pooled over fades is asserted with the worst fade (overLine); a child with no randomness is reported by her worst cell, and a cell named half her sessions or more is listed with how much of the sweep it is", (t) => {
  for (const goal of Object.keys(RES.goals)) {
    const w = worstNonHolder(RES, goal);
    t.diagnostic(`${goal}: worst non-holder by fade ${w.fade.share.toFixed(3)} (${w.fade.label}, ${w.fade.rule}, fade ${w.fade.at}); by door sequence ${w.door.share.toFixed(3)} (${w.door.label}, ${w.door.rule}, ${w.door.at})`);
    assert.ok(w.fade.share < LINE && w.door.share < LINE, goal);
  }
  for (const x of listedCells(RES)) t.diagnostic(`listed: ${x.goal} · ${x.label} (${x.rule}): worst cell ${x.worstCell.share.toFixed(3)} at ${x.worstCell.at}; cells ${x.cells.join("; ")}; ${x.served.toFixed(3)} of her sessions`);
  assert.ok(over.every((x) => x.by === "fade" || x.by === "doors"));
});

test("answer 2 (dc-r8-gate2-discriminating-level): after a first sighting of vertex-name the next say level is a discriminating level (every reading across gives the right name), the readers across solve it, and the holders are named on it", () => {
  const entry = coverage().entries.find((e) => e.family === "kon" && e.mode === "name" && e.goal === "say");
  let steps = 0, disc = 0, readSolved = 0, readDisc = 0;
  withGenMemo(() => {
    for (const cid of ["v-first", "v-last"]) {
      const child = childrenFor("kon/name", "say").find((c) => c.id === cid);
      for (const fade of FADES) for (const pL of PLS) for (const doors of DOOR_SEQS) for (let k = 0; k < S.seeds; k++) {
        const { trace } = runSession({ entry, cell: { goal: "say", fade, pL, doors }, child, sIdx: k });
        const i = trace.findIndex((x) => x.pick === KIT);
        if (i < 0 || i >= trace.length - 1) continue;
        steps++;
        if (readsAcrossAll(trace[i + 1].params)) disc++;
      }
    }
    // a reader across on a discriminating level gives the right name
    for (const lv of LEVELS_D) for (let k = 0; k < 8; k++) {
      const child = childrenFor("kon/name", "say").find((c) => c.id === `read:${k}`);
      readDisc++;
      if (konLogic.grade(lv, child.acts.say(lv, { rng: () => 0.5, prev: null, i: 0, mem: {} }).map((act, j) => ({ seq: j + 1, t: j, via: "touch", act })), { final: true }).verdict === "solved") readSolved++;
    }
  });
  assert.ok(steps >= 100 && disc / steps >= 0.9, `steered to a discriminating level ${disc} of ${steps}`);
  assert.ok(readDisc >= 40 && readSolved === readDisc, `readers across solve the discriminating levels: ${readSolved} of ${readDisc}`);
  for (let k = 0; k < 8; k++) assert.equal(rowOf(RES, "say", `read:${k}`).all[KIT], 0, `read:${k}`);
});
