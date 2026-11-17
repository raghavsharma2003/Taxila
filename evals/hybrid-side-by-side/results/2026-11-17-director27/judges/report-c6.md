**c6 (c6-maths-ch06-t01), director27: hand report**

c6 fails the scale gate on two contradictions, offtopic row 10 and steering row 60. Help on remediations is now said over the right board in every row, which was this run's first question. Check-ins are fewer, but the worked examples still mostly tell the child what to do.

## A. Hand counts

| Lesson (rows) | Beats taught / beat turns | Verdicts / keyed answers | Contradictions | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady (113) | 54/54 | 31/31 | 0 | 0 | 0/0 | 0 |
| stuck (67) | 32/32 | 13/13 | 0 | 0 | 0/0 | 0 |
| offtopic (77) | 37/37 | 17/17 | 1 (row 10, paging) | 0 | 0/0 | 0 |
| steering (65) | 31/31 | 16/16 | 1 (row 60, data) | 0 | 0/0 | 0 |
| **D27** | **154/154** | **77/77** | **2** | **0** | **0** | **0** |
| D26 hand count | 147/147 | 58/58 | 1 | 2 | 0 | 0 |

**The two contradictions:**
- **Offtopic row 10 (paging).** After her AI line, she poses "Khet PQRST… PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m…". The card's page (the pentagon with its side lengths, in `pageParts` at character 71) was dropped. `held` kept `shape@1`, the pentagon with corner names only, and `screen.numbers` is `[]`. On the normal path the same card redraws (steady row 26).
- **Steering row 60 (data).** The hint for the first skill's second check card says "Card ka kinaara board par ek line ban kar khula hai. Us line ki chaaron bhujayein dekho…". The board is `measured@1`, a closed 10×4 rectangle with no trace. The opened-out line exists only in the picture view, which the child had not asked for. This hint was rewritten after director26.

