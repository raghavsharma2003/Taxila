// Jaanch · the 2D view (round 7, testing food for starch and fat; class 6 science). Nothing here runs on a clock: a drop
// falls, a food is rubbed on the paper, the paper dries a step or is held to the light only when the child taps, and each is
// shown as a beat inside busy(); the animations only show what the law has already answered.
//   iodine (neela): the card's foods as chips on top (each said one keeps the colour it showed); the bench in the teacher's lab:
//             the food on a white dish, the dilute iodine's labelled bottle beside it and its dropper over the dish (no hand);
//             the drops as dots; One drop below; then "shows starch" / "no starch shown".
//   kaagaz (daag): the chips on top; the food beside a sheet of paper; its patch wet at first, drying a Wait at a time (a water
//             patch fades and goes, an oily one stays) and, held to the light, the light shining through a patch that stayed;
//             Rub (a drop, for a liquid), Wait and To the light below; then "shows fat" / "no fat shown".
//   dono (thali): the result grid on top (foods down the side, starch and fat across; the food in front has its Yes / No
//             cells); the dish and the paper side by side; One drop, Rub, Wait and To the light below; Next food.
// After a wrong move only magnifiers mark what to look at again (never the key, never a cross). Nothing is eaten, tasted or
// touched, and no hand is drawn.
import type { JaanchAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Material } from "../../core/styles.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  DROPMAX, DRY, FEW,
  cardOf, foodAt, foodOf,
  type Food, type FoodId, type JaanchParams, type JaanchState, type JW, type Test,
} from "./jaanch.logic.ts";

const HOLD = 1.4;   // s: the stage keeps drawing after an act (the last beat lands inside it)
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;

