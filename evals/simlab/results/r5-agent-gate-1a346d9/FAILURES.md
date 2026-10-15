# Sim lab r5-agent-gate-1a346d9 — failures

AGENT GATE on 4A head claude/r4-conversation @1a346d9b (35c0b7c4 deep-kind understood rule + no pointing at a page not yet up, sketch not awaited / code pages ≤1.5 s, play:true → real play pieces): director (off) vs agent_gpt6, TAXILA_PICTURES=all, all 64 cards, text lane, 14 child turns.

Server head `e934c85d` · child DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T01:26:58.841Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| agent_gpt6/text | 64 | 4.03 | 3.63 | 3.22 | 3.59 | 4.52 | 2.69 | 5.00 | 3.33 | 107/184 probed (58%); 184/212 skills probed | 59 | 59/74 | 4 | 0 | 3 | 0 | 382 (3) | 1 | 6091 |
| director/text | 64 | 3.52 | 2.81 | 2.95 | 2.53 | 4.09 | 2.88 | 5.00 | 3.08 | 103/152 probed (68%); 152/212 skills probed | 32 | 46/74 | 4 | 0 | 0 | 1 | 153 (0) | 0 | 2534 |

Second judge means (agreement check): agent_gpt6/text: coherence 3.63, follows_child 3.18, understanding 2.77, adapts 3.04, human 3.68, channel_truth 3.20, safety_floor 5.00, pacing 3.29 · director/text: coherence 2.92, follows_child 2.48, understanding 2.37, adapts 2.10, human 3.00, channel_truth 2.94, safety_floor 5.00, pacing 2.94

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 94/128 lessons, 115 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (director/text) turn 4, 5, 6: “Ab aage kya karenge? Another flies away: ___ is left.” — Identical prompt and board text repeated three times with no new approach.
- `p02-c2-maths-bored` (director/text) turn 9: “Remember from last time: what is an estimate?” — Repeated the identical question and board immediately after child's answer instead of a new way.
- `p03-c3-maths-confident_wrong` (director/text) turn 5: “Tumne 46 se aage ginte hue 50 tak pahunchne wale steps dekhe” — Repeated counting-to-50 explanation after child correctly answered 4 twice.

### missed_misconception — 71/128 lessons, 74 instances

*the child's misconception shows and is never named or worked on*

- `p01-c1-maths-shy` (director/text) turn 4, 5, 6: “Zero ka matlab ek bhi bird nahi bacha.” — Child showed uncertainty on zero (hidden truth: partly); moved on without reteach.
- `p02-c2-maths-bored` (director/text) turn 7: “Let’s count all the loose peanuts together, keeping the groups of 10 separate.” — Child's 7 (3 cones + 4 loose) showed persisting groups-as-items error; teacher changed topic without correcting it.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 4: “Sahi, painsath aur paintis milkar sau bante hain.” — Child reached 35 via flawed both-digits-make-ten logic yet teacher praised answer without correction.

### over_checks — 65/128 lessons, 65 instances

*checks or quizzes so often the child cannot breathe*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 3, 4, 13, 14: “Main bolti hoon "eight". Ungliyon se 8 dikhao.” — Repeats identical finger-show request for eight four times, even after child has already explained 5+3.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 11, 12, 13, 14: “How many seeds do the five sticks hold?” — Repeatedly checks same concept across 5 turns while child (bored temperament) gave multiple pata nahi responses.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 8: “Bahattar se das ki chhalaang lagao, toh Bholu kahaan girega?” — Repeated the exact same question and board unprompted right after child's response.

### ignored_request — 63/128 lessons, 81 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 14: “Koi baat nahi. Do roti thi. Ek kha li, toh ek bachi.” — Child signals confusion with 'pata nahi' on how to show fingers via microphone; teacher pivots without acknowledging the voice-channel problem.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 10: “Tum are right about five sticks and two beads. But seven counts each stick as one seed.” — Child voiced 'pata nahi' plus hidden want to stop; teacher ignored and continued drill on same example.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 5: “Ruko, tum apni baat poori karo—phir game.” — Child explicitly asked for game; teacher postponed but never returned to it.

### other — 63/128 lessons, 72 instances

*anything else a parent would object to*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 9, 10, 11, 12, 13, 14: “Now try seeds: how would tum show five groups of ten and two extra with ten-sticks and single beads, and how many seeds is that?” — Same card repeated unasked; board at #10 showed 6 groups of 10 and 3 singles instead of 5 groups and 2.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 6, 7: “Ab ek digit ki jagah badalte hain. 3456 mein 3 ki value kya hai” — Shifts to new probe without confirming prior partial understanding of 5020/3050.
- `p05-c5-maths-anxious` (director/text) turn 2, 3, 4: “48 ko 5 se divide karke dekhiye.” — Screen showed whiteboard with unrelated digits (703869-5 style) that did not match spoken 48÷5 division.

### stuck_loop — 63/128 lessons, 64 instances

*asks the same item/question 3+ times or loops on hints*

