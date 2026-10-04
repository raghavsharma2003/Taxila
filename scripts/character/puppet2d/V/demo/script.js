// The shared review script (PLAN §11.3), as data: idle -> Hinglish line with visemes + Hindi tongue keys -> listening
// with nods -> thinking (glance away, lips aside) -> the emotion register -> head-turn sweep. Arm P can play the same
// file: it only emits HeadRig inputs (state changes, emotion arms, viseme/tongue tracks, preset mixes).
//
// Phonemes are written in a small romanisation: lower-case t d n = Hindi DENTAL (tongue tip on the back of the upper
// teeth), capitals T D N R = RETROFLEX (tip curled back), l = lateral, r = tap, "aa ii uu" long vowels,
// "|" word gap, "," pause, "." full stop.

export const LINES = [
  {
    at: 2.4,
    text: "Namaste bachcho! Aaj hum baarish ke baare mein paDhenge.",
    ph: "n a m a s t e | b a ch ch o , aa j | h u m | b aa r i sh | k e | b aa r e | m e N | p a Dh e n g e .",
  },
  {
    at: 15.2,
    text: "Bahut badhiya! Toh paani kahaan jaata hai?",
    ph: "b a h u t | b a Dh i y aa , t o | p aa n ii | k a h aa N | j aa t aa | h ai .",
  },
];

/** Timeline of non-speech cues (seconds). */
export const CUES = [
  { t: 0.0, state: "idle", label: "idle" },
  { t: 2.2, state: "speaking", arm: "warm", label: "talking (Hinglish, visemes + tongue)" },
  { t: 7.0, state: "listening", label: "listening (nods, attentive)" },
  { t: 7.6, nod: 2.2 }, { t: 8.5, nod: 1.6 }, { t: 9.3, nod: 2.0 },
  { t: 10.0, state: "thinking", preset: "thinkLips", label: "thinking (glance away, lips aside)" },
  { t: 12.4, state: "your_turn", preset: null, label: "delight", mix: "delight" },
  { t: 13.6, mix: "surprise", label: "surprise" },
  { t: 14.6, mix: null },
  { t: 15.0, state: "speaking", label: "talking" },
  { t: 17.6, state: "your_turn", mix: "concern", label: "gentle concern" },
  { t: 19.0, mix: "playful", label: "playful" },
  { t: 20.4, mix: null, sweep: true, label: "head-turn sweep" },
  { t: 24.5, state: "idle", label: "idle", end: true },
];

/** ARKit preset mixes (would live in the look's runtime.json; surprise/playful have no Emotion value yet). */
export const MIXES = {
  delight: { mouthSmileLeft: 0.75, mouthSmileRight: 0.75, cheekSquintLeft: 0.4, cheekSquintRight: 0.4, eyeSquintLeft: 0.2, eyeSquintRight: 0.2, browOuterUpLeft: 0.3, browOuterUpRight: 0.3, jawOpen: 0.28, eyeBlinkLeft: 0.0 },
  surprise: { eyeWideLeft: 0.8, eyeWideRight: 0.8, browInnerUp: 0.6, browOuterUpLeft: 0.7, browOuterUpRight: 0.7, jawOpen: 0.3, mouthFunnel: 0.5 },
  concern: { browInnerUp: 0.55, browDownLeft: 0.08, browDownRight: 0.08, mouthPressLeft: 0.2, mouthPressRight: 0.2, mouthFrownLeft: 0.22, mouthFrownRight: 0.22, eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 },
  playful: { mouthSmileLeft: 0.55, mouthSmileRight: 0.2, mouthLeft: 0.25, browOuterUpLeft: 0.45, eyeSquintLeft: 0.15, eyeSquintRight: 0.12, cheekSquintLeft: 0.25 },
  thinkLips: { mouthRight: 0.55, mouthPressLeft: 0.6, mouthPressRight: 0.6, mouthPucker: 0.25, mouthFrownLeft: 0.15, mouthSmileRight: 0.05, browDownRight: 0.35, browOuterUpLeft: 0.3, browInnerUp: 0.2 },
};
export const MIX_HEAD = { delight: [-2, 0, 3], surprise: [-3, 0, 0], concern: [3, 0, 5], playful: [0, 3, 6], thinkLips: [0, 0, 0] };

