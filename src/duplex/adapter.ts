/**
 * The engine adapter (ARCHITECTURE.md v2 §5.1-§5.2): one factory the host calls, so the runtime runs stage A TODAY and a
 * trained stage B engine LATER without a code change — dropping a model file (models/duplex/*.onnx, <= 20 MB, or an
 * Azure Storage URL) and turning on `flags.trained` is the whole switch.
 *
 *   createEngine({ flags, model })  → stage A (RulesEngine) unless flags.trained AND a model is loaded;
 *                                     then TrainedEngine, which falls back to stage A on every tick its model is stale.
 *   TrainedEngine                   → infer() packs the tick (features.ts, spec "cce-features/1"; plus raw audio when the
 *                                     model wants it) and runs the model off the hot path; tick() uses the newest result
 *                                     no older than FALLBACK.staleMs as pComplete / pHoldWanted / pBackchannel and the
 *                                     overlap head, and decides with stage A's POLICY (one policy, two estimators). It also
 *                                     exposes the model's read as an AcousticEstimate, so G5 can let it vouch for the
 *                                     unseen tail.
 *   loadOnnxFloorModel(url, ort)    → wraps an onnxruntime-web InferenceSession (the runtime is INJECTED: no dependency is
 *                                     added until DX-9 picks it). Inputs "features" [1, F] (+ "audio" [1, N] at 16 kHz);
 *                                     outputs "p_complete", "p_hold", optional "p_backchannel", "overlap" [1, 6].
 * Both engines sit behind the same governor; the governor never trusts either. Erasable TypeScript.
 */
import type {
  AcousticEstimate, DuplexEngine, EngineContractVersion, EngineDecision, EngineFlags, EngineId, EngineSession, EngineTick,
  OverlapClass, ReasonCode,
} from "./engine.ts";
import { RulesEngine, estimate, type Estimate } from "./engineRules.ts";
import { FEATURE_SPEC, packFeatures } from "./features.ts";
import { FALLBACK } from "./config.ts";

export interface FloorModelOutput {
  pComplete: number;
  pHoldWanted: number;
  pBackchannel?: number;
  overlap?: Partial<Record<OverlapClass, number>>;
}

/** A trained floor model, however it runs (ONNX on the device, ACA CPU in India, a test double). */
export interface FloorModel {
  readonly id: string;
  readonly version: string;
  readonly featureSpec: string;
  /** Milliseconds of 16 kHz mic audio the model reads (0 = features only). */
  readonly audioMs: number;
  run(features: Float32Array, audio: Float32Array | null): Promise<FloorModelOutput>;
}

/** An engine that can vouch for the unseen tail (the host copies this into tick.estimates.acoustic). */
export interface AcousticSource {
  latestAcoustic(): AcousticEstimate | null;
}

export const OVERLAP_CLASSES: OverlapClass[] = ["continuer", "barge_in", "side_talk", "background_speech", "noise", "echo"];

export class TrainedEngine implements DuplexEngine, AcousticSource {
  readonly id: EngineId;
  readonly contract: EngineContractVersion = "cce/2026-10-04";
  private readonly model: FloorModel;
  private readonly rules: RulesEngine;
  private busy = false;
  private latest: { atMs: number; out: FloorModelOutput; computeMs: number } | null = null;
  private readonly clock: () => number;
  stats = { inferences: 0, failures: 0, staleTicks: 0, freshTicks: 0 };

  constructor(model: FloorModel, opts: { supportsProbe?: boolean; clock?: () => number } = {}) {
    if (model.featureSpec !== FEATURE_SPEC) throw new Error(`floor model feature spec ${model.featureSpec} != ${FEATURE_SPEC}`);
    this.model = model;
    this.id = { id: model.id, stage: "B", version: model.version };
    this.rules = new RulesEngine({ supportsProbe: opts.supportsProbe, id: this.id });
    this.clock = opts.clock ?? (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  }

  reset(session: EngineSession): void {
    this.rules.reset(session);
    this.latest = null;
  }

  async infer(input: EngineTick): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    const t0 = this.clock();
    try {
      const audio = this.model.audioMs > 0 && input.audio ? input.audio.read(this.model.audioMs) : null;
      const out = await this.model.run(packFeatures(input), audio);
      this.latest = { atMs: input.t, out, computeMs: this.clock() - t0 };
      this.stats.inferences++;
    } catch {
      this.stats.failures++;
    } finally {
      this.busy = false;
    }
  }

