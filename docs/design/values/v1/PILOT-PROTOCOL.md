# Real-child pilot protocol: V1.6 and V2.4 (shared with the voice-signals pilot)

Status: **draft for the owner, counsel or IEC review, and a native Hindi speaker.** Nothing in this protocol has run.
Date: 2026-10-05. Owner approval of the consented panel: O-R6, 2026-10-04 (RESET-PLAN). This protocol extends
`docs/design/voice-signals/SPEC.md §6.3` and does not replace it. Both run on the same children, in the same sessions,
under one consent.

## 1. What this pilot must prove, and what it cannot

| bar | claim | pass rule (pre-registered) | needs |
|---|---|---|---|
| **V1.6a** | Skills the product calls "secure" are still right later, in a new form, without help | First-try, unaided accuracy on **research checks** of secure skills. The one-sided 95% lower bound (child-clustered bootstrap) must be **≥ 0.85**. | §6: about 40 children if true accuracy is ≥ 0.93; about 80 if it is about 0.90 |
| **V1.6b** | The product's P(correct) is calibrated against real delayed outcomes | Stage 1: ECE (10 equal-width bins) ≤ 0.05 at the point estimate and the child-clustered 95% CI upper bound ≤ 0.08. Stage 2 adds: the logistic recalibration slope's 95% CI inside [0.8, 1.2] | ≥ 1,200 research-check outcomes for stage 1, ≥ 2,400 for the slope (§6) |
| **V2.4** | Signals add value: delayed-check outcomes are predicted better with signals than with text and task alone | ΔAUROC (text + task + signals vs text + task), with folds split by child and a child-clustered 95% CI excluding 0 | §6: the pilot can only detect a **large** effect. A ΔAUROC near 0.03 needs the 200-child extension (`rj-vs-l2-bar-80ci-at-pilot-scale`) |
| V1.1 (real speech) | 0 wrong grades on real children's answers | Product verdict vs the adjudicated label of 2 blind human raters, on every graded answer, reported with a 95% CI | comes free with the sessions |
| V1.4 (real traces) | Overload ≤ 5% of skill-sessions; boredom ≤ 5% | Observable definitions in §5.4 | comes free with the sessions |
| V2.3 | Per-state precision ≥ 0.80 on children | Exactly as SPEC §6.3 / VS-A1..A6 | voice pilot |

**What the pilot cannot show, stated in advance:**
- It is a convenience sample: the owner's own networks, likely urban and English-heavier. Every result names this limit.
- Effects measured over 3 weeks say nothing about a school year.
- A pass on V1.6a at 40 children holds for skills in the topics taught (maths classes 4-7, plus one science topic). It
  is not evidence for every subject.

## 2. Who

- **Children.** About 40 in stage 1 (see §6), classes 4-7, ages 9-13. At least 16 in each band (9-10 and 11-13).
  - Mixed home language: Hindi-dominant, Hinglish and English-medium.
  - At least 3 phone classes.
  - At least 5 children on a headset (shared with the voice pilot).
- **Exclusions.** None on speech, ability or language. A child the parent says is under emotional strain right now is
  not enrolled this round.
- **Stage 2 (only if stage 1 passes its gates).** 100-200 children through the in-product flywheel under the same
  consent, for V2.4 and for V1.6a if stage 1's accuracy estimate sits near 0.90.

## 3. Ethics, consent and safety

- **Review.** The study runs under the IEC/counsel review already required for E1, with this protocol as an amendment.
  No session starts before the reviewer's written sign-off is filed.
- **Consent.** A person explains it, never the tutor. The parent gives consent; the child gives assent separately.
  - Refusal has no consequence.
  - The thank-you is flat (the same for everyone) and is never tied to performance.
- **Withdrawal at any time.** The child can say "ruko / band karo / stop", or press stop. The session ends with **one**
  warm check-in, the product's stop behaviour. No pressure and no follow-up question.
  - The parent can withdraw by message.
  - Data not yet anonymised is deleted within 24 hours.
- **The child-safety floor is unchanged.**
  - `scanSafety` runs first on every turn, in lessons and check rounds alike.
  - A safety turn hands off to the floor response: Childline 1098 / Tele-MANAS 14416 on screen to the parent.
  - The teacher never denies being an AI.
  - There is no romance or companion register.
  - If a session raises a safeguarding concern, the research script stops and the safeguarding hand-off runs.
- **No emotion claims.** No output, report or rater manual names a feeling (Microsoft CoC restriction 12; V2).

### 3.1 Parent consent (English)

