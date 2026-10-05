// Evidence capture for arm P: stills at given timeline times / poses, a deterministic frame sequence -> mp4, and a
// realtime Playwright video. Serves art/character/puppet2d/polish-r8 on a local port.
//   node scripts/character/puppet2d/polish-r8/shoot.mjs stills t1,t2,...         -> work/shots/t-<t>.png
//   node scripts/character/puppet2d/polish-r8/shoot.mjs frames <t0> <t1> <fps> <dir>
//   node scripts/character/puppet2d/polish-r8/shoot.mjs poses <poses.json>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.env.P2D_ROOT || "art/character/puppet2d/polish-r8";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".mp3": "audio/mpeg", ".webp": "image/webp" };
export function serve() {
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]);
    const f = path.join(ROOT, u === "/" ? "demo.html" : u);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, () => r(srv)));
}
export async function open(srv, query = "capture=1", opts = {}) {
  const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: { width: 720, height: 720 }, deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("console", m.text()); });
  await page.goto(`http://127.0.0.1:${srv.address().port}/demo.html?${query}`);
  await page.waitForFunction(() => window.P2D && (window.P2D.ready || window.P2D.error), null, { timeout: 60000 });
  const err = await page.evaluate(() => window.P2D.error);
  if (err) throw new Error(err);
  return { browser, ctx, page };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const [mode, a, b, c, d] = process.argv.slice(2);
  const srv = await serve();
  const Qs = process.env.P2D_Q || "capture=1";
  const px = (Qs.match(/px=(\d+)/) || [0, 720])[1];
  const { browser, page } = await open(srv, Qs, { viewport: { width: +px, height: +px } });
  const canvas = page.locator("#c");
  if (mode === "stills") {
    fs.mkdirSync(`${ROOT}/work/shots`, { recursive: true });
    const ts = a.split(",").map(Number);
    // the timeline is causal: step from 0 at 60 Hz up to each requested time
    let t = 0;
    for (const target of ts) {
      for (let c = t; c < target; c += 1) await page.evaluate(([t0, t1]) => { for (let x = t0; x < t1; x += 1 / 60) window.P2D.renderAt(x); }, [c, Math.min(target, c + 1)]);
      await page.evaluate((t1) => window.P2D.renderAt(t1), target);
      t = target + 1 / 60;
      await canvas.screenshot({ path: `${ROOT}/work/shots/t-${target}.png` });
      console.log("shot", target);
    }
  } else if (mode === "frames") {
    const t0 = +a, t1 = +b, fps = +c, dir = d;
    fs.mkdirSync(dir, { recursive: true });
    await page.evaluate((t0) => { for (let x = 0; x < t0; x += 1 / 60) window.P2D.renderAt(x); }, t0);
    let i = 0;
    for (let t = t0; t < t1; t += 1 / fps, i++) {
      // sub-step at 60 Hz between output frames so springs and the lip driver see a 60 Hz clock
      await page.evaluate(([ta, tb]) => { for (let x = ta; x < tb - 1e-6; x += 1 / 60) window.P2D.renderAt(x); return window.P2D.renderAt(tb); }, [t - 1 / fps + 1 / 60, t]);
      await canvas.screenshot({ path: `${dir}/f${String(i).padStart(5, "0")}.png` });
    }
    const rows = await page.evaluate(() => window.P2D.stats.rows);
    fs.writeFileSync(`${dir}/rows.json`, JSON.stringify(rows));
    console.log("frames", i);
  } else if (mode === "gate") {
    // r4 articulation gate: the scripted "chalo, aao, mama, bubbly" at <fps> -> <dir>/g#####.png + labels.json
    const fps = +(a || 30), dir = b;
    fs.mkdirSync(dir, { recursive: true });
    const dur = await page.evaluate(() => { window.P2D.rig.resetPhysics(); window.P2D.rig.solver.first = true; window.P2D.rig.lastT = -1; return window.P2D.gateDur; });
    const labels = [];
    let i = 0;
    for (let t = 0; t < dur; t += 1 / fps, i++) {
      const lbl = await page.evaluate(([ta, tb]) => { let l = ""; for (let x = ta; x <= tb + 1e-6; x += 1 / 120) l = window.P2D.gateAt(Math.min(x, tb)); return window.P2D.gateAt(tb); }, [Math.max(0, t - 1 / fps + 1 / 120), t]);
      labels.push(lbl);
      await canvas.screenshot({ path: `${dir}/g${String(i).padStart(5, "0")}.png` });
    }
    fs.writeFileSync(`${dir}/labels.json`, JSON.stringify(labels));
    console.log("gate frames", i);
  } else if (mode === "poses") {
    const poses = JSON.parse(fs.readFileSync(a, "utf8"));
    const PD = process.env.P2D_POSEDIR || `${ROOT}/work/poses`;
    fs.mkdirSync(PD, { recursive: true });
    for (const [name, spec] of Object.entries(poses)) {
      const m = await page.evaluate((s) => window.P2D.pose(s), spec);
      await canvas.screenshot({ path: `${PD}/${name}.png` });
      console.log("pose", name, m);
    }
  }
  await browser.close();
  srv.close();
}
