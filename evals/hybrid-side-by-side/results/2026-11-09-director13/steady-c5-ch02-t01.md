# steady-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj cricket pitch jaise number line par fractions rakhenge. Cricket mein tumhe kya pasand hai—batting ya bowling?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2950 ms]: Cricket pitch ko ek number line socho: ek stump 0 par hai aur doosra stump 1 par. Batsman run ke liye bhaaga aur theek beech mein ruk gaya. Woh pitch ke ek pakke spot par khada hai, aur us spot ka bhi ek number hota hai. Achha.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 3752 ms · guard long]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 4173 ms · guard leak]: 0 se 1 ki line ko 2 barabar gaps mein baanto. Beech wala mark 1/2 hai, aur woh 0 aur 1 ke beech hi hai. Ab isi par ek sawaal.
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3653 ms]: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 3240 ms · guard mustsay,leak]: Screen par 0 se 1 ki line hai, aur theek beech mein ek mark. Yeh mark 0 se 1 ko 2 barabar gaps mein baant raha hai, aur is mark ka naam 1/2 hai. Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > card: Zoya ka kehna hai ki 1/3, 3 ke paas aata hai. 1/3 kahaan hai: isi 0 se 1 wali line par, ya 3 ke paas?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 1/2"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** on the line from 0 to 1  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 3303 ms]: Haan, sahi jagah, kyunki 1/3 ka matlab 0 se 1 ke 3 barabar gaps mein se pehla gap, toh woh isi line par hai. Ab batao, tumne kaise jaana ki 1/3 isi 0 se 1 wali line par hoga?
  > screen: board fraction-line@1 {"labels":"1/3","numbers":"0 1 1/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** maine dobara check kiya  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 5856 ms · guard mustsay,flat]: Achha. Screen par wahi 0 se 1 ki line hai, aur line ke upar ab beech mein 3 marks hain. Marks nahi, gaps dekho: 4 barabar gaps hain, isliye 0 ke baad pehla mark 1/4 hai. Isi line ke neeche ki taraf beech mein 7 marks hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[1,4]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 3405 ms · guard mustsay,flat]: Marks mat gino, gaps gino. Line ke upar 3 marks se 4 barabar gaps bante hain. Ab is par ek chhota sawaal.
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[1,4]]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 3826 ms]: Ek chhota udaharan dekho: ek patti 4 barabar hisson mein, ek hissa 1/4. Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > card: Isi line ke neeche ki taraf 0 aur 1 ke beech 7 marks barabar doori par hain. Neeche ki taraf line kitne barabar gaps mein bati hai?
  > screen: board fraction-bars@1 {"wholes":"1 equal bars","bar1":"4 equal parts, 1 shaded = 1/4","labels":""} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** aath  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1651 ms]: Bilkul, neeche wali line 8 barabar gaps mein bati hai, kyunki beech ke marks se gaps hamesha ek zyada hote hain, 7 + 1 = 8. Screen par 0 se 1 ki line ab 8 barabar gaps mein bati hai, toh har gap pehle se chhota gap hai. Pehla mark 1/8 hai, bilkul 0 ke paas, aur beech wala mark abhi bhi 1/2 hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/2","numbers":"0 1 1/8 1/2"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 2660 ms]: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > card: Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1}}

**child:** 1 by 10  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1614 ms]: Haan, sahi hai, kyunki 10 barabar gaps ka har gap 5 gaps wale gap se chhota hai, toh 1/10, 0 ke zyada paas rukta hai. Ghar 0 par hai aur school 1 km par. Ghar aur school ke beech raaste mein 3 bijli ke khambe barabar doori par lage hain. Pehla khamba ghar se kitne km door hai? Diya hai: ghar 0 par, school 1 km par, beech mein 3 khambe, barabar doori par. Dhoondhna hai: pehle khambe ki ghar se doori, km mein. Chalo, aage dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1,"marks":[[1,5],[1,10]]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2756 ms]: Pehla kadam dekho. Line banao aur ghar ko 0 par, school ko 1 par likho: 0 se 1 tak ki line, kyunki 0 se 1 tak ka poora raasta hi humara ek poora hai. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3040 ms]: Ab doosra kadam. Khambe nahi, beech ke gaps gino: 3 khambe, toh 4 barabar hisse, kyunki beech ke marks se gaps hamesha ek zyada hote hain. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 3711 ms · guard long]: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 3676 ms · guard praise,affirms]: Phir se dekho: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se theek ek gap door hai. Toh pehla khamba kitne km par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1588 ms]: Bilkul, Riya—tumne 4 equal gaps mein se 1 gap pehla khamba liya, kyunki raasta 4 barabar gaps mein bata hai, har gap 1/4 km ka, aur pehla khamba 0 se ek gap par hai. Ab batao, tumne kaise jaana ki 1/4 hoga?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** maine dono ko mila ke dekha  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 5263 ms]: Theek, yeh tumhari soch thi. Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > card: Screen par 0 se 1 tak ki line hai, aur beech mein 2 marks barabar doori par hain. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 6890 ms · guard long,ask,twoq]: Haan, ab se Hindi mein bolti hoon. Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > card: Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** 1/2  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · board up · ready 1133 ms · guard uncorrected]: 1/2 sahi nahi hai. Screen par 0 se 1 metre tak ka ribbon hai, beech mein 3 chalk ke nishaan hain, aur ribbon 4 barabar hisson mein bata hai. Pehla nishaan wahan hai jahan pehla barabar hissa khatam hota hai, isliye woh 1/4 metre par hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1902 ms]: Virat yaad rahega; yeh sawaal khatam karke uspar aate hain. 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > card: 1 metre ke ribbon par beech mein 7 chalk ke nishaan barabar doori par hain. Pehla nishaan kitne metre par hai?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":1}}

