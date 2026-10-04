// L9 question type × depth (SIGNALS-SPEC §2.3). The act (question_clarify / question_curious) comes from classify when
// the TB4 block is on; this adds depth. Depth is read with hypotheticals KEPT ("agar … toh" is the what-if).
import { compile } from "../text.js";

export const WHY_HOW = compile(["kyun", "kyon", "kyu", "kaise", "kese", "kaisa", "why", "how", "क्यों", "कैसे", "किसलिए"]);
export const WHAT_IF = compile(["agar * toh", "agar * to", "what if", "suppose", "maan lo", "अगर * तो", "मान लो"]);
export const WHAT = compile(["kya", "kaun", "kab", "kahan", "kitna", "kitne", "what", "which", "when", "where", "who", "क्या", "कौन", "कितना"]);
export const CLARIFY = compile([
  "samajh nahi aaya", "samjh nahi aaya", "samajh nahi", "matlab kya", "kya matlab", "phir se samjhao", "dobara samjhao",
  "what do you mean", "i didnt understand", "i dont understand", "didnt get it", "समझ नहीं", "मतलब क्या",
]);
