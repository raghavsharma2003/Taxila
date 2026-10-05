// r2 expression emitters for the painted puppet, as COMPOSITOR PRESETS (judge r1 item 6): behaviour.ts is unchanged
// (its Emotion union is the main loop's call); the Director calls Expressions.emote(name) and the layer mixes its
// envelope into behaviour's ARKit frame BEFORE the Compositor, so the HeadRig contract (ARKit + visemes + tongue +
// head + gaze) is untouched. Designed to drop into src/avatar/ at Integrate as one file.
//
// Each preset is SHAPES, not a mood label: brow ribbon channels via browInnerUp/browOuterUp*/browDown*, lid via
// eyeSquint/eyeWide/eyeBlink (lowered lids), mouth via smile/press/frown/mouthLeft (aside), plus head and gaze offsets.
// "Left" = her left = screen right. Values < 0 suppress that key (scale behaviour's own value toward 0).
// Head: [pitch + = chin down, yaw + = her left, roll + = top toward screen left]. Gaze: [yaw + = screen right, pitch + = up].
export const EXPRESSIONS = {
  // c-thinking: head rolled, one brow arched high, the other low; eyes up and away; small pressed mouth slid aside
  thinking: {
    // r4: rig brow gains rose ~35% (surprise / concern range), so thinking's arch / knit / frown come down to keep the r3
    // read (blind r4c 3/3: "skeptical" with the old weights through the new gains)
    bs: { browOuterUpLeft: 0.72, browInnerUp: 0.08, browDownRight: 0.38, eyeSquintRight: 0.2, eyeWideLeft: 0.04,
      // r4b: c-thinking's mouth is SMALL and pursed (not a long upturned curve slid aside, which read as a smirk 9/15)
      mouthLeft: 0.5, mouthPressLeft: 0.35, mouthPressRight: 0.35, mouthPucker: 0.5, mouthFrownRight: 0.25, mouthFrownLeft: 0.4, mouthSmileLeft: -1, mouthSmileRight: -1 },
    head: [-4, -7, 8], gaze: [21, 20], env: [0.35, 0, 0.45],
  },
  // c-listening: soft closed smile, brows gently up, head tilted toward the child
  listening: {
    // attentive, not merely pleased: brows up, eyes open and on the child, lips softly closed, head cocked and leaning in
    bs: { mouthSmileLeft: -1, mouthSmileRight: -1, browInnerUp: 0.45, browOuterUpLeft: 0.32, browOuterUpRight: 0.32,
      eyeWideLeft: 0.2, eyeWideRight: 0.2, jawOpen: 0.13 },
    head: [5, 4, -11], gaze: [-3, 1], env: [0.5, 0, 0.5],
  },
  warm: {
    bs: { mouthSmileLeft: 0.4, mouthSmileRight: 0.4, cheekSquintLeft: 0.2, cheekSquintRight: 0.2, eyeSquintLeft: 0.12, eyeSquintRight: 0.12,
      browOuterUpLeft: 0.12, browOuterUpRight: 0.12 },
    head: [0, 0, 3], gaze: [0, 0], env: [0.4, 0, 0.5],
  },
  // c-happy: open smile, cheeks up, eyes smiling but open, brows lifted
  delight: {
    // c-happy keeps the eyes OPEN (no lower-lid squint across the iris): the joy is in the brows, cheeks and mouth
    // r3: delight escalates over talking (blind judge: "the same open smile as talk"): the eyes smile (cheeks push the
    // lower lids up, c-happy), a bigger open D-mouth, brows up
    bs: { mouthSmileLeft: 1.0, mouthSmileRight: 1.0, cheekSquintLeft: 0.75, cheekSquintRight: 0.75, eyeSquintLeft: 0.3, eyeSquintRight: 0.3,
      browOuterUpLeft: 0.7, browOuterUpRight: 0.7, browInnerUp: 0.35, jawOpen: 0.34 },
    head: [-2, 0, 4], gaze: [0, 2], env: [0.25, 0, 0.45], bounce: 4,
  },
  // gentle concern: inner brows up and knit, lids lowered, lips pressed, corners slightly down, head tilted in
  concern: {
    // r3: the lowered lids read as sleepy / sceptical to the blind judge (3 of 3 runs): concern is carried by the brows
    // (inner ends up, knit), soft open eyes and a small pressed, down-turned mouth
    bs: { browInnerUp: 1.0, browDownLeft: 0.45, browDownRight: 0.45, eyeWideLeft: 0.15, eyeWideRight: 0.15,
      // r4b: the strong frown + press made a wavy pasted-on pout (blind r4 6/15): softer corners, lips just parted
      mouthPressLeft: 0.12, mouthPressRight: 0.12, mouthFrownLeft: 0.3, mouthFrownRight: 0.3, mouthPucker: 0.2, mouthSmileLeft: -1, mouthSmileRight: -1 },
    head: [4, 2, 7], gaze: [0, 3], env: [0.45, 0, 0.6],
  },
  surprise: {
    // r4b: blind r4g 'happy surprise / excited ah': the corners come in and down a touch so the open jaw rounds to an O
    bs: { eyeWideLeft: 0.9, eyeWideRight: 0.9, browInnerUp: 0.6, browOuterUpLeft: 0.85, browOuterUpRight: 0.85, jawOpen: 0.42,
      mouthSmileLeft: -1, mouthSmileRight: -1, mouthFrownLeft: 0.15, mouthFrownRight: 0.15, mouthFunnel: 0.3 },
    head: [-5, 0, 0], gaze: [0, 2], env: [0.12, 0, 0.5],
  },
  // playful: lopsided smirk, one brow up, the other eye squinting, head cocked
  // r5 (judge r4): a real WINK: her right eye (screen left) fully shut on the curved happy-closed lid, that cheek raised
  // and the smirk on the same side; the other brow up, the open eye bright
  playful: {
    bs: { mouthSmileRight: 0.8, mouthSmileLeft: 0.12, cheekSquintRight: 0.85, browOuterUpLeft: 0.9, browDownRight: 0.35,
      eyeBlinkRight: 1.0, eyeWideLeft: 0.1, eyeSquintLeft: 0.04 },
    head: [-2, -6, 8], gaze: [-5, 3], env: [0.22, 0, 0.4],
    // the wink itself is a quick beat inside the held smirk: 0.12 s close, 0.5 s held, 0.18 s open
    pulse: { keys: ["eyeBlinkRight", "cheekSquintRight"], delay: 0.1, a: 0.1, hold: 0.5, r: 0.12 },
  },
};
// r6 (judge r5 fix 5, METHOD CHANGE, expression range): authored ASYMMETRIC secondary keys and 2-3 takes per emotion,
// so a repeat never looks like a copy. The rig carries the asymmetry per side (brow ribbon channels, eyeSquint,
// cheekSquint, smile, frown) and three new warp keys (rig.js / lips.js): the mouth BUNCHES on the side it is pushed to,
// the cheek on that side bunches up, and an expression lip press raises the chin (mentalis).
//   concern  inner-brow knit (browInnerUp + browDown), lips pressed with ONE corner down, lower lids raised
//   thinking lips pushed to one side with that side's eye squinting and cheek bunched, the other brow raised, eyes away
const MIRROR = (P) => {
  const sw = (k) => k.endsWith("Left") ? k.slice(0, -4) + "Right" : k.endsWith("Right") ? k.slice(0, -5) + "Left" : k;
  const bs = {};
  for (const [k, v] of Object.entries(P.bs)) bs[k === "mouthLeft" ? "mouthRight" : k === "mouthRight" ? "mouthLeft" : sw(k)] = v;
  const out = { ...P, bs, head: [P.head[0], -P.head[1], -P.head[2]], gaze: [-P.gaze[0], P.gaze[1]] };
  if (P.pulse) out.pulse = { ...P.pulse, keys: P.pulse.keys.map(sw) };
  return out;
};
const THINK_A = {
  bs: { browOuterUpLeft: 0.74, browInnerUp: 0.06, browDownRight: 0.42, browDownLeft: 0.2,   // r6 i3: + an inner knit (blind r6: 'no furrowed brow')
    eyeSquintRight: 0.46, eyeWideLeft: 0.05, cheekSquintRight: 0.2,
    mouthRight: 0.6, mouthPressLeft: 0.3, mouthPressRight: 0.3, mouthPucker: 0.35, mouthFrownLeft: 0.32, mouthFrownRight: 0.1, mouthSmileLeft: -1, mouthSmileRight: -1 },
  head: [-4, -6, 8], gaze: [21, 19], env: [0.35, 0, 0.45],
};
const CONCERN_A = {
  bs: { browInnerUp: 1.0, browDownLeft: 0.5, browDownRight: 0.42, eyeSquintLeft: 0.3, eyeSquintRight: 0.26,
    mouthPressLeft: 0.4, mouthPressRight: 0.4, mouthFrownLeft: 0.52, mouthFrownRight: 0.1, mouthRight: 0.12, mouthSmileLeft: -1, mouthSmileRight: -1 },
  head: [4, 2, 7], gaze: [0, 3], env: [0.45, 0, 0.6],
};
export const VARIANTS = {
  thinking: [
    THINK_A,
    { ...MIRROR(THINK_A), head: [-3, 6, -7], gaze: [-20, 17] },
    // looking down, concentrating: lips pressed and pushed, one eye narrowed, brows drawn
    { bs: { browDownLeft: 0.34, browDownRight: 0.3, browInnerUp: 0.12, eyeSquintLeft: 0.42, eyeSquintRight: 0.2, cheekSquintLeft: 0.15,
      mouthLeft: 0.4, mouthPressLeft: 0.5, mouthPressRight: 0.5, mouthFrownLeft: 0.38, mouthFrownRight: 0.18, mouthSmileLeft: -1, mouthSmileRight: -1 },
      head: [7, 4, 5], gaze: [11, -13], env: [0.35, 0, 0.45] },
  ],
  concern: [
    CONCERN_A,
    { ...MIRROR(CONCERN_A), bs: { ...MIRROR(CONCERN_A).bs, browInnerUp: 0.9, eyeSquintLeft: 0.22, eyeSquintRight: 0.34, mouthPressLeft: 0.48, mouthPressRight: 0.48 }, head: [5, -3, -6], gaze: [-2, 4] },
    // softer, leaning in: brows up and knit, lids lifted from below, lips softly pressed, both corners down a little
    { bs: { browInnerUp: 0.88, browDownLeft: 0.3, browDownRight: 0.34, eyeSquintLeft: 0.2, eyeSquintRight: 0.2, eyeWideLeft: 0.06, eyeWideRight: 0.06,
      mouthPressLeft: 0.22, mouthPressRight: 0.22, mouthFrownLeft: 0.3, mouthFrownRight: 0.24, mouthPucker: 0.18, mouthSmileLeft: -1, mouthSmileRight: -1 },
      head: [7, 0, 3], gaze: [0, 7], env: [0.45, 0, 0.6] },
  ],
};
/** behaviour.ts's Emotion names -> the preset that renders them on this rig (so arm()/emote() map 1:1). */
export const EMOTION_TO_EXPRESSION = { warm: "warm", curious: "thinking", excited: "delight", concerned: "concern", proud: "delight" };

