# Signals research: reading a child's state from voice, text and interaction during tutoring

**Workstream:** signals / research, 2026-10-04. Research only: no product code changed, nothing committed.
**Owner priority (2026-10-04):** emotion, relational and other important features must be extracted world-class. They
decide whether the child really understood, how the teacher adapts pace, tone and representation, and how the
relationship grows over time.

**Builds on, does not repeat** (read these for the depth this file only cites):
- `docs/research/learner/dialogue-affect.md` (**DA**): detector rules, base rates, verify-before-act, the gaming / wheel-spin / rapid-guess literature.
- `docs/research/voice/emotion-attunement.md` (**EA**): the per-state teacher policies, the near-tears probe (the S2S model did not hear distress), and the signals table in §4.
- `docs/research/world-best/understanding-detection.md` (**UD**): the Microsoft Code of Conduct boundary (§1.5), the IDK split, self-repair, and Epistemic Speech Evidence (ESE, §4).
- `docs/research/voice/stt-v3/RECOMMENDATION.md` §6 (paralinguistic lane from the same stream).
- `docs/design/superhuman/{RELATIONAL-OS,TEACHER-BRAIN}.md` (`TurnSignals`, `Moment.engagement`, NM-3, ROS-1/2).
- Code as it stands: `src/voice/{dsp,tracker,features,featureWorklet}.ts` (on-device features), `server/voice/features.js`
  (per-child Welford z-scores, `signalsFrom`), `server/learner/affect.js` (dialogue counters, `engagementOf`).

**What this file adds:**
1. A signal-by-signal evidence catalogue: what each signal predicts, effect size or reliability, extraction cost, and
   failure modes for 8-13-year-old Hinglish speakers on phone mics.
2. A **compliance tier** on every signal, read against the verbatim Microsoft text.
3. Indian-language specifics that change how prosodic cues must be read. The main one: Hindi phrase rises break the
   "rising end means unsure" cue.
4. The products survey: what each product claims to extract, against what it has shown.
5. **The ranked top 25** (§9), with evidence strength.

**Tags:** [V] primary source or its abstract read this session or in a cited sibling doc; [S] secondary (search summary,
review, citing paper); [T] already in Taxila `context/` or code; [M] measured by Taxila (n given); [U] unverified, or my
inference. **Evidence strength** in §9: **A** replicated, with tutoring or children data and an effect size; **B** one good
study, or adult evidence replicated; **C** indirect or theory; **D** vendor claim or inference only.
**Method:** about 30 web searches plus the Microsoft Code of Conduct page fetched in full (2026-10-04), on top of the
sibling docs above, which cite roughly 150 sources between them. I did not re-read sibling sources unless a number
changed here. No new experiment was run, so every threshold below is [U] until it has a measurement ID in §11.

---

## 0. The answer on one screen

1. **The strongest signals of "did the child really understand" are not affective at all.** They are task evidence:
   graded correctness over time (KT), *which* wrong answer, explanation quality, and delayed and transfer success.
   Next come the child's own words about their knowledge (the IDK split, hedges on correct answers, self-repair), then
   response timing. Acoustic prosody comes last. The literature agrees: log- and dialogue-based affect detectors reach
   ρ 0.08-0.34 (Hutt 2019, n = 69k [V via DA]). Categorical speech emotion recognition (SER) on children reaches about
   60% unweighted average recall (UAR) on lab corpora [S]. Uncertainty from prosody reaches 69-75% accuracy on adults
   [S]. Ranks 1-6 in §9 are all text or task signals.
2. **The binding rule is not "no voice". It is "no emotion inferred from how the child sounds".** Restriction 12 of the
   Microsoft AI Code of Conduct v4.0 (2026-05-01, fetched verbatim §1.1) bans attempts "to infer people's emotional states
   from their physical, physiological, or behavioral characteristics (e.g. … speech patterns)". That gives three tiers:
   - **Tier T (clear):** text and task evidence.
   - **Tier E (grey, write to Microsoft):** acoustic and timing features read as evidence about *knowledge, memory or
     turn-taking*, never named as a feeling. This is the same act as using response time in IRT.
   - **Tier X (banned):** any acoustic or prosodic model or rule whose output is, or is used as, an emotional state:
     "frustrated", "bored", "anxious", "confused", "sad", or arousal/valence.

   The existing `signalsFrom()` already sits in Tier E. Its outputs are `slowerPace`, `gentlerHint` and `followUpProbe`,
   and it names no state. EA §4's "relative loudness band" and stt-v3 §6's "arousal/valence regressor" sit on the X side
   of the line and must not be built (§1.3).
3. **Per-child baselines are not a nicety. They are the only valid way to read these signals.** The reasons:
   - Population emotion labels fail on validity: facial and vocal "expressions" are not diagnostic of felt emotion
     (Barrett et al. 2019, *PSPI* [V]), and Microsoft retired Azure Face emotion in 2022 for that reason [V].
   - They fail on ground truth: trained observers agree on affect at only κ 0.63 (Baker 2010 [V via DA]).
   - They fail on culture: Indian children stay silent about not understanding (DA6 [T]).
   - They fail on language: Hindi puts a rising pitch (LH) on every non-final phrase (§5.2).
   - They fail on temperament: shy children are slow without being disengaged [T].

   A child's deviation from their own running baseline, item-difficulty-adjusted and gated on reliable audio, is what
   carries information. Taxila already does this (Welford, per child × context × feature, `MIN_BASELINE_N` 8) [T].
4. **The largest untapped value is relational and metacognitive text signals**, not acoustics: initiative, question
   quality, lexical alignment with the teacher's terms, self-disclosure, humour, persistence after error, and the
   "pata nahi" vs "yaad nahi" split. Each has B-level evidence of predicting learning or rapport. Each is Tier T. Each
   costs about 0 ms with code lexicons, or rides on the classify call that already exists (TB4: +25-148 ms, measured).
5. **Three engineering facts decide whether the acoustic lane works at all:**
   - **No ASR-confidence gate on the live model.** `taxila-live-transcribe` returns no logprobs, so `asrConfidence` is
     undefined and the "low ASR ⇒ no evidence" gate never fires on that path [T `server/voice/stt.js` header]. Without a
     reliability gate, every acoustic z-score is read on turns that may be mis-heard.
   - **Fillers may be missing from the transcript.** The gpt-4o-transcribe family tends to write clean text [U, to
     measure]. MAI-Transcribe-2 has a verbatim style that keeps fillers and false starts [V via asr-kids-hinglish]. So the
     transcript filler count changes meaning with the STT, and the acoustic flat-voiced-run detector (`flatVoicedRuns`,
     already in `dsp.ts`) is the STT-independent backup.
   - **AGC and noise suppression run before the features.** Loudness describes the browser's automatic gain control
     (AGC) output, not the child [T `features.js` header]. Energy is therefore not a signal on this pipeline, whatever the
     literature says.
6. **Turn-taking is the place where acoustics most clearly earns its keep, and it is not emotion inference.** Children
   answer 1.5-2x slower than adults (625 vs 371 ms median; slow well into middle childhood [S, Casillas & Frank 2016]).
   The teacher filled a thinking-aloud silence with a hint in 5 of 6 runs (EA, n = 3 per arm [M]).
   - **Smart Turn v3** (8M parameters, int8, Whisper-tiny base, 23 languages including Hindi and Marathi, 12 ms on a
     modern CPU and 37 ms on a small instance [V vendor]).
   - **LiveKit's multilingual text EOT model** (Hindi TPR 99.4%, TNR 96.3% [V vendor]).

   Both are open, CPU-only end-of-turn detectors, with no paid model on the hot path.
7. **Products claim much more than they show.**
   - Hume publishes 48 "expression dimensions" for prosody, trained on adults aged 20-66 in 3 countries, and its own docs
     say the labels "should not be treated as direct inferences of emotional experience" [V].
   - Khanmigo surfaces "frustration loops" to teachers by sentiment analysis [S], with no published validation.
   - Amira and Ello measure *reading* (miscues, self-corrections, phonemes), and only Amira has independent effect sizes
     (+0.15 across 15,602 students, Evidence for ESSA [V]).

   No product publishes a validated child-affect-from-voice detector. Nobody has published a calibrated, voice-native
   understanding estimate for children; that remains the gap UD §4 identified.

---

## 1. The binding frame

### 1.1 Microsoft AI Code of Conduct v4.0 (2026-05-01), fetched 2026-10-04 [V]

Usage restriction 12, verbatim: customers must not use the services "to attempt to infer people's emotional states from
their physical, physiological, or behavioral characteristics (e.g., facial expressions, facial movements, or speech
patterns), including inferring emotions such as anger, disgust, happiness, sadness, surprise, fear, or other terms
commonly used to describe a person's emotional state."

