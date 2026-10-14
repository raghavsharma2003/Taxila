# Round 5 — "everything is broken": test everything, fix, iterate to the bar

Owner, 2026-10-14 (paraphrased closely): whenever I even start the app it fails, random things happen. Test everything
yourselves and keep iterating until it is perfect: the "did the child understand or not" part, the human part, and very
strongly the duplex architecture. Remove the class time frame (I can't test after the time). Frontier-level in every way.
Behave autonomously; don't stop until done.

Main session (integrates, gates, deploys): `session_0135KCpT8GA8E1uzNPiw2Hw3`. Base: `claude/blissful-mayer-icwe2j` @ `c5c8b63`
(release 13.2 live). Release 14 (main) = no class-time window + D5 for the owner cohort + the fixes below.

## What the owner actually hit (flight recorder, Android 10 phone, Chrome 154, 393x876, loudspeaker)

Two lessons, same failure chain (lesson 3a7da0ad, 2026-10-12 06:23 UTC; lesson 56d898ce, 2026-10-14 16:23 UTC):

1. Lesson opens on tap-to-talk, flips to hands-free (D4: cascade, WebRTC transcription, server_vad) once the duplex answer lands.
2. Her own voice from the phone speaker comes back through the mic (device echoCancellation=true is not enough on this phone):
   `vad.start herPlaying=true`, server VAD speech_started while she plays, phantom child transcripts of her echo
   ("क्यों भाई", "हो नहीं सकता इसलिए नहीं", "थोड़ा में तो है"), empty finals, and `asr.error input_audio_buffer_commit_empty` x3.
3. The engine hushes and YIELDs on those bursts (`short_burst`, `sustained_voice`, level 0.05): she cuts herself off mid-line.
4. The silence backstop (`speak:backstop_silence`) fires while the child's tapped answer ("Homework") is still in flight, so a
   second turn races the first: her reply to the tap is interrupted by her next line.
5. She asks a voice-first child on a phone to "type karke bhejo" the homework question.
6. The owner gives up after 2 turns. Lesson start took 5.4 s on the server; a 2.4 s classify timeout sits on the hot path.

Also seen: after a deploy an open tab fails to load a lazy chunk (`err.resource /assets/Landing-*.js`) and the page is dead;
the client recorder logs `RECORDER DROPPED undefined events`; lessons/home are gated by a time-of-day window (B1-B4 bands,
bedtime - 60) which blocked the owner after ~21:00 IST.

## The bar (measured, with n and method; a claim without a number is not done)

| stream | session / branch | owns | done when (measured) |
|---|---|---|---|
| Duplex | 4B / claude/r4-duplex | src/duplex/**, server/duplex/**, server/ws.js, src/voice/**, evals/duplex*/ ; cascadeLink.ts shared with main | phone loudspeaker without device AEC: 0 phantom child transcripts of her voice and 0 echo yields in n>=100 of her lines; real child barge-in noticed >=90% with her stop <=500 ms; continuer false yields <=1/20; end-of-turn p50 <=900 ms; never a second turn while one is in flight or <3 s after a tap; D5 failure falls back to a half-duplex D4 (mic gated while she plays + tail) that cannot hear her; no press needed |
| Conversation + understanding | 4A / claude/r4-conversation | server/brain/** , server/director/** (not the board/visual parts), prompts | covert comprehension (understood / partly / not) agrees with blind labels >=85% on n>=120 child turns across classes 1-9; when not understood she re-explains a DIFFERENT way, never repeats; never invents a topic after silence or an empty turn; never asks a voice-first child to type; homework intake by voice works; simulated-child battery (Azure models, >=30 personas incl. shy, wrong, off-topic, Hindi-only, noisy ASR) graded against verified keys |
| Content / board | stream 2 / claude/r4-content | server/studio/**, src/studio/**, board + stagecraft | the board draws what was asked >=9/10 (owner replay + a new 40-ask battery); never the same visual twice unasked; a new page clears the old; a picture ask gets a real picture or an honest "can't" |
| Latency | stream 3 / claude/r4-latency | lesson start path, model routing, prewarm | phone: tap Start -> her first sound p50 <=2.5 s; child stops -> her first sound p50 <=1.5 s; no model timeout on the hot path (n>=30 each, real Azure) |
| QA / break-it | new / claude/r5-qa | tests/e2e/**, evals/qa/** ; small UI fixes only | every screen and journey on phone (393x876, touch) and laptop: set-up, sign in/out, who-is-this, multiple children, home, map, lesson (tap, typed, spoken via fake mic), games, board asks, parent corner, controls, after 22:00, slow/offline network, a stale tab across a deploy; loop until two passes find nothing new; every defect with a repro and recorder evidence |

## Rules (unchanged from round 4)
- Work on your own branch; merge base in (never rebase base); only main merges into base, migrates and deploys.
- Report to main with `send_message` (head sha, what changed, the numbers with n) whenever a head is ready; don't wait.
- Gates before every push that touches code: `npx tsc -b && npx vite build && npm test`.
- Keys: only what your stream needs, loaded into a gitignored `.env.local`; never a key in a file or commit; never the
  production DATABASE_URL (use the Neon TEST branch); never deploy credentials.
- The child-safety floor (AI disclosure, Childline 1098 / Tele-MANAS 14416, no romance register, safeguarding hand-off) never
  weakens; changes to safety.js / floor.js / safetyStrings.ts go to main for safety review.
- Log what you learn as `context/inbox/r5-<stream>.json` (decisions with reversal conditions, measurements with n/method/date,
  rejections with what broke).
