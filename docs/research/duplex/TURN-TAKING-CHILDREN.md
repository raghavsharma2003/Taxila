# Duplex liveliness, Study C: turn-taking science and children (when the teacher listens, waits, nods and speaks)

**Date:** 2026-10-04. **Owner brief:** `owner-duplex-liveliness-2026-10-04`. While the child speaks, the teacher should
listen and think. She should choose between answering mid-utterance and waiting for the whole sentence, backchannel
naturally, handle interruptions, and build things in parallel. This study covers the human side of that brief: what
conversation analysis, psycholinguistics, developmental science and classroom research say about the floor. It
adds what is specific to children aged 8-13 and to Hindi/Hinglish, and turns all of it into a **floor policy** with
evidence, starting numbers and reversal conditions.

**Siblings, which this study does not repeat.**
- `PRODUCTS.md` (Study A): what ships, and the at-the-ear numbers (turnprobe, Speak, Sparrow, TurnBench).
- `MODELS-PAPERS.md` (Study B): the duplex models and benchmarks (IndicFDB, SHANKS, Voice-Light, HumDial, LateIntent),
  and the M-B1 prefix-commit measurement.
- `../world-best/voice-ux-smoothness.md`: Smart Turn, the child VAP headline, latency masking, visual backchannels.
- `../voice/human-likeness.md` §2.1 and `../voice/indian-teacher-discourse.md` §2.5 and §3.4: timing norms, *haan*
  contours, *na*, the starting think-time numbers.

This file cites those and adds four things: the primary child numbers, the classroom and tutoring evidence on
interrupting, a measured audit of the shipped turn heuristic against Hindi/Hinglish discourse markers (M-C1), and the
policy.

**Evidence tags** (same scheme as Study A):
- **[V]**: a primary source fetched this session (full text or abstract; full-text reads are marked "full text").
- **[S]**: secondary: a search snippet, a review's summary of a study, or a practitioner page.
- **[T]**: already in this repo, with the file cited.
- **[M]**: measured here, with n, method and date.
- **[E]**: my estimate or inference. Every policy number is [E] until the experiment named beside it runs.

**Method.**
- About 40 web searches and 14 primary fetches. Full texts read: Brahimi et al. 2026, Jabeen et al. 2022, Bona 2023,
  Gravano & Hirschberg 2011, D'Mello et al. 2010, the PMC copies of Shiau et al. 2024, Levinson & Torreira 2015 and
  the 5-year-old storytelling study.
- One deterministic in-repo measurement (M-C1, §6). It imports the shipped source and makes no model calls.
- One candidate policy module, `src/duplex/turnPolicy.ts`. It is pure, not wired, and measured by M-C1.
- No paid API calls. No real child audio (E1 has not run).

---

## 0. The findings that change something

1. **For a child of 8-9, a silence is usually a pause, not an ending.**
   - **Data.** In the Ohio Child Speech Corpus (303 children aged 4-9, about 148 h of child-adult talk), take every
     silence of 250 ms or more that follows at least 1 s of the child's speech. The share in which the *child*
     continued (HOLD) rises with age: 4 y 58.1%, 5 y 68.7%, 6 y 74.2%, 7 y 81.4%, 8 y 81.3%, **9 y 85.2%**
     (derived from Table 1 of Brahimi, Blanc & Fourtassi, IWSDS 2026 [V full text]).
   - **What it means.** Older children produce longer, multi-clause turns, so their pauses increasingly sit *inside*
     the turn.
   - **Silence alone.** Silence duration separates HOLD from SHIFT at only AUC 0.62. A VAP model reading the audio
     *before* the silence reaches balanced accuracy 94.1 on child-initiated events, with no clear age trend
     (same paper).
   - **Consequence for Taxila.** For the launch band (classes 4-7, ages about 9-12), the prior odds that a pause is
     mid-turn are about 4:1 or more [E, extrapolated from 8-9 y]. Silence-first endpointing is the wrong default for
     exactly the children we serve.

2. **Hindi fillers never end a turn, and the shipped heuristic cannot see them in the way our STT writes them.**
   - **The literature.**
     - In Urdu/Hindi conversation, 133 fillers were coded: **0 at turn end**; uh-type fillers were initial or medial,
       um-type mostly medial (Jabeen et al., Interspeech 2022 [V full text], 14 adults, 25 min).
     - In 9-year-olds, **92%** of filled pauses are within the turn (Bona 2023 [V full text], n=6 per age).
   - **What the STT does.** M-C1 [M] found 15 distinct leading-filler spellings across the 20 STT configs (12 in the
     two production arms, 14 in the held-out configs): उम्म, उम, उम्मा, उम्, अम, अम्म, अम्, अं, आम, ओम, हम, um, umm,
     one in Arabic script (ام), and "vol" for वो.
   - **What the heuristic does.** The shipped heuristic (`turnModel.ts`, flag `turn.predictive`, default OFF) knows
     only Latin `umm+|uh+|hmm+`.
   - **Result on held-out STT configs.** A filler-only first fragment is committed as the child's whole turn in
     **103/255 (40.4%)** cases in the default context, and in **255/255 (100%)** in a number-answer context.
   - **The candidate.** `src/duplex/turnPolicy.ts` commits **1/255 (0.4%)** in both.

3. **An explicit request for time is not honoured anywhere in the stack.**
   - **Shipped predictive scorer.** "ek minute", "ruko", "soch raha hoon", "सोचने दो", "wait" and "let me think"
     all score 0.75, so the turn is **sent** in the default context: 0/9 honoured [M].
   - **Production today.** The fixed 900 ms server VAD ends the turn on any pause longer than 900 ms, whatever the
     words.
   - **Implication.** A child who asks for a moment to think gets the teacher talking within about 1 s. That is the
     single most avoidable rude act in the product today [E].

4. **Mid-utterance *answering* is wrong for children's answer turns; mid-utterance *listening* is right.**
   - **Self-repair.** Conversation strongly prefers self-repair over other-repair (Schegloff, Jefferson & Sacks 1977
     [S]). Children's answers self-repair often: M-B1 found the first value wrong in **21/21** hesitant answers
     [T, Study B].
   - **Tutors.** Expert tutors give feedback that is direct and *immediate*, where "immediate" means **the next
     turn**, not inside the student's turn (D'Mello, Lehman & Person 2010, 10 expert tutors, 50 sessions [V full
     text]).
   - **Think-while-listening models.** A think-while-listening interrupter cut off **24.9%** of fully correct
     solutions (SHANKS [T, Study B]).
   - **The rule.** Grade and correct at the transition point. Listen, think and build during the turn. Take the
     floor mid-turn only for the short list in §7.2.

5. **Wait time and the "700 ms" norm are not in conflict; they apply to different silences.**
   - **The 700 ms norm.** In adult talk, a response gap of 700 ms or more makes a dispreferred response more likely
     than a preferred one (Kendrick & Torreira 2015 [S]). Listeners rate a reply as less willing from about
     600-700 ms (Roberts et al. 2006 [S]).
   - **The wait-time evidence.** In classrooms, pauses of 3 s or more, before (wait time I) and after (wait time II)
     a student answer, lengthen answers and raise higher-order achievement (Rowe 1986 [S]; Tobin 1987 review,
     3 s threshold [V abstract]).
   - **Natural teacher behaviour.** Across 26 studies, natural WT1 averaged **2.04 s** and WT2 **0.69 s**; trained
     teachers reached 2.47 s and 2.29 s. Teachers did **not** naturally wait longer for harder questions
     (Shiau, McWilliams & Williams 2024 systematic review [V full text]).
   - **Reconciliation.**
     - A long gap *after a child's complete closed answer* is the teacher being slow, and children read it as
       "I was wrong" [E, from the adult evidence].
     - A long gap *while the child may still add more* (after a question, or after a partial explanation) is
       wait time, and it helps only if it is legible as listening.
   - **Policy.**
     - Answer complete closed answers fast.
     - Hold open the floor after questions and partial explanations, visibly.
     - Lengthen the hold for harder questions, which humans fail to do.

6. **The teacher's audible "haan" can leak a verdict.**
   - **The contours.** In Hindi, a flat *haan* is a backchannel and a sharp-rise *haan?* is a repair request
     (Bali 2009 [T]). A Hindi "yes" and a continuer are the same word.
   - **The hazard.** An audible *haan/achha* continuer, said while a child states a wrong step, can be heard as
     "correct".
   - **Policy.** Audio continuers, if any, are non-lexical ("mm"), never *haan/sahi/achha*. The body carries most
     backchannelling (visual nods, already world-best S4).
   - **The mirror problem.** The shipped `isBackchannel()` resumes the teacher over a lone *haan* even when it
     answers her own yes/no check, and over *haan?* (a repair request): **11/16** correct on the overlap set,
     against **16/16** for the candidate [M].

