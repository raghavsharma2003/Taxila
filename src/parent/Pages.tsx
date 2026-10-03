// More (the phone's fourth tab), Children, Data and privacy (Your choices, Download everything, delete a child's
// profile, DELETE MY ACCOUNT), Help and safety, Change PIN (PRODUCT-DESIGN-V2 §6.5.5), and the public helpline page.
// Every consent-grade act asks for the account password, and its errors sit on the password field in sentences (§4.7).
// Pages that would hold nothing real yet (Monthly talk, Family, Plan, Saved lessons) are not linked at all (P6).
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Art, Button, HoldButton, Icon, PinPad, Speaker, TileGroup } from "../ui/index.ts";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { loadMe, postJson, refreshMe, type ChildRow, type Me } from "../app/api.ts";
import { bandForClass } from "../app/band.ts";
import { Helplines } from "../app/Shell.tsx";
import { isRelock, parentApi } from "./api.ts";
import { BOARD_NAME, isPasswordError, parentError } from "./copy.ts";
import { PasswordAgain } from "./fields.tsx";
import { useGate } from "./Gate.tsx";
import { PageState, ParentShell, RowLink, useChildren } from "./Shell.tsx";

const teacherNameOf = (c: ChildRow) => (c as ChildRow & { teacher_name?: string | null }).teacher_name || teacherRecord(c.teacher_id, bandForClass(c.class_level)).name;

export function More() {
  const nav = useNavigate();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const qs = cid ? `?c=${cid}` : "";
  return (
    <ParentShell title="More" child={current} kids={kids}>
      <h1 className="pa-h1">More</h1>
      <ul className="pa-list pa-more">
        <li><RowLink to={`/parent/notes${qs}`} sub="Today's note and the weekly letter">Notes</RowLink></li>
        <li><RowLink to={`/parent/controls${qs}`} sub="Daily limit, lesson hours, language, words on screen">Controls</RowLink></li>
        <li><RowLink to={`/parent/children${qs}`} sub="Add a child, switch child">Children</RowLink></li>
        <li><RowLink to={`/parent/data${qs}`} sub="Your choices, download, delete">Data and privacy</RowLink></li>
        <li><RowLink to={`/parent/help${qs}`} sub="Helplines, what happens if a child is worried, Forgot PIN">Help and safety</RowLink></li>
        <li><RowLink to={`/parent/pin${qs}`}>Change parent PIN</RowLink></li>
        <li><RowLink to="/trust">Our promises</RowLink></li>
      </ul>
      <Button variant="quiet" onClick={async () => { await postJson("/api/auth/logout", {}).catch(() => {}); await refreshMe().catch(() => {}); nav("/"); }}>Sign out</Button>
    </ParentShell>
  );
}

/** Delete one child's profile: the account password, then a 2 s hold (§6.5.5). */
function DeleteChild({ child, onDone }: { child: ChildRow; onDone: (name: string) => void }) {
  const { relock } = useGate();
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const del = async () => {
    if (!password) { setPwErr("Enter your account password."); return; }
    setBusy(true); setErr(null); setPwErr(null);
    try {
      await parentApi.deleteChild(child.id, password);
      await refreshMe();
      onDone(child.first_name);
    } catch (e) {
      if (isRelock(e)) { relock(); return; }
      if (isPasswordError(e)) setPwErr(parentError(e)); else setErr(parentError(e));
    } finally { setBusy(false); setPassword(""); }
  };
  return (
    <div className="pa-danger" data-delete-child={child.id}>
      <p>This deletes {child.first_name}'s profile, every lesson, every answer, the evidence behind every skill and {child.first_name}'s notes. It can't be undone.</p>
      <PasswordAgain value={password} onChange={(v) => { setPassword(v); if (v) setPwErr(null); }} error={pwErr} id={`pw-child-${child.id}`} />
      <HoldButton ms={2000} variant="destructive" onConfirm={del} disabled={busy || !password} showHint>Hold to delete {child.first_name}'s profile</HoldButton>
      {err && <p className="pa-form-err" role="alert">{err}</p>}
    </div>
  );
}

