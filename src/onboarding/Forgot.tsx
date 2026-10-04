// "Forgot password?" (flows G12; W2-A #4): /start/forgot asks for the email and always answers the same way (it never
// says whether an account exists); the emailed link opens /start/reset?token=, which sets a new password, ends every
// other session of the account and signs this browser in. Errors sit on their field, in sentences.
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, ErrorNote, Field } from "../ui/index.ts";
import { ApiError, postJson, refreshMe } from "../app/api.ts";
import { tw2 } from "../copy/en.ts";
import { StepFrame } from "./Layout.tsx";
import { authErrorOf, checkAuthFields, PasswordField, type FieldErrors } from "./fields.tsx";

export function ForgotStep() {
  const [sp] = useSearchParams();
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [fe, setFe] = useState<FieldErrors>({});
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const f = checkAuthFields({ email }, ["email"]);
    setFe(f);
    if (Object.keys(f).length) return;
    setBusy(true);
    try {
      await postJson("/api/auth/forgot", { email: email.trim() });
      setSent(true);
    } catch (e2) {
      const r = authErrorOf(e2);
      if (r.field) setFe({ [r.field]: r.text }); else setErr(r.text);
    } finally { setBusy(false); }
  };
  return (
    <StepFrame step={null} title={tw2("auth.forgot.title")} why={sent ? undefined : tw2("auth.forgot.body")}>
      {sent ? (
        <p className="t-lead" role="status" data-testid="forgot-sent">{tw2("auth.forgot.sent")}</p>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <Field label="Email" type="email" autoComplete="email" inputMode="email" value={email} error={fe.email}
            onChange={(e) => { setEmail(e.target.value); setFe({}); }} required />
          <ErrorNote>{err}</ErrorNote>
          <Button type="submit" block disabled={busy} data-testid="forgot-send">{busy ? "Please wait" : tw2("auth.forgot.send")}</Button>
        </form>
      )}
    </StepFrame>
  );
}

export function ResetStep() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [fe, setFe] = useState<FieldErrors>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const f = checkAuthFields({ password }, ["password"]);
    setFe(f);
    if (Object.keys(f).length) return;
    setBusy(true);
    try {
      await postJson("/api/auth/reset", { token, password });
      setPassword("");
      setDone(true);
      const me = await refreshMe();
      setTimeout(() => nav(me && me.children.length ? "/who" : "/start/consent", { replace: true }), 1200);
    } catch (e2) {
      if (e2 instanceof ApiError && (e2.body as { code?: string } | null)?.code === "reset.bad") setErr(tw2("auth.reset.bad"));
      else { const r = authErrorOf(e2); if (r.field === "password") setFe({ password: r.text }); else setErr(r.text); }
    } finally { setBusy(false); }
  };
  return (
    <StepFrame step={null} title={tw2("auth.reset.title")}>
      {done ? (
        <p className="t-lead" role="status" data-testid="reset-done">{tw2("auth.reset.done")}</p>
      ) : !token ? (
        <ErrorNote>{tw2("auth.reset.bad")}</ErrorNote>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters." value={password} error={fe.password}
            onChange={(e) => { setPassword(e.target.value); setFe({}); }} required />
          <ErrorNote>{err}</ErrorNote>
          <Button type="submit" block disabled={busy} data-testid="reset-save">{busy ? "Please wait" : tw2("auth.reset.save")}</Button>
        </form>
      )}
    </StepFrame>
  );
}
