// dc-r8-director32 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md): the predicates Brain 049 adds, each written from the
// order's law and pinned non-zero on its director32 rows (tests/r8-director32-049.test.mjs, replayed with that run's own script snapshot)
// before it is trusted to read 0 on the dry matrix.
//   pictureKey          B2: a picture request answered by a key
//   pictureGoneBeforeAsk B2: a page change between a picture's first word and the turn's question
//   pictureNoLine       B2 (pictureSame's "none" path): a picture request with nothing drawn, at a script with joints.noPicture, and none
//                       of its forms said
//   hindiPromiseNoForm  B1: a Hindi switch line on a turn whose part has no `hindi` form
//   reaskSameAfterHelp  B1: a turn's closing question the same sentence as her turn before's closing question
//   keyBeforeHint       B3: a key at a card whose authored `simpler` is unsaid, before its third miss
//   verdictCheckinBeforeReturn B5: a right verdict ending on a check-in with the return to a parked aside her next turn
//   returnInsideWorked  B5: a return to a parked aside while a worked example's step is asked
//   helpNotOwn          B3: the second help at a card the point's other wording while the card's marked `whyAlt` is unsaid
import { questionPathOf, endsOnYourTurn, runOfTwo, HEAR_Q } from "../../server/director/question-run.js";
import { hindiFormSaid } from "./d30-predicates.mjs";
import { helpPart, hindiFormOf, at as atPath, ladderOf, ladderSpec, sentencesOf as helpSentences, normSentence } from "../../server/director/help.js";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const qKey = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);

/** Whether a row is the turn answering a picture request (the walk's column, or a picture held). */
const pictureAsked = (r) => r?.who === "teacher" && (r.cell?.column === "picture" || !!r.held?.picture);
/** Whether a row says a key: a key seam, or a close part on its page. */
const saysKey = (r) => (r?.seams ?? []).some((x) => x.right === "key") || (r?.pageParts ?? []).some((p) => p.part === "close");
/** A row's closing question, keyed, or null. */
const lastAsk = (r) => { const q = sentencesOf(r?.text).at(-1) ?? ""; return /[?？]\s*$/.test(q) ? qKey(q) : null; };
/** The last question sentences (keyed) of every question a script writes with no `reask` (a card's ask, a check, a follow-up card, the
 *  your-step, an asked step's ask, the closing question): Set<key>. */
function noReaskQuestions(script) {
  const out = new Set();
  const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en : x) ?? "";
  const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== "object") return;
    if (o.prompt && !o.reask) { const k = lastAsk({ text: said(o.prompt) }); if (k) out.add(k); }
    Object.values(o).forEach(walk); };
  walk(script);
  return out;
}
/** Brain 049 B4: every question the script writes, each of its forms (prompt, reask, hindi; hi and en) keyed by its last question sentence →
 *  the question's path, so a question said in either form is one question: Map<key, path>. Read from the script the lesson was run with. */
function questionForms(script) {
  const out = new Map();
  const forms = (x) => (x && typeof x === "object" ? [x.hi, x.en] : [x]).filter(Boolean);
  const walk = (o, path) => { if (Array.isArray(o)) return o.forEach((x, n) => walk(x, `${path}[${n}]`)); if (!o || typeof o !== "object") return;
    if (o.prompt) for (const f of ["prompt", "reask", "hindi"]) for (const t of forms(o[f])) { const k = lastAsk({ text: t }); if (k && !out.has(k)) out.set(k, path); }
    for (const [k, v] of Object.entries(o)) if (v && typeof v === "object") walk(v, `${path}.${k}`); };
  walk(script, "");
  return out;
}
/** Brain 049 B4: a turn that answers a request for Hindi with the part's `hindi` form — said as written, out of the re-ask rotation (Brain 047
 *  R8, reaskRunning's reading) — or a request to hear the question, is no turn of a run of one question. */
