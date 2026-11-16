// "Maths feels…" at Hello (r7, Learning's patch to-app/007): the child's own one-tap feel for each main subject of her
// class, for Learning's cold-start placement (POST /api/placement/onboarding { childPicks }). PURE.
// Never a test: three faces, no right answer, no score, no item content, no timer, no question marks on the faces,
// and nothing but "Got it" after a pick. Skipping is fine: the parent's answer alone is enough.

export type ChildPick = "easy" | "okay" | "tricky";
export const PICKS: readonly ChildPick[] = ["easy", "okay", "tricky"];

/** The main subjects the row asks about: maths, and EVS (classes 1-5) or science (6+). */
export const feelSubjects = (classLevel: number): string[] => ["maths", Number(classLevel) <= 5 ? "evs" : "science"];

/** The subject's name on the row. */
export const SUBJECT_LABEL: Record<string, string> = { maths: "Maths", evs: "EVS", science: "Science" };

/** The request body, or null when she picked nothing (then nothing is sent). Only the subjects she answered. */
export function feelBody(childId: string, picks: Record<string, ChildPick | undefined>): { childId: string; childPicks: Record<string, ChildPick> } | null {
  const childPicks = Object.fromEntries(Object.entries(picks).filter((e): e is [string, ChildPick] => !!e[1] && PICKS.includes(e[1])));
  return Object.keys(childPicks).length ? { childId, childPicks } : null;
}
