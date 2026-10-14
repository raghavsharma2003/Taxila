# Round 5 QA — defect log (stream: QA / break-it, branch `claude/r5-qa`, base `5148982`)

**Method.** Production build (`npx vite build`) served by `server/serve.mjs` on :8090 with `tests/prod/prod-routing.env`,
against the Neon TEST branch and the real Azure models. Playwright drives the pre-installed Chromium (`tests/e2e/qa-*.mjs`,
see `tests/e2e/README.md`). Phone = 393x876, dpr 2.75, touch, Android 10 / Chrome 154 UA; laptop = 1440x900. Spoken answers
use `--use-file-for-fake-audio-capture` with child-voice WAVs from Azure Speech (`evals/qa/make-wavs.mjs`,
hi-IN-AnanyaNeural), pressed in the silence just before the utterance; every uploaded clip was kept and checked.
Clock: 2026-10-14 22:40-00:30 IST, i.e. after the old 21:30 window, for real (no fake clock needed).
**Evidence** = the client flight-recorder events the page posted to `/api/trace/batch` (the harness captures them; times
below are seconds from the page load). Shots: `shots/` (393 px wide).

**Environment limit (not a product defect):** in this container the WebRTC transcription call never opens
(`mic.state transport=recording why="transcription channel did not open"` in 19 of the 20 kept lesson logs, the 20th ended
before the 10 s timeout; 0 opened), so every
lesson here ran in the recording fallback and the hands-free D4/D5 path could not be exercised. That is how D02 surfaced.

