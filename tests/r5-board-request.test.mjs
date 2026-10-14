// Round 5, stream 2 (the board), RCA-1: the board draws what the child asked for, never the same page twice unasked, and a
// page drawn for a request is a new page. Pure: no network, no database, no model (the line planner is a stub).
// The live measure is tests/prod/r5-board-asks.mjs (40 asks, classes 1-9, real models on TEST).
import { test } from "node:test";
import assert from "node:assert/strict";
import { requestOf, visualAskOf } from "../server/director/requests.js";
import { drawableSubject, initLessonState, step } from "../server/director/state.js";
import { whiteboardIntentOf, requestOfSee } from "../server/brain/propose.js";
import { answersRequest, samePage, subjectWords, numbersOn, pageSig, plannerRequest, pointsAtStage, numberLineBoard, unpointGently, pictureSubjectOf, freeAsked } from "../server/studio/request.js";
import * as boardSync from "../server/stagecraft/board-sync.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

// the owner's table (a95d2ff1, c9-maths-ch08-t01-s1): 7 of 10 pages, whatever was asked
const TABLE = { v: 1, board: { w: 400, h: 300 }, mode: "fresh", durationMs: 4000, ops: ["Recursive rule", "Explicit rule", "First term", "Nth term"].map((text, i) =>
  ({ id: `t${i}`, op: "text", at: [100 + (i % 2) * 200, 60 + Math.floor(i / 2) * 60], text, size: "m", t: [800 + i * 400, 1100 + i * 400] })) };
const ALOO = { ...TABLE, ops: [{ id: "c", op: "ellipse", c: [200, 150], rx: 80, ry: 50, t: [800, 1600] }, { id: "l", op: "label", at: [200, 240], text: "aloo", to: [200, 180], t: [1600, 2000] }] };
const NL = (cells) => ({ ...TABLE, ops: [{ id: "n", op: "numwork", at: [40, 150], layout: "number_line", rows: [cells], range: [0, 1], t: [800, 2400] }] });

test("the asks from the owner's lessons and the round-5 brief are read as asks to SEE, with what to show", () => {
  const cases = {
    "aloo dikhao": { show: "show", subject: "aloo" }, "आलू दिखाओ": { show: "show", subject: "आलू" }, "photo dikhao": { show: "picture" },
    "isko draw karo": { show: "draw" }, "number line pe dikhao": { show: "number_line" }, "number line pe 1/4 dikhao": { show: "number_line", said: ["1/4"] },
    "number line pe minus 3 dikhao": { show: "number_line", said: ["-3"] }, "sikke ki photo dikhao": { show: "picture", subject: "sikke" },
    "baraf aur bhaap ka diagram dikhao": { show: "draw", subject: "baraf aur bhaap" }, "shadow kaise banta hai draw karke dikhao": { show: "draw", subject: "shadow" },
    "show me a picture of a potato": { show: "picture", subject: "potato" }, "diagram bana ke dikhao": { show: "draw" },
  };
  for (const [said, want] of Object.entries(cases)) {
    const r = requestOf(said);
    assert.equal(r?.type, "visual", said);
    assert.deepEqual(r.see, want, said);
  }
  // not a thing to see: an example, a game, a pointing word, an answer
  for (const said of ["ek example do", "answer dikhao", "phir se dikhao", "isko dikhao", "kaise karte hain dikhao", "answer 12 hai", "7"]) assert.equal(requestOf(said)?.see, undefined, said);
  assert.equal(requestOf("game khelna hai")?.kind, "game");
  assert.equal(visualAskOf("board clear karo"), null);
});

test("a thing outside the kit is sketched only when code says a plain sketch may show it; doubt keeps the honest floor", () => {
  for (const ok of ["aloo", "chidiya ki chonch", "tiranga", "pahad"]) assert.equal(drawableSubject(ok), true, ok);
  for (const no of ["meri photo", "gun", "ladki", "my face", "12 aloo", "ek bahut bada aur lamba pahad wala"]) assert.equal(drawableSubject(no), false, no);
  const K = kit();
  const r0 = step(step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 }).state,
    { event: "turn", kit: K, cls: cls("no_evidence"), now: 20_000 });
  const ask = (text) => step(r0.state, { event: "turn", kit: K, cls: { ...cls("no_evidence"), request: requestOf(text) }, text, now: 40_000 });
  const aloo = ask("aloo dikhao");
  assert.equal(aloo.move.request, "visual");
  assert.deepEqual(aloo.move.see, { show: "show", subject: "aloo", off: true });
  assert.doesNotMatch(aloo.move.shape, /it is on the screen now/, "never pointed at before it is drawn");
  const gun = ask("gun ki photo dikhao");
  assert.equal(gun.move.request, "visual_unavailable", "not drawable: release 13's honest floor, no board");
  // a kit thing named keeps the ordinary visual path, carrying what was asked
  const parts = ask("equal parts draw karke dikhao");
  assert.equal(parts.move.request, "visual");
  assert.equal(parts.move.see?.subject, "equal parts");
  assert.match(parts.move.shape, /board draws what they asked for/);
});

