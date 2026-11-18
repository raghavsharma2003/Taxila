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
  assert.deepEqual([...new Set(scaled.map(titles))].sort(), ["Chocolate | Hisse", "Ganna | Ek hissa", "Rahul | Sana", "Ribbon A | Ribbon B", "Ribbon P | Ribbon Q", "Ribbon | Hisse"]);
  for (const b of got.filter((b) => !b.v)) assert.equal(compareScaleOf(b.ref.params), null, `${b.at}: ${titles(b)}`);
  assert.ok(["Bhuja | Tester", "Chikki | Bachche", "Laddoo | Bachche", "Ribbon | Banners", "laal card | neela card", "3 bachche | 5 bachche"].every((t) => got.some((b) => !b.v && titles(b) === t)));
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
