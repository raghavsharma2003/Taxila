// Bagiya (Young) and Aasmaan (Older) over the same ledger, plus the list view that is the source of truth
// (PRODUCT-DESIGN §8.4-8.6). Shape carries state, colour second. No counts of empty plots, no "x of y" for
// Young, no %, no dates, no glow or pulse: the render is a pure function of the rows (T2 absence invariance).
import { useRef, useState } from "react";
import type { MapSkill } from "../api.ts";
import type { Lang } from "../copy.ts";
import { Arrow } from "../icons.tsx";
import { chaptersOf, countsLine, stageOf, STATE_WORD, type Stage } from "./ledger.ts";

/** Plant silhouettes: seed packet · two-leaf sprout · flower · fruit with a done ring. */
export function Plant({ stage, bird }: { stage: Stage; bird?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <path d="M8 66 H72" stroke="var(--grow-plot)" strokeWidth="4" strokeLinecap="round" />
      {stage === "seed" && (
        <g>
          <rect x="26" y="34" width="28" height="30" rx="3" fill="#F2E6CF" stroke="var(--ink)" strokeWidth="2.5" />
          <path d="M26 42 H54" stroke="var(--ink)" strokeWidth="2" />
          <circle cx="40" cy="53" r="4" fill="var(--grow-leaf)" />
        </g>
      )}
      {stage !== "seed" && <path d="M40 66 V36" stroke="var(--grow-leaf)" strokeWidth="4" strokeLinecap="round" />}
      {stage === "sprout" && (
        <g fill="var(--grow-leaf)" stroke="var(--ink)" strokeWidth="2">
          <path d="M40 46 C30 46 24 40 24 32 C34 32 40 38 40 46 Z" />
          <path d="M40 42 C50 42 56 36 56 28 C46 28 40 34 40 42 Z" />
        </g>
      )}
      {(stage === "flower" || stage === "fruit") && (
        <g stroke="var(--ink)" strokeWidth="2">
          <path d="M40 56 C32 56 28 52 28 46 C36 46 40 50 40 56 Z" fill="var(--grow-leaf)" />
          {stage === "flower" ? (
            <g fill="var(--grow-flower)">
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="40" cy="22" rx="6" ry="10" transform={`rotate(${a} 40 30)`} />
              ))}
              <circle cx="40" cy="30" r="5" fill="#F5D46B" />
            </g>
          ) : (
            <g>
              <circle cx="40" cy="28" r="15" fill="none" stroke="var(--grow-ring)" strokeWidth="4" />
              <circle cx="40" cy="28" r="9" fill="var(--grow-fruit)" />
              <path d="M40 19 q3 -5 7 -5" fill="none" stroke="var(--grow-leaf)" strokeWidth="3" />
            </g>
          )}
        </g>
      )}
      {bird && (
        <path d="M58 16 q6 -6 12 0 q-4 1 -6 5 q-2 -4 -6 -5 Z" fill="var(--grow-visitor)" stroke="var(--ink)" strokeWidth="1.5" />
      )}
    </svg>
  );
}

function speak(text: string, lang: Lang) {
  // Young labels are spoken on tap. Uses the device voice only as a stand-in until pack clips exist.
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "english" ? "en-IN" : "hi-IN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* no speech: the label is still on the tile's accessible name */
  }
}

