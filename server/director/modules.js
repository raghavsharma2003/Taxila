// Module planner: which activity the frame shows for a move, from ONE resolver (shared/engine-catalog.js, decision
// engines-v1-catalog-binding) and the lesson's Forge G1 fills (server/forge/lesson-fills.js, decision
// forge-live-is-g1-fill). Pure and synchronous: step() calls it, and the lesson-fill table is a memory read.
//
// The ladder per move (live-content audit, "fallback ladder, never a placeholder"):
//   practice / probe / retrieval on an item: 1. a BOUND engine plan (the engine's right answer equals the kit key:
//     its answer grades the item) → 2. the lesson's G1 fill for the item (graded on the server by forge/grade.js
//     gradeEvent, never by the frame's `correct`) → 3. an unbound predict activity on a predict / contrast /
//     diagnostic item (revealed when the item is over) → 4. nothing: the board and her voice. A miss at 2 warms the
//     item in the background for the next time it is posed.
//   explain / reteach / worked_example / show_module: an UNBOUND engine show (never graded).
//   teach-back / wrap / safeguard / break / celebrate: the module closes.
// W2-B (Studio ladder rungs 4-5): a teaching move with no engine to show gets the explainer@1 board (an animated
// explanation or a diagram: server/forge/explainer/**); the move BEFORE explain (the hook) asks for the topic's model
// fill when it has no static one, so her preamble covers the fill. W2-B #1 "the teacher sees the screen": whatever is
// mounted after the move is written into the move's content as ONE telegraphic facts row (moduleFacts → factsRow), so
// her line can only point at values that are on screen.
// Every mounted engine id is a member of ENGINES and every mode one of the engine's own (tests/director-mounts.test.mjs
// over every kit); an engine the client reported failing in this lesson is never mounted again (noteModuleEvents).
import { readFileSync } from "node:fs";
import { ENGINES, planEngine, moduleCommands, validModes } from "../../shared/engine-catalog.js";
import { engineConfigError } from "./engine-check.js";
import { peekLessonFill, wantLessonFill } from "../forge/lesson-fills.js";
import { gradeEvent } from "../forge/grade.js";
import { recheckEngineAnswer } from "./recheck.js";
import { p5Flag } from "../conversation/flags.js";
import { explainerFor, wantExplainer } from "../forge/explainer/lesson.js";
import { leaksOpenItem } from "../forge/explainer/guard.js";
// round 4 content: the ONE certificate gate (server/forge3/tray-gate.js): an engine is mounted only when it is certified at
// the device's viewport class (the Desk reports its tray box: POST /api/studio/viewport)
import { certifyModule, viewportOf } from "../forge3/tray-gate.js";

const TOPIC_MAP = JSON.parse(readFileSync(new URL("../../shared/engine-topic-map.json", import.meta.url), "utf8"));

const SHOW_MOVES = new Set(["explain", "reteach", "worked_example", "show_module"]);
const PREDICT_KINDS = new Set(["predict", "contrast", "translate_rep"]);
const CLEAR_MOVES = new Set(["teachback", "wrap", "safeguard", "break", "celebrate"]);
const NEW_ITEM_MOVES = new Set(["practice", "probe", "retrieval", "greet"]);
/** Moves that pose an item the child answers: they take a bound plan or a G1 fill (W1-B #5, #6). */
const ITEM_MOVES = new Set(["practice", "probe", "retrieval"]);
const MAX_FAILED = 8;

/** "Fraction bars" → "fraction-bars@1": the pre-catalog picker's id shape. Kept ONLY as the "before" baseline of
 *  evals/engines-coverage.mjs; nothing on the live path calls it (rj-first-hint-engine-id). */
