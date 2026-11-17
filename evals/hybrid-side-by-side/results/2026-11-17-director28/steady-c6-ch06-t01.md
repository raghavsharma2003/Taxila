# steady-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1827 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare pitch ghoomkar wahin lauto. Jitna chale, utna pitch ka parimap hai. Yahi chakkar ab ek triangle par. Ab tak samajh aaya?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 877 ms]: Koi baat nahi, ise doosre, aasaan shabdon mein bolti hoon. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1148 ms · guard screenmismatch]: Bilkul sahi: 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare mein aati hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Hexagon ki kitni bhujaon par label likha hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e2 · board up · ready 2733 ms · guard screen]: Shahad ke chhatte ka ek khaana dekho: uski chhah bhujayein hoti hain, sab ek jaisi. Yahan ek bhuja par 5 cm likha hai, toh baaki paanch bhi 5 cm ki hain. Parimap ke liye chhahon bhujayein ginni hain, sirf likhi hui nahi. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 3378 ms]: Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetres  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1215 ms · guard mustsay,noconfirm,screenmismatch]: Haan, bilkul theek: chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: pehle 6, phir bagal ki bhuja 4, phir 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Dhaaga kahan chalta hai, kinaare par ya andar?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** the edge  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2292 ms · guard affirms]: Sahi jawab. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 cm hai na  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1744 ms]: Bilkul sahi, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Kadam-kadam karke, agla sawaal milkar hal karein?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 2043 ms]: Rectangle ka kinaara ek dhaage ki tarah khul gaya hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah is line mein nahi aati. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 1932 ms · guard screenmismatch]: Ab ek sawaal milkar, kadam-kadam hal karte hain. Phoolon ki ek kyari triangle jaisi hai, bhujayein 7 m, 9 m aur 12 m. Uske kinaare-kinaare ek baar baad lagani hai. Dekhte hain, kitni lambi baad lagegi. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Pehle 7 aur 9 jodo: kitne metre hue?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** solah  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2381 ms · guard affirms]: Haan, 7 + 9 = 16 m; do bhujayein jud gayi. Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 metres  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1220 ms]: Haan, bilkul theek: baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m lambi baad. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 22 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 2473 ms · guard uncorrected]: 22 m sahi nahi hai. Ise ek alag tareeke se dekhte hain. Ab ek khet socho, kone P, Q, R, S, T. P par ungli rakho aur har bhuja ka naam lo jaise-jaise uski lambai jodte ho. Ek bhi bhuja chhooti toh jod adhoora. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2102 ms]: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3058 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 m  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 1325 ms]: Bilkul sahi: P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Theek hai, ab wapas usi sawaal par chalte hain. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 26  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1338 ms]: Haan, bilkul theek, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1880 ms]: Theek hai, yahi baat seedhe tareeke se kehti hoon. Board par card ki chaaron bhujayein dekho, chahe number sirf do par likha ho. Socho, guna ki jagah inke saath kya karna hai. 10 cm lambe, 4 cm chaude card ka sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 centimetre  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1101 ms]: Sahi jawab. Dekho, parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2011 ms · guard mustsay]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 4075 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Ab wapas apne kaam par. Is rectangle ki do lambi bhujayein 10 m ki hain, woh lambai hai. Do chhoti bhujayein 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Is rectangle mein 10 m ki kitni bhujayein hain?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** two  _(correct)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 1163 ms]: Bilkul sahi. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 m hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2462 ms · guard mustsay]: Haan, bilkul theek: 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Aadhe chakkar mein lambai kitni baar aati hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** ek baar  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 989 ms]: Sahi jawab. 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 4876 ms · guard flat,uncorrected]: 17 m sahi nahi hai. Ek doosri tarah se samajhte hain. Socho, ek cheenti khet ke kone se chalti hai aur metre ginti jaati hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha chakkar. Lambai + chaudai yahin tak hai. Shuru wala kona abhi do bhujayein door hai. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 3193 ms]: Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod ke do barabar tukde karo. Ek tukde mein bas ek lambai aur ek chaudai aati hai; lambai + chaudai mude hue dhaage jitna hai, poore dhaage jitna nahi. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 54  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 1206 ms]: Bilkul sahi: do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Chalo, ab pichhle sawaal par wapas chalte hain. 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 34 metres  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 972 ms · guard mustsay,noconfirm]: Haan, bilkul theek, kyunki aadha chakkar 12 + 5 = 17 m, aur uska do guna: 2 × 17 = 34 m. Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh centimetre mein aayega, square centimetre mein nahi. Is square ke kinaare mein 6 cm ki bhuja kitni baar aati hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** 4 baar  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 2075 ms · guard affirms]: Sahi jawab. Ek bhuja 6 cm hai, toh chaaron bhujaon ki kul lambai kitni hai?
  > card: Ek bhuja 6 cm hai, toh chaaron bhujaon ki kul lambai kitni hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 24 centimetres  _(correct)_

