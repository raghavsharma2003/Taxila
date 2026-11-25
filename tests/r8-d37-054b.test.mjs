// to-brain 054 B, a wait says the question (round d37; director35 item 3 as decided, main's ruling on question 3): at a card or an asked
// step whose question her turn before said, after "Haan, pehle tum try karo." or a bare yes, wait one is the short ask (as built), wait two
// the question's own `reask` (a hearing), wait three and after help as for a give-up ending on the question (a hearing), the fifth hearing
// the cap as built. A side-topic in a wait is parked once and neither restarts nor advances the count (052 B4). Walked with step() and
// brain/say.js textReply (the reply stubbed: every line of these turns is the script's or code's) on the live c4-maths-ch05-t01 and
// c6-maths-ch07-t01 scripts.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { findItem } = await import("../server/director/items.js");
const { textReply, replyDeps } = await import("../server/brain/say.js");
const { atQuestionOf, reaskOf, SHORT_ASK_FORMS, endsOnShortAsk } = await import("../server/director/question-run.js");
const { fillFriend } = await import("../server/director/friend.js");

const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const LINES = { try: ["pehle main try karun?", { outcome: "no_evidence", request: { type: "selftry" } }], haan: ["haan", { outcome: "no_evidence" }],
  aside: ["kal maine cricket khela, sixer maara", { outcome: "no_evidence", request: { type: "uptake" } }],
  give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }] };
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

/** A lesson walked to its first card (`which` "card", the `skip`-th) or asked worked step ("step"), every question before answered right. */
async function walkTo(TOPIC, which, skip = 0) {
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
  const kit = kitFromFile(getTopic(TOPIC));
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d37-054b", lessonKey: "d37-054b", teacher: "director" };
  let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
  r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: (await say("")).reply }];
  const turn = async (text, cls) => {
    const s = r.state;
    r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
    const t = await say(text);
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
    return { text: norm(t.reply), lm: r.state.lastMove ?? {}, seams: (t.guard?.seams ?? []).map((x) => x.right), state: r.state };
  };
  for (let i = 0; i < 300; i++) {
    const s = r.state;
    const isStep = !!(s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose);
    const isCard = String(s.lastUi?.ask?.itemId ?? "").startsWith("script:") && !isStep;
    if ((which === "card" && isCard) || (which === "step" && isStep)) { if (skip-- <= 0) break; }
    const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    await turn(it ? String(it.answer) : "haan", { outcome: it ? "correct" : "no_evidence" });
  }
  const s = r.state;
  const q = s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose ? s.lastMove.stepAsk.prompt : s.lastUi?.ask?.text;
  const script = (await import("../server/director/script.js")).scriptFor(kit).script;
  const P = atQuestionOf(script, q);
  const play = async (seq) => { const out = []; for (const k of seq) out.push(await turn(...LINES[k])); return out; };
  const done = () => { replyDeps.chat = chat0; replyDeps.chatStream = stream0; };
  return { P, script, play, done, kit, now: () => r.state };
}
const reaskFilled = (script, P) => norm(fillFriend(reaskOf(script, P), "Riya"));

// (at a card the walker reaches by right answers — a point's card — a try-first is the attempt-first format as built, the card held for the
// try: the waits there start on a bare haan)
for (const [TOPIC, which, skip] of [["c4-maths-ch05-t01", "step", 0], ["c6-maths-ch07-t01", "step", 0], ["c4-maths-ch05-t01", "card", 1], ["c6-maths-ch07-t01", "card", 2]]) {
  describe(`B.3 at ${TOPIC}'s ${which}${skip ? ` (${skip + 1})` : ""}: ${which === "step" ? "try-first, then" : ""} a bare haan, again and again`, async () => {
    const w = await walkTo(TOPIC, which, skip);
    const turns = await w.play([which === "step" ? "try" : "haan", "haan", "haan", "haan", "haan", "haan"]);
    w.done();
    test("the walk reaches the question", () => { assert.ok(w.P && w.P !== "?short", String(w.P)); });
    // (main's sixth ruling, item 1: a try-first is a request, answered as one — the go-ahead and the short ask as before cause B — and is no
    // wait turn: her turn ending on the short ask stands for the question, so the next bare haan is wait two, as before)
    test("wait one is the short ask (as built), with the go-ahead to try before it (a try-first's turn is no wait turn: sixth ruling, item 1)", () => {
      assert.equal(turns[0].lm.waitN, which === "step" ? undefined : 1);
      if (which === "step") assert.ok(turns[0].text.startsWith("Haan, pehle tum try karo."), turns[0].text);
      assert.ok(endsOnShortAsk(w.script, turns[0].text) || turns[0].seams.at(-1) === "yourTurn", turns[0].text);
    });
    test("wait two says the question's own reask, and nothing else after the go-ahead", () => {
      assert.equal(turns[1].lm.waitN, 2);
      assert.ok(turns[1].text.endsWith(reaskFilled(w.script, w.P)), `${turns[1].text} | ${reaskFilled(w.script, w.P)}`);
      assert.equal(atQuestionOf(w.script, turns[1].text), w.P);
    });
    test("wait three is help as for a give-up, ending on the question (no invitation, no short ask), never the same question sentence as wait two", () => {
      assert.equal(turns[2].lm.waitN, 3);
      assert.ok(turns[2].seams.includes("help"), turns[2].seams.join(">"));
      assert.equal(atQuestionOf(w.script, turns[2].text), w.P, turns[2].text);
      assert.ok(!turns[2].text.endsWith(reaskFilled(w.script, w.P)), turns[2].text);
    });
    // (main's second ruling, item 2: wait three and after IS a give-up with nothing held back — help while the give-up path has any, then what a
    // give-up gets with nothing left, the told step or the key with its reason; the cap where the fifth hearing comes first. The question is
    // never said again bare in help's place: no wait turn from three on is the reask alone)
    test("from wait three every turn is a give-up's: help, or the step told or the key; never the reask alone again; the wait ends by the fifth", () => {
      const end = turns.findIndex((t) => t.lm.gave || t.lm.stepReply?.told);
      assert.ok(end >= 3 && end <= 4, `ends at ${end}`);
      for (const t of turns.slice(2, end)) assert.ok(t.seams.includes("help"), `${t.lm.waitN}: ${t.seams.join(">")} ${t.text}`);
      for (const t of turns.slice(2, end + 1)) assert.ok(t.text !== reaskFilled(w.script, w.P), t.text);
      assert.ok(turns[end].lm.heardCap || which === "step", `${end}: a card keyed before the cap — ${turns[end].text}`);
    });
    // (RULING-B5 item 2: in a wait the question is heard three times at most — wait four is the cap, the step told or the key with its
    // reason, whatever help is left; never a second help turn ending on the reask heard two turns before)
    test("wait four is the cap: the step told or the key (heardCap), whatever help is left", () => {
      assert.equal(turns[3].lm.waitN, 4);
      assert.ok(turns[3].lm.heardCap, turns[3].text);
      assert.ok(turns[3].lm.gave || turns[3].lm.stepReply?.told, turns[3].text);
      assert.ok(!turns[3].text.endsWith(reaskFilled(w.script, w.P)), turns[3].text);
      for (const t of turns.slice(0, 3)) assert.ok(!t.lm.gave && !t.lm.stepReply?.told && !t.lm.heardCap, t.text);
    });
  });
}

