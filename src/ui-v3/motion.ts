// Motion tokens (DESIGN-V3 §4). Principle: motion means something happened (state, where it went, what the idea is).
// UI chrome settles; the stage performs. Spring is ONLY for the child's own drop/release. Exits run at 0.75x.
// Reduced motion (OS setting or the in-app switch) turns every animation into a <= 1 ms cross-fade; a game keeps working
// but loses particles. Erasable TypeScript; the React hook lives in V3Root.tsx so this file stays importable by node tests.

export const MOTION = {
  press: 90,
  quick: 160,
  base: 240,
  stage: 420,
  cine: 720,
  spring: 500,
  /** Coach marks leave on first input or after this long, whichever is first (DESIGN-V3 §6.5). */
  coachMark: 2600,
  /** Teacher speaking-ring pulse period. */
  talkPulse: 1400,
} as const;

export const EASE = {
  std: "cubic-bezier(.2, .8, .2, 1)",
  exit: "cubic-bezier(.4, 0, 1, 1)",
  spring: "cubic-bezier(.34, 1.36, .64, 1)",
} as const;

export type MotionToken = keyof typeof MOTION;

/** Duration for a token, honouring reduced motion and the exit rule. */
export function dur(token: MotionToken, opts: { reduced?: boolean; exit?: boolean } = {}): number {
  if (opts.reduced) return 1;
  const ms = MOTION[token];
  return opts.exit ? Math.round(ms * 0.75) : ms;
}

/** Whether the OS asks for reduced motion (false outside a browser). */
export function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
