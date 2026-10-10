// Parent-corner API (server/routes/parent.js, server/routes/account.js). Every read is gated server-side
// (requireParentChild); a 403 carrying { gate } means the corner re-locked (unlock expired) and the gate must show again.
import { ApiError, getJson, postJson, request } from "../app/api.ts";
export { lockBeacon } from "../app/api.ts";
import type { LedgerState } from "../ui/index.ts";
import type { ClaimRow } from "./claims.ts";

export interface GateState {
  hasPin: boolean; unlocked: boolean; unlockedUntil: string | null; lockedUntil: string | null;
  /** No PIN yet and this session is not the fresh onboarding one: the first PIN needs the account password. */
  firstSetNeedsPassword?: boolean;
  /** A forgotten-PIN reset is waiting and takes effect at this time (cancelled by an unlock with the current PIN). */
  pendingResetAt?: string | null;
}
export interface SkillLine extends LedgerState {
  skillId: string; title: string; label: string; nextReview: string | null; lastSeen?: string; misconception?: string | null;
}
export interface Claim extends SkillLine { kind: "can_now" | "practising"; rows: ClaimRow[] }
export interface ControlsT {
  dailyMinutes: number; hoursStart: string; hoursEnd: string; captionsAlways: boolean; comfortMode: boolean;
  address: "tum" | "aap" | null; reportChannel: "whatsapp" | "app"; saved?: boolean;
  /** W2-A: per-child "Tap and type only" (server truth) and "Homework help today". */
  textOnly?: boolean; homeworkToday?: boolean;
}
export interface ChildOut { id: string; firstName: string; classLevel: number; board: string; schoolMedium: string; languagePref: string; avatar: string | null }
export interface TopicRef { id: string; title: string; shortTitle?: string | null; chapter?: string; subject?: string }
export interface Overview {
  child: ChildOut;
  headline: { kind: "none" | "first" | "too_early" | "claims" | "quiet" | "no_week" | "held"; canNow: Claim | null; practising: Claim | null;
    firstTopic: TopicRef | null; profileKept: boolean };
  tryAtHome: { text: string; claimId: string | null; skillId?: string | null; generic?: boolean; cadence: "weekly"; period: string; pictures: string[] } | null;
  next: { state: "start" | "first" | "resume" | "done" | "capped" | "resting"; topic: { title: string; shortTitle: string | null } | null;
    window: { from: string; to: string }; minutes: number | null } | null;
  alert: { at: string | null } | null;
  held: boolean;
  week: { lessons: number; minutes: number };
  recent: { id: string; topic: TopicRef; startedAt: string; minutes: number | null }[];
  skills: SkillLine[];
  controls: ControlsT;
  updatedAt: string;
}
export interface EvidenceRow {
  id: string; at: string; kind: string; probe: string; outcome: "correct" | "incorrect" | "partial" | "misconception" | "no_evidence";
  hintsUsed: number; lessonId: string | null; words: string | null; misconception: string | null;
  /** W2-A: the engine's result word, the question as posed, and who graded it. */
  result?: "right" | "right_hint" | "with_help" | "partly" | "not_yet" | "not_sure" | "mixup";
  prompt?: string | null; grader?: "code" | "llm" | "human"; graderWords?: string;
}
export interface EvidenceOut {
  skill: { id: string; title: string; label?: string; outcomes: string[]; topic: { id: string; title: string; chapter: string } | null };
  state: LedgerState & { nextReview: string | null; attempts?: number; correctUnaided?: number };
  rows: EvidenceRow[];
}
export interface LessonLine {
  id: string; topic: TopicRef; kind: string; startedAt: string; endedAt: string | null;
  minutes: number | null; evidenceCount: number; counted: boolean;
}
export interface DidCardOut { kind: "item" | "teachback"; ask: string | null; answer: string; tick: boolean; withHelp: boolean }
export interface LessonCardOut {
  lesson: { id: string; topic: TopicRef; startedAt: string; endedAt: string | null; minutes: number | null; counted: boolean };
  /** quotes of the child's answers; each tick from the engine row of the same turn (the only count is summary.counts) */
  did: { cards: DidCardOut[] } | null;
  /** attempts/unaided over item rows only; explained = own-words probes scored in full */
  skills: (SkillLine & { attempts: number; unaided: number; explained?: number })[];
  nextCheck: string | null;
  quote: string | null;
  transcript: { seq: number; speaker: "child" | "teacher"; text: string }[] | null;
  transcriptPolicy: "visible" | "on_request";
  /** W2-A: the lesson's summary, built from the engine's rows and claim-checked (null when withheld). */
  summary?: { lines: string[]; counts: { tried: number; firstTry: number; withHint: number; explained: number } } | null;
}
export interface SyllabusOut {
  classLevel: number; board: string; profileKept: boolean;
  subjects: { subject: string; book: string; chapters: { id: string; number: number; title: string; topics: ({ id: string; title: string; skills?: ({ skillId: string; label: string } & LedgerState)[] } & LedgerState)[] }[] }[];
  here: { chapterId: string; topicId: string } | null;
  bridge: { steps: string[] } | null;
  header: { chaptersStarted: number; secure: number; topics: number };
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
export interface DeleteReceipt { code: string; at: string; children: number; backupsGoneBy: string }

export const isGateError = (e: unknown): e is ApiError =>
  e instanceof ApiError && e.status === 403 && !!(e.body as { gate?: string } | null)?.gate;
/** A gate 403 that means "locked" (re-show the PIN pad), not "too many tries" (a message, the corner stays open). */
export const isRelock = (e: unknown) => isGateError(e) && (e.body as { gate?: string }).gate !== "wait";

/** Read-aloud (PX10): server-composed speech of a parent card; the client never sends the text. */
export const speakUrl = (o: Record<string, string>) => `/api/parent/speak?${new URLSearchParams(o).toString()}`;

/** Round 3 fix (adversarial B3b): what the teacher remembers (server/relational/routes.js GET /api/parent/memory). */
export interface ParentMemory {
  keeps: string;
  consents: { learning_profile: boolean; memory: boolean };
  /** memory rows as stored (written by the teacher AI at a lesson's end from the child's own words) */
  remembered: { id: string; kind: string; text: string; at: string; topic: string | null }[];
  /** what she may bring back from the last lesson's learning (closed parent copy) */
  fromLastLesson: { id: string; text: string }[];
  interests: string[];
  used: { callback: string; what: string; at: string; topic: string | null }[];
  forgotten: { at: string }[];
}

const qs = (o: Record<string, string>) => new URLSearchParams(o).toString();
export const parentApi = {
  memory: (childId: string) => getJson<ParentMemory>(`/api/parent/memory?${qs({ childId })}`),
  /** id "all" deletes every memory row of the child */
  deleteMemory: (childId: string, id: string) => request<{ deleted: number }>("DELETE", "/api/parent/memory", { childId, id }),
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
  madeFor: (childId: string) => getJson<{ items: import("../../shared/contracts.ts").MadeForItem[] }>(`/api/parent/made-for?${qs({ childId })}`),
  homeTask: (childId: string, at: { period: string } | { lessonId: string }, done: boolean) => postJson("/api/parent/hometask", { childId, ...at, done }),
  reports: (childId: string) => getJson<ReportList>(`/api/parent/reports?${qs({ childId })}`),
  report: (childId: string, id: string) => getJson<{ report: ReportOut }>(`/api/parent/report?${qs({ childId, id })}`),
  reportPreview: (childId: string, cadence: "daily" | "weekly") =>
    getJson<{ report: ReportOut | null; skipped?: string; period?: string; held?: boolean }>(`/api/parent/report?${qs({ childId, cadence, preview: "1" })}`),
  reportEvidence: (childId: string, claimId: string, at: { id: string } | { cadence: string; period: string }) =>
    getJson<ReportEvidence>(`/api/parent/report/evidence?${qs({ childId, claimId, ...at })}`),
  setConsent: (childId: string | null, grants: Record<string, boolean>, password: string) => postJson<{ ok: true }>("/api/consent", { childId, grants, password }),
  deleteChild: (childId: string, password: string) => request<{ ok: true }>("DELETE", "/api/children", { childId, password }),
  deleteAccount: (password: string) => request<{ ok: true; receipt: DeleteReceipt }>("DELETE", "/api/account", { password, confirm: true }),
  /** "Download everything": a JSON file, saved by the browser. */
  exportAll: async (password: string): Promise<{ blob: Blob; name: string }> => {
    const res = await fetch("/api/parent/export", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (!res.ok) {
      let body: unknown = null;
      try { body = await res.json(); } catch { body = null; }
      throw new ApiError(res.status, (body as { error?: string } | null)?.error ?? `export failed (${res.status})`, body);
    }
    const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "taxila-export.json";
    return { blob: await res.blob(), name };
  },
};
