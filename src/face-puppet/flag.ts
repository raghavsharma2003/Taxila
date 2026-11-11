// `face.puppet2d`: the style-C 2D puppet is the lesson face. Default ON (owner 2026-10-05: "ship the 2D style-C puppet
// at 4.0 now, keep polishing to 4.5"; VALUES-100 V4 item 2). Presentation only: the AI disclosure, the audio floor and
// every safety surface are identical on both paths.
// Resolution, first hit wins:
//   1. `?puppet=0|1|default` in any URL (persisted to this device, like ?facerig=);
//   2. localStorage "tx.flag.face.puppet2d" = "0" | "1";
//   3. VITE_FACE_PUPPET2D = "0" at build time turns the deploy default off;
//   4. on.
// Plus the RUNTIME kill switch (ship5 p2-face): the server's TAXILA_FACE_PUPPET2D=0, read from GET /api/face/config
// (server/face-puppet/config.js) by puppetServerAllows(). PuppetFace awaits it (in parallel with the stage chunk) before
// it builds a stage, so a kill reaches every face not yet revealed and holds her own rest still, the automatic fallback.
// Fail-open: an unreachable or absent route (404 before patch 03, the server seam, is applied) means "allowed". A device forced
// on with ?puppet=1 (the owner's test) is not overridden by the server.
export const PUPPET_FLAG_KEY = "tx.flag.face.puppet2d";

let urlApplied = false;
function applyUrl(): void {
  if (urlApplied) return;
  urlApplied = true;
  try {
    if (typeof location === "undefined") return;
    const v = new URLSearchParams(location.search).get("puppet");
    if (v === "1" || v === "on") setPuppet2d(true);
    else if (v === "0" || v === "off") setPuppet2d(false);
    else if (v === "default") setPuppet2d(null);
  } catch {
    /* no URL / storage */
  }
}

export function puppet2dEnabled(): boolean {
  applyUrl();
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(PUPPET_FLAG_KEY) : null;
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* storage blocked */
  }
  return import.meta.env?.VITE_FACE_PUPPET2D !== "0";
}

export function setPuppet2d(on: boolean | null): void {
  try {
    if (on === null) localStorage.removeItem(PUPPET_FLAG_KEY);
    else localStorage.setItem(PUPPET_FLAG_KEY, on ? "1" : "0");
  } catch {
    /* storage blocked */
  }
}

/** The device explicitly forced the puppet on (?puppet=1 / localStorage "1"): the server kill switch does not apply. */
export function puppetForcedOn(): boolean {
  applyUrl();
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(PUPPET_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export const FACE_CONFIG_URL = "/api/face/config";
/** What GET /api/face/config answers (server/face-puppet/config.js); `look` since round 4 (TAXILA_FACE_LOOK). */
export interface FaceServerConfig { puppet2d: boolean; look: string | null; cohort?: boolean; react?: boolean }
const OPEN: FaceServerConfig = { puppet2d: true, look: null };
let serverAsk: Promise<FaceServerConfig> | null = null;
let serverKnown: FaceServerConfig | null = null;

/** The server's face config, one request per page; fail-open ({ puppet2d: true, look: null }) after `timeoutMs`. */
export function faceServerConfig(fetchImpl: typeof fetch | undefined = typeof fetch === "function" ? fetch : undefined, timeoutMs = 1500): Promise<FaceServerConfig> {
  if (serverAsk) return serverAsk;
  serverAsk = (async () => {
    if (!fetchImpl) return OPEN;
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctl?.abort(), timeoutMs);
    try {
      const r = await fetchImpl(FACE_CONFIG_URL, { signal: ctl?.signal, credentials: "same-origin" });
      if (!r.ok) return OPEN;
      const j = (await r.json()) as { puppet2d?: unknown; look?: unknown; cohort?: unknown; react?: unknown };
      return { puppet2d: j?.puppet2d !== false, look: typeof j?.look === "string" ? j.look : null, cohort: j?.cohort === "owner", react: j?.react === true };
    } catch {
      return OPEN;
    } finally {
      clearTimeout(timer);
    }
  })().then((v) => (serverKnown = v));
  return serverAsk;
}

/** Whether the server allows the puppet (TAXILA_FACE_PUPPET2D). One request per page; fail-open after `timeoutMs`. */
export function puppetServerAllows(fetchImpl?: typeof fetch, timeoutMs?: number): Promise<boolean> {
  return faceServerConfig(fetchImpl, timeoutMs).then((c) => c.puppet2d);
}

/** The server's answer, once it has arrived on this page (null before). */
export const faceServerKnown = (): FaceServerConfig | null => serverKnown;

/** The server already said no on this page (LessonFace then mounts her rest still directly: no stage is built). */
export const puppetServerKnownOff = (): boolean => serverKnown?.puppet2d === false && !puppetForcedOn();

/** Tests only: forget the server's answer. */
export function resetPuppetServerFlag(): void {
  serverAsk = null;
  serverKnown = null;
}

/** Route (b) prototype (round 7): the key rig's 2.5D jaw layer, opt-in per device with ?jaw=1 (?jaw=0 / default clear it).
 *  Off by default until the owner's rig verdict. */
export const FACE_JAW_KEY = "tx.flag.face.jaw";
export function faceJawEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("jaw");
      if (v === "1") localStorage.setItem(FACE_JAW_KEY, "1");
      else if (v === "0" || v === "default") localStorage.removeItem(FACE_JAW_KEY);
    }
    return typeof localStorage !== "undefined" && localStorage.getItem(FACE_JAW_KEY) === "1";
  } catch {
    return false;
  }
}

