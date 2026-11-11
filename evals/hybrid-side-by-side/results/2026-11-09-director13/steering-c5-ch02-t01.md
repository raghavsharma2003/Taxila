# steering-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Hi Riya, main Asha, tumhari AI teacher. Aaj cricket pitch jaisi number line par fractions rakhenge. Tumhe cricket mein batting ya bowling pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2050 ms]: Cricket pitch ko ek number line socho: ek stump 0 par hai aur doosra stump 1 par. Batsman run ke liye bhaaga aur theek beech mein ruk gaya. Woh pitch ke ek pakke spot par khada hai, aur us spot ka bhi ek number hota hai. Pitch ko 0 se 1 tak ek seedhi line socho.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 6062 ms · guard long]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 7880 ms · guard leak,long]: 0 se 1 ki line ko 2 barabar gaps mein baanto. Beech wala mark 1/2 hai, aur woh 0 aur 1 ke beech hi hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 5316 ms]: Haan, ab se Hindi mein bolti hoon. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** near 3  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 4158 ms · guard flat,uncorrected]: near 3 sahi nahi hai. Screen par ghar se chai ki dukaan tak 0 se 1 km ki sadak hai, aur khilona beech wale nishaan par ruka hai. Woh ek pakke jagah par khada hai, aur us jagah ka number 1/2 km hai, 0 aur 1 ke beech. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 3886 ms]: Khilona sadak ke ek pakke jagah par khada hai. Us jagah ka bhi ek number hai, jo 0 aur 1 ke beech hai. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}],"hop":{"num":1}}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 4975 ms · guard answerinq]: Dekho, yahi numbers ab patti par. Phir se dekho: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-bars@1 {"wholes":"1 equal bars","bar1":"8 equal parts, 1 shaded = ?","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 3/8 km  _(incorrect)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers (1 miss) · board up · ready 6046 ms · guard samecard,uncorrected]: 3/8 km sahi nahi hai. Poori sadak 1 km hai aur 8 barabar hisson mein bati hai. Ek hissa poore ka kaunsa bhinn hai, woh socho. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/8 km  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 (1 miss) · board up · ready 950 ms]: Bilkul, Riya, kyunki sadak 8 barabar hisson mein hai, toh pehle hisse ka end 1/8 km par hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}],"hop":{"num":1}}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 (1 miss) · board up · ready 4303 ms · guard leak]: Phir se dekho: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** usi line par  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 2687 ms]: Haan, sahi hai, kyunki 1/3 ka matlab 0 se 1 ke 3 barabar gaps mein se pehla gap, toh woh isi rekha par hai.
  > screen: board fraction-line@1 {"labels":"1/3","numbers":"0 1 1/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · board up · ready 3341 ms]: Cricket yaad rahega; yeh sawaal khatam karke uspar aate hain.
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 7372 ms · guard mustsay]: Achha, tumne apna tareeka bataya. Mujhe bhi cricket pasand hai, khaaskar jab batsman zor se ball maarta hai. Screen par wahi 0 se 1 ki rekha hai, aur rekha ke upar ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Isi rekha ke neeche ki taraf beech mein 7 marks hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[1,4]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2949 ms · guard mustsay]: Marks mat gino, gaps gino. Rekha ke upar 3 marks se 4 barabar gaps bante hain. Ab is par ek chhota sawaal.
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[1,4]]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 3621 ms · guard screenmismatch]: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > card: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 6195 ms]: Screen par 0 se 1 metre tak ka ribbon hai, beech mein 3 chalk ke nishaan hain, aur ribbon 4 barabar hisson mein bata hai. Pehla nishaan wahan hai jahan pehla barabar hissa khatam hota hai, isliye woh 1/4 metre par hai. Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > card: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 8  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1262 ms · guard mustsay]: Bilkul, 7 nishaan 8 barabar gaps banate hain, kyunki beech ke nishaan se gaps hamesha ek zyada hote hain, 7 + 1 = 8. Screen par 0 se 1 ki rekha ab 8 barabar gaps mein bati hai, toh har gap pehle se chhota gap hai. Pehla nishaan 1/8 hai, bilkul 0 ke paas, aur beech wala nishaan abhi bhi 1/2 hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 5713 ms · guard ask]: Theek hai, Riya. Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1}}

**child:** 1 by 10  _(correct)_

**Asha** [probe · beat s1:explain:e3 · board up · ready 1090 ms]: Sahi, Riya, kyunki 10 barabar gaps ka har gap 5 gaps wale gap se chhota hai, toh 1/10, 0 ke zyada paas rukta hai.
  > screen: board fraction-line@1 {"labels":"1/5 | 1/10","numbers":"0 1 1/5 1/10"} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1,"marks":[[1,5],[1,10]]}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 3073 ms]: Theek hai, Riya. Ghar 0 par hai aur school 1 km par. Ghar aur school ke beech raaste mein 3 bijli ke khambe barabar doori par lage hain. Pehla khamba ghar se kitne km door hai? Diya hai: ghar 0 par, school 1 km par, beech mein 3 khambe, barabar doori par. Dhoondhna hai: pehle khambe ki ghar se doori, km mein. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3025 ms]: Pehla kadam dekho. Rekha banao aur ghar ko 0 par, school ko 1 par likho: 0 se 1 tak ki rekha, kyunki 0 se 1 tak ka poora raasta hi humara ek poora hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2313 ms]: Ghar ko 0 par aur school ko 1 par rakho. Ghar se school tak ka poora raasta ek poora hai. Ab isse aage chalte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3616 ms]: Ab doosra kadam. Khambe nahi, beech ke gaps gino: 3 khambe, toh 4 barabar hisse, kyunki beech ke nishaan se gaps hamesha ek zyada hote hain. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 4648 ms · guard leak,long]: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4672 ms · guard wrap]: Theek hai Riya, tum thak gayi ho. Chuno: aage badhein, thodi der ka viraam lein, ya aaj ke liye rok dein?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

## Agent


