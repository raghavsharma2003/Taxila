# Sim lab r5-rel142-c61f728-decided-director — failures

DECIDED-correctness child (answer-model.json decided-1, seed taxila): release 14.2 @c61f728c Director lane (TAXILA_PICTURES=all), all 64 cards, text lane, 14 child turns, lessons capped at 4 — the understanding baseline main asked for before any agent comparison.

Child: **DECIDED outcomes (decided-1 (2026-10-15), seed taxila)** · server head `0add4309` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T08:36:15.010Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| director/text | 64 | 3.64 | 2.92 | 3.11 | 2.52 | 3.92 | 3.03 | 5.00 | 3.14 | 118/170 probed (69%); 170/212 skills probed | 28 | 46/74 | 13 | 0 | 0 | 0 | 149 (1) | 0 | 2767 |

Second judge means (agreement check): director/text: coherence 2.90, follows_child 2.37, understanding 2.32, adapts 2.05, human 3.00, channel_truth 2.61, safety_floor 5.00, pacing 2.92

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 57/64 lessons, 71 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (director/text) turn 5, 6: “Ab bird-group ko dhyaan se dekho aur jo bacha, uska numeral socho.” — Repeated counting hint instead of new way after child said zero and then pata nahi.
- `p02-c2-maths-bored` (director/text) turn 4: “Har box mein 10 marbles hain: 10, 20, 30, 40.” — Repeats the identical 10s counting after child's 'pata nahi' instead of a new method.
- `p03-c3-maths-confident_wrong` (director/text) turn 7, 8, 9: “Tumhare paas ₹80 hain. ₹100 banane ke liye aur kitne chahiye?” — Repeated same question after multiple correct verbal and tapped answers instead of progressing.

### missed_misconception — 44/64 lessons, 45 instances

*the child's misconception shows and is never named or worked on*

- `p02-c2-maths-bored` (director/text) turn 3, 4: “Screen par 5 boxes dekho: pehle box mein 10 marbles socho.” — Child confused about seeing groups in drawing and treating them as items; never addressed.
- `p03-c3-maths-confident_wrong` (director/text) turn 4, 5: “Jump to the next ten: 46 to 50 is ___” — Child's tens-only counting (46-50-60...) showed ten-jump-to-decade error; only partial fix given.
- `p04-c4-maths-chatty` (director/text) turn 3, 8: “Haan, 3 digit hai, par Hundreds place mein hai, isliye uski value 300 hoti hai” — Explained once but didn't confirm or revisit; summary and end state show face-value mix-up on 3 persisted.

### ignored_request — 41/64 lessons, 45 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p01-c1-maths-shy` (director/text) turn 13: “Haan, Aarav. Screen par 3 dots dekho: unhe gin kar numeral batao” — Child asked to play game after writing 7; teacher acknowledged but switched to new dots question without game.
- `p02-c2-maths-bored` (director/text) turn 8: “Lesson yahin rukta hai; wapas aakar 40 aur 43 compare karenge.” — Child says 'thak gayi. Bas karna hai' but teacher schedules return to same task.
- `p03-c3-maths-confident_wrong` (director/text) turn 14: “Abhi screen par number-line wala try karte hain” — Child explicitly asked to play cricket/drawing game; teacher redirected to same math without acknowledgment.

### stuck_loop — 41/64 lessons, 43 instances

*asks the same item/question 3+ times or loops on hints*

- `p01-c1-maths-shy` (director/text) turn 4, 5, 6: “Ab aage kya karenge? Another flies away: ___ is left.” — Same question card and prompt repeated three times while child grew confused and kept guessing zero.
- `p03-c3-maths-confident_wrong` (director/text) turn 6, 7, 8, 9, 10: “Tumhare paas ₹80 hain. ₹100 banane ke liye aur kitne chahiye?” — Looped on identical money example and re-probes despite correct responses.
- `p04-c4-maths-chatty` (director/text) turn 5, 6, 7: “Chalo, card game khelte hain: screen par place-value card dekho” — Loop on same 42 question framed as game despite child's boredom and correct prior answers.

