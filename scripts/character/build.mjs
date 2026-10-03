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
// G10 (reproducibility + licence evidence tied to a hash, review item 16): every download is sha256-pinned and every
// package version is exact. Hashes recorded 2026-10-03 from the URLs below; a mismatch stops the build.
const SHA256 = {
  "faceunits01.zip": "d113107bd7eb59f3af4df6fc0ec29bfcc593f496d0b336aec14f086a80ce7146",
  "visemes02.zip": "a69ab6fb95ddd5f56f70acc7e859f5f9c6ae613c527d577ea1571eff2183d29e",
  "makehuman_system_assets_cc0.zip": "b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107",
  "ktx.tar.bz2": "942f7dd615a9330f54544dc4857a44a91c85d461376b11ec43065c8f49b1e048",
  "mpfb.zip": "4f0a879d64a39bf646fbf5f53601ac678855da329d650617dca5737548239a87",
};
function verify(file) {
  const want = SHA256[path.basename(file)];
  const got = execFileSync("sha256sum", [file]).toString().split(" ")[0];
  if (want && got !== want) throw new Error(`sha256 mismatch for ${path.basename(file)}: ${got} != pinned ${want}`);
  console.log(`[setup] sha256 ok ${path.basename(file)}`);
}

// ------------------------------------------------------------------ setup (idempotent; downloads are deleted after use)
function setup() {
  fs.mkdirSync(HOME, { recursive: true });
  const DL = path.join(HOME, "dl");
  fs.mkdirSync(DL, { recursive: true });
  if (!exists(PY)) {
    sh("python3", ["-m", "venv", path.join(HOME, "bpyenv")]);
    sh(path.join(HOME, "bpyenv/bin/pip"), ["install", "--quiet", "bpy==4.2.0", "numpy==1.26.4", "pillow==12.3.0", "scipy==1.17.1"]);
  }
  const ext = path.join(process.env.HOME, ".config/blender/4.2/extensions/user_default/mpfb");
  const MPFB = "https://extensions.blender.org/download/sha256:4f0a879d64a39bf646fbf5f53601ac678855da329d650617dca5737548239a87/add-on-mpfb-v2.0.17.zip";
  if (!exists(ext)) {
    sh("curl", ["-sSL", "-o", path.join(DL, "mpfb.zip"), MPFB]);
    verify(path.join(DL, "mpfb.zip"));
    fs.writeFileSync(path.join(DL, "inst.py"), `import bpy\nbpy.ops.extensions.package_install_files(filepath=${JSON.stringify(path.join(DL, "mpfb.zip"))}, repo='user_default', enable_on_install=True)\n`);
    sh(PY, [path.join(DL, "inst.py")]);
    fs.rmSync(path.join(DL, "mpfb.zip"));
  }
  const data = path.join(process.env.HOME, ".config/blender/4.2/extensions/.user/user_default/mpfb/data");
  const packs = {
    "targets/faceunits": "https://files.makehumancommunity.org/functional/faceunits01.zip",
    "targets/visemes": "https://files.makehumancommunity.org/functional/visemes02.zip",
    "teeth": "https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip",
  };
  fs.mkdirSync(data, { recursive: true });
  for (const [probe, url] of Object.entries(packs)) {
    if (exists(path.join(data, probe))) continue;
    const z = path.join(DL, path.basename(url));
    sh("curl", ["-sSL", "-o", z, url]);
    verify(z);
    sh("unzip", ["-q", "-o", z, "-d", data]);
    fs.rmSync(z);
  }
  if (!exists(path.join(TOOLS, "node_modules/@gltf-transform/core"))) {
    fs.mkdirSync(TOOLS, { recursive: true });
    fs.writeFileSync(path.join(TOOLS, "package.json"), JSON.stringify({ name: "char-tools", private: true }));
    sh("npm", ["i", "--silent", "@gltf-transform/core@4.5.1", "@gltf-transform/extensions@4.5.1", "@gltf-transform/functions@4.5.1", "meshoptimizer@1.3.0"], { cwd: TOOLS });
  }
  if (!fs.readdirSync(TOOLS).some((d) => d.startsWith("KTX-Software"))) {
    const t = path.join(DL, "ktx.tar.bz2");
    sh("curl", ["-sSL", "-o", t, "https://github.com/KhronosGroup/KTX-Software/releases/download/v4.4.0/KTX-Software-4.4.0-Linux-x86_64.tar.bz2"]);
    verify(t);
    sh("tar", ["xjf", t, "-C", TOOLS]);
    fs.rmSync(t);
  }
}

