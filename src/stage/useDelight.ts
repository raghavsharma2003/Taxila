// One DelightGate per lesson (PD-G7). The stage remounts on every geometry change (main, PiP, face chip,
// cover), so the gate cannot live inside TeacherStage: it lives in the lesson screen, which calls this once.
// A Director insight/effort tag arms the delight; it plays for DELIGHT_WINDOW_MS from her NEXT audio start
// (the tag usually arrives before her TTS does), and at most once per 5 child turns.
import { useEffect, useMemo, useRef, useState } from "react";
import { DelightGate } from "./faceController.ts";

export const DELIGHT_WINDOW_MS = 1700;

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
