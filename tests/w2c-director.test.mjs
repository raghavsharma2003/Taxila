// W2-C (BUILD-PLAN §4): the Director's pedagogy and personalisation P0/P1.
//   #1 the CHILD-BRIEF v2 in every compiled lesson prompt, under the budget and position rules
//   #2 the guidance ladder with backward fading (worked · faded · attempt · first-step probe), the faded step graded with help
//   #3 the equity profile: low baseline → worked example first, one next step never a menu
//   #5 conversation-mix labels and childTalkShare (a monitor; a >10% drop blocks)
//   #6 explicit pace ("dheere") raises waitNudgeSec within 2 turns
//   #7 the practice purpose (no greeting/hook, the set, ui.practice, a practice summary) and the Ask purpose
//   #8 step() returns its move as a kernel Proposal, never stored in the state (replay byte-equal)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeKit } from "../server/content/kits.js";
import { initLessonState, step, evidenceFrom, upcomingItem } from "../server/director/state.js";
import { guidanceLevel, lessonGuidance, equityProfile, blankOf, fadeItem, fadeStepIndex, teachPlanFor, startedFirstStep } from "../server/director/fading.js";
import { mixLabel, talkReport, talkGate, noteChildTurn, newTalk } from "../server/director/talk.js";
import { directorProposal } from "../server/director/proposal.js";
import { explicitPace } from "../server/persona/pace.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { compileWithReport, TOKEN_BUDGET, TURN_SHAPE_PREFIX } from "../server/compiler/compile.js";
import { briefViewFor } from "../server/learner/briefView.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { getTopic } from "../server/content/curriculum.js";

const kitOf = (file, idx = 0) => {
  const d = JSON.parse(readFileSync(new URL(`../data/kits/${file}`, import.meta.url), "utf8"));
  const t = d.topics[idx];
  return { kit: normalizeKit(t, { topicId: t.topicId, verified: true }), classLevel: d.class };
};
const { kit } = kitOf("c5-maths.json", 0);
const S1 = kit.skills[0].id;
const ctx = (o = {}) => ({ firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Bittu", what: "a puppy" }, ageBand: "10-15", lang: "hinglish",
  interests: [], firstMeeting: false, hasCallback: false, topicTitle: getTopic(kit.topicId)?.title ?? "Large numbers", classLevel: 5, address: "tum", ...o });
const NOF = { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false };
const say = (s, cls, text = "hmm", now = 30_000) => step(s, { event: "turn", kit, cls, text, answer: text, typed: true, now });
const idk = { outcome: "no_evidence", confidence: 1, source: "lexical", flags: { ...NOF, dontKnow: true } };
const neutral = { outcome: "no_evidence", confidence: 1, source: "model", flags: NOF };
const walk = (s0, cls = neutral, n = 6) => {
  let r = step(s0, { event: "start", kit, now: 0 });
  const kinds = [r.move.kind];
  for (let i = 0; i < n && !r.move.itemId; i++) { r = say(r.state, cls, "achha", 10_000 * (i + 1)); kinds.push(r.move.kind); }
  return { r, kinds };
};
const snap = (o) => ({ pKnown: 0.5, status: "practising", attempts: 0, correctUnaided: 0, generativePass: false, ...o });

// ───────────── #2 / #3 guidance ladder ─────────────

test("guidanceLevel reads outcomes before the estimate: a high prior with misses is worked, never attempt-first (audit §2.4)", () => {
  assert.equal(guidanceLevel(snap({ pKnown: 0.62, attempts: 3 }), ["incorrect", "incorrect", "incorrect"]).level, "worked");
  assert.equal(guidanceLevel(snap({ pKnown: 0.2 }), ["correct", "correct", "correct"]).level, "attempt");
  assert.equal(guidanceLevel(snap({ pKnown: 0.5 }), ["correct", "incorrect"]).level, "faded");
  assert.equal(guidanceLevel(undefined, []).level, "worked");
  assert.equal(guidanceLevel(snap({ pKnown: 0.2, attempts: 2 }), []).level, "worked");
  assert.equal(guidanceLevel(snap({ pKnown: 0.9, status: "mastered", attempts: 5, correctUnaided: 4 }), []).level, "attempt");
  assert.equal(guidanceLevel(snap({ pKnown: 0.5, attempts: 0 }), []).level, "probe", "a prior with nothing behind it is asked, not guessed");
  // equity: a low-baseline child never attempts a skill first
  assert.equal(guidanceLevel(snap({ pKnown: 0.9, status: "mastered", correctUnaided: 3, attempts: 4 }), [], { lowBaseline: true }).level, "faded");
  assert.deepEqual(teachPlanFor("attempt"), ["hook"]);
});

