// Parent reports (server/reports/**; PARENT-REPORT.md §9.1-§9.3): the daily note (pull-only, X11) and the weekly
// letter, in English, Hinglish or Hindi. Every claim line taps through to "Kaise pata?": the ledger rows behind
// that line (date, what kind of check, the result, help used, who checked it), re-read on the server. Before the
// night job has written today's note, "so far" shows a preview built the same way (no model, never stored).
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Icon, Sheet, Speaker } from "../ui/index.ts";
import { parentApi, speakUrl, type ReportLang, type ReportOut } from "./api.ts";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";
import { fmtDay, fmtDayLong, fmtTime } from "./words.ts";

const LANG_NAME: Record<ReportLang, string> = { en: "English", hinglish: "Hinglish", hi: "हिंदी" };
const T = {
  how: { en: "Kaise pata? How we know", hinglish: "Kaise pata?", hi: "कैसे पता?" },
  tap: { en: "Kaise pata?", hinglish: "Kaise pata?", hi: "कैसे पता?" },
  rows: { en: "The questions and lessons for this line", hinglish: "Is line ke sawaal aur lesson", hi: "इस लाइन के सवाल और पाठ" },
  next: { en: "Comes back on", hinglish: "Phir aayega", hi: "फिर आएगा" },
  rule: { en: "How this line is counted", hinglish: "Yeh line kaise ginti hoti hai", hi: "यह लाइन कैसे गिनी जाती है" },
  so_far: { en: "So far (updates after the day ends)", hinglish: "Ab tak (din khatam hone ke baad update hoga)", hi: "अब तक (दिन ख़त्म होने के बाद अपडेट होगा)" },
  listen: { en: "Listen", hinglish: "Suno", hi: "सुनिए" },
  mixup: { en: "this answer fits the common mix-up", hinglish: "yeh jawab aam confusion se milta hai", hi: "यह जवाब आम उलझन से मिलता है" },
  held: { en: "No new note right now.", hinglish: "Abhi koi naya note nahi.", hi: "अभी कोई नया नोट नहीं।" },
} as const;
const KIND: Record<string, Record<ReportLang, string>> = {
  practice: { en: "A practice question", hinglish: "Ek practice sawaal", hi: "एक अभ्यास सवाल" },
  taught: { en: "Taxila taught it", hinglish: "Taxila ne sikhaya", hi: "Taxila ने सिखाया" },
  why: { en: "Said why the answer works", hinglish: "Bataya ki jawab kyon sahi hai", hi: "बताया कि जवाब क्यों सही है" },
  teachback: { en: "Explained it to a pretend friend", hinglish: "Ek pretend dost ko samjhaya", hi: "एक नक़ली दोस्त को समझाया" },
  near_transfer: { en: "A new kind of question on the same idea", hinglish: "Usi idea par naye tarah ka sawaal", hi: "उसी बात पर नए तरह का सवाल" },
  far_transfer: { en: "Used it in a different situation", hinglish: "Alag situation mein lagaya", hi: "अलग स्थिति में लगाया" },
  error_spot: { en: "Looked for a mistake in a pretend friend's work", hinglish: "Pretend dost ki galti dhoondhi", hi: "नक़ली दोस्त की ग़लती ढूँढी" },
  predict: { en: "Said what would happen first", hinglish: "Pehle bataya kya hoga", hi: "पहले बताया क्या होगा" },
};
const RESULT: Record<string, Record<ReportLang, string>> = {
  right: { en: "Right", hinglish: "Sahi", hi: "सही" }, partly: { en: "Partly right", hinglish: "Thoda sahi", hi: "थोड़ा सही" },
  not_yet: { en: "Not right this time", hinglish: "Is baar sahi nahi", hi: "इस बार सही नहीं" }, not_sure: { en: "Said they did not know yet", hinglish: "Bataya ki abhi pata nahi", hi: "बताया कि अभी पता नहीं" },
  taught: { en: "—", hinglish: "—", hi: "—" },
};
const HELP: Record<string, Record<ReportLang, string>> = {
  none: { en: "no hint", hinglish: "bina hint", hi: "बिना संकेत" },
  hint: { en: "after a hint", hinglish: "hint ke baad", hi: "संकेत के बाद" },
  asked_first: { en: "asked for help first", hinglish: "pehle madad maangi", hi: "पहले मदद माँगी" },
};
const CHECKED: Record<string, Record<ReportLang, string>> = {
  code: { en: "checked against the answer key", hinglish: "answer key se milaya", hi: "उत्तर कुंजी से मिलाया" },
  llm: { en: "AI-checked against the book's key idea", hinglish: "AI ne book ke main idea se milaya", hi: "AI ने किताब की मुख्य बात से मिलाया" },
  human: { en: "checked by a teacher", hinglish: "teacher ne dekha", hi: "शिक्षक ने देखा" },
};

