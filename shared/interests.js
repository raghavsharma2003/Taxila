// The ONE interest registry (BUILD-PLAN W2-C #6, personalisation gap 4; shared/brain.ts InterestTag). Onboarding's
// pictures (src/child/interests.ts), the persona's session detection (server/persona/signals.js INTERESTS), Forge's
// skins (server/forge/strings.js INTEREST_IDS / interestIdOf) and Studio's interest allowlist (shared/studio.ts
// `style.interest`) all name interests from THIS table; tests/w2c-interests.test.mjs proves they agree.
//
// An interest is an F knob (decoration and context), never a learning style and never a trait (rj-style-attribute-to-
// generator). Banned categories (religion, caste, politics, brands, bodies, public figures as identities) never appear.
// Labels are English UI chrome (owner directive; the child-facing words for the pictures are src/copy/en.ts's).

/**
 * @typedef {{ id: string, label: string, tile: boolean, skin: string, studio: boolean, words: string[] }} Interest
 *   tile: an onboarding / Hello picture; skin: the Forge G1 skin it renders as (strings.js INTEREST_IDS);
 *   studio: on Studio's interest allowlist (a build may re-skin a context with it); words: whole-word cues the persona
 *   reads in the child's own speech (session-scoped; signals.js).
 */
/** @type {readonly Interest[]} */
export const INTEREST_REGISTRY = Object.freeze([
  { id: "cricket", label: "Cricket", tile: true, skin: "cricket", studio: true, words: ["cricket", "batting", "bowler", "wicket", "ipl", "sixer", "century"] },
  { id: "football", label: "Football", tile: true, skin: "football", studio: true, words: ["football", "goal", "penalty"] },
  { id: "space", label: "Space", tile: true, skin: "space", studio: true, words: ["space", "rocket", "planet", "isro", "astronaut", "moon", "chandrayaan", "stars"] },
  { id: "animals", label: "Animals", tile: true, skin: "animals", studio: true, words: ["animal", "dog", "cat", "puppy", "kutta", "billi", "tiger", "elephant", "haathi", "bird"] },
  { id: "drawing", label: "Drawing", tile: true, skin: "drawing", studio: true, words: ["drawing", "draw", "painting", "colour", "color", "sketch"] },
  { id: "music", label: "Music", tile: true, skin: "films_music", studio: true, words: ["song", "music", "gaana", "singing", "guitar"] },
  { id: "dance", label: "Dance", tile: true, skin: "films_music", studio: true, words: ["dance", "dancing", "naach"] },
  { id: "cooking", label: "Cooking", tile: true, skin: "food", studio: true, words: ["cook", "cooking", "roti", "recipe", "kitchen", "cake", "khana banana"] },
  { id: "trains", label: "Trains", tile: true, skin: "trains", studio: true, words: ["train", "railway", "engine", "station"] },
  { id: "stories", label: "Stories", tile: true, skin: "stories", studio: true, words: ["story", "stories", "kahani", "book", "reading"] },
  { id: "building", label: "Building", tile: true, skin: "building", studio: true, words: ["building", "lego", "blocks", "build"] },
  { id: "nature", label: "Nature", tile: true, skin: "nature", studio: true, words: ["tree", "garden", "plant", "flower", "river", "mountain", "pahad"] },
  // Session-detected only (no picture): what children bring up themselves.
  { id: "dinosaurs", label: "Dinosaurs", tile: false, skin: "animals", studio: true, words: ["dinosaur", "t-rex", "trex", "dino"] },
  { id: "cartoons", label: "Cartoons", tile: false, skin: "generic", studio: false, words: ["cartoon", "anime", "doraemon", "chhota bheem", "shinchan", "pokemon"] },
  { id: "games", label: "Games", tile: false, skin: "generic", studio: false, words: ["game", "minecraft", "ludo", "video game", "level up", "roblox"] },
  { id: "vehicles", label: "Vehicles", tile: false, skin: "vehicles", studio: true, words: ["car", "bike", "truck", "bus", "plane", "aeroplane"] },
]);

const BY_ID = new Map(INTEREST_REGISTRY.map((x) => [x.id, x]));
/** Every registry id. */
export const INTEREST_IDS = Object.freeze(INTEREST_REGISTRY.map((x) => x.id));
/** The onboarding / Hello pictures, in display order (src/child/interests.ts). */
export const TILE_IDS = Object.freeze(INTEREST_REGISTRY.filter((x) => x.tile).map((x) => x.id));
/** Studio's interest allowlist (LIVE-STUDIO style.interest / craft.interest). */
export const STUDIO_INTERESTS = Object.freeze(INTEREST_REGISTRY.filter((x) => x.studio).map((x) => x.id));

/** The registry entry for an id or a label ("Animals"), or null. */
export function interestOf(idOrLabel) {
  const k = String(idOrLabel ?? "").trim().toLowerCase();
  return BY_ID.get(k) ?? INTEREST_REGISTRY.find((x) => x.label.toLowerCase() === k) ?? null;
}
/** The Forge skin an interest renders as ("generic" for anything unknown). */
export const skinOf = (idOrLabel) => interestOf(idOrLabel)?.skin ?? "generic";
/** Registry ids of a list of ids / labels (unknown entries dropped, order kept, deduplicated). */
export const interestIdsOf = (list) => [...new Set((list ?? []).map((x) => interestOf(x)?.id).filter(Boolean))];

const cue = (w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\']/g, "\\$&")}([^a-z]|$)`, "i");
/** Interest ids whose cue words occur (whole word) in a child's words. Session-scoped; never stored as a trait. */
export function interestsIn(text) {
  const t = String(text ?? "").toLowerCase();
  return INTEREST_REGISTRY.filter((x) => x.words.some((w) => cue(w).test(t))).map((x) => x.id);
}
