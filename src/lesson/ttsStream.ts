// Streamed teacher speech for the cascade lane: POST /api/voice/tts-stream returns raw PCM (s16le, 24 kHz,
// mono) as a chunked response; PcmStreamPlayer schedules each chunk on a WebAudio graph the moment it
// arrives, so the teacher starts speaking on the first sentence's first bytes. One graph for the whole
// lesson: player → duck gain → analyser (lip-sync, same LevelMeter API as the other links) → speakers.
// Stopping is synchronous (every scheduled source is stopped and the fetch aborted), which is what makes
// barge-in immediate. Pausing is too, but keeps the reply: the stream keeps arriving into the buffer and
// resume() replays from just before where she was cut (a cough, the TV or a "hmm" must not eat her question).
import type { TtsRequest, TurnRequest, TurnResponse } from "../../shared/contracts.ts";
import { ApiError } from "./api.ts";
import { markLineAudioStart } from "../modules/whiteboard/clock.ts";

export const PCM_RATE = 24_000;
/** Lead before the first chunk plays: absorbs network jitter between chunks without audible delay. */
export const START_LEAD_S = 0.06;
/** A chunk that arrives after the previous one ran out restarts this far ahead (a gap, not a click). */
const RESUME_LEAD_S = 0.03;
/** Each underrun (audio ran out mid-reply: a slow or jittery link) adds this to later replies' start lead... */
const LEAD_STEP_S = 0.04;
/** ...up to this much. 384 kbit/s of PCM on a jittery 3G/4G link is the case (not yet measured on one). */
const MAX_LEAD_S = 0.3;
/** Resume backs up to the last pause between words within this window (else by RESUME_BACKUP_S). */
const RESUME_SEARCH_S = 1.2;
const RESUME_BACKUP_S = 0.3;

/**
 * Where to resume a reply cut at `pos`: the middle of the last ≥60 ms quiet stretch (a gap between words)
 * that ends at or before `pos`, within RESUME_SEARCH_S; else RESUME_BACKUP_S back. Pure (tested in Node).
 */
export function resumePoint(samples: Float32Array, pos: number, rate = PCM_RATE): number {
  const win = Math.round(rate * 0.06);
  const hop = Math.round(rate * 0.01);
  const lo = Math.max(0, pos - Math.round(rate * RESUME_SEARCH_S));
  for (let end = Math.min(pos, samples.length); end - win >= lo; end -= hop) {
    let sum = 0;
    for (let i = end - win; i < end; i++) sum += samples[i] * samples[i];
    if (Math.sqrt(sum / win) < 0.015) return end - (win >> 1);
  }
  return Math.max(0, pos - Math.round(rate * RESUME_BACKUP_S));
}

/**
 * PCM16 little-endian bytes → Float32 samples, carrying an odd trailing byte to the next chunk (HTTP
 * chunk boundaries do not respect sample boundaries). Pure, so it is tested in Node.
 */
export class Pcm16Decoder {
  private carry: number | null = null;

  push(bytes: Uint8Array): Float32Array {
    let src = bytes;
    if (this.carry !== null) {
      const merged = new Uint8Array(bytes.length + 1);
      merged[0] = this.carry;
      merged.set(bytes, 1);
      src = merged;
      this.carry = null;
    }
    const n = src.length >> 1;
    if (src.length & 1) this.carry = src[src.length - 1];
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let v = src[2 * i] | (src[2 * i + 1] << 8);
      if (v >= 0x8000) v -= 0x10000;
      out[i] = v / 0x8000;
    }
    return out;
  }

  reset(): void {
    this.carry = null;
  }
}

export interface StreamPlayback {
  /** Resolves when the first sample is scheduled to sound (ms epoch), rejects if nothing ever played. */
  readonly started: Promise<number>;
  /** Resolves when the last sample has played (or the stream was stopped): "completed" | "stopped" | "failed". */
  readonly ended: Promise<"completed" | "stopped" | "failed">;
  stop(): void;
  /** Silence her now but keep the reply (the stream keeps buffering). false if nothing was sounding. */
  pause(): boolean;
  /** Carry on from just before where pause() cut her. */
  resume(): void;
  readonly paused: boolean;
  /** Seconds of this reply not yet heard (buffered or still arriving counts only what has arrived). */
  remainingS(): number;
}

