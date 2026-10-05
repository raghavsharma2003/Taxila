// The kernel side of patch P4: the RevealPoint for a turn, from W2-E's turn state (server/brain/turn.js locals) plus the
// small per-lesson view the kernel keeps about the stage (what idea is on stage, the newest unanswered request, which
// misconceptions were contrasted). The policy reads NOTHING from the portfolio (lossless rule, L1).
//
// The field mapping below is the best reading of turn.js on 2026-10-05; W2-E (owner of turn.js) confirms it when P4 is
// applied. Every read is defensive: a missing field yields a want of null (nothing new on stage), never a throw.
import { hostFor, setOutcomeHook, setRetireHook } from "./seam-bridge.js";
import { revealPoint } from "./adapters.js";
import { requestFromText } from "./sources.js";

const views = new Map();
/** The kernel's stage view for a lesson (updated by noteOutcome after each point). */
export function kernelView(lessonId) {
  let v = views.get(lessonId);
  if (!v) { v = { onStage: null, request: null, contrasted: [], revealedAt: {}, lastReveal: -99, shownBeat: [], beat: null, wrong: 0, right: 0, offered: null }; views.set(lessonId, v); }
  return v;
}
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
  const turnSeq = Number(x.prev?.turn ?? x.state?.turn ?? 0) + 1;
  const beat = x.prev?.beat?.type ?? "explain";
  if (beat !== v.beat) { v.shownBeat = []; v.beat = beat; }
  const kind = !x.moduleOnly ? requestFromText(x.childText ?? "") : null;
  if (kind) v.request = { kind, seq: turnSeq };
  const mis = x.misconception ?? null;
  if (mis?.state === "active" && v.revealedAt[mis.id] == null) v.revealedAt[mis.id] = turnSeq - 1;
  const band = { 1: "B1", 2: "B1", 3: "B2", 4: "B2", 5: "B3", 6: "B3", 7: "B4", 8: "B4", 9: "B4" }[x.child?.class_level] ?? "B3";
  const lang = { hi: "hi", en: "en" }[x.child?.language_pref] ?? "hinglish";
  const topicId = x.lesson.topic_id;
  const skillId = x.kit?.skills?.[0]?.id ?? `${topicId}-s1`;
  return revealPoint({ lessonId: x.lesson.id, turnSeq, safety: !!x.safety, beat, beatChanged: v.shownBeat.length === 0, topicId, skillId, classLevel: x.child?.class_level,
    band, lang, kitHash: String(x.kit?.version ?? x.kit?.topicId ?? "kit"), misconception: mis ? { ...mis, revealedTurn: v.revealedAt[mis.id] ?? null } : null,
    contrasted: v.contrasted, request: v.request, offerAccepted: null, board: { onStage: v.onStage, wrongCount: v.wrong, complete: v.right >= 3 }, signal: x.signal ?? {},
    lastPolicyRevealTurn: v.lastReveal, shownThisBeat: v.shownBeat, phase: "committed", at: x.now ?? Date.now() }, { catalog: host.cfg.catalog });
}

/** After the point: the kernel records what the stage now shows (the same rules the simulator's kernel uses). */
export function noteOutcome(lessonId, point, outcome) {
  const v = kernelView(lessonId), want = point?.want;
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
