// Writes the surface attributes on <html> that src/styles/tokens.css keys on: data-band (child bands),
// data-surface="parent" (parent tokens), and loads the band's display fonts on demand (§4.3 budget:
// Mukta is in index.html for every path; Baloo 2 only on the Young path; Andika only for early reading).
import { useEffect } from "react";

export type Band = "b1" | "b2" | "b3" | "b4";
/** Class → band: B1 classes 1-2, B2 3-4, B3 5-7, B4 8-9 (§5.2). */
export const bandForClass = (cl: number): Band => (cl <= 2 ? "b1" : cl <= 4 ? "b2" : cl <= 7 ? "b3" : "b4");

const FONT_URL = {
  baloo: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap",
  andika: "https://fonts.googleapis.com/css2?family=Andika&display=swap",
};
export function ensureFont(which: keyof typeof FONT_URL) {
  if (typeof document === "undefined" || document.querySelector(`link[data-font="${which}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = FONT_URL[which];
  l.dataset.font = which;
  document.head.appendChild(l);
}

/** Set (or clear, with null) the html attributes for the current screen. Restores the previous values on unmount. */
export function useSurface(opts: { band?: Band | null; surface?: "parent" | null }) {
  const { band = null, surface = null } = opts;
  useEffect(() => {
    const el = document.documentElement;
    const prev = { band: el.getAttribute("data-band"), surface: el.getAttribute("data-surface") };
    if (band) el.setAttribute("data-band", band); else el.removeAttribute("data-band");
    if (surface) el.setAttribute("data-surface", surface); else el.removeAttribute("data-surface");
    if (band === "b1" || band === "b2") ensureFont("baloo");
    return () => {
      if (prev.band) el.setAttribute("data-band", prev.band); else el.removeAttribute("data-band");
      if (prev.surface) el.setAttribute("data-surface", prev.surface); else el.removeAttribute("data-surface");
    };
  }, [band, surface]);
}
