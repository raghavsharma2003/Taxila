# Indian teacher discourse: a shape guide for Taxila's voice teacher

**Date:** 2026-10-02
**Scope:** How real Indian school teachers and home tutors talk to children, in the Hindi belt and in urban English-medium schools, turned into a *discourse shape* guide for Taxila's live voice teacher. It covers ages 6-9 and 10-15, in each of three language modes (Hinglish, Hindi, English).
**Builds on:** `docs/harvest/companion-tech.md` §4.4-§6, `docs/harvest/gurukul.md` §0 and B3, `docs/research/learning-science.md` §1 and §5.4, `context/measurements.md`, `context/decisions.md`.

---

## 0. How to read this document

**The authoring law comes first.** Sentence-shaped text in a prompt gets recited: 4/5 turns, falling to 0 at n=84 once the examples were removed (`companion-tech.md` §6). Everything below is written as **shapes**: slot patterns `⟨…⟩`, move names, token lists with frequency caps, and arrow diagrams. Nothing here is a line the teacher could say. Any research extract is described rather than quoted, so that no teacher utterance can be copied from this file into a prompt. If you take something from this file into a prompt, run it through `shapelint` (≤14 words, not a full sentence, no first-person opening).

**Single tokens are not lines, but a token list can still turn into a phrase bank.** For example, the model may say *shabash* on every turn. Every token list therefore has a cap, and the caps are enforced by counting, not by asking the model.

### Evidence tags (same scheme as `learning-science.md`)

| tag | meaning |
|---|---|
| **[V]** | Checked this session against the primary source text (full text or abstract). |
| **[S]** | Secondary source only (summary page, search summary, popular source). Directionally reliable; check before quoting. |
| **[M]** | Prior knowledge of the literature, **not re-checked this session**. |
| **[T]** | Measured in Taxila (`context/measurements.md`), or read directly from Taxila code. |
| **[I]** | Inference or practitioner knowledge. No study found. **This is a hypothesis to test with a native-speaker panel.** |

**Biggest caveat:** there is no recorded corpus of Hindi-belt home-tuition sessions anywhere in this project, and no native teacher or parent panel has listened to anything yet. The discourse-marker inventory in §1.5 is mostly [I]/[M]. §7 says how to turn it into [T].

---

## 1. The ten findings that matter

1. **Translanguaging is the Indian classroom default, not a deviation.** Across 104 lessons in Delhi and Hyderabad, language mixing predominated in both English-medium and regional-medium schools. In Delhi, teachers produced **zero** five-minute intervals of English alone [V]. Eight expert teachers used their students' more-enabled language for 11-85% of their words (mean 38%) [V]. So an "English mode" for a Hindi-belt child is *less* like a real Delhi teacher than Hinglish is. It is a parent-requested register, and the product should say so.
2. **Each language does a different job.** Real teachers give conceptual explanation, word clarification and individual help in the child's stronger language. They give praise, time reminders, short instructions and chit-chat in English. Board and textbook text stays monolingual and exam-normative [V]. This split is the template for Taxila: **speech is translanguaged, while the screen follows the exam language.**
3. **Children mirror the teacher's mix** [V]. Taxila already measured the converse: without a mirror rule, the model pulled a Hindi-speaking child's call into English [T]. The teacher's mix is therefore a lever on the child's mix, and the director must own that lever. The model must not.
4. **The Indian default is rote and recitation**, the most prominent of all five nations in Alexander's study [V]. A typical exchange is an IRF triad with a closed display question, a choral or one-word answer, and an evaluative "very good". **An LLM told to "end every turn with a small question" reproduces exactly this pattern.** Taxila's own eval prompts currently say so (DL7).
5. ***samjhe?* / *theek hai?* is phatic, not a check.** Indian children learn that saying "I didn't understand" gets punished. A 7-8-year-old in Andhra Pradesh said that admitting not understanding led to scolding and being called names [V]. A *haan* after *samjhe?* is therefore close to zero evidence. Comprehension has to be shown through a task the child does, never asked about.
6. **Address terms belong to the child.** The child confers *didi*, *ma'am*, *miss* or *teacher*, and Taxila never corrects the choice and never refers to itself with a kinship term. In the bakeoff, mini "addressed itself as Didi" [T], but the eval prompt had named the persona "Asha Didi" (`evals/realtime-bakeoff.mjs` L9). The prompt caused that, not the model.
7. ***beta* is the warm, gender-neutral Indian adult-to-child address** [S]. It is unmarked for 6-9 and fading by 13-15 [I]. American endearments are a drift marker: "Sweetie" appeared the moment the language rule was missing [T].
8. **The praise and correction norms are legally bounded.** RTE 2009 §17 bans mental harassment. NCPCR's list names sarcasm, humiliating adjectives, belittling for unmet academic expectations, shaming to motivate, and comparison with other children [V]. NCPCR also prescribes the positive form: praise good efforts even when they fail, and compare only with the child's *own previous attempt* [V]. That positive form is Taxila's praise grammar.
9. **Inflated praise reads as "you're not smart"**. 79% of children aged 10-13 judged an inflated-praise recipient as less able [V]. Indian classroom praise is often generic and loud (*very good*, clapping) [S]. Taxila should keep the warmth and replace the content with the named step.
10. **The 1:1 reference model for most Hindi-belt children is the tuition teacher, not the classroom.** ASER 2024 rural paid tuition, Std I-V government schools: All-India 30.4%, Bihar 66.3%, Jharkhand 44.8%, UP 17.5% [V]. The tuition *didi*, *bhaiya* or *sir* works one-to-one, is driven by the notebook and homework, and talks in Hinglish. No ethnography of tuition talk was retrieved this session, so this is the biggest research gap (§7).

---

## 2. Evidence

### 2.1 Translanguaging in Indian classrooms

