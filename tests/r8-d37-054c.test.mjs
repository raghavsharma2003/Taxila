// to-brain 054 C, keys, reasons and help as said (round d37; docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md section C and
// main's rulings on C3, C5, C6). Walked with step() and brain/say.js textReply (the reply model stubbed: every line of these turns is the
// script's or code's), the child's played lines read by the real code read (classify.js classifyFast against the open item's target), on the
// live scripts; and help.js's pickHelp / keyLine on the scripts themselves.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { findItem } = await import("../server/director/items.js");
const { textReply, replyDeps } = await import("../server/brain/say.js");
const { holdReplyStub } = await import("./_reply-hold.mjs");
const { classifyFast, targetFor } = await import("../server/director/classify.js");
const { normSentence } = await import("../server/director/help.js");

const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const nk = (t) => normSentence(t);
export const scriptOf = (topic) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${topic}.json`, import.meta.url), "utf8"));

/** A lesson walked until `at(state)` holds, every question before answered right; then `play(lines)` says each line, read for real. */
export async function walkUntil(TOPIC, at) {
  const free = holdReplyStub(); // (the stub held through tests/_reply-hold.mjs, counted across files: a walk's end never puts the real model back under another file's walk)
  const kit = kitFromFile(getTopic(TOPIC));
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d37-054c", lessonKey: "d37-054c", teacher: "director" };
  let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
  r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: (await say("")).reply }];
  const realRead = (s, text) => { const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null; return classifyFast({ target: targetFor(s, kit, it), childText: text, lang: s.ctx?.lang, classLevel: 4, typed: true }).result ?? null; };
  const turn = async (text, cls) => {
    const s = r.state;
    r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
    const t = await say(text);
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
    return { text: norm(t.reply), lm: r.state.lastMove ?? {}, seams: (t.guard?.seams ?? []).map((x) => x.right), state: r.state, ui: r.ui };
  };
  let found = false;
  for (let i = 0; i < 300; i++) {
    if (at(r.state)) { found = true; break; }
    const it = r.state.activeItemId ? findItem(r.state, kit, r.state.activeItemId) : null;
    await turn(it ? String(it.answer) : "haan", { outcome: it ? "correct" : "no_evidence" });
  }
  const LINES = { give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }], clarify: ["samajh nahi aaya", { outcome: "no_evidence", request: { type: "clarify" } }] };
  const play = async (seq) => { const out = []; for (const k of seq) { if (LINES[k]) out.push(await turn(...LINES[k])); else { const c = realRead(r.state, k); out.push(await turn(k, c ?? { outcome: "incorrect" })); } } return out; };
  const done = free;
  return { found, play, done, kit, now: () => r.state };
}
const atOwnStep = (s) => /:ask:worked$/.test(String(s.lastUi?.ask?.itemId ?? "")) && !s.lastMove?.stepAsk?.prompt;

describe("C1: an own step's key after misses is the step's own key with its why, no worked close after it", async () => {
  for (const [TOPIC, wrong] of [["c6-maths-ch07-t01", "1/6"], ["c6-maths-ch06-t01", "7 m"]]) {
    const w = await walkUntil(TOPIC, atOwnStep);
    const turns = await w.play([wrong, wrong, wrong, wrong, wrong, wrong]);
    w.done();
    const ys = scriptOf(TOPIC).skills[0].workedExample;
    test(`${TOPIC}: the key turn says yourStep.why, not the worked example's answer, and no "Toh poora jawab"`, () => {
      assert.ok(w.found);
      const k = turns.findIndex((t) => t.seams.includes("key"));
      assert.ok(k >= 0, turns.map((t) => t.text).join(" | "));
      const T = nk(turns[k].text);
      assert.ok(T.includes(nk(ys.yourStep.why.hi)) || T.includes(nk(ys.yourStep.why.hi).slice(-30)), turns[k].text);
      assert.ok(!T.includes(nk(ys.answer.hi)), turns[k].text);
      assert.ok(!/toh poora jawab/i.test(turns[k].text), turns[k].text);
    });
  }
});

const { pickHelp, addSaid, KEY_AFTER_MISSES } = await import("../server/director/help.js");
const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
/** The flags of one predicate over made rows (a fresh ctx per lesson, as lessonFlags builds it). */
const flagsOf = (rows, name, script) => { const ctx = { script, o: {} }; return rows.map((r, i) => (r.who === "teacher" && PREDICATES[name]({ rows }, r, i, ctx) ? i : null)).filter((x) => x != null); };
const T = (text, part, column, seams = []) => ({ who: "teacher", text, cell: { part, column }, seams: seams.map((right) => ({ right })) });
const C = (text) => ({ who: "child", text });

