# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1639 ms]: Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1682 ms · guard mustsay]: Theek hai, main shuru karti hoon. Cricket ground ke kinaare-kinaare chalkar wahin lauto jahan se chale. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain. Ungli ek kone se har bhuja par chalakar wapas usi kone par lao. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1772 ms]: Board par triangle ki har bhuja par uska naap likha hai. Ungli jin bhujaon se guzri, un sabke naap milakar socho. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2296 ms · guard ask]: Haan, Hindi mein batati hoon. Socho is triangle ka kinaara ek dhaage se bana hai. Ek kone se dhaaga khol ke seedha kar do: 4 cm, phir 5 cm, phir 6 cm, sab ek line mein. Us seedhi line ki poori lambai hi parimap hai. Is triangle ke poore kinaare ki lambai kitne centimetre hai?
  > card: Is triangle ke poore kinaare ki lambai kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** mujhe lagta hai 15 cm  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1633 ms · guard mustsay,screenmismatch]: Sahi jawab, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 858 ms]: Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. Is hexagon ki chhahon bhujayein barabar hain, aur ek par 5 cm likha hai; poore hexagon ka parimap kitne cm hai?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** thirty  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 933 ms · guard mustsay,noconfirm]: Haan, sahi hai. 6 bhujayein, har ek 5 cm: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** mujhe lagta hai 20 cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2574 ms · guard quiz]: Bilkul sahi: dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Chalo, ab ek sawaal hum dono saath mein karte hain. Maali ke paas 35 m baad hai. Phoolon ki kyari triangle jaisi hai, bhujayein 8 m, 9 m aur 14 m. Kinaare-kinaare ek baar baad lagani hai. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2476 ms]: Baayein taraf maali ke paas ki poori baad hai, daayein taraf kyari ki teeno bhujayein, jin par baad lagegi. Kyari ki bhujayein 8 m, 9 m aur 14 m hain, aur maali ke paas 35 m baad hai. Bachi baad jaanne se pehle kya nikaalna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"maali ki baad","items":["35 m"]},"right":{"title":"kyari ki bhujayein","items":["8 m","9 m","14 m"]}}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 841 ms]: Socho, jeb mein 35 rupaye hain aur ek kitaab khareedni hai: kitne bachenge, yeh kitaab ka daam jaane bina pata nahi chalta. Yahan kitaab ki jagah kyari hai. Ab tum batao.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3757 ms · guard quiz]: Ab phir se socho, jawab kya hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2138 ms · guard invented]: Pehle dekhna hai ki kyari ke poore kinaare par kitni baad lagegi, yaani kyari ka parimap. Baad kinaare par hi lagti hai. Parimap mil jaaye, toh use maali ke paas wali baad mein se ghatayenge; jo bache, wahi jawab hai. Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 1639 ms]: Pehle kyari ki bhujaon se uska parimap nikalo, phir dekho 35 m mein se kitni baad bachi. Chalo, ab tumhari baari.
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2367 ms · guard praise,screen,affirms]: Haan, pehle tum try karo.
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** 18 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2193 ms · guard long,uncorrected]: 18 m sahi nahi hai. Isko ek naye dhang se dekhein. Khet ke kisi ek kone par ungli rakho, aur har bhuja par rukkar uski lambai jodo. Jod tab poora, jab ungli wapas usi kone par ho. Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (1 miss) · board up · ready 1427 ms · guard uncorrected]: Nahi, 26 m theek nahi. Tumhare jod mein khet ki ek bhuja chhoot gayi hai; P se chalkar board par woh bhuja dhoondo jiska number jod mein nahi aaya. 8 m, 5 m, 7 m, 6 m aur 3 m bhujaon wale khet PQRST ka parimap kitne metre hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (2 miss) · board up · ready 2649 ms · guard flat,uncorrected]: 26 m se baat nahi bani. Board par paanch naap likhe hain; jod mein paanchon number aane chahiye, ek bhi chhoote nahi. Aaram se socho, phir bolo.
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** unatees metre  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 895 ms]: Sahi jawab, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Achha, ab pehle wale sawaal ko phir se dekhte hain. Kyari ki bhujayein 8 m, 9 m aur 14 m hain; maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 18 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (2 miss) · board up · ready 1715 ms · guard uncorrected]: 18 m sahi nahi hai. 35 mein se sirf 8 aur 9 ghatane par 18 m aata hai; 14 m wali bhuja par bhi baad lagti hai. Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** 18 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (3 miss) · board up · ready 1603 ms · guard uncorrected]: 18 m sahi nahi hai. Ek chhoti cheez se socho: rumaal ke chaaron taraf lace lagani ho, toh lace har bhuja par lagti hai, aur kul lace un sab bhujaon ka jod hoti hai. Kyari ki baad bhi aisi hi hai, bas bhujayein teen hain. Ab tum batao.
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** 18 m  _(misconception)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1677 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Iska jawab hai maali ke paas 4 m baad bachegi, kyunki 35 m mein se 31 m baad kyari ke kinaare par lag gayi. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c1 · board up · ready 2008 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1782 ms · guard long]: Achha, toh tumhe chauka pasand hai! Ab apni padhai par lautte hain. Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 2365 ms · guard flat,uncorrected]: Nahi, 22 m theek nahi. 22 m mein park ki chaaron bhujayein nahi aayin, ek bhuja chhoot gayi; jodte waqt board par har bhuja ek-ek baar gino, jab tak chaaron na jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (2 miss) · board up · ready 2488 ms · guard samecard,uncorrected]: 22 m se baat nahi bani. Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. Chalo, ab tumhari baari.
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** mujhe lagta hai 26 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2406 ms]: Sahi jawab. Chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 28 cm hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2489 ms · guard flat]: Haan, sahi hai: kinaare mein do lambai aur do chaudai: 10 + 4 + 10 + 4 = 28 cm. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 1958 ms]: Parimap kinaare ki saari bhujaon ka jod hai, andar ki jagah ka nahi. Ab dekhenge ki kuch shapes mein itna saara jodna bhi nahi padta. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 1698 ms]: Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 1610 ms · guard uncorrected]: 16 m sahi nahi hai. Ise alag tareeke se dekhte hain. Ek cheenti khet ke kone se chalti hai. Woh lambai, phir chaudai chali, toh saamne wale kone par hai: aadha chakkar. Shuru wala kona do bhujayein door hai. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 1816 ms · guard uncorrected]: Nahi, 27 m theek nahi. 27 m mein cheenti ne khet ki sirf do bhujayein paar ki hain; khet ki bhujayein chaar hain. 19 m lambe, 8 m chaude khet ka chakkar poora karke cheenti shuru wale kone par lauti; woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (2 miss) · board up · ready 2837 ms · guard flat,uncorrected]: 27 m se baat nahi bani. Board par 19 aur 8 ek-ek baar likhe hain, par cheenti chaar bhujaon par chalti hai. Pehle socho, baaki do bhujaon ke naap kya honge. Aaram se socho, phir bolo.
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** chauvan metre  _(correct)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (1 miss) · board up · ready 946 ms]: Sahi jawab, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Theek hai, ab wapas usi sawaal par chalte hain. 10 m lambe, 6 m chaude is rectangle ka ek poora chakkar kitne metre ka hai?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 32  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 1305 ms · guard mustsay,noconfirm]: Haan, sahi hai. 10 do baar, 6 bhi do baar: 32 m. Ek aur rectangle: 12 m lamba, 5 m chauda. Upar baayein kone se chalo, 12 m aage, phir 5 m neeche. Ab tum saamne wale kone par ho: aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 1797 ms · guard uncorrected]: 17 m sahi nahi hai. 17 m par tum sirf saamne wale kone tak pahunche ho; shuru wale kone tak lautne mein utna hi raasta aur lagta hai. Lambai 12 m, chaudai 5 m: 2 × (lambai + chaudai) kitna?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (2 miss) · board up · ready 1626 ms · guard uncorrected]: Nahi, 17 m theek nahi. Formula mein bracket pehle: usmein lambai aur chaudai jaati hain. Phir bracket ka do guna. Ab tum batao.
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (3 miss) · board up · ready 1992 ms · guard uncorrected]: 17 m se baat nahi bani. Is rectangle ki chaar bhujaon ko do jodiyon mein baanto: ek 12 m aur ek 5 m ki jodi, aur waisi hi doosri jodi. Ek jodi ka jod lo aur uska do guna karo: yahi 2 × (lambai + chaudai) hai. Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** chauntis  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 1035 ms · guard screenmismatch]: Sahi jawab, kyunki aadha chakkar 17 m, do guna 34 m. Ab ek square lo: uski chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Parimap ek doori hai, toh jawab centimetre mein aayega, square centimetre mein nahi. Is square ka parimap kitna hai?
  > card: Is square ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** 24 cm  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1175 ms]: Haan, sahi hai: chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, parimap ek doori hai isliye cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Poore kinaare ki tape ke liye pehle 24 aur 18 ke saath kya karoge?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1559 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