export function Children() {
  const nav = useNavigate();
  const { kids, current, reload } = useChildren();
  const [open, setOpen] = useState<string | null>(null);
  const [gone, setGone] = useState<string | null>(null);
  return (
    <ParentShell title="Children" child={current} kids={kids}>
      <h1 className="pa-h1">Children</h1>
      {gone && <p className="pa-note" role="status">{gone}'s profile and everything in it has been deleted.</p>}
      {!kids ? <PageState err={null} loading /> : (
        <div className="pa-stack">
          {kids.length === 0 && <p className="pa-lead">There's no child profile on this account yet.</p>}
          <ul className="pa-kids">
            {kids.map((k) => (
              <li key={k.id} className="pa-card pa-kid">
                <div className="pa-kid-row">
                  <Art id={`avatars/${k.avatar ?? "none"}`} className="pa-kid-avatar" alt="" fallback={<span className="pa-kid-disc" aria-hidden="true">{k.first_name.slice(0, 1)}</span>} />
                  <span className="pa-kid-text">
                    <strong>{k.first_name}</strong>
                    <span className="pa-meta">Class {k.class_level} · {BOARD_NAME[k.board] ?? (k.board ? String(k.board).toUpperCase() : "CBSE")} · Teacher: {teacherNameOf(k)}</span>
                  </span>
                </div>
                <div className="pa-actions">
                  <Button small variant="secondary" onClick={() => nav(`/parent?c=${k.id}`)}>See {k.first_name}'s week</Button>
                  <Button small variant="quiet" aria-expanded={open === k.id} onClick={() => setOpen(open === k.id ? null : k.id)}>Delete profile</Button>
                </div>
                {open === k.id && <DeleteChild child={k} onDone={(n) => { setGone(n); setOpen(null); reload(); }} />}
              </li>
            ))}
          </ul>
          <div className="pa-actions"><Button onClick={() => nav("/start/class?add=1")}><Icon name="plus" size={20} /> Add a child</Button></div>
        </div>
      )}
    </ParentShell>
  );
}

// ───────────────────────────── Data and privacy ─────────────────────────────

type Purpose = "learning_profile" | "memory";
const CHOICES: { purpose: Purpose; title: string; yes: string; no: string; effectYes: string; effectNo: (n: string) => string }[] = [
  { purpose: "learning_profile", title: "Remember learning across days", yes: "Yes, remember", no: "Only this session",
    effectYes: "The next lesson starts from where your child is, and a skill is checked again on a later day.",
    effectNo: () => "Each lesson starts fresh. The Garden or Sky map and the Notebook stay hidden." },
  { purpose: "memory", title: "Remember what your child likes", yes: "Yes", no: "No",
    effectYes: "Interests your child mentions (cricket, a pet's name) are used in examples.",
    effectNo: (t) => `${t} won't use your child's interests in examples.` },
];

function currentGrant(me: Me | null, childId: string | null, purpose: string): boolean | null {
  if (!me) return null;
  const rows = me.consents.filter((c) => c.purpose === purpose && (c.child_id === childId || c.child_id === null));
  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return rows[0] ? rows[0].granted : null;
}

function Choice({ c, me, childId, teacherName, onSaved }: { c: (typeof CHOICES)[number]; me: Me | null; childId: string | null; teacherName: string; onSaved: () => void }) {
  const { relock } = useGate();
  const now = currentGrant(me, childId, c.purpose);
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState<"yes" | "no" | null>(null);
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!pick) return;
    if (!password) { setPwErr("Enter your account password."); return; }
    setBusy(true); setErr(null); setPwErr(null);
    try {
      await parentApi.setConsent(null, { [c.purpose]: pick === "yes" }, password);
      await refreshMe();
      setEditing(false); onSaved();
    } catch (e) {
      if (isRelock(e)) { relock(); return; }
      if (isPasswordError(e)) setPwErr(parentError(e)); else setErr(parentError(e));
    } finally { setBusy(false); setPassword(""); }
  };
  return (
    <li className="pa-choice" data-purpose={c.purpose}>
      <div className="pa-choice-head">
        <strong>{c.title}</strong>
        <Speaker src={`/api/parent/speak?what=consent&row=${c.purpose}`} label={`Listen: ${c.title}`} />
      </div>
      <p>Now: <strong>{now === null ? "Not answered" : now ? c.yes : c.no}</strong></p>
      <p className="pa-effect">{now === false ? c.effectNo(teacherName) : c.effectYes}</p>
      {!editing ? <Button small variant="secondary" onClick={() => { setEditing(true); setPick(now === null ? null : now ? "yes" : "no"); }}>Change</Button> : (
        <div className="pa-stack-sm">
          <TileGroup label={c.title} columns={2} value={pick} onChange={(v) => setPick(v as "yes" | "no")}
            options={[{ value: "yes", label: c.yes }, { value: "no", label: c.no }]} />
          {pick && <p className="pa-effect">{pick === "no" ? c.effectNo(teacherName) : c.effectYes}</p>}
          <PasswordAgain value={password} onChange={(v) => { setPassword(v); if (v) setPwErr(null); }} error={pwErr} id={`pw-${c.purpose}`} />
          <div className="pa-actions">
            <Button small onClick={save} disabled={busy || !pick}>Save</Button>
            <Button small variant="quiet" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          {err && <p className="pa-form-err" role="alert">{err}</p>}
        </div>
      )}
    </li>
  );
}

