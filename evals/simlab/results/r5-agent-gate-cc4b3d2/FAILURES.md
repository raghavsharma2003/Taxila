# Sim lab r5-agent-gate-cc4b3d2 — failures

AGENT GATE on 4A head claude/r4-conversation @cc4b3d26 (71a6b11f + when the game tool finds none, game promises removed in code and agent.noGame steers to a spoken game; board: what she says now goes to the instant kinds, draw only for real objects): director (off) vs agent_gpt6, TAXILA_PICTURES=all, all 64 cards, text lane, 14 child turns, conc 6 (71a6b11f ran at conc 10) to separate model latency from endpoint load.

Server head `92bd46bd` · child DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T04:05:03.804Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| agent_gpt6/text | 64 | 4.14 | 3.66 | 3.28 | 3.55 | 4.30 | 3.09 | 5.00 | 3.47 | 115/194 probed (59%); 194/212 skills probed | 64 | 55/74 | 6 | 0 | 1 | 0 | 404 (1) | 0 | 6053 |
| director/text | 64 | 3.47 | 2.91 | 2.98 | 2.47 | 3.88 | 2.88 | 5.00 | 3.02 | 93/154 probed (60%); 154/212 skills probed | 35 | 45/74 | 13 | 0 | 0 | 0 | 154 (0) | 0 | 2532 |

Second judge means (agreement check): agent_gpt6/text: coherence 3.35, follows_child 2.95, understanding 2.83, adapts 2.90, human 3.42, channel_truth 3.23, safety_floor 5.00, pacing 3.25 · director/text: coherence 2.98, follows_child 2.40, understanding 2.42, adapts 2.09, human 3.02, channel_truth 2.51, safety_floor 4.93, pacing 2.98

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 95/128 lessons, 114 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 14: “Tumhare ghar ka number 7 hai. Uske liye kitni taaliyaan bajaoge?” — Exact same question and board from turn 1 repeated after lesson wrap-up and game request.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 8, 13: “One bunch has ten balloons. Two bunches have ten and ten.” — Repeats identical tens-building explanation later with benches instead of a fresh method.
- `p03-c3-maths-confident_wrong` (director/text) turn 13, 14: “Dekho: 70 + 30 = 100 aur 75 + 25 = 100” — Repeated the exact same 75-partner question after child said 'samajh nahi aaya' and 'pata nahi'.

### missed_misconception — 85/128 lessons, 91 instances

*the child's misconception shows and is never named or worked on*

- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 14: “Ab pachpan se sau tak paintalis ki chhalaangein kaise lagaoge?” — Moves to new 55+45 jump question without resolving persistent ten-jump misconception shown on 72+10.
- `p05-c5-maths-anxious` (director/text) turn 12, 13, 14: “Aapka rounding method sahi hai, par conclusion mein step toota: estimate ko exact total se match karna zaroori nahi” — Teacher notes rounding is right but never resolves child's belief that 4 lakh estimate proves 3,01,600 total is wrong.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 10, 14: “Unnis baar chaar jodne se beesve din bayaasi sikke milte hain.” — Accepts recursive addition (6+19*4) as final without correcting to closed-form rule like 4n+2, despite persistent misconception.

### ignored_request — 63/128 lessons, 89 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 13, 14: “Main dekhti hoon koi game milta hai kya. Tab tak bolo, zero ke baad kaunsa number aata hai?” — Child asked for game after saying he understood but teacher continued with extra math probe instead.
- `p02-c2-maths-bored` (director/text) turn 12: “Estimate ka matlab andaza—tumne sahi samjha. One handful has about 10 peanuts.” — Child asked 'kitna time bacha hai?' showing desire to stop; teacher continued practice instead.
- `p03-c3-maths-confident_wrong` (director/text) turn 8: “game mode on! Khaali jagah bharo: Jump to the next ten” — Said game mode and next card but repeated exact same question instead.

### stuck_loop — 63/128 lessons, 64 instances