describe("C3: at the cap, the named wrong answer's unsaid reason first — the miss verdict, the reason, the question; the cap on the turn after", () => {
  const script = scriptOf("c6-maths-ch07-t01");
  const part = "c6-maths-ch07-t01-s1:check:c2";
  const whyAlt = script.skills[0].checks[1].whyAlt.hi;
  const named = { outcome: "misconception", wrongListed: true };
  test("the cap at the named answer with its reason unsaid: the reason, the card kept, no key", () => {
    const d = pickHelp({ script, part, request: "hint", said: [], misses: KEY_AFTER_MISSES, last: named });
    assert.equal(d.card, "keep"); assert.equal(d.key, null); assert.ok(d.capReason);
    assert.equal(nk(d.rung.text), nk(whyAlt));
  });
  // (d38 re-pins, to-brain 055 C1 as main ruled in RULING-A2 A(i): with a wording of the card unsaid the cap is first C1 — that wording, the
  // card kept, no key — and the key once a C1 turn was given at the card (`noC1`, state.js c1At). Was: the key at once)
  test("once a card: with the reason said, the cap is C1 while a wording is unsaid, then the key", () => {
    const said = addSaid([], whyAlt, 3);
    const d = pickHelp({ script, part, request: "hint", said, misses: KEY_AFTER_MISSES, last: named });
    assert.equal(d.card, "keep"); assert.ok(d.c1); assert.equal(d.key, null); assert.ok(d.rung?.text);
    const k = pickHelp({ script, part, request: "hint", said, misses: KEY_AFTER_MISSES, last: named, noC1: true });
    assert.equal(k.card, "close"); assert.ok(k.key);
  });
  test("another answer (not the named one) at the cap: C1 while a wording is unsaid, then the key, as built", () => {
    const d = pickHelp({ script, part, request: "hint", said: [], misses: KEY_AFTER_MISSES, last: { outcome: "incorrect", wrongListed: false } });
    assert.equal(d.card, "keep"); assert.ok(d.c1);
    assert.equal(pickHelp({ script, part, request: "hint", said: [], misses: KEY_AFTER_MISSES, last: { outcome: "incorrect", wrongListed: false }, noC1: true }).card, "close");
  });
  test("questionFiveTimes re-pinned: a fifth hearing passes only on the turn whose body is the named reason said for the first time at the card", () => {
    const card = "Jo hissa lamba nikla, woh doosre se kitne cm lamba hai?";
    const q = script.skills[0].checks[1].prompt.hi;
    const lead = [T(q, "c6-maths-ch07-t01-s1:e3:card", "right", ["card"]), C("7"), T(`Nahi. ${q}`, part, "wrong", ["missVerdict", "card"]), C("8"), T(`Nahi. ${q}`, part, "wrong", ["missVerdict", "card"]), C("9"), T(`Nahi. ${q}`, part, "wrong", ["missVerdict", "card"]), C("das")];
    const ok = [...lead, T(`Nahi, das theek nahi. ${whyAlt} ${q}`, part, "misconception", ["missVerdict", "help", "card"])];
    const was = PREDICATES.questionFiveTimes; void card;
    assert.ok(was);
    const n0 = flagsOf(ok, "questionFiveTimes", script);
    const bare = [...lead, T(`Nahi, das theek nahi. ${q}`, part, "misconception", ["missVerdict", "card"])];
    const n1 = flagsOf(bare, "questionFiveTimes", script);
    // (the same fifth hearing without the reason, or with the reason already said before, is flagged as before)
    const again = [...lead.slice(0, 2), T(`Nahi. ${whyAlt} ${q}`, part, "wrong", ["missVerdict", "help", "card"]), ...lead.slice(3), T(`Nahi, das theek nahi. ${whyAlt} ${q}`, part, "misconception", ["missVerdict", "help", "card"])];
    const n2 = flagsOf(again, "questionFiveTimes", script);
    assert.ok(n1.includes(8), `bare: ${n1}`);
    assert.ok(!n0.includes(8), `with the reason: ${n0}`);
    assert.ok(n2.includes(8), `reason said before: ${n2}`);
  });
  test("capBeforeOwnReason (gated) trips on a key at the named answer with its reason never said, not where it was said", () => {
    assert.ok(!PENDING.has("capBeforeOwnReason"));
    const key = "Yeh jawab sahi nahi hai. Is sawaal ka jawab 5 cm hai, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Yahan tak theek hai?";
    assert.deepEqual(flagsOf([C("10"), T(key, part, "misconception", ["missVerdict", "key", "checkin"])], "capBeforeOwnReason", script), [1]);
    assert.deepEqual(flagsOf([T(`Nahi. ${whyAlt}`, part, "misconception", ["missVerdict", "help"]), C("10"), T(key, part, "misconception", ["missVerdict", "key", "checkin"])], "capBeforeOwnReason", script), []);
    assert.deepEqual(flagsOf([C("7"), T(key, part, "wrong", ["missVerdict", "key", "checkin"])], "capBeforeOwnReason", script), []);
    // (RULING-C3 item 7: the reason said inside the key's own turn does not count — reason and key in one turn is flagged)
    assert.deepEqual(flagsOf([C("10"), T(`Nahi. ${whyAlt} ${key}`, part, "misconception", ["missVerdict", "help", "key", "checkin"])], "capBeforeOwnReason", script), [1]);
  });
});

// (main's fourth ruling on cause C, item 1: C4 is UNDONE — the own step's ladder is exactly as at a23e5c45d: the step's simpler, then the
// worked problem's simpler, then the key (C1's: the step's own key with its own reason). wr-c2: stuck c5-ch02-t02 46, the worked problem's
// wording about Sana and Rahul is about the very problem the step belongs to. ownStepWorkedHelp is a pending count for Learning)
describe("C4 undone (RULING-C4 item 1): help at an own step is the step's simpler, then the worked problem's simpler, then the key", () => {
  for (const TOPIC of ["c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01", "c6-maths-ch07-t01"]) {
    const script = scriptOf(TOPIC), sk = script.skills[0], part = `${sk.skillId}:worked:yourStep`;
    test(`${TOPIC}: a give-up gets yourStep.simpler, then workedExample.simpler, then the key`, () => {
      const ys = sk.workedExample.yourStep.simpler.hi, ws = sk.workedExample.simpler.hi;
      const d1 = pickHelp({ script, part, request: "give_up", said: [] });
      assert.equal(nk(d1.rung.text), nk(ys));
      const d2 = pickHelp({ script, part, request: "give_up", said: addSaid([], ys, 1) });
      assert.equal(nk(d2.rung?.text), nk(ws), JSON.stringify(d2.rung));
      const d3 = pickHelp({ script, part, request: "give_up", said: addSaid(addSaid([], ys, 1), ws, 2) });
      assert.equal(d3.card, "close", JSON.stringify(d3.rung));
      assert.ok(d3.key);
    });
  }
  test("ownStepWorkedHelp is PENDING (a count for Learning); it still reads the worked problem's simpler at the your-step, not the step's own", () => {
    const script = scriptOf("c5-maths-ch02-t01"), sk = script.skills[0], part = `${sk.skillId}:worked:yourStep`;
    assert.ok(PENDING.has("ownStepWorkedHelp"));
    assert.deepEqual(flagsOf([C("1/3 km"), T(`Nahi. ${sk.workedExample.simpler.hi} Ab tum batao.`, part, "wrong", ["missVerdict", "help", "yourTurn"])], "ownStepWorkedHelp", script), [1]);
    assert.deepEqual(flagsOf([C("1/3 km"), T(`Nahi. ${sk.workedExample.yourStep.simpler.hi} Ab tum batao.`, part, "wrong", ["missVerdict", "help", "yourTurn"])], "ownStepWorkedHelp", script), []);
  });
});

