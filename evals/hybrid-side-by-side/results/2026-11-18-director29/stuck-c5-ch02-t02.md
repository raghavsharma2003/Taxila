# stuck-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1978 ms]: Aaj hum do fraction mein se bada kaunsa hai, yeh pehchaanna seekhenge. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3757 ms · guard mustsay,long,twoq]: Yahi sabse seedha tareeka hai jo mere paas hai, koi baat nahi. Kitchen mein do ek jaisi barfi ki patti kaati: ek ke 4 barabar hisse, doosri ke 8. Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3578 ms · guard long,twoq]: Pehli patti ke rangin hisse ke theek neeche dekho, aur doosri patti ke jo hisse us jagah mein aate hain, unhe gino. Doosri patti ka ek hissa, pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3449 ms · guard level]: Haan, ise doosre shabdon mein samjhaati hoon. Ek roti 4 bachche barabar baantein, toh har bachche ko roti ka 1/4 milta hai. Is patti ka rang wala hissa bhi waisa hi hai: chaar barabar mein se ek. Doosri patti ka ek hissa, pehli patti ke ek hisse se bada hai ya chhota?
  > card: Doosri patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa pehli patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** smaller  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1346 ms]: Bilkul sahi, kyunki dono patti barabar lambi hain, par doosri 8 hisson mein kati hai aur pehli sirf 4 mein. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1203 ms]: Do 1/8 hisson ka sira dekho, aur dekho pehli patti mein usi jagah tak kaunsa hissa khatam hota hai. Doosri patti ke pehle do 1/8 hisse milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** upar ka ek hissa  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1974 ms]: Haan, bilkul theek. Dekho, do 1/8 hisse milkar ek 1/4 hissa banate hain. Patti mein dekha tha ki 1/8 chhota hai. Number line par chhota fraction zero ke zyada paas rukta hai, kyunki line par zero se jitna door, utna bada. Is line par, 0 se 1 tak, upar 3 barabar gap hain aur neeche 7. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 1/3 hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3819 ms · guard quiz]: Sahi jawab, kyunki 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Ab agla sawaal kadam-kadam, milkar hal karte hain. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2113 ms]: Yahan dono chocolate ki jagah 0 se 1 ki number line hai: line ke upar 8 barabar gap, line ke neeche 2. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 1939 ms]: Hisse ka size dekho: kam hisson mein kati chocolate ka hissa bada, kyunki chocolate ek jaisi hai, toh kam hisse matlab bade hisse. Neeche wale number dekho: Rahul ki chocolate 8 hisson mein, Sana ki 2 mein, kyunki neeche wala number hisse ginta hai. Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1050 ms]: Bilkul sahi. Dekho, 8 bada number hai, par 8 hisson wali chocolate ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 3293 ms · guard praise,long,twoq]: Dono roti ek jaisi hain. Board par dono roti ka ek-ek hissa dekho, aur socho kis hisse mein roti zyada hai. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1544 ms · guard long,uncorrected]: 1/10 sahi nahi hai. Isko doosri tarah se samajhte hain. Do ek jaisi roti: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 walon ka hissa chhota. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2274 ms]: Haan, pehle tum try karo.
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 11 wali dor  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 1300 ms]: Haan, bilkul theek, kyunki 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** 1/10  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 1316 ms]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 1/5 hai, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c2 · board up · ready 2199 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2160 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Chalo, jahan the wahin se aage chalte hain. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 2513 ms · guard flat,uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Teeno patti ek jitni lambi hain; har patti ka ek hissa dekho aur socho kaunsa sabse chhota hai, kaunsa sabse bada. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis order mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 1248 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Iska jawab 1/12, 1/6, 1/3 hai, kyunki poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:check:c2 · board up · ready 3404 ms · guard affirms]: Ek hi poora 3, 6 aur 12 logon mein baanto: log jitne zyada, har ek ka hissa utna chhota. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 3440 ms · guard long]: Main ise aur aasaan nahi bol paa rahi, koi baat nahi. Theek hai, is par hum phir saath mein aayenge; ab agli baat. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** past it  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 (1 miss) · board up · ready 3106 ms · guard samecard,uncorrected]: Nahi, yeh jawab nahi hai. Pehle us mark ka naam socho: 0 se 1 tak ke 3 gap mein se pehla gap. Phir socho ki 1/5 ka gap usse chhota hai ya bada. 0 se 1 tak 3 barabar gap wali line par 1/5, pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** past it  _(misconception)_

**Asha** [repair · beat s1:check:c3 · board up · ready 3868 ms · guard flat,uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka sahi jawab: mark se pehle, kyunki mark 1/3 hai, aur 1/3 ka gap 1/5 ke gap se bada hai, isliye 1/5 pehle aata hai. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2636 ms · guard long]: Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":2,"whole":"bar"}}

