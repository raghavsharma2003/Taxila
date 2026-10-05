// The explainer's CODE pick (W2-B #2): a template call read from the text the teacher's own content comes from (the
// posed item's prompt, else the kit's worked example: the SAME source the module values use, live-content audit 6), with
// every number taken from that text and nothing invented. Pure, synchronous, no model: the Director can call it on the
// turn path, and it is the floor under the model fill and the library.
import { extractValues } from "../../../shared/engine-catalog.js";

const subjectOf = (topicId) => String(topicId ?? "").split("-")[1] ?? "";
const ints = (v) => v.numbers.filter((n) => Number.isInteger(n) && n >= 0);

/**
 * @param {{ kit: any, item?: any, text?: string, representation?: string, interest?: string }} a  `text` overrides the
 *   source (tests); `representation` (the active misconception's remediation picture) and `interest` (the child's
 *   consented interest id) only choose HOW a value is drawn (a roti or a bar), never a value (W2-B fixer, minor 10)
 * @returns {{ template: string, [k: string]: unknown } | null}
 */
export function codePick({ kit, item = null, text, representation, interest }) {
  const subject = subjectOf(kit?.topicId);
  if (subject !== "maths") return null;
  const src = String(text ?? item?.prompt_en ?? kit?.workedExample?.problem ?? "");
  if (!src) return null;
  const v = extractValues(src);
  const lower = src.toLowerCase();
  const n = ints(v);
  const rep = String(representation ?? "").toLowerCase();
  // a fraction of a whole: the first proper fraction with a small denominator
  const fr = v.fractions.find(([a, d]) => d >= 2 && d <= 12 && a >= 0 && a <= d);
  if (fr) {
    const food = /roti|chapati|pizza|cake|pie/.test(lower) || (/roti|chapati|pizza|pie/.test(rep)) || (!rep && /^(cooking|food)$/.test(String(interest ?? "")));
    const bar = /\b(bar|strip|line|ribbon|rope)\b/.test(rep);
    return { template: "fraction-parts@1", whole: food && fr[1] <= 8 ? "roti" : bar || fr[1] > 8 ? "bar" : "circle", parts: fr[1], shade: fr[0] };
  }
  // integers with a sign (−2 − 3, −63 ÷ 7): a hop on the number line when it fits
  // a sign is NEGATIVE only where no operand precedes it ("(−2)", "−6 is colder"), never the minus of "8 − 3"
  const signed = [...src.matchAll(/([−-])?\s*(\d+)/g)].map((m) => {
    if (!m[1]) return Number(m[2]);
    const before = src.slice(0, m.index).replace(/[\s(]+$/, "");
    return /[\d)]$/.test(before) ? Number(m[2]) : -Number(m[2]);
  });
  // (adding or taking away only: a product, a quotient or an algebra line is not a hop)
  if (/[−-]\s*\d/.test(src) && !/[×÷*/]|\b[a-z]\s*[=+−-]|\d[a-z]\b/i.test(src) && signed.some((x) => x < 0) && signed.length >= 2 && /[+−-]/.test(src.replace(/\(\s*[−-]\s*\d+\s*\)/g, "x"))) {
    const [a, b] = signed;
    const minus = /\)\s*[−-]|\d\s*[−-]\s*\(?\s*\d/.test(src) && !/\+/.test(src);
    const hop = minus ? -Math.abs(b) : b;
    if (Math.abs(a) <= 20 && Math.abs(hop) <= 20 && hop !== 0) return { template: "number-line-hop@1", start: a, hops: [hop] };
  }
  const two = n.length >= 2 ? [n[0], n[1]] : null;
  if (two && /\b(add|sum|total|plus|altogether|in all)\b|\d\s*\+\s*\d|\+/.test(lower)) {
    const [a, b] = two;
    if (a <= 10 && b <= 10) return { template: "combine-count@1", a, b, op: "add" };
    if (a <= 99999 && b <= 99999) return { template: "column-op@1", a, b, op: "add" };
  }
  if (two && /\b(subtract|minus|difference|take away|left over|are left|is left|remain(?:s|ing)?|how many more|how much more|fewer)\b|\d\s*[−-]\s*\d/.test(lower)) {
    const a = Math.max(...two), b = Math.min(...two);
    if (a <= 10) return { template: "combine-count@1", a, b, op: "take_away" };
    if (a <= 99999) return { template: "column-op@1", a, b, op: "sub" };
  }
  if (two && /\b(times|multiply|multiplied|groups? of|each|rows? of|product)\b|×/.test(lower)) {
    const g = Math.min(...two), e = Math.max(...two);
    if (g >= 2 && g <= 6 && e >= 1 && e <= 8) return { template: "equal-groups@1", groups: g, each: e };
  }
  if (/number line|jump|hop|skip/.test(lower) && n.length >= 2 && n[0] <= 100 && n[1] >= 1 && n[1] <= 20) {
    return { template: "number-line-hop@1", start: n[0], hops: [/back|left|minus|subtract/.test(lower) ? -n[1] : n[1]] };
  }
  const big = n.find((x) => x >= 1000 && x <= 9_999_999);
  if (big && /place|value|lakh|thousand|digit|expanded|read|write|number name|indian/.test(lower)) return { template: "place-value@1", value: big };
  return geometryPick({ kit, src, lower, n });
}

