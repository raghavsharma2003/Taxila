# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1927 ms · guard mustsay]: Cricket ground ke kinaare-kinaare chalkar wahin lauto jahan se chale. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain. Ungli ek kone se har bhuja par chalakar wapas usi kone par lao. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1711 ms · guard long,uncorrected]: 9 cm sahi nahi hai. Ek doosri tarah se samajhte hain. Khet ke kisi ek kone par ungli rakho, aur har bhuja par rukkar uski lambai jodo. Jod tab poora, jab ungli wapas usi kone par ho. Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitne metre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** unatees  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (1 miss) · board up · ready 825 ms]: Sahi jawab, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Theek hai, ab wapas usi sawaal par chalte hain. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (2 miss) · board up · ready 1863 ms · guard uncorrected]: Nahi, 9 cm theek nahi. 9 cm mein sirf do bhujayein judi hain, aur ungli abhi kone par wapas nahi aayi; teesri bhuja bhi kinaare mein aati hai, use bhi jodo. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pandrah cm  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1670 ms · guard noconfirm,screenmismatch]: Haan, sahi hai. 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 30  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 981 ms · guard mustsay,noconfirm]: Bilkul sahi: 6 bhujayein, har ek 5 cm: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** 20 centimetres  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2006 ms · guard quiz]: Haan, bilkul theek, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Maali ke paas 35 m baad hai. Phoolon ki kyari triangle jaisi hai, bhujayein 8 m, 9 m aur 14 m. Kinaare-kinaare ek baar baad lagani hai. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2577 ms · guard quiz]: Socho, jeb mein 35 rupaye hain aur ek kitaab khareedni hai: kitne bachenge, yeh kitaab ka daam jaane bina pata nahi chalta. Yahan kitaab ki jagah kyari hai. Kyari ki bhujayein 8 m, 9 m aur 14 m hain, aur maali ke paas 35 m baad hai. Bachi baad jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3590 ms · guard quiz]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 1518 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1645 ms]: Achha, toh tumhe chauka pasand hai! Toh ab hum wahin se aage badhte hain. Kyari ki bhujayein 8 m, 9 m aur 14 m hain, aur maali ke paas 35 m baad hai. Bachi baad jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 1816 ms]: Pehle dekhna hai ki kyari ke poore kinaare par kitni baad lagegi, yaani kyari ka parimap. Baad kinaare par hi lagti hai. Parimap mil jaaye, toh use maali ke paas wali baad mein se ghatayenge; jo bache, wahi jawab hai. Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 1550 ms]: Yahan kyari ka kinaara khol kar ek seedhi line bana di hai. Kyari ki bhujayein 8 m, 9 m aur 14 m hain; maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** chaar metre  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1393 ms · guard noconfirm]: Sahi jawab. 35 m mein se 31 m baad kyari ke kinaare par lag gayi. Toh poora jawab: maali ke paas 4 m baad bachegi. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1998 ms]: Arre wah, Virat! Achha kiya jo bataya. Theek hai, ab phir se kaam par aate hain. Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2774 ms · guard ask]: Theek hai, Hindi mein kehti hoon. Park ka kinaara 9, 6, 7 aur 4 metre ki bhujaon se bana hai; uska poora naap kitna hai?
  > card: Park ka kinaara 9, 6, 7 aur 4 metre ki bhujaon se bana hai; uska poora naap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 1699 ms · guard uncorrected]: 22 m sahi nahi hai. 22 m mein park ki chaaron bhujayein nahi aayin, ek bhuja chhoot gayi; jodte waqt board par har bhuja ek-ek baar gino, jab tak chaaron na jud jaayein. Ab tum batao.
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (2 miss) · board up · ready 1737 ms · guard uncorrected]: Nahi, 22 m theek nahi. Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (2 miss) · board up · ready 2651 ms · guard samecard]: Haan, pehle tum try karo.
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain: 9 m, 6 m, 7 m aur 4 m. Park ke chaaron taraf ek baar ghoomne mein kitne metre chalne padenge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** mujhe lagta hai 26 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1505 ms]: Sahi jawab, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2084 ms · guard long,uncorrected]: 40 cm sahi nahi hai. Isko ek naye dhang se dekhein. Kinaare par chaar bhujayein hain, aur parimap chaaron ka jod hai. Lambai guna chaudai mein sirf do bhujayein aati hain; usse andar bichhe chhote square milte hain. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 24 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 1607 ms · guard uncorrected]: 24 cm se baat nahi bani. 24 cm tab bachta hai jab 150 mein se 14 × 9 ghatao; par ribbon sticker ke upar nahi bichhta, sirf kinaare par lagta hai: 14 wali bhuja do baar, 9 wali bhi do baar. 150 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 24 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (2 miss) · board up · ready 2005 ms · guard uncorrected]: Nahi, 24 cm theek nahi. Sticker ke kinaare par ungli ek chakkar ghumao aur har bhuja ka naap jodo. Utna ribbon lagega; baaki 150 mein se bachega. Chalo, ab tumhari baari.
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 150 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 104 cm hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 1450 ms]: Haan, sahi hai. Kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 150 − 46 = 104 cm bachega. Chalo, ab pichhle sawaal par wapas chalte hain. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"150 − 46 = 104 cm"}}

