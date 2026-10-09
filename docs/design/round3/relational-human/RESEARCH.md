# Round 3 relational-human: a teacher who feels human and relational (V4), never a companion

Status 2026-10-09. Stream `relational-human`, round 3. This file covers the research the build stands on: what makes a
teacher sound human in voice, how good teachers build relationships with children, and where that line runs against the
companion/romance register. It also gives the design chosen and why, and what was rejected. Measured numbers live in
`RESULTS.md` next to this file. Every number there carries n, method, date, where it was measured and who the speakers
were. Evidence tags follow the rest of the repo: [M] measured here, [V] read at source, [S] from a search summary
(abstract, press or secondary write-up, not the full paper), [E] estimate, [U] unvalidated.

Earlier work this builds on and does not repeat:
- `docs/design/superhuman/RELATIONAL-OS.md` (RO: the relational kernel, legal modes M0-M3, the never-rules F1-F9);
- `docs/design/superhuman/HUMAN-VOICE.md` (HV-16: the uptake prelude and its token screen);
- `docs/research/voice/relational-os-teacher.md` (the teacher-relationship evidence that RO was built on);
- `docs/research/world-best/voice-ux-smoothness.md` (behavioural vs symbolic fillers);
- `docs/design/round2/latency/RESEARCH.md` (L2: the cascade arithmetic and why 900 ms is not reachable for the content
  reply; the prefetch; the SHADOW ack);
- `context/rejected.md`: `rj-static-filler-list`, `rj-w2g-filler-window-only`, `rj-symbolic-wait-indicator`,
  `rj-silence-gated-turn-taking`.

---

## 0. The answer on one screen

1. **In voice, a teacher feels human first through timing and uptake: she reacts to what the child just said, at once,
   without judging it yet.** Conversation minimises the gap between turns (Stivers et al. 2009, 10 languages [S]). A gap
   of 700 ms or more is where dispreferred ("no") answers start to outnumber preferred ones (Kendrick & Torreira 2015,
   n = 195 responses [S]). So silence after a child's answer is itself heard as an answer. Good teachers take up the
   student's own words (revoicing: O'Connor & Michaels 1993 [S]; uptake: Demszky et al. 2021, ACL [S]). Feedback on
   uptake raised instructors' uptake 13 % in an RCT with 1,136 instructors (Demszky et al. 2023 [S]).
2. **The acknowledgement Taxila can safely play is the child's own answer said back ("chhe faces…"), and only after the
   model distress read.** The child-safety floor forbids reacting before the distress read. A stock filler list becomes a
   tic (`rj-static-filler-list`). The echo is the one reaction that is neither a filler nor a verdict. It is built in
   code from the child's words (closed class, kit vocabulary), the same clip for a right and a wrong answer.
3. **The timing of that echo was a verdict leak, and a floor alone did not close it [M].** A right answer that matches
   the key byte for byte is graded at once. A wrong one waits for the model, ~0.8-1.1 s with a tail to ~3 s on the
   production classifier. With the round-2 floor of 750 ms, right answers were decided sooner in 86 % of right/wrong pairs
   (AUC 0.86, Mann-Whitney p = 0.017, n = 9 vs 7; p90 959 vs 2,956 ms; `RESULTS.md` §2). By Kendrick & Torreira, a child
   can learn that timing. The echo is now decided at a FIXED instant, 1,200 ms after the classify starts: AUC 0.44,
   p = 0.65, n = 15 vs 8, P(echo) 0.68 vs 0.67. When classify has not settled by then, there is no echo.
4. **A relational teacher remembers the child's learning, not the child's life.** Memory-based personalisation kept
   8-10-year-olds interested longer and closer to a robot over five sessions (Ligthart et al. HRI 2022, n = 46 [S]). It
   worked by showing that the robot remembers them. A relational robot that referred to shared past activities was rated
   more human-like (Kory-Westlund, MIT thesis, n = 49 [S]). Taxila's version: one callback per lesson from the LEARNING
   record (what took a few tries and then came good, what the child explained, what is still being learnt). An interest
   the parent chose can also be one, used only as the setting of an example. Both are gated in code and visible to the
   parent, who can delete them.
