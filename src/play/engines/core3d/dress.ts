// The base dress (CORE-API §0, FEASIBILITY §3.2 step 3): code rules, no model. The theme rotates and is never the same
// twice running; wrapper and pace follow the engine defaults; music is calm (dressFor turns it off for classes 4-5 unless
// the child turned it on); the teacher's move is "ghost-first" for a child's first level of a skill, else "notice". The
// model's delta (server/play/dress.js) may only change these through validateDelta + dressFor. Pure; client and server.
import type { Lang } from "../../../../shared/play.ts";
import { DRESS_ENUMS, ENGINE_THEMES, type Dress, type EngineId } from "./api.ts";

const h32 = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

export function baseDress(o: { engine: EngineId; key: string; n?: number; lastTheme?: string | null; lang: Lang; firstLevel?: boolean }): Dress {
  const themes = ENGINE_THEMES[o.engine];
  // with a level counter the theme rotates through the pack (never the same twice running); without one, a key hash
  const start = (h32(o.key) + (o.n ?? 0)) % themes.length;
  let theme = themes[start];
  if (theme === o.lastTheme) theme = themes[(start + 1) % themes.length];
  const wrapper = DRESS_ENUMS.wrapper[(h32(`${o.key}:w`) + (o.n ?? 0)) % DRESS_ENUMS.wrapper.length];
  return { theme, wrapper, music: "calm", pace: "steady", teacherMove: o.firstLevel ? "ghost-first" : "notice", lang: o.lang };
}