**Boundary case, not counted:** four remediation turns end on a check-in while the follow-up card's figure is on screen, before that card is said: steady rows 46 and 92, offtopic rows 30 and 64. The script writes those boards as the remediation's own ("spoken over the then-card's own board"), and the D26 report treated them the same way. If B1's "never borrows a card's board" is read literally, these are 4 unsaid boards.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D26 mechanism 1: remediation help over another card's board | gone | Steady 48, stuck 38, steering 8, offtopic 66: each over the remediation's own board |
| D26 mechanism 2: check-ins in worked examples | reduced | Two steps per turn; the third skill's example still has a run at 82-84-86 |
| D26 mechanism 3: go-on line misplaced or stacked | gone | Steering 18 records the go-on line suppressed in favour of the back-to line; that turn now reads abrupt (below) |
| D26 mechanism 4: stop path | gone | Stuck 66, offtopic 76, steering 64: the code line, no buttons |
| D26 mechanism 5: request at the hook gets nothing | gone | Stuck 4 "Koi baat nahi, ise aur aasaan karke samjhaati hoon."; steering 4 |
| D26 mechanism 6: mix-up in a later skill | gone | Steady 92 and 100 each get the third skill's own remediation |
| D26 mechanism 7: no lead-in to a worked problem | gone | All 6 problems have a lead-in and "Saath mein nikaalte hain…" |
| D26 mechanism 8: flat replies | gone | "Achha, toh tumhe chauka sabse achha lagta hai." (steady 38, stuck 48, offtopic 10/34, steering 34) |
| D26 mechanism 9: script | partly | The closing question's authored hint went unused (steady 108); "hissa" in two senses in one turn (steady 6) |
| D26 mechanism 10: the record | reduced | Help is recorded as help and no phantom verdicts remain. Still wrong: the opener before the first point recorded as "aside" (stuck 4, steering 4); the stop line recorded as "aside" (3 rows); the closing question's lead-in recorded as "point" (steady 106) |
| Help boards, by hand | working | 43 help turns: steady 4, 10, 14, 40, 48; stuck 2, 4, 6, 8, 14, 24, 26, 32, 38, 40, 44, 52, 58, 62, 64; offtopic 4, 18, 20, 26, 36, 44, 54, 58, 66, 72; steering 2, 4, 8, 10, 16, 26, 30, 38, 42, 46, 50, 56, 60. Over another part's board: **0**. Keys: stuck 42 and steering 12 over the answer board; steady 108 over the closing question's answer board |
| Remediation boards | working, with a note | 6 boards, all true and none showing a later answer. Only the first skill's missing-sides remediation has a figure of its own (pentagon PQRST, names only); the other five reuse their follow-up card's figure |
| Help against the whole lesson | partly | Nothing new: 0. Same idea as the point: 3 (the hint for the first skill's rectangle card at stuck 24, offtopic 26, steering 38). Keys with a wording still unsaid: 1. Keys where a hint would have done: 1. Both are steady 108: "73 cm" got "Iska jawab hai 72 cm…" while the closing question's hint was unsaid |
| Requests answered | partly | No silence and no bare card. Stuck 58 and offtopic 54: a give-up straight after the bridge got the previous card's second explanation (a card the child had answered right), while the bridge's own easier wording was unsaid |
| Check-ins | partly | 20 / 13 / 14 / 12 (D26: 24 / 16 / 12 / 13). Runs of three or more: steady 82–86 (told steps; the child did not make it); stuck 56–64, offtopic 52–56 and steering 12–16 (all made by the child's requests). Every worked problem stands alone and ends on a check-in. Steady 16, 60 and 82 ask "Yeh kadam samajh aaya?" / "saaf hai?" when no step has been told. C1's "problem said with the first told step" never happens in c6. The hook ends alone on a check-in (stuck 2, steering 2) |
| Worked examples (steady) | partly | First skill: 2 told steps in 1 turn, 2 check-ins. Second: 2 steps in 1 turn (72 words), 1 check-in. Third: 5 steps in 3 turns with 3 check-ins in a row, and the child only works out 3 × 160: a recital |
| Turns over 60 / over 75 words | — | 14 / 8 / 5 / 5 over 60; 0 over 75. Monologue: steady 110 (the 74-word wrap) and steering 8 (75 words in answer to "thoda hindi mein samjhao"). The rest read as tutoring |
| Joints (misplaced / two at one seam / abrupt) | partly | 0 / 0 / 4: steady 2 and offtopic 2 ("…utna pitch ka parimap hai. Is triangle ki…"), offtopic 12 (back to the first card with no back-to line), steering 18 ("pata nahi, aap batao" → "Achha, ab pehle wale sawaal ko phir se dekhte hain."). Per lesson 1 / 0 / 2 / 1. Steering 32: "abhi aage badhte hain. Ab cricket ki baat karte hain" contradicts itself |
| Stop path and model words | working | Stop turns are the authored code line 3 of 3. Model-written sentences: 0. The steering 14 caption comes from a code template |
| Mix-up met again | working | Steady 91 and 99 get the third skill's own remediation. Repeats within one skill get hints (stuck 26, 52; offtopic 18, 72; steering 10, 46, 50, 60) |
| Returns and the wrap | partly | Returns are alone (stuck 46, offtopic 32) or led only by the go-on line (steering 32). Wrap row 110: "Kuch baatein aasaan thi, kuch mein mehnat lagi. Aaj dekha ki parimap… taar ka kharcha nikala. Aaj ki padhai mein kuch aisa tha jo achha laga?" Wrap row 112: "Har paath mein kuch naya hota hai. Aaj tumne 70 cm ki dori se ulta chalkar rectangle ki chaudai nikali. Aaj ke liye itna hi, phir milte hain." The closing verdict gives its why (108). Row 110 ignores the child's reason at 109 ("maine pehle chhota wala socha, phir bada"), and row 112's first line does not answer the child's "haan" |
| Sentence about the child | working | From the third skill's last check card; answered right at the first try (row 105); true and natural |
| Pictures | partly | 4 picture turns. Steady 18, stuck 18 and offtopic 28 use authored captions, true of the unrolled view, giving nothing away. Steering 14 has no authored caption (the cell lost its part after the key): "Is aakaar ki 5 bhujayein seedhi karke ek rekha par rakhi hain: 8 m…3 m." It is true of the view and has no hole |
| Reader | working | 0 lines read as the wrong kind; 0 right answers left ungraded |
| Part said once | working | 0 parts dropped; 0 said twice unasked |
| Re-asks | working | All answerable from the board. Cards repeated word for word within two turns: stuck 6→8 (child asked), stuck 24→28 (child asked to try first), offtopic 26→28 (picture turn) |
| Second clarify on the same part | working | Stuck 64 shows it a new way: "Board par sirf do number likhe hain, par bhujayein chaar hain…" (the rectangle board labels only two sides, so this is true) |
| Hindi requests | partly | Steady 40, stuck 8 and offtopic 36 give new words under an honest "aasaan shabdon" promise. Steering 8 says "aur aasaan" and delivers a 75-word story |

**Asides**

| Lesson | Park | Return | Child said | Her reply | Rating, vs D26 |
|---|---|---|---|---|---|
| steady | — (AI line, row 36) | — | chauka | "Achha, toh tumhe chauka sabse achha lagta hai." (38) | natural; same |
| stuck | 34, park form 2, goes on into the live step | 46, alone | chauka | same frame (48) | natural; better than "Oh, chauka. Achha." |
| offtopic | AI line 8; park 24 | 32, alone; it repeats the question already answered at 9 | chauka; sixer | 10; "…tumhe sixer…" (34) | natural, but the frame is said twice |
| steering | 24 | 32, after the go-on line | chauka | 34 | natural; same |

No taste claims. Every park was returned to; no return came without a park.

**Frames repeated within 4 of her turns:**
- Steady 82/84: "Yeh kadam samajh aaya?" then "Yeh kadam saaf hai?".
- Stuck 62/64: "Yahan tak theek hai?" twice.
- Across a lesson: "Haan, bilkul theek" 9 times in steady; park form 2 three times; return form 3 three times; the reply frame 5 times.

**Board changes:** 80 turns changed the board, all in the right place. 73 turns kept it. One change was missing (offtopic 10).

**Pace:** steady reaches the end in 113 rows (D26: 117). The third skill is at class level, but its points tell the operation before the card ("60 ko 4 se baanto", row 72). Stuck reaches the second skill's first point (D26: its bridge). Offtopic reaches the second skill's third point (D26: its first point). Steering reaches the second skill's bridge (D26: the first skill's step 2).

**Two words for one thing:** "hissa" in two senses (steady 6); cm and centimetre in adjacent turns (steady 52/56); "line" and "rekha" (steering 14); "upar" as the top side and as a direction (steady 38/42).

## C. Defects

| Defect | Rows | Layer | Since D26 |
|---|---|---|---|
| Card page dropped on the AI-reply path | offtopic 10 | b | new |
| Hint written for the picture view, untrue of the board | steering 60 | a | new (rewrite) |
| Near miss on the closing question gets the key; authored hint unused | steady 108 | b | carried |
| Problem said alone, ending on "Yeh kadam…?" with no step told | steady 16, 60, 82 | b/c | new |
| Give-up after the bridge answered with the previous card's explanation | stuck 58, offtopic 54 | b | new |
| Abrupt seams | steady 2, offtopic 2, offtopic 12, steering 18 | b/c | new (C1/J1 side effects) |
| Hook alone ending on a check-in | stuck 2, steering 2 | b | new |
| Picture with no authored caption (cell part null) | steering 14 | b | new |
| Wrap ignores the child's reason; flat acknowledgement | steady 110, 112 | a/b | carried |
| Five of six remediations reuse their follow-up card's figure | 4 rows | a | — |
| Record kinds wrong ("aside", "point") | 6 rows | b | reduced |

**Gone since D26:** help over another unit's board, the model-written stop menu, stacked joints, flat replies, phantom verdicts, silence at the hook, the six-check-in run.

## D. Scores (D26 → D27)

| Axis | Score | Why |
|---|---|---|
| Listening | 4 → **4** | Every request answered, replies carry the child's word; against it, steady 108–110 and the bridge give-ups |
| Worked example | 4 → **4** | Lead-ins, two steps per turn, ends on the child's step; the third skill's example is still a recital |
| Class level | 4 → **4** | Points still name the operation before the card |
| Screen and speech | 3.5 → **3.5** | Two contradictions |
| Register | 3.5 → **3.5** | Stacked joints and the model menu are gone; fixed verdict forms and the check-in rhythm remain |
| Promises | 3.5 → **3.5** | Steering 4 says "yahi baat" and then teaches a different point; steering 8; steering 32 |

## E. Verdict

**c6 does not pass the scale gate.** Every line holds except contradictions: offtopic 10 (paging, runtime walk) and steering 60 (data, script). Listening (4), register (3.5) and promises (3.5) each reach 3.5.

The changes that would move it most:
1. Every path that poses a card draws that card's page, and a predicate checks that each card part's board matches the held page.
2. Read every hint against its posing board, not against the picture view.
3. Use the closing question's hint before giving the key, and don't end a lone worked problem on "Yeh kadam…?".

**Batch: no.** The dropped-page path is in the runtime and every topic would inherit it.

**Reversal clauses:**

| # | Count | Fires? |
|---|---|---|
| 1 | Help over another part's board: 0. Remediation boards untrue or showing a later answer: 0 | no |
| 2 | Help with nothing new: 0 (3 paraphrase the point). Keys with a wording unsaid: 1 (steady 108). Keys where a hint would have done: 1 | **yes, row 108** |
| 3 | Requests met with silence, a bare card or another part's help: 2, arguable (stuck 58, offtopic 54) | **yes if counted** |
| 4 | Steady 113 rows, 20 check-in turns, longest run 3 (82–86). I find them mildly tedious in two places: told steps and a problem alone (82–86, plus 16 and 60), and a verdict with a new point whose card waits (6, 12, 42, 52, 74, 78, each followed by a bare card). Turns of 61–75 words with a card are not too much, except steering 8 | tedious: yes (my vote) |
| 5 | Misplaced 0, two at one seam 0, abrupt 4 (steady 2, offtopic 2, 12, steering 18) | **yes** |
| 6 | Stop turns not authored: 0. Model sentences: 0 | no |
| 7 | Same remediation twice: 0. Remediation for an unshown mix-up: 0 | no |
| 8 | Hints untrue or giving numbers: 1 (steering 60) | no |
| 9 | Register 3.5. Rows by cause: (a) fixed forms 1, (b) script sentences 2, (c) verdict and why 1, (d) turn length or shape 5, (e) help 3, (f) other 8 | no |
| 10 | Reader wrong kinds 0; captions untrue or giving away 0 (1 with no authored caption); sentence about the child true | no |
| 11 | Listening 4, promises 3.5 | no |
| 12 | Script sentences: untrue 1, giveaway 0, repeated frames 2, unnatural 3 | no |
| 13 | Misgrades 0; unsaid boards 0 (4 under a literal reading of B1); contradictions offtopic 10 (paging) and steering 60 (data) | cases given |

The known item ("no place") did not occur in c6.

Scratch helpers (read-only views, nothing else written) are in /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/judge-d27/tmp-c6/