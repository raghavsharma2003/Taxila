// to-brain 054 B (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, B.5; main's ruling on question 3): a wait says the
// question. Registered in dry-predicates.mjs after d37a; both gated (tests/r8-d37-054b.test.mjs pins each on made rows).
//   waitNoQuestion      (RULING-B5: two, was three) of her turns at one question after a try-first or a bare yes (the wait: her turns whose child line was
//                       "Haan, pehle tum try karo."'s cue or a bare yes — cell column try_first or yes — at the question her turn before
//                       was at, or her turn that ended on a short ask or an invitation, counted as wait one), neither saying the question (any form the script writes for it) or help. A side-topic's turn in
//                       the wait is passed over: it neither restarts nor advances the wait (052 B4). director36 c4 steady 28 to 48.
//   waitFourNotTold     (RULING-B5, gated) the wait's fourth turn is not the cap: the step told or the key.
//   waitSecondNotReask  the wait's second turn does not end on the question's own `reask` (RULING-B3: allowed where the turn that last
//                       said the question before the wait ended on that reask and wait two is help — what wait three is).
// And B.4's re-pins, by name, for exactly the turns main's ruling on question 3 names (read as before everywhere else):
//   questionThreeRunning  (049 B4, d34c's reading) the wait's re-ask is no turn of a run: the run counts from the turn after it
//   stepToldEarly         (d30, gated) the cap's turn at a wait — a step told on the fifth hearing after a try-first or a bare yes — is allowed
// And main's second ruling on cause B (round d37, RULING-B2), by name:
//   cardWholeAfterTryOrYes  (053 B2, gated) still flags any full form of the question on the wait's first turn (her turn before said the
//                       question itself) and the card or step said whole as first written on ANY wait turn; from the wait's second turn on
//                       (her turn before was the short ask, the invitation, or an earlier turn of this same wait) the question's `reask`
//                       alone and a help turn ending on the question are allowed (a help turn whatever form of the question it ends on: a
//                       give-up's help at a card ends on the card's own ask, which is the card whole where the ask is the card's sentences)
//   stepToldEarly       also allows the step told on a wait's third-or-later turn where the give-up path had nothing left unsaid (the
//                       step's own simpler said before the turn, as help.js reads an asked step's give-up)
import { atQuestionOf, endsOnYourTurn, endsOnAnswerFirst, reaskOf, closingQuestion, questionObjectAt, endsOnReaskOf, hearingsInRun } from "../../server/director/question-run.js";
import { asideTurn, helpTurn } from "./d34b-predicates.mjs";
import { D34C_PREDICATES } from "./d34c-predicates.mjs";
import { D30_PREDICATES, heardBefore } from "./d30-predicates.mjs";
import { D35A_PREDICATES } from "./d35a-predicates.mjs";
import { helpPart, ladderOf, sentencesOf as helpSentences, normSentence } from "../../server/director/help.js";
import { saidIn } from "../../server/director/script.js";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
/** d38 RULING-A7 P3: the seams her turn opens on when it answers a side-topic. */
const SIDE_FIRST = new Set(["asideReply", "aiReply", "aiLine", "park", "aside"]);
const SLOT = "zzslotzz";
const qKey = (t) => low(String(t ?? "").replace(/\{\w+\}/g, ` ${SLOT} `)).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
/** A wait turn's cue: the child's line before it read try-first or a bare yes. */
const waitCue = (r) => ["try_first", "yes"].includes(String(r?.cell?.column ?? ""));
/** Main's sixth ruling on cause B, item 1: a try-first is a request, answered as one ("Haan, pehle tum try karo."), never a turn of a wait;
 *  the wait's count goes on from the turns before and after it (state.js waitOf). Her turn on a try-first is passed over, as a side-topic's. */
const tryCue = (r) => String(r?.cell?.column ?? "") === "try_first";
/** Whether her turn at row k, on a try-first, is passed over inside a wait: it stands for the question (a short ask or an invitation after
 *  the go-ahead), or it is the go-ahead alone at a card held for the try with a wait turn before it (the count goes on, waitOf's goAhead). */
