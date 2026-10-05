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
