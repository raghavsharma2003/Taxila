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

test("item 2: a slack string — the circle of the string's length except between the two angles, where it comes in by up to its depth; never outside the tight circle; the radii view adds a shorter radius into the dent", () => {
  const p = { shape: "circle", radius: "12 cm", centre: "centre", slack: { from: 20, to: 110, depth: 4 }, guide: true, name: "dhili dori" };
  for (const params of [p, { ...p, guide: undefined }, { ...p, slack: { from: 300, to: 60, depth: 6 } }, { ...p, slack: { from: 150, to: 330, depth: 2.5 } }]) {
    const sc = ok({ template: "shape@1", ...params });
    const ctr = sc.ops.find((o) => o.id === "ctr").c, outline = sc.ops.find((o) => o.id === "o"), full = sc.ops.find((o) => o.id === "rad0");
    const R = len(full), ds = outline.points.map((q) => Math.hypot(q[0] - ctr[0], q[1] - ctr[1]));
    // (the tight circle: the guide's radius, the full radius's length — its end rounded to a tenth)
    const tight = sc.ops.find((o) => o.id === "guide")?.r ?? 100;
    assert.ok(Math.abs(R - tight) < 0.1);
    assert.ok(Math.max(...ds) <= tight, `never outside the tight circle: ${Math.max(...ds)} > ${tight}`);
    // the dent is as deep as authored (in the radius's unit): 12 cm → R, depth d → R·d/12 nearer the centre at its deepest
    assert.ok(Math.abs((R - Math.min(...ds)) / R * 12 - params.slack.depth) < 0.05, `deepest ${R - Math.min(...ds)} px`);
    // outside the two angles the outline is the circle
    const { from, to } = params.slack, span = ((to - from) % 360 + 360) % 360;
    outline.points.forEach((q, i) => {
      const deg = ((Math.atan2(ctr[1] - q[1], q[0] - ctr[0]) * 180) / Math.PI - from + 720) % 360;
      if (deg > span + 0.5 && deg < 359.5) assert.ok(Math.abs(ds[i] - R) < 0.2, `point ${i} at ${deg}° past the dent is on the circle`);
    });
    assert.equal(!!sc.ops.find((o) => o.id === "guide" && o.op === "circle" && o.ink === "soft" && Math.abs(o.r - R) < 0.2), params.guide === true, "the guide: the tight circle, faint");
    assert.ok(texts(sc).includes("12 cm"));
    // the radii view: one radius at full length, one into the dent, shorter, unlabelled
    const ref = { template: "shape@1", params };
    assert.deepEqual(viewOf(ref), { template: "shape@1", view: "radii", kind: "figure" });
    const v = BF.pictureTurn(askOf(ref), {});
    assert.ok(v.script.ops.length <= LIMITS.maxOps);
    const rads = v.view.script.ops.filter((o) => /^rad\d$/.test(o.id)).map(len);
    assert.equal(rads.length, 2);
    assert.ok(Math.abs(rads[0] - R) < 0.5 && Math.abs(rads[1] - (R - (R * params.slack.depth) / 12)) < 0.5, `${rads}`);
    assert.deepEqual(texts(v.view.script).sort(), texts(sc).sort(), "the board's words only");
  }
  // refused: a dent deeper than 0.6 of the string, no length on the radius, a slack with a diameter
  assert.equal(expand({ template: "shape@1", ...p, slack: { from: 20, to: 110, depth: 9 } }).ok, false);
  assert.equal(expand({ template: "shape@1", ...p, radius: "radius" }).ok, false);
  assert.equal(expand({ template: "shape@1", ...p, diameter: "24 cm" }).ok, false);
});