**child:** 1/8 m hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 6460 ms · guard ask]: Haan, sahi hai, kyunki 7 nishaan ribbon ke 8 barabar hisse banaate hain, aur pehla nishaan pehle hisse ke end par, yaani 1/8 metre par hai. Haan, mujhe Virat pasand hai—woh bahut mehnati cricketer hain. Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > card: Screen par 0 se 1 tak ki rekha hai, aur beech mein 2 nishaan barabar doori par hain. 0 ke baad pehla nishaan kaunsa bhinn hai?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"}]}}

**child:** 1/3  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 1527 ms]: Haan, sahi hai, kyunki beech ke 2 nishaan rekha ko 3 barabar gaps mein baantte hain, aur pehla nishaan ek gap par hai, yaani 1/3. Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > card: Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** 1/3  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 1500 ms]: 1/3 sahi nahi hai. Screen par 0 se 1 ki ek hi rekha par teen nishaan hain: 1/2, 1/4 aur 1/8, aur 1/8 bilkul 0 ke paas hai. Neeche ka number jitna bada, hissa utna chhota, aur woh 0 ke utna paas rukta hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4 | 1/2","numbers":"0 1 1/8 1/4 1/2"} · ref {"template":"fraction-line@1","params":{"dens":[3,10],"from":0,"to":1}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-whole-number-bias · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-whole-number-bias · board up · ready 5830 ms · guard ask]: Neeche ka number jitna bada, hissa utna chhota. Isliye 1/8, 1/4 aur 1/2 mein 1/8 sabse chhota hai aur 0 ke sabse paas hai. Screen par 0 se 1 ki rekha par 1/3 ka nishaan hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > card: Screen par 0 se 1 ki rekha par 1/3 ka nishaan hai. 1/6 kahaan aayega: 0 aur 1/3 ke beech, ya 1/3 ke baad?
  > screen: board fraction-line@1 {"labels":"1/3","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"},{"num":4,"label":"1/2"}]}}

**child:** before 1/3  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 (1 miss) · board up · ready 2379 ms · guard leak]: Haan, sahi hai, kyunki 1/6 ka hissa 1/3 ke hisse ka aadha hai, toh 1/6, 0 aur 1/3 ke beech rukta hai. Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > card: Ek baar 0 se 1 ko 3 barabar gaps mein baanto, ek baar 10 barabar gaps mein. 0 ke zyada paas kaun hai: 1/3 ya 1/10?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[3,6],"from":0,"to":1,"marks":[[1,3],[1,6]]}}

**child:** 1 by 10  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 3539 ms · guard ask]: Haan, sahi hai, kyunki 10 gaps wala hissa 3 gaps wale hisse se chhota hai, toh 1/10, 0 ke zyada paas rukta hai. 0 se 3 tak ki sankhya rekha par 1/2 kin do poore numbers ke beech aata hai?
  > card: 0 se 3 tak ki sankhya rekha par 1/2 kin do poore numbers ke beech aata hai?
  > screen: board fraction-line@1 {"labels":"1/2","numbers":"0 1 2 3 1/2"} · ref {"template":"fraction-line@1","params":{"dens":[3,10],"from":0,"to":1,"marks":[[1,3],[1,10]]}}

**child:** 0 aur 1 ke beech  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2548 ms]: Bilkul sahi, 1/2, 0 aur 1 ke beech aata hai, kyunki 1/2 ek poore ka aadha hai, toh woh 0 aur 1 ke beech aata hai. Ab tak humne 0 se sirf ek gap liya, jaise 1/4. Agle hisse mein 0 se 2 ya 3 gap chalenge, aur upar ka number batayega ki kitne gap chalna hai. Ab agla hissa.
  > screen: board fraction-line@1 {"labels":"1/4","numbers":"0 1 1/4"} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":3,"marks":[{"num":1,"label":"1/2"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2528 ms · guard mustsay]: Screen par 0 se 1 ki rekha 3 barabar gaps mein bati hai. 0 se 2 hop lage hain, har hop 1/3 ka, aur hum 2/3 wale nishaan par pahunche. 2/3 ek hi jagah hai, ek hi number. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"2/3","numbers":"0 1 2/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 · board up · ready 4891 ms · guard ask]: Theek hai, Riya. Ab rekha ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > card: Ab rekha ko 4 barabar gaps mein baanto aur 0 se 3 hop lo. Kis bhinn par pahunchoge?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1}}

