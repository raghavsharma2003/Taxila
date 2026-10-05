// Rest-pose parity: the PRODUCTION loader + shipped WebP pack (public/face-puppet/<rev>) drawn by the synced runtime at rest,
// scored against c-front with the polish rounds' own SSIM script (scripts/character/puppet2d/polish-r8/restssim.py).
//   node evals/face-puppet/rest-parity.mjs
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", "4724"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 760, height: 760 } });
await p.goto("http://127.0.0.1:4724/h/index.html?mode=capture&px=720");
await p.waitForFunction("window.H && window.H.ready", null, { timeout: 60000 });
const d = await p.evaluate("window.H.rawRest()");
fs.writeFileSync("evals/face-puppet/out/rest-raw.png", Buffer.from(d.split(",")[1], "base64"));
await b.close(); srv.kill();
const out = execFileSync("python3", ["scripts/character/puppet2d/polish-r8/restssim.py", "evals/face-puppet/out/rest-raw.png"]).toString().trim();
fs.writeFileSync("evals/face-puppet/out/rest-parity.json", JSON.stringify({ date: new Date().toISOString().slice(0, 10), result: out, note: "r7 judge reported rest SSIM 0.962 (head) for the art build" }, null, 1));
console.log(out);
