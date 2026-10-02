# Call-screen teardown: the best AI tutor and voice-call screens, and the Taxila call-screen layout

**Date:** 2026-10-02 · **Scope:** the live-lesson screen while the teacher is talking (web + Android, portrait budget phones, landscape tablets and laptops, shared family phones, patchy data, Hindi / Hinglish / English).
**Question:** What do Duolingo Video Call (Lily, Falstaff), Speak, YoLearn, Khanmigo, Synthesis Tutor, ChatGPT Voice, Gemini Live and Praktika put on screen during a call? What makes a call screen feel alive (character reactions, captions, visual anchors)? What layout should Taxila use for a portrait phone and for a landscape tablet or laptop?
**Builds on (read first, not repeated):** `learning-science.md` (choice offers, no reward economies, teach-back, place by level, parent sees all), `harvest/gurukul.md` §6 (four states, one "your turn" highlight, honest waits, motion and contrast gates), `design/kids-ux-ages.md` (bands B1-B4, tokens, S2/S3), `design/lesson-arc.md` §3-§8 (regions, layout modes L1-L5, the floor model), `design/visual-identity.md` (chalkboard, tokens, character motion), `avatar/audio-to-face-ml.md` §6 (Director move → face program), `voice/voices-hindi.md` (Voice Live word timestamps).

**Evidence tags:** **[V]** read this session in the primary source (product page, help page, blog, store screenshot, or paper abstract) · **[S]** secondary (press, sibling doc citing a source) · **[M]** prior knowledge or metadata only · **[X]** computed this session by `ui_teardown_reviews.py` (crude regex over Play reviews; counts are qualitative) · **[I]** design inference by this document; each [I] that matters has a measurement in §11.