// (main's third ruling on cause C, item 1: C5 is UNDONE — at a follow-up card the help ladder is exactly as at a23e5c45d: the card's
// simpler, then the remediation's sayAlt and simpler on the remediation's board, then the key; thenHelpOtherBoard is a pending count)
describe("C5 undone (RULING-C3 item 1): at a follow-up card help is its simpler, then the remediation's sayAlt and simpler, then the key", () => {
  for (const TOPIC of ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c6-maths-ch06-t01"]) {
    const script = scriptOf(TOPIC), sk = script.skills[0];
    sk.remediation.forEach((rem, k) => {
      if (!rem.then) return;
      const part = `${sk.skillId}:rem:${k}:then`;
      test(`${TOPIC} rem ${k}: the then's simpler, the remediation's sayAlt and simpler, then the key`, () => {
        const want = [rem.then.simpler?.hi, rem.sayAlt?.hi, rem.simpler?.hi].filter(Boolean);
        assert.ok(want.length >= 2, "a follow-up card has its remediation's wordings to say");
        let said = [];
        for (const [n, w] of want.entries()) {
          const d = pickHelp({ script, part, request: "give_up", said });
          assert.equal(nk(d.rung?.text), nk(w), `rung ${n}: ${JSON.stringify(d?.rung)}`);
          said = addSaid(said, w, n + 1);
        }
        const dk = pickHelp({ script, part, request: "give_up", said });
        assert.equal(dk.card, "close", JSON.stringify(dk.rung));
      });
    });
  }
  test("thenHelpOtherBoard (PENDING: a count for Learning) trips on a remediation's sayAlt said at its follow-up card, not on the card's own simpler or the remediation's own turn", () => {
    const script = scriptOf("c4-maths-ch05-t01"), sk = script.skills[0], rem = sk.remediation[1], part = `${sk.skillId}:rem:1:then`;
    assert.ok(PENDING.has("thenHelpOtherBoard"));
    assert.deepEqual(flagsOf([C("Golu"), T(`Nahi. ${rem.sayAlt.hi}`, part, "wrong", ["missVerdict", "help", "card"])], "thenHelpOtherBoard", script), [1]);
    assert.deepEqual(flagsOf([C("Golu"), T(`Nahi. ${rem.then.simpler.hi}`, part, "wrong", ["missVerdict", "help", "card"])], "thenHelpOtherBoard", script), []);
    assert.deepEqual(flagsOf([C("Golu"), T(`Nahi. ${rem.sayAlt.hi}`, part, "misconception", ["missVerdict", "remediation", "card"])], "thenHelpOtherBoard", script), []);
  });
});

// Main's second ruling on cause C (RULING-C2), item 1 — step 0, the park after a short ask: a side-topic raised where the question has been
// heard once since it was posed and her last turn said no question gets the park, its joint and the question's reask (its second hearing);
// with two or more hearings the park ends on 049 B4's pointed invitation, as built. The four readings re-pinned by main, each both sides.
describe("RULING-C2 item 1: the park after a short ask ends on the question's reask; with two hearings, on the pointed invitation", async () => {
  const { reaskOf, SHORT_ASK_FORMS, endsOnAnswerFirst, questionObjectAt } = await import("../server/director/question-run.js");
  /** The lesson walked to its first card (every question before answered right), then `seq` played: haan and the side-topic read by the real
   *  code read first, the walk driver's stub where code cannot read the line. */
  async function walkCard(TOPIC, seq) {
    const free = holdReplyStub(); // (the stub held through tests/_reply-hold.mjs, counted across files: a walk's end never puts the real model back under another file's walk)
    const kit = kitFromFile(getTopic(TOPIC));
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d37-c2", lessonKey: "d37-c2", teacher: "director" };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: (await say("")).reply }];
    const realRead = (s, text) => { const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null; return classifyFast({ target: targetFor(s, kit, it), childText: text, lang: s.ctx?.lang, classLevel: 4, typed: true }).result ?? null; };
    const turn = async (text, cls) => {
      const s = r.state;
      r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
      const t = await say(text);
      r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
      return { text: norm(t.reply), lm: r.state.lastMove ?? {}, seams: (t.guard?.seams ?? []).map((x) => x.right) };
    };
    for (let i = 0; i < 300; i++) {
      const s = r.state;
      const isStep = !!(s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose);
      if (String(s.lastUi?.ask?.itemId ?? "").startsWith("script:") && !isStep) break;
      const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      await turn(it ? String(it.answer) : "haan", { outcome: it ? "correct" : "no_evidence" });
    }
    const LINES = { haan: ["haan", { outcome: "no_evidence" }], aside: ["kal maine cricket khela, sixer maara", { outcome: "no_evidence", request: { type: "uptake" } }] };
    const out = [];
    for (const k of seq) { const [text, stub] = LINES[k]; out.push(await turn(text, realRead(r.state, text) ?? stub)); }
    free();
    return out;
  }
  const P = ".skills[0].explain[0].ask";
  test("walk 11 (c4-maths-ch05-t01: haan, side-topic): the park ends on the card's reask; wait two is help ending on the question", async () => {
    const sc = scriptOf("c4-maths-ch05-t01");
    const t = await walkCard("c4-maths-ch05-t01", ["haan", "aside", "haan", "haan"]);
    assert.ok(SHORT_ASK_FORMS.some((f) => t[0].text.endsWith(f)), t[0].text);
    assert.ok(t[1].text.endsWith(reaskOf(sc, P)), t[1].text);
    assert.ok(!endsOnAnswerFirst(sc, t[1].text), t[1].text);
    assert.equal(t[2].lm.waitN, 2);
    assert.ok(t[2].seams.includes("help"), t[2].seams.join(">"));
    assert.ok(!t[2].text.endsWith(reaskOf(sc, P)), "wait two does not say the reask the park has just said");
  });
  test("walk 12 (c6-maths-ch07-t01: haan, haan, side-topic — the question heard twice since posed): the park ends on the pointed invitation", async () => {
    const sc = scriptOf("c6-maths-ch07-t01");
    const t = await walkCard("c6-maths-ch07-t01", ["haan", "haan", "aside"]);
    assert.ok(endsOnAnswerFirst(sc, t[2].text), t[2].text);
  });
  test("walk 10 (side-topic first): as built — the park ends on the question", async () => {
    const t = await walkCard("c4-maths-ch05-t01", ["aside"]);
    assert.ok(t[0].text.endsWith(reaskOf(scriptOf("c4-maths-ch05-t01"), P)), t[0].text);
  });

  // made rows on the live c4-maths-ch05-t01 script, its first card
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const { D34C_PREDICATES } = await import("../evals/hybrid-side-by-side/d34c-predicates.mjs");
  const sc = scriptOf("c4-maths-ch05-t01");
  const q = questionObjectAt(sc, P);
  const prompt = norm(q.prompt.hi), reask = norm(q.reask.hi);
  const part = "c4-maths-ch05-t01-s1:explain:1:ask";
  const R = (text, column, seams) => ({ who: "teacher", text, cell: { part, column }, seams: seams.map((right, n) => ({ left: n ? seams[n - 1] : "start", right, joint: null })) });
  const card = R(`Kitchen mein Maa ne garam roti banayi. ${prompt}`, "right", ["verdict", "card"]);
  const shortY = R(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]);
  const parkQ = R(`Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. ${reask}`, "aside", ["park", "card"]);
  const parkInv = R("Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.", "aside", ["park", "answerFirst"]);
  const help1 = R(`Roti ke saare tukde ungli se gino, phir sirf rang wale. ${prompt}`, "yes", ["help", "card"]);
  const help2 = R(`Board ki roti ko aise socho: jitne tukdon mein rang bhara hai, woh ginti upar likhte hain. ${reask}`, "yes", ["help", "card"]);
  const reaskY = R(reask, "yes", ["card"]);
  const flags = (rows, name) => lessonFlags({ rows, script: sc }).filter((f) => f.predicate === name).map((f) => f.row);
  const C = (text) => ({ who: "child", text });
  const nowRows = [card, C("haan"), shortY, C("sixer maara"), parkQ, C("haan"), help1, C("haan"), help2];
  test("answerFirstThird counts hearings: the park's re-ask at the second hearing passes; after two hearings it is flagged, as before", () => {
    assert.ok(D34C_PREDICATES.answerFirstThird({ rows: nowRows }, parkQ, 4, { script: sc }), "d34c's reading flagged it");
    assert.deepEqual(flags(nowRows, "answerFirstThird"), []);
    const twice = [card, C("haan"), reaskY, C("haan"), shortY, C("sixer maara"), parkQ];
    assert.deepEqual(flags(twice, "answerFirstThird"), [6]);
    assert.deepEqual(flags([card, C("haan"), reaskY, C("sixer maara"), parkQ], "answerFirstThird"), [4]);
  });
  test("questionThreeRunning treats the park's re-ask inside a wait as the wait's own re-ask; flagged as before without it", () => {
    assert.deepEqual(flags(nowRows, "questionThreeRunning"), []);
    const noPark = [card, C("haan"), reaskY, C("haan"), help1, C("haan"), R(`Board ki roti ko aise socho. ${prompt}`, "give_up", ["help", "card"])];
    assert.ok(flags(noPark, "questionThreeRunning").length > 0);
  });
  test("waitSecondNotReask allows help at wait two where the re-ask was heard in that wait's park; flagged where the park said no question", () => {
    assert.deepEqual(flags(nowRows, "waitSecondNotReask"), []);
    assert.deepEqual(flags([card, C("haan"), shortY, C("sixer maara"), parkInv, C("haan"), help1], "waitSecondNotReask"), [6]);
  });
  test("waitNoQuestion flags the old park (no question straight after a wait turn with no question) and reads 0 on the new", () => {
    assert.deepEqual(flags([card, C("haan"), shortY, C("sixer maara"), parkInv, C("haan"), reaskY], "waitNoQuestion"), [4]);
    assert.deepEqual(flags(nowRows, "waitNoQuestion"), []);
    // (a park with no question after a turn that said it is not flagged: walk 12)
    assert.deepEqual(flags([card, C("haan"), reaskY, C("sixer maara"), parkInv], "waitNoQuestion"), []);
  });
});

