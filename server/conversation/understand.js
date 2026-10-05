// UNDERSTAND (CONVERSATION-V2 §4.1, promoted from prototypes/reset/conversation-v2/understand.mjs): a model reads what
// the child MEANS and returns a NOTE. It never grades, never decides the move (code does: policy.js + state.js), and never
// writes words the child hears. The model reads; code decides; the reply model words the move (model-full-orchestrator
// broke hard rules 15/72; code 23/24 with 0 breaks).
//
// Model: taxila-gpt6 (gpt-6-sol, effort none): 330/355 (93%) policy-move accuracy vs the prod classifier's 313/355 (88%)
// in the 2026-10-04 bake-off (evals/conversation-v2/results/2026-10-04-run1/understand-bakeoff). Override with
// TAXILA_UNDERSTAND_DEPLOY. It is called only when the bytes decided nothing (classifyFast had no result), started in
// parallel with classify(), and waited on only when classify() says the turn is not an answer (no_evidence) — so an
// answer turn never waits on it.
//
// Degrades, never fails (quotas are maxed): a 429 opens a breaker for BREAKER_MS (no calls), any error, timeout, refusal,
// content filter or unusable JSON returns null, and the turn takes today's path (the code-first readings and the Director).
// A content-filter block on the NOTE is not a distress signal here: classify() already ran the child's words through the
// filter and the predicate (the floor never depends on this call; a note's distress is OR-ed in, never subtracted).
import { chat, isContentFilter } from "../azure.js";
import { scrubPii } from "../director/safety.js";

export const INTENTS = Object.freeze([
  "answer_correct", "answer_wrong", "answer_partial", "answer_hedged", "thinking_aloud", "self_correction", "dont_know", "ask_for_answer",
  "insist_wrong", "check_my_work", "question_on_topic", "clarify", "curiosity_offlesson", "explain_differently", "method_instruction", "example",
  "story", "visual_request", "game_request", "animation_request", "slower", "skip_ahead", "harder", "easier", "language_switch", "repeat",
  "change_topic", "skip_item", "diversion", "insistence", "out_of_bounds", "insistence_oob", "joke", "small_talk", "identity", "personal_share",
  "meta_feedback", "boredom", "frustration", "break_request", "distress", "end_request", "leaving", "backchannel", "noise", "adult_voice",
]);

// Telegraphic definitions. The bake-off's combined lines ("example|story", "harder|easier") were read as one label by
// two arms (CONVERSATION-V2 §7): every intent has its own line here.
const DEFS = [
  "answer_correct: a full answer to the question on the table that matches the KEY",
  "answer_wrong: a full answer that does not match the KEY",
  "answer_partial: only part of a multi-part key",
  "answer_hedged: an answer wrapped in doubt (shayad, maybe, not sure)",
  "thinking_aloud: reasoning in progress, no final answer yet (ruko, soch raha hoon, so first...)",
  "self_correction: gives one answer then replaces it (nahi nahi wait, actually); answer = the final one",
  "dont_know: no attempt, says they do not know",
  "ask_for_answer: wants to be told the answer",
  "insist_wrong: holds to a wrong answer after being nudged, or says the teacher is wrong",
  "check_my_work: gives an answer AND asks if it is right",
  "question_on_topic: asks a real question about THIS lesson's idea",
  "clarify: does not understand the question or a word in it (matlab?, what does X mean)",
  "curiosity_offlesson: a real learning question about something else (science, space, nature, how things work)",
  "explain_differently: wants another way of explaining",
  "method_instruction: tells her HOW to teach (step by step, picture first, let me try first, use X example, short sentences, no options)",
  "example: asks for an example",
  "story: asks for it as a story",
  "visual_request: diagram, picture, drawing, board, screen",
  "game_request: wants a game or a fun activity",
  "animation_request: video, animation, show it moving",
  "slower: she should talk slower or simpler",
  "skip_ahead: already knows it, move on faster, skip the explanation",
  "harder: wants a harder question",
  "easier: wants an easier question",
  "language_switch: asks her to speak another language (lang_to)",
  "repeat: did not hear, say it again",
  "change_topic: wants to do something else, another topic or subject (NOT stopping the lesson)",
  "skip_item: skip this question, next one",
  "diversion: chat about something unrelated that is not a learning question (cricket, games, films, pets, food, friends)",
  "insistence: pushes again for an in-bounds off-lesson topic after she put it aside",
  "out_of_bounds: not okay in a child's lesson (scary or horror, sexual or romantic, violence, hacking, hurtful pranks, swear words, personal address or phone, politics, doing homework for them)",
  "insistence_oob: pushes again for an out_of_bounds thing after a decline",
  "joke: humour, teasing, a playful line",
  "small_talk: a friendly question about her (how are you, favourite colour, where do you live)",
  "identity: asks whether she is human, AI, a robot, ChatGPT, has a body",
  "personal_share: tells something from their life (birthday, a match won, exam tomorrow)",
  "meta_feedback: comments on her or the lesson (you talk too much, good teacher, confusing, boring teacher)",
  "boredom: bored, sleepy, how much longer, not fun",
  "frustration: finds the work hard, wants to give up on it, negative about self in the work; not unsafe",
  "break_request: wants a short pause (water, bathroom, brb, 5 minutes)",
  "distress: unsafe, hurt, abused, very frightened, may harm themself; always also distress:true",
  "end_request: wants to stop or end the lesson (done, bas, khatam, stop the class)",
  "leaving: must go now because of real life (mummy calling, tuition, food ready, bye)",
  "backchannel: ok, hmm, haan, achha with no content",
  "noise: garbled or broken words, cannot tell what they mean",
  "adult_voice: a parent or another adult is speaking, not the child",
];