/**
 * Where a reply's clause onsets go when a player plays it (PcmStreamPlayer.play passes one to `open`): the player then
 * emits each clause on ITS clock, when the sample is scheduled (fixer 2026-10-05, w2g-clause-events-on-player-clock).
 * Without a sink, clause frames go straight to onTtsEvent when they are parsed (the old behaviour).
 */
export interface ClauseSink { clause(ev: TtsClauseEvent): void }
export type SpeechStreamFetch = (req: TtsRequest, signal: AbortSignal, sink?: ClauseSink) => Promise<ReadableStream<Uint8Array>>;

// ───────────── framed TTS v2 (HUMAN-VOICE §5.14, server/voice/frames.js) ─────────────
// `[type u8][len u24 BE][payload]`: 0 PCM, 1 event JSON, 2 header JSON, 3 turn JSON (turn-audio), 4 end JSON. The
// server frames only when asked (Accept below); an older server answers raw audio/pcm and the client reads it as before.

export const FRAMES_ACCEPT = "application/x-taxila-pcm-frames;v=2";
export const FRAME = { pcm: 0, event: 1, header: 2, turn: 3, end: 4 } as const;
export interface TtsFrame {
  type: number;
  /** PCM bytes for type 0, the parsed JSON otherwise. */
  payload: Uint8Array | Record<string, unknown>;
}
/**
 * A clause onset in the reply's audio: `atMs` from the reply's first sample (the whiteboard's clause anchor). `playAt` is
 * set when a PcmStreamPlayer emitted it: the performance.now() time that sample actually sounds (start lead, underrun
 * gaps and pause/resume included) — the time a renderer should key on.
 */
export interface TtsClauseEvent { t: "clause"; clause: number; part: number; atSample: number; atMs: number; playAt?: number }
/** What the frame stream tells listeners: the reply it belongs to, plus the frame's JSON. */
export type TtsEvent = { req: TtsRequest } & ({ kind: "header"; data: Record<string, unknown> } | { kind: "clause"; data: TtsClauseEvent }
  | { kind: "voice"; data: Record<string, unknown> } | { kind: "end"; data: Record<string, unknown> });