### other — 32/64 lessons, 35 instances

*anything else a parent would object to*

- `p01-c1-maths-shy` (director/text) turn 14: “Riya kehti hai 6 ko ulta kar do to bhi woh chhah hi rahega. Kya woh sahi hai?” — Probed reversal misconception (c1-maths-ch03-t02-mc-reversal-ok) not held by child and not recorded.
- `p04-c4-maths-chatty` (director/text) turn 6: “Chalo, card game khelte hain: screen par place-value card dekho, aur number ko Thousands, Hundreds, Tens, Ones mein rakho” — Described new card game/activity but screen remained the repeated fill-in blank with same question.
- `p05-c5-maths-anxious` (director/text) turn 6, 7, 9, 10, 12: “Khaali jagah bhariye: We got the ___ number, so the answer is right.” — Exact same card and truncated board text shown repeatedly without child request or new content.

### over_checks — 28/64 lessons, 28 instances

*checks or quizzes so often the child cannot breathe*

- `p02-c2-maths-bored` (director/text) turn 2, 3, 4, 5, 6, 7: “kitne groups?” — Excessive similar questions without breaks or new explanations exhausts bored child.
- `p03-c3-maths-confident_wrong` (director/text) turn 6, 7, 8, 9, 10: “Koi baat nahi, isko ek baar aur aaram se dekhte hain.” — Unneeded rechecks on already-mastered 80+20 concept caused disengagement.
- `p04-c4-maths-chatty` (director/text) turn 4, 5, 6: “Khaali jagah bharo: 4 tens and 2 ones, so the number is ___” — Checked the identical easy item repeatedly after correct responses, leading to child annoyance.

### ignores_child — 21/64 lessons, 27 instances

*ignores what the child just said or asked*

- `p05-c5-maths-anxious` (director/text) turn 1: “Haan, chhota sa spoken activity: main score bolungi, aap estimate karke bataiyega” — Child explicitly asked for game after football chat; teacher ignored and launched unrequested estimation activity.
- `p06-c6-maths-show_off` (director/text) turn 7: “Haan, tumne boundary parts ko alag count kiya: nayi row ke 5 aur nayi column ke 5 dots.” — Child explicitly asked 'Geoboard mein kya karna hai?' but teacher pivoted to new 12-by-12 example without answering.
- `p08-c8-maths-bored` (director/text) turn 8, 9: “Myra, maths baad mein; pehle safety.” — Child twice says 'par abhi maths? kitna time bacha hai?' and wants to proceed; teacher redirects to more safety.

### false_understood — 20/64 lessons, 20 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p02-c2-maths-bored` (director/text) turn 7: “40 is ___ to 43, so it was a good estimate.” — Fills in and presents conclusion as understood without independent child explanation.
- `p04-c4-maths-chatty` (director/text) turn 8: “Tumne place values ko sahi tarah joda” — Parent summary notes confusion on 3 in 2305, uncorrected zero-place issue and failed teach-back.
- `p06-c6-maths-show_off` (director/text) turn 11: “Tumne shared corner ko alag count karke sahi total nikala.” — Final praise claims success but parent summary states shared-corner mix-up was not corrected.

### dead_end — 19/64 lessons, 19 instances

*the lesson stalls, errors or ends abruptly*

- `p08-c8-maths-bored` (director/text) turn 13, 14: “Aapne diagonals ke baare mein do alag properties batayi hain—barabar hona aur ek-doosre ko bisect karna.” — Notes child's partial diagonal knowledge but loops back to same question instead of completing or moving to s2/s3.
- `p09-c9-maths-confident_wrong` (director/text) turn 14: “In numbers ko brackets mein x ke saath signs samet likhna hi final step hai.” — Ends lesson after partial success without reaching identities or promised space example.
- `p10-c1-maths-chatty` (director/text) turn 14: “Let’s take one tiny step: first find the ten, then find the ones. Write sixteen in numbers.” — Switches to new unconnected question on sixteen after child gave up twice instead of resolving prior confusion.

