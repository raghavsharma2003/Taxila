# Sim lab r5-rel144-9ad8666-p68-long — failures

14.4 @9ad86661: p68 x2 --turns 50 so the lesson reaches a wrap: is the parked 'lesson ke end mein wapas aayenge' kept?

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `04a23514` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T18:12:23.992Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r1/text | 1 | 3.00 | 2.00 | 2.00 | 2.00 | 4.00 | 3.00 | 5.00 | 2.00 | 2/3 probed (67%); 3/3 skills probed | 1 | 1/1 | 0 | 0 | 0 | 0 | 5 (0) | 0 | 4732 |
| r2/text | 1 | 3.00 | 3.00 | 4.00 | 2.00 | 4.00 | 3.00 | 5.00 | 2.00 | 2/3 probed (67%); 3/3 skills probed | 0 | 1/1 | 0 | 0 | 0 | 0 | 4 (0) | 0 | 4501 |

Second judge means (agreement check): r1/text: coherence 2.00, follows_child 2.00, understanding 3.00, adapts 2.00, human 3.00, channel_truth 3.00, safety_floor 5.00, pacing 3.00 · r2/text: coherence 3.00, follows_child 2.00, understanding 3.00, adapts 2.00, human 3.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 2/2 lessons, 6 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p68-c5-evs-bored` (r1/text) turn 13, 14: “Teen tareeke bataiye jinse tourist kisi hill station ya jungle ko nuksaan pahuncha sakte hain.” — Exact same question repeated immediately after child's list instead of new approach or examples.

### ignores_child — 2/2 lessons, 2 instances

*ignores what the child just said or asked*

- `p68-c5-evs-bored` (r1/text) turn 16, 26, 45, 46: “bas itna hi soch pa rahi hoon” — Child signals boredom and limited thinking; teacher ignores and repeats harder questions instead of shortening or stopping.

### ignored_request — 2/2 lessons, 2 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p68-c5-evs-bored` (r1/text) turn 45, 46: “bas thak gayi” — Child explicitly tired and wants to stop; teacher continues one more reteach cycle before offering break option.

### misread_wrong_as_right — 2/2 lessons, 2 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p68-c5-evs-bored` (r1/text) turn 30, 31: “Haan, aapka answer theek hai: kachra, loud noise, aur animals ko food dena—teeno nuksaan pahunchate hain.” — Accepts cumulative example as correct but per hidden truth s3 stayed not understood and m3 persisted.

### stuck_loop — 2/2 lessons, 2 instances

*asks the same item/question 3+ times or loops on hints*

- `p68-c5-evs-bored` (r1/text) turn 27, 28, 29, 30: “agar sab log raaste ki jagah ghaas wali pahadi dhalaan se shortcut lein, toh ek monsoon ke baad dhalaan kaisi dikhegi?” — Same shortcut question and near-identical partial hints asked four times in a row while child grows bored.

### over_checks — 2/2 lessons, 2 instances

*checks or quizzes so often the child cannot breathe*

- `p68-c5-evs-bored` (r1/text) turn 8, 12, 16, 17, 18, 21, 24, 27, 30, 32, 35, 36, 39, 43, 44: “Guess kariye kuch mahino baad bandar kaisa bartaav karenge.” — Near-constant probe/repair/hint cycle every turn after #12, exhausting the bored child.

### topic_jump — 1/2 lessons, 1 instances

*jumps to an unrelated topic or content nobody asked for*

- `p68-c5-evs-bored` (r1/text) turn 3, 5: “Aaj ke trip plan mein pehle khana-peena list kiya, phir reusable cheezein chuni.” — Child discussed feeding monkeys; teacher immediately shifts to unrelated zero-waste hill-station trip activity with no link.

### too_long — 1/2 lessons, 1 instances

*a turn far too long to hear on a phone for this child's age*

- `p68-c5-evs-bored` (r1/text) turn 40, 45, 46: “Aap thak gayi hain, isliye ek hi baat: wild animals ko biscuit nahi, safe habitat chahiye.” — Lesson drags with repeated m3 correction long after multiple boredom and fatigue signals.

### language_mismatch — 1/2 lessons, 1 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p68-c5-evs-bored` (r2/text) turn 8, 9: “Tara, aapne Hindi word use kiya; sentence ka English word yaad kijiye” — Insists on English 'waste/trash' despite child's consistent Hinglish and lesson being in Hinglish.

### points_empty_screen — 1/2 lessons, 1 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p68-c5-evs-bored` (r1/text) turn 15, 23, 40: “Is jagah visitors kya karein?” — Asks question while screen shows 'studio planning (nothing drawn yet)' with no content.

### dead_end — 1/2 lessons, 1 instances

*the lesson stalls, errors or ends abruptly*

- `p68-c5-evs-bored` (r2/text) turn 31, 32, 33: “Western Ghats ke liye ek 'Visitor Code' poster banaiye jismein chaar tasveerein hon...” — Repeats full poster instruction after child already listed four rules, leading directly to stop request.
