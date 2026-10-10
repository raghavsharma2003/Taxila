// The engine catalogue the Director's module planner reads (server/director/modules.js). Plain JS so the
// server, the tests and the Forge can import it without a build step; the frame's engines live in
// src/modules/frame/engines/** and register in src/modules/frame/registry.ts (tests/engine-catalog.test.mjs
// pins the two lists to each other).
//
//   resolveHint(hint)                 kit engineHint → { engine, preset } | null   (alias table below)
//   pickEngine(kit, representation)   the kit's first hint that resolves (one sharing a word with the
//                                     remediation's representation wins), else the topic map's engine
//   planEngine({ kit, item, lang, mode, representation })
//                                     → { engine, params, goal, bindItem, key, why } | null
//
// Machine truth: an engine grades the child from its own state and params. A plan binds the kit item
// (bindItem = true, so the Director treats the module's answer as the item's answer) ONLY when the params
// derived here make the engine's right answer equal the item's verified key (`key`, the kit `answer`).
// Anything else mounts as an unbound activity: its goal_met / stuck still reach the teacher, its answers
// grade nothing, and its params carry no itemId.
//
// What the child SEES is never the answer (the views hide the target behind `question` / `name` / pieces),
// but a bound plan's params DO carry the key or what derives it (number-line target, place-value value,
// fractions target, ruler value, pictograph data): the mount command reaches the client. The text lane keeps
// keys server-side; this lane does not, so a bound verdict should be re-checked server-side from the
// answer's value against plan.key (open item engines-v1-server-recheck) rather than trusting `correct`.

/** Every engine the frame ships, with what it is for. */
export const ENGINES = {
  "fraction-bars@1": { subjects: ["maths"], modes: ["shade", "compare"] },
  "number-line@1": { subjects: ["maths"], modes: ["place", "read", "jump"] },
  "collections@1": { subjects: ["maths"], modes: ["count", "make", "compare"] },
  "place-value@1": { subjects: ["maths"], modes: ["build", "read", "compare"] },
  "fractions@1": { subjects: ["maths"], modes: ["make", "compare", "equivalent", "add", "name", "of"] },
  "multiply-divide@1": { subjects: ["maths"], modes: ["array", "share", "factors"] },
  "geoboard@1": { subjects: ["maths"], modes: ["build", "measure", "contrast"] },
  "data-graphs@1": { subjects: ["maths"], modes: ["build", "read"] },
  "patterns@1": { subjects: ["maths"], modes: ["repeat", "grow", "grid"] },
  "measure@1": { subjects: ["maths", "science", "evs"], modes: ["read", "set"] },
  "sky@1": { subjects: ["science", "evs"], modes: ["daynight", "shadow", "phases"] },
  "motion-lab@1": { subjects: ["science", "evs"], modes: ["speed", "friction", "pendulum"] },
  "water-cycle@1": { subjects: ["science", "evs"], modes: ["cycle", "states", "groundwater"] },
  "scene@1": { subjects: ["maths", "science", "evs", "english", "hindi", "sst"], modes: ["scene"] },
  // W2-B: the board explanation / diagram template rung (server/forge/explainer/**); never a kit hint, never graded
  "explainer@1": { subjects: ["maths", "science", "evs", "english", "hindi", "sst"], modes: ["play"] },
};
export const ENGINE_IDS = Object.keys(ENGINES);

// Kit engineHint (as written in data/kits, normalised: lower case, "_" → "-") → engine + preset params.
// Only hints whose activity the engine's mode really is; a near miss stays unmapped (and becomes a
// forge_request gap) rather than mounting an activity that teaches something else.
const A = (engine, preset = {}) => ({ engine, preset });
const NL = "number-line@1", COL = "collections@1", PV = "place-value@1", FR = "fractions@1", MD = "multiply-divide@1", GEO = "geoboard@1",
  DG = "data-graphs@1", PT = "patterns@1", MS = "measure@1", SKY = "sky@1", MO = "motion-lab@1", WC = "water-cycle@1";
