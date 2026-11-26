# To Learning 026: the script rows of director37 and director36 (scripts only)

**This order carries order 025 whole** (`025-director36-script-list-after-the-walk-round.md`: the director36 list, written before the walk round and not yet started): work from this file. The judgement and the owner page call the script round it starts "Learning 025"; it is the same round.

From: main, 2026-11-25. Judgement: `director37-2026-11-25.md` (decision `dc-r8-director37`, items 2, 4 and 5; rulings 3, 4
and 5; "What is left" 2 to 7), with the script rows of director36 that still stand (`director36-2026-11-25.md`, ruling 6,
mechanism 10, decision item 6). Rows are `<child> <row>` (0-based index under `director`) in the director37 run; each judge's
report is named by topic (`report-c4.md` and the rest).

**The run.** director37, 2026-11-25: 36 lessons (six live scripts and three staged, each by a steady, a stuck, an off-topic and a
steering rule-based child) on candidate `8354c9855`. Nine of nine topics pass every line of the scale gate; register is 3.5 in
nine of nine (the eleventh run at that score). Round d37 changed the walk only: no script changed in it except c4-maths-ch05-t01,
which runs its rewritten script with the one wording that failed director36 put back. That candidate is now release 63 and is
live (commit `8354c98`, since 2026-11-25 23:36 UTC), so production runs round d37's walk.

**The rule of this order.**
- Script changes only. Nothing under `server/` changes in this round, so what the next run finds has one author
  (`dc-r8-one-author-rounds`). Section 5 lists what is not Learning's.
- One author a script.
- Every changed script is read cold by an independent reader before it is judged, as order 024 did: the five passes of 023, the
  sixth of 024 (each own step and each follow-up card against the board it is posed on), and the as-heard read of the offline
  walk of all four children row by row (director36 decision item 4; director37 decision item 6). A fix after that read is read
  the same way or does not ship.
- A sentence that names a figure is true of every board the walk can put under it (director36 ruling 1).
- Main writes no sentence for a child. Below, each row says what a sentence must do; authors write it.
- After this order, main writes down what a 4 on register would sound like and ONE lesson is rewritten whole to it (director37
  decision item 5). Nothing below is that lesson.

---

## 1. Rows that block a lesson going live (first)

### c4-maths-ch06-t01 (staged; two passing runs of two; ruling 4)
It goes live in the first release after these two rows are fixed, read, and the script has passed the rules only live scripts
are tested against (director36 decision item 2).

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| steady 74, to a child who said "lagbhag 23" (accepted): "Haan, sahi hai, kyunki lagbhag 15 se 20 centimetre, ungliyon jitna." | `skills[2].explain[1].ask.whyShort.hi` ("lagbhag 15 se 20 centimetre, ungliyon jitna"); the card's `key` is "lagbhag 15 se 20 cm" while `accept` takes every number from 10 to 25 | "untrue for this child": the short reason is said against an accepted range of 10 to 25. A short reason must be true of every answer the card accepts. Clause 5 fires; "the cold read's reasons-against-accept-list pass missed steady 74" (clause 50). | report-c4ch06t01 (C, layer a); director37 ruling 4 |
| stuck 21 to 22: the child says "8" at Golu's card; she says "8 sahi nahi hai. Ise doosri tarah samajhte hain. Nishaan nahi, khaane gino. 2 se 5 tak teen khaane hain: 2 se 3, 3 se 4, aur 4 se 5. Toote scale par chabi ka shuru 6 par hai, aur ant 10 par. Chabi kitni lambi hai?" | `skills[0].explain[2].ask` (`wrongIfMis` "8", `targets` "c4-maths-ch06-t01-m-edge-start"); the remediation it sends to is `skills[0].remediation[0]` (`say.hi` "Nishaan nahi, khaane gino. …", `then.prompt.hi` the key card) | "e3's named '8' sends the child to the edge-start remediation, which misses the mistake". The card's own `whyAlt` names the mistake ("8 toh pencil ki lambai hai, nishaan nahi"): the child gave the length as the end mark. A named wrong answer goes to a remediation about that mistake, or to none. | report-c4ch06t01 (C, layer a); director37 ruling 4 |

### c6-maths-ch07-t03 (staged; three passing runs running; director36 ruling 6, director37 ruling 3)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| Not reached by any rule-based child in director36 or director37. | `skills[2].remediation[0]` (targets "m-stop-early"): `board` ("48 ÷ 2 = 24" beside "66 ÷ 2 = 33") and `viewCaption`; its `say.hi` is "Ek baar bhaag dene ke baad bhi upar aur neeche mein koi common factor bacha ho sakta hai. Jab tak ek se bada common factor bache, aur bhaag do." | The drawing is never spoken by its sentence, so the live rule director5 SC2 (`tests/r7-board-ref.test.mjs`) refuses the script as live: the say speaks its board, or the board goes. Curing it takes a new sentence, so the cure is read and run before it ships; pinning the board away is not the cure (director36 ruling 6). | director36 ruling 6; mechanism 10 |
| steady 26, stuck 50, offtopic 20, steering 40 (the same card in four lessons). stuck 50: "… Ab ek sawaal tum akele karo. Pooja ne ek cake ke 6 barabar hisson mein se 5 liye. Waisa hi doosra cake 12 barabar hisson mein kata hai. Uska bhai kitne hisse le ki dono ka cake barabar ho?" In stuck (42) and steering (22) it comes after the key was told: "6 hisse 12 hue, aur har rangeen hissa bhi do bana, toh 5 ke 10: 10/12. Yahan tak theek hai?" | `skills[0].checks[0]` (s1 c1: `prompt.hi`, key "10 hisse", the same `board` and `answerBoard` as `skills[0].remediation[0].then`, whose key is "10/12" and `why.hi` "6 hisse 12 hue, …, toh 5 ke 10: 10/12") | "s1 c1 (Pooja, 5/6 = ?/12) asks the follow-up card's 5/6 to 10/12 again, on the same board, now called 'cake' instead of 'patti'." The judge counts it "1 giveaway-like card (c1)" and puts its rewrite first of what would move the topic. s1 c1 asks for something the follow-up card does not. | report-c6ch07t03 (C, layer a; E item 1); director36 mechanism 10 |
| steady 82, the closing verdict: "Bilkul sahi: 21/27 ko 3 se bhaag do toh 7/9, aur 28/36 ko 4 se toh 7/9. Dono dabbon mein bhinn ek hi hai. …" said on a cleared screen. | `teachback`: a `board` (compare@1, "21/27" and "28/36") and no `answerBoard`; `teachback.why.hi` | "A part said without its board: steady 82, the closing verdict on a cleared screen. Carried from D36." Counted 0 by the judge as in director36; it stays on this list as an answer board for the closing question (director37 ruling 3). | report-c6ch07t03 (A, C layer a/b); director37 ruling 3 |

---

## 1a. Rows round d38's walk makes heard (added 2026-11-26; fixed and read before any full run of that walk)

Round d38 changed the walk in two ways that put script sentences in front of a child for the first time. (1) The cap (order
`to-brain/055`, C1) says the first unsaid help wording of an open question, ending on an invitation, where round d37 told the
answer. (2) A fault of the walk was fixed: after help at an asked worked step the child's answer was not read at all, so the
rule-based children talked past every such step; now they answer, and nine of the thirty-six offline lessons take paths no
run has shown. Three independent as-heard reads of those walks (2026-11-26) found the rows below; all are the scripts'. The
walk is merged but not released, and no full run of nine is made, until the rows marked **Blocks** are fixed and read as
this order's rule says. Rows are of the offline walks `d38/a4/dry1` (the first two) and `d38/q/dry1` (the rest).

