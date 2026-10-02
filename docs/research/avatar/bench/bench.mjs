// Lip-sync-from-audio bench: HeadAudio (real source), wawa-lipsync (real source, AnalyserNode emulated per
// the Web Audio spec), and an RMS amplitude baseline, scored against Azure TTS viseme timelines
// (hi-IN + en-IN). All arms are run CAUSALLY at 48 kHz in 128-sample render quanta, as a browser would.
import fs from "node:fs";
import path from "node:path";
const HA = "../met4citizen_HeadAudio/modules/";
const PARAMS = await import(HA + "parameters.mjs");
const { Processor } = await import(HA + "processor.mjs");
const { Training } = await import(HA + "training.mjs");

const SR = 48000, Q = 128, FPS = 60, FRAME = 1000 / FPS;
// Azure 22-id -> Oculus 15 (TalkingHead examples/azure-audio-streaming.html)
const AZ2OC = ["sil","aa","aa","O","E","RR","I","U","O","O","O","I","kk","RR","nn","SS","CH","TH","FF","DD","kk","PP"];
const OC = ["aa","E","I","O","U","PP","SS","TH","DD","FF","kk","nn","RR","CH","sil"]; // HeadAudio ids
// Jaw/lip openness per viseme (0 = lips closed). Used only to turn discrete visemes into a mouth track.
const OPEN = { aa:1.0, E:0.7, I:0.5, O:0.75, U:0.4, PP:0.0, SS:0.25, TH:0.3, DD:0.35, FF:0.15, kk:0.45, nn:0.3, RR:0.4, CH:0.3, sil:0.0 };
const GROUP = v => v === "sil" ? "sil" : v === "PP" ? "closed" : ["aa","E","I","O","U"].includes(v) ? "vowel" : "cons";

function readWav(f) {
  const b = fs.readFileSync(f); let o = 12, sr = 24000, data;
  while (o < b.length) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4);
    if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz; }
  const x = new Float32Array(data.length / 2); for (let i = 0; i < x.length; i++) x[i] = data.readInt16LE(i * 2) / 32768;
  return { sr, x };
}
function upsample(x, from) { const r = SR / from, y = new Float32Array(Math.floor(x.length * r));
  for (let i = 0; i < y.length; i++) { const p = i / r, k = Math.floor(p), f = p - k; y[i] = (x[k] ?? 0) * (1 - f) + (x[k + 1] ?? 0) * f; } return y; }

// ---------- HeadAudio (processor = real code; node easing re-implemented verbatim incl. its `if (viseme)` test)
const bin = fs.readFileSync(HA + "../dist/model-en-mixed.bin");
const buf = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
const tr = new Training(); const model = [];
for (let p = 0; p + PARAMS.RECORD_OFFSET <= buf.byteLength; p += PARAMS.RECORD_OFFSET)
  model.push(tr.decodeBinaryRecord(new Float32Array(buf, p, PARAMS.RECORD_LEN)));

