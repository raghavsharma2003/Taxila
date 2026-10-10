// Round 4 · stream 2 (content): the stage box contract (BUILD-PLAN §2 S0.5), measured, never typed.
// Opens the Desk dev page (/dev/desk, its own Vite dev server) at 360 x 800, 412 x 915 and 1366 x 768 with the
// `work-studio` fixture (a Studio piece in the Work tray, the default 1-2 line question card, no trouble strip) and the
// `work-play` fixture (a play piece: play mode folds the card), for the Older (b3) and Young (b2) Desks, and records the
// box the Studio stage actually gets (`[data-testid="studio-stage"]`, the area every piece is fitted into).
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-content-box-contract.mjs [--write] [--check]
// --write  writes docs/design/round4/build/box-contract.json (stream 2 owns it: a box may grow, never shrink)
// --check  fails (exit 1) when any measured box is smaller than the committed contract
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILE = join(ROOT, "docs", "design", "round4", "build", "box-contract.json");
const SIZES = [{ vp: "p360", width: 360, height: 800 }, { vp: "p412", width: 412, height: 915 }, { vp: "l1366", width: 1366, height: 768 }];
const BANDS = ["b3", "b2"];

export async function measureBoxes() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { createServer } = await import("vite");
  const vite = await createServer({ root: ROOT, configFile: join(ROOT, "vite.config.ts"), logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1" } });
  await vite.listen();
  const base = vite.resolvedUrls.local[0].replace(/\/$/, "");
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const out = {};
  try {
    for (const band of BANDS) for (const fx of ["work-studio", "work-play"]) for (const s of SIZES) {
      const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
      await page.goto(`${base}/dev/desk?fixture=${fx}&band=${band}&theme=light&motion=reduce`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="studio-stage"]', { timeout: 60_000 });
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => {
        const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.x), y: Math.round(b.y) }; };
        return { stage: box('[data-testid="studio-stage"]'), tray: box('[data-testid="tray"]'), card: box(".dk-card"), scrollW: document.documentElement.scrollWidth };
      });
      await page.close();
      const key = fx === "work-play" ? "play" : "tray";
      ((out[band] ??= {})[key] ??= {})[s.vp] = { viewport: { w: s.width, h: s.height }, box: { w: r.stage.w, h: r.stage.h }, at: { x: r.stage.x, y: r.stage.y }, overflowX: r.scrollW > s.width };
    }
  } finally { await browser.close(); await vite.close(); }
  return out;
}

const smaller = (a, b) => a.w < b.w || a.h < b.h;

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = await measureBoxes();
  console.log(JSON.stringify(m, null, 1));
  let failed = false;
  if (process.argv.includes("--check") && existsSync(FILE)) {
    const c = JSON.parse(readFileSync(FILE, "utf8"));
    for (const band of BANDS) for (const key of ["tray", "play"]) for (const s of SIZES) {
      const want = c.boxes?.[band]?.[key]?.[s.vp]?.box, got = m[band]?.[key]?.[s.vp]?.box;
      if (want && got && smaller(got, want)) { failed = true; console.error(`SHRUNK ${band} ${key} ${s.vp}: ${got.w}x${got.h} < contract ${want.w}x${want.h}`); }
    }
    console.log(failed ? "box contract: FAIL" : "box contract: every box ≥ the contract");
  }
  if (process.argv.includes("--write")) {
    const prev = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : null;
    // grow, never shrink: a smaller measurement never lowers the contract
    const boxes = structuredClone(m);
    if (prev?.boxes) for (const band of BANDS) for (const key of ["tray", "play"]) for (const s of SIZES) {
      const p = prev.boxes?.[band]?.[key]?.[s.vp]?.box, n = boxes[band][key][s.vp].box;
      if (p && smaller(n, p)) { failed = true; console.error(`refusing to shrink ${band} ${key} ${s.vp}`); boxes[band][key][s.vp].box = p; }
    }
    writeFileSync(FILE, JSON.stringify({
      v: 1, owner: "stream 2 (content)", rule: "grow a box, never shrink one",
      method: "tests/prod/r4-content-box-contract.mjs: /dev/desk work-studio and work-play fixtures (1-2 line question card, no trouble strip), Vite dev server, headless Chromium, the [data-testid=studio-stage] rect",
      measuredAt: new Date().toISOString().slice(0, 10),
      bands: { b3: "Older Desk (classes 5-9)", b2: "Young Desk (classes 1-4)" },
      boxes,
    }, null, 1) + "\n");
    console.log(`wrote ${FILE}`);
  }
  process.exit(failed ? 1 : 0);
}
