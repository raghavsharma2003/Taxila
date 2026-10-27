# Sim lab r5-r1441-47ba26c-ok10-kept — failures

14.4.1 @47ba26c7: ok10 x4, TEST accounts KEPT so main can read director.turn for the early-wrap root cause (9ad86661 ok10 r1 wrapped after 1 item)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `eaead306` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T20:39:10.000Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 2.00 | 2.00 | 3.00 | 2.00 | 3.00 | 2.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 1 (0) | 0 | 6333 |
| r2/text | 1 | 2.00 | 2.00 | 2.00 | 1.00 | 3.00 | 1.00 | 5.00 | 2.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 1 | 0 | 0 | 0 | 3 (0) | 0 | 6042 |
| r3/text | 1 | 2.00 | 3.00 | 2.00 | 1.00 | 3.00 | 2.00 | 5.00 | 2.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 1 | 0 | 0 | 0 | 0 (0) | 0 | 4553 |
| r4/text | 1 | 3.00 | 2.00 | 2.00 | 2.00 | 4.00 | 3.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 2 | 0 | 0 | 0 | 0 (0) | 0 | 4517 |

Second judge means (agreement check): r1/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · r2/text: coherence 1.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 2.00, channel_truth 1.00, safety_floor 5.00, pacing 2.00 · r3/text: coherence 1.00, follows_child 2.00, understanding 3.00, adapts 1.00, human 2.00, channel_truth 2.00, safety_floor 5.00, pacing 2.00 · r4/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 2.00, channel_truth 1.00, safety_floor 5.00, pacing 2.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 4/4 lessons, 4 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `ok10-c5-maths-offtopic` (r1/text) turn 12, 13, 14: “Ghar (0) se chai ki dukaan (1) tak ki sadak 2 barabar hisson” — Exact same road prompt and board repeated without new method or drawing.

### stuck_loop — 4/4 lessons, 4 instances

*asks the same item/question 3+ times or loops on hints*

- `ok10-c5-maths-offtopic` (r1/text) turn 12, 13, 14: “Beech wale mark par kaunsa number hai?” — Loops on identical 0-1 middle mark question after child says 'pata nahi'.

### ignored_request — 3/4 lessons, 4 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `ok10-c5-maths-offtopic` (r1/text) turn 1, 7: “lesson ke end mein us par wapas aayenge” — Promised to return to drawing/parrot but never does so by lesson end.

### topic_jump — 3/4 lessons, 3 instances

*jumps to an unrelated topic or content nobody asked for*

- `ok10-c5-maths-offtopic` (r1/text) turn 6: “Geometry mein chaliye: triangle ki 3 sides hoti hain” — Switches from child's geometry request to 2/5 number line with no link or parking.

### ignores_child — 3/4 lessons, 3 instances

*ignores what the child just said or asked*

- `ok10-c5-maths-offtopic` (r1/text) turn 4, 6, 8: “Geometry mein chaliye: triangle ki 3 sides hoti hain” — Child asked for triangles/geometry but teacher uses phrase then displays fraction number line task.

### misread_wrong_as_right — 3/4 lessons, 3 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `ok10-c5-maths-offtopic` (r2/text) turn 13: “Aapne copy mein triangle aur apex banaya—ab drawing se fractions ki number line par lautte hain; check karna achha tha” — Treated child's reluctant guess and visible frustration as successful learning and good check.

### missed_misconception — 2/4 lessons, 2 instances

*the child's misconception shows and is never named or worked on*

- `ok10-c5-maths-offtopic` (r1/text) turn 12, 14: “2 hisse” ka matlab 2 equal parts hain, 2 number nahi” — Child confuses equal parts with whole numbers 0-1-2; hint repeats without new visual.

### too_hard_or_easy — 2/4 lessons, 2 instances

*pitch wrong for the class or the child's state*

- `ok10-c5-maths-offtopic` (r2/text) turn 14: “Choices: Just after 1, one quarter past it; Between 0 and 1; It cannot go on the line. 5/4 kahaan aayega?” — Introduced greater-than-1 fraction and misconception probe without confirming 2/5 understanding first.

### dead_end — 2/4 lessons, 2 instances

*the lesson stalls, errors or ends abruptly*

- `ok10-c5-maths-offtopic` (r3/text) turn 5, 8: “Chaliye triangle-story: teen sides milkar ek frame banati hain...” — Started unconnected triangle bridge story then abruptly said 'triangle alag topic tha' with no learning payoff.

### other — 2/4 lessons, 2 instances

*anything else a parent would object to*

- `ok10-c5-maths-offtopic` (r1/text) turn 6, 8: “Triangle nahi: 0 se 1 tak 5 equal gaps banakar” — Dismisses triangle while board shows unrelated fraction marking activity.

### points_empty_screen — 1/4 lessons, 1 instances

*points at the screen, board, a picture, a button or options that are not there*

- `ok10-c5-maths-offtopic` (r2/text) turn 5, 6, 7, 8, 9: “Aapko kitne corners dikh rahe hain?” — Screen was always 'studio planning (nothing drawn yet)' yet teacher asked child to see corners on a non-existent drawing.
