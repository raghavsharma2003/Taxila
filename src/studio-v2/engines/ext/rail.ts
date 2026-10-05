// STORY RAIL — `story-rail@1` (VALUES-100 V3.1: prose, cause chains, processes). The train never stops. Each step a
// signal gantry slides in with 2-3 destination boards (the next event / an effect / a speaker); the spur tracks under
// them scroll in with a coloured wagon each. The child throws the switch (taps a board, or 1-3) before the train
// reaches the points; the pick is the act and the host grades it from the spec. The chosen board's words become the
// wagon on the train. A wrong wagon couples, glows amber and is shunted off while the right one rolls across (the truth,
// every time). Adaptive: a slip slows the line 12%, a streak of 3 speeds it 6% (0.6-1.5×). Reduced motion: no shake or
// steam; same game.
import { railSteps, type RailRoundT, type RailSpec } from "../../../../shared/studio-spec-ext/rail.ts";
import type { Glyph } from "../../../../shared/studio-spec-ext/scene.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, ease, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { taskPill, RoundFlow, SUBJECT_ACCENT, devaReady, shuffled, textBlock, voltBox, wrap } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const LOCO_X = 520, FRONT = 130, MAIN_Y = 500, CARD_W = 410, CARD_H = 108, BOARD_X = 640, BOARD_W = 340, BOARD_H = 116;
const LANE_COL = [C.ion, C.sci, C.amber];
const LANES: Record<number, number[]> = { 2: [350, MAIN_Y], 3: [300, 400, MAIN_Y] };
const BOARD_Y: Record<number, number[]> = { 2: [214, 356], 3: [168, 294, 420] };
const T_READ = 6.2, COUPLE = 300, MERGE0 = 470, MERGE1 = 690, NEXT = 720;
interface Item { id: string; text: string; glyph?: Glyph; station?: boolean }
interface Step { head: string | null; key: string; lanes: string[]; sw: number; choice: number; locked: boolean; picked: string | null; verdict: string; coupledAt: number; fixT: number; inT: number; choseAt: number }

