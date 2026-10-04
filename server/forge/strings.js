// The G1 strings table and closed registries (FACTORY.md §5.1 Q8 for G1: "strings-table ids only (pre-cleared)";
// §6.3 skin = closed InterestId). Every child-visible string a G1 fill can carry is a kit string or a row here.
// Rows are titles (no digits, no answers, no names, no sentences a voice could recite), cleared once offline by
// tests/forge-g1.test.mjs "strings table" (local predicates) and evals/forge-g1.mjs §5 (Azure Content Safety over
// every HOOKS and TEMPLATE_STRINGS row).
// Adding a row = a reviewed code change, never a model output.

/** Closed skin registry (FACTORY.md §13 InterestId). */
export const INTEREST_IDS = ["cricket", "football", "food", "animals", "vehicles", "films_music", "festivals", "space", "trains", "drawing", "stories", "building", "nature", "generic"];

/** Parent-typed interests and kit interestContexts → InterestId, by keyword (first match wins). */
const INTEREST_WORDS = [
  ["cricket", /cricket|bat\b|ipl|wicket|kohli|dhoni/i],
  // W2-B #5 (personalisation gap 5): five of the twelve onboarding tiles (src/child/interests.ts) mapped to generic
  ["football", /football|soccer|messi|ronaldo|fifa|\bisl\b|goalkeeper/i],
  ["trains", /train|railway|rail\b|metro|station/i],
  ["space", /space|rocket|isro|planet|star|moon|chandrayaan|astronaut|sky/i],
  ["vehicles", /car\b|cars|bike|cycle|bicycle|scooter|bus\b|truck|vehicle|auto\b|tractor/i],
  ["animals", /animal|dog|cat|pet|bird|cow|goat|elephant|tiger|zoo|fish|butterfl/i],
  ["food", /food|cook|mango|sweet|jalebi|roti|pizza|ladoo|chai|fruit|kitchen|thali|eat/i],
  ["festivals", /festival|diwali|holi|eid|mela|fair|rangoli|kite|sankranti|pongal|onam|puja|wedding/i],
  ["films_music", /film|movie|music|song|dance|sing|cartoon|tv\b|guitar|drum/i],
  ["drawing", /draw|paint|colou?r|sketch|crayon|\bart\b|craft/i],
  ["stories", /stor(y|ies)|\bbooks?\b|kahani|comic|fairy ?tale|\bread(ing)?\b/i],
  ["building", /build|lego|block|construct|brick|robot|making things/i],
  ["nature", /nature|garden|\btrees?\b|plants?\b|flower|\bparks?\b|forest|river|mountain|outdoor|\bleaf/i],
];
export function interestIdOf(text) {
  for (const [id, re] of INTEREST_WORDS) if (re.test(String(text || ""))) return id;
  return null;
}
/** A child's interests as a sorted, deduplicated InterestId set (never empty: "generic"). */
export function interestSet(interests) {
  const out = new Set((interests || []).map(interestIdOf).filter(Boolean));
  return out.size ? [...out].sort() : ["generic"];
}

