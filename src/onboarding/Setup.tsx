// P7 controls (guardian PIN + daily time + hours, prefilled by class) and P8 handover (§2.2), plus the
// edge screens: /start/student, /start/summary, /start/verify (VPC is off at launch: it forwards).
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button, ButtonLink, ErrorNote, Icon, PinPad, TeacherFace } from "../ui/index.ts";
import { errText, getJson, loadMe, postJson, type ChildRow } from "../app/api.ts";
import { StepFrame } from "./Layout.tsx";
import { clearDraftChild, useDraft } from "./draft.ts";

interface Controls { dailyMinutes: number; hoursStart: string; hoursEnd: string }
const defaultsFor = (cl: number): Controls => ({ dailyMinutes: cl <= 2 ? 20 : cl <= 5 ? 30 : 45, hoursStart: "07:00", hoursEnd: "20:30" });

export function MinutesStepper({ value, onChange, min = 10, max = 120 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="stepper" role="group" aria-label="Minutes a day">
      <button type="button" className="btn btn-secondary" onClick={() => onChange(Math.max(min, value - 5))} disabled={value <= min} aria-label="5 minutes less">−</button>
      <output className="stepper-val" aria-live="polite"><strong>{value}</strong> min a day</output>
      <button type="button" className="btn btn-secondary" onClick={() => onChange(Math.min(max, value + 5))} disabled={value >= max} aria-label="5 minutes more">+</button>
    </div>
  );
}

export function HoursFields({ start, end, onChange }: { start: string; end: string; onChange: (s: string, e: string) => void }) {
  return (
    <div className="hours">
      <div className="field"><label htmlFor="hs">From</label><input id="hs" type="time" className="input" value={start} onChange={(e) => onChange(e.target.value, end)} /></div>
      <div className="field"><label htmlFor="he">Until</label><input id="he" type="time" className="input" value={end} onChange={(e) => onChange(start, e.target.value)} /></div>
    </div>
  );
}

export function ControlsStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [d] = useDraft();
  const [child, setChild] = useState<ChildRow | null>(null);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [c, setC] = useState<Controls | null>(null);
  const [pin1, setPin1] = useState<string | null>(null);
  const [pinOk, setPinOk] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await loadMe();
      if (!me) return nav("/start/phone?next=/start/controls");
      const ch = me.children.find((x) => x.id === d.childId) ?? me.children.at(-1) ?? null;
      if (!ch) return nav("/start/child");
      setChild(ch);
      setC(defaultsFor(ch.class_level));
      const g = await getJson<{ hasPin: boolean }>("/api/parent/pin");
      setHasPin(g.hasPin);
    })().catch((e) => setErr(errText(e)));
  }, [d.childId, nav]);

  const onPin = (p: string) => {
    if (!pin1) { setPin1(p); setResetKey((k) => k + 1); return; }
    if (p !== pin1) { setErr("The two PINs were different. Please set it again."); setPin1(null); setResetKey((k) => k + 1); return; }
    setErr(null);
    setPinOk(true);
  };

  const save = async () => {
    if (!child || !c) return;
    setBusy(true);
    setErr(null);
    try {
      if (!hasPin && pin1) await postJson("/api/parent/pin", { pin: pin1 });
      await postJson("/api/parent/controls", { childId: child.id, ...c });
      nav(`/start/handover${sp.get("add") ? "?add=1" : ""}`);
    } catch (e) {
      setErr(errText(e));
      if (!hasPin) { setPin1(null); setPinOk(false); setResetKey((k) => k + 1); }
    } finally {
      setBusy(false);
    }
  };

  if (!child || !c || hasPin === null) return <StepFrame step="controls" title="Safe settings">{err ? <ErrorNote>{err}</ErrorNote> : <div className="spinner" />}</StepFrame>;
  const needPin = !hasPin && !pinOk;

  return (
    <StepFrame step="controls" title="Safe settings" why={`Set for ${child.first_name}, Class ${child.class_level}. You can change these any time.`}
      footer={<Button block onClick={save} disabled={busy || needPin}>{busy ? "Saving" : "Looks right"}</Button>}>
      {!hasPin && (
        <section className="card card-flat stack-sm">
          <h2 className="t-h3 row" style={{ fontFamily: "var(--font-text)" }}><Icon name="lock" /> Parent PIN</h2>
          <p className="muted">The Parent corner opens only with this PIN. Choose 4 to 6 digits your child does not know. Not your phone's unlock code.</p>
          {pinOk ? <p className="row"><Icon name="tick" /> <strong>PIN set</strong>
            <Button variant="quiet" small onClick={() => { setPinOk(false); setPin1(null); setResetKey((k) => k + 1); }}>Change</Button></p>
            : <PinPad label={pin1 ? "Enter the same PIN again" : "Choose a PIN"} onComplete={onPin} resetKey={resetKey} okLabel={pin1 ? "OK" : "Next"} />}
          {!pinOk && <p className="t-meta" aria-live="polite">{pin1 ? "Enter the same PIN again." : "Then press Next."}</p>}
          <p className="t-meta">In the Android app you will be able to use your phone lock instead.</p>
        </section>
      )}
      <section className="card card-flat stack-sm">
        <h2 className="t-h3 row" style={{ fontFamily: "var(--font-text)" }}><Icon name="clock" /> Time each day</h2>
        <MinutesStepper value={c.dailyMinutes} onChange={(n) => setC({ ...c, dailyMinutes: n })} />
        <p className="t-meta">At the limit she finishes at the next natural stop. She never shows your child a countdown.</p>
      </section>
      <section className="card card-flat stack-sm">
        <h2 className="t-h3" style={{ fontFamily: "var(--font-text)" }}>Allowed hours</h2>
        <HoursFields start={c.hoursStart} end={c.hoursEnd} onChange={(s, e) => setC({ ...c, hoursStart: s, hoursEnd: e })} />
        <p className="t-meta">Outside these hours your child sees "the teacher is resting".</p>
      </section>
      <ErrorNote>{err}</ErrorNote>
    </StepFrame>
  );
}

