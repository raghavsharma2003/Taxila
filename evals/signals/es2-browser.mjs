// ES-2 browser subset: the same TTS clips through Chromium's fake microphone with the production capture constraints
// (echoCancellation, noiseSuppression, autoGainControl ON, as both lesson links capture), real AudioWorklet, real
// VoiceFeatures. Compares the utterance features with the Node run of the same clip (es2-run.mjs, which has no AGC/NS).
// Real time: one Chromium launch per clip (the fake-capture file is a launch flag). Onset (A1) is not measured here: the
// fake device's start is not synchronised to a teacher end.
//   node evals/signals/es2-browser.mjs   → evals/signals/results/es2-browser.json   (ES2B_N clips, default 24)
import fs from "node:fs";
import path from "node:path";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { CACHE } from "./es2-build.mjs";
import { r3, quantile } from "./lib/metrics.mjs";

const ROOT = new URL("../../", import.meta.url).pathname;
const N = Number(process.env.ES2B_N || 24);
const manifest = JSON.parse(fs.readFileSync(new URL("./data/es2-manifest.json", import.meta.url), "utf8"));
const nodeRows = new Map(JSON.parse(fs.readFileSync(new URL("./results/es2.json", import.meta.url), "utf8")).rows.map((r) => [r.id, r]));
const pickIds = manifest.clips.filter((c) => !c.lhEnd && !c.fillerWord && /-v(0|2|3|5|8)$/.test(c.id)).filter((_, i) => i % 6 === 0).slice(0, N).map((c) => c.id);

function wav48(pcm24, preMs, postMs) {
  const x = new Int16Array(pcm24.buffer, pcm24.byteOffset, pcm24.length / 2);
  let peak = 1; for (const v of x) peak = Math.max(peak, Math.abs(v));
  const g = (0.25 * 32767) / peak;
  const n = Math.round((preMs / 1000) * 48000) + x.length * 2 + Math.round((postMs / 1000) * 48000);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(48000, 24);
  buf.writeUInt32LE(96000, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  const off = Math.round((preMs / 1000) * 48000);
  let s = 7;
  for (let i = 0; i < n; i++) {
    const j = i - off;
    let v = 0;
    if (j >= 0 && j < x.length * 2) { const a = x[j >> 1], b = x[Math.min(x.length - 1, (j >> 1) + 1)]; v = (j & 1 ? (a + b) / 2 : a) * g; }
    v += ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32 - 0.5) * 20;   // ≈ −70 dBFS floor
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v))), 44 + i * 2);
  }
  return { buf, clipMs: (x.length / 24000) * 1000 };
}

const { createServer } = await import("vite");
const { chromium } = await import("playwright");
const dir = mkdtempSync(path.join(tmpdir(), "es2b-"));
writeFileSync(path.join(dir, "index.html"), `<!doctype html><script type="module">
  import { VoiceFeatures } from "/@fs${ROOT}src/voice/features.ts";
  window.run = async (waitMs, text, constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
    const vf = new VoiceFeatures();
    const t0 = Date.now();
    await vf.attach(stream);
    await new Promise((r) => setTimeout(r, waitMs));
    const u = vf.finalize({ text, startedAt: t0 + 900 });
    vf.detach();
    stream.getTracks().forEach((t) => t.stop());
    return u;
  };
</script>`);
const server = await createServer({ root: dir, configFile: false, logLevel: "error", server: { port: 0, fs: { allow: [ROOT, dir] } } });
await server.listen();
const rows = [];
try {
  for (const id of pickIds) {
    const clip = manifest.clips.find((c) => c.id === id);
    const { buf, clipMs } = wav48(fs.readFileSync(path.join(CACHE, `${id}.pcm`)), 1000, 4000);
    const mic = path.join(dir, `${id}.wav`);
    writeFileSync(mic, buf);
    const out = { id, lang: clip.lang };
    for (const [mode, constraints] of Object.entries({ on: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, off: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })) {
      if (mode === "off" && rows.length >= 8) continue;
      const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${mic}`, "--autoplay-policy=no-user-gesture-required"] });
      try {
        const page = await browser.newPage();
        await page.goto(server.resolvedUrls.local[0]);
        const u = await page.evaluate(([w, t, c]) => window.run(w, t, c), [Math.round(1000 + clipMs + 1200), clip.text, constraints]);
        out[mode] = u ? u.features : null;
      } finally { await browser.close(); }
    }
    rows.push(out);
    process.stdout.write(".");
  }
} finally { await server.close(); }

const FEATS = ["pauseCount", "longestPauseMs", "articulationWps", "voicedFrac", "f0MedianHz", "durationMs"];
const cmp = (mode) => Object.fromEntries(FEATS.map((f) => {
  const pairs = rows.filter((r) => r[mode] && nodeRows.get(r.id)?.runs.clean[f] != null && r[mode][f] != null).map((r) => [nodeRows.get(r.id).runs.clean[f], r[mode][f]]);
  const rel = pairs.map(([a, b]) => (a === 0 ? (b === 0 ? 0 : 1) : Math.abs(b - a) / Math.abs(a)));
  return [f, { n: pairs.length, within5pct: r3(rel.filter((x) => x <= 0.05).length / Math.max(1, rel.length)), within15pct: r3(rel.filter((x) => x <= 0.15).length / Math.max(1, rel.length)), medianRelDiff: r3(quantile(rel, 0.5)) }];
}));
const summary = { date: "2026-10-04", clips: rows.length, detectedOn: rows.filter((r) => r.on).length, detectedOff: rows.filter((r) => r.off).length,
  method: "Chromium 153 fake mic (looped WAV, 48 kHz), production constraints ON (AEC/NS/AGC) vs OFF, compared with the Node run of the same clip", vsNodeAgcOn: cmp("on"), vsNodeAgcOff: cmp("off") };
fs.writeFileSync(new URL("./results/es2-browser.json", import.meta.url), JSON.stringify({ summary, rows }, null, 1));
console.log("\n" + JSON.stringify(summary, null, 1));
