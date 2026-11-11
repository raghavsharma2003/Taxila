// Writes the surface attributes on <html> that src/styles/tokens.css keys on: data-band (child bands),
// data-surface="parent" (parent tokens). Fonts are self-hosted and declared in src/styles/fonts.css (loaded by unicode-range);
// nothing here fetches a font.
import { useEffect } from "react";

export type Band = "b1" | "b2" | "b3" | "b4";
/** Class → band: B1 classes 1-2, B2 class 3, B3 4-7, B4 8-9 (r7 D3: class 4 has the older look; src/child/band.ts). */
export { bandForClass } from "../child/band.ts";

/** Set (or clear, with null) the html attributes for the current screen. Restores the previous values on unmount. */
export function useSurface(opts: { band?: Band | null; surface?: "parent" | null }) {
  const { band = null, surface = null } = opts;
  useEffect(() => {
    const el = document.documentElement;
    const prev = { band: el.getAttribute("data-band"), surface: el.getAttribute("data-surface") };
    if (band) el.setAttribute("data-band", band); else el.removeAttribute("data-band");
    if (surface) el.setAttribute("data-surface", surface); else el.removeAttribute("data-surface");
    return () => {
      if (prev.band) el.setAttribute("data-band", prev.band); else el.removeAttribute("data-band");
      if (prev.surface) el.setAttribute("data-surface", prev.surface); else el.removeAttribute("data-surface");
    };
  }, [band, surface]);
}
