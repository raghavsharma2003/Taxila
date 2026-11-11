// Round 7 face-legacy-and-asset-cleanup: the bake-off candidates are out of the shipped image; the retired shims go by
// patch (Learning 002 first, then App 006).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const at = (p) => new URL(`../${p}`, import.meta.url);

test("the rejected bake-off candidates are not under public/ (never in dist), and their scripts point at art/", () => {
  assert.ok(!existsSync(at("public/assets/teacher-candidates")), "public/assets/teacher-candidates is gone");
  for (const c of ["c1", "c2", "c3", "c4"]) assert.ok(existsSync(at(`art/character/candidates-built/${c}`)), c);
  const walk = (d) => readdirSync(at(d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk("scripts/character/candidates")) assert.doesNotMatch(readFileSync(at(f), "utf8"), /teacher-candidates/, f);
});

test("the dev avatar page no longer mounts the retired TeacherStage shim; the onboarding page mounts Teacher directly and the shim files are gone", () => {
  assert.doesNotMatch(readFileSync(at("src/pages/AvatarDev.tsx"), "utf8"), /import \{ TeacherStage \}|<TeacherStage\b/);
  assert.match(readFileSync(at("src/onboarding/Setup.tsx"), "utf8"), /import \{ Teacher \} from "\.\.\/ui\/teacher\/Teacher\.tsx";/);
  for (const gone of ["src/ui/TeacherFace.tsx", "src/stage/TeacherStage.tsx"]) assert.equal(existsSync(at(gone)), false, `${gone} is retired`);
});
