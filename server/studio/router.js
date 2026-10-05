// The Studio router (LIVE-STUDIO §3.2, §7; TEACHER-BRAIN §6.3 step 2): library, live, or fallback. Deterministic code,
// no model, no I/O (the library lookup result and the spend are passed in), ≤ 1 ms. Every decision carries reason codes.
//
//   decide({ intent, archetypeId, admissible, child, lesson, library, now }) → { action, reasons, arms?, opportunistic?, estUsd? }
//     action: "library" (mount a passed build), "live" (race a build), "whiteboard" (the drawing-script planner),
//             "fallback" (the ladder: skeleton / T1 engine / template / board / voice)
//
// Rules, in order (the first that fires decides):
//   1. parent control "off" → fallback; safety mode → fallback (no new thing on screen during a safeguard)
//   2. kind whiteboard → whiteboard (cheap, per line; still never in safety mode or with control "off"; never under
//      "ready_made": a model-written board is not ready-made. The first session (bond `meeting`) DOES get it: it is not
//      a build (no code, nothing to interact with, our code draws a gated script): decision w2f-whiteboard-not-a-build)
//   3. no admissible archetype (kit truth missing for the kind) → fallback
//   4. a promoted library build → library
//   5. bond stage `meeting` or parent control "ready_made": only promoted builds, skeletons and T1 engines → fallback
//   6. a live_passed / transfer_passed build with ≥ 3 distinct param passes, 0 incidents, < 20 mounts → library
//   7. the archetype is not live-buildable (router bench P(pass by lead) < 0.95 at n ≥ 30, or its picture is not
//      code-checkable) → fallback (library-only: built offline, reviewed, mounted)
//   8. caps: ≤ 3 live builds per lesson, ≤ $0.60 per child per day, ≤ $8 per child per month, the global breaker → fallback
//   9. lead time < the archetype's race p90 → live but opportunistic (revealed when ready; the teacher adapts)
import { readFileSync } from "node:fs";
import { ARCHETYPES } from "./archetypes/index.js";

export const CAPS = Object.freeze({ liveBuildsPerLesson: 3, usdPerChildDay: 0.6, usdPerChildMonth: 8, unreviewedMounts: 20, promotePasses: 3 });
/** Estimated $ of one raced live build (two arms, ≤ 2 repairs; LIVE-STUDIO §7: $0.13-0.23) until the bench gives the archetype's own. */
export const EST_RACE_USD = 0.25;

let routes = null;
/** routes.json (written by the router bench). Re-read on demand so a bench run takes effect without a restart. */
export function loadRoutes(force = false) {
  if (routes && !force) return routes;
  routes = JSON.parse(readFileSync(new URL("./routes.json", import.meta.url), "utf8"));
  return routes;
}
export const _setRoutes = (r) => { routes = r; };
/** The route for an archetype: its arms (race order), lead time, live flag. */
export function routeFor(archetypeId) {
  const r = loadRoutes();
  return { ...r.defaults, ...(r.archetypes?.[archetypeId] ?? {}), fallback429: r.fallback429 };
}

// ───────────────────────────── the global breaker ─────────────────────────────

/**
 * A process-wide breaker (G2's breaker idea, in memory: one replica's view): trips on a day's Studio spend over
 * `dailyUsd` or on `failStreak` failed races in a row (then stays open `coolMs`). The store is injectable.
 */
export function createBreaker({ dailyUsd = Number(process.env.STUDIO_DAILY_USD) || 40, failStreak = 8, coolMs = 15 * 60_000, now = () => Date.now() } = {}) {
  let day = "", spent = 0, streak = 0, openUntil = 0;
  const today = () => new Date(now()).toISOString().slice(0, 10);
  const roll = () => { const d = today(); if (d !== day) { day = d; spent = 0; } };
  return {
    open() { roll(); return spent >= dailyUsd || now() < openUntil; },
    spend(usd) { roll(); spent += Math.max(0, usd || 0); },
    result(ok) { if (ok) streak = 0; else if (++streak >= failStreak) { openUntil = now() + coolMs; streak = 0; } },
    state() { roll(); return { day, spent: +spent.toFixed(4), openUntil, streak }; },
  };
}
export const breaker = createBreaker();

