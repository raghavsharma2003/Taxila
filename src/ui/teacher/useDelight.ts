// One DelightGate per lesson (PD-G7, ReactionGate; moved from src/stage/useDelight.ts, PRODUCT-DESIGN-V2 §13.1).
// A Director effort/insight tag arms the delight; it plays for DELIGHT_WINDOW_MS from her NEXT audio start (the tag
// usually arrives before her speech does), at most once per 5 child turns. Never keyed to correctness: a right
// answer alone is not insight (§4.6), and the face after a right and a wrong answer is the same program.
import { useEffect, useMemo, useRef, useState } from "react";

export const DELIGHT_WINDOW_MS = 1700;

export class DelightGate {
  private lastTurn = -Infinity;
  allow(turn: number): boolean {
    if (turn - this.lastTurn < 5) return false;
    this.lastTurn = turn;
    return true;
  }
}

export function useDelight(tag: { turn: number } | null, speaking: boolean): boolean {
  const gate = useMemo(() => new DelightGate(), []);
  const lastTurn = useRef<number | null>(null);
  const armed = useRef(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!tag || tag.turn === lastTurn.current) return;
    lastTurn.current = tag.turn;
    if (gate.allow(tag.turn)) armed.current = true;
  }, [tag, gate]);

  const wasSpeaking = useRef(speaking);
  useEffect(() => {
    const started = speaking && !wasSpeaking.current;
    wasSpeaking.current = speaking;
    if (started && armed.current) {
      armed.current = false;
      setOn(true);
    }
    if (!speaking) setOn(false);
  }, [speaking]);

  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setOn(false), DELIGHT_WINDOW_MS);
    return () => clearTimeout(t);
  }, [on]);
  return on;
}
