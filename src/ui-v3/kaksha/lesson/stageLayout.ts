// The stage-first lesson layout (r7 app-lesson-stage-first; D7 supersedes PRODUCT-DESIGN-V2 §6.3.4 "the face is never a
// PiP over content"). Pure: the lesson CONTAINER (never a viewport query) → rects in CSS px. The stage is the largest
// zone on every geometry; the remainder of the column goes to it (the one elastic zone), so the column sums to the
// container height exactly unless `overflow`.
//
//   phone   top · stage (artifact slot + the HUD rail with the question; her face a PiP in the slot's top-right) ·
//           answer surface (tiles / pad, only when up) · steer chips · dock
//   wide    top · stage column (stage, then the answer surface) │ side column: her tile, the caption, chips, dock
//   short landscape (a phone turned): the wide grid without her tile; her face is the PiP again
//
// With nothing on the stage, the stage holds HER (a large comms window) and the caption, so it is never empty; the PiP
// shows only while an artifact holds the slot. The box contract (server/forge3/certs/box-contract.json, Studio) is
// derived from `slot`: grow a box, never shrink one. The geometry spec with the numbers at 360x800, 412x915 and
// 1280x800 is docs/design/round7/app/STAGE-GEOMETRY.md (generated from this file by stage-geometry.mjs).
export type Family = "young" | "older";

export interface StageInput {
  width: number;
  height: number;
  family: Family;
  fontScale?: number;
  /** The answer surface's measured need (tiles / NumberPad at full target size), 0 when none is up. */
  answerNeed?: number;
  /** A text field has focus on a phone: the keyboard layout (chips hidden, the stage yields first). */
  keyboard?: boolean;
  /** A trouble strip's height (taken directly above the dock). */
  strip?: number;
  /** The HUD rail's measured content (the question, its chip, a hint line): the rail grows to fit, never clips. */
  railNeed?: number;
  /** Steer chips are offered (Older, live, not a safeguard turn). */
  chips?: boolean;
  /** An artifact holds the slot (board, studio piece, game, module): the PiP shows. */
  artifact?: boolean;
  /** Play mode (a real-game piece is up): the game's goal rail is the HUD rail and the steer chips fold away (the child
   *  steers by voice), so the game gets the most room. */
  play?: boolean;
}

export interface Rect { x: number; y: number; w: number; h: number }

export interface StageLayout {
  kind: "phone" | "wide" | "landscape";
  top: Rect;
  /** The whole stage frame (slot + rail). */
  stage: Rect;
  /** The artifact's box: the letterboxed slot the piece fits into (xMidYMid meet). */
  slot: Rect;
  /** The HUD rail under the slot (the question as a strip; a game's goal rail in play mode). */
  rail: Rect;
  /** Her face over the slot (phones, short landscape) while an artifact is up; null on wide (she is a tile) or when the
   *  stage holds her. Relative to the page, like every rect. */
  pip: Rect | null;
  /** Wide: her tile in the side column. */
  tile: Rect | null;
  /** Wide: the caption under her tile (phones: the caption is inside the stage when she holds it, else the rail). */
  caption: Rect | null;
  answer: Rect | null;
  strip: Rect | null;
  chips: Rect | null;
  dock: Rect;
  overflow: boolean;
  /** The stage's share of the container's area, 0..1 (the "largest zone" check). */
  stageShare: number;
}

export const STAGE = {
  top: 48, topWide: 56, gap: 8, pad: 8, gutterPhone: 8, gutterWide: 24,
  rail: 64, chips: 48,
  dock: { older: 112, young: 128 }, dockWide: 128, dockKeyboard: 92,
  stageMin: 240, slotMin: 160,
  pipShare: 0.26, pipMin: 84, pipMax: 128, pipInset: 8,
  sideMin: 320, sideMax: 400, sideShare: 0.28,
  wideMinWidth: 900, landscapeMaxHeight: 520,
} as const;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const need = (n: number | undefined) => (n && n > 0 ? Math.ceil(n) : 0);

/** The PiP sits in the slot's BOTTOM-right corner: the top corners belong to the piece (the stage tag top-left, a Studio
 *  piece's own corner controls top-right: tests/studio corner menu), the bottom-left to the Later pill. */
function pipFor(slot: Rect): Rect {
  const s = Math.round(clamp(Math.min(slot.w, slot.h) * STAGE.pipShare, STAGE.pipMin, STAGE.pipMax));
  return { x: slot.x + slot.w - s - STAGE.pipInset, y: slot.y + slot.h - s - STAGE.pipInset, w: s, h: s };
}

export function solveStage(i: StageInput): StageLayout {
  const fs = Math.max(1, i.fontScale ?? 1);
  const wideish = i.width >= STAGE.wideMinWidth && i.width > i.height;
  if (wideish && i.height >= STAGE.landscapeMaxHeight) return solveWide(i, fs, true);
  if (i.width > i.height && i.height < STAGE.landscapeMaxHeight && i.width >= 560 && !i.keyboard) return solveWide(i, fs, false);
  return solvePhone(i, fs);
}

