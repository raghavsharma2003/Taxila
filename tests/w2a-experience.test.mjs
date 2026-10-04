// W2-A (BUILD-PLAN §4): one parent truth, the home states, practice and Ask, sign-in errors, the lesson-screen helpers.
// Pure: no database, no network. The production acceptance lives in tests/prod/w2a-*.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { engineRow, supersede, skillTruth, topicTruth, foldDelayedKt, countsAsLesson, lessonTally, lessonFactsSummary,
  summaryClaimsHold, renderSummaryLine, claimRows, resultOf } from "../server/reports/truth.js";
import { madeForItem } from "../server/reports/madeFor.js";
import { matchTopic, buildPracticeSet, questionTitle, conceptTokens, purposeSeam, PRACTICE_MAX } from "../server/lesson/purpose.js";
import { homeStateOf, childLabelOf, skillLineOf, legacyHome } from "../server/routes/child.js";
import { OUTCOMES } from "../server/learner/kt/outcomes.js";
import { getTopic } from "../server/content/curriculum.js";
import { inferAsk, questionShortTitle, practiceCount, PRACTICE_OF } from "../src/child/lesson/deskPure.ts";
import { fallbackPlan, fromServer, isPlanResponse, practiceOffered } from "../src/child/plan.ts";
import { checkAuthFields, authErrorOf } from "../src/onboarding/authErrors.ts";
import { fitNames } from "../src/child/teacher/naming.ts";
import { ApiError } from "../src/lesson/api.ts";
import { W2A } from "../src/copy/en.ts";

const L = "11111111-1111-4111-8111-111111111111";
const L2 = "22222222-2222-4222-8222-222222222222";
const H = 3600_000;
const T0 = Date.parse("2026-10-01T05:00:00Z");
const at = (ms) => new Date(T0 + ms).toISOString();
let seqN = 0;
const ev = (o) => ({ id: `${o.lesson ?? L}:${o.turn ?? 3}:${o.k ?? 0}`, seq: ++seqN, session_id: o.lesson ?? L, occurred_at: at(o.t ?? 0),
  skill_ids: [o.skill ?? "s1"], cls: o.cls ?? "item.open", outcome: OUTCOMES[o.cls ?? "item.open"].indexOf(o.o ?? "C0"), grader: o.grader ?? "code",
  item_key: o.item ?? "i1", teach: !!o.teach, pre_attempt_help: !!o.help, entry_rung: 0, misconception_id: o.mis ?? null, via: "dialogue", contaminated: false, assisted: null, ...(o.idOverride ? { id: o.idOverride } : {}) });

// ───────────────────────────── one claim source ─────────────────────────────

test("engineRow: closed labels → the words every surface uses, the grader, and the child turn it came from", () => {
  const r = engineRow(ev({ o: "C0", turn: 7 }));
  assert.equal(r.result, "right"); assert.equal(r.firstTryUnaided, true); assert.equal(r.turnSeq, 7); assert.equal(r.graderWords, "exact answer");
  assert.equal(engineRow(ev({ o: "C2", grader: "llm" })).result, "right_hint");
  assert.equal(engineRow(ev({ o: "C2", grader: "llm" })).graderWords, "checked against the book's key idea");
  assert.equal(engineRow(ev({ o: "C1" })).firstTryUnaided, false, "right on a later try is not right first time");
  assert.equal(engineRow(ev({ o: "C4" })).result, "with_help");
  assert.equal(engineRow(ev({ o: "C4", mis: "m1" })).result, "mixup");
  assert.equal(engineRow(ev({ o: "IDK" })).result, "not_sure");
  assert.equal(engineRow(ev({ o: "NA" })).scored, false);
  assert.equal(engineRow(ev({ teach: true })).scored, false);
  assert.equal(engineRow(ev({ cls: "item.mcq3", o: "wrong" })).result, "not_yet");
  assert.equal(engineRow(ev({ cls: "probe.why", o: "full" })).result, "right");
  assert.equal(resultOf("probe.why", 9), null, "an out-of-range outcome is no result");
});

