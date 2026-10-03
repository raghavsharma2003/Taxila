// Lessons and the Lesson card (PRODUCT-DESIGN-V2 §6.5.3).
// Lessons: reverse-chronological rows (date · topic in parent words · length). A short visit (under 5 minutes with
// nothing graded) is listed as one and never counted as a lesson (audit #20). Classes 1-4: a Listen button per row.
// Lesson card: "What {child} did" (the same DidCards as the child's Summary: their own answers, a tick only where the
// answer key verified it), "In {child}'s words", the skills with their evidence, "Next check: {day}", and the full
// conversation: Classes 1-4 after the parent PIN is entered again; Classes 5-9 stay private to the child (§6.11).
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Glyph, PinPad, Speaker, StateChip } from "../ui/index.ts";
import { isRelock, parentApi, speakUrl, type LessonCardOut, type LessonLine } from "./api.ts";
import { dayWord, fmtDayLong, fmtTime, labelTitle, parentError, SUBJECT_NAME } from "./copy.ts";
import { EvidenceSheet } from "./EvidenceSheet.tsx";
import { useGate } from "./Gate.tsx";
import { PageState, ParentShell, RowLink, useChildren, useParentData } from "./Shell.tsx";

const title = (l: { topic: { title: string; shortTitle?: string | null } }) => l.topic.shortTitle || l.topic.title;

