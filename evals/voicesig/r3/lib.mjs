// Round 3 voicesig eval helpers: the PRODUCT front-end (src/voicesig/frontend via extract.mjs frontEnd) and the filler
// detector graph in onnxruntime-web's WASM backend (the runtime the device runs; a repo dependency), so the harnesses
// run the same code path as the lesson. Numbers only; nothing here writes audio.
import fs from "node:fs";
import path from "node:path";
import { frontEnd } from "../train/extract.mjs";
import { GRU_DIM } from "../../../src/voicesig/frontend/gruInput.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..") + "/";

/** s16le mono 16 kHz → Float32. */
export function f32(buf) { const n = buf.length >> 1, x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(i * 2) / 32768; return x; }

/** Front-end rows for a whole signal: frames (AudioFrame) and the GRU input per frame (vsgru-in/1). */
export function features(x, o = {}) {
  const rows = frontEnd(x, o);
  return { frames: rows.map((r) => r.f), xs: rows.map((r) => r.x) };
}

/** Pack per-frame GRU vectors [from, to) into one [T × GRU_DIM] Float32Array. */
export function pack(xs, from = 0, to = xs.length) {
  const T = Math.max(0, to - from);
  const out = new Float32Array(T * GRU_DIM);
  for (let i = 0; i < T; i++) out.set(xs[from + i], i * GRU_DIM);
  return { x: out, T };
}

let ortP = null;
/** The detector in onnxruntime-web WASM (1 thread), as src/voicesig/ort.ts loads it on the device. */
export async function loadDetector(modelPath) {
  ortP ??= import("onnxruntime-web").then((m) => { const o = m.default ?? m; o.env.wasm.numThreads = 1; return o; });
  const ort = await ortP;
  const session = await ort.InferenceSession.create(new Uint8Array(fs.readFileSync(modelPath)), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
  // one run at a time: the WASM session is not re-entrant (concurrent runs from parallel shards crash it)
  let chain = Promise.resolve();
  const runOne = async (x, T) => {
    const out = await session.run({ x: new ort.Tensor("float32", x, [1, T, GRU_DIM]) });
    const p = out.p ?? Object.values(out)[0];
    return Float32Array.from(p.data);
  };
  return {
    detect(x, T) {
      if (!T) return Promise.resolve(new Float32Array(0));
      const r = chain.then(() => runOne(x, T));
      chain = r.then(() => {}, () => {});
      return r;
    },
  };
}

export function wilson(k, n) {
  if (!n) return [null, null];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [+((c - m) / d).toFixed(3), +((c + m) / d).toFixed(3)];
}
export const rate = (k, n) => ({ k, n, rate: n ? +(k / n).toFixed(3) : null, ci95: wilson(k, n) });

/** Cluster bootstrap 95% CI of a ratio sum(k)/sum(n) over clusters. */
export function clusterCi(rows, B = 1000, seed = 7) {
  const by = new Map();
  for (const r of rows) { const a = by.get(r.c) ?? [0, 0]; a[0] += r.k; a[1] += r.n; by.set(r.c, a); }
  const keys = [...by.keys()];
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const reps = [];
  for (let b = 0; b < B; b++) {
    let k = 0, n = 0;
    for (let i = 0; i < keys.length; i++) { const v = by.get(keys[Math.floor(rnd() * keys.length)]); k += v[0]; n += v[1]; }
    if (n) reps.push(k / n);
  }
  reps.sort((a, b) => a - b);
  return reps.length ? [+reps[Math.floor(0.025 * reps.length)].toFixed(3), +reps[Math.floor(0.975 * reps.length)].toFixed(3)] : [null, null];
}
