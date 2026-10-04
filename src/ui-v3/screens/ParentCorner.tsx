// Parent corner (DESIGN-V3 §11, screen 08). Day theme by default, English chrome, report language English or Hindi.
// One capability this week with "How do we know?" evidence, a 5-minute home task, what was made and WHY, lesson times with
// a working reschedule (14-day strip + time grid: clash / past / outside-lesson-hours disabled with the reason; no native
// pickers, R11), limits, what the child was curious about (learning questions only: diversions are not reported, safety
// events go through the safety channel, owner §9 O-R3), and safety in plain words with the helplines digit-exact.
import { useMemo, useState } from "react";
import { Brand, Icon, type IconName } from "../Icon.tsx";
import { Button, Segmented, Stepper, Switch, VerdictMark } from "../primitives.tsx";
import { DateStrip, TimeGrid } from "../Scheduler.tsx";
import { pushToast } from "../toast.ts";
import {
  dateStrip, DAY_LONG, DAY_SHORT, dayOfMonth, fmtTime, fmtTimeCompact, monthIndex, MONTH_LONG, moveSummary, timeGrid, weekday,
} from "../schedule.ts";
import { Thumb } from "./common.tsx";
import type { ParentData } from "./types.ts";

/** Candidate starts in the grid: mornings for weekends and holidays, then every 30 min across the after-school window (4 rows of 4). */
const PARENT_TIMES = [7, 9, 11, 13, 15, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21].map((h) => h * 60);

const NAV: Array<{ id: string; label: string; icon: IconName }> = [
  { id: "week", label: "This week", icon: "home" },
  { id: "progress", label: "Progress", icon: "map" },
  { id: "lessons", label: "Lessons", icon: "cal" },
  { id: "controls", label: "Controls", icon: "gear" },
];

