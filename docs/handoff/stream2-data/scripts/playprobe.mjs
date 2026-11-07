import { createRequire } from "node:module";
const require = createRequire("/home/user/Taxila/tests/prod/x.mjs");
const { chromium } = require("playwright");
const { startVite } = await import("/home/user/Taxila/tests/prod/r4-kaksha-inpage.mjs");
const stop = await startVite("/home/user/Taxila", 5205);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
try {
  const p = await b.newPage({ viewport: { width: 412, height: 915 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.goto("http://localhost:5205/src/trace/dev/lesson.html?page=play&family=nishana&engine=3d&theme=neela-nebula&class=7&lang=hinglish&seed=3&fade=1&tier=2");
  await p.waitForTimeout(8000);
  const r = await p.evaluate(() => ({ canvas: document.querySelectorAll("canvas").length, text: document.body.innerText.slice(0, 200), ev: window.__traceEvents.length, rr: window.__rrweb.length }));
  console.log(JSON.stringify(r), errs.slice(0, 3));
  await p.screenshot({ path: "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/play.png" });
} finally { await b.close(); stop(); }
