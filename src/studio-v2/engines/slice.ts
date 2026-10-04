// FRACTION SLICE — `slice-at@1` (STUDIO-V2 §6.1 #3). Real-time: glass bars are tossed on ballistic arcs; the child
// swipes through a bar at the asked fraction (measured from the bar's lit end). Equal-share items need several cuts
// while the bar is airborne (the world slows while the finger is down: "focus"). The cut point in the bar's own frame
// is the act; the host grades it against the exact fraction from the spec.
import { fracValue, nearestSimple, parseFrac, type SliceSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, ease, lerp, rng } from "../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

const L = 380, BH = 58, G0 = 520;
interface Bar { wave: number; idx: number; cut?: number; parts?: number; label: string; x: number; y: number; vx: number; vy: number; rot: number; vr: number; cuts: number[]; done: boolean; t: number; a: number }
interface Piece { x: number; y: number; vx: number; vy: number; rot: number; vr: number; from: number; to: number; t: number; color: string }
interface Ghost { x: number; y: number; rot: number; truth: number[]; got: number[]; ok: boolean; t: number; life: number; off: string | null }

function create(api: EngineApi, spec: SliceSpec): EngineInstance {
  const T = spec.strings;
  const g = { state: "boot" as "boot" | "intro" | "play" | "end" | "final", waveIdx: -1, stateT: 0, clock: 0, spawnIdx: 0, bars: [] as Bar[], pieces: [] as Piece[], ghosts: [] as Ghost[],
    chain: 0, best: 0, missRun: 0, gScale: 1, scaffold: 0, results: [] as { err: number; verdict: string; label: string }[], waveRes: [] as { err: number; verdict: string }[],
    introA: 0, coachA: 1, coachGone: false, bootT: 0, focus: 0, compare: null as null | { a: number; labels: string[] }, endA: 0, finalA: 0 };
  const trail: { x: number; y: number; t: number }[] = [];
  let down = false, lastP: XY | null = null;
  const botRnd = rng(api.seed * 17 + 3);
  const wave = () => spec.waves[Math.max(0, g.waveIdx)];
  const hud = api.hud([{ key: "cut", label: T.cut }, { key: "chain", label: T.chain }, { key: "acc", label: T.accuracy, meter: true }]);
  const accOf = (r: { err: number }[]) => (r.length ? Math.round(100 * (r.reduce((a, b) => a + (1 - Math.min(1, b.err / 0.2)), 0) / r.length)) : 100);
  const toLocal = (b: Bar, x: number, y: number): XY => { const dx = x - b.x, dy = y - b.y, c = Math.cos(-b.rot), s = Math.sin(-b.rot); return [dx * c - dy * s, dx * s + dy * c]; };
  const toWorld = (b: { x: number; y: number; rot: number }, lx: number, ly: number): XY => { const c = Math.cos(b.rot), s = Math.sin(b.rot); return [b.x + lx * c - ly * s, b.y + lx * s + ly * c]; };

  function dismissCoach() { if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); } }
  api.onPointer({
    down(p) { down = true; lastP = [p.x, p.y]; trail.length = 0; trail.push({ x: p.x, y: p.y, t: 0 }); dismissCoach(); },
    move(p) {
      if (!down || !lastP) return;
      trail.push({ x: p.x, y: p.y, t: 0 }); if (trail.length > 18) trail.shift();
      for (const b of g.bars) if (!b.done) trySegment(b, lastP, [p.x, p.y]);
      lastP = [p.x, p.y];
    },
    up() { down = false; lastP = null; },
  });
  function trySegment(b: Bar, a: XY, c: XY) {
    const [ax, ay] = toLocal(b, a[0], a[1]), [cx, cy] = toLocal(b, c[0], c[1]);
    if ((ay > 0) === (cy > 0) || Math.abs(ay - cy) < 1e-6) return;                 // must cross the bar's axis
    const t = ay / (ay - cy), x = ax + (cx - ax) * t;
    if (x < -L / 2 + 4 || x > L / 2 - 4) return;
    const frac = (x + L / 2) / L;
    if (b.cuts.some((q) => Math.abs(q - frac) < 0.025)) return;                 // the same stroke cannot cut twice
    b.cuts.push(frac);
    const [wx, wy] = toWorld(b, x, 0);
    api.fx.burst(wx, wy, { n: 18, color: C.ink, speed: 420, life: 0.4, size: 7, angle: b.rot + Math.PI / 2, spread: 0.6 });
    api.fx.burst(wx, wy, { n: 18, color: C.ink, speed: 420, life: 0.4, size: 7, angle: b.rot - Math.PI / 2, spread: 0.6 });
    sfx.noise({ dur: 0.09, f: 3200, filter: "highpass", gain: 0.22 });
    const need = b.parts ? b.parts - 1 : 1;
    if (b.cuts.length >= need) resolve(b);
  }
  function startWave(i: number) {
    g.waveIdx = i; g.state = "intro"; g.stateT = 0; g.clock = 0; g.spawnIdx = 0; g.waveRes = []; g.introA = 0;
    api.tw.add(g, { introA: 1 }, { dur: 0.45 });
    sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    api.event("wave_start", { wave: i + 1, title: wave().title, targets: wave().targets ?? null });
  }
  function spawn() {
    const it = wave().items[g.spawnIdx], left = g.spawnIdx % 2 === 0, grav = G0 * wave().gravity * g.gScale;
    const apexY = "parts" in it ? 250 : 270 + api.rnd() * 40, x0 = left ? 220 + api.rnd() * 80 : 780 - api.rnd() * 80, x1 = left ? 600 + api.rnd() * 80 : 400 - api.rnd() * 80;
    const vy = -Math.sqrt(2 * grav * (H + 60 - apexY)), tApex = -vy / grav, vx = (x1 - x0) / (tApex * 2);
    const b: Bar = { wave: g.waveIdx + 1, idx: g.spawnIdx, label: "cut" in it ? it.cut : `${it.parts}`, cut: "cut" in it ? fracValue(parseFrac(it.cut)!) : undefined, parts: "parts" in it ? it.parts : undefined,
      x: x0, y: H + 60, vx, vy, rot: (api.rnd() - 0.5) * 0.3, vr: (api.rnd() - 0.5) * 0.35, cuts: [], done: false, t: 0, a: 1 };
    g.bars.push(b);
    sfx.noise({ dur: 0.2, f: 500, gain: 0.08 });
  }
  function resolve(b: Bar) {
    b.done = true;
    const itemId = `w${b.wave}:${b.idx}`;
    let local = "wrong", err = 1, truth: number[] = [];
    if (b.cut != null) { err = b.cuts.length ? Math.abs(b.cuts[0] - b.cut) : 1; local = err <= 0.035 ? "right" : err <= 0.07 ? "partial" : "wrong"; truth = [b.cut]; }
    else if (b.parts) { const cuts = [...b.cuts].sort((x, y) => x - y), edges = [0, ...cuts, 1], pieces = edges.slice(1).map((x, i) => x - edges[i]); err = cuts.length === b.parts - 1 ? Math.max(...pieces.map((p) => Math.abs(p - 1 / b.parts!))) : 1; local = err <= 0.04 ? "right" : err <= 0.08 ? "partial" : "wrong"; truth = Array.from({ length: b.parts - 1 }, (_, k) => (k + 1) / b.parts!); }
    const grade = api.answer(itemId, b.cut != null ? (b.cuts.length ? +b.cuts[0].toFixed(4) : -1) : b.cuts.map((x) => +x.toFixed(4)), local);
    const ok = grade.verdict === "right";
    g.results.push({ err, verdict: grade.verdict, label: b.label }); g.waveRes.push({ err, verdict: grade.verdict });
    // split into pieces (physics), show the truth ghost where the cut belonged
    const edges = [0, ...[...b.cuts].sort((x, y) => x - y), 1];
    for (let i = 0; i < edges.length - 1; i++) {
      const mid = (edges[i] + edges[i + 1]) / 2, [px, py] = toWorld(b, (mid - 0.5) * L, 0), dir = mid < 0.5 ? -1 : 1;
      g.pieces.push({ x: px, y: py, vx: b.vx * 0.5 + dir * (90 + api.rnd() * 60), vy: b.vy * 0.4 - 120 - api.rnd() * 80, rot: b.rot, vr: dir * (0.8 + api.rnd()), from: edges[i], to: edges[i + 1], t: 0, color: ok ? C.mint : grade.verdict === "partial" ? C.ion : C.amber });
    }
    g.ghosts.push({ x: b.x, y: b.y, rot: b.rot, truth, got: [...b.cuts], ok, t: 0, life: ok ? 1.1 : 2.0, off: b.cut != null && b.cuts.length ? nearestSimple(err) : null });
    const [hx, hy] = [b.x, b.y - 90];
    if (ok) {
      g.chain++; g.best = Math.max(g.best, g.chain); g.missRun = 0;
      api.fx.pop(T.exact, hx, hy, { color: C.mint, size: 50, rise: 60 }); api.fx.ring(b.x, b.y, { color: C.mint, r0: 20, r1: 200, life: 0.6, width: 8 });
      api.fx.flash(C.mint, 0.1); api.hitstop(60); api.fx.shake(4, 0.2);
      sfx.blip({ f: 523 * Math.pow(2, Math.min(g.chain, 12) / 12), f2: 1046 * Math.pow(2, Math.min(g.chain, 12) / 12), dur: 0.18, type: "triangle", gain: 0.2 });
      if (g.chain % 4 === 0) { g.gScale = Math.min(1.25, g.gScale * 1.06); api.event("adapt", { dir: "harder", gScale: +g.gScale.toFixed(2) }); }
    } else {
      g.chain = 0; g.missRun++;
      api.fx.pop(grade.verdict === "partial" ? T.close : (b.cut != null && b.cuts.length ? `${T.offBy} ~${nearestSimple(err) ?? err.toFixed(2)}` : T.parts), hx, hy, { color: grade.verdict === "partial" ? C.ion : C.amber, size: 44, rise: 50, life: 1.3 });
      sfx.blip({ f: 200, f2: 110, dur: 0.22, gain: 0.22 });
      if (g.missRun >= 2) { g.gScale = Math.max(0.75, g.gScale * 0.88); g.scaffold = 2; g.missRun = 0; api.event("adapt", { dir: "easier", gScale: +g.gScale.toFixed(2), scaffold: true }); }
    }
    api.facts({ wave: g.waveIdx + 1, item: b.label, verdict: grade.verdict, accuracy: accOf(g.results), chain: g.chain });
  }
  function endWave() {
    g.state = "end"; g.stateT = 0; g.endA = 0;
    api.tw.add(g, { endA: 1 }, { dur: 0.45 }); api.tw.add(g, { endA: 0 }, { dur: 0.35, delay: wave().targets?.includes("bigger-denominator") ? 4.4 : 2.6 });
    if (wave().targets?.includes("bigger-denominator")) g.compare = { a: 0, labels: wave().items.filter((it) => "cut" in it).map((it) => (it as { cut: string }).cut) };
    if (g.compare) api.tw.add(g.compare, { a: 1 }, { dur: 0.6, delay: 0.2 });
    sfx.blip({ f: 392, f2: 784, dur: 0.4, type: "triangle", gain: 0.12 });
    api.event("wave_end", { wave: g.waveIdx + 1, accuracy: accOf(g.waveRes) });
  }
  function update(dt0: number) {
    g.focus = lerp(g.focus, down && g.bars.some((b) => !b.done && b.parts) ? 1 : 0, 1 - Math.exp(-dt0 * 10));
    const dt = dt0 * (1 - 0.62 * g.focus);
    g.stateT += dt0;
    for (const p of trail) p.t += dt0;
    while (trail.length && trail[0].t > 0.16) trail.shift();
    if (g.state === "boot") { g.bootT += dt0; if (g.bootT > 0.45) { hud.show(true); startWave(0); } return; }
    if (g.state === "intro" && g.stateT > 1.8) { g.state = "play"; g.stateT = 0; api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); }
    if (g.state === "play") {
      g.clock += dt;
      if (g.spawnIdx < wave().items.length && g.clock >= g.spawnIdx * wave().gap + 0.3 && !g.bars.some((b) => !b.done && b.y < H - 40 && b.parts)) { spawn(); g.spawnIdx++; }
      if (g.spawnIdx >= wave().items.length && g.bars.length === 0 && g.ghosts.length === 0 && g.pieces.length === 0) endWave();
    }
    if (g.state === "end" && g.stateT > (g.compare ? 5.4 : 3.2)) { g.compare = null; if (g.waveIdx + 1 < spec.waves.length) startWave(g.waveIdx + 1); else finish(); }
    const grav = G0 * wave().gravity * g.gScale;
    for (let i = g.bars.length - 1; i >= 0; i--) {
      const b = g.bars[i];
      b.t += dt; b.vy += grav * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot = clamp(b.rot + b.vr * dt, -0.4, 0.4);
      if (b.done) { g.bars.splice(i, 1); continue; }
      if (b.y > H + 80 && b.vy > 0) { if (g.scaffold > 0) g.scaffold--; resolve(b); g.bars.splice(i, 1); }
    }
    for (let i = g.pieces.length - 1; i >= 0; i--) { const p = g.pieces[i]; p.t += dt; p.vy += grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > H + 120) g.pieces.splice(i, 1); }
    for (let i = g.ghosts.length - 1; i >= 0; i--) { g.ghosts[i].t += dt0; if (g.ghosts[i].t > g.ghosts[i].life) g.ghosts.splice(i, 1); }
    const cur = g.bars.find((b) => !b.done) ?? null, it = wave().items[Math.min(g.spawnIdx, wave().items.length) - 1];
    if (g.state !== "final") {
      hud.set("cut", cur ? (cur.parts ? `${cur.parts} ${T.parts.toLowerCase()}` : cur.label) : it ? ("cut" in it ? it.cut : `${it.parts}`) : "—", { tone: "ion" });
      hud.set("chain", `×${g.chain}`, { bump: true, tone: g.chain >= 4 ? "ion" : null });
      const a = g.results.length ? accOf(g.results) : null; hud.set("acc", a == null ? "—" : `${a}%`, { meter: a == null ? 0 : a / 100, tone: a != null && a >= 85 ? "mint" : null });
    }
  }
  function finish() {
    g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 });
    const worst = [...g.results].sort((a, b) => b.err - a.err)[0];
    api.done({ sliced: g.results.length, right: g.results.filter((r) => r.verdict === "right").length, accuracy: accOf(g.results), best: g.best, toughest: worst?.label });
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0B0D16"); gr.addColorStop(1, "#141026");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const v = c.createRadialGradient(500, 260, 40, 500, 260, 640); v.addColorStop(0, "rgba(139,152,255,.13)"); v.addColorStop(1, "rgba(139,152,255,0)");
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(255,255,255,.035)"; c.lineWidth = 1;
    for (let i = 0; i < 26; i++) { const y = 80 + i * 22; c.beginPath(); c.moveTo(0, y + Math.sin(i) * 4); c.bezierCurveTo(300, y - 10, 700, y + 14, W, y - 4); c.stroke(); }
  }
  function drawBarBody(ctx: Ctx, from: number, to: number, alpha: number, marks: number, color: string = C.ion) {
    const x0 = (from - 0.5) * L, x1 = (to - 0.5) * L;
    ctx.save(); ctx.globalAlpha *= alpha;
    bloom(ctx, color, (x0 + x1) / 2, 0, Math.max(60, (x1 - x0) * 0.7), 0.35);
    const gr = ctx.createLinearGradient(0, -BH / 2, 0, BH / 2); gr.addColorStop(0, "rgba(190,200,255,.95)"); gr.addColorStop(0.45, "rgba(120,135,240,.85)"); gr.addColorStop(1, "rgba(60,70,170,.9)");
    ctx.fillStyle = gr; roundRect(ctx, x0, -BH / 2, x1 - x0, BH, from === 0 || to === 1 ? 14 : 3); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(x0 + 6, -BH / 2 + 6, Math.max(0, x1 - x0 - 12), 5);
    if (from === 0) { ctx.fillStyle = C.volt; roundRect(ctx, x0 - 2, -BH / 2 - 6, 10, BH + 12, 4); ctx.fill(); }     // the lit end: fractions count from here
    if (marks > 1) { ctx.strokeStyle = "rgba(10,12,30,.55)"; ctx.lineWidth = 4; for (let k = 1; k < marks; k++) { const x = (k / marks - 0.5) * L; if (x <= x0 || x >= x1) continue; ctx.beginPath(); ctx.moveTo(x, -BH / 2 + 8); ctx.lineTo(x, BH / 2 - 8); ctx.stroke(); } }
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (g.focus > 0.02) { ctx.save(); ctx.globalAlpha = 0.35 * g.focus; ctx.fillStyle = "#05060C"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const fx = api.fx;
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    for (const gh of g.ghosts) {
      const k = gh.t / gh.life, a = k < 0.1 ? k / 0.1 : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      ctx.save(); ctx.translate(gh.x, gh.y); ctx.rotate(gh.rot); ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; roundRect(ctx, -L / 2, -BH / 2, L, BH, 14); ctx.stroke(); ctx.setLineDash([]);
      for (const t of gh.truth) { const x = (t - 0.5) * L; ctx.strokeStyle = gh.ok ? C.mint : C.ion; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, -BH / 2 - 22); ctx.lineTo(x, BH / 2 + 22); ctx.stroke(); }
      if (!gh.ok) for (const c of gh.got) { const x = (c - 0.5) * L; ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x, -BH / 2 - 14); ctx.lineTo(x, BH / 2 + 14); ctx.stroke(); ctx.setLineDash([]); }
      if (!gh.ok && gh.truth.length === 1 && gh.got.length) { const xt = (gh.truth[0] - 0.5) * L, xg = (gh.got[0] - 0.5) * L; ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xg, BH / 2 + 30); ctx.lineTo(xt, BH / 2 + 30); ctx.stroke(); magnifier(ctx, xt + (xt > xg ? 30 : -30), -BH / 2 - 40); }
      else if (gh.ok) tick(ctx, (gh.truth[0] - 0.5) * L + 30, -BH / 2 - 40);
      ctx.restore();
    }
    for (const p of g.pieces) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.translate(-((p.from + p.to) / 2 - 0.5) * L, 0); drawBarBody(ctx, p.from, p.to, clamp(1 - p.t / 2.2, 0, 1), 0, p.color); ctx.restore(); }
    for (const b of g.bars) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      const marks = wave().marks || g.scaffold > 0 ? (b.cut != null ? (parseFrac(b.label)?.den ?? 0) : b.parts ?? 0) : 0;
      drawBarBody(ctx, 0, 1, b.a, marks);
      for (const c of b.cuts) { const x = (c - 0.5) * L; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -BH / 2 - 6); ctx.lineTo(x, BH / 2 + 6); ctx.stroke(); }
      ctx.restore();
      const lbl = b.parts ? `${b.parts} ${T.parts.toLowerCase()}` : b.label;
      api.text(ctx, lbl, b.x, b.y - BH / 2 - 34, { font: "display", size: 48, weight: 800, align: "center", baseline: "middle", glow: C.ion });
    }
    if (trail.length > 1) {
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (let i = 1; i < trail.length; i++) { const k = 1 - trail[i].t / 0.16; ctx.strokeStyle = `rgba(203,255,77,${0.85 * k})`; ctx.lineWidth = 3 + 9 * k; ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke(); }
      ctx.restore();
    }
    fx.drawWorld(ctx);
    ctx.restore();
    if (g.compare && g.compare.a > 0.01) drawCompare(ctx, g.compare);
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${T.wave} ${g.waveIdx + 1} / ${spec.waves.length}`, title: wave().title, sub: wave().sub });
    if (g.state === "end" && !g.compare) drawStatCard(api, ctx, { a: g.endA, head: `${T.wave} ${g.waveIdx + 1}`, ticked: true, stats: [[`${g.waveRes.filter((r) => r.verdict === "right").length}/${g.waveRes.length}`, T.sliced], [`${accOf(g.waveRes)}%`, T.accuracy], [`×${g.best}`, T.chain]] });
    if (g.state === "final") { const worst = [...g.results].sort((a, b) => b.err - a.err)[0]; drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.results.filter((r) => r.verdict === "right").length}/${g.results.length}`, T.sliced], [`${accOf(g.results)}%`, T.accuracy], [`×${g.best}`, T.chain]], foot: worst && worst.err > 0.035 ? `toughest: ${worst.label}` : undefined }); }
    drawCoach(api, ctx, T.coach, g.state === "play" ? g.coachA : 0, now);
    fx.drawScreen(ctx);
  }
  function drawCompare(ctx: Ctx, c: { a: number; labels: string[] }) {
    ctx.save(); ctx.globalAlpha = c.a; ctx.fillStyle = "rgba(10,12,18,.72)"; ctx.fillRect(0, 0, W, H);
    api.text(ctx, T.smaller.toUpperCase(), 500, 150, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", track: 5 });
    c.labels.forEach((lb, i) => {
      const f = parseFrac(lb); if (!f) return;
      const v = fracValue(f), y = 240 + i * 105, x0 = 300, w = 520 * v * ease.outCubic(clamp(c.a * 1.4 - i * 0.15, 0, 1));
      api.text(ctx, lb, 250, y + 4, { font: "display", size: 52, weight: 800, align: "right", baseline: "middle" });
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.setLineDash([6, 8]); ctx.lineWidth = 2; roundRect(ctx, x0, y - 26, 520, 52, 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.ion; roundRect(ctx, x0, y - 26, Math.max(4, w), 52, 10); ctx.fill();
    });
    ctx.restore();
  }
  function bot(): BotAction | null {
    if (g.state !== "play") return { type: "wait", ms: 250 };
    const b = g.bars.find((x) => !x.done && x.vy > -260 && x.y < H - 120);
    if (!b) return { type: "wait", ms: 60 };
    const lead = 0.12, px = b.x + b.vx * lead, py = b.y + b.vy * lead + 0.5 * G0 * wave().gravity * g.gScale * lead * lead, ghost = { x: px, y: py, rot: b.rot };
    const targets = b.cut != null ? [b.cut] : Array.from({ length: (b.parts ?? 2) - 1 }, (_, k) => (k + 1) / (b.parts ?? 2)).filter((t) => !b.cuts.some((c) => Math.abs(c - t) < 0.05));
    const t = clamp(targets[0] + (botRnd() + botRnd() - 1) * 0.035, 0.03, 0.97);
    const x = (t - 0.5) * L;
    return { type: "drag", from: toWorld(ghost, x, -110), to: toWorld(ghost, x, 110), ms: 90, after: b.parts ? 30 : 250 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: g.state, wave: g.waveIdx + 1, bars: g.bars.map((b) => ({ x: b.x, y: b.y, rot: b.rot, label: b.label, cuts: b.cuts })), results: g.results.length }),
    knob(k) {
      if (k === "slower" || k === "easier") { g.gScale = Math.max(0.75, g.gScale * 0.88); g.scaffold = 3; return true; }
      if (k === "harder" || k === "faster") { g.gScale = Math.min(1.25, g.gScale * 1.08); return true; }
      if (k === "again") { g.results = []; g.chain = 0; g.bars = []; g.pieces = []; g.ghosts = []; startWave(0); return true; }
      return false;
    },
    board: () => {
      const it = wave().items.find((x) => "cut" in x) as { cut: string } | undefined, f = it ? parseFrac(it.cut) : null;
      return { title: f ? `${f.label} of the bar` : "Equal parts", lines: ["The bottom number: how many equal parts.", "The top number: how many of them you take."], figure: f ? { kind: "bar", parts: f.den, shaded: Array.from({ length: f.num }, (_, i) => i) } : { kind: "bar", parts: 4, shaded: [0] }, accent: C.ion };
    },
  };
}
export const slice: EngineDef<SliceSpec> = { archetype: "slice-at@1", label: "Game · Fraction Slice", accent: C.ion, create };
