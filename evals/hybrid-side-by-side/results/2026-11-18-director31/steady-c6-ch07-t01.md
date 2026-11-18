# steady-c6-ch07-t01 · c6-maths-ch07-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 · board up · ready 2738 ms · guard long]: Ghar mein ek roti 4 bachchon mein barabar baantni hai. Har bachche ke hisse ka ek pakka naam hota hai. Yeh roti 4 barabar hisson mein bati hai. Rang wala ek hissa poori roti ka 1/4 hai, ek-chauthaai. Poore ke barabar hisson mein se aisa ek hissa fractional unit kehlata hai. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 8/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (1 miss) · board up · ready 2268 ms · guard flat,uncorrected]: 8/1 sahi nahi hai. Bhinn ka neeche wala number batata hai ki poora kitne barabar hisson mein bata. Bagal wali roti ke hisse gino. 8 barabar hisson wali roti ka ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** 8/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c6-maths-ch07-t01-s1:ask:e1 (2 miss) · board up · ready 1003 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Socho chaar dost yeh roti barabar baant-te hain. Har dost ke haath chaar barabar hisson mein se ek aata hai, jaise yeh rang wala hissa: roti ka 1/4. Aise ek hisse ko fractional unit kehte hain. Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > card: Ab bagal wali roti dekho, utni hi badi, par 8 barabar hisson mein bati. Uska ek hissa kaunsa fractional unit hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"title":"1/4"},{"parts":8}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 2770 ms · guard praise]: Is sawaal ka jawab 1/8 hai, kyunki pehli roti ke 4 hisse the, par yeh roti 8 barabar hisson mein bati hai, toh ek hissa 1/8. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch07-t01-s1:ask:e2 · board up · ready 2196 ms · guard mustsay]: Dono pattiyan 12 cm ki hain aur dono ke 3 hisse hain. A ke teeno hisse 4 cm ke hain, barabar, toh har hissa 1/3 hai. B ke hisse 6, 3 aur 3 cm ke hain, toh unmein se koi bhi 1/3 nahi. Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > card: Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"title":"A: 4, 4, 4 cm"},{"parts":3,"equal":false,"title":"B: 6, 3, 3 cm"}]}}

**child:** 5 centimetres  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch07-t01-s1:ask:e3 · board up · ready 1165 ms · guard mustsay]: Haan, sahi hai. Dekho, teen barabar hisse milkar poori 15 cm ki patti. Ribbon P 20 cm ki hai, toh uska 1/2 10 cm hai. Ribbon Q 12 cm ki hai, toh uska 1/2 sirf 6 cm hai. Naam ek hai, 1/2, par poora alag hai, isliye lambai alag hai. Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > card: Ab dono ribbon ka 1/4 lo. P ka 1/4, Q ke 1/4 se kitne cm lamba hai?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"15 cm"}]}}

**child:** 2 cm lamba  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1338 ms · guard noconfirm]: Bilkul sahi: P ka 1/4 20 ÷ 4 = 5 cm, Q ka 12 ÷ 4 = 3 cm, toh fark 2 cm. Aao, agla sawaal main aur tum mil ke karenge. Dadi ne 30 cm lamba ganna barabar hisson mein kaata, aur har hissa 6 cm ka hai. Ek hissa poore ganne ka kaunsa bhinn hai? Bhinn batane se pehle kya pata karna hoga?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon P","items":["20 cm"]},"right":{"title":"Ribbon Q","items":["12 cm"]}}}

**child:** how many parts  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 2303 ms · guard long]: Haan, pehle yeh ki ganna kitne barabar hisson mein bata. 30 cm mein 6 cm ke hisse gino: 30 ÷ 6 = 5 hisse, kyunki har hissa 6 cm ka hai, aur 5 × 6 = 30. Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > card: Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > screen: board fraction-parts@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ganna","items":["30 cm"]},"right":{"title":"Ek hissa","items":["6 cm"]}}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c6-maths-ch07-t01-s1:ask:worked · board up · ready 2332 ms]: Yahan ganne ki patti gol ban gayi hai, apne barabar hisson mein bati hui. 30 cm ganne ke 6 cm wale ek hisse ka bhinn kya hai?
  > card: Tumhari baari: ek hissa poore ganne ka kaunsa bhinn hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":0,"whole":"bar"}}