// ───────────────────────────── the decision ─────────────────────────────

/**
 * @param {{
 *   intent: import("../../shared/studio").StudioIntent,
 *   archetypeId?: string | null, admissible?: boolean,
 *   child: { bondStage?: string, studioControl?: "on" | "ready_made" | "off", safetyMode?: boolean, spendTodayUsd?: number, spendMonthUsd?: number },
 *   lesson: { liveBuilds?: number, clockMs?: number },
 *   library?: { status: "promoted" | "transfer_passed" | "live_passed" | "retired", distinctPasses?: number, mounts?: number, incidents?: number } | null,
 *   breakerOpen?: boolean,
 * }} input
 * @returns {{ action: "library" | "live" | "whiteboard" | "fallback", reasons: string[], arms?: object[], race?: number, opportunistic?: boolean, estUsd?: number, deadlineMs?: number }}
 */
export function decide({ intent, archetypeId = null, admissible = true, child = {}, lesson = {}, library = null, breakerOpen }) {
  const reasons = [];
  const control = child.studioControl ?? "on";
  if (control === "off") return { action: "fallback", reasons: ["studio.parent_off"] };
  if (child.safetyMode) return { action: "fallback", reasons: ["studio.safety_mode"] };
  if (intent?.kind === "whiteboard") return control === "ready_made" ? { action: "fallback", reasons: ["studio.ready_made_only"] } : { action: "whiteboard", reasons: ["studio.whiteboard"] };
  if (!admissible || !archetypeId || !ARCHETYPES.has(archetypeId)) return { action: "fallback", reasons: ["studio.no_truth"] };
  const a = ARCHETYPES.get(archetypeId);
  const lib = library && library.status !== "retired" ? library : null;
  if (lib?.status === "promoted") return { action: "library", reasons: ["studio.library_promoted"] };
  const promotedOnly = child.bondStage === "meeting" || control === "ready_made";
  if (promotedOnly) return { action: "fallback", reasons: [child.bondStage === "meeting" ? "studio.first_session_promoted_only" : "studio.ready_made_only"] };
  if (lib && (lib.distinctPasses ?? 0) >= CAPS.promotePasses && (lib.incidents ?? 0) === 0 && (lib.mounts ?? 0) < CAPS.unreviewedMounts) {
    return { action: "library", reasons: [`studio.library_${lib.status}`] };
  }
  if (lib) reasons.push("studio.library_not_reusable");
  const route = routeFor(archetypeId);
  if (a.pictureTruth === "human_review") return { action: "fallback", reasons: [...reasons, "studio.picture_needs_review"] };
  if (!route.live) return { action: "fallback", reasons: [...reasons, "studio.library_only"] };
  const est = route.estUsd ?? EST_RACE_USD;
  if ((lesson.liveBuilds ?? 0) >= CAPS.liveBuildsPerLesson) return { action: "fallback", reasons: [...reasons, "studio.cap_lesson"] };
  if ((child.spendTodayUsd ?? 0) + est > CAPS.usdPerChildDay) return { action: "fallback", reasons: [...reasons, "studio.cap_day"] };
  if ((child.spendMonthUsd ?? 0) + est > CAPS.usdPerChildMonth) return { action: "fallback", reasons: [...reasons, "studio.cap_month"] };
  if (breakerOpen ?? breaker.open()) return { action: "fallback", reasons: [...reasons, "studio.breaker_open"] };
  const lead = (intent.neededAtMs ?? 0) - (lesson.clockMs ?? 0);
  const opportunistic = intent.priority === "opportunistic" || lead < route.leadMs;
  if (opportunistic && intent.priority !== "opportunistic") reasons.push("studio.lead_short");
  return { action: "live", reasons: [...reasons, "studio.live"], arms: route.arms, race: route.race, opportunistic, estUsd: est, deadlineMs: route.deadlineMs };
}

/** Never reveal un-gated code: the one predicate every reveal path asks (W2-H's reveal and library mount call it). */
export function revealable({ gate, gateCacheHit = false }) {
  return !!(gate?.pass === true && !gate.unavailable) || gateCacheHit === true;
}
