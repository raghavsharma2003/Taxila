# stuck-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj cricket pitch jaisi number line par fractions rakhenge. Tumhe cricket mein kya pasand hai?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2480 ms]: Cricket pitch ko ek number line socho: ek stump 0 par hai aur doosra stump 1 par. Batsman run ke liye bhaaga aur theek beech mein ruk gaya. Woh pitch ke ek pakke spot par khada hai, aur us spot ka bhi ek number hota hai. Theek hai, Riya.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 3561 ms · guard long]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 4287 ms · guard long]: 0 se 1 ki line ko 2 barabar gaps mein baanto. Beech wala mark 1/2 hai, aur woh 0 aur 1 ke beech hi hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 4186 ms · guard leak]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2997 ms · guard leak]: Theek hai, ab Hindi mein. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3688 ms · guard leak]: Phir se dekho: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** 0 se 1 wali line par  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2659 ms · guard mustsay]: Bilkul, Riya—1/3, 0 se 1 wali rekha par hota hai, kyunki 1/3 ka matlab 0 se 1 ke 3 barabar gaps mein se pehla gap, toh woh isi rekha par hai. Screen par wahi 0 se 1 ki rekha hai, aur rekha ke upar ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Isi rekha ke neeche ki taraf beech mein 7 marks hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 5672 ms · guard ask]: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > card: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 3148 ms · guard samecard]: Ek chhota udaharan dekho: ek patti 4 barabar hisson mein, ek hissa 1/4. Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > card: Isi rekha ke neeche ki taraf 0 aur 1 ke beech 7 nishaan barabar doori par hain. Neeche ki taraf rekha kitne barabar gaps mein bati hai?
  > screen: board fraction-bars@1 {"wholes":"1 equal bars","bar1":"4 equal parts, 1 shaded = 1/4","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** 8 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2250 ms · guard mustsay]: Haan, sahi hai, kyunki beech ke nishaan se gaps hamesha ek zyada hote hain, 7 + 1 = 8. Screen par 0 se 1 ki rekha ab 8 barabar gaps mein bati hai, toh har gap pehle se chhota gap hai. Pehla nishaan 1/8 hai, bilkul 0 ke paas, aur beech wala nishaan abhi bhi 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2851 ms · guard ask]: Rekha ke jitne zyada gaps, har gap utna chhota. Isliye 1/8 wala pehla nishaan 0 ke bilkul paas hai. Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2502 ms · guard samecard,twoq]: Pehla nishaan 1/8 hai, bilkul 0 ke paas, aur beech wala nishaan abhi bhi 1/2 hai. Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi rekha 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** 1/10 hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2406 ms]: Bilkul sahi, kyunki 10 barabar gaps ka har gap 5 gaps wale gap se chhota hai, toh 1/10, 0 ke zyada paas rukta hai. Ghar 0 par hai aur school 1 km par. Ghar aur school ke beech raaste mein 3 bijli ke khambe barabar doori par lage hain. Pehla khamba ghar se kitne km door hai? Diya hai: ghar 0 par, school 1 km par, beech mein 3 khambe, barabar doori par. Dhoondhna hai: pehle khambe ki ghar se doori, km mein. Ab isse aage chalte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3087 ms]: Pehla kadam dekho. Rekha banao aur ghar ko 0 par, school ko 1 par likho: 0 se 1 tak ki rekha, kyunki 0 se 1 tak ka poora raasta hi humara ek poora hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2413 ms]: Ghar ko 0 par aur school ko 1 par rakho. Ghar se school tak ka poora raasta ek poora hai. Chalo, aage dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2504 ms]: Ab doosra kadam. Khambe nahi, beech ke gaps gino: 3 khambe, toh 4 barabar hisse, kyunki beech ke nishaan se gaps hamesha ek zyada hote hain. Ab isse aage chalte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2612 ms]: Virat ki baat hum is sawaal ke baad karenge. Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 2428 ms]: Phir se dekho: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/3 km  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · board up · ready 3836 ms · guard uncorrected]: 1/3 km sahi nahi hai. Screen par 0 se 1 metre tak ka ribbon hai, beech mein 3 chalk ke nishaan hain, aur ribbon 4 barabar hisson mein bata hai. Pehla nishaan wahan hai jahan pehla barabar hissa khatam hota hai, isliye woh 1/4 metre par hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1844 ms]: Ribbon par 3 nishaan hain aur 4 barabar hisse. Bhinn hisse ka naam hai, isliye pehla nishaan 1/4 metre par hai. 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > card: 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/7 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks (1 miss) · board up · ready 3279 ms · guard flat,uncorrected]: 1/7 m sahi nahi hai. Nishaan nahi, unke beech ke gaps gino. 7 nishaan se gaps hamesha ek zyada bante hain. 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > card: 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/7 m  _(misconception)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked (1 miss) gave · board up · ready 2953 ms · guard uncorrected]: 1/7 m sahi nahi hai. Is sawaal ka jawab 1/8 m tha, kyunki 7 nishaan ribbon ke 8 barabar hisse banaate hain, aur pehla nishaan pehle hisse ke end par, yaani 1/8 metre par hai. Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}]}}

**child:** 1/3 km  _(misconception)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 gave · board up · ready 5974 ms · guard leak,ask,uncorrected]: Nahi, yeh jawab nahi hai. Toh poora jawab: pehla khamba ghar se 1/4 km door hai, kyunki raasta 4 barabar gaps mein bata hai, har gap 1/4 km ka, aur pehla khamba 0 se ek gap par hai. Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > card: Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/2  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 954 ms · guard uncorrected]: 1/2 sahi nahi hai. Pehle gaps gino, nishaan nahi. 2 nishaan se rekha jitne barabar gaps mein bati, wahi number neeche aata hai. Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > card: Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** 1/2  _(misconception)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 gave · board up · ready 900 ms · guard uncorrected]: 1/2 sahi nahi hai. Is sawaal ka jawab 1/3 tha, kyunki beech ke 2 nishaan rekha ko 3 barabar gaps mein baantte hain, aur pehla nishaan ek gap par hai, yaani 1/3. Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > card: Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** 1/10  _(correct)_