export const HINT_ALIASES = {
  // number-line@1
  "number-line": A(NL), "number-line-zoom": A(NL), "number-line-gap": A(NL), "benchmark-half-line": A(NL), "zoom-out-line": A(NL),
  "number-line-metres": A(NL), "estimation-meter": A(NL), "km-road-strip": A(NL), "road-milestone-sim": A(NL),
  "rounding-number-line": A(NL), "number-line-rounding-hill": A(NL), "rounding-hill": A(NL),
  "number-line-jumps": A(NL, { mode: "jump" }), "number-line-jump-back": A(NL, { mode: "jump" }), "jumping-animals-number-line": A(NL, { mode: "jump" }),
  "number-line-walk": A(NL, { mode: "jump" }), "skip-count-game": A(NL, { mode: "jump" }),
  "integer-number-line": A(NL, { numberKind: "integer" }), "lift-panel-sim": A(NL, { numberKind: "integer" }),
  // collections@1
  "pair-up-counters": A(COL), "egg-tray-filler": A(COL, { mode: "make" }), "estimation-jar": A(COL), "reach-ten-game-board": A(COL, { mode: "make" }),
  "grouping-counters": A(COL),
  // place-value@1
  "place-value-chart": A(PV), "place-value-blocks": A(PV), "place-value-blocks-trade": A(PV), "place-value-slider": A(PV), "place-value-cards": A(PV),
  "place-value-chart-compare": A(PV, { mode: "compare" }), "place-value-shift-slider": A(PV), "abacus": A(PV), "abacus-spikes": A(PV),
  "comma-slider": A(PV), "number-expander-cards": A(PV), "digit-tile-arranger": A(PV), "digit-cards": A(PV), "odometer-sim": A(PV),
  // fractions@1 (fraction-bars@1 keeps its own id)
  "fraction-bars": A("fraction-bars@1"), "fraction-strips": A(FR), "fraction-wall": A(FR), "fraction-folding-paper": A(FR),
  "pizza-cutter": A(FR, { model: "circle" }), "roti-cutter": A(FR, { model: "circle" }), "chapati-folder": A(FR, { model: "circle" }),
  "water-bucket-fraction-viz": A(FR),
  // multiply-divide@1
  "array-builder": A(MD), "area-model-grid": A(MD), "area-model-splitter": A(MD), "doubling-halving-arrays": A(MD), "train-coach-seat-counter": A(MD),
  "check-by-multiplying": A(MD), "sharing-plates": A(MD, { mode: "share" }), "sharing-sacks-sim": A(MD, { mode: "share" }),
  "grouping-boxes-packer": A(MD, { mode: "share" }), "remainder-decision-game": A(MD, { mode: "share" }), "auto-loading-sim": A(MD, { mode: "share" }),
  "factor-tree-builder": A(MD, { mode: "factors" }), "factor-rainbow": A(MD, { mode: "factors" }), "factor-venn-circles": A(MD, { mode: "factors" }),
  "chair-arranger": A(MD, { mode: "factors" }), "chair-row-arranger": A(MD, { mode: "factors" }),
  // geoboard@1
  "geoboard": A(GEO), "geoboard-band": A(GEO), "square-grid-tiler": A(GEO), "dot-grid-drawer": A(GEO), "dot-grid": A(GEO), "grid-shape-drawer": A(GEO),
  "squared-paper-grid": A(GEO), "area-vs-boundary-toggle": A(GEO), "area-perimeter-table": A(GEO), "rectangle-builder": A(GEO), "rectangle-explorer": A(GEO),
  "stretchable-rectangle": A(GEO), "floor-tile-layer": A(GEO), "tile-placer": A(GEO), "quilt-builder": A(GEO), "l-border-highlighter": A(GEO),
  "string-loop-rectangles": A(GEO, { mode: "contrast", contrast: "same_perimeter" }),
  "fence-builder": A(GEO, { ask: "perimeter" }), "ant-walk-perimeter": A(GEO, { ask: "perimeter" }), "string-around-shape": A(GEO, { ask: "perimeter" }),
  "lace-border-sim": A(GEO, { ask: "perimeter" }), "fence-cost-calculator": A(GEO, { ask: "perimeter" }),
  // data-graphs@1
  "bar-graph-builder": A(DG, { mode: "build", view: "bar" }), "table-to-bar-converter": A(DG, { mode: "build", view: "bar" }),
  "pictograph-builder": A(DG, { mode: "build", view: "pictograph" }), "data-table-reader": A(DG, { view: "table" }),
  "tally-counter": A(DG, { view: "tally" }), "class-survey-tool": A(DG, { view: "tally" }), "survey-slip-sorter": A(DG, { view: "tally" }),
  "citizen-science-tally": A(DG, { view: "tally" }), "scale-step-changer": A(DG), "key-changer-slider": A(DG, { view: "pictograph" }),
  "symbol-key-slider": A(DG, { view: "pictograph" }), "leaderboard-bars": A(DG), "step-count-bar-chart": A(DG), "frequency-total-checker": A(DG, { question: "total" }),
  "sprout-counter-graph": A(DG), "inhaled-exhaled-bars": A(DG), "food-test-results-table": A(DG, { view: "table" }), "observation-table-builder": A(DG, { view: "table" }),
  // patterns@1
  "hundred-chart-highlight": A(PT, { mode: "grid" }), "hundred-chart-highlighter": A(PT, { mode: "grid" }), "hundred-grid": A(PT, { mode: "grid" }),
  "sieve-grid": A(PT, { mode: "grid" }), "multiplication-chart-highlighter": A(PT, { mode: "grid" }), "addition-chart-highlighter": A(PT, { mode: "grid" }),
  "calendar-grid-highlight": A(PT, { mode: "grid" }), "pattern-table": A(PT, { mode: "grow" }), "pattern-table-extender": A(PT, { mode: "grow" }),
  "growing-pattern-animator": A(PT, { mode: "grow" }), "matchstick-builder": A(PT, { mode: "grow" }), "sequence-ladder": A(PT, { mode: "grow" }),
  "difference-table": A(PT, { mode: "grow" }), "stair-climb-sim": A(PT, { mode: "grow" }), "stacked-triangle-builder": A(PT, { mode: "grow" }),
  "coin-square-builder": A(PT, { mode: "grow" }), "tile-pattern-maker": A(PT, { mode: "repeat" }), "jaali-pattern-builder": A(PT, { mode: "repeat" }),
  "sound-pattern-player": A(PT, { mode: "repeat" }), "rhythm-tapper": A(PT, { mode: "repeat" }),
  // measure@1
  "virtual-ruler": A(MS, { tool: "ruler" }), "broken-ruler": A(MS, { tool: "ruler", start: 2 }), "metre-tape": A(MS, { tool: "ruler" }),
  "measuring-tape": A(MS, { tool: "ruler" }), "ribbon-measure-cutter": A(MS, { tool: "ruler" }), "estimate-then-measure": A(MS, { tool: "ruler" }),
  "girth-tape-tool": A(MS, { tool: "ruler" }), "measuring-jug-pour": A(MS, { tool: "jug" }), "measuring-jug-fill": A(MS, { tool: "jug", mode: "set" }),
  "measuring-jug": A(MS, { tool: "jug" }), "container-compare-pour": A(MS, { tool: "jug" }), "glass-filler-game": A(MS, { tool: "jug", mode: "set" }),
  "glass-filling-game": A(MS, { tool: "jug", mode: "set" }), "pour-sim": A(MS, { tool: "jug" }), "thermometer-slider": A(MS, { tool: "thermometer" }),
  "thermometer-reader-sim": A(MS, { tool: "thermometer" }), "thermometer-number-line": A(MS, { tool: "thermometer" }), "division-value-trainer": A(MS, { tool: "thermometer" }),
  // sky@1
  "globe-torch-sim": A(SKY, { scene: "daynight" }), "earth-spin-globe": A(SKY, { scene: "daynight" }), "earth-from-space-view": A(SKY, { scene: "daynight" }),
  "world-clock-map": A(SKY, { scene: "daynight" }), "india-sunrise-map": A(SKY, { scene: "daynight" }),
  "sun-path-dial": A(SKY, { scene: "shadow" }), "shadow-stick-sim": A(SKY, { scene: "shadow" }), "sun-shadow-clock": A(SKY, { scene: "shadow" }),
  "shadow-direction-sim": A(SKY, { scene: "shadow" }), "shadow-compare-map": A(SKY, { scene: "shadow" }), "sun-path-sim": A(SKY, { scene: "shadow" }),
  "moon-phase-orbit-sim": A(SKY, { scene: "phases" }), "moon-phase-sim": A(SKY, { scene: "phases" }), "ball-torch-model": A(SKY, { scene: "phases" }),
  "moon-diary-calendar": A(SKY, { scene: "phases" }), "phase-sequence-sorter": A(SKY, { scene: "phases" }), "moon-phase-ball-activity": A(SKY, { scene: "phases" }),
  // motion-lab@1
  "race-track-sim": A(MO, { scene: "speed" }), "speed-calculator-steps": A(MO, { scene: "speed" }), "speedometer-odometer-dash": A(MO, { scene: "speed" }),
  "distance-time-table-builder": A(MO, { scene: "speed" }), "race-sim": A(MO, { scene: "speed" }), "distance-race-game": A(MO, { scene: "speed" }),
  "traffic-vs-track-animation": A(MO, { scene: "speed" }), "motion-strobe-sim": A(MO, { scene: "speed" }),
  "pendulum-lab-sim": A(MO, { scene: "pendulum" }), "length-period-graph": A(MO, { scene: "pendulum", ask: "length" }),
  "surface-friction-roll-sim": A(MO, { scene: "friction" }), "stopping-distance-slider": A(MO, { scene: "friction" }),
  // water-cycle@1
  "water-cycle-builder": A(WC, { scene: "cycle" }), "water-cycle-loop-builder": A(WC, { scene: "cycle" }), "condensation-glass-sim": A(WC, { scene: "cycle" }),
  "cold-glass-condensation-sim": A(WC, { scene: "cycle" }), "states-of-water-particles-sim": A(WC, { scene: "states" }), "change-of-state-wheel": A(WC, { scene: "states" }),
  "state-change-slider": A(WC, { scene: "states" }), "kettle-spout-zoom": A(WC, { scene: "states" }), "ice-melt-race": A(WC, { scene: "states", target: "water" }),
  "groundwater-level-sim": A(WC, { scene: "groundwater" }), "water-table-slider": A(WC, { scene: "groundwater" }),
  "infiltration-layers-sim": A(WC, { scene: "groundwater" }), "recharge-city-planner": A(WC, { scene: "groundwater" }),
};

const norm = (h) => String(h ?? "").trim().toLowerCase().replace(/@\d+$/, "").replace(/[_\s]+/g, "-").replace(/[^a-z0-9-]/g, "");

/** A kit hint → { engine, preset } or null. Engine ids ("fractions", "sky@1") resolve to themselves. */
export function resolveHint(hint) {
  const h = norm(hint);
  if (HINT_ALIASES[h]) return HINT_ALIASES[h];
  const id = `${h}@1`;
  return ENGINES[id] && id !== "scene@1" ? { engine: id, preset: {} } : null;
}

/**
 * The kit's engine: its first hint that resolves, preferring one that shares a word (≥ 4 letters) with the
 * remediation's representation; else the topic map's engine (research mapping, see engine-topic-map.json).
 * @returns {{ engine: string, preset: object, hint: string | null, via: "hint" | "topic" } | null}
 */
export function pickEngine(kit, representation, topicMap) {
  const hints = kit?.formats?.engineHints ?? [];
  const words = new Set(String(representation || "").toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));
  const resolved = hints.map((h) => ({ h, r: resolveHint(h) })).filter((x) => x.r);
  const byWord = resolved.find((x) => x.h.toLowerCase().split(/[^a-z]+/).some((w) => words.has(w)));
  const first = byWord ?? resolved[0];
  if (first) return { ...first.r, hint: first.h, via: "hint" };
  const t = topicMap?.[kit?.topicId];
  return t && ENGINES[t] ? { engine: t, preset: {}, hint: null, via: "topic" } : null;
}