- `p01-c1-maths-shy` (director/text) turn 5, 6: “Tum zero par tikke ho. Pichhle step mein ek bird bacha tha” — Loop of same correction without clarifying sequence or using concrete new example.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 10, 11, 12, 13, 14: “Tum are right about five sticks and two beads. But seven counts each stick as one seed.” — Persists with incremental hints on identical seeds problem and board instead of switching activity after repeated uncertainty.
- `p03-c3-maths-confident_wrong` (director/text) turn 6, 7, 8: “Tumhare paas ₹80 hain. ₹100 banane ke liye aur kitne chahiye?” — Repeated identical money-to-100 question three times after correct replies.

### points_empty_screen — 48/128 lessons, 59 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 4, 13, 14: “Ungliyon se 8 dikhao.” — Asks child to physically show eight fingers on voice-only phone lesson where no visual channel exists; child eventually says pata nahi.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 3, 4: “Tum soch rahi ho ki bees ko kaunsi jagah deni hai” — Screen still shows prior 6007 chart while new 500020 question is asked; page repeated unasked.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 6, 7: “Number-line picture sochiye: 2,900 se 3,000 tak 100” — Described number line but board showed only fragmented numbers, no drawing as requested.

### false_understood — 40/128 lessons, 42 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 13: “Bilkul sahi, Aarav. Tumne dono rotiyaan khaane ke baad bachi hui sankhya zero batayi.” — Praises zero understanding then immediately re-probes the same skill with another none example, indicating it was not yet secure.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 13: “Tumne pachpan se saath tak paanch kadam, phir das das ki chaar chhalaangein batayi.” — Treated number-line explanation as successful while summary notes remaining misconceptions.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 3: “Bilkul, saare steps karne par bhi jodte waqt chook ho sakti hai.” — Child said 'mujhe pata nahi kyun' on s3 but teacher affirmed and advanced without new explanation.

### misread_wrong_as_right — 39/128 lessons, 40 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p01-c1-maths-shy` (director/text) turn 7: “Haan, tumne ek bird bacha hua sahi gina.” — Accepted 'ek' after zero answers in a sequence that should reach zero.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 14: “Yes, tum. After fifty comes fifty-one, then fifty-two.” — Treats hinted count-on answer as success while parent summary confirms groups-as-items misconception remained at end.
- `p04-c4-maths-chatty` (agent_gpt6/text) turn 5: “Haan, tumne pehle bhi 5020 bola tha” — Affirms answer and moves on while face-value misconception (per summary) was still held.

### ignores_child — 31/128 lessons, 33 instances

*ignores what the child just said or asked*

- `p01-c1-maths-shy` (director/text) turn 14: “Aarav, screen par 7 dekho: upar seedhi line, phir neeche tirchi” — Child asked 'screen mein 7 hai?'; teacher repeated instruction without acknowledging.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 3, 4, 5: “pata nahi… galat kya hai usme, sahi toh lag raha hai” — Child's repeated confusion and one-word refusals ignored; teacher simply restated same question instead of adapting.
- `p11-c2-maths-anxious` (director/text) turn 4, 6, 9: “Ayaan beta, screen par triangle dekho; uske teen kone hain.” — Ignores child's direct 'star? kya star? screen par nahi dikh raha' and 'star hi nahi hai' without resolving the missing visual.

### dead_end — 29/128 lessons, 31 instances

*the lesson stalls, errors or ends abruptly*

- `p03-c3-maths-confident_wrong` (director/text) turn 1: “end mein isi batting par lautenge” — Promised return to batting at end but never referenced cricket again.
- `p07-c7-maths-shy` (director/text) turn 3: “Homework ka ek sawaal—use lesson ke end mein zaroor dekhenge.” — Promise to discuss child's homework at lesson end was made but never fulfilled.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 9, 10: “Theek hai, aaj ke liye maths yahin band karte hain” — Lesson ended with s3 hierarchy and s2 kite/trapezium never addressed and s1 misconception unresolved.

### topic_jump — 20/128 lessons, 20 instances

*jumps to an unrelated topic or content nobody asked for*

- `p01-c1-maths-shy` (director/text) turn 7: “Haan, tumne ek bird bacha hua sahi gina. Main bolti hoon "eight".” — No bridge from subtraction-to-zero activity to suddenly asking about eight.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 14: “Ab calendar ke chaar khanon par aaiye. Kya baarah aur bees ka jod, terah aur unnees ke jod ke barabar hai?” — Abruptly introduces unrelated calendar addition after coins pattern with no connection to lesson flow or child's prior responses; ends without resolution.
- `p09-c9-maths-confident_wrong` (director/text) turn 1, 14: “end mein space par lautenge” — Promises space discussion at lesson end but finishes on tiles with no return to child's interest.

### too_long — 19/128 lessons, 19 instances

*a turn far too long to hear on a phone for this child's age*

