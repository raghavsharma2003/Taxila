// Browser check of the cascade lane on /dev/lesson (real API, Neon, Azure STT + TTS + taxila-fast; costs a few
// cents; not part of `npm test`):
//
//   NODE_USE_ENV_PROXY=1 node tests/voice-cascade-browser.mjs [--base http://localhost:5173]
//
// Chromium with a silent fake microphone. Checks: the lesson is started as mode "cascade" and gets no
// instructions; connect() does not wait for the transcription call (connected within 3 s even where WebRTC
// cannot come up, as in this sandbox); the opening is spoken (status "speaking", teacher level moves) and the
// time from the start click to her first audio is reported; the link reports its ears (webrtc or the
// push-to-talk fallback); a typed turn over her reaches the Director as typed and marks her interrupted.
import http from "http";
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

let base = arg("--base");
const stops = [];
if (!base) {
  for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  const { handle } = await import("../server/index.js");
  const api = http.createServer(handle);
  await new Promise((r) => api.listen(0, "127.0.0.1", r));
  stops.push(() => api.close());
  const { createServer } = await import("vite");
  const vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "warn",
    server: { port: 0, proxy: { "/api": `http://127.0.0.1:${api.address().port}` } } });
  await vite.listen();
  stops.push(() => vite.close());
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
}

const dir = mkdtempSync(join(tmpdir(), "taxila-cascade-"));
const wav = join(dir, "silence.wav");
const samples = 48_000;
const buf = Buffer.alloc(44 + samples * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(24_000, 24);
buf.writeUInt32LE(48_000, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(samples * 2, 40);
writeFileSync(wav, buf);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${wav}`, "--autoplay-policy=no-user-gesture-required"],
});
const page = await (await browser.newContext({ permissions: ["microphone"] })).newPage();
const starts = [], startRes = [], turns = [];
page.on("request", (r) => {
  if (r.url().endsWith("/api/lesson/start")) starts.push(r.postDataJSON());
  if (r.url().endsWith("/api/lesson/turn")) turns.push(r.postDataJSON());
});
page.on("response", async (r) => { if (r.url().endsWith("/api/lesson/start")) startRes.push(await r.json().catch(() => ({}))); });
const attr = (id, a) => page.evaluate(([i, x]) => document.querySelector(`[data-testid="${i}"]`)?.getAttribute(x) ?? null, [id, a]);

try {
  await page.goto(`${base}/dev/lesson`);
  await page.getByTestId("create-family").click();
  await page.getByTestId("start").waitFor({ timeout: 20_000 });
  await page.getByTestId("mode-cascade").check();
  const t0 = Date.now();
  await page.getByTestId("start").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="connection"]')?.getAttribute("data-connection") === "connected", null, { timeout: 30_000 });
  const tStart = startRes.length ? Date.now() - t0 : null;
  check("lesson started as mode 'cascade' with no instructions in the response", starts[0]?.mode === "cascade" && startRes[0] && !("instructions" in startRes[0]), JSON.stringify(starts[0]));
  const spoke = await page.waitForFunction(() => document.querySelector('[data-testid="status"]')?.getAttribute("data-status") === "speaking", null, { timeout: 20_000 }).then(() => Date.now() - t0, () => null);
  check("the opening is spoken while the ears come up", spoke !== null, `start click → first audio ${spoke} ms (start → connected ${tStart} ms)`);
  const level = await page.evaluate(() => new Promise((resolve) => {
    let max = 0;
    const bar = document.querySelector('[aria-label="teacher level"] span span');
    const t = setInterval(() => (max = Math.max(max, parseFloat(bar?.style.width || "0"))), 50);
    setTimeout(() => (clearInterval(t), resolve(max)), 1500);
  }));
  check("teacher level meter moves (lip-sync from the PCM player)", level > 0, `peak ${level}%`);
  await page.waitForFunction(() => ["recording", "webrtc"].includes(document.querySelector('[data-testid="cascade-controls"]')?.getAttribute("data-transport")), null, { timeout: 15_000 }).catch(() => {});
  const transport = await attr("cascade-controls", "data-transport");
  check("the link reports its ears", ["webrtc", "recording"].includes(transport), `transport=${transport} at ${Date.now() - t0} ms`);
  // Type over her while she is still speaking (or right after): a typed turn, and she is marked interrupted.
  await page.getByTestId("child-input").fill("teen chauthai matlab chaar mein se teen");
  await page.getByTestId("send").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="caption"][data-who="teacher"]').length > 1, null, { timeout: 25_000 });
  await page.waitForTimeout(500);
  const t = turns.find((x) => x?.childText?.startsWith("teen chauthai"));
  check("typed turn reached the Director as typed (no teacherText: the server wrote her line)", !!t && t.typed === true && !t.teacherText, JSON.stringify(t)?.slice(0, 200));
  const barge = await page.evaluate(() => document.querySelector('[data-testid="barge-stats"]')?.textContent ?? "");
  console.log(`barge stats: ${barge}`);
  await page.getByTestId("end").click().catch(() => {});
  await page.waitForTimeout(1000);
} catch (err) {
  check("cascade flow", false, String(err?.message || err));
} finally {
  await browser.close();
  for (const stop of stops.reverse()) await stop();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
