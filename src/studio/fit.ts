// The Studio stage box (owner priority 4: anything built appears INSIDE its stage area, sized to fit, never overflowing).
// W2 seam commit; OWNED BY W2-H. Pure: the largest box with the artifact's aspect that fits the available area, whole
// pixels, centred. Every Studio artifact (whiteboard script, frame build, skeleton, image) renders into this box in its
// own design units, so a 360 x 800 phone and a desktop show the same piece, scaled, with nothing outside the tray.
import type { StageSize } from "../../shared/studio.ts";

export interface StageBox { w: number; h: number }
export interface StageFit {
  /** The box, in CSS px (whole pixels; never larger than the available area minus the inset). */
  w: number; h: number;
  /** Its offset inside the available area (centred). */
  x: number; y: number;
  /** CSS px per design unit. */
  scale: number;
}

/** A design size the stage accepts: positive, finite, within 100-4000 units a side; anything else is the default. */
export function validStage(size: StageSize | undefined, fallback: StageSize): StageSize {
  const ok = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 100 && n <= 4000;
  return size && ok(size.w) && ok(size.h) ? size : fallback;
}

/**
 * Contain-fit `design` into `avail` with `inset` px kept free on every side. `maxScale` caps upscaling (a 400-unit
 * board on a 1920 px desktop tray stays legible without becoming poster-sized). An area with no room gives a 0 x 0 box.
 */
export function fitStage(avail: StageBox, design: StageSize, { inset = 0, maxScale = Infinity }: { inset?: number; maxScale?: number } = {}): StageFit {
  const aw = Math.max(0, Math.floor(avail.w) - 2 * inset);
  const ah = Math.max(0, Math.floor(avail.h) - 2 * inset);
  if (!aw || !ah || design.w <= 0 || design.h <= 0) return { w: 0, h: 0, x: 0, y: 0, scale: 0 };
  const scale = Math.min(aw / design.w, ah / design.h, maxScale);
  const w = Math.min(aw, Math.floor(design.w * scale));
  const h = Math.min(ah, Math.floor(design.h * scale));
  return { w, h, x: inset + Math.floor((aw - w) / 2), y: inset + Math.floor((ah - h) / 2), scale };
}
