// The code skeletons (LIVE-STUDIO D1, §3.4, §3.12; BUILD-PLAN W2-H #1, #4). One small renderer per archetype skeleton id:
// the CORRECT, minimal version of the piece drawn from the plan's params with our own code (kit truth in, right parts,
// right heights, right directions out). Two roles:
//   - the "being made" sketch (pencil strokes, inert) while a live build streams;
//   - the activity itself when the build is not there (the first rung of the fallback ladder: "skeleton as activity"):
//     interactive, and graded by the HOST (useStageMoment().answer), never by this code.
// Drawn in the archetype's design units (360 x 320) inside the stage box; every target is ≥ 54 units (≥ 46 CSS px at the
// 360 x 800 phone tray), ≥ 66 units (56 px) for the younger band. Words: the piece's Q8-checked strings table when it
// has one, else the English chrome (src/copy/en.ts W2H). No spinner, no score, no timer, no error text.
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import type { ArtifactRendererProps } from "./renderers.ts";
import { useStageMoment } from "./stageContext.ts";
import { tw2h, type W2HKey } from "../copy/en.ts";

type P = Record<string, any>;
type S = Record<string, string>;
interface SkProps { p: P; s: S; young: boolean; w: number; h: number }

const word = (s: S, key: string | null, fallback: W2HKey, vars: Record<string, string | number> = {}) => (key && s[key]) || tw2h(fallback, vars);
const nameOf = (s: S, key: string) => s[key] || key;
const fmtFrac = (v: number, den?: number) => {
  if (den) { const k = Math.round(v * den); return k === 0 ? "0" : k === den ? "1" : `${k}/${den}`; }
  return String(+v.toFixed(3));
};

/** One graded attempt loop, shared by every skeleton: the host's verdict, feedback, completion, "Show me again". */
function useRun() {
  const m = useStageMoment();
  const [fb, setFb] = useState<"right" | "wrong" | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { setFb(null); setBusy(false); setDone(false); }, [m.epoch]);
  const submit = async (v: unknown) => {
    if (!m.interactive || busy || done) return null;
    setBusy(true);
    const r = await m.answer(v);
    setBusy(false);
    if (!r) return null;
    setFb(r.correct ? "right" : "wrong");
    if (r.complete) setDone(true);
    return r;
  };
  return { fb, setFb, busy, done, submit, live: m.interactive, epoch: m.epoch };
}

function Btn({ x, y, w, h, label, onTap, on = false, disabled = false, testid }: { x: number; y: number; w: number; h: number; label: ReactNode; onTap: () => void; on?: boolean; disabled?: boolean; testid?: string }) {
  const key = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); } };
  return (
    <g className={`sk-btn${on ? " is-on" : ""}${disabled ? " is-off" : ""}`} role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onTap} onKeyDown={disabled ? undefined : key} data-target-btn="1" data-testid={testid}>
      <rect x={x} y={y} width={w} height={h} rx={12} />
      <text x={x + w / 2} y={y + h / 2} dominantBaseline="central" textAnchor="middle">{label}</text>
    </g>
  );
}

function Feedback({ fb, s, done, y = 304 }: { fb: "right" | "wrong" | null; s: S; done: boolean; y?: number }) {
  const t = done ? word(s, "done", "done") : fb === "right" ? word(s, "right", "right") : fb === "wrong" ? word(s, "wrong", "wrong") : "";
  return <text className={`sk-fb${fb ? ` is-${fb}` : ""}`} x={18} y={y} aria-live="polite">{t}</text>;
}

/** The piece's one line of words, left-aligned and short of the top-right corner (the stage's 44 px control sits there). */
function Title({ text, y = 30 }: { text: string; y?: number }) {
  const t = text.length > 36 ? `${text.slice(0, 35).trimEnd()}…` : text;
  return <text className="sk-title" x={14} y={y}>{t}</text>;
}

const T = (young: boolean) => (young ? 66 : 54);

// ───────────────────────────── fraction-parts (shade_fraction) ─────────────────────────────

function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const pt = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}

