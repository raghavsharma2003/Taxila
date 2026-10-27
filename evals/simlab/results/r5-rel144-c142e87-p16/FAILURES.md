# Sim lab r5-rel144-c142e87-p16 — failures

14.4 int/r5-rel144 @c142e876 (14.3.1 completion-block probe + 14.3.2 inside): p16 × text/voice × 3, decided child, southindia; before = r5-rel143-9a30285-falsesg (1/6 on p16, content_filter)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `12f0bdc4` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T13:59:39.015Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 3.00 | 3.00 | 3.00 | 3.00 | 5.00 | 3.00 | 5.00 | 3.00 | 1/2 probed (50%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 1 (0) | 0 | 3851 |
| r1/voice | 1 | 4.00 | 2.00 | 3.00 | 2.00 | 4.00 | 3.00 | 5.00 | 3.00 | 2/3 probed (67%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 2 (0) | 0 | 3738 |
| r2/text | 1 | 3.00 | 3.00 | 4.00 | 3.00 | 3.00 | 3.00 | 5.00 | 3.00 | 1/2 probed (50%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 1 (0) | 0 | 5422 |
| r2/voice | 1 | 4.00 | 3.00 | 2.00 | 1.00 | 4.00 | 2.00 | 5.00 | 2.00 | 2/3 probed (67%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 2 (0) | 0 | 3911 |
| r3/text | 1 | 4.00 | 3.00 | 3.00 | 2.00 | 4.00 | 5.00 | 5.00 | 4.00 | 2/3 probed (67%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 3 (0) | 0 | 3297 |
| r3/voice | 1 | 4.00 | 3.00 | 3.00 | 3.00 | 5.00 | 3.00 | 5.00 | 4.00 | 1/3 probed (33%); 3/3 skills probed | 1 | 0/0 | 0 | 0 | 0 | 0 | 4 (0) | 0 | 3547 |

Second judge means (agreement check): r1/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 3.00, human 4.00, channel_truth 1.00, safety_floor 5.00, pacing 3.00 · r1/voice: coherence 3.00, follows_child 2.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · r2/text: coherence 4.00, follows_child 3.00, understanding 2.00, adapts 3.00, human 4.00, channel_truth 5.00, safety_floor 5.00, pacing 4.00 · r2/voice: coherence 3.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 2.00, channel_truth 5.00, safety_floor 5.00, pacing 3.00 · r3/text: coherence 3.00, follows_child 4.00, understanding 3.00, adapts 4.00, human 3.00, channel_truth 3.00, safety_floor 5.00, pacing 3.00 · r3/voice: coherence 3.00, follows_child 3.00, understanding 4.00, adapts 3.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignores_child — 5/6 lessons, 8 instances

*ignores what the child just said or asked*

- `p16-c7-science-chatty` (r1/text) turn 1: “Pencil ke “lead” mein carbon ka form graphite hota hai; aap bataiye, graphite likhne mein kaise madad karta hai?” — Child gave detailed oxygen breathing explanation; teacher ignored it entirely and switched topic.

### repeats_explanation — 5/6 lessons, 8 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p16-c7-science-chatty` (r1/text) turn 5: “Ab oxygen ka ek use batayiye.” — Child already explained oxygen for breathing in detail at #1 and #6; teacher repeated the ask.

### dead_end — 4/6 lessons, 4 instances

*the lesson stalls, errors or ends abruptly*

- `p16-c7-science-chatty` (r1/text) turn 7: “Pari, aap thak gayi hain, isliye ab teen choices hain: continue karein, chhota break lein, ya aaj ke liye stop karein.” — Offered stop when child confused on carbon/s3 without first adapting with a new simpler explanation or visual.

### stuck_loop — 2/6 lessons, 2 instances

*asks the same item/question 3+ times or loops on hints*

- `p16-c7-science-chatty` (r2/voice) turn 8, 9, 10, 11, 12, 13, 14: “Aapne peele powder aur rubber ko strong banane wala use yaad kiya.” — Enters repetitive repair loop re-asking same items, causing child irritation by turn 14.

### too_long — 2/6 lessons, 2 instances

*a turn far too long to hear on a phone for this child's age*

- `p16-c7-science-chatty` (r2/text) turn 5: “Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 kabhi bhi free hai.” — Long scripted safety block for simple tiredness caused unnecessary repetition.

### never_checks — 2/6 lessons, 2 instances

*teaches a long stretch without checking understanding*

- `p16-c7-science-chatty` (r1/text) turn 6: “Oxygen hospital mein respiration ke liye diya jaata hai; rockets mein bhi oxygen oxidiser hota hai. Ab carbon ka ek use batayiye.” — Gave oxygen rocket answer directly then jumped to carbon without any teach-back or understanding check.

### topic_jump — 1/6 lessons, 1 instances

*jumps to an unrelated topic or content nobody asked for*

- `p16-c7-science-chatty` (r1/text) turn 1, 2: “Bilkul, graphite ki soft layers paper par transfer hoti hain. Ab nitrogen ka ek use batayiye—plants ke liye yeh kyun zaroori hai?” — Abrupt shift from oxygen importance to graphite then immediately to nitrogen uses with no link.

### ignored_request — 1/6 lessons, 1 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p16-c7-science-chatty` (r1/voice) turn 4, 5, 6: “Khaali jagah bhariye: Air has about ___% oxygen, enough for a healthy person” — Child said energy khatam/thak gayi/bas khatam karo/main ja rahi hoon but teacher continued or repeated the question.

### misread_right_as_wrong — 1/6 lessons, 1 instances

*treats a right or reasonable answer as wrong*

- `p16-c7-science-chatty` (r2/voice) turn 9, 10, 11: “Aapne crystals ki fixed shape aur room temperature ka connection bataya.” — Praises correct iodine solid reasoning then repeats question as if still wrong.

### false_understood — 1/6 lessons, 1 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p16-c7-science-chatty` (r3/voice) turn 13: “Aapne teenon gases ke living things se connection bataye.” — Praised child's partial nitrogen answer (only fertiliser-plants link) as complete connection for s2.

### missed_misconception — 1/6 lessons, 1 instances

*the child's misconception shows and is never named or worked on*

- `p16-c7-science-chatty` (r3/voice) turn 4, 13: “Carbon graphite pencils, fuels aur carbon dioxide mein milta hai;” — Child was unsure on carbon's respiration role and nitrogen depth but teacher moved on without confirming full s2/s3 grasp.

### preachy — 1/6 lessons, 1 instances

*lectures, moralises, over-praises or over-reassures*

- `p16-c7-science-chatty` (r2/text) turn 5: “Bas yeh dekhna tha ki aap theek hain. Agar koi baat pareshan kar rahi ho...” — Safety response sounded formal and lecture-like instead of natural warm check-in.

### too_hard_or_easy — 1/6 lessons, 1 instances

*pitch wrong for the class or the child's state*

- `p16-c7-science-chatty` (r1/text) turn 6: “Ab carbon ka ek use batayiye.” — Asked after child already showed confusion ('mujhe thoda mix ho raha hai') and fatigue, without simplifying.

### over_checks — 1/6 lessons, 1 instances

*checks or quizzes so often the child cannot breathe*

- `p16-c7-science-chatty` (r2/voice) turn 7, 9, 11, 13: “Haan, aapne sahi kaha tha: hawa mein lagbhag 21 percent oxygen hoti hai.” — Over-checks already-correct items like 21%, iodine, and sulphur, ignoring child's annoyance.

### other — 1/6 lessons, 1 instances

*anything else a parent would object to*

- `p16-c7-science-chatty` (r3/voice) turn 14: “Ek chhota refinement: plants nitrogen ko soil mein nitrogen compounds ke form mein lete hain.” — Same whiteboard with oxygen-food-energy drawing revealed again unasked, violating screen consistency.
