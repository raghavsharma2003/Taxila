# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2672 ms]: Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2039 ms · guard mustsay]: Theek hai, main shuru karti hoon. Cricket pitch ke ek kone se kinaare-kinaare chalo, wahin lauto: yahi parimap hai. Ab triangle dekho. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain. Ungli ek kone se har bhuja par chalakar wapas usi kone par lao. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1715 ms]: Board par triangle ki har bhuja par uska naap likha hai. Ungli jin bhujaon se guzri, un sabke naap milakar socho. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3168 ms · guard screen,ask]: Haan, Hindi mein batati hoon. Socho is triangle ka kinaara ek dhaage se bana hai. Ek kone se dhaaga khol ke seedha kar do: 4 cm, phir 5 cm, phir 6 cm, sab ek line mein. Us seedhi line ki poori lambai hi parimap hai. Is triangle ke poore kinaare ki lambai kitne centimetre hai?
  > card: Is triangle ke poore kinaare ki lambai kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** mujhe lagta hai 15 cm  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2013 ms · guard noconfirm,screenmismatch]: Sahi jawab, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 934 ms]: Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. Is hexagon ki chhahon bhujayein barabar hain, aur ek par 5 cm likha hai; poore hexagon ka parimap kitne cm hai?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** thirty  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1148 ms · guard mustsay]: Haan, sahi hai. 6 bhujayein, har ek 5 cm: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** mujhe lagta hai 20 cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3099 ms · guard quiz]: Bilkul sahi: dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Chalo, ab ek sawaal hum dono saath mein karte hain. Maali ke paas 35 m baad hai. Phoolon ki kyari triangle jaisi hai, bhujayein 8 m, 9 m aur 14 m. Kinaare-kinaare ek baar baad lagani hai. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3106 ms · guard quiz]: Socho, tumhare paas 35 rupaye hain aur tum ek kitaab khareedte ho. Kitne bachenge, yeh kitaab ka daam jaane bina pata nahi chalta; maali ki baad mein bhi aisa hi kuch pehle jaanna hoga. Kyari ki bhujayein 8 m, 9 m aur 14 m hain, aur maali ke paas 35 m baad hai. Bachi baad ka hisaab kis naap se shuru hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2763 ms · guard long]: Pehle dekhna hai ki kyari ke poore kinaare par kitni baad lagegi, yaani kyari ka parimap. Baad kinaare par hi lagti hai. Parimap mil jaaye, toh use maali ke paas wali baad mein se ghatayenge; jo bache, wahi jawab hai. Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** chaar  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 975 ms]: Sahi jawab. Toh poora jawab: maali ke paas 4 m baad bachegi, kyunki 35 m mein se 31 m baad kyari ke kinaare par lag gayi. Chalo, ab tumhari apni baari. Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3083 ms · guard long]: Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 22 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2246 ms · guard long,uncorrected]: 22 m sahi nahi hai. Isko ek naye dhang se dekhein. Khet ke kisi ek kone par ungli rakho, aur har bhuja par rukkar uski lambai jodo. Jod tab poora, jab ungli wapas usi kone par ho. Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2636 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (1 miss) · board up · ready 1804 ms · guard uncorrected]: Nahi, 26 m theek nahi. Tumhare jod mein khet ki ek bhuja chhoot gayi hai; P se chalkar board par woh bhuja dhoondo jiska number jod mein nahi aaya. 8 m, 5 m, 7 m, 6 m aur 3 m bhujaon wale khet PQRST ka parimap kitne metre hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (2 miss) · board up · ready 1841 ms · guard uncorrected]: 26 m se baat nahi bani. P se shuru karo aur PQ, QR, RS, ST, TP bolte jao. TP ke baad tum wapas P par ho. Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 metre  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 1123 ms]: Sahi jawab. P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (2 miss) · board up · ready 1596 ms]: 22 m sahi nahi hai. 22 m mein park ki chaaron bhujayein nahi aayin, ek bhuja chhoot gayi; jodte waqt board par har bhuja ek-ek baar gino, jab tak chaaron na jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** twenty six  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1283 ms]: Haan, sahi hai: chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1829 ms · guard long]: Nahi, 40 cm theek nahi. Ise alag tareeke se dekhte hain. Socho, rectangle ke kinaare-kinaare lipta dhaaga khol ke seedha rakha: woh parimap hai. Lambai guna chaudai andar ke 1 cm square ginta hai, dhaaga nahi. Bhujayein jodo. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 24 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 1928 ms]: 24 cm se baat nahi bani. 24 cm tab bachta hai jab 150 mein se 14 × 9 ghatao; par ribbon sticker ke upar nahi bichhta, sirf kinaare par lagta hai: 14 wali bhuja do baar, 9 wali bhi do baar. 150 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 24 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (2 miss) · board up · ready 1979 ms · guard uncorrected]: 24 cm sahi nahi hai. Ribbon andar nahi jaata. Pehle dekho kinaare par kitna lagega, phir use 150 mein se ghatao. Ab tum batao.
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** mujhe lagta hai 104 cm  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 1997 ms]: Sahi jawab, kyunki kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 150 − 46 = 104 cm bachega. Theek hai, ab wapas usi sawaal par chalte hain. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"150 − 46 = 104 cm"}}

