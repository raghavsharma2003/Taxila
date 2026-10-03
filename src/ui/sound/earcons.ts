// Earcons (PRODUCT-DESIGN-V2 §9.2): synthesised at runtime in WebAudio, zero asset bytes, identical on every
// device. The buffers are built once (prepare(), at lesson start) so play() is one BufferSource start: the WebView
// audio path already adds 100-300 ms [M], so the visual is the fast path and sound must add nothing on top.
// Voice: a sine with a soft triangle partial, 5 ms attack, a wood-and-felt decay. Every earcon is identical for
// every answer; nothing here is keyed to correctness, counts or streaks.
export type Earcon = "turn" | "mic_open" | "received" | "system" | "pause" | "resume";
export type EarconBand = "young" | "older";

/** Level in dBFS per band (§9.2 table). */
const LEVEL: Record<Earcon, [number, number]> = {
  turn: [-12, -18],
  mic_open: [-24, -26],
  received: [-24, -26],
  system: [-16, -18],
  pause: [-20, -20],
  resume: [-20, -20],
};

type Note = { f: number; at: number; dur: number };
const NOTES: Record<Earcon, Note[]> = {
  turn: [{ f: 659.25, at: 0, dur: 0.09 }, { f: 880, at: 0.13, dur: 0.12 }], // E5 → A5, 90 + 40 gap + 120 ms
  mic_open: [{ f: 1200, at: 0, dur: 0.04 }],
  received: [{ f: 1600, at: 0, dur: 0.03 }],
  system: [{ f: 440, at: 0, dur: 0.12 }, { f: 349.23, at: 0.12, dur: 0.12 }], // A4 → F4
  pause: [{ f: 392, at: 0, dur: 0.1 }, { f: 329.63, at: 0.1, dur: 0.1 }],
  resume: [{ f: 329.63, at: 0, dur: 0.1 }, { f: 392, at: 0.1, dur: 0.1 }],
};

const SYSTEM_MIN_GAP_MS = 60_000; // the trouble tone at most once per 60 s

let ctx: AudioContext | null = null;
const buffers = new Map<Earcon, AudioBuffer>();
let enabled = true;
let band: EarconBand = "older";
let lastSystem = -Infinity;

/** Render one earcon into a mono buffer (pure maths; no OfflineAudioContext needed). */
export function renderEarcon(name: Earcon, sampleRate: number): Float32Array {
  const notes = NOTES[name];
  const len = Math.ceil((Math.max(...notes.map((n) => n.at + n.dur)) + 0.12) * sampleRate);
  const out = new Float32Array(len);
  for (const n of notes) {
    const start = Math.floor(n.at * sampleRate);
    const total = Math.floor((n.dur + 0.1) * sampleRate);
    for (let i = 0; i < total && start + i < len; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, t / 0.005);
      const decay = Math.exp(-t / (n.dur * 0.55)); // felt: fast decay, no sustain
      const ph = 2 * Math.PI * n.f * t;
      const tri = (2 / Math.PI) * Math.asin(Math.sin(ph)); // the soft triangle partial
      out[start + i] += (0.82 * Math.sin(ph) + 0.18 * tri) * attack * decay;
    }
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) for (let i = 0; i < len; i++) out[i] /= peak;
  return out;
}

export function setEarcons(opts: { enabled?: boolean; band?: EarconBand }): void {
  if (opts.enabled !== undefined) enabled = opts.enabled;
  if (opts.band) band = opts.band;
}

/** Build the context and every buffer. Call at lesson start (inside a tap when possible). */
export function prepareEarcons(): void {
  try {
    if (!ctx) {
      const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    void ctx.resume().catch(() => {});
    for (const name of Object.keys(NOTES) as Earcon[]) {
      if (buffers.has(name)) continue;
      const data = renderEarcon(name, ctx.sampleRate);
      const b = ctx.createBuffer(1, data.length, ctx.sampleRate);
      b.getChannelData(0).set(data);
      buffers.set(name, b);
    }
  } catch {
    /* no WebAudio: every earcon has a visual twin (§11.6) */
  }
}

/** Play one earcon now. Returns the call time (performance.now) for the same-frame check, or -1 if skipped. */
export function playEarcon(name: Earcon): number {
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (!enabled) return -1;
  if (name === "system") {
    if (now - lastSystem < SYSTEM_MIN_GAP_MS) return -1;
    lastSystem = now;
  }
  try {
    if (!ctx || !buffers.size) prepareEarcons();
    if (!ctx) return -1;
    const buf = buffers.get(name);
    if (!buf) return -1;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const db = LEVEL[name][band === "young" ? 0 : 1];
    g.gain.value = Math.pow(10, db / 20);
    src.connect(g).connect(ctx.destination);
    src.start();
    if (typeof performance !== "undefined") performance.mark?.(`earcon:${name}`);
    return now;
  } catch {
    return -1;
  }
}
