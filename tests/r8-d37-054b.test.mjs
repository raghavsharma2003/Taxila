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
  return { P, script, play, done, kit };
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
    test("wait one is the short ask (as built), with the go-ahead to try before it", () => {
      assert.equal(turns[0].lm.waitN, 1);
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
  });
}

describe("B.3: a side-topic in a wait is parked once and neither restarts nor advances the count (052 B4)", async () => {
  const w = await walkTo("c4-maths-ch05-t01", "step");
  const turns = await w.play(["try", "aside", "haan", "haan"]);
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
    assert.ok(turns[3].seams.includes("help"), turns[3].seams.join(">"));
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
    assert.equal(turns[1].lm.waitN, 1);
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
    const park = T("Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.", "aside", ["park", "answerFirst"]);
    assert.deepEqual(flags([asked, C("pehle main try karun?"), short, C("sixer maara"), park, C("haan"), T(invite, "yes", ["yourTurn"])], "waitSecondNotReask"), [6]);
    assert.deepEqual(flags([asked, C("pehle main try karun?"), short, C("sixer maara"), park, C("haan"), T(reask, "yes", ["stepAsk"])], "waitSecondNotReask"), []);
  });
  test("RULING-B5 item 1: a wait is counted from her turns — a help turn ending on the invitation is wait one, so the next bare haan is wait two", () => {
    const helpInvite = T(`Khaane se pehle wali poori barfi yaad karo. ${invite}`, "give_up", ["help", "yourTurn"]);
    assert.deepEqual(flags([asked, C("pata nahi"), helpInvite, C("haan"), T(reask, "yes", ["stepAsk"])], "waitSecondNotReask"), []);
    assert.deepEqual(flags([asked, C("pata nahi"), helpInvite, C("haan"), T(SHORT_ASK_FORMS[0], "yes", ["reaskShort"])], "waitSecondNotReask"), [4]);
  });
  test("waitNoQuestion trips on three wait turns with neither the question nor help (short ask, invitation, short ask) and not when one says either", () => {
    const old = [asked, C("pehle main try karun?"), short, C("haan"), T(invite, "yes", ["yourTurn"]), C("haan"), T(SHORT_ASK_FORMS[1], "yes", ["reaskShort"])];
    assert.deepEqual(flags(old, "waitNoQuestion"), [6]);
    const reasked = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(SHORT_ASK_FORMS[1], "yes", ["reaskShort"])];
    assert.deepEqual(flags(reasked, "waitNoQuestion"), []);
    const helped = [asked, C("pehle main try karun?"), short, C("haan"), T(invite, "yes", ["yourTurn"]), C("haan"), T(`Khaane se pehle wali poori barfi yaad karo. ${SHORT_ASK_FORMS[1]}`, "yes", ["help", "reaskShort"])];
    assert.deepEqual(flags(helped, "waitNoQuestion"), []);
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
    const lead = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan")];
    assert.deepEqual(flags([...lead, told({ heardCap: P })], "stepToldEarly"), []);
    assert.deepEqual(flags([...lead, told({})], "stepToldEarly"), [6]);
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
