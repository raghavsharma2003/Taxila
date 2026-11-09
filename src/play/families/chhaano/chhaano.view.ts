// Chhaano · the 2D view (round 7, separating mixtures; class 6 science). Nothing here runs on a clock: every change waits for
// the child's tap, and the animations only show what the law has already answered.
//   sukha: the panel on top shows the chosen pile up close (each part with its name), or the method at work: the farmer's
//          supa in the wind (Winnow first throws one handful with no sack down: the heavier parts land near, the lighter
//          are carried far, and they stay drawn on the Near / Far places while the child sets the grain sack; then the
//          pile is winnowed with the sack where the child set it),
//          the sieve (smaller than its holes fall through), the hand picking the few pieces, the stalks beaten. Below it the
//          piles on the tray (tap one to choose it) and the methods of the scene (tap one to use it on the chosen pile).
//   geela: the jars along the top (one per part to recover; tap one to scoop the chosen dry solid into it), the vessels on
//          the bench (tap one to choose it: the beaker, a glass, the filter paper in its funnel, a plate in the sun), and the
//          methods below. Settling shows one wait at a time (dots fill; the mud sinks a step per tap). A dissolved solid is
//          never drawn in the water (it cannot be seen); a drop dried on a slide shows it.
// After a wrong move only magnifiers mark what to look at again (never the key, never a cross).
import type { ChhaanoAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Material } from "../../core/styles.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { DRY, DRY_SCENES, SETTLE_WAITS, WET, drySplit, isDry, jarsOf, looksClear, toolsOf, unseparated, type ChhaanoParams, type ChhaanoState, type DryPart, type Vessel, type WetPart } from "./chhaano.logic.ts";

const ANIM = 1.1;   // s: a method's particles reach their places
const HOLD = 1.6;   // s: the stage keeps drawing after an act (the last beat lands inside it)

/** each part's look: a material and a shape (the view never names a colour) */
const LOOK: Record<string, { mat: Material; shape: "grain" | "flake" | "stone" | "dot" | "drop" | "crystal" | "stalk"; r: number; n: number }> = {
  wheat: { mat: "roti", shape: "grain", r: 3.4, n: 14 }, bajra: { mat: "seed", shape: "dot", r: 2.6, n: 16 }, rice: { mat: "white", shape: "grain", r: 3.4, n: 14 },
  moong: { mat: "sprout", shape: "grain", r: 3, n: 14 }, dal: { mat: "oil", shape: "grain", r: 3, n: 14 }, husk: { mat: "leafPale", shape: "flake", r: 4, n: 12 },
  stone: { mat: "iron", shape: "stone", r: 3.6, n: 4 }, pebble: { mat: "steel", shape: "stone", r: 6, n: 5 }, dust: { mat: "soil", shape: "dot", r: 1.4, n: 18 },
  atta: { mat: "cotton", shape: "dot", r: 1.5, n: 22 }, bran: { mat: "wood", shape: "flake", r: 3, n: 12 }, sand: { mat: "nostarch", shape: "dot", r: 1.5, n: 22 },
  tilW: { mat: "white", shape: "drop", r: 2.6, n: 14 }, tilB: { mat: "black", shape: "drop", r: 2.6, n: 5 }, stalks: { mat: "nostarch", shape: "stalk", r: 14, n: 5 },
  bundle: { mat: "nostarch", shape: "stalk", r: 14, n: 5 },
  mitti: { mat: "soil", shape: "dot", r: 1.8, n: 18 }, paint: { mat: "paint", shape: "dot", r: 1.8, n: 16 }, chalk: { mat: "white", shape: "dot", r: 1.4, n: 18 },
  charcoal: { mat: "graphite", shape: "dot", r: 1.5, n: 18 }, salt: { mat: "salt", shape: "crystal", r: 2.4, n: 12 }, sugar: { mat: "white", shape: "crystal", r: 2.4, n: 12 },
};
/** a stable 0..1 hash (particle places are the level's own, never random per frame) */
const hash = (n: number) => { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const code = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7);

