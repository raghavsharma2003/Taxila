// Step 5, the last (round 4 journey audit #12, the 5-step cut; was steps 6-9 "About", controls, check, hand-over):
// the child's first name, the parent PIN (first child only), and "Give the phone to {child}". Everything else
// starts from a default the parent can change in the Parent corner: how {T} speaks (Casual to class 5, Respectful
// from 6), the school language (the language chosen in step 1; a mix counts as English), the daily time by class,
// the hours 06:30-21:30. What the child likes is picked by the child in Hello; the sound check is Hello's "say hi".
// One submit writes the child (POST/PATCH /api/children), the controls, then the PIN LAST, which leaves the corner
// locked for the hand-over (outside a fresh sign-in the first PIN needs the password and so goes first). "Later"
// goes to the Parent corner; it never skips Hello or the AI disclosure (the child home sends her to Hello first).
// `?add=1` is the second-child path, behind the parent gate (GateIfPin): the PIN exists, the pad is not shown.
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button, ErrorNote, Field, Icon, PinPad } from "../ui/index.ts";
import { defaultTutorFor } from "../../shared/tutors.js";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { ApiError, errText, getJson, lockBeacon, postJson, refreshMe, request } from "../app/api.ts";
import { useGate } from "../parent/Gate.tsx";
import { isGateError } from "../parent/api.ts";
import { StepFrame } from "./Layout.tsx";
import { clearDraft, useDraft } from "./draft.ts";
import { defaultsFor } from "./Setup.tsx";

/** The defaults the cut no longer asks for (owner-approved 2026-10-10). */
export const childDefaults = (classLevel: number, languagePref: string) => ({
  address: classLevel <= 5 ? "tum" as const : "aap" as const,
  schoolMedium: languagePref === "hindi" ? "hindi" : "english",
});

