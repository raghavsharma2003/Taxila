// census 2026-10-21 F4 (option ≠ action; a95d2ff1, 6c45a7ea, c85501ec): the ways-in chips offered a picture and a game
// that nothing could build. The Director now offers, and her shape names, only the ways Studio (brain/turn.js studioSeam
// .waysFor) or the topic's own engine can answer. Pure (fixture kit; Studio's lesson state in memory).
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const start = () => step(step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 }).state, { event: "turn", kit: K, cls: NE, now: 20_000 });
const ask = (r, type, extra = {}) => step(r.state, { event: "turn", kit: K, cls: { ...NE, request: { type, whole: true } }, text: "x", now: (r.state.turn + 1) * 20_000, ...extra });
const ids = (r) => (r.ui.chips ?? []).map((c) => c.id);

test("F4: no game and no picture to give → neither chip is offered, and her shape offers neither", () => {
  for (const type of ["change_topic", "boredom"]) {
    const r = ask(start(), type, { ways: { picture: false, game: false } });
    assert.ok(!ids(r).includes("req:game"), `${type}: ${ids(r)}`);
    assert.ok(!ids(r).includes("req:visual"), `${type}: ${ids(r)}`);
    assert.doesNotMatch(r.move.shape, /\ba game\b|\ba picture\b/, r.move.shape);
    assert.ok(ids(r).length >= 2, "still a real choice (a story / a challenge, back to the lesson)");
  }
});

test("F4: what Studio can answer is offered and named; with no read (old callers) every way stays, as before", () => {
  const can = ask(start(), "change_topic", { ways: { picture: true, game: true } });
  assert.deepEqual(ids(can), ["req:visual", "req:story", "req:game", "stop:continue"]);
  assert.match(can.move.shape, /a picture, a story or a game/);
  const old = ask(start(), "change_topic");
  assert.deepEqual(ids(old), ["req:visual", "req:story", "req:game", "stop:continue"]);
  const noGame = ask(start(), "change_topic", { ways: { picture: true, game: false } });
  assert.ok(!ids(noGame).includes("req:game"));
  assert.match(noGame.move.shape, /a picture or a story,/);
});

test("F4 (main): her words and the chips come from one list: every offered way is named, no other way is", () => {
  const NAME = { "req:visual": "a picture", "req:story": "a story", "req:game": "a game" };
  for (const type of ["change_topic", "boredom"]) for (const picture of [true, false]) for (const game of [true, false]) {
    const r = ask(start(), type, { ways: { picture, game } });
    const offered = ids(r).filter((x) => NAME[x]);
    for (const [id, words] of Object.entries(NAME)) assert.equal(new RegExp(`\\b${words}\\b`).test(r.move.shape), offered.includes(id), `${type} ${picture}/${game}: ${id} | ${r.move.shape}`);
  }
});

test("F4: studioSeam.waysFor — frozen or off Studio offers nothing visual; a prepared piece the child can act on is a game", async () => {
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  assert.equal(studioSeam.waysFor("L-ways-none"), null, "no lesson state: the Director offers as before");
  seam.subscribe("L-ways", () => {});
  const L = seam._lesson("L-ways");
  const prev = process.env.FORGE3_PLAY;
  process.env.FORGE3_PLAY = "0";                    // play coverage out of the picture: only the lesson's own pieces
  try {
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s1" }), { picture: true, game: false });
    L.pieces.set("g1", { intentId: "g1", kind: "game", source: "skeleton", state: "fallback_ready", retired: false, skillId: "s1" });
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s1" }), { picture: true, game: true });
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s2" }), { picture: true, game: false }, "another skill's piece is not this ask's");
    L.safety = true;
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s1" }), { picture: false, game: false });
  } finally { if (prev === undefined) delete process.env.FORGE3_PLAY; else process.env.FORGE3_PLAY = prev; L.safety = false; }
});

test("F3 (census a95d2ff1 t23/25): the cantshow rewrite note never tells her a board is drawing (it pushed claims about a board with nothing on it)", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../server/brain/say.js", import.meta.url), "utf8");
  const note = src.split("\n").find((l) => l.includes('found.includes("cantshow")'));
  assert.ok(note, "the cantshow note");
  assert.doesNotMatch(note, /board draws for you/);
  assert.match(note, /point at the screen only at what is on it now/);
});

