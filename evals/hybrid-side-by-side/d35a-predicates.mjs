// to-brain 053, builder A's parts (docs/patches/to-brain/053-director34-second-picture-several-wrong-answers-walk-paths.md): the predicates
// they add, each pinned on its director34 rows (tests/r8-d35-053a.test.mjs, replayed with that run's own script snapshot) before it reads the
// dry matrix.
//   noPictureBare       A3: the no-picture line, then only an invitation or the question, while a wording of A3's list is unsaid
//   noPictureAfterView  A2: a view (or a picture) drawn on her turn before is gone on a turn that says the no-picture line
//   hintBoardNotDrawn   A1: the no-picture line said while the card's own hint, unsaid, owns a board (it is the second picture)
//   hintBoardNothingNew A1 (release 61): a turn recorded `hintBoard` that drew nothing new — the board up, or the card's own posing board
//   bridgeGiveUpGoesOn  B1: a first give-up or clarify at a bridge's check-in answered by the next part, no help
//   cardWholeAfterTryOrYes  B2: after try-first or a bare yes, the card or step said again whole (or its re-ask) when it was just said
//   questionFiveTimes   B3: a card's or an asked step's question said in a fifth turn of the lesson
//   closeNoFitCheckin   B4: a right answer's close apart from the next card (noFit "card") ending on a check-in
//   easierWordsNoQuestion  B5: a Hindi request at a card or asked step answered with help that ends on a check-in, not the question
import { helpPart, ladderOf, ownHintOf, normSentence, sentencesOf, inSaid, goOnPlain } from "../../server/director/help.js";
import { saidIn } from "../../server/director/script.js";
import { sameBoardRef } from "../../server/director/state.js";
import { drawnPagesOf } from "./drawn-pages.mjs";
import { atQuestionOf, endsOnYourTurn, endsOnAnswerFirst } from "../../server/director/question-run.js";
import { ownRequest, c1ReturnAt } from "./d38a-predicates.mjs";

