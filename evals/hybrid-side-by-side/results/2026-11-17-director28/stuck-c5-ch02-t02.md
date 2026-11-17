# stuck-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1895 ms]: Aaj hum do fraction mein se bada kaunsa hai, yeh pehchaanna seekhenge. Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai. Ab tak samajh aaya?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 969 ms]: Koi baat nahi, ise doosre shabdon mein samjhaati hoon. Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. Is patti mein kitne barabar hisse hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2022 ms]: Is patti mein 4 barabar hisse hain. Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2085 ms]: Achha, isko aur aasaan karke bolti hoon. Pehli patti ke rangin hisse ke theek neeche dekho, aur doosri patti ke jo hisse us jagah mein aate hain, unhe gino. Doosri patti ka ek hissa, pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** smaller  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1899 ms]: Bilkul sahi, kyunki dono patti barabar lambi hain, par doosri 8 hisson mein kati hai aur pehli sirf 4 mein. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Is patti ka ek hissa kaunsa fraction hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1094 ms]: Is patti ka ek hissa 1/8 hai. Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** upar ka ek hissa  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2035 ms · guard mustsay,noconfirm]: Haan, bilkul theek. Dekho, 8 hisson wali patti ke do 1/8 hisse milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Patti mein dekha tha ki 1/8 chhota hai. Number line par chhota fraction zero ke zyada paas rukta hai, kyunki line par zero se jitna door, utna bada. Is line par, 0 se 1 tak, upar 3 barabar gap hain aur neeche 7. Line ke neeche kitne barabar gap hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 6  _(incorrect)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 934 ms]: Line ke neeche 7 barabar gap hain. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 3545 ms · guard samecard]: Yahan wahi line do patti ban gayi hai: pehli patti teen barabar hisson mein, doosri saat mein, aur dono 0 se 1 tak barabar lambi. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 906 ms · guard uncorrected]: 1/7 sahi nahi hai. Isko thoda doosri tarah se samajhte hain. Socho, do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 walon ko chhota hissa milta hai. Barabar hisse jitne zyada, har hissa utna chhota. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1946 ms]: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2339 ms]: Dono dor ek jitni lambi hain; socho ki kis dor par zyada baar kainchi chali. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 1/9  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2880 ms · guard praise,uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 1/11 hai, kyunki 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2154 ms]: Doosri dor par kainchi zyada baar chali, isliye uska pehla hissa pehli dor ke pehle hisse se pehle hi khatam ho jaata hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 4078 ms]: Is tarah ka sawaal dobara milega, abhi pehle wale sawaal par wapas chalo. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 1992 ms]: Haan, pehle tum try karo.
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1085 ms]: Bilkul sahi, kyunki 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Ek sawaal kadam-kadam, milkar hal karein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 2639 ms]: 0 se 1 tak ki line sirf 3 gap mein bati ho toh har gap bada hota hai, 7 gap mein bati ho toh har gap chhota, aur pehla mark ek gap ke baad hi aata hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 1888 ms]: Dono taraf ka pehla gap dekho, aur socho jis taraf gap kam hain, wahan har gap kitna lamba hoga. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1906 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 2727 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2108 ms · guard invented]: Ab agla sawaal kadam-kadam, milkar hal karte hain. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Saath mein dono hisse milate hain. Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek hissa, kyunki upar wala number mile hue hisse ginta hai. Kiski chocolate zyada hisson mein kati, Rahul ki ya Sana ki?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2047 ms]: Ab dekho, kiski chocolate kitne hisson mein kati: Rahul ki chocolate 8 hisson mein, Sana ki sirf 2 mein, kyunki neeche wala number yahi batata hai. Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** Sana hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2098 ms]: Bilkul sahi. Dekho, 8 bada number hai, par 8 hisson wali chocolate ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** 1/5  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1293 ms]: Haan, bilkul theek: 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 2459 ms · guard flat,uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Teeno patti ek jitni lambi hain; har patti ka ek hissa dekho aur socho kaunsa sabse chhota hai, kaunsa sabse bada. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis order mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1211 ms]: Sahi jawab, kyunki poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** 1/5 pehle aayega  _(correct)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1559 ms · guard mustsay]: Haan, sahi hai. Dekho, mark 1/3 hai, aur 1/5 ka gap chhota. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Patti ke kitne hisson mein rang hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2876 ms]: Do hisson mein rang hai, 2. Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":2,"whole":"bar"}}

**child:** 7/4  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 2398 ms · guard flat,uncorrected]: 7/4 nahi, yeh jawab theek nahi baitha. Patti ke hisse wahi 7 rehte hain; badalti sirf rang wale hisson ki ginti hai. 7 barabar hisson wali patti ke 4 hisson mein rang bharein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** chaar bata saat  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2134 ms · guard mustsay]: Bilkul sahi, kyunki pehli patti 2/7 thi; hisse wahi 7 hain aur rang ab 4 mein hai, toh 4/7. Ab yahi baat ek number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Zero se 4/7 tak pahunchne ke liye 4 gap chalna padta hai. Zero se 4/7 tak kitne gap chalne padte hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** chaar gap  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2165 ms · guard affirms]: Haan, bilkul theek. Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":4,"whole":"bar"}}

**child:** yes  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2455 ms]: Nahi, yeh jawab nahi hai. Ise ek alag tareeke se dekhte hain. Maan lo do ek jaisi roti, dono 5 barabar hisson mein. Agar ek se 2 hisse lo aur doosri se 4, toh dono fraction ka neeche wala number 5 hai, phir bhi 4 hisse zyada roti hain, kyunki har hissa ek size ka hai. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 3975 ms · guard leak]: Ek-ek rupaye ke sikke socho: 2 sikke aur 5 sikke, sikke ek jaise hain, phir bhi 5 sikkon mein zyada paise hain. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"shade":2,"title":"Roti"},{"parts":5,"shade":4,"title":"Roti"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 4487 ms]: Do ek jaise ribbon, dono 7 barabar hisson mein. Zoya ne ek se 3 liye, Gopi ne doosre se 6. Zoya ka kam ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Zoya ne ek se 3 liye, Gopi ne doosre se 6. Zoya ka kam ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** less  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) · board up · ready 1256 ms]: Bilkul sahi, kyunki har hissa 1/7 hai, aur Zoya ke 3 hisse Gopi ke 6 hisson se kam hain. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":6,"label":"6/7"}]}}

**child:** yes  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (2 miss) · board up · ready 3972 ms · guard praise,uncorrected]: Yeh jawab sahi nahi hai. Line par 0 se 2 gap chalo, phir 0 se 4 gap chalo, aur dekho dono baar kahan ruke. Kya 2/7 aur 4/7 barabar hain, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** nahi  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 1052 ms · guard mustsay]: Haan, bilkul theek. Dekho, 4/7 zero se 4 gap door, 2/7 sirf 2. Yeh number line 0 se 1 tak 5 barabar gap mein bati hai. Line par zero se jitna door, utna bada. Neeche wala number same ho, toh faisla upar wala number karta hai, kyunki woh batata hai kitne gap paar karne hain. Is line ka har gap kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1822 ms]: Aaj ke liye itna hi, phir milenge!

## Agent


