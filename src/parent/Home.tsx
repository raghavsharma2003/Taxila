// Parent Home (§6.3): three things. IS HAFTE (one capability + one tricky bit, each with Kaise pata?),
// GHAR PAR EK KAAM (the only your-turn block), AUR DEKHEIN. No time facts in the headline: minutes and
// lessons sit one level down as plain facts; no week-on-week deltas, no tallies (R10).
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, ButtonLink, Card, Icon, Speaker, StateChip, readLang } from "../ui/index.ts";
import { isGateError, parentApi, speakUrl, type SkillLine } from "./api.ts";
import { useGate } from "./Gate.tsx";
import { errText } from "../app/api.ts";
import { EvidenceSheet } from "./EvidenceSheet.tsx";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";
import { fmtDay, fmtTime } from "./words.ts";

function SkillLink({ s, cid, lead }: { s: SkillLine; cid: string; lead: string }) {
  const lang = readLang();
  return (
    <div className="hafte-line">
      <p><span className="muted">{lead}</span> <strong>{s.title}</strong></p>
      {s.misconception && <p className="t-note">The mix-up: {s.misconception}</p>}
      <div className="row">
        <StateChip state={s} lang={lang} nextReview={s.nextReview} />
        <span className="spacer" />
        <Link className="kaise" to={`/parent/${cid}/skill/${encodeURIComponent(s.skillId)}`}>Kaise pata? <Icon name="chevron" size={18} /></Link>
      </div>
    </div>
  );
}

export default function ParentHome() {
  const nav = useNavigate();
  const { skill } = useParams();
  const { kids, current, err: kidsErr } = useChildren();
  const { data, err } = useParentData(current ? () => parentApi.overview(current.id) : null, [current?.id]);
  const [task, setTask] = useState<"done" | "skip" | null>(null);
  const [taskErr, setTaskErr] = useState<string | null>(null);
  const { relock } = useGate();
  // "Noted" only after the server took it (a 403 after the 10-minute unlock re-shows the PIN pad).
  const answerTask = async (lessonId: string, done: boolean) => {
    setTaskErr(null);
    try {
      await parentApi.homeTask(cid, lessonId, done);
      setTask(done ? "done" : "skip");
    } catch (e) {
      if (isGateError(e)) relock(); else setTaskErr(errText(e));
    }
  };

  if (kids && kids.length === 0) {
    return (
      <ParentShell title="Parent corner">
        <div className="stack">
          <p className="t-lead">No child profile yet.</p>
          <ButtonLink to="/start/child?add=1">Add a child</ButtonLink>
        </div>
      </ParentShell>
    );
  }
  const cid = current?.id ?? "";
  const name = current?.first_name ?? "";

  return (
    <ParentShell title="Home" child={current} kids={kids}>
      <PageState err={kidsErr ?? err} loading={!data} />
      {data && (
        <div className="pc-grid">
          <div className="stack">
            <p className="t-meta">{name} · Class {data.child.classLevel} · {data.child.board.toUpperCase()}</p>
            <Card title="Is hafte · this week">
              {/* Read-aloud first (PX10): the same paragraph, spoken (Azure TTS, composed on the server). */}
              <Speaker key={cid} src={speakUrl({ what: "hafte", childId: cid })} label="Listen to this week" className="speaker speaker-wide">
                <span>Suno · Listen</span>
              </Speaker>
              {data.isHafte.canNow || data.isHafte.tricky ? (
                <div className="stack">
                  {data.isHafte.canNow && <SkillLink s={data.isHafte.canNow} cid={cid} lead="Can now do:" />}
                  {data.isHafte.tricky && <SkillLink s={data.isHafte.tricky} cid={cid} lead="Still tricky:" />}
                </div>
              ) : (
                <p>{data.week.lessons ? `Nothing new to report yet from this week's lessons.` : `No lessons this week. Nothing to fix.`}</p>
              )}
            </Card>

            {data.homeTask && (
              <Card turn title="Ghar par ek kaam · from the last lesson">
                <p className="t-note">From the lesson on {fmtDay(data.homeTask.at)}</p>
                <p>{data.homeTask.text}</p>
                {task ? (
                  <p className="row"><Icon name="tick" /> {task === "done" ? "Noted. Thank you." : "That is fine. It stays here."}</p>
                ) : (
                  <div className="row home-task-btns">
                    <Button small variant="secondary" onClick={() => answerTask(data.homeTask!.lessonId, true)}>Ho gaya</Button>
                    <Button small variant="secondary" onClick={() => answerTask(data.homeTask!.lessonId, false)}>Is hafte nahi</Button>
                  </div>
                )}
                {taskErr && <p className="field-msg" role="alert">{taskErr}</p>}
              </Card>
            )}

            <Card title="Aur dekhein · more">
              <p className="t-note">This week: {data.week.lessons} {data.week.lessons === 1 ? "lesson" : "lessons"}, {data.week.minutes} minutes.</p>
              <ul className="link-list">
                <li><Link to={`/parent/${cid}/syllabus`}>Skills and syllabus <Icon name="chevron" size={18} /></Link></li>
                <li><Link to={`/parent/${cid}/lessons`}>Lessons <Icon name="chevron" size={18} /></Link></li>
                <li><Link to={`/parent/${cid}/teaching`}>How she teaches {name} <Icon name="chevron" size={18} /></Link></li>
                <li><Link to="/parent/ptm">Talk to her about {name} (PTM) <Icon name="chevron" size={18} /></Link></li>
              </ul>
              <p className="t-note">Last updated {fmtTime(data.updatedAt)}</p>
            </Card>
          </div>

          <aside className="stack pc-side" aria-label="Skills">
            <Card title="Skills she has checked">
              {data.skills.length === 0 ? <p className="muted">None yet. They appear after the first lesson.</p> : (
                <ul className="skill-list">
                  {data.skills.slice(0, 12).map((s) => (
                    <li key={s.skillId}>
                      <Link to={`/parent/${cid}/skill/${encodeURIComponent(s.skillId)}`} className="skill-row">
                        <span className="skill-title">{s.title}</span>
                        <StateChip state={s} lang={readLang()} nextReview={s.nextReview} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {data.skills.length > 12 && <Link to={`/parent/${cid}/syllabus`}>All {data.skills.length} skills</Link>}
            </Card>
          </aside>
        </div>
      )}
      {current && <EvidenceSheet childId={cid} skill={skill ?? null} childName={name} onClose={() => nav(`/parent?c=${cid}`)} />}
    </ParentShell>
  );
}