function FractionParts({ p, s, young }: SkProps) {
  const items: { id: string; n: number; d: number }[] = p.items ?? [];
  const run = useRun();
  const [idx, setIdx] = useState(0);
  const [shaded, setShaded] = useState<Set<number>>(new Set());
  useEffect(() => { setIdx(0); setShaded(new Set()); }, [run.epoch]);
  const it = items[Math.min(idx, items.length - 1)];
  if (!it) return null;
  const toggle = (i: number) => { if (!run.live || run.done) return; run.setFb(null); setShaded((cur) => { const n = new Set(cur); n.has(i) ? n.delete(i) : n.add(i); return n; }); };
  const check = async () => {
    const r = await run.submit({ n: shaded.size, d: it.d });
    if (r?.correct && !r.complete) setTimeout(() => { setIdx((i) => i + 1); setShaded(new Set()); run.setFb(null); }, 900);
  };
  const parts = Array.from({ length: it.d }, (_, i) => i);
  const bh = T(young);
  return (
    <g data-item={it.id}>
      <Title text={`${word(s, "instr", "shade", { f: "" })}`} y={26} />
      <text className="sk-big" x={180} y={62} textAnchor="middle" data-target="1">{`${it.n}/${it.d}`}</text>
      {p.picture === "bar"
        ? parts.map((i) => {
          const W = 300 / it.d;
          return <rect key={i} className={`sk-part${shaded.has(i) ? " is-on" : ""}`} x={30 + i * W} y={110} width={W} height={Math.max(70, bh)} data-part={i} data-shaded={shaded.has(i)}
            role="button" aria-pressed={shaded.has(i)} tabIndex={0} onClick={() => toggle(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }} />;
        })
        : parts.map((i) => <path key={i} className={`sk-part${shaded.has(i) ? " is-on" : ""}`} d={sectorPath(130, 168, 82, (360 / it.d) * i, (360 / it.d) * (i + 1))} data-part={i}
          data-shaded={shaded.has(i)} role="button" aria-pressed={shaded.has(i)} tabIndex={0} onClick={() => toggle(i)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }} />)}
      <Btn x={p.picture === "bar" ? 220 : 236} y={p.picture === "bar" ? 206 : 196} w={110} h={bh} label={word(s, "check", "check")} onTap={check} disabled={!run.live || run.busy || run.done} testid="sk-check" />
      <Feedback fb={run.fb} s={s} done={run.done} />
    </g>
  );
}

// ───────────────────────────── number-line (number_line_jump) ─────────────────────────────

function NumberLine({ p, s, young }: SkProps) {
  const run = useRun();
  const items: { id: string; target: number }[] = p.items ?? [];
  const steps = Math.max(1, Math.round((p.max - p.min) / p.step));
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(Math.round(((p.start ?? p.min) - p.min) / p.step));
  useEffect(() => { setIdx(0); setPos(Math.round(((p.start ?? p.min) - p.min) / p.step)); }, [run.epoch, p.start, p.min, p.step]);
  const it = items[Math.min(idx, items.length - 1)];
  if (!it) return null;
  const den = p.format === "fraction" ? p.den : undefined;
  const X = (k: number) => 30 + (300 * k) / steps;
  const value = +(p.min + pos * p.step).toFixed(6);
  const move = (d: number) => { if (!run.live || run.done) return; run.setFb(null); setPos((k) => Math.max(0, Math.min(steps, k + d))); };
  const check = async () => {
    const r = await run.submit({ value });
    if (r?.correct && !r.complete) setTimeout(() => { setIdx((i) => i + 1); run.setFb(null); }, 900);
  };
  const bh = T(young);
  return (
    <g data-item={it.id}>
      <Title text={word(s, "instr", "jump", { f: "" })} y={26} />
      <text className="sk-big" x={180} y={64} textAnchor="middle" data-target="1">{fmtFrac(it.target, den)}</text>
      <line className="sk-axis" x1={30} y1={140} x2={330} y2={140} />
      {Array.from({ length: steps + 1 }, (_, k) => (
        <g key={k}>
          <line className="sk-tick" x1={X(k)} y1={130} x2={X(k)} y2={150} />
          {k % Math.max(1, p.labelEvery ?? 1) === 0 && <text className="sk-small" x={X(k)} y={170} textAnchor="middle">{fmtFrac(p.min + k * p.step, den)}</text>}
        </g>
      ))}
      <g className="sk-marker" transform={`translate(${X(pos)},120)`} data-value={value}><path d="M0,18 L-10,0 L10,0 Z" /></g>
      <Btn x={24} y={200} w={86} h={bh} label="◀" onTap={() => move(-1)} disabled={!run.live || run.done} testid="sk-left" />
      <Btn x={118} y={200} w={86} h={bh} label="▶" onTap={() => move(1)} disabled={!run.live || run.done} testid="sk-right" />
      <Btn x={226} y={200} w={110} h={bh} label={word(s, "check", "check")} onTap={check} disabled={!run.live || run.busy || run.done} testid="sk-check" />
      <Feedback fb={run.fb} s={s} done={run.done} />
    </g>
  );
}

