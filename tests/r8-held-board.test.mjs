// dc-r7-held-board (main's v6.8, director16 reversal clause 1): Studio's half of the held board, on its seam. A script turn
// sends intent.held = { board, unit, switchTo?: { board, unit, atChar } } (the shape proposed to Brain, 2026-11-09); Studio
// draws it as sent, keeps it while it is the board up, switches at most once, and draws a picture's second view BESIDE it.
// Replays: director16's c4 steady 18, c5-t02 stuck 18, c4 steady 46 and c6 offtopic 36 (evals/hybrid-side-by-side/results/
// 2026-11-09-director16, rows 0-based), their turns rebuilt as held intents.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { opGeometry, normalizeScript } from "../shared/whiteboard.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const kitOf = (T) => kitFromFile(getTopic(T));
let lessonN = 0;

/** A lesson on Studio's seam driven as Brain drives a held-board turn: preselect on the empty line (her line is written from its
 *  row and, on a picture, preselectedAltLine), then requestIntent on her line. */
function lesson(T) {
  const kit = kitOf(T), L = `r8held-${lessonN++}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  let n = 0;
  const turn = async ({ held, beat = { kind: "check", ownBoard: true }, text, request = null, line = null }) => {
    const a = { intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: held.board, scriptBeat: { scriptId: "s", beatId: "b", ...beat }, held, ...(request ? { request } : {}) },
      line: { lessonId: L, teacherReplySeq: n, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } };
    const row = seam.studioSeam.preselectWhiteboard({ ...a });
    const altLine = seam.studioSeam.preselectedAltLine(L), altView = seam.studioSeam.preselectedAltView(L);
    const said = typeof text === "function" ? text({ row, altLine }) : text;
    let k = seam.studioSeam.requestIntent({ ...a, line: { ...a.line, text: line ?? said } });
    if (k?.state === "planning" && k.ready) k = await k.ready;
    return { row, altLine, altView, k, said };
  };
  return { L, kit, turn };
}
const pagesOf = (k) => (k?.artifact?.screens ?? [k?.artifact?.screen]).map((s) => s?.template);
const changes = (k) => k?.artifact?.script?.switches?.length ?? 0;

// director16's boards
const PIZZA = { template: "wholes@1", params: { wholes: [{ parts: 3, equal: false, title: "Pizza" }] } };
const LINE69 = { template: "fraction-line@1", params: { dens: [6, 9], from: 0, to: 1 } };
const BARS2_11 = { template: "fraction-bars@1", params: { bars: [{ parts: 2, shade: 1, label: "1/2" }, { parts: 11, shade: 1, label: "1/11" }] } };
const BARFI = { template: "fraction-parts@1", params: { parts: 3, shade: 2, whole: "bar", hideResult: true } };
const BARFI_ANS = { template: "fraction-parts@1", params: { parts: 3, shade: 2, whole: "bar" } };
const RECT = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 14, h: 9 } };
const RECT_ANS = { template: "area-grid@1", params: { w: 14, h: 9, mode: "perimeter", unit: "cm" } };

test("held board: drawn as sent from its ref (no line-driven pick, no gate on her words); the board up is KEPT on a hold turn; one switch, at the start of the next unit's first spoken part", async () => {
  const s = lesson("c6-maths-ch06-t01");
  const first = await s.turn({ held: { board: RECT, unit: "s1:c1" }, text: "Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?" });
  assert.equal(first.k.state, "revealed");
  assert.equal(first.k.artifact.screen.template, "measured@1");
  assert.equal(first.k.artifact.held.unit, "s1:c1");
  // (her line names nothing on the board — a Hindi or clarify turn — and the board is held: kept, not refused, not redrawn)
  const hold = await s.turn({ held: { board: RECT, unit: "s1:c1" }, text: "Theek hai, ab Hindi mein: kinaare ki poori lambai batao." });
  assert.equal(hold.k.state, "revealed");
  assert.equal(hold.k.artifact.held.changed, false);
  assert.equal(changes(hold.k), 0);
  assert.equal(hold.k.artifact.script.durationMs, 200, "kept still: no redraw");
  // (the answer-state board for the close, then the next unit's card from its first spoken word: one switch)
  const text = "Haan, sahi hai, 14 + 9 + 14 + 9 = 46 cm. Ab agla sawaal: ek bagiche ki bhujayein 8 m, 5 m, 7 m, 6 m aur 3 m hain. Parimap kitna hai?";
  const at = text.indexOf("Ab agla");
  const pent = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"] } };
  const sw = await s.turn({ held: { board: RECT_ANS, unit: "s1:c1", switchTo: { board: pent, unit: "s1:c2", atChar: at } }, text });
  assert.equal(sw.k.state, "revealed");
  assert.deepEqual(pagesOf(sw.k), ["area-grid@1", "measured@1"]);
  assert.equal(changes(sw.k), 1, "≤ 1 board change per turn");
  assert.equal(sw.k.artifact.script.switches[0].word, "ab");
  assert.equal(sw.k.artifact.held.unit, "s1:c2");
});

test("held board, picture: the second view is drawn BESIDE the held board on one split board (held left, kept still; view right), every word inside its own panel, the picture line built from the drawn view", async () => {
  const kit = kitOf("c4-maths-ch05-t01");
  void kit;
  for (const [ref, keys, view, line] of [
    [PIZZA, ["No"], "strips", /^Dekho, Pizza ke 3 alag-alag tukde hain$/],
    [{ template: "fraction-parts@1", params: { parts: 4, shade: 0, whole: "bar" } }, ["3/4"], "round", /^Wahi poora ab gol mein hai: 4 barabar hisse$/],
    [LINE69, ["Ravi"], "parts", /^Dekho, yeh do barabar pattiyaan hain: ek 6 barabar hisson mein, aur ek 9 barabar hisson mein$/],
    [RECT, ["46 cm"], "unrolled", /^Is rectangle ki 4 bhujayein seedhi karke ek line par rakhi hain: 14 cm, 9 cm, 14 cm, 9 cm; kul lambai kitni hai$/],
  ]) {
    const ask = { intent: { intentId: `split:${ref.template}`, lessonId: "split", kind: "whiteboard", style: { band: "B3" }, boardRef: ref, scriptBeat: { kind: "check", ownBoard: true, answers: keys }, held: { board: ref, unit: "u" }, request: { kind: "picture" } }, line: { text: "" }, mode: "fresh" };
    const r = BF.heldBoard(ask, {});
    assert.ok(r?.split, ref.template);
    assert.equal(r.altView, view);
    assert.match(r.altLine, line);
    assert.doesNotMatch(r.altLine, /yahi numbers/);
    assert.deepEqual([r.script.board.w, r.script.board.h], [BF.SPLIT_BOARD.w, BF.SPLIT_BOARD.h]);
    assert.ok(normalizeScript(r.script, { strict: true }).ok);
    const byId = new Map(r.script.ops.map((o) => [o.id, o]));
    for (const o of r.script.ops.filter((x) => !["erase", "highlight"].includes(x.op) && x.id !== "split")) {
      const b = opGeometry(o, byId).box, left = o.id.startsWith("l.");
      assert.ok(b.x >= -2 && b.y >= -2 && b.y + b.h <= 302, `${o.id} inside the board`);
      assert.ok(left ? b.x + b.w <= 322 : b.x >= 318 && b.x + b.w <= 642, `${o.id} inside its own panel`);
    }
    // (the board has no tap targets: whiteboard ops only)
    assert.ok(r.script.ops.every((o) => !("tap" in o) && !("onTap" in o)));
  }
});

test("director16 c4 steady 18 (\"screen par dikhao na\" over the pizza card): the held pizza stays up and its strip view is drawn beside it; her picture line is the view's own — never \"Dekho, yahi numbers ab patti par.\"", async () => {
  const s = lesson("c4-maths-ch05-t01");
  const card = "Pizza ki baat karein. Uske 3 tukde hue, ek bada aur do chhote. Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?";
  const beat = { kind: "check", ownBoard: true, answers: ["No"] };
  assert.equal((await s.turn({ held: { board: PIZZA, unit: "s1:e2" }, beat, text: `Phir se dekho: ${card}` })).k.state, "revealed");
  const pic = await s.turn({ held: { board: PIZZA, unit: "s1:e2" }, beat, request: { kind: "show" }, text: ({ altLine }) => `Dekho, ${altLine}. ${card}` });
  assert.equal(pic.altView, "strips");
  assert.equal(pic.altLine, "Dekho, Pizza ke 3 alag-alag tukde hain");
  assert.match(String(pic.row), /beside:/);
  assert.equal(pic.k.state, "revealed");
  assert.ok(pic.k.artifact.split);
  assert.equal(pic.k.artifact.layout?.split, true);
  assert.deepEqual(pic.k.artifact.layout.panels.map((x) => x.role), ["held", "view"]);
  assert.equal(pic.k.artifact.altView, "strips");
  assert.equal(pic.k.artifact.screens[0].template, "wholes@1", "the held pizza is the board, its view beside it");
  assert.equal(pic.k.artifact.screens[0].beside.altView, "strips");
  assert.equal(changes(pic.k), 0, "the board does not change on a picture turn");
});

test("director16 c5-t02 stuck 18 (\"picture dikhao\" after the remediation): the remediation shares its then-card's board — the 6 | 9 line — and the picture draws THAT board's view beside it, never the remediation's 1/2 | 1/11 bars, never a fraction the card asks", async () => {
  const s = lesson("c5-maths-ch02-t02");
  const beat = { kind: "check", ownBoard: true, answers: ["Ravi"] };
  const rem = "1/8 sahi nahi hai. Hisse jitne zyada, har tukda utna chhota. Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?";
  const r16 = await s.turn({ held: { board: LINE69, unit: "s1:then:m-bigger-denominator" }, beat: { kind: "remediation" }, text: rem });
  assert.equal(r16.k.artifact.screen.template, "fraction-line@1");
  const card = "Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?";
  const pic = await s.turn({ held: { board: LINE69, unit: "s1:then:m-bigger-denominator" }, beat, request: { kind: "picture" }, text: ({ altLine }) => `Dekho, ${altLine}. ${card}` });
  assert.equal(pic.altView, "parts");
  assert.ok(pic.k.artifact.split);
  assert.deepEqual(pic.k.artifact.screens[0].beside.counts.wholes.map((w) => [w.parts, w.shaded, w.label]), [[6, 0, "?"], [9, 0, "?"]]);
  assert.ok(!pic.k.artifact.script.ops.some((o) => o.op === "text" && /1\/2|1\/11|1\/6|1\/9/.test(o.text)), "no remediation bars, no named fraction");
  assert.equal(changes(pic.k), 0);
  void BARS2_11;
});

test("director16 c4 steady 46 and c6 offtopic 36 (a correct verdict, then an aside question): the close is said over the answered card's answer-state board, the aside ends the turn — no next card is drawn or pinned; the aside's reply turn holds that board", async () => {
  for (const [T, cardBoard, ans, close, aside] of [
    ["c4-maths-ch05-t01", BARFI, BARFI_ANS, "Haan, sahi hai. Toh poora jawab: barfi ka 2/3 hissa khaya gaya, kyunki 3 barabar tukdon mein se 2 khaye gaye.", "Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?"],
    ["c6-maths-ch06-t01", RECT, RECT_ANS, "Haan, sahi hai, kyunki ribbon kinaare par lagta hai: 14 + 9 + 14 + 9 = 46 cm.", "Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?"],
  ]) {
    const s = lesson(T);
    assert.equal((await s.turn({ held: { board: cardBoard, unit: "s1:card" }, text: "Kitna hissa khaya gaya? Ribbon kitna lamba hai?" })).k.state, "revealed");
    // (the verdict turn: the answer-state board from the close's first word — a change at the start of a spoken part — and
    // no switchTo: A4, the aside question ends her turn)
    const v = await s.turn({ held: { board: ans, unit: "s1:card" }, text: `${close} ${aside}` });
    assert.equal(v.k.state, "revealed");
    assert.equal(pagesOf(v.k).length, 1, `${T}: one board, the answered card's`);
    assert.equal(changes(v.k), 0);
    assert.equal(v.k.artifact.screen.template, ans.template);
    // (the child answers the aside: the board holds — kept, no next card drawn without being said)
    const reply = await s.turn({ held: { board: ans, unit: "s1:card" }, text: "Achha, chhakka! Mujhe bhi pasand hai." });
    assert.equal(reply.k.artifact.held.changed, false, T);
    assert.equal(reply.k.artifact.script.durationMs, 200);
  }
});