// ───────────────────────────── item → params ─────────────────────────────
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const FRAC = /(\d+)\s*\/\s*(\d+)/g;
const frEq = (a, b) => a[0] * b[1] === b[0] * a[1];
const MORE = /\b(bigger|greater|larger|more|heavier|longer|biggest|greatest|largest)\b/i;
const LESS = /\b(smaller|less|lesser|fewer|lighter|shorter|smallest|least)\b/i;
/** "1/4" | "3" | "1,23,456" → number or [n, d]; null if not one value. */
function parseAnswer(a) {
  const s = String(a ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "").replace(/\s*(cm|m|km|mm|kg|g|ml|l|sq\.? ?(cm|m|units?)|square (cm|m|units?)|units?|°c|degrees?)\.?$/i, "").trim();
  let m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) return [Number(m[1]), Number(m[2])];
  m = s.replace(/,/g, "").match(/^-?\d+(\.\d+)?$/);
  return m ? Number(s.replace(/,/g, "")) : null;
}
const numsIn = (t) => [...String(t).replace(FRAC, " ").matchAll(/(?<![\d.])-?\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, "")));
const fracsIn = (t) => [...String(t).matchAll(FRAC)].map((m) => [Number(m[1]), Number(m[2])]).filter((f) => f[1] > 0);

