// The world view (DESIGN.md §6): a route diagram of the stations a family covers for this child, drawn from the learner
// ledger only. Pencil = got it today; ink = secure (right again on another day, in a new form, without help); hatched =
// working on it; ahead = not started. Routes are real prerequisite edges, each carrying its citation. There is no count,
// no percentage, no lock, no clock: every station is open and nothing fades with time.
import { useLayoutEffect, useRef, useState } from "react";
import type { ArtId, Lang, PlayWorldFamily } from "../../../shared/play.ts";
import { ART } from "../core/styles.ts";
import { say } from "../copy.ts";

export interface MapLayout { pos: Map<string, { x: number; y: number }>; w: number; h: number; vertical: boolean }
/** Station box size (two lines of 14 px title fit; ≥ 44 px tall: every station is a touch target later). */
export const STATION = { w: 140, h: 52 } as const;
/**
 * PURE layered layout: a station's layer is its longest prerequisite chain inside the family. A wide box flows left to
 * right (layers are columns); a phone flows top to bottom (layers are rows, wrapped to the width), so the map never needs
 * a sideways scroll on a phone.
 */
export function layoutMap(world: PlayWorldFamily, w = 340): MapLayout {
  const ids = world.stations.map((s) => s.topicId);
  const preds = new Map<string, string[]>(ids.map((i) => [i, []]));
  for (const r of world.routes) if (preds.has(r.to) && preds.has(r.from)) preds.get(r.to)!.push(r.from);
  const depth = new Map<string, number>();
  const d = (id: string, guard = 0): number => { if (depth.has(id)) return depth.get(id)!; if (guard > 40) return 0; const v = Math.max(0, ...preds.get(id)!.map((p) => d(p, guard + 1) + 1)); depth.set(id, v); return v; };
  ids.forEach((i) => d(i));
  const layers = new Map<number, string[]>();
  for (const i of ids) { const k = depth.get(i)!; layers.set(k, [...(layers.get(k) ?? []), i]); }
  const sorted = [...layers.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l.sort());
  const pos = new Map<string, { x: number; y: number }>();
  const vertical = w < 560;
  if (vertical) {
    const per = Math.max(1, Math.floor((w - 16) / (STATION.w + 16))), gapY = 34;
    let y = 16;
    for (const layer of sorted) for (let i = 0; i < layer.length; i += per) {
      const row = layer.slice(i, i + per), rowW = row.length * STATION.w + (row.length - 1) * 16, x0 = Math.max(8, (w - rowW) / 2);
      row.forEach((id, k) => pos.set(id, { x: x0 + k * (STATION.w + 16), y }));
      y += STATION.h + gapY;
    }
    return { pos, w: Math.max(w - 16, STATION.w + 16), h: y + 8, vertical };
  }
  const colW = STATION.w + 70, rowH = STATION.h + 26;
  let maxRows = 1;
  sorted.forEach((layer, k) => { layer.forEach((id, r) => pos.set(id, { x: 20 + k * colW, y: 24 + r * rowH })); maxRows = Math.max(maxRows, layer.length); });
  return { pos, w: 40 + sorted.length * colW, h: 48 + maxRows * rowH, vertical };
}
/** A title in at most two lines of ≤ 17 characters, split at a space; longer titles end with "…" (never cut mid-air). */
export function titleLines(t: string, max = 17): string[] {
  if (t.length <= max) return [t];
  const words = t.split(" "); let a = "";
  for (const wd of words) { if ((a ? `${a} ${wd}` : wd).length > max) break; a = a ? `${a} ${wd}` : wd; }
  if (!a) a = t.slice(0, max - 1) + "…";
  let b = t.slice(a.length).trim();
  if (b.length > max) b = b.slice(0, max - 1).trimEnd() + "…";
  return b ? [a, b] : [a];
}

