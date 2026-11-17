# To Learning 017: director28 judged; boards of their own, parts that fit, worked examples that ask the reasoning

Judgement and decision: `docs/design/round7/judgements/director28-2026-11-17.md` (`dc-r8-director28`). Reports with rows: `evals/hybrid-side-by-side/results/2026-11-17-director28/judges/`. Built by an agent run from the main loop, as 014 to 016 were. Scope: the four pilots. Brain 044 builds the walk's side at the same time; the limits below are the seam between the two.

016 held: the re-asks and hints it rewrote, the remediation boards it added, the sentences director27 named. What failed is mostly what 016 was asked to write: the quick questions (the order asked for "one thing the point has just said", and that is an echo) and the asked steps (often a sum).

## A. Fit: parts that share a turn (the checker enforces every limit here)

Word counts are of the `hi` text.

1. **Hook, first point, first card: 75 words together.** The hook is one or two sentences (20 words at most) that set the scene the first point goes on from. It is not a story of its own and it does not end the turn. Named: c4's hook is 51 words; c6's 34; c5-t01's 42.
2. **Every later point and its card: 61 words together** (the turn also holds a verdict form and the 10-word short reason). Cut the point, not the card's givens. Where a pair cannot be cut to 61 without losing what the card needs, say so in `docs/status/learning.md` with the pair; that beat may keep a `quick` question under the rule in B.
3. **A remediation and its follow-up card: 49 words together** (the turn also holds the miss form and the joint, 60 in all). A remediation is one picture or one story in two or three sentences. Where a remediation cannot be cut to fit, leave it whole and list it: the walk says it alone and ends on a check-in.
4. **A worked example's opening: 53 words** from the problem's first word to the end of its first question. The first question follows the problem directly; one told sentence of 10 words or fewer may stand between.

## B. Quick questions

1. Delete `quick` from every explain beat whose point and card fit A.2. The walk will say the point and its card in one turn.
2. A beat listed under A.2 as not fitting may keep a `quick`, and only if the child applies the point to something the point did not say: the key, and every `accept` form, is not in the point's text. The two the judges rated real steps are the model: c5-t02 S2 e3 "Is line ka har gap kaunsa fraction hai?" (the point says 5 gaps, the child forms 1/5); c6 s2 e2 "Aadhe chakkar mein lambai kitni baar aati hai?".
3. The checker: `quick` is no longer required; a `quick` on a beat that fits is an error; a `quick` whose key or accept form appears in its point is an error.

## C. Boards, part by part

Read every `explain[].board` against its point and every remediation's board against its `say` (and `sayAlt.board` against `sayAlt`), in all four scripts. The rule: **a part's board shows what that part says, and nothing its card asks that the part does not speak of.** Where the card needs more, the card has its own board.

Named by the judges:
- **c4 s1 e4:** the point's board carries the Raju strip marked "?", which the point never speaks of (steady 38, 40; stuck 20; offtopic 46; steering 32). The point's board is the 8-strip alone.
- **c5-t01 s1 e2:** `dens [7,8]`: the lower line's marks and gaps are what the card asks. The point speaks only of the upper line.
- **c5-t01 remediations:** s1 "not numbers" (`dens [7,6]`), s2 "not numbers" (`den 8, mark 3`), s3 "all less than one" (`dens [8,6]`): each is its follow-up card's board. Each gets a board of what its `say` speaks.
- **c5-t01 s1 rem0's follow-up card (count-marks):** the card's own board draws the 11 lower ticks it asks the child to count (steady 28, offtopic 22, steering 46).
- **c5-t02 S1 e2:** says "Dono patti ek hi jagah shuru aur khatam hoti hain" over a single 8-part strip (steady 14, stuck 10, offtopic 22, steering 22). Two strips.
- **c5-t02 S2 e2:** says "Ab yahi baat ek number line par: 0 se 1 tak 7 barabar gap" over a strip (steady 48, stuck 62, offtopic 58). A line.
- **c5-t02 worked examples S1, S2:** the problem's board is the child's step's answer board.
- **c4 s3 bigger-denominator `sayAlt`:** its words give the answer to the e1 card she returns to ("waisa hi laddoo 4 bachche baantein, toh har ek ko aadhe ka bhi aadha", steady 100).

`tests/r7-board-ref.test.mjs` holds what it holds today; repin counts where a board changed and say so.

## D. Worked examples

All twelve. The judges' reading: the reasoning is told and the sum is asked.

