# offtopic-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2073 ms]: Cricket ki pitch socho. Ek stump 0 par, doosra 1 par. Batsman run lene bhaaga aur theek beech mein ruk gaya. Woh pitch ki ek pakki jagah par khada hai, toh us jagah ka bhi ek number hai. Ab tak samajh aaya?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 996 ms]: Achha, yahi baat doosre shabdon mein kehti hoon. Yeh rahi 0 se 1 tak ki line. Theek beech mein ek mark hai, toh line ke 2 barabar gaps ban gaye. Is mark ka naam hai 1/2. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** near 3  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 1741 ms]: Yeh jawab sahi nahi hai. Ise ek alag tareeke se dekhte hain. Ghar 0 par, chai ki dukaan 1 kilometre par, aur line ke upar sadak 7 barabar gaps mein bati hai. Ek chaabi wala khilona pehle mark par ruka. Woh sadak ki ek pakki jagah par khada hai, uska number 1/7 kilometre hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2]]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 1753 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2942 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab phir se apne kaam ki taraf chalte hain. Line ke neeche wahi sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?
  > card: Line ke neeche wahi sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1/6 kilometre hai na  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 (1 miss) · board up · ready 1771 ms]: Haan, bilkul theek. Dekho, line ke neeche sadak 6 barabar gaps mein hai, aur pehla mark 0 se ek gap par, yaani 1/6 kilometre. Theek hai, ab wapas usi sawaal par chalte hain. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** 0 aur 1 ke beech  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1720 ms · guard mustsay]: Sahi jawab, kyunki neeche wala number 3 matlab 0 se 1 ke 3 barabar gaps, aur pehla gap isi line par khatam hota hai. Wahi 0 se 1 ki line, par ab line ke upar 6 marks hain. Marks mat gino, gaps gino: 7 barabar gaps. Toh 0 ke baad pehla mark hai 1/7. Line ke upar 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** one-seventh  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2102 ms · guard affirms]: Haan, sahi hai. Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > card: Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · board up · ready 1171 ms · guard uncorrected]: 7 sahi nahi hai. Chalo, isko ek aur dhang se samajhte hain. Darzi ka ribbon socho, 0 se 1 metre. Line par 6 chalk ke marks hain, aur ribbon ke 7 barabar gap. Pehla mark pehle gap ke end par hai, yaani 1/7 metre. Naam gap ginkar milta hai, marks ginkar nahi. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1904 ms]: Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":1,"label":"1/7"}]}}

**child:** Dhoni  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1779 ms]: Achha, toh tumhara favourite hai Dhoni. Ab apni padhai par lautte hain. Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain?
  > card: Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":1,"label":"1/7"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1721 ms]: Line ke neeche wale gap socho: marks gap ke beech hote hain, isliye marks hamesha gap se ek kam. Ribbon line ke neeche 12 barabar gaps mein ho, toh wahan kitne chalk ke marks hain?
  > card: Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1834 ms]: Pehli patti ribbon ke saat barabar gaps dikhati hai, pehla rangin. Doosri patti abhi poori hai, bina kisi mark ke, uske chalk ke marks tumhe sochne hain. Ribbon line ke neeche 12 barabar gaps mein ho, toh wahan kitne chalk ke marks hain?
  > card: Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 11 chalk marks  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 (1 miss) · board up · ready 1101 ms]: Haan, bilkul theek. Dekho, 1/12 metre matlab ribbon ke 12 barabar gap, aur 12 gap ke beech 11 marks hote hain. Chalo, ab pichhle sawaal par wapas chalte hain. Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > card: Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7],[1,12]]}}

