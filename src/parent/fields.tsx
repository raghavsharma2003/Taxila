// The account-password re-entry for consent-grade acts in the Parent corner (delete, download, Your choices, PIN).
// Same anti-autofill measures as src/ui/ReauthField (a saved password must never be filled on the shared phone:
// read-only until focused, a non-credential name, cleared after mount), plus what ReauthField has no prop for: a
// field-level error under the input, attached by aria-describedby (§4.7 "Parent-side form errors are field-level").
import { useEffect, useState } from "react";
import { Field } from "../ui/index.ts";

export function PasswordAgain({ value, onChange, error, label = "Your account password", hint, autoFocus, id }:
  { value: string; onChange: (v: string) => void; error?: string | null; label?: string; hint?: string; autoFocus?: boolean; id?: string }) {
  const [ro, setRo] = useState(!autoFocus);
  useEffect(() => {
    onChange("");
    const t = window.setTimeout(() => onChange(""), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Field id={id} label={label} hint={hint} error={error} type="password" name="tx-reauth" autoComplete="new-password" autoCorrect="off"
      autoCapitalize="off" spellCheck={false} data-lpignore="true" data-1p-ignore="true" readOnly={ro} autoFocus={autoFocus}
      onFocus={() => setRo(false)} onPointerDown={() => setRo(false)} value={value} onChange={(e) => onChange(e.target.value)} />
  );
}
