// Stagecraft ↔ Wave 2 seam bridge (STAGECRAFT.md §5.2, patch P3). The seam (server/studio/seam.js) stays the ONLY door
// into the lesson and keeps its contract (synchronous, ≤ 1 ms, never throws, pieces invisible until revealed). This
// module holds everything Stagecraft adds to it, so the patch to seam.js is a handful of guarded call lines:
//
//   statusFacts(lessonId, hint)  → … view = augmentView(lessonId, view, hint?.stagecraftPoint)   (P3)
//   slotOf(p, state)             → if (p.source === "stagecraft") return stagecraftSlot(p, state)  (P3)
//   onReveal(ev)                 → noteRevealed(lessonId, ev.studio.reveal)                         (P3)
//   retirePiece / onSafety       → noteRetired(lessonId) / noteSafety(lessonId, open)              (P3)
//
// When Stagecraft is on for a lesson it OWNS the stage proposal: Wave 2's own clock-and-beat proposal is replaced by
// the reveal policy's outcome (a hold removes it). In shadow mode the outcome is computed and logged, and the W2 view
// is returned untouched. Off (no host attached) = byte-identical W2 behaviour.
import { _lesson } from "../studio/seam.js";

const hosts = new Map();
let outcomeHook = null;
/** kernel-point.js registers its noteOutcome here (the kernel's own stage view; no import cycle). */
export const setOutcomeHook = (f) => { outcomeHook = f; };

/** @param {string} lessonId @param {import("./host.js").StagecraftHost} host */
export function attach(lessonId, host) { hosts.set(lessonId, host); return host; }
export function detach(lessonId) { const h = hosts.get(lessonId); hosts.delete(lessonId); h?.close?.(); }
export const hostFor = (lessonId) => hosts.get(lessonId) ?? null;

/**
 * statusFacts' tail. `point` is the RevealPoint the kernel built for this turn (patch P4: the current ValidityKey and
 * the policy's StageWant). Returns the view to use.
 * @param {string} lessonId @param {import("../../shared/studio").StudioTurnView | null} view @param {import("../../shared/stagecraft").RevealPoint | null} point
 */
export function augmentView(lessonId, view, point) {
  const host = hosts.get(lessonId);
  if (!host || !point) return view;
  let outcome = null, decided = null;
  try { ({ decided, shown: outcome } = host.decide(point)); } catch { return view; }       // never throws into the turn
  // REVIEW 2026-10-05: the kernel's stage view tracks the DECIDED outcome in shadow too; before, shadow never updated
  // it (onStage null, lastReveal -99 forever) so shadow-mode wants would not be the wants "on" would make
  try { outcomeHook?.(lessonId, point, decided); } catch { /* the kernel view is advisory */ }
  if (host.mode !== "on") return view;                                 // shadow: decided and logged, never shown
  const L = _lesson(lessonId);
  const out = { statuses: view?.statuses ?? [], onScreen: view?.onScreen ?? null, ...(view?.outcome ? { outcome: view.outcome } : {}), ...(view?.suggest ? { suggest: view.suggest } : {}) };
  if (!outcome || (outcome.act !== "reveal" && outcome.act !== "board")) {
    // a hold / offer / steer: no new piece; a retire Wave 2 proposed still stands
    if (view?.propose?.retire) out.propose = { retire: view.propose.retire };
    else if (outcome?.retireStale && L?.onScreen) out.propose = { retire: L.onScreen };      // the old topic's piece leaves
    if (outcome?.act === "steer") out.steer = { knob: outcome.knob };
    if (outcome?.act === "offer") out.offer = { family: outcome.family };
    return out;
  }
  if (!L) return view;
  const id = outcome.act === "reveal" ? outcome.candidateId : outcome.facts.candidateId;
  const c = host.state.candidates.find((x) => x.id === id) ?? null;
  const facts = { kind: outcome.facts.kind, archetype: outcome.facts.archetype, onScreen: { ...(outcome.facts.onScreen ?? {}) } };
  // a seam piece for it, so slotFor / factsRowForSlot / onReveal run their existing paths (one piece, one door)
  L.pieces.set(id, { intentId: id, slotId: `${id}:slot`, kind: facts.kind === "whiteboard" ? "diagram" : facts.kind, archetype: facts.archetype, params: {}, skillId: point.current.skillId,
    misconceptionId: point.current.misconceptionId ?? null, need: point.want?.need ?? "explain", neededAtMs: 0, intent: null, personal: outcome.rung === "generated_spec",
    signature: [], state: "ready", source: "stagecraft", retired: false, createdAt: Date.now(), facts,
    stagecraft: { rung: outcome.act === "board" ? "board" : outcome.rung, archetype: c?.archetype ?? facts.archetype, spec: c?.payload?.spec ?? null, boardTwin: c?.boardTwin ?? null,
      board: outcome.act === "board" ? { values: facts.onScreen } : null, cue: outcome.cue ?? { clauseIdx: 0, preRollMs: 400, crossFadeMs: 420 }, buildSha: c?.payload?.buildSha ?? null, blobUrl: c?.payload?.blobUrl ?? null } });
  out.propose = { reveal: id };
  out.revealing = facts;
  return out;
}

/** slotOf for a Stagecraft piece: the artifact the device's stage controller mounts (src/stagecraft). Never a loading state. */
export function stagecraftSlot(p, state = p.state) {
  const st = state === "fallback_ready" ? "fallback_shown" : state;
  return { slotId: p.slotId, intentId: p.intentId, state: st, artifact: { kind: "stagecraft", stagecraft: p.stagecraft } };
}
export function noteRevealed(lessonId, candidateId) { const h = hosts.get(lessonId); if (h && candidateId) h.input({ t: "revealed", candidateId, at: h.clock() }); }
let retireHook = null;
/** kernel-point.js registers its stage-view retire here (a retired piece is no longer on stage for the policy either). */
export const setRetireHook = (f) => { retireHook = f; };
export function noteRetired(lessonId) { const h = hosts.get(lessonId); if (h) h.input({ t: "retired", at: h.clock() }); try { retireHook?.(lessonId); } catch { /* advisory */ } }
export function noteSafety(lessonId, open) { const h = hosts.get(lessonId); if (h) h.input({ t: "safety", open: !!open, at: h.clock() }); }
export function noteMountFailed(lessonId, candidateId) { const h = hosts.get(lessonId); if (h) h.input({ t: "mount_failed", candidateId, at: h.clock() }); }
