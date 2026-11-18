# Learning status

Newest entry first. Per main's 029: reports go here and in commit messages, not by message.

## 2026-11-17 · (this commit) Brain 043 R1 and R2 script fields: `whyShort` on every card with a why; `joints.workedInvite`

Written by the Brain 043 build (`main/d28-code`), in the four pilots only; staged scripts untouched (each card with a why and no
`whyShort`, and a script with no `workedInvite`, is a compile hole; the walk says the whole why, and code's invitation forms).

**New fields (exact names):**
- `whyShort` `{ hi, en }` beside `why` on every explain card (`explain[].ask`), remediation follow-up card (`remediation[].then`) and
  check (`checks[]`) that has a why: c4 23, c5-t01 27, c5-t02 27, c6 23 (100 in all). Not on the closing question, not on the worked
  example's own card (`yourStep`). 10 words or fewer (counted as the checker counts: tokens with a letter or digit), shorter than
  the why, every number in it in the card's prompt, key or why, asks nothing, no leading "kyunki"/"toh" (the walk joins it to the
  verdict as it joins the why: "<verdict>, kyunki <x>", "<verdict>. Dekho, <x>" or "<verdict>: <x>"; none of the pilots' whys opens
  on "kyunki" or "Dekho", so neither does a short form). `why` is unchanged.
- `joints.workedInvite`: three forms per script, each one question of 10 words or fewer inviting the child to do the next problem
  together; no promise, no praise, no slot, no number. Said where a right verdict stands alone before a worked example (the
  `beforeWorked` lead-in is then not said). Written so that no form's head is a stretch of a `beforeWorked` form (the joint-rotation
  predicate recognises a form by its head).

No existing sentence was changed. `node scripts/lesson-scripts/check.mjs <topic>` passes on the four.

### `whyShort`, every card (Hinglish; the `en` beside it; words why → short)

| Script | Card | `why` (hi) | `whyShort` (hi) | `whyShort` (en) | Words |
|---|---|---|---|---|---|
| c4 | s1 e1.ask | rangin tukda roti ke 2 barabar tukdon mein se 1 hai, toh 1/2, yaani aadha; neeche wala number 2 hai | roti ke 2 barabar tukdon mein se 1, yaani 1/2 | 1 of the roti's 2 equal pieces, so 1/2 | 20 → 10 |
| c4 | s1 e2.ask | pizza ke tukde chhote-bade hain, aur ek-tihaai tabhi banta hai jab 3 tukde barabar hon | ek-tihaai ke liye 3 barabar tukde chahiye; yeh chhote-bade hain | a third needs 3 equal pieces; these are not | 15 → 10 |
| c4 | s1 e3.ask | circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3 | 3 barabar tukdon mein se 2 mein rang, yaani 2/3 | 2 of the 3 equal pieces are coloured, so 2/3 | 15 → 10 |
| c4 | s1 e4.ask | Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte | Raju ka tukda 6 tukdon mein se 1, yaani 1/6 | Raju's piece is 1 of 6 pieces, so 1/6 | 22 → 10 |
| c4 | s1 remediation[0].then (unequal-parts) | do tukde barabar hon tabhi har ek aadha hota; yahan bada tukda chhote se bada hai, toh aadhe se zyada | tukde barabar nahi; bada tukda aadhe se zyada hai | unequal pieces; the big one is over half | 20 → 9 |
| c4 | s1 remediation[1].then (part-part) | khaye hue 2 tukde chocolate ke 4 barabar tukdon mein se hain, toh 2/4; bache hue 2 neeche wala number nahi | 4 barabar tukdon mein se 2 khaye, yaani 2/4 | 2 of the 4 equal pieces were eaten, so 2/4 | 21 → 9 |
| c4 | s1 c1 | laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha | bada tukda theek aadha laddoo hai, yaani 1/2 | the big piece is exactly half the laddoo, 1/2 | 17 → 8 |
| c4 | s1 c2 | 1/12 ka matlab chocolate ke 12 barabar tukdon mein se 1 khaya; 12 mein se 1 gaya, toh 11 bache | 12 tukdon mein se 1 khaya, toh 11 bache | 1 of 12 pieces was eaten, so 11 are left | 20 → 9 |
| c4 | s1 c3 | chaaron tukde milkar poora cake hain aur bada tukda baaki se bada hai, toh har chhota tukda 1/4 se kam | ek tukda bada hai, isliye har chhota 1/4 se kam | one is bigger, so a small one is under 1/4 | 20 → 10 |
| c4 | s2 e1.ask | 12 laddoo 2 barabar group mein jaayein toh har group mein 6, aur 2 × 6 = 12 | 2 barabar group, har ek mein 6 laddoo | 2 equal groups, 6 laddoos in each | 16 → 8 |
| c4 | s2 e2.ask | 6 group ko jod kar 3 barabar bade group banao: har bade group mein 2 group, yaani 8 aam | 6 group se 3 bade group, har ek mein 2 | 6 groups make 3 bigger groups, 2 in each | 19 → 10 |
| c4 | s2 e3.ask | 4 × 5 = 20, toh 20 kanche 4 bachchon mein barabar batte hain; har bachche ke 5 kanche 1/4 hain | 4 × 5 = 20, toh 4 bachche, har ek ka 1/4 | 4 × 5 = 20, so 4 children, each gets 1/4 | 19 → 10 |
| c4 | s2 remediation[0].then (part-part) | kele 6 barabar thailon mein the, toh jo thaila gaya woh 1/6 hai; bache hue 5 neeche wale number mein nahi jaate | 6 barabar thailon mein se 1 thaila, yaani 1/6 | 1 of 6 equal bags, so 1/6 | 22 → 9 |
| c4 | s2 remediation[1].then (unequal-parts) | 21 ka 1/3 tab hota jab teeno ko 7 milti; yahan kisi ke paas 7 nahi, isliye kisi ke paas 1/3 nahi | 1/3 matlab 7 pencil; kisi ke paas 7 nahi | 1/3 of 21 is 7, and nobody has 7 | 22 → 9 |
| c4 | s2 c1 | 18 laddoo 3 barabar plate mein the, har plate mein 6; Ravi ne 1 plate li, yaani 1/3 | Ravi ne 3 barabar plate mein se 1 li | Ravi took 1 of 3 equal plates | 18 → 9 |
| c4 | s2 c2 | charon group barabar hote toh 16 ka 1/4 hota 4; 7 usse zyada hai, toh Rani sahi hai | 16 ka 1/4 hai 4, aur 7 usse zyada | 1/4 of 16 is 4, and 7 is more | 18 → 9 |
| c4 | s3 e1.ask | patti 4 mein kati ho toh har tukda, 2 mein kati patti ke tukde ka aadha hota hai | 4 mein kati patti ka tukda, 2 wale ka aadha | a piece of 4 is half a piece of 2 | 18 → 10 |
| c4 | s3 e2.ask | 4 tukdon wale pizza ka har tukda 1/4 hai, aur woh 6 tukdon wale ke 1/6 se bada hai | 1/4 wala tukda 1/6 wale se bada hai | a 1/4 slice is bigger than a 1/6 slice | 19 → 8 |
| c4 | s3 e3.ask | ek jitni patti 5 mein kati toh tukda 2 wale se chhota; zyada tukde, chhota tukda, toh {friend} galat hai | zyada tukde, chhota tukda: 1/5 wala, 1/2 wale se chhota | more pieces, smaller piece: 1/5 is smaller than 1/2 | 20 → 10 |
| c4 | s3 remediation[0].then (bigger-denominator-bigger) | 7 tukdon wala cake kam barabar tukdon mein kata, toh uska har tukda 9 wale ke tukde se bada hai | kam tukde, bada tukda: 7 wale cake ka tukda bada | fewer pieces, bigger piece: the 7-piece cake's is bigger | 20 → 10 |
| c4 | s3 c1 | Meena ka tukda 1/2, jo 1/3 se bada; Sonu ki roti 9 tukdon mein kati, toh uska 1/9 tukda 1/3 se chhota | Sonu ka tukda 1/9 hai, jo 1/3 se chhota | Sonu's piece is 1/9, smaller than 1/3 | 22 → 9 |
| c4 | s3 c2 | 8 mein bati chocolate ka har tukda 1/8 hai, 2 mein bati ka 1/2; 1/8 chhota hai, toh Farhan ka tukda kam | Farhan ka tukda 1/8, Gita ka 1/2; 1/8 chhota | Farhan's piece is 1/8, Gita's 1/2; 1/8 is smaller | 22 → 9 |
| c4 | s3 c3 | chocolate jitne zyada tukdon mein kate, tukda utna chhota; isliye pehle 1/10, phir 1/7, phir 1/4 | zyada tukde, chhota tukda: 1/10, phir 1/7, phir 1/4 | more pieces, smaller piece: 1/10, then 1/7, then 1/4 | 16 → 9 |
| c5-t01 | s1 e1.ask | neeche wala number 3 matlab 0 se 1 ke 3 barabar gaps, aur pehla gap isi line par khatam hota hai | 0 se 1 ke 3 gaps; pehla isi line par | 3 gaps from 0 to 1; the first is here | 21 → 10 |
| c5-t01 | s1 e2.ask | beech ke marks se gaps hamesha ek zyada, toh 7 marks ke 8 gaps | marks se gaps ek zyada: 7 marks, 8 gaps | one more gap than marks: 7 marks, 8 gaps | 14 → 9 |
| c5-t01 | s1 e3.ask | 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas | 10 gaps wala gap chhota, toh 1/10 pehle rukta hai | a 1/10 gap is smaller, so 1/10 stops sooner | 20 → 10 |
| c5-t01 | s1 remediation[0].then (count-marks) | 1/12 metre matlab ribbon ke 12 barabar gap, aur 12 gap ke beech 11 marks hote hain | 12 gap ke beech 11 marks hote hain | 12 gaps have 11 marks between them | 17 → 8 |
| c5-t01 | s1 remediation[1].then (whole-number-bias) | 7 gaps wala har gap 5 gaps wale se chhota hai, isliye 1/7, 0 aur 1/5 ke beech rukta hai | 1/7 ka gap chhota, toh woh 1/5 se pehle | a 1/7 gap is smaller, so it stops before 1/5 | 20 → 9 |
| c5-t01 | s1 remediation[2].then (not-numbers) | line ke neeche sadak 6 barabar gaps mein hai, aur pehla mark 0 se ek gap par, yaani 1/6 kilometre | 6 barabar gaps, pehla mark ek gap par: 1/6 kilometre | 6 equal gaps; the first mark is 1/6 kilometre | 20 → 10 |
| c5-t01 | s1 c1 | 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11 | 10 marks se 11 gaps, pehla mark ek gap par | 10 marks make 11 gaps; the first is one gap | 19 → 10 |
| c5-t01 | s1 c2 | 11 barabar gaps mein har gap 4 wale gap se chhota hai, isliye 1/11 pehle rukta hai; {friend} galat hai | 1/11 ka gap chhota, isliye 1/11 pehle rukta hai | a 1/11 gap is smaller, so 1/11 stops sooner | 20 → 9 |
| c5-t01 | s1 c3 | 1/9 matlab 9 barabar gaps mein se 1 gap, toh 1/9 ki jagah 0 se ek gap par, pehle mark par hai | 1/9 matlab 0 se ek gap, yaani pehla mark | 1/9 is one gap from 0, the first mark | 22 → 9 |
| c5-t01 | s2 e1.ask | har gap 1/8 ka, aur aise 5 gap mile toh 5/8 | 1/8 ke 5 gap, yaani 5/8 | 5 gaps of 1/8 make 5/8 | 11 → 6 |
| c5-t01 | s2 e2.ask | 1/5 ke 5 gap milkar 5/5 banate hain, aur 5/5 = 1 | 1/5 ke 5 gap se 5/5 = 1 | 5 gaps of 1/5 make 1 | 11 → 7 |
| c5-t01 | s2 e3.ask | beech 3/6 par hai, aur upar wala number 4 usse ek zyada hai, toh ek gap aage, beech ke baad | beech 3/6 par, aur 4/6 usse ek gap aage | the middle is 3/6, and 4/6 is one gap on | 20 → 9 |
| c5-t01 | s2 remediation[0].then (count-marks) | 9 marks se 10 barabar gaps bante hain, toh har gap 1/10 | 9 marks, 10 gaps: har gap 1/10 | 9 marks, 10 gaps: each is 1/10 | 12 → 7 |
| c5-t01 | s2 remediation[1].then (whole-number-bias) | 1/6 ke 3 gap sirf beech tak jaate hain, aur 2/3 beech se aage hai | 3 gap sirf beech tak; 2/3 beech se aage | 3 gaps reach the middle; 2/3 is past it | 15 → 9 |
| c5-t01 | s2 remediation[2].then (not-numbers) | har patthar 1/8 kilometre aage hai, toh teesra patthar 3/8 kilometre par | har patthar 1/8 aage, toh teesra 3/8 kilometre par | each stone is 1/8 on; the third, 3/8 kilometre | 12 → 9 |
| c5-t01 | s2 c1 | 5 marks se 6 barabar gaps bante hain, aur chautha mark 4 gaps par hai, yaani 4/6 | 5 marks se 6 gaps; chautha mark 4 gaps par | 5 marks, 6 gaps; the 4th mark is 4 gaps | 17 → 10 |
| c5-t01 | s2 c2 | 1/10 ka gap 1/5 ke gap ka aadha hai, toh 3 chhote gap 3/10 tak hi jaate hain, 3/5 se pehle | 1/10 ka gap chhota, toh 3/10 pehle aata hai | a 1/10 gap is shorter, so 3/10 comes first | 21 → 9 |
| c5-t01 | s2 c3 | 3/4 akela ek number hai, toh line par uski sirf ek jagah hai: 0 se 3 gap chalkar, wahi ek mark | 3/4 ek number hai, toh line par ek mark | 3/4 is one number, so one mark on the line | 21 → 9 |
| c5-t01 | s3 e1.ask | 5 gap se 5/5 = 1 aa gaya, toh chhatha gap 1 ke baad, 6/5 par | 5 gap se 1 aa gaya, chhatha gap uske baad | 5 gaps reach 1; the 6th gap is past it | 15 → 10 |
| c5-t01 | s3 e2.ask | 4/2 matlab 1/2 ke 4 gap, aur har 2 gap se ek poora banta hai, toh 4/2 = 2 | har 2 gap se ek poora, toh 4 gap = 2 | every 2 gaps make a whole; 4 gaps make 2 | 18 → 10 |
| c5-t01 | s3 e3.ask | 7/3 ke 7 gaps mein teen-teen gaps ke 2 group bante hain, 6/3 = 2, aur 1 gap bachta hai | teen-teen ke 2 group, aur 1 gap bachta hai | 2 groups of three, and 1 gap left over | 19 → 9 |
| c5-t01 | s3 remediation[0].then (all-less-than-one) | har gap 1/6 hai, aur runner ne 7 gap daude, toh 7/6 | 1/6 ke 7 gap, yaani 7/6 | 7 gaps of 1/6 make 7/6 | 12 → 6 |
| c5-t01 | s3 remediation[1].then (whole-number-bias) | dono mein 9 gap, par 1/5 wala gap do guna lamba: 9/5, 1 ke aage hai, aur 9/10, 1 se pehle | 1/5 wala gap do guna lamba, toh 9/5 aage | a 1/5 gap is twice as long; 9/5 is further | 21 → 9 |
| c5-t01 | s3 remediation[2].then (not-numbers) | station 1 = 5/5 hai, aur 3 gap aage 5 + 3 = 8, yaani 8/5 | 1 = 5/5, aur 3 gap aage 8/5 | 1 is 5/5, and 3 gaps on is 8/5 | 13 → 7 |
| c5-t01 | s3 c1 | 3/3 = 1 aur 6/3 = 2, aur 5/3 dono ke beech hai | 5/3, 3/3 aur 6/3 ke beech hai | 5/3 sits between 3/3 and 6/3 | 11 → 7 |
| c5-t01 | s3 c2 | 1/6 ka gap 1/12 ke gap se do guna hai, toh 11 lambe gap 11/6 tak, 11/12 se kaafi aage | 1/6 ka gap do guna, toh 11/6 aage | a 1/6 gap is twice as long; 11/6 is further | 20 → 8 |
| c5-t01 | s3 c3 | har 5 gaps se ek poora, toh 2 tak 10 gaps hain; 2 gap aur chalo toh kul 12, yaani 12/5 | 2 tak 10 gaps, aur 2 gap aage: 12/5 | 10 gaps reach 2, and 2 more make 12/5 | 21 → 9 |
| c5-t02 | s1 e1.ask | dono patti barabar lambi hain, par doosri 8 hisson mein kati hai aur pehli sirf 4 mein | doosri patti 8 hisson mein kati, pehli sirf 4 mein | the second is in 8 parts, the first in 4 | 17 → 10 |
| c5-t02 | s1 e2.ask | 8 hisson wali patti ke do 1/8 hisse milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain | do 1/8 hisse milkar ek 1/4 hissa banate hain | two 1/8 parts together make one 1/4 part | 20 → 9 |
| c5-t02 | s1 e3.ask | 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai | 1/3 ka gap bada, toh woh aage rukta hai | a 1/3 gap is bigger, so it stops further | 17 → 9 |
| c5-t02 | s1 remediation[0].then (bigger-denominator) | 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai | zyada hisse, chhota hissa: 1/11, 1/9 se chhota | more parts, smaller part: 1/11 is smaller than 1/9 | 17 → 8 |
| c5-t02 | s1 c1 | 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai | 1/5 wala hissa 1/10 se do guna bada hai | a 1/5 part is twice a 1/10 part | 17 → 9 |
| c5-t02 | s1 c2 | poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade | 1/12 sabse chhota, 1/6 beech mein, 1/3 sabse bada | 1/12 smallest, 1/6 in the middle, 1/3 biggest | 16 → 9 |
| c5-t02 | s1 c3 | mark 1/3 hai, aur 1/3 ka gap 1/5 ke gap se bada hai, isliye 1/5 pehle aata hai | mark 1/3 hai, aur 1/5 ka gap chhota | the mark is 1/3, and a 1/5 gap is smaller | 18 → 8 |
| c5-t02 | s2 e1.ask | pehli patti 2/7 thi; hisse wahi 7 hain aur rang ab 4 mein hai, toh 4/7 | hisse wahi 7, rang ab 4 mein: 4/7 | still 7 parts, now 4 coloured: 4/7 | 16 → 8 |
| c5-t02 | s2 e2.ask | neeche wala number dono ka 7 hai, par 4/7 zero se 4 gap door hai aur 2/7 sirf 2, isliye barabar nahi | 4/7 zero se 4 gap door, 2/7 sirf 2 | 4/7 is 4 gaps from zero, 2/7 only 2 | 22 → 9 |
| c5-t02 | s2 e3.ask | dono ke gap 1/5 ke hain, aur Mona teen gap chali, Sonu sirf ek | Mona teen gap chali, Sonu sirf ek | Mona walked three gaps, Sonu only one | 14 → 7 |
| c5-t02 | s2 e4.ask | 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe, yaani 5/10, tak bhi nahi pahunchta | 2/3 aadhe se aage, 3/10 aadhe tak bhi nahi | 2/3 is past half, 3/10 not even half | 16 → 9 |
| c5-t02 | s2 remediation[0].then (same-bottom-equal) | har hissa 1/7 hai, aur {friend} ke 3 hisse Gopi ke 6 hisson se kam hain | har hissa 1/7; 3 hisse, 6 se kam | every part is 1/7; 3 parts are fewer than 6 | 16 → 8 |
| c5-t02 | s2 remediation[1].then (tops-only) | 1/2 theek aadhi patti hai, jabki 2/6 aadhi patti tak nahi pahunchta | 1/2 theek aadha, 2/6 aadhe tak nahi | 1/2 is half, 2/6 is less than half | 12 → 7 |
| c5-t02 | s2 remediation[2].then (gap-thinking) | 9/10 mein bas 1/10 ki kami hai, 7/8 mein 1/8 ki, aur 1/10 ki kami chhoti hai | 9/10 mein bas 1/10 ki kami hai, jo chhoti hai | 9/10 is short by only 1/10, less than 1/8 | 17 → 10 |
| c5-t02 | s2 c0 | dono ke hisse 1/6 ke hain, toh 4/6 mein se 1/6 hatao, 3 hisse bachte hain | 4/6 mein se 1/6 hatao, 3 hisse bachte | take 1/6 from 4/6 and 3 parts are left | 16 → 8 |
| c5-t02 | s2 c1 | {friend} ka 5/10 bas aadha cake hai, jabki Ben ka 3/5 aadhe se aage hai | 5/10 bas aadha, Ben ka 3/5 aadhe se aage | 5/10 is just half, Ben's 3/5 is past half | 15 → 9 |
| c5-t02 | s2 c2 | 4 hisson wali chocolate ka ek hissa 1/4 hai aur 6 wali ka 1/6, aur 1/4 bada hai | 1/4 wala hissa 1/6 wale se bada hai | a 1/4 part is bigger than a 1/6 part | 18 → 8 |
| c5-t02 | s3 e1.ask | patti 8 hisson mein kati aur 3 mein rang hai, toh 3/8; 5 hisson wali patti 3/5 thi | 8 hisson mein se 3 mein rang, yaani 3/8 | 3 of the 8 parts are coloured, so 3/8 | 18 → 9 |
| c5-t02 | s3 e2.ask | ginti dono mein 3 hai, par 1/5 ke gap 1/8 wale gap se bade hain, isliye 3/5 ka mark aage hai | 1/5 ke gap bade, toh 3/5 ka mark aage | 1/5 gaps are bigger, so the 3/5 mark is further | 21 → 9 |
| c5-t02 | s3 e3.ask | dono mein 2 hisse hain, aur 1/5 ka hissa 1/9 wale se bada, isliye 2/5 zyada | 1/5 ka hissa bada, isliye 2/5 zyada | a 1/5 part is bigger, so 2/5 is more | 16 → 7 |
| c5-t02 | s3 e4.ask | 2/4 ko 1/8 ke gap mein badlo toh 4/8 banta hai, aur 5/8 usse ek gap aage hai | 2/4 yaani 4/8, aur 5/8 ek gap aage | 2/4 is 4/8, and 5/8 is one gap past | 18 → 8 |
| c5-t02 | s3 remediation[0].then (tops-only) | dono deewar par chaar-chaar hisse, par 1/10 ka hissa 1/6 se chhota, isliye 4/10 kam hai, yaani Kavya ki deewar par | 1/10 ka hissa chhota, isliye 4/10 kam hai | a 1/10 part is smaller, so 4/10 is less | 21 → 8 |
| c5-t02 | s3 remediation[1].then (bigger-denominator) | dono ne teen-teen hisse banaye, par 1/4 ka hissa 1/12 se bada hai, isliye pehli team ne zyada banayi | 1/4 ka hissa 1/12 se bada hai | a 1/4 part is bigger than a 1/12 part | 19 → 7 |
| c5-t02 | s3 remediation[2].then (gap-thinking) | 5/6 mein bas 1/6 ki kami hai, 4/5 mein 1/5 ki, aur 1/6 ki kami chhoti hai | 5/6 mein bas 1/6 ki kami hai, jo chhoti hai | 5/6 is short by only 1/6, less than 1/5 | 17 → 10 |
| c5-t02 | s3 c1 | teeno mein 4 hisse, par 1/9 ka hissa sabse chhota aur 1/5 ka sabse bada; isliye 4/9, phir 4/7, phir 4/5 | 1/9 ka hissa sabse chhota, 1/5 ka sabse bada | a 1/9 part is smallest, a 1/5 part biggest | 21 → 9 |
| c5-t02 | s3 c2 | dono ke paanch-paanch hisse, par Imran ka har hissa Anjali ke hisse ka do guna hai | Imran ka har hissa Anjali ke hisse ka do guna | each of Imran's parts is double one of Anjali's | 16 → 10 |
| c5-t02 | s3 c3 | 8/9 mein bas 1/9 ki kami hai, 6/7 mein 1/7 ki, aur 1/9 ki kami chhoti hai | 8/9 mein bas 1/9 ki kami hai, jo chhoti hai | 8/9 is short by only 1/9, less than 1/7 | 17 → 10 |
| c6 | s1 e1.ask | 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti | teeno bhujayein judi: 4 + 5 + 6 = 15 cm | all three sides: 4 + 5 + 6 = 15 cm | 11 → 8 |
| c6 | s1 e2.ask | chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm | 6 bhujayein, har ek 5 cm: 6 × 5 = 30 cm | six sides of 5 cm: 6 × 5 = 30 cm | 11 → 10 |
| c6 | s1 e3.ask | dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm | sirf kinaara: 6 + 4 + 6 + 4 = 20 cm | only the edge: 6 + 4 + 6 + 4 = 20 cm | 12 → 8 |
| c6 | s1 remediation[0].then (missing-sides) | P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m | paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m | all five sides: 8 + 5 + 7 + 6 + 3 = 29 m | 14 → 9 |
| c6 | s1 remediation[1].then (area-perimeter) | kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega | kinaare par 46 cm, toh 140 − 46 = 94 cm | the edge takes 46 cm, so 140 − 46 = 94 cm | 15 → 9 |
| c6 | s1 c1 | chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m | chaaron bhujayein: 9 + 6 + 7 + 4 = 26 m | all four sides: 9 + 6 + 7 + 4 = 26 m | 10 → 8 |
| c6 | s1 c2 | parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai | parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm | perimeter is the edge: 10 + 4 + 10 + 4 = 28 cm | 15 → 9 |
| c6 | s2 e1.ask | 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m | dono do-do baar: 10 + 6 + 10 + 6 = 32 m | both come twice: 10 + 6 + 10 + 6 = 32 m | 14 → 9 |
| c6 | s2 e2.ask | aadha chakkar 12 + 5 = 17 m, aur uska do guna: 2 × 17 = 34 m | aadha chakkar 17 m, do guna 34 m | half a round is 17 m, double is 34 m | 14 → 8 |
| c6 | s2 e3.ask | chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, lambai hai isliye cm | chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm | four sides of 6 cm: 4 × 6 = 24 cm | 14 → 10 |
| c6 | s2 remediation[0].then (l-plus-b) | do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m | do lambai aur do chaudai jodkar 54 m | two lengths and two breadths make 54 m | 11 → 8 |
| c6 | s2 remediation[1].then (area-perimeter) | kinaara centimetre mein naapte hain aur bhujayein judti hain: 11 + 2 + 11 + 2 = 26 cm | bhujayein judti hain: 11 + 2 + 11 + 2 = 26 cm | the sides add up: 11 + 2 + 11 + 2 = 26 cm | 15 → 9 |
| c6 | s2 c1 | aadha chakkar 40 + 25 = 65 m, poora chakkar 2 × 65 = 130 m | aadha chakkar 65 m, poora 2 × 65 = 130 m | half a round 65 m, full round 130 m | 12 → 9 |
| c6 | s2 c2 | laal 2 × (16 + 9) = 50 cm, neela 2 × (20 + 6) = 52 cm; neele ki border lambi | laal 50 cm, neela 52 cm; neele ki border lambi | red is 50 cm, blue 52 cm: blue's is longer | 16 → 10 |
| c6 | s2 c3 | chaar barabar bhujayein: 4 × 11 = 44 cm, aur jawab centimetre mein | chaar barabar bhujayein: 4 × 11 = 44 cm | four equal sides: 4 × 11 = 44 cm | 11 → 7 |
| c6 | s3 e1.ask | 60 m chaar barabar bhujaon mein: 60 ÷ 4 = 15 m | chaar barabar bhujayein: 60 ÷ 4 = 15 m | four equal sides: 60 ÷ 4 = 15 m | 10 → 7 |
| c6 | s3 e2.ask | aadha chakkar 30 m, usme se lambai 20 m gayi, bache 10 m | aadha chakkar 30 m, usme se 20 gaye: 10 m | half a round is 30, minus 20: 10 m | 13 → 10 |
| c6 | s3 e3.ask | taar 40 − 2 = 38 m lagegi, aur ₹10 per metre se kharcha 38 × 10 = ₹380 | taar 38 m, toh 38 × 10 = ₹380 | 38 m of wire, so 38 × 10 = ₹380 | 15 → 7 |
| c6 | s3 remediation[0].then (l-plus-b) | 90 ka aadha 45 m, usme se 28 m lambai gayi, bache 17 m | 90 ka aadha 45, usme se 28 gaye: 17 m | half of 90 is 45, minus 28: 17 m | 14 → 10 |
| c6 | s3 remediation[1].then (area-perimeter) | kinaara 2 × (9 + 6) = 30 m, aur 30 × 20 = ₹600 | kinaara 30 m, aur 30 × 20 = ₹600 | the edge is 30 m, and 30 × 20 = ₹600 | 10 → 7 |
| c6 | s3 c1 | 84 m baad chaar barabar bhujaon par baanti gayi: 84 ÷ 4 = 21 m | chaar barabar bhujayein: 84 ÷ 4 = 21 m | four equal sides: 84 ÷ 4 = 21 m | 13 → 7 |
| c6 | s3 c2 | kinaara 2 × (30 + 20) = 100 m hai, aur 100 metre taar ka daam ₹1500 | kinaara 100 m, aur 100 × 15 = ₹1500 | the edge is 100 m, and 100 × 15 = ₹1500 | 14 → 7 |
| c6 | s3 c3 | 70 ka aadha 35 cm, usme se 20 cm lambai gayi, bache 15 cm | 70 ka aadha 35, usme se 20 gaye: 15 cm | half of 70 is 35, minus 20: 15 cm | 14 → 10 |

### `joints.workedInvite`, three forms per script (hi, with the en)

| Script | Forms |
|---|---|
| c4 | Agla sawaal hum dono saath mein karein? (Shall the two of us do the next problem together?)<br>Kadam-kadam karke, agla sawaal milkar dekhein? (Step by step, shall we do the next one together?)<br>Ab ek sawaal tum aur main saath mein hal karein? (Now shall you and I solve one problem together?) |
| c5-t01 | Agla sawaal line par saath mein karein? (Shall we do the next problem together on the line?)<br>Ek-ek kadam karke, agla sawaal milkar dekhein? (Step by step, shall we try the next one together?)<br>Ab ek sawaal hum dono milkar hal karein? (Now shall the two of us solve one problem together?) |
| c5-t02 | Agla sawaal hum saath mein karein? (Shall we do the next problem together?)<br>Ek sawaal kadam-kadam, milkar hal karein? (Shall we solve one problem together, step by step?)<br>Ab ek sawaal tum aur main saath mein karein? (Now shall you and I do one problem together?) |
| c6 | Agla sawaal hum dono saath mein karein? (Shall the two of us do the next problem together?)<br>Kadam-kadam karke, agla sawaal milkar hal karein? (Step by step, shall we solve the next one together?)<br>Ab ek hisaab tum aur main saath mein karein? (Now shall you and I work out one sum together?) |

## 2026-11-17 · `179be9184`..(this commit) patch 016 (director27 list): done in the four pilots; one item (D3) needs a data file outside this lane

**New fields (exact names, for Brain 042):**
- `skills[].explain[].quick` `{ prompt: { hi, en }, key, accept: [..], say: { hi, en } }` on every explain beat of the four pilots
  (c4 10, c5-t01 9, c5-t02 11, c6 9: 39). Prompt ≤ 14 words, one question; `say` ≤ 12 words, one sentence, states the answer.
- `skills[].workedExample.steps[].ask` `{ prompt: { hi, en }, key, accept: [..], right: { hi, en } }` on at least one step of every
  worked example of two or more steps (c4 2, c5-t01 3, c5-t02 3, c6 4: 12; c4 s2 has one step and no ask). The step's `do`,
  `result`, `why` stay as the told form. c6 s3 has two asked steps.
