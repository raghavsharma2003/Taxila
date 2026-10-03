// The live lesson path on the new learner model (no network, no database): the route's real planTurn folds the
// Director's evidence through the BKT-R ledger + facets (learner/live.js, comprehension/fuse.js), and kt_evidence is
// the event source — a replay of the rows it stages, in the seq order the database would assign, reproduces the
// cached fold byte for byte (TP2 on the integrated write path; the unit-level property is learner-order.test.mjs).
// Also: the episode mapping, the two upstream ledger fixes (source weight, misconception cap), E6 on the held why,
// voice isolation (CE8), the re-teach cooldown, and the 001 projection the parent corner reads.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { __test } from "../server/routes/lesson.js";
import { initLessonState, step, LIVE_PROBE_SHAPES, RETEACH_COOLDOWN } from "../server/director/state.js";
import { findItem } from "../server/director/items.js";
import { newLearnerState, fuseEvidence, stateDigest } from "../server/comprehension/fuse.js";
import { canonical } from "../server/learner/kt/ledger.js";
import { temper, SOURCE_WEIGHT } from "../server/learner/kt/bktr.js";
import { fold, newLedger } from "../server/learner/kt/ledger.js";
import { misP, MIS_PRIOR, MIS_SESSION_LOG_CAP } from "../server/learner/kt/misconception.js";
import { outcomeIndex } from "../server/learner/kt/outcomes.js";
import { ktEvidenceStmt } from "../server/learner/writer.js";
import { eventFromRow } from "../server/learner/model.js";
import { LIVE_FOLD_CTX, legacySkillState, commitLive, evictLive, loadLive } from "../server/learner/live.js";
import { finalEvent } from "../server/comprehension/later.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

const K = kit();
const CHILD = { id: "00000000-0000-0000-0000-0000000000bb", legal_mode: "M1", class_level: 4 };
const LESSON = { id: "11111111-1111-1111-1111-111111111111", started_at: new Date(0).toISOString() };
const { planTurn } = __test;

function startState() {
  const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 4, sessionId: LESSON.id }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
  return { ...r.state, brief: BRIEF, mode: "text" };
}

/**
 * Drive `answers` through planTurn as the turn route does (stage the child row, plan, take the next state), carrying
 * the held why/teach-back events into the next turn with no verdict (the fallback path). Returns every staged
 * kt_evidence event in insert order and the final cached fold.
 */
async function drive(answers, { voice } = {}) {
  let s = startState();
  let live = { state: newLearnerState({ childId: CHILD.id, classLevel: 4 }), maxSeq: 0 };
  const log = [], plans = [];
  for (const [i, c] of answers.entries()) {
    s = { ...s, seq: s.seq + 1 };
    const now = (i + 1) * 20_000;
    const carried = (s.kt?.deferred ?? []).map((d) => finalEvent(d.event, undefined));
    const p = await planTurn(s, c, { kit: K, child: CHILD, lesson: LESSON, activeItem: findItem(s, K, s.activeItemId), moduleOnly: false, moduleEvents: [],
      answer: "x", childText: "x", leaked: false, live: Promise.resolve(live), carried, now, ...(voice ? { voice } : {}) });
    for (const w of p.writes) if (w.ktEvidence) log.push(p.events.find((e) => e.id === w.params[0]));
    plans.push(p);
    live = { state: p.learner.after, maxSeq: live.maxSeq + p.writes.filter((w) => w.ktEvidence).length };
    s = p.r.state;
  }
  return { log, live, plans, s };
}
// prior.seq is where a prior was materialised: null online, the db seq on replay
const digest = (st) => {
  const L = st.ledger;
  return canonical({ skills: Object.fromEntries(Object.entries(L.skills).map(([k, v]) => [k, { ...v, prior: v.prior && { ...v.prior, seq: null } }])), mis: L.mis })
    + "|" + stateDigest({ ledger: { ...L, skills: {} , mis: {} , ability: {} }, comp: st.comp });
};
const LESSON_RUN = [
  cls("no_evidence"), cls("no_evidence"), cls("no_evidence"), cls("no_evidence"), cls("no_evidence"),
  cls("incorrect"), cls("incorrect"), cls("correct"),
  cls("correct"), cls("correct"),
  cls("misconception", { misconceptionId: "c4-maths-ch05-t01-m1" }), cls("incorrect"), cls("incorrect"), cls("incorrect"), cls("no_evidence"),
  cls("correct"), cls("correct"), cls("correct"), cls("correct"), cls("partial"), cls("correct"),
];

