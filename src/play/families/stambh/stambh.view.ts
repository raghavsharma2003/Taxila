// Stambh · the 2D view (round 7). Bars: an axis with a gridline at every crate step (labelled at every step, every other
// step or only 0 and the top, by fade) and one column per category. A tap in a column drops a crate: it falls from above
// the axis under gravity, lands, settles with a small bounce. "½" drops a half crate on the picked column (only on a level
// whose step allows it), "Lift" takes the top crate off it; a tap on a category's name picks its column without dropping.
// Picto: the key ("1 icon = k") and one row per category; a tap on a row drops the next icon into it.
// The data table sits under the columns / beside the rows (diff: the given bars carry no number, the child reads them
// off the scale). No live total, no snapping, no timer: what a bar is worth is shown only AFTER a check, on each bar that
// did not match (its own reading: the consequence, never the law's answer).
import type { Moment, StambhAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { buildable, targetHalves, valueOf, type StambhParams, type StambhState } from "./stambh.logic.ts";

const G = 2200;            // px / s², the crate's fall
const BOUNCE = 0.14;       // s, the settle after landing

export const makeStambhView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<StambhParams, StambhState, StambhAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, picto = level.mode === "picto", n = p.values.length, cols = buildable(p), diff = p.goal === "diff";
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const unit = W(`stambh.unit.${p.ctx}`), catName = (i: number) => W(`stambh.cat.${p.cats[i]}`);
  let w = 300, h = 440;
  // bars geometry
  let px0 = 52, pw = 236, base = 380, ch = 30, colW = 47, bw = 30, labY = 392;
  // picto geometry
  let rowTop = 70, rowH = 60, gut = 86, slot = 22;
  let sel = cols[0];
  let checkedAt = -1, checkedH: number[] | null = null;
  const falls = new Map<number, { t0: number; d: number; land: boolean }>();
  const st = () => ctl.state;

  function layout(bw0: number, bh0: number): void {
    w = bw0; h = bh0;
    if (picto) {
      rowTop = 76;
      rowH = clamp((h - rowTop - 10) / n, 48, 84);
      gut = clamp(w * 0.28, 80, 130);
      slot = clamp(Math.min(rowH - 14, (w - gut - 14) / p.cap), 14, 44);
    } else {
      px0 = 52; pw = w - px0 - 12;
      // the name / value strip under the columns; at a level's end the controls go and the world grows under the door
      // cards, so the margin scales with the box (the cards never cover the names)
      labY = h - Math.max(50, h * 0.18);
      base = labY - 8;
      ch = clamp((base - 64) / p.cap, 12, 52);         // room above the axis for the falling crate
      colW = pw / n; bw = clamp(colW * 0.62, 22, 76);
    }
  }
  const colX = (i: number) => px0 + colW * i + colW / 2;
  const act = (a: StambhAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as StambhAct | undefined;
    if (last?.kind === "drop") {
      if (refused) { api.sfx("refuse"); api.fx.shake(2); }
      else {
        api.sfx("drop");
        const hNow = st().h[last.col];
        const d = api.reduced ? 0 : picto ? rowH * 0.7 : Math.min(180, Math.max(40, base - hNow * (ch / 2) - 24));
        if (d > 0) falls.set(last.col, { t0: api.t, d, land: false });
      }
    }
    if (last?.kind === "lift") api.sfx(refused ? "refuse" : "tap");
    if (last?.kind === "undo") { falls.clear(); checkedAt = -1; checkedH = null; api.sfx("tap"); }
    if (last?.kind === "check" && refused !== "build_first") { checkedAt = api.t; checkedH = [...st().h]; }
    for (const m of ms) {
      if (m.kind === "solved") {
        api.sfx("good");
        for (const i of cols) {
          const [x, y] = topOf(i);
          api.fx.burst(x, y, { n: 10, color: api.P.color("good"), speed: 100, life: 0.6, size: 3, kind: "spark" });
        }
      }
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") api.sfx("look");
    }
    api.invalidate(); deps.changed();
  }
  /** the point just above the top of column / row i (bursts, chips) */
  function topOf(i: number): [number, number] {
    const hh = st().h[i];
    if (picto) return [gut + 8 + (hh / 2) * slot, rowTop + rowH * i + rowH / 2];
    return [colX(i), base - (hh / 2) * ch - 14];
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down" || st().done) return;
    const id = api.hit(x, y);
    if (!id) return;
    const i = Number(id.split("-")[1]);
    if (!cols.includes(i)) return;
    if (id.startsWith("pick-")) { sel = i; api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if (id.startsWith("col-")) { sel = i; act({ kind: "drop", col: i }); }
  }
  function update(): void {
    for (const [col, f] of falls) {
      const tl = Math.sqrt((2 * f.d) / G);
      if (!f.land && api.t - f.t0 >= tl) { f.land = true; api.sfx("land"); }
      if (api.t - f.t0 >= tl + BOUNCE) falls.delete(col);
    }
  }
  /** the falling crate's offset above its resting place, px (0 once settled) */
  function fallOff(col: number): number {
    const f = falls.get(col);
    if (!f) return 0;
    const t = api.t - f.t0, tl = Math.sqrt((2 * f.d) / G);
    if (t < tl) return f.d - 0.5 * G * t * t;
    const u = (t - tl) / BOUNCE;
    return u < 1 ? Math.sin(Math.PI * u) * Math.min(6, f.d * 0.05) : 0;
  }
  const busy = () => falls.size > 0 || (checkedAt >= 0 && api.t - checkedAt < 0.5);
  const showCheck = () => { const s = st(); return checkedH !== null && checkedH.every((v, i) => v === s.h[i]); };

  // ── icons (picto): one simple shape per context, drawn in the quantity hue; a half icon is its left half ──
  function icon(c: CanvasRenderingContext2D, x: number, y: number, s: number, frac: number, role: "q1" | "q2"): void {
    const P = api.P, col = P.color(role), r = s / 2, cx = x + r, cy = y + r;
    c.save();
    if (frac < 1) { c.beginPath(); c.rect(x - 1, y - 1, s * frac + 1, s + 2); c.clip(); }
    c.fillStyle = col; c.strokeStyle = P.color("ink2"); c.lineWidth = 1.2;
    c.beginPath();
    if (p.ctx === "sport") { c.arc(cx, cy, r * 0.9, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(cx - r * 0.9, cy, r * 0.75, -0.9, 0.9); c.stroke(); }
    else if (p.ctx === "mango") { c.ellipse(cx, cy + r * 0.08, r * 0.62, r * 0.88, 0.5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(cx + r * 0.1, cy - r * 0.75); c.lineTo(cx + r * 0.55, cy - r * 0.95); c.stroke(); }
    else if (p.ctx === "trees") { c.moveTo(cx, y + s * 0.04); c.lineTo(x + s * 0.92, y + s * 0.72); c.lineTo(x + s * 0.08, y + s * 0.72); c.closePath(); c.fill(); c.fillRect(cx - s * 0.08, y + s * 0.72, s * 0.16, s * 0.26); }
    else if (p.ctx === "books") { c.rect(x + s * 0.14, y + s * 0.08, s * 0.72, s * 0.84); c.fill(); c.beginPath(); c.moveTo(x + s * 0.3, y + s * 0.1); c.lineTo(x + s * 0.3, y + s * 0.9); c.stroke(); }
    else { c.arc(cx, y + s * 0.26, s * 0.2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(cx, y + s * 0.8, s * 0.36, s * 0.3, 0, Math.PI, 0); c.fill(); }
    c.restore();
  }

  function drawBars(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), top = base - ch * p.cap, checked = showCheck(), t = targetHalves(p);
    // gridlines and the axis labels (fade: every step, every other step, only 0 and the top)
    for (let k = 0; k <= p.cap; k++) {
      const y = base - k * ch;
      if (k > 0) P.stroke(c, [[px0, y], [px0 + pw, y]], { role: "ink3", width: 1, alpha: 0.45 });
      // a box too short for a 14 px label at every step labels every other step instead (never fewer than the fade asks)
      const every = p.labels === 1 && ch >= 17 ? 1 : p.labels <= 2 ? 2 : 0;
      const lab = k === 0 || k === p.cap || (every > 0 && k % every === 0 && (k === p.cap || (p.cap - k) * ch >= 17));
      if (lab) P.text(c, String(k * p.step), px0 - 8, y, { size: 14, role: "ink2", font: "mono", align: "right" });
      P.stroke(c, [[px0 - 4, y], [px0, y]], { role: "ink2", width: 1.5 });
    }
    P.stroke(c, [[px0, top - 6], [px0, base]], { role: "ink", width: 2 });
    P.stroke(c, [[px0, base], [px0 + pw, base]], { role: "ink", width: 2.5 });
    for (let i = 0; i < n; i++) {
      const x = colX(i), fixed = !cols.includes(i), hh = s.h[i];
      if (!fixed) api.target(`col-${i}`, px0 + colW * i, top - 40, colW, base - top + 40);
      if (!fixed && !s.done && i === sel && cols.length > 1) P.stroke(c, [[x - bw / 2, base + 3], [x + bw / 2, base + 3]], { role: "you", width: 4 });
      const role = fixed ? "q2" : "q1";
      const whole = Math.floor(hh / 2), half = hh % 2;
      for (let k = 0; k < whole + half; k++) {
        const isHalf = k === whole, hc = isHalf ? ch / 2 : ch;
        const topIdx = k === whole + half - 1;
        const off = topIdx ? fallOff(i) : 0;
        const y = base - k * ch - hc - off;
        P.body(c, x - bw / 2, y + 1, bw, hc - 2, { role, r: Math.min(5, hc * 0.2), seed: i * 31 + k });
        if (hc > 16) P.stroke(c, [[x - bw / 2 + 4, y + 4], [x + bw / 2 - 4, y + hc - 5]], { role: "ink3", width: 1, alpha: 0.5 });
      }
      // the data table, merged into the axis: the name, then the value to build (diff: "?" on the bar to build only)
      api.target(`pick-${i}`, px0 + colW * i, labY - 4, colW, 52);
      P.textFit(c, catName(i), x, labY + 10, colW - 4, 20, { size: 16, role: fixed ? "ink2" : "ink", weight: 700 });
      const v = diff ? (fixed ? "" : "?") : String(p.values[i]);
      if (v) P.text(c, v, x, labY + 32, { size: 16, role: "ink2", font: "mono", weight: 700 });
      if (checked && !fixed) {
        const yTop = base - (hh / 2) * ch;
        if (hh === t[i]) P.tick(c, x, yTop - 16, 18, clamp((api.t - checkedAt) / 0.3, 0, 1));
        else {
          P.stroke(c, [[x - bw / 2 - 3, base], [x - bw / 2 - 3, yTop - 3], [x + bw / 2 + 3, yTop - 3], [x + bw / 2 + 3, base]], { role: "look", width: 2.5, dash: [5, 4] });
          P.chip(c, String(valueOf(hh, p.step)), x, Math.max(top - 2, yTop - 18), { size: 14, role: "look" });
        }
      }
    }
  }
  function drawPicto(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), checked = showCheck(), t = targetHalves(p);
    // the key: one icon = k
    const ks = 26;
    icon(c, 14, 44, ks, 1, "q1");
    P.text(c, `= ${p.step} ${unit}`, 14 + ks + 8, 44 + ks / 2, { size: 16, role: "ink", weight: 700, align: "left" });
    for (let i = 0; i < n; i++) {
      const y0 = rowTop + rowH * i, cy = y0 + rowH / 2, hh = s.h[i];
      if (i > 0) P.stroke(c, [[10, y0], [w - 10, y0]], { role: "ink3", width: 1, alpha: 0.35 });
      api.target(`pick-${i}`, 0, y0, gut, rowH);
      api.target(`col-${i}`, gut, y0, w - gut, rowH);
      if (!s.done && i === sel) P.stroke(c, [[6, y0 + 8], [6, y0 + rowH - 8]], { role: "you", width: 4 });
      P.textFit(c, catName(i), 14 + (gut - 18) / 2, cy - 11, gut - 18, 20, { size: 16, role: "ink", weight: 700 });
      P.text(c, String(p.values[i]), 14 + (gut - 18) / 2, cy + 12, { size: 16, role: "ink2", font: "mono", weight: 700 });
      // slot guides (fade 1: every slot; fade 2: a faint line; fade 3: none)
      const sy = cy - slot / 2;
      if (p.labels === 1) for (let k = 0; k < p.cap; k++) P.circle(c, gut + 8 + k * slot + slot / 2, cy, slot * 0.38, { role: "ink3", width: 1, alpha: 0.35 });
      else if (p.labels === 2) P.stroke(c, [[gut + 8, cy + slot / 2 + 3], [gut + 8 + p.cap * slot, cy + slot / 2 + 3]], { role: "ink3", width: 1, alpha: 0.4 });
      const whole = Math.floor(hh / 2), half = hh % 2;
      for (let k = 0; k < whole + half; k++) {
        const off = k === whole + half - 1 ? fallOff(i) : 0;
        icon(c, gut + 8 + k * slot + 1, sy + 1 - off, slot - 2, k === whole ? 0.5 : 1, "q1");
      }
      if (checked) {
        const xe = gut + 8 + (hh / 2) * slot;
        if (hh === t[i]) P.tick(c, Math.min(w - 16, xe + 14), cy, 16, clamp((api.t - checkedAt) / 0.3, 0, 1));
        else P.chip(c, String(valueOf(hh, p.step)), Math.min(w - 30, xe + 26), cy, { size: 14, role: "look" });
      }
    }
  }
  function draw(c: CanvasRenderingContext2D): void {
    api.P.textFit(c, W(`stambh.ctx.${p.ctx}`), w / 2, 16, w - 24, 24, { size: 16, role: "ink2", weight: 700 });
    if (picto) drawPicto(c); else drawBars(c);
  }

  function goal(): string {
    if (diff) return W(p.more ? "stambh.goal.more" : "stambh.goal.fewer", { a: catName(p.build ?? 0), b: catName(p.of ?? 0), n: p.n ?? 0, u: unit });
    return W(picto ? "stambh.goal.picto" : "stambh.goal.bars");
  }
  // no live readout: a running total of a bar IS the answer the scale is there to give
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const any = cols.some((i) => s.h[i] > 0), cur = s.h[sel] ?? 0;
    const out: ControlSpec[] = [];
    // a visible drop for the selected column (tapping a column drops too): a crate, or one picture
    out.push({ id: "drop", label: W("stambh.drop"), aria: picto ? "add a picture" : "drop a crate", kind: "pad", group: "stack", disabled: cur % 2 === 1 || cur + 2 > 2 * p.cap, onPress: () => act({ kind: "drop", col: sel }) });
    if (p.half) out.push({ id: "half", label: `½ ${W("stambh.half")}`, aria: "drop a half crate", kind: "pad", group: "stack", disabled: cur % 2 === 1 || cur + 1 > 2 * p.cap, onPress: () => act({ kind: "drop", col: sel, half: true }) });
    out.push({ id: "lift", label: W("stambh.lift"), aria: "lift the top crate", kind: "pad", group: "stack", disabled: cur === 0, onPress: () => act({ kind: "lift", col: sel }) });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    out.push({ id: "done", label: W("stambh.check"), kind: "primary", group: "go", you: any, disabled: !any, onPress: () => act({ kind: "check" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
