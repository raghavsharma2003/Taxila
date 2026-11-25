# stuck-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1405 ms]: Aaj hum ek poore ke barabar hisse karke bhinn banayenge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 1921 ms]: Chalo, main batati hoon. Socho, chaar log ek roti barabar baantein. Yeh roti 4 barabar hisson mein bati hai, aur rang wala hissa 1/4 hai. Barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2763 ms]: Socho chaar dost yeh roti barabar baant-te hain. Har dost ke haath chaar barabar hisson mein se ek aata hai, jaise yeh rang wala hissa: roti ka 1/4. Aise ek hisse ko fractional unit kehte hain. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1045 ms]: 1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. Ab bagal wali roti ke hisse gino. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2313 ms · guard ask]: Achha, ab Hindi mein bolti hoon. Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > card: Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 711 ms]: Roti ko 4 barabar hisson mein kaata, toh har hissa 1/4 hai. 1/4 ka neeche wala 4 batata hai ki poora kitne barabar hisson mein bata. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 1/8 wala hissa  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 935 ms]: Haan, sahi hai, kyunki roti ke 8 barabar hisse, aur yeh unmein se ek. Do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh unhe gin kar 1/3 nahi keh sakte. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** paanch cm wala  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 3022 ms · guard screen,long,noconfirm]: Bilkul sahi. Patti ke teen barabar hisse 5-5 cm ke hote. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"},{"parts":3,"shade":1,"title":"15 cm: teen 5 cm hisse"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 3061 ms · guard units,screenmismatch]: Yahan dono ribbon ek hi scale par napi hain: Q 12 cm par khatam hoti hai, aur P 20 cm par. 20 cm ki ribbon P ka 1/4, 12 cm ki ribbon Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board number-line-scale@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":20,"step":2,"marks":[{"value":12,"label":"Q 12 cm"},{"value":20,"label":"P 20 cm"}]}}

**child:** 0 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence · board up · ready 1926 ms · guard long]: 0 cm sahi nahi hai. Ise alag tareeke se dekhte hain. 30 cm ki ribbon ka aadha 15 cm hai, 10 cm wali ka 5 cm. Dono aadhe hain, par 15 cm wala lambi ribbon ka hai. Laal ribbon 36 cm ki, neeli 24 cm ki. Laal ka 1/3 aur neeli ka 1/2: kiska hissa lamba hai, ya dono barabar?
  > card: Laal ribbon 36 cm ki, neeli 24 cm ki. Laal ka 1/3 aur neeli ka 1/2: kiska hissa lamba hai, ya dono barabar?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** barabar  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 (1 miss) · board up · ready 796 ms]: Haan, bilkul theek: laal ka 1/3 36 ÷ 3 = 12 cm, neeli ka 1/2 24 ÷ 2 = 12 cm, toh dono barabar. Theek hai, wapas usi sawaal par chalte hain. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Laal ribbon","items":["36 cm"]},"right":{"title":"Neeli ribbon","items":["24 cm"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 (1 miss) · board up · ready 1825 ms]: Pehle har ribbon ko alag se 4 barabar hisson mein kaato. Phir dono ka ek-ek hissa milao. 20 cm ki ribbon P ka 1/4, 12 cm ki ribbon Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** 0 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 (2 miss) · board up · ready 1681 ms · guard uncorrected]: Nahi, 0 cm theek nahi. 0 cm tabhi hota jab dono ribbon ek jitni lambi hoti; naam ek hone se hisse ek jitne nahi hote, kyunki P lambi hai, toh uska 1/4 bhi lamba hai. Ab tum batao.
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 (2 miss) · board up · ready 1576 ms]: Haan, pehle tum try karo.
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** 2 centimetre  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1085 ms · guard noconfirm]: Haan, sahi hai. P ka 1/4 5 cm, Q ka sirf 3 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** 33 ko 6 se bhaag  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1717 ms]: Nahi, kuch aur hai. Hisson ki ginti ke liye 30 ko 6 se bhaag denge, kyunki dekhna hai ki 30 cm mein 6 cm kitni baar aata hai. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (1 miss) · board up · ready 1559 ms · guard flat,uncorrected]: 1/6 sahi nahi hai. 6 toh ek hisse ki lambai hai, hisson ki ginti nahi; gino ki 30 cm mein 6 cm wale kitne hisse aate hain. 30 cm ke ganne ka 6 cm wala ek hissa kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (2 miss) · board up · ready 861 ms · guard uncorrected]: Nahi, 1/6 theek nahi. 6 ka pahada 30 tak bolo, aur ungliyon par gino; jitni ungliyan uthi, ganna utne barabar hisson mein bata. Chalo, ab tumhari baari.
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** paanchvaan hissa  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 896 ms]: Bilkul sahi: 30 ÷ 6 = 5, toh neeche 5 aata hai, 6 nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Ganna: 1/5"}]}}