export function ParentCorner({ data, initialEdit, onLock, onNav }: { data: ParentData; initialEdit?: number; onLock?: () => void; onNav?: (id: string) => void }) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [lessons, setLessons] = useState(data.lessons);
  const [moved, setMoved] = useState<string | null>(null);
  const [limits, setLimits] = useState(data.limits);
  const [editing, setEditing] = useState<number | null>(initialEdit ?? null);
  const [pickD, setPickD] = useState<string | null>(initialEdit != null ? data.lessons[initialEdit]?.date ?? null : null);
  const [pickT, setPickT] = useState<number | null>(initialEdit != null ? data.lessons[initialEdit]?.start ?? null : null);
  const pr = data.pronoun === "he" ? "his" : data.pronoun === "she" ? "her" : "their";
  const head = data.headline[lang];

  const moving = editing != null ? lessons[editing] : null;
  const strip = useMemo(() => dateStrip({ today: data.today, lessons, moving }), [data.today, lessons, moving]);
  const grid = useMemo(() => (moving && pickD ? timeGrid({
    date: pickD, today: data.today, nowMin: data.nowMin, hours: { start: limits.hoursStart, end: limits.hoursEnd },
    length: moving.length, lessons, moving, options: PARENT_TIMES,
  }) : []), [moving, pickD, data.today, data.nowMin, limits.hoursStart, limits.hoursEnd, lessons]);
  const sum = moveSummary(pickD, pickT, grid, data.childName);

  const startEdit = (i: number) => { setEditing(i); setPickD(lessons[i].date); setPickT(lessons[i].start); };
  const save = () => {
    if (editing == null || !sum.ok || !pickD || pickT == null) return;
    const id = lessons[editing].id;
    setLessons((ls) => ls.map((l, i) => (i === editing ? { ...l, date: pickD, start: pickT } : l)));
    setMoved(id);
    setEditing(null);
    pushToast("saved", `Moved to ${DAY_SHORT[weekday(pickD)]} ${dayOfMonth(pickD)} · ${fmtTime(pickT)}`);
  };

  return (
    <div className="v3-pc">
      <nav className="v3-pc-nav" aria-label="Parent corner">
        <div className="v3-pc-brand"><Brand /></div>
        {NAV.map((n, i) => <a key={n.id} href={`#${n.id}`} aria-current={i === 0 ? "page" : undefined} onClick={(e) => { if (onNav) { e.preventDefault(); onNav(n.id); } }}><Icon name={n.icon} />{n.label}</a>)}
        <a href="#help"><Icon name="shield" />Help and safety</a>
        <span className="v3-grow" />
        <button type="button" className="v3-pc-lock" onClick={onLock}><Icon name="lock" />Lock parent corner</button>
      </nav>
      <main className="v3-pc-main">
        <header className="v3-pc-top">
          <span className="v3-kid"><span className="v3-kid-av" aria-hidden="true">{data.childName.slice(0, 1)}</span>{data.childName}<small>{data.classLine}</small></span>
          <Segmented label="Report language" value={lang} onChange={setLang} className="v3-pc-lang" options={[{ value: "en", label: "English" }, { value: "hi", label: <span className="deva" lang="hi">हिंदी</span>, aria: "Hindi" }]} />
        </header>

        <div className="v3-pc-grid">
          <div className="v3-col">
            <section className="v3-card" aria-labelledby="v3-pc-week">
              <div className="v3-pc-week">
                <div className="v3-eyebrow">{data.weekOf}</div>
                <h1 id="v3-pc-week" className={`v3-pc-head${lang === "hi" ? " deva" : ""}`} lang={lang === "hi" ? "hi" : "en"}>{head.before}<em>{head.em}</em>{head.after}</h1>
                <dl className="v3-facts">{data.facts.map((f) => <div key={f.label} className="v3-fact"><dd>{f.value}</dd><dt>{f.label}</dt></div>)}</dl>
              </div>
              {data.claims.map((c, i) => (
                <div key={i} className="v3-claim">
                  <div className="v3-claim-row">
                    <VerdictMark verdict={c.verdict} size={28} />
                    <div><b>{c.title}</b><p>{c.detail}</p></div>
                    <button type="button" className="v3-how" aria-expanded={!!open[i]} aria-controls={`v3-ev-${i}`} onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>{open[i] ? "Hide" : "How do we know?"}</button>
                  </div>
                  {open[i] && (
                    <div className="v3-claim-ev" id={`v3-ev-${i}`}>
                      <dl>{c.evidence.map((e) => <div key={e.at + e.text} className="v3-claim-evrow"><dt>{e.at}</dt><dd>{e.text}</dd></div>)}</dl>
                      {c.words && <p>In {pr} words: <q>{c.words}</q></p>}
                      {c.note && <p>{c.note}</p>}
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className="v3-card v3-hometask">
              <div className="v3-eyebrow">Try at home · 5 minutes</div>
              <h2 className="v3-h3">{data.homeTask.title}</h2>
              <p>{data.homeTask.body}</p>
            </section>

            <section className="v3-card">
              <div className="v3-pc-pad"><div className="v3-sechead"><h2 className="v3-h3">Made for {data.childName} this week</h2><span className="v3-eyebrow">{data.made.length} pieces</span></div></div>
              {data.made.map((m) => (
                <div key={m.id} className="v3-pc-made"><span className="v3-pc-thumb"><Thumb kind={m.thumb} /></span><div><b>{m.title}</b><p>{m.why}</p></div></div>
              ))}
            </section>
          </div>

          <div className="v3-col">
            <section className="v3-card v3-pc-pad" aria-labelledby="v3-pc-times">
              <div className="v3-sechead"><h2 className="v3-h3" id="v3-pc-times">Lesson times</h2><span className="v3-eyebrow">IST</span></div>
              <ul className="v3-slots">
                {lessons.map((l, i) => (
                  <li key={l.id} className={`v3-slotrow${moved === l.id ? " is-moved" : ""}`}>
                    <span className="v3-slotrow-d">{DAY_SHORT[weekday(l.date)]}<b>{dayOfMonth(l.date)}</b></span>
                    <span className="v3-slotrow-w">{fmtTime(l.start)} · {l.length} min<small>{l.subject} · {l.topic}</small></span>
                    <button type="button" className="v3-link" aria-label={`Move ${DAY_LONG[weekday(l.date)]}'s lesson`} aria-expanded={editing === i} onClick={() => (editing === i ? setEditing(null) : startEdit(i))}>Move</button>
                  </li>
                ))}
              </ul>
              {moving && (
                <div className="v3-editor" role="region" aria-label={`Move ${DAY_LONG[weekday(moving.date)]}'s lesson`}>
                  <div className="v3-label-row v3-label-row--tight"><span className="v3-label">Move {DAY_LONG[weekday(moving.date)]}'s lesson to</span><span className="v3-label">{pickD ? MONTH_LONG[monthIndex(pickD)] : ""}</span></div>
                  <DateStrip days={strip} value={pickD} onChange={(iso) => { setPickD(iso); }} label="Date" />
                  <div className="v3-label-row v3-label-row--tight"><span className="v3-label">Time</span><span className="v3-label">Struck out = unavailable</span></div>
                  <TimeGrid options={grid} value={pickT} onChange={setPickT} cols={4} />
                  <div className="v3-confirm">
                    <span aria-live="polite">{sum.ok ? <b>{sum.text}</b> : sum.text}</span>
                    <span className="v3-row-8">
                      <Button variant="quiet" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button variant="ink" disabled={!sum.ok} onClick={save}>Move lesson</Button>
                    </span>
                  </div>
                </div>
              )}
            </section>

            <section className="v3-card v3-pc-pad" aria-labelledby="v3-pc-limits">
              <div className="v3-sechead"><h2 className="v3-h3" id="v3-pc-limits">Limits</h2></div>
              <div className="v3-lims">
                <div className="v3-lim"><div><b>Daily limit</b><p>{data.teacher.name} wraps up warmly when it's reached. She never just cuts off.</p></div>
                  <Stepper label="Daily limit" value={limits.dailyMin} min={15} max={120} step={15} format={(v) => `${v} min`} onChange={(v) => setLimits((l) => ({ ...l, dailyMin: v }))} /></div>
                <div className="v3-lim"><div><b>Lesson hours</b><p>No lessons outside these times. Times above follow it.</p></div>
                  <Stepper label="Lesson hours end" lessLabel="Earlier" moreLabel="Later" value={limits.hoursEnd} min={18 * 60} max={22 * 60} step={30} format={(v) => `until ${fmtTimeCompact(v)}`} onChange={(v) => setLimits((l) => ({ ...l, hoursEnd: v }))} /></div>
                <div className="v3-lim"><div><b>Open mic (hands-free)</b><p>Only during lessons. Audio is never stored.</p></div>
                  <Switch label="Open mic" checked={limits.openMic} onChange={(v) => setLimits((l) => ({ ...l, openMic: v }))} /></div>
                <div className="v3-lim"><div><b>Lesson reminder on {pr} phone</b><p>A neutral alert 10 min before. Never guilt.</p></div>
                  <Switch label="Lesson reminder" checked={limits.reminder} onChange={(v) => setLimits((l) => ({ ...l, reminder: v }))} /></div>
              </div>
            </section>

            <section className="v3-card v3-pc-pad">
              <div className="v3-sechead"><h2 className="v3-h3">What {data.pronoun === "they" ? "they were" : `${data.pronoun} was`} curious about</h2></div>
              <ul className="v3-asked">{data.curious.map((q) => <li key={q.text}><span>{q.text}</span><small>{q.when}</small></li>)}</ul>
            </section>

            <section className="v3-card v3-safety" aria-labelledby="v3-pc-safety">
              <h2 className="v3-h3" id="v3-pc-safety">Safety, plainly</h2>
              <p><Icon name="shield" /><span><b>{data.teacher.name} is an AI teacher</b> and says so whenever asked. Never a friend or a romantic role.</span></p>
              <p><Icon name="bell" /><span><b>If {data.childName} says something worrying</b>, {data.teacher.name} responds calmly, shares Childline 1098 and Tele-MANAS 14416, and we alert you at once without naming the topic on your lock screen.</span></p>
              <p><Icon name="lock" /><span><b>You see learning, not a recording.</b> A transcript opens only on request, after your PIN.</span></p>
            </section>
          </div>
        </div>
        <nav className="v3-tabbar v3-pc-tabs" aria-label="Parent corner sections">
          {NAV.map((n, i) => <a key={n.id} href={`#${n.id}`} aria-current={i === 0 ? "page" : undefined}><Icon name={n.icon} size={22} />{n.label}</a>)}
        </nav>
      </main>
    </div>
  );
}
