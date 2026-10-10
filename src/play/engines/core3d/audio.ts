// core3d audio bus (CORE-API §8). Procedural WebAudio only: no files, no network, no third-party AI (no music model is
// sold Direct from Azure). Every SFX is caused by the child's act or the law's answer; a miss is a soft "thup", never a
// buzzer. The music bed (O-G2) plays only when the dress allows it, and hard-ducks to 0 within ~120 ms whenever the
// teacher speaks (SFX to 35%). Nothing sounds before the child's first gesture (browsers block it anyway).
import type { AudioBus, Sfx } from "./api.ts";

const SFX_GAIN = 0.5, MUS_GAIN = 0.16, DUCK_SFX = 0.35;
/** time constant for the hard duck: setTargetAtTime reaches < 5% in 3τ = 120 ms */
export const DUCK_TAU_S = 0.03;
const CH: Record<"calm" | "drive", number[][]> = { calm: [[57, 64, 69], [53, 60, 65], [55, 62, 67], [52, 59, 64]], drive: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]] };
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Bus implements AudioBus {
  private ac: AudioContext | null = null;
  private sfxG: GainNode | null = null;
  private musG: GainNode | null = null;
  private humG: GainNode | null = null;
  private humF: BiquadFilterNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private mood: "calm" | "drive" | "off" = "off";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private step = 0;
  private speaking = false;
  private disposed = false;
  muted: boolean;
  /** the music bed may sound at all (DressedSpec.musicAllowed and the child's toggle) */
  musicAllowed: boolean;
  /** a test seam: every duck / music call is logged with the context time */
  readonly log: { ev: string; t: number }[] = [];
  constructor(o: { muted?: boolean; musicAllowed?: boolean } = {}) { this.muted = !!o.muted; this.musicAllowed = !!o.musicAllowed; }

  /** call on the child's first gesture */
  unlock(): void {
    if (this.disposed || this.muted) return;
    if (!this.ac) this.init();
    if (this.ac?.state === "suspended") void this.ac.resume().catch(() => {});
    if (this.mood !== "off" && !this.timer) this.startSeq();
  }
  private init(): void {
    if (typeof window === "undefined") return;
    const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return;
    try {
      const ac = new A(), master = ac.createGain(), comp = ac.createDynamicsCompressor();
      master.gain.value = 0.9; master.connect(ac.destination);
      comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
      const sfx = ac.createGain(); sfx.gain.value = this.speaking ? SFX_GAIN * DUCK_SFX : SFX_GAIN; sfx.connect(comp);
      const mus = ac.createGain(); mus.gain.value = 0; mus.connect(comp);
      const humG = ac.createGain(); humG.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 180;
      for (const f of [55, 55.7]) { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(lp); o.start(); }
      lp.connect(humG); humG.connect(sfx);
      Object.assign(this, { ac, sfxG: sfx, musG: mus, humG, humF: lp });
    } catch { this.ac = null; }
  }
  private env(g: GainNode, t: number, a: number, peak: number, d: number): void { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  private osc(type: OscillatorType, f: number, f2: number, t: number, dur: number, peak: number, dest: AudioNode | null = this.sfxG): void {
    const ac = this.ac; if (!ac || !dest) return;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    this.env(g, t, 0.004, peak, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  private noise(t: number, dur: number, f: number, f2: number, q: number, peak: number, type: BiquadFilterType = "bandpass"): void {
    const ac = this.ac; if (!ac || !this.sfxG) return;
    if (!this.noiseBuf) { const n = ac.sampleRate; this.noiseBuf = ac.createBuffer(1, n, n); const ch = this.noiseBuf.getChannelData(0); let s = 7; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; ch[i] = (s / 0x7fffffff) * 2 - 1; } }
    const src = ac.createBufferSource(); src.buffer = this.noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    fl.Q.value = q; const g = ac.createGain(); this.env(g, t, 0.006, peak, dur);
    src.connect(fl); fl.connect(g); g.connect(this.sfxG); src.start(t, (this.step % 7) * 0.07); src.stop(t + dur + 0.05);
  }
  sfx(ev: Sfx, o: { x?: number; c?: number } = {}): void {
    const ac = this.ac; if (!ac || this.muted || ac.state !== "running") return;
    const t = ac.currentTime;
    try {
      switch (ev) {
        case "aim": this.osc("sine", 660 + (o.x ?? 0) * 220, 0, t, 0.03, 0.04); break;           // pitch follows position
        case "fire": this.osc("square", 980, 180, t, 0.16, 0.18); this.noise(t, 0.12, 4000, 900, 1.2, 0.12); break;
        case "scan": this.osc("sine", 1400, 700, t, 0.22, 0.12); this.osc("triangle", 700, 1050, t + 0.05, 0.2, 0.06); break;
        case "hit": { const c = o.c ?? 1; this.osc("sine", 110, 38, t, 0.5, 0.55); this.noise(t, 0.6, 1800, 140, 0.8, 0.5 * c, "lowpass");
          [0, 4, 7, 12].forEach((s, i) => this.osc("triangle", 523 * Math.pow(2, s / 12), 0, t + 0.08 + i * 0.06, 0.22, 0.12)); break; }
        case "near": this.osc("triangle", 392, 0, t, 0.2, 0.1); this.osc("triangle", 494, 0, t + 0.1, 0.22, 0.08); break;
        case "miss": this.noise(t, 0.25, 600, 300, 2, 0.18); this.osc("sine", 300, 240, t, 0.12, 0.08); break;   // a soft "thup"
        case "reveal": this.osc("sine", 880, 1320, t, 0.18, 0.1); this.osc("sine", 1320, 0, t + 0.12, 0.25, 0.07); break;
        case "gate": this.osc("sine", 392, 0, t, 0.3, 0.1); this.osc("sine", 587, 0, t + 0.05, 0.3, 0.08); break;
        case "warp": this.noise(t, 1.2, 200, 6000, 0.7, 0.35); this.osc("sawtooth", 80, 640, t, 1.1, 0.12); break;
        case "select": this.osc("square", 1200, 0, t, 0.05, 0.05); break;
        case "undo": this.osc("triangle", 520, 390, t, 0.12, 0.08); break;
        case "land": this.osc("triangle", 220, 150, t, 0.12, 0.18); break;
        case "good": this.osc("triangle", 523, 0, t, 0.18, 0.14); this.osc("triangle", 784, 0, t + 0.11, 0.3, 0.14); break;
        case "look": this.osc("triangle", 330, 0, t, 0.2, 0.1); break;
      }
    } catch { /* sound is best-effort */ }
  }
  hum(level: number): void {
    const ac = this.ac; if (!ac || !this.humG || !this.humF) return;
    const l = Math.max(0, Math.min(1, level));
    this.humG.gain.setTargetAtTime(this.muted ? 0 : 0.02 + l * 0.05, ac.currentTime, 0.2);
    this.humF.frequency.setTargetAtTime(160 + l * 260, ac.currentTime, 0.2);
  }
  music(mood: "calm" | "drive" | "off"): void {
    this.mood = this.musicAllowed && !this.muted ? mood : "off";
    this.log.push({ ev: `music:${this.mood}`, t: this.ac?.currentTime ?? -1 });
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.mood === "off") { if (this.ac && this.musG) this.musG.gain.setTargetAtTime(0, this.ac.currentTime, DUCK_TAU_S); return; }
    if (this.ac) this.startSeq();
  }
  private startSeq(): void {
    const ac = this.ac; if (!ac || !this.musG || this.mood === "off") return;
    const mood = this.mood, bpm = mood === "drive" ? 112 : 92, dt = 60 / bpm / 4;
    let next = ac.currentTime + 0.1; this.step = 0;
    const tick = () => {
      if (this.disposed || this.mood !== mood || !this.ac || !this.musG) return;
      while (next < ac.currentTime + 0.25) {
        const s = this.step % 16, chord = CH[mood][Math.floor(this.step / 16) % 4];
        if (s === 0) for (const n of chord) { const o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle"; o.frequency.value = midi(n - 12); this.env(g, next, 0.4, 0.12, dt * 15); o.connect(g); g.connect(this.musG); o.start(next); o.stop(next + dt * 16); }
        if (s % 2 === 0) { const n = chord[(s / 2) % 3] + (s % 8 === 6 ? 12 : 0); const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = midi(n); this.env(g, next, 0.005, 0.07, dt * 1.6); o.connect(g); g.connect(this.musG); o.start(next); o.stop(next + dt * 2); }
        if (mood === "drive" && s % 4 === 0) this.osc("sine", 90, 40, next, 0.12, 0.18, this.musG);
        next += dt; this.step++;
      }
      this.timer = setTimeout(tick, 60);
    };
    tick();
    this.applyDuck();
  }
  duck(on: boolean): void { this.speaking = on; this.log.push({ ev: `duck:${on ? 1 : 0}`, t: this.ac?.currentTime ?? -1 }); this.applyDuck(); }
  private applyDuck(): void {
    const ac = this.ac; if (!ac || !this.musG || !this.sfxG) return;
    const musicOn = this.mood !== "off";
    // her voice owns the air: music to 0 fast (τ 30 ms ⇒ e^-4 ≈ 2% at 120 ms, margin for the speaking signal's own latency; measured 5.1% at τ 40 ms); back slowly after she stops
    this.musG.gain.setTargetAtTime(this.speaking || !musicOn ? 0 : MUS_GAIN, ac.currentTime, this.speaking ? DUCK_TAU_S : 0.4);
    this.sfxG.gain.setTargetAtTime(this.speaking ? SFX_GAIN * DUCK_SFX : SFX_GAIN, ac.currentTime, 0.05);
  }
  /** the music gain right now (harness: proves the duck) */
  musicGain(): number { return this.musG?.gain.value ?? 0; }
  setMuted(m: boolean): void { this.muted = m; if (m) this.music("off"); this.hum(0); }
  dispose(): void {
    this.disposed = true; if (this.timer) clearTimeout(this.timer);
    try { void this.ac?.close(); } catch { /* gone */ }
    this.ac = null;
  }
}
