// The play wire client (GRAMMAR.md §5). Same-origin, cookie-authenticated; every call degrades to null on failure (the
// caller keeps the local controller running: the child's consequences never wait on the network).
import type { Door, PlayActEnvelope, PlayActResponse, PlayDressResponse, PlayLevel, PlayNextResponse, PlayStartRequest, PlayStartResponse, PlayWhy, ArtPick } from "../../shared/play.ts";
import type { DressedSpec } from "./engines/core3d/api.ts";

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T | null> {
  try {
    const r = await fetch(path, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}
/** Round 8 follow-up F: the newest play session token this page has seen (memory only: never stored). /start sends it as
 *  `prev`, so what she just played reaches the picker's novelty input from the home too; the server verifies it is hers. */
let lastSid: string | null = null;
function remember<T>(r: T | null): T | null {
  const sid = (r as { sessionId?: unknown } | null)?.sessionId;
  if (typeof sid === "string" && sid.length > 0 && sid.length <= 8192) lastSid = sid;
  return r;
}
/** Test seam. */
export const lastPlaySession = (): string | null => lastSid;
export const playApi = {
  start: (b: PlayStartRequest, signal?: AbortSignal) => post<PlayStartResponse>("/api/play/start", { ...b, ...(b.prev === undefined && lastSid ? { prev: lastSid } : {}) }, signal).then(remember),
  act: (b: { sessionId: string; levelId: string; acts: PlayActEnvelope[]; final?: boolean; impasse?: boolean; engine?: string | null }, signal?: AbortSignal) => post<PlayActResponse>("/api/play/act", b, signal).then(remember),
  next: (b: { sessionId: string; door: Door }, signal?: AbortSignal) => post<PlayNextResponse>("/api/play/next", b, signal).then(remember),
  level: (b: { sessionId: string }, signal?: AbortSignal) => post<{ sessionId: string; level: PlayLevel; art: ArtPick; dress?: DressedSpec | null; render?: "2d"; why?: PlayWhy }>("/api/play/level", b, signal).then(remember),
  /** the model's dress for the current level (enums only, validated, ≤ 1.9 s on the server; base otherwise) */
  dress: (b: { sessionId: string; music?: "on" | "off" }, signal?: AbortSignal) => post<PlayDressResponse>("/api/play/dress", b, signal),
};
