# Production audit as a real 9-15-year-old — defect catalogue

Audit A of the owner reset (`docs/design/OWNER-RESET-2026-10-04.md`). The target was production, `https://taxila.dev`
(`/api/health`: revision `taxila-web--s9242020-kj16`, sha `9242020`). It ran on 2026-10-04 between 18:30 and 21:00 UTC,
which is 00:00 to 02:30 IST on 5 Oct. No product code was changed and nothing was committed.

## How this was done (method, n, limits)

- **Real UI, real accounts.** Three fresh parent accounts (`reset-audit+…@taxila.test`) were created through the real
  onboarding, one per viewport and class:
  - phone 390x844 (DPR 2, touch) with a **class 4** child (`m4`)
  - tablet 820x1180 (touch) with a **class 7** child (`t7`)
  - laptop 1440x900 with a **class 6** child (`d6`)
  Each child was "Aarav", the parent PIN was 1357, and the locale was en-IN in the Asia/Kolkata time zone. Every flow
  was driven with Playwright through the page's own controls. The scripts are in the scratchpad (`ra/*.mjs`), not in
  the repo. The routed `page.route` method from `docs/ops/W1-PROD-RESULTS-2026-10-04.md` was used, because the sandbox
  proxy breaks Chromium.
- **Voice was tested with a real voice, not a tone.** Ten child utterances were synthesised with Azure
  `gpt-4o-mini-tts` (10 calls, well under USD 0.01). They were injected into `getUserMedia` through a controllable fake
  microphone. Production's own `/api/voice/transcribe` heard every clip correctly (8/8 and 3/3, ASR confidence
  0.94-0.99). So every voice failure below is **the teacher's reasoning, not ASR**.
- **Volume:** 13 lesson starts (some resumes, practice and ask), 52 successful `/api/lesson/turn` replies, 11 voice turns.
- **Typed lessons:**
  - class 7, tablet: an owner-probe script (`k-t7-*`, `l-t7-*`)
  - class 6, laptop: a working-child script (`k-d6-*`, `l-d6-*`)
  - class 4, phone: voice only (`v-m4-*`, `y-m-*`), because class 4 has no keyboard
- **Shots.** 236 earlier shots plus this run's shots are in `docs/design/reset/audit/shots/`. Prefixes:
  - `p-` public pages
  - `o-` onboarding
  - `h-` first meeting
  - `l-`, `k-` typed lessons
  - `v-`, `y-` voice lessons
  - `s-` child surfaces and parent corner
  The device letter is `m` (phone), `t` (tablet) or `d` (laptop).
