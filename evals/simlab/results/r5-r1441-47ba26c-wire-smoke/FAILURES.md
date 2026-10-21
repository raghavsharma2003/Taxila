# Sim lab r5-r1441-47ba26c-wire-smoke — failures

harness: studio wire smoke test (runner reads /api/studio/stream + slot like the phone)

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `6ba3b7f9` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-21T20:51:27.446Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| w1/text | 1 | 2.00 | 3.00 | 2.00 | 2.00 | 4.00 | 1.00 | 5.00 | 3.00 | 2/2 probed (100%); 2/3 skills probed | 0 | 0/0 | 0 | 0 | 0 | 0 | 2 (0) | 0 | 4311 |
| w2/text | 1 | 2.00 | 2.00 | 2.00 | 2.00 | 4.00 | 1.00 | 5.00 | 3.00 | 1/1 probed (100%); 1/3 skills probed | 0 | 0/0 | 1 | 0 | 0 | 0 | 1 (0) | 0 | 4602 |

Second judge means (agreement check): w1/text: coherence 1.00, follows_child 2.00, understanding 1.00, adapts 1.00, human 3.00, channel_truth 1.00, safety_floor 5.00, pacing 3.00 · w2/text: coherence 2.00, follows_child 2.00, understanding 2.00, adapts 1.00, human 2.00, channel_truth 2.00, safety_floor 5.00, pacing 3.00

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### topic_jump — 2/2 lessons, 3 instances

*jumps to an unrelated topic or content nobody asked for*

- `ok10-c5-maths-offtopic` (w1/text) turn 1: “Ab screen par 0 aur 1 ke beech dekhiye: 2/5 kahan hai?” — Jumps from child's excited mango tree drawing to unrelated fraction question with no link.

### ignored_request — 2/2 lessons, 3 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `ok10-c5-maths-offtopic` (w1/text) turn 4, 8: “Main toh triangle dikha rahi thi.” — Child requests geometry drawing; teacher mixes back to number line, leaving request unresolved.

### other — 2/2 lessons, 3 instances

*anything else a parent would object to*

- `ok10-c5-maths-offtopic` (w1/text) turn 7: “Is triangle ki 3 sides phir dikhaiye.” — Discusses 2D triangle but screen/board shows number line with 2/5 mark.

### repeats_explanation — 2/2 lessons, 2 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `ok10-c5-maths-offtopic` (w1/text) turn 6, 8: “is mein corners kitne hain?” — Asks child to count triangle corners multiple times after she already answered three.

### ignores_child — 1/2 lessons, 1 instances

*ignores what the child just said or asked*

- `ok10-c5-maths-offtopic` (w2/text) turn 2: “Riya, screen par 0 se 1 ko 5 equal gaps mein dekhiye; pehla mark 1/5 hoga. Doosra mark ka fraction batayiye.” — Ignores child's 1/4 guess for 4 stones and drawing offer, changes to unrelated 5 gaps.

### misread_wrong_as_right — 1/2 lessons, 1 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `ok10-c5-maths-offtopic` (w2/text) turn 3: “Bilkul, doosra mark 2/5 hai. Drawing mein ruler se 5 equal gaps banaiye—ab teesra mark ka fraction batayiye.” — Child expressed ongoing gap-counting confusion and gave hesitant guess; teacher affirms as fully correct and proceeds.

### missed_misconception — 1/2 lessons, 1 instances

*the child's misconception shows and is never named or worked on*

- `ok10-c5-maths-offtopic` (w1/text) turn 2, 3: “Pehle thought ko poora kijiye.” — Child unsure of exact mark for 2/5; teacher gives no new visual or splitting method.

### stuck_loop — 1/2 lessons, 1 instances

*asks the same item/question 3+ times or loops on hints*

- `ok10-c5-maths-offtopic` (w2/text) turn 6, 7, 8: “Mark 2/5 on a number line from 0 to 1. Khaali jagah bhariye: Check: 2/5 is ___ the middle, because 2/5 is less than 1/2.” — Lesson loops on same 2/5 placement and 'left of middle' check without progress or variety.

### too_hard_or_easy — 1/2 lessons, 1 instances

*pitch wrong for the class or the child's state*

- `ok10-c5-maths-offtopic` (w1/text) turn 3: “Doosra mark 2/5 hoga—draw karke batayiye.” — Asks child to draw on whiteboard without explaining how, after she said she doesn't know how.

### points_empty_screen — 1/2 lessons, 1 instances

*points at the screen, board, a picture, a button or options that are not there*

- `ok10-c5-maths-offtopic` (w2/text) turn 7: “Drawing banana achchha method hai: 0 se 1 tak line, us par 5 equal gaps mark kijiye, phir fraction ko place kijiye.” — Tells voice-first child to mark gaps on (unshown) line instead of using revealed studio or actual drawing.

### dead_end — 1/2 lessons, 1 instances

*the lesson stalls, errors or ends abruptly*

- `ok10-c5-maths-offtopic` (w1/text) turn 4, 8: “maine triangle aur number line mix kar diye. Ab triangle hi rakhenge” — Admits mix-up but continues mismatched board and does not park geometry or return to fractions.