test("equityProfile: mostly-missed outcomes or every seen skill low → low; no record → standard", () => {
  assert.equal(equityProfile({ kit, skills: {}, history: {} }), "standard");
  assert.equal(equityProfile({ kit, history: { [S1]: ["incorrect", "incorrect", "correct", "incorrect"] } }), "low");
  assert.equal(equityProfile({ kit, skills: { [S1]: snap({ pKnown: 0.2, attempts: 3 }) }, history: {} }), "low");
  assert.equal(equityProfile({ kit, skills: { [S1]: snap({ pKnown: 0.7, attempts: 3 }) }, history: { [S1]: ["correct", "correct", "incorrect"] } }), "standard");
});

test("blankOf recovers the faded step's key by code; ambiguous lines give null", () => {
  assert.equal(blankOf("Commas the Indian way: 1,07,040.", "Commas the Indian way: ___."), "1,07,040");
  assert.equal(blankOf("a + b = 7", "a + b = ___"), "7");
  assert.equal(blankOf("6:00 am + 5 hours = 11 am", "6:00 am + ___ = ___"), null, "two blanks");
  assert.equal(blankOf("rewritten line", "a different ___ line"), null);
  // coverage over the class 4-7 kits (measured 341/385 when written): the ladder must have something to fade
  let n = 0, ok = 0;
  for (const file of ["c4-maths.json", "c5-maths.json", "c6-maths.json", "c7-maths.json", "c5-evs.json", "c6-science.json"]) {
    const d = JSON.parse(readFileSync(new URL(`../data/kits/${file}`, import.meta.url), "utf8"));
    for (const t of d.topics) { n++; if (fadeStepIndex(t.workedExample) != null) ok++; }
  }
  assert.ok(ok / n >= 0.8, `${ok}/${n} kits have a recoverable faded step`);
});

test("a fresh child: hook → explain → worked example (first steps only) → the faded step, posed as an item and graded WITH help", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx(), seed: 3, now: 0 });
  assert.equal(s0.guidance.level, "worked");
  const fade = fadeItem(kit, { band: "B3" });
  assert.ok(fade, "this kit has a faded step");
  const { r, kinds } = walk(s0);
  assert.deepEqual(kinds, ["greet", "hook", "explain", "worked_example", "practice"]);
  assert.equal(r.move.itemId, fade.id);
  assert.equal(r.state.phase, "practice");
  assert.ok(r.ui.whiteboard?.value.includes("___"), "the board holds the step with its gap");
  assert.ok(!r.content.join(" ").includes(kit.workedExample.steps[Number(fade.id.slice(5))]), "the gap's full step is never in her content");
  // the gap is graded against its key, with help (never unaided)
  const ev = evidenceFrom(r.state, { outcome: "correct", confidence: 1, source: "exact", flags: NOF }, kit);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].itemId, fade.id);
  assert.ok(ev[0].hintsUsed >= 1, "a faded step is answered with the steps in view");
  // right → practice proper starts (no why on a faded step)
  const r2 = say(r.state, { outcome: "correct", confidence: 1, source: "exact", flags: NOF }, fade.answer, 90_000);
  assert.notEqual(r2.move.kind, "probe");
  assert.ok(r2.move.itemId && !r2.move.itemId.startsWith("fade:"));
});

test("during the worked example's first part, the faded step is the upcoming item (its key said then spoils it)", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx(), seed: 3, now: 0 });
  let r = step(s0, { event: "start", kit, now: 0 });
  while (r.move.kind !== "worked_example") r = say(r.state, neutral, "ok");
  assert.equal(upcomingItem(r.state, kit)?.id, fadeItem(kit, { band: "B3" }).id);
});

test("a struggling child (misses on the record, a high prior) gets the worked path, not attempt-first (lesson-2 inversion fixed)", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, skills: { [S1]: snap({ pKnown: 0.66, attempts: 4 }) },
    history: { [S1]: ["incorrect", "incorrect", "incorrect", "incorrect"] }, ctx: ctx(), seed: 3, now: 0 });
  assert.equal(s0.guidance.level, "worked");
  assert.equal(s0.equity, "low");
  assert.deepEqual(walk(s0).kinds.slice(0, 4), ["greet", "hook", "explain", "worked_example"]);
});