**child:** 1/5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch07-t01-s1:c1 · board up · ready 1433 ms]: Haan, bilkul theek. Dekho, neeche wala number hisson ki ginti hai, hisse ki lambai nahi. Toh poora jawab: ek hissa poore ganne ka 1/5 hai. Ab ek sawaal tum akele karo. 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > card: 16 cm lambi chocolate toot kar 6, 6, 2 aur 2 cm ke hisson mein bat gayi. Inmein se kitne hisse poori chocolate ka 1/4 hain?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":1,"whole":"bar"}}

**child:** zero  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch07-t01-s1:c2 · board up · ready 1201 ms]: Haan, sahi hai: 16 cm ka 1/4 16 ÷ 4 = 4 cm hota, aur koi bhi hissa 4 cm ka nahi, toh 0 hisse. Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > card: Ek ribbon 60 cm ki hai aur doosri 30 cm ki. Rahul ne pehli ka 1/3 liya, aur Sana ne doosri ka 1/2. Kiska hissa lamba hai, Rahul ka ya Sana ka?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chocolate","items":["16 cm"]},"right":{"title":"Hisse","items":["6 cm","6 cm","2 cm","2 cm"]}}}

**child:** Rahul ka  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1210 ms · guard noconfirm]: Bilkul sahi, kyunki Rahul ka hissa 60 ÷ 3 = 20 cm, Sana ka 30 ÷ 2 = 15 cm, toh Rahul ka lamba. Ab ek hi poore ko kabhi kam, kabhi zyada barabar hisson mein baantenge, aur dekhenge ki ek hissa kaise badalta hai. Ab tak samajh aaya?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]},"mark":{"side":"left"}}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2931 ms]: Ab ek hi poore ko kam ya zyada hisson mein baant kar hisse milayenge. Yahan tak saaf hai?
  > screen: board compare@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Rahul","items":["60 cm ka 1/3"]},"right":{"title":"Sana","items":["30 cm ka 1/2"]},"mark":{"side":"left"}}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 2233 ms]: Yeh do pattiyan bilkul ek jaisi hain. Pehli 3 barabar hisson mein bati hai, doosri 6 mein. 6 bada number hai, phir bhi 1/6 wala hissa 1/3 wale se chhota hai, kyunki wahi patti zyada hisson mein bati. Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch07-t01-s2:ask:e1 · board up · ready 3336 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Doosri patti ke kitne 1/6 hisse milkar pehli patti ka ek 1/3 hissa banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 2 hisse  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch07-t01-s2:ask:e2 · board up · ready 1345 ms · guard mustsay]: Haan, sahi hai. Dekho, 6 hisse 3 ke do guna, toh tihaai mein do. Yeh teen chocolate ki pattiyan ek hi size ki hain. Pehli 3 doston mein barabar bati, doosri 5 mein, teesri 10 mein. Jitne zyada dost, har dost ka hissa utna chhota. In pattiyon ke 1/3, 1/10 aur 1/5 hisson ko sabse chhote se sabse bade tak kram mein lagao.
  > card: In pattiyon ke 1/3, 1/10 aur 1/5 hisson ko sabse chhote se sabse bade tak kram mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 1/10, 1/5 aur 1/3  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1163 ms]: Bilkul sahi: 10 doston wala hissa sabse chhota, phir 5 wala, phir 3 wala: 1/10, 1/5, 1/3. Chalo, ab ek sawaal hum dono saath mein karte hain. Ek jaisi chocolate ki pattiyan barabar baantni hain. Tumhe aisa hissa chahiye jo 1/3 se chhota ho par 1/6 se bada. Patti kitne doston mein baantoge: 2, 4 ya 7? Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"1/10"},{"parts":5,"shade":1,"label":"1/5"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 1983 ms]: Theek hai, yahi baat seedhe tareeke se kehti hoon. Teeno options mein se har ek ke liye sabse pehle kya pata karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2261 ms]: Cricket ki baat bhi hogi, bas yeh bhinn wala kaam khatam ho jaaye. Ab yeh kaam poora karte hain. Har option ke liye pehle kya nikaaloge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** each friend's part  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked · board up · ready 2709 ms]: Haan, pehle har dost ka hissa, har option mein. Ab 1/3 se chhote hisse chuno: 1/4 aur 1/7; 1/2 toh 1/3 se bada hai, kyunki do dost teen se kam hain, toh unka hissa bada. Tumhari baari: 1/4 ya 1/7, inmein se kaunsa hissa 1/6 se bada hai?
  > card: Tumhari baari: 1/4 ya 1/7, inmein se kaunsa hissa 1/6 se bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** 1/7  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch07-t01-m-bigger-denominator · check script:c6-maths-ch07-t01-s2:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2701 ms · guard long,uncorrected]: 1/7 sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti: ek 2 logon mein bati, doosri 8 mein. 8 bada number hai, phir bhi 8 logon wala hissa chhota, kyunki roti wahi hai. Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor hain: ek 6 barabar hisson mein kati, doosri 9 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":6,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** 1/9 hai na  _(correct)_

