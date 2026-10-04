#!/usr/bin/env node
// gnm bake-off row (E-GNM1): the teal teacher on Google GNM Head v3.0 instead of the MPFB base, to the same runtime
// contract (CHARACTER-PIPELINE 4), rendered and judged with the merged run's renderer, presets and judges (fork.mjs).
//
//   node scripts/character/bakeoff/gnm/build.mjs [--fit] [--from corr|keys|assemble|texture|finish|render]
//        [--solve-g9] [--skip-render] [--skip-emotion] [--reps 12]
//
// Stages (Python = the apw venv with numpy/scipy/mediapipe, $MP_PY; tools from $CHAR_HOME as the other rows):
//   fit.py       GNM identity (170 head + 3 eyeball comps) fitted to the teal portraits: MediaPipe landmarks through the
//                XR Blocks correspondence + skin-silhouette terms on 5 views (cached: art/character/bakeoff/gnm/fit/teal.json)
//   shoot.mjs    MediaPipe landmarks on procedural-v3's GLB render, picked onto its surface (cached)
//   corr.py      v3 <-> GNM dense correspondence (RBF + non-rigid ICP, label-constrained inverse map)
//   keys.py      82 keys solved in GNM's 382-dim expression space against v3's key shapes (+ seal / lid-contact terms)
//   assemble.py  face = GNM skin + teeth + tongue + mouth sock; eyes / hair / cards / kurti from v3 carried onto GNM
//   write_glb    raw tier GLBs; texture.py: projected albedo + maps; finish.mjs: KTX2 + meshopt + budgets
//   render.mjs   the standard evidence set; measure.mjs fps + G9; gates.py G1-G6 + lids + garment; likeness.py; emotion-check
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const A = "gnm";
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../..");
const HERE = path.join(ROOT, "scripts/character/bakeoff", A);
const HOME = process.env.CHAR_HOME || "/tmp/claude-0/char";
const PY = process.env.MP_PY || "/tmp/claude-0/apw/venv/bin/python";
const MPM = process.env.MP_MODEL || "/tmp/claude-0/apw/face_landmarker.task";
process.env.CHAR_TOOLS ||= path.join(HOME, "tools");
// round 2: --look teal | slate | plum (teal's parts come from procedural-v3, slate / plum's from the main pipeline's
// iteration-2 build; every look's keys are solved against v3's teal key shapes, carried by its own correspondence)
const LOOK = opt("--look", "teal");
const BD = path.join(HOME, "bakeoff-gnm", LOOK);
const OUTA = path.join(ROOT, "public/assets/teacher-bakeoff", A, LOOK);
const REP = path.join(ROOT, "art/character/bakeoff", A, "reports");
const RENDERS = path.join(ROOT, "docs/design/teacher/bakeoff", A, "renders");
const sh = (cmd, args, o = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...o });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} -> exit ${r.status}`);
};
const py = (script, args = []) => sh(PY, [path.join(HERE, script), ...args, "--look", LOOK], { cwd: HERE });
const ORDER = ["corr", "keys", "assemble", "texture", "finish", "render"];
const FROM = ORDER.indexOf(opt("--from", "corr"));
const at = (st) => ORDER.indexOf(st) >= FROM;
const t0 = Date.now();
fs.mkdirSync(REP, { recursive: true });
fs.mkdirSync(BD, { recursive: true });

if (flag("--fit") || !fs.existsSync(path.join(ROOT, "art/character/bakeoff", A, `fit/${LOOK}.json`))) { console.log("=== fit"); py("fit.py"); }
if (LOOK !== "teal") for (const t of ["H", "Bplus"]) if (!fs.existsSync(path.join(HOME, "bakeoff-gnm", `${LOOK}-src`, t, "index.json")))
  sh("node", [path.join(HERE, "dump_glb.mjs"), path.join(HOME, "build", LOOK, `${t}.raw.glb`), path.join(HOME, "bakeoff-gnm", `${LOOK}-src`, t)]);
// procedural-v3's own raw GLBs (hair, cards, kurti, eyes, key shapes) and its landmark picks
for (const t of ["H", "Bplus"]) if (!fs.existsSync(path.join(HOME, "bakeoff-gnm/v3dump", t, "index.json")))
  sh("node", [path.join(HERE, "dump_glb.mjs"), path.join(HOME, "bakeoff-pv3/teal", `${t}.raw.glb`), path.join(HOME, "bakeoff-gnm/v3dump", t)]);
const V3S = path.join(HOME, "bakeoff-gnm/v3shots");
if (!fs.existsSync(path.join(V3S, "procedural-v3_pick.json"))) {
  sh("node", [path.join(HERE, "shoot.mjs"), "--row", "procedural-v3", "--yaws", "0,25,-25", "--out", V3S]);
  sh(PY, [path.join(ROOT, "scripts/character/bakeoff/merged/identity/landmarks.py"), "--model", MPM, "--out", path.join(V3S, "lm.json"),
    ...["0", "25", "-25"].map((y) => path.join(V3S, `procedural-v3_yaw${y}.png`))]);
  sh("node", [path.join(HERE, "shoot.mjs"), "--row", "procedural-v3", "--yaws", "0", "--out", V3S, "--pick", path.join(V3S, "lm.json")]);
}
// slate / plum: the PARTS field (hair, cards, glasses, garment) is built from the look's own iteration-2 source face, shot
// through its published H.glb (row "../teacher" = public/assets/teacher/<look>, read-only) and picked the same way
const SS = path.join(HOME, "bakeoff-gnm", `srcshots-${LOOK}`);
if (LOOK !== "teal" && !fs.existsSync(path.join(SS, "___teacher_pick.json"))) {
  const ys = ["0", "25", "-25"];
  sh("node", [path.join(HERE, "shoot.mjs"), "--look", LOOK, "--row", "../teacher", "--yaws", ys.join(","), "--out", SS]);
  sh(PY, [path.join(ROOT, "scripts/character/bakeoff/merged/identity/landmarks.py"), "--model", MPM, "--out", path.join(SS, "lm.json"),
    ...ys.map((y) => path.join(SS, `___teacher_yaw${y}.png`))]);
  sh("node", [path.join(HERE, "shoot.mjs"), "--look", LOOK, "--row", "../teacher", "--yaws", "0", "--out", SS, "--pick", path.join(SS, "lm.json")]);
}
if (at("corr")) { console.log("=== corr"); py("corr.py"); if (LOOK !== "teal") py("corr.py", ["--parts"]); }
if (at("keys")) { console.log("=== keys"); py("keys.py"); }
if (at("assemble")) {
  console.log("=== assemble");
  sh("node", [path.join(HERE, "dump_presets.mjs"), path.join(BD, "presets.json"), LOOK]);
  py("assemble.py");
  for (const t of ["H", "Bplus"]) sh("node", [path.join(HERE, "write_glb.mjs"), BD, t]);
}
if (at("texture")) { console.log("=== texture"); py("texture.py"); }
const finish = () => sh("node", [path.join(HERE, "finish.mjs"), BD, LOOK, OUTA]);
if (at("finish")) finish();
if (flag("--solve-g9")) {
  sh("node", [path.join(HERE, "g9.mjs"), "--solve", "--looks", LOOK]);
  py("texture.py");
  finish();
}
sh("node", [path.join(HERE, "runtime-json.mjs"), BD, LOOK]);
for (const t of ["H", "Bplus"]) py("gates.py", ["--tier", t]);
if (!flag("--skip-render") && at("render")) {
  sh("node", [path.join(HERE, "render.mjs"), "--looks", LOOK]);
  sh("node", [path.join(HERE, "measure.mjs"), "--looks", LOOK, "--out", path.join(RENDERS, LOOK === "teal" ? "measure.json" : `measure-${LOOK}.json`)]);
  sh("node", [path.join(HERE, "runtime-json.mjs"), BD, LOOK]);
  py("likeness.py");
}
const fails = [];
if (!flag("--skip-emotion") && !flag("--skip-render")) {
  const r = spawnSync("node", [path.join(HERE, "emotion-check.mjs"), "--looks", LOOK, "--reps", opt("--reps", "12"), "--judges", "A,C", "--gate", "70",
    "--out", path.join(RENDERS, LOOK === "teal" ? "emotion-check.json" : `emotion-check-${LOOK}.json`)],
    { stdio: "inherit", cwd: ROOT, env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  if (r.status !== 0) fails.push(`emotion legibility below 70% on more than one emotion (exit ${r.status})`);
}
// ------------------------------------------------------------------ gates (the merged build's bars, unchanged)
for (const t of ["H", "Bplus"]) {
  const G = JSON.parse(fs.readFileSync(path.join(REP, LOOK === "teal" ? `gates-${t}.json` : `gates-${LOOK}-${t}.json`)));
  if (G.G1_names.present !== G.G1_names.expected) fails.push(`${t} G1`);
  if (!G.G2_bounded_nonempty.ok) fails.push(`${t} G2 ${G.G2_bounded_nonempty.failed}`);
  if (!G.G3_pass) fails.push(`${t} G3 ${G.G3_mirror_mm} mm`);
  for (const [k, v] of Object.entries(G.G4_lid_seal_escaped_pct)) if (k !== "open" && (v.L > 0 || v.R > 0)) fails.push(`${t} G4 ${k}`);
  if (!G.G5_pass_mm) fails.push(`${t} G5 lip gap mm ${JSON.stringify(Object.fromEntries(Object.entries(G.G5).map(([k, v]) => [k, v.p95mm])))}`);
  if (!G.G5_pass_aperture) fails.push(`${t} G5 aperture`);
  if (!G.G6_pass) fails.push(`${t} G6 ${G.G6_fails}`);
  if (Object.values(G.lid_inside_eye_surface).some((v) => v > 0)) fails.push(`${t} lids inside the eye`);
  if (G.garmentPenetration.skinVertsThroughGarment > 0) fails.push(`${t} garment penetration ${G.garmentPenetration.skinVertsThroughGarment}`);
}
const T = JSON.parse(fs.readFileSync(path.join(BD, "finish.json")));
if (T.H.bytes > 6e6 || T.H.tris > 45000 || T.H.draws > 8) fails.push(`H budget ${T.H.bytes} B ${T.H.tris} tris ${T.H.draws} draws`);
for (const t of ["Bplus", "Blite"]) if (T[t].bytes > 2.2e6 || T[t].tris > 18000 || T[t].draws > 5) fails.push(`${t} budget ${T[t].bytes} B ${T[t].tris} tris ${T[t].draws} draws`);
const mf = path.join(RENDERS, LOOK === "teal" ? "measure.json" : `measure-${LOOK}.json`);
if (fs.existsSync(mf)) { const m = JSON.parse(fs.readFileSync(mf)); if (m.g9?.[LOOK] && !m.g9[LOOK].pass) fails.push(`G9 dL ${m.g9[LOOK].dL} dC ${m.g9[LOOK].dC}`); }
console.log(`\n${A}: ${((Date.now() - t0) / 60000).toFixed(1)} min; gates ${fails.length ? "FAILED:\n  " + fails.join("\n  ") : "all pass"}`);
fs.writeFileSync(path.join(REP, LOOK === "teal" ? "build-gates.json" : `build-gates-${LOOK}.json`), JSON.stringify({ date: new Date().toISOString(), fails }, null, 1));
if (fails.length) process.exit(2);
