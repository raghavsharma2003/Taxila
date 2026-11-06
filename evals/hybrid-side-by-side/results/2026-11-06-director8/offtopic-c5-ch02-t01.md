# offtopic-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj cricket pitch jaisi number line par fractions rakhenge. Tumhe cricket pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1969 ms]: Cricket pitch ko ek number line socho: ek stump 0 par hai aur doosra stump 1 par. Batsman run ke liye bhaaga aur theek beech mein ruk gaya. Woh pitch ke ek pakke spot par khada hai, aur us spot ka bhi ek number hota hai. Badhiya, Riya—cricket pitch ko number line maan sakte hain.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3593 ms · guard long]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3195 ms · guard leak]: Sixer toh banta hai! Ab Zoya ke claim ko number line par check karo: 1/3 ko 0 se 1 wali line par rakhogi ya 3 ke paas? Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** near 3  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 3103 ms · guard long]: Riya, 1/3, 3 ke paas nahi; yeh 0 aur 1 ke beech hai. Screen par ghar se chai ki dukaan tak ki sadak hai, 0 se 1 km, aur ek khilona beech wale mark par ruka hai. Woh sadak ke ek pakke spot par khada hai, aur us spot ka number 1/2 km hai, 0 aur 1 ke beech. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}],"hop":{"num":1}}}

**child:** 0/8 km  _(incorrect)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 3815 ms · guard samecard,uncorrected]: 0/8 km sahi nahi hai. 0 se 1 km ke beech 8 equal parts hain; khilona pehle mark par ruka. Us mark ka fraction-number kya hoga? Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/8  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 1134 ms · guard mustsay,noconfirm]: Haan, sahi hai. Aur pehle wale sawaal ka jawab isi line par tha, kyunki yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Screen par wahi 0 se 1 ki line hai, par ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Agar 0 aur 1 ke beech 7 marks barabar doori par lage hon, toh line kitne barabar gaps mein bategi?
  > card: Agar 0 aur 1 ke beech 7 marks barabar doori par lage hon, toh line kitne barabar gaps mein bategi?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 8 gaps  _(correct)_

**Asha** [probe · beat s1:explain:e2 · board up · ready 1204 ms]: Bilkul, Riya—tumne 7 marks ke beech 8 equal gaps ginke sahi rule lagaya. 0 aur 1 ke beech 7 marks se 8 gaps kyun bante hain?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** shayad hisse gin ke  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 3025 ms · guard mustsay]: Haan, sahi hai. Screen par 0 se 1 ki line ab 8 barabar gaps mein bati hai. Pehla mark 1/8 hai, bilkul 0 ke paas, aur beech wala mark abhi bhi 1/2 hai. Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 3171 ms · guard mustsay,samecard]: Sixer ka score yaad hai! Screen par 0 se 1 ki line ab 8 barabar gaps mein bati hai. Pehla mark 1/8 hai, bilkul 0 ke paas, aur beech wala mark abhi bhi 1/2 hai. Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** 1/5  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 2060 ms · guard long,uncorrected]: 1/5 sahi nahi hai. Screen par 0 se 1 ki ek hi line par teen mark hain: 1/2, 1/4 aur 1/8, aur 1/8 bilkul 0 ke paas hai. Neeche ka number jitna bada, hissa utna chhota, aur woh 0 ke utna paas rukta hai. Screen par 0 se 1 ki line par 1/3 ka mark hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > card: Screen par 0 se 1 ki line par 1/3 ka mark hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4 | 1/2","numbers":"0 1 1/8 1/4 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"},{"num":4,"label":"1/2"}]}}

**child:** pehle  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2406 ms · guard invented]: Sahi—pehla pole 0 aur 1 ke beech aayega. Aur pehle wale sawaal ka jawab 1/10 tha, kyunki pehla mark 1/8 hai, bilkul 0 ke paas, aur beech wala mark abhi bhi 1/2 hai. Ghar 0 par hai aur school 1 km par. Ghar aur school ke beech raaste mein 3 bijli ke khambe barabar doori par lage hain. Pehla khamba ghar se kitne km door hai? Diya hai: ghar 0 par, school 1 km par, beech mein 3 khambe, barabar doori par. Dhoondhna hai: pehle khambe ki ghar se doori, km mein. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2728 ms]: Line banao aur ghar ko 0 par, school ko 1 par likho: 0 se 1 tak ki line, kyunki 0 se 1 tak ka poora raasta hi humara ek poora hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 3437 ms · guard stage,answerinq]: Screen par 0 se 1 tak ka raasta 4 barabar gaps mein banta hai.
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2364 ms]: Khambe nahi, beech ke gaps gino: 3 khambe, toh 4 barabar hisse, kyunki beech ke marks se gaps hamesha ek zyada hote hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 5163 ms · guard long]: Theek hai, drawing ko aise dekho: 0 se 1 tak ki line ko 4 barabar gaps mein baanto. Pehla khamba 0 ke baad wale pehle gap ke end par hoga. Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2357 ms]: Hindi mein? Zaroor. 0 से 1 किलोमीटर तक का रास्ता 4 बराबर हिस्सों में बाँटो। पहला खम्भा घर से पहले हिस्से के अंत पर है। Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4 km hai na  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 2778 ms · guard nowhy,flat]: Haan, sahi hai. Haan, Riya—1/4 km sahi hai. Tumne 0 se 1 km ko 4 barabar hisson mein baantkar yeh jawab kaise jaana?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe laga aisa hi hoga  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 3252 ms]: Toh poora jawab: pehla khamba ghar se 1/4 km door hai, kyunki raasta 4 barabar gaps mein bata hai, har gap 1/4 km ka, aur pehla khamba 0 se ek gap par hai. Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 3037 ms]: Theek hai, Riya. Tum khud karke batao.
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 2071 ms]: Beech ke marks se barabar gaps gino; pehle mark tak kitna ek hissa hai, us par dhyan do. Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** 1/3 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 1774 ms]: Haan, sahi hai. Haan, 1/3 sahi hai—2 marks se 3 barabar gaps bante hain. Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > card: Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"dens":[3,10],"from":0,"to":1}}

**child:** 1/10  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 1574 ms]: Bilkul sahi, Riya—tumne samjha ki 10 barabar hisson mein pehla hissa zyada chhota hota hai. 0 se 3 tak ki number line par 1/2 kin do poore numbers ke beech aata hai?
  > card: 0 se 3 tak ki number line par 1/2 kin do poore numbers ke beech aata hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 2 3 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":3,"target":[1,2]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3332 ms · guard wrap,nochoice,wrap]: Theek hai Riya, tum thak gayi ho. Ab teen choices hain: chalu rakhein, chhota break lein, ya aaj ke liye rok dein—kya chunogi?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 2 3 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":3,"target":[1,2]}}

## Agent


