// The duplex host → puppet seam (src/duplex/host.ts HostCommand). Whoever constructs the DuplexHost passes its `emit`
// through `puppetDuplexSink` (patch 05): face cues (pose / nod / clip) go to the puppet bus, and a voice yield closes her
// mouth at once (the player re-sends the remaining visemes with their new playAt if she resumes). Everything else passes
// through untouched. Pure forwarding; content-blind by construction (a FaceCue carries no words).
import type { HostCommand } from "../duplex/host.ts";
import { puppetBus } from "./bus.ts";

/** Forward the face-relevant host commands to the puppet; returns the command unchanged for chaining. */
export function puppetDuplexSink(c: HostCommand): HostCommand {
  try {
    if (c.to === "face") puppetBus.emit({ kind: "duplex", cue: c.cue, at: c.t });
    else if (c.to === "voice" && c.op === "yield") puppetBus.emit({ kind: "cut", at: c.t });
  } catch {
    /* the face never breaks the floor */
  }
  return c;
}

/** Wrap a host's emit: `new DuplexHost({ ..., emit: withPuppet(emit) })`. */
export const withPuppet = (emit: (c: HostCommand) => void) => (c: HostCommand) => emit(puppetDuplexSink(c));
