# steering-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha, tumhari AI teacher hoon. Aaj fractions compare karenge—jaise cooking mein kaunsa hissa zyada. Tumhe cooking mein kya banana pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1590 ms]: Aaj hum do fraction mein se bada kaunsa hai, yeh pehchaanna seekhenge. Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 1731 ms]: Upar yeh rahi ek poori patti. 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Fraction ke neeche ka 4 matlab patti ke 4 barabar hisse. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 1935 ms · guard twoq]: Ek hi roti socho, pehle 4 log baantein, phir 8 log. Log badhe, toh har ek ke haath ka hissa kaisa hua, yeh socho.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 4084 ms]: Achha, isko Hindi mein bolti hoon. Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 3109 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Isko thoda doosri tarah se samajhte hain. Line dekho, 0 se 1 tak. Neeche ise 12 barabar hisson mein kaata hai. 12 ek bada number hai, par uska ek hissa zero ke bilkul paas ruk jaata hai. Hisse jitne zyada, har hissa utna chhota. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1912 ms]: Ek roti socho: 12 log baantein toh har kisi ko chhota sa hissa, do log baantein toh aadhi-aadhi. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1619 ms]: Is par doosri tasveer nahi ban paa rahi; jo board par hai, usi ko dekho. Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa hissa lamba, 1/8 wala ya 1/12 wala?
  > card: Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa hissa lamba, 1/8 wala ya 1/12 wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1}}

**child:** 1/12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 947 ms · guard uncorrected]: 1/12 sahi nahi hai. Line par upar ke hisse neeche walon se bade hain. Jiske hisse kam, uska ek hissa bada. Kaunsa hissa lamba, 1/8 wala ya 1/12 wala?
  > card: Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa hissa lamba, 1/8 wala ya 1/12 wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1}}

**child:** 1/12  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1272 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 1/8 hai, kyunki ek jitni dor mein 8 hisse 12 hisson se kam hain, toh 1/8 ka hissa 1/12 wale se lamba. Yeh hissa saaf hua?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1,"marks":[[1,8],[1,12]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2246 ms]: Iska jawab 1/8 hai, kyunki line par 1/12 ka mark zero ke zyada paas hai aur 1/8 ka usse aage, isliye 1/8 wala hissa lamba hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1,"marks":[[1,8],[1,12]]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 2710 ms]: Ab us sawaal par lautte hain jo humne pehle chhoda tha. Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 2281 ms]: Haan, pehle tum try karo. Lo, ab yeh dekho. Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 1975 ms]: Nahi, yeh jawab nahi hai. Is sawaal ka sahi jawab: chhota, kyunki dono patti barabar lambi hain, par upar wali 4 hisson mein hai, neeche wali 8 mein, isliye neeche ka hissa chhota hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2897 ms · guard mustsay,twoq]: Cricket ki baat bhi hogi, bas yeh mukabla khatam ho jaaye. Ab wahi patti, par 8 barabar hisse, toh ek hissa 1/8. Dono patti ek jitni lambi hain, isliye neeche ke hisse upar wale hisson ke theek neeche baithte hain. Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2117 ms · guard mustsay]: Neeche ke pehle do hisson par ungli rakho, aur dekho upar ki patti ka kitna hissa theek unke upar hai. Neeche ke pehle do 1/8 hisse milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2394 ms]: Ab wahi patti, par 8 barabar hisse, toh ek hissa 1/8. Dono patti ek jitni lambi hain, isliye neeche ke hisse upar wale hisson ke theek neeche baithte hain. Neeche ke pehle do 1/8 hisse milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [repair · beat s1:explain:e2 · board up · ready 1927 ms]: Is sawaal ka jawab 1/4 hai, kyunki neeche ke do 1/8 hisse milkar upar ke ek hisse jitne lambe hain, aur upar ka woh hissa 1/4 hai. Cricket mein tumhe kya karna sabse achha lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** catch pakadna  _(no_evidence · aside)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 2397 ms · guard mustsay]: Achha, toh tumhara favourite hai catch pakadna. Ab ek number line lo, 0 se 1 tak. Upar ise 3 barabar hisson mein kaata hai, neeche 7 mein. Line ka niyam simple hai: zero se jitna door, utna bada. Isi niyam se, 1/8 aur 1/4 ko kisi bhi line par rakho, toh 1/8 zero ke zyada paas rukega: 1/8 < 1/4. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 1/3  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1158 ms]: Haan, sahi hai. Dekho, 1/3 ka hissa 1/7 ke hisse se bada hai, toh 1/3 zero se aage jaakar rukta hai. Rahul aur Sana ke paas ek jaise chocolate bar hain. Rahul ko apne bar ka 1/8 mila, Sana ko apne ka 1/2. Bada hissa kiske paas hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2202 ms]: Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek hissa, kyunki upar ka number batata hai kitne hisse mile, aur ek-ek mile, toh ab baat sirf size ki hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2058 ms]: Phir dekho, kiska bar kitne hisson mein kata: upar wala Rahul ka, neeche wala Sana ka: Rahul ka bar 8 hisson mein, Sana ka sirf 2 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek hissa kitna bada hai.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 4078 ms · guard leak]: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana ko bada tukda mila  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1687 ms]: Bilkul sahi. Dekho, 8 bada number hai, par 8 hisson wale bar ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 1962 ms · guard leak,samecard,uncorrected]: 1/10 sahi nahi hai. Dono roti ek jaisi hain. Jitne kam log baantenge, har ek ko utna bada hissa milega. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** one fifth  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 852 ms]: Haan, sahi hai, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 998 ms · guard uncorrected]: 1/3, 1/6, 1/12 nahi, yeh jawab theek nahi baitha. Sirf neeche ke number dekho: teen, barah, chhe. Jiska neeche sabse bada, uska hissa sabse chhota. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis kram mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [repair · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 3094 ms · guard samecard]: Achha, ab pehle wale sawaal ko phir se dekhte hain. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 773 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 1/12, 1/6, 1/3 hai, kyunki poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s1:check:c2 · board up · ready 2268 ms]: Iska jawab 1/12, 1/6, 1/3 hai, kyunki ek hi poora 3, 6 aur 12 logon mein baanto: log jitne zyada, hissa utna chhota, isliye pehle 1/12, phir 1/6, aur aakhir mein 1/3. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1897 ms]: Yeh line 0 se 1 tak 3 barabar hisson mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Woh pehla mark 1/5 se bada hai ya chhota?
  > card: Yeh line 0 se 1 tak 3 barabar hisson mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Woh pehla mark 1/5 se bada hai ya chhota?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** bigger  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1287 ms]: Haan, sahi hai. Dekho, mark 1/3 hai; 3 mein kati line ka hissa 5 mein kati line ke hisse se bada, isliye mark 1/5 se bada. Agle khel mein neeche ka number same rahega aur upar ka badlega, toh ab hisse ginne honge.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 2693 ms · guard wrap,nochoice,wrap]: Theek hai, Riya. Tum chun sakti ho: aage badhein, chhota sa break lein, ya aaj ke liye ruk jaayein?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

## Agent


