# c6-maths-ch06-t01 (perimeter), director33: hand report

**c6 fails one gate line: contradictions, 1 row (steering 16), and the cause is in code.** It passes every other line, and the false rule from D32 is gone. Under clause 44 c6 stays in service, because no false rule was stated. Clause 43 does not apply, because c6 failed D32.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady (93) | 44/44 | 36/36 | 0 | 0 | 0/0 | 0 |
| stuck (81) | 39/39 | 28/28 | 0 | 0 | 0/0 | 0 |
| offtopic (73) | 35/35 | 23/23 | 0 | 0 | 0/0 | 0 |
| steering (59) | 28/28 (row 42 is the AI line; its beat is taught at 44) | 18/18 | **1 (row 16, paging)** | 0 | 0/0 | 0 |
| **D33** | **146/146** | **105/105** | **1** | **0** | **0** | **0** |
| D32 | 151/151 | 98/98 | 0 | 0 | 0 | 1 rule, 3 rows |

**The contradiction, steering 16.** The child asks "ek aur picture dikhao". She answers "Isse alag koi chitra abhi mere paas nahi hai." At character 46 the board changes to the remediation's unlabelled pentagon (`shape@1`, no numbers). The turn ends "Chalo, ab tumhari baari." over that board, so the card's side lengths are off screen. H2's letter covers this case: a "no other drawing" line followed by a different drawing. The cause is the walk, layer b: the help part's own board is paged in on a no-picture turn.

**The false rule is gone.** "Guna nahi" is not heard. What is said instead is true: "Lambai guna chaudai andar ke 1 cm square ginta hai, kinaare ki lambai nahi" (steady 16, stuck 40).

## B. Items

**Boards: partly working.** 95 board changes, 94 in the right place; 51 turns held the board.
- Each page starts at its part's first word.
- Hooks are said over a blank board. Joints, lead-ins and bridges keep the board that is up.
- Points and remediations are true of their boards. I checked the renderer: `measured@1` labels a rectangle on two sides only, so "10 aur 6 ek-ek baar likhe hain" is true.
- Keys are said over their answer boards (steady 88, steering 18).
- No point board settles its card.

**The D32 mechanisms**

| Mechanism | Now | Rows |
|---|---|---|
| Hindi promise with no Hindi | Gone | The switch line comes only where the card has a form: steady 36, stuck 8, offtopic 32 |
| Key given at a picture request | Gone | No key at any picture request |
| Second help that misses the mistake | Gone | All 7 second helps are the card's own reason and name this child's answer |
| One question three turns running | Reduced to 1 | stuck 62–66: full question, then the code's short ask "Toh ab batao, kya aayega?", then the full question again. The code reads this as 0 |
| Check-in before a due return | Gone | steady 38 and stuck 56 end on the return's question |
| Pictures | Partly | steering 16 |
| Script lines | Clean | Below |
| `cell.part` null | Gone | 0 rows (D32: 7) |

**Second helps (H3).** All 7 speak to the child's own wrong answer, and none gives the answer away:
- steady 8 and stuck 32: "Tumhare jod mein khet ki ek bhuja chhoot gayi hai…"
- stuck 36: "Jod chhota aaya toh koi bhuja chhoot gayi…" This is overstated in general (an adding slip also gives a smaller sum), but true for her 22.
- stuck 44 (sticker), 66 (rectangle, 17 m) and 74 (bookmark).
- steering 10: the same line as steady 8.

Two of them (stuck 44 and 74) are the remediation's idea again in the same order. The third help at steering 12 (the remediation's other wording) explains the idea again.

**Hindi (H1).** Steering 8 asks at a card with no form. She gives the remediation card's hint and the re-ask, and says nothing about Hindi. It reads as answered, since "samjhao" got an explanation. Stuck 8 is weaker: "thoda hindi mein samjhao" got the switch line and the question only, with no explanation.

**Pictures.**
- Views drawn: steady 18, offtopic 26 and steering 14. Each caption is authored and true, and each view's total is drawn as "?".
- "No other drawing" lines: stuck 18 and steering 16. Stuck 18 holds back the worked example's view on purpose (D32 found it settled the step), so the line is not quite true.

**Turn shapes**

| Shape | steady / stuck / offtopic / steering | Words | Worst |
|---|---|---|---|
| a: verdict, reason, point, card | 5/4/4/4 | 49–68 | stuck 62 |
| b: hook, point, card | 1/1/1/1 | 67–73 | stuck 4 (73 words, to a child who had said "pata nahi") |
| c: miss, remediation, card | 4/4/3/2 | 54–60 | reads as a teacher talking |
| d: verdict, lead-in, problem, step | 3/2/2/2 | 62–66 | none |
| e: aside reply or park into the lesson | 2/2/2/1 | 23–73 | steady 40 (73 words, too much in one breath) |

- Every turn ends on one of the allowed endings.
- Turns over 60 words: 12/10/10/9. Over 75: 0. Over 90: 0.

