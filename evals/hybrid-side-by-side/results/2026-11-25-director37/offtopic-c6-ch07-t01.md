# offtopic-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1921 ms · guard long]: Socho, chaar log ek roti barabar baantein. Yeh roti 4 barabar hisson mein bati hai, aur rang wala hissa 1/4 hai. Barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 916 ms · guard uncorrected]: 1/4 sahi nahi hai. Aath dost yeh roti barabar baantein, toh har dost ko ek hissa milta hai; us hisse ka naam doston ki ginti se banta hai, pehli roti ke 4 se nahi. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 1/8 hissa  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 770 ms]: Haan, bilkul theek. Roti ke 8 barabar hisse, aur yeh unmein se ek. Do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh unhe gin kar 1/3 nahi keh sakte. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** teeno  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 2857 ms · guard long,ask,uncorrected]: Yeh jawab sahi nahi hai. Ek doosri tarah se samajhte hain. Dono pattiyon ke teen hisse, par barabar sirf pehli ke. Hisse gin kar 1/3 jaisa naam tabhi dete hain, jab patti ke saare hisse barabar hon. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"}]}}

**child:** mujhe lagta hai 1  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 (1 miss) · board up · ready 1462 ms]: Sahi jawab, kyunki 24 ka 1/3, yaani 24 ÷ 3 = 8 cm; ribbon mein 8 cm ka hissa sirf 1 hai. Chalo, pichhle sawaal par wapas chalte hain. 7, 5 aur 3 cm ke hisson wali 15 cm ki patti mein, kaunsa hissa 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** paanch wala  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1979 ms · guard screen]: Haan, sahi hai. Patti ke teen barabar hisse 5-5 cm ke hote. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"},{"parts":3,"shade":1,"title":"15 cm: teen 5 cm hisse"}]}}

**child:** 2 cm zyada  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 881 ms]: Bilkul sahi: P ka 1/4 5 cm, Q ka sirf 3 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** 27 ko 6 se bhaag  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 2010 ms · guard long]: Nahi, yeh nahi hai. Hisson ki ginti ke liye 30 ko 6 se bhaag denge, kyunki dekhna hai ki 30 cm mein 6 cm kitni baar aata hai. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (1 miss) · board up · ready 981 ms]: 1/6 sahi nahi hai. 6 toh ek hisse ki lambai hai, hisson ki ginti nahi; gino ki 30 cm mein 6 cm wale kitne hisse aate hain. 30 cm ke ganne ka 6 cm wala ek hissa kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** ek-paanchvaan  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 1088 ms]: Haan, bilkul theek. 30 ÷ 6 = 5, toh neeche 5 aata hai, 6 nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Chalo, ab tumhari apni baari. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Ganna: 1/5"}]}}

**child:** ek bhi hissa nahi  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 3478 ms · guard long,noconfirm]: Sahi jawab, kyunki 16 ÷ 4 = 4, toh 1/4 hissa 4 cm ka hota; yahan koi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 2963 ms · guard long]: Dono hisson ki lambai alag-alag nikalo: pehle pehli ribbon ka 1/3, phir doosri ribbon ka 1/2. Phir dono lambaiyon ka fark dekho. 60 cm ki ribbon ka 1/3 aur 30 cm ki ribbon ka 1/2: in dono mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 2051 ms · guard screenmismatch]: Yahan dono ribbon ek hi scale par hain: Sana wali 30 cm par khatam hoti hai, Rahul wali 60 cm par. Ab tum batao.
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board number-line-scale@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":60,"step":10,"marks":[{"value":30,"label":"Sana 30 cm"},{"value":60,"label":"Rahul 60 cm"}]}}

