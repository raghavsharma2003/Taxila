// Round 2 (conversation stream, 2026-10-07): what comes BEFORE the card question when no reply could be written (the reply
// model failed, timed out, hit a 429, or every repair left nothing). Before this, brain/say.js fallbackReply() returned the
// card question alone, so a model outage on a turn where the child asked something became a bare re-ask: owner-2 on prod
// (2026-10-06) R3 bare question x4 and the R2 fallback line, and quotas are maxed (docs/ops/MODEL-STACK.md), so 429s are
// the common degradation, not the rare one.
//
// Code, not a model: a short fixed lead chosen by what the move is doing (the request it answers, or a nudge on a re-pose),
// then the verified question byte for byte (compose.js composeTurn). These are fixed code lines, never prompt text, so they
// cannot be recited out of a prompt; each is generic enough to be true on any topic. Identity keeps the floor: a child who
// asked "are you a robot?" hears "I am an AI teacher" even with every model down (never deny being an AI). PURE.

/** Fixed leads, tum forms (say.js turns them into aap forms for an "aap" child, as it does every fixed line). */
export const FALLBACK_LEADS = {
  hinglish: {
    identity: "Main ek AI teacher hoon, koi insaan nahi.",
    unclear: "Mujhe poori baat saaf sunai nahi di, ek baar phir se bolo ya baat poori karo.",
    adult: "Namaste ji, zaroor, hum isi par aaram se kaam karte hain.",
    help: "Koi baat nahi, isko ek baar aur aaram se dekhte hain.",
    oob: "Woh baat hum yahan nahi karenge, chalo apne kaam par wapas chalte hain.",
    other: "Theek hai, chalo isi sawaal par wapas aate hain.",
    back: "Wapas aa gaye, chalo wahin se aage badhte hain.",
  },
  english: {
    identity: "I'm an AI teacher, not a person.",
    unclear: "I didn't catch all of that, so say it once more or finish your thought.",
    adult: "Hello, of course, we will work on this calmly.",
    help: "No problem, let's look at this once more, slowly.",
    oob: "That's not something we'll do here, so let's come back to our work.",
    other: "Okay, let's come back to this question.",
    back: "Welcome back, let's pick up right where we were.",
  },
};

// Round 3 (conversation stream, 2026-10-09): the same fixed lead twice in one lesson is a repeat (owner-2 R4: Jaccard >= 0.8
// to an earlier line), and round 3 uses these leads as the LAST repair of a re-pose still bare after every model repair
// (brain/say.js), not only on an outage. So each generic lead has variants, and `avoid` (her earlier lines this lesson)
// picks one she has not said yet. The first variant is the line above, so a call without `avoid` is unchanged.
export const LEAD_VARIANTS = {
  hinglish: {
    help: [FALLBACK_LEADS.hinglish.help, "Achha, chalo is sawaal ko ek baar phir dhyaan se padhte hain.", "Theek hai, isko aaram se phir se sochte hain."],
    other: [FALLBACK_LEADS.hinglish.other, "Achha, ab phir isi sawaal ki taraf chalte hain.", "Chalo, ab is sawaal ko phir dekhte hain."],
  },
  english: {
    help: [FALLBACK_LEADS.english.help, "Okay, let's read this one again carefully.", "That's alright, let's think about this one again."],
    other: [FALLBACK_LEADS.english.other, "Alright, let's go back to this question.", "Okay, let's look at this question again."],
  },
};
const normL = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** The first of `list` not already said in `avoid` (her earlier lines), else the first. PURE. */
export const freshOf = (list, avoid = []) => list.find((x) => x && !avoid.some((a) => normL(a).includes(normL(x)))) ?? list[0];

// requests whose fallback is a nudge (the kit's own hint when it is safe to say, else the generic "help" lead)
const HELP = new Set(["confused", "clarify", "repeat", "slower", "easier", "frustration", "stuck", "dont_know", "explain", "example", "another"]);
// requests that end or pause the lesson are never fallback-led here (the closing lines own them)
const NONE = new Set(["stop", "goodbye", "break"]);

/**
 * The lead for a fallback turn with a card question, or "" (the question alone, as before). PURE.
 * @param {{ request?: string|null, hint?: string, rePose?: boolean, lang?: string }} t
 *   request: the move's request type (state.lastMove.request); hint: the kit hint's statements at this hint level, already
 *   checked by say.js hintStatements (never the key); rePose: the same question is being put again.
 */
export function fallbackLead({ request = null, hint = "", rePose = false, lang = "hinglish", avoid = [] } = {}) {
  const key = lang === "english" ? "english" : "hinglish";
  const L = FALLBACK_LEADS[key], V = LEAD_VARIANTS[key];
  const r = request ? String(request) : null;
  // a hint she already said this lesson is not used again (it would be a repeat); the generic nudge is
  const h = String(hint || "").trim();
  const hintOr = (k) => (h && !avoid.some((a) => normL(a).includes(normL(h))) ? h : freshOf(V[k], avoid));
  if (r && NONE.has(r)) return "";
  if (r === "identity") return L.identity;
  if (r === "unclear") return L.unclear;
  if (r === "adult") return L.adult;
  // round 3: back after a break / a moment away (the generic "no problem, once more" read oddly to a child just back)
  if (r === "back") return L.back;
  if (r === "oob" || r === "decline") return L.oob;
  if (r && HELP.has(r)) return hintOr("help");
  if (r) return freshOf(V.other, avoid);
  // no request: a re-pose after a wrong or unsure answer is a nudge (the hint), a first pose stays the question alone
  if (rePose) return hintOr("help");
  return "";
}
