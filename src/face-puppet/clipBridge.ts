// Pre-rendered clips → the puppet (round 7 face-prerendered-clip-visemes). Her Hello greeting and the onboarding language
// samples are MP3 clips with no TTS stream behind them, so the face used to lip-sync from the amplitude meter alone (an
// opening jaw, no consonant shapes, no seals). Each clip now ships a sidecar, <clip>.visemes.json, written offline from
// the clip's own audio (scripts/character/clip-visemes.py: letter-CTC timing → the Azure viseme ids the live path uses),
// and this bridge puts it on the puppet bus exactly as the live PCM player does: one "visemes" part whose playAt is the
// performance.now() ms at which the clip's FIRST sample sounds, re-anchored on every play / seek, and a "cut" when it
// stops early. The sidecar is optional: a clip without one keeps the meter path.
import { puppetBus, type VisemeEvent, type WordEvent } from "./bus.ts";
import { anchorPerfTime } from "./ttsBridge.ts";

export interface ClipSidecar { rev: number; durMs: number; visemes: VisemeEvent[]; words: WordEvent[] }

export const sidecarUrl = (clipUrl: string): string => clipUrl.replace(/\.(mp3|ogg|opus|wav|m4a)(\?.*)?$/i, ".visemes.json");

const cache = new Map<string, Promise<ClipSidecar | null>>();
export function loadSidecar(clipUrl: string, fetchImpl: typeof fetch = fetch): Promise<ClipSidecar | null> {
  const url = sidecarUrl(clipUrl);
  let p = cache.get(url);
  if (!p) {
    p = fetchImpl(url).then((r) => (r.ok ? (r.json() as Promise<ClipSidecar>) : null)).then((s) => (s && Array.isArray(s.visemes) ? s : null)).catch(() => null);
    cache.set(url, p);
  }
  return p;
}

/** The events still ahead of `fromMs` into the clip, re-timed so the part starts at the clip's start. */
export function remaining(s: ClipSidecar, fromMs: number): { visemes: VisemeEvent[]; words: WordEvent[] } {
  return { visemes: s.visemes.filter((v) => v.ms >= fromMs - 1), words: s.words.filter((w) => w.ms + w.durMs >= fromMs) };
}

let part = 9000; // clip parts never collide with a reply's part numbers (0..n) on the bus

/**
 * Wire one <audio> element's clip to the face. `ctx` is the AudioContext the element plays through (its output latency
 * moves the anchor); without one the element's own clock is used. Returns the detach function.
 */
export function attachClipVisemes(el: HTMLMediaElement, clipUrl: string, ctx?: AudioContext | null): () => void {
  let side: ClipSidecar | null = null;
  let alive = true;
  void loadSidecar(clipUrl).then((s) => { if (alive) { side = s; if (s && !el.paused) emit(); } });
  const emit = () => {
    if (!side) return;
    const at = el.currentTime * 1000;
    // the clip's t = 0 in performance.now() ms: now minus how far in it is, plus the output path's latency
    const startPerf = ctx ? anchorPerfTime(ctx.currentTime, ctx) - at : performance.now() - at;
    const r = remaining(side, at);
    puppetBus.emit({ kind: "visemes", part: part++, playAt: startPerf, visemes: r.visemes, words: r.words });
  };
  const cut = () => puppetBus.emit({ kind: "cut", at: performance.now() });
  const onPause = () => { if (!el.ended) cut(); };
  el.addEventListener("playing", emit);
  el.addEventListener("seeked", emit);
  el.addEventListener("pause", onPause);
  return () => {
    alive = false;
    el.removeEventListener("playing", emit);
    el.removeEventListener("seeked", emit);
    el.removeEventListener("pause", onPause);
  };
}