describe("B.3: a side-topic in a wait is parked once and neither restarts nor advances the count (052 B4)", async () => {
  // (sixth ruling, item 1: the wait opens on a bare haan — a try-first's turn is no wait turn, so it holds no count to keep)
  const w = await walkTo("c4-maths-ch05-t01", "step");
  const turns = await w.play(["haan", "aside", "haan", "haan"]);
  w.done();
  test("the side-topic is parked, its turn ending on the pointed invitation, no count kept on it", () => {
    assert.ok(turns[1].seams.includes("park"), turns[1].seams.join(">"));
    assert.equal(turns[1].lm.waitN, undefined);
    assert.equal(turns[1].state.waitQ?.n, 1, "the count is kept through the side-topic");
  });
  test("the next bare haan is wait two (the reask), not wait one again and not wait three", () => {
    assert.equal(turns[2].lm.waitN, 2);
    assert.ok(turns[2].text.endsWith(reaskFilled(w.script, w.P)), turns[2].text);
    assert.equal(turns[3].lm.waitN, 3);
    // (opened on a bare haan at a step, wait two hears the step's simpler before its reask — 046 Q1's second yes — so wait three's give-up has
    // nothing left: the step told, as main's second ruling item 2 gives it)
    // (to-brain 054 C step 0, pinned — pr3b section 5: which of the two happens here: wait two says the step's simpler, then its reask;
    // wait three tells the step — never help there)
    assert.ok(turns[2].text.endsWith(reaskFilled(w.script, w.P)) && turns[2].text.length > reaskFilled(w.script, w.P).length + 20, turns[2].text);
    assert.ok(!turns[2].lm.stepReply?.told, turns[2].text);
    assert.equal(turns[3].lm.stepReply?.told, true, turns[3].text);
    assert.ok(!turns[3].seams.includes("help"), turns[3].seams.join(">"));
  });
});

// (main's second ruling, item 2, and third ruling, item 2: where help is spent before the wait — a give-up got the step's simpler, its turn
// ending on the step's reask — wait two never says that reask again: it is what wait three is, the give-up with nothing left: the step told)
for (const TOPIC of ["c4-maths-ch05-t01", "c6-maths-ch07-t01"]) describe(`RULING-B3 item 2 at ${TOPIC}'s step: help spent before the wait, the reask just heard, wait two tells the step`, async () => {
  const w = await walkTo(TOPIC, "step");
  const turns = await w.play(["give", "try", "haan"]);
  w.done();
  test("the give-up gets the step's simpler, ending on the reask; wait one; wait two the step told, not the reask again (no cap)", () => {
    assert.ok(turns[0].seams.includes("help"), turns[0].seams.join(">"));
    assert.ok(turns[0].text.endsWith(reaskFilled(w.script, w.P)), turns[0].text);
    // (sixth ruling, item 1: the try-first's turn is the go-ahead and the invitation, no wait turn — it stands for the question, so the next
    // bare haan is wait two)
    assert.equal(turns[1].lm.waitN, undefined);
    assert.ok(turns[1].text.startsWith("Haan, pehle tum try karo."), turns[1].text);
    assert.equal(turns[2].lm.waitN, 2);
    assert.ok(!turns[2].text.endsWith(reaskFilled(w.script, w.P)), turns[2].text);
    assert.ok(turns[2].lm.stepReply?.told, turns[2].text);
    assert.ok(!turns[2].lm.heardCap);
  });
});
// (RULING-B3 item 2 at a card: two give-ups, the first's help ending on the card's reask; wait two is help ending on the question, not the
// reask again; wait three the key)
for (const TOPIC of ["c4-maths-ch05-t01", "c6-maths-ch07-t01"]) describe(`RULING-B3 item 2 at ${TOPIC}'s first card: the reask heard in help, wait two is help`, async () => {
  const w = await walkTo(TOPIC, "card");
  const turns = await w.play(["give", "give", "haan", "haan", "haan"]);
  w.done();
  // (RULING-B5 item 1: the second give-up's help ended on the invitation — that was wait one, so the first bare haan is wait two, never a
  // short ask after "Ab tum batao.": the reask was heard in the first give-up's help, so wait two is help; wait three the key)
  test("the help turn ending on the invitation is wait one; the first bare haan is wait two, help ending on the question (never a short ask, never the reask alone); wait three the key", () => {
    assert.ok(turns[0].text.endsWith(reaskFilled(w.script, w.P)), turns[0].text);
    assert.equal(turns[1].seams.at(-1), "yourTurn", turns[1].seams.join(">"));
    assert.equal(turns[2].lm.waitN, 2);
    assert.ok(turns[2].seams.includes("help"), turns[2].seams.join(">"));
    assert.equal(atQuestionOf(w.script, turns[2].text), w.P, turns[2].text);
    assert.ok(!turns[2].text.endsWith(reaskFilled(w.script, w.P)), turns[2].text);
    assert.equal(turns[3].lm.waitN, 3);
    assert.ok(turns[3].lm.gave, turns[3].text);
  });
  test("where the reask was not heard (a bare haan from the card), wait two is the reask as ruled", async () => {
    const w2 = await walkTo(TOPIC, "card");
    const t2 = await w2.play(["haan", "haan"]);
    w2.done();
    assert.equal(t2[1].lm.waitN, 2);
    assert.ok(t2[1].text.endsWith(reaskFilled(w2.script, w2.P)), t2[1].text);
  });
});

describe("B.3: any other turn ends the wait", async () => {
  const w = await walkTo("c4-maths-ch05-t01", "step");
  const turns = await w.play(["try", "give", "haan"]);
  w.done();
  test("a give-up gets help and ends the wait; the bare haan after it starts a wait counted from her turns (RULING-B5 item 1)", () => {
    assert.equal(turns[1].lm.waitN, undefined);
    assert.equal(turns[1].state.waitQ, undefined);
    // (the help turn is 049 B4's third turn at the question: it ends on the invitation, no question — so it was wait one, and the bare haan
    // is wait two, the reask; never a short ask after it: two turns running with no question)
    assert.equal(turns[1].seams.at(-1), "yourTurn", turns[1].seams.join(">"));
    assert.equal(turns[2].lm.waitN, 2);
    assert.ok(turns[2].text.endsWith(reaskFilled(w.script, w.P)), turns[2].text);
    assert.ok(!SHORT_ASK_FORMS.some((f) => turns[2].text.endsWith(f)), turns[2].text);
  });
});

