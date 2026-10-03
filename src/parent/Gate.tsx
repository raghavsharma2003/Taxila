// The parent gate (PRODUCT-DESIGN-V2 §6.5.6). Set a PIN if none exists, else unlock with it. The unlock is
// server-side and per session (server/routes/parent.js); this component is only its face: when any parent read comes
// back 403 { gate }, `relock()` shows the pad again and says why ("Locked to keep {child} out. Enter your PIN.").
// 360: title, the dots, and a full-width PinPad at the bottom with nothing over it (no footer, no tab bar). 1280: a
// 400 card. Wrong PIN: the dots shake twice and two medium haptics fire (reduced motion: the words change instead).
// Five wrong tries rest the corner (server-enforced): "Too many tries. Try again at 5:42 pm." Never a maths puzzle.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Field, Icon, PinPad, haptic } from "../ui/index.ts";
import { ApiError, loadMe } from "../app/api.ts";
import { Brand } from "../app/Shell.tsx";
import { readStore, writeStore } from "../app/storage.ts";
import { lockBeacon, parentApi, type GateState } from "./api.ts";
import { fmtTime, isPasswordError, parentError } from "./copy.ts";
import { PasswordAgain } from "./fields.tsx";
// The gate also renders inside onboarding (GateIfPin), outside the Parent-corner chunk: its styles travel with it.
import "./parent.css";

type Phase = { k: "loading" } | { k: "signedOut" } | { k: "set" } | { k: "locked" } | { k: "wait"; until: string | null } | { k: "open" } | { k: "forgot" } | { k: "error"; msg: string };

export interface ErasedReceipt { code: string; at: string; children: number; backupsGoneBy: string }
const GateCtx = createContext<{ relock: () => void; lockNow: () => Promise<void>; erased: (r: ErasedReceipt) => void }>({ relock: () => {}, lockNow: async () => {}, erased: () => {} });
export const useGate = () => useContext(GateCtx);

/** Set while the corner is open in this tab; read after a reload or a re-lock to say "Locked to keep {child} out". */
const WAS_OPEN = "tx.parentWasOpen";
const fmtWhen = (iso: string) => {
  const d = new Date(iso), now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return `${fmtTime(d)}${sameDay(d, now) ? " today" : sameDay(d, tomorrow) ? " tomorrow" : ` on ${d.toLocaleDateString("en-IN", { weekday: "long" })}`}`;
};

/**
 * Paths that stay inside the same grown-up visit: moving between them must not lock (the next screen is
 * gated too). Anything else (the picker, a child screen, the landing page) locks the corner on the way out.
 */
const GATED_PATH = /^\/(parent(\/|$)|start\/(child|controls|consent|handover|about|pin)(\/|$|\?))/;
let pendingLock: number | null = null;

/**
 * Lock on every exit (ds-parent-gate-lock-on-exit): unmount (Back, Brand link, navigation to /who or a child
 * screen), pagehide, and the tab going to the background. The unmount lock is deferred one task so a StrictMode
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

/** The first name of the child last viewed in the corner (for "Locked to keep {child} out."), else "your child". */
function useChildName() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    loadMe().then((m) => {
      const want = readStore<string | null>("tx.parentChild", null);
      const kids = m?.children ?? [];
      setName((kids.find((k) => k.id === want) ?? (kids.length === 1 ? kids[0] : null))?.first_name ?? null);
    }, () => {});
  }, []);
  return name ?? "your child";
}