// Main's second ruling on cause C (RULING-C2), item 2 — C2 built: where a key's `why` names every number of its value, the key is the why
// alone, its own sentence; goOnAfterKey's key reader re-pinned by name (the record's key seam of a why-alone key IS a key given); keyValueTwice
// gated for every key but a teach-back's (teachbackKeyValueTwice pending).
describe("RULING-C2 item 2: C2, the key said as its why alone where the why names every number of the value", async () => {
  const { keyLine, whyNamesKey } = await import("../server/director/help.js");
  const { nodeOfPart } = await import("../evals/hybrid-side-by-side/d37c-predicates.mjs");
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const sc = scriptOf("c4-maths-ch05-t01");
  const c2 = nodeOfPart(sc, "c4-maths-ch05-t01-s1:check:c2").node;
  test("whyNamesKey and keyLine: the why alone where it names the value (11 in \"… toh 11 bache\"); key and why as built where it does not", () => {
    assert.equal(whyNamesKey("11", c2.why.hi), true);
    const k = keyLine(c2);
    assert.equal(k.text, `${c2.why.hi.charAt(0).toUpperCase()}${c2.why.hi.slice(1)}.`);
    assert.ok(!/Iska jawab hai/.test(k.text));
    assert.equal(whyNamesKey("7", "5 barabar tukde"), false);
    assert.equal(whyNamesKey("ek tihai", "teen barabar hisse"), false);
    assert.match(keyLine({ key: "7", why: { hi: "5 aur 2 milkar" } }).text, /^Iska jawab hai 7, kyunki 5 aur 2 milkar\.$/);
  });
  test("walked (c4-maths-ch05-t01, its second check card missed to the cap): the key is the why alone — the value said once", async () => {
    const w = await walkUntil("c4-maths-ch05-t01", (s) => String(s.lastUi?.ask?.itemId ?? "") === "script:c4-maths-ch05-t01-s1:c2");
    const turns = await w.play(["13", "9", "8", "7", "6"]);
    w.done();
    assert.ok(w.found);
    const k = turns.find((t) => t.seams.includes("key"));
    assert.ok(k, turns.map((t) => t.seams.join(">")).join(" | "));
    assert.ok(k.text.includes(c2.why.hi.charAt(0).toUpperCase() + c2.why.hi.slice(1)), k.text);
    assert.equal((k.text.match(/(?<![\d/])11(?![\d/])/g) ?? []).length, 1, k.text);
  });
  const part = "c4-maths-ch05-t01-s1:check:c2";
  const R = (text, column, seams, extra = {}) => ({ who: "teacher", text, cell: { part, column }, seams: seams.map((right, n) => ({ left: n ? seams[n - 1] : "start", right, joint: right === "afterKeyGoOn" ? "afterKeyGoOn" : null })), ...extra });
  const C = (text) => ({ who: "child", text });
  const bar = (shade) => ({ template: "fraction-parts@1", params: { parts: 12, shade, whole: "bar" } });
  const pp = (part, beat, b, from = 0) => [{ part, from, beat, boards: [b], own: b }];
  const ask = R("Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?", "right", ["verdict", "card"], { check: { itemId: `script:${part}`, gave: false }, pageParts: pp("card", "c2", bar(0)) });
  const whyKey = `Yeh jawab sahi nahi hai. ${c2.why.hi.charAt(0).toUpperCase()}${c2.why.hi.slice(1)}. Yahan tak theek hai?`;
  const goOn = R("Koi baat nahi, chalo aage badhte hain. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?", "aside", ["afterKeyGoOn", "aside", "card"], { pageParts: pp("card", "c3", { template: "wholes@1", params: { wholes: [{ parts: 4, equal: false, title: "Cake" }] } }, 60) });
  const flags = (rows, name) => lessonFlags({ rows, script: sc }).filter((f) => f.predicate === name).map((f) => f.row);
  test("goOnAfterKey: the go-on line after a why-alone key (its record's key seam, keyWhy) passes; after a turn with no key of any form it is flagged", () => {
    const keyed = [ask, C("9"), R(whyKey, "wrong", ["missVerdict", "key", "checkin"], { keyWhy: true, pageParts: pp("close", "c2", bar(1)) }), C("mujhe cricket pasand hai"), goOn];
    assert.deepEqual(flags(keyed, "goOnAfterKey"), []);
    const noKey = [ask, C("9"), R("Yeh jawab sahi nahi hai. Socho, 1/12 ka neeche wala number kya ginta hai. Ab kitne tukde bache?", "wrong", ["missVerdict", "help", "card"], { pageParts: pp("card", "c2", bar(0), 30) }), C("mujhe cricket pasand hai"), goOn];
    assert.deepEqual(flags(noKey, "goOnAfterKey"), [4]);
    // (the key seam without the record's keyWhy is no why-alone key: read as before)
    assert.deepEqual(flags([ask, C("9"), R(whyKey, "wrong", ["missVerdict", "key", "checkin"], { pageParts: pp("close", "c2", bar(1)) }), C("mujhe cricket pasand hai"), goOn], "goOnAfterKey"), [4]);
    // (ynNahi reads keyFact only: unchanged by a why-alone key)
    assert.deepEqual(flags(keyed, "ynNahi"), []);
  });
  // (RULING-C3 item 8: keyValueTwice is GATED, reading the value against the script's own why — c2/dry2 offtopic c4-ch06-t01 36 is C2's
  // why-alone key, and that script's own yourStep.why says its value twice: said as written, not flagged; the row is Learning's)
  // (main's fifth ruling on cause C, correction 2: teachbackKeyValueTwice is gated once it reads 0 — a teach-back's told answer follows C2)
  test("keyValueTwice (gated) reads every key but a teach-back's; teachbackKeyValueTwice (gated since correction 2) reads the teach-back's", async () => {
    const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    assert.ok(PREDICATES.keyValueTwice && !PENDING.has("keyValueTwice"));
    assert.ok(PREDICATES.teachbackKeyValueTwice && !PENDING.has("teachbackKeyValueTwice"));
    const twice = R(`Yeh jawab sahi nahi hai. Iska jawab hai 11, kyunki ${c2.why.hi}. Yahan tak theek hai?`, "wrong", ["missVerdict", "key", "checkin"]);
    assert.deepEqual(flags([ask, C("9"), twice], "keyValueTwice"), [2]);
    assert.deepEqual(flags([ask, C("9"), R(whyKey, "wrong", ["missVerdict", "key", "checkin"], { keyWhy: true, pageParts: pp("close", "c2", bar(1)) })], "keyValueTwice"), []);
    const tb = nodeOfPart(sc, "end:teachback").node;
    const tbRow = { who: "teacher", text: `${tb.key} hi sahi hai. Iska jawab hai ${tb.key}, kyunki ${tb.why.hi}. Ab tak samajh aaya?`, cell: { part: "end:teachback", column: "wrong" }, seams: [{ left: "start", right: "key", joint: null }] };
    assert.deepEqual(flags([C("5/9"), tbRow], "keyValueTwice"), []);
    assert.deepEqual(flags([C("5/9"), tbRow], "teachbackKeyValueTwice"), [1]);
  });
  test("keyValueTwice (RULING-C3 item 8): a why that says its value twice, said alone, is not flagged; that why after \"Iska jawab hai\" is", () => {
    const st = JSON.parse(readFileSync(new URL("../data/lesson-scripts-staged/c4-maths-ch06-t01.json", import.meta.url), "utf8"));
    const ys = st.skills[0].workedExample.yourStep, sp = `${st.skills[0].skillId}:worked:yourStep`;
    const why = ys.why.hi, Why = `${why.charAt(0).toUpperCase()}${why.slice(1)}`;
    assert.equal((why.match(/(?<![\d/])7(?![\d/])/g) ?? []).length, 2, "the script's own why says 7 twice");
    const row = (text) => ({ who: "teacher", text, cell: { part: sp, column: "wrong" }, seams: [{ left: "start", right: "missVerdict" }, { left: "missVerdict", right: "key" }, { left: "key", right: "checkin" }] });
    const fl = (r) => lessonFlags({ rows: [C("5"), r], script: st }).filter((f) => f.predicate === "keyValueTwice").map((f) => f.row);
    assert.deepEqual(fl(row(`Nahi, yeh jawab nahi hai. ${Why}. Yahan tak theek hai?`)), []);
    assert.deepEqual(fl(row(`Nahi, yeh jawab nahi hai. Iska jawab hai ${ys.key}, kyunki ${why}. Yahan tak theek hai?`)), [1]);
  });
});

