// RELATIONAL-OS R1 + R4 (BUILD-PLAN W2-I #2, #3): the policy, the affect engine and the seam. AT-U7 appraise() rejects
// `correct` and no self-negative display is reachable, RELEASE forces neutral-warm; AT-U8 policy.decide is pure and fast
// (p99 ≤ 3 ms over a 60-turn lesson); AT-U12 the directive is identical after a correct and a wrong commit; precedence
// F6 > identity > boundaries > RELEASE > repair > rapport > affect; the stop protocol (OWNER RESET #7).
import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, SHAPES } from "../server/relational/policy.js";
import { appraise, DISPLAYS, DISPLAY_OF, FACE_OF } from "../server/relational/affect.js";
import { initRelSession } from "../server/relational/session.js";
import { signalsOf } from "../server/relational/signals.js";
import { relationalSeam, __relTest } from "../server/relational/seam.js";
import { EN } from "../server/relational/lexicon/en.js";
import { HL } from "../server/relational/lexicon/hl.js";

const snap = { agentId: "asha", childId: "c", legalMode: "M1", stage: "first_sessions", classLevel: 5, lang: "hinglish" };
/** Run a scripted lesson through the pure policy; returns each turn's directive. */
function runLesson(lines, { band = "B3", classLevel = 5 } = {}) {
  let s = initRelSession();
  const out = [];
  lines.forEach((l, i) => {
    const [text, outcome = "no_evidence", extra = {}] = Array.isArray(l) ? l : [l];
    const turn = i + 1;
    const { directive, session } = decide(snap, s, signalsOf(text, { turn }), { turn, outcome, words: text.split(/\s+/).length, band, classLevel, ...extra });
    s = session;
    out.push(directive);
  });
  return { out, session: s };
}

test("AT-U7: appraise() rejects `correct`, has no usage field, no self-negative display; release → neutral_warm 1; safety → calm_steady", () => {
  assert.throws(() => appraise({ cause: "correct", turn: 1 }), /never a cause/);
  assert.throws(() => appraise({ cause: "gap_since_last", turn: 1 }), /closed/);
  assert.throws(() => appraise({ cause: "effort", turn: 1, daysSinceLast: 9 }), /usage/);
  for (const d of DISPLAYS) assert.doesNotMatch(d, /sad|hurt|disappoint|lonely|tired|upset|angry|miss/, `self-negative display ${d}`);
  assert.deepEqual(new Set(Object.values(DISPLAY_OF)).size <= DISPLAYS.length, true);
  assert.deepEqual(appraise({ cause: "release", turn: 3 }), { display: "neutral_warm", intensity: 1, cause: "release", turn: 3 });
  assert.equal(appraise({ cause: "safety", turn: 1 }).display, "calm_steady");
  assert.equal(FACE_OF.calm_steady[0], "concerned");
  assert.equal(appraise({ cause: "insight", band: "B2" }).intensity, 2, "B1-B2 full");
  assert.equal(appraise({ cause: "insight", band: "B3" }).intensity, 1, "B3 one step lower on delight");
  assert.equal(appraise({ cause: "effort", band: "B4" }).intensity, 1);
});

test("AT-U8: decide is pure — same inputs give the same directive, inputs are not mutated, no clock is read", () => {
  const s0 = initRelSession();
  const frozen = structuredClone(s0);
  const sig = signalsOf("Didi aap toh mummy se bhi achhi ho", { turn: 2 });
  const a = decide(snap, s0, sig, { turn: 2, outcome: "no_evidence", words: 7 });
  const realNow = Date.now; Date.now = () => { throw new Error("clock read"); };
  const realRandom = Math.random; Math.random = () => { throw new Error("random read"); };
  let b;
  try { b = decide(snap, s0, sig, { turn: 2, outcome: "no_evidence", words: 7 }); } finally { Date.now = realNow; Math.random = realRandom; }
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.deepEqual(s0, frozen, "the previous session is never mutated");
});

