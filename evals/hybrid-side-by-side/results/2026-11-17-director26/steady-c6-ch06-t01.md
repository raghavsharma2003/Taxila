# steady-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1658 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. Ab tak samajh aaya?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1782 ms · guard mustsay]: Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 989 ms · guard screenmismatch]: Bilkul sahi: 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 3416 ms]: Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1682 ms]: Har bhuja 5 cm ki hai, aur hexagon ki bhujayein chhah hain. In dono baaton ko milakar socho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetres  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1447 ms · guard mustsay,screenmismatch]: Haan, bilkul theek: chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bagal ki bhuja 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1986 ms]: Is rectangle ko ek photo frame socho. Frame ki lakdi sirf kinaare par hoti hai, 6, 4, 6 aur 4; beech mein photo hoti hai. Lakdi ki poori lambai parimap hai, aur photo ki jagah area. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1055 ms]: Bilkul sahi, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1819 ms]: Kyari ki baad ko seedha kholo toh aisi dikhegi: 7 m, 9 m aur 12 m, ek ke baad ek. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2192 ms]: Pehla kadam dekho. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 4207 ms · guard quiz]: Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 1668 ms]: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1271 ms · guard screenmismatch]: Bilkul sahi. Dekho, baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m lambi baad. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1837 ms]: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3156 ms · guard praise,affirms,samecard]: Haan, pehle tum try karo.
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 26 m hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2117 ms]: Haan, bilkul theek: chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 28 centimetre  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2971 ms · guard flat]: Sahi jawab, kyunki parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yahan tak theek hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2416 ms · guard mustsay]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · board up · ready 2693 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Ab wapas apne kaam par. Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2579 ms]: Bilkul, ise doosre, aasaan shabdon mein bolti hoon. Ek darwaaza socho: upar aur neeche ki bhuja ek jitni lambi, daayein aur baayein ki bhi ek jitni. Yahan bhi wahi baat hai: 10 m wali bhujayein do hain aur 6 m wali bhi do. Ek poora chakkar inhi chaar bhujaon se banta hai. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 m hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 3102 ms · guard mustsay,long]: Bilkul sahi: 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 2163 ms]: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2360 ms · guard uncorrected]: 17 m sahi nahi hai. Ise ek alag tareeke se dekhte hain. Cheenti ek kone se chalti hai aur chalte-chalte metre ginti jaati hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha chakkar. Lambai + chaudai yahin tak hai. Jis kone se chali thi, woh abhi do bhujayein door hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2468 ms]: Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod ke do barabar hisse karo. Ek hisse mein bas ek lambai aur ek chaudai aati hai; lambai + chaudai mude hue dhaage jitna hai, poore dhaage jitna nahi. Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":40,"h":25}}

