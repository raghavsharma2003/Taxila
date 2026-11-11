// Kon · name, the 2D view (r8; the law is kon.name.ts). Three rays from a vertex, their ends lettered, two ends joined: the
// figure's five angles. say: one angle is lit (a filled arc); tap three letters in order (the name builds in a chip under
// the figure), "Yahi naam". find: a name is shown; tap the arc of the angle it names (a tap near an arc is on the nearest
// arc; each arc's touch square lies wholly in its own band, so no two overlap). After a
// decision the law lights the angle the name actually denotes, at its middle letter: solid when it is one of the figure's
// angles, dashed (with its two rays) when it is not; the angle meant stays lit beside it. No timer, no hint of where the
// vertex goes.
import type { KonAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word } from "../../engines/words.ts";
import type { KonParams, KonState } from "./kon.logic.ts";
import { ARC_R, NBH, NBW, arcHit, arcTargets, asked, corners, denotes, initName, nameOf, points, segments, sizeOf, spell } from "./kon.name.ts";
import { around, freeSpot, type Avoid, type Box } from "./kon.spot.ts";

type Pt = [number, number];
const RUN_END = 1.2;

export function makeNameView(api: ViewApi, depsIn: ViewDeps): FamilyView {
  const deps = depsIn as unknown as ViewDeps<KonParams, KonState, KonAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal as "say" | "find";
  const st = () => ctl.state;
  const ns = () => st().nm ?? initName();
  let s = 1, ox = 0, oy = 0, truthAt = -1;
  const S = (x: number, y: number): Pt => [ox + x * s, oy + (NBH - y) * s];
  const rad = (d: number) => (d * Math.PI) / 180;
  const deg = (x: number, y: number) => (((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360;
  const B = (X: number, Y: number): Pt => [(X - ox) / s, NBH - (Y - oy) / s];
  /** say: a letter's touch square's half side: as big as 32 px, never under 24 (a 48 px target), and never overlapping the
   *  next one's (the generator keeps the points 68 board px apart, so ≥ 48 apart on one axis; 1 board px ≥ 1 CSS px) */
  const centres = (): Pt[] => points(p).map((q) => S(...q));
  /** find: each arc's touch square (board px), fixed by the figure */
  const arcSq = goal === "find" ? arcTargets(p) : [];
  function hitR(): number {
    const C = centres();
    let m = Infinity;
    C.forEach((a, i) => C.forEach((b, j) => { if (j > i) m = Math.min(m, Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]))); }));
    return Math.max(24, Math.min(32, Math.floor(m / 2)));
  }

  function layout(w: number, h: number): void {
    s = Math.min(w / NBW, h / NBH);
    ox = (w - NBW * s) / 2; oy = (h - NBH * s) / 2;
  }
  function act(a: KonAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KonAct | undefined;
    if (last?.kind === "letter") api.sfx("select");
    if ((last?.kind === "commit" || last?.kind === "arc") && !(refused && refused !== "missed")) { truthAt = api.t; api.sfx("land"); }
    for (const m of ms) {
      if (m.kind === "solved") setTimeout(() => api.sfx("good"), 200);
      if (m.kind === "misconception_consequence" || m.kind === "law_refused") setTimeout(() => api.sfx("look"), 200);
    }
    if (last?.kind === "undo" || last?.kind === "clear") truthAt = -1;
    api.invalidate(); deps.changed();
  }
  function pointer(kind: PointerKind, X: number, Y: number): void {
    if (kind !== "down" || st().done) return;
    if (goal === "find") { const k = arcHit(p, ...B(X, Y)); if (k >= 0) act({ kind: "arc", at: k }); return; }
    // the touch squares never overlap, so at most one holds the finger
    const r = hitR(), best = centres().findIndex(([x, y]) => Math.abs(X - x) <= r && Math.abs(Y - y) <= r);
    if (best >= 0 && ns().taps.length < 3) { truthAt = -1; act({ kind: "letter", at: best }); }
  }
  const update = () => { /* nothing moves on its own */ };
  const busy = () => truthAt >= 0 && api.t - truthAt < RUN_END;

  /** an angle's arc at vertex v between the rays to a and b (indices into the figure's points, or raw points) */
  function arc(c: CanvasRenderingContext2D, t: number[], r: number, role: string, o: { fill?: boolean; dash?: number[]; width?: number; k?: number } = {}): void {
    const P = points(p), v = P[t[1]], a = P[t[0]], b = P[t[2]];
    const ha = deg(a[0] - v[0], a[1] - v[1]), hb = deg(b[0] - v[0], b[1] - v[1]);
    let d = ((hb - ha) % 360 + 360) % 360; if (d > 180) d -= 360;
    const [x, y] = S(...v), R = r * s, end = ha + d * (o.k ?? 1);
    c.save(); c.beginPath();
    if (o.fill) { c.moveTo(x, y); c.arc(x, y, R, -rad(ha), -rad(end), d > 0); c.closePath(); c.fillStyle = api.P.color(role as never); c.globalAlpha = 0.28; c.fill(); c.globalAlpha = 1; c.beginPath(); }
    c.arc(x, y, R, -rad(ha), -rad(end), d > 0);
    c.strokeStyle = api.P.color(role as never); c.lineWidth = o.width ?? 3; if (o.dash) c.setLineDash(o.dash); c.stroke(); c.restore();
  }
  const arcR = (k: number) => ARC_R[k];

  function draw(c: CanvasRenderingContext2D): void {
    const Pn = api.P, P = points(p), S0 = st(), N = ns(), C = corners(p), want = p.ask ?? 0;
    // the figure: rays and the joined pair
    for (const [i, j] of segments(p)) { Pn.stroke(c, [S(...P[i]), S(...P[j])], { role: "ink", width: 3.5 }); Pn.noteSeg("arm", S(...P[i]), S(...P[j])); }
    // say: the lit angle
    if (goal === "say") arc(c, nameOf(C[want]), arcR(want), "q2", { fill: true });
    // find: every angle's arc, bold enough to tap (the one she tapped in her colour)
    if (goal === "find") C.forEach((cc, k) => {
      arc(c, nameOf(cc), arcR(k), N.picked === k ? "you" : "ink2", { width: N.picked === k ? 5 : 3.5 });
      const q = arcSq[k];
      if (q) { const [hx, hy] = S(q.x, q.y), h = (q.side * s) / 2; api.target(`arc-${k}`, hx - h, hy - h, 2 * h, 2 * h); }
    });
    // the points and their letters (the letters sit outward from the vertex; the vertex's opposite its rays)
    const V = P[0];
    P.forEach((q, i) => {
      const [x, y] = S(...q), tapped = N.taps.includes(i);
      Pn.circle(c, x, y, tapped ? 7 : 4.5, { role: tapped ? "you" : "ink", fill: true });
      Pn.note("dot", x - 8, y - 8, 16, 16);
      let away: number;
      if (i === 0) { const m = [1, 2, 3].map((j) => deg(P[j][0] - V[0], P[j][1] - V[1])).reduce((acc, h) => [acc[0] + Math.cos(rad(h)), acc[1] + Math.sin(rad(h))], [0, 0]); away = deg(-m[0], -m[1]); }
      else away = deg(q[0] - V[0], q[1] - V[1]);
      const [lx, ly] = S(q[0] + 18 * Math.cos(rad(away)), q[1] + 18 * Math.sin(rad(away)));
      Pn.text(c, (p.lets ?? "OABC")[i], lx, ly, { size: 18, weight: 700, role: tapped ? "you" : "ink2" });
      if (goal === "say" && !S0.done) api.target(`pt-${i}`, x - hitR(), y - hitR(), hitR() * 2, hitR() * 2);
    });
    // say: the name so far, under the figure
    // (in the board's corner or edge farthest from every point and its letter)
    const spots: Pt[] = [[NBW / 2, 14], [NBW / 2, NBH - 14], [56, 14], [NBW - 56, 14], [56, NBH - 14], [NBW - 56, NBH - 14]];
    const far = (q: Pt) => Math.min(...P.map((pt) => Math.hypot(pt[0] - q[0], pt[1] - q[1])));
    const [nx, ny] = S(...spots.reduce((a, b) => (far(b) > far(a) + 1 ? b : a)));
    // (in the say play-out her name moves to the corner it denotes: it is shown once)
    const running = truthAt >= 0 && S0.commits > 0 && !S0.done && api.t - truthAt > 0.5 && sizeOf(p, N.said ?? []) !== null;
    if (goal === "say" && N.taps.length && !running) Pn.chip(c, `∠${spell(p, N.taps)}${"_".repeat(3 - N.taps.length)}`, nx, ny, { size: 16, role: "you" });
    if (goal === "find") Pn.chip(c, `∠${spell(p, nameOf(C[want], p.ord ?? 0))}`, nx, ny, { size: 16, role: "ink" });
    if (truthAt >= 0 && S0.commits > 0) drawRun(c);
  }
  /** the law lights the angle the name denotes (at its middle letter); the one asked stays lit */
  function drawRun(c: CanvasRenderingContext2D): void {
    const Pn = api.P, P = points(p), S0 = st(), N = ns(), C = corners(p), k = clamp((api.t - truthAt) / 0.5, 0, 1);
    const t = goal === "say" ? (N.said ?? []) : N.picked !== null ? nameOf(C[N.picked]) : [];
    if (t.length !== 3) return;
    if (S0.done) {
      // beside the vertex of the angle she named, clear of its letter, the rays and the other marks
      const o = S(...P[asked(p).v]), at = freeSpot(around(o, [28, 40, 54], -Math.PI / 4), 24, 20, avoidHere(), canvasBox()) ?? [o[0] + 26, o[1] - 26];
      Pn.tick(c, at[0], at[1], 18, clamp((api.t - truthAt - 0.3) / 0.3, 0, 1));
      return;
    }
    const j = goal === "say" ? denotes(p, t) : (N.picked as number);
    if (j >= 0) arc(c, nameOf(C[j]), arcR(j) + 8, "look", { width: 4, k });
    else if (sizeOf(p, t) !== null) {
      // not one of the figure's angles: its two rays, dashed, and its arc
      const v = P[t[1]];
      for (const e of [t[0], t[2]]) { const b = S(v[0] + (P[e][0] - v[0]) * k, v[1] + (P[e][1] - v[1]) * k); Pn.stroke(c, [S(...v), b], { role: "look", width: 3, dash: [7, 5] }); Pn.noteSeg("ray", S(...v), b); }
      arc(c, t, 30, "look", { width: 3, dash: [5, 4], k });
    }
    // the name of what lit up, at its corner, once it has drawn
    if (api.t - truthAt > 0.5 && sizeOf(p, t) !== null) {
      // beside its corner, clear of every point, letter, line and chip (the first free spot, nearest first)
      const o = S(...P[t[1]]), cx = (P[1][0] + P[2][0] + P[3][0]) / 3, cy = (P[1][1] + P[2][1] + P[3][1]) / 3, [gx, gy] = S(cx, cy);
      const away = Math.atan2(o[1] - gy, o[0] - gx), name = `∠${spell(p, t)}`, { w, h } = Pn.chipSize(c, name, { size: 15 });
      const cands = around(o, [30, 40, 52, 66, 82, 100], away, 24).map(([x, y]): Pt => [x + Math.sign(x - o[0]) * w * 0.3, y]);
      const at = freeSpot(cands, w, h, avoidHere(), canvasBox()) ?? [clamp(o[0], w / 2 + 2, api.w - w / 2 - 2), clamp(o[1] + (P[t[1]][1] > NBH / 2 ? 34 : -34), h / 2 + 2, api.h - h / 2 - 2)];
      Pn.chip(c, name, at[0], at[1], { size: 15, role: "look" });
    }
  }

  const canvasBox = (): Box => ({ x: 2, y: 2, w: api.w - 4, h: api.h - 4 });
  /** what a chip or a tick must keep clear of: every line, dot, letter and mark drawn so far this frame */
  function avoidHere(): Avoid {
    const A = api.P.audit;
    return {
      segs: A.segs.map((g): [Pt, Pt] => [[g.x0, g.y0], [g.x1, g.y1]]),
      boxes: [...A.texts.map((t) => ({ x: t.x - t.w / 2, y: t.y - t.px * 0.6, w: t.w, h: t.px * 1.2 })), ...A.marks.filter((m) => m.kind !== "dot")],
      dots: A.marks.filter((m) => m.kind === "dot").map((m) => ({ c: [m.x + m.w / 2, m.y + m.h / 2] as Pt, r: m.w / 2 })),
    };
  }
  function goalLine(): string {
    if (goal === "say") return word(lang, "kon.goal.say");
    return word(lang, "kon.goal.find", { n: `∠${spell(p, nameOf(corners(p)[p.ask ?? 0], p.ord ?? 0))}` });
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    // solved: the same controls, all off, so the board keeps its size and the figure does not move (judge packet)
    if (st().done) return live().map((c) => ({ ...c, disabled: true, you: false }));
    return live();
  }
  function live(): ControlSpec[] {
    const S0 = st(), N = ns();
    const undo: ControlSpec = { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: S0.depth === 0, onPress: () => act({ kind: "undo" }) };
    if (goal === "find") return [undo];
    return [
      { id: "clear", label: word(lang, "kon.clear"), kind: "secondary", group: "go", disabled: !N.taps.length, onPress: () => act({ kind: "clear" }) },
      // one step back (her last letter): beside "Mita do", which clears all three
      undo,
      { id: "commit", label: word(lang, "kon.name"), kind: "primary", group: "go", you: N.taps.length === 3, disabled: N.taps.length !== 3, onPress: () => act({ kind: "commit" }) },
    ];
  }
  return { layout, update, draw, pointer, busy, goal: goalLine, readouts, controls, react };
}
