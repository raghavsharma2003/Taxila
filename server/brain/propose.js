// The turn's proposers, gathered for the kernel (TEACHER-BRAIN §5.1 stage 3, §10; BUILD-PLAN W2-E #2 "kernel arbitration
// live with today's proposers"). Every component reaches the turn ONLY as typed proposals; nothing here decides. Pure.
//   director       the Director's move (director/proposal.js, W2-C #8): exactly one move per turn, so it is mandatory
//                  within its rank; a safeguard move is the safety floor and freezes everything below it
//   comprehension  a probe rides inside the Director's move today (source "comprehension" when the move is a probe)
//   relational     W2-I's directive, split by relational-adapter.js (BR5)
//   studio         W2-H's statusFacts().propose (reveal / highlight / retire / setParam), and the whiteboard ask on an
//                  explanation beat (owner priority 6)
//   vibe           the persona knobs (recorded; they reach the client as `pace` and the compile as the VIBE row)
// The conductor guard (caps, bedtime, wrapAt) has no per-turn proposer yet: the Director's own minutes wrap carries it.
import { AUTHORITY, proposal } from "./kernel.js";
import { relationalProposals } from "./relational-adapter.js";
import { EXPLAIN_BEATS } from "./beat.js";
import { BANDS } from "../learner/bands.js";

/** The Director's proposal with the kernel's turn rules: one move (mandatory in its rank), safety freezes the rest. */
export function directorProposalOf(r) {
  const base = r?.proposal ?? proposal("director", "move", AUTHORITY.director, { payload: { move: { ...(r?.move ?? { kind: "repair" }) } }, reason: [`move.${r?.move?.kind ?? "repair"}`] });
  const safety = base.source === "safety";
  return { ...base, mandatory: true, ...(safety ? { vetoes: ["*"] } : {}) };
}

/** Studio's proposals for this turn from W2-H's turn view (TurnStudio actions). */
export function studioProposalsOf(view) {
  const p = view?.propose;
  if (!p || typeof p !== "object") return [];
  const out = [];
  if (p.reveal) out.push(proposal("studio", "reveal", AUTHORITY.studio, { payload: { reveal: String(p.reveal) }, costs: { attention: 1, novelty: 1 }, reason: ["studio.reveal"] }));
  if (p.highlight) out.push(proposal("studio", "highlight", AUTHORITY.studio, { payload: { highlight: String(p.highlight) }, reason: ["studio.highlight"] }));
  if (p.retire) out.push(proposal("studio", "retire", AUTHORITY.studio, { payload: { retire: String(p.retire) }, urgency: 1, reason: ["studio.retire"] }));
  if (p.setParam && typeof p.setParam === "object") out.push(proposal("studio", "set_param", AUTHORITY.studio, { payload: { setParam: p.setParam }, reason: ["studio.set_param"] }));
  return out;
}

/** The accepted Studio actions, as the wire's TurnStudio (absent when none). */
export function turnStudioOf(arb) {
  const acc = (arb?.accepted ?? []).filter((p) => p.source === "studio");
  const out = {};
  for (const p of acc) {
    if (p.kind === "reveal") out.reveal = p.payload.reveal;
    if (p.kind === "highlight") out.highlight = p.payload.highlight;
    if (p.kind === "retire") out.retire = p.payload.retire;
    if (p.kind === "set_param") out.setParam = p.payload.setParam;
  }
  return Object.keys(out).length ? out : null;
}

/** The moves that open or carry an explanation: only they ask Studio for the live board (not a repair or a hint inside one). */
export const WHITEBOARD_MOVES = Object.freeze(new Set(["explain", "worked_example", "reteach", "recap"]));
/** The Director's template whiteboard rung (W2-B, director/modules.js rungs 4-5): the live board replaces it, never adds. */
export const RUNG_ENGINE = "explainer@1";

/**
 * The whiteboard ask (owner priority 6; LIVE-STUDIO whiteboard slot): on an explanation beat, Studio is asked to draw
 * the explanation as a timed drawing script in sync with her line. A proposal, so the kernel can refuse it. It is not
 * proposed: on a move that does not explain (a repair, a hint or a module turn inside the beat), during strain (a
 * struggling child gets smaller steps, not a new thing to watch; TEACHER-BRAIN §6.3 step 2), on the voice lane (the
 * realtime model's words are not known before it speaks), for a late answer, while an interactive Studio piece is on
 * screen (never pull a game away from a child using it: requestIntent's own refusal rule), or when Studio proposes a
 * reveal this turn (the piece made for this beat wins).
 * It needs the attention slot (nothing else new on screen), EXCEPT when the Director's only new thing is its template
 * whiteboard rung (`rungMounted`): the live board is then the explanation surface and the rung its fallback, so the ask
 * costs no attention and carries `replacesRung` (turn.js drops the rung once Studio acks; a refusal keeps it).
 * Returns { proposals, declined } (the reason code for the trace when nothing was proposed).
 */
