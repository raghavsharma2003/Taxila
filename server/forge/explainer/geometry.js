// round 7 (C1 studio-board-richness, "geometry by constraint"): a shape the kit STATES with its measures ("a rectangle 8 cm
// by 5 cm", "a square of side 7 m", "a triangle with sides 3 cm, 4 cm and 5 cm", "a circle of radius 5 cm") drawn TO SCALE
// by measured@1 (templates.js). The first one the kit states. → a measured@1 call, or null. Pure; never throws.

const NUM = "(\\d{1,3}(?:\\.\\d)?)";
const PATTERNS = [
  ["rect", new RegExp(`\\brect(?:angle|angular\\s+\\w+)\\b[^.]{0,40}?\\b${NUM}\\s*(cm|m)\\b[^.]{0,14}?\\b(?:by|x|×|and)\\s*${NUM}\\s*(cm|m)\\b`, "i"),
    (m) => ({ shape: "rect", w: +m[1], h: +m[3], unit: m[2] === m[4] ? m[2] : null })],
  ["rect", new RegExp(`\\blength\\s+(?:of\\s+)?${NUM}\\s*(cm|m)[^.]{0,20}?(?:breadth|width)\\s+(?:of\\s+)?${NUM}\\s*(cm|m)`, "i"),
    (m) => ({ shape: "rect", w: +m[1], h: +m[3], unit: m[2] === m[4] ? m[2] : null })],
  ["square", new RegExp(`\\bsquare\\b[^.]{0,30}?\\bside\\s+(?:of\\s+)?${NUM}\\s*(cm|m)\\b`, "i"), (m) => ({ shape: "square", w: +m[1], h: +m[1], unit: m[2] })],
  ["triangle", new RegExp(`\\btriangle\\b[^.]{0,40}?\\bsides?\\s+(?:of\\s+)?${NUM}\\s*(?:cm)?\\s*,\\s*${NUM}\\s*(?:cm)?\\s*,?\\s*(?:and\\s*)?${NUM}\\s*(cm)\\b`, "i"),
    (m) => ({ shape: "triangle", sides: [+m[1], +m[2], +m[3]], unit: m[4] })],
  ["circle", new RegExp(`\\bcircle\\b[^.]{0,30}?\\bradius\\s+(?:of\\s+)?${NUM}\\s*(cm|m)\\b`, "i"), (m) => ({ shape: "circle", r: +m[1], unit: m[2] })],
];

const kitText = (kit) => { try { return JSON.stringify([kit?.workedExample, kit?.expectations, kit?.items]); } catch { return ""; } };

/** The measured@1 call for the first shape the kit (or `text`, first) states with its measures, or null. */
export function measuredCall(kit, { text = "" } = {}) {
  try {
    for (const src of [String(text ?? ""), kitText(kit)]) {
      let best = null;
      for (const [, re, build] of PATTERNS) {
        const m = src.match(re);
        if (m && (!best || m.index < best.at)) { const c = build(m); if (c.unit !== null) best = { at: m.index, c }; }
      }
      if (best) return { template: "measured@1", ...best.c };
    }
    return null;
  } catch { return null; }
}
