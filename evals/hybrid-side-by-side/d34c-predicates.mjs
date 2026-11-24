// to-brain 052, the engine builder's parts (docs/patches/to-brain/052-d34-merged-tree-one-count-ladder-after-own-reason.md): the predicates
// it adds or re-reads, registered in dry-predicates.mjs after d34a and d34b (tests/r8-d34-052e.test.mjs).
//   helpLadder  A1 re-reads help-predicates.mjs's H4 predicate (that file is left as it is): after the card's named wrong answer the own
//               reason is the first rung of a miss's help, before the card's own simpler — "simpler unsaid, whyAlt said instead" is that
//               rung said in its place, and the simpler said with the own reason unsaid is the fault. Every other reading is H4's.
//   remCardLong B1 re-reads d29's T2 predicate (left as it is): a remediation the checker lists in REM_WHOLE is said with its card up to 65
//               words of the two — its own lines and the card, as the checker counts them; the verdict and the joint before it are not
//               counted. Every other remediation is T2's: over 60 words of the turn.
//   inviteAfterQuestion  (main's ruling on the close of 052) an invitation (joints.yourTurn, or a pointed one, answerFirst) said straight
//               after a sentence of the same turn that ends in "?": the question asked, then "Ab tum batao." Gated.
//   questionThreeRunning  d34b's C4 predicate, re-read: a turn that says the card's Hindi form for a language request (its hindiSwitch
//               seam) ends on that form whatever the count — the child asked for the question — so it is not flagged; it still counts
//               toward the run of the turns after it.
import { readFileSync } from "node:fs";
import { atQuestionOf, closingQuestion, answerFirstForms, endsOnAnswerFirst, endsOnYourTurn, turnsAtQuestion } from "../../server/director/question-run.js";
import { D34B_PREDICATES } from "./d34b-predicates.mjs";
import { HELP_PREDICATES, helpTurnOf, ownReasonDue } from "./help-predicates.mjs";
import { D29_PREDICATES } from "./d29-predicates.mjs";
import { REM_WHOLE } from "../../scripts/lesson-scripts/check.mjs";
import { REM_WHOLE_CAP } from "../../server/director/state.js";
import { helpPart, at, sentencesOf, normSentence, sameSentence } from "../../server/director/help.js";

const H4 = HELP_PREDICATES.helpLadder;
const GIVE_UP_ANSWERED = HELP_PREDICATES.giveUpAnswered;
// (dry-predicates.mjs's endsOnQuestion is assigned on PREDICATES after this file is read: taken at the call)
let ENDS_ON_Q = null;
export const setEndsOnQuestion = (f) => { ENDS_ON_Q = f; };
const T2 = D29_PREDICATES.remCardLong;
const wordsOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
/** The sentences of a script value (string, or { hi, en }), normalised. */
const sentsOf = (v) => (typeof v === "string" ? [v] : [v?.hi, v?.en]).filter(Boolean).flatMap(sentencesOf).map(normSentence).filter(Boolean);
/** Every normalised sentence of her turns before row i. */
const saidBefore = (L, i) => L.rows.slice(0, i).filter((x) => x.who === "teacher").flatMap((x) => sentencesOf(x.text).map(normSentence));

// (B5: every aside reply frame, both languages, as a pattern with its slot: a frame is the form as written)
const ASIDE = JSON.parse(readFileSync(new URL("../../data/lesson-aside-replies.json", import.meta.url), "utf8"));
const escRe = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const FRAMES = Object.values(ASIDE.kinds ?? {}).flatMap((k) => [...(k.phraseReplies ?? []), ...(k.againReplies ?? []), ...(k.replies ?? [])])
  .flatMap((f) => [f?.hi, f?.en]).filter((x) => typeof x === "string" && /\{(?:phrase|word)\}/.test(x))
  .map((f) => ({ f, re: new RegExp(`(?:^|[.!?]\\s+)${escRe(f).replace(/\\\{(?:phrase|word)\\\}/g, "(.{1,40}?)").replace(/achha(\\s\+|\s+)lagta/gi, "(?:achha$1lagta|achhi$1lagti|achhe$1lagte)")}(?=\\s|$)`, "iu") }));
