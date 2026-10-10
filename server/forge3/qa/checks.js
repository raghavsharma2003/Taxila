// forge3 visual QA: the verdict on one rendered view, from the page's own measurements (measure.js). Pure, no browser.
//
// HARD checks (any failure = the view is broken and the piece may not reach a child at this size):
//   Q1 legible      every child-visible text run renders ≥ the play floor (shared/play.ts FLOORS.text 14 px; 16 px for
//                   classes 4-5 when `young`); words drawn on a canvas use the engine's design minimum scaled to the canvas
//   Q2 whole        no text run is clipped by the box (outside its rect, or ellipsised by its own overflow), and no
//                   drawn shape runs past the box edge (part of the picture missing)
//   Q3 apart        no two text runs overlap (≥ 20% of the smaller one's area), and no text run lies under another
//                   painted element (a pill or card covering readouts: the round 3 forge matrix saw it on phones)
//   Q4 touchable    every target ≥ FLOORS.target (44 px) on both sides and inside the box; canvas targets by design units
//   Q5 drawn        something is drawn: SVG content, or ≥ 1% of a canvas differs from its ground
//   Q6 clean        no renderer error and no page error while rendering
//   Q7 not a speck  the drawn content covers ≥ 15% of the box (a board drawn in one corner of an empty slate fails)
// SOFT checks (quality, reported and counted, never block on their own):
//   S1 composed     drawn content covers ≥ 35% of the box
//   S2 uses tray    the piece's box is ≥ 55% of the tray it was given (a 16:10 world in a portrait tray wastes the rest)
//   S4 drawn once   no text run drawn twice on the same spot (identical words, ≥ 90% coincident: a continue board that
//                   re-draws its earlier ops); not a hard fail because the child sees one run
import { FLOORS } from "../../../shared/play.ts";

/** Studio v2 host minimums in design units of its 1000 x 625 world (src/studio-v2/core/tokens.ts MIN). */
export const SV2_MIN = Object.freeze({ label: 38, value: 48, target: 130, worldW: 1000 });
export const QA_VERSION = "forge3-qa@2";

/**
 * @param {object} m   measureStage() output
 * @param {{ young?: boolean, events?: { type: string, message?: string }[], artifactKind?: string }} [o]
 * @returns {{ pass: boolean, hard: object[], soft: object[], fails: string[], stats: object }}
 */
export function judgeView(m, o = {}) {
  const floor = o.young ? FLOORS.textYoung : FLOORS.text;
  const hard = [], soft = [];
  const add = (list, id, pass, detail) => list.push({ id, pass: !!pass, ...(detail ? { detail } : {}) });
  const texts = (m?.texts ?? []).filter((t) => !t.chrome);
  const box = m?.box;
  if (!box || box.w < 1 || box.h < 1) {
    add(hard, "Q5.drawn", false, "no box on the tray");
    return finish(hard, soft, { floor });
  }
  // Q1 legible
  let minPx = texts.length ? Math.min(...texts.map((t) => t.px).filter((x) => x > 0)) : null;
  let canvasLabel = null, canvasTarget = null;
  if (m.canvas && (o.artifactKind === "stagecraft" || m.kind === "stagecraft")) {
    const s = m.canvas.w / SV2_MIN.worldW;
    canvasLabel = Math.round(SV2_MIN.label * s * 10) / 10;
    canvasTarget = Math.round(SV2_MIN.target * s);
    minPx = minPx == null ? canvasLabel : Math.min(minPx, canvasLabel);
  }
  const small = texts.filter((t) => t.px > 0 && t.px < floor);
  add(hard, "Q1.legible", (minPx == null || minPx >= floor) && !small.length,
    minPx == null ? null : `smallest text ${minPx} px (floor ${floor})${small.length ? `; ${small.length} runs below, e.g. "${small[0].t}" ${small[0].px} px` : ""}${canvasLabel != null ? `; canvas labels ${canvasLabel} px` : ""}`);
  // Q2 whole
  const cut = texts.filter((t) => t.outside || t.ellipsis);
  const shapesCut = m.shapesCut ?? 0;
  add(hard, "Q2.whole", !cut.length && !shapesCut, [cut.length ? `${cut.length} runs clipped, e.g. "${cut[0].t}"` : "", shapesCut ? `${shapesCut} shapes cut by the box edge` : ""].filter(Boolean).join("; ") || null);
  // Q3 apart
  const ov = m.overlaps ?? [];
  const covered = texts.filter((t) => t.covered);
  add(hard, "Q3.apart", !ov.length && !covered.length, [ov.length ? `${ov.length} overlaps, e.g. "${ov[0].a}" × "${ov[0].b}" (${ov[0].share})` : "",
    covered.length ? `${covered.length} runs covered by another element, e.g. "${covered[0].t}"` : ""].filter(Boolean).join("; ") || null);
  // Q4 touchable
  const tg = (m.targets ?? []).filter((t) => Math.min(t.w, t.h) < FLOORS.target || t.outside);
  const canvasTargetFail = canvasTarget != null && canvasTarget < FLOORS.target;
  add(hard, "Q4.touchable", !tg.length && !canvasTargetFail,
    [tg.length ? `${tg.length} targets small or outside, e.g. "${tg[0].label}" ${tg[0].w}x${tg[0].h}` : "", canvasTargetFail ? `canvas targets ${canvasTarget} px` : ""].filter(Boolean).join("; ") || null);
  // Q5 drawn
  const drawn = (m.content && m.content.w * m.content.h > 0) || (m.canvas?.ink?.share ?? 0) >= 0.01;
  add(hard, "Q5.drawn", drawn, drawn ? null : "nothing drawn in the box");
  // Q6 clean
  // a piece that refused this box ("layout") and was replaced by its board twin stepped down AS DESIGNED: the view judged
  // is the twin, and the refusal is not a renderer failure (any other error still is)
  const steppedDown = m.legible === "twin";
  const bad = (o.events ?? []).filter((e) => (e.type === "error" || e.type === "pageerror") && !(steppedDown && e.type === "error" && e.message === "layout"));
  add(hard, "Q6.clean", !bad.length, bad.length ? `${bad[0].type}: ${String(bad[0].message ?? "").slice(0, 100)}` : null);
  // Q7 / S1 composition
  const fill = m.content ? (m.content.w * m.content.h) / (box.w * box.h) : 0;
  // (a board's composition: canvas engines paint their own full-bleed ground, so their fill is not measured this way)
  const svgContent = !!m.svg && !m.canvas;
  add(hard, "Q7.not_a_speck", !svgContent || !drawn || fill >= 0.15, `content fills ${Math.round(fill * 100)}% of the box`);
  add(soft, "S1.composed", fill >= 0.35, `content fills ${Math.round(fill * 100)}% of the box`);
  // S4 drawn once: the same words drawn twice on one spot (invisible to the child, but a renderer/continue bug)
  add(soft, "S4.drawn_once", !(m.duplicates > 0), m.duplicates > 0 ? `${m.duplicates} text runs drawn twice on the same spot` : null);
  // S2 uses the tray
  const use = m.tray ? (box.w * box.h) / (m.tray.w * m.tray.h) : 1;
  add(soft, "S2.uses_tray", use >= 0.55, `box ${box.w}x${box.h} is ${Math.round(use * 100)}% of the tray ${m.tray?.w}x${m.tray?.h}`);
  return finish(hard, soft, { floor, minPx, canvasLabel, canvasTarget, fill: Math.round(fill * 100) / 100, trayUse: Math.round(use * 100) / 100, box });
}