- `joints.afterKeyReturn` (3 forms) and `joints.tiredBye` (2 forms) in each pilot.
- `scripts/lesson-scripts/check.mjs` `d27Errors` (on the four pilots, `D27_PILOTS`, and on any script that declares one of the fields,
  `isD27`): the two shapes and their word limits; `quick.key` and its accept forms not the card's key or its forms, and neither the
  prompt nor `say` naming the card's key; an ask's key is its step's result and not the child's own step's key, and `right` does not
  say that key; worked `problem` ≤ 30; told step ("do: result, kyunki why") ≤ 30; the longest `beforeWorked` + problem + told steps
  before the first question + that question ≤ 75; `wrap.covered` and each skill's `covered` ≤ 20 a sentence (hi and en);
  `afterKeyReturn` says "again" and "back", `tiredBye` speaks to tiredness, both one sentence, no slot, no taste claim, no promise,
  no goodbye. Both new joint names are allowed kinds. Three supporting changes, all only on scripts with the 016 fields:
  (1) a remediation with a board of its own (different from its card's) is judged on that board the way the walk takes it
  (board-first `preselect` + `takePreselected` on the say and on its simpler, and `scriptBoardSpoken` on the say), and its card on the
  card's board (P1); before, the say was gated over the card's board only; (2) own-board fractions count as on the board for
  `sayBoardNumberErrors`, and params are read with a space after each comma ([2,12] was read as 212); (3) a told step's `result`
  may say "gap" inside a Hinglish sentence. d24's caption rule skips a quick key (it is read off its own board by design) and holds
  a step ask's key against the worked board's own caption only.
- The 30 staged scripts: `LESSON_SCRIPTS_DIR=data/lesson-scripts-staged check.mjs --all` prints the same 161 lines before and after
  (diffed against the checker at `82e1f5c73`): nothing new fails.

**Per section of the order:**
- **A1 quick questions: done**, 39 (table below, each with its blind solve: worked from the point's words and the point's board only,
  key covered). Each asks a count, a name or one of two from the point or its board.
- **A2 asked steps: done**, 12. c4 s1 is re-cut so the child's own step needs thinking: the problem asks for the pieces *left*
  (5 cut, 3 eaten); step 1 is asked (2 left), step 2 told (top number 2), and the child's own step is the bottom number: 2/5, with
  the part-part slip 2/3 as `wrongIfMis`. Its board shades the 2 left. c6 s3: five told steps become one told (a round is the
  perimeter) and two asked (50 + 30 = 80, 2 × 80 = 160); the child's own step is "Rani ne aise teen chakkar daude. Woh kul kitne
  metre daudi?" (480 m), no longer handed to her as "3 × 160". c4 s3's first question moves from the child's step to its step 2.
- **A3 lengths: done.** Problems cut to ≤ 30 (c4 s3, c5-t01 s1, c5-t02 s1, c6 s1); told steps to ≤ 30 (c5-t01 s3 step 1, c5-t02 s1
  step 2); every open (lead-in + problem + told steps + first question) ≤ 75; covered sentences ≤ 20 in en too (c4 2, c5-t02 2, c6 3).
- **B re-asks and hints: done.** Every `reask` in the four scripts read against its card (c4 first, its 16; then c5-t01's 15,
  c5-t02's 21, c6's 20, as they stood). Changed: c4 s1 e3 (stated 2 of 3), c4 s1 worked (stated 5 and 3; now the new step's), c6 s3 e2 (its prompt and re-ask both
  said "aadha lo … lambai hatao"; the card now asks the breadth, key unchanged 10 m). Added with their givens (B3): c5-t01 s1 rem2
  then-card (the "Woh 0 se kitne kilometre par hai?" fragment), c5-t01 s2 c3, c5-t02 s2 e3 (Mona/Sonu), c5-t01 s1 rem0 then-card
  (rewritten with the card), c6 s3 worked (new child's step). Hints changed: c6 s1 c2 (B2: now true of the closed 10 × 4 board),
  c4 s1 c3 (with its why), c4 s1 worked child's step, c6 s3 worked child's step.
- **C remediation boards: done.** Decided each of the 12 without a board: **board of its own, spoken** 4 — c4 s1 rem0 (rope and
  paper: wholes Rassi 3 unequal, Kaagaz 2), c5-t01 s1 rem1 (one line, dens [2, 5], 1/2 and 1/5 marked; not the card's fifths and
  sevenths), c5-t02 s2 rem2 (bars 2 and 7, one part empty each), c5-t02 s3 rem2 (bars 3 and 8, the board moved off the tanks
  `sayAlt` it did not fit, C3); **"socho" telling, no board** 8 — c4 s1 rem1, c4 s2 rem1, c5-t01 s3 rem1, and c6's five (s1 rem1,
  s2 rem0, s2 rem1, s3 rem0, s3 rem1). C2: c5-t01 s1 rem0's board is the sevenths line alone (den 7, 1/7 marked), not dens [7, 12]
  with the card's 11 ticks; its card no longer names 1/12 over a board that labels only 1/7 (W13 once judged on its own board).
  Every board a remediation has is spoken by its say (`tests/r7-board-ref` and the new test); c4 s2 rem1's `sayAlt` now speaks its
  4, 2, 2 board too.
- **D joints and forms: D1, D2, D4 done; D3 not done here.** D4: each of c6 s1's three hook slots ends on a sentence that leads into
  the triangle ("Ab yahi chakkar ek chhote triangle par lagate hain."). **D3** (a further reply form for an aside said again) lives
  in `data/lesson-aside-replies.json` (`kinds.*.phraseReplies`, and `server/brain/asideReplies.js` picks among them), outside this
  lane. Proposed forms for whoever owns it, one per kind, for the second time the same aside is answered: sport "Achha, {phrase}, yeh
  toh tumne pehle bhi bataya." / show "Haan, {phrase} wali baat yaad hai." / food "Achha, phir se {phrase}." / people "Haan, {phrase},
  tumne bataya tha." / game "Achha, {phrase} phir se." / other "Haan, {phrase}, yeh yaad hai." (none claims a taste, none asks).
- **E the judges' sentences: done**, except three that are code's: "Yeh hissa saaf hua?" (`server/brain/say.js` check-in), "Is sawaal
  ka sahi jawab:" (the key frame; c5-t02's raw key it frames is now "doosri patti ka hissa chhota"), and "rekha" at c6 steering 14
  (a code caption: the cell lost its part after a key; the script says "line" throughout). Beyond the list: c5-t02's strips by
  position (015 item 7 carried) are pehli/doosri as in c4; c5-t01's "1/8, 1/7 se pehle" over a board with no 1/7 (the judge's near
  miss) is reworded.

**Checks.** `node scripts/lesson-scripts/check.mjs <topic>`: c4 ok, c5-t01 ok, c5-t02 ok, c6 ok (structure 0, boards 0, runtime 0).
`compile-report.mjs --print`: no new hole; remediation board missing 127 → 123 (c4 3 → 2, c5-t01 2 → 1, c5-t02 2 → 0, c6 5; the
eight left are the "socho" tellings, by decision), board_up fallback cells 381 → 369; no new over-45 part (c6's hook en was cut to
stay under). Tests: `node --test --test-concurrency=2 tests/r7-board-ref.test.mjs tests/r8-learning-*.test.mjs
tests/r8-picture-turn.test.mjs tests/r8-aside-replies.test.mjs`: 73 pass, 0 fail (with the new `tests/r8-learning-director27.test.mjs`,
8 tests). **Repinned** in `tests/r8-picture-turn.test.mjs`: wholes 20/20 → 21/21 (c4's rope board), line 41/59 → 42/60 (c5-t01's
own whole-number line). Also pass: r7-compile, r7-learning-lesson-scripts(-v2), r7-brain-live-scripts, r7-brain-script-v2,
r7-audit-script-card-prompt (35). Not run: `tests/r7-dry-matrix` (its harness, `evals/hybrid-side-by-side.mjs`, is not in this sparse
checkout); its counts will move with the spoken text, as at 015.

**Unsure, for the main loop to read:**
- c6 s3 e1's new point: "Har bhuja us 60 m mein se apna barabar ka bhaag leti hai." ("bhaag" appears nowhere else in c6; it avoids
  both "hissa" and naming ÷ 4.)
- c4 s1 rem0's say ends "dono tukde ek jaise hain, isliye inka naam rakh sakte hain." — it no longer says "tabhi har tukda aadha":
  Studio's W8 refuses the two-whole board under "aadha" (it reads a half that is not shaded). The card that follows asks about half.
- c5-t01 s1 rem1's own line uses 1/2 and 1/5 against a card about 1/5 and 1/7: 1/5 is a given of that card (marked on its board),
  not its answer; other pairs collided with a later key or distractor (1/3, 1/10, 1/12).
- The quick questions that are a count the point just said (e.g. c4 s2 e3 "Board ke ek group mein kitne kanche hain?" 10) are easy
  by design; c5-t02 s2 e4 ("Kis patti ke hisse bade hain, 3 wali ke ya 10 wali ke?") is the one nearest its card's idea (2/3 against
  3/10 still needs the count and the size together).
