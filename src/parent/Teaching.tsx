// How the teacher teaches {child} (round 7 F, learning-parent-teaching-page; STUDENT-FLOW §12.1). Three cards:
//   - How {T} teaches: fixed copy, the same for every child;
//   - Recent lessons: what {T} did and why, per lesson, from the trace's closed codes (server/reports/teaching.js), never
//     model prose and never a statement about the child's mind or ability;
//   - Made for {child}: pieces made in lessons, with the plain "because" from the kit;
// plus What {T} remembers (the same card as Data and privacy, with Delete).
import { parentApi } from "./api.ts";
import { becauseForParent } from "./copy.ts";
import { Memories } from "./Pages.tsx";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";

const day = (at: string) => new Date(at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export default function Teaching() {
  const { kids, current } = useChildren();
  const d = useParentData(current ? () => parentApi.teaching(current.id) : null, [current?.id]);
  const name = current?.first_name ?? "your child";
  const T = d.data?.teacher ?? "The teacher";
  return (
    <ParentShell title="How the teacher teaches" child={current} kids={kids}>
      <h1 className="pa-h1">How {T} teaches {name}</h1>
      <PageState err={d.err} loading={!d.data} onRetry={d.reload} />
      {d.data && current && (
        <div className="pa-stack" data-testid="teaching">
          <section className="pa-card" aria-labelledby="pa-t-how">
            <h2 id="pa-t-how" className="pa-h2">How {T} works</h2>
            <ul className="pa-list">{d.data.approach.map((a) => <li key={a}>{a}</li>)}</ul>
          </section>
          <section className="pa-card" aria-labelledby="pa-t-why">
            <h2 id="pa-t-why" className="pa-h2">In recent lessons</h2>
            {d.data.lessons.length === 0 ? <p className="pa-meta">This fills in after {name}'s first lesson.</p> : (
              <ul className="pa-list pa-stack-sm">
                {d.data.lessons.map((l) => (
                  <li key={l.id} data-lesson-id={l.id}>
                    <p className="pa-h3">{l.topic ?? "A lesson"} <span className="pa-meta">· {day(l.startedAt)}</span></p>
                    {l.why.length ? <ul className="pa-list">{l.why.map((w) => <li key={w.code}>{w.text}</li>)}</ul>
                      : <p className="pa-meta">{T} taught it the usual way: explain, a question, then practice.</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {d.data.madeFor.length > 0 && (
            <section className="pa-card" aria-labelledby="pa-t-made">
              <h2 id="pa-t-made" className="pa-h2">Made for {name}</h2>
              <ul className="pa-list">
                {d.data.madeFor.map((m) => (
                  <li key={m.id}><span>{m.title}</span>{m.because && <span className="pa-meta"> · {becauseForParent(m.because, name)}</span>}</li>
                ))}
              </ul>
            </section>
          )}
          <Memories child={current} teacherName={T} />
        </div>
      )}
    </ParentShell>
  );
}