| Row as heard | Script field | What is wrong | Source |
|---|---|---|---|
| steering c5-maths-ch02-t01 22, to a child who said "6 kilometre": "Nahi, yeh jawab nahi hai. Ek lambi chocolate ko neeche wali sadak ke gaps jitne barabar hisson mein baanto, aur ek hissa lo. Khilone ka ek gap bhi 1 kilometre ki sadak ka utna hi hissa hai. Chalo, ab tumhari baari." | `skills[0].remediation[2].simpler` (hi and en); the remediation's own `board` is one line (`fraction-line@1`, `den` 7, 1/7 marked) | **Blocks the cap.** The wording names "neeche wali sadak" (the lower road) over a board that shows one road only: the two roads are on the card's board, which comes back after it. A child counting gaps on the board under the words shares the chocolate into 7. A sentence that names a figure is true of every board the walk can put under it (director36 ruling 1): the wording names what its own board shows, or the board under it shows what the wording names. The same check for every `remediation[*].simpler` and step `simpler` of all nine scripts against the board the walk puts under it (they are said far more often under the cap). | d38 as-heard read, finding A |
| steering c6-maths-ch07-t03 22 and stuck 42: the told answer ("… toh 5 ke 10: 10/12. Yahan tak theek hai?") comes with `remediation[0].simpler` unsaid | `skills[0].remediation[0].simpler` (staged script) | Not a fault of the walk: the wording is the remediation's own `say` over again but for a few words (8 in 10 words in order), so the walk does not count it as an unsaid wording and does not say it. A `simpler` is another way in, not the same sentence: write one that is, or leave the field out. | d38 as-heard read; RULING-A2 |
| offtopic c4-maths-ch01-t02 56 and stuck 62 (the same in the walk before, stuck 66), to a child who said "zyada" at the cake card: "Nahi, yeh jawab nahi hai. Zyada tab hota jab doosri bhuja tester ke doosre seedhe kinaare ke us paar jaati; board par dekho ki woh kahan se jaati hai. …" | `skills[1].explain[0].ask` (s2 e1, staged script): `board` (`angle@1`, the 50 degree "cake ki nok") has no `"tester": true`, while `ask.whyAlt` and `ask.viewCaption` ("Ab cake ki nok par tester rakha hai…") both speak of the tester; the point's board just before has it | **Blocks this lesson going live.** The child is told to look on the board for where the arm passes the tester's edge, and no tester is drawn. Two readers found it apart. | d38 read 2, readers A (finding 2) and B |
| steady c6-maths-ch07-t01 78, to a child who said "ek poora aur 2/3" (accepted): "Haan, sahi hai. Toh poora jawab: har bachche ko 5/3 laddoo milta hai, kyunki laddoo bachchon se zyada the…" | `skills[2].workedExample` (live script): `final` ("har bachche ko 5/3 laddoo milta hai") and the accept list of its last own step, which takes the mixed number | **Blocks.** Straight after "Haan, sahi hai" she names 5/3, which this child did not say, and nothing spoken ties it to "1 aur 2/3"; only the board's title does. A whole answer said after a confirm is true of every answer the step accepts (the rule of this order's first row, for whole answers): it names both forms, or the step's reason that links them is said first. | d38 read 2, reader B |
| steady c6-maths-ch07-t01 38, to a child who said "hissa" (accepted) at the first step of the patti problem: "Haan, pehle har dost ka hissa, har option mein. Ab har hissa do baaton par jaanchna hai… Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?" | that worked example's `steps[0]`: its `right`/confirm against its `told` (which says the shares: 1/2, 1/4, 1/7) | The step accepts an answer that names the method only, and its confirm does not say the step's result; the shares are then never spoken (only drawn, and that board goes when the card comes). Where a step accepts a method word, its confirm says the result. | d38 read 2, reader B |
| offtopic c5-maths-ch02-t02 36, to a child who said "aage" a second time at the card about where 1/5 falls: "Yeh jawab sahi nahi hai. Yeh mark 1/3 hai; gap 3 se zyada hon toh pehla gap chhota hota, aur is mark se pehle khatam hota. Ab dekhenge…" | that card's `why.hi` (s? c3, live script; key "pehle") | The told answer is said as its reason alone (round d37's rule where the reason already says the answer). This reason says it only as "is mark se pehle khatam hota" and never places 1/5: the child cannot tell she has been told. A reason that may stand alone as the told answer names the thing asked about and where it falls. | d38 read 2, reader A, finding 3 |
| pair run d38a, offtopic c6-maths-ch06-t01 40, to a child who says "mujhe cricket pasand hai" a second time: "Cricket wali baat maine likh li hai. Ek poora chakkar kitne metre ka hua?" | the script's `asidePark` forms: none speaks of the side-topic as already kept. Six live and staged scripts of the nine have none (c4-maths-ch05-t01, c5-maths-ch02-t02, c5-maths-ch02-t03, c6-maths-ch06-t01, c4-maths-ch01-t02, c4-maths-ch06-t01); c5-maths-ch02-t01, c6-maths-ch07-t01 and c6-maths-ch07-t03 have one ("Wah, {aside} ki baat sambhaal ke rakhi hai, …") | She says she wrote the side-topic down and she did not: the walk's old fallback, said only where the script has no kept form of its own (round d37 built the script's form in its place). Each script carries one said-again form that is true (she remembers it; she does not write). | pair run d38a, judge c6-ch06-t01, section E |

Not on this list, though a reader faulted it: offtopic c6-maths-ch06-t01 26 (a picture request at the 10 cm by 4 cm card
answered "Card ki chaaron bhujayein line par hain: 10 cm, 4 cm, 10 cm, 4 cm. …"). The reader read the card's `board` alone
(the plain rectangle). The screen as held is split: the rectangle on the left and the unrolled line with the four lengths
on the right (`held.layout.panels`, `picture.view` "unrolled"), so the caption is true of the screen; the pair run's judge
read the held record and counted 0. When a caption is checked against a board, check it against the screen as held.

---

## 2. Per topic

Each table holds the rows a judge marks layer (a), or names as a script sentence, form, board or caption, and the director36
rows of mechanism 10 that still stand. A row heard in several lessons is one row. Values stated and not drawn (K1) are in 4.14;
forms every script shares are in section 4 and are only pointed to here.

### c4-maths-ch05-t01 (live; rewritten script)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| stuck 30: "… Ek roti 8 barabar tukdon mein kati socho. … Upar wala number woh tukde ginta hai jinki baat ho rahi hai, yahan khaye hue. …"; stuck 32: "Yeh jawab sahi nahi hai. Khaane se pehle wali poori chocolate ke saare tukde neeche wale number mein jaate hain. Upar wale number mein sirf woh tukde, jinki baat poochhi gayi hai. …" | `skills[0].remediation[1].sayAlt.hi` then `skills[0].remediation[1].simpler.hi` | "Help repeats the idea of the turn before" (k32 against k30): "Same idea in the same order". Director37 "What is left" 5: "a remediation's two wordings (c4 ch05-t01 stuck 30 and 32)". Both stay true of their boards (clause 86 does not fire): the cure is a second wording with a new idea, not a new board. | report-c4 (C, layer a, new) |
| steady 36: "Achha, ab Hindi mein kehti hoon. Laddoo ke 3 tukde bane, sab ek size ke nahi. Sabse bada tukda poore laddoo ka 1/2 hai ya 1/3?"; steering 8: "Haan, ise Hindi mein bolti hoon. Roti ke saare tukde ungli se gino, phir sirf rang wale. … Roti ke do barabar tukde hain, aur ek par rang laga hai. Rang laga tukda poori roti ka kitna hai, fraction mein?" | `skills[0].checks[0].hindi.hi`; `skills[0].explain[0].ask.simpler.hi` and `.hindi.hi` | "Hindi forms in Hinglish" (s36, r8); carried from director36 mechanism 10. See 4.11. | report-c4 (C, layer a) |
| offtopic 32: "Achha, ab Hindi mein kehti hoon. Jo tukde kha liye, unka theek bhinn 2/4 hai ya 2/2?" | `skills[0].remediation[1].then.hindi.hi`; `terms[0].hi` "bhinn" | "bhinn" (o32) beside "fraction" in the same lesson: two words for one thing. | report-c4 (C, layer a) |

Pointed to: the said-again replies (offtopic 54, 58; 4.6), the goodbye (steady 108; 4.5), the return said with its verdict
(offtopic 8; 4.3), "Toh poora jawab:" (steady 34, 72, 96; 4.12), K1 (4.14).

### c5-maths-ch02-t01 (live)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| steady 38: "Achha, ab Hindi mein bolti hoon. Ab poori line 8 gap mein bhi bati hai. 0 se 5 gap aage jao, toh kaunsa fraction aata hai?"; stuck 10: "Haan, Hindi mein hi kehti hoon. Ab 3 gap bhi bane hain. …"; offtopic 32: "Theek hai, Hindi mein kehti hoon. Ek baar line ko 4 gap mein kaata, ek baar 12 mein. …" | `skills[1].explain[0].ask.hindi.hi`; `skills[0].explain[0].ask.hindi.hi`; `skills[0].checks[1].hindi.hi` | "Hindi forms are the same Hinglish reworded" (carried; director36 mechanism 10). See 4.11. | report-c5t01 (C, layer a) |
| steady 14: "… Ab wahi 0 se 1, par line par 8 barabar gaps hain. … Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. …"; stuck 64: "… Is baar line 3 barabar gaps mein kati hai, har gap 1/3. … Is baar line 8 barabar gaps mein bhi kati hai. …" | `skills[0].explain[2].point.hi` and `.ask.prompt.hi`; `skills[1].explain[0].point.hi` and `.ask.prompt.hi` | "Repeated frame inside one turn": a point and its card open on the same words. | report-c5t01 (C, layer a) |
| stuck 62, after the child's "nahi": "0 ke baad pehle mark ka naam gaps ginkar banta hai; ab aage ke marks ke naam bhi aise hi gaps ginkar banayenge. Ab tak samajh aaya?" | `skills[0].bridgeToNext.simpler.hi`; "Ab tak samajh aaya?" is not in the script | "'Ab tak samajh aaya?' said after a 'nahi'", layer a/b. The check-in is the walk's form (CONTEXT-notes: "walk picks another form: closing builder"); the bridge's easier wording is the script's. | report-c5t01 (C, layer a/b) |
| steady 26 (the worked close): "… Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. …" after the child's own step answer "dhai sau metre" | `skills[0].workedExample.yourStep.accept` holds "dhai sau metre"; `skills[0].workedExample.why` / `answer` | "Steady 26 never ties the child's 'dhai sau metre' to 1/4 km" (worked examples; the C table lists the close at steady 26 under layer c). A close that accepts metres says how they are the 1/4 km. | report-c5t01 (B, C) |

Pointed to: the name replies (steady 42, offtopic 56; 4.2), the returns after a verdict (steady 40, offtopic 54, steering 26;
4.3), the goodbye (steady 96; 4.5), K1 (4.14).

### c5-maths-ch02-t02 (live)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| steady 113 to 116: the child says "12/7"; she says "12/7 sahi nahi hai. Dono mein 7 hisse liye gaye; ab dekho kis patti ka ek hissa chhota hai. …" then "Nahi, 12/7 theek nahi. Dono se 7 hisse liye, par 12 hisson wali patti ka har hissa chhota hai, isliye 7/12 chhota hai. …" | `teachback.simpler.hi`; `teachback.why.hi`; the teachback has no named wrong answer for "12/7" | "'12/7' (a reversed fraction) gets help about part size that misses the child's mistake." The judge's third change: "Give a reason per wrong answer such as '12/7' (script)." | report-c5t02 (C, layer a) |
| stuck 76: "Abhi yeh sahi nahi hai. Hisse ek size ke hain, toh bas liye hue hisse milao: Neha ke 3, Gopi ke 6. Ab tum batao." | `skills[1].remediation[0].then.simpler.hi` | "Hint lists 'Neha ke 3, Gopi ke 6', nearly the answer" (clause 10: 1). | report-c5t02 (C, layer a) |
| steady 38: "Haan, sahi hai, kyunki yeh mark 1/3 hai; gap 3 se zyada hon toh pehla gap chhota hota, aur is mark se pehle khatam hota. …" | `skills[0].checks[2].why.hi` | "Elliptical c3 reason"; register (c) row. Carried from director36 mechanism 10 / order 025 of director36. | report-c5t02 (C, layer a) |
| steady 2: "Roti ke 4 hisse karo, waisi doosri ke 8. Yeh patti ek poora hai, 4 barabar hisson mein; …" | `skills[0].hook.interestSlots[0].use.hi`, then `skills[0].explain[0].point.hi` | "roti then 'patti' in one breath" (rows 2 and 4); the judge's register 4 asks "one name kept for one object (roti stays roti)". | report-c5t02 (C, layer a) |
| stuck 44: "Abhi yeh sahi nahi hai. Ise baantne ki tarah socho: ek chocolate do bachchon mein barabar bati, … Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?" | `skills[0].workedExample.simpler.hi` said at the own step | "The worked problem's easier wording at an own step: stuck 44. It gave a new angle but did not help"; register (b) script sentence. See 4.9. | report-c5t02 (B, D) |
| steering 8: "Theek hai, Hindi mein bolti hoon. Socho, is patti ka ek hissa beech se do barabar hisson mein kata hai; … Socho, yahi patti 8 hisson mein kaati jaaye. …" | `skills[0].explain[0].ask.simpler.hi` and `.hindi.hi` | "the switch line, the hint, then a Hindi form that is the Hinglish reworded"; register (b) script sentence. | report-c5t02 (B Hindi, D) |
| stuck 46 to 48 (told own step, then the worked close): "… Sana ki chocolate 2 mein kati, Rahul ki 8 mein, isliye Sana ka hissa Rahul ke hisse se bada hai. …" | `skills[0].workedExample.yourStep.why.hi` and its key | CONTEXT-notes, for Learning 025: "'Sana ka hissa' twice in c5-ch02-t02's own-step key and reason". | d37 CONTEXT-notes |
| stuck 50: "Yahi sabse seedha tareeka hai jo mere paas hai, koi baat nahi. Theek hai, isko yahin rakhte hain; ab agli baat. …" | `joints.helpSpent[1].hi` | "Two go-on clauses after 'nothing easier', picture never offered" (layer b/c). The form ends on "koi baat nahi" (as the three `helpSpent` forms of c4-ch06-t01 do; CONTEXT-notes). The walk owns when it is said; the script owns the words. | report-c5t02 (C, layer b/c) |

Pointed to: the name reply (offtopic 30; 4.2), "Theek hai, ab wahin se aage badhte hain jahan ruke the." before a new card
(offtopic 30, steering 28: layer c, the walk's go-on line), the goodbye (steady 120; 4.5), K1 (4.14).

### c5-maths-ch02-t03 (live)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| offtopic 40: "2 sahi nahi hai. Har hissa 2 mein kata, toh rang wala har hissa bhi 2 chhote hisse bana. Isliye rang wale hisse utne hi nahi rehte; woh bhi dugne hote hain. …" | `skills[1].explain[0].ask.whyAlt.hi` | "the s2 e1 own reason all but states 4" (clause 10: "1 near-giveaway"). | report-c5t03 (C 4, layer a) |
| offtopic 36: "Theek hai, yeh Hindi mein suno. Rang wale hisse 2 hain, aur har ek ke do ho gaye. Ab rang wale hisse kitne hain?" | `skills[1].explain[0].ask.hindi.hi` | "the Hindi form said cold"; CONTEXT-notes: the card's Hindi form said cold ("har ek ke do ho gaye"). | report-c5t03 (C 4, layer a) |
| steady 72: "Haan, sahi hai. Toh poora jawab: Sita ne Rahul jitna khaya, aur Mohan ne Rahul se kam, kyunki Rahul ka 3/4, baarah hisson mein 9 hisse hain; …" | `skills[2].workedExample.why.hi` | "unnatural"; also "'baarah' and '12'" in one turn (two words for one thing). | report-c5t03 (C 4, layer a) |
| steady 36: "… 1/3 ke upar aur neeche 1 jodkar 2/4 banta hai; 0 se 1 tak 6 gap wali is line par, 2/4 0 ke baad kaunse mark par aayega?" | `skills[1].explain[2].ask.reask.hi` | The re-ask "2/4 0 ke baad kaunse mark" is unnatural. | report-c5t03 (C 4, layer a) |
| stuck 24: "Kaagaz ko ek baar modkar kholo, …" in the rumal problem | `skills[0].workedExample.steps[0].simpler.hi` | "'kaagaz' in the rumal step's easier wording"; rumal and kaagaz, two words for one thing. | report-c5t03 (C 4, layer a) |
| stuck 42: "Nahi, yeh jawab nahi hai. Ek roti ke 2 bade hisse karo, … Farhan ne chocolate ka 1/3 khaya; …" | `skills[0].remediation[0].sayAlt.hi` and its `then` card | "roti, patti and chocolate (stuck 42)": three objects in one help. | report-c5t03 (B, two words) |
| steady 20, stuck 34, offtopic 20, steering 32 (72 to 73 words). steady 20: "Haan, bilkul theek. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai, kyunki hisse badle, par rumal par rang utna hi raha. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. …" | `skills[0].workedExample.answer` / `why`, then `skills[0].checks[0].prompt.hi` | "(b) walk: the end of a worked problem and the next card are said in 72 to 73 words (4 rows). Taken out by design; for the next script round." See 4.1. | report-c5t03 (C 1) |
| steady 88: "Haan, bilkul theek: 3/7 mein rang wale 3, khaali 4: aadhe se kam. …" | `skills[2].checks[2].whyShort.hi` | "Steady 88 is still thin: it never says that 4/8 is half." | report-c5t03 (B short reasons) |
| steady 56, 60; offtopic 60, 66, 74: "Neeche 6 × 2 = 12, toh upar bhi …" and its like | the `why` fields of skill 2's cards (e.g. `skills[1].remediation[0].then.why.hi` "neeche 6 × 2 = 12, toh upar bhi 1 × 2 = 2, yaani 2/12") | Frame within 4 turns: "Neeche A × k = B, toh upar bhi…"; register 4 would turn it into "a spoken 'dono ko 2 se guna karo'". | report-c5t03 (B frames, clause 83) |

Pointed to: the goodbye (steady 92; 4.5), K1 (4.14).

### c6-maths-ch06-t01 (live)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| steady 23 to 24: the child says "31 metre"; she says "Haan, kyari ka parimap, yaani teeno bhujaon ka jod. …" | `skills[0].workedExample.steps[0].ask.right.hi` | "Confirmation drops the child's '31 metre'" (layer a/c; carried, director36 mechanism 7). | report-c6 (C) |
| steady 6 to 8, stuck 42 to 44: "… P se chalkar board par woh bhuja dhoondo jiska number jod mein nahi aaya. …" then "Board par paanch naap likhe hain; jod mein paanchon number aane chahiye, ek bhi chhoote nahi. …"; offtopic 34 to 36: "22 m mein park ki chaaron bhujayein nahi aayin, …" then "Kone se chalo aur har bhuja ki lambai jodte jao; …"; offtopic 46: "Sticker ke kinaare par ungli ek chakkar ghumao aur har bhuja ka naap jodo. …" | `skills[0].remediation[0].then.whyAlt.hi` then `.simpler.hi`; `skills[0].checks[0].whyAlt.hi` then `.simpler.hi`; `skills[0].remediation[1].then.simpler.hi` | "Help with the same idea in the same order" (steady 8, stuck 44, offtopic 36, 46): layer a, carried, reduced. Director36 mechanism 10 had c6-ch06-t01's two easier wordings (the own step's and c1's); c1's is offtopic 36 here. | report-c6 (C, layer a) |
| stuck 32: "Socho, jeb mein 35 rupaye hain aur ek kitaab khareedni hai: … Yahan kitaab ki jagah kyari hai. …" | `skills[0].workedExample.steps[0].simpler.hi` | Clause 14, unnatural: "kitaab ki jagah kyari" (the judge also says "Stuck 32's rupee analogy helped"). | report-c6 (clause 14) |
| The greeting's easier line, before a triangle: "Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge." | `greetSimpler.hi` | Clause 14, unnatural: "the greeting's 'chaaron taraf' before a triangle". | report-c6 (clause 14) |
| Across the lesson: parimap, kinaara, chakkar; baad, taar; lambai for a side and for the length | many fields (e.g. `skills[0].workedExample.steps[0].told.hi` "kyari ka parimap", `skills[2].workedExample.steps[0].told.hi` "ek chakkar park ka parimap") | "Two words for one thing". | report-c6 (B smaller items) |

Pointed to: the said-again reply (offtopic 52; 4.6), the name reply (offtopic 30; 4.2), the goodbye's flat reply (steady 100;
4.5), K1 (4.14).

### c6-maths-ch07-t01 (live)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| stuck 6, steering 6, steady 8 (after a "nahi" or a help request): "Socho chaar dost yeh roti barabar baant-te hain. …"; the hook before it (steady 2, offtopic 2): "Socho, chaar log ek roti barabar baantein. …"; stuck 8: "1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. …"; stuck 12: "Roti ko 4 barabar hisson mein kaata, toh har hissa 1/4 hai. 1/4 ka neeche wala 4 batata hai …" | `skills[0].explain[0].pointAlt.hi` against `skills[0].hook.interestSlots[0].use.hi`; `skills[0].explain[0].ask.simpler.hi`; `skills[0].explain[0].simpler.hi` | C1: "s1 e1's other wording repeats the hook's roti image, and its help wordings overlap", "carried, now heard more often because of M3"; stuck 12 is a help turn with nothing new ("repeats rows 4 and 8"). CONTEXT-notes: "its first card's simpler/prompt doubled lead". See 4.7. | report-c6ch07t01 (C 1, layer a) |
| offtopic 8, steering 18: "… Dono pattiyon ke teen hisse, par barabar sirf pehli ke. Hisse gin kar 1/3 jaisa naam tabhi dete hain, jab patti ke saare hisse barabar hon. …"; steering 24: "Yeh jawab sahi nahi hai. Hisse teen hain, par ek jitne lambe nahi; chhote-bade hisse gin kar har ek ko 1/3 nahi keh sakte. …" | `skills[0].remediation[0].say.hi`; `skills[0].explain[1].ask.whyAlt.hi`; both against `skills[0].explain[1].point.hi` ("… B ke hisse chhote-bade hain, toh unhe gin kar 1/3 nahi keh sakte.") | C2: "The unequal-parts remediation and its reason repeat the point"; steering 24 "≈ row 12" is a help turn with nothing new. Carried from director36 mechanism 10. | report-c6ch07t01 (C 2, layer a) |
| steady 44, stuck 58, steering 38, each after the child told "kal maine cricket khela, sixer maara": steady 44 "… Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?" | `joints.asideReturn[2].hi` ("{aside} wali baat batao na, tumhe uski kaunsi baat pasand hai?"); `asideReturn[1].hi` asks a liking question too | C3: "A return to the told 'sixer' asks what the child likes and drops what was told, said straight after the verdict" (layer a/b). See 4.3 and 4.4. | report-c6ch07t01 (C 3) |
| offtopic 16, 18, 20: "… hisse ki lambai 6 nahi aati; …", "1/6 sahi nahi hai. 6 toh ek hisse ki lambai hai, …", "… 30 ÷ 6 = 5, toh neeche 5 aata hai, 6 nahi. …" | `skills[0].workedExample.steps[1].told.hi`; `skills[0].workedExample.yourStep.whyAlt.hi`; `skills[0].workedExample.why.hi` | "'…6 nahi' is said three turns running" (worked examples; no layer given). | report-c6ch07t01 (B) |
| steady 68: "Haan, bilkul theek, kyunki baanti jaane wali chikki upar, bachche neeche. …" | `skills[2].explain[1].ask.whyShort.hi` | "Steady 68's is thin" (short reasons); director36 heard "…upar, bachche neeche" twice running (steady 92, 94). | report-c6ch07t01 (B) |
| The cards that state a value over their posing board (s1 e3, c1, c2, s2 e2 and others) | see 4.13 | C8: "No answer board for s1 e3, c1, c2 or s2 e2" (layer a, carried); director36 ruling 4 named the 1/10 card. | report-c6ch07t01 (C 8) |

Pointed to: the park that ends "Pehle is sawaal ka jawab do." (steady 38, steering 32: layer b, the walk's), the goodbye
(steady 86; 4.5), K1 (4.14).

### c4-maths-ch01-t02 (staged; one passing run of two)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| steady 64, stuck 74, steering 56: "Bilkul sahi: chhoti bhujayein, par 6 cm wala zyada khula hai. …"; stuck 74: "Haan, bilkul theek, kyunki chhoti bhujayein, par 6 cm wala zyada khula hai. …" | `skills[1].explain[1].ask.whyShort.hi` | "s2 e2's short reason is a fragment"; "Stuck 74 adds 'kyunki' in front of that fragment". Carried (director36 mechanism 10: "heard in four lessons"). | report-c4ch01t02 (C, layer a) |
| steady 36: "Haan, Hindi mein sunati hoon. Har kone par tester rakh kar socho: jis kone mein tester poora baithe, koi khaali jagah na bache, wahi right angle hai. …" after row 12's point "… Jis kone mein tester bilkul fit ho, bina khaali jagah, woh right angle hai. …"; then steady 38, after one miss: "Abhi yeh sahi nahi hai. Samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. …" | `skills[0].checks[0].simpler.hi` (said with its Hindi form) against `skills[0].explain[1].point`; `skills[0].checks[0].why.hi` | "c1's hint restates the e2 point" (help with nothing new: 1); "A key after one miss, with c1's hint spent on the Hindi request" (layer a, new path). The judge: "give c1 a hint of its own so a key does not follow one miss." | report-c4ch01t02 (C, layer a) |
| steady 101 to 102: the child says "1 m"; she says "Haan, sahi hai. Toh poora jawab: poori line 100 cm lambi hai, …" | `skills[2].workedExample.yourStep.accept` holds "1 m" and "1 metre" for key "100 cm" | "the child's '1 m' is confirmed as '100 cm' with no link between the two" (for the main loop; no layer given). | report-c4ch01t02 (E) |

Pointed to: "Abhi yeh sahi nahi hai" seven times in steady (the walk's miss form, not a script field; 4.12), the goodbye (steady
118; 4.5), K1 (4.14).

### c4-maths-ch06-t01 (staged; the two blocking rows are in section 1)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| steady 86: "Nahi, yeh theek nahi hai. Chhoti unit ungli jitni hai; ped ko ungli-ungli karke naapo toh ginti hazaar se bhi upar jaati. …" | `skills[2].remediation[0].then.whyAlt.hi` | "'Ginti hazaar se bhi upar' is overstated" (carried; director36 mechanism 10). Clause 14 counts "2 untrue" in this topic: this row and steady 74. | report-c4ch06t01 (C, layer a) |
| stuck 58: "Socho, ek-ek centimetre ke sau chhote khaane ek qatar mein lage hon. …"; stuck 60: "… Lakdi ka har chhota khaana 10 centimetre ka hai; …"; stuck 64: "… Ek metre bada hai: usmein 100 chhote centimetre aate hain. …" | `skills[1].explain[0].pointAlt.hi`; `skills[1].explain[0].ask.simpler.hi`; `skills[1].explain[0].simpler.hi`; also `skills[1].explain[1].mustSay[1]` "chhota khaana" and `skills[1].remediation[0].say.hi` | "'Chhota khaana' means 1 cm, then 10 cm, then '100 chhote centimetre'" (known item; CONTEXT-notes). The judge's third change: "Use one word for 1 cm and another for the 10 cm feeta space." | report-c4ch06t01 (C, layer a) |
| stuck 4, offtopic 4, steering 4: "Chalo, main batati hoon. Cricket bat ka handle bhi scale se naapte hain. Scale par 0 se 1, …" | `skills[0].hook.interestSlots[1].use.hi` | "The dangling hook 'Cricket bat ka handle bhi…'" (carried; director36 order 025). Register (b) rows stuck 4, steering 4. | report-c4ch06t01 (C, layer a) |
| steering 8: "Achha, ab Hindi mein kehti hoon. Crayon ke neeche wale khaane ek-ek karke gino, 3 wale nishaan se shuru karke. 3 se 9 tak ke khaane gino. …" | `skills[0].explain[0].ask.simpler.hi` and `.hindi.hi` | "The Hindi form repeats the hint ('gino' twice in one turn)" (carried). | report-c4ch06t01 (C, layer a) |
| stuck 66, offtopic 8, after a told sixer: "… Cricket mein kya kuch aisa hai jise tum naap sakte ho?" | `joints.asideReturn[0].hi` ("{aside} mein kya kuch aisa hai jise tum naap sakte ho?") | "The return is said cold after the verdict" (layer b): "The script's 'Cricket ki baari aa gayi…' form was not chosen" (`asideReturn[2]`). See 4.3. | report-c4ch06t01 (B M9/M10, C) |
| offtopic 30, 36, 40, 42; steady 24 and 30; stuck 42 and 46: "Tumhari baari: tehni kitni lambi hai?" and its like | `skills[0..2].workedExample.yourStep.prompt.hi` (each opens "Tumhari baari:"); `joints.yourTurn[2].hi` | "'Tumhari baari' comes back within four turns"; register 4 if "the scaffolding labels ('Tumhari baari', 'Toh poora jawab') were dropped". See 4.12. | report-c4ch06t01 (B frames, clause 83) |
| (form) "Koi baat nahi, isse aasaan shabd mere paas nahi hain." and the two like it | `joints.helpSpent[0..2].hi` | CONTEXT-notes: "a helpSpent form ending 'koi baat nahi' before help.js's 'Koi baat nahi, …'" (not heard in this topic's run; RULING-G item 8 heard the doubled form in c4-ch05-t01 before the round). | d37 CONTEXT-notes |
| s2 e1, e3, c1, c2, the pipe card, and s3's cards: values said over a posing board (steady 48, 58, 64, 66, 72, 76; offtopic 62, 72, 74; stuck 66) | see 4.13 | Director36 order 025 section 4; K1 in 4.14. | report-c4ch06t01 (A, K1) |

Pointed to: flat replies (offtopic 10, 58; steady 100: layer c; 4.5), the asked-for picture at steering 16 (section 5), K1
(4.14).

### c6-maths-ch07-t03 (staged; the three blocking rows are in section 1)

| Row as heard | Script field | What is wrong | Report |
|---|---|---|---|
| steering 26, after the told "kal maine cricket khela, sixer maara": "Sahi jawab, kyunki 4 hisse 3-3 mein kate toh 12, … Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?" | `joints.asideReturn[2].hi`; `asideReturn[1].hi` also a liking question | "Told return asks a liking question" (layer a; asked by name (f)); register (f) row. See 4.4. | report-c6ch07t03 (C) |
| stuck 72: "Nahi, 14/5 theek nahi. Dekho neeche ka 35 kis number se bhaag hokar 5 bana. Upar ko bhi usi se bhaag do. Ab tum batao, main sun rahi hoon." | `skills[1].explain[1].ask.simpler.hi`; the card's `board` draws a bar of 5 parts only | "Invitation that needs 14/35, which is no longer on the board" (layer a, carried). | report-c6ch07t03 (C) |
| stuck 10: "Haan, Hindi mein batati hoon. 3/4 wali patti ka har hissa 3 chhote hisson mein baant do. …"; steering 8: "Theek hai, Hindi mein kehti hoon. Pehle socho, 4 hisse 3-3 mein kate toh kul kitne bane. … 3/4 wali patti ka har hissa 3 chhote hisson mein baant do. …" | `skills[0].explain[0].ask.hindi.hi`; `skills[0].explain[0].ask.simpler.hi` | "The Hindi form overlaps the hint just said at stuck 10 and steering 8"; register (e) rows stuck 10, steering 8. | report-c6ch07t03 (B help, D) |
| stuck 6, steering 6: the point's other wording after the point | `skills[0].explain[0]` (pointAlt and point) | One of "5 help turns … new words for the same idea in the same order". See 4.7. | report-c6ch07t03 (B help) |
| offtopic 26: "Yahan har chocolate ek ghere ki tarah dikhayi hai: Farhan wali 3 barabar hisson mein, 1 rangeen; Ritu wali 9 mein, abhi koi rangeen nahi. …"; offtopic 58: "10/14 sahi nahi hai. Neeche 7 ka 14 hona yahan har hissa 2 mein kaatna hai; toh rangeen 3 hisse bhi 2-2 mein kat-te hain, unmein 7 nahi judta. …" | `skills[0].checks[1].viewCaption.hi`; `skills[1].remediation[1].then.whyAlt.hi` | Register (b), "a script sentence: 2 (offtopic 26, 58)". | report-c6ch07t03 (D) |
| stuck 62: "Nahi, 2/27 theek nahi. 2/27 mein rangeen 2 hi rahe; par 9 hisson ko 27 banane mein har hissa chhote hisson mein toota, toh rangeen hissa bhi toota. …" | `skills[1].remediation[0].then.whyAlt.hi` | Register (c), "the verdict and its why: 1 (stuck 62)". | report-c6ch07t03 (D) |
| steady 4/6, stuck 34/36, offtopic 4/8, steering 10/12: "Kaatne (ya milane) par…"; steady 24/26: "Tumhari baari:" then "Chalo, ab tumhari apni baari." | `skills[0].explain[0].ask.whyAlt.hi`, `skills[0].remediation[0].say.hi` and others opening "Kaatne"; `skills[0].workedExample.yourStep.prompt.hi` | "Frames repeated within 4 of her turns: 7." See 4.12. | report-c6ch07t03 (B frames) |
| steady 34: "Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Ab yeh kaam poora karte hain. …"; steady 40, offtopic 46: "Ab wahin wapas aate hain jahan hum the" before a new point | `joints.asidePark[1].hi`; `joints.afterAside[0].hi` | "Park line and joint double the go-on" (layer c, new; register (a) row) and "'Ab wahin wapas aate hain jahan hum the' said before a new point" (layer c). The joining is the walk's; the park form's "kaam" ending is the script's. | report-c6ch07t03 (C) |
| (director36, not re-heard) "jodna" for joining parts and for adding a number in two turns running (director36 stuck 74, 76); the s2 close "teen hisse hain, har ek mein saat page" is loose | `skills[1].explain[2]` and `skills[1].checks[0..1]` (`whyAlt` "Dono mein 1 jodna …", "… do-do hisse jud gaye; …"), `skills[1].remediation[1]`; `skills[1].workedExample.why.hi` | Still in the script; no director37 report names either. | director36 order 025 section 3 |

Pointed to: the worked closes at 73 to 75 words (4.1), K1 (4.14).

---

## 3. Director36's script rows: where each stands

- c4-ch05-t01's one sentence back to its director35 text: done; it ran in director37 and every sentence is true of its board
  (clause 86 does not fire). Closed.
- c6-ch06-t01's two easier wordings and its hook: the c1 wording is heard again (offtopic 36, section 2); the own step's is not
  named by director37's judge; the hook is not faulted (steady 2 now carries "wahi parimap hai"). Open as in section 2.
- c6-ch07-t01's unequal-parts remediation and the reason said twice running: open (section 2, C2 and steady 68).
- c6-ch07-t03's check that asks 5/6 to 10/12 again, and "jodna": open (sections 1 and 2).
- c4-ch06-t01's "ginti hazaar se bhi upar" and a fragment short reason: open (section 2); the short reason heard in director37 is
  steady 74's, which is untrue, not a fragment (section 1).
- c4-ch01-t02's fragment short reason: open (section 2).
- Hindi forms that are the same Hinglish reworded (c5-t01, c4): open (4.11).
- Answer boards for cards that state a value over their posing board, which needs a checker rule for a table whose "?" cells the
  answer fills: open (4.13). The rule is written first.

---

## 4. Across all scripts

Each item says what the form must do, with its count from the sources and one quoted example. Where the form is not in a
lesson script, the file is named.

**4.1 Worked closes that make a 72 to 75 word turn with the next card.** Director37 "What is left" 2: "the end of a worked
problem with the next card, 72 to 75 words in two topics" (c5-ch02-t03: steady 20, stuck 34, offtopic 20, steering 32;
c6-ch07-t03: steady 26, stuck 50, offtopic 20, steering 40, "73 to 75 words (×4)"). CONTEXT-notes counts 13 such turns of 66 to
75 words in the final offline walk, and the walk's split of a close from its card was taken out (RULING-G item 3), so the
length is the script's: the close (`workedExample.answer`, `why`) and the next card's `prompt` together. Example, c6-ch07-t03
stuck 50 (75 words): "Haan, bilkul theek. Toh poora jawab: 6/8 aur 9/12, dono mein 4 bade hisson mein se 3 rangeen: rang barabar
hai, kyunki dono pattiyon ke hisse ek size ke kiye, tabhi ginti ki tulna sahi hui. Ab ek sawaal tum akele karo. Pooja ne ek cake
…". In the other seven topics the judges heard this turn at 43 to 69 words and say it served the child.

**4.2 Reply forms for a name.** "Arre wah, X!" and "Oho, X!" are heard as her calling the child X; "Achha, toh X!" reads right
"to all who met it" (director37 "What is left" 3: four judges). Four rows: c5-t01 steady 42 ("Arre wah, Rohit! Achha kiya jo
bataya.") and offtopic 56 ("Oho, Rohit! Yeh achhi baat batayi."), c5-t02 offtopic 30, c6-ch06-t01 offtopic 30. The forms are
`replyKinds.person[1]` and `[2]` in `data/lesson-aside-replies.json` (shared by every lesson, not inside a lesson script; RULING-H
gives them to Learning); `person[0]` is the form heard right (c4 offtopic 10, c5-t01 steering 28, c5-t02 steering 28, c5-t03
offtopic 46, c6-ch06-t01 steering 28, c4-ch01-t02 steady 46 and offtopic 10). A reply to a name must read as "so it was X".

**4.3 Return forms that open on a back-to word.** A return led by a verdict opens on a back-to word only where the script has
such a form (cause D1); otherwise the verdict leads. Director37 "What is left" 4: "said cold after a verdict where the script
has no back-to form (17 rows)"; carried clause 8 fires in c5-t01 and c6-ch07-t01 (a script matter). Example, c5-t01 steady 40:
"Haan, sahi hai: har gap 1/8 ka, aur aise 5 gap mile toh 5/8. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?" Of the
nine scripts' `joints.asideReturn` forms only c5-ch02-t02's `[2]` opens on one ("Jaisa kaha tha, …", heard steady 46); c4-ch06's
`[2]` ("{aside} ki baari aa gayi: …") was named by its judge. The told-side-topic return ("X ki baat tumne ki thi: tab tumhare
saath kaun tha?") is the walk's (`server/brain/say.js`, `RETURN_TOLD` forms), so its back-to opener is a form the script must
supply for the walk to put before it. If director37's judges had heard the back-to word as one more fixed form in three of nine,
D1 would be dropped (it was not).

**4.4 A return form for a side-topic the child TOLD.** Both liking return forms of c6-ch07-t01 and c6-ch07-t03
(`joints.asideReturn[1]`, `[2]`) ask what the child likes and drop what was told (RULING-H). Four rows: c6-ch07-t01 steady 44,
stuck 58, steering 38; c6-ch07-t03 steering 26. Example, after "kal maine cricket khela, sixer maara": "Cricket wali baat batao
na, tumhe uski kaunsi baat pasand hai?" The form must keep what the child told (the c6-ch07-t01 judge's register 4: returns
"that pick up what the child told"). The told returns in other topics ("tab tumhare saath kaun tha?") were heard as keeping it
(c6-ch06-t01, c4-ch01-t02 reports).

**4.5 Goodbye replies by kind.** The wrap's reply to "thoda mushkil tha" and its like does not hear the child: "every report"
(director37 "What is left" 3); nine of nine in director36. The forms are each script's `wrap.ack`, chosen as if any answer were
the same. Heard: c4 steady 108 "Achha, theek hai, maine sun liya." (`wrap.ack[2]`); c5-t01 steady 96 and c5-t02 steady 120
"Theek hai, samajh gayi."; c6-ch07-t01 steady 86 "Hmm, achha, sun liya."; c4-ch01-t02 steady 118 "Achha, theek hai."
(`wrap.ack[0]`); c4-ch06-t01 steady 100 "Achha, theek hai, maine sun liya." to "mujhe laga aisa hi hoga"; c6-ch06-t01 steady 100
"Theek hai, samajh gayi." to "jaise aapne samjhaya tha, waise hi kiya"; c5-t03 steady 92 "Theek hai, achha hua tumne bataya." to
"achha laga" (flat); c6-ch07-t03 steady 84 "Theek hai, batane ke liye shukriya." to "aasaan laga" (flat). Each script needs a
reply for each kind of answer the wrap's question invites (it was hard; it was easy or liked; something else), so that a child
who says "thoda mushkil tha" hears that it was heard. The walk's choosing by kind is director36 decision 3(d).

**4.6 The said-again form "Haan, yeh pehle bhi suna."** Two judges (director37 "What is left" 3): c4 offtopic 58 "Achha, wahi
sixer maara! Haan, yeh pehle bhi suna." and c6-ch06-t01 offtopic 52 "Achha, wahi cricket! Haan, yeh pehle bhi suna.": "flat or
cold", "accurate, but cold". The form is `againReplies[2]` of every kind in `data/lesson-aside-replies.json`. The c4 judge also
hears `againReplies[0]` "Haan, cricket, yeh tumne bataya tha na!" (offtopic 54) as "slightly off: the child never said she likes
it"; the c4-ch06-t01 judge calls the same form "natural, authored" (offtopic 60). Both readings are given here; see the final
note on what the run shows.

**4.7 A point's two wordings that share one image.** Director37 "What is left" 5: "the point's other wording after a point where
the script's two wordings share an image (c6 ch07-t01's roti, now heard more often because of M3)". A plain "nahi" at a
check-in is now answered with the point's other wording (served in about 25 rows), so `pointAlt` is heard far more than before.
Example, c6-ch07-t01 stuck 6: "Socho chaar dost yeh roti barabar baant-te hain. …" after the hook "Socho, chaar log ek roti
barabar baantein." Also c6-ch07-t03 stuck 6, steering 6 (report-c6ch07t03, help). Each point's `pointAlt` comes at the idea from
another image than its point and its hook.

**4.8 Remediation wordings that must be true of the follow-up card's board.** The walk says a remediation's wordings as help at
its follow-up card, over that card's board (judges in five topics say they served the child; c4 stuck 30, 32; c6-ch06-t01 stuck
46, 48; c6-ch07-t03 stuck 40). CONTEXT-notes lists 22 rows under the pending check `thenHelpOtherBoard` for this order. Rule of
director36: a sentence that names a figure is true of every board the walk can put under it. Example that holds, c4 stuck 32:
"… Board ki chocolate ke jo tukde khaye gaye, unke liye Pinky ka 2/4 theek hai ya Golu ka 2/2?" (`skills[0].remediation[1].then.reask`).

**4.9 An own step's second wording.** The walk could not drop the worked problem's easier wording at an own step without making
"this is the simplest way I have" untrue (rejection C4, c5-ch02-t02 stuck 46); CONTEXT-notes asks Learning for an own step's
second wording, and to mark a worked wording that is about one step (pending `ownStepWorkedHelp`: 2 rows). Example, c5-t02 stuck
44: "Abhi yeh sahi nahi hai. Ise baantne ki tarah socho: ek chocolate do bachchon mein barabar bati, … Tumhari baari: bada
hissa kisko mila, Rahul ko ya Sana ko?" ("a new angle but did not help").

**4.10 A wording for after a told answer that comes at it from a new angle.** Rejection C6: a script's `whyShort` is the same
reason cut short; after a told answer it is the answer again (3 of 3), so it was taken out. No row of this run, because the walk
no longer says it. Each card whose answer can be told needs a wording for after it that is not its `why` again.

**4.11 Hindi forms that are Hinglish reworded.** Carried from director36 mechanism 10. Rows: c5-t01 steady 38, stuck 10,
offtopic 32; c4 steady 36, steering 8; c5-t02 steering 8; c5-t03 offtopic 36 (said cold); c4-ch06-t01 steering 8 (repeats the
hint); c6-ch07-t03 stuck 10, steering 8 (overlaps the hint). Example, c5-t01 steady 38: "Achha, ab Hindi mein bolti hoon. Ab
poori line 8 gap mein bhi bati hai. 0 se 5 gap aage jao, toh kaunsa fraction aata hai?" A `hindi` form says the card in Hindi
words, does not repeat the hint just said, and uses the lesson's own word for a thing (c4: "bhinn" against "fraction").

**4.12 "Toh poora jawab:" and "Tumhari baari:" as fixed frames.** Director37 "What is left" 6: "'Toh poora jawab:' three times a
lesson; 'Tumhari baari:'; one miss form seven times in a lesson". In this run "Toh poora jawab:" is said three times in every
one of the nine steady lessons. It is the walk's, not a script field (`server/brain/say.js`, the worked close; status notes call
it "the walk's"), so a script can only change what follows it (`workedExample.answer`, `why`). "Tumhari baari:" opens every
`workedExample.yourStep.prompt` in c4-ch06-t01 and c6-ch07-t03 and is heard four times in c4-ch06-t01 offtopic; c6-ch07-t03
steady 24/26 hears "Tumhari baari:" then "Chalo, ab tumhari apni baari."; c4 steady 92/96 the same. The miss form "Abhi yeh sahi
nahi hai" seven times in c4-ch01-t02 steady is the walk's table, not a script field. Judges' register 4 (c4-ch06-t01): "the
scaffolding labels ('Tumhari baari', 'Toh poora jawab') were dropped".