- `tiredBye` is the same two forms in the four scripts ("Thakaan ho toh aaram karna bilkul theek hai." / "Thak jaana theek hai; thoda
  aaram karo aur paani pi lo.").

### New quick questions (A1), with the blind solve

| Script | Beat | Prompt | Key | Say | Point's board | Card's key | Blind solve |
|---|---|---|---|---|---|---|---|
| c4 | s1 e1 | Fraction mein neeche wala number kya ginta hai, saare tukde ya liye hue? | saare tukde | Neeche wala number roti ke saare tukde ginta hai. | fraction-parts {"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true} | 1/2 | concept from the point's last sentence: the bottom number counts the roti's equal pieces, all of them → saare tukde |
| c4 | s1 e2 | Cake ka har tukda kaunsa fraction hai? | 1/3 | Cake ka har tukda ek-tihaai hai, 1/3. | wholes {"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]} | No | board: cake in 3 equal parts → each 1/3 |
| c4 | s1 e3 | Abhi circle ke kitne tukdon mein rang hai? | 1 | Abhi sirf ek tukde mein rang hai. | fraction-parts {"parts":3,"shade":1,"whole":"circle"} | 2/3 | board: circle 3 parts, shade 1 → 1 coloured |
| c4 | s1 e4 | 8 tukdon wali patti mein kitne tukde bina rang ke hain? | 7 | Saat tukde bina rang ke hain, 7. | fraction-bars {"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]} | No | board: first bar 8 parts, shade 1 → 8 − 1 = 7 uncoloured |
| c4 | s2 e1 | Aadhe mein dono bachchon ke laddoo kaise hote hain, ek jitne ya alag? | ek jitne | Aadhe mein dono bachchon ke laddoo ek jitne hote hain. | shade-grid {"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true} | 6 | point: aadha = both children have the same number → ek jitne |
| c4 | s2 e2 | Board ke har group mein kitne aam hain? | 4 | Har group mein 4 aam hain. | equal-groups {"groups":6,"each":4} | 2 | board: 6 groups, each 4 → 4 |
| c4 | s2 e3 | Board ke ek group mein kitne kanche hain? | 10 | Ek group mein 10 kanche hain. | equal-groups {"sizes":[10,10]} | 1/4 | board: sizes [10, 10] → 10 |
| c4 | s3 e1 | Yeh patti kitne barabar tukdon mein bati hai? | 2 | Patti 2 barabar tukdon mein bati hai. | fraction-parts {"parts":2,"shade":1,"whole":"bar"} | No | board: bar 2 parts → 2 |
| c4 | s3 e2 | Pehle pizza ka ek tukda kaunsa fraction hai? | 1/6 | Pehle pizza ka har tukda 1/6 hai. | wholes {"wholes":[{"parts":6},{"parts":4}]} | 1/4 | board: first whole 6 parts → each 1/6 |
| c4 | s3 e3 | Dono patti ki lambai kaisi hai, ek jitni ya alag? | ek jitni | Dono patti ek jitni lambi hain. | wholes {"as":"bar","wholes":[{"parts":2,"shade":0},{"parts":5,"shade":0}]} | No | point: the two strips are ek jitni lambi; board: two bars of one length → same |
| c5-t01 | s1 e1 | Beech ke mark se line ke kitne barabar gaps bane? | 2 | Beech ke mark se 2 barabar gaps bane. | fraction-line {"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]} | on this line | board: den 2, one mark at 1/2 → 0–1/2 and 1/2–1: 2 gaps |
| c5-t01 | s1 e2 | Line ke upar 0 ke baad pehla mark kaunsa fraction hai? | 1/7 | Line ke upar pehla mark 1/7 hai. | fraction-line {"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]} | 8 | board: dens [7, 8], mark [1, 7] above → 1/7 |
| c5-t01 | s1 e3 | Is line par kitne barabar gaps hain? | 8 | Is line par 8 barabar gaps hain. | fraction-line {"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]} | 1/10 | board: den 8 → 8 gaps |
| c5-t01 | s2 e1 | 2/3 tak pahunchne ke liye 0 se kitne gap chale? | 2 | 2/3 tak 0 se 2 gap chale. | fraction-line {"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}} | 5/8 | board: den 3, mark 2/3, hop 2 → 2 gaps |
| c5-t01 | s2 e2 | 3/3 line par kis number par aata hai? | 1 | 3/3 line par theek 1 par aata hai. | fraction-line {"den":3,"from":0,"to":1,"marks":[{"num":3,"label":"3/3 = 1"}],"hop":{"num":3}} | 5 | board: den 3, mark '3/3 = 1' → at 1 |
| c5-t01 | s2 e3 | Beech wala mark kaunsa fraction hai? | 3/6 | Beech wala mark 3/6 hai, yaani 1/2. | fraction-line {"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]} | after the middle | board: den 6, mark '3/6 = 1/2' in the middle → 3/6 |
| c5-t01 | s3 e1 | 1 wale mark ka fraction naam kya hai? | 4/4 | 1 wala mark 4/4 hai. | fraction-line {"den":4,"from":0,"to":2,"marks":[{"num":4,"label":"4/4 = 1"}]} | after | board: den 4 to 2, mark '4/4 = 1' → 4/4 |
| c5-t01 | s3 e2 | 6/4 tak pahunchne ke liye 0 se kitne gap chale? | 6 | 6/4 tak 0 se 6 gap chale. | fraction-line {"den":4,"from":0,"to":2,"marks":[{"num":6,"label":"6/4"}],"hop":{"num":6}} | 2 | board: den 4, mark 6/4, hop 6 → 6 gaps |
| c5-t01 | s3 e3 | Is line par ek poore mein kitne gap hain? | 3 | Ek poore mein 3 gap hain. | fraction-line {"den":3,"from":0,"to":3,"marks":[{"num":3,"label":"3/3 = 1"}]} | 2 | board: den 3 per whole → 3 gaps |
| c5-t02 | s1 e1 | Is patti mein kitne barabar hisse hain? | 4 | Is patti mein 4 barabar hisse hain. | fraction-parts {"parts":4,"shade":1,"whole":"bar"} | doosri patti ka hissa chhota | board: bar 4 parts → 4 |
| c5-t02 | s1 e2 | Is patti ka ek hissa kaunsa fraction hai? | 1/8 | Is patti ka ek hissa 1/8 hai. | fraction-parts {"parts":8,"shade":1,"whole":"bar"} | 1/4 | board: bar 8 parts → 1/8 |
| c5-t02 | s1 e3 | Line ke neeche kitne barabar gap hain? | 7 | Line ke neeche 7 barabar gap hain. | fraction-line {"dens":[3,7],"from":0,"to":1} | 1/3 | board: dens [3, 7]: the second scale (below) has 7 gaps → 7 |
| c5-t02 | s2 e1 | Patti ke kitne hisson mein rang hai? | 2 | Do hisson mein rang hai, 2. | fraction-parts {"parts":7,"shade":2,"whole":"bar"} | 4/7 | board: bar 7 parts, shade 2 → 2 |
| c5-t02 | s2 e2 | Zero se 4/7 tak kitne gap chalne padte hain? | 4 | 4/7 tak 4 gap chalne padte hain. | fraction-parts {"parts":7,"shade":4,"whole":"bar"} | no | point: 1/7 a gap, 4/7 is 4 gaps from 0; board: 4 shaded of 7 → 4 |
| c5-t02 | s2 e3 | Is line ka har gap kaunsa fraction hai? | 1/5 | Is line ka har gap 1/5 hai. | fraction-line {"den":5,"from":0,"to":1} | Mona | board: den 5 → 1/5 |
| c5-t02 | s2 e4 | Kis patti ke hisse bade hain, 3 wali ke ya 10 wali ke? | 3 wali | 3 wali patti ke hisse bade hain. | fraction-bars {"bars":[{"parts":3,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]} | 2/3 | board: equal bars in 3 and 10 → the 3-part bar's parts are longer |
| c5-t02 | s3 e1 | Is patti ka ek hissa kaunsa fraction hai? | 1/5 | Is patti ka har hissa 1/5 hai. | fraction-parts {"parts":5,"shade":3,"whole":"bar"} | 3/8 | board: bar 5 parts → 1/5 |
| c5-t02 | s3 e2 | 3/8 tak pahunchne ke liye 1/8 wale kitne gap chalne hain? | 3 | 3/8 tak 1/8 wale 3 gap chalne hain. | fraction-line {"dens":[5,8],"from":0,"to":1} | yes | board: 8 gaps below, 3/8 = 3 of them → 3 |
| c5-t02 | s3 e3 | Board par 3/5 aur 3/8 mein kiske hisse bade hain? | 3/5 | 3/5 ke hisse bade hain. | compare {"left":{"title":"3/5","items":["3 hisse","har hissa 1/5","bade hisse"]},"right":{"title":"3/8","items":["3 hisse","har hissa 1/8","chhote hisse"]}} | 2/5 | board: compare, 3/5 'bade hisse' against 3/8 'chhote hisse' → 3/5 |
| c5-t02 | s3 e4 | 1/4 ki jagah line ke neeche kaunsa fraction aata hai? | 2/8 | 1/4 ki jagah neeche 2/8 aata hai. | fraction-line {"dens":[4,8],"from":0,"to":1} | 2/4 | board: dens [4, 8]: 1/4 = 2/8 (point says it) → 2/8 |
| c6 | s1 e1 | Is triangle ki kitni bhujayein hain? | 3 | Is triangle ki teen bhujayein hain. | measured {"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true} | 15 cm | board: triangle, sides [4, 5, 6] → 3 |
| c6 | s1 e2 | Hexagon ki kitni bhujaon par label likha hai? | 1 | Label sirf ek bhuja par likha hai. | shape {"shape":"hexagon","side":"5 cm"} | 30 cm | board: hexagon, one side labelled '5 cm' → 1 |
| c6 | s1 e3 | Dhaaga kahan chalta hai, kinaare par ya andar? | kinaare par | Dhaaga kinaare par chalta hai. | measured {"shape":"rect","unit":"cm","w":6,"h":4,"trace":true} | 20 cm | point: the thread runs on the edge → kinaare par |
| c6 | s2 e1 | Is rectangle mein 10 m ki kitni bhujayein hain? | 2 | 10 m ki do bhujayein hain. | measured {"shape":"rect","unit":"m","w":10,"h":6,"trace":true} | 32 m | board: rect w 10, h 6: the two long sides → 2 |
| c6 | s2 e2 | Aadhe chakkar mein lambai kitni baar aati hai? | ek baar | Aadhe chakkar mein lambai ek baar aati hai. | measured {"shape":"rect","unit":"m","w":12,"h":5,"trace":true} | 34 m | point: half a round = one length + one breadth → once |
| c6 | s2 e3 | Square ki kitni bhujayein barabar hoti hain? | chaaron | Square ki chaaron bhujayein barabar hoti hain. | measured {"shape":"square","unit":"cm","w":6,"h":6,"trace":true} | 24 cm | board: square: all four sides 6 → chaaron |
| c6 | s3 e1 | Is square ki bhujayein kaisi hain, barabar ya alag-alag? | barabar | Is square ki saari bhujayein barabar hain. | shape {"shape":"square","name":"parimap 60 m"} | 15 m | board: square 'parimap 60 m': a square's sides are equal → barabar |
| c6 | s3 e2 | Aadhe chakkar mein lambai ke saath aur kya aata hai? | chaudai | Aadhe chakkar mein ek lambai aur ek chaudai aati hai. | shape {"shape":"rectangle","side":"20 m","name":"parimap 60 m"} | 10 m | point: half a round = one length + one breadth → chaudai |
| c6 | s3 e3 | Gate kitne metre ka hai? | 2 m | Gate 2 m ka hai. | measured {"shape":"rect","unit":"m","w":12,"h":8,"name":true,"trace":true,"mixup":"is bhuja mein 2 m ka gate"} | ₹380 | board: rect 12 × 8, 'is bhuja mein 2 m ka gate' → 2 m |

### New asked steps (A2), with the blind solve

| Script | Step | Prompt | Key | Step's result | Right | Child's own step's key | Blind solve |
|---|---|---|---|---|---|---|---|
| c4 | s1 step 1 of 2 | 5 tukdon mein se 3 kha liye. Plate par kitne tukde bache? | 2 | 2 tukde bache | Haan, 2 tukde bache, kyunki 5 mein se 3 kha liye gaye. | 2/5 | 5 pieces, 3 eaten: 5 − 3 = 2 left; the child's own step is then the bottom number (5, not 3: 2/5 against the part-part 2/3) |
| c4 | s3 step 2 of 2 | Kiska ek tukda chhota hoga, 3 wali chocolate ka ya 6 wali ka? | 6 wali | 1/6 wala tukda chhota hai | Haan, 6 wali ka tukda chhota hai, kyunki wahi chocolate zyada tukdon mein bati. | 2 | same chocolate in 3 and in 6: more equal pieces, smaller piece → the 6 one's |
| c5-t01 | s1 step 2 of 2 | 3 khambon se ghar se school tak kitne gaps bane? | 4 | 3 khambon se kul 4 gaps bane | Haan, 4 gaps, kyunki gaps hamesha beech ke khambon se ek zyada hote hain. | 1/4 kilometre | 3 poles inside: home–pole, pole–pole ×2, pole–school = 4 gaps |
| c5-t01 | s2 step 1 of 2 | 5 barabar gaps ke liye beech mein kitne marks lagenge? | 4 | beech mein 4 marks lage | Haan, 4 marks, kyunki marks hamesha gaps se ek kam hote hain. | the 2nd mark | 5 equal gaps need 5 − 1 = 4 marks inside |
| c5-t01 | s3 step 2 of 2 | Har gap 1/4 ka hai. 0 se 4 gap chalkar kis fraction par pahunchoge? | 4/4 | 4/4 = 1 | Haan, 4/4 par, yaani theek 1, kyunki ek poore mein 4 gap hote hain. | 3 | 4 gaps of 1/4 from 0 → 4/4 = 1 |
| c5-t02 | s1 step 2 of 2 | Kiski chocolate zyada hisson mein kati, Rahul ki ya Sana ki? | Rahul ki | Rahul ki chocolate 8 hisson mein, Sana ki sirf 2 mein | Haan, Rahul ki 8 hisson mein kati, kyunki 1/8 ka neeche wala number 8 hai. | Sana | 1/8 → 8 parts, 1/2 → 2 parts: Rahul's |
| c5-t02 | s2 step 1 of 2 | 5/8 aur 3/8 mein, har hissa kaunsa fraction hai? | 1/8 | dono mein 8, toh har hissa 1/8 | Haan, har hissa 1/8 hai, kyunki dono cake 8 barabar hisson mein bate. | Raju | 5/8 and 3/8: both in eighths → each part 1/8 |
| c5-t02 | s3 step 2 of 2 | Isha ki chocolate 3 mein kati. Uska har hissa kaunsa fraction hai? | 1/3 | Farhan ka har hissa 1/7, Isha ka 1/3 | Haan, har hissa 1/3, kyunki chocolate 3 barabar hisson mein kati. | Isha | Isha's chocolate in 3 equal parts → each 1/3 |
| c6 | s1 step 2 of 2 | Pehle 7 aur 9 jodo: kitne metre hue? | 16 m | 7 + 9 = 16 m | Haan, 7 + 9 = 16 m; do bhujayein judi, teesri abhi baaki hai. | 28 m | 7 + 9 = 16 m |
| c6 | s2 step 2 of 2 | Bracket pehle: 24 + 18 kitna hua? | 42 cm | 24 + 18 = 42 cm | Haan, 42 cm: ek lambai aur ek chaudai, yaani aadha chakkar. | 84 cm | 24 + 18 = 42 cm |
| c6 | s3 step 2 of 3 | Aadha chakkar matlab ek lambai aur ek chaudai. 50 + 30 kitna? | 80 m | 50 + 30 = 80 m | Haan, 80 m: ek lambai aur ek chaudai milkar aadha chakkar. | 480 m | 50 + 30 = 80 m |
| c6 | s3 step 3 of 3 | Poora chakkar aadhe ka do guna hai. 2 × 80 kitna? | 160 m | 2 × 80 = 160 m | Haan, 160 m, kyunki do aadhe chakkar milke ek poora chakkar. | 480 m | 2 × 80 = 160 m |

### Every changed sentence (Hinglish; the `en` changed with it; boards as `{template params}`)

| Script | Field | Old | New | 016 item: the judge's row |
|---|---|---|---|---|
| c4 | s1.e1.ask.prompt | Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1? | Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai? | E: the repeated frame "1/2 hai ya 1/x?" (c4 clause 12) |
| c4 | s1.e2.viewCaption | Pizza aur cake ab do patti ban gaye hain, pizza upar wali patti mein aur cake neeche wali mein. Dono pattiyon ke teen-teen tukde hain. | Pizza aur cake ab do patti ban gaye hain, pizza pehli patti mein aur cake doosri mein. Dono pattiyon ke teen-teen tukde hain. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s1.e2.ask.viewCaption | Upar wali patti pizza hai: uska ek tukda lamba hai aur do chhote. Neeche wali patti, cake, ke teeno tukde ek jitne lambe hain. | Pehli patti pizza hai: uska ek tukda lamba hai aur do chhote. Doosri patti, cake, ke teeno tukde ek jitne lambe hain. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s1.e3.ask.reask | Circle ke 3 barabar tukdon mein se 2 mein rang ho, toh rangin tukde circle ka kaunsa fraction hain? | Ek aur tukde mein rang bharne ke baad, rangin tukde poore circle ka kaunsa fraction hain? | B1: the e3 re-ask did the card's work (offtopic 34, steering 44) |
| c4 | s1.e4.point | Is baar upar wali patti ke 8 barabar tukde hain. Ek mein rang, saat bina rang ke. Rangin tukda 1/8 hai. Dhyaan do, 1/8 ka 8 saare tukde ginta hai, bache hue 7 nahi. | Is baar pehli patti ke 8 barabar tukde hain. Ek mein rang, saat bina rang ke. Rangin tukda 1/8 hai. Dhyaan do, 1/8 ka 8 saare tukde ginta hai, bache hue 7 nahi. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s1.e4.ask.prompt | Neeche wali patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai? | Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai? | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s1.e4.ask.simpler | Kaatne se pehle neeche wali patti mein kitne tukde the, woh gino. Phir use Raju ke 5 se milao. | Kaatne se pehle doosri patti mein kitne tukde the, woh gino. Phir use Raju ke 5 se milao. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s1.workedExample.problem | Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Ab dekhte hain ki khaye hue tukde poori barfi ka kaunsa fraction hain. | Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Ab dekhte hain ki bache hue tukde poori barfi ka kaunsa fraction hain. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.problemAlt | Board par barfi dekho: rangin tukde woh hain jo kha liye gaye, aur bina rang ke plate par bache. Hum do gintiyan karenge, saare tukde aur rangin tukde, aur unhi se fraction banega. | Board par barfi dekho: rangin tukde plate par bache hain, aur bina rang ke tukde kha liye gaye. Hum do gintiyan karenge, saare tukde aur bache hue tukde, aur unhi se fraction banega. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.simpler | Pehle ek chhoti baat yaad karo: roti ke 2 barabar tukdon mein se 1 khaya, toh roti ka 1/2 khaya. Barfi mein bhi wahi karna hai: saare tukde neeche wale number mein, khaye hue upar wale number mein. | Pehle ek chhoti baat yaad karo: roti ke 2 barabar tukdon mein se 1 bacha, toh roti ka 1/2 bacha. Barfi mein bhi wahi karna hai: saare tukde neeche wale number mein, bache hue upar wale number mein. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.find | khaye hue tukde, fraction mein | bache hue tukde, fraction mein | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.steps[0].do | Pehle neeche wala number | Pehle gino ki plate par kitne tukde bache | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.steps[0].result | 5 | 2 tukde bache | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.steps[0].why | woh poori barfi ke saare barabar tukde ginta hai | 5 tukdon mein se 3 kha liye gaye | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.steps[0].simpler | Socho, koi kuch na khaata, toh plate par barfi ke saare tukde rehte. Woh poori ginti neeche wale number mein jaati hai, yahan 5. | Board par rangin tukde gino; wahi plate par bache hain. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.steps[1].result | 3 | 2 | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.steps[1].why | woh sirf khaye hue tukde ginta hai | sawaal bache hue tukdon ka hai, aur upar wala number wahi tukde ginta hai | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.steps[1].simpler | Ulta bhi gin sakte ho: 5 tukdon mein se plate par bache hue tukde hata do, toh khaye hue tukde milte hain, 3. Upar wala number 3. | Upar wala number un tukdon ko ginta hai jinki baat poochhi gayi hai. Yahan baat bache hue tukdon ki hai. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.prompt | Dono numbers ko ek saath likho, beech mein line. Kaunsa fraction bana? | Ab neeche wala number tum socho. Bache hue tukde poori barfi ka kaunsa fraction hain? | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.reask | Barfi ke 5 barabar tukdon mein se 3 khaye gaye, toh khaye hue tukde barfi ka kaunsa fraction hain? | Plate par bache 2 tukde poori barfi ka kaunsa fraction hain? | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.key | 3/5 | 2/5 | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.why | 5 barabar tukdon mein se 3 khaye gaye, isliye neeche wala number 5 aur upar wala 3 | barfi ke 5 barabar tukde the aur unmein se 2 bache, isliye neeche wala number 5 aur upar wala 2 | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.whyAlt | bache hue do tukde barfi ka 2/5 hain, aur khaye hue baaki 3, yaani 3/5; dono milkar 5/5, poori barfi | khaye hue 3 tukde neeche nahi jaate; neeche hamesha poori barfi ke saare tukde aate hain, 5, toh 2/5 | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.accept[0] | teen-paanchvaan | do-paanchvaan | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.accept[1] | teen paanchvaan | do paanchvaan | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.accept[2] | three fifths | two fifths | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.accept[3] | three-fifths | two-fifths | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.accept[4] | 3 by 5 | 2 by 5 | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.wrongIfMis | 3/2 | 2/3 | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.simpler | Jo number saare tukde ginta hai, woh line ke neeche likho, aur jo khaye hue tukde ginta hai, woh line ke upar. | Neeche wala number poori barfi ke saare tukde ginta hai, khaane se pehle wale. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.board | {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar","hideResult":true}} | {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar","hideResult":true}} | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.viewCaption | Is circle ke saare tukde barabar hain. Rangin tukde khaye hue hain, aur bina rang ke tukde plate par bache hue. | Is circle ke saare tukde barabar hain. Rangin tukde plate par bache hue hain, aur bina rang ke tukde kha liye gaye. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.answerBoard | {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}} | {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}} | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.answer | khaye hue tukde barfi ka 3/5 hain | bache hue tukde barfi ka 2/5 hain | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.why | 5 barabar tukdon mein se 3 khaye gaye; bache hue 2 tukde neeche wale number mein nahi jaate | 5 barabar tukdon mein se 2 bache; khaye hue 3 tukde neeche wale number mein nahi jaate | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.board | {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":3,"labels":false,"hideResult":true}} | {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}} | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.viewCaption | Wahi barfi ab ek circle ki tarah bani hai: paanch barabar tukde, unmein se teen mein rang. Rangin tukde khaye hue tukde hain. | Wahi barfi ab ek circle ki tarah bani hai: paanch barabar tukde, unmein se do mein rang. Rangin tukde plate par bache hue hain. | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.checks[2].why | bada tukda aadha cake hai; teeno chhote milkar baaki aadha, toh har chhota tukda 1/4 se chhota hai | chaaron tukde milkar poora cake hain aur bada tukda baaki se bada hai, toh har chhota tukda 1/4 se kam | E: check 3's why "bada tukda aadha cake hai" (steady 68, offtopic 72); its hint with it |
| c4 | s1.checks[2].simpler | Pehle dekho, bada tukda cake ka kitna gherta hai. Phir socho, baaki jagah teen chhote tukdon mein bati hai. | Socho, chaaron tukde barabar hote toh har ek kitna hota. Phir dekho, bade tukde ne baaki teen ke liye kitni jagah chhodi. | E: check 3's why "bada tukda aadha cake hai" (steady 68, offtopic 72); its hint with it |
| c4 | s1.remediation[0].say | Ek rassi socho, jo ek lambe aur kuch chhote tukdon mein kati. Yeh baant barabar nahi, isliye tukde gin kar fraction naam nahi rakh sakte. Ab ek kaagaz ko theek beech se modo aur kaato: dono tukde ek jaise hain, tabhi har tukda aadha hai. | Board par ek rassi dekho, jo ek lambe aur do chhote tukdon mein kati. Yeh baant barabar nahi, isliye tukde gin kar naam nahi rakhte. Ab kaagaz dekho, beech se moda aur kaata: dono tukde ek jaise hain, isliye inka naam rakh sakte hain. | C1: rope-and-paper remediation said over the next card's roti (steady 58, stuck 22, offtopic 62, steering 32): its own board, spoken |
| c4 | s1.remediation[1].say | Jab chocolate ke saare tukde barabar hon, toh neeche wala number batata hai ki poori chocolate kitne barabar tukdon mein bati thi. Tukde kha lo ya bacha lo, yeh ginti nahi badalti. Upar wala number bas woh tukde ginta hai jinki baat ho rahi hai. | Socho, ek chocolate ke saare tukde barabar hain: neeche wala number batata hai ki poori chocolate kitne barabar tukdon mein bati thi. Tukde kha lo ya bacha lo, yeh ginti nahi badalti. Upar wala number bas woh tukde ginta hai jinki baat ho rahi hai. | C1: no board: written as a 'socho' telling |
| c4 | s1.remediation[1].sayAlt | Ek paratha 8 barabar tukdon mein kata socho. Usmein se 3 kha lo ya 5, paratha phir bhi 8 tukdon se hi bana tha, isliye neeche wala number 8 hi rehta hai, aur upar wala number sirf khaye hue tukde ginta hai. | Ek roti 8 barabar tukdon mein kati socho. Usmein se 3 kha lo ya 5, roti phir bhi 8 tukdon se hi bani thi, isliye neeche wala number 8 hi rehta hai, aur upar wala number sirf khaye hue tukde ginta hai. | E: paratha over a board labelled roti (steering 12) |
| c4 | s1.remediation[1].sayAlt.viewCaption | Paratha yahan ek patti ban gaya hai: aath barabar tukde, aur rangin tukde khaye hue. | Roti yahan ek patti ban gayi hai: aath barabar tukde, aur rangin tukde khaye hue. | E: paratha over a board labelled roti (steering 12) |
| c4 | s2.e3.pointAlt | Kisi cheez ka fraction nikalna ho, toh neeche wala number batata hai kitne bachche barabar baant rahe hain. Yahan 2 bachche yeh 20 kanche baant rahe hain: har bachche ko 10, yaani 20 ka aadha 10. | Ise paison se socho: 20 rupaye ke 10-10 rupaye ke dher banao, toh 2 dher bante hain, isliye 10 rupaye 20 ka 1/2 hain. Dher ka size pata ho, toh dher gino; wahi ginti neeche wala number hai. | E: the help at steady 84 misstated the card (2 children, 20 marbles) |
| c4 | s2.remediation[1].say | Pakka tarika yeh hai: saari cheezein ek-ek karke, baari-baari 3 group mein daalo, jab tak sab khatam na ho jaayein. Ek group mein jitni aayein, 1/3 utna hi hota hai. Jo group us size ka nahi, woh 1/3 nahi. | Socho, saari cheezein ek-ek karke, baari-baari 3 group mein daal rahe ho, jab tak sab khatam na ho jaayein. Ek group mein jitni aayein, 1/3 utna hi hota hai. Jo group us size ka nahi, woh 1/3 nahi. | C1: no board: written as a 'socho' telling |
| c4 | s2.remediation[1].sayAlt | Ulta socho: roti ke tukde 3 bachchon mein bate, aur ek bachche ke paas baaki dono bachchon se zyada tukde hain. Tab uske tukde 1/3 nahi, kyunki 1/3 tabhi hota hai jab teeno ke paas ek jitna ho. | Ulta socho: roti ke 8 tukde 3 bachchon mein bate, ek ko 4 aur baaki do ko 2-2. 4 wale ke tukde 1/3 nahi, kyunki 1/3 tabhi hota hai jab teeno ke paas ek jitna ho. | C1: the sayAlt's own board (4, 2, 2) spoken by it |
| c4 | s3.e2.viewCaption | Dono pizza ab ek jitni lambi patti ban gaye hain: upar wali patti chhe barabar tukdon mein, neeche wali chaar mein. | Dono pizza ab ek jitni lambi patti ban gaye hain: pehli patti chhe barabar tukdon mein, doosri chaar mein. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.e2.ask.viewCaption | Dono pattiyan ek jitni lambi hain. Upar wali patti ka ek tukda aur neeche wali patti ka ek tukda aamne-saamne dekho. | Dono pattiyan ek jitni lambi hain. Pehli patti ka ek tukda aur doosri patti ka ek tukda aamne-saamne dekho. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.e3.point | Yeh do patti ek jitni lambi hain. Upar wali patti 2 barabar tukdon mein kati hai, aur neeche wali patti 5 barabar tukdon mein. 1/2 ka 2 aur 1/5 ka 5 bas yahi batate hain ki patti kitne barabar tukdon mein kati. | Yeh do patti ek jitni lambi hain. Pehli patti 2 barabar tukdon mein kati hai, aur doosri patti 5 barabar tukdon mein. 1/2 ka 2 aur 1/5 ka 5 bas yahi batate hain ki patti kitne barabar tukdon mein kati. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.e3.ask.prompt | 5 toh 2 se bada number hai. {friend} ka kehna hai ki isliye neeche wali patti ka 1/5 wala tukda, upar wali patti ke 1/2 wale tukde se bada hai. Kya yeh sahi hai? | 5 toh 2 se bada number hai. {friend} ka kehna hai ki isliye doosri patti ka 1/5 wala tukda, pehli patti ke 1/2 wale tukde se bada hai. Kya yeh sahi hai? | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.e3.ask.viewCaption | Dono circle ek jitne bade hain: do tukdon wala circle upar wali patti hai, paanch tukdon wala neeche wali. Dono ka ek-ek tukda dhyaan se dekho. | Dono circle ek jitne bade hain: do tukdon wala circle pehli patti hai, paanch tukdon wala doosri. Dono ka ek-ek tukda dhyaan se dekho. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.workedExample.problem | Do ek jaisi chocolate hain: ek 3 barabar tukdon mein kati, doosri 6 mein. Dekhte hain ki 3 wali ke ek tukde ko dhakne ke liye 6 wali ke kitne tukde lagenge. | Do ek jaisi chocolate hain: ek 3 barabar tukdon mein kati, doosri 6 mein. Dekhte hain, 3 wali ke ek tukde par 6 wali ke kitne tukde aate hain. | A2/A3: problem to 30 words; step 2 asked |
| c4 | s3.workedExample.steps[0].result | pehli chocolate ke 3 barabar tukde, unme se 1 tukda | pehli chocolate ka 3 mein se 1 tukda | A2/A3: problem to 30 words; step 2 asked |
| c4 | s3.workedExample.steps[0].why | chocolate ke kitne barabar tukde hue, yeh neeche wala number 3 batata hai | chocolate 3 barabar tukdon mein kati | A2/A3: problem to 30 words; step 2 asked |
| c4 | s3.workedExample.steps[1].do | Phir 1/6 ko socho | Phir 1/6 wala tukda 1/3 wale se milao | A2/A3: problem to 30 words; step 2 asked |
| c4 | s3.workedExample.steps[1].result | doosri chocolate ke 6 barabar tukde, unme se 1 tukda | 1/6 wala tukda chhota hai | A2/A3: problem to 30 words; step 2 asked |
| c4 | s3.checks[0].viewCaption | Meena ki roti upar wali patti hai, do barabar tukdon mein; Sonu ki roti neeche wali patti hai, nau barabar tukdon mein. Dono pattiyan ek jitni lambi hain. | Meena ki roti pehli patti hai, do barabar tukdon mein; Sonu ki roti doosri patti hai, nau barabar tukdon mein. Dono pattiyan ek jitni lambi hain. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.checks[1].simpler | Board par dono patti dekho: upar wali patti 8 tukdon mein, neeche wali patti 2 mein. Farhan ka ek tukda aur Gita ka ek tukda milao. | Board par dono patti dekho: pehli patti 8 tukdon mein, doosri patti 2 mein. Farhan ka ek tukda aur Gita ka ek tukda milao. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.remediation[0].viewCaption | Dono roti ab ek jitni lambi patti hain: upar wali 3 barabar tukdon mein, neeche wali 12 mein. | Dono roti ab ek jitni lambi patti hain: pehli 3 barabar tukdon mein, doosri 12 mein. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s3.remediation[0].then.viewCaption | Dono cake ab ek jitni lambi patti hain: upar wali nau barabar tukdon mein, neeche wali saat mein. | Dono cake ab ek jitni lambi patti hain: pehli nau barabar tukdon mein, doosri saat mein. | E: upar/neeche for the strips' positions (steady 32, 106, 108): pehli/doosri patti |
| c4 | s1.workedExample.yourStep.accept[5] | (none) | 2/5 hai | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.workedExample.yourStep.accept[6] | (none) | do bata paanch | A2 + E: skill 1's own step was trivial; worked re-ask stated 5 and 3 (steady 54, offtopic 50) |
| c4 | s1.remediation[0].board | (none) | {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Rassi"},{"parts":2,"title":"Kaagaz"}]}} | C1: rope-and-paper remediation said over the next card's roti (steady 58, stuck 22, offtopic 62, steering 32): its own board, spoken |
| c4 | s1.remediation[0].viewCaption | (none) | Rassi aur kaagaz yahan do patti ban gaye hain: rassi ka ek tukda lamba aur do chhote, kaagaz ke dono tukde ek jitne. | C1: rope-and-paper remediation said over the next card's roti (steady 58, stuck 22, offtopic 62, steering 32): its own board, spoken |
| c5-t01 | s1.e1.viewCaption | Yahan line ki jagah ek patti hai, do barabar hisson mein, aur ek hissa rangin hai. Rangin hissa patti ke shuru se theek beech tak jaata hai, jaise line par 0 se beech wale mark tak. | Yahan line ki jagah ek patti hai, do barabar gaps mein, aur ek gap rangin hai. Rangin gap patti ke shuru se theek beech tak jaata hai, jaise line par 0 se beech wale mark tak. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.e1.ask.viewCaption | Yahan do barabar lambi pattiyaan hain: pehli do barabar hisson mein, ek hissa rangin, aur doosri teen barabar hisson mein, abhi bina rang ke. | Yahan do barabar lambi pattiyaan hain: pehli do barabar gaps mein, ek gap rangin, aur doosri teen barabar gaps mein, abhi bina rang ke. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.e2.viewCaption | Pehli patti saat barabar hisson mein hai, aur uska pehla hissa rangin hai, 1/7. Patti par hisson ke beech chhe marks hain, par hisse saat. | Pehli patti saat barabar gaps mein hai, aur uska pehla gap rangin hai, 1/7. Patti par gaps ke beech chhe marks hain, par gaps saat. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.e2.ask.prompt | Line ke neeche dekho. Wahan 0 aur 1 ke beech 7 marks hain, sab barabar doori par. Line ke neeche kitne barabar gaps bane hain? | Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain? | E: the frame "0 aur 1 ke beech N marks hain, barabar doori par" through skill 1 |
| c5-t01 | s1.e2.ask.viewCaption | Pehli patti saat barabar hisson mein hai, uska pehla hissa rangin. Doosri patti utni hi lambi hai aur abhi bina rang ke; uske hisse line ke neeche wale marks se bante hain. | Pehli patti saat barabar gaps mein hai, uska pehla gap rangin. Doosri patti utni hi lambi hai aur abhi bina rang ke; uske gaps line ke neeche wale marks se bante hain. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.e3.viewCaption | Pehli patti aath barabar hisson mein hai, aur uska ek rangin hissa 1/8 hai; doosri patti do hisson mein hai, aur uska rangin hissa aadha. Dono rangin hisson ki lambai milaakar dekho. | Pehli patti aath barabar gaps mein hai, aur uska ek rangin gap 1/8 hai; doosri patti do gaps mein hai, aur uska rangin gap aadha. Dono rangin gaps ki lambai milaakar dekho. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.e3.pointAlt | Ek chocolate ko 8 barabar hisson mein todo, toh har hissa 7 hisson wale se patla hota hai. Line par bhi 8 barabar gaps mein har gap chhota hai, isliye pehla mark, 1/8, 1/7 se pehle aata hai. | Ek chocolate ko 8 barabar hisson mein todo, toh har hissa 7 hisson wale se patla hota hai. Line par bhi 8 barabar gaps mein har gap chhota hai, isliye pehla mark, 1/8, pehle se 0 ke zyada paas aata hai. | judge's near miss: "1/8, 1/7 se pehle" over a board with no 1/7 (steady 14, offtopic 44) |
| c5-t01 | s1.e3.ask.viewCaption | Dhyan pehle hisse par rakho: pehli patti aath barabar hisson mein hai aur uska pehla hissa rangin hai, doosri utni hi lambi patti das barabar hisson mein. Dono pattiyon ka baayan kinaara line ka 0 hai. | Dhyan pehle gap par rakho: pehli patti aath barabar gaps mein hai aur uska pehla gap rangin hai, doosri utni hi lambi patti das barabar gaps mein. Dono pattiyon ka baayan kinaara line ka 0 hai. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.workedExample.problem | Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par khade hain. Saath mein nikaalte hain ki pehla khamba ghar se kitne kilometre door hai. | Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Dekhte hain, pehla khamba ghar se kitne kilometre door hai. | A2/A3: problem to 30 words; told step to 30; an asked step |
| c5-t01 | s1.workedExample.steps[0].why | ghar se school tak ka poora raasta hi humara ek poora hai | poora raasta hi humara ek poora hai | A2/A3: problem to 30 words; told step to 30; an asked step |
| c5-t01 | s1.workedExample.steps[1].result | 3 khambon se kul 4 bane | 3 khambon se kul 4 gaps bane | E: "3 khambon se kul 4 bane" (noun missing; result strings are spoken) |
| c5-t01 | s1.workedExample.viewCaption | Is patti ko raasta samjho: baayan kinaara ghar, daayan kinaara school, aur hisson ke beech ke teen marks teen khambe. Rangin hissa ghar se pehle khambe tak ka raasta hai. | Is patti ko raasta samjho: baayan kinaara ghar, daayan kinaara school, aur gaps ke beech ke teen marks teen khambe. Rangin gap ghar se pehle khambe tak ka raasta hai. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.checks[0].prompt | Is line par 0 aur 1 ke beech 10 marks hain, barabar doori par. 0 ke baad pehla mark kaunsa fraction hai? | 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai? | E: the frame "0 aur 1 ke beech N marks hain, barabar doori par" through skill 1 |
| c5-t01 | s1.checks[0].viewCaption | Yeh patti barabar hisson mein kati hai, aur sirf pehla hissa rangin hai. Hisson ke beech ke marks wahi hain jo line par 0 aur 1 ke beech the; ab baayein kinaare se daayein kinaare tak saare hisse gino. | Yeh patti barabar gaps mein kati hai, aur sirf pehla gap rangin hai. Gaps ke beech ke marks wahi hain jo line par 0 aur 1 ke beech the; ab baayein kinaare se daayein kinaare tak saare gaps gino. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.checks[1].viewCaption | Do barabar lambi pattiyaan hain, pehli chaar barabar hisson mein aur doosri gyarah mein. Dono pattiyon ka pehla hissa, baayein kinaare se, dhyan se dekho. | Do barabar lambi pattiyaan hain, pehli chaar barabar gaps mein aur doosri gyarah mein. Dono pattiyon ka pehla gap, baayein kinaare se, dhyan se dekho. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.remediation[0].say | Darzi ka ribbon socho, 0 se 1 metre. Line ke upar 6 chalk ke marks hain, aur ribbon ke 7 barabar gap. Pehla mark pehle gap ke end par hai, yaani 1/7 metre. Naam gap ginkar milta hai, marks ginkar nahi. | Darzi ka ribbon socho, 0 se 1 metre. Line par 6 chalk ke marks hain, aur ribbon ke 7 barabar gap. Pehla mark pehle gap ke end par hai, yaani 1/7 metre. Naam gap ginkar milta hai, marks ginkar nahi. | C2: the count-marks board drew the 11 ticks its card asks for (4 lessons) |
| c5-t01 | s1.remediation[0].simpler | Line ke upar ungli 0 se 1 tak sarkao aur har khaali jagah par ek gino. Ginti chalk marks se ek zyada aati hai. | Line par ungli 0 se 1 tak sarkao aur har khaali jagah par ek gino. Ginti chalk marks se ek zyada aati hai. | C2: the count-marks board drew the 11 ticks its card asks for (4 lessons) |
| c5-t01 | s1.remediation[0].board | {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7]]}} | {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":1,"label":"1/7"}]}} | C2: the count-marks board drew the 11 ticks its card asks for (4 lessons) |
| c5-t01 | s1.remediation[0].viewCaption | Pehli patti darzi ka ribbon hai: saat barabar hisse, aur pehla hissa rangin, yaani 1/7 metre. Hisson ke beech ke marks hi chalk ke marks hain. | Yeh patti darzi ka ribbon hai: saat barabar gaps, aur pehla gap rangin, yaani 1/7 metre. Gaps ke beech ke marks hi chalk ke marks hain. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.remediation[0].then.prompt | Ribbon par line ke neeche pehla chalk mark 1/12 metre par hai. Line ke neeche kitne chalk ke marks hain? | Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain? | C2/W13: the card no longer names 1/12 over a board that labels 1/7 |
| c5-t01 | s1.remediation[0].then.reask | Pehla chalk mark 1/12 metre par ho, toh ribbon par line ke neeche kitne chalk ke marks hain? | Ribbon line ke neeche 12 barabar gaps mein ho, toh wahan kitne chalk ke marks hain? | B3: a re-ask carries its givens (stuck 72, steering 10) |
| c5-t01 | s1.remediation[0].then.viewCaption | Pehli patti ribbon ke saat barabar hisse dikhati hai, pehla rangin. Doosri patti abhi poori hai, bina kisi mark ke, uske chalk ke marks tumhe sochne hain. | Pehli patti ribbon ke saat barabar gaps dikhati hai, pehla rangin. Doosri patti abhi poori hai, bina kisi mark ke, uske chalk ke marks tumhe sochne hain. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.remediation[1].say | Board par ek line hai: line ke dono taraf ke gap 0 se 1 ka wahi ek poora baant-te hain. Fraction ka neeche wala number jitna bada, utne zyada barabar gaps, aur har gap utna chhota. Bada number matlab bada gap nahi. | Board par ek hi line hai, 0 se 1: ek taraf 2 barabar gap, doosri taraf 5. Fraction ka neeche wala number jitna bada, utne zyada gap, aur har gap utna chhota: 1/5 ka gap 1/2 ke gap se chhota hai. | C1: no board: its own halves-and-fifths line, spoken |
| c5-t01 | s1.remediation[1].sayAlt | Ek hi laddu socho: 2 bachchon mein baanto toh har ek ko bada hissa milta hai, 10 bachchon mein baanto toh chhota. 1/10 ka 10 baantne walon ki ginti jaisa hai: woh jitna bada, har gap utna chhota. | Ek hi laddu socho: 2 bachchon mein baanto toh har ek ko bada hissa milta hai, 5 bachchon mein baanto toh chhota. 1/5 ka 5 baantne walon ki ginti jaisa hai: woh jitna bada, har gap utna chhota. | C1: no board: its own halves-and-fifths line, spoken |
| c5-t01 | s1.remediation[1].then.viewCaption | Pehli patti ka pehla hissa rangin hai, 1/5. Doosri patti utni hi lambi hai par saat barabar hisson mein, uska pehla hissa bhi baayein kinaare se dekho. | Pehli patti ka pehla gap rangin hai, 1/5. Doosri patti utni hi lambi hai par saat barabar gaps mein, uska pehla gap bhi baayein kinaare se dekho. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.remediation[2].viewCaption | Pehli patti sadak hai, ghar se chai ki dukaan tak: saat barabar hisse, aur rangin hissa wahan tak jahan khilona ruka, 1/7 kilometre. Doosri patti wahi sadak hai, chhe barabar hisson mein. | Pehli patti sadak hai, ghar se chai ki dukaan tak: saat barabar gaps, aur rangin gap wahan tak jahan khilona ruka, 1/7 kilometre. Doosri patti wahi sadak hai, chhe barabar gaps mein. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.remediation[2].then.viewCaption | Dono pattiyaan ek hi sadak hain, ghar se chai ki dukaan tak. Pehli mein pehla hissa rangin hai, aur doosri chhe barabar hisson mein bati hai, abhi bina rang ke. | Dono pattiyaan ek hi sadak hain, ghar se chai ki dukaan tak. Pehli mein pehla gap rangin hai, aur doosri chhe barabar gaps mein bati hai, abhi bina rang ke. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.e1.viewCaption | Yeh patti teen barabar hisson mein hai, aur pehle do hisse rangin hain, 2/3. Rang baayein kinaare se shuru hota hai, jaise line par 0 se gap chalna. | Yeh patti teen barabar gaps mein hai, aur pehle do gaps rangin hain, 2/3. Rang baayein kinaare se shuru hota hai, jaise line par 0 se gap chalna. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.e1.pointAlt | Yahi baat doosre sire se: 2/3 wala mark 0 se 2 gap door hai aur 1 se sirf 1 gap. Line ke 3 gaps mein se 2 uske peeche hain, isliye uska naam 2/3 hai. | Chocolate se socho: 3 barabar hisson wali chocolate ke 2 hisse kha lo, toh tumne 2/3 chocolate khayi. Line par 1/3 wale 2 gap bhi waise hi 0 se 2/3 tak le jaate hain. | E: "Yahi baat doosre sire se" used as a hint (steady 54) |
| c5-t01 | s2.e1.ask.viewCaption | Pehli patti mein teen mein se do hisse rangin hain. Doosri patti aath barabar hisson mein hai, bina rang ke, aur uske hisse bhi baayein kinaare se ek-ek karke gine jaate hain. | Pehli patti mein teen mein se do gaps rangin hain. Doosri patti aath barabar gaps mein hai, bina rang ke, aur uske gaps bhi baayein kinaare se ek-ek karke gine jaate hain. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.e1.simpler | 2/3 ko '3 mein se 2' padho: line jitne hisson mein kati, woh 3; tum jitne chale, woh 2. | 2/3 ko '3 mein se 2' padho: line jitne gaps mein kati, woh 3; tum jitne chale, woh 2. | E: "hissa" (c5-t01: a stretch of the line is a gap) |
| c5-t01 | s2.e2.viewCaption | Is patti ke teeno barabar hisse rangin hain, toh poori patti bhar gayi. Koi hissa khaali nahi bacha. | Is patti ke teeno barabar gaps rangin hain, toh poori patti bhar gayi. Koi gap khaali nahi bacha. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.e2.ask.viewCaption | Pehli patti teen barabar hisson mein hai; doosri utni hi lambi hai, par uspar abhi koi mark nahi. Doosri poori patti 0 se 1 tak ka ek poora hai. | Pehli patti teen barabar gaps mein hai; doosri utni hi lambi hai, par uspar abhi koi mark nahi. Doosri poori patti 0 se 1 tak ka ek poora hai. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.e3.viewCaption | Teen ek jaisi pattiyaan hain, har ek chhe barabar hisson mein. Pehli mein do hisse rangin, doosri mein teen, aur teesri mein paanch, aur doosri ka rang theek aadhi patti tak hai. | Teen ek jaisi pattiyaan hain, har ek chhe barabar gaps mein. Pehli mein do gaps rangin, doosri mein teen, aur teesri mein paanch, aur doosri ka rang theek aadhi patti tak hai. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.workedExample.steps[1].result | har ek 1/5 ka hai | har gap 1/5 ka hai | E: "3 khambon se kul 4 bane" (noun missing; result strings are spoken) |
| c5-t01 | s2.checks[0].prompt | 0 aur 1 ke beech 5 marks hain, sab barabar doori par. 0 ke baad chautha mark kaunsa fraction hai? | Is line par 5 marks lage hain, aur saare gaps ek jitne hain. 0 ke baad chautha mark kaunsa fraction hai? | E: the frame "0 aur 1 ke beech N marks hain, barabar doori par" through skill 1 |
| c5-t01 | s2.checks[0].viewCaption | Yeh patti barabar hisson mein kati hai, aur baayein kinaare se kuch hisse rangin hain. Rang wahan khatam hota hai jahan line par chautha mark tha. | Yeh patti barabar gaps mein kati hai, aur baayein kinaare se kuch gaps rangin hain. Rang wahan khatam hota hai jahan line par chautha mark tha. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.checks[1].viewCaption | Do barabar lambi pattiyaan hain, pehli paanch barabar hisson mein, doosri das mein. Dono ke pehle teen hisse baayein kinaare se ek doosre ke saamne rakhkar dekho. | Do barabar lambi pattiyaan hain, pehli paanch barabar gaps mein, doosri das mein. Dono ke pehle teen gaps baayein kinaare se ek doosre ke saamne rakhkar dekho. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.remediation[0].viewCaption | Pehli patti chaar barabar hisson mein hai, pehle do hisse rangin, 2/4, aur hisson ke beech teen marks. Doosri patti utni hi lambi hai, par uske hisse kaafi patle hain. | Pehli patti chaar barabar gaps mein hai, pehle do gaps rangin, 2/4, aur gaps ke beech teen marks. Doosri patti utni hi lambi hai, par uske gaps kaafi patle hain. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.remediation[0].then.viewCaption | Doosri patti ke hisson ke beech ke marks hi line ke neeche wale marks hain, aur pehli patti mein chaar hisse hain, do rangin. | Doosri patti ke gaps ke beech ke marks hi line ke neeche wale marks hain, aur pehli patti mein chaar gaps hain, do rangin. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.remediation[1].viewCaption | Pehli patti ke do rangin hisse lambe hain, doosri ke do rangin hisse chhote. Dono mein rangin hisse do-do hain, par rang kahan tak pahuncha, woh alag hai. | Pehli patti ke do rangin gaps lambe hain, doosri ke do rangin gaps chhote. Dono mein rangin gaps do-do hain, par rang kahan tak pahuncha, woh alag hai. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.remediation[1].then.viewCaption | Doosri patti chhe barabar hisson mein hai, aur uske do chhote hisse rangin hain; pehli mein teen mein se do lambe hisse rangin. Doosri patti ke hisse baayein kinaare se ek-ek karke pehli patti ke rang se milaao. | Doosri patti chhe barabar gaps mein hai, aur uske do chhote gaps rangin hain; pehli mein teen mein se do lambe gaps rangin. Doosri patti ke gaps baayein kinaare se ek-ek karke pehli patti ke rang se milaao. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.remediation[2].viewCaption | Is patti ko sadak samjho: hisson ke beech ka har mark ek patthar hai. Rangin hissa sadak ke shuru se khilone ke patthar tak jaata hai. | Is patti ko sadak samjho: gaps ke beech ka har mark ek patthar hai. Rangin gap sadak ke shuru se khilone ke patthar tak jaata hai. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s2.remediation[2].then.viewCaption | Yeh wahi sadak hai: rang 0 se shuru hokar ek mark par rukta hai. Poori patti ke hisse bhi dekho aur rangin hisse bhi. | Yeh wahi sadak hai: rang 0 se shuru hokar ek mark par rukta hai. Poori patti ke gaps bhi dekho aur rangin gaps bhi. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s3.e1.simpler | 1 se 2 tak ka hissa bhi 0 se 1 jitna hi lamba hai, aur usmein bhi utne hi gap hain. | 1 se 2 tak ki line bhi 0 se 1 jitni hi lambi hai, aur usmein bhi utne hi gap hain. | E: "hissa" (c5-t01: a stretch of the line is a gap) |
| c5-t01 | s3.e2.point | Line par har gap 1/4 hai. 0 se 6 gap chalo: pehle 4 gap 1 tak, phir do gap aur, aur hum 6/4 par, 1 ke aage. 6/4 ka upar wala number 6, 4 se bada hai, isliye hum 1 ke aage nikal gaye. | Line par har gap 1/4 hai. Ab chhe gap aage badho: pehle 4 gap 1 tak, phir do gap aur, aur hum 6/4 par, 1 ke aage. 6/4 ka upar wala number 6, 4 se bada hai, isliye hum 1 ke aage nikal gaye. | E: "0 se 6 gap chalo" twice in skill 3 |
| c5-t01 | s3.workedExample.steps[0].do | 0 se 2 tak ki line ke har poore ko 4 barabar gaps mein kaato | Har poore ko 4 barabar gaps mein kaato | A2/A3: problem to 30 words; told step to 30; an asked step |
| c5-t01 | s3.workedExample.steps[0].result | kul 8 bane, har ek 1/4 ka | kul 8 gaps bane, har gap 1/4 ka | E: "3 khambon se kul 4 bane" (noun missing; result strings are spoken) |
| c5-t01 | s3.remediation[1].say | Jab do fractions ka upar wala number ek jaisa ho, toh dono mein utne hi gap chalne hain; farak gap ki lambai ka hai. Neeche wala number bada ho, toh har gap chhota, aur utne hi gap jaldi khatam ho jaate hain. | Socho, do fractions ka upar wala number ek jaisa hai: dono mein utne hi gap chalne hain; farak gap ki lambai ka hai. Neeche wala number bada ho, toh har gap chhota, aur utne hi gap jaldi khatam ho jaate hain. | C1: no board: a 'socho' telling |
| c5-t01 | s3.remediation[2].say | Yeh stations ki line hai, 0 se 2. Do stations ke beech 5 barabar gaps hain, toh station 1 ki jagah 5/5 hai. Train jahan ruke, woh ek pakki jagah hai, aur uska ek hi number: 0 se gine hue gap, bata 5. | Yeh stations ki line hai, 0 se 2. Do stations ke beech 5 barabar gaps hain, toh station 1 ki jagah 5/5 hai. Train jahan ruke, woh ek pakki jagah hai, aur uska ek hi number hai: upar 0 se gine hue gaps, neeche 5. | E: "bata 5" (steady 116) |
| c5-t01 | s1.remediation[1].board | (none) | {"template":"fraction-line@1","params":{"dens":[2,5],"from":0,"to":1,"marks":[[1,2],[1,5]]}} | C1: no board: its own halves-and-fifths line, spoken |
| c5-t01 | s1.remediation[1].viewCaption | (none) | Yahan ek hi line do patti ban gayi hai: pehli do barabar gaps mein, doosri paanch mein, aur dono ka pehla gap rangin. | E: patti/hisse against line/gaps in the captions (stuck 18, offtopic 26); "hissa" in two senses (steady 18) |
| c5-t01 | s1.remediation[2].then.reask | (none) | Line ke neeche 6 barabar gaps wali sadak par, pehle mark par ruka khilona 0 se kitne kilometre par hai? | B3: a re-ask carries its givens (stuck 72, steering 10) |
| c5-t01 | s2.checks[2].reask | (none) | 0 se 1 ki line par 3/4 dikhane ke liye kitne mark lagaoge, ek ya do? | B3: a re-ask carries its givens (stuck 72, steering 10) |
| c5-t02 | s1.e1.ask.prompt | Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota? | Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota? | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e1.ask.reask | Neeche wali patti ka ek hissa, upar wali patti ke ek hisse se bada hai ya chhota? | Doosri patti ka ek hissa, pehli patti ke ek hisse se bada hai ya chhota? | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e1.ask.key | neeche wali patti ka hissa chhota | doosri patti ka hissa chhota | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e1.ask.accept[0] | neeche wali patti ka hissa chhota | doosri patti ka hissa chhota | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e1.ask.accept[5] | smaller than the top part | smaller than the first strip's part | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e1.ask.why | dono patti barabar lambi hain, par neeche wali 8 hisson mein kati hai aur upar wali sirf 4 mein | dono patti barabar lambi hain, par doosri 8 hisson mein kati hai aur pehli sirf 4 mein | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e1.ask.simpler | Upar wali patti ke rangin hisse ke theek neeche dekho, aur neeche wali patti ke jo hisse us jagah mein aate hain, unhe gino. | Pehli patti ke rangin hisse ke theek neeche dekho, aur doosri patti ke jo hisse us jagah mein aate hain, unhe gino. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e2.ask.prompt | Neeche wali patti ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain? | Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain? | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e2.ask.reask | Neeche wali patti ke pehle do 1/8 hisse milkar upar wali patti ka kaunsa fraction banate hain? | Doosri patti ke pehle do 1/8 hisse milkar pehli patti ka kaunsa fraction banate hain? | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e2.ask.whyAlt | Upar wali patti ke ek hisse ko beech se aadha kaato, toh do chhote hisse bante hain, har ek neeche wali patti ke ek hisse jitna. | Pehli patti ke ek hisse ko beech se aadha kaato, toh do chhote hisse bante hain, har ek doosri patti ke ek hisse jitna. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e2.ask.simpler | Do 1/8 hisson ka sira dekho, aur dekho upar wali patti mein usi jagah tak kaunsa hissa khatam hota hai. | Do 1/8 hisson ka sira dekho, aur dekho pehli patti mein usi jagah tak kaunsa hissa khatam hota hai. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.e3.viewCaption | Yahan wahi line do patti ban gayi hai: upar wali patti teen barabar hisson mein, neeche wali saat mein, aur dono 0 se 1 tak barabar lambi. | Yahan wahi line do patti ban gayi hai: pehli patti teen barabar hisson mein, doosri saat mein, aur dono 0 se 1 tak barabar lambi. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.workedExample.problem | Rahul aur Sana ke paas ek-ek chocolate hai, dono bilkul ek jaisi. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Saath mein dekhte hain ki bada hissa kiske paas hai. | Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Saath mein dono hisse milate hain. | E: each worked problem's last line came back as the child's step; A3 problem to 30 words |
| c5-t02 | s1.workedExample.steps[1].why | ginti se hi hisse ka size pata chalta hai | neeche wala number yahi batata hai | E: "ginti" for the number of cuts (s1 step 2) |
| c5-t02 | s1.workedExample.yourStep.simpler | Dono chocolate ek jitni hain; 8 hisson wali patti ka ek hissa aur 2 hisson wali ka ek hissa milaa kar dekho. | Dono chocolate ek jitni hain; 8 hisson wali chocolate ka ek hissa aur 2 hisson wali chocolate ka ek hissa milaa kar dekho. | E: chocolate and patti for one thing (stuck 36) |
| c5-t02 | s1.checks[0].viewCaption | Dono roti yahan patti ki tarah ek ke neeche ek rakhi hain: upar wali 10 barabar hisson mein, neeche wali 5 mein, aur dono ek jitni lambi. | Dono roti yahan patti ki tarah ek ke neeche ek rakhi hain: pehli 10 barabar hisson mein, doosri 5 mein, aur dono ek jitni lambi. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s1.remediation[0].then.whyAlt | Neeche wali dor par kainchi zyada baar chali, isliye uska pehla hissa upar wali dor ke pehle hisse se pehle hi khatam ho jaata hai. | Doosri dor par kainchi zyada baar chali, isliye uska pehla hissa pehli dor ke pehle hisse se pehle hi khatam ho jaata hai. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s2.e4.ask.whyAlt | Upar wali patti ke teen mein se do hisson mein rang ho, toh zyadatar patti rangeen hai; neeche wali ke das mein se bas teen mein rang ho, toh zyadatar patti bina rang ki hai. | Pehli patti ke teen mein se do hisson mein rang ho, toh zyadatar patti rangeen hai; doosri ke das mein se bas teen mein rang ho, toh zyadatar patti bina rang ki hai. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s2.workedExample.problem | Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Dekhte hain ki kam cake kisne khaya. | Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Saath mein dono ke hisse milate hain. | E: each worked problem's last line came back as the child's step; A3 problem to 30 words |
| c5-t02 | s2.workedExample.viewCaption | Dono cake yahan do ek jaisi patti hain, dono 8 barabar hisson mein: upar wali patti mein teen hisse rangeen hain, neeche wali mein paanch. | Dono cake yahan do ek jaisi patti hain, dono 8 barabar hisson mein: pehli patti mein teen hisse rangeen hain, doosri mein paanch. | A2: an asked step |
| c5-t02 | s2.checks[0].viewCaption | Dono cake yahan patti ki tarah hain: upar wali patti Pinky ki, neeche wali Bhai ki, dono 6 barabar hisson mein. | Dono cake yahan patti ki tarah hain: pehli patti Pinky ki, doosri Bhai ki, dono 6 barabar hisson mein. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s2.checks[1].viewCaption | Dono cake yahan ek ke neeche ek patti ban gaye hain: upar wali 5 barabar hisson mein, neeche wali 10 mein. Upar wali patti ke ek hisse ke neeche, neeche wali patti ke kitne hisse aate hain, yeh gino. | Dono cake yahan ek ke neeche ek patti ban gaye hain: pehli 5 barabar hisson mein, doosri 10 mein. Pehli patti ke ek hisse ke neeche, doosri patti ke kitne hisse aate hain, yeh gino. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s2.remediation[2].say | Agar ek patti ke 2 barabar hisse hon aur utni hi lambi doosri ke 7, aur dono se ek-ek hissa hata do, toh pehli ki kami aadhi patti hai, doosri ki bas 7 mein se ek hissa. Chhoti kami, poore ke zyada paas. | Board par do ek jitni patti hain: ek ke 2 barabar hisson mein se 1 rangin, doosri ke 7 mein se 6. Pehli ki kami aadhi patti hai, doosri ki bas 7 mein se ek hissa. Chhoti kami, poore ke zyada paas. | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s2.remediation[2].simpler.board | {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":7,"shade":6,"label":""}]}} | (removed) | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s2.remediation[2].simpler.viewCaption | Do ek jaise gol hain, ek do barabar hisson mein aur ek saat mein; dono mein ek-ek hissa khaali hai. | (removed) | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s3.e1.ask.whyAlt | Neeche wali patti ka har hissa 1/8 hai, aur rang aise teen hisson mein hai. | Doosri patti ka har hissa 1/8 hai, aur rang aise teen hisson mein hai. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s3.e1.ask.simpler | Neeche wali patti ke saare hisse gino, phir sirf rang wale. | Doosri patti ke saare hisse gino, phir sirf rang wale. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s3.e2.viewCaption | Line ki jagah yahan do barabar patti hain: upar wali 5 barabar hisson mein, neeche wali 8 mein. | Line ki jagah yahan do barabar patti hain: pehli 5 barabar hisson mein, doosri 8 mein. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s3.e4.viewCaption | Line yahan do barabar patti ban gayi hai: upar wali 4 barabar hisson mein, neeche wali 8 mein, aur dono ka ant ek hi jagah hai. | Line yahan do barabar patti ban gayi hai: pehli 4 barabar hisson mein, doosri 8 mein, aur dono ka ant ek hi jagah hai. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s3.e4.ask.viewCaption | Upar wali patti ke har hisse ke theek neeche, neeche wali patti ke do hisse aate hain; isi tarah gin lo. | Pehli patti ke har hisse ke theek neeche, doosri patti ke do hisse aate hain; isi tarah gin lo. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s3.workedExample.problem | Isha ne apni chocolate ka 2/3 khaya; Farhan ki chocolate bhi utni hi badi thi, aur usne uska 2/7 khaya. Dekhte hain ki zyada kisne khaya. | Isha ne apni chocolate ka 2/3 khaya; Farhan ki chocolate bhi utni hi badi thi, aur usne uska 2/7 khaya. Chalo, dono ke hisse milakar dekhte hain. | E: each worked problem's last line came back as the child's step; A3 problem to 30 words |
| c5-t02 | s3.workedExample.steps[0].why | ginti barabar hai, isliye ab sirf hisse ka size dekhna baaki hai | upar wala number ginta hai ki kitne hisse khaye | E: skill 3 step 1's circular "kyunki ginti barabar hai, isliye…" |
| c5-t02 | s3.workedExample.steps[1].do | Phir har hisse ka size likho | Ginti barabar hai, toh ab har hisse ka size dekho | E: "likho" in a spoken lesson |
| c5-t02 | s3.workedExample.viewCaption | Dono chocolate yahan do barabar patti hain: upar wali 7 barabar hisson mein, jinmein do rangeen; neeche wali 3 mein, unmein bhi do rangeen. | Dono chocolate yahan do barabar patti hain: pehli 7 barabar hisson mein, jinmein do rangeen; doosri 3 mein, unmein bhi do rangeen. | A2: an asked step |
| c5-t02 | s3.checks[2].viewCaption | Line yahan do barabar patti ban gayi hai, upar wali 7 barabar hisson mein aur neeche wali 9 mein. Har patti ka aakhri hissa dekho, wahi uski kami hai. | Line yahan do barabar patti ban gayi hai, pehli 7 barabar hisson mein aur doosri 9 mein. Har patti ka aakhri hissa dekho, wahi uski kami hai. | 015 item 7 carried: upar/neeche for the strips' positions (pehli/doosri), and the raw key heard after "Is sawaal ka sahi jawab:" (stuck 12) |
| c5-t02 | s3.remediation[2].say | Socho, ek dibbe mein 3 barabar khaane hain aur waise hi doosre mein 8, aur dono mein bas ek-ek khaane ki kami hai. 3 wale dibbe ka khaana bada hai, toh uski kami badi hai, aur 8 wala dibba bharne ke zyada paas hai. | Board par do ek jaise dibbe hain: ek ke 3 barabar khaanon mein se 2 bhare, doosre ke 8 mein se 7. 3 wale ka khaana bada hai, toh uski kami badi hai; 8 wala bharne ke zyada paas hai. | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s3.remediation[2].sayAlt.board | {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":""},{"parts":8,"shade":7,"label":""}]}} | (removed) | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s3.remediation[2].sayAlt.viewCaption | Do ek jaise dibbe gol ban gaye hain: ek teen barabar khaanon mein, ek aath mein; dono mein ek-ek khaana khaali. | (removed) | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s2.e3.ask.reask | (none) | Mona zero se 3/5 tak gayi aur Sonu 1/5 tak, toh kaun aage pahuncha? | B3: a re-ask with its givens (steady 56) |
| c5-t02 | s2.remediation[2].board | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":7,"shade":6,"label":""}]}} | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s2.remediation[2].viewCaption | (none) | Do ek jaise gol hain, ek do barabar hisson mein aur ek saat mein; dono mein ek-ek hissa khaali hai. | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s3.remediation[2].board | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":""},{"parts":8,"shade":7,"label":""}]}} | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c5-t02 | s3.remediation[2].viewCaption | (none) | Do ek jaise dibbe gol ban gaye hain: ek teen barabar khaanon mein, ek aath mein; dono mein ek-ek khaana khaali. | C1/C3: gap-thinking remediations get boards their says speak (steady 118); s3's moves off the sayAlt it did not fit |
| c6 | s1.hook.interestSlots[0].use | Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. | Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. Ab yahi chakkar ek chhote triangle par lagate hain. | D4: the hook's last sentence leads into the point (steady 2, offtopic 2) |
| c6 | s1.hook.interestSlots[1].use | Drawing sheet ke chaaron taraf colour se border banate ho na. Woh poori border jitni lambi hai, utna hi sheet ka parimap hai. | Drawing sheet ke chaaron taraf colour se border banate ho na. Woh poori border jitni lambi hai, utna hi sheet ka parimap hai. Ab yahi border ek chhote triangle par dekhte hain. | D4: the hook's last sentence leads into the point (steady 2, offtopic 2) |
| c6 | s1.hook.interestSlots[2].use | Garden mein phoolon ki kyari ke chaaron taraf baad lagti hai. Har bhuja par lagti hai. Ek bhi chhoot gayi, toh bakri seedha andar. | Garden mein phoolon ki kyari ke chaaron taraf baad lagti hai. Har bhuja par lagti hai. Ek bhi chhoot gayi, toh bakri seedha andar. Ab ek chhote triangle ke kinaare par yahi dekhte hain. | D4: the hook's last sentence leads into the point (steady 2, offtopic 2) |
| c6 | s1.e2.point | Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. | Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. | E: "hissa" in two senses (steady 6) |
| c6 | s1.e3.point | Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bagal ki bhuja 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. | Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. | E: "upar" as a side and as a direction (steady 38, 42) |
| c6 | s1.workedExample.problem | Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Saath mein nikaalte hain ki kitni lambi baad lagegi. | Phoolon ki ek kyari triangle jaisi hai, bhujayein 7 m, 9 m aur 12 m. Uske kinaare-kinaare ek baar baad lagani hai. Dekhte hain, kitni lambi baad lagegi. | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s1.workedExample.yourStep.whyAlt | 16 mein pehle 4 jodo toh 20, phir bache 8 jodo toh 28 m; 12 ka koi hissa chhoota nahi. | 16 mein pehle 4 jodo toh 20, phir bache 8 jodo toh 28 m; 12 mein se kuch nahi chhoota. | E: "hissa" in two senses (steady 6) |
| c6 | s1.checks[1].simpler | Card ka kinaara board par ek line ban kar khula hai. Us line ki chaaron bhujayein dekho, aur socho guna ki jagah kya karna hai. | Board par card ki chaaron bhujayein dekho, chahe number sirf do par likha ho. Socho, guna ki jagah inke saath kya karna hai. | B2: the hint was true of the picture view, not the closed 10 × 4 board (steering 60) |
| c6 | s1.remediation[1].say | Kinaare par dhaaga lapeto, phir kholke scale par rakho: woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. | Socho, ek rectangle ke kinaare par dhaaga lapeta, phir khol ke scale par rakha: woh lambai parimap hai, centimetre mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. | C1: no board of its own (reused the card's figure): a 'socho' telling |
| c6 | s2.e1.point | Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. | Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. | E: "upar" as a side and as a direction (steady 38, 42) |
| c6 | s2.e1.pointAlt | Ek darwaaza socho: upar aur neeche ki bhuja ek jitni lambi, daayein aur baayein ki bhi ek jitni. Yahan bhi wahi baat hai: 10 m wali bhujayein do hain aur 6 m wali bhi do. Ek poora chakkar inhi chaar bhujaon se banta hai. | Ek darwaaza socho: uski do lambi bhujayein ek jitni hain, aur do chhoti bhi ek jitni. Yahan bhi wahi baat hai: 10 m wali bhujayein do hain aur 6 m wali bhi do. Ek poora chakkar inhi chaar bhujaon se banta hai. | E: "upar" as a side and as a direction (steady 38, 42) |
| c6 | s2.e3.point | Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh cm mein aayega, square cm mein nahi. | Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh centimetre mein aayega, square centimetre mein nahi. | E: cm and centimetre in neighbouring turns (steady 52, 56) |
| c6 | s2.workedExample.givens[0] | lambai aur chaudai pata hai, dono cm mein | lambai aur chaudai pata hai, dono centimetre mein | E: cm and centimetre in neighbouring turns (steady 52, 56) |
| c6 | s2.checks[2].why | chaar barabar bhujayein: 4 × 11 = 44 cm, aur jawab cm mein | chaar barabar bhujayein: 4 × 11 = 44 cm, aur jawab centimetre mein | E: cm and centimetre in neighbouring turns (steady 52, 56) |
| c6 | s2.remediation[0].say | Cheenti ek kone se chalti hai aur chalte-chalte metre ginti jaati hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha chakkar. Lambai + chaudai yahin tak hai. Jis kone se chali thi, woh abhi do bhujayein door hai. | Socho, ek cheenti khet ke kone se chalti hai aur metre ginti jaati hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha chakkar. Lambai + chaudai yahin tak hai. Shuru wala kona abhi do bhujayein door hai. | C1: no board of its own (reused the card's figure): a 'socho' telling |
| c6 | s2.remediation[0].sayAlt | Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod ke do barabar hisse karo. Ek hisse mein bas ek lambai aur ek chaudai aati hai; lambai + chaudai mude hue dhaage jitna hai, poore dhaage jitna nahi. | Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod ke do barabar tukde karo. Ek tukde mein bas ek lambai aur ek chaudai aati hai; lambai + chaudai mude hue dhaage jitna hai, poore dhaage jitna nahi. | E: "hissa" in two senses (steady 6) |
| c6 | s2.remediation[1].say | Parimap aur area ko jawab ki ikaai se pehchaano. Dhaage ko scale par naapte hain, toh kinaara centimetre mein aata hai; andar ke 1 cm wale square gine jaate hain, toh area square centimetre mein. Kinaare ka sawaal ho toh bhujayein jodo. | Parimap aur area ko jawab ki ikaai se pehchaano. Socho, dhaage ko scale par naapa, toh kinaara centimetre mein aaya; andar ke 1 cm wale square gine, toh area square centimetre mein. Kinaare ka sawaal ho toh bhujayein jodo. | C1: no board of its own (reused the card's figure): a 'socho' telling |
| c6 | s3.e1.point | Is square ka parimap, yaani poora kinaara, 60 m hai, aur yeh chaar barabar bhujaon mein baanta gaya hai. Ek bhuja chahiye toh 60 ko 4 se baanto. 2 se nahi, bhujayein chaar hain. | Is square ka parimap, yaani poora kinaara, 60 m hai. Yeh poora kinaara chaar barabar bhujaon se bana hai, do se nahi. Har bhuja us 60 m mein se apna barabar ka bhaag leti hai. | E: points that name the operation before the card asks for it (steady 72) |
| c6 | s3.e1.ask.why | 60 m chaar barabar hisson mein: 60 ÷ 4 = 15 m | 60 m chaar barabar bhujaon mein: 60 ÷ 4 = 15 m | E: "hissa" in two senses (steady 6) |
| c6 | s3.e1.simpler | Square ka poora kinaara chaar barabar bhujaon se banta hai, toh ek bhuja poore kinaare ka ek-chauthai hai. Do hisson mein baantoge toh har hisse mein do bhujayein aa jaayengi. | Square ka poora kinaara chaar barabar bhujaon se banta hai, toh ek bhuja poore kinaare ka ek-chauthai hai. Do mein baantoge toh har aadhe mein do bhujayein aa jaayengi. | E: "hissa" in two senses (steady 6) |
| c6 | s3.e2.point | Ab ek rectangle: parimap 60 m, lambai 20 m. Aadhe chakkar mein ek lambai aur ek chaudai aati hai. Pehle aadha chakkar nikalo, phir usme se lambai hatao. | Ab ek rectangle: parimap 60 m, lambai 20 m. Poore chakkar mein do lambai aur do chaudai aati hain, toh aadhe chakkar mein ek lambai aur ek chaudai. | E: points that name the operation before the card asks for it (steady 72) |
| c6 | s3.e2.ask.prompt | Aadhe chakkar se lambai nikaal ke kitne metre bache? | Is rectangle ki chaudai kitni hai? | B1/E: the card and its re-ask did the card's work |
| c6 | s3.e2.ask.reask | 60 m ke parimap ka aadha lo, aur usme se 20 m lambai hatao: kitne metre bache? | 60 m parimap aur 20 m lambai wale rectangle ki chaudai kitni hai? | B1/E: the card and its re-ask did the card's work |
| c6 | s3.workedExample.problem | Rani ek rectangle park ke teen chakkar daudti hai. Park 50 m lamba aur 30 m chauda hai. Saath mein nikaalte hain ki woh kul kitna daudti hai. | Rani ek rectangle park ke teen chakkar daudti hai. Park 50 m lamba aur 30 m chauda hai. Saath mein uski doori nikaalte hain. | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[1].do | Park rectangle hai, toh 2 × (lambai + chaudai) | Pehle aadha chakkar: ek lambai aur ek chaudai jodo | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[1].result | P = 2 × (50 + 30) | 50 + 30 = 80 m | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[1].why | chakkar mein 50 bhi do baar aata hai aur 30 bhi | ek lambai aur ek chaudai milkar aadha chakkar hain | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[1].simpler | Rani ka chakkar bhuja-bhuja likho: 50, 30, 50, 30. Isme 50 aur 30 ki jodi do baar aati hai, isliye 2 × (50 + 30). | Paison se socho: ₹50 aur ₹30 milke ₹80 hote hain. Waise hi 50 m aur 30 m milke 80 m. | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[2].do | Bracket ke andar jodo | Phir poora chakkar: aadhe chakkar ko do baar lo | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[2].result | 50 + 30 = 80 m | 2 × 80 = 160 m | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[2].why | ek lambai aur ek chaudai milkar aadha chakkar hain | do aadhe chakkar milke ek poora chakkar | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[2].simpler | Paison se socho: ₹50 aur ₹30 milke ₹80 hote hain. Waise hi 50 m aur 30 m milke 80 m. | Do guna matlab wahi number do baar jodna: 80 + 80 = 160. Yeh wahi hai jo 2 × 80 deta hai. | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[3].do | Aadhe chakkar ko do baar lo | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[3].result | 2 × 80 = 160 m | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[3].why | do aadhe chakkar milke ek poora chakkar | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[3].simpler | Do guna matlab wahi number do baar jodna: 80 + 80 = 160. Yeh wahi hai jo 2 × 80 deta hai. | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[4].do | Teeno chakkar ek jaise hain, toh 160 ko 3 se guna karo | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[4].result | 3 chakkar = 3 × 160 m | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[4].why | har chakkar utna hi lamba hai, 160 m | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.steps[4].simpler | Socho Rani roz ek chakkar, 160 m, daudti hai. Teen din mein woh 3 × 160 daudegi, aur ek hi din ke teen chakkar bhi utne hi hain. | (removed) | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.yourStep.prompt | Tumhari baari: 3 × 160 kitna hota hai? | Tumhari baari: Rani ne aise teen chakkar daude. Woh kul kitne metre daudi? | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.workedExample.yourStep.simpler | 160 + 160 + 160 jodo. Pehle do, phir teesra. | Teeno chakkar ek jaise hain. Socho, ek chakkar ki doori ke saath teen chakkar mein kya karna hoga. | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |
| c6 | s3.remediation[0].say | Ek poore chakkar mein har bhuja ek baar aati hai. Rectangle mein do lambai aur do chaudai hoti hain, aur square mein chaar barabar bhujayein. Toh ulta chalte hue, rectangle ka parimap aadha karo aur lambai ghatao; square ka parimap 4 se baanto. | Socho, ek poore chakkar mein har bhuja ek baar aati hai. Rectangle mein do lambai aur do chaudai hoti hain, aur square mein chaar barabar bhujayein. Toh ulta chalte hue, rectangle ka parimap aadha karo aur lambai ghatao; square ka parimap 4 se baanto. | C1: no board of its own (reused the card's figure): a 'socho' telling |
| c6 | s3.remediation[1].say | Lambai aur chaudai ka guna andar ki zameen hai, taar nahi. Taar kinaare par lagti hai, toh pehle kinaare ki poori lambai nikalo, phir har metre ke daam se guna karo. | Socho, ek plot ke chaaron taraf taar lag rahi hai. Lambai aur chaudai ka guna andar ki zameen hai, taar nahi. Taar kinaare par lagti hai, toh pehle kinaare ki poori lambai nikalo, phir har metre ke daam se guna karo. | C1: no board of its own (reused the card's figure): a 'socho' telling |
| c6 | s3.workedExample.yourStep.reask | (none) | Ek chakkar 160 m ka hai, toh teen chakkar kitne metre hue? | A2 + the order's c6 skill 3 (five told steps, the child only multiplied); A3 problem to 30 words |

## 2026-11-17 · `fb18a963c`..`6f048eaeb` patch 015 (director26 list): done in the four pilots

**New fields (exact names, for the code agent building dc-r8-director26):**
- `skills[].remediation[].board` (`{ template, params }`) with its `viewCaption`, on every remediation of the four pilots
  (c4 2 new + 1 replaced, c5-t01 2 new, c5-t02 7 new, c6 6 new; the other 9 already had a true one and are unchanged).
- `skills[].remediation[].sayAlt.board` (+ `viewCaption`) where the second wording names another picture and the template can
  draw it: c4 s1 rem0, s1 rem1, s2 rem1, s3 rem0; c5-t02 s2 rem2, s3 rem1. c6 s3 rem0 already had one. help.js's `rung()`
  already reads a rung's own board; if the code keeps one board per remediation, these are ignored and the sayAlt is said over
  `remediation[].board`.
- `joints.beforeWorked`: three `{ hi, en }` forms in each pilot, one sentence each, asking nothing, 16 words or fewer.
- `teachback.simpler`: `{ hi, en }` in each pilot, a hint for a near miss that names the method and no number of the key.
- `wrap.ack`: three new forms in each pilot that fit any answer to `wrap.ask`, "pata nahi, aap batao" included (her own view, or
  "some was easy, some took work"); 8 words or fewer, grading and praising nothing.
- `scripts/lesson-scripts/check.mjs` (`fb18a963c`, the only code change): `beforeWorked` is an allowed joint kind, optional
  like `helpSpent` and `afterKeyGoOn`. The checker accepted `remediation[].board` and `teachback.simpler` as they were.

**The boards and why each is true of its `say`:**
- c4 s1 rem0: two wholes, a rope in one long and two short pieces and a paper in two equal pieces (the say's rope and folded
  paper). It replaces the torn roti, which was the then-card's figure. sayAlt: an apple in one thick and two thin pieces.
- c4 s1 rem1: a chocolate of 8 equal pieces, 3 coloured as eaten, result hidden (the say's "eat or keep, the count stays");
  sayAlt: the same 8 and 3 as a roti (its paratha of 8, 3 eaten). No later card's key is on it.
- c4 s2 rem1: three equal groups of 4, result hidden (things dealt one at a time into 3 groups); sayAlt: groups of 4, 2, 2
  (one child has more than the other two). The then-card's 9, 6, 6 and its 7 are not on either.
- c4 s3 rem0's sayAlt: a laddoo in 2 and one in 4. (s2 rem0, 5 bags of 7, and s3 rem0, rotis in 3 and 12, were already true.)
- c5-t01 s1 rem1: the line with fifths above and sevenths below, 1/5 marked; s3 rem1: the 0-to-2 line in fifths and tenths.
  Both says were written for exactly that line ("Board par ek line hai: line ke dono taraf ke gap…") and name none of its
  numbers; it is the then-card's posing figure, with no answer mark. The other seven c5-t01 remediations already carried
  the line their say describes.
- c5-t02 s1 rem0: rotis in 2 and in 10 (the say's two rotis). s2 rem0: two rotis of 5, 2 and 4 coloured (the say's 2 and 4
  parts); its simpler named the then-card's ribbons and now says "Board par dono ke hisse…", true of either board.
  s2 rem1: circles in 3 (1 coloured) and 9 (2 coloured) (one big piece against two small). s2 rem2: circles in 2 and 7,
  one part empty in each (the shortfall of a half against a seventh); sayAlt: 3 and 5 with the last part empty (the race).
  s3 rem0: 3 and 5, one part coloured each. s3 rem1: 2 and 8, uncoloured (the ropes); sayAlt: 3 and 6 (the bottles).
  s3 rem2: 3 and 8, one section empty each (the boxes). None shows a later card's pair (2/5, 2/3 against 2/7, 4/9…, 8/9).
- c6 s1 rem0: the pentagon PQRST with corner names and no lengths (the say walks P to P naming sides; the then-card's 29 m
  cannot be read off it). s1 rem1: a 4 by 3 grid of 1 cm tiles, area mode, result hidden (the say's tiles inside and thread
  on the edge). s2 rem0 (the 19 by 8 field), s2 rem1 (the 11 by 2 bookmark), s3 rem0 (the pond, 28 m and a 90 m round) and
  s3 rem1 (the 9 by 6 plot): each say was authored to be spoken over that figure and names none of its numbers; none has a
  trace or an answer, so 54 m, 26 cm, 17 m and ₹600 are not on them.

**Second wordings and simplers that name another picture, with no board of their own** (said over the remediation's board):
c5-t01 s1 rem1 (a laddu for 2 and for 10), s2 rem0 (a line with 2 marks), s2 rem1 (spoons of sugar), s2 rem2 (half a kilo
of aata), s3 rem1 (two trains), s3 rem2 (a 0-to-1 line in 2 gaps): c5-t01's boards are number lines only. c5-t02 s1 rem0 (a
pizza party, no numbers), s2 rem0 (coins), s2 rem1 (a chocolate and two toffees), s3 rem0 (Papa's shoes), s3 rem2 (two water
tanks). c6 s2 rem0 (a thread folded in half), s2 rem1 (a chocolate wrapper). Each is said as "socho…", a thing to imagine.

**Checks.** `node scripts/lesson-scripts/check.mjs`: c4 ok, c5-t01 ok, c5-t02 ok, c6 ok (structure 0, boards 0, runtime 0).
`compile-report.mjs --print`: the four pilots have 0 missing fields, 0 rule holes, 0 doubles, as before. (Without `--print` it
writes a doc this sparse checkout leaves out.) `tests/r7-compile.test.mjs` and `tests/r8-learning-director20.test.mjs` pass.
`tests/r7-dry-matrix.test.mjs`: every predicate reads 0 on the 16 dry lessons; the counts assertion fails, 105 counts moved
(spoken text changed, so the dry child's turns fell differently: e.g. c4 steady teacherTurns 66→76, helpTurns 9→16,
turnsOver75Words 2→0; c6 steady checkinTurns 24→27). The baseline is left for the main loop to regenerate at merge.

**Lengths.** Every told step ("do: result, kyunki why") is 30 words or fewer with one "kyunki"; the longest are 30 (c4 s2
step 1; c5-t01 s2 step 1, s3 step 1). Every `covered` sentence (per skill and `wrap.covered`) is 20 words or fewer. No changed
part is over 45 words in either language. Not changed and still over 45 (not on this list): c5-t02 s1 e1 `ask.viewCaption`
(53), s1 `workedExample.simpler` (46), s3 c2 `prompt` (49).

**Left as it was, and why:**
- "Yeh hissa saaf hua?" is code's check-in (`server/brain/say.js` `BEAT_ASK`); no script field holds it. For the code agent:
  item 7 asks that it go from scripts whose lesson teaches hisse (c5-t01, c5-t02) and it is a third word for c4's tukda.
- c6's three problemAlts already come at the problem by another act (walking the bed, taping the cover, unpacking one
  round); no judge counted one, and c6 stuck 40 was judged "a different picture". Kept.
- c5-t02's raw key "neeche wali patti ka hissa chhota" (stuck 12) is a key; not on this list.
- c5-t02 s1 e3 `mustSay` still asks for "1/8 chhota hai", so the new point says it of the strips already compared.
- c4's raw key: one accept form, "Pinky ki baat sahi hai", is put first, so the key is heard as "Is sawaal ka jawab: Pinky ki
  baat sahi hai, kyunki …". It contains "pinky", which was already accepted; nothing new is accepted.
- Worked results changed only in words (c5-t01 s1 step 2 "3 khambon se kul 4 bane"; s3 step 1 "kul 8 bane, har ek 1/4 ka");
  no number, step count or child's step changed.

### Every changed sentence (Hinglish; the `en` gloss changed with it)

| Script | Field | Old | New | 015 item: the judge's row |
|---|---|---|---|---|
| c4 | `joints.beforeWorked[0]` | (new) | Chalo, ab ek sawaal hum dono saath mein karte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c4 | `joints.beforeWorked[1]` | (new) | Ab ek sawaal milkar, kadam-kadam karke hal karte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c4 | `joints.beforeWorked[2]` | (new) | Aao, agla sawaal main aur tum saath mein karenge. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c4 | `s1.covered` | Aaj ki baat yeh thi ki kisi cheez ke barabar tukdon ka hi fraction naam hota hai, aur neeche wala number saare barabar tukde ginta hai. | Aaj dekha ki sirf barabar tukdon ka fraction naam hota hai, aur neeche wala number saare tukde ginta hai. | 5: covered over 20 words (c4 steady 128) |
| c4 | `s1 e1.pointAlt` | Socho, tum aur ek dost ek roti baant rahe ho, aur dono ko bilkul ek jitna mila. Roti kitne barabar tukdon mein bati, woh ginti neeche wale number mein jaati hai, aur tumhare paas kitne tukde hain, woh upar wale number mein. | Ulte kram mein socho, ek laddoo se: tumne laddoo ke jitne tukde uthaye, woh ginti upar likhte hain. Neeche woh ginti jaati hai ki poora laddoo kitne barabar tukdon mein toda gaya tha. | 3: first-skill pointAlt paraphrase (c4 steady 12; stuck 10, 16, 50; offtopic 14; steering 6, 40) |
| c4 | `s1 e1.ask.simpler` | Roti ke tukde ungli se gino: ek, do. Ab dekho, rang inmein se kitne tukdon mein hai. | Roti ke saare tukde ungli se gino, phir sirf rang wale. Dono gintiyan fraction mein kahan jaati hain, yeh socho. | 2: an independent read of every hint (no judge row) |
| c4 | `s1 e2.pointAlt` | Teen dost ek cake baantein aur har dost ko bilkul ek jaisa tukda mile, tab har tukda cake ka ek-tihaai kehlata hai. Pizza ke bhi 3 tukde hain, par woh ek size ke nahi: ek bada, do chhote. | Ek-tihaai ki jaanch aise hoti hai: ek tukda utha kar baaki do tukdon se milao. Cake ka har tukda baaki dono se bilkul milta hai, isliye cake ka har tukda 1/3 hai. Yahi jaanch pizza ke tukdon par karke dekho. | 3: first-skill pointAlt paraphrase (c4 steady 12; stuck 10, 16, 50; offtopic 14; steering 6, 40) |
| c4 | `s1 e3.pointAlt` | Ek circle ko 3 dost barabar baantein, toh har dost ko circle ka ek-tihaai milta hai. Board par jo ek rangin tukda hai, woh ek dost ka tukda hai, 1/3. Neeche wala number 3 batata hai ki circle kitne barabar tukdon mein bata. | Ulta chalo: agar tumhe 1/3 banana ho, toh pehle circle ko 3 barabar tukdon mein kaato, phir ek tukde mein rang bharo. Board par theek yahi hua hai. | 3: first-skill pointAlt paraphrase (c4 steady 12; stuck 10, 16, 50; offtopic 14; steering 6, 40) |
| c4 | `s1 e3.ask.prompt` | Ek aur tukde mein rang bharo. Ab circle ka kitna bhaag rangin hai, fraction mein? | Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain? | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `s1 e3.ask.reask` | Circle ke 3 barabar tukdon mein se 2 mein rang ho, toh circle ka kitna bhaag rangin hai? | Circle ke 3 barabar tukdon mein se 2 mein rang ho, toh rangin tukde circle ka kaunsa fraction hain? | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `s1 e3.ask.whyAlt` | sirf ek tukda bina rang ka bacha, toh rangin bhaag poore circle se ek-tihaai kam hai: 2/3 | sirf ek tukda bina rang ka bacha, toh rangin tukde poore circle se ek-tihaai kam hain: 2/3 | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `s1 e3.ask.simpler` | Ek aur tukda rangin hua, toh ab rangin tukde gino. Circle ke kul tukde utne hi rehte hain. | Pehle gino ki circle ke kul kitne tukde hain. Phir socho, ek aur tukda rangne ke baad kitne tukde rangin honge. | 2: e3 hint untrue of the board (c4 offtopic 34, steering 44) |
| c4 | `s1 e4.pointAlt` | Rangin tukde jaise 8 tukde ek ke baad ek rakho, toh poori upar wali patti ban jaati hai; isliye har tukda 1/8 hai. Ek tukda kha bhi lo, patti toh 8 tukdon se hi bani thi, isliye 1/8 mein 8 hi rehta hai. | Ek kitaab ke 8 barabar panne socho, aur ek panna phat gaya. Woh panna kitaab ka 1/8 tha, kyunki kitaab 8 pannon se bani thi; bache hue 7 panne uska naam nahi badalte. | 3: first-skill pointAlt paraphrase (c4 steady 12; stuck 10, 16, 50; offtopic 14; steering 6, 40) |
| c4 | `s1 e4.ask.prompt` | Neeche wali patti ek ribbon hai, 6 barabar tukde. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne ribbon ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai? | Neeche wali patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai? | 7: patti / ribbon (c4 steady 22) |
| c4 | `s1 e4.ask.reask` | 6 barabar tukdon wale ribbon se 1 tukda kata aur 5 bache, toh kya Raju ne ribbon ka 1/5 liya? | 6 barabar tukdon wali patti se 1 tukda kata aur 5 bache, toh kya Raju ne patti ka 1/5 liya? | 7: patti / ribbon (c4 steady 22) |
| c4 | `s1 e4.ask.why` | Raju ka tukda ribbon ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte | Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte | 7: patti / ribbon (c4 steady 22) |
| c4 | `s1 e4.ask.whyAlt` | kaatne se pehle ribbon ke 6 tukde the, aur Raju ka tukda unmein se ek hai; kitne bache, isse naam nahi badalta | kaatne se pehle patti ke 6 tukde the, aur Raju ka tukda unmein se ek hai; kitne bache, isse naam nahi badalta | 7: patti / ribbon (c4 steady 22) |
| c4 | `s1 e4.ask.viewCaption` | Raju ka ribbon yahan number line ki ek taraf hai: 0 se 1 tak, chhe barabar gap. Doosri taraf wahi aath gap hain, aur un par 1/8 ka mark. | Raju wali patti yahan number line ki ek taraf hai: 0 se 1 tak, chhe barabar gap. Doosri taraf wahi aath gap hain, aur un par 1/8 ka mark. | 7: patti / ribbon (c4 steady 22) |
| c4 | `s1 worked.problem` | Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Khaye hue tukde poori barfi ka kaunsa fraction hain? | Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Ab dekhte hain ki khaye hue tukde poori barfi ka kaunsa fraction hain. | 6: a problem done together (c4 steady 24) |
| c4 | `s1 worked.problemAlt` | Socho, barfi ki ek lambi patti ke 5 barabar tukde kaate gaye. Shaam tak plate par sirf 2 tukde bache, baaki sab kha liye gaye. Ab nikalna hai ki khaye hue tukde poori barfi ka kitna bhaag hain. | Board par barfi dekho: rangin tukde woh hain jo kha liye gaye, aur bina rang ke plate par bache. Hum do gintiyan karenge, saare tukde aur rangin tukde, aur unhi se fraction banega. | 3: problemAlt said the problem again (c4 offtopic 52) |
| c4 | `s1 worked.find` | khaya hua bhaag, fraction mein | khaye hue tukde, fraction mein | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `s1 worked.yourStep.simpler` | Humne dekha, neeche wala number 5 hai aur upar wala 3. Bas dono ko ek fraction mein likh do. | Jo number saare tukde ginta hai, woh line ke neeche likho, aur jo khaye hue tukde ginta hai, woh line ke upar. | 2: the worked example's hint states 5 and 3 (c4 steady 46, offtopic 60) |
| c4 | `s1 worked.answer` | barfi ka 3/5 bhaag khaya gaya | khaye hue tukde barfi ka 3/5 hain | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `s1 c3.simpler` | Teeno chhote tukde milkar bade tukde jitne hain, yaani aadha cake. Aur 1/4 toh aadhe ka bhi aadha hota hai. | Pehle dekho, bada tukda cake ka kitna gherta hai. Phir socho, baaki jagah teen chhote tukdon mein bati hai. | 2: an independent read of every hint (no judge row) |
| c4 | `s1 rem0.sayAlt.board` | (none) | {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Seb"}]}} | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem0.sayAlt.viewCaption` | (new) | Seb yahan ek patti ban gaya hai: ek mota tukda aur do patle tukde. | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem0.board` | {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}} | {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Rassi"},{"parts":2,"title":"Kaagaz"}]}} | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem0.viewCaption` | Roti yahan ek patti ban gayi hai, do tukdon mein: ek lamba aur ek chhota. | Rassi aur kaagaz yahan do patti ban gaye hain: rassi ka ek tukda lamba aur do chhote, kaagaz ke dono tukde ek jitne. | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem0.then.simpler` | Socho, do barabar tukde hote toh har ek aadha hota. Yahan ek tukda doosre se bada hai. | Roti ke beech mein ek line socho jo use do barabar aadhon mein baante. Ab dekho, bada tukda us line par rukta hai ya usse aage jaata hai. | 2: an independent read of every hint (no judge row) |
| c4 | `s1 rem1.board` | (none) | {"template":"fraction-parts@1","params":{"parts":8,"shade":3,"whole":"bar","hideResult":true}} | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem1.viewCaption` | (new) | Chocolate yahan ek circle mein hai, aath barabar tukdon mein; rangin tukde khaye hue hain. | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem1.sayAlt.board` | (none) | {"template":"fraction-parts@1","params":{"parts":8,"shade":3,"whole":"roti","hideResult":true}} | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem1.sayAlt.viewCaption` | (new) | Paratha yahan ek patti ban gaya hai: aath barabar tukde, aur rangin tukde khaye hue. | 1: a board for every remediation (c4 steering 12) |
| c4 | `s1 rem1.then.accept` | ["pinky","pinky ka","pinky sahi hai","pinky's","pinky ka jawab","2/4"] | ["Pinky ki baat sahi hai","pinky","pinky ka","pinky sahi hai","pinky's","pinky ka jawab","2/4"] | 7: raw key slot (c4 offtopic 30) |
| c4 | `s2.covered` | Phir bahut saari cheezon ka fraction aaya: neeche wala number batata hai kitne barabar group banane hain, aur ek group ki ginti jawab hoti hai. | Phir group ka fraction aaya: neeche wala number barabar group ginta hai, aur ek group ki ginti jawab hai. | 5: covered over 20 words (c4 steady 128) |
| c4 | `s2 worked.problem` | 15 pencil ka 1/3 kitni pencil hoti hain? | 15 pencil ka 1/3 kitni pencil hoti hain, yeh nikaalte hain. | 6: a problem done together (c4 steady 24) |
| c4 | `s2 worked.problemAlt` | 15 pencil teen dost barabar baant lete hain. Ab dekhna hai ki ek dost ko kitni pencil milti hain. | Board ke baayein taraf likha hai ki 15 pencil ke 3 barabar group banane hain, aur daayein taraf woh ek group hai jo dhoondhna hai. Pehle 1/3 ka matlab dekhenge, phir us ek group ki pencil. | 3: problemAlt said the problem again (c4 offtopic 52) |
| c4 | `s2 worked.steps[0].why` | neeche wala 3 group ki ginti hai, aur upar wala 1 batata hai kitne group lene hain | neeche wala 3 group ginta hai, aur upar wala 1 batata hai kitne lene hain | 4: told step over 30 words |
| c4 | `s2 c1.prompt` | 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Saare laddoo ka kitna bhaag Ravi ke paas gaya, fraction mein? | 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Ravi ke paas saare laddoo ka kaunsa fraction gaya? | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `s2 c1.reask` | 18 laddoo 3 barabar plate mein hain aur Ravi ek plate leta hai, toh saare laddoo ka kitna bhaag Ravi ke paas hai? | 18 laddoo 3 barabar plate mein hain aur Ravi ek plate leta hai, toh Ravi ke paas saare laddoo ka kaunsa fraction hai? | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `s2 rem1.board` | (none) | {"template":"equal-groups@1","params":{"groups":3,"each":4,"hideResult":true}} | 1: a board for every remediation (c4 steering 12) |
| c4 | `s2 rem1.viewCaption` | (new) | Teen group yahan ek jaal mein hain: har qatar ek group, aur teeno qataron mein ek jitni cheezein. | 1: a board for every remediation (c4 steering 12) |
| c4 | `s2 rem1.sayAlt.board` | (none) | {"template":"equal-groups@1","params":{"sizes":[4,2,2]}} | 1: a board for every remediation (c4 steering 12) |
| c4 | `s2 rem1.sayAlt.viewCaption` | (new) | Teen bachchon ke roti ke tukde yahan ek jaal mein hain: ek qatar mein zyada tukde, baaki do mein kam. | 1: a board for every remediation (c4 steering 12) |
| c4 | `s3 worked.problem` | Do ek jaisi chocolate hain: ek 3 barabar tukdon mein kati, doosri 6 mein. 3 wali chocolate ke ek tukde ko dhakne ke liye 6 wali chocolate ke kitne tukde lagenge? | Do ek jaisi chocolate hain: ek 3 barabar tukdon mein kati, doosri 6 mein. Dekhte hain ki 3 wali ke ek tukde ko dhakne ke liye 6 wali ke kitne tukde lagenge. | 6: a problem done together (c4 steady 24) |
| c4 | `s3 worked.problemAlt` | Ek chocolate 3 dost barabar baant lete hain, aur bilkul waisi doosri chocolate 6 dost. Ab dekhna hai ki 3 waalon ka ek tukda dhakne ke liye 6 waalon ke kitne tukde chahiye. | Board par dono chocolate aamne-saamne likhi hain: ek ke 3 barabar tukde, ek ke 6. Pehle dono ka ek-ek tukda samjhenge, phir dekhenge ki bade tukde ki jagah mein chhote kitne aate hain. | 3: problemAlt said the problem again (c4 offtopic 52) |
| c4 | `s3 worked.steps[1].why` | utni hi badi chocolate ab 6 mein bat rahi hai, toh har tukda chhota padta hai | utni hi badi chocolate 6 mein bati, toh har tukda chhota | 4: told step over 30 words |
| c4 | `s3 worked.yourStep.prompt` | Board par dono chocolate patti ki tarah bani hain, ek ke neeche ek. Upar wali patti ke ek tukde ke neeche, neeche wali patti ke kitne tukde aate hain? | Board par dono chocolate patti ki tarah bani hain: ek 3 tukdon wali, ek 6 tukdon wali. 3 wali patti ke ek tukde ki jagah mein, 6 wali patti ke kitne tukde aate hain? | 7: "neeche" in two senses (c4 row 114) |
| c4 | `s3 worked.yourStep.simpler` | Upar wali patti ka ek tukda dekho, aur uske theek neeche wale chhote tukde ek-ek karke gino. | 3 wali patti ka ek tukda dekho, aur usi jagah mein 6 wali patti ke tukde ek-ek karke gino. | 7: "neeche" in two senses (c4 row 114) |
| c4 | `s3 worked.yourStep.viewCaption` | Yahan dono chocolate circle mein hain: teen tukdon wala circle upar wali patti hai, chhe tukdon wala neeche wali. Teen wale ka ek tukda dekho, phir doosre circle mein usi jagah ke chhote tukde. | Yahan dono chocolate circle mein hain: ek teen tukdon wala, ek chhe tukdon wala. Teen wale ka ek tukda dekho, phir doosre circle mein usi jagah ke chhote tukde. | 7: "neeche" in two senses (c4 row 114) |
| c4 | `s3 c1.simpler` | Jo roti jitne zyada tukdon mein kati, uske tukde utne patle. 2 tukde aur 9 tukde, dono ko 1/3 wale tukde se milao. | Socho, 1/3 wala tukda banane ke liye roti kitne tukdon mein katti. Phir dekho, Meena aur Sonu ne usse kam tukde kaate ya zyada. | 2: an independent read of every hint (no judge row) |
| c4 | `s3 rem0.sayAlt.board` | (none) | {"template":"wholes@1","params":{"wholes":[{"parts":2,"title":"Laddoo"},{"parts":4,"title":"Laddoo"}]}} | 1: a board for every remediation (c4 steering 12) |
| c4 | `s3 rem0.sayAlt.viewCaption` | (new) | Dono laddoo yahan ek jitni lambi patti hain: ek do barabar tukdon mein, ek chaar mein. | 1: a board for every remediation (c4 steering 12) |
| c4 | `teachback.prompt` | Is circle ke 9 barabar tukde hain, aur 4 tukdon mein rang hai. Rangin bhaag fraction mein kitna hai? | Is circle ke 9 barabar tukde hain, aur 4 tukdon mein rang hai. Rangin tukde poore circle ka kaunsa fraction hain? | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `teachback.did` | 9 barabar tukdon wale circle ka rangin bhaag fraction mein bataya | 9 barabar tukdon wale circle ke rangin tukde fraction mein bataye | 7: "bhaag" (tukda / bhaag / hissa, c4) |
| c4 | `teachback.simpler` | (new) | Neeche wala number saare tukde ginta hai, rangin bhi aur bina rang ke bhi; upar wala sirf rangin. | 5: a hint for a near miss on the closing question |
| c4 | `wrap.covered` | Aaj ki baat yeh thi ki tukde barabar hon tabhi unka fraction naam banta hai, aur neeche wala number poori cheez ke saare barabar tukde ginta hai. Phir cheezon ke group ka fraction aaya, aur yeh ki ek hi cheez jitne zyada tukdon mein kate, har tukda utna chhota hota hai. | Aaj dekha ki sirf barabar tukdon ka fraction naam hota hai, aur neeche wala number saare tukde ginta hai. Phir group ka fraction aaya, aur yeh ki ek cheez jitne zyada tukdon mein kate, har tukda utna chhota. | 5: covered over 20 words (c4 steady 128) |
| c4 | `wrap.ack[0]` | Achha, main sun rahi thi. | Mujhe toh tumhare saath tukde ginna achha laga. | 5: ack misses "aap batao" (c4 steady 130) |
| c4 | `wrap.ack[1]` | Hmm, yeh baat maine sun li. | Kuch baatein aasaan thi, kuch mein mehnat lagi. | 5: ack misses "aap batao" (c4 steady 130) |
| c4 | `wrap.ack[2]` | Tumne apni baat kahi, main samajh gayi. | Aaj humne milkar kaafi kuch dekha. | 5: ack misses "aap batao" (c4 steady 130) |
| c5-t01 | `joints.beforeWorked[0]` | (new) | Chalo, ab ek sawaal saath mein line par karte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c5-t01 | `joints.beforeWorked[1]` | (new) | Ab ek sawaal milkar, ek-ek kadam karke dekhte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c5-t01 | `joints.beforeWorked[2]` | (new) | Aao, agla sawaal hum dono mil ke hal karenge. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c5-t01 | `s1 worked.problem` | Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par khade hain. Pehla khamba ghar se kitne kilometre door hai? | Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par khade hain. Saath mein nikaalte hain ki pehla khamba ghar se kitne kilometre door hai. | 6: a problem done together (mech. 7) |
| c5-t01 | `s1 worked.problemAlt` | Socho tum ghar se school ja rahe ho, raasta 1 kilometre ka. Raaste mein 3 bijli ke khambe aise lage hain ki ghar, teeno khambe aur school, sab ek-doosre se barabar doori par hain. Pehla khamba kitni door milega, yahi nikalna hai. | Board ki line ko raasta samjho: 0 par ghar, 1 par school, aur beech ke marks khambe. Hum pehle gaps ginenge, phir dekhenge ki pehla khamba kitne gaps par hai. | 3: problemAlt paraphrase (c5-t01 stuck 40, offtopic 54, steering 42) |
| c5-t01 | `s1 worked.steps[1].result` | 3 khambe hain, toh ginti 4 aayi | 3 khambon se kul 4 bane | 4: "toh ginti 4 aayi" (c5-t01 steady 22) |
| c5-t01 | `s1 worked.steps[1].why` | beech mein jitne marks hon, gaps hamesha usse ek zyada | gaps hamesha beech ke marks se ek zyada hote hain | 4: "toh ginti 4 aayi" (c5-t01 steady 22) |
| c5-t01 | `s1 c2.simpler` | Socho ek roti 4 logon mein bati, ya 11 logon mein: 11 logon mein har hissa chhota hai. Line par bhi jiska gap chhota, woh pehle rukta hai. | Number bada hai ya chhota, yeh chhodo. Board par 1/4 aur 1/11 ke pehle gap ki lambai dekho, aur socho kaunsa mark line ke shuru ke zyada paas rukta hai. | 2: s1 c2's hint (c5-t01 stuck 68) |
| c5-t01 | `s1 c3.simpler` | 1/9 ka neeche wala number 9 batata hai ki line 9 barabar gaps mein kati hai. Ab socho, 0 se ek gap chalkar kahan pahunchte hain. | Socho, 1/9 kitne gaps ka naam hai, aur phir board par 0 se utne gaps gino. | 2: an independent read of every hint (no judge row) |
| c5-t01 | `s1 rem1.board` | (none) | {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}} | 1: a board for every remediation (B1 (no row in c5-t01)) |
| c5-t01 | `s1 rem1.viewCaption` | (new) | Pehli patti paanch barabar hisson mein hai, uska pehla hissa rangin, 1/5. Doosri patti utni hi lambi hai, saat barabar hisson mein. | 1: a board for every remediation (B1 (no row in c5-t01)) |
| c5-t01 | `s1 rem1.then.simpler` | 1/7 wala gap 1/5 wale gap se chhota hai. Chhota gap pehle khatam ho jaata hai. | Line ke neeche 0 se pehla gap dekho, aur dekho woh 1/5 wale mark se pehle khatam hota hai ya aage. | 2: "Chhota gap pehle khatam ho jaata hai" (c5-t01 stuck 24, offtopic 44) |
| c5-t01 | `s1.covered` | Aaj ki baat yeh thi ki 0 aur 1 ke beech ke har fraction ki line par ek pakki jagah hoti hai, aur uska naam marks se nahi, barabar gaps ginkar milta hai. | Aaj dekha ki har fraction ki line par ek pakki jagah hoti hai, aur uska naam gaps ginkar milta hai. | 5: covered over 20 words (c5-t01 steady 130) |
| c5-t01 | `s2 worked.problem` | Ek number line 0 se 1 tak hai. Is par 2/5 ka mark dhoondo. | Ek number line 0 se 1 tak hai. Is par 2/5 ka mark milkar dhoondhte hain. | 6: a problem done together (mech. 7) |
| c5-t01 | `s2 worked.problemAlt` | Socho 1 kilometre ki sadak hai, aur hume woh jagah dhoondni hai jo 2/5 kilometre par hai. Board ki line wahi sadak hai: 0 shuruaat, 1 aakhir. | Ek cheenti 0 se 2/5 tak jaana chahti hai. Use do baatein pata honi chahiye: ek gap kitna lamba hai, aur aise kitne gap chalne hain. | 3: every problemAlt |
| c5-t01 | `s2 rem1.then.simpler` | Do chhote 1/6 gap milkar ek lamba 1/3 gap banate hain. 3 chhote gap, 2 lambe gap se kam padte hain. | Do chhote 1/6 gap milkar ek lamba 1/3 gap banate hain. Ab socho, 2 lambe gap jitni doori ke liye kitne chhote gap chahiye. | 2: an independent read of every hint (no judge row) |
| c5-t01 | `s2.covered` | Phir fraction ka upar wala number aaya, jo batata hai ki 0 se kitne gap chalna hai, aur dono number milkar line ki ek hi jagah ka naam hote hain. | Phir upar wala number aaya, jo batata hai 0 se kitne gap chalna hai; dono milkar ek jagah batate hain. | 5: covered over 20 words (c5-t01 steady 130) |
| c5-t01 | `s3 worked.problem` | Ek number line 0 se 2 tak hai. Is par 7/4 ka mark dhoondo. | Ek number line 0 se 2 tak hai. Is par 7/4 ka mark saath mein dhoondhte hain. | 6: a problem done together (mech. 7) |
| c5-t01 | `s3 worked.problemAlt` | Ek cycle race 0 se 2 kilometre ki hai, aur ek cycle 7/4 kilometre chalkar ruki. Board ki line par uski jagah dhoondni hai. | 7/4 mein upar wala number 7 neeche wale 4 se bada hai, isliye yeh mark 1 ke aage milega. Hum pehle 1 tak pahunchenge, phir uske aage gap ginenge. | 3: every problemAlt |
| c5-t01 | `s3 worked.steps[0].do` | Line par 0, 1 aur 2 likho, aur har poore ke 4 barabar gaps karo | 0 se 2 tak ki line ke har poore ko 4 barabar gaps mein kaato | 4: s3 step 1 run-on (c5-t01 steady 108) |
| c5-t01 | `s3 worked.steps[0].result` | 0 se 2 tak kul 8 bane, har ek 1/4 ka | kul 8 bane, har ek 1/4 ka | 4: s3 step 1 run-on (c5-t01 steady 108) |
| c5-t01 | `s3 worked.steps[0].why` | neeche wala number 4 hai, aur 7/4 ko 1 ke aage jaana hai | 7/4 ka neeche wala number 4 hai | 4: s3 step 1 run-on (c5-t01 steady 108) |
| c5-t01 | `s3 worked.steps[1].do` | Upar wala number 7 matlab 7 gap chalna hai, toh pehle 4 gap chalo | Upar wala 7 kehta hai 7 gap chalo, toh pehle 4 gap chalo | 4: s3 step 1 run-on (c5-t01 steady 108) |
| c5-t01 | `s3 worked.steps[1].why` | ek poore mein 4 gap hote hain, aur humein usse zyada, 7 gap chalne hain | ek poore mein 4 gap hote hain | 4: s3 step 1 run-on (c5-t01 steady 108) |
| c5-t01 | `s3 worked.yourStep.simpler` | Kul 7 the, 4 ho gaye. Baaki nikalne ke liye 7 mein se 4 ghatao. | 1 tak 4 gap ho chuke. Ab 1 ke aage ek-ek gap gino, jab tak kul ginti 7 na ho jaaye. | 2: "7 mein se 4 ghatao" (c5-t01 steady 114) |
| c5-t01 | `s3 c1.simpler` | 3 gaps milke ek poora banate hain. 5/3 ke gaps mein se pehle 3 tumhe 0 se ek poore tak le jaate hain; ab socho baaki gap kis taraf jaate hain. | Line par 1 aur 2 ke mark dekho, aur gino ki 0 se har ek tak kitne gap hain. Phir 5/3 ke gap gino. | 2: s3 c1's hint (c5-t01 steady 120) |
| c5-t01 | `s3 rem0.then.simpler` | Ek poore mein 6 gaps hain, aur runner ne 7 gap daude. Inhi do gintiyon se fraction banta hai. | Line ke neeche ek gap poore ka kitna hai, yeh socho, phir dekho runner ne aise kitne gap daude. | 2: an independent read of every hint (no judge row) |
| c5-t01 | `s3 rem1.board` | (none) | {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":2}} | 1: a board for every remediation (B1 (no row in c5-t01)) |
| c5-t01 | `s3 rem1.viewCaption` | (new) | Yeh 0 se 2 tak ki line hai: line ke upar har poora paanch gaps mein, line ke neeche das gaps mein. | 1: a board for every remediation (B1 (no row in c5-t01)) |
| c5-t01 | `s3 rem1.then.simpler` | Har fraction ka upar wala number uske neeche wale number se milakar dekho. Upar wala number bada ho, toh fraction 1 ke aage hota hai. | Line par 1 wala mark dekho, aur gino ki dono taraf 1 tak kitne gap hain. Phir socho, dono fraction mein se kaun 1 ko paar karta hai. | 2: an independent read of every hint (no judge row) |
| c5-t01 | `s3.covered` | Aakhir mein line 1 ke aage chali, aur jab upar wala number neeche wale number se bada ho, toh fraction 1 ke aage aata hai. | Aakhir mein dekha: upar wala number neeche wale se bada ho, toh fraction 1 ke aage aata hai. | 5: covered over 20 words (c5-t01 steady 130) |
| c5-t01 | `teachback.simpler` | (new) | Pehle dekho, 0 aur 1 ke beech ke 6 marks se kitne gaps bante hain; wahi ginti neeche jaati hai. | 5: a hint for a near miss on the closing question |
| c5-t01 | `wrap.covered` | Aaj ki baat yeh thi ki har fraction ki number line par ek pakki jagah hoti hai: neeche wala number 0 se 1 ke barabar gaps ginta hai, aur upar wala number batata hai 0 se kitne gap chalna hai. Jab upar wala number neeche wale number se bada ho, toh fraction 1 ke aage aata hai. | Aaj dekha ki har fraction ki line par ek pakki jagah hai, jo gaps ginkar milti hai. Jab upar wala number neeche wale number se bada ho, toh fraction 1 ke aage aata hai. | 5: covered over 20 words (c5-t01 steady 130) |
| c5-t01 | `wrap.ack[0]` | Hmm, samajh gayi. | Mujhe tumhare saath line par chalna achha laga. | 5: ack (c5-t01 steady 132, "maine sun liya" flat) |
| c5-t01 | `wrap.ack[1]` | Achha, maine sun liya. | Kuch baatein aasaan thi, kuch mein mehnat lagi. | 5: ack (c5-t01 steady 132, "maine sun liya" flat) |
| c5-t01 | `wrap.ack[2]` | Achha, theek hai. | Aaj humne milkar kaafi kuch dekha. | 5: ack (c5-t01 steady 132, "maine sun liya" flat) |
| c5-t02 | `joints.beforeWorked[0]` | (new) | Chalo, ab ek sawaal hum saath mein karte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c5-t02 | `joints.beforeWorked[1]` | (new) | Ab agla sawaal kadam-kadam, milkar hal karte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c5-t02 | `joints.beforeWorked[2]` | (new) | Aao, yeh sawaal main aur tum saath mein karenge. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c5-t02 | `teachback.simpler` | (new) | Dono mein 7 hisse liye gaye; ab dekho kis patti ka ek hissa chhota hai. | 5: a hint for a near miss on the closing question |
| c5-t02 | `wrap.covered` | Aaj ka paath yeh tha ki ek hi poore ko jitne zyada barabar hisson mein kaatein, har hissa utna chhota hota hai. Neeche wala number same ho toh upar wala number faisla karta hai, aur upar wala number same ho toh hisse ka size faisla karta hai. | Aaj dekha ki ek poore ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai. Phir dekha: hisse ek size ke hon toh ginti faisla karti hai, aur ginti barabar ho toh hisse ka size. | 5: covered over 20 words (c5-t02 steady 158) |
| c5-t02 | `wrap.ack[0]` | Achha, theek hai. | Mujhe tumhare saath hisse milaana achha laga. | 5: ack (c5-t02 steady 160) |
| c5-t02 | `wrap.ack[1]` | Hmm, maine sun liya. | Kuch baatein aasaan thi, kuch mein mehnat lagi. | 5: ack (c5-t02 steady 160) |
| c5-t02 | `wrap.ack[2]` | Chalo, yeh baat bhi dhyaan mein rakhi. | Aaj humne milkar kaafi kuch dekha. | 5: ack (c5-t02 steady 160) |
| c5-t02 | `s1 e1.pointAlt` | Is patti ke hisse ungli se gino: ek, do, teen, chaar, sab barabar. Rang wala unmein se ek hai, isliye woh 1/4, aur yahi ginti 1/4 ka 4 hai. | Ek roti 4 bachche barabar baantein, toh har bachche ko roti ka 1/4 milta hai. Is patti ka rang wala hissa bhi waisa hi hai: chaar barabar mein se ek. | 3: first-skill pointAlt paraphrase (c5-t02 stuck 6, offtopic 24, steering 26, 36) |
| c5-t02 | `s1 e2.pointAlt` | Kaagaz ki do patti socho, ek ke neeche ek rakhi; neeche wali ko aath barabar hisson mein moda, toh har hissa 1/8 hai. | Ek kaagaz ki patti ko aadha modo, phir aadha, phir aadha: kholne par 8 barabar hisse milte hain, aur har hissa 1/8 hai. | 3: first-skill pointAlt paraphrase (c5-t02 stuck 6, offtopic 24, steering 26, 36) |
| c5-t02 | `s1 e3.point` | 0 se 1 tak ki number line lo: line ke upar 3 barabar gap hain, neeche 7. Niyam: zero se jitna door, utna bada. 1/4 aur 1/8 ko bhi aisi line par rakhein, toh 1/8 zero ke zyada paas rukega, yaani 1/8 chhota hai. | Patti mein dekha tha ki 1/8 chhota hai. Number line par chhota fraction zero ke zyada paas rukta hai, kyunki line par zero se jitna door, utna bada. Is line par, 0 se 1 tak, upar 3 barabar gap hain aur neeche 7. | 8: s1 e3's point used a 3/7 line to compare 1/4 and 1/8 |
| c5-t02 | `s1 e3.pointAlt` | Number line ko ek seedhi sadak socho jo 0 se shuru hokar 1 par khatam hoti hai. Is sadak par jo zero se jitna aage khada ho, woh utna bada, isliye 1/4, 1/8 se aage khada hota hai. | Line ko ek ruler socho: 0 cm se jitna aage mark, utni lambi cheez. Isi tarah line par jo fraction zero se jitna aage ruke, woh utna bada. | 3: first-skill pointAlt paraphrase (c5-t02 stuck 6, offtopic 24, steering 26, 36) |
| c5-t02 | `s1 worked.problem` | Rahul aur Sana ke paas ek-ek chocolate hai, dono bilkul ek jaisi. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Bada hissa kiske paas hai? | Rahul aur Sana ke paas ek-ek chocolate hai, dono bilkul ek jaisi. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Saath mein dekhte hain ki bada hissa kiske paas hai. | 6: a problem done together (c5-t02 steady 20, 21, 72, 73) |
| c5-t02 | `s1 worked.problemAlt` | Do ek jaisi chocolate socho: ek ko 8 barabar hisson mein toda, doosri ko 2 mein. Rahul ko pehli ka ek hissa mila aur Sana ko doosri ka, aur dekhna hai ki kiska hissa bada hai. | Yahan dono chocolate ek jaisi hain, toh unhe seedha milaa sakte hain. Hum pehle dekhenge ki dono ko kitne hisse mile, phir ek hisse ka size. | 3: every problemAlt |
| c5-t02 | `s1 worked.steps[0].why` | upar wala number batata hai kitne hisse mile, aur ek-ek mile, toh ab baat sirf size ki hai | upar wala number mile hue hisse ginta hai | 4 + 8: told step over 30 words; s1 step 1's doubled "ek-ek" (c5-t02 steady 22, 26) |
| c5-t02 | `s1 worked.steps[1].do` | Upar wali patti Rahul ki chocolate hai, neeche wali Sana ki. Ab dekho, kiski chocolate kitne hisson mein kati | Ab dekho, kiski chocolate kitne hisson mein kati | 4 + 8: told step over 30 words; s1 step 1's doubled "ek-ek" (c5-t02 steady 22, 26) |
| c5-t02 | `s1 worked.steps[1].why` | hisson ki ginti se hi pata chalta hai ki ek hissa kitna bada hai | ginti se hi hisse ka size pata chalta hai | 4 + 8: told step over 30 words; s1 step 1's doubled "ek-ek" (c5-t02 steady 22, 26) |
| c5-t02 | `s1 worked.yourStep.simpler` | Dono chocolate ek jitni hain; upar wali patti ka ek hissa aur neeche wali patti ka ek hissa milaa kar dekho. | Dono chocolate ek jitni hain; 8 hisson wali patti ka ek hissa aur 2 hisson wali ka ek hissa milaa kar dekho. | 7: "upar" in one sense (c5-t02 steady 22, 26) |
| c5-t02 | `s1 rem0.board` | (none) | {"template":"wholes@1","params":{"wholes":[{"parts":2,"title":"Roti"},{"parts":10,"title":"Roti"}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s1 rem0.viewCaption` | (new) | Dono roti yahan ek jitni lambi patti hain: ek do barabar hisson mein, ek das mein. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s1.covered` | Aaj ki baat yeh thi ki ek hi poore ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai. | Aaj dekha ki ek hi poore ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai. | 5: covered over 20 words (c5-t02 steady 158) |
| c5-t02 | `s2 e1.ask.simpler` | Patti ke hisse wahi 7 hain, sirf rang wale hisse badle. Rang wale hisse gino. | Patti ke hisse wahi 7 rehte hain; badalti sirf rang wale hisson ki ginti hai. | 2: an independent read of every hint (no judge row) |
| c5-t02 | `s2 worked.problem` | Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Kam cake kisne khaya? | Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Dekhte hain ki kam cake kisne khaya. | 6: a problem done together (c5-t02 steady 20, 21, 72, 73) |
| c5-t02 | `s2 worked.problemAlt` | Do ek jaise cake, dono 8 barabar hisson mein kate hain. Meena ne apne cake ke 5 hisse khaye aur Raju ne apne ke 3, aur dekhna hai ki kisne kam khaya. | Socho dono cake ek ke paas ek rakhe hain, dono 8 barabar hisson mein. Hum pehle dekhenge ki dono ke hisse ek size ke hain ya nahi, phir kiske kitne hisse khaye gaye. | 3: every problemAlt |
| c5-t02 | `s2 c2.prompt` | Do ek jaisi chocolate hain, ek 4 barabar hisson mein kati, doosri 6 mein. Dono se ek-ek hissa khaya gaya, toh pehli ke 4 mein se 3 bache aur doosri ke 6 mein se 5. Kiska khaya hua hissa bada tha, 4 hisson wali ka ya 6 wali ka? | Do ek jaisi chocolate hain, ek 4 barabar hisson mein kati, doosri 6 mein. Dono se ek-ek hissa khaya gaya. Kiska khaya hua hissa bada tha, 4 hisson wali chocolate ka ya 6 hisson wali ka? | 8: s2 c2's bache/khaya card |
| c5-t02 | `s2 c2.why` | 4 hisson wali mein 3 bache toh 1/4 khaya gaya, 6 wali mein 5 bache toh 1/6, aur 1/4 bada hai | 4 hisson wali chocolate ka ek hissa 1/4 hai aur 6 wali ka 1/6, aur 1/4 bada hai | 8: s2 c2's bache/khaya card |
| c5-t02 | `s2 c2.answerBoard` | {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":6,"shade":5,"label":"5/6"}]}} | {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":6,"shade":1,"label":"1/6"}]}} | 8: s2 c2's bache/khaya card |
| c5-t02 | `s2 rem0.board` | (none) | {"template":"wholes@1","params":{"wholes":[{"parts":5,"shade":2,"title":"Roti"},{"parts":5,"shade":4,"title":"Roti"}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2 rem0.viewCaption` | (new) | Dono roti yahan ek jaisi patti hain, dono 5 barabar hisson mein: ek mein do hisse rangin, ek mein chaar. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2 rem0.simpler` | Board ke dono ribbon ke hisse ek jitne lambe hain. Isliye yahan sirf hisson ki ginti batati hai kiske paas zyada hai. | Board par dono ke hisse ek jitne bade hain. Isliye yahan sirf hisson ki ginti batati hai kiske paas zyada hai. | 1: the simpler named the then-card's ribbons; it is said over the new board |
| c5-t02 | `s2 rem1.board` | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":""},{"parts":9,"shade":2,"label":""}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2 rem1.viewCaption` | (new) | Do ek jaise gol hain, ek teen barabar hisson mein aur ek nau mein: pehle ka ek hissa rangin hai, doosre ke do. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2 rem2.board` | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":7,"shade":6,"label":""}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2 rem2.viewCaption` | (new) | Do ek jaise gol hain, ek do barabar hisson mein aur ek saat mein; dono mein ek-ek hissa khaali hai. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2 rem2.sayAlt.board` | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":""},{"parts":5,"shade":4,"label":""}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2 rem2.sayAlt.viewCaption` | (new) | Dono race yahan do ek jaise gol hain, ek teen barabar hisson mein aur ek paanch mein; dono mein aakhri ek hissa baaki hai. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s2.covered` | Phir yeh dekha ki neeche wala number same ho toh hisse ek size ke hote hain, aur upar wala number, yaani hisson ki ginti, faisla karta hai. | Phir dekha: neeche wala number same ho toh hisse ek size ke, aur hisson ki ginti faisla karti hai. | 5: covered over 20 words (c5-t02 steady 158) |
| c5-t02 | `s3 worked.problem` | Isha ne apni chocolate ka 2/3 khaya; Farhan ki chocolate bhi utni hi badi thi, aur usne uska 2/7 khaya. Zyada kisne khaya? | Isha ne apni chocolate ka 2/3 khaya; Farhan ki chocolate bhi utni hi badi thi, aur usne uska 2/7 khaya. Dekhte hain ki zyada kisne khaya. | 6: a problem done together (c5-t02 steady 20, 21, 72, 73) |
| c5-t02 | `s3 worked.problemAlt` | Do ek jaisi chocolate hain: Farhan ki 7 barabar hisson mein todi gayi, Isha ki 3 mein. Dono ne apni chocolate ke 2 hisse khaye, aur dekhna hai ki kisne zyada khaya. | Yahan dono ne utne hi hisse khaye, toh ginti se faisla nahi hoga. Hum dekhenge ki kiske hisse bade the. | 3: every problemAlt |
| c5-t02 | `s3 worked.steps[1].why` | Farhan ki chocolate 7 hisson mein kati hai, Isha ki usi size ki chocolate sirf 3 mein | Farhan ki chocolate 7 mein kati, Isha ki sirf 3 mein | 4: told step over 30 words |
| c5-t02 | `s3 rem0.board` | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":""},{"parts":5,"shade":1,"label":""}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3 rem0.viewCaption` | (new) | Do ek jaise gol hain, ek teen barabar hisson mein aur ek paanch mein; dono ka ek-ek hissa rangin hai. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3 rem1.board` | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3 rem1.viewCaption` | (new) | Do ek jaisi rassiyan gol ban gayi hain: ek do barabar hisson mein, ek aath mein. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3 rem1.sayAlt.board` | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3 rem1.sayAlt.viewCaption` | (new) | Do ek jaisi bottle ka paani yahan do gol hain: ek teen barabar hisson mein, ek chhe mein. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3 rem2.board` | (none) | {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":""},{"parts":8,"shade":7,"label":""}]}} | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3 rem2.viewCaption` | (new) | Do ek jaise dibbe gol ban gaye hain: ek teen barabar khaanon mein, ek aath mein; dono mein ek-ek khaana khaali. | 1: a board for every remediation (c5-t02 steady 82, steering 12) |
| c5-t02 | `s3.covered` | Aakhir mein yeh dekha ki upar wala number same ho, toh jis fraction ka neeche wala number chhota hai, uske hisse bade hote hain aur wahi zyada hota hai. | Aakhir mein dekha: hisson ki ginti same ho, toh jiske hisse bade, wahi fraction zyada hota hai. | 5: covered over 20 words (c5-t02 steady 158) |
| c6 | `joints.beforeWorked[0]` | (new) | Chalo, ab ek sawaal hum dono saath mein karte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c6 | `joints.beforeWorked[1]` | (new) | Ab ek sawaal milkar, kadam-kadam hal karte hain. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c6 | `joints.beforeWorked[2]` | (new) | Aao, agla sawaal main aur tum mil ke karenge. | 6: new joint (mech. 7: c6 steady 16, 58, 86; c5-t02 steady 20, 72, 132) |
| c6 | `s1 e1.ask.simpler` | Ungli har bhuja par chali, toh teeno lambaiyan judengi: 4, 5 aur 6. | Board ki line dekho: ungli ka poora safar wahi hai. Us line ki har bhuja ki lambai milakar socho. | 2: hint leaves only arithmetic (c6 stuck 6) |
| c6 | `s1 e2.ask.simpler` | Har bhuja 5 cm ki hai, aur hexagon ki bhujayein chhah hain. In dono baaton ko milakar socho. | Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. | 2: an independent read of every hint (no judge row) |
| c6 | `s1 e3.ask.simpler` | Dhaaga sirf chaaron kinaaron par jaata hai: 6, 4, 6 aur 4. Andar ki jagah ka isse koi lena-dena nahi. | Ek kone se dhaaga lapetna shuru karo aur wapas usi kone tak aao; har bhuja par jitna dhaaga khula, woh jodte jao. | 3: e3 hint paraphrases its point (c6 offtopic 26, steering 38) |
| c6 | `s1 worked.problem` | Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? | Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Saath mein nikaalte hain ki kitni lambi baad lagegi. | 6: a problem done together (c6 steady 86; clause 11) |
| c6 | `s1 c1.simpler` | Pehle 9 aur 6, phir usme 7. Aakhri 4 bhi jodna, tabhi chakkar poora hota hai. | Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. | 2: an independent read of every hint (no judge row) |
| c6 | `s1 c2.simpler` | Guna andar ki jagah ginta hai, kinaara nahi. Do baar 10, do baar 4. | Card ka kinaara board par ek line ban kar khula hai. Us line ki chaaron bhujayein dekho, aur socho guna ki jagah kya karna hai. | 2: hint leaves only arithmetic (c6 stuck 68) |
| c6 | `s1 rem0.board` | (none) | {"template":"shape@1","params":{"shape":"pentagon","names":["P","Q","R","S","T"]}} | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s1 rem0.viewCaption` | (new) | Board par paanch kone wala khet hai, kone P, Q, R, S aur T. | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s1 rem1.board` | (none) | {"template":"area-grid@1","params":{"w":4,"h":3,"mode":"area","unit":"cm","hideResult":true}} | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s1 rem1.viewCaption` | (new) | Yahan ek chhota rectangle hai: andar 1 cm ke chhote square bichhe hain, aur unke bahar ka kinaara dhaage ka raasta hai. | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s1.covered` | Aaj ki baat yeh thi ki parimap kisi band shape ke poore kinaare ki lambai hai, jismein har bhuja ek baar judti hai aur andar ki jagah nahi aati. | Aaj dekha ki parimap band shape ke poore kinaare ki lambai hai: har bhuja ek baar, andar ki jagah nahi. | 5: covered over 20 words (c6 steady 114) |
| c6 | `s2 e2.ask.simpler` | Pehle bracket: 12 aur 5 jodo. Phir us jod ka do guna karo. | Formula mein bracket pehle: usmein lambai aur chaudai jaati hain. Phir bracket ka do guna. | 2: an independent read of every hint (no judge row) |
| c6 | `s2 worked.problem` | Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Kitni tape lagegi? | Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Dekhte hain kitni tape lagegi. | 6: a problem done together (c6 steady 86; clause 11) |
| c6 | `s2 c1.simpler` | Ek lambai, ek chaudai: 40 aur 25. Itna aadha chakkar hai, poora iska do guna. | Socho, ek lambai aur ek chaudai daud kar woh kis kone par pahunchti hai, aur wahan se shuru wala kona kitna door hai. | 2: an independent read of every hint (no judge row) |
| c6 | `s2 c3.simpler` | 11 × 11 tile ke andar ki jagah hogi. Kinaare ke liye 11 ko chaar baar lo. | 11 × 11 tile ke andar ki jagah ginta hai. Kinaare ke liye socho, chaar barabar bhujaon ki kul lambai kitni hogi. | 2: an independent read of every hint (no judge row) |
| c6 | `s2 rem0.board` | (none) | {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}} | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s2 rem0.viewCaption` | (new) | Khet ki chaaron bhujayein yahan ek line mein hain: 19 m, 8 m, 19 m, 8 m. | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s2 rem0.then.simpler` | 19 aur 8 jodne se cheenti sirf saamne wale kone tak pahunchti hai. Wapas aane ke liye utna hi aur. | Board par dekho, cheenti ka poora chakkar kin bhujaon se banta hai; phir unki lambai jodo. | 2: an independent read of every hint (no judge row) |
| c6 | `s2 rem1.board` | (none) | {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":11,"h":2}} | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s2 rem1.viewCaption` | (new) | Bookmark ka kinaara yahan ek seedhi line hai: 11 cm, 2 cm, 11 cm, 2 cm. | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s2 rem1.then.simpler` | 11 × 2 andar ke square centimetre deta hai. Kinaare ke liye 11 aur 2 jodo, phir uska do guna karo. | 11 × 2 andar ke square centimetre deta hai. Kinaare ke liye bookmark ki chaaron bhujayein socho. | 2: an independent read of every hint (no judge row) |
| c6 | `s2.covered` | Rectangle mein lambai aur chaudai do-do baar aati hain, isliye uska parimap 2 × (lambai + chaudai) hai, aur square ka 4 × bhuja. | Phir rectangle ka parimap 2 × (lambai + chaudai) aaya, aur square ka 4 × bhuja. | 5: covered over 20 words (c6 steady 114) |
| c6 | `s3 worked.problem` | Rani ek rectangle park ke teen chakkar daudti hai. Park 50 m lamba aur 30 m chauda hai. Woh kul kitna daudti hai? | Rani ek rectangle park ke teen chakkar daudti hai. Park 50 m lamba aur 30 m chauda hai. Saath mein nikaalte hain ki woh kul kitna daudti hai. | 6: a problem done together (c6 steady 86; clause 11) |
| c6 | `s3 worked.steps[2].why` | ek lambai aur ek chaudai Rani ko saamne wale kone, yaani aadhe chakkar tak, le jaati hain; poora chakkar uska do guna | ek lambai aur ek chaudai milkar aadha chakkar hain | 4: told step over 30 words (c6 steady 88-98) |
| c6 | `s3 c1.simpler` | Square ki bhujayein chaar hain, do nahi. 84 ko chaar barabar hisson mein baanto. | Square ki bhujayein chaar hain, do nahi, aur sab barabar. Socho, poori baad unmein kaise bategi. | 2: an independent read of every hint (no judge row) |
| c6 | `s3 c3.simpler` | Pehle 70 ka aadha lo, usme ek lambai aur ek chaudai hai. Phir 20 nikal do. | Dori ke chakkar mein lambai do baar aati hai aur chaudai do baar. Socho, aadhi dori mein kya-kya aata hai. | 2: hint leaves only arithmetic (c6 steady 108) |
| c6 | `s3 rem0.board` | (none) | {"template":"shape@1","params":{"shape":"rectangle","side":"28 m","name":"chakkar 90 m"}} | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s3 rem0.viewCaption` | (new) | Talaab ki ek bhuja 28 m ki hai, aur poora chakkar 90 m ka. | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s3 rem0.then.simpler` | 90 ka aadha pehle. Usme ek lambai aur ek chaudai hai, ab 28 nikal do. | Poore chakkar mein do lambai aur do chaudai hain. Socho, aadhe chakkar mein kya aata hai, aur usmein se lambai nikal kar kya bachega. | 2: an independent read of every hint (no judge row) |
| c6 | `s3 rem1.board` | (none) | {"template":"measured@1","params":{"shape":"rect","unit":"m","w":9,"h":6}} | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s3 rem1.viewCaption` | (new) | Plot ki chaaron bhujayein yahan ek line mein hain: 9 m, 6 m, 9 m, 6 m. | 1: a board for every remediation (c6 steady 48, stuck 58, steering 8) |
| c6 | `s3 rem1.then.simpler` | 9 × 6 zameen hai. Taar ke liye 9 aur 6 jodo, uska do guna karo, phir har metre ke ₹20. | 9 × 6 zameen hai, taar nahi. Pehle plot ka kinaara nikalo, phir har metre ke ₹20. | 2: an independent read of every hint (no judge row) |
| c6 | `s3.covered` | Parimap se ulta square ki bhuja nikalti hai, aur lambai bhi pata ho toh rectangle ki chaudai, aur parimap se hi chakkaron ki doori aur taar ka kharcha nikalta hai. | Aakhir mein parimap se kaam liya: square ki bhuja, rectangle ki chaudai, chakkaron ki doori aur taar ka kharcha nikala. | 5: covered over 20 words (c6 steady 114) |
| c6 | `teachback.simpler` | (new) | Taar chaaron bhujaon par mudti hai: dono lambai aur dono chaudai. | 5: no hint rung for the teachback (c6 steady 112) |
| c6 | `wrap.covered` | Aaj ki baat parimap thi, yaani kisi shape ke chaaron taraf ka poora kinaara, jismein har bhuja ek baar judti hai aur andar ki jagah nahi. Rectangle ka parimap lambai aur chaudai ke jod ka do guna hai, square ka ek bhuja ka chaar guna, aur parimap se ulta square ki bhuja nikalti hai, ya lambai bhi pata ho toh rectangle ki chaudai. | Aaj dekha ki parimap band shape ke poore kinaare ki lambai hai, jismein har bhuja ek baar judti hai. Rectangle ka parimap 2 × (lambai + chaudai), square ka 4 × bhuja, aur parimap se ulta bhuja nikalti hai. | 5: covered over 20 words (c6 steady 114) |
| c6 | `wrap.ack[0]` | Hmm, main samajh gayi. | Mujhe tumhare saath kinaare naapna achha laga. | 5: "Hmm, main samajh gayi" to "pata nahi, aap batao" (c6 steady 116) |
| c6 | `wrap.ack[1]` | Achha, theek hai. | Kuch baatein aasaan thi, kuch mein mehnat lagi. | 5: "Hmm, main samajh gayi" to "pata nahi, aap batao" (c6 steady 116) |
| c6 | `wrap.ack[2]` | Theek hai, sun liya maine. | Aaj humne milkar kaafi kuch dekha. | 5: "Hmm, main samajh gayi" to "pata nahi, aap batao" (c6 steady 116) |

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

### Main loop's read of patch 016 (2026-11-17)

Read every quick question and asked step against its point, board and card. Four quick questions asked for something a child knew
before the lesson, so they tested nothing; rewritten to ask for the point's own idea, each with a number or two-option key:

| Where | Old | New | Key (solved from the point and board) |
|---|---|---|---|
| c6 s1 e1 | "Is triangle ki kitni bhujayein hain?" | "Parimap mein kitni bhujaon ki lambai aati hai, do ki ya teeno ki?" | teeno ki: the finger passes all three sides |
| c6 s2 e3 | "Square ki kitni bhujayein barabar hoti hain?" | "Is square ke kinaare mein 6 cm ki bhuja kitni baar aati hai?" | 4: four equal sides of 6 cm |
| c6 s3 e1 | "Is square ki bhujayein kaisi hain, barabar ya alag-alag?" | "60 m ka poora kinaara kitni barabar bhujaon se bana hai?" | 4: the point says four, not two |
| c4 s3 e1 | "Yeh patti kitne barabar tukdon mein bati hai?" | "Rangin tukda is patti ka kaunsa fraction hai?" | 1/2: one of two equal pieces is coloured |

Sentences: c6 s3 e1's point ends "Chaaron bhujayein barabar hain, toh 60 m chaaron mein barabar bat-ta hai." (was "Har bhuja us 60 m
mein se apna barabar ka bhaag leti hai."); c4's rope-and-paper remediation says "fraction ka naam" where it said "naam" (43 words).

D3: `data/lesson-aside-replies.json` gains `kinds.*.againReplies` (two forms a kind, slot `{phrase}`): her answer when the child
says the same aside or the same reply a second time in a lesson. Brain reads it in its next order; until then nothing uses it.

## Main loop's read of patch 043 and the worked steps (2026-11-17)

Read from the dry run's steady lessons. Six sentences changed; everything else in 043's list stands as written.

| script | field | old | new | why |
|---|---|---|---|---|
| c6 | s1 worked step 2 `ask.right` | Haan, 7 + 9 = 16 m; do bhujayein judi, teesri abhi baaki hai. | Haan, 7 + 9 = 16 m; do bhujayein jud gayi. | the child's own step opens "Teesri bhuja bachi": said twice running |
| c6 | s2 worked step 2 `ask.right` | Haan, 42 cm: ek lambai aur ek chaudai, yaani aadha chakkar. | Haan, 42 cm: ek lambai aur ek chaudai. | the child's own step opens "Yeh toh aadha chakkar tha" |
| c6 | s3 worked step 2 `ask.right` | Haan, 80 m: ek lambai aur ek chaudai milkar aadha chakkar. | Haan, 80 m: yeh aadha chakkar hua. | the step's own prompt has just said "Aadha chakkar matlab ek lambai aur ek chaudai" |
| c6 | s3 worked step 3 `ask.right` | Haan, 160 m, kyunki do aadhe chakkar milke ek poora chakkar. | Haan, 160 m: yeh ek poora chakkar hua. | the step's own prompt has just said "Poora chakkar aadhe ka do guna hai" |
| c5-t01 | s1 e1 `whyShort` | 0 se 1 ke 3 gaps; pehla isi line par | 0 se 1 ke 3 gaps; 1/3 isi line par | "pehla" had no noun |
| c5-t02 | s2 c0 `whyShort` | 4/6 mein se 1/6 hatao, 3 hisse bachte | 4/6 mein se 1/6 hatao, 3 hisse bachte hain | clipped |

## c5-t01 skill 1 check 3: the mix-up's answer reworded (main loop, 2026-11-17)

`wrongIfMis` "no place" → "koi mark nahi". The card asks "kaunsa mark hai?", so a child with the mix-up answers about marks. The old token, said by the rule-based child, was read as a safety disclosure by the safety turn's model read (once in director28a's steady and stuck lessons, three times in director28's steady lesson: rows 40, 48, 56). Nothing in the safety code was changed or measured; a real child who answers a maths question with "no place" can still get a safety turn, and that stays on the list for the safety phase. The staged script `data/lesson-scripts-staged/` has one card with the same token; it is read when the staged scripts are.

## Patch 017 (2026-11-17, branch main/d29-learning)

Order: `docs/patches/to-learning/017-director28-boards-and-fit.md` (dc-r8-director28). Done on the four pilots; the checker holds
them to the limits (`d29Errors`, `D29_PILOTS` = the four), `fitReport` prints the fit (`F` lines of `check.mjs <topic>`), and the
compile report has a Fit table per script (staged scripts show their counts there; they are not failed).

### A. Fit (word counts of `hi`; every limit met)

**No pair or remediation was left over its limit.** No beat keeps a `quick` (every point and card fits A.1/A.2), and no remediation
stays whole (every `say` and follow-up card fits 49). The help path's `sayAlt` + card is reported too (45 to 69) but not cut: A.3
names the remediation, and T2's help-path limit is the walk's. The hooks are one or two sentences that run into the first point.
Per script (hook + first point + card /75; later point + card /61; remediation `say` + card /49; worked opening /53):

```
== c4-maths-ch05-t01
hook s1 slot0 (cooking): hook 18 + first point 33 + card 16 = 67/75
hook s1 slot1 (drawing): hook 18 + first point 33 + card 16 = 67/75
hook s2 slot0 (cooking): hook 18 + first point 31 + card 16 = 65/75
hook s2 slot1 (cricket): hook 19 + first point 31 + card 16 = 66/75
hook s3 slot0 (cooking): hook 19 + first point 21 + card 18 = 58/75
hook s3 slot1 (drawing): hook 18 + first point 21 + card 18 = 57/75
point s1 e2: 31 + card 15 = 46/61
point s1 e3: 30 + card 15 = 45/61
point s1 e4: 23 + card 33 = 56/61
point s2 e2: 44 + card 14 = 58/61
point s2 e3: 33 + card 24 = 57/61
point s3 e2: 33 + card 9 = 42/61
point s3 e3: 28 + card 32 = 60/61
remediation s1[0]: say 30 + card 18 = 48/49; sayAlt + card 48
remediation s1[1]: say 26 + card 23 = 49/49; sayAlt + card 65
remediation s2[0]: say 23 + card 23 = 46/49; sayAlt + card 64
remediation s2[1]: say 24 + card 25 = 49/49; sayAlt + card 59
remediation s3[0]: say 23 + card 23 = 46/49; sayAlt + card 45
worked s1: problem 13 + first question 12 (steps[0]) = 25/53
worked s2: problem 6 + first question 11 (steps[0]) = 17/53
worked s3: problem 20 + first question 13 (steps[0]) = 33/53
== c5-maths-ch02-t01
hook s1 slot0 (cricket): hook 20 + first point 28 + card 15 = 63/75
hook s1 slot1 (vehicles): hook 20 + first point 28 + card 15 = 63/75
hook s1 slot2 (games): hook 20 + first point 28 + card 15 = 63/75
hook s2 slot0 (cricket): hook 18 + first point 33 + card 16 = 67/75
hook s2 slot1 (games): hook 18 + first point 33 + card 16 = 67/75
hook s3 slot0 (cricket): hook 19 + first point 35 + card 21 = 75/75
hook s3 slot1 (vehicles): hook 18 + first point 35 + card 21 = 74/75
point s1 e2: 30 + card 22 = 52/61
point s1 e3: 31 + card 22 = 53/61
point s2 e2: 34 + card 17 = 51/61
point s2 e3: 32 + card 13 = 45/61
point s3 e2: 37 + card 20 = 57/61
point s3 e3: 34 + card 22 = 56/61
remediation s1[0]: say 29 + card 17 = 46/49; sayAlt + card 62
remediation s1[1]: say 24 + card 25 = 49/49; sayAlt + card 63
remediation s1[2]: say 26 + card 22 = 48/49; sayAlt + card 40
remediation s2[0]: say 21 + card 19 = 40/49; sayAlt + card 62
remediation s2[1]: say 24 + card 25 = 49/49; sayAlt + card 66
remediation s2[2]: say 26 + card 21 = 47/49; sayAlt + card 56
remediation s3[0]: say 23 + card 25 = 48/49; sayAlt + card 61
remediation s3[1]: say 25 + card 24 = 49/49; sayAlt + card 69
remediation s3[2]: say 24 + card 25 = 49/49; sayAlt + card 67
worked s1: problem 20 + first question 11 (steps[0]) = 31/53
worked s2: problem 15 + first question 13 (steps[0]) = 28/53
worked s3: problem 21 + first question 11 (steps[0]) = 32/53
== c5-maths-ch02-t02
hook s1 slot0 (cooking): hook 17 + first point 31 + card 26 = 74/75
hook s1 slot1 (drawing): hook 17 + first point 31 + card 26 = 74/75
hook s2 slot0 (cooking): hook 20 + first point 29 + card 18 = 67/75
hook s2 slot1 (nature): hook 20 + first point 29 + card 18 = 67/75
hook s3 slot0 (games): hook 20 + first point 17 + card 20 = 57/75
hook s3 slot1 (cooking): hook 20 + first point 17 + card 20 = 57/75
point s1 e2: 30 + card 17 = 47/61
point s1 e3: 43 + card 12 = 55/61
point s2 e2: 29 + card 23 = 52/61
point s2 e3: 33 + card 23 = 56/61
point s2 e4: 28 + card 25 = 53/61
point s3 e2: 45 + card 16 = 61/61
point s3 e3: 36 + card 24 = 60/61
point s3 e4: 44 + card 13 = 57/61
remediation s1[0]: say 24 + card 21 = 45/49; sayAlt + card 46
remediation s2[0]: say 24 + card 25 = 49/49; sayAlt + card 47
remediation s2[1]: say 24 + card 25 = 49/49; sayAlt + card 45
remediation s2[2]: say 23 + card 25 = 48/49; sayAlt + card 69
remediation s3[0]: say 24 + card 25 = 49/49; sayAlt + card 53
remediation s3[1]: say 24 + card 25 = 49/49; sayAlt + card 57
remediation s3[2]: say 25 + card 24 = 49/49; sayAlt + card 50
worked s1: problem 21 + first question 14 (steps[0]) = 35/53
worked s2: problem 17 + first question 13 (steps[0]) = 30/53
worked s3: problem 20 + first question 14 (steps[0]) = 34/53
== c6-maths-ch06-t01
hook s1 slot0 (cricket): hook 19 + first point 37 + card 13 = 69/75
hook s1 slot1 (drawing): hook 18 + first point 37 + card 13 = 68/75
hook s1 slot2 (nature): hook 20 + first point 37 + card 13 = 70/75
hook s2 slot0 (cricket): hook 17 + first point 43 + card 7 = 67/75
hook s2 slot1 (games): hook 17 + first point 43 + card 7 = 67/75
hook s3 slot0 (football): hook 20 + first point 36 + card 8 = 64/75
hook s3 slot1 (nature): hook 20 + first point 36 + card 8 = 64/75
hook s3 slot2 (cricket): hook 19 + first point 36 + card 8 = 63/75
point s1 e2: 41 + card 6 = 47/61
point s1 e3: 41 + card 10 = 51/61
point s2 e2: 42 + card 12 = 54/61
point s2 e3: 35 + card 12 = 47/61
point s3 e2: 28 + card 6 = 34/61
point s3 e3: 41 + card 10 = 51/61
remediation s1[0]: say 25 + card 23 = 48/49; sayAlt + card 41
remediation s1[1]: say 29 + card 19 = 48/49; sayAlt + card 55
remediation s2[0]: say 29 + card 20 = 49/49; sayAlt + card 61
remediation s2[1]: say 27 + card 16 = 43/49; sayAlt + card 56
remediation s3[0]: say 27 + card 21 = 48/49; sayAlt + card 59
remediation s3[1]: say 26 + card 23 = 49/49; sayAlt + card 58
worked s1: problem 27 + first question 11 (steps[0]) = 38/53
worked s2: problem 21 + first question 14 (steps[0]) = 35/53
worked s3: problem 18 + first question 11 (steps[0]) = 29/53
```

### B. Quick questions

All deleted: on the four pilots every pair fits, so none may keep one (B.1). The checker: `quick` is no longer required on a D29
script; a `quick` on a pair that fits is an error; a pair over its limit without a `quick` is an error; a kept `quick` whose key or
any accepted form is in its point (hi or en) is an error.

### C. Boards changed (part: old → new)

| Script | Part | Old | New |
|---|---|---|---|
| c4 | s1 e4 point | `fraction-bars` 8 "1/8" + 6 "?" (the Raju strip) | `fraction-bars` 8 "1/8" alone (caption: the 8-gap line); the card keeps both strips |
| c4 | s3 bigger-denominator `sayAlt` | `wholes` Laddoo 2, Laddoo 4 | `wholes` Roti 3, Roti 5 (the words no longer give the e1 card's answer) |
| c5-t01 | s1 e2 point | `fraction-line` dens [7,8], 1/7 | den 7, "1/7" (the point speaks the upper line only); the card keeps [7,8] |
| c5-t01 | s1 e3 point | den 8, "1/8" and "1/2" | den 8, "1/8" (the point never said 1/2) |
| c5-t01 | s1 count-marks card (rem0 then) | dens [7,12], 1/7 (the 11 ticks it asks to count) | den 7, "1/7" (the ribbon it starts from); answerBoard keeps [7,12]; the card is said as "Socho, … kaat rahe ho" |
| c5-t01 | s1 "not numbers" rem2 | dens [7,6], 1/7 (its card's) | den 7, "1/7" |
| c5-t01 | s2 count-marks rem0 | dens [4,10], 2/4 (its card's) | den 4 |
| c5-t01 | s2 "not numbers" rem2 | den 8, mark 3 (its card's) | den 8 |
| c5-t01 | s3 "all less than one" rem0 | dens [8,6] 0–2, 8/8 (its card's) | den 8 0–2, "8/8 = 1" |
| c5-t01 | s3 "not numbers" rem2 | den 5 0–2, mark 8 (its card's) | den 5 0–2, "5/5 = 1" |
| c5-t02 | S1 e2 point | `fraction-parts` 8, 1 shaded | `fraction-bars` 4 + 8, the 8's first part "1/8" ("dono patti") |
| c5-t02 | S2 e2 point | `fraction-parts` 7, 4 shaded | `fraction-line` den 7, "4/7", 4 hops ("ek number line par") |
| c5-t02 | S1 worked problem | bars 8 "1/8" + 2 "1/2" shaded (the child's step's answer board) | bars 8 + 2, unshaded, unnamed |
| c5-t02 | S2 worked problem | line den 8, "3/8", "5/8" (the answer board) | line den 8 |
| c5-t02 | S3 worked problem | line dens [7,3], 2/7 and 2/3 marked | line dens [7,3] |
| c5-t02 | S2 c2 (new card) | `wholes` 4 + 6 | bars 3 + 6 unshaded; answerBoard 2/3, 5/6 |
| c6 | s1 worked problem | `measured` triangle 7, 9, 12 | triangle 8, 9, 14; own step's answerBoard `shape` triangle "35 − 31 = 4 m" |

Every other `explain[].board`, remediation board and `sayAlt.board` was read against its part and left: it shows what its part says.
Captions (`viewCaption`) of each redrawn board were rewritten to say only what it draws. The checker (director10 cause #2) now allows
a card that asks the child to count a line's marks to be posed on the line it starts from when its answer board adds that line and
its key is a count (the count-marks card).

### D. Worked examples (asked step → the child's own step), before → after, with the blind solve of each new key

| Script | Before | After | Blind solve (problem and board alone) |
|---|---|---|---|
| c4 s1 | asked "Plate par kitne tukde bache?" (2, on the board); own: the fraction | asked "Neeche wale number mein kaunse tukde ginoge: saare, ya sirf khaye hue?" → **saare tukde**; own "plate par bache tukde … kaunsa fraction?" → 2/5 | bottom = all 5 equal pieces; left = 5 − 3 = 2 on top → 2/5 |
| c4 s2 | no asked step; told "1/3 kya kehta hai"; own 15 ÷ 3 | asked "1/3 ke liye 15 pencil ko kitne barabar group mein baantoge?" → **3**; own "ek group mein kitni pencil?" → 5 | 1/3 → 3 equal groups; 15 shared in 3 → 5 |
| c4 s3 | asked "Kiska ek tukda chhota hoga…?" (fifth asking); own 2 | asked "6 chhote tukde, bade tukdon par barabar rakhne hain. Unke kitne group banaoge?" → **3**; own "3 wali ke ek tukde par 6 wali ke kitne tukde?" → 2 | one group per big piece, 3 big pieces → 3 groups; 6 in 3 groups → 2 on each |
| c5-t01 s1 | asked "3 khambon se kitne gaps bane?" (the frame thrice); own the first pole | asked "Doori ke liye khambe ginoge, ya khambon ke beech ke gaps?" → **gaps**; told 3 poles → 4 gaps; own "pehla khamba ghar se kitne kilometre par?" → 1/4 kilometre | distance is walked in gaps; 3 poles cut 1 km into 4 equal gaps; first pole one gap from home → 1/4 km |
| c5-t01 s2 | asked "5 barabar gaps ke liye beech mein kitne marks lagenge?" (on the board); own the 2nd mark (with its method said) | asked "2/5 ka kaunsa number batata hai ki line kitne barabar gaps mein kategi?" → **neeche wala number**; told each gap 1/5; own "2/5 ke liye 0 ke baad kaunse mark par?" → the 2nd mark | bottom 5 cuts 0–1 into fifths; top 2 = two gaps from 0 → second mark |
| c5-t01 s3 | asked "0 se 4 gap chalkar kis fraction par?"; own "7 gap the, 4 mein 1 aa gaya; kitne bache?" (7 − 4 handed over) | asked "7/4 line par 1 se pehle aayega, ya 1 ke baad?" → **after**; told 4 gaps reach 1; own "1 ke baad kaunse mark par 7/4?" → **the 3rd mark** (new key) | top 7 > bottom 4, so past 1; 7 gaps of 1/4, 4 reach 1, 3 more → third mark after 1 |
| c5-t02 S1 | told "upar wala number dekho"; asked "Kiski chocolate zyada hisson mein kati?"; own Sana | asked "Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?" → **kam hisson mein**; told 8 and 2; own "bada hissa kisko mila?" → Sana | same chocolate, fewer parts → bigger part; Sana's is in 2, Rahul's in 8 → Sana |
| c5-t02 S2 | asked "har hissa kaunsa fraction hai?" (the frame); own Raju | asked "Hisse ek size ke; faisla kaun karega, upar wala number ya neeche wala?" → **upar wala number**; told 5 and 3; own "kam cake kisne khaya?" → Raju | both in eighths, so the count decides; 3 < 5 → Raju |
| c5-t02 S3 | asked "Isha ki chocolate 3 mein kati. Har hissa kaunsa fraction?"; own Isha | asked "Dono ne 2-2 hisse khaye; ab faisla kaun karega, ginti ya hisse ka size?" → **hisse ka size**; told 1/3 and 1/7; own "zyada kisne khaya?" → Isha | counts equal, so size decides; 1/3 > 1/7 → Isha |
| c6 s1 | asked "Pehle 7 aur 9 jodo"; own "16 mein 12 jodo" | problem now 8 m, 9 m, 14 m and the gardener's 35 m; asked "Baad kin bhujaon par lagegi: sirf do par, ya teeno par?" → **teeno par**; told 8 + 9 + 14 = 31 m; own "maali ki 35 m baad mein se kitni bachegi?" → **4 m** (new key; mix-up 18 m) | the fence goes on every side; 8 + 9 + 14 = 31; 35 − 31 = 4 m |
| c6 s2 | told "use 2 × (l + b)"; asked "24 + 18 kitna?"; own "2 × 42 kitna?" | asked "Kone se saamne wale kone tak, aadhe chakkar mein kaun si bhujayein aati hain?" → **ek lambai aur ek chaudai**; told 24 + 18 = 42 cm; own "poore kinaare par kitni tape?" → 84 cm | corner to opposite corner = one length + one breadth; 42 is half the round; whole = 84 cm |
| c6 s3 | asked "50 + 30 kitna?", "2 × 80 kitna?"; own 3 × 160 | asked "Teen chakkar ki doori ke liye, pehle kaunsi doori nikalni hogi?" → **ek chakkar**; told 2 × (50 + 30) = 160 m; own "teen chakkar mein kul kitne metre?" → 480 m | three equal rounds, so find one round first; 160 m a round; 3 × 160 = 480 m |

Every opening (problem's first word to the end of the first question) is 17 to 38 words, with no told step between. No `ask.right`
or told form opens the next step's sentence; no fact is said twice (c4 s1's "5 tukdon mein se 3 kha liye" is said once, in the
problem). The checker fails an asked step or own step that asks a bare sum (`a + b`, `a × b`, "7 aur 9 jodo").

### E. Joints

`joints.stepMiss` in all four: "Nahi, yeh nahi hai." / "Yeh jawab nahi hai." / "Nahi, kuch aur hai." (4 words or fewer, no number, no
question). `joints.workedInvite` deleted in all four (the checker fails it on a D29 script). Switch line (E.3): the second wordings
after "easier words" that were another story of the same weight are plain now: c4 s1 e3 `pointAlt` ("Ulta chalo: agar tumhe 1/3
banana ho…" → "Seedhi baat: circle ke 3 barabar tukde hain, aur 1 mein rang. Isliye 1/3: neeche 3, upar 1.", steady 36); c4 s1 e1
and s2 e2 `pointAlt` lose "Ulte kram mein socho" / "Ulta socho"; c6 s1 rem0 `sayAlt` (the chowkidaar story, steering 8 → "P se
chalo, ek-ek bhuja par ruko aur uski lambai jodo. Ungli wapas P par aaye, tabhi ruko."); c5-t01 s1 rem2 `sayAlt` (steering 8,
"Number se jagah tak chalo: 1/7 kilometre sadak par ek hi jagah hai, line ke upar pehla mark. Ek jagah ka ek hi naam hota hai…" →
"Seedhi baat: khilona ek hi jagah ruka, toh uska ek hi number hai. Woh number 1/7 kilometre hai."). The other `pointAlt`s and `sayAlt`s
were read for the same and left: each is a plainer picture of the same point.

### F. Sentences the judges named (old → new; row)

- **c4** s3 bigger-denominator `say` (steady 98): "…12 bada number hai, par 12 wali ka tukda patla hai, kyunki neeche wala number
  batata hai roti kitne tukdon mein kati, tukda kitna bada yeh nahi." → "Do ek jaisi roti: ek 3 barabar tukdon mein kati, ek 12 mein.
  Roti utni hi, toh 12 wali ka har tukda patla." Its `sayAlt` (steady 100): "Ek laddoo 2 bachche baantein… waisa hi laddoo 4 bachche
  baantein, toh har ek ko aadhe ka bhi aadha…" → "Do ek jaisi roti socho: ek 3 bachche baantein, doosri 5 bachche. Roti utni hi hai,
  toh 5 bachchon wala tukda chhota." The part-part follow-up re-ask (steady 10, stuck 34, steering 14): "4 barabar tukdon wali chocolate
  ke 2 tukde khaye gaye, toh Pinky ka 2/4 sahi hai ya Golu ka 2/2?" → "Is chocolate ke rangin tukde khaye gaye: Pinky ka 2/4 sahi hai ya
  Golu ka 2/2?" The c2 hint (steady 54, offtopic 62): "…Unmein se khaya hua tukda hata do." → "Socho, 1/12 ka neeche wala number kya
  ginta hai, aur upar wala kya ginta hai." s2 worked second hint (steady 86, the `problemAlt`): "…Pehle 1/3 ka matlab dekhenge, phir us
  ek group ki pencil." → "Socho, 15 pencil 3 doston mein barabar baantni hain. Ek dost ko jitni milein, wahi 15 ka 1/3 hai." "Ulta
  chalo", "Ulte kram mein socho": gone (above). "Ab upar wala number: 2, kyunki…": the step is gone (D). Chocolate and patti (steady
  128, 130): s3's own step "Board par dono chocolate patti ki tarah bani hain… 3 wali patti…" → "Tumhari baari: 3 wali chocolate ke ek
  tukde par, 6 wali chocolate ke kitne tukde aate hain?". s1 worked re-ask "Plate par bache 2 tukde…" → "Plate par bache tukde poori
  barfi ka kaunsa fraction hain?" (016 B: no number the card leaves the child).
- **c5-t01** "Pehle 7 gaps the" (s1 e3) → "Gap zyada, toh har gap pehle se chhota hai."; "1/12 metre matlab ribbon ke 12 barabar gap…"
  (rem0 card's why) → "12 barabar gaps ke beech 11 marks hote hain, gaps se ek kam"; "7 = 4 + 3: pehle 4 gap se 1 poora hua…" → "pehle
  4 gap se 1 poora hua, aur baaki 3 gap 1 ke aage gaye"; "Is sawaal ka jawab: sahi nahi" (offtopic 58): s1 c2's key "wrong" → "galat"
  (the word its prompt offers; "wrong" stays accepted, `wrongIfMis` "right" → "sahi"); the frame "kitne barabar gaps" (s1 e2 card, e3
  quick, worked step): the quick and the worked step are gone; "0 ke baad pehla mark kaunsa fraction hai" (e2 quick and c1): the quick is
  gone; km and kilometre: every spoken "km" is "kilometre"; "bata"/"bati" for divided (5 lines) → "kata"/"kati", "logon mein bate" →
  "logon mein baante".
- **c5-t02** S2 e1 hint (stuck 60) "Patti ke hisse wahi 7 rehte hain; badalti sirf rang wale hisson ki ginti hai." → "Pehli patti par
  2/7 kaise bana, woh dekho; doosri patti par wahi tareeka lagao."; re-ask (offtopic 54) "7 barabar hisson wali patti ke 4 hisson mein
  rang bharein…" → "Doosri patti ke 4 hisson mein rang bharein, toh woh kaunsa fraction banega?"; "Zoya" as two people (steady 54, 80):
  the S2 follow-up card's `{friend}` is "Neha"; S2 c2, a skill 1 card (one part of 1/4 against 1/6), → "Do ek jaisi patti: ek ke 3
  barabar hisson mein se 2 rangin, doosri ke 6 mein se 5. Dono mein ek-ek hissa bina rang ka hai. Kya dono mein rang barabar hai, haan
  ya nahi?" (gap-thinking, key No: empty parts 1/3 > 1/6, so 5/6 has more); S3 c2 "Dono apne liye hue hisse jodkar ek ribbon banate
  hain. Kiska ribbon lamba banega…" → "Kiske 5 hisse milkar lambe hain, Anjali ke ya Imran ke?"; the frame "…kaunsa fraction hai?":
  the quicks and S2's asked "har hissa kaunsa fraction hai?" are gone; roti in the hook against patti on the board: "Kitchen mein do ek
  jaisi barfi ki patti kaati: ek ke 4 barabar hisse, doosri ke 8." "Toh poora jawab:" is not in the script (the walk's form).
- **c6** s2 rem1 (steady 72) "Parimap aur area ko jawab ki ikaai se pehchaano. …" → "Socho, kinaare par dhaaga lapeta aur scale par
  naapa: woh kinaara hai. Andar ke 1 cm wale square gine: woh area hai. Kinaare ke liye bhujayein jodo."; s3 e1's point (steady 80)
  "…toh 60 m chaaron mein barabar bat-ta hai." → "Yeh kinaara chaar barabar bhujaon se bana hai, do se nahi. Ungli kone se chale, toh
  chaaron bhujayein paar karke hi 60 m poore hote hain."; s3 rem0 (steady 82) "…rectangle ka parimap aadha karo aur lambai ghatao; square
  ka parimap 4 se baanto." → "Socho, rectangle ke poore chakkar mein do lambai aur do chaudai hain. Kone se saamne wale kone tak sirf
  aadha chakkar hai: ek lambai aur ek chaudai."; the s1 e2 card's re-ask (offtopic 16–20, none authored) → "Is hexagon ki ek bhuja par 5
  cm likha hai; poore hexagon ka parimap kitne cm hai?"; "lambai" as a length (steady 48, 56), in skill 2: "jawab ek lambai hai" →
  "Jawab kinaare ka naap hai", the e3 card "chaaron bhujaon ki kul lambai" → "chaaron bhujayein milkar kitne cm hain?", and its did, why,
  whyAlt, `pointAlt`, the c3 hint and the bookmark card ("kinaare ki poori lambai" → "poora kinaara kitne centimetre ka"); skill 1
  still says "lambai" for a length before the long side is named; the e1 hint (stuck 6) "Board ki line dekho: ungli ka poora safar wahi
  hai…" → "Board par triangle ki har bhuja par uska naap likha hai. Ungli jin bhujaon se guzri, un sabke naap milakar socho."

### Tests

Run: `tests/r7-board-ref`, `tests/r8-learning-*` (with the new `r8-learning-director28`), `tests/r7-learning-*`, `tests/r8-picture-turn`,
`tests/r7-compile`: 277 tests, 273 pass, 4 fail. Repinned where 017 changed what they pin, each keeping its rule: `r8-learning-director27`
016 A1 → 017 B (a quick only on a pair that does not fit; none kept), 016 A2 (c4: the pieces left are the child's; c6: one asked step,
no sum asked); `r7-learning-d10` (c6's sides 8, 9, 14); `r7-learning-d11` (the count-marks card shares the ribbon's line; s1 rem2 now
has its own board); `r7-learning-d12` D12.2 (the worked problem is unmarked now, so the rule is tested by putting the shaded board back);
`r7-learning-d13` D13.3 (the two gap remediations cut to fit); `r8-picture-turn` (fraction-parts 12 → 10, bars 35 → 36, line 60 → 61).
Failing, not the scripts: `r7-compile` "help columns… a missing rung is a hole" (compile.js still lists `workedInvite` among the help
joints; Brain 044 stops reading it); `r7-learning-coldstart`, `r7-learning-kit-workflows`, `r7-learning-reactive-child` (files absent
from this sparse checkout: `evals/placement-coldstart/sim.mjs`, `docs/research/census/…`, `evals/child-sim/reactive.mjs`).

### For main

- The compile report's help-joints table lists `workedInvite` missing on the four pilots: compile.js, not the scripts (Brain 044).
- A.3's help path (`sayAlt` + card, 45 to 69 words) is measured in `fitReport` but not cut; if the walk joins a `sayAlt` to its card
  under T2's 60, about half the `sayAlt`s need the same cut.

## Patch 018 (2026-11-18, branch main/d30-learning)

Order: `docs/patches/to-learning/018-director29-captions-and-said-lines.md` (dc-r8-director29 item 9). Done on the four pilots.
The checker holds them to it (`d30Errors`, `d30Report` in `scripts/lesson-scripts/check.mjs`; the `F` lines of `check.mjs <topic>`
now also report the captions read, the answer boards with no second view, and the remediations left whole).

### New script fields and joints (exact names; code reads them)

- `answerViewCaption` `{ hi, en }` beside the `answerBoard` of a follow-up card (`remediation[].then`) or a check (`checks[]`) whose
  answer board has a second view: what to look at in that picture, said after the key (it may name the key). 1–2 sentences, no
  question, true of the answer board's view kind. None where the answer board has no second view (the checker refuses one there).
- `joints.startAnyway`: three forms, 6 words or fewer, no question, no slot — said after a second "pata nahi, aap batao" at the
  greeting, before the hook: "Chalo, main batati hoon." / "Theek hai, main shuru karti hoon." / "Achha, pehle main dikhati hoon."
- `joints.afterPark`: three forms, 8 words or fewer, no question, no slot — said after a park line, before the live part:
  "Ab yeh kaam poora karte hain." / "Chalo, pehle yahan se aage badhte hain." / "Abhi apne kaam par wapas chalte hain."
- The checker's `REM_WHOLE` list (topic, skill, remediation `targets`, reason): a remediation over 49 words with its card passes
  only when listed; the walk says a listed one alone, ending on its check-in.

### C.2 park forms: the decision

**The park forms promise the return and nothing else; every park is followed by `joints.afterPark`, in all four scripts.** Not the
other way: the checker's director22 rule ("a park promises the return and nothing else; the walk says what is next") stands, and
rewriting the forms to lead back themselves broke it (tried, 7–8 errors a script). Brain 045 builds: park line → one
`afterPark` form → the live part. The one park named as abrupt, c5-t02's "{aside} ki baat bhi karenge, bilkul." (steady 40), is
now "{aside} ki baat bhi zaroor karenge, thodi der mein."

### A.1 Captions read against the drawn view

Every `viewCaption` of the four scripts (c4 45, c5-t01 46, c5-t02 54, c6 30; 137 with a second view, 38 on the held board only)
was read against the view `pictureTurn` draws for its board (kinds: `line` = fraction-line and unrolled views; `strip` = bars,
fraction-parts as bar, wholes as bar; `circle` = round, wholes; `grid` = shade-grid). The checker fails a caption naming a line,
strip, circle or grid that is neither the view's kind nor the held board's. Changed (board → view the caption was read against):

| Script | Board | Board → view | Was | Now |
|---|---|---|---|---|
| c5-t02 | S1 worked | bars 8+2 → wholes (circles) | "…0 se 1 ki number line hai: line ke upar 8 barabar gap, line ke neeche 2." (stuck 18) | "Dono chocolate yahan do ek jaise gol ban gayi hain: pehla gol 8 barabar hisson mein, doosra 2 mein." |
| c5-t02 | S2 e2 point | line den 7 → strip | "Is gol ke saat barabar hisse hain…" | "Yeh patti saat barabar hisson mein hai, aur pehle chaar hisson mein rang bhara hai." |
| c4 | s3 e1 point | bar 2 → circle | "…Rang theek beech ki line tak jaata hai." | "…Rangin tukda aur bina rang ka tukda ek jitne bade hain." |
| c6 | s3 e3 point | measured plot → no view | "Plot ka poora kinaara ek line par khula hai: …" | "Plot ka kinaara chaar bhujaon se bana hai: 12 m, 8 m, 12 m, 8 m, kul 40 m. …" |
| c5-t01 | s1 e2, s1 e3 points; s2 rem0, s2 rem2 | line → strip | "Yeh line …", "Is line ko sadak samjho…" (the strip called a line) | "Yeh patti …", "Is patti ko sadak samjho…" |
| c4 | s1 e4 card; s3 e1 card | bars → line (dens [8,6]; [2,4]) | "ek taraf … doosri taraf" | "line ke upar … line ke neeche" (the view's top scale first) |
| c5-t02 | S1 e2 point | bars 4+8 → line dens [8,4] | "ek taraf 4 …, doosri taraf 8" | "line ke upar 8 barabar gap, line ke neeche 4" |
| c5-t01 | s3 e1 card, s3 c2 | line, no view | "dono taraf" | "upar bhi … neeche bhi", "upar-neeche dono" |

### A.2 Worked captions and the asked steps' answers

The checker reads the key and every accepted form of each asked step (and of the own step while the worked board is still up for
it) in words or digits, number words as digits; a form the problem itself states is a given. Changed:
c5-t01 s1 worked (strip): "…gaps ke beech ke teen marks teen khambe. Rangin gap ghar se pehle khambe tak ka raasta hai." (named
"gaps", the asked key, and pointed at the own step's 1/4: stuck 18) → "…aur beech ke teen marks teen khambe.";
c5-t01 s2 worked (held line): "…paanch barabar gaps mein…" (an accepted "5" of the asked step) → "…barabar gaps mein kati hui.";
c5-t01 s3 worked: "Line ke upar 7/4 likha hai…" ("upar", an accepted form of the new asked step) → "7/4 ki jagah dhoondni hai.";
c6 s1 worked (unrolled): "…8 m, 9 m aur 14 m, ek ke baad ek." (stuck 18; the checker cannot see this one — it gives the step by
laying all three sides end to end, not by a word) → "Yahan kyari ka kinaara khol kar seedhi line bana di hai. Maali ke paas 35 m
baad hai."; c6 s3 worked: "Rani ka ek chakkar yahan…" ("ek chakkar", the asked key) → "Park ka kinaara yahan khol kar seedhi line
bana di hai: 50 m, 30 m, 50 m, 30 m."

### A.3 `answerViewCaption`

38 added: c4 10, c5-t01 12, c5-t02 14, c6 2 — every follow-up card and check whose answer board has a second view. Each read
against its view and against the key. Answer boards with no second view (no caption written): c4 s2 c2 and s2 rem1's card
(equal-groups of unequal sizes), s3 c3 (three bars); c5-t01 all six of skill 3 (lines beyond 1); c5-t02 S1 c2 and S3 c1 (three
bars); c6 12 (area-grid, compare and shape boards: s1 c2, s1 rem1's card, s2 c1–c3, both s2 remediation cards, s3 c1–c3, both s3
remediation cards).

### B. Remediations (before → after)

Rewritten as full sentences, inside 49 with their card:
- **c4** s1 unequal-parts: "Yeh rassi … kati: baant barabar nahi, toh naam nahi. Kaagaz beech se kata, dono tukde ek jaise: inhe
  fraction ka naam milta hai." → "Yeh rassi ek lambe aur do chhote tukdon mein kati, isliye in tukdon ka fraction naam nahi hota.
  Kaagaz beech se kata, dono tukde ek jaise, toh unka fraction naam hai." s1 part-part: "…batata hai ki poori chocolate kitne
  tukdon mein bati; tukde kha lo, yeh ginti nahi badalti." → "…Neeche wala number poori chocolate ke tukde ginta hai; kuch tukde
  kha lo, woh ginti wahi rehti hai." (the stitch "socho. Socho" is fixed at the joint: `beforeRemediation[2]` "Ek naye tareeke
  se socho." → "Ek aur tareeka dekhte hain."; a remediation with no board stays a "socho" telling, as 016 C holds). s2
  part-part: "Kele nahi, thaile gino: diya hua thaila 5 mein se ek hai." → "Yahan kele nahi, thaile gino; jo thaila diya, woh 5
  thailon mein se ek hai." s3: "Do ek jaisi roti: ek 3 … ek 12 mein. Roti utni hi, toh 12 wali ka har tukda patla." → "Do ek
  jaisi roti hain: ek 3 barabar tukdon mein kati, doosri 12 mein. Roti utni hi hai, toh 12 wali ka har tukda patla hai."
- **c5-t01** s1 count-marks: "Darzi ka ribbon, 0 se 1 metre: 6 chalk ke marks, aur 7 barabar gap. …" → "Darzi ka ribbon 0 se 1
  metre tak hai, aur us par 6 chalk ke marks hain. Marks 6 hain, par gap 7 bante hain, isliye pehla mark 1/7 metre par hai."
  s1 whole-number-bias (steady 16): "Line ke ek taraf 2 barabar gap, doosri taraf 5. Zyada gap, toh har gap chhota: …" → "Line ke
  upar 2 barabar gap hain, neeche 5. Gap jitne zyada, har gap utna chhota: 1/5 ka gap 1/2 wale se chhota hai." s2 count-marks
  (steady 52, the child who said "1st mark"): "Line par 3 marks, par gap 4: …" → "0 se pehle mark tak ek gap hai, doosre mark tak
  do gap. Hum gap ginte hain, mark nahi, isliye 3 marks wali line mein 4 gap hain." s2 whole-number-bias: "Upar 1/3 ke gap,
  neeche 1/6 ke: 1/3 wala do guna lamba. Toh …" → "Upar har gap 1/3 hai, neeche 1/6: upar wala do guna lamba hai. 2 chhote gap
  2/6 par rukte hain, 2 lambe 2/3 par." s3 all-less-than-one: "Line 0 se 2, har gap 1/8. 8 gap 0 se 1 bhar dete hain: 1 par
  8/8. Naunva gap 1 ke aage." → "Yeh line 0 se 2 tak hai, har gap 1/8. 8 gap chalkar 1 aata hai, yaani 8/8; naunva gap 1 ke aage
  hai."
- **c5-t02** S1: "…10 bada number hai, phir bhi 10 walon ka hissa chhota." → "Do ek jaisi roti hain: … phir bhi 10 logon wala hissa
  chhota hota hai." S2 gap-thinking: "Do ek jitni patti: 2 mein se 1 rangin, aur 7 mein se 6. Pehli ki kami aadhi patti, doosri
  ki bas 1/7." → "Pehli patti mein 2 mein se 1 rangin hai, doosri mein 7 mein se 6. Pehli ka aadha khaali hai, doosri ka bas
  1/7." S3 bigger-denominator: "Do ek jaisi rassi: 2 aur 8 barabar hisse. 2 wali ke ek hisse mein 8 wali ke chaar; …" → "Ek rassi
  2 hisson mein kati, aur waisi hi doosri 8 mein. 2 wali ke ek hisse mein 8 wali ke chaar aate hain." S3 gap-thinking: "Do ek
  jaise dibbe: 3 mein se 2 khaane bhare, 8 mein se 7. …" → "Dono dibbon mein ek-ek khaana khaali hai, par 3 khaanon wale ka
  khaana bada hai. Isliye 8 khaanon wala bharne ke zyada paas hai."
- **c6** s2 l-plus-b: "…Lambai, phir chaudai chali: ab saamne wale kone par, bas aadha chakkar. …" → "Socho, ek cheenti khet
  ke kone se chalti hai. Woh lambai, phir chaudai chali, toh saamne wale kone par hai: aadha chakkar. Shuru wala kona do
  bhujayein door hai." The other c6 remediations and c4 s2's "Socho, saari cheezein…" were read and left: full sentences.

**Left whole (REM_WHOLE, said alone and ending on a check-in), five:**
- c5-t01 s3 whole-number-bias (58/49): "Socho, do fractions ka upar wala number ek jaisa hai, toh dono mein utne hi gap chalne hain.
  Jiska neeche wala number bada hai, uska har gap chhota hai, toh woh kam door jaata hai." — was "…Neeche wala bada, toh har gap
  chhota, aur safar jaldi khatam."; two sentences that each need their clause.
- c5-t01 s3 not-numbers (65/49, steady 84): "Yeh stations 0 se 2 tak hain, aur har do stations ke beech 5 barabar gaps hain;
  station 1 par 5/5 hai. Train jahan rukti hai, uska number ek fraction hai: upar woh gaps jo train chali, aur neeche 5." — was
  "Train ka number ek fraction: upar gine gaps, neeche 5…".
- c5-t02 S2 same-bottom-equal (56/49): "Do ek jaisi roti hain, dono 5 barabar hisson mein. Ek se 2 hisse liye, doosri se 4. Har
  hissa ek hi size ka hai, toh 4 hisse matlab zyada roti." — the card is 25 words; three sentences do not go under 24.
- c5-t02 S2 tops-only (63/49, the judge's named note): "Do ek jaisi patti socho, ek 3 barabar hisson mein aur doosri 9 mein. 3
  wali patti ka ek hissa, 9 wali ke teen hisson jitna lamba hai. Isliye 9 wali ke 2 hisse bhi usse chhote hain."
- c5-t02 S3 tops-only (60/49): "Do ek jitni patti hain, ek 3 barabar hisson mein aur ek 5 mein, toh 3 wali ka har hissa bada hai.
  Dono mein utne hi hisse rangein, toh 3 wali mein rang zyada hoga."

c5-t01 skill 3 has two standing alone and c5-t02 skills 2 and 3 have two and one: a steady lesson meets at most the ones its child
misses, but the decision's reversal clause (more than two alone in a steady lesson) is closest in c5-t02.

### B. Other changed sentences (old → new; judge's row)

- **c4** s1 e4 point (stuck 20, the dense e4 turn: point cut, card untouched): "Is patti ke 8 barabar tukde hain, ek mein rang.
  Rangin tukda 1/8 hai: …" → "Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi." s2 e2 point (s44, the
  card's regrouping untaught): "…1/3 mein bhi yahi, bas neeche wala number 3 hai." → "24 aam 6 barabar group mein hain. 1/6 ka
  matlab: 6 barabar group banao aur ek group lo, toh 24 ka 1/6 hai 4 aam. Chhote group jodkar bade group bhi bante hain:
  teen-teen milao, toh har bada group 24 ka 1/2 hai." s3 e2 `whyShort` (steady 70, circular): "1/4 wala tukda 1/6 wale se bada
  hai" → "4 tukdon wale pizza ke tukde kam, isliye bade". s3 worked (s72): problem "…doosri 6 mein. Dono poori chocolate ek jitni
  hain." → "…doosri 6 mein."; asked step "6 chhote tukde, bade tukdon par barabar rakhne hain. Unke kitne group banaoge?" → "6 wali
  ke saare tukde, 3 wali ke kitne tukde dhak denge?" (right: "Haan, teeno, kyunki dono chocolate ek jitni hain."). s2 worked own
  step (steady 58, "3 barabar group" twice): "Tumhari baari: socho, 15 pencil 3 barabar group mein baant rahe ho. Ek group mein
  kitni pencil aayengi?" → "Tumhari baari: ek group mein kitni pencil aayengi?".
- **c5-t01** `whyShort` s1 e1 (steady 12, stuck 10): "0 se 1 ke 3 gaps; 1/3 isi line par" → "line 3 gaps mein kati hai, toh 1/3
  yahin hai"; s3 e2 (steady 72): "har 2 gap se ek poora, toh 4 gap = 2" → "do gap ek poora hain, toh 4 gap 2 poore". s3 e2 point
  (steady 70 → 74, the giveaway): "…aur hum 6/4 par. Upar wala 6 neeche wale 4 se bada, toh 6/4 1 ke aage hai." → "…aur hum 6/4
  par." (its `simpler` "6 chauthai" → "Chhe chauthai"). s3 worked asked step (repeated e1's frame): "7/4 line par 1 se pehle
  aayega, ya 1 ke baad?" → "7/4 ek poore, yaani 1, se kam hai ya zyada?". s3 rem1 card: "Nayi line, 0 se 2: ek taraf … doosri
  taraf 10 mein." → "Nayi line 0 se 2 tak: upar har poora 5 gaps mein, neeche 10 mein." "km": no spoken line says it (017 made them
  all "kilometre"); "km" is left only in accept forms and `convey`. "line" against "patti": the captions (A.1).
- **c5-t02** S2 e3 point (the Mona card had little left): "…Zero se jitna door, utna bada. Neeche wala number same ho, toh upar
  wala batata hai kitne gap paar karne hain." → "…kati hai, har gap 1/5. Upar wala number batata hai ki zero se kitne gap chalna
  hai." Size of the missing part, taught in a point of each skill (S2 c2 and S3 c3 keep their cards): S2 e4 "…Neeche wale number
  alag, toh hisse alag size ke: 10 wali ke chhote, 3 wali ke bade." → "Do barabar patti hain: … 10 wali ke hisse chhote hain, 3
  wali ke bade, toh khaali hissa bhi 3 wali ka bada hota hai."; S3 e3 → "Ginti barabar ho, toh hisse ka size faisla karta hai:
  kam hisson wali patti ke hisse bade. Khaali hisse bhi aise hi: 5 wali ka ek khaali hissa, 9 wali ke khaali hisse se bada."
  Number-line points cut (steady 68, 70): S3 e2 → "Ab dono ek number line par hain: line ke upar 5 barabar gap, neeche 8. Dono mein
  teen-teen gap chalne hain, par 1/5 aur 1/8 ke gap ka size alag hai."; S3 e4 loses "Isi tarah upar ke har mark ko neeche ke gaps
  mein gin sakte ho." S2 e4 card (offtopic 52, the dangling "Par"): a `reask` "Ek patti ka 2/3 aur usi size ki doosri patti ka 3/10:
  bada kaun hai?". S3 worked asked step (premise gave it): "Dono ne 2-2 hisse khaye; ab faisla kaun karega, ginti ya hisse ka
  size?" → "Yahan faisla kaun karega: khaye hue hisson ki ginti, ya hisse ka size?"; its close's why (said the counts again):
  "dono ne 2 hisse khaye, par Isha ke 1/3 wale hisse…" → "kam hisson mein kati chocolate ke hisse bade hote hain, aur Isha ki
  chocolate 3 mein kati thi". S2 worked: the told step "Meena ne 1/8 wale 5 khaye, Raju ne 3" is gone (it left the own step
  nothing to do; steady 60, 78). "Toh poora jawab:" is the walk's, left.
- **c6** hook (fragment): "…woh pitch ka parimap hai. Ab triangle par." → "Cricket pitch ke kinaare kone se chalkar wahin lauto:
  yahi parimap hai. Isi tarah triangle ka bhi niklega." Openers on a change of figure (steady 48, 74; stuck 70; offtopic 44, 76;
  steering 50): s2 e3 "Square ki chaaron bhujayein…" → "Ab ek square lo: uski chaaron bhujayein…"; s3 e3 "Plot 12 m lamba, 8 m
  chauda hai, toh…" → "Ab ek plot: 12 m lamba, 8 m chauda, toh…" (and "Par neeche wali bhuja…" → "Neeche wali bhuja…"). s3 e1's
  card (offtopic 66): its `targets` (l-plus-b) is dropped, so the half-the-perimeter answer (30 m) takes the card's own hint
  ("Ulta socho: kaunsa number chaar baar jodne par 60 banta hai.") instead of the rectangle remediation and the talaab card; the
  misconception stays tested by s3 e2. The "aadha … usme se … bache" frame: kept once (s3 e2's why); s3 c3's why and short why
  → "aadhi dori, 35 cm, mein ek lambai aur ek chaudai hai; lambai 20 cm hai, toh chaudai 15 cm" / "aadhi dori 35 cm; lambai 20, toh
  chaudai 15 cm"; s3 rem0's card → "ek lambai aur ek chaudai milkar 45 m hain, aur lambai 28 m, toh chaudai 17 m" / "lambai aur
  chaudai milkar 45 m; chaudai 17 m". s1 worked asked step (the two-way near-giveaway): "Baad kin bhujaon par lagegi: sirf do par, ya
  teeno par?" → "Poori baad lagane ke liye kitni bhujaon ka naap jodna hoga?". Facts said twice in the worked closes (steady 26, 60,
  80): s1 answer "kyari par 31 m baad lagi, aur 4 m bachi" → "maali ke paas 4 m baad bachegi", its why → "maali ki baad kyari ke
  poore kinaare se 4 m lambi thi"; s2 step right "…: 24 cm aur 18 cm." → "Haan, ek lambai aur ek chaudai, yaani aadha chakkar."
  (the told step says 24 + 18 next); s3 right "Haan, ek chakkar ki doori pehle, kyunki teeno chakkar ek jaise hain.", its close's
  why "ek chakkar park ka parimap hai, 160 m, aur teen chakkar uske teen guna" → "Rani ne ek hi doori teen baar daudi".
- **All four, C.3** `wrap.ack` (steady 95–102 in every topic): "Har paath mein kuch naya hota hai." / "Kuch baatein aasaan thi, kuch
  mein mehnat lagi." / "Aaj humne milkar kaafi kuch dekha." → "Achha, tumne yeh bataya, mujhe achha laga." / "Theek hai, main yeh
  yaad rakhungi." / "Hmm, samajh gayi, batane ke liye shukriya." — each follows "achha laga", "mushkil tha" and "maine dobara check
  kiya" alike. The scripts author no separate line after the "how was it" answer: `wrap.ack` is that line (code's otherwise).
- **All four, C.4** `afterKeyReturn` (c5-t01 steering 16): "Aisa sawaal phir aayega; ab pichhle sawaal par wapas chalte hain." →
  "Aisa sawaal phir aayega; chalo, ab pichhle sawaal ko dekhte hain."; "Is par hum phir aayenge, abhi pehle wale sawaal par wapas
  chalo." (and its c5-t02/c6 variants) → "Is par hum phir aayenge; tab tak pehle wala sawaal saath mein dekhte hain." (c6: "Is tarah
  ka hisaab phir aayega; tab tak…"). The third form, the judges' model, is unchanged.

### New and changed keys, with the blind solve (problem and board alone)

| Script | Where | Key | Solve |
|---|---|---|---|
| c4 | s3 worked asked step (new question) | 3 | the two chocolates are the same size, so all 6 small pieces together cover the whole of the other: all 3 big pieces |
| c5-t01 | s3 worked asked step (was "after") | zyada | 1 = 4/4; 7 quarters > 4 quarters, so 7/4 is more than 1 |
| c6 | s1 worked asked step (was "teeno par") | teeno | the fence goes round the whole edge of a triangular bed: all 3 sides' lengths are added |
| c5-t02 | S3 worked asked step (question changed, key kept) | hisse ka size | 2/3 and 2/7: both counts are 2, so the size of a part decides |

Each `answerViewCaption` that names a key was checked against that key by the same solve (e.g. c6 s1 c1 9 + 6 + 7 + 4 = 26 m; s1
rem0 8 + 5 + 7 + 6 + 3 = 29 m; c5-t02 S3 rem2 5/6 is 1/6 short, 4/5 is 1/5 short, so 5/6 needs less juice).

### Tests

New: `tests/r8-learning-director29.test.mjs` (9 tests): the pilots pass `d30Errors`; the view kinds come from `pictureTurn`; a
caption naming the wrong kind of view fails (the c5-t02 stuck 18 caption put back; c6's unrolled line on a no-view board); a worked
caption naming an asked step's answer in words fails ("gaps", "ek chakkar", "paanch" as 5; c4's given 5 does not); `startAnyway`
three forms of six words or fewer and `afterPark`; every follow-up card and check with a second-view answer board has an
`answerViewCaption` (38) and none without; a remediation over 49 fails unless in `REM_WHOLE`. Repinned, each keeping its rule:
`r8-learning-director28` 017 A.3 (a pilot remediation fits 49 or is listed whole); `r7-learning-d13` D13.3 (the two gap-thinking
remediations are still one part short, in their new sentences).
Run: `node --test --test-concurrency=2 tests/r7-board-ref.test.mjs tests/r8-learning-*.test.mjs tests/r7-learning-*.test.mjs
tests/r8-picture-turn.test.mjs tests/r8-card-stated.test.mjs tests/r7-compile*.test.mjs`: 314 tests, 313 pass, 1 fails —
`r7-learning-kit-workflows` "the real plans build…", for a file absent from this sparse checkout
(`docs/research/census/2026-10-21-kits-english-only-forms.json`). `r8-picture-turn`'s view counts did not move (no board changed).
The compile report: no hole on the pilots; c5-t02's cell count falls by one step (the deleted told step); the fit table shows the
listed whole remediations (c5-t01 2, c5-t02 3). `docs/design/round7/brain/COMPILE-HOLES.md` was regenerated to check and left as it
was (Brain's file).

### For main

- **A.2 cannot catch c6's kind of giveaway by words.** The c6 s1 caption gave the step by listing all three sides end to end; no
  word of the key or its forms was in it. Fixed by hand; the checker only reads words and digits.
- **The A.1 rule allows the held board's kind** (the split keeps it up on the left), so a caption may name the held line and the
  drawn strip together, as the c5-t01 captions do. It would not catch a caption that describes only the held board while a view is
  drawn beside it.
- **C.2 the other way was not possible without reversing director22's park rule** in the checker; I left the rule and added the
  joint. If main prefers parks that lead back themselves, `asidePark`'s "nothing else" check has to go first.
- **A.3 on explain cards:** the order names follow-up cards and checks only. An explain card answered and then asked for a picture
  (c4 steering 14 was the Pinky follow-up card, but c5-t02 and c6's were too) gets no `answerViewCaption` from this patch.
- **Five remediations stand whole**, three of them in c5-t02 (skills 2 and 3). If director30 hears more than two alone in a
  steady lesson, the decision's clause re-reads the 60-word turn.

## Patch 019, Part 1 (2026-11-18, branch main/d31-learning)

Order: `docs/patches/to-learning/019-director30-pilots-list-and-first-three.md` (dc-r8-director30 items 2, 5's joint, 6). Done on the
four pilots, from `3fc4a673a`; commit `f43f12dd6`. The checker holds them to it (`d31Errors` in `scripts/lesson-scripts/check.mjs`);
`check.mjs <topic>` passes on all four; the compile report shows no new hole on the pilots (rows unchanged) and gains a Learning 019
table (cards without `hindi`, `afterWorked` missing, step wordings stating their answer: 0 / no / 0 on the pilots; every staged
script has all of its cards without a form).

### New script fields and joints (exact names; code reads them)

- `hindi` `{ hi, en }` beside `prompt` (inserted right after it) on every card the child answers: `explain[].ask`,
  `remediation[].then`, `checks[]`, `workedExample.steps[].ask`, `workedExample.yourStep`, `teachback`. The same question, givens
  and key in the Hindi a child of that class uses at home; one or two sentences ending on the question; the `en` is the gloss.
- `joints.afterWorked`: three forms, 6 words or fewer, no question, no number or slot — said between a worked example's close and the
  next card. The same three in all four: "Ab ek sawaal tum akele karo." / "Chalo, ab tumhari apni baari." / "Ab agla sawaal tumhare
  liye." (the checker's joint-kind list now allows it).
- `check.mjs <topic> --since <rev>`: `C` lines listing every point, card, remediation, worked example and worked step whose spoken
  text (or board) changed since `<rev>`, each with its board (`template params`) and a card's key, old → new. Exported as
  `changedParts(new, old)` / `sinceReport(new, old)` / `partsOf(s)`.
- `STANDARD_STAGED` (empty in Part 1): the staged scripts held to the pilots' standard (`isD29` reads it beside `D29_PILOTS`).

### Checker rules added (`d31Errors`, pilots and `STANDARD_STAGED`)

- A.1 `hindi` on every card above; 1–2 sentences ending on "?"; every number of the prompt's `hi` and no other (digits, fractions,
  ₹ amounts), the prompt's `{slots}` exactly; not the card's own words; no key or accepted form the prompt does not itself state
  (number words read as digits; a yes and a no offered together are a choice); no English connective or verb from
  `HINDI_FORM_ENGLISH` (and, or, what, which, how, many, equal, part(s), piece(s), colour, same, total, side, length, breadth, …;
  the school's words — fraction, line, rectangle, square, circle, the units — and the script's own nouns stay). `rhetoricalQuestionErrors`
  allows a question in a `hindi` field.
- A.2 `joints.afterWorked` as above.
- A.3 an asked step's `simpler` (and the step's `ask.simpler`, and the own step's `simpler`) never contains the step's key or an
  accepted form, in words or digits; a form the problem itself states is a given (`stepSimplerHits`).
- B the wrap: no `wrap.ack` form says "achha laga", and one form at most across `ack`, `ask` and `goodbye`; a card whose `accept`
  holds an equal fraction in other numbers (4/6 for 2/3; a mixed number for 11/6) names that form in its `why` (`equalForms`).

### Changed lines (old → new; the judge's row)

**c4**
- The two reasons heard as a wrong rule (steady 32, 90; stuck 52; offtopic 22; steering 42), and their two siblings of the same
  shape: s1 worked close why "…; khaye hue 3 tukde neeche wale number mein nahi jaate" → "5 barabar tukdon mein se 2 bache; neeche
  wala number 5 hai, saare tukde, khaye hue 3 nahi"; closing question why "…; bina rang ke 5 neeche wale number mein nahi jaate" →
  "neeche wala number circle ke saare 9 barabar tukde ginta hai, bina rang ke 5 nahi, aur upar wala rangin 4"; s1 own step whyAlt
  "khaye hue 3 tukde neeche nahi jaate; …" → "neeche wale number mein hamesha poori barfi ke saare tukde aate hain, yaani 5, khaye hue
  3 nahi; toh 2/5"; s1 part-part card why "…; bache hue 2 neeche wala number nahi" → "4 barabar tukdon mein se 2 khaye, toh 2/4;
  neeche wala number saare 4 tukde ginta hai, bache hue 2 nahi"; s2 part-part card why "…; bache hue 5 neeche wale number mein nahi
  jaate" → "6 barabar thailon mein se diya hua thaila 1/6 hai; neeche wala number saare 6 thaile ginta hai, bache 5 nahi".
- The shading that means left over (s26, k38, o18, r36): s1 worked problem + "Is baar rangin tukde woh hain jo plate par bache."
- Help for "2/1" and "4/1" (steering 30, 32; offtopic 64): the s1 e3 card's first help now says where each count goes — "Pehle gino
  ki circle ke kul kitne tukde hain: yeh ginti neeche wala number hai. Phir socho, ek aur tukda rangne ke baad kitne rangin honge: woh
  ginti upar wala number."; its point's other wording (the notes "Seedhi baat: … neeche 3, upar 1.") → "Circle ke 3 barabar tukde
  hain aur ek mein rang hai, isliye rangin tukda 1/3 hai. Neeche wala number saare tukde ginta hai, rangin bhi aur bina rang ke bhi,
  aur upar wala sirf rangin." (see For main: the kit has no upside-down mix-up for a remediation to name it).
- Notes (clause 14): s2 e1 point "Jaanch: dono ke laddoo jodo, toh saare 12 wapas." → "Dono ke laddoo jodkar dekho, toh saare 12
  wapas mil jaate hain."; s2 e3 point "Group ka size pata ho, toh aise group gino: wahi ginti neeche wala number hai." → "Group mein
  kitne hain, yeh pata ho, toh group gino: wahi neeche wala number." (and its pointAlt's "Dher ka size pata ho, toh dher gino" →
  "Jab pata ho ki ek dher mein kitne rupaye hain, toh gino ki kitne dher bante hain").
- s3 worked (s72–76): asked step "6 wali ke saare tukde, 3 wali ke kitne tukde dhak denge?" (near-given) → "6 wali ke tukde 3 wali
  par barabar rakhne hain: jodoge ya baantoge?" (key "baantenge"; right "Haan, baantenge: 6 tukde 3 bade tukdon par barabar bat-te
  hain."; told "6 chhote tukde 3 bade tukdon par barabar rakhne hain: baant kar, har bade tukde par barabar"); the close that answered
  a question nobody asked, answer "1/3 wala tukda bada hai, aur us par 1/6 wale 2 tukde aate hain" → "3 wali ke ek tukde par 6 wali
  ke 2 tukde aate hain" (its why keeps the skill's point). Own step unchanged (key 2).
- A.3: s1 step "Khaane se pehle wali poori barfi socho: uske saare tukde gino." → "Khaane se pehle wali poori barfi yaad karo, jab ek
  bhi tukda khaya nahi gaya tha. Neeche wala number usi barfi ki baat karta hai."; s2 step "Socho 3 dost hain …" → "Socho, 1/3 ka
  neeche wala number kya batata hai: pencil kitne doston ko barabar milengi."

**c5-t01**
- s3 asked step (steady 74: answered by the e2 point, e1's frame) "7/4 ek poore, yaani 1, se kam hai ya zyada?" → "7/4 kahan aayega:
  1 aur 2 ke beech, ya 2 ke baad?" (key "1 aur 2 ke beech"; right "Haan, 1 aur 2 ke beech, kyunki 2 tak 8 gap lagte hain."; told
  "Dekho, 2 tak kitne gap lagte hain: 1 aur 2 ke beech: 7 gap, 8 se kam"); "4 gap = 1" three times (steady 76–78): the close's why
  "pehle 4 gap se 1 poora hua, aur baaki 3 gap 1 ke aage gaye" → "1 ke baad 3 gap aur chalne the"; the worked caption's "0, 1 aur 2"
  (now an accepted form) → "0, 1, 2 jaise poore number".
- s1 rem[2] `sayAlt` (steady 8, steering 10) "Seedhi baat: khilona ek hi jagah ruka, … 1/7 kilometre hai." → "Socho, ruler par 0
  ke baad pehli lakeer ek pakki jagah hai, aur uska ek number hai. Sadak par khilona bhi ek pakki jagah ruka, isliye us jagah ka number
  1/7 kilometre hai."
- s1 e3 `pointAlt`, heard as agreeing with "1/8" (offtopic 42) "…isliye pehla mark, 1/8, pehle se 0 ke zyada paas aata hai." → "Do ek
  jaisi roti socho: ek 4 barabar hisson mein kati, ek 6 mein, toh 6 wali ka har hissa patla hai. Line par bhi gap jitne zyada, har gap
  utna chhota, aur pehla mark utna hi 0 ke paas."
- "upar / neeche" (steady 84): one meaning each — "line ke upar / line ke neeche" for the board's two scales, "upar / neeche wala
  number" for a fraction's two numbers; no bare "upar"/"neeche" left in either sense: s3 rem not-numbers "…upar woh gaps jo train chali,
  aur neeche 5." → "…upar wala number woh gaps hain jo train chali, aur neeche wala number 5."; s2 rem whole-number-bias "Upar har gap
  1/3 hai, neeche 1/6: upar wala do guna lamba hai. …" → "Line ke upar har gap 1/3 hai, line ke neeche usse aadha, 1/6. 2 lambe gap 2/3
  par rukte hain, 2 chhote 2/6 par."; s3 rem whole-number-bias card "upar har poora 5 gaps mein, neeche 10 mein" → "line ke upar …,
  line ke neeche …"; s3 rem all-less-than-one card "Neeche har poora …" → "Line ke neeche har poora …"; s1 rem not-numbers card
  "Khilona neeche pehle mark par" → "Khilona wahan pehle mark par"; s1 e3 card simpler; teachback simpler "wahi ginti neeche jaati
  hai" → "wahi ginti neeche wala number hai".
- Verdict whys that do not link an equal answer (steady 56, 82, 88): s2 c1 "…yaani 4/6" → "…: 4/6, jo 2/3 ke barabar hai"; s3 rem
  cards and checks gain the mixed form ("7/6, yaani 1 aur 1/6"; "9/5, yaani 1 aur 4/5"; "8/5, jo 1 aur 3/5 hai"; "11/6, yaani 1 aur
  5/6, 11/12 se aage hai"; "12/5, yaani 2 aur 2/5"; teachback "9/7 …, yaani 1 aur 2/7").
- A.3: s1 step "Ghar se pehle khambe tak chalo: tum ek gap chale, …" → "Ghar se pehle khambe tak chalkar socho: tumhare pair kis
  cheez par chale, aur khamba kahan khada raha."; s2 step "Neeche wala number batata hai … yahan woh 5 hai." → "2/5 ke dono numbers mein
  se socho: kaunsa poore ke baare mein batata hai, aur kaunsa chalne ke baare mein."
- "X nahi, yeh jawab theek nahi baitha" is code (`server/brain/say.js` ECHO_NOT_RIGHT), not a script line: For main.

**c5-t02**
- S3 e3 point, the failing row (steady 74) "Ginti barabar ho, toh hisse ka size faisla karta hai: kam hisson wali patti ke hisse bade.
  Khaali hisse bhi aise hi: 5 wali ka ek khaali hissa, 9 wali ke khaali hisse se bada." → "Ginti barabar ho, toh hisse ka size faisla
  karta hai. 3/5 mein 1/5 wale hisse hain, jo 1/8 wale se bade hain. Khaali hissa bhi aisa hi: jo kam hisson mein kata ho, uska khaali
  hissa bada." (speaks of its compare board, 3/5 and 3/8; names no strip and no 9; does not state 2/5 against 2/9).
- Comparing with a half, used by S2 e4's card and c1, now taught in S2 e4's point: "Do barabar patti hain, ek 3 hisson mein aur ek 10
  mein. 10 wali ke hisse chhote hain, toh khaali hissa 3 wali ka bada hai. Aadhe se bhi milao: jo aadhe se aage, woh bada." (no number
  of the card's; true of its two bars).
- Remediations that ended without their conclusion: S2 gap-thinking (offtopic 82) "…Pehli ka aadha khaali hai, doosri ka bas 1/7." →
  "Pehli patti mein 2 mein se 1 hissa rangin hai, doosri mein 7 mein se 6. Pehli ka aadha khaali hai, aur doosri ka bas 1/7, isliye
  doosri mein rang zyada hai." (said whole, below); S3 bigger-denominator (steady 86) "Ek rassi 2 hisson mein kati, aur waisi hi
  doosri 8 mein. 2 wali ke ek hisse mein 8 wali ke chaar aate hain." → "Do ek jaisi rassi: 2 hisson wali ke ek hisse mein, 8 hisson
  wali ke chaar aate hain, isliye 8 wala hissa chhota hai." (fits 49).
- "Isha ki chocolate 3 mein kati" twice running (steady 80, 82): the close's why "…, aur Isha ki chocolate 3 mein kati thi" → "kam
  hisson mein kati chocolate ke hisse bade hote hain, isliye Isha ke 2 hisse zyada hain".
- A.3: S1 step (stuck 20, offtopic 16) "Ek patti kam logon mein bate ya zyada mein: kam logon wala hissa bada hota hai." → "Socho, do
  ek jaisi patti hain: ek do logon mein bati, ek das logon mein. Kis baant mein har ek ko bada hissa milega, bas yeh socho."

**c6**
- The re-ask at stuck 48 needed the 140 cm: the card's last question now carries it — "Tumhare paas 140 cm ribbon hai. 14 cm lambe,
  9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?" → "14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon
  lagana hai. Tumhare 140 cm ribbon mein se kitna bachega?" (the short ask after help about the aangan is the walk's, Brain 046 Q5).
- The s1 asked step (thin) "Poori baad lagane ke liye kitni bhujaon ka naap jodna hoga?" (key teeno) → "Kitni baad bachegi, yeh jaanne se
  pehle kya nikaalna hoga?" (key "kyari ka parimap"; right "Haan, kyari ka parimap, yaani teeno bhujaon ka jod."; told "Pehle kyari ke
  poore kinaare ki lambai chahiye: kyari ka parimap, teeno bhujaon ka jod, kyunki baad kinaare par hi lagti hai").
- A.3 (stuck 20, offtopic 16, 52): s1 step "Socho baad ki jaali teen roll mein aayi hai … teeno roll milakar banti hai." → "Socho, maali
  ko kaise pata chalega ki baad kam padegi ya bachegi. Use pehle yeh jaanna hoga ki kyari ko gherne mein kitni baad lagegi."; s2 step
  "Tape ek kone se chalao: pehle lambi bhuja, phir mud ke chhoti bhuja. …" → "Tape ek kone se saamne wale kone tak chalao, aur dekho
  raaste mein kaun si bhujayein aati hain." (its asked step now also accepts "lambi aur chhoti bhuja", "ek lambi aur ek chhoti bhuja",
  "ek lambi ek chhoti"); s3 step "…Toh ek chakkar mein har bhuja ek baar aati hai." → "Rani har chakkar mein park ke poore kinaare par
  daudti hai, aur teeno baar wahi raasta hai. Socho, kaunsi doori teen baar judegi."

**All four:** `wrap.ack` "Achha, tumne yeh bataya, mujhe achha laga." / "Achha, yeh jaankar achha laga." → "Achha, tumne dil se
bataya." / "Theek hai, main yeh yaad rakhungi." (the third, "Hmm, samajh gayi, batane ke liye shukriya.", kept). "achha laga" is left
only in `wrap.ask[1]` ("Aaj ki padhai mein kuch aisa tha jo achha laga?"), once.

### `hindi` forms: count per script, five examples each (card → form)

c4 30, c5-t01 34, c5-t02 34, c6 30 (128).
- c4: s1 e1 "Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?" → "Roti ke ek tukde mein rang hai,
  doosre mein nahi. Rang wala tukda poori roti ka kaunsa fraction hai?"; s1 c2 → "Tumhari chocolate mein 12 barabar tukde hain, aur
  tumne 1/12 kha liya. Ab kitne tukde bache hain?"; s2 e1 "12 laddoo ka aadha kitne laddoo hai?" → "12 laddoo ko aadha karo, toh kitne
  laddoo bante hain?"; s2 rem part-part card → "30 kele 6 thailon mein barabar bhare gaye, aur 1 thaila kisi ko de diya. Jo thaila de
  diya, woh saare kelon ka 1/5 hai ya 1/6?"; s3 own step → "Ab tum batao: 3 tukdon wali chocolate ke ek tukde ke upar, 6 tukdon wali
  ke kitne tukde aayenge?"
- c5-t01: s1 e3 → "Line ke neeche wahi 0 se 1 hai, 10 barabar gaps mein kata hua. 1/8 aur 1/10 mein se kaun 0 ke zyada paas rukega?";
  s1 rem count-marks card → "Maan lo wahi ribbon 12 barabar gaps mein kaatna hai. Beech mein chalk ke kitne marks lagane padenge?";
  s2 asked step → "2/5 ke dono numbers mein se kaun batata hai ki line kitne barabar gaps mein kategi?"; s3 c2 → "Line 0 se 2 tak hai:
  ek baar 1/6 wale 11 gap chalo, ek baar 1/12 wale 11 gap. 11/6 aur 11/12 mein se 0 se zyada door kaun gaya?"; teachback → "Ek line 0
  se 2 tak hai, jismein 0 aur 1 ke beech 6 marks hain aur 1 aur 2 ke beech bhi 6, sab barabar doori par. 0 se 9 gap chaloge, toh kis
  fraction par pahunchoge?"
- c5-t02: S1 e1 → "Doosri patti bhi utni hi lambi hai, par 8 barabar hisson mein kati hai. Uska ek hissa pehli patti ke ek hisse se
  bada hai ya chhota?"; S1 asked step → "Dono ko ek-ek hissa mila. Bada hissa kiska hoga, jiski chocolate kam hisson mein kati, ya jiski
  zyada mein?"; S2 e4 → "Ek patti ka 2/3 lo, aur utni hi badi doosri patti ka 3/10; 3/10 mein hisse zyada hain. Par 2/3 aur 3/10 mein
  bada kaun hai?"; S2 rem same-bottom card → "Do ek jaise ribbon hain, dono 7 barabar hisson mein kate. Neha ne ek se 3 hisse liye aur
  Gopi ne doosre se 6, toh Neha ka ribbon zyada hai ya kam?"; S3 c3 → "Do bilkul ek jaise pizza hain; ek ke 7 barabar hisson mein se 6
  bache aur doosre ke 9 mein se 8, yaani dono mein bas ek-ek hissa kam hai. 6/7 aur 8/9 mein poore pizza ke zyada paas kaun hai?"
- c6: s1 rem missing-sides card → "Ek khet PQRST hai, jiski bhujayein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hain. Uska poora
  kinaara kitne metre lamba hai?"; s1 rem area-perimeter card → "Ek sticker 14 cm lamba aur 9 cm chauda hai, uske kinaare-kinaare
  ribbon lagana hai. Tumhare paas 140 cm ribbon hai, usmein se kitna bachega?"; s2 e2 "Is rectangle ke liye 2 × (lambai + chaudai)
  kitna banta hai?" → "Is rectangle mein lambai aur chaudai jodo, phir 2 se guna karo: kitna aata hai?"; s2 c2 → "Laal card 16 cm lamba
  aur 9 cm chauda hai, neela card 20 cm lamba aur 6 cm chauda, aur dono ke poore kinaare par sunehri border lagani hai. Kiski border
  lambi hogi, laal ki ya neele ki?"; s3 c2 → "Ek rectangle khet 30 m lamba aur 20 m chauda hai, aur taar ₹15 ki ek metre milti hai. Khet
  ke chaaron taraf ek baar taar lagane mein kitne rupaye lagenge?"

### Remediations left whole

One added: c5-t02 S2 gap-thinking (49 → 51 with its conclusion and the counts that keep its board drawn; a shorter say without the
counts fails "its own board is not taken under its words"). `REM_WHOLE` now lists six (c5-t01 2, c5-t02 4). c5-t02 skill 2 now has
all three of its remediations said alone: For main.

### New and changed keys, with the blind solve (problem and board alone)

| Script | Where | Key | Solve |
|---|---|---|---|
| c4 | s3 worked asked step (new question) | baantenge | 6 equal pieces go equally onto 3 pieces: equal sharing among 3 is division (6 ÷ 3), not adding; the own step's 2 follows |
| c5-t01 | s3 worked asked step (new question) | 1 aur 2 ke beech | 4 gaps a whole: 1 = 4/4, 2 = 8/4; 4 < 7 < 8 |
| c6 | s1 worked asked step (new question) | kyari ka parimap | the fence left is 35 m less the fence used, and the fence used is the bed's edge, 8 + 9 + 14 = 31 m: the perimeter first |
| c6 | s2 worked asked step (accept forms added) | ek lambai aur ek chaudai | corner to opposite corner of a 24 × 18 rectangle is one long side and one short side |

Every other key is unchanged. Each new `hindi` form was read against its card's key: the same givens, nothing stated that the card
does not state (the checker confirms numbers, slots and the key's forms).

### The `--since` read

After the edits I ran the new list against `3fc4a673a` on all four (`check.mjs <topic> --since 3fc4a673a`; 38, 42, 40 and 33 parts,
most only for the new `hindi`) and read every part whose spoken text changed other than its `hindi` — 14 in c4, 18 in c5-t01, 6 in
c5-t02, 5 in c6 — against its board and its card by hand. Two were wrong and are fixed: c5-t01's s3 worked caption ("poore number line
ke neeche", heard as "the whole number line") → "0, 1, 2 jaise poore number line ke neeche"; c5-t02's S3 e3 point said "kam hisson
wali patti" over a compare board that draws no strip → "jo kam hisson mein kata ho". Every other sentence is true of its own board
and states no answer of its own card.

### Tests

New: `tests/r8-learning-director30.test.mjs` (10 tests): the pilots pass `d31Errors`; a `hindi` form on every kind of card; numbers,
slots and the key's forms (director30's "Neha ke paas kam" put back fails); English words and the card's own words; `afterWorked`;
A.3 on director30's own rows put back (c5-t02 S1 "kam", c6 s1 "teeno"; c6 s2's laid-out sides are not caught by words — see For main);
the wrap's "achha laga"; equal forms (c5-t01's 4/6 why put back); `--since` (c5-t02's failing sentence put back is the one listed, over
compare@1). Repinned, keeping its rule: `r7-learning-d13` D13.3 (c5-t02's S2 gap remediation is still one part short, now with its
conclusion). Run: `node --test --test-concurrency=2 tests/r7-board-ref.test.mjs tests/r8-learning-*.test.mjs tests/r7-learning-*.test.mjs
tests/r8-picture-turn.test.mjs tests/r8-card-stated.test.mjs tests/r7-compile*.test.mjs`: 324 tests, 323 pass after the repin, 1 fails —
`r7-learning-kit-workflows` "the real plans build…", for the file absent from this sparse checkout
(`docs/research/census/2026-10-21-kits-english-only-forms.json`).

### For main

- **The upside-down fraction has no mix-up in the kit** (c4's misconceptions are part-part, unequal-parts, bigger-denominator), so no
  remediation can be routed to it. What the script can do is done: the s1 e3 card's first help says which count goes where; its
  `wrongIfMis` "2/1" still routes to part-part, whose wording names "all the pieces at the bottom". s2 e3 (key 1/4, no `targets`) keeps
  its help; a "4/1" there gets the card's hints. Naming "the numbers are the wrong way round" needs a kit mix-up (and its remediation)
  or a per-wrong-answer field the walk reads.
- **"X nahi, yeh jawab theek nahi baitha"** is `server/brain/say.js` ECHO_NOT_RIGHT (code), not a script line: Brain's.
- **A.3 by words misses c6 s2's kind** (the sides laid out in order, no accepted form word for word). Rewritten by hand; the accept
  forms "lambi aur chhoti bhuja" were added so a wording that says them is caught.
- **c5-t02 skill 2 now has three remediations said alone** (same-bottom-equal, tops-only, gap-thinking). The judge's dead spot was "a
  remediation followed by 'Yahan tak saaf hai?'"; the third one is the price of its conclusion. Clause 21 is closest here.
- **`tests/fixtures/t2-predicates.mjs` and `r7-brain-v69`** recognise "yeh jaankar achha laga" as an acknowledgement; the new acks
  ("Achha, tumne dil se bataya.", "Theek hai, main yeh yaad rakhungi.") are not in their lists, if a dry-matrix predicate counts them.
- The new asked steps (c4 s3, c5-t01 s3, c6 s1) are not yet heard by a judge.
