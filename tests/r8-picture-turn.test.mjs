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
  "shape@1": "a named outline with free-text labels (\"parimap 60 m\", \"baad 84 m\"): the perimeter is a label, not a length the template knows, and a rectangle's strip to scale would show its asked side by eye; a named pentagon has no lengths",
  "compare@1": "a word board: two titled lists; only a compare naming two wholes cut into pieces (wholes) or listing lengths in one unit (Studio 014: scale) has one — c6's \"16 cm aur 9 cm\" items are two lengths each",
  "fraction-line@1": "(none on the pilots since Studio 014: a line past 1, two scales past 1, or a target to place is drawn as whole strips end to end; a count key it would cut still has none)",
  "fraction-bars@1": "(none on the pilots since Studio 014: three bars are three circles) — but d33 (2026-11-23): c5-t01 s2's worked board, one unshaded whole bar with its ends, has none; Studio to say",
  "shade-grid@1": "a grid with nothing shaded and its total hidden (\"1/3 of 15\": the grid IS the question — grouping it any way is the answer or a split the card did not ask)",
  "equal-groups@1": "(none on the pilots since Studio 014: unequal sizes are rows from one edge)",
  "measured@1": "c6 s3 e3's 12 × 8 m garden (name, trace and a two-line mix-up): its unrolled view is built, but the held board itself does not lay out in the split's left panel (\"rectangle\" and \"perimeter\" meet at panel scale, the mix-up runs below the board)",
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
  // (Learning's reader pass over the live pilots, 2026-11-11: c4 s1 e4 moved to a two-strip bars board (fraction-parts 13 → 12,
  // bars 17/19 → 19/21), c4 s2 c2 to an equal-groups board (shade-grid 4 → 3, equal-groups 10 → 11, no view yet), and c6 s3 e3
  // from shape@1 to measured@1 so its 12 m and 8 m sides show (no view: its view's line would ask the 40 m total, the card's key
  // being 38); Studio to say whether the new equal-groups and measured boards should get views. Round 2: five c6 remediations
  // got boards of their own (measured 21 → 25, every one with a view; shape 6 → 7). Round 3: c5-t02 s3 c1 became a three-bar
  // ordering card (bars 21 → 22, line 65 → 64; the new bars board has no view yet))
  // (round 4: the remediation boards a general say no longer speaks were removed — D12's held-board rule — so c4, c5-t01 and c6
  // each lose their own copies: parts 12 → 11, equal-groups 11 → 9, line 64 → 62, measured 25 → 21, shape 7 → 6)
  assert.deepEqual(got, {
    // (Learning 015 and main, dc-r8-director26 B1, 2026-11-17: remediations and their second wordings got boards where their own
    // words speak the board; twelve boards a general say did not speak were dropped or moved to the wording that speaks them (the
    // D12 rule, tests/r7-board-ref) — parts 11 → 12, wholes 17 → 20, equal-groups 8 → 9, bars 28 → 35 (25 → 32 views), shape 7 → 8.
    // The new equal-groups and shape boards have no second view: a picture asked for on them redraws the held board with no line)
    // (main, d29 dry read, 2026-11-18: c4's skill 2 and skill 3 worked examples lost their boards of words — the skill 2 one showed the
    // asked step's answer — for the pencils' grid and the two chocolates' bars: compare 4 → 2, shade-grid 5 → 6, wholes 21 → 22)
    // (Learning 020 rewrites, dc-r8-director31, 2026-11-18: one more fraction-parts board and one more equal-groups board, each with its view:
    // parts 10/10 → 11/11, equal-groups 6/9 → 7/10; every per-board assertion above still holds for them)
        // (Studio 014, dc-r8-director31 item 5, 2026-11-18: three unequal-groups boards get the rows view (equal-groups 7/10 → 10/10), three
    // three-bar boards the three-circle view (bars 33 → 36), eighteen lines past 1 / with a target the strips view (line 43 → 61);
    // every per-board assertion above holds for each, and no board that had a view changed it)
    // (d32 reader fixes, 2026-11-19: c5-t02 s3 e3's point moved from a compare word table to bars of 3/5 and 3/8 (compare 1/2 → 0/1),
    // and fraction cards moved between bars and wholes boards (bars 36 → 34, wholes 22 → 25), every one with its view; every per-board
    // assertion above holds for each)
    // (d33 rewrites, 2026-11-23: cards moved between bars, lines and wholes boards — wholes 25 → 28, line 61 → 62, bars 34 → 33 — every
    // one with its view but c5-t01 s2's worked board, one unshaded whole bar with its ends (bars 33 views of 34 → 32 of 33): no view, no
    // line; for Studio to say whether it should get one)
    "fraction-parts@1": "12/12", "wholes@1": "28/28", "shade-grid@1": "1/6", "equal-groups@1": "10/10", "compare@1": "0/1",
    // (round 8 board grammar, C1: 16 → 17 and 42 → 47 — with fractions stacked, five more
    // two-scale line views and one bars view now lay out in the split's panel; every one passes the per-view checks above)
    // (Learning director22, 2026-11-15: the teachbacks' own boards and the reworked cards add boards: bars 22 → 24 (c5-t02's
    // teachback and one recast card, one with a view), line 62 → 63 with one view fewer (c5-t01's reversed s1 rem0 then-card asks
    // how many marks, so it draws no view and no line), measured 21 → 22 (c6's teachback wire, with a view))
    // (main on director22: a view is no longer withheld because neither caption is clean — it is drawn with a line that names
    // nothing in it; bars 20 → 21)
    // (director22 clause 8 rewrite, 2026-11-15: c4 s2 e1's point and card moved from 4 groups of 3 to 12 loose laddoos (equal-groups
    // 9 → 7, shade-grid 3 → 5, neither with a view: the grid IS the question), c4 s2 rem0 got its own 5-bags board (equal-groups
    // 7 → 8, with a view); four c5-t02 cards moved from a two-scale line to two unshaded strips (line 63 → 59 and 45 → 41 views,
    // bars 24 → 28, every one with a view); c6 s2 c2 shows both cards on a compare board (measured 22 → 21, compare 3 → 4, no
    // view); c6 s3 rem0's second wording draws its own outline (shape 6 → 7, no view))
    // (Learning 016, dc-r8-director27 C, 2026-11-17: c4 s1's rope-and-paper remediation gets its own board, spoken (wholes 20 → 21,
    // with a view); c5-t01 s1's whole-number-bias remediation gets its own halves-and-fifths line (line 59 → 60, with a view) and its
    // count-marks remediation's line is the sevenths only, no longer the then-card's two scales (still one line, with a view). The
    // c5-t02 gap-thinking boards moved from a second wording or a hint to the remediation itself: bars unchanged)
    // (Learning 017 C, dc-r8-director28: c5-t02 S1 e2's point is drawn on both strips (fraction-parts 12 → 10, bars 35 → 36, with a
    // view); S2 e2's point on a 7-gap line (fraction-parts 10, line 60 → 61, with a view); c5-t01's redrawn remediation and point
    // boards stay lines)
    // (2026-11-23, main: c5-t01 s2's worked board moved from the uncut fraction-bars strip to the bare fraction-line@1 { den 1 },
    //  which has no view, as the strip had none: bars 32/33 → 32/32, line 62/62 → 62/63)
    // (d35 closing item 5, Learning 023's board edits — rule 1, stated values over boards that draw them, and the Part 2 rows: c5-t02's
    //  and c6-ch07-t01's points and cards redrawn, c5-t01 s3's worked steps given result boards: parts 11 → 12, bars 32 → 31, line
    //  62/63 → 63/64, every new board with a view)
    "fraction-bars@1": "31/31", "fraction-line@1": "63/64", "measured@1": "20/21", "shape@1": "1/8" }, JSON.stringify(got));
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