export function HandoverStep() {
  const nav = useNavigate();
  const [d] = useDraft();
  const [child, setChild] = useState<ChildRow | null>(null);
  useEffect(() => {
    loadMe().then((me) => {
      if (!me) return nav("/start/phone");
      setChild(me.children.find((x) => x.id === d.childId) ?? me.children.at(-1) ?? null);
    }, () => {});
  }, [d.childId, nav]);
  if (!child) return <StepFrame step="handover" title="All set"><div className="spinner" /></StepFrame>;
  const done = (to: string) => { clearDraftChild(); nav(to); };
  return (
    <StepFrame step="handover" title={`${child.first_name} is ready to meet her`} back={false}>
      <div className="meet"><TeacherFace size={140} /></div>
      <p className="t-lead">Give the phone to {child.first_name} now, or later. Both are fine.</p>
      <div className="tiles tiles-2">
        <button type="button" className="tile handover-tile" onClick={() => done(`/c/${child.id}/hello`)}>
          <Icon name="hand" size={40} /><span>Abhi</span><span className="tile-sub">Now</span>
        </button>
        <button type="button" className="tile handover-tile" onClick={() => done("/who")}>
          <Icon name="clock" size={40} /><span>Baad mein</span><span className="tile-sub">Later</span>
        </button>
      </div>
      <p className="t-meta">She will say hello, then a few minutes of play to find where to start. Nothing is marked.</p>
    </StepFrame>
  );
}

/** Teen installed alone: greeting only, then hand to a parent (§2.2 edge flow). WhatsApp link is not wired yet. */
export function StudentStep() {
  return (
    <StepFrame step={null} title="Hi. A parent sets this up first">
      <div className="meet"><TeacherFace size={140} /></div>
      <p className="t-lead">Taxila needs a parent or guardian to create the account and say yes to how it works. Show them this screen, or send them the link to this page.</p>
      <ButtonLink to="/" variant="secondary">What is Taxila</ButtonLink>
    </StepFrame>
  );
}

/** R1 placement summary + R2 report day: placement comes from the child's first run (ui-b / Conductor). */
export function SummaryStep() {
  return (
    <StepFrame step={null} title="Where your child is starting">
      <div className="note">The starting summary appears here after your child's first hello and play. It is not ready for this child yet.</div>
      <ButtonLink to="/parent" block>Open the Parent corner</ButtonLink>
    </StepFrame>
  );
}

export const VerifyStep = () => <Navigate to="/start/consent" replace />;