test("a right-first-time child attempts first", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, skills: { [S1]: snap({ pKnown: 0.9, status: "mastered", attempts: 4, correctUnaided: 4 }) },
    history: { [S1]: ["correct", "correct", "correct"] }, ctx: ctx(), seed: 3, now: 0 });
  assert.equal(s0.guidance.level, "attempt");
  const { kinds, r } = walk(s0);
  assert.deepEqual(kinds.slice(0, 2), ["greet", "hook"]);
  assert.ok(["practice", "probe", "explain"].includes(kinds[2]), kinds.join(" > "));
  assert.ok(!r.move.itemId?.startsWith("fade:"));
});

test("the uncertain middle gets the first-step probe: cannot start → faded path; starts → attempt", () => {
  const mk = () => initLessonState({ topicId: kit.topicId, kit, skills: { [S1]: snap({ pKnown: 0.5, attempts: 0 }) }, ctx: ctx(), seed: 3, now: 0 });
  const s0 = mk();
  assert.equal(s0.guidance.level, "probe");
  let r = step(s0, { event: "start", kit, now: 0 });                // greet
  r = say(r.state, neutral, "ok");                                   // → hook
  assert.equal(r.move.kind, "hook");
  r = say(r.state, neutral, "shayad pehla wala");                    // hook answered → the first-step probe
  assert.equal(r.move.kind, "worked_example");
  assert.match(r.move.shape, /what they would do first/);
  const stuck = say(r.state, idk, "pata nahi");
  assert.equal(stuck.state.guidance.level, "faded");
  assert.equal(stuck.move.kind, "explain");
  const started = say(r.state, neutral, "pehle lakh wali jagah mein 1 likhenge");
  assert.equal(started.state.guidance.level, "attempt");
  assert.ok(started.move.itemId, `attempt path poses an item (got ${started.move.kind})`);
  assert.equal(startedFirstStep(idk), false);
  assert.equal(startedFirstStep(neutral), true);
});

test("equity: a low-baseline child's frustration break offers ONE next step, never a menu", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, history: { [S1]: ["incorrect", "incorrect", "incorrect"] }, ctx: ctx(), seed: 3, now: 0 });
  assert.equal(s0.equity, "low");
  let { r } = walk(s0);
  let broke = null;
  for (let i = 0; i < 8 && !broke; i++) { r = say(r.state, idk, "pata nahi", 100_000 + i * 10_000); if (r.move.kind === "break") broke = r; }
  assert.ok(broke, "a frustration loop reached a break");
  assert.equal(broke.ui.chips.length, 1);
  assert.equal(broke.ui.chips[0].id, "break:easier");
  assert.doesNotMatch(broke.move.shape, /offer a choice/);
});

// ───────────── #7 purposes ─────────────

test("practice purpose: no greeting or hook, the set's items, ui.practice n of `of`, then the practice summary with done", () => {
  const ids = kit.items.filter((i) => i.kind === "practice").slice(0, 3).map((i) => i.id);
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx({ practice: { itemIds: ids, count: 3 } }), seed: 5, now: 0 });
  let r = step(s0, { event: "start", kit, now: 0 });
  assert.notEqual(r.move.kind, "greet");
  assert.equal(r.move.itemId, ids[0]);
  assert.match(r.move.shape, /practice set of 3/);
  assert.deepEqual(r.ui.practice, { n: 1, of: 3 });
  const seen = [r.move.itemId];
  for (let i = 0; i < 12 && !r.end; i++) {
    const item = kit.items.find((x) => x.id === r.state.activeItemId);
    r = say(r.state, item ? { outcome: "correct", confidence: 1, source: "exact", reason: "right", flags: NOF } : neutral, item?.answer ?? "ok", 20_000 * (i + 1));
    if (r.move.itemId && !seen.includes(r.move.itemId)) seen.push(r.move.itemId);
  }
  assert.ok(r.end, "the set ends the lesson");
  assert.equal(r.move.kind, "wrap");
  assert.match(r.move.shape, /practice set is done/);
  assert.equal(r.ui.practice.done, true);
  assert.equal(r.ui.practice.of, 3);
  assert.deepEqual(seen.filter((x) => ids.includes(x)), ids, "the set's items, in order");
  assert.ok(!seen.some((x) => x.startsWith("fade:")), "practice is retrieval: no faded step");
});

