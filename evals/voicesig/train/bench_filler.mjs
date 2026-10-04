// Latency of the filler detector graph: onnxruntime-node (CPU, 1 thread) and onnxruntime-web (WASM, 1 thread, SIMD) for
// turn lengths 5 / 15 / 30 s (T = 250 / 750 / 1500 frames). One JSON line per cell. ORT is not a repo dependency:
//   (cd $VS_ORT && npm i onnxruntime-web@1.30.0 onnxruntime-node@1.30.0 --ignore-scripts)
//   VS_ORT=<dir> node evals/voicesig/train/bench_filler.mjs models/voicesig/filler-gru.onnx [N]
import { createRequire } from "node:module";
import { statSync } from "node:fs";
const dir = process.env.VS_ORT;
if (!dir) throw new Error("set VS_ORT to a folder with onnxruntime-node and onnxruntime-web installed");
const require = createRequire(dir.endsWith("/") ? dir : dir + "/");
const [model, nS] = process.argv.slice(2);
const N = Number(nS ?? 50);

async function bench(rt) {
  let ort;
  if (rt === "node") ort = require("onnxruntime-node");
  else {
    ort = await import(require.resolve("onnxruntime-web"));
    ort = ort.default ?? ort;
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
  }
  const opts = rt === "node" ? { executionProviders: ["cpu"], intraOpNumThreads: 1, interOpNumThreads: 1, graphOptimizationLevel: "all" } : { executionProviders: ["wasm"], graphOptimizationLevel: "all" };
  let t = performance.now();
  const sess = await ort.InferenceSession.create(model, opts);
  const createMs = performance.now() - t;
  for (const T of [250, 750, 1500]) {
    const x = new Float32Array(T * 22);
    let s = 1;
    for (let i = 0; i < x.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; x[i] = (s / 4294967296 - 0.5); }
    const feeds = { x: new ort.Tensor("float32", x, [1, T, 22]) };
    await sess.run(feeds);
    const times = [];
    for (let i = 0; i < N; i++) { t = performance.now(); await sess.run(feeds); times.push(performance.now() - t); }
    times.sort((a, b) => a - b);
    const q = (p) => +times[Math.min(times.length - 1, Math.floor(p * times.length))].toFixed(3);
    console.log(JSON.stringify({ rt, model: model.split("/").pop(), bytes: statSync(model).size, T, audioS: T / 50, N, createMs: +createMs.toFixed(1), minMs: q(0), p50Ms: q(0.5), p95Ms: q(0.95) }));
  }
}

await bench(process.argv[4] ?? "node");
