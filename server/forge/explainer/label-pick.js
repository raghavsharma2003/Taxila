// round 7 (C1 studio-board-richness): a labelled diagram (label@1: a code-drawn sketch, labels on leader lines) for a kit
// that is ABOUT that thing's parts: it names the thing and at least 3 of its parts (a plant also needs both stem and root,
// so "kinds of waste: flowers, leaves, soil" is no plant diagram). Each label is the part as the kit names it, at its
// anchor on the sketch. → a label@1 call, or null. Pure; never throws.

// sketch → { the word the kit must say, parts: anchor → the words a kit may use for it (singular, plural) , required anchors }
const SKETCHES = {
  plant: { thing: /\bplants?\b/, need: ["stem", "root"], parts: { root: ["root", "roots"], stem: ["stem", "stems"], leaf: ["leaf", "leaves"], flower: ["flower", "flowers"], fruit: ["fruit", "fruits"], soil: ["soil"] } },
  flower: { thing: /\bflowers?\b/, need: [], parts: { petal: ["petal", "petals"], sepal: ["sepal", "sepals"], stamen: ["stamen", "stamens"], pistil: ["pistil", "pistils", "carpel", "carpels"] } },
  leaf: { thing: /\bleaf\b|\bleaves\b/, need: [], parts: { midrib: ["midrib"], vein: ["vein", "veins"], stalk: ["petiole", "stalk"], blade: ["lamina", "leaf blade", "blade"], margin: ["margin"], tip: ["leaf tip", "apex"] } },
  circuit: { thing: /\bcircuits?\b/, need: ["bulb"], parts: { cell: ["cell", "cells", "battery", "batteries"], bulb: ["bulb", "bulbs"], switch: ["switch", "switches"], wire: ["wire", "wires", "connecting wire"] } },
  cellPlant: { thing: /\bcells?\b/, need: ["wall"], parts: { wall: ["cell wall", "cell walls"], membrane: ["cell membrane", "plasma membrane", "membrane"], vacuole: ["vacuole", "vacuoles"], nucleus: ["nucleus"], chloroplast: ["chloroplast", "chloroplasts"], cytoplasm: ["cytoplasm"] } },
  cellAnimal: { thing: /\bcells?\b/, need: ["nucleus", "membrane"], parts: { membrane: ["cell membrane", "plasma membrane", "membrane"], nucleus: ["nucleus"], cytoplasm: ["cytoplasm"] } },
  atom: { thing: /\batoms?\b/, need: ["nucleus", "electron"], parts: { proton: ["proton", "protons"], neutron: ["neutron", "neutrons"], nucleus: ["nucleus"], electron: ["electron", "electrons"], shell: ["shell", "shells", "orbit", "orbits"] } },
  insect: { thing: /\binsects?\b/, need: [], parts: { head: ["head"], thorax: ["thorax"], abdomen: ["abdomen"], antenna: ["antenna", "antennae"], leg: ["legs", "leg"], eye: ["compound eye", "eyes"] } },
};
// the order labels are drawn in (root up, as a teacher draws a plant)
const ORDER = { plant: ["root", "stem", "leaf", "flower", "fruit", "soil"], flower: ["petal", "sepal", "stamen", "pistil"], leaf: ["stalk", "midrib", "vein", "blade", "margin", "tip"], insect: ["head", "thorax", "abdomen", "antenna", "leg", "eye"], circuit: ["cell", "wire", "bulb", "switch"], cellPlant: ["wall", "membrane", "cytoplasm", "vacuole", "nucleus", "chloroplast"], cellAnimal: ["membrane", "cytoplasm", "nucleus"], atom: ["nucleus", "proton", "neutron", "shell", "electron"] };

// the label for a part as the kit says it: singular when the list has its singular ("roots" → root, "leaves" → leaf,
// "batteries" → battery; never "nucleus" → nucleu), and the part's short name when the kit's words would not fit a label
// ("cell membrane" → membrane: inside a cell diagram the short name is the same part)
const singular = (w, words) => words.find((x) => x !== w && (w === `${x}s` || w === `${x}es` || w === x.replace(/y$/, "ies") || w === x.replace(/f$/, "ves") || w === `${x}e`)) ?? w;
function labelText(w, words) {
  const one = singular(w, words);
  if (one.length <= 11) return one;
  const short = words.filter((x) => !x.includes(" ") && x.length <= 11).sort((a, b) => a.length - b.length)[0];
  return short ? singular(short, words) : one;
}

const kitText = (kit) => { try { return JSON.stringify([kit?.expectations, kit?.workedExample, kit?.items]).toLowerCase(); } catch { return ""; } };
const said = (t, w) => new RegExp(`\\b${w.replace(/ /g, "\\s+")}\\b`).test(t);

/** The label@1 call for this kit, or null: the sketch whose parts the kit names most (≥ 3, its required ones included). */
export function labelCall(kit, { text = "" } = {}) {
  try {
    const t = `${String(text ?? "").toLowerCase()} ${kitText(kit)}`;
    let best = null;
    for (const [sketch, s] of Object.entries(SKETCHES)) {
      if (!s.thing.test(t)) continue;
      const named = {};
      for (const [anchor, words] of Object.entries(s.parts)) { const w = words.find((x) => said(t, x)); if (w) named[anchor] = labelText(w, words); }
      if (Object.keys(named).length < 3 || s.need.some((a) => !named[a])) continue;
      if (!best || Object.keys(named).length > Object.keys(best.named).length) best = { sketch, named };
    }
    if (!best) return null;
    const labels = ORDER[best.sketch].filter((a) => best.named[a]).slice(0, 6).map((anchor) => ({ anchor, text: best.named[anchor] }));
    return { template: "label@1", sketch: best.sketch, labels };
  } catch { return null; }
}