**child:** teen bata chaar  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 3666 ms · guard nowhy,noconfirm]: Haan, bilkul sahi: 3 hop aur 4 barabar gaps, kyunki har hop 1/4 ka hai aur 0 se 3 hop liye, toh hum 3/4 par hain. Tumne kaise jaana ki bhinn 3/4 hogi?
  > screen: board fraction-line@1 {"labels":"3/4","numbers":"0 1 3/4"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":3,"label":"3/4"}],"hop":{"num":3}}}

**child:** jo aapne dikhaya tha, usse socha  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 · board up · ready 3575 ms · guard mustsay]: Theek, yeh tumhari soch thi. Screen par teesra hop dekho: woh theek 1 par utra, aur wahan likha hai 3/3 = 1. 3/3 mein upar aur neeche barabar hain, isliye hop theek 1 par khatam hue. Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > card: Agar har hop 1/5 ka ho, toh 0 se chalkar theek 1 tak pahunchne mein kitne hop lagenge?
  > screen: board fraction-line@1 {"labels":"3/3 = | 1","numbers":"0 1 3/3"} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":3,"label":"3/3 = 1"}],"hop":{"num":3}}}

**child:** mujhe lagta hai 5  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 2341 ms · guard mustsay]: Haan, sahi hai, kyunki har hop 1/5 ka hai, aur 5 hop milkar 5/5 = 1 banate hain. Screen par 0 se 1 ki rekha 6 barabar gaps mein bati hai. Beech wala nishaan 3/6 hai, yaani 1/2, kyunki 3, 6 ka aadha hai. Rekha par 2/6 aur 5/6 bhi likhe hain: 2/6 beech se pehle, 5/6 beech ke baad. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"2/6 | 3/6 = | 1/2 | 5/6","numbers":"0 1 2/6 3/6 1/2 5/6"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":5,"label":"5/5 = 1"}],"hop":{"num":5}}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 · board up · ready 4457 ms · guard ask]: Isi rekha par 4/6 kahaan aayega: beech se pehle ya beech ke baad?
  > card: Isi rekha par 4/6 kahaan aayega: beech se pehle ya beech ke baad?
  > screen: board fraction-line@1 {"labels":"2/6 | 3/6 = | 1/2 | 5/6","numbers":"0 1 2/6 3/6 1/2 5/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** beech ke baad  _(correct)_

**Asha** [probe · beat s2:explain:e3 · board up · ready 2895 ms]: Haan, sahi hai, kyunki beech 3/6 hai, aur 4/6 mein 4 gaps hain, 3 se zyada, toh 4/6 beech ke baad hai. 4/6 beech ke baad aayega. Ab tumne kaise jaana ki 4/6 beech ke baad hoga?
  > screen: board fraction-line@1 {"labels":"3/6 | 4/6","numbers":"0 1 3/6 4/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":3,"label":"3/6"},{"num":4,"label":"4/6"}]}}

**child:** jaise aapne samjhaya tha, waise hi kiya  _(incorrect)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 5921 ms · guard affirms,invented]: Theek hai. Ek sankhya rekha 0 se 1 tak hai. Is rekha par 2/5 kahaan aayega, woh nishaan dhoondo. Diya hai: rekha 0 se 1 tak, bhinn 2/5 hai: neeche 5, upar 2. Dhoondhna hai: 2/5 wala nishaan. Chalo, aage dekhte hain.
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2839 ms]: Pehla kadam dekho. Neeche ka 5 dekho aur 0 se 1 ko 5 barabar gaps mein baanto: 5 barabar hisse, beech mein 4 nishaan, kyunki neeche ka number batata hai ki poora kitne barabar gaps mein bata hai. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 5171 ms · guard quiz]: Ab doosra kadam. Ab ek gap ki value dekho: har hissa 1/5, kyunki 5 barabar gaps milkar 1 poora banate hain. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t01-s2:ask:worked · board up · ready 2624 ms · guard screenmismatch]: Ab upar ka number dekho aur 0 se utne gap aage chalo. 0 ke baad kaunse mark par rukoge?
  > card: Ab upar ka number dekho aur 0 se utne gap aage chalo. 0 ke baad kaunse mark par rukoge?
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** the 1st mark  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c5-maths-ch02-t01-s2:ask:worked (1 miss) · board up · ready 6152 ms · guard leak,uncorrected]: the 1st nishaan sahi nahi hai. 2/5 mein upar 2 hai. 0 se ek-ek gap karke utne gap aage chalo. Ab upar ka number dekho aur 0 se utne gap aage chalo. 0 ke baad kaunse mark par rukoge?
  > card: Ab upar ka number dekho aur 0 se utne gap aage chalo. 0 ke baad kaunse mark par rukoge?
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 6049 ms · guard nochoice]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board fraction-line@1 {"labels":"2/5","numbers":"0 1 2/5"} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

## Agent


