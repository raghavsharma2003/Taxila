// The kernel side of patch P4: the RevealPoint for a turn, from W2-E's turn state (server/brain/turn.js locals) plus the
// small per-lesson view the kernel keeps about the stage (what idea is on stage, the newest unanswered request, which
// misconceptions were contrasted). The policy reads NOTHING from the portfolio (lossless rule, L1).
//
// The field mapping below is the best reading of turn.js on 2026-10-05; W2-E (owner of turn.js) confirms it when P4 is
// applied. Every read is defensive: a missing field yields a want of null (nothing new on stage), never a throw.
import { hostFor, setOutcomeHook, setRetireHook, setForgetHook, setVerdictHook, seamLesson } from "./seam-bridge.js";
import { feedPlan, feedSignal, revealPoint } from "./adapters.js";
import { beatLookahead } from "./lookahead.js";
import { requestFromText } from "./sources.js";

const views = new Map();
/** The kernel's stage view for a lesson (updated by noteOutcome after each point). */
export function kernelView(lessonId) {
  let v = views.get(lessonId);
  if (!v) { v = newKernelView(); views.set(lessonId, v); }
  return v;
}
export const newKernelView = () => ({ onStage: null, request: null, contrasted: [], revealedAt: {}, lastReveal: -99, shownBeat: [], beat: null, wrong: 0, right: 0, offered: null });
export const forgetLesson = (lessonId) => views.delete(lessonId);

/**
 * @param {{ lesson: { id: string, topic_id: string }, prev: { beat?: { type?: string } | null, turn?: number }, state: object, kit: object,
 *   child: { class_level?: number, language_pref?: string }, childText?: string, moduleOnly?: boolean, misconception?: { id: string, state: string } | null,
 *   signal?: object | null, safety?: boolean, now?: number }} x
 */
export function stagecraftPointFor(x) {
  const host = hostFor(x.lesson?.id);
  if (!host || !host.cfg?.catalog) return null;
  const v = kernelView(x.lesson.id);
  // round 7 M4: the skill being taught (the Director's last move), not the kit's first skill: measured in the replay
  // (evals/stagecraft/replay.mjs, 94 recorded lessons) the first-skill point put a piece of another skill on 67 reveals
  const skillId = x.state?.lastMove?.skillId ?? undefined;
  const stuck = stuckOn(x.state, skillId);
  const point = kernelPoint(v, { ...x, skillId, signal: x.signal ?? (stuck ? { stepState: "stuck_unproductive" } : {}) },
    { catalog: host.cfg.catalog, rest: stageRest(x.lesson.id, x.state, x.now ?? Date.now()) });
  if (feedsOn()) feedPoint(host, v.fed ??= {}, point, { stuck });
  return point;
}

/** Two graded answers on the skill in a row that were not correct: the stuck signal (signals' stuck_unproductive, from state). */
export function stuckOn(state, skillId) {
  const h = skillId ? state?.history?.[skillId] ?? [] : [];
  return h.length >= 2 && h.slice(-2).every((o) => o !== "correct");
}
/** STAGECRAFT_FEEDS = off keeps the point but feeds no source (the round-6 behaviour); default on. */
export const feedsOn = (env = process.env) => String(env.STAGECRAFT_FEEDS ?? "on").trim().toLowerCase() !== "off";

/**
 * Round 7 M4 (studio-stagecraft-sources-unfed): the source feeds at the reveal point, before the decision. The state
 * input first (the conductor invalidates what a topic / skill / beat / language change made stale, the moment it is
 * known), then the beat lookahead when the beat or skill changed (plan_lookahead: the next 1-2 beats build silently),
 * then the stuck signal (child_signal). Child words already reach the point (kernelPoint's request). Silent: nothing
 * here can put anything on screen (L1). Never throws. `fed` is the per-lesson memory of the last beat and skill fed.
 */
export function feedPoint(host, fed, point, { stuck = false } = {}) {
  try {
    const cur = point?.current;
    if (!host || !cur?.skillId) return;
    host.input({ t: "state", key: cur, at: point.at });
    if (cur.beat !== fed.beat || cur.skillId !== fed.skill) {
      const plan = beatLookahead({ beat: cur.beat, skillId: cur.skillId, topicId: cur.topicId, at: point.at });
      if (plan) feedPlan(host, plan);
      fed.beat = cur.beat; fed.skill = cur.skillId;
    }
    feedSignal(host, stuck ? { stepState: { s: "stuck_unproductive" } } : {}, { skillId: cur.skillId, topicId: cur.topicId, nextTrpAt: point.at });
  } catch { /* a feed never breaks the turn */ }
}

/**
 * The pure half of stagecraftPointFor (round 7 M4: the offline replay, evals/stagecraft/replay.mjs, drives this exact
 * function with its own view and its own measured stage): the RevealPoint from a kernel view and the turn state.
 * `x.skillId` overrides the skill read from the kit (the replay's arms); `rest` is the stage's busy share.
 */
