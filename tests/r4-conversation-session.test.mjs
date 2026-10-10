// Round 4, stream 4A, phase 2: the session-first server path (server/director/session/*; TUTOR-MODEL §2). Pure: no network, no
// model, no database. The held-out sets (evals/conversation-session/heldout-intake.mjs, openings.mjs) are scored by their own
// scripts and are NEVER asserted here (tuning on them would void them); the DEV sets and the research probe are.
import { test } from "node:test";
import assert from "node:assert/strict";
import { intakeParse, INTAKE_KINDS, contentWords } from "../server/director/session/intake.js";
import { intakeCandidates, subjectInClass, ALIASES } from "../server/director/session/candidates.js";
import { confirmItem, gradeConfirm, rejectsMapping } from "../server/director/session/confirm.js";
import { decideSegment, PURPOSES } from "../server/director/session/decide.js";
import { newSession, openSegment, switchSegment, currentSegment, nextQueued, sessionTopics } from "../server/director/session/segments.js";
import { planPrior, priorNotes } from "../server/director/session/prior.js";
import { intakeStart, intakeStep } from "../server/director/session/beat.js";
import { INTAKE_SHAPES } from "../server/director/session/shapes.js";
import { sessionFirstMode, sessionSwitches, INTAKE_MAX_TURNS, INTAKE_MAX_MS, CONFIRM_MIN_P } from "../server/director/session/flags.js";
import { matchTopic } from "../server/lesson/purpose.js";
import { getTopic } from "../server/content/curriculum.js";
import { kitFromFile } from "../server/content/kits.js";
import { requestOf } from "../server/director/requests.js";
import { DEV } from "../evals/conversation-session/dev-intake.mjs";
import { DEV_OPENINGS } from "../evals/conversation-session/dev-openings.mjs";

const kitFor = (id) => { const t = getTopic(id); return t ? kitFromFile(t) : null; };
const inGold = (id, gold) => (id ? gold.some((g) => g && id.startsWith(g)) : gold.includes(null));

test("flags: session-first is OFF by default and every owner-decision switch is off by default", () => {
  const keep = { ...process.env };
  for (const k of Object.keys(process.env)) if (k === "TAXILA_SESSION_FIRST" || k.startsWith("TAXILA_SF_")) delete process.env[k];
  try {
    assert.equal(sessionFirstMode(), "off");
    assert.deepEqual(Object.values(sessionSwitches()), [false, false, false, false, false, false]);
    process.env.TAXILA_SESSION_FIRST = "shadow"; assert.equal(sessionFirstMode(), "shadow");
    process.env.TAXILA_SESSION_FIRST = "on"; assert.equal(sessionFirstMode(), "on");
    process.env.TAXILA_SF_EXPLORE = "1"; assert.equal(sessionSwitches().explore, true);
  } finally { for (const k of Object.keys(process.env)) if (!(k in keep)) delete process.env[k]; Object.assign(process.env, keep); }
  assert.equal(INTAKE_MAX_TURNS, 3); assert.equal(INTAKE_MAX_MS, 90_000); assert.equal(CONFIRM_MIN_P, 0.6);
});

test("intake kind: the closed set, every dev line read to its kind", () => {
  for (const r of DEV) assert.ok(INTAKE_KINDS.includes(intakeParse(r.text).kind));
  const wrong = DEV.filter((r) => intakeParse(r.text).kind !== r.kind).map((r) => `${r.id} ${r.text} → ${intakeParse(r.text).kind}`);
  assert.deepEqual(wrong, []);
});

test("intake: activity words never name a topic (copy, check, test, homework, ma'am …)", () => {
  assert.deepEqual(contentWords("ma'am ne copy check ki, homework mila, test tha, sir ne revision karaya"), []);
  for (const t of ["aaj kuch khaas nahi, ma'am ne copy check ki", "test ki copy mili aaj", "bas revision hua", "aaj maths mein kuch nahi hua, bas test tha"]) {
    const f = intakeParse(t);
    assert.equal(f.kind, "nothing", t);
    assert.equal(intakeCandidates(f, t, { classLevel: 5 }).top, null, t);
  }
});

