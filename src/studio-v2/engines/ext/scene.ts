// SCENE EXPLAINER — `scene-explainer@1` (VALUES-100 V3.1: one cinematic explainer for every class 4-7 topic).
// Shots (scenes) of computed primitives, narration-locked through the shared ExplainerShell (state = f(t): "again",
// "slower" and seek are exact), with the camera, focus, flows and a myth that fails on screen. The model writes the
// spec; this file owns layout (no overlaps, safe zones, the 38-unit label floor), every computed picture (axis
// positions, shaded parts, bar heights, angle arcs and their degree labels, counters, Hindi मात्रा weights) and the
// graded hands-on ending (tap the right part · tap steps in order · place a value on a scale). The host grades.
import { matraWeights } from "../../../../shared/studio-spec-ext/common.ts";
import type { SceneEl, SceneSpec, SceneT } from "../../../../shared/studio-spec-ext/scene.ts";
import type { BeatT } from "../../../../shared/studio-spec.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, ease, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { ExplainerShell } from "../../core/explainer.ts";
import type { TimelineConfig } from "../../core/timeline.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../../core/types.ts";
import type { BoardSpec } from "../../core/board.ts";
import { ACC, backdrop, devaReady, dust, fmtNum, hasDeva, textBlock, wrap } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

interface Box { x: number; y: number; w: number; h: number }
interface Pos { x: number; y: number; box?: Box; lab?: "above" | "below" }
const R0 = { x0: 70, x1: 930, y0: 182, y1: 505 };
const ITEM = new Set(["node", "glyph"]);
const DIAG = new Set(["title", "label", "axis", "bar", "bars", "grid", "angle", "poly", "counter", "quote", "meter", "myth", "particles"]);

/** Line count of a label at the 38-unit floor, by a font-independent estimate (≈ 20 units per character). */
export function estLines(text: string, maxW: number): number {
  let lines = 1, cur = 0;
  for (const w of text.split(/\s+/).filter(Boolean)) { const ww = w.length * 20; if (cur && cur + 10 + ww > maxW) { lines++; cur = ww; } else cur += (cur ? 10 : 0) + ww; }
  return Math.min(2, lines);
}
/** Deterministic layout for one scene: item slots + diagram sub-rectangles (world units, clear of the safe zones). */
export function layoutScene(sc: SceneT): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const free = sc.layout === "free";
  const items = sc.els.filter((e) => ITEM.has(e.type) && !(free && "x" in e && e.x !== undefined && "y" in e && e.y !== undefined));
  const diags = sc.els.filter((e) => DIAG.has(e.type) && !(free && e.type !== "poly" && "x" in e && e.x !== undefined && "y" in e && e.y !== undefined));
  for (const e of sc.els) if (free && "x" in e && e.x !== undefined && "y" in e && e.y !== undefined) pos.set(e.id, { x: clamp(e.x, 90, 910), y: clamp(e.y, 190, 500) });
  let itemR: Box | null = null, diagR: Box | null = null;
  const full: Box = { x: R0.x0, y: R0.y0, w: R0.x1 - R0.x0, h: R0.y1 - R0.y0 };
  if (items.length && diags.length) {
    if (sc.layout === "split") { diagR = { x: R0.x0, y: R0.y0, w: 470, h: full.h }; itemR = { x: 580, y: R0.y0, w: 350, h: full.h }; }
    else { itemR = { x: full.x, y: R0.y0, w: full.w, h: 170 }; diagR = { x: full.x, y: R0.y0 + 180, w: full.w, h: full.h - 180 }; }
  } else if (items.length) itemR = full; else diagR = full;
  if (itemR) {
    const n = items.length;
    let mode = sc.layout === "split" ? "column" : sc.layout;
    if (mode === "row" && n > 4) mode = "grid";
    if (mode === "column" && n * 96 > itemR.h + 40 && sc.layout !== "split") mode = "grid";
    if (mode === "free") mode = n > 4 ? "grid" : "row";
    items.forEach((e, i) => {
      let x = 0, y = 0;
      if (mode === "row") { x = itemR!.x + ((i + 0.5) * itemR!.w) / n; y = itemR!.y + itemR!.h * (diagR ? 0.36 : 0.42); }
      else if (mode === "column") { x = itemR!.x + itemR!.w / 2; y = itemR!.y + ((i + 0.5) * itemR!.h) / n - 18; }
      else if (mode === "cycle") {
        // closed loops read clockwise; labels sit OUTSIDE the loop so arrows never cross them
        const cx = itemR!.x + itemR!.w / 2, top = itemR!.y + 80, bot = itemR!.y + itemR!.h - 80, cyy = (top + bot) / 2;
        if (n === 3) { const pts: [number, number, "above" | "below"][] = [[cx, top, "above"], [cx + 260, bot, "below"], [cx - 260, bot, "below"]]; [x, y] = pts[i]; pos.set(e.id, { x, y, lab: pts[i][2] }); return; }
        if (n === 4) { const t4 = itemR!.y + 84, b4 = itemR!.y + itemR!.h - 98; const pts: [number, number, "above" | "below"][] = [[cx - 210, t4, "above"], [cx + 210, t4, "above"], [cx + 210, b4, "below"], [cx - 210, b4, "below"]]; [x, y] = pts[i]; pos.set(e.id, { x, y, lab: pts[i][2] }); return; }
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2, rx = Math.min(340, itemR!.w / 2 - 120), ry = (bot - top) / 2;
        x = cx + Math.cos(a) * rx; y = cyy + Math.sin(a) * ry; pos.set(e.id, { x, y, lab: Math.sin(a) < -0.3 ? "above" : "below" }); return;
      } else { const cols = Math.ceil(n / 2), row = Math.floor(i / cols), col = i % cols, inRow = row === 0 ? cols : n - cols; x = itemR!.x + ((col + 0.5) * itemR!.w) / inRow; y = itemR!.y + (row === 0 ? itemR!.h * 0.22 : itemR!.h * 0.7); }
      pos.set(e.id, { x, y });
    });
  }
  for (const e of items) {
    const p = pos.get(e.id); if (!p || p.lab === "above") continue;
    const txt = e.type === "node" ? e.text : "", sub = e.type === "node" && e.sub ? 46 : 0;
    const lines = e.type === "node" ? estLines(txt, e.glyph ? 230 : 250) : 0;
    const bottom = e.type === "node" ? (e.glyph ? p.y + 46 + 12 + lines * 44 + sub : p.y + (lines * 46 + 26) / 2 + sub) : p.y + ((e as { size?: number }).size ?? 160) / 2;
    if (bottom > 518) p.y -= bottom - 518;
  }
  if (diagR && diags.length) {
    // stack diagrams vertically; small ones (label, counter) get less height
    const wt = (e: SceneEl) => (e.type === "label" ? 0.45 : e.type === "counter" || e.type === "title" ? 0.8 : 1);
    const tot = diags.reduce((a, e) => a + wt(e), 0);
    let y = diagR.y;
    for (const e of diags) { const h = (diagR.h * wt(e)) / tot; pos.set(e.id, { x: diagR.x + diagR.w / 2, y: y + h / 2, box: { x: diagR.x, y, w: diagR.w, h } }); y += h; }
  }
  return pos;
}

