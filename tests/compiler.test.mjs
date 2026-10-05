import { test } from "node:test";
import assert from "node:assert/strict";
import { compile, compileWithReport, BudgetError, TURN_WORDS, TURN_SHAPE_PREFIX, voiceSafe } from "../server/compiler/compile.js";
import { FLOOR_HEADING } from "../server/compiler/floor.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import * as SH from "../server/director/shapes.js";
import { initLessonState, step, branchesFor } from "../server/director/state.js";
import { instructionsFor, instructionsAfter } from "../server/compiler/instructions.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";
import { promptFor } from "../server/director/items.js";
import { toSpoken } from "../server/voice/spoken.js";
import { vibeRow, checkVibeRow } from "../server/persona/adapter.js";
import { INTERESTS } from "../server/persona/signals.js";

const K = kit();
const TOPIC = { title: "Fractions as equal shares", classLevel: 4, subject: "maths" };

/** Compile input for the lesson after `n` director turns of the given classification. */
function inputAfter(answers = [], brief = BRIEF) {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  for (const c of answers) r = step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000 });
  return { character: CHARACTERS.asha, brief, lessonState: r.state, move: r.move, item: r.item, next: r.next, content: r.content, topic: TOPIC, language: "hinglish" };
}
const toFirstItem = () => Array(5).fill(cls("no_evidence"));

test("the floor is in every compiled prompt: AI disclosure, Childline 1098, Tele-MANAS 14416", () => {
  for (const input of [inputAfter(), inputAfter(toFirstItem()), inputAfter([...toFirstItem(), cls("incorrect")])]) {
    const text = compile(input);
    assert.ok(text.includes(FLOOR_HEADING));
    assert.match(text, /Childline 1098/);
    assert.match(text, /Tele-MANAS 14416/);
    assert.match(text, /say plainly you are an AI/);
    assert.match(text, /never hand over final answers/);
  }
});

test("section order is character → floor → child → lesson → move → language → last", () => {
  const text = compile(inputAfter(toFirstItem()));
  const at = ["WHO YOU ARE", FLOOR_HEADING, "\nCHILD\n", "LESSON NOW", "YOUR MOVE THIS TURN", "LANGUAGE:", "ONE MORE CHECK", TURN_SHAPE_PREFIX].map((h) => text.indexOf(h));
  assert.ok(at.every((i) => i >= 0), JSON.stringify(at));
  for (let i = 1; i < at.length; i++) assert.ok(at[i] > at[i - 1], `heading ${i} out of order`);
});

test("the last line is the turn-shape rule, sized by age band", () => {
  const young = compile(inputAfter(toFirstItem()));
  assert.ok(young.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX));
  assert.match(young.split("\n").at(-1), new RegExp(`at most ${TURN_WORDS["6-9"]} words`));
  const older = compile({ ...inputAfter(toFirstItem()), brief: { ...BRIEF, ageBand: "10-15", classLevel: 7 } });
  assert.match(older.split("\n").at(-1), new RegExp(`at most ${TURN_WORDS["10-15"]} words`));
});

test("the item prompt is verbatim content; the key is marked unsaid until rung 4", () => {
  const input = inputAfter(toFirstItem());
  const text = compile(input);
  assert.ok(text.includes(input.item.prompt_hi), "item prompt is posed verbatim in the child's language");
  const check = text.split("\n").at(-2);
  assert.ok(check.startsWith("ONE MORE CHECK: the only question this turn"), "the posed question is pinned in the appended-last check");
  assert.ok(check.includes(input.item.prompt_hi));
  assert.match(check, /the key stays unsaid \(ladder rung 0 of 4\)/);
  const hinted = compile(inputAfter([...toFirstItem(), cls("incorrect")]));
  assert.match(hinted.split("\n").at(-2), /the same one again .* no new question; the key stays unsaid \(ladder rung 1 of 4\)/);
  const atFour = compile(inputAfter([...toFirstItem(), cls("incorrect"), cls("incorrect"), cls("incorrect"), cls("incorrect")]));
  assert.match(atFour, /rung 4 now: say the key plainly/);
});

test("lanes share every byte except the voice-only branch lines", () => {
  const input = inputAfter(toFirstItem());
  const voice = compile({ ...input, lane: "voice", branches: branchesFor(input.lessonState, K) });
  const text = compile({ ...input, lane: "text" });
  const check = voice.split("\n").at(-2);
  assert.ok(check.startsWith("ONE MORE CHECK: when they reply:"), check);
  assert.match(check, /it matches the key → /, "the branch for the active item is the voice lane's last check");
  assert.doesNotMatch(text, /when they reply/);
  // The voice lane adds its branch check and the next turn's content lines, says the helpline numbers as digit
  // words (voiceSafe) and POSES the question in spoken notation (toSpoken); every other byte is shared.
  const strip = (t) => t.split("\n").filter((l) => !l.startsWith("ONE MORE CHECK") && !l.startsWith("- for your next turn")).join("\n");
  const written = promptFor(input.item, input.language);
  const spoken = toSpoken(written, { mode: input.language, ageBand: input.brief.ageBand });
  assert.equal(strip(voice), voiceSafe(strip(text).split(`"${written}"`).join(`"${spoken}"`), input.language));
});

