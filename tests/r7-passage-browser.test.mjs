// The passage artifact in the REAL Studio stage (the forge3 harness: Desk tray + StudioStage, Chromium) at p360, p412 and
// l1366: 16 px type or more, line height ≥ 1.6 × the type (Devanagari matras), no sideways overflow, page buttons ≥ 44 px,
// the shown text exactly the page's text, and the page buttons turn it. Skipped without Chromium.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { passageArtifact, pagePassage } from "../server/studio/passage.js";

const dir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const SKIP = !fs.existsSync(dir) || !fs.readdirSync(dir).some((d) => d.startsWith("chromium")) ? "no Chromium" : false;
const KITS = new URL("../data/kits/", import.meta.url);
const passages = fs.readdirSync(KITS).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(fs.readFileSync(new URL(f, KITS), "utf8")).topics ?? []).flatMap((t) => t.passages ?? []));
const pick = [
  passages.find((p) => /[ऀ-ॿ]/.test(p.text) && pagePassage(p).pages.length >= 2) ?? passages.find((p) => /[ऀ-ॿ]/.test(p.text)),
  passages.reduce((a, b) => (b.text.length > a.text.length ? b : a)),
];
let J, browser, server;
before(async () => {
  if (SKIP) return;
  const r = await import("../server/forge3/qa/render.js");
  const out = await r.buildHarness(fs.mkdtempSync(path.join(os.tmpdir(), "passage-h-")));
  const s = await r.serveHarness(out); server = s.server;
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ args: ["--no-proxy-server"] });
  J = await r.openJudge({ browser, base: s.base });
});
after(async () => { await J?.close(); await browser?.close(); server?.close(); });

test("passage in the real stage at p360, p412, l1366: ≥ 16 px, line height ≥ 1.6×, no sideways overflow, 44 px buttons, exactly the page's text", { skip: SKIP, timeout: 240_000 }, async () => {
  const { GATE_VIEWPORTS } = await import("../server/forge3/qa/viewports.js");
  for (const p of pick) {
    const art = passageArtifact(p, { page: 1 });
    for (const v of GATE_VIEWPORTS) {
      await J.page.setViewportSize(v.viewport);
      await J.page.evaluate((jb) => window.__forge3.show(jb), { artifact: art, tray: v.tray, young: false, lang: "en", id: `p-${p.id}-${v.vp}` });
      await J.page.waitForSelector('[data-testid="passage-text"]', { timeout: 20_000 });
      await J.page.clock.runFor(300);
      const m = await J.page.evaluate(() => {
        const t = document.querySelector('[data-testid="passage-text"]'), cs = getComputedStyle(t);
        const btns = [...document.querySelectorAll('[data-testid="passage"] button')].map((b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; });
        const box = document.querySelector('[data-testid="passage"]');
        return { text: t.textContent, fs: parseFloat(cs.fontSize), lh: parseFloat(cs.lineHeight), sw: t.scrollWidth, cw: t.clientWidth, bsw: box.scrollWidth, bcw: box.clientWidth, btns };
      });
      const tag = `${p.id} ${v.vp}`;
      assert.ok(m.fs >= 16, `${tag}: ${m.fs} px`);
      assert.ok(m.lh >= 1.6 * m.fs - 0.5, `${tag}: line height ${m.lh}`);
      assert.ok(m.sw <= m.cw + 1 && m.bsw <= m.bcw + 1, `${tag}: no sideways overflow (${m.sw}/${m.cw})`);
      assert.equal(m.text, art.passage.pages[0].text, `${tag}: exactly page 1`);
      for (const b of m.btns) assert.ok(b.w >= 44 && b.h >= 44, `${tag}: a ${b.w}×${b.h} button`);
      if (art.passage.pages.length > 1) {
        await J.page.click('[data-testid="passage-next"]');
        await J.page.clock.runFor(100);
        assert.equal(await J.page.textContent('[data-testid="passage-text"]'), art.passage.pages[1].text, `${tag}: next shows page 2`);
      }
    }
  }
});
