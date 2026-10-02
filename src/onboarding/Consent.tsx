// P3 trust page and P5 consent rows (§2.2). Unbundled purposes; lessons are required; "remember learning
// across days" is an equal-weight choice with nothing preselected (R22); "remember what they like" is off
// by default. Writes POST /api/consent (account-level rows, child_id null: they apply to every child).
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ButtonLink, ErrorNote, Icon, Speaker, TileGroup } from "../ui/index.ts";
import { ApiError, errText, postJson } from "../app/api.ts";
import { PROMISES } from "../app/Public.tsx";
import { StepFrame } from "./Layout.tsx";
import { useDraft } from "./draft.ts";

export function TrustStep() {
  return (
    <StepFrame step="trust" title="Our promises, before you give us anything"
      footer={<ButtonLink to="/start/consent" block>Continue</ButtonLink>}>
      <ul className="promise-list">
        {PROMISES.map((p) => (
          <li key={p.title} className="row promise-li">
            <span className="promise-icon"><Icon name={p.icon} /></span>
            <span className="stack-sm" style={{ flex: 1, gap: 2 }}><strong>{p.title}</strong><span className="muted">{p.body}</span></span>
          </li>
        ))}
      </ul>
      <Link to="/trust" className="block-link">Full text</Link>
    </StepFrame>
  );
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
  const ready = across !== null && typeof d.likes === "boolean" && !!d.reportChannel;

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
    <StepFrame step="consent" title="What she may keep"
      why="Each one is separate. You can change any of them later in the Parent corner."
      footer={<Button block disabled={!ready || busy} onClick={save}>{busy ? "Saving" : "Save and continue"}</Button>}>
      <Row speak="core_tutoring" title="Lessons" body="She teaches your child live and keeps their answers, so you can see what they learned. Needed to use Taxila.">
        <p className="row"><Icon name="tick" /> <strong>Yes</strong> <span className="t-meta">(required)</span></p>
      </Row>
      <Row speak="learning_profile" title="Remember learning across days" body="So the next lesson starts from where your child is, and she checks again on a later day."
        detail={<ul className="plain-list"><li>Which topics are practised, got, or secure, with the checks behind them.</li><li>Which ways of explaining worked when checked on a later day.</li><li>With "only this session", each lesson starts fresh and nothing about how she teaches is kept.</li></ul>}>
        <TileGroup label="Remember learning across days" columns={2} value={across === null ? null : across ? "yes" : "no"}
          onChange={(v) => set({ learningAcrossDays: v === "yes" })}
          options={[{ value: "yes", label: "Yes, remember" }, { value: "no", label: "Only this session" }]} />
      </Row>
      <Row speak="memory" title="Remember what your child says they like" body="Cricket, cooking, a pet's name. She uses it in examples. You can see and delete each one.">
        <TileGroup label="Remember what your child likes" columns={2} value={typeof d.likes === "boolean" ? (d.likes ? "yes" : "no") : null} onChange={(v) => set({ likes: v === "yes" })}
          options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      </Row>
      <Row speak="research" title="Research" body="We do not use your child's data for research now. If that changes, we will ask you here first.">
        <p className="row"><Icon name="cross" /> <strong>Off</strong></p>
      </Row>
      <Row speak="reports" title="Where reports go" body="One short weekly report with what your child can now do and one thing to try at home.">
        <TileGroup label="Where reports go" columns={2} value={d.reportChannel ?? null} onChange={(v) => set({ reportChannel: v })}
          options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "app", label: "Only in the app" }]} />
      </Row>
      {!ready && <p className="t-note">Choose an answer for "Remember learning across days", "Remember what your child likes" and "Where reports go" to continue.</p>}
      <ErrorNote>{err}</ErrorNote>
    </StepFrame>
  );
}
