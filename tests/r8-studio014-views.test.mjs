// Studio 014 (dc-r8-director31 item 5, ruling 2): a picture request always draws something new. The second views this
// order adds, each drawn from the posing board's own params only: its words are the board's words, its counts the board's
// counts (screen.counts, what the picture checker reads), and the split it is drawn on stays inside the 120-op cap.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expand, compareScaleOf } from "../server/forge/explainer/templates.js";
import * as BF from "../server/stagecraft/board-first.js";
import { viewOf } from "../scripts/lesson-scripts/check.mjs";
import { LIMITS } from "../shared/whiteboard.js";

const SCRIPTS = [["data/lesson-scripts", "c4-maths-ch05-t01"], ["data/lesson-scripts", "c5-maths-ch02-t01"], ["data/lesson-scripts", "c5-maths-ch02-t02"],
  ["data/lesson-scripts", "c5-maths-ch02-t03"], ["data/lesson-scripts", "c6-maths-ch06-t01"], ["data/lesson-scripts-staged", "c4-maths-ch01-t02"], ["data/lesson-scripts-staged", "c6-maths-ch07-t01"]];
/** Every board of the seven scripts (cards, asks, checks, worked boards, answer boards), by template. */
function boards(template) {
  const out = [];
  for (const [d, T] of SCRIPTS) {
    const j = JSON.parse(readFileSync(new URL(`../${d}/${T}.json`, import.meta.url), "utf8"));
    const walk = (o, p) => {
      if (Array.isArray(o)) return o.forEach((y, i) => walk(y, `${p}[${i}]`));
      if (!o || typeof o !== "object") return;
      if (o.template === template && o.params) { out.push({ at: `${T}${p}`, ref: o }); return; }
      for (const [k, v] of Object.entries(o)) walk(v, `${p}.${k}`);
    };
    walk(j, "");
  }
  return out;
}
const askOf = (ref, answers = []) => ({ intent: { intentId: "s014", lessonId: "s014", kind: "whiteboard", style: { band: "B3" }, boardRef: ref,
  scriptBeat: { kind: "check", ownBoard: true, answers }, held: { board: ref, unit: "u" }, request: { kind: "show" } }, line: { text: "" }, mode: "fresh" });
const texts = (sc) => sc.ops.filter((o) => o.op === "text" || o.op === "label").map((o) => String(o.text));
const counts = (call) => expand(call).script.facts.counts;
/** A view of `ref`: drawn, split beside the held board within the cap, its counts the held board's. → pictureTurn's result. */
function viewed(ref, name) {
  const pt = BF.pictureTurn(askOf(ref), {});
  assert.ok(pt?.view, `${JSON.stringify(ref.params)}: a view`);
  assert.equal(pt.view.view, name);
  assert.ok(pt.script.ops.length <= LIMITS.maxOps, `the split's ${pt.script.ops.length} ops`);
  assert.ok(pt.line && !/[.?!]$/.test(pt.line), "her picture line, ending clean");
  return pt;
}