const listeners = new Set<(e: TtsEvent) => void>();
/** Subscribe to framed-TTS events (clause onsets, header, end); returns the unsubscribe. */
export function onTtsEvent(fn: (e: TtsEvent) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(e: TtsEvent): void {
  for (const fn of listeners) {
    try {
      fn(e);
    } catch {
      /* a listener's bug never stops the voice */
    }
  }
}

/** Incremental frame parser over arbitrary chunk boundaries. Pure (tested in Node). */
export class FrameParser {
  private buf = new Uint8Array(0);
  push(bytes: Uint8Array): TtsFrame[] {
    const merged = new Uint8Array(this.buf.length + bytes.length);
    merged.set(this.buf, 0);
    merged.set(bytes, this.buf.length);
    const out: TtsFrame[] = [];
    let i = 0;
    while (i + 4 <= merged.length) {
      const len = (merged[i + 1] << 16) | (merged[i + 2] << 8) | merged[i + 3];
      if (i + 4 + len > merged.length) break;
      const type = merged[i];
      const body = merged.subarray(i + 4, i + 4 + len);
      if (type === FRAME.pcm) out.push({ type, payload: body.slice() });
      else {
        try {
          out.push({ type, payload: JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown> });
        } catch {
          /* a malformed JSON frame is skipped, never fatal */
        }
      }
      i += 4 + len;
    }
    this.buf = merged.slice(i);
    return out;
  }
}

/** Async iteration over the frames of a framed body. */
export async function* readFrames(body: ReadableStream<Uint8Array>): AsyncGenerator<TtsFrame> {
  const reader = body.getReader();
  const parser = new FrameParser();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      for (const f of parser.push(value)) yield f;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * A framed body → a PCM-only stream (what PcmStreamPlayer plays), JSON frames going to `onFrame`. The first frame is
 * awaited by the caller of `onTurn`-style consumers through `onFrame`.
 */
export function pcmOfFrames(body: ReadableStream<Uint8Array>, onFrame: (f: TtsFrame) => void): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const parser = new FrameParser();
  return new ReadableStream<Uint8Array>({
    async pull(ctl) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          ctl.close();
          return;
        }
        let pushed = false;
        for (const f of parser.push(value)) {
          if (f.type === FRAME.pcm) {
            ctl.enqueue(f.payload as Uint8Array);
            pushed = true;
          } else onFrame(f);
        }
        if (pushed) return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

const isFramed = (res: Response) => /x-taxila-pcm-frames/i.test(res.headers.get("content-type") ?? "");
const eventOf = (req: TtsRequest, f: TtsFrame): TtsEvent | null => {
  const data = f.payload as Record<string, unknown>;
  if (f.type === FRAME.header) return { req, kind: "header", data };
  if (f.type === FRAME.end) return { req, kind: "end", data };
  if (f.type === FRAME.event) return data.t === "clause" ? { req, kind: "clause", data: data as unknown as TtsClauseEvent } : { req, kind: "voice", data };
  return null;
};

// ───────────── the round-trip fold (POST /api/lesson/turn-audio, BUILD-PLAN W2-G #7) ─────────────
// postTurnAudio() is a drop-in for the runtime's POST /api/lesson/turn: it resolves with the same TurnResponse, and the
// reply's audio that came on the same response is parked by (lessonId, seq), so the link's next fetchSpeechStream for
// that turn plays it with no second request. Flag `voice.turnAudio` (default OFF until the probe fleet measures it):
// `?turnaudio=1`, localStorage "tx.flag.voice.turnAudio" = "1", or VITE_TURN_AUDIO=1.
export const TURN_AUDIO_KEY = "tx.flag.voice.turnAudio";
export function turnAudioEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("turnaudio");
      if (v === "1" || v === "0") localStorage.setItem(TURN_AUDIO_KEY, v);
    }
    const v = typeof localStorage !== "undefined" ? localStorage.getItem(TURN_AUDIO_KEY) : null;
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* storage blocked */
  }
  return (import.meta as { env?: Record<string, string> }).env?.VITE_TURN_AUDIO === "1";
}

interface Fold { stream: ReadableStream<Uint8Array>; at: number; req: TtsRequest; sink: ClauseSink | null; pending: TtsClauseEvent[] }
const folded = new Map<string, Fold>();
const FOLD_TTL_MS = 30_000;
const foldKey = (lessonId: string, seq: number) => `${lessonId}:${seq}`;
/**
 * The audio a turn-audio response carried for (lessonId, seq), once; null when none is parked. Its clause events (held
 * while it was parked) go to `sink`, or to onTtsEvent when there is none.
 */
export function takeFoldedAudio(lessonId: string, seq: number, sink?: ClauseSink): ReadableStream<Uint8Array> | null {
  const k = foldKey(lessonId, seq);
  const f = folded.get(k);
  folded.delete(k);
  if (!f) return null;
  if (Date.now() - f.at > FOLD_TTL_MS) {
    void f.stream.cancel().catch(() => {});
    return null;
  }
  const req = f.req;
  f.sink = sink ?? { clause: (data) => emit({ req, kind: "clause", data }) };
  for (const ev of f.pending.splice(0)) f.sink.clause(ev);
  return f.stream;
}