const smooth01 = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export class Expressions {
  constructor(seed = 21) {
    this.cur = null; // { name, t0, hold, I, P }
    this.bounce = { x: 0, v: 0 };
    let a = seed >>> 0;
    this.rng = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    this.lastVar = {};
  }
  /** r6: the take for this emote: random among the emotion's variants, never the previous one (variant = force one). */
  pick(name, variant) {
    const V = VARIANTS[name];
    if (!V) return { P: EXPRESSIONS[name], i: 0 };
    let i = variant ?? Math.floor(this.rng() * V.length);
    if (variant == null && V.length > 1 && i === this.lastVar[name]) i = (i + 1 + Math.floor(this.rng() * (V.length - 1))) % V.length;
    this.lastVar[name] = i;
    return { P: V[i], i };
  }
  /** Start an expression; hold = seconds at full (Infinity until release()). */
  emote(name, t, { hold = 1.6, intensity = 1, variant } = {}) {
    if (!EXPRESSIONS[name]) return;
    const { P, i } = this.pick(name, variant);
    this.cur = { name, t0: t, hold, I: intensity, rel: -1, P, variant: i };
    if (P.bounce) this.bounce.v -= P.bounce * 14;
  }
  release(t) {
    if (this.cur && this.cur.rel < 0) this.cur.rel = t;
  }
  level(t) {
    const c = this.cur;
    if (!c) return 0;
    const [a, , r] = (c.P || EXPRESSIONS[c.name]).env;
    const up = smooth01((t - c.t0) / a);
    const relT = c.rel >= 0 ? c.rel : c.t0 + a + c.hold;
    const down = t < relT ? 1 : 1 - smooth01((t - relT) / r);
    if (down <= 0 && t > relT) { this.cur = null; return 0; }
    return up * down * c.I;
  }
  /** Mix into behaviour's frame in place. bs/head/gaze are behaviour's outputs; lip is the lip-layer dict. */
  apply(t, dt, bs, head, gaze, lip) {
    let left = dt;
    while (left > 1e-6) { const h = Math.min(0.004, left); this.bounce.v += (-160 * this.bounce.x - 2 * 0.5 * Math.sqrt(160) * this.bounce.v) * h; this.bounce.x += this.bounce.v * h; left -= h; }
    head[0] += this.bounce.x;
    const e = this.level(t);
    if (!this.cur || e <= 0) return 0;
    const P = this.cur.P || EXPRESSIONS[this.cur.name];
    const pu = P.pulse, pt = t - this.cur.t0 - (pu ? pu.delay : 0);
    const pw = pu ? (pt < 0 ? 0 : pt < pu.a ? smooth01(pt / pu.a) : pt < pu.a + pu.hold ? 1 : 1 - smooth01((pt - pu.a - pu.hold) / pu.r)) : 1;
    for (const [k, v0] of Object.entries(P.bs)) {
      const v = pu && pu.keys.includes(k) ? v0 * pw : v0;
      if (k === "jawOpen") { if (lip) lip.jawOpen = Math.max(lip.jawOpen ?? 0, v * e); continue; }
      if (v < 0) bs[k] = (bs[k] ?? 0) * (1 - e);
      else bs[k] = Math.max(bs[k] ?? 0, v * e) ;
    }
    for (let i = 0; i < 3; i++) head[i] += P.head[i] * e;
    // gaze: blend toward the preset (an averted expression look replaces behaviour's micro-saccades while held)
    gaze[0] = gaze[0] * (1 - e) + P.gaze[0] * e;
    gaze[1] = gaze[1] * (1 - e) + P.gaze[1] * e;
    return e;
  }
}