test("RCA-1: the whiteboard ask carries the request, and a requested page is always a new page", () => {
  const next = { ctx: { classLevel: 9, lang: "hinglish" }, wbBeat: "b6", topicId: "c9-maths-ch08-t01", lastContent: [],
    lastMove: { kind: "reteach", skillId: "s1", visual: "diagram", request: "visual", see: { show: "number_line", said: ["1/4", "x"] } } };
  const a = whiteboardIntentOf({ lessonId: "L", turn: 3, beat: { id: "b6", type: "explain" }, next, kit: { topicId: "t" }, item: null, line: { text: "ek" } });
  assert.deepEqual(a.intent.request, { kind: "number_line", said: ["1/4"] }, "only numbers ride along");
  assert.equal(a.mode, "fresh");
  // no request: the same beat continues the board, as before
  const b = whiteboardIntentOf({ lessonId: "L", turn: 3, beat: { id: "b6", type: "explain" }, next: { ...next, lastMove: { kind: "explain" } }, kit: { topicId: "t" }, item: null, line: { text: "ek" } });
  assert.equal(b.intent.request, undefined);
  assert.equal(b.mode, "continue");
  // an older move's see never rides on a later move that is not a visual request
  assert.equal(requestOfSee(null), null);
});

test("a board answers the request by code: the thing named (any script or spelling), the numbers named, never another question's", () => {
  assert.equal(answersRequest(TABLE, { kind: "show", subject: "aloo" }), false, "the owner's table does not show aloo");
  assert.equal(answersRequest(ALOO, { kind: "show", subject: "आलू" }), true, "आलू ~ aloo");
  assert.equal(answersRequest(ALOO, { kind: "picture", subject: "potato" }), true);
  assert.equal(answersRequest(TABLE, { kind: "draw" }), true, "'isko draw karo' names no thing: what is on the table answers it");
  assert.equal(answersRequest(NL(["0", "1/4", "1"]), { kind: "number_line", said: ["1/4"] }), true);
  assert.equal(answersRequest(NL(["0", "2/5", "1"]), { kind: "number_line", said: ["1/4"] }), false, "the open question's 2/5 is not the child's 1/4");
  assert.equal(answersRequest(TABLE, { kind: "number_line" }), false);
  assert.equal(numbersOn(NL(["−3", "−2", "0"]), ["-3"]), true, "a typographic minus is a minus");
  assert.deepEqual(subjectWords("plant ki life cycle").includes("cycle"), false, "'life cycle' says what kind of picture, the plant is the thing");
  assert.deepEqual(plannerRequest({ kind: "show", subject: "aloo", offKit: true }).label, "aloo");
});

test("never the same page twice: the same texts are the same page, a kept board is not judged, an empty page never matches", () => {
  assert.equal(samePage(TABLE, { ...TABLE, ops: [...TABLE.ops].reverse() }), true);
  assert.equal(samePage(TABLE, ALOO), false);
  assert.equal(samePage({ ops: [] }, { ops: [] }), false);
  assert.equal(samePage(TABLE, null), false);
  assert.ok(pageSig(TABLE).startsWith("t:"));
});

test("the board ladder: a ready-made board that does not show the ask, or repeats the page up, is never drawn for it", async () => {
  const K = kit();
  const ask = (request, text = "Aloo mitti ke neeche ugta hai, gol aur bhoora.") => ({ intent: { intentId: `L:wb:${Math.random()}`, lessonId: "L", kind: "whiteboard", skillId: K.skills[0].id,
    beat: "explain", need: "explain", style: { band: "B3", lang: "hinglish", motion: "lively" }, ...(request ? { request } : {}) }, line: { lessonId: "L", text }, mode: "fresh", kit: { topicId: K.topicId, content: [] } });
  let planned = 0;
  const planWhiteboard = async (a) => { planned++; return { ok: true, script: { ...ALOO, scriptId: a.intent.intentId }, usd: 0 }; };
  const r = await boardSync.plan(ask({ kind: "show", subject: "aloo", offKit: true }), { kit: K, budgetMs: 4000, planWhiteboard, fallbackScript: TABLE, avoid: TABLE });
  assert.equal(r.ok, true);
  assert.equal(r.source, "line", "the line plan (told the request) draws it; the template table never stands in");
  assert.equal(answersRequest(r.script, { kind: "show", subject: "aloo" }), true);
  // the page already up is never the board again, whoever offers it
  const same = await boardSync.plan(ask(null, "Recursive rule aur Explicit rule."), { kit: K, budgetMs: 1500, planWhiteboard: async () => ({ ok: true, script: TABLE, usd: 0 }), fallbackScript: TABLE, avoid: TABLE });
  assert.ok(!same.ok || !samePage(same.script, TABLE), "no repeat of the page on screen");
  assert.ok(planned >= 1);
});

