// Sign-in and sign-up field helpers (flows G12; W2-A #4): a password field with Show / Hide, the client-side checks
// that run before any request, and the server's field codes in sentences. A raw API string never reaches the parent.
import { useId, useState, type InputHTMLAttributes } from "react";
import { Icon } from "../ui/index.ts";
import { tw2 } from "../copy/en.ts";

export { authErrorOf, checkAuthFields, type AuthField, type FieldErrors } from "./authErrors.ts";

/** A labelled password input with a Show / Hide toggle beside it (a 48 dp button, its own accessible name). */
export function PasswordField({ label, hint, error, ...rest }: { label: string; hint?: string; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      <div className="pw-row">
        <input id={id} className="input pw-input" type={show ? "text" : "password"} aria-invalid={!!error || undefined}
          aria-describedby={[hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined} {...rest} />
        <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-controls={id} data-testid="pw-show">
          {show ? tw2("auth.hide") : tw2("auth.show")}
        </button>
      </div>
      {error && <span className="field-error" id={`${id}-err`}><Icon name="help" size={20} />{error}</span>}
    </div>
  );
}
