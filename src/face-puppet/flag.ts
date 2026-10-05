// `face.puppet2d`: the style-C 2D puppet is the lesson face. Default ON (owner 2026-10-05: "ship the 2D style-C puppet
// at 4.0 now, keep polishing to 4.5"; VALUES-100 V4 item 2). Presentation only: the AI disclosure, the audio floor and
// every safety surface are identical on both paths.
// Resolution, first hit wins:
//   1. `?puppet=0|1|default` in any URL (persisted to this device, like ?facerig=);
//   2. localStorage "tx.flag.face.puppet2d" = "0" | "1";
//   3. VITE_FACE_PUPPET2D = "0" at build time turns the deploy default off;
//   4. on.
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
