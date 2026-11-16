# Step j: the production-build walk (2026-11-11)

**What was walked:** every route in `src/app/routes.tsx` and `src/child/routes.tsx`, plus the parent corner's pages.
- Themes A and B, at 360 × 740 (@2x) and 1366 × 768.
- The production bundle (`vite build`, no dev routes), served by `server/serve.mjs`.
- Every `/api/*` call is mocked: the parent corner uses step e's fixtures, and the child and the lesson use the dev lesson script (`src/child/lesson/dev/script.ts`).
- A game is taken from Games' play harness (`src/play/dev`, todo-jodo; kagaz for A, raat for B), because no route reaches one without a live level.

**Files:**
- **Images:** `<theme>-<screen>-<p360|d1366>.webp`, 140 of them, at about 24 KB each.
- **Data:** `walk.json` has one row per screen:
  - the path it ended on;
  - whether a `data-tx` root was present;
  - counts of visible mono, uppercase and clipped-corner elements;
  - sideways scroll;
  - page errors;
  - the API calls the mocks did not answer.

**Signed out:** landing, promises, trust (it redirects to promises), privacy, pricing, pair, leaving, help, sign-in, `/start/class`, `/start/phone`, 404.
**Signed in:** `/who`; the parent's home, progress, lessons, controls, children, help, notes, teaching, data, family and more; the child's home, hello, world, hangar, notebook, me, ask, teacher, practice; a lesson; a game.

## Result

Every screen carries the theme. After this step's fixes, the counts across all 136 app screens are:
- 0 monospace;
- 0 clipped corners;
- 0 sideways scroll;
- 0 page errors.

Controls had 2 uppercase labels left in the schedule picker, which is fixed after the walk.

### Fixed during the walk (in this step's commit)

| what | where | fix |
|---|---|---|
| **B's light surface lost in the production build.** Set-up (and every `data-tx-surface="light"` screen in B) rendered night. | `src/styles/tx-tokens.css` | The minifier wraps a selector list holding `:has()` in `:is()`, which takes its strongest argument's weight (0,4,0). The `:has()` branch now sits in `:where()`, and a test fails on a bare `:has()` in a token block. The dev server never showed this; only the built app did. |
| The face picture on Hello and Your teacher | `Comms` (`src/ui-v3/kaksha/Shell.tsx`) | Under `?tx=` her presence replaces the picture everywhere `Comms` is used. Where the caller prints her name and "AI teacher" itself (`showName={false}`), the circle's own pair is hidden and read once. |
| Hello's terminal list ("> TEACHER ONLINE …") | `r8/kx.css` | Hidden under the theme. It is decoration (`aria-hidden`). |
| "// " eyebrows on Me and Ask; clipped top-bar buttons; the HUD switch ("OFF") | `r8/kx.css` | Sentence case in the UI face; round buttons; a pill switch. |
| The schedule picker: 118 mono uppercase day and month labels at 11–12 px (Controls; set-up has the same picker) | `r8/parent.css`, `r8/onboarding.css` | The picker's own `--sch-*` tokens point at the theme. Labels use the UI face at the 14 px floor, in sentence case. |
| An empty white card above "Tap to hear Asha" before her first turn (lesson and practice) | `r8/lesson.css` | No card while the rail holds only the empty placeholder. The measured space stays. |

## Still in the old look, or broken: the remaining work

| # | screen or part | what | owner |
|---|---|---|---|
| 1 | **Every game** (`src/play/**`) | Mono uppercase family label ("TODO-JODO"), a diamond mark, and the old `--pl-*` palette, which does not follow `?tx=`. The selected block is outlined in the olive/lime "you" colour, which reads as green before anything is checked (law 1). | Games: `docs/patches/to-games/002-tx-roles/` |
| 2 | **Studio pieces on the board** (lesson) | The card head band and the "Picture" chip above the piece; content not fitted to the card; the "1/2" label touching the square. The board's role values are still Studio's draft. | Studio: patches 008 and 009 |
| 3 | The landing's game section | The Antariksh still and its looping video are the old look. | Re-capture after Games lands 002 (Design) |
| 4 | **Step g** | Every old stylesheet still loads and is overridden: futurist.css, the Volt look blocks, the Desk's terminal dress, volt.css, the parent corner's calm Volt, child.css. | Design, with the default flip (three commits, as ruled) |
| 5 | ~~Boot skeleton in B on grown-ups' pages~~ | **Fixed after the walk.** B's skeleton is light on every page but the child's (`/c/…`, `/who`). | Design |
| 6 | ~~The landing under `?tx=` preloads the old capture~~ | **Fixed after the walk.** The inline script reads the theme first and preloads `/site/tx/<theme>-desk.webp`. | Design |
| 7 | Parent, "How the teacher teaches": the heading reads "How The teacher teaches Riya" when her name is not loaded (seen with the teaching read failing) | A capitalised fallback in the heading template. | Learning (`src/parent/**`), one word |
| 8 | ~~Hello's greet card printing her name twice~~ | **Already fixed in this step:** the greet card passes `showName={false}`, so the circle's own pair is hidden there. | Design |
| 9 | Not reachable in this walk | The lesson with a live board turn on the production build (the dev Desk shots of steps b and f cover it); a game inside a lesson; the debrief and end screens; error states other than offline. | The next walk, with a live test account (main) |

**Mock gaps.** These are not faults: the mocks did not answer some calls, so a "This isn't here any more" line shows on parent Progress and How the teacher teaches. The unanswered calls are `/api/face/config`, `/api/duplex/config`, `/api/child/equip`, `/api/parent/{teaching,memory,school,schedule,household,chapters,test-window,made-for}` and `/api/placement/*`. The lines are the screens' designed fallbacks.