**Asha** [probe · beat s1:check:c2 · board up · ready 1339 ms]: Haan, sahi hai, kyunki 10 gaps wala hissa 3 gaps wale hisse se chhota hai, toh 1/10, 0 ke zyada paas rukta hai.
  > screen: board fraction-line@1 {"labels":"1/3 | 1/10","numbers":"0 1 1/3 1/10"} · ref {"template":"fraction-line@1","params":{"dens":[3,10],"from":0,"to":1,"marks":[[1,3],[1,10]]}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 5952 ms · guard ask]: Achha. Main AI teacher hoon, toh meri apni koi pasand nahi — Virat tumhari pasand hai, yeh main yaad rakhungi. Haan, woh sawaal poora ho gaya. 0 se 3 tak ki sankhya rekha par 1/2 kin do poore numbers ke beech aata hai?
  > card: 0 se 3 tak ki sankhya rekha par 1/2 kin do poore numbers ke beech aata hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 2 3 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":3,"target":[1,2]}}

**child:** halfway between 0 and 1  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2677 ms]: Bilkul, 1/2, 0 aur 1 ke beech hota hai—dono ke theek beech, kyunki 1/2 ek poore ka aadha hai, toh woh 0 aur 1 ke beech aata hai. Ab tak humne 0 se sirf ek gap liya, jaise 1/4. Agle hisse mein 0 se 2 ya 3 gap chalenge, aur upar ka number batayega ki kitne gap chalna hai. Ab agla hissa.
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":3,"marks":[{"num":1,"label":"1/2"}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3861 ms · guard mustsay]: Screen par 0 se 1 ki rekha 3 barabar gaps mein bati hai. 0 se 2 hop lage hain, har hop 1/3 ka, aur hum 2/3 wale nishaan par pahunche. 2/3 ek hi jagah hai, ek hi number. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"2/3","numbers":"0 1 2/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 · board up · ready 5181 ms · guard ask]: Ab rekha ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > card: Ab rekha ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1}}

**child:** 4/3  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 (1 miss) · board up · ready 1842 ms]: Nahi, yeh jawab nahi hai. 0 se 2 hop lo, aur tum 2/3 par pahunchte ho. Ab rekha ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > card: Ab rekha ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}}

**child:** three quarters  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 · board up · ready 2117 ms · guard mustsay]: Haan, sahi hai, kyunki har hop 1/4 ka hai aur 0 se 3 hop liye, toh hum 3/4 par hain. Screen par teesra hop dekho: woh theek 1 par utra, aur wahan likha hai 3/3 = 1. 3/3 mein upar aur neeche barabar hain, isliye hop theek 1 par khatam hue. Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > card: Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > screen: board fraction-line@1 {"labels":"3/3 = | 1","numbers":"0 1 3/3"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":3,"label":"3/4"}],"hop":{"num":3}}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (1 miss) · board up · ready 1245 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Teesra hop theek 1 par utarta hai, isliye wahan 3/3 = 1 likha hai. Jab upar aur neeche barabar hon, hop theek 1 par khatam hote hain. Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > card: Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":3,"label":"3/3 = 1"}],"hop":{"num":3}}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 (2 miss) · board up · ready 3126 ms · guard samecard,uncorrected]: 4 sahi nahi hai. Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > card: Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** 5 hai na  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 2480 ms · guard mustsay]: Bilkul sahi, kyunki har hop 1/5 ka hai, aur 5 hop milkar 5/5 = 1 banate hain. Screen par 0 se 1 ki rekha 6 barabar gaps mein bati hai. Beech wala nishaan 3/6 hai, yaani 1/2, kyunki 3, 6 ka aadha hai. Rekha par 2/6 aur 5/6 bhi likhe hain: 2/6 beech se pehle, 5/6 beech ke baad. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"2/6 | 3/6 = | 1/2 | 5/6","numbers":"0 1 2/6 3/6 1/2 5/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4467 ms · guard wrap,nochoice,wrap]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board fraction-line@1 {"labels":"2/6 | 3/6 = | 1/2 | 5/6","numbers":"0 1 2/6 3/6 1/2 5/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

## Agent


