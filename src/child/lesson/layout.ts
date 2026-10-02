// LayoutStage solver (PRODUCT-DESIGN §3.3-3.4). Pure: container size + band family + geometry → region sizes
// in dp (CSS px). Budgets are solved at the 584 dp floor and the 744 dp comfortable case; between them every
// region interpolates linearly (rounded to 4 dp) and the remainder goes to the canvas, so every column sums
// to the container height exactly. Never viewport media queries: the solver reads the lesson CONTAINER
// (a ResizeObserver feeds it), because a viewport query cannot see a narrow container (gurukul rejection).
import type { Family } from "../band.ts";

export type Geometry = "L1" | "L2" | "L3" | "L4" | "L5";
export type LayoutFamily = "stacked" | "tablet" | "split" | "compact" | "micro" | "tiny";

interface Row {
  top: number;
  stage: [number, number];
  ledge: [number, number];
  caption: number;
  control: [number, number];
}

const FLOOR = 584;
const COMFY = 744;

// [584, 744] per region; canvas is the remainder. Young L3/L4 ledge at 584 is the 56 dp overlay (row 0).
const YOUNG: Record<Geometry, Row> = {
  L1: { top: 56, stage: [248, 392], ledge: [0, 0], caption: 48, control: [104, 120] },
  L2: { top: 56, stage: [168, 248], ledge: [56, 72], caption: 48, control: [104, 120] },
  L3: { top: 56, stage: [192, 168], ledge: [56, 72], caption: 48, control: [104, 120] },
  L4: { top: 56, stage: [192, 168], ledge: [56, 72], caption: 48, control: [104, 120] },
  L5: { top: 56, stage: [192, 280], ledge: [0, 0], caption: 48, control: [104, 120] },
};
const OLDER: Record<Geometry, Row> = {
  L1: { top: 48, stage: [240, 400], ledge: [0, 0], caption: 40, control: [112, 112] },
  L2: { top: 48, stage: [136, 216], ledge: [48, 56], caption: 40, control: [112, 112] },
  L3: { top: 48, stage: [0, 0], ledge: [48, 56], caption: 40, control: [112, 112] },
  L4: { top: 48, stage: [144, 200], ledge: [48, 56], caption: 40, control: [112, 112] },
  L5: { top: 48, stage: [200, 300], ledge: [0, 0], caption: 40, control: [112, 112] },
};

/** Landscape split: teacher column share by geometry (§3.4) and its minimum width. */
const SPLIT_SHARE: Record<Family, Record<Geometry, number>> = {
  young: { L1: 0.6, L2: 0.4, L3: 0.3, L4: 0.3, L5: 0.45 },
  older: { L1: 0.55, L2: 0.34, L3: 0.24, L4: 0.26, L5: 0.4 },
};
const SPLIT_MIN = { young: 320, older: 280 };

export interface LayoutInput {
  width: number;
  height: number;
  family: Family;
  geometry: Geometry;
  captionsOn: boolean;
  /** Older presentation mode: "small" puts her in a PiP in every geometry; "voice" hides the face. */
  faceMode?: "face" | "small" | "voice";
  /** A text field has focus on a portrait phone (Older typed answer). */
  keyboard?: boolean;
}

export interface Layout {
  family: LayoutFamily;
  top: number;
  stage: number;
  ledge: number;
  /** The ledge overlays the bottom of the stage (Young L3/L4 below 680 dp) instead of taking a row. */
  ledgeOverlay: boolean;
  /** The ledge becomes a vertical chip rail on the canvas's left edge (micro, compact). */
  ledgeRail: boolean;
  caption: number;
  /** The caption is a pill over the canvas bottom (micro, compact). */
  captionPill: boolean;
  canvas: number;
  control: number;
  /** The teacher as a picture-in-picture close-up inside the canvas corner. */
  pip: { w: number; h: number } | null;
  /** Split families: the teacher column width; 0 for stacked. */
  teacherCol: number;
  /** Keyboard open: the stage is a 40 dp face chip in the top bar. */
  faceChip: boolean;
}