function runHeadAudio(x, { speakerMeanHz = 150, fixAa = false, holdMs = 0 } = {}) {
  const msgs = []; let now = 0;
  const worklet = { port: { postMessage: m => msgs.push({ ...m, avail: now }) } };
  const proc = new Processor({ sampleRate: SR, parameterData: {} }, worklet);
  proc._onmessage({ data: { event: "model", reset: true, model } });
  if (speakerMeanHz !== 150) proc.update({ speakerMeanHz });
  const cost = [];
  for (let j = 0; j < x.length; j += Q) {
    const blk = x.subarray(j, Math.min(j + Q, x.length));
    const t0 = process.hrtime.bigint(); proc.process(blk); cost.push(Number(process.hrtime.bigint() - t0) / 1e6);
    now = (j + blk.length) / SR * 1000; // message is available at the END of this render quantum
  }
  // Node side: visemeActive + update(dt) easing at FPS, exactly as headaudio.mjs
  const N = 15, maxs = [0.65,0.65,0.65,0.65,0.65,0.75,0.65,0.65,0.65,0.75,0.65,0.65,0.65,0.65,0.65];
  const base = t => 1 / (1 + Math.exp(-5 * t)) - 0.5, corr = 0.5 / base(1);
  const ease = t => corr * base(2 * Math.max(Math.min(t, 1), 0) - 1) + 0.5;
  const alpha = new Array(N).fill(0); let active = -1, mi = 0, since = -1e9;
  const setActive = (v, t) => { if (v === active) return; if (holdMs && t - since < holdMs) return; active = v; since = t; };
  const durMs = x.length / SR * 1000, track = [], disc = [];
  for (let t = 0; t < durMs; t += FRAME) {
    while (mi < msgs.length && msgs[mi].avail <= t) { const m = msgs[mi++];
      if (m.event === "viseme") { const v = m.viseme; if (fixAa ? v !== null && v !== undefined : v) setActive(v === 14 ? -1 : v, t); }
      if (m.event === "ended") setActive(-1, t); }
    const da = FRAME / 100; let open = 0;
    for (let i = 0; i < N; i++) { if (i === active) alpha[i] = Math.min(1, alpha[i] + da); else alpha[i] = Math.max(0, alpha[i] - da);
      if (alpha[i] < 0.01) alpha[i] = 0; open += maxs[i] * ease(alpha[i]) * (alpha[i] ? OPEN[OC[i]] : 0); }
    track.push({ t, open: Math.min(1, open / 0.65) }); disc.push({ t, v: active < 0 ? "sil" : OC[active] });
  }
  return { track, disc, cost };
}

// ---------- wawa-lipsync (real code) with a spec-faithful AnalyserNode (Blackman window, tau=0.8, dB->byte)
function fft(re, im) { const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) {
      const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
      re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } }
class FakeAnalyser { constructor() { this.fftSize = 2048; this.smoothingTimeConstant = 0.8; this.minDecibels = -100; this.maxDecibels = -30; this.prev = null; }
  get frequencyBinCount() { return this.fftSize / 2; } connect() {}
  getByteFrequencyData(out) { const N = this.fftSize, x = G.x, end = G.pos, re = new Float64Array(N), im = new Float64Array(N);
    if (!this.prev) this.prev = new Float64Array(N / 2);
    for (let i = 0; i < N; i++) { const a = 0.16, w = (1 - a) / 2 - 0.5 * Math.cos(2 * Math.PI * i / N) + a / 2 * Math.cos(4 * Math.PI * i / N); re[i] = (x[end - N + i] ?? 0) * w; }
    fft(re, im);
    for (let k = 0; k < N / 2; k++) { const mag = Math.hypot(re[k], im[k]) / N; this.prev[k] = this.smoothingTimeConstant * this.prev[k] + (1 - this.smoothingTimeConstant) * mag;
      const db = 20 * Math.log10(this.prev[k] || 1e-20); out[k] = Math.max(0, Math.min(255, Math.floor(255 / (this.maxDecibels - this.minDecibels) * (db - this.minDecibels)))); } } }
const G = { x: null, pos: 0, now: 0 };
globalThis.window = { AudioContext: class { constructor() { this.sampleRate = SR; } createAnalyser() { return new FakeAnalyser(); } resume() {} } };
Object.defineProperty(globalThis, "performance", { value: { now: () => G.now }, configurable: true });
const { Lipsync } = await import("./wawa.mjs");
function runWawa(x) { const L = new Lipsync(); G.x = x; const disc = [], cost = []; const durMs = x.length / SR * 1000;
  for (let t = 0; t < durMs; t += FRAME) { G.now = t; G.pos = Math.floor(t / 1000 * SR);
    const t0 = process.hrtime.bigint(); L.processAudio(); cost.push(Number(process.hrtime.bigint() - t0) / 1e6);
    disc.push({ t, v: String(L.viseme).replace("viseme_", "") }); }
  return { disc, cost }; }

