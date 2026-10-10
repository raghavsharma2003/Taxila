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
import { restIsDue } from "./policy.js";
import { REST_CFG } from "./adapters.js";
import { createStageGradeSession } from "./grade.js";
// round 4 content: the ONE certificate gate (Studio v2 is off the child path unless certified at all three sizes)
import { certifyForTray, viewportOf } from "../forge3/tray-gate.js";

// `var` + function declarations (hoisted): kernel-point.js registers its hooks at load, and with the seam ⇄ bridge import
// cycle (patch 03) it may run before this module's body has evaluated; a `let`/`const` binding would be in its TDZ then.
var hosts = new Map();
var outcomeHook = null, retireHook = null, forgetHook = null, verdictHook = null;
/** kernel-point.js registers its noteOutcome here (the kernel's own stage view; no import cycle). */
export function setOutcomeHook(f) { outcomeHook = f; }

/** @param {string} lessonId @param {import("./host.js").StagecraftHost} host */
export function attach(lessonId, host) { (hosts ??= new Map()).set(lessonId, host); return host; }
export function detach(lessonId) { const h = hosts?.get(lessonId); hosts?.delete(lessonId); h?.close?.(); try { forgetHook?.(lessonId); } catch { /* advisory */ } }
export function hostFor(lessonId) { return hosts?.get(lessonId) ?? null; }
/** The seam's lesson state (read-only; kernel-point.js reads what is on stage for the rest rule). */
export const seamLesson = (lessonId) => { try { return _lesson(lessonId); } catch { return null; } };

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
  try { return merge(lessonId, host, view, point, outcome); } catch { return view; }
}

/**
 * ship5 p4-content: Stagecraft and Wave 2 share ONE stage. Stagecraft's reveal wins over a Wave 2 proposal; a Wave 2
 * piece the child is on is replaced only for the child's own request or a board reteach; when Stagecraft holds, the
 * Wave 2 view stands (the old path is the automatic fallback); the REST rule strips a plan-led Wave 2 reveal too and
 * retires a piece that has been up long enough; a "board" outcome adds no piece: the Wave 2 whiteboard (drawn on her
 * line) is the board, and a Stagecraft piece proposed here would decline it (propose.js reveal_ready).
 */
function merge(lessonId, host, view, point, outcome) {
  const L = _lesson(lessonId);
  const want = point.want ?? null;
  const out = { statuses: view?.statuses ?? [], onScreen: view?.onScreen ?? null, ...(view?.outcome ? { outcome: view.outcome } : {}), ...(view?.suggest ? { suggest: view.suggest } : {}) };
  const on = L?.onScreen ? L.pieces.get(L.onScreen) : null;
  const onVisible = !!on && (on.state === "revealed" || on.state === "in_use");
  const onPiece = onVisible && on.kind !== "whiteboard" ? on : null;
  const exempt = !!want && (want.childRequested || want.origin === "board_state" || want.need === "contrast_misconception");
  const rest = point.rest ?? {};
  const restDue = restIsDue(rest, REST_CFG);
  const keepW2 = () => {
    if (view?.propose?.retire) out.propose = { retire: view.propose.retire };
    // the child asked for the BOARD while a piece is up: it steps down so the whiteboard can draw on her line
    else if (point.requestKind === "board_request" && onPiece) out.propose = { retire: onPiece.intentId };
    else if (outcome?.retireStale && L?.onScreen) out.propose = { retire: L.onScreen };      // the old topic's piece leaves
    else if (view?.propose?.reveal && !restDue) { out.propose = { reveal: view.propose.reveal }; if (view.revealing) out.revealing = view.revealing; }
    else if (onPiece && restDue && !exempt && L && L.turn - (onPiece.revealedTurn ?? L.turn) >= REST_CFG.restRetireTurns && onPiece.state !== "in_use") { out.propose = { retire: onPiece.intentId }; host.restRetires = (host.restRetires ?? 0) + 1; }
    if (outcome?.act === "steer") out.steer = { knob: outcome.knob };
    if (outcome?.act === "offer") out.offer = { family: outcome.family };
    return out;
  };
  if (!outcome || outcome.act !== "reveal" || !L) return keepW2();
  // round 4 (owner's vision via the main session, 2026-10-10: games built on the go, the skill as the mechanic): at a
  // PRACTICE beat an admitted play piece for the skill being practised wins over a Stagecraft reveal. It is an offer the
  // child can decline (NEVER MANIPULATE): after one decline in this lesson the practice beat is Stagecraft's / the
  // boards' again. Measured (G2, claude/r4-khand, local production, n = 3 lessons): Stagecraft's reveal took every
  // practice beat (turns 5-11), so the play proposal was never shown.
  if (isPracticeBeat(point.current?.beat ?? point.beat) && !L.playDeclined && isPlayPiece(view?.propose?.reveal ? L.pieces.get(view.propose.reveal) : null)) {
    host.playWins = (host.playWins ?? 0) + 1;
    return keepW2();
  }
  // a Wave 2 piece the child is on stays unless the child asked for something else or is stuck on it (board reteach)
  if (onPiece && onPiece.source !== "stagecraft" && !exempt) return keepW2();
  const id = outcome.candidateId;
  const c = host.state.candidates.find((x) => x.id === id) ?? null;
  const facts = { kind: outcome.facts.kind, archetype: stageArchetypeTag(outcome.facts.archetype), onScreen: { ...(outcome.facts.onScreen ?? {}) } };
  // round 4 content: certified at the device's class (and at all three sizes) BEFORE it is proposed, or the W2 view stands
  const sc0 = { rung: outcome.rung, archetype: c?.archetype ?? outcome.facts.archetype, spec: c?.payload?.spec ?? null, boardTwin: c?.boardTwin ?? null };
  const vpNow = viewportOf(lessonId);
  const cert = certifyForTray({ kind: "stagecraft", stagecraft: sc0 }, { vp: vpNow.vp, box: vpNow.box, young: vpNow.known ? vpNow.young : (L.child?.class_level ?? 6) <= 4,
    topicId: L.topicId ?? point.current?.topicId ?? null, factsKind: facts.kind, verdict: c?.verdict ?? null });
  if (!cert.ok) {
    host.gateRefusals = (host.gateRefusals ?? 0) + 1;
    console.info(`[stagecraft] tray gate refused ${outcome.rung} ${sc0.archetype ?? "-"} at ${cert.vp}: ${String(cert.why).slice(0, 100)}`);
    return keepW2();
  }
  // a seam piece for it, so slotFor / factsRowForSlot / onReveal run their existing paths (one piece, one door)
  L.pieces.set(id, { intentId: id, slotId: `${id}:slot`, kind: facts.kind === "whiteboard" ? "diagram" : facts.kind, archetype: c?.archetype ?? outcome.facts.archetype, params: {}, skillId: point.current.skillId,
    misconceptionId: point.current.misconceptionId ?? null, need: want?.need ?? "explain", neededAtMs: 0, intent: null, personal: outcome.rung === "generated_spec",
    signature: [], state: "ready", source: "stagecraft", retired: false, createdAt: Date.now(), facts, requested: !!want?.childRequested,
    stagecraft: { rung: outcome.rung, archetype: c?.archetype ?? outcome.facts.archetype, spec: c?.payload?.spec ?? null, boardTwin: c?.boardTwin ?? null,
      board: null, cue: outcome.cue ?? { clauseIdx: 0, preRollMs: 400, crossFadeMs: 420 }, buildSha: c?.payload?.buildSha ?? null, blobUrl: c?.payload?.blobUrl ?? null } });
  out.propose = { reveal: id, ...(want?.childRequested ? { requested: true } : {}) };
  out.revealing = facts;
  return out;
}

