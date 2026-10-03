# Gap audit: end-to-end flows and UI/UX, parents and children (production, 2026-10-03)

Pillar: end-to-end product flows and UI/UX. This is an audit only. No code or commits were changed. Everything
below was observed on **production** (`taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`, revision
`taxila-web--saa263ce-4ir3`, bundle `main-W1OdjGXm.js`) between 19:24 and 20:15 UTC (00:54 to 01:45 IST). The
screenshots are in `docs/design/gap-audit/flows/`, named `<nn>-<flow>-<step>-<m|d>.png`. `m` means a 360x640 phone
(DPR 2, touch, Android UA). `d` means a 1280x800 desktop.

Severity scale: **BLOCKS** means it stops the owner testing the feature thoroughly. **DEGRADES** means it works
but the experience or the trust is clearly worse than the spec. **POLISH** means it is visible but small.

## 0. Method, what was walked, and what is unverified

- **One real guardian account** (`audit+flows1791055756058@taxila.test`), walked as a parent would:
  - landing;
  - the full 8-step sign-up on the phone (class 2);
  - Hello, then the voice lesson, then a text-mode lesson to the end, then practice;
  - Garden, Notebook, Me and Teacher;
  - parent gate, then every parent page (home, progress, lessons, lesson card, transcript, notes, controls,
    children, data, help, forgot PIN);
  - add a child, class 5 (phone): Hello, a lesson by typing to the end, summary, Who, home "done", Sky, Notebook,
    Me, Ask and Quick practice;
  - sign-in on desktop, then the parent corner on desktop (evidence sheet, Listen, lesson card, progress);
  - add a child, class 8 (desktop): Hello with a renamed teacher ("Vikram"), a `?mode=text` lesson to the end,
    home, Sky, Notebook;
  - Download everything; delete the class-8 profile in the UI.
- **Cleanup:** the account was deleted through the UI (Data and privacy → Delete my account → password → hold).
  After that, `/api/me` returned 401 and login returned 400. No test data remains.
- **Harness note:** Chromium's own CONNECT tunnels through the sandbox egress proxy failed at random
  (`net::ERR_TOO_MANY_RETRIES`, 14 to 27 s page loads). Curl to the same assets returned in 0.17 to 0.38 s. So every
  browser request was fulfilled through Node `fetch` (Playwright `context.route`). Network timings are therefore
  the sandbox's, roughly Azure eastus2 plus the proxy, not an Indian 4G phone's. The audio-worklet load failed
  under this interception (`featureWorklet ... Network error`), which may be a harness artefact.
- **API probes:** the turn and start payloads were read in-page with `fetch` (the `scripts/prod-smoke.mjs`
  pattern), to see what the server sends behind what the screen shows.
- **Not verified from this sandbox:**
  - **Voice:**
    - WebRTC and the realtime lane;
    - live transcription (it fell back to push-to-talk: `cascade: transcription call unavailable`);
    - mic capture;
    - audio quality;
    - lip-sync;
    - whether "Playing" on Hello ends at the end of the clip.
  - **Time and messaging:**
    - "home the next day" (the learning day rolls at 04:00 IST, and I could not move the clock);
    - weekly WhatsApp and notifications (the UI says the WhatsApp number is not connected);
    - offline turn recovery (my offline probe hit the 409 in gap 1 before it reached a turn).
  - **Device and modules:**
    - 3D/GPU face tiers;
    - real budget-phone frame rate;
    - whether a module iframe renders when the engine id is valid (no valid mount occurred in 4 lessons; see gap 2).

## 1. Verdict

The parent side is now mostly real:
- onboarding is 8 clean steps with no horizontal scroll at 360 px;
- consent is unbundled, and each "No" states its effect;
- the PIN gate, lessons, lesson cards with the child's own words, PIN-gated transcripts, the evidence sheet,
  controls, export and delete-account all work end to end.

The class-5 and class-8 typed lessons run, are correct most of the time, honour aap, and end with an honest
summary and a "Done for today" home.

**The child side still breaks in ways that stop thorough testing:**
1. Practice and Ask are dead after the day's lesson.
2. No interactive module ever loads, because the Director names engines the frame does not have.
3. A class 1–4 child in text mode (or with voice down) cannot answer anything at all.
4. The teacher regularly asks a different question from the one on the card.

The rest (internal director text shown to the child, "Skip" ending the lesson, parent claims that contradict
each other, practice that is a full lesson) degrades trust rather than blocking.

## 2. Ranked gaps

