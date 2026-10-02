// sfx-bank-probe.mjs — procedural SFX preset bank: build cost, size, loudness lint (2026-10-02).
// Renders a draft kid-safe ZzFX preset bank to WAV in Node (AudioContext stubbed; buildSamples is pure JS),
// then measures duration, sample peak and EBU R128 integrated loudness with ffmpeg, and Opus size.
// Usage: ZZFX=<path to ZzFX.js from github.com/KilledByAPixel/ZzFX> node docs/research/factory/sfx-bank-probe.mjs
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
globalThis.AudioContext = class { constructor() { this.sampleRate = 44100; } };
const { ZZFX } = await import(process.env.ZZFX);
const OUT = process.env.OUT || "/tmp/sfx-bank"; fs.mkdirSync(OUT, { recursive: true });
// [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime,
//  repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]
// Drafts for the house bank: soft attacks, sine/triangle shapes (0/1), no noise bursts on feedback, nothing buzzer-like.
const BANK = {
  "correct.soft":    [1, 0, 660, .01, .05, .25, 0, 1, 0, 0, 220, .06],
  "correct.big":     [1, 0, 523, .01, .1, .4, 0, 1, 0, 0, 262, .08, .12],
  "tryagain.gentle": [.7, 0, 330, .02, .05, .25, 0, 1, -2, 0, 0, 0],
  "pop":             [.8, .05, 900, 0, .01, .08, 0, 1.5, -40],
  "whoosh":          [.5, .05, 300, .05, .1, .2, 3, 1, 5, 0, 0, 0, 0, .4],
  "jump":            [.7, .05, 250, 0, .05, .15, 1, 1, 12],
  "land":            [.6, .05, 120, 0, .02, .1, 1, 1, -6, 0, 0, 0, 0, .2],
  "levelup":         [1, 0, 392, .02, .2, .5, 0, 1, 0, 0, 196, .1, .1],
  "unlock":          [.8, 0, 784, .01, .05, .3, 0, 1, 0, 0, 392, .05],
  "tick":            [.4, 0, 1500, 0, 0, .03, 0, 1],
  "pick":            [.5, 0, 500, 0, .01, .06, 1, 1, 10],
  "drop.snap":       [.6, 0, 700, 0, .01, .08, 0, 1, -20],
};
const rows = [];
for (const [id, p] of Object.entries(BANK)) {
  const t0 = performance.now(); const s = ZZFX.buildSamples(...p); const buildMs = +(performance.now() - t0).toFixed(2);
  const pcm = Buffer.alloc(44 + s.length * 2); const w = (o, v, n) => pcm.writeUIntLE(v, o, n);
  pcm.write("RIFF", 0); w(4, 36 + s.length * 2, 4); pcm.write("WAVEfmt ", 8); w(16, 16, 4); w(20, 1, 2); w(22, 1, 2); w(24, 44100, 4); w(28, 88200, 4); w(32, 2, 2); w(34, 16, 2); pcm.write("data", 36); w(40, s.length * 2, 4);
  let peak = 0; s.forEach((v, i) => { const c = Math.max(-1, Math.min(1, v * ZZFX.volume)); peak = Math.max(peak, Math.abs(c)); pcm.writeInt16LE(Math.round(c * 32767), 44 + i * 2); });
  const wav = path.join(OUT, `${id}.wav`); fs.writeFileSync(wav, pcm);
  const opus = path.join(OUT, `${id}.opus`); execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-c:a", "libopus", "-b:a", "32k", opus]);
  let lufs = null; try { const e = execFileSync("ffmpeg", ["-hide_banner", "-nostats", "-i", wav, "-af", "ebur128", "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] }); } catch {}
  try { const log = execFileSync("bash", ["-c", `ffmpeg -hide_banner -nostats -i '${wav}' -af ebur128 -f null - 2>&1 | grep -A1 'Integrated loudness' | grep ' I:' | tail -1`]).toString(); lufs = parseFloat(log.split("I:")[1]); } catch {}
  rows.push({ id, paramsBytes: JSON.stringify(p).length, durS: +(s.length / 44100).toFixed(3), buildMs, peakDbfs: +(20 * Math.log10(peak)).toFixed(1), lufs, wavBytes: pcm.length, opusBytes: fs.statSync(opus).size });
}
console.table(rows);
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "sfx-bank-probe-2026-10-02.json"), JSON.stringify({ date: "2026-10-02", zzfxVolume: ZZFX.volume, rows }, null, 2));
