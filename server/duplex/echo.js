// KNOWN-TEXT ECHO SUBTRACTION (ARCHITECTURE.md v2 §3.1, layer 2). We know exactly what she is saying: her text and, with
// seam S14, the DragonHD / Azure word-boundary times. Before markers, safety or a draft key ever see the child's words,
// any run of transcript tokens that matches a run of HER words audible in the last ~2 s is removed. This keeps her own
// voice out of the child's turn: the classic self-barge-in of hands-free cascades (`cascade-barge-all-or-nothing`: the
// 9/9 check ran over push-to-talk, so hands-free echo was never exercised).
//
// Pure and browser-safe (the device host and the server slice run the same code). Matching is by consonant skeleton across
// Roman and Devanagari: the SAME `skeleton()` the cascade lane's isEcho uses (imported, never copied).
//
// What is removed [E: DX-7 measures it]:
//   - a run of >= 2 consecutive transcript tokens that matches a consecutive run of her recent words;
//   - every matching token when the whole text is echo-shaped (>= 4 tokens, >= 70 % of them hers: the shipped isEcho rule).
// What is KEPT: an isolated single-token match. A child repeating one word of hers as an answer ("चौथाई", "बारह") is a
// turn, not an echo, and deleting it would delete an answer — except a FRESH one (her word ended <= 1 s before the text's
// audio time): that is her echo arriving token by token on a word-timed stream.
import { skeleton } from "../../src/lesson/cascadeLink.ts";

const WORD = /[^\p{L}\p{M}\p{N}]+/u;
const split = (t) => String(t ?? "").split(/\s+/).filter(Boolean);
const sk = (w) => skeleton(String(w).replace(new RegExp(WORD.source, "gu"), ""));
const surf = (w) => String(w).normalize("NFC").toLowerCase().replace(new RegExp(WORD.source, "gu"), "");

export const ECHO = { windowMs: 2000, minRun: 2, echoShare: 0.7, echoMinTokens: 4, freshMs: 1000 };

export class EchoSubtractor {
  /** @param {{ windowMs?: number, minRun?: number }} [o] */
  constructor(o = {}) {
    this.o = { ...ECHO, ...o };
    /** her words with audible times on the session clock: { u, w, sk, startMs, endMs } */
    this.words = [];
    this.stopped = new Map();
  }

  /** Her words with their audible times (seam S14: TTS word boundaries mapped to the playback clock). */
  heard(utteranceId, words) {
    for (const x of words) this.words.push({ u: utteranceId, w: x.w, sk: sk(x.w), startMs: x.startMs, endMs: x.endMs });
    this.trim(words.length ? words[words.length - 1].endMs : 0);
  }

  /** No word boundaries: estimate each word's audible time from the text and the playback rate (chars ∝ time). */
  heardText(utteranceId, text, startedAt, msPerChar) {
    const out = [];
    let pos = 0;
    const s = String(text ?? "");
    for (const w of split(s)) {
      const at = s.indexOf(w, pos);
      pos = at + w.length;
      out.push({ w, startMs: startedAt + at * msPerChar, endMs: startedAt + pos * msPerChar });
    }
    this.heard(utteranceId, out);
  }

  /** Her playback of this utterance stopped (yield, stop) at t: the words after t were never audible. */
  stopAt(utteranceId, t) {
    this.stopped.set(utteranceId, t);
  }

  trim(now) {
    const keep = now - 4 * this.o.windowMs;
    if (this.words.length > 400) this.words = this.words.filter((x) => x.endMs >= keep);
  }

  /** Her words audible inside [t - lagMs - windowMs, t] (text arrives lagMs after the audio it covers). */
  recent(t, lagMs = 0) {
    const from = t - lagMs - this.o.windowMs;
    // a WHOLE utterance stays matchable while any of it is recent: a streaming item that opened during her line is often
    // transcribed (and re-transcribed in its final) long after its first words (L2, 2026-10-04: her 3 s question at -30 dB
    // arrived as one final with the child's answer appended; a per-word 2 s window kept its first half)
    const uEnd = new Map();
    for (const x of this.words) uEnd.set(x.u, Math.max(uEnd.get(x.u) ?? -Infinity, x.endMs));
    return this.words.filter((x) => (x.endMs >= from || uEnd.get(x.u) >= from) && x.startMs <= t && !(this.stopped.has(x.u) && x.startMs > this.stopped.get(x.u)));
  }

