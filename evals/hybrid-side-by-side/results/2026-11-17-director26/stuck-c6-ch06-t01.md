# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1865 ms]: Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge. Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. Ab tak samajh aaya?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2474 ms · guard mustsay]: Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1662 ms]: Ungli har bhuja par chali, toh teeno lambaiyan judengi: 4, 5 aur 6. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1724 ms]: Haan, ise aur aasaan karke samjhaati hoon. Socho is triangle ka kinaara ek dhaage se bana hai. Ek kone se dhaaga khol ke seedha kar do: 4 cm, phir 5 cm, phir 6 cm, sab ek line mein. Us seedhi line ki poori lambai hi parimap hai. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2377 ms · guard screenmismatch]: Sahi jawab, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2388 ms]: Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1983 ms]: Har bhuja 5 cm ki hai, aur hexagon ki bhujayein chhah hain. In dono baaton ko milakar socho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** mujhe lagta hai 30 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1533 ms · guard mustsay,screenmismatch]: Haan, sahi hai: chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bagal ki bhuja 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 3010 ms · guard level]: Rectangle ka kinaara ek dhaage ki tarah khul gaya hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah is line mein nahi aati. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3639 ms · guard long,uncorrected]: 24 cm sahi nahi hai. Aao, isko ek naye dhang se dekhein. Kinaare par dhaaga lapeto, phir kholke scale par rakho: woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2128 ms]: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2398 ms]: Ribbon andar nahi jaata. Pehle dekho kinaare par kitna lagega, phir use 140 mein se ghatao. 140 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 14 cm  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1828 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 94 cm hai, kyunki kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2343 ms]: 14 do baar 28 aur 9 do baar 18, toh kinaare par 46 cm; 140 mein se pehle 40 hatao toh 100, phir 6 aur hatao toh 94 cm. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 1804 ms]: Koi baat nahi, parimap ke aise sawaal aage phir aayenge; abhi aage badhte hain. Achha, ab pehle wale sawaal ko phir se dekhte hain. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 2564 ms]: Haan, pehle tum try karo.
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 centimetres  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 929 ms · guard noconfirm]: Sahi jawab, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4216 ms · guard quiz]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehla kadam dekho. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Yeh kadam saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** yeh step samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3873 ms · guard quiz]: Socho baad ki jaali teen roll mein aayi hai: ek 7 m, ek 9 m, ek 12 m. Har bhuja par ek roll khulta hai, toh poori baad teeno roll milakar banti hai. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 8309 ms · guard script]: Socho tum kyari ke ek kone par khade ho. 7 m chalo, mudo, 9 m chalo, mudo, phir 12 m chal ke wahin pahunch jao. Baad utni hi lambi chahiye jitna tum chale, toh wahi doori nikalni hai. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2166 ms · guard invented]: Ek chhoti cheez se socho: rumaal ke chaaron taraf lace lagani ho, toh lace har bhuja par lagti hai, aur kul lace un sab bhujaon ka jod hoti hai. Kyari ki baad bhi aisi hi hai, bas bhujayein teen hain. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3711 ms · guard long]: Theek hai, is par hum dobara saath mein aayenge; ab agli baat. Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2071 ms]: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2224 ms · guard screenmismatch]: Sahi jawab. Dekho, baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m lambi baad. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2286 ms]: 16 mein pehle 4 jodo toh 20, phir bache 8 jodo toh 28 m; 12 ka koi hissa chhoota nahi. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2796 ms]: Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3096 ms · guard long]: Oh, chauka. Achha. Ab wahin wapas aate hain jahan hum the. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 22 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 3145 ms · guard flat]: 22 m sahi nahi hai. Ise ek alag tareeke se dekhte hain. Ab ek khet socho, kone P, Q, R, S, T. P par ungli rakho aur har bhuja ka naam lo jaise-jaise uski lambai jodte ho. Ek bhi bhuja chhooti toh jod adhoora. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2215 ms]: Ek chowkidaar raat ko khet ke kinaare ghoomta hai aur har kone par seeti bajata hai. Jab tak woh pehle kone par lautke seeti na bajaye, chakkar poora nahi, aur beech ki har bhuja uski doori mein judti hai. Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (1 miss) · board up · ready 3401 ms · guard flat,uncorrected]: 26 m nahi, yeh jawab theek nahi baitha. P se shuru karo aur PQ, QR, RS, ST, TP bolte jao. TP ke baad tum wapas P par ho. 8 m, 5 m, 7 m, 6 m aur 3 m bhujaon wale khet PQRST ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2101 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 29 m hai, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 2346 ms]: Theek hai, ab wapas usi sawaal par chalte hain. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 26 metre  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1294 ms]: Sahi jawab. Dekho, chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 1806 ms · guard uncorrected]: 40 cm se baat nahi bani. Guna andar ki jagah ginta hai, kinaara nahi. Do baar 10, do baar 4. 10 cm lambe, 4 cm chaude card ka sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2555 ms · guard flat]: Haan, sahi hai: parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 3320 ms · guard wrap]: Riya, theek hai—tum rukna chahti ho. Chun lo: aage badhein, thodi der pause lein, ya aaj ke liye padhai rok dein?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

## Agent


