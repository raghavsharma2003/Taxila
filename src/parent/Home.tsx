// Parent home (PRODUCT-DESIGN-V2 §6.5.1): "How is my child doing?" in 10 seconds. Three blocks:
//   This week     one capability and one thing still being practised, each with "How do we know?" (G-PARENT-1:
//                 the server picks, src/parent/claims.ts re-checks, the sheet shows the same state);
//   Try at home   the weekly letter's home activity (a reviewed template; a nib left rule, never the lamp);
//   Next lesson   topic and when, from the same plan the child's home reads.
// Facts sit one level down ("Lessons this week: 2 · 38 minutes"), never as the headline. States: no lessons yet, one
// lesson, too early, normal, quiet, offline (the last good copy + "Last updated 6:42 pm"), safety alert (a card above
// everything with a trouble left rule), "Only this session" consent. 1280: a right column with Recent lessons and
// Progress. "Listen to this page" reads the page's own sentences (server/routes/parent.js homeSpeech).
import { useEffect, useState } from "react";
import { tw2 } from "../copy/en.ts";
import type { MadeForItem } from "../../shared/contracts.ts";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Art, Button, Icon, Speaker, StateChip } from "../ui/index.ts";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { bandForClass } from "../app/band.ts";
import { isRelock, parentApi, speakUrl, type Claim, type Overview, type SyllabusOut } from "./api.ts";
import { gateHeadline } from "./claims.ts";
import { dayWord, fmtClock, fmtDayLong, HOME, parentError } from "./copy.ts";
import { EvidenceSheet } from "./EvidenceSheet.tsx";
import { ReportEvidenceSheet } from "./Report.tsx";
import { useGate } from "./Gate.tsx";
import { PageState, ParentShell, RowLink, useChildren, useParentData } from "./Shell.tsx";

