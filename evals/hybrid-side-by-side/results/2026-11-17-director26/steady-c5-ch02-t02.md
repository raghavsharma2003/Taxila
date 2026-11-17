# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1860 ms · guard twoq]: Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai. Ab tak samajh aaya?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 5053 ms · guard leak]: Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2030 ms]: Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota?
  > card: Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2896 ms · guard long,twoq]: Upar wali patti ke rangin hisse ke theek neeche dekho, aur neeche wali patti ke jo hisse us jagah mein aate hain, unhe gino. Neeche wali patti ka ek hissa, upar wali patti ke ek hisse se bada hai ya chhota?
  > card: Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** small  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 858 ms]: Sahi jawab, kyunki dono patti barabar lambi hain, par neeche wali 8 hisson mein kati hai aur upar wali sirf 4 mein. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1781 ms]: Neeche wali patti ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche wali patti ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 4/1  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 (1 miss) · board up · ready 970 ms · guard uncorrected]: 4/1 sahi nahi hai. Do 1/8 hisson ka sira dekho, aur dekho upar wali patti mein usi jagah tak kaunsa hissa khatam hota hai. Neeche wali patti ke pehle do 1/8 hisse milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche wali patti ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 1/4 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1798 ms · guard mustsay,screenmismatch]: Haan, sahi hai: 8 hisson wali patti ke do 1/8 hisse milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. 0 se 1 tak ki number line lo: line ke upar 3 barabar gap hain, neeche 7. Niyam: zero se jitna door, utna bada. 1/4 aur 1/8 ko bhi aisi line par rakhein, toh 1/8 zero ke zyada paas rukega, yaani 1/8 chhota hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1833 ms]: Yahan wahi line do patti ban gayi hai: upar wali patti teen barabar hisson mein, neeche wali saat mein, aur dono 0 se 1 tak barabar lambi. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3 wala  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1196 ms]: Sahi jawab, kyunki 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Rahul aur Sana ke paas ek-ek chocolate hai, dono bilkul ek jaisi. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Bada hissa kiske paas hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2757 ms · guard invented]: Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek hissa, kyunki upar wala number batata hai kitne hisse mile, aur ek-ek mile, toh ab baat sirf size ki hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2307 ms]: 1/8 ko padho 'aath mein se ek', aur 1/2 ko 'do mein se ek'. Dono mein 'ek' hai, toh dono ke paas ek hi hissa hai. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2154 ms]: Ab doosra kadam. Upar wali patti Rahul ki chocolate hai, neeche wali Sana ki. Ab dekho, kiski chocolate kitne hisson mein kati: Rahul ki chocolate 8 hisson mein, Sana ki sirf 2 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek hissa kitna bada hai. Yeh kadam saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2169 ms]: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2805 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana ka  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1581 ms · guard screenmismatch]: Sahi jawab. Toh poora jawab: Sana ko mila, 1/2 wala hissa, kyunki 8 bada number hai, par 8 hisson wali chocolate ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1814 ms]: Cricket ki baat bhi karenge, bilkul. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 4230 ms · guard affirms]: Achha, isko aur aasaan karke bolti hoon. Dono roti ek jaisi hain. Board par dono roti ka ek-ek hissa dekho, aur socho kis hisse mein roti zyada hai. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1948 ms · guard uncorrected]: 1/10 sahi nahi hai. Ise ek alag tareeke se dekhte hain. Socho, do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 walon ko chhota hissa milta hai. Barabar hisse jitne zyada, har hissa utna chhota. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [repair · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · ready 2487 ms]: Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2113 ms]: Oh, chauka. Achha. Ab padhai ki taraf mudte hain. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** ek bata gyarah  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 1968 ms]: Sahi jawab, kyunki 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** the piece from the roti cut into 5  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2009 ms]: Haan, sahi hai: 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 2134 ms · guard flat,uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Teeno patti ek jitni lambi hain; har patti ka ek hissa dekho aur socho kaunsa sabse chhota hai, kaunsa sabse bada. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis order mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/12, 1/6, 1/3 hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 5000 ms · guard long]: Bilkul sahi, kyunki poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** 1/5 pehle aayega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1094 ms]: Haan, bilkul theek: mark 1/3 hai, aur 1/3 ka gap 1/5 ke gap se bada hai, isliye 1/5 pehle aata hai. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2133 ms]: 3 dost ek roti baantein ya 5 dost, toh 3 walon ka hissa bada hota hai; yeh mark 1/3 par hai, yaani 3 walon ke hisse par. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3446 ms · guard long]: Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2037 ms]: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** chaar bata saat  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1806 ms]: Sahi jawab, kyunki pehli patti 2/7 thi; hisse wahi 7 hain aur rang ab 4 mein hai, toh 4/7. Ab yahi baat ek number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Zero se 4/7 tak pahunchne ke liye 4 gap chalna padta hai. Yeh hissa saaf hua?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 1988 ms]: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** nahi  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 887 ms]: Haan, sahi hai: neeche wala number dono ka 7 hai, par 4/7 zero se 4 gap door hai aur 2/7 sirf 2, isliye barabar nahi. Yeh number line 0 se 1 tak 5 barabar gap mein bati hai. Line par zero se jitna door, utna bada. Neeche wala number same ho, toh faisla upar wala number karta hai, kyunki woh batata hai kitne gap paar karne hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 1664 ms]: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** Mona aage pahunchi  _(correct)_

