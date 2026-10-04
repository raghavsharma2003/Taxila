// L2 hedge lexicon (SIGNALS-SPEC §2.3). Seeds from RESEARCH §5.1 plus Roman/Devanagari spellings. The tag question alone
// ("hai na?", "right?") is NOT a hedge: Indian English uses it as a turn-yield. Precision bar: SG-M7 ≥ 0.8 (ES-4).
// Surface forms live here as code only; they never enter a prompt (SL-14).
import { compile } from "../text.js";

export const HEDGE = compile([
  "shayad", "shaayad", "shyd", "sayad", "शायद",
  "mujhe lagta", "mujhe lag raha", "mere ko lagta", "mereko lagta", "lagta hai ki", "aisa lagta", "मुझे लगता", "लगता है कि",
  "ho sakta hai", "ho sakta", "हो सकता है",
  "pakka nahi", "pakka nahin", "sure nahi", "sure nahin", "पक्का नहीं",
  "kya pata", "pata nahi par", "pata nahi lekin",
  "i think", "i guess", "maybe", "probably", "not sure", "im not sure", "i am not sure", "not very sure", "kind of", "sort of",
  "i dont know but", "might be", "could be",
]);
/** "lagta hai" counts only at the start of the turn (a bare stance), never after a noun ("dar lagta hai", "bhook lagti"). */
export const HEDGE_START = compile(["lagta hai", "लगता है"]);