7. **Listeners shape the speaker, and the effect is large enough to matter for learning evidence.**
   - **Adults.** Distracted listeners made storytellers tell their stories "significantly less well, particularly at
     what should have been the dramatic ending" (Bavelas, Coates & Johnson 2000, 63 dyads [S abstract]).
   - **Children.** Children told stories with higher energy to a robot whose backchannels were timed by a
     prosodic model (Park et al. 2017 [T]).
   - **Why it matters.** The child's explanation is Taxila's richest comprehension evidence. A listener that visibly
     tracks it is therefore a measurement instrument, not decoration [E].

8. **Children are interrupted most exactly when they are disfluent, and that is the moment to wait.**
   - **Finding.** Mothers interrupted children's *disfluent* speech significantly more often than their fluent
     speech (stuttering literature [S]).
   - **Clinical practice.** Standard advice is slower adult speech, longer response latencies and fewer
     interruptions. The causal evidence is mixed: an interruption manipulation raised stuttering in only 2 of 11
     conditions [S].
   - **The hazard for a voice AI.** A turn-taker built on silence and completeness cues interrupts on disfluency *by
     construction*.
   - **Policy.** Disfluency (fillers, restarts, word search) raises the hold. It never lowers it.

9. **A second-language answer needs more time and usually gets less.**
   - **Classroom finding.** Second-language classrooms record WT2 around 0.73 s, and wait time is shorter after
     questions asked in the learner's second language. A 3-5 s wait raised willingness to communicate
     [S, secondary summaries; primaries not fetched].
   - **Relevance.** Many Taxila children answer in English as an L2 inside Hindi talk. A code switch inside an
     utterance is planning, not an ending [E].

10. **The distress floor and the wait-time rule point the same way.**
    - **Guidance.** NSPCC guidance for a child's disclosure: "Respect pauses and don't interrupt the child – let them
      go at their own pace" [S, NSPCC page snippet].
    - **Models.** Duplex models engage more with harmful intent that arrives after a pause (LateIntent [T, Study B]).
    - **Policy.**
      - When the safety predicate fires on a partial, all floor timers freeze (`safety-predicate-first` already
        freezes wait timers [T]).
      - The teacher does not talk over the child.
      - The safeguard reply comes at the next transition point.

---

## 1. The human floor in one page (what any listener, human or machine, is up against)

**Turns, transition points, projection.**
- Conversation is organised in turn-constructional units. A *transition-relevance place* (TRP) is where a unit could
  be complete, and speaker change happens there (Sacks, Schegloff & Jefferson 1974, the standard model).
- Gaps are short:
  - the modal floor-transfer offset is about 200 ms;
  - 70-82% of transitions are shorter than 500 ms (Heldner & Edlund 2010, via Levinson & Torreira 2015 [V full
    text]);
  - all 10 languages in Stivers et al. 2009 avoid overlap and minimise silence, with mean offsets within 500 ms
    [V abstract]. The repo has the +208 ms cross-language mean [T, human-likeness §2.1].
- Production is slow by comparison:
  - about 600 ms to start a single word;
  - 740-900 ms for two- or three-word utterances;
  - about 1,500 ms for a sentence (Indefrey & Levelt 2004, Schnur et al. 2006, Griffin & Bock 2000, all via
    Levinson & Torreira [V]).
- So listeners **project** turn ends and start planning during the turn. Comprehension is predictive.
- The same review: lexicosyntactic structure is "necessary (and possibly sufficient)" for projection (De Ruiter
  et al. 2006). Listeners also use intonational phrase boundaries (Bögels & Torreira 2015 [V citation]).

**Cues combine.**
- In the Columbia Games Corpus, Gravano & Hirschberg 2011 [V full text] found seven automatically computable
  turn-yielding cues: final intonation, speaking rate, intensity level, pitch level, IPU duration, voice quality and
  textual completion.
- The share of IPUs followed by a turn-taking attempt **rises from 5% with no cue to 65% with all seven**.
- Implication: no single cue (silence included) decides the floor. A combiner does.

**Gaps carry meaning.**
- After 700 ms, dispreferred responses outnumber preferred ones: 31.5% of responses after 700 ms are rejections vs
  2.3% acceptances (Kendrick & Torreira 2015 [S]).
- Listeners' "willingness" ratings drop around 600-700 ms (Roberts, Francis & Morgan 2006 [S]).
- A machine that is slow after a *correct* answer is therefore sending the wrong social signal.

**Overlap is common and mostly benign.**
- Simultaneous speech is only about 3.8% of Switchboard time. Overlaps are about 30% of floor transfers, and 75% of
  them are under 374 ms (Levinson & Torreira [V]). Heldner & Edlund report overlaps as about 40% of between-speaker
  intervals [S].
- Schegloff 2000 [S] separates benign kinds from competitive interruption:
  - terminal overlap: starting just before a projected end;
  - continuers ("mm hm");
  - conditional access: the speaker invites the other in, e.g. a word search;
  - choral talk (laughter, greetings).
- The floor policy needs that taxonomy, not a single "barge-in" event.

**Backchannels have a prosodic trigger and a rate.**
- In American English, 48% of backchannels follow a region of low pitch, but only 18% of such regions get one
  (Ward & Tsukahara 2000, via Gravano & Hirschberg [V]). The cue licenses a backchannel; it does not oblige one.
- Rates vary by language:
  - Japanese 34.4% of utterances, English 28.4%, Chinese 27.5% (Inoue et al., IWSDS 2026 multilingual backchannel
    model [S]);
  - Hindi human reference about **0.079 backchannels/s**, roughly one per 13 s of partner speech (IndicFDB [T, Study
    B]).
- Generic backchannels ("mhm") and **specific** ones (a wince, an "oh!") do different work; specific ones carry the
  co-narration effect (Bavelas 2000 [S]).

**Repair.**
- Self-initiated self-repair is preferred over other-initiated and other-repair (Schegloff, Jefferson & Sacks 1977
  [S]).
- The one setting where other-correction is common is competent adult with not-yet-competent child. That is exactly
  the asymmetry a tutor must resist using, because the self-repair is the learning [E, supported by the tutoring
  evidence in §3].

---

## 2. Children: what changes between 4 and 13

**Timing develops slowly and is limited by planning, not by understanding.**
- Children's response latencies fall with age. One longitudinal sample went from a median of 651 ms to 469 ms, with
  simple answers faster than complex ones (Casillas et al. 2016 [S]).
- Response planning, not turn tracking, is what limits them. Smooth multi-party transitions may not appear until
  about 6 (Casillas & Frank 2017 [S]).
- In middle childhood (7, 9 and 11 y), turn coordination is largely adult-like and multimodal (Agrawal et al.,
  CogSci 2023, ChiCa corpus [S]).
- The IWSDS 2026 result agrees: children's turns are *predictable* from acoustic cues before the silence. Adding
  text (BERT) did not help on child data (F1 90.38 → 90.25), but it did help on adult Switchboard (70.20 → 87.10)
  [V full text].
- Inference [E]: for children, **how** they sound before the pause predicts better than **what** they said. That
  argues for an audio turn model trained on children over a text heuristic. This repo has neither yet.

**Children pause more, longer, and in odd places.**

| measure | children | adults | source |
|---|---|---|---|
| silent pause duration (storytelling, 5 y) | 1,416 ms (1st telling), 1,094 ms (2nd) | 993 / 901 ms | PMC3681305 [V] (age effect ns, n=10 dyads) |
| pauses per 100 words | 1.98 × adults | 1 × | same [V] |
| pauses at ungrammatical points (e.g. between preposition and noun phrase) | 18% | 7% | same [V] |
| filled pauses per 100 words | 6.8 (5 y), 2.7 (9 y) | — | Bona 2023 [V], Hungarian, n=6+6 |
| filled pauses inside the turn (not turn-initial) | 45% (5 y), **92% (9 y)** | — | same |
| turns that open with a time-gaining starter ("well…", "umm…") | 38% (5 y), **36% (9 y)** | adults use them too | same; 9 y use a discourse marker (*hát*, "well") in about 90% of these |
| HOLD share of ≥250 ms silences after child speech | 58% (4 y) → **85% (9 y)** | Switchboard: shifts 9.5% of events | Brahimi 2026 [V], derived |

Inference [E]: a 9-12-year-old's turn often starts with a marker that takes the floor before the content is ready.
In Hinglish these are *haan toh*, *matlab*, *woh* and *umm*. Then come mid-clause pauses and fillers. Each of those
pauses is a trap for a silence endpoint, and the trap gets more frequent as answers get longer and more reasoned.

