// round 7, director13 (main's v6.5, S7-S8 and Brain's P3 turn shape): each item pinned on a director13 row
// (evals/hybrid-side-by-side/results/2026-11-09-director13 on int/r6 6a41eb540; rows 0-based, the rows' text and boards
// copied here). Replayed through Studio's seam as production drives it: the turn before on its own line WITH its pages, then
// the picture turn.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { gateCtxFor } from "../server/stagecraft/board-sync.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const kitOf = (T) => kitFromFile(getTopic(T));
let lessonN = 0;

// row 16 of c4 stuck: the remediation on the circle, then the then-card's bar (its prompt starts at character 149)
const C4 = {
  T: "c4-maths-ch05-t01",
  circle: { template: "fraction-parts@1", params: { parts: 4, shade: 1, whole: "circle" } },
  bar: { template: "fraction-parts@1", params: { parts: 4, shade: 0, whole: "bar" } },
  row16: "Nahi, yeh jawab nahi hai. Poori roti ke 4 barabar tukde neeche aate hain, aur khaya hua 1 rangin tukda upar. Bache hue tukde neeche kabhi nahi aate. Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, bhinn mein batao.",
  prompt: "Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, bhinn mein batao.",
  answers: ["3/4"],
};
// row 18 of c5-t02 stuck: e2's 8-part bar, then e2's ask on two unmarked "?" bars (from character 147)
const C5 = {
  T: "c5-maths-ch02-t02",
  bar8: { template: "fraction-parts@1", params: { parts: 8, shade: 1, whole: "bar" } },
  bars: { template: "fraction-bars@1", params: { bars: [{ parts: 4, shade: 0, label: "?" }, { parts: 8, shade: 0, label: "?" }] } },
  row18: "Achha. Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?",
  prompt: "Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?",
  answers: ["1/4"],
};

/** A lesson on Studio's seam: `send(ref, beat, text, more)` preselects on the empty line (Brain's preselect: no pages yet),
 *  then takes it on her line with `more` (segments, request) and waits for its board. */
function lesson(T, prompt) {
  const kit = kitOf(T), L = `r8d13-${lessonN++}`;
  seam.studioSeam.prefetch({ lessonId: L, purpose: "practice", kit, topicId: T, child: { id: `c-${L}`, class_level: 5, language_pref: "hinglish" } });
  let n = 0;
  const send = async (ref, beat, text, { segments = null, request = null } = {}) => {
    const a = { intent: { intentId: `${L}:wb:${++n}`, lessonId: L, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref, scriptBeat: { scriptId: "s", beatId: "b", ...beat }, ...(request ? { request } : {}) },
      line: { lessonId: L, teacherReplySeq: n, text: "" }, mode: "fresh", kit: { topicId: T, content: [], item: { id: "script:card", prompt_hi: prompt, prompt_en: "" } } };
    const row = seam.studioSeam.preselectWhiteboard({ ...a });
    const hint = seam.studioSeam.preselectedAltView(L);
    const fin = { ...a, intent: { ...a.intent, ...(segments ? { segments } : {}) }, line: { ...a.line, text: typeof text === "function" ? text(hint, row) : text } };
    const k = seam.studioSeam.requestIntent(fin);
    return { row, hint, k: k?.state === "planning" && k.ready ? (await k.ready) ?? { state: "failed" } : k };
  };
  return { kit, send };
}
const check = (answers) => ({ kind: "check", ownBoard: true, answers });
const pagesOf = (k) => (k?.artifact?.screens ?? [k?.artifact?.screen]).map((s) => s?.template);

test("director13 S7 (c4 stuck row 18): after a paged turn — the circle, then the card's bar — the picture's second view is built from the LAST page on screen, the bar: the same whole round", async () => {
  const s = lesson(C4.T, C4.prompt);
  const up = await s.send(C4.circle, { kind: "remediation" }, C4.row16, { segments: [{ atChar: 149, boardRef: C4.bar, scriptBeat: { scriptId: "s", beatId: "then", ...check(C4.answers) } }] });
  assert.deepEqual(pagesOf(up.k), ["fraction-parts@1", "fraction-parts@1"]);
  const pic = await s.send(C4.bar, check(C4.answers), (hint, row) => String(row).replace(/^[^:]*:\s*/, ""), { request: { kind: "picture" } });
  assert.equal(pic.hint, "round", pic.row);
  assert.match(String(pic.row), /whole circle · parts 4 · shaded 0/);
  assert.equal(pic.k.state, "revealed");
  assert.equal(pic.k.artifact.altView, "round");
  // (the eval harness's own model of the seam — preselect avoid = the FIRST page's take, no ref — saw the circle as up and drew
  // the bar again: Brain's patch 016. The page up and its card's ref, as the seam keeps them, give the second view)
  const kit = kitOf(C4.T);
  const pg = BF.pagesBoard({ intent: { intentId: "r8d13-h:pg", lessonId: "r8d13-h", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: C4.circle, scriptBeat: { kind: "remediation" },
    segments: [{ atChar: 149, boardRef: C4.bar, scriptBeat: check(C4.answers) }] }, line: { lessonId: "r8d13-h", text: C4.row16 }, mode: "fresh", kit: { topicId: C4.T, content: [] } }, { kit });
  assert.equal(pg.lastRef, BF.refKey(C4.bar), "the turn's last page is the card's bar");
  const ask = (id) => ({ intent: { intentId: id, lessonId: "r8d13-h", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: C4.bar, scriptBeat: check(C4.answers), request: { kind: "picture" } }, line: { lessonId: "r8d13-h", text: "" }, mode: "fresh", kit: { topicId: C4.T, content: [] } });
  // (the harness's page up: the take of row 16's FIRST page, the circle, on its own words)
  const c0 = { intent: { intentId: "r8d13-h:c0", lessonId: "r8d13-h", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: C4.circle, scriptBeat: { kind: "remediation" } }, line: { lessonId: "r8d13-h", text: "" }, mode: "fresh", kit: { topicId: C4.T, content: [] } };
  BF.preselect(c0, { kit });
  const c0R = { ...c0, line: { ...c0.line, text: C4.row16.slice(0, 149) } };
  const circleUp = BF.takePreselected(c0R, gateCtxFor(c0R, { kit, redact: [], prior: [] }));
  assert.ok(circleUp?.script);
  assert.equal(BF.preselect(ask("r8d13-h:old"), { kit, avoid: circleUp.script })?.altView, undefined, "the first page as up: the bar re-drawn (director13's row)");
  assert.equal(BF.preselect(ask("r8d13-h:016"), { kit, avoid: pg.lastPage, avoidRef: pg.lastRef })?.altView, "round");
});

