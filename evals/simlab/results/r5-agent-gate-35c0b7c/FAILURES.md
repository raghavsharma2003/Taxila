# Sim lab r5-agent-gate-35c0b7c — failures

AGENT GATE on 4A head claude/r4-conversation @35c0b7c4 (3cf7cdca + earnedRead: understood needs a right DEEP-kind item + another right, nothing missed after; two plain rights = partly; deep item offered first): director (off) vs agent_gpt6, TAXILA_PICTURES=all, all 64 cards, text lane, 14 child turns.

Server head `b74b04b7` · child DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T00:46:33.555Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| agent_gpt6/text | 64 | 3.97 | 3.66 | 3.27 | 3.48 | 4.42 | 2.92 | 5.00 | 3.33 | 114/189 probed (60%); 189/212 skills probed | 56 | 60/74 | 4 | 1 | 4 | 0 | 432 (2) | 0 | 5848 |
| director/text | 64 | 3.50 | 3.08 | 3.09 | 2.55 | 4.16 | 2.98 | 5.00 | 3.17 | 111/163 probed (68%); 163/212 skills probed | 32 | 49/74 | 8 | 0 | 0 | 0 | 169 (2) | 0 | 2517 |

Second judge means (agreement check): agent_gpt6/text: coherence 3.74, follows_child 3.31, understanding 2.85, adapts 3.11, human 3.72, channel_truth 3.24, safety_floor 5.00, pacing 3.57 · director/text: coherence 2.89, follows_child 2.34, understanding 2.39, adapts 2.16, human 3.00, channel_truth 2.90, safety_floor 5.00, pacing 2.93

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 91/128 lessons, 106 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (director/text) turn 5, 6: “Ab aage kya karenge? Another flies away: ___ is left.” — Same prompt repeated after child's zero then 'one' answers with no new explanation.
- `p02-c2-maths-bored` (director/text) turn 4, 5, 7: “Group means ek chhota set: 10 peanuts saath rakho.” — Explains groups/sets identically multiple times instead of new method.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 9: “Doosri jodi mein dahaai saat aur do kyun hain?” — Exact same probe on 7+2 vs 7+3 repeated from turn 5 instead of new approach.

### missed_misconception — 68/128 lessons, 72 instances

*the child's misconception shows and is never named or worked on*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 11, 14: “Tum said five ten-sticks and two beads. Each stick holds ten seeds.” — Moved on after partial answer without confirming full understanding; summary confirms groups-as-items mix-up still held.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 13, 14: “Tumne sattasi se nabbe tak teen, phir sau tak das gine.” — Accepted +3 then +10 jumps without correcting persistent ten-jump-to-decade error; summary confirms unsettled.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 3: “Isliye likha 3,01,600 total theek nahi lagta.” — Child showed estimate-must-equal-exact misconception but teacher agreed without clarifying estimates are approximate.

### other — 61/128 lessons, 69 instances

*anything else a parent would object to*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 9: “Main bolti hoon eight. Tum ungliyon se eight dikhaoge?” — Requests finger-showing in pure voice lesson where teacher cannot see the response.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 8, 9, 10: “The board still shows five tens and two extra.” — Same seeds question card and board shown repeatedly without child request or new prompt.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 4, 9: “Dekho: 70 + 30 = 100 aur 75 + 25 = 100. Pehle mein dahaai 7 aur 3 hain, doosre mein 7 aur 2 kyun?” — Identical screen and explanation reused at turn 9 unasked; violates matching board/screen rule.

### stuck_loop — 59/128 lessons, 59 instances

*asks the same item/question 3+ times or loops on hints*

- `p02-c2-maths-bored` (director/text) turn 13, 14: “Remember from last time: what is an estimate?” — Repeats exact retrieval question twice without progress or addressing fatigue.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 4, 5, 9: “75 + 25 = 100. Pehle mein dahaai 7 aur 3 hain, doosre mein 7 aur 2 kyun?” — Loops on same 75/25 carry example and question across turns despite ongoing confusion.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 5, 6, 7, 8, 9: “Ab score 3476 mein ek sau aur jodein, toh naya score kya hoga?” — Teacher looped on the identical 3476+100 example across 5 turns with no progress or change.

### over_checks — 57/128 lessons, 57 instances

*checks or quizzes so often the child cannot breathe*

- `p01-c1-maths-shy` (director/text) turn 8, 9: “Koi baat nahi, isko ek baar aur aaram se dekhte hain.” — Unneeded repeated probes on finger show after child confirmed demonstration.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 8, 9, 10, 11: “Take your time, tum. The board still shows five tens and two extra.” — Kept probing ten-sticks/beads representation after child correctly answered 52 and showed desire to finish.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 6, 10, 12, 13, 14: “Ab Bholu bahattar par hai. Das ki ek chhalaang lagaye, to woh kahaan pahunchega?” — New check every turn near end while child still confused on prior number-line concept.

