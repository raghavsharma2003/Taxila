# Round 3 voicesig: voice signals that are proven, not hoped for (V2)

Status 2026-10-09. Stream `voicesig`, round 3. This file is the research the build stands on (how the best papers and
products detect and validate prosodic and disfluency knowledge-state signals, which children's corpora may be used and
for what), the design chosen and why, and what was rejected. Measured numbers live in `RESULTS.md` next to this file;
every number there carries n, method, date and population. Evidence tags as in the rest of the repo: [M] measured here,
[V] read at source, [S] from a search summary, [E] estimate, [U] unvalidated.

Earlier work this builds on and does not repeat: `docs/design/voice-signals/RESEARCH-SCIENCE.md` (RS: the adult and child
cue evidence, ITSPOKE, Hindi transfer, corpus survey), `RESEARCH-PLACEMENT.md` (RP: on-device placement, restriction 12),
`SPEC.md` (the eight knowledge states, the ladder, the gate), `context/rejected.md` voicesig entries (read first).

---

## 0. The answer on one screen

1. **Validated voice signals are validated against something that is not the voice.** Every system that has proven a
   voice signal did it against an external criterion: a later test (ITSPOKE: normalised learning gain; ARTS: delayed
   retention), a human-scored outcome (Amira / SoapBox: words-correct-per-minute agreement with expert scorers), human
   event annotation on held-out speakers (filler detection: PodcastFillers, AMI), or the next speaker's behaviour (turn
   taking: hold vs shift). None validated a voice signal by how it "sounds". Taxila keeps that rule: knowledge states are
   scored against task outcomes (O1-O4, SPEC §1.2), fillers against human word marks, the thinking-pause cue against
   whether the speaker actually went on.
2. **The two signals that transfer best are timing and fillers, and the evidence for them is strongest as floor
   signals and as trait (skill-level) measures, weakest as per-item knowledge reads.** Per-item voice adds little over
   text and grading (Project LISTEN: adjusted ΔR² 0.019 [V]); aggregated timing is a strong fluency measure (adjusted R²
   about 0.6 [S]); response time used to schedule practice beats fixed schedules on delayed retention (ARTS [V abs]); a
   filled pause right before a silence is one of the most reliable "I am not done" cues there is (Clark & Fox Tree 2002;
   Jiang, Ekstedt & Skantze 2023 [V abs]; never turn-final in Hindi/Urdu, Jabeen & Betz 2022 [V]).
3. **So this round does three things, each measured before and after on the same harness:**
   - raises the filled-pause detector's precision honestly (more AMI speakers, Hindi read-speech hard negatives, an
     operating point chosen on validation only, test read once), and reports Hindi false alarms beside it;
   - wires the detector into duplex as a **thinking-pause cue** (a filled pause at the end of the child's last voiced
     run ⇒ wait), measured on real Hindi speech (LiveKit EOT-Bench, CC BY 4.0) and through the real duplex bridge on
     the real STT recording, in shadow;
   - logs, in shadow, **what the teacher would have done** if each voice-read state were live (the counterfactual plan),
     so the first real children's lessons produce the comparison the pilot needs.
4. **Children.** No licence-clean children's corpus carries filler marks, outcomes and Indian children together. HiACC
   (Hinglish, 20 children aged 10-14, a Samsung phone) is the only acoustic match; its licence is contradictory (Zenodo
   record CC BY 4.0, the data article CC BY-NC 4.0 "academic/research use"), so it is used **for evaluation only** under
   the stricter reading, numbers only, audio deleted. Its transcripts do not mark fillers, so it can measure how often
   the detector fires on children's speech (and on adults' speech recorded the same way), not its precision on
   children. Precision on children needs the consented pilot (`PILOT-PROTOCOL.md`).

---

## 1. How the best systems detect and validate these signals

### 1.1 Spoken tutoring: the signal is validated by the learning it buys, not by the classifier

