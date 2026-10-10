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

/**
 * r4 (owner directive "modern, futuristic, Gen-Alpha", main session 2026-10-10): the board under the Kaksha skin. The
 * colours are KAKSHA'S tokens (src/ui-v3/kaksha/tokens.css, --k-*), read at runtime from where the board mounts: this
 * file holds no colour of its own for it (one palette source). Roles (settled with U1/K): ground --k-deep, a thin glow
 * edge --k-line-2 (no wooden frame), grid --k-line, text and strokes --k-ink, soft --k-ink-3, the emphasised quantity
 * --k-ion, attention --k-look (Kaksha: "look again", never red, never a verdict; --k-her is hers alone), a tick --k-secure; the product's sans for words, Kaksha's mono for numbers. Every ground
 * (chalk, paper, grid) takes the skin's one ground; grid keeps its lines. → null when the tokens are not present.
 */
export interface BoardSkin { palette: Palette; font: string; numFont: string }
export const K_BOARD_VARS = ["--k-deep", "--k-line", "--k-line-2", "--k-ink", "--k-ink-3", "--k-ion", "--k-look", "--k-secure", "--k-sans", "--k-mono"] as const;
export function kakshaBoardSkin(read: (name: string) => string, ground: Ground): BoardSkin | null {
  const v = (n: string) => String(read(n) ?? "").trim();
  if (!v("--k-deep") || !v("--k-ink")) return null;
  const palette: Palette = {
    ground: v("--k-deep"), edge: v("--k-line-2"), fillAlpha: 0.3,
    ink: { chalk: v("--k-ink"), ink: v("--k-ink"), accent: v("--k-ion"), mark: v("--k-look"), good: v("--k-secure"), soft: v("--k-ink-3") },
    ...(ground === "grid" ? { grid: v("--k-line") } : {}),
  };
  return { palette, font: v("--k-sans") || "system-ui, sans-serif", numFont: v("--k-mono") || "ui-monospace, monospace" };
}
/** A number, a fraction or an equation (drawn in the skin's mono face). */
export const isNumeric = (s: string) => /^[\d\s/×÷+\-−=?.,:%()]+$/.test(s) && /\d|\?/.test(s);

/** The board skin of the page the board is drawn in: Kaksha's tokens off the Desk root marked data-skin="kaksha" (K-P2). */
export function boardSkinFromDocument(ground: Ground, doc: Document | undefined = typeof document !== "undefined" ? document : undefined): BoardSkin | null {
  const el = doc?.querySelector('[data-skin="kaksha"]');
  if (!el || typeof getComputedStyle !== "function") return null;
  const cs = getComputedStyle(el);
  return kakshaBoardSkin((n) => cs.getPropertyValue(n), ground);
}

/** Calls `onChange` when Kaksha's theme or look changes on the page (data-ktheme / data-klook on the .kx root; K: a look
 * re-points the same --k-* names), so a board drawn from the resolved tokens is re-read, not left on the old look. */
export function watchSkin(onChange: () => void, doc: Document | undefined = typeof document !== "undefined" ? document : undefined): () => void {
  if (!doc || typeof MutationObserver === "undefined") return () => {};
  const mo = new MutationObserver(onChange);
  mo.observe(doc.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-ktheme", "data-klook", "data-skin"] });
  return () => mo.disconnect();
}
