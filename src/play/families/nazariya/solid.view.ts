// Nazariya · solid, the 2D view (r7 nazariya2). The solid drawn as a picture of it shows: only the faces turned to the
// child, shaded by how they face, with the edges and corners of those faces. Three tools (a stamp for a face, a finger for
// an edge, a pin for a corner) and three turns (a quarter round left or right, tip over to see underneath). A tap with
// the tool marks the face / edge / corner under it; marks stay on the solid through every turn. Fade 1 starts with the
// goal's tool in hand and keeps a live count of the marks; later fades start empty-handed and show the count after
// "Done". Nothing is timed and nothing animates on a clock.
import type { Moment, NazariyaAct, PlayActBody } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { anglesOf, elOf, geoOf, rotate, rotateBy, visibleAt, type El, type SolidParams, type SolidState, type V3 } from "./solid.logic.ts";

const TURN_TIME = 0.4;   // s: a turn is drawn turning (cosmetic: the law has already turned it)

export const makeSolidView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<SolidParams, SolidState, NazariyaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, g = geoOf(p), want = elOf(p.goal), fade = level.fade;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const R = Math.max(...g.verts.map((v) => Math.hypot(...v)));
  let cx = 160, cy = 200, sc = 80, tool: El | null = fade === 1 ? want : null, reveal = false, xray = false;
  const act = (a: NazariyaAct) => { ctl.dispatch(a as PlayActBody as never); deps.changed(); };
  /** the last turn: from angles, at time t0 (drawn in between until TURN_TIME has passed) */
  let turnFrom: [number, number] | null = null, turnT0 = -1e9, wasBusy = false;
  const busy = () => !api.reduced && api.t - turnT0 < TURN_TIME;
  function angles(): [number, number] {
    const to = anglesOf(st().o);
    if (!turnFrom || !busy()) return to;
    const k = Math.min(1, Math.max(0, (api.t - turnT0) / TURN_TIME)), e = k * k * (3 - 2 * k);
    let dy = to[0] - turnFrom[0]; if (dy > 180) dy -= 360; if (dy < -180) dy += 360;
    return [turnFrom[0] + dy * e, turnFrom[1] + (to[1] - turnFrom[1]) * e];
  }

  function layout(w: number, h: number): void {
    cx = w / 2; cy = h / 2;
    sc = Math.max(30, (Math.min(w, h) / 2 - 18) / R);
  }
  const XY = (v: V3, o: number): [number, number] => { const r = rotate(o, v); return [cx + r[0] * sc, cy - r[1] * sc]; };

  function poly(c: CanvasRenderingContext2D, pts: [number, number][], color: string, alpha: number): void {
    c.save(); c.globalAlpha = alpha; c.fillStyle = color; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); c.restore();
  }
  function drawTurning(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), [ya, pa] = angles(), Q = (v: V3): [number, number] => { const r = rotateBy(ya, pa, v); return [cx + r[0] * sc, cy - r[1] * sc]; };
    const box = R * sc + 14;
    api.target("solid", cx - box, cy - box, 2 * box, 2 * box);
    g.faces.forEach((f, i) => {
      const n = rotateBy(ya, pa, g.normals[i]);
      if (n[2] <= 0.02) return;
      const pts = f.map((j) => Q(g.verts[j])), on = s.face.includes(i);
      poly(c, pts, P.color(on ? "q1" : "q3"), on ? 0.78 : 0.2 + 0.32 * clamp(n[2] + n[1] * 0.4, 0, 1));
      P.stroke(c, pts, { role: "ink", width: 2.5, closed: true });
    });
  }
  function draw(c: CanvasRenderingContext2D): void {
    if (busy()) { drawTurning(c); return; }
    const P = api.P, s = st(), o = s.o, vis = visibleAt(g, o);
    const box = R * sc + 14;
    api.target("solid", cx - box, cy - box, 2 * box, 2 * box);
    // the table shadow under the solid
    c.save(); c.globalAlpha = 0.18; c.fillStyle = P.color("ink"); c.beginPath(); c.ellipse(cx, cy + R * sc * 0.92, R * sc * 0.9, R * sc * 0.18, 0, 0, Math.PI * 2); c.fill(); c.restore();
    for (const f of vis.face) {
      const pts = g.faces[f].map((i) => XY(g.verts[i], o)), n = rotate(o, g.normals[f]);
      const on = s.face.includes(f);
      poly(c, pts, P.color(on ? (s.done ? "good" : "q1") : "q3"), on ? 0.78 : 0.2 + 0.32 * clamp(n[2] + n[1] * 0.4, 0, 1));
      if (on) {
        const [mx, my] = pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length], [0, 0]);
        P.circle(c, mx, my, Math.max(7, sc * 0.09), { role: "ink", width: 2.5 });
      }
    }
    vis.edge.forEach((e) => {
      const [u, v] = g.edges[e], run = s.edge.includes(e);
      P.stroke(c, [XY(g.verts[u], o), XY(g.verts[v], o)], { role: run ? (s.done ? "good" : "q2") : "ink", width: run ? 7 : 2.5 });
    });
    for (const i of vis.corner) {
      const [x, y] = XY(g.verts[i], o), pin = s.corner.includes(i);
      if (pin) { P.circle(c, x, y, 9, { role: s.done ? "good" : "q4", fill: true }); P.circle(c, x, y, 9, { role: "ink", width: 2 }); }
      else P.circle(c, x, y, 4, { role: "ink2", fill: true });
    }
    // after a "Done" that left some unmarked: the hidden ones of the asked kind show through, dashed (where the rest were
    // hiding); a turn brings them into sight to be marked
    if (xray && !s.done) {
      const hf = g.faces.map((_, i) => i).filter((i) => !vis.face.includes(i));
      if (want === "face") for (const f of hf) P.stroke(c, g.faces[f].map((i) => XY(g.verts[i], o)), { role: "look", width: 2.5, dash: [6, 6], closed: true });
      if (want === "edge") g.edges.forEach(([u, v], e) => { if (!vis.edge.includes(e)) P.stroke(c, [XY(g.verts[u], o), XY(g.verts[v], o)], { role: "look", width: 3, dash: [6, 6] }); });
      if (want === "corner") g.verts.forEach((v, i) => { if (!vis.corner.includes(i)) { const [x, y] = XY(v, o); P.circle(c, x, y, 8, { role: "look", width: 2.5 }); } });
    }
    if (s.done) P.tick(c, clamp(cx + R * sc * 0.9, 24, api.w - 24), clamp(cy - R * sc * 0.9, 24, api.h - 24), 24);
  }

  /** the face / edge / corner in sight under (x, y) for the tool in hand */
  function pick(x: number, y: number): { el: El; i: number } | null {
    const s = st(), o = s.o, vis = visibleAt(g, o);
    if (tool === "corner") {
      let best = -1, bd = Math.max(22, sc * 0.16);
      for (const i of vis.corner) { const [px, py] = XY(g.verts[i], o), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = i; } }
      return best >= 0 ? { el: "corner", i: best } : null;
    }
    if (tool === "edge") {
      let best = -1, bd = Math.max(16, sc * 0.12);
      for (const e of vis.edge) {
        const [a, b] = g.edges[e].map((i) => XY(g.verts[i], o)), dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
        const k = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L2, 0, 1), d = Math.hypot(a[0] + k * dx - x, a[1] + k * dy - y);
        if (k > 0.08 && k < 0.92 && d < bd) { bd = d; best = e; }
      }
      return best >= 0 ? { el: "edge", i: best } : null;
    }
    if (tool === "face") {
      for (const f of vis.face) {
        const pts = g.faces[f].map((i) => XY(g.verts[i], o));
        let inside = false;
        for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
          if ((pts[a][1] > y) !== (pts[b][1] > y) && x < ((pts[b][0] - pts[a][0]) * (y - pts[a][1])) / (pts[b][1] - pts[a][1]) + pts[a][0]) inside = !inside;
        }
        if (inside) return { el: "face", i: f };
      }
    }
    return null;
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) return;
    // a tap while a turn is still drawing ends the turn at once and counts on the turned solid (real taps at 360 px:
    // a quick child's tap right after "Turn right" was lost while the turn was drawn)
    if (busy()) { turnT0 = -1e9; api.invalidate(); }
    if (kind === "down") ctl.finger(true);
    if (kind === "up" || kind === "cancel") {
      ctl.finger(false);
      if (kind === "up" && api.hit(x, y) === "solid") {
        const hit = pick(x, y);
        if (hit) act({ kind: "mark", el: hit.el, i: hit.i });
        else api.sfx(tool ? "tap" : "refuse");
      }
      api.invalidate();
    }
  }

  const solidWord = () => W(`nazariya.solid.${p.solid}`);
  const view: FamilyView = {
    // while a turn is drawn, every frame; and once more when it ends, so the last frame is the turned solid with its marks
    // (run shots at 360 px: the stage stopped on the last in-between frame, the pins never drawn)
    layout, update() { const b = busy(); if (b || wasBusy) api.invalidate(); wasBusy = b; }, draw, pointer, busy,
    goal: () => W(`nazariya.solid.goal.${p.goal}`, { solid: solidWord() }),
    readouts(): Readout[] {
      const s = st(), live = fade === 1 || reveal || s.done;
      const k = want === "face" ? "nazariya.solid.stamped" : want === "edge" ? "nazariya.solid.run" : "nazariya.solid.pinned";
      return [{ k: W(k), v: live ? String(s[want].length) : "?", role: "you" }];
    },
    controls(): ControlSpec[] {
      const s = st(), out: ControlSpec[] = [];
      if (s.done) return out;
      const tools: [El, string][] = [["face", "nazariya.solid.stamp"], ["edge", "nazariya.solid.finger"], ["corner", "nazariya.solid.pin"]];
      for (const [el, k] of tools) out.push({ id: `tool-${el}`, label: W(k), kind: "choice", group: "tools", pressed: tool === el, aria: `${W(k)}${tool === el ? " (on)" : ""}`, onPress: () => { tool = el; deps.changed(); } });
      out.push({ id: "turn-left", label: W("nazariya.solid.left"), kind: "secondary", group: "turn", onPress: () => act({ kind: "turn", dir: "left" }) });
      out.push({ id: "turn-right", label: W("nazariya.solid.right"), kind: "secondary", group: "turn", onPress: () => act({ kind: "turn", dir: "right" }) });
      out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: s.depth === 0, onPress: () => act({ kind: "undo" }) });
      out.push({ id: "turn-over", label: W("nazariya.solid.over"), kind: "secondary", group: "go", onPress: () => act({ kind: "turn", dir: "over" }) });
      out.push({ id: "done", label: W("nazariya.solid.done"), kind: "primary", you: true, group: "go", disabled: !(s.face.length + s.edge.length + s.corner.length), onPress: () => act({ kind: "check" }) });
      return out;
    },
    react(ms: Moment[], refused: string | undefined): void {
      const kinds = new Set(ms.map((m) => m.kind));
      if (kinds.has("solved")) { reveal = true; api.sfx("good"); api.fx.burst(cx, cy, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else if (kinds.has("misconception_consequence") || kinds.has("near_miss") || refused === "mismatch") { reveal = true; xray = true; api.sfx("look"); }
      else if (refused) { api.sfx("refuse"); api.fx.shake(2); }
      else if (kinds.has("progress")) {
        const last = ctl.acts[ctl.acts.length - 1]?.act as NazariyaAct | undefined;
        if (last?.kind === "turn") { const before = st().prev; turnFrom = before ? anglesOf(before.o) : null; turnT0 = api.t; }
        api.sfx(last?.kind === "turn" ? "slide" : "land");
      }
      api.invalidate(); deps.changed();
    },
  };
  return view;
};
