// Shared helpers for the duplex harnesses: env loading (never prints a key), child-voice TTS clips with a disk cache
// OUTSIDE the repo, PCM -> 20 ms frames (RMS + YIN F0 from the shipped src/voice/dsp.ts), and statistics.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

export const ROOT = new URL("../../", import.meta.url).pathname;
export const HERE = path.dirname(new URL(import.meta.url).pathname);
export const RESULTS = path.join(HERE, "results");

export function loadEnv() {
  for (const line of fs.readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

export const SR = 24000;
export const CACHE = process.env.DUPLEX_AUDIO_CACHE || path.join(os.tmpdir(), "taxila-duplex-audio");
const CHILD_VOICE = "Voice: a 10-year-old Indian child answering a teacher, Hindi-English mix, natural child pace, a little informal.";

/** A child-like clip (gpt-4o-mini-tts, child-instructed, x1.2 pitch shift: the cascade-latency recipe), 24 kHz s16 mono, trimmed. */
export async function childClip(text, voice, { endpoint, key, deployment }) {
  fs.mkdirSync(CACHE, { recursive: true });
  const id = crypto.createHash("sha1").update(`${voice}|${text}|v2`).digest("hex").slice(0, 16);
  const f = path.join(CACHE, `${id}.pcm`);
  if (fs.existsSync(f)) return { pcm: fs.readFileSync(f), cached: true };
  const r = await fetch(`${endpoint}/audio/speech`, { method: "POST", headers: { "api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ model: deployment, voice, input: text, instructions: CHILD_VOICE, response_format: "pcm" }) });
  if (!r.ok) throw new Error(`tts ${r.status} ${(await r.text()).slice(0, 200)}`);
  const a = path.join(CACHE, `${id}.raw`), b = path.join(CACHE, `${id}.shift`);
  fs.writeFileSync(a, Buffer.from(await r.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", a,
    "-af", `asetrate=${SR * 1.2},aresample=${SR},atempo=${(1 / 1.2).toFixed(4)}`, "-f", "s16le", "-ar", String(SR), "-ac", "1", b]);
  const pcm = trim(fs.readFileSync(b));
  fs.writeFileSync(f, pcm);
  fs.rmSync(a, { force: true }); fs.rmSync(b, { force: true });
  return { pcm, cached: false };
}

/** Trim leading/trailing silence (20 ms frames below -45 dBFS), keeping 20 ms. */
export function trim(pcm) {
  const n = pcm.length / 2, hop = SR / 50;
  const db = (i) => { let s = 0; for (let k = i; k < Math.min(n, i + hop); k++) { const v = pcm.readInt16LE(k * 2) / 32768; s += v * v; } return 10 * Math.log10(s / hop + 1e-12); };
  let a = 0, b = n - hop;
  while (a < n - hop && db(a) < -45) a += hop;
  while (b > a && db(b) < -45) b -= hop;
  a = Math.max(0, a - hop); b = Math.min(n, b + 2 * hop);
  return Buffer.from(pcm.subarray(a * 2, b * 2));
}

/** Low-level noise (-58 dBFS RMS, uniform) for pauses, so the device VAD floor sees a room, not digital zero. */
export function noise(ms, seed = 1) {
  const n = Math.round((SR * ms) / 1000), b = Buffer.alloc(n * 2);
  let s = seed >>> 0;
  const amp = 32768 * Math.pow(10, -58 / 20) * Math.sqrt(3);
  for (let i = 0; i < n; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; b.writeInt16LE(Math.round(((s / 4294967296) * 2 - 1) * amp), i * 2); }
  return b;
}

/** Mix low noise under a clip so speech and pause share one floor. */
export function withNoise(pcm, seed) {
  const nz = noise((pcm.length / 2 / SR) * 1000, seed);
  const out = Buffer.alloc(pcm.length);
  for (let i = 0; i < pcm.length / 2; i++) out.writeInt16LE(Math.max(-32768, Math.min(32767, pcm.readInt16LE(i * 2) + (i * 2 < nz.length ? nz.readInt16LE(i * 2) : 0))), i * 2);
  return out;
}

let yinFn = null;
/** PCM s16 24 kHz -> frames every 20 ms: { t, rms, f0 } (YIN over a 40 ms window, the shipped dsp.ts implementation). */
export async function pcmFrames(pcm, startMs = 0) {
  if (!yinFn) yinFn = (await import(ROOT + "src/voice/dsp.ts")).yin;
  const n = pcm.length / 2, hop = SR / 50, win = SR / 25;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = pcm.readInt16LE(i * 2) / 32768;
  const out = [];
  for (let i = 0; i + hop <= n; i += hop) {
    let s = 0;
    for (let k = i; k < i + hop; k++) s += x[k] * x[k];
    const rms = Math.sqrt(s / hop);
    let f0 = null;
    if (rms > 0.003 && i + win <= n) { const r = yinFn(x.subarray(i, i + win), SR, 70, 600); f0 = r.f0; }
    out.push({ t: startMs + Math.round((i / SR) * 1000), rms, f0 });
  }
  return out;
}

export const q = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export const r0 = (x) => (x === null || x === undefined ? null : Math.round(x));
/** Wilson score interval (80% by default, z=1.2816) for k of n. */
export function wilson(k, n, z = 1.2816) {
  if (!n) return [null, null];
  const p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [+((c - m) / d).toFixed(3), +((c + m) / d).toFixed(3)];
}
