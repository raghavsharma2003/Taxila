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
// Every mounted engine id is a member of ENGINES and every mode one of the engine's own (tests/director-mounts.test.mjs
// over every kit); an engine the client reported failing in this lesson is never mounted again (noteModuleEvents).
import { readFileSync } from "node:fs";
import { ENGINES, planEngine, moduleCommands, validModes } from "../../shared/engine-catalog.js";
import { peekLessonFill, wantLessonFill } from "../forge/lesson-fills.js";
import { gradeEvent } from "../forge/grade.js";

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
export function planModule(s, { kit, item, move, lang, band, representation }) {
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
    return cmds;
  };

  if (SHOW_MOVES.has(move.kind)) {
    const plan = mountable(s, unbind(planEngine({ kit, item: item ?? null, lang, mode: "show", representation, topicMap: TOPIC_MAP, ageBand })));
    if (plan) return apply(plan);
    // nothing to show: a module that belongs to another item goes; an unbound show stays up through the teach steps
    if (cur?.itemId && item && cur.itemId !== item.id) close();
    return cmds;
  }

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
