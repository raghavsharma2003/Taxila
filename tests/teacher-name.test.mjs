// The child names the teacher (context/decisions.md#child-names-teacher): the name predicate is code, the name flows
// through the persona and the openings, the lesson pins it, and the AI disclosure does not depend on it.
// No network and no database (the DB-backed route checks are tests/lesson-safety-naming-db.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTeacherName, effectiveTeacherName } from "../server/compiler/characters/naming.js";
import { CHARACTERS, characterForState, named, teacherCard, teacherFor, teacherForLesson } from "../server/compiler/characters/index.js";
import { normalizeTeacherName, teacherNameShape, teacherNameSuggestions, NAME_SUGGESTIONS } from "../shared/tutors.js";
import { decideName, NAME_SQL, CHOOSE_SQL } from "../server/routes/tutor.js";
import { initLessonState, step } from "../server/director/state.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { greet } from "../server/director/shapes.js";
import { FLOOR_HEADING } from "../server/compiler/floor.js";
import { kit, CTX, BRIEF } from "./fixtures/kit.mjs";
import { ALLOWED, ALLOWED_WIDE, REFUSED, ADVERSARIAL, ADVERSARIAL_FIGURES } from "../evals/teacher-names.data.mjs";
import { floorViolations } from "../server/director/safety.js";



test("name predicate: every ordinary name passes (0 false refusals on the corpus)", () => {
  const refused = ALLOWED.filter((n) => !checkTeacherName(n, { childFirstName: "Riya Sharma", characterId: "asha" }).ok);
  assert.deepEqual(refused, []);
  assert.ok(ALLOWED.length >= 150, `corpus ${ALLOWED.length}`);
});

test("name predicate: shape, own name, slurs, profanity, romance, companion, not-a-name and public figures are refused", () => {
  for (const [name, reason, detail] of REFUSED) {
    const r = checkTeacherName(name, { childFirstName: "Riya Sharma", characterId: "asha" });
    if (reason === null) { assert.ok(r.ok, `${name} normalises and passes`); continue; }
    assert.equal(r.ok, false, name);
    assert.equal(r.reason, reason, name);
    if (detail) assert.equal(r.detail, detail, name);
    // a gentle retry: suggestions, and never the typed name echoed back
    assert.ok(r.suggestions.length >= 2, name);
    assert.ok(!JSON.stringify(r).toLowerCase().includes(`"${name.toLowerCase()}"`) || name === "", `no echo: ${name}`);
  }
});

test("name predicate: the wide corpus passes too (glued-word matching never splits a real name)", () => {
  const ctx = { childFirstName: "Riya Sharma", characterId: "asha" };
  assert.deepEqual(ALLOWED_WIDE.filter((n) => !checkTeacherName(n, ctx).ok), []);
  assert.ok(ALLOWED_WIDE.length >= 300, `wide corpus ${ALLOWED_WIDE.length}`);
});

test("name predicate: the reviewer's adversarial corpus is refused (AI denial, glued and plural forms, Hindi abuse)", () => {
  const ctx = { childFirstName: "Riya Sharma", characterId: "asha" };
  const wrong = ADVERSARIAL.filter(([n, d]) => { const r = checkTeacherName(n, ctx); return r.ok || r.reason !== "not_allowed" || r.detail !== d; });
  assert.deepEqual(wrong, []);
  for (const n of ADVERSARIAL_FIGURES) assert.equal(checkTeacherName(n, ctx).reason, "public_figure", n);
});

test("name predicate: no name that passes makes her self-introduction an ai_denial floor break", () => {
  const ctx = { childFirstName: "Riya Sharma", characterId: "asha" };
  for (const n of [...ALLOWED, ...ALLOWED_WIDE]) {
    const name = checkTeacherName(n, ctx).name;
    assert.deepEqual(floorViolations(`Hi Riya! I am ${name}, your AI teacher.`).filter((f) => f === "ai_denial"), [], n);
  }
  for (const [n] of ADVERSARIAL.slice(0, 15)) assert.equal(checkTeacherName(n, ctx).detail, "not_a_name", n);
});

