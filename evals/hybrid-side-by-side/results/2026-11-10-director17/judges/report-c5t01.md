# c5-t01 (c5-maths-ch02-t01): director17 judge report

## A. Hand counts

| Lesson | Beats (distinct · turns) | Verdicts | Contradictions | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|
| steady | 27/27 · 41/44 | 19/19 | 2 (row 18 second view; row 88 paging) | 0/0 | 0 |
| stuck | 18/18 · 32/36 | 16/16 | 1 (row 18 second view) | 0/0 | 0 |
| offtopic | 18/18 · 33/35 | 17/17 | 2 (row 28 second view; row 70 paging) | 0/0 | 0 |
| steering | 18/18 · 31/33 | 15/15 | 1 (row 66 paging) | 0/0 | 0 |
| **D17** | **81/81 · 137/148 (93%)** | **67/67** | **6 (paging 3, second view 3, held cost 0)** | **0/0** | **0** |
| D16 | 73/74 · 127/133 | 65/65 | 0 | 0/1 | 0 |

- **Second view (3).** When the child asks for a picture at e2, the extra view draws its second bar as "1 equal parts, 0 shaded = ?". The board beside it shows 8 gaps below the line, and her line follows the wrong bar: "2 barabar bar: ek 4 barabar hisson mein, 1 rangin (1/4); ek 1 barabar hisson mein".
- **Paging (3).** On the break turn, the next skill's e1 board goes up without being said. Steady 88 shows 4/4 on a 0–2 line. Offtopic 70 and steering 66 show 2/3.
- **Turns that taught nothing.** Parks with no card open (steady 36, steering 24), aside-only lines (steady 42, stuck 38, offtopic 20), verbatim repeats (stuck 10, 12) and the break turns.

## B. v6.8 items

| Item | Rating | Evidence |
|---|---|---|
| Held board | Partly | 61 turns had a board change; 58 were in the right place. 82 turns held the board. Every spoken part sat on its unit's board. The 3 breaks are the break turns above. Hindi, clarify, aside and picture turns held the board. |
| Held cost | Working | 0 counted. 7 cases are thin but still followable. "Beech wala nishaan ab bhi 1/2 hai" is said over an unlabelled middle tick (steady 20, stuck 20 and 24, offtopic 30, steering 40). "Teesra hop theek 1 par…3/3 = 1" is said with no hops drawn (steady 54, stuck 62). All 5 remediations were true of their then-card board. |
| Picture requests | Partly | 4/4 drew a view beside the held board. Steering 14 (sixths and sevenths) was right. 3/4 were wrong in the way described in A. Every picture line has no full stop before the card and reads "(1/4)" aloud. |
| A4 | Working | 4/4 aside questions ended her turn with no card posed or pinned. 4/4 next replies were not graded, even when the child sim answered the unsaid card (steady 43 "ek bata das", stuck 39, offtopic 21, steering 27). The card was then said aloud. The acknowledgement ignores what the child said: "Achha, yeh jaankar achha laga" is the reply to "1/11 m". |
| G1 | Working (sign case not exercised) | 0 misgrades. Accepting "1/4" for 1/4 km and "1/12" for 1/12 m is correct. |
| V1″ | Working | Every card keeps its "?". Hooks are statements, and her model copy of the hook never appears. |
| B1‴ | Partly | Hindi fully honoured 1/4: steady 38 switches to "rekha/nishaan/bhinn" and keeps it. Partly honoured 2/4: offtopic 34 gave the simpler; steering 8 reworded the point but left "line" in the card. Failed in stuck 10: rows 6, 10 and 12 are word for word the same, and "aap batao" (row 11) got no key. No closed card was reopened. The greeting's "pata nahi" did not carry over. |
| R5 | Partly | Check-ins now have 5 forms (samajh aaya 8, theek 5, saaf 4, poochna 3, kadam 2). Every worked close says its why once. There is no "Ab agla kadam" after a remediation. "Aage chalo" never got the stop menu (3/3), but in steady 42 it got the cricket return instead of moving on. Faults: "Toh poora jawab" after a miss (stuck 46), and "Ab agla kadam" after a point (steady 20). |
| H5 | Not working | It flagged 4 rows: steady 18, stuck 18, offtopic 28 and steering 14. Steering 14 is a false flag, because `cardAsAlt` fires on every picture turn. It missed the 3 break-turn pagings. `partOffBeat` fired on 48 close-then-switch turns that were all correct (outside the count). Steady 70's `contradictionsV6` is a false flag. |
| D11 | Working | The "naam" contradiction is fixed. 1/12 m caught the trap: stuck said "1/11 m" 3 times. 1/5 vs 1/6 is natural for class 5. The worked board's "2/5" target writes no point, so it gives nothing away. None of Learning's four watch items apply to this topic, which has no bar-compare cards. |
| Carried over | Hold, 1 regression | Asides lost: 1 of 6 ("likh li hai", offtopic 32, never returned; the same as D16). P5, K1, K3, K4, Q1, L1, F1′ and F2 hold. |

**Frames**
- Verdict openers: 0 repeated in the same form within 4 of her turns.
- Repeated within 4 turns:
  - "Is sawaal ka / Iska jawab X tha": stuck 44→50 and 66→70; offtopic 24→30, 44→46 and 60→64.
  - ", kyunki": used 42 times.
  - The same card said 4 times in a row: stuck 6–12.
