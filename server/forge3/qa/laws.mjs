// Round 8: the laws of every play family (dc-r8-game-modes-three-laws; docs/design/round8/games-judging/RULINGS-2026-11-11.md),
// checked on a served level by drawing the family's REAL view headless (a recording 2D context, the painter's audit) through
// the law's own acts. The play cert (server/forge3/play-cert.js) fails a cell whose level breaks one; tests/r8-play-laws
// runs it over every (family, mode, goal) the coverage serves.
//
//   1. Green means right, and only right. Nothing is green before she acts. After a miss with a try left, green is only a
//      tick (a part she got right), never the colour of a value, a line, a body or a chip; a miss screen that holds green
//      and no "look" anywhere tells her she is right when she is not. Selection is the focus colour (the painter draws a
//      selected body in focus). The action hue ("you", Design's patch 002) is the DOM action button's only: any canvas use
//      of "you", in any state, is a break (the action hue on a figure). The art's four role colours are Design's on kagaz
//      and raat (DESIGN_ROLES), and the action hue is outside the green family in every art.
//   2. After a miss the screen never holds the key while a try remains: no text drawn after the miss holds a value the
//      family keeps hidden (server/play/react.js hiddenOf: what a line may not say before she produces it) unless that
//      value was on screen before she acted (a given) or is her own value. In the science families (IDEA_WORDS, laws ruling
//      2026-11-15) a text new after the miss never holds a word of the idea the goal's solved line states.
//   3. A mix-up is named only by an act a guess rarely produces: on a goal decided by one pick among a few
//      (FamilyLogic.oneDecision, chancePicks) the grade never keeps the misconception (gradeLevel reports it at chance
//      weight as `chanceMis`). Reported for review (not failed): a mal-rule fired by a single input act on a goal not so
//      declared.
//   4. After a miss the check waits until her act changes (dc-r8-gate2-shadow S4; main's ruling 005, 2026-11-16): the act that
//      missed, pressed again on the same answer, keeps one of three forms (checkWaits; the views use
//      src/play/core/viewkit.ts missWait, the logic src/play/core/law4.ts):
//        off      its control is disabled or gone (a check button waits; a pick's missed option is greyed until the level,
//                 or the card's item, ends);
//        refused  the law refuses it without playing the miss again or counting a check (a typed number equal to the one
//                 that missed: "unchanged", as kon/name's Yahi naam; a greyed pick pressed anyway: "missed_option");
//        a look   an experiment act (a tool used, a thing tried) is for looking: run again on the same set-up it shows its
//                 result as a result, raises no count of checks and plays no miss.
//      A sighting (gate 2) is a level's first check only: a pick after a miss on the same level is never one and never
//      counts toward a repeat (src/play/core/replay.ts gradeLevel). CHECK_WAITS_OPEN lists the modes still open; the play
//      cert skips law 4 for them, and the list only shrinks (tests/r8-play-laws.test.mjs CHECK_WAITS_MAX).
// Marks a key can be counted off (a triangle on unit ticks) and lines it can be traced from are not seen by these checks:
// they are the family tests' and the judges' (LAWS-AUDIT.md lists them per family).
import { register } from "node:module";

const HOOK = Symbol.for("taxila.json-hook");
if (!globalThis[HOOK]) {
  globalThis[HOOK] = true;
  register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
}

function fakeCtx() {
  const t = { font: "10px x", fillStyle: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1, textAlign: "center", textBaseline: "middle", lineCap: "", lineJoin: "", globalCompositeOperation: "source-over", shadowBlur: 0, shadowColor: "", lineDashOffset: 0, filter: "none", imageSmoothingEnabled: true };
  return new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "measureText") return (s) => ({ width: [...String(s)].length * Number(/(\d+)px/.exec(o.font)?.[1] ?? 16) * 0.56, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 });
      if (k === "getLineDash") return () => [];
      if (k === "isPointInPath" || k === "isPointInStroke") return () => false;
      if (k === "getTransform") return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      return () => ({ addColorStop() {} });
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}

/**
 * Reviewed uses the generic checks cannot tell from a break (LAWS-AUDIT.md, 2026-11-11): each is a part she got right,
 * drawn green beside parts she got wrong drawn in the mix-up colour, or a value the ruling keeps on screen. A family
 * listed here still fails on any other break.
 */
