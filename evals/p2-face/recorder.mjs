// The in-page recorder and the offline analysis for the product-path face measurements (ship5 p2-face). Shared by
// evals/p2-face/lipsync-product.mjs (the measurement) and tests/prod/p2-face-acceptance.mjs (the acceptance checks).
// INIT runs in the page (context.addInitScript): it changes nothing in the product, it only watches
//   - every AudioBufferSourceNode.start(): the samples and `when` the player scheduled;
//   - getOutputTimestamp() pairs (AudioContext time -> performance.now() at the output);
//   - per animation frame: the drawn lip gap, the lip source, the floor state, reveal; main-thread freezes > 100 ms;
//   - the puppet bus (viseme batches with playAt, cuts) once ?facerig=1 exposes it.
export const INIT = () => {
  const W = (window.__rec = { audio: [], ts: [], frames: [], bus: [], lt: [], ctx: null });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) W.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true }); } catch {}
  const start0 = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, offset = 0, duration) {
    try {
      const b = this.buffer;
      if (b && b.length) {
        W.ctx = this.context;
        const ch = b.getChannelData(0);
        const s = Math.max(0, Math.floor(offset * b.sampleRate));
        const n = duration !== undefined ? Math.min(ch.length - s, Math.floor(duration * b.sampleRate)) : ch.length - s;
        const i16 = new Int16Array(n);
        for (let i = 0; i < n; i++) i16[i] = Math.max(-32768, Math.min(32767, Math.round(ch[s + i] * 32767)));
        let bin = ""; const u8 = new Uint8Array(i16.buffer);
        for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        W.audio.push({ when: when || this.context.currentTime, rate: b.sampleRate, at: performance.now(), loop: !!this.loop, n, ctxRate: this.context.sampleRate, pcm: btoa(bin) });
      }
    } catch (e) { W.err = String(e); }
    return start0.call(this, when, offset, duration);
  };
  const stop0 = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function (when) { try { W.audio.push({ stop: true, when: when ?? this.context.currentTime, at: performance.now() }); } catch {} return stop0.call(this, when); };
  let hooked = false, lastRaf = 0;
  const safeStages = []; // stage objects stay out of W (it is serialised back to the test)
  W.rafGaps = [];
  const loop = () => {
    const now = performance.now();
    // every main-thread freeze over 100 ms, puppet or not (the control arm runs with ?puppet=0)
    if (lastRaf && now - lastRaf > 100 && document.visibilityState === "visible") W.rafGaps.push([Math.round(now), Math.round(now - lastRaf)]);
    lastRaf = now;
    const P = window.__puppet;
    if (P) {
      const m = P.mouthProbe();
      // (the v4 build's mouthProbe has only the gap: read the same facts off the stage for the before/after arm)
      // the safety-neutral face (policy R6): when it was first on, and what the policy did from then (the page may move on
      // to the safeguarding screen and unmount the face right after her reply, so it is captured as it happens)
      const safe = P.driver?.inSafety;
      if (safe) {
        // every stage seen in a safety turn (the TroubleScreen mounts a second one), and each one's policy log from then
        W.safety ??= { at: Math.round(now) };
        if (!safeStages.includes(P)) safeStages.push(P);
      }
      if (W.safety) W.safety.view = safeStages.map((st) => ({ inSafety: !!st.driver?.inSafety, log: (st.driver?.policy?.log ?? []).slice(-12) }));
      if (m) W.frames.push([Math.round(now * 10) / 10, Math.round(m.gap * 100) / 100, m.lip ?? P.lipSource, m.state ?? P.driver?.policy?.faceState, (m.revealed ?? P.revealed) ? 1 : 0]);
    }
    if (!hooked && window.__puppetBus) { hooked = true; window.__puppetBus.on((e) => { if (e.kind === "visemes") W.bus.push({ at: performance.now(), part: e.part, playAt: e.playAt, n: e.visemes.length, words: e.words?.length ?? 0, v: e.visemes.map((x) => [x.ms, x.id]) }); else W.bus.push({ at: performance.now(), kind: e.kind }); }); }
    if (W.ctx && W.ctx.getOutputTimestamp) { const t = W.ctx.getOutputTimestamp(); if (t.contextTime && t.performanceTime) W.ts.push([t.contextTime, t.performanceTime]); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

export const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
export function pearson(a, b, lag) { let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0; for (let i = 0; i < a.length; i++) { const j = i + lag; if (j < 0 || j >= b.length || Number.isNaN(b[j]) || Number.isNaN(a[i])) continue; const x = a[i], y = b[j]; n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; } if (n < 40) return -2; const c = sab / n - (sa / n) * (sb / n); return c / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2) + 1e-12); }

