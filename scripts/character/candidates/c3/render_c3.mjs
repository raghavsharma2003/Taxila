// c3 evidence renders (fork of c2/render_c2.mjs; same harness API, rig contract, presets, camera frames,
// light rig, SwiftShader): front + 3/4 portraits, 9 emotions, 7 owner states, viseme sweep (+ Hindi tongue keys),
// turntable, tiers, and a 6-second lip-sync clip of the bake-off's TTS sentence (teal voice "marin", first 6.0 s)
// driven by (a) the forced-aligned visemes on H's viseme morphs and (b) the real M0 LipDriver (RMS arm), both through
// the real src/avatar Behaviour + Compositor. Then the contact sheet.
//   node scripts/character/candidates/c3/render_c3.mjs [--only portraits,emotions,states,visemes,turntable,tiers,lipsync]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { openHarness } from "./harness.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const OUT = opt("--out", "docs/design/teacher/polished/c3");
const only = opt("--only", "portraits,emotions,states,visemes,turntable,tiers,lipsync").split(",");
const LOOK = "c3";
const CLIP_S = 6.0;
const SRC_AUDIO = "docs/design/teacher/renders/audio";
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args]);
const log = (m) => console.log(`[render-c3] ${m}`);
const dir = OUT;
for (const d of ["", "emotions", "states", "visemes", "turntable", "portraits", "audio"]) fs.mkdirSync(path.join(dir, d), { recursive: true });
const metaF = path.join(dir, "render.json");
const meta = fs.existsSync(metaF) ? JSON.parse(fs.readFileSync(metaF)) : { look: LOOK, frames: {} };

// ---------------- portraits (higher resolution, same frames and light)
if (only.includes("portraits")) {
  const hx = await openHarness({ w: 900, h: 1125 });
  try {
    meta.load = await hx.page.evaluate(() => TX.load("c3", "H"));
    meta.renderer = await hx.page.evaluate(() => TX.measure(1, false).gpu);
    const P = [["front_bust", "bust", 0, "idle"], ["q3_bust", "bust", 35, "idle"], ["front_face", "face", 0, null], ["q3_face", "face", 35, null],
      ["front_warm", "face", 0, "warm"], ["profile", "bust", 90, null]];
    for (const [n, fr, yaw, st] of P) {
      await hx.page.evaluate(([fr, yaw, st]) => { TX.frame(fr, yaw); TX.pose(st === "idle" ? TX.state("idle") : st ? TX.emotion(st, 1) : {}); TX.render(); }, [fr, yaw, st]);
      await hx.shot(path.join(dir, "portraits", `${n}.png`));
    }
    log("portraits");
  } finally { if (hx.errors.length) console.log(hx.errors.slice(0, 5).join("\n")); await hx.close(); }
}

// ---------------- stills at 600 x 750 (H), as the bake-off
{
  const hx = await openHarness({ w: 600, h: 750 });
  const P = hx.page;
  try {
    await P.evaluate(() => TX.load("c3", "H"));
    const still = async (file, fn, arg) => { await P.evaluate(fn, arg); await hx.shot(file); };
    if (only.includes("turntable")) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "c3tt-"));
      for (let i = 0; i < 36; i++) {
        const yaw = i * 10;
        await still(path.join(tmp, `${String(i).padStart(3, "0")}.png`), (y) => { TX.frame("bust", y); TX.pose(TX.state("idle")); TX.render(); }, yaw);
        if (yaw % 45 === 0) fs.copyFileSync(path.join(tmp, `${String(i).padStart(3, "0")}.png`), path.join(dir, "turntable", `yaw${String(yaw).padStart(3, "0")}.png`));
      }
      ff(["-framerate", "12", "-i", path.join(tmp, "%03d.png"), "-c:v", "libx264", "-crf", "24", "-pix_fmt", "yuv420p", path.join(dir, "turntable.mp4")]);
      fs.rmSync(tmp, { recursive: true });
      log("turntable");
    }
    if (only.includes("emotions")) {
      for (const e of ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"]) {
        await still(path.join(dir, "emotions", `${e}.png`), (n) => { TX.frame("face", 0); TX.pose(TX.emotion(n, 1)); TX.render(); }, e);
      }
      log("emotions");
    }
    if (only.includes("states")) {
      for (const s of ["idle", "listening", "thinking", "speaking", "your_turn", "celebrating", "concerned"]) {
        await still(path.join(dir, "states", `${s}.png`), (n) => { TX.frame("bust", 0); TX.pose(TX.state(n)); TX.render(); }, s);
      }
      log("states");
    }
    if (only.includes("visemes")) {
      const V = ["sil", "PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"].map((v) => `viseme_${v}`);
      const T = [["tongueTipUp", 0.45], ["tongueCurl", 0.45], ["tongueWide", 0.5]];
      for (const v of V) await still(path.join(dir, "visemes", `${v}.png`), (n) => { TX.frame("mouth", 0); TX.pose({ bs: { [n]: 1 } }); TX.render(); }, v);
      for (const [k, j] of T) await still(path.join(dir, "visemes", `${k}.png`), ([n, jw]) => { TX.frame("mouth", 0); TX.pose({ bs: { [n]: 1, jawOpen: jw } }); TX.render(); }, [k, j]);
      log("visemes");
    }
  } finally { if (hx.errors.length) console.log(hx.errors.slice(0, 5).join("\n")); await hx.close(); }
}

