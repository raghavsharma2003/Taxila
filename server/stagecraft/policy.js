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

/** Beats whose visual is the live whiteboard when cfg.boardOwnsExplain (ship5 p4-content). */
export const BOARD_BEATS = Object.freeze(["explain", "worked_example", "recap"]);

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
  // REVIEW 2026-10-05: a piece of another skill still on stage (the topic changed under it) is stale: it is treated as
  // absent and its replacement is exempt from spacing, so the old topic never stays up while she teaches the new one.
  const onRaw = x.board?.onStage ?? null;
  const staleOn = !x.beatOnly && !!onRaw && String(onRaw.family).split("|")[0] !== x.skillId;
  const on = staleOn ? null : onRaw;
  const spacing = x.beatOnly ? 4 : (cfg.swapSpacingTurns ?? 2);
  const spaced = x.turnSeq >= (cfg.firstRevealTurn ?? 3) && (staleOn || x.turnSeq - (x.lastPolicyRevealTurn ?? -99) >= spacing);
  // an accepted offer is honoured only for this skill's idea
  if (x.offerAccepted && String(x.offerAccepted).split("|")[0] !== x.skillId) x = { ...x, offerAccepted: null };
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

  // 0. ship5 p4-content: the child asked for the BOARD: the live whiteboard answers on her line; no piece competes with it
  if (x.request?.kind === "board_request") return null;
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
  // ship5 p4-content: the REST rule (decision stagecraft-integration-decisions-2026-10-05: busy share <= 55%). Plan-,
  // signal- and curiosity-led pieces wait while the stage has been busy for >= restShare of the teaching time so far; a
  // child's request, a steer, a board reteach and a misconception contrast are exempt (each answers the child now).
  // The FREQUENCY floor (VALUES-100 V3.3: >= 1 visual every 3 min unless the child is in flow): when nothing has been on
  // stage for visualFloorMs, the beat's own idea may come back even if it was shown earlier in this beat. Both rules are
  // inert when the caller passes no busyShare / lastVisualAgoMs (the 2026-10-05 sim and tests are unchanged).
  const restDue = restIsDue(x, cfg);
  const floorDue = !on && !x.inFlow && Number.isFinite(x.lastVisualAgoMs) && x.lastVisualAgoMs >= (cfg.visualFloorMs ?? 150_000);
  // the beat's own family (used for hot-swap of the same idea even inside the spacing window)
  const beatNeed = BEAT_NEED[x.beat];
  const beatMis = beatNeed === "contrast_misconception" ? (x.misconception?.state === "active" ? x.misconception.id : null) : null;
  const beatFamily = beatNeed ? familyKey(x.skillId, beatNeed, beatMis, null) : null;
  if (!spaced) {
    if (on && beatFamily && on.family === beatFamily) return W({ origin: "plan_lookahead", family: beatFamily, need: beatNeed, kinds: BEAT_KINDS[x.beat] ?? KINDS_FOR_NEED[beatNeed], pNeed: 0.9, archetype: on.archetype, swapOnly: true });
    return null;
  }
  // (4 is exempt from rest: a contrast answers what the child just revealed)
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
  if (restDue && !floorDue) return null;
  // ship5 p4-content: explanation beats are the live whiteboard's (owner priority 6: drawn on her words, re-gated against
  // her line, synced to her audio). A plan-led piece there would decline the board (propose.js reveal_ready) and talk over
  // her explanation; the cinematic explainer comes when the child asks, as a re-representation, or on a re-teach.
  if (cfg.boardOwnsExplain && BOARD_BEATS.includes(x.beat) && !floorDue) return null;
  const repaired = beatNeed === "contrast_misconception" && !beatMis && (x.contrasted ?? []).some((m) => m.startsWith(x.topicId));
  // (a family already shown in this beat and retired by the seam is not shown again: no ping-pong after a retire)
  if (beatNeed && !repaired && (floorDue || !(x.shownThisBeat ?? []).includes(beatFamily)) && (x.pointKind === "beat_boundary" || x.beatChanged || !on || on.family !== beatFamily)) {
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

/**
 * The rest rule's gate (ship5 p4-content). Due when the stage has been busy for at least `restShare` of the teaching time
 * so far, once at least `restGraceMs` of teaching has passed (the share is meaningless in the first minutes).
 * @param {{ busyShare?: number, teachingMs?: number }} x @param {{ restShare?: number, restGraceMs?: number }} cfg
 */
export function restIsDue(x, cfg = {}) {
  if (!Number.isFinite(x?.busyShare)) return false;
  if ((x.teachingMs ?? Infinity) < (cfg.restGraceMs ?? 120_000)) return false;
  return x.busyShare >= (cfg.restShare ?? 0.5);
}

/**
 * Should the piece on stage step down so the stage rests (ship5 p4-content)? When rest is due, a piece that has been up
 * for at least `restRetireTurns` turns and is not in use this turn (no answer on it in the child's last turn) retires to
 * the calm stage; her voice carries the lesson until the share falls. Never during a safeguard (the seam already froze it).
 * @param {{ busyShare?: number, teachingMs?: number, safety?: boolean, turnSeq: number, board?: { onStage?: { revealedTurn: number } | null, answeredThisTurn?: boolean } }} x
 */
export function restRetire(x, cfg = {}) {
  const on = x?.board?.onStage;
  if (!on || x.safety || x.board?.answeredThisTurn) return false;
  if (!restIsDue(x, cfg)) return false;
  return x.turnSeq - (on.revealedTurn ?? x.turnSeq) >= (cfg.restRetireTurns ?? 4);
}
