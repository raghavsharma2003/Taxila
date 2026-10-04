// Stream generation for the duplex simulator: a scripted scenario -> timed words, 20 ms acoustic frames (RMS + F0), and a
// reactive STT model that emits partials and finals the way the measured live transcriber does (first partial delay,
// per-word lag, final latency after a commit, server-VAD auto-commit). Every number marked [C] is CALIBRATED from the live
// validation run (live-validate.mjs, results/live-validate-*.json); [M] measured elsewhere in the repo; [E] assumption.
//
// Deterministic for a given seed (mulberry32). No network.

export function rng(seed) {
  let s = seed >>> 0;
  const r = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  r.ln = (p50, p90) => Math.exp(Math.log(p50) + ((Math.log(p90) - Math.log(p50)) / 1.2816) * r.gauss());
  r.u = (a, b) => a + (b - a) * r();
  return r;
}

/** Syllable proxy for a token: Devanagari vowel signs/independent vowels, or Latin vowel groups. */
export function syllables(tok) {
  const dev = (tok.match(/[ऄ-औा-ौॠ-ॡ]/gu) || []).length;
  const consonantOnly = /[क-ह]/u.test(tok) ? Math.max(1, Math.ceil((tok.match(/[क-ह]/gu) || []).length / 2)) : 0;
  const lat = (tok.toLowerCase().match(/[aeiouy]+/g) || []).length;
  return Math.max(1, dev || consonantOnly, lat);
}

/**
 * Word timings for a scenario. Children speak ~1.5x slower than adults (learning-science §1.10) [E: 160 ms/syllable base].
 * `segDur` (optional) = measured voiced duration of each segment from real TTS audio; words then share it by syllables.
 * @returns {{ words: {w:string, seg:number, start:number, end:number}[], segs: {start:number, end:number, contour:string, text:string, pause:number}[], end:number, childStart:number }}
 */
export function timeline(sc, r, { rate = 1, pauseJitter = 0.2, segDur = null, start = null } = {}) {
  const words = [], segs = [];
  const drawn = 400 + Math.round(r.u(0, 300)); // wait time I before the child speaks [E] (always drawn: keeps the stream aligned)
  let t = start ?? (sc.teacher ? sc.teacher.childStartMs : drawn);
  const childStart = t;
  sc.segs.forEach(([text, pause, contour], si) => {
    const toks = text.split(/\s+/).filter(Boolean);
    const syl = toks.map(syllables);
    const total = segDur ? segDur[si] : syl.reduce((a, b) => a + b, 0) * 160 / rate + (toks.length - 1) * 50;
    const gapTotal = segDur ? 0 : (toks.length - 1) * 50;
    const perSyl = (total - gapTotal) / syl.reduce((a, b) => a + b, 0);
    const s0 = t;
    toks.forEach((w, i) => {
      const d = syl[i] * perSyl * (segDur ? 1 : r.u(0.85, 1.15));
      words.push({ w, seg: si, start: Math.round(t), end: Math.round(t + d) });
      t += d + (i < toks.length - 1 && !segDur ? r.u(30, 80) : 0);
    });
    const p = Math.round(pause * (1 + (pauseJitter ? r.u(-pauseJitter, pauseJitter) : 0)));
    segs.push({ start: Math.round(s0), end: Math.round(t), contour, text, pause: p });
    t += p;
  });
  return { words, segs, end: segs[segs.length - 1].end, childStart };
}

/**
 * 20 ms frames: RMS (linear) and F0 (Hz|null). Child F0 base ~ 280 Hz [E], declination across a segment, a final fall
 * ("f": -18% over the last 300 ms, energy -8 dB), a rise ("r": +22%), flat for "l". Room noise ~ -58 dBFS [E].
 */
export function frames(tl, r, { until, noiseDb = -58, f0Base = 280 } = {}) {
  const out = [];
  const end = until ?? tl.end + 6000;
  const base = f0Base * r.u(0.9, 1.1);
  let wi = 0;
  for (let t = 0; t <= end; t += 20) {
    while (wi < tl.words.length && tl.words[wi].end < t) wi++;
    const w = tl.words[wi];
    let db = noiseDb + r.gauss() * 1.5, f0 = null;
    if (w && t >= w.start && t <= w.end) {
      const seg = tl.segs[w.seg];
      const fromEnd = seg.end - t;
      const prog = (t - seg.start) / Math.max(1, seg.end - seg.start);
      const edge = Math.min(t - w.start, w.end - t);
      db = -24 + r.gauss() * 2 - (edge < 30 ? 6 : 0) - 2 * prog;
      f0 = base * (1 - 0.08 * prog);
      if (fromEnd < 300) {
        const k = 1 - fromEnd / 300;
        if (seg.contour === "f") { f0 *= 1 - 0.18 * k; db -= 8 * k; }
        if (seg.contour === "r") f0 *= 1 + 0.22 * k;
      }
      f0 *= 1 + r.gauss() * 0.015;
      if (r() < 0.12) f0 = null; // unvoiced consonants
    }
    out.push({ t, rms: Math.pow(10, db / 20), f0 });
  }
  return out;
}

