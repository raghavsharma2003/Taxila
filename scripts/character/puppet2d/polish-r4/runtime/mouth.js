// Mouth solver for arm P (PLAN §6.1-§6.2): composited weights -> one painted patch (row x emotion column) plus a
// continuous lattice (width, roundness, skew, lower-lip drop). Visemes win when present (HeadAudio / Azure IDs /
// forced alignment); otherwise today's live lip.ts keys (jaw, funnel, pucker, stretch) pick the row. Swaps are 45 ms
// cross-fades with NO minimum hold (avatar-lipsync-dead-ends #2: holds cut accuracy r 0.43 -> 0.16).
const VIS = {
  viseme_sil: "closed", viseme_PP: "PP", viseme_FF: "FF", viseme_TH: "TH", viseme_DD: "DD", viseme_kk: "kk",
  viseme_CH: "CH", viseme_SS: "SS", viseme_nn: "DD", viseme_RR: "RR", viseme_aa: "aa", viseme_E: "E", viseme_I: "I",
  viseme_O: "O", viseme_U: "U",
};
// canonical openness per row (for the continuous lower-lip drift inside a patch)
const ROW_OPEN = { closed: 0, PP: 0, FF: 0.08, TH: 0.15, DD: 0.2, RETRO: 0.35, LL: 0.2, kk: 0.3, CH: 0.12, SS: 0.08, RR: 0.25, aa: 0.75, E: 0.4, I: 0.15, O: 0.5, U: 0.15, small: 0.2 };
const COLS = {
  warm: { closed: "rest", small: "open_sm" },
  delight: { closed: "grin", small: "grin_sm", aa: "laugh", E: "grin_E", I: "grin_E", kk: "laugh", SS: "grin_E", DD: "grin_sm", open_sm: "grin_sm" },
  concern: { closed: "concern", small: "concern_sm", aa: "concern_aa", O: "concern_O", U: "concern_O", kk: "concern_sm", E: "concern_sm", I: "concern_sm" },
  neutral: { closed: "neutral", small: "attentive" },
};
const FADE_S = 0.045;

export class MouthSolver {
  constructor(available) {
    this.have = new Set(available);
    this.from = "rest";
    this.to = "rest";
    this.t = 1;
    this.row = "closed";
  }

  pickRow(bs) {
    const k = (n) => bs[n] ?? 0;
    let best = null, bw = 0.22;
    for (const v in VIS) if (k(v) > bw) { bw = k(v); best = VIS[v]; }
    const open = Math.min(1, k("jawOpen") / 0.85);
    if (best) {
      if ((best === "DD" || best === "RR" || best === "kk") && k("tongueCurl") > 0.3) best = "RETRO";
      else if (best === "DD" && k("tongueTipUp") > 0.3 && k("tongueWide") > 0.3) best = "LL";
      if (best === "closed" && open > 0.12) best = null; // silence viseme but the jaw says open: trust the jaw
      else return best;
    }
    // live lip.ts path: jaw + funnel/pucker + stretch, with hysteresis toward the current row
    const round = Math.max(k("mouthFunnel"), k("mouthPucker"));
    const wide = (k("mouthStretchLeft") + k("mouthStretchRight")) / 2;
    const h = (row, x) => (this.row === row ? x - 0.04 : x + 0.0);
    if (open < (this.row === "closed" ? 0.09 : 0.06)) return "closed";
    if (round > h("O", 0.12) || round > h("U", 0.12)) return open < 0.35 ? "U" : "O";
    if (wide > h("E", 0.12) || wide > h("I", 0.12)) return open < 0.3 ? "I" : "E";
    if (open < (this.row === "small" ? 0.32 : 0.28)) return "small";
    if (open < (this.row === "kk" ? 0.6 : 0.55)) return "kk";
    return "aa";
  }

