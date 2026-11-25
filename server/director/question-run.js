// Brain 049 B4 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md): a question is heard at most two of her turns running.
// One reading of "the same question", shared by the walk (state.js yourTurnPass) and the predicates that read the record
// (evals/hybrid-side-by-side/d32-predicates.mjs questionThreeRunning, dry-predicates.mjs's turn-ending and re-ask laws):
//   a question is every form the script writes for one object with a `prompt` (prompt, reask, hindi; hi and en), keyed by its last
//   question sentence; a turn is "at" that question when its own last sentence is one of those keys. A `{slot}` in a form ({friend},
//   {friendF}) matches any words, so a filled turn is read against the unfilled script.
// The third turn running at one question ends on one of the script's `joints.yourTurn` forms instead (an invitation that asks nothing);
// the fourth asks the question again, in the form that was not the last one said.

import { fillFriend } from "./friend.js";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const SLOT = "zzslotzz";
const qKey = (t) => low(String(t ?? "").replace(/\{\w+\}/g, ` ${SLOT} `)).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
const formsOf = (x) => (x && typeof x === "object" ? [x.hi, x.en] : [x]).filter((y) => typeof y === "string" && y.trim());

/** A text's closing question sentence (its last sentence, ending "?"), or null. */
export function closingQuestion(text) {
  const q = sentencesOf(text).at(-1) ?? "";
  return /[?？]\s*$/.test(q) ? q : null;
}

const CACHE = new WeakMap();
/** Every question the script writes → its path: { exact: Map<key, path>, slotted: [{ re, path }] }. The first path to write a key keeps it. */
export function questionPaths(script) {
  if (!script || typeof script !== "object") return { exact: new Map(), slotted: [] };
  const hit = CACHE.get(script);
  if (hit) return hit;
  const exact = new Map(), slotted = [], seen = new Set();
  const walk = (o, path) => {
    if (Array.isArray(o)) return o.forEach((x, n) => walk(x, `${path}[${n}]`));
    if (!o || typeof o !== "object") return;
    if (o.prompt) for (const f of ["prompt", "reask", "hindi"]) for (const t of formsOf(o[f])) {
      const q = closingQuestion(t);
      const k = q ? qKey(q) : null;
      if (!k || seen.has(k)) continue;
      seen.add(k);
      if (k.includes(SLOT)) slotted.push({ re: new RegExp(`^${k.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")}$`, "u"), path });
      else exact.set(k, path);
    }
    for (const [k, v] of Object.entries(o)) if (v && typeof v === "object") walk(v, `${path}.${k}`);
  };
  walk(script, "");
  const out = { exact, slotted };
  CACHE.set(script, out);
  return out;
}
/** The script path of the question a text ends on, or null (no closing question, or one the script does not write). */
export function questionPathOf(script, text) {
  const q = closingQuestion(text);
  if (!q) return null;
  const k = qKey(q), P = questionPaths(script);
  if (P.exact.has(k)) return P.exact.get(k);
  return P.slotted.find((x) => x.re.test(k))?.path ?? null;
}
/** to-brain 054 B: the object a question path (questionPaths) names in the script — a card, an asked step's `ask` — or null. */
export function questionObjectAt(script, path) {
  let o = script;
  for (const m of String(path ?? "").matchAll(/\.([^.[\]]+)|\[(\d+)\]/g)) { o = o?.[m[1] ?? Number(m[2])]; if (o == null) return null; }
  return o && typeof o === "object" && o !== script ? o : null;
}
/** to-brain 054 B3: the question's own `reask` (every question the script writes has one) in a lesson language — Hindi and Hinglish say
 *  `hi` — its {slots} unfilled, or null. */
export function reaskOf(script, path, lang = "hinglish") {
  const r = questionObjectAt(script, path)?.reask;
  const t = typeof r === "string" ? r : lang === "english" ? r?.en ?? r?.hi : r?.hi ?? r?.en;
  return typeof t === "string" && t.trim() ? t.replace(/\s+/g, " ").trim() : null;
}
/** RULING-B3 (main's third ruling on cause B): whether a text ends on the question's own `reask` (its closing question, {slots} matching
 *  any words), in either language. */
