// Tutor selection (avatar-m0): the shared cast manifest, eligibility and ordering (tutor-selection-ux §4, §6.3),
// the server's pick decision (server/routes/tutor.js), and the additive migration 008.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { TUTORS, bandOfClass, eligibleTutors, pickCovering, seedOf, seededShuffle, tutorById, defaultTutorFor, CHOICE } from "../shared/tutors.js";
import { decideChoice, eligibilityFor, hasSheet } from "../server/routes/tutor.js";
import { CHARACTERS, teacherFor } from "../server/compiler/characters/index.js";

const kid = (cls, id = "00000000-0000-4000-8000-000000000001") => ({ id, class_level: cls, teacher_id: defaultTutorFor({ class_level: cls }) });

test("cast: Asha live; Arjun and Uma parked (dc-r4-single-teacher-asha); every live tutor has a persona sheet; style notes ≤ 8 words with no friendship claim", () => {
  assert.deepEqual(TUTORS.map((t) => t.id), ["asha", "arjun", "uma"]);
  for (const t of TUTORS) {
    if (t.status === "live") assert.ok(hasSheet(t.id), `${t.id} is live but has no sheet`);
    for (const note of Object.values(t.styleNote)) {
      assert.ok(note.split(/\s+/).length <= 8, `${t.id}: "${note}"`);
      assert.ok(!/friend|dost|always|hamesha|miss you|love you|pyaar/i.test(note), `${t.id}: no friendship / companion register`);
    }
    assert.ok(t.look.mst >= 1 && t.look.mst <= 10);
  }
  assert.deepEqual(TUTORS.filter((t) => t.status === "live").map((t) => t.id), ["asha"]);
  assert.equal(tutorById("arjun").status, "parked", "kept in code for pinned lessons and the rollback");
  assert.equal(tutorById("uma").status, "parked");
  assert.ok(!hasSheet("uma"));
  assert.ok(TUTORS.filter((t) => t.look.mst >= 6).length * 2 >= TUTORS.length, "at least half the cast at MST ≥ 6");
});

test("eligibility (sheet ranges): Asha alone for every class → no picker", () => {
  for (let c = 1; c <= 9; c++) {
    const e = eligibleTutors(kid(c), { hasSheet });
    assert.equal(e.mode, "single", `class ${c}`);
    assert.deepEqual(e.tutors.map((t) => t.id), ["asha"]);
    assert.equal(e.tutors[0].id, teacherFor({ class_level: c }).id, "the offer matches the server's class default");
  }
});

test("eligibility: parked tutors never appear, not even in a draft-inclusive preview or the wide offer", () => {
  for (let c = 1; c <= 9; c++) for (const offer of ["sheet", "wide"]) {
    const e = eligibleTutors(kid(c), { includeDraft: true, offer });
    assert.deepEqual(e.tutors.map((t) => t.id), ["asha"], `class ${c} ${offer}`);
  }
});

// The picker rules stay generic (a restore is one status flip): exercised on a catalogue where two looks are live.
const TWO_LIVE = TUTORS.map((t) => (t.id === "arjun" ? { ...t, status: "live", fit: { ...t.fit, wideOfferClasses: [1, 9] } } : t));

test("eligibility (wide ranges, two live looks): option counts per band stay in range", () => {
  for (let c = 1; c <= 9; c++) {
    const e = eligibleTutors(kid(c), { catalogue: TWO_LIVE, hasSheet, offer: "wide", includeDraft: true });
    const [min, max] = CHOICE[bandOfClass(c)];
    if (e.mode === "picker") assert.ok(e.tutors.length >= min && e.tutors.length <= max, `class ${c}: ${e.tutors.length}`);
    assert.deepEqual(e.tutors.map((t) => t.id).sort(), ["arjun", "asha"]);
  }
  assert.equal(eligibleTutors(kid(1), { catalogue: TWO_LIVE, offer: "wide", allow: ["asha"] }).mode, "single", "a parent allow-list of one skips the picker");
});