test("Learning's D11 (relayed by main): fraction-bars@1 takes an UNNAMED bar (label \"\") — no name drawn, facts \"<parts> equal parts\", no label-value check; under the held board it stands in the split's left panel and its second view (circles) names no fraction", async () => {
  const { expand } = await import("../server/forge/explainer/templates.js");
  const { certifyBoardRef } = await import("../server/forge/explainer/board-ref.js");
  const ref = { template: "fraction-bars@1", params: { bars: [{ parts: 3, shade: 0, label: "" }, { parts: 10, shade: 0, label: "" }] } };
  const x = expand({ template: "fraction-bars@1", ...ref.params });
  assert.ok(x.ok, String(x.errors));
  assert.deepEqual(x.facts.onScreen, { wholes: "2 equal bars", bar1: "3 equal parts", bar2: "10 equal parts" });
  assert.deepEqual(x.script.ops.filter((o) => o.op === "text").map((o) => o.text), []);
  assert.deepEqual(x.facts.counts.wholes.map((w) => w.label), ["", ""]);
  // (the compare card posed honestly: its prompt states both fractions, the board names neither and answers nothing)
  const c = await certifyBoardRef(ref, { line: "Do ek jaisi bar hain: ek ka 2/3, doosre ka 3/10. Kaunsa bada hai, 2/3 ya 3/10?", withhold: { values: ["2/3"] } });
  assert.ok(c.ok, JSON.stringify(c.failed));
  // (a named bar still has its value checked)
  assert.equal(expand({ template: "fraction-bars@1", bars: [{ parts: 3, shade: 0, label: "2/3" }] }).ok, false);
  // under the held board: the split's left panel is the unnamed bars; the view beside is circles of 3 and 10, nothing named
  const ask = { intent: { intentId: "d11", lessonId: "d11", kind: "whiteboard", style: { band: "B3" }, boardRef: ref, scriptBeat: { kind: "check", ownBoard: true, answers: ["2/3"] }, held: { board: ref, unit: "s2:e4" }, request: { kind: "picture" } }, line: { text: "" }, mode: "fresh" };
  const r = BF.heldBoard(ask, {});
  assert.ok(r?.split);
  assert.equal(r.altView, "wholes");
  assert.equal(r.altLine, "Dekho, pehle mein 3 barabar tukde hain, aur doosre mein 10 barabar tukde hain");
  assert.ok(!r.script.ops.some((o) => o.op === "text" && /\d+\s*\/\s*\d+/.test(o.text)), "no fraction named on either panel");
  // (a shaded unnamed bar's view keeps its shading and names nothing either)
  const shaded = BF.altCall({ template: "fraction-bars@1", params: { bars: [{ parts: 3, shade: 2, label: "" }, { parts: 10, shade: 3, label: "" }] } }, { keys: ["2/3"] });
  assert.equal(shaded.template, "wholes@1");
  assert.ok(!JSON.stringify(shaded).includes("/"));
});

