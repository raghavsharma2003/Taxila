# c4-maths-ch01-t02 (live), director35: judge's report

**Verdict: this topic fails the gate.** I count 6 contradictions. All six are one script sentence said over a board that does not show what it points at, and it happens in all four lessons. Clause 53 fires, so the topic returns to staged.

I could not find `scripts/c4-maths-ch01-t02.json` in D35. I read `taxila-int/data/lesson-scripts/c4-maths-ch01-t02.json` at 6f56fc8b7, which is the tree that was run.

## A. Hand counts

| Lesson | Rows | Beats | Verdicts / keyed | Unsaid boards | Contradictions | Misgrades | False keys |
|---|---|---|---|---|---|---|---|
| steady | 115 | 31/31 | 33/33 | 0 | 1 (row 46) | 0 | 0 |
| stuck | 79 | 18/18 | 22/22 | 0 | 2 (24, 34) | 0 | 0 |
| offtopic | 67 | 11/11 | 10/10 | 0 | 2 (34, 42) | 0 | 0 |
| steering | 59 | 15/15 | 18/18 | 0 | 1 (24) | 0 | 0 |
| **D35 total** | | 75/75 | 83/83 | 0 | **6** | 0 | 0 |
| D34 | 117/79/67/59 | 33/18/15/15 | 42/23/14/18 | 0 | 0 | 0 | 0 |

**The contradiction (mechanism: data; new this round).**
- The sentence is s1's own step: "Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?"
- It is posed on the worked example's board, `tile`/`tirchi lagi`, which has no tester.
- Step 2's result board does show the turned tester, but it comes down at the card's first word (char 183, or 120 in steering). The child is told to look at a tester that is not drawn.
- Rows: steady 46; stuck 24 and 34 (stuck 34 is the back-to return, with no tester anywhere in the turn); offtopic 34 and 42; steering 24.
- Cause: commit c14d6d3f6 (Learning 023 item 6) removed D34's giveaway "bilkul fit hua" and pointed the child at the board instead. The own step has no posing board of its own.
- What it does next:
  - The hint "Yaad karo, ghuma kar rakhne par tester kaise baitha" (stuck 26, offtopic 38) asks the child to remember a fit she never stated, which was on screen for about 50 characters.
  - Stuck 38 ends in a key after two "Yes" answers.

**K1 layer (a): values stated but not drawn.** None of these is denied by the board, so none is counted:
- steady 94: "sirf 1 nishaan" (no marks are drawn);
- steady 76: "30 cm lambai";
- steady 110: "30 cm lambi bhuja".

## B. Items

**Boards: working, apart from the six rows above.**
- Every board change lands on its part's first word.
- Joints, lead-ins and bridges are said over the board already up; hooks over a blank page.
- Keys are said over their answer boards (stuck 38 and 48, offtopic 54, steady 110).
- A picture shown the turn before now stays up (steering 16 keeps the split view). D34 mechanism 1 is gone.
- Point and remediation boards are true of her words. Weakest: steady 12, where the point about the tester is said over a board labelled "kitaab ka kona".

**Pictures: working.** There were 5 picture turns:
- steady 18: the tester view;
- stuck 18: the card's authored picture;
- steering 14: the second view;
- steering 16: the no-other-drawing line, then the hint in words;
- offtopic 26: the line, then the problem's other wording.

Every caption is authored and true. None gives an answer away.

**Named wrong answers (K3): working, with one gap.**
- Steady 6 ("5") and steady 10 ("2") each got their own reason.
- Every own reason I heard came after its named answer: steady 58; stuck 32, 36, 54, 60, 70; steering 48, 54.
- The gap: steering 10. "6" is not a named answer, so she gives the right-angle wording again, which misses the miscount.

**Paths in the walk (K4): partly working.**
- **The cap:** stuck 38 is correct. The question was heard at 24, 26, 34 and 36, and the child answered "Yes" twice before the key.
- **Offtopic step 1 is still over-asked:** the child heard it six times by ear (10, 12, 16, 20, 26, and 32 at their own Hindi request). D34 had seven. Row 26 is the fifth and the cap did not fire: it came after a picture request.
- **The same line word for word:** "Tirchi tile par tester seedha rakhoge, ya ghuma kar?" is said at rows 12, 16 and 20. At 16 and 20 the child's "hmm, achha" was read as `other`, not `yes`.
- **Waiting with no end:** steady rows 28 to 44 spend nine turns on one step, five of them bare waits (30, 38, 40, 42, 44).
  - Steady 38 is "Ab tum batao." on its own.
  - Steady 44, "Toh ab batao, kya aayega?", comes four turns after the question was last said. "Kya aayega" is how you ask for a sum, and this is a choice.