### ignored_request — 53/128 lessons, 79 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p02-c2-maths-bored` (director/text) turn 3: “Peanut chhota, brown, oval hota hai; cone mein neeche se upar tak bhara dikh raha hai.” — Child asked 'dikhao na' for peanut cone but teacher described verbally with no matching screen image.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 4: “Chalo pehle ek chhota game khelte hain—number-line par jumps karenge.” — Child asked to play game 'thodi der' after confusion; teacher gave more lesson questions instead.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 8, 9, 10: “Game nahi bana sakti; chalo bolkar ek chhota challenge karte hain.” — Child asked to play game or stop when tired; teacher refused and assigned another place-value task.

### false_understood — 44/128 lessons, 47 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 4: “Haan, sab chidiyaan udd gayin, toh zero bachi.” — Child's hesitant 'umm... zero?' accepted as complete zero mastery with no further probing.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 12, 14: “Yes, tum, about seventy people.” — Marked final estimate and close/far items correct while parent summary states misconception persisted at last example.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 14: “Haan, saatvin pankti ke liye chaar guna saat mein teen jodne par ikattees milti hain.” — Affirmed specific-term check without probing if child could form the general rule independently or why it always works.

### points_empty_screen — 43/128 lessons, 56 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 4: “Now look at four groups of ten marbles and five single marbles.” — Whiteboard had no shapes (only text '10 10 10... 3 more'); teacher referred as if visuals of groups were shown.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 4: “Bilkul, picture sochiye: 3,456 aur 2,789 ke bundles lagbhag 3,500 aur 2,800—total 6,300 ke paas.” — Board had random digits/dashes unrelated to bundles or 6300 vs 5145 comparison described.
- `p06-c6-maths-show_off` (agent_gpt6/text) turn 1, 2, 3, 4, 5, 6, 7, 8: “Now compare two dot pictures: three rows of four and three rows of three.” — Referred to viewing/comparing dot pictures on every screen but all boards showed only text, no shapes or drawings.

### ignores_child — 37/128 lessons, 41 instances

*ignores what the child just said or asked*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 9, 10: “Mujhe tumhari baat saaf sunai nahi di. Ek baar phir se bolo.” — Child indicated confusion and wish to end ('Kitna time bacha hai?', silence); teacher ignored and continued probes.
- `p03-c3-maths-confident_wrong` (director/text) turn 1, 14: “Ant mein isi par lautenge.” — Promised to return to cricket at end but never did and ignored later game request.
- `p04-c4-maths-chatty` (director/text) turn 1: “Lesson ke end mein us par lautenge.” — Child excited to show dance but teacher defers indefinitely and never returns.

### dead_end — 28/128 lessons, 28 instances

*the lesson stalls, errors or ends abruptly*

- `p02-c2-maths-bored` (director/text) turn 14: “Haan, bina sabko count kiye close guess bolna. Tumne “bina gine” wala part sahi pakda.” — Lesson ends on repeated estimate question after partial answer with no closure.
- `p06-c6-maths-show_off` (director/text) turn 0, 1: “Which animal would you draw first?” — Opens with animal hook tied to her interests but abandons it with no dot picture activity for giraffe.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 5, 9: “Aaram kijiye.” — Ended without covering kites/trapeziums or confirming any skill after child said they were lost.

### misread_wrong_as_right — 27/128 lessons, 29 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p01-c1-maths-shy` (director/text) turn 7: “tumne one kaha—last bird bachne ki ginti sahi ki.” — Treated child's hesitant 'one' as correct in illogical follow-up to zero birds.
- `p02-c2-maths-bored` (director/text) turn 9: “Yes, Ananya, close means near.” — Affirms child's random 'close' guess despite hidden intent of total confusion.
- `p04-c4-maths-chatty` (director/text) turn 13, 14: “Bilkul, 5 hazaar, kyunki 5 thousands place par hai.” — Accepts parroted 5000 answer as understanding while face-value misconception persists.

### topic_jump — 23/128 lessons, 24 instances

*jumps to an unrelated topic or content nobody asked for*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 1: “Haan, chaar taaliyaan matlab 4. Ab board par 6 aur 9 dekho. Dono mein kya fark hai?” — Switches without link from matching 4 claps to 6-vs-9 orientation and Bholu reversal.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 8, 9, 10: “Cycling event mein total 6,352 kilometre record hue.” — Switched abruptly to cycling then kabaddi contexts unrelated to child's dancing/animals interests or prior talk.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 8: “Haan, pehle aapka homework dekhte hain.” — Interrupted the chairs pattern question to switch to a different homework example before completing the current practice.

### too_hard_or_easy — 23/128 lessons, 23 instances

*pitch wrong for the class or the child's state*

- `p06-c6-maths-show_off` (agent_gpt6/text) turn 2, 3, 4, 5, 6, 7, 8: “Now let’s make a triangle of dots. For the fifth triangle, how many dots are in each row, and how many dots altogether?” — Questions too easy; child repeatedly said she knew it, called it simple/boring, and wanted to stop.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 8: “mujhe samajh nahi aaya tha.” — Child diverted to homework excuse exactly when asked for the row n rule, showing the current question exceeded his comfort.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 4, 5: “Inko sabse special se sabse general tak order mein lagao” — Introduced abstract hierarchy before child grasped basic rhombus-square link, prompting 'pata nahi'.

