// Nishana · land it on the line, the view (DESIGN.md §3.3). A long line with its ticks; the child drags a pod along it
// (a loupe magnifies the ticks under the finger) and says "Yahan!". The pod drops, the truth flag rises at the computed
// position, and the exact gap is drawn between them in the value's own form. Compare: two pods, both landed, then which
// is smaller. No snapping (labelled ticks would become the answer), no timer.
import type { LineAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { withAlpha, type Role } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { lineHelpers as H, type LineParams, type LineState } from "./line.logic.ts";

export const makeLineView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<LineParams, LineState, LineAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, n = p.values.length, cmpGoal = p.goal === "compare", roundGoal = p.goal === "round";
  const ROLE: Role[] = ["q2", "q3"];
  let W = 1, Hh = 1, x0 = 30, x1 = 330, ly = 300;
  let sel = 0;
  let drag: { which: number; x: number } | null = null;
  const shownX: (number | null)[] = p.values.map(() => null);   // displayed pod positions (line units), springing to the mark
  let landAt = -1, solvedAt = -1, looks = 0, truthAt = -1, truthFor: boolean[] = p.values.map(() => false);
  let orderLookAt = -1;   // compare: a wrong "which is smaller" draws the line's own answer (further left is smaller)
  const span = p.hi - p.lo;

  const st = () => ctl.state;
  const toPx = (v: number) => x0 + ((v - p.lo) / span) * (x1 - x0);
  const toV = (px: number) => p.lo + ((px - x0) / (x1 - x0)) * span;
  const markOf = (i: number) => (drag && drag.which === i ? drag.x : st().marks[i]);

  function layout(w: number, h: number): void {
    W = w; Hh = h;
    // the margin holds half the widest end label (a "1,00,000" under the last tick must not leave the box)
    const endLabel = Math.max(tickLabel(p.lo).length, tickLabel(p.hi).length) * 10 * 0.62 + 8;
    const m = Math.max(clamp(w * 0.07, 26, 60), endLabel), lw = Math.min(w - m * 2, 980);
    x0 = (w - lw) / 2; x1 = x0 + lw; ly = clamp(h * 0.58, 160, h - 90);
  }

  function act(a: LineAct): void { ctl.dispatch(a); deps.changed(); }

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as LineAct | undefined;
    const now = api.t;
    if (last?.kind === "place" && !refused) api.sfx("slide");
    // a commit always lands the pod and raises the truth flags (a miss is the law's answer, not a refusal to look)
    if (last?.kind === "commit" && refused !== "place_first") {
      landAt = now; truthAt = now + 0.18; api.sfx("land"); api.fx.shake(2);
      truthFor = p.values.map(() => true);
      const i = 0, mx = st().marks[i]; if (mx !== null) api.fx.burst(toPx(mx), ly, { n: 8, color: api.P.color("ink3"), speed: 90, life: 0.4, size: 3, kind: "dust", up: 60 });
    }
    for (const m of ms) {
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") { looks = now + 1.4; setTimeout(() => api.sfx("look"), 200); }
      if (cmpGoal && last?.kind === "order" && (m.kind === "misconception_consequence" || (m.kind === "law_refused" && m.facts.why === "look_again"))) orderLookAt = now;
      if (m.kind === "progress" && m.facts.landed === "both") setTimeout(() => api.sfx("good", 1), 220);
      if (m.kind === "solved") { solvedAt = now; setTimeout(() => { api.sfx("good"); }, 200); api.fx.flash(api.P.color("good"), 0.06); const mx = st().marks[0] ?? 0; api.fx.burst(toPx(mx), ly - 40, { n: 14, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" }); }
    }
    if (last?.kind === "undo") truthFor = p.values.map(() => false);
    api.invalidate(); deps.changed();
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) return;
    if (kind === "down") {
      const id = api.hit(x, y);
      if (id?.startsWith("pod:")) sel = Number(id.slice(4));
      else if (id !== "line") return;
      drag = { which: sel, x: clamp(toV(x), p.lo, p.hi) }; ctl.finger(true); api.sfx("select");
    } else if (kind === "move" && drag) drag.x = clamp(toV(x), p.lo, p.hi);
    else if ((kind === "up" || kind === "cancel") && drag) {
      const d = drag; drag = null; ctl.finger(false);
      act({ kind: "place", which: d.which, x: +d.x.toFixed(4) });
      if (cmpGoal && st().marks[1 - d.which] === null) sel = 1 - d.which;
    }
    // the DOM chrome (goal, controls) only changes on a press or a release, never on a move: re-rendering it on every
    // pointermove cost a React pass per frame while the pod was dragged
    api.invalidate(); if (kind !== "move") deps.changed();
  }

  function update(dt: number): void {
    const k = 1 - Math.pow(0.0004, dt);
    for (let i = 0; i < n; i++) { const m = markOf(i); if (m === null) { shownX[i] = null; continue; } shownX[i] = shownX[i] === null || drag?.which === i ? m : lerp(shownX[i]!, m, k); }
  }
  const busy = () => !!drag || shownX.some((v, i) => v !== null && Math.abs(v - (markOf(i) ?? v)) > span * 0.0005) || looks > api.t || (landAt >= 0 && api.t - landAt < 1) || (solvedAt >= 0 && api.t - solvedAt < 0.8);

  /** a pod is a pill wide enough for its value at 17 px mono (a "1,208" never squeezes into a 44 px circle) */
  const podW = (i: number) => Math.max(44, p.values[i].text.length * 17 * 0.62 + 18);
  function tickLabel(v: number): string { return p.values[0].form === "decimal" ? H.fmt(v) : p.values[0].form === "whole" && Math.abs(v) >= 1000 ? H.fmtWhole(v) : String(+v.toFixed(3)); }
  // The line and its ticks never change during a level: painted once into a band-sized offscreen canvas per box size and
  // art, blitted every frame (a drag repaints every frame; 60+ tick strokes each frame cost the most there). The labels
  // stay live (they are audited every frame). The loupe keeps drawing vector ticks (sharp at 2.5×).
  let band: { key: string; cv: HTMLCanvasElement; x: number; y: number; w: number; h: number } | null = null;
  function tickBand(): typeof band {
    if (typeof document === "undefined") return null;
    const key = `${W}x${Hh}@${api.dpr}:${api.art.id}:${x0}:${ly}`;
    if (band?.key === key) return band;
    const bx = Math.floor(x0 - 24), by = Math.floor(ly - 30), bw = Math.ceil(x1 - x0 + 48), bh = 52, d = api.dpr;
    const cv = band?.cv ?? document.createElement("canvas");
    cv.width = Math.max(1, Math.round(bw * d)); cv.height = Math.max(1, Math.round(bh * d));
    const g = cv.getContext("2d"); if (!g) return null;
    g.setTransform(d, 0, 0, d, -bx * d, -by * d); g.clearRect(bx, by, bw, bh);
    strokesOfLine(g, 0, 0, 1);
    band = { key, cv, x: bx, y: by, w: bw, h: bh };
    return band;
  }
  function strokesOfLine(c: CanvasRenderingContext2D, cx: number, cy: number, zoom: number): void {
    const P = api.P;
    const px = (v: number) => (toPx(v) - cx) * zoom + cx, y = (ly - cy) * zoom + cy;
    P.stroke(c, [[px(p.lo) - 10, y], [px(p.hi) + 10, y]], { role: "ink", width: 3 });
    if (p.minor > 0) for (let v = p.lo; v <= p.hi + 1e-9; v += p.minor) P.stroke(c, [[px(v), y - 7], [px(v), y + 7]], { role: "ink3", width: 1.5, seed: Math.round(v * 100) });
    const nMaj = Math.round(span / p.major);
    for (let k = 0; k <= nMaj; k++) { const X = px(p.lo + k * p.major); P.stroke(c, [[X, y - 13], [X, y + 13]], { role: "ink", width: 2.5, seed: k }); }
  }
  function drawLine(c: CanvasRenderingContext2D, cx = 0, cy = 0, zoom = 1, clipR = 0): void {
    const P = api.P;
    if (!clipR && zoom === 1) {
      const b = tickBand();
      if (b) {
        c.drawImage(b.cv, b.x, b.y, b.w, b.h);
        const nMaj = Math.round(span / p.major);
        for (let k = 0; k <= nMaj; k++) { const show = p.labels === "all" || p.labels === "major" || k === 0 || k === nMaj; if (show) P.text(c, tickLabel(p.lo + k * p.major), toPx(p.lo + k * p.major), ly + 30, { size: 16, weight: 700, font: "mono", role: "ink2" }); }
        if (roundGoal) { const X = toPx((p.lo + p.hi) / 2); P.stroke(c, [[X, ly - 26], [X, ly + 18]], { role: "look", width: 2, dash: [4, 4] }); P.text(c, say(lang, "line.half"), X, ly - 38, { size: 14, role: "look", weight: 700 }); }
        return;
      }
    }
    const px = (v: number) => (toPx(v) - cx) * zoom + cx, y = (ly - cy) * zoom + cy;
    if (clipR) { c.save(); c.beginPath(); c.arc(cx, cy, clipR, 0, Math.PI * 2); c.clip(); P.veil(c, cx - clipR, cy - clipR, clipR * 2, clipR * 2, api.art.dark ? 0.92 : 0.96); }
    P.stroke(c, [[px(p.lo) - 10, y], [px(p.hi) + 10, y]], { role: "ink", width: 3 });
    if (p.minor > 0) for (let v = p.lo; v <= p.hi + 1e-9; v += p.minor) P.stroke(c, [[px(v), y - 7], [px(v), y + 7]], { role: "ink3", width: 1.5, seed: Math.round(v * 100) });
    const nMaj = Math.round(span / p.major);
    for (let k = 0; k <= nMaj; k++) {
      const v = p.lo + k * p.major, X = px(v);
      P.stroke(c, [[X, y - 13], [X, y + 13]], { role: "ink", width: 2.5, seed: k });
      const show = p.labels === "all" || p.labels === "major" || k === 0 || k === nMaj;
      if (show && !clipR) P.text(c, tickLabel(v), X, y + 30, { size: 16, weight: 700, font: "mono", role: "ink2" });
    }
    // the round goal's halfway mark: the one landmark that decides up or down (labelled, taller, dashed)
    if (roundGoal && !clipR) {
      const X = px((p.lo + p.hi) / 2);
      P.stroke(c, [[X, y - 26], [X, y + 18]], { role: "look", width: 2, dash: [4, 4] });
      P.text(c, say(lang, "line.half"), X, y - 38, { size: 14, role: "look", weight: 700 });
    }
    if (clipR) c.restore();
  }

  function drawPod(c: CanvasRenderingContext2D, i: number, v: number, lifted: boolean, look: boolean): void {
    const P = api.P, X = toPx(v), role = ROLE[i];
    const lift = lifted ? 14 : 0, dropK = landAt >= 0 ? ease.back(clamp((api.t - landAt) / 0.3, 0, 1)) : 1;
    const hy = ly - 54 - i * 58 - lift + (1 - dropK) * -10;   // the second pod rides higher so close values never hide each other
    P.stroke(c, [[X, ly - 4], [X, hy + 18]], { role, width: 3 });
    const pw = podW(i);
    P.body(c, X - pw / 2, hy - 22, pw, 44, { role, r: 22, state: sel === i && !st().done ? "selected" : look ? "look" : "idle", lift: lift * 0.3 });
    P.text(c, p.values[i].text, X, hy, { size: 17, weight: 800, font: "mono", on: role });
    api.target(`pod:${i}`, X - Math.max(26, pw / 2 + 4), hy - 26, Math.max(52, pw + 8), 52 + (ly - hy));
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, now = api.t, s = st();
    drawLine(c);
    api.target("line", x0 - 20, ly - 60, x1 - x0 + 40, 120);
    // after a wrong order: an arrow under the line from the right-hand pod to the left-hand one, "smaller" at its head
    if (cmpGoal && orderLookAt >= 0 && s.marks.every((m) => m !== null)) {
      const k = clamp((now - orderLookAt) / 0.5, 0, 1), xs = (s.marks as number[]).map((m) => toPx(m)), xl = Math.min(...xs), xr = Math.max(...xs), ay = ly + 56;
      if (xr - xl > 24) {
        const xh = xr - (xr - xl) * ease.out(k);
        P.stroke(c, [[xr, ay], [xh, ay]], { role: "look", width: 3 });
        P.stroke(c, [[xh + 10, ay - 7], [xh, ay], [xh + 10, ay + 7]], { role: "look", width: 3 });
        if (k >= 1) P.text(c, say(lang, "line.leftSmaller"), clamp(xl, 40, W - 40), ay + 22, { size: 15, weight: 700, role: "look" });
        if (k < 1) api.invalidate();
      }
    }
    // the truth flags (after a commit) and the exact gaps
    if (truthAt >= 0) p.values.forEach((v, i) => {
      if (!truthFor[i]) return;
      const k = clamp((now - truthAt) / 0.35, 0, 1); if (k <= 0) return;
      const tv = H.valueOf(v), X = toPx(tv), top = ly - 26 - (70 + i * 58) * ease.out(k), mk = s.marks[i];
      const hit = mk !== null && Math.abs(mk - tv) <= p.tol;
      P.stroke(c, [[X, ly], [X, top]], { role: hit ? "good" : "ink2", width: 2.5 });
      P.stroke(c, [[X, top], [X + 22, top + 7], [X, top + 14]], { role: hit ? "good" : "ink2", width: 2.5, closed: true });
      if (mk !== null && !hit && !drag) {
        const a = toPx(mk), yy = ly + 52 + i * 34;
        P.stroke(c, [[a, yy - 8], [a, yy + 8]], { role: "look", width: 2 }); P.stroke(c, [[X, yy - 8], [X, yy + 8]], { role: "look", width: 2 });
        P.stroke(c, [[a, yy], [X, yy]], { role: "look", width: 2, dash: [5, 4] });
        const gi = H.gapInfo(v, mk);
        P.chip(c, say(lang, gi.exact ? "line.gap" : "line.gapAbout", { g: gi.g }), clamp((a + X) / 2, 90, W - 90), yy + 22, { size: 14, role: "look", font: "ui" });
      }
      if (hit && (s.done || s.landed)) P.tick(c, X + 30, top - 2, 18, clamp((now - truthAt - 0.3) / 0.3, 0, 1));
    });
    for (let i = 0; i < n; i++) { const v = shownX[i]; if (v !== null) drawPod(c, i, v, drag?.which === i, looks > now); }
    // unplaced pods wait in the dock above the line
    for (let i = 0; i < n; i++) if (shownX[i] === null) {
      const X = n === 1 ? W / 2 : W / 2 + (i ? 60 : -60), y = clamp(ly - 150, 40, ly - 90);
      const pw = Math.max(52, podW(i));
      P.body(c, X - pw / 2, y - 26, pw, 52, { role: ROLE[i], r: 26, state: sel === i ? "selected" : "idle" });
      P.text(c, p.values[i].text, X, y, { size: 17, weight: 800, font: "mono", on: ROLE[i] });
      api.target(`pod:${i}`, X - pw / 2 - 2, y - 28, pw + 4, 56);
    }
    // the loupe: ticks under the finger, 2.5×, above it
    if (drag && !api.reduced) {
      const X = toPx(drag.x), R = 46, cx = clamp(X, R + 4, W - R - 4), cy = ly - 140;
      c.save(); c.translate(cx - X * 1, 0); c.restore();
      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
      P.veil(c, cx - R, cy - R, R * 2, R * 2, api.art.dark ? 0.94 : 0.97);
      c.translate(cx, cy); c.scale(2.5, 2.5); c.translate(-X, -ly);
      drawLine(c);
      P.stroke(c, [[X, ly - 16], [X, ly + 16]], { role: ROLE[drag.which], width: 1.4 });
      c.restore();
      P.circle(c, cx, cy, R, { role: "ink3", width: 2 });
    }
    void withAlpha;
  }

  const unitWord = (to: number) => say(lang, to >= 10000 ? "line.u10000" : to >= 1000 ? "line.u1000" : to >= 100 ? "line.u100" : "line.u10");
  function goal(): string {
    if (roundGoal) return st().landed ? say(lang, "line.goal.round2", { t: unitWord(p.to ?? 100) }) : say(lang, "line.goal.round", { v: p.values[0].text });
    if (cmpGoal) return say(lang, "line.goal.cmp");
    return say(lang, "line.goal", { v: p.values[0].text });
  }
  function readouts(): Readout[] { return []; }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    const step = (p.minor > 0 ? p.minor : p.major) / 4;
    const cur = s.marks[sel];
    if (cmpGoal) out.push({ id: `sel-${1 - sel}`, label: `${p.values[sel].text} ⇄ ${p.values[1 - sel].text}`, aria: "switch marker", kind: "pad", group: "nudge", onPress: () => { sel = 1 - sel; api.sfx("select"); api.invalidate(); deps.changed(); } });
    out.push({ id: "nudge-left", label: "◀", aria: "move left a little", kind: "pad", group: "nudge", disabled: cur === null, onPress: () => cur !== null && act({ kind: "place", which: sel, x: +(cur - step).toFixed(4) }) });
    out.push({ id: "nudge-right", label: "▶", aria: "move right a little", kind: "pad", group: "nudge", disabled: cur === null, onPress: () => cur !== null && act({ kind: "place", which: sel, x: +(cur + step).toFixed(4) }) });
    if (roundGoal && s.landed) {
      for (const end of [p.lo, p.hi]) out.push({ id: `round-${end}`, label: `${end === p.lo ? "↓" : "↑"} ${H.fmtWhole(end)}`, kind: "choice", group: "order", onPress: () => act({ kind: "round", to: end }) });
      out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
      return out;
    }
    if (cmpGoal && s.landed) {
      for (const i of [0, 1]) out.push({ id: `order-${i}`, label: say(lang, "line.smaller", { v: p.values[i].text }), kind: "choice", group: "order", onPress: () => act({ kind: "order", first: i }) });
      out.push({ id: "order-same", label: say(lang, "strips.same"), kind: "choice", group: "order", onPress: () => act({ kind: "order", first: -1 }) });
    }
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    if (!(cmpGoal && s.landed)) out.push({ id: "commit", label: say(lang, "line.here"), kind: "primary", group: "go", you: s.marks.every((m) => m !== null), disabled: s.marks.some((m) => m === null), onPress: () => act({ kind: "commit" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  void Hh;
  return view;
};
