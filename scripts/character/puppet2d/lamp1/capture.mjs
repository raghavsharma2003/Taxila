// Deterministic capture of the demo scene (demo.html?capture=1): a virtual 60 Hz clock, every 1/30 s the stage is
// screenshot, then ffmpeg makes a 15 s clip (H.264 + the TTS line muxed at 1.5 s, AAC). Headless Chromium, SwiftShader GL.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node capture.mjs <vp> [--dsf 1] [--fps 30] [--secs 15.2] [--stills 1.0,4.2,...]
// Writes <scratch>/cap-<vp>/f%04d.png, log.json (per-tick driver + rig read-outs), and docs/design/round4/asha/clips/asha-<vp>.mp4.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const vp = process.argv[2] || "360";
const dsf = Number(arg("--dsf", "1")), fps = Number(arg("--fps", "30")), secs = Number(arg("--secs", "15.2"));
const stills = arg("--stills", "");
const SCR = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha";
const OUT = `${SCR}/cap-${vp}${dsf !== 1 ? "-x" + dsf : ""}${stills ? "-stills" : ""}`;
const CLIPS = "/home/user/Taxila/docs/design/round4/asha/clips";
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(CLIPS, { recursive: true });
const W = Number(vp) || 360;
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const pg = await b.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: dsf });
const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
const extra = arg("--q", "");
await pg.goto(`file:///home/user/Taxila/art/character/puppet2d/lamp1/demo.html?capture=1&vp=${vp}&dpr=${Math.max(2, dsf)}${extra ? "&" + extra : ""}`);
await pg.waitForFunction(() => window.cap && window.cap.ready, null, { timeout: 60000 });
await pg.evaluate(() => window.cap.start());
const stage = await pg.$("#stage");
const box = await stage.boundingBox();
await pg.setViewportSize({ width: W, height: Math.ceil(box.y + box.height + 12) });
const t0 = Date.now();
const times = stills ? stills.split(",").map(Number) : Array.from({ length: Math.round(secs * fps) + 1 }, (_, i) => i / fps);
for (let i = 0; i < times.length; i++) {
  for (let cur = await pg.evaluate(() => window.cap.st); cur < times[i] - 1e-6; ) cur = await pg.evaluate((t) => window.cap.step(t), Math.min(times[i], cur + 0.5));
  await stage.screenshot({ path: path.join(OUT, stills ? `s-${times[i].toFixed(2)}.png` : `f${String(i).padStart(4, "0")}.png`) });
  if (i % 60 === 0) process.stdout.write(`${i}/${times.length} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
}
const log = await pg.evaluate(() => window.cap.log());
fs.writeFileSync(`${OUT}/log.json`, JSON.stringify({ vp, dsf, fps, slots: await pg.evaluate(() => window.cap.rigs()), log }));
if (errs.length) console.log("page errors:", errs.slice(0, 5));
await b.close();
if (!stills) {
  const clip = `${CLIPS}/asha-${vp}${extra.includes("calm=1") ? "-calm" : ""}.mp4`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", `${OUT}/f%04d.png`, "-i", `${SCR}/tts/line.wav`,
    "-filter_complex", "[0:v]pad=ceil(iw/2)*2:ceil(ih/2)*2:color=0xF6F3EC,format=yuv420p[v];[1:a]adelay=1500|1500,apad[a]", "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-c:a", "aac", "-b:a", "64k", "-t", String(secs), "-movflags", "+faststart", clip]);
  console.log("clip", clip, (fs.statSync(clip).size / 1024).toFixed(0), "KB");
}
console.log("done", times.length, "frames in", ((Date.now() - t0) / 1000).toFixed(0), "s");
