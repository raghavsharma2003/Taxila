// The flight recorder's client bus (release 12, dc-r12-flight-recorder; contract shared/trace.ts, owned by T-server).
// Every client event goes through emit(): stamped (pid, sid, seq, t with the measured clock skew, mono), masked and
// capped (mask.ts), queued, and sent every TRACE_FLUSH_MS to POST /api/trace/batch, and at pagehide by sendBeacon.
// Rules (gate-tested): the recorder NEVER throws into the app and never changes what the app does; every entry point is
// wrapped, sends use the page's ORIGINAL fetch (so the recorder never records itself), and a failed send drops the
// batch with a counter rather than retrying forever. Its own main-thread time is measured (budget: <= 2% in tier 1).
import { TRACE_FLUSH_MS, TRACE_MAX_BATCH_BYTES, type TraceBatchRequest, type TraceBatchResponse, type TraceEvent, type TraceTier } from "../../shared/trace.ts";
import { fitData } from "./mask.ts";

type Listener = (tier: TraceTier) => void;

const uuid = (): string => {
  try { if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID(); } catch { /* fall through */ }
  return "p-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

interface State {
  on: boolean;
  pid: string;
  sid: string;
  turn: number | undefined;
  seq: number;
  rid: number;
  tier: TraceTier;
  skewMs: number;
  queue: TraceEvent[];
  sending: boolean;
  dropped: number;
  busyMs: number;
  since: number;
  timer: ReturnType<typeof setInterval> | null;
  send: typeof fetch | null;
  listeners: Set<Listener>;
  sink: ((e: TraceEvent) => void) | null;
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const S: State = {
  on: false, pid: uuid(), sid: "", turn: undefined, seq: 0, rid: 0, tier: 1, skewMs: 0, queue: [], sending: false, dropped: 0,
  busyMs: 0, since: now(), timer: null, send: null, listeners: new Set(), sink: null,
};
S.sid = S.pid;

/** Time spent inside the recorder, for the main-thread budget. */
export function busy<T>(fn: () => T): T | undefined {
  const t0 = now();
  try { return fn(); } catch { return undefined; } finally { S.busyMs += now() - t0; }
}

export interface EmitOpts { rid?: string; turn?: number; tier?: TraceTier }

/** Record one event. Never throws; a no-op before start() or after stop(). */
export function emit(kind: string, data: Record<string, unknown> = {}, o: EmitOpts = {}): void {
  if (!S.on) return;
  busy(() => {
    const tier = o.tier ?? 1;
    if (tier === 2 && S.tier !== 2) return; // never a tier-2 event from an account that is not tier 2
    const e: TraceEvent = {
      v: 1, sid: S.sid, pid: S.pid, src: "client", seq: ++S.seq, t: Date.now() - S.skewMs, mono: Math.round(now()), kind,
      ...(o.turn ?? S.turn) !== undefined ? { turn: o.turn ?? S.turn } : {}, ...(o.rid ? { rid: o.rid } : {}), tier, data: fitData(data),
    };
    S.queue.push(e);
    S.sink?.(e);
    if (S.queue.length > 400) void flush(); // a burst (a long task storm): do not wait for the timer
  });
}

/** A new request id for X-Taxila-Rid. */
export const nextRid = (): string => `${S.pid.slice(0, 8)}-${(++S.rid).toString(36)}`;

const sessionListeners = new Set<(sid: string) => void>();
export function onSession(l: (sid: string) => void): () => void { sessionListeners.add(l); return () => sessionListeners.delete(l); }

/** The lesson becomes the trace session; null returns to the page-load id. */
export function setSession(lessonId: string | null | undefined): void {
  busy(() => {
    const sid = lessonId || S.pid;
    if (sid === S.sid) return;
    const from = S.sid;
    void flush(); // events so far belong to the old session
    S.sid = sid;
    S.turn = undefined;
    emit("trace.session", { from, to: sid, lesson: !!lessonId });
    for (const l of sessionListeners) { try { l(sid); } catch { /* never breaks the bus */ } }
  });
}
export const setTurn = (turn: number | null | undefined): void => { S.turn = typeof turn === "number" ? turn : undefined; };

export const getTier = (): TraceTier => S.tier;
export function setTier(tier: unknown): void {
  const t: TraceTier = tier === 2 ? 2 : 1;
  if (t === S.tier) return;
  S.tier = t;
  for (const l of S.listeners) { try { l(t); } catch { /* a listener never breaks the bus */ } }
}
export function onTier(l: Listener): () => void { S.listeners.add(l); return () => S.listeners.delete(l); }

/** Client clock minus server clock, from a server Date header (1 s resolution is enough to order against server events). */
export function noteServerDate(date: string | null): void {
  if (!date) return;
  const server = Date.parse(date);
  if (Number.isFinite(server)) S.skewMs = Date.now() - server;
}

function chunks(events: TraceEvent[], max: number): TraceEvent[][] {
  const out: TraceEvent[][] = [];
  let cur: TraceEvent[] = [], bytes = 200;
  for (const e of events) {
    const b = JSON.stringify(e).length + 1;
    if (cur.length && bytes + b > max) { out.push(cur); cur = []; bytes = 200; }
    cur.push(e); bytes += b;
  }
  if (cur.length) out.push(cur);
  return out;
}

const body = (events: TraceEvent[]): string => JSON.stringify({ v: 1, pid: S.pid, skewMs: S.skewMs, events } satisfies TraceBatchRequest);

/** Send what is queued (POST /api/trace/batch, in pieces under TRACE_MAX_BATCH_BYTES). A failure drops, counted. */
export async function flush(): Promise<void> {
  if (!S.on || S.sending || !S.queue.length || !S.send) return;
  S.sending = true;
  const events = S.queue.splice(0);
  try {
    for (const part of chunks(events, TRACE_MAX_BATCH_BYTES - 1024)) {
      const payload = busy(() => body(part)) ?? "";
      try {
        const res = await S.send("/api/trace/batch", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: payload, keepalive: payload.length < 60_000 });
        if (res.ok) {
          const j = (await res.json().catch(() => null)) as TraceBatchResponse | null;
          if (j && (j.tier === 1 || j.tier === 2)) setTier(j.tier);
        } else S.dropped += part.length;
      } catch { S.dropped += part.length; }
    }
    if (S.dropped) { const d = S.dropped; S.dropped = 0; emit("trace.dropped", { events: d }); }
  } finally { S.sending = false; }
}

/** pagehide: what is left goes by sendBeacon (each beacon under ~60 KB, the browsers' limit is 64 KB). */
function beaconAll(): void {
  busy(() => {
    if (!S.queue.length || typeof navigator === "undefined" || !navigator.sendBeacon) return;
    const events = S.queue.splice(0);
    for (const part of chunks(events, 60_000)) navigator.sendBeacon("/api/trace/batch", new Blob([body(part)], { type: "application/json" }));
  });
}

/** Start the bus (once per page). `send` is the page's original fetch, captured before any wrapper. */
export function start(send: typeof fetch): void {
  if (S.on) return;
  S.on = true;
  S.send = send;
  S.since = now();
  S.timer = setInterval(() => { void flush(); }, TRACE_FLUSH_MS);
  try {
    addEventListener("pagehide", beaconAll);
    addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") beaconAll(); });
  } catch { /* no window: tests */ }
}

/** Stop recording (tests; or a recorder fault). Nothing queued is sent. */
export function stop(): void {
  S.on = false;
  if (S.timer) clearInterval(S.timer);
  S.timer = null;
  S.queue = [];
}

/** Debug and budget numbers (window.__trace in the harness). */
export function stats() {
  return { on: S.on, pid: S.pid, sid: S.sid, tier: S.tier, seq: S.seq, queued: S.queue.length, busyMs: Math.round(S.busyMs * 10) / 10, wallMs: Math.round(now() - S.since) };
}
/** Tests and the harness: see every event as it is emitted. */
export function setSink(fn: ((e: TraceEvent) => void) | null): void { S.sink = fn; }
export const pid = (): string => S.pid;
export const sid = (): string => S.sid;
