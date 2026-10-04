// VAULT HEIST — `vault-heist@1` (STUDIO-V2 §6.1 #14, Number Forge). Real-time strategy: blocks worth 1, 10, 100, 1000
// (and lakh-scale ones) ride a belt; tap to send one into its place-value column. Ten of a kind regroup into one of
// the next place. Load the vault to the exact target, then seal it before the laser sweep closes the door. A target
// with zeros (4,050), a words-only target (seven thousand six) and a round without 1000-blocks target the kit's
// place-value misconceptions. The column counts are the act; the host totals and grades them.
import { groupDigits, numberWords, type VaultSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, ease, lerp } from "../core/math.ts";
import { bloom, roundRect, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../core/types.ts";

const BELT_Y = 500, BELT_X0 = 30, BELT_X1 = 520, COL_X0 = 560, COL_X1 = 950, COL_TOP = 250, COL_BOT = 560;
const DCOL: Record<number, string> = { 1: "#8B98FF", 10: "#2FD3C7", 100: "#C69BFF", 1000: "#FFD27A", 10000: "#7FD6FF", 100000: "#F2F4F8" };
const PLACE: Record<number, string> = { 1: "O", 10: "T", 100: "H", 1000: "TH", 10000: "TTH", 100000: "L" };
interface Block { d: number; x: number; y: number; id: number; fly?: { x0: number; y0: number; x1: number; y1: number; t: number; col: number } }

function create(api: EngineApi, spec: VaultSpec): EngineInstance {
  const T = spec.strings;
  const g = { state: "boot" as "boot" | "intro" | "play" | "sealed" | "end" | "final", r: -1, stateT: 0, t: 0, belt: [] as Block[], fliers: [] as Block[], counts: {} as Record<number, number>, spawnT: 0, nextId: 1, spawnN: 0,
    results: [] as { verdict: string; total: number; target: number }[], introA: 0, coachA: 1, coachGone: false, bootT: 0, endA: 0, finalA: 0, merges: [] as { d: number; x: number; y: number; t: number }[], last: null as null | { total: number; verdict: string; detail?: string } };
  const round = () => spec.rounds[Math.max(0, g.r)];
  const denoms = () => round().denoms;
  const hud = api.hud([{ key: "vault", label: T.round }, { key: "loaded", label: T.loaded }, { key: "time", label: T.time, meter: true }]);
  const total = () => denoms().reduce((a, d) => a + d * (g.counts[d] ?? 0), 0);
  const colW = () => (COL_X1 - COL_X0) / denoms().length;
  const colX = (d: number) => { const ds = [...denoms()].sort((a, b) => b - a), i = ds.indexOf(d); return COL_X0 + colW() * (i + 0.5); };
  const blockSize = (d: number) => (d >= 1000 ? 56 : d >= 100 ? 50 : d >= 10 ? 44 : 30);
  const blockH = (d: number) => (d >= 1000 ? 56 : d >= 100 ? 16 : d >= 10 ? 14 : 30);
  function startRound(i: number) {
    g.r = i; g.state = "intro"; g.stateT = 0; g.t = 0; g.belt = []; g.fliers = []; g.counts = {}; g.spawnT = 0; g.spawnN = 0; g.introA = 0; g.last = null;
    for (const d of denoms()) g.counts[d] = 0;
    api.tw.add(g, { introA: 1 }, { dur: 0.45 });
    api.task(`${T.round} ${i + 1}/${spec.rounds.length}`, round().show === "words" ? numberWords(round().target, spec.system) : `${T.target} ${groupDigits(round().target, spec.system)}`);
    sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    api.event("round_start", { round: i + 1, target: round().target, show: round().show, targets: round().targets ?? null });
  }
  function spawn() {
    const ds = denoms(), rest = round().target - total();
    const needed = ds.filter((d) => d <= Math.max(rest, 1) || d === ds[0]);
    // over half the belt is what the target still needs (biased to the biggest place), the rest is noise to resist;
    // every 4th block is the largest still-needed denomination, so the target is always reachable in time
    const d = g.spawnN % 4 === 3 && needed.length ? needed[needed.length - 1] : api.rnd() < 0.55 && needed.length ? needed[Math.min(needed.length - 1, Math.floor(Math.pow(api.rnd(), 0.6) * needed.length))] : ds[Math.floor(api.rnd() * ds.length)];
    g.belt.push({ d, x: BELT_X0 - 40, y: BELT_Y - 8 - blockH(d) / 2, id: g.nextId++ }); g.spawnN++;
  }
  function sendToColumn(b: Block) {
    const col = colX(b.d), n = g.counts[b.d] ?? 0;
    b.fly = { x0: b.x, y0: b.y, x1: col, y1: COL_BOT - 14 - n * (blockH(b.d) + 4) - blockH(b.d) / 2, t: 0, col: b.d };
    g.fliers.push(b);
    sfx.blip({ f: 500 + Math.log10(b.d) * 120, f2: 900 + Math.log10(b.d) * 160, dur: 0.1, type: "triangle", gain: 0.12 });
  }
  function land(b: Block) {
    g.counts[b.d] = (g.counts[b.d] ?? 0) + 1;
    api.fx.burst(b.fly!.x1, b.fly!.y1, { n: 8, color: DCOL[b.d], speed: 160, life: 0.35, size: 8 });
    const next = b.d * 10;
    if (g.counts[b.d] >= 10 && denoms().includes(next)) {
      g.counts[b.d] -= 10;
      g.merges.push({ d: b.d, x: colX(b.d), y: COL_BOT - 120, t: 0 });
      const nb: Block = { d: next, x: colX(b.d), y: COL_BOT - 120, id: g.nextId++ };
      setTimeout(() => { if (g.state === "play") sendToColumn(nb); }, 380);
      api.fx.pop(T.regroup, colX(b.d), COL_BOT - 200, { color: C.ion, size: 40, rise: 40 }); api.fx.ring(colX(b.d), COL_BOT - 120, { color: C.ion, r0: 10, r1: 90, life: 0.5, width: 6 });
      sfx.blip({ f: 660, f2: 1320, dur: 0.22, type: "triangle", gain: 0.14 });
      api.event("regroup", { from: b.d, to: next });
    }
  }
  function seal(auto: boolean) {
    if (g.state !== "play") return;
    for (const f of g.fliers) if (f.fly) { land(f); } g.fliers = [];
    g.state = "sealed"; g.stateT = 0;
    const counts = Object.fromEntries(denoms().map((d) => [String(d), g.counts[d] ?? 0])), tot = total();
    const grade = api.answer(`r${g.r + 1}`, { counts }, tot === round().target ? "right" : "wrong");
    g.last = { total: tot, verdict: grade.verdict, detail: grade.detail };
    g.results.push({ verdict: grade.verdict, total: tot, target: round().target });
    if (grade.verdict === "right") { api.fx.burst(760, 200, { n: 40, color: C.mint, speed: 480, life: 0.8, size: 11 }); api.fx.flash(C.mint, 0.14); api.fx.shake(5, 0.25); api.hitstop(70); sfx.blip({ f: 392, f2: 784, dur: 0.3, type: "triangle", gain: 0.2 }); setTimeout(() => sfx.blip({ f: 587, f2: 1175, dur: 0.3, type: "triangle", gain: 0.16 }), 140); }
    else { api.fx.shake(3, 0.2); sfx.blip({ f: 220, f2: 110, dur: 0.3, gain: 0.2 }); }
    api.event("sealed", { auto, total: tot, target: round().target });
    api.facts({ round: g.r + 1, target: round().target, loaded: tot, verdict: grade.verdict, ...(grade.detail ? { detail: grade.detail } : {}) });
  }
  const SEAL = { x: 455, y: 338, r: 44 };   // inside the vault panel: never in the PiP or label safe zones
  api.onPointer({
    down(p) {
      if (g.state !== "play") return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); }
      if (Math.hypot(p.x - SEAL.x, p.y - SEAL.y) < SEAL.r + 16) { seal(false); return; }
      let best: Block | null = null, bd = 48;
      for (const b of g.belt) { const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < bd) { bd = d; best = b; } }
      if (best) { g.belt.splice(g.belt.indexOf(best), 1); sendToColumn(best); return; }
      if (p.x > COL_X0 && p.x < COL_X1 && p.y > COL_TOP - 20 && p.y < COL_BOT + 30) {      // tap a column: toss one back
        const ds = [...denoms()].sort((a, b) => b - a), d = ds[clamp(Math.floor((p.x - COL_X0) / colW()), 0, ds.length - 1)];
        if ((g.counts[d] ?? 0) > 0) { g.counts[d]--; g.belt.push({ d, x: BELT_X1 - 30, y: BELT_Y - 8 - blockH(d) / 2, id: g.nextId++ }); sfx.blip({ f: 400, f2: 250, dur: 0.08, type: "square", gain: 0.06 }); }
      }
    },
  });
  function update(dt: number) {
    g.stateT += dt;
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); startRound(0); } return; }
    if (g.state === "intro" && g.stateT > 1.9) { g.state = "play"; g.stateT = 0; api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); }
    if (g.state === "play") {
      g.t += dt; g.spawnT -= dt;
      if (g.spawnT <= 0) { spawn(); g.spawnT = 0.5 / spec.belt; }
      const v = 120 * spec.belt;
      for (let i = g.belt.length - 1; i >= 0; i--) { const b = g.belt[i]; b.x += v * dt; if (b.x > BELT_X1 + 30) { b.y += 300 * dt; if (b.y > H + 40) g.belt.splice(i, 1); } }
      if (g.t >= round().seconds) seal(true);
    }
    for (let i = g.fliers.length - 1; i >= 0; i--) { const f = g.fliers[i]; f.fly!.t += dt / 0.38; if (f.fly!.t >= 1) { g.fliers.splice(i, 1); land(f); } }
    for (let i = g.merges.length - 1; i >= 0; i--) { g.merges[i].t += dt; if (g.merges[i].t > 0.6) g.merges.splice(i, 1); }
    if (g.state === "sealed" && g.stateT > 2.4) { g.state = "end"; g.stateT = 0; g.endA = 0; api.tw.add(g, { endA: 1 }, { dur: 0.45 }); api.tw.add(g, { endA: 0 }, { dur: 0.35, delay: 2.4 }); }
    if (g.state === "end" && g.stateT > 3) { if (g.r + 1 < spec.rounds.length) startRound(g.r + 1); else { g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.task("", T.runDone, "done"); api.done({ vaults: g.results.filter((x) => x.verdict === "right").length, rounds: spec.rounds.length }); } }
    if (g.r >= 0 && g.state !== "final") {
      const tot = total(), tg = round().target;
      hud.set("vault", `${g.r + 1}/${spec.rounds.length}`);
      hud.set("loaded", groupDigits(tot, spec.system), { tone: tot === tg ? "mint" : tot > tg ? "amber" : null, bump: true });
      hud.set("time", `${Math.max(0, Math.ceil(round().seconds - g.t))}s`, { meter: 1 - g.t / round().seconds, tone: round().seconds - g.t < 8 ? "amber" : null });
    }
  }
  function drawBlock(ctx: Ctx, d: number, x: number, y: number, sc = 1) {
    const w = blockSize(d) * sc, h = blockH(d) * sc, col = DCOL[d] ?? C.ink;
    ctx.save(); ctx.translate(x, y);
    bloom(ctx, col, 0, 0, w * 0.9, 0.25);
    const dep = Math.min(10, w * 0.18);
    ctx.fillStyle = "rgba(0,0,0,.35)"; roundRect(ctx, -w / 2 + dep, -h / 2 + dep * 0.6, w, h, 5); ctx.fill();
    const gr = ctx.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(20,24,40,.9)");
    ctx.fillStyle = gr; roundRect(ctx, -w / 2, -h / 2, w, h, 5); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = "rgba(10,12,18,.35)"; ctx.lineWidth = 1.5;
    if (d === 10 || d === 10000) for (let k = 1; k < 10; k++) { const xx = -w / 2 + (w * k) / 10; ctx.beginPath(); ctx.moveTo(xx, -h / 2 + 2); ctx.lineTo(xx, h / 2 - 2); ctx.stroke(); }
    if (d === 1000 || d === 100000) for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + (w * k) / 4, -h / 2 + 3); ctx.lineTo(-w / 2 + (w * k) / 4, h / 2 - 3); ctx.moveTo(-w / 2 + 3, -h / 2 + (h * k) / 4); ctx.lineTo(w / 2 - 3, -h / 2 + (h * k) / 4); ctx.stroke(); }
    ctx.restore();
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0A0B11"); gr.addColorStop(1, "#11131C"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "#151925"; roundRect(c, COL_X0 - 16, COL_TOP - 40, COL_X1 - COL_X0 + 32, COL_BOT - COL_TOP + 90, 20); c.fill(); c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "#1A1F2C"; c.fillRect(BELT_X0 - 20, BELT_Y, BELT_X1 - BELT_X0 + 60, 22);
    c.fillStyle = "#0D0F17"; c.fillRect(BELT_X0 - 20, BELT_Y + 22, BELT_X1 - BELT_X0 + 60, 40);
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("vault", paintBg), 0, 0, W, H);
    const fx = api.fx;
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    // belt treads
    ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 3; const off = api.reducedMotion ? 0 : (g.t * 120 * spec.belt) % 28;
    for (let x = BELT_X0 - 20 + off; x < BELT_X1 + 40; x += 28) { ctx.beginPath(); ctx.moveTo(x, BELT_Y + 3); ctx.lineTo(x - 8, BELT_Y + 19); ctx.stroke(); }
    if (g.r >= 0) {
      const ds = [...denoms()].sort((a, b) => b - a), cw = colW();
      ds.forEach((d, i) => {
        const x = COL_X0 + cw * i, cx = x + cw / 2;
        ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 2; roundRect(ctx, x + 6, COL_TOP, cw - 12, COL_BOT - COL_TOP, 12); ctx.stroke();
        api.text(ctx, spec.system === "indian" || d < 10000 ? PLACE[d] : PLACE[d], cx, COL_TOP - 14, { font: "mono", size: 38, weight: 600, color: DCOL[d], align: "center" });
        const n = g.counts[d] ?? 0;
        for (let k = 0; k < Math.min(n, 12); k++) drawBlock(ctx, d, cx, COL_BOT - 14 - k * (blockH(d) + 4) - blockH(d) / 2, 0.9);
        api.text(ctx, String(n), cx, COL_BOT + 44, { font: "display", size: 48, weight: 800, align: "center", color: n >= 10 ? C.amber : C.ink });
      });
    }
    for (const b of g.belt) drawBlock(ctx, b.d, b.x, b.y);
    for (const f of g.fliers) { const fl = f.fly!, k = ease.inOutCubic(clamp(fl.t, 0, 1)), x = lerp(fl.x0, fl.x1, k), y = lerp(fl.y0, fl.y1, k) - Math.sin(k * Math.PI) * 120; drawBlock(ctx, f.d, x, y, 1 - 0.1 * k); }
    for (const m of g.merges) { ctx.save(); ctx.globalAlpha = 1 - m.t / 0.6; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, r = 70 * (1 - m.t / 0.6); drawBlock(ctx, m.d, m.x + Math.cos(a) * r, m.y + Math.sin(a) * r, 0.6); } ctx.restore(); }
    // vault display + seal button + laser
    if (g.r >= 0) {
      const tg = round().target, tot = total(), shownTarget = round().show === "words" && g.state !== "sealed" && g.state !== "end" ? numberWords(tg, spec.system) : groupDigits(tg, spec.system);
      ctx.fillStyle = "rgba(16,19,27,.92)"; roundRect(ctx, 40, 170, 480, 230, 20); ctx.fill(); ctx.strokeStyle = "rgba(139,152,255,.35)"; ctx.lineWidth = 2; ctx.stroke();
      api.text(ctx, T.target, 70, 214, { font: "mono", size: 38, weight: 600, color: C.ink3 });
      const isWords = round().show === "words" && g.state !== "sealed" && g.state !== "end";
      api.text(ctx, shownTarget, 70, isWords ? 268 : 280, { font: isWords ? "ui" : "display", size: isWords ? 40 : 76, weight: 800, maxWidth: 340 });
      api.text(ctx, T.loaded, 70, 340, { font: "mono", size: 38, weight: 600, color: C.ink3 });
      api.text(ctx, groupDigits(tot, spec.system), 250, 344, { font: "display", size: 52, weight: 800, color: tot === tg ? C.mint : tot > tg ? C.amber : C.ink });
      if (g.state === "play") {
        const k = clamp(g.t / round().seconds, 0, 1), ly = 175 + k * 220;
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,150,120,.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(44, ly); ctx.lineTo(516, ly); ctx.stroke(); bloom(ctx, "#FF9A78", 280, ly, 120, 0.25); ctx.restore();
        const ready = tot === tg;
        ctx.save(); ctx.fillStyle = ready ? "rgba(61,220,151,.18)" : "rgba(22,26,36,.95)"; ctx.beginPath(); ctx.arc(SEAL.x, SEAL.y, SEAL.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = ready ? C.mint : C.line2; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = ready ? C.mint : C.ink2; ctx.lineWidth = 5; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + now * (ready ? 1.2 : 0.2); ctx.beginPath(); ctx.moveTo(SEAL.x + Math.cos(a) * 18, SEAL.y + Math.sin(a) * 18); ctx.lineTo(SEAL.x + Math.cos(a) * 36, SEAL.y + Math.sin(a) * 36); ctx.stroke(); }
        ctx.restore();
        api.text(ctx, "SEAL", SEAL.x, SEAL.y + SEAL.r + 38, { font: "mono", size: 38, weight: 600, color: ready ? C.mint : C.ink3, align: "center" });
      }
      if ((g.state === "sealed" || g.state === "end") && g.last) pill(api, ctx, g.last.verdict === "right" ? T.cracked : g.last.total > tg ? `${T.over} ${groupDigits(g.last.total - tg, spec.system)}` : `${T.under} ${groupDigits(tg - g.last.total, spec.system)}`, 280, 440, { color: g.last.verdict === "right" ? C.mint : C.amber });
    }
    fx.drawWorld(ctx);
    ctx.restore();
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${T.round} ${g.r + 1} / ${spec.rounds.length}`, title: round().show === "words" ? "Listen to the number" : groupDigits(round().target, spec.system), sub: round().show === "words" ? numberWords(round().target, spec.system) : round().denoms.includes(1000) ? "load it exactly, then seal" : "no thousands on the belt today", accent: C.sun });
    if (g.state === "end" && g.last) drawStatCard(api, ctx, { a: g.endA, head: g.last.verdict === "right" ? T.cracked : `${T.round} ${g.r + 1}`, color: g.last.verdict === "right" ? C.mint : C.amber, ticked: g.last.verdict === "right", stats: [[groupDigits(round().target, spec.system), T.target], [groupDigits(g.last.total, spec.system), T.loaded]], foot: g.last.detail?.includes("drop-zero") ? "a zero holds the empty place" : undefined });
    if (g.state === "final") drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.results.filter((r) => r.verdict === "right").length}/${spec.rounds.length}`, "vaults"]] });
    drawCoach(api, ctx, T.coach, g.state === "play" ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    if (g.state !== "play" || g.fliers.length || g.merges.length) return { type: "wait", ms: 160 };
    const tg = round().target, tot = total();
    if (tot === tg) return { type: "tap", at: [SEAL.x, SEAL.y], after: 400 };
    if (tot > tg) { const ds = [...denoms()].sort((a, b) => a - b); for (const d of ds) if ((g.counts[d] ?? 0) > 0 && tot - d >= 0) { const cw = colW(), i = [...denoms()].sort((a, b) => b - a).indexOf(d); return { type: "tap", at: [COL_X0 + cw * (i + 0.5), COL_BOT - 60], after: 200 }; } }
    const rest = tg - tot, want = [...denoms()].sort((a, b) => b - a).filter((d) => d <= rest);
    for (const d of want) {
      const cands = g.belt.filter((b) => b.d === d && b.x > BELT_X0 + 30 && b.x < BELT_X1 - 70).sort((a, b) => b.x - a.x);
      if (cands.length) { const b = cands[0]; return { type: "tap", at: [b.x + 120 * spec.belt * 0.09, b.y], after: 420 }; }
    }
    return { type: "wait", ms: 150 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: g.state, round: g.r + 1, target: g.r >= 0 ? round().target : null, total: total(), counts: g.counts, belt: g.belt.length }),
    knob(k) { if (k === "slower" || k === "easier") { g.t = Math.max(0, g.t - 10); return true; } if (k === "again") { g.results = []; startRound(0); return true; } return false; },
    board: () => { const tg = round().target, s = String(tg); return { title: groupDigits(tg, spec.system), lines: [numberWords(tg, spec.system), s.split("").map((ch, i) => `${ch} ${PLACE[10 ** (s.length - 1 - i)] ?? ""}`).join("  ·  ")], figure: { kind: "none" }, accent: C.sun }; },
  };
}
export const vault: EngineDef<VaultSpec> = { archetype: "vault-heist@1", label: "Game · Vault Heist", accent: C.sun, create };
