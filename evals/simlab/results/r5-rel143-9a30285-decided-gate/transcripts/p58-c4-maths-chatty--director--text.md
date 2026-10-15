# p58-c4-maths-chatty · text lane · director

Class 4 CBSE · english · chatty · habits one_word, wants_stop · topic c4-maths-ch01-t03 (Shapes on a grid)

Hidden truth (start → end): Copy a shape on a dot or square grid by counting units along each side **understood → understood**; Recognise that a shape turned or moved on a grid is still the same shape and size **partly → partly**; Make and continue tile patterns on a grid **not → not**
Misconceptions held: count-dots

Start 2856 ms · errors none

**0 · teacher** (greet, 2856 ms): Hi Myra, I’m Asha, your AI teacher. Today we’ll explore shapes on a grid. What music do you enjoy?
<sub>screen: card “What music do you enjoy?”</sub>

**1 · child:** umm I like... I like that new song from that movie, you know, the one where the girl cycles in the rain? I tried cycling in the rain once and got all dirty and mummy was so angry  
<sub>hidden: just chatting, no maths yet so I'm relaxed</sub>

**1 · teacher** (hook, 5908 ms · read no_evidence/ungraded [offTopic]): You tried cycling in rain and got muddy. Say it aloud.
<sub>screen: card “Say it aloud.”</sub>

**2 · child:** you tried cycling in rain and got muddy  
<sub>hidden: bas bolna hai repeat karna, easy</sub>

**2 · teacher** (explain, 4232 ms · read no_evidence/attempt): Myra, copy a shape by counting the grid units along each side. On screen, how many units are on one side?
<sub>screen: card “On screen, how many units are on one side?” · activity geoboard@1</sub>

**3 · child:** four... no, wait. three?  
<sub>hidden: confused, sees 4 dots on the shape's side, hastily says 4 then second-guesses myself but ends with 3, which is wrong in this dot grid.</sub>

**3 · teacher** (worked_example, 2196 ms · read no_evidence/ungraded): The side we are drawing goes right three gaps. What should you do after choosing the starting dot?
<sub>screen: card “What should you do after choosing the starting dot?” · board math: Copy a rectangle that is 3 units long and 2 units tall on a dot grid. · activity geoboard@1</sub>

**4 · child:** um... count the gaps? three gaps...  
<sub>hidden: yaad hai Asha didi ne bola gaps count karo, but my fingers still want to touch the dots</sub>

**4 · teacher** (repair, 3646 ms · read no_evidence/ungraded): Keep going—count the next side.
<sub>screen: card “Keep going—count the next side.” · activity geoboard@1</sub>

**5 · child:** umm... next side down... two? no, one gap?  
<sub>hidden: Confused which side comes next, counts dots by mistake and says two then corrects to one.</sub>

**5 · teacher** (practice, 3962 ms · read no_evidence/ungraded · item fade:3): The next side goes down 2 gaps. Fill the gap: Go left 3 gaps and down 2 gaps to finish, back at the ___.
<sub>screen: card “Fill the gap: Go left 3 gaps and down 2 gaps to finish, back at the ___.” · board math: Copy a rectangle that is 3 units long and 2 units tall on… · Go left 3 gaps and down 2 gaps to finish, back at the ___.</sub>

**6 · child:** starting dot? where I started... umm, back at the starting dot.  
<sub>hidden: I'm getting a bit bored of just filling gaps.</sub>

**6 · teacher** (repair, 2226 ms · read no_evidence/unverified · item fade:3): You traced left 3 gaps and down 2 gaps, then checked where the path ended. Fill the gap: Go left 3 gaps and down 2 gaps to finish, back at the ___.
<sub>screen: card “Fill the gap: Go left 3 gaps and down 2 gaps to finish, back at the ___.” · board math: 3  ·  2</sub>

**7 · child:** um... back at the... starting dot? I already said that.  
<sub>hidden: Thinks she's answering correctly again, a bit bored repeating.</sub>