function hindiTurn(L, j, script) {
  const c = L.rows[j - 1];
  if (c?.who !== "child") return false;
  // (and a turn answering a request to hear the question: an invitation is no answer to it — the walk's question-run.js HEAR_Q)
  return (String(c.intent ?? "") === "hindi" && hindiFormSaid(script, L.rows[j])) || HEAR_Q.test(String(c.text ?? ""));
}
/** The char where a row's closing question starts (its last sentence ending "?"), or -1. */
function questionAt(r) {
  const t = String(r?.text ?? "").replace(/\s+/g, " ").trim();
  const q = sentencesOf(t).at(-1) ?? "";
  return /[?？]\s*$/.test(q) ? t.lastIndexOf(q) : -1;
}

export const D32_PREDICATES = {
  /** Brain 049 B4: a question is heard at most two of her turns running — card, asked step or closing question, either of its forms one question;
   *  the third turn at it ends on a joints.yourTurn form. A picture turn counts. director32 stuck 16 to 22 (c5-t01, c5-t02, c5-t03, c6, c6-ch07),
   *  offtopic 14 to 18 (c5-t02, c6), steering 28 to 32 (c5-t01, c5-t02, c6), c4 offtopic 58 to 62. Gated. */
  questionThreeRunning(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script) return null;
    // (one reading with the walk's: server/director/question-run.js — a {slot} in a form matches the filled words; questionForms kept for
    // its readers)
    void questionForms;
    const qOf = (x) => questionPathOf(ctx.script, x?.text);
    const q = qOf(r);
    if (!q) return null;
    let n = 1;
    if (hindiTurn(L, i, ctx.script)) return null;
    for (let j = i - 1; j >= 0 && n < 3; j--) {
      const y = L.rows[j];
      if (y.who !== "teacher") continue;
      if (qOf(y) !== q || hindiTurn(L, j, ctx.script)) break;
      n++;
    }
    return n >= 3 ? `the question ${q} ends three of her turns running` : null;
  },
  /** Brain 049 B4: the new ending — a turn ending on a joints.yourTurn form (an invitation that asks nothing) — only on the third turn
   *  running at one question: her two turns before it ended on that question, in either form. Gated. */
  yourTurnNotThird(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !endsOnYourTurn(ctx.script, r.text)) return null;
    const two = [];
    for (let j = i - 1; j >= 0 && two.length < 2; j--) if (L.rows[j].who === "teacher") two.unshift(j);
    return two.length === 2 && !two.some((j) => hindiTurn(L, j, ctx.script)) && runOfTwo(ctx.script, two.map((j) => L.rows[j].text)) ? null : "a turn ends on the invitation (joints.yourTurn) where her two turns before did not end on one question";
  },
  /** Brain 049 B2: a picture request is never answered by a key — with nothing left to draw it gets the noPicture line, the card's unsaid hint
   *  if one is left, and the card's question (director32 steering 16 in c5-t01, c5-t02, c6: "Is sawaal ka jawab 1/11 hai…"). Gated. */
  pictureKey(L, r) {
    return pictureAsked(r) && saysKey(r) ? `a picture request answered by a key (cell.picture ${r.cell?.picture ?? "?"})` : null;
  },
  /** Brain 049 B2: a picture drawn at a request stays up until the question it was asked at has been said — no page after the picture's first
   *  page and before the turn's end (director32 c6-ch07 steady 18: the scale replaced by the compare board at char 94; stuck 18 at 85). Gated. */
  pictureGoneBeforeAsk(L, r) {
    if (!pictureAsked(r) || !["pictureBoard", "view"].includes(String(r.cell?.picture ?? ""))) return null;
    const pages = r.held?.pages ?? [];
    if (pages.length < 2 || r.held?.layout?.split || pages.some((g) => g.beside)) return null;
    const q = questionAt(r);
    if (q < 0) return null;
    const first = pages[0];
    const gone = pages.slice(1).find((g) => (g.from ?? 0) <= q + 1 && g.template !== first.template);
    return gone ? `the picture (${first.template}) gave way to ${gone.template} at char ${gone.from}, before the question at ${q}` : null;
  },
  /** Brain 049 B2 (pictureSame's "none" path): a picture request with nothing drawn says the script's noPicture line — read only where the
   *  script has `joints.noPicture` (until it does, the line is not said). Gated. */
  pictureNoLine(L, r, i, ctx) {
    if (!pictureAsked(r) || !["hint", "none"].includes(String(r.cell?.picture ?? ""))) return null;
    const forms = (ctx?.script?.joints?.noPicture ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(qKey);
    if (!forms.length) return null;
    const t = qKey(r.text);
    return forms.some((f) => f && t.includes(f)) ? null : `nothing drawn (${r.cell.picture}) and no noPicture line said`;
  },
  /** Brain 049 B1: "Achha, ab Hindi mein kehti hoon." only where the part she is on has a `hindi` form (director32: c5-t01 steady 38, stuck 8,
   *  offtopic 32, steering 8; c5-t03 steady 36, stuck 8, steering 8; c6, c6-ch07, c4-ch01 all four). Gated. */
  hindiPromiseNoForm(L, r, i, ctx) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.joint === "hindiSwitch" || x.right === "hindiSwitch")) return null;
    const id = String(r.cell?.part ?? "").replace(/:quick$/, ":checkin").replace(/(:worked:step\d+):ask$/, "$1");
    let form = null;
    try { form = hindiFormOf(ctx?.script, helpPart(ctx?.script, id)); } catch { form = null; }
    return form ? null : `the Hindi switch line at ${id.split(":").slice(-2).join(":") || "?"}, which has no hindi form`;
  },
  /** Brain 049 B1: never the same question sentence ending two of her turns running, any path (director32 stuck 6 -> 8 in c5-t01, c5-t02,
   *  c5-t03, c6, c6-ch07; steering 6 -> 8 in c5-t03, c6-ch07). Gated. */
  reaskSameAfterHelp(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.prevT) return null;
    const q = lastAsk(r);
    // (Brain 049 B4: her invitation turn — joints.yourTurn, no question — stands between two question-turns and hides neither: the turn after
    // it is read against the question said before it)
    const pT = endsOnYourTurn(ctx.script, ctx.prevT.text) ? ctx.prevPrevT : ctx.prevT;
    if (!q || q !== lastAsk(pT)) return null;
    // (a question with no other authored wording — a card or asked step with no `reask`, a script hole — is reaskNoForm's, counted there)
    return (ctx.o.noReaskQs ??= noReaskQuestions(ctx.script)).has(q) ? null : `the same closing question as her turn before: "${q.slice(0, 60)}"`;
  },
  /** Brain 049 B3: a card's hint before its key — a key at a card with an authored `simpler` none of whose sentences she has said, except on
   *  the card's third miss (director32: a mix-up met again keyed at its first miss — c6-ch07 steady 48, offtopic 62; c5-t01 offtopic 28).
   *  Gated. */
  keyBeforeHint(L, r, i, ctx) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.right === "key")) return null;
    const col = String(r.cell?.column ?? "");
    if (!["wrong", "misconception"].includes(col)) return null;
    const id = String(r.cell?.part ?? "");
    const part = (() => { try { return helpPart(ctx?.script, id); } catch { return null; } })();
    if (!part || !["card", "check", "then_card", "your_step"].includes(part.kind)) return null;
    const own = atPath(ctx.script, `${part.path}.simpler`);
    const t = own && typeof own === "object" ? own.hi ?? own.en : own;
    if (!t || !String(t).trim()) return null;
    const before = L.rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => normSentence(x.text)).join(" | ");
    if (helpSentences(t).some((x) => before.includes(normSentence(x)))) return null;
    const misses = L.rows.slice(0, i + 1).filter((x) => x.who === "teacher" && String(x.cell?.part ?? "") === id && ["wrong", "misconception"].includes(String(x.cell?.column ?? ""))).length;
    return misses >= 3 ? null : `the key at ${id.split(":").slice(-2).join(":")} on miss ${misses}, its own hint unsaid`;
  },
  /** Brain 049 B3: the help order at a card — its `simpler`, then its `whyAlt` where the card is marked `whyAltAsHelp`, then the point's other
   *  wording, then the key: the point's other wording (pointAlt) said as help while the marked whyAlt is unsaid is the fault. Gated. */
  helpNotOwn(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const id = String(r.cell?.part ?? "");
    const part = (() => { try { return helpPart(ctx?.script, id); } catch { return null; } })();
    if (!part || part.kind !== "card" || atPath(ctx.script, part.path)?.whyAltAsHelp !== true) return null;
    const pa = atPath(ctx.script, `${part.point}.pointAlt`);
    const pt = pa && typeof pa === "object" ? pa.hi ?? pa.en : pa;
    const k = normSentence(r.text);
    if (!pt || !helpSentences(pt).some((x) => k.includes(normSentence(x)))) return null;
    const wa = atPath(ctx.script, `${part.path}.whyAlt`);
    const wt = wa && typeof wa === "object" ? wa.hi ?? wa.en : wa;
    if (!wt) return null;
    const before = L.rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => normSentence(x.text)).join(" | ");
    return helpSentences(wt).some((x) => before.includes(normSentence(x))) ? null : `the point's other wording at ${id.split(":").slice(-2).join(":")}, its marked whyAlt unsaid`;
  },
  /** Brain 049 B5: a right verdict before a due return ends on the return's question — never on a check-in with the return her next turn,
   *  alone (director32: c4 steady 46, 56, 70, stuck 68, offtopic 54, 74; c5-t01 steady 40 …; all seven topics). Gated. */
  verdictCheckinBeforeReturn(L, r, i) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.right === "verdict") || !(r.seams ?? []).some((x) => x.right === "checkin")) return null;
    // (her next turns up to the return: help on the check-in may come between — c4 steady 46, a give-up, 48, then the return at 50 — but no card)
    for (const x of L.rows.slice(i + 1).filter((y) => y.who === "teacher").slice(0, 3)) {
      if (x.returnSaid && (x.seams ?? [])[0]?.right === "return") return "a right verdict ending on a check-in, the return on its own turn after it";
      if ((x.pageParts ?? []).some((p) => ["card", "stepAsk", "quick"].includes(p.part)) || (x.seams ?? []).some((y) => y.right === "verdict")) return null;
    }
    return null;
  },
  /** Brain 049 B5: a return is never placed inside a worked example — it waits for the close (director32 c6-ch07 offtopic 54). Gated. */
  returnInsideWorked(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.returnSaid) return null;
    // (the child's own question about her taste, answered with her AI line and its question back — director23 A2's ruling: the step is held
    // for the turn after their reply — is the child's aside, not her return placed there: the dry offtopic c5-t02 and c6 20, reached once
    // B4's invitation changed the reactive child's next line. Main's to rule if A2 and B5 disagree)
    if ((r.seams ?? []).some((x) => x.right === "aiQuestion") && /(?<![\p{L}])(?:aap|aapko|tum|tumhe)(?![\p{L}])/iu.test(String(L.rows[i - 1]?.text ?? ""))) return null;
    const lastP = (ctx?.prevT?.pageParts ?? []).at(-1)?.part;
    if (lastP === "stepAsk" || /:worked:step\d+/.test(String(r.cell?.part ?? ""))) return "a return asked while a worked step is asked";
    // (the part the lesson goes back to after the return: a worked example's step or the child's own step — the return was inside it)
    // (inside: the lesson goes back to a worked example under way. A return after a card's close whose next turn starts the worked example —
    // says its problem — is before it, not inside: r8-main-034's steering 38, e4's verdict and the return, then the problem and step 1)
    const after = L.rows.slice(i + 1).filter((y) => y.who === "teacher").slice(0, 2).flatMap((y) => y.pageParts ?? []);
    const back = after.find((p) => ["card", "stepAsk", "returnCard"].includes(p.part));
    const starts = after.findIndex((p) => String(p.beat ?? "") === "worked:problem");
    if (starts >= 0 && (!back || starts < after.indexOf(back))) return null;
    return back && /^worked/.test(String(back.beat ?? "")) ? `a return inside a worked example (back to ${back.beat})` : null;
  },
};
