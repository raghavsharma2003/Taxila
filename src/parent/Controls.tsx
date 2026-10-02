// Controls (§6.9), per child: daily time, allowed hours, captions-always, comfort mode, tum / aap, the
// teacher's language, where reports go. Stored server-side (child_controls; language on the child row).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, ErrorNote, Icon, TileGroup } from "../ui/index.ts";
import { errText, refreshMe, request } from "../app/api.ts";
import { HoursFields, MinutesStepper } from "../onboarding/Setup.tsx";
import { parentApi, type ControlsT } from "./api.ts";
import { PageState, ParentShell, useChildren, useParentData } from "./Shell.tsx";

export default function Controls() {
  const nav = useNavigate();
  const { kids, current } = useChildren();
  const { data, err } = useParentData(current ? () => parentApi.controls(current.id) : null, [current?.id]);
  const [c, setC] = useState<ControlsT | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  useEffect(() => { if (data) setC(data.controls); }, [data]);
  useEffect(() => { if (current) setLang(current.language_pref); }, [current]);
  const patch = (p: Partial<ControlsT>) => { setSaved(false); setC((x) => (x ? { ...x, ...p } : x)); };

  const save = async () => {
    if (!current || !c) return;
    setBusy(true);
    setSaveErr(null);
    try {
      const { saved: _s, ...rest } = c;
      void _s;
      await parentApi.setControls(current.id, rest);
      if (lang && lang !== current.language_pref) { await request("PATCH", "/api/children", { childId: current.id, languagePref: lang }); await refreshMe(); }
      setSaved(true);
    } catch (e) {
      setSaveErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ParentShell title="Controls" child={current} kids={kids} onSwitch={(id) => nav(`/parent/controls?c=${id}`)}>
      <PageState err={err} loading={!c} />
      {c && current && (
        <div className="stack controls">
          <h1 className="t-title">Controls for {current.first_name}</h1>
          <section className="card card-flat stack-sm">
            <h2 className="t-h3 row"><Icon name="clock" /> Time each day</h2>
            <MinutesStepper value={c.dailyMinutes} onChange={(n) => patch({ dailyMinutes: n })} />
            <p className="t-meta">At the limit she finishes at the next natural stop. Your child never sees a countdown.</p>
          </section>
          <section className="card card-flat stack-sm">
            <h2 className="t-h3">Allowed hours</h2>
            <HoursFields start={c.hoursStart} end={c.hoursEnd} onChange={(s, e) => patch({ hoursStart: s, hoursEnd: e })} />
          </section>
          <section className="card card-flat stack-sm">
            <h2 className="t-h3">She speaks</h2>
            <TileGroup label="Teacher's language" columns={3} value={lang} onChange={(v) => { setSaved(false); setLang(v); }}
              options={[{ value: "hindi", label: "हिन्दी", lang: "hi" }, { value: "hinglish", label: "Hinglish" }, { value: "english", label: "English" }]} />
            <h2 className="t-h3">She calls {current.first_name}</h2>
            <TileGroup label="Address" columns={2} value={c.address} onChange={(v) => patch({ address: v as "tum" | "aap" })}
              options={[{ value: "tum", label: "tum" }, { value: "aap", label: "aap" }]} />
            {current.class_level >= 5 && <p className="t-meta">From Class 5 your child can change this themselves.</p>}
          </section>
          <section className="card card-flat stack-sm">
            <h2 className="t-h3">Seeing and hearing</h2>
            <div className="stack-sm">
              <Chip selected={c.captionsAlways} onClick={() => patch({ captionsAlways: !c.captionsAlways })}>Always show her words</Chip>
              <Chip selected={c.comfortMode} onClick={() => patch({ comfortMode: !c.comfortMode })}>Larger text and a calmer screen</Chip>
            </div>
          </section>
          <section className="card card-flat stack-sm">
            <h2 className="t-h3">Weekly report</h2>
            <TileGroup label="Where reports go" columns={2} value={c.reportChannel} onChange={(v) => patch({ reportChannel: v as "whatsapp" | "app" })}
              options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "app", label: "Only in the app" }]} />
            <p className="t-meta">WhatsApp reports start when the WhatsApp service is connected.</p>
          </section>
          <ErrorNote>{saveErr}</ErrorNote>
          <div className="row sticky-save">
            <Button onClick={save} disabled={busy}>{busy ? "Saving" : "Save"}</Button>
            {saved && <span className="row" role="status"><Icon name="tick" /> Saved</span>}
          </div>
        </div>
      )}
    </ParentShell>
  );
}
