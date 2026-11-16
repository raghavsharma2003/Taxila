// Gate 2, H2 for kon/place (RULINGS-2026-11-16-gate2.md, dc-r8-gate2-habit-children): the habit children run through
// sessions as the server serves them (tests/_habit-children.mjs), naming forced on inside the battery only (NAMING_OFF in
// shared/play.ts is unchanged: nothing a child sees or the lesson receives changes).
//
// H1 (dc-r8-gate2-habit-children) is built: two sightings are two different acts. measure's surface is its key on both
// scales (konLogic surfaceOf, measureSurface: another tilt of the same key is not another level), and a sighting counts only
// when what she did differs from every earlier one (placeSighting: the number she typed; the rim mark she dotted; where her
// protractor's centre sat, as an offset from the vertex on the board, offsets within a finger's drop, tolPx, being one act).
// Every non-holder child is now asserted under 1 in 10 at every fade, in both goals.
//
// The negative control runs always: the same children under the rules from before H1 (the battery's `legacy`, the product's
// HABIT_RULES switched off inside one synchronous run) must still show the judge's failure (in measure a second sighting on
// the same key served twice; a constant number; the same drop every level, the finger 16-32 board px up of the vertex,
// which on most served levels is where vertex-off's band lies).
//
// Run time (this container, one core): gate sweep about 14 s; HABIT_FULL=1 about 65 s. HABIT_PRINT=<file> writes the table.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { runBattery, runSession, withGenMemo, withRules, childrenFor, batteryTable, overLine, holders, listedCells, worstNonHolder, reportedRows, rowOf, sweep, memoAgrees, LINE, DOOR_SEQS, FADES, PLS } from "./_habit-children.mjs";
import { coverage } from "../server/play/levels.js";
import { DISCRIMINATING_TURN, NAMING_OFF } from "../shared/play.ts";
import { baseDir } from "../src/play/families/kon/kon.place.ts";

const S = sweep();
let RES = null, OLD = null, over = [];
const kit = (goal, rule) => RES.goals[goal].kits[rule];
// answer 4's level mix: from this level (0-based) a session that has not met an acute angle or one opening anticlockwise
// is served one (kon.place.ts placeNeeds)
const MIX_FROM = 2;
// the negative control's children, run under the rules from before H1
const OLD_KIDS = new Set(["const:75", "typing:key 1 down", "drop:drop 20 up", "drop:drop 24 up", "blind"]);
before(async () => {
  RES = await runBattery("kon/place", S);
  OLD = await runBattery("kon/place", { ...S, legacy: true, only: (c) => OLD_KIDS.has(c.id) });
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
  assert.ok(rowOf(RES, "draw", "other").all[kit("draw", "wrong-scale")] >= 0.9);
  // dc-r8-gate2-discriminating-level (answer 1): the bottom edge on the vertex is named on a second level whose base direction
  // differs by 45° or more (the same offset in the protractor's frame, another on the board), and after her first sighting
  // the session is steered to one (fade 1 too: a steered level may tilt). Under H1's board offset alone she was named 0.35
  // (measure) and 0.44 (draw) in the gate sweep; now (2026-11-16) 0.94 and 0.88
  assert.ok(rowOf(RES, "measure", "vertex-off").all[kit("measure", "vertex-off")] >= 0.75);
  assert.ok(rowOf(RES, "draw", "vertex-off").all[kit("draw", "vertex-off")] >= 0.75);
  assert.ok(rowOf(RES, "draw", "btn-A").all[kit("draw", "join-wrong-end")] > 0);
  // note 004, answer 1: a one-scale or one-number reader is wrong on one side or one kind of angle only ("always the inner
  // scale": where it opens anticlockwise; "always the larger number": an acute angle). After her first sighting the next
  // level is of that side and kind, and the level mix comes by the third level, so a second fits in the four. Before: 0 and
  // 0.031 (gate sweep), 0 and 0.063 (full); now named in every session of the gate sweep
  for (const [g, c] of [["measure", "larger"], ["measure", "inner"], ["draw", "inner"]]) {
    t.diagnostic(`note 004: ${g} · ${rowOf(RES, g, c).label}: named ${rowOf(RES, g, c).all[kit(g, "wrong-scale")].toFixed(3)}`);
    assert.ok(rowOf(RES, g, c).all[kit(g, "wrong-scale")] >= 0.75, `${g} ${c}`);
  }
});

