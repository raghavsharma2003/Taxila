// round 7: main's hybrid-pilot judgement (docs/design/round7/judgements/hybrid-pilot-2026-11-04.md), one test per defect on the
// exact transcript turn (evals/hybrid-side-by-side/results/2026-11-04/, c6-maths-ch06-t01, class 6, Hinglish). Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { fadeItem } from "../server/director/fading.js";
import { promptFor } from "../server/director/items.js";
import { requestOf } from "../server/director/requests.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const RANI = kitFromFile(getTopic("c6-maths-ch06-t01"));
const NE = cls("no_evidence");
const start = (K = RANI) => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, ageBand: "10-15", lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
const turn = (r, text, c = NE, extra = {}) => step(r.state, { event: "turn", kit: RANI, cls: c, text, now: (r.state.turn + 1) * 20_000, ...extra });
const withReq = (text) => { const q = requestOf(text); return q ? { ...NE, source: "request", request: q } : NE; };

test("#1 (offtopic t8): the faded card she speaks is whole and in the lesson language: never 'How far does…' in Hinglish", () => {
  for (let i = 0; i < RANI.workedExample.steps.length; i++) {
    const it = fadeItem(RANI, { index: i });
    if (!it) continue;
    const hi = promptFor(it, "hinglish");
    assert.doesNotMatch(hi, /\p{L}…/u, hi);
    assert.doesNotMatch(hi, /Rani runs|How far/, hi);
    assert.match(hi, /^Khaali jagah bharo: /, hi);
    assert.doesNotMatch(promptFor(it, "english"), /\p{L}…/u);
  }
});

test("#2 (offtopic t2): spoken 'kuch aur baat karte hain' is noticed and parked, never the ways-in repair", () => {
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r, "haan");
  const ask = withReq("kuch aur baat karte hain");
  assert.equal(ask.request?.type, "change_topic");
  r = turn(r, "kuch aur baat karte hain", ask);
  assert.doesNotMatch(r.move.shape, /picture, a story|different way|ways in/i, r.move.shape);
  assert.match(r.move.shape, /talk about something else: say yes warmly/);
  assert.notEqual(r.move.kind, "break");
  // what they name is parked with a promise and the lesson goes on
  const named = turn(r, "cricket world cup ke baare mein");
  assert.ok(named.state.later.some((e) => /cricket/.test(e.topic)), JSON.stringify(named.state.later));
  assert.equal(named.ui.moment?.kind, "park");
  // a filler ("achha theek hai", the pilot's next line) parks nothing and goes back
  const filler = turn(r, "achha theek hai");
  assert.equal((filler.state.later ?? []).length, 0);
  assert.match(filler.move.shape ?? "", /back to the work warmly|did not name anything/);
});

test("#2: the steer:else chip takes the same path", async () => {
  const { steerRequest } = await import("../server/director/steer.js");
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r, "haan");
  r = turn(r, "", { ...NE, source: "chip", request: steerRequest("steer:else") }, { chipId: "steer:else" });
  assert.match(r.move.shape, /talk about something else: say yes warmly/);
});

test("#3 (offtopic t10, steady t10): 'bye' gets the stop check-in first; a second stop ends it", () => {
  let r = start();
  for (let i = 0; i < 3; i++) r = turn(r, "haan");
  const bye = { ...withReq("bye"), flags: { ...NE.flags, wantsToStop: true } };
  const once = turn(r, "bye", bye);
  assert.equal(once.move.kind, "break");
  assert.equal(once.move.checkin, "stop");
  assert.equal(once.end, false);
  const twice = turn(once, "bye", bye);
  assert.equal(twice.move.kind, "wrap");
  // the stop chip on the check-in ends it at once
  assert.equal(turn(once, "", NE, { chipId: "stop:end" }).move.kind, "wrap");
});

