# To Learning 019: director30 judged, three topics pass; the pilots' list, the Hindi forms, and the first three staged scripts

Judgement and decision: `docs/design/round7/judgements/director30-2026-11-18.md` (`dc-r8-director30`). Reports with rows: `evals/hybrid-side-by-side/results/2026-11-18-director30/judges/`. Built by an agent run from the main loop. Two parts: **Part 1, the four pilots** (do this first and report it; Brain 046 builds the walk's side at the same time); **Part 2, the first three staged scripts**.

018 held: no caption is wrong, no remediation reads as notes, the five left whole read as a teacher talking, the start line and the park joint are liked by every judge. The rule stays: **said beats fitted.**

## Part 1. The pilots

### A. New fields (the checker enforces each)

1. **`hindi` on every card, follow-up card and asked worked step**: the question in the Hindi a child of that class uses at home. English stays only where it is the school's word for the thing (fraction, line, rectangle, the units); "barabar hisse" not "equal parts"; no English connective or verb where a plain Hindi one exists. It is the same question with the same givens and the same key: a child who answers it has answered the card. It names no answer. One or two sentences. Said when a child asks for Hindi. `{ hi, en }` like every line (the `en` is the gloss).
2. **`joints.afterWorked`**, three forms of six words or fewer: said between a worked example's close and the next card ("Ab ek sawaal tum akele karo."). It asks nothing.
3. **A step's `simpler` never contains the step's answer**: the checker reads the step's `key` and `accept` forms against its `simpler`, in words and digits. Named: c5-t02 S1 "kam logon wala hissa bada hota hai" (stuck 20, offtopic 16); c6 s1 "poori baad teeno roll milakar banti hai" (stuck 20, offtopic 16) and s2 "pehle lambi bhuja, phir mud ke chhoti bhuja" (offtopic 52). An easier wording leads to the step: it says what to look at, not what is there.
4. **The checker lists every point, remediation and card whose text changed since a named commit** (`--since <rev>`), each with its board, so main reads them before a run. (The row that failed c5-t02 was a point sentence changed in 018 that nobody read against its board.)

### B. The lines, by script

- **c5-t02:** S3 e3's point: "Khaali hisse bhi aise hi: 5 wali ka ek khaali hissa, 9 wali ke khaali hisse se bada" names a strip the board does not show (the board is 3/5 and 3/8) and gives away its own card (steady 74). Rewrite it to speak of what its board shows, or give it the board it speaks of; it must not state its card's answer. Comparing with a half is used by S2 e4's card and by c1 and is never taught: teach it in a point, or change the cards. S2 rem2 and S3 rem1 end without their conclusion (offtopic 82, steady 86). "Isha ki chocolate 3 mein kati" said in two turns running (steady 80, 82).
- **c4:** the worked close of skill 1 and the closing question's why say "khaye hue 3 tukde / bina rang ke 5 neeche wale number mein nahi jaate": a child hears a wrong rule (steady 32, 90, stuck 52, offtopic 22, steering 42). Say what is meant: the bottom number is 5, all the pieces, not the 3 eaten. The skill 1 worked board shades the pieces left on the plate, straight after a card where shading meant eaten: say in the problem what the colour shows here. Help for an upside-down fraction ("4/1", "2/1": offtopic 64, steering 30, 32) re-teaches the fraction and never says the two numbers are the wrong way round: the remediation for that mix-up names it. The s3 asked step "6 wali ke saare tukde, 3 wali ke kitne tukde dhak denge?" is awkward and near-given; its short close says an answer to a question nobody asked. "Jaanch: dono ke laddoo jodo…", "Group ka size pata ho, toh aise group gino", "Seedhi baat: … neeche 3, upar 1." read as notes.
- **c5-t01:** the s3 asked step "7/4 ek poore, yaani 1, se kam hai ya zyada?" is answered by the e2 point two turns earlier ("6/4 1 ke aage hai") and repeats e1's frame: ask a step that point does not answer. rem[2]'s `sayAlt` re-says its `say` (steady 8, steering 10). The e3 point's other wording, said as help on its card after the answer "1/8", reads as agreeing with it (offtopic 42). "upar / neeche" means both the two lines on the board and a fraction's two numbers (steady 84): keep one meaning a script. "X nahi, yeh jawab theek nahi baitha" reads odd (it is a miss form: bring it to the others' register). Verdict whys do not link an equal answer the child gave in another form ("2/3" for 4/6: steady 56, 82, 88): where a card's `accept` holds an equal form, the `why` says the two are the same point.
- **c6:** the re-ask at stuck 48 needs the 140 cm that is no longer in front of the child. The two easier wordings in A.3. The s1 asked step is thin.
- **All four:** the wrap says "achha laga" three times in two turns (the acknowledgement, the line after it, the goodbye): one of them at most.

## Part 2. The first three staged scripts

The staged scripts come out of hold three at a time (`dc-r8-director30` item 8). The first three: **`c5-maths-ch02-t03`**, and one script each from class 4 and class 6, chosen for using board kinds the pilots already exercise (say which two and why). Bring each to the pilots' standard, which is every rule the checker holds for the pilots today plus this order's Part 1 A:

- boards part by part (a part's board shows what that part says and nothing its card asks that the part does not speak of); the fit limits, said before fitted (a remediation that cannot be said inside the limit stands alone, listed in `REM_WHOLE` with its reason);
- no quick question; worked examples that ask the step where the child decides, with the sum told, no fact said twice, the opening inside 53 words;
- captions true of the view drawn and naming no asked step's answer; an `answerViewCaption` wherever the answer board has a second view;
- the joints the pilots have (`stepMiss`, `startAnyway`, `afterPark`, `afterWorked`, the rest), the wrap's forms, `whyShort` on every card, a `reask` on every card whose last clause does not name what is asked;
- hints and re-asks that do not state the answer's numbers or leave one option; one word per idea;
- the `hindi` forms;
- every key blind-solved again, with the solve listed.

Move nothing out of `data/lesson-scripts-staged/`: main moves a script when it has been judged. Add the three to the checker's pilot-standard list so `check.mjs` holds them to it, and to nothing that makes the server serve them.

## Done means

Part 1: `node scripts/lesson-scripts/check.mjs <topic>` passes on the four pilots with the new rules; the compile report shows no new hole on the pilots; `node --test tests/r7-board-ref.test.mjs tests/r8-learning-*.test.mjs tests/r7-learning-*.test.mjs tests/r8-picture-turn.test.mjs tests/r8-card-stated.test.mjs tests/r7-compile*.test.mjs` pass (repin where a line changed, keeping the rule each test protects); tests/r8-learning-director30.test.mjs pins the new rules. Commit Part 1 and report it before starting Part 2.
Part 2: the three staged scripts pass the same checker at the pilots' standard. `docs/status/learning.md` gets a "Patch 019" section: Part 1's changed lines with the judge's row; every `hindi` form's count per script and five examples per script (card → form); Part 2 per script: what was changed to reach the standard, every remediation left whole, every key with its blind solve, and anything in the script you would not put in front of a child yet.
