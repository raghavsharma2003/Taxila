// Vibe signals from the transcript and turn events (COMPREHENSION-ENGINE.md §6.1). A CLOSED list of observable,
// session-scoped facts — never an emotion label, a trait, a personality inference, gender, a camera signal, or
// anything about other children. Pure: one child turn in, one signal record out.

/** Closed interest taxonomy (exampleDomain values). Banned categories (religion, caste, politics, brands, bodies) never appear. */
export const INTERESTS = Object.freeze({
  cricket: ["cricket", "batting", "bowler", "wicket", "ipl", "virat", "sixer", "century"],
  football: ["football", "goal", "messi", "ronaldo", "penalty"],
  space: ["space", "rocket", "planet", "isro", "astronaut", "moon", "chandrayaan", "stars"],
  animals: ["animal", "dog", "cat", "puppy", "kutta", "billi", "tiger", "elephant", "haathi", "bird"],
  dinosaurs: ["dinosaur", "t-rex", "trex", "dino"],
  cooking: ["cook", "cooking", "roti", "recipe", "kitchen", "maggi", "cake", "khana banana"],
  cartoons: ["cartoon", "anime", "doraemon", "chhota bheem", "shinchan", "pokemon"],
  music: ["song", "music", "gaana", "singing", "guitar", "dance"],
  drawing: ["drawing", "draw", "painting", "colour", "color", "sketch"],
  games: ["game", "minecraft", "ludo", "video game", "level up", "free fire", "roblox"],
  vehicles: ["car", "bike", "train", "truck", "bus", "plane", "aeroplane"],
  nature: ["tree", "garden", "plant", "flower", "river", "mountain", "pahad"],
});
const ADDRESS = ["didi", "ma'am", "maam", "mam", "miss", "sir", "bhaiya", "teacher"];
const HINDI_FUNCTION = new Set(["hai", "hain", "nahi", "nahin", "kya", "kaise", "kyun", "kyunki", "matlab", "toh", "to", "aur", "mein", "main", "ka", "ki", "ke",
  "ko", "se", "bhi", "haan", "acha", "achha", "theek", "thik", "yeh", "ye", "woh", "wo", "kar", "karo", "raha", "rahi", "tha", "thi", "hoga", "mujhe", "mera", "meri", "aap", "tum"]);

const has = (t, words) => words.some((w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\']/g, "\\$&")}([^a-z]|$)`, "i").test(t));

/**
 * One child turn → closed signal record.
 * @param {{ text: string, bargeIn?: boolean, afterHumour?: boolean, offeredHarder?: boolean, acceptedHarder?: boolean,
 *   afterError?: boolean, retried?: boolean, onsetZ?: number|null, slowerPace?: boolean, thinkQuestion?: boolean }} turn
 */
export function turnSignals(turn) {
  const t = String(turn.text ?? "").toLowerCase();
  const words = t.split(/[^a-zऀ-ॿ']+/).filter(Boolean);
  const hi = words.filter((w) => HINDI_FUNCTION.has(w) || /[ऀ-ॿ]/.test(w)).length;
  const interests = Object.entries(INTERESTS).filter(([, ws]) => has(t, ws)).map(([k]) => k);
  return {
    words: words.length,
    bargeIn: !!turn.bargeIn,
    tellMore: has(t, ["tell me more", "aur batao", "aur bataiye", "phir kya hua", "then what", "more please", "aage batao"]),
    shorter: has(t, ["too long", "bas", "jaldi", "skip", "boring"]),
    laughter: /\b(ha){2,}\b|\bhehe+\b|\blol\b|😂|🤣/.test(t),
    builtOnHumour: !!turn.afterHumour && (/\b(ha){2,}\b|\bhehe\b|\bfunny\b|\bmazaa\b|\bmaza\b/.test(t) || words.length > 6),
    noJokes: has(t, ["no jokes", "stop joking", "not funny", "mazak mat", "majak mat", "joke mat"]),
    moreJokes: has(t, ["another joke", "ek aur joke", "more jokes", "tell a joke", "joke sunao"]),
    address: ADDRESS.find((a) => has(t, [a])) ?? null,
    terse: words.length <= 2,
    chatty: words.length >= 15,
    interests,
    acceptedHarder: !!(turn.offeredHarder && turn.acceptedHarder),
    declinedHarder: !!(turn.offeredHarder && !turn.acceptedHarder),
    retryAfterError: !!(turn.afterError && turn.retried),
    hindiShare: words.length ? hi / words.length : 0,
    slowOnset: !!turn.thinkQuestion && turn.onsetZ != null && turn.onsetZ >= 1.0,
    slowerPace: !!turn.slowerPace,
  };
}
