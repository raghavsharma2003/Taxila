// Tutor selection (avatar-m0): the shared cast manifest, eligibility and ordering (tutor-selection-ux §4, §6.3),
// the server's pick decision (server/routes/tutor.js), and the additive migration 008.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { TUTORS, bandOfClass, eligibleTutors, pickCovering, seedOf, seededShuffle, tutorById, defaultTutorFor, CHOICE } from "../shared/tutors.js";
import { decideChoice, eligibilityFor, hasSheet } from "../server/routes/tutor.js";
import { CHARACTERS, teacherFor } from "../server/compiler/characters/index.js";

const kid = (cls, id = "00000000-0000-4000-8000-000000000001") => ({ id, class_level: cls, teacher_id: defaultTutorFor({ class_level: cls }) });

test("cast: Asha, Arjun, Uma; every live tutor has a persona sheet; style notes ≤ 8 words with no friendship claim", () => {
  assert.deepEqual(TUTORS.map((t) => t.id), ["asha", "arjun", "uma"]);
  for (const t of TUTORS) {
    if (t.status === "live") assert.ok(hasSheet(t.id), `${t.id} is live but has no sheet`);
    for (const note of Object.values(t.styleNote)) {
      assert.ok(note.split(/\s+/).length <= 8, `${t.id}: "${note}"`);
      assert.ok(!/friend|dost|always|hamesha|miss you|love you|pyaar/i.test(note), `${t.id}: no friendship / companion register`);
    }
    assert.ok(t.look.mst >= 1 && t.look.mst <= 10);
  }
  assert.equal(tutorById("uma").status, "draft", "uma has no sheet and no probed voice yet");
  assert.ok(!hasSheet("uma"));
  assert.ok(TUTORS.filter((t) => t.look.mst >= 6).length * 2 >= TUTORS.length, "at least half the cast at MST ≥ 6");
});

test("eligibility (sheet ranges): one live tutor per class today → no fake one-tile picker", () => {
  for (let c = 1; c <= 9; c++) {
    const e = eligibleTutors(kid(c), { hasSheet });
    assert.equal(e.mode, "single", `class ${c}`);
    assert.equal(e.tutors[0].id, c <= 4 ? "asha" : "arjun");
    assert.equal(e.tutors[0].id, teacherFor({ class_level: c }).id, "the offer matches the server's class default");
  }
});

test("eligibility: Uma appears for classes 7-9 once she has a sheet (drafts included in preview)", () => {
  for (const c of [7, 8, 9]) {
    const e = eligibleTutors(kid(c), { includeDraft: true });
    assert.equal(e.mode, "picker");
    assert.deepEqual(e.tutors.map((t) => t.id).sort(), ["arjun", "uma"]);
  }
  assert.ok(!eligibleTutors(kid(6), { includeDraft: true }).tutors.some((t) => t.id === "uma"));
});

test("eligibility (wide ranges): class 1-6 get Asha + Arjun; option counts per band stay in range", () => {
  for (let c = 1; c <= 9; c++) {
    const e = eligibleTutors(kid(c), { hasSheet, offer: "wide", includeDraft: true });
    const [min, max] = CHOICE[bandOfClass(c)];
    if (e.mode === "picker") assert.ok(e.tutors.length >= min && e.tutors.length <= max, `class ${c}: ${e.tutors.length}`);
    if (c <= 6) assert.deepEqual(e.tutors.map((t) => t.id).sort(), ["arjun", "asha"]);
  }
  assert.equal(eligibleTutors(kid(1), { offer: "wide", allow: ["asha"] }).mode, "single", "a parent allow-list of one skips the picker");
});

test("order: stable per child, shuffled across children, no position bias (n = 4,000 ids, 2 tutors)", () => {
  const a = eligibleTutors(kid(3, "a1b2"), { offer: "wide" }).tutors.map((t) => t.id);
  assert.deepEqual(eligibleTutors(kid(3, "a1b2"), { offer: "wide" }).tutors.map((t) => t.id), a, "same child, same order");
  let ashaFirst = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) if (eligibleTutors(kid(3, `child-${i}`), { offer: "wide" }).tutors[0].id === "asha") ashaFirst++;
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

test("decideChoice: unknown → 400, live lesson → 409, not offered → 403, a B1 switch needs the parent", () => {
  const c8 = kid(8), el8 = eligibilityFor(c8);
  assert.equal(decideChoice({ child: c8, tutorId: "zed", source: "child", live: false, eligibility: el8, chosenBefore: false }).status, 400);
  assert.equal(decideChoice({ child: c8, tutorId: "arjun", source: "hack", live: false, eligibility: el8, chosenBefore: false }).status, 400);
  assert.equal(decideChoice({ child: c8, tutorId: "arjun", source: "child", live: true, eligibility: el8, chosenBefore: false }).status, 409);
  assert.equal(decideChoice({ child: c8, tutorId: "uma", source: "child", live: false, eligibility: el8, chosenBefore: false }).status, 403, "draft refused");
  assert.equal(decideChoice({ child: c8, tutorId: "asha", source: "child", live: false, eligibility: el8, chosenBefore: false }).status, 403, "outside her sheet's classes");
  const ok = decideChoice({ child: c8, tutorId: "arjun", source: "child_random", live: false, eligibility: el8, chosenBefore: false });
  assert.deepEqual([ok.ok, ok.needsParent], [true, false]);
  const c2 = { ...kid(2), teacher_id: "asha" };
  const wide2 = eligibleTutors(c2, { hasSheet, offer: "wide" });
  assert.equal(decideChoice({ child: c2, tutorId: "arjun", source: "child", live: false, eligibility: wide2, chosenBefore: true }).needsParent, true, "B1 switch: ask a parent");
  assert.equal(decideChoice({ child: c2, tutorId: "arjun", source: "child", live: false, eligibility: wide2, chosenBefore: false }).needsParent, false, "the first pick is the child's own");
  const c6 = { ...kid(6), teacher_id: "arjun" };
  assert.equal(decideChoice({ child: c6, tutorId: "asha", source: "child", live: false, eligibility: eligibleTutors(c6, { hasSheet, offer: "wide" }), chosenBefore: true }).needsParent, false, "B3 switches are free");
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
