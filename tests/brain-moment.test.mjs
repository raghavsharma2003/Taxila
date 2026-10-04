// The turn's Moment and beat (TEACHER-BRAIN TB6, §4.1, §6; BUILD-PLAN W2-E #3): G-MOMENT on the Brain's side — the Moment
// is never keyed to the verdict (TA1/TA7), safety suppresses affect (TA8), teacherAffect has one producer (the relational
// directive), the uptake prelude is the child's own token and off by default — plus the beat a move belongs to.
import { test } from "node:test";
import assert from "node:assert/strict";
import { momentOf, keyTokenOf, bondStageOf } from "../server/brain/moment.js";
import { beatTypeOf, nextBeat, uiBeatOf, EXPLAIN_BEATS } from "../server/brain/beat.js";
import { engagementOf, initialAffect, nextAffect, frustrationLoop } from "../server/learner/affect.js";

const ctx = { classLevel: 5, lang: "hinglish", firstMeeting: false };
const base = { move: { kind: "practice" }, engagement: "engaged", ctx, turn: 4, safety: false, lane: "cascade", childText: "3/4 hai" };
const affect = (display, cause = "effort") => ({ affect: { display, intensity: 2, cause, turn: 4 }, canRemember: false, ui: { teacherAffect: { display, intensity: 2 } }, notes: [], events: [] });

test("G-MOMENT: flipping the verdict correct ↔ not_yet with the same relational affect changes `verdict` and nothing else", () => {
  for (const kind of ["practice", "probe", "hint", "reteach", "explain", "retrieval", "teachback"]) {
    for (const rel of [null, affect("warm_pride", "effort"), affect("calm_curious", "confusion")]) {
      const a = momentOf({ ...base, move: { kind }, verdict: "correct", relational: rel });
      const b = momentOf({ ...base, move: { kind }, verdict: "not_yet", relational: rel });
      assert.equal(a.verdict, "correct");
      assert.equal(b.verdict, "not_yet");
      assert.deepEqual({ ...a, verdict: null }, { ...b, verdict: null }, `${kind}: only the verdict differs`);
    }
  }
});

test("teacherAffect has one producer: the relational directive; without one the Moment is neutral_warm (cause none), never a correct-keyed delight", () => {
  const none = momentOf({ ...base, verdict: "correct", relational: null });
  assert.deepEqual(none.teacherAffect, { display: "neutral_warm", intensity: 1, cause: "none", turn: 4 });
  const rel = momentOf({ ...base, verdict: "ungraded", relational: affect("delight", "insight") });
  assert.equal(rel.teacherAffect.display, "delight");
  assert.equal(rel.teacherAffect.cause, "insight");
  // a display outside the charter is not passed through
  assert.equal(momentOf({ ...base, relational: affect("ecstatic") }).teacherAffect.display, "neutral_warm");
});

test("TA8: safety suppresses affect (calm_steady, cause safety), whatever the directive says; no prelude on a safety turn", () => {
  process.env.TAXILA_UPTAKE_PRELUDE = "1";
  try {
    const m = momentOf({ ...base, move: { kind: "safeguard" }, safety: true, relational: affect("playful", "child_joke"), childText: "papa mujhe maarte hain" });
    assert.deepEqual([m.teacherAffect.display, m.teacherAffect.cause, m.safety], ["calm_steady", "safety", true]);
    assert.equal(m.uptakePrelude, undefined);
  } finally { delete process.env.TAXILA_UPTAKE_PRELUDE; }
});

test("L3 uptake prelude: the child's own key token, verdict-neutral; off by default; never on the realtime lane or a typed turn", () => {
  assert.equal(momentOf({ ...base, childText: "teen chauthai yaani 3/4" }).uptakePrelude, undefined, "off unless TAXILA_UPTAKE_PRELUDE=1 (HV-16)");
  process.env.TAXILA_UPTAKE_PRELUDE = "1";
  try {
    assert.deepEqual(momentOf({ ...base, verdict: "correct", childText: "teen chauthai yaani 3/4" }).uptakePrelude, { text: "3/4" });
    assert.deepEqual(momentOf({ ...base, verdict: "not_yet", childText: "teen chauthai yaani 3/4" }).uptakePrelude, { text: "3/4" }, "same token whatever the verdict");
    assert.equal(momentOf({ ...base, lane: "voice", childText: "3/4" }).uptakePrelude, undefined);
    assert.equal(momentOf({ ...base, typed: true, childText: "3/4" }).uptakePrelude, undefined);
  } finally { delete process.env.TAXILA_UPTAKE_PRELUDE; }
  assert.equal(keyTokenOf("mujhe lagta hai photosynthesis hota hai"), "photosynthesis");
  assert.equal(keyTokenOf("[tap opt:1]"), null);
  assert.equal(keyTokenOf("pata nahi"), null);
});

