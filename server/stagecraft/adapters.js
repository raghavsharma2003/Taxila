// Adapters from the systems Stagecraft plugs into (STAGECRAFT.md §5) to its inputs, written so that NO existing file has
// to change for the read side. The write side (the seam asking for an outcome, the governor mirroring its phase, the
// kernel building the RevealPoint) is in docs/design/stagecraft/patches/.
//
//   duplex       BuildIntents already takes an injected `launch`; buildIntentLauncher() turns every fired job into
//                nominations and returns null, so nothing is pushed into RevealQueue (prefetch-only rule kept).
//                watchSafety() wraps one BuildIntents instance's onSafety() to open the quarantine (seam P1 does the same
//                inside the file once applied).
//   signals      signalReading() projects a shared/signals.ts frame (stepState {s}, verifyDue {why}, ...) to SignalReading.
//   Wave 2       candidateIntents rows → plan nominations; requestIntent (RS-4 item 09) → child_request;
//                outcomeToView() / outcomeToSlot() map a RevealOutcome to StudioTurnView fields and UiDirectives.studioSlot.
//   RS-4         the instant rung uses validateSpec; grading stays gradeAnswer on the host (builders.js).
import { fromBuildIntent, fromCandidateIntents, fromPlan, fromRequest, fromSignal, requestFromText } from "./sources.js";
import { wantAt } from "./policy.js";

/**
 * @param {import("./host.js").StagecraftHost} host
 * @param {() => { skillId: string, topicId: string, nextTrpAt?: number, now?: number }} ctx
 * @returns {(job: object, now: number) => null}  pass as `new BuildIntents({ launch })`
 */
export function buildIntentLauncher(host, ctx) {
  return (job, now) => {
    const c = { ...ctx(), now: now || host.clock() };
    for (const n of fromBuildIntent(job, c)) host.input({ t: "nominate", n });
    return null;                                  // SILENT: a nomination never reaches RevealQueue or the screen
  };
}
/** Wrap one BuildIntents instance so its safety stop also quarantines the Stagecraft pool (L6). */
export function watchSafety(buildIntents, host) {
  const orig = buildIntents.onSafety.bind(buildIntents);
  buildIntents.onSafety = () => { orig(); host.input({ t: "safety", open: true, at: host.clock() }); };
  return buildIntents;
}
/** Child words (echo-subtracted, server side) → a child_request nomination when the stage lexicon fires. */
export function requestFromWords(host, text, ctx) {
  const kind = requestFromText(text);
  if (!kind) return null;
  for (const n of fromRequest(kind, { ...ctx, now: ctx.now ?? host.clock() })) host.input({ t: "nominate", n });
  return kind;
}
/** shared/signals.ts frame → SignalReading (licences only). */
export function signalReading(frame) {
  if (!frame) return { abstain: true };
  return {
    stepState: frame.stepState?.s ?? null,
    verifyDue: !!frame.verifyDue,
    choiceDue: !!frame.choiceDue,
    breakDue: !!frame.breakDue,
    curious: frame.curious ?? null,
  };
}
export function feedSignal(host, frame, ctx) {
  const reading = signalReading(frame);
  host.input({ t: "signal", reading, at: host.clock() });
  for (const n of fromSignal(reading, { ...ctx, now: host.clock() })) host.input({ t: "nominate", n });
}
export function feedPlan(host, plan) { for (const n of fromPlan(plan, host.clock())) host.input({ t: "nominate", n }); }
export function feedCandidateIntents(host, rows, clockMs) { for (const n of fromCandidateIntents(rows, { now: host.clock(), clockMs })) host.input({ t: "nominate", n }); }
/** RS-4 item 09: StageRequest { source: "child_request", kind } → nomination. */
export function feedStageRequest(host, req, ctx) {
  const kind = req.kind === "game" ? "game_request" : req.kind === "animation" ? "animation_request" : req.kind === "explain_differently" ? "explain_differently" : "visual_request";
  for (const n of fromRequest(kind, { ...ctx, now: host.clock() })) host.input({ t: "nominate", n });
}

/** RevealOutcome → the StudioTurnView fields the seam adds (facts row only for what is revealed with her line). */
export function outcomeToView(outcome) {
  if (!outcome) return {};
  if (outcome.act === "reveal") return { revealing: stripFacts(outcome.facts), propose: { reveal: outcome.candidateId } };
  if (outcome.act === "board") return { revealing: stripFacts(outcome.facts), propose: { reveal: outcome.facts.candidateId } };
  return {};
}
const stripFacts = (f) => ({ kind: f.kind, archetype: f.archetype, onScreen: { ...(f.onScreen ?? {}) }, ...(f.itemId ? { itemId: f.itemId } : {}) });

