# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1698 ms]: Aaj hum fractions ko ek seedhi line par jagah denge. Cricket ki pitch socho. Ek stump 0 par, doosra 1 par. Batsman run lene bhaaga aur theek beech mein ruk gaya. Woh pitch ki ek pakki jagah par khada hai, toh us jagah ka bhi ek number hai. Ab tak samajh aaya?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 970 ms]: Koi baat nahi, ise seedhe, chhote shabdon mein kehti hoon. Yeh rahi 0 se 1 tak ki line. Theek beech mein ek mark hai, toh line ke 2 barabar gaps ban gaye. Is mark ka naam hai 1/2. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 4192 ms · guard leak]: 1/3 ka neeche wala number 3 batata hai ki ek poore ko 3 barabar gaps mein kaatna hai. Ab socho, board par woh ek poora kahan se kahan tak hai. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 1945 ms]: Achha, yahi baat doosre shabdon mein kehti hoon. Ek roti ko theek beech se kaato toh do barabar hisse milte hain. Line par bhi beech wala mark 0 se 1 ko aise hi do barabar gaps mein baant-ta hai, isliye woh 1/2 hai. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** is line par  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2172 ms · guard mustsay]: Haan, sahi hai, kyunki neeche wala number 3 matlab 0 se 1 ke 3 barabar gaps, aur pehla gap isi line par khatam hota hai. Wahi 0 se 1 ki line, par ab line ke upar 6 marks hain. Marks mat gino, gaps gino: 7 barabar gaps. Toh 0 ke baad pehla mark hai 1/7. Line ke upar 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 1046 ms]: Line ke upar pehla mark 1/7 hai. Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > card: Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 8 barabar gaps  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 967 ms · guard mustsay]: Bilkul sahi. Dekho, beech ke marks se gaps hamesha ek zyada, toh 7 marks ke 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Pehle 7 gaps the, ab zyada hain, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se theek ek gap door. Is line par kitne barabar gaps hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** 7  _(incorrect)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 1994 ms · guard negates]: Is line par 8 barabar gaps hain. Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2943 ms · guard samecard]: Dhyan pehle gap par rakho: pehli patti aath barabar gaps mein hai aur uska pehla gap rangin hai, doosri utni hi lambi patti das barabar gaps mein. Dono pattiyon ka baayan kinaara line ka 0 hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** 1/8  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1215 ms]: 1/8 sahi nahi hai. Chalo, isko ek aur dhang se samajhte hain. Board par ek hi line hai, 0 se 1: ek taraf 2 barabar gap, doosri taraf 5. Fraction ka neeche wala number jitna bada, utne zyada gap, aur har gap utna chhota: 1/5 ka gap 1/2 ke gap se chhota hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 2667 ms]: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > card: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 4009 ms · guard leak,long]: Line ke neeche 0 se pehla gap dekho, aur dekho woh 1/5 wale mark se pehle khatam hota hai ya aage. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > card: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** after 1/5  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 2348 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Is sawaal ka jawab 0 aur 1/5 ke beech hai, kyunki 7 gaps wala har gap 5 gaps wale se chhota hai, isliye 1/7, 0 aur 1/5 ke beech rukta hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5],[1,7]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 2788 ms]: 5 gap milkar 0 se 1 bharte hain, aur 7 gap ko bhi wahi 0 se 1 bharna hai, toh 7 waala har gap chhota hoga; isliye 1/7 pehle aata hai, 0 aur 1/5 ke beech. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5],[1,7]]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (1 miss) · board up · ready 2103 ms]: Yeh baat phir milegi; tab tak pichhla sawaal ek baar aur dekhte hain. Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (1 miss) · board up · ready 2670 ms · guard samecard]: Haan, pehle tum try karo.
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** 1 by 10  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 2007 ms · guard flat]: Haan, sahi hai, kyunki 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas. Ek-ek kadam karke, agla sawaal milkar dekhein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 1838 ms]: Ek hi deewar par do seedhiyaan socho, ek mein 8 barabar paydaan aur ek mein 10: 10 wali seedhi ka pehla paydaan zameen ke zyada paas hota hai, waise hi line par 1/10 pehle rukta hai, 0 ke zyada paas. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 1840 ms]: Line ke upar aur neeche ka pehla gap ungli se naapo, aur dekho kaunsa gap chhota hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 3108 ms · guard flat]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 2590 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3454 ms · guard quiz]: Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Dekhte hain, pehla khamba ghar se kitne kilometre door hai. Ek line kheencho, ghar 0 par aur school 1 par: 0 se 1 tak ki line, kyunki poora raasta hi humara ek poora hai. 3 khambon se ghar se school tak kitne gaps bane?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 2  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2624 ms · guard long]: Khambe mat gino, unke beech ke gaps gino: 3 khambon se kul 4 gaps bane, kyunki gaps hamesha beech ke marks se ek zyada hote hain. Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se bas ek gap door hai. Woh kitne kilometre par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se bas ek gap door hai. Woh kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4 kilometre hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 1958 ms]: Haan, sahi hai. Dekho, 4 barabar gaps mein har gap 1/4 kilometre ka hai, aur pehla khamba 0 se theek ek gap par khada hai. Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1 by 11  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 1070 ms · guard noconfirm]: Bilkul sahi: 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** right  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 (1 miss) · board up · ready 2932 ms · guard samecard,uncorrected]: Nahi, yeh theek nahi hai. Number bada hai ya chhota, yeh chhodo. Board par 1/4 aur 1/11 ke pehle gap ki lambai dekho, aur socho kaunsa mark line ke shuru ke zyada paas rukta hai. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai: yeh sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1}}

