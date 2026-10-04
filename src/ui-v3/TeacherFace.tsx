// The teacher's face slot (owner §9 O-R1, 2026-10-04: the teacher is the IN-HOUSE character model, 2D puppet or 3D,
// style C, human-like. The DESIGN-V3 painted portraits are mockup stand-ins and NEVER ship; tests/ui-v3-lint.test.mjs
// fails on any portrait/raster reference in src/ui-v3).
//
// Contract (the seam RS-7 fills; it mirrors the HeadRig contract in src/avatar/three/head.ts one level up):
//   - v3 screens never draw a face themselves. They render <FaceSlot>, which calls the registered FaceRenderer with
//     { tutorId, band, status, size, still, reducedMotion, lang }.
//   - The default renderer is src/avatar's <TutorFace>, which owns tier choice (B / B-lite 3D head → D 2D plate of the
//     SAME look → E voice ring), lip-sync from her output meters, the listening/thinking states and every fallback.
//     A fallback never changes the face (TutorFace's rule), and never shows an error.
//   - `still` asks for the 2D plate (tier D): used where several faces share a screen (onboarding teacher cards), so the
//     page never holds more than ONE live WebGL context.
//   - Callers mount at most one live (non-still) face per screen: the lesson shell renders the tile OR the PiP, not both.
//   - RS-7 swaps the renderer (puppet ≥ 4.5/5) with setFaceRenderer() at boot; no v3 screen changes.
import type { ReactNode } from "react";
import { TutorFace } from "../avatar/TutorFace.tsx";
import type { FloorStatus } from "../avatar/behaviour.ts";
import type { TapSource } from "../avatar/tap.ts";

export type FaceSize = "tile" | "pip" | "card" | "chip";

export interface FaceSlotProps {
  tutorId: string;
  /** Learner band (b1-b4), for the default tutor rule only; the face reads nothing else about the child. */
  band: string;
  /** The floor status (null outside a live lesson = idle presence). */
  status: FloorStatus | null;
  size: FaceSize;
  /** Ask for the 2D plate (no WebGL). */
  still?: boolean;
  reducedMotion?: boolean;
  lang?: string;
  /** Her output meters (lip-sync). Empty outside a lesson. */
  teacher?: TapSource[];
  mic?: { readonly value: number };
}

export type FaceRenderer = (p: FaceSlotProps) => ReactNode;

const NO_METERS: TapSource[] = [];

/** The default renderer: the in-house <TutorFace> from src/avatar (RS-7 owns everything inside it). */
export const inHouseFace: FaceRenderer = (p) => (
  <TutorFace
    tutorId={p.tutorId}
    band={p.band}
    status={p.status}
    teacher={p.teacher ?? NO_METERS}
    mic={p.mic}
    reducedMotion={p.reducedMotion}
    framing={p.size === "tile" ? "medium" : "close"}
    tier={p.still ? "D" : undefined}
    noProbe={p.still}
    lang={p.lang}
    className="v3-face-host"
  />
);

let renderer: FaceRenderer = inHouseFace;

/** RS-7 hook: replace the face renderer (e.g. the style-C 2D puppet once it passes ≥ 4.5/5). */
export function setFaceRenderer(r: FaceRenderer | null): void {
  renderer = r ?? inHouseFace;
}

export function FaceSlot(p: FaceSlotProps & { className?: string }) {
  return (
    <div className={`v3-face v3-face--${p.size}${p.className ? ` ${p.className}` : ""}`} data-face-slot={p.size} data-tutor={p.tutorId}>
      {renderer(p)}
    </div>
  );
}
