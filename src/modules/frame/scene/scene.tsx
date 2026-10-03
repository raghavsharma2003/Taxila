// scene@1 — the T2 scene renderer (CONTENT-ENGINE §3). Renders a validated scene@1 document (Forge G1
// templates choice-card@1 / sequence-steps@1 and the T2a set: sort-bins, count-group, slider-explore,
// sequence-steps, compare-choice, predict-reveal): visuals in one SVG stage (1000 units wide), controls as
// real HTML buttons laid over it at the validator's own layout, so hit sizes are what the validator checked.
// Drag has a tap twin (tap the piece, tap the place: WCAG 2.5.7), which is the only drag path in v1.
// Verdicts are the scene's own expressions (EXPR@1) on the runtime state; the host re-grades T2 answers from
// value.vars / placements (§4.5), so the module's `correct` is a claim, computed the same way.
// Highlight targets: any node id. Reveal: the right option / order is marked and probe.reveal plays.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine } from "../kit/def.ts";
import { useTracker } from "../kit/tracker.ts";
import { cls, EngineRoot, NumPad, useReducedMotion, Verdict } from "../kit/ui.tsx";
import { evalSrc, type Val } from "./expr.ts";
import { BANDS, COLORS, DPU, layout, num, pick, textBox, textSize, type Box, type SNode } from "./layout.ts";
import { accepts, correctOption, correctOrder, draggablesOf, envOf, goalsMet, initialRT, probeOutcome, type RT } from "./runtime.ts";
import { glyph } from "./sprites.ts";
import { checkScene } from "./structure.ts";

const def = defineEngine({
  id: "scene@1",
  title: "Scene",
  subjects: ["maths", "science", "evs", "english", "hindi", "sst"],
  params: {
    scene: { type: "object", doc: "a scene@1 document that passed the server validator (Forge G1 / T2a templates)" },
  },
  emits: ["sc.choice", "sc.pick", "sc.drop", "sc.order", "sc.var", "sc.goal", "sc.cue", "sc.button"],
});

const color = (k: string | undefined, dflt: string | null = null) => (k ? COLORS[k] ?? dflt : dflt);

interface Anim {
  shown: Record<string, boolean>;
  props: Record<string, Record<string, number>>;
  pulse: Record<string, number>;
}

