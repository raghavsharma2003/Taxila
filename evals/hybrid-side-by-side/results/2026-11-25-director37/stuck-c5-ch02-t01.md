# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2417 ms · guard leak,twoq]: Aaj hum fractions ko ek seedhi line par jagah denge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2443 ms · guard mustsay]: Chalo, main batati hoon. Cricket pitch ka ek sira 0, doosra 1: batsman run lete hue beech mein ruk gaya. Beech ka mark 0 se ek gap par hai, aur 0 se 1 tak 2 barabar gaps hain: isliye 1/2. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2308 ms]: Ek roti ko theek beech se kaato toh do barabar hisse milte hain. Line par bhi beech wala mark 0 se 1 ko aise hi do barabar gaps mein baant-ta hai, isliye woh 1/2 hai. Ab line 3 barabar gaps mein bhi kati hai. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > card: Ab line 3 barabar gaps mein bhi kati hai. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 1838 ms · guard twoq]: Beech wale mark ka naam line ke 2 barabar gaps se aaya tha. Ab 3 gaps wale marks dekho, aur pehle mark ka naam usi tarah rakho. 0 se 1 ki line 3 barabar gaps mein kati ho, toh 0 ke baad pehla mark kaunsa fraction hai?
  > card: Ab line 3 barabar gaps mein bhi kati hai. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2456 ms · guard ask]: Haan, Hindi mein hi kehti hoon. Ab 3 gap bhi bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > card: Ab 3 gap bhi bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 882 ms]: 0 se beech wale mark tak ek gap, aur wahan se 1 tak ek aur: dono gap ek jitne lambe. Do mein se pehla gap, isliye 1/2. 0 se 1 ki line 3 barabar gaps mein kati ho, toh 0 ke baad pehla mark kaunsa fraction hai?
  > card: Ab line 3 barabar gaps mein bhi kati hai. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** 1 upon 3  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2181 ms · guard mustsay,answerinq]: Haan, sahi hai, kyunki 3 gaps mein se ek gap tak: 1/3. Ab 0 aur 1 ke beech 6 marks hain. Neeche wala number gaps se aata hai: 7 barabar gaps. Toh 0 ke baad pehla mark 1/7 hai. Ab socho, ek aur line par 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Wahan kitne gaps banenge?
  > card: Ab socho, ek aur line par 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Wahan kitne gaps banenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** 8 gap  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 1022 ms · guard mustsay]: Bilkul sahi. Marks se gaps ek zyada: 7 marks, 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Gap zyada, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se ek gap door. Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2243 ms · guard leak,screenmismatch]: Dhyan pehle gap par rakho: upar wali patti aath barabar gaps mein hai aur uska pehla gap rangin hai, neeche wali patti utni hi lambi, das barabar gaps mein. Dono pattiyon ka baayan kinaara line ka 0 hai. 0 ke zyada paas kaun: 1/8 ya 1/10?
  > card: Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** 1/8  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1299 ms · guard long,uncorrected]: 1/8 sahi nahi hai. Ek aur dhang se samajhte hain. Yahan 2 barabar gap bhi hain, aur 5 bhi. Gap jitne zyada, har gap utna chhota: 1/5 ka gap 1/2 wale se chhota. Pehla mark 1/5 hai, aur line 7 barabar gaps mein bhi kati hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > card: Pehla mark 1/5 hai, aur line 7 barabar gaps mein bhi kati hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** between 0 and 1/5 hai na  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (1 miss) · board up · ready 1634 ms]: Haan, bilkul theek, kyunki 1/7 ka gap 1/5 ke gap se chhota hai, toh 1/7 wala mark 0 aur 1/5 ke beech aata hai. Theek hai, ab wapas usi sawaal par chalte hain. Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5],[1,7]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (1 miss) · board up · ready 1610 ms]: 1/8 wala pehla gap aur 1/10 wala pehla gap ungli se naapo, aur dekho kaunsa chhota hai. 0 ke zyada paas kaun: 1/8 ya 1/10?
  > card: Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** 1/8  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (2 miss) · board up · ready 745 ms · guard uncorrected]: Nahi, 1/8 theek nahi. 8 ko 10 se chhota number dekhkar chuna hai; par yahan dekhna hai ki kiska ek gap chhota hai, aur 0 se 1 ko jitne zyada gaps mein kaato, har gap utna chhota. Ab tum batao.
  > card: Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (2 miss) · board up · ready 1673 ms]: Haan, pehle tum try karo.
  > card: Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** 1 by 10  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 923 ms]: Haan, sahi hai. Jitne zyada gaps, utna chhota har gap: 10 gaps ke saath pehla mark 1/10, 0 ke zyada paas aata hai. Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Board par abhi sirf beech wala khamba hai. 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** 6  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 1443 ms]: Yeh jawab nahi hai. 3 khambe raaste ko 4 barabar gaps mein kaatte hain: ghar se pehle khambe tak ek gap, aur aakhri khambe se school tak bhi ek. Doori gaps se naapte hain, khambon se nahi: khamba bas ek jagah hai, aur ghar se pehle khambe tak ka chalna ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1716 ms · guard uncorrected]: 1/3 km sahi nahi hai. Ise ek baar aise sochte hain. Darzi ka ribbon 0 se 1 metre tak hai, aur us par 4 chalk ke marks hain. Marks 4 hain, par gap 5 bante hain, isliye pehla mark 1/5 metre par hai. Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (1 miss) · board up · ready 980 ms · guard uncorrected]: Nahi, 12 theek nahi. Tumne gaps gine, par sawaal chalk ke marks ka hai. Marks gaps ke beech ke kinaare hain; ribbon ke dono sire khud 0 aur 1 hain. Socho, ek ribbon 12 barabar gaps mein kaatna hai: beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (2 miss) · board up · ready 1072 ms · guard uncorrected]: 12 se baat nahi bani. Ribbon par gaps aur chalk ke marks dono gino, aur dekho kaun kitna zyada hai. Phir wahi baat naye ribbon ke liye socho. Chalo, ab tumhari baari.
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (3 miss) · board up · ready 833 ms · guard uncorrected]: 12 sahi nahi hai. Do deewaron ke beech kapde sukhane ki rassi par 4 clip socho: pehli deewar se pehle clip tak ek jagah, clipon ke beech 3, aur aakhri clip se deewar tak ek, kul 5. Chalk ke 4 marks bhi aise hi 5 gap banate hain. Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (4 miss) · board up · ready 1149 ms]: Nahi, yeh theek nahi hai. Ribbon par ungli 0 se 1 tak sarkao aur har gap par ek gino. Ginti chalk ke marks se ek zyada aati hai. Socho, ek ribbon 12 barabar gaps mein kaatna hai: beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** 12  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · board up · ready 930 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. 12 barabar gaps ke beech 11 marks hote hain, gaps se ek kam. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,12],"from":0,"to":1,"marks":[[1,5],[1,12]]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:worked:worked · board up · ready 1591 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,12],"from":0,"to":1,"marks":[[1,5],[1,12]]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (1 miss) · board up · ready 1610 ms]: Wah, batting! Toh tumhara favourite yahi hai. Chalo, ab pichhle sawaal par wapas chalte hain. Ghar se pehle khambe tak kitne kilometre hain?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,12],"from":0,"to":1,"marks":[[1,5],[1,12]]}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (2 miss) · board up · ready 1728 ms · guard uncorrected]: 1/3 km sahi nahi hai. 1/3 tab hota jab raasta 3 gaps mein kata hota; tumne khambe gine hain, par doori gaps se naapte hain, aur aakhri khambe se school tak bhi ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** ek chauthai km  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 1661 ms]: Haan, sahi hai: 4 barabar gaps mein har gap 1/4 kilometre ka hai, aur pehla khamba 0 se theek ek gap par khada hai. Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. Ab agla sawaal tumhare liye. Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/11  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 726 ms]: Bilkul sahi, kyunki 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Line ek baar 4 barabar gaps mein kati hai, ek baar 12 mein. Inke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > card: Line ek baar 4 barabar gaps mein kati hai, ek baar 12 mein. Inke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** 1/4  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 (1 miss) · board up · ready 790 ms · guard uncorrected]: Nahi, 1/4 theek nahi. 4 chhota number hai, par 4 gaps wali taraf ka har gap lamba hai; board par dono taraf ka pehla gap saath rakhkar dekho, kaunsa pehle khatam hota hai. 4 gaps aur 12 gaps ke marks mein 0 ke sabse paas kaunsa fraction hai?
  > card: Line ek baar 4 barabar gaps mein kati hai, ek baar 12 mein. Inke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1}}

