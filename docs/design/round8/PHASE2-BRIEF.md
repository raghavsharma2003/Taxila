# Design revamp, phase 2: brief for the Design session

**From:** the main loop, 2026-11-11. **Decision:** `dc-r8-design-direction-a`. **Branch:** `claude/r8-design`, rebased on `int/r6`.

Phase 2 starts on direction A, "Paper and ink". The owner has not picked between the two directions on the comparison page in a day and had said beforehand that the call on the UI is the main loop's; A is the Design session's recommendation and the main loop's. The owner can still say B, so the build keeps that open.

## 1. Tokens first, and the direction is a theme

- One token file is the single source: type scale, spacing, radii, colours by role, shadows, motion.
- Direction A is the default theme.
- Direction B's values stay as a second theme file that swaps the same tokens. It need not be polished, only complete. One attribute on the root switches it.
- No component uses a literal colour, size or radius.
- This is the reversal path: if the owner prefers B, B's theme is polished; nothing is rebuilt.

## 2. Rebase first: what moved since phase 1

- **Fonts.** They are self-hosted and were broken in production until release 20: Chromium picks a family's weight segment before it looks at unicode-range, so bold Latin fell to the system font. Read `tests/r8-font-match-browser.test.mjs` and `src/styles/fonts.css` before adding or changing a face. Every family declares the same weight ranges for both scripts, and that test must pass with the new faces.
- **Studio owns the board:** `server/forge/explainer/**`, `shared/whiteboard.js`, `src/modules/whiteboard/**`, and the studio-v2 game engines. Since phase 1 it added a maths face, answer marks, a legend, reflex angles, progress dots in games, and a layout check for every engine (`tests/studio-v2-layout.test.mjs`). The board is restyled through tokens Studio's renderer reads. Anything inside those paths goes as a patch under `docs/patches/to-studio/` with before and after images, not as an edit.
- **Games owns** `src/play/**` and its families: same rule, `docs/patches/to-games/`.
- **The teacher's look is still the owner's choice.** Keep the neutral presence (a circle with a voice ring). No face.

## 3. Order of work

Each step is its own commit with before and after screenshots at 360 × 740 and 1366 × 768, under the gates (`npx tsc -b && npx vite build && npm run test:all && node scripts/check-prompt-budget.mjs`). The UI lints are updated to the new rules, not deleted.

| Step | What |
|---|---|
| a | The token file and the two themes, with a contrast test that fails any text pair under 4.5:1 |
| b | The lesson screen on a phone: the board as the hero, the question the second strongest thing, one primary action, the seven stacked zones reduced (phase 1 screens 2 and 3) |
| c | Child home |
| d | Onboarding |
| e | The parent corner: light, in the reading face |
| f | The designed fallbacks: offline home, empty stage boxes |
| g | Retire the classic skin and the Kaksha skin's terminal chrome (slash labels, grid, clipped corners, chevrons). Delete the CSS they leave unused and report the counts before and after (it was 351 colours, 69 font sizes, 44 radii, 36 CSS files) |

## 4. Stop after step b

Send the main loop the commit and the screenshots' paths in the repo (`docs/design/round8/phase2/`), and say which switch turns the new lesson screen on. The main loop puts that one screen in front of the owner on production behind the switch before the rest is built.

## 5. Hard rules

- No model calls, no paid runs, no secrets or `.env` files, nothing under `tests/prod`, no production database, no deploys.
- Never ask the owner anything; ask the main loop.
- No model identifier in commits or files.
- Push after each working step.
- At most two sub-agents at once; remove their worktrees when done (each costs about 4 GB of disk).

**Reverse if:** the owner, shown step b on production, prefers B (then B's theme is polished and A's stays as the alternate), or prefers the current look (then only the non-taste fixes in `DESIGN-REVIEW.md` are kept).
