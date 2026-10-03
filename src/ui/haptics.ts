// Haptics (PRODUCT-DESIGN-V2 §9.3). The web path is navigator.vibrate; the Android shell (Capacitor Haptics) is
// picked up when it is present. Off when the child or parent turned haptics off; a wrong answer NEVER vibrates
// (there is deliberately no pattern for it here).
export type HapticKind = "your_turn" | "tick" | "correct" | "trouble" | "wrong_pin" | "hold";

const PATTERN: Record<HapticKind, number | number[]> = {
  your_turn: 20, // one light impact
  tick: 10, // mic open / Done / heard
  correct: 35, // Young only: one medium impact
  trouble: [10, 80, 10], // two light impacts, 80 ms apart
  wrong_pin: [30, 80, 30],
  hold: 20, // the hold gate's start and end
};

let enabled = true;
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

interface CapHaptics { impact?(o: { style: string }): Promise<void> }
function capacitor(): CapHaptics | null {
  const w = globalThis as unknown as { Capacitor?: { Plugins?: { Haptics?: CapHaptics } } };
  return w.Capacitor?.Plugins?.Haptics ?? null;
}

/** Fire one pattern. Returns the call time (performance.now) for the same-frame check, or -1 when skipped. */
export function haptic(kind: HapticKind): number {
  if (!enabled) return -1;
  const t = typeof performance !== "undefined" ? performance.now() : 0;
  try {
    const cap = capacitor();
    if (cap?.impact) {
      void cap.impact({ style: kind === "correct" || kind === "wrong_pin" ? "MEDIUM" : "LIGHT" }).catch(() => {});
    } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(PATTERN[kind]);
    }
  } catch {
    /* no haptics on this device */
  }
  if (typeof performance !== "undefined") performance.mark?.(`haptic:${kind}`);
  return t;
}
