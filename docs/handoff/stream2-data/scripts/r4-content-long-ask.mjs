// Round 4 · stream 2: a whole kit question (4A sends up to 180 characters, 7565adf) on today's Desk QuestionCard at
// 360 x 800 and 412 x 915, Older (b3) and Young (b2), over the Desk's question states: every word visible (no clamp, no
// "…", nothing clipped by the card or an ancestor), and the Answer dock wholly on screen and not overlapped by the card.
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-content-long-ask.mjs [--out DIR]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const OUT = argv.includes("--out") ? path.resolve(argv[argv.indexOf("--out") + 1]) : null;
if (OUT) fs.mkdirSync(OUT, { recursive: true });
// 180 characters: the length of the longest kit prompts 4A now sends whole
const ASK = "Ek rassi 24 cm lambi hai. Riya usse ek aayat banati hai jiski lambai chaudai se 4 cm zyada hai. Aayat ki lambai aur chaudai kitni hogi, aur iska kshetrafal kitne varg cm hai? Socho";
if (ASK.length !== 180) throw new Error(`the question is ${ASK.length} characters, not 180`);
const FIXTURES = ["your_turn", "speaking", "work-your_turn", "work-tiles", "work-pad", "work-beat", "hint-line", "listening"];
const { createServer } = await import("vite");
const vite = await createServer({ root: ROOT, configFile: path.join(ROOT, "vite.config.ts"), logLevel: "silent", server: { port: 0, host: "127.0.0.1", hmr: false } });
await vite.listen();
const base = vite.resolvedUrls.local[0].replace(/\/$/, "");
const { chromium } = await import("playwright");
const browser = await chromium.launch();
let fails = 0, n = 0;
try {
  for (const f of FIXTURES) for (const band of ["b3", "b2"]) for (const [w, h] of [[360, 800], [412, 915]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    try {
      await page.goto(`${base}/dev/desk?fixture=${f}&band=${band}&theme=light&motion=reduce&ask=${encodeURIComponent(ASK)}`);
      await page.waitForSelector('[data-testid="ask"]', { timeout: 30_000 });
      await page.waitForTimeout(500);
      const r = await page.evaluate((ask) => {
        const el = document.querySelector('[data-testid="ask"]');
        const text = el.textContent ?? "";
        const box = el.getBoundingClientRect();
        const problems = [];
        if (!text.includes(ask)) problems.push(`text changed: "${text.slice(-24)}"`);
        if (/…|\.\.\.$/.test(text)) problems.push("ellipsis in the text");
        for (let a = el; a; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (cs.textOverflow === "ellipsis" && cs.overflow !== "visible") problems.push(`text-overflow on ${a.className}`);
          if (cs.webkitLineClamp && cs.webkitLineClamp !== "none") problems.push(`line-clamp ${cs.webkitLineClamp} on ${a.className}`);
          if (a !== el && cs.overflow !== "visible") {
            const ar = a.getBoundingClientRect();
            if (box.bottom > ar.bottom + 0.5 || box.top < ar.top - 0.5 || box.right > ar.right + 0.5) problems.push(`clipped by ${a.className || a.tagName} (${Math.round(box.bottom)} > ${Math.round(ar.bottom)})`);
          }
        }
        if (box.bottom > innerHeight) problems.push(`below the fold (${Math.round(box.bottom)} > ${innerHeight})`);
        const dock = document.querySelector(".dk-dock");
        const card = document.querySelector('[data-testid="question-card"]');
        if (dock) {
          const d = dock.getBoundingClientRect();
          if (d.bottom > innerHeight + 0.5 || d.top < 0) problems.push(`dock off screen (${Math.round(d.top)}-${Math.round(d.bottom)} of ${innerHeight})`);
          const c = card?.getBoundingClientRect();
          if (c && c.bottom > d.top + 0.5 && c.top < d.bottom) problems.push("card overlaps the dock");
        }
        return { problems, lines: Math.round(box.height / parseFloat(getComputedStyle(el).lineHeight || "24")), fontPx: parseFloat(getComputedStyle(el).fontSize) };
      }, ASK);
      n++;
      if (r.problems.length) fails++;
      console.log(`${r.problems.length ? "FAIL" : "ok  "} ${f} ${band} ${w}: ${r.lines} lines at ${r.fontPx}px${r.problems.length ? " · " + r.problems.join("; ") : ""}`);
      if (OUT) await page.screenshot({ path: path.join(OUT, `long-ask-${f}-${band}-${w}.png`) });
    } finally { await page.close(); }
  }
} finally { await browser.close(); await vite.close(); }
console.log(`${n} views, ${fails} failing`);
process.exit(fails ? 1 : 0);
