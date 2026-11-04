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
  // round 4 content: a fraction OF a fraction ("3/5 of 2/3", "1/2 × 1/4", "half of a half", "aadhe ka aadha"): the area model
  const of = fractionOfIn(src);
  if (of) return { template: "fraction-of@1", ...of };
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
  // round 7 (M2): the two numbers of an operation are its OPERANDS, read where the operation is written ("4 + 3", "add 4
  // and 3", "3 groups of 4"), not the line's first two numbers. One sign between two numbers is an operation only when no
  // other operation joins them ("3 + 4 × 2" is order of operations, "9 + 9 + 1" a longer sum, "3n + 2" a rule: none is two
  // groups put together). A word problem with exactly two numbers keeps the word cue ("4 apples, 3 more: how many in
  // all?"). Measured: once motion made such boards pass W6, the old first-two-numbers rule drew "2 + 2" dots for a
  // perimeter lesson, 2 + 3 for the Collatz rule and 3 + 4 for "3 + 4 × 2 = 11".
  const flat = lower.replace(/(\d),(?=\d{3}\b)/g, "$1");   // "2,000 + 50" is 2000 + 50
  const lone = (re) => {
    const m = re.exec(flat);
    if (!m) return null;
    const before = flat.slice(0, m.index), after = flat.slice(m.index + m[0].length);
    if (/[×x*÷/+−-]\s*$|[a-z]$/.test(before) || /^\s*(?:[×*÷/+−-]|x\s*\d)|^[a-z]/.test(after)) return null;
    return [Number(m[1]), Number(m[2])];
  };
  const onlyTwo = n.length === 2 && !/[×÷*/=]|\d[a-z]\b/.test(lower) ? [n[0], n[1]] : null;
  const addOps = lone(/(\d+)\s*\+\s*(\d+)/) ?? lone(/\b(?:add|adding|sum of|total of|plus)\s+(\d+)\s+(?:and|to|with)\s+(\d+)/)
    ?? (onlyTwo && /\b(add|sum|total|plus|altogether|in all)\b|\d\s+more\b/.test(lower) ? onlyTwo : null);
  if (addOps) {
    const [a, b] = addOps;
    if (a <= 10 && b <= 10) return { template: "combine-count@1", a, b, op: "add" };
    if (a <= 99999 && b <= 99999) return { template: "column-op@1", a, b, op: "add" };
  }
  const subOps = lone(/(\d+)\s*[−-]\s*(\d+)/) ?? lone(/\b(?:subtract|take away)\s+(\d+)\s+from\s+(\d+)/)?.reverse()
    ?? (onlyTwo && /\b(subtract|minus|difference|take away|left over|are left|is left|remain(?:s|ing)?|how many more|how much more|fewer)\b/.test(lower) ? onlyTwo : null);
  if (subOps) {
    const a = Math.max(...subOps), b = Math.min(...subOps);
    if (a <= 10) return { template: "combine-count@1", a, b, op: "take_away" };
    if (a <= 99999) return { template: "column-op@1", a, b, op: "sub" };
  }
  const mulOps = lone(/(\d+)\s*[×x*]\s*(\d+)/) ?? lone(/(\d+)\s+(?:groups?|rows?|bags?|boxes?|packets?)\s+of\s+(\d+)/) ?? lone(/(\d+)\s+times\s+(\d+)/)
    ?? (n.length === 2 && !/[+−÷/=]|\d[a-z]\b/.test(lower) && /\b(times|multiply|multiplied|groups? of|each|rows? of|product)\b/.test(lower) ? [n[0], n[1]] : null);
  if (mulOps) {
    const g = Math.min(...mulOps), e = Math.max(...mulOps);
    if (g >= 2 && g <= 6 && e >= 1 && e <= 8) return { template: "equal-groups@1", groups: g, each: e };
  }
  // "3 × (−2) means three jumps of 2 to the left": a product on the number line is that many equal jumps from 0 (round 7
  // M2: read as "start 3, hop −2" it drew 3 → 1)
  const times = /number line|jump|hop|skip/.test(lower) ? flat.match(/(\d+)\s*[×x*]\s*\(?\s*([−-])?\s*(\d+)\s*\)?/) : null;
  if (times) {
    const k = Number(times[1]), step = (times[2] ? -1 : 1) * Number(times[3]);
    if (k >= 1 && k <= 4 && step && Math.abs(step) <= 20 && Math.abs(k * step) <= 40) return { template: "number-line-hop@1", start: 0, hops: Array(k).fill(step) };
  }
  if (!times && /number line|jump|hop|skip/.test(lower) && n.length >= 2 && n[0] <= 100 && n[1] >= 1 && n[1] <= 20) {
    return { template: "number-line-hop@1", start: n[0], hops: [/back|left|minus|subtract/.test(lower) ? -n[1] : n[1]] };
  }
  const big = n.find((x) => x >= 1000 && x <= 9_999_999);
  if (big && /place|value|lakh|thousand|digit|expanded|read|write|number name|indian/.test(lower)) return { template: "place-value@1", value: big };
  return geometryPick({ kit, src, lower, n });
}