> **Taxila learning study: what we are asking**
>
> Over about three weeks, your child will do short lessons with Taxila's AI teacher, about 4 a week of 20-30 minutes,
> on your phone at home. Twice a week there is also a 10-minute "check round": a few questions with no teaching, to
> see what your child still remembers. The teacher is an AI and will always say so if asked.
>
> **Why:** to find out whether Taxila is right when it says your child has *learnt* something, meaning they can still
> do it days later, in a new question, without help. We also check whether the way a child answers (how long they take
> to start, pauses) helps the teacher know when an answer is solid. That second part is described in the voice study
> sheet, and it is your separate choice.
>
> **What we record:**
> - your child's answers and the lesson text (what was said, as text);
> - the check-round answers;
> - the audio only if you tick box V3 of the voice study.
>
> **What we do not do:**
> - we do not try to detect emotions or mood;
> - we do not show your child any score;
> - we do not compare your child with other children;
> - we use nothing for advertising.
>
> **Who sees the answers:** two trained people mark the check-round answers without knowing which child gave them or
> what Taxila predicted.
>
> **Where it is kept:** encrypted, in India (Microsoft Azure, Central India / South India). Text is deleted at the end
> of the study plus 90 days. Numbers that cannot identify your child (for example "answered correctly: yes/no") are kept
> to improve Taxila.
>
> **Your choices** (each one separate; each can be withdrawn at any time in Controls, or by messaging [contact]):
>
> ☐ L1 My child may take part in the lessons and check rounds described above
> ☐ L2 Taxila may keep the anonymous numbers from this study to improve how it decides what a child has learnt
>
> Saying no to L2 does not affect L1. Withdrawing deletes what has not been anonymised within 24 hours.
> Questions or complaints: [name, phone, email]. Notice version: v1-pilot-1.

### 3.2 अभिभावक की सहमति (हिन्दी)

> **Taxila सीखने का अध्ययन: हम क्या माँग रहे हैं**
>
> लगभग तीन हफ़्तों तक आपका बच्चा Taxila की AI टीचर के साथ छोटे-छोटे पाठ करेगा: हफ़्ते में लगभग 4, हर एक 20-30 मिनट का,
> घर पर आपके फ़ोन से। हफ़्ते में दो बार 10 मिनट का एक "जाँच राउंड" भी होगा। इसमें कुछ सवाल होंगे, कोई पढ़ाई नहीं, यह देखने
> के लिए कि बच्चे को अभी भी क्या याद है। टीचर एक AI है, और पूछने पर हमेशा यही बताएगी।
>
> **क्यों:** यह जानने के लिए कि जब Taxila कहती है कि आपके बच्चे ने कुछ *सीख लिया* है, तो क्या वह सही है। सीख लेने का मतलब है कि
> बच्चा कुछ दिन बाद भी, नए सवाल में, बिना मदद के उसे कर पाए। हम यह भी देखते हैं कि बच्चे के जवाब देने का तरीक़ा (शुरू करने में
> कितना समय लगा, कहाँ रुका) टीचर को यह समझने में मदद करता है या नहीं कि जवाब पक्का है। यह दूसरा हिस्सा आवाज़-अध्ययन के पन्ने में
> लिखा है, और उसका चुनाव अलग है।
>
> **हम क्या रिकॉर्ड करते हैं:**
> - बच्चे के जवाब और पाठ का लिखा हुआ रूप;
> - जाँच राउंड के जवाब;
> - आवाज़ की रिकॉर्डिंग, सिर्फ़ तब जब आप आवाज़-अध्ययन में V3 पर निशान लगाएँ।
>
> **हम क्या नहीं करते:**
> - भावनाएँ या मूड पहचानने की कोशिश नहीं करते;
> - बच्चे को कोई अंक नहीं दिखाते;
> - दूसरे बच्चों से तुलना नहीं करते;
> - कुछ भी विज्ञापन के लिए इस्तेमाल नहीं करते।
>
> **जवाब कौन देखता है:** दो प्रशिक्षित लोग जाँच राउंड के जवाब जाँचते हैं, बिना यह जाने कि जवाब किस बच्चे का है या Taxila ने क्या
> अनुमान लगाया था।
>
> **कहाँ रखा जाता है:** एन्क्रिप्ट करके, भारत में (Microsoft Azure, Central India / South India)। लिखा हुआ रूप अध्ययन ख़त्म होने के
> 90 दिन बाद मिटा दिया जाता है। ऐसे अंक, जिनसे बच्चे की पहचान नहीं हो सकती (जैसे "सही जवाब: हाँ/नहीं"), Taxila को बेहतर बनाने के
> लिए रखे जाते हैं।
>
> **आपके चुनाव** (हर एक अलग है; हर एक को कभी भी Controls में या [संपर्क] पर संदेश भेजकर वापस लिया जा सकता है):
>
> ☐ L1 मेरा बच्चा ऊपर लिखे पाठों और जाँच राउंड में भाग ले सकता है
> ☐ L2 Taxila इस अध्ययन के बिना-पहचान वाले अंक रख सकती है, ताकि वह बेहतर तय कर सके कि बच्चे ने क्या सीखा
>
> L2 के लिए "नहीं" कहने से L1 पर कोई असर नहीं पड़ता। सहमति वापस लेने पर, जो डेटा अभी बिना-पहचान का नहीं हुआ है, वह 24 घंटे में
> मिटा दिया जाता है। सवाल या शिकायत: [नाम, फ़ोन, ईमेल]। सूचना संस्करण: v1-pilot-1।

