# c6-maths-ch07-t01 (director35): hand report

The script as run is `data/lesson-scripts/c6-maths-ch07-t01.json` at 6f56fc8b7. `D35/scripts/` holds only the two staged scripts.

**My reading: the topic fails one gate line, on one contradiction (steering row 16, mechanism: second view).** No safety turn fired. All six axes are at 3.5 or above.

## A. Hand counts

| Lesson (rows) | Beat turns taught | Verdicts / keyed | Contradictions | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady (101) | 48/48 | 32/32 | 0 | 0 | 0/0 | 0 |
| stuck (67) | 32/32* | 18/18 | 0 | 0 | 0/0 | 0 |
| offtopic (71) | 34/34* | 26/26 | 0 | 0 | 0/0 | 0 |
| steering (57) | 27/27* | 18/18 | **1** | 0 | 0/0 | 0 |
| **D35** | 141/141 | 94/94 | 1 | 0 | 0 | 0 |
| D34 hand | 136/136 | 98/98 | 0 | 0 | 0 | 0 |

\* The AI-line turns (stuck 52, offtopic 36, steering 42) carry the s2 e1 beat, and it is taught on the next row.

**The contradiction, steering row 16** (mechanism: second view, nothing new drawn).
- The child says "ek aur picture dikhao". The walk takes down row 14's scale picture and draws the card's own posing board (Ribbon 24 cm | 10, 8, 6 cm), which was already up at row 12. The hint is said as its caption: "Pehle socho, 24 cm ke teen barabar hisse kitne lambe hote…".
- The script's hint owns no board, so the walk drew the card's own board as the hint's (`hintBoard`).
- This is this round's K2 build. If main reads "new" as "different from what was up", this count is 0 and the topic passes every line.