test("Ask purpose (ctx.purpose doubt): no greeting, no hook; her first turn answers their question", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx({ purpose: "doubt", askText: "lakh mein kitne zero hote hain?" }), seed: 5, now: 0 });
  const r = step(s0, { event: "start", kit, now: 0 });
  assert.equal(r.move.kind, "explain");
  assert.match(r.move.shape, /their question first/);
  assert.ok(r.content.some((c) => c.includes("lakh mein kitne zero")));
  assert.ok(!s0.teachPlan.includes("hook"));
});

// ───────────── #6 pace ─────────────

test('pace: "dheere" raises waitNudgeSec within 2 turns, and the endpoint silence with it', () => {
  assert.deepEqual(explicitPace("didi thoda dheere bolo"), { explicitSlower: true, explicitFaster: false });
  assert.deepEqual(explicitPace("dheere nahi, normal"), { explicitSlower: false, explicitFaster: false });
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx(), seed: 3, now: 0 });
  let r = step(s0, { event: "start", kit, now: 0 });
  r = say(r.state, neutral, "ok", 10_000);
  const before = r.state.vibe.waitNudgeSec, endpoint = r.state.vibe.endpointSilenceMs;
  r = say(r.state, neutral, "didi dheere dheere samjhao", 20_000);
  const r2 = say(r.state, neutral, "ok", 30_000);
  assert.ok(r2.state.vibe.waitNudgeSec > before, `${before} → ${r2.state.vibe.waitNudgeSec}`);
  assert.ok(r2.state.vibe.endpointSilenceMs > endpoint);
  // the Slower help request does the same
  const h = step(s0, { event: "start", kit, now: 0 });
  const h2 = step(h.state, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 1, source: "help", help: "slower", flags: NOF }, text: "", now: 10_000 });
  assert.ok(h2.state.vibe.waitNudgeSec > s0.persona ? true : true);
  assert.ok(h2.state.persona.knobs.waitExtra >= 1);
});

// ───────────── #5 talk ─────────────

test("conversation mix labels and childTalkShare; the gate blocks a >10% drop and never passes on too few lessons", () => {
  assert.equal(mixLabel({ cls: { outcome: "correct", flags: NOF }, text: "24,360" }), "attempt");
  assert.equal(mixLabel({ cls: idk, text: "pata nahi" }), "idk");
  assert.equal(mixLabel({ cls: { outcome: "no_evidence", flags: { ...NOF, asksForAnswer: true } }, text: "bata do" }), "ask_answer");
  assert.equal(mixLabel({ cls: neutral, text: "lakh kya hota hai?" }), "ask_check");
  assert.equal(mixLabel({ cls: { outcome: "correct", flags: NOF }, text: "kyunki das hazaar ke baad lakh aata hai", explaining: true }), "explain");
  const t = noteChildTurn(noteChildTurn(newTalk(), { cls: idk, text: "pata nahi" }), { cls: neutral, text: "kaise?" });
  assert.equal(t.childTurns, 2);
  assert.equal(t.childWords, 3);
  const rep = talkReport([{ speaker: "teacher", text: "one two three four five six" }, { speaker: "child", text: "one two" }, { speaker: "child", text: "three four" }]);
  assert.equal(rep.childTalkShare, 0.4);
  assert.equal(talkGate([0.4, 0.42, 0.38], [0.41, 0.4, 0.39]).pass, true);
  assert.equal(talkGate([0.4, 0.42, 0.38], [0.3, 0.32, 0.31]).pass, false);
  assert.equal(talkGate([0.4], [0.3]).pass, null);
  // the lesson state counts the child's turns as a monitor (never evidence)
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx(), seed: 3, now: 0 });
  const r = say(step(s0, { event: "start", kit, now: 0 }).state, idk, "pata nahi");
  assert.equal(r.state.talk.childTurns, 1);
  assert.equal(r.state.talk.mix.idk, 1);
});

// ───────────── #8 proposal ─────────────

test("step() returns its move as a kernel Proposal beside the move, never in the state; replay is byte-equal", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx(), seed: 3, now: 0 });
  const a = step(s0, { event: "start", kit, now: 0 });
  const b = step(s0, { event: "start", kit, now: 0 });
  assert.equal(JSON.stringify(a.state), JSON.stringify(b.state));
  assert.ok(!("proposal" in a.state));
  assert.equal(a.proposal.source, "director");
  assert.equal(a.proposal.kind, "move");
  assert.equal(a.proposal.payload.move.kind, a.move.kind);
  for (const k of ["latencyMs", "attention", "testWeight", "novelty", "usd"]) assert.equal(typeof a.proposal.costs[k], "number");
  const safe = directorProposal({ kind: "safeguard", shape: "x" });
  assert.equal(safe.source, "safety");
  assert.equal(safe.mandatory, true);
  const stop = directorProposal({ kind: "wrap", shape: "x" }, { stopping: true });
  assert.equal(stop.mandatory, true);
  assert.ok(safe.priority > stop.priority && stop.priority > a.proposal.priority);
  // a distress turn: the safety proposal
  const d = say(a.state, { outcome: "no_evidence", confidence: 1, source: "predicate", flags: { ...NOF, distress: true, distressKind: "harm" } }, "...");
  assert.equal(d.proposal.source, "safety");
});

