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
    test("no wait turn tells the step or gives the key before the fifth hearing; the cap comes by the fifth wait", () => {
      const capAt = turns.findIndex((t) => t.lm.heardCap);
      for (const [n, t] of turns.entries()) if (n !== capAt) assert.ok(!t.lm.gave && !t.lm.stepReply?.told, `${n}: ${t.text}`);
      assert.ok(capAt >= 3, `cap at ${capAt}`);
      const c = turns[capAt];
      assert.ok(c.lm.gave || c.lm.stepReply?.told, c.text);
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

describe("B.3: any other turn ends the wait", async () => {
  const w = await walkTo("c4-maths-ch05-t01", "step");
  const turns = await w.play(["try", "give", "haan"]);
  w.done();
  test("a give-up gets help; the bare haan after it is wait one again (the short ask)", () => {
    assert.equal(turns[1].lm.waitN, undefined);
    assert.equal(turns[1].state.waitQ, undefined);
    assert.equal(turns[2].lm.waitN, 1);
    assert.ok(SHORT_ASK_FORMS.some((f) => turns[2].text.endsWith(f)) || turns[2].seams.at(-1) === "yourTurn", turns[2].text);
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
  test("waitNoQuestion trips on three wait turns with neither the question nor help (short ask, invitation, short ask) and not when one says either", () => {
    const old = [asked, C("pehle main try karun?"), short, C("haan"), T(invite, "yes", ["yourTurn"]), C("haan"), T(SHORT_ASK_FORMS[1], "yes", ["reaskShort"])];
    assert.deepEqual(flags(old, "waitNoQuestion"), [6]);
    const reasked = [asked, C("pehle main try karun?"), short, C("haan"), T(reask, "yes", ["stepAsk"]), C("haan"), T(SHORT_ASK_FORMS[1], "yes", ["reaskShort"])];
    assert.deepEqual(flags(reasked, "waitNoQuestion"), []);
    const helped = [asked, C("pehle main try karun?"), short, C("haan"), T(invite, "yes", ["yourTurn"]), C("haan"), T(`Khaane se pehle wali poori barfi yaad karo. ${SHORT_ASK_FORMS[1]}`, "yes", ["help", "reaskShort"])];
    assert.deepEqual(flags(helped, "waitNoQuestion"), []);
  });
});
