// round 7, director10 (main's judgement dc-r7-script-walk-v6-2, G1-G5): each item pinned on a director10 row
// (evals/hybrid-side-by-side/results/2026-11-07-director10 on claude/r4-conversation 14883b7f; the rows' text and boards
// copied here). Replayed through Studio's seam as the run drove it: the card's board up on its own line, then the turn.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { gateCtxFor, revealOf } from "../server/stagecraft/board-sync.js";
import { expand } from "../server/forge/explainer/templates.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const kitOf = (T) => kitFromFile(getTopic(T));
const texts = (s) => (s?.ops ?? []).filter((o) => o.op === "text" || o.op === "label").map((o) => o.text);
let lessonN = 0;

/** A lesson on Studio's seam: `up(ref, beat, text)` draws a card's board on its line (or, with no text, on the line Brain
 *  writes from the pick's row); `turn(...)` sends a turn and waits for its board. */
function lesson(T) {
  const kit = kitOf(T), L = `r8d10-${lessonN++}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  let n = 0;
  const ask = (ref, beat, text, more = {}) => ({ intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: beat, ...more },
    line: { lessonId: L, teacherReplySeq: n, text }, mode: "fresh", kit: { topicId: T, content: [] } });
  const send = async (a) => {
    const row = seam.studioSeam.preselectWhiteboard({ ...a, line: { ...a.line, text: "" } });
    if (!a.line.text) a.line.text = String(row ?? "").replace(/^[^:]*:\s*/, "");
    const k = seam.studioSeam.requestIntent(a);
    return k?.state === "planning" && k.ready ? (await k.ready) ?? { state: "failed" } : k;
  };
  return { L, kit, up: (ref, beat, text = "") => send(ask(ref, beat, text)), turn: (ref, beat, text, more) => send(ask(ref, beat, text, more)) };
}
const sb = (beatId, kind = "explain", more = {}) => ({ scriptId: "s", beatId, kind, ...(kind === "check" ? { ownBoard: true } : {}), ...more });

test("director10 G2: a close said in the closed card's authored why passes W5 over its compare@1 (steady-c4 T58, 'cake ke 4 tukde barabar nahi hain'); the 3-page turn draws", async () => {
  const T = "c4-maths-ch05-t01", s = lesson(T);
  const c3 = { template: "compare@1", params: { left: { title: "Cake", items: ["4 tukde"] }, right: { title: "Tukde", items: ["2 bade", "2 chhote"] } } };
  const bridge = { template: "compare@1", params: { left: { title: "Ek roti", items: ["barabar hisse"] }, right: { title: "Bahut saare laddoo", items: ["barabar group"] } } };
  const e1 = { template: "equal-groups@1", params: { groups: 2, each: 4 } };
  const up = await s.up(c3, sb("c3", "check", { answers: ["nahi", "no"] }), "Nahi, yeh jawab nahi hai. Sawaal phir se padho aur apna jawab do. Ek cake ke 4 tukde kiye: 2 bade aur 2 chhote. Zoya ne 1 chhota tukda liya. Kya yeh chhota tukda cake ka ek-chauthaai hai?");
  assert.equal(up.state, "revealed");
  const text = "Haan, sahi hai, kyunki cake ke 4 tukde barabar nahi hain, toh chhota tukda ek-chauthaai nahi hai. Ab tak humne ek roti ke barabar hisse kiye. Ab bahut saare laddoo ke barabar group banakar hissa nikalenge. Niyam wahi hai: barabar hisse. Dekho, 8 laddoo 2 barabar group mein hain, har group mein 4. Ek group 8 ka aadha hai. Toh 8 ka 1/2 = 4. Check karo: 2 × 4 = 8. Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hai?";
  // the close alone, on the card's board: before, W5 refused the card's own words "bade", "chhote"
  const id = `${s.L}:g2`;
  const a = { intent: { intentId: id, lessonId: s.L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: c3, scriptBeat: sb("c3", "check", { answers: ["nahi", "no"] }) }, line: { lessonId: s.L, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } };
  BF.preselect(a, { kit: s.kit });
  const close = { ...a, line: { lessonId: s.L, text: text.slice(0, 98).trim() } };
  assert.ok(BF.takePreselected(close, gateCtxFor(close, { kit: s.kit, redact: [], prior: [] }))?.script, `refused: ${BF.pickState(close)}`);
  const kept0 = BF.firstPageKeptCount();
  const v = await s.turn(c3, sb("c3", "check", { answers: ["nahi", "no"] }), text, { segments: [{ atChar: 98, atClause: 1, boardRef: bridge, scriptBeat: sb("bridge") }, { atChar: 237, atClause: 4, boardRef: e1, scriptBeat: sb("e1") }] });
  assert.equal(v.state, "revealed");
  assert.equal(v.artifact.script.switches?.length, 2, "three pages");
  assert.equal(v.artifact.screens[0].template, "compare@1");
  assert.equal(BF.firstPageKeptCount(), kept0, "the close's page is its own take, not a kept page");
});

test("director10 G2: a worked close over fraction-bars@1 — two bars are two wholes, not a count she must say (steady-c5-t02 T32, W8); a c6 close naming the key over the card's sides (stuck-c6 T40, W17)", async () => {
  const bars = { template: "fraction-bars@1", params: { bars: [{ parts: 6, shade: 1, label: "1/6" }, { parts: 3, shade: 1, label: "1/3" }] } };
  const take = (T, ref, beat, line) => {
    const kit = kitOf(T), L = `r8d10g2-${lessonN++}`;
    const a = { intent: { intentId: `${L}:wb:1`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: beat }, line: { lessonId: L, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } };
    BF.preselect(a, { kit });
    const real = { ...a, line: { lessonId: L, text: line } };
    return { t: BF.takePreselected(real, gateCtxFor(real, { kit, redact: [], prior: [] })), why: BF.pickState(real) };
  };
  const w = take("c5-maths-ch02-t02", bars, sb("worked", "worked"), "Achha, ab samajh aaya tumne kaise socha. Toh poora jawab: Sana ko bada tukda mila, 1/3 wala, kyunki ek hi size ke bar ke jitne zyada hisse, har hissa utna chhota, isliye 6 bada number hote hue bhi 1/6 chhota tukda hai.");
  assert.ok(w.t?.script, w.why);
  assert.deepEqual(w.t.screen.counts.wholes.map((x) => x.parts), [6, 3]);
  const tri = { template: "measured@1", params: { shape: "triangle", unit: "m", sides: [7, 9, 12], trace: true } };
  const m = take("c6-maths-ch06-t01", tri, sb("worked", "worked"), "16 m sahi nahi hai. Pichhle sawaal ka jawab 28 m tha, kyunki baad kinaare par chalti hai aur teeno bhujayein judi hain, koi nahi chhooti, aur yeh lambai hai, isliye metre mein.");
  assert.ok(m.t?.script, m.why);
  // (her counts against a board's parts still bind: steady-c4 T62's close, "12 laddoo … har group mein 6", over e1's 2 groups
  // of 4 is refused — that close belongs to a card with no board of its own; Learning's answerBoard)
  const e1 = take("c4-maths-ch05-t01", { template: "equal-groups@1", params: { groups: 2, each: 4 } }, sb("e1"), "Haan, sahi hai, kyunki 12 laddoo ke 2 barabar group mein har group mein 6 aate hain, 2 × 6 = 12.");
  assert.equal(e1.t, null, "8 dots under '12 laddoo, 6 a group' stays refused");
  assert.match(e1.why, /W8\.counts_match_line/);
});

test("director10 G1: a first page that still fails keeps the card's board on screen BY ITS REF — the page up was drawn, masked, on the card's own line (steady-c4 T46)", async () => {
  const T = "c4-maths-ch05-t01", s = lesson(T);
  const grid = { template: "shade-grid@1", params: { rows: 1, cols: 4, shade: 3, labels: false, hideResult: true } };
  const c1 = { template: "compare@1", params: { left: { title: "Laddoo", items: ["3 tukde"] }, right: { title: "Tukde", items: ["ek bada", "do chhote"] } } };
  const beat = sb("then:c4-maths-ch05-t01-m-part-part", "check", { answers: ["3/4"] });
  const up = await s.up(grid, beat, "Haan, sahi hai, kyunki bar ke 4 barabar tukde the aur unme se 3 khaye gaye. Riya, tumne 3/4 kaise jaana—upar 3 aur neeche 4 kyun likhe?");
  assert.equal(up.state, "revealed");
  const kept0 = BF.firstPageKeptCount();
  const text = "Tumne pehle wale kadam se kul tukde aur khaye gaye tukde pehchane. Toh poora jawab: barfi ka 2/3 hissa khaya gaya, kyunki barfi ke 3 barabar tukde the aur 2 khaye gaye, bacha hua 1 tukda neeche nahi aata. Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?";
  const v = await s.turn(grid, beat, text, { segments: [{ atChar: 205, atClause: 2, boardRef: c1, scriptBeat: sb("c1", "check", { answers: ["nahi"] }) }] });
  assert.equal(v.state, "revealed", "the turn draws");
  assert.equal(BF.firstPageKeptCount(), kept0 + 1, "the first page is the card's board, kept");
  assert.equal(v.artifact.script.switches?.length, 1);
  assert.equal(v.artifact.screen.template, "compare@1");
});

test("director10 G3: a correct verdict reveals the card's key — 'Haan, sahi hai' with no digits writes 1/3 in the '?' (c5-t01 offtopic T46) when Brain's verdict beat carries reveal", async () => {
  assert.deepEqual(revealOf({ reveal: true, answers: ["1/3", "ek-tihaai"] }), ["1/3"]);
  assert.deepEqual(revealOf({ reveal: ["28 m"] }), ["28"]);
  assert.deepEqual(revealOf({ answers: ["1/3"] }), []);
  const T = "c5-maths-ch02-t01";
  const c1 = { template: "fraction-line@1", params: { den: 3, from: 0, to: 1, mark: 1 } };
  const verdict = "Haan, sahi hai, kyunki beech ke 2 marks line ko 3 barabar gaps mein baantte hain, aur pehla mark ek gap par hai.";
  for (const reveal of [undefined, true]) {
    const s = lesson(T);
    const beat = sb("c1", "check", { answers: ["1/3", "ek-tihaai"] });
    const up = await s.up(c1, beat, "Line par 0 aur 1 ke beech 2 marks hain. 0 ke baad pehla mark kaunsa fraction hai?");
    assert.ok(texts(up.artifact.script).includes("?"));
    const v = await s.turn(c1, { ...beat, ...(reveal ? { reveal } : {}) }, verdict);
    assert.equal(v.state, "revealed");
    if (reveal) {
      assert.ok(texts(v.artifact.script).includes("1/3") && !texts(v.artifact.script).includes("?"), JSON.stringify(texts(v.artifact.script)));
      assert.deepEqual(v.artifact.screen.counts.marks, [{ at: "mark 1", label: "1/3" }]);
    } else assert.ok(texts(v.artifact.script).includes("?"), "no reveal: the asked mark stays the question");
  }
});

test("director10 G4: every picture request over a card's board draws a SECOND view built from that card (director10 rows: wholes, measured, shape, bars, two-scale line)", async () => {
  const rows = [
    // [topic, the card's ref, beat kind, altView, template drawn, what it writes]
    ["c4-maths-ch05-t01", { template: "wholes@1", params: { wholes: [{ parts: 3, equal: false, title: "Cake A" }, { parts: 3, title: "Cake B" }] } }, "explain", "strips", "wholes@1", ["Cake A", "Cake B"]],
    ["c6-maths-ch06-t01", { template: "measured@1", params: { shape: "rect", unit: "cm", w: 6, h: 4, trace: true } }, "explain", "unrolled", "unrolled@1", ["6 cm", "4 cm", "6 cm", "4 cm", "?"]],
    ["c6-maths-ch06-t01", { template: "measured@1", params: { shape: "triangle", unit: "m", sides: [7, 9, 12], trace: true } }, "explain", "unrolled", "unrolled@1", ["7 m", "9 m", "12 m", "?"]],
    ["c6-maths-ch06-t01", { template: "shape@1", params: { shape: "hexagon", side: "5 cm" } }, "explain", "unrolled", "unrolled@1", ["5 cm", "5 cm", "5 cm", "5 cm", "5 cm", "5 cm", "?"]],
    ["c5-maths-ch02-t02", { template: "fraction-bars@1", params: { bars: [{ parts: 6, shade: 1, label: "1/6" }, { parts: 3, shade: 1, label: "1/3" }] } }, "explain", "line", "fraction-line@1", ["1/6", "1/3"]],
    // (c5-t01: the card asks about the 8-gap scale under the 1/4 — both scales are the card's figure, not the 1/4 alone)
    ["c5-maths-ch02-t01", { template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1, marks: [[1, 4]] } }, "explain", "parts", "fraction-bars@1", ["1/4", "0", "1", "?", "0", "1"]],
  ];
  for (const [T, ref, kind, view, template, written] of rows) {
    // (Brain's "show": a picture ask that names nothing — "screen par dikhao na", patch 014 — is a request too)
    for (const req of [{ kind: "picture" }, { kind: "show" }]) {
      const s = lesson(T);
      const up = await s.up(ref, sb("b", kind));
      assert.equal(up.state, "revealed", `${ref.template}: the card is up`);
      assert.equal(up.artifact.screen.template, ref.template);
      const v = await s.turn(ref, sb("b", kind), "", { request: req });
      assert.equal(v.state, "revealed", `${ref.template} ${req.kind}`);
      assert.equal(v.artifact.altView, view, `${ref.template} ${req.kind}`);
      assert.equal(v.artifact.screen.template, template);
      assert.deepEqual(texts(v.artifact.script), written, `${ref.template} ${req.kind}`);
    }
  }
  // the two new forms render on their own (Learning may author them)
  assert.ok(expand({ template: "unrolled@1", sides: [7, 9, 12], unit: "m", total: 28 }).ok);
  assert.equal(expand({ template: "unrolled@1", sides: [7, 9, 12], unit: "m", total: 27 }).ok, false, "a total that is not the sum is refused");
  const strips = expand({ template: "wholes@1", as: "bar", wholes: [{ parts: 3, equal: false, title: "Cake A" }, { parts: 3, title: "Cake B" }] });
  assert.ok(strips.ok);
  assert.equal(strips.script.ops.filter((o) => o.op === "circle").length, 0, "strips, not circles");
});

test("App's render check (BOARDS-RENDER.md): number-line-scale@1 tick labels never touch — every k-th tick labelled (k divides the steps, both ends kept) at the player's real digit width; marks get a third row; the lint flags touching row labels", async () => {
  const { lintScript, textBox } = await import("../shared/whiteboard.js");
  const rows = (c) => expand({ template: "number-line-scale@1", ...c }).script.ops.find((o) => o.layout === "number_line").rows[0];
  assert.deepEqual(rows({ from: 0, to: 1000, step: 100 }), ["0", "", "200", "", "400", "", "600", "", "800", "", "1000"]);
  assert.deepEqual(rows({ from: 0, to: 100000, step: 20000 }), ["0", "", "", "", "", "100000"]);
  assert.deepEqual(rows({ from: 0, to: 10000, step: 1000 }), ["0", "", "", "", "", "5000", "", "", "", "", "10000"]);
  assert.deepEqual(rows({ from: 0, to: 10, step: 1 }), ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], "short labels: every tick");
  // App's case: marks 300, 400, 500 on 0-1000 step 100, all three labelled, none touching
  const x = expand({ template: "number-line-scale@1", from: 0, to: 1000, step: 100, marks: [{ value: 300 }, { value: 400 }, { value: 500 }] });
  assert.ok(x.ok, String(x.errors));
  assert.deepEqual(lintScript(x.script), []);
  assert.deepEqual(x.script.facts.counts.marks.map((m) => m.label), ["300", "400", "500"]);
  // the player's digits: the numeral face's measured tabular advance (STIX Two Text 0.495 em, round 8 item 7:
  // docs/design/round8/font-measure-2026-11-10.json), not the letter estimate (was Geist Mono's 0.6)
  assert.equal(Math.round(textBox("100000", "m").w), Math.round(6 * 24 * 0.495));
  // a number line whose own labels touch is a lint issue
  const crowded = { scriptId: "c", board: { w: 400, h: 300 }, durationMs: 2000, ops: [{ id: "nl", op: "numwork", at: [30, 180], layout: "number_line", rows: [["0", "100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"]], range: [0, 1000], w: 340, startMs: 0, endMs: 1200 }] };
  assert.ok(lintScript(crowded).some((i) => i.check === "row_labels_touch"));
});

test("main, G2 addendum: W8 takes a two-bar compare whose bars ARE the two fractions her line compares (Learning's c5-t02 cards, moved back to lines only for W8) — live and in certification", async () => {
  const { certifyBoardRef } = await import("../server/forge/explainer/board-ref.js");
  const B = (...fs) => ({ template: "fraction-bars@1", params: { bars: fs.map((f) => { const [a, d] = f.split("/").map(Number); return { parts: d, shade: a, label: f }; }) } });
  // c5-t02 s2 e2's ask (Learning 7e9f32e0): "Rohan kehta hai ki 3/7 aur 5/7 barabar hain" — 3 + 5 shaded pieces of one size
  for (const [ref, line] of [
    [B("3/7", "5/7"), "Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?"],
    [B("1/4", "1/8"), "1/4 aur 1/8 mein kaunsa bada hai?"],
    [B("1/10", "1/5"), "Kaunsa ek tukda bada hai, 1/10 ya 1/5?"],
    [B("5/8", "3/8"), "Ek hi bar ke 5/8 aur 3/8 mein kaunsa bada hai?"],
    [B("2/3", "3/10"), "Do ek jaisi bar hain: ek ka 2/3, doosre ka 3/10. Kaunsa bada hai, 2/3 ya 3/10?"],
  ]) {
    const r = await certifyBoardRef(ref, { line, withhold: { values: [] } });
    assert.ok(r.ok, `${line}: ${JSON.stringify(r.failed)}`);
  }
  // live, on the card's own board under its prompt
  const T = "c5-maths-ch02-t02", kit = kitOf(T), L = `r8d10w8-${lessonN++}`;
  const a = { intent: { intentId: `${L}:wb:1`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: B("3/7", "5/7"), scriptBeat: sb("e2", "check", { answers: ["no", "nahi"] }) }, line: { lessonId: L, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } };
  BF.preselect(a, { kit });
  const real = { ...a, line: { lessonId: L, text: "Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?" } };
  const t = BF.takePreselected(real, gateCtxFor(real, { kit, redact: [], prior: [] }));
  assert.deepEqual(t?.screen?.counts?.wholes, [{ parts: 7, shaded: 3, label: "3/7" }, { parts: 7, shaded: 5, label: "5/7" }], BF.pickState(real));
  // (a count she never says still binds: 3 bars over a line that compares two fractions)
  const r3 = await certifyBoardRef(B("1/4", "1/8", "1/2"), { line: "1/4 aur 1/8 mein kaunsa bada hai?", withhold: { values: [] } });
  assert.equal(r3.ok, false);
});

test("App's T55 (steady-c6, director10 index 54): page 0 that draws the board already up — T52's last page, the 6 cm square — is kept still, not redrawn with its perimeter walk crushed", async () => {
  const { isMotionOp } = await import("../shared/whiteboard.js");
  const T = "c6-maths-ch06-t01", s = lesson(T);
  const rect12 = { template: "measured@1", params: { shape: "rect", unit: "m", w: 12, h: 5, trace: true } };
  const sq6 = { template: "measured@1", params: { shape: "square", unit: "cm", w: 6, h: 6, trace: true } };
  const rect7 = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 7, h: 3, trace: true } };
  const t52 = "Haan, sahi hai, kyunki 2 × (12 + 5) = 2 × 17 = 34 m. Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Toh is varg ka parimap kitna hai?";
  const a = await s.turn(rect12, sb("e2"), t52, { segments: [{ atChar: 53, atClause: 1, boardRef: sq6, scriptBeat: sb("e3") }] });
  assert.equal(a.state, "revealed");
  assert.equal(a.artifact.script.switches?.length, 1, "T52: two pages, the square last");
  const before = BF.pageTimingCounts().firstSame;
  const t54 = "36 cm sahi nahi hai. Yeh aayat 7 cm lamba aur 3 cm chauda hai. Andar 1 cm ke tiles bichhao toh 7 × 3 = 21 tiles, woh area hai, varg cm mein. Dhaaga kinaare par chalta hai, toh 7, 3, 7 aur 3 jodo, jawab cm mein. Ab tak samajh aaya?";
  const v = await s.turn(sq6, sb("e3"), t54, { segments: [{ atChar: 21, atClause: 1, boardRef: rect7, scriptBeat: sb("rem:c6-maths-ch06-t01-m-area-perimeter", "remediation") }] });
  assert.equal(v.state, "revealed");
  assert.equal(BF.pageTimingCounts().firstSame, before + 1, "page 0 is the square already up, kept");
  const sw = v.artifact.script.switches[0].atMs;
  const p0 = v.artifact.script.ops.filter((o) => o.id.startsWith("a.") && o.op !== "erase");
  assert.ok(p0.length && p0.every((o) => o.endMs <= 200 && !isMotionOp(o)), "page 0 is shown complete at once, no motion");
  assert.ok(sw > 200);
  // the second page is the 7 × 3 rectangle, its walk intact
  assert.ok(v.artifact.script.ops.some((o) => o.id.startsWith("b.") && isMotionOp(o)), "page 1 keeps its motion");
});

test("App's T55, the other half: a page whose retimed drawing runs past its switch is drawn STILL (its motion ops dropped), never squeezed into the last 120 ms", async () => {
  const { isMotionOp } = await import("../shared/whiteboard.js");
  const T = "c6-maths-ch06-t01", s = lesson(T);
  const sq6 = { template: "measured@1", params: { shape: "square", unit: "cm", w: 6, h: 6, trace: true } };
  const rect7 = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 7, h: 3, trace: true } };
  const before = BF.pageTimingCounts().stilled;
  // a fresh lesson (nothing up to keep): page 0 is the square on its 5-word verdict, far shorter than its walk
  const v = await s.turn(sq6, sb("e3"), "36 cm sahi nahi hai. Yeh aayat 7 cm lamba aur 3 cm chauda hai. Dhaaga kinaare par chalta hai, toh 7, 3, 7 aur 3 jodo, jawab cm mein. Ab tak samajh aaya?",
    { segments: [{ atChar: 21, atClause: 1, boardRef: rect7, scriptBeat: sb("rem:c6-maths-ch06-t01-m-area-perimeter", "remediation") }] });
  assert.equal(v.state, "revealed");
  const sw = v.artifact.script.switches[0].atMs;
  const p0 = v.artifact.script.ops.filter((o) => o.id.startsWith("a.") && o.op !== "erase");
  assert.ok(p0.length, "page 0 is drawn");
  assert.ok(!p0.some(isMotionOp), "its walk did not fit before the switch: the still square");
  assert.ok(p0.every((o) => o.endMs <= sw), "everything on page 0 is drawn by its switch");
  // (… and by her real onset: 5 words, ~1.67 s on the voice, App's measure)
  assert.ok(p0.every((o) => o.endMs <= 1650), JSON.stringify(p0.map((o) => o.endMs)));
  assert.equal(BF.pageTimingCounts().stilled, before + 1);
});

test("main A1: a second view of a LIVE card never draws its key — c5-t01 e2's 8-gap scale is drawn uncut; a perimeter ask's total and a missing side are '?'; a fraction ask's bar is unnamed and unshaded; a correct verdict's reveal lifts it", async () => {
  const keyed = (answers, more = {}) => ({ scriptId: "s", beatId: "ask", kind: "explain", answers, ...more });
  const call = (ref, beat, line = "") => BF.altCall(ref, { line, withheld: [], keys: BF.liveKeys({ intent: { scriptBeat: beat } }, line) });
  // e2's ask, key "8" (gaps): the 1/4 scale stays; the asked 8-gap scale is one uncut, unnamed bar
  const two = { template: "fraction-line@1", params: { dens: [4, 8], from: 0, to: 1, marks: [[1, 4]] } };
  assert.deepEqual(call(two, keyed(["8", "8 gaps"])).bars, [{ parts: 4, shade: 1, label: "1/4" }, { parts: 1, shade: 0, label: "?" }]);
  assert.deepEqual(call(two, keyed(["8"], { reveal: true })).bars[1], { parts: 8, shade: 0, label: "?" }, "revealed: the scale is cut again");
  // c6's perimeter ask on the 6 × 4 rectangle (key 20 cm): the total stays "?" even when her line happens to say 20
  const rect = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 6, h: 4, trace: true } };
  assert.equal(call(rect, keyed(["20 cm", "20"]), "Kitna dhaaga lagega?").total, "?");
  // c6's missing-side then-card (pentagon 8, 5, 7, 6, 3; asked: the 3 m side): that side is "?", the rest labelled
  const pent = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"] } };
  const pc = call(pent, keyed(["3 m", "3"]));
  assert.deepEqual(pc.hide, [4]);
  const px = expand(pc);
  assert.ok(px.ok, String(px.errors));
  assert.deepEqual(texts(px.script), ["8 m", "5 m", "7 m", "6 m", "?", "?"]);
  // a fraction ask (key 1/3) over its circle: the bar is unnamed and unshaded
  const third = { template: "fraction-parts@1", params: { parts: 3, shade: 1, whole: "circle" } };
  // (director11 S1: only the VALUE is hidden — the card's own figure shows the shading, the bar keeps it, its name is "?";
  // director12 S4: a circle's second view is the same whole as a bar, its fraction written nowhere)
  const tc = call(third, keyed(["1/3", "ek-tihaai"]));
  assert.deepEqual({ ...tc }, { template: "fraction-parts@1", parts: 3, shade: 1, whole: "bar", hideResult: true, view: "parts" });
  // and on the seam: e2's card up, the picture asked — no 8-part bar while the card is live
  const s = lesson("c5-maths-ch02-t01");
  const beat = keyed(["8", "8 gaps"]);
  assert.equal((await s.up(two, beat)).state, "revealed");
  const v = await s.turn(two, beat, "", { request: { kind: "picture" } });
  assert.equal(v.artifact.altView, "parts");
  assert.deepEqual(v.artifact.screen.counts.wholes.map((w) => w.parts), [4, 1]);
});

test("main B: unrolled@1 draws the shape itself beside the strip, so a line that names it is true — c6 steady T14 → T16 → T18 (rectangle) and steering T14 (hexagon) on the run's own lines", async () => {
  const T = "c6-maths-ch06-t01";
  const rect = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 6, h: 4, trace: true } };
  const s = lesson(T);
  for (const line of ["Dhaaga sirf kinaare par chalta hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah area hai, use yahan nahi ginte. Ab isse aage chalte hain.",
    "Riya, ab isi rectangle ke kinaare par dhaaga lagane ka socho. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?"]) {
    const u = await s.up(rect, sb("e3"), line);
    assert.equal(u.artifact.screen.template, "measured@1");
  }
  const v = await s.turn(rect, sb("e3"), "Screen par ek rectangle hai, 6 cm lamba aur 4 cm chauda. In sabko jodkar dhaage ki lambai batao. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?", { request: { kind: "picture" } });
  assert.equal(v.state, "revealed");
  assert.equal(v.artifact.altView, "unrolled", "the run's line names the rectangle: the rectangle is on screen beside its sides");
  assert.ok(v.artifact.script.ops.some((o) => o.op === "rect" && o.w < 100), "the small rectangle");
  assert.deepEqual(texts(v.artifact.script), ["6 cm", "4 cm", "6 cm", "4 cm", "?"]);
  // steering-c6 T14: the hexagon card up, then "Screen par ek hexagon hai. Ek kinaare se ghoomkar sabhi chhah jodo …"
  const hex = { template: "shape@1", params: { shape: "hexagon", side: "5 cm" } };
  const h = lesson(T);
  assert.equal((await h.up(hex, sb("e2"))).state, "revealed");
  const hv = await h.turn(hex, sb("e2"), "Screen par ek hexagon hai. Ek kinaare se ghoomkar sabhi chhah jodo. Toh is hexagon ka parimap kitna hai?", { request: { kind: "picture" } });
  assert.equal(hv.artifact.altView, "unrolled");
  assert.ok(hv.artifact.script.ops.some((o) => o.op === "polygon" && o.points.length === 6), "the small hexagon");
  // a triangle from its three sides
  const tri = expand({ template: "unrolled@1", sides: [7, 9, 12], unit: "m", figure: { shape: "triangle", sides: [7, 9, 12] } });
  assert.ok(tri.ok && tri.script.ops.some((o) => o.op === "polygon" && o.points.length === 3));
  assert.equal(expand({ template: "unrolled@1", sides: [1, 2, 9], unit: "m", figure: { shape: "triangle", sides: [1, 2, 9] } }).ok, false, "no triangle with those sides");
});

test("Learning's c4 watermelon then-card: two cakes cut into 6 and 3 (wholes@1, unlabelled) certify and draw — the template's exact radii are not a model's circle 'cut by lines' (W8)", async () => {
  const { certifyBoardRef } = await import("../server/forge/explainer/board-ref.js");
  const melons = { template: "wholes@1", params: { wholes: [{ parts: 6 }, { parts: 3 }] } };
  const prompt = "Do ek jaise tarbooz: ek ke 6 barabar slice, doosre ke 3. Rahul kehta hai 6 wala slice bada hai. Kya Rahul sahi hai?";
  const r = await certifyBoardRef(melons, { line: prompt, withhold: { values: [] } });
  assert.ok(r.ok, JSON.stringify(r.failed));
  // live, as the then-card's own board on its prompt
  const T = "c4-maths-ch05-t01", kit = kitOf(T), L = `r8d10wm-${lessonN++}`;
  const a = { intent: { intentId: `${L}:wb:1`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: melons, scriptBeat: sb("then:c4-maths-ch05-t01-m-bigger-denominator", "check", { answers: ["No", "nahi"] }) }, line: { lessonId: L, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } };
  BF.preselect(a, { kit });
  const real = { ...a, line: { lessonId: L, text: prompt } };
  const t = BF.takePreselected(real, gateCtxFor(real, { kit, redact: [], prior: [] }));
  assert.deepEqual(t?.screen?.counts?.wholes?.map((w) => w.parts), [6, 3], BF.pickState(real));
});
