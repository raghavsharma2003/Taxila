// Child-surface reads. The child id routes the view; the server checks it against the signed-in guardian
// (requireChild), so a cross-family id is a 404, never data. A failed read gives the screen's designed empty or
// fallback state, never an error string aimed at the child (§4.7 "raw API strings are never shown").
import { takeEarlyMe } from "../app/boot.ts";
import type { ChildMapResponse, ChildMapSkill, ChildMemoryDeleteRequest, ChildMemoryResponse, DidCard, HomeworkMatch, HomeworkMatchRequest, HomeworkMatchResponse, LessonSummary, MapState } from "../../shared/contracts.ts";
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
      // r7 F Learning (to-app/001): the chapter the parent said school is on (Progress → School, or set-up's maths question)
      school: (c as { school?: unknown } | undefined)?.school === true,
      secure: Number(c?.secure) || 0, total: Number(c?.total) || 0,
      topics: (Array.isArray(c?.topics) ? c.topics : []).map((t) => ({
        id: String(t?.id ?? ""), title: String(t?.title ?? ""),
        skills: (Array.isArray(t?.skills) ? t.skills : []).filter((k) => k && MAP_STATES.has(k.state)),
      })),
    })).filter((c) => c.id),
  })).filter((s) => s.chapters.length);
  // "Your class is here" marks the school's chapter when the parent has told us one; until then, the plan's chapter (`here`)
  const anySchool = subjects.some((s) => s.chapters.some((c) => c.school));
  for (const s of subjects) for (const c of s.chapters) (c as { classHere?: boolean }).classHere = anySchool ? c.school : c.here;
  const skills = subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.flatMap((t) => t.skills)));
  const touched = skills.some((k) => k.state !== "not_started");
  return { mode: r.mode === "garden" || r.mode === "sky" ? r.mode : mode, hidden: false, subjects, skills, empty: r.empty === true || !touched };
}

/**
 * r5-latency: ONE map read per child at a time. The owner's lesson start (2026-10-14, 56d898ce) fetched the 190-324 KB map
 * three times in parallel beside the lesson start (the home's sky map, the Kaksha lesson's "before" snapshot, a remount);
 * readers within MAP_SHARE_MS share the same response. Each caller keeps its own abort (an abort detaches that caller, the
 * shared read goes on). The debrief's "after" read comes minutes later, so it is always fresh.
 */
const MAP_SHARE_MS = 5000;
const mapReads = new Map<string, { at: number; p: Promise<unknown> }>();
function sharedMapRaw(cid: string): Promise<unknown> {
  const hit = mapReads.get(cid);
  if (hit && Date.now() - hit.at < MAP_SHARE_MS) return hit.p;
  const p = getJson<unknown>(`/api/child/map?childId=${encodeURIComponent(cid)}`);
  mapReads.set(cid, { at: Date.now(), p });
  p.catch(() => { if (mapReads.get(cid)?.p === p) mapReads.delete(cid); });
  return p;
}
const detachable = <T,>(p: Promise<T>, signal?: AbortSignal): Promise<T> => (!signal ? p : new Promise<T>((resolve, reject) => {
  const abort = () => reject(new DOMException("aborted", "AbortError"));
  if (signal.aborted) return abort();
  signal.addEventListener("abort", abort, { once: true });
  p.then((v) => { signal.removeEventListener("abort", abort); resolve(v); }, (e) => { signal.removeEventListener("abort", abort); reject(e); });
}));

export async function getChildMap(cid: string, mode: "garden" | "sky", signal?: AbortSignal): Promise<ChildMapResponse> {
  try {
    return normaliseMap(await detachable(sharedMapRaw(cid), signal), mode);
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

/** r7: the chapter that carries "Your class is here" (the school's chapter, else the plan's; normaliseMap decides). */
export const classHereOf = (c: { here?: boolean; classHere?: boolean }): boolean => (c.classHere ?? c.here) === true;

/** r7: the school's chapters as "Subject · Chapter" lines for the Kaksha World (empty when the parent set none). */
export function schoolChaptersOf(map: { subjects?: Array<{ subject: string; chapters: Array<{ title: string; school?: boolean }> }> } | null): Array<{ subject: string; title: string }> {
  return (map?.subjects ?? []).flatMap((s) => s.chapters.filter((c) => c.school).map((c) => ({ subject: s.subject, title: c.title })));
}

/** r7 app-me-settings: What {T} remembers (GET/DELETE /api/child/memory, Brain to-brain/008). null: the route is not
 *  there yet or the read failed (the section is then not shown at all, never an empty promise). */
export type ChildMemory = ChildMemoryResponse;
export async function getChildMemory(cid: string, signal?: AbortSignal): Promise<ChildMemory | null> {
  try {
    const r = await getJson<ChildMemory>(`/api/child/memory?childId=${encodeURIComponent(cid)}`, signal);
    return r && typeof r.keeps === "boolean" && Array.isArray(r.items) ? r : null;
  } catch {
    return null;
  }
}
/** Forget one item (a hard delete on the server). true when it is gone. */
export async function forgetChildMemory(cid: string, id: string): Promise<boolean> {
  try {
    const res = await fetch("/api/child/memory", { method: "DELETE", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: cid, id } satisfies ChildMemoryDeleteRequest) });
    return res.ok;
  } catch {
    return false;
  }
}

/** r7 homework help: Learning's match ladder (POST /api/homework/match). Waits at most `ms`; a timeout, a refusal or no
 *  match is null, and the lesson starts anyway with no topic (never a wait the child can see). */
export async function homeworkMatch(cid: string, text: string, ms = 1500): Promise<HomeworkMatch | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    const r = await postJson<HomeworkMatchResponse>("/api/homework/match", { childId: cid, text: text.slice(0, 500) } satisfies HomeworkMatchRequest, ac.signal);
    return r?.match ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
/** The chip is asked only when the match names a topic (rungs kit_item and topic); "subject" or none starts at once. */
export const homeworkAsks = (m: HomeworkMatch | null): m is HomeworkMatch & { topicId: string } =>
  !!m && (m.rung === "kit_item" || m.rung === "topic") && !!m.topicId;

/** r7 app-world-hangar-depth: the chapters the ledger has sealed (every skill Got it or Secure; server/routes/child.js
 *  buildMap decides `sealed`, never the app). */
export function sealedChaptersOf(map: { subjects?: Array<{ subject: string; chapters: Array<{ id: string; title: string; sealed?: boolean; sealedAt?: string | null }> }> } | null):
  Array<{ id: string; subject: string; title: string; sealedAt?: string | null }> {
  // sealedAt (Learning, migration 046): the first time the map saw it sealed; null = sealed before the stamp existed
  return (map?.subjects ?? []).flatMap((s) => s.chapters.filter((c) => c.sealed).map((c) => ({ id: c.id, subject: s.subject, title: c.title, ...(c.sealedAt ? { sealedAt: c.sealedAt } : {}) })));
}
