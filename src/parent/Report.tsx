// Notes (server/reports/**; PARENT-REPORT.md §9.1-§9.3): today's note (pull-only) and the weekly letter. The text is
// English (PRODUCT-DESIGN-V2 §3.12: "The weekly voice note is in the parent's spoken language. The text is English."),
// and Listen plays the stored spoken script in the family's language. Every claim line taps through to "How do we
// know?": the ledger rows behind that line, re-read on the server. Before the night job writes today's note, "So far"
// shows a preview built the same way (no model, never stored). During a safety hold: "No new note right now." and no
// Listen (reports-safety-hold-read-side).
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Glyph, Icon, Sheet, Speaker } from "../ui/index.ts";
import { parentApi, speakUrl, type ReportEvidence, type ReportOut } from "./api.ts";
import { fmtDay, fmtDayLong, fmtTime, HOME } from "./copy.ts";
import { PageState, ParentShell, RowLink, useChildren, useParentData } from "./Shell.tsx";

const KIND: Record<string, string> = {
  practice: "A practice question", taught: "Taught in the lesson", why: "Said why the answer works", teachback: "Explained it to a pretend friend",
  near_transfer: "A new kind of question on the same idea", far_transfer: "Used it in a different situation",
  error_spot: "Looked for a mistake in a pretend friend's work", predict: "Said what would happen first",
};
const RESULT: Record<ReportEvidence["evidence"][number]["result"], string> = {
  right: "Right", partly: "Partly right", not_yet: "Not yet", not_sure: "Said they didn't know yet", taught: "",
};
const RESULT_GLYPH = { right: "tick", partly: "half_tick", not_yet: "magnifier", not_sure: "magnifier", taught: null } as const;
const HELP: Record<string, string> = { none: "on their own", hint: "after a hint", asked_first: "asked for help first" };
const CHECKED: Record<string, string> = { code: "checked against the answer key", llm: "AI-checked against the book's key idea", human: "checked by a teacher" };

type Where = { id: string } | { cadence: string; period: string };

/** The rows behind one report line (also the home's Try at home line). */
export function ReportEvidenceSheet({ childId, claimId, at, onClose }: { childId: string; claimId: string | null; at: Where; onClose: () => void }) {
  return (
    <Sheet open={!!claimId} onClose={onClose} title="How do we know?">
      {claimId && <EvidenceBody childId={childId} claimId={claimId} at={at} />}
    </Sheet>
  );
}

function EvidenceBody({ childId, claimId, at }: { childId: string; claimId: string; at: Where }) {
  const { data, err, reload } = useParentData(() => parentApi.reportEvidence(childId, claimId, at), [childId, claimId, JSON.stringify(at)]);
  if (!data) return <PageState err={err} loading onRetry={reload} />;
  return (
    <div className="pa-ev">
      {data.lessons.length > 0 && (
        <ul className="pa-list pa-meta">{data.lessons.map((l) => <li key={l.id}>{fmtDayLong(l.startedAt)} · {fmtTime(l.startedAt)} · {l.topic}{l.minutes != null ? ` · ${l.minutes} min` : ""}</li>)}</ul>
      )}
      {data.evidence.length > 0 ? (
        <ol className="pa-ev-list" aria-label="The questions behind this line">
          {data.evidence.map((e) => {
            const g = RESULT_GLYPH[e.result];
            return (
              <li key={e.id} className="pa-ev-row">
                <span className="pa-ev-date">{fmtDay(e.at)}</span>
                <span className="pa-ev-what">{KIND[e.kind] ?? KIND.practice}{e.game ? " (in a game)" : ""}</span>
                <span className="pa-meta">{e.skill}</span>
                {e.result !== "taught" && (
                  <span className="pa-ev-verdict">
                    {g && <Glyph name={g} size={20} className="pa-ev-glyph" />}
                    <span>{RESULT[e.result]}</span><span className="pa-muted"> · {HELP[e.help]} · {CHECKED[e.checkedBy] ?? "checked"}</span>
                  </span>
                )}
                {e.matchesMixup && <span className="pa-meta">This answer fits the common mix-up.</span>}
              </li>
            );
          })}
        </ol>
      ) : <p className="pa-note">This line rests on the lessons above.</p>}
      {data.schedule.filter((s) => s.nextReview).map((s) => <p key={s.skill}><strong>Comes back on:</strong> {fmtDayLong(s.nextReview!)}</p>)}
      {data.claim.how?.en && <p className="pa-meta"><strong>How this line is counted:</strong> {data.claim.how.en}</p>}
    </div>
  );
}

