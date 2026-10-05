// Types for the synced judged runtime (rig.js). Only the surface src/face-puppet uses; the JS is not type-checked
// (it is the judged code, kept byte-identical by evals/face-puppet/sync-runtime.mjs).
export interface RigLoadOptions {
  ext?: string;
  dpr?: number;
  view?: [number, number, number];
  preserve?: boolean;
  clear?: [number, number, number];
  reducedMotion?: boolean;
  yawMax?: number;
}
export declare class Puppet2DRig {
  static load(canvas: HTMLCanvasElement, base: string, opts?: RigLoadOptions): Promise<Puppet2DRig>;
  /** Seconds; null = performance.now() / 1000. */
  clock: number | null;
  lastT: number;
  reduced: boolean;
  R: { gl: WebGL2RenderingContext; canvas: HTMLCanvasElement; dpr: number; draws: number; tris: number };
  mouth: { name: string; row: string };
  life: { reduced: boolean; still?: boolean };
  view: [number, number, number];
  frame(bs: Record<string, number>, head: number[], gaze: number[], lean: number, breath: number): void;
  apply(bs: Record<string, number>, head: number[], gaze: number[], lean: number, breath: number): void;
  render(): void;
  warm(n?: number): void;
  resetPhysics(): void;
  stats(): { triangles: number; meshes: number };
  dispose(): void;
}
