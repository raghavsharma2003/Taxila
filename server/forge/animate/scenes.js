// Round 7 M5a (owner's #4 at $0): the pilot SCENES, code-built cinematic animations for 20 class 4-7 maths and
// science topics. Each builder is code: the actors are props (shared/scene-props.js), the motion is keyframed, every
// number on screen is computed here, and captions come from a closed per-scene dictionary in the lesson's language (en,
// hinglish, hi). Beats carry the clause they belong to, so the film follows her voice (shared/scene.js lineWarp).
// No model call, no spend. → sceneFor(topicId, { lang }) → { ok, scene, errors } | null
import { normalizeScene, lintScene } from "../../../shared/scene.js";

const L3 = (lang, en, hinglish, hi) => (lang === "en" ? en : lang === "hi" ? hi : hinglish);
const A = (id, prop, at, o = {}) => ({ id, prop, at, ...o });
const T = (actor, keys, o = {}) => ({ actor, keys: keys.map(([t, k]) => ({ t, ...k })), ...o });
const cap = (t, until, text, at = "bottom") => ({ t, until, text, at });
const beat = (t, clause, says) => ({ t, clause, says });

// ───────────────────────────── science ─────────────────────────────
function waterCycle(lang) {
  return { id: "water-cycle", bg: "sky", durationMs: 16000,
    actors: [A("sun", "sun", [60, 55]), A("sea", "sea", [0, 254], { z: -1 }), A("mtn", "mountain", [270, 174], { z: -1 }), A("ground", "ground", [0, 260], { z: -2 }),
      ...[0, 1, 2].map((i) => A(`v${i}`, "vapour", [70 + i * 40, 240], { opacity: 0 })),
      A("cloud", "cloud", [120, 70], { opacity: 0 }), A("rain", "raincloud", [300, 60], { opacity: 0 }),
      ...[0, 1, 2].map((i) => A(`d${i}`, "drop", [285 + i * 16, 80], { opacity: 0 })),
      A("river", "water", [330, 262], { opacity: 0, scale: 1.4, z: -1 })],
    tracks: [
      ...[0, 1, 2].map((i) => T(`v${i}`, [[600 + i * 300, { opacity: 0, at: [70 + i * 40, 240] }], [900 + i * 300, { opacity: 1 }], [3800 + i * 300, { at: [90 + i * 30, 110], opacity: 0.2 }]])),
      T("cloud", [[3300, { opacity: 0 }], [4200, { opacity: 1 }], [7400, { at: [300, 60] }], [7600, { opacity: 0 }]]),
      T("rain", [[7400, { opacity: 0 }], [7600, { opacity: 1 }]]),
      ...[0, 1, 2].map((i) => T(`d${i}`, [[8200 + i * 200, { opacity: 1, at: [285 + i * 16, 80] }], [10400 + i * 200, { at: [285 + i * 16, 240] }], [10600 + i * 200, { opacity: 0 }]], { loop: 3000 })),
      T("river", [[11000, { opacity: 0 }], [12000, { opacity: 1 }]]),
    ],
    captions: [cap(500, 3800, L3(lang, "Sun heats the sea: evaporation", "Dhoop se paani bhaap banta hai", "धूप से पानी भाप बनता है")),
      cap(3800, 7500, L3(lang, "Vapour cools: condensation", "Bhaap thandi hokar badal", "भाप ठंडी होकर बादल")),
      cap(7500, 11000, L3(lang, "Rain falls: precipitation", "Baarish: paani wapas girta hai", "बारिश: पानी वापस गिरता है")),
      cap(11000, 16000, L3(lang, "Water collects, cycle repeats", "Paani jama hota, chakra chalta", "पानी जमा होता, चक्र चलता"))],
    beats: [beat(500, 0, "evaporation"), beat(3800, 1, "condensation"), beat(7500, 2, "precipitation"), beat(11000, 3, "collection")],
    facts: { shows: "water cycle", steps: "evaporation, condensation, precipitation, collection" } };
}
function dayNight(lang) {
  return { id: "day-night", bg: "night", durationMs: 14000,
    actors: [A("sun", "sun", [50, 150], { scale: 1.4 }), A("earth", "earthLit", [250, 150], { scale: 1.5 }), A("dark", "nightHalf", [250, 150], { scale: 1.5, z: 2 }),
      A("kid", "person", [250, 82], { z: 3 }), ...[0, 1, 2].map((i) => A(`s${i}`, "star", [350 + (i % 2) * 20, 50 + i * 90], { opacity: 0.8 }))],
    tracks: [T("earth", [[1500, { rot: 0 }], [13500, { rot: 360 }]], { ease: "linear" }),
      T("kid", [[1500, { at: [250, 82] }], [4500, { at: [319, 150] }], [7500, { at: [250, 218] }], [10500, { at: [181, 150] }], [13500, { at: [250, 82] }]], { ease: "linear" })],
    captions: [cap(0, 4500, L3(lang, "Earth spins on its axis", "Dharti apni dhuri par ghoomti", "धरती अपनी धुरी पर घूमती है"), "top"),
      cap(4500, 9000, L3(lang, "Side away from Sun: night", "Suraj se door wala hissa: raat", "सूरज से दूर वाला हिस्सा: रात"), "top"),
      cap(9000, 14000, L3(lang, "One full turn: about 24 hours", "Ek chakkar: lagbhag 24 ghante", "एक पूरा चक्कर: लगभग 24 घंटे"), "top")],
    beats: [beat(0, 0, "earth spins"), beat(4500, 1, "night on the far side"), beat(9000, 2, "one turn in 24 hours")],
    facts: { shows: "Earth rotating", "one turn": "about 24 hours", direction: "west to east" } };
}
function germination(lang) {
  return { id: "germination", bg: "field", durationMs: 14000,
    actors: [A("soil", "ground", [0, 250], { z: -1 }), A("seed", "seed", [200, 250]), A("drop", "drop", [200, 60], { opacity: 0 }), A("sun", "sun", [350, 110], { opacity: 0.4 }),
      A("root", "root", [200, 252], { scale: 0.1, opacity: 0 }), A("sprout", "sprout", [200, 250], { scale: 0.1, opacity: 0 }), A("plant", "plant", [200, 250], { opacity: 0, scale: 0.8 })],
    tracks: [T("drop", [[600, { opacity: 1, at: [200, 60] }], [2600, { at: [200, 236] }], [2900, { opacity: 0 }]]),
      T("sun", [[3000, { opacity: 0.4 }], [4000, { opacity: 1 }]]),
      T("seed", [[4200, { scale: 1 }], [5200, { scale: 1.3 }]]),
      T("root", [[5200, { opacity: 1, scale: 0.1 }], [7200, { scale: 1 }]]),
      T("sprout", [[7000, { opacity: 1, scale: 0.1 }], [9200, { scale: 1 }], [10400, { opacity: 0 }]]),
      T("plant", [[10200, { opacity: 0 }], [11200, { opacity: 1 }]])],
    captions: [cap(500, 3000, L3(lang, "Water", "Paani", "पानी"), "top"), cap(3000, 5200, L3(lang, "Air and warmth", "Hawa aur garmahat", "हवा और गर्माहट"), "top"),
      cap(5200, 10200, L3(lang, "Root goes down, shoot comes up", "Jad neeche, ankur upar", "जड़ नीचे, अंकुर ऊपर"), "top"), cap(10200, 14000, L3(lang, "A seedling grows", "Naya paudha", "नया पौधा"), "top")],
    beats: [beat(500, 0, "water"), beat(3000, 1, "air and warmth"), beat(5200, 2, "root and shoot"), beat(10200, 3, "seedling")],
    facts: { shows: "a seed germinating", needs: "water, air, warmth" } };
}
function photosynthesis(lang) {
  return { id: "photosynthesis", bg: "sky", durationMs: 14000,
    actors: [A("sun", "sun", [55, 120]), A("leaf", "leaf", [210, 160], { scale: 1.6 }),
      ...[0, 1].map((i) => A(`c${i}`, "co2", [370, 120 + i * 50], { opacity: 0 })), ...[0, 1].map((i) => A(`w${i}`, "drop", [210, 290], { opacity: 0 })),
      ...[0, 1].map((i) => A(`o${i}`, "o2", [210, 160], { opacity: 0 })), A("food", "coin", [210, 160], { opacity: 0 })],
    tracks: [...[0, 1].map((i) => T(`c${i}`, [[1500 + i * 400, { opacity: 1 }], [4200 + i * 400, { at: [230, 160] }], [4600 + i * 400, { opacity: 0 }]])),
      ...[0, 1].map((i) => T(`w${i}`, [[4000 + i * 400, { opacity: 1 }], [6800 + i * 400, { at: [205, 170] }], [7100 + i * 400, { opacity: 0 }]])),
      T("food", [[7800, { opacity: 0, scale: 0.5 }], [9000, { opacity: 1, scale: 1.2 }]]),
      ...[0, 1].map((i) => T(`o${i}`, [[9500 + i * 400, { opacity: 1 }], [12500 + i * 400, { at: [80 + i * 40, 230] }]]))],
    captions: [cap(0, 1500, L3(lang, "Sunlight falls on the leaf", "Patti par dhoop", "पत्ती पर धूप"), "top"),
      cap(1500, 4400, L3(lang, "Carbon dioxide goes in", "Carbon dioxide andar", "कार्बन डाइऑक्साइड अंदर"), "top"),
      cap(4400, 7600, L3(lang, "Water comes up from roots", "Jadon se paani", "जड़ों से पानी"), "top"),
      cap(7600, 9500, L3(lang, "The leaf makes food", "Patti khaana banati hai", "पत्ती खाना बनाती है"), "top"),
      cap(9500, 14000, L3(lang, "Oxygen goes out", "Oxygen bahar", "ऑक्सीजन बाहर"), "top")],
    beats: [beat(0, 0, "sunlight"), beat(1500, 1, "carbon dioxide in"), beat(4400, 2, "water in"), beat(7600, 3, "food made"), beat(9500, 4, "oxygen out")],
    facts: { shows: "photosynthesis in a leaf", in: "sunlight, carbon dioxide, water", out: "food (glucose), oxygen" } };
}
function foodChain(lang) {
  return { id: "food-chain", bg: "field", durationMs: 12000,
    actors: [A("sun", "sun", [50, 92]), A("grass", "grass", [80, 230], { scale: 1.6 }), A("deer", "deer", [200, 210], { opacity: 0 }), A("lion", "lion", [320, 210], { opacity: 0 }),
      A("a1", "arrow", [140, 170], { opacity: 0, scale: 0.8 }), A("a2", "arrow", [262, 170], { opacity: 0, scale: 0.8 })],
    tracks: [T("deer", [[2500, { opacity: 0, at: [240, 210] }], [3500, { opacity: 1, at: [200, 210] }]]), T("a1", [[3800, { opacity: 0 }], [4600, { opacity: 1 }]]),
      T("lion", [[6000, { opacity: 0, at: [370, 210] }], [7000, { opacity: 1, at: [320, 210] }]]), T("a2", [[7400, { opacity: 0 }], [8200, { opacity: 1 }]])],
    captions: [cap(0, 2500, L3(lang, "Grass makes food from sunlight", "Ghaas dhoop se khaana banati", "घास धूप से खाना बनाती"), "top"),
      cap(2500, 6000, L3(lang, "Deer eats grass", "Hiran ghaas khata hai", "हिरन घास खाता है"), "top"),
      cap(6000, 12000, L3(lang, "Lion eats deer", "Sher hiran khata hai", "शेर हिरन खाता है"), "top")],
    beats: [beat(0, 0, "producer"), beat(2500, 1, "herbivore"), beat(6000, 2, "carnivore")],
    facts: { shows: "a food chain", chain: "grass → deer → lion" } };
}
function evaporation(lang) {
  return { id: "evaporation", bg: "sky", durationMs: 12000,
    actors: [A("sun", "sun", [60, 55]), A("ground", "ground", [0, 258], { z: -1 }), A("pool", "water", [200, 252], { scale: 3, z: -1 }),
      ...[0, 1, 2, 3].map((i) => A(`v${i}`, "vapour", [160 + i * 26, 236], { opacity: 0 }))],
    tracks: [T("pool", [[1500, { scale: 3 }], [10500, { scale: 0.4 }]], { ease: "linear" }),
      ...[0, 1, 2, 3].map((i) => T(`v${i}`, [[1500 + i * 500, { opacity: 0, at: [160 + i * 26, 236] }], [1900 + i * 500, { opacity: 1 }], [4500 + i * 500, { opacity: 0, at: [170 + i * 22, 120] }]], { loop: 3200 }))],
    captions: [cap(0, 4000, L3(lang, "The Sun warms the water", "Dhoop paani ko garam karti", "धूप पानी को गरम करती")),
      cap(4000, 8000, L3(lang, "Water turns into vapour", "Paani bhaap ban kar udta", "पानी भाप बन कर उड़ता")),
      cap(8000, 12000, L3(lang, "The puddle dries up", "Gaddha sookh jaata hai", "गड्ढा सूख जाता है"))],
    beats: [beat(0, 0, "heat"), beat(4000, 1, "vapour rises"), beat(8000, 2, "puddle dries")],
    facts: { shows: "evaporation from a puddle", at: "the surface, at any temperature" } };
}
function circuitTester(lang) {
  return { id: "circuit-tester", bg: "lab", durationMs: 12000,
    actors: [A("bat", "battery", [110, 200]), A("off", "bulbOff", [290, 120]), A("on", "bulbOn", [290, 120], { opacity: 0 }),
      { id: "w1", parts: [{ shape: "poly", points: [[136, 200], [200, 200]], stroke: "copper", sw: 3 }, { shape: "poly", points: [[84, 200], [60, 200], [60, 70], [283, 70], [283, 112]], stroke: "copper", sw: 3 }], at: [0, 0] },
      { id: "w2", parts: [{ shape: "poly", points: [[297, 112], [297, 200], [250, 200]], stroke: "copper", sw: 3 }], at: [0, 0] },
      A("key", "pin", [225, 230], { scale: 3.2 }),
      ...[0, 1, 2].map((i) => A(`e${i}`, "electron", [60, 200 - i * 40], { opacity: 0 }))],
    tracks: [T("key", [[2500, { at: [225, 230] }], [4500, { at: [225, 200] }]]),
      T("on", [[4600, { opacity: 0 }], [5000, { opacity: 1 }]]), T("off", [[4600, { opacity: 1 }], [5000, { opacity: 0 }]]),
      ...[0, 1, 2].map((i) => T(`e${i}`, [[5200 + i * 600, { opacity: 1, at: [60, 190] }], [6200 + i * 600, { at: [60, 70] }], [7600 + i * 600, { at: [280, 70] }], [8600 + i * 600, { at: [297, 190] }], [9400 + i * 600, { at: [140, 200] }]], { ease: "linear", loop: 4400 }))],
    captions: [cap(0, 2500, L3(lang, "A gap: the bulb is off", "Beech mein gap: bulb band", "बीच में गैप: बल्ब बंद")),
      cap(2500, 5000, L3(lang, "A metal key closes the gap", "Dhaatu ki chaabi gap bhar deti", "धातु की चाबी गैप भर देती")),
      cap(5000, 12000, L3(lang, "Current flows: the bulb glows", "Current behti: bulb jalta", "करंट बहती: बल्ब जलता"))],
    beats: [beat(0, 0, "open circuit"), beat(2500, 1, "a conductor in the gap"), beat(5000, 2, "bulb glows")],
    facts: { shows: "a circuit tester", "metal key": "conductor: the bulb glows" } };
}
function magnets(lang) {
  return { id: "magnets", bg: "paper", durationMs: 12000,
    actors: [A("m1", "magnet", [110, 100]), A("m2", "magnet", [290, 100], { rot: 180 }), A("m3", "magnet", [110, 220]), A("m4", "magnet", [290, 220])],
    tracks: [T("m2", [[1000, { at: [290, 100] }], [3500, { at: [172, 100] }]]),
      T("m4", [[6000, { at: [290, 220] }], [7000, { at: [240, 220] }], [9000, { at: [330, 220] }]])],
    captions: [cap(0, 5500, L3(lang, "Unlike poles attract", "Ulte dhruv kheenchte hain", "विपरीत ध्रुव खींचते हैं"), "top"),
      cap(5500, 12000, L3(lang, "Like poles repel", "Ek jaise dhruv dhakelte hain", "एक जैसे ध्रुव धकेलते हैं"), "top")],
    beats: [beat(0, 0, "unlike poles attract"), beat(5500, 1, "like poles repel")],
    facts: { shows: "two pairs of magnets", "N and S": "attract", "N and N": "repel" } };
}
function shadow(lang) {
  return { id: "shadow", bg: "paper", durationMs: 11000,
    actors: [A("torch", "torch", [60, 150]), A("beam", "beam", [78, 150], { opacity: 0 }), A("box", "box", [190, 150]), A("sh", "shadow", [230, 150], { opacity: 0 })],
    tracks: [T("beam", [[800, { opacity: 0 }], [1800, { opacity: 1 }]]), T("sh", [[3000, { opacity: 0 }], [4000, { opacity: 1 }]]),
      T("torch", [[6500, { at: [60, 150] }], [9000, { at: [130, 150] }]]), T("beam", [[6500, { at: [78, 150] }], [9000, { at: [148, 150] }]]),
      T("sh", [[6500, { scale: 1 }], [9000, { scale: 1.5 }]])],
    captions: [cap(0, 3000, L3(lang, "Light travels in straight lines", "Roshni seedhi chalti hai", "रोशनी सीधी चलती है"), "top"),
      cap(3000, 6500, L3(lang, "The box blocks it: a shadow", "Dabba roshni rokta: parchhai", "डब्बा रोशनी रोकता: परछाई"), "top"),
      cap(6500, 11000, L3(lang, "Torch closer: bigger shadow", "Torch paas: badi parchhai", "टॉर्च पास: बड़ी परछाई"), "top")],
    beats: [beat(0, 0, "light in straight lines"), beat(3000, 1, "shadow behind the box"), beat(6500, 2, "closer light, bigger shadow")],
    facts: { shows: "a torch, a box and its shadow", shadow: "on the side away from the light" } };
}
function eclipse(lang) {
  return { id: "solar-eclipse", bg: "night", durationMs: 12000,
    actors: [A("sun", "sun", [60, 150], { scale: 1.4 }), A("earth", "earthLit", [330, 150], { scale: 0.9 }), A("moon", "moon", [200, 50], { scale: 0.7 }),
      { id: "umbra", parts: [{ shape: "poly", points: [[0, -8], [100, -4], [100, 4], [0, 8]], fill: "shadow" }], at: [214, 150], opacity: 0 }],
    tracks: [T("moon", [[1000, { at: [200, 50] }], [5000, { at: [200, 150] }], [9000, { at: [200, 150] }], [11500, { at: [200, 250] }]]),
      T("umbra", [[4800, { opacity: 0 }], [5400, { opacity: 0.9 }], [9000, { opacity: 0.9 }], [9600, { opacity: 0 }]])],
    captions: [cap(0, 5000, L3(lang, "The Moon moves in its orbit", "Chand apne raaste par chalta", "चाँद अपने रास्ते पर चलता"), "top"),
      cap(5000, 12000, L3(lang, "Moon between Sun and Earth", "Chand Suraj aur Dharti ke beech", "चाँद सूरज और धरती के बीच"), "top")],
    beats: [beat(0, 0, "moon moving"), beat(5000, 1, "moon's shadow falls on Earth")],
    facts: { shows: "a solar eclipse", order: "Sun, Moon, Earth in a line" } };
}

