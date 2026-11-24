# stuck-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1787 ms]: Aaj hum ek poore ke barabar hisse karke bhinn banayenge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2127 ms]: Chalo, main batati hoon. Ghar mein roti barabar baanti jaati hai; har hisse ka naam hota hai. Yeh roti 4 barabar hisson mein bati hai, aur rang wala hissa 1/4 hai. Barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 3555 ms · guard long]: 1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. Ab bagal wali roti ke hisse gino. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2841 ms · guard ask]: Achha, ab Hindi mein bolti hoon. Socho chaar dost yeh roti barabar baant-te hain. Har dost ke haath chaar barabar hisson mein se ek aata hai, jaise yeh rang wala hissa: roti ka 1/4. Aise ek hisse ko fractional unit kehte hain. Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > card: Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** ek-aathvaan  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 1107 ms]: Haan, sahi hai, kyunki roti ke 8 barabar hisse, aur yeh unmein se ek. Do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh unhe gin kar 1/3 nahi keh sakte. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 1100 ms]: Pehle socho, 15 cm ki patti teen barabar hisson mein kaatte toh har hissa kitna lamba hota. Phir dekho kaunsa hissa utna lamba hai. 7, 5 aur 3 cm ke hisson wali 15 cm ki patti mein, kaunsa hissa 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"}]}}

**child:** the 5 cm piece  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1834 ms · guard mustsay,noconfirm]: Bilkul sahi. Patti ke teen barabar hisse 5-5 cm ke hote. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"},{"parts":3,"shade":1,"title":"15 cm: teen 5 cm hisse"}]}}

**child:** 2  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1186 ms · guard noconfirm]: Haan, bilkul theek: P ka 1/4 5 cm, Q ka sirf 3 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2743 ms]: Yahan ganna ek scale par hai, 0 se 30 cm tak, aur 6 cm par ek nishaan: ek hissa itna lamba hai. 30 cm ke ganne mein 6 cm ke kitne hisse hain, yeh jaanne ke liye kaunsa hisaab karoge?
  > screen: board number-line-scale@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":30,"step":10,"marks":[{"value":6,"label":"6 cm"},{"value":30,"label":"30 cm"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1038 ms]: Har hissa 6 cm ka hai aur poora ganna 30 cm. Socho, 6 cm ke hisse ek ke baad ek rakhte jao toh 30 cm tak kitne aayenge, aur yeh kis hisaab se niklega. Ab tum batao.
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3337 ms · guard quiz]: Ab phir se socho, jawab kya hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1784 ms · guard twoq]: Hisson ki ginti ke liye 30 ko 6 se bhaag denge, kyunki dekhna hai ki 30 cm mein 6 cm kitni baar aata hai. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 2087 ms]: Socho, 30 cm mein 6 cm kitni baar aata hai: utne hi barabar hisse hain, aur wahi ginti neeche aati hai. Chalo, ab tumhari baari.
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 2259 ms]: Haan, pehle tum try karo.
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (1 miss) · board up · ready 1181 ms · guard uncorrected]: 1/6 sahi nahi hai. 6 toh ek hisse ki lambai hai, hisson ki ginti nahi; gino ki 30 cm mein 6 cm wale kitne hisse aate hain. 30 cm ke ganne ka 6 cm wala ek hissa kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked (2 miss) · board up · ready 972 ms · guard uncorrected]: Nahi, 1/6 theek nahi. Ek chhoti cheez se socho: 10 cm ki pencil 5 cm ke hisson mein kaato toh 2 hisse bante hain, aur ek hissa uska 1/2 hai. Ganne ke saath bhi aisa hi karna hai. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** one fifth  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 1042 ms]: Haan, sahi hai. Toh poora jawab: ek hissa poore ganne ka 1/5 hai, kyunki 30 ÷ 6 = 5, toh neeche 5 aata hai, 6 nahi. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Ganna: 1/5"}]}}