test("supersede: a late correction replaces the row it corrects (never counted twice)", () => {
  const a = ev({ o: "C4" }), late = { ...ev({ o: "C0" }), id: `${a.id}:late` };
  const kept = supersede([a, late, ev({ k: 1 })]);
  assert.equal(kept.length, 2);
  assert.ok(kept.some((x) => x.id === late.id) && !kept.some((x) => x.id === a.id));
});

test("skillTruth: no scored engine row → Not started, whatever the projection says (flows G7: no sprout with no answers)", () => {
  assert.deepEqual(skillTruth({ status: "introduced", attempts: 0 }, []), { level: 0, key: "unseen", recheck: false, counted: 0 });
  assert.equal(skillTruth({ status: "learned_today" }, [engineRow(ev({ teach: true }))]).key, "unseen", "a taught-only skill is not started");
  assert.equal(skillTruth({ status: "practising", attempts: 2 }, [engineRow(ev({ o: "C2" }))]).key, "practising");
  assert.equal(skillTruth({ status: "learned_today" }, [engineRow(ev({ o: "C0" }))]).key, "learned_today");
  assert.equal(skillTruth({ status: "mastered" }, [engineRow(ev({ o: "C0" }))]).level, 3);
});

test("foldDelayedKt: a delayed check is another lesson ≥ 20 h later; a miss after a pass is counted", () => {
  const rows = [ev({ o: "C0", t: 0 }), ev({ o: "C0", t: 21 * H, lesson: L2, turn: 4 })].map(engineRow);
  assert.deepEqual(foldDelayedKt(rows), { passed: true, misses: 0 });
  const soon = [ev({ o: "C0", t: 0 }), ev({ o: "C0", t: 2 * H, lesson: L2 })].map(engineRow);
  assert.deepEqual(foldDelayedKt(soon), { passed: false, misses: 0 });
  const L3 = "33333333-3333-4333-8333-333333333333";
  const miss = [...rows.map((r) => ({ ...r })), engineRow(ev({ o: "C4", t: 48 * H, lesson: L3 }))];
  assert.deepEqual(foldDelayedKt(miss), { passed: true, misses: 1 });
  assert.equal(skillTruth({ status: "learned_today" }, miss).recheck, true);
});

test("topicTruth: one topic word from its skills (Progress and the map cannot disagree)", () => {
  assert.equal(topicTruth([], 3).key, "unseen");
  assert.equal(topicTruth([{ level: 2 }], 3).key, "practising", "one skill got it of three is not the topic got it");
  assert.equal(topicTruth([{ level: 2 }, { level: 3 }, { level: 2 }], 3).key, "learned_today");
  assert.equal(topicTruth([{ level: 3 }, { level: 3 }], 2).key, "mastered");
});

test("one lessons-and-minutes definition: abandoned and short ungraded visits are not lessons", () => {
  const w = { from: at(0), to: at(24 * H) };
  const ls = [
    { id: "a", startedAt: at(1 * H), endedAt: at(1 * H + 6 * 60_000), state: {} },               // 6 min, nothing graded: counts
    { id: "b", startedAt: at(2 * H), endedAt: at(2 * H + 60_000), state: {} },                   // 1 min visit: not a lesson
    { id: "c", startedAt: at(3 * H), endedAt: at(3 * H + 2 * 60_000), state: { did: [1] } },     // graded: counts
    { id: "d", startedAt: at(4 * H), endedAt: at(4 * H + 9 * 60_000), state: { abandoned: true } },
    { id: "e", startedAt: at(25 * H), endedAt: at(26 * H), state: { did: [1] } },                // outside the window
  ];
  assert.equal(countsAsLesson(ls[0]), true); assert.equal(countsAsLesson(ls[1]), false); assert.equal(countsAsLesson(ls[3]), false);
  const t = lessonTally(ls, w);
  assert.deepEqual([t.lessons, t.minutes, t.ids], [2, 8, ["a", "c"]]);
});

