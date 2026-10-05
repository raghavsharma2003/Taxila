// Quick visual check: mount one engine (default or catalogue spec), let its bot play, screenshot at given times.
//   node evals/studio-catalogue/shot.mjs <archetype> [--topic id --slot game|explainer] [--at 2000,6000,12000] [--out dir] [--w 1024 --h 640]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch, runBot, serve, sleep, waitReady } from "../../src/studio-v2/tools/pw.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const id = args[0], topic = opt("--topic", null), slot = opt("--slot", "game");
const at = opt("--at", "2500,8000,16000").split(",").map(Number);
const out = opt("--out", "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/shots");
fs.mkdirSync(out, { recursive: true });
const { server, base } = await serve(path.join(repo, "docs/design/values/v3/gallery"));
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: +opt("--w", 1024), height: +opt("--h", 640) } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 300)));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 300)); });
const q = `?engine=${encodeURIComponent(id)}&seed=${opt("--seed", "7")}&sound=off${topic ? `&topic=${topic}&slot=${slot}` : ""}${opt("--mut", null) ? `&mut=${opt("--mut")}` : ""}${opt("--fixture", null) ? `&fixture=${opt("--fixture")}` : ""}`;
await page.goto(base + q);
await waitReady(page, 15000);
const t0 = Date.now();
const files = [];
for (const t of at) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await runBot(page, { maxMs: wait });
  const f = path.join(out, `${id.replace(/[^a-z0-9]/gi, "_")}${topic ? "_" + topic : ""}${opt("--fixture", null) ? "_" + opt("--fixture") : ""}_${t}.png`);
  await page.screenshot({ path: f });
  files.push(f);
}
const info = await page.evaluate(() => { const h = window.__sv2; return { rung: h.rung(), repairs: h.repairs, fellBack: h.fellBack, tooSmall: h.tooSmall.slice(0, 8), safeHits: h.safeHits.slice(0, 6), seam: h.seam(), answers: h.log.filter((m) => m.k === "answer").map((m) => ({ id: m.itemId, v: m.grade?.verdict })), events: [...new Set(h.log.filter((m) => m.k === "event").map((m) => m.name))] }; });
console.log(JSON.stringify({ files, errors, ...info }, null, 1));
await browser.close(); server.close();
