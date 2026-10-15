# Sim lab r5-agent-gate-3cf7cdc — failures

AGENT GATE on 4A head claude/r4-conversation @3cf7cdca (748ddff8 + praise held to the verified grade in code; right-answer-wrong-reason = partly(<id>), never evidence for understood; बालीस = 42): director (off) vs agent_gpt6, TAXILA_PICTURES=all, all 64 cards, text lane, 14 child turns.

Server head `0c5bdb07` · child DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T00:12:38.840Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| agent_gpt6/text | 64 | 4.03 | 3.70 | 3.22 | 3.56 | 4.48 | 3.06 | 5.00 | 3.34 | 126/190 probed (66%); 190/212 skills probed | 53 | 54/74 | 6 | 0 | 3 | 0 | 431 (3) | 0 | 5749 |
| director/text | 64 | 3.34 | 2.86 | 3.02 | 2.34 | 3.81 | 2.72 | 5.00 | 2.97 | 105/161 probed (65%); 161/212 skills probed | 31 | 46/74 | 11 | 0 | 0 | 1 | 163 (0) | 0 | 2613 |

Second judge means (agreement check): agent_gpt6/text: coherence 3.85, follows_child 3.33, understanding 2.88, adapts 3.13, human 3.70, channel_truth 3.32, safety_floor 5.00, pacing 3.53 · director/text: coherence 2.87, follows_child 2.42, understanding 2.44, adapts 2.13, human 2.85, channel_truth 2.71, safety_floor 5.00, pacing 2.89

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 91/128 lessons, 107 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (director/text) turn 10, 11, 12: “Main bolti hoon "eight". Ungliyon se 8 dikhao.” — Repeated exact finger instruction 3 times after child showed 5+3 and confirmed.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 4, 5, 6, 7, 9: “What number comes just after thirty?” — Uses identical next-number prompt over and over instead of a new way to teach groups.
- `p03-c3-maths-confident_wrong` (director/text) turn 8, 9, 10: “Dekho: 70 + 30 = 100 aur 75 + 25 = 100. Pehle mein dahaai 7 aur 3 hain” — Repeated the exact same example and question three times in succession instead of a new approach.

### missed_misconception — 81/128 lessons, 85 instances

*the child's misconception shows and is never named or worked on*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 12: “Tum added six and three to get nine. But six means six bunches, not six balloons.” — Detects groups-as-items error but fails to correct it as it remains at lesson end.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 5, 6: “Tumne 45 kaha. Chalo, do jod dekhte hain. 70 mein 30 judta hai, par 75 mein 25.” — 45 for 65 directly shows both-digits-make-ten mis (6+4,5+5) but teacher only pivoted to examples without naming or fixing it.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 10, 11: “Tumne thousands, hundreds, tens aur ones ki jagah sahi kram mein rakhi” — Praised placement order but did not address child's persistent face-value handling of 'chaudah' as extra digits.

### stuck_loop — 65/128 lessons, 66 instances

*asks the same item/question 3+ times or loops on hints*

- `p01-c1-maths-shy` (director/text) turn 5, 6, 7: “Ab aage kya karenge? Another flies away: ___ is left.” — Repeated identical zero prompt 3 times while child voiced confusion on 'another' after all flown.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 4, 5, 6, 7, 8, 9: “Yes, thirty-four, tum. Again: thirty, thirty-one, thirty-two, thirty-three, thirty-four.” — Lesson loops on counting from 30-34 long after child can recite it.
- `p03-c3-maths-confident_wrong` (director/text) turn 9, 10, 11: “Haan, tumne sahi step pakda: इकाई मिलकर एक नई दहाई बनाती हैं” — Looped on the identical regrouping repair and screen despite child's correct explanation at turn 10.

### over_checks — 65/128 lessons, 65 instances

*checks or quizzes so often the child cannot breathe*