// ───────────────────────────── chart-bars (bar_chart_read) ─────────────────────────────

function niceMax(v: number) { const m = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))); return Math.ceil(v / m) * m; }

function ChartBars({ p, s }: SkProps) {
  const run = useRun();
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [run.epoch]);
  const data: { key: string; value: number }[] = p.data ?? [];
  const top = niceMax(Math.max(...data.map((d) => d.value), 1));
  const x0 = 40, x1 = 350, y0 = 252, y1 = 66;
  const col = (x1 - x0) / Math.max(1, data.length);
  const Y = (v: number) => y0 - ((y0 - y1) * v) / top;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f));
  const tap = async (k: string) => { if (!run.live || run.done) return; setPick(k); await run.submit(k); };
  return (
    <g>
      <Title text={word(s, "ask", p.question === "least" ? "tap.least" : "tap.most")} y={24} />
      {s.yaxis && <text className="sk-small" x={8} y={50}>{s.yaxis}</text>}
      {ticks.map((t) => <g key={t}><line className="sk-grid" x1={x0} y1={Y(t)} x2={x1} y2={Y(t)} /><text className="sk-small" x={x0 - 6} y={Y(t) + 4} textAnchor="end">{t}</text></g>)}
      {data.map((d, i) => (
        <g key={d.key} className={`sk-col${pick === d.key ? " is-on" : ""}`} role="button" tabIndex={0} data-key={d.key} data-value={d.value}
          onClick={() => tap(d.key)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void tap(d.key); } }}>
          <rect className="sk-hit" x={x0 + i * col} y={y1 - 8} width={col} height={y0 - y1 + 44} />
          <rect className="sk-bar" x={x0 + i * col + col * 0.18} y={Y(d.value)} width={col * 0.64} height={y0 - Y(d.value)} />
          <text className="sk-small" x={x0 + i * col + col / 2} y={y0 + 18} textAnchor="middle">{nameOf(s, d.key).slice(0, 10)}</text>
        </g>
      ))}
      <line className="sk-axis" x1={x0} y1={y0} x2={x1} y2={y0} />
      <Feedback fb={run.fb} s={s} done={run.done} y={312} />
    </g>
  );
}

// ───────────────────────────── pictograph ─────────────────────────────

