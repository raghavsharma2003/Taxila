# steering-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Hi Riya, main Asha, tumhari AI teacher. Aaj fractions compare karenge. Tumhe cooking mein kaunsa dish banana pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 3571 ms]: Aaj hum do bhinn mein se bada kaunsa hai, yeh pehchaanna seekhenge. Socho, do bilkul ek jaise cake. Ek ke 4 barabar tukde kiye, doosre ke 8. Tumhe bas ek tukda milega, kisi bhi cake se.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2845 ms]: Upar yeh rahi ek poori patti. 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Bhinn ke neeche ka 4 matlab patti ke 4 barabar tukde. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 2296 ms · guard twoq]: Ek hi roti socho, pehle 4 log baantein, phir 8 log. Log badhe, toh har ek ke haath ka tukda kaisa hua, yeh socho.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3461 ms]: Achha, isko Hindi mein bolti hoon. Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 4320 ms · guard leak,flat,uncorrected]: Nahi, yeh jawab nahi hai. Rekha dekho, 0 se 1 tak. Neeche ise 12 barabar hisson mein kaata hai. 12 ek bada number hai, par uska ek hissa zero ke bilkul paas ruk jaata hai. Hisse jitne zyada, har tukda utna chhota. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2849 ms]: Ek roti socho: 12 log baantein toh har kisi ko chhota sa tukda, do log baantein toh aadhi-aadhi. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2388 ms]: Dekho, yeh do barabar pattiyaan hain: ek 8 barabar hisson mein, aur ek 12 barabar hisson mein. Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa tukda lamba, 1/8 wala ya 1/12 wala?
  > card: Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa tukda lamba, 1/8 wala ya 1/12 wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1}}

**child:** 1/12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 2596 ms · guard leak,uncorrected]: 1/12 sahi nahi hai. Rekha par upar ke hisse neeche walon se bade hain. Jiske hisse kam, uska ek hissa bada. Kaunsa tukda lamba, 1/8 wala ya 1/12 wala?
  > card: Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa tukda lamba, 1/8 wala ya 1/12 wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1}}

**child:** 1/12  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1418 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 1/8 hai, kyunki ek jitni dor mein 8 hisse 12 hisson se kam hain, toh 1/8 ka hissa 1/12 wale se lamba. Yeh hissa saaf hua?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1,"marks":[[1,8],[1,12]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 4571 ms · guard praise,affirms]: Iska jawab 1/8 hai, kyunki ek jitni dor mein 8 hisse 12 hisson se kam hain, toh 1/8 ka hissa 1/12 wale se lamba. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1,"marks":[[1,8],[1,12]]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 3542 ms]: Phir se dekho: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 2878 ms]: Haan, pehle tum try karo — Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 3781 ms · guard praise,affirms,uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka sahi jawab: chhota, kyunki dono patti barabar lambi hain, par upar wali 4 hisson mein hai, neeche wali 8 mein, isliye neeche ka hissa chhota hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 6283 ms · guard mustsay,long,twoq]: Cricket ki baat bhi hogi, bas yeh mukabla khatam ho jaaye. Ab wahi patti, par 8 barabar hisse, toh ek hissa 1/8. Dono patti ek jitni lambi hain, isliye neeche ke hisse upar wale hisson ke theek neeche baithte hain. Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa bhinn banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa bhinn banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 4661 ms · guard mustsay,twoq]: Neeche ke pehle do hisson par ungli rakho, aur dekho upar ki patti ka kitna hissa theek unke upar hai. Woh milkar upar wali patti ka kaunsa bhinn banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa bhinn banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 4/1  _(incorrect)_

**Asha** [repair · beat s1:explain:e2 · board up · ready 1522 ms]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 1/4 hai, kyunki neeche ke do 1/8 hisse milkar upar ke ek hisse jitne lambe hain, aur upar ka woh hissa 1/4 hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [repair · beat s1:explain:e2 · board up · ready 3952 ms]: Cricket mein tumhe kya karna sabse achha lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** catch pakadna  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 2690 ms · guard mustsay]: Oh, catch. Achha. Ab ek sankhya rekha lo, 0 se 1 tak. Upar ise 3 barabar hisson mein kaata hai, neeche 7 mein. Rekha ka niyam simple hai: zero se jitna door, utna bada. Isi niyam se, 1/8 aur 1/4 ko kisi bhi rekha par rakho, toh 1/8 zero ke zyada paas rukega: 1/8 < 1/4. Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** ek bata teen  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2697 ms · guard noconfirm]: Haan, sahi hai, kyunki 1/3 ka hissa 1/7 ke hisse se bada hai, toh 1/3 zero se aage jaakar rukta hai. Rahul aur Sana ke paas ek jaise chocolate bar hain. Rahul ko apne bar ka 1/8 mila, Sana ko apne ka 1/2. Bada tukda kiske paas hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3207 ms]: Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai kitne tukde mile, aur ek-ek mile, toh ab baat sirf size ki hai. Yeh kadam samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3089 ms]: Phir dekho, kiska bar kitne hisson mein kata: upar wala Rahul ka, neeche wala Sana ka: Rahul ka bar 8 hisson mein, Sana ka sirf 2 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek tukda kitna bada hai.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 6586 ms · guard leak]: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1662 ms]: Bilkul sahi. Dekho, 8 bada number hai, par 8 hisson wale bar ka tukda chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Toh poora jawab: Sana ko mila, 1/2 wala tukda. Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 3398 ms · guard leak,samecard,uncorrected]: 1/10 sahi nahi hai. Dono roti ek jaisi hain. Jitne kam log baantenge, har ek ko utna bada tukda milega. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/5 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2678 ms]: Haan, sahi hai, kyunki 5 tukdon wali roti ka 1/5, 10 tukdon wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/12 1/6 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1782 ms]: Haan, bilkul theek. Dekho, poora ek ho toh 1/12 ke tukde sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh rekha 0 se 1 tak 3 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/5 se bada hai ya chhota?
  > card: Yeh rekha 0 se 1 tak 3 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/5 se bada hai ya chhota?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** bada hai  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1768 ms · guard noconfirm]: Sahi jawab: woh nishaan 1/3 hai, aur 3 hisson wala tukda 5 hisson wale tukde se bada hota hai, isliye woh 1/5 se bada. Ab tak har baar sirf ek tukda tha, toh tukde ka size hi sab tay karta tha. Agla khel alag hai: neeche ka number same, upar ka alag.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 5406 ms · guard wrap]: Theek hai Riya, tum thak gayi ho. Chuno: jaari rakhein, thodi der rukhein, ya aaj ke liye band karein?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

## Agent


