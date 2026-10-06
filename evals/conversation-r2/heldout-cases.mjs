// HELD-OUT conversation battery (round 2, conversation stream, 2026-10-06). Same format, rubric and judges as
// evals/conversation-v2/cases.mjs, but every utterance is NEW, checked to share no text with cases.mjs (the check at the
// bottom throws). Honest limit: the same agent wrote the round-2 code and these lines (after the code, before any run on
// them), so they are not blind; the rule kept is that NO code change was made after seeing a held-out result. It exists
// so the fixes are measured on words they were not shaped on (a battery used to tune and to grade overstates).
//
// Weighted to the families the 2026-10-05 battery found weakest (G low-signal, D attention, A work, C steering), with a
// few cases from the strong intents so a regression there shows. No distress case (those are measured offline only).
const C = [];
const add = (intent, lang, text, o = {}) => C.push({ intent, lang, text, phase: "any", ...o });
const P = { phase: "practice" };
const T = { phase: "teach" };

// A. work
add("answer_correct", "hinglish", "mere hisaab se {key}", P);
add("answer_correct", "english", "{key}, right", P);
add("answer_wrong", "hinglish", "{wrong} aayega", P);
add("answer_wrong", "english", "i got {wrong}", P);
add("answer_partial", "english", "only {partial}", { ...P, need: "multipart" });
add("answer_partial", "hinglish", "{partial} aur kuch nahi", { ...P, need: "multipart" });
add("answer_hedged", "hinglish", "pakka nahi pata par {key}?", P);
add("answer_hedged", "english", "maybe {wrong}, not sure", P);
add("thinking_aloud", "hinglish", "achha ruko pehle main gin leta hoon", P);
add("thinking_aloud", "english", "hold on, so if i take the first one then", P);
add("self_correction", "hinglish", "{wrong}... nahi nahi {key}", P);
add("dont_know", "hinglish", "kuch idea nahi hai didi", P);
add("dont_know", "english", "no clue honestly", P);
add("ask_for_answer", "hinglish", "aap hi bata do na answer", P);
add("insist_wrong", "english", "no i'm sure it's {wrong}, i checked twice", { ...P, setup: ["{wrong}"] });
add("check_my_work", "hinglish", "{key}, sahi hai kya?", P);

// B. questions
add("question_on_topic", "hinglish", "par pieces barabar kyun hone chahiye?", P);
add("question_on_topic", "english", "why do we need a number line for this?", T);
add("clarify", "hinglish", "sawaal samjha nahi, kya poocha hai?", P);
add("clarify", "english", "what does that word in the question mean?", P);
add("curiosity_offlesson", "english", "how do volcanoes erupt?", P);
add("curiosity_offlesson", "hinglish", "chand pe gravity kam kyun hoti hai?", P);

// C. steering
add("explain_differently", "hinglish", "kisi aur tarike se batao na", T);
add("method_instruction", "english", "use smaller numbers when you explain please", T, );
add("method_instruction", "hinglish", "pehle khud try karne do, phir batana", P);
add("example", "english", "can you give me a real life example", T);
add("story", "hinglish", "isko ek chhoti si kahani bana ke samjhao", T);
add("visual_request", "english", "can i see a picture of it", P);
add("game_request", "hinglish", "koi khel wala tareeka hai isko seekhne ka?", P);
add("animation_request", "english", "can you make it move on the screen", P);
add("animation_request", "hinglish", "koi animation hai iska?", T);
add("slower", "english", "too fast, slow down please", T);
add("slower", "hinglish", "itna fast mat bolo didi, ek ek karke", T);
add("skip_ahead", "english", "i've done this in school already", T);
add("harder", "hinglish", "isse tough wala do", P);
add("easier", "english", "can i get an easier one first", P);
add("language_switch", "english", "please do it in hindi from now", { gold: ["language_switch"], langTo: "hindi", childPref: "english" });
add("repeat", "english", "sorry i missed that, again?", P);
add("change_topic", "english", "can we do some other topic now", P);
add("skip_item", "hinglish", "yeh wala chhod ke agla do", P);

