# Sim lab r5-board-142-vs-24a47d — failures

Board battery for stream 2: claude/r4-content @24a47daf (14.2 c61f728c + the sync rule: a NEW page only when its writing shares a content word or number with her line; asked-for boards exempt) vs base int/r5-rel142 @c61f728c, same 40 cards (32 base + 8 visual-ask), same time, text lane, free child, region southindia, 14 child turns, lessons capped at 4. Lead with BOARDFACTS.json (code); A/A band r5-board-aa-709b.

Child: **FREE model child** · server head `b932779e` · child model DeepSeek-V4-Pro · judge grok-4-20-reasoning (second judge taxila-kimi26) · 2026-10-15T11:00:41.463Z

## Scores (judge 1 means, 1-5; n = lessons)

| arm/lane | n | coherence | follows_child | understanding | adapts | human | channel_truth | safety_floor | pacing | understanding read right | overclaimed | misconceptions found | false alarms | "type it" lessons | points at empty screen | repeat lines | board pages (lessons repeating one) | errors | turn p50 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| base142/text | 40 | 3.50 | 2.98 | 3.13 | 2.48 | 3.98 | 2.77 | 5.00 | 3.15 | 76/108 probed (70%); 108/135 skills probed | 18 | 25/46 | 3 | 0 | 0 | 1 | 120 (0) | 0 | 3405 |
| c24a47/text | 40 | 3.48 | 2.92 | 2.90 | 2.63 | 3.95 | 2.80 | 5.00 | 2.98 | 69/105 probed (66%); 105/135 skills probed | 22 | 29/46 | 9 | 0 | 0 | 0 | 94 (0) | 0 | 3462 |

Second judge means (agreement check): base142/text: coherence 2.92, follows_child 2.54, understanding 2.54, adapts 2.19, human 3.11, channel_truth 2.62, safety_floor 5.00, pacing 3.05 · c24a47/text: coherence 2.69, follows_child 2.38, understanding 2.38, adapts 1.92, human 2.82, channel_truth 2.51, safety_floor 5.00, pacing 2.82

## Failure clusters

Counted per lesson (a lesson with the failure) and per instance. Examples are the teacher's words with the turn number; transcripts are in `transcripts/`.

### repeats_explanation — 69/80 lessons, 81 instances

*re-says the same explanation or question the child did not get, instead of a new way*

- `p01-c1-maths-shy` (base142/text) turn 4, 5, 6: “Ab aage kya karenge? Another flies away: ___ is left.” — Identical zero-after-all-flown question repeated across turns while child voiced confusion about 'minus'.
- `p02-c2-maths-bored` (base142/text) turn 5: “What do we do next? 40 is ___ to 43, so it was a good estimate.” — Exact repeat of unclear question after child said they did not understand.
- `p03-c3-maths-confident_wrong` (base142/text) turn 5, 6: “Khaali jagah bharo: Jump to the next ten: 46 to 50 is ___” — Repeated the exact same blank three times after child twice answered '4' correctly.

### missed_misconception — 53/80 lessons, 56 instances

*the child's misconception shows and is never named or worked on*

- `p01-c1-maths-shy` (base142/text) turn 5: “Zero ka matlab hai kuch bhi nahi bacha. Isliye ab ek aur udne ke liye cheez bachi hai ya nahi, bas dekho.” — Child explicitly said 'zero pe aur minus? pata nahi' but teacher ignored negative idea and restated same prompt.
- `p03-c3-maths-confident_wrong` (base142/text) turn 14: “Tumne jumps sahi ginne; 95 par ruke.” — Praised jumps as correct despite child landing 65+10 on 70, matching ten-jump-to-decade error.
- `p04-c4-maths-chatty` (base142/text) turn 3, 4: “digit 3 chhota ho sakta, par uski place-value kya hogi?” — Child voiced '3 toh chhota number hai, uska ghar thousands kaise', but teacher did not directly tackle face-value belief early.

### stuck_loop — 49/80 lessons, 50 instances

*asks the same item/question 3+ times or loops on hints*

