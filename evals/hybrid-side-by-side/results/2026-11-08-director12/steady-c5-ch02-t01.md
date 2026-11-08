# steady-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Hi Riya, main Asha, tumhari AI teacher hoon. Aaj cricket pitch jaisi number line par fractions dekhenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2455 ms]: Cricket pitch ko ek number line socho: ek stump 0 par hai aur doosra stump 1 par. Batsman run ke liye bhaaga aur theek beech mein ruk gaya. Woh pitch ke ek pakke spot par khada hai, aur us spot ka bhi ek number hota hai. Achha, Riya. Cricket pitch ko 0 se 1 tak ek seedhi line samjho.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 3345 ms · guard long]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 4279 ms · guard mustsay,leak]: 0 se 1 ki line ko 2 barabar gaps mein baanto. Beech wala mark 1/2 hai, aur woh 0 aur 1 ke beech hi hai. Ab isi par ek sawaal.
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 2749 ms]: Theek hai, Riya. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3864 ms · guard mustsay,leak]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** on the line from 0 to 1  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 2402 ms]: Haan, sahi jagah: 0 aur 1 ke beech, kyunki 1/3 ka matlab 0 se 1 ke 3 barabar gaps mein se pehla gap, toh woh isi line par hai. Tumne kaise jaana ki 1/3 isi line par hoga?
  > screen: board fraction-line@1 {"labels":"1/3","numbers":"0 1 1/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** maine dobara check kiya  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 3007 ms · guard mustsay]: Achha, ab samajh aaya tumne kaise socha. Screen par wahi 0 se 1 ki line hai, aur line ke upar ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Isi line ke neeche ki taraf beech mein 7 marks hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 3397 ms · guard mustsay]: Marks mat gino, gaps gino. Line ke upar 3 marks se 4 barabar gaps bante hain. Ab is par ek chhota sawaal.
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[1,4]]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 2630 ms]: Screen par 0 se 1 tak ki line hai. Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > card: Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** aath  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1684 ms]: Haan, sahi hai, kyunki beech ke marks se gaps hamesha ek zyada hote hain, 7 + 1 = 8. Screen par 0 se 1 ki line ab 8 barabar gaps mein bati hai, toh har gap pehle se chhota gap hai. Pehla mark 1/8 hai, bilkul 0 ke paas, aur beech wala mark abhi bhi 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2525 ms]: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1}}

**child:** 1 by 10  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1247 ms]: Haan, sahi hai, kyunki 10 barabar gaps ka har gap 5 gaps wale gap se chhota hai, toh 1/10, 0 ke zyada paas rukta hai. Ghar 0 par hai aur school 1 km par. Ghar aur school ke beech raaste mein 3 bijli ke khambe barabar doori par lage hain. Pehla khamba ghar se kitne km door hai? Diya hai: ghar 0 par, school 1 km par, beech mein 3 khambe, barabar doori par. Dhoondhna hai: pehle khambe ki ghar se doori, km mein. Chalo, aage dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1,"marks":[[1,5],[1,10]]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2371 ms]: Pehla kadam dekho. Line banao aur ghar ko 0 par, school ko 1 par likho: 0 se 1 tak ki line, kyunki 0 se 1 tak ka poora raasta hi humara ek poora hai. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2655 ms]: Ab doosra kadam. Khambe nahi, beech ke gaps gino: 3 khambe, toh 4 barabar hisse, kyunki beech ke marks se gaps hamesha ek zyada hote hain. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 5878 ms · guard long]: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 3600 ms · guard praise,affirms]: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1155 ms]: Bilkul, Riya—tumne 4 equal gaps mein pehla gap 1/4 liya, kyunki raasta 4 barabar gaps mein bata hai, har gap 1/4 km ka, aur pehla khamba 0 se ek gap par hai. Ab batao, yeh answer kyun kaam karta hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** maine dono ko mila ke dekha  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 3164 ms]: Theek, yeh tumhari soch thi. Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 4006 ms · guard ask]: Zaroor. Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa bhinn hai?
  > card: Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa bhinn hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** 1/2  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · board up · ready 2536 ms · guard praise,long,uncorrected]: 1/2 sahi nahi hai. Screen par 0 se 1 metre tak ka ribbon hai, beech mein 3 chalk ke nishaan hain, aur ribbon 4 barabar hisson mein bata hai. Pehla nishaan wahan hai jahan pehla barabar hissa khatam hota hai, isliye woh 1/4 metre par hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1984 ms]: Virat yaad rahega; yeh sawaal khatam karke uspar aate hain. 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > card: 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/8 m hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 2261 ms]: Haan, sahi hai, kyunki 7 nishaan ribbon ke 8 barabar hisse banaate hain, aur pehla nishaan pehle hisse ke end par, yaani 1/8 metre par hai. Aur Virat ki baat: tumne mujhse Virat ke baare mein poocha tha; lesson ke baad mujhe Virat ke baare mein aur batana. Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > card: Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}]}}

