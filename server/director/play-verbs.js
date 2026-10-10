// The verb her words use while a play piece is on the stage, derived from the piece's MODE in code, never left to the reply
// model's free text (G2 Khand finding, 2026-10-10: in the class-5 "views" lesson the stage carried a BUILD task and she
// said "top view chuniye": "choose" is the card question's verb, and the card is folded away in play mode). One entry per
// family / mode in shared/play.ts MODES; tests/r4-conversation-play-verbs.test.mjs fails when a mode has none, so a new
// family (Antariksh, …) cannot ship without its verb. `act` is the closed act kind; `hi` / `en` the task verbs she may use.

export const PLAY_ACTS = Object.freeze({
  "todo-jodo": { atoms: { act: "split_join", hi: "todo ya jodo", en: "split or join" }, strips: { act: "split_join", hi: "todo ya jodo", en: "split or join" },
    bundles: { act: "split_join", hi: "bundle banao ya kholo", en: "bundle or unbundle" } },
  taraazu: { equation: { act: "balance", hi: "taraazu barabar karo", en: "balance it" }, equality: { act: "balance", hi: "taraazu barabar karo", en: "balance it" } },
  nishana: { place: { act: "place", hi: "line par rakho", en: "place it on the line" }, compare: { act: "choose", hi: "chuniye", en: "choose" } },
  "kyun-lab": { "fair-test": { act: "test", hi: "ek cheez badlo aur test karo", en: "change one thing and test" } },
  // r4-khand (claude/r4-khand, src/play/engines/khand/copy.json goal lines)
  nazariya: { views: { act: "build", hi: "banao", en: "build" }, array: { act: "fill_count", hi: "bharo, phir gino", en: "fill, then count" },
    floor: { act: "lay", hi: "farsh bichhao", en: "lay the floor" }, powers: { act: "build", hi: "banao", en: "build" }, mirror: { act: "build", hi: "banao", en: "build" } },
  // r4-games-core (claude/r4-games-core, E1 angles: src/play/families/kon, data/play/engine-words.json kon.goal.*)
  kon: { turn: { act: "turn", hi: "teer ghumao", en: "turn the arrow" }, set: { act: "turn", hi: "kon kholo", en: "open the angle" } },
});

/** The act of a family / mode, or null when the table has none (then no verb note is given: never a guessed verb). */
export const playActOf = (family, mode) => PLAY_ACTS[family]?.[mode] ?? null;

/**
 * PURE. The last-section check while a play piece is up (compile.js lastParts): the card is folded away, so no card
 * question; at most one short line on what to do, in the piece's own verb. A note, never a line.
 */
export function playCheck(playOn, lang = "hinglish") {
  const a = playActOf(playOn?.family, playOn?.mode);
  if (!a) return null;
  const verb = lang === "english" ? a.en : a.hi;
  const notChoose = a.act === "choose" ? "" : "; never a choosing verb (chuniye, choose, pick)";
  return `the game is on the screen and the question card is folded away: no card question this turn; at most one short line on what to do in the game, with its own verb (${verb})${notChoose}.`;
}