test("intake beats today's router on the research probe (7/12) and the dev set", () => {
  const probe = DEV.filter((r) => r.id.startsWith("p"));
  assert.equal(probe.length, 12);
  const score = (rows, f) => rows.filter((r) => inGold(f(r), r.gold)).length;
  const old = score(probe, (r) => matchTopic(r.text, r.cls)?.topicId ?? null);
  const now = score(probe, (r) => { const c = intakeCandidates(intakeParse(r.text), r.text, { classLevel: r.cls }); return c.top && c.p >= CONFIRM_MIN_P ? c.top.topicId : null; });
  // the research probe measured 7/12; here p06 ("hindi mein kavita padhi", no poem named) also accepts no claim, so 8
  assert.equal(old, 8, "today's router on the probe under these labels");
  assert.ok(now >= 11, `session intake on the probe: ${now}/12`);
  const devOld = score(DEV, (r) => matchTopic(r.text, r.cls)?.topicId ?? null);
  const devNow = score(DEV, (r) => { const c = intakeCandidates(intakeParse(r.text), r.text, { classLevel: r.cls }); return c.top && c.p >= CONFIRM_MIN_P ? c.top.topicId : null; });
  assert.ok(devNow > devOld && devNow >= DEV.length - 2, `dev: ${devNow}/${DEV.length} vs today's ${devOld}`);
});

test("candidates: the child's own class first (a class-6 'angles' is class 6, never class 5); science in classes 3-5 is EVS", () => {
  const t = "angles padhaye, acute obtuse wale";
  assert.ok(intakeCandidates(intakeParse(t), t, { classLevel: 6 }).top.topicId.startsWith("c6-maths-ch02"));
  assert.equal(subjectInClass("science", 4), "evs");
  assert.equal(subjectInClass("evs", 7), "science");
  // a pointer pulls toward where the school is, never away from the words
  const f = intakeParse("aaj maths mein kuch naya padhaya");
  const c = intakeCandidates(f, "aaj maths mein kuch naya padhaya", { classLevel: 6, pointer: { maths: 7 } });
  assert.ok(c.p < CONFIRM_MIN_P && c.ask?.length === 2, "a subject with no topic words is a two-way ask at the pointer, never a silent pick");
  assert.ok(c.ask[0].topicId.startsWith("c6-maths-ch07"));
  for (const a of ALIASES) assert.ok(a.rx instanceof RegExp && (a.adds || a.ids?.every((p) => [...Array(20).keys()].some((i) => getTopic(`${p}-t${String(i + 1).padStart(2, "0")}`)))), String(a.rx));
});

test("confirm probe: a verified recall/practice item of the named skill, graded in code against its key", () => {
  const kit = kitFor("c6-maths-ch07-t03");
  const item = confirmItem(kit, { text: "equivalent fractions kiya" });
  assert.ok(item && ["retrieval", "practice", "translate_rep", "near_transfer", "predict"].includes(item.kind));
  assert.notEqual(item.verified?.agrees, false);
  assert.equal(gradeConfirm(item, String(item.answer)).outcome, "correct");
  assert.equal(gradeConfirm(item, "pata nahi").outcome, "no_evidence");
  assert.equal(gradeConfirm(item, "nahi, woh nahi tha").rejected, true);
  assert.ok(rejectsMapping("no"));
  assert.equal(rejectsMapping(String(item.answer)), false);
  // a harm word in the reply is never graded: the floor decides
  assert.equal(gradeConfirm(item, "mujhe jeena nahi hai").safety, true);
});

test("decision order: safety > child request > test tomorrow > homework > school today > due reviews > level path", () => {
  const prior = { classLevel: 6, dueReviews: ["c6-maths-ch05-t01"], levelPathTopic: "c6-maths-ch06-t01", pointer: { maths: 7 }, testWindow: null };
  const pick = { topicId: "c6-maths-ch07-t03", p: 0.9 };
  assert.equal(decideSegment({ safety: true, frame: { kind: "taught" }, pick, prior }).purpose, "safeguard");
  assert.equal(decideSegment({ frame: { kind: "want" }, pick: { topicId: "c6-science-ch04-t01" }, prior: { ...prior, testWindow: { subject: "maths", when: "tomorrow" } } }).purpose, "child_request");
  assert.equal(decideSegment({ frame: { kind: "taught" }, pick, prior: { ...prior, testWindow: { subject: "maths", when: "tomorrow" } } }).purpose, "test_revise");
  assert.equal(decideSegment({ frame: { kind: "homework" }, pick, prior }).purpose, "homework");
  assert.equal(decideSegment({ frame: { kind: "taught" }, pick, prior }).purpose, "school_continue");
  assert.equal(decideSegment({ frame: { kind: "not_understood" }, pick, prior }).purpose, "school_reteach");
  assert.equal(decideSegment({ frame: { kind: "test", when: "this_week", subject: "maths" }, pick: null, prior }).purpose, "test_revise");
  const r = decideSegment({ frame: { kind: "nothing" }, pick: null, prior });
  assert.deepEqual([r.purpose, r.topicId], ["review", "c6-maths-ch05-t01"]);
  const l = decideSegment({ frame: { kind: "unknown" }, pick: null, prior: { ...prior, dueReviews: [] } });
  assert.deepEqual([l.purpose, l.topicId], ["level_path", "c6-maths-ch06-t01"]);
  for (const d of [r, l]) assert.ok(PURPOSES.includes(d.purpose) && d.why.length);
});

