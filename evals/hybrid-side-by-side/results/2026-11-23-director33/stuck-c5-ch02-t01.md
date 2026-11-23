# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2185 ms]: Aaj hum fractions ko ek seedhi line par jagah denge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3456 ms · guard mustsay,twoq]: Chalo, main batati hoon. Cricket pitch: ek stump 0 par, doosra 1 par. Batsman theek beech mein ruka; us jagah ka bhi number hai. Yeh rahi 0 se 1 tak ki line. Theek beech mein ek mark hai, toh line ke 2 barabar gaps ban gaye. Is mark ka naam hai 1/2. Line ki doosri taraf 3 barabar gaps hain. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > card: Line ki doosri taraf 3 barabar gaps hain. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3013 ms · guard leak]: Beech wale mark ka naam line ke 2 barabar gaps se aaya tha. Ab doosri taraf ke gaps gino, aur pehle mark ka naam usi tarah rakho. 0 se 1 ki line 3 barabar gaps mein kati ho, toh 0 ke baad pehla mark kaunsa fraction hai?
  > card: Line ki doosri taraf 3 barabar gaps hain. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3122 ms · guard ask]: Haan, Hindi mein hi kehti hoon. Doosri taraf 3 gap bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > card: Doosri taraf 3 gap bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** 1/3 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2740 ms · guard mustsay,answerinq]: Haan, sahi hai, kyunki 3 barabar gaps, pehla mark ek gap par: 1/3. Ab 0 aur 1 ke beech 6 marks hain. Neeche wala number gaps se aata hai: 7 barabar gaps. Toh 0 ke baad pehla mark 1/7 hai. Ab socho, doosri taraf 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Us taraf kitne gaps banenge?
  > card: Ab socho, doosri taraf 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Us taraf kitne gaps banenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 3626 ms · guard answerinq,long]: Doosri taraf ke gaps ek-ek karke socho: marks ke beech wale bhi, aur 0 ke baad wala aur 1 se pehle wala bhi. 0 aur 1 ke beech 7 marks line ko barabar gaps mein baant-te hon, toh kitne gaps banenge?
  > card: Ab socho, doosri taraf 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Us taraf kitne gaps banenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":1,"label":"1/7"}]}}

**child:** aath gaps  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 1204 ms · guard mustsay,long]: Bilkul sahi. Suno, marks se gaps ek zyada: 7 marks, 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Gap zyada, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se ek gap door. Line ki doosri taraf wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ki doosri taraf wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** one tenth  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1545 ms]: Haan, bilkul theek: 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas. Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1926 ms · guard screenmismatch]: Is patti ko raasta samjho: baayan kinaara ghar, daayan kinaara school, aur beech ka kinaara beech wala khamba. Baaki do khambe board par nahi hain, unhe tumhe sochna hai. Ghar se school tak 1 kilometre ke raaste par 3 khambe barabar doori par hain; woh raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2547 ms · guard flat]: Ghar se chalna shuru karo aur har gap par ek gino: khambon ke beech wale bhi, aur dono siron wale bhi. Ab tum batao.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3583 ms · guard quiz]: 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 1791 ms]: 3 khambe raaste ko 4 barabar gaps mein kaatte hain: ghar se pehle khambe tak ek gap, aur aakhri khambe se school tak bhi ek. Doori gaps se naapte hain, khambon se nahi: khamba bas ek jagah hai, aur ghar se pehle khambe tak ka chalna ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 2248 ms · guard long,uncorrected]: 1/3 km sahi nahi hai. Ek aur dhang se samajhte hain. Darzi ka ribbon 0 se 1 metre tak hai, aur us par 4 chalk ke marks hain. Marks 4 hain, par gap 5 bante hain, isliye pehla mark 1/5 metre par hai. Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1957 ms]: Haan, pehle tum try karo.
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** gyaarah  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (1 miss) · board up · ready 812 ms]: Haan, sahi hai, kyunki 12 barabar gaps ke beech 11 marks hote hain, gaps se ek kam. Theek hai, ab wapas usi sawaal par chalte hain. 1 kilometre ka raasta 4 barabar gaps mein hai; pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,12],"from":0,"to":1,"marks":[[1,5],[1,12]]}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (2 miss) · board up · ready 2853 ms · guard answerinq,uncorrected]: Nahi, 1/3 km theek nahi. Poora raasta 1 kilometre ka hai, aur woh 4 barabar gaps mein kata hai. Ek gap 1 kilometre ka kaunsa fraction hai, bas yahi socho. Ab phir se socho, jawab kya hoga?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4 km  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 1386 ms]: Bilkul sahi. Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. Ab agla sawaal tumhare liye. Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 1238 ms · guard uncorrected]: 1/10 sahi nahi hai. Neeche wala number gaps se aata hai. 0 aur 1 ke beech ke 10 marks se jitne gaps bane, wahi neeche wala number hai. Toh ab batao, kya aayega?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (2 miss) · board up · ready 1270 ms · guard uncorrected]: 1/10 se baat nahi bani. 1/10 tab hota jab 0 se 1 ki line 10 barabar gaps mein hoti; par yahan 10 marks hain, aur 0 ke baad aur 1 se pehle bhi ek-ek gap hai. Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** 1/10  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 1152 ms]: Nahi, yeh theek nahi hai. Is sawaal ka jawab 1/11 hai, kyunki 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c2 · board up · ready 2321 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 4948 ms · guard twoq]: Achha, toh tumhe batting sabse achha lagta hai. Ab apni padhai par lautte hain. Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > card: Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** 1/4  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1847 ms · guard long,uncorrected]: 1/4 sahi nahi hai. Ise ek baar aise sochte hain. Ek taraf 2 barabar gap hain, doosri taraf 5. Gap jitne zyada, har gap utna chhota: 1/5 ka gap 1/2 wale se chhota. Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > card: Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1}}

