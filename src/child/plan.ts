// The child home's one next step (PRODUCT-DESIGN-V2 §6.3.3, audit #9). The server decides the state
// (GET /api/child/plan → ChildPlanResponse, server/routes/child.js); the client never computes "done" or "capped".
// What the client owns is the fallback: the home is NEVER an empty card.
//   offline (navigator.onLine false, or the read fails with no network)  → "offline"
//   plan read 404 / 5xx / wrong shape / timeout                           → "start" with the last topic the plan
//        returned on this device (or no topic: "Start a lesson"). Start goes to /lesson/new, which the server resolves
//        to the next planned topic; if that fails too the lesson's own T9 ("We couldn't start the lesson.") shows.
//        Today's finished-lesson marker (src/child/day.ts, written at the summary's Finish) turns that into "done", so
//        a plan outage after a lesson never offers a second one.
//   401 → "signedout" (the shell asks a grown-up to sign in).
// While the first read is in flight the home shows a neutral busy card with NO action (source "loading"): a Start link
// before the server answered could start a lesson the server is about to refuse (capped / resting / done).
// "resume" is shown as "start" until the lesson route can resume a lesson by id (RESUME_BY_ID): a "Continue" card whose
// tap starts a new lesson would be a signal that lies (§3.4). The server's own state stays in `serverState`.
import { useCallback, useEffect, useState } from "react";
import type { ChildHomeState, ChildPlanResponse, DidCard, MadeForItem } from "../../shared/contracts.ts";
import { ApiError, getJson } from "../lesson/api.ts";
import { planDay, readMarker } from "./day.ts";
import { takeEarlyPlan } from "../app/boot.ts";

export type HomeState = ChildHomeState | "offline";

export interface HomePlan {
  state: HomeState;
  topic: { id: string; title: string; shortTitle: string | null; chapter: string; subject: string; minutes: number } | null;
  resume: { lessonId: string; ask: string | null; topicTitle: string } | null;
  did: DidCard[];
  tried: number | null;
  opensAt: string | null;
  /** The parent's lesson hours (resting names the control that refused: W1-A item 2). Null when not known. */
  window?: { from: string; to: string } | null;
  surfaces: { map: boolean; notebook: boolean; resume: boolean };
  /** An offline practice pack is on this device (plan.packReady). Only then may the offline card offer Practice. */
  packReady: boolean;
  /** The state the server sent, before the client's honest mapping (resume → start). Null on a fallback. */
  serverState: ChildHomeState | null;
  /** "server": the plan read answered; "fallback": it failed and this is the designed fallback; "loading": first paint. */
  source: "server" | "fallback" | "loading";
  signedOut?: boolean;
  /** W2-A SF1: today's made-for pieces (the mini-shelf, hidden while empty). */
  madeFor: MadeForItem[];
  /** test_window: the school test's subject (calm copy, never a countdown). */
  testWindow: { subject: string; from: string; to: string } | null;
  /** The parent's per-child "Tap and type only" (server truth, any device). */
  textOnly: boolean;
}

const STATES = new Set<ChildHomeState>(["start", "first", "resume", "done", "capped", "resting", "homework", "test_window", "safety_hold"]);
const cacheKey = (cid: string) => `taxila.child.${cid}.plan`;

interface Cached { topic: HomePlan["topic"]; surfaces: HomePlan["surfaces"]; day: string; hold?: boolean; textOnly?: boolean }

function readCache(cid: string): Cached | null {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(cid)) ?? "null") as Cached | null;
  } catch {
    return null;
  }
}
function writeCache(cid: string, c: Cached): void {
  try {
    localStorage.setItem(cacheKey(cid), JSON.stringify(c));
  } catch {
    /* storage blocked: the fallback shows "Start a lesson" without a topic */
  }
}

const ALL_SURFACES = { map: true, notebook: true, resume: true };

/** The lesson route cannot reopen a lesson by id yet (src/child/screens/Practice.tsx LessonRoute → a new lesson). */
export const RESUME_BY_ID = false;

/** Server response → the home's plan. Pure (unit-tested). */
export function fromServer(r: ChildPlanResponse): HomePlan {
  const summary = r.today?.summary ?? null;
  const resume = r.state === "resume" && RESUME_BY_ID;
  return {
    state: r.state === "resume" && !RESUME_BY_ID ? "start" : r.state,
    serverState: r.state,
    topic: r.topic ?? null,
    resume: resume ? r.resume ?? null : null,
    did: (summary?.cards ?? []).slice(0, 3),
    tried: summary?.tried ?? null,
    opensAt: r.opensAt ?? null,
    window: r.plan?.window ?? null,
    surfaces: { ...ALL_SURFACES, ...(r.surfaces ?? {}) },
    packReady: !!r.packReady,
    source: "server",
    madeFor: Array.isArray(r.madeFor) ? r.madeFor.slice(0, 3) : [],
    testWindow: r.testWindow ?? null,
    textOnly: !!r.textOnly,
  };
}