// RULING-C2 item 5: LADDER_FIELDS lists the help fields the ladder uses; then_card and your_step are back as at a23e5c45d (RULING-C3
// item 1: C5 undone; RULING-C4 item 1: C4 undone).
describe("RULING-C2 item 5 / RULING-C3 item 1 / RULING-C4 item 1: LADDER_FIELDS names the then-card's and the your-step's ladders as built", async () => {
  const { LADDER_FIELDS, ladderSpec, helpPart } = await import("../server/director/help.js");
  test("then_card: its simpler, the remediation's sayAlt and simpler; your_step: its own simpler, then the worked problem's — the fields ladderSpec gives on three scripts", () => {
    assert.deepEqual(LADDER_FIELDS.then_card, ["simpler", "sayAlt", "simpler"]);
    assert.deepEqual(LADDER_FIELDS.your_step, ["simpler", "simpler"]);
    for (const t of ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c6-maths-ch06-t01"]) {
      const sc = scriptOf(t), S = sc.skills[0].skillId;
      for (const [id, kind] of [[`${S}:rem:0:then`, "then_card"], [`${S}:worked:yourStep`, "your_step"]]) {
        const p = helpPart(sc, id);
        assert.equal(p?.kind, kind, id);
        assert.deepEqual(ladderSpec(sc, p).map((r) => r.field), LADDER_FIELDS[kind], id);
      }
    }
  });
});

