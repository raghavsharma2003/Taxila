# steering-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj fractions ko number line par cricket pitch ki tarah dekhenge. Tumhe cricket mein kya pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1860 ms]: Cricket pitch ko ek number line socho: ek stump 0 par hai aur doosra stump 1 par. Batsman run ke liye bhaaga aur theek beech mein ruk gaya. Woh pitch ke ek pakke spot par khada hai, aur us spot ka bhi ek number hota hai. Cricket pitch ka start 0 aur finish 1 socho.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 4747 ms · guard long]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3815 ms · guard leak,long]: 0 se 1 ki line ko 2 barabar gaps mein baanto. Beech wala mark 1/2 hai, aur woh 0 aur 1 ke beech hi hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 1995 ms]: Zaroor. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** near 3  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 2300 ms · guard uncorrected]: near 3 sahi nahi hai. Screen par ghar se chai ki dukaan tak 0 se 1 km ki sadak hai, aur khilona beech wale mark par ruka hai. Woh ek pakke spot par khada hai, aur us spot ka number 1/2 km hai, 0 aur 1 ke beech. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2475 ms]: Khilona sadak ke beech wale spot par khada hai. Us spot ka bhi number hai: 1/2 km, 0 aur 1 ke beech. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}],"hop":{"num":1}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 3412 ms · guard samecard]: Dekho, yahi numbers ab patti par. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-bars@1 {"wholes":"1 equal bars","bar1":"8 equal parts, 1 shaded = ?","labels":"0 | 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 3/8 km  _(incorrect)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 1909 ms · guard uncorrected]: 3/8 km sahi nahi hai. Poori sadak 1 km hai aur 8 barabar hisson mein bati hai. Ek hissa poore ka kaunsa bhinn hai, woh socho. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/8 km  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1219 ms · guard mustsay]: Haan, sahi hai, kyunki sadak 8 barabar hisson mein hai, toh pehle hisse ka end 1/8 km par hai. Screen par wahi 0 se 1 ki line hai, aur line ke upar ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Isi line ke neeche ki taraf beech mein 7 marks hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}],"hop":{"num":1}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2538 ms · guard mustsay]: Marks mat gino, gaps gino. Line ke upar 3 marks se 4 barabar gaps bante hain. Ab is par ek chhota sawaal.
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[1,4]]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2263 ms]: Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > card: Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 3145 ms · guard praise,affirms,level]: Yaad karo: Screen par wahi 0 se 1 ki line hai, aur line ke upar ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Isi line ke neeche ki taraf beech mein 7 marks hain. Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > card: Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** 8 barabar gaps  _(correct)_

**Asha** [probe · beat s1:explain:e2 · board up · ready 2553 ms · guard nowhy]: Haan, sahi hai, kyunki beech ke marks se gaps hamesha ek zyada hote hain, 7 + 1 = 8. Tumne marks aur kinare ko kis tarah gina?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · board up · ready 2330 ms]: Cricket ki baat hum is sawaal ke baad karenge.
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2475 ms]: Theek hai. Aur cricket ki baat: kal tumne cricket khela, sixer maara: yeh sunke bahut achha laga. Screen par 0 se 1 ki line ab 8 barabar gaps mein bati hai, toh har gap pehle se chhota gap hai. Pehla mark 1/8 hai, bilkul 0 ke paas, aur beech wala mark abhi bhi 1/2 hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2665 ms]: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 3046 ms · guard mustsay,answerinq,screenmismatch]: Line ke jitne zyada gaps, har gap utna chhota. Isliye 1/8 wala pehla mark 0 ke bilkul paas hai. Ab isi par ek sawaal.
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 3448 ms]: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1}}

**child:** 1/10 hai na  _(correct)_

**Asha** [probe · beat s1:explain:e3 · board up · ready 1988 ms]: Haan, sahi hai, kyunki 10 barabar gaps ka har gap 5 gaps wale gap se chhota hai, toh 1/10, 0 ke zyada paas rukta hai.
  > screen: board fraction-line@1 {"labels":"1/5 | 1/10","numbers":"0 1 1/5 1/10"} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1,"marks":[[1,5],[1,10]]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 3354 ms]: Theek hai. Ghar 0 par hai aur school 1 km par. Ghar aur school ke beech raaste mein 3 bijli ke khambe barabar doori par lage hain. Pehla khamba ghar se kitne km door hai? Diya hai: ghar 0 par, school 1 km par, beech mein 3 khambe, barabar doori par. Dhoondhna hai: pehle khambe ki ghar se doori, km mein. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3307 ms]: Pehla kadam dekho. Line banao aur ghar ko 0 par, school ko 1 par likho: 0 se 1 tak ki line, kyunki 0 se 1 tak ka poora raasta hi humara ek poora hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3933 ms · guard affirms,quiz]: Ab doosra kadam. Khambe nahi, beech ke gaps gino: 3 khambe, toh 4 barabar hisse, kyunki beech ke marks se gaps hamesha ek zyada hote hain. Ab isse aage chalte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 3770 ms · guard long]: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** ek chauthai km  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 3504 ms · guard ask]: Bilkul sahi: tumne 4 barabar gaps mein pehle khambe ka ek gap pehchana, kyunki raasta 4 barabar gaps mein bata hai, har gap 1/4 km ka, aur pehla khamba 0 se ek gap par hai. Toh poora jawab: pehla khamba ghar se 1/4 km door hai. Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa bhinn hai?
  > card: Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa bhinn hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3655 ms · guard wrap,nochoice,wrap]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

## Agent