// ---------- RMS baseline (AnalyserNode fftSize 512 time-domain, gate+gain; tech-and-market.md §2.2)
function runRms(x, { gate = 0.01, gain = 6 } = {}) { const track = [], durMs = x.length / SR * 1000;
  for (let t = 0; t < durMs; t += FRAME) { const e = Math.floor(t / 1000 * SR); let s = 0; for (let i = e - 512; i < e; i++) { const v = x[i] ?? 0; s += v * v; }
    track.push({ t, open: Math.max(0, Math.min(1, (Math.sqrt(s / 512) - gate) * gain)) }); } return { track }; }

// ---------- scoring
function smooth(track, tauMs = 50) { const a = 1 - Math.exp(-FRAME / tauMs); let y = 0; return track.map(p => ({ t: p.t, open: (y += a * (p.open - y)) })); }
function gtAt(vis, t) { let v = "sil"; for (const e of vis) { if (e.t <= t) v = AZ2OC[e.id]; else break; } return v; }
function pearson(a, b) { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb || 1); }
function score(gtDisc, gtOpen, arm, lagMs) {
  const k = Math.round(lagMs / FRAME), out = {};
  if (arm.track) { const a = [], b = []; for (let i = 0; i < gtOpen.length; i++) { const j = i + k; if (j >= 0 && j < arm.track.length) { a.push(gtOpen[i]); b.push(arm.track[j].open); } } out.r = pearson(a, b); }
  if (arm.disc) { let ex = 0, gr = 0, n = 0; for (let i = 0; i < gtDisc.length; i++) { const j = i + k; if (j < 0 || j >= arm.disc.length) continue; n++;
      if (arm.disc[j].v === gtDisc[i]) ex++; if (GROUP(arm.disc[j].v) === GROUP(gtDisc[i])) gr++; } out.exact = ex / n; out.group = gr / n; }
  // bilabial closure recall: each GT PP segment, did the arm's mouth get near-closed (open<0.2) within the segment +-1 frame?
  const tr = arm.track || arm.disc.map(d => ({ t: d.t, open: OPEN[d.v] ?? 0 }));
  let segs = 0, hit = 0; for (let i = 1; i < gtDisc.length; i++) if (gtDisc[i] === "PP" && gtDisc[i - 1] !== "PP") {
    segs++; let e = i; while (e < gtDisc.length && gtDisc[e] === "PP") e++;
    let ok = false; for (let q = i - 1 + k; q <= e + k; q++) if (tr[q] && tr[q].open < 0.2) ok = true; if (ok) hit++; }
  let vf = 0, vc = 0; for (let i = 0; i < gtDisc.length; i++) { const j = i + k; if (GROUP(gtDisc[i]) === "vowel" && tr[j]) { vf++; if (tr[j].open < 0.2) vc++; } }
  out.ppSegs = segs; out.ppHit = hit; out.vowelClosed = vc / (vf || 1); return out;
}

