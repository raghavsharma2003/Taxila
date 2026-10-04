// RELATIONAL-OS R0 (BUILD-PLAN W2-I #1): the pure bond fold. AT-U1 replay is byte-identical to the cache the writers keep
// (random event orders, after a forget), AT-U2 the stage never regresses over 10k random sequences, AT-U3 the address
// never regresses and a child's retraction applies at once, AT-U10 nothing in the bond reaches her by gap length.
import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, stageFor, stageRank, addressFold, teacherOwnedStance, replay, applyLessonEnd, emptyBond, canon, GATES } from "../server/relational/bond.js";

/** A seeded PRNG (mulberry32): the property tests are reproducible. */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** A random lesson's events (what one lesson end writes), ids from `id0`. */
function lessonEvents(r, id0, day, at) {
  const ev = [{ id: id0, dim: "session", body: { day }, at }];
  let id = id0 + 1;
  const to = STAGES[Math.floor(r() * 4)];
  ev.push({ id: id++, dim: "stage", body: { from: "meeting", to: to === "meeting" ? "first_sessions" : to }, at });
  if (r() < 0.3) ev.push({ id: id++, dim: "teacher_owned", body: { kind: ["unheard", "unfair", "teacher_error", "net_loss"][Math.floor(r() * 4)], owned: r() < 0.5 }, at });
  if (r() < 0.2) ev.push({ id: id++, dim: "address", body: r() < 0.7 ? { kind: "call_me", name: ["Ricky", "Anu", "Chintu"][Math.floor(r() * 3)] } : { kind: "call_me_retract" }, at });
  if (r() < 0.2) ev.push({ id: id++, dim: "milestone", body: { id: `first_unaided:s${Math.floor(r() * 3)}` }, at });
  if (r() < 0.1) ev.push({ id: id++, dim: "ritual", body: { ritual: "festival", day }, at });
  return ev;
}

test("AT-U1: the cache folded lesson by lesson equals replay(all events), byte for byte, over 300 random histories", () => {
  for (let seed = 1; seed <= 300; seed++) {
    const r = rng(seed);
    let row = emptyBond(), all = [], id = 1;
    const lessons = 1 + Math.floor(r() * 25);
    for (let l = 0; l < lessons; l++) {
      const day = `2026-${String(1 + Math.floor(l / 28)).padStart(2, "0")}-${String(1 + (l % 28)).padStart(2, "0")}`;
      const ev = lessonEvents(r, id, r() < 0.3 && l ? all.at(-1).body.day ?? day : day, `${day}T10:00:00.000Z`);
      // a repair of the open teacher-owned event at the next lesson's OPEN
      if (row.teacherOpen && r() < 0.5) ev.push({ id: ev.at(-1).id + 1, dim: "repair", body: { eventId: row.teacherOpen.eventId }, at: ev[0].at });
      id = ev.at(-1).id + 1;
      all = [...all, ...ev];
      row = applyLessonEnd(row, ev);
      assert.equal(JSON.stringify(canon(row)), JSON.stringify(canon(replay(all))), `seed ${seed} lesson ${l}`);
    }
    // replay is order-insensitive in its input (it sorts by id): a shuffled read gives the same row
    const shuffled = [...all].sort(() => r() - 0.5);
    assert.equal(JSON.stringify(canon(replay(shuffled))), JSON.stringify(canon(replay(all))));
  }
});

test("AT-U1: after a forget (a milestone or address event removed), the cache is rebuilt by replay and is consistent", () => {
  const at = "2026-10-04T10:00:00.000Z";
  const events = [
    { id: 1, dim: "session", body: { day: "2026-10-01" }, at }, { id: 2, dim: "stage", body: { from: "meeting", to: "first_sessions" }, at },
    { id: 3, dim: "address", body: { kind: "call_me", name: "Ricky" }, at }, { id: 4, dim: "milestone", body: { id: "explained_back:first" }, at },
  ];
  const before = replay(events);
  assert.equal(before.address.teacherCallsChild, "Ricky");
  const forgotten = replay(events.filter((e) => e.dim !== "address" && e.dim !== "milestone"));
  assert.equal(forgotten.address, null);
  assert.deepEqual(forgotten.milestones, []);
  assert.equal(forgotten.stage, "first_sessions", "a forget never moves the stage");
});

