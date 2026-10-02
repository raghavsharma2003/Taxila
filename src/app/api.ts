// Account-level API used by the shell, onboarding, the picker and the Parent corner. Same-origin fetch with
// the httpOnly guardian cookie (src/lesson/api.ts request helper); the client never holds a token.
import { ApiError, getJson, postJson } from "../lesson/api.ts";

export { ApiError, getJson, postJson };

export interface ChildRow {
  id: string; first_name: string; class_level: number; board: string; school_medium: string; language_pref: string;
  teacher_id: string; avatar: string | null; interests: string[];
}
export interface Me {
  guardian: { id: string; email: string; name: string; locale: string };
  children: ChildRow[];
  consents: { child_id: string | null; purpose: string; granted: boolean; version: string; created_at: string }[];
}

let cached: Promise<Me | null> | null = null;
/** GET /api/me → Me, or null when signed out (401). Cached for the page; call refreshMe() after a change. */
export function loadMe(): Promise<Me | null> {
  if (!cached) {
    cached = getJson<Me>("/api/me").catch((e) => {
      cached = null;
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    });
  }
  return cached;
}
export function refreshMe(): Promise<Me | null> {
  cached = null;
  return loadMe();
}

export async function request<T>(method: "PATCH" | "DELETE", path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method, credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data as { error?: unknown } | null)?.error;
    throw new ApiError(res.status, typeof msg === "string" ? msg : `${method} ${path} failed (${res.status})`, data);
  }
  return data as T;
}

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