| system / study | signal | validated against | what was measured | what transfers |
|---|---|---|---|---|
| ITSPOKE-WOZ (Forbes-Riley & Litman 2011, *CSL* 25) | student uncertainty (human wizard) | normalised learning gain, 81 adults, 4 conditions | adapting to correct+uncertain turns: gain 0.626 vs 0.382 non-adaptive (p = .011) [V via RS §5] | the **move** is the active ingredient (treat correct+uncertain as needing substance); a random-remediation arm recovered part of it |
| UNC-ITSPOKE, automatic detector (Forbes-Riley & Litman 2011, *Speech Comm.*; 2014 SIGDIAL) | uncertainty from lexical + pitch + timing + energy | learning gain, 72 and 67 adults | benefit only for a subset; 2014: no overall difference (F(2,61) = 0.487) [V via RS §5] | **detector recall is the bottleneck**; an automatic detector with weak recall erases a large wizard effect |
| Project LISTEN (Zhang, Mostow & Beck 2007, AIED; Mostow & Duong 2009) | children's reading prosody, timing, help requests (grades 1-4) | cloze comprehension items; fluency / comprehension tests | per-item: adjusted R² 0.190 → 0.209; trait: prosodic contour similarity predicts fluency and gains [V / V abs] | per-item voice is a **weak state** signal; aggregated it is a **strong trait** |
| ARTS, adaptive response-time-based sequencing (Mettler, Massey & Kellman 2016) | response time + accuracy as "learning strength" per item | immediate and delayed retention; yoked fixed-schedule controls | adaptive beat fixed expanding and equal spacing on immediate and delayed tests in both experiments; the yoked control shows the gain comes from adapting to item and learner [V abs] | latency is a **validated scheduling signal** when it chooses *when to re-ask*, which is exactly SPEC §4.4's skill-level fluency aggregate |
| MyST (Ward et al. 2013) | none (no adaptation to voice) | learning gains vs human tutors | gains comparable to expert human tutors [S] | the corpus, not a signal |

Reading. A voice signal earns its place by moving a cheap, useful-either-way move (a "kaise socha?", a recall cue, a
longer wait, a re-ask) and is judged by whether that move improves a later outcome. That is SPEC's ladder; this round
does not change it. What this round adds is the logging that makes the comparison possible on real lessons (§4.3).

### 1.2 Children's cues: present, weaker, tied to accuracy more than to confidence

- West, Baer, Yu & Odic 2025 (*Developmental Science*, 5-8 y): more fillers, hedges and longer onsets on incorrect and
  low-confidence trials; where accuracy and confidence diverged, "fluency is a reliable tracker of accuracy but not
  confidence" [V abs via RS §3.1]. This is the strongest single support for outcome-defined (not feeling-defined) labels.
- Krahmer & Swerts 2005; Visser, Krahmer & Swerts 2014: children 7-11 produce the same cue set, smaller and clearer with
  age (11 > 8) [V abs]. Koriat & Ackerman 2010: latency's validity as a cue to accuracy rises from grade 2 to 5 [V abs].
- Turn-taking in children (Brahimi, Blanc & Fourtassi, IWSDS 2026, Ohio Child Speech Corpus, children 4-9 with adults,
  TalkBank): silence duration alone separates SHIFT from HOLD at AUC 0.62 (child-initiated 0.62); an acoustic VAP model
  reading the audio **before** the silence reaches balanced accuracy 93.96 (child-initiated 94.14), and for child-adult
  dialogue acoustic information alone was sufficient (lexical cues added little), unlike adult-adult Switchboard [V, full
  text read 2026-10-09]. Implication: for children the floor cue lives in the last stretch of audio, which is where the
  thinking-pause cue reads.

### 1.3 Fillers as floor signals (the duplex half)

- Clark & Fox Tree 2002 (*Cognition* 84): "uh" announces a short delay, "um" a longer one; speakers use them to keep the
  floor while planning [V, established].
- Jiang, Ekstedt & Skantze 2023 (ICPhS, VAP model): fillers do hold the turn, less strongly than expected because other
  cues are redundant with them; the filler's prosody and position change the hold probability; uh and um do not differ
  [V abs]. A search summary adds that the holding effect peaks after about 1.2 s of silence [S, not verified].
- Jabeen & Betz 2022 (Interspeech, Urdu/Hindi): uh-type (vowel only) fillers outnumber um-type; um-fillers are longer
  and followed by longer silences; fillers occur turn-initially and medially, **never turn-finally** [V via RS §4.2].