function create(api: EngineApi, spec: SceneSpec): EngineInstance {
  const T = spec.strings, accent = ACC[spec.accent];
  const els = new Map<string, { el: SceneEl; scene: number }>();
  spec.scenes.forEach((s, i) => s.els.forEach((e) => els.set(e.id, { el: e, scene: i })));
  const lays = spec.scenes.map((s) => layoutScene(s));
  const P = (id: string) => lays[els.get(id)!.scene].get(id);
  // ── translate scene cues to the shared timeline grammar (show / hide / set / camera / interactive)
  const init: Record<string, number> = { "cam.x": 500, "cam.y": 312, "cam.zoom": 1, dim: 0 };
  const showable: string[] = [];
  spec.scenes.forEach((s, i) => { init[`S${i}.a`] = 0; showable.push(`S${i}`); for (const e of s.els) {
    const p = lays[i].get(e.id); showable.push(e.id);
    Object.assign(init, { [`${e.id}.a`]: 0, [`${e.id}.s`]: 1, [`${e.id}.hl`]: 0, [`${e.id}.f`]: 0, [`${e.id}.c`]: 0, [`${e.id}.bust`]: 0, [`${e.id}.fo`]: 0, [`${e.id}.x`]: p?.x ?? 500, [`${e.id}.y`]: p?.y ?? 330,
      [`${e.id}.sh`]: e.type === "bar" || e.type === "grid" ? e.shaded : 0 });
  } });
  const sceneIdx = new Map(spec.scenes.map((s, i) => [s.id, i]));
  const beats: BeatT[] = [];
  let curScene = -1;
  for (const b of spec.beats) {
    const cues: BeatT["cues"] = [];
    const to = b.scene !== undefined ? sceneIdx.get(b.scene) ?? curScene : curScene < 0 ? 0 : curScene;
    if (to !== curScene) {
      if (curScene >= 0) cues.push({ at: 0, do: "hide", target: `S${curScene}`, dur: 0.5 });
      cues.push({ at: curScene >= 0 ? 0.25 : 0, do: "show", target: `S${to}`, dur: 0.7 });
      cues.push({ at: 0, do: "camera", zoom: 1, x: 500, y: 312, dur: 0.8 });
      cues.push({ at: 0, do: "set", prop: "dim", to: 0, dur: 0.3 });
      curScene = to;
    }
    for (const c of b.cues) {
      const tg = ([] as unknown[]).concat((c as { target?: unknown }).target ?? []).map(String).filter((id) => els.has(id));
      const base = { at: c.at, dur: c.dur };
      const set = (prop: string, v: number, extra: Record<string, unknown> = {}) => cues.push({ ...base, do: "set", prop, to: v, ...extra });
      switch (c.do) {
        case "show": case "hide": cues.push({ ...base, do: c.do, target: tg }); break;
        case "move": for (const id of tg) { set(`${id}.x`, Number((c as { x?: number }).x)); set(`${id}.y`, Number((c as { y?: number }).y)); } break;
        case "scale": for (const id of tg) set(`${id}.s`, Number((c as { to?: number }).to)); break;
        case "highlight": for (const id of tg) { cues.push({ at: c.at, do: "set", prop: `${id}.hl`, to: 1, dur: 0.25 }); cues.push({ at: typeof c.at === "number" ? c.at + Math.max(0.6, c.dur ?? 1.2) : c.at, do: "set", prop: `${id}.hl`, to: 0, dur: 0.4, ...(typeof c.at === "number" ? {} : { _late: Math.max(0.6, c.dur ?? 1.2) }) }); } break;
        case "flow": for (const id of tg) set(`${id}.f`, Number((c as { to?: number }).to ?? 1)); break;
        case "count": for (const id of tg) set(`${id}.c`, Number((c as { to?: number }).to ?? 1), { ease: "inOutQuad", dur: c.dur ?? 1.6 }); break;
        case "bust": for (const id of tg) set(`${id}.bust`, 1, { ease: "linear", dur: c.dur ?? 1.2 }); break;
        case "shade": for (const id of tg) set(`${id}.sh`, Number((c as { to?: number }).to), { dur: c.dur ?? 1.2 }); break;
        case "focus": set("dim", 1, { dur: 0.4 }); for (const id of tg) set(`${id}.fo`, 1, { dur: 0.4 }); break;
        case "unfocus": set("dim", 0, { dur: 0.4 }); break;
        case "camera": { const cc = c as { zoom?: number; x?: number; y?: number }; cues.push({ ...base, do: "camera", zoom: cc.zoom ?? 1, ...(cc.x !== undefined ? { x: cc.x } : {}), ...(cc.y !== undefined ? { y: cc.y } : {}) }); break; }
        case "interactive": cues.push({ at: c.at, do: "interactive" }); break;
      }
    }
    // "highlight" off-cues anchored to a clause need a numeric offset: resolve by duplicating at "end"
    for (const cu of cues) if ((cu as { _late?: number })._late) { (cu as Record<string, unknown>).at = "end"; delete (cu as Record<string, unknown>)._late; }
    beats.push({ line: b.line, gap: b.gap, cues });
  }
  const CFG: TimelineConfig = { init, showable, labels: [], verbs: {} };
  const sh = new ExplainerShell(api, { beats, text: spec.text, narration: spec.narration }, CFG), V = sh.V;
  const lastScene = spec.scenes.length - 1;
  const needsDeva = JSON.stringify(spec).match(/[ऀ-ॿ]/) !== null;
  let fontOk = !needsDeva;
  if (needsDeva) void devaReady().then(() => { fontOk = true; });
  const hits = new Map<string, Box>();
  const live = { task: false, answered: false, verdict: "" as string, chosen: null as string | null, order: [] as string[], marker: null as null | number, dragging: false, revealT: 0, doneSent: false };
  const bustFired = new Set<string>();
  const botR = rng(api.seed * 31 + 5);
  const task = spec.task;
  const axisOf = (id: string) => { const e = els.get(id)?.el; return e && e.type === "axis" ? e : null; };
  // axis geometry (shared by render + task)
  function axisGeom(id: string): { x0: number; x1: number; y: number; X: (v: number) => number; V: (x: number) => number } | null {
    const e = axisOf(id); const p = P(id); if (!e || !p?.box) return null;
    const b = p.box, y = e.y ?? b.y + b.h * 0.62, x0 = b.x + 40, x1 = b.x + b.w - 40;
    return { x0, x1, y, X: (v) => x0 + ((v - e.min) / (e.max - e.min)) * (x1 - x0), V: (x) => e.min + ((x - x0) / (x1 - x0)) * (e.max - e.min) };
  }
  const yearLabel = (v: number, crosses: boolean) => (crosses || v < 0 ? (v < 0 ? `${fmtNum(-v)} BCE` : `${fmtNum(v)} CE`) : String(Math.round(v)));
  // ── element painters
  function drawNode(ctx: Ctx, e: Extract<SceneEl, { type: "node" | "glyph" }>, x: number, y: number, a: number, s: number, hl: number, now: number) {
    const col = e.color ? ACC[e.color] : accent;
    if (e.type === "glyph") {
      const size = (e.size ?? 160) * s;
      bloom(ctx, col, x, y, size * 0.9, 0.25 * a);
      drawGlyph(ctx, e.name, x, y, size, C.ink, hexA(col, 0.22), a);
      hits.set(e.id, { x: x - size / 2, y: y - size / 2, w: size, h: size });
      if (hl > 0.01) ring(ctx, x, y, size * 0.62, hl, now, col);
      return;
    }
    const label = e.text;
    if (e.glyph) {
      const r = 46 * s;
      bloom(ctx, col, x, y, r * 2.4, 0.28 * a * (1 + hl));
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = "rgba(18,22,32,.96)"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hexA(col, 0.14); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      drawGlyph(ctx, e.glyph, x, y, 62 * s, C.ink, hexA(col, 0.35), a);
      const above = P(e.id)?.lab === "above";
      const lines = wrap(api, ctx, label, 230, { size: 38, weight: 600 }, 2), lh = 44, bh = lines.length * lh + (e.sub ? 46 : 0);
      const ly0 = above ? y - r - 14 - bh : y + r + 12;
      lines.forEach((ln, li) => api.text(ctx, ln, x, ly0 + lh * (li + 0.5), { size: 38, weight: 600, color: C.ink, align: "center", baseline: "middle", alpha: a, maxWidth: 236 }));
      if (e.sub) api.text(ctx, e.sub, x, ly0 + lines.length * lh + 22, { size: 38, color: C.ink3, align: "center", baseline: "middle", alpha: a, maxWidth: 240 });
      const top = Math.min(y - r - 8, ly0), bottom = Math.max(y + r + 8, ly0 + bh);
      hits.set(e.id, { x: x - 112, y: top, w: 224, h: bottom - top });
      if (hl > 0.01) ring(ctx, x, y, r + 12, hl, now, col);
    } else {
      const lines = wrap(api, ctx, label, 250, { size: 40, weight: 700 }, 2);
      const w = Math.min(290, Math.max(...lines.map((l) => api.measure(ctx, l, { size: 40, weight: 700 }))) + 48) * s, h = (lines.length * 46 + 26) * s;
      ctx.save(); ctx.globalAlpha *= a;
      if (hl > 0.01) bloom(ctx, col, x, y, w, 0.3 * hl);
      ctx.fillStyle = "rgba(20,24,34,.96)"; roundRect(ctx, x - w / 2, y - h / 2, w, h, 20); ctx.fill();
      ctx.fillStyle = hexA(col, 0.12); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      lines.forEach((l, i) => api.text(ctx, l, x, y - (lines.length - 1) * 23 + i * 46, { size: 40 * Math.max(1, s * 0.95), weight: 700, align: "center", baseline: "middle", alpha: a, maxWidth: 280 }));
      if (e.sub) api.text(ctx, e.sub, x, y + h / 2 + 30, { size: 38, color: C.ink3, align: "center", baseline: "middle", alpha: a, maxWidth: 280 });
      hits.set(e.id, { x: x - w / 2, y: y - h / 2, w, h: h + (e.sub ? 50 : 0) });
      if (hl > 0.01) ringBox(ctx, x - w / 2, y - h / 2, w, h, hl, now, col);
    }
  }
  function ring(ctx: Ctx, x: number, y: number, r: number, hl: number, now: number, col: string) {
    ctx.save(); ctx.globalAlpha *= hl; ctx.strokeStyle = col; ctx.lineWidth = 4;
    const p = 0.5 + 0.5 * Math.sin(now * 5); ctx.beginPath(); ctx.arc(x, y, r + 6 * p, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha *= 0.4; ctx.beginPath(); ctx.arc(x, y, r + 16 + 10 * p, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  function ringBox(ctx: Ctx, x: number, y: number, w: number, h: number, hl: number, now: number, col: string) {
    const p = 0.5 + 0.5 * Math.sin(now * 5);
    ctx.save(); ctx.globalAlpha *= hl; ctx.strokeStyle = col; ctx.lineWidth = 4; roundRect(ctx, x - 6 - 4 * p, y - 6 - 4 * p, w + 12 + 8 * p, h + 12 + 8 * p, 24); ctx.stroke(); ctx.restore();
  }
  function nodeRadius(id: string): number {
    const e = els.get(id)?.el;
    if (e && e.type === "node" && e.glyph) return 46 * V(`${id}.s`) + 8;
    if (e && e.type === "glyph") return ((e.size ?? 160) * V(`${id}.s`)) / 2 + 6;
    const b = hits.get(id); if (!b) return 50; return Math.min(b.w, b.h * 1.6) / 2 + 8;
  }
  function drawArrow(ctx: Ctx, e: Extract<SceneEl, { type: "arrow" }>, a: number, f: number, now: number) {
    const A = { x: V(`${e.from}.x`), y: V(`${e.from}.y`) }, B = { x: V(`${e.to}.x`), y: V(`${e.to}.y`) };
    if (V(`${e.from}.a`) < 0.05 || V(`${e.to}.a`) < 0.05) a = Math.min(a, Math.min(V(`${e.from}.a`), V(`${e.to}.a`)));
    if (a <= 0.01) return;
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const ra = nodeRadius(e.from), rb = nodeRadius(e.to);
    const x0 = A.x + ux * ra, y0 = A.y + uy * ra, x1 = B.x - ux * rb, y1 = B.y - uy * rb;
    const bend = (e.bend ?? 0) * 90, mx = (x0 + x1) / 2 - uy * bend, my = (y0 + y1) / 2 + ux * bend;
    const pt = (k: number): XY => [lerp(lerp(x0, mx, k), lerp(mx, x1, k), k), lerp(lerp(y0, my, k), lerp(my, y1, k), k)];
    const k = clamp(a, 0, 1);
    ctx.save(); ctx.strokeStyle = hexA(C.ink, 0.75); ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x0, y0);
    for (let i = 1; i <= 24; i++) { const [px, py] = pt((i / 24) * k); ctx.lineTo(px, py); }
    ctx.stroke();
    if (k > 0.96) {
      const [ex, ey] = pt(1), [bx, by] = pt(0.92), ang = Math.atan2(ey - by, ex - bx);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(ang - 0.45) * 20, ey - Math.sin(ang - 0.45) * 20); ctx.lineTo(ex - Math.cos(ang + 0.45) * 20, ey - Math.sin(ang + 0.45) * 20); ctx.closePath(); ctx.fill();
    }
    if (f > 0.01 && k > 0.9) {
      for (let i = 0; i < 6; i++) { const u = ((now * 0.45 * (0.6 + f) + i / 6) % 1); const [px, py] = pt(u); bloom(ctx, accent, px, py, 16, 0.9 * f); ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.9 * f; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    }
    ctx.restore();
    if (e.text && k > 0.85) {
      const [lx, ly] = pt(0.5), o = { size: 38, weight: 600 } as const, wpx = api.measure(ctx, e.text, o) + 24, hpx = 50;
      let tx = lx, ty = ly;
      const lay = spec.scenes[els.get(e.id)!.scene].layout;
      if (lay === "cycle" && Math.abs(uy) < 0.3) {   // horizontal edge of the loop: outside (top edge above, bottom edge below)
        ty = ly + (ly < 343 ? -1 : 1) * (hpx / 2 + 12);
      } else if (lay === "cycle") {        // other edges: toward the loop's centre (the outside belongs to node labels)
        const cxs = 500, cys = 343, vx = cxs - lx, vy = cys - ly, vd = Math.hypot(vx, vy) || 1;
        const reach = Math.abs(vx / vd) * (wpx / 2) + Math.abs(vy / vd) * (hpx / 2) + 12;
        tx = lx + (vx / vd) * reach; ty = ly + (vy / vd) * reach;
      } else {                             // above the line (or beside a near-vertical one)
        if (Math.abs(uy) > 0.85) tx = lx + wpx / 2 + 14; else ty = ly - hpx / 2 - 12;
      }
      tx = clamp(tx, 80 + wpx / 2, 920 - wpx / 2);
      const al = (k - 0.85) / 0.15;
      ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = "rgba(10,12,18,.86)"; roundRect(ctx, tx - wpx / 2, ty - hpx / 2, wpx, hpx, 12); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      api.text(ctx, e.text, tx, ty + 1, { ...o, color: C.ink2, align: "center", baseline: "middle", alpha: al });
    }
  }
  function drawDiag(ctx: Ctx, e: SceneEl, box: Box, a: number, now: number) {
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    switch (e.type) {
      case "title": {
        const lines = wrap(api, ctx, e.text, 820, { font: "display", size: 72, weight: 800 }, 2);
        lines.forEach((l, i) => { const k = clamp(a * 1.4 - i * 0.25, 0, 1); api.text(ctx, l, cx, cy - (lines.length - 1) * 42 + i * 84 + (1 - ease.outCubic(k)) * 24, { font: "display", size: 72, weight: 800, align: "center", baseline: "middle", alpha: k, maxWidth: 860, track: -2 }); });
        ctx.save(); ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.globalAlpha *= a; const lw = 240 * ease.outCubic(a); ctx.beginPath(); ctx.moveTo(cx - lw / 2, cy + lines.length * 42 + 14); ctx.lineTo(cx + lw / 2, cy + lines.length * 42 + 14); ctx.stroke(); ctx.restore();
        break;
      }
      case "label": textBlock(api, ctx, e.text, cx, cy, Math.min(860, box.w), { size: 40, weight: 600, color: e.color ? ACC[e.color] : C.ink2, alpha: a }, 2); break;
      case "myth": {
        const bust = V(`${e.id}.bust`), w = Math.min(700, box.w), h = Math.min(190, box.h), sh = bust > 0 && bust < 0.35 ? Math.sin(now * 60) * 6 * (1 - bust / 0.35) : 0;
        if (bust > 0.5 && !bustFired.has(e.id) && !api.reducedMotion && sh === 0) { bustFired.add(e.id); api.fx.burst(cx, cy, { n: 26, color: C.amber, speed: 360, life: 0.8, size: 12, shard: true, gravity: 500 }); sfx.blip({ f: 260, f2: 120, dur: 0.25, gain: 0.16 }); api.fx.shake(4, 0.2); }
        ctx.save(); ctx.globalAlpha *= a * (bust > 0.6 ? 1 - (bust - 0.6) * 0.9 : 1); ctx.translate(cx + sh, cy); ctx.rotate(bust > 0.6 ? (bust - 0.6) * -0.08 : 0);
        ctx.fillStyle = "rgba(30,24,18,.95)"; roundRect(ctx, -w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.strokeStyle = hexA(C.amber, 0.8); ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.stroke(); ctx.setLineDash([]);
        api.text(ctx, T.myth, 0, -h / 2 + 40, { font: "mono", size: 38, weight: 600, color: C.amber, align: "center", baseline: "middle", track: 6 });
        textBlock(api, ctx, e.text, 0, 22, w - 60, { size: 40, weight: 600, color: C.ink }, 2);
        if (bust > 0.3) { ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.lineCap = "round"; const k = clamp((bust - 0.3) / 0.3, 0, 1); ctx.beginPath(); ctx.moveTo(-w / 2 + 30, 18); ctx.lineTo(-w / 2 + 30 + (w - 60) * k, 30); ctx.stroke(); }
        ctx.restore();
        if (bust > 0.62) { const k = ease.outBack(clamp((bust - 0.62) / 0.25, 0, 1)); ctx.save(); ctx.translate(cx + w * 0.28, cy - h * 0.42); ctx.rotate(-0.12); ctx.scale(k, k); const tw = api.measure(ctx, T.busted, { font: "mono", size: 40, weight: 600 }) + 40; ctx.fillStyle = "rgba(10,12,18,.9)"; roundRect(ctx, -tw / 2, -32, tw, 64, 14); ctx.fill(); ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.stroke(); api.text(ctx, T.busted, 0, 2, { font: "mono", size: 40, weight: 600, color: C.amber, align: "center", baseline: "middle", track: 3 }); ctx.restore(); magnifier(ctx, cx - w / 2 + 34, cy - h / 2 + 30, C.amber, 0.9); }
        hits.set(e.id, { x: cx - w / 2, y: cy - h / 2, w, h });
        break;
      }
      case "axis": {
        const g = axisGeom(e.id)!; const k = ease.inOutCubic(clamp(a, 0, 1));
        ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(g.x0, g.y); ctx.lineTo(g.x0 + (g.x1 - g.x0) * k, g.y); ctx.stroke();
        const n = Math.round((e.max - e.min) / e.step), crosses = e.scale === "year" && e.min < 0 && e.max > 0;
        const lab = (v: number) => (e.scale === "year" ? yearLabel(v, crosses) : fmtNum(v, Math.abs(e.step) < 1 ? (Math.abs(e.step) < 0.1 ? 2 : 1) : 0));
        const maxW = Math.max(...Array.from({ length: n + 1 }, (_, i) => api.measure(ctx, lab(e.min + i * e.step), { font: "mono", size: 38 })));
        const every = Math.max(1, Math.ceil((maxW + 18) / ((g.x1 - g.x0) / Math.max(1, n))));
        for (let i = 0; i <= n; i++) {
          const v = e.min + i * e.step, x = g.X(v); if (x > g.x0 + (g.x1 - g.x0) * k + 1) break;
          const big = i % every === 0 || i === n;
          ctx.strokeStyle = big ? C.ink : C.ink3; ctx.lineWidth = big ? 5 : 3; ctx.beginPath(); ctx.moveTo(x, g.y - (big ? 18 : 10)); ctx.lineTo(x, g.y + (big ? 18 : 10)); ctx.stroke();
          if (big && (i % every === 0)) api.text(ctx, lab(v), x, g.y + 50, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
        }
        if (e.unit && k > 0.95) api.text(ctx, e.unit, g.x1 + 4, g.y - 40, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "right", baseline: "middle" });
        ctx.restore();
        hits.set(e.id, { x: g.x0 - 20, y: g.y - 60, w: g.x1 - g.x0 + 40, h: 120 });
        break;
      }
      case "bar": {
        const w = Math.min(e.w ?? 620, box.w - 40) * ease.outCubic(clamp(a, 0, 1)), h = Math.min(96, box.h * 0.55), x0 = cx - Math.min(e.w ?? 620, box.w - 40) / 2, y0 = cy - h / 2 - (e.text ? 22 : 0);
        const shv = V(`${e.id}.sh`), pw = Math.min(e.w ?? 620, box.w - 40) / e.parts;
        ctx.save(); ctx.globalAlpha *= Math.min(1, a * 2);
        ctx.fillStyle = "rgba(18,22,32,.95)"; roundRect(ctx, x0, y0, w, h, 12); ctx.fill();
        for (let i = 0; i < e.parts; i++) { const s = clamp(shv - i, 0, 1); if (s > 0 && x0 + pw * i < x0 + w) { ctx.fillStyle = hexA(accent, 0.75); ctx.fillRect(x0 + pw * i + 3, y0 + 3, Math.min(pw - 6, w - pw * i - 6) * s, h - 6); } }
        ctx.strokeStyle = C.ink; ctx.lineWidth = 4; roundRect(ctx, x0, y0, w, h, 12); ctx.stroke();
        ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; for (let i = 1; i < e.parts; i++) { const x = x0 + pw * i; if (x < x0 + w) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke(); } }
        ctx.restore();
        if (e.text) api.text(ctx, e.text, cx, y0 + h + 44, { font: "mono", size: 40, weight: 600, color: C.ink, align: "center", baseline: "middle", alpha: a });
        hits.set(e.id, { x: x0, y: y0, w: pw * e.parts, h });
        break;
      }
      case "bars": {
        const n = e.values.length, max = Math.max(1e-9, ...e.values), bw = Math.min(110, (box.w - 80) / n), x0 = cx - (bw * n) / 2, base = box.y + box.h - 58, hmax = Math.max(60, box.h - 130);
        ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.globalAlpha *= a; ctx.beginPath(); ctx.moveTo(x0 - 16, base); ctx.lineTo(x0 + bw * n + 16, base); ctx.stroke(); ctx.restore();
        e.values.forEach((v, i) => {
          const k = ease.outCubic(clamp(a * 1.6 - i * 0.12, 0, 1)), hh = (v / max) * hmax * k, x = x0 + i * bw + bw * 0.16;
          ctx.save(); ctx.globalAlpha *= Math.min(1, a * 2); ctx.fillStyle = hexA(accent, 0.8); roundRect(ctx, x, base - hh, bw * 0.68, hh, 8); ctx.fill(); ctx.restore();
          if (k > 0.9) api.text(ctx, fmtNum(v, v % 1 ? 1 : 0), x + bw * 0.34, base - hh - 26, { font: "mono", size: 38, weight: 600, align: "center", baseline: "middle", alpha: a });
          api.text(ctx, e.labels[i], x + bw * 0.34, base + 30, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", alpha: a, maxWidth: bw + 6 });
        });
        break;
      }
      case "grid": {
        const cell = Math.min(46, (box.w - 60) / e.cols, (box.h - 30) / e.rows), gw = cell * e.cols, gh = cell * e.rows, x0 = cx - gw / 2, y0 = cy - gh / 2, shv = V(`${e.id}.sh`);
        ctx.save(); ctx.globalAlpha *= Math.min(1, a * 1.5);
        for (let i = 0; i < e.cols * e.rows; i++) { const s = clamp(shv - i, 0, 1), gx = x0 + (i % e.cols) * cell, gy = y0 + Math.floor(i / e.cols) * cell; ctx.fillStyle = s > 0 ? hexA(accent, 0.25 + 0.5 * s) : "rgba(255,255,255,.03)"; ctx.fillRect(gx + 2, gy + 2, cell - 4, cell - 4); }
        ctx.strokeStyle = C.ink2; ctx.lineWidth = 2; for (let i = 0; i <= e.cols; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * cell, y0); ctx.lineTo(x0 + i * cell, y0 + gh * clamp(a, 0, 1)); ctx.stroke(); } for (let j = 0; j <= e.rows; j++) { ctx.beginPath(); ctx.moveTo(x0, y0 + j * cell); ctx.lineTo(x0 + gw * clamp(a, 0, 1), y0 + j * cell); ctx.stroke(); }
        ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, gw, gh); ctx.restore();
        hits.set(e.id, { x: x0, y: y0, w: gw, h: gh });
        break;
      }
      case "angle": {
        const r = Math.min(e.r ?? 170, box.h * 0.8), vx = e.x !== undefined ? clamp(e.x, 120, 880) : cx - r * 0.35, vy = e.y !== undefined ? clamp(e.y, 220, 500) : box.y + box.h * 0.8;
        const rot = ((e.rot ?? 0) * Math.PI) / 180, sweep = ((e.deg * Math.PI) / 180) * ease.inOutCubic(clamp(a, 0, 1));
        ctx.save(); ctx.lineCap = "round"; ctx.globalAlpha *= Math.min(1, a * 3);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + Math.cos(-rot) * r, vy + Math.sin(-rot) * r); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + Math.cos(-rot - sweep) * r, vy + Math.sin(-rot - sweep) * r); ctx.stroke();
        ctx.fillStyle = hexA(accent, 0.2); ctx.beginPath(); ctx.moveTo(vx, vy); ctx.arc(vx, vy, r * 0.42, -rot, -rot - sweep, true); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(vx, vy, r * 0.42, -rot, -rot - sweep, true); ctx.stroke();
        if (Math.abs(e.deg - 90) < 0.01 && a > 0.9) { ctx.strokeStyle = accent; ctx.lineWidth = 4; const q = 26; ctx.beginPath(); ctx.moveTo(vx + Math.cos(-rot) * q, vy + Math.sin(-rot) * q); ctx.lineTo(vx + Math.cos(-rot) * q + Math.cos(-rot - Math.PI / 2) * q, vy + Math.sin(-rot) * q + Math.sin(-rot - Math.PI / 2) * q); ctx.lineTo(vx + Math.cos(-rot - Math.PI / 2) * q, vy + Math.sin(-rot - Math.PI / 2) * q); ctx.stroke(); }
        ctx.restore();
        const mid = -rot - sweep / 2;
        if (a > 0.6) api.text(ctx, `${Math.round((e.deg * clamp(a, 0, 1)))}°`, vx + Math.cos(mid) * (r * 0.42 + 56), vy + Math.sin(mid) * (r * 0.42 + 56), { font: "display", size: 48, weight: 800, color: accent, align: "center", baseline: "middle", alpha: (a - 0.6) / 0.4 });
        hits.set(e.id, { x: vx - 30, y: vy - r, w: r + 60, h: r + 30 });
        break;
      }
      case "poly": {
        const pts = e.points, k = clamp(a, 0, 1), segs = e.closed ? pts.length : pts.length - 1;
        ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineJoin = "round"; ctx.lineCap = "round";
        if (e.closed && k > 0.98) { ctx.fillStyle = hexA(accent, 0.18); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        const upto = k * segs;
        for (let i = 0; i < segs; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], u = clamp(upto - i, 0, 1); if (u <= 0) break; ctx.lineTo(lerp(ax, bx, u), lerp(ay, by, u)); }
        ctx.stroke();
        ctx.fillStyle = accent; for (const [x, y] of pts) { ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        break;
      }
      case "counter": {
        const c = V(`${e.id}.c`), v = lerp(e.from, e.to, c), s = fmtNum(v, e.decimals);
        const size = s.length > 9 ? 64 : 96;
        api.text(ctx, s, cx, cy - (e.unit ? 16 : 0), { font: "display", size, weight: 800, align: "center", baseline: "middle", alpha: a, glow: accent, track: -2 });
        if (e.unit) api.text(ctx, e.unit, cx, cy + size * 0.55, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", alpha: a });
        break;
      }
      case "quote": {
        const words = e.text.split(/\s+/), size = 46, o = { font: "display" as const, size, weight: 700 };
        const lines: number[][] = [[]]; let lw = 0; const maxW = Math.min(860, box.w - 20), sp = api.measure(ctx, " ", o);
        words.forEach((w, i) => { const ww = api.measure(ctx, w, o); if (lines[lines.length - 1].length && lw + sp + ww > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push(i); lw += (lw ? sp : 0) + ww; });
        const lh = 64, y0 = cy - ((lines.length - 1) * lh) / 2;
        let wi = 0;
        lines.forEach((ln, li) => {
          const total = ln.reduce((acc, i) => acc + api.measure(ctx, words[i], o), 0) + sp * (ln.length - 1); let x = cx - total / 2;
          for (const i of ln) {
            const ww = api.measure(ctx, words[i], o), k = clamp(a * (words.length + 2) / 1.0 - wi * 0.7, 0, 1), h1 = e.hi.includes(i), h2 = e.hi2.includes(i), col = h1 ? accent : h2 ? C.amber : C.ink;
            if ((h1 || h2) && a > 0.95) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y0 + li * lh + 30); ctx.lineTo(x + ww, y0 + li * lh + 30); ctx.stroke(); ctx.restore(); }
            api.text(ctx, words[i], x, y0 + li * lh + (1 - k) * 14, { ...o, color: col, baseline: "middle", alpha: k });
            x += ww + sp; wi++;
          }
        });
        break;
      }
      case "meter": {
        const syl = matraWeights(e.text), n = syl.length, bw = Math.min(70, (box.w - 40) / Math.max(1, n)), x0 = cx - (bw * n) / 2;
        let total = 0;
        syl.forEach((s, i) => {
          const k = clamp(a * (n + 3) - i, 0, 1); if (k <= 0) return; total += s.w;
          const x = x0 + i * bw + bw / 2;
          ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = s.w === 2 ? hexA(accent, 0.22) : "rgba(255,255,255,.05)"; roundRect(ctx, x - bw / 2 + 3, cy - 56, bw - 6, 80, 10); ctx.fill(); ctx.restore();
          api.text(ctx, s.syl, x, cy - 16, { font: "ui", size: Math.min(44, bw * 0.75 + 8), weight: 600, align: "center", baseline: "middle", alpha: k, decor: bw * 0.75 + 8 < 38 });
          api.text(ctx, s.w === 2 ? "ऽ" : "।", x, cy + 52, { font: "ui", size: 40, weight: 700, color: s.w === 2 ? accent : C.ink2, align: "center", baseline: "middle", alpha: k });
        });
        if (a > 0.05) api.text(ctx, `= ${total}`, x0 + bw * n + 16, cy - 16, { font: "display", size: 52, weight: 800, color: accent, baseline: "middle", alpha: Math.min(1, a * 2) });
        break;
      }
      case "particles": {
        const w = e.w ?? Math.min(560, box.w - 40), h = e.h ?? Math.min(240, box.h - 20), x0 = (e.x ?? cx) - w / 2, y0 = (e.y ?? cy) - h / 2, col = e.color ? ACC[e.color] : accent;
        const r = rng(e.n * 7 + 3), t = sh.head.t + (sh.interactive ? sh.liveT : 0);
        ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.line2; ctx.lineWidth = 2; roundRect(ctx, x0, y0, w, h, 16); ctx.stroke();
        const tri = (u: number) => { const f = u - Math.floor(u); return f < 0.5 ? f * 2 : 2 - f * 2; };
        const cols = Math.ceil(Math.sqrt(e.n * (w / h)));
        for (let i = 0; i < e.n; i++) {
          let x = 0, y = 0; const rx = r(), ry = r(), sp = 0.08 + r() * 0.12, ph = r();
          if (e.mode === "solid") { const gx = i % cols, gy = Math.floor(i / cols), cell = w / cols; x = x0 + (gx + 0.5) * cell + Math.sin(t * 9 + i) * 2.5; y = y0 + h - (gy + 0.5) * cell + Math.cos(t * 8 + i * 1.3) * 2.5; if (y < y0) continue; }
          else if (e.mode === "liquid") { x = x0 + 8 + tri(rx + t * sp * 0.6) * (w - 16); y = y0 + h * 0.45 + 8 + tri(ry + t * sp * 0.4) * (h * 0.55 - 16); }
          else if (e.mode === "gas") { x = x0 + 8 + tri(rx + t * sp * 2.2) * (w - 16); y = y0 + 8 + tri(ry + t * sp * 1.9) * (h - 16); }
          else if (e.mode === "flow") { x = x0 + ((rx + t * sp) % 1) * w; y = y0 + 10 + ry * (h - 20) + Math.sin(t * 2 + i) * 4; }
          else if (e.mode === "rise") { const u = (ph + t * sp) % 1; x = x0 + rx * w + Math.sin(u * 9 + i) * 8; y = y0 + h - u * h; ctx.globalAlpha = a * (1 - u); }
          else if (e.mode === "fall") { const u = (ph + t * sp * 1.6) % 1; x = x0 + rx * w; y = y0 + u * h; }
          else { const ang = t * (0.5 + sp * 3) + i * 2.4, rr2 = 20 + ry * (Math.min(w, h) / 2 - 24); x = x0 + w / 2 + Math.cos(ang) * rr2; y = y0 + h / 2 + Math.sin(ang) * rr2 * 0.8; }
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
          if (e.mode === "rise") ctx.globalAlpha = a;
        }
        ctx.restore();
        hits.set(e.id, { x: x0, y: y0, w, h });
        break;
      }
      default: break;
    }
  }
  // ── per-frame
  function paintBg(g: Ctx) { backdrop(g, accent, 5, 50); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    dust(ctx, now, 30, "#C9D2F2", 13);
    if (!fontOk) return;
    hits.clear();
    const z = V("cam.zoom"), camx = V("cam.x"), camy = V("cam.y"), dim = V("dim");
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    ctx.save(); ctx.translate(500, 312); ctx.scale(z, z); ctx.translate(-camx, -camy);
    spec.scenes.forEach((sc, si) => {
      const sa = V(`S${si}.a`);
      if (sa <= 0.01) return;
      ctx.save(); ctx.globalAlpha = sa;
      const dolly = 1 + (1 - sa) * 0.04; ctx.translate(500, 312); ctx.scale(dolly, dolly); ctx.translate(-500, -312);
      const lay = lays[si];
      const alphaOf = (id: string) => { const a = V(`${id}.a`); return dim > 0.01 ? a * lerp(1, V(`${id}.fo`) > 0.5 ? 1 : 0.22, dim) : a; };
      for (const e of sc.els) if (DIAG.has(e.type)) { const a = alphaOf(e.id); const p = lay.get(e.id); if (a > 0.01 && p?.box) { drawDiag(ctx, e, p.box, a, now); const hl = V(`${e.id}.hl`); const hb = hits.get(e.id); if (hl > 0.01 && hb) ringBox(ctx, hb.x, hb.y, hb.w, hb.h, hl, now, accent); } }
      for (const e of sc.els) if (e.type === "arrow") drawArrow(ctx, e, alphaOf(e.id), V(`${e.id}.f`), now);
      for (const e of sc.els) if (e.type === "mark") {
        const a = alphaOf(e.id); if (a <= 0.01) continue;
        const g = axisGeom(e.axis); if (!g) continue;
        const ix = sc.els.filter((x) => x.type === "mark").indexOf(e), up = ix % 2 === 0 ? 0 : 58, x = g.X(e.value), col = e.color ? ACC[e.color] : accent, k = ease.outBack(clamp(a, 0, 1));
        ctx.save(); ctx.globalAlpha *= Math.min(1, a * 1.5); bloom(ctx, col, x, g.y, 40, 0.5); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, g.y - 14); ctx.lineTo(x - 14 * k, g.y - 40); ctx.lineTo(x + 14 * k, g.y - 40); ctx.closePath(); ctx.fill(); ctx.restore();
        const lbl = e.text ?? fmtNum(e.value, e.value % 1 ? 2 : 0);
        api.text(ctx, lbl, clamp(x, 120, 880), g.y - 70 - up, { font: "mono", size: 38, weight: 600, color: col, align: "center", baseline: "middle", alpha: a });
        hits.set(e.id, { x: x - 50, y: g.y - 100 - up, w: 100, h: 100 + up });
      }
      for (const e of sc.els) if (ITEM.has(e.type)) {
        const a = alphaOf(e.id); if (a <= 0.01) continue;
        const k = ease.outBack(clamp(V(`${e.id}.a`) * 1.15, 0, 1)), s = V(`${e.id}.s`) * (0.7 + 0.3 * k);
        drawNode(ctx, e as Extract<SceneEl, { type: "node" | "glyph" }>, V(`${e.id}.x`), V(`${e.id}.y`), a, s, V(`${e.id}.hl`), now);
      }
      if (lay && si === lastScene && live.task) drawTask(ctx, now);
      ctx.restore();
    });
    ctx.restore();
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
  }
  // ── the hands-on ending
  function startTask() {
    if (live.task) return;
    live.task = true; sfx.blip({ f: 330, f2: 660, dur: 0.25, type: "triangle", gain: 0.12 });
    api.task(T.yourTurn, task.prompt);
    if (task.kind === "place") { const ax = axisOf(task.axis)!; live.marker = (ax.min + ax.max) / 2; }
    api.event("task_start", { kind: task.kind });
  }
  function drawTask(ctx: Ctx, now: number) {
    if (task.kind === "tap") {
      for (const id of task.options) {
        const b = hits.get(id); if (!b) continue;
        if (!live.answered) { const p = 0.5 + 0.5 * Math.sin(now * 4 + id.length); ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 3; ctx.globalAlpha = 0.35 + 0.4 * p; roundRect(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 22); ctx.stroke(); ctx.restore(); }
        else if (id === task.answer) { ctx.save(); ctx.strokeStyle = C.mint; ctx.lineWidth = 5; roundRect(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 22); ctx.stroke(); ctx.restore(); tick(ctx, b.x + b.w + 4, b.y + 6, C.mint, 0.9); }
        else if (id === live.chosen) { ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); roundRect(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 22); ctx.stroke(); ctx.restore(); magnifier(ctx, b.x + b.w + 2, b.y + 8, C.amber, 0.85); }
      }
    } else if (task.kind === "order") {
      task.items.forEach((id) => {
        const b = hits.get(id); if (!b) return;
        const k = live.order.indexOf(id);
        if (k < 0 && !live.answered) { const p = 0.5 + 0.5 * Math.sin(now * 4 + id.length); ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 3; ctx.globalAlpha = 0.35 + 0.4 * p; roundRect(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 22); ctx.stroke(); ctx.restore(); }
        if (k >= 0) {
          const ok = live.answered ? task.items[k] === id : null, col = ok === null ? C.volt : ok ? C.mint : C.amber;
          ctx.save(); ctx.fillStyle = "rgba(10,12,18,.95)"; ctx.beginPath(); ctx.arc(b.x + 4, b.y + 4, 30, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
          api.text(ctx, String(k + 1), b.x + 4, b.y + 6, { font: "display", size: 40, weight: 800, color: col, align: "center", baseline: "middle" });
        }
        if (live.answered && live.verdict !== "right") { const want = task.items.indexOf(id); api.text(ctx, `→ ${want + 1}`, b.x + b.w - 6, b.y + 6, { font: "mono", size: 38, weight: 600, color: C.ion, align: "right", baseline: "middle", alpha: clamp(live.revealT * 2, 0, 1) }); }
      });
    } else if (task.kind === "place") {
      const g = axisGeom(task.axis); if (!g || live.marker == null) return;
      const x = g.X(live.marker), col = live.answered ? (live.verdict === "right" ? C.mint : C.amber) : live.dragging ? C.volt : C.ink;
      ctx.save(); bloom(ctx, col, x, g.y, 60, 0.5); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, g.y - 70); ctx.lineTo(x, g.y + 26); ctx.stroke();
      ctx.fillStyle = "rgba(14,17,25,.96)"; ctx.beginPath(); ctx.arc(x, g.y - 92, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      if (!live.answered) { const p = 0.5 + 0.5 * Math.sin(now * 4); ctx.save(); ctx.strokeStyle = C.volt; ctx.globalAlpha = 0.4 + 0.4 * p; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, g.y - 92, 36 + 4 * p, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      if (live.answered) {
        const tx = g.X(task.answer), k = clamp(live.revealT * 2, 0, 1);
        ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = C.ion; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(tx, g.y - 120); ctx.lineTo(tx, g.y + 20); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        const lab = fmtNum(task.answer, task.answer % 1 ? 2 : 0);
        api.text(ctx, lab, clamp(tx, 130, 870), g.y - 142, { font: "mono", size: 40, weight: 600, color: C.ion, align: "center", baseline: "middle", alpha: k });
      }
    }
  }
  function grade(value: unknown, local: string) {
    if (live.answered) return;
    live.answered = true; live.revealT = 0;
    const g = api.answer("task", value, local);
    live.verdict = g.verdict;
    const ok = g.verdict === "right";
    if (ok) { api.fx.flash(C.mint, 0.12); sfx.blip({ f: 523, f2: 1046, dur: 0.22, type: "triangle", gain: 0.2 }); api.hitstop(60); }
    else sfx.blip({ f: 240, f2: 150, dur: 0.24, gain: 0.16 });
    api.task("", ok ? T.right : T.look, ok ? "done" : "warn");
    const b = task.kind === "tap" ? hits.get(task.answer) : null;
    if (b && ok) { api.fx.burst(b.x + b.w / 2, b.y + b.h / 2, { n: 30, color: C.mint, speed: 420, life: 0.7, size: 10 }); api.fx.ring(b.x + b.w / 2, b.y + b.h / 2, { color: C.mint, r0: 20, r1: 140, life: 0.6 }); }
    api.facts({ task: task.kind, verdict: g.verdict });
    sh.later(2200, () => { if (!live.doneSent) { live.doneSent = true; api.done({ verdict: g.verdict }); } });
  }
  const hitAt = (x: number, y: number, ids: string[]) => ids.find((id) => { const b = hits.get(id); return !!b && x >= b.x - 18 && x <= b.x + b.w + 18 && y >= b.y - 18 && y <= b.y + b.h + 18; }) ?? null;
  api.onPointer({
    down(p) {
      if (sh.tapToPlay()) return;
      if (!live.task || live.answered) return;
      if (task.kind === "tap") { const id = hitAt(p.x, p.y, task.options); if (id) { live.chosen = id; grade(id, id === task.answer ? "right" : "wrong"); } }
      else if (task.kind === "order") {
        const id = hitAt(p.x, p.y, task.items); if (!id) return;
        const k = live.order.indexOf(id);
        if (k >= 0) { if (k === live.order.length - 1) live.order.pop(); return; }
        live.order.push(id); sfx.blip({ f: 400 + live.order.length * 80, dur: 0.08, type: "triangle", gain: 0.1 });
        api.record("order", { id, at: +api.now().toFixed(2) });
        if (live.order.length === task.items.length) { const right = live.order.every((x, i) => x === task.items[i]); grade([...live.order], right ? "right" : "wrong"); }
      } else if (task.kind === "place") { const g = axisGeom(task.axis); if (g && Math.abs(p.y - g.y) < 140) { live.dragging = true; const ax = axisOf(task.axis)!; live.marker = clamp(g.V(p.x), ax.min, ax.max); } }
    },
    move(p) { if (live.dragging && task.kind === "place") { const g = axisGeom(task.axis)!, ax = axisOf(task.axis)!; live.marker = clamp(g.V(p.x), ax.min, ax.max); } },
    up() { if (live.dragging && task.kind === "place" && live.marker != null) { live.dragging = false; const e = Math.abs(live.marker - task.answer); grade(+live.marker.toFixed(3), e <= task.tol ? "right" : e <= task.tol * 2.5 ? "partial" : "wrong"); } },
  });
  api.onKey((k, down) => { if (down) sh.key(k); });
  function update(dt: number) {
    if (!fontOk) return;
    const entered = sh.step(dt);
    if (entered || (sh.interactive && !live.task)) startTask();
    if (live.answered) live.revealT += dt;
  }
  function bot(): BotAction | null {
    if (!live.task) return sh.skim();
    if (live.answered) return { type: "wait", ms: 400 };
    const center = (id: string): XY | null => { const b = hits.get(id); return b ? [b.x + b.w / 2, b.y + b.h / 2] : null; };
    if (task.kind === "tap") { const id = botR() < 0.8 ? task.answer : task.options[Math.floor(botR() * task.options.length)]; const c = center(id); return c ? { type: "tap", at: c, after: 600 } : { type: "wait", ms: 300 }; }
    if (task.kind === "order") { const next = task.items[live.order.length]; const c = next ? center(next) : null; return c ? { type: "tap", at: c, after: 450 } : { type: "wait", ms: 300 }; }
    const g = axisGeom(task.axis); if (!g || live.marker == null) return { type: "wait", ms: 300 };
    const ax = axisOf(task.axis)!, target = clamp(task.answer + (botR() - 0.5) * task.tol * 2, ax.min, ax.max);
    return { type: "drag", from: [g.X(live.marker), g.y - 92], to: [g.X(target), g.y - 92], ms: 600, after: 600 };
  }
  function board(): BoardSpec {
    const last = spec.scenes[lastScene], nodes = last.els.filter((e) => e.type === "node") as Extract<SceneEl, { type: "node" }>[];
    const ax = last.els.find((e) => e.type === "axis") as Extract<SceneEl, { type: "axis" }> | undefined;
    const bar = spec.scenes.flatMap((s) => s.els).find((e) => e.type === "bar") as Extract<SceneEl, { type: "bar" }> | undefined;
    const bars = spec.scenes.flatMap((s) => s.els).find((e) => e.type === "bars") as Extract<SceneEl, { type: "bars" }> | undefined;
    const ang = spec.scenes.flatMap((s) => s.els).find((e) => e.type === "angle") as Extract<SceneEl, { type: "angle" }> | undefined;
    const figure: BoardSpec["figure"] = ax ? { kind: "numberline", min: ax.min, max: ax.max, marks: last.els.filter((e) => e.type === "mark").map((m) => ({ v: (m as { value: number }).value, label: (m as { text?: string }).text ?? String((m as { value: number }).value) })) }
      : bar ? { kind: "bar", parts: bar.parts, shaded: Array.from({ length: bar.shaded }, (_, i) => i) } : bars ? { kind: "bars", values: bars.values, labels: bars.labels }
      : ang ? { kind: "angle", deg: ang.deg } : nodes.length >= 2 && !hasDeva(nodes.map((n) => n.text).join("")) ? { kind: "chain", items: nodes.slice(0, 5).map((n) => n.text) } : { kind: "none" };
    const lines = spec.beats.slice(-3).map((b) => spec.text[b.line] ?? "").filter(Boolean).map((s) => s.split(/(?<=[.?!])\s/)[0].slice(0, 64));
    return { title: spec.title, lines: lines.slice(0, 3), figure, accent };
  }
  return {
    update, render, bot, board,
    seam: () => ({ mode: sh.head.mode, t: +sh.head.t.toFixed(2), total: +sh.tl.interactiveAt.toFixed(2), task: task.kind, answered: live.answered, verdict: live.verdict, scenes: spec.scenes.length }),
    knob: (k) => sh.knob(k, () => { live.task = false; live.answered = false; live.order = []; live.chosen = null; live.doneSent = false; api.task("", ""); }),
    dispose: () => sh.dispose(),
  };
}
export const scene: EngineDef<SceneSpec> = { archetype: "scene-explainer@1", label: "Animation · Explainer", accent: C.sci, create };
