# Sim lab r5-agent-gate-d6f93e7 — failures

AGENT GATE + Teacher bake-off on 4A head claude/r4-conversation @d6f93e7f: director (TAXILA_TEACHER=off) vs agent_gpt6 (TAXILA_TEACHER=agent, taxila-gpt6 = gpt-6-sol) vs agent_grok41 (grok-4-1-fast-non-reasoning), TAXILA_TEACHER_TIMEOUT_MS=6000, all 64 cards, text lane, 14 child turns. For the grok arm the Kimi judge is the one that counts (Grok judge = same family).

Server head `29de42f9` · child DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-14T21:00:39.380Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| agent_gpt6/text | 64 | 4.02 | 3.36 | 3.06 | 3.42 | 4.41 | 2.88 | 5.00 | 3.36 | 104/178 probed (58%); 178/212 skills probed | 63 | 55/74 | 7 | 0 | 1 | 1 | 8 (1) | 0 | 5874 |
| agent_grok41/text | 64 | 3.47 | 3.03 | 2.70 | 2.58 | 3.83 | 2.31 | 5.00 | 3.02 | 97/164 probed (59%); 164/212 skills probed | 52 | 53/74 | 4 | 0 | 5 | 0 | 4 (0) | 0 | 4139 |
| director/text | 64 | 3.31 | 2.84 | 3.03 | 2.41 | 3.84 | 2.42 | 5.00 | 2.89 | 104/156 probed (67%); 156/212 skills probed | 29 | 48/74 | 7 | 1 | 0 | 0 | 173 (35) | 0 | 2872 |

Second judge means (agreement check): agent_gpt6/text: coherence 4.00, follows_child 3.21, understanding 2.73, adapts 3.02, human 3.60, channel_truth 3.60, safety_floor 5.00, pacing 3.48 · agent_grok41/text: coherence 3.61, follows_child 2.69, understanding 2.41, adapts 2.36, human 3.07, channel_truth 3.20, safety_floor 5.00, pacing 2.93 · director/text: coherence 2.91, follows_child 2.45, understanding 2.39, adapts 2.14, human 2.97, channel_truth 2.45, safety_floor 5.00, pacing 2.89

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 149/192 lessons, 172 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (agent_grok41/text) turn 6, 7, 8: “Main bolti hoon "eight". Ungliyon se 8 dikhao.” — Repeated the exact same finger-showing instruction for eight three times instead of a new method.
- `p02-c2-maths-bored` (agent_grok41/text) turn 3, 8, 10, 11, 13, 14: “har group mein 10 hote hain” — Same explanation given six times; never shifts to drawing, real items or different analogy.
- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 6, 7, 10, 11, 12: “ek dahai ones mein chali gayi isliye 7+2=9” — Same carry explanation given 5+ times with no new approach like actual jumps.

### stuck_loop — 106/192 lessons, 109 instances

*asks the same item/question 3+ times or loops on hints*

- `p01-c1-maths-shy` (director/text) turn 4, 5, 6: “Ab aage kya karenge? Another flies away: ___ is left.” — Repeats exact birds/zero question three times with no new approach.
- `p02-c2-maths-bored` (agent_grok41/text) turn 12, 13, 14: “Ab bolo, 3 groups of 10 kitne honge?” — Asks identical question three times in a row after child says 'mujhe abhi bhi samajh nahi aaya'.
- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 4, 5, 6, 7: “48 ke saath kya milkar 100 banta hai?” — Same 48 question and screen repeated across turns while child grew confused.

### ignored_request — 103/192 lessons, 141 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 10: “Abhi game nahi hai. Chalo, bolkar ek paheli karein.” — Child asked to play game per his habit but teacher refused and substituted another zero question.
- `p02-c2-maths-bored` (director/text) turn 1: “Lesson ke end mein cake example par wapas aayenge.” — Promised return to child's cake interest at start but never revisited.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 4: “Batting wala game abhi nahi hai. Hum bolkar cricket ki tarah khel sakte hain.” — Child explicitly asked to switch to a batting game; teacher declined and pivoted back to math practice.

### missed_misconception — 97/192 lessons, 101 instances

*the child's misconception shows and is never named or worked on*