**Asha** [explain · beat s2:explain:e4 · board up · ready 2150 ms · guard mustsay]: Bilkul sahi. Dekho, dono ke gap 1/5 ke hain, aur Mona teen gap chali, Sonu sirf ek. Do barabar patti dekho: ek 3 hisson mein kati hai, doosri 10 mein. Neeche wale number alag hain, toh hisse alag size ke hain: 10 wali ke chhote, 3 wali ke bade. Hisse ek size ke tabhi hote hain jab neeche wala number same ho. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"},{"num":3,"label":"3/5"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 2177 ms]: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** 2/3  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 1447 ms]: Sahi jawab, kyunki 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe, yaani 5/10, tak bhi nahi pahunchta. Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Kam cake kisne khaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 3645 ms · guard leak]: Pehle dono ka neeche wala number dekho: dono mein 8, toh har hissa 1/8, kyunki dono poore ek jaise hain aur dono 8 barabar hisson mein bate hain. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 2004 ms]: Ab dono ke upar wale number milao: Meena ne 1/8 wale 5 khaye, Raju ne 3, kyunki upar wala number gin kar batata hai kitne hisse khaye gaye. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked · board up · ready 2365 ms]: Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** they ate the same  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2510 ms]: Abhi yeh sahi nahi hai. Ek aur raasta aazmaate hain. Maan lo do ek jaisi roti, dono 5 barabar hisson mein. Agar ek se 2 hisse lo aur doosri se 4, toh dono fraction ka neeche wala number 5 hai, phir bhi 4 hisse zyada roti hain, kyunki har hissa ek size ka hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 10199 ms]: Ek-ek rupaye ke sikke socho: 2 sikke aur 5 sikke, sikke ek jaise hain, phir bhi 5 sikkon mein zyada paise hain. Do ek jaise ribbon, dono 7 barabar hisson mein. Zoya ne ek se 3 liye, Gopi ne doosre se 6. Zoya ka kam ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Zoya ne ek se 3 liye, Gopi ne doosre se 6. Zoya ka kam ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"title":"Pinky"},{"parts":6,"title":"Bhai"}]}}

**child:** less  _(correct)_

**Asha** [practice · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked (1 miss) · board up · ready 1105 ms]: Sahi jawab. Dekho, har hissa 1/7 hai, aur Zoya ke 3 hisse Gopi ke 6 hisson se kam hain. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":6,"label":"6/7"}]}}

