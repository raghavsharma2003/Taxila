// Todo-Jodo · strips, the view (DESIGN.md §3.1). Each strip is one whole roti. The knife cuts every piece into k; the
// shaded amount never moves while the pieces multiply (the law's invariant is what the eye sees). Pieces of different
// sizes do not pour into each other's slots: they fly, bounce back and sit where they were. Compare levels ask for a
// committed guess first, then the cut that makes the two strips comparable, then the choice again.
// Fade 1: pieces only. Fade 2: the n/d label rides on each strip. Fade 3: the symbol is the controller (n/d pad).
import type { Moment, StripsAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { withAlpha, roundRect, type Role } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { stripsHelpers as H, type Bar, type StripsParams, type StripsState } from "./strips.logic.ts";

interface Box { x: number; y: number; w: number; h: number }
interface Fly { from: Box; to: Box; role: Role; t0: number; back: boolean }
interface Knife { bar: number; xs: number[]; t0: number }

export const makeStripsView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<StripsParams, StripsState, StripsAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal;
  const cmpGoal = goal === "compare" || goal === "unit";
  const NAMES = ["A", "B", "C"];
  const ROLE: Role[] = ["q1", "q2", "q4"];
  let W = 1, H0 = 1;
  let bars: Box[] = [];
  let sel = goal === "equal" ? 1 : 0;
  let pad = "";
  let painting: { bar: number; on: boolean; seen: Set<number> } | null = null;
  const flies: Fly[] = [];
  const knives: Knife[] = [];
  const pops = new Map<string, number>();           // "bar:part" → t0 (shade pop)
  const looks = new Map<number, number>();          // bar → until (look again)
  let slotRole: Role[] = [];                        // add: which bar each slot of C came from
  let solvedAt = -1, revealAt = -1;
  let shown: Bar[] = ctl.state.bars.map((b) => ({ d: b.d, shaded: [...b.shaded] }));

  const st = () => ctl.state;
  const shadeable = (i: number) => !p.locked.includes(i) && (goal === "make" || goal === "equal");
  const partBox = (i: number, j: number, d: number): Box => { const b = bars[i]; return { x: b.x + (b.w * j) / d, y: b.y, w: b.w / d, h: b.h }; };

  function layout(w: number, h: number): void {
    W = w; H0 = h;
    const n = st().bars.length;
    const bw = Math.min(w - 32, 760), labelH = 30;
    const bh = clamp((h - 40 - n * (labelH + 26)) / n, 48, w >= 700 ? 96 : 72);
    const total = n * (bh + labelH) + (n - 1) * 30;
    let y = Math.max(16, (h - total) / 2) + labelH;
    bars = [];
    for (let i = 0; i < n; i++) { bars.push({ x: (w - bw) / 2, y, w: bw, h: bh }); y += bh + labelH + 30; }
  }

  function act(a: StripsAct): void { ctl.dispatch(a); deps.changed(); }

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as StripsAct | undefined;
    const now = api.t, cur = st().bars;
    if (last?.kind === "cut" && !refused) {
      const i = last.bar, oldD = shown[i]?.d ?? cur[i].d, newD = cur[i].d, xs: number[] = [];
      for (let j = 1; j < newD; j++) if ((j * oldD) % newD !== 0) xs.push(j / newD);
      knives.push({ bar: i, xs, t0: now });
      if (goal === "add" && i === 2) { const k = newD / oldD; slotRole = Array.from({ length: newD }, (_, s) => slotRole[Math.floor(s / k)] ?? "q4"); }
      api.fx.shake(2); api.sfx("crack", newD);
      const b = bars[i]; api.fx.burst(b.x + b.w / 2, b.y + b.h, { n: 8, color: api.P.color(ROLE[i]), speed: 110, life: 0.4, size: 3, kind: api.art.id === "kagaz" ? "flake" : "dust" });
    } else if (last?.kind === "join" && !refused) { api.sfx("land"); }
    else if (last?.kind === "shade" && !refused) { pops.set(`${last.bar}:${last.part}`, now); api.sfx("tap", cur[last.bar].shaded.length); }
    else if (last?.kind === "pour") {
      const from = last.from, src = shown[from], dst = cur[2], prevDst = shown[2];
      if (!refused) {
        const newSlots = dst.shaded.filter((s) => !prevDst.shaded.includes(s));
        src.shaded.forEach((part, k) => { const to = newSlots[k]; if (to === undefined) return; flies.push({ from: partBox(from, part, src.d), to: partBox(2, to, dst.d), role: ROLE[from], t0: now + k * 0.06, back: false }); slotRole[to] = ROLE[from]; });
        api.sfx("pour");
      } else if (refused === "unlike_pieces") {
        src.shaded.slice(0, 3).forEach((part, k) => { const tb = bars[2]; flies.push({ from: partBox(from, part, src.d), to: { x: tb.x + tb.w * 0.4 + k * 12, y: tb.y, w: tb.w / Math.max(1, dst.d), h: tb.h }, role: ROLE[from], t0: now + k * 0.05, back: true }); });
        looks.set(2, now + 1.4); api.sfx("refuse");
      }
    }
    for (const m of ms) {
      if (m.kind === "prediction_confirmed" || m.kind === "prediction_violated") { revealAt = now; api.sfx(m.kind === "prediction_confirmed" ? "good" : "look"); }
      else if (m.kind === "misconception_consequence" || (m.kind === "law_refused" && m.facts.why !== "cut_to_same_parts")) { const b = last && "bar" in last && typeof last.bar === "number" && last.bar >= 0 ? last.bar : goal === "equal" ? 1 : 0; looks.set(b, now + 1.4); if (m.kind === "law_refused" && m.facts.why !== "unlike_pieces") api.sfx("look"); }
      else if (m.kind === "law_refused" && m.facts.why === "cut_to_same_parts") { looks.set(0, now + 1.2); looks.set(1, now + 1.2); api.sfx("look"); }
      else if (m.kind === "prediction_committed") api.sfx("select");
      else if (m.kind === "solved") {
        solvedAt = now; api.sfx("good"); api.fx.flash(api.P.color("good"), 0.08);
        const b = bars[goal === "add" ? 2 : goal === "equal" ? 1 : 0]; api.fx.burst(b.x + b.w / 2, b.y, { n: 16, color: api.P.color("good"), speed: 120, life: 0.6, size: 3, kind: "spark" });
      }
    }
    if (refused === "too_thin") { looks.set(last && "bar" in last ? (last.bar as number) : 0, now + 1); api.sfx("refuse"); }
    shown = cur.map((b) => ({ d: b.d, shaded: [...b.shaded] }));
    api.invalidate(); deps.changed();
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    const id = kind === "down" ? api.hit(x, y) : null;
    if (kind === "down") {
      if (!id || !id.startsWith("bar:")) return;
      const i = Number(id.slice(4));
      if (st().done) return;
      if (sel !== i) { sel = i; api.sfx("select"); deps.changed(); api.invalidate(); }
      if (shadeable(i) && level.fade < 3) {
        const j = partAt(i, x); if (j < 0) return;
        const on = !st().bars[i].shaded.includes(j);
        painting = { bar: i, on, seen: new Set([j]) }; ctl.finger(true);
        act({ kind: "shade", bar: i, part: j });
      }
    } else if (kind === "move" && painting) {
      const j = partAt(painting.bar, x);
      if (j >= 0 && !painting.seen.has(j) && st().bars[painting.bar].shaded.includes(j) !== painting.on && Math.abs(y - (bars[painting.bar].y + bars[painting.bar].h / 2)) < bars[painting.bar].h) {
        painting.seen.add(j); act({ kind: "shade", bar: painting.bar, part: j });
      }
    } else if ((kind === "up" || kind === "cancel") && painting) { painting = null; ctl.finger(false); }
  }
  function partAt(i: number, x: number): number { const b = bars[i], d = st().bars[i].d; if (x < b.x || x > b.x + b.w) return -1; return clamp(Math.floor(((x - b.x) / b.w) * d), 0, d - 1); }

  function update(dt: number): void {
    const now = api.t;
    for (let i = flies.length - 1; i >= 0; i--) if (now - flies[i].t0 > (flies[i].back ? 0.9 : 0.55)) flies.splice(i, 1);
    for (let i = knives.length - 1; i >= 0; i--) if (now - knives[i].t0 > 0.6) knives.splice(i, 1);
    void dt;
  }
  const busy = () => flies.length > 0 || knives.length > 0 || [...pops.values()].some((t0) => api.t - t0 < 0.3) || [...looks.values()].some((u) => u > api.t) || (solvedAt >= 0 && api.t - solvedAt < 0.8) || (revealAt >= 0 && api.t - revealAt < 1);

  function drawBar(c: CanvasRenderingContext2D, i: number, b: Bar): void {
    const P = api.P, a = api.art, box = bars[i], now = api.t, r = Math.min(16, box.h * 0.3);
    const role = ROLE[i];
    const look = (looks.get(i) ?? 0) > now;
    const wob = look ? Math.sin(now * 38) * 1.6 : 0;
    c.save(); c.translate(wob, 0);
    // the strip body (an unshaded roti), then the shaded pieces clipped to it, then the cut lines
    P.body(c, box.x, box.y, box.w, box.h, { role: "panel", r, state: sel === i && !st().done ? "selected" : look ? "look" : st().done && (i === (goal === "add" ? 2 : goal === "equal" ? 1 : 0)) ? "good" : "idle" });
    c.save(); roundRect(c, box.x, box.y, box.w, box.h, r); c.clip();
    for (const j of b.shaded) {
      const pb = partBox(i, j, b.d), t0 = pops.get(`${i}:${j}`), k = t0 !== undefined ? ease.back(clamp((now - t0) / 0.25, 0, 1)) : 1;
      const rr = goal === "add" && i === 2 ? slotRole[j] ?? role : role;
      c.fillStyle = withAlpha(P.color(rr), a.dark ? (a.id === "chalk" ? 0.5 : 0.82) : 0.92);
      const hh = pb.h * (0.6 + 0.4 * k);
      c.fillRect(pb.x, pb.y + (pb.h - hh) / 2, pb.w, hh);
      if (a.id === "chalk") { c.save(); c.beginPath(); c.rect(pb.x, pb.y, pb.w, pb.h); c.clip(); c.strokeStyle = withAlpha(P.color(rr), 0.95); c.lineWidth = 1.6; c.beginPath(); for (let q = pb.x - pb.h; q < pb.x + pb.w; q += 6) { c.moveTo(q, pb.y + pb.h); c.lineTo(q + pb.h, pb.y); } c.stroke(); c.restore(); }
    }
    c.restore();
    for (let j = 1; j < b.d; j++) { const x = box.x + (box.w * j) / b.d; P.stroke(c, [[x, box.y + 3], [x, box.y + box.h - 3]], { role: "ink3", width: b.d > 12 ? 1.5 : 2, seed: i * 31 + j }); }
    // the knife: new cut lines run top to bottom, staggered
    for (const kn of knives) if (kn.bar === i) kn.xs.forEach((fx, q) => {
      const k = clamp((now - kn.t0 - q * 0.025) / 0.16, 0, 1); if (k <= 0) return;
      const x = box.x + box.w * fx; P.stroke(c, [[x, box.y - 6], [x, box.y - 6 + (box.h + 12) * k]], { role: "ink", width: 2.5, alpha: 1 - clamp((now - kn.t0 - 0.35) / 0.25, 0, 1) });
    });
    c.restore();
    // the bar's name (always) and its symbol (fade 2+, or once the level is solved)
    P.text(c, NAMES[i], box.x - 2, box.y - 15, { size: 16, weight: 800, role: "ink2", align: "left", font: "display" });
    if (level.fade >= 2 || st().done) P.chip(c, `${b.shaded.length}/${b.d}`, box.x + box.w - 34, box.y - 16, { size: 15, role: role });
    else if (b.d > 1) P.text(c, `${b.d} ${lang === "en" ? "pieces" : lang === "hi" ? "टुकड़े" : "tukde"}`, box.x + box.w, box.y - 15, { size: 14, role: "ink3", align: "right" });
    if (look) P.magnifier(c, box.x + box.w + 2, box.y - 2, 22);
    api.target(`bar:${i}`, box.x, box.y - 6, box.w, Math.max(44, box.h + 12));
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, now = api.t, cur = st().bars;
    // compare, revealed: the piece boundaries line up between the two strips (the eye can now count)
    if (cmpGoal && st().revealed && bars.length >= 2) {
      const k = clamp((now - revealAt) / 0.5, 0, 1), d = cur[0].d;
      for (let j = 1; j < d; j++) { const x = bars[0].x + (bars[0].w * j) / d; P.stroke(c, [[x, bars[0].y + bars[0].h], [x, bars[0].y + bars[0].h + (bars[1].y - bars[0].y - bars[0].h) * k]], { role: "ink3", width: 1, dash: [3, 4], alpha: 0.6 }); }
    }
    cur.forEach((b, i) => drawBar(c, i, b));
    // add: the pour arrows from A and B to C
    if (goal === "add" && bars.length === 3 && !st().done) for (const i of [0, 1]) if (!st().poured.includes(i)) {
      const b = bars[i], t = bars[2]; const x = b.x + b.w + 14;
      if (x < W - 8) P.stroke(c, [[x, b.y + b.h / 2], [x + 8, b.y + b.h / 2], [x + 8, t.y + t.h / 2 - 10 + i * 20], [x, t.y + t.h / 2 - 10 + i * 20]], { role: "ink3", width: 1.5, dash: [4, 4], alpha: 0.7 });
    }
    // flying pieces (pour, and the bounce-back of unlike pieces)
    for (const f of flies) {
      const t = clamp((now - f.t0) / (f.back ? 0.9 : 0.55), 0, 1); if (now < f.t0) continue;
      const e = f.back ? (t < 0.5 ? ease.out(t * 2) : 1 - ease.inOut((t - 0.5) * 2)) : ease.inOut(t);
      const to = f.back ? { ...f.to, y: f.to.y - 10 } : f.to;
      const x = lerp(f.from.x, to.x, e), y = lerp(f.from.y, to.y, e) - Math.sin(e * Math.PI) * 40, w = lerp(f.from.w, f.back ? f.from.w : to.w, e);
      c.save(); c.globalAlpha = 0.95; c.fillStyle = withAlpha(P.color(f.role), api.art.dark ? 0.75 : 0.95); roundRect(c, x, y, w, f.from.h, 4); c.fill(); c.restore();
    }
    if (st().done && solvedAt >= 0) { const b = bars[goal === "add" ? 2 : goal === "equal" ? 1 : cmpGoal ? Math.max(0, (st().predicted ?? 0)) : 0]; if (b) P.tick(c, b.x + b.w + (W - b.x - b.w > 40 ? 22 : -22), b.y + b.h + 22, 22, clamp((now - solvedAt) / 0.3, 0, 1)); }
    if (cmpGoal && st().done) {
      const more = H.truthCompare(p);
      P.chip(c, more === -1 ? say(lang, "strips.same") : `${NAMES[more]} > ${NAMES[1 - more]}`, W / 2, bars[1].y + bars[1].h + 34, { size: 18, role: "good" });
    }
  }

  function goalText(): string {
    if (goal === "make") return say(lang, "strips.goal.make", { t: `${p.target![0]}/${p.target![1]}` });
    if (goal === "equal") return say(lang, "strips.goal.equal");
    if (goal === "add") return say(lang, "strips.goal.add");
    if (st().predicted !== null && !st().revealed) return say(lang, "strips.goal.compare2");
    return say(lang, "strips.goal.compare");
  }
  function readouts(): Readout[] {
    const out: Readout[] = [];
    if (goal === "make" && level.fade >= 2) out.push({ k: "A", v: H.barStr(st().bars[0]), role: "q1" });
    if (goal === "add" && st().named) out.push({ k: "C", v: `${st().named!.n}/${st().named!.d}`, role: "good" });
    if (cmpGoal && st().predicted !== null) out.push({ k: say(lang, "think"), v: st().predicted === -1 ? "=" : NAMES[st().predicted!] });
    return out;
  }
  function controls(): ControlSpec[] {
    if (st().done) return [];
    const s = st(), out: ControlSpec[] = [];
    const choose = (): ControlSpec[] => [
      { id: "choose-0", label: `A ${lang === "en" ? "more" : "zyada"}`, kind: "choice", group: "choose", onPress: () => act({ kind: "choose", bar: 0 }) },
      { id: "choose-same", label: say(lang, "strips.same"), kind: "choice", group: "choose", onPress: () => act({ kind: "choose", bar: -1 }) },
      { id: "choose-1", label: `B ${lang === "en" ? "more" : "zyada"}`, kind: "choice", group: "choose", onPress: () => act({ kind: "choose", bar: 1 }) },
    ];
    if (cmpGoal && s.predicted === null) return choose();
    const b = s.bars[sel];
    const cuttable = goal === "make" ? [0] : goal === "equal" ? [1] : goal === "add" ? [0, 1, 2] : [0, 1];
    const multi = cuttable.length > 1;
    if (!cuttable.includes(sel)) sel = cuttable[0];
    const cuts = [2, 3, 4, 5].filter((k) => b.d * k <= 24);
    if (multi) { const nx = cuttable[(cuttable.indexOf(sel) + 1) % cuttable.length]; out.push({ id: `sel-${nx}`, label: `${NAMES[sel]} ⇄ ${NAMES[nx]}`, aria: `work on ${NAMES[nx]}`, kind: "pad", group: "cut", onPress: () => { sel = nx; api.sfx("select"); api.invalidate(); deps.changed(); } }); }
    for (const k of cuts) out.push({ id: `cut-${k}`, label: multi ? `${NAMES[sel]}÷${k}` : `÷${k}`, aria: `${say(lang, "strips.cut")} ${NAMES[sel]} ÷${k}`, kind: "pad", group: "cut", onPress: () => act({ kind: "cut", bar: sel, k }) });
    if (goal === "equal" && sel === 1 && b.d > 2) for (const k of [2, 3]) if (b.d % k === 0) out.push({ id: `join-${k}`, label: `${say(lang, "strips.join")} ${k}`, kind: "pad", group: "cut", onPress: () => act({ kind: "join", bar: sel, k }) });
    if (shadeable(sel) && level.fade < 3) {
      out.push({ id: "shade-minus", label: "−", aria: "unshade one piece", kind: "pad", group: "cut", disabled: !b.shaded.length, onPress: () => act({ kind: "shade", bar: sel, part: b.shaded[b.shaded.length - 1] }) });
      out.push({ id: "shade-plus", label: "+", aria: "shade one piece", kind: "pad", group: "cut", disabled: b.shaded.length >= b.d, onPress: () => { const j = Array.from({ length: b.d }, (_, q) => q).find((q) => !b.shaded.includes(q)); if (j !== undefined) act({ kind: "shade", bar: sel, part: j }); } });
    }
    if (goal === "add") for (const i of [0, 1]) if (!s.poured.includes(i)) out.push({ id: `pour-${i}`, label: `${NAMES[i]} → C`, aria: `${say(lang, "strips.pour")} ${NAMES[i]}`, kind: "secondary", group: "pour", onPress: () => act({ kind: "pour", from: i, to: 2 }) });
    if (level.fade === 3 && (goal === "make" || goal === "equal" || (goal === "add" && s.poured.length === 2))) {
      for (const d of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "/"]) out.push({ id: `k${d === "/" ? "slash" : d}`, label: d, kind: "pad", group: "pad", onPress: () => { if (pad.length < 5 && !(d === "/" && pad.includes("/"))) pad += d; deps.changed(); } });
      out.push({ id: "kdel", label: "⌫", aria: "delete", kind: "pad", group: "pad", onPress: () => { pad = pad.slice(0, -1); deps.changed(); } });
      const m = /^(\d+)\/(\d+)$/.exec(pad), nb = goal === "make" ? 0 : goal === "equal" ? 1 : 2;
      out.push({ id: "name", label: `${say(lang, "atoms.name")} ${pad || "?/?"}`, kind: "secondary", group: "go", disabled: !m, onPress: () => { if (m) { act({ kind: "name", bar: nb, n: Number(m[1]), d: Number(m[2]) }); pad = ""; } } });
    }
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    if (cmpGoal) out.push(...choose().map((c) => ({ ...c, group: "choose" })));
    else out.push({ id: "done", label: say(lang, "done"), kind: "primary", group: "go", you: true, onPress: () => act({ kind: "done" }) });
    return out;
  }
  function demo(): void { /* class 4-5 first contact: the first cut of A is the demonstrated move */ const b = bars[0]; if (!b) return; sel = 0; deps.changed(); api.invalidate(); }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal: goalText, readouts, controls, react, demo, dragging: () => !!painting };
  void H0;
  return view;
};