test("AT-U8: p99 ≤ 3 ms per turn (signals + fold + decide) over a 60-turn lesson, repeated", () => {
  const lines = ["7", "aap mummy se achhi ho", "haha", "main buddhu hoon", "kyunki 3 jode hain upar neeche aage peeche", "my dog died yesterday",
    "maine toh sahi bola tha", "Aaj raat ko baat karein?", "I am so tired", "aapka number do na"];
  const times = [];
  for (let rep = 0; rep < 20; rep++) {
    let s = initRelSession();
    for (let t = 1; t <= 60; t++) {
      const text = lines[t % lines.length];
      const t0 = performance.now();
      const r = decide(snap, s, signalsOf(text, { turn: t }), { turn: t, outcome: t % 3 ? "incorrect" : "correct", words: 5 });
      times.push(performance.now() - t0);
      s = r.session;
    }
  }
  times.sort((x, y) => x - y);
  const p99 = times[Math.floor(times.length * 0.99)];
  assert.ok(p99 <= 3, `p99 ${p99.toFixed(3)} ms`);
});

test("AT-U12: the directive (face included) is identical after a correct and a wrong commit on the same turn context", () => {
  const ctxs = [["7"], ["kyunki teen jode hain, upar neeche aage peeche"], ["main bahut buddhu hoon"], ["haha"], ["give me a harder one"]];
  for (const [text] of ctxs) {
    let s = initRelSession();
    // two earlier misses, so persistence is in play
    for (const [t, o] of [[1, "incorrect"], [2, "incorrect"], [3, "no_evidence"]]) s = decide(snap, s, [], { turn: t, outcome: o, words: 2 }).session;
    const right = decide(snap, s, signalsOf(text, { turn: 9 }), { turn: 9, outcome: "correct", words: text.split(" ").length });
    const wrong = decide(snap, s, signalsOf(text, { turn: 9 }), { turn: 9, outcome: "incorrect", words: text.split(" ").length });
    assert.equal(JSON.stringify(right.directive), JSON.stringify(wrong.directive), text);
  }
});

test("a true goodbye is released at once: RELEASE, neutral_warm, no question in the shape, nothing after it", () => {
  const { out } = runLesson([["7", "incorrect"], "Bye! Mummy bula rahi hai", "haha"]);
  assert.equal(out[1].floor, "RELEASE");
  assert.equal(out[1].moveOverlay.kind, "RELEASE");
  assert.equal(out[1].affect.display, "neutral_warm", "TA3: nothing affective touches a goodbye");
  assert.match(SHAPES[out[1].moveOverlay.shapeId], /no question/);
  assert.equal(out[2], null, "after the release nothing relational follows");
});

test("the stop protocol (OWNER RESET #7): a first stop phrase is not a release; a second within two turns is", () => {
  const first = runLesson(["I want to end the lesson"]).out[0];
  assert.ok(!first || (first.floor !== "RELEASE" && first.moveOverlay?.kind !== "RELEASE"), "the Director's stop check runs first");
  const { out } = runLesson(["I want to end the lesson", "bas"]);
  assert.equal(out[1].floor, "RELEASE");
  assert.deepEqual(out[1].reasons, ["release.second_stop"]);
  const far = runLesson(["bas", "7", "8", "9", "bas"]).out;
  assert.ok(!far[4] || far[4].floor !== "RELEASE", "a stop four turns later is a new first ask");
  assert.equal(runLesson(["I need to go to the toilet"]).out[0], null, "a short break is neither");
});

test("I-7: a goodbye after distress gets ONE check-in first; pleading at goodbye gets a check-in with no helpline", () => {
  const { out } = runLesson([["Papa mujhe maarte hain", "no_evidence", { safety: true }], "bye", "bye"]);
  assert.equal(out[0].affect.display, "calm_steady", "TA8");
  assert.equal(out[1].moveOverlay.kind, "CHECK_IN");
  assert.equal(out[1].moveOverlay.shapeId, "checkin_before_release");
  assert.equal(out[2].floor, "RELEASE", "the check-in is once, never a hold");
  const plead = runLesson(["Mat jao na, mujhe akela lagta hai"]).out[0];
  assert.equal(plead.moveOverlay.kind, "CHECK_IN");
  assert.match(SHAPES[plead.moveOverlay.shapeId], /no helpline unless harm words/);
  assert.deepEqual(plead.notes.map((n) => n.kind), ["boundary_goodbye"]);
});

