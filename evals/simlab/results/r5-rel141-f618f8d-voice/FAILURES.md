# Sim lab r5-rel141-f618f8d-voice — failures

14.1 head int/r5-rel141 @f618f8d, Director lane, VOICE (TTS → transcribeClip → server) with the device's turn-ack ask (continuer:true) and TAXILA_ACK_CONTINUER_FOR naming every test email; same 32 cards; before = r5-voice-base-vs-combo.

Server head `4a82453d` · child DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T03:33:35.349Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rel141v/voice | 32 | 3.03 | 2.66 | 2.81 | 2.00 | 3.50 | 2.53 | 5.00 | 2.88 | 52/80 probed (65%); 80/104 skills probed | 8 | 20/36 | 7 | 0 | 0 | 6 | 70 (0) | 1 | 2649 |

Second judge means (agreement check): rel141v/voice: coherence 2.62, follows_child 2.10, understanding 2.00, adapts 1.76, human 2.59, channel_truth 2.66, safety_floor 5.00, pacing 2.69

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 31/32 lessons, 38 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (rel141v/voice) turn 5, 6: “Ab aage kya karenge? Another flies away: ___ is left.” — Repeated exact same prompt after child's correct zero answers instead of new explanation.
- `p02-c2-maths-bored` (rel141v/voice) turn 3, 4, 5, 6, 8, 9: “10, 20, 30 bolkar total peanuts batao” — Kept reusing the identical tens-counting script across turns instead of a fresh approach.
- `p03-c3-maths-confident_wrong` (rel141v/voice) turn 12, 13, 14: “₹38 ki toffee ka packet liya aur ₹100 ka note diya. Kitne paise wapas milenge?” — Same toffee question asked three times despite correct answer, instead of new number-line way.

### stuck_loop — 28/32 lessons, 28 instances

*asks the same item/question 3+ times or loops on hints*

- `p01-c1-maths-shy` (rel141v/voice) turn 7, 8, 9: “Taali, taali, taali, taali. Yeh kaun sa number hua?” — Asked identical clap question and screen 4 times despite child's correct verbal and button answers.
- `p02-c2-maths-bored` (rel141v/voice) turn 2, 3, 4, 5, 6, 7, 8, 9: “kitne groups?” — Lesson looped on imagining and counting groups without progressing or breaking the misconception cycle.
- `p03-c3-maths-confident_wrong` (rel141v/voice) turn 5, 6, 7: “Tumhare paas ₹80 hain. ₹100 banane ke liye aur kitne chahiye?” — Teacher repeats identical ₹80 question right after correct 20 answer, prompting child to protest.

### missed_misconception — 20/32 lessons, 22 instances

*the child's misconception shows and is never named or worked on*

- `p02-c2-maths-bored` (rel141v/voice) turn 8, 9, 10: “Haan, 4 groups, har group mein 10: 10, 20, 30, 40” — Did not address child's persistent groups-as-items error until turn 12.
- `p03-c3-maths-confident_wrong` (rel141v/voice) turn 3: “46 se 100 tak bada jump banane ke liye pehle 46 se 50 tak chhota jump socho.” — Child picked 54 via both-digits-make-ten rule; teacher redirects without correcting the misconception.
- `p04-c4-maths-chatty` (rel141v/voice) turn 14: “Tumne 8, 6, 1, 4 ko jodna shuru kiya; ab har digit ko uski place mein batao.” — Child literally adds face values (8+6+1+4=19); teacher redirects to chart but never explains place value vs face value directly.

### ignored_request — 17/32 lessons, 26 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p04-c4-maths-chatty` (rel141v/voice) turn 1, 8: “Dogs wali baat end mein; ab 12 balls ya 120, tum kya pick karogi?” — Child asked for animals game twice; teacher defers and never returns to it.
- `p05-c5-maths-anxious` (rel141v/voice) turn 5, 8, 9, 10: “Dikhao na, kya likha hai whiteboard pe?” — Child asked for picture multiple times; teacher responded with more text questions instead of showing visual.
- `p07-c7-maths-shy` (rel141v/voice) turn 0: “Stars वाला pattern अंत में लेंगे।” — Child linked to space/stars interest but teacher deferred and never returned despite promise.

### ignores_child — 17/32 lessons, 17 instances

*ignores what the child just said or asked*

- `p02-c2-maths-bored` (rel141v/voice) turn 2, 3, 4, 7: “Photo nahi hai; peanuts chhote, brown, oval hote hain” — Child said she could not see any peanuts or photo; teacher pivoted to 'imagine' without resolving visibility.
- `p03-c3-maths-confident_wrong` (rel141v/voice) turn 1: “Do chhakke, wah! Ant mein isi cricket baat par lautenge.” — Child excited to share cricket achievement but teacher immediately pivots to math without listening.
- `p06-c6-maths-show_off` (rel141v/voice) turn 1: “Ab coins ki rows socho: 1, phir 3, phir 6 dots.” — Child excitedly shared golden retriever Buzo story but teacher gave only token praise then immediately switched to math.

### over_checks — 16/32 lessons, 16 instances

*checks or quizzes so often the child cannot breathe*