// ───────────── main's v6.9 (director17, dc-r7-script-walk-v6-9) ─────────────
const E2_ASK = "Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?";
const LINE48 = { template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1, marks: [[1, 4]] } };
const LINE67 = { template: "fraction-line@1", params: { dens: [6, 7], from: 0, to: 1, marks: [[1, 6]] } };
const heldPic = (ref, answers) => ({ intent: { intentId: `v69:${JSON.stringify(ref.params)}:${answers}`, lessonId: "v69", kind: "whiteboard", style: { band: "B3" }, boardRef: ref,
  scriptBeat: { kind: "check", ownBoard: true, answers }, held: { board: ref, unit: "u" }, request: { kind: "picture" } }, line: { text: "" }, mode: "fresh" });

test("v6.9 S10 (director17 c5-t01 e2, steady/stuck 18, offtopic 28): the split view is built only from the held board's own parts — the 8-gap scale the card counts is LEFT OUT, never drawn as an uncut \"1 equal parts\" bar; steering 14's sixths and sevenths (no count key) keeps both bars", () => {
  const e2 = BF.heldBoard(heldPic(LINE48, ["8"]), {});
  assert.ok(e2?.split);
  // (main v6.11, director19 steady/stuck 18: the view DRAWS the 8-gap scale the card asks about — unnamed — and her line names
  // it without its count, so the key is never said)
  assert.equal(e2.altLine, "Dekho, yeh do barabar pattiyaan hain: ek 4 barabar hisson mein, 1 rangin, yaani ek-chauthai, aur ek barabar hisson mein");
  assert.deepEqual(BF.heldAltOf(heldPic(LINE48, ["8"])).call.bars, [{ parts: 4, shade: 1, label: "1/4" }, { parts: 8, shade: 0, label: "" }]);
  assert.ok(!BF.lineStatesKey(e2.altLine, ["8"]));
  assert.doesNotMatch(e2.altLine, /\b1 barabar hisson|\bek 1\b/);
  const right = (e2.panels[1].ops ?? []).filter((o) => o.op === "text").map((o) => o.text);
  assert.ok(!right.includes("?"), `the view names no bar the board does not have: ${right}`);
  const s14 = BF.heldBoard(heldPic(LINE67, ["Pehla"]), {});
  assert.equal(s14.altLine, "Dekho, yeh do barabar pattiyaan hain: ek 6 barabar hisson mein, 1 rangin, yaani ek bata chhe, aur ek 7 barabar hisson mein");
  // (a held line that is only the key's scale has no view of its own parts: the held board stands alone, no invented example)
  const only8 = BF.heldBoard(heldPic({ template: "fraction-line@1", params: { den: 8, from: 0, to: 1 } }, ["8"]), {});
  assert.ok(only8?.script && !only8.split);
  // (recording, v6.9: the layout as one field — the harness records it, Brain's patch 019; production puts it on the artifact)
  assert.deepEqual(e2.layout, { split: true, panels: [{ side: "left", role: "held", template: "fraction-line@1", unit: "u" }, { side: "right", role: "view", template: "fraction-bars@1", view: "parts" }] });
  assert.deepEqual(only8.layout, { split: false });
});