function tryPassed(L, k, script) {
  if (!tryCue(L.rows[k])) return false;
  let b = prevTeacher(L, k);
  while (b >= 0 && ((asideTurn(L.rows[b]) && !waitCue(L.rows[b])) || tryCue(L.rows[b]))) b = prevTeacher(L, b);
  return b >= 0 && waitCue(L.rows[b]) && !seamsOf(L.rows[b]).some((x) => ENDS.has(x)) && !L.rows[b].heardCap;
}
/** Seams that end a question: its key or its told step (the cap, or help spent). */
const ENDS = new Set(["key", "workedStep"]);
const seamsOf = (r) => (r?.seams ?? []).map((x) => x.right);
const prevTeacher = (L, i) => { for (let j = i - 1; j >= 0; j--) if (L.rows[j].who === "teacher") return j; return -1; };
/** Whether a teacher text stands for a question without saying it (a short ask, an invitation, a pointed invitation). */
const standsFor = (script, t) => atQuestionOf(script, t) === "?short" || endsOnYourTurn(script, t) || endsOnAnswerFirst(script, t);

/** Whether a teacher text stands for a question without saying it. */
const standsForOnly = (script, t) => standsFor(script, t) && [null, "?short"].includes(atQuestionOf(script, t));
/** Whether teacher row j poses its question: it says a question the turn before it (a side-topic's turn passed over) neither said nor stood
 *  for, and that turn is no wait turn — a card or step asked after a bare yes (a check-in's "haan") is where its wait starts, not one of its
 *  turns (RULING-B2 walks: the lesson's first card, asked on the greeting's "haan"). */
function posesAt(L, j, script) {
  const a = atQuestionOf(script, L.rows[j].text);
  if (!a || a === "?short") return false;
  let k = prevTeacher(L, j);
  while (k >= 0 && ((asideTurn(L.rows[k]) && !waitCue(L.rows[k])) || tryPassed(L, k, script))) k = prevTeacher(L, k);
  if (k < 0) return true;
  const t = L.rows[k].text;
  // (main's sixth ruling, item 6 — pr3's C: a yes-cued turn before it is a wait turn only where it did not end its wait — no key, no told step,
  // no cap: a card posed on the "haan" after a wait's key starts a wait of its own, so two questions' waits back to back are each read. A
  // try-first's turn is no wait turn: item 1)
  const y = L.rows[k];
  const inWait = waitCue(y) && !tryCue(y) && !(y.stepAnswer?.told || seamsOf(y).some((x) => ENDS.has(x)) || y.heardCap);
  return !(atQuestionOf(script, t) === a || standsFor(script, t) || inWait);
}
/** The wait whose turns end at row i: { P, turns } — P the question's path (the last her turns said before the wait), turns the wait's
 *  teacher rows in order (side-topic turns passed over) — or null where row i is no wait turn. */
