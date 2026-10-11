// Release 11 (dc-r4-volt-everywhere): the art direction a game opens in follows the app's look.
import { FAMILY_ARTS, type ArtId, type FamilyId } from "../../../shared/play.ts";

/**
 * Release 11 (dc-r4-volt-everywhere): under the Volt look the art a game opens in matches the identity. Presentation only:
 * the server's pick, its rotation and the level are unchanged; the shell's own attributes decide (K's .tx-child / .kx root:
 * data-klook + data-ktheme), so `?ui=classic` keeps today's art. Older (Volt night): the warm paper and the green
 * board read off-brand on carbon, so they open as the two dark arts (kagaz → blueprint, chalk → raat: two looks still
 * rotate). Young (Volt day) keeps the bright paper. Antariksh and Stackverse draw their own worlds and are untouched.
 */
export const VOLT_NIGHT_ART: Partial<Record<ArtId, ArtId>> = { kagaz: "blueprint", chalk: "raat" };
export function voltArt(art: ArtId, family: FamilyId, look: { klook: string | null; ktheme: string | null } | null): ArtId {
  if (!look || look.klook !== "volt" || look.ktheme !== "night") return art;
  const to = VOLT_NIGHT_ART[art];
  return to && FAMILY_ARTS[family]?.includes(to) ? to : art;
}
export function shellLook(): { klook: string | null; ktheme: string | null } | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector("[data-klook][data-ktheme]");
  return el ? { klook: el.getAttribute("data-klook"), ktheme: el.getAttribute("data-ktheme") } : null;
}