test("#4 (steady t9): a heard '8' on a perimeter-or-area question is off-format, never 'I couldn't hear you'", async () => {
  const { claimsNotHeard, withoutNotHeard, textReply, replyDeps } = await import("../server/brain/say.js");
  const { chat } = await import("../server/azure.js");
  const { findItem } = await import("../server/director/items.js");
  assert.equal(claimsNotHeard("Riya, tumhara answer mujhe clearly sunai nahi diya."), true);
  assert.equal(claimsNotHeard("Sorry, I couldn't hear you."), true);
  assert.equal(claimsNotHeard("Achha, tumne 8 kaha."), false);
  assert.equal(withoutNotHeard("Riya, tumhara answer mujhe clearly sunai nahi diya. Please wahi answer phir se bolo."), "Please wahi answer phir se bolo.");
  // the Director: a heard word or number read as "unclear" is the off-format nudge
  let r = start();
  for (let i = 0; i < 10 && !r.state.activeItemId; i++) r = turn(r, "haan");
  assert.ok(r.state.activeItemId, "a card on the table");
  const off = turn(r, "8", { ...NE, source: "note", request: { type: "unclear", whole: true, src: "note" } });
  assert.match(off.move.shape, /they said "8", which does not answer this question as asked: .*never say you could not hear it/);
  // the reply guard: the hearing claim goes whatever the move
  try {
    replyDeps.chat = async () => ({ text: `Riya, tumhara answer mujhe clearly sunai nahi diya. Tumne 8 kaha; ${off.ui.ask?.text ?? "kaunsa?"}` });
    const out = await textReply({ instructions: "x", state: { ...off.state, mode: "text" }, kit: RANI, childText: "8", verdict: "ungraded", history: [], ui: off.ui, module: null });
    assert.equal(claimsNotHeard(out.reply), false, out.reply);
    assert.ok(out.guard.caught.includes("notheard"));
    void findItem;
  } finally { replyDeps.chat = chat; }
});

test("#5 (steady t3): a worked example states its givens first and says a bracket so it cannot be misheard", async () => {
  const { bracketSlip, sayBrackets } = await import("../server/brain/brackets.js");
  const SH = await import("../server/director/shapes.js");
  const content = ["worked example: Rani runs 3 rounds of a rectangular park 50 m long and 30 m wide. How far does she run?",
    "steps for this part: One round is the perimeter of the park. → Perimeter = 2 × (50 + 30) = 2 × 80 = 160 m."];
  const said = "Riya, rectangle mein opposite sides equal hoti hain. Ek round ka perimeter 2 times 50 plus 30, yani 160 m hota hai.";
  assert.deepEqual(bracketSlip(said, content), { n: "2", a: "50", b: "30", op: "+" });
  const fixed = sayBrackets(said, content, "hinglish");
  assert.match(fixed, /50 plus 30, yani 80, ka 2 guna/);
  assert.equal(bracketSlip(fixed, content), null);
  assert.equal(bracketSlip("Pehle 50 plus 30, yani 80, phir 2 guna: 160 m.", content), null);
  assert.match(SH.worked({ part: 1, parts: 2 }), /first say the problem and its givens/);
  assert.doesNotMatch(SH.worked({ part: 2, parts: 2 }), /first say the problem/);
  assert.match(SH.worked({ part: 2, parts: 2 }), /a bracket is said sum first/);
});

test("#6 (steady t3): her own how-question has no key: '4' is never met with '4 nahi'", async () => {
  const { negatesAnswer, withoutNegation, textReply, replyDeps } = await import("../server/brain/say.js");
  const { chat } = await import("../server/azure.js");
  const line = "Riya, 4 nahi—rectangle mein opposite sides equal hoti hain. Ek round ka perimeter 160 m hota hai.";
  assert.equal(negatesAnswer(line, "4"), true);
  assert.equal(withoutNegation(line, "4"), "Riya, rectangle mein opposite sides equal hoti hain. Ek round ka perimeter 160 m hota hai.");
  assert.equal(negatesAnswer("Haan, 4 sides hoti hain.", "4"), false);
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r, "haan");
  r = turn(r, "4");
  try {
    replyDeps.chat = async () => ({ text: line });
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: RANI, childText: "4", verdict: "ungraded", history: [], ui: r.ui, module: null });
    assert.equal(negatesAnswer(out.reply, "4"), false, out.reply);
    assert.ok(out.guard.caught.includes("negates"));
  } finally { replyDeps.chat = chat; }
});

test("#7 (steady t5-t7): hint, then 'ek aur example do', then 'theek hai' keeps the card: it is posed again, never left", () => {
  let r = start();
  for (let i = 0; i < 14 && !(r.state.activeItemId && !String(r.state.activeItemId).includes(":")); i++) r = turn(r, "haan");
  const card = r.state.activeItemId;
  assert.ok(card);
  r = turn(r, "6", cls("incorrect"));
  assert.equal(r.move.kind, "hint");
  r = turn(r, "ek aur example do", withReq("ek aur example do"));
  assert.equal(r.state.activeItemId, card);
  r = turn(r, "theek hai", { ...NE, flags: { ...NE.flags, minimal: true } });
  assert.equal(r.state.activeItemId, card, "the same card");
  assert.equal(r.ui.ask?.itemId, card);
  assert.match(r.move.shape, /this same question again/);
});

