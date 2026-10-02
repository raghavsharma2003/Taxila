import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon.tsx";

/** A labelled input. The why-line (hint) sits under the label (§2.2: a why-line before every ask). */
export const Field = forwardRef<HTMLInputElement, { label: ReactNode; hint?: ReactNode; error?: string | null } & InputHTMLAttributes<HTMLInputElement>>(
  function Field({ label, hint, error, id, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <div className="field">
        <label htmlFor={fid}>{label}</label>
        {hint && <span className="hint" id={`${fid}-hint`}>{hint}</span>}
        <input ref={ref} id={fid} className="input" aria-invalid={!!error || undefined}
          aria-describedby={[hint && `${fid}-hint`, error && `${fid}-err`].filter(Boolean).join(" ") || undefined} {...rest} />
        {error && <span className="field-error" id={`${fid}-err`}><Icon name="help" size={20} />{error}</span>}
      </div>
    );
  });

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="alert" role="alert"><Icon name="help" /><span>{children}</span></div>;
}
