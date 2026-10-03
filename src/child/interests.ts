/** The 12 interest pictures (MANIFEST interests/*): one set for onboarding step 6 and Hello card 4, so the parent's
 * picks are the ones the child is asked to confirm (audit #7: "interests the parent picked were replaced"). */
export const INTERESTS = ["cricket", "football", "space", "animals", "drawing", "music", "dance", "cooking", "trains", "stories", "building", "nature"] as const;

/** The parent's picks as interest ids (onboarding stores labels such as "Animals"). Pure. */
export function interestIds(list: string[] | undefined): string[] {
  const set = new Set<string>(INTERESTS);
  return (list ?? []).map((s) => s.trim().toLowerCase()).filter((s) => set.has(s)).slice(0, 3);
}