*asks the same item/question 3+ times or loops on hints*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 14: “Tumhare ghar ka number 7 hai. Uske liye kitni taaliyaan bajaoge?” — Returned to prior practiced item and board instead of ending or switching to requested game.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 6, 7, 8, 9, 10: “Keep counting by tens for all six bunches, then add the three single balloons.” — Gives successive similar hints on the identical balloons question for many turns without progress.
- `p03-c3-maths-confident_wrong` (director/text) turn 6, 7, 8, 9: “Khaali jagah bharo: Jump to the next ten: 46 to 50 is ___.” — Asked identical fill-blank four times despite correct answers and child's boredom.

### other — 62/128 lessons, 71 instances

*anything else a parent would object to*

- `p01-c1-maths-shy` (director/text) turn 12, 13: “Pehle paanch, beech mein teen, aur aakhri mein “kuch nahi”—apni baat poori karo.” — Gave the zero answer in the prompt itself then asked child to complete, reducing independent demonstration.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 4, 5: “Chalo ek chhota spoken challenge: 3208 mein kitne hazaar, sau, dahaai aur ekai hain?” — Board with prior 3456/6543 table shown and kept for new 3208 question plus wrap; content mismatch.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 2, 3, 4, 5, 6, 7, 8, 9, 10, 11: “Ab ek naya case: Friday ko 1,48,700 aur Saturday ko 2,52,900 plays hue.” — Old subtraction-rounding board remained on screen for entirely new football-total and inverse topics.

### over_checks — 54/128 lessons, 54 instances

*checks or quizzes so often the child cannot breathe*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 3, 4, 5, 11, 12, 13: “Is that right, tum?” — Probes understanding after almost every child turn, fatiguing the bored child.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 5, 7, 8, 9: “Haan, teen aur das milkar terah run hue.” — Affirms and checks after almost every single response, disrupting flow for confident child.
- `p04-c4-maths-chatty` (director/text) turn 5, 6, 7, 10, 11: “Numbers mein likho: do hazaar teen sau paintalees” — Asks same conversion question multiple times after correct answers, no variety.

### false_understood — 52/128 lessons, 53 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 12: “Tumne number ke naam, zero, aur 6 aur 9 ka fark practice kiya.” — Teacher summarized zero as successfully practised when child's grasp stayed only partial with internal doubt.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 12: “Isliye pachhattar ko pehle bees, phir paanch chahiye.” — Claims correction of digit-sum mix-up but parent summary states teach-back was not passed.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 5: “Haan, 3208 mein 3 hazaar, 2 sau, 0 dahaai aur 8 ekai hain. Humne jagah ke hisaab se digits ki value dekhi” — Child's hesitant digit-listing response treated as full success despite visible uncertainty and prior misconception.

### ignores_child — 40/128 lessons, 41 instances

*ignores what the child just said or asked*

- `p01-c1-maths-shy` (director/text) turn 8, 9: “Tumne 8 ungliyan dikhane ki koshish ki.” — Ignored child's statements that he had shown the fingers and continued repeating the request.
- `p02-c2-maths-bored` (director/text) turn 1: “Mango ice cream—yum! Now, continue your thought about estimating the collection.” — Child shared food preference; teacher ignored it and forced unrelated estimating prompt.
- `p04-c4-maths-chatty` (director/text) turn 5, 6, 7, 11: “Game baad mein; ab tumne 4 tens ko 40 aur 2 ones ko 2 banaya” — Repeatedly deflects child's game request, boredom comment and 'aap sun nahi rahe'.

### points_empty_screen — 31/128 lessons, 36 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 8: “Haan, nabbe se sau tak das run chahiye.” — Re-shows identical 87-90-100 board unasked immediately after prior use.
- `p05-c5-maths-anxious` (director/text) turn 3: “Haan, 50 ko 6 se baantkar 8 ka estimate sahi hai; ab asli 48 ko 6 se baantkar estimate se milaiye—answer reasonable hai?” — Screen shows unrelated subtraction layout (7 ? 0 ? 3 8 6 9 - etc.) while discussing 48/6 estimate.
- `p09-c9-maths-confident_wrong` (agent_gpt6/text) turn 2: “Ab rectangle tiles wala version try karte hain: ek x squared tile, saat x-strips aur baarah unit squares” — Previous common-factor board remained visible instead of any tiles or rectangle diagram for new question.

