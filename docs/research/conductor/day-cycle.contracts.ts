// Taxila Conductor day-cycle contracts (proposed shared/conductor.ts).
// Source of truth for rationale: docs/research/conductor/day-cycle.md (2026-10-02). Draft, not compiled.
// inQuietHours() and lintLockScreen() are to be implemented next to the PX4 lint.

export type Band = "B1" | "B2" | "B3" | "B4";
export type DayPhase = "morning" | "at_school" | "free_day" | "recovery" | "learning_window"
                     | "wind_down" | "closing" | "night";
export type SlotKind = "morning_preview" | "homework_help" | "live_lesson" | "burst"
                     | "offline_task" | "reflection";
export type DayMode = "school_day" | "weekend" | "holiday" | "festival" | "test_window"
                    | "light_mode" | "rest_day";

export interface ChildRoutine {               // parent-authored, child-editable for B4 if allowed
  childId: string;
  tz: "Asia/Kolkata" | string;
  schoolStart: string; schoolEnd: string;     // "07:45"
  bedtime: string;                            // "21:00", DC7 margins derive from this
  anchor: { cue: string; window: [string, string]; backup?: [string, string] };   // if-then, Keller 2021
  dailyCapMin: number;                        // default by band 30/40/60/75
  lessonMin: number;                          // 20/25/35/45
  allowedHours: [string, string];             // parent-experience §10
  weekendMode: "normal" | "light" | "off";
  morningPreview: boolean;
}

export interface CalendarEvent {
  id: string; childId: string;
  kind: "unit_test" | "periodic_test" | "half_yearly" | "annual" | "holiday" | "festival"
      | "vacation" | "family_day" | "school_event";
  startDate: string; endDate: string;         // ISO dates, local
  chapters?: string[];                        // curriculum chapter ids for tests
  source: "parent" | "child" | "diary_ocr" | "school_calendar" | "national_calendar";
  confirmed: boolean;                         // OCR-sourced events need parent confirmation
}

export interface PlannedSlot {
  kind: SlotKind;
  targetMin: number; hardStopMin: number;
  window: [string, string];                   // local times
  topicId?: string; reviewItemIds?: string[]; homeworkRequestId?: string;
  reason: PlanReason[];                       // why it is in the plan; shown in "Kaise pata?"-style audit
}
export type PlanReason = "homework_due" | "test_window" | "due_review" | "level_path"
                       | "school_chapter" | "preview" | "enrichment" | "child_choice";

export interface DayPlan {
  childId: string; date: string; mode: DayMode; band: Band;
  phases: Array<{ phase: DayPhase; from: string; to: string }>;
  slots: PlannedSlot[];
  capMin: number; plannedMin: number;         // plannedMin ≤ 0.7 × capMin on a normal day
  splitLevelVsSchool: [number, number];       // e.g. [0.6, 0.4]
  preparedAssets: string[];                   // asset_cache keys from the night job
  version: number; builtAt: string; builtBy: "night_job" | "first_open" | "replan";
}

export interface LessonBrief {                // Conductor → Director
  lessonId: string; topicId: string; band: Band;
  segments: Array<{ kind: "retrieve" | "teach" | "play" | "practice" | "break" | "offline"
                        | "teachback" | "transfer" | "wrap"; minutes: number }>;
  reviewItemIds: string[]; previewTopicId?: string;
  targetMin: number; hardStopAt: string;      // absolute time; Director wraps at the next boundary
  preparedModules: Array<{ engine: string; params: Record<string, unknown> }>;
}

export type DayEvent =
  | { t: "app_open"; at: string; childId?: string }
  | { t: "profile_selected"; at: string; childId: string }
  | { t: "slot_offered" | "slot_started" | "slot_completed" | "slot_skipped"; at: string; childId: string;
      slot: SlotKind; minutes?: number; endedBy?: "plan" | "child_exit" | "timebox" | "cap" | "bedtime" }
  | { t: "homework_photo"; at: string; childId: string; requestId: string; items: number; matched: number }
  | { t: "calendar_event_added"; at: string; childId: string; eventId: string }
  | { t: "routine_changed"; at: string; childId: string; by: "parent" | "child"; fields: string[] }
  | { t: "phase_entered"; at: string; childId: string; phase: DayPhase }
  | { t: "notification_sent" | "notification_opened" | "notification_dismissed"; at: string;
      guardianId: string; cls: NotificationClass; id: string }
  | { t: "night_job"; at: string; childId: string; step: string; status: "ok" | "failed" | "shed"; costInr?: number };

export type NotificationClass = "anchor_reminder" | "weekly_report" | "milestone" | "daily_note"
                              | "test_window" | "safety" | "account" | "payment";

export interface NotificationIntent {
  cls: NotificationClass; guardianId: string; childId?: string;
  notBefore: string; notAfter: string;        // window; outside it the intent expires, it never queues up
  lockScreenText: string;                     // linted: no performance, no guilt words
  deepLink: string;
}

export function mayNotify(i: NotificationIntent, ctx: {
  now: Date; phase: DayPhase; mode: DayMode; sentThisWeek: Record<NotificationClass, number>;
  sentToday: Record<NotificationClass, number>; ignoredInARow: number; prefs: Record<NotificationClass, boolean>;
}): { ok: true } | { ok: false; why: string } {
  if (i.cls === "safety") return { ok: true };                              // never capped, never quiet-houred
  if (!ctx.prefs[i.cls]) return { ok: false, why: "pref_off" };
  if (inQuietHours(ctx.now) || ctx.phase === "at_school") return { ok: false, why: "quiet" };
  if (i.cls === "anchor_reminder") {
    if (["holiday", "festival", "rest_day"].includes(ctx.mode)) return { ok: false, why: "day_off" };
    if (ctx.ignoredInARow >= 3) return { ok: false, why: "self_paused" };   // anti-nagging
    if ((ctx.sentToday.anchor_reminder ?? 0) >= 1 || (ctx.sentThisWeek.anchor_reminder ?? 0) >= 5)
      return { ok: false, why: "cap" };
  }
  // daily_note is pushable only when the parent chose "daily" (prefs.daily_note); it then REPLACES the
  // milestone push (DC9), so milestone is blocked for that parent and daily_note is capped at 1/day.
  if (i.cls === "milestone") {
    if (ctx.prefs.daily_note) return { ok: false, why: "replaced_by_daily_note" };
    const learning = (ctx.sentThisWeek.weekly_report ?? 0) + (ctx.sentThisWeek.milestone ?? 0);
    if (learning >= 2) return { ok: false, why: "learning_cap" };            // parent-experience decision 6
  }
  if (i.cls === "daily_note" && (ctx.sentToday.daily_note ?? 0) >= 1) return { ok: false, why: "cap" };
  if (!lintLockScreen(i.lockScreenText).ok) return { ok: false, why: "copy_lint" };
  return { ok: true };
}
// Absent by construction: there is no NotificationClass for absence, streaks, re-engagement or offers.
