// The hands-free duplex switch (p1-duplex, owner-ship-five-2026-10-05: "ship it", ON by default, behind a kill switch, with
// today's cascade path as the automatic fallback). Resolution, first hit wins:
//   1. `?duplex=1|0|shadow|default` in any URL writes (or clears) the device key below (the owner's test switch);
//   2. localStorage "tx.flag.duplex" = "1" | "0" | "shadow";
//   3. the server's runtime kill switch: GET /api/duplex/config → { duplex: "on" | "off" | "shadow" } (env TAXILA_DUPLEX on the
//      Container App, no rebuild; round 3: "on" for the owner-test cohort TAXILA_DUPLEX_LIVE_FOR while everyone else is
//      "shadow"). Round 3 (duplex, 2026-10-09): when the route is missing, slow (3 s) or errors the lesson runs SHADOW (the
//      engine only logs; the child gets today's path), never live: production is shadow because the switch criteria are not
//      met (docs/design/round3/duplex/CRITERIA.md), and a network hiccup must not turn an unproven floor on for a child. Before,
//      it failed OPEN to the build default "on". A build default "off" still wins;
//   4. VITE_DUPLEX = "0" | "shadow" at build time;
//   5. on (only when the server answered and did not say otherwise).
// A device forced on (1) is not overridden by the server switch; a device forced off (0) always wins.
// Presentation and turn-taking only: the safety floor (scanSafety + the model distress read on every committed turn, the AI
// disclosure, the helplines) is identical on both sides of it.
export type DuplexMode = "on" | "off" | "shadow";
export const DUPLEX_KEY = "tx.flag.duplex";
// round 3: 1,500 → 3,000 ms. An unreadable switch now runs shadow, so the owner cohort must not lose to a slow answer: under
// load the route's answer (with the cohort's guardian lookup) took > 1.5 s on a local production server while a lesson
// started (2026-10-09). The engine only starts once the transcription call is up, so the longer wait is never on screen.
// round 3 fix (experience B9): 3,000 → 8,000 ms, two tries, an unknown answer never cached, and the page asks early (the
// child shell prefetches it). 1 of 3 owner lesson starts ran tap-to-talk with no sign of why: the request went out beside
// the lesson start, hit the 3 s abort, and the null was cached for the page. The wait costs nothing on screen: the engine
// starts only once the transcription call is up, and a lesson that began on tap-to-talk switches to hands-free when the
// answer lands (cascadeLink startDuplex → setPushToTalk(false)).
const CONFIG_TIMEOUT_MS = 8000;
const CONFIG_TRIES = 2;

const norm = (v: unknown): DuplexMode | null => (v === "1" || v === "on" ? "on" : v === "0" || v === "off" ? "off" : v === "shadow" ? "shadow" : null);

let urlApplied = false;
function applyUrl(): void {
  if (urlApplied) return;
  urlApplied = true;
  try {
    if (typeof location === "undefined") return;
    const v = new URLSearchParams(location.search).get("duplex");
    if (v === "default") localStorage.removeItem(DUPLEX_KEY);
    else if (norm(v)) localStorage.setItem(DUPLEX_KEY, v === "on" ? "1" : v === "off" ? "0" : String(v));
  } catch {
    /* no URL / storage blocked */
  }
}

/** The per-device override, or null. */
export function deviceDuplex(): DuplexMode | null {
  applyUrl();
  try {
    return typeof localStorage !== "undefined" ? norm(localStorage.getItem(DUPLEX_KEY)) : null;
  } catch {
    return null;
  }
}

/** The build default (VITE_DUPLEX), on unless set to 0 / off / shadow. */
export function buildDuplex(): DuplexMode {
  try {
    return norm(import.meta.env?.VITE_DUPLEX) ?? "on";
  } catch {
    return "on";
  }
}

let serverMode: Promise<DuplexMode | null> | null = null;
/** One ask: a definite mode, null for a definite unknown value, or undefined to try again (error, timeout, "retry"). */
async function askOnce(fetcher: typeof fetch): Promise<DuplexMode | null | undefined> {
  try {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => ctl?.abort(), CONFIG_TIMEOUT_MS);
    try {
      const res = await fetcher("/api/duplex/config", { signal: ctl?.signal, credentials: "same-origin" });
      if (!res.ok) return undefined;
      const j = (await res.json()) as { duplex?: unknown; retry?: unknown };
      // the server could not finish the cohort lookup in time: it says so instead of a silent "shadow"
      if (j?.retry === true) return undefined;
      return norm(j?.duplex);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return undefined;
  }
}
/**
 * The server's runtime kill switch (one answer per page). null = unknown (missing route, timeout, error) after CONFIG_TRIES
 * asks: the lesson runs shadow. An unknown is never cached: the next lesson on the page asks again.
 */
export function serverDuplex(fetcher: typeof fetch = fetch): Promise<DuplexMode | null> {
  if (serverMode) return serverMode;
  const p = (async () => {
    for (let i = 0; i < CONFIG_TRIES; i++) {
      const v = await askOnce(fetcher);
      if (v !== undefined) return v;
    }
    return null;
  })();
  serverMode = p;
  void p.then((v) => { if (v === null && serverMode === p) serverMode = null; });
  return p;
}
/** Ask the server early (the child shell, before any lesson starts), so a lesson start never waits on it. */
export function prefetchDuplexConfig(): void {
  try { if (typeof fetch !== "undefined") void serverDuplex(); } catch { /* never on a child screen's path */ }
}

/** The mode for a lesson starting now. */
export async function resolveDuplexMode(fetcher?: typeof fetch): Promise<DuplexMode> {
  const dev = deviceDuplex();
  if (dev === "off" || dev === "on") return dev;
  const srv = await serverDuplex(fetcher);
  if (srv === "off") return "off";
  if (srv === null) return buildDuplex() === "off" ? "off" : "shadow";
  if (dev === "shadow" || srv === "shadow") return "shadow";
  return srv;
}

/** Tests: forget the per-page caches. */
export function resetDuplexFlagCache(): void {
  urlApplied = false;
  serverMode = null;
}