**Asha** [repair · beat s2:explain:e3 · board up · ready 1499 ms]: Haan, sahi hai: chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, lambai hai isliye cm. Ab ek hisaab tum aur main saath mein karein?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 3196 ms · guard invented,screenmismatch]: Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Dekhte hain kitni tape lagegi. Cover rectangle hai, toh 2 × (lambai + chaudai) lagao: P = 2 × (24 + 18), kyunki chakkar mein lambai do baar milti hai, chaudai bhi do baar. Bracket pehle: 24 + 18 kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 42 centimetre  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 1199 ms]: Haan, 42 cm: ek lambai aur ek chaudai. Yeh toh aadha chakkar tha. Poore chakkar ke liye 2 × 42 kitna hoga?
  > card: Yeh toh aadha chakkar tha. Poore chakkar ke liye 2 × 42 kitna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 84  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch06-t01-s2:c1 · board up · ready 1545 ms]: Bilkul sahi. Dekho, rectangle ke chakkar mein lambai aur chaudai do-do baar aati hain. Toh poora jawab: cover ke liye 84 cm tape. Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > card: Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":24,"h":18,"mode":"perimeter","unit":"cm"}}

**child:** 130 m  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 · board up · ready 1127 ms]: Haan, bilkul theek, kyunki aadha chakkar 40 + 25 = 65 m, poora chakkar 2 × 65 = 130 m. Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > card: Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > screen: board compare@1 {} · ref {"template":"area-grid@1","params":{"w":40,"h":25,"mode":"perimeter","unit":"m"}}

**child:** neela card hai na  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 · board up · ready 2990 ms · guard screen]: Sahi jawab, kyunki laal 2 × (16 + 9) = 50 cm, neela 2 × (20 + 6) = 52 cm; neele ki border lambi. Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"compare@1","params":{"left":{"title":"laal card","items":["16 cm aur 9 cm"]},"right":{"title":"neela card","items":["20 cm aur 6 cm"]},"mark":{"side":"right"}}}

**child:** 121 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3376 ms · guard screen,flat,uncorrected]: 121 cm sahi nahi hai. Aao, isko ek naye dhang se dekhein. Parimap aur area ko jawab ki ikaai se pehchaano. Socho, dhaage ko scale par naapa, toh kinaara centimetre mein aaya; andar ke 1 cm wale square gine, toh area square centimetre mein. Kinaare ka sawaal ho toh bhujayein jodo. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":11,"h":11}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2496 ms]: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uske kinaare ki poori lambai kitne centimetre hai?
  > card: Ek bookmark 11 cm lamba, 2 cm chauda hai. Uske kinaare ki poori lambai kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":11,"h":2}}

**child:** 26 centimetre  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 (1 miss) · board up · ready 3302 ms · guard screen]: Bilkul sahi: kinaara centimetre mein naapte hain aur bhujayein judti hain: 11 + 2 + 11 + 2 = 26 cm. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":2,"mode":"perimeter","unit":"cm"}}

**child:** 44 cm  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1464 ms]: Haan, bilkul theek, kyunki chaar barabar bhujayein: 4 × 11 = 44 cm, aur jawab centimetre mein. Ab parimap ko kaam mein lagayenge: kabhi usse ulta ek bhuja nikalni hogi, kabhi chakkaron ki doori ya taar ka hisaab. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":11,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch06-t01-s3:ask:e1 · board up · ready 2696 ms · guard mustsay]: Is square ka parimap, yaani poora kinaara, 60 m hai. Yeh poora kinaara chaar barabar bhujaon se bana hai, do se nahi. Chaaron bhujayein barabar hain, toh 60 m chaaron mein barabar bat-ta hai. Is square ki ek bhuja kitni lambi hai?
  > card: Is square ki ek bhuja kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** 30 m  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 1898 ms]: 30 m sahi nahi hai. Ise ek alag tareeke se dekhte hain. Socho, ek poore chakkar mein har bhuja ek baar aati hai. Rectangle mein do lambai aur do chaudai hoti hain, aur square mein chaar barabar bhujayein. Toh ulta chalte hue, rectangle ka parimap aadha karo aur lambai ghatao; square ka parimap 4 se baanto. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s3:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s3:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2081 ms]: Ek rectangle talaab ke kinaare ek poora chakkar 90 m ka hai. Talaab 28 m lamba hai. Woh kitna chauda hai?
  > card: Ek rectangle talaab ke kinaare ek poora chakkar 90 m ka hai. Talaab 28 m lamba hai. Woh kitna chauda hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","side":"28 m","name":"chakkar 90 m"}}

