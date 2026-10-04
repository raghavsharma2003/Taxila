// Controls (PRODUCT-DESIGN-V2 §6.5.4), per child: grouped cards, each control with a label and its one-line effect.
// Save sits INLINE at the end of each changed group; there is no floating save bar (audit #19: a floating Save plus the
// tab bar took about 120 px of a 640 px screen). Only controls the server stores are shown (P6: only what works).
import { useEffect, useState, type ReactNode } from "react";
import { Button, Icon, TileGroup } from "../ui/index.ts";
import { getJson, postJson, refreshMe, request, type ChildRow } from "../app/api.ts";
import { HoursFields } from "../onboarding/Setup.tsx";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { bandForClass } from "../app/band.ts";
import { isRelock, parentApi, type ControlsT } from "./api.ts";
import { fmtClock, parentError } from "./copy.ts";
import { useGate } from "./Gate.tsx";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";
import { ParentTeacherName } from "../child/teacher/ParentTeacherName.tsx";
import { readPrefs, setChildPref } from "../child/prefs.ts";
import { subjectWords, tw, tw2 } from "../copy/en.ts";

/**
 * "Open now for 1 hour" (W1-A item 2; smooth G8): one tap opens the child's lesson hours for the next hour, today only,
 * without changing the saved hours (POST /api/lesson/open-now). The daily limit still holds.
 */
function OpenNow({ childId, name, onRelock }: { childId: string; name: string; onRelock: () => void }) {
  const [busy, setBusy] = useState(false);
  const [until, setUntil] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const open = async () => {
    setBusy(true); setErr(null);
    try {
      const out = await postJson<{ openUntil: string }>("/api/lesson/open-now", { childId });
      setUntil(out.openUntil);
    } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setErr(parentError(e));
    } finally { setBusy(false); }
  };
  const at = until ? new Date(until).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : null;
  return (
    <div className="pa-control" data-testid="open-now">
      <h3 className="pa-h3">{tw("controls.open.title")}</h3>
      <Button onClick={open} disabled={busy} data-testid="open-now-button">{busy ? tw("controls.open.busy") : tw("controls.open.button")}</Button>
      <p className="pa-effect">{at ? <span role="status">{tw("controls.open.done", { time: at })}</span> : tw("controls.open.effect")}</p>
      {err && <p className="pa-form-err" role="alert" aria-label={`Open lessons for ${name}`}>{err}</p>}
    </div>
  );
}

/**
 * "Tap and type only" (flows G8; W2-A): a per-CHILD setting the server keeps (child_controls.text_only, returned with the
 * child's plan), so the parent's phone and the child's phone agree. This device's prefs.quiet is kept in step too.
 */
function TapAndType({ childId, name, T, on0, onRelock }: { childId: string; name: string; T: string; on0: boolean; onRelock: () => void }) {
  const [on, setOn] = useState(on0 || readPrefs(childId).quiet);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setOn(on0 || readPrefs(childId).quiet), [childId, on0]);
  const set = async (next: boolean) => {
    setErr(null);
    const was = on;
    setOn(next);
    setChildPref(childId, { quiet: next });
    try { await parentApi.setControls(childId, { textOnly: next }); } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setOn(was); setChildPref(childId, { quiet: was }); setErr(parentError(e));
    }
  };
  return (
    <section className="pa-card pa-group" aria-labelledby="pa-g-type" data-group="type">
      <h2 id="pa-g-type" className="pa-h2">{tw("controls.type.title")}</h2>
      <div className="pa-control">
        <TileGroup label={tw("controls.type.title")} columns={2} value={on ? "on" : "off"} onChange={(v) => void set(v === "on")}
          options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
        <p className="pa-effect">{on ? tw("controls.type.on", { name, T }).replace(/^On this phone, /, "") : tw("controls.type.off", { name, T })} {tw2("controls.type.child", { name })}</p>
        {err && <p className="pa-form-err" role="alert">{err}</p>}
      </div>
    </section>
  );
}

