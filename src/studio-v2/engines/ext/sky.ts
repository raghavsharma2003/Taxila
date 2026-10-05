// SKY LAB — `sky-lab@1` (VALUES-100 V3.1: day and night, seasons, eclipses, the turning sky). Real geometry, drawn
// from real data: the Earth seen from above the North Pole carries Natural Earth land outlines; the seasons read
// Delhi's true day length and noon Sun from the solar declination; the eclipse needs the Moon in line AND (with nodes)
// on the Sun's plane; the night sky is the real J2000 sky round the pole. No clock is shown before LOCK: the child
// reasons from light and shadow, then sees the time.
import { LAND } from "../../../../shared/studio-spec-ext/land-data.ts";
import { ASK_H, DELHI, ECL_TOL, SEASON_DAY, SHAPES, STARS, dayHours, PHASE_E, eclipseOk, elongation, joinScore, localHour, noonSun, rotFor, seasonVerdict, startRot, stillStar, sunDistance, type SkRoundT, type SkySpec } from "../../../../shared/studio-spec-ext/sky.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill, textBlock } from "./kit.ts";

const LOCK = { x: 800, y: 520, w: 170, h: 66 };
const E = { x: 400, y: 380, r: 165 };
const ORB = { x: 430, y: 380, rx: 300, ry: 130 };
const EC = { x: 520, y: 370, mr: 165, sr: 330 };
const SKY = { x: 420, y: 385, r: 225 };
const SL = { x0: 200, x1: 640, y: 600 };
const MAG: Record<string, number> = { polaris: 2.0, dubhe: 1.8, merak: 2.4, phecda: 2.4, megrez: 3.3, alioth: 1.8, mizar: 2.2, alkaid: 1.9, caph: 2.3, schedar: 2.2, gammacas: 2.5, ruchbah: 2.7, segin: 3.4, kochab: 2.1, pherkad: 3.0, thuban: 3.7, alderamin: 2.5, capella: 0.1, deneb: 1.25, errai: 3.2, yildun: 4.4 };
const D2R = Math.PI / 180;
const angOf = (x: number, y: number, cx: number, cy: number) => (Math.atan2(-(y - cy), x - cx) / D2R + 360) % 360;
const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
/** the Sun rides a squashed ring on screen: its true direction from the Earth is the drawn one */
const sunDir = (s: number) => (Math.atan2(0.62 * Math.sin(s * D2R), Math.cos(s * D2R)) / D2R + 360) % 360;
const sunParam = (d: number) => (Math.atan2(Math.sin(d * D2R) / 0.62, Math.cos(d * D2R)) / D2R + 360) % 360;
function create(api: EngineApi, spec: SkySpec): EngineInstance {
  const T = spec.strings, accent = "#9FB7FF";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 173 + 13), setTask = taskPill(api);
  const months = T.months.split(",");
  const field = (() => { const r = rng(4242); return Array.from({ length: 70 }, () => [r() * 24, 46 + r() * 38, 3.6 + r() * 1.4] as [number, number, number]); })();
  const g = {
    rot: 0, net: 0, dragAng: NaN, day: 0, moon: 90, sun: 180, dragWhat: "" as "" | "earth" | "moon" | "sun" | "slider" | "pointer",
    lst: 0, lst0: 0, pointer: null as null | { a: [number, number]; b: [number, number] }, sel: "", edges: [] as [string, string][], picked: "",
    answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0,
  };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): SkRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      Object.assign(g, { net: 0, dragAng: NaN, moon: 90, sun: 180, dragWhat: "", lst: 6, lst0: 6, pointer: null, sel: "", edges: [], picked: "", answered: false, verdict: "", detail: "", revealT: 0 });
      g.rot = r.mode === "daynight" ? startRot(r) : 0; g.day = r.mode === "season" ? (SEASON_DAY[r.ask] + 150) % 365 : 0; if (r.mode === "eclipse" && r.nodes) g.sun = (r.node + 110) % 360;
      setTask(`${T.round} ${k + 1}`, r.sub || r.title); api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
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
  const earthPos = (day: number): [number, number] => { const a = (2 * Math.PI * (day - 172)) / 365; return [ORB.x - ORB.rx * Math.cos(a), ORB.y + ORB.ry * Math.sin(a)]; };
  const dayOf = (x: number, y: number) => { const a = Math.atan2((y - ORB.y) / ORB.ry, -(x - ORB.x) / ORB.rx); return ((Math.round(172 + (a * 365) / (2 * Math.PI)) % 365) + 365) % 365; };
  const moonPos = (a: number): [number, number] => [EC.x + Math.cos(a * D2R) * EC.mr, EC.y - Math.sin(a * D2R) * EC.mr];
  const sunPos = (a: number): [number, number] => [EC.x + Math.cos(a * D2R) * EC.sr, EC.y - Math.sin(a * D2R) * EC.sr * 0.62];
  const starXY = (ra: number, dec: number): [number, number] => { const a = (90 - (ra - g.lst) * 15) * D2R, rr = (90 - dec) * 5; return [SKY.x + rr * Math.cos(a), SKY.y - rr * Math.sin(a)]; };
  const nearestStar = (p: { x: number; y: number }) => { let best = "", bd = 34; for (const [id, [ra, dec]] of Object.entries(STARS)) { const [x, y] = starXY(ra, dec); const d = Math.hypot(p.x - x, p.y - y); if (d < bd && Math.hypot(x - SKY.x, y - SKY.y) <= SKY.r) { bd = d; best = id; } } return best; };
  const lockable = () => { const r = rd(); return r.mode !== "stars" ? true : r.task === "join" && g.edges.length > 0; };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      const r = rd();
      if (inB(p, LOCK) && lockable() && !(r.mode === "stars" && r.task !== "join")) {
        if (r.mode === "daynight") judge({ rot: +g.rot.toFixed(1), net: +g.net.toFixed(1) }, localHourOk(r) && g.net > 0 ? "right" : "wrong");
        else if (r.mode === "season") judge({ day: g.day }, seasonVerdict(r.ask, g.day) === "right" ? "right" : "wrong");
        else if (r.mode === "phase") { const gap = Math.abs(((elongation(g.moon) - PHASE_E[r.ask] + 540) % 360) - 180); judge({ moon: +g.moon.toFixed(1) }, gap <= 22 ? "right" : "wrong"); }
        else if (r.mode === "eclipse") { const sd = r.nodes ? sunDir(g.sun) : 180, e = eclipseOk(r, g.moon, sd); judge({ moon: +g.moon.toFixed(1), sun: +sd.toFixed(1) }, e.aligned && e.onNode ? "right" : "wrong"); }
        else { const sc = joinScore(r.shape, g.edges); judge({ edges: g.edges }, sc.hit === sc.of && !sc.extra ? "right" : "wrong"); }
        return;
      }
      if (r.mode === "daynight") { if (Math.hypot(p.x - E.x, p.y - E.y) < E.r + 30) { g.dragWhat = "earth"; g.dragAng = angOf(p.x, p.y, E.x, E.y); } return; }
      if (r.mode === "season") { const [ex, ey] = earthPos(g.day); if (Math.hypot(p.x - ex, p.y - ey) < 70 || Math.abs(Math.hypot((p.x - ORB.x) / ORB.rx, (p.y - ORB.y) / ORB.ry) - 1) < 0.2) { g.dragWhat = "earth"; g.day = dayOf(p.x, p.y); } return; }
      if (r.mode === "phase") { const [mx, my] = moonPos(g.moon); if (Math.hypot(p.x - mx, p.y - my) < 60 || Math.abs(Math.hypot(p.x - EC.x, p.y - EC.y) - EC.mr) < 40) { g.dragWhat = "moon"; g.moon = angOf(p.x, p.y, EC.x, EC.y); } return; }
      if (r.mode === "eclipse") { const [mx, my] = moonPos(g.moon), [sx, sy] = sunPos(g.sun); if (Math.hypot(p.x - mx, p.y - my) < 60) g.dragWhat = "moon"; else if (r.nodes && Math.hypot(p.x - sx, p.y - sy) < 80) g.dragWhat = "sun"; return; }
      if (r.task !== "pointer" && Math.abs(p.y - SL.y) < 34 && p.x > SL.x0 - 20 && p.x < SL.x1 + 20) { g.dragWhat = "slider"; g.lst = g.lst0 + ((clamp(p.x, SL.x0, SL.x1) - SL.x0) / (SL.x1 - SL.x0)) * 12; return; }
      if (r.task === "pointer" && !g.pointer) { const s = nearestStar(p); if (s) { const [x, y] = starXY(...STARS[s]); g.pointer = { a: [x, y], b: [x, y] }; g.dragWhat = "pointer"; g.sel = s; } return; }
      const s = nearestStar(p); if (!s) return;
      if (r.task === "join") { if (!g.sel) { g.sel = s; sfx.blip({ f: 600, dur: 0.04, type: "triangle", gain: 0.07 }); } else if (g.sel === s) g.sel = ""; else { const k = [g.sel, s].sort().join("-"), at = g.edges.findIndex((e) => [...e].sort().join("-") === k); if (at >= 0) g.edges.splice(at, 1); else g.edges.push([g.sel, s]); api.record("edge", { a: g.sel, b: s }); g.sel = ""; sfx.blip({ f: 760, dur: 0.05, type: "triangle", gain: 0.08 }); } return; }
      g.picked = s; judge({ star: s }, s === stillStar() ? "right" : "wrong");
    },
    move(p) {
      if (g.dragWhat === "earth" && rd().mode === "daynight") { const a = angOf(p.x, p.y, E.x, E.y), d = wrap180(a - g.dragAng); g.rot = (g.rot + d + 360) % 360; g.net += d; g.dragAng = a; }
      else if (g.dragWhat === "earth") g.day = dayOf(p.x, p.y);
      else if (g.dragWhat === "moon") g.moon = angOf(p.x, p.y, EC.x, EC.y);
      else if (g.dragWhat === "sun") g.sun = (Math.atan2(-(p.y - EC.y) / 0.62, p.x - EC.x) / D2R + 360) % 360;
      else if (g.dragWhat === "slider") g.lst = g.lst0 + ((clamp(p.x, SL.x0, SL.x1) - SL.x0) / (SL.x1 - SL.x0)) * 12;
      else if (g.dragWhat === "pointer" && g.pointer) g.pointer.b = [p.x, p.y];
    },
    up() { if (g.dragWhat) api.record("drag", { what: g.dragWhat, rot: g.rot, day: g.day, moon: g.moon, sun: g.sun, lst: g.lst }); if (g.dragWhat === "pointer" && g.pointer && Math.hypot(g.pointer.b[0] - g.pointer.a[0], g.pointer.b[1] - g.pointer.a[1]) < 20) g.pointer = null; g.dragWhat = ""; },
  });
  const localHourOk = (r: Extract<SkRoundT, { mode: "daynight" }>) => { const h = localHour(g.rot, r.lon), d = Math.abs(h - ASK_H[r.ask]) % 24; return Math.min(d, 24 - d) <= r.tolH; };
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (g.answered) { g.revealT += dt; if (g.revealT > 3.2) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 173, 140); }
  function readout(ctx: Ctx, label: string, value: string, y: number, color: string = C.ink) {
    api.text(ctx, label, 885, y, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 220 });
    api.text(ctx, value, 885, y + 44, { font: "display", size: 42, weight: 800, color, align: "center", baseline: "middle", maxWidth: 220 });
  }
  function lockBtn(ctx: Ctx, now: number, on: boolean) {
    ctx.save(); ctx.fillStyle = on ? "rgba(203,255,77,.14)" : "rgba(22,26,36,.95)"; roundRect(ctx, LOCK.x, LOCK.y, LOCK.w, LOCK.h, 16); ctx.fill(); ctx.strokeStyle = on ? hexA(C.volt, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    api.text(ctx, T.lock, LOCK.x + LOCK.w / 2, LOCK.y + LOCK.h / 2 + 2, { font: "display", size: 38, weight: 800, color: on ? C.volt : C.ink3, align: "center", baseline: "middle" });
  }
  function sunBall(ctx: Ctx, x: number, y: number, r: number) { bloom(ctx, C.sun, x, y, r * 2.4, 0.8); const gr = ctx.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, "#FFF6D0"); gr.addColorStop(1, "#FFB547"); ctx.save(); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  function drawPhase(ctx: Ctx, x: number, y: number, R: number, e: number) {
    const waxing = e > 0 && e < 180, c = Math.cos((e * Math.PI) / 180);
    ctx.save(); ctx.fillStyle = "#1E222C"; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#F2F0E6"; ctx.beginPath(); if (waxing) ctx.arc(x, y, R, -Math.PI / 2, Math.PI / 2); else ctx.arc(x, y, R, Math.PI / 2, Math.PI * 1.5); ctx.fill();
    ctx.fillStyle = c > 0 ? "#1E222C" : "#F2F0E6"; ctx.beginPath(); ctx.ellipse(x, y, Math.abs(c) * R + 0.5, R + 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "daynight") {
      sunBall(ctx, 760, E.y, 40); ctx.save(); ctx.strokeStyle = hexA(C.sun, 0.25); ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(712, E.y + i * 40); ctx.lineTo(E.x + E.r + 10, E.y + i * 40); ctx.stroke(); } ctx.restore();
      api.text(ctx, T.sun, 760, E.y + 70, { size: 38, weight: 700, color: C.sun, align: "center", baseline: "middle" });
      ctx.save(); ctx.beginPath(); ctx.arc(E.x, E.y, E.r, 0, Math.PI * 2); ctx.fillStyle = "#1C4E7A"; ctx.fill(); ctx.clip();
      ctx.fillStyle = "#4E7A4A"; for (const poly of LAND) { let south = false; for (let i = 1; i < poly.length; i += 2) if (poly[i] < -55) south = true; if (south) continue; ctx.beginPath(); let started = false; for (let i = 0; i < poly.length; i += 2) { const lon = poly[i], lat = Math.max(-12, poly[i + 1]); const a = (g.rot + lon) * D2R, rr = (E.r * (90 - lat)) / 102; const x = E.x + rr * Math.cos(a), y = E.y - rr * Math.sin(a); if (started) ctx.lineTo(x, y); else { ctx.moveTo(x, y); started = true; } } ctx.closePath(); ctx.fill(); }
      const sh = ctx.createLinearGradient(E.x - 20, 0, E.x + 20, 0); sh.addColorStop(0, "rgba(3,6,14,.72)"); sh.addColorStop(1, "rgba(3,6,14,0)"); ctx.fillStyle = sh; ctx.fillRect(E.x - E.r, E.y - E.r, E.r + 20, 2 * E.r); ctx.restore();
      ctx.save(); ctx.strokeStyle = C.line2; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(E.x, E.y, E.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      const ca = (g.rot + r.lon) * D2R, cr = (E.r * (90 - 28)) / 102, cx = E.x + cr * Math.cos(ca), cy = E.y - cr * Math.sin(ca);
      bloom(ctx, C.volt, cx, cy, 26, 0.7); ctx.save(); ctx.fillStyle = C.volt; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      pill(api, ctx, r.city, clamp(cx + (cx < E.x ? -70 : 70), 150, 680), clamp(cy - 40, 200, 570), { color: C.volt, size: 38 });
      ctx.save(); ctx.strokeStyle = hexA(C.ink, 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(E.x, E.y, E.r + 26, -0.3, -1.2, true); ctx.stroke(); const ax = E.x + (E.r + 26) * Math.cos(-1.2), ay = E.y + (E.r + 26) * Math.sin(-1.2); ctx.fillStyle = hexA(C.ink, 0.5); ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      api.text(ctx, "N", E.x, E.y, { font: "display", size: 38, weight: 800, color: "rgba(255,255,255,.8)", align: "center", baseline: "middle", decor: true });
      if (done) { const h = localHour(g.rot, r.lon), hh = Math.floor(h), mm = Math.round((h - hh) * 60) % 60; readout(ctx, r.city, `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "a.m." : "p.m."}`, 300, ok ? C.mint : C.amber); if (g.net <= 0) pill(api, ctx, T.wrongWay, 420, 590, { color: C.amber, size: 38 }); }
      else api.text(ctx, T.spin, 400, 600, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 560 });
    } else if (r.mode === "season") {
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.ellipse(ORB.x, ORB.y, ORB.rx, ORB.ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      for (const [d, lab] of [[172, months[5]], [355, months[11]], [80, months[2]], [266, months[8]]] as [number, string][]) { const [x, y] = earthPos(d); api.text(ctx, lab, x, y + (y > ORB.y ? 46 : y < ORB.y - 10 ? -46 : 0) + (Math.abs(y - ORB.y) < 10 ? 50 : 0), { font: "mono", size: 38, weight: 600, color: "rgba(255,255,255,.4)", align: "center", baseline: "middle", decor: true }); }
      sunBall(ctx, ORB.x, ORB.y, 44);
      const [ex, ey] = earthPos(g.day), er = 30, tilt = 23.44 * D2R;
      ctx.save(); ctx.translate(ex, ey); const lit = ctx.createLinearGradient(Math.sign(ORB.x - ex) * er, 0, -Math.sign(ORB.x - ex) * er, 0); lit.addColorStop(0, "#5FA8FF"); lit.addColorStop(1, "#0D2440"); ctx.fillStyle = lit; ctx.beginPath(); ctx.arc(0, 0, er, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(tilt); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -er - 18); ctx.lineTo(0, er + 18); ctx.stroke(); ctx.fillStyle = C.volt; ctx.beginPath(); ctx.arc(0, -er - 18, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-er, 0); ctx.lineTo(er, 0); ctx.stroke(); ctx.restore();
      bloom(ctx, C.volt, ex, ey, 50, g.dragWhat ? 0.4 : 0.15);
      const dd = new Date(Date.UTC(2026, 0, 1) + g.day * 86400000);
      readout(ctx, T.date, `${dd.getUTCDate()} ${months[dd.getUTCMonth()]}`, 190);
      readout(ctx, T.dayLength, `${dayHours(DELHI, g.day).toFixed(1)} ${T.hours}`, 290);
      readout(ctx, T.sunHigh, `${noonSun(DELHI, g.day).toFixed(0)}°`, 390);
      api.text(ctx, `${T.distance} ${(149.6 * sunDistance(g.day)).toFixed(1)}M km`, 430, 600, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 600 });
    } else if (r.mode === "phase") {
      const [sx, sy] = sunPos(180), [mx, my] = moonPos(g.moon);
      sunBall(ctx, sx, sy, 38); ctx.save(); ctx.strokeStyle = hexA(C.sun, 0.18); ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(sx + 50, EC.y + i * 50); ctx.lineTo(EC.x + EC.mr + 40, EC.y + i * 50); ctx.stroke(); } ctx.restore();
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(EC.x, EC.y, EC.mr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = "#3D7BD9"; ctx.beginPath(); ctx.arc(EC.x, EC.y, 34, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "rgba(3,6,14,.6)"; ctx.beginPath(); ctx.arc(EC.x, EC.y, 34, -Math.PI / 2, Math.PI / 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.fillStyle = "#2A2E38"; ctx.beginPath(); ctx.arc(mx, my, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#E8ECF5"; ctx.beginPath(); ctx.arc(mx, my, 18, Math.PI / 2, Math.PI * 1.5); ctx.fill(); ctx.restore(); bloom(ctx, C.ink, mx, my, 36, g.dragWhat === "moon" ? 0.35 : 0.12);
      api.text(ctx, T.moon, mx, my - 40, { size: 38, weight: 700, color: C.ink2, align: "center", baseline: "middle", decor: true });
      if (done) { drawPhase(ctx, 885, 360, 62, elongation(g.moon)); textBlock(api, ctx, T.fromEarth, 885, 230, 200, { size: 38, weight: 600, color: C.ink2 }, 2); pill(api, ctx, g.detail, 470, 600, { color: ok ? C.mint : C.amber, size: 38 }); }
      else textBlock(api, ctx, T.place, 885, 330, 200, { size: 38, weight: 600, color: C.ink2 }, 4);
    } else if (r.mode === "eclipse") {
      const sun = r.nodes ? sunDir(g.sun) : 180, [sx, sy] = sunPos(r.nodes ? g.sun : 180), [mx, my] = moonPos(g.moon);
      if (r.nodes) { ctx.save(); ctx.strokeStyle = "rgba(255,181,71,.18)"; ctx.lineWidth = 2; ctx.setLineDash([4, 10]); ctx.beginPath(); ctx.ellipse(EC.x, EC.y, EC.sr, EC.sr * 0.62, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      sunBall(ctx, sx, sy, 38);
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(EC.x, EC.y, EC.mr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      if (r.nodes) { ctx.save(); ctx.strokeStyle = hexA(C.ion, 0.6); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); const nx = Math.cos(r.node * D2R) * (EC.mr + 30), ny = -Math.sin(r.node * D2R) * (EC.mr + 30); ctx.beginPath(); ctx.moveTo(EC.x - nx, EC.y - ny); ctx.lineTo(EC.x + nx, EC.y + ny); ctx.stroke(); ctx.restore(); for (const s of [1, -1]) { ctx.save(); ctx.fillStyle = C.ion; ctx.beginPath(); ctx.arc(EC.x + s * Math.cos(r.node * D2R) * EC.mr, EC.y - s * Math.sin(r.node * D2R) * EC.mr, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
      // shadows (cones away from the Sun)
      const toE = Math.atan2(EC.y - sy, EC.x - sx), toM = Math.atan2(my - sy, mx - sx);
      for (const [x, y, rr, a, len] of [[EC.x, EC.y, 34, toE, 260], [mx, my, 14, toM, 180]] as [number, number, number, number, number][]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.moveTo(0, -rr); ctx.lineTo(len, -rr * 0.25); ctx.lineTo(len, rr * 0.25); ctx.lineTo(0, rr); ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.fillStyle = "#3D7BD9"; ctx.beginPath(); ctx.arc(EC.x, EC.y, 34, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#4E7A4A"; ctx.beginPath(); ctx.arc(EC.x - 8, EC.y - 6, 14, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      const hgt = r.nodes ? Math.sin((g.moon - r.node) * D2R) : 0;
      ctx.save(); ctx.fillStyle = "#D8DCE6"; ctx.beginPath(); ctx.arc(mx, my, 15, 0, Math.PI * 2); ctx.fill(); ctx.restore(); bloom(ctx, C.ink, mx, my, 34, g.dragWhat === "moon" ? 0.4 : 0.15);
      api.text(ctx, T.moon, mx, my - 36, { size: 38, weight: 700, color: C.ink2, align: "center", baseline: "middle", decor: true });
      if (r.nodes) { // side view: is the Moon on the Sun's line?
        ctx.save(); ctx.fillStyle = "rgba(10,13,20,.85)"; roundRect(ctx, 780, 200, 200, 150, 14); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = hexA(C.sun, 0.6); ctx.beginPath(); ctx.moveTo(795, 275); ctx.lineTo(965, 275); ctx.stroke(); ctx.fillStyle = "#D8DCE6"; ctx.beginPath(); ctx.arc(880, 275 - hgt * 60, 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        api.text(ctx, Math.abs(hgt) <= Math.sin(ECL_TOL * D2R) ? "✓" : hgt > 0 ? "↑" : "↓", 950, 222, { font: "display", size: 38, weight: 800, color: Math.abs(hgt) <= Math.sin(ECL_TOL * D2R) ? C.mint : C.amber, align: "center", baseline: "middle" });
      }
      if (done) { const e = eclipseOk(r, g.moon, sun); if (e.aligned && e.onNode) { ctx.save(); ctx.fillStyle = r.ask === "solar" ? "rgba(0,0,0,.6)" : "rgba(160,40,30,.5)"; ctx.beginPath(); ctx.arc(r.ask === "solar" ? EC.x : mx, r.ask === "solar" ? EC.y : my, r.ask === "solar" ? 12 : 15, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } pill(api, ctx, g.detail, 470, 590, { color: ok ? C.mint : C.amber, size: 38 }); }
    } else {
      ctx.save(); const sg = ctx.createRadialGradient(SKY.x, SKY.y, 10, SKY.x, SKY.y, SKY.r); sg.addColorStop(0, "#0F1B3A"); sg.addColorStop(1, "#070B18"); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(SKY.x, SKY.y, SKY.r, 0, Math.PI * 2); ctx.fill(); ctx.clip();
      const scrub = g.lst - g.lst0;
      if (r.task !== "pointer" && scrub > 0.05) { ctx.strokeStyle = "rgba(160,190,255,.22)"; ctx.lineWidth = 2; for (const [ra, dec] of [...Object.values(STARS), ...field.map((f) => [f[0], f[1]] as [number, number])]) { const rr = (90 - dec) * 5, a0 = (90 - (ra - g.lst0) * 15) * D2R, a1 = (90 - (ra - g.lst) * 15) * D2R; ctx.beginPath(); ctx.arc(SKY.x, SKY.y, rr, -a0, -a1, true); ctx.stroke(); } }
      for (const [ra, dec, m] of field) { const [x, y] = starXY(ra, dec); ctx.fillStyle = "rgba(200,210,255,.5)"; ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, 4 - m * 0.7), 0, Math.PI * 2); ctx.fill(); }
      for (const [a, b] of g.edges) { const [x1, y1] = starXY(...STARS[a]), [x2, y2] = starXY(...STARS[b]); ctx.strokeStyle = C.volt; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
      if (done && r.task === "join") for (const [a, b] of SHAPES[r.shape]) { const [x1, y1] = starXY(...STARS[a]), [x2, y2] = starXY(...STARS[b]); ctx.strokeStyle = hexA(C.mint, 0.6); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
      if (g.pointer) { const [ax, ay] = g.pointer.a, [bx, by] = g.pointer.b; ctx.strokeStyle = hexA(C.sun, 0.8); ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * 6, ay + (by - ay) * 6); ctx.stroke(); ctx.setLineDash([]); }
      for (const [id, [ra, dec]] of Object.entries(STARS)) { const [x, y] = starXY(ra, dec), s = Math.max(2.2, 7 - MAG[id] * 1.5), hot = id === g.sel || id === g.picked; if (hot) bloom(ctx, C.volt, x, y, 26, 0.7); ctx.fillStyle = hot ? C.volt : "#F2F5FF"; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = C.line2; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(SKY.x, SKY.y, SKY.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      if (done && r.task !== "join") { const [px, py] = starXY(...STARS[stillStar()]); pill(api, ctx, T.polaris, px, py - 46, { color: ok ? C.mint : C.amber, size: 38 }); }
      if (r.task !== "pointer") { ctx.save(); ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(SL.x1, SL.y); ctx.stroke(); const kx = SL.x0 + ((g.lst - g.lst0) / 12) * (SL.x1 - SL.x0); ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(kx, SL.y); ctx.stroke(); ctx.fillStyle = g.dragWhat === "slider" ? C.volt : C.ink; ctx.beginPath(); ctx.arc(kx, SL.y, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore(); readout(ctx, T.night, `+${(g.lst - g.lst0).toFixed(1)} ${T.hours}`, 200); }
      textBlock(api, ctx, r.task === "join" ? `${T.join}: ${T[r.shape]}` : r.task === "pointer" ? T.pointer : T.stillStar, 885, 380, 200, { size: 38, weight: 600, color: C.ink2 }, 4);
    }
    if (!(r.mode === "stars" && r.task !== "join")) lockBtn(ctx, now, !done && lockable());
    if (done) { if (ok) tick(ctx, 965, 470, C.mint, 1); else magnifier(ctx, 960, 470, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.08;
    if (r.mode === "daynight") {
      const want = rotFor(r.lon, ASK_H[r.ask]), need = ((want - g.rot) % 360 + 360) % 360;
      if (need > 3 && need < 357 && !slip) { const step = Math.min(need, 60), pts: [number, number][] = []; for (let i = 0; i <= 6; i++) { const a = (90 + (step * i) / 6) * D2R; pts.push([E.x + 120 * Math.cos(a), E.y - 120 * Math.sin(a)]); } return { type: "path", points: pts, ms: 500, after: 150 }; }
      return { type: "tap", at: [LOCK.x + 85, LOCK.y + 33], after: 400 };
    }
    if (r.mode === "season") { const want = slip ? SEASON_DAY[r.ask] + 90 : SEASON_DAY[r.ask]; if (Math.abs(g.day - (want % 365)) > 2) return { type: "drag", from: earthPos(g.day), to: earthPos(want % 365), ms: 700, after: 300 }; return { type: "tap", at: [LOCK.x + 85, LOCK.y + 33], after: 400 }; }
    if (r.mode === "phase") { const want = 180 + PHASE_E[r.ask] + (slip ? 60 : 0); if (Math.abs(wrap180(g.moon - want)) > 3) return { type: "drag", from: moonPos(g.moon), to: moonPos(want), ms: 600, after: 300 }; return { type: "tap", at: [LOCK.x + 85, LOCK.y + 33], after: 400 }; }
    if (r.mode === "eclipse") {
      if (r.nodes && Math.abs(Math.sin((sunDir(g.sun) - r.node) * D2R)) > 0.05) return { type: "drag", from: sunPos(g.sun), to: sunPos(sunParam(r.node + 180)), ms: 700, after: 300 };
      const sun = r.nodes ? sunDir(g.sun) : 180, want = (r.ask === "solar" ? sun : sun + 180) + (slip ? 30 : 0); const gap = Math.abs(wrap180(g.moon - want));
      if (gap > 2) return { type: "drag", from: moonPos(g.moon), to: moonPos(want), ms: 600, after: 300 };
      return { type: "tap", at: [LOCK.x + 85, LOCK.y + 33], after: 400 };
    }
    if (r.task === "join") { const todo = SHAPES[r.shape].find(([a, b]) => !g.edges.some((e) => [...e].sort().join("-") === [a, b].sort().join("-"))); if (todo && !slip) { const [a, b] = todo; if (g.sel !== a) return { type: "tap", at: starXY(...STARS[a]), after: 200 }; return { type: "tap", at: starXY(...STARS[b]), after: 200 }; } return { type: "tap", at: [LOCK.x + 85, LOCK.y + 33], after: 400 }; }
    if (r.task === "still" && g.lst - g.lst0 < 4) return { type: "drag", from: [SL.x0 + ((g.lst - g.lst0) / 12) * (SL.x1 - SL.x0), SL.y], to: [SL.x0 + (5 / 12) * (SL.x1 - SL.x0), SL.y], ms: 1200, after: 400 };
    if (r.task === "pointer" && !g.pointer) return { type: "drag", from: starXY(...STARS.merak), to: starXY(...STARS.dubhe), ms: 600, after: 400 };
    return { type: "tap", at: starXY(...STARS[slip ? "kochab" : stillStar()]), after: 500 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, rot: +g.rot.toFixed(1), net: +g.net.toFixed(1), day: g.day, moon: +g.moon.toFixed(1), sun: +g.sun.toFixed(1), lst: g.lst, edges: g.edges.length, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const sky: EngineDef<SkySpec> = { archetype: "sky-lab@1", label: "Simulation · Sky Lab", accent: "#9FB7FF", create };
