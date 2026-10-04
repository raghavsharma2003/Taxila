// UNDERSTAND — prototype of CONVERSATION-V2 §4 step 1: a model reads what the child MEANS and returns a note; it never
// decides the move (code does: policy.mjs) and never writes words the child hears. Not imported by server/ or src/.
//
// The note is one JSON object per child turn:
//   intent    one id from INTENTS (the battery's gold taxonomy, CONVERSATION-V2 §2)
//   also      up to 2 further ids when the child asked for two things at once ("samajh nahi aaya, Hindi mein batao")
//   answer    the child's FINAL answer text if they gave one ("" if none) — code grades it against the key
//   topic     <= 6 words: what an off-lesson question / diversion is about (what gets parked)
//   learning  true when an off-lesson ask is a real learning question (curiosity), false for chat / games / films
//   in_bounds false when the ask is out of bounds for a child's lesson (scary, sexual, violent, cheating, personal data,
//             politics, insults)
//   lang_to   "hindi" | "english" | "" — the language the child asked her to switch to
//   method    <= 8 words: the "do it this way" instruction, if any
//   distress  true only for signs the child is unsafe, hurt, abused, very frightened or may harm themself
//   confidence 0-1
// Prompt text is telegraphic definitions (inherited law: sentence-shaped text gets recited — irrelevant here because
// nothing in this note reaches the child, but the notes stay shapes so they can move into a child-facing prompt safely).

export const INTENTS = [
  "answer_correct", "answer_wrong", "answer_partial", "answer_hedged", "thinking_aloud", "self_correction", "dont_know", "ask_for_answer",
  "insist_wrong", "check_my_work", "question_on_topic", "clarify", "curiosity_offlesson", "explain_differently", "method_instruction", "example",
  "story", "visual_request", "game_request", "animation_request", "slower", "skip_ahead", "harder", "easier", "language_switch", "repeat",
  "change_topic", "skip_item", "diversion", "insistence", "out_of_bounds", "insistence_oob", "joke", "small_talk", "identity", "personal_share",
  "meta_feedback", "boredom", "frustration", "break_request", "distress", "end_request", "leaving", "backchannel", "noise", "adult_voice",
];

const DEFS = [
  "answer_correct|answer_wrong|answer_partial: a full answer to the question on the table — right per KEY / wrong / only part of a multi-part key",
  "answer_hedged: an answer wrapped in doubt (shayad, maybe, not sure)",
  "thinking_aloud: reasoning in progress, no final answer yet (ruko, soch raha hoon, so first...)",
  "self_correction: gives one answer then replaces it (nahi nahi wait, actually) — answer = the final one",
  "dont_know: no attempt, says they do not know",
  "ask_for_answer: wants to be told the answer",
  "insist_wrong: holds to a wrong answer after being nudged, or says the teacher is wrong",
  "check_my_work: gives an answer AND asks if it is right",
  "question_on_topic: asks a real question about THIS lesson's idea",
  "clarify: does not understand the question or a word in it (matlab?, what does X mean)",
  "curiosity_offlesson: a real learning question about something else (science/space/nature/how things work)",
  "explain_differently: wants another way of explaining",
  "method_instruction: tells her HOW to teach (step by step, picture first, let me try first, use X example, short sentences, no options, ask me questions)",
  "example|story: asks for an example / for it as a story",
  "visual_request: diagram, picture, drawing, board, screen",
  "game_request: wants a game/fun activity",
  "animation_request: video, animation, show it moving",
  "slower: she should talk slower/simpler",
  "skip_ahead: already knows it, move on faster, skip the explanation",
  "harder|easier: wants a harder / easier question",
  "language_switch: asks her to speak another language (lang_to)",
  "repeat: did not hear, say it again",
  "change_topic: wants to do something else / another topic or subject (NOT stopping the lesson)",
  "skip_item: skip this question, next one",
  "diversion: chat about something unrelated and not a learning question (cricket, games, films, pets, food, friends)",
  "insistence: pushes again for an in-bounds off-lesson topic after she deferred it",
  "out_of_bounds: asks for something not okay in a child's lesson (scary/horror, sexual/romantic, violence/hacking/pranks that hurt, swear words, personal address/phone, politics, doing homework for them)",
  "insistence_oob: pushes again for an out_of_bounds thing after a decline",
  "joke: humour, teasing, playful line",
  "small_talk: friendly question about her (how are you, favourite colour, where do you live)",
  "identity: asks whether she is human/AI/robot/ChatGPT/has a body",
  "personal_share: tells something from their life (birthday, match won, exam tomorrow)",
  "meta_feedback: comments on her or the lesson (you talk too much, you're a good teacher, confusing, boring teacher)",
  "boredom: bored, sleepy, how much longer, not fun",
  "frustration: finding the work hard, wants to give up on it, negative about self in the work — not unsafe",
  "break_request: wants a short pause (water, bathroom, brb, 5 minutes)",
  "distress: unsafe, hurt, abused, very frightened, may harm themself — always also distress:true",
  "end_request: wants to stop/end the lesson (done, bas, khatam, stop the class)",
  "leaving: must go now because of real life (mummy calling, tuition, food ready, bye)",
  "backchannel: ok/hmm/haan/achha with no content",
  "noise: garbled or broken words, cannot tell what they mean",
  "adult_voice: a parent/adult is speaking, not the child",
];