// B.5: the two predicates, gated, each on made rows — one that trips it and one that does not (the live c4-maths-ch05-t01 script: its first
// asked worked step).
describe("B.5: waitNoQuestion and waitSecondNotReask", async () => {
  const { PREDICATES, PENDING, lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { readFileSync } = await import("node:fs");
  const { yourTurnForms, questionObjectAt } = await import("../server/director/question-run.js");
  const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
  const P = ".skills[0].workedExample.steps[0].ask";
  const ask = questionObjectAt(script, P);
  const prompt = norm(ask.prompt.hi), reask = norm(ask.reask.hi), invite = yourTurnForms(script)[0];
  const sx = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
  const T = (text, column, seams) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:worked:step1:ask", column }, seams: sx(...seams) });
  const C = (text) => ({ who: "child", text });
  const asked = T(`Aao, agla sawaal main aur tum saath mein karenge. ${prompt}`, "right", ["verdict", "workedProblem", "stepAsk"]);
  const short = T(`Haan, pehle tum try karo. ${SHORT_ASK_FORMS[0]}`, "try_first", ["tryFirst", "reaskShort"]);
  const flags = (rows, name) => lessonFlags({ rows, script }).filter((f) => f.predicate === name).map((f) => f.row);
  test("both are gated", () => { for (const k of ["waitNoQuestion", "waitSecondNotReask"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); } });
  test("waitSecondNotReask trips on the old wait's invitation (director36 c4 steady 30) and not on the question's reask", () => {
    const old = [asked, C("pehle main try karun?"), short, C("haan"), T(invite, "yes", ["yourTurn"])];
    assert.deepEqual(flags(old, "waitSecondNotReask"), [4]);
    const now = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"])];
    assert.deepEqual(flags(now, "waitSecondNotReask"), []);
    // (a side-topic parked in the wait is passed over: the turn after it is still the wait's second)
    // (sixth ruling, item 1: opened on a bare haan — a try-first's turn is no wait turn)
    const park = T("Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.", "aside", ["park", "answerFirst"]);
    const shortY = T(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]);
    assert.deepEqual(flags([asked, C("haan"), shortY, C("sixer maara"), park, C("haan"), T(invite, "yes", ["yourTurn"])], "waitSecondNotReask"), [6]);
    assert.deepEqual(flags([asked, C("haan"), shortY, C("sixer maara"), park, C("haan"), T(reask, "yes", ["stepAsk"])], "waitSecondNotReask"), []);
  });
  test("RULING-B5 item 1: a wait is counted from her turns — a help turn ending on the invitation is wait one, so the next bare haan is wait two", () => {
    const helpInvite = T(`Khaane se pehle wali poori barfi yaad karo. ${invite}`, "give_up", ["help", "yourTurn"]);
    assert.deepEqual(flags([asked, C("pata nahi"), helpInvite, C("haan"), T(reask, "yes", ["stepAsk"])], "waitSecondNotReask"), []);
    assert.deepEqual(flags([asked, C("pata nahi"), helpInvite, C("haan"), T(SHORT_ASK_FORMS[0], "yes", ["reaskShort"])], "waitSecondNotReask"), [4]);
  });
  // (RULING-B5 item 3: tightened from three turns to two — never two turns running with no question, the wait counted from her turns)
  test("waitNoQuestion (RULING-B5: two, was three) trips on two wait turns running with neither the question nor help, and not when one says either", () => {
    const old = [asked, C("pehle main try karun?"), short, C("haan"), T(invite, "yes", ["yourTurn"]), C("haan"), T(SHORT_ASK_FORMS[1], "yes", ["reaskShort"])];
    assert.deepEqual(flags(old, "waitNoQuestion"), [4, 6]);
    const reasked = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(SHORT_ASK_FORMS[1], "yes", ["reaskShort"])];
    assert.deepEqual(flags(reasked, "waitNoQuestion"), []);
    const helped = [asked, C("pehle main try karun?"), short, C("haan"), T(`Khaane se pehle wali poori barfi yaad karo. ${SHORT_ASK_FORMS[1]}`, "yes", ["help", "reaskShort"])];
    assert.deepEqual(flags(helped, "waitNoQuestion"), []);
    // (walk 4's old shape: her turn ended on the invitation with no question — wait one counted from her turns — then a short ask)
    const fromHer = [asked, C("pata nahi"), T(invite, "give_up", ["yourTurn"]), C("haan"), T(SHORT_ASK_FORMS[0], "yes", ["reaskShort"])];
    assert.deepEqual(flags(fromHer, "waitNoQuestion"), [4]);
    assert.deepEqual(flags([...fromHer.slice(0, 4), T(reask, "yes", ["stepAsk"])], "waitNoQuestion"), []);
  });
  test("waitFourNotTold (RULING-B5 item 3): gated; a fourth wait turn that is help again is flagged; the step told or the key there is not", () => {
    assert.ok(PREDICATES.waitFourNotTold); assert.ok(!PENDING.has("waitFourNotTold"));
    const lead = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(`Khaane se pehle wali poori barfi yaad karo. ${prompt}`, "yes", ["help", "stepAsk"]), C("haan")];
    assert.deepEqual(flags([...lead, T(`Neeche wala number poori barfi ki baat karta hai. ${reask}`, "yes", ["help", "stepAsk"])], "waitFourNotTold"), [8]);
    const told = T("Neeche wala number saare tukde ginta hai, yaani 5. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?", "yes", ["workedStep", "card"], );
    assert.deepEqual(flags([...lead, { ...told, stepAnswer: { beat: "c4-maths-ch05-t01-s1:worked:step1", right: false, told: true }, heardCap: P }], "waitFourNotTold"), []);
    // (a third wait turn is not read)
    assert.deepEqual(flags([...lead.slice(0, 6), T(`Neeche wala number poori barfi ki baat karta hai. ${reask}`, "yes", ["help", "stepAsk"])], "waitFourNotTold"), []);
  });
});

