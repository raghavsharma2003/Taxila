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
import { VPC_MAX } from "../../server/director/state.js";

// (main's second ruling fix 2: and her said-again line — seam "aside" — wherever it occurs, a check-in before it too)
const REPLY = new Set(["asideReply", "aiReply", "park", "aside"]);
const rightsOf = (r) => (r?.seams ?? []).map((x) => String(x.right ?? ""));
const wordsOf = (t) => String(t ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const goOnRow = (r) => r?.who === "teacher" && r.noFit === "aside" && !!r.noFitGoOn;
const cardIn = (k) => k.includes("card") || k.includes("returnCard");

export const D37A_PREDICATES = {
  replyIntoPoint(L, r, i, ctx) {
    if (r.who !== "teacher" || goOnRow(ctx?.prevT)) return null;
    const k = rightsOf(r);
    const at = k.findIndex((x) => REPLY.has(x));
    if (at < 0) return null;
    const rest = k.slice(at + 1);
    return rest.includes("point") && cardIn(rest) ? `her ${k[at]} runs into a new point and its card (${k.join(" > ")}, ${wordsOf(r.text)} words)` : null;
  },
  asideGoOnNext(L, r, i, ctx) {
    if (r.who !== "teacher" || !goOnRow(ctx?.prevT)) return null;
    if (/^(?:wrap|safeguard|break|stop)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    const k = rightsOf(r);
    if (k.at(-1) === "aiQuestion") return null;
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
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.joint === "afterWorked") || !cardIn(rightsOf(r))) return null;
    const n = wordsOf(r.text);
    return n > VPC_MAX ? `a worked close and the next card in ${n} words > ${VPC_MAX}` : null;
  },
};
