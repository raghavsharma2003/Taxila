// BALANCE THE FOREST — `food-web@1` (STUDIO-V2 §6.1 #30). A population simulation on the shared, deterministic model
// (shared/studio-spec.ts ecoRun): the engine animates exactly the numbers the host re-runs to grade.
//   arrows        draw who-eats-whom; arrows point from the food to the eater (c4-evs-ch03-t02-m3)
//   predict-remove pick up / down / same, then remove a species and watch the cascade play out (m4)
//   keep-alive    a drought hits; relocate or bring in animals to keep every species above the danger line
import { ECO_DANGER, ECO_EQ, ecoRun, ecoTrend, foodLinks, SPECIES, type EcoAction, type EcoState, type FoodSpec, type SpeciesId } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp } from "../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { pill } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

const NODE: Record<SpeciesId, XY> = { grass: [500, 530], insects: [320, 410], deer: [690, 410], frog: [320, 285], snake: [450, 175], tiger: [690, 245] };
const NR = 50;
type Step = FoodSpec["steps"][number];

function create(api: EngineApi, spec: FoodSpec): EngineInstance {
  const T = spec.strings, species = spec.species;
  const truthLinks = foodLinks(species).map(([f, e]) => `${f}>${e}`);
  const g = { si: -1, stepT: 0, phase: "boot" as "boot" | "draw" | "checked" | "predict" | "run" | "result" | "manage" | "done" | "final",
    arrows: [] as string[], drag: null as null | { from: SpeciesId; x: number; y: number }, verdicts: {} as Record<string, "ok" | "rev" | "bad" | "missing">,
    pick: null as null | string, truth: null as null | string, run: [] as EcoState[], day: 0, dayF: 0, removed: null as null | SpeciesId, actions: [] as EcoAction[], cool: {} as Record<string, number>, lost: new Set<SpeciesId>(),
    flash: {} as Record<string, number>, results: [] as string[], doneT: 0, bootT: 0, finalA: 0 };
  const step = (): Step | null => (g.si >= 0 && g.si < spec.steps.length ? spec.steps[g.si] : null);
  const hud = api.hud([{ key: "step", label: T.step }, { key: "day", label: T.day }]);
  const popOf = (id: SpeciesId) => (g.run.length ? g.run[Math.min(g.day, g.run.length - 1)].pop[id] : ECO_EQ[id]);
  function startStep(i: number) {
    g.si = i; g.stepT = 0; g.verdicts = {}; g.pick = null; g.truth = null; g.removed = null; g.actions = []; g.lost = new Set(); g.day = 0; g.dayF = 0; g.run = []; g.cool = {};
    const s = spec.steps[i];
    if (s.kind === "arrows") { g.phase = "draw"; g.arrows = []; api.task(`${T.step} ${i + 1}/${spec.steps.length}`, T.arrows); }
    else if (s.kind === "predict-remove") { g.phase = "predict"; api.task(`${T.step} ${i + 1}/${spec.steps.length}`, `${T.remove} the ${SPECIES[s.remove].name.toLowerCase()}. ${SPECIES[s.watch].name}?`); }
    else { g.phase = "manage"; g.run = ecoRun(species, 0); api.task(`${T.step} ${i + 1}/${spec.steps.length}`, `Keep every species alive for ${s.days} days`); }
    api.event("step_start", { step: i + 1, kind: s.kind, targets: s.targets ?? null });
  }
  const nodeAt = (x: number, y: number): SpeciesId | null => { for (const id of species) { const [nx, ny] = NODE[id]; if (Math.hypot(x - nx, y - ny) < NR + 14) return id; } return null; };
  const CHECK = { x: 860, y: 572, w: 170, h: 70 };
  const CHIPS = () => [T.up, T.down, T.same].map((label, i) => ({ label, key: ["up", "down", "same"][i], x: 200 + i * 300, y: 572, w: 270, h: 74 }));
  const TILE = (i: number) => ({ x: 40 + (i % 3) * 310, y: 375 + Math.floor(i / 3) * 112, w: 296, h: 100 });
  const inBox = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }, centred = true) => centred ? Math.abs(p.x - b.x) < b.w / 2 && Math.abs(p.y - b.y) < b.h / 2 : p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
  api.onPointer({
    down(p) {
      const s = step(); if (!s) return;
      if (g.phase === "draw") {
        if (g.arrows.length && inBox(p, CHECK)) { checkArrows(); return; }
        const n = nodeAt(p.x, p.y);
        if (n) { g.drag = { from: n, x: p.x, y: p.y }; return; }
        const hit = g.arrows.find((a) => { const [f, e] = a.split(">") as SpeciesId[]; return distToSeg([p.x, p.y], NODE[f], NODE[e]) < 16; });
        if (hit) { g.arrows = g.arrows.filter((a) => a !== hit); sfx.blip({ f: 300, dur: 0.05, gain: 0.06 }); }
        return;
      }
      if (g.phase === "predict" && s.kind === "predict-remove") { const c = CHIPS().find((b) => inBox(p, b)); if (c) { g.pick = c.key; startRemoval(s); } return; }
      if (g.phase === "manage" && s.kind === "keep-alive") {
        const animals = species.filter((x) => x !== "grass");
        animals.forEach((id, i) => {
          const b = TILE(i); if (!inBox(p, b, false)) return;
          if ((g.cool[id] ?? 0) > 0) return;
          const kind: EcoAction["kind"] = p.x < b.x + b.w / 2 ? "cull" : "add";
          g.actions.push({ day: g.day, species: id, kind }); g.cool[id] = 1.2; g.flash[id] = 1;
          sfx.blip({ f: kind === "add" ? 660 : 330, f2: kind === "add" ? 990 : 220, dur: 0.1, type: "triangle", gain: 0.12 });
          api.event("eco_action", { day: g.day, species: id, kind });
        });
      }
    },
    move(p) { if (g.drag) { g.drag.x = p.x; g.drag.y = p.y; } },
    up(p) {
      if (!g.drag) return;
      const to = nodeAt(p.x, p.y), from = g.drag.from; g.drag = null;
      if (to && to !== from) { const k = `${from}>${to}`, rk = `${to}>${from}`; if (!g.arrows.includes(k)) { g.arrows = g.arrows.filter((a) => a !== rk); g.arrows.push(k); sfx.blip({ f: 520, f2: 780, dur: 0.08, type: "triangle", gain: 0.1 }); } }
    },
  });
  const distToSeg = (p: XY, a: XY, b: XY) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy), 0.15, 0.85); return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t)); };
  function checkArrows() {
    const grade = api.answer(`s${g.si + 1}`, [...g.arrows], truthLinks.every((l) => g.arrows.includes(l)) && g.arrows.every((a) => truthLinks.includes(a)) ? "right" : "partial");
    for (const a of g.arrows) g.verdicts[a] = truthLinks.includes(a) ? "ok" : truthLinks.includes(a.split(">").reverse().join(">")) ? "rev" : "bad";
    for (const l of truthLinks) if (!g.arrows.includes(l) && !g.arrows.includes(l.split(">").reverse().join(">"))) g.verdicts[l] = "missing";
    g.phase = "checked"; g.stepT = 0; g.results.push(grade.verdict);
    if (grade.verdict === "right") { api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.task(`${T.step} ${g.si + 1}/${spec.steps.length}`, "Energy flows from the food to the eater", "done"); }
    else api.task(`${T.step} ${g.si + 1}/${spec.steps.length}`, "Arrows point from the food to the eater", "warn");
    api.facts({ step: "arrows", verdict: grade.verdict, ...(grade.detail ? { detail: grade.detail } : {}) });
  }
  function startRemoval(s: Extract<Step, { kind: "predict-remove" }>) {
    g.removed = s.remove; g.phase = "run"; g.stepT = 0; g.day = 0; g.dayF = 0;
    g.run = ecoRun(species, s.days, [{ day: 0, species: s.remove, kind: "extinct" }]);
    g.truth = ecoTrend(species, s.remove, s.watch, s.days);
    sfx.noise({ dur: 0.4, f: 300, gain: 0.12 });
  }
  function update(dt: number) {
    g.stepT += dt;
    for (const k of Object.keys(g.flash)) g.flash[k] = Math.max(0, g.flash[k] - dt * 2);
    for (const k of Object.keys(g.cool)) g.cool[k] = Math.max(0, g.cool[k] - dt);
    if (g.phase === "boot") { g.bootT += dt; if (g.bootT > 0.4) { hud.show(true); startStep(0); } return; }
    const s = step();
    if (g.phase === "checked" && g.stepT > 3.2) next();
    if (g.phase === "run" && s && s.kind === "predict-remove") {
      g.dayF += dt * (s.days / 8); g.day = Math.min(s.days, Math.floor(g.dayF));
      if (g.day >= s.days) {
        const grade = api.answer(`s${g.si + 1}`, { predict: g.pick }, g.pick === g.truth ? "right" : "wrong");
        g.results.push(grade.verdict); g.phase = "result"; g.stepT = 0;
        if (grade.verdict === "right") { api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); } else sfx.blip({ f: 230, f2: 140, dur: 0.24, gain: 0.18 });
        api.facts({ step: "predict", removed: s.remove, watch: s.watch, truth: g.truth!, picked: g.pick ?? "", verdict: grade.verdict });
      }
    }
    if (g.phase === "result" && g.stepT > 3.6) next();
    if (g.phase === "manage" && s && s.kind === "keep-alive") {
      const prev = g.day;
      g.dayF += dt * 2; g.day = Math.min(s.days, Math.floor(g.dayF));
      if (g.day !== prev) {
        g.run = ecoRun(species, g.day, g.actions, { from: s.droughtFrom, to: s.droughtFrom + s.droughtDays });
        const st = g.run[g.run.length - 1];
        for (const id of species) if (st.pop[id] < ECO_DANGER * ECO_EQ[id] && !g.lost.has(id)) { g.lost.add(id); api.event("species_lost", { species: id, day: g.day }); sfx.blip({ f: 200, f2: 90, dur: 0.4, gain: 0.16 }); }
      }
      if (g.day >= s.days) {
        const grade = api.answer(`s${g.si + 1}`, g.actions, g.lost.size === 0 ? "right" : "wrong");
        g.results.push(grade.verdict); g.phase = "done"; g.stepT = 0;
        api.task(`${T.step} ${g.si + 1}/${spec.steps.length}`, grade.verdict === "right" ? T.done : `${T.lost}: ${[...g.lost].map((x) => SPECIES[x].name).join(", ")}`, grade.verdict === "right" ? "done" : "warn");
        if (grade.verdict === "right") { api.fx.flash(C.mint, 0.12); sfx.blip({ f: 392, f2: 784, dur: 0.3, type: "triangle", gain: 0.18 }); }
        api.facts({ step: "keep-alive", lost: [...g.lost].join(",") || "none", verdict: grade.verdict, actions: g.actions.length });
      }
    }
    if (g.phase === "done" && g.stepT > 3) next();
    if (g.phase !== "final") { hud.set("step", `${Math.min(g.si + 1, spec.steps.length)}/${spec.steps.length}`); hud.set("day", g.phase === "run" || g.phase === "manage" || g.phase === "result" || g.phase === "done" ? `${g.day}` : "—"); }
  }
  function next() {
    if (g.si + 1 < spec.steps.length) startStep(g.si + 1);
    else { g.phase = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.task("", T.done, "done"); api.done({ steps: spec.steps.length, right: g.results.filter((r) => r === "right").length }); }
  }
  // ── drawing
  function icon(ctx: Ctx, id: SpeciesId, x: number, y: number, s = 1, col: string = SPECIES[id].color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (id === "grass") { for (const dx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(dx, 16); ctx.quadraticCurveTo(dx - 4, 0, dx + (dx === 0 ? 2 : dx / 2), -18); ctx.stroke(); } }
    else if (id === "insects") { ctx.beginPath(); ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2); ctx.stroke(); for (const sx of [-1, 1]) for (const k of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(k, sx * 8); ctx.lineTo(k + 4, sx * 15); ctx.stroke(); } }
    else if (id === "deer") { ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(0, -6); ctx.lineTo(14, 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-12, -20); ctx.moveTo(-8, -13); ctx.lineTo(-16, -12); ctx.moveTo(4, -6); ctx.lineTo(12, -20); ctx.moveTo(8, -13); ctx.lineTo(16, -12); ctx.stroke(); }
    else if (id === "frog") { ctx.beginPath(); ctx.ellipse(0, 4, 15, 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(-7, -8, 4, 0, Math.PI * 2); ctx.arc(7, -8, 4, 0, Math.PI * 2); ctx.fill(); }
    else if (id === "snake") { ctx.beginPath(); ctx.moveTo(-18, 10); ctx.bezierCurveTo(-8, -14, 2, 18, 12, -6); ctx.lineTo(18, -10); ctx.stroke(); }
    else if (id === "tiger") { ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke(); for (const a of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.moveTo(Math.sin(a) * 15, -Math.cos(a) * 15); ctx.lineTo(Math.sin(a) * 7, -Math.cos(a) * 7); ctx.stroke(); } }
    ctx.restore();
  }
  function arrow(ctx: Ctx, a: XY, b: XY, col: string, dashed = false, w = 5) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
    const x0 = a[0] + ux * (NR + 6), y0 = a[1] + uy * (NR + 6), x1 = b[0] - ux * (NR + 10), y1 = b[1] - uy * (NR + 10);
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = "round"; if (dashed) ctx.setLineDash([10, 9]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1 + ux * 6, y1 + uy * 6); ctx.lineTo(x1 - ux * 16 - uy * 10, y1 - uy * 16 + ux * 10); ctx.lineTo(x1 - ux * 16 + uy * 10, y1 - uy * 16 - ux * 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0A0D10"); gr.addColorStop(0.7, "#0D1410"); gr.addColorStop(1, "#0C120E"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(123,211,137,.05)"; c.beginPath(); c.moveTo(0, 470); c.bezierCurveTo(250, 430, 520, 500, 1000, 450); c.lineTo(1000, 625); c.lineTo(0, 625); c.closePath(); c.fill();
  }
  function drawWeb(ctx: Ctx, now: number) {
    const s = step(), showTruth = s && s.kind !== "arrows";
    if (showTruth) for (const l of truthLinks) { const [f, e] = l.split(">") as SpeciesId[]; if (f === g.removed || e === g.removed) continue; arrow(ctx, NODE[f], NODE[e], "rgba(169,176,192,.35)", false, 4); }
    if (s && s.kind === "arrows") {
      for (const a of g.arrows) { const [f, e] = a.split(">") as SpeciesId[]; const v = g.verdicts[a]; arrow(ctx, NODE[f], NODE[e], v === "ok" ? C.mint : v === "rev" || v === "bad" ? C.amber : C.ink2, false); if (v === "rev") { const m: XY = [(NODE[f][0] + NODE[e][0]) / 2, (NODE[f][1] + NODE[e][1]) / 2]; magnifier(ctx, m[0] + 18, m[1] - 18); } }
      for (const [l, v] of Object.entries(g.verdicts)) if (v === "missing") { const [f, e] = l.split(">") as SpeciesId[]; arrow(ctx, NODE[f], NODE[e], C.ion, true); }
      if (g.phase === "checked") for (const [l, v] of Object.entries(g.verdicts)) if (v === "rev") { const [f, e] = l.split(">") as SpeciesId[]; ctx.save(); ctx.globalAlpha = clamp((g.stepT - 0.8) / 0.6, 0, 1); arrow(ctx, NODE[e], NODE[f], C.ion, true); ctx.restore(); }
      if (g.drag) { const [fx, fy] = NODE[g.drag.from]; ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 5; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -now * 40; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(g.drag.x, g.drag.y); ctx.stroke(); ctx.restore(); }
    }
    for (const id of species) {
      const [x, y] = NODE[id], gone = g.removed === id, k = gone ? clamp(1 - g.stepT / 0.8, 0, 1) : 1, rel = popOf(id) / ECO_EQ[id];
      const r = NR * (s && (s.kind === "predict-remove") && g.phase !== "predict" ? clamp(0.65 + 0.35 * Math.sqrt(rel), 0.5, 1.5) : 1);
      ctx.save(); ctx.globalAlpha = Math.max(0.12, k);
      bloom(ctx, SPECIES[id].color, x, y, r * 1.7, 0.18);
      ctx.fillStyle = "rgba(16,19,27,.92)"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = s && s.kind === "predict-remove" && id === s.watch ? C.ion : SPECIES[id].color; ctx.lineWidth = s && s.kind === "predict-remove" && id === s.watch ? 5 : 3; ctx.stroke();
      icon(ctx, id, x, y - 8, 1.1);
      api.text(ctx, SPECIES[id].name, x, y + r + 34, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center" });
      ctx.restore();
      if (gone && g.stepT < 1.2) { ctx.save(); ctx.globalAlpha = 1 - g.stepT / 1.2; ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 30, y - 30); ctx.lineTo(x + 30, y + 30); ctx.stroke(); ctx.restore(); }
    }
  }
  function drawGraph(ctx: Ctx, x0: number, y0: number, w: number, h: number, upto: number, highlight?: SpeciesId) {
    ctx.save(); ctx.fillStyle = "rgba(16,19,27,.9)"; roundRect(ctx, x0, y0, w, h, 16); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
    const days = Math.max(1, g.run.length - 1), maxRel = 3;
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.setLineDash([6, 8]); const yEq = y0 + h - (1 / maxRel) * (h - 20) - 10; ctx.beginPath(); ctx.moveTo(x0 + 10, yEq); ctx.lineTo(x0 + w - 10, yEq); ctx.stroke(); ctx.setLineDash([]);
    for (const id of species) {
      ctx.strokeStyle = SPECIES[id].color; ctx.globalAlpha = highlight && id !== highlight ? 0.3 : 1; ctx.lineWidth = highlight === id ? 5 : 3;
      ctx.beginPath();
      for (let d = 0; d <= Math.min(upto, days); d++) { const rel = Math.min(maxRel, g.run[d].pop[id] / ECO_EQ[id]), x = x0 + 10 + ((w - 20) * d) / days, y = y0 + h - 10 - (rel / maxRel) * (h - 20); if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const fx = api.fx, s = step();
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (s && s.kind !== "keep-alive") drawWeb(ctx, now);
    if (s && s.kind === "arrows" && g.phase === "draw" && g.arrows.length) { ctx.save(); ctx.fillStyle = "rgba(203,255,77,.14)"; roundRect(ctx, CHECK.x - CHECK.w / 2, CHECK.y - CHECK.h / 2, CHECK.w, CHECK.h, 16); ctx.fill(); ctx.strokeStyle = C.volt; ctx.lineWidth = 3; ctx.stroke(); api.text(ctx, "Check", CHECK.x, CHECK.y + 2, { font: "display", size: 40, weight: 700, color: C.volt, align: "center", baseline: "middle" }); ctx.restore(); }
    if (s && s.kind === "predict-remove") {
      if (g.phase === "predict") for (const c of CHIPS()) { ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 18); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); api.text(ctx, c.label, c.x, c.y + 2, { font: "display", size: 40, weight: 700, align: "center", baseline: "middle" }); ctx.restore(); }
      if (g.phase === "run" || g.phase === "result") {
        drawGraph(ctx, 560, 470, 400, 140, g.day, s.watch);
        pill(api, ctx, `${T.predict}: ${g.pick === "up" ? T.up : g.pick === "down" ? T.down : T.same}`, 270, 590, { color: C.ink2, size: 38 });
        if (g.phase === "result") { const ok = g.pick === g.truth; const txt = `${SPECIES[s.watch].name}: ${g.truth === "up" ? T.up : g.truth === "down" ? T.down : T.same}`.toLowerCase(); pill(api, ctx, txt, 760, 440, { color: ok ? C.mint : C.amber }); if (ok) tick(ctx, 910, 440); else magnifier(ctx, 920, 440); }
      }
    }
    if (s && s.kind === "keep-alive") {
      drawGraph(ctx, 40, 150, 920, 200, g.day);
      const dr = g.day >= s.droughtFrom && g.day < s.droughtFrom + s.droughtDays;
      if (dr) { ctx.save(); ctx.fillStyle = "rgba(255,181,71,.10)"; ctx.fillRect(40 + (920 * s.droughtFrom) / s.days, 150, (920 * s.droughtDays) / s.days, 200); ctx.restore(); pill(api, ctx, T.drought, 500, 175, { color: C.amber, size: 38 }); }
      species.filter((x) => x !== "grass").forEach((id, i) => {
        const b = TILE(i), rel = popOf(id) / ECO_EQ[id], lost = g.lost.has(id), cool = (g.cool[id] ?? 0) > 0;
        ctx.save(); ctx.fillStyle = lost ? "rgba(40,30,22,.9)" : "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = lost ? C.amber : g.flash[id] > 0 ? C.volt : C.line2; ctx.lineWidth = 2; ctx.stroke();
        icon(ctx, id, b.x + 34, b.y + 34, 0.9);
        api.text(ctx, `${Math.round(popOf(id))}`, b.x + 70, b.y + 44, { font: "display", size: 40, weight: 800, color: lost ? C.amber : C.ink });
        const barW = b.w - 30, fill = clamp(rel / 2, 0, 1); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(b.x + 15, b.y + 70, barW, 8); ctx.fillStyle = rel < ECO_DANGER * 2 ? C.amber : SPECIES[id].color; ctx.fillRect(b.x + 15, b.y + 70, barW * fill, 8);
        ctx.fillStyle = C.amber; ctx.fillRect(b.x + 15 + barW * (ECO_DANGER / 2) - 1, b.y + 64, 3, 20);
        ctx.globalAlpha = cool ? 0.4 : 1; api.text(ctx, "−", b.x + b.w * 0.62, b.y + 44, { font: "display", size: 48, weight: 800, color: C.ink2, align: "center" }); api.text(ctx, "+", b.x + b.w * 0.86, b.y + 44, { font: "display", size: 48, weight: 800, color: C.ink2, align: "center" });
        ctx.restore();
      });
    }
    fx.drawWorld(ctx); ctx.restore();
    if (g.phase === "final") { ctx.save(); ctx.globalAlpha = g.finalA * 0.9; ctx.fillStyle = "rgba(10,12,18,.6)"; ctx.fillRect(0, 0, W, H); ctx.restore(); pill(api, ctx, `${g.results.filter((r) => r === "right").length}/${spec.steps.length} · ${T.done}`, 500, 320, { color: C.mint, size: 48 }); }
  }
  function bot(): BotAction | null {
    const s = step();
    if (!s) return { type: "wait", ms: 300 };
    if (g.phase === "draw") {
      const todo = truthLinks.filter((l) => !g.arrows.includes(l));
      if (!todo.length) return { type: "tap", at: [CHECK.x, CHECK.y], after: 400 };
      const [f, e] = todo[0].split(">") as SpeciesId[];
      return { type: "drag", from: NODE[f], to: NODE[e], ms: 450, after: 250 };
    }
    if (g.phase === "predict" && s.kind === "predict-remove") { const t = ecoTrend(species, s.remove, s.watch, s.days); const c = CHIPS().find((x) => x.key === t)!; return { type: "tap", at: [c.x, c.y], after: 400 }; }
    if (g.phase === "manage" && s.kind === "keep-alive") {
      const animals = species.filter((x) => x !== "grass"), st = g.run[g.run.length - 1];
      const dr = g.day >= s.droughtFrom - 1 && g.day < s.droughtFrom + s.droughtDays;
      let pickId: SpeciesId | null = null, kind: "cull" | "add" = "add";
      if (dr && (st.pop.deer / ECO_EQ.deer) > 0.6 && (g.cool.deer ?? 0) === 0) { pickId = "deer"; kind = "cull"; }
      else { const weak = animals.filter((id) => (g.cool[id] ?? 0) === 0 && st.pop[id] / ECO_EQ[id] < 0.45).sort((a, b) => st.pop[a] / ECO_EQ[a] - st.pop[b] / ECO_EQ[b])[0]; if (weak) pickId = weak; }
      if (!pickId) return { type: "wait", ms: 250 };
      const b = TILE(animals.indexOf(pickId));
      return { type: "tap", at: [kind === "cull" ? b.x + b.w * 0.62 : b.x + b.w * 0.86, b.y + 40], after: 200 };
    }
    return { type: "wait", ms: 300 };
  }
  return {
    update, render, bot,
    seam: () => ({ step: step()?.kind ?? null, phase: g.phase, day: g.day, arrows: g.arrows, lost: [...g.lost] }),
    knob(k) { if (k === "again") { g.results = []; startStep(0); return true; } return false; },
    board: () => ({ title: "Who eats whom", lines: ["Arrows go from the food to the eater.", "Remove one link and the whole web shifts."], figure: { kind: "chain", items: ["grass", "insects", "frogs", "snakes"] }, accent: "#7BD389" }),
  };
}
export const foodweb: EngineDef<FoodSpec> = { archetype: "food-web@1", label: "Sim · Forest", accent: C.sci, create };
