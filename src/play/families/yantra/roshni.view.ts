// Yantra · roshni, the 2D view (round 7: sources of light and materials, class 7 science). A light bench: a lane per thing,
// top to bottom. In each lane the thing (its icon and its name) on the left, the slot where a screen may stand in the
// middle, then two small frames: the card (dashed: how the eye should see it) and, after a look, what the eye saw. The eye
// is on the right; every lane looks into it. Nothing here runs on a clock: a switch, a screen or a cover changes only on a
// tap, and LOOK asks the law. After a look the light's path is drawn out from each source (to the things it falls on, then
// through the slot to the eye: dim past a translucent screen, stopped at an opaque one) as a beat inside busy(). A ray is
// never drawn from the eye. What the eye sees is shown only after a look (predicting it is the skill); at dhak's start the
// eye's view of the lit bench is shown, since that is the problem.
//   parda:  tap a screen on the tray, then a lane's slot to stand it there; tap a filled slot to take it back.
//   roshan: tap a light to switch it on or off (only things that give out their own light have a switch); screens as parda.
//   dhak:   tap a thing to put a cardboard cover over it (or to take it off); the covers left are drawn below the bench.
// After a wrong look only magnifiers mark what to look at again (never the key, never a cross).
import type { Moment, YantraAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Material } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { isSource, raysOf, screenOf, seenOf, type MatId, type RoshniParams, type RoshniState, type Seen, type ThingId, type Want } from "./roshni.logic.ts";

const HOLD = 1.4;   // s: the stage keeps drawing after an act (the rays' draw-out and the eye's frames land inside it)
const TAU = Math.PI * 2;
/** the material each screen is painted in (air is an empty slot) */
const PANE: Record<MatId, { m: Material; a: number }> = {
  glass: { m: "ice", a: 0.45 }, water: { m: "water", a: 0.5 },
  butter: { m: "paper", a: 0.85 }, frosted: { m: "frost", a: 0.85 }, oiled: { m: "oil", a: 0.7 },
  cardboard: { m: "roti", a: 1 }, wood: { m: "wood", a: 1 }, steel: { m: "steel", a: 1 }, brick: { m: "clay", a: 1 },
};