  /**
   * @param {string} text the child's transcript (one item version, or the turn)
   * @param {number} t arrival time on the session clock
   * @param {number} [lagMs] the source's lag (her words that far back may be in this text)
   * @param {{fromMs:number, toMs:number}|null} [span] the audio this text describes, when known (fan-in passes it)
   * @returns {{ text: string, removed: number }}
   */
  subtract(text, t, lagMs = 0, span = null, times = null) {
    const toks = split(text);
    if (!toks.length) return { text: String(text ?? "").trim(), removed: 0 };
    // `span` = the audio the text describes: her words outside it cannot be in it (echo is captured, not remembered)
    const her = this.recent(t, lagMs).filter((x) => x.sk && (!span || (x.endMs >= span.fromMs - 100 && x.startMs <= span.toMs + 100)));
    if (!her.length) return { text: toks.join(" "), removed: 0 };
    const hs = her.map((x) => x.sk);
    const set = new Set(hs);
    const ts = toks.map(sk);
    const drop = new Array(toks.length).fill(false);
    // runs: transcript tokens i..j matching her words k..k+(j-i) (empty-skeleton tokens ride along inside a run)
    for (let i = 0; i < toks.length; i++) {
      if (!ts[i] || !set.has(ts[i])) continue;
      for (let k = 0; k < hs.length; k++) {
        if (hs[k] !== ts[i]) continue;
        let a = i, b = k, n = 0;
        while (a < toks.length && b < hs.length) {
          if (!ts[a]) { a++; continue; }
          if (ts[a] !== hs[b]) break;
          a++; b++; n++;
        }
        // a single matching token is kept (a child repeating one word of hers is a turn) UNLESS it is FRESH: her word ended
        // within freshMs of the text's own audio time (t - lag). While she is mid-sentence that is her echo arriving word by
        // word (word-timed streaming STT emits it one token at a time: TaxilaFDB F12, 2026-10-04, 26/40 self-yields).
        // the single-token case compares SURFACE forms, not consonant skeletons: one skeleton is too lossy for one word
        // ("हाँ" and her "हैं" share the skeleton "h"; M-D7 i10: a child's yes over her yes/no question was deleted as echo
        // and she resumed over the answer, 30/30 on the fast lane)
        // fresh echo arrives at the TAIL of the text as she speaks: without token times only the last two tokens qualify
        // (M-D7 c01: her uptake "तीन" deleted BOTH of the child's own "तीन"s, the first spoken 1 s before hers)
        const tailOk = times ? true : i >= toks.length - 2;
        const fresh = n === 1 && tailOk && surf(toks[i]) === surf(her[k].w) && her[k].endMs >= t - lagMs - this.o.freshMs && her[k].endMs <= t + 100;
        // with token times (word-timed sources) a token is echo only if it was heard WHILE her matching word was audible
        const aligned = !times || Array.from({ length: a - i }, (_, d) => i + d).every((x, d) => {
          const tw = times[x], hw = her[k + d];
          return !tw || !hw || (tw.endMs >= hw.startMs - 300 && tw.startMs <= hw.endMs + 300);
        });
        if ((n >= this.o.minRun || fresh) && aligned) for (let x = i; x < a; x++) drop[x] = true;
      }
    }
    // the whole text is echo-shaped: the shipped isEcho rule (>= 4 tokens, >= 70 % hers)
    const content = ts.filter(Boolean);
    if (content.length >= this.o.echoMinTokens && content.filter((s) => set.has(s)).length / content.length >= this.o.echoShare) {
      // ...but never past the last matched run: words AFTER her echo in the same item are the child's (a straddling item:
      // "<her question> एक मिनट" must keep "एक" even though "एक" is also one of her words)
      let lastRun = -1;
      for (let i = 0; i < drop.length; i++) if (drop[i]) lastRun = i;
      const upto = lastRun >= 0 ? lastRun : ts.length - 1;
      ts.forEach((s, i) => { if (i <= upto && (!s || set.has(s))) drop[i] = true; });
    }
    const removed = drop.filter(Boolean).length;
    if (!removed) return { text: toks.join(" "), removed: 0 };
    return { text: toks.filter((_, i) => !drop[i]).join(" "), removed };
  }
}