test("order: stable per child, shuffled across children, no position bias (n = 4,000 ids, 2 tutors)", () => {
  const opts = { catalogue: TWO_LIVE, offer: "wide" };
  const a = eligibleTutors(kid(3, "a1b2"), opts).tutors.map((t) => t.id);
  assert.deepEqual(eligibleTutors(kid(3, "a1b2"), opts).tutors.map((t) => t.id), a, "same child, same order");
  let ashaFirst = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) if (eligibleTutors(kid(3, `child-${i}`), opts).tutors[0].id === "asha") ashaFirst++;
  const share = ashaFirst / N;
  assert.ok(Math.abs(share - 0.5) < 0.03, `asha first in ${(share * 100).toFixed(1)}% (expected ≈ 50%)`);
  assert.notEqual(seedOf("x"), seedOf("y"));
  assert.deepEqual([...seededShuffle([1, 2, 3, 4], 9)].sort(), [1, 2, 3, 4]);
});

test("pickCovering keeps ≥ 1 per presented gender when it must drop tutors", () => {
  const mk = (id, g, mst) => ({ id, look: { presentedGender: g, mst } });
  const pool = [mk("f1", "F", 4), mk("f2", "F", 5), mk("f3", "F", 7), mk("m1", "M", 3)];
  const two = pickCovering(pool, 2);
  assert.equal(two.length, 2);
  assert.ok(two.some((t) => t.look.presentedGender === "M") && two.some((t) => t.look.presentedGender === "F"));
});

test("decideChoice: unknown → 400, live lesson → 409, anyone but Asha → 403, a B1 switch needs the parent", () => {
  const c8 = kid(8), el8 = eligibilityFor(c8);
  assert.equal(decideChoice({ child: c8, tutorId: "zed", source: "child", live: false, eligibility: el8, chosenBefore: false }).status, 400);
  assert.equal(decideChoice({ child: c8, tutorId: "asha", source: "hack", live: false, eligibility: el8, chosenBefore: false }).status, 400);
  assert.equal(decideChoice({ child: c8, tutorId: "asha", source: "child", live: true, eligibility: el8, chosenBefore: false }).status, 409);
  assert.equal(decideChoice({ child: c8, tutorId: "uma", source: "child", live: false, eligibility: el8, chosenBefore: false }).status, 403, "parked refused");
  assert.equal(decideChoice({ child: c8, tutorId: "arjun", source: "child", live: false, eligibility: el8, chosenBefore: false }).status, 403, "parked refused");
  const ok = decideChoice({ child: c8, tutorId: "asha", source: "child_random", live: false, eligibility: el8, chosenBefore: false });
  assert.deepEqual([ok.ok, ok.needsParent], [true, false]);
  // a class 1-2 child whose parent had set Arjun before round 4: moving to Asha is a switch, and B1 switches ask a parent
  const c2 = { ...kid(2), teacher_id: "arjun" };
  assert.equal(decideChoice({ child: c2, tutorId: "asha", source: "child", live: false, eligibility: eligibilityFor(c2), chosenBefore: true }).needsParent, true, "B1 switch: ask a parent");
  assert.equal(decideChoice({ child: c2, tutorId: "asha", source: "child", live: false, eligibility: eligibilityFor(c2), chosenBefore: false }).needsParent, false, "the first pick is the child's own");
  const c6 = { ...kid(6), teacher_id: "arjun" };
  assert.equal(decideChoice({ child: c6, tutorId: "asha", source: "child", live: false, eligibility: eligibilityFor(c6), chosenBefore: true }).needsParent, false, "B3 switches are free");
});

test("the cast's server registry and the manifest agree (a character, its voice and its face are one unit)", () => {
  for (const id of Object.keys(CHARACTERS)) assert.ok(tutorById(id), `sheet ${id} has a face in shared/tutors.js`);
  for (const t of TUTORS.filter((x) => x.status === "live")) assert.ok(CHARACTERS[t.id].voice, `${t.id} has a voice`);
});

test("migration 008 is additive only", () => {
  const sql = readFileSync(new URL("../db/migrations/008_tutor_choice.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
  assert.ok(!/\bdrop\b|\btruncate\b|^\s*delete\b|alter\s+column|\brename\b/im.test(sql), "no destructive statement");
  assert.match(sql, /add column if not exists tutor_chosen_at/);
  assert.match(sql, /create table if not exists tutor_switch/);
  assert.ok(!/reason/i.test(sql), "no reason column, deliberately");
});