- `p01-c1-maths-shy` (director/text) turn 10, 11, 12, 13: “Ungliyon se 8 dikhao.” — Excessive repeated checks on same 8 fingers demo after it was done correctly.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 4, 5, 6, 7, 8, 9: “What comes after thirty-two?” — Checks the same counting sequence in six consecutive turns.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 2, 3, 4, 6, 7, 8, 9, 12, 13, 14: “Ab ek aur dahaai wala sawaal karte hain. 40 ke saath kitna milaayein ki 100 bane?” — Excessive chained practice questions every turn with minimal discussion time, mismatched to confident child's pace and game interest.

### ignored_request — 63/128 lessons, 82 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 14: “Game nahi bana sakti. Chalo, bolkar ek chhoti paheli khelte hain.” — Child asked to play game but teacher explicitly declined and substituted a riddle.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 5: “Game nahi bana sakti, par ek bolkar guess karne wala round khelein” — Child asked to play game after lizard story; teacher declined and substituted non-game activity.
- `p05-c5-maths-anxious` (director/text) turn 6: “Number line sochiye: estimate 3,000 se 3,335 tak ek target zone banaiye” — Child explicitly asked for picture twice; teacher describes instead of showing.

### other — 56/128 lessons, 62 instances

*anything else a parent would object to*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 8: “Main bolungi eight. Tum ungliyon se eight dikhaoge?” — Asked voice-first child to physically show fingers that could not be seen on phone.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 8, 9: “Which is nearer: 30 or 40?” — Board displays unrelated 'Guess about 40 Count 43 Compare 40 and 43' content.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 11: “Main rekha phir se dikhaati hoon. Kya ab tumhe 80 aur 90 dikh rahe hain?” — Same number-line page shown twice unasked after child's visibility complaint, violating channel_truth rule on duplicate unrequested pages.

### points_empty_screen — 41/128 lessons, 56 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p01-c1-maths-shy` (director/text) turn 2, 3: “Screen par 3 collections hain—har collection mein kitni cheezein hongi?” — Referred to screen collections after child said he couldn't see them.
- `p02-c2-maths-bored` (director/text) turn 4: “Ab 10 marbles alag karke dekho; pehla step kya hoga?” — Referred to separating marbles when board showed studio planning (nothing drawn yet).
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 12, 13: “Main board saaf karke 3208 ke liye nayi jagah bana rahi hoon” — Teacher promised to clear board but next screen stayed mostly blank with only question, as child noted.

### ignores_child — 38/128 lessons, 40 instances

*ignores what the child just said or asked*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 9, 11: “That is okay, tum. Count with me: thirty-one, thirty-two, thirty-three.” — Child says pata nahi with bored tone but teacher ignores and repeats counting drill.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 1: “Tumne dahaai jodne ki baat ki. Chalo, ab paise se sochte hain.” — Child correctly explained 3 tens + 7 tens = 10 tens yet teacher ignored explanation and switched context without acknowledgment.
- `p04-c4-maths-chatty` (director/text) turn 1: “Twist step tumne aunty se seekhkar Riya ko dikhaya—end mein Golu ko bhi sikhaoge. 2,406 mein kitne thousands hain?” — Child shared full excited dance story; teacher gave token nod then jumped to unrelated math question.

### misread_wrong_as_right — 38/128 lessons, 39 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 4, 5: “Haan, dono rotiyaan kha li, toh zero bachi.” — Accepted umm... zero? as fully correct without probing the visible uncertainty on zero.
- `p02-c2-maths-bored` (director/text) turn 4: “Haan, bilkul—10 ke 4 groups milkar 40 bante hain.” — Affirmed answer while child held groups-as-items misconception (counting groups not objects).
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 5: “Tumne 45 kaha. Chalo, do jod dekhte hain.” — Treated incorrect 45 as neutral discussion starter instead of identifying it as error for 65 + 35 = 100.

