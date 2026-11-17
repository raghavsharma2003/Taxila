// d28 guards (the law: on a scripted turn what is said is the walk's authored parts, whole and in order — no guard path drops,
// rewrites, rewords or reorders one): the adversarial drafts the dry harness feeds its own reply path with --adversarial, and the
// differential oracle that reads them. The dry run's benign stub is the baseline: every sentence of the script it said in a turn is
// an authored part the walk put there, and each adversarial draft's turn must say it too, whole and in the same order. Live, two turns
// lost a point this way (director28a: steady c5-t02 row 2, steady c4 row 106); the dry matrix could not see it, its stub never trips
// a guard.
import { fillFriend } from "../../server/director/script.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const key = (t) => norm(t).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
export const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+/).map(norm).filter(Boolean);

/** Every spoken string of a script, as sentence keys (a {friend} slot filled with the harness child's name). */
export function scriptSentenceKeys(script, name = "Riya") {
  const out = new Set();
  const walk = (o) => {
    if (typeof o === "string") { for (const s of sentencesOf(fillFriend(o, name))) { const k = key(s); if (k.split(" ").length >= 3) out.add(k); } return; }
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) if (!["convey", "targets", "key", "accept", "board", "answerBoard", "params", "template", "mustSay"].includes(k)) walk(v);
  };
  walk(script);
  return out;
}

/** The authored sentences of a turn, in order: the sentences of `text` that are sentences of the script. */
export function authoredSentencesOf(text, keys) {
  return sentencesOf(text).map(key).filter((k) => keys.has(k));
}

/** What of `expected` (sentence keys, in order) `text` lost: a sentence not said whole, or said out of order. */
export function authoredLost(expected, text) {
  const got = sentencesOf(text).map(key);
  const missing = expected.filter((k) => !got.includes(k));
  let at = -1, order = true;
  for (const k of expected) { const i = got.indexOf(k, at + 1); if (i < 0) { if (got.includes(k)) order = false; continue; } at = i; }
  return { missing, order };
}

const FILLER = "Dekho, hum isko bahut aaram se aur dhyan se samjhenge, ek ek cheez karke, bilkul jaldi nahi karenge. Tum bahut achha kar rahe ho aur mujhe pata hai ki tum yeh zaroor samajh jaoge. Chalo ab isko saath mein dekhte hain, theek hai na, aur phir aage badhenge.";

/** The adversarial drafts for one turn, built from what the walk put in it: (a) overlong — her filler around a copy of every authored
 *  part; (b) leak — the quick question's, the card's and the item's keys stated, a sentence that contradicts the screen, the point
 *  copied; (c) two questions of hers; (d) her one-sentence paraphrase of the parts with the keys; (e) flat — one word; (f) empty. */
export function draftsFor(state, ui = null, item = null) {
  const lm = state?.lastMove ?? {};
  const parts = [...(lm.sayFirst ?? []), lm.point, lm.simpler, ...(lm.rendered ?? [])].filter(Boolean).map(norm);
  const q = norm(ui?.ask?.text ?? lm.quick?.prompt ?? lm.stepAsk?.prompt ?? "Kya samajh aaya?");
  const keys = [item?.answer, lm.quick?.key].filter((x) => x != null && String(x).trim()).map(String);
  const leakS = keys.map((k) => `Iska jawab ${k} hai.`).join(" ");
  return {
    overlong: `Achha! ${FILLER} ${parts.join(" ")} ${FILLER} ${q}`,
    leak: `Bilkul sahi! ${leakS} ${parts.join(" ")} Screen par 7 gol aur 9 patti hain. ${leakS} ${q}`,
    twoq: `Tumne kya socha? Kya tum taiyaar ho? ${parts.slice(0, 1).join(" ")} Kitne hisse dikh rahe hain? ${q}`,
    // (her own one-sentence rewording of the authored parts, stating the keys: what the live drafts at steady c5-t02 row 2 and c4 row 106
    // did — the point's words in one sentence of hers)
    paraphrase: parts.length ? `Dekho, ${parts.map((x) => x.replace(/[.!?\u0964:,;]+/g, "").replace(/^\p{Lu}/u, (c) => c.toLowerCase())).join(" aur ")}${keys.length ? `, yaani ${keys.join(" aur ")}` : ""}. ${q}` : `Dekho. ${q}`,
    flat: "Achha.",
    empty: "",
  };
}