// RULING-C3 item 6 (pr4's made rows): questionThreeRunning reads the park's re-ask as the wait's own re-ask only inside a wait — her turn
// before the park has a wait cue (a try-first or a bare yes); outside a wait it reads as at 8144b10cb (the park is a turn of the run).
describe("RULING-C3 item 6: questionThreeRunning exempts the park's re-ask only inside a wait", async () => {
  const { SHORT_ASK_FORMS, questionObjectAt } = await import("../server/director/question-run.js");
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const sc = scriptOf("c4-maths-ch05-t01"), q = questionObjectAt(sc, ".skills[0].explain[0].ask");
  const prompt = norm(q.prompt.hi), reask = norm(q.reask.hi), part = "c4-maths-ch05-t01-s1:explain:1:ask";
  const R = (text, column, seams) => ({ who: "teacher", text, cell: { part, column }, seams: seams.map((right, k) => ({ left: k ? seams[k - 1] : "start", right, joint: null })) });
  const card = R(`Kitchen mein Maa ne garam roti banayi. ${prompt}`, "right", ["verdict", "card"]);
  const parkQ = R(`Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. ${reask}`, "aside", ["park", "card"]);
  const yt = norm(sc.joints.yourTurn[0].hi ?? sc.joints.yourTurn[0]);
  const missInv = R(`2/3 sahi nahi hai. Roti ke saare tukde gino. ${yt}`, "wrong", ["missVerdict", "help", "yourTurn"]);
  const missQ = R(`2/3 sahi nahi hai. Roti ke saare tukde gino. ${reask}`, "wrong", ["missVerdict", "help", "card"]);
  const helpY = R(`Roti ke saare tukde ungli se gino, phir sirf rang wale. ${prompt}`, "yes", ["help", "card"]);
  const shortY = R(SHORT_ASK_FORMS[0], "yes", ["reaskShort"]);
  const fl = (rows) => lessonFlags({ rows, script: sc }).filter((f) => f.predicate === "questionThreeRunning").map((f) => f.row);
  test("inside a wait (card, a bare haan's short ask, the park's re-ask, help, help): the park counts as the wait's re-ask — not flagged", () => {
    assert.deepEqual(fl([card, C("haan"), shortY, C("sixer"), parkQ, C("haan"), helpY, C("haan"), helpY]), []);
  });
  test("outside a wait (card, a miss ending on the invitation, the park's re-ask, the question twice more): flagged as at 8144b10cb", () => {
    assert.deepEqual(fl([card, C("2/3"), missInv, C("sixer"), parkQ, C("2/3"), missQ, C("2/3"), missQ]), [8]);
  });
});

// RULING-C3 item 9 (pr4's gap): ownKeyNoReason also reads the worked example's close said in place of an own step's key with no key seam
// and no key words (say.js's yes-or-no close opens on "Nahi," in place of "Iska jawab hai").
describe("RULING-C3 item 9: ownKeyNoReason reads a worked close said in place of an own step's key", () => {
  const sc = scriptOf("c6-maths-ch07-t01"), sk = sc.skills[0], we = sk.workedExample, ys = we.yourStep, part = `${sk.skillId}:worked:yourStep`;
  const row = (text, column, seams) => ({ who: "teacher", text, cell: { part, column }, seams: seams.map((right) => ({ right })) });
  test("flagged: the worked close with no key seam and the step's why unsaid; and the key words with the step's why unsaid (as before)", () => {
    assert.ok(!PENDING.has("ownKeyNoReason"));
    assert.deepEqual(flagsOf([C("1/6"), row(`Nahi, ${we.answer.hi}, kyunki ${we.why.hi}. Yahan tak theek hai?`, "misconception", ["missVerdict", "checkin"])], "ownKeyNoReason", sc), [1]);
    assert.deepEqual(flagsOf([C("1/6"), row(`Nahi. Iska jawab hai ${we.answer.hi}, kyunki ${we.why.hi}. Yahan tak theek hai?`, "misconception", ["missVerdict", "key", "checkin"])], "ownKeyNoReason", sc), [1]);
  });
  test("not flagged: the step's own key and why; a right answer's close; a help turn that says neither close", () => {
    assert.deepEqual(flagsOf([C("1/6"), row(`Nahi. Iska jawab hai ${ys.key}, kyunki ${ys.why.hi}. Yahan tak theek hai?`, "misconception", ["missVerdict", "key", "checkin"])], "ownKeyNoReason", sc), []);
    assert.deepEqual(flagsOf([C(String(ys.key)), row(`Haan, sahi. Toh poora jawab: ${we.answer.hi}, kyunki ${we.why.hi}.`, "right", ["verdict", "checkin"])], "ownKeyNoReason", sc), []);
    assert.deepEqual(flagsOf([C("1/6"), row(`Nahi. ${ys.simpler.hi} Ab tum batao.`, "wrong", ["missVerdict", "help", "yourTurn"])], "ownKeyNoReason", sc), []);
  });
});

// RULING-C4 item 3 (checked, nothing changed): steering c5-maths-ch02-t01 row 40, a right answer at the own step, reads "Sahi jawab. Toh poora
// jawab: …, kyunki …" in c3/dry3 where b3/dry5 read "Sahi jawab. <why>. Toh poora jawab: …". C1's give-up-over-worked-close branch is not
// it (switched off, the walk is word for word the same); C2's why-alone key at row 22 is (switched off, the lesson is b3/dry5's): row 22 no
// longer says ", kyunki ", so rightWhyLead's rotation (it skips a joint her last two turns used) picks other joints from row 26 on, and at
// row 40 "<frame>, kyunki <why>", which the one-close rule (v6.4 T1″) says as the bare verdict then "Toh poora jawab: …, kyunki …".
describe("RULING-C4 item 3: a right answer's reason joint follows rightWhyLead's rotation over her last two turns", async () => {
  const { rightWhyLead } = await import("../server/brain/say.js");
  const { seamStart, lessonKeyOf } = await import("../server/brain/seams.js");
  test("with no ', kyunki ' in her last two turns the 'kyunki' joint is said; with one there, the reason is its own sentence", () => {
    const ctx = { lessonKey: "d37-c4-item3" };
    const k0 = seamStart(lessonKeyOf({ ctx }), "whyOpener") % 3;
    const n = (3 - k0) % 3; // the rotation's turn for joint 0 ("<frame>, kyunki <why>")
    const at = (texts) => rightWhyLead("Sahi jawab", "4 barabar gaps mein har gap 1/4 kilometre ka hai", { ctx, whyJoint: { n, last: null }, recent: texts.map((text) => ({ who: "teacher", text })) });
    assert.equal(at(["Nahi, yeh jawab nahi hai. Yeh sadak 6 barabar gaps mein kati hai. Yahan tak theek hai?"]).text, "Sahi jawab, kyunki 4 barabar gaps mein har gap 1/4 kilometre ka hai");
    assert.equal(at(["Nahi, yeh jawab nahi hai. Is sawaal ka jawab 1/6 kilometre par hai, kyunki yeh sadak 6 barabar gaps mein kati hai. Yahan tak theek hai?"]).text, "Sahi jawab. 4 barabar gaps mein har gap 1/4 kilometre ka hai");
  });
});