export function PlayMap({ world, art, lang, onClose }: { world: PlayWorldFamily; art: ArtId; lang: Lang; onClose(): void }) {
  const box = useRef<HTMLDivElement>(null);
  const [bw, setBw] = useState(340);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const m = () => setBw(Math.round(el.clientWidth));
    m();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(m) : null; ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  const a = ART[art], L = layoutMap(world, bw), SW = STATION.w, SH = STATION.h;
  const fill = (s: string) => (s === "ink" ? a.q2 : s === "pencil" ? "transparent" : "transparent");
  return (
    <div className="pl-map" role="dialog" aria-label={say(lang, "map")} data-testid="play-map-sheet"
      style={{ position: "absolute", inset: 0, zIndex: 5, background: a.ground, color: a.ink, display: "grid", gridTemplateRows: "52px minmax(0,1fr) auto", fontFamily: a.font.ui }}>
      <header style={{ display: "flex", alignItems: "center", padding: "0 12px", gap: 10, borderBottom: `1px solid ${a.panelEdge}` }}>
        <b style={{ flex: 1, fontFamily: a.font.display, fontSize: 18 }}>{say(lang, "map")}</b>
        <button type="button" className="pl-btn pl-btn--ghost" onClick={onClose} aria-label="close" style={{ minWidth: 48 }}>✕</button>
      </header>
      <div ref={box} style={{ overflow: "auto", padding: 8 }}>
        <svg width={L.w} height={L.h} role="img" aria-label={say(lang, "map")}>
          <defs>
            <pattern id="pl-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke={a.ink3} strokeWidth="2" /></pattern>
          </defs>
          {world.routes.map((r) => { const p = L.pos.get(r.from), q = L.pos.get(r.to); if (!p || !q) return null;
            const d = L.vertical
              ? `M${p.x + SW / 2} ${p.y + SH} C ${p.x + SW / 2} ${p.y + SH + 24}, ${q.x + SW / 2} ${q.y - 24}, ${q.x + SW / 2} ${q.y}`
              : `M${p.x + SW} ${p.y + SH / 2} C ${p.x + SW + 30} ${p.y + SH / 2}, ${q.x - 30} ${q.y + SH / 2}, ${q.x} ${q.y + SH / 2}`;
            return <path key={`${r.from}>${r.to}`} d={d} fill="none" stroke={a.ink3} strokeWidth="2" data-cite={r.edge} />; })}
          {world.stations.map((s) => { const p = L.pos.get(s.topicId); if (!p) return null;
            const ink = s.state === "ink", pencil = s.state === "pencil", hatched = s.state === "hatched";
            return (
              <g key={s.topicId} transform={`translate(${p.x},${p.y})`} data-state={s.state} data-testid={`play-station-${s.topicId}`}>
                <rect width={SW} height={SH} rx="12" fill={hatched ? "url(#pl-hatch)" : fill(s.state)} stroke={ink ? a.q2 : pencil ? a.ink2 : a.ink3}
                  strokeWidth={ink ? 2.5 : 1.5} strokeDasharray={s.state === "ahead" ? "5 5" : pencil ? "2 3" : undefined} />
                {hatched && <rect x="6" y="9" width={SW - 12} height={SH - 18} rx="6" fill={a.ground} opacity="0.85" />}
                {s.here && <circle cx={SW - 9} cy="9" r="5" fill={a.you} />}
                {s.recheck && <circle cx="9" cy="9" r="5" fill={a.look} />}
                {titleLines(s.title).map((ln, i, arr) => (
                  <text key={i} x={SW / 2} y={SH / 2 + 5 + (arr.length === 2 ? (i ? 9 : -8) : 0)} textAnchor="middle" fontSize="14" fontWeight={ink ? 700 : 600} fill={ink ? (a.dark ? a.ground : "#fff") : a.ink}>{ln}</text>
                ))}
              </g>
            ); })}
        </svg>
      </div>
      <footer style={{ padding: "10px 12px 14px", fontSize: 14, color: a.ink2, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <span>▭ {say(lang, "map.ahead")}</span><span>▨ {say(lang, "map.hatched")}</span><span>┈ {say(lang, "map.pencil")}</span><span>■ {say(lang, "map.ink")}</span>
        <span style={{ flexBasis: "100%" }}>{say(lang, "map.note")}</span>
      </footer>
    </div>
  );
}