### 3.3 Child assent

A parent or a neutral narrator reads it, never the tutor's voice. These are the points it must cover, not a script; it is
said in the child's language.

**English points:**
- you will do some lessons with an AI teacher, and twice a week a few quick questions with no teaching;
- we want to see what you still remember a few days later. This is not a test about you: it is a test of whether the
  teacher is right;
- you can stop any time, and nothing bad happens;
- do you want to try? (yes / no, recorded)

**हिन्दी के मुद्दे:**
- तुम एक AI टीचर के साथ कुछ पाठ करोगे, और हफ़्ते में दो बार कुछ छोटे सवाल होंगे, जिनमें पढ़ाई नहीं होगी;
- हम देखना चाहते हैं कि कुछ दिन बाद तुम्हें क्या याद रहता है। यह तुम्हारी परीक्षा नहीं है: यह देखने के लिए है कि टीचर सही है
  या नहीं;
- तुम कभी भी रुक सकते हो, और कुछ बुरा नहीं होगा;
- क्या तुम आज़माना चाहोगे? (हाँ / नहीं, लिखा जाएगा)

## 4. What runs

### 4.1 The product (unchanged from production, plus these preconditions)

The lessons are the real product, as shipped after these land:
- the V1 patches: grading (`patches/V1-01..06`) and moving on (`V1-10..12`);
- the parts data adjudicated by a human (`patches/V1-05-kits-parts-data.md`).

Signals run in shadow (L0), so they are logged and never acted on: "measure before you intervene", SPEC §6.3. The
product's predicted P(correct) is written to a **frozen prediction log** at the moment each check round is generated.
The log is hashed and timestamped before the child answers.

### 4.2 Check rounds (research mode; it must be built, see §7)

A check round is a 10-minute session with the same teacher voice and **no teaching, no hints and no feedback during
the round**. A short "thank you, well done for trying" ends it. Items come from a **sealed check bank**:
- isomorphs of each skill: new numbers or a new context, same skill;
- blind-solved and verified by two raters;
- never shown in lessons, and never shown twice to the same child.

The items in a round, at most 12:

1. Every skill the product marked **secure** since its last check round, 2 items each (V1.6a; one also feeds V1.6b).
2. A stratified random sample of the child's other practised skills, spread over the product's predicted-P deciles. It
   fills the calibration range for V1.6b and gives the false-negative view (a skill the product did not call secure
   that the child can do).
3. Each item asked as the product asks it: spoken or typed, numeric or open.

**Timing.**

| when | what |
|---|---|
| days 1-21 | about 12 product lessons (4 a week) on the child's own class topics: maths, plus one science topic |
| days 3, 7, 10, 14, 17, 21 | check rounds (twice a week) |
| day 28 | a final round: every skill ever marked secure, again in a new form (durability, 7+ days) |

So a skill is checked at least 2 days after the lesson that anchored it (V1.3) and again 7 or more days after that.

### 4.3 Grading the check rounds

- **Numeric and choice items** are graded in code with the V1 number reader (`server/grading/spoken-number.js`).
  10% are also audited by the raters.
- **Every open answer** is graded by two raters. They are blind to the child, the product's prediction, the skill's
  status and each other.
  - Labels: correct / partial / incorrect / no answer.
  - Disagreements go to a third rater.
  - Agreement is reported as Cohen's κ. Bar: ≥ 0.8 on correct vs not-correct, or the rubric is fixed and the batch
    re-rated.
- **Real-speech V1.1.** The same raters grade a random 1,000 of the in-lesson graded answers, and the product's verdicts
  are compared with theirs. Any wrong grade gets a root cause in `evals/grading-truth`.

## 5. Analysis plan (pre-registered; hashed before the first session)

