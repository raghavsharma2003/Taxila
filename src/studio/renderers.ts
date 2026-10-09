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
import { createElement, lazy, Suspense, type ComponentType } from "react";
import type { StageSize, StudioArtifact, StudioArtifactKind } from "../../shared/studio.ts";
import { StudioWhiteboard } from "../modules/whiteboard/StudioWhiteboard.tsx";
import { StudioFrame } from "./StudioFrame.tsx";
import { SkeletonRenderer } from "./skeletons.tsx";
import { ImageRenderer } from "./ImageRenderer.tsx";
import { StagecraftRenderer } from "../stagecraft/StagecraftRenderer.tsx";

/** What a renderer may tell the stage. An answer is host-graded (LIVE-STUDIO §3.10); `correct` is never trusted. */
export type StudioStageEvent =
  | { type: "ready" }
  | { type: "done" }
  | { type: "interaction"; name: string; data?: Record<string, unknown> }
  | { type: "answer"; value: unknown }
  /** The HOST's verdict on an answer (emitted by the stage, never by a renderer): the lesson hears about it from this. */
  | { type: "graded"; correct: boolean; complete: boolean; alreadyClosed?: boolean; wrongTries?: number }
  /** Why a frame could not run (the stage reports it; only a broken build counts against it on the server). */
  | { type: "error"; message: string; reason?: "csp" | "runtime" | "navigated" | "not_ready" | "unavailable" | "bytes" }
  /** round 3 forge: the slot ended with NOTHING to show (its board was refused or failed, or the server retired it): the
   *  stage says so once, so the Desk can give the tray back instead of holding an empty box (patch 07). */
  | { type: "empty"; slotId: string };

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
  stagecraft: StagecraftRenderer as unknown as ArtifactRenderer<"stagecraft">,   // STAGECRAFT P10: src/stagecraft (needs P9)
};

// round 3 forge: the play stream's pieces (PlayArtifact, kind "play"; docs/design/round3/play/GRAMMAR.md §7) render through
// src/play/PlayStudioRenderer.tsx when the play stream adds it (its default export takes ArtifactRendererProps). The glob is
// resolved at build time: no file, no entry, nothing else changes (docs/design/round3/forge/FOR-PLAY.md).
const playRenderer = import.meta.glob<{ default: ComponentType<ArtifactRendererProps> }>("../play/PlayStudioRenderer.tsx");
const playLoad = playRenderer["../play/PlayStudioRenderer.tsx"];
const PlayLazy = playLoad ? lazy(playLoad) : null;
const PlayRenderer: ComponentType<ArtifactRendererProps> | null = PlayLazy
  ? (props) => createElement(Suspense, { fallback: null }, createElement(PlayLazy, props))
  : null;

export function rendererFor<K extends StudioArtifactKind>(kind: K): ArtifactRenderer<K> | null {
  if ((kind as string) === "play") return (PlayRenderer as unknown as ArtifactRenderer<K> | null);
  return (RENDERERS[kind] as ArtifactRenderer<K> | undefined) ?? null;
}
