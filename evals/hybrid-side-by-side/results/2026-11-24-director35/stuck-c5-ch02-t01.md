# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1992 ms]: Aaj hum fractions ko ek seedhi line par jagah denge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2528 ms · guard mustsay]: Chalo, main batati hoon. Cricket pitch: ek stump 0 par, doosra 1 par. Batsman theek beech mein ruka; us jagah ka bhi number hai. Beech ka mark 0 se ek gap par hai, aur 0 se 1 tak 2 barabar gaps hain: isliye 1/2. Ab line 3 barabar gaps mein bhi kati hai. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > card: Ab line 3 barabar gaps mein bhi kati hai. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2027 ms]: Beech wale mark ka naam line ke 2 barabar gaps se aaya tha. Ab 3 gaps wale marks dekho, aur pehle mark ka naam usi tarah rakho. 0 se 1 ki line 3 barabar gaps mein kati ho, toh 0 ke baad pehla mark kaunsa fraction hai?
  > card: Ab line 3 barabar gaps mein bhi kati hai. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3277 ms · guard ask]: Haan, Hindi mein hi kehti hoon. Ek roti ko theek beech se kaato toh do barabar hisse milte hain. Line par bhi beech wala mark 0 se 1 ko aise hi do barabar gaps mein baant-ta hai, isliye woh 1/2 hai. Ab 3 gap bhi bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > card: Ab 3 gap bhi bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** 1 by 3  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2482 ms · guard mustsay,answerinq]: Haan, sahi hai, kyunki 3 gaps mein se ek gap tak: 1/3. Ab 0 aur 1 ke beech 6 marks hain. Neeche wala number gaps se aata hai: 7 barabar gaps. Toh 0 ke baad pehla mark 1/7 hai. Ab socho, ek aur line par 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Wahan kitne gaps banenge?
  > card: Ab socho, ek aur line par 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Wahan kitne gaps banenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2296 ms · guard answerinq]: Us line ke gaps ek-ek karke socho: marks ke beech wale bhi, aur 0 ke baad wala aur 1 se pehle wala bhi. 0 aur 1 ke beech 7 marks line ko barabar gaps mein baant-te hon, toh kitne gaps banenge?
  > card: Ab socho, ek aur line par 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Wahan kitne gaps banenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":1,"label":"1/7"}]}}