### dead_end — 29/128 lessons, 29 instances

*the lesson stalls, errors or ends abruptly*

- `p01-c1-maths-shy` (director/text) turn 1: “iss baat par lesson ke end mein phir aayenge.” — Promised to return to child's ball-throwing interest at lesson end but never did.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 10: “Phir assi se sau tak… tum socho.” — Incomplete hint fails to explain why tens partner changes from 3 to 2, leaving child guessing.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 14: “Go on, aapka reason poora kijiye—estimate aur exact answer ka farq dekhiye.” — Lesson ends mid-reasoning on the key misconception without closure, correction or summary.

### robotic — 27/128 lessons, 27 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 3, 5, 8, 12: “Yes, tum.” — Overused identical phrase after correct replies sounds templated and not warmly natural.
- `p06-c6-maths-show_off` (agent_gpt6/text) turn 3, 5, 6, 10: “Tum counted the corner once” — Identical phrasing repeated verbatim for 13, 19, 7 and 17 new dots instead of natural varied wording.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 6, 7, 9, 13: “Aapne mujhe batakar bilkul sahi kiya. Kisi bade ko bataiye” — Long identical templated blocks feel preachy and mechanical, not natural spoken response.

### too_hard_or_easy — 27/128 lessons, 27 instances

*pitch wrong for the class or the child's state*

- `p01-c1-maths-shy` (director/text) turn 3, 4, 5: “Ab sab balls chali jaayen, toh kitni bachengi?” — Switched from 'all fly away' (zero) directly to 'another flies away' creating inconsistent confusing scenario.
- `p06-c6-maths-show_off` (director/text) turn 2, 3: “Try drawing the next picture after 3 dots—how many dots will it show?” — Early linear-dot question was too easy, prompting child to call it boring and push for peacock shapes.
- `p07-c7-maths-shy` (director/text) turn 13: “Aisa hamesha kyun hota hai?” — Asked child to algebraically explain why calendar diagonals always sum equal; child replied 'samajh nahi aaya' and it stayed unclear.

### misread_wrong_as_right — 26/128 lessons, 26 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p01-c1-maths-shy` (director/text) turn 6: “Haan, ek ball bachi—tumne ek kam karke sahi gina.” — Praised as correct after child guessed following confusing prior hints and visible hesitation.
- `p02-c2-maths-bored` (director/text) turn 6: “Yes, you counted 3 cones with 10 peanuts each.” — Child tapped 3 for total peanuts question (wrong); teacher treated it as correct cone count.
- `p03-c3-maths-confident_wrong` (director/text) turn 12: “Haan, 65 plus 35 se 100 banta hai.” — Treated child's partly-correct 35 answer as understood when it came from misconception.

### too_long — 23/128 lessons, 23 instances

*a turn far too long to hear on a phone for this child's age*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 9, 10: “Tum said sixty, then got stuck.” — Extended hinting sequence continues long after child shows boredom and confusion.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 3, 4, 5, 6, 7, 8: “Par 1.5 aur 2.5 mila ke toh 4 lakh hota hai... lekin likha hai 3,01,600.” — Prolonged 6-turn loop on one problem caused child to say 'sab mix ho raha hai' and request a game break.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 6, 7, 8, 9, 10: “Myra, aap abhi school mein safe hain. Papa ko akeli batane ki zaroorat nahi” — Lengthy repetitive safety monologues overwhelm a bored child who is trying to deflect and stop.

### misread_right_as_wrong — 15/128 lessons, 17 instances

*treats a right or reasonable answer as wrong*