type Where = { id: string } | { cadence: string; period: string };
/** A text-styled button (src/styles is another workstream's: no new CSS classes from this file). */
const TAP_STYLE = { background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" } as const;

function EvidenceDrawer({ childId, claimId, at, lang, onClose }: { childId: string; claimId: string | null; at: Where; lang: ReportLang; onClose: () => void }) {
  return (
    <Sheet open={!!claimId} onClose={onClose} title={T.how[lang]}>
      {claimId && <EvidenceBody childId={childId} claimId={claimId} at={at} lang={lang} />}
    </Sheet>
  );
}

function EvidenceBody({ childId, claimId, at, lang }: { childId: string; claimId: string; at: Where; lang: ReportLang }) {
  const { data, err } = useParentData(() => parentApi.reportEvidence(childId, claimId, at), [childId, claimId, JSON.stringify(at)]);
  if (!data) return <PageState err={err} loading />;
  return (
    <div className="stack ev-sheet">
      {data.lessons.length > 0 && (
        <ul className="plain-list">{data.lessons.map((l) => <li key={l.id}>{fmtDayLong(l.startedAt)} · {fmtTime(l.startedAt)} · {l.topic}{l.minutes != null ? ` · ${l.minutes} min` : ""}</li>)}</ul>
      )}
      {data.evidence.length > 0 && (
        <>
          <h3 className="t-h3">{T.rows[lang]}</h3>
          <ol className="ev-list">
            {data.evidence.map((e) => (
              <li key={e.id}>
                <span className="ev-date">{fmtDay(e.at)} · {fmtTime(e.at)}</span>
                <span className="ev-what">{(KIND[e.kind] ?? KIND.practice)[lang]}{e.game ? " (game)" : ""}</span>
                <span className="muted">{e.skill}</span>
                {e.result !== "taught" && <span>{RESULT[e.result][lang]} · <span className="muted">{HELP[e.help][lang]} · {CHECKED[e.checkedBy]?.[lang] ?? e.checkedBy}</span></span>}
                {e.matchesMixup && <span className="t-note">{T.mixup[lang]}</span>}
              </li>
            ))}
          </ol>
        </>
      )}
      {data.schedule.filter((s) => s.nextReview).map((s) => <p key={s.skill}><strong>{T.next[lang]}:</strong> {fmtDayLong(s.nextReview!)}</p>)}
      {data.claim.how && <details><summary className="t-meta">{T.rule[lang]}</summary><p className="t-meta">{data.claim.how[lang]}</p></details>}
    </div>
  );
}

function ReportView({ r, lang, cid, onTap }: { r: ReportOut; lang: ReportLang; cid: string; onTap: (claimId: string) => void }) {
  const R = r.renders[lang];
  const header = R.lines.find((l) => l.section === "header");
  const body = R.lines.filter((l) => !["header", "footer"].includes(l.section));
  const foot = R.lines.filter((l) => l.section === "footer");
  return (
    <Card title={R.title}>
      <p className="t-meta">{r.cadence === "daily" ? fmtDayLong(r.days.first) : `${fmtDay(r.days.first)} – ${fmtDay(r.days.last)}`}
        {r.preview ? ` · ${T.so_far[lang]}` : ""}</p>
      {!r.preview && !r.held && R.voice && (
        <Speaker src={speakUrl({ what: "report", childId: cid, id: r.id, lang })} label={T.listen[lang]} className="speaker speaker-wide"><span>{T.listen[lang]}</span></Speaker>
      )}
      {header && <p><strong>{header.text}</strong></p>}
      <ul className="report-lines stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {body.map((l) => (
          <li key={l.key} className={`report-line report-${l.section}`}>
            <p>{l.text}</p>
            {l.kind === "claim" && l.claimId && (
              <button type="button" className="kaise" style={TAP_STYLE} onClick={() => onTap(l.claimId!)}>{T.tap[lang]} <Icon name="chevron" size={18} /></button>
            )}
          </li>
        ))}
      </ul>
      {foot.map((l) => <p key={l.key} className="t-note">{l.text}</p>)}
    </Card>
  );
}

