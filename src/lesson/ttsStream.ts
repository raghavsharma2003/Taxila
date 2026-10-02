// Streamed teacher speech for the cascade lane: POST /api/voice/tts-stream returns raw PCM (s16le, 24 kHz,
// mono) as a chunked response; PcmStreamPlayer schedules each chunk on a WebAudio graph the moment it
// arrives, so the teacher starts speaking on the first sentence's first bytes. One graph for the whole
// lesson: player → duck gain → analyser (lip-sync, same LevelMeter API as the other links) → speakers.
// Stopping is synchronous (every scheduled source is stopped and the fetch aborted), which is what makes
// barge-in immediate.
import type { TtsRequest } from "../../shared/contracts.ts";
import { ApiError } from "./api.ts";

export const PCM_RATE = 24_000;
/** Lead before the first chunk plays: absorbs network jitter between chunks without audible delay. */
export const START_LEAD_S = 0.06;
/** A chunk that arrives after the previous one ran out restarts this far ahead (a gap, not a click). */
const RESUME_LEAD_S = 0.03;

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
  private readonly ctx: AudioContext;
  private current: { stop: () => void } | null = null;

  /** `destination` is where the teacher's voice goes (an analyser chain ending at the speakers). */
  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.connect(destination);
  }

  get playing(): boolean {
    return this.current !== null;
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
    let nextAt = 0;
    let finished = false;
    let streamDone = false;
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

    const finish = (status: "completed" | "stopped" | "failed") => {
      if (finished) return;
      finished = true;
      abort.abort();
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
      if (this.current === handle) this.current = null;
      if (!didStart) rejectStart(new Error(status === "stopped" ? "speech stopped" : "no speech audio"));
      resolveEnd(status);
    };
    const maybeDone = () => {
      if (streamDone && sources.size === 0) finish(didStart ? "completed" : "failed");
    };
    const handle = { stop: () => finish("stopped") };
    this.current = handle;

    const schedule = (samples: Float32Array) => {
      if (!samples.length || finished) return;
      const buf = ctx.createBuffer(1, samples.length, PCM_RATE);
      buf.getChannelData(0).set(samples);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.output);
      const now = ctx.currentTime;
      if (nextAt < now) nextAt = now + (didStart ? RESUME_LEAD_S : START_LEAD_S);
      src.start(nextAt);
      if (!didStart) {
        didStart = true;
        resolveStart(Date.now() + Math.max(0, (nextAt - now) * 1000));
      }
      nextAt += buf.duration;
      sources.add(src);
      src.onended = () => {
        sources.delete(src);
        src.disconnect();
        maybeDone();
      };
    };

    void (async () => {
      try {
        const body = await open(abort.signal);
        const reader = body.getReader();
        abort.signal.addEventListener("abort", () => void reader.cancel().catch(() => {}), { once: true });
        for (;;) {
          const { done, value } = await reader.read();
          if (done || finished) break;
          schedule(decoder.push(value));
        }
        streamDone = true;
        maybeDone();
      } catch {
        streamDone = true;
        if (!finished) finish(abort.signal.aborted ? "stopped" : didStart ? "completed" : "failed");
      }
    })();

    return { started, ended, stop: handle.stop };
  }

  /** Stop whatever is playing, synchronously. */
  stop(): void {
    this.current?.stop();
  }
}
