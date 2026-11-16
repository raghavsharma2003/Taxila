// Badlaav · the 2D view (round 7, physical and chemical changes, rusting and combustion; class 7 science). Nothing here runs on
// a clock: a change runs, a solid goes in, a side of the fire triangle changes, a piece of fuel burns or a day passes only when
// the child taps, and each is shown as a beat inside busy(); the animations only show what the law has already answered.
//   nishaan / ulta: the card's changes as chips on top; the change in front of the child as a "before" and a "now" picture
//             (the now picture blank until it is run); nishaan's marks below (the kit's five signs and "nothing new"); ulta's
//             cool / warm and its three answers (it came back, the same stuff not back, a new substance).
//   ghol:     the card's solids on top; a warm tawa with no water and a glass of cold water standing on a kitchen scale (tap one
//             to put the solid there); wait and stir below. The scale's pointer moves when a solid goes into the water and
//             stays there while it dissolves.
//   trikon:   a sigri (a picture of a fire that responds; no hand is ever drawn near it) beside its fire triangle (fuel, oxygen
//             (air), heat), each side drawn full or faded as it is there or not; the wood, the lid and the fan below.
//   raakh:    the fire burning its fuel down a piece at a time, smoke rising and ash falling (the gases drawn only once the
//             child looks closely); for each thing it became, "into the air" or "left behind".
//   jang:     the iron pieces on top (each with what its card asks), a damp place and a dry place below, and the days as dots.
// After a wrong move only magnifiers mark what to look at again (never the key, never a cross). No act lights a fire.
import type { BadlaavAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Material } from "../../core/styles.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  DAYMAX, DAYS, GOES, PRODUCTS, SEEN, SIGNS, SOLIDS, STEPS, WATER,
  cardOf, changeOf, fireTools, itemAt,
  type BadState, type BadW, type BadlaavParams, type Burn, type ChangeId, type Fire, type Iron, type Place, type SolidId,
} from "./badlaav.logic.ts";

const HOLD = 1.4;   // s: the stage keeps drawing after an act (the last beat lands inside it)
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;
type Phase = "before" | "after" | "back" | "blank";