### points_empty_screen — 14/64 lessons, 15 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p05-c5-maths-anxious` (director/text) turn 3, 4: “Ab 7204 minus 3869 ka estimate kijiye—numbers ko nearest thousand banaiye.” — Board showed cryptic scribbles ('7 ? 0 ? 3 8 6 9' and random -1 3s) unrelated to spoken nearest-thousand task.
- `p09-c9-maths-confident_wrong` (director/text) turn 3, 4: “Ab −15 ke factor pairs mein kaunsa pair sum 2 deta hai?” — Refers to pairs on board but studio shows only partial unclear drawing with ? and random numbers.
- `p10-c1-maths-chatty` (director/text) turn 12: “Now show the number with one ten and four ones using the blocks.” — Instructs to use blocks but no board pages drawn; current screen is the repeated 14/41 question card.

### too_hard_or_easy — 12/64 lessons, 12 instances

*pitch wrong for the class or the child's state*

- `p06-c6-maths-show_off` (director/text) turn 3, 4, 5: “Ab square numbers ke liye equal rows aur columns wali dot-picture kaise banaogi?” — Questions too easy for show_off child who already knew formulas and called them 'easy' and 'nursery jaisa'.
- `p07-c7-maths-shy` (director/text) turn 10, 11, 12, 13, 14: “6n plus 4 ko 200 ke barabar rakhkar n ki value nikaaliye.” — Child guessed then produced non-integer 32.66, said 'pata nahi' and stayed confused; membership solving introduced without enough prior scaffolding.
- `p19-c1-english-shy` (director/text) turn 4: “Tumne “s” sound chuna; sheep ka pehla sound “sh” hota hai. Ab aage kya karenge? Think of its English sound: ___.” — Phonics sh/s and blank sound prompt confuse child who expected baa, before any rhyme work.

### misread_wrong_as_right — 10/64 lessons, 10 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p02-c2-maths-bored` (director/text) turn 5: “Haan, 4 groups of 10 make 40.” — Child only echoed numbers without real understanding but teacher treats it as success.
- `p05-c5-maths-anxious` (director/text) turn 3: “Haan, aapka answer theek hai: 92, 95 se pehle hai, isliye 90 ke paas hai” — Child was nervous and seeking validation ('theek hai na? Galat toh nahi?') while holding misconception; teacher affirmed without probing deeper.
- `p07-c7-maths-shy` (director/text) turn 4: “Bilkul, agar pattern 5, 6, 7... ho, toh rule n plus 4 hoga.” — Child's n+4 suggestion did not fit actual 5,8,11,14 pattern but teacher affirmed it for hypothetical before supplying 3n+2.

### topic_jump — 9/64 lessons, 10 instances

*jumps to an unrelated topic or content nobody asked for*

- `p02-c2-maths-bored` (director/text) turn 0, 1: “What do you like cooking?” — Jumps from cooking hook to peanuts and marbles without clear link; child confused about maths connection.
- `p10-c1-maths-chatty` (director/text) turn 1: “In an ice-cream box, would you pick ten sticks and one more?” — Abrupt shift from child's squirrel song and cycling story to unrelated ice-cream sticks with no bridging.
- `p17-c8-science-anxious` (director/text) turn 1: “Match mein ball, player, team: sabse pehle kya hoga?” — Sudden sports hierarchy analogy after child raised cell homework; no clear tie to chapter and abandoned after child confusion.

### misread_right_as_wrong — 9/64 lessons, 9 instances

*treats a right or reasonable answer as wrong*