test("her pointing is judged on request turns: 'Screen par vegetables dekho' points, plain words do not", () => {
  assert.equal(pointsAtStage("Screen par “vegetables” dekho—aloo plant se milta hai."), true);
  assert.equal(pointsAtStage("Board pe dekhiye: aloo gol hai."), true);
  assert.equal(pointsAtStage("बोर्ड पर आलू देखो"), true);
  assert.equal(pointsAtStage("Aloo mitti ke neeche ugta hai, gol aur bhoora."), false);
});

test("a number line asked with numbers is drawn by code, passes the full board gate on short and long lines, and shows THOSE numbers", () => {
  const K = kit();
  for (const [said, text] of [[["1/4"], "1/4 kahan?"], [["-3"], "Dekhiye: -3, zero se 3 equal steps left. -3 ke paas kaunse integers hain?"],
    [["0.5"], "0.5, 0 aur 1 ke beech hota hai; 0 se 1 ko 10 equal parts mein baantkar paanchve mark par. 0.5 ke baad kya aata hai, Kiko?"], [["23", "14"], "23 aur 14 number line par."]]) {
    const ask = { intent: { intentId: "L:wb:1", lessonId: "L", kind: "whiteboard", skillId: K.skills[0].id, beat: "explain", need: "explain", style: { band: "B3", lang: "hinglish", motion: "lively" }, request: { kind: "number_line", said } },
      line: { lessonId: "L", text }, mode: "fresh", kit: { topicId: K.topicId, content: [] } };
    const ctx = boardSync.gateCtxFor(ask, { kit: K });
    const nl = numberLineBoard(ask.intent.request, { spanMs: ctx.speechMs });
    assert.equal(answersRequest(nl, ask.intent.request), true, said.join(","));
    const r = boardSync.regate(boardSync.retime(nl, nl.durationMs, ctx.speechMs), ask, ctx);
    assert.equal(r.ok, true, `${said}: ${JSON.stringify((r.gate?.checks ?? []).filter((c) => !c.pass))}`);
  }
  assert.equal(numberLineBoard({ kind: "number_line", said: ["7/1000"] }), null, "not drawable legibly: the line plan's job");
  // the open question's own key stays withheld even when the child names it
  assert.deepEqual(freeAsked({ values: ["1/4", "3/4"] }, { kind: "number_line", said: ["1/4", "3/4"] }, { answer: "3/4" }).values, ["3/4"]);
});

test("unpointing keeps every word she explains, and never leaves 'X ka picture' claiming a picture", () => {
  assert.equal(unpointGently("Screen par number line dekhiye: 0 aur 1 ke beech 4 barabar hisse. 1/4 kahan hoga?"), "Number line: 0 aur 1 ke beech 4 barabar hisse. 1/4 kahan hoga?");
  assert.equal(unpointGently("Screen par potato ka picture dekhiye: gol, brown tuber."), "Potato: gol, brown tuber.");
  assert.equal(unpointGently("Aloo gol hai."), "Aloo gol hai.");
  assert.equal(pictureSubjectOf("Screen par potato ka picture dekhiye"), "potato");
  assert.equal(pictureSubjectOf("Iska picture dekho"), null);
});

test("QA round 5 (D07, D08, D09): a Devanagari game ask, 'इसकी एक तस्वीर दिखाओ' with no thing named, a bare clear command", () => {
  for (const said of ["मुझे एक गेम खेलना है", "गेम खेलना है."]) assert.equal(requestOf(said)?.kind, "game", said);
  assert.deepEqual(requestOf("इसकी एक तस्वीर दिखाओ").see, { show: "picture" }, "'इसकी एक' names no thing: the picture of what is on the table");
  for (const said of ["साफ करो।", "saaf karo", "clear karo", "sab mita do", "isko hatao"]) assert.equal(requestOf(said)?.type, "clear_board", said);
  for (const said of ["साफ नहीं दिख रहा", "board mat hatao", "answer mitao mat"]) assert.notEqual(requestOf(said)?.type, "clear_board", said);
});

test("QA D08 re-run: 'एक' / 'ek' is never a subject (the board drew 'एक' as a label and she invented an apple)", async () => {
  const { freeSubjectOf } = await import("../server/director/requests.js");
  for (const said of ["इसकी एक तस्वीर दिखाओ।", "एक तस्वीर दिखाओ", "koi ek photo dikhao", "ek photo dikhao"]) assert.equal(freeSubjectOf(said), null, said);
  assert.equal(freeSubjectOf("aloo dikhao"), "aloo");
});