**child:** 28 cm hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1715 ms]: Haan, sahi hai. Kinaare mein do lambai aur do chaudai: 10 + 4 + 10 + 4 = 28 cm. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 1990 ms · guard mustsay]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 1810 ms · guard uncorrected]: Nahi, 16 m theek nahi. Ek doosri tarah se samajhte hain. Ek cheenti khet ke kone se chalti hai. Woh lambai, phir chaudai chali, toh saamne wale kone par hai: aadha chakkar. Shuru wala kona do bhujayein door hai. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 2333 ms · guard uncorrected]: 27 m sahi nahi hai. 27 m mein 19 aur 8 ek-ek baar jude hain, yaani khet ki do hi bhujayein; cheenti khet ki chaaron bhujaon par chalti hai. 19 m lambe, 8 m chaude khet ka chakkar poora karke cheenti shuru wale kone par lauti; woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 54 m hai na  _(correct)_

**Asha** [repair · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2008 ms]: Sahi jawab, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (1 miss) · board up · ready 2153 ms]: Achha, toh tumhe chauka pasand hai! Chalo, ab pichhle sawaal par wapas chalte hain. 10 m lambe, 6 m chaude is rectangle ka ek poora chakkar kitne metre ka hai?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (2 miss) · board up · ready 4028 ms · guard flat,uncorrected]: 16 m se baat nahi bani. 16 m mein 10 aur 6 ek-ek baar jude hain; par board par 10 wali bhujayein do hain aur 6 wali bhi do, aur chakkar mein chaaron aati hain. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** battis  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 1442 ms · guard mustsay,noconfirm]: Haan, sahi hai: do lambi, do chhoti bhujayein: 32 m. Ek aur rectangle: 12 m lamba, 5 m chauda. Upar baayein kone se chalo, 12 m aage, phir 5 m neeche. Ab tum saamne wale kone par ho: aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 1858 ms · guard uncorrected]: 17 m sahi nahi hai. 17 m par tum sirf saamne wale kone tak pahunche ho; shuru wale kone tak lautne mein utna hi raasta aur lagta hai. Lambai 12 m, chaudai 5 m: 2 × (lambai + chaudai) kitna?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (2 miss) · board up · ready 1887 ms · guard uncorrected]: Nahi, 17 m theek nahi. Formula mein bracket pehle: usmein lambai aur chaudai jaati hain. Phir bracket ka do guna. Chalo, ab tumhari baari.
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 1240 ms · guard mustsay]: Sahi jawab, kyunki aadha chakkar 17 m, do guna 34 m. Ab ek square lo: uski chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Parimap ek doori hai, toh jawab centimetre mein aayega, square centimetre mein nahi. Is square ka parimap kitna hai?
  > card: Is square ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** 36 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2281 ms · guard long]: 36 cm sahi nahi hai. Isko ek naye dhang se dekhein. Kinaare par dhaaga lapeto aur scale par naapo: woh parimap hai. Andar ke 1 cm wale square gino: woh area hai. Parimap ke liye bhujayein jodo. Ek bookmark 12 cm lamba, 3 cm chauda hai. Uska parimap kitne centimetre hai?
  > card: Ek bookmark 12 cm lamba, 3 cm chauda hai. Uska parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 36 cm  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 1569 ms]: 36 cm se baat nahi bani. 12 × 3 = 36 bookmark ko upar se dhakne ka hisaab hai; dhaaga uske upar nahi phailta, sirf kinaare par ghoomta hai. 12 cm lambe, 3 cm chaude bookmark ka parimap kitne centimetre hai?
  > card: Ek bookmark 12 cm lamba, 3 cm chauda hai. Uska parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":12,"h":3}}

**child:** 36 cm  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter (2 miss) · board up · ready 2232 ms · guard uncorrected]: 36 cm sahi nahi hai. Bookmark ke kinaare par ungli ghumao: lambi bhuja, chhoti bhuja, phir lambi, phir chhoti. Aaram se socho, phir bolo.
  > card: Ek bookmark 12 cm lamba, 3 cm chauda hai. Uska parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":12,"h":3}}

**child:** 30 centimetres  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 (1 miss) · board up · ready 1450 ms]: Haan, sahi hai. Kinaara centimetre mein naapte hain aur bhujayein judti hain: 12 + 3 + 12 + 3 = 30 cm. Achha, ab pehle wale sawaal ko phir se dekhte hain. Har bhuja 6 cm; is square ka parimap kitne cm?
  > card: Is square ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":3,"mode":"perimeter","unit":"cm"}}

**child:** 24 cm  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1523 ms · guard long]: Sahi jawab, kyunki chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, parimap ek doori hai isliye cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Poore kinaare ki tape ke liye pehle 24 aur 18 ke saath kya karoge?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 961 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


