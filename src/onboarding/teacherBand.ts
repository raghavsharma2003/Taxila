// The teacher record's look band in set-up (round 7, D3): derived from the child's visual band (src/child/band.ts, App;
// the class → band table itself is Brain's shared/learner.ts BANDS), never a class number written here. Young family →
// "b2" (the young teacher), older → "b3". When App moves class 4 to the older look, set-up follows.
import { bandForClass, familyOf } from "../child/band.ts";

export const teacherBandFor = (classLevel: number | null | undefined): "b2" | "b3" =>
  familyOf(bandForClass(Number(classLevel ?? 5))) === "young" ? "b2" : "b3";
