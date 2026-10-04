// STICKY SAFETY ON PARTIALS (ARCHITECTURE.md v2 §10.1-10.2, governor G1/G2). The shipped predicate
// (server/director/safety.js `scanSafety`, imported, never copied: one predicate, every lane) runs on EVERY partial of
// the child's turn, not only on the final. A hit is sticky for the turn: a later partial or final that reads clean
// (the STT revised a word) never un-trips it, and `TurnRequest.duplex.safetyPending` carries it to the server so the
// rank-0 safeguard fires even if the committed transcript is revised (v1 law 5, kept).
//
// `checkedThroughMs` is the audio time the last checked text covered. The governor's pre-speech barrier (G2) lets no
// audio act play until checkedThroughMs >= the coverage the engine decided on, so a fast mouth can never outrun the
// predicate. Pure and browser-safe (the device and the server slice run the same module; the server is the authority).
import { scanSafety } from "../director/safety.js";

export class PartialSafety {
  /** @param {{ scan?: (text:string) => {distress:boolean, kind:string|null} }} [o] */
  constructor(o = {}) {
    this.scan = o.scan || scanSafety;
    this.reset();
    this.checks = 0;
  }

  reset() {
    this.s = { distress: false, kind: null, firstAt: null, checkedThroughMs: null, source: null };
  }

  /** A new turn. `carry`: keep a distress state across (the safeguard has not been spoken yet). */
  begin(t, { carry = false } = {}) {
    if (carry && this.s.distress) return;
    this.reset();
  }

  /**
   * Check one version of the turn's text (every partial and final).
   * @param {string} text  echo-subtracted turn text
   * @param {number|null} coverageEndMs  audio time that text covers
   * @param {number} t
   * @returns {{distress:boolean, kind:"self_harm"|"abuse"|"fear"|null, firstAt:number|null, checkedThroughMs:number|null, source:"predicate"|"model_note"|null, tripped:boolean}}
   */
  check(text, coverageEndMs, t) {
    this.checks++;
    let tripped = false;
    if (!this.s.distress && text) {
      const r = this.scan(text);
      if (r.distress) {
        this.s = { ...this.s, distress: true, kind: r.kind, firstAt: t, source: "predicate" };
        tripped = true;
      }
    }
    if (coverageEndMs !== null && coverageEndMs !== undefined) this.s.checkedThroughMs = Math.max(this.s.checkedThroughMs ?? -Infinity, coverageEndMs);
    return { ...this.s, tripped };
  }

  /** The Director's classifier distress read on a committed turn (a model note): sticky in the same way. */
  modelNote(kind, t) {
    if (this.s.distress) return { ...this.s, tripped: false };
    this.s = { ...this.s, distress: true, kind: kind || "self_harm", firstAt: t, source: "model_note" };
    return { ...this.s, tripped: true };
  }

  state() { return { ...this.s }; }
}