// ───────────────────────────── maths ─────────────────────────────
function equalParts(lang) {
  const q = [0, 1, 2, 3];
  return { id: "equal-parts", bg: "paper", durationMs: 12000,
    actors: q.map((i) => A(`s${i}`, "slice4", [200, 136], { rot: i * 90 })),
    tracks: q.map((i) => { const a = (i * 90 - 45) * (Math.PI / 180), o = [200 + Math.cos(a) * 18, 136 + Math.sin(a) * 18]; return T(`s${i}`, [[2500, { at: [200, 136] }], [5000, { at: o }], [9500, { at: o }], [11000, { at: [200, 136] }]]); }),
    captions: [cap(0, 2500, L3(lang, "One whole roti", "Ek poori roti", "एक पूरी रोटी")),
      cap(2500, 7000, L3(lang, "Cut into 4 equal parts", "4 barabar hisse", "4 बराबर हिस्से")),
      cap(7000, 12000, L3(lang, "Each part is 1/4", "Har hissa 1/4", "हर हिस्सा 1/4"))],
    beats: [beat(0, 0, "one whole"), beat(2500, 1, "4 equal parts"), beat(7000, 2, "each part one quarter")],
    facts: { whole: "1 roti", parts: "4 equal parts", "each part": "1/4" } };
}
function equalSharing(lang) {
  const n = 12, plates = 3, each = n / plates;
  const pos = (k) => [130 + (k % 6) * 28, 70 + Math.floor(k / 6) * 26];
  const plateX = (p) => 90 + p * 110;
  return { id: "equal-sharing", bg: "paper", durationMs: 14000,
    actors: [...Array.from({ length: plates }, (_, p) => A(`p${p}`, "plate", [plateX(p), 240], { z: -1 })), ...Array.from({ length: n }, (_, k) => A(`l${k}`, "laddoo", pos(k)))],
    tracks: Array.from({ length: n }, (_, k) => { const p = k % plates, r = Math.floor(k / plates); const t0 = 2000 + k * 700;
      return T(`l${k}`, [[t0, { at: pos(k) }], [t0 + 600, { at: [plateX(p) - 21 + r * 14, 232] }]]); }),
    captions: [cap(0, 2000, L3(lang, `${n} laddoos, ${plates} plates`, `${n} laddoo, ${plates} plate`, `${n} लड्डू, ${plates} प्लेट`), "top"),
      cap(2000, 10500, L3(lang, "One to each plate, in turn", "Har plate mein ek-ek", "हर प्लेट में एक-एक"), "top"),
      cap(10500, 14000, L3(lang, `Each plate gets ${each}`, `Har plate mein ${each}`, `हर प्लेट में ${each}`), "top")],
    beats: [beat(0, 0, `${n} things, ${plates} groups`), beat(2000, 1, "share one at a time"), beat(10500, 2, `${each} each`)],
    facts: { total: n, plates, each } };
}
function turns(lang) {
  return { id: "turns", bg: "paper", durationMs: 13000,
    actors: [A("face", "clockFace", [200, 160]), A("hand", "handLong", [200, 160]), A("hub", "hub", [200, 160], { z: 2 })],
    tracks: [T("hand", [[1500, { rot: 0 }], [3500, { rot: 90 }], [5500, { rot: 90 }], [7500, { rot: 180 }], [9000, { rot: 180 }], [12000, { rot: 360 }]])],
    captions: [cap(1500, 5500, L3(lang, "Quarter turn: 90°", "Chauthai chakkar: 90°", "चौथाई चक्कर: 90°"), "top"),
      cap(5500, 9000, L3(lang, "Half turn: 180°", "Aadha chakkar: 180°", "आधा चक्कर: 180°"), "top"),
      cap(9000, 13000, L3(lang, "Full turn: 360°", "Poora chakkar: 360°", "पूरा चक्कर: 360°"), "top")],
    beats: [beat(1500, 0, "quarter turn"), beat(5500, 1, "half turn"), beat(9000, 2, "full turn")],
    facts: { "quarter turn": "90°", "half turn": "180°", "full turn": "360°", direction: "clockwise" } };
}
function areaTiles(lang) {
  const cols = 5, rows = 3, x0 = 125, y0 = 85;
  return { id: "area-tiles", bg: "paper", durationMs: 13000,
    actors: [{ id: "frame", parts: [{ shape: "rect", at: [x0 - 3, y0 - 3], w: cols * 30 + 6, h: rows * 30 + 6, stroke: "ink", sw: 3 }], at: [0, 0] },
      ...Array.from({ length: rows * cols }, (_, k) => A(`t${k}`, "tile", [x0 + (k % cols) * 30, 290], { opacity: 0 }))],
    tracks: Array.from({ length: rows * cols }, (_, k) => T(`t${k}`, [[1500 + k * 550, { opacity: 1, at: [x0 + (k % cols) * 30, 262] }], [1950 + k * 550, { at: [x0 + (k % cols) * 30, y0 + Math.floor(k / cols) * 30] }]])),
    captions: [cap(0, 1500, L3(lang, "How many squares cover it?", "Kitne square isse dhakte?", "कितने वर्ग इसे ढकते?"), "top"),
      cap(1500, 10000, L3(lang, `${rows} rows of ${cols}`, `${rows} line, har line mein ${cols}`, `${rows} पंक्तियाँ, हर में ${cols}`), "top"),
      cap(10000, 13000, L3(lang, `Area = ${rows * cols} squares`, `Area = ${rows * cols} square`, `क्षेत्रफल = ${rows * cols} वर्ग`), "top")],
    beats: [beat(0, 0, "cover with squares"), beat(1500, 1, `${rows} rows of ${cols}`), beat(10000, 2, `${rows * cols} squares`)],
    facts: { rows, columns: cols, area: `${rows * cols} unit squares` } };
}
function perimeterWalk(lang) {
  const w = 6, h = 4, k = 36, x0 = 92, y0 = 80;
  const C = [[x0, y0], [x0 + w * k, y0], [x0 + w * k, y0 + h * k], [x0, y0 + h * k]];
  return { id: "perimeter-walk", bg: "field", durationMs: 14000,
    actors: [{ id: "field", parts: [{ shape: "rect", at: [x0, y0], w: w * k, h: h * k, fill: "leaf" }], at: [0, 0], z: -1 }, A("ant", "ant", C[0])],
    tracks: [T("ant", [[1500, { at: C[0] }], [4500, { at: C[1] }], [6500, { at: C[2] }], [9500, { at: C[3] }], [11500, { at: C[0] }]], { ease: "linear" })],
    captions: [cap(1500, 4500, L3(lang, `${w} m`, `${w} m`, `${w} मी`), "top"), cap(4500, 6500, L3(lang, `${w} + ${h} m`, `${w} + ${h} m`, `${w} + ${h} मी`), "top"),
      cap(6500, 9500, L3(lang, `${w} + ${h} + ${w} m`, `${w} + ${h} + ${w} m`, `${w} + ${h} + ${w} मी`), "top"),
      cap(11500, 14000, L3(lang, `Perimeter = ${2 * (w + h)} m`, `Perimeter = ${2 * (w + h)} m`, `परिमाप = ${2 * (w + h)} मी`), "top")],
    beats: [beat(1500, 0, "walk the first side"), beat(4500, 1, "second side"), beat(6500, 2, "third side"), beat(11500, 3, "back to the start: the perimeter")],
    facts: { length: `${w} m`, breadth: `${h} m`, perimeter: `${2 * (w + h)} m` } };
}
function integersLift(lang) {
  const y = (f) => 150 - f * 40;
  return { id: "integers-lift", bg: "paper", durationMs: 12000,
    actors: [{ id: "shaft", parts: [{ shape: "rect", at: [176, 20], w: 48, h: 260, fill: "soft" }, ...[2, 1, 0, -1, -2, -3].map((f) => ({ shape: "text", at: [140, y(f) + 5], text: String(f), size: 16 }))], at: [0, 0], z: -1 },
      { id: "groundline", parts: [{ shape: "line", from: [110, 170], to: [290, 170], stroke: "mark", sw: 3 }], at: [0, 0] }, A("lift", "lift", [200, y(0)])],
    tracks: [T("lift", [[1500, { at: [200, y(0)] }], [4500, { at: [200, y(2)] }], [6000, { at: [200, y(2)] }], [10500, { at: [200, y(-3)] }]])],
    captions: [cap(0, 1500, L3(lang, "Ground floor is 0", "Ground floor = 0", "भूतल = 0"), "top"), cap(1500, 6000, L3(lang, "Up 2: floor +2", "2 upar: +2", "2 ऊपर: +2"), "top"),
      cap(6000, 12000, L3(lang, "Down 5: floor -3", "5 neeche: -3", "5 नीचे: -3"), "top")],
    beats: [beat(0, 0, "zero is the ground floor"), beat(1500, 1, "up two"), beat(6000, 2, "down five, below zero")],
    facts: { start: 0, "up 2": "+2", "then down 5": "-3" } };
}
function symmetryFold(lang) {
  return { id: "symmetry-fold", bg: "paper", durationMs: 11000,
    actors: [A("wl", "wingL", [200, 150]), A("wr", "wingR", [200, 150]), A("body", "body", [200, 150], { z: 2 }),
      { id: "axis", parts: [{ shape: "line", from: [200, 70], to: [200, 230], stroke: "mark", sw: 2 }], at: [0, 0], opacity: 0, z: 3 }],
    tracks: [T("axis", [[1000, { opacity: 0 }], [2000, { opacity: 1 }]]), T("wr", [[3000, { scale: 1 }], [5500, { scale: 0.05 }], [6500, { scale: 0.05 }], [9000, { scale: 1 }]])],
    captions: [cap(1000, 3000, L3(lang, "A line down the middle", "Beech mein ek line", "बीच में एक रेखा"), "top"),
      cap(3000, 7000, L3(lang, "Fold: the halves match", "Modo: dono aadhe milte", "मोड़ो: दोनों आधे मिलते"), "top"),
      cap(7000, 11000, L3(lang, "A line of symmetry", "Samrupta ki rekha", "सममिति की रेखा"), "top")],
    beats: [beat(1000, 0, "the middle line"), beat(3000, 1, "fold, halves match"), beat(7000, 2, "line of symmetry")],
    facts: { shows: "a butterfly folded on its middle line", halves: "match exactly" } };
}
function barGraph(lang) {
  const data = [["Mon", 4], ["Tue", 7], ["Wed", 5], ["Thu", 8]];
  const base = 250, k = 22;
  return { id: "bar-graph", bg: "paper", durationMs: 12000,
    actors: [{ id: "axes", parts: [{ shape: "line", from: [60, 50], to: [60, base], stroke: "ink", sw: 2 }, { shape: "line", from: [60, base], to: [370, base], stroke: "ink", sw: 2 },
      ...[0, 2, 4, 6, 8].map((v) => ({ shape: "text", at: [46, base - v * k + 5], text: String(v), size: 13 })), ...data.map(([d], i) => ({ shape: "text", at: [110 + i * 70, base + 22], text: d, size: 14 }))], at: [0, 0] },
      ...data.map(([, v], i) => A(`b${i}`, "bar", [110 + i * 70, base], { scale: 0.01 }))],
    tracks: data.map(([, v], i) => T(`b${i}`, [[1500 + i * 1800, { scale: 0.01 }], [2700 + i * 1800, { scale: (v * k) / 100 }]])),
    captions: [cap(0, 1500, L3(lang, "Books read each day", "Har din padhi kitaabein", "हर दिन पढ़ी किताबें"), "top"),
      cap(1500, 9000, L3(lang, "Each bar rises to its count", "Har bar apni ginti tak", "हर बार अपनी गिनती तक"), "top"),
      cap(9000, 12000, L3(lang, "Thursday is tallest: 8", "Guruwar sabse lamba: 8", "गुरुवार सबसे लंबा: 8"), "top")],
    beats: [beat(0, 0, "the question"), beat(1500, 1, "bars rise to the scale"), beat(9000, 2, "the tallest bar")],
    facts: Object.fromEntries(data) };
}
function arrays(lang) {
  const rows = 3, cols = 4;
  return { id: "arrays", bg: "paper", durationMs: 12000,
    actors: Array.from({ length: rows * cols }, (_, k) => A(`c${k}`, "chair", [60 + (k * 23) % 300, 260 - (k % 3) * 8])),
    tracks: Array.from({ length: rows * cols }, (_, k) => T(`c${k}`, [[1500 + k * 350, { at: [60 + (k * 23) % 300, 260 - (k % 3) * 8] }], [2300 + k * 350, { at: [140 + (k % cols) * 40, 90 + Math.floor(k / cols) * 40] }]])),
    captions: [cap(0, 1500, L3(lang, `${rows * cols} chairs`, `${rows * cols} kursiyaan`, `${rows * cols} कुर्सियाँ`), "top"),
      cap(1500, 7500, L3(lang, `${rows} rows of ${cols}`, `${rows} line, har mein ${cols}`, `${rows} पंक्तियाँ, हर में ${cols}`), "top"),
      cap(7500, 12000, L3(lang, `${rows} × ${cols} = ${rows * cols}`, `${rows} × ${cols} = ${rows * cols}`, `${rows} × ${cols} = ${rows * cols}`), "top")],
    beats: [beat(0, 0, "a heap of chairs"), beat(1500, 1, "into equal rows"), beat(7500, 2, "rows times columns")],
    facts: { rows, "in each row": cols, total: rows * cols, factors: `${rows} and ${cols}` } };
}
function clockFive(lang) {
  return { id: "clock-five", bg: "paper", durationMs: 12000,
    actors: [A("face", "clockFace", [200, 160]), A("hr", "handShort", [200, 160], { rot: 90 }), A("min", "handLong", [200, 160]), A("hub", "hub", [200, 160], { z: 2 })],
    tracks: [T("min", [[1500, { rot: 0 }], [3000, { rot: 30 }], [4000, { rot: 30 }], [5500, { rot: 60 }], [6500, { rot: 60 }], [9500, { rot: 120 }]]),
      T("hr", [[1500, { rot: 90 }], [9500, { rot: 100 }]], { ease: "linear" })],
    captions: [cap(0, 1500, L3(lang, "3 o'clock", "3 baje", "3 बजे"), "top"), cap(1500, 4000, L3(lang, "Minute hand to 1: 5 minutes", "Badi sui 1 par: 5 minute", "बड़ी सुई 1 पर: 5 मिनट"), "top"),
      cap(4000, 6500, L3(lang, "To 2: 10 minutes", "2 par: 10 minute", "2 पर: 10 मिनट"), "top"), cap(6500, 12000, L3(lang, "To 4: 20 minutes, 3:20", "4 par: 20 minute, 3:20", "4 पर: 20 मिनट, 3:20"), "top")],
    beats: [beat(0, 0, "three o'clock"), beat(1500, 1, "each number is 5 minutes"), beat(4000, 2, "ten minutes"), beat(6500, 3, "twenty past three")],
    facts: { start: "3:00", "each number": "5 minutes", end: "3:20" } };
}

