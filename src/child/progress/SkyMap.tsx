// The Sky map (ages 10-15; PRODUCT-DESIGN-V2 §3.8, §4.8, §6.3.7). Each constellation is a chapter, each star a
// skill, edges are real prerequisites (prereqs.ts). Stars are drawn by the app (StateShape sky mode) on the painted
// bg/sky-panel (or the flat --sky-panel). "Your class is here" marks the school's chapter (server `here`); a chapter
// seal (a glow crest) marks a chapter whose every skill is Got it or Secure (server `sealed`), a state of the map,
// never a collectible. Star targets are ≥ 48 px HTML buttons over the SVG (audit: 41 px stars).
import { useEffect, useMemo, useState } from "react";
import type { ChildMapSkill } from "../../../shared/contracts.ts";
import type { MapSubject } from "../api.ts";
import { Scene, Spot } from "../art.tsx";
import { t } from "../copy.ts";
import { loadPrereqs, visibleEdges } from "./prereqs.ts";
import { SkySeal, SkyStar, STATE_WORD } from "./StateShape.tsx";
import { chapterLines, layoutSky, TOP, type Placed } from "./layout.ts";

export function SkyMap({ subject, classLevel, onSelect, selected, cols = 2 }:
  { subject: MapSubject; classLevel: number; onSelect: (s: ChildMapSkill) => void; selected?: string | null; cols?: number }) {
  const [prereqs, setPrereqs] = useState<Map<string, string[]>>(new Map());
  useEffect(() => {
    let live = true;
    void loadPrereqs(classLevel, subject.subject).then((m) => live && setPrereqs(m));
    return () => {
      live = false;
    };
  }, [classLevel, subject.subject]);
  const L = useMemo(() => layoutSky(subject.chapters, cols), [subject, cols]);
  const byTopic = useMemo(() => {
    const m = new Map<string, Placed[]>();
    for (const p of L.stars) {
      if (!m.has(p.skill.topicId)) m.set(p.skill.topicId, []);
      m.get(p.skill.topicId)!.push(p);
    }
    return m;
  }, [L]);
  const edges = useMemo(() => visibleEdges(prereqs, new Set(byTopic.keys())), [prereqs, byTopic]);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div className="sky" data-testid="sky-map">
      <Scene id="sky-panel" fallback={<div className="sky-flat" />} />
      <div className="sky-canvas" style={{ aspectRatio: `${L.width} / ${L.height}` }}>
        <svg viewBox={`0 0 ${L.width} ${L.height}`} className="sky-svg" aria-hidden="true" focusable="false">
          {edges.map(([from, to]) => {
            const a = byTopic.get(from)!.at(-1)!, b = byTopic.get(to)![0];
            // an edge inside one constellation is drawn full; one between chapters is fainter, so the map stays readable
            const same = a.chapter.id === b.chapter.id;
            return <line key={`${from}>${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--sky-edge)" strokeWidth={same ? 1.6 : 1} opacity={same ? 1 : 0.4} strokeDasharray={same ? undefined : "3 5"} />;
          })}
          {L.clusters.map((c) => (
            <g key={c.chapter.id}>
              {c.chapter.sealed && <g transform={`translate(${c.cx} ${c.cy})`}><SkySeal r={Math.min(60, 42 + (c.cy - c.y - TOP))} /></g>}
              <text x={c.cx} y={c.labelY} textAnchor="middle" className="sky-label">
                {chapterLines(c.chapter.title).map((ln, k) => <tspan key={k} x={c.cx} dy={k ? 16 : 0}>{ln}</tspan>)}
              </text>
              {c.chapter.here && (
                <g transform={`translate(${c.cx} ${c.labelY + (c.lines - 1) * 16 + 22})`}>
                  <rect x="-58" y="-11" width="116" height="22" rx="11" fill="var(--sky-label)" />
                  <text textAnchor="middle" y="4.5" className="sky-here">{t("classHere")}</text>
                </g>
              )}
            </g>
          ))}
          {L.stars.map((p) => (
            <g key={p.skill.skillId} transform={`translate(${p.x} ${p.y})`}>
              {/* the 48 px target is visible (flows G16: 8 px dots read as nothing): a soft disc behind every star */}
              <circle r="24" fill="var(--sky-star-0)" opacity="0.14" />
              {selected === p.skill.skillId && <circle r="20" fill="none" stroke="var(--sky-label)" strokeWidth="2" strokeDasharray="4 4" />}
              <SkyStar state={p.skill.state} r={14} recheck={p.skill.recheckScheduled} />
            </g>
          ))}
        </svg>
        {L.clusters.filter((c) => c.chapter.sealed).map((c) => (
          <span key={c.chapter.id} className="sky-sealart" style={{ left: pct(c.cx, L.width), top: pct(c.y + 6, L.height) }}>
            <Spot id="sky/chapter-seal" size={40} fallback={<span />} />
          </span>
        ))}
        {L.stars.map((p) => (
          <button key={p.skill.skillId} type="button" className="sky-star" style={{ left: pct(p.x, L.width), top: pct(p.y, L.height) }}
            aria-label={`${p.skill.title}, ${STATE_WORD[p.skill.state]}`} aria-pressed={selected === p.skill.skillId} onClick={() => onSelect(p.skill)}
            data-state={p.skill.state} />
        ))}
      </div>
    </div>
  );
}