export function engineId(hint) {
  const base = String(hint).trim().toLowerCase().replace(/@.*$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ver = String(hint).match(/@(\d+)$/)?.[1] ?? "1";
  return `${base}@${ver}`;
}

/** The Director's band ("B1".."B4") for the explainer's pace; anything else is B3. */
const bandOf4 = (band) => (/^B[1-4]$/.test(String(band)) ? band : "B3");
/** "B1".."B4" (director/state.js bandOf) or the ctx age band → the engines' age band. */
const ageBandOf = (band, s) => s?.ctx?.ageBand ?? (band === "B1" || band === "B2" ? "6-9" : "10-15");

/** The device's class for the gate: the lesson's reported tray box (unknown = the 360 phone), its band. */
function trayCtx(s) {
  const v = viewportOf(s?.ctx?.sessionId ?? null);
  const young = v.known ? v.young : String(s?.ctx?.ageBand ?? "") === "6-9";
  return { vp: v.vp, box: v.box, young };
}
/** Telemetry: mounts the gate refused (engine, mode and reason only). */
const refusedMounts = [];
export const mountRefusals = () => refusedMounts.slice();
/** Is this engine plan certified at the device's class? (one place: every mount below goes through it) */
export function certifiedMount(s, plan) {
  const r = certifyModule(plan, trayCtx(s));
  if (!r.ok) {
    refusedMounts.push({ at: Date.now(), engine: plan?.engine ?? null, mode: plan?.params?.mode ?? null, vp: r.vp, why: String(r.why).slice(0, 120) });
    if (refusedMounts.length > 500) refusedMounts.shift();
  }
  return r.ok;
}

/** A plan the frame can mount: a registered engine this lesson has not seen fail, with a valid mode. */
function mountable(s, plan) {
  if (!plan || !ENGINES[plan.engine] || (s.failedEngines ?? []).includes(plan.engine)) return null;
  const params = validModes(plan.engine, plan.params);
  // round 3 fix (experience B2): never mount a config the frame's own normalize() refuses (it would leave the tray while
  // her line points at it): the board / explanation path answers instead
  if (engineConfigError(plan.engine, params)) return null;
  // round 4 content: uncertified at this device's size → not mounted (the board / explanation / voice answer instead)
  if (!certifiedMount(s, { ...plan, params })) return null;
  return { ...plan, params };
}

/** A bound plan shown on a teaching move: the same activity, answers graded nothing. */
function unbind(plan) {
  if (!plan?.bindItem) return plan;
  const { itemId: _i, ...params } = plan.params;
  return { ...plan, params, bindItem: false, itemId: null, goal: undefined };
}

/**
 * Plan module commands for this move. Mutates `s.module` (the mounted module, or null).
 * @param {any} s  the lesson state (s.module, s.turn, s.ctx.sessionId = the lesson id, s.failedEngines)
 * @param {{ kit: any, item: any, move: any, lang: string, band?: string, representation?: string }} args
 * @returns {import("../../shared/contracts").ModuleCommand[]}
 */
export function planModule(s, args) {
  const cmds = planModuleInner(s, args);
  writeFactsRow(s);
  return cmds;
}

function planModuleInner(s, { kit, item, move, lang, band, representation }) {
  const cmds = [];
  const close = () => {
    if (s.module) cmds.push({ op: "unmount", moduleId: s.module.id });
    s.module = null;
  };
  if (CLEAR_MOVES.has(move.kind)) { close(); return cmds; }
  const cur = s.module;
  const ageBand = ageBandOf(band, s);
  const apply = (plan) => {
    const r = moduleCommands(cur, plan, `m${s.turn}`);
    cmds.push(...r.cmds);
    s.module = r.module;
    // the verified key a bound plan's params carry: never written into the facts row (the teacher has it as the key line)
    if (plan.key != null) s.module.key = String(plan.key);
    return cmds;
  };

  if (SHOW_MOVES.has(move.kind)) {
    // The values on screen come from the SAME text her content lines carry (live-content audit 6: she said quarters while
    // the line showed fifths): a move whose content is the worked example shows the worked example, else the item.
    const fromWorked = (s.lastContent ?? []).some((l) => typeof l === "string" && l.startsWith("worked example:"));
    const source = fromWorked ? null : item ?? null;
    const open = openItemOf(s, kit, item);
    const plan = mountable(s, unbind(planEngine({ kit, item: source, lang, mode: "show", representation, topicMap: TOPIC_MAP, ageBand })));
    // an engine show whose visible values state the open item's key (a number line ending on it) is skipped too
    if (plan && !(open && leaksOpenItem({ facts: moduleFacts({ id: "probe", engine: plan.engine, params: plan.params }), ops: [] }, open))) return apply(plan);
    // rungs 4-5: the board explanation / diagram (code pick from the same text, the topic library, the lesson's fill)
    // never-an-answer (W2-B fixer, blocker 1): the item the child is still answering is OPEN; the board drawn for it
    // shows the method with "?" for the result, or a parallel example, and never that item's key (explainer/guard.js)
    const ex = ENGINES["explainer@1"] && !(s.failedEngines ?? []).includes("explainer@1")
      ? explainerFor({ lessonId: s.ctx?.sessionId, kit, item: source, openItem: open, band: bandOf4(band), representation, interest: s.ctx?.interests?.[0] }) : null;
    if (ex && certifiedMount(s, { engine: "explainer@1", params: ex.params })) return apply({ engine: "explainer@1", params: ex.params, goal: undefined, bindItem: false, itemId: null, predict: false });
    // nothing to show: a module that belongs to another item goes; an unbound show stays up through the teach steps
    if (cur?.itemId && item && cur.itemId !== item.id) close();
    return cmds;
  }
  // The move before explain: warm the topic's board fill (a no-op when the topic has a code pick or a library entry).
  if (move.kind === "hook" || move.kind === "greet") wantExplainer({ lessonId: s.ctx?.sessionId, kit, band: bandOf4(band), interest: s.ctx?.interests?.[0] });

  if (ITEM_MOVES.has(move.kind) && item) {
    const predict = PREDICT_KINDS.has(item.kind) || !!item.diagnostic;
    const plan = mountable(s, planEngine({ kit, item, lang, mode: predict ? "predict" : "show", representation, topicMap: TOPIC_MAP, ageBand }));
    // 1. bound engine plan: its answer is the item's answer
    if (plan?.bindItem) return apply(plan);
    // 2. the lesson's G1 fill for this item
    if (cur?.g1 && cur.g1.itemId === item.id) return cmds;                 // already on screen
    const fill = peekLessonFill(s.ctx?.sessionId, item.id);
    if (fill && ENGINES[fill.command.engine] && !(s.failedEngines ?? []).includes(fill.command.engine) && certifiedMount(s, { engine: fill.command.engine, params: fill.command.params })) {
      close();
      cmds.push(fill.command);
      s.module = { id: fill.command.moduleId, engine: fill.command.engine, params: fill.command.params, goal: fill.command.goal ?? null,
        // itemId stays null: routes/lesson.js grades `itemId` modules by the frame's own `correct`; a G1 fill is graded
        // ONLY by gradeEvent over the server-side binding (moduleAnswerOf below), never by the frame
        itemId: null, awaitingReveal: false, g1: { itemId: item.id, fillKey: fill.fillKey, grade: fill.grade } };
      return cmds;
    }
    wantLessonFill({ lessonId: s.ctx?.sessionId, kit, item, move: move.kind, learner: learnerOf(s) });
    // 3. an unbound predict activity (revealed when the item is over): something to predict WITH, graded nothing
    if (predict && plan) { apply(plan); s.module.predictItemId = item.id; return cmds; }
    // 4. the board and her voice; a module of another item goes
    if (cur && ownerOf(cur) !== item.id) close();
    return cmds;
  }

  // Hints, repairs and the rest keep what is on screen; a predict activity is revealed once its item is over or the
  // ladder reaches the hint rung (P5: predict BEFORE reveal).
  if (cur?.awaitingReveal) {
    const owner = ownerOf(cur);
    const itemOver = !item || (owner !== null && owner !== item.id);
    const helping = move.kind === "hint" && (move.hintLevel ?? 0) >= 2;
    if (itemOver || helping) { cmds.push({ op: "reveal", moduleId: cur.id }); cur.awaitingReveal = false; }
  }
  // A plain question on a different item gets the whiteboard anchor, not a stale module.
  if (cur && item && NEW_ITEM_MOVES.has(move.kind) && ownerOf(cur) !== item.id) close();
  return cmds;
}

/**
 * The item the child is still answering (not yet in itemsDone): the move's own item, else the active item. A board for
 * a teaching move on it must never print its key. null when nothing is open.
 */
export function openItemOf(s, kit, item) {
  const done = new Set(s?.itemsDone ?? []);
  if (item?.id && !done.has(item.id)) return item;
  const id = s?.activeItemId;
  if (!id || done.has(id)) return null;
  return (kit?.items ?? []).find((i) => i.id === id) ?? null;
}

/** The item a mounted module belongs to: bound, G1-bound, or predicted on (null: an unbound show). */
const ownerOf = (m) => m.itemId ?? m.g1?.itemId ?? m.predictItemId ?? null;

/** What Forge personalises a turn-path fill from: the lesson's own pinned, consented context (no DB read). */
function learnerOf(s) {
  const c = s.ctx ?? {};
  return { child: { firstName: c.firstName ?? null, classLevel: c.classLevel ?? 6, languagePref: c.lang ?? "hinglish", interests: c.interests ?? [] },
    recentWrong: [], activeMisconceptions: [], pKnown: {} };
}

// ───────────────────────────── the teacher sees the screen (W2-B #1) ─────────────────────────────

/**
 * What each engine shows, as the param names the child can SEE (the views hide targets, answers and questions behind
 * their own widgets: those names are never listed here). Values come from the mount params, i.e. the same values the
 * frame draws from.
 */
const VISIBLE = {
  "fraction-bars@1": ["mode", "denominators", "numerators", "locked"],
  "number-line@1": ["mode", "numberKind", "min", "max", "partition", "step", "start", "jumps", "labels", "point"],
  "collections@1": ["mode", "n", "left", "right", "layout", "item"],
  "place-value@1": ["mode", "places", "grouping", "a", "b"],
  "fractions@1": ["mode", "model", "parts", "fractions", "operands"],
  "multiply-divide@1": ["mode", "a", "b", "n", "k"],
  "geoboard@1": ["mode", "w", "h", "shape", "unit"],
  "data-graphs@1": ["mode", "view", "labels", "values", "scale", "icon"],
  "patterns@1": ["mode", "core", "shown", "gridStart", "gridCount"],
  "measure@1": ["tool", "mode", "unit", "min", "max", "start"],
  "sky@1": ["scene", "mode", "observer"],
  "motion-lab@1": ["scene", "mode", "distance", "time", "surfaces"],
  "water-cycle@1": ["scene", "mode", "landcover"],
};
/** The StudioFacts kind (shared/studio.ts) of an engine: what sort of thing is on screen. */
const KIND = { "sky@1": "simulation", "motion-lab@1": "simulation", "water-cycle@1": "simulation", "scene@1": "game", "explainer@1": "animation" };

const factValue = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.length <= 24 && !/[<>{}\n]/.test(v)) return v;
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (Array.isArray(v) && v.length && v.length <= 8) {
    const flat = v.map((x) => (Array.isArray(x) ? x.join("/") : typeof x === "number" || typeof x === "string" ? String(x) : null));
    if (flat.every((x) => x !== null && x.length <= 12)) return flat.join(" ").slice(0, 40);
  }
  return null;
};

