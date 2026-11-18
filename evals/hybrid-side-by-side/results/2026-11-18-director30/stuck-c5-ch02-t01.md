# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2239 ms]: Aaj hum fractions ko ek seedhi line par jagah denge. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2283 ms · guard long]: Chalo, main batati hoon. Cricket pitch: ek stump 0 par, doosra 1 par. Batsman theek beech mein ruka; us jagah ka bhi number hai. Yeh rahi 0 se 1 tak ki line. Theek beech mein ek mark hai, toh line ke 2 barabar gaps ban gaye. Is mark ka naam hai 1/2. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3040 ms · guard leak]: 1/3 ka neeche wala number 3 batata hai ki ek poore ko 3 barabar gaps mein kaatna hai. Ab socho, board par woh ek poora kahan se kahan tak hai. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2410 ms]: Haan, ise seedhe, chhote shabdon mein kehti hoon. Ek roti ko theek beech se kaato toh do barabar hisse milte hain. Line par bhi beech wala mark 0 se 1 ko aise hi do barabar gaps mein baant-ta hai, isliye woh 1/2 hai. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** is line par  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 3446 ms · guard mustsay,long]: Haan, sahi hai, kyunki line 3 gaps mein kati hai, toh 1/3 yahin hai. Wahi 0 se 1 ki line, par ab line ke upar 6 marks hain. Marks mat gino, gaps gino: 7 barabar gaps. Toh 0 ke baad pehla mark hai 1/7. Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > card: Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 1132 ms]: Line ke neeche marks ke beech ki khaali jagah gino, aur 0 ke baad wali aur 1 se pehle wali jagah bhi mat chhodna. Line ke neeche kitne barabar gaps bane hain?
  > card: Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 8 barabar gaps  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 1259 ms · guard mustsay,screenmismatch]: Bilkul sahi. Dekho, beech ke marks se gaps hamesha ek zyada, toh 7 marks ke 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Gap zyada, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se theek ek gap door. Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** 1/10 hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2353 ms]: Haan, bilkul theek, kyunki 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas. Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Doori ke liye khambe ginoge, ya khambon ke beech ke gaps?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2436 ms]: Is patti ko raasta samjho: baayan kinaara ghar, daayan kinaara school, aur beech ke teen marks teen khambe. Doori ke liye khambe ginoge, ya khambon ke beech ke gaps?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 3666 ms · guard affirms]: Ghar se pehle khambe tak chalo: tum ek gap chale, khamba toh bas wahan khada hai. Doori ke liye khambe ginoge, ya khambon ke beech ke gaps?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2288 ms]: Doori gaps se naapte hain: khambe nahi, gaps, kyunki khambe jagahein hain, chalna gaps mein hota hai. Khambe raaste ko kaatte hain: 3 khambon se 4 barabar gaps, kyunki pehle khambe se pehle aur aakhri ke baad bhi ek-ek gap hai. Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 4058 ms · guard answerinq]: Poora raasta 1 kilometre ka hai, aur woh 4 barabar gaps mein kata hai. Ek gap 1 kilometre ka kaunsa fraction hai, bas yahi socho. 1 kilometre ka raasta 4 barabar gaps mein hai; pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 2455 ms · guard long]: 1/3 km sahi nahi hai. Ek aur dhang se samajhte hain. Darzi ka ribbon 0 se 1 metre tak hai, aur us par 6 chalk ke marks hain. Marks 6 hain, par gap 7 bante hain, isliye pehla mark 1/7 metre par hai. Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1894 ms]: Haan, pehle tum try karo.
  > card: Socho, wahi ribbon 12 barabar gaps mein kaat rahe ho. Beech mein kitne chalk ke marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":1,"label":"1/7"}]}}

**child:** 11 marks  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (1 miss) · board up · ready 1627 ms]: Haan, sahi hai, kyunki 12 barabar gaps ke beech 11 marks hote hain, gaps se ek kam. Theek hai, ab wapas usi sawaal par chalte hain. 1 kilometre ka raasta 4 barabar gaps mein hai; pehla khamba ghar se kitne kilometre par hai?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7],[1,12]]}}

**child:** 1/3 km  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (2 miss) · board up · ready 3581 ms · guard answerinq,uncorrected]: 1/3 km nahi, yeh jawab theek nahi baitha. Board ki line ko raasta samjho: 0 par ghar, 1 par school, aur beech ke marks khambe. Hum pehle gaps ginenge, phir dekhenge ki pehla khamba kitne gaps par hai. Ab phir se socho, jawab kya hoga?
  > card: Tumhari baari: pehla khamba ghar se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 1166 ms]: Bilkul sahi. Dekho, 4 barabar gaps mein har gap 1/4 kilometre ka hai, aur pehla khamba 0 se theek ek gap par khada hai. Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 1463 ms · guard uncorrected]: 1/10 sahi nahi hai. Marks chhodo, gaps gino. 0 se 1 ki line par 10 marks se jitne gaps bane, wahi neeche wala number hai. Toh ab batao, kya aayega?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** 1/10  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 1543 ms]: Nahi, yeh theek nahi hai. Is sawaal ka jawab 1/11 hai, kyunki 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c2 · board up · ready 2273 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 2363 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab apni padhai par lautte hain. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** sahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 5312 ms · guard leak,long,uncorrected]: Nahi, yeh jawab nahi hai. Ise ek baar aise sochte hain. Line ke upar 2 barabar gap hain, neeche 5. Gap jitne zyada, har gap utna chhota: 1/5 ka gap 1/2 wale se chhota hai. Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > card: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1}}

