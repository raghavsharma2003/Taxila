// round 7, director11 (main's v6.3 judgement, Studio's part S1-S3): each fix pinned on a director11 row
// (evals/hybrid-side-by-side/results/2026-11-08-director11 on claude/r4-conversation 9ebf06c7; lines copied here), replayed
// through Studio's seam: the card's board up, then the turn on the run's own line.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { gateCtxFor } from "../server/stagecraft/board-sync.js";
import { expand } from "../server/forge/explainer/templates.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const kitOf = (T) => kitFromFile(getTopic(T));
const texts = (s) => (s?.ops ?? []).filter((o) => o.op === "text" || o.op === "label").map((o) => o.text);
let lessonN = 0;
function lesson(T, lang = undefined) {
  const kit = kitOf(T), L = `r8d11-${lessonN++}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  let n = 0;
  const ask = (ref, beat, text, more = {}) => ({ intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3", ...(lang ? { lang } : {}) }, boardRef: ref, scriptBeat: beat, ...more },
    line: { lessonId: L, teacherReplySeq: n, text }, mode: "fresh", kit: { topicId: T, content: [] } });
  const send = async (a) => {
    const row = seam.studioSeam.preselectWhiteboard({ ...a, line: { ...a.line, text: "" } });
    if (!a.line.text) a.line.text = String(row ?? "").replace(/^[^:]*:\s*/, "");
    const k = seam.studioSeam.requestIntent(a);
    const r = k?.state === "planning" && k.ready ? (await k.ready) ?? { state: "failed" } : k;
    return Object.assign(r ?? {}, { row });
  };
  return { L, kit, up: (ref, beat, text = "") => send(ask(ref, beat, text)), turn: (ref, beat, text, more) => send(ask(ref, beat, text, more)) };
}
const sb = (beatId, kind = "explain", more = {}) => ({ scriptId: "s", beatId, kind, ...(kind === "check" ? { ownBoard: true } : {}), ...more });

test("S1 (c5-t01 offtopic T26): an asked mark's second view keeps its POSITION and the line's 0 and 1 — the value alone is '?' — and her line naming the 'nishaan' brings the card's line back", async () => {
  const s = lesson("c5-maths-ch02-t01");
  const ref = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, mark: 1 } };
  assert.equal((await s.up(ref, sb("e1"))).state, "revealed");
  const v = await s.turn(ref, sb("e1"), "Dekho, yahi numbers ab patti par. 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?", { request: { kind: "picture" } });
  assert.equal(v.state, "revealed");
  assert.equal(v.artifact.altView, "parts");
  assert.equal(v.artifact.script.switches?.length, 1, "two pages: the bar, then the card's line where she names the marks");
  assert.deepEqual(v.artifact.screens[0].counts.wholes, [{ parts: 8, shaded: 1, label: "?" }], "position kept, value hidden");
  const p0 = v.artifact.script.ops.filter((o) => o.id.startsWith("a.") && o.op === "text").map((o) => o.text);
  assert.deepEqual(p0, ["?", "0", "1"]);
  assert.equal(v.artifact.screen.template, "fraction-line@1");
  assert.ok(!texts(v.artifact.script).includes("1/8"), "the asked 1/8 is never written");
});

test("S2 (c5-t02 steady T18): 'Dekho, yahi 1/8 aur 1/4 ab patti par. Aisi hi 0 se 1 wali sankhya rekha par …' — the bars, then the card's own number line from where she names it", async () => {
  const s = lesson("c5-maths-ch02-t02");
  const ref = { template: "fraction-line@1", params: { den: 8, from: 0, to: 1, marks: [{ num: 1, label: "1/8" }, { num: 2, label: "1/4" }] } };
  assert.equal((await s.up(ref, sb("e2"))).state, "revealed");
  const before = BF.cardBackCount();
  const line = "Dekho, yahi 1/8 aur 1/4 ab patti par. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?";
  const v = await s.turn(ref, sb("e2"), line, { request: { kind: "picture" } });
  assert.equal(v.artifact.altView, "parts");
  assert.equal(BF.cardBackCount(), before + 1);
  assert.equal(v.artifact.screens[0].template, "fraction-bars@1");
  assert.equal(v.artifact.screens[1].from, line.indexOf("Aisi hi"));
  assert.equal(v.artifact.screens[1].template, "fraction-line@1");
  assert.equal(v.artifact.script.switches[0].word, "aisi");
});

test("S2: the strips' facts name each whole by its drawn title (c4 steady T18 said '1 wala … 2 wala' over Cake A | Cake B); a one-row grid's second view is the same whole, round, its asked fraction unwritten (c4 steering T14)", async () => {
  const T = "c4-maths-ch05-t01";
  const s = lesson(T);
  const cakes = { template: "wholes@1", params: { wholes: [{ parts: 3, equal: false, title: "Cake A" }, { parts: 3, title: "Cake B" }] } };
  assert.equal((await s.up(cakes, sb("e2"))).state, "revealed");
  const v = await s.turn(cakes, sb("e2"), "", { request: { kind: "picture" } });
  assert.equal(v.artifact.altView, "strips");
  assert.match(String(v.row), /Cake A: 3 unequal parts/);
  assert.match(String(v.row), /Cake B: 3 equal parts/);
  const g = lesson(T);
  const grid = { template: "shade-grid@1", params: { rows: 1, cols: 4, shade: 3, labels: false, hideResult: true } };
  const beat = sb("then:c4-maths-ch05-t01-m-part-part", "check", { answers: ["3/4"] });
  assert.equal((await g.up(grid, beat, "Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, bhinn mein batao.")).state, "revealed");
  const r = await g.turn(grid, beat, "", { request: { kind: "picture" } });
  assert.equal(r.artifact.altView, "round");
  assert.equal(r.artifact.screen.template, "fraction-parts@1");
  assert.ok(r.artifact.script.ops.filter((o) => o.op === "sector").length === 3, "3 of the 4 parts shaded");
  assert.ok(!r.artifact.script.ops.some((o) => o.op === "numwork"), "3/4, the card's key, is not written");
});

test("S2 (c6 steering T12 → T14, the run's exact lines): the hexagon card left by a paged turn draws its unrolled view, the hexagon beside the strip", async () => {
  const T = "c6-maths-ch06-t01", s = lesson(T);
  const pent = { template: "measured@1", params: { shape: "pentagon", unit: "m", sides: [8, 5, 7, 6, 3], names: ["P", "Q", "R", "S", "T"], trace: true } };
  const tri = { template: "measured@1", params: { shape: "triangle", unit: "cm", sides: [4, 5, 6], trace: true } };
  const hex = { template: "shape@1", params: { shape: "hexagon", side: "5 cm" } };
  const t12 = "Haan, sahi hai, kyunki paanchon bhujayein judti hain, 8 + 5 + 7 + 6 + 3 = 29 m. Aur pehle wale sawaal ka jawab 15 cm tha, kyunki teeno bhujayein judti hain, 4 + 5 + 6 = 15 cm. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?";
  const a = await s.turn(pent, sb("then:c6-maths-ch06-t01-m-missing-sides", "check"), t12, { segments: [{ atChar: 80, atClause: 1, boardRef: tri, scriptBeat: sb("e1") }, { atChar: 176, atClause: 2, boardRef: hex, scriptBeat: sb("e2", "explain", { answers: ["30 cm", "30"] }) }] });
  assert.equal(a.state, "revealed");
  const v = await s.turn(hex, sb("e2", "explain", { answers: ["30 cm", "30"] }), "Screen par ek hexagon hai. Sab kinaaron ki lambai jodo. Toh is hexagon ka parimap kitna hai?", { request: { kind: "picture" } });
  assert.equal(v.artifact.altView, "unrolled");
  assert.deepEqual(texts(v.artifact.script), ["5 cm", "5 cm", "5 cm", "5 cm", "5 cm", "5 cm", "?"]);
  assert.ok(v.artifact.script.ops.some((o) => o.op === "polygon" && o.points.length === 6));
});

test("S3: in Hindi mode a template's own words are Hindi — '2 barabar hisse', 'parimap' — and the card's board still draws (c4 steady T80)", async () => {
  const T = "c4-maths-ch05-t01", kit = kitOf(T);
  const ref = { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "bar" } };
  const line = "Yeh patti 2 barabar hisson mein bati hai. Rangin hissa patti ka aadha hai, yaani 1/2.";
  for (const [lang, want] of [["hinglish", "2 equal parts"], ["hi", "2 barabar hisse"]]) {
    const L = `r8d11s3-${lessonN++}`;
    const a = { intent: { intentId: `${L}:wb:1`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3", lang }, boardRef: ref, scriptBeat: sb("e1") }, line: { lessonId: L, text: "" }, mode: "fresh", kit: { topicId: T, content: [] } };
    BF.preselect(a, { kit });
    const real = { ...a, line: { lessonId: L, text: line } };
    const t = BF.takePreselected(real, gateCtxFor(real, { kit, redact: [], prior: [] }));
    assert.ok(t?.script && t.by === "script", `${lang}: the card's own board (${BF.pickState(real)})`);
    assert.ok(texts(t.script).includes(want), `${lang}: ${JSON.stringify(texts(t.script))}`);
  }
  const rect = expand({ template: "measured@1", shape: "rect", w: 6, h: 4, unit: "cm", name: true, trace: true }, { lang: "hi" });
  assert.ok(rect.ok && texts(rect.script).includes("parimap") && !texts(rect.script).includes("perimeter"));
});

