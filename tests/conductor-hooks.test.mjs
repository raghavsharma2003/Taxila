// W1-D: the Conductor hooks (server/conductor/hooks.js) and the worker's test-clock plumbing (offsets.js) and ops
// detectors (ops.mjs). Pure: no database (the e2e is tests/prod/w1d-conductor.mjs on a Neon branch / prod).
import { test } from "node:test";
import assert from "node:assert/strict";
import { onLessonStart, onTurnCommit, onLessonEnd, onConsentChange, inlineEnabled } from "../server/conductor/hooks.js";
import { validateEvent, idemKeyFor } from "../server/conductor/events.js";
import { dueSql } from "../server/conductor/offsets.js";
import { canary, CANARY } from "../server/conductor/ops.mjs";

const child = { id: "7b0c5d3e-1111-4222-8333-444455556666", class_level: 5 };
const lessonId = "9b0c5d3e-1111-4222-8333-444455556666";
const NOW = Date.parse("2026-10-04T09:30:00Z");          // 15:00 IST, a Sunday
const body = (st) => JSON.parse(st.params[8]);

test("hooks: lesson start ingests app.opened (once per learning day) and lesson.started, last, via ingest_event", () => {
  const s = onLessonStart({ child, lessonId, topicId: "c5-maths-ch01-t01", purpose: "practice", mode: "cascade", now: NOW });
  assert.equal(s.length, 2);
  for (const st of s) {
    assert.match(st.text, /^select ingest_event\(/);
    assert.equal(st.params[0], child.id);
    validateEvent(body(st));                                // the catalogue accepts what the hook sends
    assert.equal(st.params[5], new Date(NOW).toISOString(), "occurredAt is the request's (possibly test-shifted) now");
  }
  assert.deepEqual(body(s[0]), { type: "app.opened", device: "web", replicaId: "lesson", bootId: "d2026-10-04" });
  assert.equal(s[0].params[4], "app.opened:lesson:d2026-10-04");
  assert.deepEqual(body(s[1]), { type: "lesson.started", lessonId, topicId: "c5-maths-ch01-t01", kind: "practice", lanes: ["cascade"] });
  assert.equal(s[1].params[4], `lesson.started:${lessonId}`);
  // purpose → kind and mode → lane
  const k = (purpose, mode) => body(onLessonStart({ child, lessonId, topicId: "t1", purpose, mode, now: NOW })[1]);
  assert.equal(k("lesson", "voice").kind, "live"); assert.deepEqual(k("lesson", "voice").lanes, ["realtime"]);
  assert.equal(k("doubt", "text").kind, "homework"); assert.deepEqual(k("doubt", "text").lanes, ["tap"]);
  // 03:00 IST belongs to the previous learning day (learningDay = local date of now − 4 h)
  assert.equal(body(onLessonStart({ child, lessonId, topicId: "t1", purpose: "lesson", mode: "text", now: Date.parse("2026-10-04T21:30:00Z") })[0]).bootId, "d2026-10-04");
});

test("hooks: a turn adds nothing (boundary facts only)", () => {
  assert.deepEqual(onTurnCommit({ child, lessonId, turn: 3, move: "probe", end: false, late: false, now: NOW }), []);
});

test("hooks: lesson end → lesson.ended with minutes from started_at and a reason from the trigger", () => {
  const [st] = onLessonEnd({ child, lessonId, topicId: "t1", endedBy: "client", turns: 6, startedAt: new Date(NOW - 7.5 * 60_000).toISOString(), now: NOW });
  const e = validateEvent(body(st));
  assert.deepEqual(e, { type: "lesson.ended", lessonId, reason: "completed", minutes: 7.5 });
  assert.equal(st.params[4], idemKeyFor(e));
  assert.equal(body(onLessonEnd({ child, lessonId, topicId: "t1", endedBy: "pagehide", turns: 1, startedAt: new Date(NOW).toISOString(), now: NOW })[0]).reason, "child_left");
  // a lesson with turns counts as active (minutes > 0) even when it took seconds; minutes are capped at 240
  assert.equal(body(onLessonEnd({ child, lessonId, topicId: "t1", endedBy: "client", turns: 2, startedAt: new Date(NOW - 2000), now: NOW })[0]).minutes, 0.1);
  assert.equal(body(onLessonEnd({ child, lessonId, topicId: "t1", endedBy: "client", turns: 2, startedAt: new Date(NOW - 9 * 3600_000), now: NOW })[0]).minutes, 240);
  assert.equal(body(onLessonEnd({ child, lessonId, topicId: "t1", endedBy: "client", turns: 0, startedAt: null, now: NOW })[0]).minutes, 0);
});

test("hooks: consent → one parent.consent_changed per Conductor purpose, a fresh version per write; guardian-wide → none", () => {
  const a = onConsentChange({ guardianId: "g", childId: child.id, grants: { core_tutoring: true, memory: false, not_a_purpose: true }, version: "v1", now: NOW });
  assert.equal(a.length, 2);
  for (const st of a) validateEvent(body(st));
  assert.deepEqual(a.map((st) => [body(st).purpose, body(st).granted]), [["core_tutoring", true], ["memory", false]]);
  const b = onConsentChange({ guardianId: "g", childId: child.id, grants: { memory: false }, version: "v1", now: NOW + 1 });
  assert.notEqual(body(a[1]).consentVersion, body(b[0]).consentVersion, "revoke → grant → revoke must not dedupe the second revoke");
  assert.deepEqual(onConsentChange({ guardianId: "g", childId: null, grants: { memory: true }, version: "v1", now: NOW }), []);
});

test("hooks: never throw; a refused event is dropped and the caller's write still lands", () => {
  assert.deepEqual(onLessonEnd({ child, lessonId: "not a valid id!", topicId: "t1", endedBy: "client", turns: 1, startedAt: null, now: NOW }), []);
  assert.equal(onLessonStart({ child, lessonId: "bad id", topicId: "t1", purpose: "lesson", mode: "text", now: NOW }).length, 1, "app.opened still lands");
  assert.deepEqual(onLessonEnd({ child: undefined, lessonId, topicId: "t1", endedBy: "client", turns: 1, startedAt: null, now: NOW }), []);
});

test("hooks: the inline step is off outside production unless CONDUCTOR_INLINE=on", () => {
  const was = { i: process.env.CONDUCTOR_INLINE, n: process.env.NODE_ENV };
  try {
    delete process.env.CONDUCTOR_INLINE; process.env.NODE_ENV = "test"; assert.equal(inlineEnabled(), false);
    process.env.NODE_ENV = "production"; assert.equal(inlineEnabled(), true);
    process.env.CONDUCTOR_INLINE = "off"; assert.equal(inlineEnabled(), false);
  } finally {
    if (was.i === undefined) delete process.env.CONDUCTOR_INLINE; else process.env.CONDUCTOR_INLINE = was.i;
    if (was.n === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = was.n;
  }
});

test("offsets: a job is due on its child's clock only when test_clock exists", () => {
  assert.equal(dueSql("j", false), "j.run_after <= now()");
  assert.match(dueSql("j", true), /run_after <= now\(\) \+ coalesce\(\(select make_interval\(secs => t\.offset_ms \/ 1000\.0\) from test_clock t/);
});

test("ops: the canary passes on zeros and names what failed", async () => {
  const fake = (vals) => async (text) => [{ n: vals[/child_seq/.test(text) ? 0 : /from wakeup/.test(text) ? 1 : /status = 'dead'/.test(text) ? 3 : 2] }];
  assert.equal((await canary(fake([0, 0, 0, 0]))).ok, true);
  const r = await canary(fake([2, 0, 0, CANARY.deadJobsDay + 1]));
  assert.equal(r.ok, false);
  assert.deepEqual(Object.entries(r.checks).filter(([, c]) => !c.ok).map(([k]) => k), ["dirty_stale", "jobs_dead_24h"]);
});