const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALES = { hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, million: 1000000 };
/** "two thousand three hundred forty-five" → 2345 (Indian lakh and international scales); null if not a number name. */
export function wordsToNumber(text) {
  const words = String(text).toLowerCase().replace(/-/g, " ").replace(/\band\b/g, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  let total = 0, cur = 0, any = false;
  for (const w of words) {
    if (w in UNITS) { cur += UNITS[w]; any = true; }
    else if (w === "hundred") { cur = (cur || 1) * 100; any = true; }
    else if (w in SCALES) { total += (cur || 1) * SCALES[w]; cur = 0; any = true; }
    else return null;
  }
  return any ? total + cur : null;
}
/** The next term of an add / multiply / constant-second-difference sequence, or null. */
function nextTerm(t) {
  if (t.length < 3) return null;
  const d = t.slice(1).map((x, i) => x - t[i]);
  if (d.every((x) => x === d[0])) return { next: (k) => t.at(-1) + d[0] * k };
  if (t.every((x) => x !== 0) && Number.isInteger(t[1] / t[0]) && t.slice(1).every((x, i) => x === t[i] * (t[1] / t[0]))) return { next: (k) => t.at(-1) * (t[1] / t[0]) ** k };
  const dd = d.slice(1).map((x, i) => x - d[i]);
  if (dd[0] !== 0 && dd.every((x) => x === dd[0])) return { next: (k) => { let v = t.at(-1), dl = d.at(-1); for (let i = 0; i < k; i++) { dl += dd[0]; v += dl; } return v; } };
  return null;
}
/** "2, 5, 8, 11, ___" → [2, 5, 8, 11]; "1 house uses 5 sticks, 2 houses use 9, 3 houses use 13" → [5, 9, 13] with n. */
function sequenceIn(p) {
  const blank = p.match(/(-?\d+(?:\s*,\s*-?\d+){2,})\s*,\s*(?:_+|\?|\.\.\.|…)/);
  if (blank) return { terms: blank[1].split(",").map((x) => Number(x.trim())), ask: null };
  const uses = [...p.matchAll(/\b(\d+)\s+[a-z]+?\s+(?:uses?|use|has|have|needs?|makes?)\s+(\d+)/gi)].map((m) => [Number(m[1]), Number(m[2])]);
  if (uses.length >= 3 && uses.every(([n], i) => n === i + 1)) {
    const ask = p.match(/(?:for|in|with)\s+(\d+)\s+[a-z]+\s*\??\s*$/i);
    return { terms: uses.map(([, v]) => v), ask: ask ? Number(ask[1]) : uses.length + 1 };
  }
  const dots = [...p.matchAll(/\b(\d+)\s+(?:dots?|sticks?|squares?|tiles?|stones?|beads?|glasses?|coins?)\b/gi)].map((m) => Number(m[1]));
  if (dots.length >= 3 && /next|then|pattern|grows?/i.test(p)) return { terms: dots, ask: null };
  return null;
}


// round 2 content (w1b-mounts: 3 of 3 maths fraction lessons posed an item no engine could bind): fraction words and a
// fraction read off a key written in words ("One quarter, 1/4"), for the name / of adapters only
const FRAC_WORDS = { half: [1, 2], "a half": [1, 2], "one half": [1, 2], "a third": [1, 3], "one third": [1, 3], "a quarter": [1, 4], "one quarter": [1, 4],
  "one fourth": [1, 4], "a fourth": [1, 4], "one fifth": [1, 5], "a fifth": [1, 5], "one sixth": [1, 6], "one eighth": [1, 8], "two thirds": [2, 3],
  "three quarters": [3, 4], "three fourths": [3, 4] };
const FRAC_WORD_RX = new RegExp(`\\b(${Object.keys(FRAC_WORDS).sort((a, b) => b.length - a.length).map((w) => w.replace(" ", "[\\s-]+")).join("|")})\\b`, "i");
const fracWord = (t) => { const m = String(t).match(FRAC_WORD_RX); return m ? FRAC_WORDS[m[1].toLowerCase().replace(/[\s-]+/g, " ")] ?? null : null; };
const SMALL = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const smallNum = (w) => (/^\d+$/.test(w) ? Number(w) : SMALL[String(w).toLowerCase()] ?? null);
/** The ONE fraction a key states ("1/4", "One quarter, 1/4", "3/4 of a roti"), or null when it states another number too. */
function keyFraction(a) {
  const s = String(a ?? "");
  const fr = fracsIn(s);
  const others = numsIn(s).filter((x) => !fr.some(([n, d]) => n === x || d === x));
  if (fr.length === 1 && !others.length) return fr[0];
  if (!fr.length && !numsIn(s).length) return fracWord(s);
  return null;
}
/** The ONE whole number a key states ("5", "5 marbles", "3 drumsticks"), or null. */
function keyWhole(a) {
  if (fracsIn(String(a ?? "")).length) return null;
  const ns = numsIn(String(a ?? ""));
  return ns.length === 1 && Number.isInteger(ns[0]) && ns[0] >= 0 ? ns[0] : null;
}
const OF_RX = new RegExp(`(?:\\b(\\d+)\\s*/\\s*(\\d+)|\\b(${Object.keys(FRAC_WORDS).sort((a, b) => b.length - a.length).map((w) => w.replace(" ", "[\\s-]+")).join("|")}))\\s+of\\s+(?:the\\s+|these\\s+)?(\\d+)\\b(?!\\s*/)`, "i");
const PART = "(?:parts?|pieces?|squares?|sections?|slices?|strips?|columns?|rows?|bits?)";

/** Each adapter returns { params, key?, bindItem, why } — key is the engine-truth answer the params imply. */
const ADAPT = {
  "fraction-bars@1": (p, ans) => {
    const fr = fracsIn(p);
    if (fr.length === 2 && fr.every((f) => f[1] <= 12 && f[0] <= f[1]) && (MORE.test(p) || LESS.test(p))) {
      const q = LESS.test(p) && !MORE.test(p) ? "smaller" : "bigger";
      const cmp = fr[0][0] * fr[1][1] - fr[1][0] * fr[0][1];
      const win = cmp === 0 ? null : (q === "bigger") === cmp > 0 ? fr[0] : fr[1];
      const ok = Array.isArray(ans) && win && frEq(ans, win);
      return { params: { mode: "compare", denominators: fr.map((f) => f[1]), numerators: fr.map((f) => f[0]), question: q }, key: win ? `${win[0]}/${win[1]}` : "same", bindItem: !!ok, why: ok ? "compare: engine winner = kit key" : "compare: kit key is not the engine's winner" };
    }
    if (fr.length === 1 && /\b(shade|colour|color|show|make)\b/i.test(p) && fr[0][1] <= 12 && fr[0][0] <= fr[0][1]) {
      const ok = Array.isArray(ans) && frEq(ans, fr[0]);
      return { params: { denominators: [fr[0][1]], target: `${fr[0][0]}/${fr[0][1]}` }, key: `${fr[0][0]}/${fr[0][1]}`, bindItem: ok, why: ok ? "shade: target = kit key" : "shade: key differs" };
    }
    return null;
  },
  "fractions@1": (p, ans, rep, _preset, actx) => {
    const fr = fracsIn(p);
    const raw = actx?.rawAnswer ?? (Array.isArray(ans) ? `${ans[0]}/${ans[1]}` : ans);
    const model = /circle|pizza|roti|chapati|cake|pie/i.test(`${p} ${rep ?? ""}`) ? { model: "circle" } : {};
    // name (round 2 content): "A roti is cut into 4 equal pieces. What fraction is one piece?", "a square paper folded into
    // 4 equal parts with 3 parts coloured. Say the coloured part as a fraction" → shade N of D on a fixed shape; the child
    // builds the fraction. Bound only when the key states exactly that fraction (an equal value counts) and nothing else.
    const cut = p.match(new RegExp(`\\b(?:cut|divided|split|folded|broken|made)\\b[^.?!]{0,24}?\\binto\\s+(\\d+|${Object.keys(SMALL).join("|")})\\s+equal\\s+${PART}`, "i"));
    if (cut && !fr.length && /\b(what fraction|what do we call|fractional unit|as a fraction|what part of)\b/i.test(p)) {
      const d = smallNum(cut[1]);
      const tail = p.slice(cut.index + cut[0].length);
      const many = tail.match(new RegExp(`\\b(\\d+|${Object.keys(SMALL).join("|")})\\s+(?:of (?:the|them|these)\\s+)?${PART}?\\s*(?:are|is|were|was|get|got)?\\s*(?:coloured|colored|shaded|painted|eaten|taken|used|blue|red|green|yellow|filled)\\b`, "i"));
      const one = /\b(?:one|each|1)\s+(?:piece|part|square|section|slice|strip|bit)\b/i.test(tail) || /fractional unit/i.test(p);
      const n = many ? smallNum(many[1]) : one ? 1 : null;
      const k = keyFraction(raw);
      if (d && n && d >= 2 && d <= 24 && n >= 1 && n <= d) {
        const ok = !!k && frEq(k, [n, d]);
        return { params: { mode: "name", target: `${n}/${d}`, parts: d, shaded: n, ...model }, key: `${n}/${d}`, bindItem: ok, why: ok ? "name: shaded of equal parts = kit key" : "name: key is not the shaded fraction" };
      }
    }
    // of (round 2 content): "What is half of 10 laddoos?", "Find 1/4 of 20.", "What is 1/3 of 12?" → a set of N objects; the
    // child gives a/b of N. Bound when the key is that whole number and nothing else (never a fraction of a fraction).
    const ofM = p.match(OF_RX);
    if (ofM) {
      const f = ofM[1] ? [Number(ofM[1]), Number(ofM[2])] : fracWord(ofM[3]);
      const N = Number(ofM[4]);
      if (f && f[1] >= 2 && f[1] <= 12 && f[0] >= 1 && f[0] <= f[1] && N >= 2 && N <= 60 && (f[0] * N) % f[1] === 0) {
        const v = (f[0] * N) / f[1];
        const ok = keyWhole(raw) === v && fr.length <= 1;
        return { params: { mode: "of", target: `${f[0]}/${f[1]}`, count: N }, key: String(v), bindItem: ok, why: ok ? "of: a/b of N = kit key" : "of: key is not a/b of N" };
      }
    }
    if (fr.length === 2 && /\+/.test(p) && fr.every((f) => f[1] <= 24)) {
      const sum = [fr[0][0] * fr[1][1] + fr[1][0] * fr[0][1], fr[0][1] * fr[1][1]];
      const lcm = (fr[0][1] * fr[1][1]) / gcd(fr[0][1], fr[1][1]);
      const ok = Array.isArray(ans) && frEq(ans, sum) && lcm <= 24 && sum[0] <= 2 * sum[1];
      return { params: { mode: "add", fractions: fr.map((f) => `${f[0]}/${f[1]}`), ...model }, key: `${sum[0]}/${sum[1]}`, bindItem: ok, why: ok ? "add: sum = kit key" : "add: key differs or out of range" };
    }
    const bars = ADAPT["fraction-bars@1"](p, ans);
    if (bars?.params.mode === "compare") return { ...bars, params: { mode: "compare", fractions: fr.map((f) => `${f[0]}/${f[1]}`), question: bars.params.question, ...model } };
    if (bars) return { ...bars, params: { mode: "make", target: bars.params.target, ...model } };
    const fill = p.match(/(\d+)\s*\/\s*(\d+)\s*=\s*\?\s*\/\s*(\d+)/);
    if (fill) {
      const [n, d, parts] = [Number(fill[1]), Number(fill[2]), Number(fill[3])];
      const num = (n * parts) / d;
      const ok = n <= d && parts <= 24 && parts !== d && Number.isInteger(num) && ans === num;
      return { params: { mode: "equivalent", target: `${n}/${d}`, parts, ...model }, key: String(num), bindItem: ok, why: ok ? "equivalent: shaded parts of the fixed shape = kit key" : "equivalent: key differs" };
    }
    if (fr.length === 1 && /equivalent|same as|equal to/i.test(p) && fr[0][0] <= fr[0][1]) return { params: { mode: "equivalent", target: `${fr[0][0]}/${fr[0][1]}`, ...model }, bindItem: false, why: "equivalent: many right answers; the kit key names one" };
    return null;
  },
  "number-line@1": (p0, ans, _rep, preset) => {
    const p = p0.replace(/−/g, "-");
    const fr = fracsIn(p);
    const rnd = p.match(/round\D{0,20}?(\d[\d,]*)\D{1,30}?nearest\s+(ten thousand|ten|hundred|thousand|lakh|10|100|1000|10000|100000)\b/i)
      ?? p.match(/(\d[\d,]*)\D{0,40}?round (?:it|this|that)\D{0,12}?nearest\s+(ten thousand|ten|hundred|thousand|lakh|10|100|1000|10000|100000)\b/i);
    if (rnd) {
      const n = Number(rnd[1].replace(/,/g, ""));
      const u = { ten: 10, hundred: 100, thousand: 1000, "ten thousand": 10000, lakh: 100000 }[rnd[2].toLowerCase()] ?? Number(rnd[2]);
      const target = Math.floor(n / u + 0.5) * u;
      const lo = Math.floor(n / u) * u;
      const onTick = [u / 10, u / 20, u / 40].some((st) => Number.isInteger(st) && Number.isInteger((n - lo) / st));
      // a point that is already a multiple starts the marker ON the target: Check straight away would be right
      const already = n % u === 0;
      const ok = ans === target && onTick && !already;
      return { params: { mode: "place", point: String(n), round: u }, key: String(target), bindItem: ok, why: ok ? "round: the engine's nearest end = kit key" : already ? "round: the point is already a multiple (the marker starts on the answer)" : "round: key differs or the point is off the ticks" };
    }
    const seq = sequenceIn(p);
    if (seq && !seq.ask) {
      const nt = nextTerm(seq.terms);
      const d = seq.terms[1] - seq.terms[0];
      if (nt && seq.terms.slice(1).every((x, i) => x - seq.terms[i] === d)) {
        const next = nt.next(1);
        const lo = Math.min(...seq.terms, next), hi = Math.max(...seq.terms, next);
        // the answer is never an end of the line (an end label next to the question reads as a hint)
        const min = Math.floor((lo - 1) / 5) * 5, max = Math.ceil((hi + 1) / 5) * 5;
        const ok = ans === next && max - min <= 40 && next !== min && next !== max;
        return { params: { mode: "jump", start: String(seq.terms.at(-1)), target: String(next), jumps: ["1", String(Math.abs(d))], min: String(min), max: String(max), question: `${seq.terms.join(", ")}, …` }, key: String(next), bindItem: ok, why: ok ? "sequence: one jump of the step lands on the kit key" : "sequence: key differs or the line is too long" };
      }
    }
    const m = p.match(/\(?(-?\d+)\)?\s*([+-])\s*\(?(-?\d+)\)?/);
    if ((preset.mode === "jump" || preset.numberKind === "integer" || /jump|hop|number line|tokens?|lift/i.test(p)) && m && !fr.length) {
      const a = Number(m[1]), b = Number(m[3]) * (m[2] === "+" ? 1 : -1);
      const target = a + b;
      const named = [...p.matchAll(/jump of (\d+)/gi)].map((x) => x[1]);
      const lo = Math.min(a, target), hi = Math.max(a, target);
      const min = lo < 0 ? lo - 1 : Math.max(0, Math.floor((lo - 1) / 10) * 10), max = lo < 0 ? hi + 2 : Math.ceil((hi + 1) / 10) * 10;
      // the answer is never an end of the line (a whole-number line cannot pad below 0, so a landing on 0 is unbound)
      const atEnd = target === min || target === max;
      const jumps = named.length ? named : Math.abs(b) >= 10 ? ["10", "1"] : ["1"];
      const ok = ans === target && max - min <= 40 && !atEnd;
      return { params: { mode: "jump", start: String(a), target: String(target), jumps, min: String(min), max: String(max), question: `${a} ${b < 0 ? "−" : "+"} ${Math.abs(b)}`, ...(lo < 0 && { numberKind: "integer" }) }, key: String(target), bindItem: ok, why: ok ? "jump: landing = kit key" : atEnd ? "jump: the landing is an end of the line" : "jump: key differs or the line is too long" };
    }
    // Read a mark (W1-B): "A line from 0 to 1 ... 4 equal gaps. What is the first mark?" / "... split into 2 equal parts.
    // What number is at the middle mark?" → read mode: the marker sits on the mark, only the ends are labelled, and the
    // child TYPES its value (engines-v1-bind-on-child-answer). Bound when that value is the kit key.
    const askRead = /\bwhat\s+(?:number\s+)?is\s+(?:at\s+)?the\s+[\w ]{0,20}?mark\b|\bwhat\s+is\s+the\s+(?:first|second|third|fourth|middle|last|\d+(?:st|nd|rd|th))\s+mark\b/i.test(p);
    const range = p.match(/\(?\b(\d+)\)?\s*(?:-\s*to\s*-|to)\s*(?:the\s+[a-z][a-z ]{0,24}?\s*\()?(\d+)\b/i);
    const parts = p.match(/\b(\d+)\s+equal\s+(?:parts|gaps|pieces|spaces)\b/i);
    if (askRead && range && parts && !fr.length) {
      const A = Number(range[1]), B = Number(range[2]), N = Number(parts[1]);
      const each = /\beach\s+(?:whole|unit|one)\b/i.test(p);
      const per = each ? N : N / (B - A);                       // ticks per whole
      const word = { first: 1, second: 2, third: 3, fourth: 4 }[(p.match(/\b(first|second|third|fourth)\s+mark\b/i)?.[1] ?? "").toLowerCase()];
      const nth = Number(p.match(/\b(\d+)(?:st|nd|rd|th)\s+mark\b/i)?.[1] ?? NaN);
      const total = (B - A) * per;
      const k = /\bmiddle\s+mark\b/i.test(p) ? total / 2 : word ?? (Number.isFinite(nth) ? nth : null);
      if (B > A && B - A <= 5 && Number.isInteger(per) && per >= 2 && per <= 12 && total <= 40 && Number.isInteger(k) && k > 0 && k < total) {
        const num = A * per + k, g = gcd(num, per);
        const key = [num / g, per / g];
        const target = key[1] === 1 ? String(key[0]) : `${key[0]}/${key[1]}`;
        const ok = Array.isArray(ans) ? frEq(ans, key) : typeof ans === "number" && key[1] === 1 && ans === key[0];
        return { params: { mode: "read", target, min: String(A), max: String(B), partition: per, labels: "ends", ...(key[1] !== 1 && { numberKind: "fraction" }) }, key: target, bindItem: ok,
          why: ok ? "read: the marked value = kit key" : "read: the kit key is not the marked value" };
      }
    }
    if (/\b(mark|place|show|locate|put)\b/i.test(p) && /number line/i.test(p)) {
      const v = fr.length === 1 ? fr[0] : numsIn(p).length === 1 ? numsIn(p)[0] : null;
      if (v === null) return null;
      const target = Array.isArray(v) ? `${v[0]}/${v[1]}` : String(v);
      const ok = Array.isArray(v) ? Array.isArray(ans) && frEq(ans, v) : ans === v;
      return { params: { mode: "place", target }, key: target, bindItem: ok, why: ok ? "place: the point = kit key" : "place: the kit key is not the point (a description or another value)" };
    }
    return null;
  },
  "place-value@1": (p, ans) => {
    const ns = numsIn(p).filter((n) => Number.isInteger(n) && n >= 0);
    if (ns.length === 2 && (MORE.test(p) || LESS.test(p)) && ns.every((n) => n < 1e7)) {
      const q = LESS.test(p) && !MORE.test(p) ? "smaller" : "bigger";
      const win = ns[0] === ns[1] ? null : (q === "bigger") === ns[0] > ns[1] ? ns[0] : ns[1];
      const ok = win !== null && ans === win;
      return { params: { mode: "compare", a: ns[0], b: ns[1], question: q }, key: String(win), bindItem: ok, why: ok ? "compare: engine winner = kit key" : "compare: key differs" };
    }
    const named = p.match(/(?:write|in numbers|in numerals|numeral)[^:]*:\s*([a-z\s-]+?)\.?$/i);
    if (named) {
      const v = wordsToNumber(named[1]);
      if (v !== null && v < 1e7) {
        const ok = ans === v;
        return { params: { mode: "build", value: v, name: named[1].trim() }, key: String(v), bindItem: ok, why: ok ? "build: the number name's value = kit key" : "build: key differs" };
      }
    }
    const parts = [...p.matchAll(/(\d+)\s*(lakhs?|ten thousands?|thousands?|hundreds?|tens?|ones?)\b/gi)];
    if (parts.length >= 2) {
      const place = { one: 1, ten: 10, hundred: 100, thousand: 1000, "ten thousand": 10000, lakh: 100000 };
      const exp = { one: 0, ten: 1, hundred: 2, thousand: 3, "ten thousand": 4, lakh: 5 };
      const counts = Array(6).fill(0);
      for (const m of parts) { const e = exp[m[2].toLowerCase().replace(/s$/, "")]; if (e !== undefined) counts[e] += Number(m[1]); }
      while (counts.length > 1 && counts.at(-1) === 0) counts.pop();
      const v = counts.reduce((s, n, e) => s + n * 10 ** e, 0);
      // The item gives the pieces and asks for the numeral: the engine SHOWS the pieces (read mode, `counts`)
      // and the child writes the number. Building the pieces back would be copying the prompt.
      const ok = ans === v && counts.every((n) => n <= 19);
      return { params: { mode: "read", counts }, key: String(v), bindItem: ok, why: ok ? "read: the given pieces' value = kit key" : "read: key differs or too many pieces in a place" };
    }
    return null;
  },
  "multiply-divide@1": (p, ans, _rep, preset) => {
    const mul = p.match(/(\d+)\s*(?:×|x|\*|times|rows? of|groups? of)\s*(\d+)/i);
    if (mul && preset.mode !== "share" && preset.mode !== "factors") {
      const a = Number(mul[1]), b = Number(mul[2]);
      if (a >= 1 && b >= 1 && a <= 12 && b <= 12) {
        // ask: "product" — the child builds the array and TYPES the total; the verdict is on that number.
        // (Building a×b alone is copying the prompt's two numbers: it is no evidence of the product.)
        const ok = ans === a * b;
        return { params: { mode: "array", a, b, ask: "product" }, key: String(a * b), bindItem: ok, why: ok ? "array: the typed product = kit key" : "array: key is not the product" };
      }
    }
    const ns = numsIn(p).filter((x) => Number.isInteger(x) && x > 0);
    if (!mul && ns.length === 2 && preset.mode !== "share" && preset.mode !== "factors" && /\b(each|every|of|per|in all|altogether|rows?|trays?|packs?|boxes?)\b/i.test(p)) {
      const [a, b] = ns;
      // a word problem: the expression is NOT shown (choosing to multiply is part of the item)
      if (a <= 12 && b <= 12 && ans === a * b) return { params: { mode: "array", a, b, ask: "product", showExpr: false }, key: String(a * b), bindItem: true, why: "array (word problem): the typed product = kit key" };
    }
    const div = p.match(/(\d+)\s*(?:÷|divided by)\s*(\d+)/i) ?? p.match(/(?:share|divide|distribute|split)\D{0,40}?(\d+)\D{1,40}?(?:among|between|into|to)\D{0,20}?(\d+)/i)
      ?? (ns.length === 2 && /\b(equally|shared?|boxes of|packed|groups? of|each get|each group)\b/i.test(p) ? [null, String(Math.max(...ns)), String(Math.min(...ns))] : null);
    if (div) {
      const n = Number(div[1]), k = Number(div[2]);
      // "packed in boxes of 6" asks how many groups (quotitive); the engine shares among k (partitive): same
      // number, different action, so it is not evidence for that item.
      const quotitive = /\b(boxes|packs?|packets?|sacks|bags|trays|groups|rows) of \d+|\bin (each|every) \w+ of\b|how many (boxes|packs|packets|sacks|bags|trays|groups|autos|buses)\b/i.test(p);
      if (n >= 1 && n <= 100 && k >= 1 && k <= 10) {
        // Never bound: "one each" until the pile runs out always lands on the fair share, so a right share is
        // evidence of tapping, not of dividing (fixer review 2026-10-03). It stays a teaching activity.
        const why = quotitive ? "share: the item asks how many groups (quotitive)" : n % k !== 0 || ans !== n / k ? "share: remainder or key differs" : "share: dealing one each always reaches the fair share (activity, not evidence)";
        return { params: { mode: "share", n, k }, key: String(Math.floor(n / k)), bindItem: false, why };
      }
    }
    const fac = p.match(/factors? of (\d+)/i) ?? (preset.mode === "factors" ? p.match(/(\d+)/) : null);
    if (fac) {
      const n = Number(fac[1]);
      if (n >= 1 && n <= 60) {
        const divisors = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
        const given = numsIn(String(ans)).sort((x, y) => x - y);
        const ok = /all|list|every|find the factors|what are/i.test(p) && given.length === divisors.length && given.every((d, i) => d === divisors[i]);
        return { params: { mode: "factors", n }, key: divisors.join(", "), bindItem: ok, why: ok ? "factors: all divisors = kit key" : "factors: the item asks something other than all factors" };
      }
    }
    return null;
  },
  "patterns@1": (p, ans) => {
    const seq = sequenceIn(p);
    if (!seq) return null;
    const terms = seq.terms;
    const blanks = seq.ask ? seq.ask - terms.length : 1;
    const nt = nextTerm(terms);
    if (!nt || blanks < 1 || blanks > 6) return { params: { mode: "grow", sequence: terms, blanks: Math.max(1, Math.min(6, blanks)) }, bindItem: false, why: "grow: no rule fits, or too many terms to fill" };
    const last = nt.next(blanks);
    const ok = ans === last;
    return { params: { mode: "grow", sequence: terms, blanks }, key: String(last), bindItem: ok, why: ok ? `grow: term ${terms.length + blanks} = kit key` : "grow: key differs" };
  },
  "geoboard@1": (p, ans, _rep, preset, ctx = {}) => {
    const maxW = ctx.ageBand === "6-9" ? 5 : 6;
    const m = p.match(/(\d+)\s*(?:cm|m|units?)?\s*(?:by|×|x)\s*(\d+)/i) ?? p.match(/length\D{0,12}(\d+)\D{1,30}(?:breadth|width)\D{0,12}(\d+)/i)
      ?? p.match(/(\d+)\s+(?:squares?|tiles?|units?|cm|m)\s+(?:long|wide|across)\D{1,20}?(\d+)\s+(?:squares?|tiles?|units?|cm|m)?\s*(?:tall|wide|high|down|long)/i)
      ?? p.match(/(\d+)\s+rows?\s+of\s+(?:\w+\s+)?(?:with\s+)?(\d+)/i)
      ?? ((sq) => (sq ? [sq[0], sq[1], sq[1]] : null))(p.match(/square\D{0,24}?sides?\D{0,10}?(\d+)/i));
    if (!m || !/rectangle|square|garden|field|room|floor|plot|park|tile|grid|rows?/i.test(p)) return null;
    let w = Number(m[1]), h = Number(m[2]);
    if (w > maxW && h <= maxW && w <= 8) [w, h] = [h, w];
    if (w > maxW || h > 8 || w < 1 || h < 1) return { params: { mode: "measure", shape: `rect:${Math.min(w, maxW)}x${Math.min(h, 8)}` }, bindItem: false, why: "measure: rectangle larger than the 360px grid" };
    const ask = /perimeter|boundary|fence|border|around/i.test(p) ? "perimeter" : /area|cover|tiles?|square units|how many (small |unit )?squares/i.test(p) ? "area" : preset.ask ?? null;
    if (!ask) return null;
    const v = ask === "area" ? w * h : 2 * (w + h);
    const ok = ans === v;
    return { params: { mode: "measure", shape: `rect:${w}x${h}`, ask, w: Math.max(w, 3), h: Math.max(h, 2) }, key: String(v), bindItem: ok, why: ok ? `measure: ${ask} = kit key` : `measure: key differs` };
  },
  "data-graphs@1": (p, ans, _rep, _preset, actx) => {
    const ICON = "(?:pictures?|stars?|balls?|bats?|icons?|symbols?|clouds?|smileys?|trees?|apples?|cricket-ball pictures?|tree pictures?|bat pictures?)";
    const key = p.match(new RegExp(`(?:each|1|one)\\s+(?:[a-z-]+\\s+){0,2}?${ICON}\\s*(?:=|means|stands for|is)\\s*(\\d+)`, "i"));
    if (key) {
      const rest = p.slice(0, key.index) + " " + p.slice(key.index + key[0].length);
      const cnt = rest.match(new RegExp(`(\\d+)(\\s+and a half)?\\s+(?:[a-z-]+\\s+){0,2}?${ICON}(\\s+and a half(?:\\s+\\w+)?)?`, "i"));
      if (cnt) {
        const scale = Number(key[1]);
        const count = Number(cnt[1]) + (cnt[2] || cnt[3] ? 0.5 : 0);
        const v = scale * count;
        const ok = ans === v && scale <= 100 && count <= 12 && Number.isInteger(v) && (Number.isInteger(count) || scale % 2 === 0);
        return { params: { mode: "read", view: "pictograph", scale, data: [{ label: "?", value: v }], question: "value", ask: "?" }, key: String(v), bindItem: ok, why: ok ? "pictograph: icons × key = kit key" : "pictograph: key differs or half icon of an odd key" };
      }
    }
    const tally = p.match(/(\w+)\s+(?:full\s+)?bundles?\s+of\s+five\D{0,20}?(\w+)\s+single\s+lines?/i);
    if (tally) {
      const b = /^\d+$/.test(tally[1]) ? Number(tally[1]) : wordsToNumber(tally[1]);
      const one = /^\d+$/.test(tally[2]) ? Number(tally[2]) : wordsToNumber(tally[2]);
      if (b !== null && one !== null && one < 5) {
        const v = 5 * b + one;
        const ok = ans === v;
        return { params: { mode: "read", view: "tally", data: [{ label: "?", value: v }], question: "value", ask: "?" }, key: String(v), bindItem: ok, why: ok ? "tally: 5 per bundle + singles = kit key" : "tally: key differs" };
      }
    }
    const paren = [...p.matchAll(/([A-Z][A-Za-z]+(?:\s[A-Z][a-z]+)?)\s*\((\d+)\)/g)].map((m) => ({ label: m[1], value: Number(m[2]) }));
    const listed = [...p.matchAll(/\b([A-Za-z]+)\s+(\d+)(?=\s*[,).]|\s+and\b)/g)].map((m) => ({ label: m[1], value: Number(m[2]) }));
    const cats = (paren.length >= 2 ? paren : listed).slice(0, 6).map((c) => ({ label: c.label.slice(0, 16), value: c.value }));
    const diff = p.match(/how many (?:more|fewer|less)\D*?\b([A-Za-z]+)\b[^.?]*?than\s+([A-Za-z]+)/i);
    if (cats.length >= 2 && /how many (more|fewer|less)/i.test(p)) {
      const find = (w) => cats.find((c) => c.label.toLowerCase() === String(w ?? "").toLowerCase() || c.label.toLowerCase().startsWith(String(w ?? "").toLowerCase()));
      const a = (diff && find(diff[1])) || cats[0], b = (diff && find(diff[2])) || cats[1];
      const v = Math.abs(a.value - b.value);
      // bound only when both values sit on a labelled gridline of the bar view (dataGraphs.logic.ts gridStep)
      const top = Math.max(5, ...cats.map((c) => c.value));
      const step = [1, 2, 5, 10, 20, 25, 50, 100].find((m) => top / m <= 10) ?? 100;
      const readable = a.value % step === 0 && b.value % step === 0;
      const ok = ans === v && a !== b && readable && new Set(cats.map((c) => c.label)).size === cats.length;
      return { params: { mode: "read", view: "bar", data: cats, question: "difference", ask: a.label, askB: b.label }, key: String(v), bindItem: ok, why: ok ? "bar difference = kit key" : !readable ? "difference: a value falls between gridlines" : "difference: key differs" };
    }
    // Most / least (W1-B): "June 140, July 250, August 230. Which month had the most rain?" → a bar graph read; the
    // child taps the tallest (or shortest) bar. The kit key is a LABEL ("July (250 mm)"), so it binds when that label
    // is the unique top (or bottom) category; a tie is an engine error (dataGraphs.logic.ts normalize), never mounted.
    const extreme = /\b(?:which|what)\b[^.?]*?\b(most|highest|greatest|largest|biggest|maximum|least|lowest|smallest|fewest|minimum)\b/i.exec(p);
    if (cats.length >= 2 && extreme && new Set(cats.map((c) => c.label.toLowerCase())).size === cats.length) {
      const question = /most|highest|greatest|largest|biggest|maximum/i.test(extreme[1]) ? "most" : "least";
      const vals = cats.map((c) => c.value);
      const target = question === "most" ? Math.max(...vals) : Math.min(...vals);
      const tops = cats.filter((c) => c.value === target);
      if (tops.length !== 1 || cats.some((c) => !Number.isInteger(c.value) || c.value < 0)) return null;
      const keyLabel = String(actx?.rawAnswer ?? "").trim().match(/^[A-Za-z]+/)?.[0]?.toLowerCase() ?? "";
      const ok = !!keyLabel && tops[0].label.toLowerCase() === keyLabel;
      return { params: { mode: "read", view: "bar", data: cats, question }, key: tops[0].label, bindItem: ok,
        why: ok ? `bar ${question} = kit key` : `bar ${question}: the kit key is not the ${question} category` };
    }
    // Read one bar (W1-B): "Asha's bar reaches the 12 line. How many votes?" / "Scale: 1 unit = 10 runs. A bar is 7 units
    // tall. How many runs?" → a bar graph read, question value; the child types what the bar shows. Bound on the key.
    const who = p.match(/\b([A-Z][a-z]+)(?:'s)?\s+bar\b/)?.[1] ?? "Bar";
    const reach = p.match(/\bbar\b[^.?]*?\breaches\s+the\s+(\d+)\s+(?:line|mark)\b/i);
    const units = p.match(/\b(?:1|one)\s+unit\s*=\s*(\d+)\b[^.?]*[.?]\s*[^.?]*?\bbar\b[^.?]*?\b(\d+)\s+units?\s+(?:tall|high|long)\b/i);
    if ((reach || units) && /how many|what value|how much/i.test(p)) {
      const scale = units ? Number(units[1]) : 1;
      const v = units ? scale * Number(units[2]) : Number(reach[1]);
      if (!Number.isInteger(v) || v < 0 || v > 1000 || (units && Number(units[2]) > 12)) return null;
      const ok = ans === v;
      return { params: { mode: "read", view: "bar", scale, data: [{ label: who.slice(0, 16), value: v }], question: "value", ask: 0 }, key: String(v), bindItem: ok,
        why: ok ? "bar value = kit key" : "bar value: key differs" };
    }
    return null;
  },
  "measure@1": (p, ans) => {
    const m = p.match(/from\s*(\d+(?:\.\d+)?)\s*cm\s*(?:mark\s*)?to\s*(\d+(?:\.\d+)?)\s*cm/i);
    if (!m) return null;
    const a = Number(m[1]), b = Number(m[2]);
    if (b <= a || b > 30) return null;
    const v = Math.round((b - a) * 10) / 10;
    const ok = ans === v && Number.isInteger(v * 2);
    return { params: { tool: "ruler", mode: "read", start: a, value: v, max: Math.max(15, Math.ceil(b)) }, key: String(v), bindItem: ok, why: ok ? "ruler: length = kit key" : "ruler: key differs" };
  },
};

const SIBLINGS = {
  "fraction-bars@1": ["fractions@1"], "fractions@1": ["fraction-bars@1"],
  "number-line@1": ["patterns@1"], "patterns@1": ["number-line@1"],
  "geoboard@1": ["multiply-divide@1"], "multiply-divide@1": ["geoboard@1"],
  "data-graphs@1": [], "place-value@1": ["number-line@1"],
};

/** The values in a prompt, as server/director/items.js extractValues gives them ("1,23,456" stays one number). */
export function extractValues(text) {
  const t = String(text || "");
  const fractions = [...t.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => [+m[1], +m[2]]);
  const numbers = [...t.replace(/\d+\s*\/\s*\d+/g, " ").matchAll(/\d{1,3}(?:,\d{2,3})+(?!\d)|\d+(?:\.\d+)?/g)].map((m) => +m[0].replace(/,/g, ""));
  return { fractions, numbers };
}

const SCIENCE = new Set(["sky@1", "motion-lab@1", "water-cycle@1"]);
// An unbound fallback (no adapter matched) mounts a maths engine ONLY when the engine's generic normalize will
// build its activity from the item's values; otherwise it would show its demo defaults (place-value 345, a 3×4
// array, sample A/B/C data, a target-less number line), which teach something unrelated to the item. These
// mirror what src/modules/frame/engines/*.logic.ts read from `numbers` / `fractions` (evals/engines-coverage.mjs
// measures the residue: fallback mounts whose normalize ignores the item).
const ints = (v) => v.numbers.filter((n) => Number.isInteger(n) && n >= 0);
const CONSUMES = {
  "number-line@1": (v, pre) => pre.mode !== "jump" && (v.fractions.length > 0 || v.numbers.length > 0),
  "collections@1": (v) => ints(v).length > 0,
  "place-value@1": (v) => ints(v).length > 0,
  "fractions@1": (v) => v.fractions.length > 0,
  "fraction-bars@1": (v) => v.fractions.some(([n, d]) => d >= 1 && d <= 12 && n <= d),
  "multiply-divide@1": (v) => ints(v).some((n) => n > 0),
  // geoboard's generic normalize reads the FIRST number(s): a rectangle that fits the grid, or an area to build
  "geoboard@1": (v, pre) => !!pre.contrast || (ints(v)[0] > 0 && ints(v)[0] <= 40),
  "data-graphs@1": () => false,
  // owner-1 (2026-10-05): the numbers a problem MENTIONS are not a sequence ("3 5 7 8 ? ?": no rule fits, the frame's Check
  // could commit nothing). A grow activity is built only from numbers that ARE one (patterns.logic inferRule: a constant
  // step, a constant ratio, or squares); anything else shows no activity rather than an unanswerable one.
  "patterns@1": (v, pre) => pre.mode === "grow" && v.numbers.length >= 3 && growFits(v.numbers.slice(0, 10)),
  "measure@1": (v) => v.numbers.length > 0,
};
/** Do these numbers follow one grow rule (add k, multiply by k, or consecutive squares)? PURE. Exported for tests. */
export function growFits(ns) {
  const a = (ns ?? []).filter(Number.isInteger);
  if (a.length < 3 || a.length !== (ns ?? []).length) return false;
  const d = a[1] - a[0];
  if (d !== 0 && a.every((x, i) => i === 0 || x - a[i - 1] === d)) return true;
  if (a[0] !== 0 && a[1] % a[0] === 0) { const r = a[1] / a[0]; if (r > 1 && a.every((x, i) => i === 0 || x === a[i - 1] * r)) return true; }
  const r0 = Math.round(Math.sqrt(a[0]));
  return r0 * r0 === a[0] && a.every((x, i) => x === (r0 + i) * (r0 + i));
}
/** fraction-bars@1 reads denominators / numerators, not `fractions`: the item's fractions as unshaded bars. */
const fallbackShape = (engine, v) =>
  engine === "fraction-bars@1" ? { denominators: v.fractions.filter(([n, d]) => d >= 1 && d <= 12 && n <= d).slice(0, 3).map(([, d]) => d) } : v;

/**
 * The full plan for one move. `mode` is the Director's "show" | "predict". Returns null if the kit has no
 * engine, or if no adapter matched and the item gives a maths engine nothing to work with.
 *
 *   plan.params   the mount params: itemId ONLY when bindItem; predict:true when the Director asked for
 *                 predict (engines hide their answer-bearing aids until reveal; `mode` stays the engine's)
 *   plan.predict  → s.module.awaitingReveal (do NOT test params.mode === "predict": adapted plans carry the
 *                 engine's own mode)
 *   plan.itemId   item.id when bound, else null → s.module.itemId (lesson.js grades module answers on it)
 *   plan.goal     "item:<id>" when bound, else undefined
 * Use moduleCommands() to turn a plan into mount / set_param / unmount commands.
 */
export function planEngine({ kit, item, lang, mode = "show", representation, topicMap, ageBand } = {}) {
  const picked = pickEngine(kit, representation, topicMap);
  if (!picked) return null;
  const { engine } = picked;
  let { preset } = picked;
  const prompt = String(item?.prompt_en ?? kit?.workedExample?.problem ?? "");
  const ctx = { topicId: kit?.topicId, skillId: item?.skillId ?? null, lang, ...(representation ? { representation } : {}) };
  const predict = mode === "predict";
  const cls = Number(String(kit?.topicId ?? "").match(/^c(\d+)/)?.[1] ?? 6);
  // rawAnswer: the kit key as written ("July (250 mm)"), for adapters whose right answer is a label, not a number
  const actx = { ageBand: ageBand ?? (cls <= 4 ? "6-9" : "10-15"), rawAnswer: item?.answer ?? null };
  let adapted = item && ADAPT[engine] ? ADAPT[engine](prompt, parseAnswer(item.answer), representation, preset, actx) : null;
  let used = engine;
  // A sibling engine of the same family may fit the item where the kit's engine has no mode for it (fraction
  // bars cannot add; a number line extends a sequence by jumps that patterns@1 shows as a table, and back).
  if (item && (!adapted || !adapted.bindItem)) {
    for (const sib of SIBLINGS[engine] ?? []) {
      const a = ADAPT[sib]?.(prompt, parseAnswer(item.answer), representation, {}, actx);
      if (a?.bindItem) { adapted = a; used = sib; break; }
    }
  }
  // W1-B #6: the kit's OTHER engines may bind the item where its first one cannot (c5 fractions on a line lists
  // number-line, fraction-strips, roti-cutter: a "shade 3/4" item binds fractions@1, not the number line). Only a
  // BINDING plan is taken from them; an unbound activity stays on the kit's first engine.
  let usedPreset = null;
  if (item && (!adapted || !adapted.bindItem)) {
    const tried = new Set([engine, ...(SIBLINGS[engine] ?? [])]);
    for (const h of kit?.formats?.engineHints ?? []) {
      const r = resolveHint(h);
      if (!r || tried.has(r.engine)) continue;
      tried.add(r.engine);
      const a = ADAPT[r.engine]?.(prompt, parseAnswer(item.answer), representation, r.preset, actx);
      if (a?.bindItem) { adapted = a; used = r.engine; usedPreset = r.preset; break; }
    }
  }
  const base = { hint: picked.hint, via: picked.via, predict };
  if (adapted) {
    const bind = !!adapted.bindItem && !!item;
    const pre = used === engine ? preset : usedPreset ?? {};
    const params = validModes(used, { ...ctx, ...pre, ...adapted.params, ...(predict && { predict: true }), ...(bind && { itemId: item.id }) });
    return { engine: used, params, goal: bind ? `item:${item.id}` : undefined, bindItem: bind, itemId: bind ? item.id : null, key: adapted.key ?? null, why: adapted.why + (used !== engine ? ` (via ${usedPreset ? "another kit hint" : "sibling"} of ${engine})` : ""), ...base };
  }
  // Unbound: the item's values (as the Director sent them before engines-v1) so the engine builds its activity
  // from this item, not from its demo defaults.
  const values = extractValues(prompt);
  const maths = !SCIENCE.has(engine);
  if (maths && !(CONSUMES[engine]?.(values, preset) ?? false)) return null;
  // round 3 fix (experience B4): measure@1 shows a ruler (cm), a jug (mL) or a thermometer (°C). An unbound mount used to
  // carry no tool, so "1 kilogram mein kitne grams?" showed a centimetre ruler ("Yeh kitna lamba hai? Lambai (cm)", c4-03,
  // c4-07, 2 of 2): the tool comes from the item's own units, and a quantity no tool measures (mass) mounts nothing.
  const measureTool = engine === "measure@1" ? measureToolFor(`${prompt} ${item?.answer ?? ""}`, representation) : null;
  if (engine === "measure@1" && !measureTool) return null;
  if (measureTool) preset = { ...preset, tool: measureTool };
  // The Director's "show" / "predict" is NOT an engine mode (live-content audit 10: number-line@1 got mode "show",
  // which the frame then "adjusted"). Every engine's normalize treats an absent mode exactly as show / predict (the
  // generic path), predict travels as `predict: true`, so an unbound plan sends no mode unless a preset names one.
  const params = validModes(engine, { ...ctx, ...(maths ? fallbackShape(engine, values) : {}), ...preset, ...(predict && { predict: true }) });
  return { engine, params, goal: undefined, bindItem: false, itemId: null, key: null, why: item ? "no item adapter matched: unbound activity from the item's values" : "no item: unbound activity", ...base };
}

/**
 * round 3 fix (experience B4): the measure@1 tool an item's own words name, or null when none fits (grams / kilograms: the
 * engine has no scale). Mass wins over a stray "l" or "m": a kg item is never shown on a jug or a ruler.
 */
export function measureToolFor(text, representation = "") {
  const t = `${String(text ?? "")} ${String(representation ?? "")}`.toLowerCase();
  if (/(?<![\p{L}])(?:kg|g|gm|gms|gram|grams|gramme|kilogram|kilograms|kilo|kilos|weigh\w*|wazan|vazan|mass|tola)(?![\p{L}])/u.test(t)) return null;
  if (/(?<![\p{L}])(?:ml|millilit(?:re|er)s?|lit(?:re|er)s?|l|jug|pour|capacity)(?![\p{L}])/u.test(t)) return "jug";
  if (/°\s*c|(?<![\p{L}])(?:degrees?|celsius|temperature|thermometer|taapmaan|tapman)(?![\p{L}])/u.test(t)) return "thermometer";
  if (/(?<![\p{L}])(?:cm|mm|centimet(?:re|er)s?|millimet(?:re|er)s?|ruler|scale|length|long|lamba|lambai)(?![\p{L}])/u.test(t)) return "ruler";
  return null;
}

/** Params with `mode` only when it is one of the engine's own modes (ENGINES[engine].modes); an invalid one is dropped. */
export function validModes(engine, params) {
  if (params?.mode === undefined || ENGINES[engine]?.modes.includes(params.mode)) return params;
  const { mode: _drop, ...rest } = params;
  return rest;
}

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keysOf = (o) => Object.keys(o ?? {}).sort().join(",");

/**
 * The module commands that take the frame from `cur` (the mounted module record, or null) to `plan`.
 * set_param is used ONLY when the engine, its mode, its param keys, the goal and the binding are all unchanged
 * (the frame merges set_param into its params and cannot change init.goal, so anything else remounts: a stale
 * target / question / jumps from the previous item must never sit beside a new bound itemId).
 * @returns {{ cmds: object[], module: { id, engine, params, goal, itemId, awaitingReveal } }}
 */
export function moduleCommands(cur, plan, moduleId) {
  const cmds = [];
  const reuse = !!cur && cur.engine === plan.engine && cur.params?.mode === plan.params.mode && keysOf(cur.params) === keysOf(plan.params)
    && (cur.goal ?? null) === (plan.goal ?? null) && (cur.itemId ?? null) === (plan.itemId ?? null);
  if (reuse) {
    for (const [name, value] of Object.entries(plan.params)) if (!sameJson(cur.params[name], value)) cmds.push({ op: "set_param", moduleId: cur.id, name, value });
    return { cmds, module: { id: cur.id, engine: plan.engine, params: plan.params, goal: plan.goal ?? null, itemId: plan.itemId ?? null, awaitingReveal: !!plan.predict } };
  }
  if (cur) cmds.push({ op: "unmount", moduleId: cur.id });
  cmds.push({ op: "mount", moduleId, engine: plan.engine, params: plan.params, ...(plan.goal ? { goal: plan.goal } : {}) });
  return { cmds, module: { id: moduleId, engine: plan.engine, params: plan.params, goal: plan.goal ?? null, itemId: plan.itemId ?? null, awaitingReveal: !!plan.predict } };
}
