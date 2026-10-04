// Home (DESIGN-V3 §9, screen 02). One next lesson built from what the child asked, a teacher note about their thinking
// (not their score), made-for-you, parked questions with when each comes back, this week (planned and done, no counts,
// nothing to lose: a missed day looks like an unplanned day), subjects. No streaks, points or leaderboards.
// Phone: single column + tab bar. Wide (≥ 900 px): two columns, no tab bar.
import { Brand, Icon } from "../Icon.tsx";
import { Button, IconButton, SubjectMarker, SUBJECT_LABEL, Tag } from "../primitives.tsx";
import { FaceSlot } from "../TeacherFace.tsx";
import { KIND_ICON, KIND_LABEL, MadeCard, NoteCard, TabBar } from "./common.tsx";
import type { HomeData } from "./types.ts";

export function Home({ data, onStart, onNav, onOpenLater }: { data: HomeData; onStart?: () => void; onNav?: (id: string) => void; onOpenLater?: (id: string) => void }) {
  const n = data.next;
  return (
    <div className="v3-app v3-grain">
      <header className="v3-topbar">
        <Brand />
        <div className="v3-row-8">
          <IconButton icon="search" label="Search" quiet />
          <button type="button" className="v3-avatar" aria-label={`${data.childName}: your profile`} onClick={() => onNav?.("you")}>{data.childName.slice(0, 1)}</button>
        </div>
      </header>

      <div className="v3-hello">
        <div className="v3-eyebrow">{data.dateLine}</div>
        <h1 className="v3-h1">{data.greeting}</h1>
      </div>

      <div className="v3-home">
        <div className="v3-col">
          <section className="v3-next" aria-labelledby="v3-next-h">
            <NextArt />
            <div className="v3-next-head">
              <SubjectMarker subject={n.subject}>{`${SUBJECT_LABEL[n.subject]} · Class ${n.classLevel} · Up next`}</SubjectMarker>
              <h2 id="v3-next-h">{n.title}</h2>
            </div>
            <p className="v3-next-why">{n.why}</p>
            <div className="v3-next-inside" aria-label="What's inside">
              {n.inside.map((k) => <Tag key={k} icon={KIND_ICON[k]}>{KIND_LABEL[k]}</Tag>)}
              <Tag icon="clock">~{n.minutes} min</Tag>
            </div>
            <div className="v3-next-foot">
              <span className="v3-next-face" aria-hidden="true"><FaceSlot tutorId={data.teacher.id} band={data.teacher.band} status={null} size="chip" still /></span>
              <Button variant="primary" size="lg" iconAfter="arrow" className="v3-grow" onClick={onStart} aria-label={`Start lesson with ${data.teacher.name}, AI teacher`}>Start lesson</Button>
            </div>
          </section>

          <NoteCard teacher={data.teacher}>{data.note}</NoteCard>

          <div className="v3-sechead"><h2 className="v3-h3">Made for you</h2><a href="#library" onClick={(e) => { if (onNav) { e.preventDefault(); onNav("library"); } }}>Library</a></div>
          <div className="v3-shelf">{data.made.map((m) => <MadeCard key={m.id} item={m} />)}</div>
        </div>

        <div className="v3-col v3-col--side">
          <div className="v3-sechead"><h2 className="v3-h3">Parked questions</h2><span className="v3-eyebrow">{data.later.length} saved</span></div>
          <div className="v3-card v3-list">
            {data.later.length === 0 && <p className="v3-list-empty">Anything you ask mid-lesson that she parks shows up here, with when it comes back.</p>}
            {data.later.map((l) => (
              <button type="button" key={l.id} className="v3-li" onClick={() => onOpenLater?.(l.id)}>
                <span className="v3-li-ic"><Icon name="pin" size={18} /></span>
                <span><b>{l.text}</b><span>{l.when}</span></span>
                <Icon name="right" className="v3-ink3" />
              </button>
            ))}
          </div>

          <div className="v3-sechead"><h2 className="v3-h3">This week</h2><a href="#you" onClick={(e) => { if (onNav) { e.preventDefault(); onNav("you"); } }}>Edit</a></div>
          <ol className="v3-card v3-week" aria-label="Planned lessons this week">
            {data.week.map((d) => (
              <li key={d.label} className={`v3-wd${d.planned ? " is-plan" : ""}${d.today ? " is-today" : ""}`}
                aria-label={`${d.label}${d.today ? ", today" : ""}: ${d.done ? "done" : d.planned ? `planned${d.time ? ` at ${d.time}` : ""}` : "no lesson"}`}>
                <i aria-hidden="true">{d.done ? <Icon name="check" size={16} /> : d.time ?? ""}</i>
                <span aria-hidden="true">{d.label}</span>
              </li>
            ))}
          </ol>

          <div className="v3-subjects">
            {data.subjects.map((s) => (
              <a key={s.subject} className="v3-card v3-sj" href={`#progress/${s.subject}`} onClick={(e) => { if (onNav) { e.preventDefault(); onNav("progress"); } }}>
                <SubjectMarker subject={s.subject} />
                <b>{s.title}</b>
                <span>{s.detail}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <TabBar current="home" onNav={onNav} />
    </div>
  );
}

function NextArt() {
  return (
    <svg className="v3-next-art" viewBox="0 0 220 180" aria-hidden="true">
      <path d="M30 150 L120 30 L200 150 Z" fill="color-mix(in srgb, var(--ion) 14%, transparent)" stroke="var(--ion)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 150 H200 V30 H30 Z" fill="none" stroke="var(--ink)" strokeOpacity=".22" strokeWidth="1.5" />
      <path d="M120 30 V150" stroke="var(--ink)" strokeOpacity=".5" strokeDasharray="5 6" strokeWidth="2" />
      <circle cx="120" cy="30" r="6" fill="var(--ink)" />
    </svg>
  );
}
