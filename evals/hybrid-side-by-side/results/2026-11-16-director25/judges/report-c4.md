# c4 (c4-maths-ch05-t01) — director25 hand judgement

**c4 fails the scale gate.** There are 2 contradictions (director24 had 0), and register is still 3. Listening and promises reach 3.5. Register does not.

## A. Hand counts

I counted beats as the parts each lesson reached: points, worked steps, cards, remediations and their follow-up cards, bridges, and the closing question. That is a different unit from director24's.

| Lesson (rows) | Beats | Verdicts / keyed answers | Contradictions | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady (133) | 50/50 | 33/33 | 1: row 124, held cost | 0 | 0/0 | 0 |
| stuck (67) | 15/15 | 7/7 | 1: row 30, paging | 0 | 0/0 | 0 |
| offtopic (81) | 22/22 | 14/14 | 0 | 0 | 0/0 | 0 |
| steering (69) | 22/22 | 13/13 | 0 | 0 | 0/0 | 0 |
| **d25** | **109/109** | **67/67** | **2** | **0** | 0/0 | 0 |
| d24 | 82/83 | 69/70 | 0 | 0 | 0/0 | 0 |

- **Steady 124.** The remediation's simpler line, "Board ki dono roti ek jitni hain. 12 wali roti ke tukde dekho, phir 3 wali ke…", is said over the follow-up card's cake board (9 and 7 pieces). That board is drawn from character 0, but the card itself starts at character 115.
- **Stuck 30.** She says e2's simpler line, "…Cake mein yeh dono baatein hain", over the Roti/Barabar board, which has no cake. The cell's part is null on rows 28, 30 and 32.
- **Not counted, as in director24:** the follow-up card's board appearing while the remediation is still being said (steady 10, 24; stuck 20, 48; offtopic 16, 60; steering 10, 54).
- **Flag I did not count:** the `contradictionsV6` flag on offtopic 26 is false. A view was drawn and the caption is true.

## B. Items