/**
 * What is on screen, as values (LIVE-STUDIO §10 StudioFacts: the one facts shape the Brain reads whatever is on screen,
 * shared with Studio). null when nothing is mounted. A bound plan's verified key never appears (it is the item's answer).
 * @param {any} m  s.module
 * @returns {{ kind: string, archetype: string, onScreen: Record<string, string|number>, itemId?: string } | null}
 */
export function moduleFacts(m) {
  if (!m?.id || !m.engine) return null;
  const onScreen = {};
  const key = m.key != null ? String(m.key) : null;
  if (m.engine === "explainer@1") {
    const f = m.params?.script?.facts;
    // the board is drawn for the child to WATCH: nothing on it asks for a tap, so "tap / pick on the screen" is never a
    // line to say over it (W2-B fixer, minor 8; the reply guard's half is seam-patches/w2b-watch-only.patch)
    onScreen.use = "watch only";
    for (const [k, v] of Object.entries(f?.onScreen ?? {})) { const x = factValue(v); if (x !== null) onScreen[k] = x; }
    return { kind: f?.kind ?? "animation", archetype: f?.archetype ?? m.params?.template ?? "explainer@1", onScreen };
  }
  if (m.engine === "scene@1") {
    const sc = m.params?.scene ?? m.params;
    if (sc?.meta?.template) onScreen.template = String(sc.meta.template);
    const ch = (sc?.nodes ?? []).find((n) => n?.kind === "choice");
    if (ch?.options?.length) onScreen.choices = ch.options.length;
    return { kind: "game", archetype: "scene@1", onScreen, ...(m.g1?.itemId ? { itemId: m.g1.itemId } : {}) };
  }
  // an unbound show builds its activity from the item's values (`numbers`, `fractions`: engine-catalog fallbackShape),
  // so those ARE what is drawn
  for (const name of [...(VISIBLE[m.engine] ?? []), "fractions", "numbers"]) {
    if (name in onScreen) continue;
    const x = factValue(m.params?.[name]);
    if (x === null || (key !== null && String(x) === key)) continue;
    onScreen[name] = x;
  }
  if (m.awaitingReveal) onScreen.state = "child predicts first";
  return { kind: KIND[m.engine] ?? "simulation", archetype: m.engine, onScreen, ...(m.itemId ? { itemId: m.itemId } : {}) };
}

