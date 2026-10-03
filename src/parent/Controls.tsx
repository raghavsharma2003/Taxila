// Controls (PRODUCT-DESIGN-V2 §6.5.4), per child: grouped cards, each control with a label and its one-line effect.
// Save sits INLINE at the end of each changed group; there is no floating save bar (audit #19: a floating Save plus the
// tab bar took about 120 px of a 640 px screen). Only controls the server stores are shown (P6: only what works).
import { useEffect, useState, type ReactNode } from "react";
import { Button, Icon, TileGroup } from "../ui/index.ts";
import { refreshMe, request, type ChildRow } from "../app/api.ts";
import { HoursFields } from "../onboarding/Setup.tsx";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { bandForClass } from "../app/band.ts";
import { isRelock, parentApi, type ControlsT } from "./api.ts";
import { fmtClock, parentError } from "./copy.ts";
import { useGate } from "./Gate.tsx";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";
import { ParentTeacherName } from "../child/teacher/ParentTeacherName.tsx";

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