- Products: Smart Turn (pipecat, BSD-2) trains its end-of-turn model to treat "um" / "hmm" as incomplete precisely because
  transcription models drop fillers [V, Smart Turn v2 post via search]; community Hinglish fine-tunes report fillers as a
  weak slice (0.914 vs 0.932 overall) [S]. Taxila's own duplex engine already has a LEXICAL `fillerTail` marker
  (src/duplex/turnPolicy.ts, FILLER_TOKEN in two scripts) — it fires only if the STT spells the filler, and the real STT
  returned only 42/90 child segments verbatim in TaxilaFDB (`rj-duplex-verbatim-stt-sim-as-gate`).

### 1.4 Filler detection: how the field measures it

- PodcastFillers (Zhu, Caceres, Salamon; Interspeech 2022): 145 h, 35K fillers; VAD + ASR candidates + classifier;
  event-based metrics against human marks; ASR-based detection beats keyword spotting [V abs]. Its annotations are under
  an Adobe research licence (non-commercial) [S] — evaluation at most, never training.
- Transcription-free filler detection with neural semi-CRFs (Zhu et al., ICASSP 2023, arXiv 2303.06475): +6.4 segment /
  +3.1 event F1 absolute over prior transcription-free work [V abs]. Transcription-free is the only option for Taxila's
  device (the STT drops fillers and audio never leaves the device).