export const FACTS_ROW_PREFIX = "on screen now (values to use when you point at the screen; never what is hidden): ";
const FACTS_ROW_MAX = 360;
/** StudioFacts → one telegraphic row ("engine · name value · …"): values, never a sentence she could recite. */
export function factsRow(f) {
  if (!f) return null;
  const parts = [f.archetype.replace(/@\d+$/, ""), ...Object.entries(f.onScreen).map(([k, v]) => `${k.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()} ${v}`)];
  // whole entries only: a value is never cut in half (a half value on the row is a wrong value)
  let row = FACTS_ROW_PREFIX + parts[0];
  for (const p of parts.slice(1)) { if (row.length + p.length + 3 > FACTS_ROW_MAX) break; row += ` · ${p}`; }
  return row;
}

/** Replace the move's facts row with the one for what is mounted now (none when nothing is). Mutates s.lastContent. */
function writeFactsRow(s) {
  const content = (s.lastContent ?? []).filter((l) => !(typeof l === "string" && l.startsWith(FACTS_ROW_PREFIX)));
  const row = factsRow(moduleFacts(s.module));
  if (row) content.push(row);
  // the part counts the move's content states: what the reply guard allows beside the screen's own (screenContradiction)
  if (s.module) s.module.contentParts = contentPartsOf(content);
  if (row || content.length !== (s.lastContent ?? []).length) s.lastContent = content;
}

