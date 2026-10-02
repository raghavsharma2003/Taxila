// The student event catalogue (CONDUCTOR.md §2.2), the M0 subset, zod-validated at ingest.
// Payload rules (§2.3): typed payloads, NO free-text fields. Every string is an id, an enum, a date or a time
// matched by a pattern, so child words can never ride an event into the append-only log.
// Types outside this catalogue are refused at ingest (add them here with their schema first).
import { z } from "zod";

const Id = z.string().regex(/^[A-Za-z0-9_.:@\-]{1,96}$/, "id: [A-Za-z0-9_.:@-]{1,96}");
const Uuid = z.uuid();
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "day: YYYY-MM-DD");
const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time: HH:MM");
const Ts = z.iso.datetime({ offset: true });
const Lane = z.enum(["realtime", "realtime_mini", "cascade", "tap"]);
const SlotKind = z.enum(["homework_help", "live_lesson", "burst", "offline_task"]);
export const ENDED_BY = ["completed", "time_limit", "cap", "bedtime", "child_left", "idle", "network", "safety", "outage", "profile_switch"];
const EndedBy = z.enum(ENDED_BY);
const VoiceSec = z.partialRecord(Lane, z.number().min(0).max(36_000));
export const PURPOSES = ["core_tutoring", "learning_profile", "memory", "transcripts_retention", "audio_research"];
const Purpose = z.enum(PURPOSES);
export const WAKE_REASONS = ["day_start", "night", "replan", "debounce_flush", "job_deadline", "weekly_letter", "commitment_due",
  "care_note_expiry", "safety_settle", "safety_escalate", "resume_window_end", "pause_end", "dormancy_check", "household", "reassign"];
const SafetyCategory = z.enum(["self_harm", "abuse", "neglect", "violence_at_home", "sexual_content", "bullying", "medical", "other"]);
/** Parent settings the Conductor folds at M0 (parent_setting / child_controls is the source of truth). */
export const SETTING_KEYS = ["dailyMinutes", "hoursStart", "hoursEnd", "restDays", "bedtime", "schoolStart", "schoolEnd", "wakeTime", "tz"];

const OutcomeDigest = z.strictObject({
  itemsAttempted: z.number().int().min(0).max(500).optional(),
  independentCorrect: z.number().int().min(0).max(500).optional(),
  probesPassed: z.array(Id).max(50).optional(),
  misconceptionsOpened: z.array(Id).max(50).optional(),
  misconceptionsResolved: z.array(Id).max(50).optional(),
  vibeClose: z.enum(["fine", "strained", "tired"]).optional(),   // re-plan input ONLY; never a parent line (pl PA-6)
  teachBackDone: z.boolean().optional(),
  soloPlanned: z.number().int().min(0).max(50).optional(), soloDone: z.number().int().min(0).max(50).optional(),
  soloOk: z.number().int().min(0).max(50).optional(), soloDeclined: z.number().int().min(0).max(50).optional(),
});

const ev = (type, shape = {}) => z.strictObject({ type: z.literal(type), ...shape });

