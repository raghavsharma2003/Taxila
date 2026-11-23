**c5-maths-ch02-t02 (director33): fails the gate on one contradiction, steering row 16, and the cause is in code.** Everything else in the gate holds: 0 unsaid boards, 0 misgrades, 0 false keys, and every axis at 3.5 or above.

## A. Hand counts

| Lesson | Rows | Beats taught | Verdicts | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|---|
| steady | 127 | 61/61 | 48/48 | 0 | 0 | 0/0 | 0 |
| stuck | 79 | 37/38 | 24/24 | 0 | 0 | 0/0 | 0 |
| offtopic | 85 | 38/41 | 25/25 | 0 | 0 | 0/0 | 0 |
| steering | 71 | 34/35 | 24/24 | **1** (row 16, paging) | 0 | 0/0 | 0 |
| **D33** | | **170/175 (97%)** | **121/121** | **1** | **0** | 0/0 | 0 |
| D32 | | 153/153 | 98/98 | 0 | 3 (ruled 0) | 0/0 | 0 |

- **Beats not taught:** the 5 missing beats are rows that carry a beat label but hold only an AI line or a park: stuck 42, offtopic 18, 20 and 38, steering 46.
- **The contradiction, steering 16:** "Is sawaal ki bas yahi tasveer hai, aur koi nahi." Then, at character 49, the board changes to the remediation's two rotis (held unit `#help`). The turn ends on "Ab tumhari baari, apna jawab bolo." with the 9-vs-11 rope card no longer on screen.
  - H2's own wording says a "no other drawing" line with something new drawn is a contradiction, so it counts.
  - Mechanism: paging. The no-picture path paged in the board of the help it chose. The cause is in code, not the script.

## B. Items

**The director32 mechanisms in this topic**