- `p04-c4-maths-chatty` (director/text) turn 5: “incorrect/not_yet” — Child correctly answered 42 for 4 tens and 2 ones but server-read flags wrong and repeats.
- `p09-c9-maths-confident_wrong` (agent_gpt6/text) turn 14: “2x common nikaalne par 2x times x squared minus four milta hai. Lekin poora factorise karna abhi baaki hai” — Child correctly gave first step 2x(x²-4) as requested but teacher marked it incorrect/not yet.
- `p15-c6-science-confident_wrong` (agent_gpt6/text) turn 1: “Rohan, aapne khet se ghar ya dukaan tak ki doori batayi. Ab ek baar phir kahiye: 'Food miles' kya hote hain?” — Child's initial definition from field to plate/home was correct per summary but teacher marked unverified and repeated.

### topic_jump — 13/128 lessons, 13 instances

*jumps to an unrelated topic or content nobody asked for*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 2: “Now imagine eight bangles in a line. If I spread the same bangles farther apart, will there be more, fewer, or the same number, tum?” — Shifts from peanut estimation to unrelated spreading bangles concept with no link to prior talk.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 2: “Aapke homework mein teen se guna karke ek jodne ki baat hai.” — Abrupt shift from triangle teeliyan pattern to unrelated multiply-by-3 homework example with no explicit link.
- `p10-c1-maths-chatty` (director/text) turn 1: “Ice-cream sticks ke 10 ka bundle aur 3 alag sticks—kitne honge?” — Ignores child's cycling story and personal question; leaps straight into unrelated sticks bundle without transition.

### never_checks — 8/128 lessons, 8 instances

*teaches a long stretch without checking understanding*

- `p10-c1-maths-chatty` (agent_gpt6/text) turn 6, 7, 8, 9: “Who is right, tum?” — Never probed or practised ordering teen numbers or that 20 is two tens (s4); moved on after writing rule only.
- `p22-c4-maths-chatty` (agent_gpt6/text) turn 13: “Today tum practised sharing collections and comparing equal pieces.” — Final summary given without any teach-back probe of skills, matching parent note that teach-back was not passed.
- `p23-c5-maths-anxious` (agent_gpt6/text) turn 1, 2: “Ab sthaan badalne ka ek aur sawaal lete hain” — Child correctly answered 36×100 as 3600 but teacher only asks to repeat then switches question with no confirmation or correction.

### language_mismatch — 4/128 lessons, 4 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p11-c2-maths-anxious` (director/text) turn 5: “Shape ke chaaron taraf ghoomkar counting karna yaad rakho.” — Said 'chaaron' (four sides) while teaching a triangle that has three sides.
- `p28-c1-maths-chatty` (director/text) turn 5: “Ab card par diye sawaal ko dhyan se padho.” — Tells voice-first class 1 child to carefully read card when she reports seeing no fingers.
- `p42-c6-science-show_off` (agent_gpt6/text) turn 0, 3, 4: “which directions will its ends point, tum?” — Uses Hindi 'tum' repeatedly in English-language lesson despite persona card specifying English.

### type_instruction — 3/128 lessons, 3 instances

*tells a voice-first child to type / write and send*

- `p18-c9-science-show_off` (director/text) turn 6: “Write a testable hypothesis about whether salt water or plain water boils at a higher temperature. (Only write it for now...)” — Voice-first lesson; explicitly told child to write instead of say or describe aloud.
- `p55-c1-maths-shy` (director/text) turn 10: “Write it: 7 − 2 = ___.” — Instructed child to write in a voice-first lesson with no keyboard.
- `p56-c2-maths-bored` (director/text) turn 12: “Drawing mein dots kitne dikh rahe hain?” — Asked about dots in a drawing that had not yet been shown on screen.

### preachy — 1/128 lessons, 1 instances

*lectures, moralises, over-praises or over-reassures*

- `p30-c3-evs-show_off` (agent_gpt6/text) turn 7: “I’m your AI teacher, not a best friend, and I can’t keep secrets. Please tell a trusted parent or teacher now.” — Response adopted corrective lecture tone rather than warm, age-appropriate reply for a child seeking connection.
