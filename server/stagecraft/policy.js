// The CODE POLICY's want (STAGECRAFT.md §4.2 step 3, §4.5): what idea the stage should show at a reveal point, decided
// from the same inputs the kernel and Director use today (beat, misconception ledger, request, board outcome, signals)
// and NEVER from the portfolio. That is the lossless rule (L1/SC-1): speculation changes when a piece is ready, never
// which piece is chosen. This module is the reference implementation patch P4 wires into server/brain/turn.js; the
// kernel may replace it, but its input type must stay portfolio-free (the shadow arm of E-ST1 proves it).
//
// Precedence (§4.5): safety → child request (newest) → steer → board reteach (≥ 2 wrong) → misconception contrast →
// beat plan → signal-led re-represent / switch / verify → curiosity. Pure; no clock read; no model call (B6).
import { BEAT_KINDS, BEAT_NEED, KINDS_FOR_NEED, NO_STAGE_BEATS } from "./config.js";
import { admissible, liveArchetypes } from "./catalog.js";
import { familyKey, REQUEST_SHAPE } from "./sources.js";

/**
 * @typedef {{
 *   pointKind: "trp"|"beat_boundary"|"request_answered", turnSeq: number, beat: string, beatChanged?: boolean,
 *   skillId: string, topicId: string, classLevel?: number,
 *   misconception?: { id: string, state: "active"|"resolved"|"unknown", revealedTurn?: number | null } | null, contrasted?: string[],
 *   request?: { kind: string, seq: number } | null, offerAccepted?: string | null,
 *   board?: { onStage: { family: string, archetype: string, kind: string, revealedTurn: number } | null, wrongCount?: number, complete?: boolean, steer?: string | null },
 *   signal?: { stepState?: string|null, verifyDue?: boolean, choiceDue?: boolean, curious?: { depth: string } | null },
 *   lastPolicyRevealTurn?: number, safety?: boolean, beatOnly?: boolean, shownThisBeat?: string[], prefetched?: string[],
 * }} PolicyInput
 */

function pick(catalog, { topicId, misconceptionId, kinds, exclude = [], contrast = false, planned = false, preferLive = false }) {
  if (planned && preferLive) { const l = liveArchetypes(catalog, topicId, kinds); if (l.length) return l[0].archetype; }
  let a = admissible(catalog, { topicId, misconceptionId, kinds, exclude, requireMisconception: contrast });
  if (!a.length && contrast) a = admissible(catalog, { topicId, misconceptionId: null, kinds, exclude });
  if (a.length) return a[0].archetype;
  if (planned) { const l = liveArchetypes(catalog, topicId, kinds); if (l.length) return l[0].archetype; }
  return null;
}

