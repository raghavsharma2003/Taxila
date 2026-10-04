// Shared Playwright plumbing for the Studio v2 tools: static server for the built gallery, browser launch (local
// files only: the sandbox proxy breaks Chromium, docs/ops/W1-PROD-RESULTS-2026-10-04.md), and the bot driver that
// turns an engine's `bot()` actions (world units) into REAL pointer events at the stage.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
export const repo = path.resolve(here, "../../..");
export const docs = path.join(repo, "docs/design/reset/prework/rs4");
export const galleryDir = path.join(docs, "gallery");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".jpg": "image/jpeg", ".webm": "video/webm" };
export function serve(dir = galleryDir) {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    let p = path.normalize(path.join(dir, decodeURIComponent(u.pathname)));
    if (!p.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, base: `http://127.0.0.1:${server.address().port}/` })));
}
export async function launch() {
  return chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--no-proxy-server", "--disable-gpu-vsync"], headless: true });
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Executes bot actions with real mouse events until `until()` resolves truthy or maxMs passes. */
export async function runBot(page, { maxMs = 60000, until = async () => false, log = () => {} } = {}) {
  const t0 = Date.now();
  let actions = 0;
  while (Date.now() - t0 < maxMs) {
    if (await until()) break;
    const a = await page.evaluate(() => window.__sv2?.bot() ?? { type: "wait", ms: 200 });
    if (!a) { await sleep(150); continue; }
    actions++;
    const map = async (xy) => page.evaluate(([x, y]) => window.__sv2.toClient(x, y), xy);
    try {
      if (a.type === "wait") { await sleep(Math.min(2000, a.ms ?? 200)); continue; }
      if (a.type === "tap") { const [x, y] = await map(a.at); await page.mouse.move(x, y); await page.mouse.down(); await sleep(40); await page.mouse.up(); }
      else if (a.type === "key") { await page.keyboard.press(a.key); }
      else if (a.type === "drag" || a.type === "path") {
        const pts = a.type === "drag" ? [a.from, a.to] : a.points;
        const ms = a.ms ?? 400, steps = Math.max(4, Math.round(ms / 16));
        const client = [];
        for (const p of pts) client.push(await map(p));
        await page.mouse.move(client[0][0], client[0][1]); await page.mouse.down();
        for (let s = 1; s < client.length; s++) {
          const [x0, y0] = client[s - 1], [x1, y1] = client[s], n = Math.max(2, Math.round(steps / (client.length - 1)));
          for (let i = 1; i <= n; i++) { const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; await page.mouse.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e); await sleep(ms / (n * (client.length - 1))); }
        }
        await sleep(30); await page.mouse.up();
      }
      if (a.after) await sleep(a.after);
    } catch (e) { log("bot action failed: " + e.message); await sleep(200); }
  }
  return { actions, ms: Date.now() - t0 };
}
export async function waitReady(page, ms = 8000) {
  await page.waitForFunction(() => document.querySelector(".sv2-stage")?.dataset.ready === "1", null, { timeout: ms });
}
/** Is the visible stage painted with something (not blank)? Samples the top canvas layer that is showing. */
export async function stagePainted(page) {
  return page.evaluate(() => {
    const st = document.querySelector(".sv2-stage");
    if (!st) return { painted: false, reason: "no-stage" };
    const onBoard = st.classList.contains("on-board");
    const c = st.querySelector(onBoard ? ".sv2-board" : ".sv2-canvas");
    const g = c.getContext("2d"), w = c.width, h = c.height;
    const d = g.getImageData(0, 0, w, h).data;
    let n = 0, s = 0, s2 = 0;
    const step = Math.max(4, Math.floor((w * h) / 4000)) * 4;
    for (let i = 0; i < d.length; i += step) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += l; s2 += l * l; n++; }
    const mean = s / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
    return { painted: sd > 3, sd: +sd.toFixed(2), mean: +mean.toFixed(1), rung: onBoard ? "board" : "engine" };
  });
}
/** Child-visible text that would betray a failure. */
export async function visibleFailureText(page) {
  return page.evaluate(() => {
    const t = [...document.querySelectorAll(".sv2-stage .sv2-hud, .sv2-stage .sv2-task, .sv2-stage .sv2-captions, .sv2-stage .sv2-label")].map((e) => e.textContent || "").join(" | ");
    const bad = /\b(undefined|NaN|null|error|failed|exception|loading|generating)\b|\[object/i.exec(t);
    return bad ? bad[0] : null;
  });
}
