// P2 identity (§2.2). The spec's primary path is phone + OTP (R9); that needs an SMS / WhatsApp provider that
// is not approved yet, so v1 signs in with email + password through the existing /api/auth routes. The
// screen is laid out so OTP drops in: the number field already sits first with its why-line and the
// no-calls promise, and `OtpSlot` marks where the code field goes.
// Entry is behind press-and-hold "I am the parent" (stops a young child). Typed fields persist (G-ONB-6).
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, ErrorNote, Field, HoldButton, Icon } from "../ui/index.ts";
import { errText, loadMe, postJson, refreshMe, type Me } from "../app/api.ts";
import { StepFrame } from "./Layout.tsx";
import { useDraft } from "./draft.ts";

function NoCallsPromise() {
  return <p className="promise-inline"><Icon name="noCall" size={20} /> We never call you to sell anything.</p>;
}

/** Where the OTP field goes once a provider is approved (manual entry first, autofill as enhancement). */
function OtpSlot() {
  return <p className="t-note">Signing in with a code sent to your phone is coming. For now, use an email and a password.</p>;
}

export function AccountStep() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get("next");
  const [d, set] = useDraft();
  const [mode, setMode] = useState<"signup" | "login">(sp.get("login") ? "login" : "signup");
  const [gateOpen, setGateOpen] = useState(!!sp.get("login"));
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { loadMe().then(setMe, () => setMe(null)); }, []);
  const after = (m: Me | null) => {
    // Same-origin paths only: "//host" would make pushState throw (cross-origin URL).
    if (next && /^\/(?!\/)/.test(next) && !next.startsWith("/\\")) return nav(next, { replace: true });
    if (m && m.children.length && mode === "login") return nav("/who", { replace: true });
    nav("/start/trust");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await postJson("/api/auth/signup", { name: d.name ?? "", email: d.email ?? "", password, phone: d.phone ? `+91${d.phone}` : undefined, isGuardianAdult: true });
      } else {
        await postJson("/api/auth/login", { email: d.email ?? "", password });
      }
      setPassword("");
      after(await refreshMe());
    } catch (e2) {
      setErr(errText(e2));
    } finally {
      setBusy(false);
    }
  };

  if (me === undefined) return <StepFrame step="phone" title="Your account"><div className="spinner" /></StepFrame>;

  if (me) {
    return (
      <StepFrame step="phone" title="You are signed in"
        footer={<Button block onClick={() => after(me)}>Continue</Button>}>
        <p className="t-lead">Signed in as <strong>{me.guardian.email}</strong>.</p>
        <Button variant="quiet" onClick={async () => { await postJson("/api/auth/logout", {}); setMe(await refreshMe()); }}>Not you? Sign out</Button>
      </StepFrame>
    );
  }

  if (!gateOpen) {
    return (
      <StepFrame step="phone" title="This part is for a grown-up"
        why="Next we ask for your details. Press and hold the button to show you are the parent or guardian.">
        <HoldButton ms={1500} block onConfirm={() => setGateOpen(true)}>I am the parent</HoldButton>
        <p className="t-note">Hold for about 2 seconds. If you let go early, nothing happens.</p>
      </StepFrame>
    );
  }

  const signup = mode === "signup";
  return (
    <StepFrame step="phone" title={signup ? "Your details" : "Sign in"}
      why={signup ? "So you get your child's reports, and only you can change their settings." : undefined}>
      <form className="stack" onSubmit={submit} noValidate>
        {signup && (
          <>
            <Field label="Your name" autoComplete="name" value={d.name ?? ""} onChange={(e) => set({ name: e.target.value })} required />
            <div className="field">
              <label htmlFor="ph">Mobile number <span className="muted">(optional for now)</span></label>
              <span className="hint" id="ph-hint">Weekly reports will come here on WhatsApp.</span>
              <div className="phone-row">
                <span className="phone-cc" aria-hidden="true">+91</span>
                <input id="ph" className="input" inputMode="numeric" autoComplete="tel-national" maxLength={10} aria-describedby="ph-hint"
                  value={d.phone ?? ""} onChange={(e) => set({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} aria-label="Mobile number, India +91" />
              </div>
              <NoCallsPromise />
            </div>
            <OtpSlot />
          </>
        )}
        <Field label="Email" type="email" autoComplete="email" inputMode="email" value={d.email ?? ""} onChange={(e) => set({ email: e.target.value.trim() })} required />
        <Field label="Password" type="password" autoComplete={signup ? "new-password" : "current-password"} value={password}
          hint={signup ? "At least 8 characters." : undefined} onChange={(e) => setPassword(e.target.value)} required />
        {signup && <p className="t-note">By continuing you confirm you are 18 or older and this child's parent or guardian.</p>}
        <ErrorNote>{err}</ErrorNote>
        <Button type="submit" block disabled={busy}>{busy ? "Please wait" : signup ? "Create account" : "Sign in"}</Button>
        <Button variant="quiet" onClick={() => { setErr(null); setMode(signup ? "login" : "signup"); }}>
          {signup ? "I already have an account" : "New here? Create an account"}
        </Button>
      </form>
    </StepFrame>
  );
}
