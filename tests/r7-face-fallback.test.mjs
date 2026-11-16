// Round 7 face-r8-fallback-swaps-person: Asha never swaps to another face. Under every look (r8 included) every fallback
// (pre-reveal failure, no WebGL2, timeout, the server's kill switch, the puppet switched off on the device) is the look's
// own rest still. TutorFace is reached only for a tutor the puppet is not (the parked Arjun) or the child's voice-only
// presentation (no face at all).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("PuppetFace has one fallback, her own still, and no TutorFace path", () => {
  const face = src("src/face-puppet/PuppetFace.tsx");
  assert.doesNotMatch(face, /<TutorFace\b/);
  assert.doesNotMatch(face, /"fallback"\s*\|/, "no fallback phase in the state type");
  assert.doesNotMatch(face, /holdsOwnStill/, "the look-dependent rule is gone");
  assert.match(face, /useState<"poster" \| "live" \| "held">/);
  // the still is painted for every look the host knows
  assert.match(face, /\{look && <img src=\{puppetPoster\(p\.framing \?\? "medium", look\)\}/);
});

test("LessonFace: TutorFace only for a non-puppet tutor or the voice-only presentation", () => {
  const lesson = src("src/face-puppet/LessonFace.tsx");
  const tf = [...lesson.matchAll(/return <TutorFace/g)];
  assert.equal(tf.length, 1, "exactly one TutorFace return");
  assert.match(lesson, /if \(!PUPPET_TUTORS\.has\(tutor\.id\) \|\| p\.tier === "E"\) return <TutorFace \{\.\.\.p\} \/>;/);
  assert.match(lesson, /still=\{off \|\| p\.tier === "D"\}/, "switched off or tier D: the still");
});

test("every live look ships both rest stills", async () => {
  const { PUPPET_LOOKS, HELD_LOOKS, puppetPoster } = await import("../src/face-puppet/assets.ts");
  for (const look of PUPPET_LOOKS.filter((l) => !HELD_LOOKS.includes(l))) {
    for (const f of ["medium", "close"]) {
      const url = puppetPoster(f, look);
      assert.ok(existsSync(new URL(`../public${url}`, import.meta.url)), `${look} ${f}: ${url}`);
    }
  }
});