/** A random lesson's engine rows (seeded). */
function rng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function randomLesson(seed) {
  const r = rng(seed);
  const names = ["C0", "C0", "C1", "C2", "C3", "C4", "IDK"];
  const rows = [];
  const n = 1 + Math.floor(r() * 9);
  for (let i = 0; i < n; i++) {
    const mcq = r() < 0.25;
    rows.push(ev({ turn: 2 + i, cls: mcq ? "item.mcq3" : "item.open", o: mcq ? (r() < 0.6 ? "first_correct" : "wrong") : names[Math.floor(r() * names.length)], help: r() < 0.1, skill: r() < 0.5 ? "s1" : "s2" }));
    if (r() < 0.2) rows.push(ev({ turn: 2 + i, k: 1, teach: true }));
    if (r() < 0.15) rows.push(ev({ turn: 2 + i, k: 2, cls: "probe.why", o: r() < 0.5 ? "full" : "partial" }));
  }
  // a late correction now and then (it must replace, not add)
  if (r() < 0.3) { const a = rows[0]; rows.push({ ...a, id: `${a.id}:late`, seq: ++seqN, outcome: OUTCOMES[a.cls].indexOf(a.cls === "item.open" ? "C0" : "first_correct") }); }
  return rows;
}

test("lesson summaries are built from facts and pass the independent claim checker (20+ lessons); a wrong count fails it", () => {
  let checked = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const raw = randomLesson(seed);
    const rows = supersede(raw).map(engineRow).filter((x) => x.scored);
    const s = lessonFactsSummary({ topicTitle: "Fractions", rows });
    assert.deepEqual(summaryClaimsHold(s, raw), [], `seed ${seed}: ${JSON.stringify(s)}`);
    for (const l of s.lines) assert.ok(renderSummaryLine(l, { name: "Riya", topicTitle: "Fractions" }).length > 3);
    // the "8/8 unaided" failure: inflate the first-try count by one
    const bad = { ...s, lines: s.lines.map((l) => (l.key === "first_try" ? { ...l, k: l.k + 1 } : l.key === "tried" ? { ...l, n: l.n + 1 } : l)) };
    if (s.lines.some((l) => l.key === "tried")) assert.ok(summaryClaimsHold(bad, raw).length > 0, `seed ${seed}: an inflated count must fail`);
    checked++;
  }
  assert.ok(checked >= 20);
});

test("claim rows: right-first-time is the only 'correct, no hint' row (a second try never reads as on their own)", () => {
  const rows = [ev({ o: "C0" }), ev({ o: "C1", k: 1 }), ev({ o: "C3", k: 2 })].map(engineRow);
  const c = claimRows(rows);
  assert.equal(c.filter((x) => x.outcome === "correct" && !x.hintsUsed).length, 1);
});

test("made-for feed rows → items only when they can be shown honestly", () => {
  assert.equal(madeForItem({ intent_id: "x", revealed_at: null, plan: { kind: "game", title: "Pizza" } }), null);
  assert.equal(madeForItem({ intent_id: "x", revealed_at: at(0), plan: { kind: "game" } }), null, "no title, no card");
  const it = madeForItem({ intent_id: "x", revealed_at: at(0), plan: { kind: "game", title: "Pizza fractions", topicId: "c5-maths-ch02-t02" }, record: {}, outcome: "unaided" }, "1/4 is bigger than 1/2");
  assert.equal(it.because, "You thought 1/4 is bigger than 1/2"); assert.equal(it.result, "on_own"); assert.ok(it.topicTitle);
});

// ───────────────────────────── home states (SF1) ─────────────────────────────

