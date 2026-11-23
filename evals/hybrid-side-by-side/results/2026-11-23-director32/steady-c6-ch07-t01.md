# steady-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 1872 ms]: Ghar mein ek roti 4 bachchon mein barabar baantni hai. Har hisse ka ek naam hota hai. Yeh roti 4 barabar hisson mein bati hai. Rang wala ek hissa poori roti ka 1/4 hai. Poore ke barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 8/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 1699 ms · guard flat,uncorrected]: 8/1 sahi nahi hai. 1/4 mein neeche wala 4 batata hai ki roti kitne barabar hisson mein bati. Ab bagal wali roti ke hisse gino. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 8/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (2 miss) · board up · ready 1055 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Socho chaar dost yeh roti barabar baant-te hain. Har dost ke haath chaar barabar hisson mein se ek aata hai, jaise yeh rang wala hissa: roti ka 1/4. Aise ek hisse ko fractional unit kehte hain. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (2 miss) · board up · ready 968 ms]: Roti ko 4 barabar hisson mein kaata, toh har hissa 1/4 hai. 1/4 ka neeche wala 4 batata hai ki poora kitne barabar hisson mein bata. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** ek-aathvaan  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 911 ms · guard mustsay]: Haan, sahi hai. Dekho, roti ke 8 barabar hisse, aur yeh unmein se ek. Ab do pattiyan dekho, dono ke 3 hisse. A ke teeno hisse barabar hain, toh har hissa 1/3 hai. B ke hisse chhote-bade hain, toh hisse gin kar unhe 1/3 nahi keh sakte. Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** five  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 904 ms · guard mustsay,noconfirm]: Bilkul sahi: teen barabar hisse milkar poori 15 cm ki patti. Ab do ribbon lo: P 20 cm ki, Q 12 cm ki. P ka 1/2 10 cm hai, aur Q ka 1/2 6 cm. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"15 cm"}]}}

**child:** two cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 850 ms · guard noconfirm]: Haan, bilkul theek, kyunki P ka 1/4 5 cm, Q ka sirf 3 cm. Aao, agla sawaal main aur tum mil ke karenge. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ab dekhna hai ki ek hissa poore ganne ka kaunsa fractional unit hai. Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** bhaag karenge  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1380 ms · guard long]: Haan, 30 ko 6 se bhaag do, toh pata chalega ganna kitne hisson mein bata. Dhyaan rakhna, fractional unit ke neeche hisse ki lambai 6 nahi aati; neeche woh ginti aati hai ki ganna kitne barabar hisson mein bata. Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 1862 ms]: Yahan wahi ganna scale par hai, aur 0 se 6 cm tak ka pehla hissa nishaan se alag dikhaya hai. 30 cm ke ganne ka 6 cm wala ek hissa kaunsa fractional unit hai?
  > card: Tumhari baari: 6 cm wala ek hissa poore ganne ka kaunsa fractional unit hai?
  > screen: board compare@1 {} · ref {"template":"number-line-scale@1","params":{"from":0,"to":30,"step":6,"marks":[{"value":6,"label":"ek hissa"}]}}

**child:** 1/5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 1426 ms]: Haan, sahi hai. Dekho, 30 ÷ 6 = 5 barabar hisse bane, aur neeche hisson ki ginti aati hai, hisse ki lambai nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 2, 6 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** ek bhi hissa nahi  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 1622 ms]: Bilkul sahi: 16 cm ka 1/4 16 ÷ 4 = 4 cm hota, aur koi bhi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Rahul ka hissa Sana ke hisse se kitne cm lamba hai?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Rahul ka hissa Sana ke hisse se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","2 cm","6 cm","2 cm"]}}}

