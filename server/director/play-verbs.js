import { readFileSync } from "node:fs";

// The verb her words use while a play piece is on the stage, derived from the piece's MODE in code, never left to the reply
// model's free text (G2 Khand finding, 2026-10-10: in the class-5 "views" lesson the stage carried a BUILD task and she
// said "top view chuniye": "choose" is the card question's verb, and the card is folded away in play mode). One entry per
// family / mode in shared/play.ts MODES; tests/r4-conversation-play-verbs.test.mjs fails when a mode has none, so a new
// family (Antariksh, …) cannot ship without its verb. `act` is the closed act kind; `hi` / `en` the task verbs she may use.

export const PLAY_ACTS = Object.freeze({
  "todo-jodo": { atoms: { act: "split_join", hi: "todo ya jodo", en: "split or join" }, strips: { act: "split_join", hi: "todo ya jodo", en: "split or join" },
    bundles: { act: "split_join", hi: "bundle banao ya kholo", en: "bundle or unbundle" } },
  taraazu: { equation: { act: "balance", hi: "taraazu barabar karo", en: "balance it" }, equality: { act: "balance", hi: "taraazu barabar karo", en: "balance it" },
    // r7 games: measurement (src/play/families/taraazu/weigh.logic.ts): load real weights, pour real jugs
    weigh: { act: "load", hi: "baat chadhao aur tolo", en: "load the weights and weigh" },
    fill: { act: "fill", hi: "jug se bharo aur dekho", en: "pour the jugs and check" } },
  nishana: { place: { act: "place", hi: "line par rakho", en: "place it on the line" }, compare: { act: "choose", hi: "chuniye", en: "choose" },
    // r7 games: integer operations as hops from a start on the line
    hop: { act: "place", hi: "jahan pahunchoge wahan rakho", en: "land it where the hop ends" } },
  "kyun-lab": { "fair-test": { act: "test", hi: "ek cheez badlo aur test karo", en: "change one thing and test" } },
  // r4-khand (claude/r4-khand, src/play/engines/khand/copy.json goal lines)
  nazariya: { views: { act: "build", hi: "banao", en: "build" }, array: { act: "fill_count", hi: "bharo, phir gino", en: "fill, then count" },
    floor: { act: "lay", hi: "farsh bichhao", en: "lay the floor" }, powers: { act: "build", hi: "banao", en: "build" }, mirror: { act: "build", hi: "banao", en: "build" } },
  // round 7 (src/play/families/stambh): a graph is BUILT, crate by crate / icon by icon
  stambh: { bars: { act: "build", hi: "khambe banao", en: "build the bars" }, picto: { act: "build", hi: "chitr lagao", en: "stack the pictures" } },
  // r4-games-core (claude/r4-games-core, E1 angles: src/play/families/kon, data/play/engine-words.json kon.goal.*)
  kon: { turn: { act: "turn", hi: "teer ghumao", en: "turn the arrow" }, set: { act: "turn", hi: "kon kholo", en: "open the angle" },
    // r7 games: make a kind of angle / match one (zone), a linear pair (pair), close a triangle (close)
    zone: { act: "turn", hi: "kon kholo", en: "open the angle" }, pair: { act: "turn", hi: "kon kholo", en: "open the angle" },
    close: { act: "turn", hi: "kon kholo ki triangle band ho", en: "open the angle so the triangle closes" } },
  // r7 games: ITEM-ARENA (round 4 G1 revived): aim at a target, then fire
  arena: { pick: { act: "aim", hi: "nishana lagao aur fire karo", en: "aim and fire" } },
  // r7 games: E6 Yantra (science puzzle-physics)
  yantra: { beam: { act: "build", hi: "sheesha lagao aur chalao", en: "place the mirrors and run it" },
    circuit: { act: "build", hi: "taar jodo aur chalao", en: "wire it up and run it" },
    pendulum: { act: "set", hi: "dhaaga set karo aur chalao", en: "set the thread and run it" } },
  // r7 games: Kaal-nadi (SST time): the boat is brought to a year on the river of time and the stone dropped there
  kaal: { place: { act: "place", hi: "naav us saal tak le jao aur patthar giraao", en: "take the boat to the year and drop the stone" },
    order: { act: "place", hi: "har patthar ko uske saal par giraao", en: "drop each stone at its year" } },
  // r7 games: Vakya (English / Hindi grammar): couple the word wagons into a sentence train, then run it
  vakya: { rail: { act: "build", hi: "dibbe jodo aur train chalao", en: "couple the wagons and run the train" } },
  // r7 games: E4 Kila (turn-based tower defence): set up towers / nets / the trap on the numbered path, then run the wave
  kila: { multiples: { act: "place", hi: "burj ya jaal lagao aur lehar chalao", en: "set the towers or nets and run the wave" },
    factors: { act: "build", hi: "burj banao aur lehar chalao", en: "build the towers and run the wave" },
    lcm: { act: "place", hi: "jaal rakho aur lehar chalao", en: "set the trap and run the wave" } },
});

// Round 7: families / modes this table does not list are read from Games' own data file, data/play/verbs.json, shape
// { "<family>": { "<mode>": { "act": "<closed act kind>", "hi": "<Hinglish task verb>", "en": "<English task verb>" } } }.
// So Games can ship a new mode without a Brain edit. The code table wins where both have an entry; an entry missing any of
// act / hi / en is skipped (no verb note then, never a guessed verb); a missing or broken file is an empty table.
const VERBS_FILE = new URL("../../data/play/verbs.json", import.meta.url);
/** PURE. The valid entries of a parsed verbs file. */
export function verbsFrom(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [family, modes] of Object.entries(raw)) {
    if (!modes || typeof modes !== "object" || Array.isArray(modes)) continue;
    for (const [mode, a] of Object.entries(modes)) {
      if (![a?.act, a?.hi, a?.en].every((x) => typeof x === "string" && x.trim())) continue;
      (out[family] ??= {})[mode] = Object.freeze({ act: a.act, hi: a.hi, en: a.en });
    }
  }
  return out;
}
const fileVerbs = () => { try { return verbsFrom(JSON.parse(readFileSync(VERBS_FILE, "utf8"))); } catch { return {}; } };
export const PLAY_ACTS_DATA = Object.freeze(fileVerbs());

/** The act of a family / mode, or null when neither table has one (then no verb note is given: never a guessed verb). */
export const playActOf = (family, mode) => PLAY_ACTS[family]?.[mode] ?? PLAY_ACTS_DATA[family]?.[mode] ?? null;

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