const r4 = (n: number) => Math.round(n / 4) * 4;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function solveLayout(i: LayoutInput): Layout {
  const { width: w, height: h, family } = i;
  const young = family === "young";
  const pipSize = young ? { w: 120, h: 144 } : { w: 96, h: 120 };
  const base: Omit<Layout, "family"> = {
    top: 0, stage: 0, ledge: 0, ledgeOverlay: false, ledgeRail: false, caption: 0, captionPill: false,
    canvas: 0, control: 0, pip: null, teacherCol: 0, faceChip: false,
  };

  if (h < 480 && w < h * 1.0) return { ...base, family: "tiny" };

  // Landscape: split, or compact split when short.
  if (w >= h) {
    if (h < 480) {
      const top = 40;
      return {
        ...base, family: "compact", top, teacherCol: Math.max(Math.round(w * 0.28), 180), stage: Math.max(144, h - top - (young ? 104 : 72)),
        ledgeRail: true, captionPill: true, canvas: h - top, control: young ? 104 : 72,
      };
    }
    const top = young ? 56 : 48;
    const share = SPLIT_SHARE[family][i.geometry];
    const teacherCol = Math.min(w - 320, Math.max(SPLIT_MIN[family], Math.round(w * share)));
    const caption = i.captionsOn ? (young ? 48 : 40) * 2 : 0; // up to 2 lines in landscape
    const control = young ? 120 : 112;
    const stage = Math.max(0, h - top - caption - control);
    const ledge = i.geometry === "L1" || i.geometry === "L5" ? 0 : young ? 72 : 56;
    return { ...base, family: "split", top, teacherCol, stage, caption, control, ledge, canvas: h - top - ledge };
  }

  // Micro: 480-583 dp tall portrait (320 × 568, split-screen).
  if (h < FLOOR) {
    const top = 48;
    const control = 104;
    return {
      ...base, family: "micro", top, control, canvas: h - top - control, pip: pipSize, ledgeRail: true, captionPill: i.captionsOn,
    };
  }

  const row = (young ? YOUNG : OLDER)[i.geometry];
  const t = Math.min(1, Math.max(0, (h - FLOOR) / (COMFY - FLOOR)));
  const top = row.top;
  let stage = r4(lerp(row.stage[0], row.stage[1], t));
  // Above 744: the stage gains up to +64 dp, then the canvas takes the rest.
  if (h > COMFY && row.stage[1] > 0) stage += Math.min(64, r4(h - COMFY));
  const caption = i.captionsOn ? row.caption : 0;
  const control = r4(lerp(row.control[0], row.control[1], t));
  let ledge = r4(lerp(row.ledge[0], row.ledge[1], t));
  let ledgeOverlay = false;
  if (young && (i.geometry === "L3" || i.geometry === "L4") && h < 680) {
    ledgeOverlay = true; // a board in front of her; her face zone is the stage's top 136 dp
    ledge = 56;
  }

  let pip: Layout["pip"] = null;
  if (!young && i.geometry === "L3") pip = pipSize; // Older L3: stage 0, PiP 96 × 120 in the canvas
  if (!young && i.faceMode === "small" && stage > 0) {
    pip = pipSize;
    stage = 0;
  }
  if (!young && i.faceMode === "voice") {
    pip = null;
    stage = 0;
  }

  // Keyboard open (Older typed answer): 40 dp face chip in the top bar; ledge and caption merge into one 48 dp row.
  if (i.keyboard && !young) {
    return {
      ...base, family: w >= 600 ? "tablet" : "stacked", top, stage: 0, faceChip: true, ledge: 48, caption: 0, control: 56,
      canvas: Math.max(144, h - top - 48 - 56),
    };
  }

  const fixed = top + stage + (ledgeOverlay ? 0 : ledge) + caption + control;
  const canvas = Math.max(0, h - fixed);
  return {
    ...base, family: w >= 600 ? "tablet" : "stacked", top, stage, ledge, ledgeOverlay, caption, control, canvas, pip,
  };
}