export const makeJaanchView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<JaanchParams, JaanchState, JaanchAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const card = cardOf(p);
  let w = 360, h = 400;
  let actAt = -10, doneAt = -10, cheered = false;
  let last: { kind: string; m: string; ok: boolean; before: JW | null } = { kind: "", m: "", ok: false, before: null };
  let down: { x: number; y: number } | null = null;

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: JaanchAct) => {
    const m = a.kind === "use" ? a.m : a.kind === "mark" ? `${a.t}:${a.v}` : a.kind;
    last = { kind: a.kind, m, ok: false, before: { ...st().w } };
    ctl.dispatch(a); deps.changed();
  };
  function react(ms: Moment[], refused: string | undefined): void {
    actAt = api.t;
    last.ok = !refused;
    if (last.kind === "undo") last = { kind: "", m: "", ok: false, before: null };
    for (const m of ms) if (m.kind === "solved") { doneAt = api.t + 0.5; cheered = false; }
    const mc = ms.some((m) => m.kind === "misconception_consequence");
    if (refused === "level_over" || refused === "said_already" || refused === "rubbed" || refused === "lit") api.sfx("refuse");
    else if (refused || mc) { api.sfx("look"); if (!mc) api.fx.shake(2); }
    else api.sfx(last.kind === "drop" || last.kind === "use" ? "drop" : last.kind === "mark" ? "land" : "tap");
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
    if (kind === "tool") act(rest === "drop" ? { kind: "drop" } : { kind: "use", m: rest });
    else if (kind === "mark") { const [t, v] = rest.split(":"); act({ kind: "mark", t, v }); }
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
  const ellipse = (c: Ctx, x: number, y: number, rx: number, ry: number, m: Material, o: { alpha?: number; outline?: "ink" | "ink2" | "ink3" | null; width?: number } = {}) =>
    api.P.fillPath(c, (q) => q.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, TAU), m, { outline: o.outline === undefined ? "ink2" : o.outline, width: o.width ?? 1.4, alpha: o.alpha });
  const rect = (c: Ctx, x: number, y: number, rw: number, rh: number, m: Material, o: { alpha?: number; outline?: "ink" | "ink2" | "ink3" | null } = {}) =>
    api.P.fillPath(c, (q) => q.rect(x, y, rw, rh), m, { outline: o.outline === undefined ? "ink2" : o.outline, width: 1.4, alpha: o.alpha });
  /** wavy lines rising (the paper drying) */
  function wisps(c: Ctx, x: number, y: number, n: number, hgt = 18, alpha = 0.85): void {
    for (let i = 0; i < n; i++) api.P.stroke(c, Array.from({ length: 7 }, (_, j): [number, number] => [x + (i - (n - 1) / 2) * 10 + Math.sin(j * 1.3 + i) * 3, y - j * (hgt / 6)]), { role: "ink3", width: 2, alpha });
  }
  /** a row of pips (drops or drying steps; no number): the first `big` drawn larger */
  function pips(c: Ctx, cx: number, y: number, n: number, filled: number, big: number): void {
    for (let i = 0; i < n; i++) api.P.circle(c, cx + (i - (n - 1) / 2) * 16, y, i < big ? 5.5 : 4, { role: i < big ? "q1" : "ink3", fill: i < filled, width: 1.4 });
  }
  const isLiquid = (id: FoodId) => !!(foodOf(id) as Food).liquid;

  // ── the kit's foods, drawn (shapes only; the name is always written beside) ──
  /** a food at (cx, cy) about s across; a liquid in a small bowl, its top at the returned y */
  function foodPic(c: Ctx, id: FoodId, cx: number, cy: number, s: number): number {
    const P = api.P;
    const bowl = (m: Material, alpha: number): number => {
      const bw = s * 0.9, by = cy + s * 0.22, top = by - bw * 0.36;
      P.fillPath(c, (q) => { q.moveTo(cx - bw / 2, top); q.quadraticCurveTo(cx - bw / 2, by, cx, by); q.quadraticCurveTo(cx + bw / 2, by, cx + bw / 2, top); q.closePath(); }, m, { outline: null, alpha });
      P.stroke(c, Array.from({ length: 17 }, (_, i): [number, number] => { const t = i / 16; return [lerp(cx - bw / 2, cx + bw / 2, t), top + (by - top) * (1 - Math.pow(2 * t - 1, 2))]; }), { role: "ink2", width: 2 });
      ellipse(c, cx, top, bw / 2, bw * 0.08, m, { alpha: alpha * 0.9, outline: "ink3", width: 1 });
      return top;
    };
    switch (id) {
      case "potato": ellipse(c, cx, cy, s * 0.42, s * 0.3, "seed", { outline: "ink2" }); ellipse(c, cx, cy, s * 0.36, s * 0.24, "leafPale", { outline: null }); return cy;
      case "rice": for (let i = 0; i < 14; i++) { const a = (i * 2.4) % TAU, rr = s * 0.08 + ((i * 0.37) % 1) * s * 0.22; ellipse(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.5, s * 0.06, s * 0.03, "white", { outline: "ink3", width: 1 }); } return cy;
      case "roti": ellipse(c, cx, cy, s * 0.42, s * 0.2, "roti", { outline: "ink2" }); for (let i = 0; i < 4; i++) ellipse(c, cx - s * 0.2 + i * s * 0.13, cy + ((i % 2) - 0.5) * s * 0.08, 3, 2, "wood", { outline: null }); return cy;
      case "idli": P.fillPath(c, (q) => { q.moveTo(cx - s * 0.36, cy + s * 0.08); q.quadraticCurveTo(cx, cy - s * 0.38, cx + s * 0.36, cy + s * 0.08); q.closePath(); }, "white", { outline: "ink2", width: 1.4 }); return cy - s * 0.05;
      case "cucumber": ellipse(c, cx, cy, s * 0.36, s * 0.26, "leaf", { outline: "ink2" }); ellipse(c, cx, cy, s * 0.3, s * 0.2, "leafPale", { outline: null }); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ellipse(c, cx + Math.cos(a) * s * 0.1, cy + Math.sin(a) * s * 0.07, 2.2, 1.4, "seed", { outline: null }); } return cy;
      case "paneer": rect(c, cx - s * 0.24, cy - s * 0.18, s * 0.48, s * 0.36, "cotton", { outline: "ink2" }); rect(c, cx - s * 0.24, cy - s * 0.18, s * 0.48, s * 0.08, "white", { outline: "ink3" }); return cy;
      case "groundnut": for (let i = 0; i < 6; i++) ellipse(c, cx - s * 0.24 + (i % 3) * s * 0.24, cy - s * 0.06 + Math.floor(i / 3) * s * 0.14, s * 0.1, s * 0.06, "seed", { outline: "ink2", width: 1 }); return cy;
      case "coconut": ellipse(c, cx, cy + s * 0.06, s * 0.34, s * 0.14, "white", { outline: "ink3" }); for (let i = 0; i < 9; i++) { const x = cx - s * 0.26 + (i % 5) * s * 0.13, y = cy - s * 0.02 + Math.floor(i / 5) * s * 0.08; P.stroke(c, [[x, y], [x + s * 0.07, y - s * 0.04]], { role: "ink3", width: 2 }); } return cy;
      case "cashew": for (let i = 0; i < 2; i++) { const x = cx - s * 0.16 + i * s * 0.32; P.fillPath(c, (q) => { q.arc(x, cy, s * 0.14, Math.PI * 0.2, Math.PI * 1.5); q.arc(x + s * 0.02, cy - s * 0.02, s * 0.07, Math.PI * 1.5, Math.PI * 0.2, true); q.closePath(); }, "seed", { outline: "ink2", width: 1.2 }); } return cy;
      case "chips": for (let i = 0; i < 3; i++) ellipse(c, cx - s * 0.2 + i * s * 0.2, cy + ((i % 2) - 0.5) * s * 0.1, s * 0.15, s * 0.1, "turmeric", { outline: "ink2", width: 1.2 }); return cy;
      case "tomato": ellipse(c, cx, cy, s * 0.34, s * 0.3, "red", { outline: "ink2" }); for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; ellipse(c, cx + Math.cos(a) * s * 0.14, cy + Math.sin(a) * s * 0.12, s * 0.08, s * 0.06, "pink", { outline: null, alpha: 0.8 }); } return cy;
      case "snack": {
        // a paper cone of a new snack (a few round bits): the kit's unnamed snack
        P.fillPath(c, (q) => { q.moveTo(cx - s * 0.3, cy - s * 0.12); q.lineTo(cx + s * 0.3, cy - s * 0.12); q.lineTo(cx, cy + s * 0.36); q.closePath(); }, "paper", { outline: "ink2", width: 1.4 });
        for (let i = 0; i < 5; i++) ellipse(c, cx - s * 0.2 + i * s * 0.1, cy - s * 0.16 - (i % 2) * s * 0.06, s * 0.07, s * 0.05, "roti", { outline: "ink3", width: 1 });
        return cy;
      }
      case "ricewater": return bowl("cotton", 0.75);
      case "sugar": return bowl("ice", 0.7);
      case "milk": return bowl("white", 0.95);
      case "oil": return bowl("oil", 0.8);
      case "water": return bowl("water", 0.45);
    }
    return cy;
  }
  /** the iodine on the food: blue-black where starch is, iodine's own brown where it is not (a few drops to show fully) */
  function stain(c: Ctx, id: FoodId, cx: number, ty: number, s: number, drops: number, k: number): void {
    if (drops <= 0) return;
    const blue = !!(foodOf(id) as Food).starch, m: Material = blue ? "starch" : "nostarch";
    const full = clamp(drops / FEW, 0, 1), a = (blue ? 0.45 + 0.5 * full : 0.75) * k;
    if (isLiquid(id)) { ellipse(c, cx, ty, s * 0.2 + s * 0.16 * full, s * 0.05 + s * 0.02 * full, m, { alpha: a, outline: null }); return; }
    const n = Math.min(drops, DROPMAX);
    for (let i = 0; i < n; i++) ellipse(c, cx + (i - (n - 1) / 2) * s * 0.12, ty + ((i % 2) - 0.5) * s * 0.05, s * 0.08 + s * 0.04 * full, s * 0.055 + s * 0.02 * full, m, { alpha: a, outline: null });
  }
  /** a dropper (a glass tube and a rubber bulb), its tip at (x, y); no hand */
  function dropper(c: Ctx, x: number, y: number, s: number): void {
    const P = api.P;
    P.fillPath(c, (q) => q.rect(x - s * 0.12, y - s * 0.9, s * 0.24, s * 0.82), "ice", { outline: "ink2", width: 1.2 });
    P.fillPath(c, (q) => { q.moveTo(x - s * 0.12, y - s * 0.08); q.lineTo(x + s * 0.12, y - s * 0.08); q.lineTo(x, y); q.closePath(); }, "ice", { outline: "ink2", width: 1.2 });
    P.fillPath(c, (q) => q.ellipse(x, y - s * 1.05, s * 0.2, s * 0.24, 0, 0, TAU), "rubber", { outline: "ink2", width: 1.2 });
  }
  /** the dilute iodine's bottle on the bench, its label written on it */
  function bottle(c: Ctx, x: number, y: number, bw: number, bh: number, label = "jaanch.bottle"): void {
    const P = api.P;
    rect(c, x + bw * 0.34, y, bw * 0.32, bh * 0.14, "rubber", { outline: "ink2" });
    P.fillPath(c, (q) => { q.moveTo(x + bw * 0.3, y + bh * 0.14); q.lineTo(x + bw * 0.7, y + bh * 0.14); q.lineTo(x + bw, y + bh * 0.3); q.lineTo(x + bw, y + bh); q.lineTo(x, y + bh); q.lineTo(x, y + bh * 0.3); q.closePath(); }, "nostarch", { outline: "ink", width: 1.6, alpha: 0.9 });
    const lh = Math.max(30, bh * 0.4);
    // the label is a panel of the art (its ink reads on it in every art direction)
    P.body(c, x + 3, y + bh * 0.42, bw - 6, lh, { role: "panel", r: 4, seed: 11 });
    P.textFit(c, W(label), x + bw / 2, y + bh * 0.42 + lh / 2, bw - 10, lh - 2, { size: 12, role: "ink", weight: 800 });
  }
  /** the paper and its patch: wet at first, drying a Wait at a time; held to the light, a patch that stayed lets light through */
  function paper(c: Ctx, id: FoodId, x: number, y: number, pw: number, ph: number, wd: Pick<JW, "rubbed" | "dry" | "lit">, kDry: number, lookIt: boolean): void {
    const P = api.P, lit = wd.lit;
    if (lit) {
      // the light behind (a bulb's glow above it), the sheet bright in front of it
      const lx = x + pw - 10, ly = y + 6;
      P.circle(c, lx, ly, 9, { role: "q3", fill: true }); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; P.stroke(c, [[lx + Math.cos(a) * 12, ly + Math.sin(a) * 12], [lx + Math.cos(a) * 17, ly + Math.sin(a) * 17]], { role: "q3", width: 2 }); }
    }
    rect(c, x, y + (lit ? 14 : 0), pw - (lit ? 22 : 0), ph - (lit ? 14 : 0), "paper", { outline: "ink2" });
    const sx = x + (pw - (lit ? 22 : 0)) / 2, sy = y + (lit ? 14 : 0) + (ph - (lit ? 14 : 0)) / 2, rx = Math.min(pw, ph) * 0.24, ry = rx * 0.75;
    if (!wd.rubbed) return;
    const fat = !!(foodOf(id) as Food).fat, wetK = clamp(1 - (wd.dry - 1 + kDry) / DRY, 0, 1);
    // wet: the same look for every food (a water patch and an oily one cannot be told apart until it dries)
    if (wetK > 0) ellipse(c, sx, sy, rx, ry, "water", { alpha: 0.4 * wetK, outline: null });
    if (fat) {
      const stayK = 1 - wetK;
      if (lit) ellipse(c, sx, sy, rx, ry, "glow", { alpha: 0.9, outline: "ink3" });
      else if (stayK > 0) ellipse(c, sx, sy, rx, ry, "oil", { alpha: 0.35 * stayK, outline: null });
    }
    if (lookIt) { P.stroke(c, [[sx - rx - 6, sy - ry - 6], [sx + rx + 6, sy - ry - 6], [sx + rx + 6, sy + ry + 6], [sx - rx - 6, sy + ry + 6]], { role: "look", width: 2, dash: [4, 3], closed: true }); P.magnifier(c, sx + rx + 6, sy - ry - 6, 12); }
  }
  /** the bench's dish: the food on a white dish, the dropper over it and the drop falling on a beat */
  function dish(c: Ctx, id: FoodId, x: number, y: number, dw: number, dh: number, drops: number, lookIt: boolean): void {
    const P = api.P, cx = x + dw / 2, s = Math.min(dw * 0.8, dh * 0.62, 120), by = y + dh - 10;
    ellipse(c, cx, by - s * 0.18, s * 0.62, s * 0.2, "white", { outline: "ink2" });
    const top = foodPic(c, id, cx, by - s * 0.3, s);
    const dropping = fresh() && last.kind === "drop", k = dropping ? prog(0.2) : 1;
    stain(c, id, cx, top, s, drops - (dropping ? 1 : 0), 1);
    if (dropping) stain(c, id, cx, top, s, drops, k);
    const tipY = Math.max(y + 34, top - s * 0.42);
    dropper(c, cx, tipY, 24);
    if (dropping && prog() < 1) { const fy = lerp(tipY + 4, top, prog()); P.fillPath(c, (q) => q.arc(cx, fy, 3.5, 0, TAU), "nostarch", { outline: "ink2", width: 1 }); }
    if (lookIt) P.magnifier(c, cx + s * 0.4, top - 10, 14);
  }
  /** the card's chips on top: the one in front chosen, a said one carrying the colour or patch it showed */
  function strip(c: Ctx, g: G): number {
    const P = api.P, s = st(), n = Math.max(1, card.length), cw = (g.cw - (n - 1) * 6) / n, sh = 44;
    card.forEach((id, i) => {
      const x = g.x0 + i * (cw + 6), r = s.w.res[i];
      const state = r ? "good" : i === s.w.next && !s.done ? (s.why ? "look" : "selected") : "idle";
      P.body(c, x, g.top, cw, sh, { role: "panel", r: 10, seed: 60 + i, state });
      P.textFit(c, W(`jaanch.short.${id}`), x + cw / 2, g.top + sh / 2 + 2, cw - 8, sh - 8, { size: 14, role: "ink", weight: 700 });
      if (r) swatch(c, goal === "iodine" ? "starch" : "fat", r, x + cw - 8, g.top + 8, 4);
    });
    return g.top + sh + g.gap;
  }
  /** a result as it was seen: blue-black or iodine's brown (starch); an oily patch or bare paper (fat) */
  function swatch(c: Ctx, t: Test, v: string, x: number, y: number, r: number): void {
    if (t === "starch") ellipse(c, x, y, r, r, v === "yes" ? "starch" : "nostarch", { outline: "ink2", width: 1.2 });
    else ellipse(c, x, y, r, r, v === "yes" ? "oil" : "paper", { outline: "ink2", width: 1.2, alpha: v === "yes" ? 0.75 : 1 });
  }

  // ── iodine ──
  function drawIodine(c: Ctx, g: G): void {
    const P = api.P, s = st(), id = foodAt(p, s.w);
    const y0 = strip(c, g), ctlH = 2 * g.btnH + g.gap, sy = y0, sh = g.bottom - ctlH - g.gap - sy;
    P.body(c, g.x0, sy, g.cw, sh, { role: "panel", r: 12, seed: 3 });
    if (s.done) { results(c, g.x0, sy, g.cw, sh, ["starch"]); }
    else {
      P.textFit(c, W(`jaanch.bench.${p.scene}`), g.x0 + g.cw * 0.5, sy + 13, g.cw - 20, 18, { size: 12, role: "ink2", weight: 700 });
      P.textFit(c, W(`jaanch.food.${id}`), g.x0 + g.cw * 0.36, sy + 34, g.cw * 0.66, 22, { size: 15, role: "ink", weight: 800 });
      const dw = g.cw * 0.66, bw = Math.min(70, g.cw * 0.22), bh = Math.min(118, sh - 70);
      dish(c, id, g.x0 + 6, sy + 46, dw, sh - 74, s.w.drops, !!s.why && s.why !== "few_drops" && s.why !== "enough");
      pips(c, g.x0 + 6 + dw / 2, sy + sh - 14, DROPMAX, s.w.drops, FEW);
      if (s.why === "not_sugar") tree(c, g.x0 + dw, sy + 40, g.cw - dw - 4, sh - 50);
      else bottle(c, g.x0 + g.cw - bw - 12, sy + sh - bh - 12, bw, bh);
    }
    const y1 = g.bottom - ctlH, n2 = (g.cw - g.gap) / 2;
    button(c, "tool-drop", g.x0, y1, g.cw, g.btnH, W("jaanch.tool.drop"), { role: "q2", on: fresh() && last.kind === "drop" });
    (["yes", "no"] as const).forEach((v, i) => button(c, `mark-starch:${v}`, g.x0 + i * (n2 + g.gap), y1 + g.btnH + g.gap, n2, g.btnH, W(`jaanch.mark.starch.${v}`), { role: "q1", look: !!s.why && s.m === `starch:${v}` && !s.done, size: 14 }));
  }
  /** the kit's carbohydrate family tree: starch and sugar two branches, iodine pointing only at starch */
  function tree(c: Ctx, x: number, y: number, tw: number, th: number): void {
    const P = api.P, cx = x + tw / 2, top = y + 12, mid = y + th * 0.52, lx = x + tw * 0.27, rx = x + tw * 0.73;
    P.textFit(c, W("jaanch.tree.carb"), cx, top, tw - 4, 20, { size: 12, role: "ink", weight: 800 });
    P.stroke(c, [[cx, top + 10], [lx, mid - 14]], { role: "ink2", width: 2 }); P.stroke(c, [[cx, top + 10], [rx, mid - 14]], { role: "ink2", width: 2 });
    P.textFit(c, W("jaanch.tree.starch"), lx, mid, tw * 0.5 - 4, 32, { size: 12, role: "ink", weight: 800 });
    P.textFit(c, W("jaanch.tree.sugar"), rx, mid, tw * 0.5 - 4, 32, { size: 12, role: "ink", weight: 800 });
    ellipse(c, lx, mid + 26, 9, 9, "starch", { outline: "ink2" }); ellipse(c, rx, mid + 26, 9, 9, "nostarch", { outline: "ink2" });
    // iodine points only at starch
    const ay = Math.min(y + th - 10, mid + 58);
    P.stroke(c, [[cx, ay], [lx + 8, mid + 38]], { role: "look", width: 2.4 }); P.stroke(c, [[lx + 8, mid + 38], [lx + 18, mid + 40], [lx + 12, mid + 48]], { role: "look", width: 2.4 });
    ellipse(c, cx + 8, ay, 7, 5, "nostarch", { outline: "ink2" });
    P.textFit(c, W("jaanch.tree.iodine"), cx + 8 + tw * 0.22, ay, tw * 0.44, 18, { size: 12, role: "ink2", weight: 700 });
  }

  // ── kaagaz ──
  function drawKaagaz(c: Ctx, g: G): void {
    const P = api.P, s = st(), id = foodAt(p, s.w);
    const y0 = strip(c, g), ctlH = 2 * g.btnH + g.gap, sy = y0, sh = g.bottom - ctlH - g.gap - sy;
    P.body(c, g.x0, sy, g.cw, sh, { role: "panel", r: 12, seed: 3 });
    if (s.done) results(c, g.x0, sy, g.cw, sh, ["fat"]);
    else {
      P.textFit(c, W(`jaanch.bench.${p.scene}`), g.x0 + g.cw * 0.5, sy + 13, g.cw - 20, 18, { size: 12, role: "ink2", weight: 700 });
      P.textFit(c, W(`jaanch.food.${id}`), g.x0 + g.cw / 2, sy + 34, g.cw - 20, 22, { size: 15, role: "ink", weight: 800 });
      const fw = g.cw * 0.32, py = sy + 50, ph = sh - 82, pw = Math.min(g.cw - fw - 20, ph * 1.3);
      foodPic(c, id, g.x0 + fw / 2 + 4, py + ph * 0.5, Math.min(fw * 0.8, 90));
      const px = g.x0 + fw + 8;
      paperBeat(c, id, px, py, pw, ph);
      pips(c, px + pw / 2, sy + sh - 14, DRY, s.w.dry, DRY);
    }
    const y1 = g.bottom - ctlH, n3 = (g.cw - 2 * g.gap) / 3, n2 = (g.cw - g.gap) / 2;
    paperTools(c, g, y1, n3);
    (["yes", "no"] as const).forEach((v, i) => button(c, `mark-fat:${v}`, g.x0 + i * (n2 + g.gap), y1 + g.btnH + g.gap, n2, g.btnH, W(`jaanch.mark.fat.${v}`), { role: "q1", look: !!s.why && s.m === `fat:${v}` && !s.done, size: 14 }));
  }
  /** the paper, with the drying of the last Wait as its beat, and wisps rising while it dries */
  function paperBeat(c: Ctx, id: FoodId, px: number, py: number, pw: number, ph: number): void {
    const s = st(), waiting = fresh() && last.kind === "use" && last.m === "wait", kDry = waiting ? prog(0.1) : 1;
    const lookIt = s.why === "wet_patch" || s.why === "not_dry" || s.why === "patch_gone" || s.why === "patch_stays" || s.why === "hold_light";
    paper(c, id, px, py, pw, ph, s.w, kDry, lookIt);
    if (waiting) wisps(c, px + pw / 2, py + ph * 0.42 - 8 * prog(), 3, 18, 0.85 * (1 - prog(0.3)));
    // rubbed on: the food's mark on the sheet arrives as its beat
    if (fresh() && last.kind === "use" && last.m === "rub") api.P.stroke(c, [[px + pw * 0.3, py + ph * 0.62], [px + pw * 0.3 + pw * 0.4 * prog(), py + ph * 0.38]], { role: "ink3", width: 3, alpha: 1 - prog(0.5) });
  }
  function paperTools(c: Ctx, g: G, y: number, bw: number): void {
    const s = st(), id = foodAt(p, s.w);
    const tools: [string, string][] = [["rub", isLiquid(id) ? "jaanch.tool.rubdrop" : "jaanch.tool.rub"], ["wait", "jaanch.tool.wait"], ["light", "jaanch.tool.light"]];
    tools.forEach(([m, k], i) => button(c, `tool-${m}`, g.x0 + i * (bw + g.gap), y, bw, g.btnH, W(k), { role: "q2", on: fresh() && last.kind === "use" && last.m === m, look: (s.why === "wet_patch" || s.why === "not_dry") && m === "wait" || s.why === "hold_light" && m === "light", size: 14 }));
  }
  /** the card as it ended: each food and what each test showed, in a table */
  function results(c: Ctx, x: number, y: number, rw: number, rh: number, tests: readonly Test[]): void {
    const P = api.P, n = card.length, hh = 24, row = Math.min(36, (rh - hh - 12) / n), nameW = rw * 0.44, colW = (rw - nameW - 8) / tests.length;
    tests.forEach((t, j) => P.textFit(c, W(`jaanch.col.${t}`), x + nameW + colW * (j + 0.5), y + 6 + hh / 2, colW - 6, hh - 2, { size: 13, role: "ink2", weight: 800 }));
    card.forEach((id, i) => {
      const yy = y + 6 + hh + i * row, r = st().w.res[i].split(",");
      P.textFit(c, W(`jaanch.short.${id}`), x + nameW / 2, yy + row / 2, nameW - 10, row - 4, { size: 14, role: "ink", weight: 700 });
      tests.forEach((t, j) => {
        const v = tests.length === 1 ? r[0] : r[j], cx = x + nameW + colW * (j + 0.5);
        swatch(c, t, v, cx - colW * 0.28, yy + row / 2, 6);
        P.textFit(c, W(`jaanch.res.${t}.${v}`), cx + 8, yy + row / 2, colW * 0.62, row - 4, { size: 13, role: v === "yes" ? "ink" : "ink2", weight: 800 });
      });
    });
  }

  // ── dono ──
  function drawDono(c: Ctx, g: G): void {
    const P = api.P, s = st(), id = foodAt(p, s.w), n = card.length;
    // the grid: foods down the side, starch and fat across; the food in front has its Yes / No cells
    const hh = 22, cur = 48, other = 28, nameW = Math.min(g.cw * 0.34, 130), colW = (g.cw - nameW) / 2;
    // done: the grid takes the whole stage above the tools (the bench is put away)
    const doneRow = Math.min(46, (g.bottom - g.btnH - 2 * g.gap - g.top - hh - 8) / n);
    const gridH = s.done ? g.bottom - g.btnH - g.gap - g.top : hh + cur + (n - 1) * other + 8;
    P.body(c, g.x0, g.top, g.cw, gridH, { role: "panel", r: 12, seed: 5 });
    (["starch", "fat"] as const).forEach((t, j) => P.textFit(c, W(`jaanch.col.${t}`), g.x0 + nameW + colW * (j + 0.5), g.top + 4 + hh / 2, colW - 6, hh - 2, { size: 13, role: "ink2", weight: 800 }));
    let yy = g.top + 4 + hh;
    card.forEach((fid, i) => {
      const here = i === s.w.next && !s.done, rhh = s.done ? doneRow : here ? cur : other, r = s.w.res[i] ? s.w.res[i].split(",") : null;
      if (here) P.body(c, g.x0 + 3, yy, g.cw - 6, rhh, { role: "panel", r: 10, seed: 80 + i, state: s.why ? "look" : "selected" });
      // done: a food that showed both is ringed (one food, more than one)
      if (s.done && r && r[0] === "yes" && r[1] === "yes") P.body(c, g.x0 + 3, yy + 2, g.cw - 6, rhh - 4, { role: "panel", r: 10, seed: 90 + i, state: "good" });
      P.textFit(c, W(`jaanch.short.${fid}`), g.x0 + nameW / 2, yy + rhh / 2, nameW - 10, rhh - 4, { size: 14, role: "ink", weight: 700 });
      (["starch", "fat"] as const).forEach((t, j) => {
        const cx0 = g.x0 + nameW + colW * j, v = r ? r[j] : here ? s.w.said[t] : "";
        if (v) { swatch(c, t, v, cx0 + 10, yy + rhh / 2, 6); P.textFit(c, W(`jaanch.res.${t}.${v}`), cx0 + 20 + (colW - 22) / 2, yy + rhh / 2, colW - 24, rhh - 4, { size: 13, role: v === "yes" ? "ink" : "ink2", weight: 800 }); return; }
        if (!here) return;
        const bw = (colW - 12) / 2;
        (["yes", "no"] as const).forEach((vv, k) => button(c, `mark-${t}:${vv}`, cx0 + 4 + k * (bw + 4), yy + 2, bw, rhh - 4, W(`jaanch.yn.${vv}`), { role: "q1", look: !!s.why && s.m === `${t}:${vv}`, size: 14 }));
        if (s.why === "test_other") { P.stroke(c, [[cx0 + 2, yy], [cx0 + colW - 2, yy], [cx0 + colW - 2, yy + rhh], [cx0 + 2, yy + rhh]], { role: "look", width: 2, dash: [4, 3], closed: true }); P.magnifier(c, cx0 + colW - 10, yy + 4, 12); }
      });
      yy += rhh;
    });
    // the bench: the dish and the iodine (left), the paper (right)
    const by = g.top + gridH + g.gap, tools = g.bottom - g.btnH, bh = tools - g.gap - by, half = (g.cw - g.gap) / 2;
    if (!s.done) {
      P.body(c, g.x0, by, half, bh, { role: "panel", r: 12, seed: 7 });
      P.body(c, g.x0 + half + g.gap, by, half, bh, { role: "panel", r: 12, seed: 8 });
      const bw = Math.min(58, half * 0.36), bth = Math.min(84, bh - 46);
      const starchLook = !!s.why && (s.m.startsWith("starch:") || s.why === "few_drops");
      dish(c, id, g.x0 + 2, by + 24, half - bw - 6, bh - 40, s.w.drops, starchLook && s.why !== "few_drops");
      bottle(c, g.x0 + half - bw - 6, by + bh - bth - 20, bw, bth, "jaanch.bottle1");
      pips(c, g.x0 + (half - bw) / 2, by + bh - 10, DROPMAX, s.w.drops, FEW);
      const px = g.x0 + half + g.gap + 8, pw = half - 16, ph = bh - 46;
      paperBeat(c, id, px, by + 26, pw, ph);
      pips(c, px + pw / 2, by + bh - 10, DRY, s.w.dry, DRY);
    }
    const tw = (g.cw - 3 * g.gap) / 4;
    button(c, "tool-drop", g.x0, tools, tw, g.btnH, W("jaanch.tool.drop1"), { role: "q2", on: fresh() && last.kind === "drop", size: 13 });
    const ts: [string, string][] = [["rub", isLiquid(id) ? "jaanch.tool.rubdrop1" : "jaanch.tool.rub1"], ["wait", "jaanch.tool.wait"], ["light", "jaanch.tool.light1"]];
    ts.forEach(([m, k], i) => button(c, `tool-${m}`, g.x0 + (i + 1) * (tw + g.gap), tools, tw, g.btnH, W(k), { role: "q2", on: fresh() && last.kind === "use" && last.m === m, look: (s.why === "not_dry" && m === "wait") || (s.why === "hold_light" && m === "light"), size: 13 }));
  }

  function draw(c: Ctx): void {
    const g = geo();
    if (goal === "iodine") drawIodine(c, g);
    else if (goal === "kaagaz") drawKaagaz(c, g);
    else drawDono(c, g);
  }

  /** a name filled into the middle of an English sentence is lower case ("the cut potato") */
  const food = (id: FoodId) => W(`jaanch.food.${id}`);
  function goalLine(): string {
    const s = st();
    if (s.done) return W(`jaanch.done.${goal}`);
    if (s.why) return W(`jaanch.why.${s.why}`);
    const id = foodAt(p, s.w), wd = s.w;
    const starchLine = () => (wd.drops === 0 ? W("jaanch.goal.drop", { food: food(id) }) : wd.drops < FEW ? W("jaanch.goal.more") : W("jaanch.goal.starch"));
    const fatLine = () => (!wd.rubbed ? W(isLiquid(id) ? "jaanch.goal.rubdrop" : "jaanch.goal.rub", { food: food(id) }) : wd.dry < DRY ? W("jaanch.goal.wait") : !wd.lit ? W("jaanch.goal.light") : W("jaanch.goal.fat"));
    if (goal === "iodine") return starchLine();
    if (goal === "kaagaz") return fatLine();
    if (wd.said.starch && wd.said.fat) return W("jaanch.goal.next");
    if (!wd.said.starch && !wd.said.fat && wd.drops === 0 && !wd.rubbed) return W("jaanch.goal.dono", { food: food(id) });
    if (!wd.said.fat && (wd.rubbed || wd.said.starch)) return fatLine();
    return starchLine();
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [{ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) }];
    // never "your move": no button hints which act is right
    if (goal === "dono") out.push({ id: "next", label: W("jaanch.next"), aria: W("jaanch.next"), kind: "primary", group: "go", onPress: () => act({ kind: "next" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal: goalLine, readouts, controls, react };
  return view;
};
