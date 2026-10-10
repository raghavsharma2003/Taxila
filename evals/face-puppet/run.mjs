// V4 runner (Playwright Chromium + the harness): posters, in-app lip-sync timing, fps under CPU throttle.
//   node evals/face-puppet/run.mjs poster [--look r8|lamp1] → public/face-puppet/<look>/rest-{medium,close}.webp
//                                                     (views from the pack's own geom.json `views`, else r8's)
//   node evals/face-puppet/run.mjs lipsync           → out/lipsync-inapp.json (24 lines, realtime, real AudioContext)
//   node evals/face-puppet/run.mjs fps [rate]        → out/fps-<rate>x.json (CPU throttle via CDP, SwiftShader GL)
// Needs: node evals/face-puppet/build-harness.mjs first.
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";

const cmd = process.argv[2] || "poster";
const PORT = 4719;
const OUT = "evals/face-puppet/out/";
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({ args: ARGS });
const base = `http://127.0.0.1:${PORT}/h/index.html`;
const wait = (page, expr, ms = 60000) => page.waitForFunction(expr, null, { timeout: ms });
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

try {
  if (cmd === "poster") {
    const look = process.argv.includes("--look") ? process.argv[process.argv.indexOf("--look") + 1] : "r8";
    if (!["r8", "lamp1"].includes(look)) throw new Error(`--look ${look}: r8 | lamp1`);
    const rev = JSON.parse(fs.readFileSync(`public/face-puppet/${look}/manifest.json`, "utf8")).rev;
    const views = JSON.parse(fs.readFileSync(`public/face-puppet/${look}/geom.json`, "utf8")).views ?? { medium: [60, 8, 904], close: [140, 70, 744] };
    for (const framing of ["medium", "close"]) {
      // render at rest (a neutral warm idle, no blink) and screenshot the canvas; tall enough to reach the art's bottom
      const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
      const view = views[framing];
      const W = 904, H = Math.round(((1024 - view[1]) / view[2]) * W);
      await page.goto(`${base}?mode=capture&px=${W}&look=${look}`);
      await wait(page, "window.H && (window.H.ready || window.H.error)");
      const err = await page.evaluate("window.H.error"); if (err) throw new Error(err);
      await page.evaluate(([w, h, fr]) => { const host = document.getElementById("host"); host.style.height = h + "px"; host.style.width = w + "px"; if (fr === "close") window.H.stage.rig_view = 1; }, [W, H, framing]);
      if (framing === "close") await page.evaluate((v) => { const r = window.H.stage["rig"]; r.view = v; }, view);
      await page.evaluate(() => window.H.at(1400));   // settled idle, before the first blink (behaviour schedules ~2-4 s)
      const el = await page.$("#host canvas");
      const png = `${OUT}rest-${framing}.png`;
      await el.screenshot({ path: png });
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-c:v", "libwebp", "-quality", "88", `public/face-puppet/${rev}/rest-${framing}.webp`]);
      console.log("poster", framing, fs.statSync(`public/face-puppet/${rev}/rest-${framing}.webp`).size, "B");
      await page.close();
    }
  } else if (cmd === "lipsync") {
    const lines = fs.readdirSync(OUT + "diya").filter((f) => /^\d\d\.json$/.test(f)).map((f) => f.slice(0, 2));
    const page = await browser.newPage({ viewport: { width: 760, height: 760 } });
    await page.goto(`${base}?mode=rt&px=360&line=${lines.join(",")}`);
    await wait(page, "window.H && (window.H.done || window.H.error)", 600000);
    const err = await page.evaluate("window.H.error"); if (err) throw new Error(err);
    const out = await page.evaluate("window.H.out");
    fs.writeFileSync(OUT + "lipsync-inapp-raw.json", JSON.stringify(out));
    console.log("recorded", out.length, "lines,", out.reduce((a, l) => a + l.frames.length, 0), "frames");
  } else if (cmd === "fps") {
    const rate = +(process.argv[3] || 4);
    const page = await browser.newPage({ viewport: { width: 760, height: 760 } });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate });
    await page.goto(`${base}?mode=rt&line=00,01,02&px=${process.argv[4] || 360}${process.argv[5] ? "&budget=" + process.argv[5] : ""}`);
    await wait(page, "window.H && (window.H.ready || window.H.error)", 120000);
    const err = await page.evaluate("window.H.error"); if (err) throw new Error(err);
    const samples = [];
    const t0 = Date.now();
    while (!(await page.evaluate("window.H.done")) && Date.now() - t0 < 120000) {
      await page.waitForTimeout(1000);
      samples.push(await page.evaluate("window.H.stage.snapshot()"));
    }
    const ev = await page.evaluate("window.H.stats");
    const gpu = await page.evaluate(() => { const gl = document.createElement("canvas").getContext("webgl2"); const e = gl && gl.getExtension("WEBGL_debug_renderer_info"); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; });
    const s = samples.filter((x) => x.frames > 60);
    const res = { date: new Date().toISOString().slice(0, 10), loadavg1m: os.loadavg()[0], cores: os.cpus().length, method: `Playwright Chromium headless, CDP CPU throttle ${rate}x, ${gpu}, canvas ${process.argv[4] || 360} CSS px @ dpr 1, 3 Diya lines played through the production stage`, cpuThrottle: rate, n_samples: s.length, fpsP50_median: pct(s.map((x) => x.fpsP50), 0.5), intervalP95_median: pct(s.map((x) => x.intervalP95), 0.5), workP50_median: pct(s.map((x) => x.workP50), 0.5), workP95_median: pct(s.map((x) => x.workP95), 0.5), workP95_max: Math.max(...s.map((x) => x.workP95)), final: s.at(-1), governorEvents: ev.filter((e) => e.type === "governor" || e.type === "fallback") };
    fs.writeFileSync(`${OUT}fps-${rate}x-${process.argv[4] || 360}.json`, JSON.stringify(res, null, 1));
    console.log(res);
  }
} finally {
  await browser.close();
  srv.kill();
}