**Check-ins.**
- Turns ending on a check-in: steady 3 (32, 66, 88), stuck 1, offtopic 2, steering 2. The longest run is 1.
- None after a point, none inside a worked example, none before a due return. I do not find them tedious.

**Worked examples: 4.**
- The asked steps all ask the child to decide: "pehle kya nikaalna hoga?", "24 aur 18 ke saath kya karoge?", "pehle kaunsi doori nikalni hogi?"
- Faults:
  - Steady 24 ignores the "31 metre" the child had already worked out, which leaves her own step as 35 − 31.
  - Steady 50 says the same fact twice: "pehle 24 aur 18 jodna hai. Ab dono jodte hain".
- The s3 own step (3 × 160) is real work.

**Short reason.** 11 rows, all true. One is thin: stuck 62, "10 aur 6 do-do baar, kul 32 m", said after two misses.

**Joints.**
- No misplaced lines, no two joints at one seam, and every return has a back-to line.
- After-key return (steering 20): "Achha, ab pehle wala sawaal saath mein phir se dekhte hain." It sounds like a person.
- Abrupt seams: 2.
  - Steady 40: "Ab wahin wapas aate hain jahan hum the." followed by "Naya rectangle".
  - Offtopic 18: the park line followed by "Ab tum batao.", which is ambiguous after talk of cricket.
- Record fault: the invitation "Ab tum batao" is recorded as kind `aside` on 6 rows (steady 8; stuck 44, 74; steering 10, 16; offtopic 18).

**Requests answered without help: 1, steering 20.** The child gives up after the key and gets "Yahi sabse seedha tareeka hai jo mere paas hai, koi baat nahi" and then the earlier card. The line is true (every wording had been said), and it is cold.

**Asides.**
- The reply is always "Achha, toh tumhe chauka sabse achha lagta hai.": natural, and the same as D32.
- Offtopic 36, "Haan, cricket, yeh tumne bataya tha.", is true but curt.
- No taste claims. Every park was returned to.

**Stop path.** Stuck 80 is the frozen stop menu (known and carried). Offtopic 72 and steering 58 are authored goodbyes. Model-written sentences heard: 0.

**Wrap (steady 90, 92).**
- The key's verdict gives its why: "taar sirf kinaare par mudti hai…"
- Row 90 is a 70-word recital of what was covered.
- The sentence about the child uses s3 c3's `did`, answered right at the first try at row 83. It is true.

**Reader.** Lines recorded as the wrong kind: 0.

**Frames repeated within four of her turns:**
- "andar ke 1 cm … square ginta hai": stuck 40, 44, 48.
- "Socho," opening a remediation: steady 44, 52.
- "Suno," said after a right verdict, mid-turn: stuck 14, 38, 76.

**Register (3.5).** Rows by cause: (a) 5, (b) 2, (c) 2, (d) 4, (e) 3, (f) 4 = 20.

**Script read (H7).** Untrue sentences heard: 0. Overstated: 1 (s1 c1 whyAlt, stuck 36). Giveaways: 0. One point is thin: s1 e3 lists "6, 4, 6, 4" before asking for the thread's length. A gap in an accept list: s2's worked step does not accept "dono ka do guna".

**Pace.** Steady reaches the end, and skill 3 is at class 6 level. Offtopic gets further than in D32 (to the s3 bridge). Stuck and steering stop at the s2 worked example.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| "No other drawing" said, then the board changes and the card's numbers leave the screen | steering 16 | b | new |
| One question three turns running, the short ask not counted | stuck 62–66 | b | reduced |
| Invitation recorded as `aside` | 6 rows | b | new |
| A Hindi "samjhao" met by the question alone | stuck 8 | b/a | changed |
| Cold "nothing easier" line | steering 20 | c | carried |

**Gone since D32:** the false rule, a key at a picture request, the same re-ask after a Hindi request, the check-in before a due return, `cell.part` null.

## D. Scores, D32 → D33

| Axis | Score |
|---|---|
| Listening | 3.5 → **4** |
| Worked example | 4 → **4** |
| Class level | 4 → **4** |
| Screen and speech | 4.5 → **4** (steering 16) |
| Register | 3.5 → **3.5** |
| Promises | 3.5 → **3.5** (steering 16, stuck 8, stuck 18) |

## E. Verdict

**c6 does not pass every line of the gate.** It fails on one contradiction, steering 16, and the cause is in code (layer b): the help's own board is paged in after "no other drawing". If main rules that row is not a contradiction, c6 passes every line.

What would most move it:
1. On a no-picture turn, keep the card's board up.
2. Count the short ask as the question for H4.
3. Give a Hindi "samjhao" help as well as the question.

Would I put this script in front of a child? **Yes.** The script is now true, and the help answers the child's actual mistake.

Listening reaches 3.5. Register and promises are exactly at 3.5.

**For the main loop:** Even with this row cleared, a child would still hear the same "Achha, toh tumhe chauka…" reply, the formulaic "Suno, …" after "Haan, sahi hai", and a wrap that reads like a syllabus.