  latestAcoustic(): AcousticEstimate | null {
    if (!this.latest) return null;
    const o = this.latest.out;
    return { atMs: this.latest.atMs, pComplete: o.pComplete, pHoldWanted: o.pHoldWanted, pBackchannel: o.pBackchannel, overlap: o.overlap, model: this.id.id, computeMs: this.latest.computeMs };
  }

  tick(input: EngineTick): EngineDecision {
    const rules = estimate(input);
    const fresh = this.latest !== null && input.t - this.latest.atMs <= FALLBACK.staleMs;
    if (!fresh) {
      this.stats.staleTicks++;
      const d = this.rules.decideWith(input, rules);
      const reasons: ReasonCode[] = ["fallback_rules", "veto_engine_stale", ...d.reasons];
      return { ...d, reasons: reasons.slice(0, 12) };
    }
    this.stats.freshTicks++;
    const o = (this.latest as { out: FloorModelOutput }).out;
    const reasons: ReasonCode[] = [o.pComplete >= 0.5 ? "acoustic_complete" : "acoustic_incomplete", ...rules.reasons];
    const est: Estimate = { ...rules, pComplete: o.pComplete, pHoldWanted: o.pHoldWanted, pProjected: Math.max(o.pComplete, rules.pProjected),
      pBackchannel: o.pBackchannel ?? rules.pBackchannel, horizonBlocked: rules.horizonBlocked && o.pComplete < 0.8, acousticVouches: o.pComplete >= 0.8, reasons };
    const d = this.rules.decideWith(input, est);
    return { ...d, overlapP: o.overlap ?? d.overlapP, computeMs: (this.latest as { computeMs: number }).computeMs };
  }
}

/** Stage A now; the trained engine when the flag is on and a model is loaded. */
export function createEngine(o: { flags: Pick<EngineFlags, "trained">; model?: FloorModel | null; supportsProbe?: boolean }): DuplexEngine {
  if (o.flags.trained && o.model) return new TrainedEngine(o.model, { supportsProbe: o.supportsProbe });
  return new RulesEngine({ supportsProbe: o.supportsProbe });
}

/** The slice of onnxruntime-web this adapter uses (injected; not a dependency of this repo yet). */
export interface OrtLike {
  InferenceSession: { create(source: string | ArrayBuffer | Uint8Array, opts?: Record<string, unknown>): Promise<OrtSession> };
  Tensor: new (type: "float32", data: Float32Array, dims: number[]) => unknown;
}
export interface OrtSession {
  run(feeds: Record<string, unknown>): Promise<Record<string, { data: ArrayLike<number> }>>;
  readonly inputNames?: readonly string[];
}

/**
 * Load a floor model exported by scripts/duplex/** (ONNX, int8, <= 20 MB). The manifest travels with it so a model on
 * another feature spec can never be run against these features.
 */
export async function loadOnnxFloorModel(source: string | ArrayBuffer | Uint8Array, ort: OrtLike, manifest: { id: string; version: string; featureSpec: string; audioMs: number }, sessionOpts: Record<string, unknown> = { executionProviders: ["wasm"] }): Promise<FloorModel> {
  if (manifest.featureSpec !== FEATURE_SPEC) throw new Error(`model ${manifest.id}: feature spec ${manifest.featureSpec} != ${FEATURE_SPEC}`);
  const session = await ort.InferenceSession.create(source, sessionOpts);
  return {
    id: manifest.id,
    version: manifest.version,
    featureSpec: manifest.featureSpec,
    audioMs: manifest.audioMs,
    async run(features: Float32Array, audio: Float32Array | null): Promise<FloorModelOutput> {
      const feeds: Record<string, unknown> = { features: new ort.Tensor("float32", features, [1, features.length]) };
      if (manifest.audioMs > 0 && audio) feeds.audio = new ort.Tensor("float32", audio, [1, audio.length]);
      const r = await session.run(feeds);
      const ov = r.overlap?.data;
      return {
        pComplete: Number(r.p_complete.data[0]),
        pHoldWanted: Number(r.p_hold.data[0]),
        pBackchannel: r.p_backchannel ? Number(r.p_backchannel.data[0]) : undefined,
        overlap: ov ? Object.fromEntries(OVERLAP_CLASSES.map((k, i) => [k, Number(ov[i])])) : undefined,
      };
    },
  };
}