**child:** 8 barabar gaps  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 951 ms · guard mustsay]: Sahi jawab, kyunki beech ke marks se gaps hamesha ek zyada, toh 7 marks ke 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Pehle 7 gaps the, ab zyada hain, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se theek ek gap door. Is line par kitne barabar gaps hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2466 ms]: Theek hai, ise aur aasaan tareeke se bolti hoon. Ek chocolate ko 8 barabar hisson mein todo, toh har hissa 7 hisson wale se patla hota hai. Line par bhi 8 barabar gaps mein har gap chhota hai, isliye pehla mark, 1/8, pehle se 0 ke zyada paas aata hai. Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** 1/8  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1175 ms · guard uncorrected]: 1/8 sahi nahi hai. Achha, ise ek baar aise sochte hain. Board par ek hi line hai, 0 se 1: ek taraf 2 barabar gap, doosri taraf 5. Fraction ka neeche wala number jitna bada, utne zyada gap, aur har gap utna chhota: 1/5 ka gap 1/2 ke gap se chhota hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1921 ms]: Meri apni pasand nahi hoti, main AI hoon. Virat ko tum kiske saath dekhte ho?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,5],"from":0,"to":1,"marks":[[1,2],[1,5]]}}

**child:** papa ke saath dekhta hoon  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1627 ms]: Hmm, hoon. Samajh gayi. Achha, ab phir se padhai ki baat karte hain. Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > card: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,5],"from":0,"to":1,"marks":[[1,2],[1,5]]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 2677 ms · guard leak,twoq]: Haan, pehle tum try karo.
  > card: Line ke neeche 7 gaps hain, aur line ke upar pehla mark 1/5 hai. 1/7 kahaan aayega: 0 aur 1/5 ke beech, ya baad mein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5]]}}

**child:** between 0 and 1/5 hai na  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (1 miss) · board up · ready 2129 ms]: Haan, bilkul theek. Dekho, 7 gaps wala har gap 5 gaps wale se chhota hai, isliye 1/7, 0 aur 1/5 ke beech rukta hai. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,7],"from":0,"to":1,"marks":[[1,5],[1,7]]}}

**child:** 1/8  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (2 miss) · board up · ready 2330 ms · guard leak,samecard]: 1/8 sahi nahi hai. Line ke upar aur neeche ka pehla gap ungli se naapo, aur dekho kaunsa gap chhota hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** one tenth  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 2223 ms · guard flat]: Sahi jawab, kyunki 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas. Ek-ek kadam karke, agla sawaal milkar dekhein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2260 ms]: Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Dekhte hain, pehla khamba ghar se kitne kilometre door hai. Ek line kheencho, ghar 0 par aur school 1 par: 0 se 1 tak ki line, kyunki poora raasta hi humara ek poora hai. 3 khambon se ghar se school tak kitne gaps bane?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 4  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2262 ms · guard affirms]: Haan, 4 gaps, kyunki gaps hamesha beech ke khambon se ek zyada hote hain. Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se bas ek gap door hai. Woh kitne kilometre par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se bas ek gap door hai. Woh kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** one quarter km  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 1880 ms]: Haan, bilkul theek. Dekho, 4 barabar gaps mein har gap 1/4 kilometre ka hai, aur pehla khamba 0 se theek ek gap par khada hai. Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/11 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 1623 ms]: Haan, sahi hai: 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** right  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 (1 miss) · board up · ready 1991 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Number bada hai ya chhota, yeh chhodo. Board par 1/4 aur 1/11 ke pehle gap ki lambai dekho, aur socho kaunsa mark line ke shuru ke zyada paas rukta hai. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai: yeh sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1}}

**child:** right  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 2868 ms · guard affirms,uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka jawab: sahi nahi, kyunki 11 barabar gaps mein har gap 4 wale gap se chhota hai, isliye 1/11 pehle rukta hai; Zoya galat hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1,"marks":[[1,4],[1,11]]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:check:c2 · board up · ready 4179 ms · guard praise,affirms]: Ek pizza 11 logon mein bate toh har ek ko 4 logon wale se chhota hissa milta hai; 1/11 chhota hai, isliye line par 1/4 se pehle aata hai, aur Zoya galat hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1,"marks":[[1,4],[1,11]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 2375 ms]: Achha, is par hum dobara aayenge; ab agli baat dekhte hain. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1,"marks":[[1,4],[1,11]]}}

**child:** 1st mark  _(correct)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1699 ms · guard mustsay]: Haan, bilkul theek. Dekho, 1/9 matlab 0 se ek gap, yaani pehla mark. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye. 2/3 ek hi jagah hai, ek hi number. 2/3 tak pahunchne ke liye 0 se kitne gap chale?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1396 ms]: Aaj ke liye itna hi, phir milenge.

## Agent


