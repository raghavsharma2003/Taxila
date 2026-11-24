# c4-maths-ch06-t01 (staged), director35: fails one gate line, with 1 contradiction caused by this round's walk change

Process note: I wrote one temporary text dump of the offtopic rows into the judge-d35 scratchpad and then deleted it. Nothing else was written.

## A. Hand counts (director34 in brackets)

| Lesson | Rows | Beats | Verdicts/keyed | Unsaid boards | Contradictions | Misgrades | False keys |
|---|---|---|---|---|---|---|---|
| steady | 101 (101) | 48/48 | 37/37 (37/37) | 0 (0) | 0 (0) | 0 | 0 |
| stuck | 75 (77) | 36/36 | 21/21 (25/25) | 0 | **1** (0) | 0 | 0 |
| offtopic | 67 (81) | 32/32 | 20/20 (29/29) | 0 | 0 | 0 | 0 |
| steering | 65 (65) | 31/31 | 20/20 (21/21) | 0 | 0 | 0 | 0 |

In steady and steering, row 40 (the AI line) carries s2 e1's beat; that beat is taught at row 42.

**The contradiction: stuck row 18 (second view; walk).** The child says "screen par dikhao na". The row is recorded as `hintBoard`. But the s1 e3 card has `noView`, no picture, and a hint with no board of its own. The walk counted the card's own board as the hint's board, and that board was already on screen (`changed:false, drawn:kept`, the same 4–14 scale). Her whole turn: "4 ke nishaan se shuru karke ek-ek khaana gino, jab tak 8 khaane poore na ho jaayein. Ab tum batao, main sun rahi hoon." The gate lists "a picture request answered with nothing new drawn" as a contradiction. In director34 this same row said "Iski aur koi drawing mere paas nahi hai." and was counted 0. K2 introduced the fault.