test("voice lane poses the item in spoken notation; the key line, the text lane and the guards keep the written form", () => {
  const input = inputAfter(toFirstItem());
  const numeric = { ...input.item, prompt_hi: "3/4 aur 1/2 mein kaun bada hai?", prompt_en: "Which is bigger, 3/4 or 1/2?", answer: "3/4" };
  const voice = compile({ ...input, item: numeric, lane: "voice", branches: null });
  const text = compile({ ...input, item: numeric, lane: "text" });
  assert.match(text, /"3\/4 aur 1\/2 mein kaun bada hai\?"/, "text lane: written");
  assert.doesNotMatch(voice, /"3\/4 aur 1\/2/, "voice lane: never the written fraction as the posed question");
  assert.ok(voice.includes(toSpoken("3/4 aur 1/2 mein kaun bada hai?", { mode: "hinglish", ageBand: input.brief.ageBand })));
  assert.match(voice, /key, for checking only: 3\/4/, "the key stays written (answer-leak guards compare against it)");
});

test("VIBE row: one closed-vocabulary line after LESSON NOW, before the move; TURN SHAPE stays last", () => {
  const input = inputAfter(toFirstItem());
  assert.ok(input.lessonState.vibe, "the Director computed a vibe directive");
  const row = vibeRow(input.lessonState.vibe);
  assert.deepEqual(checkVibeRow(row, INTERESTS), []);
  for (const lane of ["text", "voice"]) {
    const lines = compile({ ...input, lane }).split("\n");
    const at = lines.indexOf(row);
    assert.ok(at > lines.findIndex((l) => l === "LESSON NOW"), `${lane}: after LESSON NOW`);
    assert.ok(at < lines.findIndex((l) => l.startsWith("YOUR MOVE THIS TURN") || l.startsWith("YOUR LAST TURN")), `${lane}: before the move`);
    assert.ok(lines.at(-1).startsWith(TURN_SHAPE_PREFIX));
  }
});

test("voice lane: helplines are digit words in the mode, never numerals; the text lane keeps the numerals", () => {
  const sg = (language) => {
    const input = { ...inputAfter([cls("incorrect", { flags: { distress: true, distressKind: "abuse" } })]), language };
    return { voice: compile({ ...input, lane: "voice" }), text: compile({ ...input, lane: "text" }) };
  };
  for (const [language, childline, telemanas] of [["english", "one zero nine eight", "one four four one six"],
    ["hinglish", "one zero nine eight", "one four four one six"], ["hindi", "एक शून्य नौ आठ", "एक चार चार एक छह"]]) {
    const { voice, text } = sg(language);
    assert.doesNotMatch(voice, /1098|14416/, `${language}: no helpline numeral reaches the realtime model`);
    assert.ok(voice.includes(`Childline ${childline}`), `${language}: Childline digit by digit`);
    assert.ok(voice.includes(`Tele-MANAS ${telemanas}`), `${language}: Tele-MANAS digit by digit`);
    assert.match(text, /Childline 1098/);
    assert.match(text, /Tele-MANAS 14416/);
  }
});

/** A lesson state as the routes store it (brief, lane), after `answers`. */
function lessonAfter(answers, mode) {
  const { lessonState } = inputAfter(answers);
  return { ...lessonState, brief: BRIEF, mode };
}

test("voice instructions from a stored state carry the active item's branch, never the close fallback", () => {
  const voice = instructionsFor(lessonAfter(toFirstItem(), "voice"), K);
  assert.match(voice, /it matches the key →/);
  assert.doesNotMatch(voice, /nothing new; a short warm close/); // the close FALLBACK (the floor's goodbye line also says "short warm close")
  assert.ok(voice.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX));
  const text = instructionsFor(lessonAfter(toFirstItem(), "text"), K);
  assert.doesNotMatch(text, /when they reply/);
});

test("voice: a move the client reported as voiced is framed as already said; a new move clears it", () => {
  const s = { ...lessonAfter(toFirstItem(), "voice"), moveVoiced: true };
  assert.match(instructionsFor(s, K), /YOUR LAST TURN \(already said — do not repeat it\)/);
  const r = step(s, { event: "turn", kit: K, cls: cls("incorrect"), now: 200_000 });
  assert.equal(r.state.moveVoiced, false);
  assert.match(instructionsFor({ ...r.state }, K), /YOUR MOVE THIS TURN/);
});