**4.13 Answer boards for closing questions and for cards whose key is said over the posing board.** Director37 decision item 4.
Closing questions: c6-ch07-t03's teachback (steady 82, section 1). Cards with no `answerBoard` in the run's scripts (counted from
the scripts): c6-ch07-t01, 11 (`skills[0].explain[2].ask`, `skills[0].checks[0..1]`, `skills[0].remediation[0..1].then`,
`skills[1].explain[1].ask`, `skills[1].checks[0..1]`, `skills[1].remediation[0].then`, `skills[2].explain[1].ask`,
`skills[2].checks[1]`); c4-ch06-t01, 11 (`skills[1].explain[0].ask`, `[2].ask`, `skills[1].checks[0..1]`,
`skills[1].remediation[1].then`, `skills[2].explain[0..2].ask`, `skills[2].checks[0]`, `[2]`, `skills[2].remediation[0].then`);
c6-ch07-t03, 7 (`skills[1].explain[0].ask`, `skills[2].explain[0..2].ask`, `skills[2].checks[0]`,
`skills[2].remediation[0].then`, `teachback`); the other six scripts, 0. Several need a table whose "?" cells the answer fills,
which the checker's figure rule refuses today: the rule is written first (director36 order 025, section 4).

**4.14 K1: values she states that no board draws** (none is denied by its board, so none is a contradiction; each is said in the
card's `why` or point over a board that does not draw it).
- c4-ch05-t01: steady 64 and offtopic 66 "4-4 wale 2 group" over the 3×8 board (`skills[1].explain[1].ask.why`); steady 90
  "dhai" and "doosri 6 mein" over a 3-part bar (`skills[2].explain[2].ask.why`); steady 98 Farhan's 8-piece chocolate over the
  Gita board (`skills[2].checks[1].prompt`); steady 70 "3 barabar group" over the 5×3 grid
  (`skills[1].workedExample.steps[0].ask.right`).
- c5-ch02-t01: steady 52 "1/5 par" (`skills[1].workedExample.yourStep.whyAlt`); steady 82 "3/3 = 1 aur 6/3 = 2"
  (`skills[2].checks[0].why`); steady 84 "1 aur 5/6" (`skills[2].checks[1].why`); steady 94 "1 aur 2/7" (`teachback.why`);
  stuck 68 "3/3" (`skills[1].explain[1].ask.whyAlt`).
- c5-ch02-t02: steady 94 "pehla mark 1/4 … 2/8" over an unlabelled line (`skills[2].explain[3].point`); steady 96 "4/8 banta
  hai" (`skills[2].explain[3].ask.why`); steady 98 "1/3 … 1/7" over an unlabelled line (`skills[2].workedExample.steps[1].told`).
- c5-ch02-t03: "yahi 2/5 bhi hai" over the 4/10 strip (steady 32, stuck 60, offtopic 46, steering 44;
  `skills[1].explain[1].point`); "5/6" (steady 48, stuck 74); "1/2 = 3/6" (steady 68; `skills[2].explain[2].ask.why`); "1/12"
  (steady 58, offtopic 70); "1/10" (steady 78); "12 hisson wali patti" (stuck 64, offtopic 58;
  `skills[1].remediation[0].then.whyAlt`); "3/15" (offtopic 62; `skills[1].workedExample.yourStep.whyAlt`). Borderline, not
  counted by the judge: the s2 e3 point board marks 1/2 at the card's answer.
- c6-ch06-t01: 29 m (steady 10, stuck 50, offtopic 6, steering 22; `skills[0].remediation[0].then.why`); 50/52 cm (steady 66;
  `skills[1].checks[1].why`); ₹1500 (steady 84; `skills[2].checks[1].why`); 72 cm (steady 98; `teachback.why`).
- c6-ch07-t01: "10 cm / 6 cm" (steady 12) and "5 cm, 3 cm" (steady 14, stuck 30) at s1 e3, which has no answer board; "4 cm"
  (c1), "20/15 cm" (c2), "12 cm", "8 cm", "1/9", "1/7"; "100/50 cm" (steady 68); "500/125 cm" (steady 78); "1/10 sabse chhota"
  over the open slot (director36 ruling 4). Cards in 4.13.
- c4-ch01-t02: steady 70, the tester on R (`skills[1].workedExample.why`); steady 74, the tester on the pages
  (`skills[1].checks[0].why`); steady 96 "sirf 1 nishaan" (`skills[2].explain[2].ask.why`).
- c4-ch06-t01: "30 centimetre bacha" (steady 48, stuck 66, offtopic 62; `skills[1].explain[0].ask.why`, `whyShort`); "208"
  (steady 58, offtopic 74); "600" (steady 64); "50" (steady 66); "105" (offtopic 72); "3 metre" (steady 72); "15 centimetre" over
  "15 metre likhi" (steady 76). Cards in 4.13.
- c6-ch07-t03: "15/20" over the bare 3/4 bar (steady 38, stuck 68, offtopic 44; `skills[1].explain[0].ask`); the s3 verdicts over
  their posing boards (steady 68, 70, 72, 78); the closing verdict on a cleared screen (steady 82, section 1). Cards in 4.13.

---

## 5. Not for Learning (do not try to cure these in a script)

- **The four-hearing cap** (keys told while a wording was unsaid: c5-t01 steering 22, c6-ch06-t01 steering 22, c6-ch07-t03 stuck
  42 and steering 22; eight hearings in c4-ch01-t02 offtopic 22 to 46): the walk's next round (ruling 1; decision item 3).
- **The park after a let-go line** (c4-ch01-t02 steady 40: let-go line, park and back-to line in one turn): the walk's next round.
- **The picture kept through the card** where the card's board is the same figure (c4-ch06-t01 steering 16; c4-ch01-t02
  steering 16 is right to give way): the walk's next round (ruling 5).
