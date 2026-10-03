// Progress (PRODUCT-DESIGN-V2 §6.5.3): the class's chapters as cards, each topic with its state shape and word
// (Not started · Practising · Got it · Secure: the same four shapes everywhere), "Chapters started: 3 · Secure: 5 of
// 74", the chapter the next lesson is in, and the foundation bridge when the next lesson comes from an earlier class.
// Never "behind", never a percentage, never a grade equivalent. Checked skills under a topic open "How do we know?".
import { useState } from "react";
import { Link } from "react-router-dom";
import { Art, Icon, StateChip, type LedgerState } from "../ui/index.ts";
import { parentApi, type SyllabusOut } from "./api.ts";
import { HOME, labelTitle, SUBJECT_ART, SUBJECT_NAME } from "./copy.ts";
import { EvidenceSheet } from "./EvidenceSheet.tsx";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";

const LEGEND: LedgerState[] = [{ level: 0, key: "unseen" }, { level: 1, key: "practising" }, { level: 2, key: "learned_today" }, { level: 3, key: "mastered" }];

export default function Progress() {
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const syl = useParentData<SyllabusOut>(current ? () => parentApi.syllabus(current.id) : null, [current?.id], `syllabus:${cid}`);
  const [skill, setSkill] = useState<string | null>(null);
  const d = syl.data;
  return (
    <ParentShell title="Progress" child={current} kids={kids}>
      <h1 className="pa-h1">Progress</h1>
      <PageState err={syl.err} loading={!d} stale={syl.stale} onRetry={syl.reload} />
      {d && (
        <div className="pa-stack">
          {!d.profileKept && (
            <div className="pa-note">
              <p>{HOME.not_kept}</p>
              <Link className="pa-how" to={`/parent/data?c=${cid}#choices`}>Change <Icon name="chevron" size={18} /></Link>
            </div>
          )}
          <p className="pa-lead">Class {d.classLevel} · Chapters started: {d.header.chaptersStarted} · Secure: {d.header.secure} of {d.header.topics}</p>
          <ul className="pa-legend" aria-label="What the shapes mean">
            {LEGEND.map((s) => <li key={s.key}><StateChip state={s} lang="en" /></li>)}
          </ul>
          {d.bridge && (
            <p className="pa-note">Building the foundation: {d.bridge.steps.join(" → ")}</p>
          )}
          {d.subjects.length === 0 && <p className="pa-note">The chapter list for this class is still being prepared.</p>}
          {d.subjects.map((s) => (
            <section key={s.subject} className="pa-subject" aria-labelledby={`pa-subj-${s.subject}`}>
              <div className="pa-subject-head">
                <Art id={SUBJECT_ART[s.subject] ?? `subjects/${s.subject}`} className="pa-subject-art" fallback={<span />} />
                <h2 id={`pa-subj-${s.subject}`} className="pa-h2">{SUBJECT_NAME[s.subject] ?? s.subject}</h2>
                <span className="pa-meta">{s.book}</span>
              </div>
              <ol className="pa-chapters">
                {s.chapters.map((c) => (
                  <li key={c.id} className="pa-card pa-chapter" data-here={d.here?.chapterId === c.id || undefined}>
                    <h3 className="pa-h3">Chapter {c.number} · {c.title}</h3>
                    {d.here?.chapterId === c.id && <p className="pa-here"><Icon name="chevron" size={16} /> The next lesson is in this chapter</p>}
                    <ul className="pa-topics">
                      {c.topics.map((t) => (
                        <li key={t.id} className="pa-topic">
                          <div className="pa-topic-row"><span className="pa-topic-title">{t.title}</span><StateChip state={t} lang="en" /></div>
                          {(t.skills ?? []).map((sk) => (
                            <button key={sk.skillId} type="button" className="pa-skill" onClick={() => setSkill(sk.skillId)}>
                              <span>{labelTitle(sk.label)}</span><span className="pa-how">How do we know? <Icon name="chevron" size={16} /></span>
                            </button>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
      {current && <EvidenceSheet childId={cid} skill={skill} childName={current.first_name} onClose={() => setSkill(null)} />}
    </ParentShell>
  );
}
