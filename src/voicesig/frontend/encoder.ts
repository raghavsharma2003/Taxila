// THE single ONNX Runtime session for the Smart Turn v3.2 backbone (SPEC §2.2 encoder.ts; RP §2.4). One per tab, shared
// by duplex (pTurnEnd via EngineHost.estimate) and voicesig (pooled embedding). The runtime module is INJECTED (the app
// loads onnxruntime-web lazily, behind the voicesig.frontend flag), so this file adds no dependency and runs in Node tests
// with a fake. A device-class probe at open (one pass on silence) disables the encoder for the session when it is too
// slow: the head then runs prosody-only, and audio is never sent to a server instead (decision vs-no-server-audio-fallback).

export interface OrtTensorLike { data: ArrayLike<number> | Float32Array; dims: readonly number[] }
export interface OrtSessionLike {
  run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensorLike>>;
  release?(): Promise<void> | void;
}
export interface OrtLike {
  InferenceSession: { create(model: string | Uint8Array, opts?: Record<string, unknown>): Promise<OrtSessionLike> };
  Tensor: new (type: "float32", data: Float32Array, dims: number[]) => unknown;
}

export interface EncoderConfig {
  model: string | Uint8Array;
  inputName?: string;
  logitsName?: string;
  pooledName?: string;
  /** Probe pass slower than this → encoder off for the session [E: 600 ms, VSP-M1 replaces it]. */
  probeMaxMs?: number;
  device?: "wasm1" | "wasm4" | "webgpu";
  now?: () => number;
}

export const PROBE_MAX_MS = 600;
/** Sessions ever created in this JS realm: the G-VS-ONE invariant reads it (must stay ≤ 1 per tab). */
export const encoderStats = { sessionsCreated: 0, passes: 0 };

let shared: Encoder | null = null;

export class Encoder {
  private session: OrtSessionLike | null = null;
  private opening: Promise<boolean> | null = null;
  private disabled = false;
  private readonly ort: OrtLike;
  private readonly cfg: Required<Omit<EncoderConfig, "model">> & { model: string | Uint8Array };

  private constructor(ort: OrtLike, cfg: EncoderConfig) {
    this.ort = ort;
    this.cfg = {
      model: cfg.model, inputName: cfg.inputName ?? "input_features", logitsName: cfg.logitsName ?? "logits",
      pooledName: cfg.pooledName ?? "pooled", probeMaxMs: cfg.probeMaxMs ?? PROBE_MAX_MS, device: cfg.device ?? "wasm1",
      now: cfg.now ?? (() => performance.now()),
    };
  }

  /** The one encoder of this tab. A second call returns the same instance (its config is ignored). */
  static shared(ort: OrtLike, cfg: EncoderConfig): Encoder {
    if (!shared) shared = new Encoder(ort, cfg);
    return shared;
  }
  /** Tests only. */
  static resetShared(): void { shared = null; }

  get available(): boolean { return !!this.session && !this.disabled; }
  get device(): "wasm1" | "wasm4" | "webgpu" { return this.cfg.device; }

  /** Open + probe once. Resolves false when the device is too slow or the model failed to load. */
  open(frames = 800): Promise<boolean> {
    if (this.opening) return this.opening;
    this.opening = (async () => {
      try {
        this.session = await this.ort.InferenceSession.create(this.cfg.model, { executionProviders: [this.cfg.device === "webgpu" ? "webgpu" : "wasm"], graphOptimizationLevel: "all" });
        encoderStats.sessionsCreated++;
        const t = this.cfg.now();
        await this.session.run({ [this.cfg.inputName]: new this.ort.Tensor("float32", new Float32Array(80 * frames).fill(-0.5), [1, 80, frames]) });
        if (this.cfg.now() - t > this.cfg.probeMaxMs) this.disabled = true;
      } catch {
        this.disabled = true;
      }
      return this.available;
    })();
    return this.opening;
  }

  /** One pass over a Whisper-normalised window [80 × frames]. Null when unavailable. */
  async pass(mel: Float32Array, frames: number): Promise<{ logits: Float32Array; pooled: Float32Array; computeMs: number } | null> {
    if (!this.available || !this.session) return null;
    const t = this.cfg.now();
    const out = await this.session.run({ [this.cfg.inputName]: new this.ort.Tensor("float32", mel, [1, 80, frames]) });
    encoderStats.passes++;
    const f32 = (x?: OrtTensorLike) => (x ? Float32Array.from(x.data as ArrayLike<number>) : new Float32Array(0));
    return { logits: f32(out[this.cfg.logitsName]), pooled: f32(out[this.cfg.pooledName]), computeMs: this.cfg.now() - t };
  }
}
