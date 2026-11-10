# Audit: journey (the product as a child and a parent meet it), 2026-11-10

Area 13 of `docs/design/round7/audit/BRIEF.md`. Audit only: no product code changed. Owner standard: `docs/design/OWNER-RESET-2026-10-04.md` (items 1, 9, 12: no babyish look, **zero visible failure**, proper presentation).

## How this was run, and what it cannot show

- The built app (`dist/`) served by `tests/support/app-server.mjs`, Chromium (the preinstalled one), touch on, 360x640 and 412x860. Every `/api/**` call is answered by a mock written for this audit (nothing reached a real server; nothing under `tests/prod` ran). The audit scripts live outside the repo; the mock fixtures follow `shared/contracts.ts`.
- **Could not reach without the live services:** a real teacher reply and the real voice lanes (turn-audio, duplex, TTS stream, STT; the mock answers text turns and a one-second silent WAV for `/api/tts`); real board pictures, Studio builds and games from Forge; real lesson content, grading and the learner state; the real numbers in the parent corner (Progress, Controls and Data pages threw "Something went wrong" on my hand-made fixtures, so I could not judge them; that is my fixture, not a finding); Notebook pages with real `made for you` links (APP-01, APP-02, APP-07 not run); sign-in by email code and password (the form renders; nothing was submitted).
- Mic: headless Chromium has no microphone, so every default (voice mode) lesson shows the "mic is off" card. A child who denied the mic sees the same.
- Screenshots: `docs/design/round7/audit/journey/`. Files named `JRN-APPnn-…` confirm an app-audit finding; `JRN-…` without an id back a new finding below.

## Confirmed or refuted from the app audit (`app.md`)

| App id | Result on screen | Screenshot |
|---|---|---|
| APP-03 | **Confirmed.** Pause → End lesson → Short break: no request leaves the page (no `/api/lesson/turn`); behind the "On a break" sheet the card has an empty "Your answer:" chip and the footer says "Asha is thinking" for the whole break. | `JRN-APP03-break-sheet-empty-answer-360.png` |
| APP-04 | **Confirmed in a second way.** A Studio piece (sort_bins) is on stage in text mode. With the same lesson in voice mode and no mic, the piece never appears: the child sees the question "Sort them" and a text box, no activity. (I did not find the Help button the audit names; the no-mic route reproduces the same vanishing.) | `JRN-APP04-studio-piece-missing-nomic-360.png` |
| APP-06 | Consistent. The World's "Sealed chapters" chip ("Fractions") shows no date and is not tappable. | `s12` (not kept) |
| APP-08 | **Confirmed.** `/who` with a 500 shows only "internal error"; with the network down, only "Failed to fetch". No button, no way forward. | `JRN-APP08-who-raw-error-360.png` |
| APP-09 | **Confirmed, and worse than stated.** A class 2 child on the held Home taps Help: the "Call Childline 1098" and "Call Tele-MANAS 14416" buttons are white on white; only the label is faintly visible. These are the safety numbers. | `JRN-APP09-young-hold-helplines-invisible-360.png` |
| APP-10 | **Confirmed.** `/parent` with a slow `/api/me`: blank page at 0.7 s. | `JRN-APP10-parent-blank-loading-360.png` |
| APP-11 | **Confirmed on desktop only.** On `/promises` at 1100 px, "How a lesson works" goes to `/#lesson` and the page stays at the top (section at y=833, scrollY 0). On phones the link is not in the header, so a child's or parent's phone never meets it. Lower to P2. | `JRN-APP11-how-lesson-desktop.png` |
| APP-12 | **Confirmed.** Tapping "Diagram" draws "Your answer: Diagram bana ke dikhao" on the question card; the request goes out as `chipId: steer:picture` with `typed: true`. | `JRN-APP12-steer-as-answer-360.png` |
| APP-13 | **Confirmed.** First frame with scripts held back: `/pricing` and `/signin` cream (246,243,236); `/promises` dark (8,9,11). | `JRN-APP13-pricing-firstpaint-cream.png`, `JRN-APP13-promises-firstpaint-dark.png` |
| APP-20 | **Confirmed.** World with the map read failing (500) shows "Your first secure idea lands here" for a child who has secure ideas; same text while the read is slow. | `JRN-APP20-world-failure-first-idea-360.png` |
| APP-21 | **Confirmed at 360x640 only.** Number pad: the Hint and "123" (mic) buttons start at y=635/638, so the dock is cut by the screen. At 412x860 the whole dock fits. | `JRN-APP21-numpad-dock-below-fold-360.png`, `JRN-APP21-numpad-fits-412.png` |
| APP-22 | **Confirmed, and worse for `/c/:id/…`.** `/start/typo` shows a cream "This page is not here" card; `/c/<child>/typo` shows the public marketing 404 (header with Sign in and START, footer) inside the child's app. | `JRN-APP22-404-start-cream-360.png`, `JRN-APP22-404-child-marketing-360.png` |
| APP-01, 02, 07, 14, 15, 17, 18, 19 | **Not confirmed or refuted.** Need Notebook data from a real server, a Hindi child, a cosmetic equip or a newly secure station. For APP-18 the orbit looked the same with Less motion on. | none |

Nothing under 44 px on any child screen except the items in JRN-08. No sideways page scroll anywhere (scrollWidth equals the viewport on all 60+ screens and states I opened).

