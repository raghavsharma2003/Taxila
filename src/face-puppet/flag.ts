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
// it builds a stage, so a kill reaches every face not yet revealed and lands on the old face, the automatic fallback.
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
let serverAsk: Promise<boolean> | null = null;
let serverKnown: boolean | null = null;

/** Whether the server allows the puppet (TAXILA_FACE_PUPPET2D). One request per page; fail-open after `timeoutMs`. */
export function puppetServerAllows(fetchImpl: typeof fetch | undefined = typeof fetch === "function" ? fetch : undefined, timeoutMs = 1500): Promise<boolean> {
  if (serverAsk) return serverAsk;
  serverAsk = (async () => {
    if (!fetchImpl) return true;
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctl?.abort(), timeoutMs);
    try {
      const r = await fetchImpl(FACE_CONFIG_URL, { signal: ctl?.signal, credentials: "same-origin" });
      if (!r.ok) return true;
      const j = (await r.json()) as { puppet2d?: unknown };
      return j?.puppet2d !== false;
    } catch {
      return true;
    } finally {
      clearTimeout(timer);
    }
  })().then((v) => (serverKnown = v));
  return serverAsk;
}

/** The server already said no on this page (LessonFace then renders TutorFace directly, no poster flash). */
export const puppetServerKnownOff = (): boolean => serverKnown === false && !puppetForcedOn();

/** Tests only: forget the server's answer. */
export function resetPuppetServerFlag(): void {
  serverAsk = null;
  serverKnown = null;
}