test("an item whose pinned text cannot compile is skipped once, and the next question is compiled", () => {
  // walked past the guidance ladder's faded step (W2-C) to the first KIT item, whose text is doctored below
  let s = lessonAfter(toFirstItem(), "text");
  for (let i = 0; i < 8 && String(s.lastMove.itemId ?? "").startsWith("fade:"); i++) s = lessonAfter([...toFirstItem(), ...Array(i + 1).fill(cls("no_evidence"))], "text");
  const bad = s.lastMove.itemId;
  const huge = { ...K, items: K.items.map((i) => (i.id === bad ? { ...i, prompt_hi: "bahut lamba sawaal ".repeat(400) } : i)) };
  const out = instructionsAfter({ state: s, move: s.lastMove }, huge, 300_000);
  assert.equal(out.skipped, bad);
  assert.ok(out.r.state.skipped.includes(bad));
  assert.notEqual(out.r.move.itemId, bad);
  assert.ok(out.instructions.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX));
});

test("budget: optional rows are shed first, lowest priority first, the floor and turn shape never", () => {
  const input = inputAfter(toFirstItem());
  const full = compileWithReport(input);
  assert.deepEqual(full.dropped, []);
  const tight = compileWithReport(input, { budget: full.tokens - 25 });
  assert.ok(tight.dropped.length >= 1);
  assert.ok(tight.dropped[0].startsWith("brief:mem"), `callbacks shed first, got ${tight.dropped}`);
  assert.ok(tight.text.includes(FLOOR_HEADING));
  assert.ok(tight.text.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX));
});

test("budget: throws instead of truncating when required text cannot fit", () => {
  const input = inputAfter(toFirstItem());
  assert.throws(() => compile(input, { budget: 600 }), BudgetError);
  assert.throws(() => compile(input, { caps: { floor: 50 } }), BudgetError, "a floor over its cap throws");
  assert.throws(() => compile(input, { caps: { last: 20 } }), BudgetError, "a turn shape over its cap throws");
  const huge = { ...input, item: { ...input.item, prompt_hi: "bahut lamba sawaal ".repeat(400) } };
  assert.throws(() => compile(huge), BudgetError, "an item prompt that cannot fit is an error, not a slice");
});

test("brief rows with ability labels or internal ids are dropped, never rewritten", () => {
  const text = compile(inputAfter(toFirstItem(), { ...BRIEF, recentWins: ["very smart at fractions", "c4-maths-ch05-t01-s1", "halves of a roti"] }));
  assert.doesNotMatch(text, /smart at fractions/);
  assert.doesNotMatch(text, /c4-maths-ch05-t01-s1/);
  assert.match(text, /halves of a roti/);
});

// Inherited law: anything sentence-shaped gets recited. Persona notes and move shapes are notes, so no
// line may read as a quotable sentence (capitalised start, terminal punctuation) or start in first person.
const SENTENCE = /^[A-Z][^.?!]*[.?!]$/;
const FIRST_PERSON = /^(i|i'm|i am|main|mai|mujhe|hum)\b/i;
test("persona notes and move shapes are shapes, not lines she could say", () => {
  for (const c of Object.values(CHARACTERS)) {
    for (const n of c.notes) {
      assert.doesNotMatch(n, SENTENCE, `${c.id} note reads as a sentence: ${n}`);
      assert.doesNotMatch(n, FIRST_PERSON, `${c.id} note in first person: ${n}`);
    }
  }
  const item = K.items[0];
  const shapes = [
    SH.greet({ ...CTX, warmup: true }), SH.greet({ ...CTX, warmup: false }), SH.retrievalNext(), SH.warmupMoveOn(),
    SH.hook({ interest: "cricket", contexts: K.interestContexts, protege: CTX.protege }), SH.explain({ skillTitle: "x" }),
    SH.worked({ part: 1, parts: 2 }), SH.pose({ item }), SH.why({ ageBand: "6-9", contrast: true }), SH.why({ ageBand: "6-9" }), SH.why({ ageBand: "10-15" }),
    SH.hint({ level: 2, rungShape: item.hints[1] }), SH.reteach({ representation: "r", moveShape: "m", again: true }),
    SH.changeApproach(), SH.repairUnclear(), SH.repairOffTopic(), SH.takeBreak(), SH.stretch(), SH.safeguard(),
    SH.safeguardStay(), SH.resumeAfterSafeguard(), SH.teachback({ protege: CTX.protege }),
    SH.teachbackFollowup({ protege: CTX.protege, missing: "m" }), SH.wrap({ nextTitle: "n" }), SH.wrap({ stopping: true }),
    ...Object.values(SH.CONFIRM),
  ];
  for (const s of shapes) {
    assert.doesNotMatch(s, SENTENCE, `shape reads as a sentence: ${s}`);
    assert.doesNotMatch(s, FIRST_PERSON, `shape in first person: ${s}`);
  }
});

test("safeguard and wrap turns get their own last rules; the floor still precedes them", () => {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence", { flags: { distress: true } }), now: 1000 });
  const text = compile({ character: CHARACTERS.asha, brief: BRIEF, lessonState: r.state, move: r.move, item: r.item, next: r.next, content: r.content, topic: TOPIC, language: "hinglish" });
  assert.match(text, /ONE MORE CHECK: care first/);
  assert.match(text.split("\n").at(-1), /at most 35 words/);
  assert.ok(text.indexOf(FLOOR_HEADING) < text.indexOf("ONE MORE CHECK"));
});
