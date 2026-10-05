// The Studio wire on the client (LIVE-STUDIO §3.0 "Studio channel"; BUILD-PLAN W2-H #3). One EventSource per lesson
// (GET /api/studio/stream), opened the first time a stage for that lesson mounts and kept for the lesson; every message
// is cached per piece, so a stage that mounts late (the turn's slot arrives before the drawing script, or after it)
// converges at once. A piece's slot is also fetched once on mount (GET /api/studio/slot) in case the stream is still
// connecting. Nothing here ever shows an error: a failed fetch simply leaves the slot as the turn gave it.
import { useEffect, useMemo, useState } from "react";
import type { StudioArtifact, StudioSlot, StudioStatus, StudioWire, StudioAnswerResponse, StudioAnswerRequest, StudioFeedbackAction, StudioFrameErrorReason } from "../../shared/studio.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Every Studio intent id starts with its lesson id (`<lessonId>:st:1`, `<lessonId>:wb:7`). */
export const lessonOfIntent = (intentId?: string | null): string | null => {
  const head = String(intentId ?? "").split(":")[0];
  return UUID.test(head) ? head : null;
};

interface PieceWire { status?: StudioStatus; artifact?: StudioArtifact; partial?: string }
type Listener = () => void;

class LessonWire {
  pieces = new Map<string, PieceWire>();
  listeners = new Set<Listener>();
  es: EventSource | null = null;
  constructor(readonly lessonId: string) {}
  open() {
    if (this.es || typeof EventSource !== "function") return;
    try {
      this.es = new EventSource(`/api/studio/stream?lessonId=${encodeURIComponent(this.lessonId)}`, { withCredentials: true });
      this.es.onmessage = (e) => { try { this.take(JSON.parse(e.data) as StudioWire); } catch { /* a bad frame is ignored */ } };
    } catch { this.es = null; }
  }
  take(m: StudioWire) {
    if (!m || typeof m !== "object") return;
    if (m.t === "status" && m.status?.intentId) this.patch(m.status.intentId, { status: m.status });
    else if (m.t === "script" && m.intentId && m.script) this.patch(m.intentId, { artifact: { kind: "whiteboard", stage: { w: m.script.board.w, h: m.script.board.h }, script: m.script } });
    else if (m.t === "partial" && m.intentId && typeof m.html === "string") this.patch(m.intentId, { partial: m.html.slice(0, 120_000) });
    else if (m.t === "ready" && m.intentId) this.patch(m.intentId, {});
  }
  patch(id: string, p: PieceWire) {
    this.pieces.set(id, { ...this.pieces.get(id), ...p });
    for (const l of this.listeners) l();
  }
  close() { this.es?.close(); this.es = null; }
}

const wires = new Map<string, LessonWire>();
function wireFor(lessonId: string): LessonWire {
  let w = wires.get(lessonId);
  if (!w) {
    // one lesson at a time: an older lesson's stream is closed when a new one opens
    for (const [id, old] of wires) if (id !== lessonId) { old.close(); wires.delete(id); }
    w = new LessonWire(lessonId);
    wires.set(lessonId, w);
  }
  w.open();
  return w;
}
/** Test seam: feed a wire message as if it came from the stream. */
export function _injectWire(lessonId: string, m: StudioWire) { wireFor(lessonId).take(m); }

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; }
}

export const studioApi = {
  /** The host's grade for a Studio answer (null = no verdict: the activity simply waits; never an error on screen). */
  /**
   * "gone" = the server no longer has this piece on screen (409: retired, or the lesson left its memory): the stage drops
   * it to the calm ground rather than leaving a Check button that can never answer.
   */
  async answer(lessonId: string, intentId: string, value: unknown, opts: { itemId?: string; mount?: string } = {}): Promise<StudioAnswerResponse | "gone" | null> {
    const body: StudioAnswerRequest = { lessonId, intentId, value, ...(opts.itemId ? { itemId: opts.itemId } : {}), ...(opts.mount ? { mount: opts.mount } : {}) };
    try {
      const res = await fetch("/api/studio/answer", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 409) return "gone";
      return res.ok ? ((await res.json()) as StudioAnswerResponse) : null;
    } catch { return null; }
  },
  feedback: (lessonId: string, intentId: string, action: StudioFeedbackAction) => postJson<{ ok: boolean }>("/api/studio/feedback", { lessonId, intentId, action }),
  frameError: (lessonId: string, intentId: string, reason: StudioFrameErrorReason) => postJson<{ ok: boolean; slot?: StudioSlot }>("/api/studio/frame-error", { lessonId, intentId, reason }),
  async build(src: string): Promise<{ sha256: string; fragment: string; stage: { w: number; h: number } } | null> {
    if (!/^\/api\/studio\/build\?sha=[0-9a-f]{64}$/.test(src)) return null;
    try { const res = await fetch(src, { credentials: "same-origin" }); return res.ok ? await res.json() : null; } catch { return null; }
  },
  async slot(lessonId: string, intentId: string): Promise<StudioSlot | null> {
    try {
      const res = await fetch(`/api/studio/slot?lessonId=${encodeURIComponent(lessonId)}&intentId=${encodeURIComponent(intentId)}`, { credentials: "same-origin" });
      return res.ok ? ((await res.json()).slot as StudioSlot | null) : null;
    } catch { return null; }
  },
};

/**
 * The live slot: the turn's slot, completed by the wire (a whiteboard script that arrives after the turn; a status
 * change such as in_use). The turn's own artifact wins when it has one (it is what the server revealed this turn).
 */
export function useStudioSlot(slot: StudioSlot): StudioSlot {
  const lessonId = lessonOfIntent(slot.intentId);
  const [tick, setTick] = useState(0);
  const [fetched, setFetched] = useState<StudioSlot | null>(null);
  useEffect(() => {
    if (!lessonId || !slot.intentId) return;
    const w = wireFor(lessonId);
    const l = () => setTick((t) => t + 1);
    w.listeners.add(l);
    let live = true;
    if (!slot.artifact && !w.pieces.get(slot.intentId)?.artifact) void studioApi.slot(lessonId, slot.intentId).then((s) => { if (live && s) setFetched(s); });
    return () => { live = false; w.listeners.delete(l); };
  }, [lessonId, slot.intentId, slot.artifact]);
  return useMemo(() => {
    if (!lessonId || !slot.intentId) return slot;
    const p = wires.get(lessonId)?.pieces.get(slot.intentId);
    const artifact = slot.artifact ?? p?.artifact ?? fetched?.artifact;
    const wireState = p?.status?.state;
    // the wire moves a piece forward (revealed → in_use; planning → revealed when the script lands), never back to
    // "planning" once the turn said more; a failed whiteboard drops to the calm ground (state stays, no artifact)
    let state = slot.state;
    if (wireState === "in_use" && (state === "revealed" || state === "ready")) state = "in_use";
    if (state === "planning" && artifact) state = "revealed";
    if (wireState === "failed" && !artifact && state === "planning") state = "fallback_shown";
    return { ...slot, state, ...(artifact ? { artifact } : {}) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, lessonId, tick, fetched]);
}

/** The latest streamed partial paint of a piece being made (decoration under the veil), or null. */
export function usePartial(lessonId: string | null, intentId: string | null): string | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lessonId || !intentId) return;
    const w = wireFor(lessonId);
    const l = () => setTick((t) => t + 1);
    w.listeners.add(l);
    return () => { w.listeners.delete(l); };
  }, [lessonId, intentId]);
  return lessonId && intentId ? wires.get(lessonId)?.pieces.get(intentId)?.partial ?? null : null;
}
