# stuck-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1925 ms]: Aaj hum ek poore ke barabar hisse karke bhinn banayenge. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2343 ms]: Chalo, main batati hoon. Ghar mein ek roti 4 bachchon mein barabar baantni hai. Har hisse ka ek naam hota hai. Yeh roti 4 barabar hisson mein bati hai. Rang wala ek hissa poori roti ka 1/4 hai. Poore ke barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1835 ms]: 1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. Ab bagal wali roti ke hisse gino. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1568 ms]: Achha, ab Hindi mein bolti hoon. Socho chaar dost yeh roti barabar baant-te hain. Har dost ke haath chaar barabar hisson mein se ek aata hai, jaise yeh rang wala hissa: roti ka 1/4. Aise ek hisse ko fractional unit kehte hain. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 1/8 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 1815 ms · guard mustsay]: Haan, sahi hai, kyunki roti ke 8 barabar hisse, aur yeh unmein se ek. Ab do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh hisse gin kar unhe 1/3 nahi keh sakte. Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 951 ms]: Teeno hisse barabar honge aur milkar poori patti banayenge. Socho, kaunsi lambai teen baar jodne se 15 cm banti hai. 15 cm ki patti ke 3 barabar hisson mein har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"15 cm"}]}}

**child:** five  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1142 ms · guard mustsay,noconfirm]: Bilkul sahi. Dekho, teen barabar hisse milkar poori 15 cm ki patti. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"15 cm"}]}}

**child:** 2  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1035 ms · guard noconfirm]: Haan, bilkul theek: P ka 1/4 5 cm, Q ka sirf 3 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1697 ms]: Yahan ganna ek scale par rakha hai, 0 se 30 cm tak, aur har 6 cm par ek nishaan hai. 30 cm ke ganne mein 6 cm ke kitne hisse hain, yeh jaanne ke liye kaunsa hisaab karoge?
  > screen: board compare@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":30,"step":6,"marks":[{"value":30,"label":"30 cm"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1022 ms]: Har hissa 6 cm ka hai aur poora ganna 30 cm. Socho, 6 cm ke hisse ek ke baad ek rakhte jao toh 30 cm tak kitne aayenge, aur yeh kis hisaab se niklega. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board number-line-scale@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3609 ms · guard quiz]: 30 cm ke ganne mein 6 cm ke kitne hisse hain, yeh jaanne ke liye kaunsa hisaab karoge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 2113 ms]: Hisson ki ginti ke liye 30 ko 6 se bhaag denge, kyunki dekhna hai ki 30 cm mein 6 cm kitni baar aata hai. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 790 ms · guard twoq]: Pehle 30 cm mein 6 cm ke hisse gino. Phir yaad karo, roti ke ek hisse ka naam uske barabar hisse gin kar kaise diya tha. 30 cm ke ganne ka 6 cm wala ek hissa kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1906 ms]: Haan, pehle tum try karo.
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(incorrect)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (1 miss) · board up · ready 1062 ms · guard uncorrected]: 1/6 sahi nahi hai. Socho 30 cm ke scale par har 6 cm par ek nishaan lagaya, aur scale wahan se kaat diya. Jitne barabar hisse bane, unmein se ek hissa poore scale ka kaunsa fractional unit hai, yahi ganne mein bhi dhoondhna hai. 30 cm ke ganne ka 6 cm wala ek hissa kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(incorrect)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (2 miss) · board up · ready 933 ms · guard uncorrected]: Nahi, 1/6 theek nahi. Ek chhoti cheez se socho: 10 cm ki pencil 5 cm ke hisson mein kaato toh 2 hisse bante hain, aur ek hissa uska 1/2 hai. Ganne ke saath bhi aisa hi karna hai. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** ek paanchvaan  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 2442 ms · guard noconfirm]: Haan, sahi hai. Toh poora jawab: ek hissa poore ganne ka 1/5 hai, kyunki 30 ÷ 6 = 5 barabar hisse bane, aur neeche hisson ki ginti aati hai, hisse ki lambai nahi. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 4  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 2131 ms · guard long,uncorrected]: 4 sahi nahi hai. Ise alag tareeke se dekhte hain. Dono pattiyon ke teen hisse hain, par barabar sirf pehli ke. Pehli ka har hissa 1/3 hai; doosri ke hisse gin kar 1/3 nahi keh sakte. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein se kitne hisse poori ribbon ka 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein se kitne hisse poori ribbon ka 1/3 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (1 miss) · board up · ready 928 ms · guard uncorrected]: 3 se baat nahi bani. Pehle socho, 24 cm ke teen barabar hisse kitne lambe hote. Phir har hisse ko usse milao. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kitne hisse 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein se kitne hisse poori ribbon ka 1/3 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (2 miss) · board up · ready 1003 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Teen dost ek chocolate baantein: ek ko aadhi mile, aur do ko 1/4-1/4. Kisi ka bhi hissa 1/3 nahi, kyunki 1/3 toh teen barabar hisson mein se ek hota hai. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein se kitne hisse poori ribbon ka 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein se kitne hisse poori ribbon ka 1/3 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (3 miss) · board up · ready 891 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. 1/3 matlab poore ke teen barabar hisson mein se ek. Chhote-bade hisse gin kar yeh naam nahi milta; har hisse ki lambai barabar wale hisse se milao. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kitne hisse 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein se kitne hisse poori ribbon ka 1/3 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 2266 ms · guard flat,uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 1 hai, kyunki 24 cm ka 1/3 24 ÷ 3 = 8 cm hai, aur 8 cm ka hissa sirf 1 hai. Yahan tak theek hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 (1 miss) · board up · ready 1948 ms]: Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Theek hai, ab wapas usi sawaal par chalte hain. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 0 hai na  _(correct)_

