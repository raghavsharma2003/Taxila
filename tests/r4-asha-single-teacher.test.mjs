// Round 4 stream 5 (BUILD-PLAN §3.5, Part A): ONE teacher, Asha, for every class 1-9 (dc-r4-single-teacher-asha).
//   - the server: teacherFor / the tutors route / the class's teacher serve Asha (Diya's voice) for every class, whatever
//     an older row stored; open lessons keep their pinned teacher; TAXILA_SINGLE_TEACHER=off is the rollback;
//   - her sheet carries a register per class band (notes and shapes only, never a line) with a class 5-9 protégé who is
//     not a baby elephant;
//   - the SCAN: no child, parent, onboarding or landing surface offers a teacher choice or names Arjun or Uma.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { CHARACTERS, SHEETS, characterForState, servesClass, sheetFor, singleTeacher, teacherCard, teacherFor, teacherForLesson } from "../server/compiler/characters/index.js";
import { decideChoice, eligibilityFor } from "../server/routes/tutor.js";
import { dhdVoiceFor } from "../server/voice/voices.js";
import { TUTORS, defaultTutorFor, eligibleTutors, tutorById } from "../shared/tutors.js";

const ROOT = new URL("..", import.meta.url).pathname;
const withFlag = (v, fn) => {
  const was = process.env.TAXILA_SINGLE_TEACHER;
  if (v === undefined) delete process.env.TAXILA_SINGLE_TEACHER; else process.env.TAXILA_SINGLE_TEACHER = v;
  try { return fn(); } finally { if (was === undefined) delete process.env.TAXILA_SINGLE_TEACHER; else process.env.TAXILA_SINGLE_TEACHER = was; }
};

test("every class 1-9 child's next lesson is Asha, in Diya's voice, whatever the row stored", () => withFlag(undefined, () => {
  assert.equal(singleTeacher(), true, "on by default");
  for (let cls = 1; cls <= 9; cls++) for (const saved of [null, "asha", "arjun", "uma", "nobody"]) {
    const t = teacherFor({ id: `c${cls}`, class_level: cls, teacher_id: saved, first_name: "Riya" });
    assert.equal(t.id, "asha", `class ${cls}, saved ${saved}`);
    assert.equal(t.name, "Asha");
    assert.deepEqual(t.pronouns, { subject: "she", object: "her", possessive: "her" });
    assert.equal(dhdVoiceFor(t.id, {}).dhd, "en-IN-Diya:DragonHDLatestNeural", "Diya's voice on the cascade");
    const card = teacherCard(t);
    assert.equal(card.id, "asha");
    assert.equal(card.role, "AI teacher");
  }
}));

test("the rollback: TAXILA_SINGLE_TEACHER=off restores the class default of before (Asha 1-4, Arjun 5-9)", () => {
  for (const v of ["off", "0", "false", "OFF"]) withFlag(v, () => {
    assert.equal(singleTeacher(), false, v);
    assert.equal(teacherFor({ id: "a", class_level: 3 }).id, "asha");
    assert.equal(teacherFor({ id: "b", class_level: 6 }).id, "arjun");
  });
  for (const v of ["on", "1", ""]) withFlag(v, () => assert.equal(singleTeacher(), true, `"${v}" keeps it on`));
});

test("open lessons keep their pinned teacher (no face or voice swap mid-lesson)", () => withFlag(undefined, () => {
  const kid = { id: "k", class_level: 7, teacher_id: "arjun" };
  const pinned = teacherForLesson(kid, "arjun", "Arjun");
  assert.equal(pinned.id, "arjun");
  assert.equal(pinned.voice, CHARACTERS.arjun.voice);
  assert.equal(characterForState({ ctx: { teacherId: "arjun", teacherName: "Arjun", classLevel: 7 } }).id, "arjun");
  // no pin (a lesson from before the pin existed): the child's teacher now
  assert.equal(teacherForLesson(kid, null).id, "asha");
}));

test("a stored name is honoured on the look it was given to, and never follows the child to another look", () => withFlag(undefined, () => {
  assert.equal(teacherFor({ id: "n1", class_level: 3, teacher_id: "asha", teacher_name: "Meenu", first_name: "Riya" }).name, "Meenu");
  assert.equal(teacherFor({ id: "n2", class_level: 2, teacher_id: null, teacher_name: "Meenu", first_name: "Riya" }).name, "Meenu",
    "a class 1-4 child with no saved id named the class default, which was Asha");
  assert.equal(teacherFor({ id: "n3", class_level: 6, teacher_id: "asha", teacher_name: "Meenu", first_name: "Riya" }).name, "Meenu");
  // a class 5-9 child who named Arjun (saved, or as the old class default) meets Asha under her own name
  assert.equal(teacherFor({ id: "n4", class_level: 6, teacher_id: "arjun", teacher_name: "Ravi", first_name: "Riya" }).name, "Asha");
  assert.equal(teacherFor({ id: "n5", class_level: 8, teacher_id: null, teacher_name: "Ravi", first_name: "Riya" }).name, "Asha");
}));