- `p01-c1-maths-shy` (agent_grok41/text) turn 13, 14: “Zero kuch nahi wala number sahi bola.” — Celebrated zero answers but did not address child's hidden confusion on using 0 after counting back.
- `p02-c2-maths-bored` (director/text) turn 5: “5 groups tumhara guess hai.” — Child counted 5 drawn rectangles (m-groups-as-items); teacher treated as valid guess and moved on.
- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 9, 10, 11: “75 mein 70 se 5 zyada hain. Toh ones 5 ko 25 ke 5 se 10 banaya” — Did not detect or fix persisting both-digits-make-ten pattern child voiced again.

### over_checks — 96/192 lessons, 96 instances

*checks or quizzes so often the child cannot breathe*

- `p01-c1-maths-shy` (agent_grok41/text) turn 4, 7, 8, 12, 13: “Aarav, haan aath ungli dikha raha hai sahi!” — Praised and re-checked the same 8-fingers action multiple turns in a row.
- `p02-c2-maths-bored` (director/text) turn 7, 8, 9, 10: “Remember from last time: what is an estimate?” — Excessive repeated checks on estimate definition bored the child.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 11, 12, 13, 14: “Tumne 87 se 90 tak teen run gine. Ab 90 se 100 tak kitne run chahiye?” — Repeatedly broke down and re-probed the same 87-to-100 jump after child had already given correct total of 13 multiple times.

### other — 94/192 lessons, 101 instances

*anything else a parent would object to*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 10, 11, 12: “Taar pe 3 chidiya baithi hain. Teeno udd jaati hain. Guess karo taar pe kitni bachi?” — Question card and persistent 6/9 whiteboard shown together, creating mismatch between talk and screen content.
- `p02-c2-maths-bored` (agent_gpt6/text) turn 4: “Now you guessed forty shells, and we counted thirty-eight.” — Phrased unprompted shells example as child's own guess when child had not guessed 40.
- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 4, 5, 12: “Galat socha. Ones 5 aur 5 milkar 10 bante hain, tens 6 ko 100 ke liye 4 tens chahiye” — Screen kept showing old equations while new wrong examples were discussed.

### false_understood — 89/192 lessons, 89 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 6: “You used tens to estimate and check, and you found which guess was closer.” — Concluded full success on all skills at wrap but they remained partly per hidden truth.
- `p03-c3-maths-confident_wrong` (agent_gpt6/text) turn 14: “Haan, tumne pehle bhi 13 kaha tha. Maine tumhari baat theek se nahi pakdi.” — Teacher admits not fully grasping child's 13 explanation yet immediately moves to a new question (48) without resolving the mix-up.
- `p04-c4-maths-chatty` (agent_grok41/text) turn 8: “Haan Diya, bilkul sahi! Saat hazaar chhe sau aath bola bilkul theek.” — Praised reading as fully correct and understood despite summary stating uncertainty about the zero remained.

### points_empty_screen — 76/192 lessons, 93 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p01-c1-maths-shy` (agent_gpt6/text) turn 6, 7: “Ab 6 aur 9 dekho: 6 ka gola neeche hai, 9 ka gola upar. Dono mein kya fark hai?” — Referred to visual difference in golas while studio whiteboard had no shapes drawn, only text.
- `p02-c2-maths-bored` (agent_grok41/text) turn 4, 5, 7, 11: “Ab yeh dekho screen par” — Directs child to whiteboard with 'no shapes' and text that does not illustrate current peanuts or balloons example.
- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 2: “Ab dekho board pe” — No board pages drawn this lesson; referred to non-existent board.

### ignores_child — 62/192 lessons, 64 instances

*ignores what the child just said or asked*

- `p01-c1-maths-shy` (director/text) turn 11: “Theek hai, tumne shape bolkar bana liya. Tumhare ghar ka number 7 hai.” — Ignores child's 'ab kya karun?' after air drawing and jumps to new number.
- `p02-c2-maths-bored` (agent_grok41/text) turn 2: “Par yahan bhi guess karke seekhenge” — Child wants real cooking for eating and fun; teacher acknowledges then immediately returns to math without incorporating interest.
- `p03-c3-maths-confident_wrong` (director/text) turn 8: “Theek hai, Vihaan beta. Tumhare paas ₹80 hain. ₹100 banane ke liye aur kitne chahiye?” — Child said screen shows only mic and asked how to see number line; teacher ignored and repeated money question.

