// Board legibility fit (round 2, stream content). Shape only, never truth.
//
// Measured 2026-10-06 (tests/round2-content.test.mjs reproduces it): all 3011 authored catalogue boards in
// data/studio-catalogue are drawn on an 800 x 500 board, and 2886 of them (95.8%) FAIL W1.fits_stage at the live gate:
// the phone tray (312 x 274) shows an 800-wide board at 0.39 scale, so an 18-unit label is 7 px (bar 11 px). The live
// gate rejects every such board, so the "board plan 379/385 topics" coverage counted boards that can never reach a child.
//
// The fit: shrink the board's GEOMETRY (points, centres, radii, boxes) by one factor so the smallest text reaches the
// legibility bar, and keep every text size as authored (text sizes are fixed tokens s/m/l: they cannot grow). The result
// is re-gated by the caller with the full gate; overlaps the shrink causes are refused there (W2), never hidden here.
import { TEXT_SIZE } from "../../shared/whiteboard.js";
import { PHONE_TRAY } from "../studio/archetypes/index.js";
import { MIN_TEXT_PX } from "../studio/qa/whiteboard.js";

const sizeOf = (o) => (o.op === "text" ? TEXT_SIZE[o.size] ?? TEXT_SIZE.m : o.op === "label" ? TEXT_SIZE.s : o.op === "numwork" ? TEXT_SIZE.m * (o.marks?.some((m) => m.kind === "carry") ? 0.62 : 1) : null);
const isPt = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === "number" && Number.isFinite(v));

/** The smallest text size on the phone tray, in px (Infinity when the board has no text). */
export function minTextPx(script) {
  const b = script?.board;
  if (!b?.w || !b?.h) return Infinity;
  const sizes = (script.ops ?? []).map(sizeOf).filter((x) => x != null);
  return sizes.length ? Math.min(...sizes) * Math.min(PHONE_TRAY.w / b.w, PHONE_TRAY.h / b.h) : Infinity;
}

/** Every coordinate and length of a script scaled by k (ids, text, timing, sizes untouched). */
export function scaleScript(script, k) {
  const P = (p) => (isPt(p) ? [Math.round(p[0] * k * 10) / 10, Math.round(p[1] * k * 10) / 10] : p);
  const L = (v) => (typeof v === "number" ? Math.round(v * k * 10) / 10 : v);
  const ops = (script.ops ?? []).map((o) => {
    const x = { ...o };
    if (Array.isArray(o.points)) x.points = o.points.map(P);
    for (const f of ["from", "to", "at", "c"]) if (isPt(o[f])) x[f] = P(o[f]);
    for (const f of ["w", "h", "r", "rx", "ry"]) if (typeof o[f] === "number") x[f] = L(o[f]);
    return x;
  });
  return { ...script, board: { ...script.board, w: Math.round(script.board.w * k), h: Math.round(script.board.h * k) }, ops };
}

/**
 * The script with its smallest text at ≥ MIN_TEXT_PX on the phone tray (geometry shrunk, never below 0.45 of the authored
 * size: past that the drawing is too small to read anyway), or the script unchanged when it already fits.
 */
export function fitLegible(script, { minPx = MIN_TEXT_PX, floor = 0.45 } = {}) {
  try {
    const now = minTextPx(script);
    if (!(now < minPx) || !Number.isFinite(now)) return script;
    // the tray scale is min(tw / (W k), th / (H k)) = s0 / k: text px grows as 1 / k
    const k = Math.max(floor, Math.min(1, (now / minPx) * 0.995));
    return scaleScript(script, k);
  } catch { return script; }
}
