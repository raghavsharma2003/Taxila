// "Where is school?" and "What does school teach which day?" (round 7 F items 1-2; dc-r7 D6: the day's subject comes from
// the parent's timetable first). Two controls, used in set-up (ChildStep: the maths chapter only) and in the Parent
// corner's Progress (every subject, and the week):
//   <ChapterPicker>    a subject's chapters as numbered chips; the chosen chapter's title under them; "Not sure" clears it
//   <TimetableEditor>  Monday-Saturday rows of subject toggles; Sunday off by default
//   <SchoolCard>       both, wired to /api/parent/school, /school-chapter and /timetable
// The custom controls only (no native select or picker, OWNER-RESET #11), styled by ../ui-v3/scheduler.css.
import { useEffect, useState } from "react";
import { Button } from "../ui/index.ts";
import "../ui-v3/scheduler.css";
import { isRelock, parentApi, type ChapterRef, type ParentView, type PlacementNote, type PlacementSummary, type SchoolOut } from "./api.ts";
import { parentError, SUBJECT_NAME } from "./copy.ts";

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT: Record<string, string> = { maths: "MATH", science: "SCI", evs: "EVS", english: "ENG", hindi: "HIN", sst: "SST" };
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ChapterPicker({ subject, chapters, value, onChange }: { subject: string; chapters: ChapterRef[]; value: number | null; onChange: (n: number | null) => void }) {
  const cur = chapters.find((c) => c.number === value) ?? null;
  const name = SUBJECT_NAME[subject] ?? subject;
  return (
    <div className="sch pa-school-subj" data-testid={`chapter-picker-${subject}`}>
      <div className="sch-label-row"><span className="sch-label">{name}</span>
        <button type="button" className="sch-textbtn" aria-pressed={value == null} onClick={() => onChange(null)}>Not sure</button></div>
      <div className="sch-choices" role="radiogroup" aria-label={`${name}: the chapter school is on`}>
        {chapters.map((c) => (
          <button key={c.number} type="button" role="radio" aria-checked={c.number === value} className="sch-chip pa-chapter-chip"
            aria-label={`Chapter ${c.number}, ${c.title}`} onClick={() => onChange(c.number)}>{c.number}</button>
        ))}
      </div>
      <p className="pa-effect" aria-live="polite">{cur ? `Chapter ${cur.number} · ${cur.title}` : "Not set: lessons start from where the school year usually is."}</p>
    </div>
  );
}

