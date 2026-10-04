# TALKING-RULES: making the teacher sound talked, not read (v4, 2026-10-04)

Inputs:
- round 2 (`../v3/blind/RESULTS-R2.md`): DragonHD Diya is best at 2.6/5, and every arm's top failure is "reading, not
  talking";
- round 1 (`../../../design/superhuman/voice-clips/results/BLIND-RESULTS-2026-10-04.md`): spliced clips are rejected,
  and numbers must be spoken words;
- `HUMAN-VOICE.md`, `../v2/VOICE-CHOICE.md`, `context/rejected.md`;
- the code that writes and speaks her lines: `server/compiler/*`, `server/director/{shapes,say}.js`,
  `server/brain/say.js`, `server/voice/expressive/*`.

This document does three things:
1. It turns the round-2 rater notes into writing rules for each situation. They are shapes, not lines.
2. It defines a per-clause delivery plan. Each field was checked against what DragonHD actually does, with new tiny
   renders made for this document.
3. It rewrites the five round-1/2 lines in spoken register, two variants each, with a plan for each.

The proposed code changes are in `talking-rules.patch`. Nothing under `server/` or `src/` was edited.

Evidence tags:
- **[M]** measured here (probe files in `probe/`);
- **[M-prior]** measured earlier in this repo;
- **[L]** literature;
- **[E]** estimate or reasoning, not measured.

---

## 0. Verdict

1. **The text is half the problem, and we can fix it in code.**
   - Round 2's "reading" is what written-register sentences sound like when spoken fluently: long clauses, no uptake
     of the child's words, the reaction only in the first word, and every sentence end said the same way.
   - The fix is writing in spoken chunks:
     - start from the child's words;
     - put the key word last in its chunk;
     - keep the feeling going to the end of the line;
     - give each situation its own shape (§1).
2. **DragonHD gives us fewer controls than the plan has fields.** The v4 capability probe (§5.1) tested 30 SSML
   variants, n = 3-4 takes each, at clause level. Only four controls are honoured:
   - `<break>`, with a floor of about 300 ms;
   - `<prosody rate>` for **slowing down only**;
   - `<prosody pitch>` for **lowering only, from -8%**;
   - punctuation for the final tune (a "?" rises).

   These had **no measurable effect**:
   - speed-up;
   - pitch-up;
   - `contour`;
   - `<emphasis>`;
   - `express-as`;
   - `mstts:silence`;
   - `temperature`;
   - the bracket style markers.

   So on Diya, emphasis, brisk pace and laughter have to be **written into the words**. They cannot be marked up.
3. **Silence is DragonHD's biggest tell, and it is fixable.**
   - A sentence end with no `<break>` gets about 70 ms of silence [M].
   - Plain renders of the five lines had 0-3 pauses of 200 ms or more per line.
   - With the plan, the renders average 4.3 pauses per line (SD 170 ms, so the pauses vary in length). This matches
     the "pauses in the right places" that the friend praised on Diya's think-aloud card.
4. **Three pipeline defects** would undo the rewrite in production. None were known before this run:
   - **(a) The script defect.** The Hinglish lane writes Roman script (`compile.js` LANGUAGE, `brain/say.js`
     SCRIPT_OK). On Diya, Roman Hinglish turns पैंतीस into "पेंटीज" in 4/4 renders, and तीस into "टीज" with the
     hi-IN wrap [M].
   - **(b) The question defect.** The one-question guards (`lastQuestionOnly`, `endOnAsk`) delete every non-final
     "?" sentence. That removes the echo ("Cold drink?", "पहली बार में ही?") that carries the reaction. The patch
     fixes this.
   - **(c) The silence-budget defect.** With the plan, silence comes to 1.4-3.2 s per line. The governor allows at
     most 1.5 s.
5. **Nova 2 Sonic kiara stays a challenger only.**
   - With the compiled plan it read 10/10 lines verbatim (its own transcript), and ASR heard every number word.
   - Its pause variety is similar to Diya's (4.5 pauses per line, SD 184 ms).
   - In round 2 it lost on accent switching, and nothing here changes that. An ear test decides.

---

## 1. Writing rules: talked, not read

### 1.1 What the evidence says makes speech sound spontaneous

**Listeners hear the style mostly in prosody, not in the words** [L]:
- Laan 1997 (Speech Communication 22:43-65) swapped intonation, durations and spectra between read and spontaneous
  versions of the same utterances. All three carry the style, and intonation and timing carry most of it.
- Our objective version of this: plain DragonHD pauses are nearly uniform (SD 0.06 s) [M-prior]. With no `<break>`,
  a sentence end gets about 70 ms [M]. Real talk has pauses of different lengths at clause boundaries, and none
  mid-phrase. Round 1's raters penalised "pauses placed on random words".

**Spoken language comes in short intonation units** [L]:
- Chafe's idea units are about one idea per unit, joined with "and/then".
- Across 48 languages, intonation units arrive about every 1.6 s (PNAS 2025, "A universal of speech timing").
- Written register packs several ideas into one long sentence. Read aloud, that is the "just read the statement"
  defect.
- Rule: **one idea per chunk, about 2-7 words, chunks joined by commas or plain connectors**
  (फिर, तो, और, पर, मतलब, यानी).

**Discourse markers and fillers signal spontaneity** [L]:
- Székely et al. (Interspeech 2019, "Spontaneous conversational speech synthesis from found data"): filled pauses
  raised perceived authenticity and spontaneity.
