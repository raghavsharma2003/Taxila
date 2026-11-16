// Round 7 M5a: the scene player. A code-built cinematic scene (shared/scene.js) drawn as one SVG in stage units: every
// frame it asks sceneAt(scene, t) where each actor is and draws its parts there, so what the child sees is exactly what
// the lint and the facts were computed from. The film follows her voice: beats bound to clauses are pinned to the clause
// onsets (lineWarp). Reduced motion: the scene holds still at each beat (stillAt) — the same states, no movement.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { Scene, ScenePart } from "../../../shared/scene.js";
import { actorParts, CAPTION_SIZE, lineWarp, sceneAt, stillAt, textW } from "../../../shared/scene.js";
import { CAPTION_PILL, GROUND, INK, INK_ON, PAINT } from "./palette";

const paint = (k?: string) => (k ? PAINT[k] ?? "none" : "none");

function partEl(p: ScenePart, i: number, ink: string) {
  const common = { fill: p.fill ? paint(p.fill) : "none", stroke: p.stroke ? paint(p.stroke) : "none", strokeWidth: p.sw ?? (p.stroke ? 2 : 0), opacity: p.opacity ?? 1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (p.shape) {
    case "circle": return <circle key={i} {...common} cx={p.c![0]} cy={p.c![1]} r={p.r} />;
    case "ellipse": return <ellipse key={i} {...common} cx={p.c![0]} cy={p.c![1]} rx={p.rx} ry={p.ry} transform={p.rot ? `rotate(${p.rot} ${p.c![0]} ${p.c![1]})` : undefined} />;
    case "rect": return <rect key={i} {...common} x={p.at![0]} y={p.at![1]} width={p.w} height={p.h} rx={p.round ?? 0} />;
    case "poly": return p.fill && p.closed !== false
      ? <polygon key={i} {...common} points={p.points!.map((q) => q.join(",")).join(" ")} />
      : <polyline key={i} {...common} fill="none" points={p.points!.map((q) => q.join(",")).join(" ")} />;
    case "sector": {
      const [cx, cy] = p.c!, r = p.r!, a0 = ((p.from as number) * Math.PI) / 180, a1 = ((p.to as number) * Math.PI) / 180;
      const large = Math.abs((p.to as number) - (p.from as number)) > 180 ? 1 : 0;
      return <path key={i} {...common} d={`M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large},1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`} />;
    }
    case "line": return <line key={i} {...common} x1={(p.from as number[])[0]} y1={(p.from as number[])[1]} x2={(p.to as number[])[0]} y2={(p.to as number[])[1]} stroke={paint(p.stroke)} strokeWidth={p.sw ?? 3} />;
    case "path": return <path key={i} {...common} d={p.d} />;
    case "text": return <text key={i} x={p.at![0]} y={p.at![1]} fontSize={p.size ?? 14} textAnchor="middle" fill={ink} fontWeight={600}>{p.text}</text>;
    default: return null;
  }
}

export interface ScenePlayerProps {
  scene: Scene;
  /** performance.now() of her line's start (the anchor); null = the first frame, still. */
  startAt: number | null;
  clauseOnsets?: readonly number[];
  reducedMotion?: boolean;
  /** Tests and recordings: show this scene time and do not animate. */
  frozenAt?: number;
  width?: number | string;
  height?: number | string;
  onDone?: () => void;
}

export const ScenePlayer = memo(function ScenePlayer({ scene, startAt, clauseOnsets, reducedMotion = false, frozenAt, width = "100%", height = "100%", onDone }: ScenePlayerProps) {
  const warp = useMemo(() => lineWarp(scene, clauseOnsets), [scene, clauseOnsets]);
  const [tLine, setTLine] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (frozenAt !== undefined || startAt === null) return;
    let raf = 0;
    const tick = () => {
      const t = performance.now() - startAt;
      setTLine(Math.max(0, t));
      if (warp(t) < scene.durationMs + 200) raf = requestAnimationFrame(tick);
      else if (!done.current) { done.current = true; onDone?.(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startAt, frozenAt, warp, scene.durationMs, onDone]);
  const t0 = frozenAt ?? Math.min(scene.durationMs, warp(tLine));
  const t = reducedMotion ? stillAt(scene, t0) : t0;
  const { actors, captions } = sceneAt(scene, t);
  const { w: W, h: H } = scene.stage;
  const ink = INK_ON[scene.bg] ?? INK;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={height} role="img" aria-label={scene.beats.map((b) => b.says).join(", ")} style={{ display: "block", background: GROUND[scene.bg] ?? GROUND.paper, fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif' }}>
      {actors.map((s) => (s.opacity < 0.01 ? null : (
        <g key={s.id} data-actor={s.id} opacity={s.opacity} transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(${s.scale})`}>
          {actorParts(s.a).map((p, i) => partEl(p, i, ink))}
        </g>
      )))}
      {captions.map((c) => {
        const w = Math.min(W - 8, textW(c.text, CAPTION_SIZE) + 20), y = c.at === "top" ? 6 : H - 38;
        return (
          <g key={`${c.t}:${c.text}`} data-caption={c.at}>
            <rect x={(W - w) / 2} y={y} width={w} height={32} rx={16} fill={scene.bg === "night" ? CAPTION_PILL.night : CAPTION_PILL.day} opacity={0.92} />
            <text x={W / 2} y={y + 22} fontSize={CAPTION_SIZE} fontWeight={600} textAnchor="middle" fill={ink}>{c.text}</text>
          </g>
        );
      })}
    </svg>
  );
});