test("#8 (agent, steady t6-t10): the agent's remediation stays at class level: counting on, a bare tiny sum, or a third card-less practice turn is the Director's", async () => {
  const { agentBreach, noteAgentTurn } = await import("../server/agent/invariants.js");
  const c6 = { classLevel: 6, kitText: "Ek triangle ki sides 5 cm, 6 cm aur 9 cm hain.", phase: "practice", cardOnTable: true };
  assert.equal(agentBreach({ say: "Chalo, paanch se chhe kadam aage gino, kitna hua?" }, c6), "level_count_on");
  assert.equal(agentBreach({ say: "Cricket mein 5 + 2 runs kitne hue?" }, c6), "level_tiny_sum");
  assert.equal(agentBreach({ say: "Teenon sides jodo: 5 + 6 + 9, kitna hua?" }, c6), null, "the kit's own sum is fine");
  assert.equal(agentBreach({ say: "Paanch se chhe kadam aage gino." }, { ...c6, classLevel: 2 }), null, "classes 1-3 may count on");
  let a = {};
  for (let i = 0; i < 2; i++) a = noteAgentTurn(a, { say: "x" }, { phase: "practice", cardOnTable: false });
  assert.equal(agentBreach({ say: "Ek aur socho." }, { ...c6, cardOnTable: false, agent: a }), "level_no_card");
});

test("#9 (agent, offtopic t2-t7): at most one engaged off-lesson turn, and never 'maths abhi side mein'", async () => {
  const { agentBreach, noteAgentTurn } = await import("../server/agent/invariants.js");
  const off = { ...NE, request: { type: "change_topic", whole: true } };
  assert.equal(agentBreach({ say: "Theek hai, Maths abhi side mein rakhte hain, cricket ki baat karte hain!" }, { classLevel: 6, cls: NE }), "diversion_set_aside");
  let a = noteAgentTurn({}, { say: "Cricket mein tumhara favourite kaun hai?" }, { cls: off });
  assert.equal(a.offRun, 1);
  assert.equal(agentBreach({ say: "Aur batao, kaunsi team pasand hai?" }, { classLevel: 6, cls: off, agent: a }), "diversion_no_return");
  assert.equal(agentBreach({ say: "Mast! Ab wapas perimeter pe." , item: { id: "x" } }, { classLevel: 6, cls: off, agent: a }), null, "a card back is the return");
});

test("#10 (offtopic t7): a yes to an offered choice asks which one, never plain practice", () => {
  process.env.TAXILA_R7_PARK_TOPIC = "off"; // the ways-in offer (the boredom offer takes the same chips)
  try {
    let r = start();
    for (let i = 0; i < 2; i++) r = turn(r, "haan");
    // (the pilot's note read "ye bahut boring hai" as boredom: the offer of picture / story / game)
    r = turn(r, "ye bahut boring hai", { ...NE, source: "note", request: { type: "boredom", whole: true, src: "note" } });
    const chips = (r.ui.chips ?? []).filter((c) => /^req:/.test(c.id));
    assert.ok(chips.length, `the ways were offered: ${r.move.kind} ${JSON.stringify(r.ui.chips)}`);
    const yes = turn(r, "haan");
    assert.match(yes.move.shape, /they said yes without picking one: ask which one/);
    assert.deepEqual(yes.ui.chips.map((c) => c.id), r.ui.chips.map((c) => c.id));
  } finally { delete process.env.TAXILA_R7_PARK_TOPIC; }
});

test("#11 (offtopic t5-t6): with no game on the screen, she never says the game did anything", async () => {
  const { gameActs, withoutGameActs, textReply, replyDeps } = await import("../server/brain/say.js");
  const { chat } = await import("../server/azure.js");
  assert.equal(gameActs("Riya, Game ne 3 ko pehli side maana."), true);
  assert.equal(gameActs("Game rule: har side ek baar gino; pehli side ka number bolo."), false, "a spoken game's rule is fine");
  assert.equal(withoutGameActs("Riya, Game ne 3 ko pehli side maana. Ab doosri side bolo."), "Ab doosri side bolo.");
  let r = start();
  for (let i = 0; i < 2; i++) r = turn(r, "haan");
  r = turn(r, "game khelna hai", withReq("game khelna hai"));
  try {
    replyDeps.chat = async () => ({ text: "Riya, Game ne 3 ko pehli side maana. Ab agli side ka number bolo, kitna hai?" });
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text", playOn: null, module: null }, kit: RANI, childText: "3", verdict: "ungraded", history: [], ui: r.ui, module: null });
    assert.equal(gameActs(out.reply), false, out.reply);
  } finally { replyDeps.chat = chat; }
});