describe("live learner path", () => {
  test("replay of the staged kt_evidence rows (seq = insert order) equals the online fold, across a whole lesson", async () => {
    const { log, live } = await drive(LESSON_RUN);
    assert.ok(log.length >= 6, `the lesson wrote KT events (${log.length})`);
    assert.ok(log.some((e) => e.teach), "a teach event (explain / worked example)");
    assert.ok(log.some((e) => e.cls === "item.open"), "an item event");
    const replay = fuseEvidence(newLearnerState({ childId: CHILD.id, classLevel: 4 }), log.map((e, i) => ({ ...e, seq: i + 1 })), LIVE_FOLD_CTX);
    assert.equal(digest(replay), digest(live.state));
  });

  test("every staged event round-trips through the kt_evidence columns (CE fields included) unchanged for the fold", async () => {
    const { log } = await drive(LESSON_RUN);
    const COLS = ["id", "child_id", "session_id", "session_start_at", "episode_id", "occurred_at", "skill_ids", "cls", "outcome", "grader", "grader_version", "item_key",
      "teach", "assisted", "controller_easy", "gaming_window", "pre_attempt_help", "form", "target", "topic_type", "misconception_id", "discriminates", "mis_route",
      "entry_rung", "contaminated", "kit_verified", "params_version", "legal_mode_at_write", "via", "ebo", "shape_id", "weave_host", "coincident", "unfamiliar_context",
      "deference_discount", "span_ok"];
    const rows = log.map((e, i) => ({ ...Object.fromEntries(ktEvidenceStmt(CHILD, e).params.map((v, j) => [COLS[j], v])), seq: i + 1 }));
    const back = rows.map(eventFromRow);
    const viaRows = fuseEvidence(newLearnerState({ childId: CHILD.id, classLevel: 4 }), back, LIVE_FOLD_CTX);
    const direct = fuseEvidence(newLearnerState({ childId: CHILD.id, classLevel: 4 }), log.map((e, i) => ({ ...e, seq: i + 1 })), LIVE_FOLD_CTX);
    assert.equal(digest(viaRows), digest(direct));
  });

  test("episodes: wrong answers are not events until the episode closes; one event per episode", async () => {
    const { plans } = await drive(LESSON_RUN.slice(0, 8));
    const items = plans.flatMap((p) => p.events).filter((e) => e.cls === "item.open" && !e.teach);
    const byEpisode = new Map();
    for (const e of items) byEpisode.set(e.episodeId, (byEpisode.get(e.episodeId) ?? 0) + 1);
    for (const [ep, n] of byEpisode) assert.equal(n, 1, `episode ${ep} emitted ${n} events`);
    // the two wrong answers then a correct one: a single later-try / hinted correct (C1-C3), never C0
    const first = items[0];
    assert.ok(["C1", "C2", "C3"].includes(["C0", "C1", "C2", "C3", "C4", "IDK", "NA"][first.outcome]), `outcome ${first.outcome}`);
  });

  test("voice tie-breakers never move a belief or a KT byte (CE8): the same lesson with and without signals folds identically", async () => {
    const a = await drive(LESSON_RUN);
    const b = await drive(LESSON_RUN, { voice: { signals: { followUpProbe: true, gentlerHint: true, slowerPace: true }, z: { onsetMs: 2.5 } } });
    assert.equal(digest(b.live.state), digest(a.live.state));
  });

  test("the Director asks only shapes the live lane can grade", async () => {
    const { plans } = await drive(LESSON_RUN);
    for (const p of plans) {
      const pr = p.r.state.pendingProbe;
      if (pr?.shapeId && pr.reason !== "delayed_check" && pr.reason !== "lesson_teachback") assert.ok(LIVE_PROBE_SHAPES.has(pr.shapeId), pr.shapeId);
    }
  });

  test("held why: the blind verdict decides the facet; without a checked span it carries K only (E6 fails closed)", () => {
    const ev = { id: "w1", cls: "probe.why", outcome: outcomeIndex("probe.why", "none"), grader: "llm", skillIds: ["s"], target: "s" };
    assert.equal(finalEvent(ev, undefined).event.spanOk, false, "no verdict in time: classifier outcome, no span");
    const ok = finalEvent(ev, [{ label: "present", spanOk: true, op: "R-EXP", targetId: "s:e1" }, { label: "absent", spanOk: false, op: "R-EXP", targetId: "s:e2" }]).event;
    assert.equal(ok.outcome, outcomeIndex("probe.why", "full"));
    assert.equal(ok.spanOk, true);
    const unchecked = finalEvent(ev, [{ label: "present", spanOk: false, op: "R-EXP", targetId: "s:e1" }]).event;
    assert.equal(unchecked.spanOk, false, "a present label whose span failed the code check never certifies U");
    const na = finalEvent(ev, [{ label: "NA", spanOk: false, op: "R-EXP", targetId: "s:e1" }]).event;
    assert.equal(na.outcome, ev.outcome);
  });

  test("ledger fix (a): game evidence moves K at ×0.5, a Forge module at ×0.75 (spec §1.1)", () => {
    assert.equal(temper({ via: "game" }), 0.5);
    assert.equal(temper({ via: "module" }), 0.75);
    assert.equal(temper({ via: "dialogue" }), 1);
    assert.equal(temper({ via: "game", assisted: "parent" }), 0.25);
    assert.deepEqual(SOURCE_WEIGHT, { game: 0.5, module: 0.75 });
    const ev = (id, via) => ({ id, sessionId: "S", episodeId: id, at: "2026-10-01T10:00:00Z", sessionStartAt: "2026-10-01T10:00:00Z", skillIds: ["c5-maths-ch01-t01-s1"],
      cls: "item.open", outcome: 0, grader: "code", graderVersion: "t", itemKey: id, ...(via ? { via } : {}) });
    const pl = (via) => fold(newLedger({ childId: "c", classLevel: 5 }), [ev("a", via)]).skills["c5-maths-ch01-t01-s1"].pL;
    assert.ok(pl("game") < pl(undefined), "a lucky game answer moves pL less than a dialogue answer");
    assert.ok(pl("game") < pl("module") && pl("module") < pl(undefined));
  });

  test("ledger fix (b): misconception log-evidence is capped at ±log 50 per session; recovery after a re-teach is bounded", () => {
    const at = "2026-10-01T10:00:00Z";
    const hit = (i, sess = "S") => ({ id: `h${sess}${i}`, sessionId: sess, episodeId: `h${sess}${i}`, at, sessionStartAt: at, skillIds: ["c4-maths-ch05-t01-s2"],
      cls: "item.open", outcome: 4, grader: "code", graderVersion: "t", itemKey: `h${i}`, misconceptionId: "c4-maths-ch05-t01-m1" });
    const L = fold(newLedger({ childId: "c", classLevel: 4 }), [1, 2, 3, 4, 5].map((i) => hit(i)));
    const m = L.mis["c4-maths-ch05-t01-m1"];
    assert.equal(m.hits, 5, "every hit is still counted");
    const logit0 = Math.log(MIS_PRIOR / (1 - MIS_PRIOR));
    assert.ok(m.logit <= logit0 + MIS_SESSION_LOG_CAP + 1e-9, `logit ${m.logit} within the session cap`);
    // discriminating correct answers needed to resolve (p ≤ 0.2): ≤ 6 capped (uncapped five hits needed ≥ 16)
    let L2 = L, n = 0;
    while (!L2.mis["c4-maths-ch05-t01-m1"].resolvedAt && n < 40) {
      n += 1;
      L2 = fold(L2, [{ id: `d${n}`, sessionId: "S2", episodeId: `d${n}`, at: "2026-10-02T10:00:00Z", sessionStartAt: "2026-10-02T10:00:00Z", skillIds: ["c4-maths-ch05-t01-s2"],
        cls: "item.open", outcome: 0, grader: "code", graderVersion: "t", itemKey: `d${n}`, discriminates: "c4-maths-ch05-t01-m1" }]);
    }
    assert.ok(n <= 6, `resolved after ${n} discriminating correct answers`);
    assert.ok(misP(L2.mis["c4-maths-ch05-t01-m1"]) <= 0.2);
  });

  test("the 001 projection the parent corner reads comes from the ledger (never folded separately)", async () => {
    const { live } = await drive(LESSON_RUN);
    for (const sk of Object.values(live.state.ledger.skills)) {
      const p = legacySkillState(sk, 400_000);
      assert.ok(Math.abs(p.pKnown - sk.pL) < 1e-3);
      assert.ok(["unseen", "introduced", "practising", "learned_today", "mastered"].includes(p.status), p.status);
      assert.equal(p.attempts, sk.n);
    }
  });

  test("engine re-teach cooldown: after one, the next RETEACH_COOLDOWN graded items on the skill cannot trigger another", () => {
    const s = startState();
    const belief = { skillId: "c4-maths-ch05-t01-s2", state: "not_yet", reason: "wrong_idea_confirmed", display: "practising", pL: 0.3, retention: 0.3, U: 0.2, T: 0.2,
      open: [], refresh: false, misconception: { mStar: 0.9, mId: "c4-maths-ch05-t01-m1", verified: true } };
    let st = { ...s, phase: "practice", activeItemId: "i3", hintLevel: 0, comp: { "c4-maths-ch05-t01-s2": { belief, wheelSpin: "none", kitInputs: [] } } };
    const kinds = [];
    for (let i = 0; i < 4; i++) {
      const r = step(st, { event: "turn", kit: K, cls: cls("incorrect"), now: (i + 1) * 20_000, comp: st.comp });
      kinds.push(r.move.kind === "reteach" && r.state.lastReteach?.turn === r.state.turn ? "engine" : r.move.kind);
      st = { ...r.state, activeItemId: "i3", hintLevel: 0 };
    }
    assert.equal(kinds[0], "engine");
    assert.ok(kinds.slice(1, 1 + RETEACH_COOLDOWN).every((k) => k !== "engine"), kinds.join(","));
  });

  test("cache: a commit keeps the online fold only when the inserts got the next seqs; otherwise the next read replays", async () => {
    const id = "00000000-0000-0000-0000-0000000000cc";
    const child = { id, class_level: 4 };
    const cache = new Map();
    const reads = [];
    const q = async (_t, params) => { reads.push(params[1]); return []; };
    await loadLive(child, { q, cache });
    const st = newLearnerState({ childId: id, classLevel: 4 });
    assert.equal(commitLive(child, 0, st, [1, 2], { cache }), true);
    await loadLive(child, { q, cache });
    assert.equal(reads.at(-1), 2, "reads only rows after the cached seq");
    assert.equal(commitLive(child, 2, st, [5], { cache }), false, "another writer took seq 3-4: evicted");
    await loadLive(child, { q, cache });
    assert.equal(reads.at(-1), 0, "full replay after an interleaved writer");
    evictLive(id, cache);
  });
});
