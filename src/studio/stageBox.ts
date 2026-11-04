// The stage box: where a Studio piece sits inside the tray, and (round 7, D7 stage-first) how it keeps clear of the
// teacher's PiP. Pure, so the box rules are tested without a browser (tests/r7-board-table.test.mjs).
//   board / explainer: lifted above the PiP where there is room, else fitted into the room above it.
//   play (keepWhole): never moved or shrunk for the PiP (a play box below MIN_BOX 300 x 440 mounts the text twin: C2
//   Games, p360). The PiP may overlap its bottom-right corner; pipKeepFor gives that corner to the play view, which
//   lays itself out around it.
import { fitStage, type StageFit } from "./fit.ts";

/** Px kept free between the box and the tray edge, so a piece never touches the rounded tray corners. */
export const STAGE_INSET = 8;
/** On a phone-width tray every px goes to the piece (round 3 forge: a 16:10 world is width-bound at 328 px). */
export const STAGE_INSET_PHONE = 2;
export const PHONE_TRAY_MAX_W = 420;
/** Upscale cap: a 400-unit piece on a wide desktop tray stays a picture, not a poster. */
export const MAX_SCALE = 3;
/** The px kept free around the box for a stage of this width (phone-width trays give the piece every px). */
export const insetFor = (w: number) => (w <= PHONE_TRAY_MAX_W ? STAGE_INSET_PHONE : STAGE_INSET);

export type Rect = { x: number; y: number; w: number; h: number };

/** The stage box for a design in the measured area; with the rail band, the box grows by the band above the world. */
export function boxFor(avail: { w: number; h: number }, design: { w: number; h: number }, railPx: number, pip: Rect | null = null,
  { keepWhole = false }: { keepWhole?: boolean } = {}): StageFit {
  const inset = insetFor(avail.w);
  let next = fitStage({ w: avail.w, h: avail.h - railPx }, design, { inset, maxScale: MAX_SCALE });
  if (railPx > 0 && next.w > 0) next = { ...next, h: next.h + railPx, y: Math.max(inset, Math.floor((avail.h - next.h - railPx) / 2)) };
  if (keepWhole) return next;
  // the piece never sits under her PiP (App's live zone, pipZone.ts): lifted above it where there is room, else fitted into
  // the room above it
  const hits = (b: StageFit) => !!pip && b.x < pip.x + pip.w && pip.x < b.x + b.w && b.y < pip.y + pip.h && pip.y < b.y + b.h;
  if (pip && next.w > 0 && hits(next)) {
    const room = pip.y;
    if (next.h <= room - inset) next = { ...next, y: Math.max(inset, Math.floor(room - next.h)) };
    else {
      const fitted = fitStage({ w: avail.w, h: room }, design, { inset, maxScale: MAX_SCALE });
      if (fitted.w > 0 && fitted.y + fitted.h <= room + 0.5) next = { ...fitted, y: Math.min(fitted.y, Math.max(inset, Math.floor(room - fitted.h))) };
    }
  }
  return next;
}

/**
 * The bottom-right corner of `box` the PiP covers, in the box's own px (from the PiP's left / top edge to the box's right /
 * bottom edge), or null when the PiP does not overlap the box. The play view keeps this corner clear (C2 Games).
 */
export function pipKeepFor(box: Rect, pip: Rect | null): { w: number; h: number } | null {
  if (!pip) return null;
  const ox = Math.min(box.x + box.w, pip.x + pip.w) - Math.max(box.x, pip.x);
  const oy = Math.min(box.y + box.h, pip.y + pip.h) - Math.max(box.y, pip.y);
  if (ox <= 0 || oy <= 0) return null;
  return { w: Math.min(box.w, Math.ceil(box.x + box.w - pip.x)), h: Math.min(box.h, Math.ceil(box.y + box.h - pip.y)) };
}
