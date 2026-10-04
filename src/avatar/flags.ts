// Face feature flags. `face.rig` (default OFF, BUILD-PLAN W1-F item 1): the lesson face is the licensed / pipeline
// GLB rig with its own rendered plate as tier D, instead of the procedural head and the code-drawn SVG plate.
//
// Resolution, first hit wins (`?facerig=1|0|default` in any URL writes 1. for this device, so the owner can see the
// rig for O1 without DevTools; it is honoured in production on purpose: it is exactly as reachable as the
// localStorage key it writes, and the flag is presentation-only):
//   1. localStorage "tx.flag.face.rig" = "1" | "0": per device. The production acceptance test (and the owner, for
//      the side-by-side) turns the rig on this way for test accounts only; it never needs a deploy.
//   2. VITE_FACE_RIG=1 at build time: the deploy-wide default (W2-D turns it on after the owner's pick, O1).
//   3. off.
// It is a presentation choice, never a safety or data switch: the AI disclosure and the audio floor are identical on
// both paths. A remote per-account flag needs a server field (not in this stream's paths): see the W1-F inbox entry.
export const FACE_RIG_KEY = "tx.flag.face.rig";

/** Apply a `?facerig=` URL switch once per page (persisted, so it survives navigation inside the SPA). */
let urlApplied = false;
function applyUrlSwitch(): void {
  if (urlApplied) return;
  urlApplied = true;
  try {
    if (typeof location === "undefined") return;
    const v = new URLSearchParams(location.search).get("facerig");
    if (v === "1" || v === "on") setFaceRig(true);
    else if (v === "0" || v === "off") setFaceRig(false);
    else if (v === "default") setFaceRig(null);
  } catch {
    /* no URL / storage */
  }
}

export function faceRigEnabled(): boolean {
  applyUrlSwitch();
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(FACE_RIG_KEY) : null;
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* storage blocked: fall through to the build default */
  }
  return import.meta.env?.VITE_FACE_RIG === "1";
}

/** Dev / owner helper: turn the flag on or off for this device (null = back to the build default). */
export function setFaceRig(on: boolean | null): void {
  try {
    if (on === null) localStorage.removeItem(FACE_RIG_KEY);
    else localStorage.setItem(FACE_RIG_KEY, on ? "1" : "0");
  } catch {
    /* storage blocked */
  }
}
