// One model, one runtime, one input size, in a fresh process. Prints one JSON line.
// Setup once: mkdir -p .work && cd .work && npm init -y && npm i onnxruntime-web@1.30.0 && npm i onnxruntime-node@1.30.0 --ignore-scripts
// then: python3 export.py <name>; python3 prosody_net.py; python3 expose.py; bash bench-all.sh   (models land in .work/models)
// node bench-one.mjs <node|web> <model.onnx> <spec> <threads> <N>
// spec: mel800 | audio3 | audio8 | prosody | logit
import { createRequire } from "node:module";
import { statSync } from "node:fs";
const WORK = process.env.VS_WORK ?? new URL("./.work/", import.meta.url).pathname;
const require = createRequire(WORK.endsWith("/") ? WORK : WORK + "/");
const [rt, model, spec, threadsS, nS] = process.argv.slice(2);
const threads = Number(threadsS), N = Number(nS);

let ort;
if (rt === "node") ort = require("onnxruntime-node");
else {
  ort = await import(require.resolve("onnxruntime-web"));
  ort = ort.default ?? ort;
  ort.env.wasm.numThreads = threads;
  ort.env.wasm.simd = true;
}

function rnd(n, seed = 1) { const a = new Float32Array(n); let s = seed; for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; a[i] = (s / 4294967296 - 0.5) * 0.2; } return a; }
function feeds() {
  switch (spec) {
    case "mel300": return { input_features: new ort.Tensor("float32", rnd(80 * 300), [1, 80, 300]) };
    case "mel800": return { input_features: new ort.Tensor("float32", rnd(80 * 800), [1, 80, 800]) };
    case "audio3": return { audio: new ort.Tensor("float32", rnd(16000 * 3), [1, 16000 * 3]) };
    case "audio8": return { audio: new ort.Tensor("float32", rnd(16000 * 8), [1, 16000 * 8]) };
    case "prosody": return { frames: new ort.Tensor("float32", rnd(800 * 10), [1, 800, 10]), scalars: new ort.Tensor("float32", rnd(16), [1, 16]) };
    case "logit": return { x: new ort.Tensor("float32", rnd(28), [1, 28]) };
  }
  throw new Error("spec");
}

const rss0 = process.memoryUsage().rss;
const opts = rt === "node"
  ? { executionProviders: ["cpu"], intraOpNumThreads: threads, interOpNumThreads: 1, graphOptimizationLevel: "all" }
  : { executionProviders: ["wasm"], graphOptimizationLevel: "all" };
let t = performance.now();
const sess = await ort.InferenceSession.create(model, opts);
const createMs = performance.now() - t;
const f = feeds();
t = performance.now();
await sess.run(f);
const firstMs = performance.now() - t;
const times = [];
for (let i = 0; i < N; i++) { t = performance.now(); await sess.run(f); times.push(performance.now() - t); }
times.sort((a, b) => a - b);
const q = (p) => times[Math.min(times.length - 1, Math.floor(p * times.length))];
console.log(JSON.stringify({
  rt, threads, model: model.split("/").pop(), spec, sizeMB: +(statSync(model).size / 1e6).toFixed(2), N,
  createMs: +createMs.toFixed(0), firstMs: +firstMs.toFixed(1), p50: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), min: +times[0].toFixed(2),
  rssMB: +((process.memoryUsage().rss - rss0) / 1e6).toFixed(0),
}));
process.exit(0);
