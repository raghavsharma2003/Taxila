// Whiteboard inks per ground (W2-B). The board is the app's chalkboard (--board #1F3B30, --chalk #F5F2E8 in
// src/styles/tokens.css); the frame has no app tokens, so the hex values are written here and the Studio renderer
// reads the same table. Never red for a mistake (PRODUCT-DESIGN-V2 §4.5: "not yet" is a dotted underline): `mark` is a
// warm orange used for attention, `good` a soft green for a tick.
import { DEFAULT_THEME, themeOf, type ThemeName } from "../../theme/palette.ts";
export type Ground = "chalk" | "paper" | "grid";
export type Ink = "chalk" | "accent" | "ink" | "mark" | "good" | "soft";

/** round 8 (board grammar): the roles an op may carry (shared/whiteboard.js ROLE). slot and answer share one colour and
 *  differ by SHAPE (a dashed box vs a tick / ring); focus is an outline plus a tint; mixup always a dashed line; muted is
 *  lighter ink. A theme owns only these colours: the shapes are the role's (the meaning survives greyscale). */
export type Role = "focus" | "slot" | "answer" | "mixup" | "muted";
export interface Palette { ground: string; edge: string; grid?: string; ink: Record<Ink, string>; fillAlpha: number; role?: Record<Role, string>; fills?: { focus: string; answer: string } }
/** A role's colour on a palette (one without role colours — an older skin — falls back to its nearest ink). */
export function roleColor(pal: Palette, role: Role): string {
  return pal.role?.[role] ?? pal.ink[role === "focus" ? "accent" : role === "mixup" ? "mark" : role === "muted" ? "soft" : "good"];
}

/** The board's palette for a script's ground under a theme (src/theme/palette.ts holds every value; night is today's
 *  look: chalk is the green chalkboard, paper and grid the warm paper). */
export function paletteFor(ground: Ground, theme: ThemeName | string = DEFAULT_THEME): Palette {
  const b = themeOf(theme).board[ground] ?? themeOf(theme).board.paper;
  return { ground: b.ground, edge: b.edge, fillAlpha: b.fillAlpha, ink: { ...b.ink }, role: { ...b.role }, ...(b.grid ? { grid: b.grid } : {}), ...(b.fills ? { fills: { ...b.fills } } : {}) };
}
/** A role's designed fill tint on a palette that has them (focus; slot and answer share the answer tint), else null. */
export function roleFill(pal: Palette, role: Role | undefined): string | null {
  if (!pal.fills || !role) return null;
  return role === "focus" ? pal.fills.focus : role === "slot" || role === "answer" ? pal.fills.answer : null;
}
/** The board's faces are no longer a system handwriting face: round 8 (board grammar item 7) draws a numeral face and a word
 *  face, self-hosted (faces.css; shared/whiteboard.js TEXT_FACES, the same table the fit measures with). */

/**
 * r4 (owner directive "modern, futuristic, Gen-Alpha", main session 2026-10-10): the board under the Kaksha skin. The
 * colours are KAKSHA'S tokens (src/ui-v3/kaksha/tokens.css, --k-*), read at runtime from where the board mounts: this
 * file holds no colour of its own for it (one palette source). Roles (settled with U1/K): ground --k-deep, a thin glow
 * edge --k-line-2 (no wooden frame), grid --k-line, text and strokes --k-ink, soft --k-ink-3, the emphasised quantity
 * --k-ion, attention --k-look (Kaksha: "look again", never red, never a verdict; --k-her is hers alone), a tick --k-secure; the product's sans for words, Kaksha's mono for numbers. Every ground
 * (chalk, paper, grid) takes the skin's one ground; grid keeps its lines. → null when the tokens are not present.
 * (round 8 item 7: font / numFont are read but no longer drawn on the board: the board's own faces, shared/whiteboard.js
 * TEXT_FACES, under every skin, so what the fit measures is what is drawn)
 */
export interface BoardSkin { palette: Palette; font: string; numFont: string }
export const K_BOARD_VARS = ["--k-deep", "--k-line", "--k-line-2", "--k-ink", "--k-ink-3", "--k-ion", "--k-look", "--k-secure", "--k-sans", "--k-mono"] as const;
export function kakshaBoardSkin(read: (name: string) => string, ground: Ground): BoardSkin | null {
  const v = (n: string) => String(read(n) ?? "").trim();
  if (!v("--k-deep") || !v("--k-ink")) return null;
  const palette: Palette = {
    ground: v("--k-deep"), edge: v("--k-line-2"), fillAlpha: 0.3,
    ink: { chalk: v("--k-ink"), ink: v("--k-ink"), accent: v("--k-ion"), mark: v("--k-look"), good: v("--k-secure"), soft: v("--k-ink-3") },
    role: { focus: v("--k-ion"), slot: v("--k-secure"), answer: v("--k-secure"), mixup: v("--k-look"), muted: v("--k-ink-3") },
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
  mo.observe(doc.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-ktheme", "data-klook", "data-skin", "data-board-theme"] });
  return () => mo.disconnect();
}
