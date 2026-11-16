// Gate 2, H2 for stambh/tally (RULINGS-2026-11-16-gate2.md, dc-r8-gate2-habit-children): the habit children run through
// sessions as the server serves them (tests/_habit-children.mjs), naming forced on inside the battery only (NAMING_OFF in
// shared/play.ts is unchanged: nothing a child sees or the lesson receives changes).
//
// H1 (dc-r8-gate2-habit-children) is built: two sightings are two different acts. read's sighting counts only when the
// number she typed differs from every earlier sighting's (tallyLogic.sightingOf), so two rows on which the mix-up gives the
// same number (19 and 20 both give 16) are one sighting. Every non-holder child is asserted under 1 in 10 at every fade.
// keep: its only one-button habit that is named ("|" only, five as five standing lines) is the kit's own second sign, so it
// is listed as holding the mix-up.
//
// The negative control runs always: the same children under the rules from before H1 (the battery's `legacy`) must still
// show the judge's failure ("16 every time": the mix-up's number on rows 19 and 20, the second a firm sighting; "what I
// typed last time").
//
// Run time (this container, one core): gate sweep about 20 s; HABIT_FULL=1 about 100 s. HABIT_PRINT=<file> writes the table
// (the packet's "Gate 2 battery").
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { runBattery, batteryTable, overLine, holders, rowOf, sweep, memoAgrees, LINE, DOOR_SEQS, FADES, PLS } from "./_habit-children.mjs";
import { coverage } from "../server/play/levels.js";
import { NAMING_OFF } from "../shared/play.ts";

const S = sweep();
const KIT = coverage().entries.find((e) => e.family === "stambh" && e.mode === "tally" && e.goal === "read").misMap["tally-four"];
let RES = null, OLD = null, over = [];
// the negative control's children, run under the rules from before H1
const OLD_KIDS = new Set(["const:16", "last-first", "blind"]);
before(async () => {
  RES = await runBattery("stambh/tally", S);
  OLD = await runBattery("stambh/tally", { ...S, legacy: true, goals: ["read"], only: (c) => OLD_KIDS.has(c.id) });
  over = overLine(RES);
  if (process.env.HABIT_PRINT) writeFileSync(process.env.HABIT_PRINT, `${batteryTable(RES)}\n\nsweep: ${JSON.stringify(S)}; ${RES.ms} ms\n`);
});

test("the battery: every child at every fade, pL and door sequence, through the served path; naming stays off for the product", () => {
  assert.ok(NAMING_OFF.has("stambh/tally"), "the product's switch is untouched");
  for (const goal of ["read", "keep"]) {
    const G = RES.goals[goal];
    assert.ok(G.rows.length >= (goal === "read" ? 150 : 120), `${goal}: ${G.rows.length} children`);
    for (const r of G.rows) {
      const per = r.random ? S.randomSeeds : r.constant ? S.constSeeds : S.seeds, pls = r.constant && S.constPls ? S.constPls.length : PLS.length;
      assert.equal(r.sessions, FADES.length * pls * DOOR_SEQS.length * per, `${goal} ${r.label}`);
    }
    // every value she could type, as a constant answer
    assert.equal(G.rows.filter((r) => r.constant).length, 100);
  }
});

test("the generator memo changes nothing (the same served sessions with and without it)", () => {
  for (const goal of ["read", "keep"]) { const m = memoAgrees("stambh/tally", goal); assert.ok(m.same, goal); assert.ok(m.sessions >= 50); }
});

test("children who hold the mix-up: listed with why, and how often each is named (fewer than half is reported, not failed)", (t) => {
  const H = holders(RES);
  for (const h of H) t.diagnostic(`${h.goal} · ${h.label}: named ${h.all.toFixed(3)} (${h.half}); holds it because ${h.why}`);
  assert.deepEqual(H.map((h) => `${h.goal}:${h.child}`).sort(), ["keep:holder-counted", "keep:holder-five", "keep:holder-plain", "read:holder", "read:holder-half"]);
  // the positive control: the battery sees naming at all (the mix-up's own act every level)
  assert.ok(rowOf(RES, "read", "holder").all[KIT] >= 0.5, "read: the mix-up every level is named in most sessions");
  assert.ok(rowOf(RES, "keep", "holder-counted").all[KIT] >= 0.99, "keep names from one level");
});

test("negative control: under the rules from before H1 the judge's failure shows (16 every time; what I typed last time)", () => {
  const c16 = rowOf(OLD, "read", "const:16");
  assert.ok(c16.worstCell[KIT].share >= 0.5, `16 every time, worst cell ${c16.worstCell[KIT].share} at ${c16.worstCell[KIT].at}`);
  assert.ok(c16.worstFade[KIT].share >= LINE, `16 every time, worst fade ${c16.worstFade[KIT].share}`);
  const last = rowOf(OLD, "read", "last-first");
  assert.ok(last.worstFade[KIT].share >= LINE, `what I typed last time: ${last.worstFade[KIT].share}`);
  // under H1 the same two are under the line
  for (const c of ["const:16", "last-first"]) assert.ok(rowOf(RES, "read", c).worstFade[KIT].share < LINE, `${c} under H1`);
  // and the child the tables model is under the line, old rules and new: the blind guesser
  for (const R of [OLD, RES]) assert.ok(rowOf(R, "read", "blind").worstFade[KIT].share < LINE);
});

test("read: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", () => {
  const o = over.filter((x) => x.goal === "read");
  assert.deepEqual(o, [], o.map((x) => `${x.label}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
});

test("keep: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", () => {
  const o = over.filter((x) => x.goal === "keep");
  assert.deepEqual(o, [], o.map((x) => `${x.label}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
});