test("school ahead → foundation first (school topic kept); school behind → transfer, never a repeat", () => {
  const topic = Object.values(["c6-maths-ch07-t03", "c7-maths-ch08-t01", "c6-maths-ch07-t05"]).map(getTopic).find((t) => t?.prerequisites?.length);
  assert.ok(topic, "a topic with prerequisites");
  const pick = { topicId: topic.id, p: 0.9 };
  const ahead = decideSegment({ frame: { kind: "taught" }, pick, confirm: { outcome: "incorrect" }, statusOf: (id) => (id === topic.prerequisites[0] ? "weak" : "unseen") });
  assert.equal(ahead.mode, "foundation_first");
  assert.equal(ahead.topicId, topic.id, "the school topic is never left out");
  const s = openSegment(newSession({ classLevel: 6 }), ahead);
  assert.equal(currentSegment(s).topicId, ahead.foundation);
  assert.equal(currentSegment(s).then.topicId, topic.id);
  const behind = decideSegment({ frame: { kind: "taught" }, pick, confirm: { outcome: "correct" }, statusOf: (id) => (id === topic.id ? "mastered" : "learned") });
  assert.equal(behind.mode, "transfer");
});

test("segments: one session, several segments, one pinned kit each; a switch opens a new segment in the same session", () => {
  let s = newSession({ id: "sess-1", classLevel: 6, now: 0 });
  s = openSegment(s, { purpose: "school_continue", topicId: "c6-maths-ch07-t03", mode: "teach" }, { kitHash: "h1", now: 1000 });
  s = switchSegment(s, { topicId: "c6-science-ch04-t01", kitHash: "h2", now: 2000 });
  assert.equal(s.id, "sess-1");
  assert.equal(s.segments.length, 2);
  assert.ok(s.segments[0].closedAt && !s.segments[1].closedAt);
  assert.deepEqual(s.segments.map((x) => x.kitHash), ["h1", "h2"]);
  assert.equal(switchSegment(s, { topicId: "c6-science-ch04-t01" }), s, "switching to the open topic is a no-op");
  assert.deepEqual(sessionTopics(s), ["c6-maths-ch07-t03", "c6-science-ch04-t01"]);
  assert.equal(nextQueued(s), null);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(s)));
});