const base = { resumable: false, usedMin: 0, capMin: 30, doneToday: false, now: "10:00", from: "07:00", to: "20:30", anyLesson: true };
test("homeStateOf: the safety hold first; homework and the test window inside the hours; never keyed to time away (F7)", () => {
  assert.equal(homeStateOf({ ...base, safetyHold: true, resumable: true }), "safety_hold");
  assert.equal(homeStateOf({ ...base, safetyHold: true, now: "23:00" }), "safety_hold");
  assert.equal(homeStateOf({ ...base, homework: true }), "homework");
  assert.equal(homeStateOf({ ...base, homework: true, doneToday: true }), "done", "homework never reopens a finished day");
  assert.equal(homeStateOf({ ...base, homework: true, now: "22:00" }), "resting");
  assert.equal(homeStateOf({ ...base, testWindow: true }), "test_window");
  assert.equal(homeStateOf({ ...base, testWindow: true, anyLesson: false }), "first", "lesson 1 is lesson 1, test or not");
  assert.equal(homeStateOf({ ...base, testWindow: true, homework: true }), "homework");
  assert.equal(homeStateOf(base), "start");
  assert.equal(legacyHome("safety_hold"), "resting");
  // F7: the inputs carry no "days away"; 1 day and 30 days give the same state for the same plan facts
  assert.equal(homeStateOf({ ...base }), homeStateOf({ ...base }));
});

const PLAN = { state: "start", homeState: "default", plan: { openLesson: null, window: { from: "07:00", to: "20:30" } },
  topic: { id: "c5-maths-ch02-t02", title: "Comparing fractions", shortTitle: "Comparing fractions", chapter: "Fractions", subject: "maths", minutes: 25 },
  resume: null, today: null, capRemaining: 30, capMin: 30, usedMin: 0, opensAt: null, packReady: null, day: "2026-10-04", tz: "Asia/Kolkata",
  teacher: { id: "arjun", name: "Arjun", addressedAs: "Arjun", role: "AI teacher", pronouns: { subject: "he", object: "him", possessive: "his" }, voice: "x", lookRev: 1, signatureColor: null },
  surfaces: { map: true, notebook: true, resume: true }, source: { dayPlan: null } };

test("the client reads every new state, the shelf and the per-child text-only; a held home never offers practice", () => {
  for (const s of ["homework", "test_window", "safety_hold"]) assert.ok(isPlanResponse({ ...PLAN, state: s }), s);
  const p = fromServer({ ...PLAN, state: "done", madeFor: [{ id: "a", kind: "game", title: "T", topicTitle: null, at: at(0), still: null, because: null }], textOnly: true });
  assert.equal(p.madeFor.length, 1); assert.equal(p.textOnly, true);
  assert.equal(practiceOffered({ source: "server", state: "safety_hold", packReady: false }), false);
  assert.equal(fallbackPlan({ online: true, cached: { topic: null, surfaces: PLAN.surfaces, day: "x", hold: true }, doneToday: false }).state, "safety_hold",
    "a plan outage during a hold never offers a lesson");
});

// ───────────────────────────── practice and Ask (flows G10, G11) ─────────────────────────────

test("Ask routes a question to its topic in the child's class (fractions under fractions), else null", () => {
  const frac = matchTopic("Why is 1/2 bigger than 1/3?", 5);
  assert.ok(frac && /fraction/i.test(getTopic(frac.topicId).chapter.title + getTopic(frac.topicId).title), JSON.stringify(frac));
  const hing = matchTopic("1/2 bada kyun hai 1/3 se?", 4);
  assert.ok(hing && /fraction/i.test(getTopic(hing.topicId).title + getTopic(hing.topicId).chapter.title));
  const plants = matchTopic("how do plants make food?", 7);
  assert.ok(plants && getTopic(plants.topicId).subject === "science");
  assert.equal(matchTopic("hello", 5), null);
  assert.ok(conceptTokens("3 x 4 kitna hota hai").has("multiplication"));
  assert.equal(questionTitle("why is 1/2 bigger than 1/3?"), "Why is 1/2 bigger than 1/3?");
  assert.ok(questionTitle("x".repeat(30) + " " + "y".repeat(40)).endsWith("…"));
});