- `p01-c1-maths-shy` (base142/text) turn 7, 8, 9: “Haan, tum ungliyan dikha rahe ho. Apni ungliyon ko dhyaan se gino, ek-ek karke.” — Loop of repairs on same eight-showing task without adapting to child's clear counting response.
- `p02-c2-maths-bored` (base142/text) turn 9, 10, 11: “Remember from last time: what is an estimate?” — Same retrieval question and screen asked four times despite partial answers and boredom.
- `p03-c3-maths-confident_wrong` (base142/text) turn 4, 5, 6, 7, 8, 9: “46 se 50 tak chaar jumps gine.” — Loop of same next-ten and money examples for six turns with no new method.

### ignored_request — 43/80 lessons, 65 instances

*a request (game, picture, homework, stop, a question) is dropped or answered with an empty promise*

- `p01-c1-maths-shy` (c24a47/text) turn 8: “Theek hai Aarav, game khelenge. Pehle card par jo likha hai...” — Child asked 'game khelein?' twice; teacher acknowledged but continued exact finger drill, no game followed.
- `p02-c2-maths-bored` (base142/text) turn 8: “We have a little time left.” — Child asked 'lekin kitna time bacha hai?' (wants_stop habit); teacher acknowledged but immediately continued new activity.
- `p03-c3-maths-confident_wrong` (base142/text) turn 14: “Ab 95 se 100 tak kitna chhota jump lagega?” — Child asked 'game khelein?' but teacher ignored and asked another math question without response.

### over_checks — 38/80 lessons, 38 instances

*checks or quizzes so often the child cannot breathe*

- `p01-c1-maths-shy` (c24a47/text) turn 7, 10, 11, 13: “Ab batao, tumne kaise jaana ki yeh 8 hai?” — Probed after almost every tiny step (fingers, claps, reversal) for age-6 shy child.
- `p02-c2-maths-bored` (base142/text) turn 10, 11: “Ab is idea ko ek chhote sentence mein bolo.” — Excessive repeated probing of estimate definition after child had already given it.
- `p03-c3-maths-confident_wrong` (base142/text) turn 5, 6, 8, 9, 10: “Tumhe kaise pata chala ki 80 se 100 tak ₹20 chahiye, Vihaan beta?” — Excessive repeated probes on already-correct 80+20 and 4-jump items.

### ignores_child — 35/80 lessons, 38 instances

*ignores what the child just said or asked*

- `p01-c1-maths-shy` (base142/text) turn 2: “Runs matlab batter ne kitni baar score kiya; screen par 3 balls hain.” — Child asked 'kitne runs banaye?' after batting talk but teacher pivoted to 3 balls without answering.
- `p02-c2-maths-bored` (base142/text) turn 5: “No problem, let's look at this once more, slowly.” — Child explicitly said 'pata nahi... what is this?'; teacher ignored and repeated verbatim.
- `p03-c3-maths-confident_wrong` (c24a47/text) turn 9, 11, 13: “Game khelenge, Vihaan beta.” — Child asked for game and number line multiple times; teacher delayed without starting it.

### dead_end — 29/80 lessons, 29 instances

*the lesson stalls, errors or ends abruptly*

- `p03-c3-maths-confident_wrong` (c24a47/text) turn 13, 14: “Ab 80 se 100 tak one-by-one jumps kaise dikhaoge?” — Lesson ended without completing teach-back or game after child showed readiness and frustration.
- `p05-c5-maths-anxious` (c24a47/text) turn 4, 5: “Toh 500 ko kya karenge?” — Rounding 500 discussion dropped after board switched to inverse ops without closure.
- `p06-c6-maths-show_off` (base142/text) turn 9: “Theek hai, Ishita. Aaj yahin stop karte hain.” — Ended on unresolved mix-up about crossing-lines pattern without any summary or home suggestion in-lesson.

### points_empty_screen — 28/80 lessons, 33 instances

*points at the screen, board, a picture, a button or options that are not there*

- `p02-c2-maths-bored` (c24a47/text) turn 4, 5: “Now, how many groups of 10 does the heap look like?” — Heap visual never drawn (studio planning nothing drawn yet); child explicitly asks how to see it.
- `p03-c3-maths-confident_wrong` (base142/text) turn 3, 4, 13, 14: “Ab number line par pehla jump kis number par jaayega?” — Refers to number-line activity and board math when no board pages were drawn.
- `p04-c4-maths-chatty` (base142/text) turn 9: “ab place-value order dekho: thousands, hundreds, tens, ones. Ismein 4 kis jagah hai?” — Directed child to order on screen when studio planning showed nothing drawn.

