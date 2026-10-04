// Backchannels (ARCHITECTURE.md §3.2): body first, sound rarely, never a verdict. Pure, browser-safe.
//
// Content-blind by design: WHEN she nods is a function of the child's prosody and the floor state only. The policy never
// sees the transcript's correctness, so "she stopped nodding, so I'm wrong" cannot happen (design-v2-rejected-correctness-face).
// The only content it sees is the answer FORM (no nods inside a number/choice answer) and the safety state (no nods at all).

export const NOD = {
  minVoicedMs: 1500,   // the child has spoken >= 1.5 s in this turn
  dipMinMs: 200,       // a BOP is a 200-500 ms dip ...
  dipMaxMs: 500,
  capMs: 3000,         // <= 1 nod per 3 s
};
export const MM = { minVoicedMs: 4000, dipMinMs: 400, capMs: 12000 };

export class BackchannelPolicy {
  /** @param {{ audio?: boolean, mode?: "bop"|"level" }} [opts] audio "mm" is off unless flagged; "level" = naive level-driven reference arm */
  constructor(opts = {}) {
    this.audio = !!opts.audio;
    this.mode = opts.mode || "bop";
    this.lastNodAt = -Infinity;
    this.lastMmAt = -Infinity;
    this.firedThisDip = false;
  }

  newTurn() { this.firedThisDip = false; }

  /**
   * Called every frame while the child holds the floor.
   * @param {{ t:number, silenceMs:number, voicedMsTurn:number, loud:boolean }} f  ear frame
   * @param {{ falling:boolean, lowPitch:boolean }} pros  ear prosody (last 300 ms before the dip)
   * @param {{ state:string, answerForm?:string, safety:boolean, hold:boolean }} floor
   * @returns {{ do:"nod"|"mm", t:number }[]}
   */
  step(f, pros, floor) {
    const out = [];
    if (f.loud) this.firedThisDip = false;
    if (floor.safety || floor.hold) return out;
    if (floor.state !== "C_SPEAKING" && floor.state !== "C_PAUSED") return out;
    const closed = floor.answerForm === "number" || floor.answerForm === "choice" || floor.answerForm === "yesno";
    if (closed) return out;
    if (this.mode === "level") {
      // reference arm: a nod every 3 s of voiced level, whatever the words or the pauses (what a mic-level listener does)
      if (f.loud && f.voicedMsTurn >= NOD.minVoicedMs && f.t - this.lastNodAt >= NOD.capMs) { this.lastNodAt = f.t; out.push({ do: "nod", t: f.t }); }
      return out;
    }
    if (this.firedThisDip || f.loud) return out;
    if (f.silenceMs >= NOD.dipMinMs && f.silenceMs <= NOD.dipMaxMs && f.voicedMsTurn >= NOD.minVoicedMs && pros.falling && pros.lowPitch
      && f.t - this.lastNodAt >= NOD.capMs) {
      this.lastNodAt = f.t;
      this.firedThisDip = true;
      out.push({ do: "nod", t: f.t });
      if (this.audio && f.voicedMsTurn >= MM.minVoicedMs && f.t - this.lastMmAt >= MM.capMs) { this.lastMmAt = f.t; out.push({ do: "mm", t: f.t }); }
    }
    return out;
  }
}