export function endsOnReaskOf(script, path, text) {
  const got = qKey(closingQuestion(text) ?? "");
  if (!got) return false;
  return ["hinglish", "english"].some((lang) => {
    const r = reaskOf(script, path, lang);
    const want = r ? qKey(closingQuestion(r) ?? sentencesOf(r).at(-1) ?? "") : "";
    if (!want) return false;
    const re = new RegExp(`^${want.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")}$`, "u");
    return re.test(got);
  });
}
/** The script's `joints.yourTurn` forms in a lesson language (Hindi and Hinglish say `hi`): string[]. */
export function yourTurnForms(script, lang = "hinglish") {
  return (script?.joints?.yourTurn ?? []).map((f) => (typeof f === "string" ? f : lang === "english" ? f?.en ?? f?.hi : f?.hi ?? f?.en)).filter((x) => typeof x === "string" && x.trim()).map((x) => x.replace(/\s+/g, " ").trim());
}
/** Whether a text ends on one of the script's yourTurn forms (either language). */
export function endsOnYourTurn(script, text) {
  const last = qKey(sentencesOf(text).at(-1) ?? "");
  if (!last) return false;
  return [...yourTurnForms(script, "hinglish"), ...yourTurnForms(script, "english")].some((f) => { const k = qKey(sentencesOf(f).at(-1) ?? f); return !!k && k === last; });
}
// to-brain 051 C4 (the cap counts what the child hears): a turn is "at" a question when it ends on any form the script writes for it —
// a closing question, or the form's last sentence when the form asks by an imperative ("… order mein lagao.") — or on a short ask, which is
// the pending question's.
/** Code's short asks (brain/say.js MISS_AGAIN_ASK), both languages: the script's own `joints.missAgainAsk` forms are read beside them. */
export const SHORT_ASK_FORMS = ["Ab phir se socho, jawab kya hoga?", "Toh ab batao, kya aayega?", "Ab ek baar aur try karo: kya jawab hai?",
  "Think again, what's the answer?", "So now, what do you get?", "Try once more: what's the answer?"];
const CACHE_LAST = new WeakMap();
/** The last sentences of the script's question forms that end on no "?" (four words at least) → path: Map<key, path>. */
function lastSentencePaths(script) {
  if (!script || typeof script !== "object") return new Map();
  const hit = CACHE_LAST.get(script);
  if (hit) return hit;
  const out = new Map();
  const walk = (o, path) => {
    if (Array.isArray(o)) return o.forEach((x, n) => walk(x, `${path}[${n}]`));
    if (!o || typeof o !== "object") return;
    if (o.prompt) for (const f of ["prompt", "reask", "hindi"]) for (const t of formsOf(o[f])) {
      const s = sentencesOf(t).at(-1) ?? "";
      if (!s || /[?？]\s*$/.test(s) || /\{\w+\}/.test(s)) continue;
      const k = qKey(s);
      if (k.split(" ").length >= 4 && !out.has(k)) out.set(k, path);
    }
    for (const [k, v] of Object.entries(o)) if (v && typeof v === "object") walk(v, `${path}.${k}`);
  };
  walk(script, "");
  CACHE_LAST.set(script, out);
  return out;
}
/** Whether a text ends on a short ask (code's or the script's `joints.missAgainAsk`). */
export function endsOnShortAsk(script, text) {
  const last = qKey(sentencesOf(text).at(-1) ?? "");
  if (!last) return false;
  const own = (script?.joints?.missAgainAsk ?? []).flatMap((f) => (typeof f === "string" ? [f] : [f?.hi, f?.en])).filter((x) => typeof x === "string");
  return [...SHORT_ASK_FORMS, ...own].some((f) => qKey(sentencesOf(f).at(-1) ?? f) === last);
}
/** C4: the question a text is at — its path, "?short" for a short ask (the pending question's), or null. An invitation is at none. */
export function atQuestionOf(script, text) {
  if (!String(text ?? "").trim() || endsOnYourTurn(script, text)) return null;
  const p = questionPathOf(script, text);
  if (p) return p;
  if (endsOnShortAsk(script, text)) return "?short";
  return lastSentencePaths(script).get(qKey(sentencesOf(text).at(-1) ?? "")) ?? null;
}
/** Whether the third of three turns may end on a yourTurn form: the two teacher texts before it were at one question by C4's count (a short
 *  ask is the pending question's; `pending`, when given, must be that question) → its path, or null. */