const CONS = {
  p: ["PP"], b: ["PP"], m: ["PP"], ph: ["PP"], bh: ["PP"],
  f: ["FF"], v: ["FF"], w: ["FF"],
  t: ["DD", { tongueTipUp: 0.9, tongueOut: 0.2 }], d: ["DD", { tongueTipUp: 0.9, tongueOut: 0.2 }], n: ["nn", { tongueTipUp: 0.8 }],
  th: ["DD", { tongueTipUp: 0.9, tongueOut: 0.25 }], dh: ["DD", { tongueTipUp: 0.9, tongueOut: 0.2 }],
  T: ["DD", { tongueCurl: 1 }], D: ["DD", { tongueCurl: 1 }], Dh: ["DD", { tongueCurl: 1 }], Th: ["DD", { tongueCurl: 1 }], N: ["nn", { tongueCurl: 0.5 }], R: ["RR", { tongueCurl: 0.9 }],
  l: ["nn", { tongueTipUp: 1, tongueWide: 0.6 }], r: ["RR", { tongueTipUp: 0.6 }],
  k: ["kk"], g: ["kk"], kh: ["kk"], gh: ["kk"], h: ["kk", null, 0.35],
  ch: ["CH"], j: ["CH"], chh: ["CH"], jh: ["CH"], sh: ["CH"], s: ["SS"], z: ["SS"], y: ["I", null, 0.6],
};
const VOW = { a: ["aa", 0.62, 0.085], aa: ["aa", 1, 0.15], i: ["I", 0.9, 0.08], ii: ["I", 1, 0.14], u: ["U", 0.9, 0.085], uu: ["U", 1, 0.14], e: ["E", 1, 0.12], ai: ["E", 1.1, 0.15], o: ["O", 1, 0.13], au: ["O", 1.1, 0.15] };

/** Expand a line into timed phoneme events: {t0, t1, vis, w, tongue}. */
export function phonemes(line) {
  const ev = [];
  let t = line.at;
  for (const tok of line.ph.split(/\s+/)) {
    if (!tok) continue;
    if (tok === "|") { t += 0.03; continue; }
    if (tok === ",") { t += 0.26; continue; }
    if (tok === ".") { t += 0.35; continue; }
    if (VOW[tok]) {
      const [v, w, d] = VOW[tok];
      ev.push({ t0: t, t1: t + d, vis: "viseme_" + v, w, tongue: null });
      t += d;
    } else if (CONS[tok]) {
      const [v, tg, w = 1] = CONS[tok];
      const d = v === "PP" ? 0.085 : v === "kk" ? 0.06 : 0.07;
      ev.push({ t0: t, t1: t + d, vis: "viseme_" + v, w, tongue: tg || null, bilabial: v === "PP" });
      t += d;
    }
  }
  return { ev, end: t };
}

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Coarticulated viseme + tongue weights at time t (attack 40 ms before the onset, release 60 ms after). */
export function visemesAt(tracks, t, out = {}) {
  for (const k in out) delete out[k];
  let pp = 0;
  for (const tr of tracks) {
    if (t < tr.ev[0].t0 - 0.2 || t > tr.end + 0.3) continue;
    for (const e of tr.ev) {
      if (t < e.t0 - 0.06 || t > e.t1 + 0.09) continue;
      const atk = e.bilabial ? 0.03 : 0.045, rel = e.bilabial ? 0.04 : 0.065;
      const env = Math.min(ss((t - (e.t0 - atk)) / (atk * 1.6)), 1 - ss((t - (e.t1 - 0.01)) / rel));
      if (env <= 0) continue;
      const w = env * e.w;
      out[e.vis] = Math.max(out[e.vis] || 0, w);
      if (e.bilabial) pp = Math.max(pp, env);
      if (e.tongue) for (const k in e.tongue) out[k] = Math.max(out[k] || 0, e.tongue[k] * env);
    }
  }
  // a bilabial closes: everything else yields while the lips are together (M4: >= 80% closed frames)
  if (pp > 0) for (const k in out) if (k !== "viseme_PP") out[k] *= 1 - pp;
  return out;
}