function ReportView({ r, cid, onTap }: { r: ReportOut; cid: string; onTap: (claimId: string) => void }) {
  const R = r.renders.en;
  const header = R.lines.find((l) => l.section === "header");
  const body = R.lines.filter((l) => !["header", "footer"].includes(l.section));
  const foot = R.lines.filter((l) => l.section === "footer");
  return (
    <article className="pa-card pa-report" aria-labelledby="pa-report-h">
      <h2 id="pa-report-h" className="pa-report-title">{R.title}</h2>
      <p className="pa-meta">{r.cadence === "daily" ? fmtDayLong(r.days.first) : `${fmtDay(r.days.first)} to ${fmtDay(r.days.last)}`}
        {r.preview ? " · So far. It updates after the day ends." : ""}</p>
      {!r.preview && !r.held && R.voice && (
        <Speaker src={speakUrl({ what: "report", childId: cid, id: r.id })} label="Listen" className="speaker pa-listen"><span>Listen</span></Speaker>
      )}
      {header && <p className="pa-report-head">{header.text}</p>}
      <ul className="pa-report-lines">
        {body.map((l) => (
          <li key={l.key} className={`pa-report-line pa-report-${l.section}`}>
            <p>{l.text}</p>
            {l.kind === "claim" && l.claimId && (
              <button type="button" className="pa-how pa-textbtn" onClick={() => onTap(l.claimId!)}>How do we know? <Icon name="chevron" size={18} /></button>
            )}
          </li>
        ))}
      </ul>
      {foot.map((l) => <p key={l.key} className="pa-meta">{l.text}</p>)}
    </article>
  );
}

export default function Notes() {
  const { rid } = useParams();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const list = useParentData(current ? () => parentApi.reports(current.id) : null, [current?.id]);
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const stored = useParentData(current && rid ? () => parentApi.report(current.id, rid) : null, [current?.id, rid]);
  const preview = useParentData(current && !rid ? () => parentApi.reportPreview(current.id, tab) : null, [current?.id, rid, tab]);
  const [tap, setTap] = useState<string | null>(null);
  const r = rid ? stored.data?.report ?? null : preview.data?.report ?? null;
  const at: Where = r && !r.preview ? { id: r.id } : { cadence: tab, period: preview.data?.report?.period ?? "" };
  const held = !rid && (preview.data?.held || list.data?.held);
  return (
    <ParentShell title="Notes" child={current} kids={kids}>
      <h1 className="pa-h1">Notes</h1>
      <PageState err={list.err ?? stored.err ?? preview.err} loading={!list.data} onRetry={() => { list.reload(); preview.reload(); stored.reload(); }} />
      {list.data && (
        <div className="pa-stack">
          {!rid ? (
            <div className="pa-seg" role="tablist" aria-label="Which note">
              {(["daily", "weekly"] as const).map((c) => (
                <button key={c} type="button" role="tab" aria-selected={tab === c} className="pa-seg-btn" onClick={() => setTab(c)}>
                  {c === "daily" ? "Today" : "This week"}
                </button>
              ))}
            </div>
          ) : <RowLink to={`/parent/notes?c=${cid}`}>Today and this week</RowLink>}
          {r ? <ReportView r={r} cid={cid} onTap={setTap} />
            : (rid ? stored.data : preview.data) && (
              <p className="pa-note">{held ? HOME.held : tab === "daily" ? `No lesson yet today.` : "Nothing yet this week."}</p>
            )}
          <section className="pa-card" aria-labelledby="pa-earlier-h">
            <h2 id="pa-earlier-h" className="pa-card-title">Earlier notes</h2>
            {list.data.reports.length === 0 ? <p className="pa-muted">The first note is written after the first lesson day ends.</p> : (
              <ul className="pa-list">
                {list.data.reports.map((x) => (
                  <li key={x.id}><RowLink to={`/parent/notes/${x.id}?c=${cid}`}>{x.cadence === "daily" ? fmtDayLong(x.period) : x.period.replace(/^(\d{4})-W0?(\d{1,2})$/, "Week $2, $1")}</RowLink></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      {current && <ReportEvidenceSheet childId={cid} claimId={tap} at={at} onClose={() => setTap(null)} />}
    </ParentShell>
  );
}
