# c5-t02 (c5-maths-ch02-t02): director27 hand report

**c5-t02 does not pass the scale gate.** Every help wording was said over its own part's board. The failure is somewhere else: whenever a remediation shares a turn with its follow-up card, the remediation's own board is never drawn. That gives 5 contradictions and 1 unsaid board. Rows are 0-based.

## A. Hand counts

| Lesson | Rows | Beats taught | Verdicts | Contradictions | Unsaid boards | Misgrades (R→W / W→R) | False keys |
|---|---|---|---|---|---|---|---|
| steady | 131 | 62/62 (row 36 is the AI line; its beat is taught at 38) | 37/37 | 2: rows 24, 90 | 1: row 118 | 0/0 | 0 |
| stuck | 69 | 33/33 | 15/15 | 1: row 20 | 0 | 0/0 | 0 |
| offtopic | 71 | 33/34 (row 2: the e1 point is never said) | 17/17 | 1: row 6 | 0 | 0/0 | 0 |
| steering | 53 | 25/25 | 11/11 | 1: row 10 | 0 | 0/0 | 0 |
| **D27** | | **153/154** | **80/80** | **5** | **1** | 0/0 | 0 |
| D26 | | 173/173 | 67/67 | 0 | 2 | 0/0 | 0 |

**What went wrong on the boards:**
- **The 5 contradictions (mechanism: paging).** Each is a miss verdict, then the remediation, then its follow-up card, all in one turn (68–74 words). From the remediation's first word the screen shows the follow-up card's board. The remediation's own board (in the script) is never drawn.
  - Rows: steady 24, stuck 20, offtopic 6 and steering 10 (S1 rem[0]), and steady 90 (S3 rem[1]).
  - Example: "Socho, do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein…" is said over unlabelled bars cut into 9 and 11.
  - The C1 amendment ("the remediation's board up while it is said") was not built on this path.
- **The unsaid board (paging plus script data): steady 118.**
  - S3's gap-thinking remediation has no `board` in the script; S2's gap-thinking remediation has none either.
  - So "ek dibbe mein 3… doosre mein 8" is said over the follow-up card's board (strips cut into 5 and 6). That card is first asked at row 120.
  - This breaks B1's rule word for word: "it never borrows a card's board".
- **Watch rows, not counted.** A worked example's own board shows the answer to the child's step before she asks it:
  - stuck 32→34: the step "bada hissa kisko mila?" is asked over 1/8 and 1/2, shaded and labelled;
  - steady 102: a number line marked at 2/7 and 2/3.

The known item ("no place") does not occur in this topic.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D26 #1, a remediation's help over another card's board | **Gone for help wordings, still there for remediations** | 0 of 46 help wordings were over a foreign board. 6 remediation rows were (listed in A). |
| #2, check-ins in the worked examples | Reduced | In 6 of 6 worked examples the two told steps share one turn and end on the child's step, except offtopic 38, where the steps end on "Yeh kadam samajh aaya?". In 6 of 6 the problem is not said with step 1: it closes the verdict turn on a check-in. "kadam" is said when no step has been said (steady 16, 62; steering 38). |
| #3, the go-on line | **Gone** | Said only after a key (stuck 42, offtopic 64), never stacked. |
| #4/B2, the stop path | **Working** | Stuck 68 is the authored code line: "Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao." Each "bye" got "Aaj ke liye itna hi, phir milenge!" (offtopic 70, steering 52). |
| #5/N1, a request met with nothing | Working | The opening's clarifies go to the authored path (stuck 4, steering 4). 0 requests got silence, a bare card or another part's help. Borderline: stuck 42, a second clarify after the key, got the go-on line and the aside return while `workedExample.simpler` was still unsaid. |
| #6/R1, a skill's own remediation | **Working** | Steady 89 (S3, bigger-denominator) got S3 rem[1]. No remediation was said twice. |
| #7/J1, joints | Partly | All 6 worked problems have a lead-in and are worded as problems to do together. **3 returns have no back-to line:** steady 92 ("…pehli team ne zyada banayi. Kaunsa zyada hai, 2/9 ya 2/5?"), offtopic 10, steering 20. |
| #8, replies | **Better** | "Achha, toh tumhe chauka sabse achha lagta hai." (steady 38, stuck 44, offtopic 26, steering 32); "…sixer…" (offtopic 38). |
| #9, script | Partly | The teachback now has a hint, but the walk gave the key at the first miss (steady 126). |
| #10, the record | Partly | Help is now recorded as help. Still wrong: a phantom "aside" seam (stuck 4, steering 4); the stop turn recorded as "aside" (stuck 68); the teachback lead-in recorded as "point" (steady 124). |