**Asha** [repair · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 1771 ms]: Haan, sahi hai. Dekho, dono dor ek jitni, par doosri 9 hisson mein kati, toh uska hissa 1/9, 1/6 se chhota. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":9,"shade":1,"label":"1/9"}]}}

**child:** haan  _(no_evidence)_

**Asha** [repair · beat s2:check:then:c6-maths-ch07-t01-m-bigger-denominator · board up · ready 2107 ms]: Cricket wali baat batao na, tumhe uski kaunsi baat pasand hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":9,"shade":1,"label":"1/9"}]}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [practice · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked (1 miss) · board up · ready 1944 ms]: Achha, toh tumhe batting sabse achha lagta hai. Chalo, ab pichhle sawaal par wapas chalte hain. 1/4 ya 1/7: inmein se 1/6 se bada kaunsa hai?
  > card: Tumhari baari: 1/4 ya 1/7, inmein se kaunsa hissa 1/6 se bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":9,"shade":1,"label":"1/9"}]}}

**child:** 1/7  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c6-maths-ch07-t01-s2:ask:worked (2 miss) · board up · ready 2448 ms · guard leak,twoq]: Nahi, 1/7 theek nahi. Jis option mein patti 1/6 wale se kam doston mein bati, uska hissa bada hoga. Ab phir se socho, jawab kya hoga?
  > card: Tumhari baari: 1/4 ya 1/7, inmein se kaunsa hissa 1/6 se bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":6,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** 4 dost  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch07-t01-s2:c1 · board up · ready 1569 ms]: Bilkul sahi. Toh poora jawab: patti 4 doston mein baanto: har hissa 1/4, jo 1/3 se chhota aur 1/6 se bada hai, kyunki dost jitne zyada, hissa utna chhota; 4 dost 3 aur 6 ke beech aate hain. Chalo, ab tumhari apni baari. Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > card: Ek cake ko barabar hisson mein kaatna hai, aur har hissa 1/5 cake se chhota chahiye. 4 hisse karoge ya 6?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":6,"shade":1,"label":"1/6"},{"parts":7,"shade":1,"label":"1/7"}]}}

**child:** six  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 · board up · ready 1374 ms]: Haan, sahi hai. Dekho, 6 hisse karo toh har hissa 1/6, jo 1/5 se chhota; 4 se 1/4 milta, jo bada. Ek hi raste par ek cycle ne raste ka 1/6 hissa tay kiya, aur ek scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > card: Ek hi raste par ek cycle ne raste ka 1/6 hissa tay kiya, aur ek scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":4,"shade":1,"label":"1/4"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** scooter  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c6-maths-ch07-t01-s2:c2 (1 miss) · board up · ready 2240 ms · guard twoq,uncorrected]: Nahi, yeh theek nahi hai. Raasta ek hi hai; socho kis bhinn mein raasta kam hisson mein bata. 1/6 raasta tay karne wali cycle aur 1/8 tay karne wala scooter: kaun zyada door gaya?
  > card: Ek hi raste par ek cycle ne raste ka 1/6 hissa tay kiya, aur ek scooter ne 1/8. Kaun zyada door gaya, cycle ya scooter?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,8],"from":0,"to":1}}

**child:** scooter  _(misconception)_