- HiDeC (children's read speech, READR / CMU Kids): frame-level fusion of SSL + ASR timestamps [S via RS §6.1]; on-device
  SSL encoders were rejected here by measurement (`rj-voicesig-ssl-cnn-frontends-on-device`: 895-1,388 ms per 3 s).
- Common practice that this harness keeps: speaker-disjoint splits, operating point chosen on validation, event-level
  precision/recall (a run counts once), cross-corpus checks, and false-alarm rates on read speech (no fillers).

### 1.5 Products that ship child speech signals

- **Amira Learning** (oral reading tutor): detects miscues, self-corrections and hesitations; the published validation is
  agreement with expert scoring at the item level (96%) and 98-99% correlation on WCPM [vendor, via search]. No
  per-event hesitation precision is published.
- **SoapBox Labs** (child ASR, now Curriculum Associates): "human-level accuracy" claims and per-error-type reports; the
  one technical paper is a system demonstration (Interspeech 2020 show-and-tell) [via search]. No per-event numbers.
- **Microsoft Reading Coach / Reading Progress**: pronunciation-assessment miscues for reading; English-first.
- **Google Read Along**: on-device child ASR for reading practice in Indian languages; no hesitation signal published.
- Lesson: every child-speech product validates **task outcomes scored by people**, not states of mind. None publishes
  disfluency-event precision on children, so there is no external number to copy; Taxila has to measure its own (pilot).

---

## 2. Children's speech corpora: what may be used, for what (licences read 2026-10-09)

| corpus | children | licence as read | use here | status |
|---|---|---|---|---|
| **HiACC** (Singh, Singh & Kadyan 2025, *Data in Brief*, DOI 10.1016/j.dib.2025.111886; zenodo.org/records/15551669) | 20 children aged 10-14 (10 F / 10 M), Hinglish, spontaneous answers + story reading + picture prompts; adults on the same tasks; Samsung Galaxy M34 phone, 16 kHz WAV | **contradictory**: Zenodo record `license: cc-by-4.0` [V, API]; the article's specifications table: "Open access for academic/research use under a CC BY-NC 4.0 license" [V]. Ethics: approved by the UPES Research Ethics Committee (REF-1002); "all participants were informed ... and gave their consent"; parental consent is not described [V] | **evaluation only** (the stricter reading); never trained on; numbers only, audio deleted after extraction; the consent gap is flagged to the owner | downloaded and measured, `RESULTS.md` §3 |
| MyST (Pradhan et al., LREC-COLING 2024) | US grades 3-5, science tutoring, ~400 h | free release CC BY-NC-SA 4.0; commercial licence purchasable from Boulder Learning [V abs] | evaluation only | myst.cemantix.org did not resolve from this sandbox (2026-10-09); the HF mirrors are gated (`manual`) |
| Ohio Child Speech Corpus (Wagner et al. 2025; TalkBank) | 4-9 y with adults, 148 h | TalkBank ground rules (CC BY-NC-SA 3.0; companies need approval) [S] | research only | not obtained |
| CHILDES / FluencyBank (TalkBank) | many; CHAT marks fillers `&-um` | as above [S] | research only | not obtained |
| CSLU Kids, CMU Kids (LDC) | US K-10 / 6-11 | LDC licences, non-commercial research [S] | — | not obtainable here |
| ASER, ScAA (Pratham) | Indian children 6-14 | CC BY-NC-SA 4.0 [S, RS §7.1] | evaluation only | not obtained (reading / text) |
| Nexdata Hindi Children Speech (34 h) | ≤ 12 y | commercial purchase [S] | could train the front-end, owner decision; consent provenance must be checked | not bought |

Adult corpora used (licence-clean for training): AMI (CC BY 4.0, train/val/test), FLEURS (CC BY 4.0, read-speech hard
negatives and false-alarm checks; train speakers are disjoint from dev/test per the card [V 2026-10-09]), LiveKit
EOT-Bench Hindi (CC BY 4.0, evaluation of the thinking-pause cue). ICSI (CC BY 4.0) stays the cross-corpus check.

---

## 3. What transfers to a Hindi-English voice tutor for 9-15 year olds in India, on Azure only

1. **Transcription-free, on-device, numbers only.** The STT drops and misspells fillers; audio never leaves the device;
   no third-party AI API. The detector is a 45 KB bi-GRU on the shared front-end in onnxruntime-web (same-origin asset).
2. **Hindi long vowels are the false-alarm risk.** The shipped detector fires 3.80 times per speech-minute on Hindi read
   speech vs 3.36 on English (FLEURS, 2026-10-04 [M]) — read speech has no fillers, so these are all false. Hindi has
   contrastive vowel length and phrase-final lengthening (RS §4.3). Training on Hindi read speech as negatives is the
   direct fix and is licence-clean (FLEURS CC BY 4.0).
3. **The thinking-pause cue transfers better than any intonation cue.** Rises are grammatical on every non-final Hindi
   phrase (L\*+H, RS §4.1), so a rise cannot mean "I'm continuing"; a filler before the silence does, in Hindi as in
   English (never turn-final, Jabeen & Betz).
4. **Dyadic lessons are not meetings.** In 4-party AMI a filler before a silence is only weakly a hold (others jump in);
   in a 1:1 lesson the teacher waits. The dyadic Hindi set (EOT-Bench: a person talking to an agent) is the closer
   proxy, and the pilot is the real test.
5. **9-10 year olds will be the hardest band** (weaker, more variable cues; Visser 2014), so every bar is reported per
   age band in the pilot and the age-band factor stays (SPEC §4.2).

---

## 4. The design chosen, and why

### 4.1 Filled-pause detector, round 3 (`evals/voicesig/r3/train_r3.py`)

- **Same harness, re-measured first.** The 2026-10-04 test set (AMI, 8 Indian-L1 series, 32 held-out speakers) was
  regenerated from the source audio through today's front-end; the shipped graph reproduces precision 0.7526, recall
  0.6012, 1,241 runs, 1,522 filler words, word AUROC 0.9421 exactly [M 2026-10-09]. Every "after" number is on this set.
- **Candidates** (chosen on VAL only): the shipped bi-GRU 32 retrained on more AMI speakers (21 series / 84 speakers ×
  up to 2 meetings, was 12 series / 48 speakers × 1); the same plus FLEURS hi/en read-speech hard negatives (120 + 60 min,
  CC BY 4.0); a bi-GRU 48 with negatives. Same 22-dim input (vsgru-in/1), so the device front-end is unchanged.
- **Operating point, pre-registered:** the threshold and minimum run length that maximise VAL recall subject to VAL
  precision ≥ 0.82 (a margin over the 0.80 bar, because test precision moves around val by a few points). The F1-optimal
  point is reported too. Test is read once per candidate, for the report; the chosen candidate is fixed by the val rule.
- **Why not "just raise the threshold":** it is the honest lever for precision and it is part of the rule, but on the
  shipped model it buys precision with recall; more speakers and Hindi negatives are what move the whole curve. Both
  effects are reported separately (shipped model at the new operating point vs retrained model).

### 4.2 The thinking-pause cue (src/voicesig/holdCue.ts → duplex)

- **What it reads:** at each pause (≥ 200 ms of voice, then silence), after 120 ms of silence, the detector over the last
  3 s; it fires when a filled-pause run ≥ 200 ms ends within 120 ms of the last speech frame ("…umm" + silence; not
  "umm, paanch" + silence).
- **What it publishes:** an `AcousticEstimate`-shaped object on every hop while the pause stays open (up to 4 s), with
  `pComplete` = the **measured** upper 95% bound of P(turn end | fired) on the dyadic Hindi set (so it never argues more
  strongly than the evidence), `pHoldWanted` 0.8. It is never ≥ 0.5, so it can never vouch that a turn ended
  (`HORIZON_ACOUSTIC_P` 0.8 is out of reach by construction). Narrowband routes (bt, speakerphone) are off.
- **How duplex hears it without either stream editing the other:** `src/voicesig/holdBus.ts` (publish / subscribe);
  patch 03 adds a public `DuplexLive.estimate()` and subscribes in `src/duplex/liveTap.ts`; patch 02 lets the engine count
  a fresh acoustic hold exactly as it counts the lexical `fillerTail` (zH and the governor's backstop stretch, `max()` so
  never both). Without patch 02 the estimate still lowers zBase through the engine's existing acoustic term.
- **Why the engine change is needed:** the governor stretches its silence backstop only for lexical hold markers or a
  governed pHoldWanted ≥ 0.6; in the replay most turn ends (303/400) are decided by the backstop, so an estimate that
  only lowers pComplete cannot stop a backstop cut.
- **Shadow by default:** duplex is itself in shadow on production; the cue's counters ride on kv (`pausesRead`,
  `thinkPauses`) and reach the trace as `vs_hold.fired`, so production lessons measure how often the cue fires on real
  children before anyone relies on it.