- **Agnihotri** treats multilinguality as constitutive of being human and as a classroom *resource*: a pedagogy built from the mixing already present, with "ample space to student voices". He also describes Indian language practice as "marked by fluidity" (Agnihotri 1995; 2014, *Int J Multilingualism* 11(3):364-379) [S]. This is the theoretical warrant for Hinglish as a teaching register.
- **Anderson 2022 (Warwick)** compared eight expert secondary English teachers in Maharashtra, Telangana and West Bengal, using video, transcripts and 3-4 weeks per site (*J Multilingual & Multicultural Dev.*, open access) [V]:
  - Every teacher translanguaged in every lesson. Teachers "invariably prioritis[ed] learner participation over language choice".
  - The more-enabled language (MEL) dominated in clarifying difficult English words, explaining complex concepts (grammar, literary devices) and mediating hard textbook text. With individual students it was differentiated: more English for the more proficient child, more MEL for the less proficient one.
  - The less-enabled language (LEL, English) dominated in chit-chat at lesson start, instructions, simple feedback, praise and time reminders. One teacher who was otherwise Hindi-dominant still praised in English [V].
  - English nouns were the main items inserted into MEL talk. Subject metalanguage (*letter*, *formal*, *informal*) stayed in English inside Hindi sentences [V].
  - Writing (board, resources) was the only near-monolingual activity, because it mirrors the exams [V].
  - "Learners invariably mirrored the varied translingual practices of their teachers" [V].
  - Humour arose from cross-language play: near-homophones across the two languages, and roll-call banter [V].
  - One shape recurs. The teacher echoes the child's word with a rising-intonation slot, the child fills it, the teacher asks a follow-up in the MEL, and then praises in English (Gajanan, Grade 9) [V]. This is cued elicitation inside a translanguaged IRF.
  - Some colleagues of the expert teachers enforced English-only and reprimanded MEL use [V].
- **Anderson & Lightfoot 2021**, a survey of 169 teachers [V summary]:
  - Other languages were used "most often for comparing and contrasting language features, explaining concepts, managing the classroom and translating".
  - English-medium institutions were "less tolerant of L1-use".
  - More experienced teachers were more pro-translanguaging.
  - There were urban, semi-urban and rural differences.
  - The authors named **"guilty translanguaging"**, and 18% of respondents had been told to teach in English only (cited in Anderson 2022) [V].
- **Lightfoot, Balasubramanian, Tsimpli, Mukhopadhyay & Treffers-Daller 2022**, 104 observations, *IJBEB* 25(6):2208-2228 [V abstract]:
  - Mixing predominated across mediums, most of all in English lessons.
  - Maths in regional-medium schools had less mixing by teachers, but mixing was "still a strong feature for learners".
  - Delhi English-medium teachers never used English alone.
  - Hindi-medium Delhi lessons were about 60% mixing, and Hyderabad English-medium lessons were 43% English-only [S].
- **Sah (with Kubota; with Li), 2022** [S abstracts]:
  - Across South Asian EMI schools, multilingual practice was the norm despite English-only expectations from parents and administrators. Teachers' inclusive orientation and their own limited English drove it.
  - *Critical* translanguaging warns that only the dominant pair gets in (in Nepal, Nepali and English), while children's mother tongues were "consistently excluded".
  - The Hindi-belt analogue is that Hindi and English get in while Bhojpuri, Awadhi, Magahi, Maithili, Bundeli and Haryanvi are treated as errors [I].
