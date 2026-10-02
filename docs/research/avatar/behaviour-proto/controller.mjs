// controller.mjs: Taxila tutor non-verbal behaviour controller (research prototype, 2026-10-02).
// Pure JS, no DOM, no deps. One instance per mounted tutor. Call update(dtMs, audio) once per rAF (<=30 fps).
// Output is the *upper-face + head + gaze* layer of FaceFrame (audio-to-face-ml.md §5.1); the lip layer
// (web-3d-talking-heads.md §6.2) is composited on top and wins bilabial closures.
// Every distribution below is cited in ../behaviour-expressiveness.md; [U] values are design guesses to tune.

export function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const N = (r, [m, s], lo = 0.05, hi = Infinity) => Math.min(hi, Math.max(lo, m + s * gauss(r)));
function gamma(r, k, theta) { const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = gauss(r); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = r(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * theta; } }
const pick = (r, w) => { let s = r() * Object.values(w).reduce((a, b) => a + b, 0); for (const [k, v] of Object.entries(w)) { if ((s -= v) <= 0) return k; } return Object.keys(w)[0]; };
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const DEFAULTS = {
  // Blinks/min. Bentivoglio 1997 (n=150): rest 17, conversation 26, reading 4.5. "module" = gaze on canvas.
  blinkPerMin: { idle: 17, speaking: 26, yielding: 20, your_turn: 18, listening: 18, thinking: 22, module: 10 },
  blinkK: 3,                                   // gamma shape [U]: k=3 avoids metronome AND clumping
  blinkMs: { close: 70, hold: 40, open: 140 }, // 250 ms total; listener blinks stay short (Hömke 2018)
  blinkDoubleP: 0.12,
  // Andrist, Tan, Gleicher & Mutlu 2014 (HRI) human-human gaze-aversion model (n=48), seconds [M, SD]
  avertSpeak: { len: [1.96, 0.32], gap: [4.75, 1.39] },
  avertListen: { len: [1.14, 0.27], gap: [7.21, 1.88] },
  avertCognitive: { len: [3.54, 1.26] },
  avertFloor: { len: [2.30, 1.10], endAfterResume: [1.27, 0.51] },
  yieldLeadS: 2.41,                            // mutual gaze engaged this long before a floor-passing end
  // Ho, Foulsham & Kingstone 2015 (n=40): direct gaze lags own speech onset by ~0.74-0.78 s
  regazeAfterOnset: [0.75, 0.3],
  thinkAvertDelay: [0.3, 0.1],                 // [U] don't avert on the child's last syllable
  thinkAvertCapS: 3.5,
  avertDeg: { up: [8, -10], side: [12, 0], down: [6, 8] }, // [yaw, pitch] magnitude (deg), sign chosen per event
  microSaccade: { gap: [1.2, 0.4], ampDeg: [2.0, 0.6] },   // >=1.5 deg so it is visible at phone face size
  nod: { k: 120, zeta: 0.6, minGapS: 0.35, ampDeg: [1.5, 3.0] },
  browFlash: { amp: 0.22, ms: 320, refractoryS: 1.2, p: 0.35 },
  listenNod: { minSpeechS: 0.7, pauseS: 0.3, refractoryS: 3.0, p: 0.5, ampDeg: 2.5 },
  bigGapS: 30,                                  // expressive budget: >=30 s between big expressions [U]
  bandScale: { B1: 1.0, B2: 0.9, B3: 0.7, B4: 0.55 },
};

