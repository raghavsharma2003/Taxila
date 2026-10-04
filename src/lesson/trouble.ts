// Trouble (PRODUCT-DESIGN-V2 §4.7): every failure maps to one of nine designed states, each with a plain
// sentence, at most two actions and the state of the child's answer. Pure: the facts come from runtime events
// (link errors with codes, connection, the outbox, HTTP status, the browser's online/offline), never from a guess.
//   T1 no reply 8 s after the receipt         T2 offline / link down > 20 s      T3 speech recognition unavailable
//   T4 send failed after the 3 retries        T5 her audio failed (TTS)          T6 no output (muted heuristic)
//   T7 the tray failed (no strip: the tray does not render)                      T8 session expired (401, full screen)
//   T9 server error on lesson start (full screen)
// Plus two signals that are not failures: RC "Back online." (the link returned after T1/T2/T4) and PTT (the
// hands-free listener fell back to tap-to-talk: made visible once, so the change is never silent).
export type TroubleId = "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T8" | "T9";
export type StripId = TroubleId | "RC" | "PTT";

export interface TroubleFacts {
  now: number;
  /** navigator.onLine is false, or the browser fired "offline". */
  offline: boolean;
  /** The link has been "reconnecting" / "failed" since this time (ms), else null. */
  linkDownSince: number | null;
  /** The last child commit (receipt) still waiting for her reply, and whether a request is in flight. */
  waitingSince: number | null;
  /** A held answer exhausted its retries (or was refused with a non-auth error). */
  sendFailed: boolean;
  /** HTTP 401/403 on a turn or the start. */
  authExpired: boolean;
  /** The start call failed (non-auth). */
  startFailed: boolean;
  /** Her speech failed to play on the current turn (link error tts_failed). */
  ttsFailed: boolean;
  /** Speech recognition is unavailable (recording fallback could not run) while a mic exists. */
  sttDown: boolean;
  /** Two YOUR TURN windows in a row passed reaskS with no tap and no speech (first lesson): likely muted. */
  likelyMuted: boolean;
  /** The child dismissed these (Wait / I can hear now / OK) until the facts change. */
  dismissed: ReadonlySet<StripId>;
  /** The link returned / the outbox drained after a trouble state, at this time (RC shows 2 s). */
  recoveredAt: number | null;
  /** The hands-free listener fell back to tap-to-talk (stt_fallback_ptt) and the child has not seen the note. */
  pttFallback: boolean;
}

export const T1_MS = 8_000;
/**
 * W2-D #1 (RELATIONAL-OS NR: network loss must not read as being ignored): the app-voice notice is up ≤ 4.5 s after the
 * link reports itself down (was 20 s). The realtime link now reports down at ICE "disconnected" (src/lesson/voiceLink.ts),
 * not after its 4 s rebuild grace; a link that heals inside the grace shows RC "Back online." instead.
 */
export const T2_LINK_MS = 4_500;
export const RC_MS = 2_000;

/** Full-screen states replace the Desk; strips sit above the dock. */
export const FULL_SCREEN: ReadonlySet<StripId> = new Set(["T8", "T9"]);

/** The one state to show now, by priority: full screens, then connectivity, then the turn, then output. */
export function classifyTrouble(f: TroubleFacts): StripId | null {
  if (f.authExpired) return "T8";
  if (f.startFailed) return "T9";
  if (f.offline || (f.linkDownSince !== null && f.now - f.linkDownSince >= T2_LINK_MS)) return "T2";
  if (f.sendFailed) return "T4";
  if (f.waitingSince !== null && f.now - f.waitingSince >= T1_MS && !f.dismissed.has("T1")) return "T1";
  if (f.recoveredAt !== null && f.now - f.recoveredAt < RC_MS) return "RC";
  if (f.sttDown && !f.dismissed.has("T3")) return "T3";
  if (f.ttsFailed && !f.dismissed.has("T5")) return "T5";
  if (f.likelyMuted && !f.dismissed.has("T6")) return "T6";
  if (f.pttFallback && !f.dismissed.has("PTT")) return "PTT";
  return null;
}

/** Strips that light nothing: the lamp is off while ANY strip shows (§4.2 rule 3), RC and PTT included. */
export const isStrip = (id: StripId | null): boolean => !!id && !FULL_SCREEN.has(id);

/** Map a link error code to the fact it sets. Codes come from cascadeLink / textLink. */
export function factOfLinkError(code: string | undefined): "tts" | "stt_down" | "ptt" | "no_mic" | null {
  switch (code) {
    case "tts_failed":
      return "tts";
    case "no_recorder":
    case "stt_unavailable":
      return "stt_down";
    case "stt_fallback_ptt":
      return "ptt";
    case "mic_unavailable":
      return "no_mic";
    default:
      return null;
  }
}
