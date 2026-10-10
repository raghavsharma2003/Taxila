// Which Kaksha look renders, per band family (owner directive 2026-10-10: "Beautiful UI UX we need, which engages Gen
// Alphas"; the direction pass, docs/design/round4/build/kaksha/futurist/). Kaksha itself is behind ui.kaksha (the owner
// cohort), so this is what the cohort sees. The main session's pick (2026-10-10): **Volt for both families**, Holo as the
// alternate. The owner compares them live with a per-device switch, the ?ui= pattern: ?look=holo | ?look=volt writes the
// device key below (once per page), ?look=default clears it. No settings UI. Dev builds also take ?look=classic.
import type { KLook } from "./tokens.ts";

export type { KLook };

export type Family = "young" | "older";

/** The shipped look per family. Changing it is the main session's pick, in code. */
export const KAKSHA_LOOK: Record<Family, KLook> = { young: "volt", older: "volt" };

export const LOOK_KEY = "tx.flag.ui.klook";

function isDev(): boolean {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
}

let urlApplied = false;
/** The device's own choice: ?look= once per page writes it; then the device key. Classic only in dev builds. */
function devLook(): KLook | null {
  const ok = (v: string | null): v is KLook => v === "holo" || v === "volt" || (v === "classic" && isDev());
  try {
    if (!urlApplied && typeof location !== "undefined") {
      urlApplied = true;
      const v = new URLSearchParams(location.search).get("look");
      if (v === "default") localStorage.removeItem(LOOK_KEY);
      else if (ok(v)) localStorage.setItem(LOOK_KEY, v);
    }
    const d = typeof localStorage !== "undefined" ? localStorage.getItem(LOOK_KEY) : null;
    return ok(d) ? d : null;
  } catch {
    return null;
  }
}
/** Tests only. */
export function _resetLookUrlForTests(): void { urlApplied = false; }

/** The look for this family: the device's ?look= choice for every family, else KAKSHA_LOOK. */
export function kakshaLook(family: Family): KLook {
  return devLook() ?? KAKSHA_LOOK[family];
}

/** A futurist look is on (either look; the shared futurist pieces: base, copy, earned moment, loadout). */
export function futurist(): boolean {
  const d = devLook();
  if (d) return d !== "classic";
  return KAKSHA_LOOK.young !== "classic" || KAKSHA_LOOK.older !== "classic";
}

/** The attribute value on a `.kx` root (and ChildShell's root under Kaksha): none for classic, so classic CSS is untouched. */
export const lookAttr = (family: Family): string | undefined => {
  const l = kakshaLook(family);
  return l === "classic" ? undefined : l;
};