test("F3 (census b08fe8a7 t7): pointing at a diagram / picture with nothing on the stage is a screen problem, and the pointing sentence goes; the bare words and a stage with something on it are untouched", async () => {
  const { screenProblem, stripScreenRefs, POINT_DIAG } = await import("../server/director/say.js");
  const empty = {};
  const board = { studioSlot: { artifact: { kind: "whiteboard", script: { ops: [{ op: "text", text: "5 groups" }] } } } };
  for (const t of ["Is diagram mein dekho, 5 groups hain. Kitne hue?", "Ab picture mein charpai dekho: cat upar hai ya neeche?", "Look at the diagram: which side is longer?", "इस चित्र में कितने त्रिकोण हैं?"]) {
    assert.equal(screenProblem(t, empty, null), true, t);
    assert.equal(screenProblem(t, board, null), false, `with a board: ${t}`);
    assert.equal(screenProblem(t, empty, null, { coming: true }), false, `a piece coming this turn: ${t}`);
  }
  for (const t of ["Tumhe drawing pasand hai?", "Now picture the next row and count all dots.", "Aap game, picture, ya quick challenge chunenge?", "Picture: 1,48,700 + 2,52,900 ko 1."]) {
    assert.equal(POINT_DIAG.test(t), false, t);
    assert.equal(screenProblem(t, empty, null), false, t);
  }
  assert.equal(stripScreenRefs("Is diagram mein dekho, 5 groups hain. 5 groups mein kitne hue?", { stageEmpty: true }), "5 groups mein kitne hue?");
  assert.equal(stripScreenRefs("Is diagram mein dekho, 5 groups hain. Kitne hue?"), "Is diagram mein dekho, 5 groups hain. Kitne hue?", "a caller that does not pass the stage strips as before");
});

test("F3 (census 6c45a7ea t33): choice chips never single the key out by its look — a key with its working is not offered beside bare answers; alike answers still are", async () => {
  const { choicesFor } = await import("../server/director/items.js");
  const items = [{ id: "a", skillId: "s", answer: "₹20" }, { id: "b", skillId: "s", answer: "₹35" }, { id: "c", skillId: "s", answer: "I walk with my feet." }, { id: "d", skillId: "s", answer: "ears" }];
  const worked = { id: "k1", skillId: "s", answer: "₹45 (30 + 15)" };
  assert.equal(choicesFor(worked, { items: [...items, worked] }, 3), null, "the key's own working would give it away: no chips");
  const bare = { id: "k2", skillId: "s", answer: "₹45" };
  assert.deepEqual([...choicesFor(bare, { items: [...items, bare] }, 3)].sort(), ["₹20", "₹35", "₹45"]);
  const word = { id: "k3", skillId: "s", answer: "eyes" };
  const c = choicesFor(word, { items: [...items, word] }, 3);
  assert.ok(c && !c.includes("I walk with my feet."), String(c));
});

