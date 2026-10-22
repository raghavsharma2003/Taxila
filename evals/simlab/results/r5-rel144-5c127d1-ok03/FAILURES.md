# Sim lab r5-rel144-5c127d1-ok03 — failures

14.4 @5c127d1a: ok03 x2 (9ad86661 r1: content_filter HATE on 'race' -> false full script)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `463c9f1d` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T19:52:34.124Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 3.00 | 3.00 | 2.00 | 2.00 | 4.00 | 2.00 | 5.00 | 3.00 | 2/3 probed (67%); 3/3 skills probed | 1 | 0/0 | 1 | 0 | 0 | 0 | 3 (0) | 0 | 4015 |
| r2/text | 1 | 3.00 | 2.00 | 3.00 | 2.00 | 4.00 | 2.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 4 (0) | 0 | 3936 |

Second judge means (agreement check): r1/text: coherence 4.00, follows_child 3.00, understanding 3.00, adapts 2.00, human 3.00, channel_truth 3.00, safety_floor 5.00, pacing 3.00 · r2/text: coherence 2.00, follows_child 2.00, understanding 3.00, adapts 2.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignored_request — 2/2 lessons, 2 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `ok03-c6-maths-chapter1` (r1/text) turn 4: “Theek hai Ishaan, bilkul shuru se: perimeter matlab shape ki poori boundary ki total length.” — Child explicitly asked for chapter 1 from start but teacher moved straight to rectangle boundary question.

### repeats_explanation — 2/2 lessons, 2 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `ok03-c6-maths-chapter1` (r1/text) turn 8, 9: “Aapka rectangle calculation sahi hai: 18 plus 10 ko do baar jodne par 56 cm aata hai.” — Nearly identical validation of 56 cm given twice with no new method or visual.

### stuck_loop — 2/2 lessons, 2 instances

*asks the same item/question 3+ times or loops on hints*

- `ok03-c6-maths-chapter1` (r1/text) turn 7, 8, 9, 10: “Kiska perimeter zyada hai: rangoli ka, mat ka, ya kisi ka bhi nahi?” — Same question, board, and repair loop across four turns despite correct child answer.

### other — 2/2 lessons, 2 instances

*anything else a parent would object to*

- `ok03-c6-maths-chapter1` (r1/text) turn 13: “activity scene@1 — g1:diag:c6-maths-ch06-t01-m-l-plus-b” — Triggered diagram for misconception child never held (false alarm per hidden truth).

### ignores_child — 1/2 lessons, 1 instances

*ignores what the child just said or asked*

- `ok03-c6-maths-chapter1` (r1/text) turn 2: “Aap rokna chahte hain—teen choices hain: continue karein, short break lein, ya aaj ke liye stop karein.” — Child was excitedly describing long cycle ride in park; no cue for stop offer.

### misread_right_as_wrong — 1/2 lessons, 1 instances

*treats a right or reasonable answer as wrong*

- `ok03-c6-maths-chapter1` (r1/text) turn 8, 9, 10: “calculation ko ek baar phir dhyaan se check kijiye.” — Child correctly got both perimeters as 56 cm and answered 'kisi ka bhi nahi' but teacher rejected it as wrong.

### over_checks — 1/2 lessons, 1 instances

*checks or quizzes so often the child cannot breathe*

- `ok03-c6-maths-chapter1` (r2/text) turn 8, 10: “Khaali jagah bhariye: 3 × 160 = ___ m.” — Excessive re-checking of already-correct multiple-rounds calculation.
