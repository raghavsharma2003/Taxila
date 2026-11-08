// The child's Hangar choice on the play engine (BUILD-SPEC §4.3, patch K-P4), pure. The equipped hull and trail become
// two colour numbers on the engine's dress. An item counts only if it is open now (a matching secure skill, world.ts), so
// a stale device choice can never show a part the ledger has not opened. Colour only: no item changes a level, an act,
// a grade, the pace or anything a child can win or lose (dc-r4-gamification-b).
import type { PlayCosmetics } from "../../../play/briefing.ts";
import { K_NIGHT, type KPalette } from "../tokens.ts";
import type { HangarItem } from "../world.ts";

const HUE: Record<string, keyof KPalette> = {
  plasma: "move", secure: "secure", her: "her", ion: "ion", english: "rEnglish", hindi: "rHindi", science: "rScience",
};
const hex = (s: string): number | null => (/^#[0-9a-f]{6}$/i.test(s) ? parseInt(s.slice(1), 16) : null);

export function cosmeticsFor(equipped: Readonly<Record<string, string>>, items: ReadonlyArray<Pick<HangarItem, "id" | "kind" | "hue" | "open">>): PlayCosmetics | null {
  const pick = (slot: "hull" | "trail"): number | null => {
    const it = items.find((i) => i.id === equipped[slot] && i.kind === slot && i.open);
    const key = it ? HUE[it.hue] : undefined;
    return key ? hex(String(K_NIGHT[key])) : null;
  };
  const hull = pick("hull"), trail = pick("trail");
  return hull === null && trail === null ? null : { hull, trail };
}

/** r7 app-world-hangar-depth: the lesson's own look from the equipped board theme and Comms rim (hue names, which the
 *  lesson frame turns into --k-hue-* vars). Same rule as the engine: an item counts only if it is open now. Colour only. */
export interface LessonLook { board: string | null; rim: string | null }

/** r7 app-world-hangar-depth: the equipped (and open) emote as the Debrief's goodbye flourish: which glyph, in which
 *  hue. Colour and shape only: what the goodbye SAYS stays the child's tap (wave / thanks / fun, the closed wire set). */
export type EmoteGlyph = "spark" | "hand" | "star";
const EMOTE_GLYPH: Record<string, EmoteGlyph> = { "emote-spark": "spark", "emote-wave": "hand", "emote-star": "star" };
export interface EmoteLook { glyph: EmoteGlyph; hue: string }
export function emoteLook(equipped: Readonly<Record<string, string>>, items: ReadonlyArray<Pick<HangarItem, "id" | "kind" | "hue" | "open">>): EmoteLook | null {
  const it = items.find((i) => i.id === equipped.emote && i.kind === "emote" && i.open);
  const glyph = it ? EMOTE_GLYPH[it.id] : undefined;
  return it && glyph && /^[a-z]+$/.test(it.hue) ? { glyph, hue: it.hue } : null;
}
export function lessonLook(equipped: Readonly<Record<string, string>>, items: ReadonlyArray<Pick<HangarItem, "id" | "kind" | "hue" | "open">>): LessonLook {
  const pick = (slot: "board" | "rim"): string | null => {
    const it = items.find((i) => i.id === equipped[slot] && i.kind === slot && i.open);
    return it && /^[a-z]+$/.test(it.hue) ? it.hue : null;
  };
  return { board: pick("board"), rim: pick("rim") };
}
