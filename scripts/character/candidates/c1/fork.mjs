// Candidate c1 (polished-teacher round, 2026-10-04): the ONE-TIME creation record of the evidence tooling in this
// folder. It copies the main pipeline's renderer, measurement, G9 and contact scripts and its viewer (rig.js,
// shaders.js, presets.js, main.js) AS THEY STOOD at fork time, rewriting only paths by explicit string replacement, so
// c1 is rendered with OUR renderer, stage light, presets and rig, exactly as the bake-off rows were. scripts/character/**
// is never edited from here. Later changes are direct edits in the c1 files, each marked "c1:". Refuses to overwrite
// unless --force.
//   node scripts/character/candidates/c1/fork.mjs [--force]
import fs from "node:fs";
import path from "node:path";
const FORCE = process.argv.includes("--force");
const SRC = "scripts/character", DST = "scripts/character/candidates/c1";
const REPL = [
  ["/scripts/character/viewer/index.html", "/scripts/character/candidates/c1/viewer/index.html"],
  ["/art/character/looks/${lookId}.json", "/art/character/candidates/c1/looks/${lookId}.json"],
  ["`art/character/looks/${look}.json`", "`art/character/candidates/c1/looks/${look}.json`"],
  ["/public/assets/teacher/${lookId}/", "/public/assets/teacher-candidates/${lookId}/"],
  ["\"public/assets/teacher\"", "\"public/assets/teacher-candidates\""],
  ["`public/assets/teacher/${look}/", "`public/assets/teacher-candidates/${look}/"],
  ["\"scripts/character/contact.py\"", "\"scripts/character/candidates/c1/contact.py\""],
  ["\"scripts/character/plates.py\"", "\"scripts/character/candidates/c1/plates.py\""],
  ["\"scripts/character/viewer/shaders.js\"", "\"scripts/character/candidates/c1/viewer/shaders.js\""],
  ["\"scripts/character/viewer/rig.js\"", "\"scripts/character/candidates/c1/viewer/rig.js\""],
  ["\"docs/design/teacher/renders\"", "\"docs/design/teacher/polished\""],
  ["art/character/reports/g9-solve.json", "art/character/candidates/c1/reports/g9-solve.json"],
];
function copy(f) {
  const out = path.join(DST, f);
  if (fs.existsSync(out) && !FORCE) { console.log(`keep ${out} (exists)`); return; }
  let s = fs.readFileSync(path.join(SRC, f), "utf8");
  for (const [a, b] of REPL) s = s.split(a).join(b);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, s);
  console.log(`fork ${SRC}/${f} -> ${out}`);
}
for (const f of ["finish.mjs", "g9.mjs", "contact.py", "measure.mjs", "plates.py", "runtime-json.mjs", "harness.mjs", "render.mjs",
  "viewer/presets.js", "viewer/index.html", "viewer/rig.js", "viewer/shaders.js", "viewer/main.js"]) copy(f);