test("compare@1 scale (item 1): a table of lengths in one unit is drawn to scale — a bar per item, or the whole cut at its pieces; only the table's words", () => {
  const got = boards("compare@1").map((b) => ({ ...b, v: viewOf(b.ref, b.at) }));
  const scaled = got.filter((b) => b.v?.view === "scale");
  for (const b of scaled) {
    assert.deepEqual(b.v, { template: "compare@1", view: "scale", kind: "strip" }, b.at);
    const p = b.ref.params, pt = viewed(b.ref, "scale");
    // (only the table's own words: its titles and its items — no answer, no total, no piece the table does not write)
    const own = new Set([p.left.title, ...p.left.items, p.right.title, ...p.right.items].map(String));
    for (const t of texts(pt.view.script)) assert.ok(own.has(t), `${b.at}: "${t}" is not on the table`);
    assert.deepEqual(counts(pt.view.call), counts({ template: "compare@1", left: p.left, right: p.right }), `${b.at}: the table's counts`);
    assert.equal(pt.view.call.mark, undefined, "an answer board's mark is never drawn on the view");
  }
  // the seven scripts' tables: lengths in one unit get the view, a table of two kinds or of words has none
  const titles = (b) => `${b.ref.params.left.title} | ${b.ref.params.right.title}`;
  // (repinned d32, 2026-11-19: the c6-ch07 reader fixes renamed two tables — "Rahul ki ribbon | Sana ki ribbon", and remediation 1's
  // own board "Lambi ribbon | Chhoti ribbon" — and c4-ch01-t02 no longer has its "Bhuja | Tester" table. c4-ch01-t02 s3 e2's authored
  // picture, the roti's two centre-to-edge distances 8 cm | 10 cm, was a word table; it is now held to scale (scale: true), two bars)
  assert.deepEqual([...new Set(scaled.map(titles))].sort(), ["Ganna | Ek hissa", "Lambi ribbon | Chhoti ribbon", "Rahul ki ribbon | Sana ki ribbon", "Ribbon A | Ribbon B", "Ribbon P | Ribbon Q", "Ribbon | Hisse", "Roti: ek taraf | Doosri taraf"]);
  // (one table of lengths has no view, and is named: c6-ch07 s1 c1's chocolate, now held to scale and cut 6, 2, 6, 2 cm in the order it
  // broke. Its view is built, but the split beside the held board is refused at panel scale — with 6,6,2,2 it lays out — so a
  // picture request on it draws the card's authored pictureBoard, a 0-16 cm scale. Studio to say whether the view should lay out)
  const PANEL_REFUSED = new Set(["c6-maths-ch07-t01.skills[0].checks[0].board"]);
  for (const at of PANEL_REFUSED) {
    const b = got.find((x) => x.at === at);
    assert.ok(b && !b.v && compareScaleOf(b.ref.params) && BF.altCall(b.ref)?.view === "scale", `${at}: a scale view is built, not laid out`);
  }
  for (const b of got.filter((b) => !b.v && !PANEL_REFUSED.has(b.at))) assert.equal(compareScaleOf(b.ref.params), null, `${b.at}: ${titles(b)}`);
  assert.ok(["Chikki | Bachche", "Laddoo | Bachche", "Ribbon | Banners", "laal card | neela card", "3 bachche | 5 bachche"].every((t) => got.some((b) => !b.v && titles(b) === t)));
});

test("compare@1 scale: the whole and its pieces — 16 cm cut at 6, 6, 2, 2 — is one bar cut at the pieces' lengths, in proportion", () => {
  const call = { template: "compare@1", left: { title: "Chocolate", items: ["16 cm"] }, right: { title: "Hisse", items: ["6 cm", "6 cm", "2 cm", "2 cm"] }, scale: true };
  const x = expand(call);
  assert.ok(x.ok, x.errors.join());
  const bar = x.script.ops.find((o) => o.id === "b0"), cuts = x.script.ops.filter((o) => /^k\d$/.test(o.id)).map((o) => o.from[0]);
  assert.equal(x.script.ops.filter((o) => o.op === "rect").length, 1, "one bar");
  assert.deepEqual(cuts.map((cx) => Math.round(((cx - bar.at[0]) / bar.w) * 16)), [6, 12, 14], "cut at 6, 12 and 14 of 16");
  assert.deepEqual(compareScaleOf(call).whole.pieces.map((p) => p.n), [6, 6, 2, 2]);
  // (pieces that do not add up to the whole are two bars, each to scale: 30 cm and 6 cm)
  const two = expand({ template: "compare@1", left: { title: "Ganna", items: ["30 cm"] }, right: { title: "Ek hissa", items: ["6 cm"] }, scale: true });
  const [a, b] = two.script.ops.filter((o) => o.op === "rect");
  assert.equal(Math.round((b.w / a.w) * 30), 6);
});