// B.4: the re-pins, by name, for exactly the turns the ruling names; each read as before everywhere else.
describe("B.4: questionThreeRunning exempts the wait's re-ask; stepToldEarly exempts the cap's turn at a wait", async () => {
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { readFileSync } = await import("node:fs");
  const { questionObjectAt } = await import("../server/director/question-run.js");
  const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
  const P = ".skills[0].workedExample.steps[0].ask";
  const ask = questionObjectAt(script, P);
  const prompt = norm(ask.prompt.hi), reask = norm(ask.reask.hi);
  const sx = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
  const T = (text, column, seams, extra = {}) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:worked:step1:ask", column }, seams: sx(...seams), ...extra });
  const C = (text) => ({ who: "child", text });
  const HELP = "Khaane se pehle wali poori barfi yaad karo, jab ek bhi tukda khaya nahi gaya tha.";
  const asked = T(`Aao, agla sawaal main aur tum saath mein karenge. ${prompt}`, "right", ["verdict", "workedProblem", "stepAsk"]);
  const short = T(`Haan, pehle tum try karo. ${SHORT_ASK_FORMS[0]}`, "try_first", ["tryFirst", "reaskShort"]);
  const flags = (rows, name) => lessonFlags({ rows, script }).filter((f) => f.predicate === name).map((f) => f.row);
  test("questionThreeRunning: wait three's help after the wait's re-ask passes; the same help after a re-ask that is no wait's is still flagged", () => {
    const wait = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(`${HELP} ${prompt}`, "yes", ["help", "stepAsk"])];
    assert.deepEqual(flags(wait, "questionThreeRunning"), []);
    const old = [asked, C("pata nahi"), T(`${HELP} ${reask}`, "give_up", ["help", "stepAsk"]), C("pata nahi"), T(`Neeche wala number poori barfi ki baat karta hai. ${prompt}`, "give_up", ["help", "stepAsk"])];
    assert.deepEqual(flags(old, "questionThreeRunning"), [4]);
  });
  test("stepToldEarly: the step told on the cap's turn at a wait passes; a step told after a bare yes with no cap is still flagged", () => {
    const told = (extra) => T("Neeche wala number saare tukde ginta hai, yaani 5. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?", "yes",
      ["workedStep", "card"], { stepAnswer: { beat: "c4-maths-ch05-t01-s1:worked:step1", right: false, told: true }, ...extra });
    // (re-pinned by main's sixth ruling, item 9: the cap's place is checked — wait four here, so the lead runs to wait three's help; the same
    // cap at wait three, the question heard twice, is flagged)
    const lead3 = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan")];
    const lead = [...lead3, T(`${HELP} ${prompt}`, "yes", ["help", "stepAsk"]), C("haan")];
    assert.deepEqual(flags([...lead, told({ heardCap: P })], "stepToldEarly"), []);
    // (with no cap, a step told after a bare yes at wait three, its simpler unsaid, is still flagged)
    assert.deepEqual(flags([...lead3, told({})], "stepToldEarly"), [6]);
    assert.deepEqual(flags([...lead3, told({ heardCap: P })], "stepToldEarly"), [6]);
  });
  // (main's second ruling, item 2: also allowed on a wait's third-or-later turn where the give-up path had nothing left unsaid — the step's
  // own simpler said before it; everywhere else read as before)
  test("stepToldEarly (RULING-B2 item 2): the step told at wait three or four with its simpler said passes; with it unsaid, or at wait two, flagged", () => {
    const told = T("Neeche wala number saare tukde ginta hai, yaani 5. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?", "yes",
      ["workedStep", "card"], { stepAnswer: { beat: "c4-maths-ch05-t01-s1:worked:step1", right: false, told: true } });
    const simpler = norm(ask && script.skills[0].workedExample.steps[0].simpler.hi);
    const spent = [asked, C("pata nahi"), T(`${simpler} ${reask}`, "give_up", ["help", "stepAsk"]), C("pehle main try karun?"), short, C("haan"), T(prompt, "yes", ["stepAsk"]), C("haan")];
    assert.deepEqual(flags([...spent, told], "stepToldEarly"), []);
    // (wait four, a help turn between)
    assert.deepEqual(flags([...spent, T(`Neeche wala number poori barfi ki baat karta hai. ${prompt}`, "yes", ["help", "stepAsk"]), C("haan"), told], "stepToldEarly"), []);
    // (the simpler unsaid: help was left — flagged)
    const unsaid = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(`Kuch aur socho. ${prompt}`, "yes", ["stepAsk"]), C("haan")];
    assert.deepEqual(flags([...unsaid, told], "stepToldEarly"), [8]);
    // (wait two, the simpler said but the question last said in its first form: no give-up yet — flagged)
    assert.deepEqual(flags([asked, C("pata nahi"), T(`${simpler} ${prompt}`, "give_up", ["help", "stepAsk"]), C("pehle main try karun?"), short, C("haan"), told], "stepToldEarly"), [6]);
    // (RULING-B3: wait two where the turn that last said the question ended on its reask — wait two is what wait three is: passes)
    assert.deepEqual(flags([asked, C("pata nahi"), T(`${simpler} ${reask}`, "give_up", ["help", "stepAsk"]), C("pehle main try karun?"), short, C("haan"), told], "stepToldEarly"), []);
    // (… but not with the simpler unsaid)
    assert.deepEqual(flags([asked, C("pata nahi"), T(`Kuch aur socho. ${reask}`, "give_up", ["help", "stepAsk"]), C("pehle main try karun?"), short, C("haan"), told], "stepToldEarly"), [6]);
  });
  // (RULING-B5 item 3: item 2's told turn — wait four, the cap whatever help is left (heardCap) — is allowed exactly as the cap's is)
  test("stepToldEarly (RULING-B5): the step told at wait four as the cap (heardCap) passes with help left; the same turn with no cap is flagged", () => {
    const told = (extra) => T("Neeche wala number saare tukde ginta hai, yaani 5. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?", "yes",
      ["workedStep", "card"], { stepAnswer: { beat: "c4-maths-ch05-t01-s1:worked:step1", right: false, told: true }, ...extra });
    const lead = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(`Kuch aur socho. ${prompt}`, "yes", ["help", "stepAsk"]), C("haan")];
    assert.deepEqual(flags([...lead, told({ heardCap: P })], "stepToldEarly"), []);
    assert.deepEqual(flags([...lead, told({})], "stepToldEarly"), [8]);
  });
  test("questionFiveTimes (RULING-B5): wait four's cap after the question's fourth hearing is not read (a yes cue, and the turn ends on no question of it); a fifth hearing after a miss outside a wait still is", () => {
    const key = T("Neeche wala number saare tukde ginta hai, yaani 5. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?", "yes",
      ["workedStep", "card"], { stepAnswer: { beat: "c4-maths-ch05-t01-s1:worked:step1", right: false, told: true }, heardCap: P });
    const lead = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(`${HELP} ${prompt}`, "yes", ["help", "stepAsk"]), C("haan")];
    assert.deepEqual(flags([...lead, key], "questionFiveTimes"), []);
    const misses = [asked, C("7"), T(`Nahi. ${reask}`, "wrong", ["verdict", "stepAsk"]), C("8"), T(`Nahi. ${prompt}`, "wrong", ["verdict", "stepAsk"]), C("9"), T(`Nahi. ${reask}`, "wrong", ["verdict", "stepAsk"]), C("6"), T(`Nahi. ${prompt}`, "wrong", ["verdict", "stepAsk"])];
    assert.deepEqual(flags(misses, "questionFiveTimes"), [8]);
  });
  test("waitSecondNotReask (RULING-B3): wait two as help passes where the question was last said as its reask; flagged where it was last said whole", () => {
    const simpler = norm(script.skills[0].workedExample.steps[0].simpler.hi);
    const help2 = T(`Neeche wala number poori barfi ki baat karta hai. ${prompt}`, "yes", ["help", "stepAsk"]);
    const heard = [asked, C("pata nahi"), T(`${simpler} ${reask}`, "give_up", ["help", "stepAsk"]), C("pehle main try karun?"), short, C("haan"), help2];
    assert.deepEqual(lessonFlags({ rows: heard, script }).filter((f) => f.predicate === "waitSecondNotReask").map((f) => f.row), []);
    const whole = [asked, C("pata nahi"), T(`${simpler} ${prompt}`, "give_up", ["help", "stepAsk"]), C("pehle main try karun?"), short, C("haan"), help2];
    assert.deepEqual(lessonFlags({ rows: whole, script }).filter((f) => f.predicate === "waitSecondNotReask").map((f) => f.row), [6]);
    // (the reask heard, but wait two no help — the question bare in its first form: flagged)
    const bare = [...heard.slice(0, 6), T(prompt, "yes", ["stepAsk"])];
    assert.deepEqual(lessonFlags({ rows: bare, script }).filter((f) => f.predicate === "waitSecondNotReask").map((f) => f.row), [6]);
  });
});

