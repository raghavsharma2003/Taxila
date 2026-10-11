# Release 11, stream 5: set-up and sign-in in Volt

Brief: `docs/design/round4/build/r11/BRIEF.md`; decision `dc-r4-volt-everywhere`. Presentation only: the same
five steps, fields, validation and consent words. Nothing in `server/**` or the safety files.

## What changed (all in `src/onboarding/**`)

- **One scope, K's tokens.** `StepFrame` (the one frame for every /start/* screen: the five steps, sign-in, forgot,
  reset, the auth errors) renders `.kx` + `data-klook="volt"` + `data-ktheme="night"`. `src/onboarding/volt.css`
  re-points the v2 tokens the shared components read at K's `--k-*` tokens, as `childshell.css` does for the
  child screens. It has no colour literal and no new font host (the Space Grotesk and Geist Mono faces K already ships).
- **A game set-up.**
  - A HUD bar: "STEP n OF 5" in mono, one slanted cell per step lit in ion, the current cell glowing.
  - A mono `//` eyebrow per step: Loadout, Ground rules, Your account, Permissions, Hand-off.
  - Big chamfered tiles that select with an ion frame.
  - Corner-bracket panels for consent and the PIN.
  - Styled voice previews (ion audio chips).
  - Diamond PIN dots and chamfered keys.
  - On the laptop, a HUD console centred on the carbon grid.
- **One lime element per screen state:** the step's primary action, as a chamfered slab with a light sweep. The PIN
  pad's OK, the brand mark, the promise icons and a disabled primary are kept off lime.
- **The child's moments in her family look.** Her voice previews (step 1) and her name (step 5) sit in a nested
  `.kx` panel themed by her family. Classes 1-4 get Volt day "toy plastic" (ink outline, hard offset shadow); older
  children get Volt night.
- **Fixes on the way:**
  - The title takes focus on every step but no longer draws a box (main's release 9 screenshots).
  - The `»` on the CTA has empty alt text, so a button's name stays "Sign in".
- **Floors:** text >= 14 px, targets >= 44 px, no horizontal scroll at 360 / 412 / 1366 (measured), reduced
  motion stills the sweep and pulse.
  - The promises hold gate stays above the fold. Top/bottom at 360 x 800: 653/713 (it was 708/756 after patch 10).
    At 412 x 915: 633/693. At 1366 x 768: 689/749.

## Evidence

- `sheet-{before,after}-{360,412,1366}.webp`: every surface in order on a production build against this stream's
  Neon TEST branch, a fresh account per viewport, full-page:
  - sign-in, a wrong-password error, forgot password;
  - each step on arrival and filled;
  - the hand-off into child mode.
- Harness: `tests/prod/r11-asha-setup-shots.mjs`; sheets: `tests/prod/r11-asha-sheets.py`.
- Each run's page errors, overflow and hold-gate box are in `{before,after}-run.json`. Both runs had 0 page errors
  and 0 overflow.
- Tests: `tests/r11-asha-volt.test.mjs` (5 tests). They check:
  - the scope and the five steps;
  - no colour literal in the layer;
  - lime only on the primary;
  - the child panels' family look;
  - the 14 px floor, and the CTA mark and title focus fixes;
  - consent and the AI-honesty words.

## Not mine / open

- **The hand-off's first child screen (Hello)** is still the classic warm look in these shots. It is K's
  surface; K is flipping Kaksha + Volt on by default for every account.
- **Sign-in eyebrow:** `// TAXILA` (sign-in has no step).
