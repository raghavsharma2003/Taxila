// Release 12, the flight recorder (docs/design/round4/build/r12/TRACKING-BRIEF.md, decision dc-r12-flight-recorder).
// The ONE event contract for client, server and worker. T-server owns this file; T-client and T-voice build to it.
// Kinds are dot-namespaced; add new kinds freely, never rename one. Server code is plain JS and documents these shapes with
// JSDoc `import("../shared/trace").TraceEvent`.

// ───────────────────────────── the event (v1, exactly as in the brief) ─────────────────────────────
export interface TraceEvent {
  v: 1;
  sid: string;        // trace session: the lesson id inside a lesson, else a per-page-load uuid (pid) until a lesson starts
  pid?: string;       // per page-load id (client), so pre-lesson screens join the lesson that follows
  cid?: string;       // child id (server fills from auth; client never trusted for it)
  gid?: string;       // guardian id (server fills)
  src: "client" | "server" | "worker";
  seq: number;        // per (src, pid|process) monotonic
  t: number;          // epoch ms (server clock for server events; client clock + measured skew for client events)
  mono?: number;      // client performance.now(), for ordering inside a page
  kind: string;       // dot-namespaced, see the kind list
  turn?: number;      // lesson turn seq when known
  rid?: string;       // request id: client sets header X-Taxila-Rid on every /api call; server echoes it on srv.* events
  tier: 1 | 2;
  data: Record<string, unknown>;   // <= 8 KB serialized; larger goes to a blob, with data.blob = { ref, bytes, type }
}

export type TraceTier = 1 | 2;
export type TraceSrc = TraceEvent["src"];

/** A blob pointer inside `data.blob` (POST /api/trace/blob returns the `ref`). */
export interface TraceBlobRef {
  ref: string;        // the blob path in the storage container "trace": {yyyy-mm-dd}/{sid}/{src}-{seq}.{ext}
  bytes: number;
  type: string;       // content type, e.g. "application/json", "audio/webm", "application/x-rrweb+json"
}

// ───────────────────────────── limits (gate-tested on both sides) ─────────────────────────────
/** `data` serialized must fit in this; larger content goes to a blob. */
export const TRACE_MAX_DATA_BYTES = 8 * 1024;
/** One POST /api/trace/batch body. */
export const TRACE_MAX_BATCH_BYTES = 256 * 1024;
/** The client flushes its batch this often (and at pagehide via navigator.sendBeacon). */
export const TRACE_FLUSH_MS = 2000;
/** The request-id header the client sets on every /api call; the server echoes it on srv.* events. */
export const TRACE_RID_HEADER = "x-taxila-rid";

// ───────────────────────────── transport ─────────────────────────────
/** POST /api/trace/batch. Auth is the session cookie; anonymous public pages send pid only (no cid/gid: the server fills those). */
export interface TraceBatchRequest {
  v: 1;
  pid: string;
  /** Client clock minus server clock, as measured by the client (ms); the server applies it to client `t`. */
  skewMs?: number;
  events: TraceEvent[];
}
export interface TraceBatchResponse {
  accepted: number;
  /** Events refused (oversized, malformed, a src other than "client", a tier the account does not have). */
  rejected: number;
  /** The tier this account records at (the client must not send tier-2 events otherwise). */
  tier: TraceTier;
}

/**
 * POST /api/trace/blob?sid=&src=&seq=&ext=&type=  (body: the raw bytes). Tier-2 accounts for client media; the server writes
 * its own tier-2 blobs (model prompts and raw responses) directly. Returns the ref to put in `data.blob`.
 */
export interface TraceBlobResponse extends TraceBlobRef {}

/** GET /api/me carries this, so the client knows which tier to record at (and shows the REC chip at tier 2). */
export interface TraceMe {
  tier: TraceTier;
}

// ───────────────────────────── the minimum kind set (brief §"Kinds"; add more freely, never rename) ─────────────────────────────
export const TRACE_KINDS = {
  client: [
    "ui.route", "ui.tap", "ui.render.stage", "ui.render.card", "ui.chips", "ui.state",
    "ui.image.load", "ui.image.error", "ui.media",
    "net.req", "net.res", "net.err", "net.sse",
    "err.js", "err.promise", "perf.lcp", "perf.longtask", "perf.memory", "dev.info",
    "flag.owner", "rrweb.chunk", "audio.mic.chunk", "audio.tts.clip",
  ],
  voice: [
    "mic.mode", "mic.state", "vad.start", "vad.end",
    "asr.partial", "asr.final",
    "tts.request", "tts.start", "tts.end", "tts.interrupt", "tts.error", "bargein",
    "ack.outcome",
  ],
  server: [
    "srv.req", "srv.res",
    "model.call",
    "director.turn", "turn.speculation_miss",
    "studio.slot.open", "studio.slot.plan", "studio.slot.build", "studio.slot.qa", "studio.slot.filled", "studio.slot.failed", "studio.slot.timeout",
    "studio.slot.refused", "studio.rung_replaced",
    "board.page", "forge.job.start", "forge.job.end", "job.start", "job.end", "play.mount", "play.act", "play.outcome",
    "tts.first", "tts.end", "tts.failed",
    "safety.scan", "safety.hold", "classify.verdict",
    "ack.decision",
    "db.write", "trace.dropped",
  ],
} as const;
export type TraceKind = (typeof TRACE_KINDS)[keyof typeof TRACE_KINDS][number] | (string & {});

/** Never recorded, anywhere (masking is gate-tested): input names and header names whose values are replaced by "[masked]". */
export const TRACE_MASK_KEYS = [
  "password", "pin", "newPin", "currentPin", "email", "phone", "otp", "token", "secret", "apiKey", "api_key", "key",
  "authorization", "cookie", "set-cookie", "x-api-key", "client_secret", "ephemeralKey",
] as const;