// Main's second ruling on cause B (RULING-B2), item 1: 053 B2's `cardWholeAfterTryOrYes` re-pinned by name. Still flagged: any full form of
// the question on the wait's first turn (her turn before said the question itself), and the card or step said whole as first written on any
// wait turn. Allowed from the wait's second turn on (her turn before was the short ask, the invitation, or an earlier turn of this wait): the
// question's `reask` alone, and a help turn ending on the question. Made rows on the live c4-maths-ch05-t01 script (a one-sentence step and
// a four-sentence card), and the matrix row that tripped the old reading (b/dry1 offtopic c4-ch01-t02 40, staged script).
describe("RULING-B2 item 1: cardWholeAfterTryOrYes, the first wait turn and the card whole flagged, the reask and help from wait two allowed", async () => {
  const { lessonFlags, PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { readFileSync } = await import("node:fs");
  const { questionObjectAt, yourTurnForms } = await import("../server/director/question-run.js");
  const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
  const sx = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
  const C = (text) => ({ who: "child", text });
  const flags = (rows, sc = script) => lessonFlags({ rows, script: sc }).filter((f) => f.predicate === "cardWholeAfterTryOrYes").map((f) => f.row);
  const invite = yourTurnForms(script)[0];
  const GO = "Haan, pehle tum try karo.";
  test("still gated", () => { assert.ok(PREDICATES.cardWholeAfterTryOrYes); assert.ok(!PENDING.has("cardWholeAfterTryOrYes")); });
  // (an asked step: its prompt is one sentence, the question itself)
  const SP = ".skills[0].workedExample.steps[0].ask", sa = questionObjectAt(script, SP);
  const sPrompt = norm(sa.prompt.hi), sReask = norm(sa.reask.hi);
  const HELP = "Khaane se pehle wali poori barfi yaad karo, jab ek bhi tukda khaya nahi gaya tha.";
  const TS = (text, column, seams) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:worked:step1:ask", column }, seams: sx(...seams) });
  const sAsked = TS(`Aao, agla sawaal main aur tum saath mein karenge. ${sPrompt}`, "right", ["verdict", "workedProblem", "stepAsk"]);
  const sShort = TS(`${GO} ${SHORT_ASK_FORMS[0]}`, "try_first", ["tryFirst", "reaskShort"]);
  test("step, wait one (her turn before said the question): the reask, the question and help ending on it are each flagged", () => {
    for (const t of [TS(`${GO} ${sReask}`, "try_first", ["tryFirst", "stepAsk"]), TS(`${GO} ${sPrompt}`, "try_first", ["tryFirst", "stepAsk"]), TS(`${HELP} ${sPrompt}`, "try_first", ["help", "stepAsk"])])
      assert.deepEqual(flags([sAsked, C("pehle main try karun?"), t]), [2], t.text);
  });
  test("step, wait two after the short ask: the reask alone and help ending on the question pass; the question as first written is flagged", () => {
    const lead = [sAsked, C("pehle main try karun?"), sShort, C("haan")];
    assert.deepEqual(flags([...lead, TS(sReask, "yes", ["stepAsk"])]), []);
    assert.deepEqual(flags([...lead, TS(`${HELP} ${sPrompt}`, "yes", ["help", "stepAsk"])]), []);
    assert.deepEqual(flags([...lead, TS(sPrompt, "yes", ["stepAsk"])]), [4]);
  });
  test("step, wait three after the reask (an earlier turn of this wait): help ending on the question passes; the question as first written is flagged", () => {
    const lead = [sAsked, C("pehle main try karun?"), sShort, C("haan"), TS(sReask, "yes", ["stepAsk"]), C("haan")];
    assert.deepEqual(flags([...lead, TS(`${HELP} ${sPrompt}`, "yes", ["help", "stepAsk"])]), []);
    assert.deepEqual(flags([...lead, TS(sReask, "yes", ["stepAsk"])]), []);
    assert.deepEqual(flags([...lead, TS(sPrompt, "yes", ["stepAsk"])]), [6]);
  });
  // (a card: its prompt is four sentences — said whole as first written on ANY wait turn is flagged, help or not)
  const CP = ".skills[0].explain[3].ask", ca = questionObjectAt(script, CP);
  const cPrompt = norm(ca.prompt.hi), cReask = norm(ca.reask.hi), cQ = norm(cPrompt.split(/(?<=[.!?])\s+/).at(-1));
  const CHELP = "Patti ke saare tukde gino, sirf bache hue nahi.";
  const TC = (text, column, seams) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:explain4:card", column }, seams: sx(...seams) });
  const cAsked = TC(`Ab yeh dekho. ${cPrompt}`, "right", ["verdict", "card"]);
  test("card, wait one: the reask is flagged; card, wait two after the invitation: the reask alone and help ending on the question pass", () => {
    assert.deepEqual(flags([cAsked, C("haan"), TC(cReask, "yes", ["card"])]), [2]);
    const lead = [cAsked, C("haan"), TC(invite, "yes", ["yourTurn"]), C("haan")];
    assert.deepEqual(flags([...lead, TC(cReask, "yes", ["card"])]), []);
    assert.deepEqual(flags([...lead, TC(`${CHELP} ${cQ}`, "yes", ["help", "card"])]), []);
  });
  test("card, wait two and three: the card said whole as first written is flagged (alone, or before the reask); help ending on the card's ask passes", () => {
    const lead = [cAsked, C("haan"), TC(invite, "yes", ["yourTurn"]), C("haan")];
    assert.deepEqual(flags([...lead, TC(cPrompt, "yes", ["card"])]), [4]);
    assert.deepEqual(flags([...lead, TC(`${cPrompt} ${cReask}`, "yes", ["card"])]), [4]);
    const lead3 = [...lead, TC(cReask, "yes", ["card"]), C("haan")];
    assert.deepEqual(flags([...lead3, TC(cPrompt, "yes", ["card"])]), [6]);
    // (a give-up's help at a card ends on the card's own ask — here its four sentences: the ruling's "help turn ending on the question")
    assert.deepEqual(flags([...lead3, TC(`${CHELP} ${cPrompt}`, "yes", ["help", "card"])]), []);
    assert.deepEqual(flags([...lead3, TC(`${CHELP} ${cQ}`, "yes", ["help", "card"])]), []);
  });
  test("RULING-B4: after an invitation, a told step ending on the next question is a new question (not flagged); the wait's own question whole with no help is flagged", () => {
    const told = TS("Neeche wala number saare tukde ginta hai, yaani 5. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?", "yes", ["workedStep", "card"]);
    const lead = [sAsked, C("pata nahi"), TS(`${HELP} ${sReask}`, "give_up", ["help", "stepAsk"]), C("pehle main try karun?"), TS(`${GO} ${invite}`, "try_first", ["tryFirst", "yourTurn"]), C("haan")];
    assert.deepEqual(flags([...lead, told]), []);
    assert.deepEqual(flags([...lead, TS(sPrompt, "yes", ["stepAsk"])]), [6]);
    // (a card: after the invitation, the card whole with no help — flagged; the key then the next card — not)
    const cLead = [cAsked, C("haan"), TC(invite, "yes", ["yourTurn"]), C("haan")];
    assert.deepEqual(flags([...cLead, TC(cPrompt, "yes", ["card"])]), [4]);
    const next = norm(questionObjectAt(script, ".skills[0].workedExample.steps[0].ask").prompt.hi);
    assert.deepEqual(flags([...cLead, TC(`Is sawaal ka jawab 1/6 hai. ${next}`, "yes", ["key", "stepAsk"])]), []);
  });
  test("the matrix row offtopic c4-ch01-t02 40 (b/dry1): wait two after the invitation, the step's reask after the go-ahead, passes", () => {
    const st = JSON.parse(readFileSync(new URL("../data/lesson-scripts-staged/c4-maths-ch01-t02.json", import.meta.url), "utf8"));
    const T = (text, column, seams) => ({ who: "teacher", text, cell: { part: "x", column }, seams: sx(...seams) });
    const rows = [T("Haan, Hindi mein sunati hoon. Sonu ka tester seedha tha, par tile tirchi. Socho, kya tester ke dono seedhe kinaare tile ki bhujaon ke saath pade the; tester fit na hone ki wajah wahi ho sakti hai. Tile tedhi lagi hai. Tester ko bhi tile jitna ghumaoge, ya seedha hi rakhoge?", "hindi", ["hindiSwitch", "help", "help", "stepAsk"]),
      C("haan"), T("Chalo, ab tumhari baari.", "yes", ["yourTurn"]), C("mujhe khud try karne do"),
      T("Haan, pehle tum try karo. Toh sawaal yeh hai. Tirchi tile par tester seedha rakhoge, ya ghuma kar?", "try_first", ["tryFirst", "stepAsk"])];
    assert.deepEqual(flags(rows, st), []);
    // (the same turn as the wait's first — her turn before said the question — is still flagged)
    assert.deepEqual(flags([rows[0], C("mujhe khud try karne do"), rows[4]], st), [2]);
  });
});

// Main's sixth ruling on cause B, item 1: a try-first is a request and is always answered as one — "Haan, pehle tum try karo." with the short
// ask or the invitation after it, as before cause B — wherever it comes: never help, the told step or the key in its place, and never a
// turn with no answer of a wait; the wait's count goes on from the turns before and after it. (b2/dry4 stuck c4-ch01-t02, c4-ch05-t01 and
// c4-ch06-t01 row 28: "mujhe khud try karne do" after a help turn that ended on an invitation got help.)
describe("sixth ruling, item 1: a try-first is answered as a request, wherever it comes", async () => {
  const goAhead = (t) => t.text.startsWith("Haan, pehle tum try karo.") && !t.seams.includes("help") && !t.lm.gave && !t.lm.stepReply?.told && !t.lm.heardCap && t.lm.waitN === undefined;
  test("after help that ended on the invitation (the matrix rows 28): the go-ahead and the short ask, then the count goes on from her turns", async () => {
    const w = await walkTo("c4-maths-ch05-t01", "card");
    const turns = await w.play(["give", "give", "try", "haan"]);
    w.done();
    assert.equal(turns[1].seams.at(-1), "yourTurn", turns[1].text);
    assert.ok(goAhead(turns[2]), turns[2].text);
    assert.ok(endsOnShortAsk(w.script, turns[2].text), turns[2].text);
    assert.equal(turns[3].lm.waitN, 2);
  });
  test("in a wait at a step (after the reask): the go-ahead and the invitation; the count is kept, and the next bare haan is wait three", async () => {
    const w = await walkTo("c4-maths-ch05-t01", "step");
    const turns = await w.play(["haan", "haan", "try", "haan"]);
    w.done();
    assert.equal(turns[1].lm.waitN, 2);
    assert.ok(goAhead(turns[2]), turns[2].text);
    assert.equal(turns[2].state.waitQ?.n, 2, "the count is kept over the try-first");
    assert.equal(turns[3].lm.waitN, 3);
  });
  test("at wait four's place at a card: the go-ahead alone (the card held for the try), never the key; the next bare haan is wait four, the cap", async () => {
    const w = await walkTo("c4-maths-ch05-t01", "card");
    const turns = await w.play(["haan", "haan", "haan", "try", "haan"]);
    w.done();
    assert.equal(turns[2].lm.waitN, 3);
    assert.ok(goAhead(turns[3]), turns[3].text);
    assert.equal(turns[4].lm.waitN, 4);
    assert.ok(turns[4].lm.heardCap && turns[4].lm.gave, turns[4].text);
  });
  test("the predicates read a try-first's turn as no wait turn (made rows, both sides)", async () => {
    const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    const { readFileSync } = await import("node:fs");
    const { yourTurnForms, questionObjectAt } = await import("../server/director/question-run.js");
    const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
    const P = ".skills[0].workedExample.steps[0].ask";
    const ask = questionObjectAt(script, P);
    const prompt = norm(ask.prompt.hi), reask = norm(ask.reask.hi), invite = yourTurnForms(script)[0];
    const sx = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
    const T = (text, column, seams) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:worked:step1:ask", column }, seams: sx(...seams) });
    const C = (text) => ({ who: "child", text });
    const asked = T(`Aao, agla sawaal main aur tum saath mein karenge. ${prompt}`, "right", ["verdict", "workedProblem", "stepAsk"]);
    const helpInvite = T(`Khaane se pehle wali poori barfi yaad karo. ${invite}`, "give_up", ["help", "yourTurn"]);
    const gated = (rows) => lessonFlags({ rows, script }).filter((f) => ["waitSecondNotReask", "waitNoQuestion", "waitFourNotTold", "cardWholeAfterTryOrYes"].includes(f.predicate)).map((f) => `${f.row}:${f.predicate}`).sort();
    // (the matrix rows 28: help ending on the invitation, then the try-first's go-ahead and short ask — no wait turn, nothing flagged; the same
    // turn on a bare yes is wait two there and is flagged)
    const go = (column) => T(`Haan, pehle tum try karo. ${SHORT_ASK_FORMS[0]}`, column, ["tryFirst", "reaskShort"]);
    assert.deepEqual(gated([asked, C("pata nahi"), helpInvite, C("mujhe khud try karne do"), go("try_first"), C("5")]), []);
    assert.deepEqual(gated([asked, C("pata nahi"), helpInvite, C("haan"), go("yes"), C("5")]), ["4:waitSecondNotReask"]);
    // (a try-first in a wait is passed over: the bare haan after it is the next place — after the reask, wait three; help there passes, and a
    // second reask there is not wait two)
    const shortY = T(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]);
    const goInv = T(`Haan, pehle tum try karo. ${invite}`, "try_first", ["tryFirst", "yourTurn"]);
    const help3 = T(`Khaane se pehle wali poori barfi yaad karo. ${reask}`, "yes", ["help", "stepAsk"]);
    assert.deepEqual(gated([asked, C("haan"), shortY, C("haan"), T(reask, "yes", ["stepAsk"]), C("pehle main try karun?"), goInv, C("haan"), help3]), []);
    assert.deepEqual(gated([asked, C("haan"), shortY, C("pehle main try karun?"), goInv, C("haan"), T(invite, "yes", ["yourTurn"])]), ["6:waitNoQuestion", "6:waitSecondNotReask"]);
  });
});