**child:** 1/10  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 2547 ms · guard ask]: Sahi, Riya—tumne pehchana ki chhota bhinn 0 ke zyada paas hota hai, kyunki 10 gaps wala hissa 3 gaps wale hisse se chhota hai, toh 1/10, 0 ke zyada paas rukta hai. 0 se 3 tak ki sankhya rekha par 1/2 kin do poore numbers ke beech aata hai?
  > card: 0 se 3 tak ki sankhya rekha par 1/2 kin do poore numbers ke beech aata hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 2 3 1/2"} · ref {"template":"fraction-line@1","params":{"dens":[3,10],"from":0,"to":1,"marks":[[1,3],[1,10]]}}

**child:** at 2  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 2207 ms]: at 2 sahi nahi hai. Screen par ghar se chai ki dukaan tak 0 se 1 km ki sadak hai, aur khilona beech wale mark par ruka hai. Woh ek pakke spot par khada hai, aur us spot ka number 1/2 km hai, 0 aur 1 ke beech. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":3,"target":[1,2]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2604 ms]: Khilona sadak ke beech wale spot par khada hai. Us spot ka bhi number hai: 1/2 km, 0 aur 1 ke beech. Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > card: Wahi 0 se 1 km ki sadak ab 8 barabar hisson mein bati hai. Khilona pehle hisse ke end par ruka. Woh kis number par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}],"hop":{"num":1}}}

**child:** ek bata aath km  _(correct)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2127 ms]: Haan, sahi: pehla hissa 1/8 km ka hai, kyunki sadak 8 barabar hisson mein hai, toh pehle hisse ka end 1/8 km par hai. Ab tak humne 0 se sirf ek gap liya, jaise 1/4. Agle hisse mein 0 se 2 ya 3 gap chalenge, aur upar ka number batayega ki kitne gap chalna hai. Ab aage chalte hain.
  > screen: board fraction-line@1 {"labels":"1/8","numbers":"0 1 1/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}],"hop":{"num":1}}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2761 ms]: Screen par 0 se 1 ki line 3 barabar gaps mein bati hai. 0 se 2 hop lage hain, har hop 1/3 ka, aur hum 2/3 wale mark par pahunche. 2/3 ek hi jagah hai, ek hi number. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"2/3","numbers":"0 1 2/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 · board up · ready 5929 ms · guard ask]: 0 se 2 hop lo, aur tum 2/3 par pahunchte ho. Ab line ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > card: Ab line ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > screen: board fraction-line@1 {"labels":"2/3","numbers":"0 1 2/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}}

**child:** 3 by 4  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 1670 ms]: Sahi, Riya, kyunki har hop 1/4 ka hai aur 0 se 3 hop liye, toh hum 3/4 par hain. Tumne kaise jaana ki 3/4 aayega?
  > screen: board fraction-line@1 {"labels":"3/4","numbers":"0 1 3/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":3,"label":"3/4"}],"hop":{"num":3}}}

**child:** maine dono ko mila ke dekha  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 · board up · ready 4790 ms · guard long]: Theek, yeh tumhari soch thi. Screen par teesra hop dekho: woh theek 1 par utra, aur wahan likha hai 3/3 = 1. 3/3 mein upar aur neeche barabar hain, isliye hop theek 1 par khatam hue. Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > card: Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > screen: board fraction-line@1 {"labels":"3/3 = | 1","numbers":"0 1 3/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":3,"label":"3/3 = 1"}],"hop":{"num":3}}}

