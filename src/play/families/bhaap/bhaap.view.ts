// Bhaap · the 2D view (round 7, processes of water and air; class 6-7 science). Nothing here runs on a clock: every change
// waits for the child's tap, and the animations only show what the law has already answered.
//   a strip on top: what the level asks (the card's changes, the boat's trips, the room's tasks, the cup, the rain, the well)
//   the scene: avastha the pot on the stove with its thermometer (marked only 0 °C and 100 °C), the bubbles, the clear gap and
//              the white cloud above, the cold lid or plate, the sugar glass; bhaapan the wet plate (or shirt, or floor), the
//              lens on the air (the vapour drawn faint inside it: it cannot be seen), the bench with what came from the fridge
//              and its drops, the cup; hawa the beach (the land and the sea, how warm each is, the breeze) or the room (three
//              layers of air, the spots high and low on the wall); chakra the sea, the sky, the cloud and the field, or the
//              ground (its gaps filling from the bottom, the water table, the well, the concrete and the recharge pit)
//   the tools below (tap one to use it).
// After a wrong move only magnifiers mark what to look at again (never the key, never a cross).
import type { BhaapAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { BOIL_AT, DEVICE_OF, FAR, ITEM, MELT_AT, UNITS, avRow, baRow, bhRow, breeze, cellOf, kaRow, kuRow, naRow, toolsOf, type BhaapParams, type BhaapState, type Item } from "./bhaap.logic.ts";

const HOLD = 1.6;   // s: the stage keeps drawing after an act (the last beat lands inside it)

/** a stable 0..1 hash (particle places are the level's own, never random per frame) */
const hash = (n: number) => { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

type Av = { pos: number; phase: "ice" | "water" | "none"; units: number; cover: "none" | "lid" | "plate"; boils: number; lost: number; drops: number; sugar: boolean; next: number; broke: string };
type Bh = { src: number; air: number; bench: { what: Item; drops: number }[]; cup: number; tissue: number };
type Na = { day: boolean; land: number; sea: number; boat: number; trip: number };
type Ka = { cells: number[]; smoke: boolean[]; dev: { what: "ac" | "heater" | "exhaust"; at: 0 | 1 } | null; task: number; cooked: number };
type Ba = { vap: number; cloud: number; field: number; flowed: number };
type Ku = { filled: number; rains: number; pit: boolean; pumped: number };

export const makeBhaapView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<BhaapParams, BhaapState, BhaapAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const tools = toolsOf(p);
  let w = 360, h = 400;
  let actAt = -10, doneAt = -10, cheered = false, sel = 0;
  /** kamra: the device button tapped (the wall's spots are offered) */
  let aim = false;
  let last: { m: string; why: string; ev: string[]; before: unknown } = { m: "", why: "", ev: [], before: null };
  let down: { x: number; y: number } | null = null;

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: BhaapAct) => {
    last = { m: a.kind === "use" ? a.m : a.kind === "put" ? a.what : a.kind, why: "", ev: [], before: JSON.parse(JSON.stringify(st().w)) };
    ctl.dispatch(a); deps.changed();
  };
  function react(ms: Moment[], refused: string | undefined): void {
    const s = st(), now = api.t;
    last.why = s.why; last.ev = s.ev;
    actAt = now; aim = false;
    if (last.m === "undo") last = { m: "", why: "", ev: [], before: null };
    if (goal === "os" || goal === "wapas") {
      const b = (s.w as Bh).bench, k = b.findIndex((x) => x.drops > 0);
      if (!b[sel] || !b[sel].drops) sel = k >= 0 ? k : 0;
    }
    for (const m of ms) if (m.kind === "solved") { doneAt = now + 0.5; cheered = false; }
    const mc = ms.some((m) => m.kind === "misconception_consequence");
    if (refused === "already" || refused === "steady" || refused === "there" || refused === "level_over") api.sfx("refuse");
    else if (refused || mc) { api.sfx("look"); if (!mc) api.fx.shake(2); }
    else api.sfx(last.m === "heat" || last.m === "sun" ? "tick" : last.m === "rain" || last.m === "pump" || last.m === "flow" || last.m === "wipe" ? "pour" : last.m === "sail" ? "slide" : last.m === "put" || ["cold", "coldDrink", "warmDrink", "ac", "heater", "exhaust"].includes(last.m) ? "drop" : "tap");
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
  /** a looping phase for bubbles and drifting cloud while the stage draws (the stage draws only while busy) */
  const loop = (k: number) => (api.reduced ? 0.5 : ((api.t * 0.7 + k) % 1 + 1) % 1);

  // ── input: taps on release ──
  function tap(x: number, y: number): void {
    const id = api.hit(x, y);
    if (!id || st().done) return;
    const i = id.indexOf("-"), kind = id.slice(0, i), rest = id.slice(i + 1);
    if (kind === "tool") {
      if (goal === "kamra" && rest !== "wait") { aim = !aim; api.sfx("select"); api.invalidate(); deps.changed(); return; }
      if (rest === "wipe") { act({ kind: "use", m: "wipe", at: sel }); return; }
      act({ kind: "use", m: rest }); return;
    }
    if (kind === "item") { act({ kind: "put", what: rest, at: (st().w as Bh).bench.length }); return; }
    if (kind === "bench") { sel = Number(rest); api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if (kind === "spot") {
      const task = kaRow(p).tasks[(st().w as Ka).task];
      if (task) act({ kind: "put", what: DEVICE_OF[task], at: Number(rest) });
    }
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind === "down") { down = { x, y }; return; }
    if (kind === "up" && down) { const d = down; down = null; if (Math.hypot(x - d.x, y - d.y) < 14) tap(d.x, d.y); return; }
    if (kind === "cancel") down = null;
  }

  // ── geometry ──
  function geo() {
    const cw = Math.min(w - 16, 620), x0 = (w - cw) / 2, gap = 8;
    const toolH = 50, toolY = h - 8 - toolH;
    const stripH = 40, stripY = 8;
    const rowH = goal === "os" || goal === "wapas" ? 54 : 0;
    const rowY = toolY - gap - rowH;
    const sy = stripY + stripH + gap, sh = (rowH ? rowY : toolY) - gap - sy;
    return { cw, x0, gap, toolH, toolY, stripH, stripY, rowH, rowY, sy, sh };
  }
  type G = ReturnType<typeof geo>;

  // ── the strip: what the level asks ──
  function chips(c: CanvasRenderingContext2D, g: G, items: { label: string; state: "good" | "selected" | "look" | "idle" }[]): void {
    const P = api.P, n = Math.max(1, items.length), cw = (g.cw - (n - 1) * 6) / n;
    items.forEach((it, i) => {
      const x = g.x0 + i * (cw + 6);
      P.body(c, x, g.stripY, cw, g.stripH, { role: "panel", r: 10, seed: 60 + i, state: it.state });
      P.textFit(c, it.label, x + cw / 2, g.stripY + g.stripH / 2 + 1, cw - 10, g.stripH - 4, { size: 14, role: "ink", weight: 700 });
      // the tick and the magnifier sit in the corner, over the edge (the label keeps the whole width)
      if (it.state === "good") P.tick(c, x + cw - 7, g.stripY + 5, 11);
      if (it.state === "look") P.magnifier(c, x + cw - 7, g.stripY + 7, 12);
    });
  }
  /** a label and a row of dots, filled `k` of `n` (no digit on screen) */
  function dots(c: CanvasRenderingContext2D, g: G, label: string, k: number, n: number, role: "q1" | "q2" = "q1"): void {
    const P = api.P;
    P.body(c, g.x0, g.stripY, g.cw, g.stripH, { role: "panel", r: 10, seed: 61, state: k >= n ? "good" : "idle" });
    const lw = Math.min(g.cw * 0.55, 210);
    P.textFit(c, label, g.x0 + 8 + lw / 2, g.stripY + g.stripH / 2, lw, g.stripH - 4, { size: 14, role: "ink", weight: 700 });
    const dx = Math.min(22, (g.cw - lw - 30) / Math.max(1, n));
    for (let i = 0; i < n; i++) P.circle(c, g.x0 + lw + 22 + i * dx, g.stripY + g.stripH / 2, 6.5, { role: i < k ? role : "ink3", fill: i < k, width: 2 });
  }
  function drawStrip(c: CanvasRenderingContext2D, g: G): void {
    const s = st();
    switch (goal) {
      case "badlo": {
        const a = s.w as Av, card = avRow(p).card;
        chips(c, g, card.map((ch, i) => ({ label: W(`bhaap.change.${ch}`), state: i < a.next ? "good" : a.broke && i === a.next ? "look" : i === a.next && !s.done ? "selected" : "idle" })));
        return;
      }
      case "bachao": { const a = s.w as Av; dots(c, g, W("bhaap.strip.boils"), Math.min(a.boils, avRow(p).boils), avRow(p).boils, "q2"); return; }
      case "os": case "wapas": { const b = s.w as Bh; dots(c, g, W("bhaap.strip.cup"), b.cup, bhRow(p).need); return; }
      case "naav": { const n = s.w as Na; chips(c, g, naRow(p).trips.map((t, i) => ({ label: W(`bhaap.trip.${t}`), state: i < n.trip ? "good" : i === n.trip && !s.done ? "selected" : "idle" }))); return; }
      case "kamra": { const k = s.w as Ka; chips(c, g, kaRow(p).tasks.map((t, i) => ({ label: W(`bhaap.task.${t}`), state: i < k.task ? "good" : i === k.task && !s.done ? "selected" : "idle" }))); return; }
      case "baadal": { const b = s.w as Ba, r = baRow(p); dots(c, g, W(r.flow ? "bhaap.strip.flowed" : "bhaap.strip.rain"), Math.min(r.need, r.flow ? b.flowed : b.field), r.need); return; }
      case "kuan": { const k = s.w as Ku, r = kuRow(p); dots(c, g, W("bhaap.strip.pumps"), Math.min(k.pumped, r.pumps), r.pumps, "q2"); return; }
    }
  }

  // ── avastha: the pot ──
  function drawPot(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), a = s.w as Av, X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 3 });
    const badlo = goal === "badlo";
    // the thermometer: a tube with a bulb; marks at 0 °C and 100 °C only (the kit's numbers)
    const tx = X + 30, tTop = Y + 30, tBot = Y + H - 34, notch = (i: number) => lerp(tBot - 10, tTop + 8, i / BOIL_AT);
    P.fillPath(c, (q) => { q.rect(tx - 5, tTop, 10, tBot - tTop); }, "cotton", { outline: "ink2", width: 1.5 });
    P.fillPath(c, (q) => q.arc(tx, tBot + 6, 10, 0, Math.PI * 2), "red", { outline: "ink2", width: 1.5 });
    const before = last.before as Av | null, pos0 = last.m && before && typeof before.pos === "number" ? before.pos : a.pos;
    const ly = lerp(notch(pos0), notch(a.pos), prog());
    P.fillPath(c, (q) => q.rect(tx - 3, ly, 6, tBot + 2 - ly), "red", { outline: null });
    for (let i = 0; i <= BOIL_AT; i++) P.stroke(c, [[tx + 6, notch(i)], [tx + (i === MELT_AT || i === BOIL_AT ? 16 : 11), notch(i)]], { role: "ink2", width: i === MELT_AT || i === BOIL_AT ? 2.5 : 1.2 });
    P.text(c, W("bhaap.mark.boil"), tx + 18, notch(BOIL_AT), { size: 14, role: "ink", weight: 700, align: "left" });
    P.text(c, W("bhaap.mark.melt"), tx + 18, notch(MELT_AT), { size: 14, role: "ink", weight: 700, align: "left" });
    // the pot (the stove under it; the freezer's frost behind it below 0 °C)
    const right = badlo ? X + CW - 78 : X + CW - 10, pcx = (X + 96 + right) / 2, pw = Math.min(right - X - 110, 150), ph = Math.min(H * 0.34, 92);
    const pBot = Y + H - 34, pTop = pBot - ph;
    if (a.pos === 0) P.fillPath(c, (q) => q.rect(pcx - pw / 2 - 12, pTop - 16, pw + 24, ph + 30), "frost", { outline: "ink3", width: 1, alpha: 0.6 });
    P.fillPath(c, (q) => q.rect(pcx - pw / 2 - 6, pBot + 4, pw + 12, 8), "iron", { outline: "ink2", width: 1 });
    if (last.m === "heat" && api.t - actAt < HOLD) for (let i = 0; i < 4; i++) { const fx = pcx - pw / 3 + (i * pw) / 4.5; P.fillPath(c, (q) => { q.moveTo(fx - 6, pBot + 4); q.quadraticCurveTo(fx, pBot - 12 - (i % 2) * 5, fx + 6, pBot + 4); q.closePath(); }, "glow", { outline: null, alpha: 0.9 }); }
    // what is in it: ice cubes, or water up to its level; big bubbles while it boils
    const fill = a.units / UNITS, lvlBefore = before && typeof before.units === "number" ? before.units / UNITS : fill;
    const lv = lerp(lvlBefore, fill, prog(0.2)), wTop = pBot - (ph - 10) * lv;
    if (a.phase === "water" || (a.phase === "none" && lv > 0.01)) P.fillPath(c, (q) => q.rect(pcx - pw / 2 + 3, wTop, pw - 6, pBot - wTop), "water", { outline: null, alpha: 0.55 });
    if (a.phase === "ice") for (let i = 0; i < a.units * 2; i++) { const cx = pcx - pw / 2 + 16 + (i % 4) * ((pw - 32) / 3), cy = pBot - 14 - Math.floor(i / 4) * 22; P.fillPath(c, (q) => q.rect(cx - 10, cy - 10, 20, 20), "ice", { outline: "ink2", width: 1.2 }); }
    const boiling = a.pos === BOIL_AT && a.phase === "water";
    if (boiling) for (let i = 0; i < 6; i++) { const k = loop(i / 6), bx = pcx - pw / 2 + 14 + hash(i * 7 + p.lay) * (pw - 28), by = lerp(pBot - 6, wTop + 6, k); P.circle(c, bx, by, 3 + k * 4, { role: "ink2", width: 1.5 }); }
    P.stroke(c, [[pcx - pw / 2, pTop], [pcx - pw / 2, pBot], [pcx + pw / 2, pBot], [pcx + pw / 2, pTop]], { role: "ink", width: 2.5 });
    // above it: the clear gap (vapour, invisible), then the white cloud of droplets; or the lid; or the plate up in the cloud
    const steaming = boiling || (last.ev.includes("boil") && api.t - actAt < HOLD);
    if (a.cover === "lid") {
      P.fillPath(c, (q) => q.rect(pcx - pw / 2 - 6, pTop - 8, pw + 12, 8), "steel", { outline: "ink2", width: 1.5 });
      if (a.drops) for (let i = 0; i < Math.min(8, a.drops * 3); i++) P.fillPath(c, (q) => q.arc(pcx - pw / 2 + 10 + i * ((pw - 20) / 7), pTop + 3, 2.4, 0, Math.PI * 2), "water", { outline: null });
    } else if (steaming) {
      // the clear gap right above the water (nothing drawn: vapour cannot be seen), then the cloud of tiny droplets
      const cy = Math.max(Y + 26, pTop - 52);
      for (let i = 0; i < 12; i++) { const k = loop(i / 12 + 0.3), cx = pcx + (hash(i * 3 + 1) - 0.5) * pw * 0.6; P.fillPath(c, (q) => q.arc(cx + k * 6, cy - k * 10 + (hash(i) - 0.5) * 12, 6 + hash(i * 5) * 5, 0, Math.PI * 2), "cotton", { outline: "ink3", width: 0.8, alpha: 0.9 * (1 - k * 0.5) }); }
      for (let i = 0; i < 10; i++) P.fillPath(c, (q) => q.arc(pcx + (hash(i * 7 + 2) - 0.5) * pw * 0.55, cy + (hash(i * 9) - 0.5) * 16, 1.6, 0, Math.PI * 2), "water", { outline: null });
      if (s.why === "gap" || s.why === "lost") {
        P.stroke(c, [[pcx - pw * 0.35, pTop - 10], [pcx + pw * 0.35, pTop - 10]], { role: "look", width: 2, dash: [3, 3] });
        P.textFit(c, W("bhaap.gap"), pcx - 10, pTop - 24, pw + 20, 22, { size: 14, role: "ink", weight: 800 });
        P.textFit(c, W("bhaap.cloud"), pcx - pw / 2 - 4, cy, 66, 36, { size: 14, role: "ink", weight: 800, align: "right" });
        P.magnifier(c, pcx + pw / 2 + 8, pTop - 12, 20);
      }
    }
    if (a.cover === "plate") {
      const py = Math.max(Y + 30, pTop - 58);
      P.fillPath(c, (q) => q.ellipse(pcx, py, pw * 0.42, 6, 0, 0, Math.PI * 2), "steel", { outline: "ink2", width: 1.5 });
      for (let i = 0; i < Math.min(6, a.drops * 2); i++) P.fillPath(c, (q) => q.arc(pcx - pw * 0.3 + i * (pw * 0.12), py + 7, 2.4, 0, Math.PI * 2), "water", { outline: null });
    }
    if (!badlo) return;
    // the glass beside it, and the sugar
    const gx = X + CW - 40, gBot = pBot, gTop = gBot - 66;
    P.fillPath(c, (q) => q.rect(gx - 20, gTop + 16, 40, gBot - gTop - 16), "water", { outline: null, alpha: 0.45 });
    P.stroke(c, [[gx - 22, gTop], [gx - 20, gBot], [gx + 20, gBot], [gx + 22, gTop]], { role: "ink", width: 2 });
    const sk = last.m === "sugar" ? prog(0.1) : a.sugar ? 1 : 0;
    if (!a.sugar) for (let i = 0; i < 6; i++) P.fillPath(c, (q) => q.rect(gx - 12 + (i % 3) * 9, gTop - 14 - Math.floor(i / 3) * 7, 5, 5), "salt", { outline: "ink3", width: 0.8 });
    else if (sk < 1) for (let i = 0; i < 6; i++) { const yy = lerp(gTop + 18, gBot - 8, sk); c.save(); c.globalAlpha *= 1 - sk; P.fillPath(c, (q) => q.rect(gx - 12 + (i % 3) * 9, yy - (i % 2) * 6, 5, 5), "salt", { outline: "ink3", width: 0.8 }); c.restore(); }
    P.textFit(c, W(a.sugar ? "bhaap.glass.sweet" : "bhaap.glass.water"), gx, gBot + 14, 76, 34, { size: 14, role: "ink2", weight: 700 });
    if (s.why === "off_card" && a.broke === "dissolve") P.magnifier(c, gx + 14, gTop - 4, 20);
  }

  // ── bhaapan: the air ──
  function drawAir(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), b = s.w as Bh, r = bhRow(p), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 4 });
    const foot = Y + H - 12;
    // the source on the left: a plate, a shirt on the line or a wet floor (the water shown as its level; none in "os")
    const sx = X + CW * 0.18, srcK = r.src ? b.src / r.src : 0;
    if (r.srcKind === "plate") {
      P.fillPath(c, (q) => q.ellipse(sx, foot - 8, 42, 10, 0, 0, Math.PI * 2), "steel", { outline: "ink2", width: 1.5 });
      if (b.src) P.fillPath(c, (q) => q.ellipse(sx, foot - 10, 34 * Math.sqrt(srcK), 6 * srcK + 1, 0, 0, Math.PI * 2), "water", { outline: null, alpha: 0.8 });
    } else if (r.srcKind === "clothes") {
      P.stroke(c, [[X + 10, Y + 34], [X + CW * 0.36, Y + 34]], { role: "ink2", width: 1.5 });
      P.fillPath(c, (q) => { q.moveTo(sx - 26, Y + 34); q.lineTo(sx + 26, Y + 34); q.lineTo(sx + 22, Y + 92); q.lineTo(sx - 22, Y + 92); q.closePath(); }, b.src ? "blue" : "cotton", { outline: "ink2", width: 1.5, alpha: b.src ? 0.4 + 0.5 * srcK : 1 });
      for (let i = 0; i < b.src; i++) P.fillPath(c, (q) => q.arc(sx - 12 + i * 8, Y + 102 + (i % 2) * 6, 2.6, 0, Math.PI * 2), "water", { outline: null });
    } else if (r.srcKind === "floor") {
      P.stroke(c, [[X + 10, foot], [X + CW * 0.36, foot]], { role: "ink3", width: 2 });
      if (b.src) P.fillPath(c, (q) => q.ellipse(sx, foot - 3, 46 * Math.sqrt(srcK), 5, 0, 0, Math.PI * 2), "water", { outline: null, alpha: 0.7 });
    } else {
      // os: the air came in full of vapour (a bath, the monsoon, a winter night)
      P.textFit(c, W(`bhaap.air.${p.scene}`), sx, Y + H * 0.5, CW * 0.3, 60, { size: 14, role: "ink2", weight: 700 });
    }
    if (r.srcKind && !b.src) P.textFit(c, W("bhaap.src.dry"), sx, foot - 30, CW * 0.3, 22, { size: 14, role: "ink2", weight: 700 });
    // the lens on the air: the vapour is invisible; inside the lens each unit is a faint dot
    const lr = Math.min(30, H * 0.14), lx = X + CW * 0.54, lyy = Y + 8 + lr;
    c.save(); c.beginPath(); c.arc(lx, lyy, lr, 0, Math.PI * 2); c.clip();
    P.fillPath(c, (q) => q.arc(lx, lyy, lr, 0, Math.PI * 2), "paper", { outline: null, alpha: 0.7 });
    for (let i = 0; i < b.air * 3; i++) P.circle(c, lx + (hash(i * 11 + p.lay) - 0.5) * lr * 1.5, lyy + (hash(i * 13 + 2) - 0.5) * lr * 1.5, 2.4, { role: "q1", width: 1.2, alpha: 0.7 });
    c.restore();
    P.circle(c, lx, lyy, lr, { role: s.why === "in_air" ? "look" : "ink2", width: 2.5 });
    P.textFit(c, W("bhaap.lens"), lx, lyy + lr + 17, CW * 0.44, 34, { size: 14, role: "ink2", weight: 700 });
    if (s.why === "in_air") P.magnifier(c, lx + lr, lyy - lr + 6, 20);
    if (last.ev.includes("evaporate") && api.t - actAt < HOLD) { const k = prog(); P.circle(c, lerp(sx, lx, k), lerp(foot - 20, lyy, k), 3, { role: "q1", width: 1.5, alpha: 1 - k * 0.5 }); }
    // the bench: what came from the fridge, with its drops (tap one to choose it for the tissue)
    const bx0 = X + CW * 0.36, bw = (X + CW - 8 - bx0 - 6) / 2, bh = clamp(H - (lr * 2 + 8 + 36) - 16, 70, 96);
    for (let i = 0; i < 2; i++) {
      const x = bx0 + i * (bw + 6), y = Y + H - bh - 8, it = b.bench[i];
      if (!it) { P.body(c, x, y, bw, bh, { role: "panel", r: 10, seed: 40 + i, state: "ghost" }); continue; }
      if (!s.done) api.target(`bench-${i}`, x, y, bw, bh);
      const lookHere = s.why === "warm" && it.what === "warmDrink";
      P.body(c, x, y, bw, bh, { role: "panel", r: 10, seed: 40 + i, state: i === sel && it.drops ? "selected" : lookHere ? "look" : "idle" });
      const gx = x + bw / 2, gTop = y + 14, gBot = y + bh - 28;
      if (ITEM[it.what].drink) P.fillPath(c, (q) => q.rect(gx - 15, gTop + 10, 30, gBot - gTop - 10), "plastic", { outline: null, alpha: 0.75 });
      P.fillPath(c, (q) => { q.moveTo(gx - 18, gTop); q.lineTo(gx - 15, gBot); q.lineTo(gx + 15, gBot); q.lineTo(gx + 18, gTop); }, ITEM[it.what].drink ? "ice" : "steel", { outline: "ink", width: 1.8, alpha: ITEM[it.what].drink ? 0.35 : 0.9 });
      if (ITEM[it.what].cold) P.fillPath(c, (q) => q.rect(gx - 4, gTop - 6, 8, 4), "frost", { outline: null });
      else for (let k = 0; k < 2; k++) P.stroke(c, [[gx - 6 + k * 10, gTop - 4], [gx - 2 + k * 10, gTop - 10], [gx - 6 + k * 10, gTop - 16]], { role: "ink3", width: 1.5 });
      for (let d = 0; d < Math.min(10, it.drops * 3); d++) P.fillPath(c, (q) => q.arc(gx + (d % 2 ? 18 : -18), gTop + 6 + (d >> 1) * ((gBot - gTop - 8) / 4), 2.8, 0, Math.PI * 2), "water", { outline: "ink3", width: 0.6 });
      P.textFit(c, W(`bhaap.item.${it.what}`), gx, y + bh - 13, bw - 6, 22, { size: 14, role: "ink", weight: 700 });
      if (lookHere) P.magnifier(c, x + bw - 12, y + 14, 18);
    }
    // the cup (what the tissue brought), and the tissue: the drops are clear water
    const cx = X + CW - 22, cy = Y + 26;
    P.fillPath(c, (q) => { q.moveTo(cx - 14, cy - 12); q.lineTo(cx - 11, cy + 14); q.lineTo(cx + 11, cy + 14); q.lineTo(cx + 14, cy - 12); }, "cotton", { outline: "ink", width: 1.5 });
    if (b.cup) P.fillPath(c, (q) => q.rect(cx - 11, cy + 14 - Math.min(24, b.cup * 6), 22, Math.min(24, b.cup * 6)), "water", { outline: null, alpha: 0.8 });
    if (last.m === "wipe" && api.t - actAt < HOLD) P.textFit(c, W("bhaap.tissue"), X + CW * 0.18, Y + 24, CW * 0.34, 40, { size: 14, role: "ink2", weight: 700 });
  }
  /** bhaapan: the fridge's three things (tap one to put it on the bench) */
  function drawFridge(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), b = s.w as Bh, n = p.order.length, iw = (g.cw - (n - 1) * g.gap) / n;
    p.order.forEach((what, i) => {
      const x = g.x0 + i * (iw + g.gap), out = b.bench.some((x2) => x2.what === what);
      if (!s.done && !out && b.bench.length < 2) api.target(`item-${what}`, x, g.rowY, iw, g.rowH);
      P.body(c, x, g.rowY, iw, g.rowH, { role: "q3", r: 10, seed: 70 + i, state: out || s.done ? "dim" : "idle" });
      P.textFit(c, W(`bhaap.fridge.${what}`), x + iw / 2, g.rowY + g.rowH / 2, iw - 8, g.rowH - 6, { size: 14, on: "q3", weight: 700 });
    });
  }

  // ── hawa: the beach ──
  function drawBeach(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), n = s.w as Na, X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 5 });
    const ground = Y + H - 44, mid = X + CW * 0.45;
    // the sun or the moon
    if (n.day) P.fillPath(c, (q) => q.arc(X + 30, Y + 26, 13, 0, Math.PI * 2), "sun", { outline: "ink3", width: 1 });
    else P.fillPath(c, (q) => { q.arc(X + 30, Y + 26, 12, 0.6, Math.PI * 2 - 0.6); q.arc(X + 36, Y + 22, 9, Math.PI * 2 - 0.9, 0.9, true); q.closePath(); }, "white", { outline: "ink2", width: 1.2 });
    P.text(c, W(n.day ? "bhaap.time.day" : "bhaap.time.night"), X + 50, Y + 26, { size: 14, role: "ink", weight: 700, align: "left" });
    // the land and the sea
    P.fillPath(c, (q) => { q.rect(X + 6, ground, mid - X - 6, Y + H - 6 - ground); }, "soil", { outline: "ink2", width: 1.5 });
    P.fillPath(c, (q) => { q.rect(mid, ground + 6, X + CW - 6 - mid, Y + H - 12 - ground); }, "water", { outline: "ink2", width: 1.5, alpha: 0.85 });
    P.textFit(c, W("bhaap.land"), X + (mid - X) / 2, ground + 22, mid - X - 20, 22, { size: 14, role: "ink", weight: 700 });
    P.textFit(c, W("bhaap.sea"), mid + (X + CW - mid) / 2, ground + 24, X + CW - mid - 20, 22, { size: 14, role: "ink", weight: 700 });
    // how warm each is: a bar (warmer / cooler, never a number)
    const bar = (x: number, v: number, max: number) => {
      const top = ground - 64, bh = 50, k = (v + max) / (2 * max);
      P.fillPath(c, (q) => q.rect(x - 4, top, 8, bh), "cotton", { outline: "ink2", width: 1 });
      P.fillPath(c, (q) => q.rect(x - 2.5, top + bh * (1 - k), 5, bh * k), "red", { outline: null });
    };
    bar(X + 26, n.land, 4); bar(X + CW - 26, n.sea, 4);
    // the breeze: air rising over the warmer side, sinking over the cooler, along the ground from cool to warm
    const br = breeze(n.land, n.sea), k = prog(0.1);
    if (br) {
      const warmX = br === "in" ? X + (mid - X) * 0.55 : mid + (X + CW - mid) * 0.5, coolX = br === "in" ? mid + (X + CW - mid) * 0.5 : X + (mid - X) * 0.55;
      const lowY = ground - 14, highY = Y + 52;
      const arrow = (x1: number, y1: number, x2: number, y2: number, role: "q2" | "ink3", wd: number) => {
        P.stroke(c, [[x1, y1], [x2, y2]], { role, width: wd });
        const a = Math.atan2(y2 - y1, x2 - x1), L = 9;
        P.stroke(c, [[x2 - L * Math.cos(a - 0.5), y2 - L * Math.sin(a - 0.5)], [x2, y2], [x2 - L * Math.cos(a + 0.5), y2 - L * Math.sin(a + 0.5)]], { role, width: wd });
      };
      arrow(warmX, lowY - 4, warmX, highY + 10, "ink3", 2);
      arrow(coolX, highY + 10, coolX, lowY - 4, "ink3", 2);
      arrow(warmX, highY, coolX, highY, "ink3", 2);
      arrow(coolX, lowY, lerp(coolX, warmX, 0.3 + 0.7 * k), lowY, "q2", 3.5);
      P.textFit(c, W(br === "in" ? "bhaap.breeze.sea" : "bhaap.breeze.land"), (warmX + coolX) / 2, lowY - 48, Math.abs(warmX - coolX) - 20, 22, { size: 14, role: "q2", weight: 800 });
    } else P.textFit(c, W("bhaap.breeze.calm"), X + CW / 2, ground - 30, CW * 0.6, 22, { size: 14, role: "ink2", weight: 700 });
    // the boat: at the shore (0), on the way, at the fishing place (FAR)
    const before = last.before as Na | null, b0 = last.m === "sail" && before ? before.boat : n.boat;
    const bpos = lerp(b0, n.boat, prog(0.05)), bx = lerp(mid + 26, X + CW - 46, bpos / FAR), by = ground + 4;
    P.fillPath(c, (q) => { q.moveTo(bx - 22, by); q.lineTo(bx + 22, by); q.lineTo(bx + 14, by + 10); q.lineTo(bx - 14, by + 10); q.closePath(); }, "wood", { outline: "ink2", width: 1.5 });
    P.stroke(c, [[bx, by], [bx, by - 34]], { role: "ink2", width: 2 });
    P.fillPath(c, (q) => { q.moveTo(bx + 1, by - 32); q.lineTo(bx + 1, by - 6); q.lineTo(bx + (br === "in" ? -18 : 18), by - 10); q.closePath(); }, "cotton", { outline: "ink2", width: 1.2 });
    // the fishing place: a buoy with a flag
    P.stroke(c, [[X + CW - 30, ground + 10], [X + CW - 30, ground - 14]], { role: "ink2", width: 1.5 });
    P.fillPath(c, (q) => { q.moveTo(X + CW - 30, ground - 14); q.lineTo(X + CW - 18, ground - 10); q.lineTo(X + CW - 30, ground - 6); q.closePath(); }, "red", { outline: "ink3", width: 1 });
    P.fillPath(c, (q) => q.arc(X + CW - 30, ground + 12, 5, 0, Math.PI * 2), "red", { outline: "ink3", width: 1 });
    if ((s.why === "ashore" || s.why === "far_out" || s.why === "wrong_way") && k >= 0.6) P.magnifier(c, bx + 24, by - 30, 20);
  }

  // ── hawa: the room ──
  function drawRoom(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), r = s.w as Ka, X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 6 });
    const rx = X + 70, rw = CW - 80, ry = Y + 10, rh = H - 20, lh = rh / 3;
    const task = kaRow(p).tasks[r.task];
    // the three layers of air: cool, fresh or warm; smoke drawn in the layers that hold it
    for (let i = 0; i < 3; i++) {
      const v = r.cells[i], y = ry + i * lh;
      P.fillPath(c, (q) => q.rect(rx, y, rw, lh), v < 0 ? "ice" : v > 0 ? "clay" : "paper", { outline: "ink3", width: 1, alpha: v === 0 ? 0.5 : 0.55 });
      P.textFit(c, W(v < 0 ? "bhaap.air.cool" : v > 0 ? "bhaap.air.warm" : "bhaap.air.fresh"), rx + rw - 46, y + lh / 2, 84, lh - 6, { size: 14, role: "ink", weight: 700 });
      if (r.smoke[i]) for (let k = 0; k < 6; k++) P.fillPath(c, (q) => q.arc(rx + 20 + k * ((rw - 120) / 5), y + lh / 2 + (hash(k * 9 + i) - 0.5) * lh * 0.4, 7 + hash(k) * 4, 0, Math.PI * 2), "graphite", { outline: null, alpha: 0.35 });
    }
    P.stroke(c, [[rx, ry], [rx, ry + rh]], { role: "ink", width: 3 });
    // the stove at the floor (the kitchen)
    if (task === "clear" || kaRow(p).tasks.includes("clear")) {
      const sx = rx + rw * 0.45, sy = ry + rh - 6;
      P.fillPath(c, (q) => q.rect(sx - 24, sy - 12, 48, 12), "iron", { outline: "ink2", width: 1 });
      P.fillPath(c, (q) => { q.moveTo(sx - 8, sy - 12); q.quadraticCurveTo(sx, sy - 28, sx + 8, sy - 12); q.closePath(); }, "glow", { outline: null });
    }
    // the device on the wall
    const spotY = (at: 0 | 1) => (at === 0 ? ry + 6 : ry + rh - 48);
    if (r.dev) {
      const y = spotY(r.dev.at);
      P.body(c, X + 6, y, 58, 42, { role: "q4", r: 8, seed: 90, state: s.why === "stays_warm" ? "look" : "idle" });
      P.textFit(c, W(`bhaap.dev.${r.dev.what}`), X + 35, y + 21, 52, 38, { size: 14, on: "q4", weight: 800 });
      if (s.why === "stays_warm") P.magnifier(c, rx + rw / 2, ry + lh / 2, 22);
    }
    // the spots offered when a device is in hand
    if (aim && task && !s.done) for (const at of [0, 1] as const) {
      const y = spotY(at);
      api.target(`spot-${at}`, X + 4, y - 2, 62, 46);
      P.body(c, X + 4, y - 2, 62, 46, { role: "panel", r: 8, seed: 91 + at, state: "hover" });
      P.textFit(c, W(at === 0 ? "bhaap.spot.high" : "bhaap.spot.low"), X + 35, y + 21, 54, 40, { size: 14, role: "ink", weight: 800 });
    }
    // what moved this wait: the warm air rising, the cool sinking
    if (last.m === "wait" && api.t - actAt < HOLD && !s.why) {
      const k = prog();
      P.stroke(c, [[rx + rw * 0.25, ry + rh - lh * (0.3 + k)], [rx + rw * 0.25, ry + rh - lh * (0.3 + k) - 12]], { role: "q2", width: 3 });
      P.stroke(c, [[rx + rw * 0.6, ry + lh * (0.3 + k)], [rx + rw * 0.6, ry + lh * (0.3 + k) + 12]], { role: "q1", width: 3 });
    }
  }

  // ── chakra: the cycle ──
  function drawCycle(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), b = s.w as Ba, r = baRow(p), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 7 });
    const ground = Y + H - 40, mid = X + CW * 0.48;
    P.fillPath(c, (q) => q.arc(X + 26, Y + 24, 13, 0, Math.PI * 2), "sun", { outline: "ink3", width: 1 });
    P.fillPath(c, (q) => q.rect(X + 6, ground, mid - X - 6, Y + H - 6 - ground), "water", { outline: "ink2", width: 1.5, alpha: 0.85 });
    P.fillPath(c, (q) => q.rect(mid, ground - 4, X + CW - 6 - mid, Y + H - 2 - ground), "soil", { outline: "ink2", width: 1.5 });
    P.textFit(c, W("bhaap.sea"), X + (mid - X) / 2, ground + 18, mid - X - 16, 22, { size: 14, role: "ink", weight: 700 });
    P.textFit(c, W("bhaap.field"), mid + (X + CW - mid) / 2, ground + 18, X + CW - mid - 16, 22, { size: 14, role: "ink", weight: 700 });
    // the field's water, and the river back to the sea
    if (b.field) P.fillPath(c, (q) => q.ellipse(mid + (X + CW - mid) / 2, ground - 4, 18 + b.field * 8, 4, 0, 0, Math.PI * 2), "water", { outline: null, alpha: 0.8 });
    if (r.flow) {
      // the river from the field down to the sea
      P.fillPath(c, (q) => { q.moveTo(mid + 60, ground - 4); q.quadraticCurveTo(mid + 20, ground + 10, mid - 8, ground + 8); q.lineTo(mid - 8, ground + 16); q.quadraticCurveTo(mid + 24, ground + 18, mid + 66, ground - 4); q.closePath(); }, "water", { outline: "ink2", width: 1, alpha: b.flowed || (last.m === "flow" && api.t - actAt < HOLD) ? 0.95 : 0.4 });
      P.textFit(c, W("bhaap.river"), mid + 40, ground - 16, 70, 20, { size: 14, role: "ink2", weight: 700 });
    }
    // the vapour over the sea: invisible, drawn faint inside the lens
    const lx = X + (mid - X) * 0.55, lyy = ground - 46, lr = 26;
    c.save(); c.beginPath(); c.arc(lx, lyy, lr, 0, Math.PI * 2); c.clip();
    P.fillPath(c, (q) => q.arc(lx, lyy, lr, 0, Math.PI * 2), "paper", { outline: null, alpha: 0.7 });
    for (let i = 0; i < b.vap * 3; i++) P.circle(c, lx + (hash(i * 7 + p.lay) - 0.5) * lr * 1.4, lyy + (hash(i * 5 + 3) - 0.5) * lr * 1.4, 2.4, { role: "q1", width: 1.2, alpha: 0.7 });
    c.restore();
    P.circle(c, lx, lyy, lr, { role: s.why === "no_cloud" ? "look" : "ink2", width: 2.5 });
    P.textFit(c, W("bhaap.lens.short"), lx + lr + 40, lyy, 74, 36, { size: 14, role: "ink2", weight: 700 });
    if (s.why === "no_cloud") P.magnifier(c, lx + lr, lyy - lr + 4, 18);
    // high and cooler: the cloud of tiny droplets
    const cx = X + CW * 0.6, cy = Y + 36, before = last.before as Ba | null;
    const cl = b.cloud || (last.m === "rain" && before ? before.cloud * (1 - prog()) : 0);
    if (cl > 0) for (let i = 0; i < 4 + Math.ceil(cl) * 3; i++) P.fillPath(c, (q) => q.arc(cx + (hash(i * 3) - 0.5) * (50 + cl * 18), cy + (hash(i * 5) - 0.5) * 18, 9 + hash(i * 7) * 7, 0, Math.PI * 2), "cotton", { outline: "ink3", width: 0.8 });
    P.textFit(c, W("bhaap.high"), X + CW - 66, Y + 20, 120, 34, { size: 14, role: "ink2", weight: 700 });
    if (last.m === "rise" && api.t - actAt < HOLD) { const k = prog(); P.circle(c, lerp(lx, cx, k), lerp(lyy, cy, k), 4, { role: "q1", width: 1.5 }); }
    if (last.m === "rain" && api.t - actAt < HOLD && !s.why) for (let i = 0; i < 10; i++) { const k = clamp(prog() * 1.3 - (i % 4) * 0.08, 0, 1), dx = cx + 30 + (hash(i * 11) - 0.5) * 80; P.stroke(c, [[dx, lerp(cy + 14, ground - 8, k)], [dx - 2, lerp(cy + 14, ground - 8, k) + 7]], { role: "q1", width: 2 }); }
  }

  // ── chakra: the ground ──
  function drawGround(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), k = s.w as Ku, r = kuRow(p), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 8 });
    const surf = Y + 52, bot = Y + H - 8, gh = (bot - surf) / r.cap, half = X + CW * 0.52;
    // the surface: open soil on the left, the concrete courtyard on the right (its drain at the edge), the pit under it
    P.fillPath(c, (q) => q.rect(X + 6, surf - 6, half - X - 6, 6), "leaf", { outline: "ink2", width: 1 });
    P.fillPath(c, (q) => q.rect(half, surf - 8, X + CW - 6 - half, 8), "steel", { outline: "ink2", width: 1 });
    P.textFit(c, W("bhaap.open"), X + CW * 0.14, surf - 14, CW * 0.24, 22, { size: 14, role: "ink", weight: 700 });
    P.textFit(c, W(k.pit ? "bhaap.concrete.pit" : "bhaap.concrete"), half + (X + CW - half) / 2, surf - 15, X + CW - half - 16, 22, { size: 14, role: "ink", weight: 700 });
    // the layers, bottom-up (cracked rock, gravel, sand, soil): each row of gaps full (water) or empty (air); the water table
    for (let i = 0; i < r.cap; i++) {
      const y = bot - (i + 1) * gh, full = i < k.filled, mat = i < 2 ? "iron" : i < 4 ? "steel" : "soil";
      P.fillPath(c, (q) => q.rect(X + 6, y, CW - 12, gh), mat, { outline: "ink3", width: 0.8, alpha: 0.35 });
      for (let j = 0; j < 12; j++) { const gx = X + 18 + j * ((CW - 36) / 11), gr = Math.min(4.5, gh * 0.25); if (full) P.fillPath(c, (q) => q.arc(gx, y + gh / 2, gr, 0, Math.PI * 2), "water", { outline: "ink2", width: 1 }); else P.circle(c, gx, y + gh / 2, gr, { role: "ink3", width: 1.2 }); }
    }
    const tableY = bot - k.filled * gh;
    P.stroke(c, [[X + 6, tableY], [X + CW - 6, tableY]], { role: "ink", width: 2.5, dash: [6, 4] });
    P.text(c, W("bhaap.table"), X + CW - 12, tableY - 10, { size: 14, role: "ink", weight: 800, align: "right" });
    // the well: a shaft from the surface to its bottom; water in it up to the table while the table is above its bottom
    const wx = X + CW * 0.36, wBot = bot - r.well * gh;
    P.fillPath(c, (q) => q.rect(wx - 12, surf - 14, 24, wBot - surf + 14), "paper", { outline: "ink", width: 2 });
    if (k.filled > r.well) P.fillPath(c, (q) => q.rect(wx - 10, tableY, 20, wBot - tableY), "water", { outline: null, alpha: 0.85 });
    P.textFit(c, W("bhaap.well"), wx, surf - 32, 60, 20, { size: 14, role: "ink", weight: 700 });
    if (s.why === "dry") P.magnifier(c, wx + 26, wBot - 6, 20);
    if (k.pit) { const px = half + 30; P.fillPath(c, (q) => q.rect(px - 16, surf, 32, gh * 1.6), "clay", { outline: "ink2", width: 1.5 }); for (let j = 0; j < 4; j++) P.circle(c, px - 8 + (j % 2) * 16, surf + 8 + Math.floor(j / 2) * 12, 4, { role: "ink2", width: 1.2 }); }
    // rain: on the open soil it seeps down; on the concrete it runs to the drain (or into the pit)
    if (last.m === "rain" && api.t - actAt < HOLD && !s.why) for (let i = 0; i < 12; i++) { const t = clamp(prog() * 1.3 - (i % 4) * 0.08, 0, 1), dx = X + 20 + (i / 11) * (CW - 40); P.stroke(c, [[dx, lerp(Y + 6, surf - 10, t)], [dx - 2, lerp(Y + 6, surf - 10, t) + 7]], { role: "q1", width: 2 }); }
    // the rains left in the monsoon
    for (let i = 0; i < k.rains; i++) P.fillPath(c, (q) => { q.arc(X + CW - 26 - i * 34, Y + 16, 8, 0, Math.PI * 2); q.arc(X + CW - 16 - i * 34, Y + 17, 7, 0, Math.PI * 2); q.arc(X + CW - 36 - i * 34, Y + 18, 6, 0, Math.PI * 2); }, "cotton", { outline: "ink2", width: 1 });
  }

  // ── the tool strip ──
  function drawTools(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st();
    const ids = goal === "kamra" ? [...(kaRow(p).tasks[(s.w as Ka).task] ? [DEVICE_OF[kaRow(p).tasks[(s.w as Ka).task]]] : []), "wait"] : tools;
    const n = ids.length, tw = (g.cw - (n - 1) * g.gap) / n;
    ids.forEach((m, i) => {
      const x = g.x0 + i * (tw + g.gap), y = g.toolY;
      const on = (goal === "kamra" && m !== "wait" && aim) || (last.m === m && api.t - actAt < HOLD) || (m === "lid" && (s.w as Av).cover === "lid") || (m === "plate" && (s.w as Av).cover === "plate");
      if (!s.done) api.target(`tool-${m}`, x, y, tw, g.toolH);
      P.body(c, x, y, tw, g.toolH, { role: "q2", r: 12, seed: 80 + i, state: on ? "selected" : s.done ? "dim" : "idle" });
      P.textFit(c, W(`bhaap.tool.${m}`), x + tw / 2, y + g.toolH / 2, tw - 8, g.toolH - 6, { size: 15, on: "q2", weight: 800 });
    });
  }

  function draw(c: CanvasRenderingContext2D): void {
    const g = geo();
    drawStrip(c, g);
    switch (goal) {
      case "badlo": case "bachao": drawPot(c, g); break;
      case "os": case "wapas": drawAir(c, g); drawFridge(c, g); break;
      case "naav": drawBeach(c, g); break;
      case "kamra": drawRoom(c, g); break;
      case "baadal": drawCycle(c, g); break;
      case "kuan": drawGround(c, g); break;
    }
    drawTools(c, g);
  }

  function goalLine(): string {
    const s = st();
    if (s.done) return W(`bhaap.done.${goal}`);
    if (goal === "kamra" && aim) return W("bhaap.aim");
    if (s.why) return W(`bhaap.why.${s.why}`, whyVals());
    if (goal === "badlo") {
      const a = s.w as Av, card = avRow(p).card;
      return a.next >= card.length ? W("bhaap.goal.badlo.end") : W("bhaap.goal.badlo", { change: W(`bhaap.changed.${card[a.next]}`) });
    }
    if (goal === "naav") { const t = naRow(p).trips[(s.w as Na).trip]; return W(`bhaap.goal.naav.${t}`); }
    if (goal === "kamra") { const t = kaRow(p).tasks[(s.w as Ka).task]; return W(`bhaap.goal.kamra.${t}`); }
    if (goal === "baadal" && baRow(p).flow) return W("bhaap.goal.baadal.flow");
    return W(`bhaap.goal.${goal}`);
  }
  function whyVals(): Record<string, string | number> {
    const s = st();
    if (goal === "badlo") { const a = s.w as Av, card = avRow(p).card; return { change: W(`bhaap.changed.${a.broke || "none"}`), card: W(`bhaap.changed.${card[a.next] ?? "none"}`) }; }
    return {};
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    return [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      // never "your move": the button must not hint when the process is complete (the child decides it is)
      { id: "done", label: W("bhaap.done"), aria: W("bhaap.done"), kind: "primary", group: "go", onPress: () => act({ kind: "done" }) },
    ];
  }
  void cellOf; void UNITS;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal: goalLine, readouts, controls, react };
  return view;
};
