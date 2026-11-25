// to-brain 054 A (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, main's rulings: A(i) D1, A(ii) II-B, A(iii) as written):
// a turn holds one new thing. Registered in dry-predicates.mjs after d35b; all four gated (tests/r8-d37-054a.test.mjs pins each on made rows).
//   replyIntoPoint  A(i): her reply to a side-topic — an aside's, the AI line's or a return's reply (seams asideReply, aiReply), or a park — and
//                   then a new point and its card in the same turn. The turn straight after her reply's go-on line is the rule's one
//                   exception (a side-topic said again there gets its line, then the held point and card: the lesson does not stall).
//   asideGoOnNext   A(i): the turn after her reply's go-on line (noFit "aside") is the held point and its card (or the point on its check-in
//                   where the two do not fit, T1), whatever the child said — a stop, a safety turn, a wrap or a break excepted, and the AI
//                   line, which ends on her question as built (O7).
//   startIntoCard   A(ii): the start line (joints.startAnyway), the hook, the point and its card in one turn.
//   closeCardLong   A(iii): a worked close (its afterWorked joint) and the next card said in one turn of more than 70 words.
// Main's second ruling on cause A (fix 3, reader B1 and B2), both gated (tests/r8-d37-054a2.test.mjs):
//   goOnNoTeach     two of her turns that end on a go-on line (noFit "vpc", or a split's go-on: noFitGoOn) with no teaching part between them
//                   or in the second, or (main's fourth ruling item 2) three of her turns running with no teaching part, the first a go-on
//                   turn: a go-on, the AI line, a go-on — after a go-on turn the lesson teaches within two turns.
//   goOnJointTwice  a go-on joint (afterAside, afterPark, afterAiLine, afterKeyGoOn) said in two of her turns running — "back to work" twice.
// Main's fifth ruling on cause A (A(i) is design D2; tests/r8-d37-054a4.test.mjs): replyIntoPoint reads strictly again (no exemptions);
// goOnNoTeach reads ANY three of her turns running with no teaching part; asideGoOnNext and goOnJointTwice stay gated, guarding against the
// go-on turn coming back; and one more, gated:
//   replyPointCardNext  after her reply's point turn — a reply, a park or her line to a side-topic, a new point, its check-in — the next turn
//                   that teaches says that point's card and no new point (a stop, a wrap, a break or a safety turn excepted; help on the point
//                   alone, a clarify's, waits for the card as A(ii) routes it).
import { VPC_MAX } from "../../server/director/state.js";

const REPLY = new Set(["asideReply", "aiReply", "park"]);
/** Main's second ruling fix 2 and third ruling item 3: her reply's seam — a reply, a park, or her side-topic line said at a check-in, seam
 *  "aside". Main's sixth ruling item 3: the aside after any leading seams that teach nothing (afterKeyGoOn > aside > point > card), not only as
 *  the turn's first seam. → its index, or -1. */
