// Progress as skill mastery (DESIGN-V3 §10, screen 07): subject tabs, a headline count WITH its definition, the chapter
// map with shape-coded skill nodes (filled secure · hatched working · outlined met · dark ahead · amber dot check-in due;
// greyscale-safe), the hardest thing cracked, counts that are facts (not scores), then-and-now against their past self.
// No leaderboard, no level, no XP, no percentages. Tapping a node shows exactly what counted as evidence.
import { useState } from "react";
import { IconButton, MASTERY_LABEL, MasteryNode, MasterySwatch, Segmented, SUBJECT_LABEL, type Mastery, type Subject } from "../primitives.tsx";
import { TabBar } from "./common.tsx";
import type { ProgressData } from "./types.ts";

export function Progress({ data, onSubject, onNav }: { data: ProgressData; onSubject?: (s: Subject) => void; onNav?: (id: string) => void }) {
  const [subject, setSubject] = useState<Subject>(data.subject);
  const [sel, setSel] = useState<{ ch: number; i: number } | null>(null);
  const all = data.chapters.flatMap((c) => c.skills);
  const secure = all.filter((s) => s.state === "secure").length;
  const picked = sel ? data.chapters.find((c) => c.n === sel.ch)?.skills[sel.i] : null;
  return (
    <div className="v3-app v3-grain">
      <header className="v3-topbar">
        <h1 className="v3-h2">Progress</h1>
        <IconButton icon="arrow" label="Share with a parent" quiet />
      </header>
      <Segmented label="Subject" value={subject} onChange={(s) => { setSubject(s); onSubject?.(s); }} options={data.subjects.map((s) => ({ value: s, label: SUBJECT_LABEL[s] }))} />

      <div className="v3-pg">
        <div className="v3-col">
          <section className="v3-card v3-big" aria-labelledby="v3-pg-count">
            <div className="v3-eyebrow">{data.book}</div>
            <div className="v3-big-num" id="v3-pg-count">{secure}<small>of {all.length} skills secure</small></div>
            <p className="v3-small v3-muted">Secure means you got it right again days later, without warning. Not just once.</p>
            <ul className="v3-legend" aria-label="Key">
              {(["secure", "working", "met", "ahead"] as Mastery[]).map((m) => <li key={m}><MasterySwatch state={m} />{MASTERY_LABEL[m]}</li>)}
              <li><MasterySwatch state="due" />Check-in due</li>
            </ul>
          </section>

          <section className="v3-card v3-map" aria-label="Skill map by chapter">
            {data.chapters.map((c) => {
              const nSec = c.skills.filter((s) => s.state === "secure").length;
              return (
                <div key={c.n} className={`v3-ch${c.current ? " is-current" : ""}`}>
                  <span className="v3-ch-n v3-mono" aria-hidden="true">{String(c.n).padStart(2, "0")}</span>
                  <div className="v3-ch-t"><b>{c.title}</b><span>{c.current ? "Now · " : ""}{nSec} of {c.skills.length} secure</span></div>
                  <div className="v3-nodes" role="group" aria-label={`${c.title} skills`}>
                    {c.skills.map((s, i) => (
                      <MasteryNode key={s.label} state={s.state} due={s.due} label={s.label} selected={sel?.ch === c.n && sel.i === i} onSelect={() => setSel({ ch: c.n, i })} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
          <div className="v3-card v3-detail" aria-live="polite">
            {picked ? (
              <><b>{picked.label} · {MASTERY_LABEL[picked.state]}</b><span>{picked.evidence}{picked.due ? " A quick check-in is due: she'll slip it into a lesson, no test." : ""}</span></>
            ) : (
              <><b>Tap any square</b><span>See exactly what counted as evidence for it.</span></>
            )}
          </div>
        </div>

        <div className="v3-col">
          <section className="v3-card v3-cracked">
            <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="16" fill="var(--bg-3)" /><g fill="none" strokeWidth="2"><rect x="38" y="12" width="14" height="11" rx="3" stroke="var(--ion)" /><rect x="38" y="27" width="14" height="11" rx="3" stroke="var(--mint)" /><rect x="38" y="42" width="14" height="11" rx="3" stroke="var(--ion)" /></g><path d="M12 32l12 0-8-5zM12 32l12 0-8 5z" fill="var(--ink)" /></svg>
            <div><div className="v3-eyebrow">Hardest thing you've cracked</div><b className="v3-h3">{data.cracked.title}</b><span className="v3-small v3-muted">{data.cracked.detail}</span></div>
          </section>
          <dl className="v3-tiles">
            {data.counts.map((c) => <div key={c.label} className="v3-card v3-tilec"><dd>{c.value}</dd><dt>{c.label}</dt></div>)}
          </dl>
          <section className="v3-card v3-thennow" aria-label="Then and now">
            <div className="v3-eyebrow">Then and now</div>
            <div className="v3-tn v3-tn--then"><time>{data.thenNow.then.at}</time><p>{data.thenNow.then.text}</p></div>
            <div className="v3-tn-line" aria-hidden="true" />
            <div className="v3-tn v3-tn--now"><time>{data.thenNow.now.at}</time><p>{data.thenNow.now.text}</p></div>
          </section>
        </div>
      </div>
      <TabBar current="progress" onNav={onNav} />
    </div>
  );
}
