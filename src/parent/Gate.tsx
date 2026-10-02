// Guardian gate (§6.2): set a PIN if none exists, else unlock with it. The unlock is server-side and per
// session (server/routes/parent.js), so this component is only the face of it: if any parent read comes
// back 403 { gate }, `relock()` shows the pad again. Wrong tries blame nobody; after 5 the corner rests
// 15 min (server-enforced). Never a maths puzzle.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorNote, Field, Icon, PinPad } from "../ui/index.ts";
import { ApiError, errText } from "../app/api.ts";
import { Brand } from "../app/Shell.tsx";
import { lockBeacon, parentApi, type GateState } from "./api.ts";
// The gate also renders inside onboarding (GateIfPin), outside the Parent-corner chunk: its styles travel with it.
import "../styles/parent.css";

type Phase = { k: "loading" } | { k: "signedOut" } | { k: "set" } | { k: "locked" } | { k: "wait"; until: string | null } | { k: "open" } | { k: "forgot" } | { k: "error"; msg: string };

const GateCtx = createContext<{ relock: () => void; lockNow: () => Promise<void> }>({ relock: () => {}, lockNow: async () => {} });
export const useGate = () => useContext(GateCtx);

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "a little while");
const fmtWhen = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" });

/**
 * Paths that stay inside the same grown-up visit: moving between them must not lock (the next screen is
 * gated too). Anything else (the picker, a child screen, the landing page) locks the corner on the way out.
 */
const GATED_PATH = /^\/(parent(\/|$)|start\/(child|controls|consent|handover)(\/|$|\?))/;
let pendingLock: number | null = null;

/**
 * Lock on every exit (review blocker): unmount (Back, Brand link, navigation to /who or a child screen),
 * pagehide, and the tab going to the background. The server unlock is per session and would otherwise stay
 * open for UNLOCK_MIN after the grown-up has gone. The unmount lock is deferred one task so a StrictMode
 * remount or a move to another gated screen cancels it.
 */
function useLockOnExit(open: boolean, relock: () => void) {
  useEffect(() => {
    if (!open) return;
    if (pendingLock) { window.clearTimeout(pendingLock); pendingLock = null; }
    const away = () => { lockBeacon(); relock(); };
    const onVis = () => { if (document.visibilityState === "hidden") away(); };
    window.addEventListener("pagehide", away);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", away);
      document.removeEventListener("visibilitychange", onVis);
      pendingLock = window.setTimeout(() => { pendingLock = null; if (!GATED_PATH.test(window.location.pathname)) lockBeacon(); }, 0);
    };
  }, [open, relock]);
}

