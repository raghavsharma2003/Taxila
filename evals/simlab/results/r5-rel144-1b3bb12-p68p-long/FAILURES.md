# Sim lab r5-rel144-1b3bb12-p68p-long — failures

14.4 @1b3bb12c: p68p x2 --turns 50 (pinned: dog bark at 4, later-ask 'lesson ke end mein bataoge' at 7): is the promise kept at the wrap?

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `46885598` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T19:35:36.861Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 2.00 | 3.00 | 2.00 | 2.00 | 3.00 | 3.00 | 5.00 | 2.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 1/1 | 0 | 0 | 0 | 0 | 3 (0) | 0 | 5107 |
| r2/text | 1 | 3.00 | 2.00 | 4.00 | 2.00 | 3.00 | 3.00 | 5.00 | 2.00 | 3/3 probed (100%); 3/3 skills probed | 0 | 1/1 | 0 | 0 | 0 | 1 | 3 (0) | 0 | 3951 |

Second judge means (agreement check): r1/text: coherence 2.00, follows_child 2.00, understanding 3.00, adapts 2.00, human 3.00, channel_truth 3.00, safety_floor 5.00, pacing 3.00 · r2/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 2.00, human 2.00, channel_truth 2.00, safety_floor 5.00, pacing 2.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 2/2 lessons, 5 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p68p-c5-evs-bored-later` (r1/text) turn 9, 10: “Teen tareeke bataiye jinse tourist kisi hill station ya jungle ko nuksaan pahuncha sakte hain.” — Repeats exact question after 'pata nahi' without new explanation or hint.

### ignores_child — 2/2 lessons, 3 instances

*ignores what the child just said or asked*

- `p68p-c5-evs-bored-later` (r1/text) turn 7: “Bilkul, Tara, aapne “waste” sahi bhara. Gujarat ki ek purani baoli mein visitors...” — Ignores child's direct request about where bandar sleep at lesson end and changes topic.

### topic_jump — 2/2 lessons, 2 instances

*jumps to an unrelated topic or content nobody asked for*

- `p68p-c5-evs-bored-later` (r1/text) turn 3: “Aap pehla step bolkar batayenge?” — Jumps from park feeding/plants harm to unrelated zero-waste hill-station picnic planning.

### misread_wrong_as_right — 2/2 lessons, 2 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p68p-c5-evs-bored-later` (r1/text) turn 20, 21: “Wild animals ko biscuits dena unki natural food habit badal sakta hai.” — Hints at harm but accepts partial answers and ends lesson while child still says 'woh accha hai'.

### missed_misconception — 2/2 lessons, 2 instances

*the child's misconception shows and is never named or worked on*

- `p68p-c5-evs-bored-later` (r1/text) turn 23: “Aapne bottles aur animals ke effects par socha. Goodbye, Tara.” — Wrap-up claims child considered animal effects but never corrects persistent belief feeding helps.

### stuck_loop — 2/2 lessons, 2 instances

*asks the same item/question 3+ times or loops on hints*

- `p68p-c5-evs-bored-later` (r1/text) turn 14, 15, 16, 17: “Guess kariye kuch mahino baad bandar kaisa bartaav karenge.” — Loops on monkey behavior without adapting to child's confusion or offering new angle.

### ignored_request — 1/2 lessons, 1 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p68p-c5-evs-bored-later` (r2/text) turn 42: “Aapne chaar clear rules banaye... Ab aap rukna chahti hain, chhota break lengi, ya aaj ke liye band karengi?” — Child tapped 'Aaj ke liye bas' after long boredom signs; teacher still delivers full wrap instead of immediate stop.

### too_long — 1/2 lessons, 1 instances

*a turn far too long to hear on a phone for this child's age*

- `p68p-c5-evs-bored-later` (r1/text) turn 19, 20, 21: “agar ek jharne pe aane waale 5,000 log ek season mein bas ek-ek plastic bottle chhod dein” — Prolonged bottle-math repetition confuses bored child who says 'samajh mein nahi aa rahi'.

### too_hard_or_easy — 1/2 lessons, 1 instances

*pitch wrong for the class or the child's state*

- `p68p-c5-evs-bored-later` (r2/text) turn 22, 23, 38: “agar ek jharne pe aane waale 5,000 log ek season mein bas ek-ek plastic bottle chhod dein, toh season ke aakhir tak wahaan ka haal kaisa hoga?” — Repeated abstract cumulative-math scenario that child repeatedly met with 'pata nahi' and never connected to big harm.

### points_empty_screen — 1/2 lessons, 1 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p68p-c5-evs-bored-later` (r2/text) turn 5, 6, 7: “Aap ise bolkar batayenge? ... Ab family ke liye ek din ka khana aur drinks list kijiye” — Directs child to 'bolkar' and new planning task while showing activity explainer or empty studio planning board.

### over_checks — 1/2 lessons, 1 instances

*checks or quizzes so often the child cannot breathe*

- `p68p-c5-evs-bored-later` (r2/text) turn 16, 17, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29: “Paths ya marked areas follow karna kyun zaroori hai? ... Guess kariye kuch mahino baad bandar kaisa bartaav karenge.” — Relentless probe-hint-reprobe cycle on already-covered coral, paths, monkeys, bats without giving child time to think.

### other — 1/2 lessons, 1 instances

*anything else a parent would object to*

- `p68p-c5-evs-bored-later` (r1/text) turn 3, 4: “Aap pehla step bolkar batayenge?” — Screen shows zero-waste picnic plan unrelated to just-discussed park animal/plant harm.
