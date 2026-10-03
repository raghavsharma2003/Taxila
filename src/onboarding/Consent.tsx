// P3 trust page and P5 consent rows (§2.2). Unbundled purposes; lessons are required; "remember learning
// across days" is an equal-weight choice with nothing preselected (R22); "remember what they like" is off
// by default. Writes POST /api/consent (account-level rows, child_id null: they apply to every child).
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ErrorNote, HoldButton, Icon, Speaker, TileGroup } from "../ui/index.ts";
import { defaultTutorFor } from "../../shared/tutors.js";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { Spot } from "../child/art.tsx";
import { ApiError, errText, postJson } from "../app/api.ts";
import { PROMISES } from "../app/Public.tsx";
import { StepFrame } from "./Layout.tsx";
import { useDraft } from "./draft.ts";

/**
 * Step 3 "Our promises, before you sign up" (PRODUCT-DESIGN-V2 §3.2, §6.2; audit #24: the promises came AFTER the
 * account, so their title was false). Four promises with spot art, then Hold to continue (2 s, haptic at the start and
 * the end; "Can't hold? Type the word parent instead"). The hold is the grown-up gate that used to sit on the account
 * step. The teacher's name and pronoun come from the character record of the class chosen in step 1.
 */
export function PromisesStep() {
  const nav = useNavigate();
  const [d] = useDraft();
  const cl = d.child?.classLevel ?? 5;
  const rec = teacherRecord(defaultTutorFor({ class_level: cl }), cl <= 4 ? "b2" : "b3");
  const they = rec.pronouns.subject;
  const rows = [
    { art: "promises/ai-honest", title: `${rec.name} is an AI and says so`, body: aiHonestLine(they) },
    { art: "promises/you-see", title: `You see what ${they} sees`, body: "Every lesson's answers and checks are in the Parent corner, with the evidence behind each claim." },
    { art: "promises/no-ads", title: "No ads, sales calls, loans or EMI", body: PROMISES[0].body },
    { art: "promises/delete", title: "Delete anything, any time", body: PROMISES[2].body },
  ];
  return (
    <StepFrame step="promises" title="Our promises, before you sign up"
      footer={<HoldButton block typedWord="parent" showHint onConfirm={() => nav("/start/phone")}>Hold to continue</HoldButton>}>
      <ul className="promise-list">
        {rows.map((p) => (
          <li key={p.art} className="row promise-li">
            <Spot id={p.art} size={64} fallback={<span className="promise-icon"><Icon name="shield" /></span>} />
            <span className="stack-sm" style={{ flex: 1, gap: 2 }}><strong>{p.title}</strong><span className="muted">{p.body}</span></span>
          </li>
        ))}
      </ul>
      <Link to="/trust" className="block-link">Full text</Link>
    </StepFrame>
  );
}
/** The old name (the route table and older links). */
export const TrustStep = PromisesStep;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Contraction- and agreement-safe: "She tells … she's", "They tell … they're" (a they/them record never reads "they's"). */
export function aiHonestLine(subject: string): string {
  const plural = subject.toLowerCase() === "they";
  return `${cap(subject)} ${plural ? "tell" : "tells"} your child ${subject}${plural ? "'re" : "'s"} a computer teacher, not a person, at the first hello and whenever asked.`;
}

// Each row: sentence + speaker + toggle (§2.2 P5). The spoken text is server-held (CONSENT_SPEECH in
// server/routes/parent.js); keep the two in step when this copy changes.
function Row({ title, body, children, detail, speak }: { title: string; body: string; children: ReactNode; detail?: ReactNode; speak: string }) {
  return (
    <section className="card card-flat stack-sm consent-row">
      <div className="row" style={{ alignItems: "center" }}>
        <h2 className="t-h3" style={{ fontFamily: "var(--font-text)", flex: 1 }}>{title}</h2>
        <Speaker src={`/api/parent/speak?what=consent&row=${speak}`} label={`Listen: ${title}`} />
      </div>
      <p className="muted">{body}</p>
      {detail && <details><summary className="summary">What is kept</summary><div style={{ marginTop: 8 }}>{detail}</div></details>}
      {children}
    </section>
  );
}

export function ConsentStep() {
  const nav = useNavigate();
  const [d, set] = useDraft();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const across = d.learningAcrossDays ?? null;
  const left = [across !== null, typeof d.likes === "boolean", !!d.reportChannel].filter((x) => !x).length;
  const ready = left === 0;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await postJson("/api/consent", { childId: null, grants: { core_tutoring: true, learning_profile: !!across, memory: !!d.likes } });
      set({ consentDone: true });
      nav("/start/child");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return nav("/start/phone?next=/start/consent");
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepFrame step="consent" title="What Taxila may do"
      why="Each one is separate. You can change any of them later in the Parent corner."
      footer={<div className="onb-go">{!ready && <span className="t-note" id="consent-why">{left === 1 ? "1 more to answer" : `${left} more to answer`}</span>}<Button block disabled={!ready || busy} aria-describedby={ready ? undefined : "consent-why"} onClick={save}>{busy ? "Saving" : "Agree and continue"}</Button></div>}>
      <Row speak="core_tutoring" title="Lessons" body="Your child's teacher teaches live and keeps their answers, so you can see what they learned. Needed to use Taxila.">
        <p className="row"><Icon name="tick" /> <strong>Yes</strong> <span className="t-meta">(required)</span></p>
      </Row>
      <Row speak="learning_profile" title="Remember learning across days" body="So the next lesson starts from where your child is, with a check again on a later day."
        detail={<ul className="plain-list"><li>Which topics are practised, got, or secure, with the checks behind them.</li><li>Which ways of explaining worked when checked on a later day.</li><li>With "only this session", each lesson starts fresh and nothing about how your child is taught is kept.</li></ul>}>
        <TileGroup label="Remember learning across days" columns={2} value={across === null ? null : across ? "yes" : "no"}
          onChange={(v) => set({ learningAcrossDays: v === "yes" })}
          options={[{ value: "yes", label: "Yes, remember" }, { value: "no", label: "Only this session" }]} />
        {across === false && <p className="t-note">Each lesson starts fresh. The Garden or Sky map and the Notebook stay hidden.</p>}
      </Row>
      <Row speak="memory" title="Remember what your child says they like" body="Cricket, cooking, a pet's name, used in examples. You can see and delete each one.">
        <TileGroup label="Remember what your child likes" columns={2} value={typeof d.likes === "boolean" ? (d.likes ? "yes" : "no") : null} onChange={(v) => set({ likes: v === "yes" })}
          options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        {d.likes === false && <p className="t-note">Your child's interests won't be used in examples.</p>}
      </Row>
      <Row speak="research" title="Research" body="We do not use your child's data for research now. If that changes, we will ask you here first.">
        <p className="row"><Icon name="cross" /> <strong>Off</strong></p>
      </Row>
      <Row speak="reports" title="Where reports go" body="One short weekly report with what your child can now do and one thing to try at home.">
        <TileGroup label="Where reports go" columns={2} value={d.reportChannel ?? null} onChange={(v) => set({ reportChannel: v })}
          options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "app", label: "Only in the app" }]} />
      </Row>
      <ErrorNote>{err}</ErrorNote>
    </StepFrame>
  );
}
