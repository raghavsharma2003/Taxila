// TaxilaFDB arms (ARCHITECTURE.md v2 §6.3). Every arm runs through the SAME EngineHost and the SAME governor; baselines run
// it in "baseline" mode (G1/G2 safety, G4 phase legality, G11 her-floor yields only), so they are measured as they are,
// safety floor included, and the engine is measured with every veto it ships with.
//
//   B0 cascade-900   today: an STT final after 900 ms of server VAD is a turn (FinalLandsEngine)
//   B1 silence-640   tuned silence (Voice-Light / Study B-C bar): SPEAK at 640 ms of device silence once words exist
//   B1/sweep         silence-N for N in the sweep: the silence frontier the engine must dominate
//   B2 smart-turn    Smart Turn v3.2 off the shelf, Pipecat's pattern: run at 200 ms of silence; complete (p >= thr) →
//                    SPEAK; incomplete → wait for more speech or the 3 s stop timeout
//   E-A rules        stage A (engineRules.ts) behind the full governor; E-A+sem with the fast Azure LLM estimate replayed
//                    from a recorded cache at its measured latency
//   E-B trained      stage B (adapter.ts TrainedEngine) with the trained fusion head (stageb.mjs)
import fs from "node:fs";
import path from "node:path";
import { WT1_DEFAULT } from "../../../src/duplex/config.ts";
import { FEAT } from "./world.mjs";

const HOLD = (reason = "uncertain") => ({ action: "HOLD", detail: { action: "HOLD", reason } });
const CHILD_FLOOR = new Set(["child_turn", "idle", "handover"]);

class Baseline {
  constructor(id) { this.id = { id, stage: "A", version: "baseline-2026-10-04" }; this.contract = "cce/2026-10-04"; }
  reset() {}
  base() { return { confidence: 0.5, pComplete: 0.5, pHoldWanted: 0.5, reasons: ["x_baseline"], engine: this.id }; }
  herFloor(tick) {
    if (tick.phase === "her_turn" || tick.phase === "overlap") return { ...this.base(), action: "KEEP_TALKING", detail: { action: "KEEP_TALKING", reason: "too_short", unduck: false } };
    if (tick.phase === "committed") return { ...this.base(), ...HOLD() };
    return null;
  }
  wt1(tick) {
    if (tick.phase === "handover" && tick.child.firstOnsetAt === null && tick.t - (tick.her.handedOverAt ?? tick.phaseSince) >= (tick.context.wt1?.voiceMs ?? WT1_DEFAULT.voiceMs)) {
      return { ...this.base(), action: "SPEAK", detail: { action: "SPEAK", reason: "wt1_nudge", firstSound: "prompt", verdictNotBefore: null } };
    }
    return null;
  }
  speak(tick, p = 0.5) {
    const reason = tick.safety.distress ? "safeguard" : "turn_end";
    return { ...this.base(), pComplete: p, action: "SPEAK", detail: { action: "SPEAK", reason, firstSound: reason === "safeguard" ? "safeguard" : "body", verdictNotBefore: null } };
  }
}

/** B0: today's cascade — the STT final (server VAD 900 ms) is the turn. */
export class FinalLandsEngine extends Baseline {
  tick(tick) {
    const h = this.herFloor(tick); if (h) return h;
    if (!CHILD_FLOOR.has(tick.phase)) return { ...this.base(), ...HOLD() };
    const tr = tick.transcript;
    if (!tick.child.voicing && tr.isFinal && tr.text && tick.child.firstOnsetAt !== null) return this.speak(tick);
    return this.wt1(tick) ?? { ...this.base(), ...HOLD() };
  }
}

/** B1: device silence >= ms after the child spoke (words must exist: the reply needs them). */
export class SilenceEngine extends Baseline {
  constructor(ms) { super(`silence-${ms}`); this.ms = ms; }
  tick(tick) {
    const h = this.herFloor(tick); if (h) return h;
    if (!CHILD_FLOOR.has(tick.phase)) return { ...this.base(), ...HOLD() };
    const c = tick.child;
    if (!c.voicing && c.firstOnsetAt !== null && (c.silenceRunMs ?? 0) >= this.ms && tick.transcript.text) return this.speak(tick);
    return this.wt1(tick) ?? { ...this.base(), ...HOLD() };
  }
}