**child:** 62 m  _(misconception)_

**Asha** [hint · beat s3:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s3:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 2523 ms]: 62 m nahi, yeh jawab theek nahi baitha. Poore chakkar mein do lambai aur do chaudai hain. Socho, aadhe chakkar mein kya aata hai, aur usmein se lambai nikal kar kya bachega. Jis 28 m lambe talaab ka poora chakkar 90 m hai, woh kitna chauda hai?
  > card: Ek rectangle talaab ke kinaare ek poora chakkar 90 m ka hai. Talaab 28 m lamba hai. Woh kitna chauda hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","side":"28 m","name":"chakkar 90 m"}}

**child:** 17 metres  _(correct)_

**Asha** [practice · beat s3:explain:e1 · check script:c6-maths-ch06-t01-s3:ask:e1 (1 miss) · board up · ready 1196 ms]: Bilkul sahi: 90 ka aadha 45 m, usme se 28 m lambai gayi, bache 17 m. Theek hai, ab wapas usi sawaal par chalte hain. Jis square ka parimap 60 m hai, uski ek bhuja kitni lambi hai?
  > card: Is square ki ek bhuja kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"area-grid@1","params":{"w":28,"h":17,"mode":"perimeter","unit":"m"}}

**child:** 15  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c6-maths-ch06-t01-s3:ask:e2 · board up · ready 1357 ms · guard mustsay]: Haan, bilkul theek, kyunki 60 m chaar barabar bhujaon mein: 60 ÷ 4 = 15 m. Ab ek rectangle: parimap 60 m, lambai 20 m. Poore chakkar mein do lambai aur do chaudai aati hain, toh aadhe chakkar mein ek lambai aur ek chaudai. Is rectangle ki chaudai kitni hai?
  > card: Is rectangle ki chaudai kitni hai?
  > screen: board shape@1 {} · ref {"template":"area-grid@1","params":{"w":15,"h":15,"mode":"perimeter","unit":"m"}}

**child:** 10 metres  _(correct)_

**Asha** [explain · beat s3:explain:e3 · board up · ready 1312 ms · guard mustsay]: Sahi jawab. Dekho, aadha chakkar 30 m, usme se lambai 20 m gayi, bache 10 m. Plot 12 m lamba, 8 m chauda hai, toh kinaara 2 × (12 + 8) = 40 m. Taar ₹10 per metre hai, aur kharcha sirf lagne wali taar ka. Par neeche wali bhuja mein 2 m ka gate hai, jahan taar nahi lagti. Gate kitne metre ka hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":20,"h":10,"mode":"perimeter","unit":"m"}}

**child:** do  _(correct)_

**Asha** [practice · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 · board up · ready 1040 ms]: Haan, sahi hai. Gate chhod ke, taar par kul kharcha kitne rupaye aayega?
  > card: Gate chhod ke, taar par kul kharcha kitne rupaye aayega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":8,"name":true,"trace":true,"mixup":"is bhuja mein 2 m ka gate"}}

**child:** ₹400  _(incorrect)_

**Asha** [hint · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 (1 miss) · board up · ready 1168 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ulta bhi soch sakte ho: poore 40 m ka kharcha nikalo, phir gate ke 2 m ka kharcha usmein se ghatao. 12 m lambe, 8 m chaude plot mein 2 m ka gate hai aur taar ₹10 per metre hai; gate chhod ke taar ka kharcha kitna hoga?
  > card: Gate chhod ke, taar par kul kharcha kitne rupaye aayega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":8,"name":true,"trace":true,"mixup":"is bhuja mein 2 m ka gate"}}

**child:** 380 rupaye  _(correct)_

**Asha** [repair · beat s3:explain:e3 · board up · ready 1281 ms]: Bilkul sahi: taar 40 − 2 = 38 m lagegi, aur ₹10 per metre se kharcha 38 × 10 = ₹380. Agla sawaal hum dono saath mein karein?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"38 m × ₹10 = ₹380"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step2 · board up · ready 2435 ms · guard invented]: Rani ek rectangle park ke teen chakkar daudti hai. Park 50 m lamba aur 30 m chauda hai. Saath mein uski doori nikaalte hain. Ek chakkar matlab park ka poora kinaara, ek baar: 1 chakkar = park ka parimap, kyunki Rani kinaare par daudti hai, park ke beech se nahi. Aadha chakkar matlab ek lambai aur ek chaudai. 50 + 30 kitna?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** eighty  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step3 · board up · ready 2675 ms · guard affirms]: Haan, 80 m: yeh aadha chakkar hua. Poora chakkar aadhe ka do guna hai. 2 × 80 kitna?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** 160  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c6-maths-ch06-t01-s3:ask:worked · board up · ready 2185 ms · guard affirms,long]: Haan, 160 m: yeh ek poora chakkar hua. Tumhari baari: Rani ne aise teen chakkar daude. Woh kul kitne metre daudi?
  > card: Tumhari baari: Rani ne aise teen chakkar daude. Woh kul kitne metre daudi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** 480  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c6-maths-ch06-t01-s3:c1 · board up · ready 1349 ms]: Haan, bilkul theek. Toh poora jawab: teen chakkar mein kul 480 m, kyunki ek chakkar park ka parimap hai, 160 m, aur teen chakkar uske teen guna. Ek square garden ke chaaron taraf kul 84 m baad lagi. Har bhuja par kitne metre baad lagi?
  > card: Ek square garden ke chaaron taraf kul 84 m baad lagi. Har bhuja par kitne metre baad lagi?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"3 × 160 = 480 m"}}

