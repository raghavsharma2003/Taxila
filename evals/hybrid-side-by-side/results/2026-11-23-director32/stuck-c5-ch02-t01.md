# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2751 ms · guard leak]: Aaj hum fractions ko ek seedhi line par jagah denge. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2016 ms · guard mustsay]: Chalo, main batati hoon. Cricket pitch: ek stump 0 par, doosra 1 par. Batsman theek beech mein ruka; us jagah ka bhi number hai. Yeh rahi 0 se 1 tak ki line. Theek beech mein ek mark hai, toh line ke 2 barabar gaps ban gaye. Is mark ka naam hai 1/2. Line ki doosri taraf 3 barabar gaps hain. Wahan pehla mark kaunsa fraction hai?
  > card: Line ki doosri taraf 3 barabar gaps hain. Wahan pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 1814 ms]: Beech wale mark ka naam line ke 2 barabar gaps se aaya tha. Ab doosri taraf ke gaps gino, aur pehle mark ka naam usi tarah rakho. 0 se 1 ki line 3 barabar gaps mein kati ho, toh 0 ke baad pehla mark kaunsa fraction hai?
  > card: Line ki doosri taraf 3 barabar gaps hain. Wahan pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 1874 ms]: Haan, Hindi mein hi kehti hoon. Ek roti ko theek beech se kaato toh do barabar hisse milte hain. Line par bhi beech wala mark 0 se 1 ko aise hi do barabar gaps mein baant-ta hai, isliye woh 1/2 hai. 0 se 1 ki line 3 barabar gaps mein kati ho, toh 0 ke baad pehla mark kaunsa fraction hai?
  > card: Line ki doosri taraf 3 barabar gaps hain. Wahan pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** 1/3 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2293 ms · guard mustsay,answerinq]: Haan, sahi hai, kyunki 3 barabar gaps, pehla mark ek gap par: 1/3. Wahi 0 se 1 ki line, par ab us par 6 marks hain. Marks mat gino, gaps gino: 7 barabar gaps. Toh 0 ke baad pehla mark hai 1/7. Ab line ki doosri taraf dekho: wahan 7 marks hain, sab ek-doosre se barabar door. Us taraf kitne barabar gaps bane hain?
  > card: Ab line ki doosri taraf dekho: wahan 7 marks hain, sab ek-doosre se barabar door. Us taraf kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 1092 ms]: Doosri taraf ke gaps ek-ek karke gino: marks ke beech wale bhi, aur 0 ke baad wala aur 1 se pehle wala bhi. Ab phir se socho, jawab kya hoga?
  > card: Ab line ki doosri taraf dekho: wahan 7 marks hain, sab ek-doosre se barabar door. Us taraf kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]}}

