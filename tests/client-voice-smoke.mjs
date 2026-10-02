// Voice-mode smoke test of VoiceLink against the real realtime model (costs a little: one short call).
//
//   NODE_USE_ENV_PROXY=1 node tests/client-voice-smoke.mjs [--base http://localhost:5173] [--proxy <url> --trust-spki <sha256-b64>]
//
// Starts its own API + Vite dev server unless --base is given, signs up a test family, starts a VOICE lesson
// with a silent fake microphone, and checks: token → SDP → data channel open; the teacher's opening arrives
// as live captions and as audio (output_audio_buffer + a non-zero teacher level for lip-sync); a typed child
// turn over the call gets a spoken answer and reaches the Director as a turn.
// Sandboxes only: --proxy routes the browser's SDP POST through a TLS-inspecting HTTP proxy, and --trust-spki
// pins trust to that proxy's CA (SPKI sha256, base64) so Chromium accepts its certificates. WebRTC media
// itself is UDP and never uses the proxy.
import http from "http";
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
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
  const vite = await createServer({
    root: ROOT,
    configFile: ROOT + "vite.config.ts",
    logLevel: "warn",
    server: { port: 0, proxy: { "/api": `http://127.0.0.1:${api.address().port}` } },
  });
  await vite.listen();
  stops.push(() => vite.close());
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
}

// 2 s of 24 kHz mono silence: the default fake device beeps, which server VAD would hear as speech.
const dir = mkdtempSync(join(tmpdir(), "taxila-voice-"));
const wav = join(dir, "silence.wav");
const samples = 48_000;
const buf = Buffer.alloc(44 + samples * 2);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(24_000, 24);
buf.writeUInt32LE(48_000, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(samples * 2, 40);
writeFileSync(wav, buf);

const proxy = arg("--proxy");
const spki = arg("--trust-spki");
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  ...(proxy && { proxy: { server: proxy, bypass: "localhost,127.0.0.1" } }),
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${wav}`,
    "--autoplay-policy=no-user-gesture-required",
    ...(spki ? [`--ignore-certificate-errors-spki-list=${spki}`] : []),
  ],
});
const context = await browser.newContext({ permissions: ["microphone"] });
const page = await context.newPage();
const turns = [];
page.on("request", (r) => {
  if (r.url().endsWith("/api/lesson/turn")) turns.push(r.postDataJSON());
});
const sdp = [];
let candidates = "";
page.on("response", async (r) => {
  if (!r.url().includes("/realtime/calls")) return;
  sdp.push(r.status());
  // Which transports the answer offers (diagnoses networks that block UDP).
  const lines = (await r.text().catch(() => "")).split("\n").filter((l) => l.startsWith("a=candidate"));
  candidates = lines.map((l) => `${l.split(" ")[2]}/${l.split(" ")[7]}`).join(", ");
});
const state = () =>
  page.evaluate(() => ({
    connection: document.querySelector('[data-testid="connection"]')?.getAttribute("data-connection"),
    status: document.querySelector('[data-testid="status"]')?.getAttribute("data-status"),
    teacher: [...document.querySelectorAll('[data-testid="caption"][data-who="teacher"]')].map((c) => c.textContent),
    error: document.querySelector('[data-testid="error"]')?.textContent ?? null,
  }));

try {
  await page.goto(`${base}/dev/lesson`);
  await page.getByTestId("create-family").click();
  await page.getByTestId("start").waitFor({ timeout: 20_000 });
  await page.getByTestId("mode-voice").check();
  await page.getByTestId("start").click();
  const t0 = Date.now();
  await page
    .waitForFunction(() => ["connected", "failed"].includes(document.querySelector('[data-testid="connection"]')?.getAttribute("data-connection")), null, { timeout: 30_000 })
    .catch(() => {});
  let s = await state();
  check("token minted and SDP answered", sdp[0] === 201 || sdp[0] === 200, `SDP ${sdp[0] ?? "not sent"}${s.error ? `; ${s.error}` : ""}`);
  check("data channel open (call connected)", s.connection === "connected", `connection=${s.connection} after ${Date.now() - t0} ms; answer candidates: ${candidates || "none"}`);
  if (s.connection === "connected") {
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="caption"][data-who="teacher"]').length > 0, null, { timeout: 20_000 });
    check("teacher opening streams as captions", true, (await state()).teacher[0]);
    const spoke = await page.waitForFunction(() => document.querySelector('[data-testid="status"]')?.getAttribute("data-status") === "speaking", null, { timeout: 15_000 }).then(() => true, () => false);
    check("teacher audio playing (status 'speaking' from output_audio_buffer.started)", spoke);
    const level = await page.evaluate(() => new Promise((resolve) => {
      let max = 0;
      const bar = document.querySelector('[aria-label="teacher level"] span span');
      const t = setInterval(() => (max = Math.max(max, parseFloat(bar?.style.width || "0"))), 50);
      setTimeout(() => (clearInterval(t), resolve(max)), 2000);
    }));
    check("teacher level meter moves (lip-sync signal from the remote stream)", level > 0, `peak ${level}%`);
    await page.waitForFunction(() => document.querySelector('[data-testid="status"]')?.getAttribute("data-status") === "your_turn", null, { timeout: 40_000 });
    const before = (await state()).teacher.length;
    await page.getByTestId("child-input").fill("teen chauthai matlab chaar mein se teen");
    await page.getByTestId("send").click();
    await page.waitForFunction((n) => document.querySelectorAll('[data-testid="caption"][data-who="teacher"]').length > n, before, { timeout: 20_000 });
    s = await state();
    check("typed turn over the call gets a spoken answer", true, s.teacher.at(-1));
    await page.waitForTimeout(1500);
    const t = turns.find((x) => x?.typed && x.childText.startsWith("teen chauthai"));
    check("the turn reached the Director with the opening as teacherText", !!t && !!t.teacherText, JSON.stringify(t)?.slice(0, 200));
  }
  await page.getByTestId("end").click().catch(() => {});
  await page.waitForTimeout(1000);
} catch (err) {
  check("voice flow", false, String(err?.message || err));
} finally {
  await browser.close();
  for (const stop of stops.reverse()) await stop();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exitCode = failed ? 1 : 0;
