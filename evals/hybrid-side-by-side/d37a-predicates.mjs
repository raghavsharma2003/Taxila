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
//                   or in the second (main's third ruling item 4: a go-on, the AI line, a go-on is the shape that exists) — after a go-on turn
//                   the lesson teaches.
//   goOnJointTwice  a go-on joint (afterAside, afterPark, afterAiLine, afterKeyGoOn) said in two of her turns running — "back to work" twice.
import { VPC_MAX } from "../../server/director/state.js";

const REPLY = new Set(["asideReply", "aiReply", "park"]);
/** Main's second ruling fix 2 and third ruling item 3: her reply's seam — a reply, a park, or her side-topic line said at a check-in, seam
 *  "aside", as the turn's first seam. → its index, or -1. */
const replyAt = (k) => k.findIndex((x, n) => REPLY.has(x) || (n === 0 && x === "aside"));
const AFTER_JOINTS = new Set(["afterAside", "afterPark", "afterAiLine"]);
/** Third ruling item 3: the said-again turn after a go-on line is excused only as the order shapes it — no after* joint, within VPC_MAX. */
const againShaped = (r) => !(r.seams ?? []).some((x) => AFTER_JOINTS.has(String(x.joint ?? ""))) && wordsOf(r.text) <= VPC_MAX;
/** Third ruling item 3: the turn after the AI line said straight after her reply's go-on line is read as the turn after that go-on. */
const aiAfterGoOn = (ctx) => ["aiQuestion", "aiLine"].includes(rightsOf(ctx?.prevT).at(-1)) && goOnRow(ctx?.prevPrevT);
const rightsOf = (r) => (r?.seams ?? []).map((x) => String(x.right ?? ""));
const wordsOf = (t) => String(t ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const goOnRow = (r) => r?.who === "teacher" && r.noFit === "aside" && !!r.noFitGoOn;
const cardIn = (k) => k.includes("card") || k.includes("returnCard");

const goOnEnd = (r) => r?.who === "teacher" && (r.noFit === "vpc" || !!r.noFitGoOn);
/** The seam kinds that teach: a point, a card, a bridge, the worked example's parts, help, a remediation, a verdict or a key. */
const TEACH = new Set(["point", "card", "returnCard", "bridge", "workedProblem", "workedStep", "stepAsk", "remediation", "help", "simpler", "key", "verdict", "missVerdict", "caption", "held"]);
const teaches = (r) => (r?.seams ?? []).some((x) => TEACH.has(String(x.right ?? "")));
const GO_ON_JOINTS = new Set(["afterAside", "afterPark", "afterAiLine", "afterKeyGoOn"]);
// (a joint that leads into an aside's return — the after-key go-on line before the return question — goes to the side-topic, not back to work:
// her reply to the child's answer then goes back, dry stuck c5-ch02-t02 50 → 52)
const goOnJoint = (r) => { const sm = r?.seams ?? []; const j = sm.findIndex((x) => GO_ON_JOINTS.has(String(x.joint ?? ""))); return j >= 0 && !sm.slice(j).some((x) => x.right === "return") ? sm[j].joint : null; };

export const D37A_PREDICATES = {
  goOnNoTeach(L, r, i) {
    if (r.who !== "teacher" || !goOnEnd(r) || teaches(r)) return null;
    for (let j = i - 1; j >= 0; j--) {
      const x = L.rows?.[j];
      if (x?.who !== "teacher") continue;
      if (goOnEnd(x)) return `two go-on turns (rows ${j} and ${i}) with nothing taught between them`;
      if (teaches(x)) return null;
    }
    return null;
  },
  goOnJointTwice(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const a = goOnJoint(ctx?.prevT), b = goOnJoint(r);
    return a && b ? `a go-on joint in two turns running (${a}, then ${b})` : null;
  },
  replyIntoPoint(L, r, i, ctx) {
    if (r.who !== "teacher" || (goOnRow(ctx?.prevT) && againShaped(r))) return null;
    const k = rightsOf(r);
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
