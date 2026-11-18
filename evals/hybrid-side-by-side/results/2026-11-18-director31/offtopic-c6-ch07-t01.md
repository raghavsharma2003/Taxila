# offtopic-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1929 ms]: Ghar mein ek roti 4 bachchon mein barabar baantni hai. Har bachche ke hisse ka ek pakka naam hota hai. Yeh roti 4 barabar hisson mein bati hai. Rang wala ek hissa poori roti ka 1/4 hai, ek-chauthaai. Poore ke barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 8/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 1267 ms · guard uncorrected]: 8/1 sahi nahi hai. Bhinn ka neeche wala number batata hai ki poora kitne barabar hisson mein bata. Bagal wali roti ke hisse gino. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** ek-aathvaan  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 1394 ms · guard mustsay]: Haan, bilkul theek. Dekho, roti ke 8 barabar hisse, aur yeh unmein se ek. Dono pattiyan 12 cm ki hain aur dono ke 3 hisse hain. A ke teeno hisse 4 cm ke hain, barabar, toh har hissa 1/3 hai. B ke hisse 6, 3 aur 3 cm ke hain, toh unmein se koi bhi 1/3 nahi. Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** 4 cm  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 (1 miss) · board up · ready 2759 ms · guard uncorrected]: Nahi, 4 cm theek nahi. Teeno hisse barabar honge aur milkar poori patti banayenge. Socho, kaunsi lambai teen baar jodne se 15 cm banti hai. 15 cm ki patti ke 3 barabar hisson mein har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"15 cm"}]}}

**child:** mujhe lagta hai 5 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1678 ms · guard mustsay,noconfirm]: Sahi jawab, kyunki teen barabar hisse milkar poori 15 cm ki patti. Ribbon P 20 cm ki hai, toh uska 1/2 10 cm hai. Ribbon Q 12 cm ki hai, toh uska 1/2 sirf 6 cm hai. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"15 cm"}]}}

**child:** 2 centimetre  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1214 ms]: Haan, sahi hai. Dekho, P ka 1/4 20 ÷ 4 = 5 cm, Q ka 12 ÷ 4 = 3 cm, toh fark 2 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ek hissa poore ganne ka kaunsa bhinn hai? Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3214 ms · guard quiz]: Socho, roti ke hisse ka naam kaise mila tha: uske barabar hisse gin kar. Ganne ke liye bhi wahi ginti chahiye. Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3835 ms · guard quiz]: Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Ab yeh kaam poora karte hain. Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 3349 ms · guard twoq]: Pehle dekho ganna kitne barabar hisson mein bata: barabar hisson ki ginti, kyunki bhinn ka neeche wala number barabar hisson ki ginti hai. 30 cm mein 6 cm ke hisse gino: 30 ÷ 6 = 5 hisse, kyunki har hissa 6 cm ka hai, aur 5 × 6 = 30. Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > card: Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > screen: board fraction-parts@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(incorrect)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (1 miss) · board up · ready 2376 ms · guard samecard,uncorrected]: 1/6 sahi nahi hai. Ganna jitne barabar hisson mein bata, wahi ginti bhinn ke neeche aati hai, aur ek hissa upar. 30 cm ganne ke 6 cm wale ek hisse ka bhinn kya hai?
  > card: Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":0,"whole":"bar"}}

