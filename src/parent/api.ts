// Parent-corner API (server/routes/parent.js). Every read is gated server-side (requireParentChild); a 403
// carrying { gate } means the corner re-locked (unlock expired) and the gate must show again.
import { ApiError, getJson, postJson } from "../app/api.ts";
export { lockBeacon } from "../app/api.ts";
import type { LedgerState } from "../ui/index.ts";

export interface GateState {
  hasPin: boolean; unlocked: boolean; unlockedUntil: string | null; lockedUntil: string | null;
  /** No PIN yet and this session is not the fresh onboarding one: the first PIN needs the account password. */
  firstSetNeedsPassword?: boolean;
  /** A forgotten-PIN reset is waiting and takes effect at this time (cancelled by an unlock with the current PIN). */
  pendingResetAt?: string | null;
}
export interface SkillLine extends LedgerState { skillId: string; title: string; nextReview: string | null; lastSeen?: string; misconception?: string | null }
export interface ControlsT {
  dailyMinutes: number; hoursStart: string; hoursEnd: string; captionsAlways: boolean; comfortMode: boolean;
  address: "tum" | "aap" | null; reportChannel: "whatsapp" | "app"; saved?: boolean;
}
export interface ChildOut { id: string; firstName: string; classLevel: number; board: string; schoolMedium: string; languagePref: string; avatar: string | null }
export interface Overview {
  child: ChildOut;
  isHafte: { canNow: SkillLine | null; tricky: SkillLine | null };
  homeTask: { lessonId: string; text: string; at: string } | null;
  week: { lessons: number; minutes: number };
  skills: SkillLine[];
  controls: ControlsT;
  updatedAt: string;
}
export interface EvidenceRow {
  id: string; at: string; kind: string; probe: string; outcome: "correct" | "incorrect" | "partial" | "misconception" | "no_evidence";
  hintsUsed: number; lessonId: string | null; words: string | null; misconception: string | null;
}
export interface EvidenceOut {
  skill: { id: string; title: string; outcomes: string[]; topic: { id: string; title: string; chapter: string } | null };
  state: LedgerState & { nextReview: string | null; attempts?: number; correctUnaided?: number };
  rows: EvidenceRow[];
}
export interface LessonLine {
  id: string; topic: { id: string; title: string; chapter?: string; subject?: string }; kind: string; startedAt: string; endedAt: string | null;
  minutes: number | null; note: string | null; evidenceCount: number;
}
export interface LessonCardOut {
  lesson: { id: string; topic: { id: string; title: string; chapter?: string; subject?: string }; startedAt: string; endedAt: string | null; note: string | null; summary: string | null };
  skills: (SkillLine & { attempts: number; unaided: number })[];
  quote: string | null;
  transcript: { seq: number; speaker: "child" | "teacher"; text: string }[] | null;
  transcriptPolicy: "visible" | "on_request";
}
export interface SyllabusOut {
  classLevel: number; board: string;
  subjects: { subject: string; book: string; chapters: { id: string; number: number; title: string; topics: ({ id: string; title: string } & LedgerState)[] }[] }[];
  header: { chaptersTouched: number; topicsPakka: number; topics: number };
}

/** A parent report (server/reports/**): Lane A lines per language, each claim line backed by ledger rows. */
export type ReportLang = "en" | "hinglish" | "hi";
export interface ReportLine { key: string; kind: "claim" | "fixed"; claimId: string | null; section: string; text: string }
export interface ReportOut {
  id: string; cadence: "daily" | "weekly"; period: string; window: { from: string; to: string }; days: { first: string; last: string };
  k7: boolean; preview: boolean; createdAt: string | null; held?: boolean;
  claims: { id: string; section: string; shapeId: string; facts: number }[];
  renders: Record<ReportLang, { title: string; lines: ReportLine[]; voice: string | null }>;
}
export interface ReportList { reports: { id: string; cadence: "daily" | "weekly"; period: string; createdAt: string }[]; today: string; thisWeek: string; lang: ReportLang; langs: ReportLang[]; held: boolean }
export interface ReportEvidence {
  /** `how`: reviewed "how this line is counted" copy per language (server/reports/templates.js HOW), never an internal rule. */
  claim: { id: string; section: string; shapeId: string; how: Record<ReportLang, string> | null };
  window: { from: string; to: string };
  evidence: { id: string; at: string; skill: string; kind: string; result: "right" | "partly" | "not_yet" | "not_sure" | "taught"; help: "none" | "hint" | "asked_first"; checkedBy: "code" | "llm" | "human"; game: boolean; session: string; matchesMixup: boolean }[];
  lessons: { id: string; topic: string; startedAt: string; minutes: number | null }[];
  schedule: { skill: string; nextReview: string | null }[];
}

export const isGateError = (e: unknown): e is ApiError =>
  e instanceof ApiError && e.status === 403 && !!(e.body as { gate?: string } | null)?.gate;

/** Read-aloud (PX10): server-composed speech of a parent card; the client never sends the text. */
export const speakUrl = (o: Record<string, string>) => `/api/parent/speak?${new URLSearchParams(o).toString()}`;

const qs = (o: Record<string, string>) => new URLSearchParams(o).toString();
export const parentApi = {
  pin: () => getJson<GateState>("/api/parent/pin"),
  setPin: (pin: string, password?: string) => postJson<GateState>("/api/parent/pin", { pin, password }),
  resetPin: (pin: string, password: string) => postJson<GateState>("/api/parent/pin/reset", { pin, password }),
  unlock: (pin: string) => postJson<GateState>("/api/parent/unlock", { pin }),
  lock: () => postJson("/api/parent/lock", {}),
  overview: (childId: string) => getJson<Overview>(`/api/parent/overview?${qs({ childId })}`),
  evidence: (childId: string, skill: string) => getJson<EvidenceOut>(`/api/parent/evidence?${qs({ childId, skill })}`),
  lessons: (childId: string) => getJson<{ lessons: LessonLine[] }>(`/api/parent/lessons?${qs({ childId })}`),
  lesson: (childId: string, lessonId: string) => getJson<LessonCardOut>(`/api/parent/lesson?${qs({ childId, lessonId })}`),
  syllabus: (childId: string) => getJson<SyllabusOut>(`/api/parent/syllabus?${qs({ childId })}`),
  controls: (childId: string) => getJson<{ controls: ControlsT }>(`/api/parent/controls?${qs({ childId })}`),
  setControls: (childId: string, c: Partial<ControlsT>) => postJson<{ controls: ControlsT }>("/api/parent/controls", { childId, ...c }),
  homeTask: (childId: string, lessonId: string, done: boolean) => postJson("/api/parent/hometask", { childId, lessonId, done }),
  reports: (childId: string) => getJson<ReportList>(`/api/parent/reports?${qs({ childId })}`),
  report: (childId: string, id: string) => getJson<{ report: ReportOut }>(`/api/parent/report?${qs({ childId, id })}`),
  reportPreview: (childId: string, cadence: "daily" | "weekly") =>
    getJson<{ report: ReportOut | null; skipped?: string; period?: string; held?: boolean }>(`/api/parent/report?${qs({ childId, cadence, preview: "1" })}`),
  reportEvidence: (childId: string, claimId: string, at: { id: string } | { cadence: string; period: string }) =>
    getJson<ReportEvidence>(`/api/parent/report/evidence?${qs({ childId, claimId, ...at })}`),
};
