# c5-t01 (c5-maths-ch02-t01), director35: judge report

**c5-t01 passes every line of the scale gate.** No safety turn fired. `D35/scripts` does not contain this topic's script, so I read `data/lesson-scripts/c5-maths-ch02-t01.json` at the run's commit 6f56fc8b7 (the tree is clean).

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid boards | Misgrades | False keys |
|---|---|---|---|---|---|---|
| steady (97) | 48/48 | 38/38 | 0 | 0 | 0 | 0 |
| stuck (67) | 32/32 | 19/19 | 0 | 0 | 0 | 0 |
| offtopic (89) | 43/43 | 36/36 | 0 | 0 | 0 | 0 |
| steering (53) | 25/25 | 17/17 | 0 | 0 | 0 | 0 |
| **D35** | 148/148 | 110/110 | **0** | **0** | 0 | 0 |
| D34 | 146/146 | 112/112 | 0 (row 78 borderline) | 0 | 0 | 0 |

**The meter's false key is wrong.** Steady row 94 is logged with `falseKeys: 1` (`statedFalse ["2/7"]`). She says "9/7 aata hai, yaani 1 aur 2/7", which is true. The meter read the "2/7" in "1 aur 2/7" as a value on its own. This is a harness fault (layer d).

**K1 values stated but not drawn.** None of these is denied by its board, and none is a contradiction:
- "jo 2/3 ke barabar hai": steady 60, offtopic 70
- "yaani 1 aur 5/6": steady 84
- "jo 1 aur 3/5 hai": steady 90
- "1 aur 2/7": steady 94
- "4 gap chalkar tum 4/5 par ho", said over a board in thirds: steady 44, offtopic 52

Every worked-step value is now drawn. Steady 78 ("7/4 ka mark 1 aur 2 ke beech") is said over its result board, which reads "4/4 = 1, 7/4".

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D34 mechanisms | mostly gone | **Gone:** the no-picture dead end (steering 16 now gives a new wording), the row-78 value, "doosri taraf" (18 → 0), "Suno," (0), the "achha lagta hai" slip, cards with no re-ask. **Reduced:** help that misses the mistake, 1 row (steering 12). **Still there:** the deaf wrap reply (steady 96). |
| Boards, part by part | working | I checked every `pageParts` start against the screen pages and found 0 mismatches. 103 turns change the board and 39 keep it. Every lead-in, park, backTo and bridge is said over the board already up. Every point and remediation board is true of its words and shows nothing its card asks. |
| Help | partly | **Nothing new: 1** (steering 20, where everything was spent). **Same idea in new words: 3** (steering 10 and 16; stuck 40). Keys with a wording still unsaid: 1 borderline (stuck 24). |
| Turn shapes | working | (a) 12 turns, 61–65 words. (b) 4 turns, 58–63. (c) 15 turns, 51–60. (d) 7 turns, 59–70. (e) 5 turns, 38–73. The question is always last. Endings outside the allowed list: 0. |
| Check-ins | working | 3 / 2 / 2 / 2. Longest run 1. None within a skill, after an aside, or inside a worked example. |
| whyShort | working | 13 rows, all true, e.g. steady 74 "Do gap ek poora hain, toh 4 gap 2 poore." |
| Worked examples | 3.5 | **s1** asks a real deciding step: "3 khambe raaste ko kitne barabar gaps mein kaatte hain?" **s2** asks a two-way recall: "kaunsa number … ginta hai: 2 ya 5?" **s3** asks recall of 4. Each own step needs thought. |
| Asides | working | Replies are better than D34's: "Wah, batting! Toh tumhara favourite yahi hai." (steady 42); "Oho, batting! Isi mein tumhe maza aata hai." (offtopic 50); "Achha, toh tumhe batting pasand hai!" (stuck 46). One return question is odd: steady 40 asks "cricket ke baare mein tumhe kya pata hai?" of a child who said she hit a six. |
| Pictures | working | 5 picture turns (steady 18; stuck 18; offtopic 26; steering 14 and 16). Every caption is authored and true. Steering 16 says "Iski aur koi tasveer mere paas nahi hai." and follows it with a new wording; the board is not changed. |
| Hindi | working | The form is used where the card has one (steady 38, stuck 8, offtopic 32). Steering 8 has no Hindi form and gets the easier-words line; that promise is kept. |
| Stop path | working | Offtopic 88 and steering 52 get the authored stop menu. Stuck 66 gets the authored goodbye. Model-written words: 0. |
| Wrap | partly | Row 94's verdict gives its reason. Row 96 answers "thoda mushkil tha" with "Theek hai, samajh gayi.", the same as D34. The sentence about the child is true and uses s3 c2's `did` (answered right at the first try, row 83). |

**Frames:**
- "…sahi nahi hai" is said 10 times in offtopic, three of them within four turns (rows 66, 72, 74).
- "Tumhari baari:" (steady 78) is followed straight away by "Chalo, ab tumhari apni baari." (steady 80).

**Pace:** every lesson has the same row count as in D34. The third skill (7/4 = 1 3/4, 12/5, 9/7) is taught at class level.

## C. Defects

