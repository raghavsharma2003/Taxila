// End of lesson (DESIGN-V3 §12.2, screen 06). A capability in the child's terms, their own words quoted back as the
// proof, timestamped evidence (tick rows done, a magnifier row "worth another look" with when it comes back), the parked
// question's promised minutes, what was made today, and what's next. No celebration animation, no stars, no score.
// The content comes from RS-5's single evidence source; this file is the layout.
import { Icon } from "../Icon.tsx";
import { Button, IconButton, SubjectMarker, SUBJECT_LABEL, VerdictMark } from "../primitives.tsx";
import { Thumb } from "./common.tsx";
import type { EndData } from "./types.ts";
import { TeacherChip } from "./common.tsx";

export function EndOfLesson({ data, onTalkNow, onSkipParked, onProgress, onDone, onReplay }: {
  data: EndData; onTalkNow?: () => void; onSkipParked?: () => void; onProgress?: () => void; onDone?: () => void; onReplay?: (id: string) => void;
}) {
  return (
    <div className="v3-end v3-grain">
      <header className="v3-topbar">
        <SubjectMarker subject={data.subject}>{`Class ${data.classLevel} · ${SUBJECT_LABEL[data.subject]} · ${data.topic}`}</SubjectMarker>
        <IconButton icon="x" label="Close and go home" quiet onClick={onDone} />
      </header>
      <div className="v3-grid2">
        <div className="v3-col">
          <section className="v3-end-hero" aria-labelledby="v3-end-h">
            <div className="v3-eyebrow">Lesson done · {data.minutes} min</div>
            <h1 id="v3-end-h" className="v3-cando">{data.canDo.before}<em>{data.canDo.em}</em>{data.canDo.after}</h1>
            <dl className="v3-stats">
              {data.facts.map((f) => <div key={f.label} className="v3-stat"><dd>{f.value}</dd><dt>{f.label}</dt></div>)}
            </dl>
          </section>

          <figure className="v3-card v3-quote">
            <TeacherChip teacher={data.teacher} size={40} />
            <div>
              <figcaption className="v3-small v3-ink3">What you said at {data.quote.at}</figcaption>
              <blockquote>“{data.quote.text}”</blockquote>
              <small className="v3-ink3">That's the whole proof. In your words.</small>
            </div>
          </figure>

          <div className="v3-sechead"><h2 className="v3-h3">How we know</h2><span className="v3-eyebrow">evidence</span></div>
          <ol className="v3-card v3-ev">
            {data.evidence.map((e, i) => (
              <li key={i} className="v3-ev-row">
                <VerdictMark verdict={e.verdict} />
                <div><b>{e.title}</b><span>{e.detail}</span></div>
                <time className="v3-mono">{e.at}</time>
              </li>
            ))}
          </ol>
        </div>

        <div className="v3-col">
          {data.parked && (
            <section className="v3-card v3-parked" aria-labelledby="v3-parked-h">
              <div className="v3-eyebrow v3-row-6" id="v3-parked-h"><Icon name="pin" size={14} />You parked this</div>
              <div className="v3-parked-q">“{data.parked.text}”</div>
              <div className="v3-small v3-muted">{data.parked.when}</div>
              <div className="v3-row-8 v3-wrap">
                <Button variant="primary" icon="mic" onClick={onTalkNow}>Talk now · 2 min</Button>
                <Button onClick={onSkipParked}>Skip</Button>
              </div>
            </section>
          )}
          <h2 className="v3-h3 v3-sechead-solo">Made today</h2>
          <div className="v3-made-row">
            {data.made.map((m) => (
              <button type="button" key={m.id} className="v3-mini" onClick={() => onReplay?.(m.id)} aria-label={`Replay ${m.title}`}>
                <Thumb kind={m.thumb} />
                <span className="v3-mini-m">{m.title}<Icon name="replay" size={16} /></span>
              </button>
            ))}
          </div>
          <div className="v3-card v3-nextup">
            <span className="v3-nextup-ic"><Icon name="cal" /></span>
            <div><div className="v3-eyebrow">Next · {data.next.when}</div><b>{data.next.title}</b></div>
          </div>
          <div className="v3-end-foot">
            <Button size="lg" onClick={onProgress}>See progress</Button>
            <Button size="lg" variant="quiet" className="v3-outline" onClick={onDone}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