test("AT-U2: the stage never regresses — 10,000 random sequences of counts and stored stages", () => {
  const r = rng(42);
  for (let i = 0; i < 10_000; i++) {
    let stage = STAGES[Math.floor(r() * 4)];
    for (let j = 0; j < 6; j++) {
      const counts = { sessions: Math.floor(r() * 40), distinctDays: Math.floor(r() * 30), spanDays: Math.floor(r() * 120), retryAfterNotYetLessons: Math.floor(r() * 5),
        explainBackPasses: Math.floor(r() * 6), explainBackTopics: Math.floor(r() * 4), teacherOpen: r() < 0.3 };
      const next = stageFor(counts, stage);
      assert.ok(stageRank(next) >= stageRank(stage), `regressed ${stage} → ${next}`);
      stage = next;
    }
  }
  // and the event fold never lowers it either
  const at = "2026-10-04T10:00:00.000Z";
  const s = replay([{ id: 1, dim: "stage", body: { from: "meeting", to: "regular" }, at }, { id: 2, dim: "stage", body: { from: "regular", to: "first_sessions" }, at }]);
  assert.equal(s.stage, "regular");
});

test("stage gates: academic-record counts only; an open teacher-owned stance holds S2/S3", () => {
  assert.equal(stageFor({}, "meeting"), "meeting");
  assert.equal(stageFor({ sessions: 1 }), "first_sessions");
  const regular = { sessions: 5, distinctDays: 4, spanDays: 10, retryAfterNotYetLessons: 2 };
  assert.equal(stageFor(regular), "regular");
  assert.equal(stageFor({ ...regular, teacherOpen: true }), "first_sessions", "her unowned slip holds the bond");
  assert.equal(stageFor({ ...regular, retryAfterNotYetLessons: 1 }), "first_sessions", "safe-to-be-wrong is read from KT evidence");
  const long = { ...GATES.long_haul, distinctDays: 30 };
  assert.equal(stageFor(long), "long_haul");
  assert.equal(stageFor({ ...long, explainBackTopics: 1 }), "regular");
  // no usage key can move it: minutes, streaks, gaps and time of day are not inputs
  assert.equal(stageFor({ sessions: 1, minutes: 900, streak: 30, gapDays: 0, hour: 22 }), "first_sessions");
});

test("AT-U3: the address never regresses on its own; a child's retraction applies at once", () => {
  let a = addressFold(null, { kind: "call_me", name: "Ricky" });
  assert.equal(a.teacherCallsChild, "Ricky");
  for (const kind of ["rupture", "absence", "mode_change", "stage"]) a = addressFold(a, { kind });
  assert.equal(a.teacherCallsChild, "Ricky", "ruptures, absence and mode changes never touch it");
  a = addressFold(a, { kind: "call_me_retract" });
  assert.equal(a.teacherCallsChild, null, "retraction is immediate");
  assert.equal(addressFold(null, { kind: "call_me", name: "drop table x" }).teacherCallsChild, null, "only a plain short name lands");
  assert.equal(addressFold(null, { kind: "call_me", name: "<b>x</b>" }).teacherCallsChild, null);
});

test("teacher-owned stance: owned in the moment is not open; a repair closes it; it is a fact about HER act", () => {
  assert.equal(teacherOwnedStance([{ id: 1, dim: "teacher_owned", body: { kind: "unfair", owned: true } }]), null);
  const open = teacherOwnedStance([{ id: 7, dim: "teacher_owned", body: { kind: "unheard", owned: false } }]);
  assert.deepEqual(open, { eventId: "7", kind: "unheard", ackedAtOpen: false });
  assert.equal(teacherOwnedStance([{ id: 7, dim: "teacher_owned", body: { kind: "unheard" } }, { id: 9, dim: "repair", body: { eventId: "7" } }]), null);
});

test("AT-U10 / F10: the bond row carries no gap; replay of the same events on days 1, 7 and 40 apart differs only in the dates", () => {
  const mk = (gap) => replay([
    { id: 1, dim: "session", body: { day: "2026-10-01" }, at: "2026-10-01T10:00:00.000Z" },
    { id: 2, dim: "stage", body: { from: "meeting", to: "first_sessions" }, at: "2026-10-01T10:00:00.000Z" },
    { id: 3, dim: "session", body: { day: new Date(Date.UTC(2026, 9, 1 + gap)).toISOString().slice(0, 10) }, at: "2026-10-02T10:00:00.000Z" },
  ]);
  const strip = (b) => { const { lastDay, firstDay, stageSince, ...rest } = b; return rest; };
  assert.deepEqual(strip(mk(1)), strip(mk(7)));
  assert.deepEqual(strip(mk(7)), strip(mk(40)));
  for (const k of Object.keys(emptyBond())) assert.doesNotMatch(k, /gap|hour|minute|streak|time_of|absence|trust|mood|closeness/i, k);
});
