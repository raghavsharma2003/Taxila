// Pure layout for the maps (unit-tested: tests/ui-v2-b2.test.mjs). No React here.
import type { ChildMapSkill } from "../../../shared/contracts.ts";
import type { MapChapter } from "../api.ts";

/** Which beds to draw: chapters with any started skill, plus the class's current chapter. Pure. */
export function gardenBeds(chapters: MapChapter[]): MapChapter[] {
  return chapters.filter((c) => c.here || c.topics.some((tp) => tp.skills.some((s) => s.state !== "not_started")));
}

const COL_W = 180;
const STEP = 56;
const PER_ROW = 3;
export const TOP = 30;

export interface Placed { skill: ChildMapSkill; x: number; y: number; chapter: MapChapter }
export interface Cluster { chapter: MapChapter; x: number; y: number; w: number; h: number; cx: number; cy: number; labelY: number; lines: number }

/** Deterministic layout: chapters in `cols` columns; a chapter's stars in rows of 3, zig-zagged. Pure. */
export function layoutSky(chapters: MapChapter[], cols: number): { width: number; height: number; stars: Placed[]; clusters: Cluster[] } {
  const stars: Placed[] = [];
  const clusters: Cluster[] = [];
  const colH = new Array(cols).fill(16);
  chapters.forEach((ch, i) => {
    const skills = ch.topics.flatMap((tp) => tp.skills);
    const rows = Math.max(1, Math.ceil(skills.length / PER_ROW));
    const lines = chapterLines(ch.title).length;
    const h = TOP + (rows - 1) * STEP + 34 + (lines - 1) * 16 + (ch.here ? 34 : 8) + 16;
    const col = colH.indexOf(Math.min(...colH));
    const x = col * COL_W, y = colH[col];
    skills.forEach((s, k) => {
      const r = Math.floor(k / PER_ROW), c = k % PER_ROW;
      const inRow = Math.min(PER_ROW, skills.length - r * PER_ROW);
      const x0 = x + COL_W / 2 - ((inRow - 1) * STEP) / 2;
      stars.push({ skill: s, chapter: ch, x: x0 + c * STEP, y: y + TOP + r * STEP + (inRow > 1 && (c + r + i) % 2 ? 8 : 0) });
    });
    const lastRow = y + TOP + (rows - 1) * STEP;
    clusters.push({ chapter: ch, x, y, w: COL_W, h, cx: x + COL_W / 2, cy: y + TOP + ((rows - 1) * STEP) / 2, labelY: lastRow + 38, lines });
    colH[col] += h;
  });
  return { width: cols * COL_W, height: Math.max(...colH) + 8, stars, clusters };
}

/**
 * A chapter title as up to 3 label lines of ≤ 20 characters, broken on whole words ("We the Travellers — I" →
 * ["We the Travellers I"]: no dashes in chrome, §5.4). Never a cut word. Pure (unit-tested).
 */
export function chapterLines(title: string, max = 20): string[] {
  const words = title.replace(/\s*[—–]\s*/g, " ").replace(/\s+-\s+/g, " ").replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  for (const w of words) {
    const cur = lines.at(-1);
    if (cur !== undefined && (cur + " " + w).length <= max) lines[lines.length - 1] = cur + " " + w;
    else lines.push(w);
  }
  return lines.slice(0, 3);
}