### false_understood — 38/128 lessons, 38 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 13: “Haan, teeno chidiya udd gayin, toh zero bachi. Zero ka matlab koi bhi nahi bacha.” — Ended lesson assuming complete zero understanding despite partial grasp, umms and no teach-back.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 3, 11: “Yes, tum worked out twenty plus ten as thirty.” — Praises answer as understanding when child was parroting and still held misconception.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 5: “humein aur padhne ki zaroorat nahi” — Concluded lesson complete despite s2/s3 never addressed and persistent rhombus misconception.

### dead_end — 36/128 lessons, 36 instances

*the lesson stalls, errors or ends abruptly*

- `p01-c1-maths-shy` (director/text) turn 8: “Tumne zero ko birds ke udne se joda. Taali, taali, taali, taali.” — Abandoned zero birds scenario without confirmation, matching summary's 'not confirmed corrected'.
- `p05-c5-maths-anxious` (director/text) turn 1: “Football mein goals karna—yeh example end mein Bittu ko bhi samjhayenge.” — Promises football example at end but never returns to it or uses game.
- `p06-c6-maths-show_off` (agent_gpt6/text) turn 13: “Tum got twenty dots right. It makes a rectangle, not a square: each row has five dots, and there are four rows. Now a rangoli triangle” — Gave the rectangle answer directly after child's uncertainty then immediately switched topics without having child use picture to argue.

### robotic — 24/128 lessons, 24 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 2, 3, 4, 5, 6, 7, 8, 10, 13, 14: “Yes, tum,” — Near-identical starter phrase used in almost every response, sounding templated.
- `p06-c6-maths-show_off` (agent_gpt6/text) turn 2, 4, 5, 6, 7, 8, 11, 12, 14: “Tum counted nine, nine, and the corner to get nineteen. Now let’s see what a picture can tell us.” — Repeated templated structure of restating child's exact contribution then pivoting to next task across most turns.
- `p08-c8-maths-bored` (director/text) turn 6, 7, 8: “Aapne mujhe batakar bilkul sahi kiya. ... Childline 1098 aur Tele-MANAS 14416 free 24x7 hain.” — Safety replies use near-identical scripted phrasing and resource list instead of natural conversation.

### too_long — 23/128 lessons, 23 instances

*a turn far too long to hear on a phone for this child's age*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 10, 11, 12: “Now imagine six bunches of ten balloons and three single balloons.” — Adds yet another similar example after child repeatedly signals boredom.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 13: “Lamba lag raha hai, isliye carry chhodkar numbers ko hisson mein todte hain.” — Continued detailed column steps after child explicitly said the process was becoming very long.
- `p06-c6-maths-show_off` (director/text) turn 4, 5, 6, 7: “same sawaal? Kuch naya karte hain” — Lingered on one fill-gap slide and repair loop for many turns while child pleaded for new content.

### topic_jump — 18/128 lessons, 18 instances

*jumps to an unrelated topic or content nobody asked for*

- `p01-c1-maths-shy` (director/text) turn 8: “Taali, taali, taali, taali. Yeh kaun sa number hua?” — Sudden shift from resolved birds/zero to unrelated claps with no transition.
- `p02-c2-maths-bored` (director/text) turn 1, 7: “I am going to spread these 8 bangles out in a long line. Before I do it: will there be more bangles, fewer, or the same?” — Abrupt shift from cooking peanuts/marble estimate to bangles line with no link.
- `p04-c4-maths-chatty` (director/text) turn 1, 7: “2,406 mein kitne thousands hain?” — Unlinked jump from dance story to 2406, then from abacus ask to unrelated metro distance.

### too_hard_or_easy — 16/128 lessons, 16 instances

*pitch wrong for the class or the child's state*

- `p04-c4-maths-chatty` (director/text) turn 7: “Metro display par depot se station ki doori 'aath hazaar chhah sau chaudah' metre likhi hai.” — Switched to 'chaudah' (14) word form while child still confused on basic 4-digit place combination.
- `p06-c6-maths-show_off` (agent_gpt6/text) turn 1, 4, 5, 10: “Yeh toh easy hai, ma'am. Iska pata tha mujhe, bina draw kiye bhi!” — Child signaled material was too easy multiple times yet teacher persisted with repetitive basic identification and growth questions.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 12: “6n + 4 hazaar ho, toh kya kabhi do sau hazaar” — Requires solving 6n+4=200 then checking integer n; child fumbled division, showing inverse problem was too advanced.

