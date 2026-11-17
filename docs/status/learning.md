# Learning status

Newest entry first. Per main's 029: reports go here and in commit messages, not by message.

## 2026-11-17 · `df3137f07`..`e66faa2e1` patch 014 (director25 list): done in the four pilots; one dry-matrix predicate and one test left for the main loop

**New fields (exact names, for the runtime agents building H4):**
- `explain[].ask.simpler` `{ hi, en }` on every explain card in all four pilots (c4 8 new, c5-t01 8 new + 1 kept, c5-t02 11, c6 9). Each is a
  nudge from that card's own board (a count, a move or another side), never the point again, never the `pointAlt`, never the key.
  The runtime already reads `ask.simpler` (state.js `helpSpentOn`, the give-up and Hindi paths).
- `joints.helpSpent`: three `{ hi, en }` forms, said when Hindi is asked and no unsaid wording is left ("Isse aasaan shabd mere paas
  nahi hain …"); the question follows.
- `joints.afterKeyGoOn`: three forms for "pata nahi" after a worked answer: we will meet this again, and go on. No blame, no praise.
- `joints.hindiSwitch`: same name, three new forms per pilot that promise other, easier words, never "Hindi".
- `wrap.didFrames[1]`: "Aaj tumne {did}, yeh (baat) yaad rakhna" → "Aaj ek kaam tumne khud karke dikhaya: {did}."
- `scripts/lesson-scripts/check.mjs` (`df3137f07`, the only code change): `helpSpent` and `afterKeyGoOn` are allowed joint kinds
  (optional, so the 30 staged scripts still pass), and a `hindiSwitch` no longer has to say "Hindi". Nothing else changed.

**Checks.** `node scripts/lesson-scripts/check.mjs` passes on all four: c4 ok, c5-t01 ok, c5-t02 ok, c6 ok (structure, boards and runtime 0).
The compile report shows 0 missing fields, 0 rule holes and 0 doubles for all 34 scripts, as before. `tests/r7-compile.test.mjs`: 7 of 7.
`tests/r7-dry-matrix.test.mjs` fails on two assertions:
- The predicate assertion: `offtopic-c5-ch02-t01 60 cardWholeAgain`. S2 e2's card now has a hint of its own, and the walk spends it on
  the first miss (row 58). On the second miss (row 60) it says the e2 point and then the whole card again, though the card was said
  whole at row 56. Help after a miss is chosen in the walk, which H4 replaces. The script is not at fault.
- The counts assertion (it runs once the first passes; diffed by hand with `counts.mjs`): c4 steering turnsOver60Words 4→3; c5-t01
  offtopic cardsSaid 12→13, cardsSaidAgainWithin2 0→1, give_up 5→4, wrong 2→3, hint 2→3, reteach 3→2, reads incorrect 2→3,
  no_evidence 22→21; c5-t01 steady openersFellBack 29→28, turnsOver60Words 8→7; c5-t01 stuck turnsOver60Words 1→0; c5-t02
  openersFellBack offtopic 13→11, steady 28→25, steering 11→10, stuck 9→8; c5-t02 steering turnsOver60Words 3→2; c6 steady
  turnsOver60Words 7→4, stuck 2→1. The baseline is left for the main loop to regenerate at merge.

Of the other test files that read the scripts or the checker (37), two things fail. `tests/r8-learning-director20.test.mjs` line 26 asserts
that every `hindiSwitch` en says "Hindi", which is the rule dc-r8-director25 reverses: that assertion needs rewriting with the
decision. I do not change tests. `tests/r7-audit-docs.test.mjs` fails with ENOENT on docs that this sparse checkout leaves out.

**Length.** I word-counted every point, `pointAlt`, worked problem and `problemAlt`, worked step (do: result, kyunki why), remediation
`say` and `sayAlt`, and bridge. None is over 45 words in the Hinglish (the longest is 45), and none in the English gloss either.

**Left as it was, and why:**
- c6 "perimeter" in the greeting. No script text says it: the greeting is model-written from the kit's English title. The decision's
  rule (the greeting says the script's hook and nothing of the model's) is the runtime's.
- c5-t02 s1 e1's key text "neeche wali patti ka hissa chhota" is a grading field, so I left it. The card keeps "neeche/upar wali patti"
  for the strips. The point, `pointAlt` and `simpler` now name the number by its digits ("1/4 ka 4"), so "upar" and "neeche" have one
  sense in that turn.
- I kept "upar"/"neeche" for strips and for the line's two scales, because the keys, captions and boards use those words. Where a turn
  also used "upar"/"neeche" for a number, I renamed the number ("1/8 ka 8", "6/4 ka upar wala number 6, 4 se bada hai") or renamed
  the strips or scales ("ek/doosri patti", "ek taraf / doosri taraf"). c5-t01 s3 e2's `mustSay` requires "upar wala number 6", so
  there the point keeps "upar" for the number and the card keeps "line ke neeche".
- `asidePark` and `afterTryFirst` already have three forms in every pilot. Nothing was added.
- Second wordings that share 60-70% of their words with the line before were read one by one. Where they come at the idea from another
  side (a smaller case, a count, a different move), I kept them: c4 s1 e2 and s2 e1; c5-t01 s1 rem1 (the "kam jagah" image) and s3 e2;
  c5-t02 s3 e2; c6 s1 rem0 and rem1. Every one at 80% or more is rewritten.
- New `simpler`s stay on the board they are said over. The checker requires a `simpler`'s numbers to be on its board or in its givens
  (W10 and the givens rule). A remediation's `simpler` is said over its then-card's board. So "another object" means the same numbers
  with a different move or image, not new numbers.

**For Brain (seen while writing):** c5-t02 s3 rem0's `say` names strips of 3 and 5 parts, but it is said over the then-card's 6- and
10-part strips. The gate passes it today. I did not change it, because it is not on this list.

### Every changed sentence (Hinglish; the `en` gloss changed with it)

| Script | Field | Old | New | 014 item: the judge's row |
|---|---|---|---|---|
| c5-t01 | `s1 e1.ask.accept` (first Hindi form, inserted) | (the key was said from "isi line par") | woh isi line par aata hai | 5: steering 16 (raw key slot "Is sawaal ka sahi jawab: isi line par"); now heard as "Is sawaal ka sahi jawab: woh isi line par aata hai, kyunki …" |
| c4 | `joints.hindiSwitch[0]` | Theek hai, main yeh Hindi mein bolti hoon. | Theek hai, ise doosre, aasaan shabdon mein kehti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c4 | `joints.hindiSwitch[1]` | Haan, Hindi mein samjhaati hoon. | Haan, yahi baat aur seedhe tareeke se bolti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c4 | `joints.hindiSwitch[2]` | Achha, isko Hindi mein bolti hoon. | Achha, ise ek aasaan tareeke se kehti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c4 | `joints.helpSpent[0]` | (new) | Koi baat nahi, isse aasaan shabd abhi mere paas nahi hain. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c4 | `joints.helpSpent[1]` | (new) | Yeh sabse aasaan tareeka tha jo mere paas hai, toh sawaal phir se suno. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c4 | `joints.helpSpent[2]` | (new) | Main ise aur aasaan nahi kar paa rahi, par sawaal yeh raha. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c4 | `joints.afterKeyGoOn[0]` | (new) | Koi baat nahi, aisa sawaal aage phir aayega, tab saath mein dekhenge. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c4 | `joints.afterKeyGoOn[1]` | (new) | Theek hai, yeh baat hum phir milkar dekhenge; abhi aage badhte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c4 | `joints.afterKeyGoOn[2]` | (new) | Chalo, is tarah ka sawaal dobara milega; ab agli baat dekhte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c4 | `s1 e1.ask.simpler` | (new) | Roti ke tukde ungli se gino: ek, do. Ab dekho, rang inmein se kitne tukdon mein hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s1 e1.simpler` | Neeche wala number roti ke saare tukde ginta hai, rangin bhi aur bina rang ke bhi. Upar wala number sirf rangin tukde ginta hai. | Roti ke dono tukde ek jitne hain, isliye dono ka naam ek hi hai. Woh naam is baat se banta hai ki roti kitne tukdon mein kati. | 2: a second wording that shared its nouns and order with the line before |
| c4 | `s1 e2.ask.simpler` | (new) | Pizza ka chhota tukda uske bade tukde ke saath milaa kar dekho. Phir cake ke tukdon ko aapas mein milao. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s1 e3.ask.simpler` | (new) | Ek aur tukda rangin hua, toh ab rangin tukde gino. Circle ke kul tukde utne hi rehte hain. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s1 e3.simpler` | Circle ke tukde ek-ek karke gino: 3 tukde, aur teeno barabar, toh neeche wala number 3. Rangin tukda inmein se akela hai, isliye woh 1/3 hai. | Ek kaagaz ko teen barabar tukdon mein modo, aur ek tukde par rang karo. Woh rangin tukda kaagaz ka 1/3 hai. | 2: a second wording that shared its nouns and order with the line before |
| c4 | `s1 e4.point` | Is baar upar wali patti ke 8 barabar tukde hain. Ek mein rang, saat bina rang ke. Rangin tukda 1/8 hai. Dhyaan do, neeche wala number 8 hai, saare tukde. Bache hue 7 nahi. | Is baar upar wali patti ke 8 barabar tukde hain. Ek mein rang, saat bina rang ke. Rangin tukda 1/8 hai. Dhyaan do, 1/8 ka 8 saare tukde ginta hai, bache hue 7 nahi. | 5: upar/neeche in two senses (judge's script read, "upar" strip vs number) |
| c4 | `s1 e4.pointAlt` | Rangin tukde jaise 8 tukde ek ke baad ek rakho, toh poori upar wali patti ban jaati hai; isliye har tukda 1/8 hai. Ek tukda kha bhi lo, patti toh 8 tukdon se hi bani thi, isliye neeche wala number 8 hi rehta hai. | Rangin tukde jaise 8 tukde ek ke baad ek rakho, toh poori upar wali patti ban jaati hai; isliye har tukda 1/8 hai. Ek tukda kha bhi lo, patti toh 8 tukdon se hi bani thi, isliye 1/8 mein 8 hi rehta hai. | 5: upar/neeche in two senses (judge's script read, "upar" strip vs number) |
| c4 | `s1 e4.ask.why` | Raju ka tukda ribbon ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 neeche wala number nahi | Raju ka tukda ribbon ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte | 5: upar/neeche in two senses (judge's script read, "upar" strip vs number) |
| c4 | `s1 e4.simpler` | Upar wali patti ke saare tukde gino, rangin bhi aur bina rang ke bhi. Woh ginti hi neeche wala number hai. | Bina rang ke tukde gino, 7, phir rangin tukda bhi jodo, 8: 1/8 ka 8 yahi poori ginti hai. | 2: a second wording that shared its nouns and order with the line before |
| c4 | `s1 c1.did` | toote laddoo ke chhote-bade tukdon mein bada tukda poore laddoo se milaya | toote laddoo ka bada tukda poore laddoo se milaya | 3: read every did (in the order she did it, easy to say) |
| c4 | `s2 e1.ask.simpler` | (new) | Board par laddoo teen line mein hain, har line mein 4. Har line ko beech se do-do mein baanto, aur ek taraf ke laddoo gino. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s2 e2.point` | Ab yeh 24 aam dekho, 6 barabar group mein. 1/6 ka neeche wala 6 kehta hai: 6 barabar group banao. Upar wala 1 kehta hai: ek group lo. Toh 24 ka 1/6 hai 4 aam. 1/3 mein bhi yahi hota hai, bas neeche wala number 3 hai. | Yeh 24 aam dekho, 6 barabar group mein. 1/6 ka neeche wala 6 kehta hai: 6 barabar group banao. Upar wala 1 kehta hai: ek group lo. Toh 24 ka 1/6 hai 4 aam. 1/3 mein bhi yahi, bas neeche wala number 3 hai. | 6: over 45 words (47, 54) |
| c4 | `s2 e2.ask.prompt` | Ab 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge? | 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge? | 5: card opens with "Ab" (mech. 6) |
| c4 | `s2 e2.ask.simpler` | (new) | 6 group ko 3 bachchon mein ek-ek karke baanto. Ek bachche ke paas kitne group aaye, woh gino. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s2 e2.simpler` | Board par 6 barabar group hain, har group mein 4 aam. Ek group utha lo: woh 24 ka 1/6 hai, 4 aam. | Group-group karke 4 aam jodte jao jab tak 24 na ho jaayein: aise 6 group lagte hain. Isliye ek group, 4 aam, 24 ka 1/6 hai. | 2: a second wording that shared its nouns and order with the line before |
| c4 | `s2 e3.point` | Yeh 20 kanche hain, 2 barabar group mein, har group mein 10. Ek group ke 10 kanche 20 ka aadha hain, kyunki 1/2 ka neeche wala number 2 hai. Ulta bhi chalta hai: ek group ka size pata ho, toh gino ki aise kitne group bante hain; wahi ginti neeche wala number banti hai. | Yeh 20 kanche 2 barabar group mein hain. Ek group ke 10 kanche 20 ka aadha hain, kyunki 1/2 ka neeche wala number 2 hai. Ulta bhi chalta hai: ek group ka size pata ho, toh aise group gino; wahi ginti neeche wala number hai. | 6: over 45 words (47, 54) |
| c4 | `s2 e3.ask.prompt` | Ab socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain? | Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain? | 5: card opens with "Ab" (mech. 6) |
| c4 | `s2 e3.simpler` | Board par 2 barabar group hain. Ek group ke kanche gino: wahi 20 ka aadha hai. | Dono group ke kanche jodo: 10 aur 10, poore 20 kanche. Do barabar group saare kanche bana dete hain, isliye har group kanchon ka aadha hai. | 2: a second wording that shared its nouns and order with the line before |
| c4 | `s2 rem0.simpler` | Agar 5 thaile hon aur ek kisi ko de diya jaaye, toh woh thaila 5 mein se ek hai, bache hue thailon mein se nahi: neeche wale number mein shuru ke saare thaile aate hain. | Ginti wahi lo jo thaila dene se pehle thi, dene ke baad wali nahi. Dene se pehle board par 5 thaile the. | 2: a second wording that shared its nouns and order with the line before |
| c4 | `s3 e1.pointAlt` | Upar wali patti ko theek beech se modo, toh dono taraf bilkul barabar aati hain. Ek taraf ka tukda aadhi patti hai, 1/2, aur rangin tukda wahi hai. | Is patti ko theek beech se modo, toh dono taraf bilkul barabar aati hain. Ek taraf ka tukda aadhi patti hai, 1/2, aur rangin tukda wahi hai. | 5: "upar wali patti" over a one-strip board (script read) |
| c4 | `s3 e1.ask.simpler` | (new) | Pehli patti ka rangin aadha dekho, aur gino ki doosri patti ke kitne tukde us aadhe mein sama jaate hain. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s3 e2.ask.simpler` | (new) | Dono pizza ke tukde gino, phir dono ka ek-ek tukda aankh se milao. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s3 e3.point` | Yeh do patti ek jitni lambi hain. Upar wali patti 2 barabar tukdon mein kati hai, aur neeche wali patti 5 barabar tukdon mein. Fraction ka neeche wala number batata hai ki patti kitne barabar tukdon mein kati. | Yeh do patti ek jitni lambi hain. Upar wali patti 2 barabar tukdon mein kati hai, aur neeche wali patti 5 barabar tukdon mein. 1/2 ka 2 aur 1/5 ka 5 bas yahi batate hain ki patti kitne barabar tukdon mein kati. | 5: upar/neeche in two senses (script read) |
| c4 | `s3 e3.ask.simpler` | (new) | Dono patti ke pehle tukde ka aakhri sira dekho, aur dekho kiska sira aage tak jaata hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c4 | `s3 e3.simpler` | Neeche wala number sirf ginta hai ki patti kitne barabar tukdon mein kati. Upar wali patti 2 tukdon mein kati hai, aur neeche wali patti 5 tukdon mein. | Ek jaisi do rassi socho: ek 2 barabar tukdon mein kati, doosri 5 mein. Dono rassi ek jitni hain, bas kainchi alag-alag baar chali. | 2: a second wording that shared its nouns and order with the line before |
| c4 | `s3 c3.did` | 1/4, 1/10 aur 1/7 ko sabse chhote se sabse bade tak lagaya | teen chocolate ke tukde chhote se bade tak lagaye: 1/10, 1/7, 1/4 | 3: steady 132 (fractions listed in the card's order while saying smallest to largest) |
| c4 | `wrap.didFrames[1]` | Aaj tumne {did}, yeh baat yaad rakhna. | Aaj ek kaam tumne khud karke dikhaya: {did}. | 3: "yeh yaad rakhna" does not fit a thing done (c5-t01 steady 136) |
| c5-t01 | `joints.hindiSwitch[0]` | Achha, yeh baat Hindi mein kehti hoon. | Achha, yahi baat doosre shabdon mein kehti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c5-t01 | `joints.hindiSwitch[1]` | Bilkul, ab yeh Hindi mein bolti hoon. | Theek hai, ise aur aasaan tareeke se bolti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c5-t01 | `joints.hindiSwitch[2]` | Theek hai, main yeh Hindi mein bolti hoon. | Haan, ise seedhe, chhote shabdon mein kehti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c5-t01 | `joints.helpSpent[0]` | (new) | Isse aasaan shabd mere paas nahi hain, koi baat nahi. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c5-t01 | `joints.helpSpent[1]` | (new) | Main ise aur aasaan nahi bol paa rahi, toh sawaal phir se suno. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c5-t01 | `joints.helpSpent[2]` | (new) | Yahi sabse aasaan tareeka hai jo mere paas hai; sawaal yeh raha. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c5-t01 | `joints.afterKeyGoOn[0]` | (new) | Koi baat nahi, number line par yeh baat phir aayegi; abhi aage chalte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c5-t01 | `joints.afterKeyGoOn[1]` | (new) | Theek hai, aise sawaal hum aage phir karenge, tab saath mein dekhenge. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c5-t01 | `joints.afterKeyGoOn[2]` | (new) | Achha, is par hum dobara aayenge; ab agli baat dekhte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c5-t01 | `s1 e1.simpler` | Line ke theek beech mein ek mark hai. Woh line ko do barabar gaps mein baant-ta hai, isliye uska naam 1/2 hai. | 0 se beech wale mark tak ek gap, aur wahan se 1 tak ek aur: dono gap ek jitne lambe. Do mein se pehla gap, isliye 1/2. | 2: a second wording that shared its nouns and order with the line before |
| c5-t01 | `s1 e2.ask.prompt` | Ab line ke neeche dekho. Wahan 0 aur 1 ke beech 7 marks hain, sab barabar doori par. Line ke neeche kitne barabar gaps bane hain? | Line ke neeche dekho. Wahan 0 aur 1 ke beech 7 marks hain, sab barabar doori par. Line ke neeche kitne barabar gaps bane hain? | 5: stuck 40, offtopic 10, steering 32 ("Ab … Ab") |
| c5-t01 | `s1 e2.ask.simpler` | (new) | Line ke neeche marks ke beech ki khaali jagah gino, aur 0 ke baad wali aur 1 se pehle wali jagah bhi mat chhodna. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s1 e3.point` | Ab wahi 0 se 1, par line par 8 barabar gaps hain. Pehle 7 gaps the, ab zyada hain, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, aur woh 0 ke bahut paas hai. | Ab wahi 0 se 1, par line par 8 barabar gaps hain. Pehle 7 gaps the, ab zyada hain, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se theek ek gap door. | 5: stuck 45 (point called 1/8 "0 ke bahut paas") |
| c5-t01 | `s1 e3.pointAlt` | Ek chocolate ko 8 barabar hisson mein todo, toh har hissa 7 hisson wale se patla hota hai. Line par bhi 8 barabar gaps mein har gap chhota hai, isliye pehla mark, 1/8, 0 ke itna paas hai. | Ek chocolate ko 8 barabar hisson mein todo, toh har hissa 7 hisson wale se patla hota hai. Line par bhi 8 barabar gaps mein har gap chhota hai, isliye pehla mark, 1/8, 1/7 se pehle aata hai. | 5: stuck 45 (point called 1/8 "0 ke bahut paas") |
| c5-t01 | `s1 e3.ask.simpler` | (new) | Line ke upar aur neeche ka pehla gap ungli se naapo, aur dekho kaunsa gap chhota hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s1 e3.simpler` | Line ke 8 barabar gaps hain, aur pehla mark 1/8 sirf ek gap par hai. Yeh gap chhota hai, isliye woh mark 0 ke itna paas hai. | Line ke 8 barabar gaps ek-ek karke gino. Pehla mark pehle gap ke khatam hote hi aata hai. | 2: stuck 44 |
| c5-t01 | `s1 worked problemAlt` | Socho tum ghar se school paidal ja rahe ho, raasta 1 kilometre ka. Raaste mein 3 bijli ke khambe aise lage hain ki ghar, teeno khambe aur school, sab ek-doosre se barabar doori par hain. Ghar se nikalkar pehla khamba kitni door milega, yahi nikalna hai. | Socho tum ghar se school ja rahe ho, raasta 1 kilometre ka. Raaste mein 3 bijli ke khambe aise lage hain ki ghar, teeno khambe aur school, sab ek-doosre se barabar doori par hain. Pehla khamba kitni door milega, yahi nikalna hai. | 6: over 45 words |
| c5-t01 | `s1 rem0.simpler` | 6 chalk marks, 7 gap. Gap gino, toh pehla mark 1/7 metre par aata hai. | Line ke upar ungli 0 se 1 tak sarkao aur har khaali jagah par ek gino. Ginti chalk marks se ek zyada aati hai. | 2: stuck 32 |
| c5-t01 | `s1 rem0.sayAlt` | Kapde sukhane ki rassi socho, do deewaron ke beech, us par 6 clip: pehli deewar se pehle clip tak ek khaali jagah, clipon ke beech 5, aur aakhri clip se doosri deewar tak ek, kul 7. Ribbon ke chalk marks bhi aise hi 7 gap banate hain, isliye pehla mark 1/7 metre par hai. | Do deewaron ke beech kapde sukhane ki rassi par 6 clip socho: pehli deewar se pehle clip tak ek khaali jagah, clipon ke beech 5, aur aakhri clip se deewar tak ek, kul 7. Chalk ke 6 marks bhi aise hi 7 gap banate hain. | 6: over 45 words |
| c5-t01 | `s1 rem1.say` | Board par ek line hai: line ke upar aur line ke neeche ke gap 0 se 1 ka wahi ek poora baant-te hain. Fraction ka neeche wala number jitna bada, utne zyada barabar gaps, aur har gap utna chhota. Bada number matlab bada gap nahi. | Board par ek line hai: line ke dono taraf ke gap 0 se 1 ka wahi ek poora baant-te hain. Fraction ka neeche wala number jitna bada, utne zyada barabar gaps, aur har gap utna chhota. Bada number matlab bada gap nahi. | 5: upar/neeche in two senses (stuck 46, 48) |
| c5-t01 | `s1 rem1.simpler` | Poora wahi rahe aur gaps zyada hon, toh har gap chhota hota hai. Fraction ka neeche wala number bada ho, toh uska gap chhota hota hai. | Dono taraf wahi 0 se 1 hai. Jis taraf gap zyada hain, wahan har gap ko kam jagah milti hai. | 2: stuck 48 |
| c5-t01 | `s1 rem1.sayAlt` | Ek hi laddu socho: 2 bachchon mein baanto toh har ek ko bada hissa milta hai, 10 bachchon mein baanto toh chhota. Neeche wala number baantne walon ki ginti jaisa hai: woh jitna bada, har gap utna chhota. | Ek hi laddu socho: 2 bachchon mein baanto toh har ek ko bada hissa milta hai, 10 bachchon mein baanto toh chhota. 1/10 ka 10 baantne walon ki ginti jaisa hai: woh jitna bada, har gap utna chhota. | 5: upar/neeche in two senses (stuck 46, 48) |
| c5-t01 | `s1 rem2.simpler` | Chaabi wala khilona hawa mein nahi, sadak ki ek pakki jagah par khada hai. Us jagah ka bhi number hai, 1/7 kilometre. | Ghar se khilone tak sadak ka bas ek gap hai, aur poori sadak mein aise 7 gap hain. Khilone ki jagah ka naam yahi ginti hai. | 2: steering 8 |
| c5-t01 | `s2 e1.ask.simpler` | (new) | Line ke neeche 0 se ek-ek gap chalo aur paanch tak gino. Phir dekho, poore 1 tak aise kitne gap hain. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s2 e1.simpler` | Fraction ka neeche wala number batata hai ek poore ke kitne barabar gaps, upar wala number batata hai 0 se kitne gap chalna hai. 2/3 mein: 3 gaps ki line, aur 0 se 2 gap. | 2/3 ko '3 mein se 2' padho: line jitne hisson mein kati, woh 3; tum jitne chale, woh 2. | 5: steady 60 (upar/neeche in two senses) |
| c5-t01 | `s2 e2.ask.prompt` | Ab 1/5 wale gaps dekho. 0 se theek 1 tak pahunchne ke liye aise kitne gap chalne honge? | 1/5 wale gaps dekho. 0 se theek 1 tak pahunchne ke liye aise kitne gap chalne honge? | 5: card opens with "Ab" |
| c5-t01 | `s2 e2.ask.simpler` | (new) | 1/5 wale gaps par 0 se chalna shuru karo, aur har gap par ungli rakh kar gino, jab tak 1 na aa jaaye. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s2 e3.ask.simpler` | (new) | Beech wale mark 3/6 se shuru karo. 4/6 tak pahunchne ke liye kis taraf ek gap chalna padega, woh dekho. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s2 worked yourStep.prompt` | Ab 2/5 ka upar wala number dekho: woh batata hai 0 se kitne gap chalna hai. Utne gap chalkar 0 ke baad kaunse mark par rukoge? | 2/5 ka upar wala number dekho: woh batata hai 0 se kitne gap chalna hai. Utne gap chalkar 0 ke baad kaunse mark par rukoge? | 5: card opens with "Ab" |
| c5-t01 | `s2 rem0.simpler` | 3 marks, 4 gap, kyunki dono siron par bhi gap hote hain. Har gap 1/4, toh 0 se do gap chalo, 2/4. | Marks ko kainchi ke kat socho: 3 kat lagao toh ribbon ke 4 hisse bante hain. Line ke upar bhi 3 marks se 4 gap. | 2: a second wording that shared its nouns and order with the line before |
| c5-t01 | `s2 rem0.sayAlt` | Chhota karke dekho: 0 aur 1 ke beech sirf 2 marks hon, toh gap 3 bante hain: 0 se pehle mark tak, phir doosre mark tak, phir 1 tak. Line ke upar bhi isi tarah 3 marks ke 4 gap hain, isliye har gap 1/4 hai. | Chhota karke dekho: 0 aur 1 ke beech sirf 2 marks hon, toh gap 3 bante hain: 0 se pehle mark tak, phir doosre mark tak, phir 1 tak. Line ke upar bhi 3 marks ke 4 gap hain, isliye har gap 1/4. | 6: over 45 words |
| c5-t01 | `s2 rem0.then.prompt` | Ab line ke neeche dekho: wahan 9 marks lage hain, sab barabar doori par. Wahan ek gap kitne ka hai? | Line ke neeche dekho: wahan 9 marks lage hain, sab barabar doori par. Wahan ek gap kitne ka hai? | 5: card opens with "Ab" |
| c5-t01 | `s2 rem2.simpler` | Chaabi wala khilona ek hi patthar par khada hai. Ek jagah ka ek hi number hota hai, ek fraction. | Khilone ki jagah ko do number mein bolo toh lagta hai do jagah hain, par board par mark ek hi hai. Ek mark, ek naam. | 2: a second wording that shared its nouns and order with the line before |
| c5-t01 | `s3 e1.ask.simpler` | (new) | 1/5 wale gaps par 0 se gino, aur dekho ki 1 tak pahunchne mein kitne gap lagte hain. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s3 e1.simpler` | Line par har poore mein 4 barabar gaps hain. 4 gap chalkar theek 1 aata hai, aur uske baad gaps rukte nahi, 2 tak chalte rehte hain. | 1 se 2 tak ka hissa bhi 0 se 1 jitna hi lamba hai, aur usmein bhi utne hi gap hain. | 2: a second wording that shared its nouns and order with the line before |
| c5-t01 | `s3 e2.point` | Line par har gap 1/4 hai. 0 se 6 gap chalo: pehle 4 gap 1 tak, phir do gap aur, aur hum 6/4 par, 1 ke aage. 6/4 ka upar wala number 6, neeche wale number 4 se bada hai, isliye hum 1 ke aage nikal gaye. | Line par har gap 1/4 hai. 0 se 6 gap chalo: pehle 4 gap 1 tak, phir do gap aur, aur hum 6/4 par, 1 ke aage. 6/4 ka upar wala number 6, 4 se bada hai, isliye hum 1 ke aage nikal gaye. | 5 + 6: upar/neeche in two senses; 47 words |
| c5-t01 | `s3 e2.ask.simpler` | (new) | Do aadhe milkar ek poora banate hain. 1/2 wale gaps ko do-do karke gino. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s3 e2.simpler` | 6/4 mein pehle 4 gap se ek poora, yaani 1, aur baaki gap 1 ke aage jaate hain. Upar wala number 6 neeche wale number 4 se bada hai, isliye 1 paar ho gaya. | Chaar chauthai milkar ek poora banta hai. 6 chauthai mein ek poora bhi hai, aur do chauthai usse aage. | 2 + 5: paraphrase of the point; upar/neeche |
| c5-t01 | `s3 e3.ask.simpler` | (new) | Saat gaps ko teen-teen ke group mein rakhte jao. Jo gap akela bach jaaye, woh group nahi banata. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t01 | `s3 e3.simpler` | Gaps ko teen-teen karke gino: teen gaps ka pehla group 1 tak le jaata hai, aur har agla group ek aur poora jodta hai. | Teen gap chalo toh 1 aata hai, teen aur chalo toh agla poora number. Har poora number pichhle se teen gap aage hai. | 2: a second wording that shared its nouns and order with the line before |
| c5-t01 | `s3 worked steps[0].why` | neeche wala number 4 hai, aur 7/4, 1 ke aage bhi ja sakta hai, isliye line 2 tak chahiye | neeche wala number 4 hai, aur 7/4 ko 1 ke aage jaana hai | 6: steady 110 (step 1 a 55-word run-on) |
| c5-t01 | `s3 c2.did` | 11 lambe aur 11 chhote gap ki doori milaakar dekhi | 1/6 aur 1/12 ke 11-11 gap chalkar dekha kaun aage gaya | 3: steady 136 ("11 lambe aur 11 chhote gap ki doori") |
| c5-t01 | `s3 c3.did` | 2 ke aage wale mark ka naam 0 se gaps ginkar banaya | 0 se gaps ginkar 2 ke baad doosre mark ka naam rakha | 3: read every did (in the order she did it, easy to say) |
| c5-t01 | `s3 rem0.simpler` | 8/8 = 1, matlab 0 se 1 bhar gaya. Naunva gap andar nahi aata, 1 ke aage jaata hai. | Ek bench par aath bachchon ki jagah ho aur nau bachche aayein, toh naunve ko doosri bench par baithna padta hai. Naunva gap bhi aise hi 1 ke aage jaata hai. | 2: a second wording that shared its nouns and order with the line before |
| c5-t01 | `s3 rem0.then.simpler` | Har poore mein 6 gaps, toh neeche wala number 6. Upar wala number: runner ne jitne gap daude. | Ek poore mein 6 gaps hain, aur runner ne 7 gap daude. Inhi do gintiyon se fraction banta hai. | 5: upar/neeche in two senses with its card |
| c5-t01 | `s3 rem1.then.prompt` | Nayi line, 0 se 2: line ke upar har poora 5 gaps mein, line ke neeche 10 mein. Kaun 1 ke aage hai: 9/5 ya 9/10? | Nayi line, 0 se 2: ek taraf har poora 5 gaps mein, doosri taraf 10 mein. Kaun 1 ke aage hai: 9/5 ya 9/10? | 5: upar/neeche in two senses with the say |
| c5-t01 | `s3 rem2.simpler` | 5 gap milke ek poora banate hain, isliye station 1 par 5/5 hai. Train jahan ruke, 0 se wahan tak ke gap gino: woh ginti bata 5, ek hi number. | Station 1 ke aage bhi gap 0 se hi gine jaate hain, ginti 1 par rukti nahi. Isliye 1 ke baad wale mark ka upar wala number 5 se bada hota hai. | 2: a second wording that shared its nouns and order with the line before |
| c5-t01 | `s3 rem2.sayAlt` | Chhoti line socho, 0 se 1, sirf 2 barabar gaps: beech ka mark ek hi jagah hai, aur uska naam ek hi number hai, 1/2. Stations ki is line par bhi train jahan ruke, us jagah ka naam aisa hi ek fraction hai, do alag number nahi. | Chhoti line socho, 0 se 1, sirf 2 barabar gaps: beech ka mark ek hi jagah hai, aur uska naam ek hi number hai, 1/2. Stations ki line par bhi train jahan ruke, uska naam ek fraction hai, do alag number nahi. | 6: over 45 words |
| c5-t01 | `wrap.didFrames[1]` | Aaj tumne {did}, yeh yaad rakhna. | Aaj ek kaam tumne khud karke dikhaya: {did}. | 3: "yeh yaad rakhna" does not fit a thing done (c5-t01 steady 136) |
| c5-t02 | `joints.hindiSwitch[0]` | Haan, Hindi mein samjhaati hoon. | Haan, ise doosre shabdon mein samjhaati hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c5-t02 | `joints.hindiSwitch[1]` | Achha, isko Hindi mein bolti hoon. | Achha, isko aur aasaan karke bolti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c5-t02 | `joints.hindiSwitch[2]` | Achha, yeh baat Hindi mein kehti hoon. | Theek hai, yahi baat seedhe tareeke se kehti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c5-t02 | `joints.helpSpent[0]` | (new) | Isse aasaan shabd abhi mere paas nahi hain; sawaal phir se suno. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c5-t02 | `joints.helpSpent[1]` | (new) | Koi baat nahi, yahi sabse seedha tareeka hai jo mere paas hai. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c5-t02 | `joints.helpSpent[2]` | (new) | Main ise aur aasaan nahi kar paa rahi, par sawaal yeh raha. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c5-t02 | `joints.afterKeyGoOn[0]` | (new) | Koi baat nahi, fraction milaane ke sawaal aage phir aayenge; abhi aage badhte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c5-t02 | `joints.afterKeyGoOn[1]` | (new) | Theek hai, is par hum phir saath mein aayenge; ab agli baat. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c5-t02 | `joints.afterKeyGoOn[2]` | (new) | Achha, aisa sawaal dobara milega; ab aage chalte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c5-t02 | `wrap.didFrames[1]` | Aaj tumne {did}, yeh yaad rakhna. | Aaj ek kaam tumne khud karke dikhaya: {did}. | 3: "yeh yaad rakhna" does not fit a thing done (c5-t01 steady 136) |
| c5-t02 | `s1 e1.point` | Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Fraction ka neeche wala 4 batata hai ki patti ke 4 barabar hisse hain. | Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. | 5: steady 6, 8 (number "neeche" with the card's strips) |
| c5-t02 | `s1 e1.pointAlt` | Is patti ke hisse ungli se gino: ek, do, teen, chaar, sab barabar. Rang wala unmein se ek hai, isliye woh 1/4, aur yeh ginti 4 fraction ka neeche wala number banti hai. | Is patti ke hisse ungli se gino: ek, do, teen, chaar, sab barabar. Rang wala unmein se ek hai, isliye woh 1/4, aur yahi ginti 1/4 ka 4 hai. | 5: steady 6, 8 (number "neeche" with the card's strips) |
| c5-t02 | `s1 e1.ask.simpler` | (new) | Upar wali patti ke rangin hisse ke theek neeche dekho, aur neeche wali patti ke jo hisse us jagah mein aate hain, unhe gino. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s1 e1.simpler` | Ek chocolate ke 4 barabar hisse karo aur ek hissa uthao: woh 1/4 hai. Neeche wala number 4 bas yeh batata hai ki chocolate kitne barabar hisson mein bati. | Rang wala hissa chaar baar ek ke baad ek lagao, toh poori patti ban jaati hai. Isliye woh patti ka 1/4 hai. | 2: a second wording that shared its nouns and order with the line before |
| c5-t02 | `s1 e2.point` | Ab ek aur patti, utni hi lambi, par 8 barabar hisson mein, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. | Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. | 5: script read (S1 e2 "ek aur patti") |
| c5-t02 | `s1 e2.ask.why` | neeche wali patti ke do 1/8 hisse milkar upar wali patti ke ek hisse ke barabar hain, aur woh hissa 1/4 hai | 8 hisson wali patti ke do 1/8 hisse milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain | 5: upar strip sense said into the next point's "line ke upar" (as steady 86) |
| c5-t02 | `s1 e2.ask.simpler` | (new) | Do 1/8 hisson ka sira dekho, aur dekho upar wali patti mein usi jagah tak kaunsa hissa khatam hota hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s1 e3.point` | Ab 0 se 1 tak ki ek number line lo: line ke upar 3 barabar gap hain, line ke neeche 7. Line ka niyam simple hai: zero se jitna door, utna bada. Pattiyon wale 1/4 aur 1/8 ko bhi aisi kisi line par rakhein, toh 1/8 zero ke zyada paas rukega, yaani 1/8 chhota hai. | 0 se 1 tak ki number line lo: line ke upar 3 barabar gap hain, neeche 7. Niyam: zero se jitna door, utna bada. 1/4 aur 1/8 ko bhi aisi line par rakhein, toh 1/8 zero ke zyada paas rukega, yaani 1/8 chhota hai. | 6: over 45 words |
| c5-t02 | `s1 e3.ask.simpler` | (new) | Dono taraf ka pehla gap dekho, aur socho jis taraf gap kam hain, wahan har gap kitna lamba hoga. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s1 e3.simpler` | Line par jo zero se jitna door ruke, woh utna bada. Pattiyon mein 1/8 ka hissa chhota tha, isliye line par 1/8, 1/4 se pehle rukta hai. | Do cheentiyan 0 se chalti hain: jo kam door pahunchi, uski doori chhoti. Line par bhi jo fraction pehle ruke, woh chhota. | 2: a second wording that shared its nouns and order with the line before |
| c5-t02 | `s1 c2.did` | 1/3, 1/12 aur 1/6 ko chhote se bade tak lagaya | teen fraction chhote se bade tak lagaye: 1/12, 1/6, 1/3 | 3: read every did (in the order she did it, easy to say) |
| c5-t02 | `s2 e1.pointAlt` | Upar wali patti ke rangeen hisse ek-ek karke gino: ek gina toh 1/7, do gine toh 2/7. Fraction ka upar wala number yahi ginti hai. | Is patti ke rangeen hisse ek-ek karke gino: ek gina toh 1/7, do gine toh 2/7. Fraction ka upar wala number yahi ginti hai. | 5: upar in two senses; one-strip board |
| c5-t02 | `s2 e1.ask.simpler` | (new) | Patti ke hisse wahi 7 hain, sirf rang wale hisse badle. Rang wale hisse gino. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s2 e2.ask.simpler` | (new) | Line par 0 se 2 gap chalo, phir 0 se 4 gap chalo, aur dekho dono baar kahan ruke. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s2 e3.ask.simpler` | (new) | Dono ke gap ek hi size ke hain. Ab bas yeh gino ki kaun kitne gap chala. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s2 e4.point` | Yeh do barabar patti dekho: upar wali patti 3 hisson mein kati hai, neeche wali 10 mein. Dono fraction ke neeche wale number alag hain, toh hisse alag size ke hain: 10 wali patti ke chhote, 3 wali ke bade. Hisse ek size ke tabhi hote hain jab neeche wala number same ho. | Do barabar patti dekho: ek 3 hisson mein kati hai, doosri 10 mein. Neeche wale number alag hain, toh hisse alag size ke hain: 10 wali ke chhote, 3 wali ke bade. Hisse ek size ke tabhi hote hain jab neeche wala number same ho. | 5 + 6: upar/neeche in two senses; 53 words |
| c5-t02 | `s2 e4.ask.simpler` | (new) | Dono ko aadhi patti se milao: kaunsa aadhe se aage jaata hai, aur kaunsa peeche reh jaata hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s2 c2.simpler` | Dono chocolate ek jaisi hain; 4 mein kati chocolate ka ek hissa aur 6 mein kati ka ek hissa milaa kar dekho. | Board par dono patti ka pehla hissa dekho, aur dekho kiska sira aage tak jaata hai. | 2: a card hint that repeated its card |
| c5-t02 | `s2 rem0.simpler` | Hisse sab barabar hain, toh jitne zyada hisse, utna zyada. | Board ke dono ribbon ke hisse ek jitne lambe hain. Isliye yahan sirf hisson ki ginti batati hai kiske paas zyada hai. | 2: a second wording that shared its nouns and order with the line before |
| c5-t02 | `s2 rem2.simpler` | Dono patti mein ek-ek hisse ki kami hai; ab bas dekho kiski kami badi hai. | Socho kaunsi patti poori rangne ke liye kam rang chahiye: jiski bachi hui jagah chhoti ho. | 2: a second wording that shared its nouns and order with the line before |
| c5-t02 | `s2 rem2.sayAlt` | Do bachche ek jitni lambi race daud rahe hain: ek ki race 3 barabar hisson mein bati hai, doosre ki 5 mein, aur dono ka bas aakhri ek hissa baaki hai. 5 hisson wali race ka hissa chhota hai, toh uski kami chhoti hai, aur woh finish line ke zyada paas hai. | Do bachche ek jitni lambi race daud rahe hain: ek ki race 3 barabar hisson mein bati hai, doosre ki 5 mein, aur dono ka aakhri ek hissa baaki hai. 5 wali race ka hissa chhota, toh woh finish line ke zyada paas hai. | 6: over 45 words |
| c5-t02 | `s3 e1.ask.why` | patti 8 hisson mein kati aur 3 mein rang hai, toh 3/8; upar wali 3/5 thi | patti 8 hisson mein kati aur 3 mein rang hai, toh 3/8; 5 hisson wali patti 3/5 thi | 5: steady 86 (upar: top strip, then above the line) |
| c5-t02 | `s3 e1.ask.simpler` | (new) | Neeche wali patti ke saare hisse gino, phir sirf rang wale. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s3 e1.simpler` | Yeh patti 5 barabar hisson mein hai, isliye neeche wala number 5. Rang 3 hisson mein hai, isliye upar wala number 3. | Ek kaagaz ko 5 barabar hisson mein modo aur 3 hisson mein rang bharo: 5 mein se 3 rangeen, yaani 3/5. | 2: a second wording that shared its nouns and order with the line before |
| c5-t02 | `s3 e2.point` | Ab dono ko ek number line par dekho, 0 se 1 tak: line ke upar 5 barabar gap, har ek 1/5; line ke neeche 8, har ek 1/8. 3/8 matlab 1/8 wale teen gap. Ginti dono mein 3 hi hai, par gap ka size alag hai. | Dono ko ek number line par dekho, 0 se 1 tak: line ke upar 5 barabar gap, har ek 1/5; line ke neeche 8, har ek 1/8. 3/8 matlab 1/8 wale teen gap. Ginti dono mein 3 hi hai, par gap ka size alag hai. | 6: over 45 words |
| c5-t02 | `s3 e2.ask.simpler` | (new) | Dono taraf 0 se teen-teen gap chalo, aur dekho kaun aage ruka. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s3 e3.ask.simpler` | (new) | Dono patti mein do-do hisse hain. Ab dekho kis patti ka ek hissa bada hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s3 e4.point` | Is line par 0 se 1 tak line ke upar 4 barabar gap hain aur line ke neeche 8. Line ke upar pehla mark 1/4 hai, aur line ke neeche theek usi jagah 2/8 aata hai. Isi tarah line ke upar ke har mark ko line ke neeche ke gap mein gin sakte ho. | Is line par 0 se 1 tak, line ke upar 4 barabar gap hain aur neeche 8. Upar pehla mark 1/4 hai, aur neeche theek usi jagah 2/8 aata hai. Isi tarah upar ke har mark ko neeche ke gaps mein gin sakte ho. | 6: over 45 words |
| c5-t02 | `s3 e4.ask.simpler` | (new) | 2/4 wale mark ke theek neeche 1/8 wale kitne gap aate hain, woh gino, phir use 5 se milao. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c5-t02 | `s3 c1.did` | 4/5, 4/9 aur 4/7 ko hisson ka size dekhkar order mein lagaya | hisson ka size dekhkar 4/9, 4/7, 4/5 ka order banaya | 3: read every did (in the order she did it, easy to say) |
| c5-t02 | `s3 c3.did` | 6/7 aur 8/9 ki ek-ek hisse ki kami ka size milaaya | dekha ki 6/7 aur 8/9 mein kiski kami chhoti hai | 3: steady 120 ("ki … ki … ka size") |
| c5-t02 | `s3 rem0.simpler` | Ginti barabar ho, toh dono ke ek-ek hisse ka size milao. | Ginti dono taraf barabar hai, toh faisla hisse ki lambai karegi. Ek-ek hissa saath rakh kar milao. | 2: a second wording that shared its nouns and order with the line before |
| c6 | `joints.hindiSwitch[0]` | Bilkul, ab yeh Hindi mein bolti hoon. | Bilkul, ise doosre, aasaan shabdon mein bolti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c6 | `joints.hindiSwitch[1]` | Theek hai, main yeh Hindi mein bolti hoon. | Theek hai, yahi baat seedhe tareeke se kehti hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c6 | `joints.hindiSwitch[2]` | Haan, Hindi mein samjhaati hoon. | Haan, ise aur aasaan karke samjhaati hoon. | 4: the Hindi promise (c5-t01 steady 36, stuck 8, offtopic 34, steering 8; mech. 4) |
| c6 | `joints.helpSpent[0]` | (new) | Isse aasaan shabd mere paas nahi hain; sawaal ek baar phir suno. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c6 | `joints.helpSpent[1]` | (new) | Koi baat nahi, yahi sabse seedha tareeka hai jo mere paas hai. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c6 | `joints.helpSpent[2]` | (new) | Main ise aur aasaan nahi bol paa rahi, par sawaal yeh raha. | 4: new (H4: Hindi asked with no unsaid wording left) |
| c6 | `joints.afterKeyGoOn[0]` | (new) | Koi baat nahi, parimap ke aise sawaal aage phir aayenge; abhi aage badhte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c6 | `joints.afterKeyGoOn[1]` | (new) | Theek hai, is par hum dobara saath mein aayenge; ab agli baat. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c6 | `joints.afterKeyGoOn[2]` | (new) | Achha, yeh baat phir milegi; ab aage chalte hain. | 4: new (mech. 3: c5-t01 stuck 80, offtopic 62, steering 20; c6 steering 20; c4 stuck 14) |
| c6 | `s1 e1.ask.simpler` | (new) | Ungli har bhuja par chali, toh teeno lambaiyan judengi: 4, 5 aur 6. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s1 e2.ask.simpler` | (new) | Har bhuja 5 cm ki hai, aur hexagon ki bhujayein chhah hain. In dono baaton ko milakar socho. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s1 e2.simpler` | Label sirf ek bhuja par hai, par chhahon bhujayein barabar hain. Toh bina likhi har bhuja bhi 5 cm ki hai, aur woh bhi kinaare mein aati hai. | Likhi hui bhuja ke saath wali bhuja dekho: woh bhi utni hi lambi hai, aur uske aage wali bhi. Hexagon ka kinaara aisi hi bhujaon se poora banta hai. | 2: steady 16, stuck 22, steering 24 |
| c6 | `s1 e3.ask.did` | andar ki jagah chhodkar sirf kinaare ka dhaaga naapa | andar ki jagah chhodkar sirf kinaare ki bhujayein jodi | 3: "naapa/naapi" for a sum she worked out (as steady 128) |
| c6 | `s1 e3.ask.simpler` | (new) | Dhaaga sirf chaaron kinaaron par jaata hai: 6, 4, 6 aur 4. Andar ki jagah ka isse koi lena-dena nahi. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s1 worked yourStep.prompt` | Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua? | Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua? | 5: card opens with "Ab" |
| c6 | `s2 e1.point` | Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. Board par 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. | Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. | 6: over 45 words |
| c6 | `s2 e1.ask.simpler` | (new) | Ungli ek kone se ghumao: har mod par ek bhuja khatam hoti hai, aur chaar mod ke baad tum wahin pahunchte ho. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s2 e2.point` | Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum bilkul saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). | Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). | 6: over 45 words |
| c6 | `s2 e2.pointAlt` | Is rectangle ki chaar bhujaon ko do jodiyon mein baanto: ek 12 m aur ek 5 m ki jodi, aur bilkul waisi hi doosri jodi. Do ek jaisi jodiyan hain, isliye ek jodi ka jod lo aur uska do guna karo: yahi 2 × (lambai + chaudai) hai. | Is rectangle ki chaar bhujaon ko do jodiyon mein baanto: ek 12 m aur ek 5 m ki jodi, aur waisi hi doosri jodi. Ek jodi ka jod lo aur uska do guna karo: yahi 2 × (lambai + chaudai) hai. | 6: over 45 words |
| c6 | `s2 e2.ask.prompt` | Ab 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai? | 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai? | 5: card opens with "Ab" |
| c6 | `s2 e2.ask.simpler` | (new) | Pehle bracket: 12 aur 5 jodo. Phir us jod ka do guna karo. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s2 e3.pointAlt` | Square ko aisa rectangle bhi maan sakte ho jiski lambai bhi 6 cm hai aur chaudai bhi 6 cm. Toh pichhla formula yahan bhi chalega: 2 × (6 + 6), jo wahi chaar bhujayein ginta hai. Yeh kinaare ki lambai hai, isliye jawab centimetre mein, square centimetre mein nahi. | Square ko aisa rectangle maano jiski lambai bhi 6 cm hai aur chaudai bhi. Toh pichhla formula yahan bhi chalega: 2 × (6 + 6), wahi chaar bhujayein. Yeh kinaare ki lambai hai, isliye jawab centimetre mein, square centimetre mein nahi. | 6: over 45 words |
| c6 | `s2 e3.ask.simpler` | (new) | 6 cm ki chaar bhujaon ko ek seedhi line mein khol kar socho. Woh line kitni lambi hogi, wahi jawab hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s2 rem1.simpler` | Andar ke square, square centimetre mein; kinaara, centimetre mein. Kinaare ke liye guna nahi, jod. | Kinaara rassi jaisa hai aur andar ki jagah chatai jaisi. Rassi centimetre mein naapte hain, chatai square centimetre mein. | 2: a second wording that shared its nouns and order with the line before |
| c6 | `s3 e1.ask.simpler` | (new) | Ulta socho: kaunsa number chaar baar jodne par 60 banta hai. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s3 e2.ask.simpler` | (new) | Chhote numbers se socho: chakkar 16 m aur lambai 5 m ho, toh aadha 8, aur 8 mein se 5 gaye, 3 bache. Yahan bhi wahi karo. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s3 e3.point` | Yeh plot 12 m lamba, 8 m chauda hai, toh poora kinaara 2 × (12 + 8) = 40 m. Taar ₹10 per metre milti hai, aur kharcha sirf lagne wali taar ka hota hai. Par neeche wali 12 m ki bhuja mein 2 m ka gate hai, aur gate par taar nahi lagti. | Plot 12 m lamba, 8 m chauda hai, toh kinaara 2 × (12 + 8) = 40 m. Taar ₹10 per metre hai, aur kharcha sirf lagne wali taar ka. Par neeche wali bhuja mein 2 m ka gate hai, jahan taar nahi lagti. | 6: over 45 words |
| c6 | `s3 e3.pointAlt` | Gate ko ek darwaaza socho jo khulta hai; wahan taar lag gayi toh woh khulega hi nahi. Isliye pehle poora kinaara naapo, 2 × (12 + 8) se, aur phir gate ki 2 m jagah chhod do. Jitni taar bachi, sirf usi ke ₹10 per metre dene hain. | Gate ek darwaaza hai jo khulta hai; wahan taar lagi toh woh khulega hi nahi. Isliye pehle poora kinaara nikalo, 2 × (12 + 8) se, phir gate ke 2 m chhod do. Bachi taar ke hi ₹10 per metre dene hain. | 6: over 45 words |
| c6 | `s3 e3.ask.simpler` | (new) | Ulta bhi soch sakte ho: poore 40 m ka kharcha nikalo, phir gate ke 2 m ka kharcha usmein se ghatao. | 1: give-up on an explain card fell to the point's help (c4 stuck 8, steering 30; c5-t02 stuck 8; c6 stuck 6) |
| c6 | `s3 worked yourStep.prompt` | Ab tum karo: 3 × 160 kitna hota hai? | Tumhari baari: 3 × 160 kitna hota hai? | 5: card opens with "Ab" |
| c6 | `s3 c2.did` | pehle khet ka parimap naapa, phir taar ka kharcha nikala | pehle khet ka parimap joda, phir taar ka kharcha nikala | 3: steady 128 ("naapa") |
| c6 | `s3 rem0.simpler` | Parimap mein saari bhujayein hain. Rectangle mein aadhe chakkar mein ek lambai aur ek chaudai; square mein chaar barabar bhujayein. | Jo chaudai nikle, use wapas jodkar jaancho: lambai, chaudai, lambai aur chaudai milkar poora chakkar banna chahiye. | 2: a second wording that shared its nouns and order with the line before |
| c6 | `s3 rem1.simpler` | Zameen nahi, kinaara. Kinaare ke metre gino, phir har metre ka daam lagao. | Socho taar kahan lagegi: plot ke beech mein ya uske kinaare par. Jahan lagegi, paise sirf wahi metre lete hain. | 2: a second wording that shared its nouns and order with the line before |
| c6 | `teachback.did` | 27 cm aur 9 cm ke rectangle ke liye poori taar naapi | 27 cm aur 9 cm wale rectangle ki taar ki lambai nikali | 3: "naapa/naapi" for a sum she worked out (as steady 128) |
| c6 | `wrap.didFrames[1]` | Aaj tumne {did}, yeh yaad rakhna. | Aaj ek kaam tumne khud karke dikhaya: {did}. | 3: "yeh yaad rakhna" does not fit a thing done (c5-t01 steady 136) |

## 2026-11-16 · `56dcf01a5` patch 013 (director24 list): done (Brain's 036: the name is `did`)

**Fields for Brain to wire (clause 4).** These are the names Learning proposes; if Brain wants different ones, write them here.
- `did` `{ hi, en }` on every check card (`skills[i].checks[j]`) and on `teachback`. It is a second-person clause said after
  "Aaj tumne" / "Today you", with no answer number where the doing matters more.
- `wrap.didFrames`: three frames `[{ hi, en }]`, each with one `{did}` slot ("Aaj tumne {did}."). Rotate by the lesson seed.
- check.mjs `d25Errors` requires both from v2.4; the spec is in LESSON-SCRIPTS-SPEC.md.

**For Brain (found while reading):**
- In an English lesson a key is said as written, so a key made speakable in Hinglish ("mark se pehle", "Gopi se kam") would be said
  in Hindi there. Pick an English accepted form for English lessons in `keyInLang` and `workedAnswerOf`. The English forms are in
  `accept`.
- "Yeh hissa saaf hua?" is a `BEAT_ASK` line in `server/brain/say.js`. In these lessons "hissa" is a fraction part; Learning cannot
  change that line.
- c6 also carries `did` on explain asks and worked steps, because in the steady run code picked those cards. Read `did` from any
  card that has one.

**Done.** The did clauses, the help wordings (point simplers that previewed the card, worked simplers that paraphrased), the
c5-t01 captions, the word pairs and sentences, and `asideReturn` read as a whole turn. Each pilot had an independent read, and its fails were fixed. The dry matrix reads 0 on every gated predicate, and the counts match int/r6's baseline.

## 2026-11-16 · `3e25c5c60` patch 012 (director23 list): done

**Fields for Brain to wire (C and T2).** These are the names Learning proposes. If Brain wants different ones, write them here or in
a patch and I will rename them.
- `viewCaption` `{ hi, en }` beside every `board` in a script's skills: on cards (explain asks, checks, worked `yourStep`, remediation
  `then`), on explain beats, on worked examples and on remediations. On a picture request she says the redrawn board's
  `viewCaption`, then the card's question alone. With none, the quiet line is the fallback.