export const StudentEvent = z.discriminatedUnion("type", [
  // device / session
  ev("app.opened", { device: z.enum(["web", "android"]), replicaId: Id, bootId: Id.optional(), cachedPlanVersion: z.number().int().min(0).optional() }),
  ev("app.closed", { reason: z.enum(["profile_switch", "background", "idle"]) }),
  ev("slot.shown", { planDay: Day, planVersion: z.number().int().min(1), slotId: Id }),
  ev("slot.started", { slotId: Id, kind: SlotKind, minutes: z.number().min(0).max(240).optional() }),
  ev("slot.completed", { slotId: Id, kind: SlotKind, minutes: z.number().min(0).max(240).optional(), endedBy: EndedBy.optional() }),
  ev("slot.skipped", { slotId: Id, kind: SlotKind }),
  // Director (boundary facts only)
  ev("lesson.started", { lessonId: Id, slotId: Id.optional(), topicId: Id, kind: z.enum(["live", "practice", "diagnostic", "homework"]),
    lanes: z.array(Lane).max(4), resumeOf: Id.optional() }),
  ev("lesson.ended", { lessonId: Id, reason: EndedBy, minutes: z.number().min(0).max(240), voiceSec: VoiceSec.optional(),
    skillsTouched: z.array(Id).max(40).optional(), outcomeDigest: OutcomeDigest.optional() }),
  ev("skill.milestone", { skillId: Id, to: z.enum(["learned_today", "mastered", "due", "wheel_spin"]), evidenceSeq: z.number().int().min(0) }),
  ev("teacher.promise", { promiseId: Id, what: z.strictObject({ kind: z.enum(["game", "topic", "revisit"]), ref: Id }), by: Id }),
  // parent (settings row + event in ONE transaction, orch §6)
  ev("parent.setting_changed", { key: z.enum(SETTING_KEYS), value: z.union([z.number(), HHMM, z.array(z.number().int().min(0).max(6)).max(7), Id]),
    by: z.literal("owner"), settingsVersion: z.number().int().min(0) }),
  ev("parent.pause", { until: Ts }),
  ev("parent.resume"),
  ev("parent.consent_changed", { purpose: Purpose, granted: z.boolean(), consentVersion: z.union([z.number().int(), Id]) }),
  // school
  ev("school.test_announced", { subject: Id, on: Day, chapters: z.array(Id).max(20), via: z.enum(["parent", "child"]) }),
  ev("school.day_override", { date: Day, kind: z.enum(["off", "holiday", "school_day"]) }),
  // clock
  ev("clock.wakeup", { reason: z.enum(WAKE_REASONS), wakeupId: Id }),
  // agents
  ev("job.done", { jobId: Id, kind: Id, idemKey: z.string().max(200).optional(), resultRef: z.string().max(200).optional() }),
  ev("job.failed", { jobId: Id, kind: Id, idemKey: z.string().max(200).optional(), error: z.string().max(200), final: z.boolean() }),
  // safety (the safety monitor / protocol only)
  ev("safety.incident", { incidentId: Id, severity: z.enum(["high", "critical"]), category: SafetyCategory }),
  ev("safety.incident_updated", { incidentId: Id, familyImplicated: z.enum(["yes", "no", "unknown"]), category: SafetyCategory }),
  ev("safety.cleared", { incidentId: Id, by: Id }),
  // system
  ev("budget.threshold", { scope: z.enum(["child_day", "child_month", "global"]), pct: z.union([z.literal(80), z.literal(100)]) }),
]);

export const EVENT_TYPES = StudentEvent.options.map((o) => o.shape.type.value);

/** Which producers may emit which event families (an event's source is set by the server, never the body). */
export const SOURCE_OF = (type) =>
  type.startsWith("app.") || type.startsWith("slot.") ? "device"
  : type.startsWith("lesson.") || type === "skill.milestone" || type === "teacher.promise" ? "director"
  : type.startsWith("parent.") ? "parent"
  : type.startsWith("school.") ? "school"
  : type === "clock.wakeup" ? "clock"
  : type.startsWith("job.") ? "agent"
  : type.startsWith("safety.") ? "safety"
  : "system";

export class EventInvalid extends Error {
  constructor(issues) { super("invalid event: " + issues.map((i) => `${i.path.join(".") || "(root)"} ${i.message}`).join("; ")); this.issues = issues; }
}

/** Validate a body → the parsed event (unknown keys and free text are refused). */
export function validateEvent(body) {
  const r = StudentEvent.safeParse(body);
  if (!r.success) throw new EventInvalid(r.error.issues);
  return r.data;
}

/**
 * Idempotency keys derived from the FACT, never from a clock or a random value (§3.10). Events whose fact has
 * no natural key (a pause tap) must be given one by the caller (e.g. the parent_setting version).
 */
export function idemKeyFor(e) {
  switch (e.type) {
    case "app.opened": return e.bootId ? `app.opened:${e.replicaId}:${e.bootId}` : null;
    case "slot.shown": return `slot.shown:${e.planDay}:${e.planVersion}:${e.slotId}`;
    case "slot.started": case "slot.completed": case "slot.skipped": return `${e.type}:${e.slotId}`;
    case "lesson.started": return `lesson.started:${e.lessonId}`;
    case "lesson.ended": return `lesson.ended:${e.lessonId}`;
    case "skill.milestone": return `milestone:${e.skillId}:${e.to}:${e.evidenceSeq}`;
    case "teacher.promise": return `promise:${e.promiseId}`;
    case "parent.setting_changed": return `setting:${e.key}:${e.settingsVersion}`;
    case "parent.pause": return `pause:${e.until}`;
    case "parent.consent_changed": return `consent:${e.purpose}:${e.consentVersion}:${e.granted ? 1 : 0}`;
    case "school.test_announced": return `test:${e.subject}:${e.on}`;
    case "school.day_override": return `dayoverride:${e.date}:${e.kind}`;
    case "safety.incident": return `safety.incident:${e.incidentId}`;
    case "safety.incident_updated": return `safety.updated:${e.incidentId}:${e.familyImplicated}:${e.category}`;
    case "safety.cleared": return `safety.cleared:${e.incidentId}`;
    case "job.done": return `job:${e.jobId}:done`;
    case "job.failed": return `job:${e.jobId}:dead`;
    default: return null;
  }
}
