// Khand · the main thread's side of the mesher: one worker, latest-request-wins, with the same pure mesher on the main
// thread only when no worker can start (old WebViews, a CSP without worker-src, node). Every result reports where it was
// meshed and how long it took, for the certificate (C10 notes).
import { meshVolume, type MeshOut, type Volume } from "./mesher.ts";
import { tileOf } from "./tiles.ts";

export interface MeshResult { mesh: MeshOut; where: "worker" | "main"; roundTripMs: number }
type Pending = { resolve: (r: MeshResult) => void; t0: number };

export class MeshClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  readonly timings: { mesh: number[]; trip: number[]; where: string[] } = { mesh: [], trip: [], where: [] };
  constructor(useWorker = true) {
    if (!useWorker || typeof Worker === "undefined") return;
    try {
      this.worker = new Worker(new URL("./mesher.worker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (e: MessageEvent<{ id: number; mesh: MeshOut }>) => {
        const p = this.pending.get(e.data.id); if (!p) return;
        this.pending.delete(e.data.id);
        const trip = performance.now() - p.t0;
        this.note(e.data.mesh.ms, trip, "worker");
        p.resolve({ mesh: e.data.mesh, where: "worker", roundTripMs: trip });
      };
      this.worker.onerror = () => { this.worker?.terminate(); this.worker = null; for (const [id, p] of this.pending) { this.pending.delete(id); p.resolve(this.local(this.lastVol!, p.t0)); } };
    } catch { this.worker = null; }
  }
  private lastVol: Volume | null = null;
  private note(ms: number, trip: number, where: string) {
    this.timings.mesh.push(ms); this.timings.trip.push(trip); this.timings.where.push(where);
    if (this.timings.mesh.length > 500) { this.timings.mesh.shift(); this.timings.trip.shift(); this.timings.where.shift(); }
  }
  private local(vol: Volume, t0: number): MeshResult {
    const mesh = meshVolume(vol, tileOf), trip = performance.now() - t0;
    this.note(mesh.ms, trip, "main");
    return { mesh, where: "main", roundTripMs: trip };
  }
  get usingWorker(): boolean { return !!this.worker; }
  /** Mesh a volume. A newer request supersedes older ones still in flight (their promises resolve to null). */
  mesh(vol: Volume): Promise<MeshResult | null> {
    const id = ++this.seq, t0 = performance.now();
    this.lastVol = vol;
    for (const [k, p] of this.pending) { this.pending.delete(k); (p.resolve as (r: MeshResult | null) => void)(null); }
    if (!this.worker) return Promise.resolve(this.local(vol, t0));
    return new Promise((resolve) => {
      this.pending.set(id, { resolve: resolve as (r: MeshResult) => void, t0 });
      // the volume's buffer is copied (structured clone), never transferred: the main thread keeps its copy
      this.worker!.postMessage({ id, vol });
    });
  }
  dispose(): void { this.worker?.terminate(); this.worker = null; this.pending.clear(); }
}
