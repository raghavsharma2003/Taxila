#!/usr/bin/env node
// ONE command regenerates every teacher look from licence-clean inputs:
//
//   node scripts/character/build.mjs                  # setup (idempotent) + all looks + render evidence + measure
//   node scripts/character/build.mjs --looks teal     # one look
//   node scripts/character/build.mjs --skip-render    # assets only
//   node scripts/character/build.mjs --setup-only
//
// Stages per look (CHARACTER-PIPELINE.md): build_look.py (base, identity, keys, parts, validation) -> texture.py
// (procedural maps) -> export_tier.py H + Bplus -> finish.mjs (KTX2 + meshopt, H/Bplus/Blite) -> render.mjs (evidence)
// -> measure.mjs (FPS + draws). Tools live outside the repo in $CHAR_HOME (default /tmp/claude-0/char): a Python venv
// with the bpy 4.2 wheel, the MPFB 2.0.17 extension + CC0 asset packs, @gltf-transform, and KTX-Software 4.4.0.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const HOME = process.env.CHAR_HOME || "/tmp/claude-0/char";
const PY = path.join(HOME, "bpyenv/bin/python");
const TOOLS = path.join(HOME, "tools");
const BUILD = path.join(HOME, "build");
const LOOKS = (opt("--looks", "teal,slate,plum")).split(",");
process.env.CHAR_TOOLS = TOOLS;

const sh = (cmd, args, o = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, ...o });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} -> exit ${r.status}`);
};
const exists = (p) => fs.existsSync(p);

// ------------------------------------------------------------------ setup (idempotent; downloads are deleted after use)
function setup() {
  fs.mkdirSync(HOME, { recursive: true });
  const DL = path.join(HOME, "dl");
  fs.mkdirSync(DL, { recursive: true });
  if (!exists(PY)) {
    sh("python3", ["-m", "venv", path.join(HOME, "bpyenv")]);
    sh(path.join(HOME, "bpyenv/bin/pip"), ["install", "--quiet", "bpy==4.2.0", "numpy==1.26.4", "pillow", "scipy"]);
  }
  const ext = path.join(process.env.HOME, ".config/blender/4.2/extensions/user_default/mpfb");
  const MPFB = "https://extensions.blender.org/download/sha256:4f0a879d64a39bf646fbf5f53601ac678855da329d650617dca5737548239a87/add-on-mpfb-v2.0.17.zip";
  if (!exists(ext)) {
    sh("curl", ["-sSL", "-o", path.join(DL, "mpfb.zip"), MPFB]);
    fs.writeFileSync(path.join(DL, "inst.py"), `import bpy\nbpy.ops.extensions.package_install_files(filepath=${JSON.stringify(path.join(DL, "mpfb.zip"))}, repo='user_default', enable_on_install=True)\n`);
    sh(PY, [path.join(DL, "inst.py")]);
    fs.rmSync(path.join(DL, "mpfb.zip"));
  }
  const data = path.join(process.env.HOME, ".config/blender/4.2/extensions/.user/user_default/mpfb/data");
  const packs = {
    "targets/faceunits": "https://files.makehumancommunity.org/functional/faceunits01.zip",
    "targets/visemes": "https://files.makehumancommunity.org/functional/visemes02.zip",
    "teeth": "https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip",
    "eyebrows/mindfront_eyebrows_01": "https://files.makehumancommunity.org/asset_packs/eyebrows01/eyebrows01_cc0.zip",
    "eyelashes/mindfront_eyelashes_01": "https://files.makehumancommunity.org/asset_packs/eyelashes01/eyelashes01_cc0.zip",
  };
  fs.mkdirSync(data, { recursive: true });
  for (const [probe, url] of Object.entries(packs)) {
    if (exists(path.join(data, probe))) continue;
    const z = path.join(DL, path.basename(url));
    sh("curl", ["-sSL", "-o", z, url]);
    sh("unzip", ["-q", "-o", z, "-d", data]);
    fs.rmSync(z);
  }
  if (!exists(path.join(TOOLS, "node_modules/@gltf-transform/core"))) {
    fs.mkdirSync(TOOLS, { recursive: true });
    fs.writeFileSync(path.join(TOOLS, "package.json"), JSON.stringify({ name: "char-tools", private: true }));
    sh("npm", ["i", "--silent", "@gltf-transform/core@4", "@gltf-transform/extensions@4", "@gltf-transform/functions@4", "meshoptimizer"], { cwd: TOOLS });
  }
  if (!fs.readdirSync(TOOLS).some((d) => d.startsWith("KTX-Software"))) {
    const t = path.join(DL, "ktx.tar.bz2");
    sh("curl", ["-sSL", "-o", t, "https://github.com/KhronosGroup/KTX-Software/releases/download/v4.4.0/KTX-Software-4.4.0-Linux-x86_64.tar.bz2"]);
    sh("tar", ["xjf", t, "-C", TOOLS]);
    fs.rmSync(t);
  }
}

setup();
if (flag("--setup-only")) process.exit(0);
const t0 = Date.now();
const blend = (script, args) => sh(PY, [path.join(ROOT, "scripts/character/blender", script), ...args]);
for (const look of LOOKS) {
  const lj = path.join(ROOT, "art/character/looks", `${look}.json`);
  const bd = path.join(BUILD, look);
  if (!flag("--skip-assets")) {
    console.log(`\n=== ${look}: base + keys + parts`);
    blend("build_look.py", ["--look", lj, "--out", bd]);
    console.log(`=== ${look}: textures`);
    blend("texture.py", ["--look", lj, "--build", bd]);
    for (const tier of ["H", "Bplus"]) blend("export_tier.py", ["--look", lj, "--build", bd, "--tier", tier]);
    console.log(`=== ${look}: KTX2 + meshopt`);
    sh("node", [path.join(ROOT, "scripts/character/finish.mjs"), bd, look, path.join(ROOT, "public/assets/teacher", look)]);
    // keep the per-look report next to the sources (small, diffable): gates, counts, budgets
    const rep = JSON.parse(fs.readFileSync(path.join(bd, "report.json")));
    rep.tiers = JSON.parse(fs.readFileSync(path.join(bd, "finish.json")));
    for (const t of ["H", "Bplus"]) rep.tiers[t].raw = JSON.parse(fs.readFileSync(path.join(bd, `${t}.stats.json`)));
    fs.mkdirSync(path.join(ROOT, "art/character/reports"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, "art/character/reports", `${look}.json`), JSON.stringify(rep, null, 1));
  }
}
if (!flag("--skip-render")) {
  sh("node", [path.join(ROOT, "scripts/character/render.mjs"), "--looks", LOOKS.join(",")], { env: { ...process.env } });
  sh("node", [path.join(ROOT, "scripts/character/measure.mjs"), "--looks", LOOKS.join(",")], { env: { ...process.env } });
}
console.log(`\nall done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
