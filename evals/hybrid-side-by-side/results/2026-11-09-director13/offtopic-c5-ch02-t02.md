# offtopic-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj fractions compare karenge—jaise cricket scores. Tumhe cooking ya cricket, kya zyada pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 3091 ms]: Socho, do ek jaise cake hain. Ek cake 4 barabar tukdon mein kata hai, doosra 8 barabar tukdon mein. Tumhe kisi ek cake se sirf ek tukda lena hai. Achha, Riya—ab cake socho: 4 tukdon wala ya 8 tukdon wala, ek tukda kahan bada hoga? Apna guess batao.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [reteach · ready 2618 ms]: 4 tukdon wale cake ka ek tukda bada hoga, kyunki wahi cake kam parts mein kata hai. 2/5 aur 2/3 mein kaunsa bada hai?

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2582 ms · guard mustsay]: Arre Riya, cricket mein sixer maara—wah, bat ne boundary ko chhutti de di! Yeh ek poori patti hai. Iske 4 barabar hisse hain, aur ek hissa rang wala hai, woh 1/4 hai. Neeche wala 4 batata hai ki poori patti kitne barabar hisson mein kati hai. Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 5693 ms · guard leak,long,uncorrected]: Nahi, yeh jawab nahi hai. Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain. Toh 8 bada number hai, par 1/8 chhota hissa hai. Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 2"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 3504 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Dono bottle ek jaisi hain. 1/7 aur 1/9 mein jiska neeche ka number chhota hai, uska hissa bada hai. Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {"labels":"1/7 | 1/9","numbers":"0 1 1/7 1/9"} · ref {"template":"fraction-line@1","params":{"dens":[7,9],"from":0,"to":1,"marks":[[1,7],[1,9]]}}

**child:** Ravi  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 1184 ms]: Bilkul sahi, Riya: tumne pehchana ki 1/7 mein barabar bottle ke bade hisse hote hain, kyunki ek jaisi bottle ka 1/7 hissa 1/9 hisse se bada hai, isliye Ravi ne zyada nikala. Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-line@1","params":{"dens":[7,9],"from":0,"to":1,"marks":[[1,7],[1,9]]}}

