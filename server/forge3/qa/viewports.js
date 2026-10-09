// The sizes a piece is judged at (forge3 visual QA). The tray boxes are what the child's Desk actually gave a Studio piece
// on taxila.dev (web 145996f, measured by docs/design/round3/forge/audit/harness/walk.mjs, 2026-10-09, Older Desk, Work
// geometry, a 1-2 line question card, no trouble strip): phone 360 x 800 → 328 x 404, phone 412 x 915 → 380 x 519,
// laptop 1366 x 768 → 752 x 408. `tight` is the same 360 phone with a 4-line card and the trouble strip up
// (src/child/lesson/deskLayout.ts solveDesk: cardNeed 230, strip 96 → 328 x 202), the worst case a piece meets on a
// phone today. Play mode (docs/design/round3/play/DESIGN.md §7) gives the world the whole screen minus its chrome.

export const DESK_VIEWPORTS = Object.freeze([
  { vp: "p360", viewport: { width: 360, height: 800 }, tray: { w: 328, h: 404 }, phone: true },
  { vp: "p412", viewport: { width: 412, height: 915 }, tray: { w: 380, h: 519 }, phone: true },
  { vp: "l1366", viewport: { width: 1366, height: 768 }, tray: { w: 752, h: 408 }, phone: false },
]);
export const TIGHT_PHONE = Object.freeze({ vp: "p360-tight", viewport: { width: 360, height: 800 }, tray: { w: 328, h: 202 }, phone: true });

/**
 * Play mode boxes: what the Desk's play mode (play patch 04: the card folds, the tray takes its height) actually gives a
 * play piece's Studio box, measured live in the lesson (tests/prod/round3-forge.mjs, forge measurement copy with play
 * patches 01-05, 2026-10-09 13:2x UTC): 324 x 528 on 360 x 800, 376 x 643 on 412 x 915, 736 x 536 on 1366 x 768. (The first
 * certification used play DESIGN §7's planned worlds, 360 x 576 / 412 x 691 / 1006 x 768, which the shipped Desk does not give.)
 */
export const PLAY_VIEWPORTS = Object.freeze([
  { vp: "p360", viewport: { width: 360, height: 800 }, tray: { w: 324, h: 528 }, phone: true },
  { vp: "p412", viewport: { width: 412, height: 915 }, tray: { w: 376, h: 643 }, phone: true },
  { vp: "l1366", viewport: { width: 1366, height: 768 }, tray: { w: 736, h: 536 }, phone: false },
]);

/** The two sizes every build is judged at before it can reach a child (phone and laptop), plus the 412 phone. */
export const GATE_VIEWPORTS = DESK_VIEWPORTS;

/** A device's box → the nearest judged viewport class (the client reports its stage box; the server picks the verdict). */
export function viewportClassOf(box) {
  const w = Number(box?.w) || 0;
  if (w >= 600) return "l1366";
  if (w >= 370) return "p412";
  return "p360";
}