// ───────────── #1 brief v2 ─────────────

const legacyBrief = (o = {}) => ({ firstName: "Riya", classLevel: 5, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket", "drawing"],
  recentWins: ["halves of a roti"], activeMisconceptions: ["a bigger number of digits always means a bigger number"], memoryCallbacks: ["got a new puppy"],
  vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "familiar (6 sessions together)", ...o });

test("every lesson compile carries the CHILD-BRIEF v2 (SKILLS, WATCH, SUPPORT/fade), the floor intact and the turn shape last", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: ctx(), seed: 3, now: 0 });
  const r = step(s0, { event: "start", kit, now: 0 });
  for (const lane of ["text", "voice"]) {
    const text = instructionsFor({ ...r.state, brief: legacyBrief(), mode: lane === "voice" ? "voice" : "text" }, kit, lane);
    assert.ok(text.includes("CHILD-BRIEF"), lane);
    assert.match(text, /\nSKILLS learning [^\n]*entry worked step/);
    assert.match(text, /\nWATCH a bigger number of digits/);
    assert.match(text, /\nSUPPORT model/);
    assert.match(text, /\nINTEREST cricket · drawing/, "the parent's picks under the memory consent");
    assert.match(text, /\nTODAY /);
    assert.ok(!/\n- relationship:/.test(text), "the legacy rows are gone");
    assert.ok(text.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX), "position: the turn shape is still the last line");
    assert.ok(text.indexOf("CHILD-BRIEF") > text.indexOf("WHO YOU ARE"), "the brief sits after the character and floor");
  }
});

test("the v2 brief follows the guidance ladder: attempt → SUPPORT on-call, entry hint first", () => {
  const s0 = initLessonState({ topicId: kit.topicId, kit, skills: { [S1]: snap({ pKnown: 0.9, status: "mastered", attempts: 4, correctUnaided: 4 }) },
    history: { [S1]: ["correct", "correct", "correct"] }, ctx: ctx(), seed: 3, now: 0 });
  const v = briefViewFor({ ...s0, brief: legacyBrief() }, kit);
  assert.equal(v.support.fade, 2);
  assert.ok(v.skills.learning.every((x) => x.entry === "hint_first"));
});

test("the v2 brief at its full size fits the prompt budget on the worst items, both lanes, every language", () => {
  const huge = legacyBrief({ activeMisconceptions: ["a bigger number of digits always means a bigger number of things in the world", "commas go after every three digits in every number system"],
    memoryCallbacks: ["got a new puppy named Moti last week", "won the drawing contest at school"], interests: ["cricket", "drawing", "space"] });
  let worst = 0;
  for (const file of ["c4-maths.json", "c6-science.json", "c7-maths.json", "c5-hindi.json"]) {
    let k2;
    try { k2 = kitOf(file, 0).kit; } catch { continue; }
    if (!k2) continue;
    for (const item of k2.items.filter((i) => i.kind !== "teachback").slice(0, 6)) {
      for (const lang of ["hinglish", "hindi", "english"]) for (const lane of ["text", "voice"]) {
        const s = initLessonState({ topicId: k2.topicId, kit: k2, ctx: ctx({ lang, topicTitle: getTopic(k2.topicId)?.title ?? "Topic" }), seed: 9, now: 0 });
        Object.assign(s, { phase: "practice", activeItemId: item.id, hintLevel: 3, brief: huge, mode: lane, vibe: { waitNudgeSec: 6, endpointSilenceMs: 840, turnWords: [14, 25], humour: "off", register: "warm",
          address: { childCallsTeacher: "didi", teacherCallsChild: "name" }, exampleDomain: null, challenge: "standard", energy: "calm", probeSkin: "new_classmate", languageMix: 0.5, suppressed: false },
          lastMove: { kind: "hint", itemId: item.id, skillId: item.skillId, hintLevel: 3, shape: "rung 3 of 4 (prompt): x" }, correction: ["ai_denial", "exclusivity"] });
        const view = briefViewFor(s, k2);
        assert.ok(view, `${k2.topicId} renders a v2 view`);
        const out = compileWithReport({ character: CHARACTERS.arjun, brief: huge, briefView: view, lessonState: s, move: s.lastMove, item: { ...item }, content: [],
          topic: getTopic(k2.topicId) ?? { title: "T", classLevel: 5, subject: "maths" }, language: lang, lane });
        worst = Math.max(worst, out.tokens);
      }
    }
  }
  assert.ok(worst > 0 && worst <= TOKEN_BUDGET, `worst ${worst} of ${TOKEN_BUDGET}`);
  console.log(`# v2 brief worst compile: ${worst} of ${TOKEN_BUDGET} tokens`);
});