**child:** 5  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 946 ms · guard noconfirm]: Haan, bilkul theek, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm; 20 − 15 = 5. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Ab tak samajh aaya?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 3214 ms · guard leak]: Achha, pehle main dikhati hoon. Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"scale":true,"left":{"title":"Rahul ki ribbon","items":["60 cm"]},"right":{"title":"Sana ki ribbon","items":["30 cm"]}}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 1513 ms]: Haan, pehle tum try karo.
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 2 hisse  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 1130 ms · guard mustsay]: Haan, sahi hai. Dekho, har 1/3 jitni jagah mein do 1/6. Ab teen chocolate ki pattiyan lo, teeno ek hi size ki. Pehli 3 doston mein barabar bati, doosri 5 mein, teesri 10 mein. Jitne zyada dost, har dost ka hissa utna chhota. In pattiyon ke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > card: In pattiyon ke hisson mein sabse chhota kaunsa hai: 1/3, 1/10 ya 1/5?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 1/10  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2374 ms · guard ignored,long]: Bilkul sahi: 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala, toh 1/10 sabse chhota. Chalo, ab ek sawaal hum dono saath mein karte hain. Ek patti barabar baantni hai. Hissa 1/3 se chhota par 1/6 se bada chahiye, aur dost 2, 4 ya 7 ho sakte hain. Dekhna hai kitne dost theek rahenge. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"1/10"},{"parts":5,"shade":1,"label":"1/5"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** har ek ka hissa nikalenge  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked · board up · ready 1882 ms]: Haan, pehle har dost ka hissa, har option mein. Ab 1/3 se chhote hisse chunte hain: 4 doston ka 1/4 aur 7 ka 1/7. 2 doston ka 1/2 toh 1/3 se bada hai. Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > card: Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked · board up · ready 1976 ms]: Achha, ab Hindi mein bolti hoon. Jitne zyada dost, utna chhota hissa. Hissa 1/6 se bada chahiye, toh dost 1/6 wale doston se kam hone chahiye. Hissa 1/3 se chhota aur 1/6 se bada chahiye: 2, 4 ya 7 mein se kitne dost theek rahenge?
  > card: Tumhari baari: toh patti kitne doston mein baantoge, 2, 4 ya 7?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch07-t01-s2:c1 · board up · ready 1057 ms]: Haan, bilkul theek. Toh poora jawab: patti 4 doston mein baanto: har hissa 1/4, jo 1/3 se chhota aur 1/6 se bada hai, kyunki dost jitne zyada, hissa utna chhota; 4 dost 3 aur 6 ke beech aate hain. Chalo, ab tumhari apni baari. Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > card: Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > screen: board compare@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 4  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 990 ms]: 4 sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 8 bada number hai, phir bhi 8 logon wala hissa chhota, kyunki roti wahi hai. Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Cake","items":["barabar hisse"]},"right":{"title":"Har hissa","items":["1/5 se chhota"]}}}

**child:** 1/6  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator (1 miss) · board up · ready 2079 ms · guard leak,uncorrected]: Nahi, 1/6 theek nahi. Ek jitni dor ke jitne zyada barabar hisse, har hissa utna chhota. Socho, kis dor ke hisse zyada hain. 6 aur 9 barabar hisson mein kati do ek jitni dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek dor","items":["6 barabar hisse"]},"right":{"title":"Doosri dor","items":["9 barabar hisse"]}}}

**child:** 9 wali dor  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch07-t01-s2:c1 (1 miss) · board up · ready 1141 ms]: Haan, sahi hai. Dekho, dono dor ek jitni, par doosri 9 hisson mein kati, toh uska hissa 1/9, 1/6 se chhota. Chalo, ab pichhle sawaal par wapas chalte hain. Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > card: Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek dor","items":["6 barabar hisse"]},"right":{"title":"Doosri dor","items":["9 barabar hisse"]}}}

**child:** chhah hisse  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 · board up · ready 941 ms]: Bilkul sahi: 6 hisse karo toh har hissa 1/6, jo 1/5 se chhota; 4 se 1/4 milta, jo bada. Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, aur scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > card: Ek hi raste par cycle ne raste ka 1/6 hissa tay kiya, aur scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Cake","items":["barabar hisse"]},"right":{"title":"Har hissa","items":["1/5 se chhota"]}}}

**child:** scooter  _(misconception)_

**Asha** [repair · beat s2:check:c2 · board up · ready 2818 ms · guard praise,affirms,uncorrected]: Nahi, yeh theek nahi hai. Is sawaal ka sahi jawab: cycle zyada door gayi, kyunki raasta ek hi hai; 1/6 ke liye woh 6 hisson mein bata, 8 se kam, toh 1/6 lamba. Ab tak samajh aaya?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa"]}}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s2:check:c3 · board up · ready 2002 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa"]}}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 · board up · ready 1998 ms]: Achha, toh tumhe sixer sabse achha lagta hai. Ab apni padhai par lautte hain. Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > card: Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ek hi raasta","items":["cycle","scooter"]},"right":{"title":"Tay kiya","items":["raste ka hissa","raste ka hissa"]}}}

**child:** yes  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 (1 miss) · board up · ready 2093 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Dono pattiyan ek jaisi hain; dekho kaunsi patti zyada hisson mein bati hai. Kya 1/8 sach mein 1/5 se bada hai?
  > card: Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** sahi nahi  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1028 ms]: Haan, sahi hai. Dekho, 1/8 ke liye poora 8 hisson mein bata, 5 se zyada, toh 1/8 chhota hai, bada nahi. Ab ek se zyada cheezein barabar baantenge, jaise kuch roti kuch bachchon mein, aur har ek ka hissa bhinn mein likhenge. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch07-t01-s3:ask:e1 · board up · ready 2916 ms · guard mustsay,answerinq]: 3 roti 4 bachchon mein barabar baantni hain. Har roti ke 4 barabar hisse karo, aur har bachche ko har roti se ek hissa do, yaani 1/4. Teen roti se teen hisse milte hain: 3/4 roti. Ab bachche wahi 4 hain, par roti sirf 2. Ek bachche ke hisse mein kitni roti aayegi?
  > card: Ab bachche wahi 4 hain, par roti sirf 2. Ek bachche ke hisse mein kitni roti aayegi?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":""},{"parts":4,"shade":1,"label":""},{"parts":4,"shade":1,"label":""}]}}

