// L10 initiative (SIGNALS-SPEC §2.3): the child proposes a method, asks to try, extends, or opens a related topic.
// Lexicon seed only (the TB4 act comes later through W2-E, O-8). A negated hit ("main nahi karunga") is a refusal.
import { compile } from "../text.js";

export const ASK_TO_TRY = compile([
  "main karun", "main karu", "main karoon", "mai karu", "mai karun", "main try karu", "main try karun", "main try karti",
  "main try karta", "mujhe karne do", "mujhe try karne do", "main bataun", "main batau", "mai batau", "main solve karu",
  "मैं करूं", "मैं करूँ", "मुझे करने दो", "मैं बताऊं",
  "can i try", "let me try", "let me do", "can i do", "i want to try", "can i solve", "let me solve",
]);
export const PROPOSE_METHOD = compile([
  "aise bhi kar sakte", "aise bhi ho sakta", "aise karte hai", "aise karte hain", "ek aur tarika", "dusra tarika", "doosra tarika",
  "mera tarika", "main aise karunga", "main aise karungi", "pehle * phir", "pehle * fir", "isko * se guna", "isko * se bhag",
  "ऐसे भी कर सकते", "दूसरा तरीका", "पहले * फिर",
  "we can also", "another way", "i would do", "what if we", "first * then", "i did it by", "my way", "maine aise kiya",
]);
export const EXTEND = compile([
  "ek aur do", "ek aur sawal", "aur sawal", "aur do", "next wala", "mushkil wala do", "harder wala", "aur mushkil",
  "एक और", "और सवाल",
  "one more", "another one", "give me a harder", "harder one", "next one", "more questions",
]);
export const RELATED = compile([
  "what about", "aur * ka kya", "isse related", "iske jaisa", "kya * bhi aise", "does this work for", "is it same for",
]);
/** A method-like statement (L10 task-state half): an operation verb in the child's own answer. */
export const METHOD_VERBS = compile([
  "guna", "bhag", "jod", "jodo", "ghata", "ghatao", "multiply", "divide", "add", "subtract", "plus", "minus", "times",
  "गुणा", "भाग", "जोड़", "जोड", "घटा", "because", "kyunki", "isliye", "क्योंकि",
]);
