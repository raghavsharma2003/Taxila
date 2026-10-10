// The Work tray box this device gives a piece (round 4 content). Pure: the same solver the Desk lays itself out with
// (deskLayout.ts solveDesk, Work geometry), so the server's certificate gate (server/forge3/tray-gate.js) judges the box
// the child's screen actually has. Phone: the column minus its 16 dp gutters; wide: the right column's tray. A play
// piece's box (play mode) is the same call with `play`.
import { solveDesk } from "./deskLayout.ts";
import type { Family } from "../band.ts";

export interface TrayBox { w: number; h: number }

export function workTrayBox(size: { w: number; h: number; fontScale?: number; cardNeed?: number }, family: Family, opts: { captionsOn?: boolean; play?: boolean } = {}): TrayBox | null {
  if (!(size.w > 0) || !(size.h > 0)) return null;
  const l = solveDesk({ width: size.w, height: size.h, family, geometry: "work", fontScale: size.fontScale ?? 1, captionsOn: opts.captionsOn ?? true,
    strip: 0, cardNeed: opts.play ? 0 : size.cardNeed, play: !!opts.play });
  if (l.kind === "phone" && l.phone) return { w: Math.max(0, Math.round(size.w - 32)), h: Math.round(l.phone.tray) };
  if (l.kind === "wide" && l.wide) return { w: Math.round(l.wide.rightW), h: Math.round(l.wide.right.tray) };
  return null;
}
