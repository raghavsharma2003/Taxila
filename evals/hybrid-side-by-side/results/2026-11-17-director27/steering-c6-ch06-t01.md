# steering-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1891 ms]: Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge. Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. Ab tak samajh aaya?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 957 ms]: Theek hai, yahi baat seedhe tareeke se kehti hoon. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 2417 ms · guard uncorrected]: 9 cm sahi nahi hai. Ise ek alag tareeke se dekhte hain. Ab ek khet socho, kone P, Q, R, S, T. P par ungli rakho aur har bhuja ka naam lo jaise-jaise uski lambai jodte ho. Ek bhi bhuja chhooti toh jod adhoora. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2408 ms]: Haan, ise aur aasaan karke samjhaati hoon. Ek chowkidaar raat ko khet ke kinaare ghoomta hai aur har kone par seeti bajata hai. Jab tak woh pehle kone par lautke seeti na bajaye, chakkar poora nahi, aur beech ki har bhuja uski doori mein judti hai. Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"pentagon","names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (1 miss) · board up · ready 2972 ms · guard flat,uncorrected]: 26 m nahi, yeh jawab theek nahi baitha. P se shuru karo aur PQ, QR, RS, ST, TP bolte jao. TP ke baad tum wapas P par ho. 8 m, 5 m, 7 m, 6 m aur 3 m bhujaon wale khet PQRST ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2033 ms]: Nahi, yeh theek nahi hai. Is sawaal ka jawab 29 m hai, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1822 ms]: Is aakaar ki 5 bhujayein seedhi karke ek rekha par rakhi hain: 8 m, 5 m, 7 m, 6 m, 3 m. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3603 ms · guard affirms]: Aasaan jodiyan pehle: 8 + 5 = 13 aur 7 + 3 = 10, toh 23; phir ST ke 6 jodo, 29 m. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (1 miss) · board up · ready 1747 ms]: Achha, ab pehle wale sawaal ko phir se dekhte hain. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (1 miss) · board up · ready 1720 ms]: Haan, pehle tum try karo.
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetres  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1079 ms · guard mustsay,noconfirm]: Haan, sahi hai: 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2061 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (1 miss) · board up · ready 1949 ms · guard uncorrected]: 5 cm sahi nahi hai. Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30  _(correct)_

**Asha** [repair · beat s1:explain:e2 · board up · ready 1043 ms · guard screenmismatch]: Bilkul sahi: chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:explain:e2 · board up · ready 3000 ms]: 5 cm ko ek-ek karke chhah baar jodo: 5, 10, 15, 20, 25, 30, toh 30 cm. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [repair · beat s1:explain:e2 · board up · ready 3853 ms · guard level,flat]: Koi baat nahi, parimap ke aise sawaal aage phir aayenge; abhi aage badhte hain. Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 3191 ms · guard mustsay,flat]: Achha, toh tumhe chauka sabse achha lagta hai. Theek hai, ab phir se kaam par aate hain. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bagal ki bhuja 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2884 ms]: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1984 ms]: Ek kone se dhaaga lapetna shuru karo aur wapas usi kone tak aao; har bhuja par jitna dhaaga khula, woh jodte jao. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2249 ms · guard leak]: Haan, sahi hai: dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Chalo, ab ek sawaal hum dono saath mein karte hain. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Saath mein nikaalte hain ki kitni lambi baad lagegi. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:problem · board up · ready 3438 ms · guard quiz]: Socho tum kyari ke ek kone par khade ho. 7 m chalo, mudo, 9 m chalo, mudo, phir 12 m chal ke wahin pahunch jao. Baad utni hi lambi chahiye jitna tum chale, toh wahi doori nikalni hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2076 ms]: Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 1644 ms · guard uncorrected]: 16 m sahi nahi hai. 16 m mein abhi sirf do bhujayein hain, 7 m aur 9 m. Teesri bhuja 12 m bhi kinaare par hai, use bhi jodna hai. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe lagta hai 28 m  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2249 ms]: Bilkul sahi: baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m lambi baad. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 1533 ms]: 22 m nahi, yeh jawab theek nahi baitha. Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 26  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1229 ms]: Haan, sahi hai, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3350 ms · guard long,uncorrected]: 40 cm se baat nahi bani. Ek doosri tarah se samajhte hain. Kinaare par dhaaga lapeto, phir kholke scale par rakho: woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 14 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 1637 ms · guard uncorrected]: 14 cm sahi nahi hai. Ribbon andar nahi jaata. Pehle dekho kinaare par kitna lagega, phir use 140 mein se ghatao. 140 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 94 centimetres  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 995 ms]: Bilkul sahi: kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega. Theek hai, ab wapas usi sawaal par chalte hain. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** 40 cm  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (2 miss) · board up · ready 2327 ms · guard uncorrected]: 40 cm nahi, yeh jawab theek nahi baitha. Card ka kinaara board par ek line ban kar khula hai. Us line ki chaaron bhujayein dekho, aur socho guna ki jagah kya karna hai. 10 cm lambe, 4 cm chaude card ka sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2347 ms · guard flat]: Haan, sahi hai, kyunki parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1405 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

## Agent