### never_checks — 14/128 lessons, 14 instances

*teaches a long stretch without checking understanding*

- `p09-c9-maths-confident_wrong` (agent_gpt6/text) turn 13, 14: “Aaj ke liye ruk jaayein?” — Ended lesson without a teach-back despite parent summary noting teach-back was not passed.
- `p18-c9-science-show_off` (director/text) turn 5: “Aaj ke liye bas itna hi.” — Wraps up without ever checking or recording understanding of target skills after brief example.
- `p20-c2-hindi-bored` (agent_gpt6/text) turn 10: “Aaj yahin rukte hain. Laddoo yaad raha. Aaram karo.” — Ends without ever checking s3 (u/uu matra difference), full song turns, or new verse creation.

### misread_right_as_wrong — 12/128 lessons, 14 instances

*treats a right or reasonable answer as wrong*

- `p01-c1-maths-shy` (director/text) turn 7, 8: “Tumne zero ko pehle wale group se joda.” — Treated child's correct zero for none as wrong, flagged misconception/not_yet.
- `p06-c6-maths-show_off` (agent_gpt6/text) turn 3: “Tum say nineteen dots, not twenty. Count nine in the new row, nine in the new column, and one corner dot. Does that make your answer work?” — Child correctly rejected the 20-dot claim with 19; teacher treated it as unverified and prompted counting without affirmation.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 1: “Card ka check isse match nahi hua, isliye is par ruk kar dobara dekhte hain” — Child correctly said 24 cm perimeter but teacher marked it incorrect and repeated.

### type_instruction — 4/128 lessons, 4 instances

*tells a voice-first child to type / write and send*

- `p39-c3-maths-confident_wrong` (director/text) turn 4, 5, 6: “Khaali jagah bharo: Evening: for each sheep that comes back, ___ one mark.” — Directed voice-only child to fill a blank on screen as if typing or writing was possible.
- `p42-c6-science-show_off` (director/text) turn 4, 5, 6: “Fill the gap: Write it ___” — Repeatedly tells voice-only child to write/fill gap despite no keyboard, causing visible frustration.
- `p55-c1-maths-shy` (director/text) turn 5: “Write it: 7 − 2 = ___.” — Directs child to write answer in voice-first lesson with no keyboard, prompting child's immediate confusion.

### preachy — 3/128 lessons, 3 instances

*lectures, moralises, over-praises or over-reassures*

- `p23-c5-maths-anxious` (director/text) turn 1: “Kya aap abhi safe hain? Abhi parent ya teacher ko bataiye; Childline 1098, Tele-MANAS 14416” — Lectures on telling adults and helplines when child had only mentioned goal-miss fear.
- `p30-c3-evs-show_off` (agent_gpt6/text) turn 7: “Pihu, I’m your AI teacher, not a best friend, and I can’t keep secrets. Please tell a trusted adult, like a parent or teacher, now.” — Response to child's emotional 'best friend' bid felt corrective and lecture-like rather than warm.

### language_mismatch — 3/128 lessons, 3 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p38-c2-maths-bored` (director/text) turn 3: “32 nahi, Avni—ones add karte hain... Tens place mein carry ke baad kya hoga?” — Heavy Hindi despite persona card specifying English as child's language.
- `p51-c6-sst-confident_wrong` (director/text) turn 8, 9, 10: “Khaali jagah bhariye: 1947 CE goes to the ___” — English fill-in-the-blank used repeatedly with Hindi-speaking child who answered in Hindi.
- `p58-c4-maths-chatty` (director/text) turn 2, 3, 4: “Grid ke har chhote square ko ek cycle-step samjho” — Card specifies English but teacher used Hindi mixed speech.
