// More (§6.1 tab), Data (§6.9: delete a child), Help (helplines outside every gate too), PIN change, and
// honest placeholders for the routes whose data does not exist yet (teaching §6.13, PTM §6.8, family,
// plan, saved lessons).
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, ButtonLink, ErrorNote, Field, HoldButton, Icon, PinPad } from "../ui/index.ts";
import { errText, postJson, refreshMe, request } from "../app/api.ts";
import { Helplines } from "../app/Shell.tsx";
import { parentApi } from "./api.ts";
import { ParentShell, useChildren } from "./Shell.tsx";

export function More() {
  const nav = useNavigate();
  const { kids, current } = useChildren();
  const cid = current?.id ?? "";
  const items: { to: string; label: string; sub?: string }[] = [
    { to: `/parent/controls?c=${cid}`, label: "Controls", sub: "Time, hours, language, captions" },
    { to: `/parent/${cid}/teaching`, label: `How she teaches ${current?.first_name ?? ""}` },
    { to: "/parent/ptm", label: "Monthly PTM" },
    { to: "/start/child?add=1", label: "Add a child" },
    { to: "/parent/family", label: "Family", sub: "Co-parent or viewer" },
    { to: "/parent/plan", label: "Plan and billing" },
    { to: "/parent/saved", label: "Saved lessons" },
    { to: "/parent/pin", label: "Change parent PIN" },
    { to: `/parent/data?c=${cid}`, label: "Your data", sub: "See and delete" },
    { to: "/parent/help", label: "Help, grievance and helplines" },
    { to: "/trust", label: "Our promises" },
  ];
  return (
    <ParentShell title="More" child={current} kids={kids} onSwitch={(id) => nav(`/parent/more?c=${id}`)}>
      <h1 className="t-title">More</h1>
      <ul className="link-list big">
        {items.map((i) => (
          <li key={i.label}><Link to={i.to}><span className="stack-sm" style={{ gap: 0 }}><span>{i.label}</span>{i.sub && <span className="t-meta">{i.sub}</span>}</span><Icon name="chevron" size={18} /></Link></li>
        ))}
      </ul>
      <Button variant="quiet" onClick={async () => { await postJson("/api/auth/logout", {}).catch(() => {}); await refreshMe().catch(() => {}); nav("/"); }}>Sign out</Button>
    </ParentShell>
  );
}

export function Data() {
  const nav = useNavigate();
  const { kids, current } = useChildren();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const del = async () => {
    if (!current) return;
    try {
      await request("DELETE", "/api/children", { childId: current.id });
      setDone(current.first_name);
      const me = await refreshMe();
      if (!me?.children.length) nav("/start/child?add=1", { replace: true });
    } catch (e) {
      setErr(errText(e));
    }
  };
  return (
    <ParentShell title="Your data" child={current} kids={kids} onSwitch={(id) => nav(`/parent/data?c=${id}`)}>
      <div className="stack">
        <h1 className="t-title">Your data</h1>
        {done && <p className="note" role="status">{done}'s profile and everything in it has been deleted.</p>}
        {current && !done && (
          <section className="card card-flat stack-sm">
            <h2 className="t-h3 row"><Icon name="trash" /> Delete {current.first_name}'s profile</h2>
            <p>This deletes {current.first_name}'s profile, every lesson, every answer and the evidence behind every skill, and the consent rows for this child. It cannot be undone.</p>
            <HoldButton ms={2000} variant="danger" onConfirm={del} hint="Press and hold">Hold to delete {current.first_name}'s profile</HoldButton>
            <p className="t-meta">Hold for 2 seconds. Letting go early cancels.</p>
          </section>
        )}
        <section className="card card-flat stack-sm">
          <h2 className="t-h3">Coming next</h2>
          <p className="muted">Export everything (PDF and JSON), delete a single lesson, delete only the transcripts, and delete the whole account.</p>
        </section>
        <ErrorNote>{err}</ErrorNote>
      </div>
    </ParentShell>
  );
}

export function Help() {
  const { kids, current } = useChildren();
  return (
    <ParentShell title="Help" child={current} kids={kids}>
      <div className="stack">
        <h1 className="t-title">Help</h1>
        <section className="card card-flat stack-sm">
          <h2 className="t-h3">If a child needs help now</h2>
          <p>Call a free helpline.</p>
          <Helplines />
        </section>
        <section className="card card-flat stack-sm">
          <h2 className="t-h3">Grievance</h2>
          <p className="muted">A named grievance officer and contact will be listed here before launch.</p>
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
  const { kids, current } = useChildren();
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [k, setK] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  return (
    <ParentShell title="Change PIN" child={current} kids={kids}>
      <div className="stack" style={{ maxWidth: 420 }}>
        <h1 className="t-title">Change parent PIN</h1>
        {ok ? <p className="note" role="status">PIN changed.</p> : !pin ? (
          <>
            <p className="muted">{first ? "Enter the same new PIN again." : "Choose a new PIN of 4 to 6 digits."}</p>
            <PinPad label="New PIN" resetKey={k} okLabel={first ? "OK" : "Next"} onComplete={(p) => {
              if (!first) { setFirst(p); setK((x) => x + 1); return; }
              if (p !== first) { setFirst(null); setK((x) => x + 1); setErr("The two PINs were different."); return; }
              setErr(null); setPin(p);
            }} />
          </>
        ) : (
          <form className="stack" onSubmit={async (e) => {
            e.preventDefault();
            try { await parentApi.setPin(pin, password); setOk(true); } catch (e2) { setErr(errText(e2)); setPin(null); setFirst(null); setK((x) => x + 1); }
            setPassword("");
          }}>
            <Field label="Your account password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" disabled={!password}>Change PIN</Button>
          </form>
        )}
        <ErrorNote>{err}</ErrorNote>
        <Button variant="quiet" onClick={() => nav("/parent/more")}>Back</Button>
      </div>
    </ParentShell>
  );
}

const PENDING: Record<string, { title: string; body: string }> = {
  teaching: { title: "How she teaches", body: "The rules she follows for each kind of topic, the later-day checks that changed how she starts, the choices your child made, and their interests. This page fills in after a few lessons with later-day checks." },
  ptm: { title: "Monthly PTM", body: "A 5 to 8 minute voice talk with her about your child's month, in your language, answered only from the evidence. She is an AI and says so at the start. Not available yet." },
  family: { title: "Family", body: "Add a co-parent with full access, or a viewer who gets only the weekly report, by a WhatsApp link. Not available yet." },
  plan: { title: "Plan and billing", body: "Taxila has no paid plan yet. When it does: a monthly rupee price, cancel in two taps, no EMI or loans, and never a free period that turns into paid without you choosing it." },
  saved: { title: "Saved lessons", body: "Lessons saved on this phone for days without internet. Not available yet." },
};

export function Pending({ which }: { which: keyof typeof PENDING }) {
  const { kids, current } = useChildren();
  const { cid } = useParams();
  const p = PENDING[which];
  return (
    <ParentShell title={p.title} child={current} kids={kids}>
      <div className="stack" style={{ maxWidth: 560 }}>
        <h1 className="t-title">{p.title}{which === "teaching" && current ? ` ${current.first_name}` : ""}</h1>
        <p className="t-lead">{p.body}</p>
        <ButtonLink variant="secondary" to={cid ? `/parent?c=${cid}` : "/parent"}>Back to home</ButtonLink>
      </div>
    </ParentShell>
  );
}