Also relevant:
- **Restriction 7:** do not exploit age vulnerabilities "with the objective, or the effect, of materially distorting the
  behavior".
- **Restriction 8:** no "predictive profiling" leading to detrimental treatment.
- **Restriction 11:** no inference of "sensitive attributes (e.g. … specific age)". An age *range* is excluded.
- **Restriction 17:** no "persistent tracking of the individual using any of their personal data, including biometric
  data, without the individual's valid consent".
- **The "Limited exception"** allows content that would otherwise breach the Code *for evaluating and training safety
  systems*. It does not cover a production affect detector.

The Code applies to "applications built with Microsoft AI Services". Taxila is one, so a home-made DSP extractor is in
scope too (UD §1.5 [T]).

### 1.2 Context that points the same way

- **EU AI Act Art. 5(1)(f)**, in force since February 2025, prohibits "AI systems to infer emotions of a natural person
  in the areas of workplace and education institutions", except for medical or safety reasons [V via FPF and the Act
  text]. Art. 3(39) defines an emotion recognition system as one that works "on the basis of their biometric data".
  Voice counts as biometric data. Text does not.
  - India is not bound by it. But the Microsoft Code v1.0 says it was written "to better align with emerging AI
    regulations (e.g., EU AI Act)" [V], so the EU reading is the best predictor of Microsoft's.
- **Microsoft retired Azure Face emotion detection in 2022.** Natasha Crampton cited "the lack of scientific consensus
  on the definition of 'emotions', the challenges in how inferences generalize across use cases, regions, and
  demographics, and the heightened privacy concerns" [V press quotes].
- **Taxila's own decisions already sit here:** `ct-no-voice-emotion-inference` [T], `voice-features-longitudinal`
  ("Never: emotion labels or categorical affect classification") [T], and RELATIONAL-OS NM-3 (no stored trust or
  emotion scores in any mode) [T].

### 1.3 The three tiers, as an engineering test

A signal is classified by **its input** and **its output's name and use**, not by intent:

| tier | input | output may be | examples | status |
|---|---|---|---|---|
| **T** | transcript, graded outcomes, UI events, turn counts | anything the policy needs, including a *dialogue-act* label such as `frustration_words`, because the child *said* it | IDK split, hedges, the child's own words "bahut mushkil hai", gaming pattern, question-asking | clear [T; text-only affect is still the open question in `ct-no-voice-emotion-inference`, but the wording of restriction 12 covers physical, physiological and behavioural characteristics, and a word the child chose is content, not a characteristic] [U] |
| **E** | acoustic or timing measurements (onset latency, pauses, F0 contour, speech rate, laughter events, end-of-turn probability) | an **action licence** or an **evidence weight about knowledge or turn state**: `followUpProbe`, `slowerPace`, `waitLonger`, LR multiplier in [0.9, 1.1] on a knowledge emission, `endOfTurnP` | `signalsFrom()` today; ESE (UD §4); Smart Turn | **grey: write to Microsoft** (extends the open item). Build only with outputs that name no state, and with a kill switch per feature |
| **X** | the same acoustic inputs | an emotional state, arousal, valence, "stress", "mood", "vibe", or any Tier E output **renamed or documented** as a feeling ("the child sounds frustrated, so…") | SER models, Hume-style dimensions, a "calm/agitated" band, "relative loudness = arousal" | **banned**. Covers EA §4's loudness row (already "never a category", but it is still arousal-ish by its own description) and stt-v3 §6 step 4's arousal/valence regressor |

**Two rules make Tier E defensible:**
1. **Name by action, never by feeling.** Code, logs, traces, prompts and docs say `slowerPace`, never `tired`.
2. **The acoustic input is never the sole cause of a costly move.** It buys a cheap, useful-either-way move (DA2's
   verifying move) or changes timing. This is also good science, because at Taxila base rates a decent detector is
   wrong most of the time (DA §6: PPV about 0.20 for boredom [T]).

**Mixed signals.** Laughter is a behavioural event, not an emotion term. But "the child laughed, therefore the child is
happy" would be X. The safe form is `childLaughed: true`, which licenses the teacher to laugh along (TB `Moment` [T]).
Fatigue is a state of the body, not one of the listed emotions, but "tired" is a term commonly used to describe how a
person feels. Read it from **session position and task evidence** (Tier T), not from F0 drop (§3.6).

---

## 2. Why per-child baselines beat population labels (validity, bias, over-interpretation)