export function runOfTwo(script, before2, pending = null) {
  if (before2.length < 2) return null;
  const a = atQuestionOf(script, before2[0]), b = atQuestionOf(script, before2[1]);
  if (!a || !b) return null;
  const named = [a, b].filter((x) => x !== "?short");
  const path = named[0] ?? pending ?? "?short";
  return named.every((x) => x === path) && (!pending || path === pending) ? path : null;
}

/** to-brain 051 C4: whether her turn parks an aside or replies to one (the walk's column, a park added, her aside acknowledgement, a return). */
function asideTurnOf(prev, out, lm) {
  if (["aside", "aside_reply"].includes(String(lm.cell?.column ?? ""))) return true;
  if ((out?.state?.later?.length ?? 0) > (prev?.later?.length ?? 0)) return true;
  return !!(lm.asideAck || lm.returnReply || lm.returned);
}
/** to-brain 051 C4: whether her turn has help in it — a wording (a hint, the easier wording, a remediation's), help's joint, the part's Hindi
 *  form for a language request, a picture. */
function helpIn(lm) {
  return !!(lm.simpler || lm.helpJoint || lm.hindiForm || lm.scriptBeat?.kind === "remediation" || lm.cell?.column === "picture"
    || (lm.renderedKinds ?? []).some((k) => ["help", "simpler", "remediation"].includes(k))
    || lm.help?.request === "picture" || lm.picture || lm.pictureCaption || lm.visual);
}
/** A child's request to hear the question again (brain/say.js askedForIt's words). */
export const HEAR_Q = /(?<![\p{L}])(?:phir\s+se|fir\s+se|dobara|repeat|kya\s+bola|kya\s+kaha|sawaal\s+kya|kaunsa\s+sawaal|which|again)(?![\p{L}])/iu;
const B4_FIELDS = ["yourTurn", "yourTurnAfter", "askNot", "answerFirst", "waitShort", "waitReask", "pointHelpReask"];
/** to-brain 052 B4 (ruling): code's pointed invitations, said where the script has no `joints.answerFirst` (rotated). */
export const ANSWER_FIRST_FORMS = Object.freeze([{ hi: "Pehle is sawaal ka jawab do.", en: "First answer this question." },
  { hi: "Board wala sawaal abhi baaki hai, uska jawab do.", en: "The question on the board is still open, answer it." },
  { hi: "Yeh baad mein; pehle sawaal ka jawab.", en: "That's for later; first the answer to the question." }]);
/** B4: the pointed invitation forms of a lesson language — the script's `joints.answerFirst`, else code's. */
export function answerFirstForms(script, lang = "hinglish") {
  const own = (script?.joints?.answerFirst ?? []).map((f) => (typeof f === "string" ? f : lang === "english" ? f?.en ?? f?.hi : f?.hi ?? f?.en)).filter((x) => typeof x === "string" && x.trim());
  return (own.length ? own : ANSWER_FIRST_FORMS.map((f) => (lang === "english" ? f.en : f.hi))).map((x) => x.replace(/\s+/g, " ").trim());
}
/** B4: whether a text ends on a pointed invitation (the script's or code's, either language). */
export function endsOnAnswerFirst(script, text) {
  const last = qKey(sentencesOf(text).at(-1) ?? "");
  return !!last && [...answerFirstForms(script, "hinglish"), ...answerFirstForms(script, "english")].some((f) => qKey(sentencesOf(f).at(-1) ?? f) === last);
}
/** B4: how many of her turns running, the latest first, were at one question — said (any form, a short ask), or answered by an invitation
 *  that points at it or asks nothing (yourTurn, answerFirst). */