test("name predicate: normalisation and suggestions (the child's own name is never suggested)", () => {
  assert.equal(normalizeTeacherName("  miss   meenu "), "Miss Meenu");
  assert.equal(normalizeTeacherName("ANNE-marie"), "Anne-Marie");
  assert.equal(teacherNameShape("Miss Meenu"), null);
  assert.equal(teacherNameShape("Miss Meenu Rao Ji"), "length", "17 characters");
  assert.equal(teacherNameShape("Ms Meenu Rao Ji"), "charset", "four words: three separators");
  assert.deepEqual(NAME_SUGGESTIONS, ["Asha", "Arjun", "Uma"]);
  assert.deepEqual(teacherNameSuggestions("arjun", {}), ["Arjun", "Asha", "Uma"], "the look's own name first");
  assert.deepEqual(teacherNameSuggestions("asha", { childFirstName: "Uma" }), ["Asha", "Arjun"]);
  assert.deepEqual(checkTeacherName("Uma", { childFirstName: "Uma", characterId: "asha" }).suggestions, ["Asha", "Arjun"]);
});

test("the character under the child's name: name and addressedAs change; look, voice, pronouns and notes do not", () => {
  const a = named(CHARACTERS.asha, "Meenu");
  assert.equal(a.name, "Meenu");
  assert.equal(a.addressedAs, "Meenu didi");
  assert.equal(a.characterName, "Asha");
  assert.deepEqual(a.notes, CHARACTERS.asha.notes);
  assert.deepEqual(a.pronouns, CHARACTERS.asha.pronouns);
  assert.equal(named(CHARACTERS.arjun, "Rao Sir").addressedAs, "Rao Sir", "a titled name is said as given");
  assert.equal(named(CHARACTERS.asha, "Asha").addressedAs, "Asha didi");
  const child = { id: "c1", class_level: 3, teacher_id: "asha", first_name: "Riya", teacher_name: "Meenu" };
  const t = teacherFor(child);
  assert.equal(t.name, "Meenu");
  assert.equal(t.voice, process.env.TAXILA_VOICE_ASHA || CHARACTERS.asha.voice);
  const card = teacherCard(t);
  assert.equal(card.name, "Meenu");
  assert.equal(card.characterName, "Asha");
  assert.equal(card.role, "AI teacher");
  // a stored name that a later denylist entry refuses is retired on read (no data migration)
  assert.equal(effectiveTeacherName(CHARACTERS.asha, { ...child, teacher_name: "Jaanu" }), "Asha");
  assert.equal(teacherFor({ ...child, teacher_name: "Jaanu" }).name, "Asha");
});

test("the lesson pins the name: a rename after start never changes an open lesson's persona, summary or voice", () => {
  const child = { id: "c1", class_level: 3, teacher_id: "asha", first_name: "Riya", teacher_name: "Tara" }; // renamed AFTER the lesson began as Meenu
  const t = teacherForLesson(child, "asha", "Meenu");
  assert.equal(t.name, "Meenu");
  assert.equal(teacherForLesson(child, "asha", undefined).name, "Asha", "a lesson that predates the pin keeps the sheet's name");
  const K = kit();
  const s = initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, teacherName: "Meenu" }, seed: 3, now: 0 });
  const r = step(s, { event: "start", kit: K, now: 0 });
  const st = { ...r.state, brief: BRIEF, mode: "voice", kitVerified: true };
  assert.equal(characterForState(st).name, "Meenu");
  assert.match(instructionsFor(st, K), /WHO YOU ARE: Meenu — the child calls you Meenu didi/);
});