/** Round 7: the rig draws in an OffscreenCanvas worker where supported (default on). ?rigworker=0 keeps it on the main
 *  thread on this device (the A/B for start latency, and a field escape hatch); ?rigworker=1 / default clears it. */
export const RIG_WORKER_KEY = "tx.flag.face.rigworker";
export function rigWorkerEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("rigworker");
      if (v === "0") localStorage.setItem(RIG_WORKER_KEY, "0");
      else if (v === "1" || v === "default") localStorage.removeItem(RIG_WORKER_KEY);
    }
    return !(typeof localStorage !== "undefined" && localStorage.getItem(RIG_WORKER_KEY) === "0");
  } catch {
    return true;
  }
}

/** Round 7 face-prewarm-for-first-sound: the home's worker-backed stage is handed to the lesson's face (./prewarm.ts;
 *  default on). ?handoff=0 turns it off on this device (the A/B for start → first face); ?handoff=1 / default clears it. */
export const FACE_HANDOFF_KEY = "tx.flag.face.handoff";
export function faceHandoffEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("handoff");
      if (v === "0") localStorage.setItem(FACE_HANDOFF_KEY, "0");
      else if (v === "1" || v === "default") localStorage.removeItem(FACE_HANDOFF_KEY);
    }
    return !(typeof localStorage !== "undefined" && localStorage.getItem(FACE_HANDOFF_KEY) === "0");
  } catch {
    return true;
  }
}

/** Round 7 face-reacts: between the child's last word and her first audio the face THINKS (it starts at the end of the
 *  child's speech, not at the transcript, with one breath), instead of holding the listening face through the wait.
 *  The server's TAXILA_R7_FACE_REACT (GET /api/face/config `react`), off by default; ?react=1 / ?react=0 set it on this
 *  device (the A/B and the evals), ?react=default clears the device's choice. False until the server has answered. */
export const FACE_REACT_KEY = "tx.flag.face.react";
export function faceReactEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("react");
      if (v === "0" || v === "1") localStorage.setItem(FACE_REACT_KEY, v);
      else if (v === "default") localStorage.removeItem(FACE_REACT_KEY);
    }
    const dev = typeof localStorage !== "undefined" ? localStorage.getItem(FACE_REACT_KEY) : null;
    if (dev === "1" || dev === "0") return dev === "1";
  } catch {
    /* storage blocked: the server's answer */
  }
  return serverKnown?.react === true;
}