export const SYSTEM = [
  "You read ONE turn from an Indian school child (class 4-7) in a live lesson with an AI teacher and say what the child MEANS. You never grade freely, never decide what the teacher does, never write words for the child.",
  "Hindi, English or Hinglish, Roman or Devanagari; spoken turns come from speech recognition and may have small errors.",
  "Intent ids (pick the ONE that best says what the child wants now; 'also' for a second need in the same breath):",
  ...DEFS.map((d) => `- ${d}`),
  "Ties: distress beats everything; leaving/end_request beat boredom; an answer plus 'is it right?' is check_my_work; a wrong answer said again after a nudge is insist_wrong; off-lesson learning question = curiosity_offlesson, off-lesson chat = diversion.",
  "Return JSON only: {\"intent\":\"\",\"also\":[],\"answer\":\"\",\"topic\":\"\",\"learning\":false,\"in_bounds\":true,\"lang_to\":\"\",\"method\":\"\",\"distress\":false,\"confidence\":0.0}",
].join("\n");

/** ctx: { cls, topicTitle, phase, teacherLast, ask, key, earlier: [{child, teacher}], said } */
export function userPrompt(ctx) {
  return [
    `CLASS ${ctx.cls}, LESSON: ${ctx.topicTitle}. MOMENT: ${ctx.phase ?? "lesson"}.`,
    `TEACHER JUST SAID: ${String(ctx.teacherLast ?? "").slice(0, 400)}`,
    ctx.ask ? `QUESTION ON THE TABLE: ${ctx.ask}` : "QUESTION ON THE TABLE: none (teaching)",
    ctx.key ? `KEY: ${ctx.key}` : "",
    ...(ctx.earlier ?? []).flatMap((e) => [`CHILD EARLIER: ${e.child}`, `TEACHER EARLIER: ${String(e.teacher ?? "").slice(0, 300)}`]),
    `CHILD NOW: ${ctx.said}`,
  ].filter(Boolean).join("\n");
}

/** Validate a model's note; null when unusable (the caller then falls back to the code-only reading). */
export function parseNote(j) {
  if (!j || typeof j !== "object" || !INTENTS.includes(j.intent)) return null;
  return {
    intent: j.intent,
    also: (Array.isArray(j.also) ? j.also : []).filter((x) => INTENTS.includes(x) && x !== j.intent).slice(0, 2),
    answer: String(j.answer ?? "").slice(0, 120),
    topic: String(j.topic ?? "").slice(0, 60),
    learning: j.learning === true,
    inBounds: j.in_bounds !== false,
    langTo: ["hindi", "english"].includes(j.lang_to) ? j.lang_to : "",
    method: String(j.method ?? "").slice(0, 80),
    distress: j.distress === true || j.intent === "distress",
    confidence: Math.max(0, Math.min(1, Number(j.confidence ?? 0.5))),
  };
}
