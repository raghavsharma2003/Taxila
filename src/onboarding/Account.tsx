// P2 identity (§2.2). The spec's primary path is phone + OTP (R9); that needs an SMS / WhatsApp provider that
// is not approved yet, so v1 signs in with email + password through the existing /api/auth routes. The
// screen is laid out so OTP drops in: the number field already sits first with its why-line and the
// no-calls promise, and `OtpSlot` marks where the code field goes.
// The grown-up hold gate now sits on step 3 (Our promises), before this step (V2 §3.2). Typed fields persist (G-ONB-6).
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, ErrorNote, Field, Icon } from "../ui/index.ts";
import { ApiError, errText, loadMe, postJson, refreshMe, type Me } from "../app/api.ts";
import { StepFrame } from "./Layout.tsx";
import { clearDraftContact, useDraft } from "./draft.ts";
import { safeNext } from "./next.ts";

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
  const next = safeNext(sp.get("next"));
  const [d, set] = useDraft();
  // A ?next= means someone was sent here from a screen that needs a signed-in parent (the gate, a lesson's T8, a
  // first-run step after a 401): they have an account, so sign-in is the default; ?signup=1 still forces the form.
  const [mode, setMode] = useState<"signup" | "login">(sp.get("login") || (next && !sp.get("signup")) ? "login" : "signup");
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});

  useEffect(() => { loadMe().then(setMe, () => setMe(null)); }, []);
  const after = (m: Me | null, signedInNow = true) => {
    // ?next= is for a returning parent. A brand-new account (signup just now) goes through consent first, never
    // straight into the corner with no consent and no child.
    const fresh = signedInNow && mode === "signup";
    if (next && !fresh) return nav(next, { replace: true });
    if (m && m.children.length && (mode === "login" || !signedInNow)) return nav("/who", { replace: true });
    nav("/start/consent");
  };
  // Already signed in and sent here with somewhere to go back to: go straight there (no extra Continue screen).
  useEffect(() => { if (me && next) nav(next, { replace: true }); }, [me, next, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setFieldErr({});
    if (mode === "login") {
      // Sign-in errors sit on their field, in sentences, never the server's string (V2 §4.7, audit #18).
      const fe: { email?: string; password?: string } = {};
      if (!(d.email ?? "").trim()) fe.email = "Enter your email.";
      if (!password) fe.password = "Enter your password.";
      if (fe.email || fe.password) { setFieldErr(fe); return; }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await postJson("/api/auth/signup", { name: d.name ?? "", email: d.email ?? "", password, phone: d.phone ? `+91${d.phone}` : undefined, isGuardianAdult: true });
      } else {
        await postJson("/api/auth/login", { email: d.email ?? "", password });
      }
      setPassword("");
      clearDraftContact(); // the account now holds name, email and phone; the shared phone's storage does not need them
      after(await refreshMe());
    } catch (e2) {
      if (mode === "login") {
        const st = e2 instanceof ApiError ? e2.status : 0;
        const until = e2 instanceof ApiError ? (e2.body as { lockedUntil?: string } | null)?.lockedUntil : undefined;
        if (st === 400) setFieldErr({ password: "That email and password don't match. Try again." });
        else if (st === 429) setErr(until ? `Too many tries. Try again at ${new Date(until).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}.` : "Too many tries. Try again in a few minutes.");
        else setErr(typeof navigator !== "undefined" && navigator.onLine === false ? "No internet. Try again when you're online." : "Something went wrong. Try again.");
      } else setErr(errText(e2));
    } finally {
      setBusy(false);
    }
  };

  if (me === undefined) return <StepFrame step="phone" title="Your account"><div className="spinner" /></StepFrame>;

  if (me && next) return <StepFrame step="phone" title="Signing you in"><div className="spinner" /></StepFrame>;
  if (me) {
    return (
      <StepFrame step="phone" title="You are signed in"
        footer={<Button block onClick={() => after(me, false)}>Continue</Button>}>
        <p className="t-lead">Signed in as <strong>{me.guardian.email}</strong>.</p>
        <Button variant="quiet" onClick={async () => { await postJson("/api/auth/logout", {}); setMe(await refreshMe()); }}>Not you? Sign out</Button>
      </StepFrame>
    );
  }

  const signup = mode === "signup";
  return (
    <StepFrame step="phone" title={signup ? "Create your parent account" : "Sign in"}
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
        <Field label="Email" type="email" autoComplete="email" inputMode="email" value={d.email ?? ""} error={fieldErr.email}
          onChange={(e) => { set({ email: e.target.value.trim() }); setFieldErr((f) => ({ ...f, email: undefined })); }} required />
        <Field label="Password" type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} error={fieldErr.password}
          hint={signup ? "At least 8 characters." : undefined} onChange={(e) => { setPassword(e.target.value); setFieldErr((f) => ({ ...f, password: undefined })); }} required />
        {signup && <p className="t-note">By continuing you confirm you are 18 or older and this child's parent or guardian.</p>}
        <ErrorNote>{err}</ErrorNote>
        <Button type="submit" block disabled={busy}>{busy ? "Please wait" : signup ? "Create account" : "Sign in"}</Button>
        <Button variant="quiet" onClick={() => { setErr(null); setFieldErr({}); setMode(signup ? "login" : "signup"); }}>
          {signup ? "I already have an account" : "New here? Create an account"}
        </Button>
      </form>
    </StepFrame>
  );
}