/** STT model parameters. D4 = taxila-live-transcribe (eastus2), MAI = MAI-Transcribe-2-Streaming (southindia). */
export const STT = {
  D4: { name: "D4 live-transcribe", firstPartialMs: [1400, 2100], lagMs: [450, 900], finalAfterCommit: [450, 700], finalAfterVad: [450, 650], vadOverhead: [130, 250] },
  MAI: { name: "MAI-Tx-2-Streaming (Chennai)", firstPartialMs: [2580, 3200], lagMs: [900, 1600], finalAfterCommit: [68, 75], finalAfterVad: [68, 75], vadOverhead: [130, 250] },
  // duplex runtime (2026-10-04): MAI from a HOME in India: the in-DC 68 / 75 ms commit→final [T, STT-v3] plus a home-ISP
  // round trip of 40-100 ms [E]; partials as MAI. The micro-commit probe is what makes coverage exact on this lane.
  MAI_HOME: { name: "MAI-Tx-2-Streaming, home India [E]", firstPartialMs: [2580, 3200], lagMs: [900, 1600], finalAfterCommit: [110, 180], finalAfterVad: [110, 180], vadOverhead: [130, 250] },
  // Nemotron-3.5 hosted in India [E]: a partial every 320 ms, text complete 254 / 452 ms after speech (GPU host [T, STT-v3])
  // plus 40 ms RTT [E]; token timestamps, so partials carry word timings (exact coverage); no client commit needed.
  FAST: { name: "Nemotron-3.5 India, word timings [E]", firstPartialMs: [320, 640], lagMs: [294, 492], finalAfterCommit: [294, 492], finalAfterVad: [294, 492], vadOverhead: [130, 250], words: true },
};

/**
 * A reactive STT: call tick(t) every frame; commit(t) when the client commits; it auto-commits on server VAD silence.
 * Emits {type:"partial"|"final"|"speech_stopped", t, itemId, text}.
 */
export class SttSim {
  constructor(tl, r, p, { serverVadMs = 1500, punct = true } = {}) {
    this.tl = tl; this.r = r; this.p = p; this.serverVadMs = serverVadMs; this.punct = punct;
    this.queue = [];
    this.itemSeq = 0;
    this.item = null; // { id, firstWord, startAt, words:[], vis:[] }
    this.nextWord = 0;
    this.lastVoiceEnd = -Infinity;
    this.committedThrough = -1; // last word index committed
  }

  /** Punctuation the ASR adds at a segment end, from the contour. [E: "l" gets a comma half the time] */
  punctFor(w, isLastWord) {
    if (!this.punct) return "";
    const seg = this.tl.segs[w.seg];
    const segLast = this.tl.words.filter((x) => x.seg === w.seg).at(-1) === w;
    if (!segLast) return "";
    if (/[?？]$/.test(seg.text)) return "";
    if (seg.contour === "r") return "?";
    if (seg.contour === "f") return isLastWord ? "।" : ".";
    return this.r() < 0.5 ? "," : "";
  }

  wordText(w, isLast) { return w.w + this.punctFor(w, isLast); }

  openItem(t) {
    this.item = { id: `it${++this.itemSeq}`, startAt: t, words: [], visAt: [], committed: false };
  }