**child:** 1/2 roti  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c6-maths-ch07-t01-s3:ask:e2 · board up · ready 872 ms · guard mustsay,noconfirm]: Bilkul sahi: har roti se ek 1/4, aur roti do. 3 roti 4 bachchon mein 3/4 mili, jo 1 se kam hai. Ab 5 laddoo 2 bachchon mein: hissa 5/2 laddoo, 1 se zyada, kyunki laddoo bachchon se zyada hain. Niyam wahi: cheezein upar, baantne wale neeche. Ab 6 chikki 5 bachchon mein barabar baanti. Har bachche ka hissa kaunsi bhinn hai?
  > card: Ab 6 chikki 5 bachchon mein barabar baanti. Har bachche ka hissa kaunsi bhinn hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** 5/6  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c6-maths-ch07-t01-m-share-flipped · check script:c6-maths-ch07-t01-s3:then:c6-maths-ch07-t01-m-share-flipped · board up · ready 2442 ms · guard answerinq,uncorrected]: 5/6 sahi nahi hai. Ek doosri tarah se samajhte hain. 2 roti 5 bachchon mein: har roti ke 5 barabar hisse karo, aur har bachche ko har roti se ek hissa do. Jitni roti hain, har bachche ko utne hi hisse milte hain. 4 roti 7 bachchon mein barabar baanti gayi. Ek bachche ke paas kitni roti pahunchi?
  > card: 4 roti 7 bachchon mein barabar baanti gayi. Ek bachche ke paas kitni roti pahunchi?
  > screen: board fraction-parts@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chikki","items":["6 chikki"]},"right":{"title":"Bachche","items":["5 bachche"]}}}

**child:** 4/7  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c6-maths-ch07-t01-s3:ask:e2 (1 miss) · board up · ready 868 ms]: Haan, bilkul theek. Dekho, har roti se 1/7, aur roti 4, toh 4/7; roti upar, bachche neeche. Achha, ab pehle wale sawaal ko phir se dekhte hain. 6 chikki 5 bachchon mein barabar baanto, toh ek bachche ka hissa bhinn mein kya hoga?
  > card: Ab 6 chikki 5 bachchon mein barabar baanti. Har bachche ka hissa kaunsi bhinn hai?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":4,"whole":"roti"}}

**child:** 6/5 hai na  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c6-maths-ch07-t01-s3:ask:e3 · board up · ready 1642 ms · guard mustsay]: Haan, sahi hai, kyunki baanti jaane wali chikki upar, bachche neeche. Ab lambai ki baat: yeh line 1 metre ki ribbon hai, 0 se 1 tak, yaani 100 cm. Ise 2 barabar hisson mein kaato toh har hissa 1/2 metre hai, aur 100 ÷ 2 = 50 cm. Ab wahi 1 metre ki ribbon 5 barabar hisson mein kaato. Aise 2 hisse milakar kitne cm honge?
  > card: Ab wahi 1 metre ki ribbon 5 barabar hisson mein kaato. Aise 2 hisse milakar kitne cm honge?
  > screen: board fraction-line@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chikki","items":["6 chikki"]},"right":{"title":"Bachche","items":["5 bachche"]}}}

**child:** 40  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 982 ms]: Sahi jawab. Dekho, metre ka ek hissa 100 ÷ 5 = 20 cm, toh 2 hisse 20 + 20 = 40 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. 5 laddoo 3 bachchon mein barabar baantne hain, aur pata karna hai ki ek-ek bachche ka hissa kitna banta hai. Har laddoo ke kitne barabar hisse karoge?
  > screen: board compare@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,5],"from":0,"to":1,"marks":[[1,2],[2,5]]}}

**child:** 3 hisse hai na  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c6-maths-ch07-t01-s3:ask:worked · board up · ready 2341 ms]: Haan, 3 hisse, kyunki bachche 3 hain. Ab har laddoo se har bachche ko ek hissa milta hai, yaani har laddoo ka 1/3. Tumhari baari: 5 laddoo se ek bachche ko kul kitna laddoo mila, bhinn mein?
  > card: Tumhari baari: 5 laddoo se ek bachche ko kul kitna laddoo mila, bhinn mein?
  > screen: board equal-groups@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Laddoo","items":["5 laddoo"]},"right":{"title":"Bachche","items":["3 bachche"]}}}

