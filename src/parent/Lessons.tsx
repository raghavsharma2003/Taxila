// Lessons (§6.6): reverse-chronological list, and the per-lesson card (never pushed): what happened in plain
// sentences, skill chips with Kaise pata?, one quote <= 25 words, the next re-check date. Full verbatim
// transcripts: Class 1-4 visible; Class 5-9 on request (§6.11), and that request path is not built yet.
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Icon, Speaker, StateChip, readLang } from "../ui/index.ts";
import { parentApi, speakUrl } from "./api.ts";
import { EvidenceSheet } from "./EvidenceSheet.tsx";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";
import { fmtDayLong, SUBJECT_NAME } from "./words.ts";

const firstLine = (s: string | null) => (s ? s.split(/(?<=[.!?])\s/)[0] : null);

export function LessonList() {
  const nav = useNavigate();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const { data, err } = useParentData(current ? () => parentApi.lessons(current.id) : null, [current?.id]);
  return (
    <ParentShell title="Lessons" child={current} kids={kids} onSwitch={(id) => nav(`/parent/${id}/lessons`)}>
      <PageState err={err} loading={!data} />
      {data && (
        <div className="stack">
          <h1 className="t-title">Lessons</h1>
          {data.lessons.length === 0 ? <p className="note">No lessons yet.</p> : (
            <ul className="lesson-list">
              {data.lessons.map((l) => (
                <li key={l.id}>
                  <Link to={`/parent/${cid}/lessons/${l.id}`} className="lesson-row card card-flat">
                    <span className="t-note">{fmtDayLong(l.startedAt)}{l.minutes ? ` · ${l.minutes} min` : ""}{l.topic.subject ? ` · ${SUBJECT_NAME[l.topic.subject] ?? l.topic.subject}` : ""}</span>
                    <strong>{l.topic.title}</strong>
                    {firstLine(l.note) && <span className="muted">{firstLine(l.note)}</span>}
                    {!l.endedAt && <span className="t-meta">Not finished</span>}
                    <Icon name="chevron" className="lesson-chev" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ParentShell>
  );
}

export function LessonCard() {
  const nav = useNavigate();
  const { lid, skill } = useParams();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const { data, err } = useParentData(current && lid ? () => parentApi.lesson(current.id, lid) : null, [current?.id, lid]);
  const lang = readLang();
  return (
    <ParentShell title="Lesson" child={current} kids={kids} onSwitch={(id) => nav(`/parent/${id}/lessons`)}>
      <Link to={`/parent/${cid}/lessons`} className="back-link"><Icon name="back" size={20} /> All lessons</Link>
      <PageState err={err} loading={!data} />
      {data && (
        <div className="stack">
          <p className="t-note">{fmtDayLong(data.lesson.startedAt)}{data.lesson.topic.chapter ? ` · ${data.lesson.topic.chapter}` : ""}</p>
          <h1 className="t-title">{data.lesson.topic.title}</h1>
          {/* §6.6: a spoken summary (the default view for Class 1-4 families; offered to every family). */}
          <Speaker key={data.lesson.id} src={speakUrl({ what: "lesson", childId: cid, lessonId: data.lesson.id })} label="Listen to this lesson's summary"
            className="speaker speaker-wide"><span>Suno · Listen</span></Speaker>
          {data.lesson.note ? <p className="t-lead">{data.lesson.note}</p> : <p className="muted">{data.lesson.endedAt ? "The summary for this lesson is not ready." : "This lesson did not finish, so there is no summary."}</p>}
          {data.quote && (
            <Card title={`${current?.first_name ?? "Your child"} said`}>
              <q className="ev-quote big-quote">{data.quote}</q>
            </Card>
          )}
          <Card title="Skills in this lesson">
            {data.skills.length === 0 ? <p className="muted">No checks were recorded in this lesson.</p> : (
              <ul className="skill-list">
                {data.skills.map((s) => (
                  <li key={s.skillId}>
                    <Link to={`/parent/${cid}/lessons/${lid}/skill/${encodeURIComponent(s.skillId)}`} className="skill-row">
                      <span className="skill-title">{s.title}<span className="t-meta"> · {s.unaided} of {s.attempts} on their own</span></span>
                      <StateChip state={s} lang={lang} nextReview={s.nextReview} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {data.transcript ? (
            <details className="card card-flat">
              <summary className="summary">Full conversation</summary>
              <ol className="transcript">
                {data.transcript.map((t) => (
                  <li key={t.seq} data-speaker={t.speaker}><strong>{t.speaker === "child" ? current?.first_name : "Teacher"}:</strong> {t.text}</li>
                ))}
              </ol>
            </details>
          ) : (
            <p className="note">For Class 5 to 9, the full word-for-word conversation is shown only on request, and your child is told when it is opened. Requesting it is coming soon.</p>
          )}
        </div>
      )}
      {current && <EvidenceSheet childId={cid} skill={skill ?? null} childName={current.first_name} onClose={() => nav(`/parent/${cid}/lessons/${lid}`)} />}
    </ParentShell>
  );
}
