// Kyun-Lab · fair test, the view (DESIGN.md §3.4). Two set-ups face each other across the conditions: A's chip, the
// condition's name, B's chip. A row whose chips differ is outlined, and the fair-test meter counts those rows (one row
// apart = a fair test of that condition). Predict, run, conclude: the run grows each set-up's result from the lab's
// reviewed causal model (never a model call), and the conclusion buttons name only what the run can support.
import type { LabAct, Lang, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import type { Material, Painter, Role } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { labHelpers as H, labOf, type LabParams, type LabState } from "./lab.logic.ts";
import { BINARY_KINDS, type LabDef } from "./labs.ts";
import { drawScene } from "./scenes.ts";

interface Box { x: number; y: number; w: number; h: number }

/** small procedural glyphs for condition levels (decoration: the label always carries the meaning) */
function glyph(P: Painter, c: CanvasRenderingContext2D, icon: string, x: number, y: number, s: number): void {
  const r = s / 2, cx = x + r, cy = y + r;
  const ln = (pts: [number, number][], role: Role = "ink2", w = 2) => P.stroke(c, pts, { role, width: w });
  switch (icon) {
    case "sun": P.circle(c, cx, cy, r * 0.42, { role: "q1", fill: true }); for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; ln([[cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62], [cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92]], "q1"); } break;
    case "dark": P.circle(c, cx, cy, r * 0.7, { role: "ink3", fill: true }); break;
    case "shade": ln([[cx, cy + r * 0.9], [cx, cy]], "ink2", 2.5); P.circle(c, cx, cy - r * 0.2, r * 0.6, { role: "q4", fill: true }); break;
    case "damp": case "humid": ln([[cx, cy - r * 0.8], [cx + r * 0.5, cy + r * 0.1], [cx, cy + r * 0.7], [cx - r * 0.5, cy + r * 0.1], [cx, cy - r * 0.8]], "q2", 2.5); break;
    case "dry": ln([[x + 2, cy], [cx - 2, cy - 4], [cx + 3, cy + 3], [x + s - 2, cy - 2]], "q3", 2.5); break;
    case "under": for (let k = 0; k < 3; k++) ln([[x + 2, cy - 6 + k * 6], [cx - 3, cy - 9 + k * 6], [cx + 3, cy - 3 + k * 6], [x + s - 2, cy - 6 + k * 6]], "q2", 2); break;
    case "open": ln([[x + 3, cy - 2], [x + 3, y + s - 3], [x + s - 3, y + s - 3], [x + s - 3, cy - 2]], "ink2", 2.5); break;
    case "sealed": ln([[x + 3, y + 5], [x + s - 3, y + 5], [x + s - 3, y + s - 3], [x + 3, y + s - 3], [x + 3, y + 5]], "ink2", 2.5); ln([[x + 2, y + 3], [x + s - 2, y + 3]], "ink", 3); break;
    case "fridge": ln([[x + 5, y + 2], [x + s - 5, y + 2], [x + s - 5, y + s - 2], [x + 5, y + s - 2], [x + 5, y + 2]], "q2", 2.5); ln([[x + 5, cy - 2], [x + s - 5, cy - 2]], "q2", 2); break;
    case "room": ln([[x + 3, cy], [cx, y + 3], [x + s - 3, cy], [x + s - 3, y + s - 3], [x + 3, y + s - 3], [x + 3, cy]], "q3", 2.5); break;
    case "fan": for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3; ln([[cx, cy], [cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85]], "ink2", 4); } break;
    case "still": ln([[x + 3, cy], [x + s - 3, cy]], "ink3", 2.5); break;
    case "long": ln([[cx, y + 2], [cx, y + s - 2]], "ink2", 2); P.circle(c, cx, y + s - 4, 3.5, { role: "q1", fill: true }); break;
    case "short": ln([[cx, y + 2], [cx, cy]], "ink2", 2); P.circle(c, cx, cy + 3, 3.5, { role: "q1", fill: true }); break;
    case "heavy": case "big": case "lump": P.circle(c, cx, cy, r * 0.72, { role: "q3", fill: true }); break;
    case "light": case "small": P.circle(c, cx, cy, r * 0.32, { role: "q3", fill: true }); break;
    case "near": ln([[x + 3, cy], [cx + 2, cy]], "ink2", 2.5); P.circle(c, cx + 5, cy, 3, { role: "q1", fill: true }); break;
    case "far": ln([[x + 3, cy], [x + s - 6, cy]], "ink2", 2.5); P.circle(c, x + s - 3, cy, 3, { role: "q1", fill: true }); break;
    case "boat": ln([[x + 2, cy], [x + s - 2, cy], [x + s - 6, cy + r * 0.6], [x + 6, cy + r * 0.6], [x + 2, cy]], "q3", 2.5); break;
    case "black": case "white": case "red": case "blue": case "iron": case "steel": case "aluminium": case "copper": case "brass": case "plastic": case "wood": case "graphite": case "rubber": case "wool": case "paper": case "leaf": case "water": case "clay": {
      const m = icon as Material;
      P.fillPath(c, (g) => g.arc(cx, cy, r * 0.62, 0, Math.PI * 2), m, { outline: "ink3", width: 1.2 }); break;
    }
    default: P.circle(c, cx, cy, r * 0.25, { role: "ink3", fill: true });
  }
}