/** "Homework help today" (STUDENT-FLOW §4.2 `homework`): the child's home leads with Homework help until the day ends. */
function HomeworkToday({ childId, name, on0, onRelock }: { childId: string; name: string; on0: boolean; onRelock: () => void }) {
  const [on, setOn] = useState(on0);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setOn(on0), [childId, on0]);
  const set = async (next: boolean) => {
    setErr(null);
    const was = on;
    setOn(next);
    try { await parentApi.setControls(childId, { homeworkToday: next }); } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setOn(was); setErr(parentError(e));
    }
  };
  return (
    <div className="pa-control" data-testid="homework-today">
      <h3 className="pa-h3">{tw2("controls.homework.title")}</h3>
      <TileGroup label={tw2("controls.homework.title")} columns={2} value={on ? "on" : "off"} onChange={(v) => void set(v === "on")}
        options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
      <p className="pa-effect">{on ? tw2("controls.homework.on", { name }) : tw2("controls.homework.off", { name })}</p>
      {err && <p className="pa-form-err" role="alert">{err}</p>}
    </div>
  );
}

const TEST_SUBJECTS = ["maths", "science", "evs", "english", "hindi", "sst"];
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const fmtDayShort = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** "School test coming up" (STUDENT-FLOW §4.2 `test_window`): one window per child; the home shows calm revision. */
function TestWindow({ childId, name, classLevel, onRelock }: { childId: string; name: string; classLevel: number; onRelock: () => void }) {
  const [w, setW] = useState<{ subject: string; from: string; to: string } | null>(null);
  const [draft, setDraft] = useState({ subject: "maths", from: today(), to: today() });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getJson<{ window: { subject: string; from: string; to: string } | null }>(`/api/parent/test-window?childId=${encodeURIComponent(childId)}`)
      .then((r) => setW(r.window), (e) => { if (isRelock(e)) onRelock(); });
  }, [childId, onRelock]);
  const subjects = TEST_SUBJECTS.filter((x) => (classLevel <= 5 ? x !== "science" && x !== "sst" : x !== "evs"));
  const save = async () => {
    setBusy(true); setErr(null);
    try { setW((await postJson<{ window: typeof w }>("/api/parent/test-window", { childId, ...draft })).window); } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setErr(parentError(e));
    } finally { setBusy(false); }
  };
  const clear = async () => {
    setBusy(true); setErr(null);
    try { await request("DELETE", "/api/parent/test-window", { childId }); setW(null); } catch (e) {
      if (isRelock(e)) { onRelock(); return; }
      setErr(parentError(e));
    } finally { setBusy(false); }
  };
  return (
    <div className="pa-control" data-testid="test-window">
      <h3 className="pa-h3">{tw2("controls.test.title")}</h3>
      {w ? (
        <>
          <p className="pa-effect" role="status">{tw2("controls.test.set", { subject: subjectWords(w.subject), from: fmtDayShort(w.from), to: fmtDayShort(w.to) })}</p>
          <Button variant="secondary" onClick={() => void clear()} disabled={busy}>{tw2("controls.test.clear")}</Button>
        </>
      ) : (
        <>
          <p className="pa-effect">{tw2("controls.test.none")}</p>
          <div className="pa-test-row">
            <label className="pa-field"><span>{tw2("controls.test.subject")}</span>
              <select className="input" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}>
                {subjects.map((x) => <option key={x} value={x}>{subjectWords(x)}</option>)}
              </select>
            </label>
            <label className="pa-field"><span>{tw2("controls.test.from")}</span>
              <input className="input" type="date" value={draft.from} min={today()} onChange={(e) => setDraft({ ...draft, from: e.target.value, to: e.target.value > draft.to ? e.target.value : draft.to })} />
            </label>
            <label className="pa-field"><span>{tw2("controls.test.to")}</span>
              <input className="input" type="date" value={draft.to} min={draft.from} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
            </label>
          </div>
          <Button onClick={() => void save()} disabled={busy} aria-label={`${tw2("controls.test.save")} for ${name}`}>{tw2("controls.test.save")}</Button>
        </>
      )}
      {err && <p className="pa-form-err" role="alert">{err}</p>}
    </div>
  );
}

type Group = "time" | "voice" | "screen" | "reports";