**child:** they ate the same  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked (2 miss) · board up · ready 2097 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Dono ke hisse ek hi size ke hain, toh bas dono ki ginti milao. Meena ne cake ka 5/8 khaya aur Raju ne 3/8, toh kam cake kisne khaya?
  > card: Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** Raju ke  _(correct)_

**Asha** [repair · beat s2:worked:worked · board up · ready 1336 ms]: Haan, sahi hai: hisse ek size ke hain aur Raju ke kam hain, isliye line par bhi 3/8 pehle aata hai, 5/8 baad mein. Toh poora jawab: Raju ne, sirf 3/8. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 · board up · ready 2374 ms]: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"title":"Pinky"},{"parts":6,"title":"Bhai"}]}}

**child:** 3 hisse  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 · board up · ready 1523 ms]: Bilkul sahi, kyunki dono ke hisse 1/6 ke hain, toh 4/6 mein se 1/6 hatao, 3 hisse bachte hain. Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** Zoya  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-tops-only · board up · ready 4240 ms · guard long]: Abhi yeh sahi nahi hai. Isko thoda doosri tarah se samajhte hain. Socho, ek jaisi do patti: ek 3 barabar hisson mein, ek 9 mein. Jab 3 wali ka ek hissa 9 wali ke teen hisson jitna ho, toh 9 wali ke 2 hisse usse chhote hi rahenge. Hisse tabhi gino jab sab ek size ke hon. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"title":"Cake"},{"parts":10,"title":"Cake"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-tops-only · board up · ready 2197 ms]: Do ek jaisi patti: ek ke 2 barabar hisson mein se 1 rangeen, doosri ke 6 mein se 2. Kis patti mein rang zyada hai?
  > card: Do ek jaisi patti: ek ke 2 barabar hisson mein se 1 rangeen, doosri ke 6 mein se 2. Kis patti mein rang zyada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/2  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 (1 miss) · board up · ready 1667 ms]: Sahi jawab, kyunki 1/2 theek aadhi patti hai, jabki 2/6 aadhi patti tak nahi pahunchta. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** Ben hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 · board up · ready 3027 ms]: Haan, sahi hai. Dekho, Zoya ka 5/10 bas aadha cake hai, jabki Ben ka 3/5 aadhe se aage hai. Do ek jaisi chocolate hain, ek 4 barabar hisson mein kati, doosri 6 mein. Dono se ek-ek hissa khaya gaya, toh pehli ke 4 mein se 3 bache aur doosri ke 6 mein se 5. Kiska khaya hua hissa bada tha, 4 hisson wali ka ya 6 wali ka?
  > card: Do ek jaisi chocolate hain, ek 4 barabar hisson mein kati, doosri 6 mein. Dono se ek-ek hissa khaya gaya, toh pehli ke 4 mein se 3 bache aur doosri ke 6 mein se 5. Kiska khaya hua hissa bada tha, 4 hisson wali ka ya 6 wali ka?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"shade":3,"title":"3/5"},{"parts":10,"shade":5,"title":"5/10"}]}}

**child:** they are equal  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-gap-thinking · board up · ready 2196 ms]: Nahi, yeh theek nahi hai. Ise ek alag tareeke se dekhte hain. Agar ek patti ke 2 barabar hisse hon aur utni hi lambi doosri ke 7, aur dono se ek-ek hissa hata do, toh pehli ki kami aadhi patti hai, doosri ki bas 7 mein se ek hissa. Chhoti kami, poore ke zyada paas. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-gap-thinking · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-gap-thinking · board up · ready 2452 ms]: Do ek jaisi patti: ek ke 8 barabar hisson mein se 7 rangeen, doosri ke 10 mein se 9. Kaunsi poori rangne ke kareeb hai?
  > card: Do ek jaisi patti: ek ke 8 barabar hisson mein se 7 rangeen, doosri ke 10 mein se 9. Kaunsi poori rangne ke kareeb hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** 9/10 ka  _(correct)_

