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
    head: [5, 4, -11], gaze: [-3, 1], env: [0.5, 0, 0.5], act: "listening",
  },
  warm: {
    bs: { mouthSmileLeft: 0.4, mouthSmileRight: 0.4, cheekSquintLeft: 0.2, cheekSquintRight: 0.2, eyeSquintLeft: 0.12, eyeSquintRight: 0.12,
      browOuterUpLeft: 0.12, browOuterUpRight: 0.12 },
    head: [0, 0, 3], gaze: [0, 0], env: [0.4, 0, 0.5], act: "warm",
  },
  // c-happy: open smile, cheeks up, eyes smiling but open, brows lifted
  delight: {
    // c-happy keeps the eyes OPEN (no lower-lid squint across the iris): the joy is in the brows, cheeks and mouth
    // r3: delight escalates over talking (blind judge: "the same open smile as talk"): the eyes smile (cheeks push the
    // lower lids up, c-happy), a bigger open D-mouth, brows up
    // r7 (judge r6): cheekSquint 0.75 -> 0.64 (the inner lower lids pinched into white slivers)
    bs: { mouthSmileLeft: 1.0, mouthSmileRight: 1.0, cheekSquintLeft: 0.64, cheekSquintRight: 0.64, eyeSquintLeft: 0.26, eyeSquintRight: 0.26,
      browOuterUpLeft: 0.7, browOuterUpRight: 0.7, browInnerUp: 0.35, jawOpen: 0.34 },
    head: [-2, 0, 4], gaze: [0, 2], env: [0.25, 0, 0.45], bounce: 4,
    // r7: the held grin is never frozen (judge r6: one mouth for ~1.2 s): a laugh-rate jaw flutter and a slow smile breath
    wob: { jawOpen: [[0.05, 2.3], [0.025, 3.7]], mouthSmileLeft: [[0.04, 1.3]], mouthSmileRight: [[0.04, 1.3]], cheekSquintLeft: [[0.03, 1.3]], cheekSquintRight: [[0.03, 1.3]] },
    act: "delight",
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
    head: [-5, 0, 0], gaze: [0, 2], env: [0.12, 0, 0.5], act: "surprise",
  },
  // playful: lopsided smirk, one brow up, the other eye squinting, head cocked
  // r5 (judge r4): a real WINK: her right eye (screen left) fully shut on the curved happy-closed lid, that cheek raised
  // and the smirk on the same side; the other brow up, the open eye bright
  playful: {
    bs: { mouthSmileRight: 0.8, mouthSmileLeft: 0.12, cheekSquintRight: 0.85, browOuterUpLeft: 0.9, browDownRight: 0.35,
      eyeBlinkRight: 1.0, eyeWideLeft: 0.1, eyeSquintLeft: 0.04 },
    head: [-2, -6, 8], gaze: [-5, 3], env: [0.22, 0, 0.4], act: "playful",
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
  const out = { ...P, bs, head: [P.head[0], -P.head[1], -P.head[2]], gaze: [-P.gaze[0], P.gaze[1]], mir: !P.mir };
  if (P.pulse) out.pulse = { ...P.pulse, keys: P.pulse.keys.map(sw) };
  return out;
};
// r8 (judge r7 fix 1): THINK_UP is the DEFAULT take, re-targeted 1:1 to c-thinking.webp: eyes up and to one side
// (+18, +20), ONE brow up (her left = screen right) with the other neutral and no knit, the head tilted 7 degrees so the
// raised-brow side rides up (as in the concept), and the key piece, a ONE-SIDED mouth: the closed mouth slid ~8 px toward
// the raised-brow side, a press on that side only, a slight upper-lip roll (pucker) and zero smile. While held, the eyes
// make a slow 1-2 px search (search: deg amplitude; fixations of ~0.5-0.9 s with ~70 ms hops).
// r7's take A is retired into this one (it lacked the mouth shift); take C (eyes down) is kept as the rare take only.
const THINK_UP = {
  // r8 i3: gaze (18, 20) -> (14, 23) and a little inner-brow lift (effort): the blind models read i2's more lateral look
  // plus the single arch as 'a mild skeptical undertone' / 'sly side-eye'; up-first reads as recalling
  // r9 (judge r8 fix 3): pushed toward c-thinking. The raised brow 0.82 -> 1.0 plus the rig's one-sided peak (~+35% at the
  // arch's top); the mouth is a MOUE, not a thin line: the push-side press 0.6 -> 0.28 (it thinned the very side the
  // concept fills), mouthShrugLower 0.22 (lower lip up and full, chin up) and mouthPucker 0.18 (lip volume, slightly
  // narrower), the upper-lip roll 0.2 -> 0.08; gaze 3 px higher (23 -> 28 deg). The inner-brow lift stays (it removed
  // the sceptical read in r8).
  // r9 i2 (sol 1/3: 'mismatched brows plus pursed lips -> suspicion'): inner-brow lift 0.2 -> 0.32 (wonder, effort), pucker 0.18 -> 0.12
  // r9 i4 (blind 4/6 on the clip grid: the raised brow 'too high / too steep -> sceptical'): 1.0 -> 0.92 with a rounder,
  // lower peak (rig: 6.5 px over sigma 0.45): ~+28% over r8 at the arch's top instead of +44%
  bs: { browOuterUpLeft: 0.92, browInnerUp: 0.32, eyeWideLeft: 0.05, eyeWideRight: 0.03,
    mouthLeft: 0.45, mouthPressLeft: 0.28, mouthRollUpper: 0.08, mouthShrugLower: 0.22, mouthPucker: 0.12, mouthFrownRight: 0.22, mouthSmileLeft: -1, mouthSmileRight: -1 },
  head: [-3, -3, 7], gaze: [14, 28], env: [0.35, 0, 0.45], act: "thinkUp", search: [2.4, 1.8],
};
// r7 take C (eyes down and aside, chin tucked, lips pressed and drawn to one side, one outer brow half up, no knit, zero
// smile). r8: the RARE take only (judge r7: as the default it read sceptical side-eye in motion, shy / downcast at full size)
const THINK_C = {
  bs: { browOuterUpLeft: 0.3, browInnerUp: 0.34, eyeSquintLeft: 0.06, eyeSquintRight: 0.1,
    mouthRight: 0.3, mouthPressLeft: 0.45, mouthPressRight: 0.45, mouthFrownLeft: 0.32, mouthFrownRight: 0.3, mouthSmileLeft: -1, mouthSmileRight: -1 },
  head: [7, 3, 6], gaze: [2, -22], env: [0.35, 0, 0.45], act: "thinkDown",
};
// r9 (grok 2/2 on the r9 grid: concern A's brows 'sharp, angry'): the same softening as concern B, kept a little more knit
// than B so the takes stay distinct: inner 1.0 -> 0.86, knit 0.5 / 0.42 -> 0.3 / 0.25, a little outer lift 0.1
const CONCERN_A = {
  bs: { browInnerUp: 0.86, browOuterUpLeft: 0.1, browOuterUpRight: 0.1, browDownLeft: 0.3, browDownRight: 0.25, eyeSquintLeft: 0.3, eyeSquintRight: 0.26,
    mouthPressLeft: 0.4, mouthPressRight: 0.4, mouthFrownLeft: 0.52, mouthFrownRight: 0.1, mouthRight: 0.12, mouthSmileLeft: -1, mouthSmileRight: -1 },
  head: [4, 2, 7], gaze: [0, 3], env: [0.45, 0, 0.6], act: "concern",
};
// r7 (judge r6): B is no longer A mirrored (read as a duplicate). A different HEAD action (tilted the other way, chin
// down, leaning well in) and a different MOUTH (lips parted, both corners down, no press): 'oh no, what happened?'
const CONCERN_B = {
  // r8 (judge r7 fix 2): r7's near-closed pout with the lower lip pushed forward read petulant / sulky (both blind models
  // and the judge). Same tilt and lean, but the lips PART (jaw ~7 px) with both corners down and the lower lip drawn DOWN,
  // not forward (mouthShrugLower 0, mouthLowerDown 0.2); the upper lip stays put so the upper teeth stay hidden (the
  // solver caps the upper teeth while an expression's lower-lip pull holds); inner brows up: 'oh no, are you okay?'
  // r9 (judge r8 fix 4): brows ~25% less angular (grok: 'sharp, adult'): inner 1.0 -> 0.82, knit 0.22 -> 0.12 and a little
  // outer lift (0.15) so the whole brow rises instead of only tilting; the mouth's lower edge rounds and its corners curl
  // (lips.js: the lower-lip pull rounds the profile, worry x pull curls the ends)
  bs: { browInnerUp: 0.82, browOuterUpLeft: 0.15, browOuterUpRight: 0.15, browDownLeft: 0.12, browDownRight: 0.12,
    jawOpen: 0.27, mouthLowerDownLeft: 0.2, mouthLowerDownRight: 0.2, mouthShrugLower: 0, mouthPucker: 0.12, mouthFrownLeft: 0.36, mouthFrownRight: 0.36, mouthSmileLeft: -1, mouthSmileRight: -1 },
  head: [8, 0, -8], gaze: [-1, 5], env: [0.45, 0, 0.6], act: "concernLean",   // r8 i2: yaw -4 -> 0 (the field bent the parted mouth: sol "crooked, mechanically warped")
};
export const VARIANTS = {
  // r8: UP (default, c-thinking), UP mirrored (the other side), C (eyes down) rare
  thinking: [THINK_UP, { ...MIRROR(THINK_UP), head: [-3, 3, -6], gaze: [-13, 27] }, THINK_C],
  concern: [
    CONCERN_A,
    CONCERN_B,
    // softer, leaning in: brows up and knit, lids lifted from below, lips softly pressed, both corners down a little
    { bs: { browInnerUp: 0.88, browDownLeft: 0.3, browDownRight: 0.34, eyeSquintLeft: 0.2, eyeSquintRight: 0.2, eyeWideLeft: 0.06, eyeWideRight: 0.06,
      mouthPressLeft: 0.22, mouthPressRight: 0.22, mouthFrownLeft: 0.3, mouthFrownRight: 0.24, mouthPucker: 0.18, mouthSmileLeft: -1, mouthSmileRight: -1 },
      head: [7, 0, 3], gaze: [0, 7], env: [0.45, 0, 0.6], act: "concern" },
  ],
};
/** r7: take weights (default first); an emotion without an entry picks uniformly. */
export const WEIGHTS = { thinking: [0.58, 0.3, 0.12] };

