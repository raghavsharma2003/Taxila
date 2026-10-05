// Studio artifact renderers (W2 seam commit). The StudioStage draws ONE artifact at a time into its fitted box, through
// the renderer registered here for the artifact's kind. Each owner adds exactly one line for its kind:
//   - whiteboard → W2-B (the drawing-script renderer: hand-drawn strokes, shapes, labels, arrows, number work, timed to
//     her speech; reduced motion shows each op complete at its startMs);
//   - frame, skeleton → W2-H (StudioFrame with the hash-CSP bundle and the partial channel; the code skeletons);
//   - image → W2-H / W3-G (≤ 120 KB WebP, lazy).
// A kind with no renderer shows the empty stage ground: never a spinner, a percentage, code or error text.
//
// The renderer contract: draw in the artifact's DESIGN units (`design`), sized to `px` (an SVG with viewBox = design and
// width/height = px does both); never read or change anything outside the box (the box clips, `contain: strict`); report
// through onEvent only (the host grades answers, never the renderer).
import type { ComponentType } from "react";
import type { StageSize, StudioArtifact, StudioArtifactKind } from "../../shared/studio.ts";
import { StudioWhiteboard } from "../modules/whiteboard/StudioWhiteboard.tsx";
import { StudioFrame } from "./StudioFrame.tsx";
import { SkeletonRenderer } from "./skeletons.tsx";
import { ImageRenderer } from "./ImageRenderer.tsx";

/** What a renderer may tell the stage. An answer is host-graded (LIVE-STUDIO §3.10); `correct` is never trusted. */
export type StudioStageEvent =
  | { type: "ready" }
  | { type: "done" }
  | { type: "interaction"; name: string; data?: Record<string, unknown> }
  | { type: "answer"; value: unknown }
  /** The HOST's verdict on an answer (emitted by the stage, never by a renderer): the lesson hears about it from this. */
  | { type: "graded"; correct: boolean; complete: boolean; alreadyClosed?: boolean; wrongTries?: number }
  /** Why a frame could not run (the stage reports it; only a broken build counts against it on the server). */
  | { type: "error"; message: string; reason?: "csp" | "runtime" | "navigated" | "not_ready" | "unavailable" | "bytes" };

export interface ArtifactRendererProps<K extends StudioArtifactKind = StudioArtifactKind> {
  artifact: Extract<StudioArtifact, { kind: K }>;
  /** The fitted box in CSS px, and the artifact's design size it maps. */
  px: { w: number; h: number };
  design: StageSize;
  reducedMotion: boolean;
  young: boolean;
  lang: string;
  onEvent: (e: StudioStageEvent) => void;
}

export type ArtifactRenderer<K extends StudioArtifactKind = StudioArtifactKind> = ComponentType<ArtifactRendererProps<K>>;

/** The registry. One line per kind, added by its owner (see the header). */
export const RENDERERS: { [K in StudioArtifactKind]?: ArtifactRenderer<K> } = {
  whiteboard: StudioWhiteboard, // W2-B: the drawing-script renderer (src/modules/whiteboard/**)
  frame: StudioFrame,           // W2-H: a gate-passed build (hash-CSP, opaque origin, host-graded)
  skeleton: SkeletonRenderer,   // W2-H: the code skeleton (the sketch while making; the activity when the build is not there)
  image: ImageRenderer,         // W2-H: art only (W3-G's image lane fills it)
};

export function rendererFor<K extends StudioArtifactKind>(kind: K): ArtifactRenderer<K> | null {
  return (RENDERERS[kind] as ArtifactRenderer<K> | undefined) ?? null;
}
