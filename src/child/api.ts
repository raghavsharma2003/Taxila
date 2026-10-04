// Child-surface reads. The child id routes the view; the server checks it against the signed-in guardian
// (requireChild), so a cross-family id is a 404, never data. A failed read gives the screen's designed empty or
// fallback state, never an error string aimed at the child (§4.7 "raw API strings are never shown").
import { takeEarlyMe } from "../app/boot.ts";
import type { ChildMapResponse, ChildMapSkill, DidCard, LessonSummary, MapState } from "../../shared/contracts.ts";
import { tutorById } from "../../shared/tutors.js";
import { ApiError, getJson, postJson } from "../lesson/api.ts";

export interface ChildRow {
  id: string;
  first_name: string;
  class_level: number;
  board?: string;
  school_medium?: string;
  language_pref: "hinglish" | "hindi" | "english" | string;
  teacher_id?: string | null;
  /** The name the child gave the teacher (null: the character's own). Decision child-names-teacher. */
  teacher_name?: string | null;
  avatar?: string | null;
  interests?: string[];
  /** A10 parent-set YOUR TURN timing multiplier (1 / 1.5 / 2) when the profile carries it. */
  timing_multiplier?: number | null;
}
export interface MeResponse {
  guardian: { id: string; email: string; name: string };
  children: ChildRow[];
}

/** /api/me for the child shell: the boot read index.html started (one hop with the plan), else a normal read. */
export const getMe = () => {
  const early = takeEarlyMe<MeResponse>();
  return early ? early.catch(() => getJson<MeResponse>("/api/me")) : getJson<MeResponse>("/api/me");
};

export type { ChildMapResponse, ChildMapSkill, MapState };
export type MapChapter = ChildMapResponse["subjects"][number]["chapters"][number];
export type MapSubject = ChildMapResponse["subjects"][number];

const MAP_STATES = new Set<MapState>(["not_started", "practising", "got_it", "secure"]);

/** A map read that answered with the wrong shape is treated as empty, never as an error. Pure (unit-tested). */
export function normaliseMap(data: unknown, mode: "garden" | "sky"): ChildMapResponse {
  const empty: ChildMapResponse = { mode, hidden: false, subjects: [], skills: [], empty: true };
  if (!data || typeof data !== "object") return empty;
  const r = data as Partial<ChildMapResponse>;
  if (r.hidden) return { ...empty, hidden: true };
  const subjects = (Array.isArray(r.subjects) ? r.subjects : []).map((s) => ({
    subject: String(s?.subject ?? ""), book: String(s?.book ?? ""),
    chapters: (Array.isArray(s?.chapters) ? s.chapters : []).map((c) => ({
      id: String(c?.id ?? ""), number: Number(c?.number) || 0, title: String(c?.title ?? ""), sealed: c?.sealed === true, here: c?.here === true,
      secure: Number(c?.secure) || 0, total: Number(c?.total) || 0,
      topics: (Array.isArray(c?.topics) ? c.topics : []).map((t) => ({
        id: String(t?.id ?? ""), title: String(t?.title ?? ""),
        skills: (Array.isArray(t?.skills) ? t.skills : []).filter((k) => k && MAP_STATES.has(k.state)),
      })),
    })).filter((c) => c.id),
  })).filter((s) => s.chapters.length);
  const skills = subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.flatMap((t) => t.skills)));
  const touched = skills.some((k) => k.state !== "not_started");
  return { mode: r.mode === "garden" || r.mode === "sky" ? r.mode : mode, hidden: false, subjects, skills, empty: r.empty === true || !touched };
}

export async function getChildMap(cid: string, mode: "garden" | "sky", signal?: AbortSignal): Promise<ChildMapResponse> {
  try {
    return normaliseMap(await getJson<unknown>(`/api/child/map?childId=${encodeURIComponent(cid)}`, signal), mode);
  } catch (e) {
    if (signal?.aborted) throw e;
    return normaliseMap(null, mode);
  }
}

/** One finished lesson's DidCards (the Notebook page). null when the read fails. */
export async function getLessonSummary(lessonId: string, signal?: AbortSignal): Promise<LessonSummary | null> {
  try {
    // GET /api/lesson/summary → { lessonId, ended, did: LessonSummary }
    const r = await getJson<{ did?: LessonSummary } & Partial<LessonSummary>>(`/api/lesson/summary?lessonId=${encodeURIComponent(lessonId)}`, signal);
    const s = (r?.did ?? r) as LessonSummary;
    return Array.isArray(s?.cards) ? s : null;
  } catch {
    return null;
  }
}

/** Hello picks (avatar, interests) go to the child profile; the profile facts are the parent's. */
export const updateChild = (childId: string, patch: { avatar?: string; interests?: string[] }) =>
  postPatch("/api/children", { childId, ...patch });

async function postPatch(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, `PATCH ${path} failed (${res.status})`, null);
  return res.json().catch(() => null);
}

export interface TutorsResponse {
  current: string | null;
  chosen: boolean;
  mode: "picker" | "single" | "none";
  band: string;
  tutors: string[];
  live: boolean;
  /** The name in use (the child's own pick, else the character's), the look's own name, and names to suggest. */
  name?: string;
  characterName?: string;
  custom?: boolean;
  suggestions?: string[];
}
export const getTutors = (cid: string) => getJson<TutorsResponse>(`/api/tutors?childId=${encodeURIComponent(cid)}`);
export const chooseTutor = (cid: string, tutorId: string, source: "child" | "child_random") =>
  postJson("/api/tutors/choose", { childId: cid, tutorId, source });

/** The page's best card: a verified one first, then one with an answer. Pure. */
export function bestCard(cards: DidCard[]): DidCard | null {
  return cards.find((c) => c.tick && !c.withHelp) ?? cards.find((c) => c.tick) ?? cards.find((c) => c.answer) ?? null;
}

/** The offer to show: the server's order, real characters only. Pure. */
export function offerOf(r: TutorsResponse | null): string[] {
  return (r?.tutors ?? []).filter((id) => !!tutorById(id));
}

export { ApiError, postJson };
