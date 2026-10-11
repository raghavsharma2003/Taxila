# Release 11 · stream K · the child app, Volt for everyone

Brief: `../BRIEF.md`. Decision: `dc-r4-volt-everywhere`; this stream's entry is `dc-r11-k-kaksha-default-on` in
`context/inbox/r11-k.json`. Base: `claude/blissful-mayer-icwe2j` @ `efc0e721`. Date: 2026-10-11.

## Look at these first

**Before (top row) is what every account saw on base. After (bottom row) is the default now.** Each sheet is one
family at one size. The pages are real, from local production builds of base and of this branch, signed in as a real
test account with a class 3 child (young family) and a class 7 child (older family).

| | 360 × 800 | 412 × 915 | 1366 × 768 |
|---|---|---|---|
| older family (classes 5-9) | [sheet-older__360x800](sheet-older__360x800.webp) | [sheet-older__412x915](sheet-older__412x915.webp) | [sheet-older__1366x768](sheet-older__1366x768.webp) |
| young family (classes 1-4) | [sheet-young__360x800](sheet-young__360x800.webp) | [sheet-young__412x915](sheet-young__412x915.webp) | [sheet-young__1366x768](sheet-young__1366x768.webp) |

- **Pages:** /who, Hello, Home, World, Hangar, Ask, Notebook, Me, Teacher, Practice, and the lesson's first screen.
  The lesson's first screen uses a start answer recorded once and replayed to every build.
- **Single pages:** every page alone is in [`shots/`](shots/), named `before-` / `after-<family>-<page>__<size>.webp`.

## What changed

1. **The default is flipped, in code.**
   - `src/ui-v3/kaksha/flag.ts` `kakshaDecision` now returns `device !== false`. Kaksha + Volt is the child app for
     every account in every build.
   - `?ui=classic` is the per-device escape. It sets the device key "0", and `?ui=default` restores the default.
   - The `TAXILA_UI_KAKSHA` cohort still answers `/api/me` but gates nothing. The server is untouched.
2. **No classic shell anywhere in child mode.**
   - **ChildShell before `/api/me` answers:** it wears the look in the loading, error and signed-out gate states,
     using the night look because the family isn't known yet (`shell-attrs.ts`).
   - **`/who`:** it wears the same scope (`src/app/Who.tsx`). The young look is used if any child is in classes 1-4.
   - **The rest of child mode:** Hello, the teacher screen, Ask, Notebook, Me, Practice and the lesson frame wear the
     look through ChildShell and `childshell.css`, as they have since release 10 for the cohort.
   - **Play frame chrome** (`src/play/play.css` `.pl-root`): it takes Kaksha's faces, and its default paper ground takes
     the look's tokens inside the Kaksha lesson. The deliberate per-level art directions (chalk, blueprint, raat) keep
     their grounds. The dev Briefing page now sets the look as the lesson does.
3. **Me: the Captions row was cut at 412 px.**
   - Cause: `.me-text` was `flex: 1; min-width: 0`, so the segmented choice squeezed the label to a few letters.
   - Fix: a `9rem` basis. The choice now wraps under the label, which also fixes Teacher face and Theme
     (`src/child/child.css`).
4. **Juice for Gen Alpha, inside `dc-r4-gamification-b`** (`futurist.css`, `Orbit.tsx`, `Settlement.tsx`,
   `Debrief.tsx`):
   - **World depth:** two parallax star layers, the planet's light, the child's ship on its own orbit, and a horizon
     glow under the base.
   - **The Debrief's earned moment:** light rays turning behind the badge and a ring pulse, on top of the burst. It
     appears only when the ledger says a skill crossed to secure, names the idea and what it builds, and counts
     nothing (`K-ECON` stays green).
   - **Throughout:** all of it is decoration (`aria-hidden`), and reduced motion stills it.
   - **Shots:** `../../kaksha/futurist/shots/volt-*-{world,base,debrief}__*.webp`.

**Tokens: nothing renamed or removed.** No new `--k-*` token was added either. The other three streams' scoping
(`.kx` + `data-klook="volt"` + `data-ktheme`) is unchanged.

## Certificates (measured 2026-10-11)

| check | n | result | method |
|---|---|---|---|
| every child page, after | 63 pages | **0 findings** | `tests/prod/r11-k-sheets.mjs` on the AFTER build: text ≥ 14 px, Devanagari ≥ 16 px, targets ≥ 44 px, WCAG contrast on the composited ground, no horizontal overflow at 360, LOOK-1 (the page is in the Volt look), AI-1 (her AI label wherever her face shows) |
| **parity: what each screen says** | 63 pages | **0 differ** | SAYS-1. Each AFTER page's visible words equal the same page on base with the account in the old cohort, i.e. the Kaksha the owner already had. The text is whitespace-normalised and the clock greeting is masked. Her live question on the card is masked because practice starts a new set on every load |
| Kaksha dev pages (Volt) | 24 pages | 0 findings | `tests/prod/r4-kaksha-futurist-shots.mjs`, including TRUTH-1 (the Debrief names exactly the skill that crossed) and EARN-1 |
| unit tests | 57 | pass | `tests/r4-kaksha-*.test.mjs` (the default flip, the `?ui=classic` escape, the shell attributes for every account, six palettes ≥ 5:1, tokens mirrored, the economy lint), and `tests/ui-v3-lint.test.mjs` (the one-volt law) |
| lint-ui | whole tree | 353 (baseline) | `node scripts/lint-ui.mjs --json` |
| tsc + vite build | | pass | |
| full `npm test` | | see the head commit | |

## Not done, or not mine

- **The game world art.** Inside the play frame, the canvas a level draws comes from that level's art direction
  ("kagaz" is a paper texture). It belongs to the game engines and the dress, not the frame chrome, so it's left as is.
  G1 owns the dress.
- **Her face window's cream ground.** The face packs were cut on a cream clear colour. K-P1 (lit ground on `<Teacher>`)
  is what lets it follow the look; it's in `src/ui/teacher/`, not this stream's files.
- **The real-phone check.** Every number here comes from headless Chromium on this container, not a phone.
