# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj rectangles, squares aur polygons ka perimeter padhenge—cricket ground ki boundary jaisa. Tumhe cricket mein batting pasand hai ya bowling?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2616 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 7543 ms · guard screen,mustsay]: Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Toh ungli kul kitne cm chali?
  > card: Toh ungli kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetre  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1770 ms · guard noconfirm]: Haan, sahi hai, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e1 · board up · ready 2424 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 3027 ms · guard mustsay]: Theek hai. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2370 ms · guard mustsay]: Bilkul sahi, kyunki chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, side mein 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** bees cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2585 ms]: Haan, bilkul theek. Dekho, dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4262 ms · guard invented,long]: Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Yeh kadam saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 5329 ms]: Main AI hoon, meri koi pasand nahi hoti. Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2194 ms]: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 4209 ms · guard flat,uncorrected]: 16 m sahi nahi hai. Is khet ke kone P, Q, R, S, T hain. P par ungli rakho aur har bhuja ka naam lo jaise uski lambai jodte ho. Aksar aakhri bhuja chhootti hai. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2587 ms]: Phir se dekho: Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > card: Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 4097 ms · guard flat]: P se shuru karo aur PQ, QR, RS, ST, TP bolte jao. TP ke baad tum wapas P par ho. Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > card: Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2399 ms]: Is aakaar ki 5 bhujayein seedhi karke ek line par: 8 m, 5 m, 7 m, 6 m, 3 m. Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > card: Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 metres  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 1632 ms]: Haan, sahi hai, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 2618 ms]: Theek hai, ab Hindi mein kinaara naapte hain. 12 ko 16 ke neeche likho, ikaai ke neeche ikaai. Pehle ikaai jodo, phir dahaai. Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m hai na  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 3784 ms · guard nowhy,flat]: Bilkul sahi. Dekho, baad ko teeno kinaaron par chalna hai, ek bhi bhuja chhoot nahi sakti.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:worked:worked · board up · ready 3259 ms]: Achha, cricket wali baat yaad rakhti hoon. Pehle yeh kinaara naap lete hain. Pehle yeh kinaara naap lete hain.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 5599 ms · guard ask]: Achha. Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2914 ms]: Haan, pehle tum try karo — Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 23 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 3701 ms · guard flat,uncorrected]: 23 m sahi nahi hai. Pehle 8 aur 3, phir usme 5, phir 4. Aise hi aakhri 7 tak jodte jao. Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 30 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 4402 ms · guard ask]: Haan, sahi hai, kyunki chhahon bhujayein judti hain: 8 + 3 + 5 + 4 + 3 + 7 = 30 m. Uske baare mein thoda aur batao. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7],"trace":true}}

**child:** 28 cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 3115 ms]: Bilkul sahi. Dekho, lace kinaare par chalti hai: 10 + 4 + 10 + 4 = 28 cm. Har bhuja jodna hamesha chalta hai. Ab is aayat ko dekho: iski bhujayein jodiyon mein aati hain, aur wahin se ek chhota raasta milta hai.
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2334 ms]: Is aayat mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. Board par 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2663 ms]: Phir se dekho: Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 metre  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 1499 ms · guard noconfirm]: Haan, bilkul theek, kyunki 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m.
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 3513 ms · guard ask]: Achha. Naya aayat: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum bilkul saamne wale kone par ho, yaani aadha raasta. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Ab 2 × (lambai + chaudai) lagao. Is aayat ka parimap kitna hai?
  > card: Ab 2 × (lambai + chaudai) lagao. Is aayat ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2652 ms · guard uncorrected]: 17 m sahi nahi hai. Cheenti kone se chalti hai, saath mein meter. 19 m lambai chali, meter 19. Phir 8 m chaudai: ab woh saamne wale kone par hai, bas aadha raasta. Lambai + chaudai yahin tak hai. Ghar abhi do bhujayein door hai. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2819 ms]: Ek baar aur dekho: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 54 m hai na  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 6017 ms · guard ask]: Haan, sahi hai, kyunki do lambai aur do chaudai: 2 × (19 + 8) = 54 m. Ab 2 × (lambai + chaudai) lagao. Is aayat ka parimap kitna hai?
  > card: Ab 2 × (lambai + chaudai) lagao. Is aayat ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** mujhe lagta hai 34 m  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 2673 ms]: Bilkul sahi. Dekho, aadha raasta 12 + 5 = 17 m, aur do baar: 2 × 17 = 34 m.
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 4488 ms · guard mustsay,ask]: Achha. Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh cm mein aayega, square cm mein nahi. Is varg ka parimap kitna hua?
  > card: Is varg ka parimap kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 36 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2244 ms]: 36 cm sahi nahi hai. Yeh aayat 11 cm lamba, 2 cm chauda hai. Andar 1 cm wale tiles bichhao toh woh area hai, varg cm mein. Dhaaga kinaare par chalta hai, toh chaaron kinaare jodo, aur jawab cm mein. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3631 ms]: Guna karne se tiles gini jaati hain, dhaaga nahi. Dhaage ke liye jodna padta hai. Ek bookmark 11 cm lamba aur 2 cm chauda hai. Kinaare par ek baar dhaaga lagta hai. Dhaaga kitna lamba hai?
  > card: Ek bookmark 11 cm lamba aur 2 cm chauda hai. Kinaare par ek baar dhaaga lagta hai. Dhaaga kitna lamba hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":11,"h":2}}

**child:** 26  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 (1 miss) · board up · ready 3056 ms · guard ask]: Haan, sahi hai, kyunki dhaaga kinaare par chalta hai: 11 + 2 + 11 + 2 = 26 cm. Is varg ka parimap kitna hua?
  > card: Is varg ka parimap kitna hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":2,"mode":"perimeter","unit":"cm"}}

**child:** 24 cm  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 2150 ms]: Bilkul sahi. Dekho, chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, lambai hai isliye cm. Ek notebook ka cover aayat hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Kitni tape lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · ready 6206 ms · guard wrap,nochoice,wrap]: Theek hai Riya, tum thak gayi ho—main samajh gayi. Tum chun sakti ho: aage badhna, chhota sa break lena, ya aaj ke liye rok dena.

## Agent


