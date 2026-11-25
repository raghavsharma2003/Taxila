# steady-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1992 ms]: Socho, chaar log ek roti barabar baantein. Yeh roti 4 barabar hisson mein bati hai, aur rang wala hissa 1/4 hai. Barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 899 ms · guard uncorrected]: 1/4 sahi nahi hai. Aath dost yeh roti barabar baantein, toh har dost ko ek hissa milta hai; us hisse ka naam doston ki ginti se banta hai, pehli roti ke 4 se nahi. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (2 miss) · board up · ready 747 ms · guard uncorrected]: Nahi, 1/4 theek nahi. 1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. Ab bagal wali roti ke hisse gino. Ab tum batao.
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (2 miss) · board up · ready 961 ms]: Socho chaar dost yeh roti barabar baant-te hain. Har dost ke haath chaar barabar hisson mein se ek aata hai, jaise yeh rang wala hissa: roti ka 1/4. Aise ek hisse ko fractional unit kehte hain. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** ek-aathvaan hissa  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 932 ms]: Haan, sahi hai. Roti ke 8 barabar hisse, aur yeh unmein se ek. Do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh unhe gin kar 1/3 nahi keh sakte. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** second wala  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1615 ms · guard screen,mustsay,long,noconfirm]: Bilkul sahi: patti ke teen barabar hisse 5-5 cm ke hote. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"},{"parts":3,"shade":1,"title":"15 cm: teen 5 cm hisse"}]}}

**child:** two cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 926 ms · guard noconfirm]: Haan, bilkul theek, kyunki P ka 1/4 5 cm, Q ka sirf 3 cm. Aao, agla sawaal main aur tum mil ke karenge. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** bhaag do  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1086 ms]: Haan, 30 ko 6 se bhaag do, toh pata chalega ganna kitne hisson mein bata. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1672 ms]: Yahan wahi ganna scale par hai: poora 30 cm, aur pehle 6 cm par ek hisse ka nishaan. 30 cm ke ganne ka 6 cm wala ek hissa kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board number-line-scale@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":30,"step":10,"marks":[{"value":6,"label":"6 cm"},{"value":30,"label":"30 cm"}]}}

**child:** 1/5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 1565 ms · guard answerinq]: Haan, sahi hai. 30 ÷ 6 = 5, toh neeche 5 aata hai, 6 nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Ganna: 1/5"}]}}

**child:** ek bhi hissa nahi  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 3600 ms · guard long,noconfirm]: Bilkul sahi: 16 ÷ 4 = 4, toh 1/4 hissa 4 cm ka hota; yahan koi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** Rahul ka 5 cm zyada  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1591 ms · guard noconfirm]: Haan, bilkul theek, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Ab tak samajh aaya?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 1922 ms]: Hissa tabhi 1/3 kehlata hai jab hisse barabar hon, aur lambe poore ka hissa bhi lamba. Ab poora wahi rahega, bas hisson ki ginti badlegi. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 2458 ms · guard mustsay]: Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 2778 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 2 hisse  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 2982 ms · guard content_filter_output]: Haan, sahi hai. Har 1/3 jitni jagah mein do 1/6. Do ek hi size ki chocolate 2 aur 4 doston mein bati: 4 doston wala hissa chhota hai. Jitne zyada dost, har dost ka hissa utna chhota. Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board compare@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** das wala  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1218 ms · guard long]: Bilkul sahi: 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala, toh 1/10 sabse chhota. Chalo, ab ek sawaal hum dono saath mein karte hain. Ek patti barabar baantni hai. Hissa 1/3 se chhota par 1/6 se bada chahiye, aur dost 2, 4 ya 7 ho sakte hain. Dekhna hai patti kitne doston mein baantein. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi size ki chocolate","items":["3 doston mein","10 doston mein","5 doston mein"]},"right":{"title":"Sabse chhota","items":["kaunsa hissa"]}}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 1846 ms]: Achha, ab Hindi mein bolti hoon. Har option mein sirf doston ki ginti di hai. Milane se pehle har option ke liye kya pata karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2104 ms]: Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Pehle is sawaal ka jawab do.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2451 ms]: 2, 4 ya 7 dost: in options ko 1/3 aur 1/6 se milane ke liye pehle har option mein kya pata karna hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** 1/2 1/4 1/7  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked · board up · ready 1023 ms]: Haan, pehle har dost ka hissa, har option mein. Ab har hissa do baaton par jaanchna hai: woh 1/3 se chhota ho, aur 1/6 se bada. Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > card: Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Har dost ka hissa","items":["2 dost: 1/2","4 dost: 1/4","7 dost: 1/7"]},"right":{"title":"Hissa aisa chahiye","items":["1/3 se chhota","1/6 se bada"]}}}

