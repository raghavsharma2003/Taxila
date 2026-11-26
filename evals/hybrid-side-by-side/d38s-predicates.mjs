// d38 builder S2 (to-brain 055; main's item U1; RULING-A11 W1's questionFiveTimes reading). Registered in dry-predicates.mjs after d38a; GATED.
//   returnBeforeWayBack    U1: a turn that says a parked side-topic's return (a `return` seam) while the card a remediation took over is
//                          still owed its way back — read from the rows: a turn of hers before it with a `remediation` seam answering a
//                          child's line read as a misconception, the question her last turn before that remediation ended on (the card,
//                          P0), and from the remediation to this turn no turn of hers that says P0 again or gives a key (a `key` seam, or
//                          a told step); this turn neither says P0 nor gives a key. q/dry1/m stuck-c6-ch06-t01 68: "Sahi jawab, kyunki
//                          … = 54 m. Ab cricket ki baat karte hain: …" (verdict > return) after the ant's follow-up card, the 10 m by 6 m
//                          card still open. The check's OWN reading: the question of a turn is d38a's questionOfTurn (a check's reading,
//                          not the walk's).
import { questionOfTurn, wayBackAt, remC1Before } from "./d38a-predicates.mjs";
import { D32_PREDICATES } from "./d32-predicates.mjs";
import { D37C_PREDICATES } from "./d37c-predicates.mjs";

const seamsOf = (r) => (r?.seams ?? []).map((x) => String(x.right ?? ""));
const ENDS = new Set(["safeguard", "goodbye"]);
const gives = (r) => seamsOf(r).includes("key") || !!r?.stepAnswer?.told;

/** Row j of the remediation whose card is still owed its way back at row i → { j, P0 } | null. */
export function owedWayBack(L, i, script) {
  for (let j = i - 1; j > 0; j--) {
    const x = L.rows[j];
    if (x.who !== "teacher") continue;
    if (seamsOf(x).includes("remediation") && /^misconception/.test(String(L.rows[j - 1]?.read ?? ""))) {
      let P0 = null;
      for (let k = j - 1; k >= 0 && !P0; k--) if (L.rows[k].who === "teacher") P0 = questionOfTurn(script, L.rows[k].text);
      if (!P0) return null;
      for (let k = j + 1; k < i; k++) { const y = L.rows[k]; if (y.who === "teacher" && (questionOfTurn(script, y.text) === P0 || gives(y))) return null; }
      return { j, P0 };
    }
    if (gives(x)) return null;
  }
  return null;
}

export const D38S_PREDICATES = {
  // (d38 RULING-A11 W1: questionFiveTimes as d37c reads it, and the way back from a remediation's follow-up card passes — d38a's wayBackAt, the
  // first such turn since that remediation started)
  questionFiveTimes(L, r, i, ctx) {
    const was = D37C_PREDICATES.questionFiveTimes(L, r, i, ctx);
    return was && r.who === "teacher" && wayBackAt(L, i, ctx?.script, questionOfTurn(ctx?.script, r.text)) ? null : was;
  },
  // (d38 RULING-A11 W1, "the same reading and no other": keyBeforeHint as d32 reads it, and the told answer after a remediation of that
  // question's named mistake started at four or more hearings — the question's C1 turn, d38a's remC1Before — passes)
  keyBeforeHint(L, r, i, ctx) {
    const was = D32_PREDICATES.keyBeforeHint(L, r, i, ctx);
    if (!was) return was;
    let P = null;
    for (let k = i - 1; k >= 0 && !P; k--) if (L.rows[k].who === "teacher") P = questionOfTurn(ctx?.script, L.rows[k].text);
    return P && remC1Before(L, i, ctx?.script, P) ? null : was;
  },
  returnBeforeWayBack(L, r, i, ctx) {
    if (r.who !== "teacher" || ENDS.has(String(r.move ?? "")) || !seamsOf(r).includes("return")) return null;
    const o = owedWayBack(L, i, ctx?.script);
    if (!o || questionOfTurn(ctx?.script, r.text) === o.P0 || gives(r)) return null;
    return `a parked side-topic's return while ${o.P0} (taken over by the remediation at row ${o.j}) is still owed its way back`;
  },
};