/** Title rows per skin. `id` is what the model may pick; the strings are what the child sees. */
export const HOOKS = {
  cricket: [
    { id: "cricket.nets", en: "Cricket nets practice", hi: "क्रिकेट नेट्स प्रैक्टिस", hi_latn: "Cricket nets practice" },
    { id: "cricket.over", en: "One more over", hi: "एक और ओवर", hi_latn: "Ek aur over" },
    { id: "cricket.scorer", en: "The scorer's puzzle", hi: "स्कोरर की पहेली", hi_latn: "Scorer ki paheli" },
  ],
  food: [
    { id: "food.kitchen", en: "Kitchen helper", hi: "रसोई के मददगार", hi_latn: "Rasoi ke madadgaar" },
    { id: "food.tiffin", en: "Tiffin time puzzle", hi: "टिफ़िन टाइम पहेली", hi_latn: "Tiffin time paheli" },
    { id: "food.market", en: "Sabzi market check", hi: "सब्ज़ी मंडी जाँच", hi_latn: "Sabzi mandi check" },
  ],
  animals: [
    { id: "animals.zoo", en: "Zoo keeper's task", hi: "चिड़ियाघर का काम", hi_latn: "Zoo keeper ka kaam" },
    { id: "animals.farm", en: "Farm morning puzzle", hi: "खेत की सुबह की पहेली", hi_latn: "Khet ki subah ki paheli" },
    { id: "animals.forest", en: "Forest trail", hi: "जंगल की पगडंडी", hi_latn: "Jungle ki pagdandi" },
  ],
  vehicles: [
    { id: "vehicles.garage", en: "Garage check", hi: "गैराज जाँच", hi_latn: "Garage check" },
    { id: "vehicles.road", en: "Road trip puzzle", hi: "रोड ट्रिप पहेली", hi_latn: "Road trip paheli" },
    { id: "vehicles.pit", en: "Pit stop challenge", hi: "पिट स्टॉप चुनौती", hi_latn: "Pit stop challenge" },
  ],
  films_music: [
    { id: "films_music.stage", en: "Backstage puzzle", hi: "मंच के पीछे की पहेली", hi_latn: "Backstage paheli" },
    { id: "films_music.band", en: "Band practice", hi: "बैंड प्रैक्टिस", hi_latn: "Band practice" },
    { id: "films_music.set", en: "On the film set", hi: "फ़िल्म सेट पर", hi_latn: "Film set par" },
  ],
  festivals: [
    { id: "festivals.mela", en: "Mela day puzzle", hi: "मेले की पहेली", hi_latn: "Mele ki paheli" },
    { id: "festivals.rangoli", en: "Rangoli corner", hi: "रंगोली कोना", hi_latn: "Rangoli kona" },
    { id: "festivals.kite", en: "Kite day challenge", hi: "पतंग दिवस चुनौती", hi_latn: "Patang din challenge" },
  ],
  space: [
    { id: "space.mission", en: "Mission control check", hi: "मिशन कंट्रोल जाँच", hi_latn: "Mission control check" },
    { id: "space.launch", en: "Launch pad puzzle", hi: "लॉन्च पैड पहेली", hi_latn: "Launch pad paheli" },
    { id: "space.orbit", en: "In orbit", hi: "कक्षा में", hi_latn: "Orbit mein" },
  ],
  trains: [
    { id: "trains.platform", en: "Platform puzzle", hi: "प्लेटफ़ॉर्म पहेली", hi_latn: "Platform paheli" },
    { id: "trains.signal", en: "Signal box check", hi: "सिग्नल बॉक्स जाँच", hi_latn: "Signal box check" },
    { id: "trains.journey", en: "Train journey task", hi: "रेल यात्रा का काम", hi_latn: "Rail yatra ka kaam" },
  ],
  football: [
    { id: "football.match", en: "Match day puzzle", hi: "मैच के दिन की पहेली", hi_latn: "Match ke din ki paheli" },
    { id: "football.penalty", en: "Penalty spot challenge", hi: "पेनल्टी स्पॉट चुनौती", hi_latn: "Penalty spot challenge" },
    { id: "football.coach", en: "Coach's practice drill", hi: "कोच की प्रैक्टिस", hi_latn: "Coach ki practice" },
  ],
  drawing: [
    { id: "drawing.sketchbook", en: "Sketchbook corner", hi: "स्केचबुक कोना", hi_latn: "Sketchbook kona" },
    { id: "drawing.colours", en: "Colour box puzzle", hi: "रंगों के डिब्बे की पहेली", hi_latn: "Rangon ke dibbe ki paheli" },
    { id: "drawing.artroom", en: "Art room task", hi: "आर्ट रूम का काम", hi_latn: "Art room ka kaam" },
  ],
  stories: [
    { id: "stories.chapter", en: "Next chapter puzzle", hi: "अगले अध्याय की पहेली", hi_latn: "Agle adhyay ki paheli" },
    { id: "stories.library", en: "Library corner", hi: "पुस्तकालय कोना", hi_latn: "Library kona" },
    { id: "stories.teller", en: "Storyteller's task", hi: "कहानीकार का काम", hi_latn: "Kahanikar ka kaam" },
  ],
  building: [
    { id: "building.blocks", en: "Building blocks puzzle", hi: "ब्लॉक्स की पहेली", hi_latn: "Blocks ki paheli" },
    { id: "building.site", en: "Site engineer's check", hi: "साइट इंजीनियर की जाँच", hi_latn: "Site engineer ki jaanch" },
    { id: "building.workshop", en: "Workshop task", hi: "वर्कशॉप का काम", hi_latn: "Workshop ka kaam" },
  ],
  nature: [
    { id: "nature.garden", en: "Garden walk puzzle", hi: "बगीचे की सैर की पहेली", hi_latn: "Bageeche ki sair ki paheli" },
    { id: "nature.park", en: "Park explorer task", hi: "पार्क खोजी का काम", hi_latn: "Park khoji ka kaam" },
    { id: "nature.river", en: "Riverside check", hi: "नदी किनारे जाँच", hi_latn: "Nadi kinare jaanch" },
  ],
  generic: [
    { id: "generic.try", en: "Your turn to try", hi: "अब तुम्हारी बारी", hi_latn: "Ab tumhari baari" },
    { id: "generic.puzzle", en: "Quick puzzle", hi: "छोटी पहेली", hi_latn: "Chhoti paheli" },
    { id: "generic.check", en: "Let's check", hi: "चलो जाँचें", hi_latn: "Chalo jaanchein" },
  ],
};
export const HOOK_BY_ID = Object.fromEntries(Object.values(HOOKS).flat().map((h) => [h.id, h]));

/** Decor sprites a skin may use (role "context": never carries a fact; scene@1 library ids). */
export const DECOR = {
  cricket: ["obj.ball", "obj.bat"], food: ["obj.mango", "obj.roti", "obj.plate", "obj.cup"],
  animals: ["animal.cow", "animal.elephant", "animal.parrot", "animal.dog", "animal.cat"], vehicles: ["obj.bus"],
  films_music: ["sky.star"], festivals: ["plant.lotus", "plant.flower"], space: ["sky.moon", "sky.star", "sky.sun"],
  trains: ["place.school"],
  football: ["obj.ball"], drawing: ["obj.pencil", "obj.ruler"], stories: ["obj.book"], building: ["obj.box", "place.house", "shape.square"],
  nature: ["plant.tree", "plant.flower", "sky.cloud", "place.hill"],
  generic: ["obj.book", "obj.pencil"],
};

/** Fixed template strings (the only non-kit, non-hook strings a scene carries). */
export const TEMPLATE_STRINGS = [
  { en: "Check", hi: "जाँचो", hi_latn: "Check karo" },
];

/** Age band from class (FACTORY.md §13 Band; class mapping is [I] until the design workstream fixes it). */
export const bandOf = (classLevel) => (classLevel <= 2 ? "B1" : classLevel <= 4 ? "B2" : classLevel <= 6 ? "B3" : "B4");
/** Child language preference → scene@1 meta.lang and the engine lang. */
export const sceneLang = (pref) => (pref === "english" ? "en" : pref === "hindi" ? "hi" : "hi-Latn+en");