test("Learning's D1: wholes@1 takes two unequal parts (the roti's 'ek bada, ek chhota'); equal-groups@1 `sizes` draws unequal groups (7, 3, 3, 3; 6, 3, 3); W8 counts a whole's shaded pieces as its shading, not more pieces", async () => {
  const { certifyBoardRef } = await import("../server/forge/explainer/board-ref.js");
  const { lintScript } = await import("../shared/whiteboard.js");
  const roti = { template: "wholes@1", params: { wholes: [{ parts: 2, equal: false, title: "Roti" }] } };
  for (const ref of [roti, { ...roti, params: { ...roti.params, as: "bar" } }]) {
    const r = await certifyBoardRef(ref, { line: "Ek roti ke 2 tukde kiye: ek bada, ek chhota. Kya chhota tukda roti ka aadha hai?", withhold: { values: [] } });
    assert.ok(r.ok, JSON.stringify(r.failed));
  }
  const x = expand({ template: "wholes@1", wholes: [{ parts: 2, equal: false, title: "Roti" }] });
  assert.deepEqual(x.script.facts.onScreen, { whole1: "Roti: 2 unequal parts" });
  for (const [sizes, line] of [[[7, 3, 3, 3], "Kanche 4 group mein baante: ek group mein 7, baaki teen mein 3-3. Kya har group barabar hai?"], [[6, 3, 3], "12 pencil 3 bachchon mein baanti: ek ko 6, doosre do ko 3-3. Kya har bachche ko 1/3 mila?"]]) {
    const g = expand({ template: "equal-groups@1", sizes });
    assert.ok(g.ok, String(g.errors));
    assert.deepEqual(lintScript(g.script), []);
    assert.deepEqual(g.script.facts.counts, { groups: sizes.length, values: sizes.map(String) });
    assert.equal(g.script.ops.filter((o) => o.op === "circle").length, sizes.reduce((a, b) => a + b, 0));
    assert.ok(!g.script.ops.some((o) => o.op === "numwork"), "no equation: whether it is a fair share is the card's question");
    const r = await certifyBoardRef({ template: "equal-groups@1", params: { sizes } }, { line, withhold: { values: [] } });
    assert.ok(r.ok, JSON.stringify(r.failed));
  }
  assert.equal(expand({ template: "equal-groups@1", sizes: [3] }).ok, false);
  // shaded wholes: "ek ke 4 barabar tukdon mein se 3 rangin" over two shaded rotis (was "sector x7": 4 parts + 3 shaded)
  const shaded = { template: "wholes@1", params: { wholes: [{ parts: 4, shade: 3, title: "Roti A" }, { parts: 4, shade: 1, title: "Roti B" }] } };
  const r = await certifyBoardRef(shaded, { line: "Do ek jaisi roti: ek ke 4 barabar tukdon mein se 3 rangin, doosri ke 4 mein se 1. Kaunsi zyada rangin hai?", withhold: { values: [] } });
  assert.ok(r.ok, JSON.stringify(r.failed));
  // (her counts still bind: 4 pieces under "3 barabar tukde" stays refused)
  const bad = await certifyBoardRef({ template: "wholes@1", params: { wholes: [{ parts: 4, shade: 1, title: "Roti" }] } }, { line: "Roti ke 3 barabar tukde hain, 1 rangin hai. Rangin hissa kitna hai?", withhold: { values: [] } });
  assert.equal(bad.ok, false);
});
