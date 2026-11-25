# steering-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2019 ms]: Aaj hum ek poore ke barabar hisse karke bhinn banayenge. Toh shuru karte hain?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 1758 ms]: Theek hai, main shuru karti hoon. Socho, chaar log ek roti barabar baantein. Yeh roti 4 barabar hisson mein bati hai, aur rang wala hissa 1/4 hai. Barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1816 ms]: Socho chaar dost yeh roti barabar baant-te hain. Har dost ke haath chaar barabar hisson mein se ek aata hai, jaise yeh rang wala hissa: roti ka 1/4. Aise ek hisse ko fractional unit kehte hain. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2699 ms · guard ask]: Achha, ab Hindi mein bolti hoon. 1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. Ab bagal wali roti ke hisse gino. Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > card: Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 1063 ms · guard uncorrected]: 1/4 sahi nahi hai. Aath dost yeh roti barabar baantein, toh har dost ko ek hissa milta hai; us hisse ka naam doston ki ginti se banta hai, pehli roti ke 4 se nahi. Ab tum batao.
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 8 mein se 1  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 872 ms · guard long]: Bilkul sahi, kyunki roti ke 8 barabar hisse, aur yeh unmein se ek. Do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh unhe gin kar 1/3 nahi keh sakte. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 2444 ms · guard leak]: Yahan wahi patti seedhi rakhi hai: hisse ek ke baad ek, apni lambai jitne, aur neeche poori patti 15 cm. 7, 5 aur 3 cm ke hisson wali 15 cm ki patti mein, kaunsa hissa 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board unrolled@1 {} · ref {"template":"unrolled@1","params":{"unit":"cm","sides":[7,5,3],"total":15}}

**child:** ek aur picture dikhao  _(no_evidence · visual)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 2689 ms · guard leak]: Iski aur koi tasveer mere paas nahi hai. Pehle socho, 15 cm ki patti teen barabar hisson mein kaatte toh har hissa kitna lamba hota. Phir socho kaunsa hissa utna lamba hai. Chalo, ab tumhari baari.
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board unrolled@1 {} · ref {"template":"unrolled@1","params":{"unit":"cm","sides":[7,5,3],"total":15}}

**child:** teeno  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 2501 ms · guard long,uncorrected]: Nahi, yeh jawab nahi hai. Isko ek naye dhang se dekhein. Dono pattiyon ke teen hisse, par barabar sirf pehli ke. Hisse gin kar 1/3 jaisa naam tabhi dete hain, jab patti ke saare hisse barabar hon. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"}]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 2935 ms · guard leak]: Haan, pehle tum try karo.
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** mujhe lagta hai 1  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 (1 miss) · board up · ready 1490 ms]: Bilkul sahi. 24 ka 1/3, yaani 24 ÷ 3 = 8 cm; ribbon mein 8 cm ka hissa sirf 1 hai. Chalo, pichhle sawaal par wapas chalte hain. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** teeno  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 (2 miss) · board up · ready 1648 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Hisse teen hain, par ek jitne lambe nahi; chhote-bade hisse gin kar har ek ko 1/3 nahi keh sakte. 7, 5 aur 3 cm ke hisson wali 15 cm ki patti mein, kaunsa hissa 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"}]}}

**child:** middle wala  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1105 ms · guard mustsay,noconfirm]: Haan, bilkul theek: patti ke teen barabar hisse 5-5 cm ke hote. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"},{"parts":3,"shade":1,"title":"15 cm: teen 5 cm hisse"}]}}

**child:** 2 centimetre  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1001 ms · guard noconfirm]: Sahi jawab, kyunki P ka 1/4 5 cm, Q ka sirf 3 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2006 ms]: Har hissa 6 cm ka hai aur poora ganna 30 cm. Socho, 6 cm ke hisse ek ke baad ek rakhte jao toh 30 cm tak kitne aayenge, aur yeh kis hisaab se niklega. 30 cm ke ganne mein 6 cm ke kitne hisse hain, yeh jaanne ke liye kaunsa hisaab karoge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2861 ms · guard quiz]: Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Pehle is sawaal ka jawab do.
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2890 ms · guard quiz]: 30 cm ke ganne mein 6 cm ke kitne hisse hain, yeh jaanne ke liye kaunsa hisaab karoge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** 6 se bhaag  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1012 ms · guard long]: Haan, 30 ko 6 se bhaag do, toh pata chalega ganna kitne hisson mein bata. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** one fifth  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1743 ms]: Bilkul sahi. 30 ÷ 6 = 5, toh neeche 5 aata hai, 6 nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Ganna: 1/5"}]}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 1938 ms]: Achha, toh tumhe batting pasand hai! Theek hai, ab phir se kaam par aate hain. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Ganna: 1/5"}]}}

**child:** zero  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 713 ms]: Haan, bilkul theek: 16 ÷ 4 = 4, toh 1/4 hissa 4 cm ka hota; yahan koi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** 10  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-whole-dependence · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-whole-dependence · board up · ready 2183 ms · guard long,uncorrected]: 10 sahi nahi hai. Ise alag tareeke se dekhte hain. 30 cm ki ribbon ka aadha 15 cm hai, 10 cm wali ka 5 cm. Dono aadhe hain, par 15 cm wala lambi ribbon ka hai. Laal ribbon 36 cm ki, neeli 24 cm ki. Laal ka 1/3 aur neeli ka 1/2: kiska hissa lamba hai, ya dono barabar?
  > card: Laal ribbon 36 cm ki, neeli 24 cm ki. Laal ka 1/3 aur neeli ka 1/2: kiska hissa lamba hai, ya dono barabar?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** barabar  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (1 miss) · board up · ready 1120 ms]: Sahi jawab, kyunki laal ka 1/3 36 ÷ 3 = 12 cm, neeli ka 1/2 24 ÷ 2 = 12 cm, toh dono barabar. Achha, pehle wala sawaal phir se dekhte hain. 60 cm ki ribbon ka 1/3 aur 30 cm ki ribbon ka 1/2: in dono mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Laal ribbon","items":["36 cm"]},"right":{"title":"Neeli ribbon","items":["24 cm"]}}}

**child:** 10  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 (2 miss) · board up · ready 733 ms]: Nahi, 10 theek nahi. Sana ka 1/2 sirf 30 cm wali ribbon ka hai, Rahul ka 1/3 60 cm wali ka; dono hisse cm mein nikaal kar milao. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** Rahul ka 5 cm zyada  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1613 ms · guard noconfirm]: Bilkul sahi. Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1263 ms]: Aaj ke liye itna hi, phir milte hain.

## Agent


