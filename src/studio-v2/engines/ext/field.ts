// MAGNET FIELD LAB — `field-lab@1` (VALUES-100 V3.1: magnet poles and finding directions). The car's motion, the
// probe's push or pull and the needle's swing all come from the pole rule the host grades with:
//   poles   — tap a slot to stand a magnet (tap again to flip it, again to clear); RELEASE and the car rolls
//   label   — drag your magnet's N pole to each end of the mystery magnet; it pushes or pulls; then tap its N end
//   compass — drag the stray magnet away until the needle settles; the map is turned, so read north from the needle and
//             tap the place in the asked direction
import { carForce, compassKey, polesOk, type FieldSpec, type FlRoundT, type Slot } from "../../../../shared/studio-spec-ext/field.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill, textBlock } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const BTN = { x: 800, y: 520, w: 170, h: 66 };
const SLOTL = { x: 130, y: 380, w: 170, h: 60 }, SLOTR = { x: 590, y: 380, w: 170, h: 60 };
const MYS = { x: 300, y: 330, w: 300, h: 70 };
const MAP = { x: 430, y: 395, s: 62 };
const NCOL = "#FF5A6E", SCOL = "#5FA8FF";
const D2R = Math.PI / 180;
function create(api: EngineApi, spec: FieldSpec): EngineInstance {
  const T = spec.strings, accent = NCOL;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 199 + 37), setTask = taskPill(api);
  const g = { slotL: "" as Slot, slotR: "" as Slot, running: false, runT: 0, carX: 445, carV: 0, probe: [180, 520] as [number, number], dragProbe: false, probes: [] as string[], react: "", reactT: 0, mag: [0, 0] as [number, number], dragMag: false, needle: 0, needleV: 0, away: false, answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, slip: false };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): FlRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      Object.assign(g, { slotL: "", slotR: "", running: false, runT: 0, carX: 445, carV: 0, probe: [180, 540], dragProbe: false, probes: [], react: "", reactT: 0, mag: [MAP.x + 70, MAP.y - 55], dragMag: false, needle: 0, needleV: 0, away: r.mode === "compass" ? !r.disturb : false, answered: false, verdict: "", detail: "", revealT: 0, slip: botR() < 0.12 });
      if (r.mode === "compass" && !r.disturb) g.mag = [-999, -999];
      setTask(`${T.round} ${k + 1}`, r.mode === "poles" ? T[r.goal === "left" ? "toLeft" : r.goal === "right" ? "toRight" : "middle"] : r.mode === "label" ? T.probe : r.sub || r.title);
      api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
    },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  function judge(value: unknown, local: "right" | "wrong") {
    const grade = api.answer(`r${flow.round + 1}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.detail = grade.detail ?? ""; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(40); } else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, verdict: grade.verdict, detail: g.detail });
  }
  const inB = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  const cyc = (s: Slot): Slot => (s === "" ? "NS" : s === "NS" ? "SN" : "");
  const placeXY = (r: Extract<FlRoundT, { mode: "compass" }>, i: number): [number, number] => { const p = r.places[i], a = r.turn * D2R; const x = p.x * Math.cos(a) - p.y * Math.sin(a), y = p.x * Math.sin(a) + p.y * Math.cos(a); return [MAP.x + x * MAP.s, MAP.y + y * MAP.s]; };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered || g.running) return;
      const r = rd();
      if (r.mode === "poles") {
        if (inB(p, BTN) && (g.slotL || g.slotR)) { g.running = true; g.runT = 0; api.record("release", { left: g.slotL, right: g.slotR }); return; }
        if (inB(p, SLOTL)) { g.slotL = cyc(g.slotL); sfx.blip({ f: 500, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("slot", { side: "left", m: g.slotL }); }
        if (inB(p, SLOTR)) { g.slotR = cyc(g.slotR); sfx.blip({ f: 560, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("slot", { side: "right", m: g.slotR }); }
        return;
      }
      if (r.mode === "label") {
        if (g.probes.length && p.y > MYS.y && p.y < MYS.y + MYS.h && ((p.x > MYS.x && p.x < MYS.x + 70) || (p.x > MYS.x + MYS.w - 70 && p.x < MYS.x + MYS.w))) { if (p.x < MYS.x + MYS.w / 2) judge({ n: "left", probes: g.probes }, r.hidden === "NS" ? "right" : "wrong"); else judge({ n: "right", probes: g.probes }, r.hidden === "SN" ? "right" : "wrong"); return; }
        if (Math.hypot(p.x - g.probe[0], p.y - g.probe[1]) < 80) g.dragProbe = true;
        return;
      }
      if (Math.hypot(p.x - g.mag[0], p.y - g.mag[1]) < 60) { g.dragMag = true; return; }
      r.places.forEach((_, i) => { const [x, y] = placeXY(r, i); if (Math.hypot(p.x - x, p.y - y) < 50) judge({ place: i, away: g.away }, i === compassKey(r) && (g.away || !r.disturb) ? "right" : "wrong"); });
    },
    move(p) {
      const r = rd();
      if (g.dragProbe && r.mode === "label") { g.probe = [clamp(p.x, 120, 760), clamp(p.y, 180, 600)]; const near = Math.hypot(p.x + 70 - MYS.x, p.y - (MYS.y + MYS.h / 2)) < 60 ? "left" : Math.hypot(p.x - 70 - (MYS.x + MYS.w), p.y - (MYS.y + MYS.h / 2)) < 60 ? "right" : ""; if (near && g.reactT <= 0) { const endPole = near === "left" ? r.hidden[0] : r.hidden[1]; g.react = endPole === "N" ? T.push : T.pull; g.reactT = 1.2; g.probes.push(near); api.record("probe", { end: near, saw: g.react }); sfx.blip({ f: endPole === "N" ? 300 : 700, dur: 0.12, type: "triangle", gain: 0.1 }); } }
      if (g.dragMag && r.mode === "compass") { g.mag = [clamp(p.x, 120, 760), clamp(p.y, 180, 600)]; }
    },
    up() { if (g.dragMag) { g.dragMag = false; const r = rd(); if (r.mode === "compass" && Math.hypot(g.mag[0] - MAP.x, g.mag[1] - MAP.y) > 170) g.away = true; api.record("magnet", { away: g.away }); } g.dragProbe = false; },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const r = rd(); if (!r) return;
    g.reactT = Math.max(0, g.reactT - dt);
    if (r.mode === "poles" && g.running && !g.answered) {
      g.runT += dt; const f = carForce(r.car, g.slotL, g.slotR), dl = Math.max(30, g.carX - 80 - (SLOTL.x + SLOTL.w)), dr = Math.max(30, SLOTR.x - (g.carX + 80));
      const acc = (f.l ? f.l * 9e5 / (dl * dl) : 0) + (f.r ? f.r * 9e5 / (dr * dr) : 0) - g.carV * 1.8; g.carV += acc * dt; g.carX = clamp(g.carX + g.carV * dt, SLOTL.x + SLOTL.w + 82, SLOTR.x - 82);
      if (g.carX <= SLOTL.x + SLOTL.w + 82 || g.carX >= SLOTR.x - 82) g.carV = 0;
      if (g.runT > 2.6) judge({ left: g.slotL, right: g.slotR }, polesOk(r.goal, r.car, g.slotL, g.slotR) ? "right" : "wrong");
    }
    if (r.mode === "compass") {
      const north = -90 + r.turn; let target = north; // screen angle of true north on the turned map
      const dm = Math.hypot(g.mag[0] - MAP.x, g.mag[1] - MAP.y); if (dm < 170) { const toward = (Math.atan2(g.mag[1] - MAP.y, g.mag[0] - MAP.x) * 180) / Math.PI; const w = clamp((170 - dm) / 120, 0, 1); const d = ((toward - north + 540) % 360) - 180; target = north + d * w; }
      const err = ((target - g.needle + 540) % 360) - 180; g.needleV += (err * 40 - g.needleV * 6) * dt; g.needle += g.needleV * dt;
    }
    if (g.answered) { g.revealT += dt; if (g.revealT > 3) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 199, 0); }
  function barMagnet(ctx: Ctx, x: number, y: number, w: number, h: number, poles: string, label = true) {
    ctx.save(); ctx.fillStyle = poles[0] === "N" ? NCOL : poles[0] === "S" ? SCOL : "#7A8094"; roundRect(ctx, x, y, w / 2, h, 10); ctx.fill(); ctx.fillStyle = poles[1] === "N" ? NCOL : poles[1] === "S" ? SCOL : "#7A8094"; roundRect(ctx, x + w / 2, y, w / 2, h, 10); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 2; roundRect(ctx, x, y, w, h, 10); ctx.stroke(); ctx.restore();
    if (label) { api.text(ctx, poles[0], x + w / 4, y + h / 2 + 2, { font: "display", size: 38, weight: 800, color: "#0B0E14", align: "center", baseline: "middle" }); api.text(ctx, poles[1], x + (3 * w) / 4, y + h / 2 + 2, { font: "display", size: 38, weight: 800, color: "#0B0E14", align: "center", baseline: "middle" }); }
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "poles") {
      ctx.save(); ctx.fillStyle = "#2A3142"; ctx.fillRect(120, 470, 660, 16); ctx.restore();
      for (const [b, s, lab] of [[SLOTL, g.slotL, T.left], [SLOTR, g.slotR, T.right]] as [typeof SLOTL, Slot, string][]) { if (s) barMagnet(ctx, b.x, b.y, b.w, b.h, s); else { ctx.save(); ctx.strokeStyle = hexA(C.volt, 0.6 + 0.3 * Math.sin(now * 4)); ctx.setLineDash([8, 6]); ctx.lineWidth = 3; roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke(); ctx.restore(); api.text(ctx, T.empty, b.x + b.w / 2, b.y + b.h / 2 + 2, { size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle" }); } api.text(ctx, lab, b.x + b.w / 2, b.y - 30, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" }); }
      barMagnet(ctx, g.carX - 80, 400, 160, 56, r.car); ctx.save(); ctx.fillStyle = "#0B0E14"; for (const dx of [-50, 50]) { ctx.beginPath(); ctx.arc(g.carX + dx, 466, 12, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
      if (g.running) { const f = carForce(r.car, g.slotL, g.slotR); for (const [v, x] of [[f.l, SLOTL.x + SLOTL.w + 20], [f.r, SLOTR.x - 20]] as [number, number][]) if (v) { pill(api, ctx, (x < g.carX ? v === 1 : v === -1) ? T.push : T.pull, x + (x < g.carX ? 40 : -40), 330, { color: (x < g.carX ? v === 1 : v === -1) ? C.amber : C.ion, size: 38 }); } }
      if (done) pill(api, ctx, g.detail, 450, 560, { color: ok ? C.mint : C.amber, size: 38 });
      ctx.save(); ctx.fillStyle = !done && !g.running && (g.slotL || g.slotR) ? "rgba(203,255,77,.14)" : "rgba(22,26,36,.95)"; roundRect(ctx, BTN.x, BTN.y, BTN.w, BTN.h, 16); ctx.fill(); ctx.strokeStyle = !done && (g.slotL || g.slotR) ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, T.run, BTN.x + BTN.w / 2, BTN.y + BTN.h / 2 + 2, { size: 38, weight: 800, color: !done && (g.slotL || g.slotR) ? C.volt : C.ink3, align: "center", baseline: "middle", maxWidth: BTN.w - 12 });
    } else if (r.mode === "label") {
      const shake = g.reactT > 0 ? Math.sin(now * 50) * 4 * g.reactT : 0;
      barMagnet(ctx, MYS.x + shake, MYS.y, MYS.w, MYS.h, done ? r.hidden : "??", true);
      if (!done && g.probes.length) textBlock(api, ctx, T.tapN, 450, 250, 520, { size: 38, weight: 600, color: C.ink2 }, 1);
      const faceRight = g.probe[0] < MYS.x + MYS.w / 2; ctx.save(); ctx.translate(g.probe[0], g.probe[1]); barMagnet(ctx, -70, -26, 140, 52, faceRight ? "SN" : "NS"); ctx.restore(); bloom(ctx, NCOL, g.probe[0] + (faceRight ? 35 : -35), g.probe[1], 40, g.dragProbe ? 0.4 : 0.15);
      if (g.reactT > 0) pill(api, ctx, g.react, 450, 470, { color: g.react === T.push ? C.amber : C.ion, size: 40 });
      api.text(ctx, `${g.probes.length}`, 885, 260, { font: "display", size: 56, weight: 800, color: C.ink, align: "center", baseline: "middle" }); api.text(ctx, T.tests, 885, 312, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
      if (done) pill(api, ctx, ok ? "N ✓" : "N ✗", 450, 470, { color: ok ? C.mint : C.amber, size: 40 });
    } else {
      ctx.save(); ctx.fillStyle = "#1E3324"; ctx.beginPath(); ctx.arc(MAP.x, MAP.y, 215, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      r.places.forEach((pl, i) => { const [x, y] = placeXY(r, i), hot = done && i === compassKey(r); bloom(ctx, hot ? C.mint : accent, x, y, 40, hot ? 0.5 : 0.15); drawGlyph(ctx, pl.glyph, x, y - 6, 44, C.ink, hexA(accent, 0.3)); api.text(ctx, pl.label, clamp(x, 220, 640), y + 34, { size: 38, weight: 700, color: C.ink, align: "center", baseline: "middle", maxWidth: 200 }); });
      ctx.save(); ctx.fillStyle = "#E8ECF5"; ctx.beginPath(); ctx.arc(MAP.x, MAP.y, 38, 0, Math.PI * 2); ctx.fill(); ctx.translate(MAP.x, MAP.y); ctx.rotate((g.needle + 90) * D2R); ctx.fillStyle = NCOL; ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.fill(); ctx.fillStyle = SCOL; ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.fill(); ctx.restore();
      if (g.mag[0] > 0) { ctx.save(); ctx.translate(g.mag[0], g.mag[1]); barMagnet(ctx, -60, -22, 120, 44, "NS"); ctx.restore(); if (!g.away) textBlock(api, ctx, T.moveAway, 885, 300, 200, { size: 38, weight: 600, color: C.amber }, 4); }
      api.text(ctx, T.needle, MAP.x, MAP.y + 64, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", decor: true });
      if (done) { const nx = MAP.x + Math.cos(((-90 + r.turn) * Math.PI) / 180) * 250, ny = MAP.y + Math.sin(((-90 + r.turn) * Math.PI) / 180) * 250; pill(api, ctx, `N`, clamp(nx, 140, 740), clamp(ny, 190, 590), { color: C.mint, size: 38 }); }
    }
    if (done) { if (ok) tick(ctx, 885, 450, C.mint, 1); else magnifier(ctx, 880, 450, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered || g.running) return { type: "wait", ms: 300 };
    const r = rd();
    if (r.mode === "poles") {
      const opts: Slot[] = ["", "NS", "SN"]; let want: [Slot, Slot] = ["", ""]; for (const L of opts) for (const R of opts) if ((L || R) && polesOk(r.goal, r.car, L, R) !== g.slip && want[0] === "" && want[1] === "") want = [L, R];
      if (g.slotL !== want[0]) return { type: "tap", at: [SLOTL.x + 85, SLOTL.y + 30], after: 250 }; if (g.slotR !== want[1]) return { type: "tap", at: [SLOTR.x + 85, SLOTR.y + 30], after: 250 };
      return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
    }
    if (r.mode === "label") {
      if (!g.probes.includes("left")) return { type: "drag", from: g.probe, to: [MYS.x - 72, MYS.y + MYS.h / 2], ms: 700, after: 600 };
      if (!g.probes.includes("right")) return { type: "drag", from: g.probe, to: [MYS.x + MYS.w + 72, MYS.y + MYS.h / 2], ms: 700, after: 600 };
      const nLeft = r.hidden === "NS" !== g.slip; return { type: "tap", at: [nLeft ? MYS.x + 30 : MYS.x + MYS.w - 30, MYS.y + MYS.h / 2], after: 500 };
    }
    if (r.disturb && !g.away && !g.slip) return { type: "drag", from: g.mag, to: [180, 560], ms: 700, after: 900 };
    const k = compassKey(r), i = g.slip ? (k + 1) % r.places.length : k, [x, y] = placeXY(r, i); return { type: "tap", at: [x, y], after: 600 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, slotL: g.slotL, slotR: g.slotR, carX: Math.round(g.carX), probes: g.probes, away: g.away, needle: Math.round(g.needle), verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const field: EngineDef<FieldSpec> = { archetype: "field-lab@1", label: "Simulation · Magnet Field Lab", accent: "#FF5A6E", create };
