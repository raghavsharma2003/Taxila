#!/usr/bin/env node
// Bakeoff ai-portrait-wrap, one look end to end (the order this session ran it in). Paid steps (Azure image + vision)
// are skipped when their outputs exist. Tools: $CHAR_HOME as in build.mjs (bpy venv, MPFB, packs, gltf-transform, KTX),
// plus a mediapipe venv at $APW_HOME/venv and the landmarker model at $APW_HOME/face_landmarker.task.
//   NODE_USE_ENV_PROXY=1 node scripts/character/bakeoff/ai-portrait-wrap/run.mjs [--look teal] [--from fit|build|render]
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const LOOK = opt("--look", "teal");
const FROM = ["refs", "fit", "build", "render"].indexOf(opt("--from", "refs"));
const CH = process.env.CHAR_HOME || "/tmp/claude-0/char", AP = process.env.APW_HOME || "/tmp/claude-0/apw";
const PY = `${CH}/bpyenv/bin/python`, MP = `${AP}/venv/bin/python`, MODEL = `${AP}/face_landmarker.task`;
const S = "scripts/character/bakeoff/ai-portrait-wrap", D = "art/character/bakeoff/ai-portrait-wrap";
const REF = `${D}/refs/${LOOK}`, BD = `${AP}/build/${LOOK}`, LJ = `${D}/looks/${LOOK}.json`;
const ASSETS = `art/character/bakeoff-assets/ai-portrait-wrap/${LOOK}`;
const env = { ...process.env, CHAR_TOOLS: `${CH}/tools` };
const sh = (cmd, args) => { console.log(`$ ${cmd} ${args.join(" ")}`); const r = spawnSync(cmd, args, { stdio: "inherit", env }); if (r.status) throw new Error(`${cmd} exit ${r.status}`); };
const stage = () => {
  sh(PY, [`${S}/fork/texture.py`, "--look", LJ, "--build", BD]);
  for (const t of ["H", "Bplus"]) sh(PY, ["scripts/character/blender/export_tier.py", "--look", LJ, "--build", BD, "--tier", t]);
  sh("node", [`${S}/fork/finish.mjs`, BD, LOOK, ASSETS]);
};
sh("node", [`${S}/fork.mjs`]);
if (FROM <= 0) {
  // 1. reference set (taxila-image = gpt-image-2): front from text, every other view an edit of the front
  if (!fs.existsSync(`${REF}/front.png`)) sh("node", [`${S}/gen-refs.mjs`, "--look", LOOK]);
  sh(MP, [`${S}/landmarks.py`, "--model", MODEL, "--out", `${REF}/landmarks.json`, ...fs.readdirSync(REF).filter((f) => f.endsWith(".png")).map((f) => `${REF}/${f}`)]);
  // 2. multi-view orthographic bundle adjustment of the 468 landmarks
  sh("python3", [`${S}/recon.py`, "--lm", `${REF}/landmarks.json`, "--regions", `${D}/mp_regions.json`, "--out", `${REF}/recon.json`]);
}
if (FROM <= 1) {
  // correspondence: MediaPipe on a neutral render of the CURRENT pipeline head -> (vid, barycentric) on our topology
  // (needs art/character/bakeoff-assets/ai-portrait-wrap/_base/H.glb = a copy of the pipeline's teal H, and its build)
  sh("node", [`${S}/shoot.mjs`, "--look", "_base", "--yaws", "0,20", "--out", `${AP}/corr`]);
  sh(MP, [`${S}/landmarks.py`, "--model", MODEL, "--out", `${AP}/corr/lm.json`, `${AP}/corr/_base_yaw0.png`, `${AP}/corr/_base_yaw20.png`]);
  sh("node", [`${S}/shoot.mjs`, "--look", "_base", "--yaws", "0", "--out", `${AP}/corr`, "--pick", `${AP}/corr/lm.json`]);
  sh(PY, [`${S}/corr.py`, "--blend", `${CH}/build/teal/base.blend`, "--pick", `${AP}/corr/_base_pick.json`, "--out", `${D}/corr.json`]);
  // 3. wrap + closed-loop landmark fit (writes refs/<look>/fit_correction.json and fitloop.json)
  sh("python3", [`${S}/fitloop.py`, "--iters", "3"]);
}
if (FROM <= 2) {
  // 3-4. final build (wrap, resting lid, keys, proxies), projection textures, G9 solve, re-texture
  sh(PY, [`${S}/fork/build_look.py`, "--look", LJ, "--out", BD]);
  stage();
  sh("node", [`${S}/fork/g9.mjs`, "--solve", "--looks", LOOK]);
  stage();
}
// evidence with the pipeline's own renderer (forked paths only), gates, emotion self-check, runtime.json
sh("node", [`${S}/fork/render.mjs`, "--looks", LOOK]);
sh("node", [`${S}/fork/measure.mjs`, "--looks", LOOK]);
sh("node", ["scripts/character/emotion-check.mjs", "--looks", LOOK, "--reps", "6", "--root", `docs/design/teacher/bakeoff/ai-portrait-wrap/renders/{look}/emotions`, "--out", `docs/design/teacher/bakeoff/ai-portrait-wrap/renders/emotion-check.json`]);
sh("node", [`${S}/fork/runtime-json.mjs`, BD, LOOK]);
