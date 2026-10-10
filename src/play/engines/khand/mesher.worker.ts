// Khand · the mesher worker: volumes in, greedy meshes out (buffers transferred, never copied). The main thread never
// meshes while a worker is available (the prototype's main-thread re-mesh was 8.2 ms p50 / 19.1 ms p95 at 4x throttle).
import { meshVolume, type Volume } from "./mesher.ts";
import { tileOf } from "./tiles.ts";

interface Req { id: number; vol: Volume }
const scope = self as unknown as { onmessage: ((e: MessageEvent<Req>) => void) | null; postMessage(m: unknown, t: Transferable[]): void };
scope.onmessage = (e) => {
  const { id, vol } = e.data;
  const m = meshVolume(vol, tileOf);
  scope.postMessage({ id, mesh: m }, [m.positions.buffer, m.normals.buffer, m.uvb.buffer, m.tile.buffer, m.shade.buffer, m.index.buffer]);
};