export function kernelPoint(v, x, { catalog, rest = {} }) {
  const turnSeq = Number(x.prev?.turn ?? x.state?.turn ?? 0) + 1;
  const beat = x.prev?.beat?.type ?? "explain";
  if (beat !== v.beat) { v.shownBeat = []; v.beat = beat; }
  const kind = !x.moduleOnly ? requestFromText(x.childText ?? "") : null;
  // a board ask is answered by the whiteboard this turn (policy holds): it is never kept as a standing request
  if (kind && kind !== "board_request") v.request = { kind, seq: turnSeq };
  const mis = x.misconception ?? null;
  if (mis?.state === "active" && v.revealedAt[mis.id] == null) v.revealedAt[mis.id] = turnSeq - 1;
  const band = { 1: "B1", 2: "B1", 3: "B2", 4: "B2", 5: "B3", 6: "B3", 7: "B4", 8: "B4", 9: "B4" }[x.child?.class_level] ?? "B3";
  const lang = { hi: "hi", en: "en" }[x.child?.language_pref] ?? "hinglish";
  const topicId = x.lesson.topic_id;
  const skillId = x.skillId ?? x.kit?.skills?.[0]?.id ?? `${topicId}-s1`;
  return revealPoint({ lessonId: x.lesson.id, turnSeq, safety: !!x.safety, beat, beatChanged: v.shownBeat.length === 0, topicId, skillId, classLevel: x.child?.class_level, ...rest,
    band, lang, kitHash: String(x.kit?.version ?? x.kit?.topicId ?? "kit"), misconception: mis ? { ...mis, revealedTurn: v.revealedAt[mis.id] ?? null } : null,
    contrasted: v.contrasted, request: kind === "board_request" ? { kind, seq: turnSeq } : v.request, offerAccepted: null, board: { onStage: v.onStage, wrongCount: v.wrong, complete: v.right >= 3 }, signal: x.signal ?? {},
    lastPolicyRevealTurn: v.lastReveal, shownThisBeat: v.shownBeat, phase: "committed", at: x.now ?? Date.now() }, { catalog });
}

/** After the point: the kernel records what the stage now shows (the same rules the simulator's kernel uses). */
export function noteOutcome(lessonId, point, outcome) { noteViewOutcome(kernelView(lessonId), point, outcome); }
/** noteOutcome on a given view (the replay keeps its own). */
export function noteViewOutcome(v, point, outcome) {
  const want = point?.want;
  if (!want || !outcome) return;
  if (want.childRequested && (outcome.act === "reveal" || outcome.act === "board" || v.onStage?.family === want.family)) v.request = null;
  if (outcome.act !== "reveal" && outcome.act !== "board") return;
  if (!v.onStage || v.onStage.family !== want.family) {
    v.onStage = { family: want.family, archetype: want.archetype ?? "whiteboard", kind: want.kinds?.[0] ?? "game", revealedTurn: point.turnSeq };
    v.lastReveal = point.turnSeq; v.wrong = 0; v.right = 0;
    v.shownBeat.push(want.family);
    if (want.need === "contrast_misconception") { const m = want.family.split("|")[2]; if (m && m !== "-") v.contrasted.push(m); }
  }
}

/** The seam retired the piece: the policy sees an empty stage (the simulator's kernel does the same). */
export function noteKernelRetired(lessonId) { const v = views.get(lessonId); if (v) { v.onStage = null; v.wrong = 0; v.right = 0; } }
/** The host graded an answer on the piece on stage (gradeAnswer, verified key): feeds the board reteach rule (>= 2 wrong). */
export function noteBoardVerdict(lessonId, verdict) { const v = views.get(lessonId); if (!v?.onStage) return; if (verdict === "wrong") v.wrong++; else if (verdict === "right") v.right++; }

setOutcomeHook(noteOutcome);
setRetireHook(noteKernelRetired);
setForgetHook(forgetLesson);
setVerdictHook(noteBoardVerdict);

// ───────────── ship5 p4-content: the stage's busy share, the time since the last visual, and flow ─────────────
// Read from the seam's OWN stage (server/studio/seam.js lesson state: every piece, Wave 2 and Stagecraft, and every
// whiteboard), sampled once per point. A piece counts as busy from its reveal until it retires (sampled at the next
// point); a whiteboard counts for its drawing's length. Never reads the portfolio (lossless rule L1 holds: these are
// facts of what the child saw, the same in every arm).
const BOARD_BUSY_MS = 8000;
/** @returns {{ busyShare?: number, teachingMs?: number, lastVisualAgoMs?: number, inFlow?: boolean }} */
export function stageRest(lessonId, state, now = Date.now()) {
  const L = seamLesson(lessonId);
  if (!L) return {};
  const v = kernelView(lessonId);
  v.busy ??= new Map();               // intentId → [start, end|null]
  let lastVisual = -Infinity;
  for (const p of L.pieces?.values?.() ?? []) {
    const start = Number(p.revealedAt);
    if (!Number.isFinite(start)) continue;
    lastVisual = Math.max(lastVisual, start);
    const board = p.kind === "whiteboard";
    const visible = p.state === "revealed" || p.state === "in_use";
    const span = v.busy.get(p.intentId);
    if (board) { const len = Number(p.artifact?.script?.durationMs) || BOARD_BUSY_MS; v.busy.set(p.intentId, [start, start + Math.min(len, 20_000)]); continue; }
    if (!span) v.busy.set(p.intentId, [start, visible ? null : now]);
    else if (span[1] == null && !visible) span[1] = now;
  }
  const startedAt = Number(L.startedAt) || now;
  const teachingMs = Math.max(0, now - startedAt);
  let busy = 0, open = false;
  for (const [a, b] of v.busy.values()) { busy += Math.max(0, Math.min(b ?? now, now) - Math.max(a, startedAt)); if (b == null || b > now) open = true; }
  const skill = state?.lastMove?.skillId;
  const hist = skill ? state?.history?.[skill] ?? [] : [];
  const inFlow = hist.length >= 2 && hist.slice(-2).every((o) => o === "correct");
  return { busyShare: teachingMs > 0 ? Math.min(1, busy / teachingMs) : 0, teachingMs, lastVisualAgoMs: open ? 0 : Number.isFinite(lastVisual) ? now - lastVisual : teachingMs, inFlow };
}