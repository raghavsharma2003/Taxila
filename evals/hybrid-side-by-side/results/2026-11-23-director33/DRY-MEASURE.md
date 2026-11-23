# MEASURE — d33 integration, final code (HEAD b124e5701 on main/d33-code, main's B3 ruling of 2026-11-23 built), dry matrix, no model
Gated: all gated predicates read 0 on the 36 lessons (check-run exit 0: live six `d33w/r2/`, staged three `d33w/s2/`); new: whyAltNoMiss 0 (2 on the previous r4/s4: steady c4-ch05-t01 98 after a right answer, stuck c4-ch01-t02 62 a give-up with no answer); helpNotOwn 0, helpLadder 0, requestHelped 0; vpcUnlisted 0, splitEndsOnCheckin 0, dekhoOver 0, returnAsksAgain 0, questionThreeRunning 0, yourTurnNotThird 0, reasonTwice 0, startLineNotGreeting 0, keyCheckinBareCard 0, spentThenReturn 0.
Counted: live six: vpcWhole 8, repeatedAuthored 7, reaskNoForm 5, reasonTwiceAuthored 3 (pointNoFit, cardNoFit, workedNoFit, twinsData, parkCutByChildEnd 0); staged three: vpcWhole 2, reasonTwiceAuthored 3, repeatedAuthored 1, reaskNoForm 1 (unchanged). Counts baseline: 18 moved, all c4-ch05-t01 steady (main's shortened s3 worked close).
Suites: 336 test files (files.txt), 4176 pass, 0 fail (1 TODO, RCA-4b, unchanged); before the re-pins 4174 / 2.
Second helps at a card (unkeyed help turns, the second at one card; d33w r2/s2 steady):
- c4-ch05-t01 steady: own reason 1 (10), point's other wording 0
- c5-ch02-t01 steady: own reason 1 (8), point's other wording 0
- c5-ch02-t02 steady: own reason 1 (8), point's other wording 0
- c5-ch02-t03 steady: own reason 2 (10, 84), point's other wording 0 (1 other: neither)
- c6-ch06-t01 steady: own reason 1 (8), point's other wording 0
- c6-ch07-t01 steady: own reason 1 (6), point's other wording 0
- staged c4-ch01-t02 steady: own reason 1 (8), point's other wording 0 (2 other)
- staged c4-ch06-t01 steady: own reason 2 (10, 88), point's other wording 0
- staged c6-ch07-t03 steady: own reason 1 (8), point's other wording 0

Columns: rows = the lesson's director rows. Hindi = the child row index+1 (her reply row): whether a joints.hindiSwitch form is in it, the reply's cell column/part (+form when a pageParts entry names a hindi form: this reading found none — the switch line is said where the card has a form, B1, and hindiCard/hindiPromiseNoForm read 0). Picture = reply row: cell.picture. Check-in endings = her turns whose last seam is `checkin`, as row<seam before it. yourTurn = her turns ending on a joints.yourTurn form. split = rows with noFit "vpc". Longest run = her turns running at one card ending on its question or the invitation / the same question (question-run.js questionPathOf) heard on turns running — raw: it does not drop the Hindi-form and hear-the-question turns questionThreeRunning drops (the gate reads 0). Dekho/Suno = counts of "Dekho," / "Suno,". 66-70 / >70 = turns by kind (vpc = verdict, point and card in one turn).

Check-ins per steady lesson now (director32 live): c4 6 (4), c5-t01 4 (5), c5-t02 8 (6), c5-t03 3 (4), c6 3 (2), c6-ch07 3 (4 staged); staged c4-ch01-t02 3, c4-ch06-t01 3, c6-ch07-t03 3. None is a vpc split's (0 splits). Still after a right verdict (not the split; the worked close / close-alone rules): c4 steady 62, 96, 108; c5-t01 94; c5-t03 90; c6-ch07 82; c6-ch07-t03 82.

| topic | child | rows | Hindi requests (row: switch line?, cell column/part, +form) | picture requests (row: cell.picture) | check-in endings (n: row<part before) | yourTurn rows | split | longest run at one card / one question heard running | Dekho/Suno | turns 66-70 / >70 by kind |
|---|---|---|---|---|---|---|---|---|---|---|
| c4-ch05-t01 | offtopic | 75 | 32: switch, hindi/check:c2 | 26: view | 4: 42<bridge, 54<verdict, 68<remediation, 72<verdict | 52, 60 | 0 | 4 / 4 | 1/1 | >70: explain 1; 66-70: worked_example 1, explain 2 |
| c5-ch02-t01 | offtopic | 87 | 32: switch, hindi/check:c2 | 26: view | 2: 44<bridge, 86<bridge | - | 0 | 4 / 2 | 1/1 | >70: explain 2 |
| c5-ch02-t02 | offtopic | 85 | 32: no switch, hindi/check:c2 | 26: view | 5: 36<bridge, 56<remediation, 72<remediation, 74<help, 82<bridge | 18, 66 | 0 | 3 / 2 | 2/1 | 66-70: explain 1, vpc 1, practice 1 |
| c5-ch02-t03 | offtopic | 75 | 32: switch, hindi/check:c1 | 26: view | 2: 36<bridge, 72<bridge | 6, 14, 56 | 0 | 4 / 2 | 3/1 | 66-70: vpc 1, worked_example 1; >70: practice 1, explain 1 |
| c6-ch06-t01 | offtopic | 73 | 32: switch, hindi/check:c2 | 26: view | 2: 34<bridge, 70<bridge | 18 | 0 | 2 / 2 | 1/3 | 66-70: explain 1 |
| c6-ch07-t01 | offtopic | 71 | 32: no switch, hindi/check:c2 | 26: pictureBoard | 2: 34<bridge, 62<bridge | 26 | 0 | 3 / 2 | 3/1 | 66-70: explain 1, vpc 1, worked_example 1, practice 1; >70: explain 1 |
| c4-ch05-t01 | steady | 113 | 36: no switch, hindi/worked:yourStep | 18: view | 6: 54<bridge, 62<verdict, 76<bridge, 96<verdict, 98<help, 108<verdict | 10, 30 | 0 | 3 / 2 | 2/1 | 66-70: explain 1, worked_example 1, wrap 1 |
| c5-ch02-t01 | steady | 99 | 38: switch, hindi/e1:card | 18: view | 4: 34<bridge, 68<bridge, 86<remediation, 94<verdict | 8 | 0 | 3 / 2 | 0/2 | 66-70: practice 1; >70: explain 2, wrap 1 |
| c5-ch02-t02 | steady | 127 | 36: no switch, hindi/check:c3 | 18: view | 8: 38<bridge, 46<remediation, 58<remediation, 60<help, 78<bridge, 84<remediation, 104<remediation, 122<key | 8, 18, 120 | 0 | 3 / 2 | 0/3 | 66-70: explain 2, practice 1, wrap 1 |
| c5-ch02-t03 | steady | 95 | 36: switch, hindi/e1:card | 18: view | 3: 32<bridge, 62<bridge, 90<verdict | 10, 84 | 0 | 3 / 3 | 1/3 | 66-70: vpc 1, practice 1, explain 1, worked_example 1; >70: practice 1 |
| c6-ch06-t01 | steady | 93 | 36: switch, hindi/e1:card | 18: view | 3: 32<bridge, 66<bridge, 88<key | 8 | 0 | 3 / 2 | 0/1 | 66-70: explain 3, wrap 1 |
| c6-ch07-t01 | steady | 87 | 36: no switch, hindi/worked:yourStep | 18: pictureBoard | 3: 24<bridge, 52<bridge, 82<verdict | 6 | 0 | 4 / 2 | 3/1 | 66-70: explain 1, vpc 1, practice 1 |
| c4-ch05-t01 | steering | 59 | 8: switch, hindi/rem:1:then | 14: view; 16: hint | 2: 16<help, 56<bridge | 14, 30 | 0 | 5 / 4 | 1/1 | >70: explain 1; 66-70: worked_example 1 |
| c5-ch02-t01 | steering | 53 | 8: no switch, hindi/rem:2:then | 14: view; 16: hint | 2: 18<key, 50<bridge | 10, 16 | 0 | 6 / 2 | 0/2 | 66-70: explain 1, practice 1 |
| c5-ch02-t02 | steering | 71 | 8: no switch, hindi/rem:0:then | 14: view; 16: hint | 3: 18<key, 44<bridge, 54<remediation | 10, 16, 60 | 0 | 6 / 2 | 0/2 | >70: explain 1; 66-70: vpc 1 |
| c5-ch02-t03 | steering | 53 | 8: switch, hindi/e1:card | 14: view; 16: hint | 1: 42<bridge | 14, 48 | 0 | 4 / 3 | 3/0 | 66-70: explain 1, worked_example 1; >70: practice 1, explain 1 |
| c6-ch06-t01 | steering | 59 | 8: no switch, hindi/rem:0:then | 14: view; 16: hint | 2: 18<key, 40<bridge | 10, 16 | 0 | 6 / 2 | 0/0 | >70: explain 1; 66-70: practice 1 |
| c6-ch07-t01 | steering | 57 | 8: switch, hindi/e1:card | 14: pictureBoard; 16: view | 1: 40<bridge | 16 | 0 | 4 / 3 | 0/2 | >70: explain 1; 66-70: practice 1 |
| c4-ch05-t01 | stuck | 71 | 8: switch, hindi/e1:card | 18: view | 2: 56<bridge, 68<verdict | 26, 32, 66 | 0 | 6 / 3 | 1/1 | >70: explain 1, hint 1; 66-70: worked_example 1 |
| c5-ch02-t01 | stuck | 67 | 8: switch, hindi/e1:card | 18: view | 2: 40<key, 64<bridge | 20 | 0 | 3 / 3 | 0/2 | 66-70: explain 1, hint 1, practice 1 |
| c5-ch02-t02 | stuck | 79 | 8: switch, hindi/e1:card | 18: view | 3: 40<key, 52<bridge, 60<remediation | 20, 38, 66 | 0 | 3 / 3 | 2/1 | >70: explain 1 |
| c5-ch02-t03 | stuck | 73 | 8: switch, hindi/e1:card | 18: pictureBoard | 2: 40<key, 50<bridge | 20, 38, 48 | 0 | 3 / 3 | 0/3 | 66-70: explain 1, vpc 1, worked_example 1; >70: practice 1 |
| c6-ch06-t01 | stuck | 81 | 8: switch, hindi/e1:card | 18: hint | 1: 48<bridge | 44, 74 | 0 | 3 / 3 | 0/3 | >70: explain 1; 66-70: reteach 1, explain 1 |
| c6-ch07-t01 | stuck | 71 | 8: switch, hindi/e1:card | 18: pictureBoard | 2: 42<key, 54<bridge | 20, 40, 64 | 0 | 3 / 3 | 0/3 | >70: explain 1; 66-70: vpc 1 |
| c4-ch01-t02 | offtopic | 67 | 32: no switch, hindi/rem:0:then | 26: pictureBoard | 1: 46<bridge | 14, 56 | 0 | 4 / 2 | 0/0 | 66-70: worked_example 1 |
| c4-ch06-t01 | offtopic | 67 | 32: switch, hindi/check:c3 | 26: pictureBoard | 1: 34<bridge | 26, 46, 58 | 0 | 4 / 3 | 0/0 | 66-70: explain 1, vpc 1; >70: explain 1 |
| c6-ch07-t03 | offtopic | 71 | 32: switch, hindi/check:c2 | 26: pictureBoard | 2: 36<bridge, 68<bridge | 26 | 0 | 3 / 3 | 0/3 | 66-70: explain 2, practice 1, worked_example 1 |
| c4-ch01-t02 | steady | 115 | 36: switch, hindi/worked:yourStep | 18: view | 3: 52<bridge, 74<bridge, 110<key | 30, 86 | 0 | 4 / 4 | 0/3 | 66-70: worked_example 1, practice 1; >70: worked_example 1 |
| c4-ch06-t01 | steady | 101 | 36: switch, hindi/check:c3 | 18: pictureBoard | 3: 38<bridge, 66<bridge, 96<key | 10, 88 | 0 | 3 / 2 | 2/2 | 66-70: worked_example 1, practice 1, wrap 1 |
| c6-ch07-t03 | steady | 87 | 36: switch, hindi/e1:card | 18: view | 3: 32<bridge, 64<bridge, 82<verdict | 8 | 0 | 3 / 2 | 0/3 | 66-70: explain 2, practice 1, worked_example 1, wrap 1 |
| c4-ch01-t02 | steering | 59 | 8: switch, hindi/e1:card | 14: view; 16: hint | 1: 34<bridge | 16, 50 | 0 | 4 / 2 | 2/1 | 66-70: worked_example 1 |
| c4-ch06-t01 | steering | 65 | 8: no switch, hindi/rem:0:then | 14: pictureBoard; 16: hint | 1: 38<bridge | 10, 16, 54 | 0 | 6 / 2 | 2/0 | 66-70: explain 1, worked_example 1, practice 1 |
| c6-ch07-t03 | steering | 59 | 8: no switch, hindi/rem:0:then | 14: view; 16: none | 2: 18<key, 40<bridge | 10, 16 | 0 | 6 / 2 | 1/2 | >70: explain 1; 66-70: practice 1 |
| c4-ch01-t02 | stuck | 83 | 8: switch, hindi/e1:card | 18: pictureBoard | 2: 42<missVerdict, 56<bridge | 38, 62, 74 | 0 | 5 / 2 | 3/1 | 66-70: worked_example 1 |
| c4-ch06-t01 | stuck | 77 | 8: switch, hindi/e1:card | 18: pictureBoard | 1: 48<bridge | 34, 60, 70 | 0 | 4 / 4 | 0/0 | 66-70: explain 1, vpc 1; >70: explain 1 |
| c6-ch07-t03 | stuck | 81 | 8: switch, hindi/e1:card | 18: pictureBoard | 2: 40<key, 54<bridge | 20, 38, 50, 64 | 0 | 3 / 3 | 1/0 | >70: explain 1; 66-70: practice 1 |
