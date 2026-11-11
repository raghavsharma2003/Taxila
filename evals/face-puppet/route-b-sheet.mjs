// Round 7 route (b): the same Diya line, the same instants, three faces: r8 (today's default), lamp2 (painted keys, the
// owner cohort) and lamp2 + the 2.5D jaw layer (route b). Frames from the production stage on the harness's scripted
// clock (the visemes, words and PCM tap as the lesson feeds them).  node evals/face-puppet/route-b-sheet.mjs <outDir> [line=03]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
const [out, line = "03"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", "4725"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 600));
const meta = JSON.parse(fs.readFileSync(`evals/face-puppet/out/diya/${line}.json`, "utf8"));
// instants: a seal (first bilabial), the widest vowel, and evenly spread others, 8 in all
const at0 = 600;
const bil = meta.visemes.find((v) => v.id === 21)?.ms ?? 300;
const times = [...new Set([bil, ...Array.from({ length: 7 }, (_, i) => Math.round(((i + 0.5) / 7) * Math.min(meta.ms, 3200)))])].sort((a, b) => a - b).slice(0, 8);
const ARMS = [["r8", "r8", false], ["lamp2", "lamp2", false], ["lamp2 + jaw (route b)", "lamp2", true]];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const rows = [];
for (const [label, look, jaw] of ARMS) {
  const page = await browser.newPage({ viewport: { width: 700, height: 760 } });
  await page.goto(`http://127.0.0.1:4725/h/index.html?mode=capture&px=480&look=${look}${jaw ? "&jaw=1" : ""}`);
  await page.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 60000 });
  const err = await page.evaluate("window.H.error"); if (err) throw new Error(err);
  await page.evaluate(() => { const h = document.getElementById("host"); h.style.width = "480px"; h.style.height = "480px"; window.H.stage.attach(h, "close"); });
  await page.evaluate(async ([line, at0]) => { window.H.at(200); await window.H.line(line, at0); window.H.status("speaking"); }, [line, at0]);
  const shots = [];
  for (const t of times) shots.push(await page.evaluate((ms) => window.H.shot(ms, "image/png"), at0 + t));
  shots.forEach((u, i) => fs.writeFileSync(`${out}/${look}${jaw ? "-jaw" : ""}-${String(i).padStart(2, "0")}.png`, Buffer.from(u.split(",")[1], "base64")));
  rows.push({ label, file: `${look}${jaw ? "-jaw" : ""}` });
  await page.close();
}
await browser.close(); srv.kill();
const words = times.map((t) => (meta.words.find((w) => t >= w.ms && t <= w.ms + w.durMs)?.text ?? "·"));
fs.writeFileSync(`${out}/sheet.json`, JSON.stringify({ line, text: meta.text, times, words, rows }, null, 1));
console.log(meta.text, times, words);