/**
 * RevealOutcome + the candidate's payload → UiDirectives.studioSlot. Engine rungs mount through src/stagecraft (the
 * Studio v2 host); the board rung is the whiteboard artifact. Never a loading or failed state (DESIGN-V3 §6.9).
 */
export function outcomeToSlot(outcome, candidate) {
  if (!outcome || (outcome.act !== "reveal" && outcome.act !== "board")) return null;
  if (outcome.act === "board") return { slotId: outcome.facts.candidateId, state: "revealed", stagecraft: { rung: "board", board: candidate?.boardTwin ?? null } };
  const p = candidate?.payload ?? {};
  return { slotId: outcome.candidateId, state: "revealed",
    stagecraft: { rung: outcome.rung, archetype: p.archetype ?? candidate?.archetype, spec: p.spec ?? null, boardTwin: outcome.boardTwin ?? candidate?.boardTwin ?? null, cue: outcome.cue,
      buildSha: p.buildSha ?? null, blobUrl: p.blobUrl ?? null } };
}

/**
 * The kernel side (patch P4): the RevealPoint for this turn from closed-vocabulary turn state. The policy's want is
 * computed HERE from the kernel's view only (wantAt reads no portfolio: the lossless rule). Called once per turn,
 * before studioSeam.statusFacts; ≤ 0.1 ms.
 * @param {{ lessonId: string, turnSeq: number, phase?: string, childHoldsFloor?: boolean, safety: boolean, beat: string, beatChanged?: boolean,
 *   topicId: string, skillId: string, classLevel?: number, band: string, lang: string, kitHash: string, itemId?: string|null, hintRung?: number,
 *   misconception?: { id: string, state: "active"|"resolved"|"unknown", revealedTurn?: number|null } | null, contrasted?: string[],
 *   request?: { kind: string, seq: number } | null, offerAccepted?: string | null, board?: object | null, signal?: object | null,
 *   lastPolicyRevealTurn?: number, shownThisBeat?: string[], learnerRev?: number, namingClause?: number | null, committed?: Record<string, unknown>, at: number }} x
 * @param {{ catalog: object }} cfg
 */
/** The rest rule's production constants (policy.js restIsDue / restRetire; measured in sim arm sc_rest, 2026-10-06). */
export const REST_CFG = Object.freeze({ restShare: 0.5, restGraceMs: 120_000, restRetireTurns: 4, visualFloorMs: 150_000, boardOwnsExplain: true });
export function revealPoint(x, cfg) {
  const current = { lessonId: x.lessonId, topicId: x.topicId, skillId: x.skillId, beat: x.beat, itemId: x.itemId ?? null, misconceptionId: x.misconception?.id ?? null,
    misconceptionState: x.misconception?.state ?? "unknown", hintRung: x.hintRung ?? 0, representation: null, band: x.band, lang: x.lang, kitHash: x.kitHash,
    learnerRev: x.learnerRev ?? 0, floorRev: x.turnSeq, pending: [] };
  const kind = x.request ? "request_answered" : x.beatChanged ? "beat_boundary" : "trp";
  const want = wantAt({ pointKind: kind, turnSeq: x.turnSeq, beat: x.beat, beatChanged: x.beatChanged, skillId: x.skillId, topicId: x.topicId, classLevel: x.classLevel,
    misconception: x.misconception ?? null, contrasted: x.contrasted ?? [], request: x.request ?? null, offerAccepted: x.offerAccepted ?? null, board: x.board ?? null,
    signal: x.signal ?? {}, lastPolicyRevealTurn: x.lastPolicyRevealTurn, safety: x.safety, shownThisBeat: x.shownThisBeat ?? [],
    // ship5 p4-content: the rest rule and the 3-minute visual floor (inert when the caller passes none)
    busyShare: x.busyShare, teachingMs: x.teachingMs, lastVisualAgoMs: x.lastVisualAgoMs, inFlow: x.inFlow },
  { catalog: cfg.catalog, swapSpacingTurns: 2, firstRevealTurn: 3, ...REST_CFG });
  return { kind, phase: x.phase ?? "committed", turnSeq: x.turnSeq, current, want, safetyOpen: !!x.safety, childHoldsFloor: !!x.childHoldsFloor, at: x.at,
    rest: { busyShare: x.busyShare, teachingMs: x.teachingMs, lastVisualAgoMs: x.lastVisualAgoMs, inFlow: x.inFlow, board: x.board ?? null },
    requestKind: x.request?.kind ?? null,
    ...(x.namingClause !== undefined ? { line: { namingClause: x.namingClause } } : {}), committed: x.committed ?? {} };
}
