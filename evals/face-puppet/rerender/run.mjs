// node evals/face-puppet/rerender/run.mjs  → builds app.tsx against the CURRENT src/face-puppet, serves public/ + the
// bundle, and reports how many times the stage was (re)built across 12 parent re-renders. Pass: loaded === 1.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const OUT = "evals/face-puppet/out/rerender";
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync("evals/face-puppet/rerender/index.html", `${OUT}/index.html`);
await build({ configFile: false, logLevel: "warn", publicDir: false, plugins: [react()], define: { "import.meta.env.DEV": "false", "process.env.NODE_ENV": '"production"' },
  build: { outDir: OUT, emptyOutDir: false, minify: true, lib: { entry: "evals/face-puppet/rerender/app.tsx", formats: ["es"], fileName: () => "app.js" } } });
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const f = u.startsWith("/r/") ? path.join(OUT, u.slice(3)) : path.join("public", u);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".html") ? "text/html" : f.endsWith(".webp") ? "image/webp" : "application/json" }); return fs.createReadStream(f).pipe(res); }
  res.writeHead(404); res.end();
}).listen(4733);
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://127.0.0.1:4733/r/index.html");
await p.waitForFunction("window.H && window.H.done", null, { timeout: 120000 });
const H = await p.evaluate("({ loaded: H.loaded, reveal: H.reveal, canvases: H.canvases, renders: H.renders, events: [...new Set(H.events)] })");
const res = { date: new Date().toISOString().slice(0, 10), method: "React parent re-rendering 12x with teacher={[meter]} (fresh array, same meter); production PuppetFace; Chromium SwiftShader", ...H, errors: errs.slice(0, 3), pass: H.loaded === 1 && H.canvases === 1 };
fs.writeFileSync(`evals/face-puppet/out/rerender-${process.argv[2] || "current"}.json`, JSON.stringify(res, null, 1));
console.log(res);
await b.close(); srv.close();