  tick(t) {
    const out = [];
    // words that have started by t join the open item (an item opens at speech onset)
    while (this.nextWord < this.tl.words.length && this.tl.words[this.nextWord].start <= t) {
      const w = this.tl.words[this.nextWord];
      if (!this.item) this.openItem(w.start);
      const prevVis = this.item.visAt.length ? this.item.visAt[this.item.visAt.length - 1] : 0;
      const first = this.item.startAt + this.r.ln(...this.p.firstPartialMs);
      const vis = Math.max(prevVis, first, w.end + this.r.ln(...this.p.lagMs));
      this.item.words.push(this.nextWord);
      this.item.visAt.push(vis);
      this.nextWord++;
    }
    const it = this.item;
    if (it && !it.committed) {
      // partial: cumulative text of the visible words of the open item
      const nVis = it.visAt.filter((v) => v <= t).length;
      if (nVis > (it.shown || 0)) {
        it.shown = nVis;
        const txt = it.words.slice(0, nVis).map((i) => this.tl.words[i].w).join(" ");
        const ev = { type: "partial", t, itemId: it.id, text: txt, audioStartMs: it.startAt };
        // a source with token timestamps (Nemotron) gives the words' audio times: exact coverage for the lexical horizon
        if (this.p.words) ev.words = it.words.slice(0, nVis).map((i) => ({ w: this.tl.words[i].w, startMs: this.tl.words[i].start, endMs: this.tl.words[i].end }));
        out.push(ev);
      }
      // server VAD backstop: silence since the last spoken word of this item
      const lastW = this.tl.words[it.words[it.words.length - 1]];
      const nextStart = this.nextWord < this.tl.words.length ? this.tl.words[this.nextWord].start : Infinity;
      if (lastW && lastW.end <= t && nextStart > t) {
        if (it.vadAt === undefined) it.vadAt = lastW.end + this.serverVadMs + this.r.ln(...this.p.vadOverhead);
        if (t >= it.vadAt && nextStart > it.vadAt) {
          out.push({ type: "speech_stopped", t, itemId: it.id });
          this.close(t, this.p.finalAfterVad);
        }
      } else it.vadAt = undefined;
    }
    for (const q of this.queue) if (!q.sent && q.t <= t) { q.sent = true; out.push({ ...q.ev, t }); }
    return out;
  }

  /** Close the open item now (client commit, or VAD): the final carries every word spoken before `t`. */
  close(t, lat) {
    const it = this.item;
    if (!it || it.committed) return null;
    const spoken = it.words.filter((i) => this.tl.words[i].end <= t + 40);
    const rest = it.words.filter((i) => this.tl.words[i].end > t + 40);
    if (!spoken.length) return null;
    it.committed = true;
    const lastIdx = this.tl.words.length - 1;
    const text = spoken.map((i) => this.wordText(this.tl.words[i], i === lastIdx)).join(" ");
    const at = t + this.r.ln(...lat);
    const ev = { type: "final", itemId: it.id, text, audioStartMs: it.startAt, audioEndMs: Math.min(t, this.tl.words[spoken[spoken.length - 1]].end + 40) };
    if (this.p.words) ev.words = spoken.map((i) => ({ w: this.tl.words[i].w, startMs: this.tl.words[i].start, endMs: this.tl.words[i].end }));
    this.queue.push({ t: at, ev });
    this.item = null;
    // words still being spoken roll into a new item
    if (rest.length) {
      this.openItem(t);
      for (const i of rest) { this.item.words.push(i); this.item.visAt.push(Math.max(t + this.r.ln(...this.p.firstPartialMs), this.tl.words[i].end + this.r.ln(...this.p.lagMs))); }
    }
    return at;
  }

  commit(t) { return this.close(t, this.p.finalAfterCommit); }
}

/** Lognormal (p50, p90) from a measured stat, guarded (p90 >= 1.05 p50, n >= 5), else null. */
function ln2(st) {
  if (!st || !st.n || st.n < 5 || st.p50 === null || st.p90 === null || st.p50 <= 0) return null;
  return [st.p50, Math.max(st.p90, Math.round(st.p50 * 1.05))];
}

/**
 * Calibrate STT.D4 in place from a live-validate (M-D2) result: first partial after onset, partial lag, final after a
 * client commit, final after server VAD, server-VAD overhead past its silence window. Returns what was applied.
 */
export function calibrate(live) {
  const c = live?.calibration;
  if (!c) return null;
  const applied = {};
  const set = (k, v) => { if (v) { STT.D4[k] = v; applied[k] = v; } };
  set("firstPartialMs", ln2(c.firstDeltaAfterOnsetMs));
  set("lagMs", ln2(c.deltaLagMs));
  set("finalAfterCommit", ln2(c.finalAfterClientCommitMs));
  set("finalAfterVad", ln2(c.finalAfterVadMs));
  if (c.vadOverheadMs) set("vadOverhead", ln2(c.vadOverheadMs));
  STT.D4.calibrated = `${live.id} ${live.date} n=${live.n}`;
  return { source: STT.D4.calibrated, applied };
}