test("v6.9 S11: the picture line says \"barabar\" for equal parts and \"alag-alag\" only for unequal ones, fractions as words, no closing stop; an unnamed bar's scale stays on the line view (c5-t02 steering 14)", () => {
  const cake = { template: "wholes@1", params: { wholes: [{ parts: 3, equal: false, title: "Pizza" }, { parts: 3, title: "Cake" }] } };
  assert.equal(BF.heldBoard(heldPic(cake, ["Cake"]), {}).altLine, "Dekho, Pizza ke 3 alag-alag tukde hain, aur Cake ke 3 barabar tukde hain");
  const q8 = { template: "fraction-bars@1", params: { bars: [{ parts: 4, shade: 1, label: "1/4" }, { parts: 8, shade: 0, label: "?" }] } };
  const v = BF.heldAltOf(heldPic(q8, ["1/8"]));
  assert.deepEqual(v.call.dens, [4, 8], "the 8-part bar the card asks about is on the line");
  assert.equal(v.line, "Dekho, yeh 0 se 1 ki do sankhya rekhayein hain, 4 aur 8 barabar gaps mein, nishaan ek-chauthai par");
  for (const l of [v.line, BF.heldBoard(heldPic(LINE48, ["8"]), {}).altLine]) { assert.doesNotMatch(l, /\(\d+\/\d+\)|\d\/\d/); assert.doesNotMatch(l, /[.?!]$/); }
  assert.equal(BF.fracSay(3, 4), "teen-chauthai");
  assert.equal(BF.fracSay(2, 5), "do bata paanch");
});