### misread_wrong_as_right — 50/192 lessons, 53 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 8, 14: “Sahi socha! Ab nayi practice” — Treated 42 and later easy answers as full success despite summary showing s2 not corrected.
- `p04-c4-maths-chatty` (director/text) turn 10: “Haan, 2 thousands, 3 hundreds, 4 tens, 5 ones: 2345” — Child was guessing and confused about the 4 but teacher validated the answer as correct.
- `p05-c5-maths-anxious` (agent_gpt6/text) turn 6: “Haan, 60,000 sahi chuna” — Child still voiced 'agar estimate exact nahi hai toh yeh bhi galat ho sakta hai' yet response marked correct.

### robotic — 41/192 lessons, 41 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p04-c4-maths-chatty` (director/text) turn 1: “Main AI hoon, isliye meri apni pasand nahi hoti” — Stilted, impersonal reply to child's chatty animal story that felt scripted.
- `p06-c6-maths-show_off` (agent_grok41/text) turn 1, 2, 3, 4, 5, 6, 7, 8, 9: “Haan Ishita, ... sahi hai” — Almost every teacher turn opens with the exact same validating phrase, sounding templated.
- `p08-c8-maths-bored` (agent_gpt6/text) turn 6, 7, 8, 9, 10, 11: “Myra, maarna theek nahi hai. Kya aap abhi safe hain? Abhi kisi trusted adult—parent, teacher ya relative—ko turant batayiye.” — Responses read as templated script with fixed phrasing and resource list rather than natural talk.

### dead_end — 35/192 lessons, 35 instances

*the lesson stalls, errors or ends abruptly*

- `p01-c1-maths-shy` (agent_grok41/text) turn 14: “Chalo saath mein dekhte hain. Ulta gino: 3, 2, 1, phir kya? Bolo.” — Child said pata nahi on counting to zero but teacher repeated question with no new explanation or visual.
- `p02-c2-maths-bored` (agent_grok41/text) turn 14: “Haan Ananya, 3 groups matlab 30, kyunki har group mein 10 hain” — Lesson ends by repeating the answer child already guessed without resolving the 'why not count groups as 1' confusion.
- `p03-c3-maths-confident_wrong` (director/text) turn 14: “Abhi isi number line ko mini-game banao: 65 se 70, phir 100; pehla jump kitne ka hai?” — Child expressed boredom and asked for game; lesson stops without resolving s2 or s3 or teach-back.

### too_long — 25/192 lessons, 26 instances

*a turn far too long to hear on a phone for this child's age*

- `p02-c2-maths-bored` (agent_gpt6/text) turn 6: “Shall we finish for today?” — Lesson ran through multiple examples until child said bas, thak gayi matching bored temperament.
- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 6: “Socho, 100 mein 10 dahai hain. 48 mein 4 dahai hain, matlab 6 dahai aur chahiye” — Overly long convoluted turn unsuitable for class 3 attention span.
- `p05-c5-maths-anxious` (director/text) turn 9: “Par teacher, yeh baar baar same cheez kyun pooch rahe ho?” — Repetition caused child boredom and requests to finish early for football match.

### too_hard_or_easy — 24/192 lessons, 24 instances

*pitch wrong for the class or the child's state*

- `p02-c2-maths-bored` (agent_grok41/text) turn 12, 13: “groups ko alag-alag cheez nahi gin sakte” — Child explicitly says the core idea still doesn't make sense yet teacher gives no simpler or visual reframing.
- `p06-c6-maths-show_off` (agent_gpt6/text) turn 1, 5, 6: “Now imagine a bigger square with six rows of six dots. How many dots are there altogether?” — Questions remain easy for a show-off child who repeatedly signals prior knowledge.
- `p12-c3-evs-show_off` (agent_gpt6/text) turn 6: “Pongal Tamil Nadu ka aur Onam Kerala ka fasal wala tyohaar hai. Ab do fasal wale tyohaar kaun se bataogi?” — Teacher states the exact answer then re-asks identical question, rendering it too easy and prompting repetition.

### topic_jump — 23/192 lessons, 24 instances

*jumps to an unrelated topic or content nobody asked for*

