// to-brain 054 D (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, D.5; main's rulings: D4 out of d37): closes and returns.
// Registered in dry-predicates.mjs after d37c; all three GATED (tests/r8-d37-054d.test.mjs pins each on made rows).
//   returnColdAfterVerdict  D1: a right verdict and an aside's return in one turn (seams verdict … return) whose return question does not
//                           open on a back-to word — "Ab", "Chalo", "Jaisa kaha tha" (after an "Achha," at most) or "… ki baari" in its
//                           first clause (brain/say.js BACK_TO_LEAD). director36: c5-t03 sr 26 "Sixer ki baat tumne ki thi: …", c6-ch07-t01
//                           st 52, of 68, c4-ch06-t01 sk 46, of 44, c5-t01 st 40, c6-ch07-t03 st 38.
//   shareParkUnreturned     D2: a park of the child's side-topic with no return (a turn with the `return` seam) after it before the lesson's
//                           end — its wrap, goodbye or stop line. Her AI exchange is no return of it (D2: it asks her taste, not what they
//                           told). Read at the end row; not where her turn before the end held the return for the next turn (D1's
//                           go-on, noFit "return") and the child left on it. director36: c5-t02 and c6 offtopic 18.
//   aiAsksTold              D3: her AI line's question asking a favourite where the child's question named one ("Tumhara favourite kaun
//                           hai?" to "aapko virat pasand hai?": director36 c5-t02 and c6 offtopic 28); or a return asking what they had to
//                           say ("… kya kehna tha?", "… kya bata rahe the?") after a side-topic that told its thing ("kal maine cricket
//                           khela, sixer maara": c4-ch01-t02 offtopic 22).
import { BACK_TO_LEAD, toldOf } from "../../server/brain/say.js";

const seamsOf = (r) => (r?.seams ?? []).map((x) => x.right);
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const lastQ = (t) => sentencesOf(t).filter((x) => /[?？]\s*$/.test(x)).at(-1) ?? "";
const wordsOf = (t) => String(t ?? "").toLowerCase().match(/\p{L}+/gu) ?? [];
/** The words of a child's question about her taste that name nothing (the asking and the liking). */
const TASTE_WORDS = new Set(["aapko", "aap", "aapka", "aapki", "tumhe", "tum", "tumhara", "tumhari", "ko", "bhi", "kya", "pasand", "hai", "ho", "hain", "do", "you", "like", "your", "favourite", "favorite", "is", "who", "kaun", "kon", "sabse", "zyada", "achha", "lagta", "lagti", "acha"]);
const ENDS = (r) => r?.who === "teacher" && (["wrap", "break"].includes(String(r.move ?? "")) || seamsOf(r).some((k) => ["goodbye", "stopLine", "wrapAsk", "tiredBye"].includes(k)));
const ASKS_SAID = /(?<![\p{L}])(?:kya\s+kehna\s+tha|kya\s+bata\s+rahe\s+the|what\s+you\s+wanted\s+to\s+say|what\s+were\s+you\s+saying)(?![\p{L}])/iu;

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
    if (!ENDS(r)) return null;
    const rows = L.rows ?? [];
    // (the end: the first such row of the lesson — a park before it and no return between)
    if (rows.slice(0, i).some((x) => ENDS(x))) return null;
    if (seamsOf(r).includes("return")) return null;
    // (a return D1 held for the turn after her verdict's go-on line, the child leaving on that turn: it had no turn — dry stuck c4-ch06-t01 66)
    const lastT = [...rows.slice(0, i)].reverse().find((x) => x.who === "teacher");
    if (lastT?.noFit === "return") return null;
    const parks = rows.slice(0, i).map((x, n) => ({ x, n })).filter(({ x }) => x.who === "teacher" && seamsOf(x).includes("park"));
    const open = parks.filter(({ n }) => !rows.slice(n + 1, i).some((y) => y.who === "teacher" && seamsOf(y).includes("return")));
    return open.length ? `a park never returned before the lesson's end (park at ${open.map((p) => p.n).join(", ")}: "${String(rows[open[0].n - 1]?.text ?? "").slice(0, 40)}")` : null;
  },
  aiAsksTold(L, r, i) {
    if (r.who !== "teacher") return null;
    const rows = L.rows ?? [];
    const q = lastQ(r.text);
    if (!q) return null;
    const kid = [...rows.slice(0, i)].reverse().find((x) => x.who === "child");
    if (seamsOf(r).includes("aiQuestion") && /favou?rite/i.test(q) && kid) {
      const named = wordsOf(kid.text).filter((w) => w.length > 2 && !TASTE_WORDS.has(w));
      if (named.length) return `her AI line asks a favourite the child's question named ("${String(kid.text).slice(0, 40)}"): "${q}"`;
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