**child:** 4/7  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 1245 ms · guard mustsay]: Bilkul sahi. Dekho, pehli patti 2/7 thi; hisse wahi 7 hain aur rang ab 4 mein hai, toh 4/7. Ab yahi baat ek number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Zero se 4/7 tak pahunchne ke liye 4 gap chalna padta hai. Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** yes  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 3711 ms · guard long]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti, 5 barabar hisson mein: ek se 2 hisse, doosri se 4. Har hissa ek size ka; 4 hisse zyada roti. Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne ek se 3 liye, Gopi ne doosre se 6. Neha ka kam ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne ek se 3 liye, Gopi ne doosre se 6. Neha ka kam ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** they have the same  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal (1 miss) · board up · ready 2318 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Dono ribbon ke sab hisse ek size ke hain, toh bas dono ke hisse gino. Neha ne ek ribbon ka 3/7 liya aur Gopi ne utne hi lambe ribbon ka 6/7, toh Neha ka ribbon kam hai ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne ek se 3 liye, Gopi ne doosre se 6. Neha ka kam ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** Gopi se kam hai na  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) · board up · ready 2097 ms]: Haan, bilkul theek, kyunki har hissa 1/7 hai, aur Neha ke 3 hisse Gopi ke 6 hisson se kam hain. Achha, ab pehle wale sawaal ko phir se dekhte hain. Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":6,"label":"6/7"}]}}

**child:** yes  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (2 miss) · board up · ready 3338 ms · guard leak,samecard,uncorrected]: Abhi yeh sahi nahi hai. Line par 0 se 2 gap chalo, phir 0 se 4 gap chalo, aur dekho dono baar kahan ruke. Kya 2/7 aur 4/7 barabar hain, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** galat  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 1516 ms · guard mustsay]: Bilkul sahi. Dekho, 4/7 zero se 4 gap door, 2/7 sirf 2. Yeh line 0 se 1 tak 5 barabar gap mein kati hai. Zero se jitna door, utna bada. Neeche wala number same ho, toh upar wala batata hai kitne gap paar karne hain. Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** they are equal  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 (1 miss) · board up · ready 3317 ms · guard leak,screenmismatch,uncorrected]: Yeh jawab sahi nahi hai. Dono ke gap ek hi size ke hain. Ab bas yeh gino ki kaun kitne gap chala. Mona zero se 3/5 tak gayi aur Sonu 1/5 tak, toh kaun aage pahuncha?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** they are equal  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 (2 miss) · board up · ready 2830 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Socho, ek cheenti zero se chalti hai aur har baar ek gap, yaani 1/5, aage badhti hai; fraction ka upar wala number ginta hai ki usne kitne gap paar kiye. Ab phir se socho, jawab kya hoga?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** Mona aage pahunchi  _(correct)_

**Asha** [explain · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 2608 ms · guard mustsay]: Haan, bilkul theek, kyunki dono ke gap 1/5 ke hain, aur Mona teen gap chali, Sonu sirf ek. Do barabar patti: ek 3 hisson mein kati, doosri 10 mein. Neeche wale number alag, toh hisse alag size ke: 10 wali ke chhote, 3 wali ke bade. Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"},{"num":3,"label":"3/5"}]}}

**child:** 3/10  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-tops-only · board up · ready 1745 ms · guard long,uncorrected]: 3/10 sahi nahi hai. Ek aur raasta aazmaate hain. Do patti, 3 aur 9 barabar hisson mein. 3 wali ka ek hissa 9 wali ke teen jitna; 9 wali ke 2 usse chhote. Do ek jaisi patti: ek ke 2 barabar hisson mein se 1 rangeen, doosri ke 6 mein se 2. Kis patti mein rang zyada hai?
  > card: Do ek jaisi patti: ek ke 2 barabar hisson mein se 1 rangeen, doosri ke 6 mein se 2. Kis patti mein rang zyada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** 2/6  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-tops-only (1 miss) · board up · ready 2675 ms · guard leak,samecard]: 2/6 nahi, yeh jawab theek nahi baitha. Pehle socho ki 6 wali patti ke kitne hisse milkar 2 wali patti ka ek hissa banate hain. 1/2 aur 2/6 rang wali do ek jaisi patti mein se kis patti mein rang zyada hai?
  > card: Do ek jaisi patti: ek ke 2 barabar hisson mein se 1 rangeen, doosri ke 6 mein se 2. Kis patti mein rang zyada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 2/6  _(misconception)_

**Asha** [repair · beat s2:check:then:c5-maths-ch02-t02-m-tops-only · board up · ready 1292 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 1/2 hai, kyunki 1/2 theek aadhi patti hai, jabki 2/6 aadhi patti tak nahi pahunchta. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:check:then:c5-maths-ch02-t02-m-tops-only · board up · ready 3845 ms · guard ratefrac]: 2 wali patti ka ek hissa 6 wali ke teen hisson jitna hai, aur 6 wali patti mein rang sirf do hisson mein hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 (1 miss) · board up · ready 5225 ms]: Chalo, pehle wale sawaal ki taraf wapas aate hain. Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 2/3 hai na  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2556 ms]: Bilkul sahi, kyunki 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe, yaani 5/10, tak bhi nahi pahunchta. Aao, yeh sawaal main aur tum saath mein karenge. Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Hisse ek size ke; faisla kaun karega, upar wala number ya neeche wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1045 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milenge!

## Agent