test("compare@1 scale: a share is drawn as the whole it is a share of, uncut and unshaded — the share's length is the card's question (c6-ch07 c2 \"kiska hissa lamba hai?\")", () => {
  const call = { template: "compare@1", left: { title: "Rahul", items: ["60 cm ka 1/3"] }, right: { title: "Sana", items: ["30 cm ka 1/2"] }, scale: true };
  const x = expand(call);
  assert.ok(x.ok, x.errors.join());
  const rects = x.script.ops.filter((o) => o.op === "rect");
  assert.equal(rects.length, 2);
  assert.ok(rects.every((r) => !r.fill), "nothing shaded");
  assert.equal(x.script.ops.filter((o) => o.op === "line").length, 0, "nothing cut");
  assert.equal(Math.round((rects[1].w / rects[0].w) * 60), 30);
  // not one unit, or not quantities: no view
  assert.equal(compareScaleOf({ left: { title: "Chikki", items: ["6 chikki"] }, right: { title: "Bachche", items: ["5 bachche"] } }), null);
  assert.equal(compareScaleOf({ left: { title: "laal card", items: ["16 cm aur 9 cm"] }, right: { title: "neela card", items: ["20 cm aur 6 cm"] } }), null);
  assert.equal(compareScaleOf({ left: { title: "Ribbon", items: ["5 metre"] }, right: { title: "Banners", items: ["4 banners"] } }), null);
  assert.equal(compareScaleOf({ left: { title: "3 bachche", items: ["2 roti"] }, right: { title: "5 bachche", items: ["2 roti"] } }), null, "bars all one length draw nothing new");
  assert.equal(expand({ ...call, mark: { side: "left" } }).ok, false, "the scale view draws no answer mark");
});

test("angle@1 tester (item 2): each angle with the right-angle tester laid on it — one corner size for the board, its corner on the angle's, one edge along the first arm; no word naming less, equal or more", () => {
  const all = boards("angle@1").map((b) => ({ ...b, v: viewOf(b.ref, b.at) }));
  // (an answer board's mark — the answer — is never laid under a tester: those keep no view)
  for (const b of all.filter((x) => x.ref.params.mark != null)) assert.equal(b.v, null, b.at);
  const got = all.filter((x) => x.ref.params.mark == null);
  assert.ok(got.length >= 9);
  for (const b of got) {
    assert.deepEqual(b.v, { template: "angle@1", view: "tester", kind: "figure" }, b.at);
    const pt = viewed(b.ref, "tester");
    const held = expand({ template: "angle@1", ...b.ref.params }).script, view = pt.view.script;
    // the view's words are the board's words; its counts the board's
    assert.deepEqual(texts(view).sort(), texts(held).sort(), b.at);
    assert.deepEqual(counts(pt.view.call), counts({ template: "angle@1", ...b.ref.params }), b.at);
    // one tester per angle: a square, its corner on the angle's corner (the accent dot), its bottom edge along the first arm
    const testers = view.ops.filter((o) => /^q\d$/.test(o.id)), dots = view.ops.filter((o) => o.op === "circle" && o.fill === "accent");
    assert.equal(testers.length, b.ref.params.angles.length, b.at);
    const sides = new Set(testers.map((q) => Math.round(q.points[1][0] - q.points[0][0])));
    assert.equal(sides.size, 1, `${b.at}: one tester size`);
    testers.forEach((q, i) => {
      assert.ok(Math.hypot(q.points[0][0] - dots[i].c[0], q.points[0][1] - dots[i].c[1]) < 1.5, `${b.at}: the tester's corner on angle ${i + 1}'s corner`);
      const [p0, p1, p2] = q.points;
      assert.ok(p1[1] === p0[1] && p2[0] === p1[0] && Math.abs((p1[0] - p0[0]) - (p1[1] - p2[1])) < 0.2, "a square corner, one edge along the first arm");
      assert.notEqual(q.ink, "accent", "drawn lighter than the angle");
    });
    // a 90° angle keeps its mark
    b.ref.params.angles.forEach((a, i) => { if (a.deg === 90) assert.ok(view.ops.some((o) => o.id === `m${i}` && o.points?.length === 3)); });
    assert.ok(!/\b(kam|chhota|bada|zyada|barabar|less|more|equal|smaller|bigger)\b/i.test(texts(view).filter((t) => !texts(held).includes(t)).join(" ")));
  }
  // a reflex angle, or an answer board's mark: no tester view
  assert.equal(expand({ template: "angle@1", angles: [{ deg: 300 }], tester: true }).ok, false);
  assert.equal(expand({ template: "angle@1", angles: [{ deg: 60 }, { deg: 90 }], mark: { index: 0 }, tester: true }).ok, false);
  assert.equal(viewOf({ template: "angle@1", params: { angles: [{ deg: 300 }] } }), null);
});

