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
  insect: { thing: /\binsects?\b/, need: [], parts: { head: ["head"], thorax: ["thorax"], abdomen: ["abdomen"], antenna: ["antenna", "antennae"], leg: ["legs", "leg"], eye: ["compound eye", "eyes"] } },
};
// the order labels are drawn in (root up, as a teacher draws a plant)
const ORDER = { plant: ["root", "stem", "leaf", "flower", "fruit", "soil"], flower: ["petal", "sepal", "stamen", "pistil"], leaf: ["stalk", "midrib", "vein", "blade", "margin", "tip"], insect: ["head", "thorax", "abdomen", "antenna", "leg", "eye"], circuit: ["cell", "wire", "bulb", "switch"] };

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
      for (const [anchor, words] of Object.entries(s.parts)) { const w = words.find((x) => said(t, x)); if (w) named[anchor] = w.split(" ").length > 1 ? w : (w === "leaves" ? "leaf" : w.replace(/(?<=[a-z]{3})s$/, "")); }
      if (Object.keys(named).length < 3 || s.need.some((a) => !named[a])) continue;
      if (!best || Object.keys(named).length > Object.keys(best.named).length) best = { sketch, named };
    }
    if (!best) return null;
    const labels = ORDER[best.sketch].filter((a) => best.named[a]).slice(0, 6).map((anchor) => ({ anchor, text: best.named[anchor] }));
    return { template: "label@1", sketch: best.sketch, labels };
  } catch { return null; }
}