**child:** 54 metre  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 1596 ms]: Haan, bilkul theek: do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Theek hai, ab wapas usi sawaal par chalte hain. 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (2 miss) · board up · ready 2026 ms · guard uncorrected]: 17 m nahi, yeh jawab theek nahi baitha. Pehle bracket: 12 aur 5 jodo. Phir us jod ka do guna karo. Is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 2847 ms · guard mustsay,flat]: Bilkul sahi, kyunki aadha chakkar 12 + 5 = 17 m, aur uska do guna: 2 × 17 = 34 m. Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh cm mein aayega, square cm mein nahi. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 2176 ms]: Square ko aisa rectangle maano jiski lambai bhi 6 cm hai aur chaudai bhi. Toh pichhla formula yahan bhi chalega: 2 × (6 + 6), wahi chaar bhujayein. Yeh kinaare ki lambai hai, isliye jawab centimetre mein, square centimetre mein nahi. Ek bhuja 6 cm hai, toh chaaron bhujaon ki kul lambai kitni hai?
  > card: Ek bhuja 6 cm hai, toh chaaron bhujaon ki kul lambai kitni hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 24 centimetre  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 1143 ms]: Sahi jawab. Dekho, chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, lambai hai isliye cm. Ek notebook ka cover rectangle hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Kitni tape lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2337 ms]: Pehla kadam dekho. Cover rectangle hai, toh 2 × (lambai + chaudai) lagao: P = 2 × (24 + 18), kyunki chakkar mein lambai do baar milti hai, chaudai bhi do baar. Yeh kadam samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 3492 ms · guard leak,quiz,invented,long]: Bracket pehle: 24 + 18 = 42 cm, kyunki ek lambai aur ek chaudai jodne se aadha chakkar milta hai, aur poora chakkar usi aadhe ka do guna hai. Yeh kadam saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 2622 ms]: Yeh toh aadha chakkar tha. Poore chakkar ke liye 2 × 42 kitna hoga?
  > card: Yeh toh aadha chakkar tha. Poore chakkar ke liye 2 × 42 kitna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 42 cm  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked (1 miss) · board up · ready 5232 ms · guard uncorrected]: 42 cm sahi nahi hai. 42 ko do baar jodo: 42 + 42. Poore chakkar ke liye 2 × 42 kitna hoga?
  > card: Yeh toh aadha chakkar tha. Poore chakkar ke liye 2 × 42 kitna hoga?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** mujhe lagta hai 84 cm  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch06-t01-s2:c1 · board up · ready 1909 ms]: Bilkul sahi: rectangle ke chakkar mein lambai aur chaudai do-do baar aati hain. Toh poora jawab: cover ke liye 84 cm tape. Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > card: Zoya ne 40 m lambe, 25 m chaude playground ka ek chakkar daud ke kaha ki 65 m hua. Sahi mein woh kitne metre daudi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":24,"h":18,"mode":"perimeter","unit":"cm"}}

**child:** 130 metre  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 · board up · ready 1176 ms]: Haan, bilkul theek, kyunki aadha chakkar 40 + 25 = 65 m, poora chakkar 2 × 65 = 130 m. Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > card: Laal card 16 cm lamba, 9 cm chauda hai, aur neela card 20 cm lamba, 6 cm chauda. Dono ke poore kinaare par golden border lagani hai. Kiski border lambi hogi, laal ki ya neele ki?
  > screen: board compare@1 {} · ref {"template":"area-grid@1","params":{"w":40,"h":25,"mode":"perimeter","unit":"m"}}

**child:** neela card  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 · board up · ready 2018 ms · guard screen]: Sahi jawab. Dekho, laal 2 × (16 + 9) = 50 cm, neela 2 × (20 + 6) = 52 cm; neele ki border lambi. Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Tile ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"compare@1","params":{"left":{"title":"laal card","items":["16 cm aur 9 cm"]},"right":{"title":"neela card","items":["20 cm aur 6 cm"]},"mark":{"side":"right"}}}

**child:** 44 cm  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1466 ms]: Haan, sahi hai: chaar barabar bhujayein: 4 × 11 = 44 cm, aur jawab cm mein. Ab parimap ko kaam mein lagayenge: kabhi usse ulta ek bhuja nikalni hogi, kabhi chakkaron ki doori ya taar ka hisaab. Ab tak samajh aaya?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":11,"h":11,"mode":"perimeter","unit":"cm"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch06-t01-s3:ask:e1 · board up · ready 2079 ms]: Is square ka parimap, yaani poora kinaara, 60 m hai, aur yeh chaar barabar bhujaon mein baanta gaya hai. Ek bhuja chahiye toh 60 ko 4 se baanto. 2 se nahi, bhujayein chaar hain. Is square ki ek bhuja kitni lambi hai?
  > card: Is square ki ek bhuja kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** 15 metres  _(correct)_

**Asha** [explain · beat s3:explain:e2 · board up · ready 1324 ms · guard mustsay,screenmismatch]: Bilkul sahi, kyunki 60 m chaar barabar hisson mein: 60 ÷ 4 = 15 m. Ab ek rectangle: parimap 60 m, lambai 20 m. Aadhe chakkar mein ek lambai aur ek chaudai aati hai. Pehle aadha chakkar nikalo, phir usme se lambai hatao. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"area-grid@1","params":{"w":15,"h":15,"mode":"perimeter","unit":"m"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s3:explain:e2 · check script:c6-maths-ch06-t01-s3:ask:e2 · board up · ready 2026 ms]: Aadhe chakkar se lambai nikaal ke kitne metre bache?
  > card: Aadhe chakkar se lambai nikaal ke kitne metre bache?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","side":"20 m","name":"parimap 60 m"}}