// Main's sixth ruling on cause B, item 2: what the child said is recorded as said. From wait three the walk reads the turn AS a give-up to
// choose what she says; the talk monitor (noteChildTurn), the persona signals, the learner's affect, stepRead.said and the record's cell keep
// the child's own "haan" and the cue yes.
describe("sixth ruling, item 2: a wait turn read as a give-up keeps the child's own words everywhere else", async () => {
  // (a long yes — "haan" fifteen times — so the persona's signals tell it from the give-up's two terse words: chatty, never terse)
  const LONG = Array(15).fill("haan").join(" ");
  const w = await walkTo("c4-maths-ch05-t01", "step");
  const turns = await w.play(["haan", "haan"]);
  const before = turns[1].state;
  w.done();
  test("the walk", () => { assert.equal(turns[1].lm.waitN, 2); });
  test("wait three, read as a give-up for her turn, is recorded with the child's words: talk, persona, affect, stepRead.said, cell", async () => {
    const { step } = await import("../server/director/state.js");
    const kit = w.kit;
    const r = step({ ...before, recent: [...(before.recent ?? []), { who: "child", text: LONG }] }, { event: "turn", kit, text: LONG, cls: { confidence: 0.9, flags: {}, outcome: "no_evidence" }, now: (before.turn + 1) * 20_000 });
    const lm = r.state.lastMove;
    assert.equal(lm.waitN, 3);
    assert.ok(lm.stepReply, "the step's reply is on the move");
    // (the talk monitor: fifteen words, labelled by the child's own line — never "idk")
    assert.equal(r.state.talk.childWords - (before.talk?.childWords ?? 0), 15);
    assert.notEqual(Object.entries(r.state.talk.mix).find(([k, v]) => v !== (before.talk?.mix?.[k] ?? 0))?.[0], "idk");
    // (the learner's affect: no don't-know streak from a "haan")
    assert.equal(r.state.affect.dontKnowStreak, 0);
    // (the persona: this turn's signals are a long reply's, never the give-up's terse two words)
    const mine = (r.state.persona?.log ?? []).filter((x) => x.turn === r.state.persona.turn).map((x) => x.key);
    assert.ok(r.state.persona, "a persona state");
    assert.ok(mine.includes("len+") && !mine.includes("reg-"), mine.join(","));
    // (stepRead.said, as the beat's evidence keeps it)
    const ev = (r.state.beatEvidence ?? []).filter((x) => x.kind === "stepAsk").at(-1);
    assert.equal(ev?.said, LONG.slice(0, 80).trim());
    // (the record's cell: the cue yes)
    assert.equal(lm.cell?.column, "yes");
  });
});

