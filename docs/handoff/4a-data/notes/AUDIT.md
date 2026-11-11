# End-to-end journey audit · round 4 · 2026-10-10 / 11 (test clock +1 day)

Observation only. No product code was changed.

**Builds**
- **A: today's product.** Base `claude/blissful-mayer-icwe2j` @ 4f92408c (= what main integrates), production flags.
- **B: Kaksha + session-first.** Stream K `claude/r4-app-design` @ a0da1109 (read-only checkout), built with
  `VITE_UI_KAKSHA=1` and served with `TAXILA_SESSION_FIRST=on`.

**Setup.** Both are local production builds started with
`--env-file=.env.local --env-file=tests/prod/prod-routing.env` (production model routing; prefetch on in the server), on
stream 5's own Neon test branch. The r4-timeline driver ran them in headless Chromium at phone 360 × 800, with one laptop
pass at 1366 × 768.

**Real:** the server, the models, the Diya DragonHD voice, the lesson runtime and the database.

**Faked:**
- The microphone: a synthetic child clip.
- Transcription: a fixed 750 ms commit → final. The words are the script's.
- Location: the container is in the US; production speaks from India, so voice timings run long here.

Read every number as "local build, fake ASR, US container, not a child". The children were Riya (class 4, account made
through the real UI) and Kabir (class 7, account made by the harness's API). Screenshots are in `shots/A/` and `shots/B/`
(WebP, named by step).

## The owner's vision, scored (A today / B with Kaksha + session-first)

| vision | A | B | evidence |
|---|---|---|---|
| A fully gamified app | **1/5** | 2/5 | A: no game, simulation or play piece in 3 lessons. The only visual is a whiteboard flow-chart and a number pad (A22-04, A35-03). Asked "Mujhe game khelna hai" twice, she calls the boxes "a game" (A24-04, A35-03). B adds a gamified shell (Kaksha Home, the "orbit" World, B07, B09); inside the lesson it is the same. |
| Games and content built on the go | **0/5** | 0/5 | No Forge/Studio piece was built or shown for either child. The parent corner says "Made for Riya: Nothing made yet" after 2 lessons (A38). |
| She knows whether the child understood | 2/5 | 2/5 | Graded right: the number pad (A23), not_yet on a true but off-question answer (A27-03). Wrong: praises a non-answer (A22-03), accepts a partial answer (A24-03), leaves a correct answer ungraded and repeats the question twice (A25), leaves Kabir's correct "2/3 × 3/4 = 6/12" ungraded (B04-05). |
| A human-like tutor with a bond | 2/5 | 2/5 | She uses the child's interests well (cricket, school bag, bat). But every new lesson re-introduces the topic as if new: day 2 (A34), a third start (A44), Kaksha day 2 asks "Aapne fractions multiply kiye hain?" after a fractions lesson (B12). Nothing refers to yesterday. When Riya says she's tired: "Theek hai, Riya." then "Your turn" with nothing to answer (A28). |
| "Just start; she handles everything, starting with school today" | **0/5** | 2/5 | A: 9 set-up steps, then a fixed topic. B: Kaksha Home says "Just start. Asha takes it from there." (B07), but Start opens the same fixed lesson. The session-first start works on the server: at the API she asks "aaj school mein aapke teacher ne kya padhaya?" and adapts to Kabir's "decimals" (intake_confirm → intake_agenda). **No client sends purpose "session" (neither base nor K), so no child can reach it.** |

## The journey, step by step (A unless marked)

| # | step | the child / parent does | she says (first words) | time to her first sound | friction (shot) |
|---|---|---|---|---|---|
| 1 | Landing | Start free set-up | — | — | Vector portrait ≠ the puppet the parent meets next (A01 vs A04) |
| 2 | Set-up 1-3: class + board, Meet + language, promises | 6 taps; promises need a 2 s hold | Meet plays a sample | — | The hold button is at y = 808, below the 800 fold; the typed alternative's input has no label (A05-A07) |
| 3 | Set-up 4: account | name, email, password | — | — | "Signing in with a code … is coming"; email + password only |
| 4 | Set-up 5: consent | 3 separate choices, no defaults | — | — | Clear, but "Yes (required)" and two "Yes" buttons share a name for assistive tech |
| 5 | Set-up 6-7: child, PIN, time | name, register, school language, ≤ 3 interests; PIN ×2; limit + hours | — | — | Default hours 07:00-20:30: a parent finishing set-up after 20:30 IST gets no lesson tonight. PIN confirm button says "OK" where the first said "Next" (A13) |
| 6 | Set-up 8-9: sound check, hand over | 2 taps | — | — | Page error during set-up: "Cannot close a closed AudioContext" (+ /api/client-error) |
| 7 | Hello | Next, Got it, pick a picture, confirm interests | the greeting (no caption on screen) | plays on arrival | The AI-disclosure card crops her face to the forehead (A18) |
| 8 | Lesson 1 opens | — | "Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj grams aur kilograms padhenge. Tumhe cricket ya animals mein kya pasand hai?" | **7.4 s after the start request** (start 3.0 s + speech 4.3 s) | — (A21) |
| 9 | 13 voice turns + 1 pad answer | tap Talk, speak, Done | per turn | ack 0.75-1.35 s; **reply 4.2-8.1 s** after speech end | False praise (A22-03); partial accepted (A24-03); correct answer ungraded and the same question asked 3 times (A25); "game" = the whiteboard (A24-04) |
| 10 | "Bas, ab main thak gayi" | — | "Theek hai, Riya." | 5.3 s | Dead end: YOUR TURN with "Theek hai, Riya." as the question; no wrap-up offered (A28). "Say it, or tap" is cut off |
| 11 | End (Pause → End → End) | 3 taps | — | — | Summary: 2 items "On your own"; the parent evidence says the pad one was "Right, with a hint" (A31 vs A40) |
| 12 | Home after lesson 1 | — | — | — | Shows the red panda; the child chose (and the server saved) the tiger cub. Fixed by a reload (A32 vs A33) |
| 13 | Day 2 Home → Start | 1 tap | "Namaste Riya, aaj hum grams aur kilograms se weight compare karenge…" | **4.7 s** after the tap | "Today's lesson" has no title; no word about yesterday (A33, A34) |
| 14 | Day 2 lesson, 4 turns, End | — | — | reply 4.4-6.8 s | "Kya hum game khel sakte hain?" → "Screen par teen boxes ka game hai" (a static flow-chart, A35-03); summary says "You listened to Asha today" after 4 spoken answers (A36) |
| 15 | Parent corner | PIN | — | — | "Riya had a first lesson" after two; a tip starts in lower case ("ask Riya what they…"); bottom-nav labels 13 px (A38). Progress (Ch 8 Grams: Practising) and the evidence page are honest (A40, A41). Controls: limit, hours, "Open now for 1 hour" (A42) |
| 16 | Laptop 1366 | Start | the topic introduced again | — | Layout fine; truncated "Say it, or tap" again (A44) |
| B1 | Kaksha: Hello → lesson | as A | "Namaste Kabir … Aaj fractions multiply karenge—cricket ke runs jaisa." | — | Hello promises "Let's find what you already know"; a normal lesson follows (B02) |
| B2 | Kaksha lesson, 5 turns | — | — | reply 4.5-7.9 s | "Screen par … 15 chhote parts aur 6 marked hain" with no visual on screen (B04-02); "screen-game" = a whiteboard "6" (B04-04); question card truncated with "…" and topic header "Multiplying f" (B04-04) |
| B3 | Kaksha End | — | — | — | Summary leads with her last unanswered prompt; Finish goes to "Who is learning?" for a 2-child account, not Home (B05, B06) |
| B4 | Kaksha Home / World | Start; My orbit | — | Start → first sound **4.2 s** (day 2: 4.5 s) | "Just start. Asha takes it from there." → the same fixed lesson; World is an empty orbit until a secure idea (B07, B09) |
| B5 | Session-first (API only) | — | "aaj school mein aapke teacher ne kya padhaya? Aap apne words mein batayiye" | start 2.7-3.2 s | Adapts to the school topic. The question card loses "0." in "0.5 mein 5 kis place par hai?" ("5 mein 5 …") |

## Top 15 defects, ranked (impact on the owner's vision first)

| # | defect | step / evidence | owner of the fix |
|---|---|---|---|
| 1 | **The school-first start is unreachable.** Session-first works on the server, but no client (base or K) sends purpose "session". Kaksha's "Just start. Asha takes it from there." opens a fixed topic. | B4, B5; `src/child/lesson/answers.ts` purposeOf has no "session" | Stream K (Kaksha Start) + 4A (session-first) |
| 2 | **No game, simulation or built content in 3 lessons**, even when the child asks for a game. She relabels the whiteboard as "a game"; the parent sees "Nothing made yet". | A24-04, A35-03, B04-04, A38 | G1 / G2 (Forge, Studio) + the Director's when-to-build rule (main) |
| 3 | **A correct answer is not recognised and the same question repeats** (ordering; 2/3 × 3/4 = 6/12). | A25-01/02, B04-05 | Director / grading (4A) |
| 4 | **False acceptance**: praise for a non-answer; a partial answer (2 kg 50 g → 2000 g) accepted. | A22-03, A24-03 | Director / grading (4A) |
| 5 | **No continuity across days**: every lesson re-introduces the topic; nothing about yesterday; Kaksha day 2 asks "Aapne fractions multiply kiye hain?". | A34, A44, B12 | Director memory / opening (main, 4A) |
| 6 | **"I'm tired" → a dead end**: she says "Theek hai" and hands the floor back with nothing to answer; no offer to stop, no wrap-up. | A28 | Director (break move) + the Desk (stream 2) |
| 7 | **Silence at the lesson start: 7.4 s to her first sound on lesson 1, 4.2-4.7 s on later starts** (start call 2.7-3.0 s + speech). US container; production is closer to the voice. | A21, A34, B08, B12 | Latency (r4-latency) |
| 8 | **Replies 4.2-8.1 s after the child stops** (ack at 0.75-1.35 s covers part). | every turn row | Latency (r4-latency) |
| 9 | **She describes a visual that is not on screen** ("Screen par … 15 parts, 6 marked"; the stage is empty). | B04-02 | Director ↔ Studio slot contract (main, stream 2) |
| 10 | **Question cards drop or cut words**: "0." lost in "0.5 mein 5 …"; Kaksha card truncated with "…"; topic header "Multiplying f"; "Say it, or tap" cut off. | B5, B04-04, A28, A44 | Ask extraction (4A) + Desk / Kaksha (2, K) |
| 11 | **Default lesson hours 07:00-20:30**: an evening set-up gets no first lesson tonight. "Open now for 1 hour" exists only in the parent corner. | step 5 | Onboarding defaults (main) |
| 12 | **Set-up is 9 steps before the child hears her**, with a 2-s press-and-hold gate below the 360 × 800 fold. | A02-A16 | Onboarding (main / stream 2) |
| 13 | **Child summary vs parent evidence disagree** ("On your own" vs "Right, with a hint"), and a 4-answer lesson is summarised as "You listened to Asha today"; Kaksha's summary leads with an unanswered prompt. | A31, A40, A36, B05 | Summary (stream 2, K) |
| 14 | **The chosen picture is not shown until a reload** (tiger cub saved, red panda shown). | A32, A33 | Child Home (stream 2) |
| 15 | **Small UI defects**: the AI-disclosure card crops her face to the forehead; landing portrait ≠ lesson face; a page error ("Cannot close a closed AudioContext"); parent copy ("a first lesson" after two; a lower-case tip); 13 px nav labels; Finish → "Who is learning?" in Kaksha. | A18, A01, step 6, A38, B06 | Stream 2 / K / 5 (faces) |

**What works and should be kept:**
- She builds her questions from the child's interests (cricket, school bag, bat weight).
- The number pad for a fill-in.
- The parent corner's honesty: Progress, the evidence with "how do we know", and controls including "Open now for
  1 hour".
- The pause sheet with Childline / Tele-MANAS always one tap away.
- Session-first's intake on the server adapts to what the child says.
- Kaksha's Home copy is the right promise.
