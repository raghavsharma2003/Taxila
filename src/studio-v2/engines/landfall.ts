// LANDFALL — `catch-on-line@1` (STUDIO-V2 §11.1). Port of prototypes/reset/studio/01-landfall/landfall.js.
// Learning act = game act: steer the dock to where the fraction (or decimal) lives on the number line before the pod
// lands. The landing beam reveals the truth only in the last 260 ms, so the falling position is never a hint.
// Truth = exact rationals from shared/studio-spec.ts; the host grades each landing (PAE) from the validated spec.
import { fracValue, nearestSimple, parseFrac, type Frac, type LandfallSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, ease, lerp, rng } from "../core/math.ts";
import { bloom, card, glow, magnifier, roundRect, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import type { EngineApi, EngineDef, EngineInstance, Knob } from "../core/types.ts";

const LINE_Y = 505, X0 = 120, X1 = 880, LOCK_Y = 352, SPAWN_Y = 150, BASE_HALF = 50;
const TOL = { exact: 12, close: 28 };
interface Pod { id: string; group: string; gsize: number; f: Frac; value: number; x: number; y: number; vy: number; a: number; sc: number; phase: "fall" | "dive"; dive: number; sway: number; flame: number; h: number; trueX: number; fromX: number; fromY: number }
interface Result { item: string; value: number; estimate: number; pae: number; caught: boolean; wave: number; group: string; verdict: string }
interface Marker { x: number; label: string; t: number; life: number; ok: boolean; same?: boolean; dockX: number; off?: string | null }

function create(api: EngineApi, spec: LandfallSpec): EngineInstance {
  const T = spec.strings;
  const waves = spec.waves.map((w) => ({ ...w, groups: w.items.map((g) => g.map((l) => parseFrac(l)!)) }));
  const g = { state: "boot" as "boot" | "intro" | "play" | "end" | "final", waveIdx: -1, stateT: 0, clock: 0, spawnIdx: 0, pods: [] as Pod[], markers: [] as Marker[], speedScale: 1, halfW: BASE_HALF,
    missRun: 0, chain: 0, bestChain: 0, scaffoldLeft: 0, results: [] as Result[], waveResults: [] as Result[], lineGlow: 0, introA: 0, coachA: 1, coachGone: false, bootT: 0,
    endCard: null as null | { a: number; landed: number; n: number; precision: number; best: number }, finalCard: null as null | { a: number; landed: number; n: number; precision: number; best: number; tough: { item: string; near: string } | null } };
  const dock = { x: 230, v: 0, target: 230, squash: 1, keys: 0 };
  const stars = Array.from({ length: 110 }, () => ({ x: api.rnd() * W, y: api.rnd() * (LINE_Y - 30), z: 0.2 + api.rnd() * 0.8, tw: api.rnd() * 6.28 }));
  const botRnd = rng(api.seed * 31 + 5);
  const wave = () => waves[Math.max(0, g.waveIdx)];
  const lineMin = () => wave().line[0], lineMax = () => wave().line[1];
  const xOf = (v: number) => X0 + ((v - lineMin()) / (lineMax() - lineMin())) * (X1 - X0);
  const vOf = (x: number) => lineMin() + ((x - X0) / (X1 - X0)) * (lineMax() - lineMin());
  const precisionOf = (r: Result[]) => (r.length ? Math.max(0, Math.round(100 - r.reduce((a, b) => a + b.pae, 0) / r.length)) : 100);
  const hud = api.hud([{ key: "wave", label: T.wave }, { key: "chain", label: T.chain }, { key: "prec", label: T.precision, meter: true }]);
  function dismissCoach() { if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); } }
  api.onPointer({
    down(p) { dock.target = clamp(p.x, X0 - 40, X1 + 40); dismissCoach(); },
    move(p) { if (p.down || p.type === "mouse") { dock.target = clamp(p.x, X0 - 40, X1 + 40); if (p.down) dismissCoach(); } },
  });
  api.onKey((k, down) => {
    if (k === "ArrowLeft") { dock.keys = down ? -1 : dock.keys < 0 ? 0 : dock.keys; if (down) dismissCoach(); }
    if (k === "ArrowRight") { dock.keys = down ? 1 : dock.keys > 0 ? 0 : dock.keys; if (down) dismissCoach(); }
  });

  function startWave(i: number) {
    g.waveIdx = i; g.state = "intro"; g.stateT = 0; g.clock = 0; g.spawnIdx = 0; g.waveResults = []; g.introA = 0; g.lineGlow = 0;
    api.tw.add(g, { introA: 1 }, { dur: 0.45 }); api.tw.add(g, { lineGlow: 1 }, { dur: 1.1, ease: "inOutCubic", delay: 0.3 });
    sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    api.event("wave_start", { wave: i + 1, title: wave().title, targets: wave().targets ?? null });
  }
  function spawnGroup(group: Frac[]) {
    const xs: number[] = [];
    for (let k = 0; k < group.length; k++) { let x = 0, tries = 0; do { x = 230 + api.rnd() * 520; tries++; } while (tries < 40 && xs.some((o) => Math.abs(o - x) < 230)); xs.push(x); }
    const id = Math.floor(api.rnd() * 1e9).toString(36);
    group.forEach((f, k) => {
      const pod: Pod = { id: id + k, group: id, gsize: group.length, f, value: fracValue(f), x: xs[k], y: SPAWN_Y - 40, vy: wave().speed * g.speedScale, a: 0, sc: 0.6, phase: "fall", dive: 0, sway: api.rnd() * 6.28, flame: 0, h: 118, trueX: 0, fromX: 0, fromY: 0 };
      pod.trueX = xOf(pod.value);
      api.tw.add(pod, { a: 1, sc: 1 }, { dur: 0.4, ease: "outBack" }); api.tw.add(pod, { y: SPAWN_Y }, { dur: 0.4 });
      g.pods.push(pod);
    });
    sfx.noise({ dur: 0.25, f: 700, gain: 0.08 });
  }
  function resolvePod(pod: Pod) {
    const err = Math.abs(dock.x - pod.trueX), caught = err <= g.halfW, estimate = vOf(dock.x);
    const local = (Math.abs(estimate - pod.value) / (lineMax() - lineMin())) * 100 <= 6.6 ? "right" : (Math.abs(estimate - pod.value) / (lineMax() - lineMin())) * 100 <= 12 ? "partial" : "wrong";
    const grade = api.answer(`w${g.waveIdx + 1}:${pod.f.label}`, +estimate.toFixed(4), local);
    const r: Result = { item: pod.f.label, value: pod.value, estimate: +estimate.toFixed(4), pae: grade.error ?? 100, caught, wave: g.waveIdx + 1, group: pod.group, verdict: grade.verdict };
    g.results.push(r); g.waveResults.push(r);
    const hitX = pod.trueX, hitY = LINE_Y, fx = api.fx;
    if (caught) {
      g.chain++; g.bestChain = Math.max(g.bestChain, g.chain); g.missRun = 0;
      const grd = err <= TOL.exact ? "exact" : err <= TOL.close ? "close" : "inside";
      fx.burst(hitX, hitY - 20, { n: grd === "exact" ? 34 : 22, color: C.mint, speed: grd === "exact" ? 520 : 380, life: 0.7, size: 11, gravity: 600, angle: -Math.PI / 2, spread: Math.PI * 1.3 });
      fx.burst(hitX, hitY - 20, { n: 8, color: C.ink, speed: 260, life: 0.45, size: 7 });
      fx.ring(hitX, hitY, { color: C.mint, r0: 10, r1: grd === "exact" ? 130 : 90, life: 0.55, width: 8 });
      if (pod.gsize === 1) fx.pop(grd === "exact" ? T.exact : grd === "close" ? T.close : T.inside, hitX, hitY - 150, { color: C.mint, size: grd === "exact" ? 56 : 46, rise: 60 });
      if (grd === "exact") { fx.shake(5, 0.22); api.hitstop(70); fx.flash(C.mint, 0.14); }
      dock.squash = 0.62; api.tw.add(dock, { squash: 1 }, { dur: 0.5, ease: "outElastic" });
      const semis = Math.min(g.chain, 14);
      sfx.blip({ f: 523 * Math.pow(2, semis / 12), f2: 523 * Math.pow(2, (semis + 7) / 12), dur: 0.16, type: "triangle", gain: 0.22 });
      if (grd === "exact") sfx.blip({ f: 1568, dur: 0.22, gain: 0.1 });
      if (pod.gsize === 1) g.markers.push({ x: hitX, label: pod.f.label, t: 0, life: 1.0, ok: true, dockX: dock.x });
      if (g.chain > 0 && g.chain % spec.adapt.fastAfterChain === 0) adapt(+1);
    } else {
      g.chain = 0; g.missRun++;
      fx.burst(hitX, hitY - 30, { n: 14, color: C.amber, speed: 340, life: 1.1, size: 13, gravity: 1300, shard: true, floor: LINE_Y - 4, angle: -Math.PI / 2, spread: Math.PI });
      fx.ring(hitX, hitY, { color: C.amber, r0: 6, r1: 70, life: 0.5, width: 5 }); fx.shake(3, 0.18);
      sfx.blip({ f: 180, f2: 90, dur: 0.22, gain: 0.25 });
      if (pod.gsize === 1) g.markers.push({ x: hitX, label: pod.f.label, t: 0, life: 1.9, ok: false, dockX: dock.x, off: nearestSimple(Math.abs(estimate - pod.value)) });
      if (g.missRun >= spec.adapt.slowAfterMisses) { adapt(-1); g.missRun = 0; }
    }
    const groupR = g.results.filter((x) => x.group === pod.group);
    if (pod.gsize > 1 && groupR.length === pod.gsize) {
      const labels = groupR.map((x) => x.item), all = groupR.every((x) => x.caught);
      g.markers.push({ x: hitX, label: labels.join(" = "), t: 0, life: all ? 2.0 : 2.2, ok: all, same: all, dockX: dock.x, off: all ? null : nearestSimple(Math.abs(estimate - pod.value)) });
      if (all) { fx.pop(T.same, hitX, hitY - 205, { color: C.ion, size: 56, life: 1.4, rise: 36 }); fx.ring(hitX, hitY, { color: C.ion, r0: 20, r1: 190, life: 0.8, width: 10 }); sfx.blip({ f: 784, f2: 1175, dur: 0.3, type: "triangle", gain: 0.16 }); }
      api.event("same_spot", { items: labels, caught: all });
    }
    api.facts({ wave: g.waveIdx + 1, landed: g.results.filter((x) => x.caught).length, of: g.results.length, precision: precisionOf(g.results), last: `${pod.f.label} ${grade.verdict}` });
  }
  function adapt(dir: number) {
    const a = spec.adapt;
    if (dir < 0) { g.speedScale = Math.max(a.minScale, g.speedScale * a.slowFactor); g.halfW = Math.min(BASE_HALF * 1.3, g.halfW * 1.12); g.scaffoldLeft = a.scaffoldPods; api.event("adapt", { dir: "easier", speedScale: +g.speedScale.toFixed(2), halfW: +g.halfW.toFixed(1), scaffold: true }); }
    else { g.speedScale = Math.min(a.maxScale, g.speedScale * a.fastFactor); g.halfW = Math.max(BASE_HALF * 0.8, g.halfW * 0.95); api.event("adapt", { dir: "harder", speedScale: +g.speedScale.toFixed(2), halfW: +g.halfW.toFixed(1) }); }
  }
  function endWave() {
    g.state = "end"; g.stateT = 0;
    const r = g.waveResults;
    g.endCard = { a: 0, landed: r.filter((x) => x.caught).length, n: r.length, precision: precisionOf(r), best: g.bestChain };
    api.tw.add(g.endCard, { a: 1 }, { dur: 0.45 }); api.tw.add(g.endCard, { a: 0 }, { dur: 0.35, ease: "inCubic", delay: 2.6 });
    sfx.blip({ f: 392, f2: 784, dur: 0.4, type: "triangle", gain: 0.12 });
    api.event("wave_end", { wave: g.waveIdx + 1, landed: g.endCard.landed, n: g.endCard.n, precision: g.endCard.precision });
  }
  function finish() {
    g.state = "final"; g.stateT = 0;
    const r = g.results, misses = r.filter((x) => !x.caught).sort((a, b) => b.pae - a.pae), tough = misses[0] ?? [...r].sort((a, b) => b.pae - a.pae)[0];
    g.finalCard = { a: 0, landed: r.filter((x) => x.caught).length, n: r.length, precision: precisionOf(r), best: g.bestChain, tough: tough ? { item: tough.item, near: nearestSimple(tough.estimate) ?? tough.estimate.toFixed(2) } : null };
    api.tw.add(g.finalCard, { a: 1 }, { dur: 0.6 });
    api.done({ landed: g.finalCard.landed, n: r.length, precision: g.finalCard.precision, bestChain: g.bestChain });
  }

  function update(dt: number) {
    g.stateT += dt;
    if (dock.keys) dock.target = clamp(dock.target + dock.keys * 720 * dt, X0 - 40, X1 + 40);
    const k = 260, c = 2 * Math.sqrt(k), acc = k * (dock.target - dock.x) - c * dock.v;      // critically damped spring
    dock.v = clamp(dock.v + acc * dt, -1500, 1500); dock.x += dock.v * dt;
    for (const s of stars) s.tw += dt * (1 + s.z);
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); startWave(0); } return; }
    if (g.state === "intro" && g.stateT > 1.9) { g.state = "play"; g.stateT = 0; api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); }
    if (g.state === "play") {
      g.clock += dt;
      const w = wave(), gap = w.gap / g.speedScale;
      if (g.spawnIdx < w.groups.length && g.clock >= g.spawnIdx * gap + 0.2) { spawnGroup(w.groups[g.spawnIdx]); g.spawnIdx++; }
      if (g.spawnIdx >= w.groups.length && g.pods.length === 0 && g.markers.length === 0) endWave();
    }
    if (g.state === "end" && g.stateT > 3.1) { if (g.waveIdx + 1 < waves.length) startWave(g.waveIdx + 1); else finish(); }
    for (let i = g.pods.length - 1; i >= 0; i--) {
      const p = g.pods[i];
      p.sway += dt * 2.2; p.flame += dt * 30;
      if (p.phase === "fall") {
        p.y += p.vy * dt; p.x += Math.sin(p.sway) * 10 * dt;
        if (p.y >= LOCK_Y) { p.phase = "dive"; p.dive = 0; p.fromX = p.x; p.fromY = p.y; sfx.blip({ f: 880, f2: 1320, dur: 0.07, type: "square", gain: 0.05 }); }
      } else {
        p.dive += dt / 0.26;
        const e = ease.inQuad(Math.min(1, p.dive));
        p.x = lerp(p.fromX, p.trueX, ease.outCubic(Math.min(1, p.dive))); p.y = lerp(p.fromY, LINE_Y - p.h / 2 + 6, e);
        if (p.dive >= 1) { g.pods.splice(i, 1); resolvePod(p); if (g.scaffoldLeft > 0) g.scaffoldLeft--; }
      }
    }
    for (let i = g.markers.length - 1; i >= 0; i--) { const m = g.markers[i]; m.t += dt; if (m.t >= m.life) g.markers.splice(i, 1); }
    if (g.state !== "final") syncHud();
  }
  function syncHud() {
    if (g.waveIdx < 0) return;
    hud.set("wave", `${g.waveIdx + 1}/${waves.length}`);
    hud.set("chain", `×${g.chain}`, { tone: g.chain >= 5 ? "ion" : null, bump: true });
    const p = g.results.length ? precisionOf(g.results) : null;
    hud.set("prec", p == null ? "—" : `${p}%`, { meter: p == null ? 0 : p / 100, tone: p != null && p >= 90 ? "mint" : null });
  }

  // ── render
  function paintSky(c: Ctx) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const sky = c.createLinearGradient(0, 0, 0, LINE_Y); sky.addColorStop(0, "#090B11"); sky.addColorStop(0.7, "#0E1220"); sky.addColorStop(1, "#151A33");
    c.fillStyle = sky; c.fillRect(0, 0, W, LINE_Y);
    const hg = c.createRadialGradient(500, LINE_Y, 10, 500, LINE_Y, 520); hg.addColorStop(0, "rgba(139,152,255,.22)"); hg.addColorStop(1, "rgba(139,152,255,0)");
    c.fillStyle = hg; c.fillRect(-20, -20, W + 40, LINE_Y + 20);
    c.fillStyle = "#0B0D15"; c.fillRect(-20, LINE_Y, W + 40, H - LINE_Y + 20);
    c.strokeStyle = "rgba(139,152,255,.10)"; c.lineWidth = 1.5;
    const vpY = LINE_Y - 150;
    for (let i = -10; i <= 10; i++) { const xb = 500 + i * 70; c.beginPath(); c.moveTo(lerp(500, xb, (LINE_Y - vpY) / (H + 40 - vpY)), LINE_Y); c.lineTo(xb, H + 40); c.stroke(); }
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("sky", paintSky), 0, 0, W, H);
    const fx = api.fx;
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    const par = (dock.x - 500) / 500;
    for (const s of stars) {
      const x = (((s.x - par * 18 * s.z) % W) + W) % W, r = 0.8 + s.z * 1.6;
      ctx.globalAlpha = (0.25 + 0.5 * s.z) * (0.7 + 0.3 * Math.sin(s.tw)); ctx.fillStyle = s.z > 0.8 ? C.ion : C.ink2; ctx.fillRect(x - r / 2, s.y - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(139,152,255,.10)"; ctx.lineWidth = 1.5;
    const scroll = api.reducedMotion ? 0 : (now * 0.35) % 1;
    for (let j = 0; j < 7; j++) { const z = (j + scroll) / 7, y = LINE_Y + Math.pow(z, 2.1) * (H - LINE_Y + 30); ctx.globalAlpha = 0.25 + 0.75 * z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (g.waveIdx >= 0) drawLine(ctx);
    drawMarkers(ctx); drawDock(ctx);
    for (const p of g.pods) drawPod(ctx, p);
    fx.drawWorld(ctx);
    ctx.restore();
    if (g.state === "intro" || g.introA > 0.01) drawIntro(ctx);
    if (g.endCard && g.endCard.a > 0.01) drawEnd(ctx, g.endCard);
    if (g.finalCard) drawFinal(ctx, g.finalCard);
    if (g.coachA > 0.01 && g.state !== "boot") api.text(ctx, T.coach, 500, 600, { font: "mono", size: 38, weight: 500, color: C.ink2, align: "center", alpha: g.coachA * (0.65 + 0.35 * Math.sin(now * 4)) });
    fx.drawScreen(ctx);
  }
  function drawLine(ctx: Ctx) {
    const w = wave(), xEnd = lerp(X0, X1, g.lineGlow);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35 + 0.15 * Math.min(1, g.chain / 6);
    ctx.drawImage(glow(C.ion, 40), X0 - 30, LINE_Y - 30, xEnd - X0 + 60, 60); ctx.restore();
    ctx.lineCap = "round"; ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(X0, LINE_Y); ctx.lineTo(xEnd, LINE_Y); ctx.stroke();
    for (let v = w.line[0]; v <= w.line[1]; v++) {
      const x = xOf(v); if (x > xEnd + 1) continue;
      ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(x, LINE_Y - 22); ctx.lineTo(x, LINE_Y + 22); ctx.stroke();
      api.text(ctx, String(v), x, LINE_Y + 68, { font: "mono", size: 44, weight: 600, color: C.ink2, align: "center" });
    }
    const ticks = g.scaffoldLeft > 0 ? Math.max(w.ticks, w.scaffoldTicks) : w.ticks;
    if (ticks > 1) {
      ctx.strokeStyle = g.scaffoldLeft > 0 && w.ticks < ticks ? "rgba(139,152,255,.8)" : C.ink3; ctx.lineWidth = 4;
      for (let v = w.line[0]; v < w.line[1]; v++) for (let k = 1; k < ticks; k++) { const x = xOf(v + k / ticks); if (x > xEnd) continue; ctx.beginPath(); ctx.moveTo(x, LINE_Y - 12); ctx.lineTo(x, LINE_Y + 12); ctx.stroke(); }
    }
  }
  function drawDock(ctx: Ctx) {
    const x = dock.x, hw = g.halfW, sq = dock.squash, lean = clamp(dock.v * 0.00022, -0.12, 0.12);
    ctx.save(); ctx.translate(x, LINE_Y);
    const bh = 190 * sq;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.22; ctx.drawImage(glow(C.volt, 64, 0.1), -hw * 0.9, -bh, hw * 1.8, bh * 2); ctx.restore();
    ctx.rotate(lean); ctx.scale(1 + (1 - sq) * 0.5, sq);
    ctx.strokeStyle = C.volt; ctx.fillStyle = C.volt; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-hw - 8, -40); ctx.lineTo(-hw, -30); ctx.lineTo(-hw, 16); ctx.moveTo(hw + 8, -40); ctx.lineTo(hw, -30); ctx.lineTo(hw, 16); ctx.stroke();
    roundRect(ctx, -hw - 14, 16, hw * 2 + 28, 14, 7); ctx.fill();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-11, 44); ctx.lineTo(0, 32); ctx.lineTo(11, 44); ctx.closePath(); ctx.fill();
    ctx.restore();
    bloom(ctx, C.volt, x, LINE_Y + 10, hw + 30, 0.3);
  }
  function drawPod(ctx: Ctx, p: Pod) {
    const f = p.f, big = 48, wholeSize = 60;
    ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = p.a; ctx.scale(p.sc, p.sc);
    const topLabel = f.decimal ? f.label : String(f.mixed ? f.n : f.num);
    const nW = api.measure(ctx, topLabel, { font: "display", size: big, weight: 700 }), dW = api.measure(ctx, String(f.d), { font: "display", size: big, weight: 700 });
    const fracW = Math.max(nW, f.decimal ? 0 : dW) + 10, wholeW = f.mixed ? api.measure(ctx, String(f.w), { font: "display", size: wholeSize, weight: 800 }) + 14 : 0;
    const w = f.whole ? 96 : Math.max(104, fracW + wholeW + 52), h = p.h;
    if (p.phase === "dive") { ctx.save(); ctx.scale(1 / p.sc, 1 / p.sc); ctx.globalAlpha = 0.6 * (1 - p.dive); ctx.strokeStyle = C.ion; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(p.trueX - p.x, LINE_Y - p.y); ctx.stroke(); ctx.restore(); }
    if (p.phase === "fall" && !api.reducedMotion) { ctx.save(); ctx.globalCompositeOperation = "lighter"; const fl = 26 + Math.sin(p.flame) * 6 + Math.sin(p.flame * 2.7) * 4; ctx.globalAlpha = 0.75; ctx.drawImage(glow(C.ion, 30), -22, h / 2 - 12, 44, fl + 24); ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.4 * p.a; ctx.drawImage(glow(C.ion, 80), -w / 2 - 34, -h / 2 - 34, w + 68, h + 68); ctx.restore();
    const grd = ctx.createLinearGradient(0, -h / 2, 0, h / 2); grd.addColorStop(0, "#232A45"); grd.addColorStop(1, "#141829");
    ctx.fillStyle = grd; roundRect(ctx, -w / 2, -h / 2, w, h, 30); ctx.fill();
    ctx.strokeStyle = C.ion; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 2; roundRect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 24); ctx.stroke();
    if (f.whole) api.text(ctx, String(f.w), 0, 2, { font: "display", size: wholeSize, weight: 800, align: "center", baseline: "middle" });
    else if (f.decimal) api.text(ctx, f.label, 0, 4, { font: "display", size: 54, weight: 800, align: "center", baseline: "middle" });
    else {
      if (f.mixed) api.text(ctx, String(f.w), -fracW / 2 - 4, 4, { font: "display", size: wholeSize, weight: 800, align: "center", baseline: "middle" });
      const cx = f.mixed ? wholeW / 2 - 2 : 0;
      api.text(ctx, topLabel, cx, -22, { font: "display", size: big, weight: 700, align: "center", baseline: "middle" });
      ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx - fracW / 2 + 4, 4); ctx.lineTo(cx + fracW / 2 - 4, 4); ctx.stroke();
      api.text(ctx, String(f.d), cx, 32, { font: "display", size: big, weight: 700, align: "center", baseline: "middle" });
    }
    ctx.restore();
  }
  function drawMarkers(ctx: Ctx) {
    for (const m of g.markers) {
      const k = m.t / m.life, a = k < 0.1 ? k / 0.1 : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1, col = m.same ? C.ion : m.ok ? C.mint : C.amber;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(m.x, LINE_Y - 34); ctx.lineTo(m.x, LINE_Y + 10); ctx.stroke();
      const y = LINE_Y - 96, lw = api.measure(ctx, m.label, { font: "mono", size: 40, weight: 600 }) + 36, bx = clamp(m.x - lw / 2, 190, 830 - lw);
      ctx.fillStyle = "rgba(16,19,27,.86)"; roundRect(ctx, bx, y - 30, lw, 60, 14); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      api.text(ctx, m.label, bx + lw / 2, y + 2, { font: "mono", size: 40, weight: 600, color: col, align: "center", baseline: "middle" });
      if (!m.ok) {
        const yb = LINE_Y + 36;
        ctx.setLineDash([8, 9]); ctx.lineWidth = 4; ctx.strokeStyle = C.amber; ctx.beginPath(); ctx.moveTo(m.dockX, yb); ctx.lineTo(m.x, yb); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(m.dockX, yb - 10); ctx.lineTo(m.dockX, yb + 10); ctx.moveTo(m.x, yb - 10); ctx.lineTo(m.x, yb + 10); ctx.stroke();
        magnifier(ctx, m.x + (m.x >= m.dockX ? 36 : -36), LINE_Y - 60);
        if (m.off) api.text(ctx, `${T.offBy} ~${m.off}`, clamp((m.x + m.dockX) / 2, 280, 720), LINE_Y + 84, { font: "mono", size: 38, weight: 500, color: C.amber, align: "center", baseline: "middle" });
      } else if (!m.same) tick(ctx, m.x + 34, LINE_Y - 64);
      ctx.restore();
    }
  }
  function drawIntro(ctx: Ctx) {
    const a = g.introA, w = wave(); if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(10,12,18,.45)"; ctx.fillRect(0, 0, W, H);
    const sc = 1 + (1 - ease.outCubic(Math.min(1, g.stateT / 0.5))) * 0.25;
    api.text(ctx, `${T.wave.toUpperCase()} ${g.waveIdx + 1} ${T.of.toUpperCase()} ${waves.length}`, 500, 220, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", track: 6 });
    ctx.save(); ctx.translate(500, 300); ctx.scale(sc, sc); api.text(ctx, w.title, 0, 0, { font: "display", size: 104, weight: 800, align: "center", baseline: "middle", track: -3 }); ctx.restore();
    const lw = 260 * ease.outCubic(Math.min(1, g.stateT / 0.8)); ctx.strokeStyle = C.ion; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(500 - lw / 2, 366); ctx.lineTo(500 + lw / 2, 366); ctx.stroke();
    if (w.sub) api.text(ctx, w.sub, 500, 420, { font: "ui", size: 40, weight: 500, color: C.ink2, align: "center" });
    ctx.restore();
  }
  const stat = (ctx: Ctx, x: number, y: number, v: string, label: string) => { api.text(ctx, v, x, y, { font: "display", size: 60, weight: 800, align: "center", baseline: "middle" }); api.text(ctx, label, x, y + 62, { font: "mono", size: 38, weight: 500, color: C.ink3, align: "center", baseline: "middle" }); };
  function drawEnd(ctx: Ctx, e: NonNullable<typeof g.endCard>) {
    const y = 150 + (1 - e.a) * 18; card(ctx, 100, y, 800, 300, e.a);
    ctx.save(); ctx.globalAlpha = e.a;
    const head = `${T.wave.toUpperCase()} ${g.waveIdx + 1} ${T.clear.toUpperCase()}`;
    api.text(ctx, head, 500, y + 66, { font: "mono", size: 38, weight: 600, color: C.mint, align: "center", track: 4 });
    tick(ctx, 500 - api.measure(ctx, head, { font: "mono", size: 38, track: 4 }) / 2 - 34, y + 56);
    stat(ctx, 255, y + 160, `${e.landed}/${e.n}`, T.landed); stat(ctx, 500, y + 160, `${e.precision}%`, T.precision); stat(ctx, 745, y + 160, `×${e.best}`, T.bestChain);
    ctx.restore();
  }
  function drawFinal(ctx: Ctx, e: NonNullable<typeof g.finalCard>) {
    const y = 100 + (1 - e.a) * 18; card(ctx, 100, y, 800, 400, e.a);
    ctx.save(); ctx.globalAlpha = e.a;
    api.text(ctx, T.runDone.toUpperCase(), 500, y + 66, { font: "mono", size: 38, weight: 600, color: C.ion, align: "center", track: 4 });
    stat(ctx, 255, y + 160, `${e.landed}/${e.n}`, T.landed); stat(ctx, 500, y + 160, `${e.precision}%`, T.precision); stat(ctx, 745, y + 160, `×${e.best}`, T.bestChain);
    if (e.tough) { ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(160, y + 268); ctx.lineTo(840, y + 268); ctx.stroke(); api.text(ctx, `${T.toughest}: ${e.tough.item}  ·  you read ~${e.tough.near}`, 500, y + 330, { font: "mono", size: 38, weight: 500, color: C.amber, align: "center", baseline: "middle", maxWidth: 760 }); }
    ctx.restore();
  }
  return {
    update, render,
    seam: () => ({ state: g.state, wave: g.waveIdx + 1, waves: waves.length, dockX: dock.x, halfW: g.halfW, results: g.results.length,
      pods: g.pods.map((p) => ({ label: p.f.label, value: p.value, x: p.x, y: p.y, trueX: p.trueX, phase: p.phase, eta: p.phase === "fall" ? (LOCK_Y - p.y) / p.vy : 0 })) }),
    bot() {
      if (g.state !== "play") return { type: "wait", ms: 250 };
      const falling = g.pods.filter((p) => p.phase === "fall").sort((a, b) => (LOCK_Y - a.y) / a.vy - (LOCK_Y - b.y) / b.vy);
      const p = falling[0];
      if (!p) return { type: "wait", ms: 150 };
      const noise = (botRnd() + botRnd() + botRnd() - 1.5) * 34;     // a human-ish estimate: mostly close, sometimes off
      const to = clamp(p.trueX + noise, X0, X1);
      return { type: "drag", from: [dock.target, 570], to: [to, 570], ms: 260, after: 120 };
    },
    knob(k: Knob) {
      if (k === "slower" || k === "easier") { adapt(-1); return true; }
      if (k === "harder" || k === "faster") { adapt(+1); return true; }
      if (k === "again") { g.results = []; g.chain = 0; g.pods = []; g.markers = []; g.finalCard = null; g.endCard = null; startWave(0); return true; }
      return false;
    },
    board: () => {
      const w = waves[Math.max(0, g.waveIdx)];
      const marks = w.groups.slice(0, 4).map((grp) => ({ v: fracValue(grp[0]), label: grp.map((f) => f.label).join(" = ") }));
      return { title: w.title, lines: ["Each fraction has one place on the line.", "Equal fractions land on the same spot."], figure: { kind: "numberline", min: w.line[0], max: w.line[1], marks }, accent: C.ion };
    },
  };
}
export const landfall: EngineDef<LandfallSpec> = { archetype: "catch-on-line@1", label: "Game · Landfall", accent: C.ion, create };