test("v6.9: a held turn draws only what the intent holds — a board prewarmed for the same intent (the next unit's, by lookahead) is never drawn", async () => {
  const s = lesson("c6-maths-ch06-t01");
  const pent = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"] } };
  const L = s.L, intentId = `${L}:wb:1`;
  seam.studioSeam.prewarmWhiteboard({ intent: { intentId, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: pent, scriptBeat: { scriptId: "s", beatId: "b", kind: "check", ownBoard: true } },
    line: { lessonId: L, teacherReplySeq: 1, text: "" }, mode: "fresh", kit: { topicId: "c6-maths-ch06-t01", content: [] } });
  const t = await s.turn({ held: { board: RECT, unit: "s1:c1" }, text: "Theek hai, thoda ruk jaate hain. Jab tayyar ho, batana." });
  assert.equal(t.k.state, "revealed");
  assert.deepEqual(pagesOf(t.k), ["measured@1"]);
  const words = t.k.artifact.script.ops.filter((o) => o.op === "text").map((o) => o.text).join(" ");
  assert.match(words, /14 cm/, words);
  assert.doesNotMatch(words, /\b8 m\b|\bP\b/, "the prewarmed pentagon is not drawn");
  assert.equal(t.k.artifact.held.unit, "s1:c1");
  assert.equal(changes(t.k), 0);
});