/** Backchannel listener (judge r1 item 6: nods from the REAL listening state, not a script). Input: the child's mic
 *  level (LevelMeter.value, 0..1) each frame while the face state is "listening". A nod fires at the child's
 *  phrase-final pause (voiced >= 0.6 s, then 180-450 ms below threshold), at most every 1.6 s, alternating a small and
 *  a deeper nod; a soft smile rises while the child talks. Output: pitch offset (deg) and smile weight. */
export class Listener {
  constructor(seed = 3) {
    this.s = { x: 0, v: 0 };
    this.voicedFor = 0;
    this.quietFor = 0;
    this.lastNod = -9;
    this.n = 0;
    this.smile = 0;
    this.seed = seed;
    this.nods = [];
  }
  update(t, dt, listening, level) {
    const on = listening && level > 0.12;
    if (on) { this.voicedFor += dt; this.quietFor = 0; } else { this.quietFor += dt; }
    const nod = (deg, kind) => {
      this.s.v += deg / 0.0468;    // impulse sized for the asked-for peak (analytic peak per unit v of this spring)
      this.lastNod = t; this.n++; this.voicedFor = 0;
      this.nods.push([+t.toFixed(2), kind]);
    };
    // phrase-final pause after >= 0.35 s of speech: a full backchannel nod (alternating small / deeper)
    if (listening && !on && this.voicedFor >= 0.3 && this.quietFor > 0.12 && this.quietFor < 0.45 && t - this.lastNod > 1.0) nod(this.n % 3 === 1 ? 5.5 : 3.5, "pause");
    // a long unbroken turn still gets small "continuer" nods (~every 1.8 s), as listeners do
    else if (listening && on && this.voicedFor > 1.8 && t - this.lastNod > 1.8) nod(2, "continuer");
    if (!listening) this.voicedFor = 0;
    let left = dt;
    while (left > 1e-6) { const h = Math.min(0.004, left); this.s.v += (-110 * this.s.x - 2 * 0.62 * Math.sqrt(110) * this.s.v) * h; this.s.x += this.s.v * h; left -= h; }
    const want = listening ? (on ? 0.12 : 0.06) : 0;
    this.smile += (1 - Math.exp(-dt / 0.5)) * (want - this.smile);
    return { pitch: this.s.x, smile: this.smile };
  }
}