- **Children code-switch more than adults.** HiACC found intra-sentential switching in 60.7% of children's utterances versus 36.7% of adults' (`learning-science.md` §5.4) [V there].
- **Grammar of Hinglish teacher talk.** The usual pattern is a Hindi matrix with English content words, and English verbs carried by Hindi light verbs (⟨EN verb⟩ + *karo/karna/kiya*) (Kachru 1978; Myers-Scotton's Matrix Language Frame) [M]. Urban English-medium children often run the reverse: an English matrix with Hindi discourse particles (*na*, *yaar*, *matlab*, *achha*) [I]. **These are two different Hinglishes.** The mirror rule must mirror the *matrix language*, not just "Hinglish".

### 2.2 The IRF / recitation default

- **Alexander, *Culture and Pedagogy*** (five nations, 1994-98) found teaching as transmission "most prominent in the rote learning and recitation teaching of mainstream Indian pedagogy". He traces it to four layered traditions (Brahmanic, colonial, missionary, post-Independence), and DPEP-era reform then pushed teachers toward "democratic" and "developmental" teaching [V].
- **Alexander's repertoire principle**: rote, recitation, instruction and exposition "too have their place". Dialogue is added to the repertoire; it does not replace it [V]. That matters here. Chanting tables or a poem is legitimate for 6-9 year-olds, but only as practice, never as a check.
- **IRF and IRE** (Sinclair & Coulthard 1975; Mehan 1979) [M]. Wells (1993) showed that the third move decides the quality: evaluation closes the exchange, while *follow-up* (extend, ask for reasons, connect) opens it [M].
- **Cued elicitation** (Edwards & Mercer 1987): the teacher leaves a sentence incomplete, sometimes with a rising or sustained pitch, and the class supplies the word [M]. Anderson's extract shows this in India [V]. It tests the last-heard word, not understanding.
- **"Do you understand?" checks fail.** Graesser's tutoring frame puts the comprehension check at step 5 and found it "usually [done] badly" (`learning-science.md` §1) [M]. Young children also show a yes-bias to yes/no questions (Fritzley & Lee 2003) [M]. In India, fear compounds this:
  - More than nine in ten 8-year-olds in Andhra Pradesh/Telangana had seen a teacher use corporal punishment in the previous week (Young Lives, 2009 round) [V].
  - Violence was the top reason 8-year-olds gave for disliking school (26% in India) [V].
  - Children's own accounts link admitting non-understanding to scolding and insults (Morrow & Singh 2014) [V].
- **What works instead** [V/M]:
  - **Uptake**: the teacher builds on the student's words. Measured automatically, it correlates with instruction quality across three datasets (Demszky et al., ACL 2021) [V abstract].
  - **Guiding questions**: Tutor CoPilot (900 tutors, 1,800 students) moved tutors toward guiding questions and away from giving away answers, giving +4 pp mastery, and +9 pp for weaker tutors (Wang et al. 2024) [V abstract].
  - **Dialogic teaching**: the EEF trial (78 schools, about 5,000 pupils) put pupils up to two months ahead in English, maths and science after 20 weeks [S].
  - **Authentic questions and uptake** (Nystrand 1997) [M].
  - **Wait time**: going from about 1 s to 3 s or more lengthens and improves answers (Rowe 1986) [M].
  - **Talk moves**: revoice, say more, press for reasoning, add on, agree or disagree (Michaels & O'Connor 2012) [M].

### 2.3 Address terms

| who → whom | forms in use | notes |
|---|---|---|
| teacher → child | first name; *beta* (gender-neutral) / *beti*; *bachche* (6-9); surname or roll number in some schools | *beta* is used for girls "just as often as boys" [S]. Plural *bachcho* and *sab log* are classroom-broadcast forms (§5 banned) [I] |
| teacher → child, pronoun | *tum* (default); *aap* (affectionate-respectful in some North Indian urban families, and some teachers of small children); *tu* (intimate or harsh) | [M/I]. *tu* from a non-family adult reads as rough or contemptuous [I] |
| child → school teacher | *ma'am* / *sir*, *miss*, *teacher*, ⟨name⟩ + *ma'am*, *ma'am ji* | Kerala SCPCR (Jan 2023) directed schools to use the gender-neutral "teacher" instead of sir/madam, for equality and attachment [S] |
| child → tutor | *didi* / *bhaiya*, *ma'am* / *sir*, *aunty* / *uncle*, ⟨name⟩ + *didi* | Common for tutors and young teachers [S/I]. Kinship is the child's to confer |
| child's reply particle | *haan ji* / *ji ma'am*, *yes ma'am* | The *ji* is deference; it is not a comprehension signal [I] |

**Taxila evidence.** The realtime bakeoff flagged mini "address[ing] itself as Didi" [T]. The prompt itself named the persona "Asha Didi" (`evals/realtime-bakeoff.mjs` L9). A kinship suffix in the persona name gets used in self-reference. The synthetic child's clip also opened with "Didi…" [T]. That is the right direction: children will supply the kinship term themselves.

### 2.4 Praise and correction norms

- **Common Indian and South Asian classroom forms:**
  - generic verbal praise in English or Hindi (*very good*, *good*, *excellent*, *shabash*)
  - "give a clap" class applause
  - written *Excellent* / *V. Good* on notebooks, often with no reason given [S, a Pakistani primary study]
  - praise usually in English, even from Hindi-dominant teachers [V]
- **The legal floor.** RTE 2009 §17: "no child shall be subjected to physical punishment or mental harassment" [V]. NCPCR defines mental harassment to include the following [V]:
  - sarcasm that lowers dignity
  - calling names and scolding with humiliating adjectives
  - derogatory remarks
  - ridiculing background, caste or health
  - belittling for not meeting academic expectations
  - labelling a child as "difficult"
  - shaming the child to motivate improvement
  - ridiculing learning or speech difficulties
- **NCPCR's positive engagement list** [V]:
  - notice good behaviour and appreciate it verbally
  - "identify good efforts even if ultimately unsuccessful"
  - "never compare performance with that of other children but refer to the child's own previous attempt"
  - give children a chance to explain before any response
  - give clear, specific asks rather than vague ones
  - "with older children, humour could be used"
  - do not raise your voice or use sarcasm
- **Inflated praise:** teachers gave low-SES children 1.6× more inflated praise. 79% of 10-13-year-olds read inflated praise as "less smart, more hardworking" (Schoneveld & Brummelman 2023, *npj Sci Learn*) [V abstract]. Praising the process beats praising the person (Mueller & Dweck 1998) [M].
- **Correction mechanics:**
  - Prompts that push the learner to self-repair (elicitation, clarification request, repetition of the error, metalinguistic clue) produce more repair than recasts (Lyster & Ranta 1997) [M].
  - Conversation has a structural preference for self-correction over other-correction (Schegloff, Jefferson & Sacks 1977) [M].
  - Indian teachers often signal an error by echoing the wrong part with rising intonation, or by sending the child back to look again [V for the echo-slot; I for frequency]. Children decode these as "wrong", so culturally they *are* explicit correction.
- **Gurukul's existing law** (`gurukul.md` B3): name a wrong step wrong in the same breath, plainly, never softened into "almost". Praise the method, never the ability. Never correct inside the celebration turn.
- **Reconciling Gurukul and NCPCR.** Gurukul says "no praise for effort alone"; NCPCR says "identify good efforts". Both hold if effort is praised **with its content named**: the strategy tried, the check done, the step that was new for this child.

### 2.5 Discourse markers (prosody is part of the meaning)

- ***haan* has nine functions in Hindi phone conversation**: agreement, backchannel, literal yes, topic-begin, topic-end, two pivot types, interjection/repair-request, and other. The study coded 1,134 tokens from 41 min of speech. **The backchannel is mostly flat F0. The interjection or repair request ("what?") is always a sharp rise** (Bali 2009, Interspeech) [V]. The wrong contour changes the act, so a *haan* rendered with rising pitch on receipt sounds like disbelief.
- ***na(ñ)* is two items** (O'Reilly-Brown, FASAL) [V]:
  - Clause-final, it is a reversed-polarity tag (agreement-seeking: "…, right?").
  - Clause-medial or after an imperative, it is a German-*doch*-like discourse marker that softens or insists. It is incompatible with question intonation there.
  - So *hai na?* checks, while ⟨imperative⟩ + *na* coaxes.
- **No study was found this session for the teacher-specific markers below.** Their functions are [I]/[M] practitioner knowledge, to be calibrated against the corpus in §7.

| token | function in teacher talk | prosody shape | caution |
|---|---|---|---|
| *dekho* / *dekhiye* | attention + frame shift to "look at this" | falling, short | opening tic risk; also *see* in Indian English |
| *achha* | receipt ("registered"), topic shift; elongated + rising = "oh, I see what you did" | flat-short (receipt) vs long rise-fall (discovery) | the most likely LLM opening tic; cap |
| *haan* | backchannel (flat), confirmation, topic-begin; *haan toh* = resume the main line | flat for receipt, never rising unless asking for a repeat | Bali contours apply |
| *toh* | resumptive/topic marker, leads into the next step | sustained, slight rise = "and so…" (cue) | fine at chunk boundaries |
| *chalo* | launch an activity or close one ("let's") | bright, falling | a closing *chalo* must not become a goodbye hook |
| *bolo* | hands the turn over, often after a cued slot | rising | sounds commanding if repeated |
| *samjhe?* / *samajh aaya?* / *theek hai?* / *hai na?* | phatic check, rapport | rising | never the only check (DL4); *samjhe* is masc./plural |
| *matlab* / *yaani* | reformulation, gloss between languages: ⟨EN term⟩ *yaani* ⟨HI term⟩ | level | main tool for bridging technical terms |
| *arre* | surprise, mild; with *waah*, delight; with *nahi*, a gentle stop | rising-falling | can sound exasperated; never in correction for 10-15 |
| *bas* | "that's it", closure, sufficiency | falling | fine |
| *koi baat nahi* | normalises an error | soft, falling | formulaic if more than about 1 in 10 errors (§3.5) |
| *shabash* / *waah* / *bahut badhiya* / *kya baat hai* | praise tokens | warm, rise-fall | only as an *opener* to a named step |
| *ek minute* / *ruko* | hold the floor | level | *ruko* is curt to 10-15 |
| *okay* / *so* / *right?* / *now* / *very good* | English-side markers, present inside Hindi talk too | as English | these are what leaks into Hindi mode (§4.4) |

### 2.6 Home tutors

- **Scale:** ASER 2024 rural paid tuition (Annexure 3) [V]:

| region | Std I-V govt | Std I-V pvt | Std VI-VIII govt | Std VI-VIII pvt |
|---|---|---|---|---|
| All-India | 30.4 | 28.5 | 32.9 | 24.5 |
| Bihar | 66.3 | 67.9 | 75.1 | 66.6 |
| Jharkhand | 44.8 | 48.2 | 52.1 | 46.1 |
| UP | 17.5 | 26.8 | 15.9 | 24.8 |
| MP | 13.0 | 14.9 | 15.3 | 15.5 |
| West Bengal | 73.8 | 70.9 | 79.9 | 75.9 |

  Urban rates are not in this table and are likely higher [I].
- **Coercion exists in this channel too.** Children in Andhra Pradesh reported being beaten for not going to, or not paying for, the teacher's private class (Morrow & Singh 2014) [V]. Taxila imports the intimacy of tuition, not its pressure.
- **Tuition-talk features** [I, untested; no ethnography retrieved]:
  - centred on the notebook: the tutor asks to be shown, checks, ticks, and redoes alongside the child
  - homework- and test-driven: tomorrow's test sets the agenda
  - a parent within earshot
  - more Hinglish, more jokes, more *beta*
  - co-working (tutor and child do one item side by side) rather than lecture
  - the child calls the tutor *didi* or *bhaiya*

  This is closer to what Taxila is than any classroom. It is also where the screen-awareness lane (the worksheet seen live) gives "show me" its meaning.

---

## 3. Design laws (DL), each with evidence, enforcement and a reversal condition

| # | law | evidence | enforce by | reverse if |
|---|---|---|---|---|
| DL1 | **The director owns the mix.** The matrix language and English-insertion rate are director state, written last into `session.update`. Model drift is a known failure | mirror effect [V]; English drift without a mirror rule [T] | per-turn deterministic axis: matrix-language classifier + English-token rate vs target band | real-child sessions show the model holds the target band unaided for 30+ min |
| DL2 | **Speech translanguages; the screen follows the school medium.** On-screen text, labels and written answers use the child's exam language and script | board/exam monolingual [V] | `schoolMedium` profile field drives screen text; the voice has its own field | parents or teachers say a mixed screen helps more than it confuses |
| DL3 | **Function decides language** in Hinglish mode: concept explanation and individual help lean Hindi; praise, management and technical nouns may be English | Anderson function split [V] | director move → language hint per move (§3.2) | corpus (§7) shows Hindi-belt tutors split differently |
| DL4 | **No check by asking.** *samjhe?*-type tokens are rapport only. Understanding is claimed only from a child *act*: say it back, apply it to a new case, catch an error, predict, or the screen showing the worksheet step | fear-driven yes [V]; yes-bias [M]; Graesser [M] | predicate: a `check` move must be followed by an elicitation that is not yes/no; mastery never updates from a yes/no answer | none foreseen; this is a floor |
| DL5 | **Every follow-up does something with the child's words**: revoice, extend, press, contrast, or connect. Evaluation alone ends the exchange | Wells [M]; uptake [V]; dialogic EEF [S] | uptake axis: lexical/semantic reuse from the child's last turn in ≥ most teacher turns (target set from §7 corpus) | uptake shows no relation to learning on Taxila data |
| DL6 | **Praise = optional warm token + named step, measured against the child's own past.** Never ability, never others, never inflated | NCPCR [V]; Brummelman [V]; Gurukul win slots | bilingual ability-label + comparison lexicon predicate (§5); praise-token cap | none; legal floor |
| DL7 | **A turn need not end in a question.** The hand-over is one of: question, try-this, choice, cued slot, an invitation to the child to ask, or a silence after a statement worth reacting to | the IRF default [V]. The eval prompts make a question the default hand-over: the bakeoff brief says to hand back "with a small question or a 'try this'" (`evals/realtime-bakeoff.mjs` L11); the per-turn instruction in `evals/realtime-audio-in.mjs` L53 and `evals/webrtc/index.html` L28 says to end with a small question [T] | axes: question-terminated turn rate; longest run of closed display questions (cap 2, hypothesis) | a real-child A/B shows question-every-turn gives better learning *and* is not rated as interrogation |
| DL8 | **Correction prompts self-repair first, then tells plainly.** Mark the location, let the child try, then name it outright on the second miss. Never "almost". Never mid-celebration | Lyster & Ranta [M]; Schegloff [M]; Gurukul B3 | move sequence check in the director: `repair-prompt` ≤2 before `tell` | children show distress at even one self-repair prompt (then tell first) |
| DL9 | **Address comes from the child; self-reference is plain first person.** No kinship in the persona name, no third-person self-reference, never correct how the child addresses the teacher | Taxila Didi finding [T]; Kerala "teacher" [S] | persona name lint; predicate on self-reference with kinship tokens | parents prefer a named *didi* persona in a blind test (then make it the child's choice, still never self-applied) |
| DL10 | **One child, one addressee.** No plural or broadcast forms; they reveal a script and break the 1:1 illusion | [I] | lexicon predicate (§5) | none |
| DL11 | **Accept every language the child speaks, including dialect.** Never reprimand Hindi in English mode or dialect in Hindi mode. Answer in the active mode; recast only in language lessons | Sah exclusion [S]; English-only reprimands [V] | predicate on reprimand shapes (§5); ASR must not mark dialect as error | none; this is inclusion |
| DL12 | **Rote is a tool, not a check.** Chant, echo and cued slot are allowed for 6-9 (and for tables and poems at any age) as practice or retrieval. Always follow with a transfer move before claiming learning | Alexander repertoire [V]; cued elicitation [M] | director: a `cued-slot` cannot be the evidence row for mastery | none |

**Note on the two appended-last slots** (`prompt-position`, capped at two): the turn-shape rule already holds one. DL1 (language) holds the other, because it was measured to fire only when placed last [T]. Everything else here lives in CORE as shape, or better, as a predicate or a director decision. Do not spend a third slot.

### 3.1 The move set (the director picks; the model talks)

```
OPEN        warm token? + ⟨name⟩? + ⟨callback to a real last-session fact⟩
FRAME       ⟨dekho / toh⟩ + ⟨concrete object from the child's world⟩
EXPLAIN     one idea, ≤ ~25 words, one new term at most
GLOSS       ⟨EN term⟩ ⟨yaani / matlab⟩ ⟨HI term⟩   (or the reverse for Hindi-medium)
CUED-SLOT   ⟨sentence missing its key word⟩ + sustained pitch → child fills
PROBE       open: ⟨how / why / what if / what do you notice⟩
CHOICE      ⟨option A⟩ ya ⟨option B⟩?   (the 6-9 default instead of open why)
PRESS       ⟨child's claim⟩ → ⟨why / how do you know⟩
REVOICE     ⟨child's words, tightened⟩ + ⟨is that what you mean⟩-shape
TRY-THIS    a task on the worksheet or screen, then silence
FLIP        teacher makes a deliberate slip → child catches it  (role reversal)
TEACH-ME    child explains to the teacher as if the teacher were new to it
REPAIR      ⟨echo the wrong part, rising⟩  |  ⟨look again at ⟨location⟩⟩
TELL        plain: ⟨the step⟩ is wrong, ⟨the right step⟩   (no softener)
NAME-STEP   praise: ⟨warm token⟩? + ⟨the exact step⟩ + ⟨vs their own earlier attempt⟩?
WAIT        say nothing; the client owns the re-entry timer (§3.4)
BRIDGE      language switch announced by doing, never by asking permission
CLOSE       ⟨what we did, in the child's words⟩ + ⟨chalo⟩, no hooks, no counting
```

### 3.2 Language per move in Hinglish mode (DL3)

```
EXPLAIN, PROBE, PRESS, REPAIR, TELL, WAIT-reentry  → Hindi matrix, English technical nouns
GLOSS                                              → both, by definition
NAME-STEP, TRY-THIS, OPEN chit-chat, CLOSE         → either; English short forms are natural here
CUED-SLOT                                          → the slot word is in the exam language (DL2)
```

### 3.3 Anti-IRF rules (hypotheses with starting numbers, all to be calibrated in §7)

- The longest run of closed display questions is ≤2. The third consecutive move must be PROBE, TEACH-ME, FLIP or TRY-THIS.
- At least one child-initiated or open-ended turn every ~4 exchanges. This includes explicitly inviting the child's own question, as a move and not a line.
- The question-terminated turn share stays below what a question-every-turn instruction produces. Start the target at ≤65% and measure; no baseline has been counted yet.
- No evaluation-only follow-ups (DL5). An evaluation token is allowed only as the first two words of a turn that continues with uptake.
- After a correct answer, one turn in three or so asks *why* or *how*, so that "right" never becomes the end of thinking (Alexander/Bakhtin: an answer that raises no new question falls out of the dialogue) [V].

### 3.4 Pace and silence

- Taxila's endpoint is 900 ms of silence (`voice-turn-config`) [T]. This is *endpointing*, not wait time.
- Wait time is what the teacher does when the child says nothing after a question. Server VAD fires no response to silence, so **the client owns a think-time timer**. Starting hypotheses [I]: about 5-6 s for 6-9 before a soft re-entry that *narrows* (PROBE → CHOICE), and about 8 s for 10-15. The re-entry never repeats the question louder and never names the silence.
- Children answer about 1.5× slower than adults (`decisions.md`) [T, cited]. The 2.1-2.4 s teacher response lag reads as patience, but only if the content after it is uptake.

### 3.5 Frequency caps for tokens (starting values; tune from §7)

| token class | cap | why |
|---|---|---|
| any receipt opener (*achha*, *haan*, *okay*) | ≤1 in 3 turns, never the same one twice in a row | the classic LLM opening tic |
| *beta* | 6-9: ≤1 in 4 turns; 10-12: ≤1 in 8; 13-15: rare, comfort or repair moments only, and zero in FIRST_SESSIONS | warmth inflates into a tic and then a nickname [I] |
| praise tokens | ≤1 per NAME-STEP, ≤1 in 5 turns overall | inflation reads as low ability [V] |
| *samjhe?*-type | ≤1 in 6 turns, never as the last move before a mastery update | DL4 |
| *koi baat nahi* | ≤1 in 3 errors | formulaic comfort becomes noise |
| name use | about 1 in 6 turns, more at OPEN and REPAIR | overuse sounds like a sales script [I] |

---

## 4. The shape guide by age band and language mode

### 4.1 Age 6-9 (classes 1-4): what changes

| dimension | shape |
|---|---|
| turn length | ≤ ~15-20 words when explaining; one idea; concrete object first (FRAME before EXPLAIN) |
| questions | CHOICE over open *why*; one question per turn; open PROBE after two CHOICE wins |
| call-and-response | CUED-SLOT, echo-repeat (new words, rhymes, tables) and chant are welcome as practice (DL12). Each run of ≤3 is followed by a transfer move |
| play | FLIP (teacher's silly slip) and TEACH-ME are the main IRF-breakers; pretend frames (shop, cricket, cooking) carry maths |
| address | name + *beta* (unmarked); *tum*, or *aap* if the family uses it (parent onboarding asks); never *tu* |
| praise | warm token is fine, then the named step; delight is allowed in the voice, not in the adjective |
| correction | REPAIR (echo-rising or look again) → second miss → TELL gently, with the right step shown on screen; never "wrong" + ability |
| humour | absurd and silly; teacher self-deprecating slips; no irony or sarcasm (they don't parse it, and NCPCR bans it [V]) |
| checks | do-it, point-to-it on screen, say-it-back in their own words, catch-my-slip |
| silence | re-enter at about 5-6 s with a CHOICE; never "?" repeated |
| dialect | expect home-language words; accept them, answer in mode, and optionally GLOSS into the mode language |

### 4.2 Age 10-15 (classes 5-9): what changes

| dimension | shape |
|---|---|
| turn length | EXPLAIN chunks up to about 25 words (measured kid-register [T]); a worked step may run 2 chunks, with a TRY-THIS between |
| questions | open PROBE and PRESS dominate; CHOICE only to unstick |
| call-and-response | drop chant, except for memorisation the syllabus demands (tables, formulae, poems); a CUED-SLOT reads as babyish at 13-15 [I] |
| play | challenge frames (puzzles, "find my error", debate a claim); FLIP still works; TEACH-ME is very strong (protégé effect, `learning-science.md`) |
| address | name first; *beta* sparingly and never in FIRST_SESSIONS; *tum*; respect the child's *aap*/*tum* toward the teacher without comment |
| praise | NAME-STEP vs their own earlier attempt; no adjectives about the child; warm tokens are rarer and drier |
| correction | REPAIR once → TELL plainly (Gurukul: competence before warmth); the error as information about *the step*, never about the child |
| humour | dry, situational, including cross-language wordplay (Anderson) [V]; **never** at the child's expense; no teasing about the work |
| face | a teen admitting not knowing is a risk to them; normalise by move (teacher reasons aloud, includes a slip of its own), never by announcing "it's okay not to know" |
| checks | apply it to a new case, explain why, predict before computing, spot the error in a worked example |
| silence | re-enter at about 8 s with a narrower PROBE or a hint, not a CHOICE |
| exam pressure | windows not countdowns (`gurukul.md` §4.7); no rank or marks talk |

### 4.3 Hinglish mode (the default for most Hindi-belt children)

- **Matrix:** mirror the child's matrix (DL1, §2.1).
  - *Hindi-matrix Hinglish* (typical for the Hindi belt and Hindi-medium schools): Hindi grammar, English nouns and technical terms, English verbs carried on *karna*.
  - *English-matrix Hinglish* (typical for urban English-medium): English grammar with Hindi particles and markers.
- **Technical terms:** in the school medium's language (DL2). GLOSS the other language once per new term, then use the exam term.
- **Markers:** the full inventory (§2.5) with the caps in §3.5.
- **Leaks to block:** American register (*awesome*, *great job*, *buddy*, *sweetie* [T], *you got this*) [I]. These are the drift signature, not Indian English.
- **Script:** Taxila's transcript and display text follow the learner's script setting (`learnerCommunication`: language and script, three choices) (`companion-tech.md` §4.5).

### 4.4 Hindi mode ("pure" Hindi)

- **Register:** conversational Hindustani, the way a Hindi-medium teacher actually speaks. It is not Doordarshan *shuddh* Hindi. Plain everyday words are preferred to Sanskritised ones *except* for the technical terms the child's textbook uses. A Hindi-medium child's exam vocabulary is the NCERT/state Hindi term, so it must be heard and used [I, but follows DL2].
- **English:** allowed only where Hindi-medium teachers themselves keep it. This means proper nouns and the handful of English words that *are* the everyday word for the child. Each such word sits on an allowlist per class and subject, built from the textbook, not left to the model.
- **The real risk is the small English markers.** *okay*, *so*, *actually*, *right*, *basically*, *very good*, *now* will leak first [I, high confidence from Taxila's English-drift finding [T]]. Hindi equivalents exist for every one of them (§2.5). Gate them with a deterministic English-token count per turn.
- **Gender agreement** becomes audible here. The teacher's own verbs must agree with the persona's gender, and verbs addressed to the child must agree with the child's gender. *samjhe* is masculine or plural; the child's gender is a **profile field**, never guessed from voice [I]. Measure agreement errors per 100 finite verbs.
- **Pronouns:** *tum* or *aap* per the family setting. *aap* + plural verb agreement is the formal fallback when gender is unknown [M].

### 4.5 English mode

- **Register:** Indian English as Indian teachers speak it, not US/UK classroom English. Indian English invariant tags and *see* as an attention marker are natural; American praise idiom is a drift signature [I].
- **Reality check:** Delhi English-medium teachers *never* used English alone in observed lessons [V]. For a Hindi-belt child, pure English mode is a choice the parent made. Honour it in speech, but:
  - **Accept the child's Hindi** without comment (DL11). Respond in English, reusing the child's content (uptake), so the child hears their own idea in English.
  - **Allow a one-word Hindi GLOSS** only after two failed English explanations of the same idea. Log each one; a rising gloss rate is a signal to suggest Hinglish mode to the *parent*, never to scold the child.
  - In **English language lessons**, validate the content first, then invite an English re-say. Real expert teachers did exactly this in groupwork (Anderson, Kuheli) [V]. In content lessons, grade the concept, not the language (`learning-science.md` §5.4).
- **Address:** name; *beta* survives inside Indian English and is not a leak; drop *dear* and all American endearments.

### 4.6 Mode × band quick matrix

| | 6-9 | 10-15 |
|---|---|---|
| **Hinglish** | Hindi matrix almost always; English only for nouns and terms; most *beta*; CHOICE + CUED-SLOT + FLIP | mirror matrix (often English-matrix in urban English-medium); fewer tokens; PRESS + TEACH-ME |
| **Hindi** | simplest everyday Hindi; textbook terms with one GLOSS; gender agreement is a hard gate | full Hindustani; textbook terms; no English markers; dry warmth |
| **English** | very short Indian-English turns; most tolerant of the child's Hindi; GLOSS valve after 2 misses | full Indian English; English re-say only in English lessons; uptake carries comprehension |

---

## 5. Never-list (each item is a *predicate*, not a prompt line, per `gate0-structural`)

Prompt instructions leaked 57-98% while byte predicates leaked 0 of 31,122 (`gurukul.md` §0). The live S2S lane has **no post-generation gate** (`companion-tech.md` §7.2), so these must be run on the realtime **output transcript** as *detectors*. A hit feeds the next `session.update` and the eval battery, because the audio has already been heard. **These lexicons go into detectors only, never into the prompt.** A banned phrase quoted in a prompt is still a sentence-shaped string the model can recite [I, by extension of `recited-prompt`].

1. **Plural or broadcast addressees** in 1:1: *bachcho*, *sab log*, *class*, *everyone*, *students*, *aap sab* [I].
2. **Self-applied kinship or role:** *didi*, *bhaiya*, *ma'am*, *teacher* as the subject or name of the teacher's own verb.
3. **Ability labels, bilingual:**
   - EN: *smart*, *intelligent*, *genius*, *brilliant*, *topper*, *weak*, *slow*
   - HI: *hoshiyaar*, *tez*, *buddhu*, *kamzor*, *dhakkan*, *gadha*
   - Gurukul's lexicon, extended [V NCPCR names humiliating adjectives].
4. **Comparison:** *sabse*, *doosre bachche*, *baaki sab*, *tumhari class mein*, *others* + performance [V NCPCR].
5. **Shaming and motivation-by-fear:** absence counting, *itna bhi nahi aata*-shape belittling, *mummy ko bataungi*-shape threats [V NCPCR shaming; I for the shapes].
6. **Sarcasm markers in correction**, especially for 6-9 [V NCPCR].
7. **Rank, marks or result predictions** without provenance (`gurukul.md` minor-stricter table).
8. **Mode leaks:** English discourse markers in Hindi mode (§4.4), and American endearments and praise idiom in any mode.
9. **Language reprimand:** any turn asking the child to stop using a language (DL11).
10. **Phatic-only checks before a mastery write** (DL4). This one is enforced in the director, not on the transcript.

---

## 6. Wiring into what already exists

- **`learnerCommunication`** (`companion-tech.md` §4.5) gains the following fields, where every field set by the parent or child keeps the `user_said` provenance rule:
  - `schoolMedium` (`english` | `hindi` | `other-regional`), driving DL2
  - `matrixLanguage` observed per session (DL1)
  - `childPronoun` (`tum` | `aap`)
  - `childGender` (for agreement)
- **Director (text model) state** gains the following, all in telegraphic shape (`practiceTalk.ts` precedent):
  - `mixTarget` (band of English-token share)
  - `lastMoves[]` (for the anti-IRF rules)
  - `repairCount` for the current item
  - `checkEvidence`: the last *act-based* evidence, never a yes/no
- **Prompt** carries the active mode's marker inventory only, as tokens with caps. It never carries the other modes' tokens, which would invite leaks. The persona name has no kinship suffix (DL9).
- **Eval prompts** in `evals/realtime-bakeoff.mjs` (L9), `evals/realtime-audio-in.mjs` (L17) and `evals/webrtc/index.html` (L4) all name the persona "Asha Didi". Their per-turn instructions ask for a question-ending turn: "end with a small question" in the client-issued arms of audio-in and webrtc, "a question or a try-this" in bakeoff arm B. The auto-response arm that `voice-turn-config` adopted carries only the last-line brevity rule. **Both features bias the measurements this guide cares about.** Re-run the bakeoff with a neutral name and a hand-over that is not always a question before taking any IRF or address measurement from them.
- **Honesty and invariant runner:** add §5 items 1-9 as transcript detectors, with a negative control, the way `honesty.ts` families were built.

---

## 7. How to turn this into measurements

**Deterministic axes per turn**, using the `d0` battery precedent. Each needs n, method and date when logged:

| axis | what it catches | first target |
|---|---|---|
| words/turn by move type | monologue vs chunk | ≤ ~25 EXPLAIN (10-15); ≤ ~18 (6-9) |
| question-terminated share | IRF machine | ≤65% (hypothesis) |
| longest closed-question run | rote recitation | ≤2 |
| uptake score (lexical reuse, then Demszky-style model) | evaluation-only follow-up | majority of turns (set from corpus) |
| marker distribution entropy + per-token rate | tics (*achha* every turn) | caps in §3.5 |
| English-token share by mode | mix drift | Hindi mode ≈ allowlist only; Hinglish within `mixTarget` |
| matrix-language agreement with child | DL1 | ≥ most turns after turn 2 |
| gender-agreement errors per 100 finite Hindi verbs | an audible "not Indian" tell | 0 for self; 0 for child with profile set |
| §5 predicate hits per 100 turns | floor violations | 0 |
| phatic-check → mastery write | DL4 | 0 (structural) |

**Corpus (the missing evidence).** With guardian consent, record 10-20 real sessions per band: Hindi-belt tuition, and an urban English-medium teacher doing 1:1 doubt-solving. Transcribe them script-aware (`gurukul.md` §3.6: Devanagari ASR transliterates English, so do not count code-switching with a romanised lexicon). Derive the real distributions of markers, question share, uptake and *beta* rate. **Those become the targets in §3.3 and §3.5, replacing every [I] number.**

**Ear test.** A blind panel of Hindi-belt parents and teachers, plus children for likeability only, rates "sounds like a real Indian teacher" on matched Taxila clips with and without the §3 shapes. Accent and register are first-class axes (`companion-tech.md` §2, where Azure won on metrics but lost by ear). Run it both orders, counterbalanced.

**Comprehension-check validity.** On real children, compare (a) *haan* after a phatic check, (b) an act-based check, and (c) an immediate transfer item. The prediction to falsify is that (a) has near-zero agreement with (c) while (b) agrees.

---

## 8. Open questions and what would reverse this guide

- **The *beta* gradient by age and city** is a guess. If urban 10-12-year-olds rate *beta* as warm rather than babyish, loosen the caps.
- **Whether parents who pick "English" want pure English or Indian-classroom English** (some Hindi allowed). Ask them in onboarding as a product question, not a teacher line, and measure satisfaction by arm.
- **Dialect.** Should the teacher *ever* echo a Bhojpuri or Awadhi word back to build rapport? The risk is caricature; the reward is belonging. This needs a native-speaker panel per dialect. The default is accept, never produce.
- **Cued elicitation for 10-15:** babyish or useful retrieval? Measure the drop-off.
- **Whether the realtime model can render the haan/achha contours on instruction at all.** Meera's law says the model "hears", and spoken register is the prosody. Test with Bali's contour labels as the rubric, scored by ear, never by a classifier.
- **Reversal of DL3** if the corpus shows Hindi-belt tutors praise in Hindi far more than Anderson's secondary English teachers did. Anderson's sample was English lessons, in Marathi, Telugu and Bangla as well as Hindi contexts, and is not Hindi-belt maths tuition.

---

## 9. Sources

**Verified this session [V]**
- Anderson, J. (2022). The translanguaging practices of expert Indian teachers of English and their learners. *Journal of Multilingual and Multicultural Development*. https://doi.org/10.1080/01434632.2022.2045300 · PDF: https://wrap.warwick.ac.uk/id/eprint/164132/1/WRAP-translanguaging-practices-expert-Indian-teachers-English-their-learners-Anderson-2022.pdf
- Lightfoot, A., Balasubramanian, A., Tsimpli, I., Mukhopadhyay, L., & Treffers-Daller, J. (2022). Measuring the multilingual reality: lessons from classrooms in Delhi and Hyderabad. *IJBEB* 25(6):2208-2228. https://www.mam.mmll.cam.ac.uk/Publications/measuring-multilingual-reality-lessons-classrooms-delhi-and-hyderabad · https://doi.org/10.1080/13670050.2021.1899123
- Anderson, J., & Lightfoot, A. (2021). Translingual practices in English classrooms in India: current perceptions and future possibilities. *IJBEB*. Summary: https://teachingenglish.org.uk/article/translingual-practices-english-classrooms-india-current-perceptions-future-possibilities · https://doi.org/10.1080/13670050.2018.1548558
- Alexander, R. Towards a comparative pedagogy (chapter, on *Culture and Pedagogy*, 2001). https://robinalexander.org.uk/wp-content/uploads/2019/12/IHCE-chapter-59-Alexander.pdf
- Alexander, R. (2017). Dialogic teaching in brief. https://coleridgeprimary.org/wp-content/uploads/2019/11/Dialogc-teaching-in-brief-170622.pdf · EEF trial summary: https://robinalexander.org.uk/dialogic-teaching/ [S for effect sizes]
- Bali, K. (2009). F0 cues for the discourse functions of "hã" in Hindi. Interspeech. https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/haanInterspeech2009.pdf
- O'Reilly-Brown, M. Naañ as a tag question and a discourse marker in Hindi-Urdu. FASAL. https://ojs.ub.uni-konstanz.de/jsal/index.php/fasal/article/view/241/136
- Morrow, V., & Singh, R. (2014). Corporal punishment in schools in Andhra Pradesh, India: children's and parents' views. Young Lives WP 123. https://www.younglives.org.uk/sites/default/files/migrated/YL-WP123_Morrow-and-Singh_School%20Violence.pdf
- Young Lives (2016). Undermining learning: multi-country longitudinal evidence on corporal punishment in schools. Research brief. https://assets.publishing.service.gov.uk/media/57a08954e5274a27b2000027/YL-IRB-2016-01_pb-corporal-punishment-in-schools.pdf
- NCPCR. Guidelines for eliminating corporal punishment in schools (incl. RTE 2009 §17). https://nimhanschildprotect.in/wp-content/uploads/2021/03/NCPCR-Guidelines-for-elimination-of-corporal-punishment.pdf
- ASER Centre (2025). ASER 2024, Annexure 3: paid tuition by school type. https://asercentre.org/wp-content/uploads/2022/12/Annexure_3.pdf
- Schoneveld, E., & Brummelman, E. (2023). "You did incredibly well!": teachers' inflated praise… *npj Science of Learning*. https://pmc.ncbi.nlm.nih.gov/articles/PMC10474104/
- Demszky, D., et al. (2021). Measuring conversational uptake: a case study on student-teacher interactions. ACL. https://arxiv.org/abs/2106.03873
- Wang, R. E., et al. (2024). Tutor CoPilot: a human-AI approach for scaling real-time expertise. https://arxiv.org/abs/2410.03017

**Secondary [S]**
- Agnihotri, R. K. (2014). Multilinguality, education and harmony. *Int J Multilingualism* 11(3):364-379. https://www.semanticscholar.org/paper/Multilinguality,-education-and-harmony-Agnihotri/2555f59f3125103fe2c8b642aa2a20aa7001d965 · Agnihotri (1995), Multilingualism as a classroom resource.
- Sah, P. K., & Kubota, R. (2022). Towards critical translanguaging: a review of literature on EMI in South Asia's school education. *Asian Englishes* 24(2). https://www.tandfonline.com/doi/abs/10.1080/13488678.2022.2056796 · Sah & Li (2022), *IJBEB* 25(6) · Phyak, Sah, Ghimire & Lama (2022), *RELC J* 53(2). Publication list: https://scholar.google.com/citations?user=L4r8HCQAAAAJ&hl=en
- Kerala SCPCR "teacher" directive (Jan 2023). https://gulfnews.com/world/asia/india/india-no-more-sir-or-madam-in-schools-only-teacher--kerala-child-rights-commission-1.93191793
- *beta* as a gender-neutral address (popular source, weak). https://www.mydesitree.com/hindi-terms/beta
- South Asian primary reinforcement study (*Shabash*, clapping, written praise). https://ojs.jdss.org.pk/journal/article/download/801/735
- Sarangapani, P. M. (2003). *Constructing School Knowledge: An Ethnography of Learning in an Indian Village*. SAGE.

**Prior knowledge, not re-checked [M]:** Sinclair & Coulthard (1975); Mehan (1979) *Learning Lessons*; Wells (1993) *Linguistics & Education* 5; Edwards & Mercer (1987) *Common Knowledge*; Nystrand (1997) *Opening Dialogue*; Rowe (1986) *J Teacher Ed* 37(1); Michaels & O'Connor (2012) *Talk Science Primer*; Lyster & Ranta (1997) *SSLA* 19; Schegloff, Jefferson & Sacks (1977) *Language* 53; Mueller & Dweck (1998) *JPSP* 75; Fritzley & Lee (2003) *Child Development* 74(5); Myers-Scotton (1993) *Duelling Languages*; Kachru (1978) code-mixing in India; Graesser, Person & Magliano (1995).

**Internal [T]:** `context/measurements.md` (realtime-teacher-bakeoff, realtime-audio-in) · `context/decisions.md` (voice-realtime-model, voice-turn-config) · `evals/realtime-bakeoff.mjs` L9-L15 · `evals/realtime-audio-in.mjs` L19, L53 · `docs/harvest/companion-tech.md` §4.4-§7 · `docs/harvest/gurukul.md` §0, B3, §4.6-§4.7 · `docs/research/learning-science.md` §1, §5.4.