const replyAt = (k) => k.findIndex((x, n) => REPLY.has(x) || (x === "aside" && k.slice(0, n).every((y) => !TEACH.has(y))));
const AFTER_JOINTS = new Set(["afterAside", "afterPark", "afterAiLine"]);
/** Third ruling item 3: the said-again turn after a go-on line is excused only as the order shapes it — no after* joint, within VPC_MAX. */
const againShaped = (r) => !(r.seams ?? []).some((x) => AFTER_JOINTS.has(String(x.joint ?? ""))) && wordsOf(r.text) <= VPC_MAX;
/** Third ruling item 3: the turn after the AI line said straight after her reply's go-on line is read as the turn after that go-on. */
const aiAfterGoOn = (ctx) => ["aiQuestion", "aiLine"].includes(rightsOf(ctx?.prevT).at(-1)) && goOnRow(ctx?.prevPrevT);
const rightsOf = (r) => (r?.seams ?? []).map((x) => String(x.right ?? ""));
const wordsOf = (t) => String(t ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const goOnRow = (r) => r?.who === "teacher" && r.noFit === "aside" && !!r.noFitGoOn;
const cardIn = (k) => k.includes("card") || k.includes("returnCard");

/** A turn that is no lesson turn: a stop, a wrap, a break or a safety turn — never read as the lesson stalling. */
const STOPS = /^(?:wrap|safeguard|break|stop|goodbye)$/;
const goOnEnd = (r) => r?.who === "teacher" && (r.noFit === "vpc" || !!r.noFitGoOn);
/** The seam kinds that teach: a point, a card, a bridge, the worked example's parts, help, a remediation, a verdict or a key. */
const TEACH = new Set(["point", "card", "returnCard", "bridge", "workedProblem", "workedStep", "stepAsk", "remediation", "help", "simpler", "key", "verdict", "missVerdict", "caption", "held"]);
const teaches = (r) => (r?.seams ?? []).some((x) => TEACH.has(String(x.right ?? "")));
const GO_ON_JOINTS = new Set(["afterAside", "afterPark", "afterAiLine", "afterKeyGoOn"]);
// (a joint that leads into an aside's return — the after-key go-on line before the return question — goes to the side-topic, not back to work:
// her reply to the child's answer then goes back, dry stuck c5-ch02-t02 50 → 52)
const goOnJoint = (r) => { const sm = r?.seams ?? []; const j = sm.findIndex((x) => GO_ON_JOINTS.has(String(x.joint ?? ""))); return j >= 0 && !sm.slice(j).some((x) => x.right === "return") ? sm[j].joint : null; };

/** Main's fifth ruling item 3: a point told for the first time — none of its sentences said in her turns before row `i`. `r`'s point is the
 *  text of its body parts, less the joints the seam pass placed there. */
const said = (L, i) => new Set((L.rows ?? []).slice(0, i).filter((x) => x?.who === "teacher").flatMap((x) => sentencesOf(x.text)).map(normS));
const normS = (x) => String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N}/]+/gu, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?\u0964])\s+/).filter(Boolean);
export function pointToldFirst(L, r, i) {
  const pp = r.pageParts ?? [], t = String(r.text ?? "");
  const b = pp.findIndex((p) => p.part === "body");
  if (b < 0) return false;
  const end = pp.slice(b).find((p) => p.part !== "body")?.from ?? t.length;
  const joints = new Set((r.seams ?? []).map((x) => normS(x.form)).filter(Boolean));
  const ss = sentencesOf(t.slice(pp[b].from ?? 0, end)).map(normS).filter((x) => x && !joints.has(x));
  const before = said(L, i);
  // (the turn's own last sentence is its check-in, never part of the point)
  const pt = ss.filter((x) => x !== normS(sentencesOf(t).at(-1)));
  return pt.length > 0 && pt.every((x) => !before.has(x));
}
/** Main's fifth ruling item 3, the relaxed reading of replyCheckin (d30) and asideCheckin (d29): her reply's turn may end on a check-in only
 *  when a NEW point — a point seam told for the first time — stands between her last reply (or park, or AI reply, or her line at a check-in
 *  `kinds`) and the check-in. Main's sixth ruling item 2: exactly D2 — between them her joint and ONE new point, nothing else: every seam
 *  between is `point` (a reply, a bridge, a point and a check-in is two new things). Her line at a check-in, seam `aside`, is a reply when it
 *  opens the turn. → whether it does. */
export function newPointBeforeCheckin(L, r, i, kinds) {
  const k = rightsOf(r);
  if (k.at(-1) !== "checkin") return false;
  let at = -1; k.forEach((x, n) => { if (kinds.includes(x) && (x !== "aside" || n === 0)) at = n; });
  const between = k.slice(at + 1, -1);
  return at >= 0 && between.length > 0 && between.every((x) => x === "point") && pointToldFirst(L, r, i);
}
/** Main's sixth ruling item 2: the reply seams replyCheckin and asideCheckin read — her reply to an aside, to the AI line's answer, a park, a
 *  return, and her line to a side-topic at a check-in (seam `aside`) where it opens the turn. → the index of the last one, or -1. */
export const REPLY_SEAMS = ["asideReply", "aiReply", "park", "return", "aside"];
export const lastReplyAt = (r) => { let at = -1; rightsOf(r).forEach((x, n) => { if (REPLY_SEAMS.includes(x) && (x !== "aside" || n === 0)) at = n; }); return at; };
/** D2's turn: her reply (seams asideReply, aiReply, park, or her line at a check-in, seam aside, first), then a new point, ending on its
 *  check-in. */
