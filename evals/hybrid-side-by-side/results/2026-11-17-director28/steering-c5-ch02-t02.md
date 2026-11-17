# steering-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1807 ms]: Aaj hum do fraction mein se bada kaunsa hai, yeh pehchaanna seekhenge. Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai. Ab tak samajh aaya?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 1007 ms]: Haan, ise doosre shabdon mein samjhaati hoon. Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. Is patti mein kitne barabar hisse hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** 6  _(incorrect)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 1908 ms · guard negates]: Is patti mein 4 barabar hisse hain. Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3882 ms · guard affirms]: Achha, isko aur aasaan karke bolti hoon. Pehli patti ke rangin hisse ke theek neeche dekho, aur doosri patti ke jo hisse us jagah mein aate hain, unhe gino. Doosri patti ka ek hissa, pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1952 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Ise ek alag tareeke se dekhte hain. Socho, do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 walon ko chhota hissa milta hai. Barabar hisse jitne zyada, har hissa utna chhota. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2014 ms]: Pizza party socho: jitne zyada dost aate hain, pizza utne zyada slice mein katta hai, aur har dost ka slice utna chhota ho jaata hai. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"title":"Roti"},{"parts":10,"title":"Roti"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 3515 ms · guard samecard]: Dono dor yahan do ek jaise gol ban gayi hain, ek 9 barabar hisson mein aur doosra 11 mein. Dono gol ka ek-ek hissa milaa lo. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 1/9  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1082 ms · guard uncorrected]: 1/9 nahi, yeh jawab theek nahi baitha. Dono dor ek jitni lambi hain; socho ki kis dor par zyada baar kainchi chali. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** ek bata gyarah  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 1854 ms]: Haan, bilkul theek: 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 1753 ms]: Haan, pehle tum try karo.
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** smaller than the first strip's part  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1915 ms · guard mustsay]: Sahi jawab, kyunki dono patti barabar lambi hain, par doosri 8 hisson mein kati hai aur pehli sirf 4 mein. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Is patti ka ek hissa kaunsa fraction hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** one eighth  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1997 ms · guard affirms]: Haan, sahi hai. Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 4/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 (1 miss) · board up · ready 1040 ms · guard twoq]: 4/1 sahi nahi hai. Do 1/8 hisson ka sira dekho, aur dekho pehli patti mein usi jagah tak kaunsa hissa khatam hota hai. Doosri patti ke pehle do 1/8 hisse milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** upar ka ek hissa  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2053 ms · guard long]: Haan, bilkul theek: 8 hisson wali patti ke do 1/8 hisse milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Patti mein dekha tha ki 1/8 chhota hai. Number line par chhota fraction zero ke zyada paas rukta hai, kyunki line par zero se jitna door, utna bada. Is line par, 0 se 1 tak, upar 3 barabar gap hain aur neeche 7. Line ke neeche kitne barabar gap hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 6758 ms · guard twoq]: Line ke neeche 7 barabar gap hain. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1104 ms]: Sahi jawab. Dekho, 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Ek sawaal kadam-kadam, milkar hal karein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 5735 ms · guard leak,invented]: Cricket ki baat bhi karenge, bilkul. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Saath mein dono hisse milate hain. Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek hissa, kyunki upar wala number mile hue hisse ginta hai. Kiski chocolate zyada hisson mein kati, Rahul ki ya Sana ki?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** Rahul ki zyada  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3338 ms · guard leak]: Haan, Rahul ki 8 hisson mein kati, kyunki 1/8 ka neeche wala number 8 hai. Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** Rahul  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked (1 miss) · board up · ready 2125 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Dono chocolate ek jitni hain; 8 hisson wali chocolate ka ek hissa aur 2 hisson wali chocolate ka ek hissa milaa kar dekho. Rahul ko chocolate ka 1/8 mila aur Sana ko 1/2, toh bada hissa kisko mila?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1200 ms]: Haan, bilkul theek: 8 bada number hai, par 8 hisson wali chocolate ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 3169 ms · guard leak]: 1/2 aadhi chocolate hai, aur aadhi chocolate banane ke liye 1/8 jaise chaar hisse jodne padte hain. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2379 ms]: Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2072 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Theek hai, ab wahin se aage badhte hain jahan ruke the. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 2243 ms · guard leak,uncorrected]: 1/10 sahi nahi hai. Dono roti ek jaisi hain. Board par dono roti ka ek-ek hissa dekho, aur socho kis hisse mein roti zyada hai. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/5 wala  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2610 ms]: Haan, bilkul theek: 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 2364 ms · guard leak,uncorrected]: 1/3, 1/6, 1/12 nahi, yeh jawab theek nahi baitha. Teeno patti ek jitni lambi hain; har patti ka ek hissa dekho aur socho kaunsa sabse chhota hai, kaunsa sabse bada. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis order mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 1346 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 1/12, 1/6, 1/3 hai, kyunki poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:check:c2 · board up · ready 4690 ms · guard affirms]: Ek hi poora 3, 6 aur 12 logon mein baanto: log jitne zyada, har ek ka hissa utna chhota. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 4411 ms · guard long]: Theek hai, is par hum phir saath mein aayenge; ab agli baat. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** mark se pehle hai na  _(correct)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2054 ms · guard mustsay]: Haan, bilkul theek: mark 1/3 hai, aur 1/5 ka gap chhota. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Patti ke kitne hisson mein rang hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1091 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":2,"whole":"bar"}}

## Agent