**child:** 5 hai na  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 2537 ms · guard mustsay]: Haan, sahi hai, kyunki har hop 1/5 ka hai, aur 5 hop milkar 5/5 = 1 banate hain. Screen par 0 se 1 ki line 6 barabar gaps mein bati hai. Beech wala mark 3/6 hai, yaani 1/2, kyunki 3, 6 ka aadha hai. Line par 2/6 aur 5/6 bhi likhe hain: 2/6 beech se pehle, 5/6 beech ke baad. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"2/6 | 3/6 = | 1/2 | 5/6","numbers":"0 1 2/6 3/6 1/2 5/6"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":5,"label":"5/5 = 1"}],"hop":{"num":5}}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 · board up · ready 2833 ms]: Isi line par 4/6 kahaan aayega: beech se pehle ya beech ke baad?
  > card: Isi line par 4/6 kahaan aayega: beech se pehle ya beech ke baad?
  > screen: board fraction-line@1 {"labels":"2/6 | 3/6 = | 1/2 | 5/6","numbers":"0 1 2/6 3/6 1/2 5/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** beech ke baad  _(correct)_

**Asha** [probe · beat s2:explain:e3 · board up · ready 2304 ms]: Bilkul, Riya, kyunki beech 3/6 hai, aur 4/6 mein 4 gaps hain, 3 se zyada, toh 4/6 beech ke baad hai. Yeh kaise pata chala ki 4/6 beech ke baad hoga?
  > screen: board fraction-line@1 {"labels":"3/6 | 4/6","numbers":"0 1 3/6 4/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":3,"label":"3/6"},{"num":4,"label":"4/6"}]}}

**child:** maine dobara check kiya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 3155 ms · guard invented]: Achha, ab samajh aaya tumne kaise socha. Ek sankhya rekha 0 se 1 tak hai. Is line par 2/5 kahaan aayega, woh mark dhoondo. Diya hai: line 0 se 1 tak, bhinn 2/5 hai: neeche 5, upar 2. Dhoondhna hai: 2/5 wala mark. Ab isse aage chalte hain.
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** maine dhyan se dekh ke socha  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2618 ms]: Pehla kadam dekho. Neeche ka 5 dekho aur 0 se 1 ko 5 barabar gaps mein baanto: 5 barabar hisse, beech mein 4 marks, kyunki neeche ka number batata hai ki poora kitne barabar gaps mein bata hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 2974 ms]: Ab doosra kadam. Ab ek gap ki value dekho: har hissa 1/5, kyunki 5 barabar gaps milkar 1 poora banate hain. Chalo, aage dekhte hain.
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t01-s2:ask:worked · board up · ready 3425 ms · guard screenmismatch]: Ab upar ka number dekho aur 0 se utne gap aage chalo. 0 ke baad kaunse mark par rukoge?
  > card: Ab upar ka number dekho aur 0 se utne gap aage chalo. 0 ke baad kaunse mark par rukoge?
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** 2nd  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t01-s2:c1 · board up · ready 3068 ms · guard ask]: Haan, sahi hai, kyunki upar ka 2 batata hai ki 0 se 1/5 ke 2 gap chalna hai. Toh poora jawab: 2/5, 0 ke baad doosra mark hai. Screen par 0 se 1 tak ki line hai, aur beech mein 5 marks barabar doori par hain. 0 ke baad chautha mark kaunsa bhinn hai?
  > card: Screen par 0 se 1 tak ki line hai, aur beech mein 5 marks barabar doori par hain. 0 ke baad chautha mark kaunsa bhinn hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":2,"label":"2/5"}],"hop":{"num":2}}}

**child:** four sixths  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t01-s2:c2 · board up · ready 1588 ms · guard noconfirm]: Haan, sahi hai, kyunki beech ke 5 marks line ko 6 barabar gaps mein baantte hain, aur chautha mark 4 gaps par, yaani 4/6 par hai. 0 se 1 ki line par 1/4 ke 3 hop lo, ya 1/8 ke 3 hop. 1 ke zyada paas kaun hai: 3/4 ya 3/8?
  > card: 0 se 1 ki line par 1/4 ke 3 hop lo, ya 1/8 ke 3 hop. 1 ke zyada paas kaun hai: 3/4 ya 3/8?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":4,"label":"4/6"}]}}

**child:** 3/4 hai na  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t01-s2:c3 · board up · ready 3631 ms · guard ask]: Haan, sahi hai, kyunki 1/4 ka hop 1/8 ke hop se do guna hai, toh 3 bade hop 3/4 tak jaate hain, 3/8 se aage. 0 se 3 tak ki sankhya rekha par 3/4 kin do poore numbers ke beech aata hai?
  > card: 0 se 3 tak ki sankhya rekha par 3/4 kin do poore numbers ke beech aata hai?
  > screen: board fraction-line@1 {"labels":"3/4","numbers":"0 1 2 3 3/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[3,4],[3,8]]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 5025 ms · guard wrap,wrap]: Theek hai, Riya, tum thak gayi ho. Teen vikalp hain: aage badhein, thodi der rukhein, ya aaj ke liye rok dein—tum kya chunogi?
  > screen: board fraction-line@1 {"labels":"3/4","numbers":"0 1 2 3 3/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":3,"target":[3,4]}}

## Agent


