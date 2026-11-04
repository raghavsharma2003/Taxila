// round 7 (D7 stage-first): the teacher's PiP keep-clear zone, LIVE from App's slot element (src/ui-v3/kaksha/lesson/
// StageBody.tsx: [data-stage-slot] carries data-pip-zone="bottom-right" while the PiP shows, "none" otherwise, and
// --pip-zone-w / -h / -right / -bottom, its box in px relative to the slot). StudioStage keeps every piece clear of it.
// No slot element, or "none": nothing is reserved (a wide screen, her face holding the stage, the keyboard up).

/** The zone as a rect in the slot's own coordinates, or null. `slot` is the [data-stage-slot] element (or a stand-in). */
export function readPipZone(slot: { getAttribute(n: string): string | null; style: { getPropertyValue(n: string): string } } | null,
  slotSize: { w: number; h: number }): { x: number; y: number; w: number; h: number } | null {
  if (!slot || slot.getAttribute("data-pip-zone") !== "bottom-right") return null;
  const px = (n: string) => { const v = parseFloat(slot.style.getPropertyValue(n)); return Number.isFinite(v) ? v : NaN; };
  const w = px("--pip-zone-w"), h = px("--pip-zone-h"), right = px("--pip-zone-right"), bottom = px("--pip-zone-bottom");
  if (![w, h, right, bottom].every(Number.isFinite) || w <= 0 || h <= 0) return null;
  return { x: slotSize.w - right - w, y: slotSize.h - bottom - h, w, h };
}

/** A rect moved from the slot's coordinates into the stage's (both measured on screen). */
export function intoStage(zone: { x: number; y: number; w: number; h: number }, slotAt: { left: number; top: number }, stageAt: { left: number; top: number }) {
  return { x: zone.x + slotAt.left - stageAt.left, y: zone.y + slotAt.top - stageAt.top, w: zone.w, h: zone.h };
}