/** Lay the scheduled audio on the performance clock and cross-correlate its envelope with the drawn gap, per reply. */
export function analyse(rec) {
  const offs = rec.ts.map(([c, p]) => p - c * 1000);
  const off = q(offs, 0.5);
  const HOP = 5;
  // the scheduled samples on a 5 ms grid of the performance clock: each source's samples at perf = when*1000 + off
  const starts = rec.audio.filter((a) => !a.stop && a.rate === 24000).map((a) => {
    const b = Buffer.from(a.pcm, "base64"); const s = new Int16Array(b.buffer, b.byteOffset, b.length >> 1);
    return { t0: a.when * 1000 + off, rate: a.rate, s };
  });
  if (!starts.length || off == null) return { error: "no audio scheduled" };
  const T0 = Math.min(...starts.map((x) => x.t0)), T1 = Math.max(...starts.map((x) => x.t0 + (x.s.length / x.rate) * 1000));
  const n = Math.ceil((T1 - T0) / HOP) + 1;
  const e = new Float64Array(n), cnt = new Float64Array(n);
  for (const x of starts) for (let i = 0; i < x.s.length; i++) { const k = Math.floor((x.t0 + (i / x.rate) * 1000 - T0) / HOP); if (k >= 0 && k < n) { e[k] += (x.s[i] / 32768) ** 2; cnt[k]++; } }
  // 10 ms windows (2 hops), log energy; no audio scheduled = silence (-90 dB)
  const env = new Float64Array(n);
  for (let k = 0; k < n; k++) { const E = e[k] + (k + 1 < n ? e[k + 1] : 0), C = cnt[k] + (k + 1 < n ? cnt[k + 1] : 0); env[k] = C ? 10 * Math.log10(E / C + 1e-9) : -90; }
  // the drawn gap on the same grid (a frame is on screen until the next)
  const fr = rec.frames;
  const gap = new Float64Array(n).fill(NaN), lipAt = new Array(n).fill(null);
  let j = 0;
  for (let k = 0; k < n; k++) { const t = T0 + k * HOP; while (j + 1 < fr.length && fr[j + 1][0] <= t) j++; if (fr[j] && fr[j][0] <= t && (j + 1 >= fr.length || t - fr[j][0] < 250)) { gap[k] = fr[j][1]; lipAt[k] = fr[j][2]; } }
  // replies = runs of scheduled audio separated by >= 1.5 s of nothing
  const voiced = env.map((v) => v > -60);
  const segs = [];
  let s0 = -1, last = -1e9;
  for (let k = 0; k < n; k++) if (voiced[k]) { if (s0 < 0 || k - last > 300) { if (s0 >= 0) segs.push([s0, last]); s0 = k; } last = k; }
  if (s0 >= 0) segs.push([s0, last]);
  const rows = [];
  for (const [a, b] of segs) {
    if ((b - a) * HOP < 600) continue;
    const E = Array.from(env.slice(Math.max(0, a - 20), b + 20)), G = Array.from(gap.slice(Math.max(0, a - 20), b + 20));
    let best = -2, lag = 0;
    for (let l = -60; l <= 60; l++) { const r = pearson(E, G, l); if (r > best) { best = r; lag = l; } }
    const lips = lipAt.slice(a, b).filter((x, i) => voiced[a + i] && x);
    rows.push({ startMs: Math.round(T0 + a * HOP), secs: +(((b - a) * HOP) / 1000).toFixed(2), gapLagMs: lag * HOP, r: +best.toFixed(3), framesCovered: +(G.filter((x) => !Number.isNaN(x)).length / G.length).toFixed(2), visemeShare: lips.length ? +(lips.filter((x) => x === "visemes").length / lips.length).toFixed(3) : null });
  }
  // (A bilabial-closure metric was tried here and dropped: DragonHD's slow-rate speech does not dip the 10 ms envelope at
  // p/b/m reliably, so "min envelope" was not the closure; logged as rj-p2f-envelope-closure-metric.)
  const closure = {};
  // her first sound vs the face: was the live face revealed when her voice started, and how long after?
  const firstSound = T0 + (voiced.indexOf(true)) * HOP;
  const frameGapsSpeaking = [];
  for (let i = 1; i < fr.length; i++) if (fr[i][3] === "speaking") frameGapsSpeaking.push(fr[i][0] - fr[i - 1][0]);
  Object.defineProperty(closure, "grid", { enumerable: false, value: { T0, HOP, env: Array.from(env, (v) => Math.round(v * 10) / 10), gap: Array.from(gap, (v) => (Number.isNaN(v) ? null : Math.round(v * 100) / 100)) } });
  // per reply: its samples (24 kHz, silence where nothing was scheduled), the drawn gap and the envelope on the grid, for
  // the forced-alignment pass (ctc-product.py) and the paired score (score-product.mjs)
  const segments = segs.filter(([a, b]) => (b - a) * HOP >= 600).map(([a, b]) => {
    const t0 = T0 + a * HOP, t1 = T0 + (b + 1) * HOP;
    const pcm = new Int16Array(Math.ceil(((t1 - t0) / 1000) * 24000));
    for (const x of starts) { const off0 = Math.round(((x.t0 - t0) / 1000) * 24000); for (let i = 0; i < x.s.length; i++) { const j = off0 + i; if (j >= 0 && j < pcm.length) pcm[j] = x.s[i]; } }
    return { t0, pcm, gap: Array.from(gap.slice(a, b + 1), (v) => (Number.isNaN(v) ? null : v)) };
  });
  Object.defineProperty(closure, "segments", { enumerable: false, value: segments });
  // main-thread freezes (rAF gaps > 100 ms) that overlap her scheduled voice: the puppet's stall, or the page's?
  const voicedAt = (t) => { const k = Math.floor((t - T0) / HOP); return k >= 0 && k < n && voiced[k]; };
  const gapsInVoice = (rec.rafGaps ?? []).filter(([t, g]) => { for (let x = t - g; x <= t; x += 20) if (voicedAt(x)) return true; return false; });
  const voicedSecs = voiced.filter(Boolean).length * HOP / 1000;
  const freezes = { voicedSecs: +voicedSecs.toFixed(1), over100: gapsInVoice.length, over180: gapsInVoice.filter(([, g]) => g > 180).length, maxMs: gapsInVoice.length ? Math.max(...gapsInVoice.map(([, g]) => g)) : 0, per10s: +((gapsInVoice.filter(([, g]) => g > 180).length / Math.max(1, voicedSecs)) * 10).toFixed(2) };
  return { outputOffsetMs: Math.round(off), firstSoundAt: Math.round(firstSound), replies: rows, closure, freezes, rafGapSpeakingP95: q(frameGapsSpeaking, 0.95), rafGapSpeakingMax: frameGapsSpeaking.length ? Math.max(...frameGapsSpeaking) : null };
}