### 5.1 V1.6a: secure accuracy

- **Unit:** the first, unaided answer to a check item of a skill marked secure at round time.
- **Estimate:** mean accuracy, with a child-clustered percentile bootstrap (B = 2,000).
- **Pass rule:** the one-sided 95% lower bound ≥ 0.85.
- **Also reported:** accuracy at 7+ days (day-28 round) per band, per subject and per item kind.

### 5.2 V1.6b: calibration

- **Predictor:** the frozen P(correct) that the shipped product, including its calibration map, logged for that item
  at round generation.
- **Measures:** ECE over 10 equal-width bins, a reliability curve, and calibration intercept and slope (logistic
  recalibration), each with a child-clustered 95% CI.
- **Pass rule:** stage 1, ECE ≤ 0.05 at the point estimate and the CI upper bound ≤ 0.08. Stage 2 adds the slope CI
  inside [0.8, 1.2]; §6 explains why the slope waits for about 2,400 outcomes.
- **No fitting on the test data.** The product's calibration map ships before the pilot, fitted on the simulator.
  Because that encodes simulator assumptions, it is only a placeholder. A map refitted on pilot data is a stage-2
  artifact, scored on stage-2 children only.

### 5.3 V2.4: added value of signals

- **Outcome:** a correct first try on a check item.
- **Model A (text + task):** pL, item b − θ, hint rung, the Tier-T text bits.
- **Model B:** A plus the voice and behaviour signals (`server/signals`, `voicesig`).
- **Fitting:** both are fitted with 5-fold cross-fitting, folds split by child.
- **Measure:** ΔAUROC with a child-clustered bootstrap 95% CI.
- **Pass rule:** the CI excludes 0.
- **Expected precision.** Simulated, from `evals/voicesig/simulate-pilot.mjs --power` under its assumed effect, 12 reps,
  2026-10-05: the median CI95 half-width is 0.043 at 40 children, 0.028 at 100 and 0.020 at 200. So stage 1 detects
  ΔAUROC only if the true effect is ≥ about 0.05. These are simulated numbers, not findings.

### 5.4 V1.4 on real traces (observable definitions)

- **Overload:** in one skill-session, ≥ 10 answers without 3 right in a row.
- **Boredom proxy:** in one skill-session, ≥ 3 consecutive first-try unaided correct answers on items whose skill the
  next check round also shows as correct. True boredom needs the child's true P, which no real trace has, so this
  proxy is labelled as one.
- **Bar for both:** ≤ 5% of skill-sessions, child-clustered CI reported.

### 5.5 Stopping rules

- **Stop the study:** any safety-floor breach (a helpline not shown, a denial of being an AI). Then root cause and fix
  before restarting.
- **Pause a child:** if the parent reports distress connected to the study.
- **No early stopping for efficacy.**

## 6. Sample size and power

Monte Carlo (`evals/mastery-calibration/power.mjs`, 2026-10-05, 300 simulations per cell). Assumptions:
- children differ in their true accuracy (logit SD 0.6 between children);
- the one-sided 95% lower bound is a child-clustered percentile bootstrap.

"Checks per child" counts the secure-skill check items a child contributes over the 3 weeks.

**V1.6a power**: the share of simulated pilots whose one-sided 95% lower bound is above 0.85.

| true secure accuracy | checks per child | 20 children | 30 | 40 | 60 | 80 |
|---|---|---|---|---|---|---|
| 0.88 | 4 | 0.14 | 0.17 | 0.17 | 0.18 | 0.17 |
| 0.88 | 8 | 0.16 | 0.17 | 0.24 | 0.29 | 0.28 |
| 0.90 | 4 | 0.31 | 0.37 | 0.33 | 0.54 | 0.64 |
| 0.90 | 8 | 0.40 | 0.48 | 0.59 | 0.74 | 0.78 |
| 0.93 | 4 | 0.65 | 0.73 | 0.86 | 0.96 | 0.98 |
| 0.93 | 8 | 0.82 | 0.92 | **0.98** | 0.99 | 1.00 |
| 0.95 | 4 | 0.88 | 0.98 | 0.98 | 1.00 | 1.00 |
| 0.95 | 8 | 0.97 | 0.99 | 1.00 | 1.00 | 1.00 |

**V1.6b**: measured ECE when the predictor is perfectly calibrated (its noise floor), and when it is truly off.
- The "off" predictor's true logit is 0.65 × the predicted logit: overconfident, with a true ECE of about 0.058.
- 120 simulations per cell, predictions uniform in 0.30-0.95.
- The slope test passes when the slope's 95% bootstrap CI lies inside [0.8, 1.2].