test("the Moment's band, language, bond stage and thinking-aloud licence", () => {
  const m = momentOf({ ...base, move: { kind: "worked_example" } });
  assert.deepEqual([m.band, m.lang, m.bondStage, m.thinkAloud], ["B3", "hinglish", "first_sessions", true]);
  assert.equal(momentOf({ ...base, ctx: { classLevel: 4, lang: "english", firstMeeting: true } }).band, "B2");
  assert.equal(momentOf({ ...base, ctx: { classLevel: 4, lang: "english", firstMeeting: true } }).lang, "en");
  assert.equal(bondStageOf({ firstMeeting: true }), "meeting");
  assert.equal(bondStageOf({ bondStage: "regular", firstMeeting: true }), "regular", "the RELATIONAL-OS snapshot stage wins");
});

test("engagement comes from the child's words and actions only, and strain follows the frustration loop (signals add, never remove)", () => {
  let a = initialAffect();
  assert.equal(engagementOf(a, { turn: 1 }), "warming");
  assert.equal(engagementOf(a, { turn: 5 }), "engaged");
  for (let i = 0; i < 3; i++) a = nextAffect(a, { read: { dontKnow: true } });
  assert.equal(engagementOf(a, { turn: 6 }), "strained");
  assert.equal(engagementOf(initialAffect(), { stopping: true }), "stopped");
  // the signals block's acts (classify.js signalFlags): two turns of frustration words, or a break asked for
  let b = nextAffect(initialAffect(), { read: { frustrationWords: true } });
  assert.equal(frustrationLoop(b), false);
  b = nextAffect(b, { read: { frustrationWords: true } });
  assert.equal(frustrationLoop(b), true);
  assert.equal(frustrationLoop(nextAffect(initialAffect(), { read: { metaBreak: true } })), true);
  // without signals the affect state is exactly the old shape (no new keys): replay stays byte-identical
  assert.deepEqual(Object.keys(nextAffect(initialAffect(), { read: { dontKnow: false } })).sort(), ["asks", "dontKnowStreak", "minimalStreak", "recent"]);
});

test("beats: moves map onto beat types; a beat keeps its id while it lasts; a misconception re-teach is a contrast beat", () => {
  assert.equal(beatTypeOf({ kind: "greet" }), "arrive");
  assert.equal(beatTypeOf({ kind: "practice" }), "practice_set");
  assert.equal(beatTypeOf({ kind: "hint" }), null, "a hint continues the beat");
  assert.equal(beatTypeOf({ kind: "reteach" }, { turn: 5, lastReteach: { misId: "m1", turn: 5 } }), "contrast");
  assert.equal(beatTypeOf({ kind: "reteach" }, { turn: 5, lastReteach: { misId: null, turn: 5 } }), "explain");
  let b = nextBeat(undefined, { kind: "hook" }, { turn: 1 });
  assert.deepEqual(b, { id: "b1-hook", type: "hook", n: 1, since: 1 });
  b = nextBeat(b, { kind: "explain" }, { turn: 2 });
  const same = nextBeat(b, { kind: "explain" }, { turn: 3 });
  assert.equal(same, b, "same beat object while the type holds");
  assert.equal(nextBeat(b, { kind: "hint" }, { turn: 4 }), b);
  assert.deepEqual(uiBeatOf(b), { beatId: "b2-explain", type: "explain", index: 2 });
  for (const t of ["explain", "worked_example", "contrast"]) assert.ok(EXPLAIN_BEATS.has(t));
  assert.ok(!EXPLAIN_BEATS.has("practice_set") && !EXPLAIN_BEATS.has("hook"));
});