| # | Now |
|---|---|
| 1 Hindi promise with no Hindi after it | Gone |
| 2 Picture request with nothing left | Key: gone. The authored line is in, but steering 16 changes the board under it |
| 3 Help that misses the mistake | Reduced. A mix-up met again gets the card's hint every time (steady 52, 74; offtopic 8, 80; stuck 32; steering 64) |
| 4 A question three or more turns running | Reduced. 10 third turns end on the invitation. Still there: stuck 48 (44, 46, 48 all end on c2's question); stuck 8 by the letter (the Hindi form) |
| 5 Check-in before a due return | Gone (steady 42) |
| 6 Pictures | The circle views add little (stuck 18, offtopic 26, steering 14). None settles its card; none is taken down early |
| 7 Script lines | The e4 point now names its strips. The wrap recital is still there: steady 124, 66 words, the three skill `covered` lines, while the shorter `wrap.covered` goes unused |
| 8 Carried items | "Dekho"/"Suno" at most 3 a lesson; `cell.part` null on 0 rows; the start line only at the greeting |

**Boards**
- 112 page changes, every one at a part's first character. 111 turns changed the board and 66 held it.
- Hooks are said over a blank page. Joints, lead-ins, parks and bridges are said over the board already up.
- No card was said without its board, and no help was said over another part's board.
- All 3 keys were said over their answer boards (steady 122, stuck 40, steering 18).
- Every point and remediation board is true of its words.

**Help**
- Help turns that left the child nothing new: 0. Near-repeat sentence: stuck 46 repeats row 36's first sentence. New words, same idea: 7 turns.
- Keys given with an authored wording unsaid: 0. Keys where a hint would have done: 0.
- Every request got help for the right part.
- "Main ise aur aasaan nahi bol paa rahi" (steering 20): true, but cold.
- Second helps (8):
  - Speak to the mistake (5): steady 8, stuck 38, stuck 48, offtopic 66, steering 10.
  - Give a method (2): stuck 66, steering 60.
  - Explain the idea again (1): steady 120. The closing question has no named wrong answer.
  - Give the answer away: 0.

**Hindi requests (H1)**
- stuck 8: the e1 card has a form. "Theek hai, Hindi mein bolti hoon." is followed by the form, which is barely plainer than the card.
- steady 36, offtopic 32 and steering 8 are at cards with no form. Each got the card's hint and its re-ask, with no word about Hindi.
  - Offtopic 32 and steering 8 ("samjhao") read as answered.
  - Steady 36 ("Hindi mein bolo") reads as ignored.

**Turn shapes**

| Kind | n | Words |
|---|---|---|
| (a) verdict, reason, point, card | 22 | 56–66 |
| (b) hook, point, card | 4 | 68–74 |
| (c) miss, remediation, card | 4 | 59 |
| (d) verdict, lead-in, problem, step | 9 | 57–64 |
| (e) aside reply or park into the live part | 6 | 30–68 |

- No kind reads as too much in one breath. The worst is stuck 4 (74 words after two give-ups).
- Remediations said alone, each ending on a check-in: 8 (steady 46, 58, 84, 104; stuck 60; offtopic 56, 72; steering 54).
- Check-ins per lesson: steady 8, stuck 3, offtopic 5, steering 3. The longest run is 2.
- Check-in inside a worked example: **offtopic 56**.
- I find the remediation-alone check-ins tedious: 5 of the 8 drew only "haan" or "mujhe lagta hai haan".
- Turns over 60 / 75 words: 36 / 0. Turns of 66 words or more of kind (a): offtopic 46 and steering 52; neither reads as a monologue.
- Short reasons (`whyShort`): 18 rows, all true. The s1 e1 one, "doosri patti 8 hisson mein kati, pehli sirf 4 mein" (stuck 10, offtopic 10, steering 24), gives counts without the rule, so it under-explains for those three children.

**Worked examples (steady 20–26, 66–70, 96–102).** All three asked steps are decisions. Two quoted: "jiski chocolate kam hisson mein kati, ya zyada?" and "khaye hue hisson ki ginti, ya hisse ka size?". The child's own step needed thinking in s1 and s3 (both were missed and then hinted); in s2 it is trivial. They read as a teacher working with a child.

**Asides**
- Steady: park at 40 → return at 42, "Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?", which is not abrupt. Her reply at 44, "Achha, toh tumhe chauka sabse achha lagta hai.", is natural and the same as in D32.
- Offtopic: park at 18 + "Ab tum batao." reads as inviting the child to talk about cricket. That park is never returned to, and "sixer" is never acknowledged. Reply 40, "Achha, toh tumhara favourite hai Virat.", is flat.
- AI lines (stuck 42, offtopic 20 and 38, steering 46) are the authored ones. No taste claims.

**Frames.** "kyunki" verdicts run back to back within 4 turns 9 times in steady. The hint frame "Dono ne N-N …; ab socho ki …" is heard 4 times in s3 (88, 100, 112, 118).

**Pace.** Steady reaches the wrap (127 rows against 105), and s3 is taught at class level. Stuck reaches the s2 worked example (further than D32), offtopic the end of s2, steering the s2 worked example.

**Record.** The reader read 0 lines as the wrong kind. In the row's own record, the yourTurn invitation is recorded as `aside` on 10 rows, but as `yourTurn` at steady 120.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| "No other picture" then the board pages to the help's own board | steering 16 | (b) | New |
| A question three turns running, with an aside-reply turn uncounted | stuck 44–48 | (b) | Reduced |
| Invitation right after a park | offtopic 18 | (b) | New |
| Check-in inside a worked example | offtopic 56 | (b) | New |
| Remediation said alone with a check-in | 8 rows | (b) | Carried |
| Wrap recital | steady 124 | (b) | Carried |
| s1 e1 short reason states no rule | 4 rows | (a) | Carried |
| s3 hint frame used 4 times; "dor … gol ban gayi" | steady 88–118; steering 14 | (a) | New |
| yourTurn recorded as `aside` | 10 rows | (c) | New |

Gone since D32: "Dekho" eight times a lesson, the key given at a picture request, the flat "yeh tumne bataya tha" reply, the problem restated as help, and null `cell.part`.

## D. Scores, director32 → director33

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 → **3.5** | Requests all get help for the right part; offtopic 18 and stuck 48 hold it at the floor |
| Worked example | 4 → **4** | Three deciding steps |
| Class level | 4 → **4** | |
| Screen and speech | 4 → **3.5** | Steering 16 |
| Register | 3.5 → **3.5** | Rows by cause: (a) 3, (b) 3, (c) 2, (d) 6, (e) 4, (f) 2 |
| Promises | 3.5 → **3.5** | The offtopic 18 park is never returned to; steering 16's line is contradicted by the screen |

## E. Verdict

**The topic does not pass the gate.** It fails one line, contradictions (1, steering 16), and the cause is in code, so clause 43 applies.

The clauses this fires: 1, 6 (offtopic 56), 12 (the row record), 15, 17 and 21 (steady has 4 remediations said alone), plus 43.

Changes that would move it most:
1. On the no-picture path, keep the held board up, or pick help that owns no board.
2. Count an aside-reply turn as a turn at its question, and never put the invitation straight after a park.
3. Let a remediation and its follow-up card share a turn up to about 65 words, and give s1 e1 the rule as its short reason.

**Child: yes once the steering 16 path is fixed.** The script is sound.

**Listening, register and promises each reach 3.5 in this topic.**

What a parent would still notice once it passes: one card held for seven turns (steering 6–18), "Ab tak samajh aaya?" after every remediation, and a 66-word recital at goodbye.