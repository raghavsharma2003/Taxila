// Streamed teacher speech for the cascade lane: POST /api/voice/tts-stream returns raw PCM (s16le, 24 kHz,
// mono) as a chunked response; PcmStreamPlayer schedules each chunk on a WebAudio graph the moment it
// arrives, so the teacher starts speaking on the first sentence's first bytes. One graph for the whole
// lesson: player → duck gain → analyser (lip-sync, same LevelMeter API as the other links) → speakers.
// Stopping is synchronous (every scheduled source is stopped and the fetch aborted), which is what makes
// barge-in immediate. Pausing is too, but keeps the reply: the stream keeps arriving into the buffer and
// resume() replays from just before where she was cut (a cough, the TV or a "hmm" must not eat her question).
import type { TtsRequest } from "../../shared/contracts.ts";
import { ApiError } from "./api.ts";

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

export type SpeechStreamFetch = (req: TtsRequest, signal: AbortSignal) => Promise<ReadableStream<Uint8Array>>;

/** POST /api/voice/tts-stream → the PCM body stream. */
export const fetchSpeechStream: SpeechStreamFetch = async (req, signal) => {
  const res = await fetch("/api/voice/tts-stream", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) throw new ApiError(res.status, `speech failed (${res.status})`, await res.text().catch(() => ""));
  return res.body;
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

  /** Play one streamed reply; a previous one is stopped first. */
  play(open: (signal: AbortSignal) => Promise<ReadableStream<Uint8Array>>): StreamPlayback {
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
      }
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
        const body = await open(abort.signal);
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
