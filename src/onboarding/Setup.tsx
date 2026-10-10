// P7 controls (guardian PIN + daily time + hours, prefilled by class) and P8 handover (§2.2), plus the
// edge screens: /start/student, /start/summary, /start/verify (VPC is off at launch: it forwards).
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button, ButtonLink, ErrorNote, Field, Icon, PinPad, TeacherFace } from "../ui/index.ts";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { Spot } from "../child/art.tsx";
import { ApiError, errText, getJson, loadMe, lockBeacon, postJson, type ChildRow } from "../app/api.ts";
import { useGate } from "../parent/Gate.tsx";
import { isGateError } from "../parent/api.ts";
import { StepFrame } from "./Layout.tsx";
import { clearDraft, useDraft } from "./draft.ts";

interface Controls { dailyMinutes: number; hoursStart: string; hoursEnd: string }
const defaultsFor = (cl: number): Controls => ({ dailyMinutes: cl <= 2 ? 20 : cl <= 5 ? 30 : 45, hoursStart: "06:30", hoursEnd: "21:30" });

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
  const { relock } = useGate();
  const [child, setChild] = useState<ChildRow | null>(null);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [needPw, setNeedPw] = useState(false);
  const [password, setPassword] = useState("");
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
      const g = await getJson<{ hasPin: boolean; firstSetNeedsPassword?: boolean }>("/api/parent/pin");
      setHasPin(g.hasPin);
      setNeedPw(!g.hasPin && !!g.firstSetNeedsPassword);
    })().catch((e) => setErr(errText(e)));
  }, [d.childId, nav]);

  const onPin = (p: string) => {
    if (!pin1) { setPin1(p); setResetKey((k) => k + 1); return; }
    if (p !== pin1) { setErr("The PINs don't match. Try again."); setPin1(null); setResetKey((k) => k + 1); return; }
    setErr(null);
    setPinOk(true);
  };
  const resetPinUi = () => { setPin1(null); setPinOk(false); setResetKey((k) => k + 1); };

  const save = async () => {
    if (!child || !c) return;
    setBusy(true);
    setErr(null);
    // P6's choices (address, comfort, captions, report channel) ride along here, the one controls write of
    // setup, so they are never lost to a gate refusal on P6.
    const p6 = d.child && d.childId === child.id ? {
      address: d.child.address ?? (child.class_level >= 5 ? "aap" : "tum"), comfortMode: !!d.child.comfort, captionsAlways: !!d.child.hardToHear,
      reportChannel: d.reportChannel ?? "whatsapp",
    } : {};
    let pinSaved = !!hasPin;
    let stage: "pin" | "controls" = "controls";
    try {
      // Outside the fresh onboarding session the first PIN needs the account password; it then opens this
      // session, so the controls write after it is allowed. In onboarding the controls go first (allowed
      // before any PIN exists) and the PIN last, which leaves the corner LOCKED for the handover.
      if (!pinSaved && pin1 && needPw) { stage = "pin"; await postJson("/api/parent/pin", { pin: pin1, password }); pinSaved = true; setHasPin(true); }
      stage = "controls";
      await postJson("/api/parent/controls", { childId: child.id, ...c, ...p6 });
      if (!pinSaved && pin1) { stage = "pin"; await postJson("/api/parent/pin", { pin: pin1 }); pinSaved = true; setHasPin(true); }
      // step 8: the sound and mic check (first run); adding a child on the same phone goes straight to the hand-over
      nav(sp.get("add") ? "/start/handover?add=1" : "/start/check");
    } catch (e) {
      if (pinSaved && isGateError(e)) { setErr("The Parent corner locked. Enter the PIN to continue."); relock(); return; }
      if (e instanceof ApiError && (e.body as { gate?: string } | null)?.gate === "password") setNeedPw(true);
      setErr(errText(e));
      // Only a refused PIN clears the PIN pad; a failed controls write keeps it (the PIN may already be saved).
      if (stage === "pin") resetPinUi();
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  if (!child || !c || hasPin === null) return <StepFrame step="controls" title="Set a parent PIN">{err ? <ErrorNote>{err}</ErrorNote> : <div className="spinner" />}</StepFrame>;
  const needPin = !hasPin && (!pinOk || (needPw && !password));
  const tname = teacherRecord(child.teacher_id, child.class_level <= 4 ? "b2" : "b3").name;

  return (
    <StepFrame step="controls" title={hasPin ? "Daily limit" : "Set a parent PIN"} why={hasPin ? `For ${child.first_name}, Class ${child.class_level}. You can change this any time.` : "Only grown-ups should know it."}
      footer={<div className="onb-go">{needPin && <span className="t-note" id="pin-why">Set the PIN to continue</span>}<Button block onClick={save} disabled={busy || needPin} aria-describedby={needPin ? "pin-why" : undefined}>{busy ? "Saving" : "Looks good"}</Button></div>}>
      {!hasPin && (
        <section className="card card-flat stack-sm">
          <h2 className="t-h3 row" style={{ fontFamily: "var(--font-text)" }}><Icon name="lock" /> Parent PIN</h2>
          <p className="muted">The Parent corner opens only with this PIN. Choose 4 digits your child does not know. Not your phone's unlock code.</p>
          {pinOk ? <p className="row"><Icon name="tick" /> <strong>PIN set</strong>
            <Button variant="quiet" small onClick={resetPinUi}>Change</Button></p>
            : <PinPad label={pin1 ? "Enter the same PIN again" : "Choose a PIN"} onComplete={onPin} resetKey={resetKey} okLabel={pin1 ? "OK" : "Next"} />}
          {!pinOk && <p className="t-note" aria-live="polite">{pin1 ? "Enter the same PIN again." : "Then press Next."}</p>}
          {needPw && pinOk && <Field label="Your account password" hint="Needed because this sign-in is not new. It is checked once and not stored here."
            type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />}
          <p className="t-meta">In the Android app you will be able to use your phone lock instead.</p>
        </section>
      )}
      <section className="card card-flat stack-sm">
        <h2 className="t-h3 row" style={{ fontFamily: "var(--font-text)" }}><Icon name="clock" /> Time each day</h2>
        <MinutesStepper value={c.dailyMinutes} onChange={(n) => setC({ ...c, dailyMinutes: n })} />
        <p className="t-note">At the limit {tname} finishes at the next natural stop. {tname} never shows {child.first_name} a countdown.</p>
      </section>
      <section className="card card-flat stack-sm">
        <h2 className="t-h3" style={{ fontFamily: "var(--font-text)" }}>Allowed hours</h2>
        <HoursFields start={c.hoursStart} end={c.hoursEnd} onChange={(s, e) => setC({ ...c, hoursStart: s, hoursEnd: e })} />
        <p className="t-note">Outside these hours lessons don't start. {child.first_name} sees when they open again.</p>
      </section>
      <ErrorNote>{err}</ErrorNote>
    </StepFrame>
  );
}

/**
 * Step 9 "Ready for {child}?" (PRODUCT-DESIGN-V2 §3.2, §6.2; audit #16, #24): two equal tiles, "Give the phone to
 * {child} now" and "Later", with spot art (never a raised-palm "stop" icon), and the teacher the child will meet.
 * Now → Hello (the tap is the child's audio unlock). Later → the Parent corner; "Later" never skips Hello or the AI
 * disclosure: the child home sends a child who has not met the teacher to Hello first.
 */
export function HandoverStep() {
  const nav = useNavigate();
  const [d] = useDraft();
  const [child, setChild] = useState<ChildRow | null>(null);
  // The phone goes to the child here: the corner is shut whatever happened before (review blocker).
  useEffect(() => { lockBeacon(); }, []);
  useEffect(() => {
    loadMe().then((me) => {
      if (!me) return nav("/start/phone");
      setChild(me.children.find((x) => x.id === d.childId) ?? me.children.at(-1) ?? null);
    }, () => {});
  }, [d.childId, nav]);
  if (!child) return <StepFrame step="handover" title="Ready"><div className="spinner" /></StepFrame>;
  const done = (to: string) => { lockBeacon(); clearDraft(); nav(to); };
  const band = child.class_level <= 4 ? "b2" : "b3";
  const rec = teacherRecord(child.teacher_id, band);
  return (
    <StepFrame step="handover" title={`Ready for ${child.first_name}?`} back={false}>
      <div className="meet"><TeacherFace size={180} teacherId={rec.id} band={band} /></div>
      <div className="tiles tiles-2 onb-hand">
        <button type="button" className="tile handover-tile" onClick={() => done(`/c/${child.id}/hello`)} data-testid="handover-now">
          <Spot id="onboarding/handover-now" size={96} fallback={<Icon name="phone" size={40} />} />
          <span>Give the phone to {child.first_name} now</span>
        </button>
        <button type="button" className="tile handover-tile" onClick={() => done("/parent")} data-testid="handover-later">
          <Spot id="onboarding/handover-later" size={96} fallback={<Icon name="clock" size={40} />} />
          <span>Later</span>
        </button>
      </div>
      <p className="t-note">{rec.name} will say hello the first time {child.first_name} opens Taxila.</p>
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