export function waitAt(L, i, script) {
  const r = L.rows[i];
  // (sixth ruling, item 1: her turn on a try-first is no wait turn; a turn that poses its question afresh is where a wait starts, not one of its
  // turns — after the go-ahead alone at a card held for the try, with no wait before it, the card said again is no wait turn: waitOf's)
  if (!script || r?.who !== "teacher" || !waitCue(r) || tryCue(r) || posesAt(L, i, script)) return null;
  const turns = [i];
  let j = prevTeacher(L, i);
  for (; j >= 0; j = prevTeacher(L, j)) {
    const y = L.rows[j];
    if (waitCue(y) && !tryCue(y) && !seamsOf(y).some((k) => ENDS.has(k)) && !posesAt(L, j, script)) { turns.unshift(j); continue; }
    if (asideTurn(y) && !waitCue(y)) continue;
    // (sixth ruling, item 1: a try-first's turn is passed over — the count goes on from the turns before and after it)
    if (tryCue(y)) continue;
    break;
  }
  // (the question: the last her turns said at or before the turn before the wait — a short ask or an invitation stands for it)
  let P = null;
  for (let k = j; k >= 0; k = prevTeacher(L, k)) {
    const t = L.rows[k].text, a = atQuestionOf(script, t);
    if (a && a !== "?short") { P = a; break; }
    if (!(standsFor(script, t) || asideTurn(L.rows[k]))) break;
  }
  if (!P) return null;
  // (a wait turn at another question ends the wait before it: the wait is at one question)
  let from = 0;
  turns.forEach((n, m) => { const a = atQuestionOf(script, L.rows[n].text); if (a && a !== "?short" && a !== P) from = m + 1; });
  const at = turns.slice(from);
  // (RULING-B5 item 1: a wait is counted from her turns — her turn before the child's first cue, where it ended on a short ask or an
  // invitation without saying the question (a help turn that ended on "Ab tum batao.", 049 B4's third-turn invitation), is wait one)
  // (sixth ruling, item 1: her turn on a try-first right before the wait's first turn, where it stands for the question without saying it, is
  // that wait one — waitOf reads her last turn — and is no wait turn itself)
  // (main's sixth ruling, item 8 — pr3's E: and so is a side-topic's park right before it, ending on the pointed invitation: waitOf counts it as
  // wait one, so waitAt does — dry4 steady c6-ch07-t01 40)
  const k0 = at.length ? prevTeacher(L, at[0]) : -1;
  const tryOne = !from && k0 >= 0 && (tryCue(L.rows[k0]) || (asideTurn(L.rows[k0]) && !waitCue(L.rows[k0]))) && standsForOnly(script, L.rows[k0].text);
  if (tryOne) at.unshift(k0);
  else if (!from && at.length && j >= 0 && !waitCue(L.rows[j]) && standsFor(script, L.rows[j].text) && [null, "?short"].includes(atQuestionOf(script, L.rows[j].text))) at.unshift(j);
  return at.length && at.at(-1) === i ? { P, turns: at } : null;
}
/** Whether row i is the wait's re-ask: the wait's second turn, ending on the question's own `reask`. */
const waitReaskAt = (L, i, ctx) => { const w = waitAt(L, i, ctx?.script); return !!w && w.turns.length === 2 && D37B_PREDICATES.waitSecondNotReask(L, L.rows[i], i, ctx) === null; };
/** RULING-C2 item 1: whether row i is a side-topic's park that ends on its question's own `reask` where that question was heard once since it
 *  was posed and her turn before said no question (a short ask or an invitation, no hearing: main's R2) — the question's second hearing. */
function parkReaskAt(L, i, script) {
  const r = L.rows[i];
  if (!script || r?.who !== "teacher" || !asideTurn(r) || waitCue(r)) return false;
  const P = atQuestionOf(script, r.text);
  if (!P || P === "?short" || !endsOnReask(script, P, r.text)) return false;
  const j = prevTeacher(L, i);
  if (j < 0 || !standsForOnly(script, L.rows[j].text) || stoodFor(L, j, script) !== P) return false;
  const her = L.rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => String(x.text ?? ""));
  return hearingsInRun(script, her, P) < 2;
}
export { parkReaskAt };
/** Whether a text ends on the question's own `reask` (its closing question, {slots} matching any words). */
function endsOnReask(script, P, text, lang = "hinglish") {
  const reask = reaskOf(script, P, lang);
  if (!reask) return false;
  const want = qKey(closingQuestion(reask) ?? sentencesOf(reask).at(-1) ?? "");
  const got = qKey(closingQuestion(text) ?? sentencesOf(text).at(-1) ?? "");
  const re = new RegExp(`^${want.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")}$`, "u");
  return !!want && re.test(got);
}
/** Whether a text says the card or step whole as first written: every sentence of the question's `prompt` (hi or en), in order, where the
 *  prompt is more than its closing question (a one-sentence prompt is the question itself: a help turn may end on it). */