function Download() {
  const { relock } = useGate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!password) { setPwErr("Enter your account password."); return; }
    setBusy(true); setErr(null); setPwErr(null);
    try {
      const { blob, name } = await parentApi.exportAll(password);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setDone(true); setOpen(false);
    } catch (e) {
      if (isRelock(e)) { relock(); return; }
      if (isPasswordError(e)) setPwErr(parentError(e)); else setErr(parentError(e));
    } finally { setBusy(false); setPassword(""); }
  };
  return (
    <section className="pa-card" aria-labelledby="pa-dl-h" id="download">
      <h2 id="pa-dl-h" className="pa-h2">Download everything</h2>
      <p>One file with your account, each child's profile, lessons, the checks behind every skill, and what Taxila remembers. For Class 5 to 9 the word-for-word conversation is not included.</p>
      {done && <p className="pa-row" role="status"><Icon name="tick" size={20} /> Your file is downloading.</p>}
      {!open ? <Button variant="secondary" onClick={() => setOpen(true)}>Download everything</Button> : (
        <div className="pa-stack-sm">
          <PasswordAgain value={password} onChange={(v) => { setPassword(v); if (v) setPwErr(null); }} error={pwErr} id="pw-download" />
          <div className="pa-actions">
            <Button onClick={go} disabled={busy}>{busy ? "Preparing" : "Download"}</Button>
            <Button variant="quiet" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
          {err && <p className="pa-form-err" role="alert">{err}</p>}
        </div>
      )}
    </section>
  );
}

/**
 * Delete my account (§6.5.5, B3-A5): what goes, the account password, a confirmation step with a 2 s hold, then a
 * receipt. Deleting is immediate; backups expire within 7 days (decision dek-in-pitr-database).
 */
export function DeleteAccount({ kids }: { kids: ChildRow[] }) {
  const { relock, erased } = useGate();
  const [step, setStep] = useState<"intro" | "password" | "confirm">("intro");
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const names = kids.map((k) => k.first_name);
  const who = names.length === 0 ? "" : names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  const del = async () => {
    setBusy(true); setErr(null);
    try {
      const out = await parentApi.deleteAccount(password);
      await refreshMe().catch(() => {});
      erased(out.receipt);
    } catch (e) {
      if (isRelock(e)) { relock(); return; }
      if (isPasswordError(e)) { setPwErr(parentError(e)); setStep("password"); } else setErr(parentError(e));
    } finally { setBusy(false); }
  };
  return (
    <section className="pa-card pa-danger-card" aria-labelledby="pa-del-h" id="delete-account" data-step={step}>
      <h2 id="pa-del-h" className="pa-h2">Delete my account</h2>
      <p>This deletes your parent account{who ? `, ${who}'s ${names.length === 1 ? "profile" : "profiles"}` : ""}, every lesson, every answer, the evidence behind every skill, every note, your choices and the parent PIN. You'll be signed out on every phone.</p>
      <p className="pa-effect">It's removed now. Backups expire within 7 days. It can't be undone.</p>
      {step === "intro" && <Button variant="destructive" onClick={() => setStep("password")}>Delete my account</Button>}
      {step === "password" && (
        <form className="pa-stack-sm" noValidate onSubmit={(e) => { e.preventDefault(); if (!password) { setPwErr("Enter your account password."); return; } setStep("confirm"); }}>
          <PasswordAgain value={password} onChange={(v) => { setPassword(v); if (v) setPwErr(null); }} error={pwErr} id="pw-account" hint="Step 1 of 2. It is checked when you confirm." autoFocus />
          <div className="pa-actions">
            <Button type="submit">Continue</Button>
            <Button variant="quiet" onClick={() => { setStep("intro"); setPassword(""); }}>Cancel</Button>
          </div>
        </form>
      )}
      {step === "confirm" && (
        <div className="pa-stack-sm">
          <p className="pa-confirm"><strong>Step 2 of 2.</strong> Hold the button for 2 seconds to delete everything{who ? ` for ${who}` : ""}. Letting go early cancels.</p>
          <HoldButton ms={2000} variant="destructive" onConfirm={del} disabled={busy} showHint>Hold to delete my account</HoldButton>
          <Button variant="quiet" onClick={() => { setStep("intro"); setPassword(""); }}>Cancel, keep my account</Button>
          {err && <p className="pa-form-err" role="alert">{err}</p>}
        </div>
      )}
    </section>
  );
}