| Item | Status |
|---|---|
| Mech. 1, how a turn is assembled | **Still there.** The return question is glued to a verdict (steady 38, offtopic 42, steering 32), and it is not one of the script's `asideReturn` forms. "Dekho," opens 11 whys in steady. |
| Mech. 2, help memory | **Reduced** from 5 to 3 help turns with nothing new, but 2 new wrong-part help turns appeared. |
| Mech. 3, a part said once | **Gone.** The e2 point is said (steady 100). Nothing dropped, nothing re-said unasked; `partOnce` 0 agrees. |
| Mech. 4, sentence about the child | **Working.** It is present in the one lesson that reaches the wrap, and true. Correctly absent in the 3 that end early. |
| Mech. 5, seams record | **Reduced.** Hook and check-in kinds are now right. The Hindi switch seam has no `by` (steady 36, stuck 10, offtopic 32, steering 8). Captions, "Phir se dekho:" and goodbyes are recorded as `point`. |
| Mech. 6, smaller items | **Mostly gone.** No menu after "bye" (stuck 66, offtopic 80, steering 68). The Hindi promise is still broken twice. |
| K3 | **Working.** "Nahi," then the fact (stuck 26, 36; offtopic 30). One regression: offtopic 24 answers "mujhe nahi pata" with "Haan, kyunki…". |
| L, turn length | **Partly.** Turns over 60 words: steady 10 (24, 66, 70, 104, 118, 120, 122, 126, 128, 132), stuck 1 (20), offtopic 3 (16, 60, 78), steering 3 (8, 54, 66), so 17 (director24 had 16). Holding a point and a card: 1 (steering 8, 62 words: Hindi alt wording plus card). Points ending on a check-in with the card next: steady 6 (4, 20, 32, 40, 66, 100). The break sometimes lands with no check-in (steady 70, 76, 96, 104; offtopic 78), and the check-in sometimes sits on a bare verdict (steady 74, 94). **I do not find the check-ins tedious**; they read as a pause. The breaks with no check-in read worse. Monologue rather than tutoring: steady 66, 118, 132; offtopic 78; steering 66. The wrap is **one** 94-word turn (steady 132), not two. |
| Joints | Placed where they do not belong: 0. Filler doubled ("toh… Toh ab wahin se"): 2 (offtopic 44, steering 34). Missing joint: 4 (offtopic 28 has no `backTo`; the 3 glued returns). By lesson: 1 / 0 / 3 / 2, total 6; by director24's method, 3. Record against what was heard: 24 of 40 rows agree. |
| Reader | 0 lines recorded as the wrong kind; 0 right answers ungraded. |
| Pictures | 4 requests, 4 views, 4 authored captions, all true, none names a later answer (steady 18, stuck 18, steering 14, offtopic 26). Offtopic 26 gives the caption and no question. |
| Help with nothing new | 3: stuck 10 and offtopic 32 (a Hindi request answered with the point word for word; same rows as director24), stuck 62 (a second clarify gets the problem retold, not the worked answer). Wrong part: stuck 30; offtopic 46 (the e4 card's hint, "Phir use Raju ke 5 se milao", said before Raju exists). Worked answer given too soon: 0. Stuck 12 gives the worked answer over the board that posed the card, not the answer board. |
| Hindi requests | 4. Two bring new words (steady 36, steering 8), though no more Hindi than usual. Two repeat the point (stuck 10, offtopic 32). |
| Re-asks | Every hint re-asks. Only offtopic 66 ("Dono numbers…", 8 turns later) is weak. Card said again word for word: 7 times, all asked for ("Phir se dekho:"). |
| Board changes | 77 changed, 76 in the right place (steady 124 is not); 89 held; 4 split views. |

**Asides**

| Aside | Park | Return | Child | Reply | Rating |
|---|---|---|---|---|---|
| steady 33 | 34 | 38, glued | "bowling karna" | "Achha, toh tumhara favourite hai bowling karna." | natural, same as d24 |
| stuck 41 (AI line) | — | 42 | "batting" | "Achha, toh tumhe batting sabse achha lagta hai." | natural, same |
| offtopic 5 (AI line) | — | 6 | "batting" | same as stuck | natural, same |
| offtopic 17 (AI line) | — | 18, a new question | "Dhoni" | "…favourite hai Dhoni." | natural, same |
| offtopic 27 | 28, no `backTo` | 42, glued; re-asks what row 7 answered | "batting karna" | "…favourite hai batting karna." (same frame as row 20) | natural |
| steering 23 | 24 | 32, glued | "bowling karna" | "…bowling karna. Toh ab…" | natural, filler doubled |

- No taste claims. Every park is returned to, and there is no return without a park.
- The park is the same form in 3 of 3 lessons. The Hindi switch is the same form in 4 of 4. Try-first is the same form in 4 of 4.

**Register (five rows per lesson, each under one cause)**

| Lesson | Rows (cause) |
|---|---|
| steady | 70 (a: "Dekho," 11 times); 118 (c: "Toh poora jawab:" 3 times); 38, 76, 132 (d) |
| stuck | 10, 30, 62 (e); 40 (a: 14 of 34 turns end on a check-in); 14 (f: a give-up is ignored and the next point starts) |
| offtopic | 32, 46 (e); 24 (c); 44 (a); 42 (d) |
| steering | 24, 34 (a); 8, 32, 66 (d) |

Count by cause: (a) 5, (b) 0, (c) 2, (d) 7, (e) 5, (f) 1.

**Ending (steady)**
- Row 130: the c3 verdict, then "Chalo, aaj ka ek aakhri sawaal…", over a 9-piece circle with 4 shaded and the answer hidden.
- Row 131: the child answers "4/9", which is right.
- Row 132, over the answer board: "Sahi jawab. Aaj ki baat yeh thi ki kisi cheez ke barabar tukdon ka hi fraction naam hota hai, aur neeche wala number saare barabar tukde ginta hai. Phir bahut saari cheezon ka fraction aaya: neeche wala number batata hai kitne barabar group banane hain, aur ek group ki ginti jawab hoti hai. Aakhir mein dekha ki ek jaisi cheez jitne zyada barabar tukdon mein kate, har tukda utna chhota hota hai. Aaj tumne 1/4, 1/10 aur 1/7 ko sabse chhote se sabse bade tak lagaya. Aaj ke liye itna hi, phir milte hain!"
- All three "covered" sentences are true of skills this lesson reached.
- The sentence about the child is s3 c3's `did`, which she answered right at the first try (row 129). It is true and it took doing. But it lists the fractions in the card's order, so heard aloud it names a wrong order.
- It is not two turns.

**Pace:** the same as director24 (steady reaches the end; offtopic now reaches s2). **Third skill:** taught at class level, with a real worked example (two 1/6 pieces cover one 1/3). **Script:** 0 untrue, 0 giveaways, 1 repeated frame ("1/2 hai ya 1/x?" in s1 e1 and c1), 3 unnatural (the `did` order, "Socho, board par", "upar" meaning both the top strip and the top number). **Two words for one thing:** "hissa" in the check-in against "tukda/bhaag"; "patti" and "ribbon"; "plate" and "group"; "equal shares". **Safety turn:** not triggered in c4.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Help said over a board it does not describe | steady 124 | b | **new** |
| Help for a different part | stuck 30; offtopic 46 | b | **new** |
| Hindi request answered with the point word for word | stuck 10; offtopic 32 | b, and d (`hindiNewWords`/`helpRepeats` read 0) | carried |
| Second clarify gets the problem retold, not the worked answer | stuck 62 | b | carried |
| Worked answer not on the answer board | stuck 12 | b | **new** |
| Return question glued to a verdict, not an authored form | steady 38; offtopic 42; steering 32 | c | carried |
| Wrap in one turn; 60-word break lands with no check-in | steady 132, 70, 104; offtopic 78 | b | partly new |
| Single-form park, Hindi switch and try-first; "Dekho," ×11; filler doubled | listed above | c | carried |
| "Haan, kyunki" after a give-up | offtopic 24 | c | **regressed** |
| e1–e3 cards have no hint of their own | stuck 8; steering 30 | a | carried |
| Hindi switch seam has no `by` | steady 36, stuck 10, offtopic 32, steering 8 | b | **new** |

Gone since director24: the dropped point, the missing "nahi", the menu after "bye", the flat aside replies.

## D. Scores, director24 → director25

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 → 3.5 | K3 and the goodbye are fixed; wrong-part help and the Hindi repeats offset that |
| Worked example | 4 → 4 | |
| Class level | 4 → 4 | |
| Screen and speech | 4 → **3.5** | 2 contradictions |
| Register | 3 → **3** | Turn shape and help, not joints |
| Promises | 3.5 → 3.5 | The Hindi promise is broken twice; parks are kept |

## Reversal clauses

| # | Count | Fires? |
|---|---|---|
| 1 | Steady 133 rows; check-ins not tedious | No |
| 2 | 0 | No |
| 3 | 3 (stuck 10, 62; offtopic 32), plus 2 wrong-part | **Yes** |
| 4 | True in 1 of 1; unnatural in 1 (steady 132) | No |
| 5 | 0 dropped, 0 re-said; `partOnce` 0 agrees | No |
| 6 | Register 3; (a)5 (b)0 (c)2 (d)7 (e)5 (f)1 | Rows above |
| 7 | 0 | No |
| 8 | 0 untrue or giveaway captions; 0 picture turns not answerable by the question | No |
| 9 | Listening and promises 3.5 | No |
| 10 | 0 untrue, 0 giveaway | No |
| 11 | 2 contradictions: steady 124 held cost, stuck 30 paging; 0 misgrades; 0 unsaid boards | **Yes** |

## E. Verdict

**c4 fails the gate** on 2 contradictions (layer b) and on register 3 (layers b and c). Every other count line passes.

The three changes that would most move it:
1. Page help by the part it belongs to. A remediation's simpler line keeps its own board until the follow-up card's first word, and help is never chosen when the cell has no part (steady 124, stuck 30, offtopic 46).
2. Make the Hindi request use unsaid wording, and fix the predicate that reads 0 on stuck 10 and offtopic 32.
3. Build L as written: the return question as its own turn in an authored form; the wrap in two turns; a check-in wherever the turn breaks.

**Batch: no.** Every defect above lives in the shared walk and rendering, so all 30 topics would inherit them.

Listening 3.5 ✓, promises 3.5 ✓, **register 3 ✗**.

I wrote two helper scripts in my scratchpad to read the JSON; no project or run file was changed.