// ITEM-ARENA · the 2D view (the board twin and the 2D-tier view; round 4 G1). The question is the goal line (real DOM
// text: it wraps and Devanagari renders); each option is a lettered button and a lettered target in the world. Tap an
// option (or its target) to aim, then fire. A hit decloaks the target; a miss darkens it and the kit's hint rung shows in
// the world (never the key). No timer, no score.
import type { ArenaAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { word } from "../../engines/words.ts";
import type { ArenaParams, ArenaState } from "./arena.logic.ts";

export const LETTERS = ["A", "B", "C", "D"] as const;
/** the option's words in the lesson's language (yes / no are the only words the arena itself supplies) */
export function optionText(o: { text: string; word?: "yes" | "no" }, lang: Parameters<typeof word>[0]): string {
  return o.word === "yes" ? word(lang, "arena.yes") : o.word === "no" ? word(lang, "arena.no") : o.text;
}
/** the question in the lesson's language: English for an English lesson, the kit's Hindi / Hinglish line otherwise */
export const promptText = (p: ArenaParams, lang: string) => (lang === "en" ? p.prompt.en : p.prompt.hi || p.prompt.en);

export const makeArenaView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<ArenaParams, ArenaState, ArenaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, n = p.options.length;
  let W = 360, H = 400, hitAt = -1, missAt = -1, lastMiss: string | null = null;
  const pos: { x: number; y: number; r: number }[] = [];
  const st = () => ctl.state;

  function layout(w: number, h: number): void {
    W = w; H = h;
    const r = clamp(Math.min(w / (n * 2.6), h / 5), 26, 54);
    pos.length = 0;
    for (let i = 0; i < n; i++) pos.push({ x: (w * (i + 0.5)) / n, y: h * 0.36 + (i % 2 ? r * 0.5 : -r * 0.2), r });
  }
  function act(a: ArenaAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as ArenaAct | undefined;
    if (last?.kind === "aim" && !refused) api.sfx("select");
    for (const m of ms) {
      if (m.kind === "solved") {
        hitAt = api.t; api.sfx("good"); api.fx.shake(3);
        const i = p.options.findIndex((o) => o.id === p.key);
        if (pos[i]) api.fx.burst(pos[i].x, pos[i].y, { n: 22, color: api.P.color("good"), speed: 150, life: 0.7, size: 3, kind: "spark" });
      }
      if (m.kind === "law_refused") { missAt = api.t; lastMiss = String(m.facts.picked ?? ""); api.sfx("look"); api.fx.shake(1.5); }
    }
    api.invalidate(); deps.changed();
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down" || st().done) return;
    const i = pos.findIndex((q) => Math.hypot(x - q.x, y - q.y) <= q.r * 1.25);
    if (i >= 0 && !st().out.includes(p.options[i].id)) act({ kind: "aim", option: p.options[i].id });
  }
  const update = () => { /* targets drift only in the 3D arena; the 2D board stays still */ };
  const busy = () => (hitAt >= 0 && api.t - hitAt < 0.8) || (missAt >= 0 && api.t - missAt < 0.4);

  function wrap(c: CanvasRenderingContext2D, s: string, maxW: number, px: number): string[] {
    c.save(); c.font = `600 ${px}px system-ui, sans-serif`;
    const out: string[] = []; let line = "";
    for (const w of s.split(/\s+/)) {
      const t = line ? `${line} ${w}` : w;
      if (c.measureText(t).width * 1.12 > maxW && line) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
    c.restore();
    return out.slice(0, 4);
  }
  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    for (let i = 0; i < n; i++) {
      const o = p.options[i], q = pos[i]; if (!q) continue;
      const out = s.out.includes(o.id), aimed = s.aim === o.id, hit = s.done && o.id === p.key;
      api.target(`opt-${o.id}`, q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      P.circle(c, q.x, q.y, q.r, { role: hit ? "good" : out ? "ink3" : aimed ? "you" : "ink2", width: aimed || hit ? 4 : 2, alpha: out ? 0.35 : 1 });
      if (hit) P.circle(c, q.x, q.y, q.r * (1 + clamp((api.t - hitAt) / 0.5, 0, 1) * 0.5), { role: "good", width: 2, alpha: 1 - clamp((api.t - hitAt) / 0.5, 0, 1) });
      P.text(c, LETTERS[i], q.x, q.y, { size: Math.round(q.r * 0.8), weight: 800, font: "display", role: out ? "ink3" : aimed ? "you" : "ink", alpha: out ? 0.45 : 1 });
    }
    // the ship and the aim line
    const sx = W / 2, sy = H * 0.86;
    P.stroke(c, [[sx - 16, sy + 12], [sx, sy - 18], [sx + 16, sy + 12], [sx, sy + 4]], { role: "ink", width: 3, closed: true });
    const ai = p.options.findIndex((o) => o.id === s.aim);
    if (ai >= 0 && pos[ai]) P.stroke(c, [[sx, sy - 20], [pos[ai].x, pos[ai].y + pos[ai].r]], { role: "you", width: 2, dash: [6, 6] });
    // after a miss: the hint rung (never the key)
    if (s.out.length && !s.done && p.hint) {
      const lines = wrap(c, p.hint, Math.min(W - 32, 520), 16), top = H * 0.6;
      lines.forEach((l, k) => P.text(c, l, W / 2, top + k * 21, { size: 16, role: "look", weight: 600 }));
    }
  }

  const goal = () => promptText(p, lang);
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st();
    const opts: ControlSpec[] = p.options.map((o, i) => ({
      id: `opt-${o.id}`, label: `${LETTERS[i]} · ${optionText(o, lang)}`, kind: "choice", group: "options",
      disabled: s.done || s.out.includes(o.id), pressed: s.aim === o.id, onPress: () => act({ kind: "aim", option: o.id }),
    }));
    if (s.done) return opts;
    return [...opts, { id: "commit", label: word(lang, deps.verb === "scan" ? "arena.scan" : "arena.fire"), kind: "primary", group: "go", you: s.aim !== null, disabled: s.aim === null, onPress: () => act({ kind: "fire" }) }];
  }
  void lastMiss;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => false };
  return view;
};