/** The designed fallback when the plan read fails (pure; `online` and the cache are inputs). */
export function fallbackPlan(opts: { online: boolean; cached: Cached | null; doneToday: boolean }): HomePlan {
  const base = {
    topic: opts.cached?.topic ?? null, resume: null, did: [], tried: null, opensAt: null,
    surfaces: opts.cached?.surfaces ?? ALL_SURFACES, packReady: false, serverState: null, source: "fallback" as const,
    madeFor: [], testWindow: null, textOnly: !!opts.cached?.textOnly,
  };
  // a safety hold seen on this device holds through a plan outage: the fallback never offers a lesson over it
  if (opts.cached?.hold) return { ...base, state: "safety_hold" };
  if (!opts.online) return { ...base, state: "offline" };
  if (opts.doneToday) return { ...base, state: "done" };
  return { ...base, state: "start" };
}

/** Practice is offered only once the server answered, when the plan allows it, and never offline without a pack. Pure. */
export function practiceOffered(plan: Pick<HomePlan, "source" | "state" | "packReady">): boolean {
  if (plan.source === "loading") return false;
  if (plan.state === "offline") return plan.packReady;
  return plan.state !== "capped" && plan.state !== "resting" && plan.state !== "safety_hold";
}

export function isPlanResponse(r: unknown): r is ChildPlanResponse {
  return !!r && typeof r === "object" && STATES.has((r as { state?: ChildHomeState }).state as ChildHomeState);
}

export const PLAN_TIMEOUT_MS = 6000;
const online = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false);

export async function readPlan(cid: string, signal?: AbortSignal): Promise<HomePlan> {
  const doneToday = !!readMarker(cid, planDay())?.done;
  if (!online()) return fallbackPlan({ online: false, cached: readCache(cid), doneToday });
  // A hung read must not hold the home on its first paint: 6 s, then the fallback.
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), PLAN_TIMEOUT_MS);
  signal?.addEventListener("abort", () => ac.abort(), { once: true });
  try {
    // the boot read index.html started with the document (me + plan in one hop), else the plan read
    const early = takeEarlyPlan(cid);
    const read = () => getJson<unknown>(`/api/child/plan?childId=${encodeURIComponent(cid)}`, ac.signal);
    const r = await (early ? early.catch(read) : read()).finally(() => clearTimeout(timer));
    if (isPlanResponse(r)) {
      const p = fromServer(r);
      writeCache(cid, { topic: p.topic, surfaces: p.surfaces, day: r.day, hold: r.state === "safety_hold", textOnly: p.textOnly });
      return p;
    }
  } catch (e) {
    if (signal?.aborted) throw e;
    if (e instanceof ApiError && e.status === 401) return { ...fallbackPlan({ online: true, cached: null, doneToday }), signedOut: true };
  }
  return fallbackPlan({ online: online(), cached: readCache(cid), doneToday });
}

/** First paint, before the read answers: `state` is a placeholder the home never acts on (source "loading"). */
const LOADING: HomePlan = { state: "start", topic: null, resume: null, did: [], tried: null, opensAt: null, surfaces: ALL_SURFACES, packReady: false,
  serverState: null, source: "loading", madeFor: [], testWindow: null, textOnly: false };

/** The per-child "Tap and type only" the last plan read carried (the lesson reads it before its start request). */
export function cachedTextOnly(cid: string): boolean {
  return !!readCache(cid)?.textOnly;
}

/** A safety hold the last plan read on this device saw: the lesson routes never open over it (the server refuses too). */
export function cachedHold(cid: string): boolean {
  return !!readCache(cid)?.hold;
}

/** The home's plan, re-read on `online` / `offline` and when `reload()` is called (Try again). */
export function usePlan(cid: string): { plan: HomePlan; reload: () => void } {
  const [plan, setPlan] = useState<HomePlan>(() => {
    const cached = readCache(cid);
    return cached ? { ...LOADING, topic: cached.topic, surfaces: cached.surfaces } : LOADING;
  });
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    const ac = new AbortController();
    readPlan(cid, ac.signal).then((p) => !ac.signal.aborted && setPlan(p), () => {});
    return () => ac.abort();
  }, [cid, n]);
  useEffect(() => {
    window.addEventListener("online", reload);
    window.addEventListener("offline", reload);
    return () => {
      window.removeEventListener("online", reload);
      window.removeEventListener("offline", reload);
    };
  }, [reload]);
  return { plan, reload };
}
