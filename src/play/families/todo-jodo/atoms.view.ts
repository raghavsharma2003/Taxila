// Todo-Jodo · atoms, the view (DESIGN.md §3.1). A number is a block; the child picks it and chooses a divisor on the
// chisel pad; the crack runs, the halves spring out on bonds, and primes crystallise as round atoms with a rising chime.
// The law's answers are drawn, never told: a divisor that does not go leaves a remainder chip; a 1-split evaporates; a
// declared tree with a composite leaf hums and keeps its crack lit; a finished molecule flies back together into n.
// Layout is solved at the box: trees grow down on a phone and sit side by side on a wide screen; blocks never drop below
// the 44 px target or the text floor.
import type { AtomsAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { atomsView as A, stripOf, type AtomNode, type AtomsParams, type AtomsState, type AtomTree } from "./atoms.logic.ts";

interface Box { x: number; y: number; w: number; h: number }
interface Disp { x: number; y: number; w: number; h: number; s: number; a: number; born: number }
interface Chip { text: string; x: number; y: number; until: number; role: "look" | "ink2" | "q2" }
interface Ghost { x: number; y: number; vy: number; a: number; text: string }

export const makeAtomsView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<AtomsParams, AtomsState, AtomsAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const two = p.goal === "two-trees", pairMode = p.goal === "hcf" || p.goal === "lcm";
  let W = 1, H = 1, wide = false;
  const target = new Map<string, Box>();
  const disp = new Map<string, Disp>();
  let regions: Box[] = [];
  let tray: Box | null = null;
  let stripBox: Box | null = null;
  let selected: string | null = null;
  let pairPick: string | null = null;
  let pad = "";
  const hum = new Map<string, number>();       // node id → until (s)
  const cracks = new Map<string, number>();    // node id → crack progress start (s)
  const chips: Chip[] = [];
  const ghosts: Ghost[] = [];
  let fuse = -1;                                 // solved: fuse animation start (s)
  let predicted: boolean | null = null;
  let ghostHand = { x: -100, y: -100, a: 0, press: 0 };
  let blockH = 56;

  const st = () => ctl.state;
  const trees = () => st().trees;
  const isMine = (id: string) => id.startsWith("A") || (pairMode && id.startsWith("B"));
  const textPx = () => clamp(blockH * 0.4, api.P.minText + 2, 28);

  // ── layout: tree positions at this box
  function layoutTree(t: AtomTree, r: Box): void {
    const nodes = t.nodes;
    const depthOf = (id: string) => id.length - 1;
    const all = Object.values(nodes);
    const maxD = Math.max(...all.map((n) => depthOf(n.id)), 1);
    const leaves = A.leaves(t);
    const font = textPx();
    const widthOf = (v: number) => Math.max(blockH * (A.isPrime(v) ? 1 : 1.1), String(v).length * font * 0.66 + 26);
    let gapX = 10;
    let slot = Math.max(...leaves.map((n) => widthOf(n.v))) + gapX;
    if (slot * leaves.length > r.w) { slot = r.w / leaves.length; gapX = Math.max(6, slot - Math.max(...leaves.map((n) => widthOf(n.v)))); }
    const rowH = clamp((r.h - blockH) / maxD, blockH + 8, blockH + 46);
    const totalH = blockH + rowH * maxD;
    const y0 = r.y + Math.max(0, (r.h - totalH) / 2);
    const xs = new Map<string, number>();
    const x0 = r.x + (r.w - slot * leaves.length) / 2 + slot / 2;
    leaves.forEach((n, i) => xs.set(n.id, x0 + i * slot));
    const place = (id: string): number => {
      const n = nodes[id];
      if (!n.kids) return xs.get(id)!;
      const x = (place(n.kids[0]) + place(n.kids[1])) / 2; xs.set(id, x); return x;
    };
    place(t.root);
    for (const n of all) {
      const w = Math.min(widthOf(n.v), slot - 4);
      target.set(n.id, { x: xs.get(n.id)! - w / 2, y: y0 + depthOf(n.id) * rowH, w, h: blockH });
    }
  }
  function layout(w: number, h: number): void {
    W = w; H = h; wide = w >= 700 && w > h;
    target.clear();
    const pad0 = 12, stripH = (level.fade >= 2 && !pairMode) || two ? 56 : 0;   // pair mode: the tray carries the product
    const ts = trees();
    blockH = clamp(Math.min(h / 7.2, 64), 44, 64);
    if (ts.length === 1) {
      regions = [{ x: pad0, y: pad0, w: w - pad0 * 2, h: h - pad0 * 2 - stripH }];
      tray = null;
    } else if (wide) {
      const tw = pairMode ? 0.28 * w : 0;
      regions = [{ x: pad0, y: pad0 + 26, w: (w - tw) / 2 - pad0 * 1.5, h: h - pad0 * 2 - 26 - stripH }, { x: (w + tw) / 2 + pad0 * 0.5, y: pad0 + 26, w: (w - tw) / 2 - pad0 * 1.5, h: h - pad0 * 2 - 26 - stripH }];
      tray = pairMode ? { x: (w - tw) / 2 + 8, y: h * 0.34, w: tw - 16, h: h * 0.32 } : null;
    } else {
      const th = pairMode ? Math.max(blockH + 40, h * 0.16) : 0;
      const rh = (h - pad0 * 2 - stripH - th - 52) / 2;
      regions = [{ x: pad0, y: pad0 + 26, w: w - pad0 * 2, h: rh }, { x: pad0, y: pad0 + 26 + rh + th + 26, w: w - pad0 * 2, h: rh }];
      tray = pairMode ? { x: pad0 + 8, y: pad0 + 26 + rh + 6, w: w - pad0 * 2 - 16, h: th - 12 } : null;
      blockH = clamp(Math.min(rh / 3.2, 60), 44, 60);
    }
    // the block height that lets the deepest tree fit its region (never below the 44 px target)
    const maxDepth = Math.max(1, ...ts.map((t) => Math.max(...Object.keys(t.nodes).map((id) => id.length - 1))));
    const fitH = Math.min(...regions.map((r) => (r.h - 10 * maxDepth) / (1 + maxDepth)));
    blockH = clamp(Math.min(wide ? Math.min(h / 8, 76) : blockH, fitH), 44, wide ? 76 : 64);
    ts.forEach((t, i) => layoutTree(t, regions[i]));
    stripBox = stripH ? { x: pad0, y: h - pad0 - stripH, w: w - pad0 * 2, h: stripH } : null;
    for (const [id, b] of target) if (!disp.has(id)) disp.set(id, { ...b, s: 1, a: 1, born: -9 });
    if (firstLayout) { firstLayout = false; autoSelect(); queueMicrotask(() => deps.changed()); }
  }
  function relayout(): void { layout(W, H); }
  let firstLayout = true;

  // ── acts
  function act(a: AtomsAct): void {
    const r = ctl.dispatch(a);
    if (a.kind === "split" && !r.refused) { selected = null; pad = ""; }
    if (a.kind === "predict" && !r.refused) predicted = a.same;
    autoSelect();
    deps.changed();
  }
  /** one block left to work on → it is picked for the child (the pad shows at once; nothing is decided for them) */
  function autoSelect(): void {
    if (selected && findNode(selected) && !findNode(selected)!.kids) return;
    if (st().done || (two && st().predicted === null)) { selected = null; return; }
    const open = trees().flatMap((t) => A.leaves(t)).filter((n) => isMine(n.id) && !A.isPrime(n.v));
    selected = open.length === 1 ? open[0].id : null;
  }
  function trySplit(): void {
    if (!selected || !pad) return;
    act({ kind: "split", node: selected, by: Number(pad) });
  }

  // ── the law's answers
  function react(ms: Moment[], refused: string | undefined): void {
    // every state change re-solves the layout first (acts may arrive from touch, voice or the harness)
    const last = ctl.acts[ctl.acts.length - 1]?.act as AtomsAct | undefined;
    const before = new Set(target.keys());
    relayout();
    if (last?.kind === "undo") for (const id of [...disp.keys()]) if (!target.has(id)) disp.delete(id);
    const now = api.t;
    if (last?.kind === "predict" && !refused) predicted = last.same;
    for (const m of ms) {
      if (m.kind === "progress" && "a" in m.facts) {
        const pid = last?.kind === "split" ? last.node : null;
        if (pid) {
          cracks.set(pid, now);
          const pb = target.get(pid)!;
          const n = findNode(pid)!;
          for (const kid of n.kids ?? []) { const tb = target.get(kid); if (!tb || before.has(kid)) continue; disp.set(kid, { x: pb.x + pb.w / 2 - tb.w / 2, y: pb.y, w: tb.w, h: tb.h, s: 0.55, a: 0.2, born: now }); }
          api.fx.burst(pb.x + pb.w / 2, pb.y + pb.h, { n: 10, color: api.P.color("q1"), speed: 140, life: 0.5, size: 4, kind: api.art.id === "kagaz" ? "flake" : "dust" });
          api.fx.shake(3); api.fx.stop(40); api.sfx("crack");
          const atoms = Number(m.facts.atoms ?? 0);
          if (atoms > 0) setTimeout(() => { api.sfx("atom", countAtoms()); }, 260);
        }
      } else if (m.kind === "law_refused" && m.facts.why === "atom") {
        const id = last?.kind === "split" ? last.node : selected; if (id) { hum.set(id, now + 0.5); chip(id, say(lang, "atoms.atom"), "q2"); }
        api.sfx("refuse");
      } else if (m.kind === "law_refused" && m.facts.why === "remainder") {
        const id = last?.kind === "split" ? last.node : selected; if (id) { cracks.set(id, now); hum.set(id, now + 0.45); chip(id, `÷${m.facts.by} → ${m.facts.q}, ${m.facts.r} ${lang === "en" ? "left" : lang === "hi" ? "बचा" : "bacha"}`, "look"); }
        api.fx.shake(2); api.sfx("refuse");
      } else if (m.kind === "misconception_consequence" && m.misconceptionId === "include-one") {
        const id = (last?.kind === "split" ? last.node : selected) ?? "A"; const b = target.get(id);
        if (b) ghosts.push({ x: b.x + b.w + 10, y: b.y + b.h / 2, vy: -40, a: 1, text: "1" });
        if (b) chip(id, `1 × ${m.facts.v} = ${m.facts.v}`, "look");
        api.sfx("look");
      } else if (m.kind === "misconception_consequence" && m.misconceptionId === "stop-composite") {
        for (const n of A.leaves(trees()[0])) if (!A.isPrime(n.v)) hum.set(n.id, now + 1.8);
        api.sfx("look");
      } else if (m.kind === "law_refused" && (m.facts.why === "not_same_atom" || m.facts.why === "pair_left" || m.facts.why === "not_built" || m.facts.why === "predict_first")) {
        api.sfx("refuse");
      } else if (m.kind === "solved") {
        fuse = now; api.sfx("good"); api.fx.flash(api.P.color("good"), 0.08);
        const c = stripBox ?? regions[0]; api.fx.burst(c.x + c.w / 2, c.y + c.h / 2, { n: 16, color: api.P.color("good"), speed: 120, life: 0.6, size: 3, kind: "spark" });
      } else if (m.kind === "progress" && "pair" in m.facts) {
        api.sfx("pour"); pairPick = null;
      } else if (m.kind === "prediction_committed") api.sfx("select");
    }
    if (refused && !ms.length) api.sfx("refuse");
    autoSelect();
    api.invalidate();
    deps.changed();
  }
  const findNode = (id: string): AtomNode | undefined => { for (const t of trees()) if (t.nodes[id]) return t.nodes[id]; return undefined; };
  const countAtoms = () => trees().reduce((s, t) => s + A.leaves(t).filter((n) => A.isPrime(n.v)).length, 0);
  function chip(id: string, text: string, role: Chip["role"]): void { const b = target.get(id); if (!b) return; chips.push({ text, x: b.x + b.w / 2, y: b.y - 18, until: api.t + 1.8, role }); }

  // ── input
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down") return;
    const id = api.hit(x, y);
    if (!id || !id.startsWith("node:")) { selected = null; deps.changed(); return; }
    const nid = id.slice(5), n = findNode(nid);
    if (!n || n.kids || st().done) return;
    if (pairMode && trees().every(A.treeDone)) {
      if (nid.startsWith("A")) { pairPick = pairPick === nid ? null : nid; api.sfx("select"); }
      else if (pairPick) act({ kind: "share", atom: pairPick, with: nid });
      deps.changed(); api.invalidate(); return;
    }
    if (!isMine(nid)) { chip(nid, say(lang, "atoms.bittu"), "ink2"); return; }
    selected = selected === nid ? null : nid; pad = "";
    api.sfx("select"); deps.changed(); api.invalidate();
  }

  // ── frame
  function update(dt: number): void {
    for (const [id, b] of target) {
      const d = disp.get(id) ?? { ...b, s: 1, a: 1, born: -9 };
      const k = 1 - Math.pow(0.0008, dt);
      d.x = lerp(d.x, b.x, k); d.y = lerp(d.y, b.y, k); d.w = lerp(d.w, b.w, k); d.h = lerp(d.h, b.h, k);
      d.s = lerp(d.s, 1, 1 - Math.pow(0.002, dt)); d.a = lerp(d.a, 1, 1 - Math.pow(0.001, dt));
      disp.set(id, d);
    }
    for (const g of ghosts) { g.y += g.vy * dt; g.a -= dt * 0.9; }
    for (let i = ghosts.length - 1; i >= 0; i--) if (ghosts[i].a <= 0) ghosts.splice(i, 1);
    for (let i = chips.length - 1; i >= 0; i--) if (chips[i].until < api.t) chips.splice(i, 1);
  }
  const busy = () => {
    for (const [id, b] of target) { const d = disp.get(id); if (d && (Math.abs(d.x - b.x) > 0.3 || Math.abs(d.y - b.y) > 0.3 || d.s < 0.995)) return true; }
    for (const until of hum.values()) if (until > api.t) return true;
    for (const s0 of cracks.values()) if (api.t - s0 < 0.4) return true;
    return ghosts.length > 0 || chips.length > 0 || (fuse >= 0 && api.t - fuse < 1.2) || ghostHand.a > 0.01;
  };

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, now = api.t;
    // tree tags
    if (two) {
      trees().forEach((t, i) => {
        const r = regions[i]; const label = two ? (i === 0 ? say(lang, "atoms.mine") : say(lang, "atoms.bittu")) : `${t.nodes[t.root].v}`;
        const rb = target.get(t.root); const ly = wide && rb ? rb.y - 24 : r.y - 14;
        P.text(c, label, wide && rb ? rb.x + rb.w / 2 : r.x + 4, ly, { size: 15, role: "ink2", align: wide && rb ? "center" : "left", weight: 700, font: "ui" });
      });
    }
    if (tray) {
      P.stroke(c, [[tray.x + 14, tray.y], [tray.x + tray.w - 14, tray.y], [tray.x + tray.w, tray.y + 14], [tray.x + tray.w, tray.y + tray.h - 14], [tray.x + tray.w - 14, tray.y + tray.h], [tray.x + 14, tray.y + tray.h], [tray.x, tray.y + tray.h - 14], [tray.x, tray.y + 14]], { role: "ink3", width: 2, dash: [7, 6], closed: true, alpha: 0.8 });
      const pairs = st().pairs;
      P.text(c, say(lang, "atoms.pairs"), tray.x + 12, tray.y + 16, { size: 14, role: "ink2", align: "left", weight: 700 });
      const per = Math.max(1, Math.floor((tray.w - 20) / 56));
      pairs.forEach(([a], i) => { const v = findNode(a)!.v, cx = tray!.x + 34 + (i % per) * 56, cy = tray!.y + 52 + Math.floor(i / per) * 56; P.body(c, cx - 24, cy - 24, 48, 48, { role: "q2", r: 24 }); P.text(c, String(v), cx, cy, { size: 18, weight: 800, font: "display", on: "q2" }); });
      if (st().done) { const x = st().named ?? 0; P.chip(c, `${p.goal.toUpperCase()} = ${x}`, tray.x + tray.w / 2, tray.y + tray.h - 30, { size: 18, role: "good" }); P.tick(c, tray.x + tray.w - 22, tray.y + tray.h - 30, 18, clamp((now - fuse) / 0.3, 0, 1)); }
      else if (level.fade >= 2 && pairs.length) P.text(c, `${p.goal.toUpperCase()} ${p.goal === "hcf" ? "= " + pairs.map(([a]) => findNode(a)!.v).join(" × ") : ""}`, tray.x + tray.w - 10, tray.y + 16, { size: 14, role: "ink2", align: "right", font: "mono" });
    }
    // bonds
    for (const t of trees()) for (const n of Object.values(t.nodes)) if (n.kids) {
      const pd = disp.get(n.id); if (!pd) continue;
      for (const k of n.kids) { const kd = disp.get(k); if (!kd) continue; P.stroke(c, [[pd.x + pd.w / 2, pd.y + pd.h], [kd.x + kd.w / 2, kd.y]], { role: "ink3", width: 3, alpha: kd.a, seed: k.length }); }
    }
    // nodes
    const fused = fuse >= 0 ? clamp((now - fuse) / 0.7, 0, 1) : 0;
    for (const t of trees()) for (const n of Object.values(t.nodes)) {
      const d = disp.get(n.id); if (!d) continue;
      const prime = A.isPrime(n.v), leaf = !n.kids;
      const humming = (hum.get(n.id) ?? 0) > now;
      const wob = humming ? Math.sin(now * 40) * 2.2 : 0;
      let { x, y } = d; const { w, h } = d;
      if (fused > 0 && leaf && t.root === "A" && !two && !pairMode) {
        // the multiply-back: the atoms fly together into the parent's place, then fade into the whole number
        const rb = target.get("A")!; const e = ease.inOut(clamp(fused / 0.7, 0, 1));
        x = lerp(x, rb.x + rb.w / 2 - w / 2, e); y = lerp(y, rb.y, e);
      }
      c.save(); c.globalAlpha = d.a * (n.kids ? 0.62 : 1);
      const cx = x + w / 2, cy = y + h / 2;
      c.translate(cx + wob, cy); c.scale(d.s, d.s); c.translate(-cx, -cy);
      const open = leaf && !prime && isMine(n.id) && !st().done && !selected;
      const paired = pairMode && st().pairs.some(([a, b]) => a === n.id || b === n.id);
      const state = selected === n.id || pairPick === n.id ? "selected" : humming ? "look" : paired ? "dim" : st().done && leaf ? "good" : open ? "hover" : "idle";
      P.body(c, x, y, w, h, { role: prime && leaf ? "q2" : "q1", r: prime && leaf ? h / 2 : 10, state, seed: n.id.length * 7 + n.v, lift: selected === n.id ? 4 : 0 });
      // crack line on a split parent (drawn as it runs, then stays as the seam) and on a refused split
      const cs = cracks.get(n.id);
      if (cs !== undefined) { const k = clamp((now - cs) / 0.18, 0, 1); const zz: [number, number][] = [[0.5, 0], [0.44, 0.3], [0.56, 0.55], [0.47, 0.8], [0.52, 1]].map(([fx, fy]) => [x + w * fx, y + h * Math.min(fy, k)] as [number, number]); P.stroke(c, zz, { role: "ink3", width: 2, alpha: n.kids ? 0.5 : 0.8 * (1 - clamp((now - cs - 0.3) / 0.3, 0, 1)) }); }
      P.text(c, String(n.v), cx, cy + 1, { size: textPx(), weight: 800, font: "display", on: prime && leaf ? "q2" : "q1" });
      if (humming && !prime) P.magnifier(c, x + w + 4, y - 2, 22);
      c.restore();
      if (leaf && !st().done && (isMine(n.id) || pairMode)) api.target(`node:${n.id}`, x - 4, y - 4, Math.max(w + 8, 44), Math.max(h + 8, 44));
    }
    // the strip: the live product of the leaves (fade 2+, and for two benches)
    if (stripBox) {
      const sb = stripBox, mine = trees()[0];
      const s = `${stripOf(mine)}${A.treeDone(mine) ? ` = ${p.n}` : ""}`;
      if (two && trees()[1]) {
        const half = sb.w / 2;
        P.chip(c, stripOf(mine), sb.x + half / 2, sb.y + sb.h / 2, { size: 16, role: st().done ? "good" : undefined });
        P.chip(c, stripOf(trees()[1]), sb.x + half * 1.5, sb.y + sb.h / 2, { size: 16 });
        if (st().done) { P.text(c, "=", sb.x + half, sb.y + sb.h / 2, { size: 26, weight: 800, role: "good", font: "display" }); P.tick(c, sb.x + sb.w - 18, sb.y + 12, 20, clamp((now - fuse) / 0.3, 0, 1)); }
        if (predicted !== null && regions[0]) P.chip(c, `${say(lang, "think")}: ${predicted ? say(lang, "atoms.same") : say(lang, "atoms.diff")}`, regions[0].x + regions[0].w - 70, regions[0].y - 14, { size: 14, font: "ui" });
      } else if (level.fade >= 2) {
        P.chip(c, s, sb.x + sb.w / 2, sb.y + sb.h / 2, { size: 18, role: st().done ? "good" : undefined });
        if (st().done) P.tick(c, sb.x + sb.w / 2 + api.P.minText * 0.6 * s.length * 0.62 + 18, sb.y + sb.h / 2, 20, clamp((now - fuse) / 0.3, 0, 1));
      }
    }
    if (st().done && fuse >= 0 && !two && !pairMode) {
      const rb = target.get("A")!, k = clamp((now - fuse - 0.55) / 0.35, 0, 1);
      if (k > 0) { c.save(); c.globalAlpha = k; P.body(c, rb.x - 6, rb.y - 6, rb.w + 12, rb.h + 12, { role: "q2", r: (rb.h + 12) / 2, state: "good" }); P.text(c, String(p.n), rb.x + rb.w / 2, rb.y + rb.h / 2 + 1, { size: textPx() + 2, weight: 800, font: "display", on: "q2" }); c.restore(); P.tick(c, rb.x + rb.w + 26, rb.y + rb.h / 2, 24, k); }
    }
    for (const g of ghosts) { c.save(); c.globalAlpha = Math.max(0, g.a); P.body(c, g.x - 20, g.y - 20, 40, 40, { role: "q3", r: 12, state: "ghost" }); P.text(c, g.text, g.x, g.y, { size: 18, weight: 800, alpha: Math.max(0, g.a) }); c.restore(); }
    for (const ch of chips) { const a = clamp((ch.until - now) / 0.4, 0, 1); c.save(); c.globalAlpha = a; P.chip(c, ch.text, clamp(ch.x, 70, W - 70), Math.max(16, ch.y), { size: 15, role: ch.role === "look" ? "look" : ch.role === "q2" ? "q2" : undefined, font: "ui" }); c.restore(); }
    P.hand(c, ghostHand.x, ghostHand.y, 26, ghostHand.a, ghostHand.press);
  }

  // ── chrome
  function goal(): string {
    if (two) return say(lang, "atoms.goal.two", { n: p.n });
    if (p.goal === "hcf") return say(lang, "atoms.goal.hcf");
    if (p.goal === "lcm") return say(lang, "atoms.goal.lcm");
    return say(lang, "atoms.goal");
  }
  function readouts(): Readout[] {
    const mine = trees()[0];
    const left = A.leaves(mine).filter((n) => !A.isPrime(n.v)).length;
    const out: Readout[] = [{ k: say(lang, "atoms.atom"), v: String(A.leaves(mine).filter((n) => A.isPrime(n.v)).length), role: "q2" }];
    if (pairMode) out.push({ k: say(lang, "atoms.pairs"), v: String(st().pairs.length), role: "q2" });
    else if (level.fade < 2 && !two) out.push({ k: "▢", v: String(left), role: "q1" });
    return out;
  }
  function controls(): ControlSpec[] {
    if (st().done) return [];
    if (two && st().predicted === null) return [
      { id: "same", label: say(lang, "atoms.same"), kind: "choice", group: "p", onPress: () => act({ kind: "predict", same: true }) },
      { id: "diff", label: say(lang, "atoms.diff"), kind: "choice", group: "p", onPress: () => act({ kind: "predict", same: false }) },
    ];
    const allAtoms = trees().every(A.treeDone);
    if ((pairMode && allAtoms) || (selected && findNode(selected))) {
      const keys: ControlSpec[] = [];
      for (const dgt of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) keys.push({ id: `k${dgt}`, label: dgt, kind: "pad", group: "pad", onPress: () => { if (pad.length < 3) pad += dgt; deps.changed(); } });
      keys.push({ id: "kdel", label: "⌫", kind: "pad", group: "pad", aria: "delete", onPress: () => { pad = pad.slice(0, -1); deps.changed(); } });
      const name = pairMode && allAtoms;
      keys.push({ id: name ? "name" : "split", label: name ? `${p.goal.toUpperCase()} = ${pad || "?"}` : `${findNode(selected!)?.v ?? ""} ÷ ${pad || "?"} · ${say(lang, "atoms.split")}`, kind: "primary", group: "go", you: true, disabled: !pad,
        onPress: () => { if (name) { act({ kind: "name", x: Number(pad) }); pad = ""; } else trySplit(); } });
      if (!name) {
        keys.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
        keys.push({ id: "done", label: say(lang, "done"), kind: "secondary", group: "go", onPress: () => act({ kind: "done" }) });
      }
      return keys;
    }
    return [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      ...(pairMode ? [] : [{ id: "done", label: say(lang, "done"), kind: "primary" as const, group: "go", you: true, onPress: () => act({ kind: "done" }) }]),
    ];
  }
  function demo(): void {
    // the teacher's ghost hand picks the root and makes the first split with its smallest prime (a legal act, evidence of nothing)
    const b = target.get("A"); if (!b) return;
    ghostHand = { x: W * 0.8, y: H * 0.9, a: 0, press: 0 };
    api.tw.add(ghostHand, { x: b.x + b.w / 2, y: b.y + b.h / 2, a: 0.9 }, { dur: 0.7, ease: ease.inOut, done: () => {
      api.tw.add(ghostHand, { press: 1 }, { dur: 0.12, done: () => { selected = "A"; pad = String(Math.min(...[2, 3, 5, 7, 11, 13].filter((q) => p.n % q === 0))); deps.changed(); api.tw.add(ghostHand, { press: 0, a: 0 }, { dur: 0.6, delay: 0.5 }); } });
    } });
  }
  function voice(a: AtomsAct | { kind: string }): boolean {
    if ((a as AtomsAct).kind === "split" && selected) { act({ ...(a as Extract<AtomsAct, { kind: "split" }>), node: selected }); return true; }
    if ((a as AtomsAct).kind === "done") { act({ kind: "done" }); return true; }
    return false;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, demo, voice: voice as FamilyView["voice"] };
  return view;
};
