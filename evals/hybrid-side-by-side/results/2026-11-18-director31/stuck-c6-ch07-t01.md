# stuck-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2000 ms]: Aaj hum ek poore ke barabar hisse karke bhinn banayenge. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2154 ms · guard long]: Chalo, main batati hoon. Ghar mein ek roti 4 bachchon mein barabar baantni hai. Har bachche ke hisse ka ek pakka naam hota hai. Yeh roti 4 barabar hisson mein bati hai. Rang wala ek hissa poori roti ka 1/4 hai, ek-chauthaai. Poore ke barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2015 ms]: Bhinn ka neeche wala number batata hai ki poora kitne barabar hisson mein bata. Bagal wali roti ke hisse gino. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 4256 ms · guard ask]: Theek hai, yahi baat seedhe tareeke se kehti hoon. Bagal wali roti bhi utni hi badi hai, par uske 8 barabar hisse kiye hain. Uska ek hissa poori roti ka kaunsa bhinn hai?
  > card: Bagal wali roti bhi utni hi badi hai, par uske 8 barabar hisse kiye hain. Uska ek hissa poori roti ka kaunsa bhinn hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 1/8 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 1889 ms · guard mustsay]: Haan, sahi hai, kyunki roti ke 8 barabar hisse, aur yeh unmein se ek. Dono pattiyan 12 cm ki hain aur dono ke 3 hisse hain. A ke teeno hisse 4 cm ke hain, barabar, toh har hissa 1/3 hai. B ke hisse 6, 3 aur 3 cm ke hain, toh unmein se koi bhi 1/3 nahi. Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 1022 ms]: Teeno hisse barabar honge aur milkar poori patti banayenge. Socho, kaunsi lambai teen baar jodne se 15 cm banti hai. 15 cm ki patti ke 3 barabar hisson mein har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"15 cm"}]}}

**child:** 5 centimetres  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1226 ms · guard mustsay,noconfirm]: Bilkul sahi. Dekho, teen barabar hisse milkar poori 15 cm ki patti. Ribbon P 20 cm ki hai, toh uska 1/2 10 cm hai. Ribbon Q 12 cm ki hai, toh uska 1/2 sirf 6 cm hai. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"15 cm"}]}}

**child:** mujhe lagta hai 2 cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2400 ms · guard long,noconfirm]: Haan, bilkul theek: P ka 1/4 20 ÷ 4 = 5 cm, Q ka 12 ÷ 4 = 3 cm, toh fark 2 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ek hissa poore ganne ka kaunsa bhinn hai? Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2430 ms]: Board par baayein poore ganne ki lambai hai, aur daayein ek hisse ki. Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2452 ms]: Socho, roti ke hisse ka naam kaise mila tha: uske barabar hisse gin kar. Ganne ke liye bhi wahi ginti chahiye. Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3440 ms · guard quiz]: Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 2587 ms · guard long]: Pehle dekho ganna kitne barabar hisson mein bata: barabar hisson ki ginti, kyunki bhinn ka neeche wala number barabar hisson ki ginti hai. 30 cm mein 6 cm ke hisse gino: 30 ÷ 6 = 5 hisse, kyunki har hissa 6 cm ka hai, aur 5 × 6 = 30. Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > card: Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > screen: board fraction-parts@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(incorrect)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (1 miss) · board up · ready 1344 ms · guard uncorrected]: 1/6 sahi nahi hai. Ganna jitne barabar hisson mein bata, wahi ginti bhinn ke neeche aati hai, aur ek hissa upar. 30 cm ganne ke 6 cm wale ek hisse ka bhinn kya hai?
  > card: Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":0,"whole":"bar"}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (1 miss) · board up · ready 2300 ms]: Haan, pehle tum try karo.
  > card: Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":0,"whole":"bar"}}

**child:** 1 by 5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 1098 ms]: Haan, sahi hai. Toh poora jawab: ek hissa poore ganne ka 1/5 hai, kyunki neeche wala number hisson ki ginti hai, hisse ki lambai nahi. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":1,"whole":"bar"}}

**child:** 4  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 3028 ms · guard leak,long,uncorrected]: Nahi, 4 theek nahi. Ise alag tareeke se dekhte hain. Dono pattiyon ke teen-teen hisse hain, par sirf pehli ke hisse barabar hain. 1/3 tabhi kehte hain jab teeno hisse barabar hon. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Kya har hissa poori ribbon ka 1/3 hai?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Kya har hissa poori ribbon ka 1/3 hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** yes  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (1 miss) · board up · ready 3789 ms · guard samecard,uncorrected]: Nahi, yeh theek nahi hai. Pehle socho, 24 cm ke teen barabar hisse kitne lambe hote. Phir har hisse ko usse milao. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kya har hissa 1/3 hai?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Kya har hissa poori ribbon ka 1/3 hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** nahi, sirf 8 cm wala  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 (1 miss) · board up · ready 2005 ms]: Bilkul sahi. Dekho, 24 cm ka 1/3 8 cm hota, par 10 aur 6 cm wale hisse 8 cm ke nahi. Theek hai, ab wapas usi sawaal par chalte hain. 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 4  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 (2 miss) · board up · ready 2184 ms · guard samecard,uncorrected]: 4 sahi nahi hai. Socho, chocolate chaar barabar hisson mein toot-ti toh har hissa kitna lamba hota. Phir dekho kaunse hisse utne lambe hain. 16 cm ki chocolate ke 6, 6, 2 aur 2 cm wale hisson mein se kitne hisse 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** 4  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 1071 ms]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 0 hai, kyunki 16 cm ka 1/4 16 ÷ 4 = 4 cm hota, aur koi bhi hissa 4 cm ka nahi, toh 0 hisse. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c2 · board up · ready 2572 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 2516 ms · guard long]: Achha, toh tumhe sixer sabse achha lagta hai. Ab wapas apne kaam par. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** Sana  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence · board up · ready 3209 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ek doosri tarah se samajhte hain. 30 cm ki ribbon ka aadha 15 cm hai, aur 10 cm wali ka sirf 5 cm. Naam ek hai, par poora alag, toh lambai alag. Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]}}}

