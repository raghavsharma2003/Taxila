// Round 8 (main 2026-11-11, ruling 3): the home's one true line, under the greeting, under ?tx= only.
// Priority: parked questions first, then a lesson being resumed, then today's lesson time. Nothing when none is true:
// never a card, never a topic title, and only what the server already sends (plan.jarWaiting is a count, plan.resume,
// plan.schedule). Counts are digits. The other home states (done, capped, resting, homework, test) keep their own line.
export interface HomeLineIn {
  state: string;
  jar: number;
  resuming: boolean;
  lessonTime: string | null | undefined;
}
export type HomeLine = { kind: "jar" | "resume" | "time"; n?: number; time?: string } | null;

export function homeLine(i: HomeLineIn): HomeLine {
  if (i.state !== "start") return null;
  if (i.jar > 0) return { kind: "jar", n: Math.floor(i.jar) };
  if (i.resuming) return { kind: "resume" };
  if (i.lessonTime) return { kind: "time", time: i.lessonTime };
  return null;
}
