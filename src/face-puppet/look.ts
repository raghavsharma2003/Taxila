// Which puppet LOOK this page shows (round 4 stream 5, the look switch; ./assets.ts has the packs). First hit wins:
//   1. `?look=r8|lamp1|default` in any URL, persisted to this device (the same pattern as ?puppet=): the owner's own
//      phone, the acceptance runs and the shot battery;
//   2. the server's TAXILA_FACE_LOOK, from GET /api/face/config (server/face-puppet/config.js), remembered on this device
//      so the next page paints the right face at once;
//   3. DEFAULT_LOOK (r8).
// A COHORT look (assets.ts COHORT_LOOKS) is painted only when the server names it for this signed-in owner account
// (TAXILA_FACE_LOOK_FOR), never from ?look=, and that answer is not remembered on the device.
// A HELD look (assets.ts HELD_LOOKS: lamp1) is never painted from either source; a dev build (or VITE_DEV_ROUTES=1)
// admits one with &heldlook=1 next to ?look= (the shot battery's trial of a pack that has not passed its gate).
// A page never swaps a look it has already painted: faceLookNow() is what the first frame uses; when it is null (first
// visit, no device choice) the face host shows only the backdrop until the server answers (≤ 1.5 s, fail-open → r8).
import { DEFAULT_LOOK, isPuppetLook, type PuppetLook } from "./assets.ts";
import { faceServerConfig, faceServerKnown } from "./flag.ts";

export const LOOK_DEVICE_KEY = "tx.face.look";
export const LOOK_SERVER_KEY = "tx.face.look.server";

const DEV_OK = (() => {
  try {
    return !!import.meta.env?.DEV || import.meta.env?.VITE_DEV_ROUTES === "1";
  } catch {
    return false;
  }
})();
let urlApplied = false;
let heldTrial = false;
function applyUrl(): void {
  if (urlApplied) return;
  urlApplied = true;
  try {
    if (typeof location === "undefined") return;
    const q = new URLSearchParams(location.search);
    heldTrial = DEV_OK && q.get("heldlook") === "1";
    const v = q.get("look");
    if (v === "default") setDeviceLook(null);
    else if (isPuppetLook(v, { held: heldTrial })) setDeviceLook(v);
  } catch {
    /* no URL / storage */
  }
}

const read = (k: string): PuppetLook | null => {
  try {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(k) : null;
    return isPuppetLook(v, { held: heldTrial && k === LOOK_DEVICE_KEY }) ? v : null;
  } catch {
    return null;
  }
};

/** A look the server may name: a live one, or a cohort-only one when the answer says it is for the owner cohort. */
const fromServer = (v: string | null, cohort: boolean): boolean => isPuppetLook(v, { cohort });

/** The device's own choice (?look=), or null. */
export function deviceLook(): PuppetLook | null {
  applyUrl();
  return read(LOOK_DEVICE_KEY);
}

export function setDeviceLook(look: PuppetLook | null): void {
  try {
    if (look === null) localStorage.removeItem(LOOK_DEVICE_KEY);
    else localStorage.setItem(LOOK_DEVICE_KEY, look);
  } catch {
    /* storage blocked */
  }
}

/**
 * The look to paint NOW, synchronously: the device's choice, else the server's answer on this page, else the server's
 * answer remembered from an earlier page; null when none is known yet (wait for faceLook()).
 */
export function faceLookNow(): PuppetLook | null {
  const d = deviceLook();
  if (d) return d;
  const known = faceServerKnown();
  if (known && fromServer(known.look, !!known.cohort)) return known.look as PuppetLook;
  return read(LOOK_SERVER_KEY);
}

/** The look, once the server has answered (or failed open). Remembers the server's answer for the next page. */
export async function faceLook(fetchImpl?: typeof fetch): Promise<PuppetLook> {
  const d = deviceLook();
  if (d) return d;
  const c = await faceServerConfig(fetchImpl);
  if (fromServer(c.look, !!c.cohort)) {
    // a cohort answer depends on who is signed in: never remembered for the next page (the first frame waits instead)
    if (!c.cohort) {
      try {
        localStorage.setItem(LOOK_SERVER_KEY, c.look as string);
      } catch {
        /* storage blocked */
      }
    }
    return c.look as PuppetLook;
  }
  return read(LOOK_SERVER_KEY) ?? DEFAULT_LOOK;
}

/** Tests only. */
export function resetLookForTests(): void {
  urlApplied = false;
  heldTrial = false;
}
