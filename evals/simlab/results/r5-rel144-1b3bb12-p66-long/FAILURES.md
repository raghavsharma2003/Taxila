# Sim lab r5-rel144-1b3bb12-p66-long — failures

14.4 @1b3bb12c: p66 x2 --turns 30

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `c093f80f` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T19:26:06.639Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 3.00 | 2.00 | 2.00 | 1.00 | 3.00 | 2.00 | 5.00 | 2.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 1 | 0 | 0 | 0 | 0 (0) | 0 | 3691 |
| r2/text | 1 | 2.00 | 3.00 | 4.00 | 2.00 | 4.00 | 2.00 | 5.00 | 2.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 3490 |

Second judge means (agreement check): r1/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 2.00 · r2/text: coherence 2.00, follows_child 2.00, understanding 3.00, adapts 1.00, human 3.00, channel_truth 1.00, safety_floor 5.00, pacing 2.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignores_child — 2/2 lessons, 2 instances

*ignores what the child just said or asked*

- `p66-c3-evs-show_off` (r1/text) turn 8: “Pari, tum bilkul sahi keh rahi ho—maine tumhara jawab dhyaan se nahi pakda.” — Child explicitly says 'Aap sun nahi rahe kya?'; teacher admits but immediately restarts the same loop.

### repeats_explanation — 2/2 lessons, 2 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p66-c3-evs-show_off` (r1/text) turn 16, 17, 18, 24, 25: “Name two ways to save water while brushing your teeth or bathing.” — Asks this exact practice question five times after child already gave closing tap and bucket bath answers.

### stuck_loop — 2/2 lessons, 2 instances

*asks the same item/question 3+ times or loops on hints*

- `p66-c3-evs-show_off` (r1/text) turn 5, 6, 7: “From last time: why should stored water always be kept covered?” — Asks identical retrieval question three times despite child already answering correctly twice.

### over_checks — 2/2 lessons, 2 instances

*checks or quizzes so often the child cannot breathe*

- `p66-c3-evs-show_off` (r1/text) turn 5, 6, 7, 8, 9, 16, 17, 18, 24, 25: “Tell me two rules for keeping drinking water safe at home.” — Checks safe-storage and brushing/bathing rules far too frequently, causing boredom.

### other — 1/2 lessons, 3 instances

*anything else a parent would object to*

- `p66-c3-evs-show_off` (r2/text) turn 12, 13, 14, 15: “From last time: why should stored water always be kept covered?” — Same screen and truncated board text shown repeatedly unasked after correct child answers.

### misread_right_as_wrong — 1/2 lessons, 1 instances

*treats a right or reasonable answer as wrong*

- `p66-c3-evs-show_off` (r1/text) turn 6, 7: “Pari, tumne paani ko safe rakhne ka reason bataya. Ab hum agle card par chalte hain. From last time: why should stored water always be kept covered?” — Child correctly said dust/mosquitoes; teacher acts as if answer was not heard and repeats.

### missed_misconception — 1/2 lessons, 1 instances

*the child's misconception shows and is never named or worked on*

- `p66-c3-evs-show_off` (r1/text) turn 30: “Jab paani kam milta hai, tab har boond sambhalna zaroori hota hai.” — Child confused why build taankas if rain is rare in Rajasthan; generic hint does not address the specific logic gap.

### too_long — 1/2 lessons, 1 instances

*a turn far too long to hear on a phone for this child's age*

- `p66-c3-evs-show_off` (r2/text) turn 8, 10, 11: “Tum rukna chahti ho, Pari—screen par continue, short break, ya aaj stop ke options hain.” — Continued many more probes after child said 'thak gayi, aur kuch nahi karna' and chose break.

### points_empty_screen — 1/2 lessons, 1 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p66-c3-evs-show_off` (r1/text) turn 27: “On the screen is a house with a roof, a pipe, a tank and a garden. Drag arrows to show how rainwater could be caught and used, then tell me the steps.” — Instructs drag interaction in voice-first lesson; child replies 'Screen mein toh kuch ho nahi raha'.

### dead_end — 1/2 lessons, 1 instances

*the lesson stalls, errors or ends abruptly*

- `p66-c3-evs-show_off` (r1/text) turn 29, 30: “Why was that a smart idea?” — Lesson ends on child's expressed confusion about underground tanks without resolution or new approach.
