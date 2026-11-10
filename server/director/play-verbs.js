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
  "kyun-lab": { "fair-test": { act: "test", hi: "ek cheez badlo aur test karo", en: "change one thing and test" },
    // r7 chumbak: magnets (touch, flag, turn round, bring a pole near, label, dip; let the magnet hang, turn the map, turn
    // yourself and the compass box)
    dhruv: { act: "test", hi: "magnet paas lao, chhu kar dekho aur pole dhoondho", en: "bring the magnet near, test it and find the poles" },
    disha: { act: "turn", hi: "ghoomo, compass ka dabba ghumao aur disha padho", en: "turn round, turn the compass box and read the direction" } },
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
    pendulum: { act: "set", hi: "dhaaga set karo aur chalao", en: "set the thread and run it" },
    roshni: { act: "place", hi: "roshni jalao ya dhako, parda lagao aur dekho", en: "switch or cover the lights, place the screens and look" } },
  // r7 games: Kaal-nadi (SST time): the boat is brought to a year on the river of time and the stone dropped there
  kaal: { place: { act: "place", hi: "naav us saal tak le jao aur patthar giraao", en: "take the boat to the year and drop the stone" },
    order: { act: "place", hi: "har patthar ko uske saal par giraao", en: "drop each stone at its year" } },
  // r7 games: Vakya (English / Hindi grammar): couple the word wagons into a sentence train, then run it
  vakya: { rail: { act: "build", hi: "dibbe jodo aur train chalao", en: "couple the wagons and run the train" } },
  // r7 games: E4 Kila (turn-based tower defence): set up towers / nets / the trap on the numbered path, then run the wave
  kila: { multiples: { act: "place", hi: "burj ya jaal lagao aur lehar chalao", en: "set the towers or nets and run the wave" },
    factors: { act: "build", hi: "burj banao aur lehar chalao", en: "build the towers and run the wave" },
    lcm: { act: "place", hi: "jaal rakho aur lehar chalao", en: "set the trap and run the wave" } },
  // r7 games: Naksha (maps and grids): send the drone to a lat / long, program a route, measure with the scale, copy a shape
  naksha: { locate: { act: "place", hi: "drone ko us jagah le jao aur giraao", en: "fly the drone to the spot and drop" },
    route: { act: "build", hi: "raasta banao aur chalao", en: "plan the route and run it" },
    scale: { act: "set", hi: "scale se naapo aur truck chalao", en: "measure with the scale and drive the truck" },
    shape: { act: "build", hi: "naksha jaisi baad lagao", en: "fence it like the plan" } },
  // r7 games: Ghadi (time and clocks): set the geared clock / the ticket / the podium / the flag, then run it (never timed)
  ghadi: { set: { act: "set", hi: "suiyan ghuma kar ghadi milao aur ghanti bajao", en: "turn the hands to the time and ring the bell" },
    run: { act: "set", hi: "ghadi ya ticket set karo aur bus chalao", en: "set the clock or the ticket and run the bus" },
    race: { act: "place", hi: "har dhaavak ko podium par rakho aur daud chalao", en: "put each runner on the podium and run the race" },
    calendar: { act: "place", hi: "jhanda us taareekh par lagao aur din ginte jao", en: "plant the flag on the date and hop the days" } },
  // r7 games: Darpan (symmetry): lay the mirror lines and fold; turn the figure on the turntable and spin
  darpan: { mirror: { act: "place", hi: "aaine ki lakeerein rakho aur modo", en: "lay the mirror lines and fold" },
    turn: { act: "set", hi: "ghumao aur chakri chalao", en: "turn it and spin" } },
  // r7 games: Feeta (length and distance): cut the ribbon / the rope / the fence, set the trip meter, put routes in order; then run
  feeta: { measure: { act: "set", hi: "ruler se naapo aur feeta kaato", en: "measure with the ruler and cut the ribbon" },
    fence: { act: "set", hi: "baad kaato aur bagiche ko ghero", en: "cut the fence and go round the garden" },
    trip: { act: "set", hi: "meter set karo aur cycle chalao", en: "set the meter and ride the trip" },
    compare: { act: "place", hi: "raaston ko chhote se bade kram mein rakho aur chalao", en: "put the routes from shortest to longest and ride them" },
    // r7 naap (science measuring): lay the thread along the curve and straighten it; dip and read the thermometers; read the
    // scale from a full mark with the eye above; put things on the warmth shelf and check them with a thermometer
    thread: { act: "set", hi: "dhaaga line ke saath bichhao, seedha karke scale par padho", en: "lay the thread along the line, straighten it and read the scale" },
    thermo: { act: "set", hi: "thermometer lagao aur uska paimana padho", en: "use the thermometer and read its scale" },
    scale: { act: "set", hi: "scale theek se lagao aur seedha upar se padho", en: "line up the scale and read it from directly above" },
    touch: { act: "place", hi: "chhoo kar dekho, shelf par rakho, phir thermometer se jaancho", en: "feel them, put them on the shelf, then check with a thermometer" } },
  // r7 games: Guna (multi-digit multiplication and division): cut the field and load the truck; share the godown into trucks;
  // set out the vehicles / packets / jar and run the story
  guna: { field: { act: "load", hi: "khet kaato aur truck bharo", en: "cut the field and load the truck" },
    pack: { act: "load", hi: "godown ka maal trucks mein barabar baanto", en: "share the godown equally into the trucks" },
    story: { act: "set", hi: "gaadiyan ya packet rakho aur kahani chalao", en: "set out the vehicles or packets and run the story" } },
  // r7 games: Kram (growing patterns and sequences): grow the figure or fill the bag; set the machine; lay the rhythms; pick
  // the pieces for the square
  kram: { grow: { act: "place", hi: "tiles rakh kar agla aakaar banao, ya door ke aakaar ke liye thaila bharo", en: "lay tiles to grow the next stage, or fill the bag for a far stage" },
    machine: { act: "set", hi: "machine ka niyam set karo aur chalao", en: "set the machine's rule and run it" },
    beats: { act: "place", hi: "chhote aur lambe beat ki saari laya rakho aur bajao", en: "lay every rhythm of short and long beats and play them" },
    nest: { act: "place", hi: "tukde varg mein bithao aur bharo", en: "fit the pieces into the square and fill it" } },
  // r7 games: Hissa (multiplying and dividing fractions and decimals): fold the sheet and tag the piece; pour the jug into cups;
  // shade the tenths grid or slide the digits; fold the bar or the recipe in the story
  hissa: { fold: { act: "fold", hi: "kaagaz modo, rang bharo aur tukda gino", en: "fold the sheet, shade it and count the piece" },
    pour: { act: "fill", hi: "jug se cup bharo aur bacha hissa naapo", en: "pour the jug into cups and name the part cup" },
    grid: { act: "set", hi: "grid mein dasvein bharo ya ank khiskao", en: "shade the tenths or slide the digits" },
    story: { act: "fold", hi: "kahani padho, patti modo aur hissa lo", en: "read the story, fold the bar and take the part" } },
  // r7 games: Koshtak (expressions): put the tray walls / the lid / turn the jumps and run the counter; put like terms in bins
  koshtak: { tray: { act: "place", hi: "tray ki deewar ya dhakkan lagao aur counter chalao", en: "set the tray walls or the lid and run the counter" },
    bin: { act: "place", hi: "ek jaise term ek dibbe mein daalo aur dibbe band karo", en: "put like terms in one bin and close the bins" } },
  // r7 games: Parkar (constructions): open the compass, swing arcs, lay the protractor / set-square, pin crossings, then run
  parkar: { build: { act: "set", hi: "parkar kholo, nishaan lagao aur tribhuj banao", en: "open the compass, swing the arcs and build the triangle" },
    bisect: { act: "set", hi: "barabar parkar se nishaan lagao aur rekha milao", en: "swing equal arcs and join the crossings" },
    drop: { act: "place", hi: "set-square ko saamne ki bhuja par rakho aur lamb kheencho", en: "lay the set-square along the opposite side and draw the altitude" } },
  // r7 games: Aankde (data): stroke slips into tally rows and count; level the towers / set the level line; order the cards, peg the middle
  aankde: { tally: { act: "place", hi: "har parchi ko uski line mein tally ki tarah lagao aur gino", en: "stroke each slip into its row as a tally and count" },
    stack: { act: "set", hi: "blocks ko barabar karo ya level ki line lagao", en: "level the towers or set the level line" },
    line: { act: "place", hi: "cards ko kram mein lagao aur beech mein khoonti rakho", en: "put the cards in order and set the peg in the middle" } },
  // r7 games: Paheli (number puzzles): load bags by parity, place tiles on a magic grid, give letters digits, set a start
  paheli: { pairs: { act: "place", hi: "naav par sahi thaile chadhao", en: "load the bags that make the boat's count" },
    magic: { act: "place", hi: "har khaane mein ek number rakho, har line ka jod barabar", en: "put a number in every cell so every line adds the same" },
    cipher: { act: "set", hi: "har akshar ko ek ank do aur jod karo", en: "give each letter a digit and add it up" },
    mirror: { act: "set", hi: "shuru ka number set karo, ulta karke jodo", en: "set a start, then reverse and add" } },
  // r7 games: Galti Pakdo (a friend's working): weigh the claim in the question, catch the first wrong line, mend it
  "galti-pakdo": { kaapi: { act: "check", hi: "taraazu par jaancho aur pehli galat line pakdo", en: "check it on the balance and catch the first wrong line" } },
  // r7 games: Chhaano (separating mixtures, class 6 science): methods applied in turn to a pile or a vessel of water
  chhaano: { sukha: { act: "separate", hi: "tareeke ek ke baad ek lagao, har cheez alag karo", en: "use the methods in turn until every part is on its own" },
    geela: { act: "separate", hi: "baithne do, nithaaro, filter karo ya sukhao, har cheez dabbe mein lo", en: "settle, decant, filter or dry it, and get each part into its jar" } },
  // r7 games: Gati (motion): step the clock and watch from a reference, set a speed from a marked track, compare the marks
  gati: { drishti: { act: "watch", hi: "ghadi aage badhao aur har cheez se dekho", en: "step the clock and watch from each thing" },
    raftaar: { act: "step", hi: "ghadi aage badhao aur track par doori dekho", en: "step the clock and read the distance on the track" },
    nishaan: { act: "step", hi: "ghadi aage badhao aur nishaanon ki doori dekho", en: "step the clock and compare the gaps between the marks" } },
  // r7 games: Bhaap (processes of water and air, class 6-7 science): the child runs each process a step at a time
  bhaap: { avastha: { act: "heat", hi: "ek-ek nishaan garam ya thanda karo, aur har badlaav uske nishaan par dekho", en: "heat or cool it a notch at a time and watch each change at its mark" },
    bhaapan: { act: "wait", hi: "ruko, thandi cheez bahar rakho, aur boondein cup mein ponchho", en: "wait, put something cold out, and wipe the drops into the cup" },
    hawa: { act: "step", hi: "din ya raat karo, ruko, aur hawa ke saath chalo", en: "set day or night, wait, and go with the breeze" },
    chakra: { act: "step", hi: "dhoop se zameen tak, chakra ek-ek kadam chalao", en: "run the cycle a step at a time, from the sun down into the ground" } },
  // r7 games: Aakash (the Earth's motions, seasons and eclipses, class 7 science): a model the child spins and moves round
  aakash: { chakkar: { act: "turn", hi: "Prithvi ko ghumao aur Sooraj ke chaaron or le jao", en: "spin the Earth and take it round the Sun" },
    ritu: { act: "move", hi: "Prithvi ko Sooraj ke chaaron or le jao aur dhoop ke dhabbe dekho", en: "move the Earth round the Sun and watch the patches of sunlight" },
    grahan: { act: "move", hi: "Chaand ko Prithvi ke chaaron or chalao aur teenon ko ek line mein lao", en: "move the Moon round the Earth and bring the three into line" } },
  // r7 games: Rang (acids, bases, indicators and neutralisation, class 7 science): a dropper worked a drop at a time
  rang: { pehchaan: { act: "test", hi: "har ghol ki ek boond indicator par daalo aur rang dekh kar alag karo", en: "drop each liquid on an indicator and sort it by its colour" },
    milao: { act: "fill", hi: "boond-boond base daalo aur rang dekho", en: "add the base drop by drop and watch the colour" } },
  // r7 games: Badlaav (physical and chemical changes, rusting and combustion, class 7 science): changes run and undone, a sigri tended
  badlaav: { palat: { act: "test", hi: "badlaav karke dekho, ulta karke dekho, aur nishaan pehchaano", en: "run each change, try to undo it and spot the signs" },
    aag: { act: "move", hi: "aag ki teen cheezon mein se ek hatao ya badhao, aur dekho kya hota hai", en: "take away or give more of a side of the fire and watch" } },
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
