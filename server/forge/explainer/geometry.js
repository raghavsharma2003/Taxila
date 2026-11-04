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
  // round 7 (M2): "a 12 m by 7 m garden", "a field 50 m long and 30 m wide" — a rectangle by its measures, named or not
  ["rect", new RegExp(`\\b${NUM}\\s*(cm|m)\\s*(?:by|×|x)\\s*${NUM}\\s*(cm|m)\\b`, "i"), (m) => ({ shape: "rect", w: +m[1], h: +m[3], unit: m[2] === m[4] ? m[2] : null })],
  ["rect", new RegExp(`\\b${NUM}\\s*(cm|m)\\s+long\\s+and\\s+${NUM}\\s*(cm|m)\\s+(?:wide|broad)\\b`, "i"), (m) => ({ shape: "rect", w: +m[1], h: +m[3], unit: m[2] === m[4] ? m[2] : null })],
  ["circle", new RegExp(`\\bcircle\\b[^.]{0,30}?\\bradius\\s+(?:of\\s+)?${NUM}\\s*(cm|m)\\b`, "i"), (m) => ({ shape: "circle", r: +m[1], unit: m[2] })],
];

const PERIMETER = /\bperimeter\b|\bboundary\b|\bfenc(?:e|ing)\b|\brounds? of\b|\bborder\b/i;
// (round 7 M2: while an item is being taught, its OWN text and the worked example are the sources, never another item's
// shape: a "rectangles of area 20" worked example drew an unrelated item's 6 m square)
const kitText = (kit, item = null) => { try { return JSON.stringify(item ? [item.prompt_en, kit?.workedExample, kit?.expectations] : [kit?.workedExample, kit?.expectations, kit?.items]); } catch { return ""; } };

/** The measured@1 call for the first shape the kit (or `text`, first) states with its measures, or null. */
export function measuredCall(kit, { text = "", item = null } = {}) {
  try {
    // (round 7 M2: `from` says where the shape was read — her line or the item ("line"), the worked example or expectations
    // ("lesson"), else another item ("kit");
    // explainerFor lets only a line's shape outrank a specific template the line asked for)
    const t = String(text ?? "").trim();
    const j = (x) => { try { return JSON.stringify(x ?? ""); } catch { return ""; } };
    for (const [from, src] of [["line", t], ["line", String(item?.prompt_en ?? "")], ["lesson", j([kit?.workedExample, kit?.expectations])], ...(item ? [] : [["kit", j(kit?.items)]])]) {
      if (!src) continue;
      let best = null;
      for (const [, re, build] of PATTERNS) {
        const m = src.match(re);
        if (m && (!best || m.index < best.at)) { const c = build(m); if (c.unit !== null) best = { at: m.index, c }; }
      }
      // the shape is named on the board, and a perimeter lesson's board walks its boundary (round 7 M2: a c6 perimeter
      // child asking for a picture got none; Brain's S4 harness)
      if (best) return { template: "measured@1", from, ...best.c, name: true, ...(PERIMETER.test(`${text} ${kitText(kit, item)}`) && best.c.shape !== "circle" ? { trace: true } : {}) };
    }
    return null;
  } catch { return null; }
}