export function turnsAtQuestion(script, texts, path) {
  let n = 0;
  for (let j = texts.length - 1; j >= 0; j--) {
    const t = texts[j], a = atQuestionOf(script, t);
    if (a === path || a === "?short" || endsOnYourTurn(script, t) || endsOnAnswerFirst(script, t)) n++; else break;
  }
  return n;
}
/** RULING-C2 item 1 (main's R2: a short ask or an invitation is no hearing): of the turns `turnsAtQuestion` counts, how many said the
 *  question itself (any form the script writes for it). */
export function hearingsInRun(script, texts, path) {
  let n = 0;
  for (let j = texts.length - 1; j >= 0; j--) {
    const t = texts[j], a = atQuestionOf(script, t);
    if (a === path) n++;
    else if (!(a === "?short" || endsOnYourTurn(script, t) || endsOnAnswerFirst(script, t))) break;
  }
  return n;
}
const dropB4 =(m) => { if (!m || typeof m !== "object") return m; const o = { ...m }; for (const k of B4_FIELDS) delete o[k]; return o; };
/** The walk's B4 pass over one turn (state.js step, last): the turn's move is marked
 *  - `yourTurn` (the form, rotated) on the third turn running at one question — brain/say.js ends the turn on it in place of the question;
 *    `yourTurnAfter` keeps the question sentence said last, and an asked step keeps the wording said last (so the fourth turn's
 *    stepAskAgain takes the other);
 *  - `askNot` on the turn after an invitation, at the same question: the sentence said before the invitation, which brain/say.js's
 *    re-ask rotation reads as her turn before's question (no sentence is said two question-turns running).
 *  The fields never carry from one move to the next (help builds its move from the last one). → out, changed in place. */