// Main's sixth ruling on cause B, item 3: a "haan" at a yes-or-no question is an answer. Found with the REAL read — classify.js classifyFast,
// the code that turns the child's text and the open item into the outcome before any model (production's classify() returns its result
// as is; the dry matrix harness reads the same way): at a card keyed yes or no, a bare yes or no is graded in code against the key and the
// listed wrong answers (the script-card reader's `yesNoKey`; "haan" = "yes" in its one normal form), so it reaches the walk as an answer,
// never as a bare yes, and no wait starts there. Pinned at c4-maths-ch05-t01's second card ("…Kya woh pizza ka ek-tihaai hai, haan ya
// nahi?", key "No", listed wrong answer "Yes").
describe("sixth ruling, item 3: at a yes-or-no card, haan is graded by the real read, and no wait starts on it", async () => {
  const { classifyFast, targetFor } = await import("../server/director/classify.js");
  const w = await walkTo("c4-maths-ch05-t01", "card", 1);
  const s0 = w.now();
  const item = findItem(s0, w.kit, s0.activeItemId);
  const target = targetFor(s0, w.kit, item);
  const read = (t) => classifyFast({ target, childText: t, lang: "hinglish", classLevel: 4, typed: true }).result;
  test("the card is the yes-or-no card", () => {
    assert.match(String(item?.prompt_hi ?? ""), /haan ya nahi\?$/);
    assert.equal(String(target.key).toLowerCase(), "no");
  });
  test("haan, yes, haan ji, mujhe lagta hai haan: the listed wrong answer, in code; nahi and no: right, in code", () => {
    for (const t of ["haan", "yes", "haan ji", "mujhe lagta hai haan"]) {
      const r = read(t);
      assert.equal(r?.outcome, "misconception", t); assert.equal(r?.source, "script_key", t); assert.ok(r?.wrongListed, t);
    }
    for (const t of ["nahi", "no"]) assert.equal(read(t)?.outcome, "correct", t);
  });
  // (walked here, while the reply stub is in place: every line of the turn is the script's or code's)
  // (its own line key: the other walks of this file share LINES)
  LINES.haanGraded = ["haan", read("haan")];
  const turns = await w.play(["haanGraded"]).finally(() => w.done());
  test("walked with that reading, haan there is a miss — never a wait turn, never the short ask", () => {
    assert.equal(turns[0].lm.waitN, undefined);
    assert.equal(turns[0].lm.cell?.column, "misconception");
    assert.ok(!endsOnShortAsk(w.script, turns[0].text), turns[0].text);
  });
});