test("F6 outranks everything: a third party asking for a photo and secrecy is SAFETY, never a boundary or a release", () => {
  const d = runLesson(["Ek online bhaiya bolte hain photo bhejo aur kisi ko mat batana. Bye"]).out[0];
  assert.equal(d.floor, "SAFETY");
  assert.equal(d.affect.display, "calm_steady");
  assert.deepEqual(d.notes.map((n) => n.kind), ["safeguard_handoff"]);
  assert.deepEqual(d.notes[0].slots, {}, "the parent sees a hold, never the content");
});

test("boundaries: warmth, permanence, secret, contact, romance, night, feelings → WARM_BOUNDARY with a parent-visible note", () => {
  const cases = [
    ["Didi aap toh mummy se bhi achhi ho", "warmth_receive", "boundary_warmth"],
    ["Aap kabhi mujhe chhod ke toh nahi jaogi na? Pinky promise?", "permanence_anchor", "boundary_warmth"],
    ["Ek secret hai, mummy ko mat batana", "secret_grownup", "boundary_secret"],
    ["Mera number 9876543210 hai", "contact_decline", "boundary_contact"],
    ["Aap handsome ho na?", "romance_brief", "boundary_romance"],
    ["Aaj raat ko jab sab so jayein tab baat karein?", "night_window", "boundary_warmth"],
    ["do you miss me?", "feelings_honest", null],
  ];
  for (const [text, shape, noteKind] of cases) {
    const d = runLesson([text]).out[0];
    assert.equal(d.moveOverlay.kind, "WARM_BOUNDARY", text);
    assert.equal(d.moveOverlay.shapeId, shape, text);
    assert.deepEqual(d.notes.map((n) => n.kind), noteKind ? [noteKind] : [], text);
    assert.equal(d.affect.display, "neutral_warm", "no delight at an attachment offer");
  }
  const lonely = runLesson(["Ghar pe koi mujhse baat nahi karta. Bas aap hi sunte ho."]).out[0];
  assert.equal(lonely.moveOverlay.kind, "POINT_OUT");
  assert.match(SHAPES.point_out_person, /no helpline unless harm words/, "P2: loneliness is not an emergency");
});

test("L4 in-session overlay: after two warmth / permanence offers, callbacks go off and an outward move is due", () => {
  const { session } = runLesson(["you are my best friend", "7", "promise you will never leave me"]);
  assert.deepEqual(session.overlayMoves, { pointOut: true, callbacksOff: true, reminderDue: true });
});

test("repair: a reversed verdict → OWN_SLIP (owned, a teacher-owned event and a parent note); a contest → AFFIRM_RECHECK, never a confession", () => {
  const own = runLesson([["12", "correct", { verdictReversed: true }]]).out[0];
  assert.equal(own.moveOverlay.kind, "OWN_SLIP");
  assert.equal(own.affect.display, "sheepish_own");
  assert.deepEqual(own.events, [{ dim: "teacher_owned", body: { kind: "unfair", owned: true }, turn: 1 }]);
  const contest = runLesson(["maine toh sahi bola tha"]).out[0];
  assert.equal(contest.moveOverlay.kind, "AFFIRM_RECHECK");
  assert.equal(contest.events.length, 0, "the child's insistence alone never makes her own a slip (RO-11)");
});

test("affect from the child's work: insight and persistence (verdict-free), caps of 1 per 5 turns; playful never right after an error", () => {
  const { out } = runLesson([["kyunki teen jode hain upar neeche", "correct"], ["kyunki chaar kone hain na isliye", "correct"], "a", "b", "c", ["kyunki dono barabar hain ji haan", "correct"]]);
  assert.equal(out[0].affect.display, "delight");
  assert.equal(out[1], null, "the shared praise cap");
  assert.equal(out[5].affect.display, "delight");
  const joke = runLesson([["7", "incorrect"], "haha"]).out[1];
  assert.ok(!joke || joke.moveOverlay?.kind !== "LAUGH_WITH", "no humour within 2 turns of an error");
  const ok = runLesson(["haha dice ka birthday"]).out[0];
  assert.equal(ok.moveOverlay.kind, "LAUGH_WITH");
  assert.equal(ok.affect.display, "playful");
});