### G1. Quick practice and Ask are dead ends after the day's lesson — BLOCKS
- **Evidence:**
  - Riya (class 5) finished her lesson, and home showed "Done for today" with "Practise something", "Quick
    practice" and "Ask a question". Every one of them led to "We couldn't start the lesson. Try again / Go home".
  - `POST /api/lesson/start` → **409** `{"error":"today's lesson is done"}`.
  - Shots: `29-ask-c5-sent+*-m.png`, `30-practice-c5-after-done-m.png`.
  - The server lets practice and Ask through only when the client sends `purpose`
    (`server/routes/lesson.js:475-480`, checked at `:507`). `grep -rn purpose src/` finds nothing, so the client
    never sends it.
  - The same request with `purpose:"doubt"` or `"practice"` returned 201 in a probe.
  - `/c/:cid/lesson/new` in a done state shows the same generic error, not the designed done/capped/resting screen.
  - This is `open-lt-client-wiring-2` in `context/open.md`, still open in production.
- **Close it:**
  - send `purpose: "practice"` from `PracticeRoute` and `purpose: "doubt"` from `Ask` / `LessonScreen variant="doubt"`;
  - handle a 409 `LessonStartRefused` with the designed states (done → back to home's DidCard; capped → "That's all
    for today"; resting → "Lessons open at {opensAt}") instead of the error screen;
  - add an e2e that starts practice and Ask after a finished lesson.
- **Estimate:** 0.5 day.

### G2. No interactive module ever loads; the tray is an empty box, and on "choice" items the child loses Type — BLOCKS
- **Evidence:**
  - The Director mounted `place-value-chart@1` (class 5) and `counters-grouping@1` (class 2) from production.
    The frame registry knows 14 ids (`src/modules/frame/registry.ts:6-21`: `place-value@1`, `collections@1`, …).
    Unknown ids post `unknown engine` (`src/modules/frame/bootstrap.tsx:107-109`), and the tray is taken off (T7).
  - Root cause: `server/director/modules.js:13-25` builds the id by slugging the raw kit hint and appending
    `@1`. It does not use `shared/engine-catalog.js` `resolveHint` / `pickEngine`, which has the alias table
    (`"place-value-chart": A(PV)`, line 61).
  - Measured over `data/kits/*`:
    - in **804 of 830** topic kits, the first engine hint maps to an id the frame cannot load;
    - 156 of those have a hint the catalogue would resolve;
    - the rest are hints (`read-along`, `kavita-beat`, `story-sequencing`, `role-play`, `map-explorer`, …) with no
      engine at all.
  - What the child sees: about 35% of the phone is an empty beige tray on most turns (`22-c5-t02.png`,
    `22-c5-t09.png`, `05-text-c2b-final.png`).
  - For the diagnostic choice item the server sends `ui.answerForm:"choice"` / `"tap_in_tray"` with
    `tray:"module"`, so the dock drops **Type**. The child has only Hint and Talk, and the choices exist only in
    speech ("1250,00; 1,25,000; or 12,5000?"). With voice down this is a dead end. I waited 15 s and nothing
    changed (`22-c5-t09-wait15s-m.png`).
  - Owner intent ("games, animations and diagrams generated on the spot") is therefore unmet in every lesson I ran.
- **Close it:**
  - make `planModule` call the catalogue's `pickEngine` / `planEngine` (one resolver, pinned by
    `tests/engine-catalog.test.mjs`), and never emit an id outside `ENGINES`;
  - when nothing resolves, send the item's choices as `ui.chips`, and never send `tray:"module"` /
    `answerForm:"tap_in_tray"` without a mount;
  - on the client, when a module fails, fall back to tiles from the item and restore Type;
  - add a kit lint that fails on unresolvable engine hints, and either map or drop the 648 hints that have no engine.
- **Estimate:** 1.5 to 2 days (resolver and fallback 1 day; kit lint and alias pass 0.5 to 1 day).