export function Data() {
  const loc = useLocation();
  const { kids, current, reload } = useChildren();
  const [me, setMe] = useState<Me | null>(null);
  const [n, setN] = useState(0);
  const [gone, setGone] = useState<string | null>(null);
  const [delChild, setDelChild] = useState(false);
  useEffect(() => { loadMe().then(setMe, () => setMe(null)); }, [n]);
  useEffect(() => {
    if (!loc.hash) return;
    const t = window.setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ block: "start" }), 50);
    return () => window.clearTimeout(t);
  }, [loc.hash, me]);
  const teacherName = current ? teacherNameOf(current) : "Your child's teacher";
  return (
    <ParentShell title="Data and privacy" child={current} kids={kids}>
      <h1 className="pa-h1">Data and privacy</h1>
      {gone && <p className="pa-note" role="status">{gone}'s profile and everything in it has been deleted.</p>}
      <div className="pa-stack">
        <section className="pa-card" aria-labelledby="pa-choices-h" id="choices">
          <h2 id="pa-choices-h" className="pa-h2">Your choices</h2>
          {kids && kids.length > 1 && <p className="pa-meta">These choices are for all your children.</p>}
          <ul className="pa-choices">
            <li className="pa-choice" data-purpose="core_tutoring">
              <div className="pa-choice-head"><strong>Lessons</strong><Speaker src="/api/parent/speak?what=consent&row=core_tutoring" label="Listen: Lessons" /></div>
              <p>Now: <strong>Yes</strong> (needed to use Taxila)</p>
              <p className="pa-effect">Turning lessons off is the same as deleting your account. <Link to="#delete-account" onClick={() => document.getElementById("delete-account")?.scrollIntoView()}>Delete my account</Link></p>
            </li>
            {CHOICES.map((c) => <Choice key={c.purpose} c={c} me={me} childId={current?.id ?? null} teacherName={teacherName} onSaved={() => setN((x) => x + 1)} />)}
          </ul>
        </section>
        <Download />
        {current && (
          <section className="pa-card" aria-labelledby="pa-delchild-h" id="delete-child">
            <h2 id="pa-delchild-h" className="pa-h2">Delete {current.first_name}'s profile</h2>
            {!delChild ? <Button variant="secondary" onClick={() => setDelChild(true)}>Delete {current.first_name}'s profile</Button>
              : <DeleteChild child={current} onDone={(nm) => { setGone(nm); setDelChild(false); reload(); }} />}
          </section>
        )}
        <section className="pa-card" aria-labelledby="pa-pin-h">
          <h2 id="pa-pin-h" className="pa-h2">Parent PIN</h2>
          <RowLink to={`/parent/pin${current ? `?c=${current.id}` : ""}`}>Change parent PIN</RowLink>
        </section>
        {kids && <DeleteAccount kids={kids} />}
      </div>
    </ParentShell>
  );
}

// ───────────────────────────── Help and safety ─────────────────────────────