**child:** 5/3  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c6-maths-ch07-t01-s3:c1 · board up · ready 3754 ms · guard answerinq]: Bilkul sahi: laddoo bachchon se zyada the, isliye hissa 1 se zyada aaya. Toh poora jawab: har bachche ko 5/3 laddoo milta hai, yaani 1 poora aur 2/3. Ab agla sawaal tumhare liye. Kuch roti 5 doston mein barabar baanti gayi, aur har dost ko 3/5 roti mili. Kul kitni roti thi?
  > card: Kuch roti 5 doston mein barabar baanti gayi, aur har dost ko 3/5 roti mili. Kul kitni roti thi?
  > screen: board fraction-parts@1 {} · ref {"template":"equal-groups@1","params":{"groups":5,"each":3,"title":"5/3 laddoo"}}

**child:** 5  _(misconception)_

**Asha** [hint · beat s3:check:c1 · check script:c6-maths-ch07-t01-s3:c1 (1 miss) · board up · ready 2022 ms · guard samecard,uncorrected]: 5 sahi nahi hai. Har roti se har dost ko ek hissa milta hai. Ab socho, 3/5 jitne hisse kitni rotiyon se aaye honge. 5 doston mein baantne par har ek ko 3/5 roti mili, toh kul kitni roti thi?
  > card: Kuch roti 5 doston mein barabar baanti gayi, aur har dost ko 3/5 roti mili. Kul kitni roti thi?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":0,"whole":"bar"}}

**child:** mujhe lagta hai 3 roti  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c6-maths-ch07-t01-s3:c2 · board up · ready 1707 ms]: Haan, sahi hai, kyunki har roti se har dost ko 1/5 mila; 3/5 matlab 3 hisse, toh 3 roti thi. 5 metre ribbon 4 banners mein barabar baanti. Har banner ko 1 metre se kam ribbon milegi ya zyada?
  > card: 5 metre ribbon 4 banners mein barabar baanti. Har banner ko 1 metre se kam ribbon milegi ya zyada?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

**child:** jyada  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c6-maths-ch07-t01-s3:c3 · board up · ready 1106 ms]: Haan, bilkul theek. Dekho, ribbon ke metre banners se zyada hain, toh har banner ko 5/4 metre, jo 1 metre se zyada hai. 3 roti 8 bachchon mein barabar baanti gayi. Kabir ne likha ki har bachche ko 8/3 roti mili. Sahi hissa kya hai?
  > card: 3 roti 8 bachchon mein barabar baanti gayi. Kabir ne likha ki har bachche ko 8/3 roti mili. Sahi hissa kya hai?
  > screen: board fraction-parts@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon","items":["5 metre"]},"right":{"title":"Banners","items":["4 banners"]}}}

**child:** 3/8  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 3 ms]: Sahi jawab, kyunki har roti se 1/8, aur 3 roti upar, 8 bachche neeche: 3/8. Aaj ki saari baatein jodne wala ek aakhri sawaal aa raha hai. Do ek jaisi roti 3 bachchon mein barabar baanti gayi, aur waisi hi 2 roti 5 bachchon mein. Kis group ke har bachche ko zyada roti mili: 3 bachchon wale ya 5 wale?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":3,"whole":"roti"}}

**child:** 3 bachchon wala group  _(correct)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1980 ms]: Bilkul sahi: dono groups mein har bachche ko har roti se ek hissa mila, yaani 2 hisse. 3 bachchon mein har hissa 1/3 hai aur 5 mein 1/5, aur 1/3 bada hai, toh 2/3 roti 2/5 se zyada hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":5,"shade":2,"label":"2/5"}]}}

**child:** pehle wale step se pata chala  _(no_evidence)_

**Asha** [wrap · ready 1457 ms]: Achha, samajh gayi. Pehle dekha ki fractional unit poore ka ek barabar hissa hai, aur uski lambai poore par tikti hai. Phir dekha ki ek hi poora jitne zyada barabar hisson mein bate, har hissa utna chhota. Aakhir mein kai cheezein barabar baanti: cheezein upar, baantne wale neeche, jaise 3 roti 4 bachchon mein 3/4. Aaj ka paath kaisa laga?

**child:** sawaal achhe the  _(no_evidence)_

**Asha** [wrap · ready 1331 ms]: Theek hai, batane ke liye shukriya. Aaj ke bhinn wale paath mein tumne ek dost ki ulti likhi bhinn theek ki. Aaj ke liye itna hi, phir milte hain.

## Agent