**child:** after 1/5  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias (1 miss) · board up · ready 2960 ms · guard leak]: Nahi, yeh jawab nahi hai. 7 gaps wali taraf 0 se pehla gap dekho, aur dekho woh 1/5 wale mark se pehle khatam hota hai ya aage. Ab phir se socho, jawab kya hoga?
  > card: Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** after 1/5  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias (2 miss) · board up · ready 2203 ms · guard uncorrected]: Nahi, yeh theek nahi hai. 1/7 ko 1/5 ke aage isliye rakha kyunki 7, 5 se bada number hai; par 7 gap bhi wahi 0 se 1 bharte hain, toh socho, 7 mein se ek gap 5 mein se ek gap se lamba hoga ya chhota. Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > card: Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** 1/5 se pehle  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 (1 miss) · board up · ready 1186 ms]: Haan, sahi hai. Suno, 7 gaps wala har gap 5 gaps wale se chhota hai, isliye 1/7, 0 aur 1/5 ke beech rukta hai. Chalo, ab pichhle sawaal par wapas chalte hain. Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > card: Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5],[1,7]]}}

**child:** 1/12  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 4616 ms · guard leak,long]: Bilkul sahi: 12 barabar gaps ka har gap 4 wale se chhota hai, isliye 1/12 wala pehla mark 0 ke sabse paas hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1,"marks":[[1,4],[1,12]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 1714 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Sadak 0 se 1 kilometre, 7 barabar gaps mein kati hai. Ek khilona pehle mark par ruka: woh ek pakki jagah hai, uska number 1/7 kilometre. Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > card: Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 1 and 6  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 3423 ms · guard answerinq,uncorrected]: Nahi, yeh jawab nahi hai. Doosri taraf bhi wahi sadak hai, bas 6 barabar gaps mein. Ek gap poore kilometre ka kaunsa fraction hai, yahi socho. 1 kilometre ki sadak 6 barabar gaps mein kati ho, toh pehle mark par ruka khilona 0 se kitne kilometre par hai?
  > card: Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1/6 kilometre hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (1 miss) · board up · ready 2465 ms]: Haan, bilkul theek, kyunki doosri taraf sadak 6 barabar gaps mein hai, aur pehla mark 0 se ek gap par, yaani 1/6 kilometre. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (2 miss) · board up · ready 2973 ms · guard leak,uncorrected]: Nahi, yeh theek nahi hai. Socho, 1/9 kitne gaps ka naam hai, aur phir board par 0 se utne gaps gino. Ab phir se socho, jawab kya hoga?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 0 ke just baad wala mark  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2229 ms]: Haan, sahi hai. 1/9 matlab 9 barabar gaps mein se 1 gap, toh 1/9 ki jagah 0 se ek gap par, pehle mark par hai. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1002 ms]: Aaj ke liye itna hi, phir milenge.

## Agent


