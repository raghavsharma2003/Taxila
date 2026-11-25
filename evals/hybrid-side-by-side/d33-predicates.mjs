// to-brain 049 B6 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md, carried from 047): the predicates B6 adds, each pinned
// on its director32 rows (tests/r8-director32-049-b6.test.mjs, replayed with that run's own script snapshot) before it reads the dry matrix.
//   dekhoOver   "Dekho," more than three times in a lesson, or twice within four of her turns
//   returnAsksAgain  a return (or her question after the AI line) asking what the child's aside already told, or "yeh tumne bataya tha" of
//                    something she is hearing for the first time
//   reasonTwice  at a worked example's close, a reason her step turn before said, said again (reasonTwiceAuthored, counted: a step's authored
//                right line after a verdict with the same reason)
//   keyCheckinBareCard  the next card straight after a key's check-in, with no joint
//   spentThenReturn  "nothing easier" followed in the same turn by an aside's return
//   startLineNotGreeting  the greeting's start line (joints.startAnyway) said anywhere but straight after the greeting
//   whyAltNoMiss  main's ruling of 2026-11-23 on B3: a card's marked whyAlt said as help when the child's last answer there was not its
//                 named wrong answer
import { vpcOf, VPC_WHOLE_MAX } from "./d30-predicates.mjs";
import { helpTurnOf, lastAnswerAt } from "./help-predicates.mjs";
import { helpPart, at, sentencesOf, normSentence } from "../../server/director/help.js";
// (main's ruling of 2026-11-23, item 2: "Suno," took "Dekho,"'s place — the lead-in openers together at most four a lesson, no one more than
// three, never two openers within four of her turns)
const LEAD_OPENERS = ["Dekho", "Suno"];
const openerIn = (r, o) => (String(r?.text ?? "").match(new RegExp(`(?<![\\p{L}])${o},`, "gu")) ?? []).length;
/** Lead-in openers said in a row's text. */
const dekhoIn = (r) => LEAD_OPENERS.reduce((a, o) => a + openerIn(r, o), 0);

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
/** Words of a liking question that are its frame, not its subject. */
const LIKE_FRAME = new Set("chalo achha mazedaar laga lagi lage cheez hota hoti hote favourite favorite like most best enjoy what about tell".split(" "));
/** The subject words of a question: the topic or name words it asks about (d37 RULING-G item 12). */
const subjectOf = (q) => new Set(wordsOf(q).filter((w) => !ASIDE_STOP.has(w) && !LIKE_FRAME.has(w) && w.length > 2));
/** d37 RULING-G item 12: an earlier answer to a liking question is this question's answer only where the two questions name the same
 *  subject, or this question names none ("Tumhe usmein sabse achha kya lagta hai?"). */
export const sameLikeSubject = (earlierQ, q) => {
  const s = subjectOf(q);
  if (!s.size) return true;
  const e = subjectOf(earlierQ);
  return [...s].some((w) => e.has(w));
};