function useWide() {
  const q = typeof matchMedia !== "undefined" ? matchMedia("(min-width: 900px)") : null;
  const [wide, setWide] = useState(!!q?.matches);
  useEffect(() => {
    if (!q) return;
    const on = () => setWide(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, [q]);
  return wide;
}

function ClaimLine({ c, text, cid }: { c: Claim; text: string; cid: string }) {
  return (
    <div className="pa-claim" data-claim={c.kind} data-skill={c.skillId} data-claim-state={c.key}>
      <p className="pa-claim-text">{text}</p>
      {c.misconception && <p className="pa-meta">The mix-up we saw: {c.misconception}.</p>}
      <div className="pa-claim-foot">
        <StateChip state={c} lang="en" />
        <Link className="pa-how" to={`/parent/evidence/${encodeURIComponent(c.skillId)}?c=${cid}`} state={{ from: "home" }}>
          How do we know? <Icon name="chevron" size={18} />
        </Link>
      </div>
    </div>
  );
}

function ThisWeek({ d, name, cid, teacherName }: { d: Overview; name: string; cid: string; teacherName: string }) {
  const h = gateHeadline(d.headline);
  const kind = d.headline.kind;
  return (
    <section className="pa-card pa-week" aria-labelledby="pa-week-h" data-headline={h.kind}>
      <h2 id="pa-week-h" className="pa-card-title">This week</h2>
      {kind === "held" ? <p className="pa-headline">{HOME.held}</p>
        : !d.headline.profileKept ? (
          <div className="pa-stack-sm">
            <p className="pa-headline">{HOME.not_kept}</p>
            <Link className="pa-how" to={`/parent/data?c=${cid}#choices`}>Change <Icon name="chevron" size={18} /></Link>
          </div>
        ) : kind === "none" ? (
          <div className="pa-empty">
            <Art id="states/lessons-empty-parent" className="pa-empty-art" fallback={<span />} />
            <p className="pa-headline">{HOME.none(name)}</p>
            <p className="pa-muted">{teacherName} will say hello the first time {name} opens Taxila.</p>
          </div>
        ) : kind === "too_early" ? <p className="pa-headline">{HOME.too_early}</p>
          : kind === "quiet" || h.kind === "quiet" ? <p className="pa-headline">{HOME.quiet}</p>
            : kind === "no_week" ? <p className="pa-headline">{HOME.no_week}</p>
              : (
                <div className="pa-stack">
                  {kind === "first" && <p className="pa-headline">{HOME.first(name, d.headline.firstTopic?.title ?? "a first topic")}</p>}
                  {h.canNow && <ClaimLine c={h.canNow} cid={cid} text={HOME.can_now(name, h.canNow.label)} />}
                  {h.practising && <ClaimLine c={h.practising} cid={cid} text={HOME.practising(h.practising.label)} />}
                </div>
              )}
    </section>
  );
}

function TryAtHome({ d, cid, onHow }: { d: NonNullable<Overview["tryAtHome"]>; cid: string; onHow: (claimId: string) => void }) {
  const { relock } = useGate();
  const [done, setDone] = useState<"done" | "skip" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const answer = async (yes: boolean) => {
    setErr(null);
    try { await parentApi.homeTask(cid, { period: d.period }, yes); setDone(yes ? "done" : "skip"); } catch (e) {
      if (isRelock(e)) relock(); else setErr(parentError(e));
    }
  };
  return (
    <section className="pa-card pa-try" aria-labelledby="pa-try-h">
      <h2 id="pa-try-h" className="pa-card-title">Try at home · 5 minutes</h2>
      {d.pictures.length > 0 && (
        <ul className="pa-pics" aria-label="Things you can use">
          {d.pictures.map((p) => <li key={p}><Art id={p} className="pa-pic" alt={p.split("/")[1].replace(/-/g, " ")} fallback={<span />} /></li>)}
        </ul>
      )}
      <p className="pa-try-text">{d.text.replace(/^At home:\s*/, "")}</p>
      {d.claimId && (
        <button type="button" className="pa-how pa-textbtn" onClick={() => onHow(d.claimId!)}>How do we know? <Icon name="chevron" size={18} /></button>
      )}
      {done ? (
        <p className="pa-row" role="status"><Icon name="tick" size={20} /> {done === "done" ? "Noted. Thank you." : "That's fine. It stays here this week."}</p>
      ) : (
        <div className="pa-actions">
          <Button small variant="secondary" onClick={() => answer(true)}>Done</Button>
          <Button small variant="secondary" onClick={() => answer(false)}>Not this week</Button>
        </div>
      )}
      {err && <p className="pa-form-err" role="alert">{err}</p>}
    </section>
  );
}

function NextLesson({ d, name, cid }: { d: NonNullable<Overview["next"]>; name: string; cid: string }) {
  const topic = d.topic ? d.topic.shortTitle || d.topic.title : null;
  const hours = `Lesson hours ${fmtClock(d.window.from)} to ${fmtClock(d.window.to)}`;
  const line = d.state === "resume" ? `${name} has a lesson to continue${topic ? `: ${topic}` : ""}.`
    : d.state === "done" ? `Done for today.${topic ? ` Next: ${topic}, tomorrow.` : ""}`
      : d.state === "capped" ? `That's today's time used.${topic ? ` Next: ${topic}, tomorrow.` : ""}`
        : d.state === "resting" ? `Lessons open again at ${fmtClock(d.window.from)}.${topic ? ` Next: ${topic}.` : ""}`
          : topic ? `Today · ${topic}` : "Today";
  return (
    <Link to={`/parent/lessons?c=${cid}`} className="pa-card pa-next" aria-label={`Next lesson. ${line} ${hours}`}>
      <span className="pa-card-title">Next lesson</span>
      <span className="pa-next-line">{line}</span>
      <span className="pa-meta">{hours}{d.minutes ? ` · about ${d.minutes} minutes` : ""}</span>
      <Icon name="chevron" size={20} className="pa-next-chev" />
    </Link>
  );
}

function Side({ d, cid, wide }: { d: Overview; cid: string; wide: boolean }) {
  const syl = useParentData<SyllabusOut>(wide ? () => parentApi.syllabus(cid) : null, [cid, wide]);
  const chapters = syl.data ? syl.data.subjects.flatMap((s) => s.chapters.filter((c) => c.topics.some((t) => t.level > 0)).map((c) => ({ s, c }))).slice(0, 4) : [];
  return (
    <>
      <section className="pa-card" aria-labelledby="pa-recent-h">
        <h2 id="pa-recent-h" className="pa-card-title">Recent lessons</h2>
        {d.recent.length === 0 ? <p className="pa-muted">None yet.</p> : (
          <ul className="pa-list">
            {d.recent.map((l) => (
              <li key={l.id}><RowLink to={`/parent/lessons/${l.id}?c=${cid}`} sub={`${dayWord(l.startedAt)}${l.minutes ? ` · ${l.minutes} min` : ""}`}>{l.topic.shortTitle || l.topic.title}</RowLink></li>
            ))}
          </ul>
        )}
      </section>
      <section className="pa-card" aria-labelledby="pa-prog-h">
        <h2 id="pa-prog-h" className="pa-card-title">Progress</h2>
        {chapters.length === 0 ? <p className="pa-muted">Chapters appear here after the first lesson.</p> : (
          <ul className="pa-list">
            {chapters.map(({ c }) => (
              <li key={c.id} className="pa-chap-mini">
                <span className="pa-chap-mini-title">{c.title}</span>
                <span className="pa-shapes">{c.topics.map((t) => <StateChip key={t.id} state={t} lang="en" />).slice(0, 3)}</span>
              </li>
            ))}
          </ul>
        )}
        <RowLink to={`/parent/progress?c=${cid}`}>All progress</RowLink>
      </section>
    </>
  );
}

export default function ParentHome() {
  const nav = useNavigate();
  const loc = useLocation();
  const { skill } = useParams();
  const wide = useWide();
  const { kids, current, err: kidsErr, reload: reloadKids } = useChildren();
  const cid = current?.id ?? "";
  const { data, err, stale, reload } = useParentData<Overview>(current ? () => parentApi.overview(current.id) : null, [current?.id], `overview:${cid}`);
  const [how, setHow] = useState<string | null>(null);

  if (kids && kids.length === 0) {
    return (
      <ParentShell title="Home">
        <div className="pa-stack">
          <h1 className="pa-h1">Parent corner</h1>
          <p className="pa-lead">There's no child profile on this account yet.</p>
          <div className="pa-actions"><Button onClick={() => nav("/start/class?add=1")}>Add a child</Button></div>
        </div>
      </ParentShell>
    );
  }
  const name = current?.first_name ?? "";
  const teacherName = current ? ((current as typeof current & { teacher_name?: string | null }).teacher_name || teacherRecord(current.teacher_id, bandForClass(current.class_level)).name) : "";
  const closeSheet = () => (loc.state && (loc.state as { from?: string }).from ? nav(-1) : nav(`/parent?c=${cid}`, { replace: true }));

  return (
    <ParentShell title="Home" child={current} kids={kids} side={data && wide ? <Side d={data} cid={cid} wide={wide} /> : undefined}>
      <h1 className="sr-only">{name ? `${name} this week` : "Parent corner"}</h1>
      <PageState err={kidsErr ?? err} loading={!data} stale={stale} onRetry={kidsErr ? reloadKids : reload} />
      {data && current && (
        <div className="pa-stack pa-home">
          <div className="pa-home-top">
            <Speaker key={cid} src={speakUrl({ what: "home", childId: cid })} label="Listen to this page" className="speaker pa-listen"><span>Listen to this page</span></Speaker>
          </div>
          {data.alert && (
            <section className="pa-card pa-alert" role="region" aria-labelledby="pa-alert-h">
              <h2 id="pa-alert-h" className="pa-alert-title">{HOME.alert(name)}</h2>
              <p>Something {name} said in a lesson made {teacherName} stop and show the helplines{data.alert.at ? `, on ${fmtDayLong(data.alert.at)}` : ""}.</p>
              <RowLink to={`/parent/help?c=${cid}#alert`}>See what happened</RowLink>
            </section>
          )}
          <ThisWeek d={data} name={name} cid={cid} teacherName={teacherName} />
          {data.tryAtHome && <TryAtHome d={data.tryAtHome} cid={cid} onHow={setHow} />}
          {data.next && <NextLesson d={data.next} name={name} cid={cid} />}
          <MadeFor cid={cid} name={name} T={teacherName} />
          <p className="pa-facts">Lessons this week: {data.week.lessons} · {data.week.minutes} minutes</p>
          <ul className="pa-list pa-home-links">
            <li><RowLink to={`/parent/notes?c=${cid}`} sub="Written after each lesson day and each week">Today's note and this week's letter</RowLink></li>
            {!wide && <li><RowLink to={`/parent/lessons?c=${cid}`}>Lessons</RowLink></li>}
          </ul>
        </div>
      )}
      {current && <EvidenceSheet childId={cid} skill={skill ?? null} childName={name} onClose={closeSheet} />}
      {current && data?.tryAtHome && (
        <ReportEvidenceSheet childId={cid} claimId={how} at={{ cadence: "weekly", period: data.tryAtHome.period }} onClose={() => setHow(null)} />
      )}
    </ParentShell>
  );
}

/**
 * "Made for {child}" (STUDENT-FLOW §12.1; W2-A #9): the latest pieces the teacher made for this child, with the plain
 * "because" from the build record and the child's result; read from W2-H's studio_mount feed. The full daily card is
 * W4-F. While nothing was made: one quiet line (`none_yet`).
 */
function MadeFor({ cid, name, T }: { cid: string; name: string; T: string }) {
  const [items, setItems] = useState<MadeForItem[] | null>(null);
  useEffect(() => {
    let live = true;
    parentApi.madeFor(cid).then((r) => live && setItems(r.items), () => live && setItems([]));
    return () => { live = false; };
  }, [cid]);
  if (!items) return null;
  return (
    <section className="pa-card" aria-labelledby="pa-made-h" data-testid="parent-madefor">
      <h2 id="pa-made-h" className="pa-card-title">{tw2("parent.madefor.title", { name })}</h2>
      {items.length === 0 ? <p className="pa-muted">{tw2("parent.madefor.none", { T })}</p> : (
        <ul className="pa-list">
          {items.slice(0, 3).map((it) => (
            <li key={it.id} className="pa-row">
              <span><strong>{it.title}</strong>{it.topicTitle ? <span className="pa-muted"> · {it.topicTitle}</span> : null}</span>
              {it.because && <span className="pa-meta"> · {it.because.replace(/^You thought/, `${name} thought`)}</span>}
              {it.result && <span className="pa-meta"> · {it.result === "on_own" ? "On their own" : "With a hint"}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
