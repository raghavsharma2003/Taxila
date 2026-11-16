// round 7 (C1 studio-whiteboard-motion-ops, M1): the motion family beyond move — rotate, scale, follow, sweep, morph. Each
// acts on an earlier op, only on the kinds it may (a word is only ever translated), is refused when it would carry its
// target off the board, composes in script order, and is judged where it ENDS (W19, settledScript).
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeScript, settledScript, motionMatrix, morphAt, sweepAt, finalOp, isMotionOp, opGeometry } from "../shared/whiteboard.js";
import { gateWhiteboard } from "../server/studio/qa/whiteboard.js";
import { angleDemo, areaDemo, cycleDemo } from "../evals/studio-timing/motion-demos.mjs";

const env = (ops, durationMs = 4000) => ({ v: 1, scriptId: "t", line: { lessonId: "L" }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs, ops });
const op = (id, kind, t0, t1, rest) => ({ id, op: kind, startMs: t0, endMs: t1, ...rest });
const near = (a, b, e = 0.6) => Math.abs(a - b) <= e;

test("rotate: the arm turns about its pivot; at the end it is where the angle says; halfway it is halfway", () => {
  const s = normalizeScript(env([op("arm", "line", 0, 300, { from: [100, 200], to: [300, 200] }), op("r", "rotate", 500, 1500, { target: "arm", deg: -90, about: [100, 200] })]), { strict: true });
  assert.ok(s.ok, s.errors.join(","));
  const end = settledScript(s.script).ops.find((o) => o.id === "arm");
  assert.ok(near(end.to[0], 100) && near(end.to[1], 0), JSON.stringify(end.to));
  const M = motionMatrix(s.script.ops, "arm", 1000);
  const tip = [M[0] * 300 + M[2] * 200 + M[4], M[1] * 300 + M[3] * 200 + M[5]];
  assert.ok(near(Math.hypot(tip[0] - 100, tip[1] - 200), 200), "the arm keeps its length");
  assert.ok(near(Math.atan2(200 - tip[1], tip[0] - 100) * 180 / Math.PI, 45, 1), "halfway at 45°");
  assert.ok(near(motionMatrix(s.script.ops, "arm", 600, true)[1], -1, 1e-9), "reduced motion: a started turn is complete");
});

test("each kind acts only on what it may: a word is never turned or scaled; a sweep needs a fill; a morph keeps the count", () => {
  const base = [op("w", "text", 0, 200, { at: [200, 100], text: "Ek", size: "m" }), op("box", "rect", 0, 200, { at: [50, 50], w: 60, h: 40 }), op("p", "polygon", 0, 200, { points: [[200, 200], [240, 200], [220, 240]] })];
  const errs = (m) => normalizeScript(env([...base, m]), { strict: true }).errors.join(",");
  assert.match(errs(op("m", "rotate", 300, 600, { target: "w", deg: 30, about: [200, 100] })), /rotate_target_kind/);
  assert.match(errs(op("m", "scale", 300, 600, { target: "w", k: 2, about: [200, 100] })), /scale_target_kind/);
  assert.match(errs(op("m", "sweep", 300, 600, { target: "box", dir: "up" })), /sweep_target_kind/, "no fill, nothing to sweep");
  assert.match(errs(op("m", "morph", 300, 600, { target: "p", to: [[1, 1], [2, 2]] })), /morph_points/);
  assert.equal(errs(op("m", "follow", 300, 600, { target: "w", path: [[20, 0], [40, 20]] })), "", "a word may travel");
  assert.equal(errs(op("m", "morph", 300, 600, { target: "p", to: [[200, 200], [260, 200], [230, 260]] })), "");
});

test("a motion that would carry its target off the board is refused, never clamped", () => {
  const r = normalizeScript(env([op("arm", "line", 0, 300, { from: [100, 200], to: [380, 200] }), op("r", "rotate", 500, 1500, { target: "arm", deg: 90, about: [100, 200] })]), { strict: true });
  assert.match(r.errors.join(","), /rotate_off_board/);
  const f = normalizeScript(env([op("d", "circle", 0, 300, { c: [380, 150], r: 6 }), op("f", "follow", 400, 900, { target: "d", path: [[40, 0]] })]), { strict: true });
  assert.match(f.errors.join(","), /follow_off_board/);
});