test("fraction-line@1 strips (item 5): a line past 1, with two scales past 1, or with a fraction to place is its wholes as strips end to end — the line's counts, the line's words, a mark shaded up to it, a fraction to place not drawn", () => {
  // (the posing boards: an answer board's two marks — "6/3" and "7/3" on one scale — have no strips view, and need none)
  const got = boards("fraction-line@1").filter((b) => !b.at.includes("answerBoard") && (b.ref.params.target != null || Number(b.ref.params.to ?? 1) > 1));
  assert.ok(got.length >= 15);
  for (const b of got) {
    const p = b.ref.params, held = { template: "fraction-line@1", ...p };
    assert.deepEqual(viewOf(b.ref, b.at), { template: "fraction-line@1", view: "strips", kind: "strip" }, b.at);
    const pt = viewed(b.ref, "strips"), view = pt.view.script, w = Number(p.to ?? 1), dens = p.dens ?? [p.den];
    assert.deepEqual(counts(pt.view.call), counts(held), `${b.at}: the line's counts`);
    // one strip per whole per scale, all of one width; the words are the line's (its whole numbers, its mark labels, "?")
    const strips = view.ops.filter((o) => /^w\d\d$/.test(o.id));
    assert.equal(strips.length, w * dens.length, b.at);
    assert.equal(new Set(strips.map((r) => r.w)).size, 1);
    const own = new Set([...Array.from({ length: w + 1 }, (_, j) => String(j)), "?", ...(p.marks ?? []).map((m) => (Array.isArray(m) ? `${m[0]}/${m[1]}` : String(m.label ?? `${m.num}/${p.den}`))), ...(p.hop ? [`${p.hop.num}/${p.den}`] : [])]);
    for (const t of texts(view)) assert.ok(own.has(t), `${b.at}: "${t}" is not the line's`);
    // shaded: up to the one mark (given or asked), as many parts as its numerator; a fraction to place shades nothing
    const shaded = view.ops.filter((o) => o.op === "rect" && o.fill).reduce((a, o) => a + o.w + 4, 0), pw = strips[0].w / (dens[0]);
    const want = p.mark ?? (p.marks?.length ? (Array.isArray(p.marks[0]) ? p.marks[0][0] * (dens[0] / p.marks[0][1] === 1 ? 1 : 0) || p.marks[0][0] : p.marks[0].num) : 0);
    if (p.target != null || !(p.mark ?? p.marks?.length)) assert.equal(shaded, 0, `${b.at}: nothing shaded`);
    else if (!p.dens) assert.ok(Math.abs(shaded / pw - want) < 0.05, `${b.at}: ${shaded / pw} parts shaded, want ${want}`);
    if (p.mark != null) assert.ok(texts(view).includes("?"), "an asked mark is named ?");
  }
});