// ───────────────────────────── the reply guard (a predicate for the reply path's rewrite) ─────────────────────────────

const PART_WORDS = { half: 2, halves: 2, aadha: 2, aadhe: 2, third: 3, thirds: 3, tihai: 3, quarter: 4, quarters: 4, chauthai: 4, fourth: 4, fourths: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8, aathve: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10, twelfth: 12, twelfths: 12 };
const COUNT_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10 };
/**
 * The PART COUNTS a line states (live-content audit 6: "quarters" said over a line cut in fifths): every fraction's
 * denominator, every part word (half, thirds, chauthai …) and every "N equal parts / N barabar hisse". `strict` keeps
 * only the forms that can only mean a part count (a written fraction, "N equal parts", a plural part word: thirds,
 * quarters …), for a screen with no part counts at all, where a lone "half" is ordinary speech.
 * @returns {Set<string>}
 */
export function partsSaid(text, { strict = false } = {}) {
  const t = String(text ?? "").toLowerCase();
  const out = new Set();
  for (const m of t.matchAll(/(\d+)\s*\/\s*(\d+)/g)) out.add(m[2]);
  for (const w of t.match(/[a-z]+/g) ?? []) if (PART_WORDS[w] && (!strict || PLURAL_PARTS.has(w))) out.add(String(PART_WORDS[w]));
  for (const m of t.matchAll(/(\d+|[a-z]+)\s+(?:equal\s+(?:parts|pieces|shares)|barabar\s+(?:hisse|hisson|bhaag|tukde|tukdon|parts))/g)) {
    const v = /^\d+$/.test(m[1]) ? m[1] : COUNT_WORDS[m[1]];
    if (v !== undefined) out.add(String(v));
  }
  return out;
}
const PLURAL_PARTS = new Set(["halves", "thirds", "quarters", "fourths", "fifths", "sixths", "sevenths", "eighths", "ninths", "tenths", "twelfths"]);
/** The part counts a mounted module shows: its fractions' denominators and its partition / parts / denominators. */
export function partsOnScreen(m) {
  const out = new Set();
  if (!m?.params) return out;
  if (m.engine === "explainer@1") {
    // a board: its facts and its fraction number work, never its coordinates ([118,152] is a point, not 118/152)
    const f = m.params.script?.facts;
    for (const v of Object.values(f?.onScreen ?? {})) for (const x of String(v).matchAll(/(\d+)\s*\/\s*(\d+)/g)) out.add(x[2]);
    // a maths board's counts: its parts, and its equal groups (3 equal groups ARE thirds of the whole)
    if (f?.kind !== "diagram") for (const k of ["parts", "partition", "denominators", "groups"]) { const v = f?.onScreen?.[k]; if (Number.isInteger(v)) out.add(String(v)); }
    for (const o of m.params.script?.ops ?? []) if (o.op === "numwork" && o.layout === "fraction") for (const d of o.rows?.[1] ?? []) if (/^\d+$/.test(d)) out.add(d);
    return out;
  }
  const j = JSON.stringify(m.params).replace(/\[(\d+),(\d+)\]/g, "$1/$2");
  for (const x of j.matchAll(/(\d+)\/(\d+)/g)) out.add(x[2]);
  for (const k of ["partition", "parts", "denominators"]) for (const v of [m.params[k]].flat()) if (Number.isInteger(v)) out.add(String(v));
  return out;
}
/** A maths screen (an engine, or a maths board): any part word over it is a claim about it. */
const MATHS_ENGINES = new Set(["fraction-bars@1", "number-line@1", "collections@1", "place-value@1", "fractions@1", "multiply-divide@1", "geoboard@1", "data-graphs@1", "patterns@1", "measure@1"]);
const mathsScreen = (m) => MATHS_ENGINES.has(m?.engine) || (m?.engine === "explainer@1" && m.params?.script?.facts?.kind !== "diagram");
/**
 * A reply that states part counts neither the screen nor the move's own content shows (the teacher contradicting the
 * screen), or null. The allowed counts are partsOnScreen ∪ the counts in the move's content lines (the same source the
 * screen's values come from; stored on the module as `contentParts` by writeFactsRow, or passed as `contentLines`).
 * A screen with part counts: every part count she says must be one of them. A screen with none (a column sum, a flow
 * diagram, W2-B fixer major 3: "5/4" said over a flow board): a maths screen flags any part count outside the content; a
 * diagram flags the forms that can only be part counts (strict partsSaid). Nothing mounted: null. Pure; the reply path's
 * rewrite loop calls it beside screenProblem (server/brain/say.js).
 * @param {string} text  @param {any} module  @param {string[]} [contentLines]
 * @returns {{ stray: string[], onScreen: string } | null}
 */