**child:** 4  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 2353 ms · guard long,uncorrected]: 4 sahi nahi hai. Ise alag tareeke se dekhte hain. Dono pattiyon ke teen hisse, par barabar sirf pehli ke. Koi hissa 1/3 tab hai, jab uske jaise teen hisse milkar poori patti banayein. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (1 miss) · board up · ready 1154 ms]: 3 se baat nahi bani. Teen hisse gin lene se har hissa 1/3 nahi banta; 1/3 sirf woh hissa hai jo 24 cm ko teen barabar hisson mein kaatne par bane hisse jitna lamba ho. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kitne hisse 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (2 miss) · board up · ready 1035 ms · guard uncorrected]: 3 sahi nahi hai. Pehle socho, 24 cm ke teen barabar hisse kitne lambe hote. Phir har hisse ko usse milao. Jo socha hai, woh bol do.
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (3 miss) · board up · ready 3740 ms · guard long,uncorrected]: Nahi, yeh theek nahi hai. Teen dost ek chocolate baantein: ek ko aadhi mile, aur do ko 1/4-1/4. Kisi ka bhi hissa 1/3 nahi, kyunki 1/3 toh teen barabar hisson mein se ek hota hai. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (4 miss) · board up · ready 1142 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. 1/3 matlab poore ke teen barabar hisson mein se ek. Chhote-bade hisse gin kar yeh naam nahi milta; har hisse ki lambai barabar wale hisse se milao. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kitne hisse 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** sirf ek hissa  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 (1 miss) · board up · ready 2996 ms · guard long]: Haan, sahi hai. 24 cm ka 1/3 24 ÷ 3 = 8 cm hai, aur 8 cm ka hissa sirf 1 hai. Theek hai, ab wapas usi sawaal par chalte hain. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 0 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 3613 ms · guard long,noconfirm]: Bilkul sahi: 16 cm ka 1/4 16 ÷ 4 = 4 cm hota, aur koi bhi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** paanch cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1041 ms · guard noconfirm]: Haan, bilkul theek, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 5371 ms · guard mustsay]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 2889 ms]: Wah, sixer! Toh tumhara favourite yahi hai. Achha, ab wapas apne kaam par. Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** 1 hisse  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 (1 miss) · board up · ready 3060 ms · guard samecard,uncorrected]: 1 hisse sahi nahi hai. Wahi patti 3 ki jagah 6 barabar hisson mein bati, toh har hissa chhota ho gaya. Socho, 1/3 wala ek hissa kaat kar kitne 1/6 banenge. Kitne 1/6 hisse milkar ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 3 hisse  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 (2 miss) · board up · ready 1893 ms]: Nahi, 3 hisse theek nahi. Socho ek pizza 3 dost baantein aur bilkul waisa pizza 6 dost. 6 doston mein har ek ka hissa chhota hoga, kyunki pizza wahi hai. Board par bhi 1/6 wala hissa 1/3 wale se chhota hai. Ab tum batao.
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** two parts  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 1210 ms · guard mustsay]: Haan, sahi hai. Har 1/3 jitni jagah mein do 1/6. Do ek hi size ki chocolate 2 aur 4 doston mein bati: 4 doston wala hissa chhota hai. Jitne zyada dost, har dost ka hissa utna chhota. Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board compare@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** one tenth  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1173 ms]: Bilkul sahi: 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala, toh 1/10 sabse chhota. Aao, agla sawaal main aur tum mil ke karenge. Ek patti barabar baantni hai. Hissa 1/3 se chhota par 1/6 se bada chahiye, aur dost 2, 4 ya 7 ho sakte hain. Dekhna hai patti kitne doston mein baantein. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi size ki chocolate","items":["3 doston mein","10 doston mein","5 doston mein"]},"right":{"title":"Sabse chhota","items":["kaunsa hissa"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 1803 ms]: Hissa 1/3 aur 1/6 se milana hai. Socho, har option mein kaunsi cheez nikaalni hogi jise in dono se milaa sako. 2, 4 ya 7 dost: in options ko 1/3 aur 1/6 se milane ke liye pehle har option mein kya pata karna hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1191 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milte hain.

## Agent


