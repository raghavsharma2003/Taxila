# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1666 ms]: Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge. Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. Ab tak samajh aaya?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 958 ms]: Koi baat nahi, ise aur aasaan karke samjhaati hoon. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1942 ms]: Board ki line dekho: ungli ka poora safar wahi hai. Us line ki har bhuja ki lambai milakar socho. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2275 ms]: Bilkul, ise doosre, aasaan shabdon mein bolti hoon. Socho is triangle ka kinaara ek dhaage se bana hai. Ek kone se dhaaga khol ke seedha kar do: 4 cm, phir 5 cm, phir 6 cm, sab ek line mein. Us seedhi line ki poori lambai hi parimap hai. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1743 ms · guard screenmismatch]: Sahi jawab, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2303 ms]: Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2177 ms]: Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** mujhe lagta hai 30 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2006 ms · guard mustsay,screenmismatch]: Haan, sahi hai: chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bagal ki bhuja 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 3064 ms · guard level]: Rectangle ka kinaara ek dhaage ki tarah khul gaya hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah is line mein nahi aati. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1918 ms · guard uncorrected]: 24 cm sahi nahi hai. Aao, isko ek naye dhang se dekhein. Kinaare par dhaaga lapeto, phir kholke scale par rakho: woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 94 cm  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 943 ms]: Sahi jawab, kyunki kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega. Achha, ab pehle wale sawaal ko phir se dekhte hain. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 1851 ms]: Ek kone se dhaaga lapetna shuru karo aur wapas usi kone tak aao; har bhuja par jitna dhaaga khula, woh jodte jao. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (2 miss) · board up · ready 1704 ms]: 24 cm nahi, yeh jawab theek nahi baitha. Is rectangle ko ek photo frame socho. Frame ki lakdi sirf kinaare par hoti hai, 6, 4, 6 aur 4; beech mein photo hoti hai. Lakdi ki poori lambai parimap hai, aur photo ki jagah area. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (2 miss) · board up · ready 2294 ms]: Haan, pehle tum try karo. Yeh raha sawaal. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** mujhe lagta hai 20 cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1776 ms · guard noconfirm]: Haan, sahi hai: dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Chalo, ab ek sawaal hum dono saath mein karte hain. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Saath mein nikaalte hain ki kitni lambi baad lagegi. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked:problem · board up · ready 2934 ms · guard quiz]: Socho tum kyari ke ek kone par khade ho. 7 m chalo, mudo, 9 m chalo, mudo, phir 12 m chal ke wahin pahunch jao. Baad utni hi lambi chahiye jitna tum chale, toh wahi doori nikalni hai. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2028 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 2737 ms · guard leak,long,uncorrected]: 16 m sahi nahi hai. Ise ek alag tareeke se dekhte hain. Ab ek khet socho, kone P, Q, R, S, T. P par ungli rakho aur har bhuja ka naam lo jaise-jaise uski lambai jodte ho. Ek bhi bhuja chhooti toh jod adhoora. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 4465 ms · guard long]: Ek chowkidaar raat ko khet ke kinaare ghoomta hai aur har kone par seeti bajata hai. Jab tak woh pehle kone par lautke seeti na bajaye, chakkar poora nahi, aur beech ki har bhuja uski doori mein judti hai. Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"pentagon","names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (1 miss) · board up · ready 2878 ms · guard flat]: 26 m nahi, yeh jawab theek nahi baitha. P se shuru karo aur PQ, QR, RS, ST, TP bolte jao. TP ke baad tum wapas P par ho. 8 m, 5 m, 7 m, 6 m aur 3 m bhujaon wale khet PQRST ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2004 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 29 m hai, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2028 ms]: Aasaan jodiyan pehle: 8 + 5 = 13 aur 7 + 3 = 10, toh 23; phir ST ke 6 jodo, 29 m. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3261 ms · guard flat]: Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 2330 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Ab wahin wapas aate hain jahan hum the. Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 28 m  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1186 ms]: Sahi jawab. Toh poora jawab: kyari ke liye 28 m lambi baad, kyunki baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 2134 ms]: 22 m sahi nahi hai. Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 26 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1083 ms]: Haan, sahi hai: chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 28  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2208 ms · guard flat]: Bilkul sahi, kyunki parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yahan tak saaf hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2572 ms]: 10 cm wali do bhujayein 20 cm, 4 cm wali do bhujayein 8 cm, toh parimap 20 + 8 = 28 cm; 40 toh card ke andar ke chhote square ginta hai. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1949 ms · guard mustsay]: Koi baat nahi, parimap ke aise sawaal aage phir aayenge; abhi aage badhte hain. Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:explain:e1 · board up · ready 1783 ms]: Ek darwaaza socho: upar aur neeche ki bhuja ek jitni lambi, daayein aur baayein ki bhi ek jitni. Yahan bhi wahi baat hai: 10 m wali bhujayein do hain aur 6 m wali bhi do. Ek poora chakkar inhi chaar bhujaon se banta hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:explain:e1 · board up · ready 3041 ms · guard level]: Board par sirf do number likhe hain, par bhujayein chaar hain. Har likhi bhuja ke saamne uski jodidaar bhuja hai, bilkul utni hi lambi. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1054 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

## Agent


