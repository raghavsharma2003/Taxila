// round 7 (D7 stage-first): where the teacher's PiP sits INSIDE the slot (a phone, or a phone turned on its side), the
// bottom-right square it covers: the box contract's stageFirst.pipZone (26 % of the slot's short side, 84-128 px, inset 8),
// the same rule as src/ui-v3/kaksha/lesson/stageLayout.ts pipFor. StudioStage keeps every piece clear of it.
// A phone is read from the VIEWPORT, never the slot: a desk's tray can be short too (l1366: 752 x 408) and has no PiP in it.

/** A viewport this narrow is a phone held upright; this short, a phone turned on its side. */
const PHONE_MAX_W = 600;
const PHONE_MAX_H = 500;

const viewportNow = (): { w: number; h: number } | null =>
  typeof window !== "undefined" && Number.isFinite(window.innerWidth) ? { w: window.innerWidth, h: window.innerHeight } : null;

/** The PiP's square plus its inset (px), or 0 where the PiP is outside the slot (a wide screen: her tile is beside it). */
export function pipZoneFor(avail: { w: number; h: number }, viewport: { w: number; h: number } | null = viewportNow()): number {
  if (!viewport || (viewport.w > PHONE_MAX_W && viewport.h > PHONE_MAX_H)) return 0;
  return Math.round(Math.min(128, Math.max(84, Math.min(avail.w, avail.h) * 0.26))) + 8;
}