- Kirkland et al. (Interspeech 2022): fillers mid-utterance with high pitch and slow rate sound unconfident.
  Utterances with no filler, lower pitch and a faster rate sound confident.
- Two consequences for us:
  - Markers go at the **start** of a turn as uptake (अच्छा, अरे, चलो, देखो). Mid-turn hesitation is only for think-aloud.
  - Corrections must not sound uncertain: lower pitch, no medial filler.
- On Diya, lexical markers render reliably: अच्छा and अरे were heard 3/3. The non-lexical हम्म was heard **1/3**
  (the voice swallows it) [M]. Use lexical markers on Diya.

**Hindi marks focus mainly by phrasing, not by loudness on a word** [L]:
- Patil, Kentner, Gollrad, Kügler, Féry & Vasishth 2008 (JSAL 1:1) describe Hindi declaratives as a chain of rising
  (LH) accentual phrases, one on each content word, with a fall on the final verb.
- Focus shows mostly as **post-focal compression**, not as extra prominence on the focused word.
- So "stress the new word" in Hindi means three things:
  - **put the new word where the phrase peaks**, which is the end of its chunk, often just before the verb;
  - **start a new phrase for it** (a pause before it resets the pitch: `micro_300` raised the clause's f0 by
    +1.2 st [M]);
  - **keep what follows short and low**.
- This is the reason for the "key word last in its chunk" rule, and for the absence of any `<emphasis>` tag.

**Hindi-English code-switch prosody** [L]:
- Rao et al. (Interspeech 2018), on a Hindi-English code-switched discourse corpus: the embedded English is spoken
  more slowly, with more vocal effort and more pitch variation.
- Our raters called a strong version of this "dual accent / accent switch".
- Rules:
  - English islands should be **single everyday nouns or verbs inside a Hindi frame** (tens, divide, pizza, burp),
    never an English clause;
  - never an English word as the **sole** content of a chunk, except an echo of the child's own words ("Cold drink?");
  - one accent: the hi-IN front end for the whole clause is a round-3 arm (§5.3).

**Laughter in the voice** [L]:
- Smiled speech is heard mainly through raised f0 and raised F2 (Tartter 1980; Lasarcyk & Trouvain; Drahota et al.
  2008 disagree on f0).
- Speech-laughs (laughter overlaid on words; Trouvain 2001) differ from laughter spliced in as a separate sound.
- Round 1 rejected splicing outright. DragonHD speaks the paralinguistic tags as words (12/12) [M-prior].
- On Diya, pitch-up is not honoured [M], so a smile cannot be marked up.
- Playfulness on Diya therefore has to be **in the text**:
  - an echo of the joke with a rising tune;
  - one beat of playing along (push the picture one step further);
  - then the fact, still warm.
- A real laugh only where an engine produces one natively, in context (Nova is untested here for laughter; ear check).

**Self-repair** [L]:
- Levelt 1983: repairs are interrupt-then-restart, usually right after the trouble spot, often with a marker
  ("नहीं नहीं").
- A rare, think-aloud-only self-repair is one of the strongest cues of thinking rather than reciting.
- The governor already caps it at one per 10 minutes.

**Pace changes with intent** [L]/[E]:
- Speakers slow down for new or important content and for care, and speed up for asides, known material and play.
- On Diya only slowing is controllable [M]. Quickness comes from short chunks with no break, and from the
  surrounding slow clauses making them sound faster.

### 1.2 Rules for every turn (shapes for the voice lane, never lines)

| # | Rule | Why |
|---|---|---|
| T1 | Short spoken chunks of about 2-7 words, one idea each, joined by commas or a connector. No subordinate clause stacks. | Intonation units (Chafe; PNAS 2025) |
| T2 | Start from their words: echo the child's word or claim, or a turn-initial uptake marker. At most one marker per turn. Rotate markers (governor: the same one never within 6 turns). | Uptake is what "talking to me" means. Fillers help spontaneity (Székely 2019); a fixed list becomes a tic (`rj-static-filler-list`) |
| T3 | The new or key word goes last in its chunk. A big reveal can be its own chunk. | Hindi focus by phrasing (Patil et al. 2008); DragonHD has no `<emphasis>` [M] |
| T4 | The feeling stays to the end of the turn. The last chunk carries the situation's feeling, not neutral. | Round-2 note: "context showed only at the start, not sustained" |
| T5 | At most one rhetorical or echo "?" per turn, at the start. The turn ends on its one real question or try-this. | Rising tune works on Diya [M]; the patch exempts only that echo from the one-question guard |
| T6 | Numbers as Hindi words. English only as single everyday terms inside a Hindi frame. No "…", no digits, no brackets. | Round 1 numbers; accent-switch defect; `voice-prompt-labels-and-brackets` |
| T7 | No praise words after a not_yet (G-PRAISE-1). A disbelief echo after a right answer is fine. | `server/director/say.js` |
| T8 | No comparison with other children (Arjun's sheet; the floor's comparison clause). | Persona and floor |

### 1.3 Per-situation shapes

These are notes. The rewrites in §3 show them in action and are test stimuli, never prompt text.

**Think-aloud (working a sum with the child)**
- Echo the problem.
- One inclusive invitation (हम, चलो, साथ में).
- Name each step briefly (पहले tens, फिर …), then work it out slower.
- A short landing on each partial result.
- A beat before the final result, which arrives quicker and pleased.
- Optional once in 10 minutes: one self-repair at a step boundary.
- Never "total" read out like a list.
- Delivery:
  - slow (-10 below base) on the working;
  - base pace on the meta chunk;
  - a 300-500 ms pause after each partial result;
  - the reveal at base pace with no pause before its word.