test("answer 4 (dc-r8-gate2-discriminating-level): by its fourth level (now its third: note 004) every served session of measure and draw has met an acute angle and an angle that opens anticlockwise", () => {
  let sessions = 0;
  withGenMemo(() => {
    for (const goal of ["measure", "draw"]) {
      const entry = coverage().entries.find((e) => e.family === "kon" && e.mode === "place" && e.goal === goal);
      for (const cid of ["careful", "blind", "slip-random", "vertex-off", "other", "inner", "fixed-vo", ...(goal === "measure" ? ["larger"] : [])]) {
        const child = childrenFor("kon/place", goal).find((c) => c.id === cid);
        for (const fade of FADES) for (const pL of PLS) for (const doors of DOOR_SEQS) for (let k = 0; k < S.seeds; k++) {
          const { trace } = runSession({ entry, cell: { goal, fade, pL, doors }, child, sIdx: k });
          sessions++;
          assert.equal(trace.length, 4, `${goal} ${cid}: four levels`);
          const by = trace.slice(0, MIX_FROM + 1);
          assert.ok(by.some((x) => x.params.theta < 90), `${goal} ${cid} f${fade} ${doors}: an acute angle by the third level (${trace.map((x) => x.params.theta)})`);
          assert.ok(by.some((x) => !x.params.mirror), `${goal} ${cid} f${fade} ${doors}: an angle opening anticlockwise by the third level`);
        }
      }
    }
  });
  assert.ok(sessions >= 1000, `${sessions} sessions`);
});

test("answer 1 (dc-r8-gate2-discriminating-level): after a first sighting of vertex-off the next level's base direction differs by 45° or more; the finger held on the board is never named", () => {
  let steps = 0, apart = 0;
  withGenMemo(() => {
    for (const goal of ["measure", "draw"]) {
      const entry = coverage().entries.find((e) => e.family === "kon" && e.mode === "place" && e.goal === goal), VO = entry.misMap["vertex-off"];
      const child = childrenFor("kon/place", goal).find((c) => c.id === "vertex-off");
      for (const fade of FADES) for (const pL of PLS) for (const doors of DOOR_SEQS) for (let k = 0; k < S.seeds; k++) {
        const { trace } = runSession({ entry, cell: { goal, fade, pL, doors }, child, sIdx: k });
        const i = trace.findIndex((x) => x.pick === VO);
        if (i < 0 || i >= trace.length - 1) continue;
        steps++;
        if (Math.abs(((baseDir(trace[i + 1].params) - baseDir(trace[i].params)) % 360 + 540) % 360 - 180) >= DISCRIMINATING_TURN) apart++;
      }
    }
  });
  assert.ok(steps >= 300 && apart / steps >= 0.95, `steered ${apart} of ${steps}`);
  for (const g of ["measure", "draw"]) assert.equal(rowOf(RES, g, "fixed-vo").all[kit(g, "vertex-off")], 0, `${g}: the fixed finger`);
});

test("note 004, answer 1: after a sighting of wrong-scale the next level opens the same way with another key (draw: the mix-up's dot is not the right dot just played)", (t) => {
  let steps = 0, same = 0, dot = 0, draws = 0, mixed = 0;
  const key = (p) => (p.goal === "measure" ? Math.min(p.theta, 180 - p.theta) : p.theta);
  const right = (p) => (p.mirror ? 180 - p.theta : p.theta);
  withGenMemo(() => {
    for (const goal of ["measure", "draw"]) {
      const entry = coverage().entries.find((e) => e.family === "kon" && e.mode === "place" && e.goal === goal), WS = entry.misMap["wrong-scale"];
      for (const cid of ["inner", "outer", "other", ...(goal === "measure" ? ["larger", "smaller"] : ["last-key"])]) {
        const child = childrenFor("kon/place", goal).find((c) => c.id === cid);
        for (const fade of FADES) for (const pL of PLS) for (const doors of DOOR_SEQS) for (let k = 0; k < S.seeds; k++) {
          const { trace } = runSession({ entry, cell: { goal, fade, pL, doors }, child, sIdx: k });
          trace.forEach((x, i) => {
            if (x.pick !== WS || i >= trace.length - 1) return;
            // (dc-r8-gate2-shadow S3: a draw sighting whose other-scale mark copies the right mark just played does not count,
            // so it is not remembered and steers nothing)
            if (goal === "draw" && i > 0 && trace[i - 1].goal === "draw" && Math.abs(180 - right(trace[i].params) - right(trace[i - 1].params)) <= 2) return;
            const a = trace[i].params, b = trace[i + 1].params, seen = trace.slice(0, i + 1).filter((y) => y.pick === WS).map((y) => key(y.params));
            if (goal === "draw") { draws++; if (Math.abs(180 - right(b) - right(a)) > 2) dot++; }
            // (the level mix of answer 4 comes first: a level that must supply an angle opening anticlockwise is not steered
            // to the clockwise side)
            if (a.mirror && !trace.slice(0, i + 1).some((y) => !y.params.mirror) && i + 1 >= MIX_FROM) { mixed++; return; }
            steps++;
            if (!!a.mirror === !!b.mirror && !seen.includes(key(b))) same++;
          });
        }
      }
    }
  });
  t.diagnostic(`the same side with another key: ${same} of ${steps} (${mixed} more under the level mix); draw's dot: ${dot} of ${draws}`);
  assert.ok(steps >= 300 && same / steps >= 0.95, `the same side with another key ${same} of ${steps} (${mixed} more under the level mix)`);
  assert.equal(dot, draws, `draw: the mix-up's dot differs from the right dot just played (${dot} of ${draws})`);
});