**child:** mujhe lagta hai 4 dost  _(correct)_

**Asha** [repair · beat s2:worked:worked · board up · ready 1650 ms]: Haan, sahi hai. Toh poora jawab: patti 4 doston mein baanto; har dost ka hissa 1/4 hai, kyunki do dost bahut kam hain aur saat bahut zyada; sirf chaar doston par hissa dono shartein poori karta hai. Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":6,"shade":1,"title":"1/6"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch07-t01-s2:c1 · board up · ready 2038 ms]: Achha, toh tumhe batting pasand hai! Theek hai, ab phir se kaam par aate hain. Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/6 cake se chhota chahiye. Kam se kam kitne hisse karne honge?
  > card: Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/6 cake se chhota chahiye. Kam se kam kitne hisse karne honge?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":6,"shade":1,"title":"1/6"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** saat hisse  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 · board up · ready 3337 ms · guard leak,long]: Bilkul sahi. 6 hisse dete theek 1/6; chhota hissa 6 se zyada hisson par milta hai, aur sabse kam 7, yaani 1/7. Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > card: Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Cake","items":["barabar hisse"]},"right":{"title":"Har hissa","items":["1/6 se chhota"]}}}

**child:** scooter  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2271 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 2 logon mein har ek ko aadhi roti milti hai, 8 mein bas ek patla sa hissa. Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > card: Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter","bus"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa","raste ka hissa"]}}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (1 miss) · board up · ready 968 ms]: 1/4 sahi nahi hai. 4 sabse chhota number hai, par 4 hisson wali dor par kainchi sabse kam baar chali, toh uske hisse sabse lambe hain, chhote nahi. 6, 9 aur 4 barabar hisson mein kati teen ek jitni dor mein se kis dor ka ek hissa sabse chhota hai?
  > card: Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Teen ek jitni dor","items":["6 barabar hisse","9 barabar hisse","4 barabar hisse"]},"right":{"title":"Kis dor ka","items":["sabse chhota hissa"]}}}

**child:** 9 wali dor ka  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 (1 miss) · board up · ready 1387 ms]: Haan, sahi hai: teeno dor ek jitni lambi hain, aur 9 wali sabse zyada hisson mein kati, isliye uska hissa, 1/9, sabse chhota. Chalo, pichhle sawaal par wapas chalte hain. Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > card: Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Teen ek jitni dor","items":["6 barabar hisse","9 barabar hisse","4 barabar hisse"]},"right":{"title":"Kis dor ka","items":["sabse chhota hissa"]}}}

**child:** cycle gayi  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 · board up · ready 2766 ms · guard leak]: Haan, bilkul theek, kyunki raasta ek hi hai, aur 6, 7, 8 mein 6 sabse chhoti ginti hai, toh 1/6 wala hissa sabse lamba. Zoya kehti hai ki 1/8 sabse bada hai, kyunki 8 sabse bada number hai. Asal mein 1/8, 1/5 ya 1/6 mein sabse bada kaunsa hai?
  > card: Zoya kehti hai ki 1/8 sabse bada hai, kyunki 8 sabse bada number hai. Asal mein 1/8, 1/5 ya 1/6 mein sabse bada kaunsa hai?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter","bus"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa","raste ka hissa"]}}}