/** The aside reply frame a row says, or null. */
export const asideFrameOf = (r) => FRAMES.find((x) => x.re.test(String(r?.text ?? "").replace(/\s+/g, " ").trim()))?.f ?? null;

export const D34C_PREDICATES = {
  /** A1 (gated, as H4 was). */
  helpLadder(L, r, i, ctx) {
    const f = H4(L, r, i, ctx);
    const h = helpTurnOf(L, r, i, ctx);
    if (!h || h.request !== "hint" || h.keyed || h.closed) return f;
    const part = helpPart(ctx.script, h.part);
    if (!part || at(ctx.script, `${part.path}.whyAltAsHelp`) !== true || !ownReasonDue(L, i, ctx, h.part)) return f;
    const wa = sentsOf(at(ctx.script, `${part.path}.whyAlt`)), simp = sentsOf(at(ctx.script, `${part.path}.simpler`));
    if (!wa.length) return f;
    const said = saidBefore(L, i);
    const T = sentencesOf(r.text).map(normSentence);
    const has = (ks, set) => ks.some((k) => set.some((x) => sameSentence(k, x)));
    // (spent when every sentence of one of its forms was said — the Hinglish, or the English)
    const v = at(ctx.script, `${part.path}.whyAlt`);
    const waSaid = (typeof v === "string" ? [v] : [v?.hi, v?.en]).filter(Boolean).some((t) => { const ks = sentsOf(t); return ks.length && ks.every((k) => said.some((x) => sameSentence(k, x))); });
    if (!waSaid && !has(wa, T) && has(simp, T)) return `whyAlt unsaid on ${h.part}, simpler said instead (the own reason first after the named answer)`;
    if (f && /^(?:ask\.)?simpler unsaid on .*, whyAlt said instead$/.test(f) && !waSaid && has(wa, T)) return null;
    return f;
  },
  /** B5 (gated): an aside reply said in the frame of her aside reply before it — the same form, another word of the child's. */
  asideFrameTwice(L, r, i) {
    if (r.who !== "teacher") return null;
    const f = asideFrameOf(r);
    if (!f) return null;
    const prev = L.rows.slice(0, i).reverse().find((x) => x.who === "teacher" && asideFrameOf(x));
    return prev && asideFrameOf(prev) === f ? `the aside reply frame "${f}" twice running` : null;
  },
  /** B4 (gated): the third turn running at one question or later, when it parks an aside or replies to one, ends on a pointed invitation
   *  (joints.answerFirst, else code's forms) and does not say the question's closing sentence. */
  answerFirstThird(L, r, i, ctx) {
    if (r.who !== "teacher" || !["aside", "aside_reply"].includes(String(r.cell?.column ?? ""))) return null;
    const sc = ctx?.script;
    const her = L.rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => String(x.text ?? ""));
    // (the question her turns were at: the last one said)
    const path = her.map((t) => atQuestionOf(sc, t)).filter((x) => x && x !== "?short").at(-1) ?? null;
    if (!path || /^\.?teachback/.test(path) || turnsAtQuestion(sc, her, path) < 2) return null;
    const now = atQuestionOf(sc, r.text);
    if (now === path) return "the question said again on an aside turn, the third at it or later";
    if (now && now !== "?short") return null;
    // (her own question about the aside — the return, the question after "Main AI teacher hoon" — is the aside's: that turn asks it)
    if (/[?？]\s*$/.test(String(r.text ?? "").trim())) return null;
    return endsOnAnswerFirst(sc, r.text) ? null : "an aside turn, the third at one question or later, not ending on a pointed invitation";
  },
  /** B4: a pointed invitation (joints.answerFirst, else code's forms) is an allowed ending, as joints.yourTurn is: dry-predicates.mjs's
   *  endsOnQuestion, re-read. */
  endsOnQuestion(L, r, i, ctx) {
    if (r.who === "teacher" && endsOnAnswerFirst(ctx?.script ?? null, String(r.text ?? "").trim())) return null;
    return ENDS_ON_Q ? ENDS_ON_Q(L, r, i, ctx) : null;
  },
  /** H4's giveUpAnswered, re-read: a clarify at an asked step whose simpler was said is answered by the step told (Brain 045 P3), as a
   *  give-up there is — B4's parks made that path reachable (dry offtopic c4-ch01-t02 32). */
  giveUpAnswered(L, r, i, ctx) {
    const f = GIVE_UP_ANSWERED(L, r, i, ctx);
    if (!f || !/^a clarify/.test(f)) return f;
    const m = /^(.+-s\d+):worked:step(\d+):ask$/.exec(String(r.cell?.part ?? ""));
    if (!m) return f;
    const st = (ctx?.script?.skills ?? []).find((k) => k.skillId === m[1])?.workedExample?.steps?.[Number(m[2]) - 1];
    const told = [st?.told?.hi, st?.told?.en].filter(Boolean).map((x) => normSentence(sentencesOf(x)[0] ?? ""));
    const T = normSentence(r.text);
    return told.some((k) => k && T.includes(k)) ? null : f;
  },
  /** Main's ruling on the close of 052 (gated): an invitation never follows a question in the same turn. The eleven dry rows of the merged
   *  tree were the card's Hindi form for a language request, then "Ab tum batao." (stuck c4-ch01-t02 8). */
  inviteAfterQuestion(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const text = String(r.text ?? "").replace(/\s+/g, " ").trim(), sc = ctx?.script ?? null;
    const last = (r.seams ?? []).at(-1)?.right;
    if (!(endsOnYourTurn(sc, text) || endsOnAnswerFirst(sc, text) || last === "yourTurn" || last === "answerFirst")) return null;
    const ss = sentencesOf(text);
    return ss.length >= 2 && /[?？]\s*$/.test(ss.at(-2)) ? `an invitation straight after a question: "${ss.at(-2).slice(0, 50)} ${ss.at(-1)}"` : null;
  },
  /** d34b's C4 predicate, re-read (gated, as it was): the card's Hindi form said for a language request ends its turn. */
  questionThreeRunning(L, r, i, ctx) {
    if (r.who === "teacher" && (r.seams ?? []).some((x) => x.right === "hindiSwitch")) return null;
    return D34B_PREDICATES.questionThreeRunning(L, r, i, ctx);
  },
  /** B1 (gated, as T2 was). */
  remCardLong(L, r, i, ctx) {
    const f = T2(L, r, i, ctx);
    if (!f || r.who !== "teacher") return f;
    const pp = r.pageParts ?? [];
    const remP = pp.find((p) => /^rem:/.test(String(p.beat ?? "")));
    const targets = remP ? String(remP.beat).slice(4) : null;
    const skillId = /^(.+?-s\d+):/.exec(String(r.held?.unit ?? r.cell?.part ?? ""))?.[1] ?? null;
    const topicId = ctx?.script?.topicId ?? null;
    if (!targets || !REM_WHOLE.some((w) => w.topicId === topicId && w.skillId === skillId && w.targets === targets)) return f;
    const text = String(r.text ?? "").replace(/\s+/g, " ").trim();
    const n = pp.map((p, k) => ({ p, t: text.slice(p.from ?? 0, pp[k + 1]?.from ?? text.length) }))
      .filter(({ p }) => !p.lead && ((["body", "simpler"].includes(p.part) && /^rem:/.test(String(p.beat ?? ""))) || (p.part === "card" && /^then:/.test(String(p.beat ?? "")))))
      .reduce((a, { t }) => a + wordsOf(t), 0);
    return n > REM_WHOLE_CAP ? `a remediation listed whole and its follow-up card in ${n} words (over ${REM_WHOLE_CAP})` : null;
  },
};
