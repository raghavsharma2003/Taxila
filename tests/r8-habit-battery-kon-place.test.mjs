// Gate 2, H2 for kon/place (RULINGS-2026-11-16-gate2.md, dc-r8-gate2-habit-children): the habit children run through
// sessions as the server serves them (tests/_habit-children.mjs), naming forced on inside the battery only (NAMING_OFF in
// shared/play.ts is unchanged: nothing a child sees or the lesson receives changes).
//
// The negative control: no naming rule has changed yet (H1 comes next), so the battery must show the judge's failure: in
// measure a second sighting may be the same key (the surface compares all params, so another tilt counts as "differs"),
// and the picker repeats keys, so a habit tied to the key (a constant number; the same typing slip) is named. The
// assertion every non-holder child must meet is marked todo where it fails today (measure, draw); a separate test asserts
// that the known failure does show. New here (the judges did not run it): the same drop every level, the finger landing
// the same 16-32 board px up (or up and to the right) of the vertex, which on most served levels is where vertex-off's band
// lies, so it is named in most sessions in both goals.
//
// Run time (this container, one core): gate sweep 11 s; HABIT_FULL=1 55 s. HABIT_PRINT=<file> writes the table.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { runBattery, runSession, withGenMemo, childrenFor, batteryTable, overLine, holders, rowOf, sweep, memoAgrees, LINE, DOOR_SEQS, FADES, PLS } from "./_habit-children.mjs";
import { coverage } from "../server/play/levels.js";
import { NAMING_OFF } from "../shared/play.ts";

const S = sweep();
let RES = null, over = [];
const kit = (goal, rule) => RES.goals[goal].kits[rule];
before(async () => {
  RES = await runBattery("kon/place", S);
  over = overLine(RES);
  if (process.env.HABIT_PRINT) writeFileSync(process.env.HABIT_PRINT, `${batteryTable(RES)}\n\nsweep: ${JSON.stringify(S)}; ${RES.ms} ms\n`);
});

test("the battery: every child at every fade, pL and door sequence, through the served path; naming stays off for the product", () => {
  assert.ok(NAMING_OFF.has("kon/place"), "the product's switch is untouched");
  for (const goal of ["measure", "draw"]) {
    const G = RES.goals[goal];
    assert.ok(G.rows.length >= 250, `${goal}: ${G.rows.length} children`);
    for (const r of G.rows) {
      const per = r.random ? S.randomSeeds : r.constant ? S.constSeeds : S.seeds, pls = r.constant && S.constPls ? S.constPls.length : PLS.length;
      assert.equal(r.sessions, FADES.length * pls * DOOR_SEQS.length * per, `${goal} ${r.label}`);
    }
    // every number she could type (measure), every rim mark she could dot (draw)
    assert.equal(G.rows.filter((r) => r.constant).length, 181);
  }
});

test("the generator memo changes nothing (the same served sessions with and without it)", () => {
  for (const goal of ["measure", "draw"]) { const m = memoAgrees("kon/place", goal); assert.ok(m.same, goal); assert.ok(m.sessions >= 50); }
});

test("children who hold the mix-up: listed with why, and how often each is named (fewer than half is reported, not failed)", (t) => {
  const H = holders(RES);
  for (const h of H) t.diagnostic(`${h.goal} · ${h.label} (${h.rule}): named ${h.all.toFixed(3)} (${h.half}); holds it because ${h.why}`);
  assert.deepEqual(H.map((h) => `${h.goal}:${h.child}:${h.rule}`).sort(), [
    "draw:btn-A:join-wrong-end", "draw:inner:wrong-scale", "draw:other:wrong-scale", "draw:outer:wrong-scale", "draw:vertex-off:vertex-off",
    "measure:inner:wrong-scale", "measure:larger:wrong-scale", "measure:other:wrong-scale", "measure:outer:wrong-scale", "measure:smaller:wrong-scale", "measure:vertex-off:vertex-off"]);
  // the positive control: the battery sees naming at all
  assert.ok(rowOf(RES, "measure", "other").all[kit("measure", "wrong-scale")] >= 0.9);
  assert.ok(rowOf(RES, "measure", "vertex-off").all[kit("measure", "vertex-off")] >= 0.9);
  assert.ok(rowOf(RES, "draw", "vertex-off").all[kit("draw", "vertex-off")] >= 0.9);
  assert.ok(rowOf(RES, "draw", "btn-A").all[kit("draw", "join-wrong-end")] > 0);
});

