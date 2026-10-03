
// FPS of the 3D tutor in headless Chromium: SwiftShader software WebGL, NO GPU (a lower bound on desktop, not a
// phone number). Needs a dev server: `npx vite --port 5199` (the /dev/avatar page is dev-only).
//   node evals/avatar/fps-headless.mjs [base] [out.json]
import fs from "node:fs";
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5199";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const out = [];
for (const arm of [
  { name: "B speaking 1280x800", url: "/dev/avatar?view=face&tutor=asha&face=B&voice=1", w: 1280, h: 800 },
  { name: "B speaking 360x640", url: "/dev/avatar?view=face&tutor=arjun&face=B&voice=1", w: 360, h: 640 },
  { name: "B idle/your_turn 360x640", url: "/dev/avatar?view=face&tutor=uma&face=B&status=your_turn", w: 360, h: 640 },
  { name: "Blite speaking 360x640", url: "/dev/avatar?view=face&tutor=asha&face=Blite&voice=1", w: 360, h: 640 },
]) {
  const page = await browser.newPage({ viewport: { width: arm.w, height: arm.h } });
  await page.goto(base + arm.url);
  await page.waitForTimeout(1500);
  // independent rAF counter alongside the stage's own stats
  await page.evaluate(() => { window.__raf = []; const f = (t) => { window.__raf.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const t0 = await page.evaluate(() => window.__stage3d?.stats().frames ?? 0);
  await page.waitForTimeout(10000);
  const r = await page.evaluate((t0) => {
    const s = window.__stage3d; const st = s.stats();
    const raf = window.__raf; const rafFps = (raf.length - 1) / ((raf.at(-1) - raf[0]) / 1000);
    return { stage: st, framesInWindow: st.frames - t0, rafFps: +rafFps.toFixed(1), tierEvents: window.__avatar.events.filter((e) => e.type === "tier" || e.type === "pixels"), state: s.state, renderer: (() => { const gl = s.renderer.getContext(); const e = gl.getExtension("WEBGL_debug_renderer_info"); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; })() };
  }, t0);
  out.push({ arm: arm.name, ...r });
  console.log(JSON.stringify({ arm: arm.name, ...r }));
  await page.close();
}
await browser.close();
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: "headless Chromium 1194 (Playwright), SwiftShader WebGL2, 10 s window per arm after 1.5 s warm-up, stage stats (TH-1 capped loop) + an independent rAF counter", arms: out }, null, 1));
