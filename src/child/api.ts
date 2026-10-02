// Child-surface reads. The child id routes the view; the server checks it against the signed-in guardian
// (requireChild). Today the only child read is /api/me; the skill map comes from a read endpoint another
// workstream owns, so it is probed and normalised defensively, and an absent endpoint gives an empty map
// (the screens render their calm "nothing yet" state, never an error aimed at the child).
import { ApiError, getJson, postJson } from "../lesson/api.ts";

export interface ChildRow {
  id: string;
  first_name: string;
  class_level: number;
  board?: string;
  school_medium?: string;
  language_pref: "hinglish" | "hindi" | "english" | string;
  teacher_id?: string | null;
  avatar?: string | null;
  interests?: string[];
}
export interface MeResponse {
  guardian: { id: string; email: string; name: string };
  children: ChildRow[];
}

export type MapStatus = "unseen" | "introduced" | "practising" | "learned_today" | "mastered" | "due";
export interface MapSkill {
  skillId: string;
  title: string;
  topicId?: string;
  chapter?: string;
  subject?: string;
  status: MapStatus;
  /** Ledger flags (§6.4.1) when the endpoint carries them. */
  generativePass?: boolean;
  delayedPass?: boolean;
  /** Bird / re-check ring: only from a server-written recheck_scheduled row (R13), never from time. */
  recheckScheduled?: boolean;
}
export interface ChildMap {
  skills: MapSkill[];
  /** Which endpoint answered (for the report and debugging); null = none, empty map. */
  source: string | null;
}

export const getMe = () => getJson<MeResponse>("/api/me");

/**
 * The child-scoped ledger read this workstream asks for. The parent reads (/api/parent/overview, /syllabus)
 * sit behind the guardian PIN gate and answer 403 to a child surface, which is correct: a child screen must
 * never depend on the Parent corner being unlocked. So there is no parent fallback here.
 */
const MAP_ENDPOINTS = (cid: string) => [`/api/child/map?childId=${encodeURIComponent(cid)}`];

export async function getChildMap(cid: string, signal?: AbortSignal): Promise<ChildMap> {
  for (const url of MAP_ENDPOINTS(cid)) {
    try {
      const data = await getJson<unknown>(url, signal);
      const skills = normaliseSkills(data);
      if (skills) return { skills, source: url.split("?")[0] };
    } catch (e) {
      if (signal?.aborted) throw e;
      if (e instanceof ApiError && e.status === 401) throw e;
      // 404 / shape mismatch: try the next one
    }
  }
  return { skills: [], source: null };
}

const STATUSES = new Set(["unseen", "introduced", "practising", "learned_today", "mastered", "due"]);

/** Accepts { skills: [...] }, { skillStates: [...] }, { children: [{ skills }] } or a bare array. */
export function normaliseSkills(data: unknown): MapSkill[] | null {
  const pick = (o: unknown): unknown[] | null => {
    if (Array.isArray(o)) return o;
    if (!o || typeof o !== "object") return null;
    const r = o as Record<string, unknown>;
    for (const k of ["skills", "skillStates", "skill_states", "ledger"]) if (Array.isArray(r[k])) return r[k] as unknown[];
    if (Array.isArray(r.children) && r.children[0]) return pick(r.children[0]);
    if (r.child && typeof r.child === "object") return pick(r.child);
    return null;
  };
  const rows = pick(data);
  if (!rows) return null;
  const out: MapSkill[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const skillId = String(r.skillId ?? r.skill_id ?? r.id ?? "");
    const status = String(r.status ?? r.display ?? "");
    if (!skillId || !STATUSES.has(status)) continue;
    out.push({
      skillId,
      title: String(r.title ?? r.skillTitle ?? r.name ?? skillId),
      topicId: (r.topicId ?? r.topic_id) as string | undefined,
      chapter: (r.chapter ?? r.chapterTitle) as string | undefined,
      subject: r.subject as string | undefined,
      status: status as MapStatus,
      generativePass: (r.generativePass ?? r.generative_pass) as boolean | undefined,
      delayedPass: (r.delayedPass ?? r.delayed_pass) as boolean | undefined,
      recheckScheduled: (r.recheckScheduled ?? r.recheck_scheduled) === true,
    });
  }
  return out;
}

/** C1-C3 picks go to the existing child profile route (avatar, interests). */
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

export { ApiError, postJson };
