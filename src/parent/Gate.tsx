// Guardian gate (§6.2): set a PIN if none exists, else unlock with it. The unlock is server-side and per
// session (server/routes/parent.js), so this component is only the face of it: if any parent read comes
// back 403 { gate }, `relock()` shows the pad again. Wrong tries blame nobody; after 5 the corner rests
// 15 min (server-enforced). Never a maths puzzle.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorNote, Field, Icon, PinPad } from "../ui/index.ts";
import { ApiError, errText } from "../app/api.ts";
import { Brand } from "../app/Shell.tsx";
import { parentApi, type GateState } from "./api.ts";

type Phase = { k: "loading" } | { k: "signedOut" } | { k: "set" } | { k: "locked" } | { k: "wait"; until: string | null } | { k: "open" } | { k: "forgot" } | { k: "error"; msg: string };

const GateCtx = createContext<{ relock: () => void; lockNow: () => Promise<void> }>({ relock: () => {}, lockNow: async () => {} });
export const useGate = () => useContext(GateCtx);

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "a little while");

export function Gate({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>({ k: "loading" });
  const [msg, setMsg] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [first, setFirst] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fromState = (g: GateState): Phase => (!g.hasPin ? { k: "set" } : g.unlocked ? { k: "open" } : g.lockedUntil ? { k: "wait", until: g.lockedUntil } : { k: "locked" });
  const check = useCallback(() => {
    parentApi.pin().then((g) => setPhase(fromState(g)), (e) => {
      if (e instanceof ApiError && e.status === 401) setPhase({ k: "signedOut" });
      else setPhase({ k: "error", msg: errText(e) });
    });
  }, []);
  useEffect(check, [check]);

  const relock = useCallback(() => { setMsg(null); setResetKey((k) => k + 1); setPhase({ k: "locked" }); }, []);
  const lockNow = useCallback(async () => { await parentApi.lock().catch(() => {}); nav("/who"); }, [nav]);

  const unlock = async (pin: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setPhase(fromState(await parentApi.unlock(pin)));
    } catch (e) {
      const body = (e instanceof ApiError ? e.body : null) as { gate?: string; lockedUntil?: string } | null;
      if (body?.gate === "wait") setPhase({ k: "wait", until: body.lockedUntil ?? null });
      else if (body?.gate === "set") setPhase({ k: "set" });
      else setMsg(e instanceof ApiError && e.status === 403 ? "That is not the PIN. Try again." : errText(e));
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const setPin = async (pin: string) => {
    if (!first) { setFirst(pin); setResetKey((k) => k + 1); return; }
    if (pin !== first) { setFirst(null); setMsg("The two PINs were different. Please choose again."); setResetKey((k) => k + 1); return; }
    setBusy(true);
    try {
      setPhase(fromState(await parentApi.setPin(pin)));
      setMsg(null);
    } catch (e) {
      setMsg(errText(e));
      setFirst(null);
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
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
            <PinPad label="Parent PIN" onComplete={unlock} resetKey={resetKey} disabled={busy} />
            <p className="field-msg" aria-live="assertive">{msg}</p>
            <Button variant="quiet" small onClick={() => { setMsg(null); setPhase({ k: "forgot" }); }}>Forgot the PIN?</Button>
          </>
        )}
        {phase.k === "set" && (
          <>
            <h1 className="t-title">{first ? "Enter the same PIN again" : "Choose a parent PIN"}</h1>
            <p className="muted">4 to 6 digits your child does not know. Not your phone's unlock code.</p>
            <PinPad label={first ? "Repeat the PIN" : "New PIN"} onComplete={setPin} resetKey={resetKey} disabled={busy} okLabel={first ? "OK" : "Next"} />
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
        {phase.k === "forgot" && <ForgotPin onDone={(g) => { setPhase(fromState(g)); setMsg(null); }} onCancel={() => setPhase({ k: "locked" })} />}
      </main>
    </div>
  );
}

function ForgotPin({ onDone, onCancel }: { onDone: (g: GateState) => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="stack" style={{ width: "100%", textAlign: "left" }} onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      setErr(null);
      try { onDone(await parentApi.resetPin(pin, password)); } catch (e2) { setErr(errText(e2)); } finally { setBusy(false); setPassword(""); }
    }}>
      <h1 className="t-title">Set a new PIN</h1>
      <p className="muted">Enter your account password, then a new PIN. Changing the PIN is recorded.</p>
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
