# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3251 ms · guard screen,mustsay]: Cricket pitch ke kinaare kone se chalkar wahin lauto: yahi parimap hai. Isi tarah triangle ka bhi niklega. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2319 ms · guard long,uncorrected]: 9 cm sahi nahi hai. Ek doosri tarah se samajhte hain. Khet ke kone P par ungli rakho, aur har bhuja ka naam lekar uski lambai jodo. Jod tab poora, jab ungli wapas P par ho. Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Poora kinaara kitne metre ka hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 29 metre  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (1 miss) · board up · ready 1151 ms]: Sahi jawab, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Theek hai, ab wapas usi sawaal par chalte hain. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (2 miss) · board up · ready 1760 ms · guard uncorrected]: Nahi, 9 cm theek nahi. Board par triangle ki har bhuja par uska naap likha hai. Ungli jin bhujaon se guzri, un sabke naap milakar socho. Ab phir se socho, jawab kya hoga?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pandrah cm  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2067 ms · guard mustsay,screenmismatch]: Haan, sahi hai. Dekho, 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** mujhe lagta hai 30 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1978 ms · guard mustsay,noconfirm]: Bilkul sahi: 6 bhujayein, har ek 5 cm: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** 20  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2896 ms · guard leak,quiz,screenmismatch]: Haan, bilkul theek, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Maali ke paas 35 m baad hai. Phoolon ki kyari triangle jaisi hai, bhujayein 8 m, 9 m aur 14 m. Kinaare-kinaare ek baar baad lagani hai. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3548 ms · guard level,quiz]: Socho, maali ko kaise pata chalega ki baad kam padegi ya bachegi. Use pehle yeh jaanna hoga ki kyari ko gherne mein kitni baad lagegi. Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** jaise aapne samjhaya tha, waise hi kiya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3736 ms · guard affirms]: Kitni baad bachegi, yeh jaanne se pehle kya nikaalna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** perimeter  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2777 ms · guard affirms]: Haan, kyari ka parimap, yaani teeno bhujaon ka jod. Ab jod lo: 8 + 9 + 14 = 31 m, kyunki kyari ke poore kinaare par itni baad lagegi. Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** chaar metre  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1048 ms]: Sahi jawab. Dekho, maali ki baad kyari ke poore kinaare se 4 m lambi thi. Toh poora jawab: maali ke paas 4 m baad bachegi. Ab agla sawaal tumhare liye. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1918 ms · guard long]: Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3594 ms · guard samecard]: Park ki chaaron bhujayein yahan ek line mein judi hain, pehle 9 m aur aakhir mein 4 m. Ab phir se socho, jawab kya hoga?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 22 m  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 1745 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 26 m hai, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2159 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 4418 ms · guard ask]: Bilkul, ise doosre, aasaan shabdon mein bolti hoon. Zoya ne 10 cm lambe aur 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Is card ka theek parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe aur 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Is card ka theek parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 centimetre  _(correct)_

**Asha** [repair · beat s1:check:c2 · board up · ready 1490 ms]: Sahi jawab, kyunki parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yahan tak theek hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3053 ms · guard mustsay]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 3323 ms · guard twoq]: Achha, toh tumhe chauka sabse achha lagta hai. Ab wapas apne kaam par. Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2256 ms]: Haan, pehle tum try karo.
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 m  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 1098 ms · guard mustsay,noconfirm]: Haan, sahi hai. Dekho, 10 aur 6 dono do-do baar aate hain. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** 34 m  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 1471 ms · guard mustsay,noconfirm]: Sahi jawab, kyunki aadha chakkar 17 m, do guna 34 m. Ab ek square lo: uski chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Jawab kinaare ka naap hai, toh centimetre mein aayega, square centimetre mein nahi. Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > card: Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** 24 centimetre  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1379 ms]: Bilkul sahi: chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, kinaare ka naap hai isliye cm. Aao, agla sawaal main aur tum mil ke karenge. Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Kone se saamne wale kone tak, aadhe chakkar mein kaun si bhujayein aati hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** ek lambi ek chhoti  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 3378 ms · guard affirms]: Haan, ek lambai aur ek chaudai, yaani aadha chakkar. Dono jodo: 24 + 18 = 42 cm, kyunki itni tape aadhe chakkar par lagti hai. Tumhari baari: poore kinaare par kitni tape lagegi?
  > card: Tumhari baari: poore kinaare par kitni tape lagegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 42 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2183 ms · guard uncorrected]: 42 cm sahi nahi hai. Isko ek naye dhang se dekhein. Socho, ek cheenti khet ke kone se chalti hai. Woh lambai, phir chaudai chali, toh saamne wale kone par hai: aadha chakkar. Shuru wala kona do bhujayein door hai. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 2089 ms · guard uncorrected]: Nahi, 27 m theek nahi. Board par dekho, cheenti ka poora chakkar kin bhujaon se banta hai; phir unki lambai jodo. 19 m lambe, 8 m chaude khet ka chakkar poora karke cheenti shuru wale kone par lauti; woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 54 metre  _(correct)_

