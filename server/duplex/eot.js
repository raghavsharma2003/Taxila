// End of turn: done, or still thinking? (ARCHITECTURE.md §3.1, §3.3, §3.4). Code decides; a model may only SHORTEN a hold.
// Called by the floor manager at the candidate endpoint and again whenever new text lands while a hold runs.
// Inputs are a slice note (understand.js), the silence run, the ear's prosody, and the answer form. Output: commit now,
// or hold for N ms after the candidate. Pure and browser-safe.
//
// Until E1 (real children) fits weights, the combiner IS Study C's shipped schedule (policyScore/thresholds) with the
// prosody terms as ±0.05 tie-breakers only (a model fitted to synthetic speech would encode TTS prosody, not children).

export const CAND_MS = 500;
const EXPLAINING = new Set(["teachback", "explain", "worked_example", "contrast", "explore_question", "reflect"]);
export const HOLD_REQUEST_MS = 8000;
export const SAFETY_SILENCE_MS = 1500; // LateIntent: speak the safeguard only after >= 1.5 s of silence (or a TRP)
/** G5: on explanation beats she waits >= 1.5 s of silence, deliberately and visibly listening (Rowe wait time II). */
export const EXPLAIN_MIN_SILENCE_MS = 1500;
const OPEN_CUES = new Set(["open", "filler", "projection"]);

/** The §3.1 table row for this context: commit threshold and hold window (ms after the candidate). */
export function rowFor(ctx = {}, note) {
  const form = ctx.answerForm;
  if (form === "yesno" || form === "choice" || ctx.handover === "choice") return { name: "closed", thr: 0.3, hold: 0, cap: 700 };
  if (form === "number") {
    const fluent = note && note.lastValue !== null && !note.hesitatedEarlier;
    return fluent ? { name: "number_value", thr: 0.3, hold: 0, cap: 1200 } : { name: "number_novalue", thr: 0.3, hold: 700, cap: 1200 };
  }
  if (ctx.beat && EXPLAINING.has(ctx.beat)) return { name: "explain", thr: 0.8, hold: 1500, cap: 2500 };
  if (ctx.beat === "probe" || ctx.beat === "why") return { name: "probe", thr: 0.75, hold: 1200, cap: 2000 };
  return { name: "default", thr: 0.55, hold: 800, cap: 1500 };
}

/**
 * @param {ReturnType<import('./understand.js').understand>} note
 * @param {{ answerForm?:string, beat?:string }} ctx
 * @param {{ falling?:boolean, rising?:boolean, lowPitch?:boolean }} [pros]
 * @param {{ prosody?: boolean, repair?: boolean, openToCap?: boolean, explainMinSilence?: boolean }} [opts]  ablation switches (default all on)
 * @returns {{ commit: boolean, holdMs: number, p: number, thr: number, cue: string, why: string, floor?: boolean }}
 */
export function decideEnd(note, ctx = {}, pros = {}, opts = {}) {
  const useProsody = opts.prosody !== false, useRepair = opts.repair !== false;
  const openToCap = opts.openToCap !== false, explainMin = opts.explainMinSilence !== false;
  if (note.safety?.distress) return { commit: false, holdMs: SAFETY_SILENCE_MS - CAND_MS, p: 0, thr: 1, cue: "safety", why: "safety: speak only after 1.5 s silence" };
  if (note.holdTail) return { commit: false, holdMs: HOLD_REQUEST_MS, p: 0.02, thr: 1, cue: "hold_request", why: "explicit hold request" };
  const row = rowFor(ctx, note);
  let p = note.lex.p, thr = row.thr, hold = row.hold, why = `lex ${note.lex.cue}`;
  // §3.3: a question with a yield cue, an IDK, trouble, a stop request: commit at the candidate (threshold 0.3)
  if (note.asks || note.idk || note.stop) { thr = Math.min(thr, 0.3); p = Math.max(p, 0.9); hold = 0; why = note.asks ? "asks" : note.idk ? "idk" : "stop"; }
  // §3.4: a word search ("woh… kya kehte hain") is never a TRP
  if (note.wordSearch) { p = Math.min(p, 0.1); hold = Math.max(hold, row.cap); why = "word search"; }
  // closed form with no value yet: hold briefly (M-B1: hesitation precedes the value)
  if (ctx.answerForm === "number" && note.lastValue === null && !note.asks && !note.idk && note.lex.cue !== "yield") {
    p = Math.min(p, 0.25); hold = Math.max(hold, 700); why = "closed: no value yet";
  }
  if (useRepair && note.repairOpen) { p = Math.min(p, 0.1); hold = row.cap; why = "self-repair in progress"; }
  // §3.4 reasoning aloud: a syntactically open tail (connective, postposition, unanswered "jab/agar") holds to the cap
  if (openToCap && OPEN_CUES.has(note.lex.cue) && ["explain", "probe", "default"].includes(row.name) && !note.asks && !note.idk && !note.stop) {
    hold = Math.max(hold, row.cap); why = `${why} (open tail: hold to cap)`;
  }
  if (useProsody) {
    if (pros.falling && pros.lowPitch) p += 0.05;
    else if (pros.rising && !note.asks) p -= 0.05;
  }
  p = Math.max(0, Math.min(1, p));
  const commit = p >= thr && !(useRepair && note.repairOpen) && !note.wordSearch;
  // a corrected value just landed ("…nahi nahi, teen bata chaar"): one more breath before committing [E: 300 ms]
  if (commit && useRepair && note.repaired && !EXPLAINING.has(ctx.beat)) return { commit: false, holdMs: 300, p, thr, cue: note.lex.cue, why: `${why} +repaired` };
  // G5: an explanation is answered only after >= 1.5 s of silence unless the child asked, gave up or asked to stop
  if (commit && explainMin && row.name === "explain" && !note.asks && !note.idk && !note.stop) {
    return { commit: false, holdMs: EXPLAIN_MIN_SILENCE_MS - CAND_MS, p, thr, cue: note.lex.cue, why: `${why} +explain floor 1.5 s`, floor: true };
  }
  return { commit, holdMs: commit ? 0 : hold, p, thr, cue: note.lex.cue, why };
}
