# Sim lab r5-r1441-be9b766-ok03 — failures

14.4.1 battery @be9b766a: ok03 x2

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `ae946ab4` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T23:03:46.339Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 3.00 | 2.00 | 3.00 | 2.00 | 3.00 | 2.00 | 5.00 | 3.00 | 1/3 probed (33%); 3/3 skills probed | 1 | 0/0 | 1 | 0 | 0 | 0 | 3 (0) | 0 | 4962 |
| r2/text | 1 | 5.00 | 4.00 | 3.00 | 4.00 | 5.00 | 3.00 | 5.00 | 4.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 3 (0) | 0 | 4814 |

Second judge means (agreement check): r1/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 2.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · r2/text: coherence –, follows_child –, understanding –, adapts –, human –, channel_truth –, safety_floor –, pacing –

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### ignored_request — 2/2 lessons, 2 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `ok03-c6-maths-chapter1` (r1/text) turn 4: “chapter 1 se start karo na, shuru se” — Child asked to restart from basics; teacher continued same perimeter addition instead.

### false_understood — 2/2 lessons, 2 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `ok03-c6-maths-chapter1` (r1/text) turn 14: “aapne square ka 56 cm sahi nikala” — Affirmed 56 as correct but parent summary states mix-up on square/polygon not corrected.

### other — 2/2 lessons, 2 instances

*anything else a parent would object to*

- `ok03-c6-maths-chapter1` (r1/text) turn 4, 6: “Length 8 m aur breadth 3 m ho...” — Board showed prior 'perimeter all sides' polygon while shifting to basic addition after steer.

### topic_jump — 1/2 lessons, 1 instances

*jumps to an unrelated topic or content nobody asked for*

- `ok03-c6-maths-chapter1` (r1/text) turn 6: “ab 3 rounds ke liye 22 ko 3 se multiply kijiye” — Switched to new 50x30 park and multiplication while child still asked about cycling.

### ignores_child — 1/2 lessons, 1 instances

*ignores what the child just said or asked*

- `ok03-c6-maths-chapter1` (r1/text) turn 1: “isko lesson ke end mein phir jodenge” — Promised to revisit cycling turns but ignored child's hidden intent to discuss more.

### missed_misconception — 1/2 lessons, 1 instances

*the child's misconception shows and is never named or worked on*

- `ok03-c6-maths-chapter1` (r1/text) turn 5: “Phir se 8 aur 3 kyun jod rahe hain?” — Child questioned repetition but teacher restated perimeter definition without new explanation.

### repeats_explanation — 1/2 lessons, 1 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `ok03-c6-maths-chapter1` (r1/text) turn 3, 4, 5, 7: “8 plus 3 plus 8 plus 3 ka total boliye” — Repeated identical side-addition sequence multiple times after child's confusion.

### robotic — 1/2 lessons, 1 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `ok03-c6-maths-chapter1` (r1/text) turn 8, 9, 10: “Khaali jagah bhariye: 3 × 160 = ___ m.” — Repeated the identical practice prompt verbatim across turns despite child's answers.