/** r7 (judge r6 fix 5, METHOD CHANGE, the acting layer): authored per-emotion head and body motion curves, so an emotion is
 *  carried by the body and not only by facial keys. u = seconds since the emote, e = its envelope. Returns head offsets
 *  [pitch, yaw, roll] (deg) and a body lean (the HeadRig `lean`: + = in, toward the child; the rig carries it into the
 *  shoulders, and a head roll tilts the shoulder line). Shapes, not loops: a settle, a drift or a decaying bounce. */
const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const TAU2 = 2 * Math.PI;
export const ACTS = {
  // lean in over ~1 s and settle; the head sinks a little and sways slowly (sympathy)
  concern: (u) => ({ head: [2.5 * sm(u / 0.9), 0, 1.2 * Math.sin(TAU2 * 0.32 * u) * sm(u / 0.6)], lean: 0.7 * sm(u / 0.9) }),
  concernLean: (u) => ({ head: [3.5 * sm(u / 0.8), 0.5 * Math.sin(TAU2 * 0.25 * u), 0], lean: 1.25 * sm(u / 0.8) + 0.08 * Math.sin(TAU2 * 0.4 * u) }),
  // chin tucks and the eyes go down; a slow pondering drift of yaw and roll; a slight lean back
  thinkDown: (u) => ({ head: [3.5 * sm(u / 0.6) + 0.8 * Math.sin(TAU2 * 0.23 * u), 2.4 * Math.sin(TAU2 * 0.28 * u + 0.6) * sm(u / 0.8), 1.0 * Math.sin(TAU2 * 0.19 * u + 1.2)], lean: -0.25 * sm(u / 0.6) }),
  thinkUp: (u) => ({ head: [-1.5 * sm(u / 0.5), 2 * Math.sin(TAU2 * 0.26 * u + 0.4) * sm(u / 0.8), 1.2 * Math.sin(TAU2 * 0.2 * u)], lean: -0.35 * sm(u / 0.5) }),
  // a laugh: a decaying 3 Hz bounce of head and shoulders, then a small happy sway
  delight: (u) => { const b = Math.sin(TAU2 * 3.1 * u) * Math.exp(-u / 0.7) * sm(u / 0.08); return { head: [-2.2 * b, 0, 1.4 * Math.sin(TAU2 * 0.45 * u) * sm(u / 1.0)], lean: -0.5 * b + 0.15 * sm(u / 0.5) }; },
  // the start: pulled back fast with an overshoot, then holding
  surprise: (u) => { const k = u < 0.18 ? sm(u / 0.18) : 1 + 0.25 * Math.sin(TAU2 * 1.6 * (u - 0.18)) * Math.exp(-(u - 0.18) / 0.35); return { head: [-2.5 * k, 0, 0], lean: -0.7 * k }; },
  // a cheeky head waggle that dies away
  playful: (u) => ({ head: [0, 0, 3 * Math.sin(TAU2 * 1.5 * u) * Math.exp(-u / 0.9) * sm(u / 0.1)], lean: 0.15 * sm(u / 0.4) }),
  // a small acknowledging nod
  warm: (u) => ({ head: [2.2 * Math.sin(Math.PI * Math.min(1, u / 0.7)), 0, 0], lean: 0.2 * sm(u / 0.6) }),
  listening: (u) => ({ head: [0, 0, 0.8 * Math.sin(TAU2 * 0.22 * u)], lean: 0.45 * sm(u / 1.0) }),
};