**child:** ek paanchvaan  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1053 ms]: Haan, bilkul theek: neeche wala number hisson ki ginti hai, hisse ki lambai nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Yahan tak theek hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":1,"whole":"bar"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2621 ms]: Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":1,"whole":"bar"}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 2079 ms]: Achha, toh tumhe batting sabse achha lagta hai. Theek hai, ab phir se kaam par aate hain. 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":1,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 3287 ms · guard long,twoq]: Socho, chocolate chaar barabar hisson mein toot-ti toh har hissa kitna lamba hota. Phir dekho kaunse hisse utne lambe hain. 16 cm ki chocolate ke 6, 6, 2 aur 2 cm wale hisson mein se kitne hisse 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 2320 ms · guard screenmismatch]: Board par baayein poori chocolate ki lambai hai, aur daayein chaaron hisson ki. Ab phir se socho, jawab kya hoga?
  > card: 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 2298 ms]: Haan, ise aur aasaan karke samjhaati hoon. Ek chocolate 16 cm lambi thi, aur toot kar 6 cm, 6 cm, 2 cm aur 2 cm ke hisse ban gaye. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: Ek chocolate 16 cm lambi thi, aur toot kar 6 cm, 6 cm, 2 cm aur 2 cm ke hisse ban gaye. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** 0 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 2144 ms]: Haan, bilkul theek, kyunki 16 cm ka 1/4 16 ÷ 4 = 4 cm hota, aur koi bhi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** Sana  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence · board up · ready 5126 ms · guard long]: Yeh jawab sahi nahi hai. Ek doosri tarah se samajhte hain. 30 cm ki ribbon ka aadha 15 cm hai, aur 10 cm wali ka sirf 5 cm. Naam ek hai, par poora alag, toh lambai alag. Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]}}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence · board up · ready 3534 ms · guard leak]: Haan, pehle tum try karo.
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon A","items":["36 cm ka 1/3"]},"right":{"title":"Ribbon B","items":["24 cm ka 1/2"]}}}

**child:** no  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence (1 miss) · board up · ready 3635 ms]: Abhi yeh sahi nahi hai. Dono ribbon ka hissa alag-alag nikalo, phir dono lambaiyan milao. 36 cm ka 1/3 aur 24 cm ka 1/2: kya yeh dono hisse barabar lambe hain?
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon A","items":["36 cm ka 1/3"]},"right":{"title":"Ribbon B","items":["24 cm ka 1/2"]}}}

**child:** yes  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (1 miss) · board up · ready 1202 ms]: Sahi jawab. Dekho, A ka 1/3 36 ÷ 3 = 12 cm, B ka 1/2 24 ÷ 2 = 12 cm, toh dono barabar. Chalo, ab pichhle sawaal par wapas chalte hain. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon A","items":["36 cm ka 1/3"]},"right":{"title":"Ribbon B","items":["24 cm ka 1/2"]}}}

**child:** Rahul  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1086 ms]: Haan, bilkul theek: Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm, toh Rahul ka lamba. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Yahan tak theek hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]},"mark":{"side":"left"}}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 3868 ms · guard mustsay,leak]: Achha, phir se cricket. Theek hai. Ab wahin wapas aate hain jahan hum the. Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]},"mark":{"side":"left"}}}

**child:** 1 hisse  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 (1 miss) · board up · ready 1980 ms · guard uncorrected]: Nahi, 1 hisse theek nahi. Pehli patti ke ek hisse ke theek neeche dekho, aur gino doosri patti ke kitne hisse us jagah mein aate hain. Kitne 1/6 hisse milkar ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 4 hisse  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 (2 miss) · board up · ready 2056 ms]: 4 hisse sahi nahi hai. Socho ek pizza 3 dost baantein aur bilkul waisa pizza 6 dost. 6 doston mein har ek ka hissa chhota hoga, kyunki pizza wahi hai. Board par bhi 1/6 wala hissa 1/3 wale se chhota hai. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 0 hisse  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 (3 miss) · board up · ready 3482 ms · guard leak,samecard,uncorrected]: 0 hisse se baat nahi bani. Ek hi patti jitne zyada barabar hisson mein bate, har hissa utna chhota. 6 hisse 3 se zyada hain, isliye 1/6 chhota hai. Kitne 1/6 hisse milkar ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 2 hisse hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 2453 ms · guard long]: Haan, bilkul theek. Dekho, 6 hisse 3 ke do guna, toh tihaai mein do. Yeh teen chocolate ki pattiyan ek hi size ki hain. Pehli 3 doston mein barabar bati, doosri 5 mein, teesri 10 mein. Jitne zyada dost, har dost ka hissa utna chhota. In pattiyon ke 1/3, 1/10 aur 1/5 hisson ko sabse chhote se sabse bade tak kram mein lagao.
  > card: In pattiyon ke 1/3, 1/10 aur 1/5 hisson ko sabse chhote se sabse bade tak kram mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 1/10 1/5 1/3  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1771 ms]: Sahi jawab, kyunki 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala: 1/10, 1/5, 1/3. Aao, agla sawaal main aur tum mil ke karenge. Ek jaisi chocolate ki pattiyan barabar baantni hain. Tumhe aisa hissa chahiye jo 1/3 se chhota ho par 1/6 se bada. Patti kitne doston mein baantoge: 2, 4 ya 7? Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"1/10"},{"parts":5,"shade":1,"label":"1/5"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 2024 ms]: Socho, 2 dost patti baantein toh har ek ko kitna milta hai; baaki options ke liye bhi wahi socho. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked · board up · ready 4045 ms · guard leak,long]: Har option mein ek dost ka hissa likho: 1/2, 1/4 aur 1/7, kyunki patti apne doston mein barabar bati hai. Ab 1/3 se chhote hisse chuno: 1/4 aur 1/7; 1/2 toh 1/3 se bada hai, kyunki do dost teen se kam hain, toh unka hissa bada. Tumhari baari: 1/4 ya 1/7, inmein se kaunsa hissa 1/6 se bada hai?
  > card: Tumhari baari: 1/4 ya 1/7, inmein se kaunsa hissa 1/6 se bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** 1/4  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch07-t01-s2:c1 · board up · ready 1432 ms]: Haan, sahi hai. Dekho, dost jitne zyada, hissa utna chhota; 4 dost 3 aur 6 ke beech aate hain. Toh poora jawab: patti 4 doston mein baanto: har hissa 1/4, jo 1/3 se chhota aur 1/6 se bada hai. Chalo, ab tumhari apni baari. Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > card: Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":6,"shade":1,"label":"1/6"},{"parts":7,"shade":1,"label":"1/7"}]}}

