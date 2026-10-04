// The device head (SPEC §3.3, §3.4): at a committed child turn, reduce the shared front-end's frames to KnowledgeVoice
// (numbers only) for TurnRequest.voiceFeatures.kv. Stages:
//   0  measurements only (TurnAcoustics + q): the default, shadow-safe.
//   +  the filled-pause detector (models/voicesig/filler-gru, trained on CC BY 4.0 AMI; a TINY second ORT session, never
//      the encoder's) when loaded: fillerLeadMs / fillerRuns / contentOnsetMs.
//   2  aLogit from a trained knowledge head: NOT shipped. No public corpus carries O1-O4 outcomes; the head is trained
//      only on consented pilot/flywheel rows (scripts/voicesig/k1-train.py). Until then `stage` never reports 2.
// Latency rule: the turn request is never delayed. commit() has a hard budget; a late detector is dropped for that turn.
import { GRU_DIM, GruInput } from "./frontend/gruInput.ts";
import { audioQuality, turnAcoustics } from "./turn.ts";
import type { OrtLike, OrtSessionLike } from "./frontend/encoder.ts";
import type { AudioFrame, KnowledgeVoice, MicClass, VsLangMode } from "./types.ts";
import type { FrontEndCore } from "./frontend/bus.ts";

export const HEAD_VER = "vs-head/0.1";
/** Head budget per turn (SPEC §3.4: ≤ 20 ms p95). Past it the detector output is omitted for the turn. */
export const HEAD_BUDGET_MS = 20;
/** Longest turn span the detector reads (frames at 20 ms). */
export const MAX_DETECTOR_FRAMES = 1500;

export interface FillerModel {
  session: OrtSessionLike;
  ort: OrtLike;
  thr: number;
  ver: string;
}

/** Load the detector (tiny graph, < 100 KB). Null on any failure: the head then runs at stage 0 with the flat-run proxy. */
export async function loadFillerModel(ort: OrtLike, model: string | Uint8Array, thr: number, ver: string): Promise<FillerModel | null> {
  try {
    const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    return { session, ort, thr, ver };
  } catch {
    return null;
  }
}

/** Run the detector over GRU inputs [T × GRU_DIM] → per-frame probability. */
export async function detect(m: FillerModel, x: Float32Array, T: number): Promise<Float32Array> {
  const out = await m.session.run({ x: new m.ort.Tensor("float32", x, [1, T, GRU_DIM]) });
  const p = out.p ?? Object.values(out)[0];
  return Float32Array.from(p.data as ArrayLike<number>);
}

export interface CommitInput {
  fromT: number;
  toT: number;
  teacherEndAt: number | null;
  words?: number;
  langMode?: VsLangMode;
  micClass?: MicClass;
}

export class VoicesigHead {
  private readonly fe: FrontEndCore;
  private readonly gi = new GruInput();
  private readonly xs: Array<{ t: number; x: Float32Array }> = [];
  private readonly off: () => void;
  private filler: FillerModel | null;
  private readonly now: () => number;

  constructor(fe: FrontEndCore, o: { filler?: FillerModel | null; now?: () => number } = {}) {
    this.fe = fe;
    this.filler = o.filler ?? null;
    this.now = o.now ?? (() => performance.now());
    // GRU inputs are built continuously (cheap: ~22 adds per hop), so commit() only runs the graph.
    this.off = fe.onFrame((f) => this.onFrame(f));
  }

  setFiller(m: FillerModel | null): void { this.filler = m; }
  dispose(): void { this.off(); }

  private onFrame(f: AudioFrame): void {
    this.xs.push({ t: f.t, x: this.gi.next(f, this.fe.melNear(f.t)) });
    if (this.xs.length > 4500) this.xs.splice(0, this.xs.length - 4500);
  }

  /** Build kv for one committed turn. Never throws; never waits past HEAD_BUDGET_MS for the detector. */
  async commit(c: CommitInput): Promise<KnowledgeVoice | null> {
    const t0 = this.now();
    const frames = this.fe.frames(c.fromT, c.toT);
    if (!frames.length) return null;
    let filler: { p: Float32Array; thr: number } | undefined;
    let det: 0 | 1 = 0;
    if (this.filler) {
      const rows = this.xs.filter((r) => r.t >= c.fromT && r.t <= c.toT).slice(-MAX_DETECTOR_FRAMES);
      if (rows.length === frames.length || rows.length === Math.min(frames.length, MAX_DETECTOR_FRAMES)) {
        const x = new Float32Array(rows.length * GRU_DIM);
        rows.forEach((r, i) => x.set(r.x, i * GRU_DIM));
        try {
          const p = await Promise.race([
            detect(this.filler, x, rows.length),
            new Promise<null>((res) => setTimeout(() => res(null), HEAD_BUDGET_MS)),
          ]);
          if (p && p.length === rows.length) {
            const full = new Float32Array(frames.length);
            full.set(p, frames.length - p.length);
            filler = { p: full, thr: this.filler.thr };
            det = 1;
          }
        } catch {
          // detector failure: stage-0 measurements still go out
        }
      }
    }
    const f = turnAcoustics({ frames, teacherEndAt: c.teacherEndAt, words: c.words, filler });
    if (!f) return null;
    const caps = this.fe.caps();
    return {
      v: 1,
      modelVer: det ? `${HEAD_VER}+${this.filler?.ver}` : HEAD_VER,
      stage: 0,
      f,
      q: {
        audio: audioQuality(frames, f, this.fe.frameCore.floorDb),
        raw: frames.some((x) => x.rawDb != null) ? 1 : 0,
        enc: caps.encoder ? 1 : 0,
        det,
        micClass: c.micClass ?? caps.micClass,
        langMode: c.langMode ?? "unk",
      },
      computeMs: Math.round((this.now() - t0) * 10) / 10,
    };
  }
}