function Pictograph({ p, s }: SkProps) {
  const run = useRun();
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [run.epoch]);
  const rows: { key: string; value: number }[] = p.rows ?? [];
  const rh = Math.min(56, 232 / Math.max(1, rows.length));
  const tap = async (k: string) => { if (!run.live || run.done) return; setPick(k); await run.submit(k); };
  return (
    <g>
      <Title text={word(s, "ask", p.question === "least" ? "tap.least" : "tap.most")} y={24} />
      <text className="sk-small" x={344} y={46} textAnchor="end">{tw2h("symbol", { n: p.symbolValue })}{s.keytext ? ` ${s.keytext}` : ""}</text>
      {rows.map((r, i) => {
        const y = 56 + i * rh;
        const full = Math.floor(r.value / p.symbolValue), half = r.value % p.symbolValue ? 1 : 0;
        return (
          <g key={r.key} className={`sk-row${pick === r.key ? " is-on" : ""}`} role="button" tabIndex={0} data-key={r.key} data-value={r.value}
            onClick={() => tap(r.key)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void tap(r.key); } }}>
            <rect className="sk-hit" x={8} y={y} width={344} height={rh - 4} rx={10} />
            <text className="sk-label" x={18} y={y + rh / 2} dominantBaseline="central">{nameOf(s, r.key).slice(0, 10)}</text>
            {Array.from({ length: full }, (_, k) => <circle key={k} className="sk-sym" cx={112 + k * 24} cy={y + rh / 2 - 2} r={9} />)}
            {half ? <path className="sk-sym" d={`M${112 + full * 24},${y + rh / 2 - 11} a9,9 0 0 0 0,18 Z`} /> : null}
          </g>
        );
      })}
      <Feedback fb={run.fb} s={s} done={run.done} y={312} />
    </g>
  );
}

// ───────────────────────────── choice grids (timeline, parts, chain / hub options) ─────────────────────────────

function Choices({ keys, s, y, onTap, pick, young, disabled, label, cols: colsIn }: { keys: string[]; s: S; y: number; onTap: (k: string) => void; pick: string | null; young: boolean; disabled: boolean; label?: (k: string) => string; cols?: number }) {
  const cols = colsIn ?? (keys.length <= 3 ? keys.length : 2);
  const gap = 8, w = (344 - gap * (cols - 1)) / cols, h = T(young);
  return (
    <g>
      {keys.map((k, i) => <Btn key={k} x={8 + (i % cols) * (w + gap)} y={y + Math.floor(i / cols) * (h + gap)} w={w} h={h} label={(label ? label(k) : nameOf(s, k)).slice(0, 22)}
        on={pick === k} disabled={disabled} onTap={() => onTap(k)} testid={`sk-opt-${k}`} />)}
    </g>
  );
}

function Timeline({ p, s, young }: SkProps) {
  const run = useRun();
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [run.epoch]);
  const ev: { key: string; year: number }[] = p.events ?? [];
  const tap = async (k: string) => { setPick(k); await run.submit(k); };
  return (
    <g>
      <Title text={word(s, "ask", p.question === "latest" ? "tap.latest" : "tap.earliest")} y={26} />
      <Choices keys={ev.map((e) => e.key)} s={s} y={48} young={young} pick={pick} disabled={!run.live || run.done || run.busy} onTap={tap}
        label={(k) => `${nameOf(s, k)} · ${ev.find((e) => e.key === k)?.year}`} />
      <Feedback fb={run.fb} s={s} done={run.done} />
    </g>
  );
}

function Parts({ p, s, young }: SkProps) {
  const run = useRun();
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [run.epoch]);
  const tap = async (k: string) => { setPick(k); await run.submit(k); };
  return (
    <g>
      <Title text={word(s, "ask", "find", { p: nameOf(s, p.ask) })} y={26} />
      <text className="sk-small" x={180} y={46} textAnchor="middle">{nameOf(s, p.subject)}</text>
      <Choices keys={p.parts ?? []} s={s} y={60} young={young} pick={pick} disabled={!run.live || run.done || run.busy} onTap={tap} />
      <Feedback fb={run.fb} s={s} done={run.done} />
    </g>
  );
}