export const makeChhaanoView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<ChhaanoParams, ChhaanoState, ChhaanoAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, dry = isDry(p);
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const name = (x: string) => W(`chhaano.part.${x}`);
  /** part names inside a sentence: "moong and small stones", "dust, husk and stones" (English lower-cased mid-sentence) */
  const names = (xs: readonly string[]) => {
    const ns = xs.map((x) => (lang === "en" && x !== "tilW" && x !== "tilB" ? name(x).toLowerCase() : name(x)));
    return ns.length < 2 ? ns.join("") : `${ns.slice(0, -1).join(", ")} ${W("chhaano.and")} ${ns[ns.length - 1]}`;
  };
  const st = () => ctl.state;
  const tools = toolsOf(p), jars = dry ? [] : jarsOf(p), sc = dry ? DRY_SCENES[p.scene] : null;
  let w = 360, h = 400;
  let sel = 0, aim = false, panel: "close" | "act" | "aim" = "close";
  let actAt = -10, doneAt = -10, cheered = false;
  /** the last act as the view shows it: the method, the pile / vessel, the parts before, the law's answer */
  let last: { m: string; at: number; before: string[]; spot: "near" | "far" | ""; why: string; jar: number; n0: number } = { m: "", at: -1, before: [], spot: "", why: "", jar: -1, n0: 0 };
  let down: { x: number; y: number } | null = null;

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: ChhaanoAct) => {
    const s0 = st();
    const before = a.kind === "use" || a.kind === "take" ? (dry ? s0.piles[a.at] ?? [] : s0.ves[a.at]?.parts ?? []) : [];
    last = { m: a.kind === "use" ? a.m : a.kind, at: a.kind === "use" || a.kind === "take" ? a.at : -1, before: [...before], spot: a.kind === "use" && a.spot ? a.spot : "", why: "", jar: a.kind === "take" ? a.jar : -1, n0: dry ? s0.piles.length : s0.ves.length };
    ctl.dispatch(a); deps.changed();
  };
  /** the pile / vessel to choose after the law answered: the one still to work on */
  function pickSel(): void {
    const s = st();
    if (dry) {
      if (s.piles[sel] && unseparated(s.piles[sel])) return;
      const k = s.piles.findIndex(unseparated);
      sel = k >= 0 ? k : Math.min(sel, s.piles.length - 1);
    } else {
      const live = s.ves.map((v, i) => [v, i] as const).filter(([v]) => !v.gone);
      if (s.ves[sel] && !s.ves[sel].gone) {
        // a vessel just emptied into a glass: the new glass is the one to work on next
        return;
      }
      sel = (live.find(([v]) => v.wet) ?? live[0] ?? [null, 0])[1];
    }
  }
  function react(ms: Moment[], refused: string | undefined): void {
    const s = st(), now = api.t;
    last.why = s.why;
    actAt = now; aim = false;
    // sukha: a method's scene stays on the panel until the child chooses a pile; "ho gaya" refused shows the mixed pile
    panel = dry && last.m !== "done" && last.m !== "undo" && last.m !== "" ? "act" : "close";
    // the first throw landed: the Near / Far places open over where its handful fell
    if (dry && !refused && last.m === "winnow" && !last.spot && s.why === "thrown") { panel = "aim"; aim = true; }
    if (dry && last.m === "done" && refused) sel = Math.max(0, s.on);
    if (!dry && last.m !== "take" && last.m !== "done" && !refused && last.m !== "undo") {
      // follow the liquid: after a decant or a filter the new glass, after a wait the same beaker
      const v = s.ves[last.at];
      if (last.m === "pour" || last.m === "filter") sel = s.ves.length - 1;
      else if (v && !v.gone) sel = last.at;
    }
    if (last.m === "undo") { panel = "close"; last = { m: "", at: -1, before: [], spot: "", why: "", jar: -1, n0: 0 }; }
    pickSel();
    for (const m of ms) if (m.kind === "solved") { doneAt = now + 0.5; cheered = false; }
    if (refused === "pure" || refused === "settled" || refused === "no_spot") api.sfx("refuse");
    else if (refused) { api.sfx("look"); if (!ms.some((m) => m.kind === "misconception_consequence")) api.fx.shake(2); }
    else api.sfx(last.m === "pour" || last.m === "filter" || last.m === "drain" ? "pour" : last.m === "take" ? "drop" : last.m === "winnow" || last.m === "sieve" ? "slide" : "tap");
    api.invalidate(); deps.changed();
  }
  function update(_dt: number): void {
    if (doneAt >= 0 && !cheered && api.t >= doneAt) {
      cheered = true; api.sfx("good");
      api.fx.burst(w / 2, Math.min(h * 0.25, 110), { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
      deps.changed();
    }
  }
  const busy = () => api.t - actAt < HOLD || (doneAt >= 0 && api.t - doneAt < 0.8);
  /** 0..1 along the last act's animation (reduced motion: at once) */
  const prog = (delay = 0) => (api.reduced ? 1 : ease.out(clamp((api.t - actAt - delay) / 0.9, 0, 1)));

  // ── input: taps on release ──
  function tap(x: number, y: number): void {
    const id = api.hit(x, y);
    if (!id || st().done) return;
    const [kind, rest] = [id.slice(0, id.indexOf("-")), id.slice(id.indexOf("-") + 1)];
    if (kind === "pile" || kind === "ves") { sel = Number(rest); aim = false; panel = "close"; api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if (kind === "spot") { act({ kind: "use", m: "winnow", at: sel, spot: rest as "near" | "far" }); return; }
    if (kind === "jar") { act({ kind: "take", at: sel, jar: Number(rest) }); return; }
    if (kind === "tool") {
      if (rest === "winnow") {
        // the first throw of this pile (no sack down); once seen, Winnow opens the sack's places again over its handful
        const s = st();
        if (!s.thrown.includes((s.piles[sel] ?? []).join("+"))) { act({ kind: "use", m: "winnow", at: sel }); return; }
        aim = !aim; panel = aim ? "aim" : "close"; api.sfx("select"); api.invalidate(); deps.changed(); return;
      }
      act({ kind: "use", m: rest, at: sel });
    }
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind === "down") { down = { x, y }; return; }
    if (kind === "up" && down) { const d = down; down = null; if (Math.hypot(x - d.x, y - d.y) < 14) tap(d.x, d.y); return; }
    if (kind === "cancel") down = null;
  }

  // ── geometry ──
  function geo() {
    const cw = Math.min(w - 16, 620), x0 = (w - cw) / 2;
    const toolH = 50, gap = 8;
    const toolY = h - 8 - toolH;
    if (dry) {
      // the tray holds at most five piles: three to a row, each a third of the width (a lone pile is not a wide field)
      const n = st().piles.length, cols = 3, rows = Math.max(2, Math.ceil(n / 3));
      const panelH = clamp(h * 0.4, 120, 200);
      const gridY = 8 + panelH + gap, gridH = toolY - gap - gridY;
      const cardW = (cw - (cols - 1) * gap) / cols, cardH = clamp((gridH - (rows - 1) * gap) / rows, 54, 130);
      return { cw, x0, toolY, toolH, gap, panelH, gridY, cols, cardW, cardH, jarY: 0, jarH: 0, benchY: 0, benchH: 0, slideY: 0, slideH: 0 };
    }
    const jarH = clamp(h * 0.17, 60, 84), jarY = 8;
    const benchY = jarY + jarH + gap, slideH = clamp(h * 0.18, 60, 92);
    const benchH = toolY - gap - slideH - gap - benchY;
    return { cw, x0, toolY, toolH, gap, panelH: 0, gridY: 0, cols: 0, cardW: 0, cardH: 0, jarY, jarH, benchY, benchH, slideY: benchY + benchH + gap, slideH };
  }
  type G = ReturnType<typeof geo>;

  // ── particles ──
  function particle(c: CanvasRenderingContext2D, part: string, x: number, y: number, k: number, scale = 1): void {
    const L = LOOK[part] ?? LOOK.dust, r = L.r * scale, P = api.P, rot = hash(k * 13 + 1) * Math.PI;
    switch (L.shape) {
      case "grain": P.fillPath(c, (g) => g.ellipse(x, y, r * 1.35, r * 0.8, rot, 0, Math.PI * 2), L.mat, { outline: "ink3", width: 1 }); break;
      case "flake": P.fillPath(c, (g) => { g.moveTo(x - r * Math.cos(rot), y - r * Math.sin(rot) * 0.6); g.quadraticCurveTo(x + r * 0.3, y - r * 0.7, x + r * Math.cos(rot), y + r * Math.sin(rot) * 0.6); g.quadraticCurveTo(x - r * 0.3, y + r * 0.5, x - r * Math.cos(rot), y - r * Math.sin(rot) * 0.6); }, L.mat, { outline: "ink3", width: 0.8 }); break;
      case "stone": P.fillPath(c, (g) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + rot, rr = r * (0.75 + hash(k * 7 + i) * 0.35); if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } g.closePath(); }, L.mat, { outline: "ink2", width: 1 }); break;
      case "dot": P.fillPath(c, (g) => g.arc(x, y, r, 0, Math.PI * 2), L.mat, { outline: null }); break;
      case "drop": P.fillPath(c, (g) => g.ellipse(x, y, r * 1.2, r * 0.75, rot, 0, Math.PI * 2), L.mat, { outline: "ink3", width: 0.8 }); break;
      case "crystal": P.fillPath(c, (g) => g.rect(x - r, y - r, r * 2, r * 2), L.mat, { outline: "ink3", width: 0.8 }); break;
      case "stalk": {
        const a = -Math.PI / 2 + (hash(k * 5) - 0.5) * 0.5, ex = x + Math.cos(a) * r * 1.6, ey = y + Math.sin(a) * r * 1.6;
        P.stroke(c, [[x, y], [ex, ey]], { role: "ink2", width: 2.2 });
        if (part === "bundle") for (let i = 0; i < 4; i++) particle(c, p.grain || "wheat", ex + (i % 2 ? 3 : -3), ey + i * 3.2, k * 9 + i, 0.75);
      }
    }
  }
  /** the particles of a pile in a mound of half-width rx and height ry with its foot centred at (cx, cy) */
  function heapPts(parts: readonly string[], cx: number, cy: number, rx: number, ry: number, salt: number, scale = 1): { part: string; x: number; y: number; k: number }[] {
    const out: { part: string; x: number; y: number; k: number }[] = [];
    parts.forEach((part, pi) => {
      const n = Math.max(2, Math.round((LOOK[part]?.n ?? 8) * Math.min(1, 0.55 + 0.45 / Math.max(1, parts.length - 1)) * scale));
      for (let i = 0; i < n; i++) {
        const k = (p.lay + 1) * 1009 + salt * 131 + code(part) * 7 + i;
        const u = hash(k) * 2 - 1, v = hash(k + 3);
        out.push({ part, x: cx + u * rx * (1 - v * 0.55), y: cy - v * ry * Math.sqrt(1 - u * u * 0.8), k });
      }
      void pi;
    });
    // draw from back to front
    return out.sort((a, b) => a.y - b.y);
  }

  // ── drawing: sukha ──
  function drawCloseUp(c: CanvasRenderingContext2D, g: G, pile: readonly string[], look: boolean): void {
    const P = api.P, y0 = 8, H = g.panelH;
    P.body(c, g.x0, y0, g.cw, H, { role: "panel", r: 12, seed: 3, state: look ? "look" : "idle" });
    P.text(c, W("chhaano.pile", { n: sel + 1 }), g.x0 + 12, y0 + 16, { size: 15, role: "ink2", weight: 700, align: "left" });
    const parts = pile.flatMap((x) => (x === "bundle" ? ["bundle"] : [x])), n = Math.max(1, parts.length), colW = (g.cw - 16) / n;
    parts.forEach((part, i) => {
      const cx = g.x0 + 8 + colW * (i + 0.5), foot = y0 + H - 42;
      for (const q of heapPts([part], cx, foot, Math.min(colW * 0.36, 46), Math.min(H * 0.38, 54), 50 + i, 1.1)) particle(c, q.part, q.x, q.y, q.k, part === "stalks" || part === "bundle" ? 1 : 1.5);
      // a name on one line, or two at the floor ("Small / stones" in a four-part close-up)
      P.textFit(c, name(part), cx, y0 + H - 21, colW - 6, 36, { size: 16, role: "ink", weight: 700 });
    });
    if (look) P.magnifier(c, g.x0 + g.cw - 22, y0 + 20, 22);
  }
  /** the method scene for the last act on the panel (sukha) */
  function drawAct(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, y0 = 8, H = g.panelH, X = g.x0, CW = g.cw, m = last.m, why = last.why;
    P.body(c, X, y0, CW, H, { role: "panel", r: 12, seed: 4 });
    const before = last.before as DryPart[];
    const r = sc && before.length ? drySplit(m as "thresh", before, sc, p.grain as DryPart | "", (last.spot || undefined) as "near" | "far" | undefined) : "pure";
    const k = prog(0.15), ground = y0 + H - 14;
    const src = { x: X + CW * 0.2, y: y0 + 40 };
    if (m === "winnow") {
      drawWind(c, g);
      const light = before.filter((x) => DRY[x].wt === "light"), heavy = before.filter((x) => DRY[x].wt === "heavy");
      const sackAt = last.spot === "far" ? farX(g) : nearX(g);
      if (last.spot) drawSack(c, sackAt, ground, last.spot === "far" ? (why === "far" ? light : []) : heavy);
      const nearPts = heapPts(heavy, nearX(g), ground - 4, 30, 18, 61, 0.8);
      const farPts = heapPts(why === "same_weight" && !heavy.length ? light : light, farX(g), ground - 4, 30, 16, 62, 0.8);
      const fly = (pts: typeof nearPts) => pts.forEach((q, i) => { const t = clamp(k * 1.25 - (i % 7) * 0.04, 0, 1), sx = src.x + (hash(q.k) - 0.5) * 16, sy = src.y + 10; particle(c, q.part, lerp(sx, q.x, t), lerp(sy, q.y, t) - Math.sin(t * Math.PI) * 10, q.k, 1.2); });
      if (why === "same_weight") fly(heavy.length ? nearPts : farPts);
      else { fly(nearPts); fly(farPts); }
      if (why === "far" && k >= 1) P.magnifier(c, farX(g) + 34, ground - 46, 22);
      return;
    }
    if (m === "sieve") {
      const mx = X + CW / 2, my = y0 + H * 0.46, rx = Math.min(CW * 0.3, 120);
      // the bowl under the sieve, then the mesh
      P.fillPath(c, (gg) => { gg.ellipse(mx, ground - 8, rx * 0.8, 12, 0, 0, Math.PI); gg.lineTo(mx - rx * 0.8, ground - 8); }, "clay", { outline: "ink2", width: 1.5, alpha: 0.85 });
      P.stroke(c, [[mx - rx, my], [mx + rx, my]], { role: "ink2", width: 3 });
      for (let i = -5; i <= 5; i++) P.stroke(c, [[mx + (i * rx) / 6, my - 5], [mx + (i * rx) / 6, my + 5]], { role: "ink3", width: 1.2 });
      const top = typeof r === "string" ? (before.every((x) => DRY[x].size <= sc!.hole) ? [] : before) : r.stay;
      const below = typeof r === "string" ? before.filter((x) => !top.includes(x)) : r.out[0];
      const onMesh = heapPts(top, mx, my - 6, rx * 0.7, 18, 71, 0.8), under = heapPts(below, mx, ground - 12, rx * 0.6, 14, 72, 0.8);
      onMesh.forEach((q) => particle(c, q.part, q.x, lerp(y0 + 18, q.y, k), q.k, 1.2));
      under.forEach((q, i) => { const t = clamp(k * 1.3 - (i % 5) * 0.05, 0, 1); particle(c, q.part, q.x, t < 0.5 ? lerp(y0 + 18, my, t * 2) : lerp(my, q.y, (t - 0.5) * 2), q.k, 1.2); });
      // same size: the lens shows the holes against the particles
      if (why === "same_size" && k >= 1) drawLens(c, mx + rx + 26, my - 6, Math.min(30, H * 0.22), before);
      return;
    }
    if (m === "pick") {
      const hx = X + CW * 0.72, bowlY = ground - 6;
      P.fillPath(c, (gg) => { gg.ellipse(hx, bowlY, 34, 10, 0, 0, Math.PI); gg.lineTo(hx - 34, bowlY); }, "steel", { outline: "ink2", width: 1.5 });
      const picked = typeof r === "string" ? [] : r.out.flat(), rest = typeof r === "string" ? before : r.stay;
      heapPts(rest, X + CW * 0.3, ground - 4, 40, 22, 81, 0.9).forEach((q) => particle(c, q.part, q.x, q.y, q.k, 1.2));
      heapPts(picked, X + CW * 0.3, ground - 4, 40, 22, 82, 0.9).forEach((q, i) => { const t = clamp(k * 1.4 - i * 0.08, 0, 1); particle(c, q.part, lerp(q.x, hx + (hash(q.k) - 0.5) * 36, t), lerp(q.y, bowlY - 4, t) - Math.sin(t * Math.PI) * 26, q.k, 1.3); });
      if (why === "cannot_pick" && k >= 1) P.magnifier(c, X + CW * 0.3 + 46, ground - 34, 22);
      return;
    }
    if (m === "thresh") {
      const bx = X + CW * 0.28, gx = X + CW * 0.7;
      const grain = typeof r === "string" ? [] : r.stay;
      for (let i = 0; i < 6; i++) { const sx = bx - 30 + i * 12; P.stroke(c, [[sx, ground - 4], [sx + (i % 2 ? 6 : -6), lerp(y0 + 30, ground - 30, k)]], { role: "ink2", width: 2.2 }); }
      heapPts(grain, gx, ground - 4, 40, 22, 91, 0.9).forEach((q, i) => { const t = clamp(k * 1.3 - (i % 6) * 0.05, 0, 1); particle(c, q.part, lerp(bx, q.x, t), lerp(y0 + 34, q.y, t), q.k, 1.2); });
      if (why === "no_stalks" && k >= 1) P.magnifier(c, bx + 40, ground - 34, 22);
      return;
    }
    drawCloseUp(c, g, st().piles[sel] ?? [], false);
  }
  const nearX = (g: G) => g.x0 + g.cw * 0.28, farX = (g: G) => g.x0 + g.cw * 0.74;
  function drawWind(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, y0 = 8, H = g.panelH, X = g.x0, CW = g.cw, ground = y0 + H - 14;
    P.stroke(c, [[X + 8, ground], [X + CW - 8, ground]], { role: "ink3", width: 2 });
    // the farmer's supa held high, the wind blowing to the right
    const sx = X + CW * 0.2, sy = y0 + 36;
    P.fillPath(c, (gg) => { gg.moveTo(sx - 26, sy - 6); gg.lineTo(sx + 22, sy - 2); gg.lineTo(sx + 14, sy + 8); gg.lineTo(sx - 22, sy + 6); gg.closePath(); }, "wood", { outline: "ink2", width: 1.5 });
    P.stroke(c, [[sx - 30, sy + 4], [sx - 34, ground]], { role: "ink3", width: 3 });
    for (let i = 0; i < 3; i++) { const wy = y0 + 22 + i * 16, wx = X + CW * 0.44 + (i % 2) * 18; P.stroke(c, [[wx, wy], [wx + 52, wy], [wx + 44, wy - 5]], { role: "q2", width: 2 }); P.stroke(c, [[wx + 52, wy], [wx + 44, wy + 5]], { role: "q2", width: 2 }); }
    P.text(c, W("chhaano.wind"), X + CW * 0.44 + 46, y0 + 72, { size: 15, role: "q2", weight: 700 });
  }
  function drawSack(c: CanvasRenderingContext2D, x: number, ground: number, inside: readonly string[]): void {
    const P = api.P;
    P.fillPath(c, (gg) => { gg.moveTo(x - 24, ground); gg.lineTo(x - 20, ground - 34); gg.lineTo(x + 20, ground - 34); gg.lineTo(x + 24, ground); gg.closePath(); }, "cotton", { outline: "ink2", width: 1.6 });
    if (inside.length && prog(0.6) > 0.3) heapPts(inside, x, ground - 22, 14, 8, 63, 0.5).forEach((q) => particle(c, q.part, q.x, q.y, q.k, 1));
  }
  function drawAim(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, y0 = 8, H = g.panelH, X = g.x0, CW = g.cw, ground = y0 + H - 14;
    P.body(c, X, y0, CW, H, { role: "panel", r: 12, seed: 6 });
    // the question itself is the goal line under the stage ("Where will you put the grain sack?")
    drawWind(c, g);
    for (const [spot, x] of [["near", nearX(g)], ["far", farX(g)]] as const) {
      const bw = 88, bh = 56;
      api.target(`spot-${spot}`, x - bw / 2, ground - bh, bw, bh);
      P.body(c, x - bw / 2, ground - bh, bw, bh, { role: "panel", r: 10, seed: spot === "near" ? 7 : 8, state: "hover" });
      P.stroke(c, [[x - 18, ground - 6], [x - 15, ground - 30], [x + 15, ground - 30], [x + 18, ground - 6]], { role: "ink3", width: 1.5, dash: [4, 4] });
      P.text(c, W(`chhaano.spot.${spot}`), x, ground - bh + 12, { size: 15, role: "ink", weight: 700 });
    }
    // the first throw: one handful of the chosen pile, no sack down; the heavier parts land near, the lighter are carried
    // far (the law's own winnowing split), drawn over the two places the sack can go
    const pile = (st().piles[sel] ?? []) as DryPart[], r = sc ? drySplit("winnow", pile, sc, p.grain as DryPart | "", "near") : "pure";
    if (typeof r !== "string") {
      const k = prog(0.1), src = { x: X + CW * 0.2, y: y0 + 46 };
      const fly = (parts: readonly string[], x: number, salt: number) => heapPts(parts, x, ground - 6, 24, 12, salt, 0.55).forEach((q, i) => {
        const t = clamp(k * 1.25 - (i % 7) * 0.04, 0, 1);
        particle(c, q.part, lerp(src.x + (hash(q.k) - 0.5) * 12, q.x, t), lerp(src.y, q.y, t) - Math.sin(t * Math.PI) * 12, q.k, 1.3);
      });
      fly(r.stay, nearX(g), 64); fly(r.out[0], farX(g), 65);
    }
  }
  /** the sieve's holes against the particles, close up */
  function drawLens(c: CanvasRenderingContext2D, x: number, y: number, r: number, parts: readonly string[]): void {
    const P = api.P;
    c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
    P.fillPath(c, (gg) => gg.arc(x, y, r, 0, Math.PI * 2), "paper", { outline: null });
    const hole = sc!.hole === 1 ? r * 0.16 : r * 0.32;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) P.stroke(c, [[x - r, y + j * hole * 2.2], [x + r, y + j * hole * 2.2]], { role: "ink3", width: 1 }), P.stroke(c, [[x + i * hole * 2.2, y - r], [x + i * hole * 2.2, y + r]], { role: "ink3", width: 1 });
    parts.forEach((part, i) => particle(c, part, x + (i - (parts.length - 1) / 2) * r * 0.6, y, 500 + i, 2.6));
    c.restore();
    P.circle(c, x, y, r, { role: "look", width: 3 });
    P.magnifier(c, x + r * 0.9, y + r * 0.9, 20);
  }
  function drawPiles(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st();
    s.piles.forEach((pile, i) => {
      const col = i % 3, row = Math.floor(i / 3), x = g.x0 + col * (g.cardW + g.gap), y = g.gridY + row * (g.cardH + g.gap);
      // a pile a split just made fades in as its particles land in the panel
      const fresh = panel === "act" && last.why === "" && i >= last.n0 ? prog(0.5) : 1;
      const lookHere = s.why === "mixed" && s.on === i;
      if (!s.done) api.target(`pile-${i}`, x, y, g.cardW, g.cardH);
      P.body(c, x, y, g.cardW, g.cardH, { role: "panel", r: 10, seed: 20 + i, state: s.done && !unseparated(pile) ? "good" : i === sel && !s.done ? "selected" : lookHere ? "look" : "idle" });
      const labelH = unseparated(pile) ? 6 : 22, foot = y + g.cardH - labelH - 6;
      c.save(); c.globalAlpha *= clamp(fresh * 1.4, 0.3, 1);
      const sz = clamp(g.cardH / 70, 0.9, 1.4);
      for (const q of heapPts(pile, x + g.cardW / 2, foot, Math.min(g.cardW * 0.38, 46), Math.min(g.cardH - labelH - 18, 44), 10 + i, 0.7)) particle(c, q.part, q.x, q.y, q.k, sz);
      c.restore();
      if (!unseparated(pile)) P.textFit(c, name(pile[0]), x + g.cardW / 2, y + g.cardH - 14, g.cardW - 8, 22, { size: 15, role: "ink", weight: 700 });
      if (lookHere) P.magnifier(c, x + g.cardW - 16, y + 16, 18);
    });
  }

  // ── drawing: geela ──
  function drawJars(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), n = jars.length, jw = Math.min(150, (g.cw - (n - 1) * g.gap) / n), x1 = g.x0 + (g.cw - (n * jw + (n - 1) * g.gap)) / 2;
    jars.forEach((part, q) => {
      const x = x1 + q * (jw + g.gap), y = g.jarY, full = s.jars[q].length > 0;
      if (!s.done) api.target(`jar-${q}`, x, y, jw, g.jarH);
      P.body(c, x, y, jw, g.jarH, { role: "panel", r: 12, seed: 30 + q, state: full ? "good" : "idle" });
      // the jar: a glass body with a lid; what it holds at its foot
      const jx = x + 26, jy = y + 10, jh = g.jarH - 20;
      P.fillPath(c, (gg) => gg.rect(jx - 14, jy + 6, 28, jh - 6), "ice", { outline: "ink2", width: 1.5, alpha: 0.7 });
      P.fillPath(c, (gg) => gg.rect(jx - 16, jy, 32, 7), "wood", { outline: "ink2", width: 1 });
      if (full) heapPts([part], jx, jy + jh - 4, 10, 10, 40 + q, 0.6).forEach((pt) => particle(c, pt.part, pt.x, pt.y, pt.k, 1));
      P.textFit(c, name(part), x + 26 + (jw - 26) / 2, y + g.jarH / 2, jw - 52, g.jarH - 8, { size: 16, role: "ink", weight: 700 });
      if (full && s.done) P.tick(c, x + jw - 14, y + 14, 16, clamp((api.t - doneAt) / 0.3, 0, 1));
    });
  }
  function drawVessel(c: CanvasRenderingContext2D, v: Vessel, i: number, x: number, y: number, vw: number, vh: number, isSel: boolean): void {
    const P = api.P, s = st(), live = !s.done;
    if (live) api.target(`ves-${i}`, x, y, vw, vh);
    const lookHere = (s.why === "not_there" || s.why === "clear" || s.why === "mixed" || s.why === "not_it" || s.why === "lost" || s.why === "salt_gone") && s.on === i;
    P.body(c, x, y, vw, vh, { role: "panel", r: 10, seed: 50 + i, state: isSel && live ? "selected" : lookHere ? "look" : "idle" });
    const cx = x + vw / 2, labelY = y + vh - 14, bodyTop = y + 22, bodyBot = labelY - 14 - (v.wet && settlesIn(v) ? 12 : 0);
    // a glass a decant or a filter just made fills as the liquid arrives
    const made = (last.m === "pour" || last.m === "filter") && i === s.ves.length - 1 && api.t - actAt < ANIM;
    const fresh = made ? prog(0.2) : 1;
    const bw = Math.min(vw - 20, 64);
    if (v.k === "paper") {
      // the funnel with its folded filter paper; the solids it caught inside
      P.fillPath(c, (gg) => { gg.moveTo(cx - bw / 2, bodyTop); gg.lineTo(cx + bw / 2, bodyTop); gg.lineTo(cx + 5, bodyBot - 16); gg.lineTo(cx + 5, bodyBot); gg.lineTo(cx - 5, bodyBot); gg.lineTo(cx - 5, bodyBot - 16); gg.closePath(); }, "paper", { outline: "ink2", width: 1.5 });
      heapPts(v.parts, cx, bodyTop + (bodyBot - bodyTop) * 0.5, bw * 0.22, 14, 70 + i, 0.6).forEach((q) => particle(c, q.part, q.x, q.y, q.k, 1));
    } else if (v.k === "plate") {
      const py = bodyBot - 8, dryK = last.at === i && last.m === "dry" ? prog(0.1) : 1;
      P.fillPath(c, (gg) => gg.ellipse(cx, py, bw / 2 + 4, 10, 0, 0, Math.PI * 2), "steel", { outline: "ink2", width: 1.5 });
      if (dryK < 1) P.fillPath(c, (gg) => gg.ellipse(cx, py - 1, (bw / 2) * (1 - dryK * 0.9), 6 * (1 - dryK * 0.9), 0, 0, Math.PI * 2), "water", { outline: null, alpha: 0.75 });
      c.save(); c.globalAlpha *= clamp(dryK * 1.3 - 0.2, 0, 1);
      heapPts(v.parts, cx, py, bw * 0.34, 6, 75 + i, 0.6).forEach((q) => particle(c, q.part, q.x, q.y, q.k, 1));
      c.restore();
      // the sun over the plate
      P.fillPath(c, (gg) => gg.arc(x + vw - 18, y + 18, 9, 0, Math.PI * 2), "sun", { outline: "ink3", width: 1 });
    } else {
      // a beaker or a glass: the liquid, the solids in it (sinking a step per wait), the settled layer
      const gw = v.k === "beaker" ? bw : bw * 0.8, top = bodyTop + 4;
      const liqTop = lerp(bodyBot, top, v.wet ? 0.85 * fresh : 0);
      if (v.wet) P.fillPath(c, (gg) => gg.rect(cx - gw / 2 + 2, liqTop, gw - 4, bodyBot - liqTop), "water", { outline: null, alpha: 0.42 });
      const settles = settlesIn(v), sk = v.wet ? clamp(v.settle / SETTLE_WAITS, 0, 1) : 1;
      const shownK = last.at === i && last.m === "wait" ? lerp(clamp((v.settle - 1) / SETTLE_WAITS, 0, 1), sk, prog()) : sk;
      // the settled layer and the solids still in the water
      const ins = v.parts.filter((x) => WET[x].kind !== "dis");
      ins.forEach((part, pi) => {
        const settling = WET[part].kind === "settle" && !v.cloudy, L = LOOK[part], n = v.cloudy ? 6 : L.n;
        for (let k = 0; k < n; k++) {
          const kk = (p.lay + 3) * 97 + i * 31 + pi * 17 + k, u = hash(kk), vv = hash(kk + 5);
          const freeY = lerp(liqTop + 6, bodyBot - 4, vv), floorY = bodyBot - 3 - vv * 7;
          const yy = v.wet ? (settling ? lerp(freeY, floorY, shownK) : freeY) : floorY;
          particle(c, part, cx - gw / 2 + 6 + u * (gw - 12), yy, kk, 1);
        }
      });
      // the glass itself
      P.stroke(c, [[cx - gw / 2, top - 4], [cx - gw / 2, bodyBot], [cx + gw / 2, bodyBot], [cx + gw / 2, top - 4]], { role: "ink2", width: 2 });
      if (v.wet && settles) for (let d = 0; d < SETTLE_WAITS; d++) P.circle(c, cx + (d - (SETTLE_WAITS - 1) / 2) * 16, bodyBot + 12, 4.5, { role: d < v.settle ? "q2" : "ink3", fill: d < v.settle, width: 1.5 });
    }
    P.textFit(c, W(`chhaano.ves.${v.k}`), cx, labelY, vw - 8, 22, { size: 15, role: "ink2", weight: 700 });
    if (lookHere) P.magnifier(c, x + vw - 16, y + 16, 18);
  }
  const settlesIn = (v: Vessel) => !v.cloudy && v.parts.some((x) => WET[x].kind === "settle");
  function drawBench(c: CanvasRenderingContext2D, g: G): void {
    const s = st(), live = s.ves.map((v, i) => [v, i] as const).filter(([v]) => !v.gone);
    const n = Math.max(1, live.length), vw = Math.min(140, (g.cw - (n - 1) * g.gap) / n), x1 = g.x0 + (g.cw - (n * vw + (n - 1) * g.gap)) / 2;
    live.forEach(([v, i], k) => drawVessel(c, v, i, x1 + k * (vw + g.gap), g.benchY, vw, g.benchH, i === sel));
    if (!live.length) api.P.text(c, W("chhaano.bench.empty"), g.x0 + g.cw / 2, g.benchY + g.benchH / 2, { size: 16, role: "ink3" });
  }
  /** the slide: a drop of the liquid (or the puddle, or the paper) dried, and what it leaves behind */
  function drawSlide(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), why = s.why;
    if (!(why === "clear" || why === "salt_gone" || why === "not_there")) return;
    const y = g.slideY, H = g.slideH, X = g.x0, CW = g.cw;
    P.body(c, X, y, CW, H, { role: "panel", r: 10, seed: 9, state: "look" });
    const dis = jars.filter((x) => WET[x].kind === "dis"), k = prog(0.3);
    const sx = X + CW * 0.72, sy = y + H / 2 + 4;
    // the glass slide (or, for the water poured away, the ground by the drain) in the sun; the drop shrinks as its water
    // goes; the crystals stay
    if (why === "salt_gone") P.fillPath(c, (gg) => gg.ellipse(sx, sy + 2, 58, 13, 0, 0, Math.PI * 2), "soil", { outline: "ink3", width: 1, alpha: 0.5 });
    else P.fillPath(c, (gg) => gg.rect(sx - 52, sy - 10, 104, 20), "ice", { outline: "ink2", width: 1.2, alpha: 0.85 });
    if (k < 1) P.fillPath(c, (gg) => gg.ellipse(sx, sy, 34 * (1 - k * 0.85), 7 * (1 - k * 0.7), 0, 0, Math.PI * 2), "water", { outline: null, alpha: 0.7 });
    c.save(); c.globalAlpha *= clamp(k * 1.4 - 0.3, 0, 1);
    heapPts(dis, sx, sy + 3, 26, 4, 99, 0.7).forEach((q) => particle(c, q.part, q.x, q.y, q.k, 1));
    c.restore();
    P.fillPath(c, (gg) => gg.arc(X + CW - 20, y + 18, 9, 0, Math.PI * 2), "sun", { outline: "ink3", width: 1 });
    P.textFit(c, W(`chhaano.slide.${why}`), X + 8 + CW * 0.24, y + H / 2, CW * 0.48 - 8, H - 8, { size: 15, role: "ink", weight: 700 });
    if (k >= 1) P.magnifier(c, sx + 40, sy - 14, 20);
  }

  // ── the tool strip ──
  function drawTools(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), n = tools.length, tw = (g.cw - (n - 1) * g.gap) / n;
    tools.forEach((m, i) => {
      const x = g.x0 + i * (tw + g.gap), y = g.toolY, on = (m === "winnow" && aim) || (panel === "act" && last.m === m && api.t - actAt < HOLD);
      if (!s.done) api.target(`tool-${m}`, x, y, tw, g.toolH);
      P.body(c, x, y, tw, g.toolH, { role: "q2", r: 12, seed: 80 + i, state: on ? "selected" : s.done ? "dim" : "idle" });
      P.textFit(c, W(`chhaano.tool.${m}`), x + tw / 2, y + g.toolH / 2, tw - 8, g.toolH - 6, { size: 16, on: "q2", weight: 800 });
    });
  }

  function draw(c: CanvasRenderingContext2D): void {
    const g = geo(), s = st();
    if (dry) {
      if (panel === "aim" && aim && !s.done) drawAim(c, g);
      else if (panel === "act" && last.m && last.m !== "done") drawAct(c, g);
      else drawCloseUp(c, g, s.piles[sel] ?? [], s.why === "mixed" && s.on === sel);
      drawPiles(c, g);
    } else {
      drawJars(c, g); drawBench(c, g); drawSlide(c, g);
    }
    drawTools(c, g);
  }

  function goal(): string {
    const s = st();
    if (s.done) return W(dry ? "chhaano.done.sukha" : "chhaano.done.geela");
    if (dry && aim) return W(s.why === "thrown" ? "chhaano.why.thrown" : "chhaano.aim");
    const why = s.why, at = s.on;
    if (why) {
      const before = last.before.length ? last.before : (dry ? s.piles[at] : s.ves[at]?.parts) ?? [];
      const light = before.filter((x) => (DRY as Record<string, { wt?: string }>)[x]?.wt === "light"), heavy = before.filter((x) => (DRY as Record<string, { wt?: string }>)[x]?.wt === "heavy");
      const sizeKey = why === "same_size" && sc ? (before.every((x) => DRY[x as DryPart].size <= sc.hole) ? "pass" : "stay") : "";
      const dis = jars.filter((x) => WET[x].kind === "dis");
      const vals: Record<string, string | number> = {
        n: at + 1, parts: names(dry ? s.piles[at] ?? before : before), light: names(light), heavy: names(heavy),
        part: names(why === "lost" ? before.filter((x) => jars.includes(x as WetPart)) : dis.length ? dis : before),
        want: last.jar >= 0 ? name(jars[last.jar]) : "", empty: names(jars.filter((_, q) => !s.jars[q]?.length)),
      };
      return W(`chhaano.why.${why}${sizeKey ? `.${sizeKey}` : ""}`, vals);
    }
    return dry ? W(`chhaano.goal.${p.goal}`) : W(jars.length > 1 ? "chhaano.goal.geela" : "chhaano.goal.geela1", { parts: names(jars) });
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    return [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      // never "your move": the button must not hint when a mixture is separated (the child decides it is)
      { id: "done", label: W("chhaano.done"), aria: W("chhaano.done"), kind: "primary", group: "go", onPress: () => act({ kind: "done" }) },
    ];
  }
  void looksClear;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
