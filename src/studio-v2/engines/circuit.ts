// CIRCUIT LAB — `circuit-bench@1` (STUDIO-V2 §11.2). Port of prototypes/reset/studio/02-circuit-lab/circuit.js.
// A modified-nodal-analysis solver (shared/studio-spec.ts solveCircuit, the same code the host grades with) re-solves the
// bench every frame. Charge moves at a speed proportional to the solved current; bulbs glow by P/P₁ with filament
// warm-up; a short circuit really heats the cell. Steps end on predicates from a closed list. When a step completes,
// the engine submits the CIRCUIT AS BUILT; the host re-solves it and grades, never trusting the frame.
import { CIRCUIT, CIRCUIT_N, CIRCUIT_NC, circuitEdgeKey, circuitNodeName, circuitParseNode, circuitPREF, solveCircuit, type CircuitSpec, type CompType } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, lerp, mix } from "../core/math.ts";
import { glow, roundRect, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

const { COLS, ROWS, MATERIALS, TOOLS } = CIRCUIT;
const NC = CIRCUIT_NC, N = CIRCUIT_N;
interface Comp { type: CompType; a: number; sc: number; locked: boolean; plus: number; closed: boolean; ang: number; P: number; glow: number; material: string | null; matA: number; flip: number }
interface Edge { a: number; b: number; ax: number; ay: number; bx: number; by: number; mx: number; my: number; len: number; horiz: boolean; comp: Comp | null; I: number; phase: number; speedVis: number; meter: boolean; key: string }
const npos = (i: number) => ({ x: COLS[i % NC], y: ROWS[Math.floor(i / NC)] });

function create(api: EngineApi, spec: CircuitSpec): EngineInstance {
  const T = spec.strings;
  const edges: Edge[] = [];
  const mkEdge = (a: number, b: number): Edge => { const pa = npos(a), pb = npos(b); return { a, b, ax: pa.x, ay: pa.y, bx: pb.x, by: pb.y, mx: (pa.x + pb.x) / 2, my: (pa.y + pb.y) / 2, len: Math.hypot(pb.x - pa.x, pb.y - pa.y), horiz: pa.y === pb.y, comp: null, I: 0, phase: 0, speedVis: 0, meter: false, key: `${circuitNodeName(a)}-${circuitNodeName(b)}` }; };
  for (let r = 0; r < ROWS.length; r++) for (let c = 0; c < NC - 1; c++) edges.push(mkEdge(c + r * NC, c + 1 + r * NC));
  for (let c = 0; c < NC; c++) for (let r = 0; r < ROWS.length - 1; r++) edges.push(mkEdge(c + r * NC, c + (r + 1) * NC));
  const edgeAt = (s: string | null) => { const k = s ? circuitEdgeKey(s) : null; return k ? edges.find((e) => e.a === k[0] && e.b === k[1]) ?? null : null; };
  const steps = spec.steps.map((s) => ({ ...s, cueE: edgeAt(s.cue), presetE: s.preset.map((p) => ({ e: edgeAt(p.at)!, put: p.put, plus: p.plus != null ? circuitParseNode(p.plus) : -1, locked: p.locked })).filter((p) => p.e) }));
  const lab = { stepIdx: -1, stepT: 0, sub: 0, done: false, doneT: 0, tested: {} as Record<string, "conducts" | "blocks">, cuePulse: 0, warn: null as string | null, short: 0, pendingTest: null as null | { id: string; t: number },
    finalCard: null as null | { a: number; conducts: string[]; blocks: string[] }, tray: [] as { id: string; x: number; y: number; w: number; h: number; a: number; off: number }[],
    drag: null as null | { kind: "new" | "board" | "wire"; id?: string | null; e?: Edge; last?: number; x: number; y: number; sx: number; sy: number; moved: boolean; lifted?: boolean; carry?: Comp | null }, hoverEdge: null as Edge | null };
  const step = () => (lab.stepIdx >= 0 && lab.stepIdx < steps.length ? steps[lab.stepIdx] : null);
  const stepLabel = () => `${lab.stepIdx + 1} ${T.stepOf} ${steps.length}`;

  function layoutTray(ids: string[]) {
    const many = ids.length > 4, h = many ? 80 : 104, gap = many ? 6 : 10;
    lab.tray = ids.map((id, i) => ({ id, x: 14, y: 96 + i * (h + gap), w: 190, h, a: 0, off: -30 }));
    lab.tray.forEach((t, i) => api.tw.add(t, { a: 1, off: 0 }, { dur: 0.35, delay: 0.05 * i }));
  }
  const trayHit = (p: { x: number; y: number }) => lab.tray.find((t) => p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y && p.y <= t.y + t.h);
  function place(e: Edge, type: CompType | "meter" | "empty", o: { plus?: number; locked?: boolean; force?: boolean; quiet?: boolean } = {}): boolean {
    if (type === "meter") { e.meter = true; sfx.blip({ f: 1200, dur: 0.05, type: "square", gain: 0.05 }); return true; }
    if (e.comp && e.comp.locked && !o.force) return false;
    if (type === "empty") { e.comp = null; e.meter = false; return true; }
    const comp: Comp = { type, a: 0, sc: 0.5, locked: !!o.locked, plus: o.plus != null && o.plus >= 0 ? o.plus : e.b, closed: true, ang: 0, P: 0, glow: 0, material: null, matA: 1, flip: 1 };
    e.comp = comp;
    api.tw.add(comp, { a: 1, sc: 1 }, { dur: 0.38, ease: "outBack" });
    if (!o.quiet) { api.fx.burst(e.ax, e.ay, { n: 6, color: C.sci, speed: 140, life: 0.35, size: 7 }); api.fx.burst(e.bx, e.by, { n: 6, color: C.sci, speed: 140, life: 0.35, size: 7 }); sfx.blip({ f: 420, f2: 260, dur: 0.06, type: "square", gain: 0.06 }); }
    return true;
  }
  function edgeNear(p: { x: number; y: number }, maxD = 62): Edge | null {
    let best: Edge | null = null, bd = maxD;
    for (const e of edges) {
      const dx = e.bx - e.ax, dy = e.by - e.ay, t = ((p.x - e.ax) * dx + (p.y - e.ay) * dy) / (e.len * e.len);
      if (t < 0.12 || t > 0.88) continue;
      const d = Math.hypot(p.x - (e.ax + dx * t), p.y - (e.ay + dy * t));
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  const nodeNear = (p: { x: number; y: number }, maxD = 34) => { for (let i = 0; i < N; i++) { const q = npos(i); if (Math.hypot(p.x - q.x, p.y - q.y) < maxD) return i; } return -1; };
  api.onPointer({
    down(p) {
      const t = trayHit(p);
      if (t) { lab.drag = { kind: "new", id: t.id, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }; return; }
      const e = edgeNear(p, 48);
      if (e && (e.comp || e.meter)) { lab.drag = { kind: "board", e, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }; return; }
      const n = nodeNear(p, 34);
      if (n >= 0) lab.drag = { kind: "wire", last: n, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false };
    },
    move(p) {
      const d = lab.drag; if (!d) return;
      d.x = p.x; d.y = p.y;
      if (Math.hypot(p.x - d.sx, p.y - d.sy) > 10) d.moved = true;
      if (d.kind === "new" || (d.kind === "board" && d.moved)) {
        if (d.kind === "board" && !d.lifted && d.e) {
          const e = d.e;
          if (e.comp && e.comp.locked) { lab.drag = null; return; }
          d.lifted = true;
          if (e.meter && !e.comp) { d.id = "meter"; e.meter = false; }
          else if (e.comp && e.comp.type === "tester") { d.id = e.comp.material; if (!d.id) { lab.drag = null; return; } e.comp.material = null; }
          else if (e.comp) { d.id = e.comp.type; d.carry = e.comp; e.comp = null; e.meter = false; }
        }
        lab.hoverEdge = edgeNear(p, 70);
      }
      if (d.kind === "wire" && d.last != null) {
        const n = nodeNear(p, 30);
        if (n >= 0 && n !== d.last) { const e = edges.find((x) => x.a === Math.min(n, d.last!) && x.b === Math.max(n, d.last!)); if (e && !e.comp) place(e, "wire"); d.last = n; }
      }
    },
    up(p) {
      const d = lab.drag, target = lab.hoverEdge;
      lab.drag = null; lab.hoverEdge = null;
      if (!d) return;
      if (d.kind === "board" && !d.moved && d.e) { tapComponent(d.e); return; }
      if (d.kind === "wire" || !d.id) return;
      const isMat = !!MATERIALS[d.id];
      if (target) {
        if (isMat) { if (target.comp && target.comp.type === "tester") { target.comp.material = d.id; target.comp.matA = 0; api.tw.add(target.comp, { matA: 1 }, { dur: 0.3, ease: "outBack" }); sfx.blip({ f: 600, f2: 900, dur: 0.06, type: "triangle", gain: 0.08 }); lab.pendingTest = { id: d.id, t: 0.45 }; } return; }
        if (d.id === "meter") { if (target.comp) place(target, "meter"); return; }
        if (target.comp && (target.comp.locked || target.comp.type === "tester")) return;
        if (d.carry && d.id === "cell" && d.e) place(target, "cell", { plus: d.carry.plus === d.e.a ? target.a : target.b });
        else if (d.carry && d.id === "switch") { place(target, "switch"); target.comp!.closed = d.carry.closed; target.comp!.ang = d.carry.ang; }
        else place(target, d.id as CompType);
      } else if (d.kind === "board") { api.fx.burst(p.x, p.y, { n: 10, color: C.ink3, speed: 160, life: 0.4, size: 8 }); sfx.noise({ dur: 0.12, f: 500, gain: 0.08 }); }
    },
  });
  function tapComponent(e: Edge) {
    const c = e.comp; if (!c) return;
    if (c.type === "switch") {
      c.closed = !c.closed; api.tw.add(c, { ang: c.closed ? 0 : 1 }, { dur: 0.32, ease: c.closed ? "outBack" : "outCubic" });
      sfx.noise({ dur: 0.07, f: 2400, filter: "highpass", gain: 0.2 }); sfx.blip({ f: c.closed ? 300 : 200, dur: 0.05, type: "square", gain: 0.06 });
      api.event("switch", { closed: c.closed, edge: e.key });
    } else if (c.type === "cell" && !c.locked) {
      c.plus = c.plus === e.a ? e.b : e.a; c.flip = 0; api.tw.add(c, { flip: 1 }, { dur: 0.35 });
      sfx.blip({ f: 520, f2: 780, dur: 0.08, type: "triangle", gain: 0.08 }); api.event("cell_flip", { edge: e.key });
    }
  }
  function startStep(i: number) {
    lab.stepIdx = i; lab.stepT = 0; lab.sub = 0; lab.done = false; lab.doneT = 0;
    const s = steps[i];
    for (const p of s.presetE) { if (p.put === "tester" || p.put === "empty") p.e.meter = false; place(p.e, p.put, { plus: p.plus, locked: p.locked, force: true, quiet: i === 0 }); }
    layoutTray(s.tray);
    api.task(stepLabel(), s.goal);
    api.event("step_start", { step: i + 1, id: s.id });
  }
  const bulbs = () => edges.filter((e) => e.comp && e.comp.type === "bulb");
  const brightness = () => bulbs().reduce((m, e) => Math.max(m, (e.comp!.P || 0) / circuitPREF), 0);
  function checkStep(): boolean {
    const s = step()!, key = Object.keys(s.check)[0], arg = s.check[key];
    if (key === "bulbLit") return brightness() > 0.2;
    if (key === "meters") return edges.filter((e) => e.meter && Math.abs(e.I) > 0.01).length >= (Number(arg) || 2);
    if (key === "switchCycle") {
      const sw = edges.find((e) => e.comp && e.comp.type === "switch");
      if (!sw) return false;
      const lit = brightness() > 0.2;
      if (lab.sub === 0) { lab.sub = 1; api.task(stepLabel(), s.then[0] || s.goal); }
      if (lab.sub === 1 && !sw.comp!.closed && !lit) { lab.sub = 2; api.task(stepLabel(), s.then[1] || s.goal); }
      return lab.sub === 2 && sw.comp!.closed && lit;
    }
    if (key === "tested") { const a = arg as { n: number; must: string[] }; return Object.keys(lab.tested).length >= (a.n || 4) && a.must.every((m) => lab.tested[m]); }
    if (key === "brightness") return brightness() >= (Number(arg) || 2);
    return false;
  }
  const snapshot = () => ({
    edges: edges.filter((e) => e.comp).map((e) => ({ at: e.key, type: e.comp!.type, ...(e.comp!.type === "cell" ? { plus: circuitNodeName(e.comp!.plus) } : {}), ...(e.comp!.type === "switch" ? { closed: e.comp!.closed } : {}), ...(e.comp!.type === "tester" ? { material: e.comp!.material } : {}) })),
    meters: edges.filter((e) => e.meter).map((e) => e.key), tested: Object.keys(lab.tested),
  });
  function completeStep() {
    const s = step()!;
    lab.done = true;
    api.task(stepLabel(), s.done, "done");
    sfx.blip({ f: 659, dur: 0.12, type: "triangle", gain: 0.14 }); setTimeout(() => sfx.blip({ f: 988, dur: 0.18, type: "triangle", gain: 0.12 }), 110);
    api.fx.flash(C.mint, 0.08);
    for (const e of edges) if (Math.abs(e.I) > 0.01) api.fx.burst(e.mx, e.my, { n: 5, color: C.mint, speed: 120, life: 0.6, size: 9 });
    const g = api.answer(`step:${s.id}`, snapshot(), "right");
    api.event("step_done", { step: lab.stepIdx + 1, id: s.id, t: +lab.stepT.toFixed(1), host: g.verdict });
  }
  function finish() {
    lab.stepIdx = steps.length;
    const conducts = Object.keys(lab.tested).filter((k) => lab.tested[k] === "conducts").map((k) => MATERIALS[k].name);
    const blocks = Object.keys(lab.tested).filter((k) => lab.tested[k] === "blocks").map((k) => MATERIALS[k].name);
    lab.finalCard = { a: 0, conducts, blocks };
    api.tw.add(lab.finalCard, { a: 1 }, { dur: 0.5 }); api.tw.add(lab.finalCard, { a: 0 }, { dur: 0.5, delay: 5.5 });
    api.task("", T.free);
    layoutTray(["wire", "bulb", "switch", "cell"]);
    api.done({ steps: steps.length, tested: lab.tested });
  }
  function solve() {
    const s = solveCircuit(edges.map((e) => ({ a: e.a, b: e.b, comp: e.comp ? { type: e.comp.type, plus: e.comp.plus, closed: e.comp.closed, material: e.comp.material } : null })));
    edges.forEach((e, i) => { e.I = s.I[i]; if (e.comp && e.comp.type === "bulb") e.comp.P = s.P[i]; });
  }
  let booted = false;
  function update(dt: number) {
    if (!booted) { booted = true; startStep(0); }
    solve();
    const b = brightness();
    lab.stepT += dt; lab.cuePulse += dt;
    const s = step();
    if (s && !lab.done && lab.stepT > 0.6 && checkStep()) completeStep();
    if (s && lab.done) { lab.doneT += dt; if (lab.doneT > 2.6) { if (lab.stepIdx + 1 < steps.length) startStep(lab.stepIdx + 1); else finish(); } }
    if (lab.pendingTest) { lab.pendingTest.t -= dt; if (lab.pendingTest.t <= 0) { const id = lab.pendingTest.id; lab.pendingTest = null; const verdict = b > 0.03 ? "conducts" : "blocks"; lab.tested[id] = verdict; api.event("observe", { material: id, verdict, brightness: +b.toFixed(3) }); } }
    const cells = edges.filter((e) => e.comp && e.comp.type === "cell");
    const shorted = cells.some((e) => Math.abs(e.I) > 1.6);
    lab.short = clamp(lab.short + (shorted ? dt * 1.5 : -dt * 2), 0, 1);
    const fighting = !!s && s.id === "bright" && cells.length >= 2 && b < 0.05 && cells.every((e) => Math.abs(e.I) < 0.01);
    const warn = shorted ? T.short : fighting ? (s!.hint || T.fight) : null;
    if (warn !== lab.warn) { lab.warn = warn; if (warn) api.task(s ? stepLabel() : "", warn, "warn"); else if (s && !lab.done) api.task(stepLabel(), lab.sub === 2 ? s.then[1] || s.goal : lab.sub === 1 ? s.then[0] || s.goal : s.goal); }
    for (const e of edges) {
      const target = Math.min(380, Math.abs(e.I) * 430);
      e.speedVis = lerp(e.speedVis, target, 1 - Math.exp(-dt * 6)); e.phase += Math.sign(e.I) * e.speedVis * dt;
      if (e.comp && e.comp.type === "bulb") e.comp.glow = lerp(e.comp.glow, Math.min(2.2, e.comp.P / circuitPREF), 1 - Math.exp(-dt * 7));
    }
    api.facts({ step: s ? s.id : "free", brightness: +b.toFixed(2), tested: Object.keys(lab.tested).length, loopClosed: b > 0.2 ? 1 : 0 });
  }

  // ── render
  const PANEL = { x: 222, y: 168, w: 762, h: 430 };
  function paintBg(g: Ctx) {
    const bgG = g.createRadialGradient(600, 380, 50, 600, 380, 700); bgG.addColorStop(0, "#121725"); bgG.addColorStop(1, "#0A0C12");
    g.fillStyle = bgG; g.fillRect(0, 0, W, H);
    g.fillStyle = "#121621"; roundRect(g, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 26); g.fill(); g.strokeStyle = C.line2; g.lineWidth = 2; g.stroke();
    g.fillStyle = "rgba(255,255,255,.05)";
    for (let x = PANEL.x + 26; x < PANEL.x + PANEL.w - 10; x += 31) for (let y = PANEL.y + 26; y < PANEL.y + PANEL.h - 10; y += 31) g.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bench", paintBg), 0, 0, W, H);
    const fx = api.fx, s = step();
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const e of bulbs()) { const g = e.comp!.glow; if (g < 0.02) continue; const r = 120 + 190 * Math.sqrt(Math.min(g, 2)); ctx.globalAlpha = Math.min(0.55, 0.3 * g); ctx.drawImage(glow("#FFD58A", 128, 0.05), e.mx - r, e.my - r, r * 2, r * 2); }
    ctx.restore();
    if (s && s.cueE && !lab.done && (!s.cueE.comp || (s.cueE.comp.type === "tester" && !s.cueE.comp.material)) && !lab.drag) {
      const e = s.cueE, a = 0.5 + 0.5 * Math.sin(lab.cuePulse * 4);
      ctx.save(); ctx.globalAlpha = 0.35 + 0.5 * a; ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -now * 30;
      if (e.horiz) roundRect(ctx, e.ax + 22, e.my - 34, e.len - 44, 68, 20); else roundRect(ctx, e.mx - 34, e.ay + 22, 68, e.len - 44, 20);
      ctx.stroke(); ctx.restore();
    }
    if (lab.drag && lab.hoverEdge) {
      const e = lab.hoverEdge; ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 5; ctx.globalAlpha = 0.9;
      if (e.horiz) roundRect(ctx, e.ax + 18, e.my - 38, e.len - 36, 76, 22); else roundRect(ctx, e.mx - 38, e.ay + 18, 76, e.len - 36, 22);
      ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 3; ctx.setLineDash([4, 10]);
    for (const e of edges) if (!e.comp) { ctx.beginPath(); ctx.moveTo(e.ax, e.ay); ctx.lineTo(e.bx, e.by); ctx.stroke(); }
    ctx.setLineDash([]);
    for (const e of edges) if (e.comp) drawComp(ctx, e, e.comp, now);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const spr = glow(C.sci, 16);
    for (const e of edges) {
      if (!e.comp || e.speedVis < 2) continue;
      const sp = 30, n = Math.floor(e.len / sp), off = ((e.phase % sp) + sp) % sp;
      ctx.globalAlpha = 0.95 * Math.min(1, e.speedVis / 60);
      for (let k = 0; k <= n; k++) {
        const d = k * sp + off; if (d > e.len) continue;
        const t = d / e.len;
        if (e.comp.type === "bulb" && t > 0.3 && t < 0.7) continue;
        if (e.comp.type === "cell" && t > 0.2 && t < 0.8) continue;
        ctx.drawImage(spr, lerp(e.ax, e.bx, t) - 9, lerp(e.ay, e.by, t) - 9, 18, 18);
      }
    }
    ctx.restore();
    for (let i = 0; i < N; i++) { const q = npos(i); ctx.fillStyle = "#2A3142"; ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#566079"; ctx.beginPath(); ctx.arc(q.x - 2, q.y - 2, 5, 0, Math.PI * 2); ctx.fill(); }
    for (const e of edges) if (e.meter) drawMeter(ctx, e);
    fx.drawWorld(ctx);
    ctx.restore();
    drawTray(ctx);
    const d = lab.drag;
    if (d && d.id && (d.kind === "new" || d.lifted)) drawGhost(ctx, d);
    if (lab.finalCard && lab.finalCard.a > 0.01) drawFinal(ctx, lab.finalCard);
    fx.drawScreen(ctx);
  }
  function wireLine(ctx: Ctx, x0: number, x1: number, I: number) {
    const k = Math.min(1, Math.abs(I) / 0.3);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1B2030"; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    ctx.strokeStyle = mix("#7A5B3E", "#FFC27A", k); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
  }
  type EdgeLike = Pick<Edge, "a" | "b" | "mx" | "my" | "ax" | "ay" | "bx" | "by" | "len" | "horiz" | "I">;
  function drawComp(ctx: Ctx, e: EdgeLike, c: Comp, now: number, icon = false) {
    const L = e.len / 2;
    ctx.save(); ctx.translate(e.mx, e.my); if (!e.horiz) ctx.rotate(Math.PI / 2);
    ctx.globalAlpha *= clamp(c.a, 0, 1);
    const sc = c.sc;
    if (c.type === "wire") { ctx.scale(1, sc); wireLine(ctx, -L, L, e.I); }
    else if (c.type === "bulb") {
      wireLine(ctx, -L, -40, e.I); wireLine(ctx, 40, L, e.I); ctx.scale(sc, sc);
      const g = c.glow;
      if (g > 0.01) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, 0.25 + 0.5 * g); const r = 60 + 50 * Math.sqrt(Math.min(g, 2)); ctx.drawImage(glow("#FFE2A0", 96, 0.12), -r, -r, r * 2, r * 2); ctx.restore(); }
      ctx.fillStyle = "#59617A"; roundRect(ctx, -46, -13, 16, 26, 4); ctx.fill(); roundRect(ctx, 30, -13, 16, 26, 4); ctx.fill();
      const gl = ctx.createRadialGradient(-10, -12, 4, 0, 0, 40);
      gl.addColorStop(0, g > 0.05 ? `rgba(255,248,225,${0.35 + 0.5 * Math.min(1, g)})` : "rgba(220,230,255,.28)"); gl.addColorStop(1, g > 0.05 ? `rgba(255,200,110,${0.18 + 0.3 * Math.min(1, g)})` : "rgba(140,160,210,.10)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(220,230,255,.55)"; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = g > 0.05 ? mix("#C9763A", "#FFF6DA", Math.min(1, g)) : "#7C6A55"; ctx.lineWidth = g > 0.05 ? 4 : 3; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-16, 0); for (let i = 0; i < 6; i++) ctx.lineTo(-14 + i * 5.6, i % 2 ? 9 : -9); ctx.lineTo(16, 0); ctx.lineTo(30, 0); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(-13, -17, 9, 5, -0.6, 0, Math.PI * 2); ctx.fill();
    } else if (c.type === "switch") {
      wireLine(ctx, -L, -34, e.I); wireLine(ctx, 34, L, e.I); ctx.scale(sc, sc);
      ctx.fillStyle = "#2A3142"; roundRect(ctx, -46, -20, 92, 40, 12); ctx.fill();
      ctx.fillStyle = "#8C95AE"; ctx.beginPath(); ctx.arc(-30, 0, 8, 0, Math.PI * 2); ctx.arc(30, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(-30, 0); ctx.rotate(-c.ang * 0.62); ctx.strokeStyle = c.closed ? "#D9DEEA" : "#A9B0C0"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(62, 0); ctx.stroke(); ctx.fillStyle = C.ink2; ctx.beginPath(); ctx.arc(66, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (c.type === "cell") {
      const dir = c.plus === e.b ? 1 : -1, hot = Math.abs(e.I) > 1.6 ? lab.short : 0;
      wireLine(ctx, -L, -56, e.I); wireLine(ctx, 56, L, e.I); ctx.scale(sc, sc);
      if (c.flip < 1) ctx.scale(Math.cos(c.flip * Math.PI) || 0.001, 1);
      if (hot > 0.01) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = hot * (0.6 + 0.4 * Math.sin(now * 18)); ctx.drawImage(glow(C.amber, 80, 0.1), -90, -60, 180, 120); ctx.restore(); }
      ctx.save(); ctx.scale(dir, 1);
      const body = ctx.createLinearGradient(0, -22, 0, 22); body.addColorStop(0, "#2B3550"); body.addColorStop(0.5, "#3B4870"); body.addColorStop(1, "#1C2337");
      ctx.fillStyle = body; roundRect(ctx, -50, -22, 96, 44, 8); ctx.fill();
      ctx.fillStyle = C.sci; ctx.fillRect(10, -22, 22, 44); ctx.fillStyle = "#B9C1D6"; roundRect(ctx, 46, -9, 10, 18, 3); ctx.fill(); ctx.fillStyle = "#8C95AE"; ctx.fillRect(-56, -16, 6, 32);
      ctx.restore();
    } else if (c.type === "tester") {
      wireLine(ctx, -L, -38, e.I); wireLine(ctx, 38, L, e.I);
      ctx.fillStyle = "#6E7891";
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 40, 0); ctx.scale(s, 1); ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(10, -8); ctx.lineTo(10, 8); ctx.lineTo(-6, 12); ctx.closePath(); ctx.fill(); ctx.restore(); }
      if (c.material) drawMaterial(ctx, c.material, c.matA);
      else { ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.setLineDash([5, 7]); ctx.lineWidth = 3; roundRect(ctx, -32, -26, 64, 52, 10); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();
    if (c.type === "cell" && !icon) {
      const plusAtB = c.plus === e.b, at = (k: number, toB: boolean) => toB ? { x: lerp(e.mx, e.bx, k), y: lerp(e.my, e.by, k) } : { x: lerp(e.mx, e.ax, k), y: lerp(e.my, e.ay, k) };
      const pP = at(0.62, plusAtB), pM = at(0.62, !plusAtB), ox = e.horiz ? 0 : -52, oy = e.horiz ? -48 : 0;
      api.text(ctx, "+", pP.x + ox, pP.y + oy, { font: "mono", size: 44, weight: 700, color: C.sci, align: "center", baseline: "middle" });
      api.text(ctx, "−", pM.x + ox, pM.y + oy, { font: "mono", size: 44, weight: 700, color: C.ink2, align: "center", baseline: "middle" });
    }
  }
  function drawMaterial(ctx: Ctx, id: string, a: number) {
    ctx.save(); ctx.scale(a || 0.001, a || 0.001);
    if (id === "coin") { const g = ctx.createRadialGradient(-8, -8, 4, 0, 0, 30); g.addColorStop(0, "#F3B37A"); g.addColorStop(1, "#A8602F"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(255,230,200,.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke(); }
    else if (id === "nail") { ctx.fillStyle = "#AEB6C6"; roundRect(ctx, -46, -6, 86, 12, 4); ctx.fill(); ctx.fillStyle = "#D2D8E4"; roundRect(ctx, -52, -14, 10, 28, 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(40, -6); ctx.lineTo(52, 0); ctx.lineTo(40, 6); ctx.closePath(); ctx.fill(); }
    else if (id === "pencil") { ctx.fillStyle = "#3E434F"; roundRect(ctx, -52, -4, 104, 8, 3); ctx.fill(); ctx.fillStyle = "#C98A3E"; ctx.beginPath(); ctx.moveTo(-36, -12); ctx.lineTo(36, -12); ctx.lineTo(44, 0); ctx.lineTo(36, 12); ctx.lineTo(-36, 12); ctx.lineTo(-44, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#E3B072"; ctx.fillRect(-36, -12, 72, 6); ctx.fillStyle = "#3E434F"; ctx.fillRect(-46, -3, 6, 6); ctx.fillRect(40, -3, 6, 6); }
    else if (id === "ruler") { ctx.fillStyle = "rgba(120,170,255,.45)"; roundRect(ctx, -54, -16, 108, 32, 5); ctx.fill(); ctx.strokeStyle = "rgba(200,220,255,.7)"; ctx.lineWidth = 2; ctx.stroke(); for (let i = -48; i <= 48; i += 8) { ctx.beginPath(); ctx.moveTo(i, -16); ctx.lineTo(i, i % 16 === 0 ? -6 : -10); ctx.stroke(); } }
    else if (id === "eraser") { ctx.fillStyle = "#E9ECF4"; roundRect(ctx, -40, -18, 80, 36, 8); ctx.fill(); ctx.fillStyle = "#4A7BD8"; roundRect(ctx, -40, -18, 30, 36, 8); ctx.fill(); ctx.fillRect(-20, -18, 10, 36); }
    else if (id === "glass") { const g = ctx.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, "rgba(200,245,255,.75)"); g.addColorStop(1, "rgba(120,200,220,.35)"); ctx.fillStyle = g; roundRect(ctx, -54, -11, 108, 22, 11); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(-46, -7, 70, 3); }
    ctx.restore();
  }
  function drawMeter(ctx: Ctx, e: Edge) {
    const reading = Math.round(Math.abs(e.I) * 100), w = 196, h = 64, x = e.horiz ? e.mx - w / 2 : e.mx + 34, y = e.horiz ? e.my - h - 30 : e.my - h / 2;
    ctx.save(); ctx.fillStyle = "rgba(16,19,27,.92)"; roundRect(ctx, x, y, w, h, 16); ctx.fill(); ctx.strokeStyle = "rgba(47,211,199,.6)"; ctx.lineWidth = 2; ctx.stroke();
    const cx = x + 36, cy = y + 44, r = 22, k = Math.min(1, reading / 60);
    ctx.strokeStyle = C.line2; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = C.sci; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * k); ctx.stroke();
    const an = Math.PI + Math.PI * k; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * (r - 4), cy + Math.sin(an) * (r - 4)); ctx.stroke();
    api.text(ctx, `${reading}`, x + 128, y + h / 2 + 2, { font: "mono", size: 40, weight: 600, align: "center", baseline: "middle" });
    ctx.strokeStyle = "rgba(47,211,199,.5)"; ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
    ctx.beginPath(); if (e.horiz) { ctx.moveTo(e.mx, y + h); ctx.lineTo(e.mx, e.my - 10); } else { ctx.moveTo(x, e.my); ctx.lineTo(e.mx + 10, e.my); } ctx.stroke();
    ctx.restore();
  }
  function drawTray(ctx: Ctx) {
    for (const t of lab.tray) {
      ctx.save(); ctx.globalAlpha = t.a; ctx.translate(t.off, 0);
      const mat = MATERIALS[t.id], tested = mat ? lab.tested[t.id] : null;
      ctx.fillStyle = "rgba(22,26,36,.92)"; roundRect(ctx, t.x, t.y, t.w, t.h, 18); ctx.fill();
      ctx.strokeStyle = tested === "conducts" ? "rgba(61,220,151,.6)" : C.line2; ctx.lineWidth = 2; ctx.stroke();
      const cy = t.y + t.h / 2;
      if (mat) {
        ctx.save(); ctx.translate(t.x + 36, cy); ctx.scale(0.4, 0.4); drawMaterial(ctx, t.id, 1); ctx.restore();
        api.text(ctx, mat.name, t.x + 66, cy + 2, { font: "display", size: 38, weight: 600, color: tested ? C.ink2 : C.ink, baseline: "middle" });
        if (tested) {
          const bx = t.x + 50, by = cy + 18;
          ctx.fillStyle = "#161A24"; ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fill();
          if (tested === "conducts") { ctx.strokeStyle = C.mint; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx - 1.5, by + 5); ctx.lineTo(bx + 7, by - 5); ctx.stroke(); }
          else { ctx.strokeStyle = C.ink3; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.stroke(); }
        }
      } else {
        ctx.save(); ctx.translate(t.x + t.w / 2, t.y + 36); ctx.scale(0.6, 0.6); drawToolIcon(ctx, t.id); ctx.restore();
        api.text(ctx, TOOLS[t.id], t.x + t.w / 2, t.y + t.h - 22, { font: "display", size: 38, weight: 600, align: "center", baseline: "middle" });
      }
      ctx.restore();
    }
  }
  const ICON: EdgeLike = { a: 0, b: 1, ax: -75, bx: 75, ay: 0, by: 0, mx: 0, my: 0, len: 150, horiz: true, I: 0 };
  const iconComp = (type: CompType, plus = 1): Comp => ({ type, a: 1, sc: 1, closed: true, ang: 0, glow: 0, plus, locked: false, P: 0, material: null, matA: 1, flip: 1 });
  function drawToolIcon(ctx: Ctx, id: string) {
    if (id === "meter") { ctx.strokeStyle = C.sci; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 14, 34, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(20, -12); ctx.stroke(); return; }
    if (id === "wire") { wireLine(ctx, -65, 65, 0); return; }
    drawComp(ctx, ICON, iconComp(id as CompType), 0, true);
  }
  function drawGhost(ctx: Ctx, d: NonNullable<typeof lab.drag>) {
    const he = lab.hoverEdge, id = d.id!;
    ctx.save(); ctx.globalAlpha = 0.9;
    if (MATERIALS[id]) { ctx.translate(he ? he.mx : d.x, he ? he.my : d.y); if (he && !he.horiz) ctx.rotate(Math.PI / 2); drawMaterial(ctx, id, 1); ctx.restore(); return; }
    if (id === "meter") { ctx.translate(d.x, d.y); drawToolIcon(ctx, "meter"); ctx.restore(); return; }
    if (he) { const c = iconComp(id as CompType, id === "cell" ? (d.carry && d.e ? (d.carry.plus === d.e.a ? he.a : he.b) : he.b) : 0); c.a = 0.8; drawComp(ctx, { ...he, I: 0 }, c, 0); }
    else { ctx.translate(d.x, d.y); drawToolIcon(ctx, id); }
    ctx.restore();
  }
  function drawFinal(ctx: Ctx, f: NonNullable<typeof lab.finalCard>) {
    ctx.save(); ctx.globalAlpha = f.a; ctx.fillStyle = "rgba(10,12,18,.6)"; ctx.fillRect(0, 0, W, H);
    const x = 190, y = 150, w = 640, h = 340;
    ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, x, y + (1 - f.a) * 16, w, h, 28); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
    api.text(ctx, T.labDone.toUpperCase(), 500, y + 66, { font: "mono", size: 38, weight: 600, color: C.mint, align: "center", track: 4 });
    api.text(ctx, `${T.conducts}:`, x + 50, y + 150, { font: "mono", size: 38, weight: 500, color: C.ink3 });
    api.text(ctx, f.conducts.join(", ") || "—", x + 50, y + 200, { font: "ui", size: 40, weight: 600, maxWidth: 560 });
    api.text(ctx, `${T.blocks}:`, x + 50, y + 260, { font: "mono", size: 38, weight: 500, color: C.ink3 });
    api.text(ctx, f.blocks.join(", ") || "—", x + 50, y + 310, { font: "ui", size: 40, weight: 600, maxWidth: 560 });
    ctx.restore();
  }

  // ── QA bot: the demo sequence for the default spec, else wire the cue edge
  const trayPos = (id: string): XY | null => { const t = lab.tray.find((x) => x.id === id); return t ? [t.x + t.w / 2, t.y + t.h / 2] : null; };
  const mid = (s: string): XY | null => { const e = edgeAt(s); return e ? [e.mx, e.my] : null; };
  function bot(): BotAction | null {
    const s = step();
    if (!s || lab.done || lab.drag) return { type: "wait", ms: 400 };
    const drag = (from: XY | null, to: XY | null, after = 900): BotAction => (from && to ? { type: "drag", from, to, ms: 500, after } : { type: "wait", ms: 400 });
    const key = Object.keys(s.check)[0];
    if (key === "bulbLit") return drag(trayPos("wire"), s.cueE ? [s.cueE.mx, s.cueE.my] : mid("1,1-2,1"));
    if (key === "meters") { const n = edges.filter((e) => e.meter).length; return drag(trayPos("meter"), n === 0 ? mid("0,0-1,0") : mid("2,0-3,0"), 1200); }
    if (key === "switchCycle") { const sw = edges.find((e) => e.comp && e.comp.type === "switch"); if (!sw) return drag(trayPos("switch"), mid("3,0-3,1"), 1300); return { type: "tap", at: [sw.mx, sw.my], after: 1700 }; }
    if (key === "tested") {
      const order = ["coin", "ruler", "pencil", "eraser", "nail", "glass"].filter((m) => !lab.tested[m] && lab.tray.some((t) => t.id === m));
      const tester = edges.find((e) => e.comp && e.comp.type === "tester");
      if (!order.length || lab.pendingTest || !tester) return { type: "wait", ms: 400 };
      return drag(trayPos(order[0]), [tester.mx, tester.my], 1300);
    }
    if (key === "brightness") { const cells = edges.filter((e) => e.comp && e.comp.type === "cell"); if (cells.length < 2) return drag(trayPos("cell"), mid("0,1-1,1"), 1500); const fresh = cells.find((e) => !e.comp!.locked); return fresh ? { type: "tap", at: [fresh.mx, fresh.my], after: 1700 } : { type: "wait", ms: 400 }; }
    return { type: "wait", ms: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ step: step()?.id ?? null, done: lab.done, brightness: +brightness().toFixed(3), tested: lab.tested, edges: edges.filter((e) => e.comp).map((e) => ({ key: e.key, type: e.comp!.type, I: +e.I.toFixed(4) })) }),
    knob(k) { if (k === "again") { for (const e of edges) { e.comp = null; e.meter = false; } lab.tested = {}; lab.finalCard = null; startStep(0); return true; } return false; },
    board: () => ({ title: "A circuit needs a closed loop", lines: ["Cell → wire → bulb → wire → back to the cell.", "Open the loop anywhere and the current stops everywhere."], figure: { kind: "chain", items: ["cell +", "wire", "bulb", "wire", "cell −"] }, accent: C.sci }),
  };
}
export const circuit: EngineDef<CircuitSpec> = { archetype: "circuit-bench@1", label: "Sim · Circuits", accent: C.sci, create };