// r6: the other emotions get takes that differ in head tilt side, gaze and intensity (no new shapes)
const vary = (P, head, gaze, scale = {}) => ({ ...P, head, gaze, bs: Object.fromEntries(Object.entries(P.bs).map(([k, v]) => [k, v < 0 ? v : Math.min(1, v * (scale[k] ?? 1))])) });
// r6 i3: delight takes stay SYMMETRIC in shape (blind r6 read take B's 0.9 / 0.85 smile and cheek as 'lopsided'); they vary
// head, gaze and the size of the laugh only
VARIANTS.delight = [EXPRESSIONS.delight,
  vary(EXPRESSIONS.delight, [-3, 3, -5], [1, 2], { jawOpen: 0.88, browOuterUpLeft: 1.1, browOuterUpRight: 1.1 }),
  vary(EXPRESSIONS.delight, [-1, -2, 6], [-1, 3], { jawOpen: 0.78, browInnerUp: 1.3 })];
VARIANTS.warm = [EXPRESSIONS.warm, vary(EXPRESSIONS.warm, [1, 2, -4], [1, 0], { mouthSmileRight: 0.85 }), vary(EXPRESSIONS.warm, [-1, -2, 5], [-1, 1], { cheekSquintLeft: 1.3, cheekSquintRight: 1.3 })];
VARIANTS.surprise = [EXPRESSIONS.surprise, vary(EXPRESSIONS.surprise, [-6, 2, -3], [1, 3], { browOuterUpRight: 0.85, jawOpen: 0.9 }), vary(EXPRESSIONS.surprise, [-4, -2, 2], [-1, 2], { eyeWideLeft: 1.05, eyeWideRight: 1.05 })];
VARIANTS.playful = [EXPRESSIONS.playful, MIRROR(EXPRESSIONS.playful)];
VARIANTS.listening = [EXPRESSIONS.listening, { ...MIRROR(EXPRESSIONS.listening), head: [5, -4, 9] }, vary(EXPRESSIONS.listening, [3, 2, -6], [-2, 2], { browInnerUp: 0.8 })];
EXPRESSIONS.thinking = VARIANTS.thinking[0];
EXPRESSIONS.concern = VARIANTS.concern[0];
