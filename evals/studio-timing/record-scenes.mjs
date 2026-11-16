// Round 7 M5a: local recordings of the code-built cinematic scenes on the real child route, API mocked, no model calls.
// For each topic: a strip of one frame per beat (as the beat settles) at a phone (412) and a laptop (1280); with --video
// also an mp4 of the whole scene.
//   node evals/studio-timing/record-scenes.mjs <outdir> [--topics a,b] [--lang hinglish] [--video a,b]
import { mkdirSync, readdirSync, rmSync } from "fs";
import { execFileSync } from "child_process";
import { createRequire } from "module";
import { pathToFileURL } from "url";
const ROOT = new URL("../../", import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const OUT = process.argv[2];
const { SCENES, sceneFor } = await import(pathToFileURL(ROOT + "server/forge/animate/scenes.js").href);
const topics = arg("topics", Object.keys(SCENES).join(",")).split(",");
const video = new Set(arg("video", "").split(",").filter(Boolean));
const lang = arg("lang", "hinglish");
mkdirSync(OUT, { recursive: true });
const req = createRequire(ROOT + "package.json");
const { createServer } = await import(pathToFileURL(req.resolve("vite")).href);
const vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "error", server: { port: 0, strictPort: false, host: "127.0.0.1", hmr: false } });
await vite.listen();
const base = vite.resolvedUrls.local[0].replace(/\/$/, "");
const { chromium } = req("playwright");
const browser = await chromium.launch();
const KID = { id: "kid-sc", first_name: "Kabir", class_level: 6, language_pref: "hinglish", teacher_id: "arjun" };
for (const topicId of topics) {
  const r = sceneFor(topicId, { lang });
  if (!r?.ok) { console.log("skip", topicId, r?.errors); continue; }
  const scene = { ...r.scene, line: { lessonId: "L-sc" } };
  const AT = scene.beats.map((b, i) => Math.min(scene.durationMs, (scene.beats[i + 1]?.t ?? scene.durationMs) - 200));
  const name = scene.id;
  const ui = { status: "speaking", phase: "teach", handover: "answer", answerForm: "words", tray: "studio",
    studioSlot: { slotId: `slot-${name}`, intentId: "i1", state: "revealed", artifact: { kind: "scene", stage: scene.stage, scene } } };
  for (const [vname, viewport] of [["p412", { width: 412, height: 915 }], ["w1280", { width: 1280, height: 800 }]]) {
    const mobile = viewport.width < 600;
    const vdir = `${OUT}/_v-${name}-${vname}`;
    const rec = video.has(topicId) ? { recordVideo: { dir: vdir, size: viewport } } : {};
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, hasTouch: mobile, isMobile: mobile, ...rec });
    const page = await ctx.newPage();
    await page.route("**/api/**", async (route) => {
      const p = new URL(route.request().url()).pathname;
      const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (p === "/api/me") return json(200, { guardian: { id: "g1", email: "g@test.invalid", name: "Grown-up" }, children: [KID] });
      if (p === "/api/lesson/start") return json(200, { lessonId: "L-sc", topic: { id: topicId, title: name, chapter: name },
        teacher: { id: "arjun", name: "Arjun", voice: "v", addressedAs: "", role: "AI teacher" }, moduleCommands: [], ui, teacherOpening: scene.beats.map((b) => b.says).join(". "), teacherOpeningSeq: 1 });
      if (p === "/api/lesson/end") return json(200, { summary: null, parentNote: null });
      if (p.startsWith("/api/tts") || p.startsWith("/api/voice")) return route.fulfill({ status: 503, body: "" });
      return json(200, {});
    });
    await page.goto(`${base}/c/${KID.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="studio-stage"]', { timeout: 60_000 });
    await page.waitForTimeout(500);
    const t0 = await page.evaluate(() => { const at = performance.now(); window.dispatchEvent(new CustomEvent("taxila:line-audio-start", { detail: { lessonId: "L-sc", at } })); return at; });
    for (const [i, ms] of AT.entries()) {
      await page.evaluate(([t0, ms]) => new Promise((r) => { const w = () => (performance.now() - t0 >= ms ? r() : requestAnimationFrame(w)); w(); }), [t0, ms]);
      await page.screenshot({ path: `${OUT}/_f-${name}-${vname}-${i}.png` });
    }
    if (video.has(topicId)) await page.waitForTimeout(1000);
    await ctx.close();
    if (video.has(topicId)) {
      const webm = readdirSync(vdir).find((f) => f.endsWith(".webm"));
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${vdir}/${webm}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-movflags", "+faststart", `${OUT}/${name}-${vname}.mp4`]);
      rmSync(vdir, { recursive: true });
    }
    const h = mobile ? 915 : 800;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...AT.flatMap((_, i) => ["-i", `${OUT}/_f-${name}-${vname}-${i}.png`]),
      "-filter_complex", `${AT.map((_, i) => `[${i}:v]scale=-2:${Math.round(h / 2)}[s${i}]`).join(";")};${AT.map((_, i) => `[s${i}]`).join("")}hstack=inputs=${AT.length}`, "-frames:v", "1", `${OUT}/${name}-${vname}-strip.png`]);
    for (const i of AT.keys()) rmSync(`${OUT}/_f-${name}-${vname}-${i}.png`);
  }
  console.log("done", name);
}
await browser.close();
await vite.close();
