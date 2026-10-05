// node evals/face-puppet/layout/run.mjs [tag] → out/layout-<tag>.json. Builds app.tsx against the CURRENT src/face-puppet.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const OUT = "evals/face-puppet/out/layout";
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/index.html`, '<!doctype html><html><head><meta charset="utf-8"><title>layout</title></head><body><div id="root"></div><script type="module" src="./app.js"></script></body></html>');
await build({ configFile: false, logLevel: "warn", publicDir: false, plugins: [react()], define: { "import.meta.env.DEV": "false", "process.env.NODE_ENV": '"production"' },
  build: { outDir: OUT, emptyOutDir: false, minify: true, lib: { entry: "evals/face-puppet/layout/app.tsx", formats: ["es"], fileName: () => "app.js" } } });
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const f = u.startsWith("/r/") ? path.join(OUT, u.slice(3)) : u.startsWith("/diya/") ? path.join("evals/face-puppet/out/diya", u.slice(6)) : path.join("public", u);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".html") ? "text/html" : f.endsWith(".webp") ? "image/webp" : "application/json" }); return fs.createReadStream(f).pipe(res); }
  res.writeHead(404); res.end();
}).listen(4736);
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:4736/r/index.html");
await p.waitForFunction("window.H && window.H.done", null, { timeout: 180000 });
const H = await p.evaluate("({ loaded: H.loaded, canvases: H.canvases, switches: H.switches })");
const s = [...H.switches].sort((a, b) => a - b);
const res = { date: new Date().toISOString().slice(0, 10), method: "React parent switching medium <-> close PuppetFace mounts 9x while status=speaking with Diya line 00's viseme track on the bus; ms from the commit to a live canvas (opacity 1) in the new host; Chromium SwiftShader (not a phone)", ...H, medianMs: s[Math.floor(s.length / 2)], maxMs: s.at(-1), errors: errs.slice(0, 3) };
fs.writeFileSync(`evals/face-puppet/out/layout-${process.argv[2] || "current"}.json`, JSON.stringify(res, null, 1));
console.log(res);
await b.close(); srv.close();