**child:** 10  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence · board up · ready 1158 ms · guard long,screenmismatch,uncorrected]: 10 sahi nahi hai. Isko ek naye dhang se dekhein. 30 cm ki ribbon ka aadha 15 cm hai, 10 cm wali ka 5 cm. Dono aadhe hain, par 15 cm wala lambi ribbon ka hai. Laal ribbon 36 cm ki, neeli 24 cm ki. Laal ka 1/3 aur neeli ka 1/2: kiska hissa lamba hai, ya dono barabar?
  > card: Laal ribbon 36 cm ki, neeli 24 cm ki. Laal ka 1/3 aur neeli ka 1/2: kiska hissa lamba hai, ya dono barabar?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** ek jitne  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (1 miss) · board up · ready 1050 ms]: Haan, bilkul theek. Laal ka 1/3 36 ÷ 3 = 12 cm, neeli ka 1/2 24 ÷ 2 = 12 cm, toh dono barabar. Achha, pehle wala sawaal phir se dekhte hain. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Laal ribbon","items":["36 cm"]},"right":{"title":"Neeli ribbon","items":["24 cm"]}}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (1 miss) · board up · ready 3255 ms · guard ask]: Haan, Hindi mein batati hoon. 60 cm ki ribbon ka 1/3 kaata, aur 30 cm ki ribbon ka 1/2. Jo hissa lamba nikla, woh doosre se kitne cm lamba hai?
  > card: 60 cm ki ribbon ka 1/3 kaata, aur 30 cm ki ribbon ka 1/2. Jo hissa lamba nikla, woh doosre se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** 10  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (2 miss) · board up · ready 1024 ms · guard uncorrected]: Nahi, 10 theek nahi. Sana ka 1/2 sirf 30 cm wali ribbon ka hai, Rahul ka 1/3 60 cm wali ka; dono hisse cm mein nikaal kar milao. Chalo, ab tumhari baari.
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** fark 5 cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1107 ms]: Sahi jawab, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Ab tak samajh aaya?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2090 ms]: Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Ab yeh kaam poora karte hain. Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 1843 ms]: Wah, cricket ki baat sambhaal ke rakhi hai, baad mein zaroor sunungi. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 1617 ms]: Haan, pehle tum try karo.
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 2 hisse  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 968 ms]: Haan, bilkul theek. Pehli patti ke 3 hisse aur doosri ke 6, toh har 1/3 mein 1/6 ke 2 hisse aate hain. Chalo, cricket ke baare mein batao, tumhe woh kyun pasand hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1945 ms · guard mustsay]: Achha, toh tumhe batting pasand hai! Theek hai, ab phir se kaam par aate hain. Do ek hi size ki chocolate 2 aur 4 doston mein bati: 4 doston wala hissa chhota hai. Jitne zyada dost, har dost ka hissa utna chhota. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s2:explain:e2 · board up · ready 1521 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumne pehli baar Virat ko kab dekha tha?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":4,"shade":1,"label":"1/4"}]}}

**child:** jab main chhoti thi, papa ke saath  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 1982 ms]: Achha, batane ke liye shukriya. Ab apni padhai par lautte hain. Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board compare@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":4,"shade":1,"label":"1/4"}]}}

**child:** 10 doston wala  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 878 ms]: Sahi jawab, kyunki 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala, toh 1/10 sabse chhota. Aao, agla sawaal main aur tum mil ke karenge. Ek patti barabar baantni hai. Hissa 1/3 se chhota par 1/6 se bada chahiye, aur dost 2, 4 ya 7 ho sakte hain. Dekhna hai patti kitne doston mein baantein. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi size ki chocolate","items":["3 doston mein","10 doston mein","5 doston mein"]},"right":{"title":"Sabse chhota","items":["kaunsa hissa"]}}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 1671 ms]: Hissa 1/3 aur 1/6 se milana hai. Socho, har option mein kaunsi cheez nikaalni hogi jise in dono se milaa sako. 2, 4 ya 7 dost: in options ko 1/3 aur 1/6 se milane ke liye pehle har option mein kya pata karna hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked · board up · ready 2957 ms · guard answerinq,long]: Pehle har option mein ek dost ka hissa likhte hain: 2 doston mein 1/2, 4 mein 1/4, aur 7 mein 1/7. Ab har hissa do baaton par jaanchna hai: woh 1/3 se chhota ho, aur 1/6 se bada. Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > card: Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Har dost ka hissa","items":["2 dost: 1/2","4 dost: 1/4","7 dost: 1/7"]},"right":{"title":"Hissa aisa chahiye","items":["1/3 se chhota","1/6 se bada"]}}}

