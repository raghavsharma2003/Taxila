// forge3 visual QA driver: render one Studio artifact in the REAL Desk tray + StudioStage (the built harness page) in
// Chromium at each judged size, measure what is on screen, screenshot it, and judge it (checks.js).
//
// Generated content never runs in the trusted API process: like the Studio gate (server/studio/qa/pool.js), a local
// Chromium is allowed only when FORGE3_QA_LOCAL=1 (bench, tests, CI certification, the forge3-qa service image); the
// API calls the service over FORGE3_QA_URL (qa-service.mjs) and treats "unavailable" as "not judged" = not shown.
//
// Time: the page clock is Playwright's fake clock, so a 12 s whiteboard or a timed explainer is judged at its END state
// (everything drawn) in milliseconds of wall time, and also at an early frame. Wall time per view ≈ 150-400 ms warm.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { measureStage, canvasTextProbe } from "./measure.js";
import { judgeView, judgePiece, QA_VERSION } from "./checks.js";
import { GATE_VIEWPORTS } from "./viewports.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(here, "../../..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };

/** A static server for the built harness; /fonts/* and /assets/gen/* fall back to the repo's public/ (product fonts and art). */
export function serveHarness(dir) {
  const roots = [dir, path.join(REPO, "public")];
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    for (const root of roots) {
      let p = path.normalize(path.join(root, decodeURIComponent(u.pathname)));
      if (!p.startsWith(root)) break;
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream", "cache-control": "no-store" });
        fs.createReadStream(p).pipe(res);
        return;
      }
    }
    res.writeHead(404).end("not found");
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, base: `http://127.0.0.1:${server.address().port}/` })));
}

/** Build the harness page (vite, its own config) into `out`. ~2-3 s. */
export async function buildHarness(out) {
  const { build } = await import("vite");
  process.env.FORGE3_QA_OUT = out;
  await build({ configFile: path.join(here, "vite.config.mjs"), logLevel: "error", build: { outDir: out } });
  return out;
}

/**
 * A judge session: one Chromium page on the harness, reused for many artifacts.
 * @param {{ browser: import("playwright").Browser, base: string }} o
 */
export async function openJudge({ browser, base }) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: "no-preference" });
  await context.addInitScript(canvasTextProbe);
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 200)));
  await page.clock.install();
  await page.goto(base, { waitUntil: "load" });
  await page.waitForFunction(() => window.__forge3?.ready === true, null, { timeout: 20_000 });
  let n = 0;
  return {
    page,
    /**
     * Judge one artifact at each size. Returns per-view metrics, verdicts and (optionally) screenshot files.
     * @param {object} artifact  a StudioArtifact (whiteboard | stagecraft | skeleton | image | frame | play)
     * @param {{ viewports?: object[], young?: boolean, lang?: string, shotDir?: string, shotTag?: string, settleMs?: number, earlyMs?: number, playLevel?: { level: unknown, art: unknown } }} [opt]
     */
    async judge(artifact, opt = {}) {
      const views = [];
      const vps = opt.viewports ?? GATE_VIEWPORTS;
      const settle = opt.settleMs ?? settleFor(artifact);
      for (const v of vps) {
        const t0 = Date.now();
        await page.setViewportSize({ width: v.viewport.width, height: v.viewport.height });
        pageErrors.length = 0;
        // a play level (kind "playlevel": { level, art, classLevel }) is judged in play mode on the play stream's PlayStage
        const job = artifact.kind === "playlevel"
          ? { play: { level: artifact.level, art: artifact.art, lang: opt.lang ?? "en", classLevel: artifact.classLevel ?? 6 }, artifact: null, tray: v.tray, id: `j${++n}` }
          : { artifact, tray: v.tray, young: !!opt.young, lang: opt.lang ?? "en", id: `j${++n}`, ...(opt.playLevel ? { playLevel: opt.playLevel } : {}) };
        await page.evaluate((jb) => window.__forge3.show(jb), job);
        // real time for the lazy chunks (controller, engines, fonts) to load and boot; then the fake clock runs the piece
        await page.waitForTimeout(opt.bootMs ?? 250);
        await page.clock.runFor(opt.earlyMs ?? 600);
        await page.waitForTimeout(60);
        let early = null;
        if (opt.early) early = await page.evaluate(measureStage);
        await page.clock.runFor(Math.max(0, settle - (opt.earlyMs ?? 600)));
        await page.waitForTimeout(80);
        const m = await page.evaluate(measureStage);
        const events = await page.evaluate(() => window.__forge3.events.slice());
        for (const e of pageErrors) events.push({ type: "pageerror", message: e });
        const verdict = judgeView(m, { young: opt.young, events, artifactKind: artifact.kind });
        let file = null;
        if (opt.shotDir) {
          fs.mkdirSync(opt.shotDir, { recursive: true });
          file = path.join(opt.shotDir, `${opt.shotTag ?? "piece"}-${v.vp}.png`);
          const clip = m.tray ? { x: Math.max(0, m.tray.x - 16), y: Math.max(0, m.tray.y - 16), width: m.tray.w + 32, height: m.tray.h + 32 } : undefined;
          await page.screenshot({ path: file, ...(clip ? { clip } : {}) }).catch(() => { file = null; });
        }
        views.push({ vp: v.vp, tray: v.tray, metrics: m, early, events, verdict, file, ms: Date.now() - t0 });
      }
      return { v: QA_VERSION, kind: artifact.kind, views, piece: judgePiece(views) };
    },
    async close() { await context.close().catch(() => {}); },
  };
}

/** How long a piece runs before its end state is judged (fake-clock ms): a whiteboard's own duration + the anchor grace. */
export function settleFor(a) {
  if (a?.kind === "whiteboard") return Math.min(30_000, (Number(a.script?.durationMs) || 4000) + 2500);
  if (a?.kind === "stagecraft") return 6000;
  if (a?.kind === "playlevel") return 1800;
  // a play piece on the Studio stage: its level fetch, and on a refused box the board twin's own drawing (anchor grace)
  if (a?.kind === "play") return 4500;
  return 2500;
}

/** Launch the local Chromium (only where FORGE3_QA_LOCAL=1: never in the trusted API process). */
export async function launchLocal() {
  if (process.env.FORGE3_QA_LOCAL !== "1") throw new Error("forge3 local QA refused: set FORGE3_QA_LOCAL=1 (bench / tests / the forge3-qa image only)");
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { chromium } = await import("playwright");
  return chromium.launch({ args: ["--no-proxy-server", "--autoplay-policy=no-user-gesture-required"] });
}