**child:** chhota  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1406 ms]: Haan, sahi hai, kyunki wahi patti 8 hisson mein bate toh har hissa chhota hota hai, 1/8 wala hissa 1/4 wale hisse ka aadha hai.
  > screen: board fraction-bars@1 {"labels":"1/4 | 1/8","numbers":"1/4 1/8"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3447 ms · guard mustsay]: Theek hai. Wah, tumne cricket mein sixer maara—bahut badhiya! Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/8  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 (1 miss) · board up · ready 3189 ms · guard samecard,uncorrected]: Nahi, yeh jawab nahi hai. Wahi patti ab 8 barabar hisson mein hai, aur ek rang wala hissa 1/8 hai. Pehle ka har hissa ab do tukdon mein bant gaya. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/8  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 (2 miss) · board up · ready 2409 ms · guard samecard,uncorrected]: Nahi, yeh jawab nahi hai. Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain. Toh 8 bada number hai, par 1/8 chhota hissa hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** 1/8  _(misconception)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1629 ms · guard mustsay,uncorrected]: 1/8 sahi nahi hai. Is sawaal ka jawab 1/4 hai, kyunki ek 1/4 hissa do 1/8 hisson ke barabar hai, isliye 1/4 bada hai. Yeh sankhya rekha 0 se 1 tak hai, aur is par 2 nishaan hain. Rekha par har fraction ki apni jagah hai: jo zero se jitna door, woh utna bada. Ek hi poore ke jitne zyada barabar hisse, uska pehla nishaan zero ke utna paas. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 6338 ms]: Arre Riya, kal cricket mein sixer maara—ball seedha boundary ke paar! Is baat par question ke turant baad wapas aayenge. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 3769 ms · guard mustsay,samecard]: Line par jo zero se zyada door, woh bada. Ek hi poore ke jitne zyada hisse, pehla nishaan zero ke utna paas. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 4729 ms · guard samecard,screenmismatch]: Dekho, yahi numbers ab patti par. Phir se dekho: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-bars@1 {"wholes":"2 equal bars","bar1":"3 equal parts, 0 shaded = ?","bar2":"7 equal parts, 0 shaded = ?","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/7  _(misconception)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 4185 ms · guard uncorrected]: 1/7 sahi nahi hai. Is sawaal ka jawab 1/3 hai, kyunki 1/3 wala hissa 1/7 wale hisse se bada hai, toh 1/3 zero se zyada door rukta hai. Waah, tumne cricket mein zabardast sixer maara! Do ek jaise chocolate bar hain. Rahul ko ek bar ka 1/6 milta hai, Sana ko doosre bar ka 1/3. Kise bada tukda milta hai? Diya hai: do ek jaise chocolate bar, Rahul ka hissa: 1/6, Sana ka hissa: 1/3. Dhoondhna hai: kise bada tukda milta hai. Chalo, aage dekhte hain.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2513 ms]: Cricket ke baare mein is sawaal ke baad baat karenge, pakka. Pehla kadam dekho. Dono bhinnon ka upar ka number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai ki kitne tukde mile, toh ab sirf tukde ka size dekhna hai. Yeh kadam saaf hai?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · ready 3093 ms]: Theek hai, ab Hindi mein. Dono mein upar 1 hai, matlab ek-ek tukda. Neeche 6 ya 3 batata hai kul kitne tukde. 3 tukdon ka tukda bada hota hai. Kaunsa bhinn bada?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 4279 ms · guard affirms,screenmismatch]: Ab doosra kadam. Ab dono ke tukde ka size likho: Rahul ka tukda 1/6, Sana ka tukda 1/3, kyunki rahul ka bar 6 barabar hisson mein kata hai aur Sana ka sirf 3 barabar hisson mein. Chalo, aage dekhte hain.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2877 ms]: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 2967 ms]: Theek hai, Riya. Tum khud karke batao.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** Sana hai na  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 4123 ms · guard nowhy,flat]: Haan, sahi hai, kyunki ek hi bar ke jitne zyada hisse, har hissa utna chhota, isliye 6 bada hote hue bhi 1/6 chhota tukda hai. Sana sahi. Tumhe kaise pata chala ki 1/3 ka tukda 1/6 se bada hai?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** mujhe laga aisa hi hoga  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 6915 ms]: Theek hai. Wah, mujhe bhi cricket kaafi pasand hai! Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {"labels":"Roti"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 2261 ms · guard leak,samecard,uncorrected]: 1/10 sahi nahi hai. Dono roti ek jaisi hain. Jis roti ke kam tukde hain, uska har tukda bada hota hai. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {"labels":"Roti"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/5  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1419 ms]: Bilkul sahi, Riya—tumne pehchana ki kam tukdon wali roti ka ek tukda bada hota hai, kyunki 5 tukdon wali roti ka har 1/5 tukda 10 tukdon wali roti ke 1/10 tukde se do guna hai. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board fraction-bars@1 {"labels":"1/3 | 1/12 | 1/6"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"1/10"},{"parts":5,"title":"1/5"}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 3642 ms]: Bilkul sahi, Riya—tumne bhinnon ko chhote se bade kram mein theek lagaya, kyunki ek hi poore ke 1/12 hisse sabse chhote hote hain, phir 1/6, aur 1/3 sabse bade. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > card: Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** 1/4 is bigger  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1571 ms · guard noconfirm]: Haan, sahi hai, kyunki ringed nishaan 1/4 hai, aur 1/4 do 1/8 ke barabar hai, isliye woh 1/8 se bada hai. Ab tak har baar ek hi tukda tha, jaise 1/4 aur 1/8, toh tukde ka size faisla karta tha. Ab dekhenge ki neeche ka number same ho, jaise 3/7 aur 5/7, tab kaise tulna karte hain. Ab aage chalte hain.
  > screen: board compare@1 {"labels":"ek hi tukda | neeche ka | number same","numbers":"1/4 3/7 1/8 5/7"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2736 ms]: Yeh patti 7 barabar hisson mein kati hai, toh har hissa 1/7 hai. Isme 3 hisse rang wale hain, yeh 3/7 hai. Upar wala 3 batata hai ki aise kitne hisse liye gaye. Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > card: Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"7 barabar hisse","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** 5 by 7  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 1406 ms]: Sahi, Riya, kyunki patti ke 7 barabar hisson mein se 5 rang wale hain, yaani 5/7. Tumne upar ke 5 rang wale hisse aur kul 7 barabar hisse pakde: bhinn 5/7. Tumne kaise jaana ki neeche 7 hi rahega?
  > screen: board fraction-bars@1 {"labels":"5/7","numbers":"5/7"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":5,"label":"5/7"}]}}

**child:** mujhe laga aisa hi hoga  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 8033 ms · guard affirms,mustsay]: Achha. Wahi patti, wahi 1/7 wale hisse. Ab 5 hisse rang wale hain, yeh 5/7 hai. Yahan bhi hisson ka size same hai, bas rang wale hisse zyada hain. Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > card: Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > screen: board fraction-parts@1 {"labels":"7 barabar hisse","numbers":"7 5"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":5,"whole":"bar"}}

**child:** yes  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2273 ms]: Nahi, yeh jawab nahi hai. Neeche ka 7 sirf hisse ka size batata hai, toh 2/7 aur 5/7 ke hisse ek hi size ke hain. 5/7 mein aise zyada hisse hain, isliye sankhya rekha par woh zero se zyada door hai aur bada hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"2/7 | 5/7","numbers":"0 1 2/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":5,"label":"5/7"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 3512 ms]: 2/7 aur 5/7 ke hisse ek hi size ke hain. 5/7 mein zyada hisse hain, isliye woh zero se door hai aur bada hai. Ek ribbon ke 10 barabar tukde hain. Zoya ne 3 tukde liye, Gopi ne 7. Zyada kiske paas hai, Zoya ke ya Gopi ke?
  > card: Ek ribbon ke 10 barabar tukde hain. Zoya ne 3 tukde liye, Gopi ne 7. Zyada kiske paas hai, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":5,"label":"5/7"}]}}

**child:** Gopi hai na  _(correct)_

**Asha** [probe · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2614 ms]: Haan, sahi hai, kyunki saare tukde ribbon ke 1/10 hain, aur Gopi ka 7/10, 3/10 se zyada hai. Dono ke tukde ek hi size ke hain; Gopi ne 7 tukde liye, Zoya ne 3. Riya, tumne kaise jaana ki Gopi ke paas zyada hai?
  > screen: board fraction-line@1 {"labels":"3/10 | 7/10","numbers":"0 1 3/10 7/10"} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":3,"label":"3/10"},{"num":7,"label":"7/10"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4464 ms · guard wrap,nochoice,wrap]: Theek hai, Riya—rukna chahti ho, samajh gaya. Chuno: padhai jaari rakhein, chhota break lein, ya aaj ke liye rok dein?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1}}

## Agent


