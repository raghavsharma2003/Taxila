// to-brain 054 D (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, D.5; main's rulings: D4 out of d37): closes and returns.
// Registered in dry-predicates.mjs after d37c; shareParkUnreturned and aiAsksTold GATED, returnColdAfterVerdict PENDING (main's second
// ruling on cause D, item 1: D1's fallback taken out, a told return with no back-to form is said with its verdict; its rows are Learning's)
// (tests/r8-d37-054d.test.mjs pins each on made rows).
//   returnColdAfterVerdict  D1: a right verdict and an aside's return in one turn (seams verdict … return) whose return question does not
//                           open on a back-to word — "Ab", "Chalo", "Jaisa kaha tha" (after an "Achha," at most) or "… ki baari" in its
//                           first clause (brain/say.js BACK_TO_LEAD). director36: c5-t03 sr 26 "Sixer ki baat tumne ki thi: …", c6-ch07-t01
//                           st 52, of 68, c4-ch06-t01 sk 46, of 44, c5-t01 st 40, c6-ch07-t03 st 38.
//   shareParkUnreturned     D2: a park of the child's side-topic with no return (a turn with the `return` seam) after it before the lesson's
//                           end — its wrap, goodbye or stop line. Her AI exchange is no return of it (D2: it asks her taste, not what they
//                           told). Read at the end row. director36: c5-t02 and c6 offtopic 18. (d37 close item 12: only a return of THAT
//                           park — its topic — clears it; a lesson with no end row is read at her last row; her AI exchange that serves an
//                           untold park by design returns it.)
//   aiAsksTold              D3: her AI line's question asking a favourite where the child's question named one ("Tumhara favourite kaun
//                           hai?" to "aapko virat pasand hai?": director36 c5-t02 and c6 offtopic 28); or a return asking what they had to
//                           say ("… kya kehna tha?", "… kya bata rahe the?") after a side-topic that told its thing ("kal maine cricket
//                           khela, sixer maara": c4-ch01-t02 offtopic 22).
import { BACK_TO_LEAD, toldOf } from "../../server/brain/say.js";
import { tasteNamedIn, asideTopic } from "../../server/director/state.js";
import { INTERESTS } from "../../server/persona/signals.js";

const seamsOf = (r) => (r?.seams ?? []).map((x) => x.right);
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const lastQ = (t) => sentencesOf(t).filter((x) => /[?？]\s*$/.test(x)).at(-1) ?? "";
const wordsOf = (t) => String(t ?? "").toLowerCase().match(/\p{L}+/gu) ?? [];
const ENDS = (r) => r?.who === "teacher" && (["wrap", "break"].includes(String(r.move ?? "")) || seamsOf(r).some((k) => ["goodbye", "stopLine", "wrapAsk", "tiredBye"].includes(k)));
const ASKS_SAID = /(?<![\p{L}])(?:kya\s+kehna\s+tha|kya\s+bata\s+rahe\s+the|what\s+you\s+wanted\s+to\s+say|what\s+were\s+you\s+saying)(?![\p{L}])/iu;

/** The interest a topic word belongs to ("virat" → "cricket"), lower-cased; the word itself where none. */
const familyOf = (w) => { const x = String(w ?? "").toLowerCase(); return Object.entries(INTERESTS).find(([k, ws]) => k === x || ws.includes(x))?.[0] ?? x; };
/** The topic a park row parked: the record's parkTopic, else the side-topic its child line names (state.js asideTopic), else null. */
const parkTopicOf = (rows, n) => rows[n].parkTopic ?? asideTopic(String([...rows.slice(0, n)].reverse().find((x) => x.who === "child")?.text ?? ""), []) ?? null;
/** Whether a return row returns that topic: its record's returnTopic, else its text names a word of the topic's interest. A park whose topic
 *  cannot be read is returned by any return, as before. */
function returnsTopic(y, topic) {
  if (!topic) return true;
  const f = familyOf(topic);
  if (y.returnTopic) return familyOf(y.returnTopic) === f;
  return (String(y.text ?? "").toLowerCase().match(/\p{L}+/gu) ?? []).some((w) => familyOf(w) === f);
}
export const D37D_PREDICATES = {
  returnColdAfterVerdict(L, r) {
    if (r.who !== "teacher" || !r.returnSaid) return null;
    const s = seamsOf(r);
    const v = s.indexOf("verdict"), k = s.indexOf("return");
    if (v < 0 || k < v) return null;
    const q = sentencesOf(r.text).at(-1) ?? "";
    return BACK_TO_LEAD.test(q.trim()) ? null : `a return straight after the verdict opening cold: "${q.slice(0, 60)}"`;
  },
  shareParkUnreturned(L, r, i) {
    const rows = L.rows ?? [];
    // (the end: the first such row of the lesson; d37 close item 12, pr5 section 2: a lesson with no end row is read at its last row of hers)
    const lastT = rows.map((x, n) => (x.who === "teacher" ? n : -1)).reduce((a, b) => Math.max(a, b), -1);
    const hasEnd = rows.some((x) => ENDS(x));
    if (hasEnd ? !ENDS(r) || rows.slice(0, i).some((x) => ENDS(x)) : i !== lastT) return null;
    const parks = rows.slice(0, i + (hasEnd ? 0 : 1)).map((x, n) => ({ x, n })).filter(({ x }) => x.who === "teacher" && seamsOf(x).includes("park"));
    // (item 12: the return that clears a park is a return of THAT park — its topic, as the record names it (parkTopic, returnTopic) or, in a
    // record without them, as the park's child line and the return's text name it — never any return seam. Her AI exchange that serves an
    // untold share park by design (state.js tasteServesPark; the record's servedByAi, its returnTopic) returns that park)
    const open = parks.filter(({ x, n }) => {
      const topic = parkTopicOf(rows, n);
      return !rows.slice(n + 1, i + 1).some((y) => y.who === "teacher" && (seamsOf(y).includes("return") || y.servedByAi) && returnsTopic(y, topic));
    });
    return open.length ? `a park never returned before the lesson's end (park at ${open.map((p) => p.n).join(", ")}: "${String(rows[open[0].n - 1]?.text ?? "").slice(0, 40)}")` : null;
  },
  aiAsksTold(L, r, i) {
    if (r.who !== "teacher") return null;
    const rows = L.rows ?? [];
    const q = lastQ(r.text);
    if (!q) return null;
    const kid = [...rows.slice(0, i)].reverse().find((x) => x.who === "child");
    if (seamsOf(r).includes("aiQuestion") && /favou?rite/i.test(q) && kid) {
      // (d37 close item 11: a named favourite is read as the walk reads it — state.js tasteNamedIn: "virat" in "aapko virat pasand hai?" is
      // one; "cricket" in "aapko cricket pasand hai?" is an interest's own name, a kind of thing, and is none)
      const named = tasteNamedIn(kid.text);
      if (named) return `her AI line asks a favourite the child's question named ("${String(kid.text).slice(0, 40)}"): "${q}"`;
    }
    if (r.returnSaid && ASKS_SAID.test(q)) {
      const qw = new Set(wordsOf(q));
      const aside = rows.slice(0, i).filter((x) => x.who === "child" && String(x.intent ?? "") === "aside" && wordsOf(x.text).some((w) => qw.has(w))).at(-1);
      const topic = aside ? wordsOf(aside.text).find((w) => qw.has(w) && w.length > 3) : null;
      if (aside && topic && toldOf(topic, aside.text)) return `a return asking what they had to say after they told it ("${String(aside.text).slice(0, 40)}"): "${q}"`;
    }
    return null;
  },
};