### G3. Classes 1–4 cannot answer anything in text mode (or with voice down) — BLOCKS
- **Evidence:**
  - Aarav (class 2), `?mode=text`: 14 turns in about 3 minutes, and **zero** possible answers
    (`05-text-c2c-turn01..12.png`).
  - **No NumberPad.** "2, 4, 6, 8… ab aage kya aayega?" (`answerForm:"number"` from the API) rendered no NumberPad.
    The tray showed the help menu over the space where the pad belongs, and then a "Got it" disc
    (`05-text-c2c-turn04.png`, `turn10.png`). The pad logic is in `src/child/lesson/useDesk.ts:324-334`. The
    help-menu overlay (`:560-575`) appears to win over it. That is a hypothesis; the visible result is certain.
  - **"Show me choices" never shows choices.** It sends the phrase `Choices dikhao` as the child's answer
    (`useDesk.ts:79`). The teacher then *speaks* choices ("choices: A) 9, B) 11, C) 12") while the card still shows
    "2, 4, 6, 8… what comes next?". The spoken choices belong to another item (the chappal item, answer 9), so
    **the card's question has no correct option on offer**.
  - "Tap a picture above" sits over an empty tray (`05-text-c2b-final.png`).
  - The parent transcript shows the result: "Aarav: Choices dikhao" ×13 (`13-parent-transcript-m.png`). The lesson
    card quotes "In Aarav's words: Choices dikhao" (`13-parent-lesson-card-c2-m.png`).
  - Young practice behaves the same (`09-practice-c2+14s-m.png`).
- **Close it:**
  - render `ui.chips` and item choices as picture tiles for Young;
  - show the NumberPad for every `answerForm:"number"`, and let the help overlay close over it rather than replace it;
  - make "Show me choices" a client request that returns tiles (or a server move that sends `ui.chips`), never a
    child utterance;
  - never record help-menu phrases as the child's words in transcripts, evidence or "In {child}'s words";
  - add an e2e: a Young text lesson must commit at least 3 answers.
- **Estimate:** 1 to 1.5 days.