/** d37 RULING-G item 7: the move's help is the point's wording (its pointAlt or simpler) said at a card — the question at `path` a card's. */
const pointHelpAtCard = (lm, path) => ["pointAlt", "simpler"].includes(String(lm?.help?.rung ?? "")) && /\.ask$/.test(String(path ?? "")) && /:card$/.test(String(lm?.cell?.part ?? lm?.help?.part ?? ""));
export function yourTurnPass(prev, out, script, childText = "") {
  const s = out?.state;
  if (!s?.lastMove || !script) return out;
  s.lastMove = dropB4(s.lastMove);
  if (out.move) out.move = dropB4(out.move);
  const lm = s.lastMove;
  // (which of her last two turns answered a request for Hindi with the part's form: such a turn is no turn of a run, read or made)
  // (and a request to hear the question — "sawaal kya hai?", "phir se bolo" — is answered with it: an invitation is no answer to it)
  const exempt = !!(lm.hindiForm || lm.help?.hindiForm) || HEAR_Q.test(String(childText ?? ""));
  const hiPrev = prev?.b4Hindi ?? [false, false];
  s.b4Hindi = [!!hiPrev[1], exempt];
  const pl0 = prev?.lastMove ?? {};
  // (an invitation counts — for the rotation and for the turn after it — only where her turn said it: brain/say.js may have ended it otherwise)
  const lastText = String((prev?.recent ?? []).filter((t) => t.who === "teacher").at(-1)?.text ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const saidInv = !!pl0.yourTurn && lastText.endsWith(String(pl0.yourTurn).replace(/\s+/g, " ").trim().toLowerCase().replace(/[.!?]+$/, "") + ".");
  if (saidInv) s.yourTurnN = (prev?.yourTurnN ?? 0) + 1;
  const set = (f) => { Object.assign(s.lastMove, f); if (out.move) Object.assign(out.move, f); };
  // (to-brain 053 B2 — director34 c4 steady 26 to 30, c4-ch01-t02 steady 26 to 30, c5-t03 steering 16 to 20, c5-t02 stuck 22, offtopic 24:
  // after "Haan, pehle tum try karo." and after a bare "haan", "yes", "theek hai" at a card or an asked step whose question her turn before
  // said (or stood for, by a short ask or an invitation), she does not say the question whole again: she waits — the short ask on the first
  // such turn (`waitShort`, brain/say.js), the invitation on the next. They are turns at the question: the third running is the invitation
  // whatever it is)
  // (to-brain 054 B, director35 item 3 as ruled — director36 c4 steady 28 to 48, eleven turns of "Ab phir se socho" and "Ab tumhara jawab
  // sunti hoon": the wait is counted at its question (state.js waitOf, the move's waitN; a side-topic in it neither restarts nor advances
  // the count). Wait one is the short ask or the invitation, as built below; wait two says the question's own `reask` — a hearing, and it
  // overrides 049 B4's third-turn invitation (main's ruling on question 3); wait three and after is help as for a give-up, ending on the
  // question (state.js reads the turn as a give-up): no invitation in its place, and the fifth hearing is the cap as built)
  if (lm.waitN >= 2 && lm.waitP) {
    // (at an asked step the move's prompt becomes the reask said, so the next turn's stepAskAgain takes the other wording: 049 B1)
    // (RULING-B3: where the turn that last said the question ended on its reask, wait two is read as a give-up — state.js waitOf's
    // `reaskHeard`, the move's waitGive — and says no reask again)
    if (lm.waitN === 2 && !lm.waitGive) {
      const t = reaskOf(script, lm.waitP, s.ctx?.lang === "english" ? "english" : "hinglish");
      if (t) set({ waitReask: t, ...(lm.stepAsk?.prompt && !lm.splitClose ? { stepAsk: { ...lm.stepAsk, prompt: fillFriend(t, s.ctx?.firstName ?? "") } } : {}) });
    }
    return out;
  }
  { const col = String(lm.cell?.column ?? "");
    const qT = lm.stepAsk?.prompt && !lm.splitClose ? lm.stepAsk.prompt : out.ui?.ask?.text ?? null;
    const a0 = (col === "try_first" || col === "yes") && qT && lm.kind !== "teachback" ? atQuestionOf(script, qT) : null;
    const P = a0 && a0 !== "?short" ? a0 : null;
    const her = (prev?.recent ?? []).filter((t) => t.who === "teacher").map((t) => String(t.text ?? ""));
    const last = her.at(-1) ?? "";
    const aL = P ? atQuestionOf(script, last) : null;
    if (P && (aL === P || aL === "?short" || endsOnYourTurn(script, last) || endsOnAnswerFirst(script, last))) {
      const lang = s.ctx?.lang === "english" ? "english" : "hinglish";
      const forms = yourTurnForms(script, lang);
      const second = !!pl0.waitShort || endsOnShortAsk(script, last) || runOfTwo(script, her.slice(-2), P) === P;
      if (second && forms.length && !endsOnYourTurn(script, last)) {
        const n = s.yourTurnN ?? 0;
        set({ yourTurn: forms[n % forms.length], yourTurnAfter: closingQuestion(last) ?? closingQuestion(qT) });
      } else set({ waitShort: true });
      return out;
    }
  }
  // (the turn after a said invitation, at the same question, whatever it answers: the question said before the invitation is not said again)
  // (the closing question — the teach-back — is said by the walk itself, the last of its rendered lines: the invitation and the other form
  // are put there)
  const tbQ = lm.kind === "teachback" && lm.authoredEnd === "teachback" && Array.isArray(lm.rendered) && lm.rendered.length ? String(lm.rendered.at(-1)) : null;
  const tbSet = (line, kind) => set({ rendered: [...lm.rendered.slice(0, -1), line], renderedKinds: [...(lm.renderedKinds ?? lm.rendered.map(() => null)).slice(0, lm.rendered.length - 1), kind] });
  if (saidInv && pl0.yourTurnAfter && tbQ) {
    const k = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase().replace(/[.!?]+$/, "");
    if (questionPathOf(script, tbQ) === questionPathOf(script, pl0.yourTurnAfter) && k(closingQuestion(tbQ)) === k(pl0.yourTurnAfter)) {
      const tb = script.teachback ?? {};
      const L = s.ctx?.lang === "english" ? "en" : "hi";
      const other = [tb.prompt, tb.reask].map((x) => (x && typeof x === "object" ? x[L] ?? x.hi ?? x.en : x)).filter((x) => typeof x === "string" && x.trim()).map((x) => x.replace(/\s+/g, " ").trim())
        .find((x) => k(closingQuestion(x)) !== k(pl0.yourTurnAfter));
      if (other) tbSet(other, "closingQuestion");
    }
    return out;
  }
  // (an aside turn after the invitation is no answer to it: 052 B4's pointed invitation, below — B2's wait turns are turns at the question,
  // so dry steady c4 32 and c4-ch01-t02 32, an aside after try-first, the short ask and the invitation, said the question a fourth time)
  if (saidInv && pl0.yourTurnAfter && !asideTurnOf(prev, out, lm)) {
    const nowText0 = lm.stepAsk?.prompt && !lm.splitClose ? lm.stepAsk.prompt : out.ui?.ask?.text ?? null;
    const a0 = nowText0 ? atQuestionOf(script, nowText0) : null, p0 = a0 && a0 !== "?short" ? a0 : null;
    if (p0 && questionPathOf(script, pl0.yourTurnAfter) === p0) set({ askNot: pl0.yourTurnAfter });
    return out;
  }
  // (to-brain 051 C4: the cap counts what the child hears — a request for Hindi answered with the part's `hindi` form is a turn of the run, and
  // the third such turn ends on the invitation after the form (brain/say.js says the form, then the invitation); a request to hear the question
  // gets it, and counts. The invitation is never said in a turn that parks an aside or replies to one, nor in a turn with no help in it: that
  // turn ends on the question, and counts)
  // (to-brain 052 close, main's ruling: the card's Hindi form said in answer to the child's request for Hindi ends the turn — the child asked
  // for the question in Hindi, and B4 says the question comes back when the child asks for it — so no invitation follows it, whatever the
  // count; the turn still counts as one at that question for what follows. A card with no Hindi form is as built. Eleven dry rows said
  // "… Aise kone ginkar batao? Ab tum batao.", stuck c4-ch01-t02 8)
  if (lm.hindiForm) return out;
  if (HEAR_Q.test(String(childText ?? "")) || lm.stayCheckin || lm.greetAsk || ["wrap", "safeguard", "break", "done"].includes(String(lm.kind ?? ""))) return out;
  // (to-brain 052 B4, ruling: on the third turn running at one question or later, a turn that parks an aside or replies to one does not say the
  // question again and does not end on the bare "Ab tum batao.": it ends on an invitation that points at the question still open —
  // joints.answerFirst, else code's forms, rotated. The question comes back when the child answers it, asks for it, or asks for help.
  // Staged offtopic c4-ch01-t02 rows 10 to 18, before the merge: one question five turns running while asides were parked and answered)
  if (asideTurnOf(prev, out, lm)) {
    const qText = tbQ ?? (lm.stepAsk?.prompt && !lm.splitClose ? lm.stepAsk.prompt : out.ui?.ask?.text ?? null);
    const a1 = qText ? atQuestionOf(script, qText) : null, p1 = a1 && a1 !== "?short" ? a1 : null;
    const her1 = (prev?.recent ?? []).filter((t) => t.who === "teacher").map((t) => String(t.text ?? ""));
    // (d35 follow-up 4: the closing question too — graded as a card since 052 B2, its aside parked as a card's: the invitation is put in the
    // question's place among the walk's rendered lines)
    // (to-brain 054 C, step 0 — the as-heard read of cause B, walk 11: a side-topic raised straight after her short ask or her invitation
    // (her turn before at the question said no question) gets a park that ends on the question — the park, its joint and the question's
    // reask, as a park does when the side-topic comes first — never the pointed invitation alone: never two turns running with no question)
    // (main's second ruling on cause C, item 1: only where the question has been heard once since it was posed — the park's re-ask is then
    // its second hearing, a short ask or an invitation being none; with two or more hearings the park ends on 049 B4's pointed invitation)
    const lastNoQ = her1.length > 0 && atQuestionOf(script, her1.at(-1)) !== p1 && (endsOnShortAsk(script, her1.at(-1)) || endsOnYourTurn(script, her1.at(-1)))
      && hearingsInRun(script, her1, p1) < 2;
    if (p1 && (!tbQ || lm.endAside) && !lastNoQ && turnsAtQuestion(script, her1, p1) >= 2) {
      const forms = answerFirstForms(script, s.ctx?.lang === "english" ? "english" : "hinglish");
      const n = s.answerFirstN ?? 0;
      s.answerFirstN = n + 1;
      if (tbQ) { if (forms.length) tbSet(forms[n % forms.length], "answerFirst"); }
      else set({ answerFirst: forms[n % forms.length] });
    }
    return out;
  }
  if (!helpIn(lm)) return out;
  const nowText = tbQ ?? (lm.stepAsk?.prompt && !lm.splitClose ? lm.stepAsk.prompt : out.ui?.ask?.text ?? null);
  // (to-brain 051 C4: a card that asks by an imperative is a question too)
  const at0 = nowText ? atQuestionOf(script, nowText) : null;
  const nowPath = at0 && at0 !== "?short" ? at0 : null;
  if (!nowPath) return out;
  // (the turn after a said invitation asks the question again: never a second invitation)
  if (saidInv) return out;
  const lang = s.ctx?.lang === "english" ? "english" : "hinglish";
  const forms = yourTurnForms(script, lang);
  if (!forms.length) return out;
  const her = (prev?.recent ?? []).filter((t) => t.who === "teacher").map((t) => String(t.text ?? "")).slice(-2);
  // (to-brain 051 C4: her two turns before at this question by what the child heard — a Hindi turn, a short ask, a card that asks by an
  // imperative, a picture turn, an aside reply that came back to it)
  void hiPrev;
  if (runOfTwo(script, her, nowPath) !== nowPath) return out;
  // (d37 RULING-G item 7, stuck c5-ch02-t01 12, c5-ch02-t02 12, c5-ch02-t03 12: help at a card said in its POINT's wording — the point's
  // pointAlt or simpler, help.js's card ladder past the card's own simpler — teaches again, and the question it was taught for is asked
  // after it: the turn ends on the card's own `reask` (brain/say.js puts it in the card's place, as a wait's second hearing), never on the
  // invitation. The evals' questionThreeRunning and yourTurnNotThird allow exactly this turn: pointHelpReaskAt)
  // (where her turn before already ended on that reask — RULING-B3's help — the reask is not said twice running: the turn ends on the card
  // as posed, its own question, as a help turn does; reaskSameAfterHelp)
  if (pointHelpAtCard(lm, nowPath) && !tbQ) {
    const t = reaskOf(script, nowPath, lang);
    if (t && endsOnReaskOf(script, nowPath, her.at(-1) ?? "")) { set({ pointHelpReask: true }); return out; }
    if (t) { set({ waitReask: t, pointHelpReask: true }); return out; }
  }
  const n = s.yourTurnN ?? 0;
  set({ yourTurn: forms[n % forms.length], yourTurnAfter: closingQuestion(her[1]) });
  if (tbQ) tbSet(forms[n % forms.length], "yourTurn");
  if (lm.stepAsk && pl0.stepAsk && pl0.stepAsk.skillId === lm.stepAsk.skillId && pl0.stepAsk.step === lm.stepAsk.step) set({ stepAsk: { ...lm.stepAsk, prompt: pl0.stepAsk.prompt } });
  return out;
}
