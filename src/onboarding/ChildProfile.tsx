// Step 6 "About {child}" (PRODUCT-DESIGN-V2 §3.2, §6.2): the first name; how {T} should speak to them (Casual /
// Respectful: Respectful from class 5 up, nothing preselected below that); what they like (the 12 interest pictures,
// up to 3: the same set Hello shows the child, so the parent's picks are the ones the child confirms, audit #7);
// "Captions always on". The class and board were chosen in step 1 and the language in step 2 (asked once, audit #24).
// Creates via POST /api/children; the controls row (address, comfort, captions, report channel) is written once at
// the PIN step from the draft. `?add=1` is the second-child path, behind the parent gate (GateIfPin).
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Chip, ErrorNote, Field, Icon, TileGroup } from "../ui/index.ts";
import { defaultTutorFor } from "../../shared/tutors.js";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { Spot } from "../child/art.tsx";
import { INTERESTS } from "../child/interests.ts";
import { ApiError, errText, postJson, refreshMe, request } from "../app/api.ts";
import { useGate } from "../parent/Gate.tsx";
import { isGateError } from "../parent/api.ts";
import { StepFrame } from "./Layout.tsx";
import { useDraft } from "./draft.ts";


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
  const cl = c.classLevel;
  // Respectful from class 5 up; nothing preselected below that (§3.2 step 6)
  const address = c.address ?? (cl && cl >= 5 ? "aap" : undefined);
  const ready = !!c.firstName?.trim() && !!cl && !!address;
  const rec = teacherRecord(defaultTutorFor({ class_level: cl ?? 5 }), (cl ?? 5) <= 4 ? "b2" : "b3");
  const name = c.firstName?.trim() || "your child";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setErr(null);
    try {
      const body = {
        firstName: c.firstName!.trim(), classLevel: cl, board: c.board ?? "cbse", schoolMedium: c.schoolMedium ?? "english",
        languagePref: c.languagePref ?? (d.lang === "hi" ? "hindi" : d.lang === "en" ? "english" : "hinglish"), interests: c.interests ?? [],
      };
      // Coming back to this step edits the profile made a moment ago instead of creating a second one.
      // Only a "not your child" refusal (deleted since) falls back to creating; a gate refusal must not make a twin.
      let child: { id: string } | null = null;
      if (d.childId) {
        child = await request<{ child: { id: string } }>("PATCH", "/api/children", { childId: d.childId, ...body }).then((r) => r.child, (e) => {
          if (isGateError(e) || !(e instanceof ApiError && (e.status === 403 || e.status === 404))) throw e;
          return null;
        });
      }
      if (!child) child = (await postJson<{ child: { id: string } }>("/api/children", body)).child;
      // P6's address / comfort / captions choices stay in the draft and are written with P7's controls (one
      // write, after the gate), so they cannot be silently lost here.
      set({ childId: child.id, child: { ...c, address } });
      await refreshMe();
      nav(`/start/controls${adding ? "?add=1" : ""}`);
    } catch (e2) {
      if (e2 instanceof ApiError && e2.status === 401) return nav("/start/phone?next=/start/child");
      if (isGateError(e2)) { relock(); return; }
      setErr(errText(e2));
    } finally {
      setBusy(false);
    }
  };

  const toggleInterest = (x: string) => {
    const cur = new Set(c.interests ?? []);
    if (cur.has(x)) cur.delete(x); else if (cur.size < 3) cur.add(x);
    setC({ interests: [...cur] });
  };

  if (!cl) return <Navigate to={`/start/class${adding ? "?add=1" : ""}`} replace />;
  const label = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);
  return (
    <StepFrame step="child" title={c.firstName?.trim() ? `About ${c.firstName.trim()}` : "About your child"} docTitle="About your child"
      why={`${rec.name} uses this to talk to ${name} the right way.`}>
      <form className="stack" onSubmit={submit} noValidate>
        <p className="row t-meta">Class {cl}{c.board ? ` · ${c.board === "other-state" ? "Other board" : c.board.toUpperCase()}` : ""}
          <Link to={`/start/class${adding ? "?add=1" : ""}`} className="block-link" style={{ marginLeft: "auto" }}>Change</Link></p>
        <Field label="Child's first name" hint="Just the name they are called at home is fine." autoComplete="off" maxLength={40}
          value={c.firstName ?? ""} onChange={(e) => setC({ firstName: e.target.value })} required />
        <fieldset className="fs"><legend className="label">How should {rec.name} speak to {name}?</legend>
          <TileGroup label="How to speak" columns={2} value={address ?? null} onChange={(v) => setC({ address: v as "tum" | "aap" })}
            options={[{ value: "tum", label: "Casual" }, { value: "aap", label: "Respectful" }]} />
        </fieldset>
        <fieldset className="fs"><legend className="label">School teaches in</legend>
          <TileGroup label="School medium" columns={3} value={c.schoolMedium ?? null} onChange={(v) => setC({ schoolMedium: v })}
            options={[{ value: "english", label: "English" }, { value: "hindi", label: "Hindi" }, { value: "other", label: "Other" }]} />
        </fieldset>
        <fieldset className="fs"><legend className="label">What does {name} like? Pick up to 3. <span className="muted">(optional)</span></legend>
          <div className="onb-likes">
            {INTERESTS.map((x) => {
              const on = (c.interests ?? []).map((v) => v.toLowerCase()).includes(x);
              return (
                <button key={x} type="button" className="onb-like" aria-pressed={on} onClick={() => toggleInterest(label(x))}>
                  <Spot id={`interests/${x}`} size={56} fallback={<span className="onb-like-fb" />} />
                  <span>{label(x)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="fs"><legend className="label">Anything that helps <span className="muted">(optional)</span></legend>
          <div className="stack-sm">
            <Chip selected={!!c.hardToHear} onClick={() => setC({ hardToHear: !c.hardToHear })}>Captions always on</Chip>
            <Chip selected={!!c.comfort} onClick={() => setC({ comfort: !c.comfort })}>Larger text and a calmer screen</Chip>
          </div>
        </fieldset>
        <ErrorNote>{err}</ErrorNote>
        <div className="onb-go">
          {!ready && <span className="t-note" id="child-why">{!c.firstName?.trim() ? "Add a name to continue" : "Choose how to speak to continue"}</span>}
          <Button type="submit" block disabled={!ready || busy} aria-describedby={ready ? undefined : "child-why"} icon={<Icon name="chevron" />}>{busy ? "Saving" : "Continue"}</Button>
        </div>
      </form>
    </StepFrame>
  );
}
