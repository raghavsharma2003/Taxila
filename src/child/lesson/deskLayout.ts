// The Desk layout solver (PRODUCT-DESIGN-V2 §6.3.4; replaces layout.ts L1-L5). Pure: container size + family +
// geometry (+ keyboard, font scale, captions) → zone heights in dp (CSS px). Every phone column is solved at the
// 584 dp floor and the 744 dp comfortable case and interpolates between them (rounded to 4 dp); the remainder
// goes to ONE elastic zone (Face: the TeacherWindow, Work: the WorkTray), so every column sums to the container
// height exactly (V-LAYOUT-1, B1-A2). The solver reads the lesson CONTAINER (a ResizeObserver feeds it), never a
// viewport media query (ds-layout-dp-budget). Percentage layouts are not used (ds-rejected-percentage-layout).
//
// Font scale 1.3 / 2.0: the card, caption and dock grow with the text; the extra height is taken from the tray
// first, then the face (down to faceMin 64 Older / 96 Young), then the bottom pad, then the caption. Never from
// the card or the dock. When even that cannot fit, `overflow` is set and the Desk scrolls (it never clips them).
import type { Family } from "../band.ts";

export type Geometry = "face" | "work";

export interface DeskInput {
  width: number;
  height: number;
  family: Family;
  geometry: Geometry;
  /** A text field has focus on a phone (Older typed answer): the Keyboard layout. */
  keyboard?: boolean;
  fontScale?: number;
  /** R0 readers (B1) have no caption line: the card takes its height (§6.3.4: "R0: 0 → card +48"). */
  captionsOn?: boolean;
  /** A trouble strip is up: its height (56, or 96 with two actions), taken directly above the dock from the elastic
   *  zone (face / tray), so it never covers the face or the card (§4.7). */
  strip?: number;
}

export interface PhoneZones {
  top: number;
  /** Face: the TeacherWindow. Work / Keyboard: the SpeechRow (face 64-80 + caption). */
  teacher: number;
  caption: number;
  card: number;
  tray: number;
  strip: number;
  dock: number;
  pad: number;
}

export interface WideZones {
  top: number;
  gutter: number;
  gap: number;
  leftW: number;
  rightW: number;
  /** Left column: window (square), gap, caption (3 lines), gap, "{T} · AI teacher" label row, bottom pad. */
  left: { padTop: number; window: number; gapA: number; caption: number; gapB: number; label: number; pad: number };
  /** Right column: card, gap, tray (Work only), gap, dock, pad; Face centres card + dock vertically (padTop). */
  right: { padTop: number; card: number; gapA: number; tray: number; gapB: number; strip: number; dock: number; pad: number };
}

export interface DeskLayout {
  kind: "phone" | "wide";
  geometry: Geometry;
  keyboard: boolean;
  phone: PhoneZones | null;
  wide: WideZones | null;
  /** Face size inside the SpeechRow (Work / Keyboard), dp. */
  speechFace: number;
  /** The minimums could not all be held at this font scale: the Desk scrolls rather than clip the card or dock. */
  overflow: boolean;
  /** Total of the solved column(s): equals the container height unless overflow. */
  total: number;
}

const FLOOR = 584;
const COMFY = 744;
type Pair = [number, number];
interface Column { top: Pair; teacher: Pair; caption: Pair; card: Pair; tray: Pair; dock: Pair; pad: Pair }

/** §6.3.4, verbatim: each column sums to 584 at [0] and 744 at [1]. */
export const COLUMNS: Record<Family, Record<Geometry, Column>> = {
  older: {
    face: { top: [48, 48], teacher: [232, 336], caption: [56, 64], card: [120, 136], tray: [0, 0], dock: [120, 136], pad: [8, 24] },
    work: { top: [48, 48], teacher: [72, 88], caption: [0, 0], card: [96, 112], tray: [248, 360], dock: [112, 120], pad: [8, 16] },
  },
  young: {
    face: { top: [56, 56], teacher: [232, 344], caption: [48, 56], card: [104, 128], tray: [0, 0], dock: [136, 144], pad: [8, 16] },
    work: { top: [56, 56], teacher: [80, 96], caption: [0, 0], card: [88, 104], tray: [216, 336], dock: [136, 136], pad: [8, 16] },
  },
};
/** Keyboard layout (Older; ≈ 260 dp keyboard → 324 visible): top · SpeechRow · card · tray strip · input dock · pad. */
export const KEYBOARD: PhoneZones = { top: 48, teacher: 56, caption: 0, card: 72, tray: 48, strip: 0, dock: 92, pad: 8 };

export const FACE_MIN: Record<Family, number> = { older: 64, young: 96 };
export const TRAY_MIN: Record<Family, number> = { older: 160, young: 184 };
const TEACHER_MAX_PHONE = 440;
export const WIDE_MIN_WIDTH = 840;

const r4 = (n: number) => Math.round(n / 4) * 4;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sum = (z: PhoneZones) => z.top + z.teacher + z.caption + z.card + z.tray + z.strip + z.dock + z.pad;

export function solveDesk(i: DeskInput): DeskLayout {
  const fs = Math.max(1, i.fontScale ?? 1);
  const wide = i.width >= WIDE_MIN_WIDTH && i.width > i.height && i.height >= 520;
  if (wide) return solveWide(i, fs);
  return solvePhone(i, fs);
}

