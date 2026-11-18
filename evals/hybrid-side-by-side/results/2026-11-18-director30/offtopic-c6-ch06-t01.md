# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3528 ms · guard screen,mustsay]: Cricket pitch ke kinaare kone se chalkar wahin lauto: yahi parimap hai. Isi tarah triangle ka bhi niklega. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2365 ms · guard long,uncorrected]: 9 cm sahi nahi hai. Ek doosri tarah se samajhte hain. Khet ke kone P par ungli rakho, aur har bhuja ka naam lekar uski lambai jodo. Jod tab poora, jab ungli wapas P par ho. Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Poora kinaara kitne metre ka hai?
  > card: Khet PQRST: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 29 metre  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (1 miss) · board up · ready 1134 ms]: Sahi jawab, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Theek hai, ab wapas usi sawaal par chalte hain. Is triangle ki bhujayein 4 cm, 5 cm aur 6 cm hain; iska parimap kitna hai?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (2 miss) · board up · ready 3012 ms · guard level,uncorrected]: 9 cm nahi, yeh jawab theek nahi baitha. Board par triangle ki har bhuja par uska naap likha hai. Ungli jin bhujaon se guzri, un sabke naap milakar socho. Ab phir se socho, jawab kya hoga?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pandrah cm  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 3094 ms · guard screenmismatch]: Haan, sahi hai. Dekho, 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** mujhe lagta hai 30 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2241 ms · guard mustsay,noconfirm]: Bilkul sahi, kyunki chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** 20  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3332 ms · guard leak,quiz]: Haan, bilkul theek: dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Maali ke paas 35 m baad hai. Phoolon ki kyari triangle jaisi hai, bhujayein 8 m, 9 m aur 14 m. Kinaare-kinaare ek baar baad lagani hai. Poori baad lagane ke liye kitni bhujaon ka naap jodna hoga?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3505 ms · guard quiz]: Socho baad ki jaali teen roll mein aayi hai: ek 8 m, ek 9 m, ek 14 m. Har bhuja par ek roll khulta hai, toh poori baad teeno roll milakar banti hai. Poori baad lagane ke liye kitni bhujaon ka naap jodna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2880 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Baad kinaare par lagti hai, toh har bhuja par lagegi: teeno par: 8 m, 9 m aur 14 m, kyunki ek bhi bhuja chhooti toh wahan khaali jagah reh jaayegi. Ab jod lo: 8 + 9 + 14 = 31 m, kyunki kyari ke poore kinaare par itni baad lagegi. Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** 18 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 2053 ms · guard uncorrected]: 18 m sahi nahi hai. 35 m mein se jitni baad kyari par lag gayi, utni hata do; jo reh gayi, wahi bachi. Kyari par 31 m baad lagi; maali ki 35 m mein se kitni bachegi?
  > card: Tumhari baari: maali ki 35 m baad mein se kitni bachegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[8,9,14],"trace":true}}