**Not counted, listed:**
- **Steady 82, script row:** "darwaza Papa se ooncha, lagbhag 2 metre" is said over the posing board "Darwaza: 2 cm ooncha". The board shows the claim the card asks the child to fault, so I count it 0, but s3 c2 has no answer board.
- **Steady 94:** the code's `closeOffBoard` flag is on "6 sahi nahi hai.", which is said over the closing question's own board. By hand that is 0.
- **Card reasons:** sums stated over posing boards (steady 46, 54, 56, 62, 64) are allowed.
- **Worked steps:** every value is drawn. Steady 58's "260" is now said over "300 − 40 = 260 cm".

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| Board, part by part | partly | 91 changes, each at its part's first word; 55 turns held the board. Hooks are on a blank page; joints, lead-ins, bridges and the park are said over the board already up. Point and remediation boards are true, and none shows its card's answer. Picture re-asks (steady 18, steering 14) are over the picture, by design. Keys are over answer boards (stuck 42, steady 96). Fails only at stuck 18 |
| Help | partly | 0 repeated sentences. 2 new in words but the same idea (stuck 34 after 32; steering 16 after 10). 1 empty: stuck 52 answers "mujhe nahi pata" at the s1 bridge with "Ab metre ki baari hai. Yahan tak saaf hai?". 1 key with a wording unsaid (stuck 42, the four-hearings cap; c1's hint was never said, but after three "9 cm" a hint would not have done it). "Nothing easier" line: 0 |
| Turn shapes | partly | (a) 17 turns, 52–63 words, worst steady 16. (b) 4 turns, 59–65, worst stuck 4: 65 words after two "pata nahi". (c) 6 turns, 48–57. (d) 9 turns, 52–67, worst steady 22: "4 + 8 = 12 … 12 mein se kaunsa nishaan ghataoge?" (two different 12s). (e) 7 turns, 35–71, worst offtopic 36: park, then "Ab yeh kaam poora karte hain.", then a new point and card. Endings outside the list: 0. Turns over 60 words: 20 (director34: 22); over 75: 0. Offtopic 36 and steady 42 read as monologues |
| Check-ins | working | steady 3 (38, 66, 96); stuck 4 (42, 50, 52, 60; a run of 2 at 50–52, made by the child); offtopic 2; steering 2. None in forbidden places. Tedious only after the s2 remediation that stands alone (stuck 60, offtopic 48, steering 48) |
| Worked examples | working | All three asked steps are decisions. Each miss gets a "not that" line (stuck 22 "Yeh jawab nahi hai.", offtopic 12, steering 28). s1's own step is still a bare 12 − 5 |
| Short reason | working | 9 rows, all true. "kyunki 8 − 1, yaani 7 centimetre" (stuck 14) sounds clipped |
| Asides | partly | stuck park 44, return 46, reply 48 "Arre, chauka! Achha hua tumne bataya." (flat, same as director34). Offtopic 36/44/46 "Wah, chauka! Yeh batane ke liye shukriya." (flat, same). Offtopic 52 "Achha, catch pakadna! Ab poori baat samajh aayi." is odd and new: it claims an understanding the child's line does not give. Both returns are led by a verdict and read as abrupt. Every park is returned to; no taste claims |
| Pictures | partly | 5 requests. Three authored pictures (steady 18, offtopic 26, steering 14): captions true, none settles its card. Steering 16 "Iski aur koi drawing mere paas nahi hai." plus new help, picture kept: fine. Stuck 18 is the contradiction |
| Mix-ups met again | working | Each repeat gets the card's own reason, not the remediation again (stuck 38, 68; offtopic 30; steering 58). 15 own reasons, 0 misfires. K4(f) is correct at steering 8 |
| Reader, record, model words | working | 0 wrong kinds; 0 model words. Stop menu (stuck 74, steering 64) is carried; offtopic 66 gets a goodbye |
| Sentence about the child | working | "Aaj tumne darwaze ki galat unit pakdi." is true (row 81), but can be heard as "you took the wrong unit" |

**Frames:**
- The verdict reason "X se Y tak hai: Y − X = Z khaane" comes four times in steady 30–38.
- Two s1 own reasons share a frame: "10 par chabi rukti hai, par shuru 6 par…" and "9 par rubber khatam hota hai, par uski shuruaat 5 par…" (stuck 32, 38).
- "aage badhte hain" is said twice inside stuck 44.
- Forms heard: "Achha, ab Hindi mein kehti hoon." ×3; the park form ×2; the return form ×2; three back-to forms, rotated.

**Register rows by cause (20 in all):** (a) 0, (b) 1, (c) 2, (d) 11, (e) 2, (f) 4.

**Pace:** steady reaches the end. The third skill is at class level with a real worked example. Steady misses the closing question twice, gets the key with its reason and the two-turn wrap. Stuck and steering stop at the s2 worked step (as in director34); offtopic now gets that far too (director34: the s2 bridge).

## Clauses

| # | Finding |
|---|---|
| 1 | 0 unsaid boards; 0 help over another part's board. Point and remediation boards are true |
| 2 | Counts above. No ending outside the list |
| 3 | 0 requests left without help, but stuck 18's picture request is not acknowledged. Nothing-easier line: 0 |
| 4 | 0 / 1 (stuck 42, by the cap) / 0 |
| 5 | 9 rows, all true |
| 6 | steady 101 rows, 3 check-ins, longest run 1. 0 forbidden. Tedious only at the s2 remediation check-in |
| 7 | 4. All three asked steps are decisions. Keys right |
| 8 | 0 / 0 / 0. 2 abrupt seams (stuck 44, offtopic 36). Does not fire |
| 9 | 0 |
| 10 | 0 |
| 11 | 3.5. Causes as above |
| 12 | 0 wrong kinds; captions true; stuck 18 had no authored caption |
| 13 | Does not fire |
| 14 | 0 untrue, 0 giveaway, 1 repeated frame, 2 unnatural |
| 15 | Contradiction at stuck 18 (second view) |
| 17 | Stuck 18 drew the board named, but that board was the one already up |
| 18 | Own-step give-ups are helped (stuck 24, steering 30). The remediation's second wording helped at stuck 62, offtopic 58 and steering 12 |
| 19 | "Theek hai, main shuru karti hoon." does not brush the child aside, but the turn runs to 65 words |
| 20 | Not a dead turn in any lesson |
| 21 | The s2 remediation stands alone in 3 lessons and opens "Ek metre 10 centimetre nahi" to a child who said "1 metre 4 cm" |
| 32 | No picture settles its card |
| 33 | 0 |
| 40 | Abrupt (stuck 46, offtopic 44) |
| 41 | 0 |
| 45 | 1 no-picture turn (steering 16); no board change; not a refusal |
| 46 | 0 misfires |
| 47 | Clean |
| 48 | Longest runs: steady 2, stuck 3 (made by the child's own request), offtopic 2, steering 2. 9 invitations, none after a park, a reply or a question |
| 49 | Not exercised |
| 50 | The first teaching turn is heard at 63–65 words (stuck, offtopic and steering row 4) because the checker does not count the start line (known item b) |
| 54 | I count the hint board as a contradiction here, because it drew nothing new |
| 55 | Not about to get there |
| 56 | No |
| 57 | Not exercised |
| 58 | First half fine. Second half: the bridge is said again, with no easier help (1 lesson) |
| 59 | 0 |
| 61 | I count 0 values over boards that do not deny them |
| 62 | 3.5 |
| 63 | **Fires for this topic:** it passed director34 and fails here on K2 |
| 16 | **Fails; stays staged** |

## C. Defects
1. **(b) Walk, new:** the K2 hint-board path treats the card's own board as the hint's board (stuck 18).
2. **(a) Script data:**
   - The s1 bridge's easier wording is not help (stuck 52).
   - The s2 remediation's opening sentence misses "1 metre 4 cm", and the remediation stands alone on a check-in (3 rows).
   - s3 c2 has no answer board.
3. **(c) Reply rendering and frames:** flat or odd aside replies (offtopic 52 is new); returns after a verdict with no joint; go-on lines stacked in stuck 44.
4. **(d) Harness or child:** none found.

Gone since director34: the "260" near item, the side-door repeats, the old record labels. Also gone, as a regression: the honest no-picture line at stuck 18.

## D. Scores
- Listening 3.5 → 3.5
- Worked example 4 → 4
- Class level 4 → 4
- Screen and speech 4.5 → 4
- Register 3.5 → 3.5
- Promises 3.5 → 4

## E. Verdict
**c4-maths-ch06-t01 does not pass the scale gate.** It fails one line: 1 contradiction at stuck 18, caused by the walk and introduced by K2 this round. Every other line holds, and every axis is at 3.5 or above: listening 3.5, register 3.5, promises 4. It stays staged under clause 16, and clause 63 counts it.

Changes that would move it most:
1. In the walk, a hint should own a board only when that board differs from the one up; otherwise she says the no-picture line and the hint in words. Separately, author a picture for s1 e3.
2. Write the bridges' easier wordings so they re-teach the skill just closed. Cut the s2 remediation's opener so it fits one turn with its follow-up card.
3. Send the aside reply or park straight to the card's question, and cap the start turn at 60 words including the start line.

Would I put it in front of a child? **Not on this runtime**, because a "dikhao" can go unheard. Yes after change 1; the script itself is sound.

What a child or parent would still notice: thin aside replies, and long first turns given to a child who has just said "pata nahi".