**child:** 10  _(correct)_

**Asha** [explain · beat s3:explain:e3 · board up · ready 1205 ms · guard mustsay]: Haan, bilkul theek: aadha chakkar 30 m, usme se lambai 20 m gayi, bache 10 m. Plot 12 m lamba, 8 m chauda hai, toh kinaara 2 × (12 + 8) = 40 m. Taar ₹10 per metre hai, aur kharcha sirf lagne wali taar ka. Par neeche wali bhuja mein 2 m ka gate hai, jahan taar nahi lagti. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":20,"h":10,"mode":"perimeter","unit":"m"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 · board up · ready 2100 ms]: Gate chhod ke, taar par kul kharcha kitne rupaye aayega?
  > card: Gate chhod ke, taar par kul kharcha kitne rupaye aayega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":8,"name":true,"trace":true,"mixup":"is bhuja mein 2 m ka gate"}}

**child:** 380 rupees  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:problem · board up · ready 1054 ms]: Sahi jawab, kyunki taar 40 − 2 = 38 m lagegi, aur ₹10 per metre se kharcha 38 × 10 = ₹380. Rani ek rectangle park ke teen chakkar daudti hai. Park 50 m lamba aur 30 m chauda hai. Woh kul kitna daudti hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"38 m × ₹10 = ₹380"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 3519 ms · guard long]: Pehla kadam dekho. Ek chakkar matlab park ka poora kinaara, ek baar: 1 chakkar = park ka parimap, kyunki Rani kinaare par daudti hai, park ke beech se nahi. Yeh kadam saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step2 · board up · ready 1953 ms]: Ab doosra kadam. Park rectangle hai, toh 2 × (lambai + chaudai): P = 2 × (50 + 30), kyunki chakkar mein 50 bhi do baar aata hai aur 30 bhi. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s3:worked:worked:step2 · board up · ready 3166 ms · guard quiz]: Rani ka chakkar bhuja-bhuja likho: 50, 30, 50, 30. Isme 50 aur 30 ki jodi do baar aati hai, isliye 2 × (50 + 30). Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step3 · board up · ready 6097 ms · guard affirms]: Ab teesra kadam. Bracket ke andar jodo: 50 + 30 = 80 m, kyunki ek lambai aur ek chaudai Rani ko saamne wale kone, yaani aadhe chakkar tak, le jaati hain; poora chakkar uska do guna. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step4 · board up · ready 3152 ms · guard affirms]: Ab agla kadam. Aadhe chakkar ko do baar lo: 2 × 80 = 160 m, kyunki do aadhe chakkar milke ek poora chakkar. Yeh kadam samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step5 · board up · ready 4496 ms · guard affirms]: Teeno chakkar ek jaise hain, toh 160 ko 3 se guna karo: 3 chakkar = 3 × 160 m, kyunki har chakkar utna hi lamba hai, 160 m. Yeh kadam saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked · check script:c6-maths-ch06-t01-s3:ask:worked · board up · ready 1989 ms]: Tumhari baari: 3 × 160 kitna hota hai?
  > card: Tumhari baari: 3 × 160 kitna hota hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** 480 metre  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c6-maths-ch06-t01-s3:c1 · board up · ready 976 ms]: Bilkul sahi. Dekho, ek chakkar park ka parimap hai, 160 m, aur teen chakkar uske teen guna. Toh poora jawab: teen chakkar mein kul 480 m. Ek square garden ke chaaron taraf kul 84 m baad lagi. Har bhuja par kitne metre baad lagi?
  > card: Ek square garden ke chaaron taraf kul 84 m baad lagi. Har bhuja par kitne metre baad lagi?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"3 × 160 = 480 m"}}