/** behaviour.ts's Emotion names -> the preset that renders them on this rig (so arm()/emote() map 1:1). */
export const EMOTION_TO_EXPRESSION = { warm: "warm", curious: "thinking", excited: "delight", concerned: "concern", proud: "delight" };

const LIPK = new Set(["jawOpen", "mouthFunnel", "mouthPucker", "mouthRollUpper", "mouthRollLower", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthUpperUpLeft", "mouthUpperUpRight"]);
/** r8: a slow gaze SEARCH while a thinking look is held (deg): fixations of 0.5-0.9 s joined by ~70 ms hops between
 *  points of a small irregular pattern (deterministic per emote phase); 0 for the first 0.5 s (the look lands first). */
export function searchAt(u, ph, amp) {
  if (!amp || u < 0.5) return [0, 0];
  const PTS = [[0, 0], [0.9, 0.35], [0.2, 1], [-0.7, 0.45], [-0.3, -0.5], [0.8, -0.3], [-0.9, -0.1]];
  const dur = (i) => 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(i * 2.17 + ph));
  let t = u - 0.5, i = 0;
  while (t > dur(i) && i < 400) { t -= dur(i); i++; }
  const a = PTS[(i + Math.floor(ph * 3)) % PTS.length], b = PTS[(i + 1 + Math.floor(ph * 3)) % PTS.length];
  const w = smooth01((t - (dur(i) - 0.07)) / 0.07);
  return [amp[0] * (a[0] + (b[0] - a[0]) * w) * smooth01((u - 0.5) / 0.3), amp[1] * (a[1] + (b[1] - a[1]) * w) * smooth01((u - 0.5) / 0.3)];
}
const smooth01 = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export class Expressions {
  constructor(seed = 21) {
    this.cur = null; // { name, t0, hold, I, P }
    this.lean = 0;   // r7: the acting layer's body lean (added to behaviour's lean by the caller)
    this.bounce = { x: 0, v: 0 };
    let a = seed >>> 0;
    this.rng = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    this.lastVar = {};
  }
  /** r6: the take for this emote: random among the emotion's variants, never the previous one (variant = force one). */
  pick(name, variant) {
    const V = VARIANTS[name];
    if (!V) return { P: EXPRESSIONS[name], i: 0 };
    const W = WEIGHTS[name];
    const draw = () => { if (!W) return Math.floor(this.rng() * V.length); let r = this.rng(), j = 0; while (j < V.length - 1 && r >= W[j]) { r -= W[j]; j++; } return j; };
    // r7: an emotion's FIRST emote in a session is its default take (take 0); later ones draw by weight
    let i = variant ?? (this.lastVar[name] === undefined ? 0 : draw());
    // never the same take twice in a row (r7: the redraw keeps the weights)
    if (variant == null && V.length > 1 && i === this.lastVar[name]) { let k = 0; while (i === this.lastVar[name] && k++ < 8) i = draw(); if (i === this.lastVar[name]) i = (i + 1) % V.length; }
    this.lastVar[name] = i;
    return { P: V[i], i };
  }
  /** Start an expression; hold = seconds at full (Infinity until release()). */
  emote(name, t, { hold = 1.6, intensity = 1, variant } = {}) {
    if (!EXPRESSIONS[name]) return;
    const { P, i } = this.pick(name, variant);
    // r9: a new emote CROSSFADES from the one it replaces (r8 swapped instantly: concern A -> B jumped the head roll 15 deg);
    // the old take keeps its own curves and fades out over the new one's attack (>= 0.3 s)
    const e0 = this.cur ? this.level(t) : 0;
    this.prev = e0 > 0.01 ? { c: this.cur, e0, t0: t, fade: Math.max(0.3, P.env[0]) } : null;
    this.cur = { name, t0: t, hold, I: intensity, rel: -1, P, variant: i, ph: this.rng() * 6.283 };
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
    this.lean = 0;
    // r9: the two takes of a crossfade ACCUMULATE (weights sum to ~1 through the blend): r9 i3 mixed them by max() and by
    // sequential suppression, so mid-blend each counted half, the brows sagged toward neutral and behaviour's smile leaked
    // back (a smile flash between concern A and B)
    const A = { pos: {}, sup: {}, lip: {}, gz: [0, 0], w: 0 };
    if (this.prev) {
      const pv = this.prev, ep = pv.e0 * (1 - smooth01((t - pv.t0) / pv.fade));
      if (ep <= 0.001) this.prev = null;
      else this._mix(pv.c, ep, t, head, A);
    }
    const e = this.level(t);
    if (this.cur && e > 0) this._mix(this.cur, e, t, head, A);
    if (A.w <= 0) return 0;
    for (const [k, v] of Object.entries(A.pos)) bs[k] = Math.max(bs[k] ?? 0, v);
    for (const [k, w] of Object.entries(A.sup)) bs[k] = (bs[k] ?? 0) * (1 - Math.min(1, w));
    if (lip) for (const [k, v] of Object.entries(A.lip)) lip[k] = Math.max(lip[k] ?? 0, v);
    const wg = Math.min(1, A.w), nz = A.w > 1 ? 1 / A.w : 1;
    gaze[0] = gaze[0] * (1 - wg) + A.gz[0] * nz;
    gaze[1] = gaze[1] * (1 - wg) + A.gz[1] * nz;
    return e;
  }
  _mix(cur, e, t, head, A) {
    const P = cur.P || EXPRESSIONS[cur.name];
    const pu = P.pulse, pt = t - cur.t0 - (pu ? pu.delay : 0);
    const pw = pu ? (pt < 0 ? 0 : pt < pu.a ? smooth01(pt / pu.a) : pt < pu.a + pu.hold ? 1 : 1 - smooth01((pt - pu.a - pu.hold) / pu.r)) : 1;
    const u = t - cur.t0;
    for (const [k, v0] of Object.entries(P.bs)) {
      let v = pu && pu.keys.includes(k) ? v0 * pw : v0;
      // r7: micro-motion on a held key (sum of slow sines; the phases are fixed per emote so takes differ)
      if (P.wob && P.wob[k]) for (const [amp, hz] of P.wob[k]) v += amp * Math.sin(2 * Math.PI * hz * u + (cur.ph || 0) + hz);
      // r8: every LIP-layer key of a preset goes to the lip layer (the compositor drops behaviour's lip keys, so r7's
      // presets lost mouthPucker / mouthFunnel in the clip while the sheet stills showed them)
      if (LIPK.has(k)) { A.lip[k] = (A.lip[k] ?? 0) + Math.max(0, v) * e; continue; }
      if (v < 0) A.sup[k] = (A.sup[k] ?? 0) + e;
      else A.pos[k] = (A.pos[k] ?? 0) + v * e;
    }
    for (let i = 0; i < 3; i++) head[i] += P.head[i] * e;
    // r7: the acting layer (head + body curves); a mirrored take mirrors yaw and roll
    if (P.act && ACTS[P.act]) {
      const A = ACTS[P.act](u), m = P.mir ? -1 : 1;
      head[0] += A.head[0] * e; head[1] += m * A.head[1] * e; head[2] += m * A.head[2] * e;
      this.lean += A.lean * e;
    }
    // gaze: blend toward the preset (an averted expression look replaces behaviour's micro-saccades while held)
    const sr = searchAt(u, cur.ph || 0, P.search);
    A.gz[0] += (P.gaze[0] + sr[0]) * e; A.gz[1] += (P.gaze[1] + sr[1]) * e; A.w += e;
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
