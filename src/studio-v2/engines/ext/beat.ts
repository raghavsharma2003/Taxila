// POEM BEAT — `beat-line@1` (VALUES-100 V3.1: every English and Hindi poem). A rhythm lane for the poem's sound.
//   beat  — the line rides into the gate at the poem's tempo; stressed words are notes; tap on the beat (space / tap).
//           Taps go to the HOST's log (api.record), and each beat is graded from that log against the spec's timing.
//   rhyme — a line arrives with its last word missing; three word-orbs fall; slide the catcher under the one that
//           rhymes (sound, not spelling). The truth glows if you catch the wrong one.
//   matra — Hindi syllables stream into the gate; mark each one। short (1) or ऽ long (2) as it passes; the meter fills
//           to the doha's 13 | 11 yati. The key is matraWeights(line), computed, never typed by a model.
import { beatTiming, type BeatRoundT, type BeatSpec } from "../../../../shared/studio-spec-ext/beat.ts";
import { matraWeights, normText } from "../../../../shared/studio-spec-ext/common.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, SUBJECT_ACCENT, devaReady, shuffled, textBlock } from "./kit.ts";

const GATE_X = 250, LANE_Y = 330, CATCH_Y = 548;
interface WordT { w: string; t: number; beat: number }
interface Orb { word: string; x: number; y: number; caught: boolean }

