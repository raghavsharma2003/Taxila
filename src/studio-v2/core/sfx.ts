// Synthesised sound: no assets, no network. One AudioContext per page, unlocked on the first pointer.
let ac: AudioContext | null = null, master: GainNode | null = null, muted = false;
function ensure(): AudioContext | null {
  if (ac) return ac;
  const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!A) return null;
  try { ac = new A(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.3; master.connect(ac.destination); } catch { ac = null; }
  return ac;
}
export interface Blip { f?: number; f2?: number; dur?: number; type?: OscillatorType; gain?: number }
export const sfx = {
  unlock(): void { const a = ensure(); if (a && a.state === "suspended") void a.resume().catch(() => {}); },
  setMuted(m: boolean): void { muted = m; if (master) master.gain.value = m ? 0 : 0.3; },
  get muted(): boolean { return muted; },
  blip(o: Blip = {}): void {
    const a = ac; if (!a || muted || a.state !== "running") return;
    try {
      const t = a.currentTime, d = o.dur ?? 0.12, osc = a.createOscillator(), g = a.createGain();
      osc.type = o.type ?? "sine"; osc.frequency.setValueAtTime(o.f ?? 660, t);
      if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      osc.connect(g); g.connect(master!); osc.start(t); osc.stop(t + d + 0.02);
    } catch { /* sound is best-effort */ }
  },
  noise(o: { dur?: number; f?: number; filter?: BiquadFilterType; gain?: number } = {}): void {
    const a = ac; if (!a || muted || a.state !== "running") return;
    try {
      const t = a.currentTime, d = o.dur ?? 0.2, buf = a.createBuffer(1, Math.ceil(a.sampleRate * d), a.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2);
      const src = a.createBufferSource(); src.buffer = buf;
      const f = a.createBiquadFilter(); f.type = o.filter ?? "lowpass"; f.frequency.value = o.f ?? 900;
      const g = a.createGain(); g.gain.value = o.gain ?? 0.25;
      src.connect(f); f.connect(g); g.connect(master!); src.start(t);
    } catch { /* best-effort */ }
  },
};
