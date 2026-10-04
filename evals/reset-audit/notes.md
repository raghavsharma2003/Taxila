# raw notes (reset audit)
## public
- landing desktop: 3 empty phone-frame placeholders (parent view sample, progress garden/sky, ...) render blank
- landing says classes 1 to 9; "younger children grow a garden"; cartoon avatars hero
- /start/signin 404; sign-in page shows "Step 4 of 8"
- /who unauth -> onboarding step 1, not sign-in
- forgot password: "not ready yet" (help page); privacy "still being written"
- 401 /api/me console error on every public page
- desktop landing content column narrow, small type at 1440
- onboarding Step 1 offers classes 1-9, "I am a student" option
## onboarding m4 (acct reset-audit+m41791139027233)
- STEP3 "hold to continue" parent gate: duplicated "Press and hold for 2 seconds." + stray "."; gate before signup weird
- TIME PICKER REPRO: native <input type=time>; clicking the field centre focuses AM/PM segment; typing "0430PM" turned 07:00 AM into 07:00 PM; typing 0815PM in Until left 08:30 PM. No custom picker. = owner #11
- default allowed hours 07:00-20:30; lessons blocked outside -> owner may hit "closed"
- interests tiles: toddler imagery (building blocks, cooking rolling pin, trains); no gaming/coding/anime/YouTube/science/robots/art; max 3
- PIN pad bottom-right blank key
- Step 4 account: phone "optional", "Signing in with a code is coming"; sign-in page shows "Step 4 of 8"
- consent: 3+ radio groups, legalistic
- Meet: cartoon flat face, static; "Asha didi" in transcript; hear-button
- handover "Give the phone to Aarav now" / Later
## hello m4 (cid 46260b61-b7d7-4397-81a7-1422aaa12888)
- greet card: big flat cartoon bust, "Asha · AI teacher" caption + card "Asha / AI teacher" duplicated; static face, empty lower half
- laptop emoji-ish icon button top right, unclear meaning
- "Pick your picture": 6 baby animals (red panda, tiger cub, baby elephant, dolphin, hornbill, peacock) — preschool
- likes card "Your grown-up chose these. Are they right?" — infantilising (12yo had no say)
- name: Ironman refused "famous person's name" (ok but no alternatives offered); 'Babu' accepted silently
- after all of setup + hello: FIRST LESSON = "Lessons open at 7:00 pm" closed card, empty screen, only "Back home"; 409 /api/lesson/start in console. Default hours 07:00-20:30; at night child's first run is a dead end
- 422 /api/tutors/name visible in console for refused name (expected but logged as error)
- me.language_pref may be english although parent picked Hindi-English mix (CHECK)
- time input: at tablet/desktop typing after click works (16:30/20:15); at 390 phone the field is 156px wide and a centre tap focuses AM/PM so typed time goes wrong. Need check of clock-icon popup & date (days off) in parent controls
- class 4 = "young" band: lesson dock has NO keyboard at all (Hear again / Talk / Help). Voice-only for class 4 child.
- voice: "cascade: transcription call unavailable, falling back to push-to-talk" -> "Tap the mic to talk, then tap Done. OK" = click-to-speak (owner #10)
- lesson opener class 4 maths ch01: "Hello Aarav! I'm Babu... Today we'll explore faces, edges, and corners of 3D shapes. Ready to begin?" Teacher name Babu shown but face is Asha (female) - naming ok
- lesson screen: cartoon face takes 45% of screen; question card "Ready to begin?"; coachmark "Tap the mic to talk, then tap Done" with OK; laptop icon on face
## young lesson voice (y-m-*)
- tapping Talk with fake mic (tone, no words) -> ASR hallucinated "keeda" -> teacher: "Aarav, 'keeda' means insect. Did you want to talk about an insect, or return to 3D shapes?" — acts on a word the child never said; derails lesson on turn 1 (owner #5/#2). No confidence gate / "I didn't catch that".
- turn latency to "thinking" ~1s, reply ~8s after Done
- push-to-talk: Listening... tap Done; mic must be tapped twice per turn
- Help button not visible while she speaks; help menu empty when tapped
- Pause sheet: "End lesson" one tap, no confirmation, no wrap-up (owner #7)
- ··· more menu opens the same pause sheet; CC button tiny icon
- teacher addressedAs "Babu didi" (custom name + didi suffix nonsense); teacher payload has characterName Asha
- API leaks internal move.shape prompt text to client ("kit contexts: ludo dice, carrom-striker box, tiffin box...") — and "ludo dice" is the hook kit context for class 4 ch01 => the owner's "how many sides on a dice"
- question card shows only "Shall we begin?" huge empty card; a 9-yr-old has "Hear" buttons x2 (Hear, Hear again)
- the background scene (courtyard at dusk, blurred) + flat vector face; face static (no lip motion visible in shots)
