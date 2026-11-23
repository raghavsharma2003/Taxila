// to-brain 049 B6 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md, carried from 047): the predicates B6 adds, each pinned
// on its director32 rows (tests/r8-director32-049-b6.test.mjs, replayed with that run's own script snapshot) before it reads the dry matrix.
//   dekhoOver   "Dekho," more than three times in a lesson, or twice within four of her turns
//   returnAsksAgain  a return (or her question after the AI line) asking what the child's aside already told, or "yeh tumne bataya tha" of
//                    something she is hearing for the first time
const DEKHO = /(?<![\p{L}])Dekho,/gu;
/** "Dekho," said in a row's text. */
const dekhoIn = (r) => (String(r?.text ?? "").match(DEKHO) ?? []).length;

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const wordsOf = (t) => low(t).replace(/[^\p{L}\p{N}\s]+/gu, " ").split(" ").filter(Boolean);
/** Words of an aside that name nothing (who, when, liking, the plain verbs). */
const ASIDE_STOP = new Set(("kal aaj maine mujhe main mera meri mere hum humne tum tumhe aap aapko ne ko ki ka ke se mein par aur bhi toh to na hai hain hoon tha thi the "
  + "pasand achha achhi achhe lagta lagti bahut khela khelta khelti khele maara mara kiya kiye gaya gayi dekha dekhi gaye raha rahi rahe ek wala wali haan nahi "
  + "kya baare sabse uske usmein usme uski uska woh yeh aapko aap kaise kyun kaun batao bataoge baat").split(" "));
/** A question asking what the child likes best in it, or what it was (answered by an aside that named a thing). */
const LIKE_Q = /(?:sabse (?:achha|achhi|mazedaar|pasand)|kyun pasand|kya cheez|kya-kya hota)/i;
/** A question asking them to tell (more) about it (answered by the aside said on the turn just before). */
const TELL_Q = /(?:aur kya bataoge|kuch aur bataoge|thoda aur batao|kya bata rahe the|kya batana chahoge|baare mein batao)/i;
const lastQ = (t) => (String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter((x) => /\?\s*$/.test(x)).at(-1) ?? "");

export const D33_PREDICATES = {
  /** B6: "Dekho," at most three times a lesson, and never within four of her turns (director32: 8 to 10 in every steady lesson). Gated. */
  dekhoOver(L, r, i) {
    if (r.who !== "teacher" || !dekhoIn(r)) return null;
    const hers = (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher");
    const before = hers.reduce((a, x) => a + dekhoIn(x), 0);
    if (before + dekhoIn(r) > 3) return `"Dekho," the ${before + dekhoIn(r)}th time in the lesson`;
    if (dekhoIn(r) > 1) return `"Dekho," twice in one turn`;
    const k = hers.slice(-4).reverse().findIndex((x) => dekhoIn(x));
    return k >= 0 ? `"Dekho," again ${k + 1} of her turns after the last` : null;
  },
  /** B6 (047 R7): the return uses what the child said — a return (or her question after the AI line) never asks what their aside already
   *  told, and "yeh tumne bataya tha" is said only of something told before (director32: c4 offtopic 56; c5-t01 steady 42, steering 38;
   *  c5-t03 offtopic 48; c6 steering 38; c4-ch01 offtopic 50). Counted: the return's question and the again line are brain/say.js's. */
  returnAsksAgain(L, r, i) {
    if (r.who !== "teacher") return null;
    const kids = (L.rows ?? []).slice(0, i).map((x, n) => ({ ...x, n })).filter((x) => x.who === "child");
    const again = /(?:^|[.!?]\s+)haan, ([^.!?]{2,40}), yeh tumne bataya tha/i.exec(String(r.text ?? ""))?.[1];
    if (again && !kids.slice(0, -1).some((x) => low(x.text).includes(low(again)))) return `"yeh tumne bataya tha" of "${again}", said first on the child's turn just before`;
    const q = lastQ(r.text);
    if (!q || !(r.returnSaid || /\bAI teacher\b/.test(String(r.text ?? "")))) return null;
    // (the topic: a word of the question the child said in an earlier line)
    const qw = new Set(wordsOf(q).filter((w) => !ASIDE_STOP.has(w) && w.length > 2));
    const about = kids.filter((x) => wordsOf(x.text).some((w) => qw.has(w)));
    if (!about.length) return null;
    const topic = new Set(wordsOf(q).filter((w) => about.some((x) => wordsOf(x.text).includes(w))));
    const prevKid = kids.at(-1);
    if (TELL_Q.test(q) && prevKid && about.includes(prevKid) && wordsOf(prevKid.text).some((w) => !ASIDE_STOP.has(w) && !topic.has(w)))
      return `asks them to tell about it straight after they told it: "${q.slice(0, 50)}"`;
    if (LIKE_Q.test(q)) {
      const named = about.find((x) => wordsOf(x.text).some((w) => !ASIDE_STOP.has(w) && !topic.has(w)))
        ?? kids.find((x) => LIKE_Q.test(lastQ((L.rows ?? [])[x.n - 1]?.text)) && wordsOf(x.text).length);
      if (named) return `asks what they like in it after they said "${String(named.text).slice(0, 40)}"`;
    }
    return null;
  },
};
