// run-web.mjs — drives bench.html in Chromium 141 (SwiftShader WebGL2) with site isolation OFF, to mimic Android WebView's
// single renderer process. Reports frame-interval and per-frame JS cost distributions.
// Usage: node run-web.mjs <playwright-index.mjs> <chromium>
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const [pwPath, exe] = process.argv.slice(2); const { chromium } = await import(pwPath);
const root = path.resolve("web"), three = path.resolve("node_modules/three"), glb = path.resolve("../avlip/opt");
const types = { ".js": "text/javascript", ".html": "text/html", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
const srv = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split("?")[0]);
  const f = u.startsWith("/three/") ? path.join(three, u.slice(7)) : u.startsWith("/glb/") ? path.join(glb, u.slice(5)) : path.join(root, u);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } if (f.endsWith(".js")) d = d.toString().replace(/from\s*['"]three['"]/g, 'from "/three/build/three.module.js"'); res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); res.end(d); }); }).listen(8765);
const b = await chromium.launch({ executablePath: exe, args: ["--disable-site-isolation-trials", "--disable-features=IsolateSandboxedIframes,SitePerProcess",
  "--autoplay-policy=no-user-gesture-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const pct = (a, p) => { if (!a.length) return null; a = [...a].sort((x, y) => x - y); return +a[Math.min(a.length - 1, Math.floor(p * a.length))].toFixed(1); };
async function run(q, throttle = 1) {
  const p = await b.newPage(); const cdp = await p.context().newCDPSession(p);
  if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await p.goto(`http://localhost:8765/bench.html?${q}`);
  await p.waitForFunction(() => window.__result, null, { timeout: 120000, polling: 500 });
  const r = await p.evaluate(() => window.__result); await p.close();
  const f = r.frames.slice(5); const iv = f.slice(1).map((x, i) => x[0] - f[i][0]); const work = f.map((x) => x[1]);
  const dur = (f.at(-1)[0] - f[0][0]) / 1000;
  return { q, throttle, fps: +((f.length - 1) / dur).toFixed(1), interval_p50: pct(iv, 0.5), interval_p95: pct(iv, 0.95), interval_max: pct(iv, 1),
    over50ms: iv.filter((x) => x > 50).length, work_p50: pct(work, 0.5), work_p95: pct(work, 0.95),
    lipGap_p50: pct(r.lipGaps, 0.5), lipGap_p99: pct(r.lipGaps, 0.99), lipGap_max: pct(r.lipGaps, 1),
    loadMs: Math.round(r.info.loadMs), firstFrameMs: Math.round(r.info.firstFrameMs), tris: r.info.tris, calls: r.info.calls }; }
const plan = JSON.parse(process.env.PLAN || "null") || [
  ["mode=main&avatar=brunette.glb", 1], ["mode=main&avatar=avatarsdk.glb", 1], ["mode=main&avatar=mpfb.glb", 1],
  ["mode=main&avatar=brunette.glb", 4], ["mode=main&avatar=mpfb.glb", 4], ["mode=main&avatar=brunette.glb", 6],
  ["mode=main&avatar=brunette.glb&load=heavy&lip=relay", 1], ["mode=worker&avatar=brunette.glb&load=heavy&lip=relay", 1], ["mode=worker&avatar=brunette.glb&load=heavy&lip=direct", 1],
  ["mode=main&avatar=brunette.glb&load=light&lip=relay", 1], ["mode=worker&avatar=brunette.glb&load=light&lip=direct", 1],
  ["mode=main&avatar=brunette.glb&lip=relay", 1], ["mode=worker&avatar=brunette.glb&lip=direct", 1] ];
const out = []; for (const [q, t] of plan) { const r = await run(q, t); out.push(r); console.log(JSON.stringify(r)); }
fs.writeFileSync("web-result.json", JSON.stringify(out, null, 1)); await b.close(); srv.close();