export function Gate({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>({ k: "loading" });
  const [msg, setMsg] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [first, setFirst] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fromState = (g: GateState): Phase => {
    setPending(g.pendingResetAt ?? null);
    return !g.hasPin ? { k: "set" } : g.unlocked ? { k: "open" } : g.lockedUntil ? { k: "wait", until: g.lockedUntil } : { k: "locked" };
  };
  const check = useCallback(() => {
    parentApi.pin().then((g) => setPhase(fromState(g)), (e) => {
      if (e instanceof ApiError && e.status === 401) setPhase({ k: "signedOut" });
      else setPhase({ k: "error", msg: errText(e) });
    });
  }, []);
  useEffect(check, [check]);

  const relock = useCallback(() => { setMsg(null); setResetKey((k) => k + 1); setPhase((p) => (p.k === "open" ? { k: "locked" } : p)); }, []);
  const lockNow = useCallback(async () => { await parentApi.lock().catch(() => {}); nav("/who"); }, [nav]);
  useLockOnExit(phase.k === "open", relock);

  const gateBody = (e: unknown) => (e instanceof ApiError ? e.body : null) as { gate?: string; lockedUntil?: string; triesLeft?: number } | null;
  const unlock = async (pin: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setPhase(fromState(await parentApi.unlock(pin)));
    } catch (e) {
      const body = gateBody(e);
      if (body?.gate === "wait") setPhase({ k: "wait", until: body.lockedUntil ?? null });
      else if (body?.gate === "set") setPhase({ k: "set" });
      else setMsg(e instanceof ApiError && e.status === 403 ? "That is not the PIN. Try again." : errText(e));
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  // A first PIN chosen here (not in onboarding) needs the account password: whoever reaches the gate first,
  // possibly the child through the parent door, must not be able to claim the corner.
  const setPin = async (pin: string) => {
    if (!first) { setFirst(pin); setResetKey((k) => k + 1); return; }
    if (pin !== first) { setFirst(null); setMsg("The two PINs were different. Please choose again."); setResetKey((k) => k + 1); return; }
    setBusy(true);
    try {
      setPhase(fromState(await parentApi.setPin(pin, password)));
      setMsg(null);
    } catch (e) {
      const body = gateBody(e);
      if (body?.gate === "wait") setPhase({ k: "wait", until: body.lockedUntil ?? null });
      setMsg(errText(e));
      setFirst(null);
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  if (phase.k === "open") return <GateCtx.Provider value={{ relock, lockNow }}>{children}</GateCtx.Provider>;
  if (phase.k === "signedOut") return <Navigate to={`/start/phone?login=1&next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;

  return (
    <div className="gate">
      <header className="topbar col">
        <Brand to="/who" />
        <span className="spacer" />
        <button type="button" className="iconbtn" onClick={() => nav("/who")} aria-label="Close and go back"><Icon name="close" /></button>
      </header>
      <main id="main" className="col stack gate-main" style={{ alignItems: "center", textAlign: "center" }}>
        <span className="gate-icon" aria-hidden="true"><Icon name="lock" size={32} /></span>
        {phase.k === "loading" && <div className="spinner" role="status" aria-label="Checking" />}
        {phase.k === "error" && <ErrorNote>{phase.msg}</ErrorNote>}
        {phase.k === "locked" && (
          <>
            <h1 className="t-title">Parent corner</h1>
            <p className="muted">For grown-ups. Enter your PIN.</p>
            {pending && (
              <p className="note" role="status" style={{ textAlign: "left" }}>
                Someone asked to reset the PIN with the account password. The new PIN starts working on {fmtWhen(pending)}.
                If that was not you, enter the current PIN now: that cancels the reset.
              </p>
            )}
            <PinPad label="Parent PIN" onComplete={unlock} resetKey={resetKey} disabled={busy} />
            <p className="field-msg" aria-live="assertive">{msg}</p>
            <Button variant="quiet" small onClick={() => { setMsg(null); setPhase({ k: "forgot" }); }}>Forgot the PIN?</Button>
          </>
        )}
        {phase.k === "set" && (
          <>
            <h1 className="t-title">{first ? "Enter the same PIN again" : "Choose a parent PIN"}</h1>
            <p className="muted">First your account password, then 4 to 6 digits your child does not know. Not your phone's unlock code.</p>
            <div style={{ width: "100%", maxWidth: 360, textAlign: "left" }}>
              <Field label="Account password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <PinPad label={first ? "Repeat the PIN" : "New PIN"} onComplete={setPin} resetKey={resetKey} disabled={busy || !password} okLabel={first ? "OK" : "Next"} />
            <p className="field-msg" aria-live="assertive">{msg}</p>
          </>
        )}
        {phase.k === "wait" && (
          <>
            <h1 className="t-title">The Parent corner is resting</h1>
            <p className="muted">Too many tries. It opens again after {fmtTime(phase.until)}.</p>
            <Button variant="secondary" onClick={() => nav("/who")}>Back</Button>
          </>
        )}
        {phase.k === "forgot" && <ForgotPin onDone={(g) => { setPhase(fromState(g)); setMsg(null); }} onCancel={() => setPhase({ k: "locked" })}
          onWait={(until) => setPhase({ k: "wait", until })} />}
        <Link to="/help" className="t-body gate-help">Help and helplines</Link>
      </main>
    </div>
  );
}

/**
 * Onboarding screens that change a child's profile, consent or controls (/start/child, /controls, /consent):
 * open while no PIN exists (first run), behind the Gate once one does (§2.3: "Add a child" is
 * behind the gate). A layout route, so moving between these steps keeps one unlock.
 */
export function GateIfPin() {
  const { pathname } = useLocation();
  const [has, setHas] = useState<boolean | null>(null);
  // Re-checked on every step change, and sticky once true: a PIN set at P7 gates a Back to P6/P7.
  useEffect(() => { parentApi.pin().then((g) => setHas((h) => h || g.hasPin), () => setHas((h) => h ?? false)); }, [pathname]);
  if (has === null) return <div className="col center-fill"><div className="spinner" role="status" aria-label="Checking" /></div>;
  return has ? <Gate><Outlet /></Gate> : <Outlet />;
}

function ForgotPin({ onDone, onCancel, onWait }: { onDone: (g: GateState) => void; onCancel: () => void; onWait: (until: string | null) => void }) {
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="stack" style={{ width: "100%", textAlign: "left" }} onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      setErr(null);
      try { onDone(await parentApi.resetPin(pin, password)); } catch (e2) {
        const b = (e2 instanceof ApiError ? e2.body : null) as { gate?: string; lockedUntil?: string } | null;
        if (b?.gate === "wait") onWait(b.lockedUntil ?? null); else setErr(errText(e2));
      } finally { setBusy(false); setPassword(""); }
    }}>
      <h1 className="t-title">Set a new PIN</h1>
      <p className="muted">Enter your account password, then a new PIN. For safety the new PIN starts working 24 hours later,
        and this screen shows that a reset is waiting. Entering the current PIN before then cancels it. Each try is recorded.</p>
      <Field label="Account password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Field label="New PIN (4 to 6 digits)" type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
      <ErrorNote>{err}</ErrorNote>
      <div className="row">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy || pin.length < 4 || !password}>Save new PIN</Button>
      </div>
    </form>
  );
}
