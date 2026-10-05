// The whiteboard player (W2-B): draws a WhiteboardScript the way a teacher draws on a board while she talks: each
// stroke drawn along its length, each label written on letter by letter, fills washed in once their outline is down,
// highlights circled, erased things fading. Times are ms from `startAt` (a performance.now() time: the line's audio
// anchor, src/modules/whiteboard/clock.ts). One SVG in the script's board units (viewBox), so the parent box decides
// the size and nothing can be drawn outside it (the SVG clips; the script was clamped to the board by normalizeScript).
//
// Used by the Studio stage's `whiteboard` renderer (StudioWhiteboard.tsx) and by the frame's explainer@1 engine (the
// template rungs). Reduced motion: every op appears complete at its startMs, nothing is animated along a path.
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { WbOp, WhiteboardScript } from "../../../shared/studio.ts";
import { erasers, opGeometry, opProgress, visibleShare, type OpGeometry } from "../../../shared/whiteboard.js";
import { HAND_FONT, paletteFor, type Ink, type Palette } from "./palette.ts";

const WEIGHT: Record<number, number> = { 1: 2.4, 2: 3.4, 3: 5 };
const nowMs = () => performance.now();

export interface WhiteboardPlayerProps {
  script: WhiteboardScript;
  /** Ops already on the board from the previous script (mode "continue"), drawn complete underneath. */
  prior?: WbOp[];
  /** performance.now() time of the anchor; null = not started (only `prior` shows). */
  startAt: number | null;
  reducedMotion?: boolean;
  /** CSS size of the SVG (default: fill the parent). */
  width?: number | string;
  height?: number | string;
  className?: string;
  /** A transient attention ring on an op (the host's highlight command): changes of `seq` re-trigger it. */
  pulse?: { target: string; seq: number } | null;
  onDone?: () => void;
  /** Time to show when not animating (tests, the reduced-motion snapshot): overrides the clock. */
  frozenAt?: number;
  /**
   * Onset (ms from the anchor) of each clause of her line (HUMAN-VOICE DeliveryClause index). An op with `clause` is timed
   * from its clause's onset; without onsets the script was normalised without clauses (shared/whiteboard.js), so none
   * carries one. An op whose clause has no onset is drawn from the anchor.
   */
  clauseOnsets?: readonly number[];
  /**
   * Once the drawing is done, every written word (text / label op) becomes a tap target and reports its op (W2-B fixer,
   * minor 12: "point to the stamen" style covert checks, graded by the host from the op id, never by the frame).
   */
  onTapText?: (op: { id: string; text: string }) => void;
}

/** The script with clause-relative ops moved onto the line's clock (and its duration stretched to cover them). */
export function onLineClock(script: WhiteboardScript, clauseOnsets?: readonly number[]): WhiteboardScript {
  if (!clauseOnsets?.length || !script.ops.some((o) => o.clause !== undefined)) return script;
  const ops = script.ops.map((o) => {
    const on = o.clause !== undefined ? clauseOnsets[o.clause] : undefined;
    return typeof on === "number" && Number.isFinite(on) && on > 0 ? { ...o, startMs: o.startMs + on, endMs: o.endMs + on } : o;
  });
  const end = ops.reduce((m, o) => Math.max(m, o.endMs), 0);
  return { ...script, ops, durationMs: Math.max(script.durationMs, end) };
}