| problem | evidence | consequence for Taxila |
|---|---|---|
| Expressions are not diagnostic of felt emotion | Barrett, Adolphs, Marsella, Martinez & Pollak 2019, *PSPI* 20(1):1-68: a systematic review found facial configurations are not consistent or specific enough to diagnose the six classic emotions; the same logic is argued for voice [V] | Never map a cue to a feeling. Map deviations to **actions** |
| Ground truth is noisy | BROMP affect κ 0.63 vs 0.71 for behaviour (Baker 2010); self-report and observation detectors measure different things (Zambrano 2024) [V via DA] | Any trained detector inherits roughly 0.6 κ labels. A rule over interpretable features transfers better (Paquette & Baker 2019: ML gaming detector fell to κ 0.00-0.06 in a new system; expert rules held at 0.23-0.26 [V via DA]) |
| Child SER barely works | Child SER with raw-waveform DNN/DCNN reached UAR 61.1% / 59.2% (2025 review, Springer *IJST* [S]). Best adult categorical SER macro-F1 is about 0.43 on MSP-Podcast [T stt-v3]. Cross-corpus SER averaged 46.75% in one series [S]. Three-level child engagement from prosody reached UAR 55.8% against 33.3% chance (Gupta et al. 2016, CSL [S]) | Even if it were allowed, it would be too weak to act on |
| Population norms are biased | Whisper WER for children is about 25% against about 3% for adult read speech (Learning Agency summary [S]). A CHI 2025 study found significant demographic disparities [S]. Child F0 runs to 400-600 Hz, and trackers make octave errors in noise and narrowband audio [S] | Every acoustic norm built on adults or US children mis-reads an 8-13-year-old Hinglish speaker. Only the child's own history is a fair reference |
| Culture changes display | Help-seeking models failed to transfer to Costa Rica (Ogan 2015) [V via DA]. Indian children learn that admitting confusion is punished (DA6) [T]. Observers warn of "less demonstrative" cultures (Baker 2010) | The *absence* of a confusion cue is weightless. Silence is not understanding |
| Temperament and context confound | Shy, new or quiet children are slow without being disengaged (EA §5.12) [T]. A parent in the room suppresses talk. Mic, room and Bluetooth changes shift every acoustic feature (`features.ts` re-reads `outputLatency` per turn for this reason) [T] | Baselines are per child × context (answer / read-aloud) × feature, re-anchored per session (DA3's session baseline from the first engaged items) |
| Over-interpretation harms | Alpha School's camera and "waste meter" regime left students feeling like "a lab rat" (rejected entry [T]). Replika harms came through users feeling the bot had emotions they must attend to [T RELATIONAL-OS] | No label is ever shown to the child or the parent (RELATIONAL-OS). The teacher *displays* her own affect and never *claims* to read the child's ("you sound sad" is banned, EA §1) |

**How a per-child baseline should work (already mostly built, `server/voice/features.js`):**
- Transform right-skewed timing with log(1 + ms/100). Floor the SD so a young, flat baseline cannot produce z = 10.
- Score the utterance against the baseline *before* it, so an utterance never dilutes its own surprise.
- Update only on reliable turns. After 300 samples, switch to an exponential window so the baseline follows the child.

**What is missing:**
- **Item-difficulty adjustment of latency.** A hard item is slow for everyone. This is the IRT response-time point, and
  it is UD's ESE covariate. Without it, a run of hard items looks like hesitation.
- **A session anchor**, so a bad-mic day does not read as a slow child (DA3).
- **A working reliability gate on the live STT** (§0.5).

---

## 3. The signal catalogue

Each row gives what the signal predicts, the evidence, how to extract it and what that costs, the failure modes for
8-13-year-old Hinglish speakers on phone mics, its tier, and its Taxila status.
Cost key: **0** = regex or arithmetic in code (< 1 ms); **D** = on-device DSP, already running in `dsp.ts`; **C** = rides
on the existing classify call (TB4, +25-148 ms p50, measured, not on the signals budget); **N** = new compute.

### 3.1 Task and log signals (what the child did)

| signal | predicts | evidence | extraction / cost | failure modes (8-13, Hinglish, phone) | tier | Taxila |
|---|---|---|---|---|---|---|
| **Graded correctness sequence → KT posterior** | current mastery; next-item success | BKT/DKT/FSRS family; this is the backbone of every ITS (KT doc [T]) | code, 0 | ASR mis-hearing scored as wrong. Use the `no_evidence` outcome on low-confidence ASR, which is currently blind on the live lane (§0.5) | T | built (`server/learner/bkt.js`, `kt/`) |
| **Which wrong answer (misconception match)** | the specific faulty model; what to reteach | diagnostic distractors (Eedi; MAP); misconception harvesting (UD S4) [T] | classify `match` (C) | open spoken answers rarely match a closed set exactly. Partial credit needs a rubric, not an LLM grade ("a model never grades") | T | built (classify match) |
| **Delayed and woven transfer success** | durable understanding: the ground truth for "really understood" | delayed tests separate performance from learning (Soderstrom & Bjork 2015 [S via LS]). Eedi deferral of uncertain predictions gave +2.3-3.0 pp accuracy (Mitton 2026 [V via decisions]) | scheduler (CE7) | sparse (one probe per skill every few topics), and confounded by intervening practice | T | built (comprehension schedule) |
| **Impasse count on the current step** | recovery odds on the next turn | each extra impasse turn cut next-turn recovery odds by 12.7% (AOR 0.873; 20,462 turns; Ahtisham 2026). Addressing the error beat re-asking, 39.8% vs 28.1% recovery [V via DA] | counter, 0 | a "non-progress" turn must be defined by the step, not by surface words | T | partly (DA5 rule; `dontKnowStreak`) |
| **Wheel-spinning** (≥ 10 opportunities, no 3 correct in a row) | will not master without a change | about 38% unmastered at 10 opportunities (Beck & Gong 2013); 50% of the bottom fifth against 10% of the top (Wan & Beck 2015) [S/V via DA] | counter, 0 | the two common criteria diverge (Kai 2018). Taxila items vary in kind, so count by skill and item class | T | built (`wheelSpinning`) |
| **Gaming the system** (fast action after an error, cycling through answers, help abuse, repeated "just tell me") | shallow learning; boredom antecedent | GAMED-HURT detector A′ 0.80 on new students (Baker et al. 2008). Expert-rule gaming detector κ 0.33 held out (Paquette & Baker 2019). Gaming students talk *more* (Zhang 2026) [V via DA] | counters + onset (0) | spoken answers have no "fast click"; voice rapid-guessing needs `onsetMs` from the client, which now exists. Repeating one wrong answer is a held belief, not gaming (already in code) | T (+E for speed) | built (`gaming`); speed half not wired |
| **Rapid guessing / response-time effort** | non-effortful answer; the item is uninformative | RTE (Wise & Kong 2005); NT10 threshold; about 1% prevalence at scale [V via DA]. Low-RTE share tripled across the school day in grades 2-8 (Wise, Kuhfeld & Lindner 2024 [V via DA]) | onset vs item norm (0) | tap answers and spoken answers need separate norms. Pipeline latency must never be read as the child (rule 8) [T] | E | not built for voice |
| **Answer change within a turn or episode** (wrong → right, right → wrong) | monitoring and control; fragile knowledge when right → wrong | children detect their own errors poorly: about 24% of selected misspellings were actually revised (Metacognition & Learning 2026 [S]). Fourth graders kept 74.5% correct and 32.7% incorrect answers on revision [S]. Proficient early readers self-correct about 1 in 3 errors, slower readers about 1 in 20 [S] | transcript diff within the turn (0) or across attempts (0) | ASR may collapse "teen… nahi, chaar" into "chaar". MAI verbatim keeps the false start, gpt-4o-transcribe may not [U] | T | partial (`selfCorrectionCount` counts, but not by direction) |
| **Hint and help use pattern** | productive vs avoidant help-seeking | asking for help on hard steps was productive and overuse was not. *Avoiding* help on low-prior-knowledge steps went with better learning (Roll 2014, n = 38) [V via DA] | counters (0) | in voice, help requests are lexical ("ek hint do"). Classify must catch Hindi forms | T | partial (`asksForAnswer`) |

### 3.2 Lexical and metacognitive signals (what the child said about their knowledge)

| signal | predicts | evidence | extraction / cost | failure modes | tier | Taxila |
|---|---|---|---|---|---|---|
| **IDK split**: "pata nahi / nahi aata" (not known) vs "yaad nahi aa raha / bhool gaya / zubaan pe hai" (can't recall) | whether a recall cue or teaching is needed; feeling-of-knowing (FOK) | Smith & Clark 1993 (n = 25 adults, 40 questions each): weaker FOK went with more "I don't know" than "I can't remember", plus rising intonation, hedges and fillers [V abs via UD] | regex (0) + classify act `idk_*` (C) | children's metalinguistic precision is lower. "Pata nahi" is also a politeness hedge and a shy default. Untested in Hindi children (UD's new-paper claim) | T | built (wb-idk-split, TurnSignals) |
| **Hedge on a correct answer** ("shayad", "I think", "lagta hai", "pata nahi par…", "hai na?") | unsure-correct: lucky or fragile knowledge, worth a "why?" probe | Smith & Clark 1993 [V]. Prosodic and lexical uncertainty detection reached 69-75% accuracy on adults (Pon-Barry & Shieber 2011; Litman & Forbes-Riley) [S]. A Wizard-of-Oz uncertainty-adaptive ITSPOKE gave significantly higher learning than the non-adaptive control; the automatic version was limited by detector errors [S/V via EA] | regex (0) | "hai na?" is a tag question used as a turn-yield in Indian English, not always doubt [U]. Use it only with correctness, never alone | T | in EA table; not coded as a feature |
| **Self-repair that ends correct** | executive function and monitoring; not the same as hesitation | self-correcting a miscue is predicted by better executive function beyond reading skill (working memory +9%, shifting +7% of variance; Nguyen, Del Tufo & Cutting 2020, n = 82, age about 7.5 [V via UD]) | transcript (0) | needs a verbatim transcript (§0.5). Shares tokens with disfluency, so S6 in UD separates them | T | counted (`selfCorrectionCount`), not split by outcome |
| **Explicit frustration / self-label words** ("uff", "phir galat", "nahi hoga", "main buddhu hoon", "mujhse nahi hota") | unresolved impasse; risk to self-concept | high precision when present. Direct affect expressions did **not** predict emotions in AutoTutor transcripts, while linguistic and cohesion features did (R² = .38; D'Mello & Graesser 2012) [V via DA]. So many children stay quiet instead | regex (0) + classify `frustration_words` (C) | quoting, negation ("nahi, mushkil nahi hai"), play-acting. Absence is weightless (DA6) | T | built |
| **Meta-requests** ("thoda dheere", "phir se bolo", "break chahiye") | pace mismatch; overload | DA, TB4 acts `meta_slow` / `meta_break` [T] | classify (C) + regex fallback | shy children rarely ask. The teacher has to offer | T | built |
| **Minimal or withdrawn responses** (turn ≤ ⅓ of the child's own median, twice, plus a non-answer) | disengagement or overload | disengaged turns correlated negatively with learning in ITSPOKE, and an automatic detector reproduced the manual correlations (Forbes-Riley & Litman 2013) [V via DA]. AutoTutor items flagged against a 3-5-question baseline had 18.5% accuracy against 71.8% (Chen 2021, n = 252) [V via DA] | word counts (0) | the "haan ji" deference register is short by culture. Must be per child | T | partial (`minimalStreak`, not relative to the child's own median) |
| **Explanation quality / teach-back / self-explanation** | understanding beyond recall (the U and T facets) | the self-explanation effect (Chi et al. 1989, 1994 [S via LS]). ICAP: constructive and interactive beat active (Chi & Wylie 2014 [S via UD S8]). Retell scoring by idea units (UD S9) | idea-unit match (0) first, model second (C) | young or ESL children explain in fragments and Hindi. Score ideas, not English fluency (fairness) | T | in comprehension facets |
| **Filled pauses as words** ("umm", "aa", "matlab", "woh", "haan toh", "kya bolte hain") | difficulty retrieving or planning. In children, disfluency tracks *accuracy* more than confidence | West, Baer, Yu & Odic 2025, *Dev Sci* (ages 5-8) [S via UD]. 7-8-year-olds produced longer onsets and rising contours on low-confidence trials; fillers and vowel lengthening emerge from about age 5 (Hübscher & Prieto 2019, *Front. Psychol.* [S]). "uh" signals a short delay and "um" a long one (Smith & Clark 1993) [V] | transcript (0) when the STT keeps fillers; acoustic `flatVoicedRuns` (D) otherwise | "matlab", "woh" and "like" are also content words and discourse markers. Only a phrase-initial position counts, and filled pauses behave partly as discourse markers (Crible 2023; Kosmala & Crible 2022 [S]). gpt-4o-transcribe may delete fillers [U] | T (+E for the acoustic detector) | counted (`fillerCount`, `flatVoicedRuns`) |

### 3.3 Timing signals (when and how fast)

| signal | predicts | evidence | extraction / cost | failure modes | tier | Taxila |
|---|---|---|---|---|---|---|
| **Response onset latency** (child speech start minus the end of teacher audio *as played on the device*), z within the child and adjusted for item difficulty | knowledge strength and retrieval fluency; low confidence | first-response time improved KT prediction (Wang & Heffernan, EDM [V abs]). Speed-accuracy scoring in Math Garden (Maris & van der Maas 2012) [S]. Longer onsets on low-confidence trials at age 7-8 (Hübscher & Prieto) [S]. Children's median gap was 625 vs 371 ms for adults, slower well into middle childhood (Casillas & Frank 2016) [S] | on-device (D), already measured with echo, output-latency and pre-roll handling [T] | Bluetooth latency changes; echo of the teacher; the child starts with a filler (onset is early but the answer is late, so add an onset-to-first-content-word measure); thinking aloud; a parent prompting | E | built (`onsetMs`, baselined) |
| **Within-answer pause structure** (count, longest, pause fraction) | planning load, retrieval difficulty | confidence went with fewer and shorter pauses (Pon-Barry 2008, adult) [V abs]. Long pauses and overlap separated high- and low-engagement child teams in robot-mediated learning [S] | D | children's read speech pauses more. Code-switch boundaries add pauses. MIN_PAUSE_MS 250 is a reading convention [T] | E | built |
| **Speaking and articulation rate** | fluency; fatigue drift over a session; reading fluency (WCPM) | WCPM is a validated oral reading fluency measure (DIBELS lineage) [S]. Confidence correlates with faster speech (Pon-Barry 2008) [V abs] | words over voiced time (D + transcript) | ASR word counts differ by script. Devanagari vs Roman tokenisation changes "words" | E | built |
| **Barge-in on the teacher** | impatience, already knows, or wants the floor (engagement); or echo | barge-in handling is attunement (EA §6.4) [T]. No child-tutoring effect size found [U] | link events (0) | speaker echo produces false barge-ins. Siblings | E (interaction) | logged (`bargeIn`), utterance excluded from baselines |
| **End-of-turn probability** | the child has finished, versus is thinking ("ruko… sochne do") | VAP models predict future voice activity in 4 bins out to 2 s (Inoue et al. 2024, multilingual LREC-COLING) [V abs]. Smart Turn v3: Hindi included, 12 ms CPU [V vendor]. LiveKit text EOT: Hindi TPR 99.4%, TNR 96.3% [V vendor] | N: CPU model client- or server-side, 12-37 ms, **outside** the 30 ms signals budget because it runs on the VAD path, not the turn path | trained mostly on adults. Children's long mid-turn pauses are exactly the hard case. Validate on E1 child audio before trusting it | E (turn state, not emotion) | not built (§4) |

### 3.4 Acoustic prosody and voice (how it sounded)

| signal | predicts | evidence | extraction / cost | failure modes | tier | Taxila |
|---|---|---|---|---|---|---|
| **Terminal F0 slope** (last 500 ms) | uncertainty in English answers | confident utterances fall and uncertain ones rise (Pon-Barry 2008) [V abs]. Children and adults produce and perceive audiovisual uncertainty cues (Krahmer & Swerts 2005) [V abs]. 3-4-year-olds already use rising uncertainty contours (Hübscher & Prieto 2019) [S] | D (YIN, already running) | **the Hindi confound (§5.2):** every non-final Hindi accentual phrase is L*+H, and yes/no questions end high. A Hinglish answer cut mid-phrase rises by grammar. Octave errors at child F0 over narrowband or Opus audio. Use only phrase-final, only within the child's own language-mode baseline | E (grey: closest to "speech patterns"). UD recommends **excluding pitch at launch** | built (`f0EndSlopeStPerS`, in `signalsFrom`) |
| **F0 level and range** (median, IQR in semitones) | engagement (loudness and F0 related to engagement in child-robot speech games, Chaspari et al. 2016 [S]); fatigue (F0 falls with sleep deprivation, adults [S]) | weak and indirect for tutoring | D | **X risk: arousal by another name.** Range collapses on one-word answers. Cold, phone, puberty (13-15) | E at best; do not act on it | baselined only |
| **Energy / loudness** | arousal (literature) | n/a on this pipeline | — | **measured after AGC and noise suppression, so meaningless** [T] | — | stored, not baselined (correct) |
| **Voice quality** (jitter, shimmer, breathiness, creak) | fatigue and arousal in adults | sleep-deprivation voice studies (adult; ML F1 about 0.80 on voice reaction time [S]) | N (needs ≥ 16 kHz clean frames) | codecs and noise suppression destroy jitter and shimmer; children's voices are unstable by nature. No child tutoring evidence | X-adjacent | **reject for now** |
| **Laughter event** | shared humour, rapport, affiliation; licenses laughing along | laughter detector robust in noise (Gillick et al. 2021, Interspeech, open code) [V]; newer segmenters improve onset accuracy by about 1 s [S]. Rapport literature treats shared laughter as coordination (Zhao/Cassell [S]) | transcript token (0) from STT; acoustic detector N (small CNN, not benchmarked on children) | children's giggles vs coughs vs TV laughter. **Name it `childLaughed`, never "happy"** | T (transcript) / E (acoustic event) | TB `childLaughed` from the humour act (text) |
| **Sigh / exhale event** | effort, giving up, relief | no tutoring validation found [U] | N | breath noise on phone mics; impossible to tell relief from frustration (the Barrett problem) | X-adjacent | **reject** |
| **Acoustic filled-pause detector** (flat voiced run ≥ 300 ms, < 1 semitone spread) | the same as transcript fillers, independent of the STT | Hübscher & Prieto; Smith & Clark [S/V] | D (already running) | sustained vowels in Hindi words ("aaaam" for mango, "naaa") | E | built (`flatVoicedRuns`) |

### 3.5 Relational and rapport signals (the relationship over time)

| signal | predicts | evidence | extraction / cost | failure modes | tier | Taxila |
|---|---|---|---|---|---|---|
| **Child self-disclosure / personal share** ("aaj school mein…", "mera kutta…") | rapport; relationship formation; learning (correlational) | children's self-disclosure to a robot correlated with vocabulary learning and relationship ratings (Kory-Westlund & Breazeal 2019, *Front. Robot. AI*, long-term preschool study [S]). Self-disclosure is a rapport strategy, recognised at > 80% accuracy and κ 0.6-0.8 with multimodal features (Zhao, Sinha, Black & Cassell 2016) [V abs] | classify `personalShare` (C) | **safety overlap:** a disclosure can be a safeguarding disclosure (distress or harm words go to the floor first). A stored "share count" is a relationship score, which NM-3 forbids; keep it in the session (in memory) only | T | built (TurnSignals) |
| **Humour initiated by the child** (joke, silliness, wordplay) and the teacher's uptake | comfort; a safe-to-be-wrong climate | teacher humour and laughing *with* the child rose from 1/3 to 3/3 with notes (EA [M], n = 3). Humour in the rapport model (Zhao 2014) [S] | classify `humour` (C) | provocation ("aap pagal ho") is testing limits, not humour (EA §5.13) | T | built |
| **Initiative**: child proposes a method, asks to try ("main karun?"), extends the task, changes the topic to a related idea | agency; engagement beyond compliance; ICAP constructive | coordination and mutual attentiveness are rapport goals (Zhao 2014) [S]. Student questions and initiative are near zero in classrooms (Graesser & Person 1994) [V abs] | classify act (C), a new act value | an off-topic change can be avoidance. Read it with task state | T | **new** (no act for it) |
| **Question-asking by the child**, split into clarify vs curious vs deep (why/how) | engagement; achievement correlates with question *quality*, not frequency | student questions were about 240x more frequent in tutoring than in class; quality correlated with achievement after training (Graesser & Person 1994, *AERJ*, 27 college students and 13 seventh graders) [V abs] | classify act `question_clarify` / `question_curious` (C) + a depth tag | Indian classroom norms suppress questions, so the base rate starts near 0. A rise from the child's own floor is the signal | T | built (2 acts; no depth) |
| **Lexical alignment / mirroring** (the child re-uses the teacher's terms: "numerator", "hara", the method name) | rapport and learning; uptake of the representation | automated pitch entrainment improved learning with a teachable robot for middle-school maths (Lubold, Walker, Pon-Barry et al. [S]). Lexical alignment studied with a teachable robot (2022 [S]). Entrainment correlates with tutoring success (Thomason et al. [S]) | token overlap with the teacher's last N turns, restricted to kit vocabulary (0) | echoing without understanding (parroting); a code-switch to Hindi terms counts as alignment only if they mean the same thing | T | **new** |
| **Persistence after error** (tries again without being asked, "ek aur", continues after not_yet) | motivation; productive struggle | confusion that resolves helps learning (D'Mello et al. 2014); boredom persists and leads to gaming (Baker 2010) [V via EA] | outcome sequence (0) | external pressure (a parent) produces persistence that is not motivation | T | partial (via KT) |
| **Address and politeness register shifts** ("didi" → name, "aap" → "tum", "ji" dropping) | stage of the bond; comfort | RELATIONAL-OS address fold [T] | regex (0) | regional variation; parent instructions | T | built in RELATIONAL-OS (W2-I) |
| **Rupture markers** ("aapne galat bola", "maine sahi kaha tha", sudden minimal turns after a correction) | a teacher-owned repair is needed | one intense negative episode can have lasting effects (D'Mello et al. 2014 review [V via EA]) | regex + outcome audit (0) | false positives when the child is wrong and insists | T | built in RELATIONAL-OS |
| **Voluntary return / session starts** | relationship and habit (not a score) | motivation-habits doc [T] | counts (0) | dark-pattern risk if optimised. NM-3 bars a stored relationship score; plain academic-record session counts are allowed (ROS-1 bond record) | T | conductor |

### 3.6 Session-level and fatigue signals

| signal | predicts | evidence | extraction / cost | failure modes | tier | Taxila |
|---|---|---|---|---|---|---|
| **Session position** (graded item count, minutes) and **time of day** | disengagement hazard; fatigue | low-RTE share tripled across the school day (Wise, Kuhfeld & Lindner 2024, grades 2-8). Mind wandering began around question 11-15 of 20 (Chen 2018) [V via DA] | 0 | Indian after-school and tuition schedules shift the curve. Measure it (DA-M5) | T | DA9 prior (design) |
| **Within-session drift of latency and rate** against the session's own first engaged items | slowing; overload or fatigue | AutoTutor deviation-from-baseline flags (Chen 2021) [V via DA]. Adult voice slows and flattens with sleep deprivation [S] | D + 0 | item difficulty rises through a lesson by design. Adjust for it or the drift is the curriculum | E (name it `slowerPace` / `offerBreak`, never "tired") | not built (session anchor missing) |

---

## 4. Turn-taking, backchannels and end-of-turn

**Why it matters more for children:**
- Children's gaps are about 1.7x adult gaps, and long within-turn pauses are normal [S].
- An adult-tuned VAD endpoint (500-800 ms silence) cuts a thinking child off mid-sentence. The teacher then answers a
  half-answer, which reads as "the teacher is deaf" (asr-kids-hinglish §722 [T]).
- EA [M] showed that thinking-aloud silence was filled with a hint in 5 of 6 runs, and once with the answer itself.

**What the field ships (2024-2026):**

| system | type | languages | cost | what is shown |
|---|---|---|---|---|
| Voice Activity Projection (VAP; Ekstedt & Skantze; Inoue et al. 2024 multilingual and real-time) | audio, stereo, 4 future bins to 2 s | En, Zh, Ja (multilingual paper) | small transformer, real-time CPU [S] | academic benchmarks; extensions for backchannel prediction (ACM ICMI 2025 [S]) |
| **Smart Turn v3 / v3.1 / v3.2** (Daily / Pipecat) | audio-only classifier on the last speech segment | 23 incl. **Hindi, Marathi, Bengali** | 8M params int8; 12 ms modern CPU, 37 ms c7a.medium [V vendor] | vendor accuracy only; open weights; community Tamil fine-tune exists [S] |
| **LiveKit turn detector** (text, multilingual) | transcript-based EOT | 14 incl. Hindi | small LM on CPU | Hindi TPR 99.4% / TNR 96.3%; v0.4.1 cut Hindi error 5.40 → 3.70% [V vendor] |
| Realtime APIs' semantic VAD | model-side | many | inside the paid call | opaque |

**Implications:**
- End-of-turn (EOT) is a **turn-state** inference, outside restriction 12 [U, low risk].
- Fusing audio EOT (Smart Turn) with text EOT (does the transcript form a complete answer to *this* question?) is the
  standard architecture.
- The child-specific gap is real: none of these was validated on 8-13-year-olds. **Measurement SG-M3:** EOT
  false-cut rate on E1 child audio, adult-tuned VAD vs the fused EOT, with a pre-registered target.
- **Backchannels.** Taxila rejected synthetic backchannels while the child talks, because of their mic-hold cost
  (`backchannel` rejection, EA §1 [H]). Backchannel *prediction* is still useful as a "keep waiting" signal: if the
  model predicts a backchannel slot rather than a turn end, the teacher stays silent and the avatar nods.

---

## 5. Cross-cultural and Indian-language specifics

### 5.1 Hinglish filled pauses and hedges (lexicon seeds) [U: compiled from the code lexicons and EA, not from a corpus]

| function | Roman | Devanagari | note |
|---|---|---|---|
| filled pause | umm, amm, aa, aaa, uh, hmm | अम्म, आ, ह्म्म | count only if phrase-initial or standalone |
| planning marker | matlab, woh, woh na, haan toh, toh, kya bolte hain, like, basically | मतलब, वो, हाँ तो, क्या बोलते हैं | **content words elsewhere**; count only before the answer content |
| hedge | shayad, lagta hai, mujhe lagta hai, I think, maybe, ho sakta hai, pakka nahi | शायद, लगता है, हो सकता है, पक्का नहीं | combine with correctness → unsure-correct |
| not known | pata nahi, nahi aata, maloom nahi, no idea | पता नहीं, नहीं आता, मालूम नहीं | IDK |
| can't recall | yaad nahi aa raha, bhool gaya/gayi, zubaan pe hai, abhi yaad tha | याद नहीं आ रहा, भूल गया | IDK_R |
| tag / turn-yield | hai na, na, right, theek hai? | है ना | **not doubt by default** in Indian English [U] |
| deference minimal | haan ji, ji, achha, okay | हाँ जी, जी | short by culture; per-child baseline |

**Research gap:** no Hindi or Hinglish child disfluency corpus was found. The search for Hindi "matlab" as a filled
pause returned nothing specific. Taxila's E1 corpus would be the first; it is a natural extension of the Smith & Clark
replication UD proposes.

### 5.2 Hindi intonation breaks the "rising end = unsure" cue [S]

- In Hindi, **every non-final accentual phrase carries a rising L*+H**. Final phrases end L% in declaratives and H% in
  yes/no questions (Patil et al. 2008, *JSAL*; Harnsberger 1994; Roy's 2017 review) [S].
- Rising non-final phrases are an **areal feature of Indian languages** (Féry et al.) [S].
- Indian English carries this LH phrasing [S].

So a Hinglish answer that stops mid-construction, or a child who answers in a phrase that grammar treats as non-final
("teen… kyunki…"), rises for reasons that have nothing to do with doubt. The English-trained rule (Brennan & Williams;
Pon-Barry) transfers only when:
1. it is measured at the **utterance-final** phrase, after the EOT says the turn ended;
2. it is baselined **per child × language mode** (hi / hinglish / en);
3. it is never used alone.

**Recommendation:** keep `f0EndSlopeStPerS` stored, remove it from `signalsFrom` cue counting until SG-M1 shows its
per-child LR on unsure-correct is above 1.2 in Hinglish turns. This matches UD's "never pitch at launch" advice.

### 5.3 Culture of the classroom

- **Silence about non-understanding.** Questions are rare, and "samjhe?" is phatic (DA, indian-teacher-discourse DL4)
  [T]. So the IDK and question signals start from a near-zero floor, and their *rise* is the signal.
- **Parent or sibling in the room.** Prompting produces fast, correct, low-ownership answers.
  - A voice that is not the child's should mark the turn unreliable for baselines (speaker change, not speaker ID:
    restriction 15 bars identity from voice) [U].
- **Code-switching is not a signal of difficulty by itself.** Switching to Hindi to explain is a resource. Mid-answer
  switches add pauses that inflate `pauseFrac`. Per-language-mode baselines absorb this.
- **Phone mics in Indian homes:** TV, traffic, pressure-cooker whistles, ceiling fans. Noise suppression is on, AGC is
  on, and Bluetooth earbuds add 100-300 ms of output latency, which `features.ts` re-reads every turn [T].

---

## 6. Products: claimed vs shown

| product | what it claims to extract | what is shown | relevance |
|---|---|---|---|
| **Hume EVI / Expression Measurement** | 48 dimensions of "emotional meaning" from speech prosody; empathic voice responses | trained on intensity ratings of 41.8 h of audio from 1,004 adult speakers (ages 20-66) in the US, South Africa and Venezuela. The docs say labels are proxies and "should not be treated as direct inferences of emotional experience" [V]. No child data. Third-party marketplace, not Azure-direct | **Tier X, off-directive.** Two lessons: even the market leader disclaims inference, and their dimensions are trained on adults |
| **Sesame CSM / Maya** | "voice presence": context-aware expressive *output* | CSM-1B open weights (Apache 2.0, March 2025); the evaluation covers output prosody and context use [V] | output side only. Confirms that conversational history drives prosody, so the listening lane can stay text-led |
| **Khanmigo** | teachers see "frustration loops" and off-topic chat through sentiment analysis; self-harm detection notifies the teacher [S] | no published validation of the frustration detector. Chalkbeat (2026-08-25) reported that students rarely engaged [S] | Tier T text sentiment shown to an adult. Taxila must never show a child-state label to the parent |
| **Amira** | miscues, insertions, omissions, **self-corrections** during oral reading | Evidence for ESSA: +0.15 average across 2 studies (n = 15,602); RCT +0.64 (n = 178, grades 1-4); matched +0.26 K / +0.06 G1 [V] | reading-fluency features are **validated**. Taxila's WCPM and read-accuracy follow this pattern. Self-correction is a measured reading construct |
| **Ello** | phoneme-level child speech recognition; adapts for accents and speech issues | vendor claims beat Whisper and Google; TIME Best Inventions 2024; **no peer-reviewed efficacy found** [S] | child-ASR quality matters more than affect for reading |
| **Speak / ELSA** | pronunciation, fluency (pace, pauses), intonation ("natural or flat"), grammar, vocabulary [V vendor] | vendor scores; adult learners | intonation is graded as *skill*, not emotion. A clean precedent for Tier E naming |
| **Squirrel AI** | 3,000-30,000 fine-grained knowledge components per subject; adaptive paths | one peer-reviewed study with SRI researchers (*ILE* 2020): grade 8 maths gains above teacher-led groups [S]. Other claims are self-commissioned [S] | KT granularity, not affect |
| **Duolingo (Max / Video Call)** | conversational practice; adaptive difficulty from KT (half-life regression) | HLR published (Settles & Meeder 2016) [S via KT]. No affect claims found | KT lineage |
| **Mindspark (India)** | frustration from log goal-blockage, with attribution messages | validated against observers; frustration instances fell across 188 students in 3 schools (Rajendran 2013, 2019) [V via DA] | **the closest precedent**: Indian children, log-only (Tier T), and it reported its reasons |
| **Alpha School** | camera, facial expression, "waste meter" | students described feeling like "a lab rat" [S, rejected entry] | the anti-pattern |

**Pattern:** every product with independent evidence measures **performance** (reading accuracy, KT) or
**dialogue/log behaviour** (Mindspark). Every "emotion from voice" product rests on vendor claims and adult training data.

---

## 7. Harms and failure modes specific to 8-13-year-old Hinglish speakers on phones

1. **The misheard child becomes the "struggling" child.** WER is far higher for children [S], and the live STT carries
   no confidence (§0.5). A turn the system misheard gets graded wrong, and its acoustic features then enter the
   baseline. **Fix first:** a reliability gate from MAI word confidence, or from a proxy (keyword match, length
   plausibility, VAD-vs-word-count agreement) [U].
2. **Speech difference reads as hesitation.** Stammering, articulation disorders and second-language learners all
   produce more pauses and fillers. A per-child baseline helps, because their normal *is* the baseline, but the first 8
   utterances are unscored. Also needed: a fairness check, where `signalsFrom` fire rates by speech-difference flag and
   home language must not differ beyond a set margin (UD's ESE kill condition (c)).
3. **Puberty (12-15).** F0 drops by up to an octave over months. Exponential windowing (N_MAX 300) follows it slowly.
   F0 features should carry age-band SD floors, or be dropped for 12+ [U].
4. **Surveillance creep.** Each new signal is a step toward a profile. RELATIONAL-OS rules hold: session-only affect, no
   stored emotion or trust scores in default modes, no labels to parents or child. Restriction 17 requires valid consent
   for persistent tracking of biometric data. Per-child *acoustic baselines* are persistent, so the E1 consent text must
   name them (stt-v3 §6.6).
5. **Over-reaction.** Constant check-ins read as surveillance and cost time. DA10's budget (≤ 1 verifying move per 4
   child turns) applies to every signal here. Affective support helped low-knowledge learners in session 2 and *hurt*
   high-knowledge learners in session 1 (Affective AutoTutor, n = 84 [V via EA]).
6. **Safety masking.** Signals must never delay or soften the safety floor. Distress or harm words, including the
   passive-ideation predicate (`server/director/safety.js` §A2), outrank every signal. A self-disclosure detector must
   hand off to the floor before rapport logic sees it. A signal can *add* a check-in after distress. It can never remove
   or reword a floor response.
7. **The S2S model cannot be the ear.** Audio LLMs lose paralinguistics before output (2609.00727 [V via UD]), and
   Taxila's own probe found 0 check-ins out of 18 near-tears clips (EA [M]). All signals are computed in code and passed
   as structure, never as "listen to her tone" in a prompt (a false capability claim [H]).

---

## 8. What "world-class" means here (the synthesis)

World-class is **not** more acoustic models. It is:
1. **Evidence-first fusion.** Every signal is an LR-style weight on a hypothesis about *knowledge*, *turn state* or
   *what move helps*. Each LR is measured on Taxila children against delayed outcomes, with abstention when the signals
   disagree. That is UD's ESE plus DA's verify-before-act. No system publishes this for children's voice [V gap, UD §1.4].
2. **Per-child, per-context, per-language baselines** with item-difficulty adjustment and a reliability gate.
3. **Relational signals as first-class text features** (initiative, question depth, alignment, disclosure, humour,
   persistence, rupture), all session-only, all feeding RELATIONAL-OS's `decide()`, none stored as a score.
4. **Child-validated turn-taking** (fused audio and text EOT), so the teacher waits like a good human tutor.
5. **Tiered compliance encoded in the type system.** Signal outputs come from a closed vocabulary of action and
   evidence names. A lint fails the build on emotion words in `server/signals/**` identifiers and outputs. This is the
   "safety by predicate" law applied to restriction 12.

---

## 9. Ranked: the 25 most valuable signals

Ranked by *expected decision value for Taxila*: evidence strength × how often it fires × how much a better move is
worth × compliance safety. Cost is listed, not weighted. Low-cost Tier T signals rank higher at equal evidence.

| # | signal | decides | evidence | key source(s) | tier | cost | Taxila status |
|---|---|---|---|---|---|---|---|
| 1 | Graded correctness sequence → KT posterior (with `no_evidence` on unreliable ASR) | mastery, next item, reteach | **A** | BKT/DKT/FSRS lineage; KT doc | T | 0 | built; ASR gate broken on live lane |
| 2 | Delayed / woven transfer success | "really understood"; calibration target for all others | **A** | Soderstrom & Bjork 2015; Eedi deferral (Mitton 2026) | T | 0 | built |
| 3 | Which wrong answer (misconception match) | representation switch, targeted reteach | **A** | Eedi/MAP; UD S4 | T | C | built |
| 4 | Impasse count on the current step | address the error vs ask again; when to give a worked step | **A** | Ahtisham 2026 (20,462 turns, AOR 0.873) | T | 0 | partial |
| 5 | Explanation / teach-back quality (idea units) | U/T facets; whether a correct answer is understood | **A** | Chi self-explanation; ICAP; UD S9 | T | 0 + C | in comprehension |
| 6 | Hedge on a correct answer (unsure-correct) | "why?" / transfer probe instead of moving on | **B** | Smith & Clark 1993; UNC-ITSPOKE (WOZ learning gain) | T | 0 | new feature (EA table only) |
| 7 | IDK split: not known vs can't recall | teach vs recall cue; FSRS lapse vs pL drop | **B** | Smith & Clark 1993 (n = 25 adults) | T | 0 + C | built |
| 8 | Response onset latency, z within child, difficulty-adjusted | knowledge-strength evidence (ESE); wait time | **A** (knowledge, adults/ITS) / **B** (children) | Wang & Heffernan; Math Garden; Hübscher & Prieto; Casillas & Frank 2016 | E | D | built; difficulty adjustment missing |
| 9 | Gaming pattern (fast after error, answer cycling, repeated "just tell me") | try-first hints, open response; discount evidence | **A** | Baker 2008 (A′ 0.80); Paquette & Baker 2019 | T (+E speed) | 0 | built (text half) |
| 10 | Wheel-spinning | prerequisite detour; stop serving similar items | **A** | Beck & Gong 2013; Wan & Beck 2015; Kai 2018 | T | 0 | built |
| 11 | Self-repair that ends correct (and answer-change direction) | monitoring evidence; a positive metacognition note; right → wrong flags fragile knowledge | **B** | Nguyen et al. 2020 (n = 82); answer-revision studies | T | 0 | counted; direction not split |
| 12 | Child question-asking, by type and depth | engagement; curiosity uptake; a clarify question is an understanding gap | **B** | Graesser & Person 1994 | T | C | built (2 acts); depth new |
| 13 | Explicit frustration / self-label words (bilingual) | smaller step, reactive empathy; self-concept repair | **B** (high precision, low recall) | D'Mello & Graesser 2012; Mindspark (Rajendran 2019) | T | 0 + C | built |
| 14 | Session position / time of day + within-session latency drift | break offer, wrap timing, lower load | **A** (position) / **B** (drift) | Wise, Kuhfeld & Lindner 2024; Chen 2018; Chen 2021 | T + E | 0 + D | prior only; session anchor missing |
| 15 | Minimal / withdrawn turns relative to the child's own median | choice move, activity change | **B** | Forbes-Riley & Litman 2013; Chen 2021 | T | 0 | partial (not child-relative) |
| 16 | End-of-turn probability (fused audio + text) | wait vs speak; protects thinking time | **B** (adult benchmarks) / **C** (children) | VAP (Inoue 2024); Smart Turn v3; LiveKit EOT | E (turn state) | N 12-37 ms CPU | not built |
| 17 | Filled pauses before answer content (transcript, plus the acoustic flat-run backup) | retrieval difficulty; with correctness, accuracy risk | **B** | West et al. 2025 (5-8 y); Smith & Clark 1993; Hübscher & Prieto | T / E | 0 / D | counted |
| 18 | Child self-disclosure / personal share | relational uptake (session-only); safeguarding route first | **B** | Kory-Westlund & Breazeal 2019; Zhao et al. 2016 | T | C | built |
| 19 | Initiative (proposes a method, asks to try, extends) | hand the child control; ICAP constructive credit | **B** | Zhao 2014 rapport model; Graesser & Person 1994 | T | C | **new act** |
| 20 | Lexical alignment with the teacher's representation terms | uptake of the representation; rapport | **B** | Lubold et al. (pitch entrainment improved learning); lexical alignment with teachable robots; Thomason et al. | T | 0 | **new** |
| 21 | Persistence after a not_yet (unprompted retry, "ek aur") | productive struggle: allow more time before help | **B** | D'Mello et al. 2014; Baker 2010 | T | 0 | partial |
| 22 | Humour initiated by the child (and the teacher's uptake) | laugh-with licence; safe-to-be-wrong climate | **B/C** | EA probe [M n = 3]; Zhao 2014 | T | C | built |
| 23 | Within-answer pause structure + speaking rate (child z) | `slowerPace`, longer wait | **B** (adult) / **C** (child) | Pon-Barry 2008; child engagement prosody studies | E | D | built |
| 24 | Laughter event (`childLaughed`, transcript first, acoustic later) | laugh-along licence, never "happy" | **B** (detection) / **C** (meaning) | Gillick et al. 2021 | T / E | 0 / N | text half built |
| 25 | Rupture markers (contesting a grade, sudden minimal turns after a correction) | teacher-owned repair before the next move | **B/C** | D'Mello et al. 2014 review; RELATIONAL-OS | T | 0 | built in W2-I |

**Explicitly not in the top 25, and why:**
- **Terminal F0 slope:** the Hindi LH confound, and the closest to restriction 12. Keep it stored and out of decisions
  until SG-M1.
- **F0 level and range:** arousal by another name.
- **Energy:** measured after AGC, so it is meaningless here.
- **Jitter, shimmer and voice quality:** codec-destroyed, with no child evidence.
- **Sigh:** uninterpretable.
- **Any SER, valence or arousal model:** Tier X.
- **The S2S model's own "hearing":** shown not to work (EA [M]).

---

## 10. Implications for the build (input to the integration plan, not the plan itself)

Owned paths for this workstream: `server/signals/**`, `src/signals/**`, `evals/signals/**`, `docs/design/signals/**`. Do
**not** edit W2-E files (`server/learner/affect.js`, `server/director/classify.js`, `server/persona/signals.js`,
`src/lesson/{floor,turnModel,vad,cascadeLink}.ts`, `server/voice/stt.js`) or W2-I files (`server/relational/**`,
`server/director/safety.js`, `server/learner/mode.js`).

1. **`server/signals/` as a pure layer.** It takes `(turnText, outcome, item, voiceZ, session)` and returns
   `SignalFrame { evidence: {...LR in [0.9, 1.1]}, licences: {followUpProbe, gentlerHint, slowerPace, waitLonger,
   offerChoice, offerBreak}, relational: {initiative, alignment, persistence, rupture?}, reliability }`.
   - Budget: ≤ 30 ms p99 with 0 network. Regex, arithmetic and lookups only. Model-derived acts arrive already parsed
     from TB4.
   - It is consumed by W2-E's Moment and W2-I's `decide()` through a seam that W2-E or W2-I wire. This layer never
     edits their files.
2. **Closed output vocabulary plus an emotion-word lint** (§8.5), with a test that fails on `frustrat|bored|anxi|sad|happy|
   arous|valence|mood|stress|tired|confus` in identifiers and output keys under `server/signals/**`, `src/signals/**`.
   - Exception: dialogue-act names the child *said*, such as `frustration_words`, which are inputs, not outputs.
3. **New text features (Tier T, cost 0):**
   - unsure-correct (hedge × correct)
   - self-repair direction
   - initiative (regex seed now, a TB4 act later through W2-E)
   - lexical alignment against kit vocabulary
   - persistence after not_yet
   - child-relative minimal turns
   - filler-before-content position
4. **Acoustic changes (Tier E, `src/signals/`):**
   - an onset-to-first-content-word measure;
   - a session anchor;
   - a per-language-mode baseline key (`context|lang|feature`, which needs a server change: a W2-E or voice owner
     decision);
   - `f0EndSlopeStPerS` removed from `signalsFrom` cue counting (owner decision; `server/voice/features.js` is outside
     this workstream).
5. **Reliability gate first:** propose to W2-E (it owns `stt.js`) that MAI word confidence or a proxy fills
   `asrConfidence` on the live lane. Until then, acoustic z on live-lane turns should be marked `reliable: false` when
   VAD duration and word count disagree.
6. **EOT:** an offline bake-off of Smart Turn v3.x (ONNX, CPU) against the current VAD on E1 child audio (`evals/signals/eot-*`)
   before any hot-path change.
7. **Compliance:** add to the open item in `ct-no-voice-emotion-inference` a written question to Microsoft listing the
   Tier E outputs exactly (§1.3).

---

## 11. Measurement backlog (pre-registered; nothing here is measured yet)

| id | question | method | pass / reverse |
|---|---|---|---|
| SG-M1 | Does terminal F0 slope carry unsure-correct information in Hinglish? | E1 consented audio, coders mark unsure-correct; per-child LR by language mode, phrase-final only | LR ≥ 1.2 in hinglish **and** hi turns → re-admit; otherwise keep it out |
| SG-M2 | Do hedges-on-correct predict delayed failure? | ESE design (UD §4): P(delayed success \| correct now, hedge) vs no hedge | ΔAUC ≥ 0.03 on delayed items within skill |
| SG-M3 | Does fused EOT cut fewer thinking children off? | E1 audio replay; false-cut rate and added latency, VAD vs Smart Turn vs fused | false cuts −50% at ≤ +150 ms median response delay |
| SG-M4 | Does gpt-live-transcribe drop fillers and false starts relative to MAI-Transcribe-2? | 30 disfluent child clips, filler recall per STT | if recall < 0.6, transcript filler features use the acoustic detector on that lane |
| SG-M5 | Initiative and alignment as predictors | session-level correlation with delayed success and next-session return (no stored score: computed on export) | ρ ≥ 0.15 with the 80% CI excluding 0 → keep; else drop |
| SG-M6 | Fairness | `signalsFrom` and new-licence fire rates by home language and speech-difference flag | difference ≤ 0.02 in fire rate per 100 turns, else remove the feature for everyone |
| SG-M7 | Lexicon precision | 120-turn two-rater set for hedge, IDK_R, initiative, frustration words (Roman + Devanagari) | precision ≥ 0.8 per lexicon (wb-idk-split's bar) |
| SG-M8 | Signals budget | unit benchmark of `server/signals` per turn | ≤ 30 ms p99, 0 network |

---

## Sources

**Primary or abstract read this session [V]:**
- Microsoft, *Code of Conduct for Microsoft AI Services* v4.0, 2026-05-01: https://learn.microsoft.com/en-us/legal/ai-code-of-conduct
- Barrett, Adolphs, Marsella, Martinez & Pollak 2019, Emotional expressions reconsidered, *PSPI* 20(1):1-68, doi:10.1177/1529100619832930: https://www.semanticscholar.org/paper/c489b6787c5af8aca97f4761343a66f3f189b35d
- Microsoft Azure Face emotion retirement, 2022 (Crampton quote): https://www.itbusinessedge.com/business-intelligence/microsoft-drops-emotion-recognition-facial-analysis/ ; https://www.siliconrepublic.com/enterprise/facial-recognition-microsoft-azure-ai
- EU AI Act Art. 5(1)(f) analysis (FPF): https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/
- Hume Expression Measurement, prosody model and science pages: https://dev.hume.ai/docs/expression-measurement/models/prosody ; https://dev.hume.ai/docs/expression-measurement/science
- Sesame, Crossing the uncanny valley of conversational voice: https://www.sesame.com/journal/crossing-the-uncanny-valley-of-voice
- Smart Turn v3 (Daily): https://www.daily.co/blog/announcing-smart-turn-v3-with-cpu-inference-in-just-12ms/ ; v3.1: https://www.daily.co/blog/improved-accuracy-in-smart-turn-v3-1/
- LiveKit turn detector: https://docs.livekit.io/agents/logic/turns/turn-detector/ ; https://livekit.com/blog/improved-end-of-turn-model-cuts-voice-ai-interruptions-39
- Inoue et al. 2024, Multilingual turn-taking prediction using VAP, LREC-COLING: https://aclanthology.org/2024.lrec-main.1036/ ; real-time VAP: https://ui.adsabs.harvard.edu/abs/2024arXiv240104868I/abstract
- Gillick et al. 2021, Robust laughter detection in noisy environments, Interspeech: https://www.isca-archive.org/interspeech_2021/gillick21_interspeech.html ; code: https://github.com/jrgillick/laughter-detection
- Zhao, Sinha, Black & Cassell 2016, Automatic recognition of conversational strategies: https://www.justinecassell.com/publications/Zhao-Sinha-Black-Cassell_Sep2016.pdf
- Graesser & Person 1994, Question asking during tutoring, *AERJ*: https://eric.ed.gov/?id=EJ482577
- Pon-Barry 2008, Prosodic manifestations of confidence and uncertainty, Interspeech: https://www.isca-archive.org/interspeech_2008/ponbarry08_interspeech.pdf
- Krahmer & Swerts 2005, How children and adults produce and perceive uncertainty in audiovisual speech: https://doi.org/10.1177/00238309050480010201
- Wang & Heffernan, Leveraging first response time into KT: https://files.eric.ed.gov/fulltext/ED537228.pdf
- Amira, Evidence for ESSA: https://www.evidenceforessa.org/program/amira/

**Secondary (search summary, review or citing work) [S]:**
- Hübscher & Prieto 2019, Children's signaling of their uncertain knowledge state, *Front. Psychol.* 10:1259: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.01259/pdf
- Casillas & Frank 2016, The development of children's ability to track and predict turn structure, *JML*: https://chatterlab.uchicago.edu/lab-publications/Casillas_Frank_2016_The_development_of_childrens_ability_to_track_and_predict_turn_structure_in_conversation_JML.pdf ; turn-taking development review 2025: https://link.springer.com/article/10.3758/s13423-025-02749-8
- Forbes-Riley & Litman, uncertainty-adaptive ITSPOKE: https://www.sciencedirect.com/science/article/abs/pii/S0167639311000318 ; https://aclanthology.org/W14-4324.pdf ; Pon-Barry & Shieber, Recognizing uncertainty in speech: https://arxiv.org/pdf/1103.1898
- Patil et al. 2008, Focus, word order and intonation in Hindi, *JSAL*: https://www.ling.uni-potsdam.de/~vasishth/pdfs/Patil-Kentner-Gollrad-Kuegler-Fery-VasishthJSAL2008.pdf ; Roy 2017, A systematic review of Hindi prosody: https://arxiv.org/pdf/1705.03247 ; The intonation of Indian languages, an areal phenomenon: https://www.researchgate.net/publication/281600861
- Speech emotion recognition in adults and children, review (2025, *IJST*): https://link.springer.com/article/10.1007/s10772-025-10229-6
- Gupta et al. 2016, engagement in children from prosodic cues, *Computer Speech & Language*: https://www.sciencedirect.com/science/article/abs/pii/S0885230815000923 ; Chaspari et al. 2016, child-robot acoustic engagement: https://www.isca-archive.org/interspeech_2016/chaspari16_interspeech.pdf
- Lubold et al., pitch adaptation and rapport with a robotic learning companion, *UMUAI*: https://link.springer.com/article/10.1007/s11257-020-09267-3 ; Thomason et al., Prosodic entrainment and tutoring dialogue success: https://www.semanticscholar.org/paper/122aef4c647cb0949d6683c3ee0c77b88cbd3583 ; lexical alignment with a teachable robot: https://arxiv.org/pdf/2209.11842
- Kory-Westlund & Breazeal 2019, long-term rapport and language learning with a peer-like robot, *Front. Robot. AI*: https://jakory.com/static/papers/Kory-Westlund-2019-Frontiers-LongTerm.pdf ; measuring children's long-term relationships with robots (IDC 2018): https://dl.acm.org/doi/10.1145/3202185.3202732
- Children's metacognitive awareness and self-correction of spelling (2026): https://link.springer.com/article/10.1007/s11409-026-09491-z
- Kosmala & Crible 2022, The dual status of filled pauses: https://doi.org/10.1177/00238309211010862 ; Crible 2023, DiSS: https://www.isca-archive.org/diss_2023/crible23_diss.html
- Sleep deprivation detected by voice analysis, *PLoS Comput Biol*: https://journals.plos.org/ploscompbiol/article?id=10.1371%2Fjournal.pcbi.1011849 ; voice reaction time and sleepiness: https://pubmed.ncbi.nlm.nih.gov/40612400/
- Children's ASR gap: https://the-learning-agency.com/the-cutting-ed/article/how-speech-recognition-systems-struggle-with-childrens-voices/ ; Kid-Whisper: https://arxiv.org/html/2309.07927
- Child F0 estimation (Hosom 2005): https://www.isca-archive.org/interspeech_2005/hosom05_interspeech.html
- Math Garden speed-accuracy scoring: https://www.researchgate.net/publication/268019650
- Khanmigo: https://www.cbsnews.com/news/how-classroom-ai-khanmigo-can-help-students-in-emotional-distress-60-minutes/ ; https://www.chalkbeat.org/2026/08/25/ai-tutoring-students-khanmigo-khan-academy-engagement-study/
- Ello: https://www.maginative.com/article/ello-raises-15-million-to-teach-children-to-read-using-ai/
- ELSA Speech Analyzer: https://elsaspeak.com/en/speech-analyzer ; Speak: https://www.speak.com/
- Squirrel AI: https://en.wikipedia.org/wiki/Squirrel_AI
- Ensembling LLMs to characterise affective dynamics in student-AI tutor dialogues (2025): https://arxiv.org/abs/2510.13862
- BEA 2025 shared task (tutor-move annotation κ 0.64-0.65): https://arxiv.org/html/2507.10579

**Carried from sibling Taxila docs (their tags apply):** Baker et al. 2008/2010; Paquette & Baker 2019; Hutt 2019;
D'Mello & Graesser 2012; D'Mello et al. 2014; Ahtisham 2026; Chen 2018/2021; Wise & Kong 2005; Wise, Kuhfeld & Lindner
2024; Roll 2014; Rajendran 2013/2019; Ogan 2015; Beck & Gong 2013; Wan & Beck 2015; Kai 2018; Smith & Clark 1993; West
et al. 2025; Nguyen, Del Tufo & Cutting 2020; Mitton 2026; Affective AutoTutor; audio-LLM paralinguistic loss
(2609.00727). See `docs/research/learner/dialogue-affect.md`, `docs/research/voice/emotion-attunement.md` and
`docs/research/world-best/understanding-detection.md` for their full references.