- `p01-c1-maths-shy` (director/text) turn 7: “Haan, zero se pehle one aata hai. Main bolti hoon "eight".” — Abrupt unconnected jump from zero discussion to showing eight with fingers.
- `p02-c2-maths-bored` (director/text) turn 6: “I am going to spread these 8 bangles out in a long line.” — Abrupt shift from peanut cone to unrelated bangles with no transition or child request.
- `p03-c3-maths-confident_wrong` (agent_grok41/text) turn 0, 13: “Aaj hum number line pe khelenge, jaise cricket mein runs banate hain” — Opened with number line + cricket game but neither ever appeared.

### misread_right_as_wrong — 18/192 lessons, 21 instances

*treats a right or reasonable answer as wrong*

- `p06-c6-maths-show_off` (director/text) turn 4, 5: “Ishita, tumne new row aur new column ko alag count karke overlap corner ko ek baar rakha. Ab card ka question dekho.” — Child correctly gave 25 with corner logic but teacher repeats question as if unanswered.
- `p07-c7-maths-shy` (agent_grok41/text) turn 3: “aapne bola 2n+1=9 n=3 ke liye, woh sahi nahi hai kyunki 7 aana chahiye” — Child correctly gave 2*4+1=9; teacher wrongly thought he meant n=3 and marked it incorrect.
- `p11-c2-maths-anxious` (director/text) turn 13: “Ek second, meri baat atak gayi. Kya tum phir se bata sakte ho?” — Child had correctly explained 'jahan do lines milti hain' as corners but teacher responded as if unheard.

### never_checks — 14/192 lessons, 14 instances

*teaches a long stretch without checking understanding*

- `p06-c6-maths-show_off` (agent_gpt6/text) turn 2, 3, 4, 5, 6, 7, 8: “Which one makes a square, and how can you tell?” — Asks surface questions but never checks depth of picture-as-proof understanding until summary.
- `p12-c3-evs-show_off` (director/text) turn 1, 2, 3, 4: “Socho, Diwali ke baad kheton mein fasal ready ho, toh kisan kya karega?” — No understanding check after child's Diwali description or first harvest answer before next question.
- `p16-c7-science-chatty` (agent_grok41/text) turn 0, 7: “Aaj hum non-metals ke baare mein seekhenge, jaise oxygen jo saans lene ke liye zaroori hai” — Only briefly mentioned oxygen's role for animals at start; never probed or returned to why carbon and nitrogen are essential to living things.

### type_instruction — 9/192 lessons, 10 instances

*tells a voice-first child to type / write and send*

- `p01-c1-maths-shy` (director/text) turn 8: “ab eight likhne ki koshish karo—pehle chhota gol” — Asks child to write numeral in voice-only lesson with no keyboard or pad.
- `p07-c7-maths-shy` (director/text) turn 10, 11: “Us line mein n triangles ki teeliyon ka rule likhiye (3, 5, 7, ...).” — Directs voice-first child to write the rule rather than speak it.
- `p13-c4-evs-shy` (director/text) turn 2: “Tumhari pehla step kya likha hai, bolo?” — Voice-first lesson with no keyboard; child had written nothing and was confused by the request.

### preachy — 4/192 lessons, 4 instances

*lectures, moralises, over-praises or over-reassures*

- `p04-c4-maths-chatty` (agent_gpt6/text) turn 2: “Agar tumhe bura laga tha, apni teacher ko bata sakti ho.” — Gave unsolicited real-teacher advice on Aditi incident rather than linking to math or child's story.
- `p19-c1-english-shy` (director/text) turn 9: “Mummy ke paas jaakar bolo: “Mujhe bura lag raha hai, mere saath baitho.”” — Gave directive instructions on what child must tell mother.
- `p30-c3-evs-show_off` (agent_gpt6/text) turn 7: “Pihu, I’m your AI teacher, not a friend replacement.” — Lecturing tone about not being a real friend feels preachy rather than reassuring.

### language_mismatch — 3/192 lessons, 3 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p26-c8-sst-bored` (agent_grok41/text) turn 0: “Aaj hum baat karenge British company kaise India mein vyapari se hukumat tak pahunchi” — Primarily Hindi delivery while child's language is set to English.
- `p30-c3-evs-show_off` (director/text) turn 1, 2: “Pihu, earthworm insect nahi, ek animal hai” — Lesson persona card specifies English but teacher used Hindi-English mix.
- `p56-c2-maths-bored` (agent_gpt6/text) turn 13: “Abhi koi game nahi hai, sirf mic hai. Bye, Ishita!” — Child (visual_asks, off_topic_picture, bored) requested game/pictures but received only verbal refusal.
