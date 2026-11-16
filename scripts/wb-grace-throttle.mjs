// 14.4 (main): run against `npx vite preview --port 4173` (the production build): node scripts/wb-grace-throttle.mjs [base] [rates] [n]
// 14.4 (main): does a throttled phone miss the whiteboard's 1.2 s grace? Production build (vite preview), API mocked, Chromium
// CPU throttling via CDP. Per run: svg mount (MutationObserver), first animation frame after it, the board clock then, and
// the board clock's own start (mount + grace when no anchor comes).
import { chromium } from "playwright";
import { expand } from "../server/forge/explainer/templates.js";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173";
const RATES = (process.argv[3] ?? "1,4,6").split(",").map(Number);
const N = Number(process.argv[4] ?? 8);
const KID = { id: "kid-wb", first_name: "Kabir", class_level: 6, language_pref: "hinglish", teacher_id: "arjun" };
const x = expand({ template: "flow@1", steps: ["sunlight", "leaf", "food"] }, { lessonId: "L-wb", scriptId: "s-grace" });
const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio",
  studioSlot: { slotId: "slot1", intentId: "i1", state: "revealed", artifact: { kind: "whiteboard", script: x.script } } };
const browser = await chromium.launch();
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const out = {};
for (const rate of RATES) {
  const rows = [];
  for (let i = 0; i < N; i++) {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate });
    await page.addInitScript(() => {
      window.__g = {};
      new MutationObserver(() => {
        if (window.__g.mount) return;
        const svg = document.querySelector('[data-testid="studio-box"] svg');
        if (!svg) return;
        window.__g.mount = performance.now();
        requestAnimationFrame(() => { window.__g.frame = performance.now(); window.__g.tAtFrame = Number(svg.getAttribute("data-wb-t")); });
      }).observe(document, { subtree: true, childList: true });
    });
    await page.route("**/api/**", async (route) => {
      const p = new URL(route.request().url()).pathname;
      const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
      if (p === "/api/lesson/start") return json(200, { lessonId: "L-wb", topic: { id: "c5-maths-ch02-t01", title: "Fractions", chapter: "Fractions" },
        teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui, teacherOpening: "Dekho.", teacherOpeningSeq: 1 });
      if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
      return json(200, {});
    });
    await page.goto(`${BASE}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForFunction(() => window.__g?.frame, null, { timeout: 60_000 });
      // the clock's start, read once it runs: start = now - t
      await page.waitForFunction(() => Number(document.querySelector('[data-testid="studio-box"] svg')?.getAttribute("data-wb-t")) > 0, null, { timeout: 60_000 });
      const g = await page.evaluate(() => { const svg = document.querySelector('[data-testid="studio-box"] svg'); return { ...window.__g, start: performance.now() - Number(svg.getAttribute("data-wb-t")) }; });
      rows.push({ firstFrameMs: Math.round(g.frame - g.mount), tAtFirstFrame: g.tAtFrame, graceMs: Math.round(g.start - g.mount) });
    } catch (e) { rows.push({ error: String(e.message).slice(0, 80) }); }
    await page.close();
  }
  const ok = rows.filter((r) => !r.error);
  out[`${rate}x`] = { n: ok.length, errors: rows.length - ok.length,
    firstFrame: { p50: pct(ok.map((r) => r.firstFrameMs), 0.5), p95: pct(ok.map((r) => r.firstFrameMs), 0.95) },
    clockAtFirstFrame: { p50: pct(ok.map((r) => r.tAtFirstFrame), 0.5), p95: pct(ok.map((r) => r.tAtFirstFrame), 0.95) },
    graceFromMount: { p50: pct(ok.map((r) => r.graceMs), 0.5), p95: pct(ok.map((r) => r.graceMs), 0.95) }, drawnBeforeFirstFrame: ok.filter((r) => r.tAtFirstFrame > 0).length, rows };
  console.log(rate + "x", JSON.stringify({ ...out[`${rate}x`], rows: undefined }));
}
await browser.close();
