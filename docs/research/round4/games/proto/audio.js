// Antariksh Nishana · sound. Everything is synthesised (WebAudio): no files, no network, no third-party AI (no music model
// is sold Direct from Azure). Every effect is caused by the child's act or the law's answer to it. The music bed is the one
// thing real games have that G12 forbids "under the teacher": here it hard-ducks to silence whenever she speaks and is off
// by default for classes 4-5 (owner decision O-G2 in FEASIBILITY.md §6).
let ac = null, master = null, sfx = null, mus = null, hum = null, humGain = null;
let musicOn = false, musicTimer = 0, step = 0, mood = "calm", speaking = false;
const SFX_GAIN = 0.5, MUS_GAIN = 0.16;

export function initAudio() {
  if (ac) return ac;
  const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
  try {
    ac = new A(); master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
    sfx = ac.createGain(); sfx.gain.value = SFX_GAIN; sfx.connect(comp);
    mus = ac.createGain(); mus.gain.value = 0; mus.connect(comp);
    // engine hum: two detuned saws through a low-pass, gain follows ship speed
    humGain = ac.createGain(); humGain.gain.value = 0.0; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 180;
    for (const f of [55, 55.7]) { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(lp); o.start(); }
    lp.connect(humGain); humGain.connect(sfx); hum = lp;
  } catch { ac = null; }
  return ac;
}
export const audioReady = () => !!ac;
export function resume() { if (ac && ac.state === "suspended") ac.resume(); }

function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function osc(type, f, f2, t, dur, peak, dest = sfx) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); env(g, t, 0.004, peak, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(t, dur, f, f2, q, peak, type = "bandpass") {
  if (!noiseBuf) { const n = ac.sampleRate; noiseBuf = ac.createBuffer(1, n, n); const ch = noiseBuf.getChannelData(0); let s = 7; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; ch[i] = (s / 0x7fffffff) * 2 - 1; } }
  const src = ac.createBufferSource(); src.buffer = noiseBuf; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q; const g = ac.createGain(); env(g, t, 0.006, peak, dur);
  src.connect(fl); fl.connect(g); g.connect(sfx); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
}

/** closeness 0..1 (1 = on target) shapes the hit: a better shot sounds bigger, never a buzzer for a miss */
export function play(ev, o = {}) {
  if (!ac) return; const t = ac.currentTime;
  switch (ev) {
    case "aim": osc("sine", 660 + (o.x ?? 0) * 220, 0, t, 0.03, 0.04); break;                 // a soft tick while steering, pitch = position
    case "fire": osc("square", 980, 180, t, 0.16, 0.18); noise(t, 0.12, 4000, 900, 1.2, 0.12); break;
    case "hit": { const c = o.c ?? 1; osc("sine", 110, 38, t, 0.5, 0.55); noise(t, 0.6, 1800, 140, 0.8, 0.5 * c, "lowpass");
      [0, 4, 7, 12].forEach((s, i) => osc("triangle", 523 * Math.pow(2, s / 12), 0, t + 0.08 + i * 0.06, 0.22, 0.12)); break; }
    case "miss": noise(t, 0.25, 600, 300, 2, 0.18); osc("sine", 300, 240, t, 0.12, 0.08); break;   // a soft "thup"
    case "reveal": osc("sine", 880, 1320, t, 0.18, 0.1); osc("sine", 1320, 0, t + 0.12, 0.25, 0.07); break;
    case "lock": osc("square", 1200, 0, t, 0.05, 0.06); osc("square", 1600, 0, t + 0.07, 0.05, 0.06); break;
    case "warp": noise(t, 1.2, 200, 6000, 0.7, 0.35); osc("sawtooth", 80, 640, t, 1.1, 0.12); break;
    case "gate": osc("sine", 392, 0, t, 0.3, 0.1); osc("sine", 587, 0, t + 0.05, 0.3, 0.08); break;
  }
}
export function setHum(speed) { if (humGain) humGain.gain.setTargetAtTime(0.02 + speed * 0.05, ac.currentTime, 0.2); if (hum) hum.frequency.setTargetAtTime(160 + speed * 260, ac.currentTime, 0.2); }

// --- music: a 16-step lookahead sequencer (pentatonic, 4 chords). Mood from the spec's enum; ducks under her voice. ---
const CH = { calm: [[57, 64, 69], [53, 60, 65], [55, 62, 67], [52, 59, 64]], drive: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]] };
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
export function startMusic(m) {
  if (!ac || m === "off") return; mood = CH[m] ? m : "calm"; musicOn = true; step = 0;
  let next = ac.currentTime + 0.1; const bpm = mood === "drive" ? 112 : 92, dt = 60 / bpm / 4;
  const tick = () => {
    if (!musicOn) return;
    while (next < ac.currentTime + 0.25) {
      const bar = Math.floor(step / 16) % 4, s = step % 16, chord = CH[mood][bar];
      if (s === 0) for (const n of chord) { const o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle"; o.frequency.value = midi(n - 12); env(g, next, 0.4, 0.12, dt * 15); o.connect(g); g.connect(mus); o.start(next); o.stop(next + dt * 16); }
      if (s % 2 === 0) { const n = chord[(s / 2) % 3] + (s % 8 === 6 ? 12 : 0); const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = midi(n); env(g, next, 0.005, 0.07, dt * 1.6); o.connect(g); g.connect(mus); o.start(next); o.stop(next + dt * 2); }
      if (mood === "drive" && s % 4 === 0) { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(90, next); o.frequency.exponentialRampToValueAtTime(40, next + 0.12); env(g, next, 0.003, 0.18, 0.12); o.connect(g); g.connect(mus); o.start(next); o.stop(next + 0.2); }
      next += dt; step++;
    }
    musicTimer = setTimeout(tick, 60);
  };
  tick(); duck(speaking);
}
export function stopMusic() { musicOn = false; clearTimeout(musicTimer); if (mus) mus.gain.setTargetAtTime(0, ac.currentTime, 0.05); }
/** her voice owns the air: music to 0 in ~120 ms, effects to half; back after she stops */
export function duck(isSpeaking) {
  speaking = isSpeaking; if (!ac) return;
  mus.gain.setTargetAtTime(isSpeaking || !musicOn ? 0 : MUS_GAIN, ac.currentTime, isSpeaking ? 0.04 : 0.4);
  sfx.gain.setTargetAtTime(isSpeaking ? SFX_GAIN * 0.5 : SFX_GAIN, ac.currentTime, 0.05);
}