test("AI disclosure is unchanged whatever the name: the compiled prompt differs ONLY by the name", () => {
  const K = kit();
  for (const lane of ["voice", "text"]) {
    for (const ctx of [{ ...CTX }, { ...CTX, firstMeeting: false }, { ...CTX, lang: "english" }]) {
      const at = (teacherName) => {
        const s = initLessonState({ topicId: K.topicId, kit: K, ctx: { ...ctx, teacherName }, seed: 5, now: 0 });
        const r = step(s, { event: "start", kit: K, now: 0 });
        return instructionsFor({ ...r.state, brief: BRIEF, mode: lane, kitVerified: true }, K, lane);
      };
      const own = at("Asha"), mine = at("Meenu");
      assert.notEqual(own, mine);
      assert.equal(mine.split("Meenu").join("Asha"), own, `${lane}: only the name changes`);
      assert.ok(mine.includes(FLOOR_HEADING));
      // the floor section (from its heading up to the next section) is byte-identical
      const floorOf = (x) => x.slice(x.indexOf(FLOOR_HEADING), x.indexOf("\n\n", x.indexOf(FLOOR_HEADING) + FLOOR_HEADING.length) >>> 0);
      assert.equal(floorOf(mine), floorOf(own));
      if (ctx.firstMeeting) assert.match(mine, /Meenu, their AI teacher/);
    }
  }
});

test("a renamed teacher re-introduces herself under the new name as an AI teacher (greet shape, a note not a line)", () => {
  const g = greet({ firstName: "Riya", teacherName: "Meenu", firstMeeting: false, renamed: true, warmup: false, topicTitle: "Fractions" });
  assert.match(g, /answer to Meenu; say once you are still their AI teacher/);
  assert.doesNotMatch(greet({ firstName: "Riya", teacherName: "Asha", firstMeeting: false, warmup: false, topicTitle: "F" }), /new name/);
  // the longest legal name with the rename note still fits every lane's budget (compile throws rather than truncating)
  const K = kit();
  for (const lane of ["voice", "text"]) for (const lang of ["hinglish", "hindi", "english"]) for (const ageBand of ["6-9", "10-15"]) {
    const s = initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, lang, ageBand, teacherName: "Abcdefg Hijklmno", firstMeeting: false, renamed: true }, seed: 9, now: 0 });
    const r = step(s, { event: "start", kit: K, now: 0 });
    assert.doesNotThrow(() => instructionsFor({ ...r.state, brief: BRIEF, mode: lane, kitVerified: true }, K, lane), `${lane}/${lang}/${ageBand}`);
  }
});

test("the name route decides in code: refusal is a 422 with a reason and suggestions; the look's own name stores null", () => {
  // a class 6 row that still says "arjun" (the old class default): the teacher is Asha now (single teacher), so her name is the own name
  const child = { id: "c1", class_level: 6, teacher_id: "arjun", first_name: "Kabir" };
  assert.deepEqual(decideName({ child, name: "Rohan", source: "child" }), { ok: true, stored: "Rohan" });
  assert.deepEqual(decideName({ child, name: "asha", source: "child" }), { ok: true, stored: null }, "the look's own name is no rename");
  assert.deepEqual(decideName({ child, name: null, source: "parent" }), { ok: true, stored: null });
  const no = decideName({ child, name: "Kabir", source: "child" });
  assert.equal(no.ok, false);
  assert.equal(no.status, 422);
  assert.equal(no.reason, "own_name");
  assert.ok(no.suggestions.includes("Asha"));
  assert.equal(decideName({ child, name: "x".repeat(65), source: "child" }).status, 400);
  assert.equal(decideName({ child, name: "Rohan", source: "admin" }).status, 400);
  // one statement each: the child row and its history row land together; a switch resets the name (history 'switch')
  assert.match(NAME_SQL, /update child set teacher_name[\s\S]*insert into teacher_name_history/);
  assert.match(CHOOSE_SQL, /teacher_name = case when old\.teacher_id is distinct from \$2::text then null/);
  assert.match(CHOOSE_SQL, /'switch'/);
});