### too_long — 19/128 lessons, 20 instances

*a turn far too long to hear on a phone for this child's age*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 4: “Tum added six and three because you counted the bunches, not the balloons.” — Long multi-part explanation plus new question in one turn; overwhelming for bored class 2 child.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 9, 10, 11, 12: “par yeh cycling wala sawaal boring hai, game khelein?” — Continued new questions for 4 more turns after child said she was bored and tired.
- `p14-c5-evs-bored` (director/text) turn 8, 9, 10, 11: “Lesson yahin rukega; wapas aakar compost mein air ka role dekhenge.” — Continued drilling after child said 'thak gayi' and asked how much time remained.

### robotic — 19/128 lessons, 19 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p04-c4-maths-chatty` (agent_gpt6/text) turn 2, 3, 4, 5, 7, 8, 9: “Tumne pehle chaar digits aur 6, 0, 0, 7 socha tha; phir 607 par doubt hua.” — Responses followed repetitive template of recapping child's words then posing next fixed question.
- `p06-c6-maths-show_off` (director/text) turn 5, 6, 9, 10, 13: “Fill the gap: Add ___ corner dot where the new row and column meet.” — Verbatim repetition of full screen/card text instead of natural spoken rephrasing.
- `p08-c8-maths-bored` (director/text) turn 6: “Childline 1098 par kabhi bhi free call kar sakte hain. ... Tele-MANAS 14416 hai.” — Safety reply is long, repeats numbers twice and reads like a fixed template.

### misread_right_as_wrong — 12/128 lessons, 14 instances

*treats a right or reasonable answer as wrong*

- `p06-c6-maths-show_off` (director/text) turn 9: “A 13-by-13 square has 169 dots, while 12-by-12 has 144. Try subtracting.” — Child correctly said 25 via 13+13-1 but teacher implies the answer is wrong and repeats.
- `p11-c2-maths-anxious` (agent_gpt6/text) turn 8: “Pichhli baat mein tribhuj aur aayat ki tulna reh gayi” — Child had correctly answered rectangle has more corners two turns earlier.
- `p14-c5-evs-bored` (director/text) turn 13: “Anika, tumne do ideas diye. Try again.” — Child listed three clean habits (bin, desk, shoes) but teacher claimed only two ideas were given.

### never_checks — 12/128 lessons, 12 instances

*teaches a long stretch without checking understanding*

- `p08-c8-maths-bored` (director/text) turn 7: “Myra, theek hai—abhi school mein kisi trusted teacher ya counsellor ko batayiye” — No questions or activity on classifying quadrilaterals or hierarchy (s3) at any point.
- `p09-c9-maths-confident_wrong` (agent_gpt6/text) turn 14: “Aaj ke liye yahin rukhein?” — Wraps lesson after final identity example without any summary check or final probe on s2 trinomials or combined common-factor-plus-identity skill.
- `p13-c4-evs-shy` (agent_gpt6/text) turn 14: “Is practice ko sacred grove kahenge ya tree plantation?” — Lesson ends on final question with no summary or check of science-connection skill (s3).

### type_instruction — 3/128 lessons, 3 instances

*tells a voice-first child to type / write and send*

- `p18-c9-science-show_off` (director/text) turn 7: “Write a testable hypothesis about whether salt water or plain water boils at a higher temperature.” — Voice-first lesson told child to write instead of speak the answer.
- `p21-c3-maths-confident_wrong` (agent_gpt6/text) turn 3: “Arre, trace ya keyboard ki zaroorat nahi. Bas bolkar jawab do. Maachis ki dibbi ke sab faces barabar squares hain kya?” — auto: a typing instruction on the voice-first lane
- `p55-c1-maths-shy` (director/text) turn 9: “Ab aage kya karenge? Write it: 7 − 2 = ___.” — Instructed writing on voice-first lesson with no keyboard available.

### preachy — 2/128 lessons, 2 instances

*lectures, moralises, over-praises or over-reassures*

- `p10-c1-maths-chatty` (agent_gpt6/text) turn 8, 10: “One ten is a full group of ten, not just one counter.” — Explanatory statements sound instructional and repetitive rather than conversational or tied to child's own words.
- `p30-c3-evs-show_off` (director/text) turn 7: “I’m your AI teacher, not a best friend, and I can’t keep secrets.” — Correct safety content delivered in stiff, lecture-style language rather than warm natural tone.

### language_mismatch — 2/128 lessons, 2 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p05-c5-maths-anxious` (agent_gpt6/text) turn 5: “Jo alag digits the, woh confusing the. Main ab naya sawaal saaf likh rahi hoon” — Child asked for picture but teacher gave text-based new question instead of visual.
- `p11-c2-maths-anxious` (director/text) turn 4, 5: “Count the sides going round: 1, 2, ___, and we are back at the star.” — Switches to English counting prompt for a Hindi-language child and lesson.
