# Sim lab r5-rel144-9ad8666-p16voice — failures

14.4 @9ad86661: p16 voice x2, the science answer (cdac90c3 r1/voice: predicate on 'bina oxygen ke jee nahi sakte')

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `6e479ea6` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T18:25:32.232Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/voice | 1 | 3.00 | 2.00 | 4.00 | 2.00 | 4.00 | 3.00 | 5.00 | 3.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 4 (0) | 0 | 4925 |
| r2/voice | 1 | 4.00 | 3.00 | 3.00 | 2.00 | 4.00 | 2.00 | 5.00 | 3.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 4 (0) | 0 | 3895 |

Second judge means (agreement check): r1/voice: coherence 3.00, follows_child 2.00, understanding 3.00, adapts 2.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · r2/voice: coherence 4.00, follows_child 3.00, understanding 3.00, adapts 2.00, human 3.00, channel_truth 5.00, safety_floor 5.00, pacing 3.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignores_child — 2/2 lessons, 4 instances

*ignores what the child just said or asked*

- `p16-c7-science-chatty` (r1/voice) turn 1: “Aapne kal park mein Snowy naam ka white rabbit dekha—uski fluffy tail ka description bilkul clear tha.” — Child excitedly shared rabbit story and cartoons but teacher only briefly echoed before jumping to unrelated hospital oxygen.

### repeats_explanation — 2/2 lessons, 2 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p16-c7-science-chatty` (r1/voice) turn 5, 6: “Khaali jagah bhariye: Air has about ___% oxygen, enough for a healthy person” — Repeated the exact same fill-in question immediately after child gave the 21% answer instead of moving forward.

### stuck_loop — 2/2 lessons, 2 instances

*asks the same item/question 3+ times or loops on hints*

- `p16-c7-science-chatty` (r1/voice) turn 12, 13, 14: “Saans lene aur jalne ke liye kaunsi chahiye, aur doosri gas paudhon ke liye kya kaam karti hai?” — Teacher asked and re-asked the identical oxygen-vs-nitrogen question and board despite child giving full correct answer at turn 13.

### ignored_request — 1/2 lessons, 3 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p16-c7-science-chatty` (r1/voice) turn 5: “didi, bas thak gayi, itna padh liya, ab break le sakte hain?” — Child directly asked for a break due to tiredness; teacher verbally agreed then immediately repeated the identical oxygen % question.

### misread_right_as_wrong — 1/2 lessons, 1 instances

*treats a right or reasonable answer as wrong*

- `p16-c7-science-chatty` (r2/voice) turn 7, 8: “Aapne crystals ka clue pakda. Room temperature par lab mein iodine crystals sealed jar mein hain...” — Child correctly named solid with crystal and sublimation details yet teacher continued repair mode.

### robotic — 1/2 lessons, 1 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p16-c7-science-chatty` (r2/voice) turn 1, 2, 3, 5, 6, 9, 10, 11, 12, 13: “Bilkul, Pari—” — Near-identical opening phrase begins most turns, sounding scripted rather than spontaneous.

### too_long — 1/2 lessons, 1 instances

*a turn far too long to hear on a phone for this child's age*

- `p16-c7-science-chatty` (r1/voice) turn 5, 14: “Aap thak gayi hain, toh ab break lete hain.” — Acknowledged tiredness and suggested break at turn 5 but continued the full lesson for 9 more turns until child was annoyed.

### dead_end — 1/2 lessons, 1 instances

*the lesson stalls, errors or ends abruptly*

- `p16-c7-science-chatty` (r1/voice) turn 9: “Ab padhai band—Maggi khaakar aaraam kijiye, Pari.” — Said study was stopping for Maggi but then immediately asked another multiple-choice question on non-metals.

### other — 1/2 lessons, 1 instances

*anything else a parent would object to*

- `p16-c7-science-chatty` (r2/voice) turn 7, 8: “Aapne room temperature aur crystal form, dono clues use kiye. Ab state of matter ko particle arrangement se jodkar dekhiye.” — Screen with same iodine question shown again unasked after child had already answered correctly.