**Laughing at the child's joke**
- Echo their joke word with a rising tune.
- Play along for one beat (push the picture further: what would follow if it were true).
- A clear beat.
- A soft pivot word (पर, सच में तो).
- The fact in two short chunks, key words last (पानी, जड़ों), still smiling, not switched to lecture.
- No mockery, never about the child, none while they struggle (persona notes).
- Delivery:
  - the play at base pace with only short pauses;
  - about 600 ms of silence before the pivot (the "turn");
  - the fact at normal pace, not slowed;
  - no pitch drop (a drop reads as scolding).

**Gentle correction of a wrong answer**
- Uptake with no verdict word (अच्छा, चलो).
- An invitation to look together.
- Restate the child's own item slowly, as a picture (parts of a pizza), the key quantity last.
- One image chunk ("almost the whole thing").
- Hand back with a look-again invitation, never "wrong".
- Curious, not disappointed.
- Delivery:
  - the whole turn slow (-10), the restatement slower (-20);
  - lower pitch (-8%) on the opening only;
  - longer sentence pauses (400-600 ms);
  - no medial filler (it would sound unsure: Kirkland 2022).

**Delighted surprise at a success**
- A one-word surprise (अरे) as its own chunk.
- A disbelief echo of what they achieved, with a rising tune.
- Then **slower**, naming exactly what they did (the method), the key word last.
- A short confirmation.
- Optional warm aside, lower.
- Specific, never about ability.
- Delivery:
  - surprise and echo at base pace, a 500 ms beat after the echo;
  - the method -10;
  - the aside -8% pitch.

**Wonder at a fact**
- Start quiet and slow, with a hook that invites (पता है, एक मज़ेदार बात).
- The fact in chunks, the surprising quantity last (एक मिनट).
- Repeat the quantity alone.
- Then pull it into now (अभी, इसी वक़्त), quicker.
- Delivery:
  - the opening two chunks -20 and -8% pitch;
  - building to base pace and pitch;
  - 400-500 ms between steps of the build.

**Greeting**
- The child's name early.
- One warm chunk about now or today.
- One easy question about them.
- No speech-like welcome paragraph.
- Delivery: base pace, one 300 ms pause before the question, a rising tune on it.

**Encouragement (effort, struggle)**
- Name the exact thing they kept doing.
- One chunk that normalises the difficulty (about the work, never about them).
- One small next step.
- Delivery: slow, lower pitch on the normalising chunk, the next step at base pace.

**Checking understanding**
- Never "samjha?" (already a floor or shape rule).
- A use-it question in one chunk, after a 300-400 ms pause, rising only if it is a yes/no question. Wh-questions in
  Hindi end falling.
- Delivery: base pace, a pause before, no filler.

---

## 2. The per-clause delivery plan and its compilers

### 2.1 Schema

Implemented as a test harness in `lines.mjs`. It maps to `DeliveryClause` in `shared/contracts.ts` as noted.

| field | values | meaning | contracts.ts today |
|---|---|---|---|
| `t` | exact words | the clause text; the aligner identity holds (concatenation = the guarded reply) | `text` |
| `role` | echo, invite, step, work, result, reveal, self_repair, play, pivot, fact, surprise, name_method, verdict, aside, uptake, image, invite_look, hook, build | what the chunk does in the moment; selects defaults and the Nova note | (new; the aligner can derive it from the move row + position) |
| `rate` | 0, -10, -20 (% vs the persona base) | slow-downs only on DragonHD | `pace` slow/normal (brisk = normal on DragonHD) |
| `pitch` | 0, -8 | lowering only, at -8% or more | row `pitch` |
| `emph` | one word in `t` | the new/important word; realised by position (T3), never by markup | `emphasis` |
| `pause` | 0 or ≥ 300 ms after | silence after the clause; 0 = runs on | `pauseBeforeMs` of the next clause |
| `style` | neutral, warm, amused, playful, surprised, delighted, calm, curious, wonder, thinking | engine style; DragonHD gets none by default (§2.2), Nova gets prose | `emotion` |
| `tune` | rise / fall / cont | derived from punctuation: ? rises, । and ! fall, a comma continues; the validator checks it agrees | (new, derived) |

**Validator** (fail closed, so a bad plan is spoken plain), as in `lines.mjs validate()`:
- no digits, "…", brackets or quotes;
- rate in {0, -10, -20};
- pitch in {0, -8};
- `emph` is in `t`;
- a pause is either 0 or ≥ 300 ms;
- **every sentence end that is not the last has a pause of at least 300 ms**;
- at most about 75% of clauses carry an `emph`.