**child:** 1/8  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 (1 miss) · board up · ready 1138 ms]: 1/8 se baat nahi bani. 8 sabse bada number hai, par 1/8 ke liye poora sabse zyada hisson mein bata, toh 1/8 sabse chhota hissa hai, bada nahi. 1/8, 1/5 aur 1/6 mein sabse bada kaunsa hai?
  > card: Zoya kehti hai ki 1/8 sabse bada hai, kyunki 8 sabse bada number hai. Asal mein 1/8, 1/5 ya 1/6 mein sabse bada kaunsa hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** one fifth  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 859 ms]: Bilkul sahi. 1/5 mein poora sabse kam hisson mein bata hai, sirf 5 mein, toh 1/5 sabse bada; 1/8 sabse chhota. Ab ek se zyada cheezein barabar baantenge, jaise kuch roti kuch bachchon mein, aur har ek ka hissa bhinn mein likhenge. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":8,"shade":1,"title":"1/8"},{"parts":5,"shade":1,"title":"1/5"},{"parts":6,"shade":1,"title":"1/6"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s3:bridge:bridge · board up · ready 2415 ms]: Ek hi roti zyada logon mein bate, toh har ek ko kam milta hai; isliye 1/6, 1/3 se chhota hai. Ab do-teen roti ek saath baantkar dekhenge. Ab tak samajh aaya?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":8,"shade":1,"title":"1/8"},{"parts":5,"shade":1,"title":"1/5"},{"parts":6,"shade":1,"title":"1/6"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch07-t01-s3:ask:e1 · board up · ready 2242 ms · guard mustsay]: 3 roti 4 bachchon mein barabar baantni hain. Har roti ke 4 barabar hisse karo, aur har bachche ko har roti se ek hissa do, yaani 1/4. Teen roti se teen hisse milte hain: 3/4 roti. Ab bachche wahi 4 hain, par roti sirf 2. Ek bachche ke hisse mein kitni roti aayegi?
  > card: Ab bachche wahi 4 hain, par roti sirf 2. Ek bachche ke hisse mein kitni roti aayegi?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":""},{"parts":4,"shade":1,"label":""},{"parts":4,"shade":1,"label":""}]}}

**child:** aadhi  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c6-maths-ch07-t01-s3:ask:e2 · board up · ready 1195 ms · guard mustsay]: Haan, sahi hai: har roti se 1/4, toh 2/4, yaani aadhi roti. Ab jab cheezein baantne walon se zyada hon: 5 laddoo 2 bachchon mein baanto, toh hissa 5/2 laddoo, jo 1 se zyada hai. Likhne ka niyam: cheezein upar, baantne wale neeche. Ab 6 chikki 5 bachchon mein barabar baanti. Har bachche ka hissa kaunsi bhinn hai?
  > card: Ab 6 chikki 5 bachchon mein barabar baanti. Har bachche ka hissa kaunsi bhinn hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** 6/5  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c6-maths-ch07-t01-s3:ask:e3 · board up · ready 951 ms · guard mustsay,noconfirm]: Haan, bilkul theek, kyunki baanti jaane wali chikki upar, bachche neeche. Ab lambai ki baat: yeh line 1 metre ki ribbon hai, yaani 100 cm. Ise 2 barabar hisson mein kaato toh har hissa 1/2 metre hai, aur 100 ÷ 2 = 50 cm. Ab wahi 1 metre ki ribbon 5 barabar hisson mein kaato. Aise 2 hisse milakar kitne cm honge?
  > card: Ab wahi 1 metre ki ribbon 5 barabar hisson mein kaato. Aise 2 hisse milakar kitne cm honge?
  > screen: board number-line-scale@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chikki","items":["6 chikki"]},"right":{"title":"Bachche","items":["5 bachche"]}}}

**child:** 40 cm hai na  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 2150 ms]: Bilkul sahi. Metre ka ek hissa 100 ÷ 5 = 20 cm, toh 2 hisse 40 cm, aadhe metre ke 50 cm se kam. Ab ek sawaal milkar, kadam-kadam hal karte hain. 5 laddoo 3 bachchon mein barabar baantne hain, aur pata karna hai ki ek-ek bachche ka hissa kitna banta hai. Har laddoo ke kitne barabar hisse karoge?
  > screen: board compare@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":100,"step":50,"marks":[{"value":20,"label":"20 cm"},{"value":40,"label":"40 cm"}]}}