export function screenContradiction(text, module, contentLines) {
  if (!module?.id) return null;
  const screen = partsOnScreen(module);
  const allowed = new Set([...screen, ...(module.contentParts ?? []), ...(contentLines ? contentPartsOf(contentLines) : [])]);
  const said = partsSaid(text, { strict: !screen.size && !mathsScreen(module) });
  const stray = [...said].filter((p) => !allowed.has(p));
  if (!stray.length) return null;
  // the rewrite reason names the counts that ARE allowed and the ones that are not (one rewrite has to land it)
  const ok = [...allowed].sort((a, b) => a - b);
  return { stray, onScreen: `${factsRow(moduleFacts(module)) ?? ""}; part counts you may name: ${ok.length ? ok.join(", ") : "none"}; not ${stray.join(", ")}` };
}
/**
 * What is left of a line once the sentences naming stray part counts are taken out (the code repair after a rewrite that
 * still contradicts the screen, as stripScreenRefs is for screen words), or null when nothing is left. The reply path
 * adds the item's question when what is left does not hand the floor back (brain/say.js keepOr).
 */
export function stripStrayParts(text, module, contentLines, { keep = "" } = {}) {
  const sentences = String(text ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  // a sentence of the kit's own posed question (`keep`) is verified content and stays whatever it names
  const verified = (x) => !!keep && String(keep).includes(x.trim().replace(/\s+$/, ""));
  const kept = sentences.filter((x) => verified(x) || !screenContradiction(x, module, contentLines));
  return kept.join("").trim() || null;
}

/** The part counts a move's content lines state (the facts row excluded: it is what is on screen, not the content). */
export const contentPartsOf = (lines) => [...partsSaid((lines ?? []).filter((l) => typeof l === "string" && !l.startsWith(FACTS_ROW_PREFIX)).join(" "))];

/**
 * The client reported the mounted module failing (a frame `error`: unknown or crashed engine, a chunk that would not
 * load, a frame too slow to say ready). Clears `s.module` so the teacher stops counting it as a screen target
 * (director/say.js screenHasTargets) and the next directives carry no module tray; that engine is not mounted again
 * in this lesson. Mutates `s`; returns true when it cleared something. Call on the turn's state BEFORE step().
 * @param {any} s @param {import("../../shared/contracts").ModuleEvent[] | undefined} events
 */
export function noteModuleEvents(s, events) {
  const m = s?.module;
  if (!m || !Array.isArray(events)) return false;
  const failed = events.find((e) => e?.type === "error" && e.moduleId === m.id);
  if (!failed) return false;
  s.failedEngines = [...new Set([...(s.failedEngines ?? []), m.engine])].slice(-MAX_FAILED);
  s.module = null;
  if (s.lastUi?.tray === "module" || s.lastUi?.answerForm === "tap_in_tray") {
    const chips = s.lastUi.chips?.length > 0;
    s.lastUi = { ...s.lastUi, tray: chips ? "tiles" : "none", ...(s.lastUi.answerForm === "tap_in_tray" ? { answerForm: chips ? "choice" : "words" } : {}) };
  }
  return true;
}

/**
 * The module answer that grades the ACTIVE item this turn, or null. Replaces routes/lesson.js's inline filter (which
 * read the frame's `correct` for any `state.module.itemId === activeItemId`):
 *   - a G1 fill is graded by forge/grade.js gradeEvent over the server-side binding; the frame's `correct` and `misc`
 *     are claims and are never read (decision forge-g1-grade-event);
 *   - a bound T1 engine (catalog plan, bindItem) carries the engine's own verdict, computed by tested code from
 *     params whose right answer equals the kit key (engines-v1-catalog-binding); the server re-checks a numeric commit
 *     against that key (recheckValue: engines-v1-server-recheck).
 * @returns {{ correct: boolean, value?: unknown, misconceptionId?: string | null, source: "forge_g1" | "engine" | "engine_rechecked", via?: string, claimMismatch?: boolean } | null}
 */
export function moduleAnswerOf(state, events) {
  const m = state?.module;
  if (!m || !Array.isArray(events) || !state.activeItemId) return null;
  const mine = events.filter((e) => e && e.moduleId === m.id);
  if (m.g1) {
    if (m.g1.itemId !== state.activeItemId) return null;
    for (const e of [...mine].reverse()) {
      const g = gradeEvent(m.g1.grade, e);
      if (g) return { correct: g.outcome === "correct", value: g.value, misconceptionId: g.misconceptionId ?? null, source: "forge_g1", via: g.via };
    }
    return null;
  }
  if (!m.itemId || m.itemId !== state.activeItemId) return null;
  const a = mine.filter((e) => e.type === "answer").at(-1);
  const d = a?.data && typeof a.data === "object" ? a.data : null;
  // V1-01r (VALUES-100 V1.1; owner-1 2026-10-05: 8/9 forged claims accepted on prod): the frame's `correct` is a CLAIM and
  // never the grade. 1. the act's own kind re-run by the engine's logic on the SERVER's params (recheck.js, V1-01); 2. else
  // the committed VALUE against the verified key; 3. else no grade AND no silent drop: { unverifiable } — the Director asks
  // the child for the answer in words (state.js moduleReaction), and the trace says so (module.unverifiable).
  if (d && p5Flag("RECHECK")) {
    const r = recheckEngineAnswer(m, d);
    if (!r.unverifiable) return { correct: r.correct, value: d.value, source: "engine_rechecked", ...(r.claimMismatch ? { claimMismatch: true } : {}) };
    const act = d.value && typeof d.value === "object" && !Array.isArray(d.value) ? d.value : d;
    const byValue = recheckCommitted(act, m.key);
    if (byValue != null) return { correct: byValue, value: d.value, source: "value_rechecked", ...(typeof d.correct === "boolean" && d.correct !== byValue ? { claimMismatch: true } : {}) };
    return { unverifiable: true, value: d.value, why: r.why };
  }
  if (!d || typeof d.correct !== "boolean") return null;
  // engines-v1-server-recheck (OWNER TEST 2026-10-04 item 1, evals/owner-truth F1): the frame's `correct` is a CLAIM. When
  // the committed value and the plan's verified key are both a number or a fraction, the SERVER decides from the value;
  // a claim that disagrees is marked (claimMismatch) and never graded. Other commits keep the engine's verdict.
  const recheck = recheckValue(d, m.key);
  if (recheck == null) return { correct: d.correct, value: d.value, source: "engine" };
  return { correct: recheck, value: d.value, source: "engine_rechecked", ...(recheck !== d.correct ? { claimMismatch: true } : {}) };
}

/**
 * PURE. V1-01r: the value an act COMMITTED (the child's own entry first — written / given / claimed / made / built — and the
 * engine's `value` last, because some acts carry the target beside the entry: pv.write sends value=<key>, written=<entry>),
 * against the verified key. Numbers and fractions by value; two short non-numeric labels by their normalised text. null
 * when nothing comparable was committed (or the key is missing). Exported for tests.
 */
export function recheckCommitted(act, key) {
  if (!act || typeof act !== "object" || key == null || String(key).trim() === "") return null;
  let v = null;
  for (const f of ["written", "given", "claimed", "made", "built", "value"]) if (v == null && act[f] != null && typeof act[f] !== "object") v = act[f];
  const pick = act.chosen ?? act.choice;
  if (v == null && pick != null && Array.isArray(act.fractions)) v = /^\d+$/.test(String(pick)) ? act.fractions[Number(pick)] : pick;
  if (v == null) return null;
  // a number with a short unit ("6 square units", "12 cm") is that number: owner-1 local run 2026-10-05, a geoboard commit
  // "6 square units" against the bound key "6" went ungraded
  const k = numericOf(key) ?? unitNumberOf(key), n = numericOf(v) ?? unitNumberOf(v);
  if (k != null || n != null) return k != null && n != null ? Math.abs(n - k) < 1e-9 : null;
  const lab = (x) => String(x).toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const a = lab(v), b = lab(key);
  return a && b && a.length <= 24 && b.length <= 24 ? a === b : null;
}

/** "6 square units" / "12 cm" / "3/4 kg" → the number; a number followed by anything but 1-3 short letter-only words → null. */
function unitNumberOf(v) {
  const m = String(v ?? "").trim().match(/^(-?\d+(?:\.\d+)?|-?\d+\s*\/\s*\d+)\s+((?:\p{L}{1,12}\.?\s*){1,3})$/u);
  return m ? numericOf(m[1]) : null;
}
const FRAC_RE = /^\s*(-?\d+)\s*\/\s*(\d+)\s*$/;
/** A plain number or fraction (string or number) → its value; anything else → null. Exported for tests. */
export function numericOf(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const t = String(v ?? "").trim().replace(/(\d),(?=\d{3}\b)/g, "$1");
  const f = t.match(FRAC_RE);
  if (f) return Number(f[2]) ? Number(f[1]) / Number(f[2]) : null;
  return /^-?\d+(?:\.\d+)?$/.test(t) ? Number(t) : null;
}
/**
 * PURE. Is the committed engine answer equal to the verified key? null when either side is not a plain number or
 * fraction (then the engine's own verdict stands). Reads the value the engines commit (value / written / built / claimed
 * / made / given), or the picked fraction of a compare (chosen / choice indexing `fractions`). Exported for tests.
 */
export function recheckValue(data, key) {
  const k = numericOf(key);
  if (k == null || !data || typeof data !== "object") return null;
  let v = null;
  for (const f of ["value", "written", "built", "claimed", "made", "given"]) if (v == null && data[f] != null && typeof data[f] !== "object") v = data[f];
  const pick = data.chosen ?? data.choice;
  if (v == null && pick != null && Array.isArray(data.fractions)) v = /^\d+$/.test(String(pick)) ? data.fractions[Number(pick)] : pick;
  const n = numericOf(v);
  return n == null ? null : Math.abs(n - k) < 1e-9;
}