test("the day plan is a PRIVATE prior: notes, never a menu or a line she could say", () => {
  const plan = { slots: [{ kind: "live_lesson", opener: "reanchor_light", successFirst: true, pace: { newSkillBudget: 0 }, why: [{ code: "test_window", ref: "maths" }], testChapters: [7] }] };
  const p = planPrior(plan, { learningDay: "2026-10-10", classLevel: 6, levelPathTopic: "c6-maths-ch06-t01", dueReviews: ["c6-maths-ch05-t01", "nope"], pointer: { maths: 7 }, testWindows: [{ subject: "maths", to: "2026-10-11", chapters: [7] }] });
  assert.equal(p.testWindow.when, "tomorrow");
  assert.equal(p.testTopic, "c6-maths-ch07-t01");
  assert.deepEqual(p.dueReviews, ["c6-maths-ch05-t01"]);
  const notes = priorNotes(p, { topicId: "c6-maths-ch07-t03", purpose: "test_revise" });
  assert.ok(notes.length >= 1 && notes.length <= 2);
  for (const n of notes) {
    assert.ok(/^private plan/.test(n), n);
    assert.doesNotMatch(n, /["“”]|\b(?:I|I'm|let's|you'll|hello|hi)\b/i, n);
    assert.ok(n.length <= 200);
  }
});

test("intake shapes are notes, never lines (the recited-prompt law)", () => {
  const all = Object.values(INTAKE_SHAPES).map((f) => f({ a: "Fractions", b: "Prime Time", purpose: "school_continue" }));
  for (const s of all) {
    assert.doesNotMatch(s, /["“”]/, s);
    assert.doesNotMatch(s, /\b(?:I|I'm|I'll|we'll|let's|hello|namaste)\b/i, s);
    assert.ok(!/[.!?]\s+[A-Z]/.test(s), `one note, not sentences: ${s}`);
  }
});

test("intake beat: at most 3 child turns and 90 s, the floor pre-empts at every stage, no stage build", () => {
  const prior = { classLevel: 6, dueReviews: [], levelPathTopic: "c6-maths-ch06-t01", pointer: {} };
  let r = intakeStart({ now: 0, classLevel: 6, ctx: { subjects: ["maths", "science"], pointer: { maths: 7 } } });
  assert.equal(r.move.stage, false);
  assert.ok(r.move.chips.some((c) => c.id === "intake:test"));
  // three shares in a row never hold the child past the limit
  let st = r.state;
  for (let i = 0; i < 3; i++) { r = intakeStep(st, { text: "aaj mera birthday hai", now: 10_000 * (i + 1), kitFor, prior }); st = r.state; if (r.done) break; }
  assert.equal(r.done, true);
  assert.ok(st.turns <= INTAKE_MAX_TURNS);
  // the 90 s limit closes it too
  const slow = intakeStep(intakeStart({ now: 0, classLevel: 6 }).state, { text: "hmm", now: INTAKE_MAX_MS + 1, kitFor, prior });
  assert.equal(slow.done, true);
  // a harm word at the confirm stage is a safeguard, never graded
  let c = intakeStep(intakeStart({ now: 0, classLevel: 6 }).state, { text: "aaj fractions padhaya, equivalent fractions", now: 1000, kitFor, prior });
  assert.equal(c.move.kind, "intake_confirm");
  c = intakeStep(c.state, { text: "sir ne mujhe bahut maara", now: 2000, kitFor, prior });
  assert.equal(c.decision.purpose, "safeguard");
});

test("dev openings: purpose and topic right, within each case's turn limit", () => {
  for (const o of DEV_OPENINGS) {
    let { state } = intakeStart({ now: 0, classLevel: o.cls, ctx: { subjects: o.ctx.subjects, pointer: o.ctx.pointer } });
    const prior = { ...planPrior(null, { classLevel: o.cls, levelPathTopic: o.ctx.levelPathTopic, dueReviews: o.ctx.dueReviews, pointer: o.ctx.pointer }), testWindow: o.ctx.testWindow };
    let r, turns = 0;
    for (const t of o.turns) {
      turns++;
      r = intakeStep(state, { text: t, now: turns * 10_000, kitFor, prior, statusOf: () => "unseen" });
      if (r.needsGrade) r = intakeStep(r.state, { graded: "no_evidence", now: turns * 10_000 + 1, kitFor, prior, statusOf: () => "unseen" });
      state = r.state;
      if (r.done) break;
    }
    assert.ok(r.done, o.id);
    assert.equal(r.decision.purpose, o.expect.purpose, o.id);
    if (o.expect.topicPrefix) assert.ok(r.decision.topicId?.startsWith(o.expect.topicPrefix), `${o.id}: ${r.decision.topicId}`);
    assert.ok(turns <= o.expect.maxTurns, `${o.id}: ${turns} turns`);
  }
});

test("go deeper / aur batao / tell me more is its own request family beside 'simpler', never a stop or 'another way'", () => {
  for (const p of ["aur batao", "tell me more about this", "go deeper", "detail mein samjhao", "isme aur kya hota hai", "और बताओ"]) assert.equal(requestOf(p)?.type, "deeper", p);
  for (const p of ["explain it differently", "aage chalo", "3 aur 4", "aur", "bas"]) assert.notEqual(requestOf(p)?.type, "deeper", p);
});

// ── the Director with a session start (state.js sessionIntake / reinitForSegment; compile's intake check) ──
import { initLessonState, step } from "../server/director/state.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { CTX, BRIEF, cls } from "./fixtures/kit.mjs";

function sessionLesson({ provisional = "c6-maths-ch06-t01", prior = {}, subjects = ["maths", "science"], pointer = { maths: 7 } } = {}) {
  const kit = kitFor(provisional);
  const ctx = { ...CTX, classLevel: 6, ageBand: "10-12", sessionId: "s-test", topicTitle: getTopic(provisional).title,
    session: { subjects, pointer, prior: { classLevel: 6, dueReviews: [], levelPathTopic: provisional, pointer, ...prior } } };
  const s0 = initLessonState({ topicId: provisional, kit, ctx, seed: 7, now: 0 });
  const r = step(s0, { event: "start", kit, now: 0 });
  return { kit, r: { ...r, state: { ...r.state, brief: { ...BRIEF, classLevel: 6, ageBand: "10-12" }, mode: "text", kitHash: kit.hash, kitVerified: kit.verified } } };
}
const NE = cls("no_evidence");

test("Director: a session start opens on the intake beat (no item, no stage, no hook) and compiles within budget", () => {
  const { kit, r } = sessionLesson();
  assert.equal(r.move.kind, "intake");
  assert.equal(r.move.intake, true);
  assert.equal(r.move.itemId, undefined);
  assert.deepEqual(r.moduleCommands, []);
  const text = instructionsFor(r.state, kit, "text");
  assert.match(text, /no lesson content and no quiz question of your own/);
  assert.doesNotMatch(text, /"[^"]*\?"/, "no sentence for her to recite");
});

test("Director: 'aaj fractions padhaya' → the confirm probe (a kit question of the mapped topic), then a segment on THAT topic in the same lesson", () => {
  const { r } = sessionLesson();
  let t = step(r.state, { event: "turn", kit: kitFor("c6-maths-ch06-t01"), cls: NE, text: "aaj fractions padhaya, ma'am ne equivalent fractions kiya", now: 10_000 });
  assert.equal(t.move.kind, "intake_confirm");
  assert.ok(t.move.ask, "the kit question rides on the move for the compile");
  assert.match(instructionsFor({ ...t.state, brief: r.state.brief, mode: "text" }, kitFor("c6-maths-ch06-t01"), "text"), /the only question this turn/);
  t = step(t.state, { event: "turn", kit: kitFor("c6-maths-ch06-t01"), cls: NE, text: "pata nahi", now: 20_000 });
  assert.equal(t.move.kind, "intake_agenda");
  assert.ok(t.state.topicId.startsWith("c6-maths-ch07"), t.state.topicId);
  assert.equal(t.state.session.segments.length, 1);
  assert.equal(t.state.kitHash, kitFor(t.state.topicId).hash, "the segment pins its own verified kit");
  assert.equal(t.state.ctx.sessionId, "s-test", "the same session");
  assert.ok(t.state.sessionNotes.length >= 1);
  const text = instructionsFor({ ...t.state, brief: r.state.brief, mode: "text" }, kitFor("c6-maths-ch06-t01"), "text");
  assert.match(text, /private plan/);
  // the next turn teaches on the new kit (the lesson's next move is the Director's own)
  const n = step(t.state, { event: "turn", kit: kitFor(t.state.topicId), cls: NE, text: "example pehle", now: 30_000 });
  assert.ok(!n.move.intake, n.move.kind);
  assert.ok(["greet", "hook", "explain", "worked_example", "retrieval", "practice", "first_step", "faded_step", "reteach"].includes(n.move.kind) || n.move.itemId, n.move.kind);
});

test("Director: a harm word during the intake goes to the safeguard (the floor), never the intake", () => {
  const { r } = sessionLesson();
  const distress = cls("no_evidence", { flags: { distress: true, distressKind: "abuse" } });
  const t = step(r.state, { event: "turn", kit: kitFor("c6-maths-ch06-t01"), cls: distress, text: "sir ne mujhe bahut maara", now: 10_000 });
  assert.equal(t.move.kind, "safeguard");
  assert.equal(t.state.intake.stage, "done");
});

test("Director: no session ctx → today's start, unchanged", () => {
  const kit = kitFor("c6-maths-ch07-t03");
  const s0 = initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 6 }, seed: 7, now: 0 });
  assert.equal(s0.intake, undefined);
  assert.equal(s0.session, undefined);
  assert.notEqual(step(s0, { event: "start", kit, now: 0 }).move.kind, "intake");
});
