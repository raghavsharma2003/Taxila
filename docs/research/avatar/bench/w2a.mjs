// wav2arkit (wav2vec2-base + LAM A2E, fused ONNX) on the same Azure-GT stimuli. CPU latency + jawOpen-vs-GT.
import * as ort from "onnxruntime-web";
import fs from "node:fs";
const AZ2OC = ["sil","aa","aa","O","E","RR","I","U","O","O","O","I","kk","RR","nn","SS","CH","TH","FF","DD","kk","PP"];
const OPEN = { aa:1.0, E:0.7, I:0.5, O:0.75, U:0.4, PP:0.0, SS:0.25, TH:0.3, DD:0.35, FF:0.15, kk:0.45, nn:0.3, RR:0.4, CH:0.3, sil:0.0 };
const FR = 1000 / 30;
function readWav(f) { const b = fs.readFileSync(f); let o = 12, sr, data;
  while (o < b.length) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz; }
  const x = new Float32Array(data.length / 2); for (let i = 0; i < x.length; i++) x[i] = data.readInt16LE(i * 2) / 32768; return { sr, x }; }
const down = (x, r) => { const y = new Float32Array(Math.floor(x.length / r)); for (let i = 0; i < y.length; i++) { const p = i * r, k = Math.floor(p), f = p - k; y[i] = x[k] * (1 - f) + (x[k + 1] ?? 0) * f; } return y; };
function pearson(a, b) { const n = Math.min(a.length, b.length); let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
  let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; } return s / Math.sqrt(sa * sb || 1); }
const threads = Number(process.env.T || 4);
ort.env.wasm.numThreads = threads;
const sess = await ort.InferenceSession.create(fs.readFileSync("w2a/wav2arkit_cpu.onnx"), { executionProviders: ["wasm"], externalData: [{ path: "wav2arkit_cpu.onnx.data", data: fs.readFileSync("w2a/wav2arkit_cpu.onnx.data") }] });
const lat = { "1000": [], "500": [], full: [] }; const out = { hi: { off: [], c1000: [], c500: [] }, en: { off: [], c1000: [], c500: [] } };
async function infer(x) { const t0 = performance.now(); const r = await sess.run({ audio_waveform: new ort.Tensor("float32", x, [1, x.length]) }); return { ms: performance.now() - t0, bs: r.blendshapes.data, n: r.blendshapes.dims[1] }; }
await infer(new Float32Array(16000)); // warm-up
for (const f of fs.readdirSync("stim").filter(f => f.endsWith(".json")).sort()) {
  const meta = JSON.parse(fs.readFileSync("stim/" + f)); const w = readWav("stim/" + f.replace(".json", ".wav")); const x = down(w.x, w.sr / 16000);
  const dur = x.length / 16; const lang = meta.lang.startsWith("hi") ? "hi" : "en";
  const gt = []; const a = 1 - Math.exp(-FR / 50); let y = 0;
  for (let t = 0; t < dur; t += FR) { let v = "sil"; for (const e of meta.visemes) { if (e.t <= t) v = AZ2OC[e.id]; else break; } y += a * (OPEN[v] - y); gt.push(y); }
  const jaw = (bs, n) => { const j = []; for (let i = 0; i < n; i++) j.push(bs[i * 52 + 24]); return j; };
  const full = await infer(x); lat.full.push(full.ms / (dur / 1000)); out[lang].off.push(pearson(gt, jaw(full.bs, full.n)));
  for (const C of [1000, 500]) { // causal streaming: each chunk inferred alone as it completes (no lookahead, no overlap)
    const seq = []; const cs = C * 16;
    for (let s = 0; s < x.length; s += cs) { const r = await infer(x.subarray(s, Math.min(s + cs, x.length))); lat[String(C)].push(r.ms); seq.push(...jaw(r.bs, r.n)); }
    // frames for chunk k are only available after chunk k ends -> effective lag C ms + inference; score shape at its own clock
    out[lang]["c" + C].push(pearson(gt, seq)); }
}
const med = a => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)], p90 = a => [...a].sort((p, q) => p - q)[Math.floor(a.length * 0.9)];
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
console.log(JSON.stringify({ threads, cpu: "Xeon 2.1GHz container, onnxruntime-web WASM (browser CPU path)", ms_per_audio_second_full: +med(lat.full).toFixed(1),
  chunk1000_ms: { med: +med(lat["1000"]).toFixed(1), p90: +p90(lat["1000"]).toFixed(1) }, chunk500_ms: { med: +med(lat["500"]).toFixed(1), p90: +p90(lat["500"]).toFixed(1) },
  r_jawOpen_vs_gt: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { offline: +mean(v.off).toFixed(3), causal1000: +mean(v.c1000).toFixed(3), causal500: +mean(v.c500).toFixed(3), n: v.off.length }])) }, null, 1));