### G4. The teacher asks one thing while the card shows another; a typed answer is treated as "didn't catch that" — BLOCKS (for judging comprehension)
- **Evidence:**
  - **Class 8:** the card said "13 ka square kitna hai?" while she said "10 ka square kitna hoga?"
    (`50-c8-t05.png`). The child typed 100, and the server answered with `move.kind:"repair"` ("you did not catch
    it clearly…"). The input was **typed**.
  - **Class 8, again:** "…14 times 14 karke result batayiye. 9² kitna hota hai?" asked two different questions in
    one turn.
  - **Class 5:** after a hint for one item, a new item followed in the same breath: "Try writing the complete
    numeral. Write in numerals: twenty-four thousand…". A wrong answer got a correction, and then a different
    question came at once, with no retry.
  - API probe: typed "1" and typed "yes" were also both classed as `repair` with "I didn't catch that clearly".
  - This is the old audit's #6, still present.
- **Close it:**
  - a server lint (G-ASK parity, listed as unimplemented in `open-lt-voice-lane-truth`): the reply must end on
    `ui.ask.text`, and may hold only one question;
  - a corrective move must re-pose the same item before moving on;
  - `repair` must never fire on `typed:true`. A typed off-target answer is a verdict or a hint, not "say it again";
  - add a regression test from these exact transcripts.
- **Estimate:** 1 to 1.5 days.

### G5. Internal director instructions are shown to the child as the hint, and help requests become "Your answer" — DEGRADES (high)
- **Evidence:**
  - The card hint line read **"pump: ask them to picture both choices as real things"**, with "Your answer: Can I
    have a hint" (`22-c5-hint-leak-m.png`).
  - The source is the diagnostic item's hints in `server/director/items.js:55-59`. They are teacher shapes
    (`pump:` / `hint:` / `prompt:` / `assertion: say which option is right`), rendered verbatim by
    `src/child/lesson/useDesk.ts:265`.
  - Rung 4 would show "assertion: say which option is right…" to a child.
- **Close it:**
  - give diagnostic items child-facing hint text (or none), and keep the rung shapes server-side;
  - strip the `^\w+:` rung labels in `ui.hint`;
  - the client should show hint requests as a chip state ("Hint asked"), not as the answer;
  - add a lint over `ui.hint.text` for shape words (`ask them`, `say which`, `pump`).
- **Estimate:** 0.5 day.

### G6. "Skip for now" ends the whole lesson — DEGRADES
- **Evidence:** on the stuck choice item, Hint → "Skip for now" got `move.kind:"wrap"` ("they want to stop:
  stop now"), and the lesson ended about 8 minutes into a 30-minute allowance (`23-summary-c5-m.png`).
- **Close it:** map the skip request to "skip this item" (the item goes to `skipped` and the next one is posed).
  Only explicit stop words or Pause → End should end the lesson.
- **Estimate:** 0.25 day.

### G7. Parent claims contradict each other, or rest on no evidence — DEGRADES (parent trust)
- **Evidence:**
  - **No evidence:** Aarav answered nothing, yet Progress says "Skip counting … **Practising**" and the Garden
    shows a sprout (`12-parent-progress-c2-m.png`, `08-map-c2-m.png`). His lesson card says "No answers were
    checked".
  - **Kabir's state differs by page:**
    - Parent home: "has been practising" (`57-parent-home-kabir-d.png`);
    - lesson card: "Compute squares… **Got it**" (`58-lesson-card-kabir-d.png`);
    - Progress topic: "Practising";
    - Sky map: "Got it".
  - **Next topic differs:** home says "Next: Square numbers, tomorrow", but the child's summary said "Next time:
    Square roots". For Riya the parent saw "Next: Big numbers" while she saw "Estimating large numbers".
  - **Counts differ** for the same day:
    - parent home: "Lessons this week: 1 · 6 minutes";
    - Notes: "3 lessons · 16 min";
    - Lessons list: three rows;
    - plan: `usedMin 4.9`.
  - **The evidence sheet** shows "A practice question · Right · on their own" (`47-evidence-riya-d.png`). It does
    not show the actual question, the answer or the child's words (spec §3.11: "the attempt, the date… and the
    child's own words").
  - **Try at home** for writing 5-digit numerals says "With coins, spoons or rotis…" (a generic template), and
    starts with a lowercase "ask Aarav…" (`11-parent-home-m.png`).
  - "about 23.3 minutes" shows a raw decimal.
- **Close it:**
  - one claim source per child and day (the ledger projection) feeding home, progress, lesson card, map and notes;
  - `introduced` with no committed evidence shows "Not started" ("Seen, not yet tried" if needed);
  - one next-topic function shared by the summary and the parent home;
  - one minutes and lessons definition;
  - the evidence sheet renders the item prompt, the answer and the quote;
  - a G-PARENT-1 test across all five surfaces.
- **Estimate:** 1.5 days.

### G8. No way to choose text or tap-only lessons in the product — DEGRADES (and slows the owner's testing)
- **Evidence:**
  - Text mode exists only as `?mode=text` (`src/child/lesson/LessonScreen.tsx:64`) or practice.
  - `prefs.quiet` ("the lesson starts in text mode") is set by no screen (grep).
  - Controls (`15-parent-controls-m-full.png`) lacks the spec rows §3.11 / §6.5.4: tap-and-type only, extra time to
    answer, sounds, open mic, teacher-choice policy.
  - Me has captions, talk mode and face, but no "type instead".
  - On a phone the voice lane is the default. When transcription fails, the fallback is push-to-talk plus a
    permanent "Tap the mic to talk, then tap Done. OK" card that takes about 1/6 of the screen on every turn
    (`22-c5-t07.png`).
- **Close it:** add "Tap and type only" to Controls (per child) and "Type instead" to Me, both wired to
  `prefs.quiet` / `textOnly`; add the remaining controls rows; dismiss the PTT note once, for good.
- **Estimate:** 0.5 to 1 day.

### G9. "Your child picks the teacher" is not true yet — DEGRADES
- **Evidence:**
  - The landing promises: "Your child chooses a face and a voice, and gives the teacher a name"
    (`01-landing-full-d.png`).
  - Production has one teacher per band:
    - classes 1–4: Asha (`02-onb-2-meet-c2-m.png`);
    - classes 5–9: Arjun (`20-add-2-meet-c5-m.png`, `48-add-c8-meet-d.png`).
  - Hello offers only a rename. The rename list offers "Arjun" for the woman teacher and "Asha" for the man
    (`04-lesson-c2-open+2s-m.png`).
  - The rename itself works end to end: "Tara" and "Vikram" carry into the lesson, the parent corner and Controls,
    with "Reset to Asha".
- **Close it:** either ship a second eligible teacher per band (face plus voice) with the §3.3 step-5 picker, or
  change the landing copy now. Filter the name list to fit the teacher (or neutral names).
- **Estimate:** copy 0.1 day; a real second teacher depends on the avatar pillar (several days, not estimated here).

### G10. Quick practice is a full lesson, not the spec's 5-item set — DEGRADES
- **Evidence:** practice opened with a greeting, "Namaste Aarav beta! Aaj skip counting ko cricket ke runs ki
  tarah dekhenge…", followed by an interest question (`09-practice-c2+14s-m.png`). It had no "Practice · 2 of 5"
  counter and no "That's the set" summary. Spec §3.6: no greeting, item 1 in ≤ 3 words, 5 items from the review
  queue.
- **Close it:** a practice purpose in the Director (no greet or hook; queue items only; a count in `ui`; a practice
  summary), plus the client counter and summary.
- **Estimate:** 1 day (after G1).

### G11. Ask runs inside today's topic, not the child's question — DEGRADES
- **Evidence:**
  - An API probe with `purpose:"doubt"` started "Numbers in thousands and beyond" with the opener "Which space
    object interests you most?".
  - The question "Why is 1/2 bigger than 1/3…" then came as turn 1, and the reply was good (pizza model). But
    `ui.shortTitle` stayed "Big numbers", so the lesson, ledger and summary file a fractions doubt under the wrong
    topic.
  - The client sends the question as a first turn after start (`useDesk.ts:513-516`), not in the start request.
- **Close it:** send `firstText` in `LessonStartRequest` for a doubt; skip the greeting and hook; route to the
  matching topic (or the "Which book? Which chapter?" picker from §3.7); title the summary with the question.
- **Estimate:** 1 day.

### G12. Onboarding and sign-in rough edges — DEGRADES / POLISH
- **Raw API strings, one box:**
  - an empty submit shows "missing field: email", and a bad email shows "invalid email" (`02-onb-4-account-bad-m.png`);
  - the message sits in one box above the button, not on the field, and there is no client-side validation;
  - spec §3.2 step 4: "Never a raw API string". DEGRADES.
- **Sign-in:**
  - no password **Show** toggle;
  - **no "Forgot password?"** on sign-in (`41-signin-d.png`); the spec's interim is "Contact help@taxila…";
  - sign-in shows "Step 4 of 8" onboarding progress (`41-signin-d.png`).
- **Missing from the spec:**
  - step 8, the sound and mic check, is missing (the counter says 8 steps, so the hand-over is step 8);
  - there is no ▶ per promise on step 3;
  - "What she said" on Meet is Hinglish (the spec says English transcript).
- **Hold control:** its accessible name is "Hold to continue . Press and hold for 2 seconds." (stray period, said
  twice). The same pattern appears on both delete holds.
- **Defaults:** class-5+ "Respectful" is not preselected (spec §3.2 step 6 default).
- **Close it:** about 0.5 to 1 day in total.

### G13. The PIN is asked again in the middle of "Add a child" — DEGRADES
- **Evidence:** with the parent corner just unlocked, Children → Add a child → class → meet → "Grown-ups only.
  Locked to keep Riya out" (`20-add-3-regate-m.png`, and again on desktop at `48-add-c8-about-d.png`).
- **Close it:** carry the parent unlock across `/start/*?add=1`; do not lock on entering onboarding from
  `/parent`.
- **Estimate:** 0.25 day.

### G14. Hello and Who details — POLISH / DEGRADES
- **Second audio gate:**
  - after "Give the phone to Aarav now", Hello opens on a second gate, **"Tap to hear Asha"** (`03-hello-1-c2-m.png`);
  - then "Playing" stays disabled for 6+ s (unverified whether it ends with the clip);
  - spec §3.3: the hand-over tap is the unlock.
- **Who shows letters:** tiles show "A" / "R" / "K" letter discs, not the picture the child picked (tiger cub,
  peacock, hornbill) (`24-who-m.png`), although home shows the picture.
- **Stale title:** the document title stays "Ready for Aarav? · Taxila" on Hello.
- **Young cannot reach Me:** Young home has no entry to **Me** (route works, `08-me-c2-m.png`, but no link).
- **Close it:** about 0.5 day.

### G15. Lesson-screen layout on the phone — DEGRADES / POLISH
- **The empty tray** dominates (G2).
- **NumberPad clipped:** the class-5 pad's top row (1–4) is clipped under the question card at 360x640
  (`22-c5-t07-sent.png`).
- **Duplicate Send:** desktop shows the NumberPad and a text field with **two Send buttons** at once
  (`50-c8-t05.png`).
- **Lost context:** the question card keeps only the last question sentence, so "Kitne players honge?" loses
  "4 rows, 4 in each" (`50-c8-t01.png`).
- **No verdict mark:** no visible per-item verdict tick in the lesson. "Correct" is only in speech and captions
  (`22-c5-t07.png`), although the summary and home DidCard do show ✓.
- **Mixed languages:** English hint lines ("We jump by 2 each time.", "Which square numbers are close to 50?") sit
  under Hinglish speech, and the chrome string "Choices dikhao" appears as an answer chip.
- **Teacher label:** "Vikram · AI teacher" is detached about 160 px below the face on desktop (`50-text-c8-open-d.png`).
- **Close it:** 1 day, mostly CSS and `solveDesk` budgets, plus the verdict mark.

### G16. Garden and Sky detail — POLISH
- The plant sheet has only the skill title, the face and the plant: no line from her, no **Hear {T}**, and no
  thing-the-child-made (spec §3.8) (`08-map-c2-plant-sheet-m.png`).
- Plant and star labels are curriculum-objective text read to a 7-year-old ("Make a sensible estimate of a
  collection using a known group").
- Sky stars are drawn as 8 px dots. The 48 px hit targets exist but are invisible (`26-map-c5-m.png`).
- **Close it:** 0.5 to 1 day.

## 3. What works (keep it)

- The 8 onboarding steps:
  - scroll 0 on every step;
  - disabled-reason text beside every Continue;
  - consent "No" effects stated;
  - PIN pad with confirm;
  - allowed hours editable at sign-up (`02-onb-*`).
- **Interests and register:** the parent's interests were preselected on Hello for all three children (the old
  audit's #7 is fixed). aap was honoured for class 8 ("Aapko…", "kariye").
- **Live turn signalling:**
  - question card, "Your turn" dock, "{T} is talking / thinking";
  - Hint sheet;
  - Pause sheet with helplines;
  - End confirm.
- **After the lesson:**
  - summary with "You said … On your own / With a hint" and the next topic;
  - home "Done for today" with the DidCard (`25-home-c5-after-m.png`, `54-home-c8-d.png`).
- **Parent corner:**
  - lesson cards quote the child (class 5+);
  - the class-2 transcript sits behind a PIN re-entry;
  - Listen to this page (`/api/parent/speak` 200);
  - Controls persist;
  - export downloads `taxila-export-2026-10-03.json` (11 kB: account, consents, children) in 686 ms;
  - profile delete and account delete by hold, with clear receipts (`91-after-delete-account-m.png`).
- **Layout and public pages:** no horizontal scroll at 360 px on any page walked. Public pages
  (`/promises`, `/help`, `/privacy`, 404) are complete and English.

## 4. Measurements (production, this sandbox, 2026-10-03)

| what | n | min / median / max | method |
|---|---|---|---|
| `POST /api/lesson/turn` server round trip | 19 | 1,070 / 1,417 / 2,557 ms | in-page `fetch`, typed, classes 2 and 5 |
| `POST /api/lesson/start` | 4 | 1,761 to 1,874 ms | in-page `fetch` |
| typed send → teacher starts speaking ("is talking") | 24 | 2,397 / 3,421 / 4,926 ms | Playwright poll at 500 ms, classes 5 and 8 |
| typed send → next "Your turn" (the full TTS reply plays first, in text mode too) | 24 | 10.5 / 14.0 / 20.6 s | same |
| lesson route open → first "Your turn", text mode, desktop | 1 | 14.7 s | same |
| in-app navigation (parent tabs, child Map/Notebook/Me) | 13 | 0.8 to 1.3 s | click → networkidle + 0.8 s settle |
| parent → `/start/class?add=1` (lazy onboarding chunk): old screen stays, with no loader | 1 | > 2 s, < 6 s | screenshot at 2 s showed the old page |
| landing HTML / main JS / CSS via curl | 1 each | 0.25 / 0.38 / 0.20 s | `curl -w` |

The 14 s turn cycle is mostly her speaking. In text mode, a child who has already read the reply still waits for
the audio before the dock opens. That is a product decision to revisit (let typing open while she speaks, as
barge-in).

## 5. Order of work to make the owner's test session possible

1. **G1 `purpose` (0.5 d).** It unblocks Practice and Ask.
2. **G2 engine resolver and tray fallback (1.5 to 2 d).** It unblocks every on-screen activity and Type on choice
   items.
3. **G3 Young answers (1 to 1.5 d).** It makes classes 1–4 testable without a mic.
4. **G4 ask parity and typed-never-repair (1 to 1.5 d).** It makes the comprehension signal judgeable.
5. **G5 and G6 hint text and skip (0.75 d).**
6. **G8 the tap-and-type control (0.5 to 1 d).** It lets the owner test the text lane without URL hacks.
7. **G7 parent claim consistency (1.5 d).**
8. **G10 and G11 practice and Ask shape (2 d).**
9. **G12 to G16 polish (about 3 to 4 d).**

The blocking set (1 to 4) is about 4.5 to 5.5 engineering days. Everything listed is about 13 to 15 days.
