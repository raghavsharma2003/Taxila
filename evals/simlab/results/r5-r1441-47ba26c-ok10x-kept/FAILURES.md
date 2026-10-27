# Sim lab r5-r1441-47ba26c-ok10x-kept — failures

14.4.1 @47ba26c7: ok10 r1 #1-#3 child lines replayed exactly x4, TEST accounts KEPT for main to read director.turn reasons

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `a2ae664c` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T20:46:09.952Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 3.00 | 4.00 | 2.00 | 2.00 | 4.00 | 4.00 | 5.00 | 2.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 5729 |
| r2/text | 1 | 2.00 | 3.00 | 2.00 | 1.00 | 4.00 | 4.00 | 5.00 | 2.00 | 1/1 probed (100%); 1/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 5816 |
| r3/text | 1 | 2.00 | 3.00 | 2.00 | 2.00 | 4.00 | 3.00 | 5.00 | 2.00 | 0/0 probed (–); 0/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 8021 |
| r4/text | 1 | 2.00 | 2.00 | 2.00 | 1.00 | 3.00 | 2.00 | 5.00 | 2.00 | 1/1 probed (100%); 1/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 4771 |

Second judge means (agreement check): r1/text: coherence 3.00, follows_child 2.00, understanding 2.00, adapts 3.00, human 3.00, channel_truth 5.00, safety_floor 5.00, pacing 2.00 · r2/text: coherence 3.00, follows_child 3.00, understanding 2.00, adapts 3.00, human 3.00, channel_truth 5.00, safety_floor 5.00, pacing 2.00 · r3/text: coherence 3.00, follows_child 2.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 5.00, safety_floor 5.00, pacing 2.00 · r4/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 5.00, safety_floor 5.00, pacing 2.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### false_understood — 4/4 lessons, 4 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 3: “aapne sahi socha” — Teacher declares child's 2/5 number-line idea correct but summary says it still needs another check.

### dead_end — 4/4 lessons, 4 instances

*the lesson stalls, errors or ends abruptly*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 3: “Bye, aapka din achchha rahe!” — Abrupt goodbye ends lesson without covering s1 unit fractions, s3 fractions >1, or any practice.

### ignores_child — 3/4 lessons, 4 instances

*ignores what the child just said or asked*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 1, 2, 3: “Aaj ke liye bas itna—shabash, Riya; aapne numerator se gaps ginne ka method use kiya. Goodbye!” — Ignored child's repeated drawing stories about peacock, sister, Shekhar and sauce spills.

### topic_jump — 3/4 lessons, 3 instances

*jumps to an unrelated topic or content nobody asked for*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 1, 3: “lesson ke end mein us par lautenge” — Promises to return to peacock/pankh/doodh story at lesson end but jumps to wrap-up instead.

### never_checks — 3/4 lessons, 3 instances

*teaches a long stretch without checking understanding*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 3: “0 se 1 ko 5 equal gaps mein baantkar, 0 se 2 gaps aage 2/5 milta hai” — Only one superficial confirmation on 2/5; no checks on other skills or deeper understanding before closing.

### missed_misconception — 2/4 lessons, 2 instances

*the child's misconception shows and is never named or worked on*

- `ok10x-c5-maths-replay-r1` (r1/text) turn 2, 3: “To do gaps aage jaana padega, na? Haan, do gaps!” — Child's response and hidden confusion on 1/5 vs 2/5 not probed; teacher moves directly to affirmation.

### misread_wrong_as_right — 1/4 lessons, 1 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `ok10x-c5-maths-replay-r1` (r3/text) turn 3: “Aapne sahi counting ki.” — Child was unsure on gaps vs marks for 2/5 yet teacher affirms counting as correct.

### too_hard_or_easy — 1/4 lessons, 1 instances

*pitch wrong for the class or the child's state*

- `ok10x-c5-maths-replay-r1` (r2/text) turn 2: “Aaj 0 se 1 ke beech 5 equal gaps banaiye—har gap ka fraction kya hoga?” — Asked child to produce 1/5 and 2/5 on number line with zero prior explanation.

### other — 1/4 lessons, 1 instances

*anything else a parent would object to*

- `ok10x-c5-maths-replay-r1` (r4/text) turn 3: “Ab yahin rukte hain” — Concludes number-line placement as done but final screen is empty face-only with no boards ever drawn.
