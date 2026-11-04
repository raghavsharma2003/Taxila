# Round 7 build pipeline (2026-11-04)

Built from the 7-pillar gap map (`gap-map.json`: 180 items, each with status, evidence, what is needed, size) by workflow wf_f8ed24e3-497, then corrected by its completeness critic and the main loop's decisions (sections at the end). **Build first: no stream does safety, compliance or test-battery work** (CLAUDE.md, dc-owner-2026-10-27-build-first). Unit tests and gates run on every code change.

## What a child can do end to end today

- Production is still 14.4.2 (taxila-web--sac4e8e8-3x6d, ac4e8e88). int/r6 @050897ab (14.4.3 plus the 2026-10-27 stream merges) is green on CI but not deployed. What follows is what the int/r6 code does; production behaves almost the same.
- Parent path: Volt landing, then a 5-step email/password set-up (class, board, language with voice samples, promises, consent, child name and PIN), then handover, then Hello (greeting clip, AI card, interests, mic check), then lesson 1. The board is stored and never read. Nobody asks which chapter the school is on, and no placement round runs.
- Child Home (Kaksha, the default for everyone) shows her face, a greeting and one Start. A plain Start teaches the next unlearned topic of the first subject in maths, science, EVS, English, Hindi, SST order, starting from a calendar-estimated chapter. In practice that means maths every day. Notebook, Ask, Practice and Me exist, but no Kaksha screen links to them.
- The lesson runs on the Director lane over cascade voice. She hooks, then explains only the topic's FIRST skill in 18-25-word turns with no board. A worked or faded example follows, with English steps even in Hinglish lessons. Practice uses verified kit items graded against blind-solved keys, and a misconception is re-taught a different way. Skills 2..n get one short explain turn, and practice hops between skills. Openers match the class only where a measured ge exists (classes 4-7, about 30% of items); every other child is treated as on-track. A right answer to her own teaching question ('160?') earns nothing.
- Talking is tap-to-talk for every child. Hands-free D5 duplex is built, but only for an owner cohort whose hash matches no guardian (ms-r4-owner-cohort-wrong-email), so even the owner got tap. Her reply is audible about 4.2 s p50 after the child stops. She speaks as Diya DragonHD, lip-synced on the chibi r8 puppet. A class-4 child gets the 'young' register (18-word turns, Golu/Bittu) and the young look.
- Conversation: 'another example', 'slower', 'Hindi mein', 'show me', 'harder' and 'skip' take effect in the same turn. An off-topic ask is parked and brought back only if the model note arrives in time, and parked items never appear on screen. 'End the lesson' gets one warm check-in (carry on / short break / stop). 'Stop' ends with a goodbye and no recap, and 'break' is only a spoken stretch line. Parent limits are checked only at Start.
- Content: on explain and visual turns a whiteboard is drawn. It often lands a turn late (production board p90 about 5.7 s), it is sometimes a generic English flowchart, and while it builds the stage shows 'Asha is making this for you'. 'Game khelna hai' opens a solver-checked 2D family game, or Antariksh 3D, on 74 of 830 topics (classes 4-7, mostly maths); otherwise she offers the lesson's own activity or says honestly that no game is ready. Fraction topics get a skeleton activity. None of the 41 Studio v2 engines or 385 authored topics reach a child. There is no animation, and real pictures go to a cohort only. Speaking to a game also grades the hidden lesson card.
- End of lesson: a Debrief (what you did, now secure, next), then the World/Base and Hangar cosmetics, which unlock only for secure skills. Parent corner: a claim-gated daily and weekly report with 'How do we know?', progress, lesson cards and controls (with native time and date pickers). Nothing is sent outside the app.
- In short, a child can tap and talk through one correctly graded maths lesson. It is nowhere near the OWNER-RESET bar: no hands-free talk, thin one-skill explanations, almost no moving content, a babyish register at class 4, one subject, and a 4-second wait for her voice.

## Streams

### A. Teacher brain: lesson flow, explanation and conversation (branch claude/r7-brain)

**Goal.** She teaches like a great human tutor. Every skill is explained in staged, board-synced steps at the child's class level and in a register suited to 9-15 year olds. Each explanation is checked with a keyed question whose answer counts. Steering and diversions are followed and shown on screen, stop requests and parent limits are handled gracefully, and one LLM-led lane runs on code-enforced protocols. This covers OWNER-RESET #1, #2, #5, #6, #7, #8 and #12.

**First milestone.** About day 5, on staging: three recorded class-5/6 maths lessons on 2-3-skill topics. In them she sounds like a preteen tutor (no Golu or Bittu, no babyish shapes). She teaches each skill in turn (explain, worked example, her check question, practice) instead of hopping between skills. The first questions sit at class level. A right answer to her check question ('160?') is acknowledged and counted. 'Cricket ke baare mein baat karein?' is parked, sent to the screen as a Later item and brought back before the wrap. The owner reads the transcripts and a screen recording. The main-loop Claude judges them against OWNER-RESET #1, #2, #5, #6 and #12.

