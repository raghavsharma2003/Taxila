// The child's day marker (PRODUCT-DESIGN §2.5.1): the plan day (IST) and a per-child "done today" mark keyed by it, written
// at the finish step from the /api/lesson/end answer. The home's state itself comes from the server (src/child/plan.ts);
// the client never computes `granted`. (The older plan read, request check and marker plan that lived here were unused and
// were deleted in the round-7 app audit, APP-45.)
import type { EndResult, HomeState } from "../lesson/uiBridge.ts";

/** The plan day: the calendar day in India (the Conductor plans in IST), as YYYY-MM-DD. */
export function planDay(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

interface DayMarker {
  day: string;
  done: boolean;
  /** A request was refused today: the resting shape is shown once, then the request is not offered again. */
  refused?: boolean;
  lessonId?: string;
  homeState?: HomeState;
  capRemaining?: number | null;
}

const markKey = (cid: string) => `taxila.child.${cid}.day`;

export function readMarker(cid: string, day = planDay()): DayMarker | null {
  try {
    const m = JSON.parse(localStorage.getItem(markKey(cid)) ?? "null") as DayMarker | null;
    return m && m.day === day ? m : null;
  } catch {
    return null;
  }
}

function writeMarker(cid: string, m: DayMarker): void {
  try {
    localStorage.setItem(markKey(cid), JSON.stringify(m));
  } catch {
    /* storage blocked: the server plan read (when it exists) is the only source */
  }
}

/** The finish tile: remember today's lesson as done, carrying whatever the server said at lesson/end. */
export function markLessonDone(cid: string, lessonId: string | null, ended: EndResult | null): void {
  const prev = readMarker(cid);
  writeMarker(cid, {
    ...prev,
    day: planDay(),
    done: true,
    lessonId: lessonId ?? undefined,
    homeState: ended?.homeState,
    capRemaining: ended?.capRemaining ?? null,
  });
}