export const D33_PREDICATES = {
  /** B6: "Dekho," at most three times a lesson, and never within four of her turns (director32: 8 to 10 in every steady lesson). Gated. */
  // (main's ruling of 2026-11-23: every lead-in opener — "Dekho," and "Suno," — at most four together, none more than three, none within four)
  dekhoOver(L, r, i) {
    if (r.who !== "teacher" || !dekhoIn(r)) return null;
    const hers = (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher");
    for (const o of LEAD_OPENERS) {
      const n = hers.reduce((a, x) => a + openerIn(x, o), 0) + openerIn(r, o);
      if (openerIn(r, o) && n > 3) return `"${o}," the ${n}th time in the lesson`;
    }
    const before = hers.reduce((a, x) => a + dekhoIn(x), 0);
    if (before + dekhoIn(r) > 4) return `a lead-in opener the ${before + dekhoIn(r)}th time in the lesson`;
    if (dekhoIn(r) > 1) return `two lead-in openers in one turn`;
    const k = hers.slice(-4).reverse().findIndex((x) => dekhoIn(x));
    return k >= 0 ? `a lead-in opener again ${k + 1} of her turns after the last` : null;
  },
  /** to-brain 049 B6.1, main's ruling of 2026-11-23: a right verdict split from its point (the row's noFit "vpc") ends on a go-on joint that
   *  is a statement, never on a comprehension check-in (as built at 65 words: 39 such check-ins in the 24 dry lessons, each straight after a
   *  right answer). Gated. */
  splitEndsOnCheckin(L, r) {
    if (r.who !== "teacher" || r.noFit !== "vpc") return null;
    const t = String(r.text ?? "").trim();
    return /\?\s*$/.test(t) ? `a right verdict split from its point ends on a question: "${t.slice(-50)}"` : null;
  },
  /** main's ruling of 2026-11-23: a verdict, reason, point and card turn of 66 to 70 words, said whole (counted; over 70 it is split —
   *  vpcUnlisted, gated). */
  vpcWhole(L, r) {
    if (r.who !== "teacher" || !vpcOf(r)) return null;
    const n = String(r.text ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    return n > 65 && n <= VPC_WHOLE_MAX ? `a verdict, reason, point and card said whole in ${n} words` : null;
  },
  /** B6 (047 R7): the return uses what the child said — a return (or her question after the AI line) never asks what their aside already
   *  told, and "yeh tumne bataya tha" is said only of something told before (director32: c4 offtopic 56; c5-t01 steady 42, steering 38;
   *  c5-t03 offtopic 48; c6 steering 38; c4-ch01 offtopic 50). Gated (main, 2026-11-23): brain/say.js returnQuestion, againInHerWords. */
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
    // (d37 RULING-G item 12: a liking question that names no subject is read against every earlier answer to a liking question)
    if (!about.length && !(LIKE_Q.test(q) && !subjectOf(q).size)) return null;
    const topic = new Set(wordsOf(q).filter((w) => about.some((x) => wordsOf(x.text).includes(w))));
    const prevKid = kids.at(-1);
    if (TELL_Q.test(q) && prevKid && about.includes(prevKid) && wordsOf(prevKid.text).some((w) => !ASIDE_STOP.has(w) && !topic.has(w)))
      return `asks them to tell about it straight after they told it: "${q.slice(0, 50)}"`;
    if (LIKE_Q.test(q)) {
      const named = about.find((x) => wordsOf(x.text).some((w) => !ASIDE_STOP.has(w) && !topic.has(w)))
        ?? kids.find((x) => { const eq = lastQ((L.rows ?? [])[x.n - 1]?.text); return LIKE_Q.test(eq) && sameLikeSubject(eq, q) && wordsOf(x.text).length; });
      if (named) return `asks what they like in it after they said "${String(named.text).slice(0, 40)}"`;
    }
    return null;
  },
  /** B6: the greeting's start line is said only at the greeting — "Theek hai, main shuru karti hoon." at a bridge's give-up (director32 c4
   *  stuck 62; c5-t01 stuck 64; c6-ch07 stuck 64) is the go-on joint. Gated. */
  startLineNotGreeting(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.prevT) return null;
    const start = (ctx.script?.joints?.startAnyway ?? []).flatMap((f) => [f?.hi, f?.en]).filter(Boolean).map(low);
    const said = (r.seams ?? []).some((x) => x.joint === "startAnyway" || x.right === "startAnyway")
      || (start.length && String(r.text ?? "").split(/(?<=[.!?])\s+/).some((x) => start.includes(low(x))));
    if (!said) return null;
    const greet = String(ctx.prevT.move ?? "") === "greet" || (ctx.prevT.seams ?? []).some((x) => ["greetSimpler", "greetAsk", "greetIntro"].includes(x.right));
    return greet ? null : "the greeting's start line said after the greeting";
  },
  /** B6 (047 R7): a reason is not said in two turns running at a worked close (director32 c4 steady 88 → 90; c5-t03 steady 56 → 58,
   *  74 → 76; c5-t01 steady 76 → 78; c6 steady 24 → 26; c6-ch07 steering 26 → 28). The turn's first part — its verdict or step confirmation
   *  and reason, up to "Toh poora jawab" — shares 60% of its content words (four at least) with her turn before, one of the two a worked
   *  example's. Gated. */
  reasonTwice(L, r, i, ctx) { return reasonRepeat(r, ctx, "close"); },
  /** B6, 047 R5's third bullet: "nothing easier" (helpSpent) is never followed in the same turn by an aside's return (director31 c4-ch01-t02
   *  stuck 68). Gated. */
  spentThenReturn(L, r) {
    if (r.who !== "teacher") return null;
    const sm = r.seams ?? [];
    const k = sm.findIndex((x) => x.right === "helpSpent" || x.joint === "helpSpent");
    return k >= 0 && (sm.slice(k + 1).some((x) => x.right === "return") || r.returnSaid) ? `"nothing easier" and then an aside's return` : null;
  },
  /** B6: a key's check-in never runs into the next card with no joint — her key (or help on a keyed card) ended on a check-in, and her next
   *  turn opens on a card with nothing before it (director32 c5-t01 stuck 50; c6-ch07 offtopic 66). Gated. */
  keyCheckinBareCard(L, r, i, ctx) {
    const p = ctx?.prevT;
    if (r.who !== "teacher" || !p) return null;
    const s0 = (r.seams ?? [])[0];
    if (!s0 || s0.left !== "start" || !["card", "returnCard"].includes(s0.right) || s0.joint) return null;
    const ps = p.seams ?? [];
    if (ps.at(-1)?.right !== "checkin" || p.check?.itemId && !p.check?.gave && p.card) return null;
    return ps.some((x) => x.right === "key") || p.cell?.keyed ? "the next card straight after a key's check-in, with no joint" : null;
  },
  /** B6, its other shape, counted: a worked step's authored right line (`ask.right`) said straight after a verdict that gave the same reason
   *  (dry c4 steady 88, offtopic 20, steering 38: "Haan, 5: barfi 5 barabar tukdon mein kati thi." after the card's why) — the words are the
   *  script's; Learning's to rewrite, code does not cut an authored line. */
  reasonTwiceAuthored(L, r, i, ctx) { return reasonRepeat(r, ctx, "step"); },
  /** Main's ruling of 2026-11-23 on to-brain 049 B3: a card's marked `whyAlt` (`whyAltAsHelp: true`, written to the child who gave its
   *  named wrong answer) said as help while the child's most recent answer at that card was not that answer — a request with no answer yet,
   *  a give-up, another wrong answer, a request after a right answer or a key (dry c4-ch05-t01 steady 96 to 98: "3 kehne mein …" to a clarify
   *  after a right answer). Reads the script the lesson was run with. Gated. */
  whyAltNoMiss(L, r, i, ctx) {
    const why = whyAltNoMissOf(L, r, i, ctx);
    return why ? why.why : null;
  },
};
/** whyAltNoMiss's reading, with its kind: { kind: "noAnswer" | "giveUp" | "otherWrong" | "afterRightOrKey", why } | null. */
export function whyAltNoMissOf(L, r, i, ctx) {
  // (to-brain 051 C3: a picture request with nothing left to draw is help too — director33 c5-ch02-t03 steering 16)
  const h = helpTurnOf(L, r, i, ctx) ?? (r.who === "teacher" && r.cell?.column === "picture" && ["hint", "none"].includes(r.cell?.picture) && r.cell?.part
    ? { request: "picture", part: r.cell.part, keyed: !!r.cell.keyed } : null);
  if (!h) return null;
  const part = helpPart(ctx.script, h.part);
  if (!part || at(ctx.script, `${part.path}.whyAltAsHelp`) !== true) return null;
  const wa = at(ctx.script, `${part.path}.whyAlt`);
  const ss = [wa?.hi, wa?.en, typeof wa === "string" ? wa : null].filter(Boolean).flatMap(sentencesOf).map((x) => normSentence(x.replace(/\{\w+\}/g, " "))).filter((k) => k.split(" ").length >= 4);
  const T = normSentence(r.text);
  if (!ss.some((k) => T.includes(k))) return null;
  const last = lastAnswerAt(L, i, ctx, h.part);
  if (last?.named) return null;
  const kind = last?.right || (!last && h.keyed) ? "afterRightOrKey" : last ? "otherWrong" : h.request === "give_up" ? "giveUp" : "noAnswer";
  const said = last ? `its last answer "${last.text.slice(0, 20)}" (${last.read})` : "no answer at it yet";
  return { kind, why: `the marked whyAlt of ${h.part.split(":").slice(-2).join(":")} said as help (${h.request}${h.keyed ? ", keyed" : ""}), ${said}` };
}
function reasonRepeat(r, ctx, want) {
  {
    const p = ctx?.prevT;
    if (r.who !== "teacher" || !p) return null;
    const sm = (r.seams ?? []).map((x) => x.right);
    if (!sm.includes("verdict") && !sm.includes("stepConfirm")) return null;
    // (at a worked close: this turn closes a worked example — "Toh poora jawab" — after her step turn, or confirms a step right after the
    // verdict before it)
    const close = /Toh poora jawab/.test(String(r.text ?? "")) && (p.seams ?? []).some((x) => ["workedStep", "stepConfirm"].includes(x.right));
    const step = sm[0] === "stepConfirm" && (p.seams ?? []).some((x) => x.right === "verdict");
    if (want === "close" ? !close : !step) return null;
    const pp = r.pageParts ?? [];
    let head = String(r.text ?? "").slice(0, pp[1]?.from ?? undefined);
    head = head.split(/Toh poora jawab/)[0];
    const cw = (t) => [...new Set(wordsOf(t).filter((w) => /\d/.test(w) || (w.length > 3 && !ASIDE_STOP.has(w) && !REASON_STOP.has(w))))];
    // (her turn before's reasons: its sentences that ask nothing — its question and its card are what this turn answers, not a reason)
    const said = String(p.text ?? "").split(/(?<=[.!?])\s+/).filter((x) => !/\?\s*$/.test(x) && !(p.card && low(p.card).includes(low(x)))).join(" ");
    const mine = cw(head), before = new Set(cw(said));
    const shared = mine.filter((w) => before.has(w));
    return mine.length && shared.length >= 4 && shared.length / mine.length >= 0.6 ? `the reason said again (${shared.length}/${mine.length}: ${shared.slice(0, 5).join(" ")})` : null;
  }
}
const REASON_STOP = new Set("sahi bilkul theek haan jawab dekho suno kyunki isliye matlab yaani hota hoti hote hua hue hain".split(" "));
