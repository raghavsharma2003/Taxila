# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1892 ms]: Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge. Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare pitch ghoomkar wahin lauto. Jitna chale, utna pitch ka parimap hai. Yahi chakkar ab ek triangle par. Ab tak samajh aaya?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 958 ms]: Koi baat nahi, ise aur aasaan karke samjhaati hoon. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1657 ms]: Board ki line dekho: ungli ka poora safar wahi hai. Us line ki har bhuja ki lambai milakar socho. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2026 ms]: Bilkul, ise doosre, aasaan shabdon mein bolti hoon. Socho is triangle ka kinaara ek dhaage se bana hai. Ek kone se dhaaga khol ke seedha kar do: 4 cm, phir 5 cm, phir 6 cm, sab ek line mein. Us seedhi line ki poori lambai hi parimap hai. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1632 ms · guard screenmismatch]: Sahi jawab, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Hexagon ki kitni bhujaon par label likha hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1203 ms]: Label sirf ek bhuja par likha hai. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1503 ms · guard mustsay,long,noconfirm,screenmismatch]: Haan, sahi hai: chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Dhaaga kahan chalta hai, kinaare par ya andar?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 855 ms]: Dhaaga kinaare par chalta hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1560 ms]: Rectangle ka kinaara ek dhaage ki tarah khul gaya hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah is line mein nahi aati. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3011 ms · guard flat,uncorrected]: 24 cm sahi nahi hai. Aao, isko ek naye dhang se dekhein. Socho, ek rectangle ke kinaare par dhaaga lapeta, phir khol ke scale par rakha: woh lambai parimap hai, centimetre mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2006 ms]: Is rectangle ko ek chhota aangan socho: deewar kinaare par chalti hai, aur andar farsh hai jo area hai. Deewar ki lambai ke liye bhujayein jodte hain; lambai aur chaudai ka guna sirf farsh batata hai. Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1245 ms]: Ribbon andar nahi jaata. Pehle dekho kinaare par kitna lagega, phir use 140 mein se ghatao. 140 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 14 cm  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1628 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 94 cm hai, kyunki kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2724 ms]: 14 do baar 28 aur 9 do baar 18, toh kinaare par 46 cm; 140 mein se pehle 40 hatao toh 100, phir 6 aur hatao toh 94 cm. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 2411 ms]: Achha, ab pehle wale sawaal ko phir se dekhte hain. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 1813 ms]: Haan, pehle tum try karo.
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (2 miss) · board up · ready 1767 ms · guard uncorrected]: 24 cm nahi, yeh jawab theek nahi baitha. Ek kone se dhaaga lapetna shuru karo aur wapas usi kone tak aao; har bhuja par jitna dhaaga khula, woh jodte jao. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 centimetres  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1555 ms · guard noconfirm]: Sahi jawab, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Kadam-kadam karke, agla sawaal milkar hal karein?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 3097 ms]: Ulta socho: 6 × 4 = 24 toh andar ke chhote square hote, dhaaga nahi; dhaage ke liye 6 do baar aur 4 do baar, yaani 12 aur 8, kul 20 cm. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 1799 ms]: Is rectangle ko ek photo frame socho. Frame ki lakdi sirf kinaare par hoti hai, 6, 4, 6 aur 4; beech mein photo hoti hai. Lakdi ki poori lambai parimap hai, aur photo ki jagah area. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 2513 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1992 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 1999 ms · guard screenmismatch]: Chalo, ab ek sawaal hum dono saath mein karte hain. Phoolon ki ek kyari triangle jaisi hai, bhujayein 7 m, 9 m aur 12 m. Uske kinaare-kinaare ek baar baad lagani hai. Dekhte hain, kitni lambi baad lagegi. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Pehle 7 aur 9 jodo: kitne metre hue?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 14 m  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 1877 ms]: Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1067 ms]: Sahi jawab. Dekho, baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m lambi baad. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 26 metres  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1343 ms]: Haan, sahi hai: chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 1827 ms]: 40 cm sahi nahi hai. Board par card ki chaaron bhujayein dekho, chahe number sirf do par likha ho. Socho, guna ki jagah inke saath kya karna hai. 10 cm lambe, 4 cm chaude card ka sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 3516 ms · guard flat]: Bilkul sahi, kyunki parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yahan tak saaf hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 3421 ms]: Seedhi bhujaon wali shape mein saari bhujayein jodna chalta hai. Rectangle mein bhujayein jodiyon mein aati hain, isse kaam chhota ho jaata hai. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3185 ms · guard mustsay,flat]: Yahi sabse seedha tareeka hai jo mere paas hai, koi baat nahi. Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Is rectangle mein 10 m ki kitni bhujayein hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 1370 ms]: 10 m ki do bhujayein hain. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 1915 ms · guard long,uncorrected]: 16 m sahi nahi hai. Ise ek alag tareeke se dekhte hain. Socho, ek cheenti khet ke kone se chalti hai aur metre ginti jaati hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha chakkar. Lambai + chaudai yahin tak hai. Shuru wala kona abhi do bhujayein door hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2053 ms]: Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod ke do barabar tukde karo. Ek tukde mein bas ek lambai aur ek chaudai aati hai; lambai + chaudai mude hue dhaage jitna hai, poore dhaage jitna nahi. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 1634 ms · guard uncorrected]: 27 m nahi, yeh jawab theek nahi baitha. Board par dekho, cheenti ka poora chakkar kin bhujaon se banta hai; phir unki lambai jodo. 19 m lambe, 8 m chaude khet ka chakkar poora karke cheenti shuru wale kone par lauti; woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 27 m  _(misconception)_

**Asha** [repair · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2267 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 54 m hai, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Yahan tak saaf hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (1 miss) · board up · ready 2468 ms]: Theek hai, ab wapas usi sawaal par chalte hain. 10 m lambe, 6 m chaude is rectangle ka ek poora chakkar kitne metre ka hai?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** mujhe lagta hai 32 m  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2042 ms · guard mustsay]: Sahi jawab. Dekho, 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Aadhe chakkar mein lambai kitni baar aati hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 824 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain.

## Agent


