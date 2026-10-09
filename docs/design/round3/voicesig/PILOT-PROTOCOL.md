# Voice signals: the consented real-child pilot (protocol vs-pilot-2, for the owner to run)

Status: written 2026-10-09, before any child data exists. The bars in §6 are frozen in code
(`evals/voicesig/r3/pilot_score.mjs` `BARS`, a unit test pins them); changing one after data arrives is a reviewed diff with
a new date and a stated reason, never a quiet edit. Supersedes the draft in `docs/design/voice-signals/SPEC.md` §6.3 where
they differ (that draft named AWS; this one is Azure-only).

What the pilot decides, and nothing more:
1. **Filled-pause detector on children**: is its precision on real children's lesson speech ≥ 0.80?
2. **Thinking-pause cue on children**: when it says "the child is pausing to think", does the child go on ≥ 85% of the time?
3. **Knowledge states**: for each of the eight states, is its precision against its own outcome ≥ 0.80 (the gate's bar,
   `server/voicesig/gate.js`)? A state that passes may be proposed for ladder L1 (a reviewed diff naming the measurement).
4. **What voice would have changed**: how often the shadow plan differs from what she did (`vs_diff.changed`), as the
   input to the later A/B (VS-A13). Reported, no bar.

It does **not** decide whether voice improves learning (that needs the flywheel A/B, ≥ 200 children; SPEC §4.3), and a
convenience sample of families the owner knows cannot stand for India's children. Every result says so.

---

## 1. Who

| | |
|---|---|
| children | **32 enrolled** (target 30 completing): **ages 9-14**, at least **14 aged 9-10** and **14 aged 11-14** |
| language mix | at least 8 Hindi-dominant, 8 Hinglish, 8 English-medium (the parent's description; the lesson's `langMode` is also logged) |
| devices | the family's own phone or tablet; at least 3 phone models; at least 5 children on a wired headset; **no Bluetooth headsets** (the detector is off on narrowband routes: AMI capture check, event recall 0.15) |
| exclusions | none on speech. A child with a known speech or language difference is welcome; the parent may tell us (a flag for the fairness breakdown, never a requirement) |
| bias, named | the owner's acquaintances: likely urban, English-heavier, better devices. Every number carries this sentence |

Why 32: §6.4.

## 2. Ethics, consent, safety (before anyone records anything)

- **Review first.** The owner sends this protocol and the consent text to an independent ethics committee (IEC) or
  counsel and gets written approval before the first session. DPDP Act s.9: processing a child's personal data needs the
  verifiable consent of the parent; this pilot records voice, which is personal data.
- **A person explains it**, not the tutor, and answers questions. Saying no has no consequence; no payment depends on
  performance (a flat thank-you is fine).
- **Two things are recorded only with their own tick** (§3): the audio (V3) and the use of numbers to improve Taxila (V4).
  A family can join with V1 only (no recording); then the child's sessions give device numbers and outcomes, not coder
  marks (they count for §6.3 states, not §6.1-6.2).
- **Safety floor unchanged.** `scanSafety` and the model distress read run on every committed turn exactly as in the
  product; a safeguarding concern stops the session and the product's hand-off runs (Childline **1098**, Tele-MANAS
  **14416**, shown to the parent). The coordinator then deletes that session's recording on the device unrecovered, and
  nothing from it is coded or scored.
- **Stopping.** The child may stop any session at any time ("ruko", "band karo", or the stop button); the lesson's stop
  check-in runs once and the session ends with no follow-up. A parent is in the room for every session.
