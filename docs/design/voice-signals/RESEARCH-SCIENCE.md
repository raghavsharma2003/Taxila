# Voice signals, Research A: what a child's voice reliably says about what they know

**Workstream:** voice-signals / Research A (science and data), 2026-10-04. Research only: no product code changed, nothing
committed, no paid compute used.
**Owner directive (2026-10-04, binding):** "Voice signal will be a MAJOR part in checking that the student has understood or
not. If Microsoft has a problem, use AWS or Neon."
**Question this file answers:** what does the voice of a 9-13-year-old (classes 4-7) reliably tell us about their
*knowledge and metacognitive state*: confident-correct, fragile-correct, confident-wrong, searching (can't recall) vs
absent (doesn't know), guessing, fluent recall, reasoning aloud? With what effect sizes, at what n, in which languages?
What transfers to Hindi and Hinglish? What did uncertainty-adaptive tutors gain? How accurate are learned models? Which
corpora exist, with what labels, under what licence?

**Builds on, does not repeat** (read for the depth this file only cites):
- `docs/design/signals/RESEARCH.md` (**R**): the Microsoft restriction-12 text, tiers T/E/X, the signal catalogue, the
  Hindi L\*+H confound (R §5.2), the Hinglish lexicon seeds (R §5.1), products.
- `docs/design/signals/SIGNALS-SPEC.md` (**SPEC**): the built feature set A1-A15, the closed output vocabulary, baselines,
  reliability `q`.
- `docs/research/world-best/understanding-detection.md` (**UD**): the IDK split (S1), self-repair (S6), Epistemic Speech
  Evidence (ESE, §4), the dataset licence matrix (S12).
- `docs/research/duplex/ARCHITECTURE.md`: the duplex engine uses the same device prosody (pitch slope, pauses) for floor
  timing. Anything this file recommends must come from **the one shared front-end** (`featureWorklet.ts` → `dsp.ts`), never
  a second extractor.
- Taxila measurements already logged: ES-1, ES-2, ES-2 browser (`context/measurements.md`), and the rejections
  `rj-sig-tts-fillers-validate-a7`, `rj-sig-tts-hindi-lh`, `gpt4o-transcribe-fabricates-noise`, `rj-nc-data-and-weights-in-product`.

**Tags.** **[V]** primary source read this session (full text, or "abs" = abstract only). **[S]** secondary (search
summary, a citing paper, a dataset listing). **[T]** Taxila code or docs read this session. **[M]** measured by Taxila (ID
given). **[U]** unverified, or my inference. **[E]** my estimate computed from published numbers (basis shown).
**Evidence strength:** **A** replicated, with child or tutoring data and an effect size; **B** one good study, or adult
evidence replicated; **C** indirect or theory; **D** vendor claim or inference only.
**Method:** about 45 web searches; 12 papers read in full (PDF text extracted), about 20 abstracts read through the
Crossref, OpenAlex, Semantic Scholar and arXiv APIs; dataset cards, licence files and Hugging Face model metadata read
directly. No experiment was run. Every threshold here is [U] until it has a measurement ID in §9.

---

## 0. The answer on one screen

1. **Voice carries knowledge information, and its strongest carrier is time, not pitch.** In the adult feeling-of-knowing
   (FOK) studies, delay is the biggest auditory cue. Swerts & Krahmer 2005 (n = 20 speakers × 40 questions) found that an
   answer given after a perceptible delay had a mean FOK 1.30 points lower on a 7-point scale; fillers −0.83; rising ("high")
   intonation only −0.49 [V]. Pon-Barry & Shieber 2011 (20 adult speakers; correlations over N = 480 utterances): total
   silence correlated r = −0.64 with perceived certainty, total duration −0.59, F0 range only −0.13 [V]. **The voice lane should be timing-first.**
2. **The direction flips by response type, and that flip is how voice separates "searching" from "doesn't know".** For an
   answer, slow and filled means low FOK. For a non-answer ("I don't know"), slow and filled means **high** FOK: the speaker
   was searching, as in tip-of-the-tongue. A fast "don't know" means a confident absence (Smith & Clark 1993; Brennan &
   Williams 1995 [V via Swerts & Krahmer full text]). Swerts & Krahmer's non-answers: filler +2.38 and delay +2.01 FOK
   points [V]. Add the lexical split, where "I don't remember" items are later recognised better than "I don't know"
   items (Coane & Umanath 2019 [S]), and the result is a two-cue detector for searching vs absent. This is the
   one knowledge state where voice clearly adds to the transcript.
3. **Children of 7-14 produce the same cues, more weakly, and the cues sharpen with age.**
   - At 7-8, the cues were "relatively small and less often significant", and judges rated child speakers less accurately
     than adult speakers (Krahmer & Swerts 2005 [V abs]).
   - 11-year-olds signalled more clearly than 8-year-olds (Visser, Krahmer & Swerts 2014 [V abs]).
   - From grade 2 to grade 5, confidence tracked latency more closely, and latency predicted accuracy better (Koriat &
     Ackerman 2010 [V abs]).
   - At 5-8, disfluency tracked *accuracy* more reliably than confidence (West et al. 2025 [V abs]).

   Taxila's band is 9-13, and the target is knowledge. That is good news: children's timing leaks accuracy even where
   their confidence is miscalibrated.
4. **In adults, accuracy and confidence leave separable acoustic traces.**
   - Wilschut, Sense & van Rijn 2026 (n = 40, spoken paired-associate learning): intensity tracked objective recall; F0
     and articulation rate tracked confidence [V abs].
   - Goupil & Aucouturier 2021: a speaker's accuracy was decodable from prosody alone at up to 60%, beyond their own
     awareness [V abs].

   Taxila measures loudness *after* the browser's automatic gain control (AGC) [T]. The accuracy-linked cue is therefore
   the one the pipeline currently destroys. An unprocessed analysis track is the highest-value engineering experiment this
   research points to (VS-M4) [U].
5. **Hindi breaks the weakest cue and spares the strongest.** The rising-end cue, already the weakest in Dutch, is
   confounded by Hindi's L\*+H rise on every non-final phrase (Patil et al. 2008, 20 speakers, 1,200 utterances [V]) and by
   Indian English's rising accent [S]. Hindi's contrastive vowel length plausibly confounds "lengthening" as well [U].
   Timing and fillers reflect search time, and they have cross-language support (English, Dutch, Catalan, Swedish).
   Listeners in India judged the accuracy of Swedish testimony above chance without understanding Swedish (Gustafsson et
   al. 2025 [V abs]). Code-switches slow speech on their own (Fricke et al. 2016; switch costs in children, Gross &
   Kaushanskaya 2015 [S]), so latency must be normalised for them.
6. **Uncertainty-adaptive tutoring worked when detection was good, and faded once detection was automated.**
   - In the wizarded ITSPOKE study (n = 81 adults), adapting to correct-but-uncertain turns raised normalised gain from
     0.382 to 0.626 (d ≈ 1.2 [E]).
   - A control that adapted to random correct turns reached 0.548. Simple-adaptive vs that control was not significant
     (d ≈ 0.3 [E]) [V].
   - The fully automated version (n = 72) helped only a subset of students, because the detector missed too much
     uncertainty.
   - An automated replication in 2014 (n = 67) found no overall effect (p = .617) [V].

   There is no child replication. The active ingredient is the *move* (substantive follow-up on a correct answer the
   student is unsure of), and the bottleneck is detection recall. Voice should buy a cheap, useful-either-way move.
7. **Learned models give a modest gain.**
   - Feature-based uncertainty classifiers reach 66-85% accuracy, against majority baselines of 52-79% (Pon-Barry 2011;
     Liscombe 2005; Litman 2009, F ≈ 0.59) [V].
   - The best result found from the self-supervised (SSL) era: Whisper-base embeddings fused with eGeMAPS-style features,
     macro-F1 0.751, beating WavLM, HuBERT and wav2vec 2.0 baselines on adult *perceived*-confidence labels (Wynn & Wang
     2026 [V abs]).
   - For children, the within-child state signal is small. In Project LISTEN, reading behaviour added an adjusted R² of
     0.019 when predicting comprehension items (289 children, 7,805 responses), and accuracy moved from 75.5% to 75.6% [V].

   Expect a small, real gain. The ESE bar of ΔAUC ≥ 0.03 is plausible but unproven [E].
8. **No corpus combines child speech, knowledge labels and a commercial licence. None at all exists for Hindi or
   Hinglish.**
   - **Closest matches, all non-commercial:**
     - MyST: CC BY-NC-SA 4.0; a commercial licence can be bought; transcripts only.
     - HiACC: Hinglish children on phone audio, 2.04 h of child speech, CC BY-NC 4.0.
     - ASER and ScAA (Pratham): CC BY-NC-SA 4.0.
     - ITSPOKE: adult speakers; DataShop terms say "research purposes, not commercial".
     - The Pon-Barry corpus: adult speakers; research use on request.
   - **Commercially usable audio** carries no knowledge labels and is mostly adult: IndicVoices (CC BY 4.0, ages 18+),
     Vaani (CC BY 4.0), and the MUCS Hinglish lectures (CC BY-SA 4.0). Child audio can also be bought (Nexdata, 34 h of
     Hindi child speech).

   A shipped model must therefore train on Taxila's own consented sessions. Those come with free labels: grader
   correctness, IDK type, the recognition probe after an IDK, and the delayed check (§7.3).
9. **Licence traps in the tooling** [V]:
   - openSMILE's licence extends to "features extracted with the software", so it cannot be used commercially without
     paying. Re-implement eGeMAPS-like descriptors in `dsp.ts` instead.
   - MMS weights are CC BY-NC 4.0; CrisperWhisper weights are CC BY-NC 4.0, though its code is MIT.
   - `ai4bharat/indicwav2vec-hindi` is gated on Hugging Face, so the directive excludes it.
   - WavLM's Hugging Face card has no licence field (its source repo is MIT): confirm before use.

---

## 1. Frame: knowledge states, read from voice, named for what the teacher should do

### 1.1 The three axes

Prior work gives three separable axes. Voice informs two of them. The grader owns the third.

| axis | values | who measures it | evidence base |
|---|---|---|---|
| **correctness** | correct / wrong / no answer | the code grader (Tier T), never voice | Taxila's "a model never grades" law [T]; Goupil 2021 decodes accuracy from prosody at only ≤ 60% [V abs] |
| **metacognitive signal** (FOK, certainty) | high / low | voice timing, fillers, hedges, contour; text hedges and the IDK type | Smith & Clark 1993; Swerts & Krahmer 2005; Pon-Barry 2011 |
| **process** | retrieval vs computation vs search vs no attempt | onset latency relative to the item and the child, think-aloud content, turn structure | Siegler (retrieval vs counting latency) [S]; Winsler & Naglieri 2003 [V abs]; Wise & Kong rapid guessing [via R] |

The ITSPOKE "impasse" grid is exactly correctness × certainty (Forbes-Riley & Litman 2011 [V]). This file adds the
response-type flip (answer vs non-answer, §2.1) and the process axis.

### 1.2 The eight states, how they are told apart, and the move each licenses

| state | knowledge meaning | distinguishing pattern (grader × voice × text) | teacher move | voice's marginal value | strength |
|---|---|---|---|---|---|
| **fluent recall** | robust, retrievable knowledge | correct + short onset (relative to the child and to the item's difficulty) + no leading filler + no hedge | strong evidence; consolidate or advance (speed-accuracy scoring, Math Garden lineage [via R]) | high: speed is the only signal that separates a fluent knower from a slow, effortful one when both are correct | B |
| **working aloud** (reasoning) | knowledge being constructed or computed, not retrieved | long voiced turn with procedure words ("pehle… phir…", counting, partial results) and within-turn pauses | wait (≥ 3 s wait time, Rowe 1986; Tobin 1987 [S]); never hint into it | medium: end-of-turn plus pause structure. Content does the rest | B (move) / C (detection) |
| **fragile correct** (uncertain-correct) | right, but lucky or loosely held | correct + delay / leading filler / hedge (+ terminal rise, English only, utterance-final) | a "why?" or transfer probe; ITSPOKE's active ingredient | medium: hedges are text; delay and fillers add recall when the child does not hedge aloud | A (adults) / B (children) |
| **held belief** (confident-wrong) | a misconception, not a slip | wrong + fast + fluent + no hedge; strongest when the same wrong answer repeats | clear corrective feedback plus the child generating the correct answer. Grade 3-6 children *hypercorrect* high-confidence errors (Metcalfe & Finn 2012 [S]). Then a representation switch and a delayed recheck | medium: separates a held belief from a slip | B |
| **effortful guess** (uncertain-wrong) | knows they do not know; good monitoring | wrong + slow + fillers / hedge | teach or scaffold (the normal not-yet path); do not treat it as a misconception | medium | B |
| **rapid guess** | no retrieval attempt; the item carries no information | onset far below the child's norm for the item class + short answer | discount the evidence (`no_evidence`); re-ask or offer a choice | high: only timing sees it | C (spoken form untested; RTE is A for clicks [via R]) |
| **searching** (can't recall, tip-of-the-tongue) | the knowledge is likely stored but not accessible right now | a non-answer that is **slow and filled**, often "yaad nahi aa raha / zubaan pe hai / ruko…", sometimes partial information | recall cue or recognition probe (mcq2); count it as an FSRS lapse, not a pL drop (UD S1) | high: the latency flip is a voice-only cue | B (adults) / C (children, WB-M1) |
| **absent** (doesn't know) | the knowledge is not stored | a non-answer that is **fast and unfilled**: "pata nahi / nahi aata" | teach; do not cue | medium: the lexical "pata nahi" is ambiguous in Hindi (politeness, shyness; R §5.3), and speed disambiguates it | B (adults) |

### 1.3 Naming: the literature files uncertainty under "affect", so do not import its labels

ITSPOKE calls uncertainty and disengagement "affective states" (Forbes-Riley & Litman 2012 [V]). Pon-Barry & Shieber 2011
appeared in a special issue on "Emotion and Mental State Recognition from Speech" [V]. Restriction 12 of the Microsoft Code
of Conduct covers "other terms commonly used to describe a person's emotional state" (R §1.1), and "unsure" or "confused"
can be read that way.

The outputs therefore name a knowledge claim or a move, never a feeling. Proposed closed vocabulary for
`src/voicesig` / `server/voicesig`: `fluentRecall`, `workingAloud`, `fragileCorrect`, `heldBelief`, `effortfulGuess`,
`rapidGuess`, `searching`, `absent`, plus `answerReliability` (a likelihood-ratio multiplier on the graded emission,
clamped as in ESE).

Mapping to SPEC's built vocabulary:
- `fragileCorrect` ≈ SPEC L3 `unsureCorrect`;
- `searching` ≈ SPEC D4 `recallCue`;
- `workingAloud` ≈ the Moment's `thinkAloud` / `waitLonger`;
- `rapidGuess` ≈ a D1 `evidenceWeight` discount.

**Recommendation for the next SPEC revision** (a main-loop call; SPEC lies outside this workstream's paths): rename
`unsureCorrect` to `fragileCorrect`, so that no built output carries a state-of-mind word.

This framing holds wherever the model runs. Placement off Microsoft services (on the device, or self-hosted with training
on AWS) is the subject of the companion research and does not change the science.

---

## 2. The adult evidence, cue by cue

### 2.1 The feeling-of-knowing paradigm and the answer / non-answer flip

The method comes from Hart (1965), as used by Smith & Clark 1993 and its replications. It has three stages:
1. Ask factual questions aloud.
2. Collect a FOK rating per question ("would you recognise the answer?").
3. Run a recognition test.

The design yields a voice recording, a self-report and a ground truth on every item. It is also the template for Taxila's
own data (§7.3).

**Smith & Clark 1993** (*J. Memory & Language* 32:25-38) [V via the summary in Swerts & Krahmer's full text]:
- **For answers:** the lower the FOK, the *slower* the answer.
- **For non-answers:** the lower the FOK, the *faster* the non-answer.
- The lower the FOK, the more often answers carried rising intonation, fillers, explicit hedges ("I guess") and
  face-saving comments.
- High-FOK answers and low-FOK non-answers are alike: in both, the speaker is sure (sure of the answer, or sure they do not
  know it). Neither involves a long memory search, so neither carries many paralinguistic cues.

UD reports n = 25 participants, 40 questions each [S via UD].

**Brennan & Williams 1995** (*JML* 34) [V via Swerts & Krahmer; S]: they replicated Smith & Clark, then played the responses
to listeners. Rising intonation and longer latency *lowered* listeners' "feeling of another's knowing" (FOAK) for
answers. Longer latency *raised* it for non-answers. Filled pauses lowered it for answers and raised it for non-answers,
compared with unfilled pauses. **Listeners decode the flip.** A human tutor reads these cues, so a voice tutor that
ignores them is less attentive than a human one.

**Swerts & Krahmer 2005** (*JML* 53:81-94), full text read [V]:
- **Design:** 20 Dutch speakers (11 male, 9 female) × 40 one-word trivia questions; FOK on a 7-point scale; a
  multiple-choice recognition test.
- **Correctness:** 71.9% correct in open recall, 89.6% on recognition.
- **FOK vs correctness:** FOK was higher for correct than for incorrect answers (F1(1,19) = 149.2, p < .001) and higher
  for later-recognised items (F1(1,18) = 55.0, p < .001).

| feature present vs absent (paired, per speaker) | **answers**: FOK difference | **non-answers**: FOK difference |
|---|---|---|
| **delay** (perceptible pause before speaking) | **−1.30\*\*\*** (n = 20 speakers) | **+2.01\*** (n = 12) |
| **filler** (uh / uhm / mm) | **−0.83\*\*\*** (n = 19) | **+2.38\*\*** (n = 9) |
| **high (rising) intonation** | −0.49\* (n = 19) | +0.01 (n = 5) |
| eyebrow movement (visual; not usable by Taxila) | −0.69\*\*\* | +1.35 n.s. |
| marked features in total, correlation with FOK | r = −0.41\*\*\* | r = +0.69\*\*\* |

\* p < .05, \*\* p < .01, \*\*\* p < .001 (their Tables 2-4).

**Perception study** (120 Dutch listeners, between-subjects by modality): the gap in mean FOAK between high-FOK and low-FOK
stimuli was 2.22 points from **sound alone**, 1.53 from vision alone and 2.69 from both. Listeners read FOK from the voice
better than from the face, and better still from both [V].

**Reading for Taxila.** Delay and fillers are the strong auditory FOK cues. Intonation is the weakest, even in a language
without Hindi's phrase rises. Delay rarely occurs alone: it co-occurs with 3-7 other marked features (their Table 5) and so
works as an "effortful search" marker. That makes it robust, and it also means it carries little independent information
once fillers and hedges have been counted [U].

### 2.2 Self-reported vs perceived certainty: the voice shows what listeners hear, not what speakers feel

**Pon-Barry & Shieber 2011**, *EURASIP J. Adv. Signal Processing* 251753, full text read [V]:
- **Corpus.** 600 utterances from 20 adult native English speakers, with lexically matched utterances at different
  certainty levels. Each speaker rated their own certainty, and 5 listeners rated perceived certainty (inter-annotator
  κ = 0.45).
- **Self-report vs perception.** The two correlate at **r = 0.42**. Listeners rated speakers more than one point *more*
  certain than the speaker's own rating on 41% of utterances, and more than one point less certain on only 8%.
- **Self-awareness and transparency.** Speakers were "self-aware" (sure when correct, unsure when wrong) on 73% of
  utterances and "transparent" (perceived as feeling) on 64%.
- **Classifying the speaker's own certainty from prosody** (3 classes): 66.3%, against 52.3% for the majority class and
  63.7% for "copy the perceived level". Adding correctness and perceived certainty raised it to **75.3%**. Correctness
  alone gave 72.5%.
- **Classifying perceived certainty:** 69.0% from whole-utterance prosody, 74.8% from a selected combination of
  utterance, context and target-word features, against a naive baseline of 56.3%.
- **Strongest correlates of perceived certainty** (N = 480): total silence −0.64, total duration −0.59, percent silence
  −0.46 (−0.53 on the target word), speaking duration −0.43, absolute F0 slope +0.28, F0 range −0.13, speaking rate +0.09
  (+0.14 on the target word). **Timing dominates pitch by a factor of about 2-5 in correlation.**

**Reading for Taxila.** The target is the child's *knowledge*, not their *felt certainty*. Pon-Barry shows that the voice
mostly conveys perceived certainty, which is only moderately tied to felt certainty (r = 0.42). Correctness carries more
than prosody does. That is the case for the residual design: the grader first, voice as an adjustment, and the label
taken from *future* knowledge outcomes (ESE), never from a listener's or the child's feeling of certainty.

### 2.3 Confidence and accuracy have different acoustic signatures

| study | n | finding | tag |
|---|---|---|---|
| **Goupil & Aucouturier 2021**, *Cognition* 212:104661 | psychophysics plus spoken reports (n not retrieved) | confidence and accuracy are "distinctly reflected in the loudness, duration and intonation" of spoken reports. Accuracy was encoded "beyond their own metacognitive awareness" and decodable "with performances up to 60%" | [V abs] |
| **Wilschut, Sense & van Rijn 2026**, *Memory & Cognition* | 40, spoken paired-associate learning with confidence ratings | **intensity indexes memory strength** (objective recall); **F0 and articulation rate index confidence**. Structural equation modelling favoured the hybrid model. The authors name educational technology as an application | [V abs] |
| Wilschut, Sense & van Rijn 2023, AIED | 44, > 7,000 spoken retrieval attempts (vocabulary) | prosodic features were associated with retrieval accuracy and latency, and could improve an adaptive-learning memory model | [S] |
| **Gustafsson, Lachmann & Laukka 2024**, *J. Nonverbal Behav.* | 3,337 statements (76.6% accurate), 51 eyewitnesses, 94 acoustic variables | an SVM classified correct vs incorrect "20 and 40% above chance level (AUC = 0.50)". Higher amplitude predicted correct recall; longer pauses predicted incorrect recall | [V abs] |
| **Gustafsson et al. 2025**, *Commun. Psychol.* | 3,344 statements; Swedish, American and **Indian** listeners | faster speech, fewer pauses and greater amplitude marked correct recall. Listeners judged accuracy above chance "regardless of nation or language comprehension" | [V abs] |
| Jiang & Pell 2017, *Speech Communication* 88 | encoded (posed) confident vs doubtful speech | confident speech: lower mean F0, faster rate, fewer pauses, larger amplitude range. Doubtful speech: higher mean F0, slower rate, more pauses | [S] |

**Reading for Taxila.**
- **Two routes.** The child's voice reports their confidence (F0, rate) *and* leaks their accuracy (intensity, pauses).
  In children, confidence is often miscalibrated (§3.2), so the accuracy route is the more useful one for a knowledge
  estimate.
- **The pipeline blocks the accuracy route today.** Taxila captures with `autoGainControl` and `noiseSuppression` on, so
  `rms*` describes the AGC output and was rightly removed from the baselined set ([T] measurements entry on `rms*`; R
  §3.4). Its logged reversal condition is "a second, unprocessed analysis track measured to not disturb the AEC'd capture
  on Android". This research raises that from a nicety to a priority (VS-M4).
- **What might survive AGC** [U]: within-utterance *relative* intensity, such as the energy of the final content word
  against the utterance median. AGC time constants are typically slower than a word [U, to measure].

### 2.4 Detecting uncertainty in tutoring speech, before deep learning

| study | data | features | result | tag |
|---|---|---|---|---|
| Liscombe, Hirschberg & Venditti 2005, Interspeech | ITSPOKE human-human physics tutoring | acoustic-prosodic, at breath-group and turn level | 76.42% accuracy (3 classes), against a 66.0% naive baseline | [S via Pon-Barry; search] |
| **Litman, Rotaru & Nicholas 2009**, Interspeech | 9,588 student turns, 80 users, ITSPOKE; 2.8 words per turn; κ 0.74 (4,895 double-coded) | word-level pitch and energy, with position-weighted voting | majority class 78.70%; turn-level model 83.0%; best (linear weighting) **85.4%, P 0.74 / R 0.49 / F 0.59** | [V] |
| Forbes-Riley & Litman, automated ITSPOKE | 72 students | logistic regression over lexical, pitch, temporal and energy features plus tutor question and gender | "did not automatically recognize student uncertainty often enough" (recall-limited) | [V via Litman & Forbes-Riley chapter] |
| Pon-Barry & Shieber 2011 | §2.2 | utterance, context and target-word prosody | 66-75% | [V] |

These are adult speakers with headset microphones and short turns. The recall figures (0.36-0.55 for most models in
Litman 2009) are the main warning: a voice-only detector misses half the uncertainty a human annotator hears.

### 2.5 Lexical cues

- **Hedges** ("I guess", "maybe"), together with prosody, mark low FOK (Smith & Clark 1993 [V via Swerts & Krahmer]). In
  ITSPOKE, Bhatt et al. annotated hedging expressions at κ 0.97 (cited in Forbes-Riley & Litman 2011 [V]).
- **"Don't remember" vs "don't know".** Coane & Umanath 2019 (*JML* 107): after a "don't remember" response, items were
  recognised better on the final multiple-choice test than after a "don't know". Don't-remember marks a failure of
  *accessibility*; don't-know marks a failure of *availability* [S]. This is the adult basis of UD S1's `IDK_R`.
- **Hedge detection by model.** On spontaneous narratives, a fine-tuned BERT detected hedges best, ahead of few-shot GPT-4o
  (Paige et al. 2024 [V abs]). Hedges in Hindi and Hinglish need Taxila's own lexicon and a rater-validated set (SG-M7).

### 2.6 Cue summary (adults first, then children and transfer)

| cue | answers | non-answers | adult effect (n) | child evidence (§3) | Hindi / Hinglish transfer (§4) | Taxila feature [T] |
|---|---|---|---|---|---|---|
| **onset latency** (to the first content word) | slower → lower FOK, less likely correct | slower → higher FOK (searching) | delay −1.30 / +2.01 FOK points (n = 20); latency lowers FOAK (B&W) | latency → confidence, strengthening grade 2→5 (K&A 2010); longer onsets on incorrect and low-confidence trials at 5-8 (West 2025) | **high**, but subtract code-switch costs (§4.4) | A1 `onsetMs`, A2 `onsetContentMs` |
| **leading filler** | → lower FOK | → higher FOK | −0.83 / +2.38 (n = 19 / 9) | fillers from age 3; track accuracy at 5-8 | **high**. Hindi has uh / um types (§4.2); lexical fillers need a position rule | A7 `flatVoicedRuns` (unvalidated on human speech [M ES-2]); L4 fillers from the transcript |
| **silence within the answer** | more → lower perceived certainty | (not studied) | total silence r = −0.64, percent silence −0.46 (N = 480) | no direct child data [U] | medium. Code-switch boundaries add pauses | A3 `pauseFrac`, A4 `longestPauseMs` |
| **total duration / word count** | longer → lower certainty | longer → higher FOK | duration r = −0.59; more words → lower FOK for answers (S&K Table 2) | minimal turns are cultural (R §3.2) | medium; per-child | A8, L15 |
| **articulation rate** | faster → more confident | — | rate +0.09 to +0.14 (Pon-Barry); tracks confidence (Wilschut 2026) | rate rises with age through 12 (Lee 1999) | medium. Script changes word counts (SPEC A6) | A6 |
| **intensity** (relative) | louder → more accurate, more confident | — | tracks objective recall (Wilschut 2026); amplitude predicts correct recall (Gustafsson 2024/25) | none found | **unknown**: destroyed by AGC on this pipeline | A11 `rms*` (not baselined, correctly) |
| **terminal rise** | → lower FOK (English, Dutch) | ≈ 0 | −0.49 (weakest); absolute F0 slope r = +0.28 | rising contours on low-confidence trials from age 3 (Hübscher 2019 [via R]) | **broken by the L\*+H phrase rise** (§4.1) | A9, decision-excluded |
| **F0 level / range** | higher mean F0 when doubtful (posed) | — | F0 range r = −0.13 | children's F0 is more variable to about 12 (Lee 1999) | low; close to arousal-by-another-name (R §3.4) | A10, q only |
| **lengthening / prolongation** | hesitation marker | — | listed by ITSPOKE annotators; prolongations frequent in Hindi / Urdu (Jabeen & Betz 2022) | children use vowel lengthening from about 5 (Hübscher & Prieto [via R]) | **confounded by Hindi's contrastive vowel length** [U] | none |
| **self-repair / false start** | ending correct = monitoring; ending wrong = fragile | — | (UD S6) | self-correction predicted by executive function, n = 82, age about 7.5 (Nguyen 2020 [via UD]) | needs a verbatim STT (SG-M4) | `selfCorrectionCount` (direction not split) |
| **lexical hedge** | → fragile-correct | — | κ 0.97 annotation (Bhatt, in F-R&L 2011) | lexical markers appear after age 5 (Hübscher 2019) | lexicon (R §5.1); "hai na?" is a tag, not doubt | L3 |
| **IDK type** | — | "don't remember" > "don't know" on later recognition | Coane & Umanath 2019 | untested in children (WB-M1) | Hindi marks the split lexically | L-family `recallCue` |

---

## 3. Children aged 7-14

### 3.1 Do children produce the cues?

| study | children | finding | tag |
|---|---|---|---|
| **Krahmer & Swerts 2005**, *Language and Speech* 48(1):29-54 | Dutch, 7-8 y (and adults), FOK paradigm | adults signalled uncertainty with fillers, delays, high intonation, eyebrows and "funny faces". For children the picture was "somewhat similar … but the differences were relatively small and less often significant". Child and adult judges rated adult speakers more accurately than child speakers, and child judges were less accurate overall | [V abs] |
| **Visser, Krahmer & Swerts 2014**, *Language and Speech* 57(1) | Dutch, 8 and 11 y, quiz game in pairs (collaborative vs competitive) | children used some cues to signal uncertainty; **older children gave clearer cues**. Adults read certainty more clearly from older children and from children in competition. The FOK of 11-year-olds, but not of 8-year-olds, varied with the social setting | [V abs] |
| Hübscher, Vincze & Prieto 2019, *Lang. Learn. Dev.* 15(4) | Catalan, 3-5 y | prosody, face and body cues to uncertainty come first; lexical cues follow after about 5 y; disfluency at every age | [S] |
| Hübscher et al. 2017, *First Language* | 102 Catalan children, 3-5 y (comprehension) | the younger children were more sensitive to *intonational* than to lexical marking of speaker uncertainty | [V abs] |
| **West, Baer, Yu & Odic 2025**, *Developmental Science* | 5-8 y; semantic and perceptual 2AFC with confidence judgements (n not retrieved) | children produced more fillers, more hedges and longer onsets on **incorrect** and on low-confidence trials. On trials where accuracy and confidence diverged, fillers and hedges did not track confidence, and onsets were *longer* on high-confidence trials. The authors conclude that "fluency is a reliable tracker of **accuracy** but not confidence" | [V abs] |
| Cheng et al. 2023 (SIGDIAL) | children, video | multimodal (video) cues of uncertainty; the data release awaits consent forms | [V abs] |

### 3.2 How accurate is children's own sense of knowing?

- **Lockl & Schneider 2002** (*IJBD* 26(4)), 7-, 8-, 9- and 10-year-olds: FOK accuracy "generally low but above chance for
  all age groups", with **no developmental trend**. FOK was high whenever an answer could be generated, right or wrong, as
  the trace-accessibility account predicts [V abs].
- **Koriat & Ackerman 2010** (*Dev. Sci.* 13:441-453), grades 2, 3 and 5:
  - confidence was inversely related to choice latency, and more strongly so at higher grades;
  - **latency's validity as a cue to accuracy also rose with age**;
  - when free to volunteer answers, children volunteered more fast answers than slow ones, more so at older ages [V abs].
- **Overconfidence.** Young children are overconfident, and confidence that discriminates correct from wrong answers is
  measurable from about 8-9 y (Destan & Roebers line) [S].
- **Hypercorrection.** Grade 3-6 children correct high-confidence errors *more* readily than low-confidence ones once given
  feedback, and then claim they "knew those answers all along" (Metcalfe & Finn 2012, *Learning and Instruction* 22) [S].

**Reading for Taxila.**
- **Do not train on children's self-reported confidence.** It is a noisy target for 9-13-year-olds: above chance but low,
  and inflated.
- **Train on knowledge outcomes instead.** The voice-to-accuracy route (West 2025; Koriat & Ackerman's latency validity) is
  at least as strong as the voice-to-confidence route in children, which supports the ESE design.
- **The confident-wrong state is worth detecting** (hypercorrection). The move is clear correction and a delayed recheck.
  Lowering the bar would be the wrong response.

### 3.3 Process signatures: retrieval vs computation vs thinking aloud

- **Retrieval vs counting** in children's arithmetic is classified from solution time plus overt behaviour (Siegler's
  method; trials with visible counting are coded as counting even when the child reports retrieval). One study reports
  retrievers' median response time as 2.90 s against 4.06 s for counters, at similar accuracy (80% vs 79%) [S]. Latency
  therefore separates **how** a correct answer was produced (fluent recall vs computation), not only whether it is right.
  This must be item-relative: problem size changes the latency for everyone.
- **Private speech** (thinking aloud). Winsler & Naglieri 2003 (*Child Dev.* 74:659-678), N = 2,156, ages 5-17:
  - verbal strategies move from overt, to partially covert, to fully covert with age;
  - verbal strategies "were associated with competence among the youngest children", but "self-talk was unrelated to task
    performance for older children" [V abs].

  At 9-13, a child working aloud is in a *process* state. That is neither a competence signal nor a deficit signal, and
  the right move is to wait.
- **Wait time.** When a teacher's pause after a question (wait time 1) and after a student answer (wait time 2) reaches
  ≥ 3 s, student responses lengthen by 300-700% and use more logic and evidence (Rowe 1986). Above a 3 s threshold, the
  review literature reports higher cognitive-level achievement (Tobin 1987, *RER* 57) [S]. This is the evidence for
  `waitLonger` on `searching` and `workingAloud`. Taxila's own probe found that the teacher filled a thinking-aloud
  silence with a hint in 5 of 6 runs [M voice-research-probes-2026-10-02].

### 3.4 Children's acoustics and timing develop through the target band

- **Lee, Potamianos & Narayanan 1999** (*JASA* 105(3)), 436 children aged 5-17 plus 56 adults: the size of temporal and
  spectral parameters, and their within-speaker variability, both shrink with age. Between 9 and 12, segment durations
  shorten and within-speaker variability of duration, F0 and spectral envelope falls [S].
- **Turn timing.** Children's response gaps stay longer than the adult norm of about 200 ms through at least age 6, and
  probably later (Casillas, Bobb & Clark 2016, *J. Child Lang.*; turn-taking review 2025) [S]. R carries a figure of a
  625 vs 371 ms median from a secondary source [S via R].

**Consequences.**
- **Per-child baselines are mandatory.** SPEC's Welford z-scores per child × context already exist [T].
- **SD floors by age band.**
- **Separate priors for 9-10 vs 11-13** at cold start. Visser 2014 also predicts clearer cues at 11 than at 8.
- **The F0 drop at puberty** (12-15) is a further reason to keep F0 out of decisions (R §7.3).

### 3.5 What reading and tutoring systems for children found

- **Project LISTEN, state level.** Zhang, Mostow & Beck 2007 (AIED), 289 children in grades 1-4, 7,805 cloze responses
  (72.1% correct), full text read [V]:
  - reading behaviour (speed, prosody, help requests) on the sentence *before* a comprehension item uniquely explained an
    adjusted R² of **0.019**, a 10% relative improvement in fit (0.190 → 0.209);
  - reading features alone matched the item's own features (0.068 vs 0.070);
  - overall classification accuracy barely moved (75.5% → 75.6%), and recall of wrong answers stayed low (31%).
- **Project LISTEN, trait level.** Prosodic contour similarity with adult narrations predicted the fluency and
  comprehension scores, and the gains, of 55 children aged 7-10 (Mostow & Duong 2009 [V abs]). The durational models are
  reported at an adjusted R² of about 0.6 [S].
- **The lesson: aggregate voice timing is a strong *trait* measure, while per-item voice is a weak *state* measure.** For
  "did she understand *this*?", expect small, real effects. For "how fluent is she in this skill over weeks?", expect large
  ones.
- **MyST** (virtual science tutor, grades 3-5): learning gains were not significantly different from expert human tutors
  and well above no tutoring (Ward et al. 2013, *J. Educ. Psychol.* 105(4)) [S]. MyST did **not** adapt to uncertainty. Its
  value to Taxila is the corpus (§7).

### 3.6 Synthesis for 9-13-year-olds [U, inference from §3.1-3.5]

The cue set is present and maturing. It is weaker and more variable than in adults, with the 11-13 sub-band clearer than
9-10. Timing and fillers are the most developmentally stable cues: present from age 3-5 and tied to accuracy. Lexical
hedges are present after 5, but culture suppresses them (R §5.3). Intonation is the least reliable cue (and §4 adds
Hindi). Per item, the expected gain over text and grader evidence is small (an adjusted ΔR² of about 0.02 in the one
child study). Aggregated across a skill, voice timing is a strong fluency measure. A child's self-reported confidence is a
poor training target; future knowledge outcomes are the right one.

---

## 4. What transfers to Hindi and Hinglish

### 4.1 Intonation: the cue that breaks

- **Patil, Kentner, Gollrad, Kügler, Féry & Vasishth 2008** (*JSAL* 1(1)), production study, 20 Delhi Hindi speakers,
  1,200 utterances: non-final constituents carry rising pitch accents, and the verb (final) falls. This is consistent with
  Moore 1965, Harnsberger 1994 and Dyrud 2001: "every p-phrase … uttered with a continuously rising pitch" [V].
- **Boundary tones.** The literature analyses every non-final accentual phrase as L\*+H, with a final L% in declaratives and
  H% in polar questions [S via Patil and the Hindi prosody reviews; R §5.2].
- **An areal feature.** Rising non-final phrases are areal across Indian languages (Féry) [S].
- **Indian English.** A rising accent analysed as L\*+H is among the most common pitch accents of Indian English speakers
  with Hindi, Bengali, Tamil and Telugu L1s [S].
- **Taxila probe.** TTS could not reproduce the confound: Azure voices *fall* at continuation phrases (median −32 st/s
  against −10 for finals) [M ES-2, `rj-sig-tts-hindi-lh`]. Only real child speech can settle it (SG-M1).

**Verdict.**
- **Mid-utterance and non-final rises carry no information.** A child who answers in fragments ("teen… kyunki…") rises by
  grammar.
- **An utterance-final rise in a Hindi *declarative* answer is marked** (the grammar expects L%), so it *may* carry
  question or doubt meaning [U]. It must be measured per child × language mode, and only after end-of-turn.
- **Cost of dropping the cue.** Intonation was the weakest auditory FOK cue even in Dutch (−0.49 vs −1.30 for delay), so
  dropping it from decisions costs little. Keep A9 decision-excluded until SG-M1 (SPEC default).

### 4.2 Fillers: they transfer, with Hindi-specific forms

- **Jabeen & Betz 2022** (Interspeech), 13 female Urdu/Hindi speakers, 25 min of semi-spontaneous dialogue, full text read
  [V]:
  - silence was the most frequent hesitation, then fillers, then lengthening;
  - "uh"-type fillers (vowel only) were more frequent than "um"-type (vowel + nasal);
  - "um" fillers were significantly longer and followed by longer silences, consistent with Clark & Fox Tree's
    short-delay / long-delay distinction;
  - fillers occurred turn-initially and turn-medially, never turn-finally;
  - the filler vowels differed from the phonemic vowels of Urdu/Hindi.
- **Implications for detection.**
  - An acoustic filler detector can use vowel quality, not only flatness of F0, to separate a filler from a lengthened
    lexical vowel [U].
  - Um-type fillers signal a longer coming delay, so they belong with `searching` and `effortfulGuess`.
- **Lexical fillers and planning markers** ("matlab", "woh", "haan toh", "kya bolte hain") are content words elsewhere
  and count only in pre-content position (R §5.1).
- **STT dependence.** The gpt-4o-transcribe family may strip fillers (SG-M4, open), and it invents text on noise
  (`gpt4o-transcribe-fabricates-noise`). Azure TTS cannot calibrate the acoustic filler detector
  (`rj-sig-tts-fillers-validate-a7`: recall 0.011) [M]. Recorded human fillers are required.

### 4.3 Lengthening: probably does not transfer as-is [U]

Hindi has contrastive vowel length (short vs long i, u, a). A long vowel can be phonemic, so "segment lengthening =
hesitation", a cue used in English and Catalan work, needs a phone-level reference before it can be read in Hindi.
Until then, treat lengthening only as the `flatVoicedRuns` filler cue, with the sustained-vowel lexicon guard SPEC
already specifies.

### 4.4 Code-switching: it slows speech on its own

- **Fricke, Kroll & Dussias 2016** (*JML* 89:110-137), adult Spanish-English bilinguals: speech rate is reliably slower
  before a spontaneous code-switch, and switched items are more disfluent than matched unilingual items. Listeners use the
  slowing as a cue that a switch is coming [S].
- **Gross & Kaushanskaya 2015**, English-Spanish bilingual children aged 5-7, voluntary-switch picture naming: naming
  latencies were longer on switch trials. Children chose the non-dominant language mainly for highly frequent,
  early-acquired words [S].
- **Hindi-English entrainment.** Hindi-English code-switched conversation shows acoustic-prosodic entrainment similar to
  Spanish-English (2026 cross-lingual study) [S].

**Implications.**
1. Latency and pause baselines must be keyed per language mode (hi / hinglish / en), as SPEC proposes. Pauses next to a
   switch should be flagged and either excluded or modelled.
2. Switching to Hindi mid-answer to name a concept may mark **lexical** retrieval difficulty in English, not conceptual
   difficulty. For a Hindi-medium child, answering a science concept in Hindi is not a knowledge gap. Never score a switch
   as uncertainty [U].
3. A delayed onset followed by a Hindi term in an English-medium question should be read as "knows it, not in English",
   which is a language-support move (offer the English term), not a reteach [U].

### 4.5 Cross-cultural decoding supports the timing cues

- Swedish testimony accuracy was judged above chance by Swedish, American and Indian listeners alike, including listeners
  who did not understand Swedish. Faster speech, fewer pauses and greater amplitude were the cues (Gustafsson et al. 2025)
  [V abs].
- The FOK cue set replicates across English (Smith & Clark), Dutch (Swerts & Krahmer) and Catalan child data (Hübscher).
- Calibration was best when the listener's culture was closest to the speaker's, which supports per-population priors and
  per-child baselines.

### 4.6 Transfer verdict

| cue | transfers to Hindi / Hinglish children? | why | condition |
|---|---|---|---|
| onset latency, answer / non-answer flip | **likely** (B/C) | search time is language-general; cross-cultural decoding | per child × language mode; item-adjusted; minus code-switch cost |
| leading filler (acoustic + lexical) | **likely** (B/C) | uh / um types exist in Hindi / Urdu | human-recorded calibration; Hinglish lexical filler position rule |
| within-answer pause fraction | **probably** (C) | timing mechanism | code-switch boundaries flagged |
| articulation rate | **probably** (C) | — | script-aware word counts (SPEC A6) |
| relative intensity | **unknown** (C) | the AGC blocks measurement | an unprocessed analysis track (VS-M4) |
| terminal rise | **no, as built** (D) | the L\*+H phrase rise; Indian English rising accents | utterance-final only, after end-of-turn, per child × language mode; SG-M1 |
| lengthening | **no, as built** (D) | contrastive vowel length | phone-level reference |
| hedges and IDK split | **yes, lexically** (B) | Hindi marks "pata nahi" vs "yaad nahi" explicitly | a lexicon validated on real turns (SG-M7); politeness "pata nahi" disambiguated by speed |

---

## 5. Uncertainty-adaptive tutoring: ITSPOKE and what came after

| study | system | learners | uncertainty detection | adaptation | outcome | tag |
|---|---|---|---|---|---|---|
| **Forbes-Riley & Litman 2011**, *CSL* 25:105-126 | ITSPOKE-WOZ (qualitative physics; why-questions) | **81** adults (college, no college physics); 4 conditions of 20-21 | hidden human wizard (κ 0.62 for uncertainty, 0.85 for correctness in prior work) | **Simple:** treat correct + uncertain as incorrect (remediate). **Complex:** varied feedback plus empathy. **Random:** remediate random correct turns. **NonAdapt** | normalised gain: **Simple 0.626 (SD 0.193) vs NonAdapt 0.382 (0.204), p = .011**; raw gain 0.307 vs 0.183, p = .029; posttest 0.810 vs 0.698, p = .035; Simple > Complex, p = .034; Random 0.548 (n.s. vs Simple); pretests balanced (p = .968). Adapted on 10.9% of turns (Simple, all correct + uncertain) vs 19.6% (Random) | [V] |
| | | | | | **[E] effect sizes:** normalised gain d ≈ 1.23 (Simple vs NonAdapt); raw gain d ≈ 1.05; posttest d ≈ 0.88; Simple vs Random d ≈ 0.31 (n.s.). Pooled-SD Cohen's d from Table 5 | [E] |
| Forbes-Riley & Litman 2011, *Speech Communication* (UNC-ITSPOKE) | fully automated: Sphinx2 ASR, TuTalk semantic grader, logistic-regression uncertainty model (lexical, pitch, temporal, energy) | **72** adults | automatic | Simple adaptation | higher learning than controls, **significant only for a subset** of students (after controlling for the extra content). The system "did not automatically recognize student uncertainty often enough" | [V via Litman & Forbes-Riley chapter; S for n] |
| Litman & Forbes-Riley, metacognition chapter | WOZ and automated corpora | 81 / 72 | as above | — | adapting to uncertainty did **not** significantly improve metacognitive metrics (monitoring accuracy, bias, discrimination). Some metrics correlated with learning | [V] |
| Forbes-Riley & Litman 2012, SIGDIAL | UNC vs UNC-DISE (adds disengagement), wizarded | **38** adults (19 per condition) | wizard | uncertainty ± disengagement | normalised gain UNC 0.65 (0.20) vs UNC-DISE 0.58 (0.19), n.s.; both above a NoAdapt group from an earlier experiment (0.38, p ≤ .003; the authors call that comparison "tenuous"). Disengagement adaptation backfired for incorrect + certain + engaged turns | [V] |
| Litman & Forbes-Riley 2014, SIGDIAL | fully automated, DISE+UNC vs DISE vs CONTROL | **67** adults (39 F, 28 M) | automatic | as named | **no overall difference in learning (F(2,61) = 0.487, p = .617)**; a gender × condition interaction (p = .021): males gained in DISE vs CONTROL (p = .019) | [V] |
| Pon-Barry et al. 2006, *IJAIED* 16(2) | SCoT-DC (shipboard damage control) | adults | automatic | human-tutor strategies for responding to uncertainty | "significant differences in specific types of student answers", reported as a benefit | [S] |
| Affective AutoTutor (via R and EA) | text and face, not voice | n = 84 | — | affect-sensitive support | helped low-knowledge learners in session 2, hurt high-knowledge learners in session 1 | [via R] |

**Lessons for Taxila.**
1. **The move is the active ingredient.** Treating *correct + uncertain* as an impasse needing substantive content beat
   ignoring it. Empathic wording (Complex) did not help. Random extra remediation recovered part of the gain (0.548), so
   some of the benefit is extra tutoring, not targeting.
2. **Detection recall is the bottleneck.** With a human ear the effect was large (d ≈ 1.2 [E]). With an automatic
   detector it shrank to a subgroup, and in 2014 to nothing overall.
3. **Adults, headsets, physics.** No child, no Hindi, no phone microphone. The transfer to Taxila is a hypothesis
   (VS-M5).
4. **Over-response has a cost.** Complex turns were longer, and some students were annoyed by the empathy (wizard's
   observation). This matches DA10's verify budget (≤ 1 verifying move per 4 child turns) [via R].
5. **Where voice should sit.** Voice should raise the *probability* of a cheap move: a "why?" on a correct answer, or a
   recall cue on a slow IDK. It should never gate a costly one. Since the move helps whether or not the detection was
   right (it is a "useful-either-way" move), a recall-oriented operating point (more false alarms, fewer misses) is the
   right one, within the verify budget.

---

## 6. Learned models and their accuracy

### 6.1 What the field has reported

| model family | data | target | result | tag |
|---|---|---|---|---|
| decision trees / linear regression over prosody | Pon-Barry, 20 adults, 600 utterances | self-reported / perceived certainty (3 classes) | 66.3% / 69.0-74.8% (baselines 52.3% / 56.3%) | [V] |
| prosodic classifier | ITSPOKE human-human | certainness (3 classes) | 76.4% (baseline 66.0%) | [S] |
| word-level prosodic voting | ITSPOKE, 9,588 turns, 80 users | uncertain vs not | 85.4% (majority 78.7%); F 0.59, R 0.49 | [V] |
| SVM over 94 acoustic variables | 3,337 eyewitness statements, 51 adults | correct vs incorrect recall | "20-40% above chance (AUC 0.50)" | [V abs] |
| prosody → accuracy | psychophysics | objective accuracy | up to 60% | [V abs] |
| **Whisper-base encoder + eGeMAPS + auxiliary stress and disfluency probabilities; uncertainty-aware pseudo-labelling** (Wynn & Wang 2026, arXiv 2605.12387) | re-annotated subsets of TED-LIUM, SEP-28K, CMU-MOSI and People's Speech (adults) | perceived speaker confidence | **macro-F1 0.751**, above WavLM, HuBERT and wav2vec 2.0 baselines; the hybrid beat Whisper alone (+3% on the minority class) | [V abs] |
| co-attention fusion of Whisper embeddings and hand features (Wynn, Wang & Tan 2026, arXiv 2606.16505) | 444 clips (172 high / 151 medium / 121 low confidence) | confidence (3 classes) | accuracy 75% | [V abs; class counts S] |
| HiDeC: WavLM + Whisper timestamps + BERT, frame-level fusion | children's reading (READR, CMU Kids) | word-level disfluency detection and classification | +23% / +16% relative detection F1 over cascaded baselines | [S] |
| PodcastFillers pipeline (VAD + ASR candidates + classifier) | 145 h of adult podcasts | filler detection | state of the art. ASR-based detection "strongly outperforms" transcription-free keyword spotting | [V abs] |
| WSW 2.0 (wav2vec2 speaker classification + Whisper) | preschool classroom audio, 12 children + 5 teachers | child vs teacher; transcripts | weighted F1 0.845; child WER 0.238 | [V abs] |
| late audio + text fusion (Stanford, K-8 maths classroom audio) | classroom recordings | student *engagement* | F1 0.78, above the best unimodal model | [S] (engagement, not knowledge: method only) |

### 6.2 What SSL encoders add, and why the residual design is right

- **Lexical information dominates when it is available.** Prosody-only spoken QA models perform "reasonably well", but
  when lexical information is present, models "predominantly rely on it" (Chi, de Seyssel & Schluter 2025 [V abs]).
  Measured timing beats timing narrated into an LLM prompt (Uehara 2026 [via UD]). Audio LLMs lose paralinguistics before
  their output (2609.00727 [via UD]). Taxila's own probe found 0/18 check-ins on near-tears audio, and `gpt-audio` failed
  as a judge [M; rejected].
- **The fusion therefore has to protect the acoustic channel.** Text, task and grader features go first. Audio predicts
  the *residual*, inside a clamped likelihood ratio (ESE). Hand-measured timing features must be kept alongside any
  embedding, because Wynn & Wang found the hand features "provide necessary corrective signals which are otherwise lost
  in deep semantic representations".
- **SSL on child speech.** Child-ASR benchmarks across Whisper, wav2vec 2.0, HuBERT and WavLM (Fan et al. 2024) show
  large child-adult gaps and the value of in-domain data [S]. There is no published paralinguistic or uncertainty benchmark
  on child speech [U, none found].

### 6.3 What accuracy to expect for Taxila's targets [E]

| target | realistic metric | basis |
|---|---|---|
| per-turn "fragile correct" from voice alone | AUC about 0.60-0.70 | adult per-turn accuracy is 7-15 points above majority (§6.1); children's cues are weaker (§3.1) |
| per-turn "fragile correct" from text + voice | voice adds ΔAUC 0.02-0.05 over the text hedge | Pon-Barry: correctness and perceived certainty beat prosody alone; Zhang 2007 ΔR² 0.019 |
| searching vs absent on IDK turns | AUC about 0.70-0.80 for latency + filler + lexical type, judged against the recognition probe | the large effect sizes in Swerts & Krahmer's non-answer column (+2.0 to +2.4 FOK points), but n = 9-12 speakers; untested in children |
| delayed-transfer success (ESE target) | ΔAUC ≥ 0.03 within skill: plausible, unproven | Zhang 2007 (state ΔR² 0.019); UD's ESE bar |
| skill-level fluency (aggregated over weeks) | strong (adjusted R² about 0.6 in reading) | Project LISTEN trait models [S] |

### 6.4 Licences of candidate encoders and tools (read 2026-10-04)

| component | licence (source) | gated on Hugging Face? | shippable in a trained model? |
|---|---|---|---|
| Whisper (`openai/whisper-base`, `-small`) | Apache-2.0 (HF card) | no | **yes** |
| wav2vec 2.0 base, XLS-R 300M, HuBERT base | Apache-2.0 (HF cards) | no | **yes** |
| w2v-BERT 2.0 (`facebook/w2v-bert-2.0`) | MIT (HF card) | no | **yes** |
| WavLM base-plus / large | HF card has no licence field; `microsoft/unilm` repo is MIT | no | likely; **confirm** [U] |
| MMS (`facebook/mms-300m`) | CC BY-NC 4.0 | no | **no** (research only) |
| IndicWav2Vec Hindi (`ai4bharat/indicwav2vec-hindi`) | Apache-2.0 | **yes (auto-gated)** | **no**, by the no-gated-models directive |
| Smart Turn v3 (`pipecat-ai/smart-turn-v3`) | BSD-2-Clause | no | **yes** (end-of-turn, R §4) |
| CrisperWhisper (verbatim, keeps fillers) | code MIT; **weights CC BY-NC 4.0** (HF card) | no | **no** (evaluation of filler recall only) |
| openSMILE / eGeMAPS extractor | audEERING Research License: no commercial use; "any direct (software) or indirect (models, features extracted with the software)" commercial use needs a commercial licence | n/a | **no** without a licence. Re-implement the descriptors in `dsp.ts` |
| emotion2vec+ | "other" | no | n/a (Tier X; shadow research arm only, if ever) |
| audEERING wav2vec2 MSP-dim (arousal / valence) | CC BY-NC-SA 4.0 | no | n/a (Tier X; shadow only) |

**Size against the 20 MB weights cap** [E]: Smart Turn v3 is about 8M parameters in int8 (R). The Whisper-base encoder is
roughly a quarter to a third of the model's 74M parameters, about 20M, so int8 lands near the cap. A small head on frozen
features fits easily. Measure the real exported ONNX before deciding.

---

## 7. Corpus survey

### 7.1 Child speech, tutoring or knowledge labels, Indian and Hinglish

| corpus | speakers | size | labels relevant here | licence (as read 2026-10-04) | use class | notes |
|---|---|---|---|---|---|---|
| **MyST** (My Science Tutor), Boulder Learning | US grades 3-5, English, 1,371 students | ~393-400 h; 10,496 sessions; 228,874 utterances; ~100K (≈45%) transcribed | **transcripts only**: no correctness, uncertainty or move labels | free version **CC BY-NC-SA 4.0**; **commercial licence purchasable** (10 organisations had licensed it) [V arXiv 2309.13347] | eval / research free; ship-train only under a bought commercial licence | push-to-talk with close-talk headsets, so onset latency is **not natural** (spacebar-gated); strict turn-taking. Correctness could be labelled from tutor questions [U] |
| **CSLU Kids' Speech** (LDC2007S18) | ~1,100 US children, K-10 | prompted + spontaneous | none for knowledge | CSLU agreement: non-commercial linguistic education and research only [S] | research only | useful for age-band acoustics (9-13) |
| CMU Kids (LDC97S63) | US, 6-11 y | read speech | reading miscues | LDC licence [U, not read] | check | used in HiDeC disfluency work |
| **ITSPOKE WOZ uncertainty** (PSLC DataShop 128) | **adults** (college) | 81 students, 405 dialogues, ~70 h audio (per the paper) | **wizard uncertainty + correctness per turn**; transcripts with disfluency marks | DataShop terms: "for research purposes, not commercial purposes"; no redistribution; no de-anonymisation [V] | research / eval only | whether the audio is on DataShop is unverified (DataShop usually holds logs) [U] |
| ITSPOKE uncertainty corpus (Litman 2009) | adults | 9,588 turns, 80 users | uncertain / non-uncertain, κ 0.74 | via PETAL / DataShop [S] | research only | — |
| **Harvard Uncertainty Speech Corpus** (Pon-Barry) | **adults**, 42 US English speakers | 1,700 utterances, 148.79 min | **self-reported + perceived certainty**, correctness, difficulty | recordings "available upon request for research purposes"; acoustic features on Harvard Dataverse; no licence text [V] | research only | the only corpus with both self-report and listener labels |
| **HiACC** (Hinglish adult & children code-switched) | 20 children aged 10-14 (data-article table; the abstract says 6-14) + adults | 2.04 h of child speech (5.24 h total) | transcripts (Devanagari + Latin), token language tags, code-switch points | **CC BY-NC 4.0** (Zenodo 15551669) [V] | **eval only** | the best acoustic match (phone recorded on a Samsung M34, 16 kHz, Hinglish, the right ages), but no knowledge labels; already in `rj-nc-data-and-weights-in-product` |
| **ASER dataset** (Pratham) | 5,301 children aged 6-14; Hindi, Marathi, English | 81,330 clips | reading-level labels (expert) | **CC BY-NC-SA 4.0** [S] | eval only | reading, not tutoring; real Indian phone audio |
| **ScAA** (Pratham) | children aged 8-14; Hindi, Marathi | 10,988 + 1,955 answer pairs, 32 grade-8 science questions | **correct / incorrect, two raters, κ 0.75** | **CC BY-NC-SA 4.0** [V README] | eval only (text grader) | **text** (typed, or speech-to-text then edited): no audio |
| Nexdata Hindi Children Speech | ≤ 12 y, Hindi | 34 h, conversation and monologue (interviews, self-media, variety shows) | transcripts, speaker metadata | commercial purchase licence [S] | **buyable for ship-training** of the acoustic front-end (child F0, VAD robustness) | consent provenance for minors must be verified before purchase [U]; no knowledge labels |
| Cheng et al. 2023 | children (US), video | — | uncertainty, annotated with developmental psychologists | release pending consent forms [V abs] | — | video only |
| **Taxila E1 / pilot (planned)** | Taxila children, 9-13, hi / hinglish / en | grows with use | grader correctness, IDK type, recognition probe, delayed and woven transfer outcome, item difficulty | Taxila consent | **the only shippable source of knowledge-labelled child speech** | §7.3 |

### 7.2 Adult and auxiliary corpora (backbone, fillers, Hinglish register)

| corpus | what | licence | use class |
|---|---|---|---|
| **IndicVoices** (AI4Bharat) | 19,550 h, 29K speakers, 22 languages; read 8%, extempore 76%, conversational 15%; metadata age groups 18-30 to 60+ | **CC BY 4.0** [S] | ship-OK for adult Hindi prosody and backbone adaptation; **no children** |
| **Vaani** (IISc / ARTPARK, with Google) | 31,255 h of image-prompted spontaneous speech, 158K speakers, 165 districts, 105 languages; 2,043 h transcribed | **CC BY 4.0**; the HF dataset is gated behind a contact-information form [V] | ship-OK (the gate is a contact form on a *dataset*, not a gated model); ages undocumented |
| MUCS 2021 Hindi-English (OpenSLR 104) | 89.86 h train / 5.18 h test, code-switched spoken tutorials (adult teacher register) | **CC BY-SA 4.0** [S] | usable; whether ShareAlike attaches to trained weights is a legal question [U] |
| Speak & Improve 2025 (Cambridge) | ~315-340 h of adult L2 English; ~55 h with hesitation, false-start and disfluency marks | non-commercial research [S] | eval only |
| PodcastFillers (Adobe) | 145 h, 35K fillers + 50K other events | annotations under the Adobe Research License (non-commercial) [S] | eval only |
| SEP-28k (Apple) | ~28K 3-s clips; interjections, prolongations, blocks; audio by URL | **CC BY-NC 4.0** [S] | eval only |
| TalkBank / CHILDES / FluencyBank | child language transcripts and media | **CC BY-NC-SA 3.0**; data may not be included in commercial models (algorithm development only, for approved companies) [S] | research only |
| NCTE transcripts | 1,660 US grade 4-5 maths lessons (text) | access by application [U] | eval / research |
| TalkMoves | 567 K-12 maths transcripts with talk moves | **CC BY-NC-SA 4.0** [S] | eval only |
| Wynn et al. confidence sets | ~444 adult clips re-annotated for confidence | derived from NC sources (SEP-28K) [U] | eval only |
| Shadow research arm only (Tier X, never shipped): emotion corpora such as FAU Aibo (German children, 10-13), MSP-Podcast, IEMOCAP | emotion labels | research / academic licences [U, not read] | research only; self-hosted; output never reaches a prompt, the child, a parent or a stored profile |

### 7.3 The corpus Taxila must build: the FOK paradigm, mapped onto a lesson

No corpus can supply labelled child speech for Taxila. The FOK paradigm shows how to label our own sessions without any
emotion label and with no extra annotation. Each paradigm stage maps onto something the lesson already does [T]:

| FOK paradigm (Hart; Smith & Clark) | Taxila equivalent | label it yields |
|---|---|---|
| open recall question | the posed item (an open spoken answer) | voice features + grader correctness |
| non-answer | an IDK turn, typed by the lexicon (`IDK` vs `IDK_R`) | response type + lexical FOK proxy |
| recognition test | the in-episode **recognition probe** after an IDK (mcq2 or cue; UD S1 / WB-M1) | ground truth for searching vs absent |
| (delayed retention) | the scheduled delayed and woven transfer check (CE7) | ground truth for fluent vs fragile (ESE) |
| FOK self-rating | **optional, research arm only:** a 3-way "pakka / thoda / guess" tap on about 1 in 10 items, with consent | the child's confidence. Use it to study calibration, **not** as the model's target (§3.2) |

**Data rules this implies:**
- Per-child acoustic baselines persist in Neon. Raw audio does not leave the device, as SPEC already says.
- The training rows are features plus outcomes, never audio.
- Training a shipped model uses only rows that carry consent for that purpose.
- The E1 consent text must name persistent acoustic baselines (R §7.4; Microsoft restriction 17).

---

## 8. Ranked cue list for `voicesig` (decision input, not the design)

Ranked by evidence × transfer to Hindi-speaking children × feasibility on the existing front-end. Every cue comes from the
**shared** `featureWorklet.ts` → `dsp.ts` tap that duplex also reads.

| # | cue | best evidence | transfer | front-end status | note |
|---|---|---|---|---|---|
| 1 | **onset to first content word**, z within the child, item-adjusted, split by answer vs non-answer | A (adults) / B (children) | high | A1 + A2 built; difficulty adjustment missing (SPEC §2.5.3) | the answer / non-answer flip is the key interaction term |
| 2 | **lexical IDK type × onset** (searching vs absent) | B | high | L-family + A1 built | validate against the recognition probe (WB-M1) |
| 3 | **hedge on a correct answer** (text) | A (adults) / B | high (lexical) | L3 built | the ITSPOKE active ingredient |
| 4 | **leading filler** (acoustic + lexical) | B | high | A7 built but unvalidated on human speech; L4 depends on the STT | calibrate on recorded human fillers; consider vowel quality |
| 5 | **silence within the answer** (total silence, pause fraction) | B (adults) | medium | A3 / A4 built | flag code-switch adjacency |
| 6 | **self-repair direction** | B (UD S6) | needs verbatim STT | count built, direction not split | |
| 7 | **articulation rate** (confidence) | B (adults) | medium | A6 built | script-aware |
| 8 | **relative intensity** (accuracy signature) | B (adults; Wilschut, Gustafsson) | unknown | **blocked by AGC** | VS-M4: unprocessed analysis track on Android |
| 9 | **response duration vs the child's own median** | B | medium | A8 / L15 built | wordy forms only (`sig-l15-wordy-forms-only`) |
| 10 | **SSL embedding residual** (Whisper-base encoder or w2v-BERT 2.0 head) | C for children | unknown | not built | only after E1 data exists; hand timing features kept beside it |
| — | terminal rise | B in English, broken in Hindi | no, as built | A9 decision-excluded | SG-M1 |
| — | F0 level / range, voice quality, sighs | D / X-adjacent | — | q only or not built | R §9 exclusions stand |

---

## 9. Measurement backlog (pre-registered; nothing here is measured yet)

IDs continue R's SG-M\* and UD's WB-M\*. Where those already cover a question, they are referenced, not duplicated.

| id | question | method | pass / reverse |
|---|---|---|---|
| **VS-M1** | Does the Smith & Clark non-answer flip hold for Taxila children? | IDK turns with a recognition probe: P(recognition correct) by onset tercile (child-relative) × lexical type | slow IDK_R ≥ fast IDK by ≥ 0.15 in recognition, n ≥ 200 IDK events per class band (WB-M1's bar) → ship `searching` |
| **VS-M2** | Per-cue ESE likelihood ratio on delayed success | hierarchical logistic per UD §4; cues of §8 #1-#9 one at a time, then jointly | a cue stays if ΔAUC on delayed items within skill is ≥ 0.01 alone and the joint model is ≥ 0.03 (UD's CE8 bar) |
| **VS-M3** | Terminal rise in Hinglish | = SG-M1 | LR ≥ 1.2 in hi **and** hinglish, utterance-final only → re-admit |
| **VS-M4** | Can an unprocessed analysis track run beside the echo-cancelled STT capture on Android Chrome, and does relative intensity carry accuracy signal? | (a) engineering probe on 3 Android devices: a second `getUserMedia` track with AGC, NS and AEC off; check that AEC on the main track is undisturbed. (b) Gain-invariance like ES-2. (c) On E1: LR of relative final-word intensity on correctness given grader evidence | (a) no measurable AEC regression; (c) LR ≥ 1.1 → add the cue |
| **VS-M5** | Does voice-driven fragile-correct probing raise delayed accuracy in children? (ITSPOKE's transfer question) | A/B on pilot: arm 1 probes on text hedges only; arm 2 on text hedges + voice (`fragileCorrect`); the same verify budget | delayed accuracy on probed skills +0.03 with the 80% CI excluding 0 → keep; null after 2 cohorts → voice drops to a timing-only role |
| **VS-M6** | Age band | cue LRs for 9-10 vs 11-13 (Visser 2014 predicts stronger cues at 11+) | if 9-10 LRs are < 1.05, disable voice adjustments for that band |
| **VS-M7** | Code-switch cost | onset and pause z on turns with vs without an intra-turn switch, matched on item | if the switch adds ≥ 0.3 SD, model it explicitly; else the language-mode key suffices |
| **VS-M8** | Fairness | = SG-M6, extended to the voicesig outputs (home language, speech-difference flag, age band) | fire-rate difference ≤ 0.02 per 100 turns, else remove the feature for everyone |
| **VS-M9** | Filler retention by STT, and acoustic filler calibration | SG-M4, plus 60 recorded human filled pauses (Hindi uh / um, Hinglish lexical) for A7 | A7 recall ≥ 0.6 at ≤ 0.05 false positives, else A7 stays q-only |
| **VS-M10** | Self-report calibration (research arm) | gamma between the "pakka / thoda / guess" tap and correctness, by age band | descriptive only. Never a training target (§3.2) |

---

## 10. Proposed context entries (for the main loop to merge; not written to `context/inbox`, which is outside this workstream's paths)

- **decision `vs-timing-first`:** the voice lane for knowledge state is timing-first (onset to first content word, the
  answer / non-answer flip, pauses, fillers). Pitch contour stays decision-excluded. *Rationale:* delay −1.30 vs
  intonation −0.49 FOK points (Swerts & Krahmer 2005, n = 20); silence r = −0.64 vs F0 range −0.13 (Pon-Barry 2011); the
  Hindi L\*+H confound. *Reverse if:* SG-M1 / VS-M3 show a terminal-rise LR ≥ 1.2 in hi and hinglish turns.
- **decision `vs-label-from-outcomes`:** voicesig models are trained on future knowledge outcomes (recognition probe,
  delayed check), never on the child's self-reported confidence or on listener-perceived certainty. *Rationale:*
  self-report vs perception r = 0.42 (Pon-Barry 2011); children's FOK accuracy low (Lockl & Schneider 2002) and
  overconfident; disfluency tracks accuracy more than confidence at 5-8 (West 2025). *Reverse if:* VS-M10 shows a
  self-report gamma ≥ 0.6 in 11-13-year-olds and adding it improves ESE ΔAUC.
- **decision `vs-name-for-knowledge`:** output vocabulary as in §1.3. Propose renaming SPEC `unsureCorrect` →
  `fragileCorrect`. *Rationale:* the literature labels uncertainty as "affect"; restriction 12's "other terms" clause.
  *Reverse if:* Microsoft confirms in writing that certainty / uncertainty terms are outside restriction 12 (then the
  rename is cosmetic, not required).
- **rejection `rj-vs-opensmile-features-in-product`:** *Tried (licence check):* openSMILE / eGeMAPS features for a
  shipped model. *Broke:* the audEERING Research License covers "features extracted with the software" for commercial
  use. *Instead:* re-implement the descriptors in `dsp.ts`.
- **rejection `rj-vs-nc-uncertainty-corpora-for-training`:** MyST (free tier), HiACC, ASER, ScAA, ITSPOKE (DataShop),
  Pon-Barry, PodcastFillers, SEP-28k, Speak & Improve and TalkBank are evaluation or research only. MyST can become
  shippable under a purchased commercial licence. (This extends `rj-nc-data-and-weights-in-product`.)
- **rejection `rj-vs-gated-or-nc-encoders`:** MMS (CC BY-NC), CrisperWhisper weights (CC BY-NC), `indicwav2vec-hindi`
  (gated) are not used in shipped models. WavLM is pending licence confirmation.
- **measurement `m-vs-lit-itspoke-effects`:** the ITSPOKE WOZ effect sizes computed from Table 5 (n = 81; normalised gain
  d ≈ 1.23 Simple vs NonAdapt; d ≈ 0.31 Simple vs Random, n.s.), and the automated null (n = 67, p = .617), recorded as
  literature numbers with their method. These are *not* Taxila measurements.

---

## 11. What this file did not verify

- Smith & Clark 1993 and Brennan & Williams 1995 were read only through Swerts & Krahmer's full-text summary and search
  summaries. The exact n and statistics of Smith & Clark (n = 25 per UD) were not re-read.
- West et al. 2025, Goupil & Aucouturier 2021 and Visser et al. 2014: abstracts only, with sample sizes not retrieved.
- Forbes-Riley & Litman 2011 (*Speech Communication*): n = 72 and the subset result come from the companion chapter and
  search summaries, not from the paper itself.
- The Indian English L\*+H claim, Casillas' child latency figures, Siegler's 2.90 vs 4.06 s, the Rowe and Tobin wait-time
  numbers, Fricke 2016, Gross & Kaushanskaya 2015, Coane & Umanath 2019, Metcalfe & Finn 2012 and Lee et al. 1999 are
  search-level [S].
- Licences marked [S] came from search summaries of dataset pages (CSLU, ASER, PodcastFillers, SEP-28k, S&I, TalkBank,
  MUCS, TalkMoves, IndicVoices, Nexdata). Read each licence file before any download for training.
- Not checked: WavLM weight licence; CMU Kids licence; whether DataShop 128 includes audio; NCTE access terms; the consent
  provenance of Nexdata's child recordings.
- The [E] effect sizes are pooled-SD Cohen's d computed from published means and SDs, not reported by the authors.
- Nothing here was measured on a Taxila child. Every Taxila-specific threshold is pre-registered in §9.

---

## Sources

**Read in full this session [V]:**
- Swerts, M. & Krahmer, E. (2005). Audiovisual prosody and feeling of knowing. *JML* 53(1):81-94. Revision PDF: https://foap.tshdresearch.org/documents/jml-revision-final.pdf
- Pon-Barry, H. & Shieber, S. (2011). Recognizing uncertainty in speech. *EURASIP J. Adv. Signal Process.* 251753. https://arxiv.org/pdf/1103.1898 ; corpus page: http://www.ponbarry.com/uncertaintycorpus/index.html
- Forbes-Riley, K. & Litman, D. (2011). Designing and evaluating a wizarded uncertainty-adaptive spoken dialogue tutoring system. *CSL* 25(1):105-126. https://people.cs.vt.edu/shaffer/cs6604/Papers/ForbesRiley2009.pdf
- Forbes-Riley, K. & Litman, D. (2012). Adapting to multiple affective states in spoken dialogue. SIGDIAL. https://aclanthology.org/W12-1630.pdf
- Litman, D. & Forbes-Riley, K. (2014). Evaluating a spoken dialogue system that detects and adapts to user affective states. SIGDIAL. https://aclanthology.org/W14-4324.pdf
- Litman, D. & Forbes-Riley, K. Towards improving (meta)cognition by adapting to student uncertainty in tutorial dialogue (handbook chapter). https://people.cs.pitt.edu/~litman/10.1007_978-1-4419-5546-3_25.pdf
- Litman, D., Rotaru, M. & Nicholas, G. (2009). Classifying turn-level uncertainty using word-level prosody. Interspeech. https://people.cs.pitt.edu/~litman/p17322.pdf
- Zhang, X., Mostow, J. & Beck, J. (2007). Can a computer listen for fluctuations in reading comprehension? AIED. https://www.cs.cmu.edu/~listen/pdfs/AIED2007-fluctuation-final.pdf
- Patil, U., Kentner, G., Gollrad, A., Kügler, F., Féry, C. & Vasishth, S. (2008). Focus, word order and intonation in Hindi. *JSAL* 1(1). https://www.ling.uni-potsdam.de/~vasishth/pdfs/Patil-Kentner-Gollrad-Kuegler-Fery-VasishthJSAL2008.pdf
- Jabeen, F. & Betz, S. (2022). Hesitations in Urdu/Hindi: distribution and properties of fillers and silences. Interspeech. https://www.isca-archive.org/interspeech_2022/jabeen22_interspeech.pdf
- MyST corpus paper (2023). https://arxiv.org/abs/2309.13347
- HiACC data article (2025). https://pmc.ncbi.nlm.nih.gov/articles/PMC12329218/ ; Zenodo 10.5281/zenodo.15551669
- Pratham ScAA dataset README. https://github.com/PrathamOrg/ScAA-Dataset
- PSLC DataShop terms of use. https://pslcdatashop.web.cmu.edu/Terms ; dataset 128: https://pslcdatashop.web.cmu.edu/DatasetInfo?datasetId=128 ; PETAL ITSPOKE page: https://people.cs.pitt.edu/~litman/itspoke.html
- openSMILE licence. https://raw.githubusercontent.com/audeering/opensmile/master/LICENSE
- Hugging Face model metadata (licence, gating), read through the HF API: openai/whisper-base, openai/whisper-small, facebook/wav2vec2-base, facebook/wav2vec2-xls-r-300m, facebook/hubert-base-ls960, facebook/w2v-bert-2.0, facebook/mms-300m, microsoft/wavlm-base-plus, microsoft/wavlm-large, ai4bharat/indicwav2vec-hindi, pipecat-ai/smart-turn-v3, nyralabs/CrisperWhisper, emotion2vec/emotion2vec_plus_base, audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim; microsoft/unilm LICENSE (MIT); nyrahealth/CrisperWhisper LICENSE (MIT, code)
- Vaani dataset card. https://huggingface.co/datasets/ARTPARK-IISc/Vaani

**Abstract read this session [V abs]:**
- Krahmer, E. & Swerts, M. (2005). How children and adults produce and perceive uncertainty in audiovisual speech. *Language and Speech* 48(1):29-54. https://doi.org/10.1177/00238309050480010201
- Visser, M., Krahmer, E. & Swerts, M. (2014). Children's expression of uncertainty in collaborative and competitive contexts. *Language and Speech* 57(1). https://doi.org/10.1177/0023830913479117
- West, Baer, Yu & Odic (2025). Do young children use verbal disfluency as a cue to their own confidence? *Dev. Sci.* https://doi.org/10.1111/desc.13617
- Goupil, L. & Aucouturier, J.-J. (2021). Distinct signatures of subjective confidence and objective accuracy in speech prosody. *Cognition* 212:104661. https://doi.org/10.1016/j.cognition.2021.104661
- Wilschut, T., Sense, F. & van Rijn, H. (2026). Cognitive and metacognitive markers of memory retrieval performance in speech prosody. *Memory & Cognition*. https://doi.org/10.3758/s13421-026-01896-0
- Gustafsson, P. U., Lachmann, T. & Laukka, P. (2024). Machine learning predicts accuracy in eyewitnesses' voices. *J. Nonverbal Behav.* https://doi.org/10.1007/s10919-024-00474-9
- Gustafsson, P. U., Laukka, P., Elfenbein, H. A. & Thingujam, N. S. (2025). Vocal cues to eyewitness accuracy are detected by listeners with and without language comprehension. *Commun. Psychol.* https://doi.org/10.1038/s44271-025-00237-2
- Koriat, A. & Ackerman, R. (2010). Choice latency as a cue for children's subjective confidence in the correctness of their answers. *Dev. Sci.* 13:441-453. https://doi.org/10.1111/j.1467-7687.2009.00907.x
- Lockl, K. & Schneider, W. (2002). Developmental trends in children's feeling-of-knowing judgements. *IJBD* 26(4). https://doi.org/10.1080/01650250143000210
- Winsler, A. & Naglieri, J. (2003). Overt and covert verbal problem-solving strategies … children aged 5 to 17. *Child Dev.* 74:659-678. https://doi.org/10.1111/1467-8624.00561
- Hübscher, I., Esteve-Gibert, N., Igualada, A. & Prieto, P. (2017). Intonation and gesture as bootstrapping devices in speaker uncertainty. *First Language*. https://doi.org/10.1177/0142723716673953
- Wynn, A. & Wang, J. (2026). A semi-supervised framework for speech confidence detection using Whisper. arXiv 2605.12387. https://arxiv.org/html/2605.12387
- Wynn, A., Wang, J. & Tan, X. (2026). Semi-supervised speech confidence detection using pseudo-labelling and Whisper embeddings. arXiv 2606.16505. https://arxiv.org/html/2606.16505
- Chi, J., de Seyssel, M. & Schluter, N. (2025). The role of prosody in spoken question answering. arXiv 2502.05389. https://arxiv.org/abs/2502.05389
- Paige, A. et al. (2024). Training LLMs to recognize hedges in spontaneous narratives. arXiv 2408.03319. https://arxiv.org/abs/2408.03319
- Zhu, G., Caceres, J.-P. & Salamon, J. (2022). Filler word detection and classification: a dataset and benchmark (PodcastFillers). arXiv 2203.15135. https://arxiv.org/abs/2203.15135
- Wagner, L. et al. (2024). CrisperWhisper. arXiv 2408.16589. https://arxiv.org/abs/2408.16589
- Sun, A. et al. (2025). Who Said What WSW 2.0. arXiv 2505.09972. https://arxiv.org/abs/2505.09972
- Lathouwers, G. et al. (2026). Utterance-level methods for identifying reliable ASR output for child speech. arXiv 2604.19801. https://arxiv.org/abs/2604.19801
- Cheng, Q. et al. Learning multimodal cues of children's uncertainty (SIGDIAL 2023). arXiv 2410.14050. https://arxiv.org/abs/2410.14050
- Mostow, J. & Duong, M. (2009). Automated assessment of oral reading prosody. AIED. https://www.cs.cmu.edu/~listen/pdfs/AIED2009-expressiveness-final.pdf
- Agarwal, D. et al. (2019). A dataset for measuring reading levels in India at scale (ASER). arXiv 1912.04381. https://arxiv.org/abs/1912.04381
- Pulikodan, S. et al. (2026). VAANI. arXiv 2603.28714. https://arxiv.org/abs/2603.28714

**Secondary [S]:**
- Smith, V. & Clark, H. (1993). On the course of answering questions. *JML* 32:25-38 (via Swerts & Krahmer 2005; UD).
- Brennan, S. & Williams, M. (1995). The feeling of another's knowing. *JML* 34 (via Swerts & Krahmer 2005). https://www.semanticscholar.org/paper/e85cc2c429111c7b8c5c4a4f0f344a374a127f81
- Liscombe, J., Hirschberg, J. & Venditti, J. (2005). Detecting certainness in spoken tutorial dialogues. Interspeech. https://www.isca-archive.org/interspeech_2005/liscombe05_interspeech.html
- Forbes-Riley, K. & Litman, D. (2011). Benefits and challenges of real-time uncertainty detection and adaptation in a spoken dialogue computer tutor. *Speech Communication*. https://www.sciencedirect.com/science/article/abs/pii/S0167639311000318
- Pon-Barry, H. et al. (2006). Responding to student uncertainty in spoken tutorial dialogue systems. *IJAIED* 16(2):171-194. https://dl.acm.org/doi/10.5555/1435344.1435349
- Jiang, X. & Pell, M. (2017). The sound of confidence and doubt. *Speech Communication* 88. https://doi.org/10.1016/j.specom.2017.01.011
- Hübscher, I., Vincze, L. & Prieto, P. (2019). Children's signaling of their uncertain knowledge state. *Lang. Learn. Dev.* 15(4):366-389. https://www.researchgate.net/publication/335075575
- Coane, J. H. & Umanath, S. (2019). I don't remember vs. I don't know. *JML* 107:152-167. https://www.sciencedirect.com/science/article/abs/pii/S0749596X19300476
- Metcalfe, J. & Finn, B. (2012). Hypercorrection of high confidence errors in children. *Learning and Instruction* 22:253-261. https://www.columbia.edu/cu/psychology/metcalfe/PDFs/MetcalfeFinn2012.pdf
- Lee, S., Potamianos, A. & Narayanan, S. (1999). Acoustics of children's speech. *JASA* 105(3):1455-1468. https://sail.usc.edu/publications/files/LeeJASA1999.pdf
- Casillas, M., Bobb, S. & Clark, E. (2016). Turn-taking, timing, and planning in early language acquisition. *J. Child Lang.* https://chatterlab.uchicago.edu/lab-publications/Casillas_et_al_2016_Turn_taking_timing_and_planning_in_early_language_acquisition_JCL.pdf ; review 2025: https://link.springer.com/article/10.3758/s13423-025-02749-8
- Siegler strategy-choice method (retrieval vs counting latency): https://siegler.tc.columbia.edu/wp-content/uploads/2020/10/1989strat-choice-procedures.pdf
- Rowe, M. B. (1986). Wait time: slowing down may be a way of speeding up! *J. Teacher Educ.* 37(1):43-50; Tobin, K. (1987). The role of wait time in higher cognitive level learning. *RER* 57(1):69-95. https://journals.sagepub.com/doi/10.3102/00346543057001069
- Fricke, M., Kroll, J. & Dussias, P. (2016). Phonetic variation in bilingual speech. *JML* 89:110-137. https://www.researchgate.net/publication/284017290
- Gross, M. & Kaushanskaya, M. (2015). Voluntary language switching in English-Spanish bilingual children (via later citing work). https://journals.sagepub.com/doi/full/10.1177/1367006918798972
- Hindi-English code-switched entrainment (2026). arXiv 2607.25202. https://arxiv.org/pdf/2607.25202
- Féry, C. Indian languages as intonational phrase languages. https://caroline-fery.de/papers/2010/Fery10_Indian_Languages_Phrase_Languages.pdf ; Indian English pitch accents: https://www.researchgate.net/publication/324841925
- Ward, W., Cole, R. et al. (2013). My Science Tutor. *J. Educ. Psychol.* 105(4):1115-1125. https://eric.ed.gov/?id=EJ1054441
- Wilschut, T., Sense, F. & van Rijn, H. (2023). Improving adaptive learning models using prosodic speech features. AIED. https://research.tudelft.nl/en/publications/improving-adaptive-learning-models-using-prosodic-speech-features
- Destan & Roebers line on children's confidence judgements: https://link.springer.com/article/10.1007/s11409-014-9133-z
- Fan et al. (2024). Benchmarking children's ASR with supervised and self-supervised speech. Interspeech. https://arxiv.org/pdf/2406.10507
- HiDeC, end-to-end word-level disfluency detection in children's reading assessment. https://ieeexplore.ieee.org/document/10095555/
- Late-stage audio and text fusion for classroom engagement (Stanford). https://ed.stanford.edu/eds/project/late-stage-audio-and-text-fusion-multimodal-approach-detecting-student-engagement-noisy
- CSLU Kids' Speech (LDC2007S18). https://catalog.ldc.upenn.edu/LDC2007S18
- TalkBank ground rules. https://talkbank.org/0share/rules.html
- PodcastFillers. https://podcastfillers.github.io/
- SEP-28k. https://github.com/apple/ml-stuttering-events-dataset
- Speak & Improve Corpus 2025. https://arxiv.org/abs/2412.11986
- MUCS 2021 (OpenSLR 104). https://www.openslr.org/104/
- ASER dataset. https://github.com/PrathamOrg/ASER-Dataset
- IndicVoices. https://huggingface.co/datasets/ai4bharat/IndicVoices
- Nexdata Hindi Children Speech. https://www.nexdata.ai/datasets/speechrecog/1377
- NCTE transcripts. https://aclanthology.org/2023.bea-1.44/ ; TalkMoves: https://github.com/SumnerLab/TalkMoves

**Carried from sibling Taxila docs (their tags apply):** the Microsoft Code of Conduct v4.0 text, EU AI Act Art. 5(1)(f), R's
tiers and lexicons (R §1, §5); Wise & Kong rapid guessing, Math Garden, Hübscher & Prieto children's onsets (R §3);
Nguyen, Del Tufo & Cutting 2020, Uehara 2026, audio-LLM paralinguistic loss 2609.00727, ESE (UD §1.4, §4); ES-1, ES-2 and
the voice research probes (`context/measurements.md`).
