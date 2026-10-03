// TEACHER-VISUAL.md measurement: the M0 procedural head (real /dev/avatar page) and synthetic proxies of the
// proposed Hero and B+ budgets, in headless Chromium with SwiftShader (software WebGL2, NO GPU).
// SwiftShader numbers are a CPU-rasteriser proxy for relative cost, never a phone number.
//   VITE_DEV_ROUTES=1 npx vite --port 5287   (repo root)
//   node docs/design/teacher/bench/measure.mjs [base] [out.json]
import fs from "node:fs";
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5287";
const REPS = 3, N = 90;
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--autoplay-policy=no-user-gesture-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const out = { date: new Date().toISOString().slice(0, 10), method: "", m0: [], proxy: [] };
out.method = `headless Chromium (Playwright ${(await import("playwright/package.json", { with: { type: "json" } })).default.version}), ANGLE SwiftShader WebGL2, ${(await import("node:os")).cpus().length} vCPU container. ` +
  `M0: /dev/avatar forced tier B, synthetic voice, 1.5 s warm-up, 10 s capped-loop window (stage stats) then the stage loop is stopped and ${N} frames are rendered back to back, each followed by a 1-pixel readPixels (a full pipeline sync; gl.finish() did not block under ANGLE/SwiftShader and read 0.1 ms), x${REPS}. ` +
  `Proxy: docs/design/teacher/bench/hero-proxy.html, same uncapped timing x${REPS}.`;

for (const arm of [
  { name: "M0 asha B speaking 360x640 medium", url: "/dev/avatar?view=face&tutor=asha&face=B&voice=1", w: 360, h: 640 },
  { name: "M0 arjun B speaking 360x640 close", url: "/dev/avatar?view=face&tutor=arjun&face=B&voice=1&framing=close", w: 360, h: 640 },
  { name: "M0 asha B speaking 1280x800 medium", url: "/dev/avatar?view=face&tutor=asha&face=B&voice=1", w: 1280, h: 800 },
]) {
  // (a) capped loop as shipped: 10 s window after 1.5 s, plus whatever the probe/governor decided on this machine.
  let page = await browser.newPage({ viewport: { width: arm.w, height: arm.h } });
  await page.goto(base + arm.url);
  await page.waitForFunction(() => !!window.__stage3d, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const f0 = await page.evaluate(() => window.__stage3d.stats().frames);
  await page.waitForTimeout(10000);
  const cappedRun = await page.evaluate((f0) => {
    const s = window.__stage3d;
    const tierEvents = (window.__avatar?.events || []).filter((e) => e.type === "tier" || e.type === "pixels" || e.type === "contextlost" || e.type === "fallback");
    return { capped: { ...s.stats(), framesInWindow: s.stats().frames - f0 }, tierEvents };
  }, f0);
  await page.close();
  // (b) uncapped render cost: a fresh page, measured 300 ms after the stage exists (before the 2 s probe can demote it).
  page = await browser.newPage({ viewport: { width: arm.w, height: arm.h } });
  await page.goto(base + arm.url);
  await page.waitForFunction(() => !!window.__stage3d, null, { timeout: 30000 });
  await page.waitForTimeout(300);
  const r = await page.evaluate(({ N, REPS }) => {
    const s = window.__stage3d;
    cancelAnimationFrame(s.raf);
    const gl = s.renderer.getContext(); const px = new Uint8Array(4);
    let morphMeshes = 0, morphTargets = 0, morphVerts = 0, meshes = 0;
    const mats = new Set();
    s.scene.traverse((o) => {
      if (!o.isMesh) return;
      meshes++; mats.add(o.material.type);
      if (o.morphTargetInfluences?.length) { morphMeshes++; morphTargets += o.morphTargetInfluences.length; morphVerts += o.geometry.attributes.position.count; }
    });
    const reps = [];
    for (let k = 0; k < REPS; k++) {
      const t = [];
      for (let i = 0; i < N; i++) { const t0 = performance.now(); s.renderer.render(s.scene, s.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); t.push(performance.now() - t0); }
      t.sort((a, b) => a - b); reps.push({ p50: +t[Math.floor(N / 2)].toFixed(2), p95: +t[Math.floor(N * 0.95)].toFixed(2) });
    }
    const info = s.renderer.info.render;
    const c = s.renderer.domElement;
    return { disposed: s.disposed, uncapped: reps, calls: info.calls, triangles: info.triangles, meshes, materials: [...mats], morphMeshes, morphTargets, morphVerts, canvasPx: c.width * c.height, canvas: [c.width, c.height] };
  }, { N, REPS });
  Object.assign(r, cappedRun);
  out.m0.push({ arm: arm.name, ...r });
  console.log(JSON.stringify({ arm: arm.name, ...r }));
  await page.close();
}

for (const arm of [
  { name: "Hero proxy, physical skin + wrinkle fetches, DPR 1.5, MSAA", q: "arm=hero&w=360&h=400&dpr=1.5&msaa=1" },
  { name: "Hero proxy geometry, Lambert, DPR 1.5, MSAA", q: "arm=hero_lambert&w=360&h=400&dpr=1.5&msaa=1" },
  { name: "B+ proxy, standard + normal + wrinkle fetches, DPR 1.24, MSAA", q: "arm=bplus&w=360&h=400&dpr=1.24&msaa=1" },
  { name: "B+ proxy geometry, Lambert, DPR 1.24, MSAA", q: "arm=bplus_lambert&w=360&h=400&dpr=1.24&msaa=1" },
  { name: "B+ proxy, standard + normal + wrinkle fetches, DPR 1.0, no MSAA (B-lite knobs)", q: "arm=bplus&w=360&h=400&dpr=1.0&msaa=0" },
]) {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await page.goto(`${base}/docs/design/teacher/bench/hero-proxy.html?${arm.q}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const r = await page.evaluate(({ N, REPS }) => {
    const b = window.__bench; b.timed(10);
    const reps = []; for (let k = 0; k < REPS; k++) { const x = b.timed(N); reps.push({ p50: +x.p50.toFixed(2), p95: +x.p95.toFixed(2) }); }
    return { uncapped: reps, ...b.info(), canvasPx: b.canvasPx(), maskVerts: b.maskVerts, headVerts: b.headVerts };
  }, { N, REPS });
  out.proxy.push({ arm: arm.name, ...r });
  console.log(JSON.stringify({ arm: arm.name, ...r }));
  await page.close();
}
await browser.close();
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