// Main's fifth ruling on cause C, correction 1 (builder E's patch, applied by builder F with RULING-E2 item 2): after an own step's told
// answer the worked example's own `why`, said whole over the answer board, is the keyed own step's last rung before the "nothing easier" line;
// spentBeforeWorkedWhy (gated) reads that line said with it unsaid; ownKeyNoReason does not read it as a close in place of the key.
describe("RULING-C5 correction 1: the worked example's reason before \"nothing easier\" after an own step's told answer", async () => {
  const { ladderSpec, helpPart, sameReason } = await import("../server/director/help.js");
  const sc = scriptOf("c5-maths-ch02-t02"), sk = sc.skills[0], we = sk.workedExample, ys = we.yourStep, part = `${sk.skillId}:worked:yourStep`;
  const row = (text, column, seams) => ({ who: "teacher", text, cell: { part, column }, seams: seams.map((right) => ({ right })) });
  const told = row(`Nahi, yeh theek nahi hai. Is sawaal ka sahi jawab: ${ys.key}, kyunki ${ys.why.hi}. Yahan tak theek hai?`, "misconception", ["missVerdict", "key", "checkin"]);
  const workedHelp = row(`${we.why.hi}. Yahan tak saaf hai?`, "clarify", ["help", "checkin"]);
  const spent = row("Yahi sabse seedha tareeka hai jo mere paas hai, koi baat nahi. Theek hai, isko yahin rakhte hain; ab agli baat.", "clarify", ["helpSpent", "afterKeyGoOn"]);
  test("ladderSpec: the keyed own step ends on the worked why over the answer board; not where it is the step's own why (sameReason)", () => {
    const p = helpPart(sc, part);
    const keyed = ladderSpec(sc, p, { keyed: true });
    assert.equal(keyed.at(-1).field, "workedWhy");
    assert.equal(keyed.at(-1).board, p.answerBoard);
    assert.ok(!ladderSpec(sc, p).some((r) => r.field === "workedWhy"), "not before the key");
    const same = JSON.parse(JSON.stringify(sc)); same.skills[0].workedExample.why = { hi: ys.why.hi.split(",")[0], en: ys.why.en.split(",")[0] };
    assert.ok(sameReason(same.skills[0].workedExample.why, ys.why), "the step's why cut short");
    assert.ok(!ladderSpec(same, helpPart(same, part), { keyed: true }).some((r) => r.field === "workedWhy"), "the same sentence cut short: as built");
  });
  test("spentBeforeWorkedWhy: flagged with the worked why unsaid; not once it was said (dry stuck c5-ch02-t02 46, 48, 50)", () => {
    assert.ok(PREDICATES.spentBeforeWorkedWhy); assert.ok(!PENDING.has("spentBeforeWorkedWhy"));
    assert.deepEqual(flagsOf([C("Rahul"), told, C("yeh step samajh nahi aaya"), spent], "spentBeforeWorkedWhy", sc), [3]);
    assert.deepEqual(flagsOf([C("Rahul"), told, C("yeh step samajh nahi aaya"), workedHelp, C("phir bhi samajh nahi aaya"), spent], "spentBeforeWorkedWhy", sc), []);
    assert.deepEqual(flagsOf([C("Rahul"), C("pata nahi"), spent], "spentBeforeWorkedWhy", sc), [], "no key told at the step");
  });
  test("RULING-E2 item 2, ownKeyNoReason: the worked why as help after the step's key told with its own reason is not flagged; in place of the key it still is", () => {
    assert.deepEqual(flagsOf([C("Rahul"), told, C("yeh step samajh nahi aaya"), workedHelp], "ownKeyNoReason", sc), []);
    assert.deepEqual(flagsOf([C("Rahul"), workedHelp], "ownKeyNoReason", sc), [1], "no key told before it: a close in place of the key");
    const toldNoWhy = row(`Nahi. Is sawaal ka sahi jawab: ${ys.key}. Yahan tak theek hai?`, "misconception", ["missVerdict", "key", "checkin"]);
    assert.deepEqual(flagsOf([C("Rahul"), toldNoWhy, C("samajh nahi aaya"), workedHelp], "ownKeyNoReason", sc), [1, 3], "the key told without its own reason: the help after it is still read");
    const closeNoHelp = row(`Nahi, ${we.why.hi}. Yahan tak theek hai?`, "misconception", ["missVerdict", "checkin"]);
    assert.deepEqual(flagsOf([C("Rahul"), told, C("Rahul"), closeNoHelp], "ownKeyNoReason", sc), [3], "a close with no help seam after the key: still flagged");
  });
});

