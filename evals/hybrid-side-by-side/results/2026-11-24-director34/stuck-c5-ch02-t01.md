# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 3170 ms · guard leak]: Aaj hum fractions ko ek seedhi line par jagah denge. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2848 ms · guard mustsay,twoq]: Chalo, main batati hoon. Cricket pitch: ek stump 0 par, doosra 1 par. Batsman theek beech mein ruka; us jagah ka bhi number hai. Yeh rahi 0 se 1 tak ki line. Theek beech mein ek mark hai, toh line ke 2 barabar gaps ban gaye. Is mark ka naam hai 1/2. Line ki doosri taraf 3 barabar gaps hain. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > card: Line ki doosri taraf 3 barabar gaps hain. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2825 ms · guard leak]: Beech wale mark ka naam line ke 2 barabar gaps se aaya tha. Ab doosri taraf ke gaps gino, aur pehle mark ka naam usi tarah rakho. 0 se 1 ki line 3 barabar gaps mein kati ho, toh 0 ke baad pehla mark kaunsa fraction hai?
  > card: Line ki doosri taraf 3 barabar gaps hain. Wahan 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2902 ms · guard ask]: Haan, Hindi mein hi kehti hoon. Doosri taraf 3 gap bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > card: Doosri taraf 3 gap bane hain. 0 se chala pehla gap jahan khatam hota hai, us mark ka naam batao, kis fraction ka hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** one third  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2214 ms · guard mustsay,answerinq]: Haan, sahi hai, kyunki 3 barabar gaps, pehla mark ek gap par: 1/3. Ab 0 aur 1 ke beech 6 marks hain. Neeche wala number gaps se aata hai: 7 barabar gaps. Toh 0 ke baad pehla mark 1/7 hai. Ab socho, doosri taraf 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Us taraf kitne gaps banenge?
  > card: Ab socho, doosri taraf 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Us taraf kitne gaps banenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2114 ms · guard long]: Doosri taraf ke gaps ek-ek karke socho: marks ke beech wale bhi, aur 0 ke baad wala aur 1 se pehle wala bhi. 0 aur 1 ke beech 7 marks line ko barabar gaps mein baant-te hon, toh kitne gaps banenge?
  > card: Ab socho, doosri taraf 0 aur 1 ke beech 7 marks hon, jo use barabar gaps mein baant-te hain. Us taraf kitne gaps banenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":1,"label":"1/7"}]}}

**child:** aath gaps  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 1009 ms · guard mustsay]: Bilkul sahi. Suno, marks se gaps ek zyada: 7 marks, 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Gap zyada, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se ek gap door. Ab doosri taraf wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Ab doosri taraf wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** one tenth  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1267 ms]: Haan, bilkul theek: 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas. Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Board par abhi sirf beech wala khamba hai. 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2105 ms · guard screenmismatch]: Is patti ko raasta samjho: baayan kinaara ghar, daayan kinaara school, aur beech ka kinaara beech wala khamba. Baaki do khambe board par nahi hain, unhe tumhe sochna hai. Ghar se school tak 1 kilometre ke raaste par 3 khambe barabar doori par hain; woh raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2043 ms · guard affirms]: Baaki do khambe bhi socho, phir ghar se chalna shuru karo aur har gap par ek gino: khambon ke beech wale bhi, aur dono siron wale bhi. Ab tum batao.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1905 ms]: 3 khambe raaste ko kitne barabar gaps mein kaatte hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 1846 ms · guard twoq]: 3 khambe raaste ko 4 barabar gaps mein kaatte hain: ghar se pehle khambe tak ek gap, aur aakhri khambe se school tak bhi ek. Doori gaps se naapte hain, khambon se nahi: khamba bas ek jagah hai, aur ghar se pehle khambe tak ka chalna ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 2271 ms · guard long,diagnosis,uncorrected]: 1/3 km sahi nahi hai. Ek aur dhang se samajhte hain. Darzi ka ribbon 0 se 1 metre tak hai, aur us par 4 chalk ke marks hain. Marks 4 hain, par gap 5 bante hain, isliye pehla mark 1/5 metre par hai. Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1952 ms]: Haan, pehle tum try karo.
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** gyaarah  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (1 miss) · board up · ready 1050 ms]: Haan, sahi hai, kyunki 12 barabar gaps ke beech 11 marks hote hain, gaps se ek kam. Theek hai, ab wapas usi sawaal par chalte hain. 1 kilometre ka raasta 4 barabar gaps mein hai; pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,12],"from":0,"to":1,"marks":[[1,5],[1,12]]}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (2 miss) · board up · ready 2833 ms · guard answerinq,samecard,uncorrected]: Nahi, 1/3 km theek nahi. 1/3 tab hota jab raasta 3 gaps mein kata hota; tumne khambe gine hain, par doori gaps se naapte hain, aur aakhri khambe se school tak bhi ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4 km  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 970 ms]: Bilkul sahi. Suno, 4 barabar gaps mein har gap 1/4 kilometre ka hai, aur pehla khamba 0 se theek ek gap par khada hai. Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. Ab agla sawaal tumhare liye. Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 1085 ms · guard twoq,uncorrected]: 1/10 sahi nahi hai. 1/10 tab hota jab 0 se 1 ki line 10 barabar gaps mein hoti; par yahan 10 marks hain, aur 0 ke baad aur 1 se pehle bhi ek-ek gap hai. Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (2 miss) · board up · ready 997 ms · guard twoq,uncorrected]: 1/10 se baat nahi bani. Neeche wala number marks nahi, gaps ginta hai. 0 aur 1 ke beech ke 10 marks se jitne gaps bane, wahi neeche wala number hai. Chalo, ab tumhari baari.
  > card: Is line par 0 aur 1 ke beech 10 marks hain, jo use barabar gaps mein baant-te hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** 1/10  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 965 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Is sawaal ka jawab 1/11 hai, kyunki 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c2 · board up · ready 2094 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 2008 ms]: Wah, batting! Toh yeh tumhe achha lagta hai. Ab apni padhai par lautte hain. Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > card: Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** 1/4  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 2530 ms · guard long,uncorrected]: 1/4 sahi nahi hai. Ise ek baar aise sochte hain. Ek taraf 2 barabar gap hain, doosri taraf 5. Gap jitne zyada, har gap utna chhota: 1/5 ka gap 1/2 wale se chhota. Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > card: Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1}}

