// Press and hold to confirm. Used for the "I am the parent" gate at P2 (stops a young child; §2.2) and for
// destructive actions (hold 2 s, §6.9). Single pointer, no drag (WCAG 2.5.7); keyboard: hold Space or Enter.
// Releasing early cancels; sliding off cancels (2.5.2). The fill is the visible progress; reduced motion
// keeps the timing and drops the animation.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ButtonVariant } from "./Button.tsx";

export function HoldButton({ ms = 1200, onConfirm, children, variant = "primary", block, hint = "Press and hold" }:
  { ms?: number; onConfirm: () => void; children: ReactNode; variant?: ButtonVariant; block?: boolean; hint?: string }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const cancel = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; setHolding(false); };
  const start = () => {
    if (timer.current) return;
    setHolding(true);
    timer.current = window.setTimeout(() => { timer.current = null; setHolding(false); onConfirm(); }, ms);
  };
  useEffect(() => cancel, []);
  return (
    <button type="button" className={["btn", `btn-${variant}`, "hold", block && "btn-block"].filter(Boolean).join(" ")}
      data-holding={holding} style={{ ["--hold-ms" as string]: `${ms}ms` }}
      aria-describedby={undefined}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); start(); }}
      onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel}
      onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") cancel(); }}
      onContextMenu={(e) => e.preventDefault()}>
      <span className="hold-fill" aria-hidden="true" />
      <span>{children}</span>
      <span className="sr-only">. {hint} for {Math.round(ms / 100) / 10} seconds.</span>
    </button>
  );
}