function GroupCard({ id, title, children, dirty, busy, saved, err, onSave }:
  { id: Group; title: string; children: ReactNode; dirty: boolean; busy: boolean; saved: boolean; err: string | null; onSave: () => void }) {
  return (
    <section className="pa-card pa-group" aria-labelledby={`pa-g-${id}`} data-group={id} data-dirty={dirty || undefined}>
      <h2 id={`pa-g-${id}`} className="pa-h2">{title}</h2>
      {children}
      {(dirty || saved || err) && (
        <div className="pa-group-save">
          {dirty && <Button onClick={onSave} disabled={busy}>{busy ? "Saving" : "Save"}</Button>}
          {!dirty && saved && <p className="pa-row" role="status"><Icon name="tick" size={20} /> Saved</p>}
          {err && <p className="pa-form-err" role="alert">{err}</p>}
        </div>
      )}
    </section>
  );
}

export default function Controls() {
  const { kids, current, reload: reloadKids } = useChildren();
  const { relock } = useGate();
  const { data, err, reload } = useParentData(current ? () => parentApi.controls(current.id) : null, [current?.id]);
  const [base, setBase] = useState<ControlsT | null>(null);
  const [c, setC] = useState<ControlsT | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [busy, setBusy] = useState<Group | null>(null);
  const [saved, setSaved] = useState<Group | null>(null);
  const [gErr, setGErr] = useState<{ g: Group; msg: string } | null>(null);
  useEffect(() => { if (data) { setBase(data.controls); setC(data.controls); } }, [data]);
  useEffect(() => { if (current) setLang(current.language_pref); }, [current]);
  const patch = (p: Partial<ControlsT>) => { setSaved(null); setC((x) => (x ? { ...x, ...p } : x)); };

  if (!current) return <ParentShell title="Controls" kids={kids}><PageState err={err} loading /></ParentShell>;
  const rec = teacherRecord(current.teacher_id, bandForClass(current.class_level));
  const T = (current as ChildRow & { teacher_name?: string | null }).teacher_name || rec.name;
  const name = current.first_name;
  const dirtyOf = (g: Group) => {
    if (!c || !base) return false;
    if (g === "time") return c.dailyMinutes !== base.dailyMinutes || c.hoursStart !== base.hoursStart || c.hoursEnd !== base.hoursEnd;
    if (g === "voice") return c.address !== base.address || (lang ?? current.language_pref) !== current.language_pref;
    if (g === "screen") return c.captionsAlways !== base.captionsAlways || c.comfortMode !== base.comfortMode;
    return c.reportChannel !== base.reportChannel;
  };
  const save = async (g: Group) => {
    if (!c) return;
    if (g === "time" && c.hoursStart >= c.hoursEnd) { setGErr({ g, msg: "Lesson hours must end after they start." }); return; }
    setBusy(g); setGErr(null);
    try {
      const fields: Partial<ControlsT> = g === "time" ? { dailyMinutes: c.dailyMinutes, hoursStart: c.hoursStart, hoursEnd: c.hoursEnd }
        : g === "voice" ? { address: c.address } : g === "screen" ? { captionsAlways: c.captionsAlways, comfortMode: c.comfortMode } : { reportChannel: c.reportChannel };
      const out = await parentApi.setControls(current.id, fields);
      if (g === "voice" && lang && lang !== current.language_pref) {
        await request("PATCH", "/api/children", { childId: current.id, languagePref: lang });
        await refreshMe();
        reloadKids();
      }
      setBase(out.controls); setC((x) => (x ? { ...x, ...fields } : out.controls));
      setSaved(g);
    } catch (e) {
      if (isRelock(e)) { relock(); return; }
      setGErr({ g, msg: parentError(e) });
    } finally { setBusy(null); }
  };
  const limitOpts = [15, 30, 45];
  if (c && !limitOpts.includes(c.dailyMinutes)) limitOpts.push(c.dailyMinutes);
  const props = (g: Group) => ({ dirty: dirtyOf(g), busy: busy === g, saved: saved === g, err: gErr?.g === g ? gErr.msg : null, onSave: () => save(g) });
  return (
    <ParentShell title="Controls" child={current} kids={kids}>
      <h1 className="pa-h1">Controls for {name}</h1>
      <PageState err={err} loading={!c} onRetry={reload} />
      {c && (
        <div className="pa-stack">
          <GroupCard id="time" title="Time" {...props("time")}>
            <div className="pa-control">
              <h3 className="pa-h3">Daily limit</h3>
              <TileGroup label="Daily limit" columns={3} value={c.dailyMinutes} onChange={(v) => patch({ dailyMinutes: Number(v) })}
                options={limitOpts.sort((a, b) => a - b).map((m) => ({ value: m, label: `${m} min` }))} />
              <p className="pa-effect">At the limit {T} finishes at the next natural stop. {T} never shows {name} a countdown.</p>
            </div>
            <div className="pa-control">
              <h3 className="pa-h3">Lesson hours</h3>
              <HoursFields start={c.hoursStart} end={c.hoursEnd} onChange={(s, e) => patch({ hoursStart: s, hoursEnd: e })} />
              <p className="pa-effect">Lessons open from {fmtClock(c.hoursStart)} to {fmtClock(c.hoursEnd)}. Outside these hours the home says when they open.</p>
            </div>
            <OpenNow childId={current.id} name={name} onRelock={relock} />
          </GroupCard>
          <GroupCard id="voice" title={`How ${T} speaks`} {...props("voice")}>
            <div className="pa-control">
              <h3 className="pa-h3">Language</h3>
              <TileGroup label="Language" columns={3} value={lang} onChange={(v) => { setSaved(null); setLang(v); }}
                options={[{ value: "english", label: "English" }, { value: "hindi", label: "Hindi" }, { value: "hinglish", label: "Hindi and English mix" }]} />
              <p className="pa-effect">{T} speaks this in lessons, and captions show exactly what {T} says. The screens stay in English.</p>
            </div>
            <div className="pa-control">
              <h3 className="pa-h3">How {T} speaks to {name}</h3>
              <TileGroup label={`How ${T} speaks to ${name}`} columns={2} value={c.address ?? "tum"} onChange={(v) => patch({ address: v as "tum" | "aap" })}
                options={[{ value: "tum", label: "Casual" }, { value: "aap", label: "Respectful" }]} />
              <p className="pa-effect">{c.address === "aap" ? `Respectful: ${T} uses the polite form with ${name}.` : `Casual: ${T} uses the everyday form, as family does.`} This matters in Hindi and in the mix.</p>
            </div>
          </GroupCard>
          {/* the name the child gave the teacher: view and reset (child-names-teacher; lesson-safety-naming workstream) */}
          <ParentTeacherName childId={current.id} childName={name} className="pa-card" onGateError={relock} />
          <TapAndType childId={current.id} name={name} T={T} on0={!!c.textOnly} onRelock={relock} />
          <section className="pa-card pa-group" aria-labelledby="pa-g-school" data-group="school">
            <h2 id="pa-g-school" className="pa-h2">School</h2>
            <HomeworkToday childId={current.id} name={name} on0={!!c.homeworkToday} onRelock={relock} />
            <TestWindow childId={current.id} name={name} classLevel={current.class_level} onRelock={relock} />
          </section>
          <GroupCard id="screen" title="Words and screen" {...props("screen")}>
            <div className="pa-control">
              <h3 className="pa-h3">Words on screen</h3>
              <TileGroup label="Words on screen" columns={2} value={c.captionsAlways ? "always" : "needed"} onChange={(v) => patch({ captionsAlways: v === "always" })}
                options={[{ value: "always", label: "Always" }, { value: "needed", label: "When needed" }]} />
              <p className="pa-effect">{c.captionsAlways ? `${name} always sees what ${T} says, as words.` : `Words show when sound is off or ${name} asks for them.`}</p>
            </div>
            <div className="pa-control">
              <h3 className="pa-h3">Larger text and a calmer screen</h3>
              <TileGroup label="Larger text and a calmer screen" columns={2} value={c.comfortMode ? "on" : "off"} onChange={(v) => patch({ comfortMode: v === "on" })}
                options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
              <p className="pa-effect">Bigger words and less movement on {name}'s screens.</p>
            </div>
          </GroupCard>
          <GroupCard id="reports" title="Weekly letter" {...props("reports")}>
            <div className="pa-control">
              <h3 className="pa-h3">Where the weekly letter goes</h3>
              <TileGroup label="Where the weekly letter goes" columns={2} value={c.reportChannel} onChange={(v) => patch({ reportChannel: v as "whatsapp" | "app" })}
                options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "app", label: "Only in the app" }]} />
              <p className="pa-effect">It is always in Notes here. WhatsApp sending starts once Taxila's WhatsApp number is connected.</p>
            </div>
          </GroupCard>
        </div>
      )}
    </ParentShell>
  );
}