test("fraction-bars@1 three bars (item 5): three circles of the same parts side by side, the shading kept, no name written", () => {
  // (d32 reader fixes, 2026-11-19: the seven scripts hold 5 such boards (four posing, one then-card), down from 8: cards moved from
  // three bars to wholes boards; each one left still gets its three circles)
  const got = boards("fraction-bars@1").filter((b) => !b.at.includes("answerBoard") && b.ref.params.bars.length === 3);
  assert.ok(got.length >= 5, `${got.length}`);
  for (const b of got) {
    assert.deepEqual(viewOf(b.ref, b.at), { template: "wholes@1", view: "wholes", kind: "circle" }, b.at);
    const pt = viewed(b.ref, "wholes");
    const bars = b.ref.params.bars, ws = counts(pt.view.call).wholes;
    assert.deepEqual(ws.map((x) => [x.parts, x.shaded]), bars.map((x) => [x.parts, x.shade ?? 0]), b.at);
    assert.deepEqual(texts(pt.view.script), [], "no word on the view");
  }
});

test("equal-groups@1 rows (item 5): unequal groups as rows of cells from one edge, each size written at its row's end as the board writes it", () => {
  // (an answer board's equal share beside the groups — equalTo — is the answer: no rows view)
  const got = boards("equal-groups@1").filter((b) => Array.isArray(b.ref.params.sizes) && new Set(b.ref.params.sizes).size > 1 && b.ref.params.equalTo == null);
  assert.ok(got.length >= 2);
  for (const b of got) {
    assert.deepEqual(viewOf(b.ref, b.at), { template: "equal-groups@1", view: "rows", kind: "grid" }, b.at);
    const pt = viewed(b.ref, "rows"), view = pt.view.script, sizes = b.ref.params.sizes;
    assert.deepEqual(counts(pt.view.call), counts({ template: "equal-groups@1", ...b.ref.params }), b.at);
    assert.deepEqual(texts(view), sizes.map(String));
    const rows = view.ops.filter((o) => /^g\d$/.test(o.id));
    assert.equal(new Set(rows.map((r) => r.at[0])).size, 1, "every row from one edge");
    assert.deepEqual(rows.map((r) => Math.round(r.w / (rows[0].w / sizes[0]))), sizes, "a row as long as its group");
  }
});

test("shape@1 / measured@1 radii (item 3): a circle whose radius the board draws gets that radius at three places, a third of a turn apart (no diameter), under the board's own label", () => {
  const circles = [...boards("shape@1"), ...boards("measured@1")].filter((b) => b.ref.params.shape === "circle");
  for (const b of circles) {
    const p = b.ref.params, v = viewOf(b.ref, b.at), call = BF.altCall(b.ref);
    if (b.ref.template === "shape@1" && !p.radius) { assert.equal(call, null, `${b.at}: no radius drawn, no view`); continue; }
    assert.equal(call?.view, "radii", b.at);
    const x = expand(Object.fromEntries(Object.entries(call).filter(([k]) => k !== "view")));
    assert.ok(x.ok, x.errors.join());
    const arrows = x.script.ops.filter((o) => /^rad\d$/.test(o.id)), rim = x.script.ops.find((o) => o.op === "circle" && !o.fill);
    assert.equal(arrows.length, 3);
    for (const a of arrows) assert.ok(Math.abs(Math.hypot(a.to[0] - a.from[0], a.to[1] - a.from[1]) - rim.r) < 1, "centre to rim");
    const ang = arrows.map((a) => Math.atan2(a.to[1] - a.from[1], a.to[0] - a.from[0]));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.abs(Math.abs(ang[i] - ang[j]) - Math.PI) > 0.3, "no two radii make a diameter");
    const held = expand({ template: b.ref.template, ...p }).script;
    assert.deepEqual([...new Set(texts(x.script))].sort(), [...new Set(texts(held))].sort(), `${b.at}: the board's words only`);
    assert.deepEqual(x.script.facts.counts, held.facts.counts);
    // (drawn beside the held board where that board itself lays out in the split's left panel)
    if (v) assert.equal(v.view, "radii");
  }
});