// Emotion programs: ARKit deltas at intensity 1, plus head/gaze/tempo modifiers. Shapes, never lines.
export const EMOTIONS = {
  neutral:   { bs: {}, tilt: 0, headGain: 1, contact: 0.65, env: [300, 0, 600] },
  warm:      { bs: { mouthSmile: 0.28, cheekSquint: 0.12, eyeSquint: 0.10 }, tilt: 2, headGain: 0.9, contact: 0.7, env: [600, 1500, 900] },
  curious:   { bs: { browInnerUp: 0.28, browOuterUp: 0.22, mouthSmile: 0.08 }, tilt: 6, headGain: 1.0, contact: 0.85, env: [350, 1800, 700] },
  excited:   { bs: { mouthSmile: 0.55, cheekSquint: 0.35, eyeSquint: 0.2, browOuterUp: 0.25, eyeWide: 0.12 }, tilt: 3, headGain: 1.35, contact: 0.7, env: [350, 1200, 900] },
  concerned: { bs: { browInnerUp: 0.30, browDown: 0.06, mouthPress: 0.12 }, tilt: 5, headGain: 0.7, contact: 0.75, env: [700, 2500, 1200] },
  proud:     { bs: { mouthSmile: 0.45, cheekSquint: 0.32, eyeSquint: 0.22 }, tilt: 3, headGain: 0.9, contact: 0.85, env: [550, 1600, 1000], nod: true },
};
const BIG = 0.6;

