// Audit FACE-11: the face-owned dead code is gone; the app-owned part travels as a patch that still applies.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("FACE-11: unused face files, props and exports are gone", () => {
  assert.equal(existsSync(new URL("../src/ui/teacher/useDelight.ts", import.meta.url)), false);
  const looks = src("src/avatar/looks.ts"), tf = src("src/avatar/TutorFace.tsx"), css = src("src/avatar/avatar.css");
  assert.doesNotMatch(looks, /prefetchLook|lookIds/);
  assert.doesNotMatch(tf, /faceRigFailed|voiceOnly|p\.gentle/);
  assert.doesNotMatch(css, /tx-picker|tx-tile-tutor/);
  assert.doesNotMatch(src("src/face-puppet/PuppetFace.tsx"), /p\.gentle/);
});

// The app-owned half of FACE-11 (getTutors, chooseTutor, TeacherPortrait, SITE_TUTORS) is deleted by the app audit with its own
// test; a gate test does not assert on a patch file (tests/gate-reads-no-docs.test.mjs). Patch status: docs/patches/INDEX.md.