function solvePhone(i: DeskInput, fs: number): DeskLayout {
  const { family, geometry, height: h } = i;
  const keyboard = !!i.keyboard && family === "older";
  let z: PhoneZones;
  if (keyboard) {
    z = { ...KEYBOARD, strip: Math.max(0, i.strip ?? 0) };
    z.card = Math.round(z.card * fs);
    z.dock = Math.round(z.dock + 24 * (fs - 1));
    z.tray = Math.max(0, h - (sum(z) - z.tray)); // the strip takes what is left (≥ 0)
    const total = sum(z);
    return { kind: "phone", geometry, keyboard, phone: z, wide: null, speechFace: 48, overflow: total > h, total };
  }
  const col = COLUMNS[family][geometry];
  const t = Math.min(1, Math.max(0, (h - FLOOR) / (COMFY - FLOOR)));
  const at = (p: Pair) => r4(lerp(p[0], p[1], t));
  z = { top: at(col.top), teacher: at(col.teacher), caption: at(col.caption), card: at(col.card), tray: at(col.tray), strip: Math.max(0, i.strip ?? 0), dock: at(col.dock), pad: at(col.pad) };
  if (i.captionsOn === false && geometry === "face") {
    z.card += z.caption;
    z.caption = 0;
  }
  // Font scale: the text zones grow; the dock's header row and mode line grow too.
  if (fs > 1) {
    z.card = Math.round(z.card * fs);
    z.caption = Math.round(z.caption * fs);
    z.dock = Math.round(z.dock + 44 * (fs - 1));
  }
  // Elastic zone takes the remainder (positive or negative).
  const elastic: keyof PhoneZones = geometry === "work" ? "tray" : "teacher";
  z[elastic] += h - sum(z);
  // Too tall a face on a tall phone: cap it and give the rest to the pad (centred by the Desk).
  if (geometry === "face" && z.teacher > TEACHER_MAX_PHONE) {
    z.pad += z.teacher - TEACHER_MAX_PHONE;
    z.teacher = TEACHER_MAX_PHONE;
  }
  // Yield order when short: tray → face (to faceMin) → pad → caption. Never card or dock.
  const faceMin = FACE_MIN[family];
  const trayMin = geometry === "work" ? TRAY_MIN[family] : 0;
  const teacherMin = geometry === "work" ? faceMin + 8 : faceMin;
  let deficit = sum(z) - h;
  const take = (k: keyof PhoneZones, floor: number) => {
    if (deficit <= 0) return;
    const room = Math.max(0, z[k] - floor);
    const d = Math.min(room, deficit);
    z[k] -= d;
    deficit -= d;
  };
  take("tray", trayMin);
  take("teacher", teacherMin);
  take("pad", 0);
  take("caption", 0);
  take("tray", 0);
  const total = sum(z);
  const speechFace = geometry === "work" ? Math.max(48, Math.min(80, z.teacher - 8)) : 0;
  return { kind: "phone", geometry, keyboard: false, phone: z, wide: null, speechFace, overflow: total > h, total };
}

function solveWide(i: DeskInput, fs: number): DeskLayout {
  const { width: w, height: h, geometry } = i;
  const top = 56;
  const gutter = 32;
  const gap = 24;
  const leftW = Math.min(440, Math.round((w - 2 * gutter - gap) * 0.37));
  const rightW = Math.min(752, w - 2 * gutter - gap - leftW);
  const H = h - top;
  // Left: window square (≤ leftW), 16, caption 104 (3 lines at 22 px), 16, label 48, pad.
  const caption = Math.round(104 * fs);
  const fixedL = 16 + caption + 16 + 48;
  const window = Math.max(FACE_MIN[i.family] * 2, Math.min(leftW, H - fixedL - 16));
  const leftPad = H - window - fixedL;
  // Right: Work = card 128 · 16 · tray · 16 · dock 128 · 16. Face = card 240 · 16 · dock 144, centred.
  let right: WideZones["right"];
  let overflow = false;
  if (geometry === "work") {
    const card = Math.round(128 * fs);
    const dock = Math.round(128 + 44 * (fs - 1));
    const strip = Math.max(0, i.strip ?? 0);
    const tray = H - card - 16 - 16 - strip - dock - 16;
    overflow = tray < TRAY_MIN[i.family];
    right = { padTop: 0, card, gapA: 16, tray: Math.max(0, tray), gapB: 16, strip, dock, pad: 16 };
  } else {
    const card = Math.round(240 * fs);
    const dock = Math.round(144 + 44 * (fs - 1));
    const strip = Math.max(0, i.strip ?? 0);
    const free = H - card - 16 - strip - dock;
    overflow = free < 0;
    const padTop = Math.max(0, Math.floor(free / 2));
    right = { padTop, card, gapA: 16, tray: 0, gapB: 0, strip, dock, pad: Math.max(0, free - padTop) };
  }
  if (leftPad < 0) overflow = true;
  // Taller than the 720 reference: the spare height is split above and below, so the face sits level with the card.
  const lp = Math.max(0, leftPad);
  const padTop = Math.min(Math.floor(lp / 2), right.padTop || Math.floor(lp / 2));
  const wz: WideZones = { top, gutter, gap, leftW, rightW, left: { padTop, window, gapA: 16, caption, gapB: 16, label: 48, pad: lp - padTop }, right };
  const rTotal = top + right.padTop + right.card + right.gapA + right.tray + right.gapB + right.strip + right.dock + right.pad;
  return { kind: "wide", geometry, keyboard: false, phone: null, wide: wz, speechFace: 0, overflow, total: rTotal };
}

/** The phase → geometry rule (§6.3.4): from ui.tray at the phase boundary; "none" → Face, anything else → Work. */
export function geometryForTray(tray: string | null | undefined): Geometry {
  return tray && tray !== "none" ? "work" : "face";
}