/** @param {PolicyInput} x @param {{ catalog: object, swapSpacingTurns?: number, firstRevealTurn?: number }} cfg @returns {import("../../shared/stagecraft").StageWant | null} */
export function wantAt(x, cfg) {
  if (x.safety) return null;
  if (NO_STAGE_BEATS.includes(x.beat)) return null;
  const catalog = cfg.catalog;
  const on = x.board?.onStage ?? null;
  const spacing = x.beatOnly ? 4 : (cfg.swapSpacingTurns ?? 2);
  const spaced = x.turnSeq >= (cfg.firstRevealTurn ?? 3) && x.turnSeq - (x.lastPolicyRevealTurn ?? -99) >= spacing;
  const W = (o) => ({ childRequested: false, archetype: null, ...o });

  // W2 today: beat-only, one piece per beat boundary, no request / signal / misconception-led wants
  if (x.beatOnly) {
    if (x.pointKind !== "beat_boundary" || !spaced) return null;
    const need = BEAT_NEED[x.beat];
    if (!need) return null;
    const mis = need === "contrast_misconception" ? x.misconception?.id ?? null : null;
    const kinds = BEAT_KINDS[x.beat] ?? KINDS_FOR_NEED[need];
    return W({ origin: "plan_lookahead", family: familyKey(x.skillId, need, mis, null), need, kinds, pNeed: 0.9, archetype: pick(catalog, { topicId: x.topicId, misconceptionId: mis, kinds, contrast: !!mis, planned: true, preferLive: (x.prefetched ?? []).includes(familyKey(x.skillId, need, mis, null)) }) });
  }

  // 1. the child's request (newest), exempt from spacing and from the first-reveal turn
  if (x.request) {
    const shape = REQUEST_SHAPE[x.request.kind];
    if (shape) {
      const mis = shape.need === "re_represent" ? x.misconception?.id ?? null : null;
      const exclude = shape.need === "re_represent" && on ? [on.archetype] : [];
      return W({ origin: "child_request", family: familyKey(x.skillId, shape.need, mis, null), need: shape.need, kinds: shape.kinds, pNeed: 1, childRequested: true,
        archetype: pick(catalog, { topicId: x.topicId, misconceptionId: mis, kinds: shape.kinds, exclude }) });
    }
  }
  // 2. a steering word on the running piece: a knob, no new piece
  if (x.board?.steer && on) return W({ origin: "board_state", family: on.family, need: "practice", kinds: [on.kind], pNeed: 1, archetype: on.archetype, steer: { knob: x.board.steer, value: 1 } });
  // an accepted offer ("haan dikhao") is a request for that family
  if (x.offerAccepted) {
    const [, need, m] = x.offerAccepted.split("|");
    const kinds = KINDS_FOR_NEED[need] ?? ["animation"];
    return W({ origin: "child_request", family: x.offerAccepted, need, kinds, pNeed: 1, childRequested: true, archetype: pick(catalog, { topicId: x.topicId, misconceptionId: m === "-" ? null : m, kinds }) });
  }
  // 3. board reteach: ≥ 2 wrong on the piece on stage → the same item another way (exempt from spacing: the child is stuck now)
  if (on && (x.board?.wrongCount ?? 0) >= 2) {
    const mis = x.misconception?.state === "active" ? x.misconception.id : null;
    return W({ origin: "board_state", family: familyKey(x.skillId, "re_represent", mis, null), need: "re_represent", kinds: KINDS_FOR_NEED.re_represent, pNeed: 0.8,
      archetype: pick(catalog, { topicId: x.topicId, misconceptionId: mis, kinds: KINDS_FOR_NEED.re_represent, exclude: [on.archetype] }) });
  }
  // the beat's own family (used for hot-swap of the same idea even inside the spacing window)
  const beatNeed = BEAT_NEED[x.beat];
  const beatMis = beatNeed === "contrast_misconception" ? (x.misconception?.state === "active" ? x.misconception.id : null) : null;
  const beatFamily = beatNeed ? familyKey(x.skillId, beatNeed, beatMis, null) : null;
  if (!spaced) {
    if (on && beatFamily && on.family === beatFamily) return W({ origin: "plan_lookahead", family: beatFamily, need: beatNeed, kinds: BEAT_KINDS[x.beat] ?? KINDS_FOR_NEED[beatNeed], pNeed: 0.9, archetype: on.archetype, swapOnly: true });
    return null;
  }
  // 4. a misconception revealed THIS lesson and not contrasted yet: probe first, contrast at the next point (the turn after
  //    it was revealed she asks why; the contrast piece comes with her next line). A misconception known from earlier
  //    sessions waits for the contrast beat (step 5).
  if (x.misconception?.state === "active" && x.misconception.revealedTurn != null && x.misconception.revealedTurn < x.turnSeq && !(x.contrasted ?? []).includes(x.misconception.id)) {
    const kinds = KINDS_FOR_NEED.contrast_misconception;
    return W({ origin: "partial_intent", family: familyKey(x.skillId, "contrast_misconception", x.misconception.id, null), need: "contrast_misconception", kinds, pNeed: 0.85,
      archetype: pick(catalog, { topicId: x.topicId, misconceptionId: x.misconception.id, kinds, contrast: true }) });
  }
  // 5. the beat plan (a new beat, or a beat with nothing of its own on stage yet). A contrast beat with no active
  //    misconception shows a (kit) contrast only to a child who never had one on this topic: a child who already
  //    repaired theirs is not shown the contrast again.
  const repaired = beatNeed === "contrast_misconception" && !beatMis && (x.contrasted ?? []).some((m) => m.startsWith(x.topicId));
  // (a family already shown in this beat and retired by the seam is not shown again: no ping-pong after a retire)
  if (beatNeed && !repaired && !(x.shownThisBeat ?? []).includes(beatFamily) && (x.pointKind === "beat_boundary" || x.beatChanged || !on || on.family !== beatFamily)) {
    const kinds = BEAT_KINDS[x.beat] ?? KINDS_FOR_NEED[beatNeed];
    if (!(on && on.family === beatFamily)) return W({ origin: "plan_lookahead", family: beatFamily, need: beatNeed, kinds, pNeed: 0.9, archetype: pick(catalog, { topicId: x.topicId, misconceptionId: beatMis, kinds, contrast: !!beatMis, planned: true }) });
  }
  // 6. signal-led
  const s = x.signal ?? {};
  if (s.stepState === "stuck_unproductive") {
    const mis = x.misconception?.state === "active" ? x.misconception.id : null;
    return W({ origin: "child_signal", family: familyKey(x.skillId, "re_represent", mis, null), need: "re_represent", kinds: KINDS_FOR_NEED.re_represent, pNeed: 0.75,
      archetype: pick(catalog, { topicId: x.topicId, misconceptionId: mis, kinds: KINDS_FOR_NEED.re_represent, exclude: on ? [on.archetype] : [] }) });
  }
  if (s.choiceDue) {
    const kinds = KINDS_FOR_NEED.switch_modality.filter((k) => !on || k !== on.kind);
    return W({ origin: "child_signal", family: familyKey(x.skillId, "switch_modality", null, null), need: "switch_modality", kinds, pNeed: 0.7, archetype: pick(catalog, { topicId: x.topicId, kinds, exclude: on ? [on.archetype] : [] }) });
  }
  if (s.verifyDue) return W({ origin: "child_signal", family: familyKey(x.skillId, "verify", null, null), need: "verify", kinds: KINDS_FOR_NEED.verify, pNeed: 0.7,
    archetype: pick(catalog, { topicId: x.topicId, kinds: KINDS_FOR_NEED.verify, exclude: on ? [on.archetype] : [] }) });
  // 7. curiosity: an offer-range want (her line asks first); classes 4-5 get instruction-first kinds
  if (s.curious && s.curious.depth !== "what") {
    const kinds = (x.classLevel ?? 6) <= 5 ? ["animation", "simulation"] : KINDS_FOR_NEED.explore_question;
    return W({ origin: "child_signal", family: familyKey(x.skillId, "explore_question", null, null), need: "explore_question", kinds, pNeed: 0.55, archetype: pick(catalog, { topicId: x.topicId, kinds }) });
  }
  return null;
}