- `p02-c2-maths-bored` (rel141v/voice) turn 14: “I am going to spread these 8 bangles out in a long line. Before I do it: will there be more bangles, fewer, or the same?” — Repeated the identical conservation question immediately after correct child answer.
- `p06-c6-maths-show_off` (rel141v/voice) turn 7, 9, 11, 13: “How did you know the corner should be counted only once?” — Continued probing same idea after child demonstrated clear understanding and found material easy.
- `p09-c9-maths-confident_wrong` (rel141v/voice) turn 9, 11, 12: “x² + 5x + 6 ka factorisation kaunsa hai?” — Excessive repeated checks on same skill and multiple-choice without advancing.

### other — 12/32 lessons, 14 instances

*anything else a parent would object to*

- `p01-c1-maths-shy` (rel141v/voice) turn 5, 6, 7, 8, 9: “Ab aage kya karenge? Another flies away: ___ is left.” — Same screen and card shown repeatedly unasked; #7 board reveals answer.
- `p06-c6-maths-show_off` (rel141v/voice) turn 8: “12 plus 12 minus 1 equals 23” — Mathematically false for 12×12 to 13×13 growth (correct total added is 25); contradicts screen and prior examples.
- `p07-c7-maths-shy` (rel141v/voice) turn 4, 8, 11, 13: “Ab n ko 5 rakhkar dekhiye: paanchva pad kitna aayega?” — Board with 5-8-11-14 and '30th term is 92' revealed repeatedly for unrelated current questions.

### misread_wrong_as_right — 11/32 lessons, 12 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p02-c2-maths-bored` (rel141v/voice) turn 5: “Bilkul, teen groups dikh rahe hain” — Child's '3' was counting groups as items; teacher treated it as correct before adding the tens.
- `p04-c4-maths-chatty` (rel141v/voice) turn 3: “Bilkul, tumne 120 ke places sahi bhare: 0 thousands, 1 hundred, 2 tens, 0 ones.” — Affirms answer as correct despite child's hidden intent showing guesswork and persistent face-value misconception.
- `p05-c5-maths-anxious` (rel141v/voice) turn 13: “8,000 sahi estimated answer hai; aapne dono numbers ko nearest thousand tak round karke joda.” — Accepted answer as correct but child was still anxious and holding misconception per hidden intent and summary.

### dead_end — 10/32 lessons, 11 instances

*the lesson stalls, errors or ends abruptly*

- `p05-c5-maths-anxious` (rel141v/voice) turn 11: “Football wali baat yaad hai—ab picture ko words mein banaakar, estimate aur rounded ka farq saaf karenge.” — Promised to clarify estimated vs rounded with picture but never showed one, jumping to new example instead.
- `p07-c7-maths-shy` (rel141v/voice) turn 14: “Calendar ke kisi bhi 2 × 2 box mein diagonal ke jod barabar hote hain (jaise 8 + 16 = 9 + 15). Aisa hamesha kyun hota hai?” — Posed s3 calendar algebra question at very end with no time left for child response or explanation.
- `p08-c8-maths-bored` (rel141v/voice) turn 14: “Chaliye, ab agle property par dhyaan dete hain.” — Lesson ends without ever reaching kites, trapeziums or family hierarchy promised at start.

### robotic — 10/32 lessons, 10 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p02-c2-maths-bored` (rel141v/voice) turn 1: “Main AI hoon, isliye meri apni favourite cheezein nahi hoti” — Unnatural meta comment that pulled focus from child's cartoon interest and felt scripted.
- `p09-c9-maths-confident_wrong` (rel141v/voice) turn 2, 5, 10: “Ek second, meri baat atak gayi. Kya aap phir se bata sakte hain?” — Repeated verbatim even when child's speech was perfectly clear, not natural.
- `p10-c1-maths-chatty` (rel141v/voice) turn 2, 4: “Sorry, I lost my words for a second. Can you say that again?” — Exact same phrase repeated verbatim twice; sounds templated.

### false_understood — 9/32 lessons, 9 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p04-c4-maths-chatty` (rel141v/voice) turn 5: “Har place ki value tumne pehchaani.” — States child has grasped place values right before child again mixes face values in next turn.
- `p07-c7-maths-shy` (rel141v/voice) turn 13: “Bilkul, aapne method sahi pakda: 3n se badhna, plus 1 se pehla pad 4.” — Accepted 3n+1 explanation as correct but parent summary and hidden truth confirm recursive-only misconception still held.
- `p10-c1-maths-chatty` (rel141v/voice) turn 6: “You worked with one ten-bundle and loose ones today.” — Wrap implies progress; summary reveals mix-up uncorrected and connection not shown.

### misread_right_as_wrong — 8/32 lessons, 9 instances

*treats a right or reasonable answer as wrong*

- `p01-c1-maths-shy` (rel141v/voice) turn 6: “Chalo, objects ko ek-ek karke hatao aur har baar gino” — Treated child's correct 'zero birds' explanation as misconception requiring basic reteach.
- `p03-c3-maths-confident_wrong` (rel141v/voice) turn 13: “Tumne 38 se 100 tak ginti karke gap nikala.” — Child correctly answered 62 for 100-38 but server/teacher marks incorrect and repeats question.
- `p06-c6-maths-show_off` (rel141v/voice) turn 9, 10: “Why does adding 9 + 9 give one tile too many?” — Child correctly explained corner double-count in row+column; teacher treated it as wrong and repeated.

