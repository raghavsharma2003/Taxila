// Account-password re-entry on the shared family phone (PIN set / change / reset, erasure; §6.2 "autofill
// disabled on the reset screen"). Chrome and Android WebView ignore autoComplete="off" on type=password and
// fill the saved password, which would hand the child the guardian's password at "Forgot the PIN?". So:
// autoComplete="new-password" with a non-credential name, read-only until focused (autofill skips read-only
// fields), and the value cleared right after mount in case a fill landed anyway.
import { useEffect, useState } from "react";
import { Field } from "./Field.tsx";

export function ReauthField({ value, onChange, label = "Account password", hint, autoFocus }:
  { value: string; onChange: (v: string) => void; label?: string; hint?: string; autoFocus?: boolean }) {
  const [ro, setRo] = useState(!autoFocus);
  useEffect(() => {
    onChange("");
    const t = window.setTimeout(() => onChange(""), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Field label={label} hint={hint} type="password" name="tx-reauth" autoComplete="new-password" autoCorrect="off"
      autoCapitalize="off" spellCheck={false} data-lpignore="true" data-1p-ignore="true" readOnly={ro} autoFocus={autoFocus}
      onFocus={() => setRo(false)} value={value} onChange={(e) => onChange(e.target.value)} />
  );
}