test("the tutors route: GET offers [asha] for every class; POST choose accepts only asha", () => withFlag(undefined, () => {
  for (let cls = 1; cls <= 9; cls++) {
    const child = { id: `11111111-1111-1111-1111-11111111111${cls}`, class_level: cls, teacher_id: cls > 4 ? "arjun" : "asha" };
    const el = eligibilityFor(child);
    assert.deepEqual(el.tutors.map((t) => t.id), ["asha"], `class ${cls}`);
    assert.equal(el.mode, "single", "one teacher: no picker");
    for (const other of ["arjun", "uma"]) {
      const d = decideChoice({ child, tutorId: other, source: "child", live: false, eligibility: el, chosenBefore: false });
      assert.deepEqual([d.ok, d.status], [false, 403], `${other} refused for class ${cls}`);
    }
    assert.equal(decideChoice({ child, tutorId: "asha", source: "child", live: false, eligibility: el, chosenBefore: false }).ok, true);
  }
  // even with the wide offer or a draft-inclusive preview, nothing parked is offered
  for (const offer of ["sheet", "wide"]) assert.deepEqual(eligibleTutors({ id: "c", class_level: 8 }, { offer, includeDraft: true }).tutors.map((t) => t.id), ["asha"]);
}));

test("the catalogue: Asha live for 1-9; Arjun and Uma parked; the default is hers for every class", () => {
  assert.deepEqual(TUTORS.filter((t) => t.status === "live").map((t) => t.id), ["asha"]);
  assert.equal(tutorById("arjun").status, "parked");
  assert.equal(tutorById("uma").status, "parked");
  assert.deepEqual(tutorById("asha").fit.offerClasses, [1, 9]);
  for (let cls = 1; cls <= 9; cls++) assert.equal(defaultTutorFor({ class_level: cls }), "asha");
  assert.equal(defaultTutorFor({ class_level: 6 }, { single: false }), "arjun", "the server's rollback rule");
  assert.equal(servesClass("arjun", 6), false);
  assert.equal(servesClass("asha", 9), true);
});

test("her sheet: classes [1, 9], a register per band, notes and shapes only, a class 5-9 protégé who is not a baby elephant", () => {
  const asha = CHARACTERS.asha;
  assert.deepEqual(asha.classes, [1, 9]);
  const young = sheetFor(asha, 3), older = sheetFor(asha, 7);
  assert.equal(young.protege.name, "Golu");
  assert.match(young.protege.what, /baby elephant/);
  assert.doesNotMatch(older.protege.what, /baby|elephant|animal/i);
  assert.match(older.protege.what, /student/);
  assert.ok(older.notes.some((n) => /^competence before warmth: diagnose what they tried/.test(n)), "Arjun's competence note carried over");
  assert.ok(older.notes.some((n) => /classes 5-9/.test(n)));
  assert.ok(young.notes.some((n) => /young Indian children/.test(n)));
  // identity, voice and pronouns never change with the band
  for (const k of ["id", "name", "addressedAs", "voice", "pronouns"]) assert.deepEqual(older[k], young[k], k);
  // classes 1-4 keep the sheet exactly as it was before round 4 (top level = the young band)
  assert.deepEqual(asha.notes, young.notes);
  // NOTES, never lines (recited-prompt): no quote marks, no first-person sentence she could read out, short
  for (const s of SHEETS) for (const n of s.notes) {
    assert.doesNotMatch(n, /["“”]|\b(I am|I'm|main hoon|मैं)\b/i, `${s.sheetBand}: ${n}`);
    assert.ok(n.length <= 130, `${s.sheetBand}: note too long: ${n}`);
  }
  // a class's band is chosen by the lesson's pinned class, and an old state's age band maps sensibly
  assert.equal(characterForState({ ctx: { teacherId: "asha", teacherName: "Asha", classLevel: 9 } }).protege.name, "Bittu");
  assert.equal(characterForState({ ctx: { teacherId: "asha", teacherName: "Asha", ageBand: "10-15" } }).protege.name, "Bittu");
  assert.equal(characterForState({ ctx: { teacherId: "asha", teacherName: "Asha", classLevel: 2 } }).protege.name, "Golu");
  assert.equal(teacherFor({ id: "p", class_level: 5 }).protege.name, "Bittu", "lesson start pins the band protégé (lesson.js ctx.protege)");
  assert.deepEqual(SHEETS.map((s) => s.sheetBand), ["asha:1-4", "asha:5-9", "arjun"]);
});

// ───────────── the scan: no surface offers a teacher choice or names Arjun or Uma ─────────────

/** Child, parent, onboarding and landing surfaces, plus everything that draws a teacher on them. Dev pages and design
 *  previews are not surfaces (never in a production build: src/app/routes.tsx DEV_ROUTES). */
const SURFACES = ["src/child", "src/parent", "src/onboarding", "src/app", "src/ui", "src/avatar", "src/face-puppet", "src/stage", "src/copy"];
const NOT_SURFACE = /(^|\/)dev\/|\.d\.ts$/;

function files(dir, out = []) {
  if (!existsSync(join(ROOT, dir))) return out;
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) files(rel, out);
    else if (/\.(tsx?|css|html)$/.test(name) && !NOT_SURFACE.test(rel)) out.push(rel);
  }
  return out;
}