const isPracticeBeat = (beat) => beat === "practice" || beat === "practice_set";
/** A play piece (server/forge3/live.js through seam.composeAsk, or a W2 proposal of a play family). */
export const isPlayPiece = (p) => !!p && (p.source === "play" || String(p.archetype ?? "").startsWith("play:"));

/** A Stagecraft piece's facts archetype on the reply's facts row: tagged, so it never collides with a module engine id
 *  (shared/engine-catalog.js has a water-cycle@1 too) and seam.js isStudioRow can tell it is Studio's own row. */
export const STAGE_TAG = "stage:";
export const stageArchetypeTag = (a) => (String(a ?? "").startsWith(STAGE_TAG) ? String(a) : `${STAGE_TAG}${a ?? "piece"}`);
export const isStageArchetype = (head) => typeof head === "string" && head.startsWith(STAGE_TAG);

/** The host's grade session for a piece the seam reveals (patch 03 onReveal): Stagecraft pieces grade through gradeAny. */
export function gradeSessionFor(p) {
  if (p?.source !== "stagecraft" || !p.stagecraft?.archetype) return null;
  return createStageGradeSession(p.stagecraft.archetype, p.stagecraft.spec);
}

/** slotOf for a Stagecraft piece: the artifact the device's stage controller mounts (src/stagecraft). Never a loading state. */
export function stagecraftSlot(p, state = p.state) {
  const st = state === "fallback_ready" ? "fallback_shown" : state;
  // the Studio v2 engines and board draw in a 1000 x 625 design box (src/studio-v2/core/tokens.ts W, H): the stage fits it
  return { slotId: p.slotId, intentId: p.intentId, state: st, artifact: { kind: "stagecraft", stage: { w: 1000, h: 625 }, stagecraft: p.stagecraft } };
}
export function noteRevealed(lessonId, candidateId) { const h = hosts.get(lessonId); if (h && candidateId) h.input({ t: "revealed", candidateId, at: h.clock() }); }
/** kernel-point.js registers its stage-view retire here (a retired piece is no longer on stage for the policy either). */
export function setRetireHook(f) { retireHook = f; }
/** kernel-point.js registers its per-lesson view cleanup (detach) and the host-graded verdict feed (board reteach rule). */
export function setForgetHook(f) { forgetHook = f; }
export function setVerdictHook(f) { verdictHook = f; }
/** The seam graded an answer on a Stagecraft piece (hostAnswer): the kernel's board-reteach rule counts it (P4 note). */
export function noteVerdict(lessonId, verdict) { try { verdictHook?.(lessonId, verdict); } catch { /* advisory */ } }
export function noteRetired(lessonId) { const h = hosts.get(lessonId); if (h) h.input({ t: "retired", at: h.clock() }); try { retireHook?.(lessonId); } catch { /* advisory */ } }
export function noteSafety(lessonId, open) { const h = hosts.get(lessonId); if (h) h.input({ t: "safety", open: !!open, at: h.clock() }); }
export function noteMountFailed(lessonId, candidateId) { const h = hosts.get(lessonId); if (h) h.input({ t: "mount_failed", candidateId, at: h.clock() }); }