/** Smart Turn probabilities replayed from scripts/duplex/st_features.py (the newest grid tick <= t). */
export class FeatStore {
  constructor(dir = FEAT) { this.dir = dir; this.cache = new Map(); }
  load(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    const f = path.join(this.dir, `${id}.f32`);
    let rows = null;
    if (fs.existsSync(f)) {
      const b = fs.readFileSync(f);
      const a = new Float32Array(b.buffer, b.byteOffset, b.length / 4);
      const W = 450, n = a.length / W;
      rows = { n, W, a, t: Float32Array.from({ length: n }, (_, i) => a[i * W]) };
    }
    if (this.cache.size > 64) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(id, rows);
    return rows;
  }
  /** Index of the newest row with t_row <= t (and t - t_row <= maxAge), else -1. */
  at(id, t, maxAge = 400) {
    const r = this.load(id);
    if (!r || !r.n) return -1;
    let lo = 0, hi = r.n - 1, k = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (r.t[m] <= t) { k = m; lo = m + 1; } else hi = m - 1; }
    if (k < 0 || t - r.t[k] > maxAge) return -1;
    return k;
  }
  p(id, t) { const k = this.at(id, t); if (k < 0) return null; const r = this.load(id); return r.a[k * r.W + 1]; }
  emb(id, t) { const k = this.at(id, t); if (k < 0) return null; const r = this.load(id); return { atMs: r.t[k], v: r.a.subarray(k * r.W + 2, k * r.W + 386), p: r.a[k * r.W + 1] }; }
}

/** B2: Smart Turn v3.2 off the shelf (Pipecat LocalSmartTurnAnalyzerV3 pattern). */
export class SmartTurnEngine extends Baseline {
  constructor(store, streamId, thr = 0.5, { vadStopMs = 200, timeoutMs = 3000 } = {}) {
    super(`smart-turn-${thr}`);
    this.store = store; this.sid = streamId; this.thr = thr; this.vadStopMs = vadStopMs; this.timeoutMs = timeoutMs;
    this.judged = new Map(); // silence run (lastOffsetAt) -> p
    this.missing = 0;
  }
  tick(tick) {
    const h = this.herFloor(tick); if (h) return h;
    if (!CHILD_FLOOR.has(tick.phase)) return { ...this.base(), ...HOLD() };
    const c = tick.child, sil = c.silenceRunMs ?? 0;
    if (!c.voicing && c.firstOnsetAt !== null && tick.transcript.text && sil >= this.vadStopMs) {
      const key = c.lastOffsetAt;
      if (!this.judged.has(key)) {
        const p = this.store.p(this.sid, tick.t);
        if (p === null) this.missing++;
        this.judged.set(key, p ?? 0);
      }
      const p = this.judged.get(key);
      if (p >= this.thr || sil >= this.timeoutMs) return this.speak(tick, p);
    }
    return this.wt1(tick) ?? { ...this.base(), ...HOLD() };
  }
}

export const SWEEP = [300, 400, 500, 640, 800, 900, 1100, 1300, 1600, 2000, 2500];

/** Arm specs (lane is set by the runner). */
export function armSpec(name, opts = {}) {
  const store = opts.store;
  if (name === "cascade-900") return { name, baseline: true, vad: 900, engine: () => new FinalLandsEngine("cascade-900") };
  const m = name.match(/^silence-(\d+)$/);
  if (m) return { name, baseline: true, vad: 1500, engine: () => new SilenceEngine(Number(m[1])) };
  const st = name.match(/^smart-turn-([\d.]+)$/);
  if (st) return { name, baseline: true, vad: 1500, engine: ({ d }) => new SmartTurnEngine(store, d.id, Number(st[1])) };
  if (name === "stage-a") return { name, vad: 1500 };
  if (name === "stage-a-sem") return { name, vad: 1500, semantic: opts.semantic };
  if (name === "stage-b") return { name, vad: 1500, model: opts.model };
  if (name === "stage-b-sem") return { name, vad: 1500, model: opts.model, semantic: opts.semantic };
  throw new Error(`unknown arm ${name}`);
}
