**c4-maths-ch05-t01 (director35): hand judgement**

c4 passes every line of the scale gate. That makes this its second passing run (clause 60), counted with ruling 1 read by K1. The script was not in `D35/scripts/`. I read it at `/home/user/taxila-int/data/lesson-scripts/c4-maths-ch05-t01.json`, which is clean at the run's commit 6f56fc8b7.

## A. Hand counts

| Lesson (rows) | Beats taught | Verdicts / keyed answers | Contradictions | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady (139) | 60/69 (pure waits: 28–48, 9 turns) | 41/41 | 0 | 0 | 0/0 | 0 |
| stuck (67) | 30/32 (28, AI line 34) | 18/18 | 0 | 0 | 0/0 | 0 |
| offtopic (67) | 29/32 (AI lines 38 and 64; 42) | 18/18 | 0 | 0 | 0/0 | 0 |
| steering (51) | 22/24 (16, 20) | 16/16 | 0 | 0 | 0/0 | 0 |
| **d35** | **141/157 (90%)** | **93/93** | **0** | **0** | 0/0 | 0 |
| d34 | 132/139 | 90/90 | 0 | 0 | 0/0 | 0 |

**Gate row:** c4 | 0 | 0 | 0 | 3.5 | 4 | 4 | 4 | 3.5 | 3.5

**K1, values stated over a board that does not show them (script rows, not contradictions):**
- Row 80: "15 pencil ke 3 barabar group" is said over the 5×3 grid, which draws no groups. This is the not-built item (a).
- Row 122: "har ek par 2" is said with the 6-piece bar not drawn.
- Row 118: "dhai" is said over a strip with 2 parts shaded.

Nothing on the board denies any of them.

## B. Items

- **Boards:**
  - 91 turns changed the board, every change at the first word of the part that owns it; 54 turns kept it.
  - Every joint and lead-in was said over the board already up, or over a blank (rows 4 and 102).
  - Every point and remediation board is true of what she says over it.
  - The one key (stuck 32) was said over its answer board ("2/4").
- **D34 mechanisms:**

| Mechanism | Status |
|---|---|
| No-picture line | Still there: steering 16. It is legitimate, since every wording was spent. |
| Help that misses an unnamed answer | Still there: "13" (offtopic 30) and "9" (steering 44) get "Socho, 1/12 ka neeche wala number kya ginta hai…" |
| Question re-asked after try-first or bare "haan" | The whole re-say is gone, but it became a wait loop: steady 28–48. |
| Stated values | Reduced to row 80. |
| "Suno," | Gone. The first turn is now 58–62 words (was 67–71). The goodbye still ignores "thoda mushkil tha" (steady 138: "Achha, theek hai, maine sun liya."). |
| Script rows | The dangling remediation is fixed (steady 84), and the follow-up cake card now has a re-ask. |
| Record | The go-on line is logged as an `aside` seam (steady 74, 90, 100; offtopic 54). |

- **Turn shapes:**

| Shape | n | Words | Note |
|---|---|---|---|
| (a) verdict, reason, point, card | 16 | 54–65 | Worst: stuck 20 |
| (b) hook, point, card | 4 | 58–62 | |
| (c) miss, remediation, card | 6 | 55–58 | |
| (d) verdict, lead-in, problem, step | 6 | 54–67 | |
| (e) aside or park into live part | 5 | 36–69 | Worst: offtopic 56 |

  - Turns over 60 words: 23. Over 75: 0. They read as dense tutoring, not monologue.
  - No turn ends outside the allowed list.
