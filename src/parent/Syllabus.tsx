// Syllabus map (§6.5): the class's school chapters (data/curriculum) with a ledger chip per topic, a coverage
// header (chapters touched, topics pakka; never charted over time), and the skills she has checked.
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Icon, StateChip, readLang } from "../ui/index.ts";
import { parentApi } from "./api.ts";
import { EvidenceSheet } from "./EvidenceSheet.tsx";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";
import { SUBJECT_NAME } from "./words.ts";

export default function Syllabus() {
  const nav = useNavigate();
  const { skill } = useParams();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const syl = useParentData(current ? () => parentApi.syllabus(current.id) : null, [current?.id]);
  const ov = useParentData(current ? () => parentApi.overview(current.id) : null, [current?.id]);
  const lang = readLang();
  const d = syl.data;
  return (
    <ParentShell title="Syllabus" child={current} kids={kids} onSwitch={(id) => nav(`/parent/${id}/syllabus`)}>
      <PageState err={syl.err} loading={!d} />
      {d && (
        <div className="stack">
          <h1 className="t-title">Class {d.classLevel} syllabus</h1>
          <p className="muted">{d.header.chaptersTouched} chapters touched · {d.header.topicsPakka} of {d.header.topics} topics <strong>Pakka</strong></p>
          {ov.data && ov.data.skills.length > 0 && (
            <Card title="Skills she has checked">
              <ul className="skill-list">
                {ov.data.skills.map((s) => (
                  <li key={s.skillId}>
                    <Link to={`/parent/${cid}/syllabus/skill/${encodeURIComponent(s.skillId)}`} className="skill-row">
                      <span className="skill-title">{s.title}</span>
                      <StateChip state={s} lang={lang} nextReview={s.nextReview} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {d.subjects.length === 0 && <p className="note">The chapter list for this class is not loaded yet.</p>}
          {d.subjects.map((s) => (
            <details key={s.subject} className="card card-flat subj" open={d.subjects.length === 1}>
              <summary className="summary subj-sum">
                <span>{SUBJECT_NAME[s.subject] ?? s.subject} <span className="t-meta">· {s.book}</span></span>
                <Icon name="chevron" size={20} className="subj-chev" />
              </summary>
              <ol className="chapters">
                {s.chapters.map((c) => (
                  <li key={c.id} className="stack-sm">
                    <h3 className="chap-title">{c.number}. {c.title}</h3>
                    <ul className="topic-list">
                      {c.topics.map((t) => (
                        <li key={t.id} className="topic-row"><span>{t.title}</span><StateChip state={t} lang={lang} /></li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </details>
          ))}
          <p className="t-meta">Where your child's level is below their class, the path back up is shown in lessons, never in years.</p>
        </div>
      )}
      {current && <EvidenceSheet childId={cid} skill={skill ?? null} childName={current.first_name} onClose={() => nav(`/parent/${cid}/syllabus`)} />}
    </ParentShell>
  );
}