export function ChildStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const adding = !!sp.get("add");
  const [d, set] = useDraft();
  const { relock } = useGate();
  const c = d.child ?? {};
  const setC = (patch: Partial<NonNullable<typeof d.child>>) => set((cur) => ({ child: { ...(cur.child ?? {}), ...patch } }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [needPw, setNeedPw] = useState(false);
  const [password, setPassword] = useState("");
  const [pin1, setPin1] = useState<string | null>(null);
  const [pinOk, setPinOk] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const cl = c.classLevel;
  const rec = teacherRecord(defaultTutorFor({ class_level: cl ?? 5 }), (cl ?? 5) <= 4 ? "b2" : "b3");
  const first = c.firstName?.trim() ?? "";

  useEffect(() => {
    getJson<{ hasPin: boolean; firstSetNeedsPassword?: boolean }>("/api/parent/pin").then((g) => {
      setHasPin(g.hasPin);
      setNeedPw(!g.hasPin && !!g.firstSetNeedsPassword);
    }, (e) => {
      if (e instanceof ApiError && e.status === 401) return nav("/start/phone?next=/start/child");
      setErr(errText(e));
    });
  }, [nav]);

  const onPin = (p: string) => {
    if (!pin1) { setPin1(p); setResetKey((k) => k + 1); return; }
    if (p !== pin1) { setErr("The PINs don't match. Try again."); setPin1(null); setResetKey((k) => k + 1); return; }
    setErr(null);
    setPinOk(true);
  };
  const resetPinUi = () => { setPin1(null); setPinOk(false); setResetKey((k) => k + 1); };
  const needPin = hasPin === false && (!pinOk || (needPw && !password));
  const ready = !!first && !!cl && hasPin !== null && !needPin;

  const submit = (e: FormEvent) => { e.preventDefault(); void save(false); };
  const save = async (later: boolean) => {
    if (!ready || !cl) return;
    setBusy(true);
    setErr(null);
    const languagePref = c.languagePref ?? (d.lang === "hi" ? "hindi" : d.lang === "en" ? "english" : "hinglish");
    const def = childDefaults(cl, languagePref);
    let pinSaved = !!hasPin;
    let stage: "child" | "pin" | "controls" = "child";
    try {
      const body = { firstName: first, classLevel: cl, board: c.board ?? "cbse", schoolMedium: c.schoolMedium ?? def.schoolMedium, languagePref, interests: c.interests ?? [] };
      // Coming back to this step edits the profile made a moment ago instead of creating a second one.
      // Only a "not your child" refusal (deleted since) falls back to creating; a gate refusal must not make a twin.
      let child: { id: string } | null = null;
      if (d.childId) {
        child = await request<{ child: { id: string } }>("PATCH", "/api/children", { childId: d.childId, ...body }).then((r) => r.child, (e2) => {
          if (isGateError(e2) || !(e2 instanceof ApiError && (e2.status === 403 || e2.status === 404))) throw e2;
          return null;
        });
      }
      if (!child) child = (await postJson<{ child: { id: string } }>("/api/children", body)).child;
      set({ childId: child.id });
      if (!pinSaved && pin1 && needPw) { stage = "pin"; await postJson("/api/parent/pin", { pin: pin1, password }); pinSaved = true; setHasPin(true); }
      stage = "controls";
      await postJson("/api/parent/controls", {
        childId: child.id, ...defaultsFor(cl), address: c.address ?? def.address, comfortMode: !!c.comfort, captionsAlways: !!c.hardToHear,
        reportChannel: d.reportChannel ?? "whatsapp",
      });
      if (!pinSaved && pin1) { stage = "pin"; await postJson("/api/parent/pin", { pin: pin1 }); pinSaved = true; setHasPin(true); }
      await refreshMe();
      // the hand-over: the tap is her audio unlock; the corner is locked behind her. "Later": the Parent corner.
      lockBeacon();
      clearDraft();
      nav(later ? "/parent" : `/c/${child.id}/hello`);
    } catch (e2) {
      if (e2 instanceof ApiError && e2.status === 401) return nav("/start/phone?next=/start/child");
      if (isGateError(e2)) { if (pinSaved) setErr("The Parent corner locked. Enter the PIN to continue."); relock(); return; }
      if (e2 instanceof ApiError && (e2.body as { gate?: string } | null)?.gate === "password") setNeedPw(true);
      setErr(errText(e2));
      if (stage === "pin") resetPinUi();
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  if (!cl) return <Navigate to={`/start/class${adding ? "?add=1" : ""}`} replace />;
  const go = first ? `Give the phone to ${first}` : "Give the phone to your child";
  const why = !first ? "Add a name to continue" : hasPin === null ? "One moment" : "Set the PIN to continue";
  return (
    <StepFrame step="child" title={adding ? "Who is this for?" : "Your child's name"} docTitle="Your child"
      why={`${rec.name} will call them by this name.`}>
      <form className="stack" onSubmit={submit} noValidate>
        <p className="row t-meta">Class {cl}{c.board ? ` · ${c.board === "other-state" ? "Other board" : c.board.toUpperCase()}` : ""}
          <Link to={`/start/class${adding ? "?add=1" : ""}`} className="block-link" style={{ marginLeft: "auto" }}>Change</Link></p>
        <Field label="Child's first name" hint="Just the name they are called at home is fine." autoComplete="off" maxLength={40}
          value={c.firstName ?? ""} onChange={(e) => setC({ firstName: e.target.value })} required />
        {hasPin === false && (
          <section className="card card-flat stack-sm" aria-label="Parent PIN">
            <h2 className="t-h3 row" style={{ fontFamily: "var(--font-text)" }}><Icon name="lock" /> Parent PIN</h2>
            <p className="muted">The Parent corner opens only with this PIN. Choose 4 digits your child does not know. Not your phone's unlock code.</p>
            {pinOk ? <p className="row"><Icon name="tick" /> <strong>PIN set</strong>
              <Button variant="quiet" small onClick={resetPinUi}>Change</Button></p>
              : <PinPad label={pin1 ? "Enter the same PIN again" : "Choose a PIN"} onComplete={onPin} resetKey={resetKey} okLabel={pin1 ? "OK" : "Next"} />}
            {!pinOk && <p className="t-note" aria-live="polite">{pin1 ? "Enter the same PIN again." : "Then press Next."}</p>}
            {needPw && pinOk && <Field label="Your account password" hint="Needed because this sign-in is not new. It is checked once and not stored here."
              type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </section>
        )}
        <p className="t-note">{`${rec.name} starts with ${cl <= 2 ? 20 : cl <= 5 ? 30 : 45} minutes a day, 06:30 to 21:30. Change it any time in the Parent corner.`}</p>
        <ErrorNote>{err}</ErrorNote>
        <div className="onb-go">
          {!ready && <span className="t-note" id="child-why">{why}</span>}
          <Button type="submit" block disabled={!ready || busy} aria-describedby={ready ? undefined : "child-why"} icon={<Icon name="chevron" />}>{busy ? "Saving" : go}</Button>
          <Button variant="quiet" disabled={!ready || busy} onClick={() => void save(true)}>Later</Button>
        </div>
      </form>
    </StepFrame>
  );
}
