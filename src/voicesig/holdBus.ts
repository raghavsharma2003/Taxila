// The one place the lesson's thinking-pause cue (holdCue.ts, run by lessonFeatures.ts on the shared tap) hands its
// estimates to whoever decides the floor. Duplex subscribes from its own glue (patch 03: src/duplex/liveTap.ts →
// DuplexLive.estimate), so neither stream imports the other's internals: voicesig publishes numbers, duplex reads them.
// A tab has one lesson and one tap, so a module-level set is the right scope. Never throws into a publisher.
import type { HoldEstimate } from "./holdCue.ts";

type Listener = (e: HoldEstimate) => void;
const listeners = new Set<Listener>();

/** Subscribe to thinking-pause estimates (AcousticEstimate-shaped). Returns the unsubscribe. */
export function onThinkingPause(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function publishThinkingPause(e: HoldEstimate): void {
  for (const cb of listeners) {
    try { cb(e); } catch { /* a consumer's bug never reaches the cue */ }
  }
}

/** Tests / the G-VS-ONE probe. */
export const holdBusStats = (): { listeners: number } => ({ listeners: listeners.size });