- `wrap.ack`: three forms `[{ hi, en }]`. The wrap opens with one (seeded rotation) when the child spoke after the closing key's
  check-in.
- check.mjs `d24Errors` requires both from v2.4 (the pilots); spec in `docs/design/round7/learning/LESSON-SCRIPTS-SPEC.md`.

**Done (gated: merged int/r6 9b60d6f13; all suites green, see the commit; dry matrix 0 on every gated predicate; counts baseline rewritten).**
- Captions for every board of the four pilots: 40, 44, 44 and 28. Each is written against the view `altCall` draws for that board.
- The c6 gate on the s3 e3 board.
- The judges' giveaways, the second whys that contain the key, the unnatural sentences and the word pairs.
- c6's park form ("chakkar") and return line ("Toh ungli…").
- `asideReturn` forms read after a verdict.

Each pilot had an independent read, its fixes, and a second read of every fix. The c5-t01 card "line par 1/9 ki koi jagah nahi hoti" and its value are left as they are.

**For Brain and Studio, through main (code faults the readers found):**
- `wholes@1` takes at most two wholes, so the picture view of a three-whole card fails with `wholes_count` and draws nothing new.
  This hits c4 s3 c3, c5-t02 s1 c2 and c5-t02 s3 c1; their captions stay true of the board itself.