**child:** wrong hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 3504 ms]: Haan, bilkul theek. Dekho, 11 barabar gaps mein har gap 4 wale gap se chhota hai, isliye 1/11 pehle rukta hai; Zoya galat hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1,"marks":[[1,4],[1,11]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 2245 ms]: Nahi, yeh jawab nahi hai. Achha, ise ek baar aise sochte hain. Ghar 0 par, chai ki dukaan 1 kilometre par, aur line ke upar sadak 7 barabar gaps mein bati hai. Ek chaabi wala khilona pehle mark par ruka. Woh sadak ki ek pakki jagah par khada hai, uska number 1/7 kilometre hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2153 ms]: Number se jagah tak chalo: 1/7 kilometre sadak par ek hi jagah hai, line ke upar pehla mark. Ek jagah ka ek hi naam hota hai, isliye 1/7 ek number hai, do alag number nahi. Line ke neeche wahi sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?
  > card: Line ke neeche wahi sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1 and 6  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 2053 ms · guard twoq,uncorrected]: Yeh jawab sahi nahi hai. Line ke neeche bhi wahi sadak hai, bas 6 barabar gaps mein. Ek gap poore kilometre ka kaunsa fraction hai, yahi socho. Line ke neeche 6 barabar gaps wali sadak par, pehle mark par ruka khilona 0 se kitne kilometre par hai?
  > card: Line ke neeche wahi sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1 and 6  _(misconception)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 1733 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Is sawaal ka jawab 1/6 kilometre par hai, kyunki line ke neeche sadak 6 barabar gaps mein hai, aur pehla mark 0 se ek gap par, yaani 1/6 kilometre. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (1 miss) · board up · ready 2395 ms]: Theek hai, ab wapas usi sawaal par chalte hain. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** pehle mark par  _(correct)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2100 ms · guard mustsay]: Haan, sahi hai. Dekho, 1/9 matlab 0 se ek gap, yaani pehla mark. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye. 2/3 ek hi jagah hai, ek hi number. 2/3 tak pahunchne ke liye 0 se kitne gap chale?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 873 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milenge.

## Agent


