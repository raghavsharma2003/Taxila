# steering-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Hi Riya! Main Asha, tumhari AI teacher. Aaj fractions compare karenge—jaise cricket mein kaunsi innings zyada. Tumhe cooking pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1794 ms]: Aaj hum do fraction mein se bada kaunsa hai, yeh pehchaanna seekhenge. Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2393 ms]: Upar yeh rahi ek poori patti. 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Fraction ke neeche ka 4 matlab patti ke 4 barabar hisse. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 1919 ms · guard twoq]: Ek hi roti socho, pehle 4 log baantein, phir 8 log. Log badhe, toh har ek ke haath ka hissa kaisa hua, yeh socho.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 1783 ms]: Achha, isko Hindi mein bolti hoon. Neeche usi lambai ki doosri patti 8 barabar hisson mein kati hai. Iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche usi lambai ki doosri patti 8 barabar hisson mein kati hai. Iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 3263 ms · guard long,uncorrected]: Nahi, yeh jawab nahi hai. Isko thoda doosri tarah se samajhte hain. Socho, do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 walon ko chhota hissa milta hai. Barabar hisse jitne zyada, har hissa utna chhota. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1938 ms]: Bada number dekh kar mat socho ki hissa bada hoga; hisse zyada hon toh har hissa chhota hota hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2059 ms]: Dekho, pehle mein 9 barabar tukde hain, aur doosre mein 11 barabar tukde hain. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa bada hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 1/11  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 937 ms · guard uncorrected]: 1/11 sahi nahi hai. Dono dor ek jitni lambi hain; socho ki kis dor par zyada baar kainchi chali. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa bada hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 1/11  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1385 ms · guard screenmismatch,uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 1/9 hai, kyunki 9 hisse 11 se kam hain, toh 9 wali dor ka ek hissa, 1/9, 11 wali ke 1/11 se bada hai. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 3299 ms · guard praise,affirms]: Patti par upar ka pehla hissa neeche ke pehle hisse se aage tak jaata hai, isliye 1/9 wala hissa bada hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 2242 ms]: Ab us sawaal par lautte hain jo humne pehle chhoda tha. Neeche usi lambai ki doosri patti 8 barabar hisson mein kati hai. Iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche usi lambai ki doosri patti 8 barabar hisson mein kati hai. Iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 2024 ms]: Haan, pehle tum try karo.
  > card: Neeche usi lambai ki doosri patti 8 barabar hisson mein kati hai. Iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 2256 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka sahi jawab: chhota, kyunki dono patti barabar lambi hain, par upar wali 4 hisson mein hai, neeche wali 8 mein, isliye neeche ka hissa chhota hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3021 ms · guard mustsay,ask]: Cricket ki baat bhi hogi, bas yeh hissa poora ho jaaye. Ab ek aur patti, utni hi lambi, par 8 barabar hisson mein, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, isliye inhe seedha upar-neeche milaa sakte ho. Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2996 ms · guard mustsay,twoq]: Neeche ke pehle do hisson par ungli rakho, aur dekho upar ki patti ka kitna hissa theek unke upar hai. Neeche ke pehle do 1/8 hisse milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 4/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 (1 miss) · board up · ready 1093 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Ab ek aur patti, utni hi lambi, par 8 barabar hisson mein, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, isliye inhe seedha upar-neeche milaa sakte ho. Neeche ke pehle do 1/8 hisse milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** upar ka ek hissa  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1950 ms · guard mustsay]: Haan, sahi hai, kyunki neeche ke do 1/8 hisse milkar upar ke ek hisse ke barabar hain, aur upar ka woh hissa 1/4 hai. Cricket mein tumhe kya karna sabse achha lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** catch pakadna  _(no_evidence · aside)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 2383 ms]: Achha, toh tumhara favourite hai catch pakadna. Ab ek number line lo, 0 se 1 tak: upar 3 barabar gap, neeche 7. Line ka niyam simple hai: zero se jitna door, utna bada. Toh 1/8 aur 1/4 ko kisi bhi line par rakho, 1/8 zero ke zyada paas rukega, yaani 1/8 chhota hai. Ab wapas apne kaam par aate hain. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** ek bata teen  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2448 ms]: Bilkul sahi. Dekho, 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Ab ek number line lo, 0 se 1 tak: upar 3 barabar gap, neeche 7. Line ka niyam simple hai: zero se jitna door, utna bada. Toh 1/8 aur 1/4 ko kisi bhi line par rakho, 1/8 zero ke zyada paas rukega, yaani 1/8 chhota hai. Rahul aur Sana ke paas ek-ek chocolate hai, dono bilkul ek jaisi. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Bada hissa kiske paas hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3548 ms · guard long]: Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek hissa, kyunki upar ka number batata hai kitne hisse mile, aur ek-ek mile, toh ab baat sirf size ki hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2507 ms]: Ab doosra kadam. Upar wali patti Rahul ki chocolate hai, neeche wali Sana ki. Ab dekho, kiski chocolate kitne hisson mein kati: Rahul ki chocolate 8 hisson mein, Sana ki sirf 2 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek hissa kitna bada hai.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3427 ms]: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1131 ms]: Haan, sahi hai. Dekho, 8 bada number hai, par 8 hisson wali chocolate ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 2121 ms · guard leak]: 1/10 sahi nahi hai. Dono roti ek jaisi hain. Jitne kam log baantenge, har ek ko utna bada hissa milega. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** one fifth  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1470 ms]: Bilkul sahi, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/12 1/6 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1806 ms]: Haan, bilkul theek. Dekho, poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pehle aayega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 974 ms · guard noconfirm]: Sahi jawab: mark 1/3 hai, aur 1/3 ka gap 1/5 ke gap se bada hai, isliye 1/5 pehle aata hai. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3935 ms · guard wrap,wrap]: Theek hai Riya, tum thak gayi ho. Ab chuno: aage badhein, thodi der rukein, ya aaj ke liye rok dein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

## Agent


