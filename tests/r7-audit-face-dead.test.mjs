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

test("FACE-11: the patch for app's dead code applies (or is already applied)", () => {
  const cwd = new URL("..", import.meta.url);
  try { execSync("git apply --check docs/patches/to-app/008-face-dead-code.patch", { cwd, stdio: "pipe" }); } // not applied yet
  catch { execSync("git apply --check -R docs/patches/to-app/008-face-dead-code.patch", { cwd, stdio: "pipe" }); } // applied by app
  assert.match(src("docs/patches/to-app/008-face-dead-code.patch"), /getTutors[\s\S]*SITE_TUTORS|SITE_TUTORS[\s\S]*getTutors/);
});