// ───────────── main's v6.11 (director19) ─────────────
test("v6.11 (director19 c4 steady 18): the picture line never states the open card's key — in digits, as an equal fraction, or in words", () => {
  assert.ok(BF.lineStatesKey("yaani 2/8", ["1/4"]), "an equal fraction is the key");
  assert.ok(BF.lineStatesKey("1 rangin, yaani ek-chauthai", ["1/4"]), "the key in words");
  assert.ok(BF.lineStatesKey("8 barabar gaps", ["8"]));
  assert.ok(!BF.lineStatesKey("4 barabar hisson mein, 1 rangin", ["1/8"]));
  assert.ok(!BF.lineStatesKey("Dekho, yeh ek patti hai", ["8"]));
});

test("v6.11 (director19): two caption shapes per view, each a full spoken sentence; the second ask of the same board gets the second", () => {
  const ref = { template: "fraction-line@1", params: { dens: [6, 7], from: 0, to: 1, marks: [[1, 6]] } };
  const a = BF.pictureTurn(heldPic(ref, ["Pehla"]), {});
  const b = BF.pictureTurn(heldPic(ref, ["Pehla"]), { variant: 1 });
  assert.ok(a?.line && b?.line && a.line !== b.line, `${a?.line} | ${b?.line}`);
  for (const l of [a.line, b.line]) assert.match(l, /^(Dekho|Ab|Wahi|Is|Ek)\b/);
});