**child:** no  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence (1 miss) · board up · ready 3618 ms · guard leak,uncorrected]: Yeh jawab sahi nahi hai. Dono ribbon ka hissa alag-alag nikalo, phir dono lambaiyan milao. 36 cm ka 1/3 aur 24 cm ka 1/2: kya yeh dono hisse barabar lambe hain?
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon A","items":["36 cm ka 1/3"]},"right":{"title":"Ribbon B","items":["24 cm ka 1/2"]}}}

**child:** no  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence (2 miss) · board up · ready 2045 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ek bada tarbooz aur ek chhota seb, dono ko beech se kaato. Dono ke aadhe hain, par tarbooz ka aadha seb ke aadhe se kahin bada; aadha kitna, yeh poore par tikta hai. Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon A","items":["36 cm ka 1/3"]},"right":{"title":"Ribbon B","items":["24 cm ka 1/2"]}}}

**child:** yes hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (1 miss) · board up · ready 2144 ms]: Haan, sahi hai: A ka 1/3 36 ÷ 3 = 12 cm, B ka 1/2 24 ÷ 2 = 12 cm, toh dono barabar. Chalo, ab pichhle sawaal par wapas chalte hain. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon A","items":["36 cm ka 1/3"]},"right":{"title":"Ribbon B","items":["24 cm ka 1/2"]}}}

**child:** Rahul  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1429 ms]: Bilkul sahi, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm, toh Rahul ka lamba. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Yahan tak theek hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]},"mark":{"side":"left"}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2521 ms]: Ab ek hi poore ko kam ya zyada hisson mein baant kar hisse milayenge. Ab tak samajh aaya?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]},"mark":{"side":"left"}}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 3847 ms · guard leak,long]: Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 3 hisse  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 (1 miss) · board up · ready 1911 ms · guard uncorrected]: 3 hisse sahi nahi hai. Pehli patti ke ek hisse ke theek neeche dekho, aur gino doosri patti ke kitne hisse us jagah mein aate hain. Kitne 1/6 hisse milkar ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 0 hisse  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 (2 miss) · board up · ready 3476 ms · guard samecard,uncorrected]: Nahi, 0 hisse theek nahi. Socho ek pizza 3 dost baantein aur bilkul waisa pizza 6 dost. 6 doston mein har ek ka hissa chhota hoga, kyunki pizza wahi hai. Board par bhi 1/6 wala hissa 1/3 wale se chhota hai. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** mujhe lagta hai 2 hisse  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 2468 ms · guard mustsay]: Haan, sahi hai. Dekho, 6 hisse 3 ke do guna, toh tihaai mein do. Yeh teen chocolate ki pattiyan ek hi size ki hain. Pehli 3 doston mein barabar bati, doosri 5 mein, teesri 10 mein. Jitne zyada dost, har dost ka hissa utna chhota. In pattiyon ke 1/3, 1/10 aur 1/5 hisson ko sabse chhote se sabse bade tak kram mein lagao.
  > card: In pattiyon ke 1/3, 1/10 aur 1/5 hisson ko sabse chhote se sabse bade tak kram mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 1/3, 1/5, 1/10  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2632 ms · guard flat,uncorrected]: 1/3, 1/5, 1/10 sahi nahi hai. Isko ek naye dhang se dekhein. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 8 bada number hai, phir bhi 8 logon wala hissa chhota, kyunki roti wahi hai. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":5,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2355 ms]: Paani ki ek botal 2 doston mein baanto ya 8 mein. 8 doston ke gilaas mein kam paani aata hai, kyunki botal wahi hai. Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"title":"Roti"},{"parts":8,"title":"Roti"}]}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (1 miss) · board up · ready 2966 ms · guard leak,samecard,uncorrected]: 1/6 se baat nahi bani. Dono dor ek jitni lambi hain; socho kis dor par zyada baar kainchi chali. 6 aur 9 barabar hisson mein kati do ek jitni dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":9,"shade":0,"label":""}]}}

**child:** 1/9  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 (1 miss) · board up · ready 1539 ms]: Bilkul sahi: dono dor ek jitni, par doosri 9 hisson mein kati, toh uska hissa 1/9, 1/6 se chhota. Achha, ab pehle wale sawaal ko phir se dekhte hain. 1/3, 1/10 aur 1/5 ka sabse chhote se sabse bade tak kram kya hai?
  > card: In pattiyon ke 1/3, 1/10 aur 1/5 hisson ko sabse chhote se sabse bade tak kram mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":9,"shade":1,"label":"1/9"}]}}

**child:** 1/10 1/5 1/3  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1599 ms]: Haan, sahi hai, kyunki 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala: 1/10, 1/5, 1/3. Aao, agla sawaal main aur tum mil ke karenge. Ek jaisi chocolate ki pattiyan barabar baantni hain. Tumhe aisa hissa chahiye jo 1/3 se chhota ho par 1/6 se bada. Patti kitne doston mein baantoge: 2, 4 ya 7? Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"1/10"},{"parts":5,"shade":1,"label":"1/5"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 937 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milte hain.

## Agent