export const makeRoshniView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<RoshniParams, RoshniState, YantraAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal, n = p.things.length;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let w = 360, h = 480;
  let actAt = -10, doneAt = -10, cheered = false, looked = false;
  /** the tray piece picked up (parda, roshan): the next slot tapped takes it */
  let sel: MatId | null = null;
  let down: { x: number; y: number } | null = null;

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: YantraAct) => { ctl.dispatch(a); deps.changed(); };
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as YantraAct | undefined;
    actAt = api.t;
    looked = last?.kind === "run";
    if (last?.kind === "place" && !refused) sel = null;
    for (const m of ms) if (m.kind === "solved") { doneAt = api.t + 0.9; cheered = false; }
    const mc = ms.some((m) => m.kind === "misconception_consequence");
    if (looked) api.sfx(refused || mc ? "look" : "select");
    else if (refused) api.sfx("refuse");
    else api.sfx(last?.kind === "toggle" ? "tap" : last?.kind === "remove" ? "slide" : "land");
    api.invalidate(); deps.changed();
  }
  function update(_dt: number): void {
    if (doneAt >= 0 && !cheered && api.t >= doneAt) {
      cheered = true; api.sfx("good");
      const g = geo();
      api.fx.burst(g.eyeX, g.eyeY, { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
      deps.changed();
    }
  }
  const busy = () => api.t - actAt < HOLD || (doneAt >= 0 && api.t - doneAt < 0.8);
  /** 0..1 along the rays' draw-out after a look (reduced motion: at once) */
  const rayK = () => (api.reduced ? 1 : clamp((api.t - actAt) / 0.7, 0, 1));

  // ── input ──
  function tap(id: string): void {
    const s = st(), [kind, rest] = [id.slice(0, id.indexOf("-")), id.slice(id.indexOf("-") + 1)];
    if (kind === "tray") { sel = sel === rest ? null : (rest as MatId); api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if (kind === "slot") {
      const i = Number(rest);
      if (sel) act({ kind: "place", part: sel, x: i, y: 0 });
      else if (s.slot[i]) act({ kind: "remove", id: `slot-${i}` });
      else { api.sfx("look"); }
      return;
    }
    if (kind === "thing") {
      const i = Number(rest);
      if (goal === "roshan") act({ kind: "toggle", id: `thing-${i}` });
      else if (goal === "dhak") act(s.cover[i] ? { kind: "remove", id: `cover-${i}` } : { kind: "place", part: "cover", x: i, y: 0 });
    }
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) { down = null; return; }
    if (kind === "down") { down = { x, y }; return; }
    if (kind === "up" && down) { const d0 = down; down = null; if (Math.hypot(x - d0.x, y - d0.y) < 14) { const id = api.hit(d0.x, d0.y); if (id) tap(id); } return; }
    if (kind === "cancel") down = null;
  }
  const dragging = () => false;

  // ── geometry ──
  function geo() {
    const cw = Math.min(w - 16, 640), x0 = (w - cw) / 2, gap = 8, btnH = 48;
    const perRow = 3, trayN = p.tray.length, trayRows = goal === "dhak" ? 0 : Math.ceil(trayN / perRow);
    const coverH = goal === "dhak" ? 40 : 0, headH = 22;
    const trayTop = h - 8 - trayRows * btnH - Math.max(0, trayRows - 1) * gap - coverH;
    const top = 6 + headH, bottom = trayTop - (trayRows || coverH ? gap : 0);
    const lh = Math.min(96, (bottom - top) / n);
    const lanesH = lh * n, ly0 = top + Math.max(0, (bottom - top - lanesH) / 2);
    // columns: the thing | the slot | the card's frame | what the eye saw | the eye
    const thingW = clamp(cw * 0.38, 118, 220), slotW = clamp(cw * 0.28, 90, 170), frame = clamp(Math.min(lh - 14, cw * 0.1), 26, cw < 400 ? 30 : 48);
    const eyeW = cw - thingW - slotW - frame * 2 - 6 - 6 - 4 - 4;
    const slotX = x0 + thingW + 6, cardX = slotX + slotW + 6, seenX = cardX + frame + 4, eyeX = x0 + cw - eyeW / 2, eyeY = ly0 + lanesH / 2;
    return { cw, x0, gap, btnH, perRow, trayRows, trayTop, coverH, headH, lh, ly0, eyeW, frame, thingW, slotW, slotX, cardX, seenX, eyeX, eyeY };
  }
  type G = ReturnType<typeof geo>;
  const laneY = (g: G, i: number) => g.ly0 + i * g.lh;
  const iconS = (g: G) => clamp(g.lh * 0.42, 20, 30);
  const iconAt = (g: G, i: number): [number, number] => [g.x0 + 8 + iconS(g) / 2, laneY(g, i) + (g.lh - 6) / 2];

  // ── the things ──
  /** a thing's icon centred at (x, y), size s; `on` lights a source (a non-luminous thing is always drawn the same) */
  function thing(c: CanvasRenderingContext2D, t: ThingId, x: number, y: number, s: number, on: boolean, alpha = 1): void {
    const P = api.P, r = s / 2, o = (_m: Material) => ({ outline: "ink2" as const, width: 1.2, alpha }), lit: Material = on ? "glow" : "aluminium";
    switch (t) {
      case "sun": {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU, a1 = a - 0.18, a2 = a + 0.18;
          P.fillPath(c, (q) => { q.moveTo(x + Math.cos(a1) * r * 0.7, y + Math.sin(a1) * r * 0.7); q.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); q.lineTo(x + Math.cos(a2) * r * 0.7, y + Math.sin(a2) * r * 0.7); q.closePath(); }, on ? "sun" : "aluminium", { outline: null, alpha });
        }
        P.fillPath(c, (q) => q.arc(x, y, r * 0.62, 0, TAU), on ? "sun" : "aluminium", o("sun"));
        return;
      }
      case "star": {
        P.fillPath(c, (q) => { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k / 10) * TAU, rr = k % 2 ? r * 0.42 : r; if (k) q.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else q.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } q.closePath(); }, lit, o(lit));
        return;
      }
      case "candle": {
        P.fillPath(c, (q) => q.rect(x - r * 0.28, y - r * 0.05, r * 0.56, r * 1.0), "white", o("white"));
        P.stroke(c, [[x, y - r * 0.05], [x, y - r * 0.22]], { role: "ink", width: 1.5, alpha });
        if (on) {
          P.fillPath(c, (q) => { q.moveTo(x, y - r); q.quadraticCurveTo(x + r * 0.34, y - r * 0.4, x, y - r * 0.16); q.quadraticCurveTo(x - r * 0.34, y - r * 0.4, x, y - r); q.closePath(); }, "glow", { outline: "ink2", width: 1, alpha });
          P.fillPath(c, (q) => q.ellipse(x, y - r * 0.36, r * 0.08, r * 0.16, 0, 0, TAU), "sun", { outline: null, alpha });
        }
        return;
      }
      case "bulb": {
        P.fillPath(c, (q) => q.arc(x, y - r * 0.2, r * 0.62, 0, TAU), on ? "glow" : "ice", o("glow"));
        P.fillPath(c, (q) => q.rect(x - r * 0.26, y + r * 0.38, r * 0.52, r * 0.5), "aluminium", o("aluminium"));
        P.stroke(c, [[x - r * 0.2, y - r * 0.1], [x - r * 0.1, y - r * 0.32], [x, y - r * 0.1], [x + r * 0.1, y - r * 0.32], [x + r * 0.2, y - r * 0.1]], { role: "ink2", width: 1.2, alpha });
        return;
      }
      case "firefly": {
        // a firefly: wings, a dark body, and its tail that glows
        P.fillPath(c, (q) => q.ellipse(x - r * 0.25, y - r * 0.38, r * 0.4, r * 0.22, -0.5, 0, TAU), "ice", { outline: "ink2", width: 1, alpha: alpha * 0.85 });
        P.fillPath(c, (q) => q.ellipse(x + r * 0.12, y - r * 0.4, r * 0.4, r * 0.22, 0.5, 0, TAU), "ice", { outline: "ink2", width: 1, alpha: alpha * 0.85 });
        P.fillPath(c, (q) => q.ellipse(x - r * 0.3, y, r * 0.42, r * 0.26, 0, 0, TAU), "graphite", o("graphite"));
        P.fillPath(c, (q) => q.arc(x - r * 0.72, y - r * 0.04, r * 0.16, 0, TAU), "graphite", o("graphite"));
        if (on) P.fillPath(c, (q) => q.arc(x + r * 0.42, y + r * 0.02, r * 0.5, 0, TAU), "glow", { outline: null, alpha: alpha * 0.35 });
        P.fillPath(c, (q) => q.ellipse(x + r * 0.4, y + r * 0.02, r * 0.34, r * 0.28, 0, 0, TAU), on ? "glow" : "soil", o("glow"));
        return;
      }
      case "moon": {
        P.fillPath(c, (q) => q.arc(x, y, r * 0.8, 0, TAU), "aluminium", o("aluminium"));
        P.fillPath(c, (q) => q.arc(x - r * 0.25, y - r * 0.15, r * 0.18, 0, TAU), "steel", { outline: null, alpha: alpha * 0.7 });
        P.fillPath(c, (q) => q.arc(x + r * 0.28, y + r * 0.25, r * 0.13, 0, TAU), "steel", { outline: null, alpha: alpha * 0.7 });
        return;
      }
      case "plate": {
        P.fillPath(c, (q) => q.ellipse(x, y, r, r * 0.55, 0, 0, TAU), "steel", o("steel"));
        P.fillPath(c, (q) => q.ellipse(x, y, r * 0.66, r * 0.34, 0, 0, TAU), "aluminium", { outline: "ink3", width: 1, alpha });
        return;
      }
    }
  }
  /** a cardboard cover over a thing (dhak) */
  function coverBox(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    P.fillPath(c, (q) => q.rect(x - s * 0.62, y - s * 0.62, s * 1.24, s * 1.24), "roti", { outline: "ink2", width: 1.5 });
    P.stroke(c, [[x - s * 0.62, y - s * 0.2], [x + s * 0.62, y - s * 0.2]], { role: "ink3", width: 1.2 });
  }
  /** a screen standing in a slot */
  function pane(c: CanvasRenderingContext2D, m: MatId, x: number, y: number, pw: number, ph: number): void {
    const P = api.P, d = PANE[m];
    P.fillPath(c, (q) => q.rect(x, y, pw, ph), d.m, { outline: "ink2", width: 1.5, alpha: d.a });
    if (m === "brick") for (let k = 1; k < 5; k++) { const yy = y + (ph * k) / 5; P.stroke(c, [[x, yy], [x + pw, yy]], { role: "ink3", width: 1 }); P.stroke(c, [[x + pw * (k % 2 ? 0.5 : 0.25), yy - ph / 5], [x + pw * (k % 2 ? 0.5 : 0.25), yy]], { role: "ink3", width: 1 }); }
    if (m === "wood") for (let k = 1; k < 3; k++) P.stroke(c, [[x + (pw * k) / 3, y + 3], [x + (pw * k) / 3 + 2, y + ph - 3]], { role: "ink3", width: 1, alpha: 0.6 });
    if (m === "water") P.stroke(c, [[x + 2, y + ph * 0.18], [x + pw * 0.3, y + ph * 0.14], [x + pw * 0.6, y + ph * 0.2], [x + pw - 2, y + ph * 0.16]], { role: "ink2", width: 1.2 });
  }
  /** a small frame: how the eye sees a lane's thing (clearly, not clearly, or not at all) */
  function eyeFrame(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: ThingId, v: Seen | Want | "unknown", dashed: boolean, state: "idle" | "good" | "look"): void {
    const P = api.P;
    if (v === "hidden" || v === "dark" || v === "not") P.fillPath(c, (q) => q.rect(x, y, s, s), "shadow", { outline: null, alpha: 0.85 });
    else if (v === "unknown") P.fillPath(c, (q) => q.rect(x, y, s, s), "white", { outline: null, alpha: 0.25 });
    else {
      P.fillPath(c, (q) => q.rect(x, y, s, s), "shadow", { outline: null, alpha: 0.55 });
      if (v === "clear") thing(c, t, x + s / 2, y + s / 2, s * 0.72, true);
      else {
        // not clearly: the light comes through as a soft glow, its outline lost
        for (const [dx, dy] of [[-2, -1], [2, 1], [0, 2], [0, -2]]) thing(c, t, x + s / 2 + dx, y + s / 2 + dy, s * 0.76, true, 0.3);
        P.fillPath(c, (q) => q.rect(x, y, s, s), "frost", { outline: null, alpha: 0.4 });
      }
    }
    P.stroke(c, [[x, y], [x + s, y], [x + s, y + s], [x, y + s]], { role: state === "good" ? "good" : state === "look" ? "look" : "ink2", width: dashed ? 1.5 : 2, dash: dashed ? [4, 3] : undefined, closed: true });
    if (state === "good") P.tick(c, x + s - 4, y + 2, 11);
    if (state === "look") P.magnifier(c, x + s - 4, y + 4, 12);
  }
  /** the eye, looking left at the bench */
  function eye(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    P.fillPath(c, (q) => { q.moveTo(x - s * 0.5, y); q.quadraticCurveTo(x, y - s * 0.42, x + s * 0.5, y); q.quadraticCurveTo(x, y + s * 0.42, x - s * 0.5, y); q.closePath(); }, "white", { outline: "ink", width: 2 });
    P.fillPath(c, (q) => q.arc(x - s * 0.1, y, s * 0.17, 0, TAU), "paint", { outline: null });
    P.fillPath(c, (q) => q.arc(x - s * 0.1, y, s * 0.08, 0, TAU), "black", { outline: null });
  }

  /** the light's path, from the law's raysOf, drawn out along k (a ray always starts at a thing; none starts at the eye) */
  function rays(c: CanvasRenderingContext2D, g: G, k: number): void {
    const P = api.P, s = st(), list = raysOf(p, s), ic = iconS(g);
    const seg = (a: [number, number], b: [number, number], some: boolean, f: number) => {
      if (f <= 0) return;
      const e: [number, number] = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      if (some) { for (const off of [-3, 0, 3]) P.stroke(c, [a, [e[0], e[1] + off * f]], { role: "q1", width: 1.5, alpha: 0.45, dash: [5, 4] }); return; }
      P.stroke(c, [a, e], { role: "q1", width: 7, alpha: 0.22 });
      P.stroke(c, [a, e], { role: "q1", width: 2.5 });
      if (f >= 1) { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); P.fillPath(c, (q) => { q.moveTo(e[0], e[1]); q.lineTo(e[0] - Math.cos(ang - 0.45) * 9, e[1] - Math.sin(ang - 0.45) * 9); q.lineTo(e[0] - Math.cos(ang + 0.45) * 9, e[1] - Math.sin(ang + 0.45) * 9); q.closePath(); }, "glow", { outline: "ink2", width: 1 }); }
    };
    const k1 = clamp(k * 2, 0, 1), k2 = clamp(k * 2 - 1, 0, 1);
    for (const r of list) {
      const [ax, ay] = iconAt(g, r.from), mid = laneY(g, r.from) + (g.lh - 6) / 2;
      if (typeof r.to === "number") {
        // a source's light falling on a non-luminous thing: along the left edge of the bench, onto its icon
        // (in the bench's left margin, outside the lanes' panels)
        const [, by] = iconAt(g, r.to), sx = g.x0 - 4;
        seg([ax - ic * 0.5, ay], [sx, ay], false, clamp(k1 * 3, 0, 1));
        seg([sx, ay], [sx, by], false, clamp(k1 * 3 - 1, 0, 1));
        seg([sx, by], [g.x0 + 6, by], false, clamp(k1 * 3 - 2, 0, 1));
        continue;
      }
      const lit = isSource(p.things[r.from]) ? k1 : k2;   // reflected light leaves only once light has reached the thing
      const slotIn: [number, number] = [g.slotX + 11, mid];
      if (r.to === "slot") { seg([ax + ic * 0.55, ay], slotIn, false, lit); continue; }
      seg([g.slotX + 11, mid], [g.eyeX - Math.min(g.eyeW - 2, 60) * 0.5, g.eyeY], r.light === "some", lit);
    }
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), g = geo(), ic = iconS(g);
    const fresh = looked && api.t - actAt < HOLD;
    // what the eye shows: the last look's view; at dhak's start, the eye's view of the lit bench
    const start = goal === "dhak" && s.acts === 0;
    const shown: Seen[] | null = s.shown ?? (start ? seenOf(p, s) : null);
    const seenCol = goal === "dhak" ? g.cardX + (g.frame + 4) / 2 : g.seenX;
    // the column heads over the frames: the card, and what the eye saw (an eye)
    const hy = g.ly0 - g.headH / 2 - 2;
    if (goal !== "dhak") P.textFit(c, W("yantra.roshni.card"), g.cardX + g.frame / 2, hy, g.frame + 12, g.headH, { size: 14, role: "ink2", weight: 700 });
    eye(c, seenCol + g.frame / 2, hy, Math.min(28, g.frame * 0.85));
    // the lanes' panels (the light's path is drawn over them and under their words)
    p.things.forEach((t, i) => {
      const y = laneY(g, i), lh = g.lh - 6, looking = !!s.why && s.at === i, wall = p.walls.includes(i);
      P.body(c, g.x0, y, g.thingW, lh, { role: "panel", r: 10, seed: 30 + i, state: looking ? "look" : "idle" });
      if (!s.done && (goal === "dhak" || (goal === "roshan" && isSource(t)))) api.target(`thing-${i}`, g.x0, y, g.thingW, lh);
      P.body(c, g.slotX, y, g.slotW, lh, { role: "panel", r: 8, seed: 50 + i, state: !wall && sel && !s.slot[i] && !s.done ? "selected" : "idle" });
      if (!wall && !s.done && goal !== "dhak") api.target(`slot-${i}`, g.slotX, y, g.slotW, lh);
    });
    // the light's path after a look (drawn out)
    if (s.shown && s.runs > 0) { rays(c, g, fresh ? rayK() : 1); if (fresh && rayK() < 1) api.invalidate(); }
    // the things and the slots
    p.things.forEach((t, i) => {
      const y = laneY(g, i), lh = g.lh - 6, on = isSource(t) && s.on[i] && !s.cover[i];
      const [ix, iy] = iconAt(g, i);
      thing(c, t, ix, iy, ic, on);
      if (s.cover[i]) coverBox(c, ix, iy, ic * 0.62);
      // roshan: the switch on each source, a knob at its icon's corner (a thing that gives out no light of its own has none)
      if (goal === "roshan" && isSource(t)) {
        const kx = ix + ic * 0.45, ky = iy + ic * 0.4;
        P.fillPath(c, (q) => q.arc(kx, ky, 7, 0, TAU), on ? "glow" : "aluminium", { outline: "ink", width: 1.5 });
        P.stroke(c, [[kx, ky - 4], [kx, ky + (on ? -1 : 4)]], { role: "ink", width: 2 });
      }
      const nameW = g.thingW - ic - 20;
      P.textFit(c, W(`yantra.roshni.thing.${t}`), g.x0 + ic + 14 + nameW / 2, y + lh / 2, nameW, lh - 8, { size: 14, role: "ink", weight: 700 });
      const m = screenOf(p, s, i), ph = Math.min(lh - 12, 52);
      if (m) pane(c, m, g.slotX + 5, y + (lh - ph) / 2, 12, ph);
      else P.stroke(c, [[g.slotX + 11, y + (lh - ph) / 2], [g.slotX + 11, y + (lh + ph) / 2]], { role: "ink3", width: 1.5, dash: [3, 4] });
      P.textFit(c, W(`yantra.roshni.mat.${m ?? "air"}`), g.slotX + 20 + (g.slotW - 22) / 2, y + lh / 2, g.slotW - 22, lh - 8, { size: 14, role: m ? "ink" : "ink2", weight: 600 });
    });
    // the card's frame (dashed) and, after a look, what the eye saw
    p.things.forEach((t, i) => {
      const y = laneY(g, i), lh = g.lh - 6, fy = y + (lh - g.frame) / 2, v = shown?.[i], looking = !!s.why && s.at === i;
      const ok = v ? (p.want[i] === "not" ? v === "hidden" || v === "dark" : v === p.want[i]) : false;
      const showSeen = !!v && (!fresh || api.t - actAt > 0.6);
      if (goal !== "dhak") eyeFrame(c, g.cardX, fy, g.frame, t, p.want[i], true, "idle");
      const mark = !showSeen ? "idle" : goal !== "dhak" && ok ? "good" : looking ? "look" : "idle";
      eyeFrame(c, seenCol, fy, g.frame, t, showSeen && v ? v : "unknown", false, mark);
    });
    eye(c, g.eyeX, g.eyeY, Math.min(g.eyeW - 2, 60));
    // the tray (parda, roshan): a button per screen not yet standing in a slot
    if (goal !== "dhak") {
      const bw = (g.cw - (g.perRow - 1) * g.gap) / g.perRow;
      p.tray.forEach((m, k) => {
        const x = g.x0 + (k % g.perRow) * (bw + g.gap), y = g.trayTop + Math.floor(k / g.perRow) * (g.btnH + g.gap), used = s.slot.includes(m);
        P.body(c, x, y, bw, g.btnH, { role: "q2", r: 12, seed: 80 + k, state: used || s.done ? "dim" : sel === m ? "selected" : "idle" });
        if (!used && !s.done) api.target(`tray-${m}`, x, y, bw, g.btnH);
        pane(c, m, x + 8, y + 9, 14, g.btnH - 18);
        P.textFit(c, W(`yantra.roshni.mat.${m}`), x + 26 + (bw - 32) / 2, y + g.btnH / 2, bw - 34, g.btnH - 6, { size: 14, on: "q2", weight: 800 });
      });
    } else {
      // the covers left, drawn as cardboard squares under the bench
      const left = p.covers - s.cover.filter(Boolean).length, y = h - 8 - g.coverH, sz = g.coverH - 12;
      for (let k = 0; k < p.covers; k++) {
        const x = g.x0 + 8 + k * (sz + 10);
        if (k < left) P.fillPath(c, (q) => q.rect(x, y + 6, sz, sz), "roti", { outline: "ink2", width: 1.5 });
        else P.stroke(c, [[x, y + 6], [x + sz, y + 6], [x + sz, y + 6 + sz], [x, y + 6 + sz]], { role: "ink3", width: 1.2, dash: [3, 3], closed: true });
      }
    }
  }

  function goalLine(): string {
    const s = st();
    if (s.done) return W(`yantra.roshni.done.${goal}`);
    if (s.why) return W(`yantra.roshni.why.${s.why}`, whyVals());
    if (sel) return W("yantra.roshni.note.pick", { mat: W(`yantra.roshni.mat.${sel}`) });
    return W(`yantra.roshni.goal.${goal}`);
  }
  function whyVals(): Record<string, string> {
    const s = st(), i = s.at >= 0 ? s.at : 0, m = screenOf(p, s, i);
    return { thing: mid(W(`yantra.roshni.thing.${p.things[i]}`)), mat: mid(W(`yantra.roshni.mat.${m ?? "air"}`)) };
  }
  /** a name filled into the middle of an English sentence is lower case ("through butter paper", "on the Moon"); the words
   *  are written so a fill never starts a sentence */
  const mid = (x: string) => (lang === "en" ? x.charAt(0).toLowerCase() + x.slice(1) : x);
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    return [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W("yantra.roshni.look"), aria: W("yantra.roshni.look"), kind: "primary", group: "go", onPress: () => act({ kind: "run" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal: goalLine, readouts, controls, react };
  return view;
};