const replyPointTurn = (L, r, i) => { const at = replyAt(rightsOf(r)); return at >= 0 && newPointBeforeCheckin(L, r, i, [rightsOf(r)[at]]); };
export const D37A_PREDICATES = {
  goOnNoTeach(L, r, i) {
    // (main's fourth ruling item 2: the rule that stops a lesson stalling is never three turns running without a teaching part. Main's fifth
    // ruling item 2, the reader's finding in offtopic c4-ch05-t01: ANY three of her turns running with no teaching part, whatever the first —
    // or two go-on turns running, as before)
    if (r.who !== "teacher" || teaches(r) || STOPS.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    let n = 1;
    for (let j = i - 1; j >= 0; j--) {
      const x = L.rows?.[j];
      if (x?.who !== "teacher") continue;
      if (teaches(x) || STOPS.test(String(x.move?.kind ?? x.move ?? ""))) return null;
      n += 1;
      if (n >= 3 || (goOnEnd(x) && goOnEnd(r))) return `${n} turns running with no teaching part (rows ${j} to ${i})`;
    }
    return null;
  },
  goOnJointTwice(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const a = goOnJoint(ctx?.prevT), b = goOnJoint(r);
    return a && b ? `a go-on joint in two turns running (${a}, then ${b})` : null;
  },
  replyIntoPoint(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const k = rightsOf(r);
    // (main's fourth ruling item 2, reader N1 and N2: a turn that opens on her AI line itself and carries a new point and its card — seam aiLine
    // or aiQuestion, first — is never allowed, after a go-on turn or not: offtopic c4-ch01-t02 48, c4-ch05-t01 54, c5-ch02-t01 58 of dry3)
    if (/^ai(?:Line|Question)$/.test(k[0] ?? "") && k.includes("point") && cardIn(k)) return `her AI line runs into a new point and its card (${k.join(" > ")}, ${wordsOf(r.text)} words)`;
    // (main's fifth ruling item 2: strict — a reply seam with a new point AND its card in one turn is flagged, with no exemptions: the go-on turn
    // they were for is gone)
    const at = replyAt(k);
    if (at < 0) return null;
    const rest = k.slice(at + 1);
    return rest.includes("point") && cardIn(rest) ? `her ${k[at]} runs into a new point and its card (${k.join(" > ")}, ${wordsOf(r.text)} words)` : null;
  },
  asideGoOnNext(L, r, i, ctx) {
    const after = goOnRow(ctx?.prevT), afterAi = !after && aiAfterGoOn(ctx);
    if (r.who !== "teacher" || (!after && !afterAi)) return null;
    if (/^(?:wrap|safeguard|break|stop)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    const k = rightsOf(r);
    if (after && k.at(-1) === "aiQuestion") return null;
    if (!againShaped(r)) return `the turn after her reply's go-on line says a second go-on joint or runs past ${VPC_MAX} words (${wordsOf(r.text)})`;
    // (a point and its card that do not fit split again as T1 splits any — the point on its check-in, noFit "point": still the held point)
    return (k.includes("point") || k.includes("held")) && (cardIn(k) || r.noFit === "point") ? null : `the turn after her reply's go-on line is not its held point and card (${k.join(" > ") || "no seams"})`;
  },
  replyPointCardNext(L, r, i) {
    if (r.who !== "teacher" || !replyPointTurn(L, r, i)) return null;
    const pb = (r.pageParts ?? []).find((p) => p.part === "body")?.beat ?? null;
    const sk = String(r.beat ?? "").split(":")[0];
    if (!pb || !sk) return null;
    for (const y of (L.rows ?? []).slice(i + 1)) {
      if (y?.who !== "teacher") continue;
      if (STOPS.test(String(y.move?.kind ?? y.move ?? ""))) return null;
      if (!teaches(y)) continue;
      const k = rightsOf(y);
      // (help on the point alone — a clarify's, the card waiting — is not the card's turn yet: A(ii)'s routing)
      if (!cardIn(k) && !k.includes("point") && k.every((x) => !TEACH.has(x) || ["help", "simpler"].includes(x))) continue;
      const own = String(y.check?.itemId ?? "").endsWith(`-${sk}:ask:${pb}`) || ((y.pageParts ?? []).some((p) => p.part === "card" && p.beat === pb) && String(y.beat ?? "").startsWith(`${sk}:`));
      if (k.includes("point")) return `the turn after her reply's point turn (row ${i}) says a new point (${k.join(" > ")})`;
      return cardIn(k) && own ? null : `the turn after her reply's point turn (row ${i}) is not its card ${sk}:${pb} (${k.join(" > ") || "no seams"})`;
    }
    return null;
  },
  startIntoCard(L, r) {
    if (r.who !== "teacher") return null;
    const sm = r.seams ?? [];
    if (!sm.some((x) => x.joint === "startAnyway" || x.right === "startAnyway")) return null;
    const k = rightsOf(r);
    return k.includes("point") && cardIn(k) ? `the start line, the hook, the point and its card in one turn (${wordsOf(r.text)} words)` : null;
  },
  closeCardLong(L, r) {
    // (third ruling item 5: whether or not the afterWorked joint is said — a worked close is its joint, or its close part on the worked beat)
    const worked = (r.seams ?? []).some((x) => x.joint === "afterWorked") || (r.pageParts ?? []).some((p) => p.part === "close" && /^worked/.test(String(p.beat ?? "")));
    if (r.who !== "teacher" || !worked || !cardIn(rightsOf(r))) return null;
    const n = wordsOf(r.text);
    return n > VPC_MAX ? `a worked close and the next card in ${n} words > ${VPC_MAX}` : null;
  },
};
