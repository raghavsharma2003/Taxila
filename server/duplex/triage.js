// BUILD-track result triage (ARCHITECTURE.md §2.5, law 6): speech and work are separate tracks. A result that lands
// mid-conversation is sorted in CODE into exactly one class. Pure, browser-safe.
//   INTERRUPT  safety only: the floor goes to SAFETY_ATTEND at once (nothing is spoken over the child).
//   WHEN_IDLE  a build / whiteboard script / library mount: revealed only as a Studio `reveal` proposal at the NEXT turn
//              boundary, where the kernel decides. A child-requested aid is WHEN_IDLE + urgent (next TRP even mid-beat).
//   SILENT     notes, classify hints, learner-model updates: quiet context for the Director; no speech, no screen change.
// "She stopped talking" never cancels a build, a classify, a note or a safety check.

const WHEN_IDLE_KINDS = new Set(["build", "studio", "whiteboard", "mount", "library", "t1_params", "t2_scene"]);
const SILENT_KINDS = new Set(["note", "classify_hint", "learner_update", "misconception_hint", "prefetch"]);

/** @param {{ kind:string, distress?:boolean, childRequested?:boolean }} result @returns {"INTERRUPT"|"WHEN_IDLE"|"SILENT"} */
export function triage(result) {
  if (result?.kind === "safety" || result?.distress === true) return "INTERRUPT";
  if (WHEN_IDLE_KINDS.has(result?.kind)) return "WHEN_IDLE";
  if (SILENT_KINDS.has(result?.kind)) return "SILENT";
  return "SILENT"; // unknown kinds never reach speech or the screen
}

/** A queue of WHEN_IDLE results, drained only at a turn boundary (the floor is the teacher's or the child just finished). */
export class RevealQueue {
  constructor() { this.items = []; this.revealedMidUtterance = 0; }
  push(result, now) { const cls = triage(result); if (cls === "WHEN_IDLE") this.items.push({ ...result, at: now, urgent: !!result.childRequested }); return cls; }
  /** @param {string} floorState  only T_SPEAKING/T_YIELDING/COMMITTED/C_WAITING are turn boundaries; anything else returns [] */
  drain(floorState) {
    if (!["COMMITTED", "T_SPEAKING", "T_YIELDING", "C_WAITING"].includes(floorState)) return [];
    const out = this.items.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
    this.items = [];
    return out;
  }
}