**Asha** [repair · beat s2:check:c2 · board up · ready 2091 ms]: Nahi, yeh jawab nahi hai. Is sawaal ka sahi jawab: cycle zyada door gayi, kyunki raasta ek hi hai; 1/6 ke liye woh 6 hisson mein bata, 8 se kam, toh 1/6 lamba. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,8],"from":0,"to":1,"marks":[[1,6],[1,8]]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 · board up · ready 2099 ms]: Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > card: Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** yes  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c6-maths-ch07-t01-s2:c3 (1 miss) · board up · ready 2086 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Dono pattiyan ek jaisi hain; dekho kaunsi patti zyada hisson mein bati hai. Kya 1/8 sach mein 1/5 se bada hai?
  > card: Zoya ne likha ki 1/8, 1/5 se bada hai, kyunki 8 bada number hai. Kya uski baat sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** no hai na  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 2187 ms]: Haan, sahi hai: 1/8 ke liye poora 8 hisson mein bata, 5 se zyada, toh 1/8 chhota hai, bada nahi. Ab ek se zyada cheezein barabar baantenge, jaise kuch roti kuch bachchon mein, aur har ek ka hissa bhinn mein likhenge. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch07-t01-s3:ask:e1 · board up · ready 4008 ms · guard mustsay,answerinq]: 3 roti 4 bachchon mein barabar baantni hain. Har roti ke 4 barabar hisse karo, aur har bachche ko har roti se ek hissa do, yaani 1/4. Teen roti se teen hisse milte hain: 3/4 roti. Ab bachche wahi 4 hain, par roti sirf 2. Har bachche ko kitni roti milegi?
  > card: Ab bachche wahi 4 hain, par roti sirf 2. Har bachche ko kitni roti milegi?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":""},{"parts":4,"shade":1,"label":""},{"parts":4,"shade":1,"label":""}]}}

**child:** 2/4 roti  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c6-maths-ch07-t01-s3:ask:e2 · board up · ready 2677 ms · guard mustsay,answerinq,noconfirm]: Bilkul sahi, kyunki har roti se ek 1/4, aur roti do. 3 roti aur 4 bachche: roti kam hain, toh har ek ko 3/4, jo 1 se kam hai. 5 laddoo aur 2 bachche: laddoo zyada hain, toh har ek ko 5/2, jo 1 se zyada hai. Dono mein baanti jaane wali cheezein upar, baantne wale neeche. Ab 6 chikki 5 bachchon mein barabar baanti. Har bachche ko kitni chikki milegi?
  > card: Ab 6 chikki 5 bachchon mein barabar baanti. Har bachche ko kitni chikki milegi?
  > screen: board compare@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** 6/5 chikki  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c6-maths-ch07-t01-s3:ask:e3 · board up · ready 1387 ms · guard mustsay,noconfirm]: Haan, bilkul theek. Dekho, baanti jaane wali chikki upar, bachche neeche. Yeh line 1 metre ki ribbon hai, 0 se 1 tak, yaani 100 cm. Ise 2 barabar hisson mein kaato toh har hissa 1/2 metre hai, aur 100 ÷ 2 = 50 cm. Ab wahi 1 metre ki ribbon 5 barabar hisson mein kaato. Aise 2 hisse milakar kitne cm honge?
  > card: Ab wahi 1 metre ki ribbon 5 barabar hisson mein kaato. Aise 2 hisse milakar kitne cm honge?
  > screen: board fraction-line@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Chikki","items":["6 chikki"]},"right":{"title":"Bachche","items":["5 bachche"]}}}

**child:** chaalis cm  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 1539 ms · guard invented,noconfirm]: Sahi jawab, kyunki metre ka ek hissa 100 ÷ 5 = 20 cm, toh 2 hisse 20 + 20 = 40 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. 5 laddoo 3 bachchon mein barabar baantne hain. Har bachche ko kitna laddoo milega? Har laddoo ke kitne barabar hisse karoge?
  > screen: board compare@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,5],"from":0,"to":1,"marks":[[1,2],[2,5]]}}

**child:** mujhe lagta hai 3 hisse  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c6-maths-ch07-t01-s3:ask:worked · board up · ready 4060 ms · guard answerinq,long]: Haan, 3 hisse, kyunki bachche 3 hain. Har laddoo se har bachche ko ek hissa do: har laddoo se har bachche ko 1/3, kyunki teeno ko har laddoo se barabar milna chahiye. Tumhari baari: 5 laddoo se ek bachche ko kul kitna laddoo mila, bhinn mein?
  > card: Tumhari baari: 5 laddoo se ek bachche ko kul kitna laddoo mila, bhinn mein?
  > screen: board equal-groups@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Laddoo","items":["5 laddoo"]},"right":{"title":"Bachche","items":["3 bachche"]}}}

