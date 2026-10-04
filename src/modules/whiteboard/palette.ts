// Whiteboard inks per ground (W2-B). The board is the app's chalkboard (--board #1F3B30, --chalk #F5F2E8 in
// src/styles/tokens.css); the frame has no app tokens, so the hex values are written here and the Studio renderer
// reads the same table. Never red for a mistake (PRODUCT-DESIGN-V2 §4.5: "not yet" is a dotted underline): `mark` is a
// warm orange used for attention, `good` a soft green for a tick.
export type Ground = "chalk" | "paper" | "grid";
export type Ink = "chalk" | "accent" | "ink" | "mark" | "good" | "soft";

export interface Palette { ground: string; edge: string; grid?: string; ink: Record<Ink, string>; fillAlpha: number }

const CHALK: Palette = {
  ground: "#1F3B30", edge: "#8C6B4A", fillAlpha: 0.32,
  ink: { chalk: "#F5F2E8", ink: "#F5F2E8", accent: "#F2C66D", mark: "#F4A261", good: "#9ED8A6", soft: "#BFD3C6" },
};
const PAPER: Palette = {
  ground: "#FFFBF2", edge: "#D9CDB8", fillAlpha: 0.26,
  ink: { chalk: "#2B2620", ink: "#2B2620", accent: "#1F5FBF", mark: "#C8641A", good: "#2E7D4F", soft: "#8A7F70" },
};

export function paletteFor(ground: Ground): Palette {
  return ground === "chalk" ? CHALK : ground === "grid" ? { ...PAPER, grid: "#E6DCCB" } : PAPER;
}

/** A handwriting face from the system (the frame's CSP allows no web fonts): legible first, hand-made second. */
export const HAND_FONT = '"Segoe Print", "Chalkboard SE", "Comic Sans MS", "Comic Neue", casual, "Noto Sans Devanagari", system-ui, sans-serif';