function solvePhone(i: StageInput, fs: number): StageLayout {
  const { width: W, height: H } = i;
  const g = STAGE.gutterPhone;
  const top = STAGE.top;
  const kb = !!i.keyboard;
  const dock = kb ? Math.round(STAGE.dockKeyboard + 24 * (fs - 1)) : Math.round(STAGE.dock[i.family] + 44 * (fs - 1));
  const chips = i.chips && !kb && !i.play ? Math.round(STAGE.chips * Math.min(fs, 1.3)) : 0;
  const strip = need(i.strip);
  const answer = kb ? 0 : need(i.answerNeed);
  const rail = Math.max(Math.round(STAGE.rail * fs), need(i.railNeed));
  // top · 4 · stage · 8 · answer (+8) · chips · strip · dock · pad
  const fixed = top + 4 + STAGE.gap + (answer ? answer + STAGE.gap : 0) + chips + strip + dock + STAGE.pad;
  let stageH = H - fixed;
  const min = kb ? rail + 64 : STAGE.stageMin;
  const overflow = stageH < min;
  stageH = Math.max(stageH, min);
  const stage: Rect = { x: g, y: top + 4, w: W - 2 * g, h: stageH };
  const slot: Rect = { x: stage.x, y: stage.y, w: stage.w, h: stage.h - rail };
  const railR: Rect = { x: stage.x, y: slot.y + slot.h, w: stage.w, h: rail };
  let y = stage.y + stage.h + STAGE.gap;
  const answerR = answer ? { x: g, y, w: W - 2 * g, h: answer } : null;
  if (answer) y += answer + STAGE.gap;
  const chipsR = chips ? { x: g, y, w: W - 2 * g, h: chips } : null;
  y += chips;
  const stripR = strip ? { x: 0, y, w: W, h: strip } : null;
  y += strip;
  const dockR: Rect = { x: 0, y, w: W, h: dock };
  return {
    kind: "phone", top: { x: 0, y: 0, w: W, h: top }, stage, slot, rail: railR,
    pip: i.artifact && !kb ? pipFor(slot) : null, tile: null, caption: null,
    answer: answerR, strip: stripR, chips: chipsR, dock: dockR, overflow,
    stageShare: (stage.w * stage.h) / (W * H),
  };
}

function solveWide(i: StageInput, fs: number, tall: boolean): StageLayout {
  const { width: W, height: H } = i;
  const g = tall ? STAGE.gutterWide : 12;
  const top = tall ? STAGE.topWide : STAGE.top;
  const side = tall ? Math.round(clamp(W * STAGE.sideShare, STAGE.sideMin, STAGE.sideMax)) : Math.round(clamp(W * 0.36, 240, 320));
  const colW = W - 2 * g - STAGE.gap * (tall ? 3 : 1) - side;
  const colH = H - top - g;
  const answer = need(i.answerNeed);
  const rail = Math.max(Math.round(STAGE.rail * fs), need(i.railNeed));
  // side column: tile (tall only) · caption (elastic) · answer (when up, if it fits there) · chips · strip · dock
  const sx = W - g - side;
  const dock = Math.round((tall ? STAGE.dockWide : STAGE.dock[i.family]) + 44 * (fs - 1));
  const chips = i.chips && !i.play ? Math.round(STAGE.chips * Math.min(fs, 1.3)) : 0;
  const strip = need(i.strip);
  const tileBase = tall ? Math.round(clamp(colH * 0.42, 200, side)) : 0;
  const fixedSide = (tall ? STAGE.gap : 0) + chips + (chips ? STAGE.gap : 0) + strip + dock;
  // her tile yields (to 200) before the answer surface leaves the side column
  const short = answer - (colH - tileBase - fixedSide);
  const tileH = tall && answer > 0 && short > 0 && short <= tileBase - 200 ? tileBase - short : tileBase;
  const sideFree = colH - tileH - fixedSide;
  // The answer surface takes the caption's place in the side column when it fits (the stage keeps its full height);
  // otherwise it goes under the stage, and the stage yields.
  const answerSide = answer > 0 && sideFree >= answer;
  const answerUnder = answer > 0 && !answerSide;
  let stageH = colH - (answerUnder ? answer + STAGE.gap : 0);
  const overflow = stageH < STAGE.stageMin;
  stageH = Math.max(STAGE.stageMin, stageH);
  const stage: Rect = { x: g, y: top, w: colW, h: stageH };
  const slot: Rect = { x: stage.x, y: stage.y, w: stage.w, h: stage.h - rail };
  const railR: Rect = { x: stage.x, y: slot.y + slot.h, w: stage.w, h: rail };
  const capH = Math.max(0, sideFree - (answerSide ? answer : 0));
  let y = top;
  const tile = tall ? { x: sx, y, w: side, h: tileH } : null;
  if (tall) y += tileH + STAGE.gap;
  const caption = { x: sx, y, w: side, h: capH };
  y += capH;
  let answerR: Rect | null = null;
  if (answerSide) { answerR = { x: sx, y, w: side, h: answer }; y += answer; }
  if (answerUnder) answerR = { x: g, y: stage.y + stage.h + STAGE.gap, w: colW, h: answer };
  const chipsR = chips ? { x: sx, y, w: side, h: chips } : null;
  if (chips) y += chips + STAGE.gap;
  const stripR = strip ? { x: sx, y, w: side, h: strip } : null;
  y += strip;
  const dockR = { x: sx, y, w: side, h: dock };
  return {
    kind: tall ? "wide" : "landscape", top: { x: 0, y: 0, w: W, h: top }, stage, slot, rail: railR,
    pip: !tall && i.artifact ? pipFor(slot) : null, tile, caption,
    answer: answerR, strip: stripR, chips: chipsR, dock: dockR, overflow: overflow || sideFree < 0,
    stageShare: (stage.w * stage.h) / (W * H),
  };
}
