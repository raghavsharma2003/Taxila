// Round 4 · stream 2: the tray under the Kaksha skin, before (no skin) and after (data-skin="kaksha" over Kaksha's tokens),
// at 360 x 800, 412 x 915 and 1366 x 768, Older (night) and Young (dawn): the board beat (work-beat) and a skeleton
// activity (work-skeleton) on /dev/desk. For every AFTER shot it measures, in the page: the smallest tray text in CSS px
// (14 px Older / 16 px Young floor) and every board text's contrast against the board ground (≥ 4.5:1; the skin aims 5:1).
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-content-skin-shots.mjs [--out DIR]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const OUT = path.resolve(argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : path.join(ROOT, "docs", "design", "round4", "build", "content", "shots", "skin"));
fs.mkdirSync(OUT, { recursive: true });
const { createServer } = await import("vite");
const vite = await createServer({ root: ROOT, configFile: path.join(ROOT, "vite.config.ts"), logLevel: "error", server: { port: 0, host: "127.0.0.1", hmr: false } });
await vite.listen();
const base = vite.resolvedUrls.local[0].replace(/\/$/, "");
const { chromium } = await import("playwright");
const browser = await chromium.launch();
// Kaksha's tokens as a KakshaLesson page has them (the dev mirror of Kaksha's tokens.css until Kaksha lands; never in
// src/): injected before any page script, because the board reads the resolved tokens once, on mount
const MIRROR = fs.readFileSync(path.join(ROOT, "tests", "fixtures", "kaksha-tokens.mirror.css"), "utf8");
const injectTokens = (css) => { const add = () => { const st = document.createElement("style"); st.dataset.mirror = "kaksha"; st.textContent = css; (document.head || document.documentElement).appendChild(st); }; if (document.documentElement) add(); else document.addEventListener("readystatechange", add, { once: true }); };
const rows = [];
let fails = 0;
try {
  for (const fixture of ["work-beat", "work-skeleton"]) for (const band of ["b3", "b2"]) for (const [w, h, vp] of [[360, 800, "p360"], [412, 915, "p412"], [1366, 768, "l1366"]]) for (const skin of ["", "kaksha"]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    try {
      if (skin) await page.addInitScript(injectTokens, MIRROR);
      await page.goto(`${base}/dev/desk?fixture=${fixture}&band=${band}&theme=light&motion=reduce${skin ? `&skin=${skin}` : ""}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="studio-stage"]', { timeout: 60_000 });
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="studio-stage"] svg text').length > 0, null, { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(600);
      const m = await page.evaluate(() => {
        const lum = (c) => { const m = String(c).match(/[\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const ratio = (a, b) => { const x = lum(a), y = lum(b); if (x == null || y == null) return null; const [hi, lo] = x > y ? [x, y] : [y, x]; return (hi + 0.05) / (lo + 0.05); };
        const stage = document.querySelector('[data-testid="studio-stage"]');
        const texts = [...(stage?.querySelectorAll("svg text") ?? [])].filter((t) => t.getBoundingClientRect().height > 0 && getComputedStyle(t).opacity !== "0");
        const minPx = texts.length ? Math.min(...texts.map((t) => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM()?.a ?? 1))) : null;
        // the board's ground: the first full-size rect of the board svg (Player draws it first), else the stage background
        const svg = stage?.querySelector("svg");
        const groundEl = svg?.querySelector("rect");
        const ground = groundEl ? getComputedStyle(groundEl).fill : getComputedStyle(stage).backgroundColor;
        const worst = texts.reduce((acc, t) => { const r = ratio(getComputedStyle(t).fill, ground); return r != null && (acc == null || r < acc.r) ? { r, text: t.textContent } : acc; }, null);
        return { skin: document.querySelector("[data-skin]")?.getAttribute("data-skin") ?? null, texts: texts.length, minPx: minPx && Math.round(minPx * 10) / 10, ground, worst: worst && { r: Math.round(worst.r * 100) / 100, text: String(worst.text).slice(0, 20) } };
      });
      const file = path.join(OUT, `${fixture}-${band}-${vp}-${skin || "before"}.png`);
      await page.screenshot({ path: file });
      const floor = band === "b2" ? 16 : 14;
      const bad = skin && (m.skin !== "kaksha" || (m.minPx != null && m.minPx < floor - 0.25) || (fixture === "work-beat" && (!m.worst || m.worst.r < 4.5)));
      if (bad) fails++;
      rows.push({ fixture, band, vp, skin: skin || "before", ...m, file: path.relative(ROOT, file), ok: !bad });
      console.log(`${bad ? "FAIL" : "ok  "} ${fixture} ${band} ${vp} ${skin || "before"}: minPx ${m.minPx} worst contrast ${m.worst?.r ?? "-"} (${m.worst?.text ?? ""}) ground ${m.ground}`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); await vite.close(); }
// ── module frames (the sandboxed iframe from the product build): the host passes Kaksha's resolved tokens in init ──
if (fs.existsSync(path.join(ROOT, "dist", "modules.html"))) {
  const { serveDist } = await import("../../server/forge3/certify-tray.js");
  const { contractBox } = await import("../../server/forge3/tray-gate.js");
  // the theme values a KakshaLesson page resolves (parsed from the dev mirror of Kaksha's tokens.css until Kaksha lands)
  const css = MIRROR;
  const block = (sel) => { const i = css.indexOf(sel); const b = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i)); return Object.fromEntries([...b.matchAll(/(--k-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])); };
  const night = block(".kx, .kx[data-ktheme=\"night\"]"), dawn = { ...night, ...block('.kx[data-ktheme="dawn"]') };
  const { server, base: db } = await serveDist(path.join(ROOT, "dist"));
  const b2 = await chromium.launch();
  try {
    for (const [engine, params, band] of [["geoboard@1", { mode: "build", ask: "perimeter", perimeter: 12 }, "older"], ["place-value@1", { mode: "build", value: 45236, places: 5 }, "older"], ["fraction-bars@1", { mode: "build", parts: 4 }, "young"]])
      for (const [w, h, vp] of [[360, 800, "p360"], [412, 915, "p412"], [1366, 768, "l1366"]]) for (const skin of ["", "kaksha"]) {
        const page = await b2.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
        try {
          await page.goto(`${db}/host.html`);
          const box = contractBox(vp, { young: band === "young" });
          await page.evaluate((o) => window.mount(o), { engine, params, ageBand: band === "young" ? "6-9" : "10-15", w: box.w, h: box.h, skin: skin ? (band === "young" ? dawn : night) : undefined });
          await page.waitForTimeout(2500);
          const name = `module-${engine.replace("@1", "")}-${band}-${vp}-${skin || "before"}.png`;
          await page.locator("#tray").screenshot({ path: path.join(OUT, name) });
          const fr = page.frames().find((f) => f.url().includes("modules.html"));
          const marked = fr ? await fr.evaluate(() => document.documentElement.dataset.skin ?? null).catch(() => null) : null;
          const bad = skin && marked !== "kaksha";
          if (bad) fails++;
          rows.push({ fixture: `module ${engine}`, band, vp, skin: skin || "before", frameSkin: marked, file: path.join(path.relative(ROOT, OUT), name), ok: !bad });
          console.log(`${bad ? "FAIL" : "ok  "} module ${engine} ${band} ${vp} ${skin || "before"}: frame data-skin ${marked}`);
        } finally { await page.close(); }
      }
  } finally { await b2.close(); server.close(); }
} else console.log("module shots skipped: no dist/modules.html (npx vite build)");
fs.writeFileSync(path.join(OUT, "skin-shots.json"), JSON.stringify({ at: new Date().toISOString(), rows }, null, 1));
console.log(`${rows.length} shots, ${fails} failing → ${OUT}`);
process.exit(fails ? 1 : 0);