**child:** chaar metre  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1099 ms]: Sahi jawab. Dekho, maali ki baad kyari ke poore kinaare se 4 m lambi thi. Toh poora jawab: maali ke paas 4 m baad bachegi. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2315 ms]: Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2333 ms · guard long]: Achha, toh tumhe chauka sabse achha lagta hai. Theek hai, ab phir se kaam par aate hain. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"triangle","name":"35 − 31 = 4 m"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3180 ms · guard long]: Kone se chalo aur har bhuja ki lambai jodte jao; chakkar tabhi poora hai jab chaaron bhujayein jud jaayein. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3700 ms · guard samecard]: Park ki chaaron bhujayein yahan ek line mein judi hain, pehle 9 m aur aakhir mein 4 m. 9 m, 6 m, 7 m aur 4 m bhujaon wale park mein ek kone se ghoom ke wapas usi kone tak kitne metre hote hain?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 4208 ms · guard samecard]: Koi baat nahi, isse aasaan shabd abhi mere paas nahi hain. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 22 m  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 2220 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 26 m hai, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2847 ms]: Haan, sixer maara, yeh tumne bataya tha. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 3224 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 centimetre  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1191 ms]: Sahi jawab, kyunki parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2390 ms]: Seedhi bhujaon wali shape mein saari bhujayein jodna chalta hai. Rectangle mein bhujayein jodiyon mein aati hain, isse kaam chhota ho jaata hai. Yahan tak theek hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 3296 ms · guard mustsay,twoq]: Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 m  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 1554 ms · guard mustsay,noconfirm]: Haan, sahi hai, kyunki 10 aur 6 dono do-do baar aate hain. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > card: Is rectangle ke liye 2 × (lambai + chaudai) kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** 34 metre  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 1413 ms · guard mustsay]: Bilkul sahi. Dekho, aadha chakkar 12 + 5 = 17 m, aur uska do guna: 2 × 17 = 34 m. Ab ek square lo: uski chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Jawab kinaare ka naap hai, toh centimetre mein aayega, square centimetre mein nahi. Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > card: Ek bhuja 6 cm hai, toh chaaron bhujayein milkar kitne cm hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** mujhe lagta hai 24 cm  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2265 ms]: Sahi jawab, kyunki chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, kinaare ka naap hai isliye cm. Aao, agla sawaal main aur tum mil ke karenge. Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Kone se saamne wale kone tak, aadhe chakkar mein kaun si bhujayein aati hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 4125 ms · guard quiz]: Tape ek kone se chalao: pehle lambi bhuja, phir mud ke chhoti bhuja. Ab tum saamne wale kone par ho. Kone se saamne wale kone tak, aadhe chakkar mein kaun si bhujayein aati hain?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 3274 ms]: Kone se saamne wale kone tak aadha chakkar hai: ek lambai aur ek chaudai, 24 cm aur 18 cm, kyunki rectangle mein aamne-saamne ki bhujayein barabar hoti hain. Dono jodo: 24 + 18 = 42 cm, kyunki itni tape aadhe chakkar par lagti hai. Tumhari baari: poore kinaare par kitni tape lagegi?
  > card: Tumhari baari: poore kinaare par kitni tape lagegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 42 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2411 ms · guard long,uncorrected]: 42 cm sahi nahi hai. Isko ek naye dhang se dekhein. Socho, ek cheenti khet ke kone se chalti hai. Woh lambai, phir chaudai chali, toh saamne wale kone par hai: aadha chakkar. Shuru wala kona do bhujayein door hai. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 54 m hai na  _(correct)_

**Asha** [practice · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked (1 miss) · board up · ready 2089 ms]: Haan, sahi hai. Dekho, do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Chalo, ab pichhle sawaal par wapas chalte hain. Aadha chakkar 42 cm hai; poore kinaare par kitni tape lagegi?
  > card: Tumhari baari: poore kinaare par kitni tape lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** mujhe lagta hai 84 cm  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch06-t01-s2:c1 · board up · ready 2322 ms]: Sahi jawab. Toh poora jawab: cover ke liye 84 cm tape, kyunki rectangle ke chakkar mein lambai aur chaudai do-do baar aati hain. Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > card: Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":24,"h":18,"mode":"perimeter","unit":"cm"}}

**child:** 130  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 · board up · ready 1533 ms]: Bilkul sahi: aadha chakkar 40 + 25 = 65 m, poora chakkar 2 × 65 = 130 m. Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > card: Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > screen: board compare@1 {} · ref {"template":"area-grid@1","params":{"w":40,"h":25,"mode":"perimeter","unit":"m"}}

**child:** laal card  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2032 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Socho, kinaare par dhaaga lapeta aur scale par naapa: woh kinaara hai. Andar ke 1 cm wale square gine: woh area hai. Kinaare ke liye bhujayein jodo. Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > screen: board measured@1 {} · ref {"template":"compare@1","params":{"left":{"title":"laal card","items":["16 cm aur 9 cm"]},"right":{"title":"neela card","items":["20 cm aur 6 cm"]}}}

**child:** 22 cm  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 2952 ms · guard uncorrected]: 22 cm nahi, yeh jawab theek nahi baitha. 11 × 2 andar ke square centimetre deta hai. Kinaare ke liye bookmark ki chaaron bhujayein socho. 11 cm lambe, 2 cm chaude bookmark ka poora kinaara kitne centimetre ka hai?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uska poora kinaara kitne centimetre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":11,"h":2}}

**child:** 26  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 (1 miss) · board up · ready 1542 ms]: Haan, sahi hai, kyunki kinaara centimetre mein naapte hain aur bhujayein judti hain: 11 + 2 + 11 + 2 = 26 cm. Achha, ab pehle wale sawaal ko phir se dekhte hain. Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > card: Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > screen: board compare@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":2,"mode":"perimeter","unit":"cm"}}

**child:** neela card hai na  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 · board up · ready 3917 ms · guard screen]: Sahi jawab. Dekho, laal 2 × (16 + 9) = 50 cm, neela 2 × (20 + 6) = 52 cm; neele ki border lambi. Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"compare@1","params":{"left":{"title":"laal card","items":["16 cm aur 9 cm"]},"right":{"title":"neela card","items":["20 cm aur 6 cm"]},"mark":{"side":"right"}}}