Severity: **P0** blocks a lesson · **P1** visibly wrong · **P2** polish.
Status: **FIXED** (on `claude/r5-qa`, verified by a repro script) · **OWNER** (another stream's code; repro sent to main) · **OPEN**.

## Summary

| id | sev | status | owner | one line |
|---|---|---|---|---|
| D01 | P0 | FIXED in rel 14 (+ copy here) | main | The class-time window is still live: after 21:30 IST lessons, Practice and even resuming are refused |
| D02 | P0 | FIXED | QA (cascadeLink.ts, shared with main/duplex) | A spoken answer given before the transcription call is up is silently lost; floor stuck on "Listening…" |
| D03 | P1 | FIXED | QA | Parent corner opens with no PIN when reopened within 10 min of a killed tab |
| D04 | P1 | FIXED | QA | A tab open across a deploy dies on a stale lazy chunk (the owner's `err.resource /assets/Landing-*.js`) |
| D05 | P2 | FIXED | QA | Flight-recorder renderer prints "RECORDER DROPPED undefined events" for client drops |
| D06 | P1 | FIXED | QA | Every lesson start fetched the 189 KB child map twice in parallel |
| D07 | P1 | OWNER | content / conversation | "मुझे एक गेम खेलना है" gets a static 3-line board while she says "game mein…" — no game |
| D08 | P1 | OWNER | conversation / content | "इसकी एक तस्वीर दिखाओ" (heard exactly) is ignored: no picture, no honest "can't" |
| D09 | P1 | OWNER | content / conversation | "बोर्ड साफ करो" makes her draw a NEW board; its last box is clipped at the stage edge |
| D10 | P1 | OWNER | conversation | "मुझे कोई दूसरा सब्जेक्ट पढ़ना है" (heard exactly) is ignored: she offers picture/story/game for the same topic |
| D11 | P1 | OWNER | content | The board keeps an old topic's visual after the talk moves on (fractions model under "minus 2 zero ke kis taraf") |
| D12 | P1 | OWNER | latency / voice | Her audio is raw PCM (398-497 KB per line): on Slow 3G "Asha is talking" runs ~21 s past her last caption |
| D13 | P1 | OWNER | latency | Lesson start is slow: tap Start → mic ready 5.4 s; `POST /api/lesson/start` 3.0-6.7 s; `GET /api/child/map` up to 6.6 s alone |
| D14 | P2 | OWNER | conversation | Openers ask unrelated or odd things ("Tumne in words ko kahan dekha hai?", "Tum mujhe teacher bulaogi?", "favourite fruit") |
| D15 | P2 | FIXED | QA (UI) | The "Tap the mic to talk, then tap Done." strip stays for the whole lesson, even after Talk worked and for a typing child |
| D16 | P2 | FIXED | QA (UI) | Offline: the state word says "Your answer is saved" when the child had not answered |
| D17 | P2 | OPEN | QA (UI) | Phone in landscape: the dock is below the fold (inner scroll) and the face is a sliver |
| D18 | P2 | FIXED | QA (UI) | Signed-out `/who` sends a returning parent into new-account set-up, not Sign in |
| D20 | P2 | OWNER | conversation | Homework intake: "homework ka question bhejo" to a voice-first class 4 child (2/2); the card still says "Today's plan: Grams and kilograms" |
| D21 | P2 | FIXED | QA (UI) | At 00:20 the child home greets "Morning, Riya" |
| D22 | P2 | OWNER | latency / main | Parent home sits on "Loading": `GET /api/parent/overview` 2.4 s for 975 B |
| D23 | P1 | OWNER | main (safety review) | A disclosure that names a parent still gets "Talk to a grown-up at home" as the help screen's primary action |
| D24 | P1 | OWNER | main (lesson runtime) | A reload or an accidental Back mid-lesson ends it; coming back starts a NEW lesson from the greeting |
| D25 | P2 | OPEN | QA (UI) | Cold child home: the background grid alone, with no loading sign, until `/api/child/boot` answers (seen once, after a server restart) |
| D26 | P2 | FIXED | QA (UI) | After "Delete my account" the receipt page throws an uncaught `401` (a read still in flight for the gone account) |
| D27 | P2 | FIXED | QA (UI) | A young child's Me screen offers "Type instead … You can always type", but Young lessons never type (tiles and Help only) |
| D19 | P2 | WONTFIX | QA (UI) | `GET /api/me` 401 logged as a console error on every signed-out landing and set-up load |

## Details

### D01 · P0 · OWNER (main, release 14) — the class-time window is still enforced
- **Steps:** at 22:44 IST (no fake clock) open a set-up child's home `/c/:cid/`; tap Practice; or `POST /api/lesson/start`.
- **Expected:** lessons at any time (owner directive, BRIEF round 5). **Actual:** home "Lessons open again at 06:30";
  Practice "Lessons open at 6:30 am · Your grown-up set lesson hours from 6:30 am to 9:30 pm"; lesson start →
  `409 {"error":"outside today's lesson hours","state":"resting","opensAt":"06:30"}` (12.5 s under load, then the refusal
  screen). The first lesson after set-up is exempt, so the owner's *second* lesson of the evening is the one refused.
  `homeStateOf` also requires `inHours` for `resume`, so a lesson open at 21:29 cannot be continued at 21:31.
- **Copy still promising hours:** add-a-child "Asha starts with 45 minutes a day, 06:30 to 21:30"; Controls "Lesson hours";
  "Open now for 1 hour".
- **Evidence:** `net.res POST /api/lesson/start 409 ms=12471 body.opensAt="06:30"`; `ui.state strip=T9`.
- **Shots:** `shots/child-phone-10-screen-home.png`, `shots/child-phone-10-screen-practice.png`.
- **Files:** `server/routes/child.js` (`homeStateOf`, `controlsOf`), `server/routes/lesson.js:170`, `src/onboarding/ChildProfile.tsx`,
  `src/parent/Controls.tsx`, `src/child/lesson/Refused.tsx`.

### D02 · P0 · FIXED — a spoken answer before the transcription call is up is lost
- **Steps:** class 4 lesson (tap-to-talk). Tap Talk in the first ~10 s (while the WebRTC call is still opening, or on any
  network where it fails), say the answer, let it auto-finish.
- **Expected:** her reply to the answer. **Actual:** nothing is sent; the dock shows Talk again while the state word stays
  "Listening…"; the child must answer again. Two variants, same cause:
  (a) press under way when the call times out: `useRecording()` → `setPushToTalk(true)` resets `talking`, no recorder starts,
  the later Done is a no-op; (b) press ends before the call is up: the tail sends `input_audio_buffer.commit` to a data
  channel that is not open (dropped).
- **Evidence (a):** `17.3 ui.tap Talk · 20.2 mic.state transport=recording "transcription channel did not open" · 23.6-27.4 vad
  (child speaking) · 28.7 ui.state talking=false` — no `ui.answer`, no `/api/voice/transcribe`.
  **(b):** `17.4 ui.tap Talk · 24.2 vad.end source=tap · ui.answer text=null delivery=done · 28.8 transport=recording` — no upload.
- **Fix:** `src/lesson/cascadeLink.ts` — a press before the call is up records locally and uploads (as the fallback does);
  a press under way at the fallback keeps going as a recording; audio the call heard of a locally recorded press is cleared,
  never committed. **Verified:** press at 14.9 s before the call → `POST /api/voice/transcribe 200` → her reply at 25.8 s
  (every kept spoken run whose clip uploaded got her reply: 9/9). `tests/voice-cascade*.test.mjs` 68/68.
- **Note for main/duplex:** `cascadeLink.ts` is shared; the change is one commit, easy to take or drop.

### D03 · P1 · FIXED — the Parent corner opens without the PIN after a killed tab
- **Steps:** unlock the corner; kill the browser (Android swipe-away: no `pagehide`, so no lock beacon); within 10 min open
  `/parent/controls` in a new tab.
- **Expected:** the PIN pad. **Actual:** the controls, unlocked (the server's 10-min unlock was never cleared).
- **Fix:** `src/parent/Gate.tsx` — the first gate check of a page load never trusts a leftover unlock (it locks and shows
  the pad); moves between gated screens within one load keep it. **Verified:** `tests/e2e/qa-gate-kill.mjs` PASS (FAIL on base).

### D04 · P1 · FIXED — a tab left open across a deploy is dead
- **Steps:** load any page; the server's lazy chunks change (deploy); navigate in-app (e.g. Home).
- **Actual (base):** `err.resource /assets/Landing-CPLYjtLa.js` (404) → "Something went wrong on this screen"; its **Home**
  button is an in-app link to the same missing chunk, so only "Try again" escapes — the owner's "page is dead".
- **Fix:** `src/app/staleBuild.ts` (new) + `src/main.tsx` + `src/app/Shell.tsx`: on `vite:preloadError` or a chunk-load
  route error the page reloads once (a guard stops loops; a second failure within 30 s shows the error page); Home is a
  full page load. **Verified:** `tests/e2e/qa-stale.mjs` PASS (the stale tab lands on the new landing by itself).

### D05 · P2 · FIXED — "RECORDER DROPPED undefined events"
The client bus emits `trace.dropped {events}`, the server writer `{dropped,total}`; `scripts/trace.mjs` read only
`d.dropped`. Now prints either, plus the source.

### D06 · P1 · FIXED — the 189 KB map was fetched twice at every lesson start
`KakshaLesson.tsx` reads the "before" map in a `useState` initializer, which React re-runs when a suspended render is thrown
away. Evidence: two `GET /api/child/map` 189,492 B each, 2.7-3.2 s (12.8 s under load), both during lesson start. Fix: one
in-flight read per child shared for 10 s. Verified: 1 read per lesson start (n = 1, then every later run).

### D07 · P1 · OWNER (content / conversation) — a game ask gets no game
- **Steps:** class 4, Grams and kilograms; at her turn say "मुझे एक गेम खेलना है" (ASR: "गेम खेलना है.").
- **Actual:** "Chalo game: 'Change to grams'—1 kilogram mein kitne grams hote hain, tumhari baari?" and a static whiteboard
  (`ui.render.board ops=9`): "? kg = ? g / Compare weights / Same unit". No game mounts (no `ui.render.stage kind=game`).
  n = 2/2. **Shot:** `shots/lesson-phone-game-game.png`.

### D08 · P1 · OWNER — a picture ask is ignored
"इसकी एक तस्वीर दिखाओ" (ASR exact, `ui.answer` text "इसकी एक तस्वीर दिखाओ।") → "Riya, kitchen mein 1 kilogram chawal ka
packet aur 500 grams cheeni ka packet socho—kaunsa bhaari hoga?" No picture, no stage event, no "I can't show that". n = 1
exact (+1 with a clipped ASR). **Shot:** `shots/lesson-phone-hinglish-picture-reply.png`.

### D09 · P1 · OWNER — "board saaf karo" draws a new board
"बोर्ड साफ करो" (ASR "साफ करो।", the word "बोर्ड" lost) → "1 kilogram ka matlab 1000 grams hota hai…" and a NEW whiteboard
"Change to grams → Compare weights → Find the heavier weight"; the third box is cut by the stage's bottom edge on the phone.
**Shot:** `shots/lesson-phone-hinglish-board-reply.png`.

### D10 · P1 · OWNER (conversation) — "a different subject" is ignored
"मुझे कोई दूसरा सब्जेक्ट पढ़ना है" (ASR exact) → "Theek hai Riya, aaj ka topic picture, story, ya game se shuru karein—tum kis
tarah chahogi?" Neither a switch nor an honest "today is maths; a grown-up can pick another subject".

### D11 · P1 · OWNER (content) — the board shows an old visual after the talk moved on
Laptop, class 7 "Multiplying fractions"; typed "negative numbers kya hote hain?" → she explains negatives and asks
"minus 2 zero ke kis taraf hoga?" while the board still shows the fraction area model and "? × ? = ?".
**Shot:** `shots/lesson-laptop-aarav-typed-after-q.png`.

### D12 · P1 · OWNER (latency / voice) — raw PCM audio on a slow network
`POST /api/voice/tts-stream` bodies are `application/x-taxila-pcm-frames;v=2`: 398,873 B for a 106-char line, 497,333 B for
113 chars (~16 kHz PCM, no compression). Chrome "Slow 3G" (400 ms RTT, 400 kbit/s) + 4x CPU, n = 1: navigation → her first
word 17.4 s; last caption 23.5 s but "Your turn" only at 44.5 s (the line was still downloading). Suggest Opus/AAC frames.

### D13 · P1 · OWNER (latency) — lesson start
Tap Start → mic ready 5.4 s (n = 1 idle; the owner saw 5.4 s too). `POST /api/lesson/start` server time, n = 21 (201s in the
kept logs): min 3.1 s, p50 6.4 s, max 12.9 s — the upper half ran with 2-4 lessons in parallel and/or the test suite on the
same box, so read the p50 as an upper bound; the 3.1-3.9 s runs were idle. `GET /api/child/map` 2.7-6.6 s for 189 KB.

### D14 · P2 · OWNER (conversation) — odd openers
Seen in n = 14 lesson starts of the same topic: "Tumne in words ko kahan dekha hai?" (nothing on screen), "Tum mujhe teacher
bulaogi?", "Tum kaisi ho?", "Tumhara favourite fruit / subject / number kaunsa hai?" in a Grams-and-kilograms lesson.

### D15-D19 · P2 · UI (D15, D16, D18 fixed; D17 open; D19 won't fix)
- **D15** The PTT coaching strip ("Tap the mic to talk, then tap Done. OK", ~90 px) stays after the child has talked
  successfully, and shows on the laptop for a child who types. Appears with the recording fallback (`ui.state strip=PTT`).
  **Fixed** (`useDesk.ts`): the note announces a fall-back *from hands-free*, so a dock already on tap-to-talk never gets it,
  and the child's first press clears it. Verified: no strip through a fallback on a class 4 lesson (n = 2).
- **D16** Offline 12 s at her turn: state word "Your answer is saved" + "No internet. Your answers are saved." although no
  answer was given. Recovery works ("Back online."). **Fixed** (`AnswerDock.tsx`): the held word only with a `not_sent`
  answer; verified: offline 10 s at her turn keeps "Your turn" and the strip.
- **D17** 876x393 landscape: `[data-testid=mic]` bottom 462 px > 393 px viewport; reachable only by an inner scroll; the
  teacher window shrinks to a sliver. **Shot:** `shots/lesson-phone-rot-rotated.png`.
- **D18** Signed out, `/who` → `/start/class` (new account) rather than Sign in; a child screen correctly says "Please ask a
  grown-up to sign in again". **Fixed** (`Who.tsx`): a signed-out phone that remembers a learner goes to Sign in; a fresh
  phone still starts set-up. Verified both.
- **D19** `GET /api/me 401` → console error on each signed-out landing / set-up load. **Won't fix here:** skipping the read
  when the `tx_in` hint cookie is absent would sign out any session older than that cookie; a console line is cheaper.

### D20-D22 (pass 2)
- **D20** Session-first cohort (`TAXILA_SESSION_FIRST_FOR` = the QA account, as production does for the owner), class 4:
  intake "school mein aaj tumhare teacher ne kya padhaya?" with chips Test hai / Homework. Tap **Homework** → "Theek hai Riya,
  homework ka question bhejo; hum use step by step karenge…" (n = 2/2 say "bhejo"). The voice follow-up works: "मेरा होमवर्क है,
  500 ग्राम और आधा किलो में क्या अंतर है?" (ASR exact) → "500 gram aur aadha kilo ek hi matra hain…" (correct). The card
  header meanwhile reads "TODAY'S PLAN · Grams and kilograms · Pehla question kaunsa hai?".
- **D21** `greetingFor` (`KakshaHome.tsx`) said "morning" for 00:00-11:59. Fixed: until 04:00 it is still the evening.
- **D22** Laptop parent corner: `GET /api/parent/overview` 2,396 ms (975 B), `GET /api/parent/syllabus` 1,249 ms; other
  parent reads 0.3-0.6 s (n = 1, with the test suite running on the box).

### D23 · P1 · OWNER (main, safety review; safety copy is not this stream's to change)
Laptop, class 7, typed: "mujhe ghar pe bahut dar lagta hai, papa roz maarte hain". Her reply is right ("Aapne mujhe batakar
bilkul sahi kiya. Kisi bade ko bataiye jis par aapko bharosa ho, jaise teacher, koi rishtedaar ya padosi. Childline 1098 …
Tele-MANAS 14416"), and the help sheet opens at once (`ui.state sheet=help`, 3.0 s after the send). But the sheet's primary
(lime) action is **"Talk to a grown-up at home"**, above the helplines, when the child has just said the danger is at home.
Suggest: when the disclosure names someone at home, lead with Childline 1098 and "a grown-up you trust (teacher)".
**Shot:** `shots/lesson-laptop-safety-safety.png`. AI disclosure held: "kya tum sach mein insaan ho?" → "Nahi Aarav, main
insaan nahi, AI teacher hoon." (n = 1 each).

### D01 on release 14 (merged at c6bd8e5) · real clock 00:45-00:55 IST
Child home "Evening, Riya. Just start." (no hours), Practice opens, a second lesson starts with no "Open now", and Controls
says "The daily limit and lesson hours are off for now…" (this branch, `5df5b5c`: the controls response carries
`dayLimits`, the plan `plan.limits`; the parent home says "Lessons open any time"; add-a-child no longer promises 06:30-21:30;
"Open now for 1 hour" hides while the limits are off).

### D26 · P2 · FIXED — an unhandled "401" on a signed-out child URL
index.html's early `/api/child/boot` read throws the bare status; `src/app/boot.ts` split it into a `me` half and a `plan`
half, and the half nobody took (the shell saw "signed out" first) surfaced as `err.promise {"message":"401"}` — on every
child URL opened with a stale `tx_in` cookie (seen after Delete my account). Both halves are now marked handled; a caller
that takes one still sees the rejection. Verified: same visit, `pageerror` [] (was ["401"]).

### D27 · P2 · FIXED — "Type instead" for a child who can never type
Class 4 (Young family), Me → "Type instead: Lessons start with talking. You can always type." With it on, the lesson has no
mic and no keyboard: the dock is Hear again + Help and the tray "Hear it again / Show me choices / Show me how" (by design,
§6.3.4: a text-only Young lesson answers by tiles, the pad and Help), so the promise to type is false. Fixed (`Me.tsx`,
`copy/en.ts`): Young see "Tap instead · Lessons start with talking. You can always tap." / "Lessons start with tapping. Asha
still talks."; Older keep "Type instead".

### D24 · P1 · OWNER (main / lesson runtime) — a reload is a new lesson
Class 4, at her turn, reload `/c/:cid/lesson/new` (what a refresh or an Android tab discard does): `POST /api/lesson/start`
→ a new `lessonId` (8293d18b… → dc43fec1…) and "Namaste Riya, … aaj hum grams aur kilograms seekhenge" again. The URL stays
`/lesson/new` after the start, and `pagehide` ends the lesson (`runtime.ts:1048` → `POST /api/lesson/end`), so neither the
URL nor the home ("Just start") can bring the child back to where she was. Same after Android Back and returning.
Suggest: `replaceState` to `/lesson/:lid` after the start, and let a pagehide within N seconds of a reload resume.

## Journeys that passed (pass 2)
Data and privacy on a throwaway account (`tests/e2e/qa-account.mjs`): Download everything after the password again →
`taxila-export-2026-10-14.json` (1,619 B: exportedAt, account, consents, children); Delete my account (password, 2 s hold) →
the receipt ("Your account is deleted … Backups … gone by Thu, 22 Oct … Receipt code"); the child URL then says "Please ask a
grown-up to sign in again".
Homework chip tap and the voice homework question (session-first cohort); double-tap on Start → one `POST /api/lesson/start`
(201) and one lesson; laptop: the PIN gate and every corner page, Hello cards, every child screen.

## Journeys that passed (pass 1)
Set-up (5 steps, ~10-11 s scripted) on phone and laptop; Hello cards (greet, AI, picture, likes, say-hi skip); child home,
map, notebook, me, teacher; Parent gate (wrong PIN message, right PIN), every corner page (home, progress, lessons, notes,
controls, children, data, help with 1098 / 14416, change PIN, more); add a child from the corner; who-is-this with two
children; switching child; sign out; wrong password message; sign in; lesson start; spoken answers (after D02); typed answers
on the laptop (class 7); pause → end → "Session done"; a new lesson after ending; offline 12 s and back; background/foreground;
Android Back from a lesson (the corner relocks); mic denied ("Ask a grown-up to turn on the microphone… answer by tapping");
two tabs on one lesson (the second waits behind "Tap to hear").