const key = (t) => String(t ?? "").toLowerCase().replace(/\{\w+\}/g, " ").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
/** Whether a row says one of the script's joints.noPicture forms (or records the noPicture joint). */
export function saysNoPicture(r, script) {
  if (r?.who !== "teacher") return false;
  if ((r.seams ?? []).some((x) => x.joint === "noPicture" || x.right === "noPicture")) return true;
  const forms = (script?.joints?.noPicture ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(key).filter((k) => k.split(" ").length >= 3);
  const T = key(r.text);
  return forms.some((f) => T.includes(f));
}
/** The help part a row's cell names (an asked step's `:ask` and a quick question's part read as help.js reads them). */
const partOfRow = (r, script) => {
  const id = String(r?.cell?.part ?? "").replace(/:quick$/, ":checkin").replace(/(:worked:step\d+):ask$/, "$1");
  try { return id ? helpPart(script, id) : null; } catch { return null; }
};
/** The said set of every teacher row before row i, as help.js keeps it ({ k } entries). */
const saidBefore = (L, i) => {
  const out = [], have = new Set();
  for (const x of L.rows.slice(0, i)) if (x.who === "teacher") for (const s of sentencesOf(x.text)) { const k = normSentence(s); if (k && !have.has(k)) { have.add(k); out.push({ k }); } }
  return out;
};
const textOf = (v) => saidIn(v, "hinglish");
/** Whether any sentence of a wording is in a row's text. */
const inRow = (v, r) => { const T = normSentence(r.text); return sentencesOf(textOf(v)).some((s) => { const k = normSentence(s); return k && T.includes(k); }); };
/** Whether a wording was said before row i (any sentence of it, as help.js inSaid reads the ladder's rungs). */
const saidSoFar = (v, said) => sentencesOf(textOf(v)).some((s) => inSaid(s, said));

const seamKinds = (r) => (r?.seams ?? []).map((x) => x.joint ?? x.right);
const CARDISH = new Set(["card", "check", "then_card", "your_step"]);
/** The question path a teacher row is at, a short ask read as the last question said before it (lessons cache per row). */
function questionsAt(L, ctx) {
  if (ctx.o.qAt) return ctx.o.qAt;
  let last = null;
  const out = L.rows.map((r) => {
    if (r.who !== "teacher") return null;
    const a = atQuestionOf(ctx.script, r.text);
    if (a === "?short") return last;
    if (a) last = a;
    return a;
  });
  return (ctx.o.qAt = out);
}

/** B1: whether the full reason of the card closed before a bridge's check-in was said before row i (the closing turn's card, its `why`). */
function closedWhySaid(L, i, ctx) {
  const said = saidBefore(L, i);
  const pT = ctx.prevT, pi = L.rows.lastIndexOf(pT);
  const closer = L.rows.slice(0, pi + 1).reverse().find((x) => x.who === "teacher" && x.cell?.column === "right");
  const part = closer ? partOfRow(closer, ctx.script) : null;
  const why = part?.why ? textOf(part.why) : null;
  return !why || sentencesOf(why).some((s) => inSaid(s, said));
}
export const D35A_PREDICATES = {
  /** A3: a no-picture turn says the line and then only an invitation or the question while a wording of A3's list is unsaid — the hint in
   *  words, the point's other wording (the part's ladder) — director34: 8 of the 12 no-picture turns. Gated. */
  noPictureBare(L, r, i, ctx) {
    if (!saysNoPicture(r, ctx?.script)) return null;
    const part = partOfRow(r, ctx.script);
    if (!part) return null;
    const ladder = (() => { try { return ladderOf(ctx.script, part); } catch { return []; } })();
    if (!ladder.length || ladder.some((x) => inRow(x.value, r))) return null;
    const said = saidBefore(L, i);
    const left = ladder.find((x) => textOf(x.value) && !saidSoFar(x.value, said));
    return left ? `the no-picture line and nothing more, with ${left.path.split(".").slice(-2).join(".")} unsaid` : null;
  },
  /** A2: a view or picture drawn on her turn before stays up through a turn that says the no-picture line — the first page of the turn is
   *  the page up, with its view beside it (director34 c4-ch01-t02 steering 14 to 16: the tester view gone at the first word). Gated. */
  noPictureAfterView(L, r, i, ctx) {
    if (!saysNoPicture(r, ctx?.script) || !ctx?.prevT) return null;
    const pT = ctx.prevT;
    const drew = !!pT.held?.picture || ["view", "pictureBoard", "hintBoard"].includes(String(pT.cell?.picture ?? ""));
    if (!drew) return null;
    const pp = pT.held?.pages ?? [], rp = r.held?.pages ?? [];
    const lastBeside = pp.at(-1)?.beside ?? null;
    if (lastBeside && rp.length && rp[0].beside !== lastBeside) return `the view (${lastBeside}) drawn on her turn before is gone at the first word`;
    const up = drawnPagesOf(pT).at(-1)?.board ?? null, now = drawnPagesOf(r)[0]?.board ?? null;
    if (up && now && !sameBoardRef(up, now)) return `the picture drawn on her turn before (${up.template}) gave way to ${now.template}`;
    return null;
  },
  /** A1: the no-picture line is never said while the card's own hint (or an asked step's easier wording), unsaid, owns a board that does
   *  not show the answer — that board is the picture (director34 steering c4-ch01-t02 16, c5-ch02-t03 16; stuck c4-ch06-t01 18, c6 18). Gated. */
  // (release 61: "owns" is ownHintOf's `owns` — a board written on the hint itself, not the card's posing board nor the board up before the
  // turn; the fallback to the card's board, which read 0 on director35's four rows, is a board to say the hint over, never one it owns)
  hintBoardNotDrawn(L, r, i, ctx) {
    if (!saysNoPicture(r, ctx?.script)) return null;
    const part = partOfRow(r, ctx.script);
    if (!part) return null;
    const up = ctx?.prevT ? drawnPagesOf(ctx.prevT).at(-1)?.board ?? null : null;
    const own = (() => { try { return ownHintOf(ctx.script, part, saidBefore(L, i), "hinglish", { up }); } catch { return null; } })();
    return own?.owns ? `the no-picture line with the hint (${own.path.split(".").slice(-2).join(".")}) unsaid, its own board ${own.owns.template} undrawn` : null;
  },
  /** A1 (release 61 — director35 stuck c6-ch06-t01 18, c4-ch06-t01 18; steering c6-ch07-t01 16, c5-ch02-t03 16): a picture turn recorded
   *  `hintBoard` that drew nothing new — its board kept (`held.drawn` "kept"), or the board it drew is the board up before the turn or the
   *  card's own posing board. A child who asked for a drawing got the same board back. Gated. */
  hintBoardNothingNew(L, r, i, ctx) {
    if (r.who !== "teacher" || r.cell?.picture !== "hintBoard") return null;
    if (r.held?.drawn === "kept") return "a hint board recorded, the board kept: nothing new drawn";
    const drawn = drawnPagesOf(r)[0]?.board ?? null;
    if (!drawn) return null;
    const up = ctx?.prevT ? drawnPagesOf(ctx.prevT).at(-1)?.board ?? null : null;
    if (up && sameBoardRef(drawn, up)) return `a hint board recorded over the board already up (${drawn.template})`;
    const part = partOfRow(r, ctx?.script);
    if (part?.board && sameBoardRef(drawn, part.board)) return `a hint board recorded as the card's own posing board (${drawn.template}), drawn again`;
    return null;
  },
  /** B1 (carried clause 3): a FIRST give-up or "samajh nahi aaya" at a bridge's check-in gets help — the bridge's simpler, else the closed
   *  card's reason — never the next part alone (director34 c4 steady 70, c5-t03 steady 26, c6-ch07-t01 steady 26 and stuck 56, c6-ch07-t03
   *  stuck 56). Gated. */
  bridgeGiveUpGoesOn(L, r, i, ctx) {
    if (r.who !== "teacher" || !/:bridge$/.test(String(r.cell?.part ?? "")) || !["give_up", "clarify"].includes(String(r.cell?.column ?? ""))) return null;
    const p = ctx?.prevT;
    if (p && p.cell?.part === r.cell.part && ["give_up", "clarify"].includes(String(p.cell?.column ?? ""))) return null;
    if (seamKinds(r).includes("help") || (r.pageParts ?? []).some((x) => x.part === "simpler")) return null;
    // (B1's list spent: the bridge has no simpler and the closed card's full reason was said before — the go-on is all that is left)
    const sk = (ctx?.script?.skills ?? []).find((k) => String(r.cell.part).startsWith(`${k.skillId}:`));
    if (sk && !sk.bridgeToNext?.simpler && closedWhySaid(L, i, ctx)) return null;
    return `a ${r.cell.column} at the bridge's check-in answered by ${seamKinds(r).includes("afterKeyGoOn") ? "the go-on line and " : ""}the next part`;
  },
  /** B2: after "Haan, pehle tum try karo." or a bare "haan" at a card or asked step whose question her turn before said (or a short ask or
   *  an invitation stood for), the question is not said again in a full form — the short ask, then the invitation (director34 c4 steady 28,
   *  30; c4-ch01-t02 steady 28, 30; c5-t03 steering 18, 20; c5-t02 stuck 22, offtopic 24). Gated. */
  cardWholeAfterTryOrYes(L, r, i, ctx) {
    if (r.who !== "teacher" || !["try_first", "yes"].includes(String(r.cell?.column ?? "")) || !ctx?.prevT) return null;
    const qa = questionsAt(L, ctx);
    const P = atQuestionOf(ctx.script, r.text);
    if (!P || P === "?short") return null;
    const pT = ctx.prevT, pi = L.rows.lastIndexOf(pT);
    const before = qa[pi] === P || endsOnYourTurn(ctx.script, pT.text) || endsOnAnswerFirst(ctx.script, pT.text);
    return before ? `the question said again in full after ${r.cell.column === "yes" ? "a bare yes" : "try-first"}` : null;
  },
  /** B3 (after main's R1, R2: a short ask is no hearing; flagged only on a turn after a miss, a give-up or no answer): a card's or an asked step's question is heard in at most four turns of a lesson, in any form (whole, re-ask, Hindi form, short
   *  ask), running or not (director34 c4-ch01-t02 offtopic 10 to 30, c5-t02 steering 6 to 20). Gated. */
  questionFiveTimes(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const qa = questionsAt(L, ctx);
    const P = qa[i];
    if (!P || /^\.?teachback/.test(P)) return null;
    // (main's R2: a short ask says no question — it is no hearing; questionsAt reads it as the question pending, for B2's predicates)
    if (atQuestionOf(ctx.script, r.text) === "?short") return null;
    const n = qa.slice(0, i + 1).filter((x, k) => x === P && atQuestionOf(ctx.script, L.rows[k].text) !== "?short").length;
    // (main's R1: the cap is on what she says on her own. to-brain 055 C3, tightened by name (d38): no fifth hearing on her own in ANY form —
    // after a yes (the wait), a try-first, a side-topic or her reply to one, a picture request, a clarify — only the child's OWN request for
    // the question ("phir se bolo", a Hindi request where the question has a Hindi form) is honoured whatever the count. Was: every column
    // but a miss, a give-up and "other" passed. The child's request is read from the child's words by d38a's own list, not by the column)
    if (ownRequest(L, i, ctx.script, P)) return null;
    // (main's ruling A4 of d38: C1's one turn at a return — her reply to a side-topic, help in a wording not said before, the question — at
    // the fifth hearing; d38a's own reading)
    if (n === 5 && c1ReturnAt(L, i, ctx.script, P)) return null;
    return n >= 5 ? `the question ${P} heard a ${n}th time` : null;
  },
  /** B4: a right answer whose close cannot share its turn with the next card ends on the go-on line, never a check-in (director34 c4
   *  steady 54, offtopic 52 and 70). Gated. */
  closeNoFitCheckin(L, r, i, ctx) {
    if (r.who !== "teacher" || r.cell?.column !== "right" || r.move !== "repair") return null;
    // (d35 closing item 5: B4's go-on line is the script's plain afterKeyGoOn form; a script with none — every form consoles or promises,
    // or code's fallback forms — has no go-on line to end on, and the close keeps its check-in, as 049 B6's split does: tests r8-main-034)
    if (ctx?.script && !goOnPlain(ctx.script)) return null;
    const k = seamKinds(r);
    if (k[0] !== "verdict" || k.at(-1) !== "checkin" || k.some((x) => ["key", "bridge", "return", "asideReply"].includes(x))) return null;
    // (the close of the lesson's last card, before the wrap, is no close apart from a next card)
    const next = L.rows.slice(i + 1).find((x) => x.who === "teacher");
    if (!next || ["wrap", "teachback"].includes(String(next.move ?? "")) || /teachback/.test(String(next.cell?.part ?? ""))) return null;
    return `a right answer's close apart from its next card ends on a check-in${r.noFit ? ` (noFit ${r.noFit})` : ""}`;
  },
  /** B5: a Hindi request at a card or an asked step with no form ends on the question — never on a check-in (director34 c5-t02 steady 36).
   *  Gated. */
  easierWordsNoQuestion(L, r, i, ctx) {
    if (r.who !== "teacher" || r.cell?.column !== "hindi") return null;
    const part = partOfRow(r, ctx?.script);
    if (!part || !(CARDISH.has(part.kind) || (part.kind === "worked_step" && part.step))) return null;
    return seamKinds(r).at(-1) === "checkin" ? `a Hindi request at ${part.kind} ending on a check-in` : null;
  },
};