**child:** 1/12  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 2712 ms · guard long]: Haan, bilkul theek. 12 barabar gaps ka har gap 4 wale se chhota hai, isliye 1/12 wala pehla mark 0 ke sabse paas hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1,"marks":[[1,4],[1,12]]}}

**child:** 1/9 pehle mark par hai  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1699 ms]: Sahi jawab, kyunki 1/9 matlab 9 barabar gaps mein se 1 gap, toh 1/9 ki jagah 0 se ek gap par, pehle mark par hai. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** nahi  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2612 ms]: 0 ke baad pehle mark ka naam gaps ginkar banta hai; ab aage ke marks ke naam bhi aise hi gaps ginkar banayenge. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** nahi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 · board up · ready 2469 ms · guard mustsay]: Koi baat nahi, abhi aage chalte hain. Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye. 2/3 ek hi jagah hai, ek hi number. Is baar line 8 barabar gaps mein bhi kati hai. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > card: Is baar line 8 barabar gaps mein bhi kati hai. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** 5/8 hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 · board up · ready 2576 ms · guard mustsay,answerinq,leak]: Haan, sahi hai: 1/8 ke 5 gap, yaani 5/8. Ab 1/3 wale 3 gap chalkar dekho: teesre gap ke ant par hum theek 1 par hain, isliye wahan 3/3 = 1. Teeno gap milkar 0 se 1 tak ki poori line bhar dete hain. Ab socho, ek doosri line 1/5 wale gaps mein kati ho. 0 se theek 1 tak aise kitne gap chalne honge?
  > card: Ab socho, ek doosri line 1/5 wale gaps mein kati ho. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,8],"from":0,"to":1,"marks":[[2,3],[5,8]]}}

