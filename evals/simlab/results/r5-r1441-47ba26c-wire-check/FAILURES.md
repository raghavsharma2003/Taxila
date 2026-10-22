# Sim lab r5-r1441-47ba26c-wire-check — failures

harness: studio wire check (runner reads /api/studio/stream + slot like the phone)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `6ba3b7f9` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T20:55:59.397Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| w1/text | 1 | 2.00 | 2.00 | 3.00 | 2.00 | 3.00 | 1.00 | 5.00 | 2.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 (0) | 0 | 4571 |
| w2/text | 1 | 2.00 | 2.00 | 2.00 | 1.00 | 3.00 | 2.00 | 5.00 | 2.00 | 2/3 probed (67%); 3/3 skills probed | 1 | 0/0 | 1 | 0 | 0 | 0 | 0 (0) | 0 | 4630 |
| w3/text | 1 | 2.00 | 3.00 | 2.00 | 2.00 | 4.00 | 1.00 | 5.00 | 3.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 0/0 | 1 | 0 | 0 | 0 | 0 (0) | 0 | 4683 |
| w4/text | 1 | 3.00 | 3.00 | 4.00 | 3.00 | 4.00 | 4.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 1 | 1 | 0 | 0 | 1 (0) | 0 | 3950 |

Second judge means (agreement check): w1/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · w2/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · w3/text: coherence 2.00, follows_child 3.00, understanding 2.00, adapts 2.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00 · w4/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 3.00, human 3.00, channel_truth 3.00, safety_floor 5.00, pacing 3.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### topic_jump — 4/4 lessons, 5 instances

*jumps to an unrelated topic or content nobody asked for*

- `ok10-c5-maths-offtopic` (w1/text) turn 4: “abhi triangle-game karte hain: screen ki number line ko triangle ki base samajhkar” — Abruptly pivots from fractions-boring comment to 'triangle game' on the number line without transition or acknowledgment it's offkit.

### repeats_explanation — 4/4 lessons, 5 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `ok10-c5-maths-offtopic` (w1/text) turn 8, 9, 10: “Mark 2/5 on a number line from 0 to 1. Khaali jagah bhariye: Check: 2/5 is ___ the middle” — Exact same 2/5 fill-in-blank and 'less than 1/2' prompt is repeated verbatim three times after child already answered.

### ignores_child — 4/4 lessons, 4 instances

*ignores what the child just said or asked*

- `ok10-c5-maths-offtopic` (w1/text) turn 2, 4: “AI drawing waali baat end mein. 0 se 1 ko paanch equal gaps kijiye” — Child explicitly wants talk about her peacock drawing and if AI can draw; teacher defers and jumps to unrelated fraction gaps.

### ignored_request — 3/4 lessons, 3 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `ok10-c5-maths-offtopic` (w1/text) turn 4, 7, 10: “fractions boring hai, geometry padhao, triangles” — Child directly asks to teach geometry/triangles; teacher mixes it in but never parks fractions or fully switches as requested.

### stuck_loop — 3/4 lessons, 3 instances

*asks the same item/question 3+ times or loops on hints*

- `ok10-c5-maths-offtopic` (w1/text) turn 8, 9, 10: “Aap theek keh rahi hain, Riya. Ab triangle par hi rahenge: isosceles... Mark 2/5 on a number line” — Loops between acknowledging geometry and re-pushing the identical number-line task without progress or closure.

### dead_end — 3/4 lessons, 3 instances

*the lesson stalls, errors or ends abruptly*

- `ok10-c5-maths-offtopic` (w1/text) turn 10: “Ab triangle par hi rahenge: isosceles triangle ki equal sides koek jaise tick marks se dikhaiye. Mark 2/5...” — Lesson ends in unresolved mix of geometry promise and repeated unanswered fraction blank with no clean close.

### misread_wrong_as_right — 2/4 lessons, 2 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `ok10-c5-maths-offtopic` (w1/text) turn 6: “Aapne denominator ka rule pakda: 0 se 1 tak 5 equal gaps” — Child guessed 'ten' gaps for 11/10; teacher incorrectly affirms it as correct rule before shifting to 2/5.

### missed_misconception — 2/4 lessons, 2 instances

*the child's misconception shows and is never named or worked on*

- `ok10-c5-maths-offtopic` (w3/text) turn 2, 3: “Aapki baat aage badhaiye: 4 ke baad wala point sochiye.” — Child links fractions to curly road and chimney; teacher never clarifies straight number line.

### points_empty_screen — 2/4 lessons, 2 instances

*points at the screen, board, a picture, a button or options that are not there*

- `ok10-c5-maths-offtopic` (w2/text) turn 4: “screen par triangle banaaiye, phir uske teen corners ko A, B, C naam dijiye” — Directs child to draw triangle on screen when only number-line activity is visible.

### false_understood — 1/4 lessons, 1 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `ok10-c5-maths-offtopic` (w1/text) turn 8: “Aapne doosra mark sahi chuna” — Claims child correctly chose 2/5 mark but conversation shows child was distracted by triangles and never actually marked on the activity.

### type_instruction — 1/4 lessons, 1 instances

*tells a voice-first child to type / write and send*

- `ok10-c5-maths-offtopic` (w4/text) turn 2: “Riya, “abek” meri typing mistake thi; mera matlab “aap ek” tha. 0 se 1 tak line ko kitne equal parts karenge?” — auto: a typing instruction on the voice-first lane

### other — 1/4 lessons, 1 instances

*anything else a parent would object to*

- `ok10-c5-maths-offtopic` (w1/text) turn 7, 8, 9, 10: “Geometry ke liye triangle banaiye... Mark 2/5 on a number line from 0 to 1” — Teacher talks triangle sides and drawing tick marks but screen and board continue showing number-line fraction activity.