/** The clock: t (ms since startAt), advanced on animation frames only while the script is still drawing. */
function useTimeline(startAt: number | null, endMs: number, frozenAt: number | undefined, onDone?: () => void): number {
  const [t, setT] = useState(() => (frozenAt !== undefined ? frozenAt : startAt === null ? -1 : nowMs() - startAt));
  const done = useRef(false);
  const latestDone = useRef(onDone);
  latestDone.current = onDone;
  useEffect(() => {
    done.current = false;
    if (frozenAt !== undefined) { setT(frozenAt); return; }
    if (startAt === null) { setT(-1); return; }
    let raf = 0;
    let last = -2;
    const tick = () => {
      const now = nowMs() - startAt;
      // ~30 fps is plenty for chalk and halves the work on a low-end phone
      if (now - last >= 32 || now >= endMs) { setT(now); last = now; }
      if (now < endMs + 20) raf = requestAnimationFrame(tick);
      else if (!done.current) { done.current = true; latestDone.current?.(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startAt, endMs, frozenAt]);
  return t;
}

export function WhiteboardPlayer({ script: given, prior, startAt, reducedMotion = false, width = "100%", height = "100%", className, pulse, onDone, frozenAt, clauseOnsets, onTapText }: WhiteboardPlayerProps) {
  const script = useMemo(() => onLineClock(given, clauseOnsets), [given, clauseOnsets]);
  const pal = paletteFor(script.board.ground);
  const { w: BW, h: BH } = script.board;
  const all = useMemo(() => [...(prior ?? []), ...script.ops], [prior, script]);
  const byId = useMemo(() => new Map(all.map((o) => [o.id, o])), [all]);
  // geometry is computed when an op first draws (a board's first paint, before any stroke, computes none of it)
  const geoms = useMemo(() => {
    const cache = new Map<string, OpGeometry>();
    return { get: (id: string) => { let g = cache.get(id); if (!g) { const o = byId.get(id); if (!o) return undefined; g = opGeometry(o, byId); cache.set(id, g); } return g; } };
  }, [byId]);
  const er = useMemo(() => erasers({ ...script, ops: all }), [script, all]);
  const priorIds = useMemo(() => new Set((prior ?? []).map((o) => o.id)), [prior]);
  const t = useTimeline(startAt, script.durationMs, frozenAt, onDone);
  const q = (op: WbOp) => {
    if (priorIds.has(op.id)) return 1;
    const p = opProgress(op, t);
    return reducedMotion ? (p > 0 ? 1 : 0) : Math.round(p * 60) / 60;
  };
  const pulseBox = pulse ? geoms.get(pulse.target)?.box ?? null : null;
  return (
    <svg className={className} viewBox={`0 0 ${BW} ${BH}`} width={width} height={height} preserveAspectRatio="xMidYMid meet"
      role="img" aria-label={ariaOf(script)} data-wb-t={Math.max(0, Math.round(t))} style={{ display: "block", overflow: "hidden", fontFamily: HAND_FONT }}>
      <rect x={0} y={0} width={BW} height={BH} fill={pal.ground} />
      {pal.grid && <Grid w={BW} h={BH} color={pal.grid} />}
      {all.map((op) => {
        if (op.op === "erase") return null;
        // an earlier board's op fades when THIS script erases it, at the eraser's time (not at once)
        const vis = visibleShare(op, t, er);
        const p = q(op);
        if (p <= 0 || vis <= 0) return null;
        return <OpView key={op.id} op={op} g={geoms.get(op.id)!} p={p} vis={vis} pal={pal} reducedMotion={reducedMotion} />;
      })}
      {pulseBox && <PulseRing key={pulse!.seq} box={pulseBox} color={pal.ink.mark} reducedMotion={reducedMotion} />}
      {onTapText && t >= script.durationMs && script.ops.filter((o) => (o.op === "text" || o.op === "label") && visibleShare(o, t, er) > 0).map((o) => {
        const b = geoms.get(o.id)!.box;
        const text = (o as { text: string }).text;
        // a hit area a little larger than the word (a child's finger), transparent: the word itself stays as drawn
        return <rect key={`tap-${o.id}`} data-tap={o.id} x={b.x - 6} y={b.y - 6} width={b.w + 12} height={b.h + 12} fill="transparent" style={{ cursor: "pointer" }}
          role="button" aria-label={text} onClick={() => onTapText({ id: o.id, text })} />;
      })}
    </svg>
  );
}

function ariaOf(script: WhiteboardScript): string {
  const words = script.ops.flatMap((o) => (o.op === "text" || o.op === "label" ? [o.text] : o.op === "numwork" ? [o.rows.map((r) => r.join(" ")).join(", ")] : []));
  return words.length ? `Board: ${words.slice(0, 8).join("; ")}` : "Board drawing";
}

const Grid = memo(function Grid({ w, h, color }: { w: number; h: number; color: string }) {
  const lines: string[] = [];
  for (let x = 25; x < w; x += 25) lines.push(`M${x},0 V${h}`);
  for (let y = 25; y < h; y += 25) lines.push(`M0,${y} H${w}`);
  return <path d={lines.join(" ")} stroke={color} strokeWidth={1} fill="none" />;
});

const OpView = memo(function OpView({ op, g, p, vis, pal, reducedMotion }: { op: WbOp; g: OpGeometry; p: number; vis: number; pal: Palette; reducedMotion: boolean }) {
  const color = pal.ink[(op.ink ?? "chalk") as Ink];
  const sw = WEIGHT[op.weight ?? 2];
  // the op's progress is spent on its paths in order, then on its texts (a label's leader, then its word)
  const parts = g.paths.length + g.texts.length;
  const share = (i: number) => (parts ? Math.max(0, Math.min(1, p * parts - i)) : p);
  const fillInk = "fill" in op && op.fill ? pal.ink[op.fill as Ink] : null;
  const fillP = fillInk && g.fill ? Math.max(0, Math.min(1, (p - 0.55) / 0.45)) : 0;
  const pulse = op.op === "highlight" && op.style === "pulse";
  return (
    <g opacity={vis} data-op={op.op} data-id={op.id}>
      {fillInk && g.fill && fillP > 0 && <path d={g.fill} fill={fillInk} fillOpacity={pal.fillAlpha * fillP} stroke="none" />}
      {g.paths.map((d, i) => {
        const s = share(i);
        return s > 0 ? (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
            strokeDasharray={op.op === "line" && op.dashed ? "0.02 0.018" : s < 1 ? "1 1" : undefined}
            strokeDashoffset={op.op === "line" && op.dashed ? undefined : s < 1 ? 1 - s : undefined} opacity={op.op === "highlight" ? 0.9 : 1} />
        ) : null;
      })}
      {g.texts.map((tx, i) => {
        const s = share(g.paths.length + i);
        if (s <= 0) return null;
        const chars = [...tx.text];
        const shown = reducedMotion || s >= 1 ? tx.text : chars.slice(0, Math.max(1, Math.ceil(chars.length * s))).join("");
        return (
          <text key={i} x={tx.x} y={tx.y} fontSize={tx.size} fill={color} textAnchor={tx.align === "start" ? "start" : tx.align === "end" ? "end" : "middle"}
            dominantBaseline="middle" style={{ fontVariantNumeric: "tabular-nums" }}>{shown}</text>
        );
      })}
      {pulse && p > 0 && p < 1 && !reducedMotion && (
        <rect x={g.box.x - 8} y={g.box.y - 8} width={g.box.w + 16} height={g.box.h + 16} rx={10} fill="none" stroke={pal.ink.mark} strokeWidth={3}
          opacity={0.35 + 0.5 * Math.abs(Math.sin(p * Math.PI * 3))} />
      )}
    </g>
  );
});

function PulseRing({ box, color, reducedMotion }: { box: { x: number; y: number; w: number; h: number }; color: string; reducedMotion: boolean }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), 1800);
    return () => clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <rect x={box.x - 10} y={box.y - 10} width={box.w + 20} height={box.h + 20} rx={12} fill="none" stroke={color} strokeWidth={4} data-testid="wb-pulse">
      {!reducedMotion && <animate attributeName="opacity" values="1;0.25;1" dur="0.6s" repeatCount="3" />}
    </rect>
  );
}