export const ALLOWED = {
  "darpan/mirror": [{ law: 1, re: /\(stroke\)/, why: "after the fold test each line she drew is green when it folds true, look when it does not" }],
  "darpan/turn": [{ law: 1, re: /\(circle\)/, why: "each turn she tried is marked green when it maps the shape onto itself, look when not" }],
  "galti-pakdo/kaapi": [{ law: 1, re: /\(stroke\)/, why: "the balance needle on the line she checked: green when that line balances, look when it tips" },
    { law: 2, re: /the key "line \d+"/, why: "the \"line N\" tag names the line she herself checked on the balance (state.on is set only by her check of that line, or 0 after a fix); laws ruling 2026-11-15, asserted over the generator in tests/r7-games-galti-pakdo.test.mjs" }],
  "kram/machine": [{ law: 1, re: /\(text/, why: "each output her rule made: green where it matches the machine, look where not" }],
  "nishana/compare": [{ law: 1, re: /\(stroke\)/, why: "a flag she placed on its mark is green, one off it is ink" }],
  "nishana/place": [{ law: 1, re: /\(stroke\)/, why: "a flag she placed on its mark is green, one off it is ink" }],
  "paheli/cipher": [{ law: 1, re: /\(chip, text/, why: "each column she cracked is green, a wrong one look" }],
  "paheli/magic": [{ law: 1, re: /\(stroke, chip, text/, why: "each line of hers that sums right is green, the others look" }],
  "yantra/roshni": [{ law: 1, re: /\(stroke\)/, why: "each thing she judged right gets a green frame and a tick, a wrong one look" }],
  "todo-jodo/atoms": [{ law: 2, re: /the key/, why: "the common atom is one she split out herself: her tree, not a shown key" }],
  "kaal/order": [{ law: 1, re: /\(stroke, chip, text/, why: "a stone she landed right flies its year in green; a miss is drawn in look" }, { law: 2, re: /the key "\d+"/, why: "each stone's year is its own task line when it comes up (a given of that step); the key is where it lies" }],
  "stambh/tally": [{ law: 2, re: /the key "\d+"/, why: "the count over each group runs 1..5 (a row's count can be one of those digits) and then fades: nothing stays over the tally while a try remains (evening ruling 2, 2026-11-11; tests/r8-games-stambh-tally asserts the faded screen)" }],
};
/**
 * Law 2 for the science families (laws ruling 2026-11-15, RULINGS-2026-11-15.md row 1): while a try remains, the screen and
 * the line say what her act did, never what is true; what is true is said once, on the solved screen. Per (family/mode) and
 * goal: the words of the idea that goal's solved line states (whole words or phrases, the three languages the view can
 * show). Any text drawn after a miss while a try remains that was not on the first screen (a given) and holds one fails
 * law 2. tests/r8-laws-idea-words.test.mjs holds that each solved line states its idea (it moved, it did not vanish).
 */
export const IDEA_WORDS = {
  "aakash/chakkar": {
    din: ["ghoomti", "ghoomta", "ghumaya", "earth spins", "earth turns", "earth turned", "spins and carries", "west to east", "pashchim se poorab", "घूमती", "घुमाया", "पश्चिम से पूरब"],
    saal: ["ek chakkar", "poora chakkar", "sooraj ka chakkar", "saal ki chaal", "a spin", "one spin", "once round", "year's movement", "एक चक्कर", "पूरा चक्कर", "साल की चाल"],
  },
  "aakash/ritu": {
    jhuk: ["dhuri", "jhuka", "jhuki", "axis", "leaning", "tilted", "same way", "ek hi taraf", "seedhi", "tirchhi", "straight", "slants", "धुरी", "झुका", "झुकी", "एक ही ओर", "सीधी", "तिरछी"],
    dhoop: ["seedhi", "tirchhi", "straight", "slant", "slanting", "slants", "spread", "spreads", "faili", "सीधी", "तिरछी", "फैली"],
  },
  "aakash/grahan": {
    chaaya: ["ek line", "seedhi line", "in line", "straight line", "lined up", "line mein", "एक रेखा", "सीधी रेखा", "रेखा में"],
    kab: ["ek line", "seedhi line", "in line", "straight line", "lined up", "line mein", "upar ya neeche", "above or below", "एक रेखा", "सीधी रेखा", "रेखा में"],
  },
  "badlaav/aag": {
    trikon: ["oxygen", "hawa rokta", "keeps the air out", "sends air", "hawa bhejta", "not heat", "garmi nahi", "ऑक्सीजन", "हवा रोकता", "हवा भेजता", "गर्मी नहीं"],
    raakh: ["nasht nahi", "not destroyed", "nothing was destroyed", "gas ban", "as gases", "hawa mein gaya", "went into the air", "नष्ट नहीं", "गैस बन", "हवा में गया"],
    jang: ["nayi cheez", "new substance", "paani chahiye", "paani aur hawa", "needs water", "water and air", "oxygen", "नई चीज़", "पानी चाहिए", "पानी और हवा", "ऑक्सीजन"],
  },
  "bhaap/hawa": {
    naav: ["samundar se zameen", "zameen se samundar", "from the sea", "from the land", "sea to the land", "land to the sea", "समुद्र से ज़मीन", "ज़मीन से समुद्र"],
    kamra: ["hawa upar", "hawa neeche", "rises", "rose", "sinks", "sank", "stays down", "uthti", "uthi", "baithti", "baithi", "हवा ऊपर", "हवा नीचे", "उठती", "उठी", "बैठती", "बैठी"],
  },
  "chhaano/sukha": Object.fromEntries(["farak", "kram"].map((g) => [g,
    ["bhaar", "bhaari", "halka", "halki", "weight", "heavy", "heavier", "size", "paas hi", "fell near", "भार", "भारी", "हल्का", "हल्की", "साइज़", "पास ही"]])),
  "jaanch/neela": { iodine: ["starch dikhata", "iodine shows starch", "cheeni nahi", "not sugar", "does not show sugar", "starch only", "only starch", "स्टार्च दिखाता", "चीनी नहीं"] },
  "rang/pehchaan": {
    litmus: ["laal karta", "neela karta", "turns blue litmus red", "turns red litmus blue", "लाल करता", "नीला करता"],
    desi: ["base par", "on a base", "haldi laal", "gudhal hara", "basic tha", "was basic", "क्षार पर", "हल्दी लाल", "क्षारीय था"],
  },
  "rang/milao": {
    boond: ["khatam kiya", "cancelled", "zyada base", "extra base", "too much", "patla", "diluted", "dilutes", "ख़त्म किया", "ज़्यादा क्षार", "पतला"],
    ilaaj: ["khatam kiya", "cancelled", "neutralisation", "ख़त्म किया", "उदासीनीकरण"],
  },
  "yantra/roshni": {
    parda: ["roshni jaane", "roshni jaaye", "roshni jaati", "light pass", "light passes", "lets", "transparent", "translucent", "opaque", "रोशनी जाने", "रोशनी जाए", "रोशनी जाती"],
    roshan: ["roshni pade", "roshni padi", "roshni nahi padi", "light falls", "falls on", "sunlight", "dhoop", "रोशनी पड़े", "रोशनी पड़ी", "रोशनी नहीं पड़ी", "धूप"],
    dhak: ["apni roshni", "own light", "light of its own", "luminous", "अपनी रोशनी"],
  },
};
/** the idea words of a level's (family/mode, goal) */
export function ideaWordsOf(level) {
  const goal = level?.goal ?? level?.params?.goal;
  return IDEA_WORDS[`${level?.family}/${level?.mode}`]?.[goal] ?? [];
}
const NOT_WORD = "[^\\p{L}\\p{M}\\p{N}]";
const ideaRe = new Map();
/** the first idea word a text holds as a whole word or phrase (case and Unicode form ignored), or null */
export function ideaIn(text, words) {
  const t = String(text ?? "").normalize("NFC");
  for (const w of words) {
    let re = ideaRe.get(w);
    if (!re) { re = new RegExp(`(?:^|${NOT_WORD})${w.normalize("NFC").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|${NOT_WORD})`, "iu"); ideaRe.set(w, re); }
    if (re.test(t)) return w;
  }
  return null;
}
const GREEN_BAD = new Set(["text", "chip", "circle", "stroke", "body", "color"]);
/** her own values: every number and string field of every act she made */
function ownValues(acts) {
  const out = new Set();
  for (const a of acts) for (const [k, v] of Object.entries(a ?? {})) if (k !== "kind" && (typeof v === "number" || typeof v === "string")) out.add(String(v).toLowerCase());
  return out;
}
const tokens = (s) => String(s).toLowerCase().split(/[^0-9a-zऀ-ॿ./]+/).filter(Boolean);
function holds(texts, value) {
  const v = String(value).toLowerCase().trim();
  if (!v) return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return texts.some((t) => tokens(t).includes(v));
  return v.length >= 3 && texts.some((t) => String(t).toLowerCase().includes(v));
}

let MOD = null;
/** the meaning roles (answer, focus, mix-up) as the painter role that draws each: src/play/core/styles.ts LAW_ROLES, the one
 *  map a Design token patch fills; the checks never read a colour */
let ROLE = { answer: "good", focus: "focus", mixup: "look" };
async function mods() {
  if (MOD) return MOD;
  const [{ ART, Painter, newAudit, LAW_ROLES }, { VIEWS }, { logicFor }, { hiddenOf }] = await Promise.all([
    import("../../../src/play/core/styles.ts"), import("../../../src/play/families/views.ts"), import("../../../src/play/families/index.ts"), import("../../play/react.js"),
  ]);
  MOD = { ART, Painter, newAudit, VIEWS, logicFor, hiddenOf, LAW_ROLES };
  ROLE = LAW_ROLES;
  return MOD;
}

/**
 * Design's patch 002 (docs/patches/to-games/002-tx-roles/README.md §3): the four role colours on kagaz and raat, the same
 * values as src/styles/tx-tokens.css themes A and B and Studio's board. Raat's action is null: the README keeps lime there,
 * and the rulings of 2026-11-11 (night) and 2026-11-15 put the action outside the green family in both looks, so raat's
 * action is held only to that (actionOutsideGreen). The painter role of each meaning is LAW_ROLES; "action" is ArtTokens.you.
 */
export const DESIGN_ROLES = {
  kagaz: { focus: "#3B47B0", answer: "#0B736A", mixup: "#8A5A00", action: "#EFA52E", actionInk: "#1C1A16" },
  raat: { focus: "#8F9BFF", answer: "#4FE0A2", mixup: "#FFB54A", action: null, actionInk: "#0F1218" },
};
/** a hex colour's hue in degrees (0..360), or -1 for a grey */
export function hueOf(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return -1;
  return ((mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360;
}
/** the green family (yellow-green lime through teal): the hues a child reads as "right" */
export const GREEN_HUES = [65, 175];
export const actionOutsideGreen = (hex) => { const h = hueOf(hex); return h < 0 || h < GREEN_HUES[0] || h > GREEN_HUES[1]; };
/** law 1 on the art's tokens: Design's role values on kagaz and raat, and the action hue outside green in every art */
export function tokenBreaks(art) {
  const out = [];
  if (!art) return out;
  const want = DESIGN_ROLES[art.id], role = { ...ROLE };
  if (want) for (const k of ["focus", "answer", "mixup"]) if (String(art[role[k]]).toUpperCase() !== want[k]) out.push({ law: 1, state: "tokens", what: `${art.id} ${k} ${art[role[k]]} is not Design's ${want[k]}` });
  if (want?.action && art.you.toUpperCase() !== want.action) out.push({ law: 1, state: "tokens", what: `${art.id} action ${art.you} is not Design's ${want.action}` });
  if (want && art.youInk.toUpperCase() !== want.actionInk) out.push({ law: 1, state: "tokens", what: `${art.id} action ink ${art.youInk} is not Design's ${want.actionInk}` });
  if (!actionOutsideGreen(art.you)) out.push({ law: 1, state: "tokens", what: `${art.id} action ${art.you} is in the green family (hue ${Math.round(hueOf(art.you))})` });
  return out;
}

/** Mount the family's view headless on `level`; drive acts through the law; draw it at a few ages after each act. */
async function mount(level, { W = 360, H = 520, art = "kagaz", young = true, lang = "hinglish" } = {}) {
  const M = await mods();
  const logic = M.logicFor(level.family, level.mode), make = M.VIEWS[`${level.family}/${level.mode}`];
  if (!logic || !make) return null;
  const audit = M.newAudit(art, young); audit.box = { w: W, h: H };
  const ctl = { state: logic.init(level), acts: [], level, logic,
    dispatch(a) { const seq = this.acts.length + 1; let r; try { r = logic.apply(level, this.state, a, seq); } catch { r = { state: this.state, moments: [], refused: "bad_act" }; } this.state = r.state; this.acts.push({ seq, t: seq * 1000, via: "touch", act: a }); view.react(r.moments, r.refused); return r; },
    finger() {}, withVia(_v, fn) { fn(); }, get solved() { return logic.goalMet(level, this.state); }, facts() { return logic.facts(level, this.state); }, board() { return logic.board(level, this.state); }, atTurnPoint() { return true; }, idleMs() { return 0; }, dispose() {} };
  const api = { w: W, h: H, dpr: 1, t: 10, P: new M.Painter(M.ART[art], audit, young), art: M.ART[art], reduced: false, young,
    tw: { busy: false, add() {}, to() {}, step() {}, clear() {} }, fx: { burst() {}, shake() {}, flash() {}, stop() {}, ring() {}, pop() {}, text() {}, busy: false, ox: 0, oy: 0, hitstop: 0 },
    sfx() {}, target(id, x, y, w, h) { audit.targets.push({ id, x, y, w, h }); }, invalidate() {}, layer() { return null; },
    hit(x, y) { const t = [...audit.targets].reverse().find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); return t ? t.id : null; } };
  let view = null;
  view = make(api, { level, ctl, lang, changed() {} });
  view.layout(W, H);
  const frame = () => {
    audit.targets.length = 0; audit.texts.length = 0; audit.marks.length = 0; audit.segs.length = 0; audit.uses.length = 0; audit.clipped = 0;
    let err = null;
    try { view.update?.(1 / 60); view.draw(fakeCtx()); } catch (e) { err = String(e?.message ?? e).slice(0, 120); }
    let goal = "", controls = [];
    try { goal = view.goal(); controls = view.controls(); } catch { /* chrome only */ }
    return { texts: audit.texts.map((x) => x.s), uses: [...audit.uses], marks: audit.marks.map((m) => m.kind), goal, controls: controls.map((c) => c.label), err,
      enabled: controls.filter((c) => !c.disabled).map((c) => c.id), targets: [...new Set(audit.targets.map((t) => t.id))] };
  };
  /** the screen over the next few seconds after an act (play-outs run on api.t): every text and use any frame drew */
  const look = () => {
    const fs = [];
    for (const dt of [0.05, 0.4, 1.1, 2.4, 6]) { api.t += dt; fs.push(frame()); }
    const last = fs[fs.length - 1];
    return { texts: [...new Set(fs.flatMap((f) => [...f.texts, f.goal, ...f.controls]))], uses: fs.flatMap((f) => f.uses), marks: fs.flatMap((f) => f.marks), err: fs.find((f) => f.err)?.err ?? null, last };
  };
  return { logic, ctl, api, look, view, frame };
}

/** Options a pick is made among: enabled controls other than undo and the number pad, and the touch targets that are
 *  things to pick (a tool, a bin, a mark, a claim, an item, a station, a product, a choice). */
const PICKY = /^(tool|bin|mark|claim|predict|choose|choice|item|station|prod|opt|option|card|line|arc|ang|pick|letter|ans|answer|door|bar)[-:_]/;
const META = /^(undo|kdel|k\d|again|reset|clear|back|go|run)$/;
const INDEX_KEYS = new Set(["at", "row", "col", "i", "node", "jar", "slot", "idx", "lane", "which", "part", "card", "bar", "to"]);
function optionsAt(f) { return f.enabled.filter((id) => !META.test(id)).length + f.targets.filter((id) => PICKY.test(id)).length; }
/**
 * How the mal-rule's signature was produced: "constructed" (two or more of her acts differ from the solver's, or the
 * differing act is a typed number or a placement) or "pick" (one act differs, chosen among `options`).
 */
function howMade(acts, solve, at, frames) {
  const D = [];
  for (let j = 0; j <= at; j++) if (JSON.stringify(acts[j]) !== JSON.stringify(solve?.[j])) D.push(j);
  if (D.length >= 2) return { kind: "constructed", differ: D.length };
  const j = D[0] ?? at, f = frames[j];
  // a value she set (typed, dialled, stepped, dragged to): any number that is not an index of a thing on screen
  const numeric = Object.entries(acts[j] ?? {}).some(([k, v]) => typeof v === "number" && !INDEX_KEYS.has(k));
  if (numeric) return { kind: "constructed", set: true };
  if (f.enabled.some((id) => /^nudge/.test(id))) return { kind: "constructed", placed: true };
  // a drag or a placement on the canvas offers no row of things to pick among (0 or 1 option seen)
  const options = optionsAt(f);
  if (options < 2) return { kind: "constructed", placed: true };
  return { kind: "pick", options, act: acts[j] };
}

/**
 * Law 4 still open (dc-r8-gate2-shadow S4, 2026-11-16; main's ruling 005 decides each kind): the modes whose act that missed
 * is her answer itself and that do not yet keep one of law 4's three forms. Each is fixed by its kind's form:
 *   pick: the option that missed is greyed until the level (or the card's item) ends (off; refused "missed_option" if
 *     pressed anyway), and a pick after a miss is never a sighting (gradeLevel);
 *   typed: a number equal to the one that missed is refused ("unchanged") and the control is off until the number changes;
 *   experiment: a repeat on the same set-up is a look (no miss moment, no check counted).
 * The play cert skips law 4 for the modes listed here, and the list only shrinks (tests/r8-play-laws CHECK_WAITS_MAX).
 */
export const CHECK_WAITS_OPEN = {
  "todo-jodo/strips": "pick", "nishana/place": "pick", "kyun-lab/dhruv": "pick", "kon/place": "pick, typed", "rang/milao": "pick",
  "todo-jodo/atoms": "typed, experiment", "nazariya/floor": "typed", "nazariya/powers": "typed", "taraazu/equality": "typed",
  "aakash/chakkar": "experiment", "aakash/ritu": "experiment", "badlaav/aag": "experiment", "badlaav/palat": "experiment, pick",
  "bhaap/chakra": "experiment", "bhaap/hawa": "experiment", "chhaano/geela": "experiment", "chhaano/sukha": "experiment",
  "jaanch/daag": "experiment", "jaanch/neela": "experiment", "rang/pehchaan": "experiment",
};
const MISSED = (r) => !!r && (r.refused === "missed" || (r.moments ?? []).some((x) => x.kind === "misconception_consequence" || x.kind === "near_miss" || x.kind === "law_refused"));
/** the control on screen whose press dispatches `act` (each control's press caught, nothing applied), or null */
function controlFor(m, act) {
  let cs = [];
  try { cs = m.view.controls(); } catch { return null; }
  const key = JSON.stringify(act), real = m.ctl.dispatch;
  let caught;
  m.ctl.dispatch = function (a) { caught = a; return { state: this.state, moments: [], refused: "probe" }; };
  try {
    for (const c of cs) { caught = undefined; try { c.onPress(); } catch { /* a press that needs the pointer */ } if (caught !== undefined && JSON.stringify(caught) === key) return c; }
  } finally { m.ctl.dispatch = real; }
  return null;
}
/** a fresh mount with `n` of `acts` played, the screen settled */
async function playedTo(level, opts, acts, n) {
  const m = await mount(level, opts);
  for (let i = 0; i < n; i++) { m.api.t += 0.5; m.frame(); m.ctl.dispatch(acts[i]); }
  m.look();
  return m;
}
/** the numbers the facts keep of her checks and tries */
const checkCounts = (f) => Object.entries(f ?? {}).filter(([k, v]) => typeof v === "number" && /check|tries|tried|attempt|miss/i.test(k));
/**
 * Law 4 (dc-r8-gate2-shadow S4; ruling 005): after a miss while a try remains, the check waits until her act changes. The
 * check is the act that missed (acts[missAt]); its control, where a control made it, is the one whose press dispatches that
 * act. Pressed again on the same answer it keeps one of the three forms:
 *   off      the control is disabled, or gone from the screen;
 *   refused  the law refuses it without playing the miss again and without raising a facts count of checks or tries;
 *   a look   (an experiment) it runs and shows its result, with no miss moment and no count of checks raised.
 * `m` is the mount just after the miss; it is pressed. → { form } when it holds, { break } when not
 */
async function checkWaitsForm(level, opts, acts, missAt, m) {
  const act = acts[missAt];
  const before = controlFor(await playedTo(level, opts, acts, missAt), act);
  const after = controlFor(m, act);
  if (before && !after) return { form: "off" };
  if (after?.disabled) return { form: "off" };
  let r = null;
  const was = checkCounts(m.ctl.facts());
  if (after) { const real = m.ctl.dispatch; m.ctl.dispatch = function (a) { r = real.call(this, a); return r; }; try { after.onPress(); } finally { m.ctl.dispatch = real; } }
  else r = m.ctl.dispatch(act);
  const how = after ? `"${after.id}"` : `the act ${JSON.stringify(act).slice(0, 50)}`;
  if (MISSED(r)) return { break: `after a miss, ${how} on the same answer plays the miss again` };
  const now = new Map(checkCounts(m.ctl.facts()));
  const cost = was.find(([k, v]) => (now.get(k) ?? v) > v);
  if (cost) return { break: `after a miss, ${how} on the same answer counts a check (${cost[0]})` };
  return { form: r?.refused ? "refused" : "look" };
}
async function checkWaits(level, opts, acts, missAt, m) { return (await checkWaitsForm(level, opts, acts, missAt, m)).break ?? null; }
/** law 4's form on each mal-rule's miss of a level (the audit's per-mode table): [{ mal, act, form | break }] */
export async function law4Forms(level, opts = {}) {
  const M = await mods();
  const logic = M.logicFor(level.family, level.mode), out = [];
  for (const mal of Object.keys(level.mal ?? {}).filter((id) => (logic?.malRules ?? []).includes(id))) {
    let acts = null;
    try { acts = logic.malActs(level, mal); } catch { acts = null; }
    if (!acts?.length) continue;
    const m = await mount(level, opts);
    let missAt = -1;
    for (let i = 0; i < acts.length; i++) { m.api.t += 0.5; m.frame(); if (MISSED(m.ctl.dispatch(acts[i]))) { missAt = i; break; } }
    if (missAt < 0 || logic.goalMet(level, m.ctl.state)) continue;
    m.look();
    out.push({ mal, act: acts[missAt], ...(await checkWaitsForm(level, opts, acts, missAt, m)) });
  }
  return out;
}

/**
 * The law breaks on one level: [{ law, state, what }] (empty = the level keeps all three), plus `review` items (single-act
 * mal-rules on goals not declared one-decision, for the audit) and `checked` (how many states were looked at).
 */
export async function lawsFor(level, opts = {}) {
  const M = await mods();
  const breaks = [], review = [], uses = new Set();
  const logic = M.logicFor(level.family, level.mode);
  if (!logic) return { breaks: [{ law: 0, state: "mount", what: "no logic" }], review, checked: 0 };
  let hidden = [];
  try { hidden = (M.hiddenOf(level) ?? []).filter((v) => v !== null && v !== undefined && v !== ""); } catch { hidden = []; }
  const ideas = ideaWordsOf(level);
  const chanceFor = (mal) => !!level.goal && (!!logic.oneDecision?.includes(level.goal) || !!logic.chancePicks?.includes(level.goal) || !!logic.chancePicks?.includes(`${level.goal}:${mal}`));
  let checked = 0;
  // ── the first screen: nothing is green before she acts
  const m0 = await mount(level, opts);
  if (!m0) return { breaks: [{ law: 0, state: "mount", what: "no view" }], review, checked: 0 };
  const first = m0.look();
  checked++;
  if (first.err) breaks.push({ law: 0, state: "initial", what: `view threw: ${first.err}` });
  const given = first.texts;
  for (const u of first.uses) if (u.role === ROLE.answer && u.op !== "particle") { breaks.push({ law: 1, state: "initial", what: `green before any act (${u.op})` }); break; }
  for (const u of first.uses) if (u.role === "you") uses.add(u.op);
  breaks.push(...tokenBreaks(M.ART[opts.art ?? "kagaz"]));
  // ── each mal-rule's acts, step by step: the screen after the first miss while a try remains
  const mals = Object.keys(level.mal ?? {}).filter((id) => (logic.malRules ?? []).includes(id));
  for (const mal of mals) {
    let acts = null;
    try { acts = logic.malActs(level, mal); } catch { acts = null; }
    if (!acts?.length) continue;
    const m = await mount(level, opts);
    let missAt = -1, malAt = -1;
    const frames = [];
    for (let i = 0; i < acts.length; i++) {
      m.api.t += 0.5; frames.push(m.frame());
      const r = m.ctl.dispatch(acts[i]);
      if (malAt < 0 && r.moments.some((x) => x.kind === "misconception_consequence")) malAt = i;
      if (r.moments.some((x) => x.kind === "misconception_consequence" || x.kind === "near_miss" || x.kind === "law_refused") || r.refused === "missed") { missAt = i; break; }
    }
    const solved = logic.goalMet(level, m.ctl.state);
    if (missAt < 0 || solved) continue;
    const s = m.look();
    checked++;
    if (s.err) breaks.push({ law: 0, state: `mal:${mal}`, what: `view threw: ${s.err}` });
    for (const u of s.uses) if (u.role === "you") uses.add(u.op);
    // law 1: green only as a tick on a part she got right
    const bad = [...new Set(s.uses.filter((u) => u.role === ROLE.answer && GREEN_BAD.has(u.op)).map((u) => u.op))];
    const said = [...new Set(s.uses.filter((u) => u.role === ROLE.answer && u.s).map((u) => u.s))].slice(0, 3);
    if (bad.length) breaks.push({ law: 1, state: `mal:${mal}`, what: `green on an unsolved screen after a miss (${bad.join(", ")}${said.length ? `: ${said.map((x) => JSON.stringify(x)).join(" ")}` : ""})` });
    const ticks = s.uses.filter((u) => u.op === "tick" || u.op === `body:${ROLE.answer}`).length, looks = s.uses.filter((u) => u.role === ROLE.mixup).length;
    if (ticks && !looks) breaks.push({ law: 1, state: `mal:${mal}`, what: `only right-marks (${ticks}) and no look mark on an unsolved screen after a miss` });
    // law 2: no hidden value appears after the miss that was not a given and is not hers
    const mine = ownValues(m.ctl.acts.map((e) => e.act));
    // a value drawn in green is a part she already got right (law 1 holds green to that): hers, not the key
    const rightParts = s.uses.filter((u) => u.role === ROLE.answer && u.s).map((u) => u.s);
    for (const v of hidden) {
      if (holds(given, v) || mine.has(String(v).toLowerCase()) || holds(rightParts, v)) continue;
      if (holds(s.texts, v)) { breaks.push({ law: 2, state: `mal:${mal}`, what: `the key "${v}" is on screen after a miss` }); break; }
    }
    // law 2, the science families: a miss line says what her act did, never the idea (that is the solved line's)
    if (ideas.length) for (const t of s.texts) {
      if (given.includes(t)) continue;
      const w = ideaIn(t, ideas);
      if (w) { breaks.push({ law: 2, state: `mal:${mal}`, what: `a miss line states the idea ("${w}"): ${JSON.stringify(t).slice(0, 90)}` }); break; }
    }
    // law 3: a mix-up the grade names was made by an act a guess rarely produces (never one pick among five or fewer)
    const g = logic.grade(level, m.ctl.acts);
    const named = (g.evidence ?? []).find((e) => e.misconceptionId);
    if (chanceFor(mal) && named) breaks.push({ law: 3, state: `mal:${mal}`, what: `named ${named.misconceptionId} from one pick on a one-decision goal` });
    else if (named && malAt >= 0) {
      let sol = null;
      try { sol = logic.solve(level); } catch { sol = null; }
      const how = howMade(acts, sol, malAt, frames);
      if (how.kind === "pick" && how.options <= 5) breaks.push({ law: 3, state: `mal:${mal}`, what: `named from one pick among ${how.options} (${JSON.stringify(how.act).slice(0, 60)})` });
      else if (how.kind === "pick") review.push({ law: 3, state: `mal:${mal}`, what: `named from one pick among ${how.options} (${JSON.stringify(how.act).slice(0, 60)})` });
    }
    // law 4: after the miss, the check waits until her act changes (pressed again on the same answer it is off or refused)
    const w = await checkWaits(level, opts, acts, missAt, m);
    if (w) breaks.push({ law: 4, state: `mal:${mal}`, what: w });
  }
  // ── the solve: the view runs to the end without throwing
  let sol = null;
  try { sol = logic.solve(level); } catch { sol = null; }
  if (sol?.length) {
    const m = await mount(level, opts);
    for (const a of sol) m.ctl.dispatch(a);
    const s = m.look();
    checked++;
    if (s.err) breaks.push({ law: 0, state: "solved", what: `view threw: ${s.err}` });
    for (const u of s.uses) if (u.role === "you") uses.add(u.op);
  }
  // the action hue is the DOM action button's only (patch 002): a canvas "you" in any state is a figure in the action hue
  if (uses.size) breaks.push({ law: 1, state: "any", what: `the action hue ("you") on a figure (${[...uses].join(", ")}): draw her pick in focus` });
  const allow = ALLOWED[`${level.family}/${level.mode}`] ?? [];
  const allowed = breaks.filter((b) => allow.some((a) => a.law === b.law && a.re.test(b.what)));
  return { breaks: breaks.filter((b) => !allowed.includes(b)), allowed, review, checked, youOps: [...uses] };
}

/**
 * For each mal-rule of the level: the act that fired its signature (the decisive act), its index, and what the screen
 * offered just before it (enabled controls and touch targets): the audit reads whether that act is one pick among a few.
 */
export const _mount = (level, opts) => mount(level, opts);
export async function decisiveActs(level, opts = {}) {
  const M = await mods();
  const logic = M.logicFor(level.family, level.mode), out = [];
  for (const mal of Object.keys(level.mal ?? {}).filter((id) => (logic?.malRules ?? []).includes(id))) {
    let acts = null;
    try { acts = logic.malActs(level, mal); } catch { acts = null; }
    if (!acts?.length) continue;
    const m = await mount(level, opts);
    for (let i = 0; i < acts.length; i++) {
      const f = m.look().last;
      const ctrls = (() => { try { return m.view.controls().filter((c) => !c.disabled).map((c) => c.id); } catch { return []; } })();
      const targets = (() => { m.api.t += 0.01; m.look(); return [...new Set(m.api.P.audit.targets.map((t) => t.id))]; })();
      const r = m.ctl.dispatch(acts[i]);
      if (r.moments.some((x) => x.kind === "misconception_consequence")) { out.push({ mal, act: acts[i], at: i, controls: ctrls, targets, goal: f.goal }); break; }
    }
  }
  return out;
}

/**
 * Every (family, mode, goal) the coverage serves, with its served levels (the play cert's coverageLevels: seeds 0..k-1 and
 * the level the Director's focus on each mapped misconception serves), and the law result of each level.
 * → [{ key, goal, topicId, levelId, breaks, review, checked, youOps }]
 */
export async function lawsOverCoverage({ only = null, seeds = 2, perGoal = 1, lang = "hinglish" } = {}) {
  const { coverage } = await import("../../play/levels.js");
  const { coverageLevels } = await import("./cert-levels.mjs");
  const seen = new Map(), out = [];
  for (const e of coverage().entries ?? []) {
    const key = `${e.family}/${e.mode}`;
    if (only && !(only.includes("/") ? key === only : key.startsWith(`${only}/`))) continue;
    const gk = `${key}|${e.goal}`;
    if ((seen.get(gk) ?? 0) >= perGoal) continue;
    seen.set(gk, (seen.get(gk) ?? 0) + 1);
    for (const level of await coverageLevels(e, seeds, { focus: true })) {
      const r = await lawsFor(level, { young: e.classLevel <= 5, lang });
      out.push({ key, goal: level.goal ?? e.goal, topicId: e.topicId, levelId: level.levelId, ...r });
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
  const rows = await lawsOverCoverage({ only: arg("only", null), seeds: Number(arg("seeds", 2)), perGoal: Number(arg("per-goal", 1)), lang: arg("lang", "hinglish") });
  if (argv.includes("--json")) console.log(JSON.stringify(rows, null, 1));
  else for (const r of rows) console.log(`${r.key} ${r.goal} ${r.levelId}: ${r.breaks.length ? r.breaks.map((b) => `L${b.law} ${b.state} ${b.what}`).join(" | ") : "ok"}${r.review.length ? ` · review: ${r.review.map((b) => `${b.state} ${b.what}`).join(" | ")}` : ""}${r.youOps.length ? ` · you→focus: ${r.youOps.join(",")}` : ""}`);
  process.exit(0);
}