- **Sandbox limits.** I did not count any of these as product defects unless the owner also saw them.
  - **UDP/WebRTC is blocked here.** The hands-free transcription call ("transcription channel did not open") always
    fell back to push-to-talk. The owner saw click-to-speak on a real network too (#10), so the push-to-talk UX is
    still audited.
  - **Latencies are from a US container to eastus2.** Treat them as relative numbers, not the Indian child's experience.
  - **`net::ERR_FAILED` on four d6 turns** (`l-d6-d-answer-19..29`, "Your answer didn't send") lines up with
    route-fetch aborts in the harness. It is listed only as a UX defect of the failure state.
- **Not exercised:**
  - The safety path ("I feel sad…"). I did not want to page the real safeguarding reviewers from a test account.
  - Forge Studio artifacts. None were ever produced in any lesson (see S-1), so there was no artifact screen to audit.
  - A completed 25-minute lesson. Every lesson ended early: by a request, by "game" being read as "stop", or by input
    traps.

Severity:
- **blocker**: a 12-year-old quits or the product fails its promise.
- **major**: clearly wrong, and seen on every visit.
- **minor**: polish.

Categories: age-wrong design, broken control, flow, copy/tone, content level, visual quality, failure visible,
performance, accessibility, conversation (the teacher's reasoning).

"Feels" is written in the voice of a 12-year-old in class 6-7, unless the row is about class 4.

---

## TOP 40 (ranked)

| rank | id | one line |
|---|---|---|
| 1 | T-7 | "Can we play a game instead?" (class 4) and "can we talk about something else" (class 7) both **end the lesson**: they are classified as "they want to stop" (2/2) |
| 2 | T-1 | Child says "a cube has 6 faces, 12 edges, 8 corners"; she then asks "how many flat faces does a dice have?" **three times** |
| 3 | T-6 | "I want to end the lesson now" ends it instantly, no check-in, no wrap-up (owner #7 reproduced, n=1/1) |
| 4 | S-1 | No diagram, drawing, image, animation or Studio artifact in 52 lesson turns; "show me a diagram" → "I can describe it"; the "whiteboard" is the question restated as text |
| 5 | K-1 | Class 6 practice asks "7 plus 2 kitna hota hai?"; class 4 asks "how many faces does a dice have" (owner #2 reproduced) |
| 6 | G-1 | "Make a game for this" → "Lakhs-Crores Scoreboard khelo…" / "game: place-value detective — find the 6" — a renamed question (2/2, owner #3 reproduced) |
| 7 | O-12 | Time picker on phone: tap the field and type 04:30 PM → value unchanged; on the onboarding step the same typing turned 07:00 AM into 07:00 PM (owner #11 reproduced) |
| 8 | H-9 | After all setup, a child at night gets "Lessons open at 7:00 pm" as the first lesson — a dead end with one button |
| 9 | T-3 | Diversion: "who's the best cricketer?" — once engaged and continued, once brushed off; never parked, never returned to (owner #6) |
| 10 | T-4 | "This is too easy, I'm not a baby" → "You're right" then an easier question (matchbox faces) |
| 11 | T-5 | "Explain it a different way" → same question, same words, with a hint appended |
| 12 | G-2 | Module and question disagree: "paint area 7" for an odd-number sequence; "make 99,99,999" (no crore column) for "value of 6 in 5,06,08,020"; "find the next number" keypad for "Is Ravi right?" (3 of 6 mounts) |
| 13 | X-1 | Whole visual language is cartoon flat-vector, toddler props (baby animals, building blocks, rolling pin, watering can, "Garden") — age-wrong for 9-15 (owner #1) |
| 14 | L-12 | Number-pad mode traps a typing child. There is no keyboard and "123" does not bring one back, so 5 typed lines in a row could not be sent (class 6) and the class 7 run stalled. The keys are 220 px tall, and there is no comma key for a question that demands Indian commas |
| 15 | L-13 | Multiple-choice mode removes the keyboard: the child cannot type "why?" or "I don't get it" |
| 16 | A-1 | "Ask" a question → it is injected into the half-finished lesson; the answer pivots back to the lesson topic |
| 17 | R-1 | "Practice" is not practice: it reopens the lesson desk at the warm-up ("Tumhe maths mein kaunsa topic pasand hai?") |
| 18 | E-1 | End summary after a correct answer: "You listened to Babu today." — no cards, tried 0 |
| 19 | L-1 | Click-to-speak: tap Talk, speak, tap Done; she can be cut off by tapping; no hands-free (owner #10) |
| 20 | C-1 | Home sometimes stuck on "Getting today ready" with no Start (2/11 loads, ≥9 s); 45% of the laptop screen empty navy |
| 21 | T-2 | Opening question ignored: "What shape has a round face?" → child "haan, chalo" → she asks something else |
| 22 | L-2 | Teacher face is a static flat SVG; the "talking" state shows a fixed toothy smile; 45-55% of a phone screen |
| 23 | T-8 | "Show me a diagram" is classified as "you did not catch it clearly" (repair) |
| 24 | H-4 | "Pick your picture": six baby animals (red panda, tiger cub, baby elephant…) |
| 25 | K-3 | Teach-back target "Golu (a pretend baby elephant just starting school)" / "Bittu" spoken to a 10-12-year-old |
| 26 | O-1 | Landing and onboarding say "classes 1 to 9" and offer Class 1-9 — the product targets 4-7 |
| 27 | P-1 | Landing has three empty phone-frame placeholders where the product should be shown |
| 28 | L-5 | Captions line duplicates the question card: the same sentence shows twice, the top copy cut mid-word |
| 29 | E-2 | Lesson repeats: every new lesson for class 4 restarts "Faces, edges and corners" from "Hello Aarav!" with no memory of the last one |
| 30 | PC-1 | Parent home says "Aarav's first lesson will appear here… Babu will say hello the first time" after the hello and 3 lessons |
| 31 | PC-2 | Parent home "Lessons this week: 0 · 0 minutes" while Notes says "3 lessons · 4 min" |
| 32 | O-14 | Language chosen in onboarding (Hindi-English mix) shows as English in Controls and lessons ran in English (class 4, n=1/3) |
| 33 | PC-6 | No date picker anywhere: no days off, exams, holidays or weekly schedule in Controls |
| 34 | L-3 | Class 4 lesson dock has no keyboard at all — a child who can't or won't speak cannot answer |
| 35 | T-10 | Turn latency: voice Done → reply median 3.9 s, max 9.3 s (n=11); typed send → reply median 2.6 s, max 9.5 s (n=25), with a frozen face |
| 36 | C-3 | Class 4 home has no topic name, no Ask, no navigation; class 6-7 home hides the teacher's face at the bottom of a tall blank card |
| 37 | X-2 | Every lesson, Studio and practice surface is the same beige card stack — no motion, no depth, no game-grade UI |
| 38 | O-8 | Consent default "Remember what your child likes: No" silently discards the interests the parent just picked |
| 39 | N-1 | Notebook stays "Your next lesson will add a page here." after 4+ lessons per child |
| 40 | L-9 | "End lesson" in the pause sheet: one tap, no confirmation, no wrap-up |

---

## P — Public site (landing, promises, help, privacy, sign-in, 404)

| id | screen | sev | category | what a 12-year-old would feel | fix |
|---|---|---|---|---|---|
| P-1 | landing `p-landing-d-full` | major | visual quality, failure visible | (a parent) "half the page didn't load — is this real?" Three phone frames are empty beige rectangles | Render real product captures (video loops) or remove the frames; never ship an empty mock |
| P-2 | landing hero | major | age-wrong design | "this is for little kids" — two cartoon busts and a notebook on a desk | Hero must show what a preteen gets: a live game or animation, a cool teacher on a real lesson |
| P-3 | landing copy | major | copy/tone | "classes 1 to 9" — reads as a primary-school app | Say classes 4-7 (later 4-9); show the topics that age band learns |
| P-4 | landing "Progress" | major | age-wrong design | "younger children grow a garden" — babyish promise | Drop the garden; show a mastery map with real skill names |
| P-5 | landing sample "See a real lesson" | major | visual quality | Mock phone with "1/2 = 2/4" on a chalkboard — the most basic visual possible | Show a real cinematic visual (3B1B-grade) from a lesson |
| P-6 | landing desktop | minor | visual quality | Text column narrow, small type (~14 px body) at 1440, huge empty side gutters | Proper desktop grid; 18 px body; wider hero |
| P-7 | landing | minor | copy/tone | "Where we are… no reviews" — honest but deflating | Replace with a demo the visitor can try |
| P-8 | `/start/signin` | major | broken control | 404 "This page is not here" on the URL a returning parent guesses | Route `/start/signin` → sign-in |
| P-9 | sign-in page | minor | flow | Shows "Step 4 of 8" on a sign-in screen | Sign-in is not a step; drop the stepper |
| P-10 | `/who` signed out | minor | flow | Goes to onboarding step 1 instead of sign-in | Signed-out deep links → sign-in with `next` |
| P-11 | help | minor | failure visible | "Forgot password: not ready yet" | Ship password reset (email link) |
| P-12 | privacy | major | copy/tone | "still being written" on a children's product | Publish the policy |
| P-13 | every public page | minor | failure visible | `401 GET /api/me` error in console on every load | Don't call `/api/me` signed out, or treat 401 as a quiet state |
| P-14 | help | minor | accessibility | "112" and "Sign in" links 24x21 / 45x21 px tap targets | ≥44 px targets |
| P-15 | 404 | minor | visual quality | Bare "This page is not here" — no teacher, no search, just "Home" | Branded 404 with routes to the child's home and the parent corner |
| P-16 | all public | minor | performance | 2.7-3.8 s to `load` per page from the sandbox (n=30) | Pre-render the static marketing pages |

## O — Onboarding (class, meet, promises, account, consent, child, PIN/time, handover)

| id | screen | sev | category | feels | fix |
|---|---|---|---|---|---|
| O-1 | step 1 class `o-m4-01` | major | age-wrong design | Classes 1-9 grid; there is no difference between class 1 and 7 | Offer 4-7 (8-9 waitlist); show what each class covers |
| O-2 | step 1 | major | flow | The child is never asked anything; 8 parent steps before the child meets the teacher | A short parent gate (account + consent + PIN); the child's own setup is a separate, cool flow |
| O-3 | step 1 "I am a student" | minor | flow | A tiny underlined link — a 13-year-old setting it up themselves is a second-class path | First-class "I'm the student" path that later invites the parent |
| O-4 | step 2 Meet `o-m4-04` | major | age-wrong design | Flat cartoon bust on a navy square; static | Real, expressive teacher (2D puppet ≥ 4.5 or video-grade) |
| O-5 | step 2 Meet | minor | flow | "What she said" box is empty until you tap a speaker; on desktop (`o-d6-03`) the speaker buttons are missing | Autoplay a short line with captions; same controls on every size |
| O-6 | step 3 promises `o-m4-07` | minor | copy/tone | "Hold to continue", plus duplicated "Press and hold for 2 seconds." and a stray "." | One sentence; a normal button behind a parent-age check |
| O-7 | step 3 | minor | flow | Promises **before** sign-up, then again at consent, then on the landing — three times | Once, at consent |
| O-8 | step 5 consent `o-m4-11` | major | flow | "Remember what your child likes" defaults **No**, so the interests picked at step 6 are never used | Default Yes (with clear delete), or don't ask for interests when it's No |
| O-9 | step 5 consent | minor | copy/tone | Legalistic radio groups; "Research: Off" with an X icon that looks like an error | Plain-language toggles; a positive icon for "off by design" |
| O-10 | step 5 consent | major | flow | Reports default to **WhatsApp**, but Controls says "WhatsApp sending starts once Taxila's WhatsApp number is connected" | Don't offer a channel that doesn't exist; default "in the app" |
| O-11 | step 4 account | minor | copy/tone | "Signing in with a code is coming. For now, use an email and a password" | Ship phone OTP, or remove the promise |
| O-12 | step 7 time `o-m4-16` | **blocker** | broken control | Native `<input type=time>` 156 px wide on a phone; a centre tap lands on the AM/PM segment. Typing "0430PM" turned 07:00 AM into **07:00 PM** (onboarding, n=1) and left it unchanged in parent Controls (n=1). Works at 820/1440 (16:30, n=2+2) | A custom time-range picker: big hour/minute wheels or preset chips ("after school 4-7 pm"); test it on 360-390 px |
| O-13 | step 7 | major | flow | Default allowed hours 07:00-20:30 silently block a night-time first run (see H-9) | Open "now" for the first session; ask hours later |
| O-14 | step 2 vs Controls | major | broken control | Class 4: "Hindi and English mix" picked at Meet (`o-m4-04`); Controls shows **English** (`s-m4-m-29`) and lessons ran in English (n=1 of 3 accounts) | Persist the language from Meet; add a test that reads it back |
| O-15 | step 6 interests `o-m4-13` | major | age-wrong design | Building blocks, a rolling pin, trains, a ladybird leaf — toddler imagery. No gaming, coding, anime, YouTube, robots, science, art, music production, football clubs | Teen interest set with real photography or bold iconography; free text "anything else" |
| O-16 | step 6 | minor | flow | Max 3 interests | Allow more; rank later |
| O-17 | step 7 PIN `o-m4-14` | minor | accessibility | Laptop keyboard typing does nothing on the PIN pad ("0 digits entered" after typing) | Accept keyboard digits |
| O-18 | step 7 PIN | minor | visual quality | Blank bottom-right key on the pad | Put Next or Delete there |
| O-19 | step 7 | minor | copy/tone | "Not your phone's unlock code" and "In the Android app you will be able to…" — noise | Remove the future promise |
| O-20 | step 8 handover `o-t7-18` | minor | copy/tone | "Give the **phone** to Aarav now" with a telephone-call icon on a tablet or laptop | Device-aware copy; a hand-off icon, not a phone call |
| O-21 | step 8 | minor | visual quality | Two-thirds of the tablet screen is empty | Make the handover a moment (the teacher turns to the child) |
| O-22 | onboarding desktop `o-d6-*` | minor | visual quality | Narrow card in the centre of a chai-glass stock photo | A designed desktop layout |
| O-23 | stepper | minor | flow | "Step 1 of 8" — a long form | Fewer steps; progress by meaning, not count |

## H — First meeting (hello, picture, interests check, naming)

| id | screen | sev | category | feels | fix |
|---|---|---|---|---|---|
| H-1 | greet `h-t7-t-open-00` | major | visual quality | Name shown twice ("Arjun · AI teacher" caption + card "Arjun / AI teacher"), bottom 60% empty | One composed intro scene |
| H-2 | greet | major | age-wrong design | Static flat avatar; "Tap to hear Asha" | She speaks first, moving, with a real voice; captions on |
| H-3 | AI disclosure | minor | copy/tone | "I'm a computer teacher, not a person." is correct and must stay — but delivered as a static card | Keep the line (safety floor); deliver it in her voice, naturally |
| H-4 | picture `h-m4-m-03` | major | age-wrong design | Six baby animals as "your picture" | Avatars a teen would choose: initials or monogram, illustrated characters in a mature style, a photo-free emoji set, colour plus pattern |
| H-5 | likes `h-m4-m-05` | major | copy/tone | "Your grown-up chose these. Are they right?" — I had no say | "What are you into?" — the child chooses; the parent's picks are hints |
| H-6 | naming `h-m4-m-09` | minor | copy/tone | "Ironman" refused with "famous person's name"; no suggestions offered | Offer 3 fun alternatives; explain lightly |
| H-7 | naming | minor | flow | "Babu" accepted for a female teacher → she is addressed "Babu didi" in the payload | Gender-aware suffix or none; preview the name in a sentence |
| H-8 | top-right laptop icon `h-m4-m-03` | minor | visual quality | A laptop picture button with no visible meaning, on every child screen | Remove it or label it ("Screen check") |
| H-9 | after hello `h-m4-m-14` | **blocker** | flow | Whole setup + hello → "Lessons open at 7:00 pm" (at 00:10 IST) — first lesson is a locked card; `409 /api/lesson/start` | First session always allowed (or the parent picks hours at the end, with "start now") |
| H-10 | after hello | major | copy/tone | "Lessons open at 7:00 pm" without "tomorrow"; "A grown-up can open lessons now from Controls" — the child can't | Say "tomorrow at 7 pm"; offer something to do now (preview, explore) |
| H-11 | name refused | minor | failure visible | `422 POST /api/tutors/name` logged as a console error | Validate client-side; 200 with a verdict |

## C — Child home ("Today")

| id | screen | sev | category | feels | fix |
|---|---|---|---|---|---|
| C-1 | laptop home `s-d6-d-00` | **blocker** | failure visible, performance | Intermittent: "Getting today ready" skeleton still showing at 9 s with no Start button, a navy void, and the avatar as a bare "O" circle (2 of 11 home loads, at d6 and t7). In 9 clean loads Start appeared in 0.80-1.44 s (median 0.93 s), after a skeleton at ~0.7 s. "The app is broken today" | Server-render today's plan; never block Start on the plan; time out to a default plan |
| C-2 | tablet home `s-t7-t-01` | major | failure visible | Same skeleton with Ask only; picture missing ("O") | As C-1 |
| C-3 | class 4 home `s-m4-m-01` | major | age-wrong design | Teacher bust fills 55% of the screen; "Today's lesson" has no topic; Garden/Practice/Notebook tiles | Show the topic, time and a hook; drop the garden |
| C-4 | phone home `s-m4-m-01` | major | performance | Tile images pop in late (blank tiles in the first shot) | Inline small art; reserve space |
| C-5 | tablet home `l-t7-t-owner-00` | major | visual quality | Teacher face sits at the **bottom** of a tall blank portrait card (2/3 of the screen) | Proper hero composition |
| C-6 | home | major | age-wrong design | Rooftop telescope / courtyard painterly backgrounds + flat cartoon person — mismatched art styles | One art direction for 9-15 |
| C-7 | home | minor | flow | "Grown-ups" button floats top right, same weight as the child's actions | Move it into a profile menu |
| C-8 | laptop home | major | visual quality | 1440 layout uses a 700 px column; a stray card is half off-screen bottom right | Real desktop layout |
| C-9 | home | minor | copy/tone | "Your first lesson" persists after several lessons | Reflect progress ("Continue: Lakhs and crores, 2 of 5") |
| C-10 | home | major | flow | No sense of a day: no streak-free progress cue, no "made for you" content | Day plan with what's ready (games, videos made for me) |

## L — Lesson shell and controls (desk, dock, captions, pause)

| id | screen | sev | category | feels | fix |
|---|---|---|---|---|---|
| L-1 | dock `y-m-02` | **blocker** | broken control, flow | Tap Talk → "Listening… tap Done" → tap Done; two taps per turn; she stops if you tap (owner #10) | Full-duplex hands-free with barge-in (duplex research) |
| L-2 | face `y-m-04` | major | visual quality | Static flat face; "talking" = a fixed toothy smile, no lip motion | 2D puppet ≥ 4.5 with visemes and idle life |
| L-3 | class 4 dock `l-m4-m-owner-05` | major | accessibility | No keyboard at all ("Hear again / Talk / Help") — my typed turns could not be sent (12/12 "noinput") | Always offer typing |
| L-4 | coachmark | minor | copy/tone | "Tap the mic to talk, then tap Done. OK" over the content, on every lesson | Teach once, by doing |
| L-5 | captions `y-m-04` | major | visual quality | Caption line repeats the question card's text right above it, cut mid-sentence ("Did you want to talk about an insect,") | One text surface |
| L-6 | question card | minor | visual quality | "Ready to begin?" in a huge card with two Hear buttons ("Hear", "Hear again") | Small prompt; one replay |
| L-7 | help menu `y-m-05` | major | broken control | Help is hidden while she talks; tapping Help showed an empty menu | Help always reachable; populated |
| L-8 | "···" more | minor | broken control | Opens the same sheet as Pause | One entry point, or real more-options |
| L-9 | pause `y-m-08` | major | flow | "End lesson" one tap, no confirm, no wrap-up | Confirm + 30 s wrap-up offer |
| L-10 | pause | minor | copy/tone | Helplines on every pause — correct (safety floor), but the styling makes pausing feel like an emergency | Keep them; calmer secondary styling |
| L-11 | CC button | minor | accessibility | Tiny icon, no label | Labelled toggle |
| L-12 | number pad `k-t7-t-probe-06` | **blocker** | broken control | Calculator pad with 220 px keys; no Type; **no comma key** for "write with Indian commas" | Smart input that accepts digits, commas and words; keep the keyboard |
| L-13 | choices `k-d6-d-work-06` | major | broken control | Multiple choice removes typing; choice text truncated ("32, because you double"); choices float in an empty beige box | Keep free reply; fit text; compact layout |
| L-14 | answer echo `v-m4-m-19` | minor | visual quality | "Your answer:" shows a waveform, not the words heard | Show the transcript ("you said: 6") with a fix option |
| L-15 | phase bar | minor | copy/tone | "Warm-up · Learn · Try · Wrap" — school-ish | Story-like progress or none |
| L-16 | not-sent `l-d6-d-answer-19` | major | failure visible | "Your answer didn't send. Send again. Your answer is saved" ×4 turns (harness-induced here, but the state is visible and blocking) | Silent retries; never show plumbing to a child |
| L-17 | "Babu is thinking" | minor | visual quality | Text label plus a spinner word; no thinking animation | Thinking expressed by the teacher (look, gesture) |
| L-18 | tablet lesson `k-t7` | major | visual quality | Teacher shrinks to a 80 px circle with an "AI" badge during practice; the screen is a form | Composed layout that keeps the teacher present |
| L-19 | laptop lesson `l-d6-d-answer-12` | major | visual quality | Face card on the left; caption fragment "3," floating under it; bottom-left empty | Coherent 3-zone layout |
| L-21 | choices `k-d6-d-work3-16` | major | visual quality | Choice text cut mid-word: "Yes, because every sequence adds the sam", "the next number is alway" | Wrap text; size cards to content |
| L-22 | dock while she talks | minor | flow | Typing is disabled while she speaks (my lines waited up to 50 s for the input to reopen) — no barge-in by text either | Let the child type any time; she yields |
| L-20 | "Wait" button `k-d6-d-work-06` | minor | copy/tone | Unexplained "Wait" chip on the dock | Label ("Give me a sec") |

## T — Conversation intelligence (what she says)

Evidence comes from production `/api/lesson/turn` bodies. The class 4 voice lesson has 8 turns (`v-m4-m.json`) plus a
second lesson of 3 turns (`v-m4-m-end.json`). The typed lessons are in `l-*.json` and `k-*.json`.

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| T-1 | class 4, turns 2-7 | **blocker** | conversation, content level | I said "a cube has six faces, twelve edges and eight corners". She asked me to "trace a face's boundary", then "how many faces does a matchbox have", then "A dice is a cube. How many flat faces does it have?" **three times**. "She isn't listening." | Credit demonstrated knowledge; jump ahead (Euler, nets, prisms); never re-ask an answered item |
| T-2 | class 4 opener | major | conversation | She asked "What shape has a round face?". When I said "haan, chalo" she asked me to "imagine choosing a ludo dice or tiffin box" | Keep the thread; treat "yes, let's go" as consent, then pose the question she asked |
| T-3 | class 4, 2 lessons | **blocker** | conversation | "Who's the best cricketer?": in one lesson she engaged and kept going (asked "batting, bowling or fielding?"). In the other she brushed it off. Neither time did she say "we're drifting, I'll come back to it", and she never returned to it | Diversion policy: notice, park visibly, return at a natural break; brief engagement if insisted; warm decline if out of bounds |
| T-4 | class 4 | **blocker** | conversation, content level | "This is way too easy, I'm not a baby" → "You're right" → an easier matchbox question | Treat it as a level signal: skip ahead and raise difficulty immediately |
| T-5 | class 4 | major | conversation | "Explain it a different way" → "imagine a dice: count top, bottom, front…" then the **same** question | A genuinely different representation (net unfolding animation, rotate a 3D cube) |
| T-6 | class 4 end lesson | **blocker** | conversation, flow | "I want to end the lesson now" → "Theek hai… Goodbye" → lesson over after 3 turns (owner #7) | Check in ("tired or bored?"), offer a 2-minute finish or a break, respect parent limits, then close |
| T-7 | class 4 "game" | **blocker** | conversation | "Can we play a game instead?" → move "they want to stop: stop now" → lesson **ended** | Game request = engagement signal → launch a real game on the concept |
| T-8 | class 4 "diagram" | **blocker** | conversation | "Show me a diagram" → move "you did not catch it clearly" → "I can describe it: draw a cube like a box" | Show it — whiteboard or Studio visual within 2 s |
| T-9 | class 7 "too easy" | major | conversation | "Fair point" then the comma rule for crores — a skim, not a level change | Same as T-4 |
| T-10 | turn latency | major | performance | Voice: Done → `/turn` reply 2.1-9.3 s (n=11, median 3.9 s). Typed: send → reply 1.7-9.5 s (n=25, median 2.6 s). Audio starts later still; the face is frozen throughout | Stream; backchannel; start speaking within 700 ms |
| T-11 | ASR misfire `y-m-04` (tone, earlier run) | major | conversation | Non-speech noise heard as "keeda" → "keeda means insect. Did you want to talk about an insect?" | Confidence and VAD gate; "didn't catch that" instead of acting on garbage |
| T-12 | language | minor | conversation | Lesson language flips between English and Hinglish turn to turn (class 4: English, then "Theek hai, Aarav. Aaj ka lesson yahin rokte hain") | Hold the chosen register |
| T-13 | class 7 Minecraft (earlier run) | major | conversation | "Tell me about Minecraft first" → "Minecraft mein blocks… 1 crore blocks ko commas mein kaise likhoge?" — a one-line hijack back to the topic | Brief real engagement, then a link back that feels earned |
| T-14 | class 6 "12" | minor | conversation | Warm-up "Which topic is familiar?" → "I think it's 12" → "12 tumne kis sequence ke liye socha?" — good recovery, but the warm-up question is vague | Concrete hooks |
| T-15 | wrap | major | flow | Lesson ends with no recap, no teach-back, no "next time" | Short recap + what's next |
| T-16 | address | minor | copy/tone | Teacher payload `addressedAs: "Babu didi"` / "Babu bhaiya" — didi/bhaiya appended to a custom name | Don't append kin terms to custom names |
| T-18 | class 7 "something else" | **blocker** | conversation | "Can we talk about something else" → "Bilkul, Aarav. Maths yahin stop karte hain… Bye, take care!" → lesson ended (owner #8: steering treated as quitting) | Steering = change the activity or angle; never end |
| T-19 | class 7 Minecraft | major | conversation | "Who made Minecraft?" → one fact + the old question; "no seriously, tell me first" → the **same** fact again + the old question. No parking, no real engagement | See T-3 |
| T-20 | every reply | major | conversation, copy/tone | The question is appended verbatim after her sentence, so it is said twice in one turn ("“Chaar lakh…” ko… likho. 'Chaar lakh…' ko… likho.") | Compose the turn once; never concatenate the item text |
| T-21 | class 6 "harder" | major | conversation | "Give me a harder one" → "challenge: 1, 3, 6, 10 — agla number? 11 ke baad agle do odd numbers kaun se hain?" — two questions at once; then "48 is challenge ka answer nahi: agla difference 5 hoga" gives the method away | One question per turn; really change the item |
| T-22 | class 6 "why?" | minor | conversation | "why?" → a hint for the current item instead of the reason | Answer why, then continue |
| T-23 | class 6 correct choice | minor | conversation | Correct "Not necessarily…" → "theek hai — ek naya sequence: 2, 4, 6, 8. Ravi kehta hai…" (re-asks), credit only on the next turn | Credit at once |
| T-24 | class 6 retrieval | minor | copy/tone | "Jaldi batao!" (quick, tell me!) — pressure for a slow thinker | Calm prompts |
| T-17 | API | major | failure visible | `/api/lesson/turn` sends the Director's internal `move.shape` prompt to the client ("kit contexts: ludo dice, carrom-striker box… never 'samjha?'") | Strip internal fields from child responses |

## K — Content level

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| K-1 | class 6 practice `s-d6-d-20` | **blocker** | content level | "7 plus 2 kitna hota hai, Aarav?" — class 1 arithmetic for a class 6 child | Item bank calibrated to NCERT class 6 depth; floor per class |
| K-2 | class 4 hook | **blocker** | content level | "How many flat faces does a dice have" — the owner's exact complaint, from the kit's hook context "ludo dice" | Harder hooks (nets, Euler's formula, which nets fold to a cube) |
| K-3 | hooks | major | age-wrong design | "At the end you will teach this to Golu (a pretend baby elephant just starting school)", "Bittu ko yahi trick sikhaoge" | Teach-back to a peer or a younger sibling, framed as being the expert — no baby animals |
| K-4 | class 6 sequences | major | content level | 1, 3, 5, 7 → "next number?" then "7 ke baad 2 jodkar" — repeats an easy step after a wrong "48" | Diagnose the error ("48? tell me how") and adapt |
| K-5 | class 7 lakhs/crores | minor | content level | Good level (7,35,42,018 in words), but no stretch beyond reading numerals | Estimation, comparison with millions, real data |
| K-7 | grading | major | content level | "Write with Indian commas" answered "425000" (no commas: the pad has no comma key) → "Sahi: 4,25,000", ticked on the summary | Grade the skill asked; accept typed commas |
| K-6 | class 6 practice | major | content level | Practice items repeat the lesson warm-up rather than spaced, mixed review | Practice = mixed retrieval of secured skills |

## G — Activities and games (modules)

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| G-1 | class 7 "make a game" | **blocker** | age-wrong design | "Lakhs-Crores Scoreboard khelo: main number bolunga, tum commas lagao" → number pad (owner #3) | Real-time games: e.g. a stadium-crowd counter where numbers fly in and you place commas against a timer |
| G-2 | class 6 `l-d6-d-answer-12` | **blocker** | broken control, content level | Engine `geoboard@1` "Aisi shape rango jiska kshetrafal = 7" mounted for an odd-number-sequence question, and it stayed for the next questions | Engine-to-skill contract check before mount |
| G-3 | all lessons | major | flow | 1 module mount in ~25 typed turns; 0 in 11 voice turns | Activities driven by the conversation, frequently |
| G-4 | geoboard | major | visual quality | Dotted 6x6 grid, Clear/Check — a worksheet | Game-grade interaction, feedback, juice |
| G-5 | geoboard | minor | copy/tone | "kshetrafal" in Devanagari-transliterated Hindi for an English-medium child | Match school medium for terms |
| G-7 | class 7 place-value `k-t7-t-probe4-26` | **blocker** | content level, broken control | "Yeh number banao: 99,99,999" with columns Das lakh…Ikai, while the question is "value of 6 in 5,06,08,020" — and there is no crore column at all | Generate the module from the item; schema-check columns ≥ the number |
| G-8 | class 7 "Chhoti paheli" `k-t7-t-probe4-11` | major | age-wrong design | A "puzzle" card that restates the question I had already answered ("Your answer: 10 ✓"), three stacked tiles and a book emoji | Puzzles that are puzzles; never re-ask an answered item |
| G-9 | class 6 "show me a picture" | **blocker** | failure visible | Server mounted Forge `scene@1` template `choice-card@1` titled "Let's check" (a quiz, not a picture); nothing rendered in 21 s (no frame) | A real picture; when the build fails, keep the current visual and say nothing |
| G-10 | class 6 patterns `k-d6-d-work3-18` | major | content level | The requested representation was "difference ladder + growing dot squares". It rendered as an "Agle number dhoondo 1 4 7 ? ?" keypad, under the question "Is Ravi right?" | Render the representation the Director asked for |
| G-11 | modules | major | visual quality | 3 of 6 mounts were unmounted on the very next turn: activities flash in and vanish | Activities persist while relevant; exits are animated and explained |
| G-12 | coverage | major | flow | 6 mounts in 52 turns (12%); 0 in class 4 | Conversation-driven, frequent activities |
| G-6 | earlier audit | major | failure visible | Earlier gap audit: 7 of 9 mounts named non-existent engines → "This activity can't open here" | Never mount an unknown engine; invisible fallback |

## S — Studio, whiteboard, visuals

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| S-1 | every lesson | **blocker** | flow | No diagrams, drawings, images, animations or Studio artifacts in any lesson, including after explicit requests: "show me a diagram", "show me on the whiteboard", "show me a picture". Whenever `ui.whiteboard` was present (18 of 29 turns), it was only a plain-text copy of the question, e.g. `{"kind":"text","value":"A dice is a cube. How many flat faces does it have?"}`. "It's just a chat with a cartoon." | Frequent, conversation-driven generation (owner #14): real diagrams and animations on the board within 2 s of the request |
| S-2 | Notebook "made for you" | major | flow | No "made for you" shelf content ever appears | Forge output lands in the notebook |
| S-3 | whiteboard | major | visual quality | Teacher's shape text says "point at the whiteboard anchor" but no whiteboard is on screen | Wire the board; cinematic writing |
| S-4 | Studio | major | flow | No Studio surface was reachable by a child in production | Ship W2-H Studio in the lesson |

## A — Ask

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| A-1 | `s-d6-d-12/13`, `s-t7-t-14` | **blocker** | flow | I asked "why is the sky blue but sunsets are orange?"; it opened the unfinished lesson ("Number sequences · Warm-up") with "Your question:" in the card, then pivoted to "Tum apni drawing se samjhaoge?" | Ask is its own space: answer with a visual, then offer to return |
| A-2 | Ask empty `s-d6-d-10` | minor | copy/tone | "Type your question first" shown before you typed anything | Show it only after a failed submit |
| A-3 | class 4 Ask `s-m4-m-10` | major | flow | `/ask` redirects class 4 to home — no way to ask anything | Ask for every class |
| A-4 | Ask | minor | visual quality | A bare form "Ask Babu a question / Your question / Type / Ask" | Inviting composer with examples and voice |
| A-5 | Ask homework | minor | flow | `?homework=1` looks identical to normal Ask | Photo of homework, step help |
| A-6 | Ask answer `s-t7-t-14` | major | content level | The answer is a single truncated card ("…sunset mein…") read aloud — no diagram of scattering | Visual explanation |

## R — Practice

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| R-1 | `s-d6-d-16`, `s-t7-t-17` | **blocker** | flow | "Practice" opens the same lesson desk and the warm-up "Tumhe maths mein kaunsa topic pasand hai?" | Separate practice mode: quick-fire, mixed review, game-like |
| R-2 | practice | major | content level | See K-1 (7+2 for class 6) | Calibrated items |
| R-3 | practice tablet `s-t7-t-21` | major | visual quality | Number pad **and** a text box both visible; "Your answer: 12 🔍 Let's look again" | One input; clear feedback |
| R-4 | practice | minor | copy/tone | No count, no goal, no end | "5 quick ones" with a finish |

## N — Map/Garden, Notebook, Me, Teacher screen

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| N-1 | Notebook `s-t7-t-05` | major | flow | "Your next lesson will add a page here." after 4+ lessons | Write a page per lesson (even unfinished) |
| N-2 | Notebook | minor | visual quality | Empty card over a bookshelf painting | Real notebook UI |
| N-3 | Sky map `s-t7-t-03` | major | visual quality | Dozens of identical unlit constellations; labels like "A Tale of Three Intersecting Lines"; nothing lit | Show progress and what's next; collapse untouched chapters |
| N-4 | Sky map | minor | broken control | Bottom nav overlaps content in long pages | Pad for the nav |
| N-5 | Garden (class 4) `s-m4-m-03` | major | age-wrong design | Seed packet + trowel: "Let's plant the first one today." | Mastery map, same as older kids |
| N-6 | Me `s-t7-t-07` | minor | copy/tone | "Teacher's face: Moving" while the face doesn't move | Remove until it's true |
| N-7 | Me | minor | flow | "Talk mode: Tap to talk — Plug in headphones to use open mic" | Hands-free by default with echo cancellation |
| N-8 | Me | minor | visual quality | A settings list — fine for a parent, dull for a teen | A profile with identity, achievements, teacher |
| N-9 | Teacher screen `s-t7-t-09` | minor | visual quality | "Babu / AI teacher / Babu is your teacher. / Your teacher's name: Babu" — the name ×4, 70% empty | Teacher profile: voice, personality, change look |
| N-10 | Me "Switch learner" | minor | flow | Child-facing "Switch learner" with no PIN | Behind the parent gate |

## E — End of lesson

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| E-1 | summary `v-m4-m-27` | **blocker** | copy/tone | "What you did today: You listened to Babu today." after I correctly said 6/12/8; `cards: []`, `tried: 0` | Credit what I did ("you nailed 6 faces, 12 edges, 8 corners") |
| E-2 | next lesson | major | flow | Class 4: `nextTitle: "Right angles and circles"`, but Start reopens "Faces, edges and corners" from "Hello Aarav!" (3 starts, same opener). Class 6: 4 starts of "Number sequences", each from the warm-up "Maths mein tumhe kaunsa topic pasand hai?" | Resume or advance; reference last time |
| E-3 | summary | major | visual quality | One line and a Finish button, 80% empty | A real recap moment: what I made, what's next |
| E-4 | summary | minor | flow | No "show my grown-up" share, no next step | Share card; next challenge |
| E-6 | class 7 summary `k-t7-t-probe4-31` | minor | visual quality | Better: two cards "You said 10 ✓ · On your own". But 70% of the screen is empty, and an interim "Saving today's lesson" state shows first | Recap moment; no visible saving state |
| E-5 | parent note vs child summary | major | copy/tone | Parent note: "Aarav correctly stated the cube counts"; child summary: "You listened". Two stories of one lesson | One evidence source for both |

## PC — Parent corner (gate, home, progress, lessons, notes, controls, children, data, help, PIN, more)

| id | where | sev | category | feels (as a parent) | fix |
|---|---|---|---|---|---|
| PC-1 | home `s-d6-d-24` | major | failure visible | "Aarav's first lesson will appear here. Babu will say hello the first time Aarav opens Taxila." after the hello and 3+ visits | Use real state |
| PC-2 | home | major | broken control | "Lessons this week: 0 · 0 minutes" vs Notes "3 lessons · 4 min" | One definition of a lesson |
| PC-3 | home | minor | copy/tone | "ask Aarav what they would like…" — lowercase start; "they" for a named boy | Capitalise; use pronouns the parent gave |
| PC-4 | home "This week" | minor | visual quality | Big empty white area in the card | Content or collapse |
| PC-5 | lessons | major | copy/tone | Every attempt "Short visit, not counted as a lesson" — three entries of the same topic | Group retries; explain why it ended (child asked to stop) |
| PC-6 | controls `s-m4-m-29` | major | broken control | No date picker: no days off, exam weeks, holidays, weekly timetable (owner #11 "date and time") | Schedule editor: weekly grid plus exceptions, with a custom date picker |
| PC-7 | controls time | **blocker** | broken control | Same time-input bug as O-12 on phone (centre tap + type → unchanged 12:00) | Custom picker |
| PC-8 | controls | minor | flow | Changing hours shows a "Save" button only after an edit; easy to miss | Autosave with confirmation |
| PC-9 | controls | minor | copy/tone | "WhatsApp sending starts once Taxila's WhatsApp number is connected" | See O-10 |
| PC-10 | controls | minor | flow | Daily limit choices 15/30/45/120 — no 60 or 90 | A stepper |
| PC-11 | gate `s-m4-m-18` | minor | visual quality | Keypad keys clipped by the container edge; empty space above | Fit the pad |
| PC-12 | gate | minor | flow | 4 digits entered → still needs OK ("4 digits entered") | Auto-submit at 4 |
| PC-13 | data | minor | copy/tone | "Turning lessons off is the same as deleting your account" | Offer pause |
| PC-14 | lesson card `s-d6-d-44` | minor | copy/tone | "In Aarav's words: I don't know" picked as the quote | Pick a meaningful quote or none |
| PC-15 | lesson card | minor | flow | Date "Mon, 5 Oct 12:55 am" vs list "Today" | Consistent dates |
| PC-16 | progress | minor | visual quality | 112 skills listed flat with "Not started" pills | Collapse by chapter; show the frontier |
| PC-17 | forgot PIN | minor | flow | New PIN starts working 24 h later | Fine for safety; explain on the gate |
| PC-18 | phone parent nav | minor | visual quality | Bottom nav overlays the "Today's note" row in long pages | Pad for the nav |
| PC-19 | parent header | minor | visual quality | "B" avatar for the teacher next to "Lock" — unclear | Label |
| PC-20 | home "Listen to this page" | minor | visual quality | Floats alone above the cards | Inline |
| PC-21 | evidence | minor | flow | No checks recorded in any lesson ("No checks were recorded") — nothing to show the parent | Lessons must produce checks |

## X — Cross-cutting

| id | where | sev | category | feels | fix |
|---|---|---|---|---|---|
| X-1 | everywhere | **blocker** | age-wrong design | Flat cartoon people, baby animals, toddler props, "Garden", "grown-ups", "didi" — "this is for little kids" | A mature, game-grade design system for 9-15 (see `prototypes/reset/design-v3/`) |
| X-2 | everywhere | major | visual quality | Beige cards with grey borders on every surface; no motion, no depth | Motion system, depth, dark-first option |
| X-3 | everywhere | major | copy/tone | "Grown-ups", "Your grown-up chose", "Let's plant" — infantilising | Copy written for teens |
| X-4 | everywhere | major | visual quality | Two art styles fight: painterly backgrounds vs flat vector person | One direction |
| X-5 | fonts | minor | visual quality | Serif headings + rounded sans + monospace-looking "0" (slashed zero in times/PIN) | One type system; no slashed zero |
| X-6 | tablet | major | visual quality | Tablet = phone layout centred in a 600 px column | Tablet layouts |
| X-7 | laptop | major | visual quality | Laptop = sparse column with huge voids | Desktop layouts |
| X-8 | performance | major | performance | Home plan and images arrive late (C-1, C-4) | Server-side plan, preloading |
| X-9 | console | minor | failure visible | 401/409/422 errors in console on normal flows | Quiet states |
| X-10 | dark mode | minor | visual quality | Theme "Match phone" exists; dark was not exercised in this audit (all shots light) — unverified | Verify dark on every screen |
| X-11 | accessibility | minor | accessibility | Waveform-only answer echo, icon-only CC, PIN pad ignores the keyboard | Labels, keyboard, transcripts |
| X-13 | what worked | — | (pass) | "Explain it differently, use cricket" → a cricket scoreboard analogy for crores (class 7); ASR heard 11/11 clips right; the class 7 summary cards are honest | Keep and build on these |
| X-12 | safety floor | — | (pass) | AI disclosure at hello; Childline 1098 and Tele-MANAS 14416 on pause, help and landing — present and correct | Keep exactly; restyle only |
