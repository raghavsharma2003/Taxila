# Taxila UX audit: what exists in production (2026-10-03)

Blunt audit of the live product at `taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`. Every claim
below was observed in a real walk-through, not reasoned from the spec. Screenshots are in `shots/` and are
named `<flow>-<step>-<m|d>.png` (`m` = 360x640 phone, DPR 2, touch; `d` = 1280x800 laptop).

## 0. Method, scope and caveats

- **Walked:** landing → P0-P8 onboarding (language, meet, taste, hold gate, account, trust, consent, child
  profile, PIN + controls, handover) → child first run (hello, disclosure, interests) → live lesson (voice
  lane, then typed turns, every chip, the more menu, Phir se, pause, end, summary) → child home → practice,
  doubt, map, notes, me, tutor picker → `/who` with two children → add-a-child behind the PIN → a class-8
  lesson on desktop → a typed lesson with the network cut → every Parent corner route (home, evidence sheet,
  syllabus, lessons, lesson card, teaching, PTM, more, controls, data, help, PIN, family, plan, saved) →
  public trust, help, privacy, 404, sign-in.
- **Accounts:** one guardian (`audit+1791002756256@taxila.test`), Riya (Class 5, CBSE, Hinglish, aap) and
  Kabir (Class 8, CBSE). Both children were deleted at the end (`DELETE /api/children` → 200 each).
  **The guardian row could not be deleted: there is no account-deletion endpoint or screen** (the Data page
  says "delete the whole account" is "Coming next"). It is an empty account with consent rows and no
  children. Flagging it, not working around it.
- **Voice:** the cascade lane did connect from the sandbox. Her TTS played and the face lip-moved. The
  streaming transcription channel did not open (`cascade: transcription call unavailable, falling back to
  push-to-talk`), so the mic became a tap-to-talk toggle fed by Chromium's fake device. **That fallback is
  invisible to the child**: nothing on screen says anything changed.
- **Face tier:** headless Chromium with SwiftShader. The lesson rendered the 2D SVG stage (`src/stage/`), and
  the code shows the lesson always uses `TeacherStage`. The 3D `TutorFace` is mounted only in the picker and
  the dev pages, so a real GPU would show the same lesson face. What I could not judge: lip-sync timing by ear,
  and motion smoothness on a real budget phone.
- **Not covered:** the Young band (Classes 1-4: Bagiya, picture hello, Kya tum X ho?). The brief asked for
  Classes 5 and 8. The Young code paths exist and carry the same copy problems.
- **Severity:** **S0** breaks the core loop or parent trust. Fix before anyone else sees it. **S1** a major
  defect in signalling or flow. **S2** quality, consistency or polish that still matters.

## 1. Verdict in one paragraph

The product has a sound skeleton and the trust copy for parents is unusually honest. **The live lesson,
which is the product, does not tell the child what is going on.** Whose turn it is, what the question was,
whether the answer was right, what the big box on screen is for, and whether anything has broken are all
unclear or missing. The teacher is three different cartoon characters, with two genders and two names,
across five screens. Half the lesson screen is an empty beige rectangle or a "coming soon" placeholder. The
child-facing chrome is Hinglish, Devanagari appears in parent chrome, and both go against the English-only
directive. The child home has no clear next step because two production APIs return 404. A failed turn
fails silently. None of this is visual polish. These are signalling failures, and polish will not fix them.

## 2. Top 25 problems, ranked

