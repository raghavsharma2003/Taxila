// The `ui.v3` flag (RESET-PLAN §3.1 step 5 flag table; default OFF). With it off the Wave 2 screens render exactly as
// integrated; with it on, the app router (PATCH: docs/design/reset/prework/rs1/patches/01-router-ui-v3.patch) mounts the
// src/ui-v3/screens/** components instead.
//
// Resolution, first hit wins (mirrors src/avatar/flags.ts so owners learn one pattern):
//   1. `?uiv3=1|0|default` in any URL writes (or clears) the device key below, once per page;
//   2. localStorage "tx.flag.ui.v3" = "1" | "0" (per device: the acceptance harness and the owner switch it this way);
//   3. VITE_UI_V3=1 at build time (the deploy-wide default, switched on only after RS-1 acceptance holds on staging);
//   4. off.
// Presentation only: never a safety or data switch. The AI disclosure, helplines and audio floor are identical on both paths.
export const UI_V3_KEY = "tx.flag.ui.v3";

let urlApplied = false;
function applyUrlSwitch(): void {
  if (urlApplied) return;
  urlApplied = true;
  try {
    if (typeof location === "undefined") return;
    const v = new URLSearchParams(location.search).get("uiv3");
    if (v === "1" || v === "on") setUiV3(true);
    else if (v === "0" || v === "off") setUiV3(false);
    else if (v === "default") setUiV3(null);
  } catch {
    /* no URL / storage */
  }
}

/** Build-time default, read through a function so tests can stub it. */
export function buildDefault(): boolean {
  try {
    return import.meta.env?.VITE_UI_V3 === "1";
  } catch {
    return false;
  }
}

export function uiV3Enabled(): boolean {
  applyUrlSwitch();
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(UI_V3_KEY) : null;
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* storage blocked: fall through to the build default */
  }
  return buildDefault();
}

/** Turn the flag on or off for this device (null = back to the build default). */
export function setUiV3(on: boolean | null): void {
  try {
    if (on === null) localStorage.removeItem(UI_V3_KEY);
    else localStorage.setItem(UI_V3_KEY, on ? "1" : "0");
  } catch {
    /* storage blocked */
  }
}

/** Test hook: let a later uiV3Enabled() re-read the URL. */
export function _resetUrlSwitchForTests(): void {
  urlApplied = false;
}
