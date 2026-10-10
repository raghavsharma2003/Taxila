// The `ui.kaksha` flag (BUILD-SPEC §3; default OFF). Off: the child surface renders exactly as today. On: the child
// Home and World routes render the Kaksha screens (patch K-P8 to src/child/routes.tsx). Presentation only: never a
// safety or data switch (the AI disclosure, helplines and every server truth are identical on both paths).
//
// Resolution, first hit wins (the same pattern as src/ui-v3/flag.ts and src/face-puppet/flag.ts):
//   1. `?ui=kaksha` / `?ui=classic` in any URL writes the device key below, once per page (`?ui=default` clears it);
//   2. localStorage "tx.flag.ui.kaksha" = "1" | "0" (per device: the owner cohort and the acceptance harness);
//   3. VITE_UI_KAKSHA=1 at build time (only after BUILD-SPEC §11 and the five-second child test, K-O4);
//   4. off.
//
// PRODUCTION GATE (K-P10, main session 2026-10-10): in a production build steps 1-2 count ONLY when the server says this
// account is in the owner cohort (GET /api/me → ui.kaksha, from TAXILA_UI_KAKSHA hashed accounts; server/ui/kaksha-cohort.js).
// Anyone else who types ?ui=kaksha keeps today's Home. In dev builds the URL / device switch stays free.
export const UI_KAKSHA_KEY = "tx.flag.ui.kaksha";

export interface KakshaInputs {
  /** A dev build (import.meta.env.DEV). */
  dev: boolean;
  /** VITE_UI_KAKSHA=1: the deploy-wide default (only after BUILD-SPEC §11 and the child test). */
  buildDefault: boolean;
  /** GET /api/me ui.kaksha: this account is in the owner cohort. Undefined while /api/me has not answered. */
  server: boolean | undefined;
  /** The device's own switch (?ui=kaksha / localStorage): true on, false off, null not set. */
  device: boolean | null;
}

/** The whole rule, pure (tests/r4-kaksha-cohort.test.mjs). */
export function kakshaDecision(i: KakshaInputs): boolean {
  if (i.device === false) return false; // ?ui=classic always wins on this device
  if (i.buildDefault) return true;
  if (i.dev) return i.device === true;
  return i.server === true && i.device === true;
}

function isDev(): boolean {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
}

/** The device switch alone (after applying any ?ui= in the URL). */
export function kakshaDevice(): boolean | null {
  applyUrlSwitch();
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(UI_KAKSHA_KEY) : null;
    return v === "1" ? true : v === "0" ? false : null;
  } catch {
    return null;
  }
}

let urlApplied = false;
function applyUrlSwitch(): void {
  if (urlApplied) return;
  urlApplied = true;
  try {
    if (typeof location === "undefined") return;
    const v = new URLSearchParams(location.search).get("ui");
    if (v === "kaksha") setKaksha(true);
    else if (v === "classic") setKaksha(false);
    else if (v === "default") setKaksha(null);
  } catch {
    /* no URL / storage */
  }
}

export function kakshaBuildDefault(): boolean {
  try {
    return import.meta.env?.VITE_UI_KAKSHA === "1";
  } catch {
    return false;
  }
}

/** Is Kaksha on for this render? `server` is /api/me's ui.kaksha (the owner cohort). */
export function kakshaEnabled(server?: boolean): boolean {
  return kakshaDecision({ dev: isDev(), buildDefault: kakshaBuildDefault(), server, device: kakshaDevice() });
}

export function setKaksha(on: boolean | null): void {
  try {
    if (on === null) localStorage.removeItem(UI_KAKSHA_KEY);
    else localStorage.setItem(UI_KAKSHA_KEY, on ? "1" : "0");
  } catch {
    /* storage blocked */
  }
}

export function _resetKakshaUrlForTests(): void {
  urlApplied = false;
}