test("negative control: under the rules from before H1 the judge's failure shows (measure: a habit tied to the key is named on the same key served twice)", () => {
  const entry = coverage().entries.find((e) => e.family === "kon" && e.mode === "place" && e.goal === "measure");
  const WS = entry.misMap["wrong-scale"];
  const seen = {};
  withRules(true, () => withGenMemo(() => {
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
  }));
  for (const [cid, r] of Object.entries(seen)) {
    assert.ok(r.repeatKey > 0.3 * r.sessions, `${cid}: served sessions repeating a key in their first four levels ${r.repeatKey} of ${r.sessions}`);
    assert.ok(r.named > 0, `${cid}: named`);
    assert.equal(r.namedOnSameKey, r.named, `${cid}: every naming is a second sighting on the same key`);
  }
  // as the battery reports them under the old rules: typing 75 every level, and the first key one row low (1 → 7, so 110
  // becomes 71)
  const c75 = rowOf(OLD, "measure", "const:75").worstFade[kit("measure", "wrong-scale")];
  assert.ok(c75.share >= LINE, `75 every level: ${c75.share} at fade ${c75.at}`);
  assert.ok(rowOf(OLD, "measure", "typing:key 1 down").worstCell[kit("measure", "wrong-scale")].share > 0);
  // the same drop every level
  assert.ok(rowOf(OLD, "measure", "drop:drop 20 up").worstFade[kit("measure", "vertex-off")].share >= 0.5);
  assert.ok(rowOf(OLD, "draw", "drop:drop 24 up").worstFade[kit("draw", "vertex-off")].share >= 0.5);
  // and under H1 the same children are under the line
  for (const [g, c, rule] of [["measure", "const:75", "wrong-scale"], ["measure", "drop:drop 20 up", "vertex-off"], ["draw", "drop:drop 24 up", "vertex-off"]]) {
    assert.ok(rowOf(RES, g, c).worstFade[kit(g, rule)].share < LINE, `${g} ${c} under H1`);
  }
  // and the children the tables model are under the line, old rules and new
  for (const R of [OLD, RES]) for (const g of ["measure", "draw"]) for (const rule of Object.keys(R.goals[g].kits)) assert.ok(rowOf(R, g, "blind").worstFade[kit(g, rule)].share < LINE, `${g} blind ${rule}`);
});

test("dc-r8-gate2-shadow S3: the second-reading judge's children are in the battery (the finger inside the angle along the bisector, a ±8 px wobble, and the rest of the judge's list); every one is under the line but any marked reported, whose figures are printed (REPORTED FIGURES, not assertions); draw's \"last time's right dot\" is not named as wrong-scale", (t) => {
  for (const g of ["measure", "draw"]) {
    const ids = new Set(RES.goals[g].rows.map((r) => r.child));
    for (const id of ["bisector:18", "bisector:26", "wobble8:drop 16 up", "wobble8:drop 28 down-left", "drop30:up", "undershoot:20", "any-after-miss", "slip-two", "last-solve"]) assert.ok(ids.has(id), `${g} ${id}`);
    assert.equal(RES.goals[g].rows.filter((r) => r.child.startsWith("wobble8:")).length, 32);
  }
  for (const id of ["last-turn", "last-other"]) assert.ok(RES.goals.measure.rows.some((r) => r.child === id), id);
  for (const id of ["last-size", "btn-last-place", "btn-turn"]) assert.ok(RES.goals.draw.rows.some((r) => r.child === id), id);
  // the judge's counted pair (draw, last time's right dot, wrong-scale): its sightings on a copied mark no longer count
  assert.equal(rowOf(RES, "draw", "last-key").worstFade[kit("draw", "wrong-scale")].share, 0, "last time's right dot");
  for (const x of reportedRows(RES)) t.diagnostic(`reported: ${x.goal} · ${x.label} (${x.rule}): named ${x.all.toFixed(3)}, worst fade ${x.worstFade.share.toFixed(3)} (fade ${x.worstFade.at}), worst door sequence ${x.worstDoor.share.toFixed(3)} (${x.worstDoor.at}); ${x.why}`);
});

test("measure: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", () => {
  const o = over.filter((x) => x.goal === "measure");
  assert.deepEqual(o, [], o.map((x) => `${x.label} ${x.rule}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
});

test("draw: every child who does not hold the mix-up is named in fewer than 1 session in 10, at every fade", () => {
  const o = over.filter((x) => x.goal === "draw");
  assert.deepEqual(o, [], o.map((x) => `${x.label} ${x.rule}: ${x.share.toFixed(3)} at fade ${x.fade}`).join("\n"));
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
