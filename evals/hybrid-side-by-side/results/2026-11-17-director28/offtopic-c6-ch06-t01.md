# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2245 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare pitch ghoomkar wahin lauto. Jitna chale, utna pitch ka parimap hai. Yahi chakkar ab ek triangle par. Ab tak samajh aaya?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 918 ms]: Koi baat nahi, ise doosre, aasaan shabdon mein bolti hoon. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 1514 ms]: 9 cm sahi nahi hai. Ek doosri tarah se samajhte hain. Ab ek khet socho, kone P, Q, R, S, T. P par ungli rakho aur har bhuja ka naam lo jaise-jaise uski lambai jodte ho. Ek bhi bhuja chhooti toh jod adhoora. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1777 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"pentagon","names":["P","Q","R","S","T"]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1980 ms · guard long]: Achha, toh tumhe chauka sabse achha lagta hai. Ab wapas apne kaam par. Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"pentagon","names":["P","Q","R","S","T"]}}

**child:** 29 m  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (1 miss) · board up · ready 983 ms]: Sahi jawab, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Theek hai, ab wapas usi sawaal par chalte hain. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** mujhe lagta hai 15 cm  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1589 ms · guard screenmismatch]: Haan, sahi hai. Dekho, 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Hexagon ki kitni bhujaon par label likha hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** ek par  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1864 ms · guard affirms]: Bilkul sahi. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (1 miss) · board up · ready 2674 ms · guard uncorrected]: 5 cm sahi nahi hai. Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (2 miss) · board up · ready 1758 ms · guard uncorrected]: 5 cm nahi, yeh jawab theek nahi baitha. Shahad ke chhatte ka ek khaana dekho: uski chhah bhujayein hoti hain, sab ek jaisi. Yahan ek bhuja par 5 cm likha hai, toh baaki paanch bhi 5 cm ki hain. Parimap ke liye chhahon bhujayein ginni hain, sirf likhi hui nahi. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1250 ms · guard mustsay,screenmismatch]: Sahi jawab, kyunki chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Dhaaga kahan chalta hai, kinaare par ya andar?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1560 ms]: Dhaaga kinaare par chalta hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2830 ms]: Rectangle ka kinaara ek dhaage ki tarah khul gaya hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah is line mein nahi aati. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 centimetre  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1202 ms]: Haan, sahi hai, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Kadam-kadam karke, agla sawaal milkar hal karein?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 3474 ms · guard screenmismatch]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Yahan tak theek hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 3257 ms]: Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 2001 ms]: Achha, toh tumhara favourite hai Virat. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 1923 ms · guard screenmismatch]: Ab ek sawaal milkar, kadam-kadam hal karte hain. Phoolon ki ek kyari triangle jaisi hai, bhujayein 7 m, 9 m aur 12 m. Uske kinaare-kinaare ek baar baad lagani hai. Dekhte hain, kitni lambi baad lagegi. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Pehle 7 aur 9 jodo: kitne metre hue?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2219 ms]: Haan, pehle tum try karo. Yeh raha sawaal. Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m hai na  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1861 ms]: Sahi jawab. Dekho, baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m lambi baad. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1615 ms]: 16 mein pehle 4 jodo toh 20, phir bache 8 jodo toh 28 m; 12 mein se kuch nahi chhoota. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2466 ms · guard screenmismatch]: 16 m mein abhi sirf do bhujayein hain, 7 m aur 9 m. Teesri bhuja 12 m bhi kinaare par hai, use bhi jodna hai. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2138 ms]: Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3162 ms · guard long]: Achha, toh tumhe batting sabse achha lagta hai. Theek hai, ab phir se kaam par aate hain. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 26 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 903 ms]: Sahi jawab, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3008 ms · guard flat,uncorrected]: 40 cm sahi nahi hai. Aao, isko ek naye dhang se dekhein. Socho, ek rectangle ke kinaare par dhaaga lapeta, phir khol ke scale par rakha: woh lambai parimap hai, centimetre mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2568 ms]: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 14 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 1969 ms · guard uncorrected]: 14 cm nahi, yeh jawab theek nahi baitha. Ribbon andar nahi jaata. Pehle dekho kinaare par kitna lagega, phir use 140 mein se ghatao. 140 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 14 cm  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1603 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 94 cm hai, kyunki kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3871 ms · guard praise,affirms]: 14 do baar 28 aur 9 do baar 18, toh kinaare par 46 cm; 140 mein se pehle 40 hatao toh 100, phir 6 aur hatao toh 94 cm. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 2045 ms]: Aisa sawaal phir aayega; ab pichhle sawaal par wapas chalte hain. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 cm hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2196 ms]: Sahi jawab, kyunki parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yahan tak theek hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 843 ms]: Aaj ke liye itna hi, phir milte hain.

## Agent


