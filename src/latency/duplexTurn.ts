// Round 3, stream relational-human: the turn path's DUPLEX END-OF-TURN hook. When the duplex engine decides the child's
// floor (src/duplex, mode "on"), the end of the child's turn is the engine's word-aware decision, not the 900 ms server
// VAD + the "completed" transcript (~1.57 s after the child stops, docs/design/round2/latency/RESEARCH.md §5). The turn
// path is made ready for it here, on the device, with no change to the engine:
//
//   engine `think/prepare` (projected pComplete ≥ 0.5: its EAGER end of turn, Deepgram Flux's EagerEndOfTurn idea)
//       → TurnPrefetcher.sendNow(engine words): classify ∥ the note ∥ the speculative replies start on the engine's words;
//   engine `voice/speak` (the commit; firstSound "uptake" on a closed answer)
//       → AckClient.request(engine words): the acknowledgement is decided on the turn's own classify — the commit's text
//         is byte-identical, so the turn ADOPTS the prefetched work (server/latency/perceive.js fingerprint) and the ack
//         route finds it on the perception bus.
//
// Wiring: the duplex host's emit is already wrapped for the face (src/face-puppet/duplexBridge.ts withPuppet, passed by
// src/lesson/uiBridge.ts as `duplexFace.wrapEmit`); that sink forwards every command here. The link registers its
// prefetcher and ack client for the lesson (patch 02, src/lesson/cascadeLink.ts) and says whether the engine is LIVE: in
// shadow mode the host emits no think/voice commands at all (host.ts `if (!live) return`), and this hook also refuses
// anything while the link reports the engine not deciding. Content stays where it belongs: the face never reads the words
// (duplexBridge forwards the command object untouched).
import type { HostCommand } from "../duplex/host.ts";
import type { TurnPrefetcher } from "./prefetch.ts";
import type { AckClient } from "./ack.ts";

export interface LatencyTarget {
  lessonId: string;
  prefetcher: TurnPrefetcher | null;
  ack: AckClient | null;
  /** The duplex engine is deciding the floor now (CascadeDuplex.deciding). */
  duplexLive: () => boolean;
}

let target: LatencyTarget | null = null;
/** What the hook did (dev read-out, tests). */
export const duplexTurnStats = { prepares: 0, prefetched: 0, speaks: 0, ackAsked: 0, ignored: 0 };

/** The link of the open lesson registers itself; returns the unregister. One lesson at a time on a page. */
export function registerLatencyTarget(t: LatencyTarget): () => void {
  target = t;
  return () => { if (target === t) target = null; };
}

/** One duplex host command (forwarded by duplexBridge). Never throws. */
export function latencyDuplexSink(c: HostCommand): void {
  try {
    const t = target;
    if (!t || !t.duplexLive()) { if (c.to === "think" || (c.to === "voice" && c.op === "speak")) duplexTurnStats.ignored++; return; }
    if (c.to === "think" && c.op === "prepare") {
      duplexTurnStats.prepares++;
      // the eager end of turn: a draft starts (pComplete projected ≥ 0.5) on these words
      if (c.hint.draft === "start" && c.text?.trim() && t.prefetcher?.sendNow("duplex", c.text)) duplexTurnStats.prefetched++;
      return;
    }
    if (c.to === "voice" && c.op === "speak") {
      duplexTurnStats.speaks++;
      // a nudge with nothing said is not a child turn; a safeguard first sound never gets an echo
      if (c.reason === "wt1_nudge" || c.firstSound === "safeguard" || !c.text?.trim()) return;
      if (t.ack) { t.ack.request(c.text); duplexTurnStats.ackAsked++; }
    }
  } catch {
    /* the latency hook never breaks the floor */
  }
}

/** Tests only. */
export function __resetDuplexTurn(): void {
  target = null;
  for (const k of Object.keys(duplexTurnStats) as (keyof typeof duplexTurnStats)[]) duplexTurnStats[k] = 0;
}