**child:** 121 cm  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 (1 miss) · board up · ready 2483 ms · guard uncorrected]: 121 cm se baat nahi bani. 11 × 11 tile ke andar ki jagah ginta hai. Kinaare ke liye socho, chaar barabar bhujayein milkar kitni hongi. 11 cm bhuja wali square tile ka parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":11,"h":11}}

**child:** 121 cm  _(misconception)_

**Asha** [repair · beat s2:check:c3 · board up · ready 2312 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 44 cm hai, kyunki chaar barabar bhujayein: 4 × 11 = 44 cm, aur jawab centimetre mein. Ab parimap ko kaam mein lagayenge: kabhi usse ulta ek bhuja nikalni hogi, kabhi chakkaron ki doori ya taar ka hisaab. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":11,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch06-t01-s3:ask:e1 · board up · ready 2672 ms]: Is square ka parimap, yaani poora kinaara, 60 m hai. Yeh kinaara chaar barabar bhujaon se bana hai, do se nahi. Ungli kone se chale, toh chaaron bhujayein paar karke hi 60 m poore hote hain. Is square ki ek bhuja kitni lambi hai?
  > card: Is square ki ek bhuja kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** 30 m  _(incorrect)_

**Asha** [hint · beat s3:explain:e1 · check script:c6-maths-ch06-t01-s3:ask:e1 (1 miss) · board up · ready 2373 ms]: 30 m nahi, yeh jawab theek nahi baitha. Ulta socho: kaunsa number chaar baar jodne par 60 banta hai. Jis square ka parimap 60 m hai, uski ek bhuja kitni lambi hai?
  > card: Is square ki ek bhuja kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** pandrah m  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c6-maths-ch06-t01-s3:ask:e2 · board up · ready 2486 ms · guard mustsay,long]: Sahi jawab, kyunki 60 m chaar barabar bhujaon mein: 60 ÷ 4 = 15 m. Ab ek rectangle: parimap 60 m, lambai 20 m. Poore chakkar mein do lambai aur do chaudai aati hain, toh aadhe chakkar mein ek lambai aur ek chaudai. Is rectangle ki chaudai kitni hai?
  > card: Is rectangle ki chaudai kitni hai?
  > screen: board shape@1 {} · ref {"template":"area-grid@1","params":{"w":15,"h":15,"mode":"perimeter","unit":"m"}}

**child:** 40 m  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s3:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2518 ms · guard long]: 40 m sahi nahi hai. Ek doosri tarah se samajhte hain. Socho, rectangle ke poore chakkar mein do lambai aur do chaudai hain. Kone se saamne wale kone tak sirf aadha chakkar hai: ek lambai aur ek chaudai. Ek rectangle talaab ke kinaare ek poora chakkar 90 m ka hai. Talaab 28 m lamba hai. Woh kitna chauda hai?
  > card: Ek rectangle talaab ke kinaare ek poora chakkar 90 m ka hai. Talaab 28 m lamba hai. Woh kitna chauda hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","side":"20 m","name":"parimap 60 m"}}

**child:** mujhe lagta hai 17 m  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c6-maths-ch06-t01-s3:ask:e2 (1 miss) · board up · ready 2249 ms]: Haan, sahi hai. Dekho, ek lambai aur ek chaudai milkar 45 m hain, aur lambai 28 m, toh chaudai 17 m. Theek hai, ab wapas usi sawaal par chalte hain. 60 m parimap aur 20 m lambai wale rectangle ki chaudai kitni hai?
  > card: Is rectangle ki chaudai kitni hai?
  > screen: board shape@1 {} · ref {"template":"area-grid@1","params":{"w":28,"h":17,"mode":"perimeter","unit":"m"}}

**child:** 10 metre  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 · board up · ready 3350 ms · guard mustsay,noconfirm]: Bilkul sahi, kyunki aadha chakkar 30 m, usme se lambai 20 m gayi, bache 10 m. Ab ek plot: 12 m lamba, 8 m chauda, toh kinaara 2 × (12 + 8) = 40 m. Taar ₹10 per metre hai, aur kharcha sirf lagne wali taar ka. Neeche wali bhuja mein 2 m ka gate hai, jahan taar nahi lagti. Gate chhod ke, taar par kul kharcha kitne rupaye aayega?
  > card: Gate chhod ke, taar par kul kharcha kitne rupaye aayega?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":20,"h":10,"mode":"perimeter","unit":"m"}}

## Agent