**child:** 28 cm hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2398 ms · guard flat]: Sahi jawab, kyunki kinaare mein do lambai aur do chaudai: 10 + 4 + 10 + 4 = 28 cm. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yahan tak saaf hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1891 ms · guard mustsay]: Achha, wahi cricket! Haan, yeh pehle bhi suna. Ab wahin wapas aate hain jahan hum the. Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 1997 ms]: Ek darwaaza socho: uski do lambi bhujayein ek jitni hain, aur do chhoti bhi ek jitni. Yahan bhi wahi baat hai: 10 m wali bhujayein do hain aur 6 m wali bhi do. Ek poora chakkar inhi chaar bhujaon se banta hai. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** battis  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 795 ms · guard mustsay]: Bilkul sahi. 10 do baar, 6 bhi do baar: 32 m. Ek aur rectangle: 12 m lamba, 5 m chauda. Upar baayein kone se chalo, 12 m aage, phir 5 m neeche. Ab tum saamne wale kone par ho: aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** 17 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2668 ms · guard long,uncorrected]: 17 m sahi nahi hai. Ise alag tareeke se dekhte hain. Ek cheenti khet ke kone se chalti hai. Woh lambai, phir chaudai chali, toh saamne wale kone par hai: aadha chakkar. Shuru wala kona do bhujayein door hai. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 1917 ms · guard uncorrected]: Nahi, 27 m theek nahi. 27 m mein cheenti ne khet ki sirf do bhujayein paar ki hain; khet ki bhujayein chaar hain. 19 m lambe, 8 m chaude khet ka chakkar poora karke cheenti shuru wale kone par lauti; woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (2 miss) · board up · ready 1786 ms · guard uncorrected]: 27 m se baat nahi bani. Board par 19 aur 8 ek-ek baar likhe hain, par cheenti chaar bhujaon par chalti hai. Pehle socho, baaki do bhujaon ke naap kya honge. Aaram se socho, phir bolo.
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (3 miss) · board up · ready 1627 ms · guard uncorrected]: 27 m sahi nahi hai. Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod ke do barabar tukde karo. Ek tukde mein bas ek lambai aur ek chaudai aati hai; lambai + chaudai mude hue dhaage jitna hai, poore dhaage jitna nahi. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 54 m hai na  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 1390 ms]: Sahi jawab, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Achha, ab pehle wale sawaal ko phir se dekhte hain. Lambai 12 m, chaudai 5 m: 2 × (lambai + chaudai) kitna?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** chauntees  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 841 ms · guard mustsay,noconfirm]: Haan, sahi hai. Aadha chakkar 17 m, do guna 34 m. Ab ek square lo: uski chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Parimap ek doori hai, toh jawab centimetre mein aayega, square centimetre mein nahi. Is square ka parimap kitna hai?
  > card: Is square ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** chaubees centimetre  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1708 ms · guard quiz]: Bilkul sahi: chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, parimap ek doori hai isliye cm. Aao, agla sawaal main aur tum mil ke karenge. Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Poore kinaare ki tape ke liye pehle 24 aur 18 ke saath kya karoge?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1009 ms]: Aaj ke liye itna hi, phir milte hain.

## Agent