// ---------------- tiers side by side (same pose), each at its own runtime
if (only.includes("tiers")) {
  const hx = await openHarness({ w: 480, h: 600 });
  try {
    for (const tier of ["H", "Bplus", "Blite"]) {
      meta.frames[tier] = await hx.page.evaluate(async (t) => { const s = await TX.load("c3", t); TX.frame("face", 0); TX.pose(TX.state("speaking")); return { ...s, ...TX.render() }; }, tier);
      await hx.shot(path.join(dir, `tier_${tier}.png`));
    }
  } finally { await hx.close(); }
  log("tiers");
}

// ---------------- 6 s lip-sync clip: the bake-off sentence (teal / marin), first CLIP_S seconds
if (only.includes("lipsync")) {
  const mp3 = path.join(dir, "audio", "sentence_6s.mp3");
  ff(["-i", path.join(SRC_AUDIO, "teal.mp3"), "-t", String(CLIP_S), "-af", `afade=t=out:st=${CLIP_S - 0.25}:d=0.25`, "-c:a", "libmp3lame", "-b:a", "96k", mp3]);
  const full = JSON.parse(fs.readFileSync(path.join(SRC_AUDIO, "teal.align.json")));
  const align = { ...full, duration: CLIP_S - 0.4, visemes: full.visemes.filter((e) => e.t1 <= CLIP_S - 0.05) };
  fs.writeFileSync(path.join(dir, "audio", "sentence_6s.align.json"), JSON.stringify(align));
  const L = JSON.parse(fs.readFileSync("art/character/candidates/c3/look.json"));
  const hx = await openHarness({ w: 480, h: 600 });
  try {
    await hx.page.evaluate(() => TX.load("c3", "H"));
    const b64 = fs.readFileSync(mp3).toString("base64");
    const rmsOpts = { jawCeiling: L.jawCeiling ?? 0.85, gateFrac: 0.18, curve: 1.6, tauMs: 25 };
    const arms = [["lipsync", () => hx.page.evaluate(([a]) => TX.lipsyncVisemes(a, 25), [align])],
      ["lipsync-rms", () => hx.page.evaluate(([b, o, a]) => TX.lipsyncPrepare(b, 25, 0.15, o, a), [b64, rmsOpts, align])]];
    meta.lipsync = {};
    for (const [name, prep] of arms) {
      const info = await prep();
      info.frames = Math.min(info.frames, Math.round(CLIP_S * 25));
      meta.lipsync[name] = info;
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "c3ls-"));
      for (let i = 0; i < info.frames; i++) {
        await hx.page.evaluate((k) => { TX.frame("face", 0); TX.lipFrame(k); TX.render(); }, i);
        await hx.shot(path.join(tmp, `${String(i).padStart(4, "0")}.png`));
      }
      ff(["-framerate", "25", "-i", path.join(tmp, "%04d.png"), "-i", mp3, "-c:v", "libx264", "-crf", "22",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-shortest", path.join(dir, `${name}.mp4`)]);
      if (name === "lipsync") {
        const mid = (e) => Math.round(((e.t0 + e.t1) / 2) * 25);
        const pp = align.visemes.filter((e) => e.viseme === "viseme_PP").map(mid);
        const vw = align.visemes.filter((e) => ["viseme_aa", "viseme_O", "viseme_E"].includes(e.viseme)).map(mid);
        const take = (a, k) => Array.from({ length: k }, (_, i) => a[Math.floor((i + 0.5) * a.length / k)]).filter((x) => x !== undefined);
        const pick = [...take(pp, 4), ...take(vw, 8 - Math.min(4, pp.length))].sort((a, b) => a - b).slice(0, 8);
        meta.lipStrip = pick.map((k) => {
          const e = align.visemes.find((x) => k / 25 >= x.t0 - 0.02 && k / 25 <= x.t1 + 0.02) || {};
          return { frame: k, t: +(k / 25).toFixed(2), viseme: e.viseme || "-", word: e.word || "" };
        });
        pick.forEach((k, j) => fs.copyFileSync(path.join(tmp, `${String(Math.min(k, info.frames - 1)).padStart(4, "0")}.png`), path.join(dir, `lip_${j}.png`)));
      }
      fs.rmSync(tmp, { recursive: true });
      log(`${name} ${info.frames} frames; bilabial closed ${info.bilabialClosed}/${info.bilabialFrames}`);
    }
  } finally { await hx.close(); }
}
fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
execFileSync("python3", ["scripts/character/candidates/c3/contact_c3.py", dir]);
log("contact sheet");