| outcomes n | calibrated: median ECE | calibrated: P(ECE ≤ 0.05) | calibrated: slope test passes | off: median ECE | off: P(ECE ≤ 0.05) (false pass) |
|---|---|---|---|---|---|
| 150 | 0.077 | 0.13 | 0.00 | 0.092 | 0.03 |
| 300 | 0.051 | 0.48 | 0.00 | 0.076 | 0.07 |
| 600 | 0.039 | 0.80 | 0.06 | 0.065 | 0.13 |
| 1,200 | 0.027 | **0.99** | 0.43 | 0.059 | 0.18 |
| 2,400 | 0.018 | 1.00 | **0.90** | 0.058 | 0.18 |

**Reading.**
- V1.6a is decidable at 40 children only if the product is genuinely good: a true secure accuracy of about 0.93 or more.
  At 0.90 even 80 children pass only 78% of the time, and at 0.88 the pilot cannot tell the product from the bar.
- For V1.6b, ECE ≤ 0.05 is near its own noise floor below about 1,200 outcomes. Even at 2,400, a predictor that is truly
  off by about 0.06 passes 18% of the time, because the bar sits so close to it.
- So the pre-registered V1.6b rule is:
  - **stage 1 (≥ 1,200 outcomes):** ECE ≤ 0.05 with the CI upper bound ≤ 0.08;
  - **stage 2 (≥ 2,400 outcomes):** the calibration-slope CI inside [0.8, 1.2] as well.
  A stage-1 pass is reported as "calibrated within the pilot's resolution", never as more.

**Recommendation.**
- **Stage 1: 40 children, 8 secure-skill checks each.**
  - That is enough for V1.6a if the product's true secure accuracy is about 0.93 or better.
  - With about 30 check items per child in total, it gives the ~1,200 outcomes that V1.6b needs.
- **Stage 2: extend to 80 children.** Do this if the stage-1 estimate falls between 0.86 and 0.92, where 40 children
  cannot separate it from 0.85. Extend to 100-200 children for V2.4.

## 7. What must exist before day 1 (engineering)

1. The V1 patches merged and deployed (grading and moving on), with the gates green.
2. **The check-round mode.**
   - A purpose `check` lesson start: no teaching, no hints, no feedback.
   - The frozen prediction log (`check_prediction` rows: child, item, P, model version, hash).
   - The rater export: blind CSV with the child id replaced by a random round id.
3. **The sealed check bank.**
   - For every skill in the pilot topics: ≥ 4 isomorphs, blind-solved and two-rater verified, kept out of `data/kits`
     practice queues.
   - Today 59 of 424 class 4-7 maths skills (14%) have no check-kind item at all, and 132 (31%) have only one
     (`evals/mastery-calibration`, kit census 2026-10-05). The bank therefore has to be generated and verified. It is a
     content job; RS-6 owns the kits.
4. The calibration map shipped with its version, and a placeholder flag shown on the status page.
5. The rater manual (labels only, no feeling words, linted) and a 30-answer calibration set for the raters.

## 8. What the owner must do

| # | task | when |
|---|---|---|
| 1 | Recruit 40 families (≥ 16 per band; mixed home language), and name the person who explains consent (never the tutor) | before day 1 |
| 2 | File the IEC/counsel amendment with this protocol and the voice SPEC §6.3. Have the consent copy finalised by a person, the Hindi by a native speaker | before day 1 |
| 3 | Appoint 2 blind raters (+1 adjudicator). About 6-8 hours each over the study [E], from about 1,200 check answers and 1,000 audit answers at about 15 s each, double-rated | week 0 |
| 4 | Approve the pre-registration (this file's §5) and sign off its hash | week 0 |
| 5 | Approve the Azure spend for lessons and check rounds, at the MODEL-STACK lesson-hour budget (about 40 children × 15 hours) | week 0 |
| 6 | Make sure every family has a working phone and that the parent knows the stop button and the Controls page | day 0 |
| 7 | A weekly 15-minute look at the safety log and withdrawals; decide stage 2 at day 28 | weekly |

## 9. Data handling

- Rows hold numbers, verdicts and outcomes. Transcripts are an evaluation copy only, deleted at study end + 90 days.
- Audio exists only under voice consent V3, and follows SPEC §6.3.
- Raters see the answer text and the item with no child identity.
- Analysis code reads pseudonymous ids only.
- The real-child rows feed `evals/mastery-calibration/analyze.mjs` and `evals/voicesig/harness.mjs` through the formats
  documented with each harness. A row from the simulator carries `sim: true`, and no fitting script accepts it.