**What is *not* known (gaps this study could not close).**
- No corpus of Hindi or Hinglish child conversation timing was found. Human-1 (Josh Talks) has 26,000 h of adult
  Hindi conversation from 14,695 speakers [V abstract], but no child stratum.
- No 8-13-year-old pause-duration distribution was found for any language. The numbers above are for 5 y, 9 y and
  4-9 y.
- No study of children's turn timing *with an AI tutor* was found.

These are E1's job (§9).

---

## 3. Education: wait time, feedback timing, and the cost of interrupting

### 3.1 Wait time I and II

| quantity | value | source |
|---|---|---|
| natural WT1 (after a teacher question) | 2.04 s mean (0.97-3.70) | Shiau et al. 2024, 26 studies [V full text] |
| natural WT2 (after the student answer) | 0.69 s (0.55-0.90) | same |
| trained WT1 / WT2 | 2.47 / 2.29 s | same |
| threshold for benefits | ≥ 3 s: longer answers, more volunteered and relevant answers, higher cognitive achievement (elementary, middle, high school science; middle school maths) | Tobin 1987 [V abstract]; Rowe 1986 [S] |
| children's onset of a productive answer to an open recall question (forensic) | 4.80 s mean; **46% had not begun by 5 s** | single forensic study in Shiau 2024 [V] |
| harder question → longer wait? | **no**: "WT1 did not differ depending on the level of questions" | Shiau 2024 [V] |

Taxila today [T]:
- The YOUR TURN nudge is `waitNudgeSec` = 5 s (B2) and 4 s (B3). It does not depend on the question's cognitive
  level (`server/persona/adapter.js` BAND_DEFAULTS).
- The endpoint is a fixed 900 ms (`server/voice/stt.js`).
- The predictive arm holds 0.8-1.5 s by beat (`turnModel.ts`).

Taxila therefore copies the human teacher's known failure: one wait for every question.

### 3.2 Feedback timing: immediate means "next turn", not "inside the turn"

- **D'Mello, Lehman & Person 2010** [V full text], 10 expert tutors, 50 sessions:
  - Expert tutors' feedback is "direct, immediate, discriminating".
  - Negative feedback is the move most likely to immediately follow an error-ridden answer.
  - This revises the older claim that experts are indirect and delayed (Lepper & Woolverton 2002; Merrill et al.
    1992 [S]).
  - "Immediately" is measured as the turn right after the student's answer.
- **Shute 2008** [S]: immediate feedback is better for low-achieving learners and for new, difficult tasks. Delayed
  feedback is better for high achievers on complex tasks.
- **Mathan & Koedinger 2005** [S]: feedback that leaves room for the learner to detect and correct their own error
  (the "intelligent novice" model) beat both expert-model immediate feedback and plain delay.
- **Koedinger & Aleven 2007**, the *assistance dilemma* [S]: too much help too early gives shallow learning; too
  little gives frustration. Withhold first, then add help on demand.

**Synthesis [E].** For Taxila's children (classes 4-7, many low-achieving for their grade):
- Feedback on an answer comes **at the end of the child's turn, fast**.
- Feedback on a *self-repairable* step is withheld until the child has had the chance to repair: wait time II, plus
  one metacognitive prompt.
- Nothing is corrected *inside* the child's turn.

### 3.3 Interrupting a child's explanation

- **Self-explanation is the learning.** Eliciting self-explanations improved understanding, and more
  self-explanations meant more understanding (Chi et al. 1994 [S]).
- **Funnelling vs focusing.** Funnelling questions do the child's thinking for them; focusing questions keep it with
  the child (Wood 1998 [S]). An interruption mid-explanation is the extreme of funnelling.
- **The machine evidence.**
  - SHANKS interrupts on errors while the user explains a maths solution, but also cut off 24.9-41.1% of fully
    correct solutions, depending on variant [T, Study B §0.4].
  - GPT-Live-1 spoke into 54/117 mid-sentence pauses [T, Study A §0.2].
  - Domain framing as a tutor cut interruptions of learner thinking pauses from 27.6% to 13.6% (Speak) [T, Study A
    §0.5]. Better, but at 13.6% one thinking pause in seven is still taken.
- **The cost of an interruption outlasts it.** Classroom observation found that the learning time lost to an
  interruption includes getting back to the prior state of thinking; 45% of teachers and 43% of students reported
  interruptions interfering with learning (Kraft & Monti, "The big problem with little interruptions" [S]). That was
  external interruptions, not dialogue, so it is indirect evidence.
- **Confidence.** No controlled study was found that measured children's *confidence* after an AI tutor interrupted
  them mid-utterance. The harm claim rests on adjacent evidence:
  - the preference for self-repair;
  - interruptions concentrating on disfluent speech;
  - the narrator effect (Bavelas);
  - L2 learners getting less time.

  It should be tested directly (E-C5, §9) before it is cited as a number.

### 3.4 When teachers *should* take the floor

The literature's legitimate cases for speaking inside or right at the edge of a child's turn:
1. **Conditional access.** The child invites help: a word search with an appeal ("woh… kya kehte hain…"). Schegloff
   2000 [S] treats this as collaborative, not competitive. Supplying the word is pedagogically double-edged: it spares
   retrieval effort. So offer a **cue** (first sound, a picture, a choice), not the term, unless the term is not the
   learning target [E].
2. **The child asks for repair** ("kya?", rising "haan?", "phir se"). Stop and repeat, shorter and slower.
3. **The child asks the teacher to stop** ("ruko", "wait"). Stop.
4. **Reading aloud against a known text.** Amira intervenes "at the moment of struggle" because the expected text is
   known [T, Study A §0.6]. This is the one education product with a mid-utterance policy, and it is narrow.
5. **A long off-track turn.** Hold on, with uptake, at a TRP, never mid-clause [E].
6. **Safety.** Attend, do not interrupt (§0.10).

---

## 4. Models of end-of-turn and backchannel prediction (what each predicts, and what a tutor needs)

Study B (`MODELS-PAPERS.md` §5.3, §5.6) has the engineering detail. This table is about **fit to children and to a
tutor's context**.

| model | input | predicts | child evidence | Hindi | licence / availability | fit for Taxila |
|---|---|---|---|---|---|---|
| **VAP** (Ekstedt & Skantze, Interspeech 2022) [V abstract] | two-channel audio, CPC encoder, 50 Hz | next 2 s of voice activity per speaker → shift / hold / backchannel, zero-shot | **bAcc 94.1** on child-initiated events (OCSC) [V] | none published; multilingual VAP covers EN/ZH/JA (Inoue 2024 [V]) | research code; pretrained weights academic-only [T, world-best S4] | best-evidenced *for children*; must be retrained on our audio (S2 "Next-Turn" label-free targets) |
| **MaAI** (Kyoto) [V README] | audio, real time, CPU, default 10 Hz | turn-taking, backchannel, **head nodding** | none | EN/ZH/JA only | code MIT; weights vary per model | a ready architecture for the avatar's nods; no Hindi |
| **TurnGPT** (Ekstedt & Skantze, EMNLP Findings 2020) [V abstract] | text with speaker tokens | TRP probability per word (projection) | none; IWSDS 2026 found text adds little for children [V] | — | open code | weak for children's *timing*; useful as a "complete answer?" component inside a known item |
| **Smart Turn v3.x** (Pipecat) | ≤ 8 s audio, Whisper-tiny encoder, 8 MB | P(turn complete) at a pause | none | **93.44%** on 1,295 Hindi test samples [S, Daily blog] | BSD-2 | the planned scorer (`turnModel.ts loadSmartTurn` returns null today). **Warning:** Voice-Light found it worse than a tuned 640 ms silence policy on real English pauses [T, Study B §0.5] |
| prosody-only EOT (Sharon et al. 2026) | acoustic-prosodic features | utterance end | none | — | paper | F1 0.93 with 7.8% false alarms at 400 ms; adding text *raised* false alarms [T, world-best §0.9] |
| turn-aware streaming ASR (Li & Shi 2026) [V abstract] | ASR encoder + LoRA, causal labels | end of turn inside the ASR | none | — | paper | boundary recall 0.97 at 0.39 s median, 0.3 false fires per speech-minute; the label-leak lesson matters for our own training |
| backchannel VAP (Inoue et al., NAACL 2025; IWSDS 2026) [S] | audio | continuous backchannel timing | none | — | research | the model family for *when* to nod; Park 2017's prosodic rule is the cheap first version |
| **shipped heuristic** `textCompleteness` | final transcript text | P(done) from trailing words | — | partial lexicon | ours | M-C1: misses Devanagari fillers, hold requests, word search (§6) |

**What none of them predict, and a tutor must:** whether *this* pause, after *this* question, from *this* child, is
thinking.
- The relevant variables are the item's expected answer form, its cognitive level, the child's own pause baseline,
  the language of the answer, and whether a value has been heard yet.