export function LessonList() {
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const { data, err, stale, reload } = useParentData<{ lessons: LessonLine[] }>(current ? () => parentApi.lessons(current.id) : null, [current?.id], `lessons:${cid}`);
  const young = (current?.class_level ?? 9) <= 4;
  return (
    <ParentShell title="Lessons" child={current} kids={kids}>
      <h1 className="pa-h1">Lessons</h1>
      <PageState err={err} loading={!data} stale={stale} onRetry={reload} />
      {data && (
        data.lessons.length === 0 ? (
          <p className="pa-note">{current?.first_name}'s first lesson will appear here.</p>
        ) : (
          <ul className="pa-lessons">
            {data.lessons.map((l) => (
              <li key={l.id} className="pa-lesson">
                <RowLink to={`/parent/lessons/${l.id}?c=${cid}`}
                  sub={[dayWord(l.startedAt), fmtTime(l.startedAt), l.minutes ? `${l.minutes} min` : !l.endedAt ? "Not finished" : null,
                    l.topic.subject ? SUBJECT_NAME[l.topic.subject] ?? l.topic.subject : null, !l.counted ? "Short visit, not counted as a lesson" : null].filter(Boolean).join(" · ")}>
                  {title(l)}
                </RowLink>
                {young && l.endedAt && (
                  <Speaker src={speakUrl({ what: "lesson", childId: cid, lessonId: l.id })} label={`Listen to the summary of ${title(l)}`} className="speaker pa-listen-sm"><span>Listen</span></Speaker>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </ParentShell>
  );
}

function Conversation({ data, name, onAsking }: { data: LessonCardOut; name: string; onAsking: (on: boolean) => void }) {
  const { relock } = useGate();
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [k, setK] = useState(0);
  if (!data.transcript) {
    return <p className="pa-note">For Class 5 to 9 the word-for-word conversation stays private to {name}. What they did and said is above.</p>;
  }
  if (open) {
    return (
      <section className="pa-card" aria-labelledby="pa-conv-h">
        <h2 id="pa-conv-h" className="pa-card-title">The full conversation</h2>
        <ol className="pa-transcript">
          {data.transcript.map((t) => (
            <li key={t.seq} data-speaker={t.speaker}><strong>{t.speaker === "child" ? name : "Teacher"}:</strong> <span data-speech="">{t.text}</span></li>
          ))}
        </ol>
      </section>
    );
  }
  if (asking) {
    return (
      <section className="pa-card pa-stack-sm" aria-labelledby="pa-conv-pin">
        <h2 id="pa-conv-pin" className="pa-card-title">Enter your parent PIN to see the full conversation</h2>
        <PinPad label="Parent PIN" resetKey={k} autoFocus onComplete={async (pin) => {
          setErr(null);
          try { await parentApi.unlock(pin); setOpen(true); onAsking(false); } catch (e) {
            if (isRelock(e) && (e as { body?: { code?: string } }).body?.code !== "pin_wrong") { relock(); return; }
            setErr(parentError(e)); setK((x) => x + 1);
          }
        }} />
        <p className="pa-gate-msg" aria-live="assertive">{err}</p>
        <Button variant="quiet" small onClick={() => { setAsking(false); onAsking(false); }}>Cancel</Button>
      </section>
    );
  }
  return <Button variant="secondary" onClick={() => { setAsking(true); onAsking(true); }}>See the full conversation</Button>;
}

export function LessonCard() {
  const { lid } = useParams();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const { data, err, reload } = useParentData<LessonCardOut>(current && lid ? () => parentApi.lesson(current.id, lid) : null, [current?.id, lid]);
  const [skill, setSkill] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const name = current?.first_name ?? "Your child";
  return (
    <ParentShell title="Lesson" child={current} kids={kids} noTabs={pinOpen}>
      <RowLink to={`/parent/lessons?c=${cid}`}>All lessons</RowLink>
      <PageState err={err} loading={!data} onRetry={reload} />
      {data && (
        <div className="pa-stack">
          <div>
            <p className="pa-meta">{fmtDayLong(data.lesson.startedAt)} · {fmtTime(data.lesson.startedAt)}{data.lesson.minutes ? ` · ${data.lesson.minutes} min` : ""}{data.lesson.topic.chapter ? ` · ${data.lesson.topic.chapter}` : ""}</p>
            <h1 className="pa-h1">{data.lesson.topic.title}</h1>
            {!data.lesson.counted && <p className="pa-meta">A short visit: not counted as a lesson.</p>}
          </div>
          {data.lesson.endedAt && (
            <Speaker key={data.lesson.id} src={speakUrl({ what: "lesson", childId: cid, lessonId: data.lesson.id })} label="Listen to this lesson's summary" className="speaker pa-listen"><span>Listen</span></Speaker>
          )}
          <section className="pa-card" aria-labelledby="pa-did-h">
            <h2 id="pa-did-h" className="pa-card-title">What {name} did</h2>
            {data.did && data.did.cards.length > 0 ? (
              <ul className="pa-did">
                {data.did.cards.map((c, i) => (
                  <li key={i} className="pa-did-row" data-tick={c.tick || undefined}>
                    {c.tick && <Glyph name="tick" size={20} className="pa-ev-glyph" />}
                    <span>
                      {c.kind === "teachback" ? "Explained it back" : <span data-speech="">{c.ask}</span>}
                      <span className="pa-muted">{c.kind === "teachback" ? "" : " · "}{c.kind === "teachback" ? "" : <>Answered <q className="pa-quote" data-speech="">{c.answer}</q></>}</span>
                      {c.tick && <span className="pa-meta"> · {c.withHelp ? "Right, with a hint" : "Right, on their own"}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="pa-muted">{data.lesson.endedAt ? "No answers were checked in this lesson." : "This lesson didn't finish."}</p>}
            {data.did?.tried ? <p className="pa-meta">{name} tried {data.did.tried} questions.</p> : null}
          </section>
          {data.quote && (
            <section className="pa-card" aria-labelledby="pa-quote-h">
              <h2 id="pa-quote-h" className="pa-card-title">In {name}'s words</h2>
              <q className="pa-quote pa-quote-big" data-speech="">{data.quote}</q>
            </section>
          )}
          <section className="pa-card" aria-labelledby="pa-sk-h">
            <h2 id="pa-sk-h" className="pa-card-title">What was checked</h2>
            {data.skills.length === 0 ? <p className="pa-muted">No checks were recorded in this lesson.</p> : (
              <ul className="pa-list">
                {data.skills.map((s) => (
                  <li key={s.skillId}>
                    <button type="button" className="pa-skill pa-skill-row" onClick={() => setSkill(s.skillId)}>
                      <span className="pa-skill-main"><span>{labelTitle(s.label)}</span><span className="pa-meta">{s.unaided} of {s.attempts} right on their own</span></span>
                      <StateChip state={s} lang="en" />
                      <span className="pa-how">How do we know?</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {data.nextCheck && <p><strong>Next check:</strong> {fmtDayLong(data.nextCheck)}, in a later lesson.</p>}
          </section>
          <Conversation data={data} name={name} onAsking={setPinOpen} />
        </div>
      )}
      {current && <EvidenceSheet childId={cid} skill={skill} childName={name} onClose={() => setSkill(null)} />}
    </ParentShell>
  );
}