export const SYSTEM = [
  "You read ONE turn from an Indian school child (class 1-9) in a live lesson with an AI teacher and say what the child MEANS. You never grade freely, never decide what the teacher does, never write words for the child.",
  "Hindi, English or Hinglish, Roman or Devanagari; spoken turns come from speech recognition and may have small errors.",
  "Intent ids (the ONE that best says what the child wants now; 'also' for a second need in the same breath):",
  ...DEFS.map((d) => `- ${d}`),
  "Ties: distress beats everything; leaving and end_request beat boredom; an answer plus 'is it right?' is check_my_work; a wrong answer said again after a nudge is insist_wrong; an off-lesson learning question is curiosity_offlesson, off-lesson chat is diversion.",
  "Return JSON only: {\"intent\":\"\",\"also\":[],\"answer\":\"\",\"topic\":\"\",\"learning\":false,\"in_bounds\":true,\"lang_to\":\"\",\"method\":\"\",\"distress\":false,\"confidence\":0.0}",
].join("\n");

/** ctx: { cls, topicTitle, phase, teacherLast, ask, key, earlier: [{ child, teacher }], said } (all already masked by the caller). */
export function userPrompt(ctx) {
  return [
    `CLASS ${ctx.cls ?? 5}, LESSON: ${String(ctx.topicTitle ?? "").slice(0, 80)}. MOMENT: ${ctx.phase ?? "lesson"}.`,
    `TEACHER JUST SAID: ${String(ctx.teacherLast ?? "").slice(0, 400)}`,
    ctx.ask ? `QUESTION ON THE TABLE: ${String(ctx.ask).slice(0, 300)}` : "QUESTION ON THE TABLE: none (teaching)",
    ctx.key ? `KEY: ${String(ctx.key).slice(0, 120)}` : "",
    ...(ctx.earlier ?? []).slice(-2).flatMap((e) => [`CHILD EARLIER: ${String(e.child ?? "").slice(0, 200)}`, `TEACHER EARLIER: ${String(e.teacher ?? "").slice(0, 300)}`]),
    `CHILD NOW: ${String(ctx.said ?? "").slice(0, 400)}`,
  ].filter(Boolean).join("\n");
}

/** Code fills the language slot when the model names the switch but not the target (gpt-6-sol left lang_to empty 10/10). */
export function inferLang(said) {
  const t = String(said ?? "").toLowerCase();
  if (/hinglish/.test(t)) return "hinglish";
  if (/hindi|हिंदी|हिन्दी/.test(t)) return "hindi";
  if (/english|angrezi|अंग्रेज़ी|अंग्रेजी|इंग्लिश/.test(t)) return "english";
  return "";
}
const LANG = { hindi: "hindi", hi: "hindi", "hi-in": "hindi", english: "english", en: "english", "en-in": "english", hinglish: "hinglish", "हिंदी": "hindi" };

/** Validate a model's note; null when unusable (the caller then keeps the code-only reading). PURE. */
export function parseNote(j, said = "") {
  if (!j || typeof j !== "object" || !INTENTS.includes(j.intent)) return null;
  const also = (Array.isArray(j.also) ? j.also : []).filter((x) => INTENTS.includes(x) && x !== j.intent).slice(0, 2);
  const lang = LANG[String(j.lang_to ?? "").trim().toLowerCase()] ?? "";
  return {
    intent: j.intent, also,
    answer: String(j.answer ?? "").slice(0, 120),
    topic: String(j.topic ?? "").replace(/[^\p{L}\p{N} ,'-]/gu, "").trim().slice(0, 60),
    learning: j.learning === true,
    inBounds: j.in_bounds !== false,
    langTo: lang || ([j.intent, ...also].includes("language_switch") ? inferLang(said) : ""),
    method: String(j.method ?? "").replace(/[^\p{L}\p{N} ,'-]/gu, "").trim().slice(0, 80),
    distress: j.distress === true || j.intent === "distress",
    confidence: Math.max(0, Math.min(1, Number(j.confidence ?? 0.5) || 0)),
  };
}

export const BREAKER_MS = 30_000;
let openUntil = 0;
/** Injectable for tests; production uses azure.js. */
export const understandDeps = { chat, now: () => Date.now() };
export const understandDeploy = () => process.env.TAXILA_UNDERSTAND_DEPLOY || "taxila-gpt6";
/** Tests only: close the breaker. */
export const resetBreaker = () => { openUntil = 0; };

/**
 * The note for one child turn, or null (breaker open, error, timeout, unusable). Never throws.
 * @param {{ cls?: number, topicTitle?: string, phase?: string, teacherLast?: string, ask?: string|null, key?: string|null,
 *   earlier?: { child: string, teacher: string }[], said: string, trace?: object[], timeoutMs?: number }} ctx
 */
export async function understand(ctx) {
  const t0 = understandDeps.now();
  if (t0 < openUntil) return null;
  const said = scrubPii(String(ctx.said ?? "")).text;
  if (!said.trim()) return null;
  const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt({ ...ctx, said }) }];
  try {
    const r = await understandDeps.chat(understandDeploy(), messages, { json: true, maxTokens: 160, effort: "none", timeoutMs: ctx.timeoutMs ?? 2400,
      retries: 0, trace: ctx.trace, quotaLane: "hot" });
    return parseNote(r?.json, ctx.said);
  } catch (e) {
    if (e?.status === 429) openUntil = understandDeps.now() + BREAKER_MS;
    if (!isContentFilter(e)) console.warn(`[understand] note unavailable (${e?.status ?? ""} ${String(e?.message ?? e).slice(0, 80)}): code-only reading`);
    return null;
  }
}