**child:** 3 hisse karungi  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c6-maths-ch07-t01-s3:ask:worked · board up · ready 875 ms]: Haan, 3 hisse, kyunki bachche 3 hain. Ab har laddoo se har bachche ko ek hissa milta hai, yaani har laddoo ka 1/3. Tumhari baari: 5 laddoo se ek bachche ko kul kitna laddoo mila, bhinn mein?
  > card: Tumhari baari: 5 laddoo se ek bachche ko kul kitna laddoo mila, bhinn mein?
  > screen: board equal-groups@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"shade":1,"title":"Ek laddoo"}]}}

**child:** 5/3 laddoo  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c6-maths-ch07-t01-s3:c1 · board up · ready 1946 ms · guard answerinq]: Sahi jawab. Toh poora jawab: har bachche ko 5/3 laddoo milta hai, kyunki laddoo bachchon se zyada the, isliye hissa 1 se zyada aaya. Chalo, ab tumhari apni baari. Kuch roti 5 doston mein barabar baanti gayi, aur har dost ko 3/5 roti mili. Kul kitni roti thi?
  > card: Kuch roti 5 doston mein barabar baanti gayi, aur har dost ko 3/5 roti mili. Kul kitni roti thi?
  > screen: board wholes@1 {} · ref {"template":"equal-groups@1","params":{"groups":5,"each":3,"showSum":false,"title":"5/3 = 1 aur 2/3"}}

**child:** three  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c6-maths-ch07-t01-s3:c2 · board up · ready 1183 ms]: Haan, sahi hai. Har roti se har dost ko 1/5 mila; 3/5 matlab 3 hisse, toh 3 roti thi. 5 metre ribbon 4 banners mein barabar baanti. Har banner ko kitne cm ribbon milegi?
  > card: 5 metre ribbon 4 banners mein barabar baanti. Har banner ko kitne cm ribbon milegi?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Roti"},{"parts":5,"shade":1,"title":"Roti"},{"parts":5,"shade":1,"title":"Roti"}]}}

**child:** 125 cm hai na  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c6-maths-ch07-t01-s3:c3 · board up · ready 1832 ms]: Haan, bilkul theek: ribbon 5 metre, yaani 500 cm, aur 500 ÷ 4 = 125 cm, jo 1 metre se zyada hai. 3 roti 8 bachchon mein barabar baanti gayi. Kabir ne likha ki har bachche ko 8/3 roti mili. Sahi hissa kya hai?
  > card: 3 roti 8 bachchon mein barabar baanti gayi. Kabir ne likha ki har bachche ko 8/3 roti mili. Sahi hissa kya hai?
  > screen: board fraction-parts@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon","items":["5 metre"]},"right":{"title":"Banners","items":["4 banners"]}}}

**child:** 3/8  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 4 ms]: Bilkul sahi, kyunki baanti gayi roti upar, bachche neeche. Aaj ki saari baatein jodne wala ek aakhri sawaal aa raha hai. Teen group ke paas 2-2 ek jaisi roti hain, jo woh barabar baant-te hain: ek group mein 3 bachche, ek mein 5, aur ek mein 4. Kis group ke har bachche ko sabse zyada roti mili: 3 bachchon wale, 5 wale ya 4 wale?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":3,"whole":"roti"}}

**child:** 3 bachchon wala group  _(correct)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 561 ms]: Sahi jawab. Har group mein har bachche ko har roti se ek hissa mila, yaani 2 hisse: 3 mein 2/3, 5 mein 2/5, 4 mein 2/4. 1/3 sabse bada hissa hai, toh 2/3 roti sabse zyada hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":5,"shade":2,"label":"2/5"},{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** maine ek ek karke gina  _(no_evidence)_

**Asha** [wrap · ready 1831 ms]: Achha, samajh gayi. Aaj dekha: fractional unit poore ka ek barabar hissa hai, aur ek hi poore ke zyada hisse matlab chhota hissa. Phir kai cheezein barabar baanti, toh har ek ka hissa ek bhinn nikla. Aaj ka paath kaisa laga?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 780 ms]: Hmm, achha, sun liya. Aaj ke bhinn wale paath mein tumne ek dost ki ulti likhi bhinn theek ki. Aaj ke liye itna hi, phir milte hain.

## Agent