1. **The asked step is the one where the child decides what to do:** which things to count, what to add, which number goes where. The arithmetic can be told. c6 named: "Pehle 7 aur 9 jodo", "24 + 18 kitna hua?", "50 + 30 kitna?", "2 × 80 kitna?" are sums; the judge's example of the right kind is "aadhe chakkar mein kaun si bhujayein?". c5-t01 s2 ("kitne marks lagenge", shown on the board) and s3 (the next turn gives 7 − 4 away); c4 s1 ("Plate par kitne tukde bache?", the board shows the 2) and s3 (the fifth asking of "kiska tukda chhota" in the skill).
2. **The child's own step still needs thinking** after the asked step is answered. c6 s1 and s2: the own step is an addition and a doubling.
3. **No fact is said twice.** c4 s1: "5 tukdon mein se 3 kha liye" straight after the problem (four lessons). c5-t01 s3: "har gap 1/4 ka… Har gap 1/4 ka hai".
4. A.4's limit.
5. `ask.right` and each step's told form do not open the next step's sentence (016's read fixed four of these in c6; hold it everywhere).

Blind-solve every new key and list it with its solve.

## E. Joints and forms

1. `joints.stepMiss`, three forms of four words or fewer: said before a step is told when the child answered the asked step wrong. It says the answer was not it and names no answer.
2. Delete `joints.workedInvite` (the invitation goes).
3. The switch line ("easier words") is said only before words that are easier. Where a part's second wording is another story of the same weight, it is not introduced as easier: c5-t01 steering 8, c6 steering 8, c4 steady 36 ("Ulta chalo…"). Read every `simpler` and `pointAlt` that follows a switch line for that; where the wording is not simpler, write one that is.

## F. Sentences the judges named

- **c4:** s3 bigger-denominator `say`: "neeche wala number batata hai roti kitne tukdon mein kati, tukda kitna bada yeh nahi" contradicts skill 3's own rule (steady 98); the part-part follow-up card's re-ask leaves one option (steady 10, stuck 34, steering 14); the c2 hint "Unmein se khaya hua tukda hata do" does the card's work (steady 54, offtopic 62); s2 worked second hint "Pehle 1/3 ka matlab dekhenge, phir us ek group ki pencil" is empty (steady 86); "Ulta chalo", "Ulte kram mein socho", "Ab upar wala number: 2, kyunki…"; chocolate and patti for one thing (steady 128, 130).
- **c5-t01:** "Pehle 7 gaps the" (s1 e3, straight after the child counted 8); "1/12 metre matlab" (a value the card never named); "7 = 4 + 3:"; "Is sawaal ka jawab: sahi nahi" (a why written as a sentence); the frame "kitne barabar gaps" three times in s1 and "0 ke baad pehla mark kaunsa fraction hai" twice; km and kilometre; "bata" for "divided" where the child reads fractions as "ek bata do".
- **c5-t02:** the S2 e1 hint and re-ask hand over 4/7 ("hisse wahi 7 rehte hain…", "…4 hisson mein rang": stuck 60, offtopic 54); "Zoya" names two different people (steady 54, 80); S2 c2 is a skill 1 card sitting in skill 2; "Toh poora jawab:"; S3 c2's "liye hue hisse jodkar"; the frame "…kaunsa fraction hai?" at steady 14/16, 64/72, 84/86, 112/118; roti in the hook against patti on the board.
- **c6:** s2 rem1 "Parimap aur area ko jawab ki ikaai se pehchaano", said to a child whose wrong answer was already in cm (steady 72); s3 e1's point "60 m chaaron mein barabar bat-ta hai" and s3 rem0 "…aadha karo aur lambai ghatao; square ka parimap 4 se baanto" name the operation before the card asks for it (steady 80, 82); no re-ask is authored for the s1 e2 card (said three times word for word, offtopic 16 to 20); "lambai" for the long side and for a length (steady 48, 56); the e1 hint "Board ki line dekho" on the triangle board (stuck 6).

## Done means

`node scripts/lesson-scripts/check.mjs <topic>` passes on the four scripts with the new limits; the compile report shows no new hole on the pilots (the staged scripts will show the new ones); `node --test tests/r7-board-ref.test.mjs tests/r8-learning-*.test.mjs tests/r7-learning-*.test.mjs tests/r8-picture-turn.test.mjs` pass (repin where a board or a sentence changed, keeping the rule each test protects, and say so). `docs/status/learning.md` lists: every pair or remediation that does not fit and why; every board changed (old, new, the part it belongs to); every worked example before and after; every new key with its blind solve; every changed sentence with the judge's row.