/** Source with comments removed (a comment is a note to the next engineer, never something a child or parent sees). */
function code(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1").replace(/\{\s*\}/g, "");
}

test("SCAN: no child, parent, onboarding or landing surface offers a teacher choice or names Arjun or Uma", () => {
  const list = SURFACES.flatMap((d) => files(d));
  assert.ok(list.length > 150, `scanned ${list.length} files`);
  const hits = [];
  const rules = [
    [/\barjun\b/i, "names Arjun"],
    [/\buma\b/i, "names Uma"],
    [/\bchooseTutor\s*\(|\/api\/tutors\/choose/, "posts a teacher pick"],
    [/\bgetTutors\s*\(/, "reads the teacher offer"],
    [/\bTeacherChoice\b|\bTutorPicker\b|\bTeacherRoute\b/, "mounts a teacher picker"],
    [/<TeacherNamer\b/, "mounts the naming card"],
    [/choose-for-me|confirm-teacher|data-testid=["`{][^"`}]*choose-/, "a choose control"],
    [/(choose|pick|change|switch) (a |your |the )?teacher/i, "says choose/pick/change a teacher"],
    [/teachers your child can/i, "offers teachers"],
    [/name (your|the) teacher|give the teacher a name|names the teacher/i, "asks for a teacher name"],
  ];
  // the API helpers stay defined (a stale client, the rollback); only their call sites are banned
  const DEFINES = new Set(["src/child/api.ts"]);
  // the naming card itself is parked, not mounted (kept for the owner's one-line restore); its copy may say "name"
  const PARKED_NAMER = new Set(["src/child/teacher/TeacherNamer.tsx", "src/child/teacher/naming.ts"]);
  for (const f of list) {
    const src = code(readFileSync(join(ROOT, f), "utf8"));
    for (const [re, why] of rules) {
      if (DEFINES.has(f) && /chooseTutor|getTutors|tutors\/choose/.test(re.source)) continue;
      if (PARKED_NAMER.has(f) && why === "asks for a teacher name") continue;
      const m = src.match(re);
      if (m) hits.push(`${relative(ROOT, join(ROOT, f))}: ${why} (${JSON.stringify(m[0])})`);
    }
  }
  assert.deepEqual(hits, [], hits.join("\n"));
});

test("SCAN: the /teacher route renders her card only, and the onboarding step list has no pick step", () => {
  const routes = readFileSync(join(ROOT, "src/child/routes.tsx"), "utf8");
  assert.match(routes, /path: "teacher", element: s\(<TeacherScreen \/>\)/);
  const screen = code(readFileSync(join(ROOT, "src/child/screens/Teacher.tsx"), "utf8"));
  assert.doesNotMatch(screen, /<button|onClick|Sheet|TeacherNamer/, "Your teacher has nothing to press");
  const onb = code(readFileSync(join(ROOT, "src/onboarding/index.tsx"), "utf8"));
  assert.doesNotMatch(onb, /pick|choose|tutor/i);
  const hello = code(readFileSync(join(ROOT, "src/child/screens/Hello.tsx"), "utf8"));
  assert.doesNotMatch(hello, /"teacher"|"name"|TeacherNamer|getTutors/, "Hello has no teacher or naming card");
  for (const f of ["src/avatar/picker/TutorPicker.tsx", "src/avatar/picker/TeacherRoute.tsx"]) assert.ok(!existsSync(join(ROOT, f)), `${f} is gone`);
});