**child:** 21 m  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c6-maths-ch06-t01-s3:c2 · board up · ready 1292 ms]: Bilkul sahi. Dekho, 84 m baad chaar barabar bhujaon par baanti gayi: 84 ÷ 4 = 21 m. Ek khet 30 m lamba aur 20 m chauda rectangle hai. Taar ₹15 per metre milti hai. Khet ke chaaron taraf ek baar taar lagane mein kitne rupaye lagenge?
  > card: Ek khet 30 m lamba aur 20 m chauda rectangle hai. Taar ₹15 per metre milti hai. Khet ke chaaron taraf ek baar taar lagane mein kitne rupaye lagenge?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":21,"h":21,"mode":"perimeter","unit":"m"}}

**child:** 1500 rupees  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c6-maths-ch06-t01-s3:c3 · board up · ready 1219 ms]: Sahi jawab, kyunki kinaara 2 × (30 + 20) = 100 m hai, aur 100 metre taar ka daam ₹1500. Ek 70 cm lambi dori ko mod ke rectangle banaya, aur poori dori kinaare mein lag gayi. Rectangle 20 cm lamba hai. Uski chaudai kitni hai?
  > card: Ek 70 cm lambi dori ko mod ke rectangle banaya, aur poori dori kinaare mein lag gayi. Rectangle 20 cm lamba hai. Uski chaudai kitni hai?
  > screen: board shape@1 {} · ref {"template":"area-grid@1","params":{"w":30,"h":20,"mode":"perimeter","unit":"m"}}

**child:** 15 cm  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 2 ms]: Haan, sahi hai, kyunki 70 ka aadha 35 cm, usme se 20 cm lambai gayi, bache 15 cm. Chalo, ab poore paath se ek aakhri sawaal. Ek seedhe taar ko mod ke 27 cm lamba aur 9 cm chauda rectangle banana hai, bina kuch bachaaye. Taar kitne centimetre lambi honi chahiye?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":20,"h":15,"mode":"perimeter","unit":"cm"}}

**child:** 73 cm  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 1177 ms]: 73 cm sahi nahi hai. Taar chaaron bhujaon par mudti hai: dono lambai aur dono chaudai. Ek seedhe taar ko mod ke 27 cm lamba aur 9 cm chauda rectangle banana hai, bina kuch bachaaye. Taar kitne centimetre lambi honi chahiye?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","w":27,"h":9,"unit":"cm"}}

**child:** 73 cm  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1034 ms]: 73 cm nahi, yeh jawab theek nahi baitha. Iska jawab hai 72 cm, kyunki taar sirf kinaare par mudti hai: aadha chakkar 27 + 9 = 36 cm, aur poora chakkar 2 × 36 = 72 cm. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","w":27,"h":9,"unit":"cm","trace":true}}

**child:** jaise aapne samjhaya tha, waise hi kiya  _(no_evidence)_

**Asha** [wrap · ready 1852 ms]: Kuch baatein aasaan thi, kuch mein mehnat lagi. Aaj dekha ki parimap band shape ke poore kinaare ki lambai hai: har bhuja ek baar, andar ki jagah nahi. Phir rectangle ka parimap 2 × (lambai + chaudai) aaya, aur square ka 4 × bhuja. Aakhir mein parimap se kaam liya: square ki bhuja, rectangle ki chaudai, chakkaron ki doori aur taar ka kharcha nikala. Aaj ki padhai mein kuch aisa tha jo achha laga?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 1203 ms]: Har paath mein kuch naya hota hai. Aaj tumne 70 cm ki dori se ulta chalkar rectangle ki chaudai nikali. Aaj ke liye itna hi, phir milte hain.

## Agent


