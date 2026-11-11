# steering-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj cricket pitch ki tarah number line par fractions dekhenge. Tumhe cricket mein kya pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1605 ms]: Cricket pitch ko ek number line socho: ek stump 0 par hai aur doosra stump 1 par. Batsman run ke liye bhaaga aur theek beech mein ruk gaya. Woh pitch ke ek pakke spot par khada hai, aur us spot ka bhi ek number hota hai. Pitch ko 0 se 1 tak ek seedhi line socho.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 3885 ms · guard long]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 4249 ms · guard leak,long]: 0 se 1 ki line ko 2 barabar gaps mein baanto. Beech wala mark 1/2 hai, aur woh 0 aur 1 ke beech hi hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2277 ms]: Theek hai, ab Hindi mein. 0 se 1 ki rekha ko 2 barabar gaps mein baanto. Beech wala nishaan 1/2 hai, aur woh 0 aur 1 ke beech hi hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** near 3  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 4408 ms · guard long]: Nahi, yeh jawab nahi hai. Screen par ghar se chai ki dukaan tak 0 se 1 km ki sadak hai, aur khilona beech wale nishaan par ruka hai. Woh ek pakke jagah par khada hai, aur us jagah ka number 1/2 km hai, 0 aur 1 ke beech. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}],"hop":{"num":1}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 4405 ms · guard long]: Khilona sadak ke ek pakke jagah par khada hai. Us jagah ka bhi ek number hai, jo 0 aur 1 ke beech hai. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}],"hop":{"num":1}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2952 ms]: Dekho, yahi numbers ab patti par. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-bars@1 {"wholes":"1 equal bars","bar1":"8 equal parts, 1 shaded = ?","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 3/8 km  _(incorrect)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 3639 ms · guard samecard,uncorrected]: 3/8 km sahi nahi hai. Poori sadak 1 km hai aur 8 barabar hisson mein bati hai. Ek hissa poore ka kaunsa bhinn hai, woh socho. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/8 km  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 (1 miss) · board up · ready 1003 ms]: Haan, sahi hai, kyunki sadak 8 barabar hisson mein hai, toh pehle hisse ka end 1/8 km par hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}],"hop":{"num":1}}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 (1 miss) · board up · ready 4180 ms · guard affirms,leak,twoq]: Haan, pehle tum try karo — Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** usi line par  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1919 ms]: Bilkul sahi, kyunki 1/3 ka matlab 0 se 1 ke 3 barabar gaps mein se pehla gap, toh woh isi rekha par hai.
  > screen: board fraction-line@1 {"labels":"1/3","numbers":"0 1 1/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · board up · ready 2890 ms]: Cricket ki baat hum is sawaal ke baad karenge.
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 6494 ms · guard mustsay,ask]: Achha. Screen par wahi 0 se 1 ki rekha hai, aur rekha ke upar ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Isi rekha ke neeche ki taraf beech mein 7 marks hain. Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > card: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[1,4]]}}

**child:** 7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · board up · ready 2794 ms · guard level,uncorrected]: 7 sahi nahi hai. Screen par 0 se 1 metre tak ka ribbon hai, beech mein 4 chalk ke nishaan hain, aur ribbon 5 barabar hisson mein bata hai. Pehla nishaan wahan hai jahan pehla barabar hissa khatam hota hai, isliye woh 1/5 metre par hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/5","numbers":"0 1 1/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 2441 ms]: 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > card: 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 2238 ms]: Nishaan nahi, unke beech ke gaps gino. 7 nishaan se gaps hamesha ek zyada bante hain. 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > card: 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/8 m  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 (1 miss) · board up · ready 6815 ms · guard ask,noconfirm]: Haan, sahi hai, kyunki 7 nishaan ribbon ke 8 barabar hisse banaate hain, aur pehla nishaan pehle hisse ke end par, yaani 1/8 metre par hai. Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > card: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}]}}

**child:** aath  _(correct)_

**Asha** [probe · beat s1:explain:e2 · board up · ready 990 ms]: Bilkul sahi, kyunki beech ke nishaan se gaps hamesha ek zyada hote hain, 7 + 1 = 8.
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 5024 ms · guard mustsay,ask]: Achha. Screen par 0 se 1 ki rekha ab 8 barabar gaps mein bati hai, toh har gap pehle se chhota gap hai. Pehla nishaan 1/8 hai, bilkul 0 ke paas, aur beech wala nishaan abhi bhi 1/2 hai. Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** 1/5  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1548 ms]: 1/5 sahi nahi hai. Screen par 0 se 1 ki ek hi rekha par do nishaan hain: 1/2 aur 1/5, aur 1/5, 0 ke zyada paas hai. Neeche ka number jitna bada, hissa utna chhota, aur woh 0 ke utna paas rukta hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/5 | 1/2","numbers":"0 1 1/5 1/2"} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":2,"label":"1/5"},{"num":5,"label":"1/2"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 5425 ms · guard ask]: Screen par 0 se 1 ki rekha par 1/3 ka nishaan hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > card: Screen par 0 se 1 ki rekha par 1/3 ka nishaan hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > screen: board fraction-line@1 {"labels":"1/3","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"dens":[3,6],"from":0,"to":1,"marks":[[1,3]]}}

**child:** after 1/3  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias (1 miss) · board up · ready 2662 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. 1/6 wala gap 1/3 wale gap se chhota hota hai. Chhota gap 0 ke zyada paas rukta hai. Screen par 0 se 1 ki rekha par 1/3 ka nishaan hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > card: Screen par 0 se 1 ki rekha par 1/3 ka nishaan hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > screen: board fraction-line@1 {"labels":"1/3","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"dens":[3,6],"from":0,"to":1,"marks":[[1,3]]}}

**child:** 0 aur 1/3 ke beech  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 (1 miss) · board up · ready 4641 ms · guard ask]: Haan, sahi hai, kyunki 1/6 ka hissa 1/3 ke hisse ka aadha hai, toh 1/6, 0 aur 1/3 ke beech rukta hai. Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[3,6],"from":0,"to":1,"marks":[[1,3],[1,6]]}}

**child:** one tenth  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 4607 ms · guard leak,long,screenmismatch]: Bilkul sahi, kyunki 10 barabar gaps ka har gap 5 gaps wale gap se chhota hai, toh 1/10, 0 ke zyada paas rukta hai. Ghar 0 par hai aur school 1 km par. Ghar aur school ke beech raaste mein 3 bijli ke khambe barabar doori par lage hain. Pehla khamba ghar se kitne km door hai? Diya hai: ghar 0 par aur school 1 km par hai, aur beech mein 3 khambe barabar doori par hain. Dhoondhna hai: pehle khambe ki ghar se doori, km mein. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1,"marks":[[1,5],[1,10]]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 4396 ms · guard wrap,wrap]: Theek hai, Riya. Teen vikalp hain: abhi jaari rakhein, thoda viraam lein, ya aaj ke liye rok dein.

## Agent


