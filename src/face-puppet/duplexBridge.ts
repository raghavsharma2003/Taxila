// The duplex host → puppet seam (src/duplex/host.ts HostCommand). This is the ONE hook the duplex engine drives the face
// through; whoever constructs the DuplexHost wraps its `emit`:
//
//   const host = new DuplexHost({ ..., emit: withPuppet(emit) });
//   ...on teardown: puppetDuplexDetach();
//
// What reaches the face (pure forwarding; content-blind by construction: a FaceCue carries no words, and nothing here
// reads `text`, `uptake` or a transcript):
//   {to: "face", cue: pose}         → the floor face (listening / listen_lean / thinking glance / your_turn / hold / check-in);
//                                     the FIRST pose attaches the engine: the mic-level Listener stops nodding and the
//                                     engine owns the listening face and the thinking glance (policy.ts R5);
//   {to: "face", cue: nod}          → one continuer nod, <= 1 per 3 s, never while she speaks, never in safety (driver.ts);
//   {to: "face", cue: clip}         → nothing (an "mm" is audio; the face never invents a mouth for a sound it was not given);
//   {to: "voice", op: "yield"}      → her mouth closes now (the player re-sends what is left if she resumes);
//   {to: "safety", op: "attend"}    → the safety-neutral face (policy.ts R6), as the calm_steady pose;
//   {to: "floor", phase: "safety_attend"} → the same (belt and braces: the engine's own phasePose sends calm_steady too).
// puppetDuplexDetach() hands the floor faces and nods back to the floor state and the mic-level Listener (a host that
// is torn down mid-lesson must not leave a face that never nods again).
// Everything else passes through untouched. A failure here never breaks the floor.
import type { HostCommand } from "../duplex/host.ts";
import { puppetBus } from "./bus.ts";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Forward the face-relevant host commands to the puppet; returns the command unchanged for chaining. */
export function puppetDuplexSink(c: HostCommand): HostCommand {
  try {
    if (c.to === "face") puppetBus.emit({ kind: "duplex", cue: c.cue, at: c.t });
    else if (c.to === "voice" && c.op === "yield") puppetBus.emit({ kind: "cut", at: c.t });
    else if (c.to === "safety" && c.op === "attend") puppetBus.emit({ kind: "duplex", cue: { kind: "pose", pose: "calm_steady", why: "safety_attend" }, at: c.t });
    else if (c.to === "floor" && c.phase === "safety_attend") puppetBus.emit({ kind: "duplex", cue: { kind: "pose", pose: "calm_steady", why: "safety_attend" }, at: c.t });
  } catch {
    /* the face never breaks the floor */
  }
  return c;
}

/** Wrap a host's emit: `new DuplexHost({ ..., emit: withPuppet(emit) })`. */
export const withPuppet = (emit: (c: HostCommand) => void) => (c: HostCommand) => emit(puppetDuplexSink(c));

/** The duplex host is gone: the floor state and the mic-level Listener drive the floor faces and nods again. */
export function puppetDuplexDetach(): void {
  try {
    puppetBus.emit({ kind: "duplex-detach", at: now() });
  } catch {
    /* never throws */
  }
}