**child:** 5/3 laddoo  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c6-maths-ch07-t01-s3:c1 · board up · ready 4686 ms · guard answerinq,noconfirm]: Haan, sahi hai. Dekho, laddoo bachchon se zyada the, isliye hissa 1 se zyada aaya. Toh poora jawab: har bachche ko 5/3 laddoo milta hai, yaani 1 poora aur 2/3. Ab agla sawaal tumhare liye. Kuch roti 5 doston mein barabar baanti gayi, aur har dost ko 3/5 roti mili. Kul kitni roti thi?
  > card: Kuch roti 5 doston mein barabar baanti gayi, aur har dost ko 3/5 roti mili. Kul kitni roti thi?
  > screen: board fraction-parts@1 {} · ref {"template":"equal-groups@1","params":{"groups":5,"each":3,"title":"5/3 laddoo"}}

**child:** three  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c6-maths-ch07-t01-s3:c2 · board up · ready 1187 ms]: Bilkul sahi: har roti se har dost ko 1/5 mila; 3/5 matlab 3 hisse, toh 3 roti thi. 5 metre ribbon 4 banners mein barabar baanti. Har banner ko 1 metre se kam ribbon milegi ya zyada?
  > card: 5 metre ribbon 4 banners mein barabar baanti. Har banner ko 1 metre se kam ribbon milegi ya zyada?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

**child:** 1 metre se zyada  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c6-maths-ch07-t01-s3:c3 · board up · ready 3514 ms]: Haan, bilkul theek, kyunki ribbon ke metre banners se zyada hain, toh har banner ko 5/4 metre, jo 1 metre se zyada hai. 3 roti 8 bachchon mein barabar baanti gayi. Kabir ne likha ki har bachche ko 8/3 roti mili. Sahi hissa kya hai?
  > card: 3 roti 8 bachchon mein barabar baanti gayi. Kabir ne likha ki har bachche ko 8/3 roti mili. Sahi hissa kya hai?
  > screen: board fraction-parts@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Ribbon","items":["5 metre"]},"right":{"title":"Banners","items":["4 banners"]}}}

**child:** 3/8 roti  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 2 ms]: Sahi jawab. Dekho, har roti se 1/8, aur 3 roti upar, 8 bachche neeche: 3/8. Aaj ki saari baatein jodne wala ek aakhri sawaal aa raha hai. Do ek jaisi roti 3 bachchon mein barabar baanti gayi, aur waisi hi 2 roti 5 bachchon mein. Kis group ke har bachche ko zyada roti mili: 3 bachchon wale ya 5 wale?
  > screen: board compare@1 {} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":3,"whole":"roti"}}

**child:** 3 bachchon wala group  _(correct)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1873 ms]: Haan, sahi hai: dono groups mein har bachche ko har roti se ek hissa mila, yaani 2 hisse. 3 bachchon mein har hissa 1/3 hai aur 5 mein 1/5, aur 1/3 bada hai, toh 2/3 roti 2/5 se zyada hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":5,"shade":2,"label":"2/5"}]}}

**child:** maine ek ek karke gina  _(no_evidence)_

**Asha** [wrap · ready 1833 ms]: Achha, tumne dil se bataya. Pehle dekha ki fractional unit poore ka ek barabar hissa hai, aur uski lambai poore par tikti hai. Phir dekha ki ek hi poora jitne zyada barabar hisson mein bate, har hissa utna chhota. Aakhir mein kai cheezein barabar baanti: cheezein upar, baantne wale neeche, jaise 3 roti 4 bachchon mein 3/4. Aaj ka paath kaisa laga?

**child:** sawaal achhe the  _(no_evidence)_

**Asha** [wrap · ready 1527 ms]: Theek hai, main yeh yaad rakhungi. Aaj ke bhinn wale paath mein tumne ek dost ki ulti likhi bhinn theek ki. Aaj ke liye itna hi, phir milte hain.

## Agent