export const makeLabView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<LabParams, LabState, LabAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, lab = labOf(p) as LabDef;
  const L = (x: Record<Lang, string>) => x[lang] ?? x.hinglish;
  const factors = lab.factors;
  let W = 1, Hh = 1;
  let colA: Box = { x: 0, y: 0, w: 0, h: 0 }, colB = colA, mid = colA, res: Box[] = [];
  let rowH = 48, top = 0, titleX = 12, titleY = 20, meterX = 300;
  let runAt = -1, solvedAt = -1;
  const RUN_S = 2.2;
  const looks = new Map<string, number>();
  const pops = new Map<string, number>();

  const st = () => ctl.state;
  const levelLabel = (fid: string, lv: string) => { const f = factors.find((x) => x.id === fid)!; const l = f.levels.find((q) => q.id === lv); return l ? L(l.label) : lv; };
  const levelIcon = (fid: string, lv: string) => factors.find((x) => x.id === fid)!.levels.find((q) => q.id === lv)?.icon ?? "";
  const editable = (fid: string) => p.goal !== "predict" && lab.free.includes(fid) && !st().done;
  const isTime = lab.outcome.better === "less";

  function layout(w: number, h: number): void {
    W = w; Hh = h;
    const pad = 12, maxW = Math.min(w - pad * 2, 860), x0 = (w - maxW) / 2;
    const midW = clamp(maxW * (api.young ? 0.27 : 0.23), api.young ? 88 : 78, 170), cw = (maxW - midW - 16) / 2;
    // the apparatus gets the room it needs to be read (a scene under ~110 px is a postage stamp); the title row carries
    // the fair-test meter (right); the whole block is centred when the box is taller than it needs
    rowH = clamp((h - 40 - 150 - 16) / factors.length, 44, 64);
    const resH = clamp(h - 40 - 12 - rowH * factors.length - 10, 110, 380);
    const used = 40 + resH + 12 + rowH * factors.length, y0 = Math.max(0, Math.floor((h - used) / 2));
    top = y0 + 40 + resH + 12;
    titleY = y0 + 20; meterX = x0 + maxW;
    colA = { x: x0, y: top, w: cw, h: rowH * factors.length };
    mid = { x: x0 + cw + 8, y: top, w: midW, h: rowH * factors.length };
    colB = { x: x0 + cw + 8 + midW + 8, y: top, w: cw, h: rowH * factors.length };
    res = [{ x: colA.x, y: y0 + 40, w: cw, h: resH }, { x: colB.x, y: y0 + 40, w: cw, h: resH }];
    titleX = x0;
  }

  function act(a: LabAct): void { ctl.dispatch(a); deps.changed(); }

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as LabAct | undefined;
    const now = api.t;
    if (last?.kind === "set" && !refused) { pops.set(`${last.setup}:${last.factor}`, now); api.sfx("tap"); }
    if (last?.kind === "run" && !refused) { runAt = now; api.sfx("pour"); }
    for (const m of ms) {
      if (m.kind === "prediction_committed") api.sfx("select");
      if (m.kind === "prediction_confirmed") setTimeout(() => api.sfx("good", 1), 1400);
      if (m.kind === "prediction_violated") setTimeout(() => api.sfx("look"), 1400);
      if (m.kind === "law_refused" || m.kind === "misconception_consequence") { for (const f of H.diffsOf(lab, st().setups)) looks.set(f, now + 1.6); if (m.kind === "law_refused") api.sfx("look"); }
      if (m.kind === "solved") { solvedAt = now; api.sfx("good"); api.fx.flash(api.P.color("good"), 0.07); api.fx.burst(W / 2, top - 20, { n: 14, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" }); }
    }
    if (last?.kind === "undo") runAt = -1;
    api.invalidate(); deps.changed();
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down") return;
    const id = api.hit(x, y); if (!id?.startsWith("chip:")) return;
    const [, si, fid] = id.split(":"); const i = Number(si);
    if (!editable(fid)) { looks.set(fid, api.t + 0.6); api.sfx("refuse"); api.invalidate(); return; }
    const f = factors.find((q) => q.id === fid)!, cur = st().setups[i][fid], k = f.levels.findIndex((l) => l.id === cur);
    act({ kind: "set", setup: i, factor: fid, level: f.levels[(k + 1) % f.levels.length].id });
  }

  function update(): void { /* everything is time-driven from api.t */ }
  const busy = () => (runAt >= 0 && api.t - runAt < RUN_S + 0.5) || [...looks.values()].some((u) => u > api.t) || [...pops.values()].some((t0) => api.t - t0 < 0.3) || (solvedAt >= 0 && api.t - solvedAt < 0.8);

  /** this set-up's own progress through the run (time outcomes: one shared clock, so the faster one finishes first) */
  function progressOf(i: number): number {
    const s = st(); if (!s.results || runAt < 0) return s.results ? 1 : 0;
    const k = clamp((api.t - runAt) / RUN_S, 0, 1);
    if (!isTime) return k;
    // the clock runs until the FASTER set-up finishes: the end frame is the race picture (one done, the other still going)
    const tmin = Math.min(s.results[0], s.results[1]);
    return clamp((k * tmin) / Math.max(s.results[i], 1e-6), 0, 1);
  }
  const binary = BINARY_KINDS.includes(lab.outcome.kind);
  function outcomeWord(v: number): string {
    const k = lab.outcome.kind, en = lang === "en", hi = lang === "hi";
    if (k === "float") return v > 0 ? (en ? "floats" : hi ? "तैरता" : "tairta") : (en ? "sinks" : hi ? "डूबता" : "doobta");
    if (k === "stick") return v > 0 ? (en ? "sticks" : hi ? "चिपका" : "chipka") : (en ? "does not stick" : hi ? "नहीं चिपका" : "nahi chipka");
    if (k === "starch") return v > 0 ? (en ? "blue-black: starch" : hi ? "नीला-काला: स्टार्च" : "neela-kaala: starch") : (en ? "brown: no starch" : hi ? "भूरा: स्टार्च नहीं" : "bhoora: starch nahi");
    if (k === "glow") return v >= 2 ? (en ? "bright" : hi ? "तेज़" : "tez") : v >= 1 ? (en ? "dim" : hi ? "हल्की" : "halki") : (en ? "off" : hi ? "बंद" : "band");
    return "";
  }
  function drawResult(c: CanvasRenderingContext2D, i: number): void {
    const P = api.P, b = res[i], s = st(), now = api.t;
    P.body(c, b.x, b.y, b.w, b.h, { role: "panel", r: 14, state: s.predicted === (i ? "B" : "A") ? "selected" : "idle" });
    P.text(c, i ? "B" : "A", b.x + 16, b.y + 18, { size: 18, weight: 800, font: "display", role: "ink2" });
    const pg = progressOf(i);
    // a narrow card (a phone) puts its label on its own full-width row under the letter, with room for two lines
    const narrow = b.w < 200, hdr = narrow ? 70 : 36;
    const lx = narrow ? b.x + b.w / 2 : b.x + b.w - 10, ly2 = narrow ? b.y + 48 : b.y + 18, lw = narrow ? b.w - 14 : b.w - 52, lalign: CanvasTextAlign = narrow ? "center" : "right";
    const drew = drawScene({ P, c, x: b.x + 6, y: b.y + hdr + 2, w: b.w - 12, h: b.h - hdr - 8, setup: s.setups[i], p: pg, ran: !!s.results, v: s.results ? s.results[i] : null, lab, t: now, reduced: api.reduced, seed: i * 7 + 1 });
    if (drew) {
      if (!s.results) { P.textFit(c, L(lab.outcome.label), lx, ly2, lw, narrow ? 40 : 30, { size: 14, role: "ink3", weight: 600, align: lalign }); return; }
      const v = s.results[i], done = pg >= 1, about = !binary && lab.outcome.kind !== "glow" && !lab.exact;
      const runOver = runAt < 0 || api.t - runAt >= RUN_S;
      const num = `${done || (isTime && runOver) ? v : isTime ? "…" : Math.round(v * ease.out(pg))} ${L(lab.outcome.unit)}`.trim();
      const label = binary || lab.outcome.kind === "glow" ? (done ? outcomeWord(v) : "…") : about && (done || runOver) ? `${lang === "en" ? "about" : lang === "hi" ? "लगभग" : "lagbhag"} ${num}` : num;
      const win = (done || runOver) && H.winner(lab, s.results[0], s.results[1]) === (i ? "B" : "A");
      P.textFit(c, label, lx, ly2, narrow ? lw : b.w - (win ? 62 : 40), narrow ? 40 : 30, { size: clamp(b.w * 0.085, 15, 22), weight: 800, font: "ui", align: lalign });
      if (win) P.tick(c, b.x + 38, b.y + 18, 16, clamp((now - runAt - RUN_S) / 0.3 + (runAt < 0 ? 1 : 0), 0, 1));
      return;
    }
    if (!s.results) { P.text(c, L(lab.outcome.label), b.x + b.w / 2, b.y + b.h / 2 + 6, { size: 14, role: "ink3", maxW: b.w - 16 }); return; }
    const v = s.results[i], other = s.results[1 - i], k = runAt < 0 ? 1 : clamp((now - runAt) / 1.4, 0, 1);
    const bx = b.x + 14, bw = b.w - 28, by = b.y + b.h - 34, bh = 14;
    if (lab.outcome.kind === "float") {
      // a tank: floats rise to the top, sinkers settle at the bottom
      const tx = b.x + b.w / 2 - 26, ty = b.y + 30, th = b.h - 44;
      P.stroke(c, [[tx, ty], [tx, ty + th], [tx + 52, ty + th], [tx + 52, ty]], { role: "ink3", width: 2 });
      c.save(); c.globalAlpha = 0.35; c.fillStyle = P.color("q2"); c.fillRect(tx + 1, ty + 10, 50, th - 11); c.restore();
      const yEnd = v > 0 ? ty + 10 : ty + th - 14, yy = lerp(ty + th * 0.4, yEnd, ease.out(k));
      P.body(c, tx + 14, yy - 7, 24, 14, { role: "q3", r: 5 });
      if (k >= 1) P.text(c, v > 0 ? (lang === "en" ? "floats" : lang === "hi" ? "तैरता" : "tairta") : (lang === "en" ? "sinks" : lang === "hi" ? "डूबता" : "doobta"), b.x + b.w / 2, b.y + 18, { size: 15, weight: 700 });
      return;
    }
    let fill: number;
    if (isTime) { const tmax = Math.max(v, other); fill = clamp((k * tmax) / Math.max(v, 1e-6), 0, 1); }
    else fill = (v / lab.outcome.max) * ease.out(k);
    P.body(c, bx, by, bw, bh, { role: "panel", r: 7 });
    if (fill > 0.01) P.body(c, bx, by, Math.max(10, bw * fill), bh, { role: i ? "q2" : "q1", r: 7 });
    const shown = isTime ? (fill >= 1 ? v : Math.round(k * Math.max(v, other))) : Math.round(v * ease.out(k));
    // the number sits on the card's top row (right of the set-up's letter); the bar (a tray, for counts) at the bottom
    P.text(c, `${isTime && fill < 1 ? "…" : shown} ${L(lab.outcome.unit)}`, b.x + b.w - 12, b.y + 18, { size: clamp(b.h * 0.2, 17, 28), weight: 800, font: "mono", align: "right", maxW: b.w - 48 });
    if (lab.outcome.kind === "count" && lab.outcome.max <= 12) { const n2 = Math.round(v * ease.out(k)), stepX = bw / lab.outcome.max; for (let q = 0; q < n2; q++) { const sx = bx + stepX * (q + 0.5), sh = Math.min(22, by - b.y - 40); P.stroke(c, [[sx, by], [sx, by - sh]], { role: "q4", width: 2.5 }); P.circle(c, sx + 3, by - sh, 3.5, { role: "q4", fill: true }); P.circle(c, sx - 3, by - sh + 4, 3, { role: "q4", fill: true }); } }
    if (k >= 1 && H.winner(lab, s.results[0], s.results[1]) === (i ? "B" : "A")) P.tick(c, b.x + b.w - 20, b.y + 18, 16, clamp((now - runAt - 1.4) / 0.3, 0, 1));
  }

  function draw(c: CanvasRenderingContext2D): void {
    drawResult(c, 0); drawResult(c, 1);
    drawRows(c);
  }
  /** While only the apparatus animates (a run, a solved settle), the stage repaints just the two cards (dirty rects). */
  function dirty(): { x: number; y: number; w: number; h: number }[] | null {
    const now = api.t;
    const rowsMoving = [...looks.values()].some((u) => u > now) || [...pops.values()].some((t0) => now - t0 < 0.3) || (solvedAt >= 0 && now - solvedAt < 0.8);
    if (rowsMoving || !(runAt >= 0 && now - runAt < RUN_S + 0.5)) return null;
    return res.map((b) => ({ x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12 }));
  }
  function drawRows(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), now = api.t;
    const target = (id: string, x: number, y: number, w: number, h: number) => api.target(id, x, y, w, h);
    P.text(c, L(lab.title), titleX + 4, titleY, { size: 16, weight: 800, role: "ink2", align: "left", font: "display" });
    const diffs = H.diffsOf(lab, s.setups);
    factors.forEach((f, r) => {
      const y = top + r * rowH, differs = diffs.includes(f.id), look = (looks.get(f.id) ?? 0) > now;
      if (differs) P.body(c, colA.x - 4, y + 2, colB.x + colB.w - colA.x + 8, rowH - 4, { role: "panel", r: 12, state: look ? "look" : "hover" });
      P.textFit(c, L(f.label), mid.x + mid.w / 2, y + rowH / 2, mid.w - 4, rowH - 4, { size: 14, weight: f.id === p.test ? 800 : 600, role: f.id === p.test ? "ink" : "ink2" });
      for (const [i, col] of [[0, colA], [1, colB]] as const) {
        const lv = s.setups[i][f.id], t0 = pops.get(`${i}:${f.id}`), pk = t0 !== undefined ? ease.back(clamp((now - t0) / 0.25, 0, 1)) : 1;
        const bx = col.x + 4, by = y + 6, bw = col.w - 8, bh = rowH - 12;
        c.save(); const cx = bx + bw / 2, cy = by + bh / 2; c.translate(cx, cy); c.scale(0.9 + 0.1 * pk, 0.9 + 0.1 * pk); c.translate(-cx, -cy);
        P.body(c, bx, by, bw, bh, { role: "panel", r: 10, state: editable(f.id) ? "idle" : "dim" });
        const icon = bw >= 140;                       // a narrow chip spends its width on the words, not the glyph
        if (icon) glyph(P, c, levelIcon(f.id, lv), bx + 6, by + (bh - 22) / 2, 22);
        // an editable condition says so by shape: a small "next" chevron at its right edge (tap cycles the level)
        if (editable(f.id)) P.stroke(c, [[bx + bw - 14, by + bh / 2 - 6], [bx + bw - 8, by + bh / 2], [bx + bw - 14, by + bh / 2 + 6]], { role: "ink2", width: 2 });
        const tx = bx + (icon ? 32 : 10), tw = bw - (icon ? 32 : 10) - (editable(f.id) ? 20 : 8);
        P.textFit(c, levelLabel(f.id, lv), tx, by + bh / 2, tw, bh - 4, { size: 15, weight: 700, align: "left" });
        c.restore();
        target(`chip:${i}:${f.id}`, bx, by - 2, bw, Math.max(44, bh + 4));
      }
    });
    // the fair-test meter: how many conditions differ (one = a fair test)
    // the fair-test meter, top right: the dots (one per condition, lit when it differs) and the count
    const label = diffs.length === 0 ? (lang === "en" ? "nothing differs" : lang === "hi" ? "कुछ अलग नहीं" : "kuch alag nahi") : say(lang, "lab.differ", { n: diffs.length });
    const mrole: Role | undefined = diffs.length === 1 ? "good" : diffs.length > 1 ? "look" : undefined;
    c.save(); c.font = `700 15px ${api.art.font.ui}`; const lw = c.measureText(label).width; c.restore();
    const chipW = lw + 18, dotsW = factors.length * 13, mx = meterX - chipW / 2;
    P.chip(c, label, mx, titleY, { size: 15, role: mrole, font: "ui" });
    for (let q = 0; q < factors.length; q++) P.circle(c, mx - chipW / 2 - dotsW + 6 + q * 13, titleY, 4, { role: q < diffs.length ? (mrole ?? "ink3") : "ink3", fill: q < diffs.length });

  }

  function goal(): string {
    const tf = factors.find((f) => f.id === p.test)!, s = st();
    // the goal line follows the beat: set up → predict → run → conclude (a stale "think first" after the run was a defect)
    if (s.results && !s.done) return say(lang, "lab.goal.conclude");
    if (s.predicted !== null && !s.results) return say(lang, "lab.goal.run", { run: L(lab.outcome.runLabel) });
    if (p.goal === "fair") return say(lang, "lab.goal.fair", { f: L(tf.label).toLowerCase() });
    if (p.goal === "golu") return say(lang, "lab.goal.golu");
    if (binary) return say(lang, "lab.goal.predict.bin", { q: L(lab.outcome.label) });
    return isTime ? say(lang, "lab.goal.predict.less") : say(lang, "lab.goal.predict", { noun: L(lab.noun) });
  }
  function readouts(): Readout[] { const s = st(); return s.predicted ? [{ k: say(lang, "think"), v: s.predicted === "same" ? "=" : s.predicted }] : []; }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    const more = isTime ? (lang === "en" ? "first" : lang === "hi" ? "पहले" : "pehle") : (lang === "en" ? "more" : lang === "hi" ? "ज़्यादा" : "zyada");
    // a fair test is SET UP first: no prediction until the two set-ups differ (the goal line says what to change)
    if (s.predicted === null && p.goal === "fair" && H.diffsOf(lab, s.setups).length === 0) {
      out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
      return out;
    }
    if (s.predicted === null) {
      // yes/no outcomes: "only A", "both alike", "only B" (the law's "same" covers both-yes and both-no)
      const lab3 = binary ? [say(lang, "lab.onlyA"), say(lang, "lab.alike"), say(lang, "lab.onlyB")] : [`A ${more}`, say(lang, "lab.same"), `B ${more}`];
      out.push({ id: "predict-A", label: lab3[0], kind: "choice", group: "predict", onPress: () => act({ kind: "predict", choice: "A" }) });
      out.push({ id: "predict-same", label: lab3[1], kind: "choice", group: "predict", onPress: () => act({ kind: "predict", choice: "same" }) });
      out.push({ id: "predict-B", label: lab3[2], kind: "choice", group: "predict", onPress: () => act({ kind: "predict", choice: "B" }) });
    } else if (!s.results) {
      out.push({ id: "run", label: `${say(lang, "lab.run")} · ${L(lab.outcome.runLabel)}`, kind: "primary", group: "go", you: true, onPress: () => act({ kind: "run" }) });
    } else {
      for (const f of s.ranDiffs ?? []) out.push({ id: `conclude-${f}`, label: say(lang, "lab.because", { f: L(factors.find((x) => x.id === f)!.label).toLowerCase() }), kind: "choice", group: "conclude", onPress: () => act({ kind: "conclude", factor: f }) });
      out.push({ id: "conclude-none", label: say(lang, "lab.none"), kind: "choice", group: "conclude2", onPress: () => act({ kind: "conclude", factor: "none" }) });
      out.push({ id: "conclude-cant", label: say(lang, "lab.canttell"), kind: "choice", group: "conclude2", onPress: () => act({ kind: "conclude", factor: "cant_tell" }) });
    }
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => false, dirty };
  void Hh;
  return view;
};