- Variant forms:
  - right: "Haan, sahi hai", "Bilkul sahi", "Haan, bilkul theek", "Sahi jawab";
  - wrong: "Nahi, yeh jawab nahi hai", "X sahi nahi hai", "…theek nahi baitha", "…se baat nahi bani", "Abhi yeh sahi nahi hai".

**Asides**

| Aside | Park | Return |
|---|---|---|
| steady sixer, row 35 | 36, "is sawaal ke baad" with no card open | 42, a question (it overrode "aage chalo") |
| stuck "aapko Virat pasand hai?", row 37 | answered at 38: "meri apni koi pasand nahi hoti" | — |
| offtopic sixer, row 5 | 6 | 14, on time |
| offtopic Virat, row 19 | answered at 20 | — |
| offtopic sixer repeat, row 31 | 32, "likh li hai" | never |
| steering cricket, row 23 | 24, with no card open | 26, on time |

- No taste claims.
- The returns ask "usmein tumhe sabse achha kya lagta hai?" but never mention the sixer.

**Hints after wrong answers.** 33/33 escalated correctly, and every posed card ended with its key or why said. Two problems:
- Steady 84's hint lost its first sentence, leaving only "Matlab ek poora abhi bhara nahi".
- Offtopic 24 gave the key ("jawab 1/12 m tha") after the child said "maine bata diya". The child had in fact said it, at row 21.

**Turns over 60 words: 7.**
- Tutoring: steady 20, stuck 20, steering 8.
- Monologue: steady 86, stuck 66 (a key, a new point and a card, said to a struggling child), offtopic 14 and offtopic 30.

**Pace.**
- Steady and offtopic stop where they did in D16.
- Stuck reaches the s2 worked problem; D16 stopped at s1 c3.
- Steering reaches the s2 bridge; D16 stopped at the s1 worked problem.

## C. Defects

| Defect | Rows | Layer |
|---|---|---|
| Wrong e2 second view: a bar in "1 equal part" **(new)** | steady 18, stuck 18, offtopic 28 | b (Studio held-alt) |
| A break turn pages an unsaid next card **(new)** | steady 88, offtopic 70, steering 66 | b |
| Hindi gets the same text again; "aap batao" gets no key | stuck 6, 10, 12 | b |
| "pata nahi" at a check-in serves the simpler before the card is posed, which gives the answer away | steady 6, stuck 6, steering 6 | b |
| Clarify re-says the point word for word | steady 8, stuck 8 | b |
| The aside acknowledgement ignores what the child said **(new)** | steady 44, stuck 40, offtopic 22, steering 28 | c |
| Picture-line rendering (parentheses read aloud, no full stop); truncated simpler | all 4 picture turns; steady 84 | c |
| "is sawaal ke baad" with no card open; "likh li hai" never kept | steady 36, steering 24; offtopic 32 | b |
| The child sim answers cards before they are said | steady 43, stuck 39, offtopic 21, steering 27 | d |
| H5 blind to boards that change on turns with no spoken part | as above | d |

**Gone since D16:** silent pins, the minus-sign misgrade, the "naam" contradiction, "Ab agla kadam" after a remediation, the reopened closed card, and two-form check-ins.

## D. Scores

| Axis | D16 → D17 | Why |
|---|---|---|
| Listening | 3 → **3** | A4 fixed; Hindi honoured 1/4; "pata nahi" handling gives the answer away; acknowledgements ignore the child |
| Worked example | 4 → 4 | Problem said once; steps on the board; why said once |
| Class-level | 3.5 → 3.5 | The held board cost nothing; s3 still untaught |
| Screen and speech | 4.5 → **3.5** | 6 contradictions, 3 of them the same broken picture |
| Register | 3.5 → 3.5 | Held; the picture line and the acknowledgement sound like templates |
| Promises | 3 → **3** | "likh li hai" broken; stuck's "ab Hindi mein" broken |

## E. Verdict

**c5-t01 does not pass the scale gate.**
- **Passes:** beats (93%), verdicts (67/67), misgrades (0) and false keys (0).
- **Fails:** contradictions (6) and the axis floor.
- **Listening and promises stay at 3**, below 3.5. **Register holds at 3.5.**

The blockers are in the runtime walk and Studio's second view (b), plus rendering (c). The changes that would move it most:
1. Hold the board through break turns.
2. Rebuild the second view for compare boards from the board itself, without inventing a 1-part bar.
3. Route Hindi, "pata nahi" and clarify through one response table: reword the live part, and never serve the simpler before the card.

**30-topic batch: no.** These faults are in the runtime and would repeat in every topic.

**Reversal clauses:**
1. Held cost is 0 (7 thin but followable). Neither axis fell below 3.5. **Not triggered.**
2. Listening is 3, so **triggered**. The request and beat-kind pairs that failed:
   - Hindi × an explain card;
   - give-up × an explain card after a Hindi request;
   - "pata nahi" or "samajh nahi" × a check-in after a point;
   - clarify × a point;
   - "aage chalo" × a closed check;
   - "maine bata diya" × a card the child answered before it was posed;
   - "haan" × "Kuch poochna hai?" (steering 34).
3. 0 misgrades. **Not triggered here.**
4. H5 missed 3 of my 6 and raised 1 false flag. **Triggered by this topic alone.**