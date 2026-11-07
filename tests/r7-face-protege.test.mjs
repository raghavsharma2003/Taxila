// Round 7 face-teachback-protege-staging: the young band's teach-back protégé beside her, its moods, and her glances.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";

test("shipped sprites: three creatures x three moods, small WebP under the versioned teacher assets", () => {
  for (const k of ["cloud-pup", "pebble-friend", "sprout-sprite"]) for (const m of ["", "-happy", "-puzzled"]) {
    const f = new URL(`../public/assets/teacher/protege/1/${k}${m}.webp`, import.meta.url);
    assert.ok(existsSync(f), `${k}${m}`);
    assert.ok(statSync(f).size < 20_000, `${k}${m} under 20 KB`);
  }
  assert.ok(existsSync(new URL("../public/assets/teacher/protege/1/provenance.json", import.meta.url)), "provenance travels with the art");
});

test("staging rule and moods", () => {
  const src = readFileSync(new URL("../src/ui/teacher/Protege.tsx", import.meta.url), "utf8");
  assert.match(src, /m\.phase === "teachback" && m\.family === "young"/, "only the young family's teach-back");
  assert.match(src, /answer\.verdict === "correct" \? "happy" : "puzzled"/, "never a sad mood");
  assert.match(src, /target: "protege"/);
});

test("faceCues knows the protégé target; Teacher glances only while she listens or speaks; App patch 005", async () => {
  const F = await import("../src/avatar/faceCues.ts");
  assert.deepEqual(F.GAZE_SELECTOR.protege, ["[data-protege]"]);
  assert.ok(F.GAZE_HOLD_MS.protege > 0);
  const t = readFileSync(new URL("../src/ui/teacher/Teacher.tsx", import.meta.url), "utf8");
  assert.match(t, /glance=\{p\.floor === "listening" \|\| p\.floor === "speaking" \|\| p\.floor === "your_turn"\}/);
  const patch = readFileSync(new URL("../docs/patches/to-app/005-face-teachback-protege.patch", import.meta.url), "utf8");
  assert.match(patch, /protege=\{protegeStaging\(m\)\}/);
});
