# Release 11 · G1 · the parent corner in Volt night "calm"

Brief: `docs/design/round4/build/r11/BRIEF.md` (base efc0e721). Decision: `dc-r4-volt-everywhere`; this stream's node:
`dc-r11-g1-parent-volt-calm` (`context/inbox/r11-g1.json`).

## What changed (presentation only)

| piece | how |
|---|---|
| identity | `.pa` (every /parent/* page) and `.pa-gate` (the gate, also mounted by onboarding's GateIfPin) carry K's own scope: `class="kx"` + `data-klook="volt"` + `data-ktheme="night"` + `data-kcalm`. K's `tokens.css` (and the v3 font faces) are imported; no new palette, no new font host. |
| shared components | `src/parent/parent.css` re-points the v2 tokens that Button, PinPad, Sheet, StateChip and Field read (`--paper`, `--surface`, `--ink`, `--nib`, `--p-learning`, `--p-pakka`, fonts, radii) at the k tokens under that scope, the way `childshell.css` does for the child screens. `var()` only: no colour literal. Nothing in `src/ui` changed. |
| calm | no breathing glow and no loop anywhere; lime (`--k-move`) only on the ONE action a page marks `data-volt` (the gate's OK key, Add a child, Download, Change PIN, Save new PIN, Go to the start page); every other primary is ion; secondary buttons are carbon with a hairline. |
| HUD | a mono `// PARENT CORNER · <PAGE>` eyebrow on every page; card titles as mono `//` eyebrows; corner-bracket panels (a hairline frame with brighter corners); chamfered buttons; the HUD grid behind at half the child app's strength; the old warm header art hidden. |
| the four plain words | Not started · Practising · Got it · Secure as mono, square-cut HUD chips: dashed ink-3, half-filled ultraviolet, ion, teal. The words, marks and recheck tags are unchanged. |
| How do we know? | the ledger rows as a timeline: one rail, a diamond node per check (teal when the check was right), the date in mono. Rows, words and order unchanged. |
| floors | text ≥ 14 px (eyebrows and chips at 14), targets ≥ 48 px as before, contrast by token pair (ink / ink-2 / ink-3 / ion / ultraviolet / teal on carbon). |

Not changed: every claim and its rule (`claims.ts`), copy, the helplines (Childline 1098, Tele-MANAS 14416), the "AI
teacher" label beside the teacher, routes, API calls, server, safety files.

## Evidence

- `sheets/<page>.webp`: before (base efc0e721) over after, at 360x800, 412x915 and 1366x768, for every route the parent
  battery drives (home and its 8 states, evidence, progress, lessons, lesson card, notes, controls, children, data,
  help, more, change PIN, gate). The pages are the real built SPA; the data are the battery's fixtures (`/api/*`
  mocked), not the TEST branch: a seeded TEST guardian for every page state was not possible before the 09:30 pass.
- Tests, n = 1 run each, 2026-10-11, this container:
  - parent Playwright battery (`tests/e2e-design-b3-parent.mjs`, unchanged): base 415/418, after 415/418. The same 3
    failures on both, none in parent CSS: V-ONE generic activity, V-NEXT empty submit, V-NEXT wrong password (the
    sign-in step).
  - parent unit tests (`ui-v2-claims`, `parent-state`, `reports-gate`, `r4-asha-ux`, `r4-asha-single-teacher`) 52/52;
    UI lint suites (`ui-v2-lint`, `ui-v3-lint`, `r4-kaksha-lint`, `signals-lint`) 24/24; `scripts/lint-ui.mjs` 353
    findings, 0 in `src/parent`.
  - `npx tsc -b && npx vite build`: pass.
