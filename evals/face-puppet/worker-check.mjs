// Round 7: is the rig drawing in a worker? /dev/avatar?via=lesson (the lesson's face), forced live; reads the stage log.
//   node evals/face-puppet/worker-check.mjs <baseUrl> [extraQuery]
import { chromium } from "playwright";
const [base = "http://127.0.0.1:5173", extra = ""] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 420, height: 560 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await p.route("**/api/face/config*", (r) => r.fulfill({ json: { puppet2d: true, look: "r8" } }));
if (process.env.NO_OFFSCREEN) await p.addInitScript(() => { delete window.OffscreenCanvas; });
await p.goto(`${base}/dev/avatar?via=lesson&tutor=asha&class=6&status=speaking&puppet=1&facerig=1${extra}`);
await p.waitForTimeout(8000);
const r = await p.evaluate(() => ({ log: (window.__puppet?.log ?? []).map((e) => `${e.type}${e.path ? ":" + e.path : ""}${e.reason ? ":" + e.reason : ""}`), phase: document.querySelector("[data-face]")?.getAttribute("data-phase"), snap: window.__puppet?.snapshot?.() }));
await p.screenshot({ path: process.env.SHOT ?? "/tmp/claude-0/wcheck.png" });
console.log(JSON.stringify({ ...r, errs: errs.slice(0, 5) }, null, 1));
await b.close();