- **Credit for the method at a step slip** ("Nahi, kuch aur hai" at c6-ch07-t01 stuck 31/32 and offtopic 16): the walk's next
  round.
- **The stop menu after a plain stop** (c4 stuck 70, c5-t01 stuck 78 and steering 54, and others): the owner's form.
- **Anything around the safety turn** (no safety turn fired in director37): the owner's, frozen code.

Also the walk's, named so authors do not chase them: "Toh poora jawab:" itself (4.12), the miss-form table ("Abhi yeh sahi nahi
hai"), "Ab tak samajh aaya?" after a "nahi", the go-on lines and how joints are stacked, the turn lengths of verdict, lead-in and
problem (64 to 72 words) and of miss, remediation and card (c5-t02 steady 86, 70 words), and the harness items (the meter's "1 aur
2/7", "nahi" recorded as `ack`).

## 6. How this order is checked

Authors work one script each, with the script checker green in every mode before and after; every changed card is solved again
from its words and its board. A reader who has not seen the script reads it cold on the six passes of 024, then the offline walk
of all four children row by row for every changed script, the lesson as heard, each sentence against the board the walk put under
it. A finding that a sentence is said over a board it is untrue of is the script's to cure. c4-ch06-t01 and c6-ch07-t03 are also
put through the live-only rules before their next judged run (director36 decision item 2).