test("item 3: the tester on a turned tile — Studio 014's right-angle corner at a corner of a copy, square to the page (it misses the turned tile's edges) or turned with the shape (it fits)", () => {
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const par = (a, b) => { const d = Math.abs(((a - b) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d) < 0.01; };
  for (const shape of ["rectangle", "square"]) for (const corner of [0, 1, 2, 3]) for (const turned of [true, false]) {
    const sc = ok({ template: "shape@1", shape, copies: 2, names: ["tile", "ghumi tile"], tester: { on: 1, corner, turned } });
    const tile = sc.ops.find((o) => o.id === "p1").points, t = sc.ops.find((o) => o.id === "tester");
    assert.equal(t.op, "polygon");
    assert.equal(t.ink, "soft", "lighter than the tile");
    const [q0, q1, q2, q3] = t.points, P = tile[corner];
    assert.ok(Math.hypot(q0[0] - P[0], q0[1] - P[1]) < 0.2, "its corner on the tile's corner");
    // a square: four equal sides, a right angle at its corner
    const s1 = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]), s2 = Math.hypot(q3[0] - q0[0], q3[1] - q0[1]);
    assert.ok(Math.abs(s1 - s2) < 0.3 && Math.abs(Math.cos(ang(q0, q1) - ang(q0, q3))) < 0.01);
    const along = par(ang(q0, q1), ang(P, tile[(corner + 1) % 4])) && par(ang(q0, q3), ang(P, tile[(corner + 3) % 4]));
    const page = par(ang(q0, q1), 0) && par(ang(q0, q3), Math.PI / 2);
    if (turned) assert.ok(along, `${shape} ${corner}: turned with the tile, its edges along the tile's`);
    else { assert.ok(page, "square to the page"); assert.ok(!along, `${shape} ${corner}: on the turned tile it does not fit`); }
    assert.ok(texts(sc).every((w) => ["tile", "ghumi tile"].includes(w)), "no word naming fits or not");
  }
  // on the unturned tile, square to the page is turned with the shape: it fits either way
  const flat = ok({ template: "shape@1", shape: "rectangle", tester: { on: 0, corner: 0, turned: false } });
  const ft = flat.ops.find((o) => o.id === "tester").points, fp = flat.ops.find((o) => o.id === "p0").points;
  assert.ok(Math.abs(ft[1][1] - fp[0][1]) < 0.2 && Math.abs(ft[3][0] - fp[0][0]) < 0.2);
  assert.equal(expand({ template: "shape@1", shape: "triangle", tester: { on: 0, corner: 0, turned: true } }).ok, false);
  assert.equal(expand({ template: "shape@1", shape: "square", tester: { on: 1, corner: 0, turned: true } }).ok, false, "no copy 1 on a one-copy board");
});

test("item 5: equal-groups@1 showSum: false draws the groups with no sum line (c6-ch07 skill 3: five whole laddoos, no \"5 × 1 = 5\")", () => {
  const sc = ok({ template: "equal-groups@1", groups: 5, each: 1, title: "5 laddoo", showSum: false });
  assert.equal(sc.ops.filter((o) => o.op === "numwork").length, 0);
  assert.deepEqual(sc.facts.counts, { groups: 5, each: 1 });
  assert.ok(ok({ template: "equal-groups@1", groups: 5, each: 1 }).ops.some((o) => o.id === "eq"), "the sum line stays by default");
  assert.equal(expand({ template: "equal-groups@1", groups: 5, each: 1, showSum: "no" }).ok, false);
});

test("item 5: compare@1 — an item wrapping onto two lines never crosses the title's rule: rows laid from each cell's real height, or refused at author time; the live gate passes it", async () => {
  const { gateWhiteboard } = await import("../server/studio/qa/whiteboard.js");
  const { opGeometry } = await import("../shared/whiteboard.js");
  const call = { template: "compare@1", left: { title: "3 roti, 4 bachche", items: ["3/4 roti, 1 se kam"] }, right: { title: "5 laddoo, 2 bachche", items: ["5/2 laddoo, 1 se zyada"] } };
  const sc = ok(call);
  const rules = sc.ops.filter((o) => o.op === "line" && o.from[1] === o.to[1]);
  for (const o of sc.ops.filter((x) => x.op === "text" && /^c|^o/.test(x.id) && !/^\d+ (roti|laddoo),|bachche$/.test(x.text))) {
    const b = opGeometry(o).box;
    for (const r of rules) assert.ok(!(b.y < r.from[1] && b.y + b.h > r.from[1] && b.x < r.to[0] && b.x + b.w > r.from[0]), `"${o.text}" crosses the rule`);
  }
  const g = gateWhiteboard(sc, { reply: "Board par dono baantne ke hisaab likhe hain.", speechMs: 4000, withhold: { values: [] }, asked: true });
  assert.ok(g.checks.find((c) => c.id === "W2.text_clear_of_lines")?.pass, JSON.stringify(g.checks.filter((c) => !c.pass)));
  // a table that cannot be laid without crossing or running off the board fails expand — the checker's resolve reports it
  const tall = { template: "compare@1", left: { title: "A", items: ["3/4 roti, 1 se kam", "5/2 laddoo, 1 se zyada", "7/3 laddoo, 2 se zyada", "9/4 roti, 2 se zyada"] }, right: { title: "B", items: ["1/2 roti, 1 se kam", "5/3 laddoo, 1 se zyada", "8/3 laddoo, 2 se zyada", "9/5 roti, 1 se zyada"] } };
  const x = expand(tall);
  assert.equal(x.ok, false, "refused at author time");
  // a plain table is laid exactly as before: its first row at 100, its pitch 52
  const plain = ok({ template: "compare@1", left: { title: "Ribbon P", items: ["20 cm", "12 cm"] }, right: { title: "Ribbon Q", items: ["12 cm", "8 cm"] } });
  assert.deepEqual(plain.ops.filter((o) => /^c\d\d$/.test(o.id)).map((o) => o.at[1]), [100, 100, 152, 152]);
});

