// The child's day as the server sees it (PRODUCT-DESIGN §2.5.1). homeState is a pure function of server rows
// (plan.openLesson, cap, allowed hours): the client never computes it and never computes `granted`.
//
// Endpoints this surface needs from the lesson/server workstream (both requireChild(req, childId): the child id
// is checked against the signed-in guardian, so neither can become an IDOR):
//   GET  /api/child/plan?childId=  → { homeState, plan: { openLesson|null, window }, capRemaining, packReady, day }
//   POST /api/lesson/request { cid } → { granted, lid? }   (§2.5.1 (c); B1-B2: ≤ 1 granted per plan day)
// Until the plan read exists, the home falls back to a per-child "done" marker keyed by the PLAN DAY (written
// at the finish tile from the /api/lesson/end answer), never to navigation state, so internal navigation can
// not bring the ring back. Until the request check exists, a child request is never granted on the client.
import { ApiError, getJson, postJson } from "../lesson/api.ts";
import type { EndResult, HomeState } from "../lesson/uiBridge.ts";

export interface ChildPlan {
  homeState: HomeState;
  openLesson: string | null;
  capRemaining: number | null;
  packReady: boolean | null;
  /** Where the answer came from: the server plan read, or this device's marker for today. */
  source: "server" | "marker" | "none";
}

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

export function markRefused(cid: string): void {
  writeMarker(cid, { ...(readMarker(cid) ?? { day: planDay(), done: true }), refused: true });
}

const HOME_STATES = new Set(["default", "done", "resting"]);

/** The home's state: the server plan read when it answers, else today's marker, else the default home. */
export async function getChildPlan(cid: string, signal?: AbortSignal): Promise<ChildPlan> {
  try {
    const r = await getJson<Record<string, unknown>>(`/api/child/plan?childId=${encodeURIComponent(cid)}`, signal);
    if (r && HOME_STATES.has(String(r.homeState))) {
      const plan = (r.plan ?? null) as { openLesson?: string | null } | null;
      return {
        homeState: r.homeState as HomeState,
        openLesson: plan?.openLesson ?? null,
        capRemaining: typeof r.capRemaining === "number" ? r.capRemaining : null,
        packReady: typeof r.packReady === "boolean" ? r.packReady : null,
        source: "server",
      };
    }
  } catch (e) {
    if (signal?.aborted) throw e;
    if (e instanceof ApiError && e.status === 401) throw e;
    // 404 (not built yet) or a shape mismatch: fall back to the marker
  }
  return markerPlan(cid);
}

export function markerPlan(cid: string): ChildPlan {
  const m = readMarker(cid);
  if (!m?.done) return { homeState: "default", openLesson: null, capRemaining: null, packReady: null, source: "none" };
  return {
    homeState: m.homeState && m.homeState !== "default" ? m.homeState : "done",
    openLesson: null,
    capRemaining: m.capRemaining ?? null,
    packReady: null,
    source: "marker",
  };
}

export interface RequestAnswer {
  granted: boolean;
  lid?: string;
  /** The check endpoint is not there yet: nothing is granted. */
  unavailable?: boolean;
}

/** §2.5.1 (c): the child asked for another lesson. Only the server can grant it. */
export async function requestLesson(cid: string): Promise<RequestAnswer> {
  try {
    const r = await postJson<{ granted?: unknown; lid?: unknown }>("/api/lesson/request", { cid });
    return r?.granted === true ? { granted: true, lid: typeof r.lid === "string" ? r.lid : undefined } : { granted: false };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return { granted: false, unavailable: true };
    return { granted: false };
  }
}