setup();
if (flag("--setup-only")) process.exit(0);
const t0 = Date.now();

// Codex teacher references: if they are on the branch but no look declares it used them, fail loudly (review item 8).
// Read-only use: `git checkout origin/<branch> -- art/gen/teacher` puts them in the tree; looks then carry
// "references": {"used": true, "landmarks": "art/character/landmarks/<look>.json"}.
{
  const REF_BRANCH = process.env.TEACHER_REF_BRANCH || "claude/blissful-mayer-icwe2j";
  let refs = [];
  try {
    spawnSync("git", ["fetch", "-q", "origin", REF_BRANCH], { cwd: ROOT });
    refs = execFileSync("git", ["ls-tree", "-r", "--name-only", `origin/${REF_BRANCH}`, "--", "art/gen/teacher"], { cwd: ROOT }).toString().split("\n").filter(Boolean);
  } catch { /* offline: the check reports unknown */ }
  if (fs.existsSync(path.join(ROOT, "art/gen/teacher"))) refs = refs.concat(["(working tree) art/gen/teacher"]);
  const used = LOOKS.filter((l) => JSON.parse(fs.readFileSync(path.join(ROOT, "art/character/looks", `${l}.json`))).references?.used);
  console.log(`[build] Codex teacher references on ${REF_BRANCH}: ${refs.length} files; looks using them: ${used.join(",") || "none"}`);
  if (refs.length && used.length < LOOKS.length && !flag("--allow-unused-refs"))
    throw new Error(`Codex references are present (${refs.length} files) but ${LOOKS.filter((l) => !used.includes(l)).join(",")} do not use them: annotate landmarks and fit the sculpt block, or pass --allow-unused-refs`);
}
// --from build|texture|export|finish : resume a look's stages (e.g. after g9.mjs --solve only texture onward re-runs)
const ORDER = ["build", "texture", "export", "finish"];
const FROM = ORDER.indexOf(opt("--from", "build"));
const at = (st) => ORDER.indexOf(st) >= FROM;
const blend = (script, args) => sh(PY, [path.join(ROOT, "scripts/character/blender", script), ...args]);
for (const look of LOOKS) {
  const lj = path.join(ROOT, "art/character/looks", `${look}.json`);
  const bd = path.join(BUILD, look);
  if (!flag("--skip-assets")) {
    if (at("build")) { console.log(`\n=== ${look}: base + keys + parts`); blend("build_look.py", ["--look", lj, "--out", bd]); }
    if (at("texture")) { console.log(`=== ${look}: textures`); blend("texture.py", ["--look", lj, "--build", bd]); }
    if (at("export")) for (const tier of ["H", "Bplus"]) blend("export_tier.py", ["--look", lj, "--build", bd, "--tier", tier]);
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
if (flag("--solve-g9")) {
  // closed loop (review item 1): render -> measure rendered L*a*b* -> rescale skin.albedoGain -> re-bake from texture
  sh("node", [path.join(ROOT, "scripts/character/g9.mjs"), "--solve", "--looks", LOOKS.join(",")]);
  for (const look of LOOKS) {
    const lj = path.join(ROOT, "art/character/looks", `${look}.json`), bd = path.join(BUILD, look);
    blend("texture.py", ["--look", lj, "--build", bd]);
    sh("node", [path.join(ROOT, "scripts/character/finish.mjs"), bd, look, path.join(ROOT, "public/assets/teacher", look)]);
  }
}
if (!flag("--skip-render")) {
  // viseme timeline for the evidence clip (offline CTC forced alignment, build-time only; align.py)
  if (LOOKS.some((l) => !fs.existsSync(path.join(ROOT, "docs/design/teacher/renders/audio", `${l}.align.json`))))
    sh("python3", [path.join(ROOT, "scripts/character/align.py"), "--looks", LOOKS.join(",")]);
  sh("node", [path.join(ROOT, "scripts/character/render.mjs"), "--looks", LOOKS.join(",")], { env: { ...process.env } });
  sh("node", [path.join(ROOT, "scripts/character/measure.mjs"), "--looks", LOOKS.join(",")], { env: { ...process.env } });
}
for (const look of LOOKS) sh("node", [path.join(ROOT, "scripts/character/runtime-json.mjs"), path.join(BUILD, look), look]);
console.log(`\nall done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