test("item 4: a view is offered only when it adds something — the board's bars drawn again as circles (same parts, same shading) is no view; the cited turns, and the cards of the seven scripts that lose theirs", async () => {
  const { d32Cards } = await import("../scripts/lesson-scripts/check.mjs");
  const { readFileSync } = await import("node:fs");
  // the three turns the judges named: c6-ch07 offtopic 30 (two unshaded bars → two circles), steering 14 (the 15 cm bar → one circle),
  // c5-t03 stuck 18 (the first fold, a bar of 2 with 1 shaded → the same, round)
  for (const ref of [{ template: "fraction-bars@1", params: { bars: [{ parts: 3, shade: 0, label: "" }, { parts: 6, shade: 0, label: "" }] } },
    { template: "wholes@1", params: { as: "bar", wholes: [{ parts: 3, title: "15 cm" }] } }, { template: "fraction-bars@1", params: { bars: [{ parts: 2, shade: 1, label: "" }] } }]) {
    assert.equal(viewOf(ref), null, JSON.stringify(ref.params));
    assert.equal(BF.pictureTurn(askOf(ref), {}).view, null);
  }
  // what still adds: named bars on one line, round wholes laid along a length, a line's bars, a grid of groups
  assert.equal(viewOf({ template: "fraction-bars@1", params: { bars: [{ parts: 3, shade: 1, label: "1/3" }, { parts: 6, shade: 2, label: "2/6" }] } })?.view, "line");
  assert.equal(viewOf({ template: "wholes@1", params: { wholes: [{ parts: 4, title: "1/4" }, { parts: 8 }] } })?.view, "strips");
  assert.equal(viewOf({ template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "circle" } })?.view, "parts");
  assert.equal(viewOf({ template: "equal-groups@1", params: { groups: 3, each: 4 } })?.view, "grid");
  assert.ok(!BF.sameWholes({ template: "fraction-bars@1", params: { bars: [{ parts: 3, shade: 1 }] } }, { template: "fraction-parts@1", parts: 3, shade: 2 }), "other shading is something new");
  // the cards (card, check, follow-up, asked step, own step) of the seven scripts whose board loses its view by this rule — each now
  // on the checker's rule 7 list for a pictureBoard (none had one)
  const SEVEN = [["lesson-scripts", "c4-maths-ch05-t01"], ["lesson-scripts", "c5-maths-ch02-t01"], ["lesson-scripts", "c5-maths-ch02-t02"], ["lesson-scripts", "c5-maths-ch02-t03"],
    ["lesson-scripts", "c6-maths-ch06-t01"], ["lesson-scripts-staged", "c4-maths-ch01-t02"], ["lesson-scripts", "c6-maths-ch07-t01"]];
  const KINDS = new Set(["card", "follow-up", "check", "asked step", "own step"]), got = {};
  for (const [d, T] of SEVEN) {
    const s = JSON.parse(readFileSync(new URL(`../data/${d}/${T}.json`, import.meta.url), "utf8"));
    for (const c of d32Cards(s)) {
      if (!KINDS.has(c.kind) || !c.board?.template) continue;
      const ac = BF.altCall(c.board, { ownParts: true });
      if (!ac || !BF.viewAddsNothing(c.board, ac)) continue;
      assert.equal(viewOf(c.board, c.at), null, c.at);
      (got[T] ??= []).push(c.at.replace(`${T}-`, ""));
    }
  }
  assert.deepEqual(got, {
    "c4-maths-ch05-t01": ["s1/remediation[1].then", "s1/c2", "s1/workedExample.steps[0].ask", "s1/workedExample.yourStep", "s3/e3", "s3/workedExample.steps[0].ask", "s3/workedExample.yourStep"],
    "c5-maths-ch02-t02": ["s1/e2", "s1/remediation[0].then", "s1/workedExample.steps[0].ask", "s1/workedExample.yourStep", "s2/e4", "s2/remediation[0].then", "s2/remediation[1].then", "s2/remediation[2].then", "s2/c2", "s3/e3", "s3/remediation[0].then", "s3/remediation[1].then", "s3/remediation[2].then", "s3/c1", "s3/c2", "s3/workedExample.yourStep"],
    "c5-maths-ch02-t03": ["s1/remediation[0].then", "s1/c1", "s1/workedExample.steps[0].ask", "s1/workedExample.yourStep", "s2/e2", "s2/remediation[0].then", "s2/remediation[1].then", "s2/c1", "s2/c2", "s2/c3", "s2/workedExample.steps[0].ask", "s2/workedExample.yourStep", "s3/e2", "s3/e3", "s3/remediation[0].then", "s3/remediation[1].then", "s3/c1", "s3/c3", "s3/workedExample.steps[0].ask", "s3/workedExample.yourStep"],
    "c6-maths-ch07-t01": ["s1/e2", "s2/e1", "s2/e2", "s2/workedExample.yourStep", "s3/c1"],
  });
});
