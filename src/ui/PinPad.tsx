// Guardian PIN entry (§6.2). On-screen keypad (64 dp keys) plus the hardware keyboard while the pad has
// focus. Digits are never shown; the count is announced politely. No maths puzzle, ever.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon.tsx";

export function PinPad({ length = 4, onComplete, label, disabled, resetKey }:
  { length?: number; onComplete: (pin: string) => void; label: string; disabled?: boolean; resetKey?: unknown }) {
  const [pin, setPin] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setPin(""); }, [resetKey]);
  useEffect(() => { ref.current?.focus(); }, []);
  const done = useRef(onComplete);
  done.current = onComplete;
  useEffect(() => { if (pin.length === length) done.current(pin); }, [pin, length]);

  const push = (d: string) => {
    if (disabled) return;
    setPin((p) => (p.length >= length ? p : p + d));
  };
  const pop = () => !disabled && setPin((p) => p.slice(0, -1));
  const onKey = (e: KeyboardEvent) => {
    if (/^\d$/.test(e.key)) { e.preventDefault(); push(e.key); }
    else if (e.key === "Backspace") { e.preventDefault(); pop(); }
  };

  return (
    <div className="pin" ref={ref} tabIndex={0} role="group" aria-label={label} onKeyDown={onKey} aria-disabled={disabled}>
      <div className="pin-dots" aria-hidden="true">
        {Array.from({ length }, (_, i) => <span key={i} className="pin-dot" data-on={i < pin.length} />)}
      </div>
      <p className="sr-only" aria-live="polite">{pin.length} of {length} digits entered</p>
      <div className="pin-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className="pin-key" tabIndex={-1} onClick={() => push(d)} disabled={disabled}>{d}</button>
        ))}
        <span />
        <button type="button" className="pin-key" tabIndex={-1} onClick={() => push("0")} disabled={disabled}>0</button>
        <button type="button" className="pin-key pin-key-quiet" tabIndex={-1} onClick={pop} disabled={disabled} aria-label="Delete last digit">
          <Icon name="back" />
        </button>
      </div>
    </div>
  );
}