function finish(hard, soft, stats) {
  const fails = hard.filter((c) => !c.pass).map((c) => c.id);
  return { pass: fails.length === 0, hard, soft, fails, softFails: soft.filter((c) => !c.pass).map((c) => c.id), stats };
}

/** One piece across views: it may reach a child at a size only when that view passed; `pass` = every view passed. */
export function judgePiece(views) {
  const byVp = Object.fromEntries(views.map((v) => [v.vp, v.verdict.pass]));
  return { pass: views.every((v) => v.verdict.pass), byViewport: byVp, fails: [...new Set(views.flatMap((v) => v.verdict.fails.map((f) => `${v.vp}:${f}`)))] };
}

/**
 * The verdict on a module engine's frame (measureDocument): legible text, nothing the child cannot reach (content past the
 * frame is a failure unless the frame scrolls to it, which is reported), targets ≥ 44 px. Same floors as judgeView.
 */
export function judgeFrame(d, o = {}) {
  const floor = o.young ? FLOORS.textYoung : FLOORS.text;
  const hard = [], soft = [];
  const add = (list, id, pass, detail) => list.push({ id, pass: !!pass, ...(detail ? { detail } : {}) });
  const small = (d?.texts ?? []).filter((t) => t.px > 0 && t.px < floor);
  add(hard, "Q1.legible", !small.length, small.length ? `${small.length} runs < ${floor} px, e.g. "${small[0].t}" ${small[0].px} px` : null);
  const cutText = (d?.texts ?? []).filter((t) => t.outside).length, cutTargets = (d?.targets ?? []).filter((t) => t.outside).length;
  // round 4 content: the frame scrolls only vertically: anything past its left or right edge is cut whatever the scroll
  const cutX = (d?.texts ?? []).filter((t) => t.outsideX).length + (d?.targets ?? []).filter((t) => t.outsideX).length;
  add(hard, "Q2.whole", !cutX && (d?.scrollable || (cutText === 0 && cutTargets === 0)), cutText || cutTargets ? `${cutText} text runs and ${cutTargets} targets past the frame${cutX ? ` (${cutX} past its side edges)` : d?.scrollable ? " (the frame scrolls to them)" : ""}` : null);
  // round 4 content: words drawn over each other (tick labels grown to the floor and not thinned)
  const ov = d?.overlaps ?? [];
  add(hard, "Q3.apart", !ov.length, ov.length ? `${ov.length} overlaps, e.g. "${ov[0].a}" × "${ov[0].b}" (${ov[0].share})` : null);
  const tg = (d?.targets ?? []).filter((t) => Math.min(t.w, t.h) < FLOORS.target);
  add(hard, "Q4.touchable", !tg.length, tg.length ? `${tg.length} targets < 44 px, e.g. "${tg[0].label}" ${tg[0].w}x${tg[0].h}` : null);
  add(hard, "Q5.drawn", (d?.texts?.length ?? 0) + (d?.targets?.length ?? 0) > 0, null);
  add(soft, "S3.no_scroll", !d?.scrollable, d?.scrollable ? "the engine only fits by scrolling its frame" : null);
  const fails = hard.filter((c) => !c.pass).map((c) => c.id);
  return { pass: fails.length === 0, hard, soft, fails, softFails: soft.filter((c) => !c.pass).map((c) => c.id), stats: { floor, fit: d?.fit ?? null, scrollable: !!d?.scrollable } };
}