/** POST /api/lesson/turn-audio → the TurnResponse; the reply's audio is parked for the link's speech fetch. */
export async function postTurnAudio(req: TurnRequest, signal?: AbortSignal): Promise<TurnResponse> {
  const res = await fetch("/api/lesson/turn-audio", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", accept: FRAMES_ACCEPT },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body || !isFramed(res)) {
    const text = await res.text().catch(() => "");
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* not JSON */
    }
    const msg = (data as { error?: unknown } | null)?.error;
    throw new ApiError(res.status, typeof msg === "string" ? msg : `POST /api/lesson/turn-audio failed (${res.status})`, data);
  }
  let resolveTurn!: (t: TurnResponse) => void;
  let rejectTurn!: (e: unknown) => void;
  const turn = new Promise<TurnResponse>((a, b) => {
    resolveTurn = a;
    rejectTurn = b;
  });
  // PCM frames go into a stream the player reads later (backpressure holds the body until it does); JSON frames are
  // the turn (resolves the call), then the reply's events.
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const body = res.body;
  let ttsReq: TtsRequest | null = null;
  let fold: Fold | null = null;
  let gotTurn = false;
  let audioFollows = false;
  void (async () => {
    try {
      for await (const f of readFrames(body)) {
        if (f.type === FRAME.header && !gotTurn) {
          audioFollows = (f.payload as Record<string, unknown>).audio === "follows";
        } else if (f.type === FRAME.turn) {
          gotTurn = true;
          const t = f.payload as unknown as TurnResponse;
          if (Number.isInteger(t.teacherReplySeq)) {
            ttsReq = { lessonId: req.lessonId, seq: t.teacherReplySeq as number };
            // parked only when this response carries the audio; else the link fetches it by seq as before
            if (audioFollows) {
              const k = foldKey(req.lessonId, ttsReq.seq);
              fold = { stream: readable, at: Date.now(), req: ttsReq, sink: null, pending: [] };
              folded.set(k, fold);
              // nobody took it (the runtime chose not to speak): release the response
              const timer: unknown = setTimeout(() => {
                if (folded.get(k)?.stream === readable) {
                  folded.delete(k);
                  void readable.cancel().catch(() => {});
                }
              }, FOLD_TTL_MS);
              (timer as { unref?: () => void }).unref?.(); // Node (tests): never hold the process open
            }
          }
          resolveTurn(t);
        } else if (f.type === FRAME.pcm) {
          await writer.write(f.payload as Uint8Array);
        } else if (ttsReq) {
          const e = eventOf(ttsReq, f);
          if (e?.kind === "end" && (e.data.audio === "none" || e.data.audio === "rate_limited")) folded.delete(foldKey(ttsReq.lessonId, ttsReq.seq));
          // clause onsets belong to whoever plays the parked audio (its player's clock), held until it is taken
          if (e?.kind === "clause" && fold) {
            if (fold.sink) fold.sink.clause(e.data);
            else fold.pending.push(e.data);
          } else if (e) emit(e);
        }
      }
      if (!gotTurn) rejectTurn(new ApiError(502, "turn-audio ended without a turn", null));
      await writer.close().catch(() => {});
    } catch (e) {
      if (!gotTurn) rejectTurn(e);
      await writer.abort(e).catch(() => {});
      void body.cancel().catch(() => {});
    }
  })();
  return turn;
}

