// dc-r8-director28, Brain 044 (docs/patches/to-brain/044-fewer-kinds-of-turn.md): fewer kinds of turn, help as a hard precondition, a
// joint keeps what is up. The predicates are written from the order's sentences, not from director28's shapes
// (fd-predicate-must-fail-on-judges-rows); tests/r8-director28-044.test.mjs pins each non-zero on the director28 rows the order lists.
// Merged into dry-predicates.mjs's PREDICATES. Pure.
//
//   pageStart      T4: every page in a turn starts at the first character of the part that owns it. A joint, a lead-in, an opener, a
//                  bridge and a hook own no page — they are said over what is up (nothing, if nothing is up); a part of the record that
//                  is one of them and lists a board drawn in the turn claims a page it does not own
//   asideCheckin   T6: a turn whose last teaching part is her reply to an aside (or to the child's answer after her AI line), a park or a
//                  return never ends on a comprehension check-in — it goes on into the live part with its joint
//   pointNoFit     T1: a point and its card that do not fit in one turn (and no quick question of the script's fits): the turn ends on the
//                  point's check-in, the row says so (noFit), and this counts it. Pending (counted, not gated) until Learning 017's cuts are
//                  merged; it should read 0 on the pilots then
//   stepTryFirst   T7: "let me try" at an asked step gets that step's question again — no step skipped, no other card in its place
//   hookAlone      T1: the hook never ends a turn — no turn's last part before its check-in is the hook
//   switchFirst    T1: the switch line ("easier words") is never said before a first telling — no turn says it and then a point not said before
//   remCardLong    T2: a remediation (or help on it) and its follow-up card in one turn over 60 words
//   workedInvite   T3: no turn ends on an invitation to do the worked example together (joints.workedInvite is not read)
//   workedNoFit    T3: a verdict whose turn could not run into the worked example ends on its check-in (noFit "worked") — counted, pending
//                  until Learning 017's cut openings are merged
//   T8, the record says what was heard:
//   reaskReturn    a card asked again after a hint or help on it, or because the child asked for it, is not recorded (or said) as a return
//   stepConfirm    an asked step's confirmation (its ask.right) is not recorded as a point
//   openerSeam     the switch line is recorded once, as the switch — never also as an empty opener seam
//   quickAddress   a line on a quick question is addressed as the quick question, not as the point's check-in
//   whyShortFlag   a row that says the answered card's short reason carries whyShort
//   reaskTwice     Small: after a second wrong answer in a row the question is not said word for word as her last turn ended
//   keyAfterFive   Small: the fifth wrong answer to one question (its quick question and its card) is met with the key
//   quickHelpCard  T5: a request at a quick question gets help on the point, then the quick question again or the card — never a check-in
//                  with the card waiting (requestHelped reads the help itself: the three things and nothing else)
import { pagesOf, isLeadText } from "./d27-predicates.mjs";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}` : JSON.stringify(v ?? null));
const keyOf = (b) => (b && typeof b === "object" && b.template ? canon({ template: b.template, params: b.params ?? {} }) : null);
const sameB = (a, b) => !!keyOf(a) && keyOf(a) === keyOf(b);
const CHECKIN_END = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear|Did that step make sense)\?$/i;
const REQUESTS = new Set(["clarify", "give_up", "hindi"]);
const brief = (b) => (b ? `${String(b.template).replace(/@\d+$/, "")}` : "nothing");

/** A turn's parts with their texts, each marked `lead` when it owns no page: a bridge, an aside (her reply, an opener, the switch line),
 *  or words that are all joint, lead-in, hook or bridge sentences (the record has called a lead-in `body`: c6 steady 112). */
export function leadPartsOf(r, script) {
  const t = String(r.text ?? "");
  const pp = r.pageParts ?? [];
  return pp.map((p, n) => {
    const end = pp[n + 1]?.from ?? t.length;
    const text = t.slice(p.from ?? 0, end).trim();
    return { part: p.part, beat: String(p.beat ?? ""), from: p.from ?? 0, end, text, boards: p.boards ?? [], lead: p.part === "bridge" || p.part === "aside" || isLeadText(text, r, script) };
  });
}

const WRONG_READS = new Set(["incorrect", "misconception", "partial"]);
const readOf = (row) => String(row?.read ?? "").split(" ")[0];
const lastSentence = (t) => (String(t ?? "").replace(/\s+/g, " ").trim().match(/[^.?!।]+[.?!।]*$/u)?.[0] ?? "").trim();
const keyText = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const KEY_WORDS = /(?:sawaal ka|iska) (?:sahi )?jawab|sahi jawab:|the answer (?:here )?(?:is|was)|iska jawab hai|poora jawab/i;

/** Small: the wrong answers to the question a turn answers, up to and including that turn — the teacher turns on the same beat's card or
 *  quick question that follow a wrong answer. 0 when the turn is on no card or quick question. */
export function missesOnQuestion(rows, i) {
  const base = (x) => /^(.+):(?:card|quick)$/.exec(String(x?.cell?.part ?? ""))?.[1] ?? null;
  const b = base(rows[i]);
  if (!b) return 0;
  let n = 0;
  for (let k = 1; k <= i; k++) if (rows[k].who === "teacher" && base(rows[k]) === b && WRONG_READS.has(readOf(rows[k - 1]))) n++;
  return n;
}

export const D29_PREDICATES = {
  /** T4: every page in a turn starts at the first character of the part that owns it. The board carried up from the turn before is no
   *  page of this turn; a page drawn at a lead (a joint, a lead-in, an opener, a bridge, a hook) or at words the record has no part for,
   *  before its owner's first word, is early; a lead that lists a board this turn draws claims a page it does not own. */
  pageStart(L, r, i, ctx) {
    const st = (ctx.o.d29 ??= { at: -1, up: null });
    if (st.at >= i) { st.at = -1; st.up = null; }
    if (r.who !== "teacher") return null;
    const up = st.up;
    const { pages, end } = pagesOf(r, up);
    st.up = end; st.at = i;
    const parts = leadPartsOf(r, ctx.script);
    if (!parts.length) return null;
    for (let k = 0; k < pages.length; k++) {
      const pg = pages[k];
      if (!pg.board || (pg.from === 0 && sameB(pg.board, up))) continue;
      const after = k ? pages[k - 1].from : 0;
      // (the record's bridge part listing the next unit's board — a bridge owns none: Brain 044 T8)
      const claim = parts.find((p) => p.part === "bridge" && p.from >= after && p.boards.some((b) => sameB(b, pg.board)));
      const owner = parts.find((p) => !p.lead && p.from >= after && p.boards.some((b) => sameB(b, pg.board)));
      if (!owner) continue;
      if (claim && claim.from < owner.from) return `the ${claim.part} at ${claim.from} ("${claim.text.slice(0, 30)}") claims the ${brief(pg.board)} page its ${owner.part}@${owner.beat} owns`;
      if (owner.from !== pg.from) return `the ${brief(pg.board)} page drawn at ${pg.from}, not at its ${owner.part}@${owner.beat}'s first word (${owner.from})`;
    }
    return null;
  },
  /** T5: a request (clarify, give-up, Hindi) at a quick question is answered with help on its point and then the quick question again or the
   *  card — never a check-in while the card waits (c5-t01 steady 8; c6 steady 8). */
  quickHelpCard(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx.prevT || !(ctx.prevT.pageParts ?? []).some((p) => p.part === "quick")) return null;
    const req = REQUESTS.has(String(ctx.prevIntent ?? "")) ? ctx.prevIntent : REQUESTS.has(String(r.cell?.column ?? "")) ? r.cell.column : null;
    if (!req || !CHECKIN_END.test(norm(r.text))) return null;
    return `a ${req} at the quick question answered with a check-in, its card waiting`;
  },
  /** T6: an aside reply, a park or a return never ends on a check-in (c5-t01 stuck 42, steering 34, 38; c5-t02 stuck 42; c6 stuck 44, offtopic
   *  30, 34, steering 34, 38): read from the record's seams — the last part said before the check-in. */
  asideCheckin(L, r) {
    if (r.who !== "teacher" || !CHECKIN_END.test(norm(r.text))) return null;
    const last = [...(r.seams ?? [])].reverse().find((x) => x.right !== "checkin");
    return last && ["asideReply", "aiReply", "park", "return"].includes(last.right) ? `her ${last.right} ends on a check-in` : null;
  },
  /** T1: a point's turn that ends on its check-in because the point and its card do not fit (the walk's noFit). */
  pointNoFit(L, r) {
    // (d29 final, offtopic c5-t02 36: a turn whose point was held behind her answer to the child's AI question says no point — the move's
    // mark is read only on a turn that says one)
    return r.who === "teacher" && r.noFit === "point" && (r.seams ?? []).some((x) => x.right === "point") ? "a point and its card that do not fit: the point ends on its check-in" : null;
  },
  /** T7: the child asks to try at an asked step: her next turn asks that step's question again (c4 stuck 28; c6 offtopic 38; c5-t02 steady 32,
   *  offtopic 38). */
  stepTryFirst(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx.prevT) return null;
    const pp = ctx.prevT.pageParts ?? [];
    const ask = pp.find((p) => p.part === "stepAsk");
    if (!ask || String(ctx.prevIntent ?? "") !== "try_first" && !/selftry/.test(String(ctx.prevRead ?? ""))) return null;
    const t = String(ctx.prevT.text ?? "");
    const q = norm(t.slice(ask.from ?? 0, pp[pp.indexOf(ask) + 1]?.from ?? t.length));
    return q && norm(r.text).includes(q) ? null : `"let me try" at the asked ${ask.beat} answered without its question`;
  },
  /** T1: the hook never ends a turn (c6 row 2 in all four lessons: "Yahi chakkar ab ek triangle par. Ab tak samajh aaya?"). */
  hookAlone(L, r) {
    if (r.who !== "teacher") return null;
    const last = [...(r.seams ?? [])].reverse().find((x) => x.right !== "checkin");
    return last?.right === "hook" && CHECKIN_END.test(norm(r.text)) ? "the hook ends the turn on a check-in" : null;
  },
  /** T1: the switch line is never said before a first telling (row 4 in 11 of the 16 director28 lessons). */
  switchFirst(L, r, i, ctx) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.joint === "hindiSwitch")) return null;
    const said = new Set((ctx.o.teacherTexts ?? []).flatMap((t) => String(t).split(/(?<=[.!?\u0964])\s+/)).map((x) => norm(x).toLowerCase()));
    const t = String(r.text ?? "");
    const pt = (r.pageParts ?? []).find((p) => p.part === "body" && /^e\d+$/.test(String(p.beat ?? "")));
    if (!pt) return null;
    const pp = r.pageParts; const at = pp.indexOf(pt);
    const ss = t.slice(pt.from, pp[at + 1]?.from ?? t.length).split(/(?<=[.!?\u0964])\s+/).map((x) => norm(x).toLowerCase()).filter(Boolean);
    return ss.length && ss.every((x) => !said.has(x)) ? `the switch line before the ${pt.beat} point's first telling` : null;
  },
  /** T2: a remediation, or help on one, and its follow-up card share a turn only within 60 words (c6 steady 52, stuck 22, 66, steering 8; c4
   *  steering 12). */
  remCardLong(L, r) {
    if (r.who !== "teacher") return null;
    const pp = r.pageParts ?? [];
    const rem = pp.some((p) => ["body", "simpler"].includes(p.part) && /^rem:/.test(String(p.beat ?? "")));
    const card = pp.some((p) => p.part === "card" && /^then:/.test(String(p.beat ?? "")));
    const n = norm(r.text).split(" ").filter(Boolean).length;
    return rem && card && n > 60 ? `a remediation and its follow-up card in ${n} words` : null;
  },
  /** T3: the invitation is gone — no turn says it (the record's workedInvite mark). */
  workedInvite(L, r) {
    return r.who === "teacher" && r.workedInvite ? "a turn ends on an invitation to the worked example" : null;
  },
  /** T3: the verdict's turn that could not run into the worked example (counted). */
  workedNoFit(L, r) {
    return r.who === "teacher" && r.noFit === "worked" ? "a verdict and the worked example's opening that do not fit: the verdict ends on its check-in" : null;
  },
  /** T8: a re-ask is no return (c5-t02 steady 98, offtopic 18, 20; c4 offtopic 26, 42, steering 16, 22; c6 stuck 8). */
  reaskReturn(L, r, i, ctx) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.right === "returnCard")) return null;
    const helped = (r.pageParts ?? []).some((p) => p.part === "simpler");
    const asked = /·\s*(?:repeat|which|visual)/.test(String(ctx.prevRead ?? ""));
    const afterHint = String(ctx.prevT?.move ?? "") === "hint" && !!r.check?.itemId && r.check.itemId === ctx.prevT?.check?.itemId;
    return helped || asked || afterHint ? `a card asked again ${helped ? "after help on it" : asked ? "because the child asked" : "after a hint"} recorded as a return` : null;
  },
  /** T8: an asked step's confirmation is not a point (c4 steady 46, steering 38). */
  stepConfirm(L, r) {
    if (r.who !== "teacher" || !r.stepAnswer?.right) return null;
    const sm = r.seams ?? [];
    return sm.some((x) => x.right === "point") && !sm.some((x) => x.right === "stepConfirm") ? "an asked step's confirmation recorded as a point" : null;
  },
  /** T8: the switch line recorded once (row 4's empty opener seam). */
  openerSeam(L, r) {
    const sm = r.seams ?? [];
    return r.who === "teacher" && sm.some((x) => x.joint === "hindiSwitch") && sm.some((x) => x.right === "opener" && !x.joint && !x.form) ? "the switch line recorded also as an empty opener seam" : null;
  },
  /** T8: a line on a quick question is addressed as the quick question (c5-t01 steady 8; c6 steady 8). */
  quickAddress(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx.prevT || !(ctx.prevT.pageParts ?? []).some((p) => p.part === "quick")) return null;
    return /:checkin$/.test(String(r.cell?.part ?? "")) ? `a line on the quick question addressed as ${r.cell.part}` : null;
  },
  /** T8: a row that says the answered card's short reason carries whyShort (c5-t01 steady 118). */
  whyShortFlag(L, r, i, ctx) {
    if (r.who !== "teacher" || r.whyShort || !ctx.script) return null;
    const id = String(ctx.prevT?.check?.itemId ?? "");
    const m = /^script:(.+?):(?:ask:(.+)|then:(.+)|([^:]+))$/.exec(id);
    if (!m) return null;
    const sk = (ctx.script.skills ?? []).find((k) => k.skillId === m[1]);
    const card = m[2] ? sk?.explain?.find((b) => b.id === m[2])?.ask : m[3] ? sk?.remediation?.find((x) => x.targets === m[3])?.then : sk?.checks?.find((c) => c.id === m[4]);
    const ws = card?.whyShort?.hi;
    const t = norm(r.text).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ");
    const k = (x) => norm(x).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
    // (the short form said in the why's place — not the whole why, which may hold the short form's words)
    return ws && t.includes(k(ws)) && !(card.why?.hi && t.includes(k(card.why.hi).slice(0, 40))) ? "the card's short reason said with no whyShort on the row" : null;
  },
  /** Small: a second wrong answer in a row is not met with the question said word for word as her turn before ended (c4 steady 86,
   *  offtopic 52; c5-t01 steering 54). Both turns follow a wrong answer; the question is each turn's last sentence. */
  reaskTwice(L, r, i) {
    const rows = L.rows ?? [];
    if (r.who !== "teacher" || !WRONG_READS.has(readOf(rows[i - 1]))) return null;
    let j = i - 2; while (j >= 0 && rows[j].who !== "teacher") j--;
    if (j < 1 || !WRONG_READS.has(readOf(rows[j - 1]))) return null;
    const q = lastSentence(r.text), q0 = lastSentence(rows[j].text);
    return /[?？]$/.test(q) && keyText(q) === keyText(q0) ? "the question said again word for word straight after a second wrong answer" : null;
  },
  /** Small: after five wrong answers to one question — its card's and the quick question that asked it first — the card gets its key
   *  (c5-t02 offtopic 20: the ladder ran on into the point's wordings). The count is the turns on that beat's card or quick question that
   *  answer a wrong answer; the fifth one says the key. */
  keyAfterFive(L, r, i) {
    const rows = L.rows ?? [];
    if (r.who !== "teacher" || !WRONG_READS.has(readOf(rows[i - 1]))) return null;
    const n = missesOnQuestion(rows, i);
    return n >= 5 && !KEY_WORDS.test(String(r.text ?? "")) && !r.keyFact ? `wrong answer ${n} to one question and no key` : null;
  },
};