function Chain({ p, s, young }: SkProps) {
  const run = useRun();
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [run.epoch]);
  const st: string[] = p.stages ?? [];
  const hidden = st[(st.indexOf(p.askAfter) + 1) % st.length];
  const n = st.length, bw = Math.min(80, (344 - (n - 1) * 10) / n);
  const tap = async (k: string) => { setPick(k); await run.submit(k); };
  return (
    <g>
      <Title text={word(s, "ask", "next")} y={26} />
      {st.map((k, i) => {
        const x = 8 + i * (bw + 10);
        return (
          <g key={k} className={`sk-stage${k === p.askAfter ? " is-ask" : ""}`}>
            <rect x={x} y={56} width={bw} height={52} rx={10} />
            <text className="sk-small" x={x + bw / 2} y={82} textAnchor="middle" dominantBaseline="central">{k === hidden ? "?" : nameOf(s, k).slice(0, 10)}</text>
            {i < n - 1 && <path className="sk-arrow" d={`M${x + bw + 1},82 l8,0 m-4,-4 l4,4 l-4,4`} />}
          </g>
        );
      })}
      {p.cycle && <path className="sk-arrow" d={`M${8 + (n - 1) * (bw + 10) + bw / 2},110 C 300,140 60,140 ${8 + bw / 2},110`} fill="none" />}
      <Choices keys={p.options ?? []} s={s} y={170} young={young} pick={pick} disabled={!run.live || run.done || run.busy} onTap={tap} />
      <Feedback fb={run.fb} s={s} done={run.done} />
    </g>
  );
}

function FlowHub({ p, s, young }: SkProps) {
  const run = useRun();
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [run.epoch]);
  const flows: { key: string; dir: string }[] = p.flows ?? [];
  const tap = async (k: string) => { setPick(k); await run.submit(k); };
  const cx = 180, cy = 128, R = 36;
  // fixed lanes: flows IN come from the left, OUT leave to the right, UP_IN rise from below; labels sit at the far end
  let nIn = 0, nOut = 0;
  const arrow = (f: { key: string; dir: string }) => {
    let ax: number, ay: number, bx: number, by: number, lx: number, ly: number, anchor: "start" | "end" | "middle";
    if (f.dir === "up_in") { ax = cx; ay = cy + 82; bx = cx; by = cy + R + 4; lx = cx + 8; ly = cy + 78; anchor = "start"; }
    else if (f.dir === "out") { const k = nOut++; ay = by = cy - 14 + k * 28; ax = cx + R + 4; bx = 346; lx = 346; ly = ay - 7; anchor = "end"; }
    else { const k = nIn++; ay = by = cy - 14 + k * 28; ax = 14; bx = cx - R - 4; lx = 14; ly = ay - 7; anchor = "start"; }
    const ang = Math.atan2(by - ay, bx - ax);
    const h1 = [bx - 9 * Math.cos(ang - 0.5), by - 9 * Math.sin(ang - 0.5)], h2 = [bx - 9 * Math.cos(ang + 0.5), by - 9 * Math.sin(ang + 0.5)];
    return (
      <g key={f.key} className="sk-flow" data-flow={f.key} data-dir={f.dir}>
        <line x1={ax} y1={ay} x2={bx} y2={by} /><path d={`M${h1[0]},${h1[1]} L${bx},${by} L${h2[0]},${h2[1]}`} />
        <text className="sk-small" x={lx} y={ly} textAnchor={anchor}>{nameOf(s, f.key).slice(0, 16)}</text>
      </g>
    );
  };
  const ents: string[] = (p.entities ?? []).slice(0, 2);
  return (
    <g>
      <Title text={word(s, "ask", "ask")} y={24} />
      {ents.map((e, i) => <text key={e} className="sk-small" x={i ? 346 : 14} y={i ? 214 : 60} textAnchor={i ? "end" : "start"}>{nameOf(s, e).slice(0, 12)}</text>)}
      <circle className="sk-hub" cx={cx} cy={cy} r={R} />
      <text className="sk-label" x={cx} y={cy} textAnchor="middle" dominantBaseline="central">{nameOf(s, p.hub).slice(0, 10)}</text>
      {flows.map(arrow)}
      <Choices keys={p.options ?? []} s={s} y={226} young={young} pick={pick} disabled={!run.live || run.done || run.busy} onTap={tap} />
      <Feedback fb={run.fb} s={s} done={run.done} y={316} />
    </g>
  );
}

// ───────────────────────────── sequence / bins ─────────────────────────────