- A strip board's second view is circles while the card names upper and lower strips. The c4 captions map each circle to its strip.
- c5-t02 s3 e3's view draws 3/5 and 3/8 as circles in unequal pieces.
- c5-t01 s1 e2's view draws an 8-part strip just before the card whose key is 8.
- A two-denominator `fraction-line@1` is one line with gaps above and below it; the scripts now say "line ke upar / line ke neeche".

**For Studio, through main.** The code's own picture lines (`altSay`) still say "sankhya rekhayein" and "nishaan", where the c5
chapter says "number line" and "mark". The captions will replace them in the pilots, but the fallback lines are code. The c4 s3 e1
board still draws the 4-part strip while the child predicts (from director22).

**For Brain (walk faults seen on a c4 path, not in script text).** When the c4 s1 e1 point was shortened, it went out in the same
turn as its card, and the dry matrix showed two walk behaviours that the usual path does not reach. I put a sentence back (with no
giveaway) so the gate stays at 0, but the faults are there:
- stuck 48: a second "samajh nahi aaya" at a remediation then-card's check-in is answered with an earlier card (the pizza e2),
  which shows as clarifyCard plus orderStays.
- steering 34: two give-ups at a check-in get the hint, then the hint again with the whole card (cardWholeAgain).

### Questions for main
- None open. (Choice taken: captions sit beside `board`, not inside it, so a board can stay a pure template reference.)

## 2026-11-16 · `deebe8653`

Merge of int/r6 e55b5d936, answering patch 028: c6 gate card `wrongIfMis` "₹400"; five long points cut; counts baseline rewritten.
Gate EXIT 0.
