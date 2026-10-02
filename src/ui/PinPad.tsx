// Guardian PIN entry (§6.2): 4-6 digits, confirmed with the OK key (so the pad never reveals the PIN's
// length). On-screen keypad with 64 dp keys plus the hardware keyboard while the pad has focus (A9: only
// while focused). Digits are never shown; the count is announced politely. No maths puzzle, ever.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon.tsx";

export function PinPad({ min = 4, max = 6, onComplete, label, disabled, resetKey, okLabel = "OK" }:
  { min?: number; max?: number; onComplete: (pin: string) => void; label: string; disabled?: boolean; resetKey?: unknown; okLabel?: string }) {
  const [pin, setPin] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setPin(""); }, [resetKey]);
  useEffect(() => { ref.current?.focus(); }, []);

  const push = (d: string) => { if (!disabled) setPin((p) => (p.length >= max ? p : p + d)); };
  const pop = () => { if (!disabled) setPin((p) => p.slice(0, -1)); };
  const ok = () => { if (!disabled && pin.length >= min) onComplete(pin); };
  const onKey = (e: KeyboardEvent) => {
    if (/^\d$/.test(e.key)) { e.preventDefault(); push(e.key); }
    else if (e.key === "Backspace") { e.preventDefault(); pop(); }
    else if (e.key === "Enter") { e.preventDefault(); ok(); }
  };

  return (
    <div className="pin" ref={ref} tabIndex={0} role="group" aria-label={label} onKeyDown={onKey} aria-disabled={disabled}>
      <div className="pin-dots" aria-hidden="true">
        {Array.from({ length: Math.max(min, pin.length) }, (_, i) => <span key={i} className="pin-dot" data-on={i < pin.length} />)}
      </div>
      <p className="sr-only" aria-live="polite">{pin.length} digits entered</p>
      <div className="pin-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className="pin-key" onClick={() => push(d)} disabled={disabled}>{d}</button>
        ))}
        <button type="button" className="pin-key pin-key-quiet" onClick={pop} disabled={disabled || !pin} aria-label="Delete last digit">
          <Icon name="back" />
        </button>
        <button type="button" className="pin-key" onClick={() => push("0")} disabled={disabled}>0</button>
        <button type="button" className="pin-key btn-primary" style={{ fontSize: "1.0625rem" }} onClick={ok} disabled={disabled || pin.length < min}>
          {okLabel}
        </button>
      </div>
    </div>
  );
}
