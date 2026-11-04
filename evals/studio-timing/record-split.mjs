// Local recording of the fraction split (C1 day-4) on the real child route, API mocked. No model calls.
// node evals/studio-timing/record-split.mjs <split.json> <outdir>   (split.json: { script, predicted } of a preselected split board)
import { readFileSync, mkdirSync, readdirSync, renameSync, rmSync } from "fs";
import { execFileSync } from "child_process";
const ROOT = new URL("../../", import.meta.url).pathname;
const [, , splitFile, OUT] = process.argv;
const { script: s0, predicted } = JSON.parse(readFileSync(splitFile, "utf8"));
const script = { ...s0, line: { ...(s0.line ?? {}), lessonId: "L-wb" } };
mkdirSync(OUT, { recursive: true });
import { createRequire } from "module";
import { pathToFileURL } from "url";
const req = createRequire(ROOT + "package.json");
const { createServer } = await import(pathToFileURL(req.resolve("vite")).href);
const vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
await vite.listen();
const base = vite.resolvedUrls.local[0].replace(/\/$/, "");
const { chromium } = req("playwright");
const browser = await chromium.launch();
const KID = { id: "kid-wb", first_name: "Kabir", class_level: 5, language_pref: "hinglish", teacher_id: "arjun" };
const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio",
  studioSlot: { slotId: "slot1", intentId: "i1", state: "revealed", artifact: { kind: "whiteboard", script } } };
const AT = [6500, 7100, 8000];            // ms after her line starts: whole drawn / mid-split / split
for (const [name, viewport] of [["p412", { width: 412, height: 915 }], ["w1280", { width: 1280, height: 800 }]]) {
  const mobile = viewport.width < 600;
  const vdir = `${OUT}/_v-${name}`;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile, isMobile: mobile, recordVideo: { dir: vdir, size: viewport } });
  const page = await ctx.newPage();
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
    if (p === "/api/lesson/start") return json(200, { lessonId: "L-wb", topic: { id: "c5-maths-ch02-t02", title: "Comparing fractions", chapter: "Fractions" },
      teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui, teacherOpening: predicted, teacherOpeningSeq: 1 });
    if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
    if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
    return json(200, {});
  });
  await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
  await page.waitForSelector('[data-testid="studio-stage"]', { timeout: 30_000 });
  await page.waitForTimeout(500);
  const t0 = await page.evaluate(() => { const at = performance.now(); window.dispatchEvent(new CustomEvent("taxila:line-audio-start", { detail: { lessonId: "L-wb", at } })); return at; });
  for (const [i, ms] of AT.entries()) {
    await page.evaluate(([t0, ms]) => new Promise((r) => { const w = () => (performance.now() - t0 >= ms ? r() : requestAnimationFrame(w)); w(); }), [t0, ms]);
    await page.screenshot({ path: `${OUT}/_f-${name}-${i}.png` });
  }
  await page.waitForTimeout(script.durationMs - AT.at(-1) + 1500);
  await ctx.close();
  const webm = readdirSync(vdir).find((f) => f.endsWith(".webm"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${vdir}/${webm}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-movflags", "+faststart", `${OUT}/split-${name}.mp4`]);
  rmSync(vdir, { recursive: true });
  // a 3-frame strip, side by side, frames scaled to one height
  const h = mobile ? 915 : 800;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...AT.flatMap((_, i) => ["-i", `${OUT}/_f-${name}-${i}.png`]),
    "-filter_complex", `${AT.map((_, i) => `[${i}:v]scale=-2:${h}[s${i}]`).join(";")};${AT.map((_, i) => `[s${i}]`).join("")}hstack=inputs=${AT.length}`, "-frames:v", "1", `${OUT}/split-${name}-strip.png`]);
  for (const i of AT.keys()) rmSync(`${OUT}/_f-${name}-${i}.png`);
  console.log("done", name);
}
await browser.close();
await vite.close();
