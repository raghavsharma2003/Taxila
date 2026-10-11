// The `ui.kaksha` flag. Release 11 (dc-r4-volt-everywhere, owner 2026-10-11): Kaksha + Volt is THE child app, for
// every account, in every build. There is no cohort gate any more: GET /api/me's ui.kaksha (TAXILA_UI_KAKSHA, K-P10) is
// still read but no longer needed, so the server cohort is harmless. Presentation only: never a safety or data switch
// (the AI disclosure, helplines and every server truth are identical on both paths).
//
// The one way out is per device: `?ui=classic` in any URL writes the device key below ("0"), once per page, and today's
// classic child app renders on that device until `?ui=default` (or `?ui=kaksha`) clears it. No settings UI.
// Release 11: the device key is versioned, so every device starts on the shipped default (a device that tried
// ?ui=classic under release 9's test guide would otherwise keep classic). The pre-release-11 key is ignored and removed
// on first read; ?ui=classic / ?ui=default work exactly as before from then on.
export const UI_KAKSHA_KEY = "tx.flag.ui.kaksha.r11";
export const UI_KAKSHA_KEY_OLD = "tx.flag.ui.kaksha";

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
  // ?ui=classic on this device is the escape hatch; otherwise Kaksha, for every account (release 11). The server's cohort
  // answer, the build default and dev/prod no longer change the outcome (kept in the inputs for the tests that pin it).
  return i.device !== false;
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
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(UI_KAKSHA_KEY_OLD) !== null) localStorage.removeItem(UI_KAKSHA_KEY_OLD);
  } catch {
    /* storage blocked */
  }
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
