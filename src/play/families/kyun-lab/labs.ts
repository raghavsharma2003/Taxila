// Kyun-Lab causal models (DESIGN.md §3.4). Each lab is written from its kit topic's `expectations` (quoted in `source`) and
// is deterministic: an outcome is computed, never drawn or generated. Numbers are illustrative model values for a fair
// comparison, never claims about a real place ("about" in the UI); where a physical law exists it is used (the pendulum's
// T = 2π√(L/g); the shadow's similar triangles), and the kit's own statement decides the direction everywhere else.
//
// A misconception is stored as the model the child would BELIEVE (`beliefs`): the picker prefers set-ups where the belief
// and the truth disagree, so a prediction tells them apart.
import type { Lang } from "../../../../shared/play.ts";

export type L10n = Record<Lang, string>;
export interface LabLevel { id: string; label: L10n; icon: string }
export interface LabFactor { id: string; label: L10n; levels: LabLevel[] }
export type OutcomeKind = "count" | "time" | "amount" | "size" | "float" | "temp" | "stick" | "glow" | "starch";
/** Outcomes that are yes/no (a level must make the two set-ups disagree for the condition to show). */
export const BINARY_KINDS: readonly OutcomeKind[] = ["float", "stick", "starch"];
export interface LabOutcome { id: string; label: L10n; unit: L10n; kind: OutcomeKind; max: number; /** "more" outcome is the bigger number, except time (less = faster) */ better: "more" | "less"; runLabel: L10n }
/** product: value = base × Π mult; rate: value = base ÷ Π mult (time to finish); density: floats if base·Π mult < water. */
export interface LabModel { kind: "product" | "rate" | "density"; base: number; mult: Record<string, Record<string, number>>; water?: Record<string, number> }
export interface LabBelief { mal: string; mult: Record<string, Record<string, number>> }
export interface LabDef {
  id: string; topicIds: string[];
  title: L10n; noun: L10n;
  factors: LabFactor[]; outcome: LabOutcome; model: LabModel; beliefs: LabBelief[];
  defaults: Record<string, string>;
  /** factors a child may set (the rest are drawn but fixed) */
  free: string[];
  source: string;
  /** true when the outcome is a law or a category (pendulum period, similar triangles, floats / sticks / glows); false =
   *  an illustrative model value for a fair comparison, shown with "lagbhag" (about) and never as a measured fact */
  exact?: boolean;
}
const t = (en: string, hinglish: string, hi: string): L10n => ({ en, hinglish, hi });