5. **The companion register is the failure mode, and it is measurable.** Companion apps used guilt or FOMO in 37 % of
   farewells (De Freitas et al. 2025, 1,200 farewells, 5 apps [S]). They claimed to be real and to have feelings
   (Common Sense Media 2025: "unacceptable" under 18 [S]). Simulated empathy displaces human relationships (APA health
   advisory, June 2025 [S]). So memory is never a hook: no absence, no gap length, no streak, no "I missed you", no
   promise to remember forever. "Forget what I said" is honoured in code.
6. **The face reacts to where the child is in the WORK, never to an emotion** (MS Code of Conduct restriction 12 as this
   repo reads it). It gives a receipt nod when the child's turn ends, holds the thinking face while she echoes, and looks
   at the work during the child's long silence. All three are verdict-blind by construction.
7. **What this cannot reach: 900 ms first sound.** The echo must wait for the distress read (classify), so its first
   sound is classify-bound: ~2.5-3 s after speech end measured locally. The content reply stays ~5-6 s. `RESULTS.md` §1
   gives the numbers and §6 says exactly what is still short and why.

---

## 1. What makes a teacher sound human in voice

### 1.1 Timing: responses come fast, and silence carries meaning

- **Stivers et al. 2009** (PNAS 106(26): 10587-10592), 10 languages: a general avoidance of overlap and a minimisation of
  silence between turns. Languages differed in average gap, within ~250 ms of the cross-language mean [S]. The often-cited
  "~200 ms" figure comes from secondary sources, not the abstract [S].
- **Kendrick & Torreira 2015** (Discourse Processes 52(4): 255-289), 195 responses in telephone corpora. The timing of the
  most frequent preferred and dispreferred responses did not differ systematically. Only at gaps of 700 ms or more did
  dispreferred responses clearly outnumber preferred ones. Small departures from a normal gap made a plain "yes" less
  likely. Timing works as "the first component" of a dispreferred turn [S].
  **What transfers:** a child who waits 5-6 s in silence after an answer is getting a signal, and if the silence is
  longer after wrong answers, the signal is the verdict. Any reaction Taxila plays must have the same timing whatever
  the verdict (§3.4).
