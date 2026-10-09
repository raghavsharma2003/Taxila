// Taraazu · the balance, the view (DESIGN.md §3.2). A real beam on a pivot with a damped spring: every take tips it by
// the TRUE weights (the bags hold x cubes; nobody sees inside), so a one-sided take is answered by the beam itself, and
// the matching take on the other pan brings it level again with a soft landing. The bag opens only alone on a level
// scale and spills its cubes. Fill mode (class 4-5 "="): the right pan's empty box takes the number the child chooses,
// the cubes drop in, and the beam says whether both sides are the same.
import type { BalanceAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { withAlpha } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { balanceHelpers as H, type BalanceParams, type BalanceState, type Pan } from "./balance.logic.ts";

interface Box { x: number; y: number; w: number; h: number }
interface Fly { x0: number; y0: number; x1: number; y1: number; t0: number; kind: "unit" | "bag"; up: boolean }

export const makeBalanceView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<BalanceParams, BalanceState, BalanceAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, fill = p.goal === "fill";
  let W = 1, Hh = 1;
  let pivot = { x: 0, y: 0 }, half = 140, hang = 80, panW = 160, unit = 20, bagS = 50;
  let ang = 0, vel = 0;                   // displayed beam angle (rad) and its velocity
  let pad = "", naming = false;
  const flies: Fly[] = [];
  let looks = 0, openAt = -1, solvedAt = -1, landAt = -1;
  let lastTilt = 0;

  const st = () => ctl.state;
  const tiltNow = () => H.tilt(level, st());
  const MAXA = 0.16;

  function layout(w: number, h: number): void {
    W = w; Hh = h;
    const wide = w >= 700;
    // the pans must stay inside the box even at full tilt: half + panW/2 ≤ w/2 − 8
    panW = clamp(w * (wide ? 0.26 : 0.37), 124, 280);
    half = Math.min(w * (wide ? 0.3 : 0.42), w / 2 - panW / 2 - 8);
    hang = clamp(h * 0.14, 56, 120);
    pivot = { x: w / 2, y: clamp(h * 0.3, 90, 230) };
    unit = clamp(panW / 8.5, 14, 26);
    bagS = clamp(panW / 3.4, 44, 64);
  }
  function endOf(side: -1 | 1, a = ang): { x: number; y: number } { return { x: pivot.x + side * half * Math.cos(a), y: pivot.y + side * half * Math.sin(a) }; }
  function panAt(side: -1 | 1): Box { const e = endOf(side); return { x: e.x - panW / 2, y: e.y + hang, w: panW, h: 10 }; }

  /** where each item sits on a pan (bags first, then the unit cubes in rows) */
  function items(pan: Pan, box: Box, extra?: { boxN: number | null }): { bags: Box[]; units: Box[]; boxB?: Box } {
    const bags: Box[] = [], units: Box[] = [];
    let x = box.x + 8; const base = box.y;
    for (let i = 0; i < pan.bags; i++) { bags.push({ x, y: base - bagS * 1.05, w: bagS, h: bagS * 1.05 }); x += bagS + 6; }
    let boxB: Box | undefined;
    if (extra) { boxB = { x, y: base - bagS * 0.9, w: bagS * 1.1, h: bagS * 0.9 }; x += bagS * 1.1 + 6; }
    const room = box.x + box.w - 6 - x, per = Math.max(2, Math.floor(room / (unit + 2)));
    for (let i = 0; i < pan.units; i++) { const r = Math.floor(i / per), c = i % per; units.push({ x: x + c * (unit + 2), y: base - (r + 1) * (unit + 2), w: unit, h: unit }); }
    return { bags, units, boxB };
  }

  function act(a: BalanceAct): void {
    // the item leaves from where it sits (the fly starts from the current picture)
    if (a.kind === "take") {
      const side = a.side === "L" ? -1 : 1, it = items(st()[a.side], panAt(side as -1 | 1));
      const src = a.what === "bag" ? it.bags[it.bags.length - 1] : it.units[it.units.length - 1];
      if (src) flies.push({ x0: src.x, y0: src.y, x1: src.x + side * 30, y1: src.y - 90, t0: api.t, kind: a.what, up: true });
    }
    if (a.kind === "drop") {
      const it = items(st().R, panAt(1), { boxN: st().box }); const b = it.boxB;
      if (b) for (let k = 0; k < Math.min(a.n, 12); k++) flies.push({ x0: b.x + b.w / 2 - unit / 2, y0: b.y - 120 - k * 4, x1: b.x + b.w / 2 - unit / 2 + ((k % 3) - 1) * 8, y1: b.y + 6, t0: api.t + k * 0.035, kind: "unit", up: false });
    }
    if (a.kind === "name") naming = false;
    ctl.dispatch(a); deps.changed();
  }

  function react(ms: Moment[], refused: string | undefined): void {
    const now = api.t, t = tiltNow();
    if (t !== lastTilt) { api.sfx(t === 0 ? "land" : "tilt"); if (t === 0) landAt = now; vel += (t === 0 ? 0 : -t) * 0.9; }
    lastTilt = t;
    for (const m of ms) {
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") { looks = now + 1.4; if (m.kind !== "law_refused" || m.facts.why !== "tipped") api.sfx("look"); }
      if (m.kind === "progress" && m.facts.opened === "yes") { openAt = now; api.sfx("open"); api.fx.stop(50); }
      if (m.kind === "progress" && m.facts.groups) api.sfx("slide");
      if (m.kind === "solved") { solvedAt = now; api.sfx("good"); api.fx.flash(api.P.color("good"), 0.08); api.fx.burst(pivot.x, pivot.y, { n: 16, color: api.P.color("good"), speed: 120, life: 0.6, size: 3, kind: "spark" }); }
    }
    if (refused === "tipped" || refused === "not_alone") api.fx.shake(2);
    api.invalidate(); deps.changed();
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down" || st().done) return;
    const id = api.hit(x, y); if (!id) return;
    const [side, what] = id.split(":") as ["L" | "R", "unit" | "bag"];
    if (!fill && (side === "L" || side === "R")) act({ kind: "take", side, what });
  }

  function update(dt: number): void {
    // a damped spring toward the true tilt: k = 60, c = 9 (settles in ~0.6 s, one visible overshoot)
    const target = -tiltNow() * MAXA;
    if (api.reduced) { ang = target; vel = 0; }
    else { const acc = 60 * (target - ang) - 9 * vel; vel += acc * dt; ang += vel * dt; }
    for (let i = flies.length - 1; i >= 0; i--) if (api.t - flies[i].t0 > 0.6) flies.splice(i, 1);
  }
  const busy = () => Math.abs(ang + tiltNow() * MAXA) > 0.0015 || Math.abs(vel) > 0.003 || flies.length > 0 || looks > api.t || (openAt >= 0 && api.t - openAt < 1) || (solvedAt >= 0 && api.t - solvedAt < 0.8) || (landAt >= 0 && api.t - landAt < 0.4);

  function drawBag(c: CanvasRenderingContext2D, b: Box, label: string, alpha = 1, look = false): void {
    const P = api.P;
    c.save(); c.globalAlpha *= alpha;
    // a sack: a rounded body with a tied neck
    P.body(c, b.x, b.y + b.h * 0.22, b.w, b.h * 0.78, { role: "q3", r: b.w * 0.32, state: look ? "look" : "idle", seed: Math.round(b.x) });
    P.body(c, b.x + b.w * 0.34, b.y + b.h * 0.06, b.w * 0.32, b.h * 0.2, { role: "q3", r: 5, seed: 7 });
    P.stroke(c, [[b.x + b.w * 0.3, b.y + b.h * 0.24], [b.x + b.w * 0.7, b.y + b.h * 0.24]], { role: "ink", width: 2.5 });
    P.text(c, label, b.x + b.w / 2, b.y + b.h * 0.62, { size: clamp(b.w * 0.42, 16, 26), weight: 800, font: "display", on: "q3" });
    c.restore();
  }
  function drawUnit(c: CanvasRenderingContext2D, b: Box, alpha = 1, role: "q1" | "q2" = "q1"): void { c.save(); c.globalAlpha *= alpha; api.P.body(c, b.x, b.y, b.w, b.h, { role, r: 4, seed: Math.round(b.x * 3 + b.y) }); c.restore(); }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, now = api.t, s = st(), a = api.art;
    const look = looks > now;
    // the stand: a post and a foot
    const baseY = Math.max(pivot.y + hang + 60, Hh - (fill || level.fade < 2 ? 34 : 74));
    P.stroke(c, [[pivot.x, pivot.y], [pivot.x, baseY]], { role: "ink3", width: 6 });
    P.body(c, pivot.x - 60, baseY, 120, 14, { role: "panel", r: 7 });
    // the beam (rotated about the pivot)
    const L = endOf(-1), R = endOf(1);
    P.stroke(c, [[L.x, L.y], [R.x, R.y]], { role: "ink", width: 7 });
    P.circle(c, pivot.x, pivot.y, 9, { role: "ink", fill: true });
    // the level needle and its arc (status by shape: centred = level)
    const nx = pivot.x + Math.sin(-ang) * 0 , ny = pivot.y - 34;
    P.stroke(c, [[pivot.x - 26, pivot.y - 30], [pivot.x, pivot.y - 38], [pivot.x + 26, pivot.y - 30]], { role: "ink3", width: 2, alpha: 0.7 });
    P.stroke(c, [[pivot.x, pivot.y], [pivot.x + Math.sin(ang) * 40, pivot.y - Math.cos(ang) * 40]], { role: Math.abs(ang) < 0.01 ? "good" : "look", width: 3 });
    void nx; void ny;
    // the pans: strings, plates, items
    for (const side of [-1, 1] as const) {
      const e = side === -1 ? L : R, pb = panAt(side), key = side === -1 ? "L" : "R";
      P.stroke(c, [[e.x, e.y], [pb.x + 8, pb.y]], { role: "ink3", width: 1.5, alpha: 0.5 });
      P.stroke(c, [[e.x, e.y], [pb.x + pb.w - 8, pb.y]], { role: "ink3", width: 1.5, alpha: 0.5 });
      P.body(c, pb.x, pb.y, pb.w, pb.h, { role: "panel", r: 5 });
      const pan = s[key];
      const it = items(pan, pb, fill && side === 1 ? { boxN: s.box } : undefined);
      // the bags: at fade 1 a bag is "?", at fade 2+ it is "x"; an opened bag spills
      it.bags.forEach((b, i) => {
        const opened = s.opened && pan.bags === 1 && i === 0;
        if (opened) {
          const k = clamp((now - openAt) / 0.6, 0, 1);
          drawBag(c, { ...b, y: b.y + b.h * 0.25 * k, h: b.h * (1 - 0.25 * k) }, String(p.x), 1 - 0.5 * k);
          for (let q = 0; q < p.x; q++) { const r = Math.floor(q / 5), cc = q % 5; const tx = b.x + b.w + 6 + cc * (unit * 0.8 + 2), ty = b.y + b.h - (r + 1) * (unit * 0.8 + 2); drawUnit(c, { x: lerp(b.x + b.w / 2, tx, ease.out(k)), y: lerp(b.y + b.h / 2, ty, ease.out(k)), w: unit * 0.8, h: unit * 0.8 }, k, "q2"); }
          if (k >= 1) P.chip(c, `x = ${p.x}`, b.x + b.w / 2, b.y - 20, { size: 16, role: "good" });
        } else drawBag(c, b, level.fade >= 2 ? "x" : "?", 1, look && s.oneSided);
        if (!fill && !s.done) api.target(`${key}:bag`, b.x - 2, b.y - 2, Math.max(44, b.w + 4), Math.max(44, b.h + 4));
      });
      it.units.forEach((u) => drawUnit(c, u));
      if (it.units.length && !fill && !s.done) {
        const xs = it.units.map((u) => u.x), ys = it.units.map((u) => u.y);
        const bx = Math.min(...xs) - 3, by = Math.min(...ys) - 3, bw = Math.max(...xs) + unit + 3 - bx, bh = Math.max(...ys) + unit + 3 - by;
        api.target(`${key}:unit`, bx, Math.min(by, pb.y - 44), Math.max(44, bw), Math.max(44, bh, pb.y - by));
      }
      if (it.boxB) {
        const b = it.boxB;
        P.body(c, b.x, b.y, b.w, b.h, { role: "panel", r: 8, state: look ? "look" : s.done ? "good" : "idle" });
        P.stroke(c, [[b.x + 4, b.y + 6], [b.x + b.w - 4, b.y + 6]], { role: "ink3", width: 1.5, dash: [4, 4] });
        P.text(c, s.box === null ? "?" : String(s.box), b.x + b.w / 2, b.y + b.h / 2 + 3, { size: 20, weight: 800, font: "display", role: s.box === null ? "ink3" : "ink" });
      }
      // fill mode: the left pan's parts are shown as groups with their count (fade 2+) or as plain cubes (fade 1)
      if (fill && side === -1 && level.fade >= 2 && p.parts) P.text(c, p.parts.join(" + "), pb.x + pb.w / 2, pb.y + 30, { size: 18, weight: 700, font: "mono", role: "ink2" });
      if (fill && side === 1 && level.fade >= 2) P.text(c, `${s.box ?? "□"} + ${p.R.units}`, pb.x + pb.w / 2, pb.y + 30, { size: 18, weight: 700, font: "mono", role: "ink2" });
    }
    for (const f of flies) {
      if (now < f.t0) continue; const t = clamp((now - f.t0) / 0.6, 0, 1), e = f.up ? ease.out(t) : ease.inOut(t);
      const x = lerp(f.x0, f.x1, e), y = lerp(f.y0, f.y1, e), al = f.up ? 1 - t : 1;
      if (f.kind === "bag") drawBag(c, { x, y, w: bagS, h: bagS * 1.05 }, level.fade >= 2 ? "x" : "?", al); else drawUnit(c, { x, y, w: unit, h: unit }, al);
    }
    // the equation rides under the scale (fade 2+): it is the scale, written
    if (!fill && level.fade >= 2) {
      const eq = `${H.eqText(s.L)}  ${tiltNow() === 0 ? "=" : tiltNow() > 0 ? ">" : "<"}  ${H.eqText(s.R)}`;
      P.chip(c, eq, W / 2, Math.min(Hh - 24, baseY + 34), { size: 20, role: tiltNow() === 0 ? undefined : "look" });
    }
    if (s.done && solvedAt >= 0) P.tick(c, pivot.x + 46, pivot.y - 40, 22, clamp((now - solvedAt) / 0.3, 0, 1));
    void a; void withAlpha;
  }

  function goal(): string { return say(lang, fill ? "balance.goal.fill" : "balance.goal"); }
  function readouts(): Readout[] { return [{ k: "", v: say(lang, tiltNow() === 0 ? "balance.level" : "balance.tipped"), role: tiltNow() === 0 ? "good" : "look" }]; }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    const digits = (go: string): ControlSpec[] => [...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => ({ id: `k${d}`, label: d, kind: "pad" as const, group: "pad", onPress: () => { if (pad.length < 2) pad += d; deps.changed(); } })),
      { id: "kdel", label: "⌫", aria: "delete", kind: "pad" as const, group: "pad", onPress: () => { pad = pad.slice(0, -1); deps.changed(); } }, { id: "go", label: go, kind: "primary" as const, group: "go", you: true, disabled: !pad, onPress: () => {} }];
    if (fill) {
      const d = digits(`${say(lang, "strips.pour")} ${pad || "?"}`);
      d[d.length - 1].onPress = () => { if (pad) { act({ kind: "drop", n: Number(pad) }); pad = ""; } };
      return [...d, { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) }];
    }
    out.push({ id: "take-L-unit", label: `◀ −1`, aria: "take one cube from the left pan", kind: "secondary", group: "take", disabled: s.L.units === 0, onPress: () => act({ kind: "take", side: "L", what: "unit" }) });
    out.push({ id: "take-R-unit", label: `−1 ▶`, aria: "take one cube from the right pan", kind: "secondary", group: "take", disabled: s.R.units === 0, onPress: () => act({ kind: "take", side: "R", what: "unit" }) });
    if (s.L.bags + s.R.bags > 1) {
      out.push({ id: "take-L-bag", label: `◀ −${level.fade >= 2 ? "x" : "?"}`, aria: "take a bag from the left pan", kind: "secondary", group: "take", disabled: s.L.bags === 0, onPress: () => act({ kind: "take", side: "L", what: "bag" }) });
      out.push({ id: "take-R-bag", label: `−${level.fade >= 2 ? "x" : "?"} ▶`, aria: "take a bag from the right pan", kind: "secondary", group: "take", disabled: s.R.bags === 0, onPress: () => act({ kind: "take", side: "R", what: "bag" }) });
    }
    for (const k of [2, 3]) if ([s.L.bags, s.L.units, s.R.bags, s.R.units].every((v) => v % k === 0) && s.L.bags + s.R.bags >= k) out.push({ id: `group-${k}`, label: `${say(lang, "balance.group")} ÷${k}`, kind: "secondary", group: "act", onPress: () => act({ kind: "group", k }) });
    const alone = H.lone(s);
    if (!s.opened) out.push({ id: "open", label: say(lang, "balance.open"), kind: alone && tiltNow() === 0 ? "primary" : "secondary", group: "act", you: alone && tiltNow() === 0, onPress: () => act({ kind: "open" }) });
    if (naming) {
      const d = digits(`x = ${pad || "?"}`);
      d[d.length - 1].onPress = () => { if (pad) { act({ kind: "name", x: Number(pad) }); pad = ""; } };
      return [...d, { id: "back", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => { naming = false; pad = ""; deps.changed(); } }];
    }
    if (level.fade >= 2 || s.opened) out.push({ id: "name-x", label: say(lang, "balance.name"), kind: s.opened ? "primary" : "secondary", group: "go", you: s.opened, onPress: () => { naming = true; deps.changed(); } });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
