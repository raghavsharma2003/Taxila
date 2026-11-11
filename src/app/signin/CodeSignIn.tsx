// /signin: a guardian signs in with a 6-digit code sent by email (r7 app-auth-email-otp; server/signin/code.js).
// Two states on one screen: the email (Email me a code), then the code (Sign in). The sent line never says whether
// the email has an account. ?email= prefills, ?next= is where a returning parent goes after (the same rule as the
// password sign-in, src/onboarding/Account.tsx): next, else Who when there are children, else consent.
// The code field takes a paste or the phone's one-time-code autofill; the first 6 digits are kept (no maxLength: the
// browser would cut a pasted "Code: 042 917" before the digits were picked out).
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, ErrorNote, Field } from "../../ui/index.ts";
import { postJson, refreshMe } from "../api.ts";
import { tr7 } from "../../copy/en.ts";
import { StepFrame } from "../../onboarding/Layout.tsx";
import { checkAuthFields } from "../../onboarding/authErrors.ts";
import { safeNext } from "../../onboarding/next.ts";
import { CODE_LEN, cleanCode, codeErrorOf, type CodeField } from "./codeErrors.ts";
import "../../styles/onboarding.css";
import "../../onboarding/onboarding-v2.css";

export default function CodeSignIn() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = safeNext(sp.get("next"));
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [sent, setSent] = useState<{ minutes: number } | null>(null);
  const [code, setCode] = useState("");
  const [fe, setFe] = useState<Partial<Record<CodeField, string>>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const online = () => typeof navigator === "undefined" || navigator.onLine !== false;
  useEffect(() => { if (sent) codeRef.current?.focus(); }, [sent]);

  const fail = (e: unknown) => {
    const r = codeErrorOf(e, online());
    if (r.field) setFe({ [r.field]: r.text }); else setErr(r.text);
  };

  const ask = async (e?: FormEvent) => {
    e?.preventDefault();
    setErr(null);
    const f = checkAuthFields({ email }, ["email"]);
    if (f.email) { setFe({ email: f.email }); return; }
    setFe({});
    setBusy(true);
    try {
      const r = await postJson<{ minutes?: number }>("/api/auth/code", { channel: "email", email: email.trim() });
      setCode("");
      setSent({ minutes: r?.minutes ?? 10 });
    } catch (e2) { fail(e2); } finally { setBusy(false); }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (code.length !== CODE_LEN) { setFe({ code: tr7("code.err.shape") }); return; }
    setBusy(true);
    try {
      await postJson("/api/auth/code/verify", { email: email.trim(), code });
      const m = await refreshMe();
      if (next) nav(next, { replace: true });
      else nav(m && m.children.length ? "/who" : "/start/consent", { replace: true });
    } catch (e2) { fail(e2); } finally { setBusy(false); }
  };

  const toPassword = `/start/phone?login=1${next ? `&next=${encodeURIComponent(next)}` : ""}`;
  return (
    <StepFrame step={null} title={tr7("code.title")} why={sent ? undefined : tr7("code.why")} docTitle={tr7("code.title")}>
      {!sent ? (
        <form className="stack" onSubmit={ask} noValidate data-testid="code-ask">
          <Field label={tr7("code.email")} type="email" autoComplete="email" inputMode="email" value={email} error={fe.email}
            onChange={(e) => { setEmail(e.target.value.trim()); setFe({}); }} required />
          <ErrorNote>{err}</ErrorNote>
          <Button type="submit" block disabled={busy} data-testid="code-send">{busy ? "Please wait" : tr7("code.send")}</Button>
          <Link to={toPassword} className="link-quiet" data-testid="code-password">{tr7("code.password")}</Link>
        </form>
      ) : (
        <form className="stack" onSubmit={verify} noValidate data-testid="code-verify">
          <p className="t-lead" role="status" data-testid="code-sent">{tr7("code.sent", { email: email.trim(), min: sent.minutes })}</p>
          <div className="field">
            <label htmlFor="otp">{tr7("code.field")}</label>
            <input id="otp" ref={codeRef} className="input code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
              value={code} aria-invalid={!!fe.code || undefined} aria-describedby={fe.code ? "otp-err" : undefined}
              onChange={(e) => { setCode(cleanCode(e.target.value)); setFe({}); }} data-testid="code-field" />
            {fe.code && <span className="field-error" id="otp-err">{fe.code}</span>}
          </div>
          <ErrorNote>{err}</ErrorNote>
          <Button type="submit" block disabled={busy || code.length !== CODE_LEN} data-testid="code-go">{busy ? "Please wait" : tr7("code.go")}</Button>
          <Button variant="quiet" onClick={() => void ask()} disabled={busy} data-testid="code-again">{tr7("code.again")}</Button>
          <Button variant="quiet" onClick={() => { setSent(null); setCode(""); setFe({}); setErr(null); }}>{tr7("code.other")}</Button>
        </form>
      )}
    </StepFrame>
  );
}