**child:** 7 dost  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2039 ms · guard uncorrected]: 7 dost sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 2 logon mein har ek ko aadhi roti milti hai, 8 mein bas ek patla sa hissa. Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > card: Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3},{"parts":6}]}}

**child:** 9 hisson wali  _(correct)_

**Asha** [practice · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked (1 miss) · board up · ready 1111 ms]: Haan, bilkul theek: teeno dor ek jitni lambi hain, aur 9 wali sabse zyada hisson mein kati, isliye uska hissa, 1/9, sabse chhota. Theek hai, wapas usi sawaal par chalte hain. Hissa 1/3 se chhota aur 1/6 se bada chahiye: 2, 4 ya 7, kitne doston mein baantoge?
  > card: Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Teen ek jitni dor","items":["6 barabar hisse","9 barabar hisse","4 barabar hisse"]},"right":{"title":"Kis dor ka","items":["sabse chhota hissa"]}}}

**child:** four  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch07-t01-s2:c1 · board up · ready 799 ms]: Sahi jawab. Toh poora jawab: patti 4 doston mein baanto; har dost ka hissa 1/4 hai, kyunki do dost bahut kam hain aur saat bahut zyada; sirf chaar doston par hissa dono shartein poori karta hai. Ab agla sawaal tumhare liye. Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/6 cake se chhota chahiye. Kam se kam kitne hisse karne honge?
  > card: Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/6 cake se chhota chahiye. Kam se kam kitne hisse karne honge?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":6,"shade":1,"title":"1/6"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** kam se kam saat hisse  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 · board up · ready 1752 ms]: Haan, sahi hai. 6 hisse dete theek 1/6; chhota hissa 6 se zyada hisson par milta hai, aur sabse kam 7, yaani 1/7. Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > card: Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Cake","items":["barabar hisse"]},"right":{"title":"Har hissa","items":["1/6 se chhota"]}}}

**child:** scooter  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 (1 miss) · board up · ready 1894 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Scooter ka 1/8 hai, yaani raasta 8 hisson mein bata, jo teeno mein sabse zyada hisse hain; isliye uska hissa sabse chhota. 1/6 raasta cycle ne, 1/8 scooter ne aur 1/7 bus ne tay kiya: sabse zyada door kaun gaya?
  > card: Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter","bus"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa","raste ka hissa"]}}}

**child:** scooter  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 (2 miss) · board up · ready 2434 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Raasta teeno ke liye ek hi hai. Socho, kiske hisse ke liye raasta sabse kam barabar hisson mein bata; wahi hissa sabse lamba hai. Jo socha hai, woh bol do.
  > card: Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, scooter ne 1/8, aur bus ne 1/7. Sabse zyada door kaun gaya: cycle, scooter ya bus?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter","bus"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa","raste ka hissa"]}}}

**child:** 1/6  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 · board up · ready 1787 ms · guard leak]: Haan, bilkul theek: raasta ek hi hai, aur 6, 7, 8 mein 6 sabse chhoti ginti hai, toh 1/6 wala hissa sabse lamba. Zoya kehti hai ki 1/8 sabse bada hai, kyunki 8 sabse bada number hai. Asal mein 1/8, 1/5 ya 1/6 mein sabse bada kaunsa hai?
  > card: Zoya kehti hai ki 1/8 sabse bada hai, kyunki 8 sabse bada number hai. Asal mein 1/8, 1/5 ya 1/6 mein sabse bada kaunsa hai?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter","bus"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa","raste ka hissa"]}}}

**child:** 1/5 hai na  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1914 ms]: Sahi jawab. 1/5 mein poora sabse kam hisson mein bata hai, sirf 5 mein, toh 1/5 sabse bada; 1/8 sabse chhota. Ab ek se zyada cheezein barabar baantenge, jaise kuch roti kuch bachchon mein, aur har ek ka hissa bhinn mein likhenge. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":8,"shade":1,"title":"1/8"},{"parts":5,"shade":1,"title":"1/5"},{"parts":6,"shade":1,"title":"1/6"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1737 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milte hain.

## Agent


