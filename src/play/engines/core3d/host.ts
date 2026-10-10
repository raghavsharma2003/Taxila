// Host-side helpers for core3d (PlayStage): the teacher-speaking window event, the engine load budget, and the child's
// music preference (the one G5-whitelisted key an engine path may persist: a preference, never a counter).
import type { Core3D, EngineDeps, EngineView } from "./api.ts";

/** The window event the lesson runtime dispatches when the teacher starts / stops speaking (detail: { on: boolean });
 *  docs/design/round4/build/games-core/patches/01-teacher-speaking-event.diff */
export const TEACHER_SPEAKING = "taxila:teacher-speaking";
/** Past this the engine chunk is not waited for: the 2D view of the same law plays (never a blank stage) */
export const ENGINE_LOAD_MS = 2500;
export type EngineModule = { create(core: Core3D, deps: EngineDeps): EngineView };

/** G5 whitelist: the economy lint allows exactly this storage key in engine code */
export const MUSIC_KEY = "taxila.play.music";
export function musicPref(): "on" | "off" | null {
  try { const v = localStorage.getItem(MUSIC_KEY); return v === "on" || v === "off" ? v : null; } catch { return null; }
}
export function setMusicPref(v: "on" | "off"): void { try { localStorage.setItem(MUSIC_KEY, v); } catch { /* private mode */ } }
