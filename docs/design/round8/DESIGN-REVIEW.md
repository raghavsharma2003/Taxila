# Design review of the app as released on 2026-11-10 (release 16)

**By:** the main loop, from pixels. **n:** 179 screens at each of two sizes (phone 360 × 740, desktop 1366 × 768), captured from the int/r6 tree of integration 24 with a faked API and a simulated child (Riya, class 5). Kept beside this file in `ui-now/`: the capture's index (`INDEX.md`, which lists all 358 shots; only the ones named here are in the repo), four phone contact sheets (`contact-p360-1.png` to `contact-p360-4.png`), one desktop contact sheet (`contact-d1366-1.png`), and eight full screens: `42-home-start-p360.png`, `100-lesson-17-work-beat-p360.png`, `100-lesson-17-work-beat-d1366.png`, `100-lesson-04-your_turn-p360.png`, `111-play-01-taraazu-levelend-p360.png`, `123-parent-home-p360.png`, `20-onb-class-p360.png`, `92-err-offline-home-p360.png`.

**Why now:** the owner said on 2026-11-10 that the UI, UX and design are "extremely bad" and need a revamp, then noted they had only seen the October build, and left the call to the main loop: revamp if the new version is still not good.

## Verdict

**It is a different design from the one the owner rated 0 of 100 in October, and it is still not good enough. The revamp goes ahead.** The October faults were babyish chrome and cheap presentation. The chrome is no longer babyish. Three of the faults remain, and one new one was added.

## What is wrong, in order of how much it costs the product

| # | Fault | Where it shows | Why it matters |
|---|---|---|---|
| 1 | **The teacher looks like a toddler.** A big-eyed cartoon child's face on a cream tile is the largest thing on the home screen (half the phone) and on the lesson screen before a board is up | home (all states), hello flow, lesson idle, the corner picture in every lesson | It is the October complaint ("for a five-year-old") in the one place it cannot be missed, and it fights the dark instrument-panel chrome around it. The design spec (DESIGN-V3 §3.4) asked for a semi-realistic adult |
| 2 | **The board is not presented well.** White wire strokes and a monospace equation on black, in a frame much larger than its content; fractions written "1/2 × 1/2 = 1/4" on one line; no colour that carries meaning beyond one tint | every lesson board state | The owner's bar is 3Blue1Brown and Brilliant. The lesson is the product, and the board is the lesson. Maths set in a code font reads as a terminal, not as teaching |
| 3 | **The chrome swapped one gimmick for another.** "// YOUR CHILD" slash-labels, a grid background, clipped corners, chevrons on every button, monospace uppercase eyebrows everywhere | onboarding, home, parent corner, notebook, map | It reads as a hacker terminal. A 12-year-old may accept it; a parent reading a weekly report in tiny grey monospace on black will not. DESIGN-V3 made the parent corner a light theme by default; it was built dark |
| 4 | **The child's task is not the strongest thing on the lesson screen.** On a phone the lesson has seven stacked zones (header, picture chip, board, caption, question, four steer chips, dock). The question is small text in a row with a button | lesson, phone | She asks a question and the screen does not make it obvious what to do next |
| 5 | **Three designs are live at once.** A light "classic" skin, the v3 tokens and the shipped Kaksha skin: 351 distinct hex colours, 69 font sizes, 44 corner radii, 36 CSS files | the classic home and map still render; hangar has a light "dawn" look that nothing else has | Every new screen picks its own values. Inconsistency reads as cheap |
| 6 | **Small faults that look broken.** The offline home is a blank white page. Empty stage boxes on the play and studio lesson states. Bottom-nav labels cut off at 360 px on some pages | `92-err-offline-home`, `100-lesson-19/20`, parent pages | Zero visible failure is an owner rule |

## What is right and stays

- The lesson's structure on desktop: board left, teacher and dock right, one question bar.
- The games. They are one coherent blueprint look, with real things to move (a balance, a clock, bars, a number line). They are the best-designed part of the product.
- The parent corner's content: evidence with "How do we know?", the five-minute home task, plain-word controls. The words are right; the dress is wrong.
- No streaks, points or leaderboards. No emoji. No mascots apart from the teacher's face.
- Hands-free talk as the default, with the mic as a state readout.

## Direction

Two candidate directions are prototyped as static screens before any product code changes, and the owner picks, because this is taste. Both share the fixes that are not taste:

- The board is the hero of the lesson. Maths is typeset as maths (stacked fractions, a real maths face), colour carries meaning (the part being talked about, the answer, the mix-up), and the board fills its frame.
- The question is the second strongest thing on the screen, and there is one primary action.
- The teacher is a small presence (a face in a circle with a voice ring), never the hero image. Until the owner chooses Asha's look, prototypes use a neutral placeholder.
- One token set: one type scale of at most eight sizes, one spacing scale, three radii, a palette of under 30 colours. The classic skin is retired.
- The parent corner is light by default, in a reading face, with no slash-labels.
- Every state has a designed fallback; no blank page, no empty box.

| | A. "Paper and ink" | B. "Night class" |
|---|---|---|
| Ground | warm off-white; the board is paper | the current dark, kept |
| Feel | Brilliant, a good textbook, Apple's education apps | a calmer version of what is built |
| Accent | one warm accent (marigold) with indigo for the teacher | the lime kept for "your move", indigo for the teacher |
| Chrome | soft rectangles, real shadows, no decoration | the terminal affectations removed: no slash-labels, grid, clipped corners or chevrons |
| Risk | reads younger if done badly; needs discipline to stay grown-up | stays cold; parents still need a light corner |

**Reverse if:** the owner, having seen release 16, says the current look is acceptable (then only the non-taste fixes above are built, on the current skin).

## Status

- 2026-11-10: the owner first asked to pause the revamp until they had seen the new build, then left the call to the main loop ("both you decide"). The main loop's call: phase 1 (two directions as static prototypes, no product code) goes ahead now; phase 2 (building one into the product) waits for the owner's pick between A and B. Release 16 put this build in front of the owner the same day.
- Decision: `dc-r8-design-revamp-two-directions`.