const ARMS = ["ha", "haFix", "haTuned", "haHold", "wawaS", "rmsS", "hybrid"];
const files = fs.readdirSync("stim").filter(f => f.endsWith(".json")).sort();
const rows = []; const costs = { ha: [], wawa: [] };
for (const f of files) {
  const meta = JSON.parse(fs.readFileSync("stim/" + f)); const w = readWav("stim/" + f.replace(".json", ".wav"));
  const x = upsample(w.x, w.sr); const durMs = x.length / SR * 1000;
  const gtDisc = []; for (let t = 0; t < durMs; t += FRAME) gtDisc.push(gtAt(meta.visemes, t));
  const gtOpen = smooth(gtDisc.map((v, i) => ({ t: i * FRAME, open: OPEN[v] }))).map(p => p.open);
  const female = /Swara|Neerja/.test(meta.voice);
  const arms = {
    ha: runHeadAudio(x), haFix: runHeadAudio(x, { fixAa: true }), haTuned: runHeadAudio(x, { fixAa: true, speakerMeanHz: female ? 220 : 120 }), haHold: runHeadAudio(x, { fixAa: true, holdMs: 120 }),
    wawa: runWawa(x), rms: runRms(x),
  };
  costs.ha.push(...arms.ha.cost); costs.wawa.push(...arms.wawa.cost);
  arms.wawaS = { track: smooth(arms.wawa.disc.map(d => ({ t: d.t, open: OPEN[d.v] ?? 0 }))), disc: arms.wawa.disc };
  arms.rmsS = { track: smooth(arms.rms.track) };
  // Hybrid: RMS drives the jaw; HeadAudio only vetoes it (PP -> lips closed, FF -> nearly closed), delayed by its lag
  arms.hybrid = { track: smooth(arms.rms.track.map((p, i) => { const d = arms.haFix.disc[i]?.v; return { t: p.t, open: p.open * (d === "PP" ? 0.05 : d === "FF" ? 0.35 : 1) }; })) };
  const res = { file: f.replace(".json", ""), lang: meta.lang, durS: +(durMs / 1000).toFixed(2) };
  for (const name of ARMS) { const a = arms[name]; const byLag = [];
    for (let lag = -100; lag <= 250; lag += FRAME) byLag.push({ lag, ...score(gtDisc, gtOpen, a, lag) });
    res[name] = byLag; }
  rows.push(res);
}
// Choose ONE global lag per arm (deployment needs a fixed compensation), by mean r (or group acc for disc-only)
const summary = {};
for (const name of ARMS) for (const lang of ["hi-IN", "en-IN"]) {
  const R = rows.filter(r => r.lang === lang); const L = R[0][name].length; let best = null;
  for (let i = 0; i < L; i++) { const m = R.map(r => r[name][i]); const meanR = m.reduce((s, x) => s + (x.r ?? 0), 0) / m.length;
    if (!best || meanR > best.meanR) best = { lag: Math.round(R[0][name][i].lag), meanR, rs: m.map(x => +(x.r ?? 0).toFixed(3)),
      exact: m[0].exact === undefined ? null : m.reduce((s, x) => s + x.exact, 0) / m.length, group: m[0].group === undefined ? null : m.reduce((s, x) => s + x.group, 0) / m.length,
      pp: `${m.reduce((s, x) => s + x.ppHit, 0)}/${m.reduce((s, x) => s + x.ppSegs, 0)}`,
      vowelClosed: +(m.reduce((s, x) => s + x.vowelClosed, 0) / m.length).toFixed(3),
      r_lag0: +(R.map(r => r[name].find(z => Math.abs(z.lag) < 1).r ?? 0).reduce((s, x) => s + x, 0) / R.length).toFixed(3) }; }
  summary[`${name}|${lang}`] = { ...best, meanR: +best.meanR.toFixed(3), exact: best.exact && +best.exact.toFixed(3), group: best.group && +best.group.toFixed(3) };
}
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(p * (s.length - 1))].toFixed(4); };
const over = costs.ha.filter(c => c > 128 / SR * 1000).length;
const perf = { headaudio_quanta_over_budget: over, headaudio_ms_per_128_quantum: { p50: pct(costs.ha, .5), p99: pct(costs.ha, .99), p999: pct(costs.ha, .999), max: pct(costs.ha, 1), n: costs.ha.length, budget_ms: +(128 / SR * 1000).toFixed(3) },
  wawa_ms_per_rAF: { p50: pct(costs.wawa, .5), p99: pct(costs.wawa, .99), max: pct(costs.wawa, 1), n: costs.wawa.length, note: "includes the JS FFT that a real AnalyserNode does natively; upper bound" } };
console.log(JSON.stringify({ n_utterances: rows.length, per_lang: { hi: rows.filter(r => r.lang === "hi-IN").length, en: rows.filter(r => r.lang === "en-IN").length }, summary, perf }, null, 1));
fs.writeFileSync("bench-result.json", JSON.stringify({ summary, perf, rows: rows.map(r => ({ file: r.file, lang: r.lang, durS: r.durS })) }, null, 1));
