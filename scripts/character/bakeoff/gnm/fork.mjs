// gnm bake-off row (E-GNM1): the ONE-TIME creation record of the evidence tooling in this folder. It copies the merged
// run's renderer, measurement and judge scripts and its viewer (rig.js, shaders.js, presets.js, main.js) AS THEY STOOD
// at fork time (2026-10-03 ~20:30 UTC), rewriting only paths by explicit string replacement, so the gnm row is rendered
// with the same renderer, stage light, presets and judges as the merged row. merged/** is never edited from here (another
// run owns it). Later changes are direct edits in the gnm files, each marked "gnm:". Refuses to overwrite unless --force.
//   node scripts/character/bakeoff/gnm/fork.mjs [--force]
import fs from "node:fs";
import path from "node:path";
const FORCE = process.argv.includes("--force");
const B = "scripts/character/bakeoff", SRC = `${B}/merged`, DST = `${B}/gnm`;
const REPL = [
  ["scripts/character/bakeoff/merged/", "scripts/character/bakeoff/gnm/"],
  ["art/character/bakeoff/merged/", "art/character/bakeoff/gnm/"],
  ["public/assets/teacher-bakeoff/merged/", "public/assets/teacher-bakeoff/gnm/"],
  ["docs/design/teacher/bakeoff/merged/", "docs/design/teacher/bakeoff/gnm/"],
  ['const A = "merged";', 'const A = "gnm";'],
  ["bakeoff-merged", "bakeoff-gnm"],
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
for (const f of ["finish.mjs", "g9.mjs", "contact.py", "measure.mjs", "emotion-check.mjs", "plates.py", "runtime-json.mjs",
  "harness.mjs", "render.mjs", "viewer/presets.js", "viewer/index.html", "viewer/rig.js", "viewer/shaders.js", "viewer/main.js"]) copy(f);