function SceneEngine({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const checked = useMemo(() => checkScene(params.scene), [params.scene]);
  const errText = checked.errors.join("; ");
  useEffect(() => {
    if (errText) api.error(`scene rejected: ${errText}`);
  }, [errText, api]);
  if (!checked.scene) {
    return (
      <EngineRoot name="scene" ageBand={ageBand}>
        <div className="frame-card" role="status" data-card="scene-rejected"><p className="frame-card-title">…</p></div>
      </EngineRoot>
    );
  }
  return <SceneView scene={checked.scene} goal={goal} lang={lang} ageBand={ageBand} highlight={highlight} revealed={revealed} api={api} />;
}

function SceneView({ scene, goal, lang, ageBand, highlight, revealed, api }: Omit<EngineProps, "params"> & { scene: any }) {
  const band: string = scene.meta.band;
  const B = BANDS[band];
  const key = useMemo(() => {
    let h = 2166136261;
    for (const ch of JSON.stringify(scene)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return h.toString(36);
  }, [scene]);
  const t = useTracker(api, key, { stuckAfterChanges: 40 });
  const reduce = useReducedMotion();
  const L0 = useMemo(() => layout(scene, envOf(scene, initialRT(scene, []), [])), [scene]);
  const drs = useMemo(() => draggablesOf(scene, L0), [scene, L0]);
  const [rt, setRt] = useState<RT>(() => initialRT(scene, drs));
  const [picked, setPicked] = useState<string | null>(null);
  const [selOrder, setSelOrder] = useState<{ list: string; item: string } | null>(null);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [anim, setAnim] = useState<Anim>({ shown: {}, props: {}, pulse: {} });
  const [met, setMet] = useState<Set<string>>(new Set());
  const timers = useRef<number[]>([]);
  const env = useMemo(() => envOf(scene, rt, drs), [scene, rt, drs]);
  const L = useMemo(() => layout(scene, env), [scene, env]);
  const byId = useMemo(() => new Map<string, SNode>(scene.nodes.map((n: SNode) => [n.id, n])), [scene]);
  const nodeOf = (id: string) => byId.get(id);
  const tlOf = (id: string) => nodeOf(id)?.tl ?? nodeOf(id.replace(/_\d+$/, ""))?.item?.tl ?? id;

  // Width → px per scene unit (overlay controls are positioned in px from the same layout).
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.328);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const set = () => setScale(el.clientWidth / L.W || 0.328);
    set();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [L.W]);

  // ── timelines ──
  const runTimeline = (id: string) => {
    const tl = scene.timelines.find((x: any) => x.id === id);
    if (!tl) return;
    for (const st of tl.steps) {
      const apply = () => {
        if (st.do === "show" || st.do === "hide") setAnim((a) => ({ ...a, shown: { ...a.shown, [st.target]: st.do === "show" } }));
        else if (st.do === "set" && st.var) setRt((r) => ({ ...r, vals: { ...r.vals, [st.var]: st.value } }));
        else if (st.do === "cue") t.note("sc.cue", { cue: st.cue ?? "" });
        else if (st.do === "tween" && st.target && st.prop) setAnim((a) => ({ ...a, props: { ...a.props, [st.target]: { ...a.props[st.target], [st.prop]: st.to } } }));
        else if (st.target) setAnim((a) => ({ ...a, pulse: { ...a.pulse, [st.target]: (a.pulse[st.target] ?? 0) + 1 } }));
      };
      const at = reduce ? 0 : st.t + (st.do === "tween" ? st.ms : 0);
      timers.current.push(window.setTimeout(apply, at));
    }
  };
  useEffect(() => {
    for (const tl of scene.timelines) if (tl.on === "mount") runTimeline(tl.id);
    const ts = timers.current;
    return () => ts.forEach((x) => clearTimeout(x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  const revealRan = useRef(false);
  useEffect(() => {
    if (revealed && !revealRan.current && scene.probe?.reveal) {
      revealRan.current = true;
      runTimeline(scene.probe.reveal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  // ── goals ──
  useEffect(() => {
    const now = goalsMet(scene, env);
    const fresh = now.filter((g) => !met.has(g));
    if (!fresh.length) return;
    setMet(new Set([...met, ...fresh]));
    for (const g of fresh) {
      t.note("sc.goal", { goal: g, tl: scene.goals.find((x: any) => x.id === g)?.tl ?? g });
      for (const tl of scene.timelines) if (tl.on === "goal" && tl.ref === g) runTimeline(tl.id);
    }
    // A probe committed by voice is graded by the host after ASR (record_answer, bridge v2); in the frame the
    // scene's goals are what the child can reach, so they carry goal_met — as they do when there is no probe.
    const goalDriven = !scene.probe || scene.probe.commit?.via === "voice";
    if (goalDriven && scene.goals.every((g: any) => now.includes(g.id) || met.has(g.id))) t.goal(goal || scene.goals.map((g: any) => g.id).join("+"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  // ── commits ──
  const commit = (via: string, override?: RT) => {
    if (!scene.probe) return;
    const state = override ?? rt;
    const e = envOf(scene, state, drs);
    const { correct, misc } = probeOutcome(scene, e);
    const placed: Record<string, string | null> = {};
    for (const d of drs) placed[tlOf(d.id)] = state.place[d.id];
    const vars: Record<string, Val> = {};
    for (const v of scene.vars) vars[v.id] = state.vals[v.id];
    setVerdict(scene.feedback === "none" ? null : correct);
    t.answer({ kind: "sc.commit", probe: scene.probe.id, probe_kind: scene.probe.kind, via, vars, ...(drs.length && { placed }), ...(Object.keys(state.order).length && { order: state.order }), ...(misc && { misc }) }, correct, goal || scene.probe.id);
    for (const tl of scene.timelines) if (tl.on === "commit") runTimeline(tl.id);
  };

  const setVar = (id: string, value: Val, count = true) => {
    if (t.done) return;
    const next = { ...rt, vals: { ...rt.vals, [id]: value } };
    setRt(next);
    setVerdict(null);
    if (count) t.change("sc.var", { var: id, value });
    else t.note("sc.var", { var: id, value });
    return next;
  };
  const choose = (n: SNode, optId: string) => {
    if (t.done) return;
    const next = { ...rt, vals: { ...rt.vals, [n.var]: optId } };
    setRt(next);
    t.change("sc.choice", { node: n.tl ?? n.id, option: optId });
    if (n.commit && scene.probe?.commit?.via === "choice" && (!scene.probe.commit.node || scene.probe.commit.node === n.id)) commit("tap", next);
  };
  const tapDraggable = (id: string) => {
    if (t.done) return;
    setPicked((p) => (p === id ? null : id));
    t.note("sc.pick", { item: tlOf(id) });
  };
  const tapZone = (zoneId: string) => {
    if (!picked || t.done) return;
    const d = drs.find((x) => x.id === picked)!;
    if (rt.place[d.id] === zoneId) {
      setRt({ ...rt, place: { ...rt.place, [d.id]: d.start } });
      setPicked(null);
      t.change("sc.drop", { item: tlOf(d.id), zone: null, back: true });
      return;
    }
    const ok = accepts(scene, rt, drs, d, zoneId);
    if (!ok) {
      t.change("sc.drop", { item: tlOf(d.id), zone: tlOf(zoneId), rejected: true });
      return;
    }
    setRt({ ...rt, place: { ...rt.place, [d.id]: zoneId } });
    setPicked(null);
    setVerdict(null);
    t.change("sc.drop", { item: tlOf(d.id), zone: tlOf(zoneId) });
  };
  const tapOrderItem = (list: string, item: string) => {
    if (t.done) return;
    if (!selOrder || selOrder.list !== list) return setSelOrder({ list, item });
    if (selOrder.item === item) return setSelOrder(null);
    const arr = [...rt.order[list]];
    const a = arr.indexOf(selOrder.item), b = arr.indexOf(item);
    [arr[a], arr[b]] = [arr[b], arr[a]];
    setRt({ ...rt, order: { ...rt.order, [list]: arr } });
    setSelOrder(null);
    setVerdict(null);
    t.change("sc.order", { list: nodeOf(list)?.tl ?? list, order: arr.join(",") });
  };
  const button = (n: SNode) => {
    t.note("sc.button", { act: n.act });
    if (n.act === "check") commit("tap");
    else if (n.act === "reset") {
      setRt(initialRT(scene, drs));
      setVerdict(null);
      setPicked(null);
    } else if (n.act === "play" && n.timeline) runTimeline(n.timeline);
  };

  // ── geometry helpers ──
  const prop = (n: SNode, k: string, dflt = 0) => anim.props[n.id]?.[k] ?? num(n[k], env, dflt);
  const isShown = (n: SNode): boolean => {
    if (n.id in anim.shown) return anim.shown[n.id];
    if (n.show === undefined) return true;
    if (typeof n.show === "boolean") return n.show;
    try { return !!evalSrc(n.show.$, env); } catch { return true; }
  };
  const visible = (n: SNode): boolean => isShown(n) && (!n.parent || visible(nodeOf(n.parent) ?? {}));
  const hlId = highlight?.target ?? "";
  const hlKey = (id: string) => (hlId === id ? `${id}#${highlight!.seq}` : id);
  const px = (b: Box): CSSProperties => ({ position: "absolute", left: (b.x - b.w / 2) * scale, top: (b.y - b.h / 2) * scale, width: b.w * scale, height: b.h * scale });
  const fontPx = (size: string, s: string) => textSize(size, band, /[ऀ-ॿ]/.test(s)) * scale;
  const fmtText = (n: SNode): string => {
    const raw = pick(n.text.fmt ?? n.text, lang);
    if (!n.text.fmt) return raw;
    return raw.replace(/\{([a-z0-9_]+)\}/g, (_, id) => {
      const v = env.vals[id];
      const dp = scene.derive.find((d: any) => d.id === id)?.dp ?? 2;
      return typeof v === "number" ? String(Math.round(v * 10 ** dp) / 10 ** dp) : String(v ?? "");
    });
  };

  // Positions of draggables placed in zones: a grid inside the zone.
  const dragBox = useMemo(() => {
    const out = new Map<string, Box>();
    const base = new Map<string, Box>();
    for (const n of scene.nodes) if (n.drag && n.kind !== "repeat") { const b = L.boxes.get(n.id); if (b) base.set(n.id, b); }
    for (const q of L.instances) base.set(q.id, q.box);
    const byZone = new Map<string, string[]>();
    for (const d of drs) {
      const z = rt.place[d.id];
      if (z && z !== d.start) byZone.set(z, [...(byZone.get(z) ?? []), d.id]);
      else if (base.get(d.id)) out.set(d.id, base.get(d.id)!);
    }
    for (const [z, ids] of byZone) {
      const zb = L.boxes.get(z);
      if (!zb) continue;
      const it = base.get(ids[0]) ?? { x: 0, y: 0, w: 120, h: 120 };
      const cols = Math.max(1, Math.floor(zb.w / (it.w + 10)));
      ids.forEach((id, i) => {
        const b = base.get(id) ?? it;
        const cx = zb.x - zb.w / 2 + 10 + (b.w + 10) * (i % cols) + b.w / 2;
        const cy = zb.y - zb.h / 2 + 10 + (b.h + 10) * Math.floor(i / cols) + b.h / 2;
        out.set(id, { x: cx, y: cy, w: b.w, h: b.h });
      });
    }
    return out;
  }, [scene, L, drs, rt.place]);

  const answerOpt = (n: SNode) => (revealed && scene.probe?.commit?.node === n.id ? correctOption(scene, rt, drs, n.id) : null);
  const revealOrder = (n: SNode) => (revealed ? correctOrder(scene, rt, drs, n.id) : null);

  // ── render ──
  const svgNodes: ReactElement[] = [];
  const overlay: ReactElement[] = [];
  const draw = (n: SNode) => {
    if (!visible(n)) return;
    const b = L.boxes.get(n.id);
    const fill = color(n.fill, n.kind === "zone" ? null : COLORS.c6) ?? "none";
    const stroke = color(n.stroke, n.kind === "rect" || n.kind === "zone" ? null : COLORS.ink) ?? "none";
    const sw = n.look?.sw ?? n.sw ?? 3;
    const op = prop(n, "op", 1);
    const rot = prop(n, "rot", 0);
    const pulse = anim.pulse[n.id] ?? 0;
    const k = `${hlKey(n.id)}~${pulse}`;
    const common = { "data-node": n.id, className: cls(hlId === n.id && "is-highlight", pulse > 0 && "sc-pulse"), opacity: op } as Record<string, unknown>;
    if (!b && n.kind !== "connector") return;
    const tr = rot && b ? `rotate(${rot} ${b.x} ${b.y})` : undefined;
    switch (n.kind) {
      case "rect":
        svgNodes.push(<rect key={k} {...common} transform={tr} x={b!.x - b!.w / 2} y={b!.y - b!.h / 2} width={b!.w} height={b!.h} rx={n.r ?? 0} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={n.dash || n.look?.dash ? "12 8" : undefined} />);
        return;
      case "circle":
        svgNodes.push(<circle key={k} {...common} cx={b!.x} cy={b!.y} r={b!.w / 2} fill={fill} stroke={stroke} strokeWidth={sw} />);
        return;
      case "ellipse":
        svgNodes.push(<ellipse key={k} {...common} cx={b!.x} cy={b!.y} rx={b!.w / 2} ry={b!.h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />);
        return;
      case "wedge": {
        const r = b!.w / 2;
        const a0 = (prop(n, "a0") * Math.PI) / 180, a1 = (prop(n, "a1") * Math.PI) / 180;
        const p = (a: number) => `${b!.x + r * Math.cos(a)} ${b!.y + r * Math.sin(a)}`;
        svgNodes.push(<path key={k} {...common} d={`M ${b!.x} ${b!.y} L ${p(a0)} A ${r} ${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} 1 ${p(a1)} Z`} fill={fill} stroke={stroke} strokeWidth={sw} />);
        return;
      }
      case "line":
      case "poly": {
        const [ax, ay] = L.anchors.get(n.id) ?? [0, 0];
        const pts = n.pts.map((q: number[]) => `${q[0] + ax},${q[1] + ay}`).join(" ");
        const rp = rot ? `rotate(${rot} ${ax} ${ay})` : undefined;
        if (n.kind === "line") svgNodes.push(<polyline key={k} {...common} transform={rp} points={pts} fill="none" stroke={color(n.stroke, COLORS.ink)!} strokeWidth={sw} markerEnd={n.head && n.head !== "none" ? "url(#sc-arrow)" : undefined} />);
        else svgNodes.push(n.closed ? <polygon key={k} {...common} transform={rp} points={pts} fill={fill} stroke={stroke} strokeWidth={sw} /> : <polyline key={k} {...common} transform={rp} points={pts} fill="none" stroke={stroke} strokeWidth={sw} />);
        return;
      }
      case "text":
      case "math": {
        const str = n.kind === "math" ? n.tex : fmtText(n);
        const tb = textBox(str, n.size, band, n.w);
        const perLine = Math.max(1, Math.floor(((n.w ?? tb.w) * 0.92) / tb.adv));
        const lines: string[] = [];
        let cur = "";
        for (const word of str.split(/\s+/)) {
          if ((cur + " " + word).trim().length > perLine && cur) { lines.push(cur); cur = word; } else cur = (cur + " " + word).trim();
        }
        if (cur) lines.push(cur);
        const align = n.align ?? "middle";
        const x = align === "start" ? b!.x - b!.w / 2 : align === "end" ? b!.x + b!.w / 2 : b!.x;
        const y0 = b!.y - ((lines.length - 1) * tb.lh) / 2;
        svgNodes.push(
          <text key={k} {...common} x={x} y={y0} fontSize={tb.em} fontWeight={n.bold || n.size === "title" ? 700 : 500} textAnchor={align} dominantBaseline="central" fill={color(n.fill, COLORS.ink)!}>
            {lines.map((ln, i) => <tspan key={i} x={x} dy={i ? tb.lh : 0}>{ln}</tspan>)}
          </text>,
        );
        return;
      }
      case "sprite": {
        if (n.drag) return; // drawn as an overlay control
        svgNodes.push(<Sprite key={k} lib={n.lib} b={b!} common={common} />);
        return;
      }
      case "image":
        svgNodes.push(<rect key={k} {...common} x={b!.x - b!.w / 2} y={b!.y - b!.h / 2} width={b!.w} height={b!.h} fill={COLORS.c6!} />);
        return;
      case "repeat":
        for (const q of L.instances.filter((x) => x.of === n.id)) {
          if (n.item.drag) continue;
          const it = n.item;
          if (it.kind === "sprite") svgNodes.push(<Sprite key={q.id} lib={it.lib} b={q.box} common={{ "data-node": q.id }} />);
          else if (it.kind === "circle") svgNodes.push(<circle key={q.id} data-node={q.id} cx={q.box.x} cy={q.box.y} r={q.box.w / 2} fill={color(it.fill, COLORS.c3d)!} stroke={color(it.stroke, COLORS.ink)!} strokeWidth={2} />);
          else svgNodes.push(<rect key={q.id} data-node={q.id} x={q.box.x - q.box.w / 2} y={q.box.y - q.box.h / 2} width={q.box.w} height={q.box.h} fill={color(it.fill, COLORS.c3d)!} stroke={color(it.stroke, COLORS.ink)!} strokeWidth={2} />);
        }
        return;
      case "axis": {
        const n0 = Math.round((n.to - n.from) / n.step);
        const every = n.every ?? 1;
        const els = [];
        for (let i = 0; i <= n0; i++) {
          const f = i / n0;
          const x = n.orient === "h" ? b!.x - n.len / 2 + f * n.len : b!.x;
          const y = n.orient === "h" ? b!.y : b!.y + n.len / 2 - f * n.len;
          els.push(<line key={`t${i}`} x1={x} x2={n.orient === "h" ? x : x - 14} y1={y} y2={n.orient === "h" ? y + 14 : y} stroke={COLORS.ink!} strokeWidth={3} />);
          if (i % every === 0) els.push(<text key={`l${i}`} x={n.orient === "h" ? x : x - 22} y={n.orient === "h" ? y + 40 : y} fontSize={textSize("label", band)} textAnchor={n.orient === "h" ? "middle" : "end"} dominantBaseline="central" fill={COLORS.ink!}>{Math.round((n.from + i * n.step) * 1000) / 1000}</text>);
        }
        svgNodes.push(
          <g key={k} {...common}>
            <line x1={n.orient === "h" ? b!.x - n.len / 2 : b!.x} x2={n.orient === "h" ? b!.x + n.len / 2 : b!.x} y1={n.orient === "h" ? b!.y : b!.y - n.len / 2} y2={n.orient === "h" ? b!.y : b!.y + n.len / 2} stroke={COLORS.ink!} strokeWidth={4} />
            {els}
          </g>,
        );
        return;
      }
      case "connector": {
        const a = L.boxes.get(n.from), c = L.boxes.get(n.to);
        if (!a || !c) return;
        svgNodes.push(<line key={k} {...common} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={color(n.stroke, COLORS.ink)!} strokeWidth={sw} markerEnd={n.head === "end" ? "url(#sc-arrow)" : undefined} />);
        return;
      }
      case "zone": {
        if (n.visible) svgNodes.push(<rect key={k} {...common} x={b!.x - b!.w / 2} y={b!.y - b!.h / 2} width={b!.w} height={b!.h} rx={20} fill={color(n.fill, COLORS.surface)!} stroke={COLORS.line!} strokeWidth={4} strokeDasharray="14 10" />);
        overlay.push(
          <button type="button" key={`z-${k}`} data-zone={n.id} data-exempt-hit className={cls("sc-zone", picked && "is-armed", hlId === n.id && "is-highlight")} style={px(b!)}
            aria-label={pick(n.label, lang) || n.tl || n.id} onClick={() => tapZone(n.id)} tabIndex={picked ? 0 : -1} />,
        );
        return;
      }
      case "choice": {
        const tile = B.tile / DPU, gap = B.gap / DPU;
        const cols = n.layout === "grid" ? 2 : n.layout === "row" ? n.options.length : 1;
        const rows = Math.ceil(n.options.length / cols);
        const right = answerOpt(n);
        // A column of answer tiles is widened to fit its longest label (the validator measured the minimum).
        const longest = Math.max(...n.options.map((o: any) => (o.label ? textBox(pick(o.label, lang), "label", band).w : 0)));
        const tileW = cols === 1 ? Math.min(940, Math.max(tile, b!.w, longest + 80)) : tile;
        n.options.forEach((o: any, i: number) => {
          const cx = b!.x - ((cols - 1) * (tile + gap)) / 2 + (i % cols) * (tile + gap);
          const cy = b!.y - ((rows - 1) * (tile + gap)) / 2 + Math.floor(i / cols) * (tile + gap);
          const label = o.label ? pick(o.label, lang) : o.tex ?? "";
          const g = o.sprite ? glyph(o.sprite) : null;
          const sel = rt.vals[n.var] === o.id;
          overlay.push(
            <button type="button" key={`${hlKey(n.id)}-${o.id}`} data-choice={o.id} className={cls("ek-btn", "sc-tile", sel && "is-selected", right === o.id && "is-answer", hlId === `${n.id}:${o.id}` && "is-highlight")}
              style={{ ...px({ x: cols === 1 ? b!.x : cx, y: cy, w: cols === 1 ? tileW : tile, h: tile }), fontSize: fontPx("label", label), minWidth: 0, minHeight: 0 }}
              aria-pressed={sel} onClick={() => choose(n, o.id)}>
              {g && <span aria-hidden="true" style={{ fontSize: tile * scale * 0.4 }}>{g} </span>}
              {label}
              {right === o.id && <span className="ek-tick"> ✓</span>}
            </button>,
          );
        });
        return;
      }
      case "button":
        overlay.push(
          <button type="button" key={k} data-target={n.act === "check" ? "check" : n.id} data-node={n.id} className={cls("ek-btn", n.act === "check" && "ek-btn-primary", hlId === n.id && "is-highlight")}
            style={{ ...px(b!), fontSize: fontPx("label", n.label.en), minWidth: 0, minHeight: 0 }} onClick={() => button(n)}>
            {pick(n.label, lang)}
          </button>,
        );
        return;
      case "order": {
        const arr = rt.order[n.id] ?? [];
        const hh = B.hit / DPU, g = B.gap / DPU, tile = B.tile / DPU;
        const ro = revealOrder(n);
        arr.forEach((id, i) => {
          const it = n.items.find((x: any) => x.id === id);
          const box = n.orient === "column"
            ? { x: b!.x, y: b!.y - b!.h / 2 + hh / 2 + i * (hh + g), w: 760, h: hh }
            : { x: b!.x - b!.w / 2 + tile / 2 + i * (tile + g), y: b!.y, w: tile, h: tile };
          const label = it?.label ? pick(it.label, lang) : "";
          const sel = selOrder?.list === n.id && selOrder?.item === id;
          overlay.push(
            <button type="button" key={`${hlKey(n.id)}-${id}`} data-order-item={id} className={cls("ek-btn", "sc-order", sel && "is-selected", hlId === `${n.id}:${id}` && "is-highlight")}
              style={{ ...px(box), fontSize: fontPx("label", label), minWidth: 0, minHeight: 0 }} aria-pressed={sel} onClick={() => tapOrderItem(n.id, id)}>
              <span className="sc-order-n">{i + 1}</span> {it?.sprite && glyph(it.sprite)} {label}
              {ro && <span className="ek-tick"> ✓{ro.indexOf(id) + 1}</span>}
            </button>,
          );
        });
        return;
      }
      case "slider": {
        const v = scene.vars.find((x: any) => x.id === n.var);
        overlay.push(
          <input key={k} type="range" className="sc-slider" data-node={n.id} style={px(b!)} min={v.min} max={v.max} step={v.step ?? (v.type === "int" ? 1 : (v.max - v.min) / 100)}
            value={Number(rt.vals[n.var])} aria-label={pick(n.say, lang) || n.tl || n.var} onChange={(e) => setVar(n.var, Number(e.target.value), false)} />,
        );
        return;
      }
      case "stepper": {
        const v = scene.vars.find((x: any) => x.id === n.var);
        const st = v.step ?? 1;
        const cur = Number(rt.vals[n.var]);
        const w3 = b!.w / 3;
        overlay.push(
          <button type="button" key={`${k}-m`} className="ek-btn ek-btn-round" data-node={`${n.id}:minus`} style={{ ...px({ ...b!, x: b!.x - w3, w: w3 }), minWidth: 0, minHeight: 0 }} disabled={cur <= v.min} onClick={() => setVar(n.var, Math.max(v.min, Math.round((cur - st) * 1e6) / 1e6))}>−</button>,
          <output key={`${k}-v`} className="ek-readout" style={{ ...px({ ...b!, w: w3 }), display: "flex", alignItems: "center", justifyContent: "center" }}>{cur}</output>,
          <button type="button" key={`${k}-p`} className="ek-btn ek-btn-round" data-node={`${n.id}:plus`} style={{ ...px({ ...b!, x: b!.x + w3, w: w3 }), minWidth: 0, minHeight: 0 }} disabled={cur >= v.max} onClick={() => setVar(n.var, Math.min(v.max, Math.round((cur + st) * 1e6) / 1e6))}>+</button>,
        );
        return;
      }
      case "toggle":
        overlay.push(
          <button type="button" key={k} data-node={n.id} className={cls("ek-btn", rt.vals[n.var] === true && "is-selected")} style={{ ...px(b!), minWidth: 0, minHeight: 0 }} aria-pressed={rt.vals[n.var] === true}
            onClick={() => setVar(n.var, !(rt.vals[n.var] === true))}>
            {pick(n.label, lang)}
          </button>,
        );
        return;
      case "keypad":
        overlay.push(
          <div key={k} style={{ ...px(b!), overflow: "visible" }} data-node={n.id}>
            <NumPad value={String(rt.vals[n.var] ?? "")} lang={lang} maxLen={n.digits} onChange={(s) => setVar(n.var, s === "" ? 0 : Number(s), false)} />
          </div>,
        );
        return;
      default:
        return;
    }
  };
  for (const n of scene.nodes) draw(n);
  // Draggables (sprites with drag, and repeat instances with item.drag) as tap-first overlay buttons.
  for (const d of drs) {
    const b = dragBox.get(d.id);
    const n = nodeOf(d.id) ?? nodeOf(d.cls);
    if (!b || !n || !visible(n)) continue;
    const it = n.kind === "repeat" ? n.item : n;
    const g = it.kind === "sprite" ? glyph(it.lib) : null;
    overlay.push(
      <button type="button" key={`d-${hlKey(d.id)}`} data-drag={d.id} className={cls("sc-drag", picked === d.id && "is-selected", hlId === d.id && "is-highlight")}
        style={{ ...px(b), fontSize: Math.min(b.w, b.h) * scale * 0.62 }} aria-pressed={picked === d.id} aria-label={pick(it.say, lang) || it.tl || d.id} onClick={() => tapDraggable(d.id)}>
        {g ?? <span className="sc-chip" style={{ background: color(it.fill, COLORS.c3d) ?? undefined }} />}
      </button>,
    );
  }

  const bg = scene.stage.bg === "none" ? "transparent" : color(scene.stage.bg, COLORS.bg)!;
  return (
    <EngineRoot name="scene" ageBand={ageBand} mode={scene.meta.template ?? "free"}>
      <div ref={wrap} className="sc-stage" style={{ position: "relative", width: "100%", height: L.H * scale, background: bg }} data-template={scene.meta.template}>
        <svg className="sc-svg" viewBox={`0 0 ${L.W} ${L.H}`} width="100%" height="100%" role="img" aria-label={pick(scene.meta.title, lang)} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <marker id="sc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill={COLORS.ink!} /></marker>
          </defs>
          {svgNodes}
        </svg>
        {overlay}
      </div>
      <Verdict ok={verdict} lang={lang} />
    </EngineRoot>
  );
}

function Sprite({ lib, b, common }: { lib: string; b: Box; common: Record<string, unknown> }) {
  const g = glyph(lib);
  if (!g) {
    return (
      <g {...common}>
        <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx={16} fill={COLORS.c6!} stroke={COLORS.line!} strokeWidth={3} />
        <text x={b.x} y={b.y} fontSize={Math.min(b.w, b.h) * 0.3} textAnchor="middle" dominantBaseline="central" fill={COLORS.ink!}>{lib.split(".").pop()}</text>
      </g>
    );
  }
  return <text {...common} x={b.x} y={b.y} fontSize={Math.min(b.w, b.h) * 0.8} textAnchor="middle" dominantBaseline="central">{g}</text>;
}

export const engine: EngineModule = { def, Component: SceneEngine };
