// 24 simulated children with HIDDEN true understanding per concept (COMPREHENSION-ENGINE.md §8.1). Truth bits per
// concept: K (does it on standard items), U (can explain / evaluate), T (travels to new contexts), keep (still has it
// ≥ 20 h later), mis (holds the topic's first misconception). Behaviour: verbal (P says it | U), deference
// (P accepts a planted error | U), shyness (IDK / short answers), slip, guessing, game skill, answer-seeking, and the
// probability that a targeted re-teach flips a bit (uLearn, kLearn, misFix). The ENGINE never sees any of this.
//
// Response probabilities here are a SEPARATE generative model from the engine's emission tables (no inverse crime
// by construction, STUDENT-SIM SIM2), but they are still author-set: the sim gates mechanics, never efficacy (SIM6).

const U = (o = {}) => ({ K: 1, U: 1, T: 1, keep: 1, mis: 0, ...o });
const base = { verbal: 0.75, deference: 0.15, slip: 0.08, guessOpen: 0.08, shy: 0.05, hesitation: 0.12, gameSkill: 0, answerSeek: 0,
  uLearn: 0.25, tLearn: 0.2, kLearn: 0.35, misFix: 0.4, fluent: 0, lang: "en", classLevel: 6 };

/** @type {{ id: string, archetype: string, desc: string, truth: (i: number) => any } & typeof base}[] */
export const PERSONAS = [
  { ...base, id: "p01", archetype: "understander", desc: "Bright, steady English-medium child who really gets ideas and explains them clearly.", truth: () => U() },
  { ...base, id: "p02", archetype: "understander", lang: "hinglish", desc: "Chatty Hinglish speaker who understands concepts well and explains in mixed Hindi-English.", truth: () => U() },
  { ...base, id: "p03", archetype: "correct_wrong_reasons", verbal: 0.6, desc: "Gets standard answers right using a wrong rule that happens to work on easy cases.", truth: () => U({ U: 0, T: 0, mis: 1 }) },
  { ...base, id: "p04", archetype: "correct_wrong_reasons", lang: "hinglish", desc: "Confident child whose right answers come from a memorised trick, not the idea; the trick breaks on unusual cases.", truth: () => U({ U: 0, T: 0, mis: 1 }) },
  { ...base, id: "p05", archetype: "fluent_shallow", verbal: 0.9, fluent: 0.7, desc: "Very articulate; uses the right words and sounds sure, but cannot actually say why or use the idea anywhere new.", truth: () => U({ U: 0, T: 0 }) },
  { ...base, id: "p06", archetype: "fluent_shallow", verbal: 0.9, fluent: 0.7, lang: "hinglish", desc: "Talks a lot in fluent Hinglish, repeats the teacher's phrases, procedure is right but the reason behind it is missing.", truth: () => U({ U: 0, T: 0 }) },
  { ...base, id: "p07", archetype: "shy_understands", verbal: 0.25, shy: 0.3, hesitation: 0.7, desc: "Very shy, answers in two or three words, often says 'pata nahi' first, but truly understands.", truth: () => U() },
  { ...base, id: "p08", archetype: "shy_understands", verbal: 0.3, shy: 0.25, hesitation: 0.65, lang: "hinglish", classLevel: 4, desc: "Quiet Class 4 child, hesitant voice, short Hinglish answers, understands the ideas.", truth: () => U() },
  { ...base, id: "p09", archetype: "guesser", verbal: 0.3, guessOpen: 0.25, hesitation: 0.5, desc: "Guesses quickly to get past questions; sometimes lucky; does not know the topic yet.", truth: () => U({ K: 0, U: 0, T: 0 }) },
  { ...base, id: "p10", archetype: "guesser", verbal: 0.3, guessOpen: 0.3, hesitation: 0.5, lang: "hinglish", desc: "Picks options fast and guesses numbers; low knowledge; talks little.", truth: () => U({ K: 0, U: 0, T: 0 }) },
  { ...base, id: "p11", archetype: "not_yet", verbal: 0.5, kLearn: 0.05, uLearn: 0.05, desc: "Finds these topics hard; tries but mostly does not know yet.", truth: () => U({ K: 0, U: 0, T: 0 }) },
  { ...base, id: "p12", archetype: "slow_learner", verbal: 0.55, kLearn: 0.5, uLearn: 0.35, desc: "Starts not knowing, but learns from re-explanation over a few sessions.", truth: () => U({ K: 0, U: 0, T: 0 }) },
  { ...base, id: "p13", archetype: "forgetter", desc: "Understands well in the moment but loses it by the next day.", truth: () => U({ keep: 0 }) },
  { ...base, id: "p14", archetype: "forgetter", lang: "hinglish", desc: "Quick to understand during class, forgets by the next session unless reminded.", truth: () => U({ keep: 0 }) },
  { ...base, id: "p15", archetype: "bound_instance", desc: "Understands the idea in the taught example but cannot carry it to a new context.", truth: () => U({ T: 0 }) },
  { ...base, id: "p16", archetype: "bound_instance", lang: "hinglish", classLevel: 5, desc: "Explains the textbook example well, stuck when the same idea appears in a new situation.", truth: () => U({ T: 0 }) },
  { ...base, id: "p17", archetype: "deferential_understander", deference: 0.7, verbal: 0.6, desc: "Understands, but agrees with whoever sounds confident, even a puppet making a mistake.", truth: () => U() },
  { ...base, id: "p18", archetype: "confident_misconception", verbal: 0.8, fluent: 0.4, desc: "Strongly holds a wrong belief about the topic and explains it confidently.", truth: () => U({ K: 0, U: 0, T: 0, mis: 1 }) },
  { ...base, id: "p19", archetype: "gamer", gameSkill: 0.85, verbal: 0.4, desc: "Brilliant at game patterns and fast taps, but cannot explain the idea behind them.", truth: () => U({ U: 0, T: 0 }) },
  { ...base, id: "p20", archetype: "answer_seeker", answerSeek: 0.5, verbal: 0.5, desc: "Keeps asking the teacher for the answer; doing it alone is shaky.", truth: () => U({ U: 0, T: 0 }) },
  { ...base, id: "p21", archetype: "mixed", desc: "Strong on some topics, shallow on others.", truth: (i) => [U(), U({ U: 0, T: 0 }), U(), U({ K: 0, U: 0, T: 0 }), U({ T: 0 }), U()][i] },
  { ...base, id: "p22", archetype: "mixed", lang: "hinglish", classLevel: 7, desc: "Uneven: understands fractions deeply, guesses in geometry.", truth: (i) => [U({ U: 0, T: 0 }), U(), U({ K: 0, U: 0, T: 0 }), U(), U(), U({ keep: 0 })][i] },
  { ...base, id: "p23", archetype: "late_bloomer", uLearn: 0.6, tLearn: 0.5, desc: "Learns procedures first; the idea clicks after a re-explanation in a different way.", truth: () => U({ U: 0, T: 0 }) },
  { ...base, id: "p24", archetype: "hindi_medium_understander", lang: "hi", verbal: 0.65, classLevel: 5, desc: "Hindi-medium child who understands and explains in Hindi with a few English terms.", truth: () => U() },
];

/**
 * The state the engine should end in for one concept, from the CURRENT truth bits (teaching can flip them).
 * Misconception holders that still do standard items are `shallow` (`not_yet` also acceptable: a verified wrong idea).
 */
export function expectedState(t) {
  if (!t.K) return { exact: "not_yet", ok: ["not_yet"] };
  if (!t.U) return { exact: "shallow", ok: t.mis ? ["shallow", "not_yet"] : ["shallow"] };
  if (!t.T || !t.keep) return { exact: "fragile", ok: ["fragile"] };
  return { exact: "understood", ok: ["understood", "durable"] };
}
export const truthType = (t) => (!t.K ? "not_yet" : !t.U ? "shallow" : !t.T ? "fragile_bound" : !t.keep ? "fragile_forgets" : "understood");