function create(api: EngineApi, spec: RailSpec): EngineInstance {
  const T = spec.strings, accent = SUBJECT_ACCENT[(spec.skills[0] ?? "").split("-")[1]] ?? C.ion;
  const devaNeeded = /[ऀ-ॿ]/.test(JSON.stringify(spec));
  let fontOk = !devaNeeded; if (devaNeeded) void devaReady().then(() => { fontOk = true; });
  const g = { s: 0, v: 132, speedK: 1, steps: [] as Step[], i: 0, items: new Map<string, Item>(), right: 0, n: 0, streak: 0, best: 0, coachA: 1, coachGone: false, locoY: MAIN_Y, wheel: 0, steamT: 0, roundRes: [] as string[] };
  const botR = rng(api.seed * 41 + 3);
  const task = taskPill(api);
  const hud = api.hud([{ key: "round", label: T.round }, { key: "picked", label: T.picked }, { key: "streak", label: T.streak }]);
  const rd = (): RailRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      g.items.clear();
      if (r.mode === "sequence") for (const c of r.cards) g.items.set(c.id, c);
      else if (r.mode === "cause") for (const p of r.pairs) { g.items.set(p.cause.id, p.cause); g.items.set(p.effect.id, p.effect); }
      else { for (const l of r.lines) g.items.set(l.id, { id: l.id, text: l.text }); for (const s of r.speakers) g.items.set(s.id, { id: s.id, text: s.name, glyph: s.glyph, station: true }); }
      g.speedK = r.speed; g.roundRes = [];
      g.steps = railSteps(r).map((x, i) => ({ head: x.head, key: x.key, lanes: shuffled(x.options, api.seed * 13 + k * 31 + i), sw: 0, choice: -1, locked: false, picked: null, verdict: "", coupledAt: -1, fixT: 0, inT: 0, choseAt: -1 }));
      g.i = 0; g.s = 0; if (g.steps[0]) g.steps[0].sw = FRONT + 900;
      api.event("round_start", { round: k + 1, mode: r.mode, steps: g.steps.length, targets: r.targets ?? null });
      sfx.blip({ f: 196, f2: 392, dur: 0.35, type: "triangle", gain: 0.12 });
    },
    onEnd(k) { api.event("round_end", { round: k + 1, right: g.roundRes.filter((v) => v === "right").length, of: g.roundRes.length }); },
    onFinal() { task("", T.runDone, "done"); api.done({ right: g.right, picks: g.n, bestStreak: g.best }); },
  });
  const prompt = () => (rd().mode === "sequence" ? T.next : rd().mode === "cause" ? T.effect : T.who);
  const step = () => g.steps[g.i];
  const nL = (st: Step) => Math.min(3, Math.max(2, st.lanes.length));
  const sx = (wx: number) => wx - g.s + LOCO_X;
  const front = () => g.s + FRONT;
  function choose(lane: number) {
    const st = step(); if (!st || st.locked || flow.state !== "play" || lane >= st.lanes.length) return;
    if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); }
    if (st.choice !== lane) { st.choice = lane; st.choseAt = api.now(); sfx.blip({ f: 520, f2: 380, dur: 0.07, type: "square", gain: 0.06 }); api.record("switch", { step: g.i, lane, at: +api.now().toFixed(2) }); }
  }
  api.onPointer({
    down(p) {
      const st = step(); if (!st || flow.state !== "play" || st.locked) return;
      BOARD_Y[nL(st)].forEach((y, li) => { if (p.x >= BOARD_X - 20 && p.x <= BOARD_X + BOARD_W + 20 && p.y >= y - 16 && p.y <= y + BOARD_H + 16) choose(li); });
    },
  });
  api.onKey((k, down) => { if (down && /^[1-3]$/.test(k)) choose(+k - 1); });
  function lock(st: Step) {
    st.locked = true;
    const made = st.choice >= 0;
    const lane = made ? st.choice : st.lanes.indexOf(st.key) === 0 ? 1 : 0;   // no pick: the points stay put, never on the key by luck
    st.choice = lane; st.picked = st.lanes[lane];
    const grade = api.answer(`r${flow.round + 1}:${g.i}`, made ? st.picked : null, made && st.picked === st.key ? "right" : "wrong");
    st.verdict = grade.verdict; g.n++; g.roundRes.push(grade.verdict);
    if (grade.verdict === "right") { g.right++; g.streak++; g.best = Math.max(g.best, g.streak); if (g.streak % 3 === 0) { g.speedK = Math.min(1.5, g.speedK * 1.06); api.event("adapt", { speed: +g.speedK.toFixed(2), why: "streak" }); } }
    else { g.streak = 0; g.speedK = Math.max(0.6, g.speedK * 0.88); api.event("adapt", { speed: +g.speedK.toFixed(2), why: "slip" }); }
    api.facts({ round: flow.round + 1, step: g.i + 1, picked: g.items.get(st.picked)?.text ?? st.picked, verdict: grade.verdict, right: g.right, of: g.n });
  }
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "boot") return;
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const st0 = step(), surge = flow.state === "play" && st0 && !st0.locked && st0.choice >= 0 && api.now() - st0.choseAt > 0.6 ? 2.6 : 1;   // a decided pick surges the train to the points
    const v = g.v * g.speedK * (flow.state === "play" ? surge : 0.5);
    g.s += v * dt; g.wheel += (v * dt) / 18;
    if (!api.reducedMotion) { g.steamT -= dt; if (g.steamT <= 0) { g.steamT = 0.15; api.fx.burst(LOCO_X + 60, g.locoY - 104, { n: 2, color: "#8A94AC", speed: 40, life: 1.2, size: 15, angle: -Math.PI / 2 - 0.6, spread: 0.5, drag: 0.6, gravity: -30 }); } }
    const st = step();
    if (flow.state === "play" && st) {
      st.inT += dt;
      task(`${T.round} ${flow.round + 1}`, prompt());
      if (!st.locked && front() >= st.sw) lock(st);
      const ly = LANES[nL(st)][Math.max(0, st.choice)];
      const up = ease.inOutSine(clamp((front() - st.sw) / 220, 0, 1)), down = ease.inOutSine(clamp((front() - (st.sw + MERGE0)) / (MERGE1 - MERGE0), 0, 1));
      g.locoY = st.locked ? lerp(lerp(MAIN_Y, ly, up), MAIN_Y, down) : MAIN_Y;
      if (st.locked && st.coupledAt < 0 && front() >= st.sw + COUPLE) {
        st.coupledAt = api.now();
        if (st.verdict === "right") { api.hitstop(60); api.fx.burst(LOCO_X - 30, g.locoY - 60, { n: 26, color: C.mint, speed: 380, life: 0.6, size: 10 }); api.fx.ring(LOCO_X - 30, g.locoY - 60, { color: C.mint, r0: 10, r1: 110, life: 0.5 }); sfx.blip({ f: 523 * Math.pow(1.06, Math.min(8, g.streak)), f2: 1046, dur: 0.18, type: "triangle", gain: 0.18 }); api.fx.shake(3, 0.15); }
        else { api.hitstop(40); sfx.noise({ dur: 0.12, f: 900, filter: "bandpass", gain: 0.2 }); sfx.blip({ f: 220, f2: 140, dur: 0.22, gain: 0.16 }); api.fx.shake(5, 0.22); }
      }
      if (st.coupledAt >= 0 && st.verdict !== "right") st.fixT = clamp((api.now() - st.coupledAt - 0.5) / 0.9, 0, 1);
      if (st.locked && front() >= st.sw + NEXT) {
        if (g.i + 1 < g.steps.length) { g.i++; g.steps[g.i].sw = front() + g.v * g.speedK * T_READ; }
        else flow.endRound();
      }
    }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`);
    hud.set("picked", `${g.right}/${g.n}`, { bump: true });
    hud.set("streak", String(g.streak), { tone: g.streak >= 3 ? "mint" : null });
  }
  // ── drawing
  function paintSky(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0B1020"); gr.addColorStop(0.62, "#141B30"); gr.addColorStop(1, "#090B12");
    c.fillStyle = gr; c.fillRect(0, 0, W, H); c.fillStyle = hexA(accent, 0.05); c.fillRect(0, 0, W, H);
    const r = rng(7); for (let i = 0; i < 70; i++) { c.globalAlpha = 0.15 + r() * 0.4; c.fillStyle = "#C9D2F2"; c.fillRect(r() * W, r() * 300, 1.5, 1.5); }
    c.globalAlpha = 1;
  }
  function hills(ctx: Ctx, k: number, base: number, amp: number, col: string, seed: number) {
    const off = g.s * k;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) { const u = (x + off) / 260; ctx.lineTo(x, base - amp * (0.55 + 0.45 * Math.sin(u * 1.7 + seed) * Math.cos(u * 0.63 + seed * 2))); }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function rails(ctx: Ctx, pts: (u: number) => [number, number], col = "rgba(190,200,225,.5)", steps = 40) {
    ctx.save(); ctx.strokeStyle = "rgba(120,100,80,.32)"; ctx.lineWidth = 6;
    for (let i = 0; i <= steps; i++) { const [x, y] = pts(i / steps); if (x < -30 || x > W + 30) continue; ctx.beginPath(); ctx.moveTo(x - 4, y - 10); ctx.lineTo(x + 4, y + 10); ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    for (const off of [-7, 7]) { ctx.beginPath(); for (let i = 0; i <= steps; i++) { const [x, y] = pts(i / steps); if (i === 0) ctx.moveTo(x, y + off); else ctx.lineTo(x, y + off); } ctx.stroke(); }
    ctx.restore();
  }
  function card(ctx: Ctx, x: number, y: number, w: number, h: number, it: Item | undefined, o: { edge?: string; a?: number; glow?: number; num?: number; wheels?: boolean; fill?: string } = {}) {
    if (!it) return;
    const a = o.a ?? 1, edge = o.edge ?? hexA(accent, 0.9);
    ctx.save(); ctx.globalAlpha *= a;
    if (o.wheels) { ctx.fillStyle = "#1A1F2C"; roundRect(ctx, x + 18, y + h - 4, w - 36, 16, 6); ctx.fill(); for (const wx of [x + 60, x + w - 60]) { ctx.fillStyle = "#2A3142"; ctx.beginPath(); ctx.arc(wx, y + h + 14, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.ink3; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, y + h + 14); ctx.lineTo(wx + Math.cos(g.wheel) * 12, y + h + 14 + Math.sin(g.wheel) * 12); ctx.stroke(); } }
    if (o.glow) bloom(ctx, edge, x + w / 2, y + h / 2, w * 0.7, 0.35 * o.glow);
    ctx.fillStyle = o.fill ?? "rgba(22,26,38,.97)"; roundRect(ctx, x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = o.edge ? 4 : 3; ctx.stroke();
    ctx.restore();
    let lx = x;
    if (o.num !== undefined) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = LANE_COL[o.num]; roundRect(ctx, x + 8, y + 8, 40, h - 16, 10); ctx.fill(); ctx.restore(); api.text(ctx, String(o.num + 1), x + 28, y + h / 2 + 2, { font: "display", size: 38, weight: 800, color: "#0A0C12", align: "center", baseline: "middle", alpha: a }); lx = x + 48; }
    const gl = o.num === undefined ? it.glyph : undefined, iw = gl ? 58 : 0;
    if (gl) drawGlyph(ctx, gl, lx + 36, y + h / 2, 50, C.ink, hexA(accent, 0.3), a);
    const tx = lx + iw + (x + w - lx - iw) / 2, tw = x + w - lx - iw - 22, to = { size: it.station ? 44 : 38, weight: 700, alpha: a, font: (it.station ? "display" : "ui") as "display" | "ui" };
    const three = wrap(api, ctx, it.text, tw, to, 3).length > 2 && h >= 112;
    textBlock(api, ctx, it.text, tx, y + h / 2, tw, to, three ? 3 : 2, three ? 0.98 : 1.1);
  }
  function boxcar(ctx: Ctx, x: number, y: number, col: string, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = "#1C2230"; roundRect(ctx, x, y - 62, 120, 54, 8); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = hexA(col, 0.35); ctx.fillRect(x + 10, y - 52, 100, 10);
    for (const wx of [x + 26, x + 94]) { ctx.fillStyle = "#2A3142"; ctx.beginPath(); ctx.arc(wx, y - 6, 11, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function loco(ctx: Ctx, x: number, y: number) {
    ctx.save();
    bloom(ctx, "#FFE8B0", x + 150, y - 45, 120, 0.25);
    ctx.fillStyle = "rgba(255,232,176,.07)"; ctx.beginPath(); ctx.moveTo(x + 124, y - 52); ctx.lineTo(x + 380, y - 104); ctx.lineTo(x + 380, y + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1E2433"; roundRect(ctx, x - 70, y - 96, 90, 80, 10); ctx.fill(); ctx.strokeStyle = hexA(accent, 0.9); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = hexA(C.sun, 0.55); roundRect(ctx, x - 56, y - 84, 36, 28, 5); ctx.fill();
    ctx.fillStyle = "#262E40"; roundRect(ctx, x + 10, y - 74, 116, 58, 24); ctx.fill(); ctx.strokeStyle = hexA(accent, 0.9); ctx.stroke();
    ctx.fillStyle = "#30394E"; ctx.fillRect(x + 50, y - 104, 20, 32); ctx.fillStyle = accent; ctx.fillRect(x + 46, y - 108, 28, 8);
    ctx.fillStyle = "#FFE8B0"; ctx.beginPath(); ctx.arc(x + 124, y - 46, 8, 0, Math.PI * 2); ctx.fill();
    for (const wx of [x - 44, x + 4, x + 60, x + 104]) { ctx.fillStyle = "#2A3142"; ctx.beginPath(); ctx.arc(wx, y - 6, wx === x - 44 ? 20 : 15, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, y - 6); ctx.lineTo(wx + Math.cos(g.wheel) * 13, y - 6 + Math.sin(g.wheel) * 13); ctx.stroke(); }
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("sky", paintSky), 0, 0, W, H);
    if (!fontOk) return;
    hills(ctx, 0.08, 330, 70, "#121828", 1); hills(ctx, 0.2, 410, 60, "#0F1422", 2);
    ctx.fillStyle = "#0B0E16"; ctx.fillRect(0, MAIN_Y + 16, W, H - MAIN_Y);
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    const st = step(), n = st ? nL(st) : 3;
    rails(ctx, (u) => [lerp(-20, W + 20, u), MAIN_Y], undefined, 26);
    if (st && flow.state !== "boot") {
      const ys = LANES[n];
      ys.forEach((y, li) => {
        const sel = st.choice === li, col = sel ? hexA(C.volt, 0.85) : hexA(LANE_COL[li], 0.55);
        if (y !== MAIN_Y) rails(ctx, (u) => [lerp(sx(st.sw), sx(st.sw + 220), u), lerp(MAIN_Y, y, ease.inOutSine(u))], col, 12);
        rails(ctx, (u) => [lerp(sx(st.sw + (y === MAIN_Y ? 0 : 220)), sx(st.sw + MERGE0), u), y], y === MAIN_Y && !sel ? undefined : col, 24);
        if (y !== MAIN_Y) rails(ctx, (u) => [lerp(sx(st.sw + MERGE0), sx(st.sw + MERGE1), u), lerp(y, MAIN_Y, ease.inOutSine(u))], col, 12);
        const bx = sx(st.sw + COUPLE);
        if (!(st.coupledAt >= 0 && li === st.choice)) boxcar(ctx, bx, y, LANE_COL[li], st.coupledAt >= 0 ? clamp(1 - (api.now() - st.coupledAt), 0.3, 1) : 1);
      });
      // points lever + countdown at the switch
      const lx = sx(st.sw);
      if (lx > -40 && lx < W + 40) { ctx.save(); ctx.strokeStyle = st.locked ? C.ink3 : C.volt; ctx.lineWidth = 6; ctx.lineCap = "round"; const ang = st.choice < 0 ? 0 : (st.choice - (n - 1) / 2) * 0.5; ctx.beginPath(); ctx.moveTo(lx, MAIN_Y + 34); ctx.lineTo(lx + Math.sin(ang) * 40, MAIN_Y + 34 - Math.cos(ang) * 40); ctx.stroke(); ctx.restore(); }
      // the signal gantry: destination boards (screen-fixed while the step is open)
      const inK = ease.outCubic(clamp(st.inT / 0.45, 0, 1)), outK = st.locked ? ease.inCubic(clamp((front() - st.sw) / 160, 0, 1)) : 0;
      if (outK < 1 && flow.state === "play") {
        const k = clamp(st.locked ? 1 - outK : inK, 0, 1);
        BOARD_Y[n].forEach((y, li) => {
          const id = st.lanes[li], it = g.items.get(id), x = BOARD_X + (1 - k) * 360;
          const edge = st.choice === li ? C.volt : hexA(LANE_COL[li], 0.85);
          card(ctx, x, y, BOARD_W, BOARD_H, it, { edge, a: k, glow: st.choice === li ? 0.7 : 0, num: li });
          if (!st.locked) { if (st.choice === li) voltBox(ctx, x, y, BOARD_W, BOARD_H, now, 16); }
        });
        if (!st.locked) { const kk = clamp((front() - (st.sw - g.v * g.speedK * T_READ)) / (g.v * g.speedK * T_READ), 0, 1); ctx.save(); ctx.fillStyle = kk > 0.75 ? C.amber : "rgba(255,255,255,.35)"; roundRect(ctx, BOARD_X, BOARD_Y[n][n - 1] + BOARD_H + 14, BOARD_W * (1 - kk), 6, 3); ctx.fill(); ctx.restore(); }
      }
    }
    // the train: the head wagon (context, or the newly coupled pick) + loco
    if (st) {
      const coupled = st.coupledAt >= 0, wx = LOCO_X - CARD_W - 76, wy = g.locoY - CARD_H - 30;
      const mode = rd().mode;
      if (coupled && st.verdict !== "right" && st.fixT < 1 && mode !== "who") {
        const k = ease.inCubic(st.fixT); card(ctx, wx - k * 120, wy + k * 170, CARD_W, CARD_H, g.items.get(st.picked ?? ""), { edge: C.amber, a: 1 - k, wheels: true });
        if (st.fixT < 0.45) magnifier(ctx, wx + CARD_W - 16, wy - 8, C.amber, 0.9);
        const kr = ease.inOutCubic(st.fixT); card(ctx, lerp(sx(st.sw + COUPLE), wx, kr), lerp(LANES[n][st.lanes.indexOf(st.key)] - CARD_H - 30, wy, kr), CARD_W, CARD_H, g.items.get(st.key), { edge: C.mint, a: kr, glow: 1 - kr, wheels: true });
      } else {
        const headId = mode === "who" ? st.head : coupled ? st.key : st.head;
        const it = headId ? g.items.get(headId) : undefined;
        const fresh = coupled && api.now() - st.coupledAt < 1.2;
        card(ctx, wx, wy, CARD_W, CARD_H, it, { edge: fresh ? (st.verdict === "right" ? C.mint : C.amber) : undefined, wheels: true });
        if (fresh && st.verdict === "right") tick(ctx, wx + CARD_W - 16, wy - 4, C.mint, 0.9);
        if (mode === "who" && coupled) {                                 // delivered: the true speaker's name rides on the wagon
          const who = g.items.get(st.key); const k = clamp((api.now() - st.coupledAt) * 2, 0, 1);
          if (who) { ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = "rgba(10,12,18,.92)"; roundRect(ctx, wx + 20, wy - 66, CARD_W - 40, 56, 12); ctx.fill(); ctx.strokeStyle = st.verdict === "right" ? C.mint : C.amber; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, `— ${who.text}`, wx + CARD_W / 2, wy - 38, { size: 38, weight: 700, color: st.verdict === "right" ? C.mint : C.amber, align: "center", baseline: "middle", alpha: k, maxWidth: CARD_W - 50 }); if (st.verdict !== "right") magnifier(ctx, wx + CARD_W - 16, wy - 8, C.amber, 0.9); }
        }
      }
      ctx.save(); ctx.fillStyle = C.ink3; ctx.fillRect(LOCO_X - 76, g.locoY - 30, 8, 6); ctx.restore();
      loco(ctx, LOCO_X, g.locoY);
    }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: rd().title, sub: rd().sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.roundRes.filter((v) => v === "right").length}/${g.roundRes.length}`, T.picked], [String(g.best), T.streak]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.picked], [String(g.best), T.streak]] });
    drawCoach(api, ctx, T.coach, flow.state === "play" ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    const st = step();
    if (flow.state !== "play" || !st || st.locked || st.choice >= 0 || st.inT < 1.6) return { type: "wait", ms: 250 };
    const li = botR() < 0.85 ? st.lanes.indexOf(st.key) : Math.floor(botR() * st.lanes.length);
    return { type: "tap", at: [BOARD_X + BOARD_W / 2, BOARD_Y[nL(st)][li] + BOARD_H / 2], after: 300 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, step: g.i, key: step()?.key ?? null, lanes: step()?.lanes ?? [], choice: step()?.choice ?? -1, right: g.right, n: g.n, speed: +g.speedK.toFixed(2) }),
    knob(k) {
      if (k === "slower" || k === "easier") { g.speedK = Math.max(0.6, g.speedK * 0.8); return true; }
      if (k === "faster" || k === "harder") { g.speedK = Math.min(1.5, g.speedK * 1.15); return true; }
      if (k === "again") { g.right = 0; g.n = 0; g.streak = 0; flow.startRound(0); return true; }
      return false;
    },
    board: () => {
      const r = spec.rounds[0];
      const items = r.mode === "sequence" ? r.cards.map((c) => c.text) : r.mode === "cause" ? r.pairs.map((p) => `${p.cause.text} → ${p.effect.text}`) : r.lines.map((l) => `${l.text} — ${r.speakers.find((s) => s.id === l.speaker)?.name ?? ""}`);
      return { title: spec.title, lines: items.slice(0, 4).map((s, i) => `${i + 1}. ${s}`), figure: { kind: "none" }, accent };
    },
  };
}
export const rail: EngineDef<RailSpec> = { archetype: "story-rail@1", label: "Game · Story Rail", accent: "#FF8FB1", create };