const UNIT_FR = { half: [1, 2], halves: [1, 2], aadha: [1, 2], aadhe: [1, 2], aadhi: [1, 2], third: [1, 3], tihai: [1, 3], quarter: [1, 4], chauthai: [1, 4], fourth: [1, 4] };
/** a/b of c/d in the text, or null: numerals ("3/5 of 2/3", "1/2 × 1/4") or words ("half of a half", "half ka half"). */
export function fractionOfIn(text) {
  const t = String(text ?? "").toLowerCase();
  const m = t.match(/(\d+)\s*\/\s*(\d+)\s*(?:of|ka|ki|ke|×|\*|times)\s*(?:a\s+|an\s+)?(\d+)\s*\/\s*(\d+)/);
  const ok = (a, b, c, d) => b >= 2 && b <= 6 && a >= 1 && a <= b && d >= 2 && d <= 6 && c >= 1 && c <= d;
  if (m) { const [a, b, c, d] = m.slice(1).map(Number); return ok(a, b, c, d) ? { a, b, c, d } : null; }
  const w = t.match(/\b(half|aadh[aei]|third|tihai|quarter|chauthai|fourth)\s+(?:of\s+(?:a|an|the)?\s*|ka\s+|ki\s+|ke\s+)(half|halves|aadh[aei]|third|tihai|quarter|chauthai|fourth)\b/);
  if (w) { const [a, b] = UNIT_FR[w[1]], [c, d] = UNIT_FR[w[2]]; return ok(a, b, c, d) ? { a, b, c, d } : null; }
  return null;
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
    // (three without a graph word only when every label is a name, "June", "Monday", "Ravi": "easier 38, add 9, away 1" in
    // a mental-adding line is no data — round 7 M2)
    if (((pairs.length >= 3 && pairs.every((p) => /^[A-Z]/.test(p.label))) || (keyword && pairs.length >= 2)) && pairs.length <= 6 && pairs.every((p) => Number.isInteger(p.value) && p.value <= 100000)) {
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
  // (its sides MEASURED: a unit, "5 by 3", or rows and columns — "2 lengths and 2 breadths" in a formula, or "the L-shaped
  // border around the square" of n × n, gives no sides; round 7 M2)
  const measured = /\b\d+\s*(?:cm|mm|km|m|units?)\b|\b\d+\s*(?:by|×|x)\s*\d+\b|\b\d+\s+(?:rows?|columns?)\b/.test(lower);
  if (measured && /\b(area|perimeter|boundary|fence|border)\b|rectangular (?:park|field|garden|room|plot)|\brounds? of\b/.test(lower) && n.length >= 1) {
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
  const shapeText = lower.replace(/\bsquare\s+(?:numbers?|roots?|units?|cm|mm|m|km|metres?|meters?|centimetres?|kilometres?)\b|\bsquares?\s+of\b|\bperfect\s+squares?\b|\bsquared\b|\bcircle\s+(?:the|your|it|one|each|all)\b|\bsquares?\s+(?:paper|grid)\b|\bsquared\s+paper\b|\beach\s+square\b/g, " ");
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