**child:** aath gaps  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 1033 ms · guard mustsay]: Bilkul sahi. Marks se gaps ek zyada: 7 marks, 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Gap zyada, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se ek gap door. Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Ab wahi 0 se 1, 10 barabar gaps mein bhi kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** one tenth  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1076 ms]: Haan, bilkul theek: jitne zyada gaps, utna chhota har gap: 10 gaps ke saath pehla mark 1/10, 0 ke zyada paas aata hai. Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Board par abhi sirf beech wala khamba hai. 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1726 ms]: Is patti ko raasta samjho: baayan kinaara ghar, daayan kinaara school, aur beech ka kinaara beech wala khamba. Baaki do khambe board par nahi hain, unhe tumhe sochna hai. 3 khambe hain: raaste ke kitne barabar gaps bane?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2559 ms · guard flat]: Baaki do khambe bhi socho, phir ghar se chalna shuru karo aur har gap par ek gino: khambon ke beech wale bhi, aur dono siron wale bhi. Ab tum batao.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2485 ms]: Ab phir se socho, jawab kya hoga?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 3175 ms · guard answerinq]: 3 khambe raaste ko 4 barabar gaps mein kaatte hain: ghar se pehle khambe tak ek gap, aur aakhri khambe se school tak bhi ek. Doori gaps se naapte hain, khambon se nahi: khamba bas ek jagah hai, aur ghar se pehle khambe tak ka chalna ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2344 ms]: Poora raasta 1 kilometre ka hai, aur woh 4 barabar gaps mein kata hai. Ek gap 1 kilometre ka kaunsa fraction hai, bas yahi socho. Chalo, ab tumhari baari.
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2064 ms]: Haan, pehle tum try karo.
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 2700 ms · guard long,uncorrected]: 1/3 km sahi nahi hai. Ek aur dhang se samajhte hain. Darzi ka ribbon 0 se 1 metre tak hai, aur us par 4 chalk ke marks hain. Marks 4 hain, par gap 5 bante hain, isliye pehla mark 1/5 metre par hai. Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (1 miss) · board up · ready 976 ms]: Nahi, 12 theek nahi. Tumne gaps gine, par sawaal chalk ke marks ka hai. Marks gaps ke beech ke kinaare hain; ribbon ke dono sire khud 0 aur 1 hain. Socho, ek ribbon 12 barabar gaps mein kaatna hai: beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (2 miss) · board up · ready 1214 ms]: 12 se baat nahi bani. Ribbon par gaps aur chalk ke marks dono gino, aur dekho kaun kitna zyada hai. Phir wahi baat naye ribbon ke liye socho. Jo tumhe lagta hai, woh bolo.
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** eleven  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (1 miss) · board up · ready 1158 ms]: Haan, sahi hai, kyunki 12 barabar gaps ke beech 11 marks hote hain, gaps se ek kam. Theek hai, ab wapas usi sawaal par chalte hain. Ghar se pehle khambe tak kitne kilometre hain?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,12],"from":0,"to":1,"marks":[[1,5],[1,12]]}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (2 miss) · board up · ready 2157 ms · guard uncorrected]: 1/3 km sahi nahi hai. 1/3 tab hota jab raasta 3 gaps mein kata hota; tumne khambe gine hain, par doori gaps se naapte hain, aur aakhri khambe se school tak bhi ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (3 miss) · board up · ready 3783 ms · guard twoq,uncorrected]: Nahi, yeh theek nahi hai. Pehle chhota socho: beech mein sirf 1 khamba hota, toh woh theek aadhe raaste par, 1/2 kilometre par hota. Ab 3 khambe hain, toh pehle yeh dekho ki woh raaste ko kitne barabar gaps mein baant-te hain. Ab tum batao.
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2546 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Iska jawab hai pehla khamba ghar se 1/4 kilometre door hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c1 · board up · ready 1804 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 2062 ms · guard long]: Achha, toh tumhe batting pasand hai! Ab apni padhai par lautte hain. Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 1267 ms · guard uncorrected]: 1/10 sahi nahi hai. 1/10 tab hota jab 0 se 1 ki line 10 barabar gaps mein hoti; par yahan 10 marks hain, aur 0 ke baad aur 1 se pehle bhi ek-ek gap hai. 10 marks wali is line par pehla mark kaunsa fraction hai?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (2 miss) · board up · ready 1299 ms · guard uncorrected]: Nahi, 1/10 theek nahi. Neeche wala number marks nahi, gaps ginta hai. 0 aur 1 ke beech ke 10 marks se jitne gaps bane, wahi neeche wala number hai. Chalo, ab tumhari baari.
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** ek bata gyarah  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 2089 ms]: Haan, sahi hai. 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Line ek baar 4 barabar gaps mein kati hai, ek baar 12 mein. Inke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > card: Line ek baar 4 barabar gaps mein kati hai, ek baar 12 mein. Inke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** 1/12  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 3243 ms · guard leak,long]: Bilkul sahi: 12 barabar gaps ka har gap 4 wale se chhota hai, isliye 1/12 wala pehla mark 0 ke sabse paas hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1,"marks":[[1,4],[1,12]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 3422 ms · guard long,uncorrected]: Nahi, yeh theek nahi hai. Ise ek baar aise sochte hain. Sadak 0 se 1 kilometre, 7 barabar gaps mein kati hai. Ek khilona pehle mark par ruka: woh ek pakki jagah hai, uska number 1/7 kilometre. Ab wahi sadak, 0 se 1, 6 barabar gaps mein bhi kati hai. Khilona us par pehle mark par ruka: kitne kilometre par?
  > card: Ab wahi sadak, 0 se 1, 6 barabar gaps mein bhi kati hai. Khilona us par pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 6 kilometre  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 2309 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. 6 toh poori sadak ke gaps ki ginti hai, khilona utna nahi chala; woh 0 se ek hi gap chala, toh socho ek gap kitne kilometre ka hai. 6 barabar gaps wali sadak par pehla mark kitne kilometre par hai?
  > card: Ab wahi sadak, 0 se 1, 6 barabar gaps mein bhi kati hai. Khilona us par pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1/6 kilometre hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (1 miss) · board up · ready 3732 ms · guard long]: Haan, bilkul theek, kyunki yeh sadak 6 barabar gaps mein kati hai, aur khilona ghar se bas ek gap chala, toh 1/6 kilometre par. Chalo, ab pichhle sawaal par wapas chalte hain. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (2 miss) · board up · ready 3252 ms · guard leak,samecard]: Yeh jawab sahi nahi hai. Jaise 7 gaps wali line par 1/7 ki ek pakki jagah thi, waise hi 9 gaps wali line par 1/9 ki bhi jagah hai; 1/9 matlab 9 mein se 1 gap. 9 gaps wali line par 1/9 kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 0 ke just baad wala mark  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2136 ms]: Haan, sahi hai. 1/9 matlab 9 barabar gaps mein se 1 gap, toh 1/9 ki jagah 0 se ek gap par, pehle mark par hai. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1268 ms]: Aaj ke liye itna hi, phir milenge.

## Agent


