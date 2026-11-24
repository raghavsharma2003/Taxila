// to-brain 053, builder B's parts (docs/patches/to-brain/053-director34-second-picture-several-wrong-answers-walk-paths.md): the predicates
// it adds or re-reads, registered in dry-predicates.mjs after d34c (tests/r8-d35-053b.test.mjs pins each on its director34 rows).
//   leadInAfterVerdict  C1: code's lead-in "Suno," or "Dekho," between a right verdict and its reason ("Haan, sahi hai. Suno, …"). An opener
//                       authored inside a script's sentence is not code's and is not flagged. Gated.
//   asideReplyKind      C2: a liking form ("Toh yeh tumhe achha lagta hai.", "… pasand hai", a favourite said of no favourite asked) said as her
//                       reply to a child whose answer was a person or a time or place (brain/asideReplies.js replyKindOf). Gated.
//   whyAltNoMiss        F: d33's predicate re-read — each named reason (the card's marked whyAlt, and each `wrongAnswers[k].why`) is read
//                       against its own answer: said as help to a child whose last answer at that card was another answer is the fault.
//                       Every reading d33 makes on a card with no `wrongAnswers` is d33's, unchanged. Gated, as d33's was.
import { D33_PREDICATES } from "./d33-predicates.mjs";
import { helpTurnOf, lastAnswerAt } from "./help-predicates.mjs";
import { helpPart, at, sentencesOf, normSentence } from "../../server/director/help.js";
import { replyKindOf, replyFrameOf } from "../../server/brain/asideReplies.js";
import { canon, sameAnswer, wrongList } from "../../server/grading/script-answer.js";

const VERDICT_RIGHT = ["Haan, sahi hai", "Bilkul sahi", "Haan, bilkul theek", "Sahi jawab", "Yes, that's right", "Exactly right", "Yes, correct", "That's right"];
const esc = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LEAD_IN = new RegExp(`^(?:${VERDICT_RIGHT.map(esc).join("|")})\\. (Suno|Dekho|Look|Listen), (.{0,40})`, "u");
const keyOf = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();

/** The named wrong answers of a script node: [{ n, answers: [string], why }] — n 0 is `wrongIfMis` with `whyAlt` (only where it is marked
 *  whyAltAsHelp: an unmarked whyAlt is no help), n ≥ 1 is `wrongAnswers[n − 1]`. */
export function namedAnswersOf(node) {
  const out = [];
  if (wrongList(node?.wrongIfMis).length) out.push({ n: 0, answers: wrongList(node.wrongIfMis), why: node.whyAltAsHelp === true ? node.whyAlt ?? null : null });
  (Array.isArray(node?.wrongAnswers) ? node.wrongAnswers : []).slice(0, 3).forEach((w, k) => {
    const answers = [...wrongList(w?.answer), ...(Array.isArray(w?.accept) ? w.accept : [])].filter((x) => x != null && String(x).trim());
    if (answers.length) out.push({ n: k + 1, answers, why: w?.why ?? null });
  });
  return out;
}
/** Which named answer a child's words are: its n, or null. */
export function namedOfText(named, text) {
  const R = canon(String(text ?? ""));
  return named.find((x) => x.answers.some((a) => normSentence(a) === normSentence(text) || sameAnswer(canon(a), R)))?.n ?? null;
}
const reasonKeys = (v) => [v?.hi, v?.en, typeof v === "string" ? v : null].filter(Boolean).flatMap(sentencesOf).map((x) => normSentence(x.replace(/\{\w+\}/g, " "))).filter((k) => k.split(" ").length >= 4);

export const D35B_PREDICATES = {
  /** C1 (gated). */
  leadInAfterVerdict(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const m = LEAD_IN.exec(String(r.text ?? "").replace(/\s+/g, " ").trim());
    if (!m) return null;
    // (an opener authored inside a script's sentence — its reason begins "Dekho, …" — is the script's)
    const sj = keyOf(JSON.stringify(ctx?.script ?? {}));
    if (sj.includes(keyOf(`${m[1]}, ${m[2]}`).slice(0, 30))) return null;
    return `code's lead-in "${m[1]}," between the right verdict and its reason`;
  },
  /** C2 (gated). */
  asideReplyKind(L, r, i) {
    if (r.who !== "teacher" || i < 2) return null;
    const child = L.rows[i - 1], asked = L.rows[i - 2];
    if (child?.who !== "child" || asked?.who !== "teacher") return null;
    const s0 = sentencesOf(r.text).slice(0, 2).join(" ");
    const f = replyFrameOf(s0);
    if (!f) return null;
    const q = String(asked.text ?? "").split(/(?<=[.!?।])\s+/).filter((x) => /[?？]\s*$/.test(x)).at(-1) ?? "";
    const kind = replyKindOf(asked.text, child.text);
    const like = /achha\s+lagta|pasand|maza\s+aata|what you like|you like/i.test(f), fav = /favou?rite/i.test(f);
    if (like && ["person", "whenWhere"].includes(kind)) return `a liking form ("${f}") to a child who named a ${kind === "person" ? "person" : "time or place"} ("${String(child.text).slice(0, 30)}")`;
    if (fav && (kind === "whenWhere" || (kind === "person" && !/favou?rite/i.test(q)))) return `a favourite form ("${f}") to a child who named a ${kind === "person" ? "person who was there" : "time or place"}`;
    return null;
  },
  /** F (gated): d33's reading, and each wrongAnswers reason against its own answer. */
  whyAltNoMiss(L, r, i, ctx) {
    const h = helpTurnOf(L, r, i, ctx) ?? (r.who === "teacher" && r.cell?.column === "picture" && ["hint", "none"].includes(r.cell?.picture) && r.cell?.part
      ? { request: "picture", part: r.cell.part, keyed: !!r.cell.keyed } : null);
    const part = h ? helpPart(ctx.script, h.part) : null;
    const node = part ? at(ctx.script, part.path) : null;
    const named = namedAnswersOf(node);
    if (!named.some((x) => x.n > 0)) return D33_PREDICATES.whyAltNoMiss(L, r, i, ctx);
    const T = normSentence(r.text);
    const last = lastAnswerAt(L, i, ctx, h.part);
    const lastN = last && !last.right ? namedOfText(named, last.text) : null;
    for (const x of named) {
      if (!x.why) continue;
      if (!reasonKeys(x.why).some((k) => T.includes(k))) continue;
      // (the card's own whyAlt also fits a misconception read for the card's own mix-up with no other named answer said)
      const fits = lastN === x.n || (x.n === 0 && lastN == null && !!last && !last.right && last.read === "misconception" && !!node?.targets);
      if (!fits) return `the reason of ${x.n === 0 ? "wrongIfMis" : `wrongAnswers[${x.n - 1}]`} at ${h.part.split(":").slice(-2).join(":")} said as help (${h.request}), its last answer ${last ? `"${last.text.slice(0, 20)}" (${last.read})` : "none"}`;
    }
    return null;
  },
};