export function TimetableEditor({ subjects, value, onChange }: { subjects: string[]; value: Record<string, string[]>; onChange: (v: Record<string, string[]>) => void }) {
  const toggle = (wd: number, s: string) => {
    const cur = value[wd] ?? [];
    onChange({ ...value, [wd]: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  };
  return (
    <div className="sch pa-timetable" data-testid="timetable">
      {WEEK.map((wd) => (
        <div key={wd} className="pa-tt-row" role="group" aria-label={DAY_LONG[wd]}>
          <span className="sch-label pa-tt-day">{DAY[wd]}</span>
          <div className="pa-tt-subjects" style={{ gridTemplateColumns: `repeat(${subjects.length}, minmax(0, 1fr))` }}>
            {subjects.map((s) => (
              <button key={s} type="button" className="sch-chip pa-tt-chip" aria-pressed={(value[wd] ?? []).includes(s)} aria-label={`${SUBJECT_NAME[s] ?? s} on ${DAY_LONG[wd]}`}
                onClick={() => toggle(wd, s)}>{SHORT[s] ?? s}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const FEEL: { v: ParentView; label: string }[] = [{ v: "hard", label: "Hard" }, { v: "fine", label: "About right" }, { v: "easy", label: "Easy" }];

/**
 * Round 7 F cold start: "How does {subject} feel for {name}?" per subject (the parent's view; server/placement/coldstart.js).
 * Chips, not a test: the answer only sets where lessons begin, and lessons move it on their own. "Not sure" clears it.
 */
export function FeelPicker({ subject, name, value, onChange }: { subject: string; name: string; value: ParentView | null; onChange: (v: ParentView) => void }) {
  const label = SUBJECT_NAME[subject] ?? subject;
  return (
    <div className="sch pa-school-subj" data-testid={`feel-picker-${subject}`}>
      <div className="sch-label-row"><span className="sch-label">{`${label} for ${name}`}</span>
        <button type="button" className="sch-textbtn" aria-pressed={value == null} onClick={() => onChange("unsure")}>Not sure</button></div>
      <div className="sch-choices" role="radiogroup" aria-label={`How ${label} feels for ${name}`}>
        {FEEL.map((f) => (
          <button key={f.v} type="button" role="radio" aria-checked={value === f.v} className="sch-chip" onClick={() => onChange(f.v)}>{f.label}</button>
        ))}
      </div>
    </div>
  );
}

/** The parent's current view per subject, read back from the checked note's lines (place.parent_<view>). */
const viewsOf = (note: PlacementNote | null): Record<string, ParentView> => Object.fromEntries((note?.lines.en ?? [])
  .filter((l) => l.subject && l.shapeId.startsWith("place.parent_")).map((l) => [l.subject as string, l.shapeId.slice("place.parent_".length) as ParentView]));

/** The Progress card: where school is per subject, and the week's timetable. */
export function SchoolCard({ childId, name, onRelock }: { childId: string; name: string; onRelock: () => void }) {
  const [d, setD] = useState<SchoolOut | null>(null);
  const [tt, setTt] = useState<Record<string, string[]>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, PlacementSummary>>({});
  useEffect(() => { parentApi.placement(childId).then((r) => setPlaced(r.results), () => setPlaced({})); }, [childId]);
  const [note, setNote] = useState<PlacementNote | null>(null);
  useEffect(() => { parentApi.placementNote(childId).then((r) => setNote(r.note), () => setNote(null)); }, [childId]);
  const setFeel = async (subject: string, v: ParentView) => {
    setErr(null);
    try { const r = await parentApi.setParentView(childId, { [subject]: v }); setNote(r.note); } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setErr(parentError(e));
    }
  };
  const rounds = Object.values(placed).filter((p) => p.chapter && p.source !== "onboarding");
  const feel = viewsOf(note);
  useEffect(() => {
    setD(null);
    parentApi.school(childId).then((r) => { setD(r); setTt(r.timetable); setDirty(false); }, (e) => { if (isRelock(e)) onRelock(); else setErr(parentError(e)); });
  }, [childId, onRelock]);
  const setChapter = async (subject: string, n: number | null) => {
    if (!d) return;
    setErr(null);
    const was = d.pointer;
    const next = { ...d.pointer };
    if (n == null) delete next[subject]; else next[subject] = n;
    setD({ ...d, pointer: next });
    try { const r = await parentApi.setSchoolChapter(childId, subject, n); setD((x) => (x ? { ...x, pointer: r.pointer } : x)); } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setD((x) => (x ? { ...x, pointer: was } : x)); setErr(parentError(e));
    }
  };
  const saveTt = async () => {
    setBusy(true); setErr(null);
    try {
      const days = Object.fromEntries(WEEK.map((wd) => [String(wd), tt[wd] ?? []]));
      const r = await parentApi.setTimetable(childId, days);
      setTt(r.timetable); setDirty(false); setSaved(true);
    } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setErr(parentError(e));
    } finally { setBusy(false); }
  };
  if (!d) return err ? <p className="pa-form-err" role="alert">{err}</p> : null;
  const subjects = Object.keys(d.chapters);
  return (
    <section className="pa-card pa-school" aria-labelledby="pa-school-h" data-testid="school-card">
      <h2 id="pa-school-h" className="pa-h2">School</h2>
      <p className="pa-effect">{`Where ${name}'s class is now. The next lesson in that subject starts there.`}</p>
      {note && note.lines.en.length > 0 && (
        <div className="pa-note" data-testid="placement-note">
          <p><strong>Where {name} begins</strong></p>
          {note.lines.en.map((l) => <p key={l.id}>{l.text}</p>)}
        </div>
      )}
      {rounds.length > 0 && (
        <div className="pa-note" data-testid="placement-start">
          <p><strong>Where {name} is starting</strong></p>
          {rounds.map((p) => (
            <p key={p.subject}>{`${SUBJECT_NAME[p.subject] ?? p.subject}: chapter ${p.chapter!.number} · ${p.chapter!.title}, from ${name}'s warm-up round.`}{p.subject in (d.pointer ?? {}) ? " The school's chapter you set below comes first." : ""}</p>
          ))}
        </div>
      )}
      {subjects.map((s) => <ChapterPicker key={s} subject={s} chapters={d.chapters[s]} value={d.pointer[s] ?? null} onChange={(n) => void setChapter(s, n)} />)}
      <h3 className="pa-h3">How each subject feels</h3>
      <p className="pa-effect">{`Your sense of each subject sets where ${name}'s lessons begin. Lessons then move it on their own.`}</p>
      {subjects.map((s) => <FeelPicker key={`feel-${s}`} subject={s} name={name} value={feel[s] ?? null} onChange={(v) => void setFeel(s, v)} />)}
      <h3 className="pa-h3">Timetable</h3>
      <p className="pa-effect">{`What school teaches each day. Each lesson follows the day's subjects; with none set, ${name}'s subjects take turns.`}</p>
      <TimetableEditor subjects={subjects} value={tt} onChange={(v) => { setTt(v); setDirty(true); setSaved(false); }} />
      {(dirty || saved) && (
        <div className="pa-group-save">
          {dirty ? <Button onClick={() => void saveTt()} disabled={busy}>{busy ? "Saving" : "Save timetable"}</Button> : <p className="pa-row" role="status">Saved</p>}
        </div>
      )}
      {err && <p className="pa-form-err" role="alert">{err}</p>}
    </section>
  );
}