- That is why the policy (§7) puts thresholds and hold windows in code keyed on Director context, with the model as
  one input.
- This matches Study B §7.3 ("the context-aware endpoint") and the IndicFDB finding that no generic system is both
  fast and patient [T].

---

## 5. Hindi/Hinglish floor markers: what holds, what yields

Grades:
- **A**: measured in a Hindi/Urdu corpus.
- **B**: measured in another language, with a plausible Hindi analogue.
- **C**: practitioner or teacher-discourse knowledge [T: indian-teacher-discourse §2.5], uncalibrated.
- **[M]**: what M-C1 found the shipped code does with the marker.

| marker (as the child says it) | floor function | where | grade | shipped scorer (default context) | candidate |
|---|---|---|---|---|---|
| *umm / uh*, written उम्म, उम, अम, अं, आम, ओम, हम्म… | **HOLD**: time-gaining; never turn-final | initial or medial | **A** (Jabeen 2022: 0/133 turn-final); B (Bona: 92% within-turn at 9 y) | Latin `umm` only; Devanagari spellings sent (40.4% of held-out fragments) [M] | held (0.4% sent) |
| *haan toh* / *haan to* | **HOLD**: preface; takes the floor before the content ("well, so…") | initial | B (Bona: time-gaining starters 36% of 9 y turns); C | held (trailing *toh*) | held |
| *matlab* / *yaani* | **HOLD**: reformulation or gloss; more is coming. Also a preface | initial or medial | C | held | held |
| *woh / vo* (+ *jo*, *wala*) | **HOLD**: word search or deixis placeholder ("that… the thing…") | medial | C | **sent** (0.75) | held |
| *kya bolte hain / kya kehte hain* | **HOLD + conditional access**: a word search that invites help | medial | B (Schegloff 2000, conditional access); C | **sent** | held; the policy offers a *cue* after the hold (§7.2) |
| *ek minute / ruko / soch raha hoon / sochne do / wait* | **explicit HOLD request** | any | B (an explicit, unambiguous request in any language) | **sent** (0/9 honoured) [M] | held, with an 8 s window and a visible "take your time" |
| *mujhe lagta hai… / I think…* (complement not yet said) | **HOLD**: projects a clause | initial | B (projection) | sent | held |
| *answer hai… / uttar hai…* (no value yet) | **HOLD**: projects a value | — | B | sent | held |
| *aur / phir / kyunki / lekin / ki / toh* trailing | **HOLD**: conjunction projects continuation | final position = mid-turn | B (syntactic projection) | held | held |
| ASR comma at the cut | **HOLD**: the recogniser heard a continuation contour | — | [M] proxy | held | held |
| clause-final *na* / *hai na* | **YIELD**: agreement-seeking tag ("…, right?") | final | A/B (O'Reilly-Brown [T]) | yield (0.75) | yield (0.95) |
| medial *na* ("water cycle na, …") | discourse marker (softens or insists), **not** a tag | medial | same | — | held when the ASR prints a comma |
| finite verb or auxiliary last (*है, था, होता है, आया, किया*) | **completion cue**: Hindi is SOV, so the verb closes the clause | final | B (syntactic completion; Gravano's textual-completion cue) | not used | yield (0.8-0.9) |
| *bas / itna hi / that's it* | **YIELD**: closure | final | C | yield | yield |
| *pata nahi / mujhe nahi pata / nahi aata* | **YIELD + help request** (IDK; W2-E splits cant_recall vs not_known [T]) | final | C | yield in default; **held 1.5 s** in explanation beats | yield in every context |
| *samajh nahi aaya / phir se bolo / kya?* | **YIELD + repair request** | final | B (other-initiated repair) | yield | yield |
| flat *haan* while she talks | continuer | overlap | A (Bali 2009 [T]) | resume ✓ | resume ✓ |
| *haan* answering her yes/no check | **answer** | overlap | — | resume ✗ (swallowed) | stop (needs `askedYesNo`) |
| rising *haan?* while she talks | **repair request** | overlap | A (Bali 2009) | resume ✗ (swallowed) | stop (only if the ASR prints "?": text cannot see pitch) |
| *theek hai* while she talks | continuer | overlap | C | stop ✗ | resume ✓ |

**Three structural points the table depends on.**
1. **Script.** The production STT writes Hindi fillers in Devanagari, Latin and once Arabic script, inconsistently
   across noise conditions and configs: 12 spellings in the dev arms, 14 in the held-out configs [M]. Any lexical
   cue must be matched by *shape* across scripts and tested against real transcripts. A word list in one script is
   a silent failure.
2. **Prosody.** *haan*, *na* and *achha* change act with pitch contour (Bali 2009; O'Reilly-Brown [T]). The
   transcript keeps only the ASR's punctuation guess:
   - on the dev split, 12/152 internal prefixes ended in "?" (115/1,417 held-out), so a "?" is weak evidence [M];
   - so the final word on these markers needs the audio scorer (Smart Turn or VAP retrained);
   - the text layer is a floor, not a ceiling.
3. **Verb-final syntax.** English turn-completion heuristics treat a trailing verb as "object pending". In Hindi the
   finite verb closes the clause. Porting an English completeness model to Hinglish without this flips a cue [E].
   The IWSDS finding that text adds little for children [V] suggests not over-investing in text rules at all.

---

## 6. Measurement M-C1: the shipped turn heuristic vs the marker evidence (2026-10-04)

**Question.** The client's end-of-turn scorer and barge-in classifier encode a theory of which words hold the floor.
Does that theory match the literature, and the way our STT spells the words?

**Harness.** `evals/duplex/turn-markers.mjs`. It is deterministic, makes no network calls, and imports the real
`src/lesson/turnModel.ts`, `src/lesson/cascadeLink.ts` and `src/duplex/turnPolicy.ts` through Node 22 type
stripping.
- Results: `evals/duplex/results/turn-markers-2026-10-04.json` (candidate v2) and
  `turn-markers-v1-2026-10-04.json` (candidate v1, frozen before any error inspection).
- Corpus: STT transcripts of the 30 stimuli in `docs/research/voice/v2/stt/stimuli.mjs`, from the 2026-10-04 refresh
  rows (`evals/model-refresh-2026-10-04/stt/results/rows-2026-10-04.json`), across clean and 12 noise conditions.

**Splits.**
- **Dev:** D4 (gpt-live-transcribe, production) and S0 (MAI-Transcribe-2-Streaming). 360 rows. The candidate's
  lexicon was written while looking at these.
- **Test:** the other 18 STT configs in the same refresh. 3,222 rows, with spellings the candidate never saw.

**Sets.**
- **F.** The filler-only first fragment of each hesitant clip (d01-d05), keeping the ASR's own punctuation. Truth
  HOLD: every one of these clips continues with the answer.
- **P.** Each transcript cut at every internal ASR punctuation mark, a proxy for where a pause was heard. Truth HOLD.
- **U.** The complete transcript. Truth YIELD.
- **M.** 39 authored marker probes, labelled by §5 (literature labels, not child data).
- **B.** 16 overlap cases with the action a teacher should take.

"Sent" means the fragment would be committed as the child's whole turn (score ≥ threshold, or a 0 ms hold window).
Contexts are the four the scorer distinguishes: number answer, default, probe, explanation (teachback).

### 6.1 Results (test split = held-out configs; candidate v1 = frozen before inspecting any errors)

**F: filler-only fragments committed as the whole turn** (test n=255):

| context | shipped | candidate v1 | candidate v2 |
|---|---|---|---|
| number answer | **255 (100%)** | 4 (1.6%) | 1 (0.4%) |
| default | **103 (40.4%)** | 4 (1.6%) | 1 (0.4%) |
| probe | 3 (1.2%) | 0 | 0 |
| explanation | 3 (1.2%) | 0 | 0 |

**P: premature send at a mid-utterance ASR break** (test n=1,417):

| context | shipped | candidate v1 | candidate v2 |
|---|---|---|---|
| number answer | **1,417 (100%)** | 560 (39.5%) | 606 (42.8%) |
| default | 470 (33.2%) | 419 (29.6%) | 358 (25.3%) |
| probe | 336 (23.7%) | 346 (24.4%) | 339 (23.9%) |
| explanation | 233 (16.4%) | 339 (23.9%) ✗ | **163 (11.5%)** |

**U: complete answers held for more speech** (test n=3,222; the latency cost):

| context | shipped | candidate v1 | candidate v2 |
|---|---|---|---|
| number answer | 0 | — | 19 (0.6%), +6 ms mean |
| default | 5 (0.2%) | — | 19 (0.6%), +7 ms mean |
| probe | 49 (1.5%) | 275 (8.5%) ✗ | 61 (1.9%), +25 ms mean |
| explanation | 467 (14.5%), +217 ms mean | 284 (8.8%) | 634 (19.7%), **+297 ms mean** |

**M: authored marker probes** (28 HOLD, 11 YIELD):

| context | HOLD honoured, shipped → v2 | YIELD honoured, shipped → v2 |
|---|---|---|
| number | 0 → 28 | 11 → 11 |
| default | 6 → 28 | 11 → 11 |
| probe | 22 → 28 | 6 → 10 |
| explanation | 28 → 28 | 2 → 9 |

**B: overlap while she speaks.** Shipped `isBackchannel` 11/16, candidate `overlapKind` 16/16. The shipped
classifier swallows:
- *haan* and *हाँ* answering her yes/no check;
- *haan?* and *हाँ?* repair requests.

It also stops her for *theek hai* (a continuer).

### 6.2 What the numbers say

1. **The number-answer context is the most fragile, and fixing it with text is only half possible.**
   - **Shipped.** `holdMsFor` returns 0 for numbers, so *any* fragment is committed at the 500 ms candidate
     endpoint, a bare "उम्म।" included.
   - **Candidate.** It holds only fragments with no value yet (700 ms). That fixes fillers (100% → 0.4%).
   - **What remains.** 43% of mid-utterance breaks are still sent, because the break follows a value and a
     self-repair follows ("तीन बटा आठ। नहीं नहीं, तीन बटा चार।"; "twenty-one. No, wait, twenty-four.").
   - **Text cannot tell these from a finished answer. The remedy is structural** (P8 in §7): commit early but keep
     the commit **revocable**. If the child resumes before the teacher's first audio, merge and re-plan. This is the
     "commit early, decide late" speculation pattern, and the reply speculation (`cascade-speculative-reply`) already
     makes re-planning cheap.
2. **In explanation beats the candidate trades latency for patience, deliberately.**
   - **The trade.** Premature sends fall 16.4% → 11.5%. Complete answers held for more speech rise 14.5% → 19.7%,
     costing +80 ms mean extra wait.
   - **Why the cost is an upper bound.** The corpus is answers, not explanations, so value-final "answers" in a
     teach-back context are penalised here more than real explanations would be.
   - **Why the trade is right.** It matches §3: in an explanation, wait time II is the pedagogy.
3. **Candidate v1 was worse in two cells**: explanation P 23.9%, probe U 8.5%. Error inspection found the causes:
   - a missing number-word list ("fifty-six");
   - yield phrases matched mid-utterance;
   - a value counted as an ending inside an explanation.

   v2 fixes them. **But v2 was tuned after looking at errors on both splits, so its test column is in-sample.** The
   honest held-out evidence is v1's, frozen in `turn-markers-v1-2026-10-04.json`:
   - the filler and marker wins hold in v1 (F 1.6%; markers 27-28/28);
   - the explanation-beat improvement does not.
4. **The marker failures are categorical, not marginal.**
   - The shipped scorer sends every explicit hold request, every *woh / kya kehte hain* word search and every
     Devanagari filler in the default context: 22/28 HOLD items fail.
   - In explanation beats it holds 9/11 YIELD items for 1.5 s, including "मुझे नहीं पता". A child who has just said
     "I don't know" waits in silence.

**Limits.**
- The clips are synthetic TTS voices, not children. That makes the pause structure *cleaner* than real child speech.
- ASR punctuation is only a proxy for pause location.
- The authored marker set is labelled from the literature, not from children.
- Text cannot see pitch.
- None of this measures cut-off rates on real children. It measures whether the code's floor theory matches the
  evidence, and on markers it does not. Real-child numbers are E-C1 (§9).

---

## 7. The floor policy (the deliverable)

The policy is written for the cascade lane with an always-on ear: full-session audio streamed to STT, the owner's
default. "Code makes decisions, models read/speak/build/write." Every number is [E] until its experiment runs.

### 7.1 The floor states (what the teacher is doing while the child holds the floor)

| state | trigger | what the teacher does (body / voice / brain) |
|---|---|---|
| **LISTENING-open** | the child is speaking | Body: gaze on the child or the shared board; nods at backchannel opportunities (§7.4). Voice: silent. Brain: incremental understanding on partials (Study B §7.2 listening notes); the safety predicate on **every partial**; speculative replies may start; Studio builds may continue. **No grading.** |
| **LISTENING-paused** | a candidate endpoint (silence ≥ 500 ms) with P(done) < threshold | Body: the "still with you" pose (slight lean, eyebrows); no "your turn" glyph. Voice: silent. Brain: hold window running; the next fragment merges into the same turn |
| **HOLD-requested** | the child said a hold request, or the context is a hold-worthy word search | Body: an explicit "take your time" (relaxed posture, hand-down gesture); the status strip may show "soch lo, koi jaldi nahi" as a **chip**, not speech. Voice: silent for up to 8 s; then a choice, never a push (§7.3) |
| **COMMITTED-revocable** | P(done) ≥ threshold, or the hold expired | Body: the consider-answer pose within 150 ms (TEACHER-BRAIN L0). Brain: the reply is planned. If the child resumes before her first audio frame → back to LISTENING-open, merge and re-plan |
| **SPEAKING** | her first audio frame | Overlap from the child is classified (§7.5), never treated as one undifferentiated "barge-in" |
| **SAFETY-attend** | the safety predicate fires on any partial | All timers frozen. No nudge, no hold expiry, no backchannel audio. The teacher does not speak until a TRP, then the safeguarding reply (care + 1098 / 14416, same turn). Identity floor unchanged |

### 7.2 When the teacher may act *during* the child's turn (the whole list)

| act | allowed? | condition | evidence |
|---|---|---|---|
| listen, transcribe, think, plan, speculate | **always** | — | Study B §5.4; predictive comprehension (Levinson & Torreira) |
| build (whiteboard, game, animation) | **always**, off the floor | nothing *new* appears on screen mid-utterance except a child-requested aid; reveals wait for the TRP (attention budget 1, `w2e-kernel-live` [T]) | divided attention during a child's explanation [E]; Bavelas co-narration |
| nod / visual backchannel | yes | §7.4 timing; never during a number or choice answer | Park 2017; world-best S4 [T] |
| audio continuer ("mm") | rarely | §7.4: non-lexical, in a ≥ 400 ms pause after ≥ 4 s of explanation, ≤ 1 per 12 s, never after a detected wrong step | IndicFDB Hindi human 0.079/s [T]; Bali *haan* contours [T]; verdict-leak hazard [E] |
| supply a cue in a word search | yes, at the pause | "woh… kya kehte hain…" + ≥ 1.5 s of silence: offer a cue (first sound, a picture, a choice), not the term, if the term is the learning target | conditional access (Schegloff 2000) [S]; assistance dilemma [S] |
| grade / correct / give the answer | **never** | at the TRP only | M-B1 21/21 hesitant first-values wrong [T]; SHANKS 24.9% false interruptions [T]; D'Mello "immediate" = next turn [V] |
| redirect an off-track monologue | yes, at a TRP | after ≥ 30 s (B3) / 20 s (B2) off-item, never mid-clause, opening with uptake of the child's own words | rapport moments (`decisions.md`, orchestration R10 B6) [T]; uptake (human-likeness §2.9) [T] |
| respond to distress | at the TRP, not over the child | SAFETY-attend; never interrupt a disclosure | NSPCC [S]; LateIntent [T] |
| stop for a child's repair or stop request | n/a (she is speaking) | §7.5 | — |

### 7.3 Rules

**P1. Never take the floor inside a child's reasoning.**
- Explanations, teach-backs, worked steps and self-repairs end only at a TRP judged by P2.
- **Reverse if:** E-C5 shows a mid-turn intervention class with a cut-off-correct rate ≤ 2% *and* better next-turn
  learning than waiting.

**P2. End of turn is a context-keyed combiner, never silence alone.**
- Candidate endpoint at 500 ms silence. Commit when P(done) ≥ the beat threshold: number 0.3, default 0.55, probe
  0.75, explanation 0.8 (the shipped schedule).
- P(done) comes from:
  1. the audio turn model, once validated on our children;
  2. the cross-script lexical layer (`turnPolicy.ts`);
  3. the item context (answer form, value heard yet, cognitive level);
  4. the child's session pause baseline.
- Fillers, trailing connectives, word-search markers and an ASR comma always hold.
- **Evidence:** Brahimi 2026 [V]; Gravano & Hirschberg 2011 [V]; M-C1 [M].
- **Reverse if:** E-C1 shows the combiner's cut-off rate on real child audio is not lower than the fixed 900 ms arm
  at equal or better median gap.

**P3. Explicit hold requests are honoured, visibly.**
- *ek minute / ruko / soch raha hoon / sochne do / wait / let me think* → HOLD-requested for 8 s, with no nudge.
- Then a non-verbal check-in (the face).
- At 15 s, an offer the child can take or refuse: hint, choice, or "baad mein".
- Never a repeat of the question. Never naming the silence.
- **Evidence:** M-C1 0/9 → 9/9 [M]; the wait-time literature (§3.1).
- **Reverse if:** children use it to stall (E-C2: > 30% of hold requests end in no attempt and the child reports
  feeling watched); then shorten to 5 s.

**P4. Wait time I is keyed to the question, not just the band.**

| question type | before the first non-verbal nudge | before the first verbal re-entry (narrows: PROBE → CHOICE) |
|---|---|---|
| recall / single value / choice | B2 4 s, B3 3 s | +3 s |
| reasoning / why / explain / predict | B2 7 s, B3 6 s | +4 s |
| after a hold request | 8 s (P3) | 15 s, as an offer |

- Answers in the child's weaker language (often English for Hindi-medium children) get ×1.3.
- Today's `waitNudgeSec` (B2 5, B3 4 for every item) becomes a per-item value from the Director.
- **Evidence:** Tobin 3 s threshold [V]; forensic 4.8 s mean, 46% > 5 s [V]; "WT1 did not differ by question level"
  [V]; the L2 wait gap [S].
- **Reverse if:** E-C4 shows no difference in answer length or attempt rate between the per-type ladder and the flat
  band value (n ≥ 30 per band).

**P5. Wait time II is the hold window, and it applies only where more can come.**
- After a *complete closed answer*, respond fast:
  - visible receipt ≤ 150 ms (L0);
  - first audible sound target ≤ 1.2 s after the child's last word [E], hard ceiling the TEACHER-BRAIN target
    p50 ≤ 1.6 s;
  - verdict-neutral delivery until the verdict line.
- After a *partial* explanation (value-final or short in an explanation beat), hold 1.5 s visibly. That is the
  measured +80 ms mean cost in M-C1 v2 (upper bound).
- **Evidence:** Kendrick & Torreira 700 ms [S]; Rowe / Tobin WT2 [S/V]; M-C1 [M].
- **Reverse if:** E-C4 shows the explanation-beat hold does not raise words per explanation or "because" clauses.

**P6. Backchannels: the body first, sparse non-lexical sound second, never a verdict.**
- **Visual.** Nods at low-pitch / pause regions during the child's long turns; at most 1 per 3 s (world-best S4).
- **Audio** "mm" only when all of these hold:
  - the child has been explaining ≥ 4 s;
  - a ≥ 400 ms pause with falling pitch;
  - ≤ 1 per 12 s;
  - not in a number or choice answer;
  - not within 2 s of a detected wrong value.
- Never *haan / achha / sahi / bilkul* as a continuer during content: these read as verdicts.
- Echo safety: the clip is shaped like Meera's `shapeAck` and costs about +171 ms if uplinked [T, HUMAN-VOICE].
- **Evidence:** Ward & Tsukahara 48% / 18% [V via Gravano]; IndicFDB Hindi rate [T]; Bavelas [S]; Park 2017 [T];
  Bali [T].
- **Reverse if:** E-C3's blind verdict-leak test shows listeners cannot tell right from wrong steps by the "mm"
  timing (≤ 55%), *and* children's explanations lengthen; then the audio rate may rise to the human 1/13 s.

**P7. Overlap while she speaks is classified, not binary.**
- **Continuer** → resume.
- **Repair request** ("kya?", "haan?" with "?", "phir se") → stop, then repeat **shorter and slower** from the last
  clause the playback position says was heard.
- **Stop request** → stop.
- **Yes/no answer**, when her last line was a yes/no check (needs an `askedYesNo` / `expect` field) → stop and take it
  as the answer.
- **"nahi"** → stop.
- **Content** → stop and take the turn.
- Report *how much she was heard*, not just `teacher_interrupted` (Study B §5.8).
- **Evidence:** M-C1 B 11/16 → 16/16 [M]; Bali 2009 [T]; Schegloff 2000 [S].
- **Reverse if:** device logs show children's real answers resumed-over as continuers in > 2% of overlaps (the
  existing `cascade-barge-pause-decide` reversal bar).

**P8. Commits are revocable until her voice starts.**
- If the child resumes before the teacher's first audio frame, the commit is cancelled, the fragments merge, and the
  reply is re-planned. Speculation makes this cheap.
- In number answers the window is ≥ 1.5 s after the value. This is what catches "तीन बटा आठ… नहीं नहीं".
- **Evidence:** M-C1 P number 43% residual [M]; M-B1 [T]; Endpoint Anticipation / PredGen [T, Study B §5.3].
- **Reverse if:** revocation churn costs > 300 ms p90 on first audio (E-C1 timing log).

**P9. A misconception heard mid-explanation is answered at the TRP, with the child's own words.**
- The teacher lets the explanation finish, then opens with uptake ("तो तुमने कहा नीचे वाला बड़ा है…") and a focusing
  question before any correction.
- Feedback is immediate *at the turn boundary* for low-achieving children (Shute) and leaves one chance for
  self-repair (Mathan & Koedinger) before the re-teach.
- Exception: reading aloud against a known text (Amira-style), which is not in Taxila's scope today.
- **Evidence:** §3.2-3.3.
- **Reverse if:** E-C5 finds that interrupting a confirmed misconception at the first mid-turn pause beats
  end-of-turn feedback on delayed post-test, with no confidence cost.

**P10. Safety pauses the floor machinery, not the listening.**
- The safety predicate runs on partials.
- On a hit: timers freeze, there are no backchannel sounds, and the teacher does not interrupt.
- The safeguarding reply comes at the TRP (care + 1098 / 14416).
- If the child falls silent after a disclosure, one gentle presence line after ≥ 6 s, never a question that leads.
- **Evidence:** NSPCC [S]; LateIntent [T]; `safety-predicate-first` [T].
- **Reverse if:** never as a direction; the numbers belong to the safeguarding protocol owner.

**P11. A code switch is not a TRP.**
- A switch between Hindi and English mid-utterance, or an English technical term followed by a pause, is planning.
- The lexical layer treats *matlab / yaani* glosses as hold.
- Answers given in the child's weaker language get the ×1.3 window (P4).
- **Evidence:** the L2 wait literature [S]; indian-teacher-discourse §2.1 [T].
- **Reverse if:** E-C1 shows no difference in mid-turn pause length around switch points.

**P12. Adapt to the child, never below the band floor early.**
- The child's own pause distribution (session baseline, `voice-features-longitudinal`) shifts the thresholds after
  session 3.
- Hold windows never shorten below the band defaults in the first three sessions, or while strain is suspected.
- Training data for the audio model comes from label-free Next-Turn targets on consented E1 audio (world-best S2).
- **Reverse if:** per-child adaptation does not lower cut-offs on held-out children (split by child).

**P13. The teacher's own speech gives children clean projection cues.**
- Her questions end with a clear yield: a final rise or a tag, then the hand-over.
- Her mid-turn pauses do not fall right after a clause-final verb. In Hindi that is a completion cue, and children
  will take it as their turn.
- No trailing "toh…" at the end of her turn.
- Gravano's finding cuts both ways: more yield cues, more turn-taking. The child should never have to guess whether
  she is done.
- **Evidence:** Gravano & Hirschberg [V]; §5 point 3.
- **Reverse if:** E-C6 at-the-ear runs show no change in child start latency or child-teacher overlaps.

**P14. The teacher never self-starts out of silence except from a code timer.**
- This is Study B's rule, restated because wait time makes long silences legitimate.
- Silence is the child's, and only P4's ladder ends it.

### 7.4 Backchannel timing rule (first version, rule-based, no model)

- **Opportunity:** child speech ≥ 1.5 s, then a 200-500 ms dip with falling energy and pitch in the lowest third of
  the child's session range (a Ward & Tsukahara low-pitch region).
- **Visual nod:** at most 1 per 3 s.
- **Audio "mm":** P6's extra conditions, at most 1 per 12 s.
- **Suppressed** during number / choice answers, SAFETY-attend, the first 2 s after a detected wrong value, and
  whenever the echo canceller is unconfirmed (local pausing switched off, `cascadeLink.ts`).
- **Audit:** nods landing mid-word < 10% (world-best S4); verdict-leak ≤ 55% (E-C3).

### 7.5 Numbers in one place (starting values, all [E])

| knob | value | where it would live |
|---|---|---|
| candidate endpoint silence | 500 ms | `PREDICTIVE_SILENCE_MS` (exists) |
| commit thresholds | number 0.3 / default 0.55 / probe 0.75 / explanation 0.8 | `endThreshold` (exists) |
| hold window | number with no value yet 700 ms; default 800; probe 1,200; explanation 1,500; hold request 8,000 | `policyHoldMs` (candidate) |
| revocable commit window | until first audio; ≥ 1.5 s after a value in number answers | runtime / link (plan §8) |
| WT1 nudge | §7.3 P4 table | Director per item (plan §8) |
| first audible sound after a complete closed answer | ≤ 1.2 s target, p50 ≤ 1.6 s gate | TEACHER-BRAIN §5.4 |
| visual nod rate | ≤ 1 per 3 s | avatar |
| audio continuer rate | ≤ 1 per 12 s, non-lexical only | expressive splice |
| off-track redirect | ≥ 30 s (B3) / 20 s (B2), at a TRP, with uptake | Director |

---

## 8. Integration plan (Wave 2 is being built elsewhere: no edits here to `server/routes/lesson.js`, `server/brain/**`, `src/child/lesson/**`)

1. **Lexical layer (client)**, owner of `src/lesson/turnModel.ts`.
   - Behind a flag `turn.policy=c`, make `FragmentMerger` use `policyDecide` from `src/duplex/turnPolicy.ts` instead
     of `textCompleteness/endThreshold/holdMsFor`. The interface is the same apart from `holdMs` coming back with the
     decision.
   - Keep `turn.predictive` as the parent flag.
   - Gate: re-run `node evals/duplex/turn-markers.mjs`, and the M-C1 tables must not regress.
2. **Hold-request state (client)**, `src/lesson/floor.ts`.
   - Add a `holding` sub-state (LISTENING-paused) and a `hold_requested` sub-state with the "take your time" chip.
   - While either is set, the YOUR TURN nudge timer (`runtime.ts` pace) is suspended.
   - `FragmentMerger` reports the cue (`hold_request`, `filler`, …) so the floor can choose the state.
3. **Overlap classifier (client)**, `src/lesson/cascadeLink.ts`.
   - Replace `isBackchannel` in `verdict()` with `overlapKind(text, {askedYesNo})`. A *repair* resumes from the last
     heard clause, slower; this needs the playback position the link already tracks.
   - `askedYesNo` needs a contract field. Proposed: `ui.expect: "yesno" | "number" | "choice" | "open"` on
     `TurnResponse`, set by the Director from the move. This is a `shared/contracts.ts` change, to be agreed with the
     W2 owners.
4. **Revocable commit (client + Brain seam)**, `cascadeLink.ts`.
   - If `onSpeechStart` arrives after a commit and before the first reply audio frame, cancel the in-flight reply
     (the same code path as push-to-talk stop, minus `teacher_interrupted`), merge the fragments, and re-send.
   - The server needs an idempotent "superseded turn" marker so the first row is not graded. **This is a W2-E/Brain
     change; write it as a seam request, not a patch.**
5. **Wait-time ladder (server)**, owners of `server/persona/adapter.js` and the Director.
   - `waitNudgeSec` becomes per item: question type × band × answer language (P4 table).
   - Today it is band-only (B2 5 / B3 4).
6. **Backchannel opportunities (client)**, `src/lesson/vad.ts` (`bcOpportunity` event, world-best S4) plus a pitch
   estimate from `src/voice/featureWorklet.ts`. The avatar nod lives in W2-D's face producer.
7. **Safety on partials (server)**, wherever the transcription stream lands on the server (Study B §8). The
   SAFETY-attend floor state is client-side.

Nothing in 1-7 adds a model call to the turn's critical path.

---

## 9. Experiments (pre-registered shape; none run yet except M-C1)

| id | question | design | primary metric | pass bar |
|---|---|---|---|---|
| **E-C1** | does the context-keyed combiner beat fixed silence on *real* Indian children? | consented E1 recordings, classes 4-7, ≥ 40 children, label every ≥ 250 ms silence HOLD/SHIFT (IWSDS protocol); replay four arms: 900 ms fixed, shipped predictive, candidate lexical, candidate + audio model | cut-off rate (child resumes within 2 s of a teacher onset) and median gap, per band × item type | cut-offs below the 900 ms arm, gap ≥ 300 ms better on complete answers |
| **E-C2** | are hold requests used, and do they help? | log every `hold_request` cue; attempt rate after the hold vs matched no-hold pauses | attempt within 15 s | ≥ 70% attempt; "felt rushed" ratings lower than the control |
| **E-C3** | do backchannels lengthen explanations without leaking verdicts? | within-child A/B on explain items: visual only, visual + "mm", none | words per explanation; share with a because / क्योंकि clause; blind verdict-leak test on clips | +15% words; leak ≤ 55% |
| **E-C4** | does a per-question wait ladder beat a flat band wait? | randomise item-level `waitNudgeSec` arms (MRT, already the house design) | answer length, attempt rate, nudge-to-attempt latency | +1 SD answer length on reasoning items, no rise in strain flags |
| **E-C5** | how much does premature interruption cost a child? | simulated-interruption arm in a consented study: a teacher onset at a mid-turn pause on 5% of explanation turns vs none | the child's next-turn length and attempt rate; self-reported confidence (B3 only); delayed post-test | measures the harm; sets P1's reversal bar |
| **E-C6** | at-the-ear timing from India | a turnprobe-style harness with child voices and Hindi markers (Study A §6.4) | barge-in to silence, response to backchannel, speaking into mid-sentence pauses | GPT-Live's 54/117 is the floor to beat by a wide margin |

---

## 10. Proposed `context/` entries (for the main loop to merge; this study writes only under the duplex paths)

**Measurement.**
- `m-c1-turn-markers-2026-10-04`: method §6; shipped vs candidate v1 (held-out) vs v2 (in-sample).
  - Filler-only fragments sent: number 100% → 0.4%; default 40.4% → 0.4% (n=255, 18 held-out STT configs).
  - Hold markers honoured (default): 6/28 → 28/28.
  - Overlap correct: 11/16 → 16/16.
  - Explanation-beat premature send: 16.4% → 11.5%, at +80 ms mean extra hold (upper bound; v2 is in-sample).
  - Synthetic clips, text only.

**Measurement (derived).**
- `ocsc-hold-share-by-age`: from Brahimi 2026 Table 1, child-initiated silences ≥ 250 ms that end in HOLD: 4 y 58%,
  5 y 69%, 6 y 74%, 7 y 81%, 8 y 81%, 9 y 85% (n = 49,336 events; English, US, museum-lab protocol).

**Rejections (by evidence, not trial).**
- `rj-filler-latin-only`: an end-of-turn lexicon in one script. Broke: production STT writes Hindi fillers in 14
  spellings across Devanagari, Latin and Arabic script, so 40.4% of filler-only fragments were committed as whole
  turns (M-C1). Instead: shape-matched cross-script lexicon tested against real transcripts.
- `rj-zero-hold-number-answers`: `holdMsFor` = 0 for number answers. Broke: 100% of filler-first fragments and of
  mid-utterance breaks are committed at the 500 ms candidate endpoint, though hesitation precedes values (M-B1 21/21).
  Instead: hold 700 ms until a value is heard, plus a revocable commit (P8).
- `rj-lexical-haan-continuer`: an audible *haan / achha* continuer from the teacher during content. Broke (by
  evidence): a Hindi "yes" and a continuer are one word, so it leaks a verdict on wrong steps (Bali 2009). Instead:
  visual nods, non-lexical "mm" only.
- `rj-flat-wait-time`: one nudge time for every question in a band. Broke (by evidence): Shiau 2024 shows that is the
  human teacher's known failure (WT1 does not grow with question level), and benefits need ≥ 3 s on higher-order
  items. Instead: the P4 ladder.

**Decisions (proposed).**
- `floor-never-grades-mid-turn`: grading and correction happen only at a TRP; mid-turn action is limited to the §7.2
  list. Reverse if E-C5 finds a mid-turn class with ≤ 2% cut-off-correct and better learning.
- `floor-hold-request-honoured`: explicit hold requests give an 8 s visible hold with no nudge. Reverse per P3.
- `floor-overlap-classified`: overlap kinds are continuer, answer, repair, stop and turn, with `askedYesNo` from
  `ui.expect`. Reverse per P7.
- `floor-revocable-commit`: a committed turn is cancelled and merged if the child resumes before first audio.
  Reverse per P8.

---

## 11. Open questions

1. Hindi/Hinglish *child* pause and gap distributions (8-13 y): none published. E1 must produce them, by band, item
   type and answer language.
2. Does a 9-12-year-old Indian child read a 1.5-2 s machine gap after a *correct* answer as "wrong"? The 700 ms
   evidence is adult and Western [S]; children's thresholds are unmeasured.
3. Do Indian classroom norms change the picture? Children are often trained to wait to be called on, which may
   lengthen WT1 behaviour and reduce self-selection. No Indian wait-time study was found.
4. The audio turn model: retrain VAP (best child evidence, academic weights) vs fine-tune Smart Turn (BSD-2,
   Hindi-trained, but Voice-Light's warning)? Decide on E-C1 data, not on vendor tables.
5. Can the text layer see prosody at all? Only through the ASR's "?" and ",", which are noisy (115/1,417 held-out
   prefixes ended in "?"). The *haan?* repair case needs pitch, from `featureWorklet.ts`.
6. Collaborative completion: when the child is searching for a word that *is* the learning target, how long before a
   cue? §7.2 says 1.5 s [E]. The learning cost of supplying the term vs a cue is unmeasured here.

---

## 12. Sources (accessed 2026-10-04)

**Primary, fetched (full text unless marked).**
- Brahimi, Blanc & Fourtassi 2026. *Predicting Turn-Taking in Child-Adult Conversations Using Voice Activity
  Projection.* IWSDS 2026, pp. 338-347. https://aclanthology.org/2026.iwsds-1.34.pdf
- Jabeen et al. 2022. *Hesitations in Urdu/Hindi: Distribution and Properties of Fillers and Silences.* Interspeech
  2022. https://www.isca-archive.org/interspeech_2022/jabeen22_interspeech.pdf
- Bona 2023. *Filled pauses in child-adult conversations: Data from 5- and 9-year-old Hungarian children.* DiSS 2023.
  https://www.isca-archive.org/diss_2023/bona23_diss.pdf
- Gravano & Hirschberg 2011. *Turn-taking cues in task-oriented dialogue.* Computer Speech & Language. Includes Ward &
  Tsukahara 2000 figures. https://www.utdt.edu/ia/integrantes/agravano/files/gravano_hirschberg_2011.pdf
- D'Mello, Lehman & Person 2010. *Expert Tutors' Feedback Is Immediate, Direct, and Discriminating.* FLAIRS-23.
  https://cdn.aaai.org/ocs/1215/1215-7820-1-PB.pdf
- Shiau, McWilliams & Williams 2024. *The Role of Wait Time During the Questioning of Children: A Systematic Review.*
  Trauma, Violence, & Abuse. https://pmc.ncbi.nlm.nih.gov/articles/PMC11545128/
- Levinson & Torreira 2015. *Timing in turn-taking and its implications for processing models of language.* Frontiers
  in Psychology. https://pmc.ncbi.nlm.nih.gov/articles/PMC4464110/
- *A Comparative Analysis of Pausing in Child and Adult Storytelling* (5-year-olds and parents).
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3681305/
- Stivers et al. 2009. *Universals and cultural variation in turn-taking in conversation.* PNAS 106(26) (abstract).
  https://pmc.ncbi.nlm.nih.gov/articles/PMC2705608/
- Ekstedt & Skantze 2022. *Voice Activity Projection: Self-supervised Learning of Turn-taking Events.* Interspeech
  (abstract). https://www.isca-archive.org/interspeech_2022/ekstedt22_interspeech.html
- Ekstedt & Skantze 2020. *TurnGPT.* Findings of EMNLP (abstract). https://aclanthology.org/2020.findings-emnlp.268/
- Arora et al. 2025. *Talking Turns: Benchmarking Audio Foundation Models on Turn-Taking Dynamics.* ICLR (abstract).
  https://arxiv.org/abs/2503.01174
- Li & Shi 2026. *The Trade-off Was in the Labels: Causal Supervision for Turn-Aware Streaming ASR* (abstract).
  https://arxiv.org/abs/2609.04225
- Human-1 by Josh Talks 2026 (abstract). https://arxiv.org/abs/2604.23295
- Rao et al. 2018. *Lexical and Prosodic Cues to Segmentation in a Hindi-English Code-switched Discourse.* Interspeech
  (abstract). https://www.isca-archive.org/interspeech_2018/rao18_interspeech.html
- MaAI README. https://github.com/MaAI-Kyoto/MaAI

**Secondary (search snippets, reviews, practitioner pages).**
- Tobin 1987, Review of Educational Research 57(1): 69-95 (ERIC abstract). https://eric.ed.gov/?id=EJ371356
- Rowe 1986, Journal of Teacher Education 37(1): 43-50.
  https://www.semanticscholar.org/paper/Wait-Time:-Slowing-Down-May-Be-A-Way-of-Speeding-Rowe/fe469ce77ef5dd3b09a6ad97bee25a741df4af74
- Kendrick & Torreira 2015, Discourse Processes 52: 255-289.
  https://eprints.whiterose.ac.uk/id/eprint/116177/1/Kendrick_and_Torreira_2015_.pdf
- Roberts, Francis & Morgan 2006 (via Roberts & Francis 2013, JASA).
  https://web.ics.purdue.edu/~froberts/Threshold%202013%20JASA%20Roberts%20&%20Francis.pdf
- Schegloff, Jefferson & Sacks 1977, Language 53(2).
  https://www.conversationanalysis.org/wp-content/uploads/2019/06/11_Schegloff_et_al_The_Preference_For_Self-Correction_in_the_Organization_of_Repair_in_Conversation.pdf
- Schegloff 2000, Language in Society 29(1): 1-63.
  https://www.researchgate.net/publication/259362815_Overlapping_talk_and_the_organization_of_turn-taking_for_conversation
- Heldner & Edlund 2010, Journal of Phonetics. https://www.diva-portal.org/smash/get/diva2:388247/FULLTEXT01.pdf
- Casillas, Bobb & Clark 2016, Journal of Child Language 43(6).
  https://chatterlab.uchicago.edu/lab-publications/Casillas_et_al_2016_Turn_taking_timing_and_planning_in_early_language_acquisition_JCL.pdf
- Casillas & Frank 2017, Journal of Memory and Language 92.
  https://www.sciencedirect.com/science/article/abs/pii/S0749596X16300596
- Agrawal et al. 2023, CogSci (ChiCa). https://afourtassi.github.io/assets/files/cv.pdf
- Bavelas, Coates & Johnson 2000, JPSP. https://www.semanticscholar.org/paper/Listeners-as-co-narrators.-Bavelas-Coates/0fabf5ebff05a958bdf720eddd1a950335e08a67
- Shute 2008, Review of Educational Research 78(1). https://journals.sagepub.com/doi/10.3102/0034654307313795
- Mathan & Koedinger 2005, Educational Psychologist 40.
  https://www.researchgate.net/publication/240802765_Fostering_the_Intelligent_Novice_Learning_From_Errors_With_Metacognitive_Tutoring
- Koedinger & Aleven 2007, Educational Psychology Review 19.
  https://www.researchgate.net/publication/226963584_Exploring_the_Assistance_Dilemma_in_Experiments_with_Cognitive_Tutors
- Chi et al. 1994, Cognitive Science 18(3). https://asu.elsevierpure.com/en/publications/eliciting-self-explanations-improves-understanding
- Wood 1998 (funnelling vs focusing). https://sites.msudenver.edu/bevans21/wp-content/uploads/sites/359/2018/02/QuestioningPatterns.pdf
- Kraft & Monti, *The Big Problem With Little Interruptions to Classroom Learning.* https://files.eric.ed.gov/fulltext/EJ1323989.pdf
- Interruptions and children's disfluency (stuttering literature). https://pubmed.ncbi.nlm.nih.gov/4046583/ ;
  https://link.springer.com/article/10.1023/A:1009465828258
- L2 wait time (secondary summaries). https://www.structural-learning.com/post/wait-time-a-teachers-guide ;
  https://files.eric.ed.gov/fulltext/EJ1219427.pdf
- Inoue et al. 2026, *Multilingual and Continuous Backchannel Prediction*, IWSDS. https://aclanthology.org/2026.iwsds-1.23.pdf
- Smart Turn v3 Hindi accuracy (Daily blog). https://www.daily.co/blog/announcing-smart-turn-v3-with-cpu-inference-in-just-12ms/
- NSPCC, *Let children know you're listening.* https://learning.nspcc.org.uk/research-resources/2019/let-children-know-you-re-listening

**In-repo [T].**
- `docs/research/duplex/PRODUCTS.md`, `MODELS-PAPERS.md`
- `docs/research/world-best/voice-ux-smoothness.md`
- `docs/research/voice/human-likeness.md`, `indian-teacher-discourse.md`
- `docs/design/superhuman/TEACHER-BRAIN.md` §5.4
- `docs/ops/MODEL-STACK.md` §2.3
- `context/decisions.md`: `voice-turn-config`, `cascade-barge-pause-decide`, `safety-predicate-first`,
  `w2e-kernel-live`
- `src/lesson/turnModel.ts`, `src/lesson/cascadeLink.ts`, `server/voice/stt.js`, `server/persona/adapter.js`
