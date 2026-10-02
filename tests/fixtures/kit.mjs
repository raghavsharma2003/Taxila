// A small hand-written fractions kit (class 4) used by the unit tests. Normalized like a file kit.
import { normalizeKit } from "../../server/content/kits.js";

const H = (k) => [`pump: ask what the ${k} means`, `hint: point at the ${k}`, `prompt: fill in the blank about the ${k}`, `assertion: the answer with one reason`];

export const RAW_KIT = {
  topicId: "c4-maths-ch05-t01",
  topicType: "T3",
  skills: [
    { id: "c4-maths-ch05-t01-s1", title: "equal parts make a fraction", prereqSkillIds: [] },
    { id: "c4-maths-ch05-t01-s2", title: "compare unit fractions", prereqSkillIds: ["c4-maths-ch05-t01-s1"] },
  ],
  expectations: ["the parts must be equal", "the bottom number counts the equal parts", "more parts means each part is smaller"],
  misconceptions: [
    {
      id: "c4-maths-ch05-t01-m1", belief: "a bigger bottom number means a bigger fraction",
      signs: ["says 1/3 is bigger than 1/2", "points at the bigger denominator"],
      diagnostic: { prompt_en: "Which is bigger: 1/2 or 1/3?", prompt_hi: "Kaun bada hai: 1/2 ya 1/3?",
        options: [{ text: "1/2", misconceptionId: null, correct: true }, { text: "1/3", misconceptionId: "c4-maths-ch05-t01-m1", correct: false }] },
      remediation: { representation: "two same-size rotis cut into 2 and 3 equal pieces", moveShape: "hold one piece of each side by side; ask which is more roti" },
    },
    {
      id: "c4-maths-ch05-t01-m2", belief: "the parts need not be equal to be called thirds", signs: ["calls three unequal pieces thirds"],
      diagnostic: { prompt_en: "Three unequal pieces: are they thirds?", prompt_hi: "Teen alag size ke tukde: kya ye tihai hain?",
        options: [{ text: "no", misconceptionId: null, correct: true }, { text: "yes", misconceptionId: "c4-maths-ch05-t01-m2", correct: false }] },
      remediation: { representation: "a paper strip folded into equal parts", moveShape: "fold it; compare the pieces" },
    },
  ],
  items: [
    { id: "i1", skillId: "c4-maths-ch05-t01-s1", kind: "practice", difficulty: 1, prompt_en: "A roti is cut into 2 equal parts. What is one part called?", prompt_hi: "Ek roti ke 2 barabar tukde. Ek tukda kya kehlata hai?", answer: "1/2", acceptable: ["half", "aadha", "one half"], hints: H("parts") },
    { id: "i2", skillId: "c4-maths-ch05-t01-s1", kind: "practice", difficulty: 1, prompt_en: "A cake is cut into 4 equal pieces and you eat one. What fraction did you eat?", prompt_hi: "Cake ke 4 barabar tukde, tumne ek khaya. Kitna hissa khaya?", answer: "1/4", acceptable: ["one quarter", "quarter", "paav"], hints: H("pieces") },
    { id: "i3", skillId: "c4-maths-ch05-t01-s2", kind: "contrast", difficulty: 2, prompt_en: "Which is bigger, 1/2 or 1/3?", prompt_hi: "Kaun bada hai, 1/2 ya 1/3?", answer: "1/2", acceptable: ["half", "aadha"], hints: H("denominator"), targetsMisconception: "c4-maths-ch05-t01-m1" },
    { id: "i4", skillId: "c4-maths-ch05-t01-s2", kind: "near_transfer", difficulty: 2, prompt_en: "Which is more chocolate: 1/4 of a bar or 1/8 of the same bar?", prompt_hi: "Zyada chocolate kismein: 1/4 bar ya usi bar ka 1/8?", answer: "1/4", acceptable: ["one quarter"], hints: H("bar") },
    { id: "i5", skillId: "c4-maths-ch05-t01-s2", kind: "why", difficulty: 3, prompt_en: "Why is 1/3 bigger than 1/5?", prompt_hi: "1/3, 1/5 se bada kyun hai?", answer: "fewer equal parts means each part is bigger", acceptable: [], hints: H("parts") },
    { id: "i6", skillId: "c4-maths-ch05-t01-s2", kind: "error_spot", difficulty: 3, prompt_en: "Riya says 1/6 is bigger than 1/3 because 6 is bigger. What is correct?", prompt_hi: "Riya kehti hai 1/6 bada hai 1/3 se kyunki 6 bada hai. Sahi kya hai?", answer: "1/3 is bigger", acceptable: ["1/3"], hints: H("pieces") },
    { id: "i7", skillId: "c4-maths-ch05-t01-s2", kind: "practice", difficulty: 2, prompt_en: "Which is smaller, 1/2 or 1/4?", prompt_hi: "Kaun chhota hai, 1/2 ya 1/4?", answer: "1/4", acceptable: ["one quarter", "quarter"], hints: H("pieces"), targetsMisconception: "c4-maths-ch05-t01-m1" },
    { id: "i8", skillId: "c4-maths-ch05-t01-s2", kind: "teachback", difficulty: 3, prompt_en: "Teach Golu why 1/2 is bigger than 1/3.", prompt_hi: "Golu ko samjhao 1/2 bada kyun hai 1/3 se.", answer: "more equal parts means each part is smaller", acceptable: [], hints: H("parts") },
    { id: "i9", skillId: "c4-maths-ch05-t01-s1", kind: "practice", difficulty: 2, prompt_en: "A pizza has 3 equal slices. What is one slice?", prompt_hi: "Pizza ke 3 barabar slice. Ek slice kitna?", answer: "1/3", acceptable: ["one third", "ek tihai"], hints: H("slices"), verified: { solverAnswer: "1/3", agrees: true } },
    { id: "bad", skillId: "c4-maths-ch05-t01-s1", kind: "practice", difficulty: 1, prompt_en: "Half of 10?", prompt_hi: "10 ka aadha?", answer: "4", acceptable: [], hints: H("ten"), verified: { solverAnswer: "5", agrees: false } },
  ],
  workedExample: { problem: "Which is bigger: 1/2 or 1/4?", steps: ["cut two same rotis", "one into 2, one into 4", "hold one piece of each", "the 1/2 piece is bigger"], fadedVersion: ["cut two same ___", "one into 2, one into ___"] },
  formats: { primary: "F3", secondary: ["F4"], engineHints: ["fraction bars", "roti-cutter"] },
  interestContexts: ["cricket", "kitchen", "festival sweets"],
};

export const kit = (verified = true) => normalizeKit(structuredClone(RAW_KIT), { topicId: RAW_KIT.topicId, verified });

export const CTX = {
  firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend baby elephant" },
  ageBand: "6-9", lang: "hinglish", interests: ["cricket"], firstMeeting: true, hasCallback: false,
  topicTitle: "Fractions as equal shares", nextTitle: "Fractions in measurement",
};

export const BRIEF = {
  firstName: "Riya", classLevel: 4, ageBand: "6-9", languagePref: "hinglish", interests: ["cricket", "drawing"],
  recentWins: ["counting in tens"], activeMisconceptions: [], memoryCallbacks: ["got a new puppy"],
  vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)",
};

/** A classification as the route would pass it to step(). */
export const cls = (outcome, extra = {}) => ({
  outcome, confidence: 1, source: "test",
  flags: { dontKnow: false, asksForAnswer: false, minimal: false, offTopic: false, distress: false, distressKind: null, wantsToStop: false, ...(extra.flags || {}) },
  ...(extra.misconceptionId ? { misconceptionId: extra.misconceptionId } : {}),
  ...(extra.covered ? { covered: extra.covered, missing: extra.missing || [] } : {}),
});