**Silence budget.** The governor's 1.5 s of added silence per turn is too tight for think-aloud and correction turns:
- measured silence on the plan renders was 1.4-3.2 s per line, about +1.3 s over the same text with no plan;
- proposal: think-aloud ≤ 3.0 s, correction and wonder ≤ 2.5 s, others ≤ 1.8 s;
- the excess is trimmed proportionally (the governor's existing mechanism);
- this needs an ear check, because no listener has heard these yet.

### 2.2 What DragonHD honours: v4 capability probe

Probe setup:
- `en-IN-Diya:DragonHDLatestNeural` (eastus2).
- Carrier: clause A + 700 ms break + clause B. Only B is varied, and A is the within-take control.
- Metrics: B/A duration, B-A median f0 in semitones, B tail slope, B-A dB, and gaps.
- n = 3 takes (4 for the base22 cells).
- f0 is an autocorrelation tracker, octave-folded. It is coarse, so deltas under about 0.8 st are noise.
- Files: `probe/caps.mjs`, `probe/measure.py`, `probe/caps-renders.json`.

| SSML feature (on clause B) | measured | verdict |
|---|---|---|
| none (base) | B/A 0.60; B-A -0.5 st; tail slope -0.7 st; sentence end without `<break>` = ~70 ms gap | reference |
| `<prosody rate="-15%">` | B/A 0.71 (+18% duration) | **honoured** |
| `<prosody rate="-30%">` | B/A 1.02 (+70%), **plus inserted 100-290 ms gaps** inside the clause | honoured, but adds pauses; cap at base -10 |
| `<prosody rate="+12%">`, `"+25%"` | B/A 0.60, 0.63 | **not honoured** (no speed-up) |
| production base -22%, clause -14% ("brisk" = base + 8) | B/A 0.66 vs 0.57 at -22 | **not honoured** (no faster) |
| production base -22%, clause -32% | B/A 0.77 vs 0.57 (+40%) | **honoured** |
| `<prosody pitch="-8%">` | B-A -2.1 st vs -0.5 base (-1.6 st) | **honoured** |
| `<prosody pitch="-6%">` (on -22 base), `"-4%"` | +0.85 st, -0.1 st | not measurable |
| `<prosody pitch="+12%">` | -0.7 st | **not honoured** |
| `<prosody contour>` rising tail | tail slope -2.2 st | **not honoured** |
| `<prosody volume="-25%">` | -1.5 dB vs base | weak; not worth a field |
| `<emphasis level="strong">` | बारह 387 vs 333 ms (overlapping ranges); Learn lists it unsupported | **not usable** |
| `<break>` 50 / 120 / 150 (no comma) / 300 ms before the last word | gaps ≈ 320 / 310 / 350 / 530 ms | **honoured, floor ~300 ms**; effective ≈ max(300, X+200) |
| comma alone (base) | no gap ≥ 60 ms at the comma | a comma is a tune boundary, not a pause |
| "?" instead of "।" | tail slope +2.8 st vs -0.7 (2 of 3 takes strongly rising) | **honoured (text-level)** |
| `[curious]` `[excited]` `[calm]` `[amused]` markers | B-A -0.3 … +0.1 st; durations within noise; ASR: silent 9/9 (curious, amused) | silent, **no measurable effect** |
| `<mstts:express-as style="cheerful">` | -0.2 st; silent 3/3 | **no effect** (no StyleList on en-IN DragonHD) |
| `<mstts:silence type="Sentenceboundary" value="50ms"/"600ms">` | longest gap 0 / 77 ms | **ignored** |
| voice `parameters="temperature=0.3 / 1.0"` | no consistent change; at 1.0, ASR heard "बारह बारह बारह" in 1/3 | no gain; do not raise it |
| text "हम्म, अच्छा।" | हम्म heard 1/3 | unreliable on Diya |
| text "अरे! पहली बार में ही?" | heard 3/3; the clause sits high in pitch | **use (lexical)** |

Microsoft's HD-voices page lists `<prosody>` and `<emphasis>` as unsupported on DragonHD. For `rate` that is wrong:
slowing down is honoured, which confirms HUMAN-VOICE §4.2 at clause level. For `pitch` it is half wrong: lowering
works from -8%. For `<emphasis>` it is right. `rj-prosody-rate-on-dragonhd` should be narrowed (§7).

### 2.3 Compiling a plan to DragonHD SSML

This is `lines.mjs compileDragonHD`, and the patch for `server/voice/expressive/compile/dhd.js`.
- **One `<speak>`.** Devanagari runs go in `<lang xml:lang="hi-IN">`. The arm that wraps the whole clause in hi-IN
  (`langWrap:"all"`) is a round-3 candidate for "one accent".
- **Per clause:** `<prosody rate="{base+rate}%" pitch="-8%">` with only the attributes that are needed. rate ≤ base;
  pitch only when -8.
- **After each clause** except the last: `<break time="{max(50, pause-200)}ms"/>` when the pause is ≥ 250 ms,
  otherwise nothing.
- **Emphasis is never markup.** The writing rule places the word last. Optionally (`emphBreak`, off by default) a
  50 ms break goes right before the reveal word only, which resets the phrase.
- **Style is not emitted** on DragonHD by default. Markers are proven silent and harmless, but have no measurable
  effect. The existing `dhdMarker` path can stay behind its env switch, as one round-3 arm, rather than be trusted.
- **Never:** paralinguistic tags (spoken 12/12), `contour`, pitch-up, rate-up, `<emphasis>`, `mstts:silence`,
  temperature changes, digits, "…".
- **Patch to the live compiler:**
  - `PACE_DELTA.brisk` 8 → 0;
  - calm pitch -6 → -8;
  - `breakFor()` maps a planned pause to the break that produces it;
  - think-aloud `commaPause` [150-350] → 0, because a comma "pause" cannot be rendered below ~300 ms;
  - `sentencePause` minimum 300;
  - Hindi think fillers हम्म/उम्म → अच्छा/चलो.

### 2.4 Compiling a plan to Nova 2 Sonic

This is `lines.mjs compileNova`. Nova is speech-to-speech, so the plan becomes prose in the system prompt and the line
goes as the user text turn.
- **System:** the reader rule (say exactly the text) + the band (one native Indian accent; talking, never reading;
  feeling sustained to the end) + the moment (scene) + one line per clause.
- **Each clause line:**
  - the `role` gloss (e.g. "playing along with the joke, smiling, enjoying it");
  - the pace word (a little quicker / conversational / slower);
  - "lower and softer" when the pitch is -8;
  - "lean on {word}";
  - the pause word (run straight on / a short beat after / a clear pause after).
- **Never** a sound word (laugh, breath, hmm: `voice-prompt-labels-and-brackets`, `SOUND_WORDS` in
  `compile/realtime.js`), brackets or quotes.
- **Result:** 10/10 verbatim by the model's own transcript. ASR found every number word on every line.
- Nova's speed-up and pitch-up follow the prose. Whether they sound right, and whether the accent stays Indian on
  English words, is for the ear test only.

---

## 3. The five lines in spoken register (TEST STIMULI: never prompt text)

These are sentence-shaped on purpose, because they are what a listener hears. **They must never be pasted into a
prompt, persona, move shape or few-shot block** (recitation law: recited 4/5 → 0 after removal in Meera, and the
quote floor was recited 22/33 here).

Each line keeps the original's facts and numbers, with numbers as Hindi words. Plans are listed clause by clause as
`text | rate · pitch · emph · pause-after · style`. "Rate" is relative to the persona base (renders used base -10;
production Asha is -22).

**Content deltas from the originals:**
- "total" and "रुकते" are gone (both were flagged "wrong word" in round 1);
- L3B swaps "बहुत लोग गलत करते हैं" for "सच में tricky होता है", because the original compares the child with others
  (Arjun's sheet and the floor's comparison clause). L3A keeps the original fact so the owner can choose.

### L1 think-aloud: 27 + 35
Original: सत्ताईस और पैंतीस। पहले tens जोड़ते हैं, बीस और तीस, पचास। फिर सात और पाँच, बारह। तो total हुआ बासठ!

**A** (steady, inclusive): सत्ताईस और पैंतीस, चलो, साथ में करते हैं। पहले tens, बीस और तीस, पचास। फिर सात और पाँच, बारह। तो पचास और बारह, बासठ!

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| सत्ताईस और पैंतीस, | -10 | 0 | | 300 | thinking |
| चलो, साथ में करते हैं। | 0 | 0 | | 400 | warm |
| पहले tens, | -10 | 0 | tens | 0 | thinking |
| बीस और तीस, | -20 | 0 | | 300 | thinking |
| पचास। | -10 | 0 | पचास | 400 | thinking |
| फिर सात और पाँच, | -20 | 0 | | 300 | thinking |
| बारह। | -10 | 0 | बारह | 400 | thinking |
| तो पचास और बारह, | -10 | 0 | | 300 | thinking |
| बासठ! | 0 | 0 | बासठ | (end) | delighted |

**B** (one self-repair): अच्छा, सत्ताईस और पैंतीस। पहले सात और पाँच, नहीं नहीं, पहले tens करते हैं। बीस और तीस, पचास। अब सात और पाँच, बारह। पचास और बारह, मतलब, बासठ!

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| अच्छा, सत्ताईस और पैंतीस। | -10 | 0 | | 400 | thinking |
| पहले सात और पाँच, | -10 | 0 | | 0 | thinking |
| नहीं नहीं, पहले tens करते हैं। | 0 | 0 | tens | 400 | thinking |
| बीस और तीस, पचास। | -20 | 0 | पचास | 500 | thinking |
| अब सात और पाँच, बारह। | -20 | 0 | बारह | 500 | thinking |
| पचास और बारह, मतलब, | -10 | 0 | | 300 | thinking |
| बासठ! | 0 | 0 | बासठ | (end) | delighted |

### L2 laughing at "पौधे cold drink पीते हैं!"
Original: Cold drink? फिर तो सारे पौधे गमले में burp करते! नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।

**A**: Cold drink? सोचो ज़रा, फिर तो सारे पौधे गमले में burp करते! एक के बाद एक! पर नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| Cold drink? | 0 | 0 | | 300 | amused |
| सोचो ज़रा, फिर तो सारे पौधे गमले में burp करते! | 0 | 0 | burp | 300 | playful |
| एक के बाद एक! | 0 | 0 | | 600 | playful |
| पर नहीं, पौधे सिर्फ़ पानी पीते हैं, | -10 | 0 | पानी | 0 | warm |
| अपनी जड़ों से। | -10 | 0 | जड़ों | (end) | warm |

**B**: पौधे और cold drink? फिर तो हर गमले से burp की आवाज़ आती! सच में तो, पौधे सिर्फ़ पानी पीते हैं, वो भी अपनी जड़ों से।

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| पौधे और cold drink? | 0 | 0 | | 300 | amused |
| फिर तो हर गमले से burp की आवाज़ आती! | 0 | 0 | burp | 600 | playful |
| सच में तो, पौधे सिर्फ़ पानी पीते हैं, | -10 | 0 | पानी | 0 | warm |
| वो भी अपनी जड़ों से। | -10 | 0 | जड़ों | (end) | warm |

### L3 delighted surprise: बारह बटा सोलह = तीन बटा चार, first try
Original: अरे! पहली बार में ही? तुमने ऊपर और नीचे दोनों को चार से divide किया, बिल्कुल सही। ये वाला तो बहुत लोग गलत करते हैं!

**A** (original facts kept): अरे! पहली बार में ही? मतलब, तुमने ऊपर और नीचे, दोनों को, चार से divide किया। बिल्कुल सही! ये वाला तो बहुत लोग गलत करते हैं।

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| अरे! | 0 | 0 | | 300 | surprised |
| पहली बार में ही? | 0 | 0 | | 500 | surprised |
| मतलब, तुमने ऊपर और नीचे, दोनों को, | -10 | 0 | दोनों | 0 | warm |
| चार से divide किया। | -10 | 0 | चार | 400 | warm |
| बिल्कुल सही! | 0 | 0 | | 400 | delighted |
| ये वाला तो बहुत लोग गलत करते हैं। | -10 | -8 | | (end) | warm |

**B** (floor-safe aside): अरे, पहली बार में ही? ऊपर भी चार से, नीचे भी चार से, divide! बिल्कुल सही। ये वाला सच में tricky होता है।

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| अरे, पहली बार में ही? | 0 | 0 | | 500 | surprised |
| ऊपर भी चार से, नीचे भी चार से, divide! | -10 | 0 | चार | 400 | warm |
| बिल्कुल सही। | 0 | 0 | | 400 | delighted |
| ये वाला सच में tricky होता है। | -10 | -8 | | (end) | warm |

### L4 gentle correction: "तीन बटा चार छोटा है"
Original: अच्छा, यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं, यानी लगभग पूरा pizza। अब दो बटा तीन को देखो।

**A**: अच्छा, चलो इसे साथ में देखते हैं। तीन बटा चार, मतलब चार हिस्से, और हम लेते हैं तीन। सोचो, लगभग पूरा pizza! अब दो बटा तीन को देखो।

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| अच्छा, चलो इसे साथ में देखते हैं। | -10 | -8 | | 400 | curious |
| तीन बटा चार, | -20 | 0 | | 300 | calm |
| मतलब चार हिस्से, और हम लेते हैं तीन। | -20 | 0 | तीन | 400 | calm |
| सोचो, लगभग पूरा pizza! | -10 | 0 | पूरा | 600 | curious |
| अब दो बटा तीन को देखो। | -10 | 0 | दो | (end) | curious |

**B**: अच्छा, एक second, ज़रा ध्यान से देखते हैं। तीन बटा चार में, चार में से तीन हिस्से हमारे, यानी, pizza लगभग पूरा ही। अब दो बटा तीन को देखो।

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| अच्छा, एक second, ज़रा ध्यान से देखते हैं। | -10 | -8 | | 400 | calm |
| तीन बटा चार में, चार में से तीन हिस्से हमारे, | -20 | 0 | तीन | 300 | calm |
| यानी, pizza लगभग पूरा ही। | -20 | 0 | पूरा | 600 | curious |
| अब दो बटा तीन को देखो। | -10 | 0 | दो | (end) | curious |

### L5 wonder: the heart and the blood
Original: पता है, तुम्हारे शरीर का सारा खून लगभग एक मिनट में पूरे शरीर का एक चक्कर लगा लेता है। सोचो, अभी इसी वक़्त भी!

**A**: पता है, तुम्हारा सारा खून, पूरे शरीर का एक चक्कर लगा लेता है, लगभग एक मिनट में! एक मिनट! सोचो, अभी, इसी वक़्त भी।

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| पता है, | -20 | -8 | | 400 | wonder |
| तुम्हारा सारा खून, पूरे शरीर का एक चक्कर लगा लेता है, | -20 | -8 | | 400 | wonder |
| लगभग एक मिनट में! | -10 | 0 | मिनट | 500 | delighted |
| एक मिनट! | -10 | 0 | एक | 500 | delighted |
| सोचो, अभी, इसी वक़्त भी। | 0 | 0 | अभी | (end) | delighted |

**B**: एक मज़ेदार बात बताऊँ? तुम्हारे शरीर का सारा खून, लगभग एक मिनट में, पूरे शरीर का एक चक्कर लगा लेता है। और ये अभी भी हो रहा है, इसी वक़्त!

| clause | rate | pitch | emph | pause | style |
|---|---|---|---|---|---|
| एक मज़ेदार बात बताऊँ? | -20 | -8 | | 500 | wonder |
| तुम्हारे शरीर का सारा खून, | -20 | -8 | | 300 | wonder |
| लगभग एक मिनट में, पूरे शरीर का एक चक्कर लगा लेता है। | -10 | 0 | मिनट | 500 | delighted |
| और ये अभी भी हो रहा है, इसी वक़्त! | 0 | 0 | अभी | (end) | delighted |

---

## 4. Proposed code changes (`talking-rules.patch`)

The patch is a unified diff against the tree as of 2026-10-04 18:10. Apply with `patch -p1`. It was checked on a
scratch copy: the 16 test files that import these modules gave **122 pass / 9 fail patched vs 122 / 9 unpatched**.
The 9 failures are the same in both. They come from the scratch copy lacking `src/`, `db/` and the e2e harness, not
from the patch.

| file | change | evidence |
|---|---|---|
| `server/director/say.js` | `isUptakeQuestion` and `uptakeIndex`: the **first** question sentence, if it starts in the first 6 words, has ≤ 4 words, no wh-word, no imperative ending, and is not the last sentence, is uptake. It is neither counted by `askParity` nor dropped by `endOnAsk` / `lastQuestionOnly`. | Without it the echo in L2/L3 is deleted. Existing G-ASK cases still pass ("14 times 14 bataiye?" still counts; "Ek prompt? Do sawal?" still ≥ 2). New asserts in `tests/director-truth.test.mjs` |
| `server/compiler/compile.js` | voice lane only: `SPOKEN_NOTE` appended to the LANGUAGE line ("Said aloud: short chunks, key word last, feeling held to the end."). A shape, not a line | Sized to the 140-token language cap. A longer 38-token form overflowed the cap (156) and dropped 200/10,815 kit items. `tests/compiler.test.mjs` updated (lanes still share every other byte) |
| `server/director/shapes.js` | `VERDICT_NOTE.not_yet` gains "curious and slower" | Round-2 note on the correction card. Kept to 3 words because of the move cap |
| `server/compiler/characters/{asha,arjun}.js` | one humour note: when the child jokes, play along one beat (echo, push the picture further), then the fact, still smiling | Round-2: the joke card had no playfulness |
| `server/voice/expressive/compile/dhd.js` | brisk 8 → 0; calm pitch -6 → -8; `breakFor()` (pause → break − 200 ms, none under 250 ms) | §2.2 |
| `server/voice/expressive/moment.js` | think_aloud `commaPause` 0, `sentencePause` ≥ 300; correct/comfort pitch -8; Hindi think fillers → अच्छा, चलो | §2.2 (हम्म 1/3) |

**Position caveat** (repo law "position is mechanism"):
- The spoken note sits in the LANGUAGE section, mid-prompt, because the `last` section has no spare tokens
  (`kit-budget`).
- Its firing rate is **unmeasured**. Before trusting it, director-sim should score voice-lane replies for:
  - mean chunk length;
  - share of turns that start from the child's words;
  - key word last;
  - the last chunk's affect matching the situation.

  Compare with and without the note. If it fires rarely, buy room in `last` (e.g. a shorter ESCAPE_VOICE) and move it
  there.
- `tests/voice-expressive-plan.test.mjs`, which `moment.js` names, is not in `tests/`. The dhd/moment edits have no
  unit test yet.

**Not in the patch (needs its own design):**
- the **script renderer**: Roman Hinglish → Devanagari for Hindi tokens before DragonHD, keeping English words Latin.
  Without it, the production Hinglish lane feeds Diya Roman text, and numbers come out wrong (§5.3).
- a per-situation silence budget in `governor.js` (§2.1);
- nothing for पचास: ASR spells it "पच्चास" in 7/8 L1 renders, Nova's included, mostly before और. That points to an
  ASR spelling artefact rather than a voice defect (ear check).

---

## 5. Measurements from this run (2026-10-04)

### 5.1 Capability probe
See §2.2 for the results.
- Scale: 30 variants, 100 renders, 6.7k characters.
- Re-run: `NODE_USE_ENV_PROXY=1 node docs/research/voice/v4/probe/caps.mjs`, then `python3 …/measure.py caps` and
  `python3 …/asr.py caps`.

### 5.2 Line renders: the text lever and the delivery lever, separated
Setup:
- `probe/render-lines.mjs`: 10 rewrites × 4 arms, plus the script probe.
- ASR: Azure STT hi-IN, Lexical.
- Pauses = internal silences ≥ 200 ms.
- cps = characters without spaces or punctuation per second of speech.

| arm (n = 10 lines) | mean dur s | cps | pauses ≥ 200 ms per line | pause SD ms | silence s per line | numbers heard |
|---|---|---|---|---|---|---|
| R1/R2 anchor: Diya plain, ORIGINAL lines (n = 5) | 7.9 | n/a | 1.2 | n/a | 0.5 | (round 2: "reading 3") |
| diya-text (new text, no plan) | 9.5 | 9.8 | 2.0 | 68 | 0.8 | all* |
| diya-plan (new text + plan, Devanagari runs in hi-IN) | 11.2 | 8.3 | 4.3 | 170 | 2.1 | all* |
| diya-planall (whole clause in hi-IN) | 11.0 | 8.4 | 4.0 | 154 | 2.1 | all* |
| nova-plan (kiara, prose plan) | 10.1 | 9.1 | 4.5 | 184 | 1.6 | all*, 10/10 verbatim (own transcript) |

\* Every number word was heard in every render, counting ASR's spelling "पच्चास" as पचास. That spelling appears in
7/8 L1 renders on all four arms, Nova included, so it is most likely ASR and not the voice.

Reading the table:
- The text lever alone adds length and almost no pauses.
- The plan adds varied pauses and slower working clauses.
- **Neither has been heard by a listener.** The next step is a round-3 blind page: diya-text vs diya-plan vs
  diya-planall vs nova-plan, plus the round-2 Diya anchor, with the same raters and the same 1-5 question. The
  numbers above are screening, not quality.

### 5.3 Script probe: what the Hinglish lane actually sends
The original L1 line on Diya, 2 takes per form:

| form | पैंतीस heard as | तीस heard as |
|---|---|---|
| Devanagari runs in hi-IN (as in rounds 1-2) | पैंतीस 2/2 | तीस 2/2 |
| Roman Hinglish, no lang tag | "पेंटीज/पेंडीज" 2/2 | तीस 2/2 |
| Roman Hinglish inside `<lang hi-IN>` | "पेंटीज/पेंटीस" 2/2 | "टीज" 2/2 |

Rounds 1-2 were rendered from Devanagari text the live Director never writes. A Roman → Devanagari step for Hindi
tokens is a prerequisite for the DragonHD cascade, not an option.

### 5.4 Spend
- **Azure:**
  - DragonHD: about 11.5k characters (146 renders);
  - STT short-audio: about 150 clips, about 11 minutes of audio;
  - well under USD 1 at list price.
- **AWS:** Nova 2 Sonic, 11 short sessions; well under USD 1.
- **Caps:** both far under the USD 10 caps.
- **Storage:** probe audio is `probe/wav` (33 MB) and `probe/wav-lines` (22 MB). Prune or gitignore before any commit.

---

## 6. Round-3 plan (the decision instrument)

**Page.** The blind page reuses `../v3/blind/build.py` and the same raters. Arms:
- Diya anchor (round-2 clip);
- diya-text A;
- diya-plan A;
- diya-plan B;
- diya-planall A;
- nova-plan A.

**Extra question per clip.** "Did she react to *this* moment, all the way through?" (1-5), plus a free note.

**Pre-registered calls:**
- **plan beats text by ≥ 0.5** for both raters → ship the dhd/moment patch and the aligner rules;
- **text beats the anchor by ≥ 0.5** → ship the writing rules (prompt patch) first;
- **planall beats plan** → wrap whole clauses in hi-IN;
- **Nova beats Diya for both raters** → reopen the engine question (AWS credits only; it is not Azure-first).

---

## 7. Proposed context entries (for `context/inbox/`, not merged here)

- **measurement** `v4-dhd-clause-caps-2026-10-04`: everything in §2.2 (n = 3-4 per cell, method as stated).
- **rejected** `rj-dhd-speedup-pitchup-contour-emphasis`:
  - clause-level speed-up (+12/+25% vs default, -14% vs -22% base), pitch-up (+12%), `contour`, `<emphasis>`,
    `express-as`, `mstts:silence` and temperature have no measurable effect on en-IN DragonHD Diya;
  - temperature 1.0 gave one repeated word in 3 takes;
  - instead: slow-only rate, pitch -8, `<break>`, punctuation, and writing.
- **rejected** `rj-hmm-filler-on-dragonhd`: text हम्म was heard 1/3 on Diya.
- **amend** `rj-prosody-rate-on-dragonhd`: rate-down **is** honoured at clause level (-15% → +18%, -32% on base -22
  → +40%). Only rate-up fails. Reversal condition unchanged.
- **finding** `voice-hinglish-roman-script-to-dhd`:
  - the Hinglish lane emits Roman script, and Diya mispronounces Roman Hindi numbers (पैंतीस 0/4 in Roman vs 2/2 in
    Devanagari);
  - decision needed: a Roman → Devanagari renderer before TTS.
- **finding** `voice-uptake-question-stripped`: `lastQuestionOnly` / `endOnAsk` delete turn-initial echo questions.
  The patch adds the exemption.
- **decision (proposed)** `voice-talking-rules-v4`: the writing shapes in §1 and the plan schema in §2.
  - reverse if round 3 shows text and plan arms no better than the round-2 anchor (≤ +0.3 for both raters).

## Sources
- Laan, G. P. M. (1997). The contribution of intonation, segmental durations, and spectral features to the perception
  of a spontaneous and a read speaking style. *Speech Communication* 22(1):43-65.
- Inbar et al. (2025). A universal of speech timing: intonation units form low-frequency rhythms. *PNAS*.
  https://www.pnas.org/doi/10.1073/pnas.2425166122
- Chafe, W. (1980/1994), idea and intonation units (summary: https://www.hamilton.edu/academics/centers/oralcommunication/guides/spoken-language-vs-written-language).
- Székely, É., Henter, G. E., Beskow, J., Gustafson, J. (2019). Spontaneous conversational speech synthesis from
  found data. Interspeech. https://www.isca-archive.org/interspeech_2019/szekely19b_interspeech.html
- Kirkland, A., et al. (2022). Where's the uh, hesitation? Interspeech.
  https://www.isca-archive.org/interspeech_2022/kirkland22_interspeech.html
- Patil, U., Kentner, G., Gollrad, A., Kügler, F., Féry, C., Vasishth, S. (2008). Focus, word order and intonation in
  Hindi. *JSAL* 1(1). https://www.ling.uni-potsdam.de/~vasishth/pdfs/Patil-Kentner-Gollrad-Kuegler-Fery-VasishthJSAL2008.pdf
- Rao et al. (2018). A study of lexical and prosodic cues to segmentation in a Hindi-English code-switched discourse.
  Interspeech. https://www.isca-archive.org/interspeech_2018/rao18_interspeech.html
- Trouvain, J., speech-laughs: https://www.coli.uni-saarland.de/~trouvain/speech-laughs.html; Lasarcyk & Trouvain,
  smiled speech (ICPhS 2015 review: https://www.internationalphoneticassociation.org/icphs-proceedings/ICPhS2015/Papers/ICPHS0337.pdf).
- Levelt, W. J. M. (1983). Monitoring and self-repair in speech. *Cognition* 14:41-104.
- Microsoft Learn, HD voices SSML support: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices
- AWS, Nova 2 Sonic voice conversation prompts: https://docs.aws.amazon.com/nova/latest/nova2-userguide/sonic-system-prompts.html