export function Help() {
  const nav = useNavigate();
  const { lockNow } = useGate();
  const { kids, current } = useChildren();
  const name = current?.first_name ?? "your child";
  const T = current ? teacherNameOf(current) : "The teacher";
  return (
    <ParentShell title="Help and safety" child={current} kids={kids}>
      <h1 className="pa-h1">Help and safety</h1>
      <div className="pa-stack">
        <section className="pa-card" aria-labelledby="pa-help-now">
          <h2 id="pa-help-now" className="pa-h2">If a child needs help now</h2>
          <p>These calls are free, any time.</p>
          <div className="pa-actions">
            <a className="btn btn-secondary" href="tel:1098">Call Childline 1098</a>
            <a className="btn btn-secondary" href="tel:14416">Call Tele-MANAS 14416</a>
          </div>
        </section>
        <section className="pa-card" aria-labelledby="pa-worry-h" id="alert">
          <h2 id="pa-worry-h" className="pa-h2">When a child says something worrying</h2>
          <ul className="pa-steps">
            <li>{T} stops the lesson at once and shows {name} the helplines and "Talk to a grown-up at home".</li>
            <li>{T} never asks {name} to explain, and never keeps it a secret from you.</li>
            <li>Taxila's safeguarding team is told, and a person looks at what happened. If they need to reach you, they will.</li>
            <li>Lessons may pause while they look. {name} sees a calm screen with the helplines, never a warning.</li>
          </ul>
          <p className="pa-effect">What to do: find a quiet moment, ask {name} how they are, and listen. If {name} might be in danger, call Childline 1098.</p>
        </section>
        <section className="pa-card" aria-labelledby="pa-ai-h">
          <h2 id="pa-ai-h" className="pa-h2">{T} is an AI</h2>
          <p>{T} is a computer program, not a person, and says so to {name}. You see what {name} learns here.</p>
          <RowLink to="/trust">Our promises</RowLink>
        </section>
        <section className="pa-card" aria-labelledby="pa-forgot-h">
          <h2 id="pa-forgot-h" className="pa-h2">Forgot PIN?</h2>
          <p>Set a new PIN with your account password. It starts working 24 hours later, and the gate shows that a reset is waiting.</p>
          <Button variant="secondary" onClick={async () => { await lockNow().catch(() => {}); nav("/parent?forgot=1"); }}>Forgot PIN?</Button>
        </section>
      </div>
    </ParentShell>
  );
}

/** Public helpline page outside the gate: the Parent corner's help route is gated, helplines must not be. */
export function PublicHelp() {
  return (
    <main className="col stack" style={{ paddingBlock: "var(--space-5)" }}>
      <h1 className="t-title">If a child needs help now</h1>
      <Helplines />
      <Link to="/">Taxila home</Link>
    </main>
  );
}

export function ChangePin() {
  const nav = useNavigate();
  const { relock } = useGate();
  const { kids, current } = useChildren();
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [first, setFirst] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [k, setK] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const back = `/parent/data${current ? `?c=${current.id}` : ""}`;
  let body: ReactNode;
  if (ok) body = <p className="pa-note" role="status"><Icon name="tick" size={20} /> PIN changed. Use the new PIN next time.</p>;
  else if (!pin) {
    body = (
      <div className="pa-gate-pad">
        <p className="pa-lead">{first ? "Enter the same new PIN again." : "Choose a new PIN of 4 to 6 digits."}</p>
        <PinPad label={first ? "Confirm the new PIN" : "New PIN"} resetKey={k} okLabel={first ? "OK" : "Next"} onComplete={(p) => {
          if (!first) { setFirst(p); setErr(null); setK((x) => x + 1); return; }
          if (p !== first) { setFirst(null); setK((x) => x + 1); setErr("The PINs don't match. Try again."); return; }
          setErr(null); setPin(p);
        }} />
        <p className="pa-gate-msg" aria-live="assertive">{err}</p>
      </div>
    );
  } else {
    body = (
      <form className="pa-stack-sm" noValidate onSubmit={async (e) => {
        e.preventDefault();
        if (!password) { setPwErr("Enter your account password."); return; }
        try { await parentApi.setPin(pin, password); setOk(true); } catch (e2) {
          if (isRelock(e2)) { relock(); return; }
          if (isPasswordError(e2)) setPwErr(parentError(e2));
          else { setErr(parentError(e2)); setPin(null); setFirst(null); setK((x) => x + 1); }
        }
        setPassword("");
      }}>
        <PasswordAgain value={password} onChange={(v) => { setPassword(v); if (v) setPwErr(null); }} error={pwErr} autoFocus id="pw-pin" />
        <div className="pa-actions"><Button type="submit">Change PIN</Button></div>
      </form>
    );
  }
  return (
    <ParentShell title="Change PIN" child={current} kids={kids} noTabs>
      <h1 className="pa-h1">Change parent PIN</h1>
      <div className="pa-stack" style={{ maxWidth: 420 }}>
        {body}
        <Button variant="quiet" onClick={() => nav(back)}>Back</Button>
      </div>
    </ParentShell>
  );
}
