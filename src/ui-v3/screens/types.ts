// Screen data shapes. These are the props the v3 screens render; the wiring patch maps the integrated payloads onto them
// (home payload: server/routes/child.js, RS-5's Later list and lesson record; parent: RS-2's one truth). Keeping them here,
// not in shared/contracts.ts, means RS-1 needs no seam edit: RS-0 may hoist them at the seam commit.
import type { ArtifactKind } from "../Stage.tsx";
import type { Mastery, Subject } from "../primitives.tsx";
import type { Iso, Lesson } from "../schedule.ts";
import type { V3Floor } from "../floor.ts";

export interface TeacherRef { id: string; name: string; band: string }

export interface MadeItem { id: string; title: string; kind: ArtifactKind; when: string; thumb: ThumbKind; why?: string }
export type ThumbKind = "fractions" | "triangle" | "leaf" | "explorable" | "orbit" | "circuit";

export interface LaterItem { id: string; text: string; when: string }

export interface WeekDay { label: string; planned: boolean; done: boolean; today: boolean; time?: string }

export interface SubjectRow { subject: Subject; title: string; detail: string }

export interface HomeData {
  childName: string;
  dateLine: string;
  greeting: string;
  teacher: TeacherRef;
  next: { subject: Subject; classLevel: number; title: string; why: string; inside: ArtifactKind[]; minutes: number };
  note: string;
  made: MadeItem[];
  later: LaterItem[];
  week: WeekDay[];
  subjects: SubjectRow[];
}

export interface Line { who: "her" | "me"; text: string; /** older lines show on wide only */ old?: boolean; laterTail?: string }

export type MomentKind = "park" | "brief" | "decline" | "stop";
export interface Moment { kind: MomentKind; quote: string; note: string; tucking?: boolean }

export interface LessonData {
  teacher: TeacherRef;
  subject: Subject;
  classLevel: number;
  topic: string;
  phase: "warmup" | "learn" | "try" | "wrap";
  floor: V3Floor;
  watching?: boolean;
  muted?: boolean;
  lines: Line[];
  steer: Array<{ label: string; icon: import("../Icon.tsx").IconName; intent: string }>;
  later: LaterItem[];
  moment?: Moment | null;
  artifact: { kind: ArtifactKind; key: string; label: string };
  yourMove?: { text: string; hint?: string };
  readout?: { label: string; value: string };
}

export interface Evidence { verdict: "got" | "look"; title: string; detail: string; at: string }

export interface EndData {
  teacher: TeacherRef;
  subject: Subject;
  classLevel: number;
  topic: string;
  minutes: number;
  canDo: { before: string; em: string; after: string };
  facts: Array<{ value: string; label: string }>;
  quote: { at: string; text: string };
  evidence: Evidence[];
  parked?: LaterItem | null;
  made: MadeItem[];
  next: { when: string; title: string };
}

export interface SkillNode { label: string; state: Mastery; due?: boolean; evidence: string }
export interface ChapterRow { n: number; title: string; current?: boolean; skills: SkillNode[] }

export interface ProgressData {
  subjects: Subject[];
  subject: Subject;
  book: string;
  chapters: ChapterRow[];
  cracked: { title: string; detail: string };
  counts: Array<{ value: number; label: string }>;
  thenNow: { then: { at: string; text: string }; now: { at: string; text: string } };
}

export interface Claim { verdict: "got" | "look"; title: string; detail: string; evidence: Array<{ at: string; text: string }>; words?: string; note?: string }

export interface ParentData {
  childName: string;
  pronoun: "he" | "she" | "they";
  classLine: string;
  teacher: TeacherRef;
  weekOf: string;
  headline: { en: { before: string; em: string; after: string }; hi: { before: string; em: string; after: string } };
  facts: Array<{ value: string; label: string }>;
  claims: Claim[];
  homeTask: { title: string; body: string };
  made: MadeItem[];
  today: Iso;
  nowMin: number;
  lessons: Array<Lesson & { id: string; subject: string; topic: string }>;
  limits: { dailyMin: number; hoursStart: number; hoursEnd: number; openMic: boolean; reminder: boolean };
  curious: Array<{ text: string; when: string }>;
}