- **Never**: an emotion, mood or confidence label for any child, in coding, analysis or reports (Microsoft restriction 12;
  the coding manual's vocabulary is linted like the code). Nothing is shown to the child or the parent as a score.

## 3. Consent text for parents (English; the Hindi version follows; a person and counsel finalise both, version vs-pilot-2)

> **Taxila voice study: what we are asking**
>
> Your child will do three short lessons (about 20-30 minutes each) with Taxila's AI teacher over about 10 days, on your
> phone, at home, with you in the room. The teacher is an AI and will say so if asked.
>
> **Why:** we want to learn whether *how* a child answers (how long they take to start, pauses, "umm"s, speaking pace)
> helps an AI teacher know when to wait, when to ask "how did you work that out?", and when an answer needs another look
> a few days later. We check this against the answers your child gives later, not against how your child sounds.
>
> **What we record (only if you tick V3):** the lesson audio picked up by your phone's microphone (your child's voice,
> and the teacher's voice where the microphone hears it), saved on your phone at the end of each lesson. A study
> coordinator moves the two files to Taxila's private storage on Microsoft Azure in India, then deletes them from your
> phone. While it records, the screen shows "study recording".
>
> **What we always keep for every lesson (as Taxila already does):** your child's answers and the teacher's replies, and
> numbers the phone computes from the voice (timings and counts, never the sound itself).
>
> **What we do not do:** we do not try to detect emotions or mood. We do not identify your child by voice. Nothing is
> shown to you or your child as a score. Nothing is used for advertising. Nothing is sold or shared outside the Taxila
> study team.
>
> **Who listens:** two trained listeners from the study team mark, on the recording, when your child says "umm"/"aaa",
> when they pause and whether they went on. They do not see your child's name.
>
> **How long:** recordings are deleted 90 days after the study ends. Numbers that cannot identify your child are kept to
> improve Taxila.
>
> **Your choices (each one separate; each can be withdrawn any time by messaging [coordinator contact] or in Controls →
> Voice):**
> ☐ **V1** Taxila may analyse how answers are given, on the phone, during lessons (numbers only)
> ☐ **V2** Taxila may remember my child's usual answering pace between lessons
> ☐ **V3** Record these three study lessons, and use the recordings for this research as described above
> ☐ **V4** Use the numbers from lessons (never recordings) to improve how Taxila reads answers
>
> Saying no to any box does not affect anything else. Withdrawing deletes what has not yet been made anonymous within
> 24 hours (recordings: at once).
> Questions or complaints: [name, phone, email]. Study approved by: [IEC name, reference]. Notice version: vs-pilot-2.

**हिंदी (अनुवाद का मसौदा; भेजने से पहले किसी हिंदी-भाषी व्यक्ति और वकील से जाँच कराएँ):**

> **Taxila आवाज़ अध्ययन: हम क्या माँग रहे हैं**
>
> आपका बच्चा लगभग 10 दिनों में Taxila की AI शिक्षिका के साथ तीन छोटे पाठ (हर पाठ लगभग 20-30 मिनट) करेगा — आपके फ़ोन
> पर, घर पर, आपकी मौजूदगी में। शिक्षिका एक AI है और पूछने पर यह बताएगी।
>
> **क्यों:** हम समझना चाहते हैं कि बच्चा *कैसे* जवाब देता है (शुरू करने में कितना समय, रुकना, "उम्म", बोलने की गति) —
> क्या इससे AI शिक्षिका को पता चल सकता है कि कब रुकना है, कब पूछना है "आपने यह कैसे सोचा?", और कब किसी जवाब को कुछ दिन
> बाद फिर देखना है। इसे हम आपके बच्चे के बाद के जवाबों से जाँचते हैं, इससे नहीं कि बच्चा कैसा सुनाई देता है।
>
> **हम क्या रिकॉर्ड करते हैं (केवल V3 पर टिक करने पर):** फ़ोन के माइक्रोफ़ोन से पाठ की आवाज़ (आपके बच्चे की आवाज़, और
> जहाँ माइक सुने वहाँ शिक्षिका की आवाज़), जो हर पाठ के अंत में आपके फ़ोन पर सेव होती है। अध्ययन समन्वयक दोनों फ़ाइलें
> भारत में Microsoft Azure पर Taxila के निजी स्टोरेज में डालकर आपके फ़ोन से हटा देंगे। रिकॉर्डिंग के दौरान स्क्रीन पर
> "study recording" दिखता रहेगा।
>
> **हम क्या नहीं करते:** हम भावनाएँ या मूड पहचानने की कोशिश नहीं करते। हम आवाज़ से आपके बच्चे की पहचान नहीं करते।
> आपको या बच्चे को कोई स्कोर नहीं दिखाया जाता। विज्ञापन के लिए कुछ उपयोग नहीं होता। Taxila अध्ययन टीम के बाहर कुछ
> बेचा या साझा नहीं किया जाता।
>
> **कौन सुनता है:** अध्ययन टीम के दो प्रशिक्षित लोग रिकॉर्डिंग पर निशान लगाते हैं कि बच्चे ने कब "उम्म/आ" कहा, कब
> रुका और क्या उसने बात आगे बढ़ाई। उन्हें बच्चे का नाम नहीं दिखता।
>
> **कितने समय तक:** अध्ययन ख़त्म होने के 90 दिन बाद रिकॉर्डिंग मिटा दी जाती हैं। ऐसे आँकड़े जिनसे बच्चे की पहचान न हो,
> Taxila को बेहतर बनाने के लिए रखे जाते हैं।
>
> **आपके विकल्प (हर एक अलग; कभी भी वापस ले सकते हैं — [समन्वयक संपर्क] पर संदेश भेजकर या Controls → Voice में):**
> ☐ **V1** पाठ के दौरान, फ़ोन पर, Taxila जवाब देने के तरीके का विश्लेषण कर सकता है (केवल आँकड़े)
> ☐ **V2** Taxila पाठों के बीच मेरे बच्चे की सामान्य जवाब-गति याद रख सकता है
> ☐ **V3** इन तीन अध्ययन पाठों को रिकॉर्ड करें और ऊपर बताए अनुसार शोध के लिए उपयोग करें
> ☐ **V4** पाठों के आँकड़ों (कभी रिकॉर्डिंग नहीं) का उपयोग Taxila के जवाब पढ़ने के तरीके को बेहतर बनाने के लिए करें
>
> किसी भी विकल्प को "नहीं" कहने से बाकी कुछ नहीं बदलता। वापस लेने पर जो अभी गुमनाम नहीं हुआ, वह 24 घंटे में मिटा दिया
> जाता है (रिकॉर्डिंग: तुरंत)। प्रश्न या शिकायत: [नाम, फ़ोन, ईमेल]। अध्ययन की स्वीकृति: [IEC नाम, संदर्भ]। सूचना संस्करण:
> vs-pilot-2।

**Child assent** (read by the parent in the child's language, never in the tutor's voice; written as points, not lines):
- you will do three lessons with the AI teacher, and the phone records them;
- the people who made Taxila will listen to the recording to learn when the teacher should wait for you;
- nobody is guessing your feelings, and nobody gives you a score;
- you can stop any time by saying "ruko" or pressing stop, and nothing bad happens;
- do you want to try? (the parent records yes / no; no means no session today).

## 4. What to record, and how (the owner's runbook)

**Before the first session (once per child):**
1. The child has a Taxila account under a dedicated pilot guardian or the family's own; core consents as in the product.
2. The parent signs §3 on paper or a form; the coordinator writes the child's study code `P01`…`P32` on it and keeps the
   code ↔ name list offline, separately from everything else.
3. The parent turns on **Controls → Voice → "Remember answering pace"** only if they ticked V2.

**Each session (S1 day 0, S2 day 2-3, S3 day 7-10):**
1. Wired headset or the phone's own mic; no Bluetooth; a quiet room; the parent present.
2. Open the lesson link with `?vspilot=P07-S1` (child code + session number; anything else is ignored). The "study
   recording" badge must be visible. If it is not, stop: nothing is being recorded.
3. The coordinator starts the lesson from the session script (§5) and stays in the background.
4. At the end, the phone offers two downloads: `taxila-pilot-P07-S1-<time>.wav` (16 kHz mono) and the `.json` sidecar
   (numbers: clock, the device's per-turn kv, her audible spans). Keep both.
5. Open `?vspilot=0` once at the end of the day so the device stops recording.
6. Upload the two files to the study's private Azure Storage container (India region), e.g.
   `az storage blob upload --account-name <study account> --container-name voicesig-pilot --name P07/S1/<file> --file <file> --auth-mode login`
   (the container is private; access by Entra ID login, no public URL, no SAS longer than 7 days); then delete the files
   from the phone and the coordinator's laptop.

**What is recorded where:**

| what | where | for | kept |
|---|---|---|---|
| P-track audio (the exact input the product analyses) | PilotRecorder → coordinator → private Azure container, India | coder marks; re-running the detector and cue offline (pilot features = product features) | study end + 90 days |
| sidecar (clock segments, per-turn kv numbers, her audible spans) | same | aligning device numbers to the audio | with the audio, then numbers only |
| lesson turns, verdicts, brain_trace codes (`vs.*`, `vs_would.*`, `vs_diff.*`, `vs_hold.fired`) | Taxila database (as for every lesson; brain_trace rows expire after 90 days, so export within 60) | states, outcomes, the shadow comparison | product retention |
| coder marks | study folder (no names) | truth for §6.1-6.2 | with the numbers |
| outcomes (recognition probe after an IDK, the same wrong answer coming back, S2/S3 delayed + transfer results, re-ask agreement) | the lesson's own grading rows + the scripted retests | truth for §6.3 | product retention |

## 5. Session script (items from `data/kits/**` with blind-solved keys)

| session | when | content | truth it produces |
|---|---|---|---|
| S1 | day 0 | 2 min mic check (one read-aloud sentence for the baseline seed); 4 blocks × 10 items at the child's class (maths facts and procedures, a science concept, vocabulary / SST fact); **every item asks for a spoken answer**; after an IDK the two-option recognition probe follows at once; after a wrong answer the corrective feedback, and the same item returns at the end of the block | O2 (recognition), O3 (in-session persistence), all voice numbers |
| S2 | day 2-3 | every S1 item again (same surface) + one isomorphic transfer variant per skill; 6 fresh items | O1 (delayed + transfer), O3 (delayed persistence) |
| S3 | day 7-10 | a new transfer variant per skill; 6 fresh items | O1 at the longer lag (primary for `fragileCorrect` / `fluentRecall`) |

Rules: everything voice-related stays **shadow** during the pilot (the product default): what voice would have changed is
logged, never acted on, so the outcomes are not contaminated by voice-driven moves ("measure before you intervene"). The
recognition probe and corrective feedback are scripted and the same for every child.

## 6. The bars (frozen; `pilot_score.mjs` applies them)

Truth sources: two blind coders mark, on the P-track audio with verdicts and outcomes hidden, **fillers** (start / end;
"umm", "aaa", "uh", Hindi "अ…", "उम्म" — vowel-or-nasal sounds with no lexical meaning; lexical planners like "matlab",
"woh" are marked as a separate class and are NOT counted as fillers here) and every **child pause ≥ 250 ms** with whether
the child **continued** (spoke again before the teacher did) or **ended** (the teacher spoke next, or 5 s passed).
Coder A codes 100%; coder B double-codes a random 25% of sessions.

| # | what | bar (all child-clustered, 2,000-sample percentile bootstrap) | minimum evidence |
|---|---|---|---|
| 6.0 | coding is trustworthy | coder-coder filler event F1 ≥ 0.80 on the double-coded sessions. Below it, 6.1 and 6.2 are **not judgeable** (the truth is the bottleneck), not failed | ≥ 8 double-coded sessions |
| 6.1 | filler detector, event level (a run ≥ 200 ms of p ≥ thr over speech, outside her audible spans, counts once; true when it overlaps a coder filler) | precision ≥ **0.80** AND lower 95% bound ≥ **0.72**; in every age band and language mode with ≥ 50 runs, precision ≥ 0.75. Recall reported (no bar) | ≥ 300 runs from ≥ 20 children |
| 6.2 | thinking-pause cue (fired reads matched to the coder's pause label within 400 ms) | P(continued \| fired) ≥ **0.85** AND lower bound ≥ **0.75**; fires at ≤ 5% of the pauses the coder marked "ended" | ≥ 100 fired pauses from ≥ 15 children |
| 6.3 | each knowledge state, against its own outcome (fragileCorrect: delayed / transfer FAILED; fluentRecall: delayed SUCCEEDED; searching: recognition SUCCEEDED; absent: recognition FAILED; heldBelief: same wrong answer CAME BACK; rapidGuess: re-ask DISAGREED; effortfulGuess: the scaffolded retry SUCCEEDED; workingAloud: the child went on to answer within the wait) | precision ≥ **0.80** (the gate) AND lower bound ≥ **0.70**; no child > 10% of the state's firings | ≥ 100 firings from ≥ 20 children |
| 6.4 | the shadow comparison | `vs_diff.changed` share of turns with a would-hint, per state; reported, no bar | all |

A component or state that misses its bar stays shadow; that is a result, not a failure of the study. A state that passes
is proposed for L1 in a reviewed diff (`server/voicesig/gate.js` EVIDENCE row with population "children", n, method,
date, CI; `ladder.js` row with the measurement id). Nothing goes live automatically.

### 6.4 How many children, and why 32

- Precision near 0.80 measured to ±0.05 (95%) needs about 1.96² × 0.8 × 0.2 / 0.05² ≈ **246 independent events**.
- Events cluster by child. With about 15-25 runs per child and an intra-child correlation of 0.05-0.10 [E], the design
  effect is 1 + (m − 1) × ICC ≈ 1.7-3.4, so **≈ 420-840 runs** are needed; the minimum of 300 with the lower-bound rule
  (0.72) is what makes a point estimate of ≈ 0.80 pass only when the spread allows it.
- Expected yield [E, to be checked after the first 4 children]: about 60 spoken answers per child per S1, 40 per S2/S3 →
  ~140 child turns per child; fillers at ~5-15 per 100 child turns (children produce more on wrong and slow answers,
  West et al. 2025) → **~10-20 detector runs per child**; 30 completing children → **300-600 runs**. That clears the minimum
  and lands in the needed range only at the upper end, which is why the enrolment is 32, not 20.
- Knowledge states: fragileCorrect fires about 1 in 8 turns in shadow [U, SPEC R9] → ~17 per child → ~500 total, enough
  for 6.3; rarer states (absent, rapidGuess, workingAloud) will likely not reach 100 firings in this pilot and will be
  reported as "too few" — honestly, not as a pass.
- **Stop-early rule:** after the first 8 children, compute 6.0 only (coder agreement). If it is below 0.70, fix the coding
  manual before continuing; no detector or cue number is looked at before 20 children have finished S3.

## 7. Running the scorer

```
node evals/voicesig/r3/pilot_score.mjs <study folder> --model models/voicesig/filler-gru-r3.onnx --out <study folder>/pilot-score.json
```
Folder layout and file formats are in the script's header. The output names, for each bar, the estimate, the bootstrap
interval, n, the number of children, pass/fail, and the per-group breakdown. The label in the output says "children",
"consented pilot", and the method, so the number can go into `context/measurements.md` as it stands.

## 8. What this protocol cannot answer (said up front)

- Whether voice-driven moves improve learning (needs the A/B on the flywheel, ≥ 200 children, VS-A13).
- Whether the result holds for children unlike the convenience sample (rural, low-end phones, other languages).
- Bluetooth and speakerphone routes (excluded; the detector is off there).
- Whether "umm"-type fillers in Indian children's English differ from Hindi fillers (both are coded; the per-language
  breakdown in 6.1 is the only look this pilot gives).