**Method and limits.** The shared WebSearch budget was spent before this task began, so there were no searches. Evidence comes from: (a) about 30 direct fetches of primary pages (Duolingo blog ×7, Rive's Lily case study, Speak ×3, Praktika ×2, Synthesis, YoLearn ×3, Khan Academy, Google blog ×4, Google help, TechCrunch ×2, Sesame); (b) **89 Google Play listing screenshots viewed** across 10 apps, plus 3 Duolingo blog images of the Video Call screens (manifest: `ui-teardown-screens-2026-10-02.json`); (c) Play reviews pulled with `ui_teardown_reviews.py` (output `ui-teardown-reviews-2026-10-02.json`); (d) Europe PMC, Crossref and Semantic Scholar for three evidence items. **No app was walked hands-on.** Store screenshots are marketing renders and may be idealised. Speak's live-tutor screen and Khanmigo's tutor panel have no public screenshots. Duolingo's Play screenshots do not show Video Call, so the blog images stand in. Review mentions of call-screen themes are rare (Praktika avatar/face 30 of 1,500; Duolingo Video Call 12 of 6,000), so they are quotes, not rates.

---

## 0. The answer in fourteen lines

1. **Every strong call screen has the same skeleton: one big living thing, one caption line, one or two controls.** Lily's face fills the screen and the only control is a hang-up [V]. Falstaff adds a one-line caption pill and a CC toggle [V]. Gemini Live shows the camera feed, the user's words as one quoted pill, and five round buttons [V]. Nobody shows paragraphs during the call. Taxila needs a face *and* content at once, so its skeleton is a split stage with a dp budget that adds up (§5, §6).
2. **Aliveness lives between sentences, not during them.** Lily tilts her head and ponders while the AI computes, "making the wait feel intentional rather than mechanical". She combines 8 head × 8 body idles into 64+ non-repeating moves, uses event-triggered expressions synced to responses, and has 20+ mouth shapes. The Rive file is under 1 MB [V]. Taxila copies all of this, using the face programs in `audio-to-face-ml.md` §6.1.
3. **Reactions are split at the commit line.** While the child talks, she shows only neutral, prosody-timed backchannels (nods, an attentive "hmm"). Evaluative faces (impressed, delighted, concerned) appear only in her next turn. This preserves gurukul's "no verdict before commit". It is also all the system can do, because the Director classifies the answer after the turn (ARCHITECTURE §1.2).
4. **She points, and the canvas shows where.** Instructor pointing improved learning and attention whether or not gaze was used (Pi et al. 2019, n = 120) [V]. Gemini Live highlights things "directly on your screen" over the camera feed [V]. When she names a part of the module, a hand-drawn **chalk pointer** draws on it, timed to the word (§4.3).
5. **Captions show one line: the current phrase.** The line is karaoke for Young bands and optional for fluent readers. The full transcript appears after the lesson, for the parent. ChatGPT folding voice into the chat thread with live visuals [S] shows that eyes need content during voice. But a scrolling transcript is a reading load, and scrolling is banned on the lesson stage.
6. **Whose turn it is must be shown one way, unmistakably.** Speak uses a "Speak now…" label and lights each recognised word blue [V]. Ello uses a waveform bar [V]. Taxila uses the single marigold ring (kids-ux) plus her lean-in, and Older bands may add a one-word label.
7. **The worst moment on every call screen is being misheard or cut off.** Duolingo: "the whole conversation goes into trying to get Lili to understand what I just said". Gemini: "cuts off too quickly when I pause for just 1-2 seconds". ChatGPT: "I can't even take a damn breath" [X]. Speak found manual turn-ending "eliminates the anxiety of being cut off mid-thought" [V]. Taxila: tap-to-talk for B1-B2; open mic plus a tappable "heard" chip for B3-B4; tiles after one miss.
8. **Reject the phone-call costume for children.** This means no ringing, no "Calling…" screen, no annoyed face waiting for you to pick up (Lily) [V], no self-view camera (Praktika) [V], and no red hang-up. These cues imply a person on the line, and younger children anthropomorphise more. A ring is a pull lever. A child's camera stream is a DPDP §9(3) monitoring risk. Red is the `stop` token. Taxila uses a classroom metaphor instead: she is already there when the lesson opens.
9. **Human in voice, timing and memory; illustrated in face** (kids-ux §0.11). Praktika reviewers: "most of the AI's look creepy"; "speaks with multiple different voices. its a bit creepy" [X]. YoLearn sells photoreal "AI co-teacher avatars" of real teachers [V]. The stage frame (§4.2) must hold the 2D Rive teacher now and the selectable 3D head later.
10. **Portrait phone, stacked:** top bar · teacher stage with the chalk ledge at its base · caption line · canvas (answer tiles live here) · control bar (mic). Each layout mode L1-L5 has a budget that sums to the 744 dp usable height (§5).
11. **Landscape tablet or laptop, split:** a teacher column on the left (24-40% of width by mode) holds her, the caption and the mic. A work column on the right holds the chalkboard ledge above the canvas. She faces and points to the right. Synthesis's left instruction rail and right manipulative is the precedent [V] (§6).
12. **Layout follows the lesson container's aspect ratio, not the device.** Container queries choose stacked, split or compact. The Android app keeps B1-B2 in portrait; B3-B4 modules may request landscape (kids-ux S3).
13. **The teacher is rendered on the device, so she never freezes on patchy data.** A streamed video face freezes mid-expression, which is the deadest a screen can look, and costs $0.01-0.50/min [S]. When audio stalls she performs "one moment"; past 8 s the canvas falls back to the offline card.
14. **Nothing transactional on the way in or out.** Duolingo shows "CALL +15 XP" [V]; Praktika shows a 7-day flame [V]. YoLearn exposes style knobs (Visual, Story Mode, Socratic…) [V]. Taxila has no XP or streaks and no "learning style" settings: preferences are logged, never used as the learning signal (learning-science §2.6).

---

## 1. What each product puts on screen (teardown)

| product | screen anatomy (what is visible during the call) | what makes it feel alive | failure signals | tag |
|---|---|---|---|---|
| **Duolingo, Video Call with Lily** (Max / Super; adults) | **Entry:** a camera node on the path opens a card, "Video call: Lily · CALL +15 XP · SKIP". **Ring:** a dark "Calling Lily…" screen with her in a circle. **Call:** her flat 2D face cropped to fill the screen, with one red hang-up in a dark bottom tray. **After:** "see a transcript of your conversation". | She takes the first turn. The first question is "formulated during the incoming call ring", so the ring hides latency. Rive state machine; 8 head × 8 body idles; lean-in, skeptical look, eye-roll, furrowed brow, squint and head-shake, eyebrow-and-nod; head-tilt "pondering" during AI processing; 20+ mouths timed from audio. Memory list ("How are your dogs doing?"). The system decides the ending ("Psst! Say it's time to go") and checks mid-call whether the learner wants to lead. | Review: "transcription generates random words. And the whole conversation goes into trying to get Lili to understand" [X]. Sass and eye-rolls are a register for adults | [V] blog ×5, Rive post, images |
| **Duolingo, Falstaff** (beginners) | The bear in his forest; a one-line caption pill over his chest ("Was möchten Sie?"); red hang-up in the centre; **CC** toggle at the right of the tray. | He leads with level-appropriate questions; suggestions and translations "on demand"; "real-time feedback in your own language". | n/a | [V] blog + image |
| **Speak** (adults) | **Lesson card:** a "Speak now…" label; the target sentence lights word by word in blue as it is recognised, with unspoken words grey; translation below; replay and pause; **HFM ON** toggle (likely hands-free mode); segmented progress. **Roleplay:** chat bubbles with speaker and translate icons; corrections attached to your own bubble; a "Suggestion" chip; a "Speak now…" field with a bulb for hints. "What I heard" summary card with "Tap to start over". Recorded video of a human teacher for lesson intros. | Whose turn it is, said in words; your own words lighting up as you say them; goals and hints in roleplays. Manual turn end treats the recording as one utterance; hands-free mode uses semantic end-of-turn, "still an open problem". | Reviews: "a lot of delay, so I didn't know if I got it right" [X] | [V] screenshots, blog ×3 |
| **Praktika** (adults) | **Call mode:** full-bleed 3D, Pixar-like tutor (Tama), name dropdown at top, speaker toggle, close; **your own camera self-view** bottom-left; camera, mic and red hang-up buttons. **Chat mode:** tutor card at the top (~35%), bubbles with play and translate icons, keyboard and mic. Corrections painted on your utterance (error span red, fix green), then a sheet: "It is better to say" + "Explanation". Correction intensity: Soft / Balanced / Strict. | "Ultra-realistic AI Avatars" with backstories and accents; "generative AI animation" since 4.0 ("more natural motion and expressive animated presence"); hands hold props (a tablet). | "Most of the AI's look creepy"; "speaks with multiple different voices… creepy"; "the transcript doesn't relate what I'm saying"; "no hands free option" → uninstall; "hold the microphone button" [X]. Recent mean 4.13★ (n = 1,500) [X] | [V] screenshots, listing, site |
| **YoLearn.AI** (India, Classes 3-12, JEE/NEET) | **Picker:** photoreal tutors, "Verified Teacher · AI co-teacher avatars of real school teachers", "Expert Tutor". **Call:** dark screen; a small round tutor photo at the top; transcript bubbles (greeting in Devanagari, then English); **CC**, speaker and settings at the top right; a glowing orb with mute and close; an "Ask Anything" chip; a LIVE badge. The tutor "draws diagrams, writes step-by-step… derivations" on a sketch board as it speaks. **Settings:** Companion / Focused; style chips (Step by Step, Visual, Example First, Story Mode, Socratic, Direct, Flipped); mastery level; tone; detail. | A phone-call metaphor ("as if they are speaking to a teacher on the phone"); Hinglish accepted; drawing synced to speech. | 245 reviews, 4.84★, several read like marketing copy (onboarding-flow §2.1) [X]; no UI complaints found | [V] screenshots, site |
| **Khanmigo** (Khan Academy; US middle school) | A text tutor in a panel beside the exercise; no character face found; since Aug 2026, interactive diagrams generated "when a visual may help" that react to where the student drags a segment. | Little by design: the tutor waits to be asked. | The RCT's engagement problem: messages appeared in 17% of mistake sessions ("One Click Away"). Proof that a side-panel tutor gets ignored | [V] Khan blog; [S] learning-science, global-ai-tutors |
| **Synthesis Tutor** (ages 5-11; iPad, desktop) | **Landscape.** A black left rail carries the tutor's current instruction as text, with the key value in yellow ("…make the fraction 1/64"); a manipulative fills the right ~75%; a tool palette sits at the right edge; home, settings and pause icons are tiny. No face: the tutor is a voice. | Everything is read aloud under age 7; manipulatives are hand-built; micro-assessments inside every lesson. | Android app is new (1,894 installs [S]) | [V] screenshots, page |
| **ChatGPT Voice** | **Before Nov 2025:** a full-screen animated blue orb; a voice picker sheet ("Sol · Savvy and relaxed"), Language Auto, Intelligence Instant. **Since 25 Nov 2025:** voice lives inside the chat; "talk, watch answers appear… see visuals like images or maps in real time"; tap "end"; "Separate mode" keeps the orb. Video and screen share since Dec 2024. | Voice choice; live visuals in the thread. | Review: "the live chat keeps cutting me off and interrupting me in mid sentence" [X] | [S] TechCrunch ×2; [V] screenshots |
| **Gemini Live** | Full-bleed camera (or screen share). The user's speech appears as a quoted pill. Top: flip camera, captions, more. Bottom: camera, screen share, a blue glow pill, mic (hold), end. End gives "review the transcript"; captions button at top right; an "Interrupt Live responses" on/off setting; Hindi in the language list. **Visual guidance** highlights objects on the camera feed (from 28 Aug 2025). Voice can be asked to slow down. | Pointing at the user's own world; the glow pill as a presence signal; speed control. | "Voice input cuts off too quickly when I pause for just 1-2 seconds"; "keeps listening… even if the sound indicator dots don't indicate any sounds" [X] | [V] Google help, blog ×3, screenshot |
| **Ello** (ages 4-9; extra reference) | A content card at the top (picture + question); the character stands at the bottom **looking up at it**; a waveform input bar with a submit arrow; pause at the top left; star count at the top right. | "Ello hears the confidence on one word, the hesitation on the next" and adapts. | Stars and a prize store (a reward economy Taxila rejects) | [V] screenshots, page |

---

## 2. What makes a call screen feel alive: mechanisms, ranked

| # | mechanism | who does it | evidence | Taxila rule |
|---|---|---|---|---|
| 1 | **Turn-taking that never cuts the child off** | Speak manual turns; Gemini's interrupt setting | Speak's engineering account [V]; review complaints across Gemini, ChatGPT, Duolingo [X]; children answer slower than adults (~625 vs ~371 ms) with long mid-utterance pauses (learning-science §3.8) [S] | B1-B2 tap-to-talk, auto-close at the endpoint (lesson-arc §4 rule 5); B3-B4 open mic with a 900 ms endpoint [T], plus a "heard" chip; tiles after one miss |
| 2 | **Performed thinking** instead of a spinner during latency | Lily (head tilt, pondering) | Rive case study [V] | THINKING = eyes up, chalk to chin (lesson-arc §4); past 4 s, a "one moment" hand; never a spinner (gurukul honest waits) |
| 3 | **Deixis: pointing at the thing being named** | Gemini visual guidance; YoLearn drawing while speaking | Pi et al. 2019: pointing → better learning, more efficient visual search, more attention to the referent, regardless of gaze (n = 120) [V abstract]; instructor presence alone is not beneficial, but its social and attentional cues can be (systematic review, 41 studies) [V abstract]; more spatially integrated signalling → higher retention and transfer (adults, 2026) [V abstract] | chalk pointer overlay + her hand or gaze toward the canvas (§4.3) |
| 4 | **Non-repeating idle and breathing** | Lily: 64+ idle combinations | [V] | at least 6 head and 6 body idle clips, random 2-6 s blinks, 4 s breath (visual-identity §7.2); idle sway drops in YOUR TURN |
| 5 | **Content-timed expressions** | Lily's event-triggered expressions | [V] | face programs armed by the Director's move, fired on her first played audio frame (audio-to-face §6.1); evaluative ones only after commit |
| 6 | **One caption line, current phrase** | Falstaff pill + CC; Gemini CC | [V]; same-language subtitling in India (kids-ux §8.1) [S] | karaoke line for Young / R0-R1; optional for R2 |
| 7 | **The character opens and closes the call** | Lily's greeting cycle, first question during the ring, "time to go" | [V] | P0 she greets by name with a callback; the Director owns the wrap (lesson-arc P7); the arrive animation masks setup latency (§4.5) |
| 8 | **Your own words, acknowledged** | Speak's word lighting; Gemini's quoted pill | [V] | Older: a faint "heard" chip, tap to fix; Young: no text echo (R0 cannot read it); the ear and level pulse do the job |
| 9 | **Memory callbacks** | Lily's facts list; Praktika "remember your context" | [V]; Praktika "next day it forgets" reviews (global-ai-tutors §2.4) [V] | callback in P1 only from cited memory; the chalk ledge can carry the artefact from last lesson |
| 10 | **Personality that grows** | Lily's sass "at advanced levels" | [V] | humour register widens with rapport and band; never sarcasm or eye-rolls at a child |
| 11 | **A world behind the character** | Falstaff's forest; Lily's room | [V] | a static, low-detail classroom corner; seductive details cost recall (control > seductive details, g = 1.03, n = 62, adults) [V abstract]; Rey 2012 meta-analysis [M] |
| 12 | **Voice and look consistency** | violated in Praktika's "multiple different voices" reviews | [X] | one voice per character, never swapped mid-lesson; voice id pinned in the session (ARCHITECTURE §1.1) |

---

## 3. Patterns Taxila rejects, and why

| pattern | seen in | why not for Taxila |
|---|---|---|
| Incoming-call ring, "Calling…", a face annoyed while you hesitate | Duolingo [V] | A ring is a pull lever (NEVER MANIPULATE, gurukul §4.7). The annoyed face is a guilt cue. A shared phone ringing for a child is wrong. The phone-call costume tells a 6-year-old that a person is on the line (learning-science §3.8: younger children anthropomorphise more). |
| Self-view camera tile | Praktika [V] | No pedagogical job; the camera stream of a child is a §9(3) behavioural-monitoring risk; bandwidth and battery on budget phones; self-view raises self-consciousness [M]. **v1 requests no camera.** |
| Red hang-up button | Duolingo, Praktika [V] | `stop` brick is reserved for system errors (kids-ux §4.3). Young children mine-sweep; an exit must sit behind the leave guard. |
| Painting the child's error red, the fix green | Praktika [V] | Never red for a wrong answer (kids-ux row 12). Correction is spoken, in her turn, by the hint ladder. |
| XP on the call entry, streak flame after | Duolingo, Praktika [V] | No reward economy, no streak guilt (learning-science rule 27, §3.7). |
| "Learning style" and tone knobs | YoLearn [V] | Matching to stated style does not work (learning-science §2); the learning profile is measured, not chosen. Older children get real choices instead: pace, quiet mode, "show me why". |
| Photoreal likeness of real teachers | YoLearn [V] | Uncanny after ~9 (Brink 2019, kids-ux §0.11); consent for likeness (gurukul §4.8); a real teacher's face implies that teacher is speaking. |
| Orb-only screen | ChatGPT pre-2025 [S] | The eyes idle while the ears work; OpenAI itself moved content into the voice view. |
| Scrolling transcript during the lesson | ChatGPT, YoLearn [V/S] | A reading load for R0-R1, and no scrolling on the stage (kids-ux row 7). The transcript goes to the parent area. |
| Tutor in a side panel that waits to be asked | Khanmigo [V] | Engagement was "rare rather than shallow" (17%); Taxila's teacher holds the floor and hands it over explicitly. |

---

## 4. Taxila call-screen anatomy (all orientations)

### 4.1 Layers, back to front
1. **Room**: a static, low-detail classroom corner in `bg`; never animated (the B1 motion budget allows at most 2 animated layers besides the teacher, visual-identity §7.3).
2. **Teacher stage** (`StageFrame`, §4.2), with the **chalk ledge** (lesson-arc's whiteboard strip, drawn as the board in front of her in portrait, or above the canvas in landscape).
3. **Canvas**: the module iframe; answer tiles render here as content, not in the control bar.
4. **Pointer overlay**: transparent and above the canvas; draws chalk marks (§4.3).
5. **Turn ring**: the single `turn` element, on the mic, the tiles or the module frame.
6. **Caption line**.
7. **Control bar**: mic and, for Older bands, the chips and typed field.
8. **Overlays**: pause, leave guard, connection veil (canvas only, never over her face), system error (the only `stop` use).

### 4.2 `StageFrame`: one slot for a 2D or 3D teacher
- **Framing tightens as the stage shrinks** (the Lily insight: small means close). *Medium* (waist up, both hands) for L1 Face and L5 Close. *Medium close-up* (chest up, one pointing hand visible) for L2 Teach. *Close-up* (face fills ~70% of the frame height) for L3 bands and the picture-in-picture.
- **Eye line at 40% of stage height.** Keep a pointing-hand safe zone on the side facing the canvas: below her in portrait, to her left (screen right) in landscape.
- **`stage.faceMin`** (chin to hairline): 96 dp for Young, 64 dp for Older [I, M-UT-5]. Young children need visible, exaggerated feedback (NN/g via kids-ux §2) [V]. If a layout would breach it, framing tightens before the stage shrinks.
- **Named gaze targets**: `child` (camera), `canvas`, `ledge`, `protege`, `down-think`. The layout resolves each name to a direction, for example `canvas` = down in portrait and screen-right in split. Both the Rive rig and the 3D head (`web-3d-talking-heads.md`) take the same names, so neither the Director nor `audio-to-face` §6.1 ever handles screen geometry.
- The 3D tutor slots into the same frame later. Budgets in §5-§6 assume the frame, not the renderer.

### 4.3 The aliveness layer: cues armed by the Director, fired on the playback clock
The Director already sends the next move's face program (audio-to-face §6.1). This layer extends that idea to pointing and gaze:

```
ui.cues?: Array<{
  when: 'audio_start' | 'word' | 'audio_end';
  match?: string[];          // terms in both scripts, e.g. ["आधा","aadha","half"] (word cues only)
  act: 'point' | 'gaze' | 'face';
  target?: string;           // module element id (from the engine's highlight targets) | gaze name
  style?: 'circle' | 'underline' | 'arrow' | 'tick-mark';
  program?: FaceProgram; intensity?: 0|1|2|3;
}>
```

- **Sync sources, best first.** (1) Voice Live word timestamps, if lane B wins (`voices-hindi.md` §0.5) [V]. (2) Character offset in the transcript delta × the voice's measured characters per second, viable only if the transcript leads playback by ≥ 150 ms (experiment E-8, `audio-to-face-ml.md`) [U]. (3) Fallback: fire at `audio_start` and hold until `audio_end`. The client never fires a cue from text the model improvised, except the capped praise-lexicon smile in audio-to-face §6.1.
- **Pointer look.** A hand-drawn 3 px stroke in `ink` on light canvases and in chalk on the board. It draws on over 240 ms, holds 1.5 s, then fades over 300 ms. It is never marigold (marigold is reserved for the turn) and never pulses, and its contrast is ≥ 3:1 against the surface (G-UT-7). Under reduced motion it appears without the draw-on. The engines' `highlight` command (ARCHITECTURE §1.4) stays for persistent emphasis; the pointer is transient deixis.
- **Gaze leads the pointer by ~200 ms** (head and eyes turn to `canvas`, then the mark draws, then she looks back at `child`) [I, M-UT-1].

### 4.4 Reaction rules by state (extends lesson-arc §4)
| state | allowed | forbidden |
|---|---|---|
| SPEAKING | lip-sync on the playback clock; beats and brow flashes from prosody (audio-to-face §6.2); armed cues | improvised expressions from text |
| YOUR TURN | lean-in, expectant stillness, gaze at the ringed element; idle sway −50% | any evaluative face; pacing loops that pull attention |
| LISTENING | nods and a soft attentive face timed to the **child's pauses and energy** (backchannels), never to content | smile-of-approval, frown, "hmm" of doubt (all leak a verdict before commit) |
| THINKING | eyes up, chalk to chin; "one moment" hand past 4 s | spinner; an approving or disapproving face before her turn |
| interrupted | the speech animation stops on the frame of interruption; a small surprised-attentive reset (Duolingo-style stop [V via visual-identity §7.2]) | finishing the sentence visually after the audio stops |

### 4.5 Arrive, leave, stall
- **Arrive (P0) replaces the ring.** The child taps their profile, and she is already there. She settles in (looks up, smiles, waves; ~1.2 s) while the token mint, WebRTC setup and first response happen. This does the latency-hiding job that Lily's ring does, without a pull lever [I].
- **Leave.** Young: ⌂ at the top left, plus the back gesture, opens the full-screen tick/cross leave guard (kids-ux S2). Older: "←" in the top bar. Exits use neutral `ink`, never red. If she hears "I have to go", the lesson ends that turn (lesson-arc P7).
- **Stall.** The client keeps her idle loop, blinks and "one moment" running with no network, because the rig is local. The connection veil covers only the canvas. Past 8 s with no audio, the canvas shows the cached offline card (kids-ux S5). Error copy says whose problem it is ("our connection").

---

## 5. Portrait phone (reference 360 × 800 dp; 744 dp usable after a 32 dp status bar and 24 dp gesture bar)

### 5.1 Budgets that add up (dp; every column sums to 744)
lesson-arc §3 gave percentages. With a 96 dp mic and 96-112 dp tiles they overflow by more than 100 dp, so this table replaces them. Tiles move into the canvas, and the whiteboard becomes the ledge at the base of her stage.

**Young (B1-B2)** — top bar 56 (64 dp hit areas reach 8 dp into the inert stage), caption 48, control bar 120 (mic 96 for B1, 88 for B2):

| region | L1 Face | L2 Teach | L3 Canvas | L4 Duo | L5 Close |
|---|---|---|---|---|---|
| top bar | 56 | 56 | 56 | 56 | 56 |
| teacher stage | 392 (medium) | 248 (medium close-up) | 168 (close-up) | 168 (her + protégé, 2 × 172 wide) | 280 (medium) |
| chalk ledge | 0 | 72 | 72 | 72 | 0 |
| caption | 48 | 48 | 48 | 48 | 48 |
| canvas | 128 (2 choice cards) | 200 (anchor, demo or 2 tiles) | 280 (module) | 280 ("show me" area) | 240 (what they made) |
| control bar | 120 | 120 | 120 | 120 | 120 |

Stage plus ledge never drops below 240 dp (32%), which keeps lesson-arc's ≥ 28% floor for Young.

**Older (B3-B4)** — top bar 48 (skill name · "AI teacher" label · pause), caption 40 (0 when off; the canvas takes it), control bar 112 (chips row 48 + input row 56 + 8):

| region | L1 Face | L2 Teach | L3 Canvas | L4 Duo | L5 Close |
|---|---|---|---|---|---|
| top bar | 48 | 48 | 48 | 48 | 48 |
| teacher stage | 400 | 216 | 0 (picture-in-picture 96 × 120, close-up, inside the canvas top right) | 200 (side by side) | 300 |
| chalk ledge | 0 | 56 | 56 | 56 | 0 |
| caption | 40 | 40 | 40 | 40 | 40 |
| canvas | 144 (3-4 choice rows) | 272 | 488 | 288 | 244 |
| control bar | 112 | 112 | 112 | 112 | 112 |

### 5.2 Wireframes
```
L2 Teach · Young (B2)                       L3 Canvas · Older (B3)
┌────────────────────────────────┐ 56      ┌────────────────────────────────┐ 48
│ ⌂         o o ● o o         ⏸  │         │ ←  Fractions · compare  AI  ⏸  │
│ ┌────────────────────────────┐ │ 248     │ ┌ ledge [ 1/3 ][ 1/4 ][ > ] ─┐ │ 56
│ │  TEACHER, medium close-up  │ │         │ └────────────────────────────┘ │
│ │  eye line 40%, hand points │ │         │  caption line (CC, optional)   │ 40
│ │  down at the ledge         │ │         │ ┌────────────────────────────┐ │
│ ├────────────────────────────┤ │ 72      │ │ MODULE           ┌───────┐ │ │ 488
│ │ chalk ledge [ ½ ] [ roti ] │ │         │ │ roti cutter      │  PiP  │ │ │
│ └────────────────────────────┘ │         │ │ chalk circle ○   │ close │ │ │
│  आधा ▌रोटी  karaoke caption    │ 48      │ │ on the named bar │  -up  │ │ │
│ ┌────────────────────────────┐ │ 200     │ │                  └───────┘ │ │
│ │ CANVAS: anchor or demo,    │ │         │ │ ring on frame = try it     │ │
│ │ or [ tile ≥96 ][ tile ≥96 ]│ │         │ └────────────────────────────┘ │
│ └────────────────────────────┘ │         │ [Hint] [Show me why] [I know]  │ 48
│            ( mic 88 )          │ 120     │ [ type or speak…    ] (mic) ⌨  │ 56
└────────────────────────────────┘         └────────────────────────────────┘
ring: on the mic OR on the tiles, never both  heard chip appears above the input
```

### 5.3 Rules
- **Flex order.** Taller phones (20:9, 360 × 780+ usable) give the extra height to the teacher stage, up to +64 dp, then to the canvas. Small phones (320 × 640) take height from the teacher stage first, by tightening framing, then from the canvas down to its minimum (Young 180, Older 240). They never take it from targets, the mic or the caption.
- **Tiles are content.** They appear in the canvas, are named in her sentence with the action word last, and are inert (desaturated) while she speaks (kids-ux S2).
- **Older picture-in-picture.** It can be dragged between the canvas's two top corners (a tap twin snaps it to the other corner) and never covers the active target: the engine reports a keep-out rect, and the PiP avoids it. It is never hidden in v1, pending M-UT-6.
- **Heard chip (Older).** After each child turn, a single faint line ("heard: …", her normalised transcript) shows for 3 s above the input. Tap it to correct by typing. It never shows for Young (R0 cannot read it) and never shows an evaluation.
- **Phone in landscape.** The Android app keeps B1-B2 in portrait; B3-B4 modules may request landscape. Web on a landscape phone gets the compact split (§6.4).

---

## 6. Landscape tablet and laptop

### 6.1 Reference containers
| container | example | usable (dp) |
|---|---|---|
| 10" Android tablet | 1920 × 1200 px at 1.5x | 1280 × 752 |
| budget laptop browser | 1366 × 768 minus browser chrome | 1366 × 657 |
| FHD browser | 1920 × 1080 minus chrome | 1920 × 970 → stage capped at 1600 × 1000, room letterboxes |

### 6.2 The split: teacher column left, work column right
- **Why left:** Hindi and English both read left to right, so she introduces and the eye moves on to the work. She faces three-quarters right, and her pointing hand and gaze go into the canvas. Synthesis puts its instruction rail on the left and the manipulative on the right [V]. On tablets the left thumb reaches the mic while the right hand works the canvas [I]. A **mirror layout** setting (parent area for Young, settings for Older) flips everything for left-handed children (M-UT-3).
- **Teacher column, top to bottom:** stage (flex) · caption (≤ 2 lines, current phrase, karaoke for Young) · mic zone (120 dp; chips and typed field for Older).
- **Work column, top to bottom:** chalk ledge (72 / 56 dp), like the board on the classroom wall · canvas (flex) with tiles in its bottom band.
- **Top bar** spans the full width: ⌂ or ←, progress stones or skill map, "AI teacher" label (Older), pause.

| mode | Young teacher column | Older teacher column | work column | notes |
|---|---|---|---|---|
| L1 Face | 60% | 55% | choice cards, stacked | medium framing |
| L2 Teach | 40% | 34% | ledge + anchor or demo | medium close-up |
| L3 Canvas | 30% (min 320 dp) | 24% (min 280 dp) | ledge + module | close-up; below the minimum → compact (§6.4) |
| L4 Duo | 30%, her on top, protégé below | 26% | "show me" area | both faces ≥ `stage.faceMin` |
| L5 Close | 45% | 40% | what they made + one finish tile | medium |

```
L3 Canvas · Young (B2) · 1280 × 752 dp
┌──────────────────────────────────────────────────────────────────────────┐ 56
│ ⌂   o o ● o o                                                        ⏸  │
├────────────────────────┬─────────────────────────────────────────────────┤
│                        │ ┌ chalk ledge [ ½ ] [ ¼ ] [ roti ] ───────────┐ │ 72
│   TEACHER  30%         │ └─────────────────────────────────────────────┘ │
│   close-up, faces      │ ┌─────────────────────────────────────────────┐ │
│   right; gaze leads    │ │ MODULE CANVAS  70%  (~860 × 520)            │ │
│   the chalk pointer    │ │ chalk circle ○ on the part she names        │ │
│                        │ │ ring on the frame when the hand-over is try │ │
├────────────────────────┤ │                                             │ │
│ आधा ▌रोटी  caption,    │ │ [ tile ≥112 ]   [ tile ≥112 ]   (if choice) │ │
│ ≤ 2 lines              │ └─────────────────────────────────────────────┘ │
│        ( mic 96 )      │                                                 │
└────────────────────────┴─────────────────────────────────────────────────┘
```

### 6.3 Laptop and keyboard
- Space = mic (tap-to-talk toggle for Young; mute/unmute for Older). 1-4 = choose tile. Enter = submit the typed answer. H = hint, C = captions, Esc = pause. Key presses are never held; long-press stays banned.
- Focus ring: opaque, 3 px, 3 px offset (gurukul §6.2), drawn in `ink`, distinct from the marigold turn ring.
- Hover never reveals anything a touch user cannot reach. Trackpad drags use the same snap and partial credit as touch.

### 6.4 Compact landscape (container height < 480 dp: phones on the web, B3-B4 module requests in the app)
The teacher column narrows to 28% and its stage to a close-up of at least 144 dp. The ledge collapses into a vertical chip rail at the left edge of the canvas. The caption becomes a single pill over the canvas bottom, Gemini-style [V]. The mic floats at the bottom right of the teacher column (Older 56 dp; Young 88 dp). The top bar is 40 dp.

---

## 7. Breakpoints (container queries on the lesson container, never viewport queries; gurukul `rejected.md#viewport-media-queries-cannot-see-a-narrow-container`)

| condition (A = width / height) | family | tokens |
|---|---|---|
| A < 1.0, width < 600 dp | stacked phone (§5) | phone |
| A < 1.0, width ≥ 600 dp (tablet portrait, unfolded foldable) | stacked, canvas max 4:3, caption measure ≤ 40 em, extra height → canvas | tablet |
| A ≥ 1.0, height ≥ 480 dp | split (§6.2) | tablet / laptop |
| A ≥ 1.0, height < 480 dp | compact split (§6.4) | phone |
| any, width > 1600 or height > 1000 | split, stage capped, room letterboxed | laptop |

Rotation mid-lesson re-flows within `motion.layout` (300 ms, transform and opacity only), keeps the current state and ring target, and never restarts her audio.

---

## 8. Components and tokens (extends kids-ux §6, lesson-arc §8, visual-identity §8)

| component | job | must-haves |
|---|---|---|
| `LayoutStage` | maps the Director's `layout` (L1-L5) × container family to geometry | budget table from tokens; G-UT-1 |
| `StageFrame` | the slot for the Rive or 3D teacher | framing by mode, eye line, `faceMin`, named gaze targets resolved by layout |
| `ChalkLedge` | lesson-arc's whiteboard strip, drawn as a board | 1-3 chips, tap to replay her line; chalk `#F5F2E8` on board `#1F3B30` (10.86:1, visual-identity) |
| `PointerOverlay` | transient deixis on the canvas | ink or chalk stroke; draw 240 / hold 1500 / fade 300 ms; ≥ 3:1; never marigold |
| `CueScheduler` | fires `ui.cues` on the playback clock | sync source priority (§4.3); drops a cue whose word never plays |
| `ReactionGate` | blocks evaluative face programs outside SPEAKING | exhaustive state × program test (G-UT-3) |
| `CaptionLine` | one line, current phrase | karaoke (Young / R0-R1); script per kids-ux §8.1; never clips matras |
| `HeardChip` | Older: shows the normalised transcript for 3 s, tap to fix | never evaluative; hidden for Young |
| `ConnectionVeil` | covers the canvas only, honest wait | elapsed time counts up (Older); her "one moment" (Young) |
| `PiPTeacher` | Older L3 portrait | close-up; two corners; avoids the engine's keep-out rect |

```
--stage-faceMin-young: 96dp;   --stage-faceMin-older: 64dp;   --stage-eyeline: 0.40;
--ledge-h-young: 72dp;         --ledge-h-older: 56dp;          --caption-h-young: 48dp; --caption-h-older: 40dp;
--controlbar-h-young: 120dp;   --controlbar-h-older: 112dp;    --topbar-h-young: 56dp;  --topbar-h-older: 48dp;
--split-col-L2-young: 40%;     --split-col-L3-young: 30%;      --split-col-L2-older: 34%; --split-col-L3-older: 24%;
--split-min-height: 480dp;     --stage-max: 1600dp 1000dp;     --pip: 96dp 120dp;
--pointer-stroke: 3px; --pointer-draw: 240ms; --pointer-hold: 1500ms; --pointer-fade: 300ms; --gaze-lead: 200ms;
--heard-chip-hold: 3000ms;     --arrive-anim: 1200ms;
```

---

## 9. Copy tone notes (shapes, never lines; repo law: sentence-shaped text gets recited)

- **Top bar label (Older, and for any parent watching):** her name plus the plain words for "AI teacher", in the child's chosen language. It is product copy, fixed and reviewed, and never a persona flourish.
- **Leave guard:** a yes/no question in ≤ 4 words for Young, spoken too. No "are you sure you want to leave your teacher" framing, and no sad face (that would be a guilt cue).
- **Heard chip:** a neutral label word plus the child's words, as heard. No "did you mean" from the machine, and no judgement.
- **Connection veil:** names whose problem it is (ours) and the elapsed time, counting up. For Young it is visual only.
- **Settings:** describe pace, captions, quiet mode and mirror layout in terms of what changes on screen, never "learning style".
- **Read-aloud test** in both the Hindi and English voices for every string (kids-ux §7).

---

## 10. Gates (each with a negative control, per gurukul discipline)

| id | gate | negative control |
|---|---|---|
| G-UT-1 | for every band × mode × reference container, region sizes sum to the container and none falls below its minimum (unit test over tokens) | raise `--ledge-h-young` to 120 → fails |
| G-UT-2 | ≤ 1 `turn` element on screen (reuse kids-ux `YourTurn` exhaustive test) | render tiles and mic both ringed → fails |
| G-UT-3 | `ReactionGate` rejects praise / impressed / concern / doubt programs in LISTENING, YOUR TURN and THINKING (exhaustive state × program) | enqueue praise during LISTENING → fails |
| G-UT-4 | no `stop` token or red on any exit or hang-up control (lint) | colour ⌂ with `stop` → fails |
| G-UT-5 | no `getUserMedia({video})` under `src/lesson/`; the Android manifest has no CAMERA permission in v1 | add a camera call → fails |
| G-UT-6 | screenshot test of the **real signed-in lesson** at 320×640, 360×744, 412×860, 800×1232, 1280×752, 1366×657, 760×330 and a narrow split container | delete a container query → diff fails |
| G-UT-7 | pointer and focus ring ≥ 3:1 against every canvas surface (light, dark, board); the pointer never uses `turn` | set the pointer to marigold → fails |
| G-UT-8 | teacher + module + pointer render at ≤ 33 ms p95 per frame on a 2-3 GB device in split and stacked (kids-ux G9) | disable the 30 fps face cap → fails on the reference device |
| G-UT-9 | caption and ledge never clip Devanagari matras at any container width (kids-ux G8) | fixed 40 dp height + `overflow:hidden` → fails |

## 11. Measurements (log to `context/measurements.md` with n, method and date)

| id | question | method | reversal / decision rule |
|---|---|---|---|
| M-UT-1 | does the chalk pointer (with gaze lead) help? | within-child A/B over items: first touch on the referent after the cue word, plus item correctness; n ≥ 40 children per band family | no gain in latency or accuracy → drop the pointer and keep `highlight` only |
| M-UT-2 | teacher above the content (lesson-arc) vs below it (Ello pattern), portrait Young | YOUR TURN response latency and re-prompt rate; n ≥ 30 B1-B2 | the bottom variant wins by ≥ 15% → swap the portrait order |
| M-UT-3 | teacher column left vs mirrored on tablets | mic misses and reach time by handedness; n ≥ 20 per hand | mirror wins for right-handers → change the default |
| M-UT-4 | do listening backchannels lengthen children's answers? | words per child turn with nods on vs off; n ≥ 30 | no effect → keep only the listening pose |
| M-UT-5 | is `faceMin` right? | blind adult raters plus child recognition of 5 expressions at 64 / 96 / 128 dp | < 80% recognition at the token → raise it |
| M-UT-6 | does the Older picture-in-picture earn its pixels (Synthesis has no face)? | B3-B4 A/B in L3: PiP vs voice only; practice accuracy, session completion, stated preference logged separately | no difference → let Older children hide it |
| M-UT-7 | do B1-B2 children know she is a computer? | after lessons 1 and 5, a picture question ("person or computer?"); n ≥ 50 | < 90% correct → strengthen disclosure (a stage marker, spoken more often) |
| M-UT-8 | does the heard chip reduce repair loops for Older children? | turns spent on misrecognition per lesson, chip on vs off | no reduction → remove it |
| E-8 (linked) | transcript lead over playback | as in `audio-to-face-ml.md` | < 150 ms → word cues only with Voice Live timestamps |

---

## 12. Proposed `context/` entries (for the main loop to merge)

**Decisions**
1. `call-screen-is-a-classroom-not-a-phone-call`: no ring, no "Calling…", no self-view, no red hang-up; she is present on open. *Reverse if* a B3-B4 test shows the call metaphor raises completion **and** M-UT-7-style disclosure comprehension is unchanged. Even then the ring and guilt faces stay banned.
2. `reactions-split-at-commit`: evaluative faces only in SPEAKING, after the Director's classification. *Reverse never for verdict faces*; listening backchannels can be removed by M-UT-4.
3. `pointer-deixis-on-canvas`: chalk pointer + gaze lead, armed as `ui.cues`. *Reverse if* M-UT-1 shows no gain.
4. `portrait-dp-budget-replaces-percentages`: tiles live in the canvas; the whiteboard becomes the ledge at the base of her stage. *Reverse if* the screenshot gate shows a band where tiles in the canvas lower answer accuracy versus the control bar.
5. `landscape-split-teacher-left`: the column widths in §6.2. *Reverse by* M-UT-3 (side) or M-UT-6 (Older PiP).
6. `teacher-rendered-on-device-in-live-path`: no streamed video face in v1. *Reverse if* a video avatar costs < $0.005/min **and** survives a 2G-like loss test without freezing.
7. `no-camera-v1`. *Revisit for* a v2 "show your notebook" snapshot (a deliberate still, guardian-consented, parent-visible, never a stream, never the face).

**Rejections** (what was seen and why it breaks for Taxila): phone-call costume (Duolingo, Praktika); red error and green fix painting (Praktika); XP on the call node and the streak flame; learning-style knobs (YoLearn); photoreal likeness of real teachers (YoLearn); in-lesson scrolling transcript (ChatGPT, YoLearn); a side-panel tutor that waits to be asked (Khanmigo, 17%).

**Measurements logged this session:** Play review theme counts and samples ([X], `ui-teardown-reviews-2026-10-02.json`, n per app: Duolingo 6,000 → 12 Video Call mentions; Praktika 1,500; Speak 1,500; YoLearn 245; Ello 107; Khan Academy 3,000 → 36 AI mentions; ChatGPT 6,000 → 45 voice mentions; Gemini 6,000 → 87 Live/voice mentions; method: newest English reviews, US + IN storefronts, regex, 2026-10-02).

---

## 13. Conflicts with sibling docs, and open questions

**Conflicts (this doc proposes; the main loop decides)**
- *lesson-arc §3:* the percentage table overflows the 800 dp phone once the mic and tiles are placed (L2 Young sums to ~854 dp of 744 usable). §5.1 replaces it with budgets that add up; the mode names and proportions-in-spirit stay.
- *kids-ux §6 `CaptionStrip` "per-word timing from the TTS/realtime transcript":* the realtime WebRTC lane carries no word timestamps (`web-3d-talking-heads.md` §1). Karaoke is exact only with Voice Live (lane B); otherwise it is estimated (E-8). Flag for the voice-lane decision.
- *audio-to-face §6.1 "gaze and head turn to the module region":* the direction depends on layout; resolved by named gaze targets (§4.2).
- *kids-ux S3 "landscape in B3-B4 only":* kept for the Android app; web phones in landscape get the compact split (§6.4).

**Open questions**
1. **Khan Kids is landscape-first on phones for ages 2-8** [V screenshots], unlike this doc's portrait default. Test landscape for B1 drag-heavy modules before ruling it out.
2. **Is a face worth its pixels for Older bands at all?** Instructor presence alone does not improve outcomes; cues do [V abstract]. Synthesis teaches with a voice and a text rail. M-UT-6 decides.
3. **Classroom TV / smart-class mode** (16:9, 3 m viewing distance, teacher-led class): out of scope for v1. The split layout is the starting point, with type scaled by viewing distance.
4. **Hinglish captions:** mixed-script lines (Devanagari with Roman English terms) need a normalisation step (kids-ux §8.1, gurukul §3.6). Measure reading accuracy with Class 2-4 readers before shipping karaoke.
5. **The 3D tutor in the split's larger stage** costs more pixels and frame time than portrait. Re-run G-UT-8 for each renderer.

---

## 14. Sources (all accessed 2026-10-02)

**Duolingo:** Video Call with Lily https://blog.duolingo.com/video-call/ · How AI powers Video Call https://blog.duolingo.com/ai-and-video-call/ · Video Call research https://blog.duolingo.com/video-call-research-report/ · Falstaff calls https://blog.duolingo.com/beginner-video-call-with-falstaff/ and https://blog.duolingo.com/falstaff-calls-research/ · Visemes https://blog.duolingo.com/world-character-visemes/ · Character voices https://blog.duolingo.com/character-voices/ · Duolingo Max https://blog.duolingo.com/duolingo-max/ · Rive case study https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life · Rive creative technologists https://rive.app/blog/creative-technologists-duolingo-s-solution-to-the-designer-to-developer-handoff
**Speak:** https://www.speak.com/ · https://www.speak.com/blog/building-speaks-voice-agent-platform · https://www.speak.com/blog/live-roleplays · https://www.speak.com/blog/live-tutor-lessons-powered-by-openais-gpt-live-1
**Praktika:** https://praktika.ai/ · https://praktika.ai/blog/praktika-4-0
**YoLearn:** https://www.yolearn.ai/ · https://www.yolearn.ai/voice-ai-tutor · https://www.yolearn.ai/ai-tutor-with-sketchpad
**Khan Academy:** https://www.khanmigo.ai/ · https://blog.khanacademy.org/new-ai-tools-bring-interactive-diagrams-and-targeted-practice-thanks-to-khan-academys-partnership-with-google-org/ · RCT and engagement via `../market/global-ai-tutors.md` §2.1 and `../learning-science.md` §0
**Synthesis:** https://www.synthesis.com/tutor
**Ello:** https://www.ello.com/how-it-works
**ChatGPT Voice:** TechCrunch 25 Nov 2025 https://techcrunch.com/2025/11/25/chatgpts-voice-mode-is-no-longer-a-separate-interface/ · TechCrunch 12 Dec 2024 https://techcrunch.com/2024/12/12/chatgpt-now-understands-real-time-video-seven-months-after-openai-first-demoed-it/ · (help.openai.com returned 403)
**Gemini Live:** help https://support.google.com/gemini/answer/15274899 · Aug 2025 updates https://blog.google/products-and-platforms/products/gemini/gemini-live-updates-august-2025/ · Guided vision https://blog.google/innovation-and-ai/products/gemini-app/guided-vision-gemini-live/ · Guided Learning https://blog.google/products-and-platforms/products/gemini/guided-learning-google-gemini/ · overview https://gemini.google/overview/gemini-live/
**Voice presence:** Sesame, Crossing the uncanny valley of voice https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice (four components; CMOS n = 80 raters)
**Google Play listings and reviews** (India and US storefronts, via `google_play_scraper`): `https://play.google.com/store/apps/details?id=` + com.duolingo, com.selabs.speak, ai.praktika.android, com.yolearn.student, com.synthesis.tutor, com.ellotechnology.learn, org.khanacademy.android, org.khankids.android, com.openai.chatgpt, com.google.android.apps.bard. Screenshot URLs in `ui-teardown-screens-2026-10-02.json`.
**Papers:** Pi, Zhang, Zhu & Xu (2019), *Instructors' pointing gestures improve learning regardless of their use of directed gaze in video lectures*, Computers & Education, doi:10.1016/j.compedu.2018.10.006 [V abstract] · *Instructors' presence in instructional videos: A systematic review* (2022), Educ. Inf. Technol., doi:10.1007/s10639-022-11532-4 [V abstract] · *Is it not too redundant? When signaling overlap reduces extraneous load…* (2026), Front. Psychol., doi:10.3389/fpsyg.2026.1795142 [V abstract] · *Cognitive load and working memory in multimedia video podcasts: elaborative and seductive details* (2026), J. Intelligence, doi:10.3390/jintelligence14050074 [V abstract] · Rey (2012), seductive detail meta-analysis, Educ. Res. Rev., doi:10.1016/j.edurev.2012.05.003 [M] · Brink, Gray & Wellman (2019) and NN/g via `kids-ux-ages.md` [V there].
**Sibling docs:** `../tech-and-market.md` §2 (video avatar costs), `../avatar/audio-to-face-ml.md` §6, `../avatar/web-3d-talking-heads.md`, `../voice/voices-hindi.md`, `lesson-arc.md`, `kids-ux-ages.md`, `visual-identity.md`, `onboarding-flow.md`, `../market/global-ai-tutors.md`.

---

## Critique

**Reviewer:** design critic pass, 2026-10-02. **Method:** read-through of this doc against the five attack lines (babyish for 10-15, inaccessible, reward-economy creep, text load for 6-9, low-end Android), plus arithmetic checks. No new web research. Evidence limits are mine: the doc's own sources are adult products and store screenshots, and nothing here was tested with children. Severity: **P0** blocks the design as written, **P1** fix before build, **P2** fix before ship.

**Arithmetic check.** Every column in the §5.1 tables does sum to 744 dp. The problem is the 744, not the sums (C1).

### C1 (P0) The 744 dp reference is a best case, and the floors fail below it
- 744 assumes a 360 x 800 device with a 32 dp status bar and 24 dp gesture bar. That is neither the budget reference nor the web reference. Chrome on Android loses another ~56 dp to the address bar, and budget phones commonly report 360 x 640 dp (584 usable). At 584 dp, Young L3 needs 56 + 48 + 120 + 180 (canvas minimum) = 404, leaving 180 dp for stage plus ledge. That breaks the doc's own "stage plus ledge never below 240 dp (32%)" floor and the ≥ 28% floor from lesson-arc.
- The Older control bar (112 dp) with the soft keyboard open (~260-300 dp) leaves nothing for the stage and canvas. No keyboard-open layout is specified.
- **Fix.** Make the reference 360 x 640 usable 584, with 744 as the generous case. Add the real web case (about 360 x 650 visible). Define a keyboard-open mode: stage collapses to a 96 dp face strip, ledge and caption merge, canvas keeps 240 dp. Add 360 x 584 and "keyboard open" to G-UT-1 and G-UT-6. If the floors cannot all hold at 584, the Young control bar (120 dp for one button, 16% of the screen) is the place to give: a 72 dp mic with a 96 dp hit area.
- **Fix.** Text heights must use `sp` and `min-content`, not fixed dp. At 200% system font scale, the 48 and 40 dp caption bands clip. G-UT-9 covers matras but not font scale; add 130%, 200%.

### C2 (P0) Open mic for B3-B4 on a shared family phone is the highest-risk default in the doc
- Open mic with a 900 ms endpoint, on a phone loudspeaker, in a room with a TV and siblings, will do three things: self-trigger on her own echo (the repo already built `evals/echosim/` for exactly this class of failure in Meera), commit the wrong speaker's words, and cut off children who pause. The doc's own evidence (§2 row 1: children pause long mid-utterance) argues against 900 ms. A 2-3 s trailing silence is the safer prior, or a semantic endpoint.
- **Fix.** Default push-to-talk or tap-to-toggle for every band. Offer open mic only when a headset is detected or after a short echo and noise calibration passes, and let a child opt in. Make 900 ms a measured parameter with a stated reversal (M-UT-9: mid-utterance cut-off rate by band, n >= 40), not a default.
- **Fix.** A visible "say it again" / "slower" control for every band, including L1 and L5 where there is no ledge to tap for replay (§8 ChalkLedge is the only replay path today). Gemini exposes speed control [V in §1]; Taxila has none.

### C3 (P0) Reward-economy creep is present, and it is the aliveness layer itself
The doc bans XP and streaks (§3) but re-admits the same mechanism as affect.
1. **Evaluative faces are a social reward contingent on correctness.** §4.4 allows "impressed, delighted, concerned" in her next turn. Delighted-when-right and concerned-when-wrong is a variable social reinforcer that teaches a child to read the teacher's face for a verdict, and it undercuts the covert-check premise (a child who sees the face change knows they were being checked). **Fix.** Key affect to effort and strategy ("tried a new way", "stuck and kept going"), never to correctness. Cap it at one warm beat per N turns (set N by measurement), keep intensity flat as accuracy rises, and make no face change for a wrong answer other than neutral curiosity. G-UT-3 gains a case: the same face program for a correct and an incorrect answer.
2. **Rapport-gated personality.** §2 row 10: "humour register widens with rapport." The teacher gets funnier and warmer the more the child comes back. That is a loyalty ladder. **Fix.** Register is set by band and by what is being taught, not by session count. Delete "grows with rapport" from §2 and the §12 decisions.
3. **Memory callbacks and "greets by name" as a pull.** Callbacks are good for continuity; as an opener on every launch they become a "she remembers you, don't leave her" lever. **Fix.** Callbacks only when they serve the lesson (a retrieval opener, per learning-science), never about the child's personal life ("How are your dogs doing?" is Lily's adult companion register, and the repo's child-safety floor excludes companion register for children).
4. **Progress stones `o o ● o o` in the top bar** (§5.2, §6.2) are a segmented completion bar with a collection feel. **Fix.** Replace with a single non-countable cue, for example the lesson's chalk-ledge items, or show nothing for B1-B2 (the teacher says where we are). Never a count that can be "broken".
5. **Arrival wave and smile every time** (§4.5) is fine once, but a ritual greeting that she performs with warmth every launch trains a daily-return habit. **Fix.** Greeting shortens and goes neutral after the first minute of a session and is skipped for a return within the same hour.
6. **Gaze, "lean-in", and "pondering" are fine** because they signal state, not approval.

### C4 (P1) Babyish for 10-15: the Older bands inherit a primary-school skin
- The chalkboard-and-classroom-corner identity, a persistent illustrated teacher face, and a PiP "close-up" that cannot be hidden in v1 (§5.3 says "never hidden in v1 pending M-UT-6") will read as a children's app to a 13-15-year-old doing exam prep, and Class 8-9 children compare it to coaching apps and YouTube, not to Ello. The cited uncanny-valley evidence (Brink 2019) is for young children; applying "illustrated only" to teens is an extrapolation, not a finding.
- **Fix.** Let Older children hide the teacher face from day one (it costs nothing, and the data from M-UT-6 then comes from real choices rather than a forced arm). Offer three presentation modes for B3-B4: face, face-small, and voice-and-board only. Make the board neutral dark with a tighter type scale, not "classroom". Drop the "karaoke" caption for B4 (plain subtitle line).
- **Fix.** The 3-4 choice rows (L1 Older) and "I know" chips are good; add "skip this" and "explain differently" as peer actions so a teen can drive. A 14-year-old should be able to say "I know this, test me" without three taps.
- **Fix.** Voice, not just look: a pitch-down option or a second, lower-register voice for B3-B4 so the same voice is not used for a 6-year-old and a 15-year-old. Keep the "one voice per character per lesson" rule, but let the character differ by band.
- Add a measurement: M-UT-10, Older perceived-age rating ("is this app for someone my age") by band, n >= 30 each, 5-point scale; a mean below 3 in B4 triggers a restyle.

### C5 (P1) Accessibility is almost entirely absent
The doc is rigorous about contrast and motion (§8, G-UT-7) and silent on assistive technology and non-speaking paths.
1. **Voice-only dependency.** Young children get the mic as the only primary control, with tiles appearing "after one miss". A child with a stammer, speech delay, selective mutism, a hearing loss, or just a loud house is failed on turn one. **Fix.** Tiles or a "tap instead" control present from the first turn for every band; answering by tap is logged as a modality preference, never as a miss or a low-confidence signal.
2. **Hearing.** Captions are "optional for fluent readers" (§0 item 5) and absent for pre-readers, so a deaf or hard-of-hearing child, or anyone with a phone muted in a shared room, has no equivalent for the teacher's speech. **Fix.** Captions on by default for every band; for R0 pair the caption with pictures (see C6). Provide a visible "quiet mode" for Young too (today it is an Older setting, §9).
3. **Screen readers.** No TalkBack or VoiceOver spec exists for the stage, the pointer, the turn ring or the tiles. A chalk circle that exists only as a drawn stroke carries information with no non-visual equivalent. **Fix.** Every cue has a text alternative announced in sync (the module element's accessible name); the turn ring has a state announcement; the layout's reading order is defined (caption, then canvas, then controls).
4. **Timing.** The pointer holds 1.5 s and the heard chip 3 s (§4.3, §5.3). Both are too short for a slow reader or a child needing to tap a 3-second target, and they fail the spirit of WCAG 2.2.1 (adjustable timing). **Fix.** The pointer persists until the sentence ends and stays until the child acts; the heard chip persists until the next turn begins, and tap-to-fix must not depend on a race.
5. **Pointer legibility.** A 3 px stroke is thin for low vision and on a 1.5x low-end screen in sunlight. **Fix.** 4-6 px with a halo, plus the engine's persistent `highlight` as the second cue (do not let the pointer be the only cue).
6. **Colour.** The marigold ring is the only turn signal. Colour-blind and low-contrast viewing needs a second, non-colour cue (thickness, a corner mark, or her lean-in alone is not enough). **Fix.** Ring plus a shape cue; add a grayscale screenshot to G-UT-6.
7. **Keyboard.** Single-key shortcuts (H, C, Space, 1-4, §6.3) collide with the typed-answer field and violate WCAG 2.1.4 (character key shortcuts). **Fix.** Only active when no text field has focus, remappable, and Space never toggles the mic while the field is focused.
8. **Motor.** The PiP drag has a tap twin (good); the mic needs no hold (good). Hit areas at 96 dp are fine; the ledge chips at 56 dp tall for Older are acceptable, and the tiles' 96-112 dp good. Add a drag-free alternative for any module gesture.
9. **11 px floor** (gurukul §6) is a floor for adults. For children, text in a lesson should be at least 16 sp body and 20 sp for R0-R1 captions. State the child floor in tokens, not only the 11 px.

### C6 (P1) Too text-heavy for 6-9
- The Young caption is a one-line karaoke strip plus ledge chips that carry words ("roti", "half" in two scripts). Classes 1-2 are R0 (cannot read, per the doc's own kids-ux bands), so for them the caption is decoration and the ledge chips are unreadable. The doc says "Young: no text echo (R0 cannot read it)" while still giving R0 a caption band (48 dp) and word chips.
- Mixed-script Hinglish karaoke is the hardest reading task in the product (open question 4 notes it but still ships it as a default). A phrase of ~25 characters in Devanagari at 24 sp does not fit one line at 360 dp (about 14-18 glyphs per line), so "one caption line" in portrait is an error: the portrait Young caption of 48 dp holds one line, while landscape allows two. Either the phrase is cut mid-clause (which defeats karaoke) or it clips.
- **Fix.** For R0-R1: pictures first. Ledge chips are images with an optional single label; the caption band shrinks to a icon strip (replay ear, slow turtle) when the child's reading level is R0. For R1-R2: one or two words at a time (the target word lit), not a phrase. Karaoke ships only after the Class 2-4 reading-accuracy measurement the doc lists as open question 4, and until then Young captions are word-level highlights, not phrase karaoke.
- **Fix.** The leave guard, the connection veil and every "heard" string must be icon plus spoken for Young; no reading required to exit or to recover from an error. State this as a gate: G-UT-10, every Young control is operable with no reading (all labels have a spoken equivalent and an icon).
- The disclosure (that she is an AI) should not rely on a label Young cannot read. M-UT-7 is a good measurement but it is the only mechanism; the child-safety floor says never deny being an AI, so disclosure must be spoken in the first lesson and on request regardless of the M-UT-7 outcome, not conditional on a failed test.

### C7 (P1) Low-end Android: the performance story has holes
1. **Reference device is not low-end.** G-UT-8 (≤ 33 ms p95 on a "2-3 GB device") is a mid-low phone. The Indian family-phone floor includes 2 GB and Android Go 1-1.5 GB devices with Mali-G52 or Unisoc GPUs, and Chrome there kills background tabs and iframes under memory pressure. **Fix.** Add a 1.5 GB Android Go device as the gate device and a memory ceiling (renderer plus module iframe plus audio under a stated MB figure).
2. **Layer count.** Teacher canvas (Rive WASM), sandboxed module iframe, pointer overlay, caption, WebRTC audio with echo cancellation and codec, all at once. The doc budgets time but never memory or bytes. **Fix.** Add a byte budget (Rive runtime plus rig, first module paint under a stated KB), a decode budget, and a rule: the pointer overlay is drawn inside the module iframe's own canvas where possible so there are fewer composited layers.
3. **Container queries on old WebViews.** Container queries need Chrome 105+; many budget phones ship an Android System WebView far behind and the Capacitor app inherits it. The doc's §7 mandates container queries with no fallback. **Fix.** Specify a ResizeObserver-driven class fallback (`data-family="phone|tablet|split|compact"`) as the primary mechanism and container queries as progressive enhancement; add a WebView-version row to G-UT-6.
4. **The "she never freezes" claim (§0 item 13) is only half true.** The face is local, but the audio is the product. WebRTC over CGNAT, 2G/3G and carriers that throttle UDP fails at connect time, not just mid-stream. The 1.2 s arrive animation cannot hide a token mint, ICE negotiation and first response on a poor network. **Fix.** Define a degraded lane: a turn-based mode (short pre-fetched or cached audio clips plus tap answers) that engages automatically when round-trip or loss crosses a threshold, with a stated bandwidth floor for the live lane. Replace "past 8 s offline card" with a staged ladder (4 s one-moment, 8 s tap-only mode, 20 s offline card).
5. **Shared-phone identity.** "The child taps their profile, and she is already there" treats a profile tap as identity; the repo law is that identity is an authenticated child id, never a device. A sibling tapping the wrong profile corrupts the learner model, and a spoken callback reveals one child's personal details to whoever is in the room. **Fix.** A lightweight confirm (picture plus a parent-set PIN for Older, a parent-held handoff for Young), a neutral opener until identity is confirmed, and no personal callback spoken until then.
6. **Mic permission and speakerphone.** Re-prompts on shared phones and in-app browsers are common; specify the denied-permission path (tap-only lesson) so it is a mode, not an error.

### C8 (P2) Evidence and consistency
- The teardown's evidence is adult products and marketing screenshots (the doc says so); the Older/Young splits (faceMin 64 vs 96, 900 ms, 3 s chips, 1.5 s pointer) are [I] guesses presented as tokens. Tag each token [I] in §8 and bind each to a measurement ID before it is treated as a constant.
- §0 item 6 says Older bands "may add a one-word label" for turn state, while §4.4 says no evaluative cues; fine, but nothing says what Young gets besides the ring and lean-in. Name the Young non-visual cue (a soft chime is itself an attention lever; prefer her spoken handover phrase shape, as notes, not lines).
- §12 decision 1 says reverse "if a B3-B4 test shows the call metaphor raises completion"; completion is the wrong metric for a product that bans engagement levers. Reverse on comprehension and independent practice, never on completion or return rate.
- M-UT-1 through M-UT-8 name n >= 20-50 children; state the ethics and consent route (guardian consent, no recording of child speech beyond the session, parent-visible) before any child-facing test.

### Summary of corrections to apply
1. Re-base layout budgets on 584 dp usable (web about 650 visible), add keyboard-open mode, use sp and min-content; add 360 x 584 and font-scale cases to G-UT-1/6/9.
2. Default to push-to-talk for every band; open mic only with headset or calibration; 900 ms becomes a measured parameter; add a universal "say it again / slower" control.
3. Remove correctness-keyed evaluative faces, rapport-gated personality, personal-life callbacks, progress-stone counts and ritual greetings; add the "same face for right and wrong" gate.
4. Let Older children hide the face from day one; add presentation modes, a second voice register, and a perceived-age measurement.
5. Add an accessibility section: tap-answer from turn one (never logged as a miss), captions on by default, TalkBack alternatives for every cue, persistent pointer and chip, 4-6 px pointer with halo, non-colour turn cue, safe keyboard shortcuts, child type floor (16 sp, 20 sp R0-R1).
6. For R0-R2: picture-first ledge and caption, word-level highlight instead of phrase karaoke until the reading-accuracy test, no-reading gate (G-UT-10), spoken AI disclosure independent of M-UT-7.
7. Low-end: a 1.5 GB gate device, memory and byte budgets, ResizeObserver fallback for container queries, a degraded turn-based lane with a staged stall ladder, identity confirmation on shared phones, a tap-only mode for denied mic.
8. Tag guessed tokens [I], fix the completion-based reversal condition, and add the consent route for child testing.