**Asha** [repair · beat s1:check:c1 · board up · ready 2633 ms · guard flat,noconfirm]: Haan, sahi hai. Dekho, 16 cm ka 1/4 16 ÷ 4 = 4 cm hota, aur koi bhi hissa 4 cm ka nahi, toh 0 hisse. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** haan  _(no_evidence)_

**Asha** [repair · beat s1:check:c1 · board up · ready 1753 ms]: Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 2879 ms · guard long]: Achha, toh tumhe batting sabse achha lagta hai. Ab wahin wapas aate hain jahan hum the. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Rahul ka hissa Sana ke hisse se kitne cm lamba hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Rahul ka hissa Sana ke hisse se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** Sana  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence · board up · ready 1883 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ek doosri tarah se samajhte hain. 30 cm ki ribbon ka aadha 15 cm hai, 10 cm wali ka 5 cm. Dono aadhe hain, par poore alag hain, isliye lambai alag hai. Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** no  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence (1 miss) · board up · ready 3012 ms · guard flat,uncorrected]: Nahi, yeh jawab nahi hai. Dono ribbon ka hissa alag-alag nikalo, phir dono lambaiyan milao. 36 cm ka 1/3 aur 24 cm ka 1/2: kya yeh dono hisse barabar lambe hain?
  > card: Ribbon A 36 cm ki hai aur B 24 cm ki. A ka 1/3 aur B ka 1/2: kya dono barabar lambe hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon A","items":["36 cm"]},"right":{"title":"Ribbon B","items":["24 cm"]}}}

**child:** yes hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (1 miss) · board up · ready 1808 ms]: Haan, sahi hai: A ka 1/3 36 ÷ 3 = 12 cm, B ka 1/2 24 ÷ 2 = 12 cm, toh dono barabar. Chalo, ab pichhle sawaal par wapas chalte hain. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Rahul ka hissa Sana ke hisse se kitne cm lamba hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Rahul ka hissa Sana ke hisse se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon A","items":["36 cm"]},"right":{"title":"Ribbon B","items":["24 cm"]}}}

**child:** Sana  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (2 miss) · board up · ready 1890 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Dono hisson ki lambai alag-alag nikalo: pehle pehli ribbon ka 1/3, phir doosri ribbon ka 1/2. Phir dono lambaiyon ka fark dekho. 60 cm ki ribbon ka 1/3, 30 cm ki ribbon ke 1/2 se kitne cm lamba hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Rahul ka hissa Sana ke hisse se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** paanch  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1027 ms · guard noconfirm]: Bilkul sahi, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 4045 ms · guard leak]: Theek hai, main shuru karti hoon. Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** mujhe lagta hai 2 hisse  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 1792 ms · guard mustsay]: Haan, bilkul theek. Dekho, har 1/3 jitni jagah mein do 1/6. Ab teen chocolate ki pattiyan lo, teeno ek hi size ki. Pehli 3 doston mein barabar bati, doosri 5 mein, teesri 10 mein. Jitne zyada dost, har dost ka hissa utna chhota. In pattiyon ke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: In pattiyon ke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 1/3  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2442 ms · guard leak,long]: Nahi, 1/3 theek nahi. Isko ek naye dhang se dekhein. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 8 bada number hai, phir bhi 8 logon wala hissa chhota, kyunki roti wahi hai. Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board compare@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":5,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (1 miss) · board up · ready 1171 ms · guard twoq,uncorrected]: 1/6 sahi nahi hai. Ek jitni dor ke jitne zyada barabar hisse, har hissa utna chhota. Socho, kis dor ke hisse zyada hain. 6 aur 9 barabar hisson mein kati do ek jitni dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek dor","items":["6 barabar hisse"]},"right":{"title":"Doosri dor","items":["9 barabar hisse"]}}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (2 miss) · board up · ready 2355 ms · guard leak,uncorrected]: Nahi, yeh theek nahi hai. Paani ki ek botal 2 doston mein baanto ya 8 mein. 8 doston ke gilaas mein kam paani aata hai, kyunki botal wahi hai. Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek dor","items":["6 barabar hisse"]},"right":{"title":"Doosri dor","items":["9 barabar hisse"]}}}

**child:** 9 wala  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 (1 miss) · board up · ready 1058 ms]: Haan, sahi hai: dono dor ek jitni, par doosri 9 hisson mein kati, toh uska hissa 1/9, 1/6 se chhota. Achha, ab pehle wale sawaal ko phir se dekhte hain. 1/3, 1/10 ya 1/5: inmein sabse chhota hissa kaun hai?
  > card: In pattiyon ke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek dor","items":["6 barabar hisse"]},"right":{"title":"Doosri dor","items":["9 barabar hisse"]}}}

**child:** 1/10  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1153 ms]: Bilkul sahi. Dekho, 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala, toh 1/10 sabse chhota. Aao, agla sawaal main aur tum mil ke karenge. Ek patti barabar baantni hai. Hissa 1/3 se chhota par 1/6 se bada chahiye, aur dost 2, 4 ya 7 ho sakte hain. Dekhna hai kitne dost theek rahenge. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"1/10"},{"parts":5,"shade":1,"label":"1/5"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1412 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