**child:** after 1/5  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias (1 miss) · board up · ready 3798 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. 1/7 ko aage rakha kyunki 7 bada hai; par 7 gap bhi wahi 0 se 1 bharte hain; socho, 7 wala gap 5 wale se lamba hoga ya chhota. Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > card: Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** after 1/5  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias (2 miss) · board up · ready 1988 ms · guard uncorrected]: Nahi, yeh theek nahi hai. 7 gaps wali taraf 0 se pehla gap dekho, aur dekho woh 1/5 wale mark se pehle khatam hota hai ya aage. Jo tumhe lagta hai, woh bolo.
  > card: Ek taraf pehla mark 1/5 hai, doosri taraf 7 barabar gaps. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya 1/5 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** 1/5 se pehle  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 (1 miss) · board up · ready 1334 ms]: Haan, sahi hai: 7 gaps wala har gap 5 gaps wale se chhota hai, isliye 1/7, 0 aur 1/5 ke beech rukta hai. Chalo, ab pichhle sawaal par wapas chalte hain. Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > card: Line ki ek taraf 4 barabar gaps hain, doosri taraf 12. Dono taraf ke marks mein 0 ke sabse paas wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5],[1,7]]}}

**child:** 1/12  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 3246 ms · guard long,noconfirm]: Bilkul sahi, kyunki 12 barabar gaps ka har gap 4 wale se chhota hai, isliye 1/12 wala pehla mark 0 ke sabse paas hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,12],"from":0,"to":1,"marks":[[1,4],[1,12]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 4356 ms · guard long,uncorrected]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Sadak 0 se 1 kilometre, 7 barabar gaps mein kati hai. Ek khilona pehle mark par ruka: woh ek pakki jagah hai, uska number 1/7 kilometre. Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > card: Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 6 kilometre  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 1920 ms]: Nahi, yeh jawab nahi hai. 6 toh poori sadak ke gaps ki ginti hai, khilona utna nahi chala; woh 0 se ek hi gap chala, toh socho ek gap kitne kilometre ka hai. 1 kilometre ki sadak 6 barabar gaps mein kati ho, toh pehle mark par ruka khilona 0 se kitne kilometre par hai?
  > card: Doosri taraf wahi sadak, 0 se 1, 6 barabar gaps mein hai. Khilona wahan pehle mark par ruka: kitne kilometre par?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1/6 kilometre hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (1 miss) · board up · ready 2274 ms]: Haan, bilkul theek. Doosri taraf sadak 6 barabar gaps mein hai, aur pehla mark 0 se ek gap par, yaani 1/6 kilometre. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (2 miss) · board up · ready 3324 ms · guard samecard]: Nahi, yeh theek nahi hai. Jaise 7 gaps wali line par 1/7 ki ek pakki jagah thi, waise hi 9 gaps wali line par 1/9 ki bhi jagah hai; 1/9 matlab 9 mein se 1 gap. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** 0 ke just baad wala mark  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2222 ms]: Haan, sahi hai: 1/9 matlab 9 barabar gaps mein se 1 gap, toh 1/9 ki jagah 0 se ek gap par, pehle mark par hai. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1153 ms]: Aaj ke liye itna hi, phir milenge.

## Agent


