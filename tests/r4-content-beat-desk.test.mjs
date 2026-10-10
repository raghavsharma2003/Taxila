// Round 4 · stream 2 (content), v2: the beat-by-beat board on the REAL Desk (/dev/desk work-beat fixture, Vite dev server,
// Chromium) at 360 x 800, 412 x 915 and 1366 x 768, Older and Young: the card header and the board fit the tray, her
// caption stays visible, nothing scrolls sideways, every word ≥ 14 px (16 px Young). Skipped without Chromium.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const dir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const SKIP = !dir || !existsSync(dir) || !readdirSync(dir).some((d) => d.startsWith("chromium")) ? "no Chromium" : false;
let vite, browser, base;
before(async () => {
  if (SKIP) return;
  const { createServer } = await import("vite");
  vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
  await vite.listen();
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
  browser = await (await import("playwright")).chromium.launch();
});
after(async () => { await browser?.close(); await vite?.close(); });

for (const [w, h] of [[360, 800], [412, 915], [1366, 768]]) for (const band of ["b3", "b2"]) {
  test(`beat board at ${w}x${h} ${band}: card + board in the tray, caption visible, no sideways scroll, words at the floor`, { skip: SKIP, timeout: 90_000 }, async () => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    try {
      await page.goto(`${base}/dev/desk?fixture=work-beat&band=${band}&theme=light&motion=reduce`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="beat-card"]', { timeout: 60_000 });
      // the board draws from her line's audio anchor, or after the anchor grace with none (dev has no audio)
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="studio-box"] svg text').length > 0, null, { timeout: 20_000 }).catch(() => {});
      const m = await page.evaluate(() => {
        const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, b: b.bottom, r: b.right }; };
        const vis = (sel) => { const e = document.querySelector(sel); if (!e) return false; const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && b.width > 0 && b.height > 0 && b.bottom <= innerHeight && b.top >= 0; };
        const chips = [...document.querySelectorAll('[data-testid="beat-card"] span')].filter((e) => e.textContent.trim()).map((e) => parseFloat(getComputedStyle(e).fontSize));
        return { tray: r('[data-testid="tray"]'), card: r('[data-testid="beat-card"]'), box: r('[data-testid="studio-box"]'), captionVisible: vis('[data-testid="caption"]'),
          scrollW: document.documentElement.scrollWidth, chips, svgText: [...document.querySelectorAll('[data-testid="studio-box"] svg text')].length };
      });
      const young = band === "b2";
      assert.ok(m.tray && m.card && m.box, JSON.stringify(m));
      assert.ok(m.card.y >= m.tray.y - 1 && m.card.b <= m.box.y + 1, "the card header sits above the board, inside the tray");
      assert.ok(m.box.b <= m.tray.b + 1 && m.box.r <= m.tray.r + 1, "the board fits the tray");
      assert.ok(m.captionVisible || band === "b1", "her caption is visible");
      assert.ok(m.scrollW <= w, `no sideways scroll (${m.scrollW} > ${w})`);
      assert.ok(m.chips.length >= 1 && m.chips.every((px) => px >= (young ? 16 : 14)), `chip words ${m.chips.join(",")} px`);
      assert.ok(m.svgText > 0, "the board drew");
    } finally { await page.close(); }
  });
}
