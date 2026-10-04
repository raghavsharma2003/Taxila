// Merged teal (VERDICT.md step 2): the ONE-TIME creation record of this folder. It copies procedural-v3's build
// (expression stage, hair_v3, garments_v3, subdivided H face, viewer rig/shaders/presets) and adds ai-portrait-wrap's
// identity scripts (wrap, fit loop, projection, likeness) and stylised-premium's variants scorer, rewriting only paths
// by explicit string replacement. Every later change is a direct, commented edit in the merged files (each carries a
// "merged:" comment), so this script REFUSES to overwrite an existing file unless --force is given.
//   node scripts/character/bakeoff/merged/fork.mjs [--force]
import fs from "node:fs";
import path from "node:path";
const FORCE = process.argv.includes("--force");
const B = "scripts/character/bakeoff", DST = `${B}/merged`;
const REPL = [
  ["scripts/character/bakeoff/procedural-v3/", "scripts/character/bakeoff/merged/"],
  ["art/character/bakeoff/procedural-v3/", "art/character/bakeoff/merged/"],
  ["art/character/bakeoff-assets/procedural-v3/", "art/character/bakeoff-assets/merged/"],
  ["docs/design/teacher/bakeoff/procedural-v3/", "docs/design/teacher/bakeoff/merged/"],
  ['const A = "procedural-v3";', 'const A = "merged";'],
  ['"bakeoff-pv3"', '"bakeoff-merged"'],
  ["bakeoff-pv3", "bakeoff-merged"],
  // ai-portrait-wrap scripts: their own folders become the merged ones
  ["scripts/character/bakeoff/ai-portrait-wrap/fork/", "scripts/character/bakeoff/merged/"],
  ["scripts/character/bakeoff/ai-portrait-wrap", "scripts/character/bakeoff/merged"],
  ["art/character/bakeoff/ai-portrait-wrap", "art/character/bakeoff/merged"],
  ["art/character/bakeoff-assets/ai-portrait-wrap", "art/character/bakeoff-assets/merged"],
  ["/tmp/claude-0/char/bakeoff-sp/", "/tmp/claude-0/char/bakeoff-merged/"],
];
function copy(src, dst) {
  const out = path.join(DST, dst);
  if (fs.existsSync(out) && !FORCE) { console.log(`keep ${out} (exists)`); return; }
  let s = fs.readFileSync(path.join(B, src), "utf8");
  for (const [a, b] of REPL) s = s.split(a).join(b);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, s);
  console.log(`fork ${B}/${src} -> ${out}`);
}
const V3 = "procedural-v3";
for (const f of ["build.mjs", "finish.mjs", "g9.mjs", "contact.py", "measure.mjs", "emotion-check.mjs", "plates.py",
  "runtime-json.mjs", "harness.mjs", "render.mjs"]) copy(`${V3}/${f}`, f);
for (const f of ["parts.py", "export_tier.py", "garments_v3.py", "texture.py", "skin_v3.py", "build_look.py", "subdiv.py",
  "seal.py", "hair_v3.py", "keys.py"]) copy(`${V3}/blender/${f}`, `blender/${f}`);
for (const f of ["presets.js", "index.html", "rig.js", "shaders.js", "main.js"]) copy(`${V3}/viewer/${f}`, `viewer/${f}`);
const APW = "ai-portrait-wrap";
for (const f of ["wrap.py", "fitloop.py", "project.py", "shoot.mjs", "likeness.py", "landmarks.py", "corr.py", "recon.py", "gen-refs.mjs"])
  copy(`${APW}/${f}`, `identity/${f}`);
copy("stylised-premium/variants.mjs", "variants.mjs");