export function createBehaviourController({ band = 'B2', style = {}, seed = 1, cps = 13.5 } = {}) {
  const P = { ...DEFAULTS, ...style };
  const r = rng32(seed);
  const scale = P.bandScale[band] ?? 0.8;
  const asym = 1 + (r() - 0.5) * 0.12;          // fixed per-character L/R asymmetry, never perfect symmetry
  let t = 0;                                    // seconds, controller clock (= rAF clock = lip clock)
  const S = {
    state: 'idle', stateT: 0, handover: 'chain', armed: null, moduleOn: false, moduleDir: [-18, 10],
    speakT0: -1, totalChars: -1, childSpeechT0: -1, childLastVoiced: -1, childPausing: false,
    herVoiced: false, herPauseT0: -1, herLastResume: -1,
    gaze: { mode: 'child', yaw: 0, pitch: 0, tYaw: 0, tPitch: 0, until: 0, reason: '' },
    nextAvert: 0, nextMicro: 0, micro: [0, 0],
    blink: { next: 0, phase: -1, t0: 0, dur: 0, lastEnd: -9, queueDouble: false },
    nod: { x: 0, v: 0, lastT: -9 }, tilt: 0, lean: 0, drift: [r() * 99, r() * 99, r() * 99],
    emo: { kind: 'neutral', I: 0, t0: 0, env: [1, 0, 1] }, lastBig: -999, brow: { t0: -9, amp: 0 },
    rms: { fast: 0, slow: 0.02, lastAccent: -9 }, listenNodLast: -9, turnN: 0, praiseTurn: -99,
    log: [],
  };
  const ev = (type, extra = {}) => S.log.push({ t, type, state: S.state, ...extra });

  function setState(s) { if (s === S.state) return; ev('state', { to: s }); S.state = s; S.stateT = t; onEnter(s); }
  function look(mode, yaw, pitch, dur, reason) {
    S.gaze.mode = mode; S.gaze.tYaw = yaw; S.gaze.tPitch = pitch; S.gaze.until = t + dur; S.gaze.reason = reason;
    ev('gaze', { mode, reason, dur: +dur.toFixed(2) }); rescaleBlink();
    if (Math.hypot(yaw - S.gaze.yaw, pitch - S.gaze.pitch) > 15 && r() < 0.6) blinkNow('gaze-evoked', 1.0); // gaze-evoked blink [S]
  }
  function lookChild(reason = 'contact') { look('child', 0, 0, 1e9, reason); }
  function avert(kind, dur) {
    const w = kind === 'cognitive' ? { up: 0.45, side: 0.35, down: 0.2 } : { side: 0.55, down: 0.25, up: 0.2 };
    const d = pick(r, w), [ay, ap] = P.avertDeg[d], sgn = r() < 0.5 ? -1 : 1;
    look('avert', d === 'side' ? sgn * ay : sgn * ay * 0.4, ap, dur, kind + ':' + d);
  }
  const blinkMean = () => 60 / (P.blinkPerMin[S.gaze.mode === 'module' ? 'module' : S.state] ?? 17);
  function scheduleBlink() { S.blink.mean = blinkMean(); S.blink.next = t + gamma(r, P.blinkK, S.blink.mean / P.blinkK); }
  // On a state or gaze-mode change, time-warp the pending interval instead of re-drawing it: re-drawing a
  // gamma(k=3) renewal on every short state resets its rising hazard and silently halves the blink rate.
  function rescaleBlink() { const m = blinkMean(), old = S.blink.mean ?? m; if (S.blink.phase < 0 && S.blink.next > t) S.blink.next = t + (S.blink.next - t) * (m / old); S.blink.mean = m; }
  // Event blinks ADVANCE an imminent scheduled blink to the boundary instead of adding one, so blinks cluster at
  // phrase ends and gaze shifts (Nakano 2010; gaze-evoked blinks) without inflating the per-state rate.
  function blinkNow(why, win = 0.6) { if (t - S.blink.lastEnd < 0.6 || S.blink.phase >= 0) return; if (S.blink.next - t > win * (S.blink.mean ?? 3)) return; S.blink.next = t; S.blink.why = why; }
  function emote(kind, intensity = 1, why = '') {
    const E = EMOTIONS[kind]; if (!E) return false;
    let I = Math.min(intensity, 3) / 3 * scale;          // intensity 0..3 from the Director, band-capped
    if (I >= BIG * scale && t - S.lastBig < P.bigGapS) I = Math.min(I, 0.45 * scale);  // budget: demote, don't drop
    if (I >= BIG * scale) S.lastBig = t;
    S.emo = { kind, I, t0: t, env: E.env };
    ev('emote', { kind, I: +I.toFixed(2), why });
    if (E.nod) S.nod.v -= 3.2 * 10;                    // one slow nod with pride
    return true;
  }
  function release(ms) { const L = emoLevel(); S.emo = { kind: S.emo.kind, I: L, t0: t, env: [1, 0, ms] }; }
  function emoLevel() {
    const { t0, env: [a, h, rel], I } = S.emo, dt = (t - t0) * 1000;
    if (dt < a) return I * (0.5 - 0.5 * Math.cos(Math.PI * dt / a));   // eased onset: 300-700 ms (Krumhuber & Kappas)
    if (dt < a + h) return I;
    if (dt < a + h + rel) return I * (0.5 + 0.5 * Math.cos(Math.PI * (dt - a - h) / rel));
    return 0;
  }

  function onEnter(s) {
    if (s === 'speaking') {
      S.turnN++; S.speakT0 = t; S.totalChars = -1;
      const a = S.armed; S.armed = null;
      if (a?.emotion) emote(a.emotion, a.intensity ?? 1, 'armed');
      if (a?.browFlash !== false) S.brow = { t0: t + 0.05, amp: P.browFlash.amp };  // discourse-segment start flash
      if (S.gaze.mode === 'avert') S.gaze.until = t + N(r, P.regazeAfterOnset, 0.2, 1.5);  // finish thinking aversion
      S.nextAvert = t + N(r, P.avertSpeak.gap, 1.5);
    }
    if (s === 'yielding') { lookChild('yield'); S.nextAvert = 1e9; if (S.handover !== 'chain') S.brow = { t0: t, amp: 0.14, hold: true }; }
    if (s === 'your_turn') {
      S.lean = 1;                                                    // lean-in: the "your turn" body cue
      if (S.handover === 'try' && S.moduleOn) look('module', ...S.moduleDir, 2.5, 'ring:module'); else lookChild('ring');
      S.nextAvert = t + N(r, P.avertListen.gap, 3);
    }
    if (s === 'listening') { S.lean = 0.5; S.brow.hold = false; S.childSpeechT0 = t; S.childLastVoiced = t; lookChild('listen'); S.nextAvert = t + N(r, P.avertListen.gap, 3); }
    if (s === 'thinking') {
      S.lean = 0.2; S.brow.hold = false;
      release(300);                                                  // verdict-neutral face while she "thinks"
      S.thinkAvertAt = t + N(r, P.thinkAvertDelay, 0.1, 0.6);
    }
    if (s === 'idle') { S.lean = 0; S.brow.hold = false; }
    rescaleBlink();
  }

  // ---------- public event API ----------
  return {
    // link events from the realtime data channel (names as in gpt-realtime GA)
    onLink(type) {
      if (type === 'output_audio_buffer.started') setState('speaking');
      else if (type === 'output_audio_buffer.stopped' || type === 'output_audio_buffer.cleared') {
        if (S.state === 'speaking' || S.state === 'yielding') setState(S.handover === 'chain' ? 'idle' : 'your_turn');
      } else if (type === 'input_audio_buffer.speech_started') {
        if (S.state === 'speaking' || S.state === 'yielding') { ev('barge'); release(200); S.brow = { t0: t, amp: 0.15 }; S.nod.v = 0; }
        setState('listening');
      } else if (type === 'input_audio_buffer.speech_stopped') { if (S.state === 'listening') setState('thinking'); }
    },
    onTranscriptDone(chars) { S.totalChars = chars; },
    // Director: arms the NEXT response. handover: closed | open | choice | try | chain
    arm({ emotion, intensity, handover = 'closed', browFlash } = {}) { S.armed = { emotion, intensity, browFlash }; S.handover = handover; },
    // client-side, low-latency valence (module answer checked against the verified key, or a praise lexicon hit
    // in HER transcript placed on the playback clock). Fires only while she holds the floor.
    cue(kind, intensity = 1, why = 'cue') {
      if (S.state !== 'speaking' && S.state !== 'yielding') return false;
      if ((kind === 'proud' || kind === 'excited') && S.turnN - S.praiseTurn < 5 && intensity >= 2) intensity = 1; // praise <= 1 per 5 turns
      if (kind === 'proud' || kind === 'excited') S.praiseTurn = S.turnN;
      return emote(kind, intensity, why);
    },
    onModule(e) {
      if (e === 'mount') { S.moduleOn = true; look('module', ...S.moduleDir, N(r, [0.75, 0.15], 0.6, 0.9), 'module:mount'); }
      if (e === 'unmount') S.moduleOn = false;
      if (e === 'param_change' && (S.state === 'your_turn' || S.state === 'idle')) look('module', ...S.moduleDir, 1.6, 'module:watch');
      if (e === 'answer') setState('thinking');
      if (e === 'goal_met') emote('excited', 2, 'goal_met');   // the engine already revealed the outcome: shared delight is not a leak
      if (e === 'idle' && S.state === 'your_turn') { lookChild('module-idle'); S.brow = { t0: t, amp: 0.12 }; }
    },
    setModuleDir(yaw, pitch) { S.moduleDir = [yaw, pitch]; },
    get state() { return S.state; }, get log() { return S.log; }, get t() { return t; },

    // ---------- per-frame ----------
    update(dtMs, audio = {}) {
      const dt = Math.min(dtMs, 66) / 1000; t += dt;
      const her = audio.herRms ?? 0, child = audio.childRms ?? 0;
      // her prosody: fast/slow envelopes on the AnalyserNode RMS tap (no audio-thread code)
      const R = S.rms; R.fast += (1 - Math.exp(-dt / 0.03)) * (her - R.fast);
      if (her > 0.01) R.slow += (1 - Math.exp(-dt / 1.5)) * (her - R.slow);
      const voiced = R.fast > 0.012;
      if (S.state === 'speaking' || S.state === 'yielding') {
        if (voiced && !S.herVoiced) { S.herLastResume = t; if (S.gaze.reason.startsWith('floor')) S.gaze.until = t + N(r, P.avertFloor.endAfterResume, 0.3, 2.5); }
        if (!voiced && S.herVoiced) S.herPauseT0 = t;
        if (!voiced && S.herPauseT0 > 0 && t - S.herPauseT0 > 0.15 && !S.pauseHandled) {
          S.pauseHandled = true; blinkNow('phrase', 0.6);          // phrase-boundary blink
          if (t - S.herPauseT0 > 0.15 && S.state === 'speaking' && S.gaze.mode === 'child' && r() < 0.35) avert('floor', N(r, P.avertFloor.len, 0.8, 3)); // floor-hold
        }
        if (voiced) S.pauseHandled = false;
        // accents -> nod impulse; strong accents -> brow flash (refractory)
        if (voiced && R.fast > R.slow * 1.6 && t - R.lastAccent > P.nod.minGapS) {
          R.lastAccent = t; const amp = Math.min(P.nod.ampDeg[1], P.nod.ampDeg[0] * R.fast / R.slow / 1.6);
          S.nod.v -= amp * 9 * (EMOTIONS[S.emo.kind].headGain);
          if (R.fast > R.slow * 2.2 && t - S.brow.t0 > P.browFlash.refractoryS && r() < P.browFlash.p) S.brow = { t0: t, amp: P.browFlash.amp * 0.8 };
        }
        // yield detection from the transcript clock
        if (S.state === 'speaking' && S.totalChars > 0 && S.handover !== 'chain') {
          const remaining = S.totalChars / cps - (t - S.speakT0);
          if (remaining < P.yieldLeadS) setState('yielding');
        }
      }
      S.herVoiced = voiced;
      // child: silent visual continuer nod in OPEN turns only (never on a closed answer: a nod reads as "correct")
      if (S.state === 'listening') {
        if (child > 0.015) { if (S.childPausing) S.childPausing = false; S.childLastVoiced = t; }
        else if (!S.childPausing && t - S.childLastVoiced > P.listenNod.pauseS) {
          S.childPausing = true;
          if (S.handover === 'open' && t - S.childSpeechT0 > P.listenNod.minSpeechS && t - S.listenNodLast > P.listenNod.refractoryS && r() < P.listenNod.p) {
            S.listenNodLast = t; S.nod.v -= P.listenNod.ampDeg * 9; ev('listen-nod');
          }
        }
      }
      // gaze scheduler
      const G = S.gaze;
      if (S.state === 'thinking' && S.thinkAvertAt && t >= S.thinkAvertAt) { S.thinkAvertAt = 0; avert('cognitive', Math.min(P.thinkAvertCapS, N(r, P.avertCognitive.len, 1.0))); }
      if (G.mode !== 'child' && t >= G.until) lookChild(G.mode === 'avert' ? 'return' : 'back');
      if (G.mode === 'child' && t >= S.nextAvert && S.state !== 'yielding' && S.state !== 'thinking') {
        if (S.state === 'speaking') { avert('intimacy', N(r, P.avertSpeak.len, 0.6)); S.nextAvert = t + N(r, P.avertSpeak.gap, 1.5); }
        else if (S.state === 'listening' || S.state === 'your_turn' || S.state === 'idle') {
          if (S.moduleOn) look('module', ...S.moduleDir, N(r, P.avertListen.len, 0.5), 'shared-attention'); else avert('intimacy', N(r, P.avertListen.len, 0.5));
          S.nextAvert = t + N(r, P.avertListen.gap, 3);
        }
      }
      if (t >= S.nextMicro) { const a = N(r, P.microSaccade.ampDeg, 1.5, 3), th = r() * 2 * Math.PI; S.micro = [a * Math.cos(th), a * Math.sin(th) * 0.6]; S.nextMicro = t + N(r, P.microSaccade.gap, 0.4); }
      // eyes: saccades are ~2.2 ms/deg + 21 ms -> 1 frame at 30 fps: jump; head follows with lag
      const gy = G.tYaw + (G.mode === 'child' ? S.micro[0] * 0.5 : S.micro[0] * 0.3), gp = G.tPitch + S.micro[1] * 0.5;
      G.yaw = gy; G.pitch = gp;
      // blink scheduler
      const B = S.blink;
      if (B.phase < 0 && t >= B.next) { B.phase = 0; B.t0 = t; const m = P.blinkMs; B.dur = (m.close + m.hold + m.open) / 1000; ev('blink', { why: B.why || 'sched', key: S.gaze.mode === 'module' ? 'module' : S.state }); B.why = ''; }
      let blinkV = 0;
      if (B.phase >= 0) {
        const m = P.blinkMs, e = (t - B.t0) * 1000;
        blinkV = e < m.close ? e / m.close : e < m.close + m.hold ? 1 : clamp01(1 - (e - m.close - m.hold) / m.open);
        if (e >= m.close + m.hold + m.open) { B.phase = -1; B.lastEnd = t; if (!B.queueDouble && r() < P.blinkDoubleP) { B.queueDouble = true; B.next = t + 0.12; } else { B.queueDouble = false; scheduleBlink(); } }
      }
      // head: spring nods + drift + gaze-following + tilt + lean
      const k = P.nod.k, c = 2 * P.nod.zeta * Math.sqrt(k);
      S.nod.v += (-k * S.nod.x - c * S.nod.v) * dt; S.nod.x += S.nod.v * dt;
      const E = EMOTIONS[S.emo.kind], L = emoLevel();
      const still = S.state === 'your_turn' ? 0.5 : S.state === 'listening' ? 0.7 : 1;
      const da = (S.state === 'speaking' || S.state === 'yielding' ? 1.5 : 1.0) * still;
      const d = S.drift, drift = [0.31, 0.23, 0.17].map((f, i) => Math.sin(2 * Math.PI * f * t + d[i]) * 0.6 + Math.sin(2 * Math.PI * f * 2.71 * t + d[i] * 1.3) * 0.4);
      const tiltT = (S.state === 'listening' ? 4 : 0) + E.tilt * (L / Math.max(0.01, S.emo.I || 1)) * (S.emo.I > 0 ? 1 : 0);
      S.tilt += (1 - Math.exp(-dt / 0.4)) * (tiltT - S.tilt);
      const headYawFollow = Math.abs(G.yaw) > 15 ? G.yaw - Math.sign(G.yaw) * 10 : G.yaw * 0.3;
      S.headYaw = (S.headYaw ?? 0) + (1 - Math.exp(-dt / 0.25)) * (headYawFollow - (S.headYaw ?? 0));
      S.leanV = (S.leanV ?? 0) + (1 - Math.exp(-dt / 0.35)) * (S.lean - (S.leanV ?? 0));
      const head = [S.nod.x + drift[0] * da - 3 * S.leanV + G.pitch * 0.2, S.headYaw + drift[1] * da, S.tilt + drift[2] * da * 0.6];
      // brows: flash (rise 80 ms / hold / fall) or hold
      const br = S.brow, be = (t - br.t0) * 1000;
      const flash = br.hold ? br.amp : be < 0 ? 0 : be < 80 ? br.amp * be / 80 : be < P.browFlash.ms ? br.amp : be < P.browFlash.ms + 200 ? br.amp * (1 - (be - P.browFlash.ms) / 200) : 0;
      // compose blendshape layer (additive deltas; compositor clamps and applies lip priority)
      const bs = {}, add = (k2, v) => { bs[k2 + 'Left'] = (bs[k2 + 'Left'] ?? 0) + v * asym; bs[k2 + 'Right'] = (bs[k2 + 'Right'] ?? 0) + v / asym; };
      for (const [k2, v] of Object.entries(E.bs)) { if (k2 === 'browInnerUp') bs.browInnerUp = (bs.browInnerUp ?? 0) + v * L; else add(k2, v * L); }
      add('browOuterUp', flash); bs.browInnerUp = (bs.browInnerUp ?? 0) + flash * 0.8 + (S.state === 'listening' ? 0.08 : 0);
      bs.eyeBlinkLeft = Math.max(blinkV, bs.eyeSquintLeft ? bs.eyeSquintLeft * 0.3 : 0); bs.eyeBlinkRight = blinkV;
      for (const k2 in bs) bs[k2] = clamp01(bs[k2]);
      return { t, state: S.state, gaze: [G.yaw, G.pitch], gazeMode: G.mode, head, lean: S.leanV, bs, emotion: S.emo.kind, emoLevel: L };
    },
  };
}