export function Bagiya({ skills, lang }: { skills: MapSkill[]; lang: Lang }) {
  const beds = chaptersOf(skills);
  const rail = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const go = (d: number) => {
    const n = Math.max(0, Math.min(beds.length - 1, idx + d));
    setIdx(n);
    rail.current?.children[n]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };
  if (!beds.length) {
    return (
      <div className="tx-garden" aria-label="Bagiya">
        <div className="tx-plants">
          <span className="tx-plant" aria-hidden="true">
            <Plant stage="seed" />
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="tx-garden" aria-label="Bagiya">
      <div className="tx-garden-beds" ref={rail}>
        {beds.map((b) => (
          <section key={b.name} className="tx-bed" aria-label={b.name}>
            <div className="tx-plants">
              {b.skills.map((s) => {
                const st = stageOf(s);
                return (
                  <button key={s.skillId} type="button" className="tx-plant" aria-label={s.title} onClick={() => speak(s.title, lang)}>
                    <Plant stage={st} bird={s.recheckScheduled} />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {beds.length > 1 && (
        <div className="tx-garden-nav">
          <button type="button" className="tx-iconbtn" onClick={() => go(-1)} aria-label="previous bed" disabled={idx === 0}>
            <Arrow dir="left" />
          </button>
          <button type="button" className="tx-iconbtn" onClick={() => go(1)} aria-label="next bed" disabled={idx >= beds.length - 1}>
            <Arrow dir="right" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Star silhouettes: ring · dot · 4-point star · 4-point star in a ticked ring. */
function Star({ stage, x, y }: { stage: Stage; x: number; y: number }) {
  const four = (r: number) => `M${x} ${y - r} L${x + r * 0.32} ${y - r * 0.32} L${x + r} ${y} L${x + r * 0.32} ${y + r * 0.32} L${x} ${y + r} L${x - r * 0.32} ${y + r * 0.32} L${x - r} ${y} L${x - r * 0.32} ${y - r * 0.32} Z`;
  if (stage === "seed") return <circle cx={x} cy={y} r="7" fill="none" stroke="var(--sky-star-0)" strokeWidth="2" />;
  if (stage === "sprout") return <circle cx={x} cy={y} r="5" fill="var(--sky-star-1)" />;
  if (stage === "flower") return <path d={four(10)} fill="var(--sky-star-2)" />;
  return (
    <g>
      <circle cx={x} cy={y} r="13" fill="none" stroke="var(--sky-star-3)" strokeWidth="2" />
      <path d={four(9)} fill="var(--sky-star-3)" />
    </g>
  );
}

export function Aasmaan({ skills, lang, onSelect, selected }: { skills: MapSkill[]; lang: Lang; onSelect?: (s: MapSkill) => void; selected?: string | null }) {
  const W = 320;
  const chapters = chaptersOf(skills);
  const rows = chapters.length || 1;
  const H = Math.max(140, rows * 70 + 20);
  const nodes = chapters.flatMap((c, ci) =>
    c.skills.map((s, si) => ({ s, x: 28 + (si * (W - 56)) / Math.max(1, c.skills.length - 1 || 1), y: 40 + ci * 70, ci })),
  );
  const { pakka, total } = countsLine(skills);
  return (
    <div className="tx-sky" aria-label="Aasmaan">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="skill map">
        {nodes.map((n, i) => {
          const next = nodes[i + 1];
          return next && next.ci === n.ci ? <line key={`e${i}`} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke="var(--sky-edge)" strokeWidth="1.5" /> : null;
        })}
        {chapters.map((c, ci) => (
          <text key={c.name} x="8" y={18 + ci * 70} className="tx-sky-label">
            {c.name}
          </text>
        ))}
        {nodes.map((n) => (
          <g key={n.s.skillId} role="button" tabIndex={0} aria-label={`${n.s.title}: ${STATE_WORD[stageOf(n.s)][lang === "hindi" ? "hi" : "en"]}`} onClick={() => onSelect?.(n.s)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.(n.s)} style={{ cursor: "pointer" }}>
            <circle cx={n.x} cy={n.y} r="22" fill="transparent" />
            <Star stage={stageOf(n.s)} x={n.x} y={n.y} />
            {selected === n.s.skillId && (
              <text x={n.x} y={n.y + 30} textAnchor="middle" className="tx-sky-label">
                {STATE_WORD[stageOf(n.s)][lang === "hindi" ? "hi" : "en"]}
              </text>
            )}
          </g>
        ))}
      </svg>
      {total > 0 && (
        <p className="tx-num" style={{ margin: "8px 4px 0", fontSize: 15 }}>
          {pakka} / {total} {STATE_WORD.fruit[lang === "hindi" ? "hi" : "en"]}
        </p>
      )}
    </div>
  );
}

/** The list view: chapter → skill → state (shape + word for Older; shape + spoken name for Young). */
export function SkillList({ skills, lang, words }: { skills: MapSkill[]; lang: Lang; words: boolean }) {
  return (
    <div className="tx-stack" style={{ width: "100%" }}>
      {chaptersOf(skills).map((c) => (
        <section key={c.name} style={{ width: "100%" }}>
          <h2 style={{ fontSize: 18, margin: "8px 0" }}>{c.name}</h2>
          <ul className="tx-list">
            {c.skills.map((s) => {
              const st = stageOf(s);
              return (
                <li key={s.skillId} className="tx-listrow tx-skill-row">
                  <Plant stage={st} bird={s.recheckScheduled} />
                  <span>{s.title}</span>
                  {words && <span className="tx-word" lang={lang === "english" ? undefined : "hi"}>{STATE_WORD[st][lang === "english" ? "en" : "hi"]}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