// ───────────────────────────── geometry and data (W2-B fixer, major 2) ─────────────────────────────

/** Does the kit itself say this word (so a part label is the book's own word)? */
const kitSays = (kit, re) => re.test(kitText(kit));
const kitTextMemo = new WeakMap();
function kitText(kit) {
  if (!kit || typeof kit !== "object") return "";
  if (kitTextMemo.has(kit)) return kitTextMemo.get(kit);
  const t = [...(kit.expectations ?? []), ...(kit.items ?? []).map((i) => i.prompt_en), kit.workedExample?.problem, ...(kit.workedExample?.steps ?? [])].join(" ").toLowerCase();
  kitTextMemo.set(kit, t);
  return t;
}
const ANGLE_KINDS = [["right angle", 90], ["acute", 50, "acute angle"], ["obtuse", 130, "obtuse angle"], ["straight angle", 180]];
const SHAPE_WORDS = ["triangle", "square", "rectangle", "pentagon", "hexagon", "octagon", "quadrilateral", "circle"];
const BAR_STOP = new Set(["class", "grade", "page", "chapter", "table", "bar", "bars", "scale", "graph", "total", "about", "than", "and", "only", "with", "the", "for", "are", "was", "were", "has", "had", "rain", "city", "goes", "going", "reaches", "steps"]);