  solve(bs, dt) {
    const k = (n) => bs[n] ?? 0;
    const smileL = k("mouthSmileLeft"), smileR = k("mouthSmileRight");
    const smile = (smileL + smileR) / 2 - (k("mouthFrownLeft") + k("mouthFrownRight")) / 2;
    const press = (k("mouthPressLeft") + k("mouthPressRight")) / 2;
    const concern = smile < 0.12 ? Math.max(k("browInnerUp") > 0.18 && press > 0.04 ? 0.5 + press : 0, -smile * 2) : 0;
    const open = Math.min(1, k("jawOpen") / 0.85);
    let row = this.pickRow(bs);
    this.row = row;
    let name;
    const side = k("mouthLeft") - k("mouthRight");
    // r2: the painted "hmm" (pursed, slid aside, one corner tucked) when the atlas has it; else r1's "aside"
    if (row === "closed" && Math.abs(side) > 0.18 && smile < 0.3) name = this.have.has("hmm") ? "hmm" : "aside";
    else if (k("eyeWideLeft") + k("eyeWideRight") > 0.5 && open > 0.2 && smile < 0.3 && (row === "aa" || row === "O" || row === "kk")) name = "surprise";
    else if (row === "closed" && Math.abs(smileL - smileR) > 0.14 && smile > 0.18) name = "playful";
    else {
      // r2: with no smile at all (thinking, attentive listening, neutral talk) the closed mouth is the atlas's flat
      // "neutral" shape; c-front's own resting mouth is a smile, and kept for every smile >= 0.04 (idle, warm)
      const col = smile > 0.33 ? "delight" : concern > 0.3 ? "concern" : smile < 0.04 && (row === "closed" || row === "small") ? "neutral" : "warm";
      name = COLS[col][row] ?? row;
    }
    if (!this.have.has(name)) name = COLS.warm[row] ?? row;
    if (!this.have.has(name)) name = "rest";
    // cross-fade
    if (name !== this.to) {
      this.from = this.t > 0.5 ? this.to : this.from;
      this.to = name;
      this.t = 0;
    }
    this.t = Math.min(1, this.t + dt / FADE_S);
    const draw = this.t >= 1 || this.from === this.to ? [[this.to, 1]] : [[this.from, 1], [this.to, this.t]];
    const round = Math.max(k("mouthFunnel"), k("mouthPucker"));
    const wide = (k("mouthStretchLeft") + k("mouthStretchRight")) / 2;
    const rowOpen = ROW_OPEN[row] ?? 0.2;
    return {
      draw, name, row,
      wide: Math.min(1, wide * 1.5), round: Math.min(1, round),
      skew: side * 0.8 + (smileL - smileR) * 0.6,
      // r2: the aside slides the mouth up to ~16 px toward the side (c-thinking), smirk corners lift up to 5 px,
      // and the delight laugh is drawn ~10% smaller (c-happy's open smile is narrower than the atlas laugh)
      shift: Math.max(-1, Math.min(1, side * 1.6)) * (name === "hmm" ? 7 : 16) * (smile < 0.3 ? 1 : 0.4),
      // corners: smirk lift, and when she is NOT smiling the spread talk shapes (E/I/SS/CH) relax their corners
      // down ~3 px so a neutral sentence never reads as a grin (the atlas cut those shapes from smiling frames)
      liftR: Math.max(0, smileL - smileR) * 7 - (smile < 0.08 && (row === "E" || row === "I" || row === "SS" || row === "CH") ? 6 * (1 - smile / 0.08) : 0) - k("mouthFrownLeft") * 6,
      liftL: Math.max(0, smileR - smileL) * 7 - (smile < 0.08 && (row === "E" || row === "I" || row === "SS" || row === "CH") ? 6 * (1 - smile / 0.08) : 0) - k("mouthFrownRight") * 6,
      scale: name === "laugh" || name === "grin_E" ? 0.9 : 1,
      tilt: name === "aside" ? Math.max(-1, Math.min(1, side * 1.6)) * 9 : name === "hmm" ? Math.max(-1, Math.min(1, side * 1.6)) * 3 : 0,
      narrow: name === "aside" ? 0.16 * Math.min(1, Math.abs(side) * 1.6) : name === "hmm" ? 0.06 : 0,
      lowerDrop: Math.max(-2, Math.min(3, (open - rowOpen) * 6)),
      jawGain: row === "closed" || row === "PP" ? 0.2 : 1,
    };
  }
}