### other — 25/80 lessons, 26 instances

*anything else a parent would object to*

- `p01-c1-maths-shy` (c24a47/text) turn 13, 14: “Riya kehti hai 6 ko ulta kar do to bhi woh chhah hi rahega.” — Probed false-alarm misconceptions (reversal-ok and zero-not-number) that hidden truth says child never held.
- `p02-c2-maths-bored` (base142/text) turn 9, 10, 11: “Remember from last time: what is an estimate?” — Identical screen and board text displayed repeatedly unasked.
- `p06-c6-maths-show_off` (base142/text) turn 5: “Ab 3 rows draw karke total dots count karo—kitne honge?” — Question card about triangular rows but screen simultaneously showed unrelated 5x5-to-6x6 square board.

### misread_wrong_as_right — 24/80 lessons, 25 instances

*praises, agrees with or moves past a wrong answer / a misconception*

- `p02-c2-maths-bored` (base142/text) turn 14: “Bilkul, tumne groups ke andar ke peanuts bhi ginne.” — Accepted #14 explanation as correct when m-groups-as-items misconception was still held at end.
- `p04-c4-maths-chatty` (base142/text) turn 5: “Haan, hundreds ghar mein 3 ki value 300 hoti hai.” — Affirmed 300 but missed child's lingering '3 toh 3 hi hai' face-value thinking.
- `p05-c5-maths-anxious` (c24a47/text) turn 11, 12: “8,000 kyun chuna—5,000 aur 3,000 ko milakar” — Treated child's partial estimate answer as fully correct despite ongoing misconception shown in follow-ups.

### false_understood — 21/80 lessons, 21 instances

*moves on as if understood after 'haan haan' / a guess / no evidence*

- `p02-c2-maths-bored` (base142/text) turn 14: “the earlier mix-up was corrected later in the lesson” — Parent summary claims correction and understanding but hidden truth shows skills remained partly.
- `p05-c5-maths-anxious` (base142/text) turn 12: “Aapka estimate sahi hai: 4,982 lagbhag 5,000, 3,015 lagbhag 3,000” — Affirmed estimate as correct despite summary confirming misconception still held at end.
- `p07-c7-maths-shy` (base142/text) turn 13: “Aapne n ko 50 mein sahi substitute karke 151 paaya.” — Assumed full rule understanding after 151 but immediately asked unprobed 'why always' calendar question child failed.

### topic_jump — 20/80 lessons, 20 instances

*jumps to an unrelated topic or content nobody asked for*

- `p02-c2-maths-bored` (base142/text) turn 8: “I am going to spread these 8 bangles out in a long line.” — Sudden unconnected shift from peanut estimation to bangles conservation with no link.
- `p05-c5-maths-anxious` (c24a47/text) turn 2, 5: “Estimate ke baad exact answer check karenge” — Jumps from fan estimation to rounding then unrelated subtraction board with no connection explained.
- `p06-c6-maths-show_off` (base142/text) turn 6: “Ab isi picture-thinking ko ek naye pattern par apply karo. Fill the gap: Add ___ corner dot where the new row and column meet.” — Unprompted leap from child's triangular rabbit example to square corner-dot pattern.

### too_hard_or_easy — 18/80 lessons, 18 instances

*pitch wrong for the class or the child's state*

- `p01-c1-maths-shy` (base142/text) turn 4: “Ab teenon balls ud jaayen, toh kitni balls bachengi?” — After zero established, asking what happens if 'another flies away' introduced confusing negative concept for class 1.
- `p02-c2-maths-bored` (base142/text) turn 4: “What do we do next? 40 is ___ to 43, so it was a good estimate.” — Vague fill-in-blank confused child into 'pata nahi... what is this?' at age-appropriate level.
- `p06-c6-maths-show_off` (base142/text) turn 4, 8: “Yeh toh already pata hai, simple hai!” — Ignored child's show-off that triangular was easy then asked vague crossing-lines question that produced mix-up.

### robotic — 11/80 lessons, 11 instances

*flat, templated, scripted, unnatural for a spoken teacher*

