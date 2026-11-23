// Studio 015 (dc-r8-director32 item 8): a round shape that is not a circle, a slack string, the tester on a turned tile, small
// fixes, and a second view only where it adds something. Every new drawing is true of its numbers and inside the 120-op cap.
import { test } from "node:test";
import assert from "node:assert/strict";
import { expand } from "../server/forge/explainer/templates.js";
import * as BF from "../server/stagecraft/board-first.js";
import { viewOf } from "../scripts/lesson-scripts/check.mjs";
import { namedShapeMissing } from "../server/studio/qa/whiteboard.js";
import { LIMITS } from "../shared/whiteboard.js";

const texts = (sc) => sc.ops.filter((o) => o.op === "text" || o.op === "label").map((o) => String(o.text));
const len = (o) => Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1]);
const ok = (call) => { const x = expand(call); assert.ok(x.ok, `${JSON.stringify(call)}: ${x.errors.join()}`); assert.ok(x.script.ops.length <= LIMITS.maxOps, `${x.script.ops.length} ops`); return x.script; };
/** the nearest point of a closed polyline to p */
const distToPoly = (pts, p) => Math.min(...pts.slice(1).map((q, i) => {
  const a = pts[i], dx = q[0] - a[0], dy = q[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
  return Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]);
}));
const askOf = (ref) => ({ intent: { intentId: "s015", lessonId: "s015", kind: "whiteboard", style: { band: "B3" }, boardRef: ref,
  scriptBeat: { kind: "check", ownBoard: true, answers: [] }, held: { board: ref, unit: "u" }, request: { kind: "show" } }, line: { text: "" }, mode: "fresh" });

test("item 1: an oval and an uneven round shape — each radius from the centre to the outline at its own length, labelled as authored; 8 cm and 10 cm drawn 8 : 10", () => {
  for (const shape of ["oval", "uneven"]) {
    const sc = ok({ template: "shape@1", shape, centre: "centre", radii: ["8 cm", "10 cm"], name: "roti" });
    const outline = sc.ops.find((o) => o.id === "o"), rads = sc.ops.filter((o) => /^rad\d$/.test(o.id));
    assert.equal(outline.op, "stroke", "one closed stroke, not a circle op");
    assert.ok(Math.hypot(outline.points[0][0] - outline.points.at(-1)[0], outline.points[0][1] - outline.points.at(-1)[1]) < 1, "closed");
    assert.equal(sc.ops.filter((o) => o.op === "circle" && o.r > 10).length, 0, "no circle drawn");
    assert.equal(rads.length, 2);
    assert.ok(Math.abs(len(rads[0]) / len(rads[1]) - 0.8) < 0.01, `${shape}: ${len(rads[0])} : ${len(rads[1])}`);
    for (const r of rads) assert.ok(distToPoly(outline.points, r.to) < 1.5, `${shape}: a radius ends on the outline`);
    assert.deepEqual(texts(sc).filter((t) => /cm/.test(t)).sort(), ["10 cm", "8 cm"]);
    // no part of the outline further from the centre than the longest radius (no length the board does not state is longer)
    const far = Math.max(...outline.points.map((p) => Math.hypot(p[0] - rads[0].from[0], p[1] - rads[0].from[1])));
    assert.ok(far <= len(rads[1]) + 0.5, `${shape}: the outline reaches ${far} past 10 cm's ${len(rads[1])}`);
  }
  // an oval's third radius lies between its half-axes, at its own length; the uneven outline is the same for the same params and
  // has no symmetry (its radius varies round it)
  const three = ok({ template: "shape@1", shape: "oval", radii: ["8 cm", "10 cm", "9 cm"] });
  const r3 = three.ops.filter((o) => /^rad\d$/.test(o.id)).map(len);
  assert.ok(Math.abs(r3[2] / r3[1] - 0.9) < 0.01 && distToPoly(three.ops.find((o) => o.id === "o").points, three.ops.find((o) => o.id === "rad2").to) < 1.5);
  const u = ok({ template: "shape@1", shape: "uneven", radii: ["8 cm", "10 cm"] });
  assert.deepEqual(u, ok({ template: "shape@1", shape: "uneven", radii: ["8 cm", "10 cm"] }));
  const c0 = u.ops.find((o) => o.id === "ctr").c, ds = u.ops.find((o) => o.id === "o").points.map((p) => Math.hypot(p[0] - c0[0], p[1] - c0[1]));
  assert.ok(Math.max(...ds) - Math.min(...ds) > 10, "not a circle");
  const half = ds.slice(0, 36), other = ds.slice(36, 72);
  assert.ok(half.some((d, i) => Math.abs(d - other[i]) > 3), "not symmetric through the centre");
  // refused: an oval with equal radii is a circle; radii with no length; four radii
  assert.equal(expand({ template: "shape@1", shape: "oval", radii: ["8 cm", "8 cm"] }).ok, false);
  assert.equal(expand({ template: "shape@1", shape: "oval", radii: ["8 cm", "10 cm", "10 cm"] }).ok, false, "a third radius not between the half-axes");
  assert.equal(expand({ template: "shape@1", shape: "uneven", radii: ["radius"] }).ok, false);
  assert.equal(expand({ template: "shape@1", shape: "uneven", radii: ["1 cm", "2 cm", "3 cm", "4 cm"] }).ok, false);
});

test("item 1: the radii view on an oval and an uneven shape — three radii, each at its own length to the outline, the board's words only", () => {
  for (const shape of ["oval", "uneven"]) {
    const ref = { template: "shape@1", params: { shape, centre: "centre", radii: ["8 cm", "10 cm"], name: "roti" } };
    assert.deepEqual(viewOf(ref), { template: "shape@1", view: "radii", kind: "figure" }, shape);
    const pt = BF.pictureTurn(askOf(ref), {});
    assert.ok(pt.script.ops.length <= LIMITS.maxOps);
    const v = pt.view.script, rads = v.ops.filter((o) => /^rad\d$/.test(o.id)), outline = v.ops.find((o) => o.id === "o");
    assert.equal(rads.length, 3);
    assert.equal(new Set(rads.map((r) => Math.round(len(r)))).size, 3, `${shape}: three lengths`);
    for (const r of rads) assert.ok(distToPoly(outline.points, r.to) < 1.5);
    const held = ok({ template: "shape@1", ...ref.params });
    assert.deepEqual([...new Set(texts(v))].sort(), [...new Set(texts(held))].sort(), "only the board's words");
  }
  // three radii drawn already: nothing more to show
  assert.equal(viewOf({ template: "shape@1", params: { shape: "oval", radii: ["8 cm", "10 cm", "9 cm"] } }), null);
});

test("item 1: the W15 gate takes a round outline that is not a circle where her line asks whether it is one, or says it is not — never where she calls it a circle", () => {
  const sc = ok({ template: "shape@1", shape: "uneven", centre: "centre", radii: ["8 cm", "10 cm"], name: "roti" });
  const asked = { asked: true };
  assert.deepEqual(namedShapeMissing("Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?", sc.ops, asked), []);
  assert.deepEqual(namedShapeMissing("Nahi, yeh circle nahi hai, kyunki kinaara barabar door nahi.", sc.ops, asked), []);
  assert.deepEqual(namedShapeMissing("Yeh roti ek circle hai.", sc.ops, asked), ["circle named, not drawn"]);
});
