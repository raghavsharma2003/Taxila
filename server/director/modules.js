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
import { peekLessonFill, wantLessonFill } from "../forge/lesson-fills.js";
import { gradeEvent } from "../forge/grade.js";
import { explainerFor, wantExplainer } from "../forge/explainer/lesson.js";

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

/** A plan the frame can mount: a registered engine this lesson has not seen fail, with a valid mode. */
function mountable(s, plan) {
  if (!plan || !ENGINES[plan.engine] || (s.failedEngines ?? []).includes(plan.engine)) return null;
  return { ...plan, params: validModes(plan.engine, plan.params) };
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
    const plan = mountable(s, unbind(planEngine({ kit, item: source, lang, mode: "show", representation, topicMap: TOPIC_MAP, ageBand })));
    if (plan) return apply(plan);
    // rungs 4-5: the board explanation / diagram (code pick from the same text, the topic library, the lesson's fill)
    const ex = ENGINES["explainer@1"] && !(s.failedEngines ?? []).includes("explainer@1")
      ? explainerFor({ lessonId: s.ctx?.sessionId, kit, item: source, band: bandOf4(band) }) : null;
    if (ex) return apply({ engine: "explainer@1", params: ex.params, goal: undefined, bindItem: false, itemId: null, predict: false });
    // nothing to show: a module that belongs to another item goes; an unbound show stays up through the teach steps
    if (cur?.itemId && item && cur.itemId !== item.id) close();
    return cmds;
  }
  // The move before explain: warm the topic's board fill (a no-op when the topic has a code pick or a library entry).
  if (move.kind === "hook" || move.kind === "greet") wantExplainer({ lessonId: s.ctx?.sessionId, kit, band: bandOf4(band) });

  if (ITEM_MOVES.has(move.kind) && item) {
    const predict = PREDICT_KINDS.has(item.kind) || !!item.diagnostic;
    const plan = mountable(s, planEngine({ kit, item, lang, mode: predict ? "predict" : "show", representation, topicMap: TOPIC_MAP, ageBand }));
    // 1. bound engine plan: its answer is the item's answer
    if (plan?.bindItem) return apply(plan);
    // 2. the lesson's G1 fill for this item
    if (cur?.g1 && cur.g1.itemId === item.id) return cmds;                 // already on screen
    const fill = peekLessonFill(s.ctx?.sessionId, item.id);
    if (fill && ENGINES[fill.command.engine] && !(s.failedEngines ?? []).includes(fill.command.engine)) {
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
  for (const name of VISIBLE[m.engine] ?? []) {
    const x = factValue(m.params?.[name]);
    if (x === null || (key !== null && String(x) === key)) continue;
    onScreen[name] = x;
  }
  if (m.awaitingReveal) onScreen.state = "child predicts first";
  return { kind: KIND[m.engine] ?? "simulation", archetype: m.engine, onScreen, ...(m.itemId ? { itemId: m.itemId } : {}) };
}

export const FACTS_ROW_PREFIX = "on screen now (values; point only at these, never at what is hidden): ";
/** StudioFacts → one telegraphic row ("engine · name value · …"): values, never a sentence she could recite. */
export function factsRow(f) {
  if (!f) return null;
  const vals = Object.entries(f.onScreen).map(([k, v]) => `${k.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()} ${v}`);
  return `${FACTS_ROW_PREFIX}${[f.archetype.replace(/@\d+$/, ""), ...vals].join(" · ")}`.slice(0, 240);
}

/** Replace the move's facts row with the one for what is mounted now (none when nothing is). Mutates s.lastContent. */
function writeFactsRow(s) {
  const content = (s.lastContent ?? []).filter((l) => !(typeof l === "string" && l.startsWith(FACTS_ROW_PREFIX)));
  const row = factsRow(moduleFacts(s.module));
  if (row) content.push(row);
  if (row || content.length !== (s.lastContent ?? []).length) s.lastContent = content;
}

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
 *     params whose right answer equals the kit key (engines-v1-catalog-binding; server re-check is the open item
 *     engines-v1-server-recheck).
 * @returns {{ correct: boolean, value?: unknown, misconceptionId?: string | null, source: "forge_g1" | "engine", via?: string } | null}
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
  return d && typeof d.correct === "boolean" ? { correct: d.correct, value: d.value, source: "engine" } : null;
}