test("negative control: the judge's failure shows before any rule changes (measure: a habit tied to the key is named on the same key served twice)", () => {
  const entry = coverage().entries.find((e) => e.family === "kon" && e.mode === "place" && e.goal === "measure");
  const WS = entry.misMap["wrong-scale"];
  const seen = {};
  withGenMemo(() => {
    for (const cid of ["const:75", "typing:key 1 down"]) {
      const child = childrenFor("kon/place", "measure").find((c) => c.id === cid);
      const r = (seen[cid] = { sessions: 0, repeatKey: 0, named: 0, namedOnSameKey: 0 });
      for (const fade of FADES) for (const pL of PLS) for (const doors of DOOR_SEQS) for (let k = 0; k < S.seeds; k++) {
        const { trace } = runSession({ entry, cell: { goal: "measure", fade, pL, doors }, child, sIdx: k });
        r.sessions++;
        const th = trace.map((x) => x.params.theta);
        if (new Set(th).size < th.length) r.repeatKey++;
        const i = trace.findIndex((x) => x.rows.some((y) => y.misconceptionId === WS));
        if (i < 0) continue;
        r.named++;
        // the earlier sighting that let it through is on the same key (theta), another tilt or start
        if (trace.slice(0, i).some((x) => x.pick === WS && x.params.theta === trace[i].params.theta)) r.namedOnSameKey++;
      }
    }
  });
  for (const [cid, r] of Object.entries(seen)) {
    assert.ok(r.repeatKey > 0.3 * r.sessions, `${cid}: served sessions repeating a key in their first four levels ${r.repeatKey} of ${r.sessions}`);
    assert.ok(r.named > 0, `${cid}: named`);
    assert.equal(r.namedOnSameKey, r.named, `${cid}: every naming is a second sighting on the same key`);
  }
  // as the battery reports them: typing 75 every level, and the first key one row low (1 → 7, so 110 becomes 71)
  const c75 = rowOf(RES, "measure", "const:75").worstFade[kit("measure", "wrong-scale")];
  assert.ok(c75.share >= LINE, `75 every level: ${c75.share} at fade ${c75.at}`);
  assert.ok(rowOf(RES, "measure", "typing:key 1 down").worstCell[kit("measure", "wrong-scale")].share > 0);
  // the new one: the same drop every level
  assert.ok(rowOf(RES, "measure", "drop:drop 20 up").worstFade[kit("measure", "vertex-off")].share >= 0.5);
  assert.ok(rowOf(RES, "draw", "drop:drop 24 up").worstFade[kit("draw", "vertex-off")].share >= 0.5);
  // and the children the tables model are under the line
  for (const g of ["measure", "draw"]) for (const rule of Object.keys(RES.goals[g].kits)) assert.ok(rowOf(RES, g, "blind").worstFade[kit(g, rule)].share < LINE, `${g} blind ${rule}`);
});

test("measure: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", { todo: "H1 not built: the same drop every level 0.94 (vertex-off), a constant number 0.75 (wrong-scale), gate sweep" }, () => {
  const o = over.filter((x) => x.goal === "measure");
  assert.deepEqual(o, [], o.map((x) => `${x.label} ${x.rule}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
});

test("draw: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", { todo: "H1 not built: the same drop every level 0.89 (vertex-off), gate sweep" }, () => {
  const o = over.filter((x) => x.goal === "draw");
  assert.deepEqual(o, [], o.map((x) => `${x.label} ${x.rule}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
});
