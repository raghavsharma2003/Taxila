# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2191 ms]: Aaj hum kisi shape ke chaaron taraf ka poora kinaara naapenge. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2790 ms · guard mustsay]: Theek hai, main shuru karti hoon. Cricket pitch ke kinaare kone se chalkar wahin lauto: yahi parimap hai. Isi tarah triangle ka bhi niklega. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1892 ms]: Board par triangle ki har bhuja par uska naap likha hai. Ungli jin bhujaon se guzri, un sabke naap milakar socho. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2894 ms · guard ask]: Haan, ise aur aasaan karke samjhaati hoon. Ungli ek kone se chalkar ghoom ke usi kone par lauti, toh kul kitne cm chali?
  > card: Ungli ek kone se chalkar ghoom ke usi kone par lauti, toh kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2355 ms · guard screenmismatch]: Sahi jawab, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1238 ms]: Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. Is hexagon ki ek bhuja par 5 cm likha hai; poore hexagon ka parimap kitne cm hai?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1166 ms · guard mustsay,noconfirm]: Haan, sahi hai. Dekho, 6 bhujayein, har ek 5 cm: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** 20 cm hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2053 ms]: Bilkul sahi: dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Chalo, ab ek sawaal hum dono saath mein karte hain. Maali ke paas 35 m baad hai. Phoolon ki kyari triangle jaisi hai, bhujayein 8 m, 9 m aur 14 m. Kinaare-kinaare ek baar baad lagani hai. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2128 ms]: Yahan kyari ka kinaara khol kar seedhi line bana di hai. Maali ke paas 35 m baad hai. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 3327 ms · guard screen]: Socho, maali ko kaise pata chalega ki baad kam padegi ya bachegi. Use pehle yeh jaanna hoga ki kyari ko gherne mein kitni baad lagegi. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** pehle wale step se pata chala  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 5104 ms · guard quiz]: Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2151 ms]: Pehle kyari ke poore kinaare ki lambai chahiye: kyari ka parimap, teeno bhujaon ka jod, kyunki baad kinaare par hi lagti hai. Ab jod lo: 8 + 9 + 14 = 31 m, kyunki kyari ke poore kinaare par itni baad lagegi. Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** 18 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1954 ms · guard uncorrected]: 18 m sahi nahi hai. Isko ek naye dhang se dekhein. Khet ke kone P par ungli rakho, aur har bhuja ka naam lekar uski lambai jodo. Jod tab poora, jab ungli wapas P par ho. Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Poora kinaara kitne metre ka hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1920 ms]: Haan, pehle tum try karo.
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 1235 ms]: Sahi jawab, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Achha, ab pehle wale sawaal ko phir se dekhte hain. Kyari par 31 m baad lagi; maali ki 35 m mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 18 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (2 miss) · board up · ready 2712 ms]: Nahi, 18 m theek nahi. 35 m mein se jitni baad kyari par lag gayi, utni hata do; jo reh gayi, wahi bachi. Ab phir se socho, jawab kya hoga?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** 4  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1285 ms · guard noconfirm]: Haan, sahi hai. Dekho, maali ki baad kyari ke poore kinaare se 4 m lambi thi. Toh poora jawab: maali ke paas 4 m baad bachegi. Chalo, ab tumhari apni baari. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** 22 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 3322 ms · guard flat,script,uncorrected]: 22 m sahi nahi hai. Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 22 m  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 2155 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 26 m hai, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c2 · board up · ready 1924 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2168 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Ab apni padhai par lautte hain. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2779 ms · guard long]: Nahi, 40 cm theek nahi. Ise alag tareeke se dekhte hain. Socho, rectangle ke kinaare par dhaaga lapeta, phir khol ke scale par rakha: woh lambai parimap hai. Andar tiles bichhao toh area. Parimap mein bhujayein jodte hain, guna nahi. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 140 cm ribbon mein se kitna bachega?
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 140 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 14 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 2091 ms · guard uncorrected]: 14 cm se baat nahi bani. Ribbon andar nahi jaata. Pehle dekho kinaare par kitna lagega, phir use 140 mein se ghatao. 140 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 140 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 14 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (2 miss) · board up · ready 1999 ms · guard uncorrected]: 14 cm sahi nahi hai. Is rectangle ko ek chhota aangan socho: deewar kinaare par chalti hai, aur andar farsh hai jo area hai. Deewar ki lambai ke liye bhujayein jodte hain; lambai aur chaudai ka guna sirf farsh batata hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 140 cm ribbon mein se kitna bachega?
  > card: 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagana hai. Tumhare 140 cm ribbon mein se kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 94 cm hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 2189 ms]: Sahi jawab, kyunki kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega. Theek hai, ab wapas usi sawaal par chalte hain. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** 28 cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 3030 ms · guard flat]: Haan, sahi hai: parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yahan tak theek hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2483 ms · guard mustsay]: Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2384 ms · guard long,uncorrected]: Nahi, 16 m theek nahi. Ek doosri tarah se samajhte hain. Socho, ek cheenti khet ke kone se chalti hai. Woh lambai, phir chaudai chali, toh saamne wale kone par hai: aadha chakkar. Shuru wala kona do bhujayein door hai. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 54 m  _(correct)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (1 miss) · board up · ready 1230 ms]: Bilkul sahi, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Chalo, ab pichhle sawaal par wapas chalte hain. 10 m lambe, 6 m chaude is rectangle ka ek poora chakkar kitne metre ka hai?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (2 miss) · board up · ready 2193 ms · guard uncorrected]: 16 m sahi nahi hai. Ungli ek kone se ghumao: har mod par ek bhuja khatam hoti hai, aur chaar mod ke baad tum wahin pahunchte ho. Ab phir se socho, jawab kya hoga?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 metre  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 1543 ms · guard mustsay]: Sahi jawab. Dekho, 10 aur 6 dono do-do baar aate hain. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 2453 ms · guard uncorrected]: 17 m se baat nahi bani. Formula mein bracket pehle: usmein lambai aur chaudai jaati hain. Phir bracket ka do guna. Toh ab batao, kya aayega?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (2 miss) · board up · ready 2026 ms · guard uncorrected]: Nahi, 17 m theek nahi. Is rectangle ki chaar bhujaon ko do jodiyon mein baanto: ek 12 m aur ek 5 m ki jodi, aur waisi hi doosri jodi. Ek jodi ka jod lo aur uska do guna karo: yahi 2 × (lambai + chaudai) hai. Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34 m hai na  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 3437 ms · guard noconfirm]: Haan, sahi hai: aadha chakkar 17 m, do guna 34 m. Ab ek square lo: uski chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Jawab kinaare ka naap hai, toh centimetre mein aayega, square centimetre mein nahi. Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > card: Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** 36 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2493 ms · guard long]: 36 cm sahi nahi hai. Isko ek naye dhang se dekhein. Socho, kinaare par dhaaga lapeta aur scale par naapa: woh kinaara hai. Andar ke 1 cm wale square gine: woh area hai. Kinaare ke liye bhujayein jodo. Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 22 cm  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 2017 ms · guard uncorrected]: 22 cm sahi nahi hai. 11 × 2 andar ke square centimetre deta hai. Kinaare ke liye bookmark ki chaaron bhujayein socho. 11 cm lambe, 2 cm chaude bookmark ka poora kinaara kitne centimetre ka hai?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":11,"h":2}}

**child:** 22 cm  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter (2 miss) · board up · ready 2449 ms · guard uncorrected]: 22 cm se baat nahi bani. Ek chocolate ke wrapper ko socho: uske kinaare ki sunehri line scale se centimetre mein naapte hain, aur andar ki chocolate ke chhote square gine jaate hain. Line ke liye bhujayein judti hain; guna sirf andar ke square ginta hai. Ab phir se socho, jawab kya hoga?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":11,"h":2}}

**child:** 26  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 (1 miss) · board up · ready 1447 ms]: Sahi jawab, kyunki kinaara centimetre mein naapte hain aur bhujayein judti hain: 11 + 2 + 11 + 2 = 26 cm. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > card: Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":2,"mode":"perimeter","unit":"cm"}}

**child:** 24 cm  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1508 ms]: Haan, sahi hai. Dekho, chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, kinaare ka naap hai isliye cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Kone se saamne wale kone tak, aadhe chakkar mein kaun si bhujayein aati hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1163 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