function Sequence({ p, s, young }: SkProps) {
  const run = useRun();
  const [placed, setPlaced] = useState<string[]>([]);
  useEffect(() => setPlaced([]), [run.epoch]);
  const left = (p.shown ?? []).filter((k: string) => !placed.includes(k));
  const tap = async (k: string) => { const r = await run.submit({ key: k }); if (r?.correct) setPlaced((x) => [...x, k]); };
  return (
    <g>
      <Title text={word(s, "instr", "order")} y={24} />
      {placed.map((k, i) => <text key={k} className="sk-small" x={18} y={52 + i * 18}>{`${i + 1}. ${nameOf(s, k).slice(0, 30)}`}</text>)}
      <Choices keys={left} s={s} y={Math.max(124, 60 + placed.length * 18)} young={young} pick={null} disabled={!run.live || run.done || run.busy} onTap={tap} />
      <Feedback fb={run.fb} s={s} done={run.done} />
    </g>
  );
}

function Bins({ p, s, young }: SkProps) {
  const run = useRun();
  const [card, setCard] = useState<string | null>(null);
  const [sorted, setSorted] = useState<Record<string, string>>({});
  useEffect(() => { setCard(null); setSorted({}); }, [run.epoch]);
  const bins: string[] = p.bins ?? [];
  const left = (p.cards ?? []).filter((c: string) => !sorted[c]);
  const put = async (bin: string) => {
    if (!card) return;
    const r = await run.submit({ card, bin });
    if (r?.correct) { setSorted((x) => ({ ...x, [card]: bin })); setCard(null); }
  };
  const bw = (344 - (bins.length - 1) * 8) / Math.max(1, bins.length);
  return (
    <g>
      <Title text={word(s, "instr", "sort")} y={22} />
      <Choices keys={left} s={s} y={40} cols={3} young={young} pick={card} disabled={!run.live || run.done || run.busy} onTap={(k) => { run.setFb(null); setCard(k); }} />
      {bins.map((b, i) => (
        <g key={b} className={`sk-bin${card ? " is-armed" : ""}`} role="button" tabIndex={0} data-bin={b} onClick={() => put(b)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void put(b); } }}>
          <rect x={8 + i * (bw + 8)} y={214} width={bw} height={80} rx={14} />
          <text className="sk-label" x={8 + i * (bw + 8) + bw / 2} y={236} textAnchor="middle">{nameOf(s, b).slice(0, 14)}</text>
          <text className="sk-small" x={8 + i * (bw + 8) + bw / 2} y={258} textAnchor="middle">{Object.entries(sorted).filter(([, v]) => v === b).map(([c]) => nameOf(s, c)).join(", ").slice(0, 24)}</text>
        </g>
      ))}
      <Feedback fb={run.fb} s={s} done={run.done} y={312} />
    </g>
  );
}

// ───────────────────────────── balance / slider ─────────────────────────────

function Balance({ p, s, young }: SkProps) {
  const run = useRun();
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => { setIdx(0); setPick(null); }, [run.epoch]);
  const items: { id: string; left: number[]; right: number[]; options: number[] }[] = p.items ?? [];
  const it = items[Math.min(idx, items.length - 1)];
  if (!it) return null;
  const tap = async (v: number) => {
    setPick(v);
    const r = await run.submit({ value: v });
    if (r?.correct && !r.complete) setTimeout(() => { setIdx((i) => i + 1); setPick(null); run.setFb(null); }, 900);
  };
  const box = (x: number, v: string, k: number) => <g key={k} className="sk-weight"><rect x={x} y={92} width={34} height={30} rx={6} /><text className="sk-small" x={x + 17} y={107} textAnchor="middle" dominantBaseline="central">{v}</text></g>;
  return (
    <g data-item={it.id}>
      <Title text={word(s, "instr", "balance")} y={24} />
      <path className="sk-axis" d="M180,170 L160,200 L200,200 Z" />
      <line className="sk-axis" x1={50} y1={126} x2={310} y2={126} />
      <line className="sk-axis" x1={180} y1={126} x2={180} y2={170} />
      {it.left.map((v, k) => box(54 + k * 38, String(v), k))}
      {[...it.right.map(String), "?"].map((v, k) => box(306 - 34 - k * 38, v, 100 + k))}
      <Choices keys={it.options.map(String)} s={{}} y={214} young={young} pick={pick == null ? null : String(pick)} disabled={!run.live || run.done || run.busy} onTap={(k) => tap(Number(k))} />
      <Feedback fb={run.fb} s={s} done={run.done} y={314} />
    </g>
  );
}

