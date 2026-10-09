// The puppet's page bus: timing and floor events that are not React props (they arrive many times a second and must not
// re-render anything). Producers (wired by the V4 patches, docs/design/values/v4/patches/):
//   - the PCM player (src/lesson/ttsStream.ts) → "visemes": Diya's viseme + word events for one TTS part, with `playAt`
//     = performance.now() ms at which that part's FIRST sample sounds (the player is the clock, as for clause events);
//   - the player / duplex voice port → "cut": her audio stopped early (barge-in yield): the mouth closes now;
//   - the duplex host (src/duplex/host.ts emit {to: "face"}) → "duplex": pose / nod / clip cues (src/duplex/face.ts), and
//     "duplex-detach" when the host goes away (duplexBridge.ts is the one seam).
// The existing faceCues bus (src/avatar/faceCues.ts: affect, gaze, voice) is read directly by the driver; nothing here
// duplicates it. Every live puppet on the page hears every event (there is one teacher).
import type { FaceCue as DuplexCue } from "../duplex/face.ts";

export interface VisemeEvent { ms: number; id: number }
export interface WordEvent { ms: number; durMs: number; text: string }

export type PuppetEvent =
  | { kind: "visemes"; part: number; playAt: number; visemes: VisemeEvent[]; words?: WordEvent[]; text?: string; reqId?: string }
  | { kind: "cut"; at: number }
  | { kind: "duplex"; cue: DuplexCue; at: number }
  /** The duplex host was torn down (duplexBridge.puppetDuplexDetach): floor faces and nods go back to the floor state. */
  | { kind: "duplex-detach"; at: number }
  /** Round 3 (relational-human): her acknowledgement (the child's answer said back while she thinks: src/latency/ack.ts) starts
   *  / ends sounding. The face stays in its THINKING floor face while her mouth says it (knowledge.ts K2): it is not her turn
   *  starting, and no armed affect may fire on it (the affect belongs to the reply's words). */
  | { kind: "ack"; phase: "start" | "end"; at: number };

type Fn = (e: PuppetEvent) => void;
const subs = new Set<Fn>();

export const puppetBus = {
  emit(e: PuppetEvent): void {
    for (const fn of [...subs]) {
      try {
        fn(e);
      } catch (err) {
        console.warn("face-puppet: a bus listener failed", err);
      }
    }
  },
  on(fn: Fn): () => void {
    subs.add(fn);
    return () => subs.delete(fn);
  },
  get listeners(): number {
    return subs.size;
  },
};