**child:** 4  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 1968 ms · guard long,uncorrected]: 4 sahi nahi hai. Ek doosri tarah se samajhte hain. Dono pattiyon ke teen hisse, par barabar sirf pehli ke. Hisse gin kar 1/3 jaisa naam tabhi dete hain, jab patti ke saare hisse barabar hon. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (1 miss) · board up · ready 1015 ms · guard uncorrected]: 3 se baat nahi bani. Tumne teeno hisson ko 1/3 gina, par 10 cm aur 6 cm ek jitne lambe nahi; do alag lambai ke hisse dono 1/3 nahi ho sakte. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kitne hisse 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (2 miss) · board up · ready 848 ms]: Nahi, yeh theek nahi hai. Socho, agar yeh 24 cm ki ribbon teen barabar hisson mein kat-ti, toh har hissa kitne cm ka hota. Phir socho, ribbon ke kitne hisse sach mein utne lambe hain. Jo socha hai, woh bol do.
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 1 hissa  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 (1 miss) · board up · ready 2255 ms · guard noconfirm]: Haan, sahi hai, kyunki 24 ka 1/3, yaani 24 ÷ 3 = 8 cm; ribbon mein 8 cm ka hissa sirf 1 hai. Chalo, pichhle sawaal par wapas chalte hain. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 0 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 3739 ms · guard long,noconfirm]: Bilkul sahi. 16 ÷ 4 = 4, toh 1/4 hissa 4 cm ka hota; yahan koi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** five cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 911 ms · guard noconfirm]: Haan, bilkul theek: Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2914 ms]: Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Abhi apne kaam par wapas chalte hain. Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 3265 ms · guard leak]: Socho ek pizza 3 dost baantein aur bilkul waisa pizza 6 dost. 6 doston wala har hissa chhota hoga, kyunki pizza wahi hai. Ab gino: 3 doston wale ek hisse ki jagah mein 6 doston wale kitne hisse aate hain. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 1497 ms]: Wahi patti 3 ki jagah 6 barabar hisson mein bati, toh har hissa chhota ho gaya. Socho, 1/3 wala ek hissa kaat kar kitne 1/6 banenge. Kitne 1/6 hisse milkar ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** two parts  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 801 ms]: Haan, sahi hai. Pehli patti ke 3 hisse aur doosri ke 6, toh har 1/3 mein 1/6 ke 2 hisse aate hain. Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2024 ms · guard mustsay]: Wah, batting! Toh tumhara favourite yahi hai. Ab wahin wapas aate hain jahan hum the. Do ek hi size ki chocolate 2 aur 4 doston mein bati: 4 doston wala hissa chhota hai. Jitne zyada dost, har dost ka hissa utna chhota. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 4699 ms · guard content_filter_output]: Ek hi chocolate ko jitne zyada log baantenge, har ek ko utna kam milega. Board ki dono pattiyan ek hi size ki hain, bas alag ginti ke doston mein bati hain. Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board compare@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":4,"shade":1,"label":"1/4"}]}}

**child:** 1/3  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2027 ms · guard leak,long,uncorrected]: 1/3 sahi nahi hai. Isko ek naye dhang se dekhein. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 2 logon mein har ek ko aadhi roti milti hai, 8 mein bas ek patla sa hissa. Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > card: Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi size ki chocolate","items":["3 doston mein","10 doston mein","5 doston mein"]},"right":{"title":"Sabse chhota","items":["kaunsa hissa"]}}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (1 miss) · board up · ready 805 ms]: Nahi, 1/4 theek nahi. 4 sabse chhota number hai, par 4 hisson wali dor par kainchi sabse kam baar chali, toh uske hisse sabse lambe hain, chhote nahi. 6, 9 aur 4 barabar hisson mein kati teen ek jitni dor mein se kis dor ka ek hissa sabse chhota hai?
  > card: Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Teen ek jitni dor","items":["6 barabar hisse","9 barabar hisse","4 barabar hisse"]},"right":{"title":"Kis dor ka","items":["sabse chhota hissa"]}}}

**child:** one ninth  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 (1 miss) · board up · ready 1246 ms]: Haan, sahi hai, kyunki teeno dor ek jitni lambi hain, aur 9 wali sabse zyada hisson mein kati, isliye uska hissa, 1/9, sabse chhota. Achha, pehle wala sawaal phir se dekhte hain. Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Teen ek jitni dor","items":["6 barabar hisse","9 barabar hisse","4 barabar hisse"]},"right":{"title":"Kis dor ka","items":["sabse chhota hissa"]}}}

**child:** 10 wali  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1151 ms]: Bilkul sahi. 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala, toh 1/10 sabse chhota. Aao, agla sawaal main aur tum mil ke karenge. Ek patti barabar baantni hai. Hissa 1/3 se chhota par 1/6 se bada chahiye, aur dost 2, 4 ya 7 ho sakte hain. Dekhna hai patti kitne doston mein baantein. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi size ki chocolate","items":["3 doston mein","10 doston mein","5 doston mein"]},"right":{"title":"Sabse chhota","items":["kaunsa hissa"]}}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 875 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milte hain.

## Agent