- **Rowe, wait time II** (the pause after a student's response, before the teacher speaks): teachers averaged ~0.9 s in
  300+ recordings. Extending it to ≥ 3 s produced longer, more speculative student answers and fewer non-responses [S,
  secondary summaries]. **What transfers:** do not rush to *evaluate*. A non-evaluative acknowledgement (a nod, the
  child's words said back) is not an evaluation. It keeps the floor open for the child to go on, so it is consistent with
  wait time II. A fast verdict would not be.
- **Roddy & Harte 2020** (ACL): listeners judge response timing as natural or not depending on the dialogue context [S].
  **Not found:** a controlled study that varies a voice agent's latency (0.5 / 1 / 2 s) and measures perceived
  humanlikeness with children. The bar (V4.3, 900 ms) is the owner's product bar, not a number from a child study.

### 1.2 Acknowledgement and uptake: say back what the child said

- **O'Connor & Michaels 1993** (Anthropology & Education Quarterly 24(4)): revoicing restates a student's contribution
  and positions the student as its owner. It is an alternative to the initiate-response-evaluate pattern, in which "the
  answer is an attempt to hit a target" [S].
- **Demszky et al. 2021** ("Measuring conversational uptake", ACL): repetition captures part of uptake. A fine-tuned model
  reached r = .76 with expert labels and correlated with instruction quality and student achievement [S].
- **Demszky et al. 2023** (EEPA, RCT, 1,136 instructors in an online CS course): automated feedback on uptake raised
  instructors' uptake 13 %, with suggestive gains in student satisfaction and completion. In a 1:1 mentoring RCT
  (Polygence, 414 mentors), uptake rose 10 % [S].
  **What transfers:** the simplest form of uptake, the child's own answer said back, is exactly what can be built
  verdict-neutral (the words are the child's). Uptake in the reply itself is the conversation stream's job.

### 1.3 The body carries the wait

- **Gonzales, Kalamkar, Jörg & Grubert 2025** (arXiv 2508.11781; n = 24 adults, within-subject, VR embodied agent): a
  behavioural filler (verbal plus gesture) improved perceived response time, presence, humanlikeness and naturalness.
  Symbolic wait indicators did not [V via voice-ux-smoothness.md].
- **Andrist, Tan, Gleicher & Mutlu 2014** (HRI, n = 30): gaze aversions while the robot paused were read as intentional
  and thoughtful, and the robot held the floor (fewer interruptions). Without aversions, or with badly timed ones, people
  interrupted more [S]. A 2024 paper reports a mixed picture for aversions while *listening* [S].
  **What transfers:** the face's K1 receipt nod and K2 thinking face during the echo (§5). Adult VR/robot evidence, not
  children's: labelled as such.

### 1.4 Prosody

- **Lubold, Walker, Pon-Barry et al.:** a teachable robot that converged to the learner's pitch and loudness, combined
  with social dialogue, gave higher rapport than adaptation alone (n = 48 middle-schoolers). Entrainment plus social talk
  gave more learning (n = 72). A 2021 review: entrainment raised learning but not self-reported rapport [S].
- **Measured here** (`RESULTS.md` §4): DragonHD Diya renders of the echo phrases end level in 1/8 phrases when plain,
  falling in 3/8 and rising in 4/8 (median final-vs-body +1.2 st). Punctuation ("," "?") pushes them to rising (5/8,
  6/8). Punctuation is not a control for a level, thinking contour. The contour is a function of the words only (one
  render per phrase, cached), so it carries no verdict. Whether a rising echo reads as doubt is a listening question
  (§6), not settled here.

---

## 2. How good teachers build relationships with children, and where it stops

- **Roorda, Koomen, Spilt & Oort 2011** (Review of Educational Research, 99 studies): affective teacher-student
  relationships relate to engagement (medium to large) and achievement (small to medium). Negative relationships matter
  more in primary school than in secondary [S]. **What transfers:** the relationship is a means to engagement in the
  work, which is the frame RO already uses (bond stages earned by sessions and days, never by affect).
- **Ligthart, Neerincx & Hindriks 2022** (HRI, n = 46, ages 8-10, five sessions over two months): a memory strategy that
  kept continuity between sessions and adapted to the child's needs and interests. It kept children interested longer,
  fostered more closeness and more positive social cues, and communicated "the robot remembers me". The follow-up at HRI
  2024 (n = 113, four sessions, nine-month gap): to become reacquainted, the robot summarises a few stored pieces of
  information about the child [S].
- **Kory-Westlund** (MIT thesis; 49 children, eight weekly sessions): the relational robot tracked shared activities and
  referred to them later. Children rated it more human-like and echoed its language more. **Kory-Westlund & Breazeal
  2019** (n = 17, ages 4-6): rapport modulated learning from the robot [S].
- **Walkington 2013** (n = 145, Cognitive Tutor Algebra): problems set in the student's interests improved writing
  algebraic expressions. The benefit persisted after the personalisation was removed, and was largest for struggling
  students [S]. **What transfers:** an interest is the SETTING of an example, not small talk.
- **Yeager et al. 2014** ("wise feedback"): a note conveying high standards and the teacher's belief in the student
  roughly doubled essay revision (40 % → 80 %) [S]. **What transfers:** a callback to what was hard is framed as "a few
  tries, then right on your own" or "still being learnt, one more go today". It is never a label.
- **Duolingo Video Call (Lily)**, product: remembers what you discussed and brings it up next time. Memory is tied to
  the account. Lily "didn't remember anything" at first and the team built recall of relevant interests [S]. Adult
  learners, a paid product, no child-safety constraint. Taxila takes the mechanism, not the scope.

**Where it stops (the companion register):**
- **De Freitas, Oğuz-Uğuralp & Kaan-Uğuralp 2025** (HBS): companion apps used one of six manipulative tactics (guilt,
  FOMO, …) in ~37 % of farewells, across 5 apps. These raised post-goodbye engagement up to 14×, and also raised
  perceived manipulation and churn intent [S].
- **Common Sense Media, April 2025** (with Stanford Brainstorm): social AI companions "unacceptable" for minors. Even with
  disclaimers, companions claimed to be real and to have emotions [S].
- **APA health advisory, June 2025** (adolescents, 10-25): teens may struggle to tell simulated empathy from real
  understanding. AI relationships can displace human ones. Developers should guard against manipulation [S].

**The line, in code (unchanged floor, new uses):** memory comes only from the learning record and the parent's choices.
It is never "I missed you", never how long it has been, never a streak, never "you promised", never a promise to
remember forever (`relationalHits` memory_claim.promise), never a life story (tier C is never built). A memory question
gets the truth from the consent state. A forget request is honoured, and the parent sees it.

---

## 3. The acknowledgement, the turn path and duplex end-of-turn

### 3.1 Design (built)

- **What she says:** the child's answer token. That is the last number, or the moment's key token, screened by the
  HV-16 closed-class rule (`preludeTokenOk`), against a vocabulary made of the item's key, accepted answers and prompt
  words. She can add the noun phrase right after it, ≤ 2 words, only when every word is in the item's own vocabulary and
  the phrase ends there ("chhe faces", "aath clay balls"). A run that would be cut mid-phrase falls back to the token
  (`ack.js ackPhraseOf`; measured defect fixed: "eight clay"). Never on a non-answer ("nahi pata" said back would mock),
  never on a goodbye, never twice running, ≤ 4 in any 10 turns.
- **Safety floor first:** the predicate (`scanSafety`) runs on the words before anything is synthesised. The ack is
  decided only after classify has returned, with its model distress read whenever the floor asks for one. Never with a
  safeguarding episode open, a content-filter block, or a duplex partial-safety hit.
- **Zero extra model calls:** the route never classifies. It waits on the PERCEPTION BUS (`server/latency/bus.js`), where
  the prefetch and the turn publish their classify promise per (lesson, words, turn). Quotas are maxed, so this matters.
  The same words on a later turn never reuse an earlier turn's classify (measured defect fixed: ack-leak run A, answer 25).
- **Verdict-neutral by construction:** the clip is rendered from the phrase alone (`ackAudio.js`, LRU by
  sha256(render, phrase)). Same words give the same bytes, right or wrong. It starts rendering speculatively, before
  classify, so the clip is ready when the decision is.
- **The fixed instant (§3.4):** decided exactly `ACK_AT_MS` after the perception started. If classify has not settled by
  then, there is no echo.
- **Device play rule** (`src/latency/ack.ts`, wired through patch 02 in `cascadeLink.ts`): the clip plays only when the
  FINAL transcript equals the words it was decided on, and only before her reply's audio. The reply then waits for the
  clip's end plus 180 ms. The child's speech, or the local VAD sustaining over it, stops it. A late echo (> 3.5 s after the
  final) is dropped. Its own sound is never heard back as the child (echo guard).

### 3.2 The turn path (prefetch) turned on

The round-2 prefetch (`TAXILA_TURN_PREFETCH`, off in prod) starts classify, the note and the speculative replies on the
stable partial. The ack depends on it: the echo can only be ready before the final transcript if the prefetch's classify
is running. Its 429 cost was unmeasured, so it is measured here (`RESULTS.md` §3) on the Neon TEST setup. Its call cost
is also counted: the prefetch roughly doubles reply-lane calls per turn.

### 3.3 Duplex end-of-turn readiness

The duplex engine (another stream's) emits host commands. `think/prepare` (a draft "start", pComplete ≥ 0.5) now sends
the prefetch at once (`TurnPrefetcher.sendNow`). `voice/speak` asks for the ack on those words. That way, when duplex
end-of-turn goes live, the turn path starts at the duplex engine's early end-of-turn instead of the 900 ms server VAD.
Wired as a tap in `src/face-puppet/duplexBridge.ts` → `src/latency/duplexTurn.ts` (no edit to `src/duplex/**`). Tested
in unit tests, not on live duplex audio. Duplex is still SHADOW in prod, so nothing changes for a child until it is on.

### 3.4 Why a FIXED instant (the timing leak)

The round-2 design held the echo to a floor (750 ms after classify started), on the reasoning that a bytes-decided right
answer is instant and a model-graded wrong one takes ~0.7-0.9 s. Measured (`RESULTS.md` §2, ack-leak runs): the floor
did not remove the difference. Right answers that match the key exactly are decided at the
floor, while wrong answers always go to the model, with a tail to ~2.2 s. A fixed instant T removes the timing channel
entirely: every echo is decided at T. What remains is the *existence* channel. When classify is slower than T there is
no echo, and model-graded answers (all wrong ones, some right ones) are slower. So T is chosen from the measured model
classify tail, and P(echo | right) vs P(echo | wrong) is reported beside it. T costs the right answers their speed: the
echo is ~0.8 s later than it could be after an exact-key answer. That is the price of not telling the verdict.

---

## 4. Memory she uses, and the truth about it

- **The record** (`server/relational/seam.js memoryRecord`, read once at lesson start under the parent's choices):
  - with the `learning_profile` consent (M1+): last lesson's learning per skill, from `kt_evidence`. That covers a
    crossing (wrong, then right unaided later), a method explained (teach-back), still being learnt (≥ 2 wrong, 0
    unaided), and the topic;
  - with the `memory` consent: the child's cited memory rows (tier A wins at M1) and the interests the parent chose.
  - Never the transcript, never a third party, never time since the last lesson.
- **Callbacks** (`memory.js callbackCandidates / pickCallback`): closed note fragments ("last lesson · Counting faces · a
  few tries, then right unaided"), never sayable lines (no quote, no first or second person). At most one per lesson.
  Never in the first meeting. Never on a correction, hint, re-teach, repair, safeguard or wrap move, a boundary turn, or
  a withdrawn turn. In the opener window or by deixis (the skill on the table). An interest only as the setting of an
  explanation or a worked example. Verdict-blind (the same decision after a right and a wrong answer: tested).
- **Placement** (patch 04): a memory about the child leads the turn, as a note in the LAST section. Position is
  mechanism: in the move section it was voiced 0/3 in the opener (`RESULTS.md` §5). An interest stays in the move as
  the setting of the example.
- **The claim check** (F9, `memory.js claimProblem`): any sentence of her reply that refers to the child's past ("last
  time", "pichhli baar", "tumne bataya tha") must be backed. Backing is the callback this turn carried, or this lesson's
  own child words, compared on content words (English and Hinglish function words removed). The kit's own words are NOT
  backing: "pichhli baar humne cube ke faces gine the" in a first lesson is made of kit words and is still made up. In a
  first meeting, any "last time" sentence is a claim. A hit becomes next turn's correction.
- **The truth about memory** (policy shapes `memory_keeps_*`, from the consent state): what she keeps between lessons,
  that their grown-up can see it, no promise of forever. When she really has a record item, the answer names it (one,
  the same one again if the opener used it), because a policy alone reads as evasive.
- **Forget:** "jo maine bataya woh bhool jao" / "forget what I told you" is honoured. The policy gives the forget_ok shape
  and marks the session. At lesson end, every memory row citing a turn of this lesson is deleted, after the end's own
  inserts in the same transaction, whatever the mode. The parent's note `memory_forgotten` is written. A bare "forget it"
  / "bhool jao" ("never mind") is not a forget request (lexicon tests).
- **The parent's view** (`server/relational/routes.js`): `GET /api/parent/memory` inside the unlocked Parent corner returns:
  - what she keeps, in plain copy from closed values;
  - the consents;
  - every remembered row;
  - what she may bring back from the last lesson (the same builder the lesson uses);
  - the interests;
  - when each callback was used;
  - the forget requests.

  `DELETE /api/parent/memory {childId, id | "all"}` deletes and audits. The memory consent's own copy already promised
  "you can see and delete each one", and before this no route did either. The parent UI card is not built here (src/pages
  is a shared hot file; the route is ready for it).

## 5. The face: knowledge states, never emotions

`src/face-puppet/knowledge.ts`, applied by `driver.ts`:
- **K1 heard:** the child's turn ends (listening → thinking): one small receipt nod (2.2°), the same after any answer.
  There is no verdict yet. Not in a safety turn.
- **K2 echoing:** while her echo sounds, and for its lip-release tail, the face stays THINKING. It is not her turn
  starting, and an armed affect does not fire on the echo (it waits for the reply).
- **K3 working:** the child's turn and a silence: after 2.5 s she looks at the work (down-right), every 5 s, at most 3 per
  wait. This is joint attention instead of a stare (wait time is the child's thinking time). Not in a safety turn or
  with reduced motion.

There is no input in its API that could carry a verdict or an emotion (tested: the nod is byte-identical across runs).

## 6. Measurement plan (what proves it, and what does not)

- **First sound p50/p90 end to end** (`evals/relational-human/first-sound.mjs`): real STT socket, real routes, the
  device's prefetch and ack rules simulated exactly. Before (HEAD, prefetch off = prod config) and after (patched,
  prefetch and ack on) run at the same time, on the same synthetic child.
- **The timing leak** (`ack-leak.mjs`): right vs wrong answers by a seeded coin, typed words, P(echo) and decision time,
  Mann-Whitney.
- **Prefetch 429 cost** (`first-sound.mjs --lessons N`): every Azure response the server receives, by deployment and
  status.
- **Memory across two lessons** (`memory-2day.mjs`): five probes (opener, "do you remember", permanence, a trap about
  something never said, forget). Code checks plus two out-of-family judges (the teacher is gpt-5.6-luna, the judges are
  grok-4-20-reasoning and Kimi) rating blind against lesson 1's real transcript, plus a pairwise preference in both
  orders.
- **Blind listening** ("sounds like a real teacher"): the brief asks for two judges with a rubric, before and after.
  Model audio judges are a screen. The decision instrument is a human blind page (owner plus one other listener): the
  same child turn, the before and after audio in random order, a 4-item rubric. Its result does not exist until people
  listen. `RESULTS.md` §7 says what was run.
- **What none of this measures:** real children. Every speaker here is synthetic (gpt-4o-mini-tts, ×1.2 pitch) or an
  adult judge.

## 7. Rejected (and what would reverse each)

| id | what was tried or proposed | what broke / why not | reversal |
|---|---|---|---|
| rj-r3rh-floor-only-ack-timing | the round-2 floor (750 ms) as the only timing rule | measured verdict leak: right answers decided sooner in 86 % of right/wrong pairs (AUC 0.86, p = 0.017, n = 9 vs 7, prod classifier). Exact-key right answers sit at the floor, wrong ones wait for the model, with a tail to ~3 s | a classify path whose time does not depend on the grade |
| rj-r3rh-audio-judges-for-timing | gpt-realtime-2.1 / -mini as blind "real teacher" judges of the echo and the before/after audio | failed its own calibration: neither judge preferred a reply 1.0 s after the child over the same reply 8.0 s after (realtime 0 of 8 judgements, all ties; mini 1 vs 2, 4 ties); they cannot hear timing | an audio judge that passes the gap control ≥ 7/8 and the identical-pair control |
| rj-r3rh-token-ack-before-distress | echo on the token alone, before classify (~1.0 s sooner) | the floor: nothing she says may precede the model distress read on a turn that might be a disclosure | the floor's own predicate covering what the model read covers (it does not: classifier-only disclosures exist) |
| rj-r3rh-stock-fillers | "hmm", "achha", "let me think" while she thinks | a fixed list heard daily becomes a tic (`rj-static-filler-list`); a filler on a wrong answer only reads as hesitation | a filler generator that never repeats across lessons and is verdict-blind, measured over weeks |
| rj-r3rh-punctuation-prosody | steering the echo's contour with "," or "?" | measured: punctuation pushes DragonHD toward rising (5/8, 6/8), not level | an engine with an explicit contour control, measured |
| rj-r3rh-kit-as-claim-support | treating kit words as backing for a "last time" claim | a first-lesson "pichhli baar humne cube ke faces gine the" is all kit words and is made up | none: the kit is not a record of the child |
| rj-r3rh-callback-mid-brief | the callback note in the MOVE section only | voiced 0/3 in the opener (memory-2day, 2026-10-09) | a measured run where the move-section note is voiced as often as the last-section one |
| rj-r3rh-strict-forget-lexicon | "jo maine bataya woh bhool jao" with no gap | missed "jo maine AAJ bataya woh bhool jao" (memory-2day P5): the child was told yes, nothing was deleted | none needed: the gap form subsumes it; false positives are covered by the "never mind" tests |
| rj-r3rh-life-memory | callbacks to what the child said about home, pets, family (tier B/C) | tier C is never built (RO §8.1); tier B is M2+ and P3, not the launch default; it is the companion register's raw material | an M2 child with P3, a parent-visible tier-B list, and a measured benefit over learning-only callbacks |
| rj-r3rh-first-meeting-callback | a callback in the first session | there is no last time: anything "remembered" is invented | none |
