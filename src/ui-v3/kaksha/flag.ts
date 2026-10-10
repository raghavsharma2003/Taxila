// The `ui.kaksha` flag (BUILD-SPEC §3; default OFF). Off: the child surface renders exactly as today. On: the child
// Home and World routes render the Kaksha screens (patch K-P8 to src/child/routes.tsx). Presentation only: never a
// safety or data switch (the AI disclosure, helplines and every server truth are identical on both paths).
//
// Resolution, first hit wins (the same pattern as src/ui-v3/flag.ts and src/face-puppet/flag.ts):
//   1. `?ui=kaksha` / `?ui=classic` in any URL writes the device key below, once per page (`?ui=default` clears it);
//   2. localStorage "tx.flag.ui.kaksha" = "1" | "0" (per device: the owner cohort and the acceptance harness);
//   3. VITE_UI_KAKSHA=1 at build time (only after BUILD-SPEC §11 and the five-second child test, K-O4);
//   4. off.
// The server cohort switch (TAXILA_UI_KAKSHA via /api/face/config-style config) is a later patch, not K0.
export const UI_KAKSHA_KEY = "tx.flag.ui.kaksha";

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

export function kakshaEnabled(): boolean {
  applyUrlSwitch();
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(UI_KAKSHA_KEY) : null;
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* storage blocked */
  }
  return kakshaBuildDefault();
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