export const LABS: Record<string, LabDef> = {
  ankur: {
    id: "ankur", topicIds: ["c6-science-ch10-t02"],
    title: t("Sprout lab", "Ankur lab", "अंकुर लैब"), noun: t("tray", "tray", "ट्रे"),
    factors: [
      { id: "water", label: t("Water", "Paani", "पानी"), levels: [{ id: "dry", label: t("dry", "sookha", "सूखा"), icon: "dry" }, { id: "damp", label: t("damp", "geela", "गीला"), icon: "damp" }, { id: "under", label: t("under water", "paani mein doobe", "पानी में डूबे"), icon: "under" }] },
      { id: "air", label: t("Air", "Hawa", "हवा"), levels: [{ id: "open", label: t("open", "khula", "खुला"), icon: "open" }, { id: "sealed", label: t("air pumped out", "hawa nikaali", "हवा निकाली"), icon: "sealed" }] },
      { id: "warm", label: t("Warmth", "Garmi", "गर्मी"), levels: [{ id: "room", label: t("room", "kamra", "कमरा"), icon: "room" }, { id: "fridge", label: t("fridge", "fridge", "फ्रिज"), icon: "fridge" }] },
      { id: "light", label: t("Light", "Roshni", "रोशनी"), levels: [{ id: "window", label: t("window", "khidki", "खिड़की"), icon: "sun" }, { id: "dark", label: t("cupboard", "almari", "अलमारी"), icon: "dark" }] },
      { id: "base", label: t("Bed", "Bistar", "बिस्तर"), levels: [{ id: "cotton", label: t("cotton", "rui", "रुई"), icon: "cotton" }, { id: "soil", label: t("soil", "mitti", "मिट्टी"), icon: "soil" }] },
    ],
    outcome: { id: "sprouts", label: t("Sprouted (of 10)", "Ankur (10 mein se)", "अंकुर (10 में से)"), unit: t("seeds", "beej", "बीज"), kind: "count", max: 10, better: "more", runLabel: t("3 days", "3 din", "3 दिन") },
    model: { kind: "product", base: 10, mult: { water: { dry: 0, damp: 1, under: 0.2 }, air: { open: 1, sealed: 0 }, warm: { room: 1, fridge: 0.1 }, light: { window: 1, dark: 1 }, base: { cotton: 1, soil: 1 } } },
    beliefs: [
      { mal: "needs-soil-light", mult: { light: { dark: 0 }, base: { cotton: 0 } } },
      { mal: "more-water-better", mult: { water: { under: 1.2 } } },
      { mal: "warmth-irrelevant", mult: { warm: { fridge: 1 } } },
    ],
    defaults: { water: "damp", air: "open", warm: "room", light: "window", base: "cotton" },
    free: ["water", "air", "warm", "light", "base"],
    source: "c6-science-ch10-t02 expectations: water, air and suitable warmth needed; soil and sunlight not needed to germinate (moong sprouts in a wet cloth in the dark); seeds fully under water get too little air and germinate poorly or not at all",
  },
  sukhao: {
    id: "sukhao", topicIds: ["c6-science-ch08-t03", "c6-science-ch01-t02", "c7-science-ch01-t01"],
    title: t("Drying lab", "Sukhao lab", "सुखाओ लैब"), noun: t("shirt", "kapda", "कपड़ा"),
    factors: [
      { id: "sun", label: t("Place", "Jagah", "जगह"), levels: [{ id: "sun", label: t("sun", "dhoop", "धूप"), icon: "sun" }, { id: "shade", label: t("shade", "chhaon", "छाँव"), icon: "shade" }] },
      { id: "wind", label: t("Wind", "Hawa", "हवा"), levels: [{ id: "fan", label: t("fan", "pankha", "पंखा"), icon: "fan" }, { id: "still", label: t("still", "ruki", "रुकी"), icon: "still" }] },
      { id: "spread", label: t("Spread", "Phailao", "फैलाव"), levels: [{ id: "spread", label: t("spread out", "phaila", "फैला"), icon: "spread" }, { id: "folded", label: t("folded", "taha", "तह"), icon: "folded" }] },
      { id: "air", label: t("Weather", "Mausam", "मौसम"), levels: [{ id: "dry", label: t("dry day", "sookha din", "सूखा दिन"), icon: "dry" }, { id: "humid", label: t("humid day", "umas", "उमस"), icon: "humid" }] },
    ],
    outcome: { id: "minutes", label: t("Time to dry", "Sookhne ka samay", "सूखने का समय"), unit: t("min", "min", "मिनट"), kind: "time", max: 600, better: "less", runLabel: t("run the clock", "ghadi chalao", "घड़ी चलाओ") },
    model: { kind: "rate", base: 240, mult: { sun: { sun: 2, shade: 1 }, wind: { fan: 1.8, still: 1 }, spread: { spread: 2, folded: 1 }, air: { dry: 1.5, humid: 0.6 } } },
    beliefs: [{ mal: "only-temperature", mult: { wind: { fan: 1 }, spread: { spread: 1, folded: 1 }, air: { dry: 1, humid: 1 } } }],
    defaults: { sun: "shade", wind: "still", spread: "spread", air: "dry" },
    free: ["sun", "wind", "spread", "air"],
    source: "c6-science-ch08-t03 expectations: evaporation is faster when hotter, with wind, over a larger surface and in dry air; test one factor by changing only that factor",
  },
  jhoola: {
    id: "jhoola", topicIds: ["c7-science-ch08-t01"],
    title: t("Pendulum lab", "Jhoola lab", "झूला लैब"), noun: t("pendulum", "pendulum", "पेंडुलम"),
    factors: [
      { id: "len", label: t("Thread", "Dhaaga", "धागा"), levels: [{ id: "short", label: t("25 cm", "25 cm", "25 सेमी"), icon: "short" }, { id: "long", label: t("100 cm", "100 cm", "100 सेमी"), icon: "long" }] },
      { id: "bob", label: t("Bob", "Gola", "गोला"), levels: [{ id: "light", label: t("light", "halka", "हल्का"), icon: "light" }, { id: "heavy", label: t("heavy", "bhaari", "भारी"), icon: "heavy" }] },
      { id: "pull", label: t("Pull", "Kheench", "खींच"), levels: [{ id: "small", label: t("small", "thoda", "थोड़ा"), icon: "small" }, { id: "big", label: t("big", "zyada", "ज़्यादा"), icon: "big" }] },
    ],
    outcome: { id: "t10", label: t("Time for 10 swings", "10 jhoolon ka samay", "10 झूलों का समय"), unit: t("s", "s", "से"), kind: "time", max: 60, better: "less", runLabel: t("10 swings", "10 jhoole", "10 झूले") },
    // T10 = 10 · 2π√(L/g): 25 cm → 10.0 s, 100 cm → 20.1 s; a 30° pull lengthens the period by about 1.7% (finite amplitude)
    model: { kind: "product", base: 10.03, mult: { len: { short: 1, long: 2 }, bob: { light: 1, heavy: 1 }, pull: { small: 1, big: 1.017 } } },
    beliefs: [
      { mal: "heavy-faster", mult: { bob: { heavy: 0.7 } } },
      { mal: "pull-changes-period", mult: { pull: { big: 1.5 } } },
    ],
    defaults: { len: "short", bob: "light", pull: "small" },
    free: ["len", "bob", "pull"],
    exact: true,
    source: "c7-science-ch08-t01 expectations: the time period depends on the length of the thread (longer swings more slowly), not on the mass of the bob, and for small swings it hardly depends on how far the bob is pulled",
  },
  jang: {
    id: "jang", topicIds: ["c7-science-ch04-t02"],
    title: t("Rust lab", "Jang lab", "जंग लैब"), noun: t("nail", "keel", "कील"),
    factors: [
      { id: "water", label: t("Water", "Paani", "पानी"), levels: [{ id: "wet", label: t("wet", "geela", "गीला"), icon: "damp" }, { id: "dry", label: t("dry (drying salt)", "sookha (sukhane wala namak)", "सूखा"), icon: "dry" }] },
      { id: "air", label: t("Air", "Hawa", "हवा"), levels: [{ id: "open", label: t("open", "khula", "खुला"), icon: "open" }, { id: "none", label: t("boiled water + oil", "ubla paani + tel", "उबला पानी + तेल"), icon: "sealed" }] },
      { id: "coat", label: t("Coat", "Parat", "परत"), levels: [{ id: "bare", label: t("bare", "nangi", "खुली"), icon: "bare" }, { id: "paint", label: t("painted", "paint wali", "पेंट"), icon: "paint" }] },
    ],
    outcome: { id: "rust", label: t("Rust after 7 days", "7 din baad jang", "7 दिन बाद जंग"), unit: t("of 10", "10 mein", "10 में"), kind: "amount", max: 10, better: "more", runLabel: t("7 days", "7 din", "7 दिन") },
    model: { kind: "product", base: 9, mult: { water: { wet: 1, dry: 0.05 }, air: { open: 1, none: 0.05 }, coat: { bare: 1, paint: 0.05 } } },
    beliefs: [{ mal: "one-of-air-water", mult: { air: { none: 1 } } }],
    defaults: { water: "wet", air: "open", coat: "bare" },
    free: ["water", "air", "coat"],
    source: "c7-science-ch04-t02 expectations: both oxygen and water are needed; iron in dry air, or in water with no air, hardly rusts; paint keeps air and water away",
  },
  parchhai: {
    id: "parchhai", topicIds: ["c7-science-ch11-t02"],
    title: t("Shadow lab", "Parchhai lab", "परछाई लैब"), noun: t("set-up", "set-up", "सेट-अप"),
    factors: [
      { id: "dist", label: t("Ball to torch", "Gend se torch", "गेंद से टॉर्च"), levels: [{ id: "near", label: t("20 cm", "20 cm", "20 सेमी"), icon: "near" }, { id: "far", label: t("50 cm", "50 cm", "50 सेमी"), icon: "far" }] },
      { id: "ball", label: t("Ball colour", "Gend ka rang", "गेंद का रंग"), levels: [{ id: "red", label: t("red", "laal", "लाल"), icon: "red" }, { id: "blue", label: t("blue", "neeli", "नीली"), icon: "blue" }] },
    ],
    // similar triangles: a 10 cm ball, the wall 100 cm from the torch → shadow = 10 × 100 / d
    outcome: { id: "shadow", label: t("Shadow size", "Parchhai ka size", "परछाई का आकार"), unit: t("cm", "cm", "सेमी"), kind: "size", max: 60, better: "more", runLabel: t("switch on", "torch jalao", "टॉर्च जलाओ") },
    model: { kind: "product", base: 50, mult: { dist: { near: 1, far: 0.4 }, ball: { red: 1, blue: 1 } } },
    beliefs: [{ mal: "shadow-same-size", mult: { dist: { far: 1 } } }],
    defaults: { dist: "near", ball: "red" },
    free: ["dist", "ball"],
    exact: true,
    source: "c7-science-ch11-t02 expectations: light travels in straight lines; bringing an object closer to the light makes its shadow bigger; a shadow is dark and shows the outline, not the colour",
  },
  rang: {
    id: "rang", topicIds: ["c7-science-ch07-t03"],
    title: t("Sun-heat lab", "Dhoop-garmi lab", "धूप-गर्मी लैब"), noun: t("can", "dabba", "डिब्बा"),
    factors: [
      { id: "colour", label: t("Colour", "Rang", "रंग"), levels: [{ id: "black", label: t("dull black", "kaala", "काला"), icon: "black" }, { id: "white", label: t("white", "safed", "सफ़ेद"), icon: "white" }] },
      { id: "place", label: t("Place", "Jagah", "जगह"), levels: [{ id: "sun", label: t("sun", "dhoop", "धूप"), icon: "sun" }, { id: "shade", label: t("shade", "chhaon", "छाँव"), icon: "shade" }] },
    ],
    outcome: { id: "rise", label: t("Water warmed by", "Paani kitna garam", "पानी कितना गरम"), unit: t("°C", "°C", "°C"), kind: "temp", max: 20, better: "more", runLabel: t("30 minutes", "30 minute", "30 मिनट") },
    model: { kind: "product", base: 14, mult: { colour: { black: 1, white: 0.43 }, place: { sun: 1, shade: 0.12 } } },
    beliefs: [{ mal: "black-attracts-heat", mult: { place: { shade: 1 } } }],
    defaults: { colour: "black", place: "sun" },
    free: ["colour", "place"],
    source: "c7-science-ch07-t03 expectations: dark and dull surfaces absorb more radiation and heat up faster in sunlight; light-coloured surfaces reflect more and stay cooler",
  },
  tairna: {
    id: "tairna", topicIds: ["c4-evs-ch07-t01", "c6-science-ch06-t01"],
    title: t("Float lab", "Tairo lab", "तैरो लैब"), noun: t("thing", "cheez", "चीज़"),
    factors: [
      { id: "stuff", label: t("Made of", "Kis cheez ka", "किस चीज़ का"), levels: [{ id: "wood", label: t("wood", "lakdi", "लकड़ी"), icon: "wood" }, { id: "iron", label: t("iron", "loha", "लोहा"), icon: "iron" }, { id: "clay", label: t("clay", "mitti", "मिट्टी"), icon: "clay" }] },
      { id: "shape", label: t("Shape", "Shape", "आकार"), levels: [{ id: "lump", label: t("solid lump", "theli", "ठोस गोला"), icon: "lump" }, { id: "boat", label: t("hollow boat", "naav", "नाव"), icon: "boat" }] },
      { id: "size", label: t("Size", "Size", "आकार-माप"), levels: [{ id: "small", label: t("small", "chhota", "छोटा"), icon: "small" }, { id: "big", label: t("big, heavy", "bada, bhaari", "बड़ा, भारी"), icon: "big" }] },
    ],
    // floats when (material density × shape factor) < 1: a hollow boat pushes aside much more water for its weight
    outcome: { id: "floats", label: t("Floats?", "Tairti hai?", "तैरती है?"), unit: t("", "", ""), kind: "float", max: 1, better: "more", runLabel: t("into the water", "paani mein daalo", "पानी में डालो") },
    // size does not change floating (a big log floats, a small nail sinks): density, not weight, decides
    model: { kind: "density", base: 1, mult: { stuff: { wood: 0.6, iron: 7.8, clay: 1.8 }, shape: { lump: 1, boat: 0.08 }, size: { small: 1, big: 1 } } },
    beliefs: [
      { mal: "sinker-never-floats", mult: { shape: { boat: 1 } } },
      // "heavy things sink, light things float": the material is ignored and weight (size) decides
      { mal: "heavy-sinks", mult: { stuff: { wood: 1, iron: 1, clay: 1 }, size: { small: 0.5, big: 2 } } },
    ],
    defaults: { stuff: "wood", shape: "lump", size: "small" },
    free: ["stuff", "shape", "size"],
    exact: true,
    source: "c4-evs-ch07-t01 expectations: floating depends on what a thing is made of and on its shape; a hollow boat pushes aside more water so it can float; the same lump rolled into a ball sinks. c6-science-ch06-t01: whether an object floats or sinks depends on its material and its shape, not just its weight: a big log floats and a small iron nail sinks",
  },
  barf: {
    id: "barf", topicIds: ["c7-science-ch07-t01"],
    title: t("Ice lab", "Barf lab", "बर्फ़ लैब"), noun: t("ice cube", "barf", "बर्फ़"),
    factors: [
      { id: "wrap", label: t("Wrapped in", "Lipta", "लिपटा"), levels: [{ id: "none", label: t("nothing", "kuch nahi", "कुछ नहीं"), icon: "open" }, { id: "wool", label: t("wool sweater", "oon sweater", "ऊन स्वेटर"), icon: "wool" }] },
      { id: "base", label: t("Kept on", "Kis par", "किस पर"), levels: [{ id: "wood", label: t("wooden board", "lakdi", "लकड़ी"), icon: "wood" }, { id: "steel", label: t("steel plate", "steel plate", "स्टील प्लेट"), icon: "steel" }] },
      { id: "place", label: t("Place", "Jagah", "जगह"), levels: [{ id: "room", label: t("room", "kamra", "कमरा"), icon: "room" }, { id: "sun", label: t("sunny window", "dhoop", "धूप"), icon: "sun" }] },
    ],
    outcome: { id: "melt", label: t("Time to melt", "Pighalne ka samay", "पिघलने का समय"), unit: t("min", "min", "मिनट"), kind: "time", max: 600, better: "less", runLabel: t("run the clock", "ghadi chalao", "घड़ी चलाओ") },
    // rate model: heat flows IN from the warmer room; wool traps air (a poor conductor) and slows it; a steel plate
    // conducts heat into the ice faster than wood; sunlight adds radiation
    model: { kind: "rate", base: 60, mult: { wrap: { none: 1, wool: 0.4 }, base: { wood: 1, steel: 1.6 }, place: { room: 1, sun: 2.2 } } },
    beliefs: [
      { mal: "wool-makes-heat", mult: { wrap: { wool: 1.5 } } },
      { mal: "metal-is-colder", mult: { base: { steel: 0.6 } } },
    ],
    defaults: { wrap: "none", base: "wood", place: "room" },
    free: ["wrap", "base", "place"],
    source: "c7-science-ch07-t01 expectations: heat flows from hotter to colder; woollen clothes do not make heat, they trap air, a poor conductor, so heat flows slowly; metals conduct heat much faster than wood (the kit's own diagnostic: the ice wrapped in a sweater melts more slowly)",
  },
  chumbak: {
    id: "chumbak", topicIds: ["c6-science-ch04-t01"],
    title: t("Magnet lab", "Chumbak lab", "चुंबक लैब"), noun: t("thing", "cheez", "चीज़"),
    factors: [
      { id: "thing", label: t("Object", "Cheez", "चीज़"), levels: [
        { id: "iron", label: t("iron nail", "lohe ki keel", "लोहे की कील"), icon: "iron" }, { id: "alu", label: t("aluminium foil", "foil", "फ़ॉइल"), icon: "aluminium" },
        { id: "copper", label: t("copper wire", "taamba taar", "ताँबा तार"), icon: "copper" }, { id: "brass", label: t("brass key", "peetal chaabi", "पीतल चाबी"), icon: "brass" },
        { id: "plastic", label: t("plastic clip", "plastic clip", "प्लास्टिक क्लिप"), icon: "plastic" }] },
      { id: "between", label: t("In between", "Beech mein", "बीच में"), levels: [{ id: "none", label: t("nothing", "kuch nahi", "कुछ नहीं"), icon: "open" }, { id: "paper", label: t("a sheet of paper", "kaagaz", "काग़ज़"), icon: "paper" }] },
    ],
    outcome: { id: "stick", label: t("Sticks to the magnet?", "Magnet se chipka?", "चुंबक से चिपका?"), unit: t("", "", ""), kind: "stick", max: 1, better: "more", runLabel: t("bring the magnet", "magnet laao", "चुंबक लाओ") },
    model: { kind: "product", base: 1, mult: { thing: { iron: 1, alu: 0, copper: 0, brass: 0, plastic: 0 }, between: { none: 1, paper: 1 } } },
    beliefs: [
      { mal: "all-metals-magnetic", mult: { thing: { alu: 1, copper: 1, brass: 1 } } },
      { mal: "magnet-needs-touch", mult: { between: { paper: 0 } } },
    ],
    defaults: { thing: "iron", between: "none" },
    free: ["thing", "between"],
    exact: true,
    source: "c6-science-ch04-t01 expectations: a magnet attracts iron, nickel, cobalt and steels with iron; aluminium, copper, brass, plastic and wood are non-magnetic; being metal does not make it magnetic, we test; magnetic force acts through paper, cloth, glass and water",
  },
  bijli: {
    id: "bijli", topicIds: ["c7-science-ch03-t03"],
    title: t("Tester lab", "Tester lab", "टेस्टर लैब"), noun: t("tester", "tester", "टेस्टर"),
    factors: [
      { id: "gap", label: t("In the gap", "Gap mein", "गैप में"), levels: [
        { id: "copper", label: t("copper wire", "taamba taar", "ताँबा तार"), icon: "copper" }, { id: "iron", label: t("iron nail", "lohe ki keel", "लोहे की कील"), icon: "iron" },
        { id: "graphite", label: t("pencil lead", "pencil ki nib", "पेंसिल लेड"), icon: "graphite" }, { id: "salt", label: t("salt water", "namak paani", "नमक पानी"), icon: "water" },
        { id: "plastic", label: t("plastic scale", "plastic scale", "प्लास्टिक स्केल"), icon: "plastic" }, { id: "wood", label: t("wooden stick", "lakdi", "लकड़ी"), icon: "wood" },
        { id: "rubber", label: t("rubber band", "rubber", "रबर"), icon: "rubber" }] },
    ],
    // an LED tester (cell, LED, two wires with a gap): bright = conducts well, dim = conducts a little, off = insulator
    outcome: { id: "glow", label: t("LED glow", "LED ki roshni", "LED की रोशनी"), unit: t("", "", ""), kind: "glow", max: 2, better: "more", runLabel: t("close the gap", "gap jodo", "गैप जोड़ो") },
    model: { kind: "product", base: 1, mult: { gap: { copper: 2, iron: 2, graphite: 2, salt: 1, plastic: 0, wood: 0, rubber: 0 } } },
    beliefs: [
      { mal: "water-never-conducts", mult: { gap: { salt: 0 } } },
      { mal: "only-metals-conduct", mult: { gap: { graphite: 0 } } },
    ],
    defaults: { gap: "copper" },
    free: ["gap"],
    exact: true,
    source: "c7-science-ch03-t03 expectations: a tester with a cell and a bulb (here an LED) and a gap shows conductors; metals conduct; graphite (pencil lead) is a non-metal that conducts; plastic, rubber, wood are insulators; salt water conducts (the kit's remediation: an LED tester glowing in salt water)",
  },
  phaphoond: {
    id: "phaphoond", topicIds: ["c5-evs-ch03-t01"],
    title: t("Mould lab", "Phaphoond lab", "फफूँद लैब"), noun: t("roti", "roti", "रोटी"),
    factors: [
      { id: "moist", label: t("Moisture", "Nami", "नमी"), levels: [{ id: "dry", label: t("dry", "sookhi", "सूखी"), icon: "dry" }, { id: "damp", label: t("damp", "geeli", "गीली"), icon: "damp" }] },
      { id: "warm", label: t("Kept in", "Kahan", "कहाँ"), levels: [{ id: "fridge", label: t("fridge", "fridge", "फ्रिज"), icon: "fridge" }, { id: "room", label: t("room", "kamra", "कमरा"), icon: "room" }, { id: "warm", label: t("warm corner", "garam kona", "गरम कोना"), icon: "sun" }] },
      { id: "cover", label: t("Cover", "Dhakkan", "ढक्कन"), levels: [{ id: "open", label: t("open", "khuli", "खुली"), icon: "open" }, { id: "closed", label: t("closed box", "band dabba", "बंद डिब्बा"), icon: "sealed" }] },
    ],
    outcome: { id: "spots", label: t("Mould spots after 3 days", "3 din baad dhabbe", "3 दिन बाद धब्बे"), unit: t("spots", "dhabbe", "धब्बे"), kind: "count", max: 12, better: "more", runLabel: t("3 days", "3 din", "3 दिन") },
    // both rotis are the SAME age in every set-up: age cannot be the cause (the kit's own diagnostic)
    model: { kind: "product", base: 9, mult: { moist: { dry: 0.1, damp: 1 }, warm: { fridge: 0.15, room: 1, warm: 1.3 }, cover: { open: 1, closed: 0.6 } } },
    beliefs: [{ mal: "only-age-spoils", mult: { moist: { dry: 1, damp: 1 }, warm: { fridge: 1, room: 1, warm: 1 }, cover: { open: 1, closed: 1 } } }],
    defaults: { moist: "damp", warm: "room", cover: "open" },
    free: ["moist", "warm", "cover"],
    source: "c5-evs-ch03-t01 expectations: food spoils because microbes grow on it, not just because time passes; they grow fastest when food is warm and moist; covering food, keeping it cool and dry slow them down",
  },
  patta: {
    id: "patta", topicIds: ["c7-science-ch10-t01"],
    title: t("Leaf lab", "Patta lab", "पत्ता लैब"), noun: t("leaf", "patta", "पत्ता"),
    factors: [
      { id: "light", label: t("Light", "Roshni", "रोशनी"), levels: [{ id: "sun", label: t("in sunlight", "dhoop mein", "धूप में"), icon: "sun" }, { id: "covered", label: t("black paper", "kaala kaagaz", "काला काग़ज़"), icon: "dark" }] },
      { id: "part", label: t("Leaf part", "Patte ka hissa", "पत्ते का हिस्सा"), levels: [{ id: "green", label: t("green part", "hara", "हरा"), icon: "leaf" }, { id: "white", label: t("white part", "safed", "सफ़ेद"), icon: "white" }] },
      { id: "co2", label: t("Air", "Hawa", "हवा"), levels: [{ id: "air", label: t("open air", "khuli hawa", "खुली हवा"), icon: "open" }, { id: "none", label: t("no CO2 (jar)", "CO2 nahi", "CO2 नहीं"), icon: "sealed" }] },
    ],
    // the iodine test after a day: blue-black = starch was made (photosynthesis); brown = none
    outcome: { id: "starch", label: t("Iodine test", "Iodine test", "आयोडीन टेस्ट"), unit: t("", "", ""), kind: "starch", max: 1, better: "more", runLabel: t("iodine drop", "iodine daalo", "आयोडीन डालो") },
    model: { kind: "product", base: 1, mult: { light: { sun: 1, covered: 0 }, part: { green: 1, white: 0 }, co2: { air: 1, none: 0 } } },
    beliefs: [
      { mal: "food-from-soil", mult: { light: { covered: 1 }, part: { white: 1 }, co2: { none: 1 } } },
      { mal: "light-only", mult: { co2: { none: 1 } } },
    ],
    defaults: { light: "sun", part: "green", co2: "air" },
    free: ["light", "part", "co2"],
    exact: true,
    source: "c7-science-ch10-t01 expectations: chlorophyll uses sunlight to combine carbon dioxide and water into glucose stored as starch; a leaf that made food turns blue-black with iodine; the starch test on a partly covered leaf is evidence for the need for sunlight and chlorophyll; soil gives water and minerals, not food",
  },
};

/** The outcome of one set-up under a model (`beliefs` overrides apply on top of the true multipliers). */
export function outcomeOf(lab: LabDef, setup: Record<string, string>, override?: Record<string, Record<string, number>>): number {
  const mult = (f: string, lv: string) => override?.[f]?.[lv] ?? lab.model.mult[f]?.[lv] ?? 1;
  const prod = lab.factors.reduce((p, f) => p * mult(f.id, setup[f.id] ?? lab.defaults[f.id]), 1);
  const m = lab.model;
  if (m.kind === "density") return m.base * prod < 1 ? 1 : 0;
  if (m.kind === "rate") return prod === 0 ? lab.outcome.max : Math.min(lab.outcome.max, Math.round((m.base / prod) / 5) * 5);
  const v = Math.min(lab.outcome.max, m.base * prod);
  return lab.outcome.kind === "count" || lab.outcome.kind === "amount" || lab.outcome.kind === "glow" || BINARY_KINDS.includes(lab.outcome.kind) ? Math.round(v) : Math.round(v * 10) / 10;
}