const reduced = () => typeof matchMedia !== "undefined" && (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce");

export function Gate({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const childName = useChildName();
  const [phase, setPhase] = useState<Phase>({ k: "loading" });
  const [msg, setMsg] = useState<string | null>(null);
  const [wrong, setWrong] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [first, setFirst] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [relocked, setRelocked] = useState(() => readStore<boolean>(WAS_OPEN, false, "session"));
  const [cancelHint, setCancelHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);
  // After DELETE /api/account the account no longer exists: the receipt replaces everything, whatever the gate does.
  const [receipt, setReceipt] = useState<ErasedReceipt | null>(null);
  const erased = useCallback((r: ErasedReceipt) => { writeStore(WAS_OPEN, null, "session"); setReceipt(r); }, []);

  const fromState = (g: GateState): Phase => {
    setPending(g.pendingResetAt ?? null);
    return !g.hasPin ? { k: "set" } : g.unlocked ? { k: "open" } : g.lockedUntil ? { k: "wait", until: g.lockedUntil } : { k: "locked" };
  };
  const check = useCallback(() => {
    parentApi.pin().then((g) => {
      const p = fromState(g);
      setPhase(p.k === "locked" && sp.get("forgot") === "1" ? { k: "forgot" } : p);
    }, (e) => {
      if (e instanceof ApiError && e.status === 401) setPhase({ k: "signedOut" });
      else setPhase({ k: "error", msg: parentError(e) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(check, [check]);
  useEffect(() => { writeStore(WAS_OPEN, phase.k === "open" ? true : relocked || null, "session"); }, [phase.k, relocked]);

  const relock = useCallback(() => {
    setMsg(null); setResetKey((k) => k + 1);
    setPhase((p) => { if (p.k === "open") setRelocked(true); return p.k === "open" ? { k: "locked" } : p; });
  }, []);
  const lockNow = useCallback(async () => {
    writeStore(WAS_OPEN, null, "session");
    await parentApi.lock().catch(() => {});
    nav("/who");
  }, [nav]);
  useLockOnExit(phase.k === "open" && !receipt, relock);

  const gateBody = (e: unknown) => (e instanceof ApiError ? e.body : null) as { gate?: string; lockedUntil?: string; triesLeft?: number } | null;
  const unlock = async (pin: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setPhase(fromState(await parentApi.unlock(pin)));
      setRelocked(false);
    } catch (e) {
      const body = gateBody(e);
      if (body?.gate === "wait") setPhase({ k: "wait", until: body.lockedUntil ?? null });
      else if (body?.gate === "set") setPhase({ k: "set" });
      else {
        setMsg(e instanceof ApiError && e.status === 403 ? "That PIN isn't right." : parentError(e));
        if (e instanceof ApiError && e.status === 403) {
          setWrong((n) => n + 1);
          haptic("wrong_pin");
          window.setTimeout(() => haptic("wrong_pin"), 260);
        }
      }
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  // A first PIN chosen here (not in onboarding) needs the account password: whoever reaches the gate first,
  // possibly the child through the parent door, must not be able to claim the corner.
  const setPin = async (pin: string) => {
    if (!first) { setFirst(pin); setMsg(null); setResetKey((k) => k + 1); return; }
    if (pin !== first) { setFirst(null); setMsg("The PINs don't match. Try again."); setResetKey((k) => k + 1); return; }
    setBusy(true);
    setPwErr(null);
    try {
      setPhase(fromState(await parentApi.setPin(pin, password)));
      setMsg(null);
    } catch (e) {
      const body = gateBody(e);
      if (body?.gate === "wait") setPhase({ k: "wait", until: body.lockedUntil ?? null });
      if (isPasswordError(e) || (body?.gate === "password")) setPwErr(parentError(e)); else setMsg(parentError(e));
      setFirst(null);
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  if (receipt) return <Erased r={receipt} />;
  if (phase.k === "open") return <GateCtx.Provider value={{ relock, lockNow, erased }}>{children}</GateCtx.Provider>;
  if (phase.k === "signedOut") return <Navigate to={`/start/phone?login=1&next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;

  return (
    <div className="pa-gate" data-gate={phase.k}>
      <header className="pa-gate-top">
        <Brand to="/who" />
        <span className="pa-spacer" />
        <button type="button" className="iconbtn" onClick={() => nav("/who")} aria-label="Close and go back"><Icon name="close" /></button>
      </header>
      <main id="main" className="pa-gate-card">
        {phase.k === "loading" && <div className="spinner" role="status" aria-label="Checking" />}
        {phase.k === "error" && (
          <div className="pa-gate-head">
            <h1 className="pa-h1">Grown-ups only</h1>
            <p role="alert">{phase.msg}</p>
            <Button variant="secondary" onClick={() => { setPhase({ k: "loading" }); check(); }}>Try again</Button>
          </div>
        )}
        {phase.k === "locked" && (
          <>
            <div className="pa-gate-head">
              <span className="pa-gate-icon" aria-hidden="true"><Icon name="lock" size={28} /></span>
              <h1 className="pa-h1">Grown-ups only</h1>
              <p className="pa-lead">{relocked ? `Locked to keep ${childName} out. Enter your PIN.` : "Enter your parent PIN"}</p>
              {pending && (
                <div className="pa-note" role="status">
                  <p>Your new PIN works from {fmtWhen(pending)}.</p>
                  {cancelHint ? <p>Enter your current PIN below. That cancels the reset.</p> : (
                    <Button variant="secondary" small onClick={() => { setCancelHint(true); padRef.current?.querySelector<HTMLElement>(".pin")?.focus(); }}>Cancel reset</Button>
                  )}
                </div>
              )}
            </div>
            <div className="pa-gate-pad" ref={padRef}>
              <div className={`pa-shake${wrong && !reduced() ? " is-wrong" : ""}`} key={wrong} data-wrong={wrong || undefined}>
                <PinPad label="Parent PIN" onComplete={unlock} resetKey={resetKey} disabled={busy} autoFocus />
              </div>
              <p className="pa-gate-msg" aria-live="assertive">{msg}</p>
              <Button variant="quiet" small onClick={() => { setMsg(null); setPhase({ k: "forgot" }); }}>Forgot PIN?</Button>
            </div>
          </>
        )}
        {phase.k === "set" && (
          <>
            <div className="pa-gate-head">
              <h1 className="pa-h1">{first ? "Confirm your PIN" : "Set a parent PIN"}</h1>
              <p className="pa-lead">Only grown-ups should know it. Use 4 to 6 digits, not your phone's unlock code.</p>
              {!first && (
                <PasswordAgain hint="Needed because this sign-in is not new." value={password} error={pwErr}
                  onChange={(v) => { setPassword(v); if (v) setPwErr(null); }} />
              )}
            </div>
            <div className="pa-gate-pad">
              <PinPad label={first ? "Confirm your PIN" : "New PIN"} onComplete={setPin} resetKey={resetKey} disabled={busy || (!first && !password)} okLabel={first ? "Save" : "Next"} />
              <p className="pa-gate-msg" aria-live="assertive">{msg}</p>
            </div>
          </>
        )}
        {phase.k === "wait" && (
          <div className="pa-gate-head">
            <span className="pa-gate-icon" aria-hidden="true"><Icon name="clock" size={28} /></span>
            <h1 className="pa-h1">This door is for grown-ups.</h1>
            <p className="pa-lead">Too many tries. Try again at {phase.until ? fmtTime(phase.until) : "a little later"}.</p>
            <Button variant="secondary" onClick={() => nav("/who")}>Back</Button>
          </div>
        )}
        {phase.k === "forgot" && <ForgotPin onDone={(g) => { setPhase(fromState(g)); setMsg(null); }} onCancel={() => setPhase({ k: "locked" })}
          onWait={(until) => setPhase({ k: "wait", until })} />}
        <Link to="/help" className="pa-gate-help">Help and helplines</Link>
      </main>
    </div>
  );
}

/**
 * Onboarding screens that change a child's profile, consent or controls: open while no PIN exists (first run),
 * behind the Gate once one does (§5.2: "Add a child" is behind the gate). A layout route, so moving between these
 * steps keeps one unlock.
 */
export function GateIfPin() {
  const { pathname } = useLocation();
  const [has, setHas] = useState<boolean | null>(null);
  // Re-checked on every step change, and sticky once true: a PIN set at step 7 gates a Back to step 6 or 7.
  useEffect(() => { parentApi.pin().then((g) => setHas((h) => h || g.hasPin), () => setHas((h) => h ?? false)); }, [pathname]);
  if (has === null) return <div className="col center-fill"><div className="spinner" role="status" aria-label="Checking" /></div>;
  return has ? <Gate><Outlet /></Gate> : <Outlet />;
}

/** Forgot PIN (ds-pin-reset-interim-delay): the account password, then a new PIN that starts working 24 hours later. */
function ForgotPin({ onDone, onCancel, onWait }: { onDone: (g: GateState) => void; onCancel: () => void; onWait: (until: string | null) => void }) {
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="pa-gate-head pa-form" noValidate onSubmit={async (e) => {
      e.preventDefault();
      setPwErr(null); setPinErr(null); setErr(null);
      if (!password) { setPwErr("Enter your account password."); return; }
      if (!/^\d{4,6}$/.test(pin)) { setPinErr("The PIN needs 4 to 6 digits."); return; }
      setBusy(true);
      try { onDone(await parentApi.resetPin(pin, password)); } catch (e2) {
        const b = (e2 instanceof ApiError ? e2.body : null) as { gate?: string; lockedUntil?: string; code?: string } | null;
        if (b?.gate === "wait") onWait(b.lockedUntil ?? null);
        else if (isPasswordError(e2)) setPwErr(parentError(e2));
        else if (b?.code?.startsWith("pin_")) setPinErr(parentError(e2));
        else setErr(parentError(e2));
      } finally { setBusy(false); setPassword(""); }
    }}>
      <h1 className="pa-h1">Set a new PIN</h1>
      <p>For safety, the new PIN starts working 24 hours from now, and this screen shows that a reset is waiting. Entering the current PIN before then cancels it.</p>
      <PasswordAgain value={password} error={pwErr} onChange={(v) => { setPassword(v); if (v) setPwErr(null); }} />
      <Field label="New PIN" hint="4 to 6 digits." type="password" inputMode="numeric" name="tx-new-pin" autoComplete="new-password" maxLength={6} value={pin}
        error={pinErr} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinErr(null); }} />
      {err && <p className="pa-form-err" role="alert">{err}</p>}
      <div className="pa-actions">
        <Button type="submit" disabled={busy}>Save new PIN</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/** The deletion receipt (§6.5.5): shown once the account is gone, outside the corner (nothing behind it is left). */
function Erased({ r }: { r: ErasedReceipt }) {
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className="pa-gate" data-gate="erased">
      <header className="pa-gate-top"><Brand to="/" /></header>
      <main id="main" className="pa-gate-card">
        <section className="pa-gate-head pa-receipt" role="status" aria-labelledby="pa-receipt-h" data-receipt={r.code}>
          <span className="pa-gate-icon" aria-hidden="true"><Icon name="tick" size={28} /></span>
          <h1 id="pa-receipt-h" className="pa-h1">Your account is deleted</h1>
          <p>Deleted at {fmtTime(r.at)} on {day(r.at)}{r.children ? `, with ${r.children === 1 ? "1 child's profile" : `${r.children} children's profiles`}` : ""}.</p>
          <p>Backups are kept for safety for 7 days and are gone by {day(r.backupsGoneBy)}.</p>
          <p>We keep a record that this deletion happened, and any safety record our team must keep, with no names and no lesson content.</p>
          <p>Receipt code: <strong className="pa-mono">{r.code}</strong></p>
          <Button onClick={() => window.location.assign("/")}>Go to the start page</Button>
        </section>
      </main>
    </div>
  );
}
