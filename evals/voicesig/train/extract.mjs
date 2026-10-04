// Offline feature extraction with the PRODUCT front-end (src/voicesig/frontend): a 16 kHz mono 16-bit wav is pushed in
// 20 ms chunks through FrameCore (dsp.ts FrameAnalyzer, one YIN per hop), LogMel and GruInput, exactly as the browser
// does after the worklet. Output: <out>.bin + <out>.json (frame count, layout). Numbers only; the wav is not copied.
//
//   node evals/voicesig/train/extract.mjs <in.wav> <out-prefix> [regions.json]
//
// Layout of .bin (little-endian, frame-major): per frame [t_ms f32][rmsDb f32][f0 f32 (NaN = null)][speech f32][x f32 × GRU_DIM]
import { readFileSync, writeFileSync } from "node:fs";
import { FrameCore } from "../../../src/voicesig/frontend/frames.ts";
import { LogMel } from "../../../src/voicesig/frontend/logmel.ts";
import { GRU_DIM, GRU_FEATURES_VER, GruInput } from "../../../src/voicesig/frontend/gruInput.ts";

export function readWav16(path) {
  const b = readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") throw new Error("not a wav");
  let off = 12, fmt = null, data = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === "fmt ") fmt = { ch: b.readUInt16LE(off + 10), rate: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    if (id === "data") { data = [off + 8, Math.min(size, b.length - off - 8)]; break; }
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error("wav: missing fmt/data");
  if (fmt.rate !== 16000 || fmt.bits !== 16) throw new Error(`wav: need 16 kHz 16-bit, got ${fmt.rate}/${fmt.bits}`);
  const n = Math.floor(data[1] / (2 * fmt.ch));
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = b.readInt16LE(data[0] + i * 2 * fmt.ch) / 32768;
  return x;
}

/**
 * Run the product front-end over 16 kHz samples. Returns per-frame rows. `regions` ([[startS, endS], ...], sorted) limits
 * analysis to those spans of ONE continuous session (state carries across, the clock jumps: FrameAnalyzer re-anchors on a
 * jump exactly as it does after a dropped chunk). Used to skip long stretches where the channel owner is silent.
 */
export function frontEnd(x, { t0 = 0, gain = 1, regions = null } = {}) {
  const fc = new FrameCore();
  const lm = new LogMel(2, 4, 1);
  const gi = new GruInput();
  const rows = [];
  const mels = [];
  let mi = 0;
  const spans = regions ? regions.map(([a, b]) => [Math.floor(a * 50) * 320, Math.min(x.length, Math.ceil(b * 50) * 320)]) : [[0, x.length]];
  for (const [s0, s1] of spans) for (let i = s0; i + 320 <= s1; i += 320) {
    const t = t0 + (i / 16000) * 1000;
    let c = x.subarray(i, i + 320);
    if (gain !== 1) c = c.map((v) => Math.max(-1, Math.min(1, v * gain)));
    mels.push(...lm.push(c, t));
    for (const f of fc.push({ t, p: c })) {
      while (mi < mels.length - 1 && Math.abs(mels[mi + 1].t - f.t) <= Math.abs(mels[mi].t - f.t)) mi++;
      const m = mels[mi] && Math.abs(mels[mi].t - f.t) <= 6 ? mels[mi].v : null;
      rows.push({ f, x: gi.next(f, m) });
    }
    if (mi > 64) { mels.splice(0, mi - 2); mi = 2; }
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [inp, out, regionsPath] = process.argv.slice(2);
  const t = performance.now();
  const x = readWav16(inp);
  const regions = regionsPath ? JSON.parse(readFileSync(regionsPath, "utf8")) : null;
  const rows = frontEnd(x, { regions });
  const W = 4 + GRU_DIM;
  const buf = new Float32Array(rows.length * W);
  rows.forEach((r, i) => {
    const o = i * W;
    buf[o] = r.f.t; buf[o + 1] = r.f.rmsDb; buf[o + 2] = r.f.f0 ?? NaN; buf[o + 3] = r.f.speech ? 1 : 0;
    buf.set(r.x, o + 4);
  });
  writeFileSync(out + ".bin", Buffer.from(buf.buffer));
  const ms = performance.now() - t;
  writeFileSync(out + ".json", JSON.stringify({ src: inp.split("/").pop(), frames: rows.length, width: W, gruDim: GRU_DIM, ver: GRU_FEATURES_VER, audioS: x.length / 16000, analysedS: rows.length / 50, cpuMs: Math.round(ms) }));
  console.log(JSON.stringify({ out, frames: rows.length, audioS: Math.round(x.length / 16000), msPerAudioS: +(ms / (x.length / 16000)).toFixed(2) }));
}
