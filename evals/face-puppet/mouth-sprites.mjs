import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
const OUT = process.argv[2];
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", "4721"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 600));
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await b.newPage({ viewport: { width: 1000, height: 1100 } });
page.on("console", (m) => console.log("pg:", m.text()));
await page.goto("http://127.0.0.1:4721/h/index.html?mode=capture&px=904&look=r8");
await page.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 60000 });
console.log(await page.evaluate("window.H.error || 'ok'"));
await page.evaluate(() => { const h = document.getElementById("host"); h.style.height = "1016px"; h.style.width = "904px"; });
await page.evaluate(() => window.H.at(1400));
const POSES = { closed: {}, half: { jawOpen: 0.35, viseme_aa: 0.3 }, open: { jawOpen: 0.7, viseme_aa: 0.9 }, oh: { jawOpen: 0.45, viseme_O: 0.9 }, ee: { jawOpen: 0.2, viseme_I: 0.9 } };
for (const [name, bs] of Object.entries(POSES)) {
  const url = await page.evaluate((bs) => { const r = window.H.stage.rig; r.clock = 10; for (let i = 0; i < 60; i++) { r.clock += 1 / 60; r.apply(bs, [0, 0, 0], [0, 0], 0, 0); } r.render(); return window.H.stage.canvas.toDataURL("image/png"); }, bs);
  fs.writeFileSync(`${OUT}/m-${name}.png`, Buffer.from(url.split(",")[1], "base64"));
}
await b.close(); srv.kill();