| Defect | Rows | Layer | Since D34 |
|---|---|---|---|
| s1 rem2's follow-up-card hint all but says 1/6: "upar wala number 1 … neeche wala … saare gaps" | steady 8, steering 8 | a | not flagged before |
| The second miss on "6 kilometre" gets the ruler `sayAlt`, which does not touch the mistake | steering 12 | a/b | reduced |
| The key at an own step is said without its reason: "Iska jawab hai … 1/4 kilometre door hai. Yahan tak theek hai?" | stuck 42 | b/c | new |
| The four-hearings cap's key says the value twice: "jawab 1/6 kilometre par hai, kyunki … toh 1/6 kilometre par" | steering 18 | a/c | new |
| Step 1 is told while the worked example's `simpler` is still unsaid; that wording is later spent on a step already told | stuck 24, 40 | b | new |
| The close drops the child's "dhai sau metre" | steady 26 | c | new |
| The wrap reply is deaf to the child | steady 96 | c | carried |
| Meter false key; harness child's wrap reply | steady 94, 95 | d | new / carried |

## D. Scores (D34 → D35)

| Axis | Score | Reason |
|---|---|---|
| Listening | 3.5 → **3.5** | Asides improved; wrap and close still deaf |
| Worked example | 3.5 → **3.5** | Only s1 asks a real deciding step |
| Class level | 4 → **4** | |
| Screen and speech | 4.5 → **4.5** | |
| Register | 3.5 → **3.5** | Causes: a 3, b 1, c 3, d 8, e 4, f 1 |
| Promises | 4 → **4** | |

## Clauses

- **(1)** 0 / 0 / 0 / 0. No point or remediation board shows what its card asks.
- **(2)** Shapes as in B. Dense, but not too much in one breath. Endings outside the list: 0.
- **(3)** One request answered without help: steering 20, where the "nothing easier" line is true because everything was spent. I find it cold for a child who has just said "aap batao", and I vote for the key's reason in new words after it.
- **(4)** Nothing new: 1. Keys with a wording unsaid: 1 borderline (stuck 24). Keys where a hint would have done: 0.
- **(5)** 13 short reasons, all true.
- **(6)** Steady has 97 rows, 3 check-ins (rows 34, 68, 86) and a longest run of 1. The check-ins are not tedious.
- **(7)** Score 3.5. s1 asks a deciding step; s2 and s3 ask recall. Keys are right. Offtopic 16 uses "Nahi, yeh nahi hai."
- **(8)** 0, 0, 0, 0. One abrupt seam (steady 40).
- **(9)** 0.
- **(10)** One hint states the answer's numbers (s1 rem2 `then.simpler`).
- **(11)** Register 3.5; causes as in D.
- **(12)** Wrong kinds: 0. Captions: all fine. The sentence about the child is true.
- **(13)** Listening and promises do not fall below 3.5.
- **(14)** Untrue 0, giveaway 1, repeated frame 1 ("ek hi gap chala" three times in steering 8, 10, 16), unnatural 2 (steering 18, steady 40).
- **(15)** None.
- **(17)** Every picture turn drew the board it named.
- **(18)** Stuck 20's step wording does not slow the child. Steering 12's second wording is one more thing between the child and the answer.
- **(19)** Stuck 4 says "Chalo, main batati hoon."; steering 4 says "Achha, pehle main dikhati hoon." Neither brushes the child aside.
- **(20)** Not a dead turn.
- **(21)** One remediation said alone (steady 86). It reads as a teacher talking.
- **(32)** Strips are drawn as the second view; nothing settles a card.
- **(33)** 0.
- **(40)** Neither return is abrupt; steady 40's question is odd.
- **(41)** Turns of 66 words or more: 0.
- **(45)** No board changes inside the turn, and I do not hear a refusal.
- **(46)** 18 own reasons, each after its named answer.
- **(47)** None over a "?". Steady 78's result board shows 7/4 three ticks past 1, but it is replaced before the child's own step; borderline, not fired.
- **(48)** Longest run 2, or 3 only through the Hindi exception (stuck 4–8). Invitations 1/5/1/2, none misplaced.
- **(49)** Promise kept.
- **(50)** One sentence the cold read should have caught: the s1 rem2 hint, in pass 5.
- **(54)** Steering 16: no hint board existed, so nothing to count.
- **(55)** Steering 18: the cap's key came after the child's third "6 kilometre"; she was not about to get there.
- **(56)** No.
- **(57)** Not fired.
- **(58)** Not exercised.
- **(59)** 0.
- **(60)** Passes: run two of two.
- **(61)** 0.
- **(62)** Register is 3.5 again here.
- **(63)** No.
- **(53), (16)** Not this topic.

## E. Verdict

**c5-t01 passes every line of the scale gate**: 0 contradictions, 0 unsaid boards, 0 misgrades, 0 false keys, and every axis at 3.5 or above. Listening is 3.5, register 3.5 and promises 4. **Would I put it in front of a child? Yes.** The board and her words agree on every part.

The changes that would move this lesson most:
1. Make the closes and the wrap carry the child's own words: "dhai sau metre", "ek aur ek bata paanch", "thoda mushkil tha".
2. Rewrite s1 rem2's ladder for "6 kilometre": a hint that does not give the answer, and a second wording about counting gaps rather than the ruler.
3. Fix how a key is said: give the reason at an own-step key (stuck 42), and stop saying the value twice (steering 18).

**What the gate does not measure:** a child who says "250 metre" or "1 aur 1/5" is never told that this is the same as 1/4 or 6/5. "Thoda mushkil tha" gets "samajh gayi". A stuck child hears "aasaan shabd mere paas nahi hain" just after asking "aap batao".