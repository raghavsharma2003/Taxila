# steering-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1966 ms]: Aaj hum ek poore ke barabar hisse karke bhinn banayenge. Toh shuru karte hain?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1863 ms · guard long]: Theek hai, main shuru karti hoon. Ghar mein roti barabar baanti jaati hai; har hisse ka naam hota hai. Yeh roti 4 barabar hisson mein bati hai, aur rang wala hissa 1/4 hai. Barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 1276 ms · guard uncorrected]: 1/4 sahi nahi hai. Aath dost yeh roti barabar baantein, toh har dost ko ek hissa milta hai; us hisse ka naam doston ki ginti se banta hai, pehli roti ke 4 se nahi. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 2150 ms]: Achha, ab Hindi mein bolti hoon. 1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. Ab bagal wali roti ke hisse gino. Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > card: Doosri roti ke 8 hisse hain, sab ek jitne bade. Unmein se ek hisse ko kya naam doge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 1/8 wala hissa  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 1000 ms]: Bilkul sahi, kyunki roti ke 8 barabar hisse, aur yeh unmein se ek. Do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh unhe gin kar 1/3 nahi keh sakte. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** teeno  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 3214 ms · guard leak,long,uncorrected]: Nahi, yeh jawab nahi hai. Isko ek naye dhang se dekhein. Dono pattiyon ke teen hisse, par barabar sirf pehli ke. Koi hissa 1/3 tab hai, jab uske jaise teen hisse milkar poori patti banayein. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 2829 ms · guard samecard]: Yahan wahi ribbon scale par hai; nishaan wahan hain jahan woh kati. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kitne hisse 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board number-line-scale@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":24,"step":3,"marks":[{"value":10,"label":"10"},{"value":18,"label":"18"}]}}

**child:** ek aur picture dikhao  _(no_evidence · visual)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts · board up · ready 1434 ms · guard screenmismatch]: Pehle socho, 24 cm ke teen barabar hisse kitne lambe hote. Phir har hisse ko usse milao. Ab tum batao.
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (1 miss) · board up · ready 1201 ms · guard uncorrected]: 3 sahi nahi hai. Teen hisse gin lene se har hissa 1/3 nahi banta; 1/3 sirf woh hissa hai jo 24 cm ko teen barabar hisson mein kaatne par bane hisse jitna lamba ho. 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (1 miss) · board up · ready 2445 ms · guard leak]: Haan, pehle tum try karo.
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch07-t01-m-unequal-parts · check script:c6-maths-ch07-t01-s1:then:c6-maths-ch07-t01-m-unequal-parts (2 miss) · board up · ready 2406 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Teen dost ek chocolate baantein: ek ko aadhi mile, aur do ko 1/4-1/4. Kisi ka bhi hissa 1/3 nahi, kyunki 1/3 toh teen barabar hisson mein se ek hota hai. 10, 8 aur 6 cm ke hisson wali 24 cm ki ribbon mein, kitne hisse 1/3 hain?
  > card: 24 cm ki ribbon ke 3 hisse 10, 8 aur 6 cm ke hain. Inmein poori ribbon ke 1/3 jitne hisse kitne hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** 1 hai na  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 (1 miss) · board up · ready 2035 ms]: Bilkul sahi. 24 cm ka 1/3 24 ÷ 3 = 8 cm hai, aur 8 cm ka hissa sirf 1 hai. Chalo, ab pichhle sawaal par wapas chalte hain. Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon","items":["24 cm"]},"right":{"title":"Hisse","items":["10 cm","8 cm","6 cm"]}}}

**child:** teeno  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 (2 miss) · board up · ready 1744 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Hisse teen hain, par ek jitne lambe nahi; chhote-bade hisse gin kar har ek ko 1/3 nahi keh sakte. 7, 5 aur 3 cm ke hisson wali 15 cm ki patti mein, kaunsa hissa 1/3 hai?
  > card: Socho, ek aur 15 cm ki patti ke hisse 7, 5 aur 3 cm ke hain. Kaunsa hissa uska 1/3 hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"}]}}