| # | Sev | Problem | Evidence (shots/) |
|---|---|---|---|
| 1 | S0 | **The question disappears when it is the child's turn.** The caption is a karaoke window that shows only the last spoken fragment. When the turn passes to the child, the line on screen is the tail of her utterance ("Baad mein Bittu ko sikhaogi.", "End mein Bittu ko sikhaogi.") rather than the question ("tum chhota number chunogi ya bada?", "Ab batao, bada kaun hai?"). The question is on neither the board nor the screen. A child who missed the audio has nothing to answer. | `04-lesson-voice-8-state-m`, `09-doubt-lesson+20s-c5-m` |
| 2 | S0 | **Turn-taking is signalled only by the mic's colour.** White means she is speaking, marigold glow means your turn, blue means listening. Next to it sits an unlabelled 20 px glyph (wave, hand or ear). The words "Tumhari baari" / "Bol rahe hain" exist, but on the phone they are screen-reader-only (`.tx-sr`). On desktop, "Bol rahe hain" appears in 12 px grey next to the mic. The face does not visibly listen (no lean, nod or open attentive look), and "thinking" is a chalk-to-chin pose in a 95 px picture-in-picture. A 7-year-old cannot read this state machine. | `04-lesson-voice-4-tap+6s-m` vs `+16s-m`, `04-lesson-voice-7-after-release+8s-m`, `17-c8-lesson-2-open+8s-d` |
| 3 | S0 | **A failed turn fails silently.** With the network cut, the typed answer shows as a dashed bubble and then nothing happens: no error, no retry, no "I can't hear you, check the internet". After 20 s the UI quietly drops back to "your turn", and the answer is lost. Nothing recovers it after reconnecting either. The transcription-channel failure in the voice lane is just as invisible. | `19-offline-turn+2s-m`, `+20s-m`, `19-offline-recovered-m` |
| 4 | S0 | **The teacher has no stable identity.** Landing and onboarding introduce a woman ("Meet her", audio "Asha didi") in one drawing style. The child's first screen and every lesson show a man, "Arjun · AI teacher", in a different style. The tutor picker shows a third face (glasses, hair buns) also labelled "Arjun अर्जुन", with nothing else to pick. The Parent corner still says "How she teaches Riya" and "Talk to her". This breaks the one thing the owner asked for, which is a visual bond with *the* teacher. | `02-onb-2-meet-m`, `03-hello-1-m`, `13-teacher-picker-c5-m`, `21-parent-home-m` |
| 5 | S0 | **The module canvas is a dead zone.** In the Teach phase about 45% of the phone is a beige rectangle that stays empty, or shows "✨ Yeh activity jald aa rahi hai. Teacher iske bina aage chalenge." ("this activity is coming soon"). That is a developer placeholder shown to a child, and the teacher's picture-in-picture covers part of it. When something does mount, it is a board card with the PiP sitting on top of the text. On desktop the whole right half is this box. | `04-lesson-voice-8-state-m`, `04-lesson-turn1-sent+9s-m`, `04-lesson-chip-aatahai-m`, `17-c8-lesson-t3+16s-d` |
| 6 | S0 | **Board, voice and screen contradict each other.** The ledge shows "Write 'one lakh seven thousand forty' in numerals with commas" while she asks for 72,000 in words. She says "60 mein se choice tap karo" ("tap one of the choices") when no choices are on screen. The first ledge chip is the curriculum objective ("Read and write 5- and 6-digit numbers in numerals and words"), which is syllabus text and not something to say to a child. Class 8 has the same pattern: the board shows 1+3+…+19 while she asks for 6×6. | `04-lesson-chip-hint+14s-m`, `04-lesson-chip-aatahai-m`, `17-c8-lesson-t3+16s-d` |
| 7 | S1 | **Parent and child choices are ignored on screen.** The parent left "She calls Riya: aap" (the default for Class 5+) and Riya tapped "aap" on hello. Her first words were "main Arjun, tumhara AI teacher… Tumhe space mein kya pasand hai?" Class 8 (aap) got "tumhara… Tumhe". The chips mix registers ("Thoda dheere boliye" next to "bolo"). Interests the parent picked (Cricket, Space) were replaced on hello by a random set. | `03-hello-1b-aap-picked-m`, `04-lesson-voice-4-tap+16s-m`, `29-parent-controls-m`, `17-c8-lesson-2-open+18s-d` |
| 8 | S1 | **The UI is not in English (directive violation).** Child chrome is Hinglish: Ghar, Ruko, Bolo, Bas, Bhejo, Phir se, Hint/Kyun?/Aata hai, Kisi aur tarah samjhao, Chhoo kar shuru karo, Shuru karein, Ho gaya, Aaj humne banaya, Agla, Ek sawaal poochho, Abhyaas, Mera map, Meri notes, Aasmaan, Main, Tumhare teacher, Chalo shuru karein, Paath band karein? Nahi/Haan, Aage chalein, Band karein, Ghar ke bade se baat karo, Yahan likho…, Kuch aur. Onboarding: Abhi / Baad mein. Parent: IS HAFTE, Suno, GHAR PAR EK KAAM, AUR DEKHEIN, Abhyaas mein, Abhi nahi, Ho gaya / Is hafte nahi, Kaise pata?. Devanagari: landing state words (अभी नहीं, अभ्यास में, आ गया, पक्का), हिन्दी language tiles in four places, "Arjun अर्जुन", syllabus "Hindi · वीणा". `src/child/copy.ts` and `Hello.tsx` carry full Devanagari variants for a "hindi" UI language. | nearly every child shot, `02-onb-10-handover-m`, `21-parent-home-m`, `01-landing-d-full` |
| 9 | S1 | **The child home has no next step, and two APIs 404 in production.** `GET /api/child/plan` and `GET /api/child/map` return 404. So after a lesson the home shows "Agla: …" as a quiet outline row instead of the big marigold CTA. "Mera map" opens an empty navy rectangle, and the home has a second empty navy box under the teacher. A first-time Class 8 child gets "Aage padhein" ("continue reading") although he has never read anything. | `06-end-3-after-done-m`, `07-home-c5-d`, `10-map-c5-m`, `16-c8-first-m` |
| 10 | S1 | **The child is asked to start twice.** Hello ends on "Shuru karein". The lesson then shows a second gate, "Chhoo kar shuru karo" ("touch to start"), over a silent face. Doubt is worse: the child types a question and taps Bhejo ("send"), the question vanishes, and the same "touch to start" gate appears with no sign that the question was received. `?mode=text` shows the gate too, although text mode needs no audio unlock. | `03-hello-3b-interest-picked-m` → `04-lesson-voice-3-15s-m`, `09-doubt-sent+1s-c5-m` |
| 11 | S1 | **Onboarding keeps the previous step's scroll position.** After "Continue" on consent, the child-profile step opens scrolled to the bottom (the "Likes" chips), and the name field and title are off screen. The trust step opens scrolled too. The parent loses their place at the most form-heavy step. | `02-onb-8-child-as-landed-m`, `02-onb-6b-trust-as-landed-m` |
| 12 | S1 | **The lesson summary shows the child nothing they did.** "Aaj humne banaya" ("today we made") is a box of clipped board strings (objective text cut off at the right edge), with no "you got 24,360 right", no next time, and no warmth. "Ho gaya" uses a door icon, which reads as "exit". A fractions doubt is summarised as "Numbers in thousands and beyond". | `06-end-2-summary+10s-m`, `06-end-summary-c8-d`, `09-doubt-end-c5-m` |
| 13 | S1 | **Answers get no feedback signal.** A correct answer (24,360; "seventy two thousand") gets no tick, no face change and no sound. She just moves on with a restatement. A wrong one (36 for "5 ka square") is not corrected. Asked "what comes after 25?", Kabir answered "25" and she said "Bilkul". The Parent corner then shows that skill as "Right · On their own". Grading is a model issue, but the UI has no feedback channel to carry a verdict even when one exists. | `04-lesson-turn2+5s-m`, `08-practice-c8-answered-m`, `17-c8-lesson-t2+16s-d`, `22-parent-evidence-sheet-m` |
| 14 | S1 | **Pause looks like a crisis screen.** Tapping pause (or pressing Escape, which also opens it) brings up a sheet with no "Paused" title. It leads with "Ghar ke bade se baat karo" ("talk to a grown-up at home") and two big helpline tiles, Childline 1098 and Tele-MANAS 14416, with "Aage chalein / Band karein" below. A child who only wanted a sip of water is told to call a helpline. The helplines belong one tap away, not as the headline of pause. | `05-pause-sheet-m`, `05-pause-sheet-d` |
| 15 | S1 | **The teacher face is flat clip-art.** It is a 2D SVG with dot eyes, a line mouth, an oval head on a tube neck and a chalk stub. It has three visible states (smile with teeth while talking, chalk-to-chin while thinking, neutral). It shows no listening, no surprise, no delight and no concern. It is far from the owner's "highly detailed, expressive, human-like" bar and the avatar spec's S2 "feature-animation stylised" target. The better 3D head (`src/avatar/three/`) is not in the lesson. | `04-lesson-voice-4-tap+6s-m`, `04-lesson-turn1-sent+0.5s-m`, `17-c8-lesson-2-open+8s-d` |
| 16 | S1 | **First run says nothing.** Hello renders the teacher with a silent mouth. There is no voice and no question text. Step 1 is the child's name over two stacked, left-aligned pills, "tum" and "aap", with no question. Step 2 is two lines ("Computer teacher, insaan nahi" / "Ghar ke bade dekh sakte hain") and an unlabelled arrow. Step 3 is four unexplained tiles. If the parent chose "Later" (Kabir), the child never sees hello or the AI disclosure screen at all and lands on home. | `03-hello-1-m`, `03-hello-2-disclosure-m`, `03-hello-3-interests-m`, `16-c8-first-m` |
| 17 | S1 | **Icon-only controls with unclear meaning.** The lesson bar has a paper plane (send), an ear with an arrow (Phir se), a hand (raise hand?) and "⋯". Hello's next button has an empty accessible name (`button ""`). On desktop, the text field shrinks to 92 px ("Yahan lik") once the mic glows. Settings checkboxes are announced as "on". The hold button reads ". Press and hold for 1.5 seconds." | `04-lesson-voice-4-tap+16s-m`, `17-c8-lesson-t3+16s-d`, `12-me-c5-m` |
| 18 | S1 | **Raw server errors are shown to parents.** Submitting the empty form shows "missing field: email". A short password shows "password must be at least 8 characters". Both are lowercase API strings at the bottom of the form, not attached to their field and not announced next to it. The first error does not even name the field the parent is looking at (name was empty too). | `02-onb-5b-account-empty-submit-m`, `02-onb-5c-account-shortpw-m` |
| 19 | S1 | **Sticky footers hide content.** On Safe settings the disabled "Looks right" bar covers the PIN pad's last row (0, Delete, Next). The parent has to scroll inside a keypad to find "Next", which is a second next-like button next to "Looks right". "What she says (text)" is clipped under the footer on Meet. In Parent controls, a floating "Save" plus the bottom tab bar take about 120 px of a 640 px screen. | `02-onb-9-controls-as-landed-m`, `02-onb-2-meet-m`, `29-parent-controls-m` |
| 20 | S1 | **The Parent home overclaims and speaks like a system.** After one 5-minute lesson, the headline is "Still tricky: Read and write 5- and 6-digit numbers…", although the only recorded check is "Right · On their own". The home task reads "Today's recorded exchange focused on comparing 3/4 and 2/3". "YOUR TURN" (the child's turn colour and word) is reused as a parent label. "Last updated 5:00 am" while the lesson ended minutes earlier (looks like UTC). Five of the twelve entries under More lead to "Not available yet": teaching, PTM, family, saved lessons, plan. | `21-parent-home-m`, `21-parent-home-kabir-m`, `22-parent-evidence-sheet-m`, `26/27/33/34/35-parent-*-m` |
| 21 | S2 | **Child "Me" is a developer panel.** Its title is "Main" ("me"). It has ten jargon checkboxes (Likha hua, Awaaz ke signal, Chup mode, Kam halchal, Bagiya / Aasmaan, Ulta layout, Bade bachchon wala look, Keyboard shortcuts…), then "Rang: system / light / dark" in raw English, then a bulleted list of what parents can see written in parent-speak ("Skills aur unke saboot"). | `12-me-c5-m` |
| 22 | S2 | **Captions flicker and fragment.** The whole reply flashes, then restarts as karaoke chunks: "9,", "Bilkul,", "square numbers ko 1,", "ko 360 kaise banaya?". The child reads shards. The screen-reader `spoken` live region stays on the previous turn's line. | `17-c8-lesson-t1+6s-d`, `17-c8-lesson-t2+1.5s-d`, `04-lesson-turn3+11s-m` |
| 23 | S2 | **Desktop is a stretched phone.** Lesson: a giant head on white with the most important text (the caption) at about 15 px under it, and half the width an empty box. Home: a 2-column grid with the CTA list on the left, a cropped classroom on the right and an empty navy card. Tutor picker: one card and a button in a sea of cream. | `17-c8-lesson-2-open+8s-d`, `07-home-c5-d`, `13-teacher-picker-c5-d` |
| 24 | S2 | **The onboarding sequence contradicts itself.** "Our promises, before you give us anything" comes *after* account creation. Language is asked twice (P0, and "She should speak" on the child step). "Hear more" plays the same 10 s clip again. The hold gate says "1.5 seconds" in its label and "about 2 seconds" below it. The counter shows 8 steps although the add-child edge flow skips some. "Abhi" uses a raised-palm icon, which reads as "stop". | `02-onb-6-trust-m`, `02-onb-8-child-m`, `02-onb-3-taste-m`, `02-onb-4b-holding-m`, `02-onb-10-handover-m` |
| 25 | S2 | **The landing does not sell or show the product.** On a 360 phone the primary CTA is at y = 770, below the fold, under a 300 px clip-art bust and a caption, "Her face here is a drawing". The three "lesson in pictures" panels are placeholder-grade flat shapes. There is no real screenshot of a lesson. The first audio is behind three tiles, one of them in Devanagari. | `01-landing-m-fold`, `01-landing-d-full` |

## 3. The turn-taking state machine: what the child can see today

The lesson has seven states that matter. This is what each one shows a sighted child on a phone:

| State | Mic button | Status glyph (right of mic) | Status word | Face | Caption | Verdict |
|---|---|---|---|---|---|---|
| Not started | hidden | none | none | neutral, silent | "Chhoo kar shuru karo" tile | a second start gate |
| She is speaking | white ring | small wave glyph | sr-only "Bol rahe hain" (desktop: 12 px grey) | mouth opens with teeth | karaoke fragment | weak |
| Your turn | marigold fill + glow | raised hand | sr-only "Tumhari baari" | neutral | **last fragment of her line, often not the question** | **fails** (problem 1) |
| Listening (tap-to-talk) | solid blue, label "Bas" | ear, underlined | none | no change | unchanged | weak: no level meter, no "I'm listening" |
| Thinking / waiting on server | white | "⋯" | none | chalk to chin (PiP only) | the child's own words in a dashed bubble | readable to adults only |
| Error / offline / ASR down | unchanged | unchanged | none | unchanged | the dashed bubble stays | **absent** (problem 3) |
| Paused | disabled | none | none | dimmed | unchanged | sheet leads with helplines (problem 14) |

What a 6-9-year-old needs is one unmistakable signal per state, carried redundantly by face, colour, shape,
a word and sound:

- **Speaking:** she looks at the child and talks.
- **Your turn:** she stops, looks at the child expectantly, a big "Your turn" appears, and the question stays
  pinned.
- **Listening:** she leans in and nods, and a live sound meter moves.
- **Thinking:** she looks up and away and a "thinking" bubble appears.
- **Trouble:** she looks apologetic and says plainly "I didn't hear that. Tap to try again".

For 10-15-year-olds the same signals can be quieter, but they cannot be hidden.

## 4. Screen by screen

Each screen covers: the user's goal, what the screen signals, what it fails to signal, hierarchy, visual
quality, consistency, copy, accessibility, age fit and (where relevant) parent trust.

### 4.1 Landing `/`. Shots: `01-landing-*`
- **Goal (parent):** understand what this is and whether to trust it, then start.
- **Signals:** honest positioning ("a computer program, and she tells your child so"), evidence-first
  reporting (the "Kaise pata?" example card is the best thing on the page), no sales calls, no EMI.
- **Fails to signal:** what a lesson actually looks and sounds like. There is no product screenshot, and the
  three "pictures" are crude shapes. The price ("we have not set a price yet") and the pilot status are
  honest but sit as dead text blocks.
- **Hierarchy:** on the phone the hero bust takes 300 px and the CTA is below the fold (y = 770). Desktop is
  fine.
- **Visual quality:** generic flat clip-art, low effort, nothing aspirational. The teacher on the landing is
  not the teacher in the lesson (problem 4).
- **Copy:** clear, but "Her face here is a drawing" undercuts the product. Devanagari state words and the
  हिन्दी tile go against the directive.
- **Parent trust:** strong on promises, weak on proof. There is no picture of the parent report as it
  actually looks.

### 4.2 Onboarding P0-P8 `/start/*`. Shots: `02-onb-*`
- **Goal:** get my child set up quickly and safely.
- **P0 language:** clear tiles that play audio on tap. "English / English" repeats itself. The disabled
  Continue gives no reason why.
- **P1 meet:** "Meet her" never names her. The bust does not animate with her voice. "Play again" appears
  even when the parent never heard the first play on this screen. The transcript is clipped under the
  footer.
- **P1b taste:** a dead end that replays the same clip.
- **Hold gate:** a good idea (keeps a young child out). The fill animation is legible. The copy is
  inconsistent (1.5 s vs 2 s), and holding gives no haptic or sound.
- **Account:** long for a 360 phone (906 px). Raw errors (problem 18). The "no calls" icon looks like a
  feather.
- **Trust:** placed after the account, so its title is false. Opens scrolled.
- **Consent:** the best-built screen. The rows are unbundled, there is a listen button per row, and nothing
  is preselected. The "What is kept" disclosure looks like a heading rather than a control. The CTA stays
  disabled with a paragraph of explanation at the very bottom where nobody reads it.
- **Child:** a 1,665 px form that opens scrolled to the bottom (problem 11). The language question is
  repeated. "She should speak" and "She calls your child" are gendered while the actual teacher is Arjun.
  The class tiles are good. The interests the parent picks here are later ignored.
- **Controls:** PIN entry is hidden under the footer (problem 19). Two "next" actions compete. The
  "Looks right" label is vague. Good: "never shows your child a countdown".
- **Handover:** the "Abhi / Baad mein" primary labels (Hinglish) with tiny English subtitles. A stop-hand
  icon on "Now". "Later" skips the first-run disclosure (problem 16).
- **Consistency:** the step counter, the back button and the shield link are consistent. The page `<title>`
  is stale ("Who is learning?" shows on `/start/child?add=1`).

### 4.3 Child first run `/c/:cid/hello`. Shots: `03-hello-*`
- **Goal (child):** meet my teacher.
- **Signals:** almost nothing. The teacher is silent and no question is written anywhere. The disclosure is
  two lines of text.
- **Fails:** why the child should tap tum or aap. The arrow has no label. The interests have no prompt such
  as "What do you like?". There is no audio at all.
- **Visual:** the tum/aap pills are left-aligned, stacked and unequal in width, which looks broken. The
  marigold arrow button is the only colour on the screen.
- **Age fit:** for 6-9 this is unusable without a reading adult. For 10-15 it is cold.

### 4.4 Live lesson `/c/:cid/lesson/:lid`. Shots: `04-*`, `05-*`, `06-*`, `17-*`, `18-*`, `19-*`
- **Goal (child):** understand, answer and know how I'm doing.
- **Signals well:** phase changes the layout (teacher big → PiP with board). The child's own typed words echo
  as a dashed bubble. The marigold glow on the mic for "your turn" is a decent seed.
- **Fails:** problems 1, 2, 3, 5, 6, 13, 14, 17 and 22. Also:
  - There is no progress signal: nothing like "3 of 5", "almost done" or a time cue (no countdown is fine,
    but some sense of arc is needed).
  - The phase word appears as jargon in the title ("· shuru", "· seekhna", "· abhyaas", "· doubt").
  - The title truncates to "Numbers in t…" on the phone.
  - "Arjun · AI teacher" is a pill that looks tappable and is not.
  - Leaked stage directions in her speech: "Whiteboard: 45,000 ko…".
- **Hierarchy:** on the phone the face takes 300 px while she talks, then shrinks to a 95 px PiP that covers
  the board. The most important information, which is the question and whose turn it is, has the least
  space.
- **Chips:** Hint / Kyun? / Aata hai are good ideas. But "Kyun?" ("why?") did not explain why; she jumped to
  a practice item. "Aata hai" ("I know it") moved to practice with no acknowledgement. The more menu floats
  over the board with no backdrop.
- **Phir se ("again"):** it works and replays the line in chunks, but it is an unlabelled ear icon, and a
  second "Phir se" target sits in the ledge.
- **Text mode:** the marigold frame around the input is the clearest "your turn" signal in the product.
  Reuse that idea everywhere.
- **End:** "Paath band karein? Nahi / Haan" ("end the lesson? no / yes") is fine. The summary is weak
  (problem 12). Where the end leads is inconsistent: Riya returned to her home, while Kabir (pause → stop)
  landed on `/who`.
- **Age fit:** the copy and density suit a 12-year-old reader, not a 7-year-old listener. There is no sound
  design for turn changes.

### 4.5 Child home `/c/:cid`. Shots: `06-end-3-after-done-m`, `07-*`, `16-*`
- **Goal:** start today's thing.
- **Signals:** a list of five rows and the teacher picture.
- **Fails:**
  - After the first lesson there is no primary action ("Agla: …" because the plan API returns 404).
  - No greeting from the teacher, no streak or garden or sky (the map API returns 404, so the box is empty
    navy).
  - Nothing says what was done today.
- **Hierarchy:** the teacher is at the bottom, below the fold, under the menu. That is backwards for a
  product built on a relationship.
- **Icons:** the generic outline icons (question mark, plus, map, book) carry no personality. The top-left
  smiley links to "Me" and the top-right door to the parent corner. Neither is labelled.

### 4.6 Practice, doubt, map, notes, me, picker. Shots: `08-*` to `13-*`
- **Practice:** the same lesson shell, including a fresh "Namaste Kabir! Aaj hum…" intro every time.
  Practice does not feel like a quick drill. No count, no feedback (problem 13).
- **Doubt:** the typed question disappears behind the start gate (problem 10). The resulting lesson is
  titled with an unrelated chapter. The caption ends on a non-question (problem 1).
- **Map (Aasmaan, "sky"):** an empty navy rectangle and a "☰" tab. A 404 behind it and no empty state.
- **Notes:** a raw list of board strings, objective text included. No visual notebook and nothing a child
  would reopen.
- **Me:** a developer panel (problem 21).
- **Tutor picker:** a third face with one option and no choice. "Arjun अर्जुन" puts Devanagari in chrome. A
  teal "Chalo shuru karein" button ("let's start") in a colour used nowhere else.

### 4.7 Who picker and add-a-child. Shots: `14-*`, `15-*`
- **Signals:** a clear two-tap confirm ("Continue as Kabir? No / Yes"). The parent door is small and dull,
  as intended.
- **Fails:** the profiles are identical purple letter-circles with no picture, so a 6-year-old cannot
  recognise "theirs". The "Add a child (parent)" link sits at the same level as the profiles.
- **PIN gate:** clear. The wrong-PIN message is fine. "Forgot the PIN?" is well placed.

### 4.8 Parent corner `/parent/*`. Shots: `20-*` to `35-*`
- **Goal:** know in 10 seconds how my child is doing and what to do.
- **Signals well:**
  - The evidence sheet ("Kaise pata?": the check, the date, Right · On their own, the child's own words) is
    genuinely differentiated and trustworthy.
  - The lesson card has a plain summary, a home task, and the "word-for-word only on request" policy.
  - Data deletion is protected by a password plus a hold.
  - The bottom nav on the phone and the side nav on desktop are standard and fine.
- **Fails:**
  - Problem 20: overclaiming "Still tricky", system voice, a reused "YOUR TURN", the timestamp, and five
    dead-end pages.
  - Hinglish section labels with English subtitles ("IS HAFTE · THIS WEEK") double the reading load.
  - The skill names are syllabus objectives, not parent language ("Compute squares and recognise square
    numbers").
  - "This week: 2 lessons, 6 minutes" counts a 1-minute doubt as a lesson, and both entries are titled
    "Numbers in thousands and beyond".
  - The syllabus page has a "0 of 74 topics Pakka" ("secure") stat with no visual map.
  - The full page reloads re-lock the corner (fine), but there is no indication that it re-locked on
    purpose.
- **Parent trust:** strongest part of the product, undermined by verdicts that contradict their own
  evidence one tap below.

### 4.9 Public pages. Shots: `40-*` to `44-*`
- **Trust:** good copy, long scroll.
- **Help:** bare but correct. The helplines are tappable `tel:` links.
- **Privacy:** honest placeholder ("being written").
- **404:** fine.
- **Sign-in when already signed in:** fine.

## 5. Cross-cutting findings

**Identity and illustration.** There are three teacher renderers:
- `src/ui/TeacherFace.tsx` (onboarding, female),
- `src/stage/characters.ts` via `TeacherStage` (lesson and home, male "Arjun"),
- `src/avatar/Plate2D` / `TutorFace` (picker).

These need to become one character system with one source of truth for name, gender, pronoun and look,
used everywhere from landing to the parent report. Today there is no illustration system at all: no
backgrounds, no empty states, no badges, no spot illustrations, no subject imagery. Every empty state is a
blank rectangle.

**Copy (English-only).** Every string listed in problem 8 needs an English replacement. The Hindi/Hinglish
selection must change only what *she says* (and therefore the captions), never the labels. Delete the
Devanagari copy tables from `src/child/copy.ts` and `Hello.tsx` once the English copy exists. The "Kaise
pata?" brand phrase is the one candidate to keep as a signature, but it needs an English label first ("How
do we know?").

**Accessibility.**
- Unlabelled buttons (hello next, the status glyphs).
- Checkboxes named "on".
- A stale live region (`spoken`).
- Screen-reader-only turn state that sighted children never see.
- Caption text of about 15 px on desktop.
- No sound cues for turn changes.
- The hold gate has no non-hold alternative.
- Colour carries the turn state almost alone (white/marigold/blue). The design-token work in `context/`
  measured the colour-blind collision risk, but the shipped UI still depends on hue plus a glyph too small to
  read.

**Ages 6-9 vs 10-15.** Both bands get the same text-dense lesson shell. For 6-9 the screen needs:
- far fewer words,
- spoken prompts for everything,
- picture-led choices instead of typing (a 7-year-old cannot type "seventy two thousand"),
- big unmistakable turn signals,
- celebration on success.

For 10-15 it needs:
- the question pinned and readable,
- a proper workspace for the canvas,
- quieter but explicit status,
- a sense of progress.

The Class 8 "plain room" (white background) is the only band difference I saw, and it makes the screen look
unfinished rather than older.

**Consistency.**
- Teal appears only on the picker CTA.
- Navy appears only in the empty map box.
- Marigold means "your turn" in the lesson, the primary action on home, the "Ho gaya" button and "YOUR
  TURN" for the parent. One colour carries four meanings.
- Corner radii and border weights differ between `tx-*` (child) and the onboarding/parent components. These
  are two design systems that do not share tokens visually.

**Production health seen through the UI.**
- `/api/child/plan` and `/api/child/map` return 404.
- The transcription channel fails without notice.
- `tts-stream` requests abort (`ERR_ABORTED`) on most turns. This is harmless or a sign of barge-in, and it
  was not investigated further here.

## 6. What the redesign must deliver (derived from the above, in priority order)

1. **One turn-state system,** carried redundantly by face, a big word, colour, shape and sound, for all
   seven states in section 3, including trouble. The question stays pinned on screen until it is answered.
2. **One teacher.** A single character bible (name, pronoun, look, voice), rendered as an expressive face
   with distinct speaking, listening, thinking, happy, encouraging, concerned and surprised states, and the
   same face on the landing, onboarding, home, lesson, summary and parent report.
3. **A lesson layout without dead zones.** No placeholder is ever shown to a child. The canvas exists only
   when there is content; otherwise the teacher plus a pinned question card fill the screen. The board, the
   voice and on-screen choices come from the same move.
4. **Feedback moments:** right (celebrate), wrong (gentle, specific), "I know it" (acknowledge), hint
   (visible step).
5. **An English UI with a full copy pass.** Child copy is written for listening, with very few words for
   ages 6-9.
6. **A child home with one obvious next action,** the teacher at the top greeting the child, a real progress
   visual (garden or sky) and illustrated empty states.
7. **Real error and recovery screens:** offline, mic denied, ASR down → typing, server slow, resumed.
8. **Parent home verdicts that never contradict their own evidence,** in parent language, with every dead
   entry hidden until it exists.
9. **An onboarding fix list:** scroll reset, trust before account, language asked once, field-level
   errors, footers that never cover inputs.
10. **An illustration and icon system** (backgrounds, empty states, subject art, badges, the who-picker
    avatars), produced in bulk via the owner's Codex image pipeline. English only, no text inside images.

## 7. Reproduction notes

- The driver was a long-lived Playwright session (Chromium 1194 via the sandbox egress proxy, with the
  sandbox CA trusted by SPKI pin), with `--use-fake-device-for-media-stream`.
- A route change inside the Parent corner was done with `history.pushState` because a full reload re-locks
  the corner by design.
- Times in shot names (`+6s`) are measured from the action that triggered them.
- Lesson content is model-generated, so a rerun will differ in wording, not in structure.
