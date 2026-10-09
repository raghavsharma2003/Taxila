// Procedural sound for play: no audio files, no network. One palette per art direction (paper · chalk · blip · glass) over
// one event vocabulary, so a sound always means the same kind of thing whatever the look. Short (≤ 400 ms), never music,
// ducked while the teacher speaks (G12: no music under her voice). A refused act is a soft "thup", never a buzzer.
import type { ArtTokens } from "../../../shared/play.ts";

export type SoundEvent = "tap" | "select" | "crack" | "atom" | "refuse" | "slide" | "land" | "good" | "look" | "tilt" | "tick" | "drop" | "pour" | "open";
let ac: AudioContext | null = null, master: GainNode | null = null;
let muted = false, duck = 1;
const BASE_GAIN = 0.32;
function ctx(): AudioContext | null {
  if (ac) return ac;
  if (typeof window === "undefined") return null;
  const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!A) return null;
  try { ac = new A(); master = ac.createGain(); master.gain.value = muted ? 0 : BASE_GAIN; master.connect(ac.destination); } catch { ac = null; }
  return ac;
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const semi = (f: number, n: number) => f * Math.pow(2, n / 12);

function tone(a: AudioContext, o: { f: number; f2?: number; dur: number; type?: OscillatorType; gain: number; at?: number; attack?: number }): void {
  const t = a.currentTime + (o.at ?? 0), osc = a.createOscillator(), g = a.createGain();
  osc.type = o.type ?? "sine"; osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain * duck, t + (o.attack ?? 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g); g.connect(master!); osc.start(t); osc.stop(t + o.dur + 0.03);
}
function noise(a: AudioContext, o: { dur: number; f: number; q?: number; type?: BiquadFilterType; gain: number; at?: number; sweep?: number }): void {
  const t = a.currentTime + (o.at ?? 0), n = Math.ceil(a.sampleRate * o.dur), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; ch[i] = ((s / 0x7fffffff) * 2 - 1) * Math.pow(1 - i / n, 2.2); }
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = o.type ?? "bandpass"; f.frequency.setValueAtTime(o.f, t); f.Q.value = o.q ?? 1.2;
  if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + o.dur);
  const g = a.createGain(); g.gain.value = o.gain * duck;
  src.connect(f); f.connect(g); g.connect(master!); src.start(t);
}
function bell(a: AudioContext, f: number, dur: number, gain: number, at = 0): void {
  const t = a.currentTime + at, car = a.createOscillator(), mod = a.createOscillator(), mg = a.createGain(), g = a.createGain();
  car.frequency.value = f; mod.frequency.value = f * 2.76; mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(1, t + dur);
  mod.connect(mg); mg.connect(car.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * duck, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  car.connect(g); g.connect(master!); car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
}

export const sound = {
  unlock(): void { const a = ctx(); if (a && a.state === "suspended") void a.resume().catch(() => {}); },
  setMuted(m: boolean): void { muted = m; if (master) master.gain.value = m ? 0 : BASE_GAIN; },
  /** while the teacher speaks the palette plays at 35% (her voice carries; the world still answers the child) */
  setDuck(on: boolean): void { duck = on ? 0.35 : 1; },
  get muted(): boolean { return muted; },
  play(art: Pick<ArtTokens, "sound">, ev: SoundEvent, n = 0): void {
    const a = ac;
    if (!a || muted || a.state !== "running" || !master) return;
    try { PALETTES[art.sound](a, ev, n); } catch { /* sound is best-effort */ }
  },
};

type Palette = (a: AudioContext, ev: SoundEvent, n: number) => void;
const PALETTES: Record<ArtTokens["sound"], Palette> = {
  // Kagaz: wood blocks and paper. Warm, low, rounded.
  paper: (a, ev, n) => {
    switch (ev) {
      case "tap": case "select": tone(a, { f: 520, dur: 0.07, type: "triangle", gain: 0.16 }); noise(a, { dur: 0.04, f: 2400, gain: 0.05 }); break;
      case "crack": noise(a, { dur: 0.16, f: 1800, sweep: 600, q: 0.8, gain: 0.32 }); tone(a, { f: 180, f2: 120, dur: 0.14, type: "triangle", gain: 0.18 }); break;
      case "atom": tone(a, { f: semi(392, PENTA[Math.min(n, 9)]), dur: 0.32, type: "triangle", gain: 0.2 }); tone(a, { f: semi(784, PENTA[Math.min(n, 9)]), dur: 0.2, gain: 0.06 }); break;
      case "refuse": noise(a, { dur: 0.12, f: 380, type: "lowpass", gain: 0.25 }); tone(a, { f: 140, dur: 0.12, gain: 0.12 }); break;
      case "slide": case "pour": noise(a, { dur: 0.22, f: 900, sweep: 2600, q: 0.6, gain: 0.12 }); break;
      case "land": case "drop": tone(a, { f: 220, f2: 150, dur: 0.12, type: "triangle", gain: 0.2 }); noise(a, { dur: 0.06, f: 700, type: "lowpass", gain: 0.12 }); break;
      case "good": tone(a, { f: 523, dur: 0.18, type: "triangle", gain: 0.16 }); tone(a, { f: 784, dur: 0.3, type: "triangle", gain: 0.16, at: 0.11 }); break;
      case "look": tone(a, { f: 330, dur: 0.2, type: "triangle", gain: 0.12 }); break;
      case "tilt": tone(a, { f: 110, f2: 90, dur: 0.3, type: "sawtooth", gain: 0.04 }); noise(a, { dur: 0.25, f: 300, type: "lowpass", gain: 0.06 }); break;
      case "tick": tone(a, { f: 1200, dur: 0.03, type: "triangle", gain: 0.06 }); break;
      case "open": noise(a, { dur: 0.25, f: 1400, sweep: 3000, q: 0.5, gain: 0.12 }); tone(a, { f: 440, dur: 0.25, type: "triangle", gain: 0.12, at: 0.08 }); break;
    }
  },
  // Chalk: dry ticks on slate, soft sine chimes.
  chalk: (a, ev, n) => {
    switch (ev) {
      case "tap": case "select": case "tick": noise(a, { dur: 0.035, f: 3400, q: 3, gain: 0.12 }); break;
      case "crack": noise(a, { dur: 0.12, f: 2800, sweep: 1200, q: 2, gain: 0.3 }); noise(a, { dur: 0.25, f: 5000, q: 0.7, gain: 0.05, at: 0.04 }); break;
      case "atom": tone(a, { f: semi(440, PENTA[Math.min(n, 9)]), dur: 0.4, gain: 0.18 }); break;
      case "refuse": noise(a, { dur: 0.1, f: 500, type: "lowpass", gain: 0.22 }); break;
      case "slide": case "pour": noise(a, { dur: 0.25, f: 4200, q: 4, gain: 0.08 }); break;
      case "land": case "drop": noise(a, { dur: 0.08, f: 900, type: "lowpass", gain: 0.25 }); tone(a, { f: 200, dur: 0.1, gain: 0.08 }); break;
      case "good": tone(a, { f: 660, dur: 0.22, gain: 0.14 }); tone(a, { f: 990, dur: 0.32, gain: 0.12, at: 0.1 }); break;
      case "look": tone(a, { f: 350, dur: 0.18, gain: 0.1 }); break;
      case "tilt": noise(a, { dur: 0.3, f: 700, q: 6, gain: 0.08 }); break;
      case "open": noise(a, { dur: 0.3, f: 3000, q: 0.8, gain: 0.08 }); tone(a, { f: 520, dur: 0.25, gain: 0.1, at: 0.06 }); break;
    }
  },
  // Blueprint: clean plotter blips.
  blip: (a, ev, n) => {
    switch (ev) {
      case "tap": case "select": tone(a, { f: 880, dur: 0.05, type: "square", gain: 0.05 }); break;
      case "tick": tone(a, { f: 1500, dur: 0.025, type: "square", gain: 0.03 }); break;
      case "crack": tone(a, { f: 660, f2: 330, dur: 0.12, type: "square", gain: 0.06 }); break;
      case "atom": tone(a, { f: semi(523, PENTA[Math.min(n, 9)]), dur: 0.22, gain: 0.16 }); break;
      case "refuse": tone(a, { f: 200, dur: 0.12, type: "sine", gain: 0.12 }); break;
      case "slide": case "pour": tone(a, { f: 400, f2: 900, dur: 0.16, gain: 0.07 }); break;
      case "land": case "drop": tone(a, { f: 300, f2: 180, dur: 0.1, gain: 0.14 }); break;
      case "good": tone(a, { f: 587, dur: 0.12, gain: 0.12 }); tone(a, { f: 880, dur: 0.24, gain: 0.12, at: 0.09 }); break;
      case "look": tone(a, { f: 392, dur: 0.16, gain: 0.08 }); break;
      case "tilt": tone(a, { f: 150, f2: 120, dur: 0.24, gain: 0.06 }); break;
      case "open": tone(a, { f: 440, f2: 660, dur: 0.2, gain: 0.08 }); break;
    }
  },
  // Raat: glassy FM bells in the dark.
  glass: (a, ev, n) => {
    switch (ev) {
      case "tap": case "select": case "tick": bell(a, 1320, 0.08, 0.05); break;
      case "crack": noise(a, { dur: 0.14, f: 2200, sweep: 700, q: 1, gain: 0.2 }); bell(a, 330, 0.25, 0.06); break;
      case "atom": bell(a, semi(523, PENTA[Math.min(n, 9)]), 0.5, 0.12); break;
      case "refuse": tone(a, { f: 160, dur: 0.14, gain: 0.12 }); break;
      case "slide": case "pour": noise(a, { dur: 0.2, f: 1600, sweep: 3600, q: 0.7, gain: 0.08 }); break;
      case "land": case "drop": bell(a, 262, 0.3, 0.1); break;
      case "good": bell(a, 659, 0.4, 0.1); bell(a, 988, 0.5, 0.08, 0.1); break;
      case "look": bell(a, 392, 0.3, 0.06); break;
      case "tilt": tone(a, { f: 98, f2: 82, dur: 0.3, gain: 0.06 }); break;
      case "open": bell(a, 440, 0.4, 0.08); bell(a, 660, 0.4, 0.06, 0.08); break;
    }
  },
};
