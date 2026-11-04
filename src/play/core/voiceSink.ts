// The synchronous voice ack (r7 studio-game-utterance-double-turn). The lesson runtime dispatches PLAY_HEARD for every
// committed child utterance and reads the event's detail back right after dispatchEvent returns (dispatch is
// synchronous). While a play stage is mounted it registers one sink here. The sink parses the utterance with the closed
// grammar, presses the controls on screen now when the stage is at a turn point, and reports what it did. The renderer's
// PLAY_HEARD listener writes that report into the event detail as `gameAct`. The runtime then sends the turn flagged as
// a game act, so the server never grades it against the lesson card the child cannot see.
//
// PURE module state, no React: one sink at a time (the last stage to mount wins; its cleanup only clears itself).
import type { VoiceIntent } from "./voice.ts";

/** What the game did with one utterance. `pressed` false = a game command the stage could not take right now (no such
 *  control on screen, or a finger mid-drag); it is still a game act, never an answer to the lesson card. */
export interface GameAct { verb: VoiceIntent["verb"]; pressed: boolean; text: string }

/** The PLAY_HEARD event detail. The runtime sets `text`; the play renderer sets `gameAct` when its grammar took it. */
export interface PlayHeardDetail { text: string; gameAct?: GameAct }

export type VoiceSink = (text: string) => GameAct | null;

let sink: VoiceSink | null = null;

/** Register the mounted stage's sink; returns the cleanup (clears only if it is still the registered one). */
export function setVoiceSink(fn: VoiceSink): () => void {
  sink = fn;
  return () => { if (sink === fn) sink = null; };
}

/** Run the registered sink on one utterance; null when no stage is mounted or the grammar did not take it. */
export function probeVoice(text: string): GameAct | null {
  if (!sink || typeof text !== "string" || !text.trim()) return null;
  try { return sink(text.slice(0, 120)); } catch { return null; }
}

/** The runtime's read of a dispatched PLAY_HEARD detail (tolerates anything a listener might have written). */
export function gameActOf(detail: unknown): GameAct | null {
  const g = (detail as { gameAct?: unknown } | null)?.gameAct as Partial<GameAct> | undefined;
  if (!g || typeof g.verb !== "string" || typeof g.pressed !== "boolean") return null;
  return { verb: g.verb as GameAct["verb"], pressed: g.pressed, text: typeof g.text === "string" ? g.text.slice(0, 80) : "" };
}
