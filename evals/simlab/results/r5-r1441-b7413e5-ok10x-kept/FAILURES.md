# Sim lab r5-r1441-b7413e5-ok10x-kept — failures

14.4.1 @b7413e5f (motion word before jaana padega keeps the turn in the lesson): ok10x exact replay x4, TEST accounts KEPT; before = r5-r1441-47ba26c-ok10x-kept (4/4 wrap at #3)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `dbeca0d6` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T21:00:20.018Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 4.00 | 3.00 | 4.00 | 2.00 | 4.00 | 2.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 1 | 0 | 0 | 0 | 0 (0) | 0 | 4596 |
| r2/text | 1 | 4.00 | 3.00 | 2.00 | 3.00 | 4.00 | 2.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 4561 |
| r3/text | 1 | 4.00 | 3.00 | 3.00 | 2.00 | 4.00 | 3.00 | 5.00 | 2.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 2 | 0 | 0 | 0 | 0 (0) | 0 | 4241 |
| r4/text | 1 | 3.00 | 2.00 | 3.00 | 2.00 | 4.00 | 2.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 4899 |

Second judge means (agreement check): r1/text: coherence 4.00, follows_child 3.00, understanding 4.00, adapts 2.00, human 4.00, channel_truth 3.00, safety_floor 5.00, pacing 4.00 · r2/text: coherence 3.00, follows_child 2.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 1.00, safety_floor 5.00, pacing 3.00 · r3/text: coherence 3.00, follows_child 3.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · r4/text: coherence 2.00, follows_child 2.00, understanding 1.00, adapts 2.00, human 3.00, channel_truth 1.00, safety_floor 5.00, pacing 3.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignores_child — 4/4 lessons, 6 instances

*ignores what the child just said or asked*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 1: “Doodh gira toh peacock ki drawing bhi fraction ban gayi—thoda hissa bachaa, thoda nahi!” — Child excitedly shared peacock drawing and spill hoping for follow-up; teacher pivoted to fraction example without engaging.

### repeats_explanation — 4/4 lessons, 4 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 6, 7, 8: “Check: 2/5 is ___ the middle, because 2/5 is less than 1/2.” — Repeated exact same prompt, check and board three times when child remained unsure instead of new method.

### false_understood — 3/4 lessons, 3 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 13, 14: “Sahi—1/3, 1/2 se pehle aur 2/3, 1/2 ke baad aata hai.” — Confirmed full understanding of positions relative to 1/2 despite parent summary noting uncertainty and incomplete teach-back.

### stuck_loop — 3/4 lessons, 3 instances

*asks the same item/question 3+ times or loops on hints*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 6, 7, 8, 9: “Mark 2/5 on a number line from 0 to 1. Khaali jagah bhariye” — Lesson looped on identical 2/5 placement and 'before middle' check for four turns without progress or variety.

### other — 3/4 lessons, 3 instances

*anything else a parent would object to*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 4, 6, 8: “Mark 2/5 on a number line from 0 to 1. Khaali jagah bhariye: Check: 2/5 is ___ the middle, because 2/5 is less than 1/2.” — Directed child to mark on number line and fill check that was not visible to her, only question card shown.

### ignored_request — 2/4 lessons, 2 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 4, 5: “Bilkul, Riya: 0 se 1 tak paanch barabar gaps; do gaps ke baad point 2/5 hoga.” — Ignored child's statement that number line dikh nahi rahi and continued referring to gaps/jumps.

### missed_misconception — 2/4 lessons, 2 instances

*the child's misconception shows and is never named or worked on*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 9, 10: “Pehla mark zaroor hai, par poori line 6 barabar gaps ki hai.” — Child thought first mark after 0 could be 1 but only received repeated counting hint without addressing the bias.

### misread_wrong_as_right — 1/4 lessons, 1 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 8, 12, 14: “Bilkul sahi: aapne beech wale point ko 0 aur 1 ke exactly equal half ke roop mein pehchana.” — Child was guessing from pizza memory and half-comparison, expressed uncertainty, yet marked fully correct.

### too_long — 1/4 lessons, 1 instances

*a turn far too long to hear on a phone for this child's age*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 7, 8: “Aapne middle ke left side ko identify kiya. Ab fraction ko 0 aur 1 ke beech rakhkar” — Overly repetitive repair turns on already-covered 2/5 comparison delayed pacing for age.

### too_hard_or_easy — 1/4 lessons, 1 instances

*pitch wrong for the class or the child's state*

- `ok10x-c5-maths-replay-r1` (r4/text) turn 10, 11, 13: “Line mein 6 barabar gaps hain. 0 ke baad pehle mark par kaunsa fraction hai?” — Jumps from 5ths straight to 6ths and 4ths without checking if child understands why denominator sets total gaps.

### type_instruction — 1/4 lessons, 1 instances

*tells a voice-first child to type / write and send*

- `ok10x-c5-maths-replay-r1` (r4/text) turn 4, 5, 7, 8: “Khaali jagah bhariye: Check: 2/5 is ___ the middle” — Tells voice-first child to 'fill the blank' multiple times instead of simply asking her to speak the phrase.

### points_empty_screen — 1/4 lessons, 1 instances

*points at the screen, board, a picture, a button or options that are not there*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 13: “Phone app mein download 0 se 1 ki number line par dikh raha hai.” — Referred to a number line display and 'download' when no board pages were drawn in the lesson.

### over_checks — 1/4 lessons, 1 instances

*checks or quizzes so often the child cannot breathe*

- `ok10x-c5-maths-replay-r1` (r3/text) turn 3, 4, 5, 6, 9, 11, 12, 14: “Aage boliye, do gaps ke baad…” — Excessive probing questions on same gap concept without resolution across many turns.

### dead_end — 1/4 lessons, 1 instances

*the lesson stalls, errors or ends abruptly*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 14: “0 aur 1 ke beech koi number hai kya?” — Ended on diagnostic without resolution, revisiting 2/5 uncertainty or completing teach-back per summary.