**Help against the whole lesson:**
- **Nothing new: 1.** Steady 82 ("3/8 tak pahunchne ke liye 1/8 wale teen gap…") nearly repeats row 78 ("3/8 matlab 1/8 wale teen gap").
- **New words, same idea as the line before: 2** (steady 88, offtopic 20).
- **Keys given with a wording unsaid: 1.** Steady 126: the teachback's `simpler` was unsaid. This is also the 1 key where a hint would have done.
- Every key was said over the answer board.
- **Off-topic help: stuck 10.** A Hindi request on the e1 card got the e1 point's `simpler` about 1/4, which does not touch the question (carried from D26).

**Check-ins and turn length:**

| Lesson | Check-ins | Longest run | Over 60 words | Over 75 words |
|---|---|---|---|---|
| steady | 23 | 2 (16–18, 78–80, 84–86, 100–102; each made by the child's own request) | 19 | 0 |
| stuck | 12 | 2 | 5 | 0 |
| offtopic | 12 | 3 (60–64; the child's give-ups made it) | 5 | 0 |
| steering | 9 | 2 | 5 | 0 |

- **Tedious: yes, mildly.** The loop of verdict + why + new point + "saaf hua?", then "haan", then the card alone in 13–25 words, runs 6 times in steady (6, 42, 52, 58, 72, 96). The three worked-problem turns end on a "kadam" check-in with no step said.
- **Turns of 61–75 words:**
  - Verdict + why + new point reads as monologue (steady 12, 52, 58, 78, 84, 96).
  - **Remediation + card is too much in one breath:** two new stories in one turn (roti, then dor), on the wrong board.
  - No point-with-card turn went over 60 words.

**Frames:**
- No sentence frame of hers repeats within 4 of her turns, apart from re-asks.
- Verdict openers in steady: "Sahi jawab" ×11, "Haan, sahi hai" ×9.
- Check-ins in steady: "Ab tak samajh aaya?" ×8.
- Park, return, switch and step forms:
  - Park: asidePark[1] ×3.
  - Return: asideReturn[2] ×3.
  - Hindi switch: [1] ×3 and [0] ×2.
  - Try-first: afterTryFirst "Dhyaan se suno…" and "Lo, ab yeh dekho" ×1 each.

**Board changes:** 88 turns changed the board, 82 of them in the right place (the 6 rows in A are the wrong ones). 56 turns held it.

**Re-asks without their givens: 2.** Steady 56 asks "Kaun aage pahuncha, Mona ya Sonu?" over an unmarked line. Steady 110 asks "Toh zyada kisne khaya…" four turns after the fractions were said. The script's own re-ask, which carries the givens, was not used.

**Pictures (4).**
- Captioned with authored lines: stuck 18, offtopic 28 (S1 e3 caption, parts view) and steering 14 (the follow-up card's caption, wholes view). All are true of the view, give no answer away, and are followed by the question alone.
- **Steady 18 has no authored caption:** "Dekho, pehle mein 8 barabar tukde hain…" (code; also "tukde" against "hisse").

**Asides:**
- Park → return: stuck 34 → 42, offtopic 14 → 24, steering 26 → 30.
- Each return was its own turn, apart from the go-on line before it at stuck 42.
- Stuck 42 dodges a confused child: "phir bhi samajh nahi aaya" gets "is par hum phir aayenge… ab cricket par aate hain".
- Offtopic 24 ignores "sixer maara".
- No taste claims; the AI line came once per lesson.

**The wrap (steady):**
- Row 128: "Har paath mein kuch naya hota hai. [the three covered sentences] Aaj ka kaam aasaan laga ya thoda mushkil?" It ignores the child's reason at 127.
- Row 130: "Aaj humne milkar kaafi kuch dekha. Aaj ke paath mein tumne 5/12 aur 5/6 mein se lamba ribbon pehchaana. Aaj ke liye itna hi, phir milenge!"
- The closing verdict at 126 says its why.
- The sentence about the child is the `did` of S3 c2, answered right at the first try (row 115). It is true and natural.
- S3 is taught at class level.

**Script sentences:**
- Untrue: 0. Giveaway: 0.
- Repeated frames: 3 (each worked problem's last line comes back as the child's step).
- Unnatural: 4 —
  - S3 step 1's circular "kyunki ginti barabar hai, isliye…";
  - "likho" in a spoken lesson;
  - "ginti" meaning the number of cuts in S1 step 2 but the parts taken in S3;
  - "chocolate" and "patti" for one thing (stuck 36).
- **Hints:** 0 state the answer's numbers, leave one option, or are untrue.
- **Remediation boards themselves:** 0 untrue, 0 showing a later answer. One data mismatch: S3 rem[2]'s `sayAlt.board` fits its `say`, not its alternate wording.
- Carried: "hissa" in "Yeh hissa saaf hua?" (9 rows); "upar" in three senses; "Is sawaal ka sahi jawab:" (stuck 12, offtopic 60).

**Reader:** 0 lines recorded as the wrong kind; every right answer was graded.

## C. Defects

| Defect | Rows | Layer | |
|---|---|---|---|
| Remediation + card turn skips the remediation's board | steady 24, 90; stuck 20; offtopic 6; steering 10 | b | new |
| S2/S3 rem[2] have no board, so the follow-up card's board is borrowed | steady 118 | a+b | new |
| No back-to line on a return | steady 92, offtopic 10, steering 20 | b | new |
| Worked problem not said with step 1; "kadam" check-in with no step | 6 worked examples; steady 16, 62; steering 38 | b/c | new |
| Teachback key at the first miss, hint unsaid | steady 126 | b | new |
| e1 point dropped, hook said alone | offtopic 2 | b | new |
| The script's own re-ask (with givens) not used | steady 56, 110 | b | carried |
| Worked board shows the step's answer | stuck 32–34, steady 102 | a/b | carried |
| Record errors | stuck 4, 68; steering 4; steady 124 | d | partly carried |
| Script wordings above | | a | carried and new |

**Gone since D26:** help over the first check card's board; the go-on line with no key, and stacked joints; no lead-in before a worked problem; flat replies; the model-drafted opening turn; one told step per turn; the missing S3 remediation; turns over 75 words.

## D. Scores (D26 → D27)

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 → **3.5** | Every request is answered and R1 works. Still: the reason before the wrap is ignored, stuck 42 deflects a confused child, stuck 10 is off-question, offtopic 24 ignores the six. |
| Worked example | 4 → **4** | Two steps a turn and the child's own step, but the problem is said alone. |
| Class level | 4 → **4** | |
| Screen and speech | 3.5 → **3** | 5 contradictions + 1 unsaid board. |
| Register | 3 → **3.5**, marginal | The worked examples and the joints read better. Still: remediation + card monologues, the "Sahi jawab" and "saaf hua?" loop, missing back-to lines. |
| Promises | 3.5 → **3.5** | |

**Listening, register and promises all reach 3.5.** Register only just does.

**The clauses:**
1. **Help turns over another part's board: 0.** Remediations said over a card's board: **6** (one of them, steady 118, before its card was asked). **If a remediation counts as help, clause 1 fires.** Remediation boards untrue or showing a later answer: 0. Does not fire.
2. **Nothing new: 1. Keys with a wording unsaid: 1 (steady 126): fires.** Keys where a hint would have done: 1. Does not fire.
3. **Requests met with nothing: 0** (borderline: stuck 42). Does not fire.
4. **Steady is 131 rows**, with 23 check-ins and a longest run of 2.
   - **Tedious: yes.** The check-ins end on a verdict with a new point whose card waits (6 rows) and on the worked problem alone (3 rows).
   - **Remediation + card in one breath is too much: yes.**
   - Point + card at 61–75 words: none occurred.
5. **The go-on line out of place, or two joints at one seam: 0. Abrupt seams: 3 (steady 92, offtopic 10, steering 20): fires.** The back-to form exists; the walk did not place it on these paths.
6. **The stop turn is the authored line; model sentences heard: 0.** Does not fire.
7. **R1: 0.** Does not fire.
8. **Hints that give the answer, leave one option or are untrue: 0.** Does not fire.
9. **Register 3.5.** Rows by cause:

   | Cause | Rows |
   |---|---|
   | (a) a fixed form | 0 |
   | (b) a script sentence | 0 |
   | (c) the verdict and its why as written | 3 |
   | (d) the length or shape of the turn | 8 |
   | (e) help | 2 |
   | (f) other (missing back-to, "kadam" check-in, dropped point, dodged confusion) | 7 |
10. **Reader wrong kinds: 0. Captions untrue or giving an answer away: 0** (1 unauthored). **The sentence about the child is true.**
11. **Listening and promises reach 3.5.** Does not fire.
12. **Script sentences:** untrue 0, giveaway 0, repeated frames 3, unnatural 4.
13. **5 contradictions and 1 unsaid board, all paging; 0 misgrades.**

## E. Verdict

**c5-t02 does not pass the scale gate.** The help-board fix (B1) holds for every help wording. But C1's new remediation-plus-card turn draws the card's board from the remediation's first word: 5 contradictions in all four lessons. The script's two gap-thinking remediations have no board, so one borrows its card's board (steady 118). Both faults are in the walk (layer b), and the second is also in the script (layer a).

The changes that would move it most:
1. In a remediation + card turn, page the remediation's own board at its first word and the card's board at the card's first word. Give S2 and S3 rem[2] a board, and make a missing board throw in the dry run.
2. Place the back-to line on every return to an earlier card, with the card's authored re-ask that carries the givens. Use the teachback's hint before its key.
3. Say the worked problem with step 1 (or end the problem turn with no "kadam" check-in), and split the remediation from its card when the turn holds two new stories.

**Learning's 30-topic batch: no.** The fault hits every remediation that shares a turn with its card, and the walk will take that path in every topic.