**Asha** [repair · beat s2:check:then:c5-maths-ch02-t02-m-gap-thinking · board up · ready 1211 ms]: Bilkul sahi, kyunki 9/10 mein bas 1/10 ki kami hai, 7/8 mein 1/8 ki, aur 1/10 ki kami chhoti hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":7,"label":"7/8"},{"parts":10,"shade":9,"label":"9/10"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 (1 miss) · board up · ready 2524 ms]: Chalo, pehle wale sawaal ki taraf wapas aate hain. Do ek jaisi chocolate hain, ek 4 barabar hisson mein kati, doosri 6 mein. Dono se ek-ek hissa khaya gaya, toh pehli ke 4 mein se 3 bache aur doosri ke 6 mein se 5. Kiska khaya hua hissa bada tha, 4 hisson wali ka ya 6 wali ka?
  > card: Do ek jaisi chocolate hain, ek 4 barabar hisson mein kati, doosri 6 mein. Dono se ek-ek hissa khaya gaya, toh pehli ke 4 mein se 3 bache aur doosri ke 6 mein se 5. Kiska khaya hua hissa bada tha, 4 hisson wali ka ya 6 wali ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 4 hisson wali  _(correct)_

**Asha** [explain · beat s3:explain:e1 · board up · ready 1656 ms · guard mustsay]: Sahi jawab. Dekho, 4 hisson wali mein 3 bache toh 1/4 khaya gaya, 6 wali mein 5 bache toh 1/6, aur 1/4 bada hai. Ab hisson ki ginti ke saath unka size bhi dekhna hoga. Yeh patti 5 barabar hisson mein hai, toh har hissa 1/5. Teen hisson mein rang hai: 3/5. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 · board up · ready 3772 ms]: Neeche isi size ki patti 8 barabar hisson mein kati hai, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > card: Neeche isi size ki patti 8 barabar hisson mein kati hai, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"?"}]}}

**child:** 3/8  _(correct)_

**Asha** [explain · beat s3:explain:e2 · board up · ready 2735 ms · guard mustsay,leak,screenmismatch]: Haan, sahi hai: patti 8 hisson mein kati aur 3 mein rang hai, toh 3/8; 5 hisson wali patti 3/5 thi. Dono ko ek number line par dekho, 0 se 1 tak: line ke upar 5 barabar gap, har ek 1/5; line ke neeche 8, har ek 1/8. 3/8 matlab 1/8 wale teen gap. Ginti dono mein 3 hi hai, par gap ka size alag hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"3/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 · board up · ready 2126 ms]: Isi line par, kya 3/5 ka mark 3/8 ke mark se aage hai, haan ya nahi?
  > card: Isi line par, kya 3/5 ka mark 3/8 ke mark se aage hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1}}

**child:** no  _(misconception)_

**Asha** [hint · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 (1 miss) · board up · ready 3151 ms · guard praise,twoq]: Abhi yeh sahi nahi hai. Dono taraf 0 se teen-teen gap chalo, aur dekho kaun aage ruka. Kya 3/5, 3/8 se zyada hai, haan ya nahi?
  > card: Isi line par, kya 3/5 ka mark 3/8 ke mark se aage hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1}}

**child:** no  _(misconception)_

**Asha** [hint · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 (2 miss) · board up · ready 1962 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Socho, ek deewar teen badi eenton ki hai aur doosri teen chhoti eenton ki: eenton ki ginti barabar hai, par badi eenton wali deewar oonchi banti hai. Kya 3/5, 3/8 se zyada hai, haan ya nahi?
  > card: Isi line par, kya 3/5 ka mark 3/8 ke mark se aage hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1}}

**child:** haan  _(correct)_