**child:** 6 parts  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 · board up · ready 2793 ms · guard long,noconfirm]: Haan, bilkul theek: 6 hisse karo toh har hissa 1/6, jo 1/5 se chhota; 4 se 1/4 milta, jo bada. Ek hi raste par ek cycle ne raste ka 1/6 hissa tay kiya, aur ek scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > card: Ek hi raste par ek cycle ne raste ka 1/6 hissa tay kiya, aur ek scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":4,"shade":1,"label":"1/4"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** scooter  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2195 ms · guard long]: Yeh jawab sahi nahi hai. Isko ek naye dhang se dekhein. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 8 bada number hai, phir bhi 8 logon wala hissa chhota, kyunki roti wahi hai. Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,8],"from":0,"to":1}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (1 miss) · board up · ready 2362 ms · guard samecard,uncorrected]: Nahi, 1/6 theek nahi. Dono dor ek jitni lambi hain; socho kis dor par zyada baar kainchi chali. 6 aur 9 barabar hisson mein kati do ek jitni dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":9,"shade":0,"label":""}]}}

**child:** one ninth  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 (1 miss) · board up · ready 1161 ms]: Sahi jawab. Dekho, dono dor ek jitni, par doosri 9 hisson mein kati, toh uska hissa 1/9, 1/6 se chhota. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ek hi raste par ek cycle ne raste ka 1/6 hissa tay kiya, aur ek scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > card: Ek hi raste par ek cycle ne raste ka 1/6 hissa tay kiya, aur ek scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":9,"shade":1,"label":"1/9"}]}}

**child:** cycle hai na  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 · board up · ready 2333 ms]: Haan, sahi hai: raasta ek hi hai; 1/6 ke liye woh 6 hisson mein bata, 8 se kam, toh 1/6 lamba. Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > card: Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,8],"from":0,"to":1,"marks":[[1,6],[1,8]]}}

**child:** yes  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 (1 miss) · board up · ready 2554 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Dono pattiyan ek jaisi hain; dekho kaunsi patti zyada hisson mein bati hai. Kya 1/8 sach mein 1/5 se bada hai?
  > card: Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** galat  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1369 ms]: Haan, bilkul theek. Dekho, 1/8 ke liye poora 8 hisson mein bata, 5 se zyada, toh 1/8 chhota hai, bada nahi. Ab ek se zyada cheezein barabar baantenge, jaise kuch roti kuch bachchon mein, aur har ek ka hissa bhinn mein likhenge. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1347 ms]: Aaj ke liye itna hi, phir milte hain.

## Agent