// ── director20 (docs/design/round7/judgements/director20-2026-11-11.md, mechanism 10): a picture line never gives the open
// card's key and never ships with a hole. The asks are built as the Director builds them (scriptBeat.answers = [key, ...accept],
// server/director/state.js answersOf) from the two cards the rows were on.
const scriptCard = (T, skill, id) => {
  const j = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T}.json`, import.meta.url), "utf8"));
  const e = j.skills[skill].explain.find((x) => x.id === id);
  return { ref: e.board, answers: [String(e.ask.key), ...(e.ask.accept ?? []).map(String)] };
};
const askWith = (ref, answers) => askOf({ T: "d20", path: "/x", ref, answers });

test("director20 c4 steady 18: a picture line gives no key — \"1 rangin, yaani aadha\" over the card whose key is No (accepted as \"nahi, 1/2 hai\"), and over a sentence key \"No, it's ½\"", () => {
  const c = scriptCard("c4-maths-ch05-t01", 0, "e1");
  // (director22 clause 8 rewrite, 2026-11-15: the card now asks "1/2 ya 1/1?" over this roti, so its board hides the 1/2 and
  // names the coloured piece instead — hideResult, legend; the key is 1/2, and the picture line still states none of it)
  assert.deepEqual(c.ref, { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "roti", hideResult: true, legend: true } }, "the row's card");
  assert.ok(c.answers.includes("1/2") && c.answers.includes("aadha"), "the card's key is the half");
  for (const answers of [c.answers, ["No, it's ½"], ["No, it's 1/2"], ["nahi, aadha hai ya ½"]]) for (const variant of [0, 1]) {
    const pt = BF.pictureTurn(askWith(c.ref, answers), { variant });
    assert.ok(pt?.view && pt.line, `${answers[0]} v${variant}: the view stays`);
    assert.ok(!/aadha|1\/2|½|yaani/.test(pt.line), `${answers[0]} v${variant}: "${pt.line}" states the key`);
    assert.equal(pt.line, variant ? "Ab isi ko patti bana kar dekho: 2 barabar hisse, 1 rangin" : "Wahi poora ab patti mein hai: 2 barabar hisse, 1 rangin");
  }
});

test("director20: lineStatesKey reads a key's value tokens wherever they stand — ½ ¼ ¾ ⅓ … as a/b, a/b inside words, an integer only in a short key with one integer", () => {
  const S = BF.lineStatesKey;
  assert.ok(S("1 rangin, yaani aadha", ["No, it's ½"]));
  assert.ok(S("yeh 1/2 hai", ["No, it's ½"]) && S("yeh ½ hai", ["No, it's ½"]) && S("do-chauthai", ["No, it's ½"]));
  assert.ok(S("teen-chauthai", ["haan, ¾"]) && S("ek-tihaai", ["⅓ hai"]) && S("1/8", ["⅛"]) && S("2/8", ["nahi, ¼ hai"]));
  assert.ok(S("yaani aadha", ["nahi, 1/2 hai"]), "a/b inside words");
  assert.ok(S("8 barabar gaps", ["8 gaps"]) && S("aath gaps", ["No, it's 8"]), "an integer in a short key");
  // (the bound: an integer counts only in a key of at most KEY_INT_WORDS words with exactly one integer outside its fractions)
  assert.ok(!S("2 tukde", ["12 laddoo 2 barabar group mein jaayein toh har group mein 6"]), "a long sentence key's incidental integer");
  assert.ok(!S("2 tukde", ["2 × 6 = 12"]), "several integers: none is the key");
  assert.ok(!S("1 rangin, 2 barabar hisse", ["No, it's ½"]), "the fraction's own digits are not integer keys");
  assert.ok(!S("1 rangin", ["No"]) && !S("aadha", ["Yes"]), "a key with no value states nothing");
  // (unchanged for the plain keys every caller passed before)
  assert.ok(S("yaani aadha", ["1/2"]) && S("2/4", ["1/2"]) && S("aath", ["8"]) && !S("18 cm", ["8"]));
});

test("director20 c5-t01 steady and stuck 18: a picture line never has a hole — the quiet 8-gap scale is named without its count, never \"aur ek ___ barabar hisson mein\"", () => {
  // (Learning's reader pass, c4881b652: the live c5-t01 e2 now says 7 marks over a dens [7, 8] board, so its picture line no
  // longer names a 5. The director20 row is pinned here as it was; the live card is checked for holes and keys just below.)
  const c = { ref: { template: "fraction-line@1", params: { dens: [5, 8], from: 0, to: 1, marks: [[1, 5]] } }, answers: ["8", "8 gaps", "8 barabar gaps", "aath", "eight"] };
  const live = scriptCard("c5-maths-ch02-t01", 0, "e2");
  assert.equal(live.answers[0], "8");
  for (const variant of [0, 1]) {
    const pt = BF.pictureTurn(askWith(live.ref, live.answers), { variant });
    assert.ok(pt?.view, `live v${variant}: the view stays`);
    if (pt.line) assert.ok(!BF.lineHasBlank(pt.line) && !BF.lineStatesKey(pt.line, live.answers), `live v${variant}: "${pt.line}"`);
  }
  const want = [
    "Dekho, yeh do barabar pattiyaan hain: ek 5 barabar hisson mein, 1 rangin, yaani ek bata paanch, aur doosri patti bhi barabar hisson mein bati hai",
    "Ab in do pattiyon ko milao: pehli 5 barabar hisson mein, 1 rangin, yaani ek bata paanch, aur doosri patti bhi barabar hisson mein bati hai",
  ];
  for (const variant of [0, 1]) {
    const pt = BF.pictureTurn(askWith(c.ref, c.answers), { variant });
    assert.ok(pt?.view, `v${variant}: the view stays (the 8-gap bar drawn unnamed)`);
    assert.equal(pt.line, want[variant]);
    assert.ok(!BF.lineHasBlank(pt.line) && !BF.lineStatesKey(pt.line, c.answers), `v${variant}: "${pt.line}"`);
  }
});

test("director20: the picture-line predicate — a line with a blank or stating a key is rewritten (the other caption shape) or not said (no view)", () => {
  const H = BF.lineHasBlank;
  for (const l of ["aur ek ___ barabar hisson mein", "aur ek barabar hisson mein", "ek alag-alag tukde", "nishaan … par", "2 barabar hisse, , 1 rangin", "kul lambai [ ] hai", "1 rangin,"])
    assert.ok(H(l), `a blank: "${l}"`);
  for (const l of ["ek 5 barabar hisson mein", "doosri patti bhi barabar hisson mein bati hai", "Dekho, yeh ek patti hai, barabar hisson mein", "dono barabar gaps mein"])
    assert.ok(!H(l), `no blank: "${l}"`);
  const C = BF.cleanPictureLine;
  assert.equal(C(["2 barabar hisse, 1 rangin, yaani aadha", "x"], ["No, it's ½"]), "2 barabar hisse, 1 rangin", "the naming clause is dropped");
  assert.equal(C(["aur ek barabar hisson mein", "aur doosri patti bhi barabar hisson mein bati hai"], ["8"]), "aur doosri patti bhi barabar hisson mein bati hai", "rewritten in the other shape");
  assert.equal(C(["8 barabar hisse", "aath hisse"], ["8"]), null, "neither shape clean: not said");
  assert.equal(C(["aur ek ___ barabar hisson mein"], []), null, "a hole is never said, key or no key");
});

test("main 21:08 (director20 c5-t01 offtopic 28): a picture line states no value a card still to come in the skill asks for — nor a later 1/b by its count of parts", async () => {
  const ST = await import("../server/stagecraft/script-terms.js");
  const ask = (beatId) => ({ kit: { topicId: "c5-maths-ch02-t01" }, intent: { skillId: "c5-maths-ch02-t01-s1", scriptBeat: { beatId } } });
  // Integration 54: this pinned the live script's keys (["1/10", "1/4 km", "1/3"]) and broke when Learning's director22
  // pilot changed the checks (1/11, "the 1st mark"). The law is the walk order, not the values: what is still to come
  // after e2 is not empty and holds everything still to come after a later card.
  const afterE2 = ST.laterKeys(ask("e2")), afterC1 = ST.laterKeys(ask("c1"));
  assert.ok(afterE2.length >= 2 && afterC1.length < afterE2.length, "the cards after e2, in walk order (e3, worked, c1–c3)");
  assert.ok(afterC1.every((k) => afterE2.includes(k)), "what follows a later card also follows an earlier one");
  assert.deepEqual(ST.laterKeys(ask("c3")), [], "nothing after the last check");
  assert.ok(ST.laterKeys(ask("rem:x")).includes("8"), "an unknown beat counts every card in the skill");
  assert.deepEqual(ST.laterKeys({ kit: { topicId: "no-such-topic" }, intent: { skillId: "x" } }), []);
  assert.ok(ST.lineStatesCount("aur ek 12 barabar hisson mein", ["1/12"]) && ST.lineStatesCount("12 equal parts", ["1/12"]) && ST.lineStatesCount("0 se 1 tak 12 gaps", ["1/12"]));
  assert.ok(!ST.lineStatesCount("12 cm lambi", ["1/12"]) && !ST.lineStatesCount("12 barabar hisse", ["3/12"]), "only a unit fraction's count of parts");
  const C = BF.cleanPictureLine;
  assert.equal(C(["Dekho, yeh patti hai, aur ek 12 barabar hisson mein", "doosri patti bhi barabar hisson mein bati hai"], ["8"], { later: ["1/12"] }), "doosri patti bhi barabar hisson mein bati hai", "a later 1/12 by its count: the other shape");
  assert.equal(C(["nishaan 1/3 par", "yahan 1/3 hai"], ["8"], { later: ["1/3"] }), null, "a later card's key in both shapes: not said");
  assert.equal(C(["8 barabar gaps", "x"], [], { later: [] }), "8 barabar gaps", "no later keys: as before");
});

test("main 21:08 (director20 c6 stuck 18, steering 14): a picture line says the script's own terms — the form the script's Hinglish lines use", async () => {
  const ST = await import("../server/stagecraft/script-terms.js");
  const { scriptOf } = await import("../server/studio/approved.js");
  const c6 = ST.ownTerms(scriptOf("c6-maths-ch06-t01")), lines = ST.ownTerms(scriptOf("c6-maths-ch02-t01"));
  assert.ok(c6.some((t) => t.own === "triangle" && t.others.includes("tribhuj")), "c6-ch06's script says triangle");
  assert.equal(ST.inScriptTerms("Is tribhuj ki 3 bhujayein seedhi karke ek line par rakhi hain", c6), "Is triangle ki 3 bhujayein seedhi karke ek line par rakhi hain");
  assert.equal(ST.inScriptTerms("Tribhuj dekho", c6), "Triangle dekho", "case kept");
  assert.equal(ST.inScriptTerms("Yeh rekha hai aur yeh rekhakhand", lines), "Yeh line hai aur yeh line segment", "c6-ch02's script says line and line segment");
  assert.equal(ST.inScriptTerms("0 se 1 ki sankhya rekha", lines), "0 se 1 ki sankhya rekha", "a compound is never half-swapped");
  assert.equal(ST.inScriptTerms("ek tribhuj", []), "ek tribhuj", "no terms: unchanged");
  // a term the script says both ways equally, or never, is left alone
  assert.deepEqual(ST.ownTerms({ terms: [{ hi: "rekha", en: "line" }], skills: [{ explain: [{ say: { hi: "ek rekha, ek line" } }] }] }), []);
});

test("main on director22: a view whose captions cannot be said clean is still drawn, with a line that names nothing in it", () => {
  // (director22: with the later-keys rule 10 of 12 picture requests in the three fraction pilots drew no view, and she said a
  // picture could not be made. The run's rows: 6 of 16 picture turns had a view; director21 had 16 of 16.)
  for (const l of BF.QUIET_PICTURE_LINES) {
    assert.ok(!/\d/.test(l) && !/[.?!]$/.test(l), `"${l}": no number, and a fragment the say layer closes`);
    assert.ok(!BF.lineHasBlank(l) && !BF.lineStatesKey(l, ["1/4", "8", "No"]), `"${l}": clean against any key`);
  }
  assert.equal(BF.cleanPictureLine(["8 barabar hisse", "aath hisse"], ["8"]), null, "the pure predicate still says: neither shape is clean");
  let quiet = 0, viewed = 0;
  for (const T of PILOTS) for (const b of boardsOf(T)) {
    const pt = BF.pictureTurn(askOf(b), {});
    if (!pt?.view) continue;
    viewed++;
    assert.ok(pt.line, `${b.T}${b.path}: a drawn view always has a line`);
    if (BF.QUIET_PICTURE_LINES.includes(pt.line)) quiet++;
  }
  assert.ok(viewed > 100 && quiet >= 1, `views ${viewed}, of which with the quiet line ${quiet}`);
});

// Studio 014 (dc-r8-director31 item 4): the view each of the seven scripts' card, check, follow-up, own-step and asked-step boards gets
// (viewOf: the view pictureTurn draws), by board template → view template and name, and how many such cards the checker's rule 7
// still lists (no second view and no authored pictureBoard). A change here is a change in what a picture request draws.
test("Studio 014: the seven scripts' card boards — the view each gets, and what rule 7 still lists", async () => {
  const { d32Cards, viewOf, noPictureCards } = await import("../scripts/lesson-scripts/check.mjs");
  const SEVEN = [["lesson-scripts", "c4-maths-ch05-t01"], ["lesson-scripts", "c5-maths-ch02-t01"], ["lesson-scripts", "c5-maths-ch02-t02"], ["lesson-scripts", "c5-maths-ch02-t03"],
    ["lesson-scripts", "c6-maths-ch06-t01"], ["lesson-scripts-staged", "c4-maths-ch01-t02"] /* (director35 clause 53, release 61: c4-maths-ch01-t02 staged again) */, ["lesson-scripts", "c6-maths-ch07-t01"]];
  const KINDS = new Set(["card", "follow-up", "check", "asked step", "own step"]);
  const got = {};
  for (const [d, T] of SEVEN) {
    const s = JSON.parse(readFileSync(new URL(`../data/${d}/${T}.json`, import.meta.url), "utf8")), m = {};
    for (const c of d32Cards(s)) {
      if (!KINDS.has(c.kind)) continue;
      const v = c.board?.template ? viewOf(c.board, c.at) : null, k = `${c.board?.template ?? "none"} → ${v ? `${v.template} ${v.view}` : "none"}`;
      m[k] = (m[k] ?? 0) + 1;
    }
    got[T] = { ...Object.fromEntries(Object.entries(m).sort()), "rule 7": noPictureCards(s).length };
  }
  // (repinned d32, 2026-11-19, after the reader fixes, Studio's second views and the rule 7 picture boards: rule 7 lists 0 on six
  // scripts and 1 on c4-ch05-t01, the one card PICTURE_NONE names with its reason (s2's pencils grid: any drawing of the groups is the
  // key); c4-ch01-t02 13 → 0 and c6-ch06-t01 7 → 0 by authored pictureBoards and new views; the reader fixes moved some cards'
  // boards between templates, and every board kept the per-board checks of P6)
  // (director32: c6-maths-ch07-t01 s2 c3 re-posed over a compare@1 board with a one-whole pictureBoard, its bars gone: wholes 4 → 3, none 6 → 7)
  // (d33 rewrites, 2026-11-23: the nine scripts rewritten to Learning 021 and read cold moved cards between boards, each keeping P6's
  // per-board checks; rule 7 now lists 1 on c6-ch06-t01 (s1 worked step, `noView`: its view totalled the sides as "?") and 1 on
  // c4-ch01-t02 (s1 worked step, `noView`: a turned tester is the answer), each on PICTURE_NONE with its reason; c4-ch01-t02's shape
  // boards with radii 8 → 9, none 9 → 8; c5-t01 gains a bars card with no view, carrying its authored pictureBoard)
  assert.deepEqual(got, {
    "c4-maths-ch05-t01": { "equal-groups@1 \u2192 equal-groups@1 rows": 2, "equal-groups@1 \u2192 shade-grid@1 grid": 3, "fraction-bars@1 \u2192 fraction-line@1 line": 1, "fraction-bars@1 \u2192 fraction-parts@1 round": 1, "fraction-parts@1 \u2192 fraction-parts@1 parts": 2, "fraction-parts@1 \u2192 fraction-parts@1 round": 2, "shade-grid@1 \u2192 fraction-parts@1 round": 1, "shade-grid@1 \u2192 none": 4, "wholes@1 \u2192 wholes@1 strips": 9, "wholes@1 \u2192 wholes@1 wholes": 4, "rule 7": 1 },
  // (2026-11-23, main: c5-t01 s2's worked board is the bare line, fraction-line@1 { den 1 }, no longer the uncut strip: the one
  //  card board with no view there is now "fraction-line@1 → none", carrying its authored pictureBoard as before)
  // (re-pinned, to-brain 052: 1995ce88e, Learning 022 Part 2 A/D, posed c6-ch07-t01 s2 e2 over a compare@1 text board in place of its bars:
  //  wholes 3 → 2, compare none 7 → 8; c4-maths-ch01-t02 is read from data/lesson-scripts, live)
    "c5-maths-ch02-t01": { "fraction-line@1 \u2192 none": 1, "fraction-line@1 \u2192 fraction-bars@1 parts": 19, "fraction-line@1 \u2192 fraction-line@1 strips": 13, "rule 7": 0 },
    "c5-maths-ch02-t02": { "fraction-bars@1 \u2192 fraction-line@1 line": 2, "fraction-bars@1 \u2192 wholes@1 wholes": 15, "fraction-line@1 \u2192 fraction-bars@1 parts": 10, "wholes@1 \u2192 wholes@1 strips": 5, "wholes@1 \u2192 wholes@1 wholes": 1, "rule 7": 0 },
    "c5-maths-ch02-t03": { "fraction-bars@1 \u2192 fraction-line@1 line": 3, "fraction-bars@1 \u2192 fraction-parts@1 round": 2, "fraction-bars@1 \u2192 wholes@1 wholes": 11, "fraction-line@1 \u2192 fraction-bars@1 parts": 4, "fraction-line@1 \u2192 fraction-line@1 strips": 1, "wholes@1 \u2192 wholes@1 wholes": 7, "rule 7": 0 },
    "c6-maths-ch06-t01": { "compare@1 \u2192 none": 1, "measured@1 \u2192 none": 1, "measured@1 \u2192 unrolled@1 unrolled": 21, "shape@1 \u2192 none": 5, "shape@1 \u2192 unrolled@1 unrolled": 1, "rule 7": 1 },
    "c4-maths-ch01-t02": { "angle@1 \u2192 angle@1 tester": 10, "shape@1 \u2192 none": 8, "shape@1 \u2192 shape@1 radii": 9, "rule 7": 1 },
    "c6-maths-ch07-t01": { "compare@1 \u2192 compare@1 scale": 6, "compare@1 \u2192 fraction-bars@1 parts": 1, "compare@1 \u2192 none": 8, "equal-groups@1 \u2192 shade-grid@1 grid": 1, "fraction-bars@1 \u2192 fraction-line@1 line": 1, "fraction-bars@1 \u2192 wholes@1 wholes": 1, "fraction-parts@1 \u2192 fraction-parts@1 parts": 2, "number-line-scale@1 \u2192 none": 1, "wholes@1 \u2192 none": 1, "wholes@1 \u2192 wholes@1 strips": 2, "wholes@1 \u2192 wholes@1 wholes": 2, "rule 7": 0 },
  });
});