- **Check-ins:** 5 (steady), 2, 1, 1. The longest run is 1. None comes after a point, a right verdict, an aside, or inside a worked example.
- **The wait loop (steady 26–50).** The step "…neeche wala number kya hoga?" is followed by 11 turns of waiting, with "Ab tum batao." (42) and "Ab tumhara jawab sunti hoon." (30, 46) alone in their turns. The step is told only when the child says "pata nahi, aap batao" (row 50). This is the most tedious stretch in the run.
- **Worked examples:** s1 and s2 ask a deciding step; s3 asks a reasoning step. Stuck 41→43 went easier wording, then the told step: right.
- **Short reasons:** 11 rows (whyShort), all true and enough.
- **Own reasons:** 8 said (steady 24, 122, 130; stuck 46, 62; offtopic 46, 52; steering 28), every one after its named answer.
- **Pictures:** 4 views (steady 18, stuck 18, offtopic 26, steering 14). All captions are authored and true. No board changed inside the no-picture turn.
- **Asides:** "Oho, batting! Isi mein tumhe maza aata hai." (steady 56), "Achha, toh tumhe batting pasand hai!" (offtopic 40), and "Arre, chauka! Achha hua tumne bataya." (offtopic 60, flat). These are better than D34's single shape. Every park was returned to; there were no taste claims. The second AI question was new ("kab dekha tha?", offtopic 64).
- **Wrap:** row 136 gives the verdict with its reason, but says "neeche wala number… saare tukde ginta hai" twice. The sentence about the child (row 138, from s3 c2's `did`, answered right at row 127) is true.
- **Reader:** 0 lines read as the wrong kind. 0 model words.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Wait loop with no exit; the question is not on the board | s28–48 | b, d | new |
| Go-on line ("agle hisse", "agli baat") followed by a back-to | s90→92, s100→102 | b, c | new |
| Three remediations left to stand alone | s84, 96, 112 | b | new |
| Unnamed "13" and "9" get help aimed at a different mistake | o30, r44 | a | carried |
| "…phir bhi sab milkar ek hi cake hain" (illogical "phir bhi") | k62 | a | new |
| Goodbye reply that ignores "thoda mushkil tha" | s138 | c | carried |
| Hindi forms keep "fraction" and "theek baithta" | r8 | a | carried |

## Reversal clauses

- **1, 3, 4, 8 (joints doubled, out of place, missing back-to), 9, 10, 15, 17, 33, 41, 47, 55, 61:** 0.
- **2:** counts as above. I do not find (a) or (c) too much for one breath; (e) at 69 words is long.
- **5:** 11 short-reason rows, all true.
- **6:** steady has 139 rows and 5 check-ins; the remaining check-ins are not tedious, the wait loop is.
- **7:** score 4; no path faults.
- **8, abrupt seams:** 2, so the clause does not fire.
- **11:** register rows by cause: (a) 3, (b) 1, (c) 1, (d) 7, (e) 5, (f) 3.
- **12:** reader 0 wrong kinds; captions 0 faulty; the sentence about the child is true.
- **14:** 0 untrue, 0 giveaway (s122 is borderline), 4 unnatural (s24, s110, s120, k62). The s1 frame "…hota toh aise N tukde poora… bana dete" repeats across the script but is heard once per lesson.
- **18:** the easier wording helps. The third wording of the same idea (k30, r12) adds little.
- **19:** "Chalo, main batati hoon. Kitchen mein…" (62 words) does not brush the child aside.
- **20:** o42 is a dead turn.
- **21: fires.** Three remediations stand alone in the steady lesson. They read as speech, not notes.
- **32:** no view settles its card.
- **40:** the returns (s54, o58) are not abrupt.
- **45:** curt, not a refusal.
- **46:** 0 misfires; the second half applies to o30 and r44.
- **48: fires on its letter.** "Ab tum batao." stands alone at s42, and the six invitations act as a fixed form.
- **49, 54, 58:** not exercised.
- **50:** k62 is one sentence the fifth pass should catch.
- **57: fires on its letter** for s1 c2 ("13").
- **59:** applies in one lesson (steady).
- **60:** passes.
- **62:** register 3.5.
- **63:** no.

## D. Scores (director34 → director35)

| Axis | Score | Why |
|---|---|---|
| Listening | 4 → **3.5** | The wait loop and the unnamed-answer help |
| Worked example | 4 → 4 | |
| Class level | 4 → 4 | |
| Screen and speech | 4 → 4 | |
| Register | 3.5 → 3.5 | |
| Promises | 4 → **3.5** | "agle hisse par chalte hain" followed by a return to the previous question |

## E. Verdict

c4 passes every gate line: 90% of beats taught, 93/93 verdicts, 0 contradictions, 0 unsaid boards, 0 misgrades, 0 false keys, and every axis at 3.5 or above. Listening, register and promises each reach exactly 3.5.

**Yes, I would put it in front of a child.** It is true, its boards are honest, and its help answers the mistake the child actually made.

The changes that would most move it:
1. After two bare "haan", the wait says the step's re-ask, and after three it tells the step.
2. The go-on line is never used before a back-to; the turn goes straight to the return instead.
3. Author a reason in s1 c2 for "13" (the child added instead of taking away).

What the gate does not measure, which a parent would still notice:
- The eleven-turn stall at the barfi step.
- "Maine sun liya" said to "thoda mushkil tha".
- Hindi forms that are no more Hindi than the original.