/** POST /api/voice/tts-stream → the PCM body stream (framed v2 when the server supports it; events to onTtsEvent). */
export const fetchSpeechStream: SpeechStreamFetch = async (req, signal, sink) => {
  const parked = takeFoldedAudio(req.lessonId, req.seq, sink);
  if (parked) return parked;
  const res = await fetch("/api/voice/tts-stream", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", accept: FRAMES_ACCEPT },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) throw new ApiError(res.status, `speech failed (${res.status})`, await res.text().catch(() => ""));
  if (!isFramed(res)) return res.body;
  return pcmOfFrames(res.body, (f) => {
    const e = eventOf(req, f);
    if (e?.kind === "clause" && sink) sink.clause(e.data);
    else if (e) emit(e);
  });
};

export class PcmStreamPlayer {
  readonly output: GainNode;
  /** Times audio ran out mid-reply (each one lengthens the next reply's start lead). */
  underruns = 0;
  private readonly ctx: AudioContext;
  private current: { stop: () => void } | null = null;
  private lead = START_LEAD_S;

  /** `destination` is where the teacher's voice goes (an analyser chain ending at the speakers). */
  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.connect(destination);
  }

  get playing(): boolean {
    return this.current !== null;
  }

  /** The start lead the next reply gets (grows with underruns). */
  get startLeadS(): number {
    return this.lead;
  }

  /** Lower (or restore) the teacher's level within ~10 ms — the local barge-in hint before the server confirms. */
  duck(level: number): void {
    const g = this.output.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(level, this.ctx.currentTime, 0.01);
  }

  /**
   * Play one streamed reply; a previous one is stopped first. `opts.req` names the reply: the player marks the
   * whiteboard's line anchor (clock.ts markLineAudioStart) at the time its FIRST sample is scheduled to sound, and emits
   * the reply's clause onsets (handed to `open` as a ClauseSink) on onTtsEvent with `playAt` = when that sample sounds.
   * Fixer 2026-10-05 (w2g-clause-events-on-player-clock): the player is the source of timing, never the network.
   */
  play(open: (signal: AbortSignal, sink: ClauseSink) => Promise<ReadableStream<Uint8Array>>, opts: { req?: TtsRequest } = {}): StreamPlayback {
    this.current?.stop();
    this.duck(1);
    const ctx = this.ctx;
    const abort = new AbortController();
    const decoder = new Pcm16Decoder();
    const sources = new Set<AudioBufferSourceNode>();
    // Every decoded sample of the reply, so a pause can replay what the child talked over.
    let buf = new Float32Array(PCM_RATE * 4);
    let total = 0;
    let schedPos = 0; // samples [0, schedPos) are scheduled (or were heard)
    let anchor = { at: 0, pos: 0 }; // ctx time `at` sounds sample `pos` (contiguous from there to schedPos)
    let nextAt = 0;
    let finished = false;
    let streamDone = false;
    let paused = false;
    let resuming = false;
    // clause onsets: pending until the sample they name is scheduled; `emitted` = already told to listeners
    const clauses: TtsClauseEvent[] = [];
    const emitted = new Set<TtsClauseEvent>();
    const req = opts.req;
    const perfNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
    /** Emit every not-yet-emitted onset inside [from, to), which starts sounding at ctx time `startAt`. */
    const emitClauses = (from: number, to: number, startAt: number) => {
      if (!req) return;
      const base = perfNow() + (startAt - ctx.currentTime) * 1000;
      for (const ev of clauses) {
        if (emitted.has(ev) || ev.atSample >= to || ev.atSample < from) continue;
        emitted.add(ev);
        emit({ req, kind: "clause", data: { ...ev, playAt: base + ((ev.atSample - from) / PCM_RATE) * 1000 } });
      }
    };
    const sink: ClauseSink = {
      clause: (ev) => {
        if (finished) return;
        clauses.push(ev);
        // an onset for audio already scheduled (it came after its PCM): emit it on the timeline it already has
        if (ev.atSample < schedPos && ev.atSample >= anchor.pos) emitClauses(anchor.pos, schedPos, anchor.at);
      },
    };
    let resolveStart!: (at: number) => void;
    let rejectStart!: (err: unknown) => void;
    let resolveEnd!: (s: "completed" | "stopped" | "failed") => void;
    const started = new Promise<number>((res, rej) => {
      resolveStart = res;
      rejectStart = rej;
    });
    started.catch(() => {});
    const ended = new Promise<"completed" | "stopped" | "failed">((res) => (resolveEnd = res));
    let didStart = false;

    const silenceSources = () => {
      for (const s of sources) {
        s.onended = null;
        try {
          s.stop();
        } catch {
          /* not started yet */
        }
        s.disconnect();
      }
      sources.clear();
    };
    const finish = (status: "completed" | "stopped" | "failed") => {
      if (finished) return;
      finished = true;
      abort.abort();
      silenceSources();
      if (this.current === handle) this.current = null;
      if (!didStart) rejectStart(new Error(status === "stopped" ? "speech stopped" : "no speech audio"));
      resolveEnd(status);
    };
    const maybeDone = () => {
      if (streamDone && !paused && sources.size === 0 && schedPos >= total) finish(didStart ? "completed" : "failed");
    };
    const handle = { stop: () => finish("stopped") };
    this.current = handle;

    const append = (samples: Float32Array) => {
      if (total + samples.length > buf.length) {
        const grown = new Float32Array(Math.max(buf.length * 2, total + samples.length));
        grown.set(buf.subarray(0, total));
        buf = grown;
      }
      buf.set(samples, total);
      total += samples.length;
    };
    /** Schedule everything buffered past schedPos, right after what is already scheduled. */
    const pump = () => {
      if (paused || finished || schedPos >= total) return;
      const n = total - schedPos;
      const ab = ctx.createBuffer(1, n, PCM_RATE);
      ab.getChannelData(0).set(buf.subarray(schedPos, total));
      const src = ctx.createBufferSource();
      src.buffer = ab;
      src.connect(this.output);
      const now = ctx.currentTime;
      if (nextAt < now) {
        if (didStart && !resuming && !streamDone) {
          // Ran dry mid-reply (not a resume): the link is slower than real time.
          this.underruns++;
          this.lead = Math.min(MAX_LEAD_S, this.lead + LEAD_STEP_S);
        }
        nextAt = now + (didStart ? RESUME_LEAD_S : this.lead);
        anchor = { at: nextAt, pos: schedPos };
      }
      resuming = false;
      src.start(nextAt);
      if (!didStart) {
        didStart = true;
        resolveStart(Date.now() + Math.max(0, (nextAt - now) * 1000));
        // the whiteboard's anchor: her first sample, on the performance.now() clock clock.ts uses
        try {
          markLineAudioStart(req ? { lessonId: req.lessonId, teacherReplySeq: req.seq } : {}, perfNow() + Math.max(0, (nextAt - now) * 1000));
        } catch {
          /* a renderer's bug never stops the voice */
        }
      }
      emitClauses(schedPos, total, nextAt);
      nextAt += ab.duration;
      schedPos = total;
      sources.add(src);
      src.onended = () => {
        sources.delete(src);
        src.disconnect();
        maybeDone();
      };
    };
    /** The sample sounding now. */
    const heardPos = () => Math.max(anchor.pos, Math.min(schedPos, anchor.pos + Math.floor((ctx.currentTime - anchor.at) * PCM_RATE)));

    void (async () => {
      try {
        const body = await open(abort.signal, sink);
        const reader = body.getReader();
        abort.signal.addEventListener("abort", () => void reader.cancel().catch(() => {}), { once: true });
        for (;;) {
          const { done, value } = await reader.read();
          if (done || finished) break;
          append(decoder.push(value));
          pump();
        }
        streamDone = true;
        maybeDone();
      } catch {
        streamDone = true;
        if (!finished) {
          if (abort.signal.aborted) finish("stopped");
          else if (!didStart) finish("failed");
          else maybeDone(); // mid-reply failure: what arrived still plays (or resumes) to its end
        }
      }
    })();

    const playback: StreamPlayback = {
      started,
      ended,
      stop: handle.stop,
      get paused() {
        return paused;
      },
      pause: () => {
        if (finished || paused) return false;
        const sounding = didStart && sources.size > 0;
        const pos = sounding ? heardPos() : schedPos;
        paused = true;
        silenceSources();
        schedPos = Math.min(pos, total);
        // onsets that were scheduled but never sounded are told again, on the resumed timeline
        for (const ev of clauses) if (ev.atSample >= schedPos) emitted.delete(ev);
        nextAt = 0;
        return sounding;
      },
      resume: () => {
        if (finished || !paused) return;
        paused = false;
        resuming = true;
        schedPos = didStart ? resumePoint(buf.subarray(0, total), schedPos) : schedPos;
        this.duck(1);
        pump();
        maybeDone();
      },
      remainingS: () => (total - (paused ? schedPos : heardPos())) / PCM_RATE,
    };
    return playback;
  }

  /** Stop whatever is playing, synchronously. */
  stop(): void {
    this.current?.stop();
  }
}
