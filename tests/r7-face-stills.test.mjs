// Round 7 face-stills-and-character-record: Asha's stills are rendered from each look's live rig, ledgered for the art
// loaders, and her record (pronouns, stills) lives in shared/tutors.js.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { TUTORS, tutorById } from "../shared/tutors.js";

const ix = JSON.parse(readFileSync(new URL("../public/assets/teacher/asha-stills/1/index.json", import.meta.url), "utf8"));
const file = (url) => new URL(`../public${url}`, import.meta.url);

test("Asha's record carries her pronouns and the stills per look", () => {
  const a = tutorById("asha");
  assert.deepEqual(a.pronouns, { subject: "she", object: "her", possessive: "her" });
  assert.deepEqual(a.stills.looks, ["r8", "lamp2"]);
  for (const p of ["portrait", "resting", "smile", "listening", "thinking"]) assert.ok(a.stills.poses.includes(p), p);
  for (const p of ["wave", "reading", "watering", "telescope"]) assert.ok(a.stills.standIn[p], `${p} has a stand-in`);
  for (const t of TUTORS.filter((t) => t.id !== "asha")) assert.equal(t.stills, undefined, `${t.id}: no rig stills`);
});

test("every record pose has a still for every look, a small WebP on disk, and a look-free alias", () => {
  const a = tutorById("asha");
  const want = [...a.stills.poses, ...Object.keys(a.stills.standIn)];
  for (const look of a.stills.looks) for (const pose of want) {
    const row = ix.assets.find((r) => r.id === `teacher/asha/${look}/${pose}`);
    assert.ok(row, `${look}/${pose} in the ledger`);
    assert.equal(row.alias, `teacher/asha/${pose}`);
    assert.equal(row.look, look);
    assert.match(row.url, /^\/assets\/teacher\/asha-stills\/\d+\/[a-z0-9]+-[a-z]+\.webp$/, "public/assets/teacher/<name>/<rev>/<file> (assets/gen is dropped from builds)");
    assert.ok(existsSync(file(row.url)), row.url);
    assert.ok(statSync(file(row.url)).size < 40_000, `${row.url} under the spot budget`);
  }
});

test("the record's still ids are look-free (teacher/<id>/<pose>); the loader maps them per look (App patch 001)", () => {
  const rec = readFileSync(new URL("../src/ui/teacher/useTeacher.ts", import.meta.url), "utf8");
  assert.match(rec, /const still = \(pose: string\) => `teacher\/\$\{t\.id\}\/\$\{pose\}`;/);
  assert.match(rec, /pronouns: t\.pronouns \?\? pronounsFor\(t\.look\.presentedGender\)/);
  for (const k of ["portrait", "wave", "resting", "reading", "watering", "telescope", "smile", "listening", "thinking", "curious", "proud"]) assert.match(rec, new RegExp(`${k}: still\\("${k}"\\)`));
  // (the App's ledger wiring has landed; it was a patch file at docs/patches/to-app/001, now asserted on the code)
  const art = readFileSync(new URL("../src/child/art.tsx", import.meta.url), "utf8");
  assert.match(art, /\/assets\/teacher\/asha-stills\/1\/index\.json/);
  assert.match(art, /a\.alias && a\.look === look/);
});
