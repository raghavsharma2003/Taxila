// Client switches for voicesig (ship5 p3-voicesig). The feature ships ON; each switch only ever falls back to the path the
// lesson had before this stream (src/voice/features.ts with its own "taxila-feature-tap" worklet, no kv):
//   ?voicesig=0 | 1 | default   per device, persisted (localStorage "tx.flag.voicesig")
//   ?vsraw=1                    per device: also open the raw analysis track R (AGC/NS off). Off by default: a second
//                               getUserMedia on the same device is unmeasured on Android (VS-M4 / VS-M11)
//   VITE_VOICESIG=0             build-time off
//   GET /api/voicesig/config    the server's runtime kill (TAXILA_VOICESIG=off, TAXILA_VOICESIG_FRONTEND=0,
//                               TAXILA_VOICESIG_DETECTOR=0, TAXILA_VOICESIG_HOLDCUE=0). Fails OPEN (1.5 s timeout, any error): the old path is the
//                               fallback inside the feature itself, so a missing route never costs the child anything.
export const VOICESIG_KEY = "tx.flag.voicesig";
export const VSRAW_KEY = "tx.flag.voicesig.raw";
export const CONFIG_TIMEOUT_MS = 1_500;

/** holdCue (round 3): present (false) only when the server killed the thinking-pause cue alone; see holdCueAllowed(). */
export interface VoicesigConfig { mode: "off" | "shadow" | "on"; frontend: boolean; detector: boolean; holdCue?: false }

/** The thinking-pause cue for duplex (src/voicesig/holdCue.ts) runs the detector: on when the detector is, unless killed. */
export const holdCueAllowed = (c: VoicesigConfig): boolean => c.mode !== "off" && c.detector && c.holdCue !== false;

function read(key: string, urlParam: string): string | null {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get(urlParam);
      if (v === "1" || v === "0") localStorage.setItem(key, v);
      else if (v === "default") localStorage.removeItem(key);
    }
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

/** The device / build decision (no network). A device forced ON is not overridden by the build flag. */
export function voicesigDeviceAllows(): boolean {
  const v = read(VOICESIG_KEY, "voicesig");
  if (v === "1") return true;
  if (v === "0") return false;
  let build: string | undefined;
  try { build = import.meta.env?.VITE_VOICESIG; } catch { build = undefined; }
  return build !== "0";
}

export const voicesigRawTrack = (): boolean => read(VSRAW_KEY, "vsraw") === "1";

let cached: Promise<VoicesigConfig> | null = null;
const OPEN: VoicesigConfig = { mode: "shadow", frontend: true, detector: true };

/** The server's runtime switches, once per page (fails open). */
export function voicesigConfig(fetchFn: typeof fetch | undefined = typeof fetch === "function" ? fetch : undefined): Promise<VoicesigConfig> {
  if (cached) return cached;
  cached = (async () => {
    if (!fetchFn) return OPEN;
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctl?.abort(), CONFIG_TIMEOUT_MS);
    try {
      const res = await fetchFn("/api/voicesig/config", { credentials: "same-origin", signal: ctl?.signal });
      if (!res.ok) return OPEN;
      const b = (await res.json()) as Partial<VoicesigConfig>;
      return { mode: b.mode === "off" || b.mode === "on" ? b.mode : "shadow", frontend: b.frontend !== false, detector: b.detector !== false, ...(b.holdCue === false ? { holdCue: false as const } : {}) };
    } catch {
      return OPEN;
    } finally {
      clearTimeout(timer);
    }
  })();
  return cached;
}

/** Tests only. */
export function resetVoicesigConfig(): void { cached = null; }