function saysWholeAsWritten(script, P, text) {
  const pr = questionObjectAt(script, P)?.prompt;
  const T = qKey(text);
  return [pr?.hi, pr?.en, typeof pr === "string" ? pr : null].filter((x) => typeof x === "string" && x.trim()).some((f) => {
    const s = sentencesOf(f).map(qKey).filter(Boolean);
    if (s.length < 2) return false;
    const re = new RegExp(s.map((k) => k.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")).join(" (?:.* )?"), "u");
    return re.test(T);
  });
}
/** Whether a teacher row says the question (any form the script writes for it) or help. */
const saysOrHelps = (script, r, P) => atQuestionOf(script, r.text) === P || helpTurn(r);

/** A wait turn's place in its wait (1, 2, …), or 0. A turn that ends the wait by telling the step or keying the card ends on the next
 *  question, so waitAt does not read it: its place is one more than the wait turn before it (a side-topic's turn passed over). */
function waitPlace(L, i, script) { return waitRowOf(L, i, script)?.n ?? 0; }
/** waitPlace with the wait: { n, P, first } (first: the wait's first turn's row), or null. */
function waitRowOf(L, i, script) {
  const w = waitAt(L, i, script);
  if (w) return { n: w.turns.length, P: w.P, first: w.turns[0] };
  // (only a turn that ends the wait — the step told or the key — is read by the turn before it: a turn after it starts afresh)
  const r = L.rows[i];
  if (!waitCue(r) || tryCue(r) || !(r.stepAnswer?.told || seamsOf(r).some((k) => ENDS.has(k)))) return null;
  let j = prevTeacher(L, i);
  const k0 = j;
  while (j >= 0 && ((asideTurn(L.rows[j]) && !waitCue(L.rows[j])) || tryPassed(L, j, script))) j = prevTeacher(L, j);
  // (sixth ruling, item 1: her turn on a try-first that stands for the question with no wait before it is wait one — waitOf's stand-in)
  if (j >= 0 && tryCue(L.rows[j])) {
    const P0 = standsFor(script, L.rows[j].text) && [null, "?short"].includes(atQuestionOf(script, L.rows[j].text)) ? stoodFor(L, j, script) : null;
    return P0 ? { n: 2, P: P0, first: j } : null;
  }
  const p = j >= 0 ? waitAt(L, j, script) : null;
  if (p) return { n: p.turns.length + 1, P: p.P, first: p.turns[0] };
  // (sixth ruling, item 8: a side-topic's park right before it, ending on the pointed invitation with no wait before it, is wait one)
  if (k0 >= 0 && asideTurn(L.rows[k0]) && !waitCue(L.rows[k0]) && standsForOnly(script, L.rows[k0].text)) { const P0 = stoodFor(L, k0, script); return P0 ? { n: 2, P: P0, first: k0 } : null; }
  return null;
}
/** The question a short ask or an invitation at row j stands for: the last her turns said before it (a side-topic's turn, another short ask
 *  or invitation passed over), or null. */
function stoodFor(L, j, script) {
  for (let k = prevTeacher(L, j); k >= 0; k = prevTeacher(L, k)) {
    const t = L.rows[k].text, a = atQuestionOf(script, t);
    if (a && a !== "?short") return a;
    if (!(standsFor(script, t) || asideTurn(L.rows[k]))) return null;
  }
  return null;
}
/** RULING-B3: whether the turn that last said the wait's question before the wait (row `first`) ended on the question's own `reask`. */
function reaskHeardBefore(L, first, script, P) {
  for (let k = prevTeacher(L, first); k >= 0; k = prevTeacher(L, k)) if (atQuestionOf(script, L.rows[k].text) === P) return endsOnReaskOf(script, P, L.rows[k].text);
  return false;
}
/** Whether the give-up path at a told step's row had nothing left unsaid, as help.js pickHelp reads an asked step (dc-r8-director29 P3): the
 *  step's own simpler, its first rung, said before row i (any sentence of it), or the step has none. */
function stepHelpSpent(L, r, i, script) {
  const part = (() => { try { return helpPart(script, String(r.stepAnswer?.beat ?? "")); } catch { return null; } })();
  if (!part || part.kind !== "worked_step") return false;
  const r0 = (() => { try { return ladderOf(script, part)[0]; } catch { return null; } })();
  const t = r0?.field === "simpler" ? saidIn(r0.value, "hinglish") : null;
  if (!t || !String(t).trim()) return true;
  const said = new Set();
  for (const x of L.rows.slice(0, i)) if (x.who === "teacher") for (const s of helpSentences(x.text)) { const k = normSentence(s); if (k) said.add(k); }
  return helpSentences(t).some((s) => said.has(normSentence(s)));
}

export const D37B_PREDICATES = {
  /** d37 close item 2 (pr3b's A, the gap older than the round): after her turn that stood for a question without saying it (a short ask or an
   *  invitation), the next turn says a DIFFERENT card's or step's question with no told step, no key and no cap for the first one — the
   *  first card dropped unanswered. The child's line between read right ends the first question, as a verdict does; a miss read there and
   *  the remediation's own question after its verdict is the first question's miss path; a safety, stop or wrap turn is not read. Gated. */
  cardDroppedAfterShortAsk(L, r, i, ctx) {
    const script = ctx.script;
    if (!script || r.who !== "teacher" || !ctx.prevT || ["safeguard", "break", "wrap"].includes(String(r.move ?? ""))) return null;
    // (d37 G3, BRIEF-G item 10: read at the next turn of hers that is not a park or a reply to a side-topic — her turns of that kind between
    // the short ask and this one are passed over, never only the turn right after it)
    let j = prevTeacher(L, i);
    while (j >= 0 && asideTurn(L.rows[j]) && !standsForOnly(script, L.rows[j].text)) j = prevTeacher(L, j);
    if (j < 0 || !standsForOnly(script, L.rows[j].text)) return null;
    if (j !== prevTeacher(L, i) && asideTurn(r)) return null;
    const P0 = stoodFor(L, j, script);
    const P = atQuestionOf(script, r.text);
    if (!P0 || !P || P === "?short" || P === P0) return null;
    // (the passed-over turns said nothing of the first question's end: a key or a told step there ends it)
    if (L.rows.slice(j + 1, i).some((x) => x.who === "teacher" && (x.stepAnswer?.told || seamsOf(x).some((k) => ENDS.has(k)) || x.heardCap))) return null;
    const reads = L.rows.slice(j + 1, i).filter((x) => x.who !== "teacher").map((x) => String(x.read ?? "").split(" ")[0]);
    if (reads.includes("correct")) return null;
    // (a miss read at the first question and its remediation's own question after the verdict: the first card's miss path, not a drop —
    // item 10: the FIRST card's remediation (the same skill's) and a miss verdict said in this turn)
    // (d37 item 18b, pr8: tied to the script's own link as well — the remediation's `targets` names the misconception the first card's
    // `targets` names; BRIEF-G5 item 2, pr9: AND the same skill's, as item 10 ruled — the walk only picks the first card's skill's remediation)
    const skillOf = (x) => /^\.skills\[\d+\]/.exec(String(x ?? ""))?.[0] ?? null;
    const remOf = (x) => /^(\.skills\[\d+\]\.remediation\[\d+\])/.exec(String(x ?? ""))?.[1] ?? null;
    const atPath = (o, path) => String(path ?? "").match(/\.(\w+)|\[(\d+)\]/g)?.reduce((v, k) => (v == null ? v : v[k.startsWith("[") ? Number(k.slice(1, -1)) : k.slice(1)]), o);
    const remT = remOf(P) ? atPath(script, remOf(P))?.targets : null, cardT = questionObjectAt(script, P0)?.targets ?? null;
    const linked = !!remT && !!cardT && [].concat(remT).some((t) => [].concat(cardT).includes(t));
    if (reads.some((c) => ["misconception", "incorrect", "partial"].includes(c)) && linked && skillOf(P) === skillOf(P0) && seamsOf(r).includes("missVerdict")) return null;
    if (r.stepAnswer?.told || seamsOf(r).some((k) => ENDS.has(k)) || r.heardCap) return null;
    return `after a short ask or an invitation at ${P0}, ${P}'s question with no told step, key or cap for the first`;
  },
  /** B.5: three of her turns at one question after a try-first or a bare yes, none saying the question or help. Gated. */
  waitNoQuestion(L, r, i, ctx) {
    // (to-brain 054 C step 0, the as-heard read of cause B, walk 11: a side-topic's park inside a wait is passed over for the count, but a
    // park with no question straight after a wait turn with no question is two turns running with no question — the second a park)
    if (ctx?.script && r.who === "teacher" && asideTurn(r) && !waitCue(r) && !helpTurn(r)) {
      const j = prevTeacher(L, i);
      const w0 = j >= 0 ? waitAt(L, j, ctx?.script) : null;
      if (w0 && atQuestionOf(ctx.script, r.text) !== w0.P && !saysOrHelps(ctx.script, L.rows[j], w0.P))
        return `two turns of a wait at ${w0.P} running (rows ${j}, ${i}, the second a park) and neither says the question or help`;
    }
    const w = waitAt(L, i, ctx?.script);
    // (RULING-B5 item 3: tightened from three turns to two — never two turns running with no question; the wait counted from her turns)
    if (!w || w.turns.length < 2) return null;
    const last2 = w.turns.slice(-2);
    return last2.some((n) => saysOrHelps(ctx.script, L.rows[n], w.P)) ? null
      : `two turns of a wait at ${w.P} running (rows ${last2.join(", ")}) and neither says the question or help`;
  },
  /** RULING-B5 item 3: a fourth wait turn (the wait counted from her turns) that is not the cap — the step told or the key. Gated. */
  waitFourNotTold(L, r, i, ctx) {
    if (r.who !== "teacher" || waitPlace(L, i, ctx?.script) !== 4) return null;
    // (main's sixth ruling, item 7 — pr3's D: or a turn that carries the cap — a yes-or-no card's cap is said as its verdict and check-in)
    return r.stepAnswer?.told || seamsOf(r).some((k) => k === "key" || k === "workedStep") || r.heardCap ? null : `the wait's fourth turn is not the step told or the key: "${sentencesOf(r.text).at(-1) ?? ""}"`;
  },
  /** B.5: the wait's second turn ends on the question's own `reask`. Gated. */
  waitSecondNotReask(L, r, i, ctx) {
    const w = waitAt(L, i, ctx?.script);
    if (!w || w.turns.length !== 2) return null;
    const lang = ctx?.lang === "english" ? "english" : "hinglish";
    if (!reaskOf(ctx.script, w.P, lang)) return null;
    // (RULING-B3: wait two never says a reask the child has just heard — where the turn that last said the question ended on it, wait two
    // is what wait three is: help ending on the question (a told step or a key ends on another question, so waitAt never reads it))
    // (main's sixth ruling, item 5 — pr3's B: help that ends on the wait's own question; help ending on "Ab tum batao." is no question)
    if (helpTurn(r) && atQuestionOf(ctx.script, r.text) === w.P && reaskHeardBefore(L, w.turns[0], ctx.script, w.P)) return null;
    // (RULING-C2 item 1: or where the re-ask was heard in that wait's park — a side-topic's park between its turns that ended on the reask)
    if (helpTurn(r) && atQuestionOf(ctx.script, r.text) === w.P) { for (let k = prevTeacher(L, i); k > w.turns[0]; k = prevTeacher(L, k)) if (parkReaskAt(L, k, ctx.script)) return null; }
    return endsOnReask(ctx.script, w.P, r.text, lang) ? null : `the wait's second turn at ${w.P} does not end on its reask: "${sentencesOf(r.text).at(-1) ?? ""}"`;
  },
  /** B.4 (main's ruling on question 3): 049 B4's count with the wait's re-ask exempt — the re-ask overrides the third-turn invitation, so it
   *  is no turn of a run: a run that holds it is counted from the turn after it. Gated, as d34c's. */
  questionThreeRunning(L, r, i, ctx) {
    const was = D34C_PREDICATES.questionThreeRunning(L, r, i, ctx);
    if (!was) return was;
    const m = /ends (\d+) of her turns running/.exec(was);
    const n = m ? Number(m[1]) : 3;
    const her = [];
    for (let j = i; j >= 0 && her.length < n; j--) if (L.rows[j].who === "teacher") her.push(j);
    // (RULING-C2 item 1: the park's re-ask inside a wait is treated as the wait's own re-ask. RULING-C3 item 6: only inside a wait — her
    // turn before the park has a wait cue; outside a wait the park's re-ask is a turn of the run, as at 8144b10cb)
    const inWaitPark = (j) => { const b = prevTeacher(L, j); return b >= 0 && waitCue(L.rows[b]) && parkReaskAt(L, j, ctx?.script); };
    const k = her.findIndex((j) => waitReaskAt(L, j, ctx) || inWaitPark(j));
    return k < 0 || k >= 3 ? was : null;
  },
  /** RULING-C2 item 1 (049 B4, d34c's gated reading, re-pinned by name): the run counts hearings — a short ask or an invitation is none — so
   *  the park's re-ask at the question's second hearing (heard once since posed, her turn before said no question) is allowed; flagged
   *  everywhere it flagged before. */
  answerFirstThird(L, r, i, ctx) {
    const was = D34C_PREDICATES.answerFirstThird(L, r, i, ctx);
    if (!was || !/^the question said again on an aside turn/.test(was)) return was;
    return parkReaskAt(L, i, ctx?.script) ? null : was;
  },
  /** B.4 (main's ruling on question 3): d30's stepToldEarly, with the cap's turn at a wait allowed — the step told on its fifth hearing (the
   *  record's heardCap) after a try-first or a bare yes. Gated, as d30's. */
  stepToldEarly(L, r, i, ctx) {
    // (main's sixth ruling, item 9: the cap's allowance checks the place as well as the walk's flag — the cap is wait four, or the question's
    // fifth hearing (four turns before this one said it, any form but the short ask); a try-first's turn is no wait turn: item 1)
    if (r.who === "teacher" && r.heardCap && waitCue(r) && !tryCue(r) && r.stepAnswer?.told) {
      const heardN = L.rows.slice(0, i).filter((x) => x.who === "teacher" && atQuestionOf(ctx?.script, x.text) === r.heardCap).length;
      if (waitPlace(L, i, ctx?.script) === 4 || heardN >= 4) return null;
    }
    // (main's second ruling, item 2: wait three and after IS a give-up — where its path had nothing left unsaid, the step told)
    if (r.who === "teacher" && waitCue(r) && r.stepAnswer?.told && waitPlace(L, i, ctx?.script) >= 3 && stepHelpSpent(L, r, i, ctx?.script)) return null;
    // (RULING-B3: and on wait two where the turn that last said the question ended on its reask — wait two is then what wait three is)
    { const w = r.who === "teacher" && waitCue(r) && r.stepAnswer?.told ? waitRowOf(L, i, ctx?.script) : null;
      if (w?.n === 2 && reaskHeardBefore(L, w.first, ctx.script, w.P) && stepHelpSpent(L, r, i, ctx?.script)) return null; }
    // (d38 RULING-A7 P3: the told step at a return — her turn opens on her reply to a side-topic (a reply, the AI line's reply or the AI line,
    // a park, a said-again line: this check's own list) — where the step's question has been heard five times before it)
    if (r.who === "teacher" && r.stepAnswer?.told && SIDE_FIRST.has(String(seamsOf(r)[0] ?? "")) && heardBefore(L, i, ctx?.script).n >= 5) return null;
    return D30_PREDICATES.stepToldEarly(L, r, i, ctx);
  },
  /** Main's second ruling on cause B, item 1 (053 B2 re-pinned by name): the first wait turn (her turn before said the question itself) says
   *  no full form of the question, and no wait turn says the card or step whole as first written; from the wait's second turn on (her turn
   *  before was the short ask, the invitation, or an earlier turn of this same wait) the question's `reask` alone and a help turn ending on
   *  the question are allowed. Gated, as d35a's. */
  cardWholeAfterTryOrYes(L, r, i, ctx) {
    const was = D35A_PREDICATES.cardWholeAfterTryOrYes(L, r, i, ctx);
    if (!was) return was;
    const script = ctx.script, P = atQuestionOf(script, r.text);
    // (main's fourth ruling: a short ask or an invitation stands ONLY for the wait's own question — the question her turns last said before
    // it; a different question after a told step or a key in the same turn is a new question, not said again)
    // (main's sixth ruling, item 4 — pr3's A: only where the turn also ends the wait's own question — the step told, the key, or the cap — before
    // the different question; a card dropped unanswered for another question is not passed)
    const ended = !!(r.stepAnswer?.told || seamsOf(r).some((k) => ENDS.has(k)) || r.heardCap);
    if (ended && standsFor(script, ctx.prevT?.text)) { const own = stoodFor(L, L.rows.lastIndexOf(ctx.prevT), script); if (own && own !== P) return null; }
    const w = waitAt(L, i, script);
    const second = standsFor(script, ctx.prevT?.text) || (!!w && w.P === P && w.turns.length >= 2);
    if (!second) return was;
    // (a help turn ends on the question as a give-up's help does — at a card, the card's own ask after the help, whatever its length: the
    // ruling allows it from wait two. Any other turn passes only as the reask alone: the card or step said whole as first written is flagged)
    if (helpTurn(r)) return null;
    return endsOnReask(script, P, r.text, ctx?.lang === "english" ? "english" : "hinglish") && !saysWholeAsWritten(script, P, r.text) ? null : was;
  },
};