function geometryPick({ kit, src, lower, n }) {
  // data: label-value pairs ("June 140, July 250", "Monday's bar reaches 25") in a graph, chart or table problem
  {
    const pairs = [];
    for (const m of src.matchAll(/\b([A-Za-z][A-Za-z-]{2,11})(?:['’]s)?(?:\s+bar)?(?:\s+(?:reaches|is|has|had|got|sold|scored))?[:=]?\s+(\d[\d,]*)\b/g)) {
      const label = m[1], value = Number(m[2].replace(/,/g, ""));
      if (BAR_STOP.has(label.toLowerCase()) || pairs.some((p) => p.label.toLowerCase() === label.toLowerCase())) continue;
      pairs.push({ label, value });
    }
    // two pairs in a graph / table problem, or three or more anywhere ("June 140, July 250, August 230")
    const keyword = /bar graph|graph|chart|pictograph|table|data|tally/.test(lower);
    if ((pairs.length >= 3 || (keyword && pairs.length >= 2)) && pairs.length <= 6 && pairs.every((p) => Number.isInteger(p.value) && p.value <= 100000)) {
      // a label longer than its column holds at the small size is written as its first three letters (Sep, Sat)
      const maxChars = Math.floor((312 / pairs.length - 4) / 10.5);
      return { template: "bar-chart@1", bars: pairs.map((p) => ({ label: p.label.length > maxChars ? p.label.slice(0, 3) : p.label, value: p.value })) };
    }
  }
  // symmetry: a mirror line, and a dot N squares from it when the text says so
  if (/symmetr|mirror|fold(?:ed)? line/.test(lower)) {
    const line = /line of symmetry/.test(lower) || kitSays(kit, /line of symmetry/) ? "line of symmetry" : /mirror line/.test(lower) || kitSays(kit, /mirror line/) ? "mirror line" : undefined;
    const d = (lower.match(/(\d)\s*squares?\s*(?:to the\s*)?(?:left|right|away|from)/) ?? [])[1];
    return { template: "symmetry@1", ...(line ? { line } : {}), ...(d && +d >= 1 && +d <= 6 ? { dot: +d } : {}) };
  }
  // area / perimeter of a rectangle or square with its sides in the text
  if (/\b(area|perimeter|boundary|fence|border)\b|rectangular (?:park|field|garden|room|plot)|\brounds? of\b/.test(lower) && n.length >= 1) {
    const unit = (lower.match(/\b\d+\s*(cm|mm|km|m)\b/) ?? [])[1];
    const sq = /\bsquare\b/.test(lower) && !/rectang/.test(lower);
    const dims = n.filter((x) => x >= 1 && x <= 1000);
    const w = dims[dims.length >= 3 && /rounds?|times/.test(lower) ? 1 : 0], h = sq ? w : dims[dims.length >= 3 && /rounds?|times/.test(lower) ? 2 : 1];
    if (w && h) return { template: "area-grid@1", w: Math.max(w, h), h: Math.min(w, h), mode: /perimeter|boundary|fence|border|rounds?/.test(lower) ? "perimeter" : "area", ...(unit ? { unit } : {}) };
  }
  // angles: the kinds the text names, in order (a right angle, an obtuse one …), or an angle in degrees
  if (/angle|corner/.test(lower)) {
    const found = [];
    for (const [w, deg, name] of ANGLE_KINDS) { const i = lower.indexOf(w); if (i >= 0) found.push([i, { deg, name: name ?? w }]); }
    for (const m of lower.matchAll(/(\d{2,3})\s*(?:°|degrees?)/g)) { const d = +m[1]; if (d >= 10 && d <= 180) found.push([m.index, { deg: d, name: `${d}°` }]); }
    const angles = found.sort((a, b) => a[0] - b[0]).map(([, a]) => a).filter((a, i, all) => all.findIndex((b) => b.name === a.name) === i).slice(0, 3);
    if (angles.length) {
      const arm = kitSays(kit, /\barms?\b/) ? "arm" : undefined;
      const vertex = kitSays(kit, /\bvertex\b/) ? "vertex" : kitSays(kit, /\bcorner\b/) ? "corner" : undefined;
      return { template: "angle@1", angles, ...(angles.length === 1 && arm ? { arm } : {}), ...(angles.length === 1 && vertex ? { vertex } : {}) };
    }
  }
  // a named shape (two of it for congruent figures), its parts in the kit's own words
  // a shape word that names a shape (not "square number", "squares of 12", "circle the answer", "sq cm")
  const shapeText = lower.replace(/\bsquare\s+(?:numbers?|roots?|units?|cm|mm|m|km|metres?|meters?|centimetres?|kilometres?)\b|\bsquares?\s+of\b|\bperfect\s+squares?\b|\bsquared\b|\bcircle\s+(?:the|your|it|one|each|all)\b|\bsquares?\s+(?:paper|grid)\b|\bsquared\s+paper\b/g, " ");
  const sw = SHAPE_WORDS.find((w) => new RegExp(`\\b${w}s?\\b`).test(shapeText));
  if (sw || /congruent/.test(lower)) {
    const shape = sw ?? "quadrilateral";
    if (/congruent/.test(lower) && shape !== "circle") return { template: "shape@1", shape, copies: 2, names: ["A", "B"] };
    if (shape === "circle") {
      const c = { template: "shape@1", shape, name: "circle" };
      if (kitSays(kit, /\bcentre\b|\bcenter\b/)) c.centre = kitSays(kit, /\bcentre\b/) ? "centre" : "center";
      if (kitSays(kit, /\bradius\b/)) c.radius = "radius";
      if (kitSays(kit, /\bdiameter\b/)) c.diameter = "diameter";
      return c;
    }
    const c = { template: "shape@1", shape, name: shape };
    if (kitSays(kit, /\bsides?\b/)) c.side = "side";
    if (kitSays(kit, /\bvertex\b|\bvertices\b/)) c.corner = "vertex"; else if (kitSays(kit, /\bcorners?\b/)) c.corner = "corner";
    return c;
  }
  return null;
}