- **Help at a check-in between skills:** steady 82 and offtopic 64 got help; the second give-up at steady 84 went on.

**Help: partly working.**
- **Nothing new:** steady 82 (the bridge again, shorter) and steering 50 (repeats row 48's "dono ka khulna right angle se milao").
- **New words, same idea:** steady 36 and offtopic 26.
- **The "nothing easier" line is untrue at offtopic 58:** "Koi baat nahi, isse aasaan shabd abhi mere paas nahi hain." The card's Hindi form and its picture were both still unsaid, so the picker is wrong on that row. The line is followed by a second joint before the next card.

**Turn shapes**

| Kind | n | Words | Worst |
|---|---|---|---|
| (a) verdict, reason, point, card | 16 | 60–65 | steady 68: a thin reason, then a new point |
| (b) hook, first point, card | 4 | 52–58 | fine |
| (c) miss, remediation, follow-up card | 6 | 57–58 | fine |
| (d) verdict, lead-in, problem, first question | 8 | 63–73 | steady 94 (73 words): one breath |
| (e) aside reply going into the lesson | 4 | 34–65 | steering 38 |

- Turns over 60 words: 11, 6, 3 and 8 by lesson; over 75: 0; over 90: 0.
- Endings outside the allowed list: 0.
- Check-ins: 4, 3, 4 and 1. Runs of two come only from the child's own requests. None is misplaced, and they are not tedious.

**Short reason.** 11 rows, all true. "6 cm wala right angle se zyada khula hai" was changed as ordered, but it still says nothing about arm length, and at steering 52 it comes after three misses on exactly that. Under-explained.

**Worked examples**
- s1 asks a deciding step. Only steering reached it (row 24); in the other three lessons the step was told. The own step is broken by the board.
- s2 asks a deciding step (P has the longest arms): "Haan, kam…". Good.
- s3 asks a deciding step ("string kitni baar…"), then a sum (100 cm). Good.

**Asides**
- Stuck 42 "Wah, batting! Toh tumhara favourite yahi hai." and steering 38 "Oho, batting! Isi mein tumhe maza aata hai." are natural.
- Steady 52 and offtopic 46 are the same flat reply: "Wah, chauka! Yeh batane ke liye shukriya." Steady 52 also says "jahan ruke the", which is untrue: they had finished the worked example.
- Offtopic:
  - three pointed invitations, and row 28's "Yeh baad mein; pehle sawaal ka jawab." is curt;
  - "Cricket wali baat maine likh li hai." twice (rows 18 and 28), never using the child's "sixer";
  - the return at row 44, "…kya kehna tha?", asks for what the child had already said three times.
- Overall the asides are the same as D34.

**Wrap**
- Steady 114 answers "thoda mushkil tha" with "Achha, theek hai." It still does not hear the child.
- The sentence about the child is s3 c2's `did`. She answered that card right first time (row 101), so it is true.

**Stop path and model words.** Stuck 78 and steering 58 are the stop menu, whose code is frozen. Offtopic 66 is a goodbye. Model words: 0.

**Hindi requests.** All four went to cards that have a Hindi form. At offtopic 32 the Hindi form differs from the step by one word ("tedhi"), so the promise is thin.

**Reader.** 2 lines recorded as the wrong kind: offtopic 16 and 20.

**Frames.** "Cricket wali baat maine likh li hai." is said twice. The same help frame ("…par socho, aur dekho ki/kis…") comes four turns apart (stuck 62 and 70).

**Register, rows by cause** (5 per lesson): (a) 3 · (b) 1 · (c) 2 · (d) 5 · (e) 5 · (f) 4.
- steady 46 (b), 44 (a), 94 (d), 68 (c), 114 (f)
- stuck 26 (e), 72 (e), 76 (d), 4 (d), 10 (d)
- offtopic 16/20 (a), 18/28 (a), 58 (f), 44 (f), 46 (f)
- steering 10 (e), 50 (e), 8 (e), 38 (d), 52 (c)

## C. Defects

| Defect | Layer | Since D34 |
|---|---|---|
| The own step points at a tester its posing board does not draw (6 rows) | (a) | **New** |
| "Nothing easier" said with the Hindi form and picture unsaid; two joints in a row | (b) | New |
| Waits with no limit after a bare "haan"; "hmm, achha" read as `other` | (b)/(d) | New / carried |
| Return asks for what was told; flat aside replies; wrap does not hear "mushkil" | (c) | Carried |
| A miscount nobody named gets the right-angle wording (steering 10) | (a) | Reduced |

**Gone since D34:** a view taken down by the no-picture turn; the told line that settled the own step; the old e1 miscount help (now 5 and 2 are named).

## D. Scores, D34 → D35

| Axis | D34 → D35 |
|---|---|
| Listening | 3.5 → 3.5 |
| Worked example | 3.5 → 3.5 |
| Class level | 4 → 4 |
| Screen and speech | 4 → **3** |
| Register | 3.5 → 3.5 |
| Promises | 3.5 → 3.5 |

Listening, register and promises each reach 3.5. Screen and speech does not.

## Clauses

| Clause | Answer |
|---|---|
| (1) Board | 0 unsaid boards; the 6 rows above. The cause is the script's board, not the paging. |
| (2) Turn shapes | Counts as in the table; nothing reads as too much except steady 94. Endings outside the list: 0. |
| (3) Requests | Offtopic 58: the next card. "Nothing easier" said untrue once, so the picker is wrong on that row. |
| (4) Picker | Help with nothing new: 2 (steady 82, steering 50). Keys with a wording unsaid: 0. |
| (5) Short reason | 11 rows, all true; steering 52 under-explained. |
| (6) Check-ins | Steady: 115 rows, 4 check-ins, longest run 2 (the child's own request). None misplaced. |
| (7) Worked example | 3.5; all three asked steps decide; 0 "let me try" skips. |
| (8) Joints | Two joints in a row: 1 (offtopic 58). Returns with no back-to line: 0. Abrupt: 1 (steady 52). |
| (9) Stop and model words | The stop menu is carried; model words 0. |
| (10) Hints and re-asks | One re-ask said three times in 5 turns (offtopic 12, 16, 20). |
| (11) Register | 3.5; causes as listed above. |
| (12) Record | 2 wrong kinds; 0 bad captions; the sentence about the child is true. |
| (13) | Not fired. |
| (14) Script sentences | Untrue: 1 (the own-step sentence) plus "jahan ruke the". Giveaways: 0. |
| (15) | The 6 data rows above. |
| (17) Picture turns | All drew the board named. |
| (18) New rungs | The step's easier wording came before the told step in every lesson that reached it. |
| (19) Start line | Stuck 4 / steering 4: "Achha, pehle main dikhati hoon." Fine. |
| (20) Try-first alone | Not a dead turn (stuck 28, steering 20). |
| (21) Remediations alone | 0. |
| (32) Second views | Each showed something new. |
| (33) Grading | 0. |
| (40) Return after a verdict | Slightly abrupt (steady 50, offtopic 44). |
| (41) Long turns | 0 turns of verdict, reason, point and card over 65 words. |
| (45) No-picture turns | Steering 16 and offtopic 26: no board change, not a refusal. |
| (46) Own reasons | Every one after its named answer. |
| (47) Result boards | The 6 rows: the script lacks the board. |
| (48) Invitations | Alone in their turn at steady 30, 38, 42 and offtopic 24 (as K4(b) designs it). |
| (49) Easier-words line | 0. |
| (50) Checker and cold read | A kind the checker does not refuse. No pass reads an own step against the board it is posed on. |
| (54) Second picture | Steering 16: correct. |
| (55) Four hearings | Stuck 38 is fair. |
| (56) No opener | Not run together. |
| (57) Named answers | No reason gives its card's answer away. |
| (58) Help at a check-in between skills | 0 answered by the go-on line alone. The bridge's easier wording sounded like the bridge again in 1 lesson. |
| (59) Waiting | 1 lesson (steady 44). |
| (60) Run two of two | Not passed. |
| (61) Ruling 1 | These rows deny the board; they are not ruling-1 rows. |
| (62) Register | 3.5 again. |
| (63) The whole | Fires for this topic: it passed D34 and fails on this round's script change. |
| (53) | **Fires: the topic returns to staged.** |
| (16) | Not applicable (this topic is live). |

## E. Verdict

The topic does **not** pass. It fails on contradictions (6) and on the screen axis (3). The block is in the script data (layer a), and this round's fix to s1's told line introduced it. Every right answer is graded right and there are no false keys.

The changes that would move it most:
1. Give s1's own step a posing board with the turned tester on it (step 2's result board), and have the checker read every own step's words against the board it is posed on.
2. Limit the waits after a bare "haan", and read "hmm, achha" as a yes.
3. Make the return, the aside replies and the wrap hear what the child said. Drop the "nothing easier" line while a Hindi form or a picture is still unsaid.

**Would I put this in front of a child? No, not until fix 1 is in.** Every child is told "board par dekho" at a tester that is not drawn, and then asked to remember it.