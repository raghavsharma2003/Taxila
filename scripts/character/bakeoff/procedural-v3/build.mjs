#!/usr/bin/env node
// procedural-v3 bake-off build: the scripted pipeline pushed to its limit (CHARACTER-PIPELINE §10), in its own folders.
//
//   node scripts/character/bakeoff/procedural-v3/build.mjs [--looks teal] [--from build|texture|export|finish]
//        [--skip-render] [--skip-emotion] [--solve-g9] [--reps 6]
//
// Stages per look: blender/build_look.py (base, identity, v3 expression shapes, garments_v3, hair_v3, H subdivision,
// validation) -> blender/texture.py (v3 skin micro-detail, strand atlas, garment maps) -> export_tier.py H + Bplus ->
// finish.mjs -> runtime-json.mjs -> render.mjs (the standard evidence set) -> measure.mjs (fps + G9) -> emotion-check.
// GATES (the build exits non-zero if any fails): G1 names, G2 bounded, G3 mirror <= 0.5 mm, G4 lid seal 0%, G5 lip gap
// p95 <= 0.3 mm + aperture 0 (sd0 AND the subdivided H face), garment penetration 0 on every pair, budgets (H <= 6 MB,
// <= 45k tris, <= 8 draws; B+ <= 2.2 MB, <= 18k tris, <= 5 draws), G9 skin in band, emotion legibility >= 70% per emotion.
// Tools: the main pipeline's $CHAR_HOME (bpy venv, MPFB, KTX, gltf-transform); build dirs under $CHAR_HOME/bakeoff-pv3.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const A = "procedural-v3";
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../..");
const HERE = path.join(ROOT, "scripts/character/bakeoff", A);
const HOME = process.env.CHAR_HOME || "/tmp/claude-0/char";
const PY = path.join(HOME, "bpyenv/bin/python");
process.env.CHAR_TOOLS ||= path.join(HOME, "tools");
const BUILD = path.join(HOME, "bakeoff-pv3");
const LOOKS = opt("--looks", "teal").split(",");
const OUTA = path.join(ROOT, "public/assets/teacher-bakeoff", A);
const REP = path.join(ROOT, "art/character/bakeoff", A, "reports");
const sh = (cmd, args, o = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...o });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} -> exit ${r.status}`);
};
const ORDER = ["build", "texture", "export", "finish"];
const FROM = ORDER.indexOf(opt("--from", "build"));
const at = (st) => ORDER.indexOf(st) >= FROM;
const blend = (script, args) => sh(PY, [path.join(HERE, "blender", script), ...args]);
const t0 = Date.now();
fs.mkdirSync(REP, { recursive: true });
for (const look of LOOKS) {
  const lj = path.join(ROOT, "art/character/bakeoff", A, "looks", `${look}.json`);
  const bd = path.join(BUILD, look);
  fs.mkdirSync(bd, { recursive: true });
  if (at("build")) { console.log(`\n=== ${look}: base + keys + parts`); blend("build_look.py", ["--look", lj, "--out", bd]); }
  if (at("texture")) { console.log(`=== ${look}: textures`); blend("texture.py", ["--look", lj, "--build", bd]); }
  if (at("export")) for (const tier of ["H", "Bplus"]) blend("export_tier.py", ["--look", lj, "--build", bd, "--tier", tier]);
  console.log(`=== ${look}: KTX2 + meshopt`);
  sh("node", [path.join(HERE, "finish.mjs"), bd, look, path.join(OUTA, look)]);
  const rep = JSON.parse(fs.readFileSync(path.join(bd, "report.json")));
  rep.tiers = JSON.parse(fs.readFileSync(path.join(bd, "finish.json")));
  for (const t of ["H", "Bplus"]) rep.tiers[t].raw = JSON.parse(fs.readFileSync(path.join(bd, `${t}.stats.json`)));
  fs.writeFileSync(path.join(REP, `${look}.json`), JSON.stringify(rep, null, 1));
}
if (flag("--solve-g9")) {
  sh("node", [path.join(HERE, "g9.mjs"), "--solve", "--looks", LOOKS.join(",")]);
  for (const look of LOOKS) {
    const lj = path.join(ROOT, "art/character/bakeoff", A, "looks", `${look}.json`), bd = path.join(BUILD, look);
    blend("texture.py", ["--look", lj, "--build", bd]);
    sh("node", [path.join(HERE, "finish.mjs"), bd, look, path.join(OUTA, look)]);
  }
}
for (const look of LOOKS) sh("node", [path.join(HERE, "runtime-json.mjs"), path.join(BUILD, look), look]);
if (!flag("--skip-render")) {
  sh("node", [path.join(HERE, "render.mjs"), "--looks", LOOKS.join(",")]);
  sh("node", [path.join(HERE, "measure.mjs"), "--looks", LOOKS.join(","), "--out", path.join(ROOT, "docs/design/teacher/bakeoff", A, "renders/measure.json")]);
  for (const look of LOOKS) sh("node", [path.join(HERE, "runtime-json.mjs"), path.join(BUILD, look), look]);  // plates now exist
}
// ------------------------------------------------------------------ gates
const fails = [];
if (!flag("--skip-emotion") && !flag("--skip-render")) {
  // emotion legibility gate (CHARACTER-PIPELINE §10.1): >= 70% per emotion, n >= 6 per emotion (looks x reps)
  const r = spawnSync("node", [path.join(HERE, "emotion-check.mjs"), "--looks", LOOKS.join(","), "--reps", opt("--reps", String(Math.max(2, Math.ceil(6 / LOOKS.length)))), "--gate", "70"],
    { stdio: "inherit", cwd: ROOT, env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  if (r.status !== 0) fails.push(`emotion legibility below 70% on at least one emotion (exit ${r.status})`);
}
for (const look of LOOKS) {
  const r = JSON.parse(fs.readFileSync(path.join(REP, `${look}.json`)));
  const G = r.gates;
  if (G.G1_names.present !== G.G1_names.expected) fails.push(`${look} G1`);
  if (!G.G2_bounded_nonempty.ok) fails.push(`${look} G2 ${G.G2_bounded_nonempty.failed}`);
  if (!G.G3_pass) fails.push(`${look} G3`);
  for (const [k, v] of Object.entries(G.G4_lid_seal_escaped_pct)) if (k !== "open" && (v.L > 0 || v.R > 0)) fails.push(`${look} G4 ${k}`);
  if (!G.G5_pass) fails.push(`${look} G5 sd0`);
  if (G.G5_H && !G.G5_H.pass) fails.push(`${look} G5 H (subdivided)`);
  const pen = r.garmentV3?.penetration || {};
  for (const [k, v] of Object.entries(pen)) if (v !== 0) fails.push(`${look} penetration ${k}=${v}`);
  const T = r.tiers;
  if (T.H.bytes > 6e6 || T.H.tris > 45000 || T.H.draws > 8) fails.push(`${look} H budget ${T.H.bytes} B ${T.H.tris} tris ${T.H.draws} draws`);
  for (const t of ["Bplus", "Blite"]) if (T[t].bytes > 2.2e6 || T[t].tris > 18000 || T[t].draws > 5) fails.push(`${look} ${t} budget ${T[t].bytes} B ${T[t].tris} tris ${T[t].draws} draws`);
}
const mf = path.join(ROOT, "docs/design/teacher/bakeoff", A, "renders/measure.json");
if (fs.existsSync(mf) && !flag("--skip-render")) {
  const m = JSON.parse(fs.readFileSync(mf));
  for (const look of LOOKS) if (m.g9?.[look] && !m.g9[look].pass) fails.push(`${look} G9 dL ${m.g9[look].dL} dC ${m.g9[look].dC}`);
}
console.log(`\n${A}: ${((Date.now() - t0) / 60000).toFixed(1)} min; gates ${fails.length ? "FAILED:\n  " + fails.join("\n  ") : "all pass"}`);
if (fails.length) process.exit(2);