/** topic id → builder (the 20 pilots). */
export const SCENES = Object.freeze({
  "c7-science-ch07-t04": waterCycle, "c7-science-ch12-t01": dayNight, "c6-science-ch10-t02": germination, "c7-science-ch10-t01": photosynthesis,
  "c6-science-ch02-t04": foodChain, "c6-science-ch08-t02": evaporation, "c7-science-ch03-t03": circuitTester, "c6-science-ch04-t02": magnets,
  "c7-science-ch11-t02": shadow, "c7-science-ch12-t03": eclipse,
  "c4-maths-ch05-t01": equalParts, "c4-maths-ch09-t02": equalSharing, "c5-maths-ch03-t01": turns, "c5-maths-ch11-t01": areaTiles,
  "c6-maths-ch06-t01": perimeterWalk, "c6-maths-ch10-t02": integersLift, "c6-maths-ch09-t01": symmetryFold, "c5-maths-ch15-t02": barGraph,
  "c5-maths-ch13-t02": arrays, "c4-maths-ch12-t01": clockFive,
});

/** The scene for a topic in the lesson's language, normalised and linted. null = no scene for the topic. */
export function sceneFor(topicId, { lang = "hinglish" } = {}) {
  const b = SCENES[topicId];
  if (!b) return null;
  const n = normalizeScene({ ...b(lang === "en" || lang === "hi" ? lang : "hinglish"), topicId });
  const lint = n.ok ? lintScene(n.scene) : [];
  return { ok: n.ok && !lint.length, scene: { ...n.scene, topicId }, errors: [...n.errors, ...lint] };
}