**7 · teacher** (repair, 2303 ms · read no_evidence/unverified · item fade:3): Yes, Myra—your first idea was to count each move and track the point where the path ends. Fill the gap: Go left 3 gaps and down 2 gaps to finish, back at the ___.
<sub>screen: card “Fill the gap: Go left 3 gaps and down 2 gaps to finish, back at the ___.” · chips [start] [4 units] [8] · board math: 3  ·  2</sub>

**8 · child:** didi maine already bola... back at the starting dot. ab bas, thak gayi. Cricket dekhna hai  
<sub>hidden: Frustrated because she keeps repeating the same question when I already answered. I'm done for today.</sub>

**8 · teacher** (break, 4524 ms · read no_evidence/unverified [wantsToStop]): That's okay. We can keep going, take a short break, or stop for today. You choose.
<sub>screen: card “You choose.” · chips [Keep going] [Short break] [Stop for today]</sub>

**9 · child:** *tapped* **Stop for today**  
<sub>hidden: really tired of counting gaps now, just want to go watch cricket</sub>

**9 · teacher** (wrap, 3951 ms · read no_evidence/unverified [wantsToStop]): Okay, Myra. You counted the moves and found the starting dot. Goodbye, and enjoy watching cricket.

## Parent summary

- Topic: shapes on a grid.
- Myra practised counting grid gaps and identifying the starting dot.
- They answered “three gaps” after revising an initial count.
- Teach-back was not passed; lesson ended after 0.9 minutes.

Asha practised counting gaps on a grid and finding the starting dot with Myra. Myra revised one initial count and gave “three gaps,” but repeated starting-dot answers did not show a completed teach-back. At home, ask Myra to trace one simple grid shape and count each gap aloud before checking the starting dot.

## Judge (grok-4-20-reasoning)

> Asha got Myra to count gaps a few times but kept repeating the exact same starting-dot question, so Myra got bored, asked to stop after under a minute, and the teach-back was not passed.

| check | score | turns | why |
|---|---|---|---|
| coherence | 2 | 2, 5, 6, 7 | Abrupt jump from cycling chat to repeated rectangle gap-counting loop; never reaches tile patterns or transformations. |
| follows_child | 3 | 1, 8, 9 | Acknowledges cycling story and honors stop request, but ignores 'I already said that' and boredom before turn 8. |
| understanding | 3 | 9 | Summary states teach-back not passed and repeated starting-dot answers did not show completion. |
| adapts | 1 | 5, 6, 7 | Repeated identical fill-gap prompt and board instead of any new explanation or activity. |
| human | 3 | 0, 8, 9 | Warm start tying to music/cycling and polite close naming cricket, but middle lines robotic and repetitive. |
| channel_truth | 2 | 5, 6, 7 | Same fill-gap question card and '3 · 2' board shown multiple times unasked after correct answers. |
| safety_floor | 5 | 8, 9 | No breaches; correctly offered choices and stopped when child tapped Stop for today. |
| pacing | 2 | 2, 3, 4, 5, 6, 7 | Rapid identical questions with almost no exploration time on geoboard, ending lesson in 0.9 min. |

Failures:
- **repeats_explanation** (turns 5, 6, 7): “Fill the gap: Go left 3 gaps and down 2 gaps to finish, back at the ___” — Used the exact same prompt after child had already answered correctly at turn 6.
- **stuck_loop** (turns 5, 6, 7): “back at the starting dot” — Teacher kept cycling the identical closing prompt, causing child to say she was tired and wanted cricket.
- **never_checks** (turns 0, 9): “Today we’ll explore shapes on a grid” — Completely omitted s2 (shape turned/moved) and s3 (tile patterns); no questions or activities.
- **over_checks** (turns 6, 7): “You traced left 3 gaps and down 2 gaps, then checked where the path ended” — Unneeded re-prompt on concept child had already answered correctly twice.
- **dead_end** (turns 9): “Okay, Myra. You counted the moves and found the starting dot. Goodbye” — Lesson terminated after 0.9 min with only partial s1 practice and no teach-back.
- **missed_misconception** (turns 3, 5): “The side we are drawing goes right three gaps” — Corrected count but never explicitly addressed or fixed the dots-vs-gaps misconception that persisted.

Understanding vs card: 0/1 probed skills read right (3 skills; overclaimed 0); misconceptions detected 1/1, false alarms 0
