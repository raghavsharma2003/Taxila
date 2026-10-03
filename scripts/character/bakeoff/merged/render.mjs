// Render evidence per look with headless three.js in Chromium (SwiftShader, software GL):
// turntable, 9 emotions, 7 owner states, viseme sweep (+ Hindi tongue keys), tier comparison, lip-sync clip from a real
// TTS sentence driven by the real src/avatar driver stack, and the 2D plates (tier D) rendered from the B+ runtime.
//   node scripts/character/render.mjs [--looks teal,slate,plum] [--out docs/design/teacher/renders]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { openHarness } from "./harness.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const LOOKS = opt("--looks", "teal,slate,plum").split(",");
const OUT = opt("--out", "docs/design/teacher/bakeoff/merged/renders");
const only = opt("--only", "turntable,emotions,states,visemes,tiers,lipsync,plates").split(",");
const AUDIO = "docs/design/teacher/renders/audio";
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args]);
const log = (m) => console.log(`[render] ${m}`);

for (const look of LOOKS) {
  const dir = path.join(OUT, look);
  for (const d of ["", "emotions", "states", "visemes", "turntable"]) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const meta = { look, renderer: null, frames: {} };

  // ---------------- stills at 600 x 750 (H)
  let hx = await openHarness({ w: 600, h: 750 });
  const P = hx.page;
  try {
    meta.load = await P.evaluate((l) => TX.load(l, "H"), look);
    meta.renderer = await P.evaluate(() => TX.measure(1, false).gpu);
    const still = async (file, fn, arg) => { await P.evaluate(fn, arg); await hx.shot(file); };
    if (only.includes("turntable")) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tt-"));
      for (let i = 0; i < 36; i++) {
        const yaw = i * 10;
        await still(path.join(tmp, `${String(i).padStart(3, "0")}.png`), (y) => { TX.frame("bust", y); TX.pose(TX.state("idle")); TX.render(); }, yaw);
        if (yaw % 45 === 0) fs.copyFileSync(path.join(tmp, `${String(i).padStart(3, "0")}.png`), path.join(dir, "turntable", `yaw${String(yaw).padStart(3, "0")}.png`));
      }
      ff(["-framerate", "12", "-i", path.join(tmp, "%03d.png"), "-c:v", "libx264", "-crf", "24", "-pix_fmt", "yuv420p", path.join(dir, "turntable.mp4")]);
      fs.rmSync(tmp, { recursive: true });
      log(`${look} turntable`);
    }
    if (only.includes("emotions")) {
      for (const e of ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"]) {
        await still(path.join(dir, "emotions", `${e}.png`), (n) => { TX.frame("face", 0); TX.pose(TX.emotion(n, 1)); TX.render(); }, e);
      }
      log(`${look} emotions`);
    }
    if (only.includes("states")) {
      for (const s of ["idle", "listening", "thinking", "speaking", "your_turn", "celebrating", "concerned"]) {
        await still(path.join(dir, "states", `${s}.png`), (n) => { TX.frame("bust", 0); TX.pose(TX.state(n)); TX.render(); }, s);
      }
      log(`${look} states`);
    }
    if (only.includes("visemes")) {
      const V = ["sil", "PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"].map((v) => `viseme_${v}`);
      const T = [["tongueTipUp", 0.45], ["tongueCurl", 0.45], ["tongueWide", 0.5]];
      for (const v of V) await still(path.join(dir, "visemes", `${v}.png`), (n) => { TX.frame("mouth", 0); TX.pose({ bs: { [n]: 1 } }); TX.render(); }, v);
      for (const [k, j] of T) await still(path.join(dir, "visemes", `${k}.png`), ([n, jw]) => { TX.frame("mouth", 0); TX.pose({ bs: { [n]: 1, jawOpen: jw } }); TX.render(); }, [k, j]);
      log(`${look} visemes`);
    }
  } finally { if (hx.errors.length) console.log(hx.errors.slice(0, 5).join("\n")); await hx.close(); }

  // ---------------- tiers side by side (same pose), each at its own runtime
  if (only.includes("tiers")) {
    hx = await openHarness({ w: 480, h: 600 });
    try {
      for (const tier of ["H", "Bplus", "Blite"]) {
        meta.frames[tier] = await hx.page.evaluate(async ([l, t]) => { const s = await TX.load(l, t); TX.frame("face", 0); TX.pose(TX.state("speaking")); return { ...s, ...TX.render() }; }, [look, tier]);
        await hx.shot(path.join(dir, `tier_${tier}.png`));
      }
    } finally { await hx.close(); }
    log(`${look} tiers`);
  }

  // ---------------- lip-sync clip: real TTS, real LipDriver + Behaviour + Compositor
  if (only.includes("lipsync") && fs.existsSync(path.join(AUDIO, `${look}.mp3`))) {
    hx = await openHarness({ w: 480, h: 600 });
    try {
      await hx.page.evaluate((l) => TX.load(l, "H"), look);
      const b64 = fs.readFileSync(path.join(AUDIO, `${look}.mp3`)).toString("base64");
      const alignF = path.join(AUDIO, `${look}.align.json`);
      const align = fs.existsSync(alignF) ? JSON.parse(fs.readFileSync(alignF)) : null;
      const L = JSON.parse(fs.readFileSync(`art/character/bakeoff/merged/looks/${look}.json`));
      // Two arms, same audio. "visemes" (the evidence clip, lipsync.mp4): the forced-aligned sentence drives H's viseme
      // morphs, so the clip shows the rig. "rms" (lipsync-rms.mp4): the real M0 LipDriver with the proposed closure
      // expander settings (jawCeiling, a higher gate, a power curve > 1, a shorter tau) passed as its own options;
      // it measures the DRIVER and is what src/avatar ships until the HeadAudio classes land.
      const arms = [];
      if (align) arms.push(["lipsync", () => hx.page.evaluate(([a]) => TX.lipsyncVisemes(a, 25), [align])]);
      const rmsOpts = { jawCeiling: L.jawCeiling ?? 0.85, gateFrac: 0.18, curve: 1.6, tauMs: 25 };
      arms.push([align ? "lipsync-rms" : "lipsync", () => hx.page.evaluate(([b, o, a]) => TX.lipsyncPrepare(b, 25, 0.15, o, a), [b64, rmsOpts, align])]);
      meta.lipsync = {};
      for (const [name, prep] of arms) {
        const info = await prep();
        meta.lipsync[name] = info;
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ls-"));
        for (let i = 0; i < info.frames; i++) {
          await hx.page.evaluate((k) => { TX.frame("face", 0); TX.lipFrame(k); TX.render(); }, i);
          await hx.shot(path.join(tmp, `${String(i).padStart(4, "0")}.png`));
        }
        ff(["-framerate", "25", "-i", path.join(tmp, "%04d.png"), "-i", path.join(AUDIO, `${look}.mp3`), "-c:v", "libx264", "-crf", "22",
          "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-shortest", path.join(dir, `${name}.mp4`)]);
        if (name === "lipsync") {
          // the contact strip: 8 frames, half of them ON aligned bilabials so the closure is visible, half on vowels
          let pick = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((f) => Math.floor(f * info.frames));
          if (align) {
            const mid = (e) => Math.round(((e.t0 + e.t1) / 2) * 25);
            const pp = align.visemes.filter((e) => e.viseme === "viseme_PP").map(mid);
            const vw = align.visemes.filter((e) => ["viseme_aa", "viseme_O", "viseme_E"].includes(e.viseme)).map(mid);
            const take = (a, k) => Array.from({ length: k }, (_, i) => a[Math.floor((i + 0.5) * a.length / k)]).filter((x) => x !== undefined);
            pick = [...take(pp, 4), ...take(vw, 4)].sort((a, b) => a - b).slice(0, 8);
            meta.lipStrip = pick.map((k) => ({ frame: k, t: +(k / 25).toFixed(2), viseme: (align.visemes.find((e) => k / 25 >= e.t0 - 0.02 && k / 25 <= e.t1 + 0.02) || {}).viseme || "-",
              word: (align.visemes.find((e) => k / 25 >= e.t0 - 0.02 && k / 25 <= e.t1 + 0.02) || {}).word || "" }));
          }
          pick.forEach((k, j) => fs.copyFileSync(path.join(tmp, `${String(Math.min(k, info.frames - 1)).padStart(4, "0")}.png`), path.join(dir, `lip_${j}.png`)));
        }
        fs.rmSync(tmp, { recursive: true });
        log(`${look} ${name} ${info.frames} frames; bilabial closed ${info.bilabialClosed}/${info.bilabialFrames}`);
      }
    } finally { await hx.close(); }
  }

  // ---------------- 2D plates (tier D), rendered from the B+ runtime so B+ -> D keeps the same person
  if (only.includes("plates")) {
    const pd = path.join("public/assets/teacher-bakeoff/merged", look, "plate");
    fs.mkdirSync(pd, { recursive: true });
    hx = await openHarness({ w: 360, h: 450 });
    try {
      await hx.page.evaluate((l) => TX.load(l, "Bplus"), look);
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pl-"));
      await hx.page.evaluate(() => { TX.frame("bust", 0); TX.pose(TX.state("idle")); TX.render(); });
      await hx.shot(path.join(tmp, "plate.png"));
      for (const [i, j] of [0, 0.15, 0.3, 0.45, 0.6].entries()) {
        await hx.page.evaluate((jw) => { TX.frame("bust", 0); const s = TX.state("idle"); s.bs.jawOpen = jw; s.bs.mouthSmileLeft = 0.12; s.bs.mouthSmileRight = 0.12; TX.pose(s); TX.render(); }, j);
        await hx.shot(path.join(tmp, `m${i}.png`));
      }
      await hx.page.evaluate(() => { TX.frame("bust", 0); const s = TX.state("idle"); s.bs.eyeBlinkLeft = 1; s.bs.eyeBlinkRight = 1; TX.pose(s); TX.render(); });
      await hx.shot(path.join(tmp, "blink.png"));
      execFileSync("python3", ["scripts/character/bakeoff/merged/plates.py", tmp, pd]);
      fs.rmSync(tmp, { recursive: true });
      log(`${look} plates`);
    } finally { await hx.close(); }
  }
  fs.writeFileSync(path.join(dir, "render.json"), JSON.stringify(meta, null, 1));
  execFileSync("python3", ["scripts/character/bakeoff/merged/contact.py", dir, look]);
  log(`${look} contact sheet`);
}
