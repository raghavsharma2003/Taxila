// Galti Pakdo · the 2D view (round 7, checking a friend's working; class 7). Nothing here runs on a clock: every change
// waits for the child's tap, and the animations only show what the law has already answered.
//   the taraazu (borrowed from taraazu/balance.view.ts: a beam on a pivot with a damped spring, pans on strings, the level
//          needle): a line's ⚖ puts the claim x = v into THAT line; each pan carries a weight with its side's value and,
//          under it, the side written with v put in. The beam tips by the true values, so the question line tells the
//          truth and a later line may hide the mistake (it balances while the question tips: the magnifier then sits on the
//          question's ⚖)
//   the notebook: "<friend> ne aise kiya:", the question (line 0, boxed) and the working lines; tap a working line to say it
//          is the first that breaks; at look 1 the friend's step is written beside each line (−5, ÷3, 2 × ( ))
//   mend (sudhaaro): once the first wrong line is caught, three lines are offered where the balance was; the one tapped takes
//          its place, the law rewrites the lines below it, and the new claim is weighed in the question
// After a wrong move only magnifiers mark what to look at again (never the key, never a cross).
import type { GaltiAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { BUG_OF, lineText, pageOf, qText, subText, tiltAt, valueAt, workingOf, type Eq, type GaltiParams, type GaltiState } from "./galti.logic.ts";

const MAXA = 0.13;   // rad: the beam's full tilt

export const makeGaltiView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<GaltiParams, GaltiState, GaltiAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  // the friend's name: filled at serve time; the dev harness (no server) shows one of the same names
  const who = p.who.includes("{") ? (p.who === "{friendM}" ? "Kabir" : "Meera") : p.who;
  let w = 360, h = 400;
  let ang = 0, vel = 0;
  let checkAt = -1, fixAt = -1, lookAt = -1, doneAt = -1, landed = true, cheered = false;
  let scroll = 0, maxScroll = 0;
  let down: { x: number; y: number; s0: number; moved: boolean } | null = null;
  const keyOf = (s: GaltiState) => { const pg = pageOf(p, s); return { bal: `${s.on}:${pg.answer}`, page: pg.lines.map(lineText).join("|") }; };
  let shownBal = keyOf(st()).bal, shownPage = keyOf(st()).page, shownWhy = "";

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const choosing = () => { const s = st(); return p.goal === "sudhaaro" && s.flag === p.at && s.fix < 0 && !s.done && p.kind !== "sahi"; };
  /** the frame's geometry: the top panel (the balance, or the offered lines), the notebook rows; content may scroll */
  function geo() {
    const s = st(), pg = pageOf(p, s), ch = choosing();
    const cw = Math.min(w - 16, 560), x0 = (w - cw) / 2;
    const rows = ch ? s.flag + 1 : pg.lines.length;
    const offerH = 46, panelH = ch ? 24 + 3 * offerH + 2 * 6 + 4 : clamp(h * 0.33, 116, 168);
    const headH = 24;
    const rowH = clamp((h - 6 - panelH - 6 - headH - 6) / Math.max(rows, 4), 46, h > 520 ? 68 : 60);
    // spare height (a tall phone, the laptop) is shared above and below, up to 40 px each
    const natural = panelH + 6 + headH + rows * rowH + 12, top = natural < h ? 6 + Math.min((h - natural) / 2, 40) : 6;
    const content = top + panelH + 6 + headH + rows * rowH + 6;
    maxScroll = Math.max(0, content - h);
    scroll = clamp(scroll, 0, maxScroll);
    const y0 = top - scroll, headY = y0 + panelH + 6, rowY = headY + headH;
    return { s, pg, ch, cw, x0, rows, offerH, panelH, y0, headY, headH, rowY, rowH };
  }
  type G = ReturnType<typeof geo>;

  const act = (a: GaltiAct) => { ctl.dispatch(a); deps.changed(); };
  function react(ms: Moment[], refused: string | undefined): void {
    const s = st(), k = keyOf(s), now = api.t;
    if (k.page !== shownPage) { shownPage = k.page; fixAt = now; }
    if (k.bal !== shownBal) {
      shownBal = k.bal;
      // a rewritten working is weighed once its lines have been written
      checkAt = api.reduced ? now - 10 : fixAt === now ? now + 0.5 : now;
      landed = s.on < 0;
    }
    if (s.why !== shownWhy) { shownWhy = s.why; if (s.why) lookAt = now; }
    for (const m of ms) if (m.kind === "solved") { doneAt = s.on >= 0 && checkAt > now - 0.45 ? checkAt + 0.45 : now; cheered = false; }
    if (refused === "same_line" || refused === "same_fix") api.sfx("refuse");
    else if (refused) { api.sfx("look"); if (refused !== "tips" && refused !== "not_all") api.fx.shake(2); }
    else { const last = ctl.acts[ctl.acts.length - 1]?.act as GaltiAct | undefined; api.sfx(last?.kind === "flag" ? "select" : last?.kind === "fix" ? "slide" : "tap"); }
    api.invalidate(); deps.changed();
  }

  /** the beam's goal angle: level until the claim lands in the pans, then the true tilt */
  function target(): number {
    const s = st();
    if (s.on < 0 || api.t - checkAt < 0.45) return 0;
    const pg = pageOf(p, s);
    return tiltAt(pg.lines[s.on], pg.answer) * MAXA;
  }
  function update(dt: number): void {
    const tg = target();
    if (api.reduced) { ang = tg; vel = 0; }
    else { const acc = 60 * (tg - ang) - 9 * vel; vel += acc * dt; ang += vel * dt; }
    if (!landed && api.t - checkAt >= 0.45) { landed = true; api.sfx(tg === 0 ? "land" : "tilt"); }
    if (doneAt >= 0 && !cheered && api.t >= doneAt) {
      cheered = true; api.sfx("good");
      api.fx.burst(w / 2, Math.min(h * 0.3, 120), { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
      deps.changed();
    }
  }
  const busy = () => Math.abs(ang - target()) > 0.0015 || Math.abs(vel) > 0.003 || (checkAt >= 0 && api.t - checkAt < 1.6) || (fixAt >= 0 && api.t - fixAt < 1.2) || (lookAt >= 0 && api.t - lookAt < 1) || (doneAt >= 0 && api.t - doneAt < 0.8);

  // ── input: taps (on release); a drag scrolls the page when it is taller than the box ──
  function tap(x: number, y: number): void {
    const id = api.hit(x, y);
    if (!id) return;
    const n = Number(id.slice(4));
    if (id.startsWith("chk-")) act({ kind: "check", line: n });
    else if (id.startsWith("row-")) act({ kind: "flag", line: n });
    else if (id.startsWith("fix-")) act({ kind: "fix", i: n });
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) { down = null; return; }
    if (kind === "down") { down = { x, y, s0: scroll, moved: false }; return; }
    if (kind === "move" && down) {
      const dy = y - down.y;
      if (maxScroll > 0 && (down.moved || Math.abs(dy) > 10)) { down.moved = true; scroll = clamp(down.s0 - dy, 0, maxScroll); api.invalidate(); }
      return;
    }
    if (kind === "up" && down) { const d = down; down = null; if (!d.moved) tap(d.x, d.y); return; }
    if (kind === "cancel") down = null;
  }
  const dragging = () => !!down?.moved;

  // ── drawing ──
  /** the little taraazu on a line's check button */
  function scaleIcon(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, role: "ink" | "ink2" | "look" | "good"): void {
    const P = api.P;
    P.stroke(c, [[cx, cy - s * 0.42], [cx, cy + s * 0.36]], { role, width: 2 });
    P.stroke(c, [[cx - s * 0.5, cy - s * 0.3], [cx + s * 0.5, cy - s * 0.3]], { role, width: 2 });
    P.stroke(c, [[cx - s * 0.2, cy + s * 0.38], [cx + s * 0.2, cy + s * 0.38]], { role, width: 2 });
    for (const sx of [-1, 1]) P.stroke(c, [[cx + sx * s * 0.5 - s * 0.2, cy + s * 0.02], [cx + sx * s * 0.5, cy - s * 0.3], [cx + sx * s * 0.5 + s * 0.2, cy + s * 0.02], [cx + sx * s * 0.5 - s * 0.2, cy + s * 0.02]], { role, width: 1.6 });
  }
  function drawBalance(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = g.s, pg = g.pg, v = pg.answer, now = api.t;
    const x0 = g.x0, y0 = g.y0, cw = g.cw, ph = g.panelH;
    const panW = Math.min(cw * 0.4, 170), half = Math.min(cw * 0.3, cw / 2 - panW / 2 - 4), hang = clamp(ph * 0.3, 32, 52);
    const pivot = { x: x0 + cw / 2, y: y0 + 34 };
    const end = (side: -1 | 1) => ({ x: pivot.x + side * half * Math.cos(ang), y: pivot.y + side * half * Math.sin(ang) });
    // the stand
    const baseY = y0 + ph - 6;
    P.stroke(c, [[pivot.x, pivot.y], [pivot.x, baseY]], { role: "ink3", width: 5 });
    P.body(c, pivot.x - 34, baseY - 4, 68, 8, { role: "panel", r: 4 });
    // the level needle (centred and good = level)
    P.stroke(c, [[pivot.x - 20, pivot.y - 22], [pivot.x, pivot.y - 29], [pivot.x + 20, pivot.y - 22]], { role: "ink3", width: 2, alpha: 0.7 });
    const level = s.on >= 0 && Math.abs(ang) < 0.01 && now - checkAt >= 0.45;
    P.stroke(c, [[pivot.x, pivot.y], [pivot.x + Math.sin(ang) * 30, pivot.y - Math.cos(ang) * 30]], { role: level ? "good" : s.on >= 0 ? "look" : "ink3", width: 3 });
    const L = end(-1), R = end(1);
    P.stroke(c, [[L.x, L.y], [R.x, R.y]], { role: "ink", width: 6 });
    P.circle(c, pivot.x, pivot.y, 7, { role: "ink", fill: true });
    // the claim (top left) and the line it is weighed in (top right)
    const claim = `x = ${v}`;
    const cl = { x: x0 + 8 + claim.length * 5.4 + 12, y: y0 + 16 };
    P.chip(c, claim, cl.x, cl.y, { size: 16, role: s.why === "neat" || s.why === "tips" ? "look" : undefined });
    if ((s.why === "neat" || s.why === "tips") && now - lookAt >= 0.2) P.magnifier(c, cl.x + claim.length * 5.4 + 26, cl.y + 2, 18);
    if (s.on >= 0) {
      const tag = s.on === 0 ? W("galti-pakdo.question") : W("galti-pakdo.line", { n: s.on });
      P.chip(c, tag, x0 + cw - 8 - tag.length * 5 - 12, y0 + 16, { size: 15, font: "ui", role: s.on === 0 ? undefined : "look" });
    }
    const age = now - checkAt, flown = s.on >= 0 && age >= 0.45;
    const eq: Eq | null = s.on >= 0 ? pg.lines[s.on] : null;
    for (const side of [-1, 1] as const) {
      const e = side === -1 ? L : R, plateY = e.y + hang, px = e.x - panW / 2;
      P.stroke(c, [[e.x, e.y], [px + 10, plateY]], { role: "ink3", width: 1.5, alpha: 0.55 });
      P.stroke(c, [[e.x, e.y], [px + panW - 10, plateY]], { role: "ink3", width: 1.5, alpha: 0.55 });
      P.body(c, px, plateY, panW, 8, { role: "panel", r: 4 });
      if (!eq) continue;
      const ex = side === -1 ? eq.L : eq.R, val = qText(valueAt(ex, v));
      if (flown) {
        const bw = Math.max(52, val.length * 12 + 18), bh = 30;
        P.body(c, e.x - bw / 2, plateY - bh, bw, bh, { role: side === -1 ? "q1" : "q2", r: 6, seed: side + 3 });
        P.text(c, val, e.x, plateY - bh / 2, { size: 18, on: side === -1 ? "q1" : "q2", weight: 800, font: "mono" });
      } else if (age >= 0) {
        // the claim flies into both pans
        const k = ease.out(clamp((api.t - checkAt) / 0.45, 0, 1));
        P.chip(c, String(v), lerp(cl.x, e.x, k), lerp(cl.y, plateY - 14, k), { size: 16, role: "you" });
      }
      P.textFit(c, subText(ex, v), e.x, plateY + 20, panW + 8, 22, { size: 16, role: "ink2", weight: 700, font: "mono" });
    }
    if (flown && s.on > 0 && s.why === "later" && level) P.text(c, "=", pivot.x, pivot.y + hang * 0.75, { size: 18, role: "ink2", weight: 800, font: "mono" });
  }
  function drawOffers(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = g.s;
    P.text(c, W("galti-pakdo.instead", { n: p.at }), g.x0 + 4, g.y0 + 12, { size: 16, role: "ink2", weight: 700, align: "left" });
    p.fixes.forEach((key, i) => {
      const y = g.y0 + 24 + i * (g.offerH + 6), line = workingOf(p, key)!.lines[p.at];
      api.target(`fix-${i}`, g.x0, y, g.cw, g.offerH);
      P.body(c, g.x0, y, g.cw, g.offerH, { role: "panel", r: 10, seed: 60 + i, state: "idle" });
      P.textFit(c, lineText(line), g.x0 + g.cw / 2, y + g.offerH / 2, g.cw - 20, g.offerH - 6, { size: 20, role: "ink", weight: 700, font: "mono" });
    });
    void s;
  }
  function drawBook(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = g.s, pg = g.pg, now = api.t, x0 = g.x0, cw = g.cw, rh = g.rowH;
    P.text(c, W("galti-pakdo.wrote", { name: who }), x0 + 4, g.headY + g.headH / 2, { size: 16, role: "ink2", weight: 700, align: "left" });
    // the margin
    P.stroke(c, [[x0 + 22, g.rowY], [x0 + 22, g.rowY + g.rows * rh]], { role: "look", width: 1, alpha: 0.35 });
    const rewrite = fixAt >= 0 ? clamp((api.t - fixAt) / 0.5, 0, 1) : 1;
    // the working is written with its "=" signs in one column, as in a notebook (a mono font: every character one width)
    const texts = pg.lines.slice(0, g.rows).map(lineText), eqAt = texts.map((t) => t.indexOf(" = "));
    const leftN = Math.max(...eqAt), rightN = Math.max(...texts.map((t, j) => t.length - eqAt[j])), noteMax = p.look === 1 || s.why === "follows" ? Math.max(0, ...pg.notes.slice(1, g.rows).map((n) => n.length * 9 + 32)) : 0;
    const xa = x0 + 32, xb = x0 + cw - 56 - noteMax;
    let fs = clamp(rh * 0.42, 18, 24);
    c.save(); c.font = `700 ${fs}px ${api.art.font.mono}`; let chW = c.measureText("0").width; c.restore();
    if ((leftN + rightN) * chW > xb - xa) { fs = Math.max(16, Math.floor((fs * (xb - xa)) / ((leftN + rightN) * chW))); chW *= fs / clamp(rh * 0.42, 18, 24); }
    const xs = xa + Math.max(0, (xb - xa - (leftN + rightN) * chW) / 2), blockEnd = xs + (leftN + rightN) * chW;
    for (let j = 0; j < g.rows; j++) {
      const y = g.rowY + j * rh, cy = y + rh / 2;
      const flagged = s.flag === j, tried = s.tried === j && (s.why === "follows" || s.why === "not_first");
      const fresh = s.fix >= 0 && j >= p.at;
      P.stroke(c, [[x0, y + rh], [x0 + cw, y + rh]], { role: "ink3", width: 1, alpha: 0.3 });
      // the question: boxed and double-underlined, as it is copied at the top of a notebook page
      if (j === 0) {
        P.body(c, x0 + 26, y + 5, cw - 26 - 54, rh - 10, { role: "panel", r: 8, seed: 5 });
        P.stroke(c, [[x0 + 40, y + rh - 9], [x0 + cw - 70, y + rh - 9]], { role: "ink2", width: 1.2, alpha: 0.6 });
      }
      else if (flagged || tried) P.body(c, x0 + 26, y + 4, cw - 26 - 54, rh - 8, { role: "panel", r: 8, seed: 20 + j, state: flagged && s.done ? "good" : "look" });
      if (j > 0) {
        if (!(flagged && s.done)) P.text(c, String(j), x0 + 11, cy, { size: 14, role: "ink3", weight: 700, font: "mono" });
        if (!s.done && !(g.ch && j > s.flag)) api.target(`row-${j}`, x0, y, cw - 54, rh);
      }
      // the friend's step beside the line (look 1, and the line a "follows" answer was about)
      const note = j > 0 && (p.look === 1 || (tried && s.why === "follows")) ? pg.notes[j] : "";
      const noteW = note ? note.length * 9 + 22 : 0;
      const textRole = fresh && j === p.at ? (s.done ? "good" : "look") : "ink";
      const alpha = fresh ? rewrite : 1;
      c.save(); c.globalAlpha *= alpha;
      P.text(c, texts[j], xs + (leftN - eqAt[j]) * chW, cy, { size: fs, role: textRole, weight: j === 0 ? 800 : 700, font: "mono", align: "left", maxW: x0 + cw - 56 - (xs + (leftN - eqAt[j]) * chW) });
      c.restore();
      if (note) P.chip(c, note, Math.min(blockEnd + 10 + noteW / 2, x0 + cw - 56 - noteW / 2), cy, { size: 15, role: tried ? "look" : "ink2" });   // round 8 law 1: her wrong pick takes the mix-up colour
      // the check button
      const bx = x0 + cw - 50, by = y + (rh - 44) / 2;
      if (!s.done) api.target(`chk-${j}`, bx, by, 50, 44);
      P.body(c, bx + 3, by + 2, 44, 40, { role: "panel", r: 8, seed: 40 + j, state: s.on === j ? "selected" : "idle" });
      scaleIcon(c, bx + 25, by + 22, 24, s.on === j ? "ink" : "ink2");
      const pop = clamp((api.t - lookAt) / 0.3, 0, 1);
      if (j === 0 && (s.why === "later" || s.why === "check_first")) P.magnifier(c, bx - 14, cy - 4, 14 + 6 * pop);
      if (tried && s.why === "not_first") { P.magnifier(c, x0 + 11, y + 6, 14 + 4 * pop); P.stroke(c, [[x0 + 11, y + rh - 8], [x0 + 11, y + 14]], { role: "look", width: 2 }); }
      if (fresh && j === p.at && (s.why === "tips" || s.why === "not_all")) P.magnifier(c, x0 + cw - 66, cy - 8, 16);
      if (flagged && s.done) P.tick(c, x0 + 12, cy, 18, clamp((api.t - doneAt) / 0.3, 0, 1));
    }
    // the steps were not read: a bracket along the working lines, the magnifier at its middle
    if (s.why === "lucky" && g.rows > 1) {
      const ya = g.rowY + rh + 6, yb = g.rowY + g.rows * rh - 6;
      P.stroke(c, [[x0 + 4, ya], [x0 + 1, ya], [x0 + 1, yb], [x0 + 4, yb]], { role: "look", width: 2.5 });
      // on the bracket's top, between the question and line 1 (never over a line's number)
      P.magnifier(c, x0 + 12, ya - 4, 16);
    }
    void now;
  }
  function draw(c: CanvasRenderingContext2D): void {
    const g = geo();
    if (g.ch) drawOffers(c, g); else drawBalance(c, g);
    drawBook(c, g);
    // all correct: the tick sits on the balance, by the needle
    if (g.s.done && p.kind === "sahi" && doneAt >= 0) api.P.tick(c, g.x0 + g.cw / 2 + 44, g.y0 + 12, 22, clamp((api.t - doneAt) / 0.3, 0, 1));
  }

  function goal(): string {
    const s = st(), v = pageOf(p, s).answer;
    if (s.done) return p.kind === "sahi" ? W("galti-pakdo.done.sahi", { v }) : W(`galti-pakdo.bug.${BUG_OF[p.bug]}`, { name: who, n: p.at });
    if (s.why) return W(`galti-pakdo.why.${s.why}`, { v, n: s.tried > 0 ? s.tried : s.on });
    if (choosing()) return W("galti-pakdo.choose", { n: p.at });
    return W(`galti-pakdo.goal.${p.goal}`, { name: who });
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    return [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      // never "your move": the button must not hint which workings are all correct
      { id: "sab", label: W("galti-pakdo.sab"), aria: W("galti-pakdo.sab"), kind: "primary", group: "go", onPress: () => act({ kind: "sab" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal, readouts, controls, react };
  return view;
};