**Asha** [practice · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked (1 miss) · board up · ready 1417 ms]: Sahi jawab, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Chalo, ab pichhle sawaal par wapas chalte hain. Aadha chakkar 42 cm hai; poore kinaare par kitni tape lagegi?
  > card: Tumhari baari: poore kinaare par kitni tape lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 42 cm  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked (2 miss) · board up · ready 2028 ms · guard uncorrected]: 42 cm se baat nahi bani. 42 cm sirf saamne wale kone tak hai. Shuru wale kone tak wapas aane mein bhi utni hi tape lagegi. Ab phir se socho, jawab kya hoga?
  > card: Tumhari baari: poore kinaare par kitni tape lagegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 84 cm hai na  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch06-t01-s2:c1 · board up · ready 2137 ms]: Haan, sahi hai. Dekho, rectangle ke chakkar mein lambai aur chaudai do-do baar aati hain. Toh poora jawab: cover ke liye 84 cm tape. Ab ek sawaal tum akele karo. Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > card: Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":24,"h":18,"mode":"perimeter","unit":"cm"}}

**child:** mujhe lagta hai 130 m  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 · board up · ready 2291 ms]: Bilkul sahi: aadha chakkar 40 + 25 = 65 m, poora chakkar 2 × 65 = 130 m. Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > card: Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > screen: board compare@1 {} · ref {"template":"area-grid@1","params":{"w":40,"h":25,"mode":"perimeter","unit":"m"}}

**child:** blue  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 · board up · ready 2528 ms · guard screen]: Haan, bilkul theek, kyunki laal 2 × (16 + 9) = 50 cm, neela 2 × (20 + 6) = 52 cm; neele ki border lambi. Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"compare@1","params":{"left":{"title":"laal card","items":["16 cm aur 9 cm"]},"right":{"title":"neela card","items":["20 cm aur 6 cm"]},"mark":{"side":"right"}}}

**child:** 121 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2319 ms · guard long,uncorrected]: 121 cm sahi nahi hai. Ise alag tareeke se dekhte hain. Socho, kinaare par dhaaga lapeta aur scale par naapa: woh kinaara hai. Andar ke 1 cm wale square gine: woh area hai. Kinaare ke liye bhujayein jodo. Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":11,"h":11}}

**child:** 22 cm  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 2175 ms · guard uncorrected]: Nahi, 22 cm theek nahi. 11 × 2 andar ke square centimetre deta hai. Kinaare ke liye bookmark ki chaaron bhujayein socho. 11 cm lambe, 2 cm chaude bookmark ka poora kinaara kitne centimetre ka hai?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":11,"h":2}}

**child:** 26  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 (1 miss) · board up · ready 4096 ms · guard screen]: Sahi jawab. Dekho, kinaara centimetre mein naapte hain aur bhujayein judti hain: 11 + 2 + 11 + 2 = 26 cm. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":2,"mode":"perimeter","unit":"cm"}}

**child:** 44 cm  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1522 ms]: Haan, sahi hai: chaar barabar bhujayein: 4 × 11 = 44 cm, aur jawab centimetre mein. Ab parimap ko kaam mein lagayenge: kabhi usse ulta ek bhuja nikalni hogi, kabhi chakkaron ki doori ya taar ka hisaab. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":11,"mode":"perimeter","unit":"cm"}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1174 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain.

## Agent


