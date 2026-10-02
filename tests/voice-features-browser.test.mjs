// Real-browser check of the voice feature pipeline: Chromium's fake microphone plays a synthetic WAV
// (tones at known f0 with silence gaps) → AudioWorklet decimation → FrameAnalyzer → UtteranceTracker.
// Opt-in (launches Chromium): VOICE_BROWSER=1 node --test tests/voice-features-browser.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = process.env.VOICE_BROWSER === "1";

/** 48 kHz mono 16-bit WAV from segments { ms, f0? }. */
function wav(segments, rate = 48_000) {
  const n = segments.reduce((a, s) => a + Math.round((s.ms / 1000) * rate), 0);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  let i = 0, ph = 0;
  for (const s of segments) {
    const k = Math.round((s.ms / 1000) * rate);
    for (let j = 0; j < k; j++, i++) {
      ph += (2 * Math.PI * (s.f0 || 0)) / rate;
      const v = s.f0 ? 0.25 * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) : 0;
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
    }
  }
  return buf;
}

test("browser: worklet → features on a fake microphone", { skip: !RUN && "set VOICE_BROWSER=1" }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "vf-"));
  // 1 s silence, 700 ms @ 240 Hz, 500 ms silence, 700 ms @ 240 Hz, then a long silence (the file loops).
  writeFileSync(join(dir, "mic.wav"), wav([{ ms: 1000 }, { ms: 700, f0: 240 }, { ms: 500 }, { ms: 700, f0: 240 }, { ms: 3100 }]));
  writeFileSync(join(dir, "index.html"), `<!doctype html><script type="module">
    import { VoiceFeatures } from "/@fs${ROOT}src/voice/features.ts";
    window.run = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const vf = new VoiceFeatures();
      await vf.attach(stream);
      await new Promise((r) => setTimeout(r, 6500));   // > one loop of the 6 s file
      // Finalize over the newest loop: tone pair at loop offset 1.0-2.9 s.
      const now = Date.now();
      const u = vf.finalize({ text: "umm paanch hai", startedAt: now - 6000 });
      vf.detach();
      return u;
    };
  </script>`);
  const { createServer } = await import("vite");
  const server = await createServer({ root: dir, configFile: false, logLevel: "error", server: { port: 0, fs: { allow: [ROOT, dir] } } });
  await server.listen();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${join(dir, "mic.wav")}`, "--autoplay-policy=no-user-gesture-required"] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(server.resolvedUrls.local[0]);
    const u = await page.evaluate(() => window.run());
    assert.deepEqual(errors, []);
    assert.ok(u, "an utterance was found");
    console.log("browser features:", JSON.stringify(u.features));
    assert.ok(Math.abs(u.features.f0MedianHz - 240) / 240 < 0.02, `f0 ${u.features.f0MedianHz}`);
    assert.ok(u.features.pauseCount >= 1, `pauses ${u.features.pauseCount}`);
    assert.ok(u.features.longestPauseMs >= 400 && u.features.longestPauseMs <= 600, `longest pause ${u.features.longestPauseMs}`);
    assert.equal(u.features.fillerCount, 1);
  } finally {
    await browser.close();
    await server.close();
  }
});
