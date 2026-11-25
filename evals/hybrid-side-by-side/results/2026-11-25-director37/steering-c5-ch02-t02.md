# steering-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1734 ms]: Aaj hum do fraction mein se bada kaunsa hai, yeh pehchaanna seekhenge. Toh shuru karte hain?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · ready 2218 ms · guard mustsay]: Chalo, main batati hoon. Roti ke 4 hisse karo, waisi doosri ke 8. Yeh patti ek poora hai, 4 barabar hisson mein; rangeen hissa 1/4. Neeche ka 4 batata hai ki kitne hisse. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · ready 2285 ms]: Ek roti 4 bachche barabar baantein, toh har bachche ko roti ka 1/4 milta hai. Is patti ka rangeen hissa bhi waisa hi hai: chaar barabar mein se ek. Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > card: Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · ready 3532 ms · guard ask]: Theek hai, Hindi mein bolti hoon. Socho, is patti ka ek hissa beech se do barabar hisson mein kata hai; ab naye hisse ko purane hisse ke saamne rakh kar socho. Socho, yahi patti 8 hisson mein kaati jaaye. Tab uska ek hissa abhi ke ek hisse se bada hoga ya chhota?
  > card: Socho, yahi patti 8 hisson mein kaati jaaye. Tab uska ek hissa abhi ke ek hisse se bada hoga ya chhota?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · ready 2371 ms · guard long,uncorrected]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 logon wala hissa chhota hota hai. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** 1/9  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1455 ms · guard twoq,uncorrected]: Nahi, 1/9 theek nahi. 9 chhota number hai, par dor utni hi lambi hai. Ek hi dor jitne kam hisson mein bate, har hissa utna lamba. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1737 ms]: Yahan dono dor ki jagah do ek jaise gol hain, ek 9 barabar hisson mein aur doosra 11 mein. Dono gol ka ek-ek hissa milaa lo. Ab tum batao.
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** ek aur picture dikhao  _(no_evidence · visual)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1598 ms]: Iski aur koi tasveer mere paas nahi hai. Dono dor ek jitni lambi hain; socho ki kis dor par zyada baar kainchi chali. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 1/9  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (2 miss) · board up · ready 840 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Board par dono roti dekho: 2 hisson wali roti ka ek hissa aadhi roti hai, aur 10 hisson wali ka ek hissa bahut patla. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (2 miss) · board up · ready 2280 ms · guard samecard]: Haan, pehle tum try karo.
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 1/9  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 899 ms · guard uncorrected]: Yeh jawab sahi nahi hai. 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · ready 2116 ms]: Cricket ki baat bhi zaroor karenge, thodi der mein. Theek hai; ab pehle wala sawaal phir se saath mein dekhte hain. Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > card: Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** chhota hoga  _(correct)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 1109 ms]: Haan, bilkul theek: patti barabar lambi hain, toh jitne zyada hisse, har hissa utna chhota: doosri 8 mein kati, pehli sirf 4 mein. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** Dhoni  _(no_evidence · aside)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 3131 ms · guard leak,long]: Achha, toh Dhoni! Yeh batane ke liye shukriya. Theek hai, ab wahin se aage badhte hain jahan ruke the. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1923 ms]: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2537 ms · guard same]: Do 1/8 hisson ka sira dekho, aur dekho pehli patti mein usi jagah tak kaunsa hissa khatam hota hai. Doosri patti ke pehle do 1/8 hisse milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** pehli patti ka ek hissa banate hain  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1786 ms]: Sahi jawab, kyunki do 1/8 hisse, yaani 2/8, milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Number line par zero se jitna door, fraction utna bada. Is line par 0 se 1 tak ek taraf 3 barabar gap hain, doosri taraf 7. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1032 ms]: Haan, bilkul theek. 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Aao, yeh sawaal main aur tum saath mein karenge. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** kam  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 1942 ms · guard affirms,leak]: Haan, kam hisson mein kati chocolate ka hissa bada hota hai. 1/8 aur 1/2 ke neeche wale number lo: Rahul ki chocolate 8 hisson mein kati hai, aur Sana ki 2 mein. Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** 1/2  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 983 ms]: Haan, sahi hai: 1/2 ka rang, 1/8 ke rang se chaar guna lamba hai. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Ab ek sawaal tum akele karo. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** 1/5 loonga  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 867 ms]: Bilkul sahi, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 1029 ms · guard uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Sabse chhote se shuru karna hai; aur neeche ka bada number bada hissa nahi banata. Ek hi poora 12 logon mein bate, toh har ek ka hissa 3 logon wale hisse se kaafi chhota hota hai. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis order mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 932 ms]: Haan, bilkul theek. Poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12,"shade":1,"title":"1/12"},{"parts":6,"shade":1,"title":"1/6"},{"parts":3,"shade":1,"title":"1/3"}]}}

**child:** aage  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 (1 miss) · board up · ready 1731 ms · guard uncorrected]: Yeh jawab sahi nahi hai. 0 se 1 ko 5 gap mein baanto, toh har gap yahan ke 3 gap wale gap se chhota banta. Ab dekho, 1/5 ka gap is mark tak pahunchta hai ya nahi. 0 se 1 tak 3 barabar gap wali line par 1/5, pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** 1/5 pehle aayega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 891 ms]: Sahi jawab, kyunki yeh mark 1/3 hai; gap 3 se zyada hon toh pehla gap chhota hota, aur is mark se pehle khatam hota. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1110 ms]: Aaj ke liye itna hi, phir milenge!

## Agent