**child:** aath gaps  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 1805 ms · guard leak,long,noconfirm]: Bilkul sahi. Dekho, marks se gaps ek zyada: 7 marks, 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Gap zyada, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se ek gap door. Line ki doosri taraf wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ki doosri taraf wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** one tenth  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 800 ms]: Haan, bilkul theek: 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas. Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1603 ms · guard screenmismatch]: Is patti ko raasta samjho: baayan kinaara ghar, daayan kinaara school, aur beech ke teen marks teen khambe. Ghar se school tak 1 kilometre ke raaste par 3 khambe barabar doori par hain; woh raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1850 ms · guard affirms]: Ghar se chalna shuru karo aur har gap par ek gino: khambon ke beech wale bhi, aur dono siron wale bhi. 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1779 ms]: Ghar se school tak 1 kilometre ke raaste par 3 khambe barabar doori par hain; woh raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 1427 ms]: 3 khambe raaste ko 4 barabar gaps mein kaatte hain: ghar se pehle khambe tak ek gap, aur aakhri khambe se school tak bhi ek. Doori gaps se naapte hain, khambon se nahi: khamba bas ek jagah hai, aur ghar se pehle khambe tak ka chalna ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2118 ms · guard answerinq]: Poora raasta 1 kilometre ka hai, aur woh 4 barabar gaps mein kata hai. Ek gap 1 kilometre ka kaunsa fraction hai, bas yahi socho. 1 kilometre ka raasta 4 barabar gaps mein hai; pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 1887 ms]: Haan, pehle tum try karo.
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1791 ms · guard long,uncorrected]: 1/3 km sahi nahi hai. Ek aur dhang se samajhte hain. Darzi ka ribbon 0 se 1 metre tak hai, aur us par 4 chalk ke marks hain. Marks 4 hain, par gap 5 bante hain, isliye pehla mark 1/5 metre par hai. Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (1 miss) · board up · ready 968 ms · guard uncorrected]: Nahi, 12 theek nahi. Ribbon par gaps aur chalk ke marks dono gino, aur dekho kaun kitna zyada hai. Phir wahi baat naye ribbon ke liye socho. Socho, ek ribbon 12 barabar gaps mein kaatna hai: beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** eleven  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (1 miss) · board up · ready 814 ms]: Haan, sahi hai, kyunki 12 barabar gaps ke beech 11 marks hote hain, gaps se ek kam. Theek hai, ab wapas usi sawaal par chalte hain. 1 kilometre ka raasta 4 barabar gaps mein hai; pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,12],"from":0,"to":1,"marks":[[1,5],[1,12]]}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (2 miss) · board up · ready 1604 ms · guard uncorrected]: 1/3 km se baat nahi bani. Board ki line ko raasta samjho: 0 par ghar, 1 par school, aur beech ke marks khambe. Hum pehle gaps ginenge, phir dekhenge ki pehla khamba kitne gaps par hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (3 miss) · board up · ready 2310 ms · guard samecard,uncorrected]: 1/3 km sahi nahi hai. Pehle chhota socho: beech mein sirf 1 khamba hota, toh woh theek aadhe raaste par, 1/2 kilometre par hota. Ab 3 khambe hain, toh pehle yeh dekho ki woh raaste ko kitne barabar gaps mein baant-te hain. 1 kilometre ka raasta 4 barabar gaps mein hai; pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1606 ms]: Nahi, yeh theek nahi hai. Iska jawab hai pehla khamba ghar se 1/4 kilometre door hai, kyunki 4 barabar gaps mein har gap 1/4 kilometre ka hai, aur pehla khamba 0 se theek ek gap par khada hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c1 · board up · ready 1950 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 1806 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab apni padhai par lautte hain. 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 946 ms · guard uncorrected]: 1/10 se baat nahi bani. Marks chhodo, gaps gino. 0 se 1 ki line par 10 marks se jitne gaps bane, wahi neeche wala number hai. Ab phir se socho, jawab kya hoga?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** 1/10  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 1976 ms · guard screen,uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 1/11 hai, kyunki 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 2539 ms]: Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > card: Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1}}