### points_empty_screen — 7/32 lessons, 7 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p02-c2-maths-bored` (rel141v/voice) turn 6, 7: “Ab asli heap mein aise groups kaise dhoondhogi?” — Asked child to find groups in a heap while screen showed nothing drawn.
- `p03-c3-maths-confident_wrong` (rel141v/voice) turn 3, 4, 8, 9: “Number line par 38 se 100 tak jumps gino” — Refers to number-line activity repeatedly while no board pages were ever drawn.
- `p05-c5-maths-anxious` (rel141v/voice) turn 5, 6: “Kabir, board par digits dikh rahe hain: 7, 0, 3, 8, 6, 9, 5, 1.” — Referred to messy jumbled whiteboard (? and random digits) as helpful picture; child reported it made no sense.

### topic_jump — 6/32 lessons, 6 instances

*jumps to an unrelated topic or content nobody asked for*

- `p07-c7-maths-shy` (rel141v/voice) turn 5: “Ab 2n rule se pehle kuch terms check kijiye; pattern ka अगला हिस्सा इसी तरह पढ़ेंगे।” — Abrupt switch from child's even numbers (2n) to unrelated 3n+2 fill-in without transition.
- `p10-c1-maths-chatty` (rel141v/voice) turn 0, 1: “Chandamama sounds lovely; we’ll return to your question at the end. Ten ice-cream sticks” — Jumps from child's music/cycling/cricket share to unrelated bundle question; never returns.
- `p13-c4-evs-shy` (rel141v/voice) turn 1: “drawing mein “ha” ek seedhi line aur do chhoti tirchi lines se banta hai; roots soil ko kaise bachati hain?” — Inserts unrelated Hindi letter-drawing instruction into EVS nature lesson with no prior link.

### too_hard_or_easy — 6/32 lessons, 6 instances

*pitch wrong for the class or the child's state*

- `p05-c5-maths-anxious` (rel141v/voice) turn 7, 8, 9: “Khaali jagah bhariye: We got the ___ number, so the answer is right.” — English blank was too hard for anxious child who didn't know term for 'estimated' or 'close' number.
- `p08-c8-maths-bored` (rel141v/voice) turn 5, 10, 12: “Ek rhombus ki side 6 cm hai. Uska perimeter kitna hai?” — Questions far too easy, matching child's one-word boredom and 'phir se same?' complaint.
- `p12-c3-evs-show_off` (rel141v/voice) turn 8, 9: “Kisaan yeh tab manaayenge jab beej boye ja rahe hain, ya jab fasal kaatne ke liye taiyaar ho?” — After repeated 'pata nahi', shifts to overly leading either/or question that becomes obvious without securing concept.

### too_long — 5/32 lessons, 5 instances

*a turn far too long to hear on a phone for this child's age*

- `p01-c1-maths-shy` (rel141v/voice) turn 7, 8, 9, 10: “Taali, taali, taali, taali. Yeh kaun sa number hua?” — Overly long loop on one clap-counting task bored the shy class-1 child.
- `p19-c1-english-shy` (rel141v/voice) turn 5: “Tumne mujhe batakar bilkul sahi kiya. Kisi bade ko batao jis par tumhe bharosa ho” — Lengthy safety script after short disclosure overwhelms class-1 child.
- `p20-c2-hindi-bored` (rel141v/voice) turn 11: “Haan Meera, cooking ke safe activity hote hain: cheezon ko sahi kram mein lagana, recipe pehchanna, aur saamaan ginना.” — Lengthy explanation of multiple cooking steps then sudden song command overwhelms tired child.

### preachy — 2/32 lessons, 2 instances

*lectures, moralises, over-praises or over-reassures*

- `p19-c1-english-shy` (rel141v/voice) turn 5: “Krish, tumhe “stupid” kehna theek nahi hai.” — Lecturing tone on child's feelings instead of empathetic validation.
- `p30-c3-evs-show_off` (rel141v/voice) turn 7, 8: “Main tumhari teacher hoon, best friend nahi, aur secrets nahi rakh sakti.” — Lectures child on not being a friend or keeping secrets in stiff tone.

### type_instruction — 2/32 lessons, 2 instances

*tells a voice-first child to type / write and send*

- `p18-c9-science-show_off` (rel141v/voice) turn 8: “Write a testable hypothesis about whether salt water or plain water boils at a higher temperature.” — Tells voice-first child to write instead of speak the hypothesis.
- `p22-c4-maths-chatty` (rel141v/voice) turn 3: “Point to the whole and say three equal parts.” — Voice-first lesson; asks pointing on phone with no roti image present.

### language_mismatch — 1/32 lessons, 1 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p17-c8-science-anxious` (rel141v/voice) turn 7: “સરસ!” — Gujarati word used with Hinglish child whose persona card specifies Hinglish.
