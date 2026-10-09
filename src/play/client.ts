// The play wire client (GRAMMAR.md §5). Same-origin, cookie-authenticated; every call degrades to null on failure (the
// caller keeps the local controller running: the child's consequences never wait on the network).
import type { Door, PlayActEnvelope, PlayActResponse, PlayLevel, PlayNextResponse, PlayStartRequest, PlayStartResponse, ArtPick } from "../../shared/play.ts";

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T | null> {
  try {
    const r = await fetch(path, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}
export const playApi = {
  start: (b: PlayStartRequest, signal?: AbortSignal) => post<PlayStartResponse>("/api/play/start", b, signal),
  act: (b: { sessionId: string; levelId: string; acts: PlayActEnvelope[]; final?: boolean; impasse?: boolean }, signal?: AbortSignal) => post<PlayActResponse>("/api/play/act", b, signal),
  next: (b: { sessionId: string; door: Door }, signal?: AbortSignal) => post<PlayNextResponse>("/api/play/next", b, signal),
  level: (b: { sessionId: string }, signal?: AbortSignal) => post<{ sessionId: string; level: PlayLevel; art: ArtPick }>("/api/play/level", b, signal),
};