export const makeBadlaavView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<BadlaavParams, BadState, BadlaavAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const card = cardOf(p);
  let w = 360, h = 400;
  let actAt = -10, doneAt = -10, cheered = false;
  let last: { kind: string; m: string; ok: boolean; before: BadW | null } = { kind: "", m: "", ok: false, before: null };
  /** jang: the piece chosen (the next put or wipe is about it) */
  let sel = 0;
  /** ulta: the undo last tried on the change in front (its badge on the now picture) */
  let tried: { next: number; m: string } | null = null;
  let down: { x: number; y: number } | null = null;

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: BadlaavAct) => {
    const m = a.kind === "use" ? a.m : a.kind === "mark" ? a.s : a.kind === "file" ? a.bin : a.kind === "put" ? a.to : a.kind === "place" ? `${a.p}:${a.to}` : a.kind;
    last = { kind: a.kind, m, ok: false, before: { ...st().w } };
    ctl.dispatch(a); deps.changed();
  };
  function react(ms: Moment[], refused: string | undefined): void {
    actAt = api.t;
    last.ok = !refused;
    if (last.kind === "use" && !refused && (last.m === "cool" || last.m === "warm")) tried = { next: st().w.next, m: last.m };
    if (last.kind === "undo") last = { kind: "", m: "", ok: false, before: null };
    for (const m of ms) if (m.kind === "solved") { doneAt = api.t + 0.5; cheered = false; }
    // jang: a piece put somewhere; the next unplaced piece is chosen for the child
    if (goal === "jang" && !refused && last.kind === "put") { const i = st().w.where.findIndex((x) => !x); if (i >= 0) sel = i; }
    const mc = ms.some((m) => m.kind === "misconception_consequence");
    if (refused === "level_over" || refused === "ran" || refused === "placed" || refused === "looked") api.sfx("refuse");
    else if (refused || mc) { api.sfx("look"); if (!mc) api.fx.shake(2); }
    else api.sfx(last.kind === "use" || last.kind === "run" ? "drop" : last.kind === "mark" || last.kind === "file" || last.kind === "place" ? "land" : "tap");
    api.invalidate(); deps.changed();
  }
  function update(_dt: number): void {
    if (doneAt >= 0 && !cheered && api.t >= doneAt) {
      cheered = true; api.sfx("good");
      api.fx.burst(w / 2, Math.min(h * 0.3, 120), { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
      deps.changed();
    }
  }
  const busy = () => api.t - actAt < HOLD || (doneAt >= 0 && api.t - doneAt < 0.8);
  /** 0..1 along the last act's beat (reduced motion: at once) */
  const prog = (delay = 0) => (api.reduced ? 1 : ease.out(clamp((api.t - actAt - delay) / 0.7, 0, 1)));
  const fresh = () => last.ok && api.t - actAt < HOLD;

  // ── input ──
  function tap(id: string): void {
    const i = id.indexOf("-"), kind = id.slice(0, i), rest = id.slice(i + 1);
    if (kind === "mark") act({ kind: "mark", s: rest });
    else if (kind === "bin") act({ kind: "file", bin: rest });
    else if (kind === "tool") act({ kind: "use", m: rest });
    else if (kind === "station") act({ kind: "put", at: 0, to: rest });
    else if (kind === "prod") { const [pr, to] = rest.split(":"); act({ kind: "place", p: pr, to }); }
    else if (kind === "piece") { sel = Number(rest); api.sfx("select"); api.invalidate(); deps.changed(); }
    else if (kind === "place") act({ kind: "put", at: sel, to: rest });
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) { down = null; return; }
    if (kind === "down") { down = { x, y }; return; }
    if (kind === "up" && down) { const d0 = down; down = null; if (Math.hypot(x - d0.x, y - d0.y) < 14) { const id = api.hit(d0.x, d0.y); if (id) tap(id); } return; }
    if (kind === "cancel") down = null;
  }
  const dragging = () => false;

  // ── geometry and shared pieces ──
  function geo() {
    const cw = Math.min(w - 16, 620), x0 = (w - cw) / 2, gap = 8, btnH = 48, top = 8, bottom = h - 8;
    return { cw, x0, gap, btnH, top, bottom };
  }
  type G = ReturnType<typeof geo>;
  /** a button drawn on the canvas (its own tap target) */
  function button(c: Ctx, id: string, x: number, y: number, bw: number, bh: number, label: string, o: { role?: "q1" | "q2" | "q3" | "q4"; on?: boolean; dim?: boolean; look?: boolean; size?: number } = {}): void {
    const P = api.P, s = st(), role = o.role ?? "q2";
    if (!s.done && !o.dim) api.target(id, x, y, bw, bh);
    P.body(c, x, y, bw, bh, { role, r: 12, seed: id.length * 7 + Math.round(x), state: o.on ? "selected" : o.dim || s.done ? "dim" : o.look ? "look" : "idle" });
    P.textFit(c, label, x + bw / 2, y + bh / 2, bw - 10, bh - 6, { size: o.size ?? 15, on: role, weight: 800 });
    if (o.look) P.magnifier(c, x + bw - 8, y + 6, 12);
  }
  /** the card's chips on top: done items ticked, the one in front chosen, the one the last answer was about magnified */
  function strip(c: Ctx, g: G, label: (i: number) => string): number {
    const P = api.P, s = st(), n = Math.max(1, card.length), cw = (g.cw - (n - 1) * 6) / n, sh = 44;
    card.forEach((_, i) => {
      const x = g.x0 + i * (cw + 6), doneI = !!s.w.res[i];
      const state = doneI ? "good" : i === s.w.next && !s.done ? (s.why ? "look" : "selected") : "idle";
      P.body(c, x, g.top, cw, sh, { role: "panel", r: 10, seed: 60 + i, state });
      P.textFit(c, label(i), x + cw / 2, g.top + sh / 2 + 1, cw - 8, sh - 4, { size: 14, role: "ink", weight: 700 });
      if (doneI) P.tick(c, x + cw - 6, g.top + 3, 10);
    });
    return g.top + sh + g.gap;
  }
  const ellipse = (c: Ctx, x: number, y: number, rx: number, ry: number, m: Material, o: { alpha?: number; outline?: "ink" | "ink2" | "ink3" | null; width?: number } = {}) =>
    api.P.fillPath(c, (q) => q.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU), m, { outline: o.outline === undefined ? "ink2" : o.outline, width: o.width ?? 1.4, alpha: o.alpha });
  const rect = (c: Ctx, x: number, y: number, rw: number, rh: number, m: Material, o: { alpha?: number; outline?: "ink" | "ink2" | "ink3" | null } = {}) =>
    api.P.fillPath(c, (q) => q.rect(x, y, rw, rh), m, { outline: o.outline === undefined ? "ink2" : o.outline, width: 1.4, alpha: o.alpha });
  /** a bowl (its inside first, then its rim) */
  function bowl(c: Ctx, cx: number, by: number, bw: number, fill: (top: number) => void): void {
    const P = api.P, bh = bw * 0.42, top = by - bh;
    P.fillPath(c, (q) => { q.moveTo(cx - bw / 2, top); q.quadraticCurveTo(cx - bw / 2, by, cx, by); q.quadraticCurveTo(cx + bw / 2, by, cx + bw / 2, top); q.closePath(); }, "white", { outline: null, alpha: 0.55 });
    fill(top);
    P.stroke(c, Array.from({ length: 17 }, (_, i): [number, number] => { const t = i / 16; const x = lerp(cx - bw / 2, cx + bw / 2, t); return [x, top + (by - top) * (1 - Math.pow(2 * t - 1, 2))]; }), { role: "ink2", width: 2 });
    P.stroke(c, [[cx - bw / 2, top], [cx + bw / 2, top]], { role: "ink3", width: 1.2 });
  }
  /** a glass (its inside first, then its walls) */
  function glass(c: Ctx, x: number, y: number, gw: number, gh: number, level: number, m: Material, alpha = 0.7, inner?: (ly: number) => void): void {
    const P = api.P, ly = y + gh * (1 - level);
    const L = (yy: number) => x + lerp(0, gw * 0.1, (yy - y) / gh), R = (yy: number) => x + gw - lerp(0, gw * 0.1, (yy - y) / gh);
    if (level > 0) P.fillPath(c, (q) => { q.moveTo(L(ly), ly); q.lineTo(R(ly), ly); q.lineTo(R(y + gh), y + gh); q.lineTo(L(y + gh), y + gh); q.closePath(); }, m, { outline: null, alpha });
    inner?.(ly);
    P.fillPath(c, (q) => { q.moveTo(x, y); q.lineTo(x + gw, y); q.lineTo(x + gw * 0.9, y + gh); q.lineTo(x + gw * 0.1, y + gh); q.closePath(); }, "white", { outline: "ink", width: 2, alpha: 0.1 });
  }
  /** wavy lines rising (a new smell, or warmth) */
  function wisps(c: Ctx, x: number, y: number, n: number, role: "ink3" | "q1" | "q4" = "ink3", hgt = 20): void {
    for (let i = 0; i < n; i++) api.P.stroke(c, Array.from({ length: 7 }, (_, j): [number, number] => [x + (i - (n - 1) / 2) * 10 + Math.sin(j * 1.3 + i) * 3, y - j * (hgt / 6)]), { role, width: 2, alpha: 0.85 });
  }
  /** bubbles of gas */
  function bubbles(c: Ctx, x: number, y: number, bw: number, bh: number, n: number): void {
    for (let i = 0; i < n; i++) { const t = (i * 0.618) % 1, u = (i * 0.383 + 0.2) % 1; api.P.circle(c, x + t * bw, y + u * bh, 2.5 + (i % 3), { role: "ink2", width: 1.4 }); }
  }
  /** rays of heat and light */
  function rays(c: Ctx, x: number, y: number, r: number): void {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; api.P.stroke(c, [[x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62], [x + Math.cos(a) * r, y + Math.sin(a) * r]], { role: "q3", width: 2.4 }); }
  }
  /** a flame (a picture only) */
  function flame(c: Ctx, x: number, y: number, s: number): void {
    const P = api.P;
    P.fillPath(c, (q) => { q.moveTo(x, y - s); q.quadraticCurveTo(x + s * 0.55, y - s * 0.3, x + s * 0.3, y); q.quadraticCurveTo(x, y + s * 0.15, x - s * 0.3, y); q.quadraticCurveTo(x - s * 0.55, y - s * 0.3, x, y - s); q.closePath(); }, "sun", { outline: "ink3", width: 1, alpha: 0.95 });
    P.fillPath(c, (q) => { q.moveTo(x, y - s * 0.55); q.quadraticCurveTo(x + s * 0.22, y - s * 0.15, x, y - s * 0.02); q.quadraticCurveTo(x - s * 0.22, y - s * 0.15, x, y - s * 0.55); q.closePath(); }, "glow", { outline: null, alpha: 0.95 });
  }
  /** a small cool (frost lines) or warm (wavy) badge: the undo tried */
  function badge(c: Ctx, x: number, y: number, m: string): void {
    const P = api.P;
    P.circle(c, x, y, 13, { role: "panel", fill: true }); P.circle(c, x, y, 13, { role: "ink3", width: 1.2 });
    if (m === "cool") for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; P.stroke(c, [[x - Math.cos(a) * 8, y - Math.sin(a) * 8], [x + Math.cos(a) * 8, y + Math.sin(a) * 8]], { role: "q2", width: 2 }); }
    else wisps(c, x, y + 7, 2, "q4", 13);
  }

  // ── the kit's changes, drawn ──
  function changePic(c: Ctx, id: ChangeId, ph: Phase, x: number, y: number, bw: number, bh: number): void {
    const P = api.P, cx = x + bw / 2, by = y + bh * 0.86, s = Math.min(bw, bh * 1.3);
    const after = ph === "after";
    if (ph === "blank") { P.textFit(c, "?", cx, y + bh / 2, bw, bh * 0.5, { size: 36, role: "ink3", weight: 800 }); return; }
    switch (id) {
      case "ghee": case "wax": case "ice": case "freeze": {
        // solid (a block or cubes) or liquid (a pool), the same stuff either way
        const solid = id === "freeze" ? after : !after;
        const m: Material = id === "ghee" ? "oil" : id === "wax" ? "white" : solid ? "ice" : "water";
        bowl(c, cx, by, s * 0.7, (top) => {
          if (solid) {
            if (id === "ice" || id === "freeze") for (let i = 0; i < 3; i++) rect(c, cx - s * 0.2 + i * s * 0.13, top - s * 0.12 + (i % 2) * 6, s * 0.12, s * 0.12, "ice", { outline: "ink2" });
            else rect(c, cx - s * 0.15, top - s * 0.16, s * 0.3, s * 0.2, m, { outline: "ink2" });
          } else ellipse(c, cx, top + s * 0.05, s * 0.3, s * 0.06, m, { alpha: 0.85 });
        });
        return;
      }
      case "paper": {
        if (!after) { rect(c, cx - s * 0.22, by - s * 0.5, s * 0.44, s * 0.46, "paper"); for (let i = 1; i < 4; i++) P.stroke(c, [[cx - s * 0.16, by - s * 0.5 + i * s * 0.1], [cx + s * 0.16, by - s * 0.5 + i * s * 0.1]], { role: "ink3", width: 1 }); return; }
        const piece = (dx: number, dy: number, a: number) => P.fillPath(c, (q) => { q.moveTo(cx + dx, by - s * 0.48 + dy); q.lineTo(cx + dx + s * 0.18, by - s * 0.46 + dy + a); q.lineTo(cx + dx + s * 0.14, by - s * 0.3 + dy); q.lineTo(cx + dx + s * 0.19, by - s * 0.06 + dy); q.lineTo(cx + dx, by - s * 0.04 + dy); q.closePath(); }, "paper", { outline: "ink2", width: 1.4 });
        piece(-s * 0.3, 4, 4); piece(-s * 0.08, -2, -3); piece(s * 0.14, 6, 2);
        return;
      }
      case "wick": {
        // a diya already burning (no hand near it): its wick shorter and its heat and light drawn once it has burnt on
        P.fillPath(c, (q) => { q.moveTo(cx - s * 0.3, by - s * 0.14); q.quadraticCurveTo(cx, by + s * 0.06, cx + s * 0.3, by - s * 0.14); q.closePath(); }, "clay", { outline: "ink2", width: 1.4 });
        const wl = after ? s * 0.06 : s * 0.14;
        P.stroke(c, [[cx + s * 0.16, by - s * 0.14], [cx + s * 0.2, by - s * 0.14 - wl]], { role: "ink", width: 3 });
        const fx = cx + s * 0.2, fy = by - s * 0.15 - wl;
        if (after) rays(c, fx, fy - s * 0.12, s * 0.3);
        flame(c, fx, fy, s * 0.18);
        return;
      }
      case "curd": {
        glass(c, cx - s * 0.18, by - s * 0.5, s * 0.36, s * 0.5, 0.75, after ? "ice" : "white", after ? 0.5 : 0.9, (ly) => {
          if (after) for (let i = 0; i < 5; i++) ellipse(c, cx - s * 0.1 + (i % 3) * s * 0.1, ly + 8 + Math.floor(i / 3) * 10, 6, 4.5, "cotton", { outline: "ink3" });
        });
        if (after) wisps(c, cx, by - s * 0.54, 3);
        return;
      }
      case "soda": {
        glass(c, cx - s * 0.2, by - s * 0.46, s * 0.34, s * 0.46, 0.6, "ice", 0.6, (ly) => { if (after) bubbles(c, cx - s * 0.16, ly - 4, s * 0.26, s * 0.24, 11); });
        if (!after) P.fillPath(c, (q) => { q.moveTo(cx + s * 0.2, by); q.quadraticCurveTo(cx + s * 0.28, by - s * 0.12, cx + s * 0.36, by); q.closePath(); }, "salt", { outline: "ink2", width: 1.2 });
        return;
      }
      case "chapati": {
        ellipse(c, cx, by - s * 0.06, s * 0.36, s * 0.07, "graphite", { outline: "ink2" });
        ellipse(c, cx, by - s * 0.12, s * 0.28, s * 0.06, "roti", { outline: "ink3", alpha: after ? 1 : 0.6 });
        if (after) { for (let i = 0; i < 5; i++) ellipse(c, cx - s * 0.18 + i * s * 0.09, by - s * 0.12 + ((i % 2) - 0.5) * 4, 4, 2.4, "wood", { outline: null }); wisps(c, cx, by - s * 0.2, 3); }
        return;
      }
      case "rust": {
        const ny = by - s * 0.2;
        P.fillPath(c, (q) => { q.moveTo(cx - s * 0.3, ny - 3); q.lineTo(cx + s * 0.22, ny - 3); q.lineTo(cx + s * 0.32, ny); q.lineTo(cx + s * 0.22, ny + 3); q.lineTo(cx - s * 0.3, ny + 3); q.closePath(); }, "iron", { outline: "ink", width: 1.4 });
        rect(c, cx - s * 0.34, ny - 9, s * 0.05, 18, "iron", { outline: "ink" });
        if (after) for (let i = 0; i < 6; i++) ellipse(c, cx - s * 0.24 + i * s * 0.08, ny + ((i % 2) - 0.5) * 3, 6, 4, "rust", { outline: null, alpha: 0.95 });
        return;
      }
      case "egg": {
        bowl(c, cx, by, s * 0.7, (top) => {
          ellipse(c, cx, top + s * 0.04, s * 0.26, s * 0.07, after ? "white" : "ice", { outline: after ? "ink3" : null, alpha: after ? 1 : 0.6 });
          ellipse(c, cx + 3, top + s * 0.03, s * 0.07, s * 0.045, "sun", { outline: "ink3" });
        });
        return;
      }
    }
  }

  // ── nishaan / ulta ──
  function drawChanges(c: Ctx, g: G): void {
    const P = api.P, s = st(), id = itemAt(p, s.w) as ChangeId;
    const y0 = strip(c, g, (i) => W(`badlaav.short.${card[i] as string}`));
    const ctlH = 2 * g.btnH + g.gap, sy = y0, sh = g.bottom - ctlH - g.gap - sy;
    P.body(c, g.x0, sy, g.cw, sh, { role: "panel", r: 12, seed: 3 });
    if (s.done) {
      // the card as it ended: each change filed physical or chemical
      const n = card.length, rh = Math.min(30, (sh - 16) / n);
      card.forEach((cid, i) => {
        const yy = sy + 8 + i * rh, chem = changeOf(cid as ChangeId).kind === "chemical";
        P.textFit(c, W(`badlaav.chg.${cid as string}`), g.x0 + g.cw * 0.36, yy + rh / 2, g.cw * 0.62, rh - 4, { size: 14, role: "ink", weight: 700 });
        P.textFit(c, W(`badlaav.res.${chem ? "chemical" : "physical"}`), g.x0 + g.cw * 0.83, yy + rh / 2, g.cw * 0.3, rh - 4, { size: 14, role: chem ? "q4" : "q1", weight: 800 });
      });
    } else {
      P.textFit(c, W(`badlaav.chg.${id}`), g.x0 + g.cw / 2, sy + 16, g.cw - 20, 22, { size: 15, role: "ink", weight: 800 });
      const pw = (g.cw - 3 * g.gap - 20) / 2, ph = sh - 52, px1 = g.x0 + g.gap, px2 = g.x0 + g.cw - g.gap - pw, py = sy + 30;
      P.textFit(c, W("badlaav.before"), px1 + pw / 2, py + 8, pw, 16, { size: 13, role: "ink2", weight: 700 });
      P.textFit(c, W("badlaav.now"), px2 + pw / 2, py + 8, pw, 16, { size: 13, role: "ink2", weight: 700 });
      changePic(c, id, "before", px1, py + 16, pw, ph - 10);
      // the arrow between them
      const ax = g.x0 + g.cw / 2, ay = py + ph / 2 + 8;
      P.stroke(c, [[ax - 9, ay], [ax + 9, ay]], { role: "ink3", width: 2 }); P.stroke(c, [[ax + 3, ay - 5], [ax + 9, ay], [ax + 3, ay + 5]], { role: "ink3", width: 2 });
      const k = fresh() && (last.kind === "run" || last.kind === "use") ? prog(0.1) : 1;
      // a change of state said to make something new (m2): the now picture shows it undone, the same stuff back
      const undone = s.why === "looks_new";
      const now: Phase = !s.w.ran ? "blank" : s.w.back || undone ? "back" : "after";
      c.save(); c.globalAlpha *= 0.35 + 0.65 * k;
      changePic(c, id, now === "back" ? "before" : now, px2, py + 16, pw, ph - 10);
      c.restore();
      if (undone) badge(c, px2 + pw - 12, py + 30, changeOf(id).undo as string);
      else if (goal === "ulta" && s.w.tried > 0 && tried && tried.next === s.w.next) badge(c, px2 + pw - 12, py + 30, tried.m);
      if (now === "back" && !undone) P.tick(c, px2 + 8, py + 22, 12);
      if (undone) P.stroke(c, [[px2 - 3, py + 14], [px2 + pw + 3, py + 14], [px2 + pw + 3, py + ph + 6], [px2 - 3, py + ph + 6]], { role: "look", width: 2, dash: [4, 3], closed: true });
      if (s.why && s.why !== "not_run" && s.why !== "ran") P.magnifier(c, px2 + 10, py + 22, 14);
    }
    const y1 = g.bottom - ctlH, n3 = (g.cw - 2 * g.gap) / 3;
    if (goal === "nishaan") {
      [...SIGNS, "same"].forEach((m, i) => {
        const x = g.x0 + (i % 3) * (n3 + g.gap), y = y1 + Math.floor(i / 3) * (g.btnH + g.gap);
        button(c, `mark-${m}`, x, y, n3, g.btnH, W(`badlaav.sign.${m}`), { role: m === "same" ? "q1" : "q2", on: fresh() && last.kind === "mark" && last.m === m, look: !!s.why && s.m === m && !s.done, size: 14 });
      });
    } else {
      const n2 = (g.cw - g.gap) / 2;
      ["cool", "warm"].forEach((m, i) => button(c, `tool-${m}`, g.x0 + i * (n2 + g.gap), y1, n2, g.btnH, W(`badlaav.tool.${m}`), { role: "q2", on: fresh() && last.kind === "use" && last.m === m }));
      ["back", "same", "new"].forEach((b, i) => button(c, `bin-${b}`, g.x0 + i * (n3 + g.gap), y1 + g.btnH + g.gap, n3, g.btnH, W(`badlaav.bin.${b}`), { role: "q1", on: fresh() && last.kind === "file" && last.m === b, look: !!s.why && s.m === b && !s.done, size: 14 }));
    }
  }

  // ── ghol ──
  function drawGhol(c: Ctx, g: G): void {
    const P = api.P, s = st(), id = itemAt(p, s.w) as SolidId;
    const y0 = strip(c, g, (i) => W(`badlaav.solid.${card[i] as string}`));
    const sy = y0, sh = g.bottom - g.btnH - g.gap - sy, half = (g.cw - g.gap) / 2;
    const kStep = fresh() && last.kind === "use" ? prog(0.1) : 1;
    const step = s.done ? STEPS : s.w.step - (fresh() && last.kind === "use" && last.before ? 1 - kStep : 0);
    const frac = clamp(step / STEPS, 0, 1);
    for (const [j, where] of (["tawa", "water"] as const).entries()) {
      const x = g.x0 + j * (half + g.gap), here = s.w.at === where && !s.done;
      const look = (s.why === "needs_liquid" && where === "water") || (s.why === "needs_heat" && where === "tawa") || (s.why === "still_there" && where === "water");
      if (!s.done && !s.w.at) api.target(`station-${where}`, x, sy, half, sh);
      P.body(c, x, sy, half, sh, { role: "panel", r: 12, seed: 30 + j, state: look ? "look" : here ? "selected" : "idle" });
      P.textFit(c, W(`badlaav.place.${where}`), x + half / 2, sy + 22, half - 12, 38, { size: 13, role: "ink2", weight: 700 });
      const cx = x + half / 2, base = sy + sh - 18;
      if (where === "tawa") {
        // a warm tawa (no flame drawn), its warmth as wavy lines
        ellipse(c, cx, base - 30, half * 0.36, 9, "graphite", { outline: "ink" });
        P.stroke(c, [[cx + half * 0.34, base - 30], [cx + half * 0.46, base - 40]], { role: "ink", width: 4 });
        wisps(c, cx, base - 42 - (here ? 26 : 0), 3, "q4", 14);
        if (here) solidPic(c, id, cx, base - 40, half * 0.5, frac, "tawa");
      } else {
        // a glass of cold water on a kitchen scale; the pointer moves when a solid goes in and stays while it dissolves
        const gw = half * 0.5, gh = Math.min(110, sh * 0.42), gx = cx - gw / 2, gy = base - 46 - gh;
        glass(c, gx, gy, gw, gh, 0.7, "water", 0.45, (ly) => { if (here) solidPic(c, id, cx, gy + gh - 6, gw * 0.7, frac, "water", ly); });
        rect(c, cx - half * 0.36, base - 46, half * 0.72, 14, "steel", { outline: "ink2" });
        const dial = { x: cx, y: base - 2, r: 24 };
        P.fillPath(c, (q) => { q.moveTo(dial.x - dial.r, dial.y); q.arc(dial.x, dial.y, dial.r, Math.PI, TAU); q.closePath(); }, "white", { outline: "ink2", width: 1.4 });
        for (let i = 0; i <= 6; i++) { const a = Math.PI + (i / 6) * Math.PI; P.stroke(c, [[dial.x + Math.cos(a) * dial.r * 0.78, dial.y + Math.sin(a) * dial.r * 0.78], [dial.x + Math.cos(a) * dial.r * 0.95, dial.y + Math.sin(a) * dial.r * 0.95]], { role: "ink3", width: 1.2 }); }
        const inW = here && SOLIDS[id] === "dissolve" ? (fresh() && last.kind === "put" ? prog(0.1) : 1) : 0;
        const ang = Math.PI + Math.PI * (0.3 + 0.22 * inW);
        P.stroke(c, [[dial.x, dial.y], [dial.x + Math.cos(ang) * dial.r * 0.82, dial.y + Math.sin(ang) * dial.r * 0.82]], { role: "ink", width: 2.4 });
        if (s.why === "still_there") { P.magnifier(c, dial.x + dial.r + 6, dial.y - dial.r, 14); P.circle(c, dial.x, dial.y - dial.r * 0.4, dial.r + 6, { role: "look", width: 2 }); }
      }
    }
    // the solid waiting to be put somewhere
    if (!s.done && !s.w.at) {
      const cx = g.x0 + g.cw / 2, cy = sy + sh * 0.42;
      P.body(c, cx - 44, cy - 34, 88, 68, { role: "panel", r: 10, seed: 9, state: "selected" });
      solidPic(c, id, cx, cy + 16, 50, 0, "none");
      P.textFit(c, W(`badlaav.solid.${id}`), cx, cy - 22, 80, 18, { size: 13, role: "ink", weight: 800 });
    }
    const n2 = (g.cw - g.gap) / 2, ty = g.bottom - g.btnH;
    ["wait", "stir"].forEach((m, i) => button(c, `tool-${m}`, g.x0 + i * (n2 + g.gap), ty, n2, g.btnH, W(`badlaav.tool.${m}`), { role: "q2", on: fresh() && last.kind === "use" && last.m === m }));
  }
  /** a solid as it goes over: a block melting to a pool, or crystals spreading out of view */
  function solidPic(c: Ctx, id: SolidId, cx: number, by: number, sw: number, frac: number, where: "tawa" | "water" | "none", ly?: number): void {
    const m: Material = id === "ghee" ? "oil" : id === "wax" ? "white" : "salt";
    if (SOLIDS[id] === "melt") {
      const bw = sw * 0.5 * (1 - 0.6 * frac), bh = sw * 0.36 * (1 - frac);
      if (frac > 0) ellipse(c, cx, by - 2, sw * 0.26 + sw * 0.3 * frac, 4 + 3 * frac, m, { alpha: 0.9 });
      if (bh > 1) rect(c, cx - bw / 2, by - 4 - bh, bw, bh, m, { outline: "ink2" });
      return;
    }
    // crystals: a heap, then fewer as they spread into the water (still there; the scale says so)
    const n = Math.round(10 * (1 - frac));
    for (let i = 0; i < n; i++) { const t = (i * 0.618) % 1; rect(c, cx - sw * 0.35 + t * sw * 0.7, by - 4 - (i % 3) * 4, 4, 4, m, { outline: "ink3" }); }
    if (where === "water" && frac > 0 && ly !== undefined) for (let i = 0; i < 8; i++) { const t = (i * 0.618) % 1, u = (i * 0.414) % 1; api.P.circle(c, cx - sw * 0.4 + t * sw * 0.8, ly + 6 + u * (by - ly - 12), 1.2, { role: "ink3", fill: true, alpha: 0.5 * (1 - frac * 0.5) }); }
  }

  // ── trikon ──
  /** the sigri (a picture of a fire that responds), with its wood, its lid and the fan; no hand is drawn */
  function sigri(c: Ctx, x: number, y: number, sw: number, sh: number, wd: BadW, show: { fan: boolean; woodOut: boolean; pieces?: number; straw?: boolean; lookLid?: boolean }): void {
    const P = api.P, cx = x + sw / 2, by = y + sh - 10, bw = Math.min(sw * 0.66, 132), bh = Math.min(sh * 0.36, 76), top = by - bh - 10;
    // legs and bucket
    P.stroke(c, [[cx - bw * 0.36, by - 10], [cx - bw * 0.42, by]], { role: "ink", width: 3 }); P.stroke(c, [[cx + bw * 0.36, by - 10], [cx + bw * 0.42, by]], { role: "ink", width: 3 });
    P.fillPath(c, (q) => { q.moveTo(cx - bw / 2, top); q.lineTo(cx + bw / 2, top); q.lineTo(cx + bw * 0.4, by - 10); q.lineTo(cx - bw * 0.4, by - 10); q.closePath(); }, "iron", { outline: "ink", width: 1.6 });
    rect(c, cx - bw * 0.16, by - 10 - bh * 0.42, bw * 0.32, bh * 0.26, "black", { outline: null, alpha: 0.6 });
    // the fuel in it (pieces of wood or coal), glowing as it burns
    const pieces = show.pieces ?? (wd.fuel ? 4 : 0);
    for (let i = 0; i < pieces; i++) {
      const px = cx - bw * 0.36 + (i % 4) * bw * 0.18, py = top - 8 - Math.floor(i / 4) * 7;
      if (show.straw) for (let j = 0; j < 4; j++) P.stroke(c, [[px + j * 3, py + 7], [px + bw * 0.14 - j * 2, py + 1]], { role: "q3", width: 2 });
      else rect(c, px, py, bw * 0.16, 7, wd.glow > 0 ? "wood" : "graphite", { outline: "ink" });
    }
    // the fire (its size is its glow)
    if (wd.glow > 0 && pieces > 0) {
      const fs = [0, 14, 26, 40][wd.glow];
      for (let i = 0; i < 3; i++) flame(c, cx + (i - 1) * bw * 0.22, top - 8, fs * (i === 1 ? 1 : 0.72));
      if (wd.glow === 3) rays(c, cx, top - 8 - fs * 0.6, fs * 1.15);
    } else if (pieces > 0 || !wd.fuel) wisps(c, cx, top - 10, 2, "ink3", 22);
    // the lid
    if (wd.lid) { rect(c, cx - bw * 0.56, top - 26, bw * 1.12, 10, "steel", { outline: "ink" }); rect(c, cx - 8, top - 34, 16, 8, "steel", { outline: "ink" }); if (show.lookLid) P.magnifier(c, cx + bw * 0.56 + 6, top - 30, 14); }
    // the wood taken out, on the ground beside it
    if (show.woodOut) for (let i = 0; i < 4; i++) rect(c, x + 4 + (i % 2) * 22, by - 8 - Math.floor(i / 2) * 8, 20, 7, "wood", { outline: "ink" });
    // the fan (a hand fan, beside the sigri; no hand drawn), with the air it sends
    if (show.fan) {
      const fx = x + sw - 24, fy = top + 4;
      P.fillPath(c, (q) => { q.moveTo(fx, fy + 22); q.arc(fx, fy + 22, 22, Math.PI * 1.1, Math.PI * 1.9); q.closePath(); }, "paper", { outline: "ink2", width: 1.4 });
      P.stroke(c, [[fx, fy + 22], [fx + 4, fy + 40]], { role: "ink", width: 3 });
      for (let i = 0; i < 3; i++) P.stroke(c, [[fx - 26, fy + 6 + i * 8], [fx - 46, fy + 10 + i * 8]], { role: "q2", width: 2, dash: [4, 3] });
    }
  }
  /** the fire triangle: fuel, oxygen (air), heat; a side drawn full while it is there */
  function triangle(c: Ctx, x: number, y: number, tw: number, th: number, has: { fuel: boolean; air: boolean; heat: boolean; more: boolean }, lookAir: boolean): void {
    const P = api.P, len = Math.min(tw - 30, (th - 56) / 0.866), cx = x + tw / 2, base = y + (th + len * 0.866) / 2 - 6;
    const a: [number, number] = [cx, base - len * 0.866], b: [number, number] = [cx - len / 2, base], d: [number, number] = [cx + len / 2, base];
    const side = (p1: [number, number], p2: [number, number], on: boolean, wide: boolean) => P.stroke(c, [p1, p2], { role: on ? "q1" : "ink3", width: on ? (wide ? 8 : 5) : 2, dash: on ? undefined : [5, 5], alpha: on ? 1 : 0.7 });
    side(b, d, has.heat, false); side(a, b, has.fuel, false); side(a, d, has.air, has.more);
    P.textFit(c, W("badlaav.side.heat"), (b[0] + d[0]) / 2, b[1] + 16, tw - 10, 18, { size: 13, role: has.heat ? "ink" : "ink3", weight: 800 });
    const lx = (a[0] + b[0]) / 2 - 2, rx = (a[0] + d[0]) / 2 + 2, my = (a[1] + b[1]) / 2;
    c.save(); c.translate(lx - 10, my); c.rotate(-Math.atan2(b[1] - a[1], a[0] - b[0])); P.textFit(c, W("badlaav.side.fuel"), 0, 0, th * 0.7, 18, { size: 13, role: has.fuel ? "ink" : "ink3", weight: 800 }); c.restore();
    c.save(); c.translate(rx + 10, my); c.rotate(Math.atan2(d[1] - a[1], d[0] - a[0])); P.textFit(c, W("badlaav.side.air"), 0, 0, th * 0.75, 18, { size: 13, role: has.air ? "ink" : "ink3", weight: 800 }); c.restore();
    if (lookAir) P.magnifier(c, rx + 18, my - 22, 14);
  }
  function drawTrikon(c: Ctx, g: G): void {
    const P = api.P, s = st(), fire = itemAt(p, s.w) as Fire;
    const y0 = strip(c, g, (i) => W(`badlaav.wantS.${(card[i] as Fire).want}`));
    const sy = y0, sh = g.bottom - g.btnH - g.gap - sy;
    P.body(c, g.x0, sy, g.cw, sh, { role: "panel", r: 12, seed: 3 });
    // the state drawn: on the last item once done, its end; otherwise now
    const wd = s.w, fanNow = fresh() && last.kind === "use" && last.m === "fan";
    const shown: BadW = s.done || (fresh() && last.before && last.before.next !== s.w.next) ? { ...wd, ...(last.before ? afterOf(last.before) : {}) } : wd;
    const sw = g.cw * 0.56;
    sigri(c, g.x0 + 4, sy + 4, sw, sh - 8, shown, { fan: fanNow || s.why === "lid_air", woodOut: !shown.fuel, lookLid: s.why === "lid_air" });
    triangle(c, g.x0 + sw, sy + 6, g.cw - sw - 4, sh - 12, { fuel: shown.fuel, air: !shown.lid, heat: shown.glow > 0, more: shown.glow === 3 }, s.why === "lid_air");
    const tools = s.done ? fireTools(firesOf0()) : fireTools(fire), n = tools.length, tw = (g.cw - (n - 1) * g.gap) / n, ty = g.bottom - g.btnH;
    tools.forEach((m, i) => {
      const id = m === "lid" && s.w.lid ? "unlid" : m;
      button(c, `tool-${id}`, g.x0 + i * (tw + g.gap), ty, tw, g.btnH, W(`badlaav.tool.${id}`), { role: "q2", on: fresh() && last.kind === "use" && last.m === id, size: 14 });
    });
  }
  const firesOf0 = () => card[card.length - 1] as Fire;
  /** the world an accepted act made before the card moved on (the item just met, drawn for its beat) */
  function afterOf(b: BadW): Partial<BadW> {
    if (last.m === "fuel") return { fuel: false, glow: 0, lid: b.lid };
    if (last.m === "fan") return { glow: 3, lid: b.lid, fuel: b.fuel };
    if (last.m === "wait") return { glow: Math.max(0, b.glow - 1), lid: b.lid, fuel: b.fuel };
    if (last.m === "unlid") return { lid: false, glow: b.glow, fuel: b.fuel };
    return { lid: b.lid, glow: b.glow, fuel: b.fuel };
  }

  // ── raakh ──
  function drawRaakh(c: Ctx, g: G): void {
    const P = api.P, s = st(), b = itemAt(p, s.w) as Burn;
    const rowH = 48, rgap = 6, panelH = PRODUCTS.length * rowH + (PRODUCTS.length - 1) * rgap;
    const sy = g.top, sh = g.bottom - panelH - g.gap - sy, side = Math.min(124, g.cw * 0.36), fw = g.cw - side - g.gap;
    P.body(c, g.x0, sy, fw, sh, { role: "panel", r: 12, seed: 3 });
    const burnt = s.done ? b.k : s.w.burnt, left = b.k - burnt;
    // the card's fires as dots (which one this is), top left
    if (card.length > 1) card.forEach((_, i) => P.circle(c, g.x0 + 12 + i * 13, sy + 13, 4.5, { role: "ink2", fill: i < s.w.next || s.done, width: 1.4 }));
    P.textFit(c, W(`badlaav.fuel.${b.fuel}`), g.x0 + fw * 0.74, sy + sh - 36, fw * 0.5, 18, { size: 13, role: "ink2", weight: 800 });
    // the fire: the fuel left, burning (a picture); the ash below grows as it burns; smoke above
    const wd: BadW = { ...s.w, fuel: left > 0, glow: left > 0 ? 2 : 0, lid: false };
    sigri(c, g.x0 + 4, sy + 20, fw * 0.74, sh - 22, wd, { fan: false, woodOut: false, pieces: left, straw: b.fuel === "straw" });
    const ashX = g.x0 + fw * 0.82, ashY = sy + sh - 14;
    if (burnt > 0) ellipse(c, ashX, ashY - 2, 10 + 5 * burnt, 4 + 2 * burnt, "aluminium", { outline: "ink3" });
    const k = fresh() && last.kind === "use" && last.m === "wait" ? prog(0.1) : 1;
    if (burnt > 0) for (let i = 0; i < 2 + burnt; i++) ellipse(c, g.x0 + fw * 0.35 + (i % 3) * 16 - 8, sy + 46 - i * 5 - 10 * k, 10 + i * 1.5, 6 + i, "shadow", { outline: null, alpha: 0.22 });
    // the gases, once the child has looked closely (drawn as rings in the air)
    if (s.w.looked || s.done) for (let i = 0; i < 6; i++) { const t = (i * 0.618) % 1; P.circle(c, g.x0 + 20 + t * (fw - 40), sy + 36 + (i % 3) * 14, 5, { role: i % 2 ? "q2" : "q1", width: 1.6 }); }
    if (s.why === "into_air") { P.stroke(c, [[g.x0 + 8, sy + 26], [g.x0 + fw - 8, sy + 26], [g.x0 + fw - 8, sy + 84], [g.x0 + 8, sy + 84]], { role: "look", width: 2, dash: [4, 3], closed: true }); P.magnifier(c, g.x0 + fw - 16, sy + 30, 14); }
    // wait and look, beside the fire
    const bx = g.x0 + fw + g.gap, bh = Math.min(g.btnH + 10, (sh - g.gap) / 2);
    button(c, "tool-wait", bx, sy, side, bh, W("badlaav.tool.wait"), { role: "q2", on: fresh() && last.m === "wait", dim: left === 0 && !s.done });
    button(c, "tool-look", bx, sy + bh + g.gap, side, bh, W("badlaav.tool.look"), { role: "q2", on: fresh() && last.m === "look", look: s.why === "into_air" });
    // what it became, and where each went
    const py = g.bottom - panelH, nameW = g.cw * 0.38, bw2 = (g.cw - nameW - 2 * g.gap) / 2;
    PRODUCTS.forEach((pr, i) => {
      const y = py + i * (rowH + rgap), found = s.done || (burnt > 0 && (SEEN[pr] || s.w.looked)), placed = s.done ? GOES[pr] : s.w.placed[i];
      P.body(c, g.x0, y, nameW, rowH, { role: "panel", r: 10, seed: 70 + i, state: placed ? "good" : "idle" });
      P.textFit(c, found ? W(`badlaav.prod.${pr}`) : "?", g.x0 + nameW / 2, y + rowH / 2, nameW - 12, rowH - 6, { size: 14, role: found ? "ink" : "ink3", weight: 800 });
      (["air", "left"] as const).forEach((to, j) => {
        const x = g.x0 + nameW + g.gap + j * (bw2 + g.gap);
        const on = placed === to || (fresh() && last.kind === "place" && last.m === `${pr}:${to}`);
        button(c, `prod-${pr}:${to}`, x, y, bw2, rowH, W(`badlaav.to.${to}`), { role: "q1", on, dim: !found || (!!placed && placed !== to), look: !!s.why && s.m === `${pr}:${to}`, size: 13 });
      });
    });
  }

  // ── jang ──
  function ironPic(c: Ctx, it: Iron, cx: number, cy: number, s: number, rust: number): void {
    const P = api.P;
    if (it.thing === "nail") {
      P.fillPath(c, (q) => { q.moveTo(cx - s * 0.42, cy - 2.5); q.lineTo(cx + s * 0.3, cy - 2.5); q.lineTo(cx + s * 0.42, cy); q.lineTo(cx + s * 0.3, cy + 2.5); q.lineTo(cx - s * 0.42, cy + 2.5); q.closePath(); }, "iron", { outline: "ink", width: 1.2 });
      rect(c, cx - s * 0.46, cy - 7, s * 0.06, 14, "iron", { outline: "ink" });
    } else {
      rect(c, cx - s * 0.42, cy - s * 0.2, s * 0.84, 4, "iron", { outline: "ink" });
      for (let i = 0; i < 4; i++) rect(c, cx - s * 0.36 + i * s * 0.24, cy - s * 0.2, 4, s * 0.4, "iron", { outline: "ink" });
    }
    for (let i = 0; i < rust * 2; i++) ellipse(c, cx - s * 0.34 + ((i * 0.618) % 1) * s * 0.66, cy + (((i * 0.414) % 1) - 0.5) * (it.thing === "nail" ? 4 : s * 0.3), 3 + rust, 2.5 + rust * 0.5, "rust", { outline: null, alpha: 0.95 });
  }
  function drawJang(c: Ctx, g: G): void {
    const P = api.P, s = st(), irons = card as Iron[], n = irons.length;
    const tileH = 84, tw = (g.cw - (n - 1) * 6) / n;
    irons.forEach((it, i) => {
      const x = g.x0 + i * (tw + 6), y = g.top, mine = i === sel && !s.done, looked = !!s.why && s.at === i;
      const rust = s.w.rust[i] ?? 0, met = s.done || (s.w.day >= DAYS && (it.want === "rust" ? rust >= 2 : rust === 0));
      if (!s.done) api.target(`piece-${i}`, x, y, tw, tileH);
      P.body(c, x, y, tw, tileH, { role: "panel", r: 10, seed: 20 + i, state: looked ? "look" : mine ? "selected" : met && s.w.day >= DAYS ? "good" : "idle" });
      ironPic(c, it, x + tw / 2, y + 22, Math.min(tw * 0.8, 70), rust);
      P.textFit(c, W(`badlaav.want.${it.want}`), x + tw / 2, y + 50, tw - 8, 34, { size: 12, role: "ink", weight: 800 });
      const where = s.w.where[i];
      P.textFit(c, where ? W(`badlaav.short.${where}`) : "·", x + tw / 2, y + 75, tw - 8, 14, { size: 11, role: "ink2", weight: 700 });
      if (looked) P.magnifier(c, x + tw - 8, y + 8, 12);
    });
    const pipsH = 22, sy = g.top + tileH + g.gap, sh = g.bottom - pipsH - g.gap - sy, half = (g.cw - g.gap) / 2;
    (["damp", "dry"] as Place[]).forEach((pl, j) => {
      const x = g.x0 + j * (half + g.gap);
      if (!s.done) api.target(`place-${pl}`, x, sy, half, sh);
      P.body(c, x, sy, half, sh, { role: "panel", r: 12, seed: 40 + j, state: fresh() && last.kind === "put" && last.m === pl ? "selected" : "idle" });
      P.textFit(c, W(`badlaav.place.${pl}`), x + half / 2, sy + 22, half - 12, 38, { size: 13, role: "ink2", weight: 700 });
      // air everywhere (light rings); water only in the damp place (drops and a wet cloth)
      for (let i = 0; i < 5; i++) P.circle(c, x + 16 + ((i * 0.618) % 1) * (half - 32), sy + 42 + (i % 2) * 10, 3.5, { role: "ink3", width: 1 });
      if (WATER[pl]) { rect(c, x + 10, sy + sh - 30, half - 20, 16, "water", { outline: "ink2", alpha: 0.5 }); for (let i = 0; i < 4; i++) ellipse(c, x + 22 + i * (half - 44) / 3, sy + 70 + (i % 2) * 8, 3, 4.5, "water", { outline: null }); }
      else rect(c, x + 10, sy + sh - 30, half - 20, 16, "wood", { outline: "ink2", alpha: 0.6 });
      const here = irons.map((it, i) => ({ it, i })).filter((q) => s.w.where[q.i] === pl);
      here.forEach((q, k) => ironPic(c, q.it, x + half / 2, sy + 92 + k * Math.min(26, (sh - 130) / Math.max(1, here.length - 1)), Math.min(half * 0.6, 64), s.w.rust[q.i]));
    });
    // the days as dots (no number): the card's days drawn larger
    const py = g.bottom - pipsH / 2;
    for (let d = 0; d < DAYMAX; d++) P.circle(c, g.x0 + g.cw / 2 + (d - (DAYMAX - 1) / 2) * 20, py, d < DAYS ? 6 : 4.5, { role: d < DAYS ? "q1" : "ink3", fill: d < s.w.day, width: 1.4 });
  }

  function draw(c: Ctx): void {
    const g = geo();
    if (goal === "nishaan" || goal === "ulta") drawChanges(c, g);
    else if (goal === "ghol") drawGhol(c, g);
    else if (goal === "trikon") drawTrikon(c, g);
    else if (goal === "raakh") drawRaakh(c, g);
    else drawJang(c, g);
  }

  function goalLine(): string {
    const s = st();
    if (s.done) return W(`badlaav.done.${goal}`);
    if (s.why) return W(`badlaav.why.${s.why}`);
    const it = itemAt(p, s.w);
    switch (goal) {
      case "nishaan": return s.w.ran ? W("badlaav.goal.mark") : W("badlaav.goal.run", { change: W(`badlaav.chg.${it as string}`) });
      case "ulta": return !s.w.ran ? W("badlaav.goal.run", { change: W(`badlaav.chg.${it as string}`) }) : s.w.tried ? W("badlaav.goal.file") : W("badlaav.goal.undo");
      case "ghol": return !s.w.at ? W("badlaav.goal.put", { solid: W(`badlaav.solid.${it as string}`) }) : s.w.step >= STEPS ? W("badlaav.why.over") : W(`badlaav.goal.${s.w.at}`);
      case "trikon": return W(`badlaav.goal.trikon.${(it as Fire).want}`);
      case "raakh": { const b = it as Burn; return s.w.burnt < b.k ? W("badlaav.goal.burn", { fuel: mid(W(`badlaav.fuel.${b.fuel}`)) }) : s.w.placed.every((x) => x) ? W("badlaav.goal.claim") : W("badlaav.goal.place"); }
      case "jang": return s.w.where.some((x) => !x) ? W("badlaav.goal.jang.put") : s.w.day >= DAYS ? W("badlaav.goal.jang.check") : W("badlaav.goal.jang.day");
    }
  }
  /** a name filled into the middle of an English sentence is lower case ("the wood burns") */
  const mid = (x: string) => (lang === "en" ? x.charAt(0).toLowerCase() + x.slice(1) : x);
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [{ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) }];
    // never "your move": no button hints which act is right
    if (goal === "nishaan" || goal === "ulta") out.push({ id: "run", label: W("badlaav.run"), aria: W("badlaav.run"), kind: "primary", group: "go", onPress: () => act({ kind: "run" }) });
    if (goal === "ghol") {
      out.push({ id: "gone", label: W("badlaav.gone"), aria: W("badlaav.gone"), kind: "secondary", group: "go", onPress: () => act({ kind: "use", m: "gone" }) });
      out.push({ id: "done", label: W("badlaav.claim"), aria: W("badlaav.claim"), kind: "primary", group: "go", onPress: () => act({ kind: "done" }) });
    }
    if (goal === "trikon") out.push({ id: "wait", label: W("badlaav.tool.wait"), aria: W("badlaav.tool.wait"), kind: "primary", group: "go", onPress: () => act({ kind: "use", m: "wait" }) });
    if (goal === "raakh") out.push({ id: "done", label: W("badlaav.claim"), aria: W("badlaav.claim"), kind: "primary", group: "go", onPress: () => act({ kind: "done" }) });
    if (goal === "jang") {
      out.push({ id: "day", label: W("badlaav.tool.day"), aria: W("badlaav.tool.day"), kind: "primary", group: "go", onPress: () => act({ kind: "use", m: "day" }) });
      out.push({ id: "wipe", label: W("badlaav.tool.wipe"), aria: W("badlaav.tool.wipe"), kind: "secondary", group: "go", onPress: () => act({ kind: "use", m: "wipe", at: sel }) });
    }
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal: goalLine, readouts, controls, react };
  return view;
};