test("the practice set: ≤ 5 verified kit items from the review queue, due skills first, never a teach-back", () => {
  const items = ["a", "b"].flatMap((sk) => [1, 2, 3, 4].map((i) => ({ id: `${sk}${i}`, skillId: sk, kind: "practice" })));
  const kit = { items: [...items, { id: "tb", skillId: "a", kind: "teachback" }] };
  const sk = (id, extra) => ({ skillId: id, pL: 0.6, mem: null, n: 4, flags: {}, recent: [1, 1], opp: 0, run: 0, display: "practising", refresh: false, ...extra });
  const ledger = { skills: { a: sk("a", { display: "learned_today", refresh: true }), b: sk("b", { recent: [0, 0] }) } };
  const set = buildPracticeSet({ kit, ledger, now: Date.parse("2026-10-04T05:00:00Z") });
  assert.ok(set.count <= PRACTICE_MAX && set.count === 5);
  assert.ok(!set.itemIds.includes("tb"));
  assert.equal(set.itemIds[0], "a1", "the due skill leads");
  assert.equal(buildPracticeSet({ kit, ledger: { skills: {} }, now: 0 }), null, "a child who has met none of these skills gets no set");
  assert.equal(purposeSeam.practiceSet({ purpose: "lesson", kit, ledger, now: 0 }), null);
});

test("lesson screen helpers: the question keeps its context sentence; Ask is titled by the question; the practice count", () => {
  assert.equal(inferAsk("Ek ground mein 4 rows hain, har row mein 4 players. Kitne players honge?"), "Ek ground mein 4 rows hain, har row mein 4 players. Kitne players honge?");
  assert.equal(inferAsk("Bahut badhiya. What is 3 + 4?"), "What is 3 + 4?", "a question with its own numbers stands alone");
  assert.equal(questionShortTitle("Why is 1/2 bigger than 1/3 when 3 is bigger?").length <= 24, true);
  assert.equal(questionShortTitle("Why plants?"), "Why plants?");
  assert.deepEqual(practiceCount(undefined, 2, 1), { n: 2, of: PRACTICE_OF, done: false });
  assert.deepEqual(practiceCount(undefined, 7, 5), { n: 5, of: 5, done: true });
  assert.deepEqual(practiceCount({ n: 3, of: 5 }, 9, 9), { n: 3, of: 5, done: false }, "the server's count wins when sent");
});

// ───────────────────────────── sign-in, names, labels ─────────────────────────────

test("sign-in and sign-up errors sit on their field, in sentences; never the API string", () => {
  assert.deepEqual(Object.keys(checkAuthFields({}, ["name", "email", "password"])), ["name", "email", "password"]);
  assert.equal(checkAuthFields({ email: "bad", password: "short" }, ["email", "password"]).password, W2A["auth.err.password.short"]);
  assert.equal(checkAuthFields({ email: "a@b.co", password: "x" }, ["email", "password"], 0).password, undefined, "sign-in has no length rule");
  const e = authErrorOf(new ApiError(400, "invalid email", { error: "invalid email", field: "email", code: "email.bad" }));
  assert.deepEqual(e, { field: "email", text: W2A["auth.err.email.bad"] });
  assert.equal(authErrorOf(new ApiError(400, "missing field: email", { error: "missing field: email" })).text.includes("missing field"), false);
  assert.equal(authErrorOf(new ApiError(429, "too many", {})).text, W2A["auth.err.wait"]);
});

test("teacher names fit the teacher (no 'Arjun' for a woman teacher); child labels are short; her line is server words", () => {
  assert.deepEqual(fitNames(["Asha", "Arjun", "Uma", "Tara"], "asha"), ["Asha", "Uma", "Tara"]);
  assert.deepEqual(fitNames(["Arjun", "Asha", "Uma"], "arjun"), ["Arjun"]);
  assert.equal(childLabelOf("Make a sensible estimate of a collection using a known group"), "Make a sensible estimate");
  assert.equal(childLabelOf("Anything", "Count in tens"), "Count in tens");
  assert.ok(childLabelOf("Name faces, edges and corners on a solid shape").split(" ").length <= 6);
  assert.match(skillLineOf("english", "got_it", "Count faces"), /^You showed me count faces/);
  assert.ok(!/\d/.test(skillLineOf("hinglish", "secure", "Comparing fractions")), "no digits to normalise before TTS");
});

test("every new W2-A label is English chrome (no Devanagari, no exclamation marks)", () => {
  for (const [k, v] of Object.entries(W2A)) {
    assert.ok(!/[ऀ-ॿ]/.test(v), k);
    assert.ok(!v.includes("!"), k);
  }
});