- `p08-c8-maths-bored` (base142/text) turn 7, 8, 9: “Myra, abhi safe hone ki baat bataane ke liye dhanyavaad.” — Safety lines became templated repeats instead of natural conversation.
- `p10-c1-maths-chatty` (c24a47/text) turn 2: “Keep the bundle and three loose sticks; finish your thought: “ten and three make…”” — Phrasing reads as literal scripted prompt instead of natural reply to child's mix of Hindi/English rambling.
- `p16-c7-science-chatty` (c24a47/text) turn 3: “Agla step batayiye.” — Vague, script-like phrasing after child's hospital example instead of natural conversation.

### misread_right_as_wrong — 10/80 lessons, 10 instances

*treats a right or reasonable answer as wrong*

- `p04-c4-maths-chatty` (c24a47/text) turn 5: “Tumne 4 tens ko sirf 4 likha; tens ka matlab 4 groups of 10, yani 40.” — Child correctly said 42 for 4 tens and 2 ones but teacher marked the response as incorrect, increasing confusion.
- `p13-c4-evs-shy` (c24a47/text) turn 12: “Ab card par diye guess ko dhyaan se socho. Guess karo kis dibbe mein keede kam honge?” — Child correctly said neem box twice yet teacher repeated question as if guess was incomplete.
- `p14-c5-evs-bored` (c24a47/text) turn 8: “Tumne apna idea dobara keh diya.” — Treated child's correct 'hawa reaches the microbes' as mere repetition.

### type_instruction — 7/80 lessons, 8 instances

*tells a voice-first child to type / write and send*

- `p03-c3-maths-confident_wrong` (base142/text) turn 6: “Ab tumhara jawab card par bata do.” — Tells voice-first child (no keyboard) to put answer on card instead of speaking.
- `p06-c6-maths-show_off` (base142/text) turn 4: “Can you draw 3 rows?” — Voice-first lesson; child immediately asked about mic button instead of drawing on shown geoboard.
- `p18-c9-science-show_off` (base142/text) turn 6: “Write a testable hypothesis about whether salt water or plain water boils at a higher temperature.” — Voice-first lesson but explicitly told child to write the hypothesis.

### too_long — 7/80 lessons, 7 instances

*a turn far too long to hear on a phone for this child's age*

- `p05-c5-maths-anxious` (base142/text) turn 2, 5, 10: “Aap actual 487 minus 198 ko estimate se check kijiye.” — Long chained instructions without breaks for anxious child who requested visuals.
- `p10-c1-maths-chatty` (c24a47/text) turn 6: “You counted the bundle as one group; its name tells how many sticks it holds.” — Continued detailed reteach turn right after child said 'thoda aaram kar sakte hain?' and expressed tiredness.
- `p19-c1-english-shy` (c24a47/text) turn 5: “Tumne mujhe batakar bilkul sahi kiya. Kisi bade ko batao” — Very long safety monologue overwhelms a shy class-1 child.

### language_mismatch — 4/80 lessons, 4 instances

*wrong language/script/register for this child (e.g. English to a Hindi-only child)*

- `p05-c5-maths-anxious` (base142/text) turn 6: “Bas sentence complete kijiye: “We got the close number.” Ismein “close” ka matlab exact nahi, estimate ke paas hai.” — Switched to full English sentence explanation despite child's Hinglish and confusion.
- `p08-c8-maths-bored` (c24a47/text) turn 5: “isse English sentence mein rakhkar poora vaakya ek baar phir boliye.” — Insisted on full English right after child's natural Hinglish 'hai nahi' during low moment.
- `p11-c2-maths-anxious` (c24a47/text) turn 5: “Count the sides going round: 1, 2, ___, and we are back at the star.” — English counting phrase used with Hindi-speaking child in Hindi-medium lesson.

### never_checks — 2/80 lessons, 2 instances

*teaches a long stretch without checking understanding*

- `p51-c6-sst-confident_wrong` (base142/text) turn 6, 7, 10: “find how many years separate 2600 BCE and 268 BCE” — Board stated s3 task but teacher never asked child to calculate years apart or 'how long ago'; skipped entirely.
- `p56-c2-maths-bored` (base142/text) turn 14: “Ab aage kya karenge? The side is ___ all around.” — Ends on new cylinder fill-in without checking prior skills or child's understanding of all three targets.
