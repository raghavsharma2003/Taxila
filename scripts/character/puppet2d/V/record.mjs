// Evidence for arm V: deterministic clip capture, timed stills, and an fps run under CPU throttling. Repo root:
//   node scripts/character/puppet2d/V/record.mjs clip  <out.mp4> [t0] [t1] [fps] [lip]
//   node scripts/character/puppet2d/V/record.mjs stills <outdir> t1,t2,...
//   node scripts/character/puppet2d/V/record.mjs fps   <out.json> [throttle=4] [seconds=12] [size=720]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const [mode, out, ...rest] = process.argv.slice(2);
const demo = "file://" + path.resolve("art/character/puppet2d/V/demo.html");
const args = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--allow-file-access-from-files"];
const browser = await chromium.launch({ args });
const errors = [];
async function open(w, h, qs) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${demo}?${qs}`);
  await page.waitForFunction(() => window.DEMO_READY === true, null, { timeout: 60000 });
  return page;
}
if (mode === "clip" || mode === "stills") {
  const lip = mode === "clip" ? rest[3] || "visemes" : "visemes";
  const page = await open(720, 776, `rec=1&dpr=1&lip=${lip}`);
  const fps = mode === "clip" ? +(rest[2] || 30) : 60;
  const t0 = mode === "clip" ? +(rest[0] || 0) : 0;
  const t1 = mode === "clip" ? +(rest[1] || 15) : 0;
  const want = mode === "stills" ? rest[0].split(",").map(Number) : null;
  const dir = mode === "clip" ? fs.mkdtempSync(path.join(path.dirname(out), ".frames-")) : out;
  fs.mkdirSync(dir, { recursive: true });
  // run the sim from 0 so behaviour state is honest, capture inside [t0, t1] (or at the asked times)
  const dt = 1 / fps;
  const end = want ? Math.max(...want) + dt : t1;
  let n = 0, wi = 0;
  const sorted = want ? [...want].sort((a, b) => a - b) : null;
  for (let t = 0; t <= end + 1e-9; t += dt) {
    await page.evaluate(([tt, d]) => window.DEMO.step(tt, d), [t, dt]);
    if (mode === "clip" && t >= t0 - 1e-9) {
      await page.screenshot({ path: path.join(dir, `f${String(n++).padStart(5, "0")}.png`) });
    } else if (sorted && wi < sorted.length && t >= sorted[wi] - dt / 2) {
      await page.locator("canvas").screenshot({ path: path.join(dir, `t${sorted[wi].toFixed(2)}.png`) });
      wi++;
    }
  }
  if (mode === "clip") {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "f%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", out]);
    fs.rmSync(dir, { recursive: true });
    console.log("clip", out, n, "frames");
  } else console.log("stills", sorted.length);
} else if (mode === "fps") {
  const throttle = +(rest[0] || 4), secs = +(rest[1] || 12), size = +(rest[2] || 720);
  const page = await open(size, size + 56, `dpr=1&finish=1`);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.DEMO.perf.intervals.length = 0; window.DEMO.perf.work.length = 0; });
  await page.waitForTimeout(secs * 1000);
  const r = await page.evaluate(() => {
    const p = window.DEMO.perf, q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
    const iv = p.intervals, wk = p.work;
    return { frames: iv.length, fpsP50: 1000 / q(iv, 0.5), intervalP50: q(iv, 0.5), intervalP95: q(iv, 0.95), workP50: q(wk, 0.5), workP95: q(wk, 0.95), stats: window.DEMO.rig.stats(), canvas: [window.DEMO.rig.canvas.width, window.DEMO.rig.canvas.height] };
  });
  const res = { date: new Date().toISOString(), method: `headless Chromium ${browser.version()} SwiftShader (CPU GL), CDP CPU throttling ${throttle}x, ${secs}s real-time loop, work = JS + gl.finish()`, throttle, ...r };
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res));
}
if (errors.length) console.log("ERRORS", errors.slice(0, 5));
await browser.close();