// Main's sixth ruling on cause B, items 4 to 9: the checks (pr3.md's A to E, and stepToldEarly's place), each on made rows, both sides.
describe("sixth ruling, items 4 to 9: the checks", async () => {
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { readFileSync } = await import("node:fs");
  const { questionObjectAt, yourTurnForms } = await import("../server/director/question-run.js");
  const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url), "utf8"));
  const sx = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
  const C = (text) => ({ who: "child", text });
  const flags = (rows, name, sc = script) => lessonFlags({ rows, script: sc }).filter((f) => f.predicate === name).map((f) => f.row);
  const invite = yourTurnForms(script)[0];
  const q = (P) => questionObjectAt(script, P);
  const lastQ = (t) => norm(norm(t).split(/(?<=[.!?])\s+/).at(-1));
  // (the first card, e1, and the yes-or-no card after it, e2)
  const E1 = ".skills[0].explain[0].ask", E2 = ".skills[0].explain[1].ask";
  const e1 = norm(q(E1).prompt.hi), e1Reask = norm(q(E1).reask.hi), e2 = norm(q(E2).prompt.hi);
  const T1 = (text, column, seams, extra = {}) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:explain1:card", column }, seams: sx(...seams), ...extra });
  const T2 = (text, column, seams, extra = {}) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:explain2:card", column }, seams: sx(...seams), ...extra });
  const asked1 = T1(`Yeh roti dekho. ${e1}`, "yes", ["point", "card"]);
  const short1 = T1(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]);
  const KEY1 = "Is sawaal ka jawab 1/2 hai, kyunki rangin tukda roti ke 2 barabar tukdon mein se 1 hai.";
  test("item 4 (pr3 A): after an invitation, a different question passes cardWholeAfterTryOrYes only where the turn ends the wait's own (key, told step, cap)", () => {
    const lead = [asked1, C("haan"), T1(invite, "yes", ["yourTurn"]), C("haan")];
    // (the card dropped unanswered for the next card: flagged)
    assert.deepEqual(flags([...lead, T2(lastQ(e2) === e2 ? e2 : `Pizza ka ek chhota tukda lo. ${lastQ(e2)}`, "yes", ["card"])], "cardWholeAfterTryOrYes"), [4]);
    // (the key, then the next card: not flagged)
    assert.deepEqual(flags([...lead, T2(`${KEY1} ${e2}`, "yes", ["key", "card"])], "cardWholeAfterTryOrYes"), []);
  });
  const HELP1 = "Roti ke saare tukde ungli se gino, phir sirf rang wale.", HELP2 = "Roti ke dono tukde ek jitne hain, isliye dono ka naam ek hi hai.";
  test("item 5 (pr3 B): at wait two, after the reask was heard in help, help passes waitSecondNotReask only where it ends on the wait's own question", () => {
    const lead = [asked1, C("pata nahi"), T1(`${HELP1} ${e1Reask}`, "give_up", ["help", "card"]), C("haan"), short1, C("haan")];
    assert.deepEqual(flags([...lead, T1(`${HELP2} ${invite}`, "yes", ["help", "yourTurn"])], "waitSecondNotReask"), [6]);
    assert.deepEqual(flags([...lead, T1(`${HELP2} ${lastQ(e1)}`, "yes", ["help", "card"])], "waitSecondNotReask"), []);
  });
  // (pr3's x11: haan ten times across two cards — the first card's wait ends on the cap's key and check-in, and the next card is posed on the
  // "haan" to that check-in)
  const capped = [asked1, C("haan"), short1, C("haan"), T1(e1Reask, "yes", ["card"]), C("haan"), T1(`${HELP1} ${lastQ(e1)}`, "yes", ["help", "card"]), C("haan"),
    T1(`${KEY1} Yahan tak theek hai?`, "yes", ["key", "checkin"], { heardCap: E1 }), C("haan"), T2(`Pizza dekho. ${e2}`, "yes", ["point", "card"])];
  test("item 6 (pr3 C): a card posed on the haan after a wait's key starts its own wait, read like any other (two waits back to back)", async () => {
    const { waitAt } = await import("../evals/hybrid-side-by-side/d37b-predicates.mjs");
    const L = { rows: [...capped, C("haan"), T2(SHORT_ASK_FORMS[0], "yes", ["reaskShort"])] };
    assert.deepEqual(waitAt(L, 12, script), { P: E2, turns: [12] });
    // (wait two said as a short ask again: flagged — before, no wait was read at this card)
    assert.deepEqual(flags([...L.rows, C("haan"), T2(SHORT_ASK_FORMS[0], "yes", ["reaskShort"])], "waitSecondNotReask"), [14]);
    assert.deepEqual(flags([...L.rows, C("haan"), T2(norm(q(E2).reask.hi), "yes", ["card"])], "waitSecondNotReask"), []);
    // (a yes-cued turn that did NOT end its wait is still one of the wait's turns: the card said after it is no new wait)
    assert.deepEqual(waitAt({ rows: [asked1, C("haan"), short1, C("haan"), T1(e1, "yes", ["card"])] }, 4, script)?.turns, [2, 4]);
  });
  test("item 7 (pr3 D): waitFourNotTold passes a fourth wait turn that carries the cap (a yes-or-no card's verdict and check-in); without the cap it is flagged", () => {
    const L = [...capped, C("haan"), T2(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]), C("haan"), T2(norm(q(E2).reask.hi), "yes", ["card"]), C("haan"),
      T2(`Pizza ka chhota tukda uske bade tukde ke saath milaa kar dekho. ${lastQ(e2)}`, "yes", ["help", "card"]), C("haan")];
    const VERDICT = "3 tukde barabar nahi, toh gin kar 1/3 nahi keh sakte. Yahan tak theek hai?";
    assert.deepEqual(flags([...L, T2(VERDICT, "yes", ["verdict", "checkin"], { heardCap: E2 })], "waitFourNotTold"), []);
    assert.deepEqual(flags([...L, T2(VERDICT, "yes", ["verdict", "checkin"])], "waitFourNotTold"), [18]);
  });
  // (an asked step: its prompt is one sentence, the question itself)
  const SP = ".skills[0].workedExample.steps[0].ask";
  const sPrompt = norm(q(SP).prompt.hi), sReask = norm(q(SP).reask.hi);
  const TS = (text, column, seams, extra = {}) => ({ who: "teacher", text, cell: { part: "c4-maths-ch05-t01-s1:worked:step1:ask", column }, seams: sx(...seams), ...extra });
  const sAsked = TS(`Aao, agla sawaal main aur tum saath mein karenge. ${sPrompt}`, "right", ["verdict", "workedProblem", "stepAsk"]);
  const park = TS("Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.", "aside", ["park", "answerFirst"]);
  test("item 8 (pr3 E): a park's pointed invitation as the child's first line at a question is wait one, as the walk counts it (dry4 steady c6-ch07-t01 38, 40)", async () => {
    const { waitAt } = await import("../evals/hybrid-side-by-side/d37b-predicates.mjs");
    const lead = [sAsked, C("kal maine cricket khela, sixer maara"), park, C("haan samajh gayi")];
    assert.deepEqual(waitAt({ rows: [...lead, TS(sReask, "yes", ["stepAsk"])] }, 4, script)?.turns, [2, 4]);
    // (so the turn after the park is wait two: the reask passes, a short ask there is flagged — before, it read as wait one)
    assert.deepEqual(flags([...lead, TS(sReask, "yes", ["stepAsk"])], "waitSecondNotReask"), []);
    assert.deepEqual(flags([...lead, TS(SHORT_ASK_FORMS[0], "yes", ["reaskShort"])], "waitSecondNotReask"), [4]);
    // (a park inside a wait is still passed over: the count is neither restarted nor advanced)
    assert.deepEqual(waitAt({ rows: [sAsked, C("haan"), TS(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]), C("sixer maara"), park, C("haan"), TS(sReask, "yes", ["stepAsk"])] }, 6, script)?.turns, [2, 6]);
  });
  test("item 9: stepToldEarly's cap allowance checks the place — the cap at wait four or on the fifth hearing passes; the flag elsewhere does not", () => {
    const told = (extra = {}) => TS("Neeche wala number saare tukde ginta hai, yaani 5. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?", "yes", ["workedStep", "card"],
      { stepAnswer: { beat: "c4-maths-ch05-t01-s1:worked:step1", right: false, told: true }, heardCap: SP, ...extra });
    const shortS = TS(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]);
    const helpQ = TS(`Barfi ke saare tukde yaad karo, khaane se pehle wale. ${sPrompt}`, "yes", ["help", "stepAsk"]);
    // (wait four, the cap: passes; the cap's flag on wait two, the question heard twice: flagged)
    assert.deepEqual(flags([sAsked, C("haan"), shortS, C("haan"), TS(sReask, "yes", ["stepAsk"]), C("haan"), helpQ, C("haan"), told()], "stepToldEarly"), []);
    assert.deepEqual(flags([sAsked, C("haan"), shortS, C("haan"), told()], "stepToldEarly"), [4]);
    // (the fifth hearing after two misses, at wait three: passes; with one miss — the fourth hearing — flagged)
    const miss = (t) => TS(`Nahi, yeh sahi nahi hai. ${t}`, "wrong", ["verdict", "stepAsk"]);
    const tail = [C("haan"), shortS, C("haan"), TS(sReask, "yes", ["stepAsk"]), C("haan"), told()];
    assert.deepEqual(flags([sAsked, C("7"), miss(sPrompt), C("8"), miss(sReask), ...tail], "stepToldEarly"), []);
    assert.deepEqual(flags([sAsked, C("7"), miss(sPrompt), ...tail], "stepToldEarly"), [8]);
  });
});