## New findings

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| JRN-01 | P1 | broken | voice | When speech cannot be fetched, none of the teacher's words reach the screen and "Asha is thinking" never clears | cause not traced. `src/lesson/textLink.ts:98-100` emits the caption before the speech fetch and `:203-208` releases the floor on failure (a code-only skeptic read says it should work), yet the page held no teacher text; look at what the card shows when the floor is not "speaking" (`src/child/lesson/useDesk.ts:354,804`) | show the reply's caption on the card whenever sound failed, and find why "Asha is thinking" stays | open (reproduced, cause open) |
| JRN-02 | P1 | broken | app | At 360x640 the "mic is off" card runs under the steer chips: its "Not now" button (y 426-474) sits under the chip row (y 400-448) and its second line is cut off | `src/child/lesson/AnswerDock.tsx` and the lesson layout (`src/ui-v3/kaksha/lesson/stageLayout.ts`) | give the notice a slot of its own, or one line and a visible dismiss | open |
| JRN-03 | P1 | inconsistent | app | The held child's Help sheet ends with "Back to the lesson", but a held child has no lesson to go back to (the Home says "Let's take a break today") | held Home help sheet; screenshot `JRN-held-help-back-to-lesson-360.png` | label it "Close" for `safety_hold` | open |
| JRN-04 | P2 | not good enough | app | Hello (the first screen a child ever sees) pushes its next step below the fold at 360x640: "Next" at y 683, "That's me" at y 670, "Next" after the school-feel faces at y 716. While the first line plays, the only button says "PLAYING" and is disabled | `src/child/screens/Hello.tsx` | keep the primary button in the bottom bar; shrink the face on short screens | open |
| JRN-05 | P2 | not good enough | app | Tab strips cut the last tab with no sign there is more: Notebook ("Questions" starts at x=358 of 360; "Made for you" is cut) and the parent Notes cadence strip ("This term" at 307-403) | `src/child/screens/Notebook.tsx` tabs; `src/parent/Report.tsx` | wrap to two rows, or fade the edge | open |
| JRN-06 | P3 | not good enough | app | Small targets: public Help page "112" link 24x22 (412 wide); Pair "Back" 38 wide (its 48 px height is fine; the "I heard it" box is 22 px but its label is 48 px tall, so that one is not a finding) | `src/app/Public.tsx:116`, `src/app/Pair.tsx` | min 44 px hit area | open |
| JRN-07 | P3 | inconsistent | app | The onboarding sound-check page has no "Step n of 5" header and no progress bar, unlike the class, promises, account and consent pages | `src/onboarding/Check.tsx:91` passes `step="check"`, which is not in `STEPS` (`src/onboarding/Layout.tsx:36`), so the header and bar are skipped | add it to the step list or pass a real step | open |

## Evidence notes

- **JRN-01.** Same lesson, same typed answer "yes", in text mode. With `/api/tts` answering a WAV: the opening and the reply are both in the page text within 4 s. With `/api/tts` and `/api/voice/tts-stream` answering 503: neither the opening ("Chalo, aaj angles…") nor the reply is anywhere in the page, for 40 s; "Asha is thinking" appears from 20 s and stays. Only the pinned question shows, under a strip that says "Sound didn't play. Read it on the card." There is nothing else on the card to read. Screenshot `JRN-tts-fail-asha-thinking-360.png`. Caveat: the failure is a mocked 503; a real timeout may differ. Owner-reset item 9 (zero visible failure) says this must never leave the child stuck.
- **JRN-02.** Measured: "Not now" 131,426 98x48; chips y 400-448 at 360x640; at 412x860 the card is shown whole. `JRN-lesson-mic-card-clipped-360.png` (360), `JRN-lesson-mic-card-412.png` (412).
- **JRN-03.** `JRN-held-help-back-to-lesson-360.png` (class 5 child, dark skin, held): the sheet is readable there; the wording is the issue.
- **JRN-04.** `JRN-hello-next-below-fold-360.png`, `JRN-hello-last-step-360.png`. Button bottoms read from the page: 683, 670, 716.
- **JRN-05.** `JRN-notebook-tabs-clipped-360.png`, `JRN-parent-notes-tabs-clipped-360.png`.

## Skeptic pass

A sub-agent tried to refute the seven new findings from the code. JRN-03 and JRN-07 confirmed. JRN-04, JRN-05 and JRN-06 partly (the pixel positions came from the running app; it checked code only). It could not reproduce JRN-01 from `textLink.ts`, so JRN-01 is kept as reproduced on screen with the cause open, and the checkbox part of JRN-06 was dropped. JRN-02 was not checked by it; the overlap is in the screenshot.

## What worked (so the owner knows what was checked)

Public pages (landing, promises, pricing, help, privacy, leaving, 404, sign-in, pair) at both sizes: no overflow, no console errors beyond the 401 the mock sends. Onboarding steps class, promises, account, consent, sound check, hand-over, "ask a parent", forgot: render, no overflow. Hello runs end to end into a first lesson ("Say hi"). Home in nine plan states (start, first, resume, done, resting, capped, held, test window, homework): one clear next action each, no raw text, two-line copy that fits. Lesson shell: typed answer, number pad, steer chips, Pause, End sheet all work at 412x860. A failed lesson start shows "We couldn't start the lesson. Try again / Go home". A child id that is not in the family shows a sign-in sentence and a Home button. Parent corner Home, Lessons, Notes, Children, Help, More render at both sizes.

## Coverage

Read fully: the app audit's P1 list; `lessonWith` in `studio-stage-states.test.mjs`. Run: about 60 screens and states at 360x640, about 30 at 412x860. Sampled: onboarding steps were opened directly, not walked by submitting the forms. Not run: games (no Forge content without a server), the lesson's end screen and the Notebook with real pages, sign-in submit, the parent's Progress, Controls, Data, Teaching and Lesson-card pages with real shapes.