test("F3 (census 3437b744 t9/13/14): a faded step's question card carries the problem it is a gap of, and fits the card whole", async () => {
  const { fadeItem } = await import("../server/director/fading.js");
  const { askText, ASK_MAX } = await import("../server/director/say.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const kit = kitFromFile(getTopic("c9-maths-ch08-t01"));
  const its = kit.workedExample.steps.map((_, i) => fadeItem(kit, { index: i })).filter(Boolean);
  assert.ok(its.length, "the census topic's faded steps");
  for (const it of its) for (const p of [it.prompt_en, it.prompt_hi]) {
    assert.match(p, /7, 11, 15/, p);
    assert.match(p, /_{3}/, "the gap");
    assert.ok(p.length <= ASK_MAX, p);
    assert.equal(askText(p), p, "the card shows it whole (askText keeps the tail, which would drop a leading problem)");
  }
});

test("F9 (census b08fe8a7; sim lab p55): the thing to draw is a short noun phrase from the ask, never a clause the child said — no filler, verb or number word in it; 'X की ड्राइंग' names X", async () => {
  const { visualAskOf, requestOf } = await import("../server/director/requests.js");
  const subj = (t) => visualAskOf(t)?.subject ?? null;
  assert.equal(subj("सात में से दो गया तो पाँच बचा, बस दिखाओ ना drawing."), null, "the sum the child said is not a thing");
  assert.equal(subj("मैंने पहले ही बोला, पाँच बच्चे, अब दिखाओ न बस की ड्राइंग।"), "बस", "the bus");
  assert.equal(requestOf("मैंने पहले ही बोला, पाँच बच्चे, अब दिखाओ न बस की ड्राइंग।")?.subject, "बस");
  for (const [t, want] of [["windmill... umm... windmill dikhao na pehle?", "windmill"], ["umm... space... rocket dikhao na", "rocket"], ["Cheetah! Cheetah dikhao, please!", "cheetah"],
    ["arey timeline ka photo dikhao", "timeline"], ["mujhe cake banana pasand hai, chocolate wala. cake dikhao na", "cake"], ["aloo dikhao", "aloo"], ["aloo whiteboard pe draw karo", "aloo"]]) assert.equal(subj(t), want, t);
  for (const t of ["umm... mujhe addition thoda sahi lagta hai, par subtraction mein thoda problem hota hai... drawing dikhao", "High Court... par aapne draw nahi kiya abhi tak. Kahan hai? Mujhe dekhna hai, please dikhao",
    "um… theek hai. dikhao. maybe 5 group lag rahe hain.", "नहीं, मेरे को आप डायग्राम दिखाओ, मुझे देखना है डायग्राम।"]) assert.equal(subj(t), null, t);
});

test("census (main): a board and her line meet across scripts — पत्ता / patta, टिल्लू / Tillu — by the whole canonical reading, never a prefix or a token with digits", async () => {
  const { syncedWithLine } = await import("../server/studio/request.js");
  const page = (...t) => ({ ops: t.map((x, i) => ({ id: `t${i}`, op: "text", text: x })) });
  assert.equal(syncedWithLine(page("पत्ता"), "Photo nahi hai; patta bana hai—gol, hara. Uska edge kaisa hai?"), true);
  assert.equal(syncedWithLine(page("टिल्लू", "टि"), "Aaj hum Tillu ji padhenge."), true);
  assert.equal(syncedWithLine(page("पायल"), "Aaj hum Mala ki chaandi ki paayal padhenge."), true);
  assert.equal(syncedWithLine(page("कहाँ"), "Aapne teen sources bataye, aur bolkar chali aayi kahaniyan."), false, "kahaniyan is not कहाँ");
  assert.equal(syncedWithLine(page("100th step", "every step"), "Khaali jagah bhariye: 30th term?"), false, "30th is not 100th");
});

test("F9 re-check after ca0a5e11 (main): the last fillers and verbs out of a drawn subject — 'flat jaise' → flat, 'leaves daalna' → leaves, 'बेंच का मतलब' → बेंच, a bare sketch word names nothing", async () => {
  const { visualAskOf } = await import("../server/director/requests.js");
  const subj = (t) => visualAskOf(t)?.subject ?? null;
  assert.equal(subj("umm... chonch toh lambi aur tez, aur pair... aise flat jaise? photo dikhao na"), "flat");
  assert.equal(subj("um... leaves daalna hai? drawing dikhao"), "leaves");
  assert.equal(subj("हाँ, जयपुर बेंच बोल सकते हैं, लेकिन बेंच का मतलब क्या है? फोटो दिखाओ न"), "बेंच");
  assert.equal(subj("बस फॉर्म बदला है, स्केच दिखाओ"), null);
});

test("QA on D42 run 3: the board's 'side' and her 'sides' are one word (a Roman plural is also its singular)", async () => {
  const { syncedWithLine } = await import("../server/studio/request.js");
  const page = (...t) => ({ ops: t.map((x, i) => ({ id: `t${i}`, op: "text", text: x })) });
  assert.equal(syncedWithLine(page("side", "corner"), "Ab rectangle ki kitni sides aur kitne kone hote hain?"), true);
  assert.equal(syncedWithLine(page("Rice crop", "Food"), "January mein crops ready hoti hain."), true);
});

test("QA on 14.4.1 (run 8, aadae80b t1): a rectangle with its side labels is a drawing (the picture ask's template fallback shows it); a rectangle around its text is still a box", async () => {
  const { isDrawing, answersRequest } = await import("../server/studio/request.js");
  const drawn = { ops: [{ id: "r", op: "rect", at: [120, 100], w: 300, h: 180 }, { id: "a", op: "text", at: [270, 85], text: "50 m" }, { id: "b", op: "text", at: [440, 190], text: "30 m" }] };
  assert.equal(isDrawing(drawn), true);
  assert.equal(answersRequest(drawn, { kind: "picture" }), true, "a picture ask with no thing named takes it");
  const boxes = { ops: [{ id: "r1", op: "rect", at: [20, 40], w: 160, h: 60 }, { id: "t1", op: "text", at: [100, 70], text: "Change to grams" }, { id: "r2", op: "rect", at: [220, 40], w: 160, h: 60 }, { id: "t2", op: "text", at: [300, 70], text: "Compare weights" }] };
  assert.equal(isDrawing(boxes), false, "text boxes (a flow chart) are not a picture");
  assert.equal(answersRequest(boxes, { kind: "picture" }), false);
});

test("38aad918: a verb or a filler is never the named subject ('maine bola picture dikhao' drew 'bola' as a label)", async () => {
  const { freeSubjectOf, visualAskOf } = await import("../server/director/requests.js");
  for (const t of ["maine bola picture dikhao", "aapne bola tha picture dikhaogi", "toh picture dikhao", "aur photo dikhao"]) assert.equal(freeSubjectOf(t), null, t);
  assert.equal(visualAskOf("maine kaha drawing dikhao")?.subject, undefined);
  // a real thing named is still the subject
  assert.equal(freeSubjectOf("aloo ki photo dikhao"), "aloo");
  assert.equal(visualAskOf("maine bola triangle ka drawing dikhao")?.subject, "triangle");
});

test("38aad918: a kept subject is spent once a board was asked for it; a later picture ask naming nothing is not asked for it again", async () => {
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const { requestOf } = await import("../server/director/requests.js");
  const k = kitFromFile(getTopic("c5-maths-ch02-t01"));
  let r = step(initLessonState({ topicId: k.topicId, kit: k, ctx: { ...CTX, classLevel: 5, ageBand: "10-12" }, seed: 7, now: 0 }), { event: "start", kit: k, now: 0 });
  const say = (text, now) => { const req = requestOf(text); r = step(r.state, { event: "turn", kit: k, cls: { ...cls("no_evidence"), ...(req ? { request: req } : {}) }, text, now }); return r.move; };
  assert.equal(say("triangle ki picture dikhao", 20000).see?.subject, "triangle", "the turn that names it asks for it");
  for (const [i, text] of ["picture dikhao", "haan", "picture dikhao"].entries()) {
    const m = say(text, 40000 + i * 20000);
    assert.notEqual(m.see?.subject, "triangle", `turn ${i + 2} ("${text}") asked the board for the spent subject again`);
  }
});

test("(a) review: 'दी' (a spoken 'the') is never part of the thing ('दी कोन दिखाओ' asks for the cone)", async () => {
  const { visualAskOf } = await import("../server/director/requests.js");
  assert.equal(visualAskOf("पर आइसक्रीम कोन कुकिंग है। दी कोन दिखाओ।")?.subject, "कोन");
});

test("(a) review: a picture SEEN somewhere ('photo mein dekha tha') is not the ask; the ask's own clause names the thing", async () => {
  const { visualAskOf } = await import("../server/director/requests.js");
  assert.equal(visualAskOf("cylinder... gol hai na side se? lekin cake toh photo mein dekha tha book mein... cylinder dikhao")?.subject, "cylinder");
  assert.equal(visualAskOf("maine photo mein dekha tha, aloo dikhao")?.subject, "aloo");
  assert.equal(visualAskOf("par picture mein kya likha hai? Dikhao na")?.subject, undefined);
  // a picture word that IS the ask still names its thing
  assert.equal(visualAskOf("aloo ki photo dikhao")?.subject, "aloo");
  assert.equal(visualAskOf("aloo photo mein dikhao")?.subject, "aloo");
});

test("QA on be9b766a (13ec94a7, 7545d1fd): her words never deny a picture the board is drawing or showing", async () => {
  const { boardTruthShape } = await import("../server/brain/turn.js");
  const { VISUAL_NOT_YET, VISUAL_DRAWING, VISUAL_ON_STAGE, drawAsked } = await import("../server/director/shapes.js");
  // a picture ask naming nothing, no Director module: the move says nothing is on the screen (the precondition)
  let r = step(initLessonState({ topicId: kit().topicId, kit: kit(), ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: kit(), now: 0 });
  r = step(r.state, { event: "turn", kit: kit(), cls: { ...cls("no_evidence"), request: { type: "visual", kind: "diagram", whole: true } }, text: "dikhao", now: 20000 });
  const shape = String(r.move.shape);
  if (shape.includes(VISUAL_NOT_YET)) {
    assert.ok(boardTruthShape(shape, { askedBoard: true }).includes(VISUAL_DRAWING), "the board asked for this turn draws while she speaks");
    assert.ok(boardTruthShape(shape, { boardUp: true }).includes(VISUAL_ON_STAGE), "a board already up is on the screen");
    assert.ok(!boardTruthShape(shape, { boardUp: true }).includes(VISUAL_NOT_YET));
  }
  assert.equal(boardTruthShape(`x; ${VISUAL_NOT_YET}`, {}), `x; ${VISUAL_NOT_YET}`, "no board: unchanged");
  assert.ok(boardTruthShape(`x; ${VISUAL_NOT_YET}`, { askedBoard: true }).includes(VISUAL_DRAWING));
  // the photo the board sketches instead: owned up to, the drawing never denied (rule last)
  for (const photo of [undefined, "busy"]) assert.match(drawAsked({ subject: "aloo", show: "picture", photo }), /never say there is no picture or nothing on the screen$/);
});
