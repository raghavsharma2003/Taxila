# To Learning 018: director29 judged; captions against the view drawn, lines written to be said

Judgement and decision: `docs/design/round7/judgements/director29-2026-11-18.md` (`dc-r8-director29`). Reports with rows: `evals/hybrid-side-by-side/results/2026-11-18-director29/judges/`. Built by an agent run from the main loop. Scope: the four pilots. Brain 045 builds the walk's side at the same time.

017 held: no point's or remediation's board shows its card's question (0 in all four topics, from 24); the fit limits; nine of twelve asked steps are deciding steps; no quick question. What the judges found is mostly a cost of the cuts: lines shortened until they read as notes.

**The rule this order adds: said beats fitted.** A line is written as a teacher would say it. Where a remediation cannot be said in full sentences inside 49 words with its card, leave it whole: the walk says it alone and it ends on its check-in. List each one.

## A. Captions (the checker enforces both)

1. **Every `viewCaption` is true of the view that is drawn for its board.** `tests/r8-picture-turn.test.mjs` and `server/stagecraft/board-first.js` `pictureTurn` give the view a board gets. Named: c5-t02 skill 1 worked example: the board is now bars, its second view is wholes, and the caption still says "0 se 1 ki number line… line ke upar 8 barabar gap, line ke neeche 2" (stuck 18). Read every caption of the four scripts against its view; the checker gains a rule that fails a caption naming a line, a strip, a circle or a grid when the view drawn is another kind.
2. **A worked example's caption names no asked step's answer, in words or digits.** c6 skill 1: "…8 m, 9 m aur 14 m, ek ke baad ek" before "teeno par?" (stuck 18). c5-t01 skill 1's caption "all but points at 1/4" (stuck 18). The checker's `keyHit` reads digits only: extend it to the key's words and to the accept forms.
3. **`answerViewCaption` for every follow-up card and every check** whose answer board has a second view: what to look at in the answer board's picture, said after the answer is known (it may name the key). Brain 045 says it when a child asks for a picture after a key. Where the answer board has no second view, write none; the checker lists which.

## B. Lines written to be said

- **Remediations that read as notes** (cut to fit by 017): c5-t02 "Do patti, 3 aur 9 barabar hisson mein. 3 wali ka ek hissa 9 wali ke teen jitna; 9 wali ke 2 usse chhote." and the two others its judge names; c5-t01 "Train ka number ek fraction: upar gine gaps, neeche 5…" (steady 84) and the s2 count-marks remediation, which no longer speaks to a child who said "1st mark" (steady 52). Read every remediation of the four scripts aloud; rewrite the ones that are notes.
- **Short reasons:** c5-t01 "0 se 1 ke 3 gaps; 1/3 isi line par" (steady 12, stuck 10) and "har 2 gap se ek poora, toh 4 gap = 2" (steady 72); c4 s3 e2 "kyunki 1/4 wala tukda 1/6 wale se bada hai" (says the answer as its own reason, steady 70).
- **c4:** the joint "Ek naye tareeke se socho." before a remediation that opens "Socho, …" (steady 6, steering 6): the part-part remediation opens another way. The s3 worked example's asked step "6 chhote tukde, bade tukdon par barabar rakhne hain. Unke kitne group banaoge?" reads back a given and is unnatural; its problem says "ek jaisi" and "ek jitni" for one fact. s2 e2's card asks the child to regroup 6 groups into 3, which the point never shows.
- **c5-t01:** s3 e2's point says "6/4 1 ke aage hai", which answers the s3 worked example's asked step two turns later; that asked step also repeats e1's question frame. "ek taraf… doosri taraf" against "upar / neeche"; "line" against "patti" in captions; "km" against "kilometre".
- **c5-t02:** S3's asked step "Dono ne 2-2 hisse khaye; ab faisla kaun karega, ginti ya hisse ka size?" gives its answer in its premise; S2's own step is trivial once "5 khaye, Raju ne 3" is told. S2 c2 and S3 c3 ask about the size of the missing part, which no point teaches: teach it in a point of that skill, or change the cards. S2 e3's point leaves its card little to do. "Toh poora jawab:" is the walk's form; leave it. A dangling "Par" when the e4 card is returned to alone (offtopic 52): give the card a `reask`.
- **c6:** the hook fragment "Ab triangle par."; points that change figure with no opening word (s2 e3 the square, s3 e3 the plot: steady 48, 74, stuck 70, offtopic 44, 76, steering 50); s3 e1's mix-up (a square's side taken as half the perimeter) is routed to the rectangle remediation and the talaab card (offtopic 66); the s3 frame "aadha… usme se… bache" three times; the s1 asked step is a near-giveaway two-way choice.
- **Worked examples, all twelve:** a fact is not said twice between a step's told line, the child's own step and the close (c5-t02 steady 60, 78, offtopic 64; c6 steady 26, 60, 80; c4 steady 58).
- **The two dense turns:** c4 s1 e4's point and card (75 words with 2/3, 1/8 and 1/5: stuck 20); c5-t02's number-line points with their cards (67 to 73 words: steady 68, 70). Cut the point, not the card's givens.

## C. Joints and forms

1. `joints.startAnyway`, three forms of six words or fewer: said after a child's second "pata nahi, aap batao" at the greeting, before the hook. It takes the child's request up ("Chalo, main batati hoon.") and asks nothing.
2. The park forms: each either leads back itself ("…, pehle yeh kaam poora karte hain.") or is followed by a joint the script names. Decide one way for all four scripts and say which in `docs/status/learning.md`; Brain 045 builds to it. Named as abrupt: "Cricket ki baat bhi karenge, bilkul." straight into a point (c5-t02 steady 40).
3. The wrap's acknowledgements fit what the child said in none of the four steady lessons ("Kuch baatein aasaan thi, kuch mein mehnat lagi." in reply to "achha laga"). Rewrite the three `wrap.ack` forms so each can follow any remark a child makes about her own work, and the line said after the "how was it" answer so it can follow both "achha laga" and "mushkil tha".
4. The after-key return: "Is tarah ka sawaal dobara milega, abhi pehle wale sawaal par wapas chalo." reads stiff in c5-t01 (steering 16); "Yeh baat phir milegi; tab tak pichhla sawaal ek baar aur dekhte hain." reads as a person. Bring the stiff forms to the second one's register.

## Done means

`node scripts/lesson-scripts/check.mjs <topic>` passes on the four scripts with the new caption rules; the compile report shows no new hole on the pilots (`startAnyway`, `answerViewCaption` will show on the staged scripts); `node --test tests/r7-board-ref.test.mjs tests/r8-learning-*.test.mjs tests/r7-learning-*.test.mjs tests/r8-picture-turn.test.mjs tests/r8-card-stated.test.mjs` pass (repin where a line changed, keeping the rule each test protects, and say so). `docs/status/learning.md` lists: every caption changed and the view it was read against; every remediation left whole and why; every changed sentence with the judge's row; every new key with its blind solve.