test("composition in script order: a turn then a slide ends where both put it; a mirror scale folds a shape onto its half", () => {
  const s = normalizeScript(env([
    op("arm", "line", 0, 300, { from: [100, 150], to: [200, 150] }),
    op("r", "rotate", 400, 800, { target: "arm", deg: 90, about: [100, 150] }),
    op("m", "move", 900, 1200, { target: "arm", by: [50, 0] }),
    op("tri", "polygon", 0, 300, { points: [[250, 100], [300, 100], [300, 140]] }),
    op("fold", "scale", 400, 1200, { target: "tri", k: [-1, 1], about: [250, 120] }),
  ]), { strict: true });
  assert.ok(s.ok, s.errors.join(","));
  const end = Object.fromEntries(settledScript(s.script).ops.map((o) => [o.id, o]));
  assert.deepEqual(end.arm.from, [150, 150]);
  assert.deepEqual(end.arm.to, [150, 250]);
  assert.deepEqual(end.tri.points, [[250, 100], [200, 100], [200, 140]], "mirrored across x = 250");
  assert.ok(!settledScript(s.script).ops.some(isMotionOp), "the settled board has no motion ops");
});

test("follow travels its path by length; morph carries the points; sweep reveals from its side (reduced motion: at once)", () => {
  const s = normalizeScript(env([
    op("d", "circle", 0, 100, { c: [100, 100], r: 5 }), op("f", "follow", 1000, 2000, { target: "d", path: [[100, 0], [100, 100]] }),
    op("p", "stroke", 0, 100, { points: [[50, 250], [100, 250]] }), op("mo", "morph", 1000, 2000, { target: "p", to: [[50, 200], [100, 280]] }),
    op("box", "rect", 0, 100, { at: [200, 200], w: 100, h: 50, fill: "accent" }), op("sw", "sweep", 1000, 2000, { target: "box", dir: "up" }),
  ]), { strict: true });
  assert.ok(s.ok, s.errors.join(","));
  const M = motionMatrix(s.script.ops, "d", 2000);
  assert.deepEqual([M[4], M[5]], [100, 100], "the end of the path");
  const mid = motionMatrix(s.script.ops, "d", 1500);
  assert.ok(near(mid[4], 100, 1) && near(mid[5], 0, 1), "halfway along by length: the corner");
  assert.deepEqual(morphAt(s.script.ops, s.script.ops.find((o) => o.id === "p"), 2000), [[50, 200], [100, 280]]);
  assert.equal(morphAt(s.script.ops, s.script.ops.find((o) => o.id === "p"), 500), null, "before the morph: its own points");
  assert.deepEqual(sweepAt(s.script.ops, "box", 500), { p: 0, dir: "up" });
  assert.equal(sweepAt(s.script.ops, "box", 1100, true).p, 1);
  assert.equal(finalOp(s.script.ops.find((o) => o.id === "d"), s.script.ops).c.join(","), "200,200");
});

test("W19 judges the board where a motion leaves it: an arm turned onto a word is refused", () => {
  const s = normalizeScript(env([
    op("arm", "line", 0, 300, { from: [100, 200], to: [300, 200] }),
    op("w", "text", 300, 600, { at: [100, 80], text: "Ek arm", size: "m" }),
    op("r", "rotate", 700, 1500, { target: "arm", deg: -90, about: [100, 200] }),
  ]), { strict: true });
  assert.ok(s.ok, s.errors.join(","));
  const g = gateWhiteboard(s.script, { reply: "Ek arm ghoomta hai.", speechMs: 4000 });
  const w19 = g.checks.find((c) => c.id === "W19.settled");
  assert.equal(w19?.pass, false, JSON.stringify(g.checks.filter((c) => !c.pass)));
});

for (const demo of [angleDemo, areaDemo, cycleDemo]) {
  test(`${demo.name}: the M1 demo board passes every W gate as it plays and as it ends`, () => {
    const d = demo();
    const n = normalizeScript(d.script, { strict: true });
    assert.ok(n.ok, n.errors.join(","));
    assert.ok(n.script.ops.some(isMotionOp));
    const g = gateWhiteboard(n.script, { reply: d.line, speechMs: d.script.durationMs });
    assert.equal(g.pass, true, JSON.stringify(g.checks.filter((c) => !c.pass)));
    for (const o of n.script.ops) if (isMotionOp(o)) assert.equal(opGeometry(o).paths.length, 0, "a motion op draws nothing itself");
  });
}