### 4.3 What she would have done (server/voicesig/lesson.js + patches 04-05)

- For every committed spoken turn whose voice read lands on a state that is shadow (all of them today), the seam returns
  the tie-breakers that state **would** hand the Director (`would`, the adapter's licence: cheap moves only without Tier-T
  agreement) and shadow codes `vs_would.<hint>`.
- Patch 05 runs the counterfactual plan (`planTurn` on a clone of the same state with those hints; pure, no writes) and
  `shadowDiff()` records `vs_diff.changed` / `vs_diff.same` plus the move kinds (never words) in the trace row. The cost
  is one extra pure plan on the minority of turns with a would-hint; it is measured in `RESULTS.md` and capped by a flag.
- This is the "measure before you intervene" design of SPEC §6.3 extended to every production lesson: the comparison
  between what she did and what voice would have made her do accrues on real children with outcomes joined later, so the
  pilot's VS-A13 analysis does not start from zero.

### 4.4 The consented pilot (`PILOT-PROTOCOL.md`)

What to record, the parent consent text and child assent, how many children and sessions (a power calculation for a
precision bar, not a guess), the exact pre-registered bars and the scoring script (`evals/voicesig/r3/pilot_score.mjs`).

---

## 5. Rejected (and why)

| idea | why rejected |
|---|---|
| Raise precision by moving the threshold until test reads ≥ 0.80 | choosing the operating point on test is not a measurement; the rule is val-only, test read once |
| Pseudo-label children's fillers with a verbatim ASR (CrisperWhisper) to get a child "precision" | its weights are CC BY-NC 4.0, its accuracy on Hinglish children is unknown, and a model's labels are not ground truth; a silver number would be presented as a child number |
| Train on HiACC | licence conflict (NC per the article) and no described parental consent: evaluation only |
| Use a rising final pitch as the "continuing" cue | Hindi non-final phrases rise by grammar (L\*+H, RS §4.1); the duplex engine's own prosody terms stay floor-timing only |
| A prosody "uncertainty" / affect classifier | Microsoft restriction 12 (`ct-no-voice-emotion-inference`); knowledge states are defined by outcomes |
| Let the cue vouch that a turn ended when no filler is heard | absence of a filler is not evidence of an end (most holds have none); end-of-turn evidence is Smart Turn / the duplex stream's job |
| Run the counterfactual plan for every turn | it costs a second plan on turns where nothing would change; it runs only when a would-hint exists |
| Measure the duplex arms on the working tree | the duplex stream edits `src/duplex` concurrently (5 files modified during this run); every arm runs on a frozen `git archive HEAD` copy and records the engine hashes |
