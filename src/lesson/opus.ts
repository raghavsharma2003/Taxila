// Round 7, stream B Voice (QA D12, voice-tts-transport): the device side of Opus TTS frames (server/voice/frames.js type 6,
// server/voice/opus.js). One frame = one raw 20 ms Opus packet, 24 kHz mono; WebCodecs AudioDecoder turns it back into PCM
// s16le inside readFrames / pcmOfFrames (./ttsStream.ts), so the player and every mark keyed on samples are unchanged.
// Asked for (`codec=opus+…` in the Accept) only where AudioDecoder says it can decode Opus; everywhere else the old
// negotiation stands (ADPCM on a slow link, else PCM). A device / URL override: `?tts=opus|adpcm|pcm|auto` (./adpcm.ts key).

export const OPUS_RATE = 24_000;
export const OPUS_FRAME_US = 20_000;

type AudioDecoderCtor = {
  new (init: { output: (d: AudioDataLike) => void; error: (e: unknown) => void }): AudioDecoderLike;
  isConfigSupported(c: { codec: string; sampleRate: number; numberOfChannels: number }): Promise<{ supported?: boolean }>;
};
interface AudioDecoderLike {
  configure(c: { codec: string; sampleRate: number; numberOfChannels: number }): void;
  decode(chunk: unknown): void;
  flush(): Promise<void>;
  close(): void;
  readonly state?: string;
}
interface AudioDataLike {
  numberOfFrames: number;
  copyTo(dest: Float32Array, o: { planeIndex: number; format?: string }): void;
  close(): void;
}
type ChunkCtor = new (init: { type: "key"; timestamp: number; data: Uint8Array }) => unknown;

const g = globalThis as unknown as { AudioDecoder?: AudioDecoderCtor; EncodedAudioChunk?: ChunkCtor };
const CONFIG = { codec: "opus", sampleRate: OPUS_RATE, numberOfChannels: 1 };

let supported: boolean | null = null;
/** Settled once: can this device decode 24 kHz mono Opus with WebCodecs? Until it settles, Opus is not asked for. */
export function opusSupported(): boolean | null { return supported; }
export async function probeOpus(): Promise<boolean> {
  if (supported !== null) return supported;
  try {
    supported = !!g.AudioDecoder && !!g.EncodedAudioChunk && !!(await g.AudioDecoder.isConfigSupported(CONFIG)).supported;
  } catch {
    supported = false;
  }
  return supported;
}
/** Tests: forget the probe. */
export function resetOpusProbe(v: boolean | null = null): void { supported = v; }
// probe once at load, in the browser (the first TTS request usually comes seconds later)
if (typeof window !== "undefined") void probeOpus();

/** f32 → s16le bytes. */
function s16(f: Float32Array): Uint8Array {
  const out = new Uint8Array(f.length * 2);
  const v = new DataView(out.buffer);
  for (let i = 0; i < f.length; i++) {
    const x = f[i] > 1 ? 1 : f[i] < -1 ? -1 : f[i];
    v.setInt16(i * 2, Math.round(x < 0 ? x * 0x8000 : x * 0x7fff), true);
  }
  return out;
}

/**
 * One reply's decoder: decode(packet) resolves with that packet's PCM s16le, in order. A decoder error (or no WebCodecs)
 * resolves the packet as 20 ms of silence, never a stall: the reply keeps its length and its marks.
 */
export class OpusPcmDecoder {
  private dec: AudioDecoderLike | null = null;
  private waiting: ((pcm: Uint8Array) => void)[] = [];
  private ts = 0;
  private readonly env: { AudioDecoder?: AudioDecoderCtor; EncodedAudioChunk?: ChunkCtor };
  constructor(env: { AudioDecoder?: AudioDecoderCtor; EncodedAudioChunk?: ChunkCtor } = g) { this.env = env; }

  private open(): AudioDecoderLike | null {
    if (this.dec) return this.dec;
    const AD = this.env.AudioDecoder;
    if (!AD || !this.env.EncodedAudioChunk) return null;
    try {
      this.dec = new AD({
        output: (d) => {
          const f = new Float32Array(d.numberOfFrames);
          try { d.copyTo(f, { planeIndex: 0, format: "f32-planar" }); } finally { d.close(); }
          this.waiting.shift()?.(s16(f));
        },
        error: () => { this.fail(); },
      });
      this.dec.configure(CONFIG);
    } catch {
      this.dec = null;
    }
    return this.dec;
  }

  private fail(): void {
    const silent = new Uint8Array((OPUS_RATE / 50) * 2);
    for (const w of this.waiting.splice(0)) w(silent);
    try { this.dec?.close(); } catch { /* closed */ }
    this.dec = null;
  }

  decode(packet: Uint8Array): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const dec = this.open();
      if (!dec) { resolve(new Uint8Array((OPUS_RATE / 50) * 2)); return; }
      this.waiting.push(resolve);
      try {
        dec.decode(new this.env.EncodedAudioChunk!({ type: "key", timestamp: this.ts, data: packet }));
        this.ts += OPUS_FRAME_US;
        // WebCodecs may hold the last packet until more input or a flush: flush when nothing else is queued behind it
        queueMicrotask(() => { if (this.waiting.length && this.waiting[this.waiting.length - 1] === resolve) void dec.flush?.().catch(() => this.fail()); });
      } catch {
        this.fail();
      }
    });
  }

  close(): void {
    try { this.dec?.close(); } catch { /* closed */ }
    this.dec = null;
  }
}