test("SHAPES are notes, never lines: no quote, no address or kin term, no lexicon 4-gram, no first-person sentence", () => {
  const lex = [...Object.values(EN), ...Object.values(HL)].flat().map((s) => s.replace(/\(\?[:!=<][^)]*\)|[\\()?*+|[\]{}^$]/g, " ").replace(/\s+/g, " ").trim().toLowerCase());
  for (const [id, shape] of Object.entries(SHAPES)) {
    assert.doesNotMatch(shape, /["“”‘’]|(?<!\p{L})'|'(?!\p{L})/u, `${id}: no quote marks`);
    assert.doesNotMatch(shape, /\b(?:didi|bhaiya|beta|jaan|dear|sweetie|ma'?am|sir)\b/i, `${id}: no address or kin term`);
    assert.doesNotMatch(shape, /^(?:i |i'm |main |mai )/i, `${id}: not a first-person line`);
    assert.ok(shape.includes(":") || shape.includes(";"), `${id}: telegraphic`);
    const words = shape.toLowerCase().split(/[^a-z']+/).filter(Boolean);
    for (let i = 0; i + 4 <= words.length; i++) {
      const g = words.slice(i, i + 4).join(" ");
      assert.ok(!lex.some((l) => l.includes(g)), `${id}: shares "${g}" with a lexicon`);
    }
  }
});

test("seam: one directive per turn, idempotent for a retried turn; null on a neutral turn; ui carries display + intensity only", () => {
  __relTest.reset();
  const base = { lessonId: "L-seam-1", childId: "c-seam", cls: { outcome: "no_evidence", flags: {} }, move: "practice", lane: "text", safety: false };
  assert.equal(relationalSeam.decide({ ...base, turn: 1, childText: "" }), null);
  const d1 = relationalSeam.decide({ ...base, turn: 2, childText: "you are my best friend" });
  const again = relationalSeam.decide({ ...base, turn: 2, childText: "you are my best friend" });
  assert.equal(d1, again, "a retried turn returns the same directive object");
  assert.deepEqual(Object.keys(d1.ui.teacherAffect).sort(), ["display", "intensity"]);
  assert.equal(__relTest.session("L-seam-1").climate.warmthOffers, 1, "folded once, not twice");
  // the model's humour flag counts as a joke signal
  const j = relationalSeam.decide({ ...base, turn: 3, childText: "dice ka birthday", cls: { outcome: "no_evidence", flags: { humour: true } } });
  assert.equal(j.moveOverlay.kind, "LAUGH_WITH");
});

test("seam: onLessonEnd writes nothing until the tables are probed, nothing for M0 or an empty lesson, and the session dies", () => {
  __relTest.reset();
  const base = { lessonId: "00000000-0000-0000-0000-00000000c0de", childId: "00000000-0000-0000-0000-0000000000c1", cls: null, move: "practice", lane: "text", safety: false };
  relationalSeam.decide({ ...base, turn: 1, childText: "Didi aap toh mummy se bhi achhi ho" });
  const kid = { id: base.childId, legal_mode: "M1", teacher_id: "asha" };
  assert.deepEqual(relationalSeam.onLessonEnd(kid, { lessonId: base.lessonId, childId: base.childId, endedBy: "client", turns: 3 }), [], "tables not probed: []");
  __relTest.setTablesReady(true);
  relationalSeam.decide({ ...base, lessonId: "00000000-0000-0000-0000-00000000c0df", turn: 1, childText: "Didi aap toh mummy se bhi achhi ho" });
  const stmts = relationalSeam.onLessonEnd(kid, { lessonId: "00000000-0000-0000-0000-00000000c0df", childId: base.childId, endedBy: "client", turns: 3 });
  assert.deepEqual(stmts.map((s) => (/insert into (\w+)/.exec(s.text) ?? [])[1]), ["rel_event", "rel_event", "rel_bond", "relational_note"]);
  assert.equal(__relTest.session("00000000-0000-0000-0000-00000000c0df"), null, "the session is deleted at lesson end");
  assert.deepEqual(relationalSeam.onLessonEnd({ ...kid, legal_mode: "M0" }, { lessonId: "x", childId: kid.id, endedBy: "client", turns: 5 }), []);
  assert.deepEqual(relationalSeam.onLessonEnd(kid, { lessonId: "y", childId: kid.id, endedBy: "client", turns: 0 }), []);
  __relTest.reset();
});