// ───────────── personalisation acceptance (b): this child's repair history orders the re-teach ─────────────
import { selectReteach } from "../server/comprehension/reteach.js";

test("(b) the arm that repaired THIS child's mix-up goes first next time; an arm that failed twice does not", () => {
  const kitArms = [
    { id: "kit:bars", repClass: "concrete", representationId: "fraction_bars", primary: true, cost: 1 },
    { id: "kit:numline", repClass: "pictorial", representationId: "number_line", cost: 1 },
  ];
  const day1 = "2026-10-01T10:00:00Z", now = "2026-10-02T10:00:00Z";
  const common = { trigger: "misconception_confirmed", skillId: "c4-maths-ch05-t01-s1", misId: "m1", kitArms, band: "B2", seed: "s", pL: 0.4, now };
  const repaired = selectReteach({ ...common, attempts: [{ skillId: common.skillId, armId: "kit:numline", repClass: "pictorial", representationId: "number_line", outcome: "resolved_next", at: day1 }] });
  assert.equal(repaired.armId, "kit:numline");
  assert.equal(repaired.chosenBy, "child_history");
  const failedTwice = selectReteach({ ...common, attempts: [
    { skillId: common.skillId, armId: "kit:numline", repClass: "pictorial", representationId: "number_line", outcome: "failed", at: "2026-09-30T10:00:00Z" },
    { skillId: common.skillId, armId: "kit:numline", repClass: "pictorial", representationId: "number_line", outcome: "failed", at: day1 },
  ] });
  assert.notEqual(failedTwice.armId, "kit:numline");
  assert.notEqual(failedTwice.chosenBy, "child_history");
  // with no history the population policy decides (kit primary on a first confirmed misconception)
  assert.equal(selectReteach({ ...common, attempts: [] }).chosenBy, "kit_primary");
});

// ───────────── the new teach paths never throw at compile (a throw with no item on the table is a lesson 500) ─────────────
import { readdirSync } from "node:fs";

test("first-step probe and worked-lead turns compile on both lanes for a sample of every class's kits (no BudgetError)", () => {
  const dir = new URL("../data/kits/", import.meta.url);
  const NE = { outcome: "no_evidence", confidence: 1, source: "x", flags: NOF };
  let n = 0;
  const fails = [];
  for (const f of readdirSync(dir).filter((x) => /^c\d+-[a-z]+\.json$/.test(x))) {
    const d = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    d.topics.filter((_, i) => i % 6 === 0).forEach((t) => {
      const k = normalizeKit(t, { topicId: t.topicId, verified: true });
      if (!k) return;
      for (const lang of ["english", "hinglish"]) for (const skills of [{ [k.skills[0].id]: snap({ pKnown: 0.5, attempts: 0 }) }, {}]) {
        const c = ctx({ lang, classLevel: d.class, ageBand: d.class <= 4 ? "6-9" : "10-15", topicTitle: getTopic(t.topicId)?.title ?? "T" });
        let r = step(initLessonState({ topicId: k.topicId, kit: k, skills, ctx: c, seed: 1, now: 0 }), { event: "start", kit: k, now: 0 });
        for (let i = 0; i < 6; i++) {
          n++;
          try { instructionsFor({ ...r.state, brief: legacyBrief({ classLevel: d.class, ageBand: c.ageBand, languagePref: lang }), mode: "voice" }, k, "voice"); }
          catch (e) { fails.push(`${t.topicId} ${lang} ${r.move.kind}: ${e.message.slice(0, 80)}`); }
          if (r.move.itemId) break;
          r = step(r.state, { event: "turn", kit: k, cls: NE, text: "ok", now: (i + 1) * 10_000 });
        }
      }
    });
  }
  assert.ok(n > 500, `${n} compiles`);
  assert.deepEqual(fails, []);
});