**child:** 21 metres  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c6-maths-ch06-t01-s3:c2 · board up · ready 1193 ms]: Haan, bilkul theek, kyunki 84 m baad chaar barabar bhujaon par baanti gayi: 84 ÷ 4 = 21 m. Ek khet 30 m lamba aur 20 m chauda rectangle hai. Taar ₹15 per metre milti hai. Khet ke chaaron taraf ek baar taar lagane mein kitne rupaye lagenge?
  > card: Ek khet 30 m lamba aur 20 m chauda rectangle hai. Taar ₹15 per metre milti hai. Khet ke chaaron taraf ek baar taar lagane mein kitne rupaye lagenge?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":21,"h":21,"mode":"perimeter","unit":"m"}}

**child:** 1500 rupees  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c6-maths-ch06-t01-s3:c3 · board up · ready 4643 ms · guard leak,long,noconfirm]: Sahi jawab, kyunki kinaara 2 × (30 + 20) = 100 m hai, aur 100 metre taar ka daam ₹1500. Ek 70 cm lambi dori ko mod ke rectangle banaya, aur poori dori kinaare mein lag gayi. Rectangle 20 cm lamba hai. Uski chaudai kitni hai?
  > card: Ek 70 cm lambi dori ko mod ke rectangle banaya, aur poori dori kinaare mein lag gayi. Rectangle 20 cm lamba hai. Uski chaudai kitni hai?
  > screen: board shape@1 {} · ref {"template":"area-grid@1","params":{"w":30,"h":20,"mode":"perimeter","unit":"m"}}

**child:** 50 cm  _(misconception)_

**Asha** [hint · beat s3:check:c3 · check script:c6-maths-ch06-t01-s3:c3 (1 miss) · board up · ready 1927 ms]: 50 cm sahi nahi hai. Pehle 70 ka aadha lo, usme ek lambai aur ek chaudai hai. Phir 20 nikal do. 70 cm ki poori dori se bane 20 cm lambe rectangle ki chaudai kitni hai?
  > card: Ek 70 cm lambi dori ko mod ke rectangle banaya, aur poori dori kinaare mein lag gayi. Rectangle 20 cm lamba hai. Uski chaudai kitni hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","side":"20 cm","name":"dori 70 cm"}}

**child:** mujhe lagta hai 15 cm  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 709 ms]: Haan, sahi hai, kyunki 70 ka aadha 35 cm, usme se 20 cm lambai gayi, bache 15 cm. Chalo, ab poore paath se ek aakhri sawaal. Ek seedhe taar ko mod ke 27 cm lamba aur 9 cm chauda rectangle banana hai, bina kuch bachaaye. Taar kitne centimetre lambi honi chahiye?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":20,"h":15,"mode":"perimeter","unit":"cm"}}

**child:** 71 cm  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1106 ms]: 71 cm nahi, yeh jawab theek nahi baitha. Iska jawab hai 72 cm, kyunki taar sirf kinaare par mudti hai: aadha chakkar 27 + 9 = 36 cm, aur poora chakkar 2 × 36 = 72 cm. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","w":27,"h":9,"unit":"cm","trace":true}}

**child:** shayad gin ke  _(no_evidence)_

**Asha** [wrap · ready 1497 ms]: Aaj ki baat yeh thi ki parimap kisi band shape ke poore kinaare ki lambai hai, jismein har bhuja ek baar judti hai aur andar ki jagah nahi aati. Rectangle mein lambai aur chaudai do-do baar aati hain, isliye uska parimap 2 × (lambai + chaudai) hai, aur square ka 4 × bhuja. Parimap se ulta square ki bhuja nikalti hai, aur lambai bhi pata ho toh rectangle ki chaudai, aur parimap se hi chakkaron ki doori aur taar ka kharcha nikalta hai. Aaj ki padhai mein kuch aisa tha jo achha laga?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [wrap · ready 994 ms]: Hmm, main samajh gayi. Aaj tumne pehle khet ka parimap joda, phir taar ka kharcha nikala. Aaj ke liye itna hi, phir milte hain.

## Agent