function Slider({ p, s, young }: SkProps) {
  const run = useRun();
  const [x, setX] = useState<number>(p.x?.start ?? p.x?.min ?? 0);
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => { setX(p.x?.start ?? p.x?.min ?? 0); setPick(null); }, [run.epoch, p.x?.start, p.x?.min]);
  const y = p.law.k * x + p.law.b;
  const bh = T(young);
  const step = (d: number) => setX((v) => Math.max(p.x.min, Math.min(p.x.max, +(v + d * (p.x.step ?? 1)).toFixed(6))));
  const ymax = p.law.k * p.x.max + p.law.b;
  return (
    <g>
      <Title text={word(s, "ask", "slider")} y={24} />
      <text className="sk-label" x={18} y={58}>{`${s.xname ?? "x"} ${x}`}</text>
      <text className="sk-label" x={342} y={58} textAnchor="end">{`${s.yname ?? "y"} ${+y.toFixed(3)}`}</text>
      <rect className="sk-grid" x={18} y={72} width={324} height={18} rx={9} />
      <rect className="sk-bar" x={18} y={72} width={Math.max(4, (324 * y) / Math.max(1, ymax))} height={18} rx={9} data-value={y} />
      <Btn x={18} y={104} w={92} h={bh} label={word(s, "less", "less")} onTap={() => step(-1)} disabled={!run.live || run.done} testid="sk-less" />
      <Btn x={118} y={104} w={92} h={bh} label={word(s, "more", "moreBtn")} onTap={() => step(1)} disabled={!run.live || run.done} testid="sk-more" />
      <text className="sk-small" x={18} y={196}>{`${s.xname ?? "x"} = ${p.ask.x} → ${s.yname ?? "y"} ?`}</text>
      <Choices keys={(p.ask.options ?? []).map(String)} s={{}} y={208} young={young} pick={pick == null ? null : String(pick)} disabled={!run.live || run.done || run.busy}
        onTap={(k) => { setPick(Number(k)); void run.submit({ value: Number(k) }); }} />
      <Feedback fb={run.fb} s={s} done={run.done} y={314} />
    </g>
  );
}

/** skeleton id (archetype.skeleton) → renderer. */
export const SKELETONS: Record<string, (p: SkProps) => ReactNode> = {
  "fraction-parts": FractionParts, "number-line": NumberLine, "chart-bars": ChartBars, pictograph: Pictograph, timeline: Timeline,
  parts: Parts, chain: Chain, "flow-hub": FlowHub, sequence: Sequence, bins: Bins, balance: Balance, slider: Slider,
};

/** The StudioStage renderer for `skeleton` artifacts. An unknown skeleton id draws the calm empty ground (never text). */
export function SkeletonRenderer({ artifact, px, design, reducedMotion, young, onEvent }: ArtifactRendererProps<"skeleton">) {
  const m = useStageMoment();
  const Sk = SKELETONS[artifact.skeleton];
  const ready = !!Sk;
  useEffect(() => { onEvent(ready ? { type: "ready" } : { type: "error", message: `no skeleton ${artifact.skeleton}` }); }, [ready, artifact.skeleton]); // eslint-disable-line react-hooks/exhaustive-deps
  const body = useMemo(() => (Sk ? <Sk p={artifact.params as P} s={artifact.strings ?? {}} young={young} w={design.w} h={design.h} /> : null), [Sk, artifact, young, design.w, design.h, m.epoch]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg className={`sk${m.interactive ? " is-live" : " is-pencil"}${reducedMotion ? " is-still" : ""}`} width={px.w} height={px.h} viewBox={`0 0 ${design.w} ${design.h}`}
      data-testid="studio-skeleton" data-skeleton={artifact.skeleton} aria-label={artifact.strings?.title ?? undefined} key={m.epoch}>
      {body}
    </svg>
  );
}
