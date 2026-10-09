// Kill switches for the p5-interaction stream (owner directive 2026-10-05: every user-visible feature ships ON by
// default, behind a kill switch, with the old path as the automatic fallback). Read on every call, so an operator can
// flip a Container App env var and the next turn follows it (no restart needed for a new revision's env either way).
//
//   TAXILA_P5=off                 everything below off at once: the HEAD 8006902 behaviour, byte for byte
//   TAXILA_P5_STEER=off           the wider steering lexicon + the new request moves (confused, clarify, skip, level,
//                                 repeat, back, boredom, frustration, thinking aloud, park / detour / decline / uptake)
//   TAXILA_P5_CARDCAP=off         at most CARD_MAX turns pin one question; the 4th resolves it (assert + next, or leave)
//   TAXILA_P5_GUARDS=off          reply guards: bare question, repeat of an earlier line, orphan quotes, decimals
//   TAXILA_CONV2=off|shadow|on    the UNDERSTAND note (a model reads what the child means; code decides). shadow: the
//                                 note is computed and traced but never changes the move. Default on.
//   TAXILA_P5_RECHECK=off         module answers: the value re-check and the "say it in words" reaction (V1-01r)
//   TAXILA_P5_R3CONV=off          round 3 conversation (2026-10-09): the first pose as a lead-slot turn, no drift check on a
//                                 re-pose that ends on the card's form, the lead repair after a leak, the fixed code lead
//                                 instead of a bare re-pose (brain/say.js); off = round 2's reply path exactly
//
// Every switch defaults to ON. "off", "0", "false" (any case) turn one off.
const OFF = /^(off|0|false|no)$/i;
const env = (k) => process.env[k];
/** Is the whole stream on? */
export const p5On = () => !OFF.test(String(env("TAXILA_P5") ?? ""));
/** Is one switch on (and the stream)? */
export const p5Flag = (name) => p5On() && !OFF.test(String(env(`TAXILA_P5_${name}`) ?? ""));
/** The UNDERSTAND note's mode: "on" | "shadow" | "off". */
export function conv2Mode() {
  if (!p5On()) return "off";
  const v = String(env("TAXILA_CONV2") ?? "on").toLowerCase();
  return OFF.test(v) ? "off" : v === "shadow" ? "shadow" : "on";
}