export default function Reports() {
  const nav = useNavigate();
  const { rid } = useParams();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const list = useParentData(current ? () => parentApi.reports(current.id) : null, [current?.id]);
  const [langPick, setLang] = useState<ReportLang | null>(null);
  const lang: ReportLang = langPick ?? list.data?.lang ?? "en";
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const stored = useParentData(current && rid ? () => parentApi.report(current.id, rid) : null, [current?.id, rid]);
  const preview = useParentData(current && !rid ? () => parentApi.reportPreview(current.id, tab) : null, [current?.id, rid, tab]);
  const [tap, setTap] = useState<string | null>(null);
  const r = rid ? stored.data?.report ?? null : preview.data?.report ?? null;
  const at: Where = r && !r.preview ? { id: r.id } : { cadence: tab, period: preview.data?.report?.period ?? "" };

  return (
    <ParentShell title="Reports" child={current} kids={kids} onSwitch={(id) => nav(`/parent/${id}/reports`)}>
      <PageState err={list.err ?? stored.err ?? preview.err} loading={!list.data} />
      {list.data && (
        <div className="pc-grid">
          <div className="stack">
            <div className="row" role="group" aria-label="Language">
              {list.data.langs.map((l) => (
                <button key={l} type="button" className={`btn btn-sm ${l === lang ? "btn-primary" : "btn-secondary"}`} aria-pressed={l === lang} onClick={() => setLang(l)}>{LANG_NAME[l]}</button>
              ))}
            </div>
            {!rid && (
              <div className="row" role="tablist" aria-label="Report">
                {(["daily", "weekly"] as const).map((c) => (
                  <button key={c} type="button" role="tab" aria-selected={tab === c} className={`btn btn-sm ${tab === c ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab(c)}>
                    {c === "daily" ? "Today" : "This week"}
                  </button>
                ))}
              </div>
            )}
            {r ? <ReportView r={r} lang={lang} cid={cid} onTap={setTap} />
              : (rid ? stored.data : preview.data) && <p className="note">{!rid && (preview.data?.held || list.data.held) ? T.held[lang] : tab === "daily" ? "No lesson yet today." : "Nothing yet this week."}</p>}
          </div>
          <aside className="stack pc-side" aria-label="Earlier reports">
            <Card title="Earlier notes">
              {list.data.reports.length === 0 ? <p className="muted">The first note is written after the first lesson day ends.</p> : (
                <ul className="link-list">
                  {list.data.reports.map((x) => (
                    <li key={x.id}><Link to={`/parent/${cid}/reports/${x.id}`}>{x.cadence === "daily" ? fmtDayLong(x.period) : `Week ${x.period.slice(-2)}`} <Icon name="chevron" size={18} /></Link></li>
                  ))}
                </ul>
              )}
              {rid && <Link to={`/parent/${cid}/reports`}>Today and this week</Link>}
            </Card>
          </aside>
        </div>
      )}
      {current && <EvidenceDrawer childId={cid} claimId={tap} at={at} lang={lang} onClose={() => setTap(null)} />}
    </ParentShell>
  );
}