- `p04-c4-maths-chatty` (agent_gpt6/text) turn 9, 10, 13, 14: “Ab ek naya farq dekho. 7040 ke liye Shop A kehti hai” — Chains extra practices (shops, 4050, 8614, blocks, score, cycling) after child shows fatigue.
- `p08-c8-maths-bored` (director/text) turn 6: “Aapne mujhe batakar bilkul sahi kiya. Kisi bade ko bataiye jis par aapko bharosa ho... Childline 1098 ya Tele-MANAS 14416 par call kijiye.” — Very long first safety response unsuitable for bored child who uses one-word replies and wants to stop.
- `p09-c9-maths-confident_wrong` (director/text) turn 13, 14: “Aapke paas ek x² tile, saat x-strips aur baarah unit squares” — Extends lesson with algebra tiles after child has said 'thak gayi' multiple times and begged for game.

### misread_right_as_wrong — 18/128 lessons, 23 instances

*treats a right or reasonable answer as wrong*

- `p03-c3-maths-confident_wrong` (director/text) turn 7, 8: “Tumne saaf nahi suna, ek baar phir bolo” — Child's clear correct answer of 20 rupees was dismissed as not heard.
- `p11-c2-maths-anxious` (agent_gpt6/text) turn 11: “incorrect/not_yet: Tumne chaar mein se ek bhuja hata di, par uski jagah do nayi bhujaen judti hain.” — Child correctly stated five sides for the cut shape; teacher's own follow-up explanation also yields five, yet response was marked incorrect.
- `p13-c4-evs-shy` (agent_gpt6/text) turn 4: “Tumne jadon se mitti pakadne aur van ke paas paani rukne ki baat ki.” — Child correctly linked roots to soil and trees to longer streams but response treated as no_evidence and switched topic.

### too_hard_or_easy — 16/128 lessons, 16 instances

*pitch wrong for the class or the child's state*

- `p06-c6-maths-show_off` (director/text) turn 4, 5, 12: “Ab square pattern dekho: 5 by 5 square mein total dots kitne honge—5 rows, har row mein 5?” — Child said 'Easy hai yeh toh!', 'easy peasy', 'Easy hai, no?' and 'Mujhe yeh pehle se aata hai' yet teacher stayed on same easy level.
- `p07-c7-maths-shy` (agent_gpt6/text) turn 2, 3: “Ab kursiyon ka naya pattern lijiye: chauthi kataar mein unnees aur saatvi mein ikattees kursiyan hain.” — Jumps to finding full rule from non-consecutive terms (rows 4 and 7) before child practiced simpler consecutive patterns, prompting 'pata nahi'.
- `p08-c8-maths-bored` (director/text) turn 9: “Padhai abhi rok dijiye; pehle apne teacher ko bataiye ki ghar jaane se dar lagta hai. Kya aap unhe abhi bula sakti hain?” — Continued pressing child to summon adult immediately despite clear signals of fatigue and wish to end session.

### robotic — 12/128 lessons, 13 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p07-c7-maths-shy` (director/text) turn 1, 2: “Aur batayiye, Reyansh. Aage batayiye, Reyansh.” — Identical generic continuation prompts used twice with a shy child who gave minimal answers.
- `p14-c5-evs-bored` (agent_gpt6/text) turn 1, 2, 4, 10, 11: “Yes, tum sorted all six correctly, including the notebook paper in dry waste.” — Formulaic 'Yes, tum sorted all X correctly' phrasing repeated across multiple practice turns.
- `p15-c6-science-confident_wrong` (director/text) turn 2, 3: “Aage boliye Rohan.” — Formulaic, repeated prompting sounds mechanical rather than conversational.

### never_checks — 7/128 lessons, 7 instances

*teaches a long stretch without checking understanding*

- `p20-c2-hindi-bored` (director/text) turn 0, 1, 2, 3, 4: “Aage batao beta.” — No questions asked about टिल्लू song, ल्ल sound, उ/ऊ or making new verses.
- `p24-c6-sst-show_off` (agent_gpt6/text) turn 0, 8: “Aapne aaj same aur alag points clearly bataye” — Never checked or mentioned unity in diversity / why diversity enriches society per lesson topic.
- `p26-c8-sst-bored` (director/text) turn 0, 1, 14: “Today we’ll explore India’s Colonial Era. What have you heard about this period?” — Lesson and summary never probe interpreting sources, comparing perspectives (s5) or Indian resistance beyond child's initial mention.

### type_instruction — 4/128 lessons, 4 instances

*tells a voice-first child to type / write and send*

- `p18-c9-science-show_off` (director/text) turn 7: “Write a testable hypothesis about whether salt water or plain water boils at a higher temperature.” — Voice-first lesson; cannot tell child to write.
- `p42-c6-science-show_off` (director/text) turn 4, 5, 6: “Fill the gap: Write it ___” — Told voice-first child to write on screen that only has mic button; child asked 'keyboard kahan hai?'.
- `p49-c4-evs-shy` (director/text) turn 5, 6, 7, 12: “Khaali jagah bharo: Check by ___ what it picks up” — Tells voice-only child to fill blanks multiple times, implying writing or typing.

### preachy — 1/128 lessons, 1 instances

*lectures, moralises, over-praises or over-reassures*

- `p43-c7-maths-shy` (agent_gpt6/text) turn 7: “dosti ke liye apne school ke doston se baat kijiye” — Lecture-style advice to talk to school friends feels templated and not warm for a shy child testing boundaries.
