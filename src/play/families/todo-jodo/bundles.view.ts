// Todo-Jodo · bundles, the view (DESIGN.md §3.1). Place-value columns of real blocks: cubes (ones), rods of ten, flats of
// a hundred, plates of a thousand, crates of ten thousand. Taking more than a column holds is refused by the law and the
// column shows why (it simply has too few); opening one bigger block cracks it into ten that tumble into the column to
// its right: the amount never changes, only its form. Fade 2 rides the digits (with borrow marks) on the columns; fade 3
// is the written column itself, digit by digit.
import type { BundlesAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { withAlpha, type Role } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { bundlesHelpers as H, type BundlesParams, type BundlesState } from "./bundles.logic.ts";

interface Box { x: number; y: number; w: number; h: number }
interface D { x: number; y: number; s: number; a: number }
interface Gone { q: number; x: number; y: number; w: number; h: number; t0: number }

const ROLE: Role[] = ["q2", "q1", "q3", "q4", "q2", "q1"];
const ASPECT = [1, 0.28, 1, 1, 1, 1];                 // block w : h (a rod of ten is tall and thin)

export const makeBundlesView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<BundlesParams, BundlesState, BundlesAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, P0 = p.places, fade3 = level.fade === 3;
  const B = H.digitsOf(p.b, P0), A = H.digitsOf(p.a, P0);
  const names = say(lang, "bundles.places").split("|").reverse();       // ones first
  let W = 1, Hh = 1;
  let cols: Box[] = [];
  let area: Box[] = [];
  let sel = 0;                         // selected place (0 = ones)
  let wsel = 0;                        // fade 3: the answer box being written
  const disp = new Map<string, D>();   // "q:i" → displayed block
  const gone: Gone[] = [];
  const looks = new Map<number, number>();
  const cracks = new Map<number, number>();
  let solvedAt = -1;
  let prevCols = [...ctl.state.cols];

  const st = () => ctl.state;
  const placeName = (q: number) => names[q] ?? `10^${q}`;

  function blockSize(q: number, n: number, box: Box): { w: number; h: number; per: number } {
    const asp = ASPECT[q] ?? 1, gap = 4;
    for (let s = Math.min(box.w * 0.46, 34); s >= 6; s -= 1) {
      const w = q === 1 ? s * 0.62 : s, h = q === 1 ? s * 2.2 : s * (1 / asp > 1 ? 1 : 1);
      const per = Math.max(1, Math.floor((box.w + gap) / (w + gap)));
      const rows = Math.ceil(Math.max(1, n) / per);
      if (rows * (h + gap) <= box.h) return { w, h, per };
    }
    return { w: 6, h: 6, per: Math.max(1, Math.floor(box.w / 10)) };
  }
  function blockBox(q: number, i: number, n: number): Box {
    const box = area[q], { w, h, per } = blockSize(q, Math.max(n, 10), box), gap = 4;
    const row = Math.floor(i / per), col = i % per;
    const rowW = Math.min(per, Math.max(n, 1)) * (w + gap) - gap;
    return { x: box.x + (box.w - rowW) / 2 + col * (w + gap), y: box.y + box.h - (row + 1) * (h + gap), w, h };
  }

  function layout(w: number, h: number): void {
    W = w; Hh = h;
    const pad = 10, cw = (Math.min(w, 900) - pad * 2) / P0, x0 = (w - cw * P0) / 2;
    // fade 2: the written twin grows UNDER the wells (top digits with the child's own borrow marks, − the bottom number,
    // the answer digit of a column appearing once that column is done): the symbol is built by the acts, live
    const head = fade3 ? 0 : 34, foot = !fade3 && level.fade >= 2 ? Math.min(150, Math.max(110, h * 0.26)) : 58;
    const ah = Math.min(h - pad * 2 - head - foot, 380), y0 = Math.max(pad, (h - (head + ah + foot)) / 2);
    cols = []; area = [];
    for (let k = 0; k < P0; k++) {
      const q = P0 - 1 - k;   // leftmost column is the biggest place
      cols[q] = { x: x0 + k * cw, y: y0, w: cw, h: head + ah + foot };
      area[q] = { x: x0 + k * cw + 5, y: y0 + head, w: cw - 10, h: ah };
    }
    for (let q = 0; q < P0; q++) for (let i = 0; i < st().cols[q]; i++) { const k = `${q}:${i}`; if (!disp.has(k)) { const b = blockBox(q, i, st().cols[q]); disp.set(k, { x: b.x, y: b.y, s: 1, a: 1 }); } }
  }

  function act(a: BundlesAct): void { ctl.dispatch(a); deps.changed(); }

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as BundlesAct | undefined;
    const now = api.t, cur = st().cols;
    if (last?.kind === "unbundle" && !refused) {
      const q = last.place, src = blockBox(q, prevCols[q] - 1, prevCols[q]);
      disp.delete(`${q}:${prevCols[q] - 1}`);
      cracks.set(q - 1, now);
      for (let i = prevCols[q - 1]; i < cur[q - 1]; i++) disp.set(`${q - 1}:${i}`, { x: src.x + src.w / 2, y: src.y + src.h / 2, s: 0.4, a: 0.3 });
      api.fx.shake(3); api.fx.stop(40); api.sfx("open");
      api.fx.burst(src.x + src.w / 2, src.y + src.h / 2, { n: 12, color: api.P.color(ROLE[q]), speed: 150, life: 0.45, size: 3, kind: api.art.id === "kagaz" ? "flake" : "dust" });
    } else if (last?.kind === "take" && !refused) {
      const q = last.place;
      for (let i = cur[q]; i < prevCols[q]; i++) { const d = disp.get(`${q}:${i}`), b = blockBox(q, i, prevCols[q]); gone.push({ q, x: d?.x ?? b.x, y: d?.y ?? b.y, w: b.w, h: b.h, t0: now + (i - cur[q]) * 0.04 }); disp.delete(`${q}:${i}`); }
      api.sfx("drop", B[q] - st().taken[q]);
    } else if (last?.kind === "write" && !refused) { api.sfx("tap"); wsel = Math.min(P0 - 1, wsel + 1); }
    for (const m of ms) {
      if (m.kind === "law_refused") { const q = last && "place" in last ? last.place : sel; looks.set(q, now + 1.3); api.sfx("look"); }
      else if (m.kind === "misconception_consequence") { for (let q = 0; q < P0; q++) looks.set(q, now + 1.5); api.sfx("look"); }
      else if (m.kind === "solved") { solvedAt = now; api.sfx("good"); api.fx.flash(api.P.color("good"), 0.08); api.fx.burst(W / 2, Hh * 0.4, { n: 16, color: api.P.color("good"), speed: 120, life: 0.6, size: 3, kind: "spark" }); }
    }
    if (last?.kind === "undo") disp.clear();
    prevCols = [...cur];
    layout(W, Hh);
    api.invalidate(); deps.changed();
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down") return;
    const id = api.hit(x, y); if (!id) return;
    if (id.startsWith("col:")) {
      const q = Number(id.slice(4));
      // first tap picks the column; a tap on the picked column takes one block (direct manipulation)
      if (q === sel && B[q] - st().taken[q] > 0 && !st().done) { act({ kind: "take", place: q, n: 1 }); return; }
      sel = q; api.sfx("select");
    }
    if (id.startsWith("ans:")) { wsel = Number(id.slice(4)); api.sfx("select"); }
    deps.changed(); api.invalidate();
  }

  function update(dt: number): void {
    const k = 1 - Math.pow(0.0006, dt);
    for (let q = 0; q < P0; q++) { const n = st().cols[q]; for (let i = 0; i < n; i++) { const key = `${q}:${i}`, b = blockBox(q, i, n), d = disp.get(key) ?? { x: b.x, y: b.y, s: 1, a: 1 }; d.x = lerp(d.x, b.x, k); d.y = lerp(d.y, b.y, k); d.s = lerp(d.s, 1, k); d.a = lerp(d.a, 1, k); disp.set(key, d); } }
    for (let i = gone.length - 1; i >= 0; i--) if (api.t - gone[i].t0 > 0.5) gone.splice(i, 1);
  }
  const busy = () => gone.length > 0 || [...looks.values()].some((u) => u > api.t) || [...cracks.values()].some((t0) => api.t - t0 < 0.5) || (solvedAt >= 0 && api.t - solvedAt < 0.8)
    || [...disp.entries()].some(([key, d]) => { const [q, i] = key.split(":").map(Number); if (i >= st().cols[q]) return false; const b = blockBox(q, i, st().cols[q]); return Math.abs(d.x - b.x) > 0.4 || Math.abs(d.y - b.y) > 0.4; });

  function drawBlock(c: CanvasRenderingContext2D, q: number, x: number, y: number, w: number, h: number, alpha = 1): void {
    const P = api.P, col = P.color(ROLE[q]);
    c.save(); c.globalAlpha *= alpha;
    P.body(c, x, y, w, h, { role: ROLE[q], r: Math.min(4, w * 0.2), seed: q * 13 + Math.round(x) });
    // the inner lines that make a ten a ten and a hundred a hundred
    c.strokeStyle = P.innerLine(); c.lineWidth = 1;
    if (q === 1 && h > 14) { c.beginPath(); for (let k = 1; k < 10; k++) { const yy = y + (h * k) / 10; c.moveTo(x + 1, yy); c.lineTo(x + w - 1, yy); } c.stroke(); }
    if (q === 2 && w > 14) { c.beginPath(); for (let k = 1; k < 10; k++) { const t = (w * k) / 10; c.moveTo(x + t, y + 1); c.lineTo(x + t, y + h - 1); c.moveTo(x + 1, y + t); c.lineTo(x + w - 1, y + t); } c.stroke(); }
    if (q >= 3) { c.strokeStyle = withAlpha(col, 0.9); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + w * 0.2, y); c.lineTo(x + w * 0.2 + w * 0.2, y - h * 0.18); c.lineTo(x + w + w * 0.2 - w * 0.2, y - h * 0.18); c.lineTo(x + w, y); c.stroke(); }
    c.restore();
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, now = api.t, s = st();
    for (let q = 0; q < P0; q++) {
      const cb = cols[q], ab = area[q];
      const look = (looks.get(q) ?? 0) > now;
      // column well (the written column at fade 3 has no wells)
      if (!fade3) P.body(c, cb.x + 3, ab.y - 4, cb.w - 6, ab.h + 8, { role: "panel", r: 12, state: sel === q && !fade3 && !s.done ? "selected" : look ? "look" : "idle" });
      if (!fade3) {
        const nm = placeName(q), two = nm.includes(" ") && cb.w < 96;
        if (two) nm.split(" ").forEach((part, k) => P.text(c, part, cb.x + cb.w / 2, cb.y + 2 + k * 16, { size: 14, role: "ink2", maxW: cb.w - 6 }));
        else P.text(c, nm, cb.x + cb.w / 2, cb.y + 12, { size: 14, role: "ink2", maxW: cb.w - 6 });
        if (level.fade >= 2) {
          // the written twin: row 1 = the top digit now (regrouped), the original struck through above it when changed
          const fy0 = ab.y + ab.h + 26, rh = clamp((cols[q].y + cols[q].h - fy0 - 24) / 3, 20, 34), r1 = fy0 + 22 + rh * 0.5, r2 = r1 + rh, r3 = r2 + rh + 6;
          const top = s.cols[q] + s.taken[q], changed = top !== A[q], fs = clamp(rh * 0.72, 16, 24);
          if (changed) {
            const ox = cb.x + cb.w / 2 + Math.min(18, cb.w * 0.22), oy = r1 - rh * 0.55;
            P.text(c, String(A[q]), ox, oy, { size: 14, role: "ink3", font: "mono" });
            P.stroke(c, [[ox - 6, oy + 5], [ox + 6, oy - 5]], { role: "look", width: 1.6 });
          }
          P.text(c, String(top), cb.x + cb.w / 2, r1, { size: fs, weight: 800, font: "mono", role: changed ? "look" : "ink" });
          if (q < String(p.b).length) P.text(c, String(B[q]), cb.x + cb.w / 2, r2, { size: fs, weight: 700, font: "mono", role: "ink2" });
          if (q === String(p.b).length - 1) P.text(c, "−", cb.x + 8, r2, { size: fs, weight: 700, font: "mono", role: "ink2", align: "left" });
          P.stroke(c, [[cb.x + 6, r2 + rh * 0.55], [cb.x + cb.w - 6, r2 + rh * 0.55]], { role: "ink2", width: 2 });
          const doneCol = s.taken[q] >= B[q] && (q >= String(p.b).length ? true : s.taken[q] === B[q]);
          if (doneCol && (B[q] > 0 || s.taken.slice(0, q).every((t2, k) => t2 >= B[k]))) P.text(c, String(s.cols[q]), cb.x + cb.w / 2, r3, { size: fs, weight: 800, font: "mono", role: "q2" });
          else P.stroke(c, [[cb.x + cb.w / 2 - 8, r3 + fs * 0.45], [cb.x + cb.w / 2 + 8, r3 + fs * 0.45]], { role: "ink3", width: 1.5, dash: [3, 3] });
        }
        // the blocks
        const n = s.cols[q];
        for (let i = 0; i < n; i++) { const d = disp.get(`${q}:${i}`); const b = blockBox(q, i, n); if (!d) continue; c.save(); c.globalAlpha = d.a; drawBlock(c, q, d.x, d.y, b.w * d.s, b.h * d.s); c.restore(); }
        const ck = cracks.get(q); if (ck !== undefined && now - ck < 0.5) { const k = 1 - (now - ck) / 0.5; c.save(); c.globalAlpha = k * 0.5; c.fillStyle = P.color(ROLE[q]); c.beginPath(); c.arc(ab.x + ab.w / 2, ab.y + ab.h / 2, 20 + 40 * (1 - k), 0, Math.PI * 2); c.fill(); c.restore(); }
        if (look && s.cols[q] < B[q] - s.taken[q]) P.magnifier(c, cb.x + cb.w - 16, ab.y + 14, 20);
        // the take slot: how many this column still has to give
        const need = B[q] - s.taken[q];
        const fy = ab.y + ab.h + 26;
        if (B[q] > 0) P.chip(c, need > 0 ? `−${need}` : "✓", cb.x + cb.w / 2, fy, { size: 16, role: need > 0 ? (look ? "look" : undefined) : "good" });
        api.target(`col:${q}`, cb.x + 2, ab.y - 4, cb.w - 4, Math.max(44, ab.h + 8));
      } else {
        // fade 3: the written column (a over b, the line, the answer boxes)
        const lh = Math.min(64, (Hh - 40) / 4.2), y1 = Math.max(20, (Hh - lh * 3.6) / 2);
        P.text(c, String(A[q]), cb.x + cb.w / 2, y1 + lh * 0.5, { size: clamp(lh * 0.6, 18, 40), weight: 700, font: "mono" });
        if (q < String(p.b).length) P.text(c, String(B[q]), cb.x + cb.w / 2, y1 + lh * 1.5, { size: clamp(lh * 0.6, 18, 40), weight: 700, font: "mono" });
        if (q === String(p.b).length - 1) P.text(c, "−", cb.x + 2, y1 + lh * 1.5, { size: clamp(lh * 0.6, 18, 40), weight: 700, font: "mono", align: "left" });
        P.stroke(c, [[cb.x + 4, y1 + lh * 2.1], [cb.x + cb.w - 4, y1 + lh * 2.1]], { role: "ink", width: 2.5 });
        const bx = cb.x + cb.w / 2 - Math.min(cb.w - 10, lh) / 2, bw = Math.min(cb.w - 10, lh), by = y1 + lh * 2.35;
        P.body(c, bx, by, bw, lh, { role: "panel", r: 10, state: wsel === q && !s.done ? "selected" : look ? "look" : s.done ? "good" : "idle" });
        const wv = s.written[q]; if (wv !== null) P.text(c, String(wv), bx + bw / 2, by + lh / 2, { size: clamp(lh * 0.6, 18, 40), weight: 800, font: "mono", role: "q2" });
        api.target(`ans:${q}`, bx - 4, by - 4, Math.max(44, bw + 8), Math.max(44, lh + 8));
      }
    }
    for (const g of gone) { const t = clamp((now - g.t0) / 0.5, 0, 1); if (now < g.t0) continue; drawBlock(c, g.q, g.x, g.y - ease.out(t) * 60, g.w, g.h, 1 - t); }
    if (s.done && solvedAt >= 0) { const left = H.valueOfCols(s.cols); P.chip(c, `${p.a} − ${p.b} = ${fade3 ? p.a - p.b : left}`, W / 2, fade3 ? Hh - 30 : 22, { size: 18, role: "good" }); }
  }

  function goal(): string { return say(lang, "bundles.goal", { a: p.a, b: p.b }); }
  function readouts(): Readout[] { return []; }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    if (fade3) {
      for (const d of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) out.push({ id: `k${d}`, label: d, kind: "pad", group: "pad", onPress: () => act({ kind: "write", place: wsel, digit: Number(d) }) });
      out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
      out.push({ id: "done", label: say(lang, "done"), kind: "primary", group: "go", you: s.written.every((w) => w !== null), onPress: () => act({ kind: "done" }) });
      return out;
    }
    const need = B[sel] - s.taken[sel];
    out.push({ id: "take", label: need > 0 ? `${say(lang, "bundles.take")} ${need} · ${placeName(sel)}` : `${placeName(sel)} ✓`, kind: "secondary", group: "act", disabled: need <= 0, onPress: () => act({ kind: "take", place: sel, n: need }) });
    if (sel < P0 - 1) out.push({ id: "open", label: `${placeName(sel + 1)} → ${placeName(sel)}`, aria: say(lang, "bundles.open"), kind: "secondary", group: "act", onPress: () => act({ kind: "unbundle", place: sel + 1 }) });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    out.push({ id: "done", label: say(lang, "done"), kind: "primary", group: "go", you: true, onPress: () => act({ kind: "done" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