export function whiteboardAskOf({ beat, lane, late, strained, move = null, studioView = null, rungMounted = false, requested = false }) {
  // `requested` (owner-truth patch 09, F16; OWNER TEST 2026-10-04 item 5): the CHILD asked to see it (director/requests.js
  // visual → move.visual). Their ask is honoured on any beat, on the voice lane, and when strained (a picture is their
  // smaller step). W2-H's attention and reveal gates below still hold: an interactive piece mid-use is never pulled away.
  if (!requested && (!beat || !EXPLAIN_BEATS.has(beat.type))) return { proposals: [], declined: null };
  if (late) return { proposals: [], declined: "studio_rejected.late" };
  if (move && !WHITEBOARD_MOVES.has(move.kind)) return { proposals: [], declined: "studio_rejected.not_explain" };
  if (!requested && lane === "voice") return { proposals: [], declined: "studio_rejected.voice_lane" };
  if (!requested && strained) return { proposals: [], declined: "studio_rejected.strained" };
  const on = studioView?.onScreen;
  const interactive = !!on && typeof on.kind === "string" && on.kind !== "whiteboard" && on.archetype !== "whiteboard";
  if (interactive && !studioView?.propose?.retire) return { proposals: [], declined: "studio_rejected.attention" };
  if (studioView?.propose?.reveal) return { proposals: [], declined: "studio_rejected.reveal_ready" };
  return {
    proposals: [proposal("studio", "ask_whiteboard", AUTHORITY.studio, { payload: { beat: beat?.type ?? "explain", beatId: beat?.id ?? null, ...(rungMounted ? { replacesRung: true } : {}), ...(requested ? { requested: true } : {}) },
      urgency: requested ? 3 : 2, costs: { attention: rungMounted ? 0 : 1 }, reason: ["studio.whiteboard_asked", requested ? "child.asked_visual" : `beat.${beat.type}`, ...(rungMounted ? ["studio.replaces_rung"] : [])] })],
    declined: null,
  };
}

/** Vibe's proposal: the knobs this turn runs on (recorded; attention 0). */
export function vibeProposalOf(vibe) {
  if (!vibe) return [];
  return [proposal("vibe", "knobs", AUTHORITY.vibe, { payload: { waitNudgeSec: vibe.waitNudgeSec ?? null, endpointSilenceMs: vibe.endpointSilenceMs ?? null } })];
}

/** Every proposal of the turn. */
export function proposalsOf({ r, relational, studioView, whiteboard, vibe }) {
  return [directorProposalOf(r), ...relationalProposals(relational), ...studioProposalsOf(studioView), ...(whiteboard ?? []), ...vibeProposalOf(vibe)];
}

const STUDIO_LANG = { hinglish: "hinglish", english: "en", hindi: "hi" };
/**
 * The whiteboard ask for Studio (shared/brain.ts StudioAsk → server/studio/seam.js requestIntent, W2-H; the drawing-script
 * planner is W2-F's archetype; the renderer is W2-B's). It carries the guarded line she is about to speak and the kit
 * content the move was written from; never the child's id or words, never the answer of an item still to be asked.
 * `mode` is "continue" while the same explanation beat goes on (a worked example drawn across turns), else "fresh".
 * @returns {import("../../shared/brain").StudioAsk}
 */
export function whiteboardIntentOf({ lessonId, turn, beat, next, kit, item, line }) {
  const band = BANDS[next?.ctx?.classLevel]?.b4 ?? "B3"; // the one bands table (BUILD-PLAN §1.10)
  const mis = beat.type === "contrast" && next?.lastReteach?.turn === next?.turn ? next.lastReteach.misId ?? null : null;
  const skillId = next?.lastMove?.skillId ?? item?.skillId ?? kit?.skills?.[0]?.id ?? "";
  return {
    intent: {
      intentId: `${lessonId}:wb:${turn}`, lessonId, kind: "whiteboard", skillId, ...(item?.id ? { itemIds: [item.id] } : {}),
      need: mis ? "contrast_misconception" : "explain", ...(mis ? { misconceptionId: mis } : {}), beat: beat.type, neededAtMs: 0, priority: "on_cue",
      style: { band, lang: STUDIO_LANG[next?.ctx?.lang] ?? "hinglish", motion: band === "B1" ? "calm" : "lively" },
    },
    line: { lessonId, ...(line.teacherReplySeq != null ? { teacherReplySeq: line.teacherReplySeq } : {}), text: String(line.text ?? "") },
    mode: next?.wbBeat === beat.id ? "continue" : "fresh",
    kit: { topicId: kit?.topicId ?? next?.topicId ?? "", ...(next?.kitHash ? { kitHash: next.kitHash } : {}),
      content: (next?.lastContent ?? []).map((x) => String(typeof x === "string" ? x : JSON.stringify(x))).slice(0, 8),
      ...(item ? { item: { id: item.id, prompt_en: item.prompt_en ?? "", prompt_hi: item.prompt_hi ?? "" } } : {}),
      ...(next?.module ? { onScreen: true } : {}) },
  };
}