**child:** second wala  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 975 ms · guard mustsay]: Haan, bilkul theek: patti ke teen barabar hisse 5-5 cm ke hote. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"},{"parts":3,"shade":1,"title":"15 cm: teen 5 cm hisse"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1003 ms · guard screenmismatch]: Pehle har ribbon ko alag se 4 barabar hisson mein kaato. Phir dono ka ek-ek hissa milao. 20 cm ki ribbon P ka 1/4, 12 cm ki ribbon Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** 2 cm lamba  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1724 ms · guard long,noconfirm]: Sahi jawab, kyunki P ka 1/4 5 cm, Q ka sirf 3 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** bhaag karenge  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1259 ms]: Haan, 30 ko 6 se bhaag do, toh pata chalega ganna kitne hisson mein bata. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** ek bata paanch  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 3903 ms · guard answerinq]: Bilkul sahi. 30 ÷ 6 = 5, toh neeche 5 aata hai, 6 nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":1,"title":"Ganna: 1/5"}]}}

**child:** koi bhi nahi  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 1936 ms]: Haan, bilkul theek: 16 cm ka 1/4 16 ÷ 4 = 4 cm hota, aur koi bhi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Dono ke hisson mein kitne cm ka fark hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** 5 cm fark  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1122 ms · guard noconfirm]: Haan, sahi hai, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2769 ms · guard mustsay,dodged]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 2693 ms]: Oho, sixer! Isi mein tumhe maza aata hai. Achha, ab wapas apne kaam par. Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** do hisse  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 2322 ms · guard mustsay,long]: Bilkul sahi. Har 1/3 jitni jagah mein do 1/6. Do ek hi size ki chocolate 2 aur 4 doston mein bati: 4 doston wala hissa chhota hai. Jitne zyada dost, har dost ka hissa utna chhota. Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board compare@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 1/3  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 1349 ms · guard uncorrected]: 1/3 sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 8 bada number hai, phir bhi 8 logon wala hissa chhota, kyunki roti wahi hai. Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > card: Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi size ki chocolate","items":["3 doston mein","10 doston mein","5 doston mein"]},"right":{"title":"Sabse chhota","items":["kaunsa hissa"]}}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (1 miss) · board up · ready 1640 ms]: Nahi, 1/4 theek nahi. 4 sabse chhota number hai, par 4 hisson wali dor par kainchi sabse kam baar chali, toh uske hisse sabse lambe hain, chhote nahi. 6, 9 aur 4 barabar hisson mein kati teen ek jitni dor mein se kis dor ka ek hissa sabse chhota hai?
  > card: Teen ek jitni dor 6, 9 aur 4 barabar hisson mein kati. Kis dor ka ek hissa sabse chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Teen ek jitni dor","items":["6 barabar hisse","9 barabar hisse","4 barabar hisse"]},"right":{"title":"Kis dor ka","items":["sabse chhota hissa"]}}}

**child:** nau wali  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 (1 miss) · board up · ready 1180 ms]: Haan, bilkul theek: teeno dor ek jitni, par 9 wali sabse zyada hisson mein kati, toh uska hissa 1/9 sabse chhota. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: Ab teen ek hi size ki chocolate 3, 10 aur 5 doston mein bati. Inke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Teen ek jitni dor","items":["6 barabar hisse","9 barabar hisse","4 barabar hisse"]},"right":{"title":"Kis dor ka","items":["sabse chhota hissa"]}}}

**child:** 1/10 wala  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1080 ms]: Sahi jawab, kyunki 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala, toh 1/10 sabse chhota. Aao, agla sawaal main aur tum mil ke karenge. Ek patti barabar baantni hai. Hissa 1/3 se chhota par 1/6 se bada chahiye, aur dost 2, 4 ya 7 ho sakte hain. Dekhna hai patti kitne doston mein baantein. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi size ki chocolate","items":["3 doston mein","10 doston mein","5 doston mein"]},"right":{"title":"Sabse chhota","items":["kaunsa hissa"]}}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1301 ms]: Aaj ke liye itna hi, phir milte hain.

## Agent