test("director13 S8 (c5-t02 stuck row 20): an unmarked bars ask — two \"?\" bars of 4 and 8 — has a second view: each bar a circle of the same parts, nothing named", async () => {
  assert.deepEqual({ ...BF.altCall(C5.bars, { keys: C5.answers }) }, { template: "wholes@1", wholes: [{ parts: 4, equal: true }, { parts: 8, equal: true }], view: "wholes" });
  assert.deepEqual({ ...BF.altCall({ template: "fraction-bars@1", params: { bars: [{ parts: 8, shade: 3, label: "?" }] } }, { keys: ["3/8"] }) },
    { template: "fraction-parts@1", parts: 8, shade: 3, whole: "circle", hideResult: true, view: "round" }, "one asked bar: its circle, shading kept, nothing written");
  const s = lesson(C5.T, C5.prompt);
  const up = await s.send(C5.bar8, { kind: "explain" }, C5.row18, { segments: [{ atChar: 147, boardRef: C5.bars, scriptBeat: { scriptId: "s", beatId: "e2", ...check(C5.answers) } }] });
  assert.deepEqual(pagesOf(up.k), ["fraction-parts@1", "fraction-bars@1"]);
  const pic = await s.send(C5.bars, check(C5.answers), "Dekho: ek gol 4 barabar tukdon mein, ek gol 8 barabar tukdon mein.", { request: { kind: "show" } });
  assert.equal(pic.hint, "wholes", pic.row);
  assert.equal(pic.k.state, "revealed");
  assert.equal(pic.k.artifact.altView, "wholes");
  assert.equal(pic.k.artifact.screen.template, "wholes@1");
  assert.deepEqual(pic.k.artifact.screen.counts.wholes.map((w) => w.parts), [4, 8]);
  assert.ok(!pic.k.artifact.script.ops.some((o) => o.op === "text" && /1\/4|1\/8/.test(o.text)), "the key is written nowhere");
});

test("director13, Brain's P3 turn shape: a picture turn pages its second view under its own line, then the card's own board under the card's words — flagged altView, the second view's page never bringing the card back itself", async () => {
  for (const c of [
    { ...C4, up: [C4.circle, { kind: "remediation" }, C4.row16, 149, C4.bar], card: C4.bar, alt: "Dekho, wahi bar ab gol, 4 barabar hisse.", pages: ["fraction-parts@1", "fraction-parts@1"], view: "round" },
    { ...C5, up: [C5.bar8, { kind: "explain" }, C5.row18, 147, C5.bars], card: C5.bars, alt: "Dekho: ek gol 4 barabar tukdon mein, ek gol 8 barabar tukdon mein.", pages: ["wholes@1", "fraction-bars@1"], view: "wholes" },
  ]) {
    const s = lesson(c.T, c.prompt);
    const [ref, beat, text, at, then] = c.up;
    assert.equal((await s.send(ref, beat, text, { segments: [{ atChar: at, boardRef: then, scriptBeat: { scriptId: "s", beatId: "then", ...check(c.answers) } }] })).k.state, "revealed");
    const line = `${c.alt} ${c.prompt}`;
    const p = await s.send(c.card, check(c.answers), line, { request: { kind: "picture" }, segments: [{ atChar: c.alt.length + 1, boardRef: c.card, scriptBeat: { scriptId: "s", beatId: "then", ...check(c.answers) } }] });
    assert.equal(p.k.state, "revealed", c.T);
    assert.deepEqual(pagesOf(p.k), c.pages, c.T);
    assert.equal(p.k.artifact.altView, c.view);
    assert.equal(p.k.artifact.screens[0].altView, c.view);
    assert.equal(p.k.artifact.script.switches.length, 1, "two pages: the view, then the card");
    assert.equal(p.k.artifact.script.switches[0].word, line.slice(c.alt.length + 1).split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ""));
  }
});