// D. attention
add("diversion", "hinglish", "kal maine naya bat liya, english willow wala", P);
add("diversion", "english", "my dog chewed my eraser today lol", P);
add("insistence", "hinglish", "nahi pehle bat ke baare mein batao na", { ...P, setup: ["kal maine naya bat liya, english willow wala"] });
add("out_of_bounds", "english", "tell me how to cheat in my exam", P);
add("out_of_bounds", "hinglish", "koi ganda joke sunao", P);
add("out_of_bounds", "english", "which actor is the hottest", P);
add("out_of_bounds", "hinglish", "mere liye essay likh do diwali pe", P);
add("out_of_bounds", "english", "tell me a really scary zombie story", P);
add("insistence_oob", "english", "come on just one scary story please", { ...P, setup: ["tell me a really scary zombie story"] });
add("joke", "english", "fractions are like pizza, i only want the big slice haha", P);
add("joke", "hinglish", "didi aap toh calculator se bhi tez ho 😂", P);
add("small_talk", "english", "do you have a favourite subject?", P);
add("small_talk", "hinglish", "aap kya kar rahe ho aaj?", P);
add("identity", "english", "are you a person or a program?", P);
add("identity", "hinglish", "aap sach mein teacher ho ya computer?", P);
add("personal_share", "english", "we won the inter school quiz today", P);
add("personal_share", "hinglish", "kal meri nani aa rahi hain", P);
add("meta_feedback", "english", "you explain too long", T);
add("meta_feedback", "hinglish", "aap bahut achha samjhate ho", P);

// E. energy
add("boredom", "english", "this is so boring, when does it end", P);
add("boredom", "hinglish", "neend aa rahi hai yaar", T);
add("frustration", "english", "i keep getting it wrong, i'm useless at maths", P);
add("frustration", "hinglish", "ye mere bas ka nahi hai", P);
add("frustration", "english", "ugh this makes no sense to me", P);
add("break_request", "english", "can i get some water and come back", P);

// F. session
add("end_request", "english", "can we stop for today", { ...P, terminal: true });
add("leaving", "hinglish", "tuition ka time ho gaya, jaana hai", { ...P, terminal: true });

// G. low-signal
add("backchannel", "hinglish", "hmm achha", P);
add("noise", "english", "and the um the it goes the", { ...P, lane: "voice" });
add("noise", "hinglish", "wo wo jo hai na usme ki", { ...P, lane: "voice" });
add("noise", "english", "so so the bottom one is like the", { ...P, lane: "voice" });
add("noise", "hinglish", "umm haan toh uska ka", { ...P, lane: "voice" });
add("adult_voice", "english", "hello, i'm her father, please keep today's lesson short", P);
add("adult_voice", "hinglish", "namaste main inka papa bol raha hoon, isko thoda aur practice karwaiye", P);
add("adult_voice", "english", "this is his mom, he finds fractions hard, please go easy", P);
add("multi_intent", "english", "i don't understand and can you show it on the screen", { gold: ["clarify", "visual_request"] });
add("multi_intent", "hinglish", "thak gaya hoon, chhota wala sawaal do", { ...P, gold: ["frustration", "easier"] });
add("multi_intent", "english", "i'm bored, can we play something", { gold: ["boredom", "game_request"] });

const seen = {};
export const CASES = C.map((c) => {
  seen[c.intent] = (seen[c.intent] ?? 0) + 1;
  return { id: `h-${c.intent}-${String(seen[c.intent]).padStart(2, "0")}`, gold: c.gold ?? [c.intent], ...c };
});
export { FAMILY } from "../conversation-v2/cases.mjs";

// the held-out guarantee: no utterance (or setup line) is also in the tuned battery
const { CASES: TUNED } = await import("../conversation-v2/cases.mjs");
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}{} ]/gu, " ").replace(/\s+/g, " ").trim();
const tuned = new Set(TUNED.flatMap((c) => [c.text, ...(c.setup ?? [])]).map(norm));
// (a bare template like "{wrong}" as a setup turn is the kit's own answer, not an utterance)
for (const c of CASES) for (const t of [c.text, ...(c.setup ?? [])].filter((x) => !/^\{\w+\}$/.test(x))) if (tuned.has(norm(t))) throw new Error(`held-out case ${c.id} is in the tuned battery: ${t}`);
