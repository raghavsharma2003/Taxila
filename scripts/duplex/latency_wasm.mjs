// Stage B on onnxruntime-web (wasm SIMD, 1 thread) in Node: the runtime a browser / Android WebView would use (DX-9 proxy).
// Encoder (Smart Turn v3.2 int8, sum_1 exposed) + fusion head; input = a precomputed log-mel window (the JS log-mel is not
// shipped yet: its cost is measured separately by latency_stageb.py as the numpy mel). n=100 after 10 warm-ups. x86 sandbox,
// shared CPU: a mid-range Android phone is expected to be 2-4x slower [E]. onnxruntime-web is installed in a scratch dir,
// not in this repo (no runtime dependency is added until DX-9 picks it).
//   node scripts/duplex/latency_wasm.mjs <path-to-onnxruntime-web> [head.onnx]
import fs from "node:fs";
import path from "node:path";

const ORT_DIR = process.argv[2];
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const HEAD = process.argv[3] || path.join(ROOT, "models/duplex/cce-stageb-2026-10-04.1.onnx");
const ENC = process.env.TAXILA_ST_EMB || "/tmp/taxila-fdb/models/st32-emb.onnx";
const OUT = path.join(ROOT, "evals/duplex/results/taxilafdb-stageb-latency-2026-10-04.json");
const ort = await import(path.join(ORT_DIR, "node_modules/onnxruntime-web/dist/ort.wasm.min.mjs"));
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;
const F = JSON.parse(fs.readFileSync(HEAD.replace(/\.onnx$/, ".json"), "utf8")).featureNames.length;
const enc = await ort.InferenceSession.create(fs.readFileSync(ENC), { executionProviders: ["wasm"] });
const head = await ort.InferenceSession.create(fs.readFileSync(HEAD), { executionProviders: ["wasm"] });
const mel = new ort.Tensor("float32", Float32Array.from({ length: 80 * 800 }, (_, i) => Math.sin(i) * 0.5), [1, 80, 800]);
async function once() {
  const t0 = performance.now();
  const o = await enc.run({ input_features: mel });
  const t1 = performance.now();
  const embName = enc.outputNames.find((n) => n.startsWith("sum_1"));
  const feeds = { features: new ort.Tensor("float32", new Float32Array(F), [1, F]), emb: o[embName], st_logit: new ort.Tensor("float32", new Float32Array([0]), [1, 1]), audio_missing: new ort.Tensor("float32", new Float32Array([0]), [1, 1]) };
  await head.run(Object.fromEntries(Object.entries(feeds).filter(([k]) => head.inputNames.includes(k))));
  const t2 = performance.now();
  return [t1 - t0, t2 - t1, t2 - t0];
}
for (let i = 0; i < 10; i++) await once();
const r = [];
for (let i = 0; i < 100; i++) r.push(await once());
const q = (c, p) => { const s = r.map((x) => x[c]).sort((a, b) => a - b); return +s[Math.floor(p * (s.length - 1))].toFixed(2); };
const res = { n: 100, ortWeb: "1.20.1 wasm simd, 1 thread, Node 22", encoderMs: { p50: q(0, 0.5), p95: q(0, 0.95) }, headMs: { p50: q(1, 0.5), p95: q(1, 0.95) }, totalMs: { p50: q(2, 0.5), p95: q(2, 0.95) } };
console.log(JSON.stringify(res));
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
prev.wasm = res;
fs.writeFileSync(OUT, JSON.stringify(prev, null, 1));
