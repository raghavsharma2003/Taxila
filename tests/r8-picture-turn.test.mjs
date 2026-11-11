// main v6.10 P6 (dc-r7-script-walk-v6-10; director18: 9 of 16 picture turns spoke a picture line over a board "kept" with no
// view beside it — the line and the drawing came from two calls). board-first pictureTurn returns the held board, the view
// beside it and her picture line built from THAT view, in one call; no view → view null AND line null. Fixtures: every card,
// ask and worked board the four pilots script (data/lesson-scripts: c4-t01, c5-t01, c5-t02, c6-t01), each through
// pictureTurn with its own key live: a view whose line names only numbers the view draws, or no view and no line. The boards
// that cannot produce a view today are listed by template and reason (NO_VIEW): main's director19 reversal reads this list.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as BF from "../server/stagecraft/board-first.js";
import * as seam from "../server/studio/seam.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];
/** Every scripted board of a pilot (not answer or bridge boards), with the key live on it. */
function boardsOf(T) {
  const j = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T}.json`, import.meta.url), "utf8"));
  const out = [];
  const walk = (o, p) => {
    if (!o || typeof o !== "object") return;
    if (o.board?.template) {
      const key = o.key ?? o.ask?.key ?? null;
      out.push({ T, path: `${p}/board`, ref: o.board, answers: key == null ? [] : [String(key)] });
    }
    for (const [k, v] of Object.entries(o)) if (!["board", "answerBoard", "bridgeBoard"].includes(k)) walk(v, `${p}/${k}`);
  };
  walk(j, "");
  return out;
}
const askOf = (b) => ({ intent: { intentId: `pt:${b.T}${b.path}`, lessonId: "pt", kind: "whiteboard", style: { band: "B3" }, boardRef: b.ref,
  scriptBeat: { kind: "check", ownBoard: true, answers: b.answers }, held: { board: b.ref, unit: b.path }, request: { kind: "show" } }, line: { text: "" }, mode: "fresh" });
const numsIn = (v) => (JSON.stringify(v).match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

/** The boards with no second view today, by template — why, and which of the pilots' boards. */
const NO_VIEW = {
  "shape@1": "a named outline with free-text labels (\"5 cm\", \"parimap 60 m\"): no numbers to lay out again",
  "compare@1": "a word board: two titled lists; only a compare naming two whole cut into pieces has one (wholes)",
  "fraction-line@1": "beyond one whole (to 2 or 3), a target to place, or a two-scale line whose marks are the key",
  "fraction-bars@1": "three unnamed bars (no view without inventing a name), or a two-scale line view that does not lay out in the split's 320-wide panel (c5-t02 worked 1/6 and 1/3)",
  "shade-grid@1": "a grid with nothing shaded and its total hidden (\"1/3 of 15\": the grid IS the question)",
  "equal-groups@1": "unequal sizes [6, 3, 3] (no equal grid)",
  "measured@1": "(none today: the six-sided strip lays out since v6.11)",
};

test("P6: pictureTurn — every pilot card and worked board gets its view, with a line naming only what the view draws, or no view and no line (never a line without a view)", () => {
  const byT = {}, none = [];
  for (const T of PILOTS) for (const b of boardsOf(T)) {
    const pt = BF.pictureTurn(askOf(b), {});
    assert.ok(pt?.board?.script, `${b.T}${b.path}: the held board draws`);
    const t = b.ref.template; byT[t] ??= { n: 0, view: 0 }; byT[t].n++;
    if (!pt.view) {
      assert.equal(pt.line, null, `${b.T}${b.path}: no view → no line`);
      assert.equal(pt.layout.split, false);
      assert.ok(NO_VIEW[t], `${b.T}${b.path} (${t}) has no view and no listed reason`);
      none.push(`${t} ${b.T}${b.path}`);
      continue;
    }
    byT[t].view++;
    assert.ok(pt.line && !/[.?!]$/.test(pt.line), `${b.T}${b.path}: a line, ending clean`);
    assert.ok(pt.script && pt.layout.split && pt.layout.panels[1].template === pt.view.template, `${b.T}${b.path}: the view is drawn beside`);
    // every number her line names is on the view (its call — what is drawn — and its words)
    // (a count of drawn things — 3 sides, 2 bars — is on the view as that many: the lengths of the call's lists)
    const counts = Object.values(pt.view.call).filter(Array.isArray).map((a) => a.length);
    const onView = new Set([...numsIn(pt.view.call), ...counts, ...numsIn(pt.view.script.ops.filter((o) => o.op === "text").map((o) => o.text))]);
    for (const n of numsIn(pt.line)) assert.ok(onView.has(n), `${b.T}${b.path}: "${pt.line}" names ${n}, not on the view (${[...onView].join(",")})`);
    for (const k of b.answers) if (/^\d+(\/\d+)?$/.test(k)) assert.ok(!new RegExp(`(^|[^\\d/])${k.replace("/", "\\/")}(?![\\d/])`).test(pt.line), `${b.T}${b.path}: the line states the key ${k}`);
  }
  // (the pilots' coverage today, so a regression shows as a count: views / boards per template)
  const got = Object.fromEntries(Object.entries(byT).map(([t, v]) => [t, `${v.view}/${v.n}`]));
  // (Brain, merging Learning D13 60740c37 with this: c4 s2's new e3 boards — 20 marbles as 2 groups of 10 — draw no view, so
  // equal-groups is 6/10 on D13's data, 8/10 before it; Studio to say whether those two boards should get one)
  assert.deepEqual(got, {
    "fraction-parts@1": "13/13", "wholes@1": "17/17", "shade-grid@1": "1/4", "equal-groups@1": "8/10", "compare@1": "1/3",
    // (round 8 board grammar, C1: 16 → 17 and 42 → 47 — with fractions stacked, five more
    // two-scale line views and one bars view now lay out in the split's panel; every one passes the per-view checks above)
    "fraction-bars@1": "17/19", "fraction-line@1": "47/65", "measured@1": "20/20", "shape@1": "1/7" }, JSON.stringify(got));
  void none;
});

test("P6: a picture turn with a view is never \"kept\" — the board up is the same held board (director18 c4 steady 18: drawn \"kept\", one page, the picture line spoken)", () => {
  const ref = { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "roti" } };
  const ask = (request) => ({ intent: { intentId: `k:${!!request}`, lessonId: "k", kind: "whiteboard", style: { band: "B3" }, boardRef: ref, scriptBeat: { kind: "check", ownBoard: true, answers: ["No"] },
    held: { board: ref, unit: "s1:e1" }, ...(request ? { request } : {}) }, line: { text: "" }, mode: "fresh" });
  const up = BF.heldBoard(ask(null), {});
  const keep = { keepRef: up.lastRef, keepPage: up.lastPage };
  const pt = BF.pictureTurn(ask({ kind: "show" }), keep);
  assert.equal(pt.line, "Wahi poora ab patti mein hai: 2 barabar hisse, 1 rangin, yaani aadha");
  // the take decides nothing again: the decided picture is drawn even when the take's own ask has lost its request
  const took = BF.heldBoard(ask(null), { ...keep, picture: pt });
  assert.ok(took.split && !took.kept && took.source === "held");
  assert.equal(took.altLine, pt.line);
  assert.deepEqual(took.layout, pt.layout);
  // ... and a decided "no view" draws no view even when the take's ask asks for one
  const none = { ...pt, view: null, line: null, script: null, layout: { split: false } };
  assert.ok(!BF.heldBoard(ask({ kind: "show" }), { ...keep, picture: none }).split);
  // (heldAltOf is the same call's view and line)
  assert.equal(BF.heldAltOf(ask({ kind: "show" }), keep).line, pt.line);
});

test("P6: production — the seam's take draws the picture its preselect decided (her line was built from it), even when the take's ask carries no request", async () => {
  const T = "c4-maths-ch05-t01", kit = kitFromFile(getTopic(T)), L = `p6-seam-${Date.now()}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 4, language_pref: "hinglish" } });
  const ref = { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "roti" } };
  const mk = (n, request) => ({ intent: { intentId: `${L}:wb:${n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { scriptId: "s", beatId: "e1", kind: "check", ownBoard: true, answers: ["No"] }, held: { board: ref, unit: "s1:e1" }, ...(request ? { request } : {}) },
    line: { lessonId: L, teacherReplySeq: n, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } });
  const run = async (a, text) => { let k = seam.studioSeam.requestIntent({ ...a, line: { ...a.line, text } }); if (k?.state === "planning" && k.ready) k = await k.ready; return k; };
  seam.studioSeam.preselectWhiteboard(mk(1, null));
  assert.equal((await run(mk(1, null), "Ek roti ke 2 barabar tukde, ek rangin.")).state, "revealed");
  seam.studioSeam.preselectWhiteboard(mk(2, { kind: "show" }));
  const line = seam.studioSeam.preselectedAltLine(L);
  assert.equal(line, "Wahi poora ab patti mein hai: 2 barabar hisse, 1 rangin, yaani aadha");
  const k = await run(mk(2, null), `${line}. Toh kya rangin hissa 1/1 hua, haan ya nahi?`);
  assert.equal(k.state, "revealed");
  assert.ok(k.artifact.split, "the view her line describes is drawn");
  assert.equal(k.artifact.layout.split, true);
});

test("v6.10 (director18 c5-t02 offtopic 10, c6 offtopic 10 and steering 28): a new held board never goes up under a joint — the board up stays through her leading aside, the new one comes in at her first unit part; a line of joints only changes nothing", () => {
  const RECT = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 14, h: 9 } };
  const PENT = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"] } };
  const ask = (board, text, list) => ({ intent: { intentId: `j:${text.length}`, lessonId: "j", kind: "whiteboard", style: { band: "B3" }, boardRef: board, scriptBeat: { kind: "check", ownBoard: true },
    held: { board, unit: board === RECT ? "s1:c1" : "s1:c2" } }, line: { text, ...(list ? { parts: { list } } : {}) }, mode: "fresh" });
  const up = BF.heldBoard(ask(RECT, "Ek label 14 cm lamba aur 9 cm chauda hai."), {});
  const keep = { keepRef: up.lastRef, keepPage: up.lastPage };
  const ack = "Theek hai. Achha, yeh jaankar achha laga.", card = "Paanch kono wale khet PQRST mein PQ 8 m hai. Parimap kitna hai?";
  const t = BF.heldBoard(ask(PENT, `${ack} ${card}`, [{ part: "aside", text: ack }, { part: "card", text: card }]), keep);
  assert.equal(t.screens.length, 2, "the board up, then the new one");
  assert.equal(t.screens[1].from, ack.length + 1, "the switch is at her card, not at char 0");
  assert.equal(t.lastRef, BF.refKey(PENT));
  const only = BF.heldBoard(ask(PENT, ack, [{ part: "aside", text: ack }]), keep);
  assert.ok(only.kept && only.lastRef === keep.keepRef && only.screens.length === 1, "joints only: the board up stays");
  // (no parts list, or no leading joint: as before — the held board from char 0)
  assert.equal(BF.heldBoard(ask(PENT, card, [{ part: "card", text: card }]), keep).screens.length, 1);
  assert.equal(BF.heldBoard(ask(PENT, card), keep).lastRef, BF.refKey(PENT));
});

test("v6.11 (director19 c5-t02 11 turns, c5-t01 3, c4 steady 46): the board up holds until her first unit part WHATEVER the intent says — a switchTo inside her joints moves to her first unit part; a switch with a joints-only line changes nothing", () => {
  const RECT = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 14, h: 9 } };
  const PENT = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"] } };
  const ask = (held, text, list) => ({ intent: { intentId: `j11:${text.length}:${JSON.stringify(held.switchTo?.atChar)}`, lessonId: "j11", kind: "whiteboard", style: { band: "B3" }, boardRef: held.board, scriptBeat: { kind: "check", ownBoard: true },
    held }, line: { text, ...(list ? { parts: { list } } : {}) }, mode: "fresh" });
  const up = BF.heldBoard(ask({ board: RECT, unit: "s1:c1" }, "Ek label 14 cm lamba aur 9 cm chauda hai."), {});
  const keep = { keepRef: up.lastRef, keepPage: up.lastPage };
  const ack = "Theek hai. Achha, yeh jaankar achha laga.", card = "Paanch kono wale khet PQRST mein PQ 8 m hai. Parimap kitna hai?";
  const parts = [{ part: "aside", text: ack }, { part: "card", text: card }];
  // (the held board is the one up, and the intent switches to the next card INSIDE her aside: the switch waits for her card)
  for (const atChar of [0, 5]) {
    const t = BF.heldBoard(ask({ board: RECT, unit: "s1:c1", switchTo: { board: PENT, unit: "s1:c2", atChar } }, `${ack} ${card}`, parts), keep);
    assert.equal(t.screens.length, 2, `atChar ${atChar}`);
    assert.equal(t.screens[1].from, ack.length + 1, `atChar ${atChar}: the switch is at her card`);
    assert.equal(t.lastRef, BF.refKey(PENT));
  }
  // (a switch the intent puts after her first unit part stays where it was)
  const late = ack.length + 1 + card.indexOf("Parimap");
  assert.equal(BF.heldBoard(ask({ board: RECT, unit: "s1:c1", switchTo: { board: PENT, unit: "s1:c2", atChar: late } }, `${ack} ${card}`, parts), keep).screens[1].from, late);
  // (joints only: nothing changes, whatever the switch says)
  const only = BF.heldBoard(ask({ board: RECT, unit: "s1:c1", switchTo: { board: PENT, unit: "s1:c2", atChar: 3 } }, ack, [{ part: "aside", text: ack }]), keep);
  assert.ok(only.kept && only.lastRef === keep.keepRef && only.screens.length === 1);
});