**child:** 1/12  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 2724 ms · guard long]: Haan, sahi hai. Dekho, 12 barabar gaps ka har gap 4 wale se chhota hai, isliye 1/12 wala pehla mark 0 ke sabse paas hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1,"marks":[[1,4],[1,12]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2143 ms · guard long,uncorrected]: Nahi, yeh theek nahi hai. Ise ek baar aise sochte hain. Sadak 0 se 1 kilometre, 7 barabar gaps mein kati hai. Ek khilona pehle mark par ruka: woh ek pakki jagah hai, uska number 1/7 kilometre. Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > card: Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 1 and 6  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 1516 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Socho, ruler par 0 ke baad pehli lakeer ek pakki jagah hai, aur uska ek number hai. Sadak par khilona bhi ek pakki jagah ruka, isliye us jagah ka number 1/7 kilometre hai. 1 kilometre ki sadak 6 barabar gaps mein kati ho, toh pehle mark par ruka khilona 0 se kitne kilometre par hai?
  > card: Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1/6 kilometre hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (1 miss) · board up · ready 4046 ms · guard leak,long]: Bilkul sahi: doosri taraf sadak 6 barabar gaps mein hai, aur pehla mark 0 se ek gap par, yaani 1/6 kilometre. Chalo, ab pichhle sawaal par wapas chalte hain. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (2 miss) · board up · ready 2794 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Socho, 1/9 kitne gaps ka naam hai, aur phir board par 0 se utne gaps gino. Ab phir se socho, jawab kya hoga?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 0 ke baad wala pehla mark  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1868 ms]: Haan, sahi hai, kyunki 1/9 matlab 9 barabar gaps mein se 1 gap, toh 1/9 ki jagah 0 se ek gap par, pehle mark par hai. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 · board up · ready 2350 ms · guard mustsay]: Theek hai, main shuru karti hoon. Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye. 2/3 ek hi jagah hai, ek hi number. Line ki doosri taraf 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > card: Line ki doosri taraf 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** 5/8 hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 · board up · ready 3271 ms · guard mustsay,leak]: Haan, bilkul theek. Dekho, 1/8 ke 5 gap, yaani 5/8. Line 3 barabar gaps mein kati hai. 0 se teen gap chalo toh theek 1 aata hai, isliye wahan 3/3 = 1. Teeno gap milkar 0 se 1 tak ki poori line bhar dete hain. Ab socho, line 1/5 wale gaps mein kati hai. 0 se theek 1 tak aise kitne gap chalne honge?
  > card: Ab socho, line 1/5 wale gaps mein kati hai. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,8],"from":0,"to":1,"marks":[[2,3],[5,8]]}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (1 miss) · board up · ready 1976 ms · guard leak,uncorrected]: 4 sahi nahi hai. 1/3 wale teen gap milkar 0 se 1 bharte the. Ab socho, 1/5 jitne chhote gap poore 1 ko bharne ke liye kitne lagenge. Har gap 1/5 ka ho, toh 0 se theek 1 tak kitne gap chalne honge?
  > card: Ab socho, line 1/5 wale gaps mein kati hai. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"hop":{"num":3}}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (2 miss) · board up · ready 1126 ms]: Nahi, yeh theek nahi hai. Pizza ke 3 barabar hisse hon aur teeno le lo, toh poora pizza aa gaya: 3/3 ek poora hai. Line par bhi 3 mein se 3 gap chalkar hum poore 1 par hote hain. Ab socho, line 1/5 wale gaps mein kati hai. 0 se theek 1 tak aise kitne gap chalne honge?
  > card: Ab socho, line 1/5 wale gaps mein kati hai. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"hop":{"num":3}}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (3 miss) · board up · ready 2374 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. 3 barabar gaps wali line par teeno gap chalo toh 1 aata hai. Ek bhi gap baaki nahi bachta, isliye chalna theek 1 par rukta hai. Har gap 1/5 ka ho, toh 0 se theek 1 tak kitne gap chalne honge?
  > card: Ab socho, line 1/5 wale gaps mein kati hai. 0 se theek 1 tak aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"hop":{"num":3}}}

**child:** paanch gap  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 · board up · ready 891 ms · guard mustsay]: Haan, sahi hai: 1/5 ke 5 gap milkar 5/5 banate hain, aur 5/5 = 1. Ab line ke 6 barabar gaps hain. Theek beech ka mark 3/6 hai, aur 3, 6 ka aadha hai, toh 3/6 = 1/2. 2/6 beech se pehle aata hai, 5/6 beech ke baad. Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > card: Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,5],"from":0,"to":1,"marks":[[3,3],[5,5]]}}

**child:** after the middle  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2700 ms · guard leak]: Bilkul sahi, kyunki beech 3/6 par hai, aur upar wala number 4 usse ek zyada hai, toh ek gap aage, beech ke baad. Chalo, ab ek sawaal saath mein line par karte hain. Ek number line 0 se 1 tak hai. Is par 2/5 ka mark dhoondhna hai. 2/5 ke liye is line ka har gap kitne ka hoga?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":3,"label":"3/6"},{"num":4,"label":"4/6"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1140 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


