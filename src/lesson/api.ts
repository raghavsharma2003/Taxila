// JSON over same-origin fetch. The guardian session is an httpOnly cookie, so every call sends credentials
// and the client never sees a token it could leak.
import type {
  LessonStartRequest,
  LessonStartResponse,
  RealtimeTokenResponse,
  TurnRequest,
  TurnResponse,
} from "../../shared/contracts.ts";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data as { error?: unknown } | null)?.error;
    throw new ApiError(res.status, typeof msg === "string" ? msg : `${method} ${path} failed (${res.status})`, data);
  }
  return data as T;
}

export const getJson = <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, signal);
export const postJson = <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>("POST", path, body, signal);

/** The lesson routes the runtime depends on (injectable for tests). */
export interface LessonApi {
  start(req: LessonStartRequest): Promise<LessonStartResponse>;
  turn(req: TurnRequest): Promise<TurnResponse>;
  end(lessonId: string): Promise<unknown>;
  realtimeToken(lessonId: string): Promise<RealtimeTokenResponse>;
}

export const httpLessonApi: LessonApi = {
  start: (req) => postJson("/api/lesson/start", req),
  turn: (req) => postJson("/api/lesson/turn", req),
  end: (lessonId) => postJson("/api/lesson/end", { lessonId }),
  realtimeToken: (lessonId) => postJson("/api/realtime/token", { lessonId }),
};

/** Text-mode teacher voice: POST /api/tts → audio/mpeg. */
export async function fetchSpeech(text: string, voice: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, voice }),
    signal,
  });
  if (!res.ok) throw new ApiError(res.status, `speech failed (${res.status})`, await res.text().catch(() => ""));
  return res.blob();
}
