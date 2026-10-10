// round 4 (stream 4A; the owner first): TAXILA_SESSION_FIRST_FOR, an account cohort for the session-first start (the
// TAXILA_DUPLEX_LIVE_FOR form: a lower-case email or its sha256 hex). A guardian in it gets the session-first intake on the plain
// Start (purpose "lesson", no topic the child chose); every other account is byte-identical to before. Pure: no database.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { sessionStartCtx } from "../server/director/session/start.js";
import { sessionCohort, inSessionCohort } from "../server/director/session/flags.js";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX } from "./fixtures/kit.mjs";

const OWNER = { id: "g-owner", email: "Owner@Example.com" };
const OTHER = { id: "g-other", email: "parent@example.com" };
const CHILD = { id: "c1", class_level: 6, school_chapter: { maths: 7 } };
const base = { child: CHILD, plan: null, levelPathTopic: "c6-maths-ch07-t01", ledger: { skills: {} }, now: 0 };
const withEnv = (vars, fn) => {
  const was = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  try { for (const [k, v] of Object.entries(vars)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } return fn(); }
  finally { for (const [k, v] of Object.entries(was)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } }
};

describe("TAXILA_SESSION_FIRST_FOR", () => {
  test("the cohort reads a lower-case email or its sha256 hex", () => {
    const hex = createHash("sha256").update("owner@example.com").digest("hex");
    assert.equal(inSessionCohort(OWNER, sessionCohort({ TAXILA_SESSION_FIRST_FOR: "owner@example.com" })), true, "an email, any case");
    assert.equal(inSessionCohort(OWNER, sessionCohort({ TAXILA_SESSION_FIRST_FOR: ` ${hex} , someone@x.org` })), true, "a sha256 hex in a list");
    assert.equal(inSessionCohort(OTHER, sessionCohort({ TAXILA_SESSION_FIRST_FOR: "owner@example.com" })), false);
    assert.equal(inSessionCohort(OWNER, sessionCohort({})), false, "empty: nobody");
    assert.equal(inSessionCohort({ email: "" }, sessionCohort({ TAXILA_SESSION_FIRST_FOR: "owner@example.com" })), false);
  });

  test("a guardian in the cohort: the plain Start is a session start; a chosen topic, practice or an Ask never is", () => {
    withEnv({ TAXILA_SESSION_FIRST: undefined, TAXILA_SESSION_FIRST_FOR: "owner@example.com" }, () => {
      const plain = sessionStartCtx({ ...base, purpose: "lesson", guardian: OWNER, topicChosen: false });
      assert.ok(plain && plain.prior && Array.isArray(plain.subjects), "session ctx on the plain Start");
      assert.equal(sessionStartCtx({ ...base, purpose: "lesson", guardian: OWNER, topicChosen: true }), null, "a topic the child chose");
      assert.equal(sessionStartCtx({ ...base, purpose: "practice", guardian: OWNER }), null);
      assert.equal(sessionStartCtx({ ...base, purpose: "doubt", guardian: OWNER }), null);
      assert.ok(sessionStartCtx({ ...base, purpose: "session", guardian: OWNER }), "an explicit session start too");
    });
  });

  test("every other account is byte-identical to before (flag off, on and shadow; with and without the cohort set)", () => {
    for (const mode of [undefined, "off", "on", "shadow"]) for (const cohortEnv of [undefined, "owner@example.com"]) {
      withEnv({ TAXILA_SESSION_FIRST: mode, TAXILA_SESSION_FIRST_FOR: cohortEnv }, () => {
        for (const purpose of ["lesson", "practice", "doubt", "session"]) for (const topicChosen of [false, true]) {
          // before this change the call had no guardian and no topicChosen
          const before = sessionStartCtx({ ...base, purpose });
          const after = sessionStartCtx({ ...base, purpose, guardian: OTHER, topicChosen });
          assert.deepEqual(JSON.stringify(after), JSON.stringify(before), `mode ${mode} cohort ${cohortEnv} purpose ${purpose} chosen ${topicChosen}`);
        }
      });
    }
    // and the lesson the non-cohort start builds is the same state, byte for byte
    withEnv({ TAXILA_SESSION_FIRST: undefined, TAXILA_SESSION_FIRST_FOR: "owner@example.com" }, () => {
      const kit = kitFromFile(getTopic("c6-maths-ch07-t01"));
      const build = (session) => step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX, classLevel: 6, ...(session ? { session } : {}) }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
      const a = build(sessionStartCtx({ ...base, purpose: "lesson" }));
      const b = build(sessionStartCtx({ ...base, purpose: "lesson", guardian: OTHER, topicChosen: false }));
      assert.equal(JSON.stringify(b), JSON.stringify(a));
      assert.notEqual(a.move.kind, "intake", "today's start");
      const owner = build(sessionStartCtx({ ...base, purpose: "lesson", guardian: OWNER, topicChosen: false }));
      assert.equal(owner.move.kind, "intake", "the owner's plain Start opens the intake");
    });
  });
});