**Asha** [explain · beat s3:explain:e3 · board up · ready 2550 ms · guard mustsay,leak]: Sahi jawab, kyunki ginti dono mein 3 hai, par 1/5 ke gap 1/8 wale gap se bade hain, isliye 3/5 ka mark aage hai. Jab hisson ki ginti barabar ho, toh hisse ka size faisla karta hai. Jo patti kam hisson mein kati, uske hisse bade hote hain, isliye ginti barabar ho toh bade hisson wala fraction zyada hota hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1,"marks":[[3,5],[3,8]]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s3:explain:e3 · check script:c5-maths-ch02-t02-s3:ask:e3 · board up · ready 2449 ms]: Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > card: Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":5,"shade":0,"label":""}]}}

**child:** 2/9  _(misconception)_

**Asha** [hint · beat s3:explain:e3 · check script:c5-maths-ch02-t02-s3:ask:e3 (1 miss) · board up · ready 2676 ms · guard twoq,uncorrected]: 2/9 nahi, yeh jawab theek nahi baitha. Dono patti mein do-do hisse hain. Ab dekho kis patti ka ek hissa bada hai. Kaunsa zyada hai, 2/9 ya 2/5?
  > card: Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":5,"shade":0,"label":""}]}}

**child:** 2/5 wala  _(correct)_

**Asha** [explain · beat s3:explain:e4 · board up · ready 2809 ms · guard mustsay,leak,screenmismatch]: Haan, sahi hai: dono mein 2 hisse hain, aur 1/5 ka hissa 1/9 wale se bada, isliye 2/5 zyada. Is line par 0 se 1 tak, line ke upar 4 barabar gap hain aur neeche 8. Upar pehla mark 1/4 hai, aur neeche theek usi jagah 2/8 aata hai. Isi tarah upar ke har mark ko neeche ke gaps mein gin sakte ho. Yeh hissa saaf hua?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":2,"label":"2/9"},{"parts":5,"shade":2,"label":"2/5"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s3:explain:e4 · check script:c5-maths-ch02-t02-s3:ask:e4 · board up · ready 2168 ms]: Isi line par zero se chalo, toh pehle kaun aayega, 2/4 ya 5/8?
  > card: Isi line par zero se chalo, toh pehle kaun aayega, 2/4 ya 5/8?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1}}

**child:** 2/4  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:problem · board up · ready 2143 ms]: Sahi jawab, kyunki 2/4 ko 1/8 ke gap mein badlo toh 4/8 banta hai, aur 5/8 usse ek gap aage hai. Isha ne apni chocolate ka 2/3 khaya; Farhan ki chocolate bhi utni hi badi thi, aur usne uska 2/7 khaya. Zyada kisne khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[2,4],[5,8]]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s3:worked:worked:problem · board up · ready 2127 ms]: Do ek jaisi chocolate hain: Farhan ki 7 barabar hisson mein todi gayi, Isha ki 3 mein. Dono ne apni chocolate ke 2 hisse khaye, aur dekhna hai ki kisne zyada khaya. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,3],"from":0,"to":1,"marks":[[2,7],[2,3]]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 2779 ms]: Pehle dono ke upar wale number dekho: dono mein 2, yaani dono ne do-do hisse khaye, kyunki ginti barabar hai, isliye ab sirf hisse ka size dekhna baaki hai. Yeh kadam saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step2 · board up · ready 3765 ms · guard affirms]: Phir har hisse ka size likho: Farhan ka har hissa 1/7, Isha ka 1/3, kyunki Farhan ki chocolate 7 hisson mein kati hai, Isha ki usi size ki chocolate sirf 3 mein. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t02-s3:ask:worked · board up · ready 2384 ms]: Toh zyada kisne khaya, Farhan ne ya Isha ne?
  > card: Toh zyada kisne khaya, Farhan ne ya Isha ne?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** Isha  _(correct)_

