// round3 truth (docs/design/round3/truth): the owned-path halves of the learning-loop fixes. Pure (no network, no DB).
//   - learner/live.js graderOf: a by-value number verdict (classifyFast source "number" / "number_selfcorrect") is a CODE
//     grade (it was folded as a model grade, dropped from θ and shown to parents as "AI-checked").
//   - comprehension/reteach.js directorReteachDecision / bookDirectorReteach: a re-teach the Director takes on its own path
//     is one decision record, booked exactly like engineReteach's (prod 2026-10-07: re-teach moves, 0 reteach_attempts rows).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { graderOf } from "../server/learner/live.js";
import { directorReteachDecision, bookDirectorReteach, directorMayReteach, reteachLogOn, reteachSessionInputs, selectReteach, armsFromKit } from "../server/comprehension/reteach.js";
import { reteachStmt } from "../server/comprehension/store.js";
import { kit } from "./fixtures/kit.mjs";

const K = kit();
const M = K.misconceptions[0];
const S2 = "c4-maths-ch05-t01-s2";

describe("round3 truth: learner and comprehension (owned paths)", () => {
  test("a number graded by value in code is a code grade; a model label stays llm", () => {
    assert.equal(graderOf({ source: "number" }), "code");
    assert.equal(graderOf({ source: "number_selfcorrect" }), "code");
    assert.equal(graderOf({ source: "exact" }), "code");
    assert.equal(graderOf({ source: "model" }), "llm");
    assert.equal(graderOf({ source: "number_hedge" }), "llm", "a hedge is no evidence (never an event); unchanged");
  });

  test("the kit's misconception re-teach is a decision record in selectReteach's shape", () => {
    const d = directorReteachDecision({ kind: "kit", skillId: S2, mis: M });
    const primary = armsFromKit(M).find((a) => a.primary);
    assert.deepEqual({ move: d.move, skillId: d.skillId, misId: d.misId, trigger: d.trigger, chosenBy: d.chosenBy, armId: d.armId, repClass: d.repClass },
      { move: "reteach", skillId: S2, misId: M.id, trigger: "misconception_seen", chosenBy: "kit_primary", armId: primary.id, repClass: primary.repClass });
    assert.equal(directorReteachDecision({ kind: "kit", skillId: S2, mis: { id: "m-x" } }), null, "no remediation, nothing to record");
    assert.equal(directorReteachDecision({ kind: "change_approach", skillId: S2 }), null, "the caller names the chooser");
    const w = directorReteachDecision({ kind: "change_approach", skillId: S2, chosenBy: "rule" });
    assert.deepEqual([w.trigger, w.chosenBy, w.armId, w.misId], ["wheel_spin", "rule", "gen:worked", null]);
  });

  test("the row a Director decision writes carries its own trigger and chooser (migration 023 widens both checks)", () => {
    const d = directorReteachDecision({ kind: "kit", skillId: S2, mis: M });
    const st = reteachStmt({ id: "child-1", legal_mode: "M1" }, "lesson-1", { ...d, turn: 3 });
    assert.match(st.text, /insert into reteach_attempts/);
    assert.deepEqual(st.params.slice(2, 9), [S2, M.id, d.armId, d.repClass, d.representation, "misconception_seen", "kit_primary"]);
  });

  test("booking: the arm is used and in flight, the re-check cooldown starts, lastReteach carries the row for this turn", () => {
    const s = { turn: 7, armsUsed: [], reteachCool: {}, lastArmBySkill: {}, failedArms: {} };
    const d = directorReteachDecision({ kind: "kit", skillId: S2, mis: M });
    bookDirectorReteach(s, d, 2);
    assert.deepEqual(s.armsUsed, [d.armId]);
    assert.equal(s.lastArmBySkill[S2], d.armId);
    assert.equal(s.reteachCool[S2], 2);
    assert.equal(s.lastReteach.turn, 7);
    assert.equal(s.lastReteach.trigger, "misconception_seen");
    // the engine's next decision on S2 counts the kit arm as tried (if its trigger still holds after the re-check)
    assert.deepEqual(reteachSessionInputs(s, S2, K).failedArmsThisSession, [d.armId]);
    // and selectReteach never picks it again this lesson: the first re-teach of a CONFIRMED misconception used to be this
    // same kit primary arm, so the child got the identical re-teach twice
    const pick = selectReteach({ trigger: "misconception_confirmed", skillId: S2, misId: M.id, kitArms: armsFromKit(M), lessonArmsUsed: s.armsUsed, seed: "1", pL: 0.3, now: new Date(0).toISOString() });
    assert.equal(pick.move, "reteach");
    assert.notEqual(pick.armId, d.armId);
    assert.equal(armsFromKit(M).length, 1, "fixture: a single-fix kit misconception");
  });

  test("an arm still in its re-check when a new re-teach pre-empts it is a failed arm; a finished re-check is not touched", () => {
    const d = directorReteachDecision({ kind: "kit", skillId: S2, mis: M });
    const live = { turn: 9, armsUsed: ["gen:story"], reteachCool: { [S2]: 1 }, lastArmBySkill: { [S2]: "gen:story" }, failedArms: {} };
    bookDirectorReteach(live, d, 2);
    assert.deepEqual(live.failedArms[S2], ["gen:story"]);
    assert.deepEqual(reteachSessionInputs(live, S2, K).failedArmsThisSession, ["gen:story", d.armId]);
    const done = { turn: 9, armsUsed: ["gen:story"], reteachCool: { [S2]: 0 }, lastArmBySkill: { [S2]: "gen:story" }, failedArms: {} };
    bookDirectorReteach(done, d, 2);
    assert.deepEqual(done.failedArms, {}, "cooldown over: the engine itself decides whether the arm failed");
  });

  test("the Director may not repeat an arm used this lesson, nor change approach inside a running re-check", () => {
    // found by logging (local run, patched: gen:story → gen:worked → gen:worked): the P21 change of approach fired on the turn
    // after the engine's own worked-example re-teach, inside its re-check
    assert.equal(directorMayReteach({ armsUsed: ["gen:worked"], reteachCool: {} }, "change_approach", S2), false, "gen:worked already used");
    assert.equal(directorMayReteach({ armsUsed: ["gen:story"], reteachCool: { [S2]: 1 } }, "change_approach", S2), false, "re-check running");
    assert.equal(directorMayReteach({ armsUsed: ["gen:story"], reteachCool: { [S2]: 0 } }, "change_approach", S2), true);
    const kitArm = directorReteachDecision({ kind: "kit", skillId: S2, mis: M }).armId;
    assert.equal(directorMayReteach({ armsUsed: [kitArm], reteachCool: {} }, "kit", S2, M), false, "the engine already used the kit's primary arm");
    assert.equal(directorMayReteach({ armsUsed: [], reteachCool: { [S2]: 2 } }, "kit", S2, M), true, "a misconception just shown may pre-empt a re-check");
    const saved = process.env.TAXILA_RETEACH_LOG;
    try { process.env.TAXILA_RETEACH_LOG = "off"; assert.equal(directorMayReteach({ armsUsed: ["gen:worked"] }, "change_approach", S2), true, "switch off: HEAD"); }
    finally { if (saved === undefined) delete process.env.TAXILA_RETEACH_LOG; else process.env.TAXILA_RETEACH_LOG = saved; }
  });

  test("the kill switch reads TAXILA_RETEACH_LOG (default on)", () => {
    assert.equal(reteachLogOn({}), true);
    assert.equal(reteachLogOn({ TAXILA_RETEACH_LOG: "on" }), true);
    for (const v of ["off", "0", "false", "NO"]) assert.equal(reteachLogOn({ TAXILA_RETEACH_LOG: v }), false);
  });
});