**child:** after 1/5  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias (1 miss) · board up · ready 2267 ms · guard twoq,uncorrected]: Yeh jawab sahi nahi hai. Line ke neeche 0 se pehla gap dekho, aur dekho woh 1/5 wale mark se pehle khatam hota hai ya aage. Ab phir se socho, jawab kya hoga?
  > card: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** after 1/5  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias (2 miss) · board up · ready 2116 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ek hi laddu socho: 2 bachchon mein baanto toh har ek ko bada hissa milta hai, 5 bachchon mein baanto toh chhota. 1/5 ka 5 baantne walon ki ginti jaisa hai: woh jitna bada, har gap utna chhota. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > card: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** between 0 and 1/5 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 (1 miss) · board up · ready 2413 ms]: Haan, sahi hai, kyunki 7 gaps wala har gap 5 gaps wale se chhota hai, isliye 1/7, 0 aur 1/5 ke beech rukta hai. Chalo, ab pichhle sawaal par wapas chalte hain. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5],[1,7]]}}

**child:** galat hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 4401 ms · guard deny]: Bilkul sahi. Dekho, 11 barabar gaps mein har gap 4 wale gap se chhota hai, isliye 1/11 pehle rukta hai; Zoya galat hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1,"marks":[[1,4],[1,11]]}}

**child:** 0 ke baad pehla mark  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2336 ms]: Haan, bilkul theek: 1/9 matlab 9 barabar gaps mein se 1 gap, toh 1/9 ki jagah 0 se ek gap par, pehle mark par hai. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2477 ms · guard screenmismatch]: Ab upar wala number batayega ki 0 se kitne gap chalne hain. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 · board up · ready 2461 ms · guard mustsay]: Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye. 2/3 ek hi jagah hai, ek hi number. Line ke neeche 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > card: Line ke neeche 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}}

**child:** 8/5  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 (1 miss) · board up · ready 1599 ms · guard uncorrected]: 8/5 sahi nahi hai. Line ke neeche 0 se ek-ek gap chalo aur paanch tak gino. Phir dekho, poore 1 tak aise kitne gap hain. Line ke neeche wale 8 barabar gaps par 0 se 5 gap chalkar kis fraction par pahunchoge?
  > card: Line ke neeche 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,8],"from":0,"to":1,"marks":[[2,3]]}}

**child:** 8/5  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 (2 miss) · board up · ready 1573 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Chocolate se socho: 3 barabar hisson wali chocolate ke 2 hisse kha lo, toh tumne 2/3 chocolate khayi. Line par 1/3 wale 2 gap bhi waise hi 0 se 2/3 tak le jaate hain. Line ke neeche wale 8 barabar gaps par 0 se 5 gap chalkar kis fraction par pahunchoge?
  > card: Line ke neeche 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,8],"from":0,"to":1,"marks":[[2,3]]}}

**child:** five eighths  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 · board up · ready 3340 ms · guard mustsay,leak]: Haan, sahi hai, kyunki har gap 1/8 ka, aur aise 5 gap mile toh 5/8. Line 3 barabar gaps mein kati hai. 0 se teen gap chalo toh theek 1 aata hai, isliye wahan 3/3 = 1. Teeno gap milkar 0 se 1 tak ki poori line bhar dete hain. 1/5 wale gaps dekho. 0 se theek 1 tak pahunchne ke liye aise kitne gap chalne honge?
  > card: 1/5 wale gaps dekho. 0 se theek 1 tak pahunchne ke liye aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,8],"from":0,"to":1,"marks":[[2,3],[5,8]]}}

**child:** 5 hai na  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 · board up · ready 2491 ms · guard mustsay]: Bilkul sahi. Dekho, 1/5 ke 5 gap milkar 5/5 banate hain, aur 5/5 = 1. Ab line ke 6 barabar gaps hain. Theek beech ka mark 3/6 hai, aur 3, 6 ka aadha hai, toh 3/6 = 1/2. 2/6 beech se pehle aata hai, 5/6 beech ke baad. Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > card: Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,5],"from":0,"to":1,"marks":[[3,3],[5,5]]}}

**child:** before the middle  _(incorrect)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 (1 miss) · board up · ready 3941 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Beech wale mark 3/6 se shuru karo. 4/6 tak pahunchne ke liye kis taraf ek gap chalna padega, woh dekho. Is line par 4/6 beech se pehle aayega, ya beech ke baad?
  > card: Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** before the middle  _(incorrect)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 (2 miss) · board up · ready 2764 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Roti ke 6 barabar hisse socho: 3 hisse le lo toh theek aadhi roti hai, isliye 3/6 = 1/2 beech mein hai. 2 hisse aadhi se kam hain, toh 2/6 beech se pehle, aur 5 hisse aadhi se zyada, toh 5/6 beech ke baad. Is line par 4/6 beech se pehle aayega, ya beech ke baad?
  > card: Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** before the middle  _(incorrect)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 (3 miss) · board up · ready 2150 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Beech wala mark 3/6 hai, teen gap par. 2/6 ke liye do gap chalo toh tum beech se pehle rukte ho, aur 5/6 ke liye paanch gap chalo toh beech ke aage nikal jaate ho. Is line par 4/6 beech se pehle aayega, ya beech ke baad?
  > card: Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** baad mein  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1662 ms]: Haan, sahi hai, kyunki beech 3/6 par hai, aur upar wala number 4 usse ek zyada hai, toh ek gap aage, beech ke baad. Chalo, ab ek sawaal saath mein line par karte hain. Ek number line 0 se 1 tak hai. Is par 2/5 ka mark dhoondhna hai. 2/5 ka kaunsa number batata hai ki line kitne barabar gaps mein kategi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":3,"label":"3/6"},{"num":4,"label":"4/6"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1159 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


