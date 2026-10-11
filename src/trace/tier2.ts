// Tier 2 of the flight recorder (owner cohort only; the account's tier comes from /api/me's `trace.tier` or a batch
// response): a DOM replay of the page with rrweb (MIT, self-hosted in the bundle, lazy-loaded so tier 1 never downloads
// it), canvases sampled (the board, games) so the replay shows what was drawn. Inputs are masked by rrweb itself, and
// password / email / tel fields never record. Chunks go to POST /api/trace/blob and are pointed at by `rrweb.chunk`
// events. Never for tier 1: start() refuses unless the bus says tier 2, and stops if the tier drops.
import { getTier, emit, onTier, sid, busy } from "./bus.ts";

type RrEvent = { type: number; timestamp: number; data?: unknown };
interface Rec { stop: () => void; buf: RrEvent[]; bytes: number; seq: number; timer: ReturnType<typeof setInterval>; sid: string }
let rec: Rec | null = null;
let send: typeof fetch | null = null;
/** Harness hook: see each chunk's events as they are cut (the replay proof reads them here or from the blob route). */
let tap: ((events: RrEvent[]) => void) | null = null;
export const setChunkTap = (fn: ((events: RrEvent[]) => void) | null) => { tap = fn; };

const CHUNK_MS = 10_000, CHUNK_BYTES = 400_000;

async function cut(beacon = false): Promise<void> {
  const r = rec;
  if (!r || !r.buf.length) return;
  const events = r.buf.splice(0);
  r.bytes = 0;
  const seq = ++r.seq;
  try { tap?.(events); } catch { /* harness only */ }
  const body = busy(() => JSON.stringify(events)) ?? "[]";
  const first = events[0].timestamp, last = events[events.length - 1].timestamp;
  const q = new URLSearchParams({ sid: r.sid, src: "client", seq: String(seq), ext: "json", type: "application/x-rrweb+json" });
  const url = `/api/trace/blob?${q}`;
  if (beacon) {
    // pagehide: the browser keeps the beacon alive after the page is gone (under its 64 KB limit only)
    if (body.length < 60_000) navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }));
    emit("rrweb.chunk", { seq, events: events.length, bytes: body.length, from: first, to: last, beacon: true }, { tier: 2 });
    return;
  }
  try {
    const res = await send!(url, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body });
    const ref = res.ok ? await res.json().catch(() => null) : null;
    emit("rrweb.chunk", { seq, events: events.length, bytes: body.length, from: first, to: last, ...(ref?.ref ? { blob: { ref: ref.ref, bytes: ref.bytes ?? body.length, type: "application/x-rrweb+json" } } : { failed: res.status }) }, { tier: 2 });
  } catch (e) {
    emit("rrweb.chunk", { seq, events: events.length, bytes: body.length, from: first, to: last, failed: String((e as Error)?.message ?? e).slice(0, 200) }, { tier: 2 });
  }
}

/** Start the DOM recording (tier 2 only). Safe to call twice. */
export async function startReplay(): Promise<void> {
  if (rec || getTier() !== 2 || !send) return;
  try {
    const { record } = await import("rrweb");
    if (rec || getTier() !== 2) return;
    const r: Rec = { stop: () => {}, buf: [], bytes: 0, seq: 0, sid: sid(), timer: setInterval(() => { void cut(); }, CHUNK_MS) };
    rec = r;
    const stopFn = record({
      emit(ev) {
        r.buf.push(ev as RrEvent);
        r.bytes += 200; // cheap estimate; the cut measures the real size
        if (r.buf.length > 3000 || r.bytes > CHUNK_BYTES) void cut();
      },
      recordCanvas: true,
      sampling: { canvas: 4, mousemove: 200, scroll: 150, input: "last" },
      dataURLOptions: { type: "image/webp", quality: 0.6 },
      maskAllInputs: true,
      maskInputOptions: { password: true, email: true, tel: true, text: true, textarea: true },
      inlineStylesheet: true,
      collectFonts: false,
      blockSelector: "[data-trace-block]",
    });
    // focus moved by the app's own code (the type row opening, a sheet) is not an rrweb interaction: record which node
    // holds focus as a custom event, so the replay shows the same focus ring (scripts/trace-replay.mjs applies it)
    // (read a moment later: a just-mounted field has no rrweb id until rrweb's mutation batch has serialized it)
    const note = () => { try { const el = document.activeElement; const id = el && el !== document.body ? record.mirror.getId(el) : -1; record.addCustomEvent("trace.focus", { id }); } catch { /* replay detail only */ } };
    const onFocus = () => { setTimeout(note, 60); };
    addEventListener("focusin", onFocus, true);
    addEventListener("focusout", onFocus, true);
    r.stop = () => { try { stopFn?.(); removeEventListener("focusin", onFocus, true); removeEventListener("focusout", onFocus, true); } catch { /* already stopped */ } };
    emit("rrweb.start", { chunkMs: CHUNK_MS, canvasFps: 4 }, { tier: 2 });
    addEventListener("pagehide", () => { void cut(true); }, { once: true });
  } catch (e) {
    emit("rrweb.error", { message: String((e as Error)?.message ?? e).slice(0, 300) });
  }
}

export function stopReplay(): void {
  if (!rec) return;
  void cut();
  clearInterval(rec.timer);
  rec.stop();
  rec = null;
}

/** A new lesson starts a new trace session: the current chunk closes, the next ones belong to the lesson. */
export function sessionChanged(): void {
  if (!rec) return;
  void cut();
  rec.sid = sid();
}

export function installTier2(origFetch: typeof fetch): void {
  send = origFetch;
  onTier((t) => { if (t === 2) void startReplay(); else stopReplay(); });
  if (getTier() === 2) void startReplay();
}

/**
 * T-voice's door for tier-2 audio (mic chunks, the TTS clips she played): upload the bytes to POST /api/trace/blob and
 * record `kind` (audio.mic.chunk | audio.tts.clip) pointing at the blob. Tier 2 only: at tier 1 it does nothing (no
 * audio is ever kept outside tier 2). Never throws; resolves false when nothing was kept.
 */
let blobSeq = 0;
export async function traceBlob(kind: "audio.mic.chunk" | "audio.tts.clip" | (string & {}), bytes: Blob, o: { ext: string; data?: Record<string, unknown> }): Promise<boolean> {
  try {
    if (getTier() !== 2 || !send) return false;
    const seq = ++blobSeq;
    const q = new URLSearchParams({ sid: sid(), src: "client", seq: `b${seq}`, ext: o.ext, type: bytes.type || "application/octet-stream" });
    const res = await send(`/api/trace/blob?${q}`, { method: "POST", credentials: "same-origin", headers: { "content-type": bytes.type || "application/octet-stream" }, body: bytes });
    const ref = res.ok ? await res.json().catch(() => null) : null;
    emit(kind, { ...(o.data ?? {}), bytes: bytes.size, ...(ref?.ref ? { blob: { ref: ref.ref, bytes: bytes.size, type: bytes.type } } : { failed: res.status }) }, { tier: 2 });
    return !!ref?.ref;
  } catch { return false; }
}
