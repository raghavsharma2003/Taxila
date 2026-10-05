// The child-safety floor on the puppet's acting (PLAN §6.4: "no wink, no blush animation, no pout and no romance register
// in any preset"; context/decisions.md avatar-behaviour-controller: never a head shake, a sad face, mimicry or emotion
// recognition). The judged runtime's r5 "playful" preset winks (eyeBlinkRight 1.0 pulse); a winking AI teacher is a
// companion register, so it never reaches a child: the wink keys and the pulse are removed from every preset and take at
// load, the one-sided cheek push that went with it is cut to a smile's level, and the result is checked by
// tests/face-puppet-safety (patch) and assertPresetsSafe() at boot. The judged JS is not edited (it is re-synced from the
// polish rounds); this transform is applied to its exported tables once.
import { EXPRESSIONS, VARIANTS, type Preset } from "./runtime/expr.js";

/** Keys no preset may drive: a wink is a deliberate one-eye blink (autonomic blinks come from behaviour.ts). */
const BANNED_KEYS = ["eyeBlinkLeft", "eyeBlinkRight"] as const;
/** A one-sided cheek push above this, with the other side low, reads as a wink-squint even without a blink. */
const CHEEK_ASYM_MAX = 0.4;

function sanitize(p: Preset): void {
  for (const k of BANNED_KEYS) delete p.bs[k];
  delete p.pulse;
  const l = p.bs.cheekSquintLeft ?? 0, r = p.bs.cheekSquintRight ?? 0;
  if (Math.abs(l - r) > CHEEK_ASYM_MAX) {
    if (l > r) p.bs.cheekSquintLeft = r + CHEEK_ASYM_MAX;
    else p.bs.cheekSquintRight = l + CHEEK_ASYM_MAX;
  }
  // a pout (lower lip pushed forward with the corners down) is never a teacher's face
  if ((p.bs.mouthShrugLower ?? 0) > 0.3) p.bs.mouthShrugLower = 0;
}

let done = false;
/** Idempotent: strip the banned acting from every preset and take. Call before the first emote. */
export function applySafetyFloor(): void {
  if (done) return;
  done = true;
  const seen = new Set<Preset>();
  for (const p of Object.values(EXPRESSIONS)) if (!seen.has(p)) { seen.add(p); sanitize(p); }
  for (const takes of Object.values(VARIANTS)) for (const p of takes) if (!seen.has(p)) { seen.add(p); sanitize(p); }
}

/** The violations left in the tables (empty = safe). Used by the boot check and the eval. */
export function presetViolations(): string[] {
  const out: string[] = [];
  const check = (name: string, p: Preset) => {
    for (const k of BANNED_KEYS) if ((p.bs[k] ?? 0) > 0) out.push(`${name}: ${k}`);
    if (p.pulse) out.push(`${name}: pulse`);
    if (Math.abs((p.bs.cheekSquintLeft ?? 0) - (p.bs.cheekSquintRight ?? 0)) > CHEEK_ASYM_MAX + 1e-9) out.push(`${name}: one-sided cheek`);
    if ((p.bs.mouthShrugLower ?? 0) > 0.3) out.push(`${name}: pout`);
  };
  for (const [n, p] of Object.entries(EXPRESSIONS)) check(n, p);
  for (const [n, takes] of Object.entries(VARIANTS)) takes.forEach((p, i) => check(`${n}[${i}]`, p));
  return out;
}
