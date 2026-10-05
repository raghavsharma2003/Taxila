// Build the parity page (production src/face-puppet, vite lib build) into a temp dir, serve it next to public/face-puppet,
// run it in Chromium (SwiftShader), print the per-frame pixel differences of chunked vs judged loading.
//   node evals/p2-face/parity/run.mjs
import { build } from "vite";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
const ENTRY = process.argv[2] || "parity.ts";
const OUT = fs.mkdtempSync(path.join(process.env.P2F_TMP || os.tmpdir(), "p2f-parity-"));
await build({ configFile: false, logLevel: "warn", publicDir: false, define: { "import.meta.env.DEV": "false" },
  build: { outDir: OUT, emptyOutDir: true, minify: true, lib: { entry: new URL(`./${ENTRY}`, import.meta.url).pathname, formats: ["es"], fileName: () => "parity.js" } } });
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><body style="margin:0"><script type="module" src="/p/parity.js"></script>`);
const T = { ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".html": "text/html" };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const f = u.startsWith("/p/") ? path.join(OUT, u.slice(3) || "index.html") : path.join("public", u);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "content-type": T[path.extname(f)] || "application/octet-stream" }); return fs.createReadStream(f).pipe(res); }
  res.writeHead(404); res.end();
}).listen(0);
const port = srv.address().port;
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const p = await b.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
  await p.goto(`http://127.0.0.1:${port}/p/index.html`);
  await p.waitForFunction("window.R", null, { timeout: 120000 });
  const R = await p.evaluate("window.R");
  if (R.shots) {
    // look.ts: frames to PNG files for the eye (out/look/<display>-<k>.png)
    const dir = new URL("../out/look/", import.meta.url).pathname;
    fs.mkdirSync(dir, { recursive: true });
    for (const [d, list] of Object.entries(R.shots)) list.forEach((u, k) => fs.writeFileSync(`${dir}${d}-${k}.png`, Buffer.from(u.split(",")[1], "base64")));
    console.log("wrote", dir);
    process.exitCode = 0;
  } else console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: "two production PuppetStages, scripted clock, 5 scenes, canvas read back via 2D drawImage; Chromium SwiftShader", ...R }, null, 1));
  if (!R.shots) fs.writeFileSync(new URL("../out/loader-parity.json", import.meta.url), JSON.stringify(R, null, 1));
} finally { await b.close(); srv.close(); fs.rmSync(OUT, { recursive: true, force: true }); }