**child:** 4  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (1 miss) · board up · ready 1856 ms · guard leak,uncorrected]: 4 sahi nahi hai. 4 gap ke baad bhi tum 1 se pehle ho. Is line par 1 tab aaya jab upar aur neeche ek hi number hua, 3/3; 1/5 wale gaps mein bhi wahi socho. Har gap 1/5 ka ho, toh 0 se theek 1 tak kitne gap chalne honge?
  > card: Ab socho, ek doosri line 1/5 wale gaps mein kati ho. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"hop":{"num":3}}}

**child:** 4  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (2 miss) · board up · ready 1162 ms]: Nahi, 4 theek nahi. 1/3 wale teen gap milkar 0 se 1 bharte the. Ab socho, 1/5 jitne chhote gap poore 1 ko bharne ke liye kitne lagenge. Jo tumhe lagta hai, woh bolo.
  > card: Ab socho, ek doosri line 1/5 wale gaps mein kati ho. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"hop":{"num":3}}}

**child:** 4  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (3 miss) · board up · ready 1104 ms]: Nahi, yeh theek nahi hai. Pizza ke 3 barabar hisse hon aur teeno le lo, toh poora pizza aa gaya: 3/3 ek poora hai. Line par bhi 3 mein se 3 gap chalkar hum poore 1 par hote hain. Ab socho, ek doosri line 1/5 wale gaps mein kati ho. 0 se theek 1 tak aise kitne gap chalne honge?
  > card: Ab socho, ek doosri line 1/5 wale gaps mein kati ho. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"hop":{"num":3}}}

**child:** paanch gap  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 · board up · ready 1432 ms · guard mustsay]: Bilkul sahi, kyunki 1/5 ke 5 gap se 5/5 = 1. Ab line ke 6 barabar gaps hain. Beech ka mark 3/6 = 1/2 hai, kyunki 3, 6 ka aadha hai. 2/6 usse pehle aata hai, 5/6 baad mein. 0 se 1 ki ek nayi line 10 barabar gaps mein kati hai. 4/10 beech se pehle aayega, ya beech ke baad?
  > card: 0 se 1 ki ek nayi line 10 barabar gaps mein kati hai. 4/10 beech se pehle aayega, ya beech ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,5],"from":0,"to":1,"marks":[[3,3],[5,5]]}}

**child:** before the middle  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1720 ms]: Haan, sahi hai. 10 gaps ka beech 5 gap par hai, 5/10; 4/10 usse ek gap pehle hai, toh beech se pehle. Chalo, ab ek sawaal saath mein line par karte hain. Ek number line 0 se 1 tak hai. Is par 2/5 ka mark dhoondhna hai. 2/5 mein kaunsa number line ke barabar gaps ginta hai: 2 ya 5?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":4,"label":"4/10"},{"num":5,"label":"5/10"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1137 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