// Main's fifth ruling on cause C (RULING-C5), correction 2: C2 reaches an answer that is words, and the teach-back. judge-c-t02: stuck
// c5-ch02-t02 46 ("Is sawaal ka sahi jawab: Sana ka hissa, kyunki … isliye Sana ka hissa … bada hai"), steady c5-ch02-t02 116 ("Iska jawab hai
// 7/12, kyunki … isliye 7/12 chhota hai"), steady c6-ch06-t01 98.
describe("RULING-C5 correction 2: a key with no number whose why says its words, and a teach-back's key, are the why alone", async () => {
  const { keyLine, whyNamesKey } = await import("../server/director/help.js");
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const t02 = scriptOf("c5-maths-ch02-t02");
  const ys = t02.skills[0].workedExample.yourStep;
  test("whyNamesKey reads a word key by its words, in order: \"Sana\" and \"Sana ka hissa\" in the step's why; a yes-or-no key, or words the why does not say, as built", () => {
    assert.equal(whyNamesKey(ys.key, ys.why.hi), true);
    assert.equal(whyNamesKey("Sana ka hissa", ys.why.hi), true);
    assert.equal(whyNamesKey("Rahul ka hissa", ys.why.hi), false);
    assert.equal(whyNamesKey("nahi", "nahi, kyunki dono barabar nahi hain"), false);
    assert.equal(whyNamesKey("square", "iske chaaron kone barabar hain"), false);
    assert.equal(keyLine({ key: ys.key, why: ys.why }).text, `${ys.why.hi.charAt(0).toUpperCase()}${ys.why.hi.slice(1)}.`);
    assert.match(keyLine({ key: "square", why: { hi: "iske chaaron kone barabar hain" } }).text, /^Iska jawab hai square, kyunki /);
  });
  test("walked (c5-ch02-t02's own step given up to its key): the told answer is the step's why alone — \"Sana\" said as the why says it", async () => {
    const w = await walkUntil("c5-maths-ch02-t02", (s) => /-s1:ask:worked$/.test(String(s.lastUi?.ask?.itemId ?? "")));
    // (give-ups: code's real read takes a bare "Rahul" here for a mix-up and goes to its remediation — the dry child's read is a plain miss)
    const turns = await w.play(["give", "give", "give", "give"]);
    w.done();
    assert.ok(w.found);
    const k = turns.find((t) => t.seams.includes("key"));
    assert.ok(k, turns.map((t) => t.seams.join(">")).join(" | "));
    assert.ok(k.text.includes(`${ys.why.hi.charAt(0).toUpperCase()}${ys.why.hi.slice(1)}`), k.text);
    assert.ok(!/jawab/i.test(k.text), k.text);
    assert.equal((k.text.match(/(?<![\p{L}])Sana(?![\p{L}])/gu) ?? []).length, 2, k.text);
  });
  test("keyValueTwice reads a word key's words: \"Sana\" three times against its why's two is flagged; the why alone is not", () => {
    const part = "c5-maths-ch02-t02-s1:worked:yourStep";
    const R = (text) => ({ who: "teacher", text, cell: { part, column: "wrong" }, seams: [{ left: "start", right: "missVerdict", joint: null }, { left: "missVerdict", right: "key", joint: null }, { left: "key", right: "checkin", joint: null }] });
    const fl = (r) => lessonFlags({ rows: [{ who: "child", text: "Rahul" }, r], script: t02 }).filter((f) => f.predicate === "keyValueTwice").map((f) => f.row);
    assert.deepEqual(fl(R(`Nahi, yeh theek nahi hai. Is sawaal ka sahi jawab: Sana ka hissa, kyunki ${ys.why.hi}. Ab tak samajh aaya?`)), [1]);
    assert.deepEqual(fl(R(`Nahi, yeh theek nahi hai. ${ys.why.hi.charAt(0).toUpperCase()}${ys.why.hi.slice(1)}. Ab tak samajh aaya?`)), []);
  });
  for (const [topic, wrong] of [["c5-maths-ch02-t02", "12/7"], ["c6-maths-ch06-t01", "73 cm"]]) {
    test(`walked (${topic}'s teach-back missed to its key): the told answer is its why alone, read as the key; teachbackKeyValueTwice 0`, async () => {
      const tb = scriptOf(topic).teachback;
      const w = await walkUntil(topic, (s) => !!s.teachbackAsked);
      const turns = await w.play([wrong, wrong, wrong]);
      w.done();
      assert.ok(w.found);
      const k = turns.find((t) => t.lm?.authoredEnd === "teachbackKey" || t.seams.includes("key"));
      assert.ok(k, turns.map((t) => `${t.seams.join(">")} ${t.text.slice(0, 40)}`).join(" | "));
      const why = String(tb.why.hi).replace(/[.!?]+$/, "");
      assert.ok(k.text.includes(`${why.charAt(0).toUpperCase()}${why.slice(1)}.`), k.text);
      assert.ok(!/Iska jawab hai/.test(k.text), k.text);
      assert.ok(k.seams.includes("key"), k.seams.join(">"));
    });
  }
});

// RULING-E2 item 3: requestAnswered and requestHelped read a turn whose record carries the key seam of a why-alone key as a key given, as
// goOnAfterKey reads it (RULING-C2 item 2). Dry steady c4-ch01-t02 104: a give-up at the teach-back told its answer as the why alone.
describe("RULING-E2 item 3: a why-alone key's seam answers a request (requestAnswered, requestHelped)", async () => {
  const { lessonFlags } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
  const sc = JSON.parse(readFileSync(new URL("../data/lesson-scripts-staged/c4-maths-ch01-t02.json", import.meta.url), "utf8"));
  const tb = sc.teachback, part = "c4-maths-ch01-t02:teachback";
  const T = (text, column, seams, extra = {}) => ({ who: "teacher", text, move: "teachback", card: null, cell: { part, column }, seams: seams.map((right, k) => ({ left: k ? seams[k - 1] : "start", right, joint: null })), ...extra });
  const G = { who: "child", text: "pata nahi, shayad wahi", intent: "give_up" };
  const ask = T(tb.prompt.hi, "right", ["closingQuestion"], { pageParts: [{ part: "body", from: 0, beat: "teachback" }] });
  const told = (seams, extra) => T(`${tb.why.hi.replace(/[.]$/, "")}. Yeh hissa saaf hua?`, "give_up", seams, { pageParts: [{ part: "body", from: 0, beat: "teachback:answer" }], ...extra });
  const fl = (rows, name) => lessonFlags({ rows, script: sc }).filter((f) => f.predicate === name).map((f) => f.row);
  for (const name of ["requestAnswered", "requestHelped"]) {
    test(`${name}: the why-alone key with its key seam is a key given; the same words with no key seam, or no keyWhy, are not`, () => {
      assert.ok(!PENDING.has(name));
      assert.deepEqual(fl([ask, G, told(["key", "checkin"], { keyWhy: true })], name), []);
      assert.deepEqual(fl([ask, G, told(["key", "checkin"], {})], name), [2], "no keyWhy on the record");
      assert.deepEqual(fl([ask, G, told(["body", "checkin"], { keyWhy: true })], name), [2], "no key seam");
      const bare = T(`Koi baat nahi. ${tb.prompt.hi}`, "give_up", ["closingQuestion"], { pageParts: [{ part: "body", from: 15, beat: "teachback" }] });
      assert.deepEqual(fl([ask, G, bare], name), [2], "no help, no key, no nothing-easier line");
    });
  }
});