**Asha** [repair · beat s3:worked:worked · board up · ready 1416 ms]: Sahi jawab. Dekho, dono ne 2 hisse khaye, par Isha ke 1/3 wale hisse Farhan ke 1/7 wale hisson se bade the. Toh poora jawab: Isha ne, 2/3. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":3,"shade":2,"label":"2/3"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t02-s3:c1 · board up · ready 2858 ms]: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > card: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":9,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** they are all equal  _(misconception)_

**Asha** [hint · beat s3:check:c1 · check script:c5-maths-ch02-t02-s3:c1 (1 miss) · board up · ready 1902 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Ginti teeno mein barabar hai. Ab teeno patti ke ek-ek hisse ka size milao. In teeno ko chhote se bade tak order mein lagao.
  > card: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":9,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** they are all equal  _(misconception)_

**Asha** [repair · beat s3:check:c1 · board up · ready 2470 ms]: Nahi, yeh theek nahi hai. Is sawaal ka jawab 4/9, 4/7 aur 4/5 hai, kyunki teeno mein 4 hisse, par 1/9 ka hissa sabse chhota aur 1/5 ka sabse bada; isliye 4/9, phir 4/7, phir 4/5. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":4,"label":"4/9"},{"parts":7,"shade":4,"label":"4/7"},{"parts":5,"shade":4,"label":"4/5"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t02-s3:c2 · board up · ready 2336 ms]: Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, aur Imran apna ribbon 6 mein kaatkar 5 leta hai. Dono apne liye hue hisse jodkar ek ribbon banate hain. Kiska ribbon lamba banega, Anjali ka ya Imran ka?
  > card: Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, aur Imran apna ribbon 6 mein kaatkar 5 leta hai. Dono apne liye hue hisse jodkar ek ribbon banate hain. Kiska ribbon lamba banega, Anjali ka ya Imran ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** Imran hai na  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t02-s3:c3 · board up · ready 1714 ms]: Sahi jawab. Dekho, dono ke paanch-paanch hisse, par Imran ka har hissa Anjali ke hisse ka do guna hai. Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Dono mein poore pizza se bas ek-ek hissa kam hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > card: Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Dono mein poore pizza se bas ek-ek hissa kam hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":5,"label":"5/12"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** eight ninths  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 2 ms]: Haan, sahi hai, kyunki 8/9 mein bas 1/9 ki kami hai, 6/7 mein 1/7 ki, aur 1/9 ki kami chhoti hai. Ab poore paath ko yaad karke bas ek sawaal aur karna hai. Do ek jaisi patti hain: ek ke 10 barabar hisson mein se 7 liye, doosri ke 12 mein se 7. Kaunsa chhota hai, 7/10 ya 7/12?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,9],"from":0,"to":1,"marks":[[6,7],[8,9]]}}

**child:** 12/7  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 950 ms]: 12/7 sahi nahi hai. Iska jawab hai 7/12, kyunki dono se 7 hisse liye, par 12 hisson wali patti ka har hissa chhota hai, isliye 7/12 chhota hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":7,"label":"7/10"},{"parts":12,"shade":7,"label":"7/12"}]}}

**child:** mujhe laga aisa hi hoga  _(no_evidence)_

**Asha** [wrap · ready 1290 ms]: Aaj ki baat yeh thi ki ek hi poore ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai. Phir yeh dekha ki neeche wala number same ho toh hisse ek size ke hote hain, aur upar wala number, yaani hisson ki ginti, faisla karta hai. Aakhir mein yeh dekha ki upar wala number same ho, toh jis fraction ka neeche wala number chhota hai, uske hisse bade hote hain aur wahi zyada hota hai. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [wrap · ready 1341 ms]: Chalo, yeh baat bhi dhyaan mein rakhi. Aaj ke paath mein tumne dekha ki 6/7 aur 8/9 mein kiski kami chhoti hai. Aaj ke liye itna hi, phir milenge!

## Agent


