// c3 fork of scripts/character/harness.mjs (only the page path and port differ).
// Shared harness: a Vite dev server rooted at the repo (so the viewer can import src/avatar/*.ts unchanged) and a
// headless Chromium page on SwiftShader (software WebGL2: every timing from it is a CPU-rasteriser number).
import { createServer } from "vite";
import { chromium } from "playwright";

export async function openHarness({ w = 720, h = 900, dpr = 1, msaa = 1, port = 5593 } = {}) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const server = await createServer({ root: process.cwd(), configFile: false, logLevel: "error",
    server: { port, strictPort: false, host: "127.0.0.1", fs: { strict: false } }, optimizeDeps: { noDiscovery: true, include: [] } });
  await server.listen();
  const url = server.resolvedUrls.local[0].replace(/\/$/, "");
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${url}/scripts/character/candidates/c3/viewer/index.html?w=${w}&h=${h}&dpr=${dpr}&msaa=${msaa}${process.env.KTX_RAW ? "&ktxRaw=1" : ""}`);
  await page.waitForFunction(() => window.TX_READY === true, null, { timeout: 120000 });
  return {
    page, errors,
    async shot(file) {
      const el = await page.$("canvas");
      await el.screenshot({ path: file });
    },
    async close() { await browser.close(); await server.close(); },
  };
}