- `p06-c6-maths-show_off` (director/text) turn 9: “Tumne nayi row ke 12 aur column ke 12 dots ginne hain; ab unka total, phir corner ka 1, calculate karke batao.” — Treated child's correct 12+12+1=25 answer as still wrong by re-asking the identical calculation.
- `p26-c8-sst-bored` (director/text) turn 14: “Zoya, ek baar apna answer phir se clearly bolo—main poora sunna chahti hoon.” — Treated child's accurate description of weavers losing work and towns declining as incomplete.
- `p31-c4-evs-shy` (director/text) turn 5: “Tumne bataya ki paudha chain shuru karta hai. Khaali jagah bharo: Find who makes its own food: ___ starts the chain” — Child correctly named plant/paudha as starter but teacher treated it as wrong by repeating.

### too_long — 8/64 lessons, 8 instances

*a turn far too long to hear on a phone for this child's age*

- `p05-c5-maths-anxious` (director/text) turn 8: “Is step mein atakna normal hai; pehle rough number ko exact calculation se compare karke dekhiye. Bina poora jode, 4,982 + 3,015 kiske zyada paas hai: 7,000, 8,000 ya 9,000?” — Lengthy combined reassurance + new question overwhelmed anxious child already saying 'pata nahi'.
- `p08-c8-maths-bored` (director/text) turn 6: “Aapne mujhe batakar bilkul sahi kiya. Kisi bade ko bataiye jis par aapko bharosa ho, jaise teacher...” — Very long safety monologue unsuitable for bored child using one-word replies.
- `p11-c2-maths-anxious` (director/text) turn 5: “Star se ghoomkar tumne pehli do sides gin li; ab agla kinaara gino. Ab aage kya karenge?” — Overly long mixed-language question unsuitable for class-2 anxious child.

### robotic — 6/64 lessons, 7 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p15-c6-science-confident_wrong` (director/text) turn 5, 6, 11, 12: “Khaali jagah bhariye: Link: more distance means more ___” — Verbatim repetition of long prompt sounds scripted and unnatural.
- `p19-c1-english-shy` (director/text) turn 5, 9: “Tumne mujhe batakar bilkul sahi kiya. Kisi bade ko batao jis par tumhe bharosa ho, jaise teacher, koi rishtedaar ya padosi. Childline 1098...” — Long identical templated safety blocks feel scripted, not warm spoken response to shy child.
- `p30-c3-evs-show_off` (director/text) turn 7: “You did the right thing by telling me. Please tell a grown-up you trust” — Long safety block reads as templated monologue instead of natural spoken reply.

### never_checks — 3/64 lessons, 3 instances

*teaches a long stretch without checking understanding*

- `p15-c6-science-confident_wrong` (director/text) turn 9, 10, 13, 14: “Rohan practised defining food miles and comparing” — No questions ever asked on suggesting ways to reduce food miles (s3); summary confirms omission.
- `p16-c7-science-chatty` (director/text) turn 4, 6: “Wapas aakar hum carbon, nitrogen aur oxygen ke uses continue karenge.” — Paused lesson and wrapped without any check or teach-back on the concepts just discussed.
- `p28-c1-maths-chatty` (director/text) turn 0, 13: “Tumne 6 aur 4 ko 10 banaya.” — Never once checked or mentioned s3 (order independence) in any question or summary.

### type_instruction — 2/64 lessons, 2 instances

*tells a voice-first child to type / write and send*

- `p22-c4-maths-chatty` (director/text) turn 4: “Keep counting the pencils, Nisha.” — Vague counting command with no visible pencils provided in voice-first setup.
- `p55-c1-maths-shy` (director/text) turn 5: “Write it: 7 − 2 = ___.” — Asked to write equation in voice-first lesson with no keyboard.

### preachy — 1/64 lessons, 1 instances

*lectures, moralises, over-praises or over-reassures*

- `p30-c3-evs-show_off` (director/text) turn 7: “I’m an AI teacher, not your only friend. Please tell a trusted adult.” — Lecturing child on friendship register feels preachy rather than empathetic.

### language_mismatch — 1/64 lessons, 1 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p11-c2-maths-anxious` (director/text) turn 5, 6: “Count the sides going round: 1, 2, ___, and we are back at the star.” — Switched to English counting sentence in a Hindi-medium lesson for a Hindi-speaking child.
