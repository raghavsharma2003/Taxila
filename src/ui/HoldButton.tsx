// Press and hold to confirm. Used for the "I am the parent" gate (stops a young child; V2 §3.2 step 3) and for
// destructive actions. 2 s by default (V2 §6.2: the label and the help text say the same number). Single pointer,
// no drag (WCAG 2.5.7); keyboard: hold Space or Enter. Releasing early cancels; sliding off cancels (2.5.2). A
// light haptic at the start and at the end (V2 §9.3). The fill is the visible progress; reduced motion keeps the
// timing and drops the animation.
// Typed alternative (V2 §11.5 "the hold gate has a typed alternative"): pass `typedWord`, and a "Can't hold? Type
// the word … instead" button opens a field; typing the word confirms.
// Accessible name: "<children>. Press and hold for 2 seconds." (V2 §11.4).
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ButtonVariant } from "./Button.tsx";
import { haptic } from "./haptics.ts";

export function HoldButton({ ms = 2000, onConfirm, children, variant = "primary", block, hint = "Press and hold", disabled, typedWord, showHint = false }:
  { ms?: number; onConfirm: () => void; children: ReactNode; variant?: ButtonVariant; block?: boolean; hint?: string; disabled?: boolean; typedWord?: string;
    /** Print "Press and hold for 2 seconds." under the button (built from `ms`, so label and help never disagree). */
    showHint?: boolean }) {
  const [holding, setHolding] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const timer = useRef<number | null>(null);
  const fieldId = useId();
  const cancel = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; setHolding(false); };
  const start = () => {
    if (timer.current || disabled) return;
    setHolding(true);
    haptic("hold");
    timer.current = window.setTimeout(() => { timer.current = null; setHolding(false); haptic("hold"); onConfirm(); }, ms);
  };
  useEffect(() => cancel, []);
  const seconds = Math.round(ms / 100) / 10;
  const variantCls = variant === "destructive" ? "danger" : variant;
  return (
    <div className="stack-sm">
      <button type="button" className={["btn", `btn-${variantCls}`, "hold", block && "btn-block"].filter(Boolean).join(" ")}
        data-holding={holding} disabled={disabled} style={{ ["--hold-ms" as string]: `${ms}ms` }}
        onPointerDown={(e) => {
          // No pointer capture: touch pointers are implicitly captured, which would hide a slide-off. Release it,
          // and also test the position on every move, so sliding off cancels on every input type (2.5.2).
          try { if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
          start();
        }}
        onPointerMove={(e) => {
          if (!timer.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cancel();
        }}
        onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel}
        onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); } }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") cancel(); }}
        onContextMenu={(e) => e.preventDefault()}>
        <span className="hold-fill" aria-hidden="true" />
        <span>{children}</span>
        <span className="sr-only">. {hint} for {seconds} {seconds === 1 ? "second" : "seconds"}.</span>
      </button>
      {showHint && <span className="t-note" aria-hidden="true">{hint} for {seconds} {seconds === 1 ? "second" : "seconds"}.</span>}
      {typedWord && !typing && (
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setTyping(true)} disabled={disabled}>
          Can't hold? Type the word {typedWord} instead
        </button>
      )}
      {typedWord && typing && (
        <div className="field">
          <label htmlFor={fieldId}>Type the word {typedWord}</label>
          <input id={fieldId} className="input" value={typed} autoComplete="off" autoCapitalize="none" autoFocus
            onChange={(e) => {
              const v = e.target.value;
              setTyped(v);
              if (v.trim().toLowerCase() === typedWord.toLowerCase()) onConfirm();
            }} />
        </div>
      )}
    </div>
  );
}