function create(api: EngineApi, spec: BeatSpec): EngineInstance {
  const T = spec.strings, accent = SUBJECT_ACCENT[(spec.skills[0] ?? "").split("-")[1]] ?? "#FF8FB1";
  const devaNeeded = /[ऀ-ॿ]/.test(JSON.stringify(spec));
  let fontOk = !devaNeeded; if (devaNeeded) void devaReady().then(() => { fontOk = true; });
  const { spb, lead } = beatTiming(spec);
  const tick60 = 60 / spec.bpm;
  const botR = rng(api.seed * 53 + 1);
  const g = {
    li: 0, lineT: 0, words: [] as WordT[], pxs: 220, sent: new Set<number>(), taps: [] as number[], hits: [] as { t: number; ok: string }[],
    item: 0, itemT: 0, orbs: [] as Orb[], catcher: 500, catchTarget: 500, dragging: false, caught: null as Orb | null, verdict: "", revealT: 0,
    syl: [] as { syl: string; w: 1 | 2 }[], sylT: 0, sylGap: 1, marks: new Map<number, number>(), meter: 0, flashes: [] as { x: number; t: number; c: string; s: string }[],
    right: 0, n: 0, combo: 0, best: 0, roundR: 0, roundN: 0, coachA: 1, coachGone: false, lastTick: -1,
  };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "acc", label: T.onBeat, meter: true }, { key: "combo", label: T.combo }]);
  const rd = (): BeatRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.li = 0; g.item = 0; g.roundR = 0; g.roundN = 0; api.event("round_start", { round: k + 1, mode: spec.rounds[k].mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); startUnit(); },
    onEnd(k) { api.event("round_end", { round: k + 1, right: g.roundR, of: g.roundN }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n, bestCombo: g.best }); },
  });
  function lineWords(idx: number): WordT[] {
    const ln = spec.lines[idx], ws = ln.text.split(/\s+/), beats = ln.beats;
    const bt = (i: number) => lead + beats.indexOf(i) * spb;
    return ws.map((w, i) => {
      if (beats.includes(i)) return { w, t: bt(i), beat: beats.indexOf(i) };
      const prev = beats.filter((b) => b < i).pop(), next = beats.find((b) => b > i);
      let t: number;
      if (prev !== undefined && next !== undefined) t = lerp(bt(prev), bt(next), (i - prev) / (next - prev));
      else if (prev !== undefined) t = bt(prev) + (i - prev) * spb * 0.32;
      else t = bt(next!) - (next! - i) * spb * 0.32;
      return { w, t, beat: -1 };
    });
  }
  function startUnit() {
    const r = rd();
    if (r.mode === "beat") {
      const idx = r.lines[g.li]; g.words = lineWords(idx); g.lineT = 0; g.sent.clear(); g.hits = [];
      // pixel speed: no two neighbouring words may overlap at the 52-unit display size
      let pxs = 200;
      for (let i = 1; i < g.words.length; i++) { const dt = g.words[i].t - g.words[i - 1].t; const need = (g.words[i - 1].w.length * 27 + g.words[i].w.length * 27) / 2 + 26; if (dt > 0) pxs = Math.max(pxs, need / dt); }
      g.pxs = Math.min(520, pxs);
      api.resetLog("taps"); api.task(`${T.round} ${flow.round + 1}`, T.tap);
    } else if (r.mode === "rhyme") {
      const it = r.items[g.item]; g.itemT = 0; g.caught = null; g.verdict = ""; g.revealT = 0;
      const cols = [300, 500, 700]; const opts = shuffled(it.options, api.seed * 7 + flow.round * 17 + g.item);
      g.orbs = opts.map((w, i) => ({ word: w, x: cols[i + (opts.length === 2 ? (i ? 1 : 0) : 0)], y: 250 - i * 40, caught: false }));
      api.task(`${T.round} ${flow.round + 1}`, T.catch);
    } else {
      const idx = r.lines[g.li]; g.syl = matraWeights(spec.lines[idx].text); g.sylT = 0; g.sylGap = Math.max(0.95, tick60 * 1.5); g.marks.clear(); g.meter = 0;
      api.task(`${T.round} ${flow.round + 1}`, T.mark);
    }
  }
  function nextUnit() {
    const r = rd();
    if (r.mode === "rhyme") { if (g.item + 1 < r.items.length) { g.item++; startUnit(); } else flow.endRound(); }
    else { if (g.li + 1 < r.lines.length) { g.li++; startUnit(); } else flow.endRound(); }
  }
  function score(verdict: string) {
    g.n++; g.roundN++;
    if (verdict === "right") { g.right++; g.roundR++; g.combo++; g.best = Math.max(g.best, g.combo); } else g.combo = 0;
  }
  // ── input
  function tap() {
    if (flow.state !== "play" || rd().mode !== "beat") return;
    if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
    const ms = Math.round(g.lineT * 1000);
    api.record("taps", { line: rd().mode === "beat" ? (rd() as Extract<BeatRoundT, { mode: "beat" }>).lines[g.li] : -1, ms });
    sfx.blip({ f: 880, dur: 0.05, type: "triangle", gain: 0.08 });
    api.fx.ring(GATE_X, LANE_Y, { color: C.ink, r0: 10, r1: 60, life: 0.25, width: 4 });
  }
  function mark(v: 1 | 2) {
    if (flow.state !== "play" || rd().mode !== "matra") return;
    if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
    // the syllable nearest the gate that is still unmarked and inside its window
    let best = -1, bd = 1e9;
    g.syl.forEach((_, i) => { if (g.marks.has(i)) return; const d = Math.abs(g.sylT - (1.6 + i * g.sylGap)); if (d < g.sylGap * 0.55 && d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    g.marks.set(best, v);
    const idx = (rd() as Extract<BeatRoundT, { mode: "matra" }>).lines[g.li];
    const grade = api.answer(`m${idx}:${best}`, v, v === g.syl[best].w ? "right" : "wrong");
    score(grade.verdict);
    if (grade.verdict === "right") { g.meter += v; sfx.blip({ f: v === 2 ? 392 : 523, dur: 0.12, type: "triangle", gain: 0.14 }); api.fx.burst(GATE_X, LANE_Y, { n: 14, color: C.mint, speed: 260, life: 0.4, size: 8 }); }
    else { g.meter += g.syl[best].w; sfx.blip({ f: 200, dur: 0.15, gain: 0.12 }); g.flashes.push({ x: GATE_X, t: api.now(), c: C.amber, s: g.syl[best].w === 2 ? "ऽ" : "।" }); }
    api.facts({ syllable: g.syl[best].syl, marked: v, truth: g.syl[best].w, meter: g.meter });
  }
  api.onPointer({
    down(p) {
      if (flow.state !== "play") return;
      const m = rd().mode;
      if (m === "beat") tap();
      else if (m === "matra") { if (p.y > 440) mark(p.x < 500 ? 1 : 2); }
      else { g.dragging = true; g.catchTarget = clamp(p.x, 120, 880); if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); } }
    },
    move(p) { if (g.dragging) g.catchTarget = clamp(p.x, 120, 880); },
    up() { g.dragging = false; },
  });
  api.onKey((k, down) => {
    if (!down) return;
    if (k === " ") tap();
    if (k === "ArrowLeft") { if (rd()?.mode === "matra") mark(1); else g.catchTarget = clamp(g.catchTarget - 200, 120, 880); }
    if (k === "ArrowRight") { if (rd()?.mode === "matra") mark(2); else g.catchTarget = clamp(g.catchTarget + 200, 120, 880); }
  });
  // ── per frame
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state !== "play") return;
    const r = rd();
    if (r.mode === "beat") {
      g.lineT += dt;
      const tk = Math.floor(g.lineT / tick60);
      if (tk !== g.lastTick) { g.lastTick = tk; sfx.blip({ f: tk % 2 === 0 ? 660 : 440, dur: 0.03, type: "sine", gain: 0.04 }); }
      const idx = r.lines[g.li], ln = spec.lines[idx];
      ln.beats.forEach((_, j) => {
        if (g.sent.has(j) || g.lineT < lead + j * spb + 0.45) return;
        g.sent.add(j);
        const grade = api.answer(`b${idx}:${j}`, { taps: { $hostLog: "taps" } });
        score(grade.verdict);
        const ok = grade.verdict; g.hits.push({ t: api.now(), ok });
        if (ok === "right") { api.fx.burst(GATE_X, LANE_Y, { n: 18, color: accent, speed: 300, life: 0.45, size: 9 }); api.fx.pop(T.perfect, GATE_X + 40, LANE_Y - 70, { color: C.mint, size: 40, life: 0.7 }); if (g.combo > 2) api.hitstop(25); }
        else if (ok === "partial") api.fx.pop(grade.detail === "early" ? T.early : T.late, GATE_X + 40, LANE_Y - 70, { color: C.amber, size: 38, life: 0.7 });
      });
      if (g.lineT > lead + ln.beats.length * spb + spb * 0.9) nextUnit();
    } else if (r.mode === "rhyme") {
      g.itemT += dt;
      g.catcher += (g.catchTarget - g.catcher) * Math.min(1, dt * 14);
      if (!g.caught) {
        for (const o of g.orbs) {
          o.y += dt * 78;
          if (!o.caught && o.y >= CATCH_Y - 34 && o.y < CATCH_Y + 10 && Math.abs(o.x - g.catcher) < 78) { o.caught = true; g.caught = o; break; }
        }
        if (g.caught) {
          const it = r.items[g.item], ok = normText(g.caught.word) === normText(it.answer);
          const grade = api.answer(`r${flow.round + 1}:${g.item}`, g.caught.word, ok ? "right" : "wrong");
          g.verdict = grade.verdict; g.revealT = 0; score(grade.verdict);
          if (grade.verdict === "right") { api.fx.burst(g.catcher, CATCH_Y - 30, { n: 30, color: C.mint, speed: 420, life: 0.6, size: 10 }); api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); }
          else { sfx.blip({ f: 230, f2: 140, dur: 0.24, gain: 0.16 }); api.fx.shake(4, 0.2); }
          api.facts({ cue: it.cue, caught: g.caught.word, answer: it.answer, verdict: grade.verdict });
        } else if (g.orbs.every((o) => o.y > CATCH_Y + 60)) {
          const it = r.items[g.item]; const grade = api.answer(`r${flow.round + 1}:${g.item}`, null, "wrong");
          g.verdict = grade.verdict; g.caught = { word: "", x: -999, y: 0, caught: true }; g.revealT = 0; score(grade.verdict); void it;
        }
      } else { g.revealT += dt; if (g.revealT > 1.9) nextUnit(); }
    } else {
      g.sylT += dt;
      const idx = r.lines[g.li];
      g.syl.forEach((s, i) => {
        if (g.marks.has(i) || g.sylT < 1.6 + i * g.sylGap + g.sylGap * 0.55) return;
        g.marks.set(i, 0);
        const grade = api.answer(`m${idx}:${i}`, null, "wrong"); score(grade.verdict); g.meter += s.w;
        g.flashes.push({ x: GATE_X, t: api.now(), c: C.amber, s: s.w === 2 ? "ऽ" : "।" });
      });
      if (g.sylT > 1.6 + g.syl.length * g.sylGap + 1.2) nextUnit();
    }
    const acc = g.n ? Math.round((100 * g.right) / g.n) : null;
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`);
    hud.set("acc", acc == null ? "—" : `${acc}%`, { meter: acc == null ? 0 : acc / 100, tone: acc != null && acc >= 80 ? "mint" : null });
    hud.set("combo", String(g.combo), { bump: true, tone: g.combo >= 4 ? "mint" : null });
  }
  function paintBg(c: Ctx) {
    const gr = c.createRadialGradient(GATE_X, LANE_Y, 30, 500, 312, 820); gr.addColorStop(0, "#1C1530"); gr.addColorStop(0.5, "#0F0D1C"); gr.addColorStop(1, "#06060B");
    c.fillStyle = gr; c.fillRect(0, 0, W, H); c.fillStyle = hexA(accent, 0.04); c.fillRect(0, 0, W, H);
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // sound rings breathe on the beat (pure function of the line clock)
    const ph = r.mode === "beat" ? (g.lineT / spb) % 1 : (now / (tick60 * 2)) % 1;
    for (let k = 0; k < 4; k++) { const rr = 60 + ((ph + k / 4) % 1) * 520; ctx.save(); ctx.strokeStyle = hexA(accent, 0.12 * (1 - (rr - 60) / 520)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(GATE_X, LANE_Y, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (r.mode === "beat" || r.mode === "matra") {
      // lane
      ctx.save(); const lg = ctx.createLinearGradient(0, LANE_Y - 50, 0, LANE_Y + 50); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, "rgba(255,255,255,.05)"); lg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lg; ctx.fillRect(0, LANE_Y - 60, W, 120); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, LANE_Y + 52); ctx.lineTo(W, LANE_Y + 52); ctx.stroke(); ctx.restore();
      const pulse = r.mode === "beat" ? Math.max(0, 1 - ((g.lineT - lead) / spb - Math.floor((g.lineT - lead) / spb)) * 3) : 0;
      bloom(ctx, accent, GATE_X, LANE_Y, 110, 0.25 + 0.35 * pulse);
      ctx.save(); ctx.strokeStyle = accent; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(GATE_X, LANE_Y - 70); ctx.lineTo(GATE_X, LANE_Y + 70); ctx.stroke(); ctx.restore();
    }
    if (r.mode === "beat") {
      const idx = r.lines[g.li], ln = spec.lines[idx];
      if (ln.own) api.text(ctx, T.practice, 900, 236, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "right", track: 4 });
      for (const w of g.words) {
        const x = GATE_X + (w.t - g.lineT) * g.pxs;
        if (x < -200 || x > W + 200) continue;
        const past = x < GATE_X - 20, isBeat = w.beat >= 0;
        if (isBeat) {
          const tw = api.measure(ctx, w.w, { font: "display", size: 52, weight: 800 }) + 34, hit = g.hits[w.beat];
          const col = hit ? (hit.ok === "right" ? C.mint : hit.ok === "partial" ? C.amber : C.ink3) : accent;
          ctx.save(); ctx.globalAlpha = past ? 0.55 : 1; if (!past) bloom(ctx, col, x, LANE_Y, tw * 0.6, 0.25); ctx.fillStyle = hexA(col, 0.16); roundRect(ctx, x - tw / 2, LANE_Y - 40, tw, 80, 22); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
          api.text(ctx, w.w, x, LANE_Y + 2, { font: "display", size: 52, weight: 800, align: "center", baseline: "middle", alpha: past ? 0.55 : 1 });
        } else api.text(ctx, w.w, x, LANE_Y + 2, { font: "display", size: 46, weight: 600, color: C.ink2, align: "center", baseline: "middle", alpha: past ? 0.4 : 0.85 });
      }
      // count-in
      if (g.lineT < lead) { const n = Math.ceil((lead - g.lineT) / tick60); api.text(ctx, String(Math.min(4, n)), GATE_X, LANE_Y - 120, { font: "display", size: 64, weight: 800, color: hexA(C.ink, 0.6), align: "center", baseline: "middle" }); }
      // the whole line, small, for reading (karaoke-free)
      textBlock(api, ctx, ln.text, 560, 470, 760, { size: 40, weight: 600, color: C.ink3 }, 2);
    } else if (r.mode === "rhyme") {
      const it = r.items[g.item];
      // the cue line as a card
      ctx.save(); ctx.fillStyle = "rgba(18,16,30,.94)"; roundRect(ctx, 110, 168, 780, 116, 22); ctx.fill(); ctx.strokeStyle = hexA(accent, 0.6); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      const shown = g.caught && g.verdict ? it.cue.replace(/_{2,}/, g.verdict === "right" ? g.caught.word : it.answer) : it.cue;
      textBlock(api, ctx, shown, 500, 226, 740, { font: "display", size: 44, weight: 700, color: g.caught && g.verdict === "right" ? C.mint : C.ink }, 2);
      for (const o of g.orbs) {
        if (o.caught && g.caught === o) continue;
        const isAns = normText(o.word) === normText(it.answer), show = g.caught && isAns && g.verdict !== "right";
        const y = o.y, a = clamp((y - 280) / 50, 0, 1) * (o.y > CATCH_Y + 50 ? clamp(1 - (o.y - CATCH_Y - 50) / 60, 0, 1) : 1);
        if (a <= 0.01 && !show) continue;
        const ww = Math.max(130, api.measure(ctx, o.word, { font: "display", size: 46, weight: 700 }) + 46);
        ctx.save(); ctx.globalAlpha = show ? 1 : a; bloom(ctx, show ? C.mint : accent, o.x, y, ww * 0.6, 0.3); ctx.fillStyle = "rgba(24,20,40,.96)"; roundRect(ctx, o.x - ww / 2, y - 36, ww, 72, 36); ctx.fill(); ctx.strokeStyle = show ? C.mint : hexA(accent, 0.9); ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        api.text(ctx, o.word, o.x, y + 2, { font: "display", size: 46, weight: 700, align: "center", baseline: "middle", alpha: show ? 1 : a });
        if (show) tick(ctx, o.x + ww / 2 + 6, y - 30, C.mint, 0.8);
      }
      // catcher
      const cx = g.catcher, cw = 170;
      ctx.save(); bloom(ctx, g.dragging ? C.volt : accent, cx, CATCH_Y, 120, 0.3); ctx.strokeStyle = g.dragging ? C.volt : C.ink; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(cx - cw / 2, CATCH_Y - 30); ctx.quadraticCurveTo(cx - cw / 2 + 6, CATCH_Y + 22, cx, CATCH_Y + 22); ctx.quadraticCurveTo(cx + cw / 2 - 6, CATCH_Y + 22, cx + cw / 2, CATCH_Y - 30); ctx.stroke(); ctx.restore();
      if (g.caught && g.caught.word) {
        const ok = g.verdict === "right", ww = Math.max(130, api.measure(ctx, g.caught.word, { font: "display", size: 46, weight: 700 }) + 46);
        ctx.save(); ctx.fillStyle = ok ? "rgba(20,40,32,.96)" : "rgba(40,30,16,.96)"; roundRect(ctx, cx - ww / 2, CATCH_Y - 70, ww, 66, 33); ctx.fill(); ctx.strokeStyle = ok ? C.mint : C.amber; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        api.text(ctx, g.caught.word, cx, CATCH_Y - 36, { font: "display", size: 44, weight: 700, color: ok ? C.mint : C.amber, align: "center", baseline: "middle" });
        if (!ok) magnifier(ctx, cx + ww / 2 + 16, CATCH_Y - 60, C.amber, 0.8);
      }
    } else {
      const idx = r.lines[g.li], ln = spec.lines[idx];
      g.syl.forEach((s, i) => {
        const x = GATE_X + (1.6 + i * g.sylGap - g.sylT) * 190; if (x < -80 || x > W + 80) return;
        const m = g.marks.get(i), done = m !== undefined, col = !done ? C.ink : m === s.w ? C.mint : C.amber;
        ctx.save(); ctx.globalAlpha = x < GATE_X - 30 ? 0.6 : 1; ctx.fillStyle = done ? hexA(col, 0.15) : "rgba(255,255,255,.05)"; roundRect(ctx, x - 44, LANE_Y - 46, 88, 92, 18); ctx.fill(); ctx.strokeStyle = done ? col : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        api.text(ctx, s.syl, x, LANE_Y - 6, { font: "ui", size: 48, weight: 700, align: "center", baseline: "middle", alpha: x < GATE_X - 30 ? 0.6 : 1 });
        if (done) api.text(ctx, s.w === 2 ? "ऽ" : "।", x, LANE_Y + 72, { font: "ui", size: 40, weight: 700, color: col, align: "center", baseline: "middle" });
      });
      // the meter: 13 | 11 for a doha half-line pair, else the running count
      const total = g.syl.reduce((a, s) => a + s.w, 0), cap = Math.max(total, 13), bw = 560, x0 = 220, y0 = 196;
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,.06)"; roundRect(ctx, x0, y0, bw, 26, 13); ctx.fill(); ctx.fillStyle = accent; roundRect(ctx, x0, y0, bw * clamp(g.meter / cap, 0, 1), 26, 13); ctx.fill();
      if (total > 13) { const yx = x0 + bw * (13 / cap); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(yx, y0 - 10); ctx.lineTo(yx, y0 + 36); ctx.stroke(); }
      ctx.restore();
      api.text(ctx, `${T.meter} ${g.meter}`, x0 + bw + 20, y0 + 14, { font: "ui", size: 40, weight: 700, color: C.ink, baseline: "middle" });
      api.text(ctx, ln.text, 500, 150, { font: "ui", size: 40, weight: 600, color: C.ink3, align: "center", baseline: "middle", maxWidth: 640 });
      // the two pads
      for (const [i, lab] of [[0, T.short], [1, T.long]] as [number, string][]) {
        const x = 150 + i * 360, y = 470;
        ctx.save(); ctx.fillStyle = "rgba(24,20,40,.96)"; roundRect(ctx, x, y, 340, 112, 22); ctx.fill(); ctx.strokeStyle = i ? accent : C.ion; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        api.text(ctx, lab, x + 170, y + 58, { font: "ui", size: 44, weight: 700, align: "center", baseline: "middle" });
      }
      for (const f of g.flashes) { const k = api.now() - f.t; if (k < 0.8) api.text(ctx, f.s, f.x, LANE_Y - 100 - k * 30, { font: "ui", size: 48, weight: 700, color: f.c, align: "center", baseline: "middle", alpha: 1 - k / 0.8 }); }
    }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.roundR}/${g.roundN}`, T.onBeat], [String(g.best), T.combo]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.onBeat], [String(g.best), T.combo]] });
    drawCoach(api, ctx, r.mode === "beat" ? T.tap : r.mode === "rhyme" ? T.catch : T.mark, flow.state === "play" ? g.coachA : 0, now, r.mode === "matra" ? 120 : 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play") return { type: "wait", ms: 200 };
    const r = rd();
    if (r.mode === "beat") {
      const ln = spec.lines[r.lines[g.li]];
      for (let j = 0; j < ln.beats.length; j++) { const tb = lead + j * spb, d = tb - g.lineT; if (d > -0.05 && d < 0.6) { if (d > 0.07) return { type: "wait", ms: Math.max(10, (d - 0.06) * 1000) }; return { type: "key", key: " ", after: 160 }; } }
      return { type: "wait", ms: 120 };
    }
    if (r.mode === "rhyme") {
      if (g.caught) return { type: "wait", ms: 300 };
      const it = r.items[g.item], target = botR() < 0.85 ? g.orbs.find((o) => normText(o.word) === normText(it.answer)) : g.orbs[Math.floor(botR() * g.orbs.length)];
      if (!target || Math.abs(target.x - g.catcher) < 30) return { type: "wait", ms: 250 };
      return { type: "drag", from: [g.catcher, CATCH_Y], to: [target.x, CATCH_Y], ms: 400, after: 200 };
    }
    let next = -1; g.syl.forEach((_, i) => { if (next < 0 && !g.marks.has(i)) next = i; });
    if (next < 0) return { type: "wait", ms: 200 };
    const d = 1.6 + next * g.sylGap - g.sylT; if (d > 0.15) return { type: "wait", ms: Math.min(800, (d - 0.1) * 1000) };
    const want = botR() < 0.85 ? g.syl[next].w : (3 - g.syl[next].w) as 1 | 2;
    return { type: "tap", at: [want === 1 ? 320 : 680, 526], after: 150 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, line: g.li, item: g.item, right: g.right, n: g.n, combo: g.combo }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; g.combo = 0; flow.startRound(0); return true; } return false; },
    board: () => {
      const rh = spec.rounds.find((x) => x.mode === "rhyme") as Extract<BeatRoundT, { mode: "rhyme" }> | undefined;
      const lines = rh ? rh.items.slice(0, 3).map((it) => it.cue.replace(/_{2,}/, it.answer)) : spec.lines.slice(0, 3).map((l) => l.text);
      return { title: spec.title, lines, figure: { kind: "none" }, accent };
    },
  };
}
export const beat: EngineDef<BeatSpec> = { archetype: "beat-line@1", label: "Game · Poem Beat", accent: "#FF8FB1", create };