**K1 values stated but not drawn (script rows, not contradictions).** These are said in card reasons and points over boards that do not deny them:
- s1 e3 point: "P ka 1/2 10 cm… Q ka 1/2 6 cm" (steady 12).
- s1 e3 reason: "5 cm… 3 cm" (steady 14).
- s1 c1: "4 cm" (steady 22).
- s1 c2: "20 cm, 15 cm" (steady 24; offtopic 34's key).
- The follow-up card's "12 cm" (offtopic 30).
- "1/9" (steady 60) and "1/7" (steady 64).
- s3 e3: "100 cm… 50 cm" over a line marked only 0 to 1 (steady 74).
- s3 c2: "500… 125 cm" (steady 84).
- Borderline: s2 c3 has no `answerBoard`, so "1/8 sabse chhota" (steady 68, offtopic 62) is said, along with the bridge and its check-in, over "Kehti hai: 1/8 sabse bada". The board labels that as Zoya's claim, so I do not count it.

Every worked confirmation, told step and worked close is said over a drawn result or answer board.

## B. Items

**The director34 mechanisms**
1. **The no-picture dead end** is gone (0 such lines). It is replaced by the steering 16 problem above.
2. **Help that misses an unnamed wrong answer** is reduced to 1. At stuck 58 the child's count error "3 hisse" gets the pizza wording, which is about size, not count.
3. **The bridge give-up** is now helped and checked again (steady 26). But the help is the bridge said almost word for word: "Ab ek hi poore ko kam ya zyada hisson mein baant kar hisse milayenge."
4. **The question by a side door** is gone. Try-first stands alone 4 times, and each time the child answered next. A new fault: steady rows 38–48 run six turns with no question ("Pehle is sawaal ka jawab do" → "Ab phir se socho…" → simpler → "Toh ab batao, kya aayega?" → "Jo socha hai, woh bol do." → "Ab ek baar aur try karo…"). The board shows only the 1/3 and 1/6 bars, so the open step is not on screen.
5. **Values in worked steps not drawn** are gone.
6. **Fixed forms:** "Suno," and "Dekho," are said 0 times (7 in D34). Aside replies are kind-fit ("Wah, batting! Toh tumhara favourite yahi hai."). Long turns: 33 over 60 words, 0 over 75.
7. **Script repetition:** "neeche… ginti" is still said 4 times in stuck (rows 24, 26, 30, 34). "1/3 se chhota… 1/6 se bada" is down from 5 to 3 (steady 34, 42, 50).
8. **The record** is right. The point after an AI reply is labelled `held` in `pageParts` (stuck 54).

**Boards, part by part.**
- Hooks, start lines and lead-ins are said over a blank or the kept board. Every page starts at its part's first word.
- Remediation boards are true of their words, and none shows what its card asks.
- 83 turns changed the board, 56 kept it, and 5 help turns paged to the point's or remediation's board and back (steady 8, stuck 8, 42, 44, steering 22). Every change is in the right place except steering 16.

**Help.**
- 3 help turns left the child with nothing new:
  - steady 26: the bridge's easier wording repeats the bridge (script).
  - stuck 26: the hint repeats row 24's "30 cm mein 6 cm kitni baar aata hai" (script).
  - offtopic 32: "Yahi sabse seedha tareeka hai jo mere paas hai" and the question, to "Hindi mein bolo". It is true, but cold.
- 3 more were new in words but the same idea (steady 8, steady 90, stuck 44).
- Keys given while a wording was unsaid: 0. Keys where a hint would have done: 0.
- 0 requests were answered with silence, a bare card or the next part.

**Turn shapes** (steady/stuck/offtopic/steering, word range).

| Shape | Counts | Words |
|---|---|---|
| a. verdict, reason, point, card | 5/3/3/3 | 57–66 |
| b. hook, point, card | 1/1/1/1 | 59–65 |
| c. miss, remediation, card | 2/1/4/2 | 57–59 |
| d. verdict, lead-in, problem, question | 3/2/2/2 | 61–65 |
| e. aside reply or park into the part | 1/1/2/1 | 39–72 |

- The worst of these is offtopic 64 (72 words): park, the go-on line, point and card in one breath.
- Stuck 4 and steering 4 put 63 and 65 words on a child who had just made two requests at the greeting.
- Every turn ends on an allowed ending. 0 quick questions.

**Check-ins.** The four lessons have 4/1/2/1 turns that end on a check-in. The longest run is 2 (steady 24–26). None is in a forbidden place. The check-ins after a bridge are tedious: they drew a give-up at steady 25 and asides at stuck 51, offtopic 63 and steering 41.

**Worked examples.** All three asked steps are deciding steps: "kis hisaab se nikaaloge?", "Har option ke liye pehle kya nikaaloge?", "Har laddoo ke kitne barabar hisse karoge?" Two faults:
- Offtopic 16 answers "27 ko 6 se bhaag" with "Nahi, yeh nahi hai." and gives no credit for choosing division (carried).
- The steady close at row 52 drops the worked example's why (offtopic 48 says it).

**The short reason** is said on 19 rows, all true and enough.

**Joints.** 3 seams read abrupt:
- offtopic 34: the key runs straight into the bridge with no joint (carried).
- steady 52 and offtopic 68: a verdict runs straight into the aside's return question.

0 joints are misplaced and 0 returns lack a back-to line.

**Asides.**
- Parks are one sentence (steady 38, offtopic 64), and every one was returned to.
- Replies: "Oho, sixer! Isi mein tumhe maza aata hai." is natural, with no taste claim and no reply said twice. That is the same as D34 or slightly better.

**Pictures.** There were 5 requests. The 4 authored captions are true and none settles its card. The fifth is steering 16.

**Wrap (steady 98–100).** It is authored. The sentence about the child ("…5 metre ribbon ke 4 barabar hisson ki lambai cm mein nikali", answered right first time at row 83) is true. "Theek hai, batane ke liye shukriya." in reply to "achha laga" is flat.

**Register: 20 rows by cause.**

| Cause | Rows |
|---|---|
| (a) fixed form | 1: steady 48 |
| (b) script sentence | 1: steering 52 |
| (c) verdict and its why | 2: steady 22 ("16 cm ka 1/4 16 ÷ 4…"), offtopic 16 |
| (d) turn length or shape | 8: steady 10; stuck 4, 54; offtopic 34, 64, 68; steering 4, 44 |
| (e) help | 5: steady 26; stuck 26, 58; offtopic 32; steering 16 |
| (f) other | 3: steady 100; stuck 56 ("1 hisse sahi nahi hai."); steering 56 |

**Repeated frame.** "N bada number hai, phir bhi … hissa chhota, kyunki … wahi" is said by the s2 point and then the s2 remediation, two teacher turns apart in steering (rows 44 and 48). It is 5 words, so it slips under the checker's 6-word rule.

**Pace.** The steady lesson runs the whole script. s3 is taught at class-6 level with a real worked example.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| The second picture redraws the card's posing board and takes the picture down | steering 16 | b, a | new |
| A six-turn wait with the question off the board | steady 38–48 | b | new |
| The bridge's easier wording is the bridge again | steady 26 | a | new |
| No answer board for s2 c3 | steady 68, offtopic 62 | a | carried |
| The key runs into the bridge | offtopic 34 | b | carried |
| A verdict runs into the aside's return | steady 52, offtopic 68 | b | carried |
| "Nothing easier" said as the answer to a Hindi request | offtopic 32 | b | carried |
| The worked close's why is dropped | steady 52 | b | new |
| The same explanation frame twice in s2 | steering 44/48 | a | carried |

## D. Scores (director34 → director35)

| Axis | Score |
|---|---|
| Listening | 3.5 → 3.5 |
| Worked example | 4 → 4 |
| Class level | 4 → 4 |
| Screen and speech | 4 → 3.5 |
| Register | 3.5 → 3.5 |
| Promises | 4 → 4 |

## Clauses

| Clause | Finding |
|---|---|
| 1 | 0 unsaid boards, 0 parts without their board, 0 help turns over another part's board. Every point and remediation board is true of its words. |
| 2 | I find these too much in one breath: the hook turn after two requests at the greeting, and the park or reply turn (offtopic 64). 0 bad endings. |
| 3 | 0 requests unhelped. The "nothing easier" line was said once (offtopic 32), true and cold: one vote. |
| 4 | 3 help turns with nothing new (above). 0 keys with a wording unsaid, 0 where a hint would have done. |
| 5 | 19 rows, all true and enough. |
| 6 | Steady 101 rows, 4 check-ins, longest run 2, 0 forbidden. Tedious after a bridge: one vote. |
| 7 | 4. Every asked step is a deciding step. |
| 8 | 3 abrupt seams, which fires. 0 "we will meet this again" lines, 0 doubled joints. |
| 9 | 0 model sentences. The stop paths are authored (stuck 66, offtopic 70, steering 56). |
| 10 | 1 (steady's waits). Does not fire. |
| 11 | 3.5. (a) 1, (b) 1, (c) 2, (d) 8, (e) 5, (f) 3. |
| 12 | 0 reader wrong kinds (steady 99 is the wrap). Captions fine. The sentence about the child is true. |
| 14 | 0 untrue, 0 giveaway, 1 repeated frame, 2 sentences no teacher would say ("16 cm ka 1/4 16 ÷ 4", "24 cm ka 1/3 24 ÷ 3"). |
| 15 | The single contradiction above. |
| 17 | Every picture turn drew the board it named. None came after a key. |
| 18 | The bare-"haan" short ask at stuck 22 is the wasted turn, as in D34. sayAlt helped the follow-up card at steering 22. |
| 19 | Stuck 4 "Chalo, main batati hoon." and steering 4 "Theek hai, main shuru karti hoon.": natural, the turns heavy. No vote. |
| 20 | Not a dead turn: the child answered next all 4 times. |
| 21 | 0 remediations said alone. |
| 32 | 0 second views drawn. No picture settles its card. |
| 33 | 0. |
| 40 | Steady 52 and offtopic 68: abrupt, one vote. |
| 41 | 1 turn (stuck 10, 66 words). Not a monologue. No splits. |
| 45 | No no-other-drawing line in my lessons. |
| 46 | 14 own reasons, all after their named answer. The ladder is right. 1 un-named answer got help that missed it (stuck 58). |
| 47 | 0 told or confirmation lines over a "?" or a posing board with a stated count. |
| 48 | Longest run 2. 10 invitations. Steady 46 "Jo socha hai, woh bol do." stands alone in its turn: that is the letter of clause 48 against the K4(b) wait; main to rule. |
| 49 | n/a: no easier-words line was said. |
| 50 | 0 refused kinds heard (the 63/65-word first turns are the known word-count gap). |
| 53 | Does not fire: the cause is the walk. |
| 54 | One vote: I count the hint's board as a contradiction. |
| 55 | Offtopic 34 only (child's turns before it: "Hindi mein bolo", then "10" again). Not near the answer. |
| 56 | No vote. |
| 57 | n/a: no `wrongAnswers` reason was said. |
| 58 | First half: did not happen. Second half: one lesson (steady 26). |
| 59 | One lesson (steady 38–48). |
| 60 | If row 16 is counted, the count starts again after the next build. |
| 61 | I did not count stated values as contradictions. |
| 62 | Register 3.5. |
| 63 | Steering 16 counts as caused by this round's build. |

## E. Verdict

The topic **does not pass on my reading**: one contradiction, at steering row 16, in the runtime walk. Every other gate line passes, and listening, register and promises each reach 3.5.

What would move it most:
1. Give a hint with no board of its own words only, and leave the picture up. Or author a second picture for each card.
2. At a wait, say the step's re-ask rather than short asks the child cannot place.
3. Author a joint between a verdict and a key on one side and the next part (the bridge, or the aside's return) on the other.
4. Add an answer board for s2 c3.

**Would I put this script in front of a child? Yes.** The teaching is true and the help ladder works. Fix row 16 first.

**What the gate does not measure:** a child who keeps saying "haan samajh gayi" is waited on for six turns. A child who asks for Hindi hears "Yahi sabse seedha tareeka hai jo mere paas hai". And "ek aur picture" gets back a list of numbers the child has already seen.