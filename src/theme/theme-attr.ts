// How a lesson's theme reaches the board and the Studio engines (main 2026-11-11). Boards and game specs are drawn in
// the browser from colour-free data (a board script names a ground — chalk, paper, grid — and roles; a spec names none),
// so the server sends nothing per theme and nothing cached is keyed by it. The app marks the element the lesson renders
// in with data-board-theme="paper" | "night"; the board and every engine mounted under it read the nearest one. No
// attribute: night, today's look.
import { DEFAULT_THEME, themeOf, type ThemeName } from "./palette.ts";
export const THEME_ATTR = "data-board-theme";
export function themeAt(el: Element | null | undefined): ThemeName {
  const v = el?.closest?.(`[${THEME_ATTR}]`)?.getAttribute(THEME_ATTR);
  return v ? themeOf(v).name : DEFAULT_THEME;
}