**Owns.** server/director/** (except server/director/session/**); server/brain/** (turn.js, say.js, kernel.js, propose.js, supersede.js, beat.js …); server/compiler/** (incl. characters/*); server/conversation/**; server/agent/**; server/relational/**; server/lesson/**; server/grading/**; server/persona/**; server/signals/**; server/ui/**; server/routes/lesson.js (single owner; others send patches); shared/contracts.ts (SINGLE OWNER for the whole pipeline); shared/bands.ts; shared/brain.ts; shared/relational.ts; shared/signals.ts; NOT the frozen safety files: server/safety/**, the floor and safetyStrings (owned by nobody)

**Depends on.** F Learning: learner-view θ/weak export and minutes-left read (day 1-2), then the per-skill `explain` kit fields (the workflow, after the owner approves spend); C1 Studio: board-first steps for the explain beat; E App: renders the later/moment/steer directives (rendering only; does not block A's milestone); B Voice: heardUpTo from the client and a TTS path that takes a clause stream

**Needs Azure to build/verify.** True

**Items, in order:**

1. 1. brain-age-register (M): build one band table from shared/bands.ts: young for classes 1-3, preteen for 4-6, teen for 7-9. Each band sets turn length, examples from the child's world, a protégé who is a peer rather than a toddler, and the help style. Use the same band in agent/prompt.js. learner/model.js ageBandFor changes by patch to Learning.
2. 2. brain-teach-every-skill (M): a per-skill arc. Hook, then for each skill: explain, a worked or faded example on THIS skill, a keyed check and a practice block. Then mixed practice and teach-back. Guidance level comes per skill from the ledger, and a lesson resumes at the first skill that is not solid.
3. 3. brain-teaching-question-evidence (M; same item as learning-teaching-question-evidence): the question that ends an explanation becomes a code-chosen keyed micro-item posed as the card. '160?' is credited. A bare 'haan' closes the question with a one-line answer. TAXILA_ACK_CLOSE defaults to on.
4. 4. brain-level-calibration (L), plus the Director side of learning-level-from-demonstrated-ability: feed strand θ and the weak flag into buildPracticeQueue and selectNext, choosing items at P(correct) 0.7-0.85. Wire fastForwardSkips, testedOut and harderThan. Add a class-demand (NCERT class-C) note to the hook and teaching-question shapes.
5. 5. brain-explanation-plans (L): a multi-turn explain beat of 2-4 steps, each with one board step through Studio's board-first path and a micro-response from the child between steps. Explain and worked turns get 40-50 words for B3/B4 if the owner agrees. The beat reads the kit's per-skill `explain` plan from Learning and falls back to the kit's worked example until that plan exists.
6. 6. brain-later-list-visible + brain-parked-promise-tracking (M+S): add UiDirectives.later and ui.moment (park / detour / decline / stop_check / returned) to shared/contracts.ts. A tap on a parked question becomes a request. A promise predicate on her own line adds the item to s.later, so it is kept before the wrap.
7. 7. brain-steering-persistence + brain-weak-intents (M+M): a code-first method lexicon ('step by step', 'chhota bolo', 'pehle picture', 'khud try karne do', 'dheere'). Preferences are rendered LAST and never shed, and they map to move knobs (visual-first, attempt-first, word cap). Product-policy fixes for multi-intent, frustration (change the approach, never re-pose), slower, animation request, skip-ahead and personal share.
8. 8. brain-diversion-robustness (M): a code-first off-lesson reader (cricket, BGMI, films, pets, food, off-kit why/how questions, Devanagari forms). Start the note on the prefetch partial. Add alsoPark on the code path, and a bounded 1-2 turn side chat as a policy option.
9. 9. brain-stop-wrapup-break + brain-parent-limits-midlesson (M+M): a 'wrap up in 2' chip; a one-line recap on stop; a real break with a server pause state and a 'we were on X' resume. Add a per-turn conductor-guard proposer at parent rank on both lanes, covering minutes left, lesson hours and bedtime, with a heads-up, a wrap at the next boundary and a hard cap. Learning supplies the minutes-left read.
10. 10. Director-side latency (L, joint milestone with Voice): voice-first-sound-latency parts (a) and (d), plus the classify fast path from platform-hot-path-latency-infra. Stream the Director reply with clause-by-clause guards so the first guarded clause goes to TTS while the rest is written. Decide 1-3-word answers in code. Keep note and classify under about 700 ms on the hot path.
11. 11. voice-interrupt-awareness (server side) + voice-cut-in-moves (Director moves) + voice-edit-undo-on (M): heardUpTo marks the unsaid tail of her line and gives an 'interrupted after X' fact. Add moves and shapes for word_search_cue, question_to_her and off_task_drift (which parks via the Later list). Set TAXILA_EDIT_UNDO on by default.
12. 12. brain-lane-decision-hybrid + brain-agent-lane-protocol-gaps (L+L): expose items 2-9 as code tools and events (answer.check, item.next(θ), later.park/due, the stop protocol, a limit event, intake, relational notes) and use them on BOTH lanes. Fix the agent's yes-on-no and its read accuracy (64% against the Director's 74%). Run a Claude-judged side-by-side with a turn-time read, then set the default lane.
13. 13. brain-lesson-planner-beats (L): planLesson and planBeat with beat exit rules, re-plan triggers and a 1-2 beat lookahead that emits StudioIntents with neededAtMs to Studio.
14. 14. brain-ask-homework-flow (M): an Ask beat that puts their problem on the board, gives the method steps (never the answer), poses a kit-verified isomorph as the card, and writes a summary titled with their question. Learning owns the photo and extraction lane.
15. 15. Apply incoming patches promptly: voice-talked-not-read (SPOKEN_NOTE and the uptake-question exemption, authored by Voice); studio-board-pointing-truth (the drawAsked pointing rule and the after-board check on request turns, authored by Studio); gameAct handling in turn.js and classify (authored by Games); parallel reads in /api/lesson/start (authored by Voice); session-first and placement start hooks in routes/lesson.js (authored by Learning).
16. 16. brain-director-flag-debt (M), after the lane decision: settle the flag defaults, delete the off-paths, split state.js by phase, and cut the guards to a small set that rewrites naturally instead of stripping.
17. 17. Later: brain-relational-memory-milestones (L), brain-experiments-longarc (L).

### B. Voice: hands-free duplex, the ear and first-sound latency (branch claude/r7-voice)

**Goal.** Every child talks hands-free from her first word, with no tap button. She really hears short Hinglish answers, her voice starts about 1.5 s after the child stops, she backchannels and yields like a person, never talks over a thinking child, and sounds talked, not read. This covers OWNER-RESET #5, #10, #13 and #16.

**First milestone.** About day 5, on the owner's own phone: tap Start and she speaks and listens hands-free from her first line, with no Talk button. Short answers ('saat hai na', 'teen बटा चार', 'tees didi', 'haan') are heard, not re-asked. Barge-in stops her within 500 ms. An uptake or continuer sounds within about 1 s of the child stopping, and the reply's first sound reaches p50 of 2.5 s or less (a step toward 1.5 s), measured on 20 real turns with evals/latency/turn-e2e.mjs.

**Owns.** src/duplex/**; src/voice/**; src/voicesig/**; src/latency/**; src/lesson/** (runtime.ts, cascadeLink.ts, ttsStream.ts, outbox.ts, realtime.ts, voiceLink.ts, uiBridge.ts, adpcm.ts): single owner of runtime.ts; src/child/lesson/headset.ts; src/pages/LessonDev.tsx; server/duplex/** (incl. a new semantic and partial route table); server/voice/**; server/voicesig/**; server/latency/**; server/routes/voice.js; server/routes/tts.js; evals/duplex-2026-10/**; evals/latency/**; evals/relational-human/first-sound.mjs

**Depends on.** A Brain: streamed, clause-guarded Director reply (Brain item 10); Director moves for cut-ins and interruption facts; E App: hands-free dock UI and the prefs.ts default; D Face: puppet off the main thread (for start latency); G Platform: staging app; the India D5 relay deploy (platform-d5-relay-in-india); C1 Studio: buildIntentLauncher consumer for /api/duplex/partial

**Needs Azure to build/verify.** True

**Items, in order:**

1. 1. voice-handsfree-default (M): TAXILA_DUPLEX=on and lane D5 for every consented child in classes 1-9. The cohort becomes an override, not the gate, and authorizeD5 drops its cohort check. Remove the tap default and the headset rule (prefs.ts by patch to App). The fallback order D5, then D4, then PTT, then typed stays invisible, and the kill switch stays. This also confirms voice-duplex-engine-d5, which is built, on the owner's own phone.
2. 2. voice-d5-ear-asr (M): use streaming transcription inside Voice Live (gpt-4o-transcribe or taxila-live-transcribe), or add a second ear that re-transcribes the device clip of any burst finalised empty before re-asking. Pass a per-lesson phrase list (kit terms, numbers, the child's name) on D5 and D4. Feed the deltas into EngineHost so the eager end of turn and the prefetch fire early.
3. 3. voice-handsfree-from-first-line (S): open the mic and the D5 stream in parallel with POST /api/lesson/start, using the prefetched config. Ask for mic permission in Hello. No visible switch from tap to hands-free.
4. 4. voice-first-sound-latency (b, c, e) (L): the turn-audio fold defaults on; the uptake echo or continuer is the first sound on every lane, D5 included, for every child; perceive starts on D5 deltas. Measure with evals/latency/turn-e2e.mjs and first-sound.mjs. The streamed Director reply is Brain item 10.
5. 5. voice-verdict-hold-retune (S): hold only the clause that carries the verdict, never her first sound.
6. 6. voice-talked-not-read (M): port docs/research/voice/v4/talking-rules.patch onto today's tree. Send the compiler, director and character parts to Brain as a patch; do the dhd and moment parts here. Drop the 'brisk' PACE_DELTA, which had no effect.
7. 7. voice-backchannels-audible (M): in-context Diya 'hmm / haan / achha' takes, played by a clip player into her output node so the AEC cancels them. audioBackchannel on D5 at BOPs. The after-stop continuer for every child, D5 included. Nod rate at or below 2x human.
8. 8. voice-interrupt-awareness, client side (M): PcmStreamPlayer and the clause events report the audible word at stop, heardUpTo is sent on the next turn, and captions show only what was said.
9. 9. voice-semantic-estimator, then voice-cut-in-moves on the engine side (M, then L with Brain's Director moves): POST /api/duplex/semantic; flags.semantic for open_explanation, question_to_her and chit_chat; retune EXPLAIN_SENTENCE_CAP and the backstop to about 1.2 s; enable cutIn on D5.
10. 10. voice-game-audio-reference (M): one lesson audio bus, with play and Studio sound summed into the D5 reference channel. Module iframes post their sound events or are muted while the mic is live. Games applies the src/play/core/sound.ts change by patch.
11. 11. voice-duplex-build-intents (M): a slim /api/duplex/partial route (BuildIntents plus safety only) fed by D5 deltas into Studio's buildIntentLauncher.
12. 12. voice-start-latency (M): the start-audio fold defaults on, and her opening line is prewarmed for the planned topic while the child is on Home. Parallel reads in /api/lesson/start go to Brain as a patch. The puppet's raster cost is Face item 2.
13. 13. voice-human-elements (M; needs the owner's Omni answer): a licensed laugh, breath or thinking hum via Diya's DragonHD Omni sibling, behind the governor's rate caps.
14. 14. voice-target-speaker (L): ephemeral on-device speaker matching if the owner approves X3; otherwise a TV/background-speech classifier on the D5 residual.
15. 15. Later: voice-pace-across-sessions (M), voice-same-voice-failover (S), voice-echo-filter-residuals (M), voice-tts-transport Opus (M), voice-voicesig-acting (M), voice-realtime-lane-retire (S), voice-d4-fullduplex-aec (L), voice-trained-floor-model (XL).

### C1. Studio: live board, cinematic explanation and speculative build (branch claude/r7-studio)

**Goal.** Every lesson is visibly rich. Boards land with her words and look made, motion explains, and the Studio v2 explainers already authored reach children. Pieces appear every 1-2 minutes, chosen ahead from the lesson plan and from what the child is saying. The child never sees build state or a failure. This covers OWNER-RESET #4, #9, #12, #14 and #17.

**First milestone.** About day 4, as screen recordings on a 412-px phone and a laptop in class 4-7 lessons: authored Studio v2 explainers and games now appear (the board twin on 360 px). Nothing ever shows 'Asha is making this'. On three maths explain turns the board draws in step with her words through the board-first path, and at least one board moves: an animated fraction split or number-line jump.

**Owns.** server/studio/** (seam.js single owner, archetypes, qa, picture.js, router, library); server/stagecraft/** (incl. a new policy.js); server/forge3/** except live.js, play-cert.js, certs/play.json, certs/modules.json; server/forge/** except server/forge/g2/**; server/routes/studio.js; server/routes/forge.js; src/studio/**; src/studio-v2/**; src/stagecraft/**; src/modules/whiteboard/**; shared/whiteboard.js; shared/studio.ts; shared/studio-spec.ts; shared/studio-spec-ext/**; shared/stagecraft.ts; shared/forge.ts; data/studio-catalogue/**; data/studio-truth/** (new); evals/studio-catalogue/**; infra/studio-qa/**

**Depends on.** A Brain: applies the pointing patch; beat lookahead for feedPlan (week 2); B Voice: /api/duplex/partial deltas (week 2) and the client first-clause hold; Owner: Studio v2 per-device sign-off; spend for gate services, pictures and library seeding; G Platform: staging app for the recordings

**Needs Azure to build/verify.** True

**Items, in order:**

1. 1. app-studio-no-build-state (S): remove the 'Asha is making this for you' chip, the pencil skeleton, the streamed-partial veil and the 'ready' sparkle from src/studio/StudioStage.tsx. Keep the previous piece or a calm board until a finished piece is ready.
2. 2. studio-v2-device-class-serving (S; needs owner sign-off to amend dc-r4c-studio-v2-off-child-path with its reversal): serve a Studio v2 piece wherever it is certified at the device's class (p412, l1366), keep the board twin on p360, and regenerate certs/catalogue.json serveByViewport.
3. 3. studio-board-pointing-truth (S): author the drawAsked pointing rule and the after-board check on request turns as a patch to Brain (shapes.js, turn.js). She points only when a board is certified to land before the clause.
4. 4. studio-board-timing (M): move more asks onto the board-first rung, prewarm planWhiteboard on the beat lookahead, read /api/studio/wb-timing in production, and let the client hold her first clause briefly when a certified board is milliseconds away (that part by patch to Voice).
5. 5. studio-board-richness (L): turn beat cards on. Add code primitives: labelled diagrams with leader lines, geometry by constraint, true-scale charts, India/world map places, timelines, tables. Labels in Devanagari or Hinglish per the lesson language.
6. 6. studio-whiteboard-motion-ops (L): ops for move, rotate, scale, morph, path-follow, fill sweep, fraction split, camera zoom/pan, and step markers bound to her clauses, implemented in Player.tsx with reduced-motion forms and covered by the W gates. Add code-authored motion templates for common c4-7 maths and science topics.
7. 7. studio-gate-services-wiring (S; owner spend OK at about ₹75/day each), then studio-live-frame-verdict (M), then studio-stagecraft-spec-verdict (M): live frames and generated specs carry a per-viewport verdict so they can ever be revealed.
8. 8. studio-archetype-truth-packs (L, run as a short workflow), then studio-skeleton-legibility-certs (M): verified truth packs for the 10 non-fraction archetypes, so prefetch works beyond fractions, and certificates for all 12 skeletons.
9. 9. studio-stagecraft-sources-unfed + brain-studio-intents-from-conversation (L): a pure policy module at server/stagecraft/policy.js. feedPlan comes from Brain's beat lookahead, buildIntentLauncher from Voice's /api/duplex/partial, plus feedSignal and feedStageRequest. Candidates are invalidated on a topic switch or diversion.
10. 10. studio-stagecraft-rungs-unwired (M): inject the image rung (picture.js plus moderation), the live-codegen race and the library lookup into productionDeps. Give spec builds a dedicated deployment.
11. 11. studio-cadence-frequency (M): re-tune STUDIO_LIMITS toward a measured piece every 1-2 minutes, re-prefetch on each skill or beat change and on a detected misconception, and log pieces per lesson.
12. 12. studio-pictures-everyone (M; owner OK): the picture path for everyone, a Blob picture library keyed by subject, and illustration packs per topic.
13. 13. studio-v2-portrait-relayout (XL): a portrait design size for the Studio v2 host and all 41 engines, re-certified at 360, 412 and 1366, then the tray rule returns to 'all three'.
14. 14. studio-library-seed-promote (L; spend cap from the owner, reviews by Claude).
15. 15. studio-made-for-you-replay (M): a replay route and bundles for made pieces (play, skeleton, frame, stagecraft, board script). App renders the shelf and the Notebook entry.
16. 16. studio-agent-build-tools (M, after the lane decision): game.make and animate.make tools that nominate Stagecraft candidates; server/agent/tools.js changes by patch to Brain.
17. 17. Later: studio-archetypes-expansion (L), studio-cinematic-clip-library (XL), studio-minisites (L), studio-classes-8-9-and-1-3 (L, with Games for play rules). Confirm studio-live-board-pipeline, which is built, on a phone.

### C2. Games and interactives that teach (branch claude/r7-games)

**Goal.** Real games where the skill is the mechanic (action, physics, strategy, timing, simulation), levels built per child by code, for most topics and every subject, with the 3D engines live. They are not quizzes in costume (OWNER-RESET #3, #14).

**First milestone.** About day 5, played by the owner on his phone. Saying '1/3' to a game moves the game, not the hidden lesson card. Khand's 3D voxel engine runs the nazariya topics on a mid-range Android. About 10 new real-time-mechanic levels for previously uncovered class 4-7 maths topics (e.g. measurement, angles, data) open from 'game khelna hai' inside a lesson.

**Owns.** server/play/**; src/play/** (incl. core/sound.ts, engines/registry.ts, engines/khand/**, families/**); src/modules/** except src/modules/whiteboard/**; data/play/**; data/arena/** (new); shared/play.ts; shared/engine-catalog.js; shared/engine-topic-map.json; server/forge3/live.js; server/forge3/play-cert.js; server/forge3/certs/play.json; server/forge3/certs/modules.json; server/forge/g2/**; server/routes/modules.js

**Depends on.** A Brain: applies the gameAct patch; B Voice: applies the runtime.ts patch; the audio-bus API for game sound; C1 Studio: per-device Studio v2 serving (for the language/SST specs); Owner: ITEM-ARENA/MEASURE revival and which wave-3 engine comes first

**Needs Azure to build/verify.** False

**Items, in order:**

1. 1. studio-game-utterance-double-turn (S): PlayStudioRenderer acknowledges the utterances its grammar consumed. The runtime.ts change goes to Voice as a patch; TurnRequest.gameAct in contracts.ts and its handling in turn.js go to Brain as a patch. Talking to a game never grades the hidden card again.
2. 2. studio-khand-3d-register (M): certify Khand's 3D cells at 3 sizes for both bands, add the Khand EngineEntry to registry.ts, and verify the core3d tier fallback on low-end phones.
3. 3. studio-play-coverage-expansion (XL): new rules in server/play/tools/rules/*.mjs and family logic for the uncovered class 4-7 maths topics (measurement, geometry, data, patterns, integers, algebra), then the science laws. Regenerate coverage.json, certify the art, and track coverage per class and subject.
4. 4. studio-wave3-realtime-engines (XL): the first core3d@1 engine is the one the owner picks. Recommended: E6 Yantra, science puzzle-physics over the Kyun-Lab laws, because science and SST asks end in boards today. Each engine comes with its exact law, the economy lint (fast action only on secure skills), a voice grammar and certificates.
5. 5. studio-item-arena-parked (L; if the owner revives it): apply the salvaged wip patches, rebase, finish the 3D arena on core3d, and register it. It must stay a real game.
6. 6. studio-language-sst-interactives (XL): play families with real mechanics for English and Hindi (word building, sentence ordering, rhyme and rhythm, read-along) and SST (map placement, timeline ordering, town sim). Also serve the authored Studio v2 language/SST specs once C1's per-device rule lands.
7. 7. studio-module-engines-gaps (L): drag in the frame kit, bridge v2, the three fading stages, the missing engine modes, a mass/volume measure tool keyed by unit in planEngine, and a predict hide for fraction-bars.
8. 8. studio-khand-measure-parked (M): grams/kg MEASURE mode from origin/claude/r4-khand's wip patch.
9. 9. Later: studio-g2-delivery (L). Confirm studio-play-pipeline, which is built, on a mid-range Android.

### D. Teacher presence: the face (branch claude/r7-face)

**Goal.** One grown-up Asha, the same person on every surface. She never swaps to another face on failure, never slows the lesson on a weak phone, and moves toward the owner's option-4 look at the 4.5/5 bar (OWNER-RESET #1, #13, #18).

**First milestone.** About day 3. No lesson ever swaps her to a different face: r8 holds its own still on every forced failure (no WebGL2, timeout, kill switch). On a throttled low-end phone profile, Start to first sound with the face is within about 300 ms of ?puppet=0. The owner has seen lamp2 in his own account and given a verdict, which chooses the rig route.

**Owns.** src/face-puppet/**; src/avatar/**; src/ui/teacher/**; server/face-puppet/**; server/routes/tutor.js; public/face-puppet/**; public/assets/teacher/**; public/assets/teacher-candidates/**; public/assets/gen/teacher/** (new); public/assets/gen/protege/**; public/audio/hello-*; art/character/**; scripts/character/**; evals/face-puppet/**; shared/tutors.js; shared/tutors.d.ts

**Depends on.** Main loop: re-key TAXILA_FACE_LOOK_FOR to the owner's real guardian (day 0); Owner: lamp2 verdict and rig route / artist budget; E App and F Learning: apply the greeting, landing and onboarding face patches

**Needs Azure to build/verify.** False

**Items, in order:**

1. 1. face-r8-fallback-swaps-person (S): holdsOwnStill is true for r8, so every fallback (pre-reveal failure, kill switch, puppet off) shows her own rest poster. Remove Asha's Plate2D/M0 fallback path and update the tests.
2. 2. face-puppet-raster-cost-main-thread (M): a static tier gate from tier.ts detectStaticFacts (software raster or bad GPU gets the poster plus a light mouth). A raster-aware governor (rAF interval, long tasks). The frame loop moved to an OffscreenCanvas worker for both rig kinds. Defer the live stage until her first audio, then remove TURN_HOLD_MS.
3. 3. face-lamp2-owner-review (S): once the main loop has re-keyed the cohort, the owner sees lamp2 in his own account and watches the lamp2-vs-r8 clip; record his verdict in context/.
4. 4. face-grownup-asha-rig (XL): build the route the owner picks. Before his answer, prototype route (b), a 2.5D layered head in-house, and raise lip spread to at least 80% within ±50 ms (schedule.ts). Judge it against r8 on the same panel with Claude as the judge.
5. 5. face-stills-and-character-record (M): render the rig's stills headless, painted pose stills for poses the rig cannot do, public/assets/gen/teacher/asha/*.webp, and stills and pronouns in shared/tutors.js.
6. 6. face-prerendered-clip-visemes (S): a viseme and word sidecar for the Hello and language-sample clips, anchored to audio time.
7. 7. face-home-daily-greeting (M): a daily greeting endpoint in server/routes/tutor.js; the KakshaHome Comms wiring and the Start glance go to App as a patch.
8. 8. face-teachback-protege-staging (M): the protégé sprite and a 'protege' gaze target for the young band; the 'Bittu' framing for older bands.
9. 9. face-onboarding-meet-face (S, patch to Learning's src/onboarding) and face-landing-teacher-hero (S, patch to App's landing), after the look is settled.
10. 10. face-legacy-and-asset-cleanup (S): move teacher-candidates and the rejected GLBs out of public/, and delete the shims.
11. 11. Parked until the owner says otherwise: face-3d-selectable-tutor (XL), face-teacher-choice (XL), face-child-names-teacher (S). Confirm face-lesson-puppet-pipeline, which is built.

### E. Child app and lesson shell (branch claude/r7-app)

**Goal.** A mature, game-grade app for ages 9-15. The lesson is a stage-first, hands-free shell where content is the hero and her face is a PiP, with steer chips, a Later tray and designed stop moments. Navigation reaches every screen, class 4 gets the older look, and every setting actually changes the lesson (OWNER-RESET #1, #3, #8, #10, #12).

**First milestone.** About day 5, on a 360x800 phone on staging. In a lesson the board or game is the biggest thing on screen and her face is a PiP. The steer chips ('diagram dikhao', 'game', 'alag tarah se', 'kuch aur') work. A parked question shows as a Later pill and returns in the Debrief. Home has a dock reaching Notebook, Practice, Ask and Settings. A class-4 child gets the older night look with typing. The owner taps through it himself.

**Owns.** src/child/** (Desk.tsx, AnswerDock, sheets, useDesk.ts single owner, screens, prefs.ts, chrome.tsx, routes.tsx, voice.ts) except src/child/lesson/headset.ts; src/ui-v3/** except src/ui-v3/Scheduler.tsx and src/ui-v3/schedule.ts; src/app/** (Who, landing, routes, staleBuild); src/ui/** except src/ui/teacher/**; src/stage/**; src/copy/**; src/styles/**; src/main.tsx; index.html; public/manifest.webmanifest; public/site/**; public/assets/gen/avatars/**; public/assets/gen/interests/**; data/kaksha/**

**Depends on.** A Brain: contracts.ts later/moment fields (day 1) and their server emission; B Voice: hands-free default and the duplex states for the dock; F Learning: plan states (homework, test window, made-for) from /api/child/plan; C1 Studio: replay bundles for the Notebook and Debrief made-for strip; Owner: class 3/4 look, stage-first layout, Home dock, avatar replacement

**Needs Azure to build/verify.** False

**Items, in order:**

1. 1. app-nav-unified (M): one Kaksha navigation model, a HUD dock or rail on Home and the World (Notebook/Log, Practice, Ask, Settings), consistent back/home, and no classic OlderNav in child mode.
2. 2. app-lesson-stage-first (L): a Kaksha lesson shell in src/ui-v3/kaksha/lesson/ wired to useDesk's DeskModel. One letterboxed artifact slot is the largest zone on every geometry, her face is a PiP on phones and a tile on wide screens, and the question is a HUD strip. The Desk's measured layouts, the sheets and the safety floor are kept as they are.
3. 3. app-lesson-steer-chips (S): 3-4 chips (diagram, a game, explain differently, something else) sent through runtime.tapChip with the request ids the Director already reads. Free typing allowed on number items.
4. 4. app-lesson-moments-later (M): render Brain's ui.later and ui.moment as moment cards (parked / detour / decline / stop check-in with keep going, short break, wrap up in 2, end), a Later pill and list, and Pause → End leading to the check-in instead of an instant end.
5. 5. app-handsfree-dock (S): a listening readout, a live mic level, mute/unmute and a 'she will wait' cue; tap-to-talk only as the visible fallback.
6. 6. app-class4-older-look (M): class 4 (and class 3 if the owner agrees) moves to the older family, with the night theme, typing and Ask open. Young supports become settings, and the help menu no longer covers an activity.
7. 7. app-home-plan-states (M): homework, test_window, done (DidCard plus made-for strip) and parked questions, still with one CTA, using Learning's plan states.
8. 8. app-cold-start-loading (S): a Volt first paint for /c/*, /who, /start and /parent, branded loading in the shells, and manifest colours set to --k-void.
9. 9. app-me-settings (M): Kaksha Settings whose rows change the lesson (captions, sounds, haptics, Desk text size, reduced motion, face mode, hands-free and mute default, type instead), plus 'What Asha remembers' with Forget.
10. 10. app-practice-entry (S), app-ask-voice (M), app-notebook-log (M, with Studio's replay route), app-debrief-made-later (S).
11. 11. app-identity-avatars (M): a Volt callsign/emblem drawn in code replaces the painted animals, if the owner agrees.
12. 12. app-secondary-screens-kaksha (L): Hello, Who, Notebook, Ask, Me, Teacher, Practice and the hold/offline states rebuilt as native Kaksha views.
13. 13. app-world-hangar-depth (L), app-motion-transitions (S), app-landing-refresh (S, after the shell and hands-free land).
14. 14. Later: app-design-system-consolidation (L). Confirm app-kaksha-core, which is built, on a ₹10k phone.

### F. Learning engine, Conductor and parent corner (branch claude/r7-learning)

**Goal.** The right subject and the right topic at the right level every day, as a tuition teacher would choose it. The child just starts, the school's position and timetable steer the plan, placement and θ set the level, kits work in Hinglish and Hindi, parked questions and promises survive between lessons, and parents get deep reports and controls that work. This covers OWNER-RESET #2 and #11 and the CLAUDE.md Conductor and report vision.

**First milestone.** About day 5, on staging with the test clock. Over three consecutive 'days', a plain Start teaches maths, then science, then English, following the timetable the parent entered with the new custom day/time controls (no native pickers). The parent sets 'school is on chapter 6 in maths' and the next maths lesson starts there. Brain's lessons receive the child's θ.

**Owns.** server/content/**; server/learner/**; server/placement/**; server/comprehension/**; server/conductor/** (incl. handlers.js; Platform's notify handler arrives by patch); server/reports/**; server/director/session/**; server/routes/parent.js; server/routes/child.js; server/routes/account.js; server/routes/placement.js (new); shared/learner.ts; shared/interests.js; data/curriculum/**; data/kits/**; data/kits-relevel/**; data/placement/**; evals/content-level-v2/**; src/parent/**; src/onboarding/**; src/ui-v3/Scheduler.tsx; src/ui-v3/schedule.ts

**Depends on.** A Brain: applies the start-route patches (session-first, placement warm-up) and consumes the learner-view exports; E App: renders the Home plan states and the Hello preferences; G Platform: Notifier infra for report delivery; migration-number reservations; Owner: spend caps for kit and generation workflows; session-first default; personalisation persistence; RBSE scope

**Needs Azure to build/verify.** True

**Items, in order:**

1. 1. learning-subject-rotation (M): a per-child school timetable (parent-entered and learned from intake). Conductor planDay writes slot.subject and slot.topicId in priority order: timetable, then test window, then due reviews, then the least-recently-taught subject. nextTopicForPlan reads the slot; sessionStartCtx gets today's subjects.
2. 2. learning-school-pointer-input (S): a 'school is here' chapter picker in onboarding and in parent Progress (POST /api/parent/school-chapter, plus a Conductor school event), a child-side intake chip, and 'your class is here' on the map.
3. 3. app-datetime-controls (S): restyle Scheduler.tsx (TimeRail, DateStrip, TimeGrid) to Volt calm and replace the native HoursFields in Setup.tsx (which Controls imports) and the test-window date inputs. Native pickers are gone (OWNER-RESET #11).
4. 4. Learner-view exports for Brain (S, day 1-2): strand θ, the weak flag and minutes-left-today (child_controls plus the Conductor slot) as pure reads Brain consumes.
5. 5. learning-kit-hinglish-hindi-forms (L, run as a workflow after owner spend OK): complete Hinglish and Devanagari forms for the 293 census items, steps_hi/fadedVersion_hi on every worked example, and Devanagari prompts. In the same pipeline, add NEW per-skill `explain` plans (concrete, pictorial, symbolic steps; an anchor example with blind-solved numbers; an analogy; the misconception to pre-empt; a board script) and a worked example per skill for Brain item 5. Pilot on class 4-7 maths.
6. 6. learning-placement-wiring (M): apply rs6 patches 03/04 (route plus migration), run the lesson-1 game-like warm-up (start hook by patch to Brain), feed initialBase/startGE, and fill the parent 'where your child is starting' screen.
7. 7. learning-session-first-for-all + brain-session-first-intake (M; owner default): session-first as the default start, a Start-only home, sessions that continue across segments, the class 1-2 parent-timetable intake, and the school.* Conductor event. The old start stays as a kill switch.
8. 8. learning-question-jar-promises (M): persist Brain's s.later as jar items at lesson end, emit teacher.promise, carry promisesDue in the slot, answer it as a next-lesson hook, and fill plan.jar.
9. 9. learning-conductor-day-plan (L): slot.js plus a LessonBrief that lesson start applies, rules R2, R4-R6, R9 and R11-R14, the home calling planToday, and the household allocator for siblings.
10. 10. learning-test-window-revision (M) and learning-homework-help (L): chapter-scoped revision with retrieval-only in the last 2 days; a photo, extraction and match-ladder homework lane that pairs with Brain's Ask beat.
11. 11. learning-parent-teaching-page + app-parent-made-intake-teaching (M): /parent/teaching (approach, made-for pieces with reasons, 'Why did she do that?' from brain_trace, what she remembers), the 'in her words' intake card and the builds card.
12. 12. learning-parent-report-sections (L): monthly and term cadences and the S5/S6/S7/S9/S13/S14/S17 sections, all through the existing claim gate.
13. 13. learning-relevel-other-classes (L, workflow, spend) and learning-placement-bank-coverage (L, workflow, spend).
14. 14. learning-how-this-child-learns (L): a population format allocator, the outcome join and per-child 'what repairs' from the M1 record; persistence beyond that waits for the owner's ruling.
15. 15. app-parent-schedule (M): days, time and length on the Scheduler controls, feeding the day plan.
16. 16. Later: learning-language-kits-real-text (XL, workflow), learning-boards-rbse (XL), learning-live-probe-library (XL), learning-weave-hosting (M), learning-prereq-edges-lang-sst (M), learning-interest-item-reskin (L), learning-teach-anything-explore (M), learning-hello-preferences (S, patch to App's Hello), learning-term-progress-rollover (M), app-child-device-pairing (M).

### G. Platform: release, staging, cost and India hot path (branch claude/r7-platform)

**Goal.** Ship every 48-hour integration safely in one command to a staging app the owner can open. Know the cost per lesson-minute. Take the India-to-US round trips off the duplex and turn path. Make the server survive deploys and restarts without the child noticing (OWNER-RESET #9, #16; HANDOFF §6).

**First milestone.** About day 4. The first int/r7 integration ships with one command (scripts/release.mjs: migrate, web canary and smoke, worker and jobs at the same sha, context entry). It lands on a staging URL the owner can open within an hour of each integration. The gate runs in about 10 minutes or less. The ledger shows a first real 'cost per lesson-minute by meter' row for a staging lesson.

**Owns.** scripts/deploy-azure.mjs; scripts/deploy-worker.mjs; scripts/migrate.mjs; scripts/release.mjs (new); scripts/cost.mjs (new); scripts/region/**; infra/** except infra/studio-qa/**; server/serve.mjs; server/worker.mjs; server/index.js (route registry; others send one-line patches); server/router.js; server/http.js; server/ws.js; server/net.js; server/boot-warm.js; server/db.js; server/azure.js; server/endpoints.js; server/lanes.js; server/auth.js; server/trace/**; server/cost/** (new); server/notify/** (new); src/trace/**; public/sw.js (new); shared/trace.ts; .github/workflows/**; tests/index.js and test sharding config

**Depends on.** Owner: staging, Front Door, India, Milestone-3 and spending-limit decisions; Reader grant; WhatsApp sender; B Voice: relay code changes for the India D5 relay; F Learning: applies the notify handler patch

**Needs Azure to build/verify.** True

**Items, in order:**

1. 1. platform-release-int-r6 (S): the main loop does this on day 0. This stream then owns the pipeline.
2. 2. platform-migrate-tooling (S): migrate.mjs on db.js dbUrl() with TAXILA_DB=test as the default and --prod required, the pg driver, each file in one transaction, a dry-run listing, and an ACA-job mode for VNet databases. forge/cache.js uses dbUrl().
3. 3. platform-gate-speed (S): shard npm test into a CI matrix (browser and DB suites as their own jobs), aiming under about 8 minutes; gateEvidence requires every shard.
4. 4. platform-release-pipeline (M): scripts/release.mjs <sha> runs migrate, the web canary and smoke, then the worker and both jobs pinned to the same image sha, with ARM retry, a cohort-env check, a context/inbox entry, and a joint --rollback.
5. 5. platform-staging-env (M; owner OK, about $40/mo or repurpose taxila-sin-staging): taxila-staging on the TEST DB with chat on southindia and the owner cohort flags, deployed from any pushed branch with CI evidence. Milestones are judged here.
6. 6. platform-azure-fixed-cost-decisions (S; owner): ARM-only scripts for the decision on taxila-cin-pg (keep for the cutover, or downsize/stop), taxila-sin-staging, the Milestone-3 mix, and the spending limit.
7. 7. platform-cost-ledger (M): server/cost/prices.js covering every meter; usd on model.call; speech.tts, stt.session and d5.session events; a lesson.cost roll-up; scripts/cost.mjs; the first real cost per lesson-minute recorded in context/.
8. 8. platform-graceful-shutdown (S): SIGTERM drain, a trace flush, a reconnect frame for D5 relays, and terminationGracePeriodSeconds.
9. 9. platform-d5-relay-in-india (M, with Voice): the D5 relay as a small app in taxila-sin-env (or an ephemeral Voice Live token so the browser connects directly), its URL served through /api/duplex/config, with end-of-turn and first sound measured from the Central India probe.
10. 10. platform-hot-path-latency-infra (M): run r144-prod-read.sql and the ack-cohort query after the release, keep the hot lanes in a dedicated pool, and set prefetch per lane from the 429 share. The classify fast path is Brain item 10.
11. 11. platform-cdn-front-door (M; owner OK, about $35/mo): Front Door for taxila.dev with asset and Forge-blob caching and a region switch; the bake-off heads move out of dist.
12. 12. platform-observability-gaps (M): the worker-liveness alert, the trace container round trip, eyes.mjs parameterised by app, a small /ops owner page (live lessons, 5xx, turn p50/p90, cost per lesson), and Reader on the primary AI account (owner).
13. 13. platform-notifier (M; owner registers the WhatsApp sender): a notify lane in the worker over ACS Email, ACS WhatsApp and Web Push (VAPID, subscription table), quiet hours, and per-type parent controls. The handler is registered by patch to Learning.
14. 14. platform-usage-budgets (M) and platform-cost-levers (M; persistent TTS clip cache, STT only around child windows with Voice, speculation fan-out from the ledger).
15. 15. Later: platform-shared-state-multi-replica (L) together with voice-scale-voice-sessions (L), platform-india-cutover (L; owner), platform-capacity-admission (M), platform-offline-pwa + app-pwa-install (L), platform-android-shell (L; owner), platform-phone-signin + app-auth-phone-otp (M; owner provider), platform-child-signin (M), app-pricing-subscription (L; owner price).

## Merge-first (main loop)

- int/r6 itself: release it to production on day 0, before the streams start. Run deploy-azure.mjs --dry-run, then deploy, then deploy-worker.mjs --jobs --from-tree at the same sha (platform-release-int-r6). Production is still 14.4.2. This puts 14.4.3 and the 2026-10-27 stream merges live, and every stream branches from what the owner sees.
- origin/claude/r4-asha-rig2: do NOT merge. It shares no history with int/r6, its src/ is older (no look.ts/useLook.ts, no addBilabials rules) and it re-adds the deleted TutorPicker.tsx and TeacherRoute.tsx. Salvage by path checkout onto int/r6 instead: docs/design/round4/asha/rig2, scripts/character/puppet2d/lamp2, scripts/character/puppet2d/lamp3, art/character/puppet2d/lamp2/demo.html and pack-report.json, and context/inbox/r4-asha-rig2.json. Then run merge-inbox.mjs and context.mjs --check, and mark the branch superseded in HANDOFF.md. Reason: the lamp2 tooling and the 10 rig2 nodes (rj-r4-lamp2-painted-keys-premium and others) are the base for the Face stream's grown-up Asha work.
- origin/claude/r4-games-core: do NOT merge. Its Volt parent and play commits are already in int/r6 under other shas (8d07af315 'Parent corner Volt calm', src/play/core/volt-art.ts present). Only d1ad46078's parked ITEM-ARENA format-patches (docs/design/round4/build/games-core/wip/) are missing. Path-checkout those docs so the Games stream can resume ITEM-ARENA if the owner revives it.
- origin/claude/r4-khand: do NOT merge and archive it. Its 579 commits are a parallel history whose content is already in int/r6, and its server/play/routes.js is older than int/r6's. Leave the MEASURE wip patch on the branch for Games item studio-khand-measure-parked, which reads it with git show.
- origin/claude/r5-simlab: do NOT merge the branch (8,430 files and 2.2M lines, 99% evals/simlab/results). Path-checkout only the harness: evals/simlab/*.mjs, cards/, personas.json and personas.mjs, plus docs/handoff/simlab.md. The judge goes to Claude per the 2026-10-27 directive, so milestone lessons can be replayed and judged by the session itself. Results stay on the branch and the blob, and no batteries run until the test phase.
- origin/ev/r8-packaged and origin/ev/r9-packaged: do not merge. They hold old release evidence only.
- Patch files to apply inside the streams, not now: docs/design/reset/prework/rs6/patches/03-routes-placement.js and 04-migration-placement.sql go to Learning (learning-placement-wiring); docs/research/voice/v4/talking-rules.patch goes to Voice, then Brain. census-f4-resume-checkin.diff is safety work and is deferred.

## Sequencing

- Day 0, main loop only. (1) Do the merge_first salvages on int/r6, then cut int/r7. (2) Release int/r6 to production. (3) Re-key every owner cohort (TAXILA_DUPLEX_LIVE_FOR, TAXILA_FACE_LOOK_FOR, TAXILA_SESSION_FIRST_FOR, TAXILA_TEACHER_AGENT_FOR, TAXILA_PICTURES_FOR, TAXILA_ACK_CONTINUER_FOR) to the guardian that owns test child 6fc3f68e, once the owner confirms the account. (4) Send the owner the batched questions; streams start without waiting for them.
- Day 0, ownership and protocol. Write docs/design/round7/OWNERSHIP.json (the file map in streams[].files) and scripts/ownership-check.mjs, which fails any merge that touches another stream's paths. Reserve migration numbers (Brain 031-033, Learning 034-039, Platform 040-043; others request one). The main loop alone owns package.json, package-lock.json and context/ merges; streams drop context/inbox/*.json. The frozen safety files are owned by nobody.
- Day 1: start all 8 sessions on claude/r7-<stream> from int/r7, each on the top model at high effort. Contract first: within 24 h Brain pushes the shared/contracts.ts additions everyone codes against (UiDirectives.later, ui.moment, steer request ids, TurnRequest.gameAct, heardUpTo use), and Learning pushes the learner-view θ, weak flag and minutes-left exports.
- Cross-stream patches: the author commits docs/patches/to-<owner>/NNN-*.patch on its own branch and messages the owner session. The owner applies it within its next push. Hot files with one owner: shared/contracts.ts, server/brain/turn.js, server/director/state.js and server/routes/lesson.js (Brain); src/lesson/runtime.ts (Voice); src/child/lesson/useDesk.ts (App); server/studio/seam.js and server/forge3/tray-gate.js (Studio); server/index.js (Platform).
- Integration every 48 h. The main loop merges stream heads into int/r7 producers first: Platform, Learning, Brain, Voice, Studio, Games, Face, then App. It runs tsc, vite build and npm test (sharded once platform-gate-speed lands) and deploys to staging: taxila-staging once Platform builds it, and a 0%-traffic canary revision of taxila-web until then. Every stream rebases on int/r7 after each integration.
- Weekly owner build: release.mjs to production. Each release comes with a one-page 'what to look at' listing each stream's milestone with a 2-minute screen recording. The main-loop Claude judges the milestone lessons against OWNER-RESET; no Azure judges. Outcomes are logged to context/ before the next phase.
- Visible wins in week 1, in order: Studio no-build-state and Studio v2 per-device serving (day 1-2); Face r8 fallback (day 1-2); Brain register and per-skill arc; Voice hands-free default on staging; App nav and steer chips; Learning subject rotation, school pointer and date/time controls; Platform release pipeline and gate shards.
- End of week 1, the lane decision point. Once Brain's kernel tools serve both the Director and the agent, run a Claude-judged side-by-side (about 12 lessons per lane on the same cards) plus a turn-time read. The owner confirms, then Brain deletes the losing paths (brain-director-flag-debt). Explanation plans and the beat planner are built lane-agnostic so they survive either outcome.
- Week 2 joins: Voice D5 deltas → Studio buildIntentLauncher; Brain beat lookahead → Studio feedPlan and cadence; Voice hands-free → App dock; Face raster gate → Voice start latency; Brain Later list → Learning jar persistence → App Debrief; Games sound → Voice audio bus; Learning per-skill explain fields → Brain explain beats.
- Spend-gated workflows run only after the owner sets a cap, and the owning stream launches them as short workflows. Learning: kit Hinglish/Devanagari forms and per-skill explain plans (class 4-7 maths first), relevel classes 1-3/8-9, the language-kit re-author, placement banks. Studio: truth packs, library seeding, gate services, pictures for everyone. Platform: staging, Front Door, India relay.
- Week 3 and later: the India D5 relay and the cutover (owner); the Studio v2 portrait relayout; wave-3 engines; the grown-up Asha rig on the owner's route; the Notifier; parent report sections. The landing is re-captured only after App's lesson shell and Voice's hands-free have landed.
- Throughout: no stream extends or measures safety code. A change that would touch a safety path stops, is flagged to the main loop and goes on the deferred list. Unit tests and the build gates still run on every code change.

## Deferred (build-first directive)

- Conversation and comprehension batteries: re-run CONVERSATION-V2 against its bar (≥85%, every family ≥75%, 0 lesson ends on a first stop; last strict score 69.2%, n=354); blind-label covert comprehension agreement ≥85% on n≥120 turns; the sim-lab 64-card Director-vs-agent decided gate and the agent-lane battery (R5-2/R5-4). Judges on Claude, after the build.
- QA D49 P0: parent.js exportAll gives a class ≤4 child's conversation word for word, including a disclosure (deferred by the owner).
- Safety-lane open items: QA D23 (Help sheet primary action when a disclosure names a parent); open-r144-help-back-to-lesson; open-r144-stay-repeats-numbers; open-r5-resume-checkin-patch (census-f4-resume-checkin.diff); open-distress-check-fails-open-on-filter; open-goodbye-continue-policy (NEVER MANIPULATE rubric).
- Kit safety and verification: deep-kind re-tag with blind re-verification (open-r143-kit-kind-pose-mismatch, open-r142-kit-deep-kinds); open-r143-kit-filter-collisions (content-filter false safeguards on Roman Hindi 'teen'); the SAFETY_EXCLUDED topic policy for generated games and animations.
- Voice safety and compliance: duplex partial-safety and scanSafety STT robustness (garbled finals, trailing danda); never-rules on voice transcripts; the realtime lane speaking before checks and its instructions visible on the data channel (or retire it); whether preview Voice Live features may serve minors; DPDP s.9 for voice features and pace memory.
- Voice measurement: a real-child audio pilot (E1, ET-1/ET-2) and re-scoring the round-3 duplex switch criteria R1-R7 on real children; large duplex batteries (TaxilaFDB, AMI sweeps, live D5 arms); HUMAN-VOICE ear gates HV-6/9/10/16 and the human anchor recording; the continuer third pass and its sim-lab arm; production rate queries for edit-after-landed, unheard and continuer decisions.
- Studio safety and measurement: a human review policy for library promotion; OCR no-text and Content Safety checks on the Stagecraft image rung; Forge G2 runner trust and owner-authenticated approval; server-side re-check of frame self-reported correctness; Studio frame CSP and stream-guard audits; play/studio evidence-weight calibration; QA re-run of 589569e8, the board-truth sim count, the owner-5 visual battery, the w2f sync battery, router bench at n≥30, Stagecraft E-ST5/E-ST7, and the plain-vs-dressed 3D pilot.
- Face measurement and compliance: a real-phone device lab (Mali-G52 class: fps, thermals, first frame); larger-n blind judge panels for uncanny, premium, same-person and childish, plus a real child/parent panel; a likeness review of generated teacher identities; C2PA and MeitY synthetic-media labels on pre-rendered clips; the G-ID-1 12-surface identity gate, the V-SIG battery and the p2-face 31/31 re-run; safety-face measurements.
- App acceptance: rendered scans of the 1098 / 14416 / 'AI teacher' placements on the new screens (placements kept exactly as they are while building); the Kaksha acceptance battery (rendered lint at 3 viewports, economy test, Debrief truth on 20 sessions, the five-second child test, Playwright baselines); ₹10k-phone performance budgets; a WCAG 2.2 AA / TalkBack audit; DPDP consent copy for device pairing; SMS/DLT registration for OTP.
- Learning gates: K7 mastery-words calibration (delayed accuracy ≥0.9, ECE ≤0.05, n≥200); the equity tercile gate; adaptive-difficulty MRT/HTE and the personalisation-diff battery; the EWM monitor; the interest corpus audit; comprehension G3/G10/X2/Study A; Conductor DB tests without CONDUCTOR_TEST_DATABASE_URL; plan validators V5-V30 with negative controls and the conductor-sim; research consent P4, assent, the parent Experiments section, and the B4 opt-in.
- Notifier N3 safety and N4 account-security semantics and tests (b3-open-n4-deletion-notice); open-prod-test-incidents-block-sweep; open-sweep-shares-erasure.
- Platform security and resilience: open-lesson-lookup-before-auth (404 before the session check); secrets hygiene (Key Vault, managed identity, AcrPull for taxila-sin-pull, coordinated Neon password rotation); load and soak tests (a 4-parallel realtime soak, a multi-replica load test); a restore drill for Azure PG.
- The sim-lab results corpus and all large sim-lab or QA batteries wait for the post-build test phase. Only the harness is brought in, with Claude as the judge.

## Critic findings (raw)

### corrections

- E2E text is wrong on parent limits. It says 'Parent limits are checked only at Start', but they are not enforced anywhere. server/routes/child.js:57-81 dayLimitsOn() needs TAXILA_DAY_LIMITS=on, which is off by default (dc-r14-no-clock-gates, the owner's 2026-10-14 'remove the time frame'). Lesson hours, the daily cap and the 'done/capped/resting' Home states are inert in production. Rewrite Brain item 9 (brain-parent-limits-midlesson) and Learning item 15 (app-parent-schedule) to dc-r14's own reversal: an opt-in parent control, off by default, that never blocks the owner's test family. Log a context entry that supersedes dc-r14. Without that change both items build dead code.
- Brain's first milestone tests only class 5/6. The owner's failing case (OWNER-RESET #1 and #2) was class 4: babyish register, the dice opener. Class 4 is also exactly where the new band split moves a child from young to preteen. Add at least one recorded class-4 maths lesson to Brain's day-5 milestone.
- Voice's first milestone (reply first sound p50 <= 2.5 s) depends on Brain item 10 (streamed, clause-guarded Director reply, size L). That item is 10th in Brain's list and not in Brain's day-5 milestone. Either schedule Brain item 10 in Brain's week 1, before items 5-9, or restate Voice's day-5 latency target as what the fold, uptake and continuer can reach without it (the uptake within about 1 s only).
- Brain item 1 says 'build one band table from shared/bands.ts', but the table is BANDS in shared/learner.ts:12-18. It is mirrored by server/learner/bands.js, which Learning owns, and shared/bands.ts only re-exports it. The visual band is a third copy, src/child/band.ts bandForClass plus src/app/band.ts, owned by App. The existing split is B1-B4 = classes 1-2/3-4/5-7/8-9. The pipeline proposes register 1-3/4-6/7-9, while owner question 4 proposes the young look only for classes 1-2. Make one stream own all of these files (Brain, with Learning and App importing), use one class-to-band mapping for both register and look, and reword owner question 4 so register and look cannot diverge for class 3.
- Platform item 9 covers only the D5 relay. The gap map's voice-india-region (lesson server and DB near the child) sits in Platform 'Later' as platform-india-cutover. Voice's stated goal (first sound about 1.5 s after the child stops) has no path while /api/lesson/turn and the model lanes stay in eastus2. Either add the cutover decision to the week-2 owner questions with a dated slot, or restate Voice's goal as 2.5 s until the cutover.
- Brain item 16 (brain-director-flag-debt) waits for the lane decision, but open-e2e-gutted-replies is visible today on the Director lane. Guard repairs strip a correct-answer reply to 'ने?' and a stop check-in to 'Aap kya chunenge?'. Move a 'rewrite, never strip' fix for the parts/script/noconfirm/flat/wrap guards (server/brain/say.js, server/director/say.js) into Brain's week 1. Both lanes keep the guards.
- The deferred list misfiles open-r142-kit-deep-kinds and open-r143-kit-kind-pose-mismatch as 'kit safety'. They are teaching-quality bugs, not safety. 13 shallow error_spot items are posed as 'your own working with one planted mistake' (shapes.js KIND_NOTE), predict items open engines in predict mode, and why items skip the follow-up why. Move them to Learning (re-tag plus blind key re-verification, inside the kit workflow of item 5) and to Brain (KIND_NOTE shapes).
- Brain item 5 and Brain item 2 must require the kit's anchor numbers in worked examples. QA's open 14.4.2 finding (905a3e50, b28d919f): after 'pata nahi' the worked example uses invented 6 m / 4 m sides instead of the kit's 50/30, and a stuck child is still asked 'Total kitna?'.
- Brain item 2 (hook) should also replace the single interest-hook template, '<topic> jaise <interest>; <interest> mein kya pasand hai?' (open-r3rv-interest-hook-template). It produces QA D14's odd openers ('Tum mujhe teacher bulaogi?', 'favourite fruit').
- E2E/stage-first: App item 2 reverses PRODUCT-DESIGN-V2 §6.3.4 ('The face is never a PiP over content') and the 'Base = CM Desk + grafts' decision, which has reversal conditions V2-M1/M2. Owner question 8 is the gate. App item 2 must also log a supersedes entry in context/ and write a new geometry spec for 360, 412 and 1280 (dp sums, yield order) before building. See the box-contract conflict under ownership.

### uncovered_owner_points

- #4 (cinematic animation) has only token coverage. The only animation items are board motion ops on Player.tsx (Studio item 6) and serving the existing Studio v2 explorables (Studio item 2). studio-cinematic-clip-library sits in 'Later'. 'animation dikhao' on any topic outside the 385 Studio v2 topics still gets a board, plus a prompt workaround: shapes.js:245/605 'never say there is no video... show the movement in words'. Add an 'animate' piece kind to Stagecraft (server/stagecraft, src/stagecraft): a code-built scene-graph and timeline spec bound to her clauses, its own player separate from the whiteboard, and a per-viewport verdict. Pull a cinematic clip pilot (about 20 class 4-7 maths/science topics) out of 'Later', with an owner spend question. Once a real piece exists, remove the 'show the movement in words' shape.
- #18 explicitly lists 'voice-feature use' as a focus, yet voice-voicesig-acting is in Voice 'Later'. server/voicesig/adapter.js:41-44 defaults TAXILA_VOICESIG to off, and server/brain/turn.js:531-1401 runs voicesig as shadow only. Move it into Voice (and Brain for the moves) as a week-2 item: the answer pace and hesitation state picks the follow-up probe, the wait length and the paceDown on the live plan.
- #9 (zero visible failure) is covered only for visual build state (Studio item 1). Spoken build state and spoken failure stay. server/director/shapes.js:257-258 makes her say 'no game is ready for this yet, say so honestly' (which contradicts line 604). server/brain/turn.js:817-836 has her say a picture 'is being made' and own up to a failed picture on the next turn. Add a Brain item to delete these shapes once Studio and Games guarantee a fallback piece. Make ITEM-ARENA (a game for every verified kit item) that universal game fallback in Games, not an optional owner revival.
- #9 and #13: QA D30 is open. A first-line TTS failure (tts_stream 502 after about 12 s) leaves the floor idle for 30+ s with only 'Sound didn't play… Play again', and the fallback speaks in gpt-4o-mini-tts, a different voice. voice-same-voice-failover (S) is in 'Later'. Move it into Voice's week 1, with a server-side idempotent TTS retry in Diya's voice. If that fails, the floor goes to YOUR TURN with the card (src/lesson/runtime.ts, server/routes/tts.js).
- #8 (steering): QA D10 is open. 'मुझे कोई दूसरा सब्जेक्ट पढ़ना है' is ignored; she offers picture/story/game on the same topic. No item handles a mid-lesson subject or topic switch. Add a Brain intent and move: a clean wrap, then re-plan through Learning's nextTopicForPlan with the requested subject, or an honest 'today is X'. This sits beside Brain item 7 and Learning item 1.
- #5 and #13: QA D31 is open, and open-r144-hindi-english-line. A child set up with 'Hindi' gets romanised Hinglish with English key words, and the compile.js LANGUAGE rule follows a switch to English. Learning item 5 fixes only the kit forms. Add a Brain item for lesson-language fidelity in compiler/compile.js and the Director shapes: the Hindi setting gives Hindi (the Devanagari forms from Learning item 5) and the Hinglish setting gives Hinglish.
- #11 (basic controls): beyond the date/time pickers, the parent corner has inert controls. Daily limit and Lesson hours do nothing (TAXILA_DAY_LIMITS off). 'Where the weekly letter goes: WhatsApp' (src/parent/Controls.tsx:293, default reportChannel 'whatsapp' in parent.js:485) has no Notifier behind it until Platform item 13, which is week 3+. Either hide or mark the WhatsApp choice until Platform item 13 lands, and pair the limits work with the opt-in fix in corrections.
- #3 and #9 combined with Learning item 1: once subject rotation ships, children are routed into science, SST, English and Hindi lessons that have no games (Games items 4 and 6 are XL and late). English and Hindi kits are authored on invented texts the child never sees (learning-language-kits-real-text is 'Later' XL). Learning's milestone itself plays an English lesson. Either pull learning-language-kits-real-text forward for classes 4-7 as a spend-gated workflow, or gate rotation to subjects whose kits pass, and say which in Learning's milestone.
- #16 / #5 'does not listen': voice-echo-filter-residuals is in 'Later'. The child's negations are still lost under the echo filter (169/20,109 sim-lab pairs), and one phone barge_stop still loses its content (4b.md open items 3 and 4). A dropped 'nahi' is the 'does not listen' failure. Move it to Voice's week 2.

### missing_from_spec

- §6.2 step 6, name preview ('Hear how {T} says it' / 'That's right' / 'Spell it how it sounds'): not built and not in the pipeline. src/onboarding/ChildProfile.tsx has no preview, and no name-pronunciation field exists in server/, src/ or shared/. Add it to Learning (onboarding UI and a stored spoken spelling) and to Voice (a per-child TTS name lexicon / SSML phoneme on every lane, server/voice/translit). She says the child's name every lesson.
- §6.3.6 Older teach-back, 'Explain it for a friend who missed class': a Work-layout Explain panel taking text, voice or a drawing, with notes saved to the Notebook as 'Notes for a friend'. Not built (src/child/screens/Notebook.tsx:7 lists it as missing) and not in the pipeline; Face item 8 only stages the protégé and the 'Bittu' framing. Add it to App (the panel in the lesson shell, the Notebook page) and Brain (the teachback phase poses it and grades the explanation against the kit).
- §6.5.4 Controls rows 'Extra time to answer: Normal / More / Most' and 'Data saver' are not built (neither appears in src/parent or server/routes/parent.js) and are not in the pipeline. Under hands-free duplex, Extra time should feed the D5 engine's patience (src/duplex/engineRules.ts waits) and Data saver should feed the TTS transport and Studio media. The 'Open mic (headphones only)' row is now obsolete; replace it with the hands-free/mute default from App item 9.
- §14 B2-4, milestones and chapter seals (ledger-driven, once per lesson): the classic Garden has seals (src/child/progress/Garden.tsx), but the Kaksha World/Base has no chapter-seal or milestone moment. Name it in App's app-world-hangar-depth item, with the seal decided by the ledger, not by app counts.
- QA D12 / §6.4 trouble states on Indian networks: her audio is raw PCM (398-497 KB per line), and on Slow 3G 'Asha is talking' runs about 21 s past her last caption. voice-tts-transport (Opus) is in Voice 'Later'. Move it to week 2; slow mobile networks are the main case for Indian phones.
- QA D22: the parent home sits on 'Loading' because GET /api/parent/overview takes 2.4 s for 975 B, and /api/parent/syllabus 1.25 s. No item covers parent-corner read latency. Add it to Learning (server/routes/parent.js overview queries).

### ownership_conflicts

- The tray/stage geometry is a hidden shared contract. server/forge3/tray-gate.js certifies every board, module, skeleton, play piece and Studio v2 piece against server/forge3/certs/box-contract.json: Desk tray boxes per band (b2/b3) at p360/p412/l1366. Studio owns that file. App item 2 (stage-first shell, letterboxed artifact slot) and App item 6 (class 4 moves from b2 to the older family) change those boxes, which invalidates the certificates Studio items 2, 7, 8 and 13 and Games items 2-3 regenerate. Freeze the stage-slot dimensions on day 1 as one owned contract (shared file plus box-contract.json). Make App's new geometry match it, or schedule a re-certification pass in Studio and Games after App's shell lands.
- Band table: three streams own pieces of one table. shared/learner.ts BANDS and server/learner/bands.js belong to Learning, shared/bands.ts to Brain, src/child/band.ts and src/app/band.ts to App, and learner/model.js ageBandFor to Learning. Brain item 1 and App item 6 both redefine it. Assign one owner (see corrections).
- The frozen safety files are not carved out precisely. Brain excludes 'server/safety/**', but the frozen files are server/director/safety.js and server/compiler/floor.js, both inside Brain's server/director/** and server/compiler/** globs, and src/lesson/safetyStrings.ts, inside Voice's src/lesson/** glob. OWNERSHIP.json and scripts/ownership-check.mjs must name these three files explicitly as owned by nobody, or an ownership-clean merge can edit them.
- Unowned paths that ownership-check.mjs will either block or silently pass: tests/** (only tests/index.js is assigned, yet Face item 1 says 'update the tests' and every stream adds tests); src/signals/** (client onset/laugh/frames, Voice-adjacent); src/pages/AvatarDev.tsx; server/seam-safe.js; shared/whiteboard.d.ts (Studio owns only shared/whiteboard.js); shared/interests.d.ts; data/kits-parts.json (outside data/kits/**); scripts/check-prompt-budget.mjs (Brain's 40-50-word explain turns and planner beats will hit this gate); scripts/lint-ui.mjs and scripts/lint-kits.mjs; db/migrations/** (numbers are reserved but no path rule). Assign each, or add a rule that maps tests/* by subject prefix.
- src/copy/en.ts (App) is a hot file that is not on the single-owner list. Studio item 1 removes 'making.*' strings, Learning item 2's 'your class is here' and Face's greeting need copy, and the build-state copy lives here, not in StudioStage.tsx. Add it to the hot-file list with patch protocol, or give each stream its own copy namespace file.
- Undeclared cross-stream edits, not marked as patches: Voice item 3 'ask for mic permission in Hello' edits src/child/screens/Hello.tsx (App). App item 8 'branded loading for /start and /parent shells' edits src/onboarding/Layout.tsx and src/parent/Shell.tsx (Learning). Learning item 2 ''your class is here' on the map' edits src/ui-v3/kaksha/screens/KakshaWorld.tsx (App). Learning item 15 notebook persistence needs GET /api/child/notebook in server/routes/child.js (Learning) for App item 10's Notebook, which is still localStorage at src/child/screens/Notebook.tsx:62-69. Route each through docs/patches/to-<owner>/.
- Face's day-3 milestone is not visible to the owner. It consists of forced-failure behaviour (no WebGL2, timeout, kill switch), which the owner never sees in a normal lesson; a throttled-profile timing delta; and the owner's own lamp2 verdict, which is his action. Add something he sees, for example: Face item 5 stills replacing the letter disc in the parent corner and the teacher sheet, or Face item 7 daily greeting on Home (via App patch), or Face item 6 clip visemes in Hello.
- Platform's day-4 milestone (release command, gate time, one cost row) shows the owner only a URL. Add the /ops owner page (live lessons, turn p50/p90, cost per lesson) from Platform item 12 to the first milestone, or attach the cost row to the weekly 'what to look at' page.
- Owner-gated first milestones need fallbacks. Studio's day-4 milestone needs owner question 9 (Studio v2 per-device sign-off). App's day-5 milestone needs owner questions 4 and 8 (class-4 look, stage-first layout, Home dock, avatars). Face needs the day-0 re-key plus the lamp2 verdict. Each needs a fallback milestone that holds if the owner has not answered by day 4-5.

### ignored_broken

- Level data: only about 30% of class 4-7 kit items carry a measured ge, counted in data/kits: c4 401/1308, c5 377/1294, c6 558/1922, c7 634/2141; classes 1-3 and 8-9 have 0. learning-relevel-other-classes covers only classes 1-3 and 8-9, so Brain item 4's θ-targeted selection (P(correct) 0.7-0.85) runs on the proxy 'C-1+(difficulty-3)*0.5' (server/director/items.js:179-182) for about 4,600 class 4-7 items. Extend the relevel workflow to every unmeasured class 4-7 item, ordered before Brain item 4.
- TAXILA_DAY_LIMITS is off, so every parent limit is inert (server/routes/child.js:57-81); see corrections. Neither the e2e nor any item notices.
- QA D30 (first-line TTS failure leaves the lesson idle) and D10 (a request for another subject is ignored) are open owner defects in docs/design/round5/qa/DEFECTS.md. They are not mapped to any stream.
- open-r143-kit-filter-collisions: Roman Hinglish kit strings ('teen' = three, and others) inside the reply brief trip Azure's content filter, and a block costs the child the turn. The product-side fix rewords the colliding kit strings (data/kits, Learning's kit workflow) and leaves safety code alone. It is filed only under deferred safety.
- open-stagecraft-stage-too-busy: the simulated stage is active 0.85 of the time against a 35-55% target. Studio item 11 (more pieces every 1-2 minutes) makes this worse unless it includes the policy rest rule. Add the rest rule to Studio item 11.
- open-e2e-gutted-replies (guard repairs leave one-word fragments) is scheduled only after the lane decision; see corrections.


---

# Main-loop decisions and amendments (binding for round 7; these override the stream text above where they differ)

## D. Decisions the main loop has taken (reversible; each logged to context as dc-r7-*)

1. **One teacher brain: hybrid.** The strong LLM plans the lesson, chooses and words each move with tools. Code keeps
   the invariants as tools/post-checks: verified grading, the level-calibrated item offer, the Later list, the stop
   protocol, parent limits, screen truth, the frozen safety floor. Build the kernel tools so both lanes use them; at the
   end of week 1 a Claude-judged side-by-side (~12 lessons per lane, same cards) picks the default lane, then Brain
   deletes the losing paths. (Owner directive 2026-10-14 AGENT.md points this way.)
2. **Hands-free duplex is the default for every child** (no tap button; tap stays as a visible fallback). No real users
   yet, so the extra per-hour cost is test-only.
3. **Age bands:** classes 1-3 young, 4-6 preteen, 7-9 teen. Class 4 moves to the older look (OWNER-RESET #1).
4. **Turn length:** explanation and worked-example turns may run 40-50 words for classes 5-9 when the board carries the
   detail; other turns keep today's caps.
5. **Stop and limits:** add "wrap up in 2" and a real timed break (mic paused, resume where we were). "Stop for today"
   ends the lesson (not the day). At a parent limit mid-lesson she finishes the current question, then wraps.
   Parent controls that do nothing today (daily limit, lesson hours, WhatsApp channel) are wired or hidden; none stays
   inert.
6. **Session-first start** ("what happened at school today?") becomes the default for everyone, with a Start-only Home;
   daily subject = parent timetable, then the child's intake, then Conductor rotation.
7. **Stage-first lesson shell:** content is the hero, her face a PiP, steer chips, a Later tray. This supersedes
   PRODUCT-DESIGN-V2 §6.3.4 ("the face is never a PiP over content"); App logs the supersedes entry and writes the
   360/412/1280 geometry spec, which Studio applies to `server/forge3/certs/box-contract.json`.
8. **Studio v2 served wherever certified** (412-px phones, laptops; board twin on 360 px until the portrait relayout).
   Amends dc-r4c-studio-v2-off-child-path.
9. **Games:** revive ITEM-ARENA and Khand MEASURE (build-first replaces the 2026-10-10 stop). First wave-3 real-time
   engine: E6 Yantra (science physics). Timed/fast mechanics only on secure skills.
10. **Personalisation** ("how this child learns": format/representation responsiveness, interests, pace) persists
    across lessons. Consent handling is part of the later compliance pass.
11. **Scope now:** CBSE/NCERT classes 4-7 first for depth (Studio, games, kits); classes 1-3 and 8-9 keep working but
    are second. RBSE, Hindi-medium, the "teach me anything" explore tier, teacher choice and child-named teacher stay
    parked.
12. **Merges:** do not merge claude/r4-asha-rig2, r4-games-core, r4-khand, r5-simlab, ev/*: salvage by path checkout
    inside the owning stream (Face: rig2 paths; Games: ITEM-ARENA and Khand MEASURE patches). The sim lab harness stays
    on its branch until testing resumes.

## A. Amendments per stream (from the completeness critic; add to your list in the stated position)

**A — Brain**
- Week 1, before items 5-9: item 10's streamed, clause-guarded Director reply (Voice's latency depends on it).
- Week 1: "rewrite, never strip" for the parts/script/noconfirm/flat/wrap guards (open-e2e-gutted-replies: replies
  stripped to "ने?", stop check-ins to "Aap kya chunenge?").
- Week 1: zero spoken build state or failure (shapes.js ~257 "no game is ready, say so honestly"; turn.js ~817-836
  "a picture is being made"): she never narrates building or failing; she offers what exists.
- Day-5 milestone includes a recorded **class-4** maths lesson (the owner's failing case: babyish register, dice opener).
- Items 2 and 5: worked examples use the kit's anchor numbers (QA 905a3e50/b28d919f: invented 6/4 sides instead of
  50/30); a stuck child is never asked "Total kitna?". Item 2's hook replaces the single interest-hook template
  (open-r3rv-interest-hook-template).
- New items: subject switch mid-lesson (QA D10, "मुझे कोई दूसरा सब्जेक्ट पढ़ना है": clean wrap and re-plan through
  Learning's nextTopicForPlan, or an honest "today is X"); lesson-language fidelity (QA D31, open-r144-hindi-english-line:
  a Hindi child gets Devanagari Hindi, not romanised Hinglish); kit kind-pose mismatch and shallow deep-kinds
  (open-r142-kit-deep-kinds, open-r143-kit-kind-pose-mismatch: teaching quality, not safety); the older teach-back
  "explain it for a friend" (PRODUCT-DESIGN-V2 §6.3.6; App builds the panel).
- **Band table: Brain is the single owner** of `shared/learner.ts` BANDS and `shared/bands.ts`;
  `server/learner/bands.js` (Learning) and `src/child/band.ts` / `src/app/band.ts` (App) derive from it, never redefine.

**B — Voice**
- Week 1: same-voice TTS failover (QA D30: a first-line tts_stream 502 leaves the floor idle 30+ s and the fallback
  speaks in another voice).
- Week 2: voicesig acting (OWNER-RESET #18 "voice-feature use": answer pace and hesitation drive moves; today shadow
  only); echo-filter residuals (dropped "nahi" = "does not listen"; 4b.md open items 3-4); Opus TTS transport (QA D12:
  raw PCM 400-500 KB per line, 21 s lag on slow 3G).
- Day-5 latency target is stated as what the fold, uptake and start prewarm deliver; the ≤ 2.5 s reply-first-sound
  target lands when Brain's streamed reply lands.
- Name pronunciation preview (PRODUCT-DESIGN-V2 §6.2 step 6) per child, with Learning's stored spoken spelling.
- Extra time to answer (Normal/More/Most) feeds the D5 engine's patience (src/duplex/engineRules.ts).

**C1 — Studio**
- Move studio-cinematic-clip-library from Later into week 2: "animation dikhao" outside the 385 Studio v2 topics must
  get real motion, not a board (OWNER-RESET #4).
- Item 11 (cadence) includes the policy rest rule (open-stagecraft-stage-too-busy: stage active 0.85 vs a 35-55%
  target).
- Owns `server/forge3/certs/box-contract.json`; applies App's stage-first geometry.

**C2 — Games**
- Subject rotation sends children to science, SST, English and Hindi lessons: week 2 adds at least one real-mechanic
  game family per subject (Yantra for science first).

**D — Face**
- Visible day-3 milestone: the rig's stills replace the posters on every surface; the owner sees lamp2 in his own
  account once the cohort is re-keyed.

**E — App**
- Older teach-back Explain panel (text, voice or drawing; saved to the Notebook as "Notes for a friend").
- Chapter seals and milestones on the Kaksha World/Base, decided by the ledger.
- Single owner of `src/copy/en.ts`; other streams send copy by patch.

**F — Learning**
- Wire or hide every parent control (daily limit, lesson hours, report channel); add Extra time and Data saver rows.
- Name preview field (stored spoken spelling) in onboarding.
- Parent-corner read latency (QA D22: /api/parent/overview 2.4 s, /api/parent/syllabus 1.25 s).
- Level data: only ~30% of class 4-7 kit items carry a measured `ge`. A relevel workflow for classes 4-7 joins the
  spend-gated workflows.
- Reword Roman-Hinglish kit strings that collide with the content filter ('teen' etc., open-r143-kit-filter-collisions):
  a kit-text fix, not safety code.
- Language kits on real texts (learning-language-kits-real-text) moves from Later to week 2-3, since rotation will send
  children to English/Hindi.

**G — Platform**
- First milestone includes the /ops owner page (live lessons, turn p50/p90, cost per lesson-minute).
- The India cutover (lesson server + DB near the child) is an owner decision, then a Platform item; Voice's ~1.5 s
  target has no path without it.

## O. Ownership rules (all streams)

- Each stream changes only its own paths (stream sections above, plus `docs/design/round7/OWNERSHIP.md`).
  Cross-stream changes go as patches: commit `docs/patches/to-<owner>/NNN-<slug>.patch` on your branch and message the
  owner session. The owner applies it in its next push.
- Single-owner hot files: `shared/contracts.ts`, `server/brain/turn.js`, `server/director/state.js`,
  `shared/learner.ts`, `shared/bands.ts` → Brain; `src/lesson/runtime.ts` → Voice; `src/copy/en.ts`, `src/child/lesson/useDesk.ts` → App;
  `server/forge3/certs/box-contract.json`, `server/studio/seam.js` → Studio; `server/index.js` (route registry),
  `db/migrations/**` numbering → Platform (reserved numbers: Brain 031-033, Learning 034-039, Platform 040-043,
  others ask Platform).
- Frozen safety files: nobody edits `server/director/safety.js`, `server/compiler/floor.js`, `server/safety/**`,
  `src/lesson/safetyStrings.ts`. A change that would need them stops and goes to the main loop.
- Tests: each stream adds tests as `tests/r7-<stream>-*.test.mjs` and may edit tests only for code it owns.
- Contracts first: within 24 h Brain pushes the `shared/contracts.ts` additions others code against (UiDirectives.later,
  ui.moment, steer request ids, TurnRequest.gameAct, heardUpTo).
- Integration: the main loop merges stream heads into `int/r6` every ~48 h (Platform, Learning, Brain, Voice, Studio,
  Games, Face, App), runs the gates, and deploys to staging once Platform's pipeline exists.
- Context inbox (added 2026-11-04 after integration 2): never edit an inbox file after it is pushed. The main loop
  moves merged files to `context/inbox/merged/`; git treats that as a rename, so later stream edits to the same file
  follow it into `merged/` and never reach the graph (28 nodes were hidden this way and recovered). Each batch is a
  NEW file `context/inbox/r7-<stream>-<n>.json`, with prose (md.decisions / md.measurements / md.rejected) for every node.
