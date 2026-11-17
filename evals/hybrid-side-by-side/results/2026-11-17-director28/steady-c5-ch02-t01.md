# steady-c5-ch02-t01 · c5-maths-ch02-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 3120 ms]: Cricket ki pitch socho. Ek stump 0 par, doosra 1 par. Batsman run lene bhaaga aur theek beech mein ruk gaya. Woh pitch ki ek pakki jagah par khada hai, toh us jagah ka bhi ek number hai. Ab tak samajh aaya?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t01-s1:ask:e1 · board up · ready 1030 ms]: Theek hai, ise aur aasaan tareeke se bolti hoon. Yeh rahi 0 se 1 tak ki line. Theek beech mein ek mark hai, toh line ke 2 barabar gaps ban gaye. Is mark ka naam hai 1/2. Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > card: Batao, 1/3 isi 0 se 1 wali line par aata hai, ya 3 ke paas?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}}

**child:** 0 and 1  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1031 ms · guard mustsay]: Haan, sahi hai: neeche wala number 3 matlab 0 se 1 ke 3 barabar gaps, aur pehla gap isi line par khatam hota hai. Wahi 0 se 1 ki line, par ab line ke upar 6 marks hain. Marks mat gino, gaps gino: 7 barabar gaps. Toh 0 ke baad pehla mark hai 1/7. Line ke upar 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[2,3],"from":0,"to":1,"marks":[[1,2],[1,3]]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e2 · board up · ready 2067 ms]: 0 se chalo: har mark se pehle ek gap aata hai, toh 6 marks ke 6 gaps, aur aakhri mark ke baad 1 tak ek gap aur. Isliye 6 marks ke saath 7 gaps hain, aur 0 ke baad wala pehla mark 1/7 hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t01-s1:ask:e2 · board up · ready 1977 ms]: Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > card: Ab line ke neeche dekho: wahan 7 marks hain, ek-doosre se ek jitni door. Line ke neeche kitne barabar gaps bane hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1,"marks":[[1,7]]}}

**child:** eight  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1070 ms · guard long]: Bilkul sahi, kyunki beech ke marks se gaps hamesha ek zyada, toh 7 marks ke 8 gaps. Ab wahi 0 se 1, par line par 8 barabar gaps hain. Pehle 7 gaps the, ab zyada hain, toh har gap pehle se chhota hai. Pehla mark 1/8 hai, 0 se theek ek gap door. Is line par kitne barabar gaps hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,8],"from":0,"to":1}}

**child:** 8 gap  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t01-s1:ask:e3 · board up · ready 989 ms]: Haan, bilkul theek. Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > card: Line ke neeche wahi 0 se 1, 10 barabar gaps mein kata hai. 0 ke zyada paas kaun rukega: 1/8 ya 1/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}}

**child:** 1/10 hai na  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 2645 ms · guard screen]: Haan, sahi hai: 10 gaps wala har gap 8 gaps wale se chhota hai, isliye 1/10 pehle ruk jaata hai, 0 ke paas. Agla sawaal line par saath mein karein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8],[1,10]]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 1955 ms]: Dhyan pehle gap par rakho: pehli patti aath barabar gaps mein hai aur uska pehla gap rangin hai, doosri utni hi lambi patti das barabar gaps mein. Dono pattiyon ka baayan kinaara line ka 0 hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,10],"from":0,"to":1,"marks":[[1,8]]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2970 ms · guard quiz]: Aao, agla sawaal hum dono mil ke hal karenge. Ghar 0 par hai aur school 1 kilometre par. Beech raaste mein 3 bijli ke khambe barabar doori par hain. Dekhte hain, pehla khamba ghar se kitne kilometre door hai. Ek line kheencho, ghar 0 par aur school 1 par: 0 se 1 tak ki line, kyunki poora raasta hi humara ek poora hai. 3 khambon se ghar se school tak kitne gaps bane?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** four  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t01-s1:ask:worked · board up · ready 1964 ms · guard affirms]: Haan, 4 gaps, kyunki gaps hamesha beech ke khambon se ek zyada hote hain. Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se bas ek gap door hai. Woh kitne kilometre par hai?
  > card: Raasta 4 barabar gaps mein bata hai, aur pehla khamba ghar se bas ek gap door hai. Woh kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** 1/4 km  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 · board up · ready 1188 ms]: Bilkul sahi: 4 barabar gaps mein har gap 1/4 kilometre ka hai, aur pehla khamba 0 se theek ek gap par khada hai. Toh poora jawab: pehla khamba ghar se 1/4 kilometre door hai. 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** 1/10  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-count-marks · board up · ready 994 ms · guard uncorrected]: 1/10 sahi nahi hai. Ise ek alag tareeke se dekhte hain. Darzi ka ribbon socho, 0 se 1 metre. Line par 6 chalk ke marks hain, aur ribbon ke 7 barabar gap. Pehla mark pehle gap ke end par hai, yaani 1/7 metre. Naam gap ginkar milta hai, marks ginkar nahi. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"mark":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 2494 ms]: Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain?
  > card: Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7]]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-count-marks · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-count-marks · board up · ready 1714 ms]: Haan, pehle tum try karo.
  > card: Ab line ke neeche dekho: wahi ribbon 12 barabar gaps mein bata hai. Line ke neeche kitne chalk ke marks hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 11  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t01-s1:c1 (1 miss) · board up · ready 1068 ms]: Haan, sahi hai, kyunki 1/12 metre matlab ribbon ke 12 barabar gap, aur 12 gap ke beech 11 marks hote hain. Ab us sawaal par lautte hain jo humne pehle chhoda tha. 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > card: 0 se 1 ki is line ko 10 marks ne barabar baanta hai. 0 ke baad pehla mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,12],"from":0,"to":1,"marks":[[1,7],[1,12]]}}

**child:** one eleventh  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 1088 ms]: Bilkul sahi: 10 marks se line ke 11 barabar gaps bante hain, aur pehla mark ek gap par hai, yaani 1/11. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":11,"from":0,"to":1,"marks":[{"num":1,"label":"1/11"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t01-s1:c2 · board up · ready 2128 ms]: Haan, ise seedhe, chhote shabdon mein kehti hoon. Number bada hai ya chhota, yeh chhodo. Board par 1/4 aur 1/11 ke pehle gap ki lambai dekho, aur socho kaunsa mark line ke shuru ke zyada paas rukta hai. Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai: yeh sahi hai ya galat?
  > card: Zoya ka kehna hai ki 1/11 line par 1/4 ke baad aata hai, kyunki 11, 4 se bada hai. Zoya sahi hai ya galat?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1}}

**child:** not right  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 · board up · ready 3702 ms · guard deny]: Haan, bilkul theek. Dekho, 11 barabar gaps mein har gap 4 wale gap se chhota hai, isliye 1/11 pehle rukta hai; Zoya galat hai. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,11],"from":0,"to":1,"marks":[[1,4],[1,11]]}}

**child:** koi mark nahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 2080 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Chalo, isko ek aur dhang se samajhte hain. Ghar 0 par, chai ki dukaan 1 kilometre par, aur line ke upar sadak 7 barabar gaps mein bati hai. Ek chaabi wala khilona pehle mark par ruka. Woh sadak ki ek pakki jagah par khada hai, uska number 1/7 kilometre hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"target":[1,9]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s1:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2407 ms]: Cricket ki baat bhi hogi, bas yeh number line wala kaam khatam ho jaaye. Line ke neeche wahi sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?
  > card: Line ke neeche wahi sadak 6 barabar gaps mein hai, aur khilona pehle mark par ruka: woh 0 se kitne kilometre par hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7]]}}

**child:** 1/6 kilometre hai na  _(correct)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 1696 ms]: Haan, sahi hai: line ke neeche sadak 6 barabar gaps mein hai, aur pehla mark 0 se ek gap par, yaani 1/6 kilometre. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2631 ms]: Tumne cricket ki baat chhedi thi: usme tumhe sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t01-s1:c3 (1 miss) · board up · ready 2349 ms · guard long]: Achha, toh tumhe batting sabse achha lagta hai. Theek hai, ab wapas usi sawaal par chalte hain. Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > card: Line 0 se 1 tak 9 barabar gaps mein hai. Kuch log sochte hain ki line par 1/9 ki koi jagah nahi hoti. 1/9 ki jagah 0 ke baad kaunsa mark hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,6],"from":0,"to":1,"marks":[[1,7],[1,6]]}}

**child:** pehle mark par  _(correct)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3136 ms · guard mustsay]: Bilkul sahi: 1/9 matlab 0 se ek gap, yaani pehla mark. Ab 0 se ek se zyada gap chalenge, aur fraction ka upar wala number batayega kitne. Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye. 2/3 ek hi jagah hai, ek hi number. 2/3 tak pahunchne ke liye 0 se kitne gap chale?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":1,"label":"1/9"}]}}

**child:** 2 hai na  _(correct)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t01-s2:ask:e1 · board up · ready 2017 ms]: Haan, bilkul theek. Line ke neeche 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > card: Line ke neeche 8 barabar gaps hain. 0 se 5 gap chalo. Kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}}

**child:** five eighths  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2439 ms · guard mustsay,leak]: Haan, sahi hai, kyunki har gap 1/8 ka, aur aise 5 gap mile toh 5/8. Line 3 barabar gaps mein bati hai. 0 se teen gap chalo toh theek 1 aata hai, isliye wahan 3/3 = 1. Teeno gap milkar 0 se 1 tak ki poori line bhar dete hain. 3/3 line par kis number par aata hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,8],"from":0,"to":1,"marks":[[2,3],[5,8]]}}

**child:** on 1  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t01-s2:ask:e2 · board up · ready 1542 ms]: Sahi jawab. 1/5 wale gaps dekho. 0 se theek 1 tak pahunchne ke liye aise kitne gap chalne honge?
  > card: 1/5 wale gaps dekho. 0 se theek 1 tak pahunchne ke liye aise kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":3,"label":"3/3 = 1"}],"hop":{"num":3}}}

**child:** 5 gaps  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 1083 ms · guard mustsay]: Haan, sahi hai: 1/5 ke 5 gap milkar 5/5 banate hain, aur 5/5 = 1. Ab line ke 6 barabar gaps hain. Theek beech ka mark 3/6 hai, aur 3, 6 ka aadha hai, toh 3/6 = 1/2. 2/6 beech se pehle aata hai, 5/6 beech ke baad. Beech wala mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,5],"from":0,"to":1,"marks":[[3,3],[5,5]]}}

**child:** ek bata do  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t01-s2:ask:e3 · board up · ready 2374 ms]: Bilkul sahi. Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > card: Isi line par 4/6 kahaan aayega: beech se pehle, ya beech ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}}

**child:** after the middle hai na  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2183 ms]: Haan, bilkul theek, kyunki beech 3/6 par hai, aur upar wala number 4 usse ek zyada hai, toh ek gap aage, beech ke baad. Chalo, ab ek sawaal saath mein line par karte hain. Ek number line 0 se 1 tak hai. Is par 2/5 ka mark milkar dhoondhte hain. 5 barabar gaps ke liye beech mein kitne marks lagenge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":3,"label":"3/6"},{"num":4,"label":"4/6"}]}}

**child:** 4 marks  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t01-s2:ask:worked · board up · ready 1993 ms · guard long]: Haan, 4 marks, kyunki marks hamesha gaps se ek kam hote hain. Ab dekho ek gap kitne ka hai: har gap 1/5 ka hai, kyunki 5 barabar gaps milke 1 poora banate hain. 2/5 ka upar wala number dekho: woh batata hai 0 se kitne gap chalna hai. Utne gap chalkar 0 ke baad kaunse mark par rukoge?
  > card: 2/5 ka upar wala number dekho: woh batata hai 0 se kitne gap chalna hai. Utne gap chalkar 0 ke baad kaunse mark par rukoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"target":[2,5]}}

**child:** second mark  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t01-s2:c1 · board up · ready 1917 ms]: Sahi jawab. Dekho, upar wala number 2 kehta hai 0 se 1/5 ke 2 gap chalo. Toh poora jawab: 2/5, 0 ke baad doosra mark hai. Is line par 5 marks lage hain, aur saare gaps ek jitne hain. 0 ke baad chautha mark kaunsa fraction hai?
  > card: Is line par 5 marks lage hain, aur saare gaps ek jitne hain. 0 ke baad chautha mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":2,"label":"2/5"}],"hop":{"num":2}}}

**child:** 4/6  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t01-s2:c2 · board up · ready 989 ms]: Haan, sahi hai: 5 marks se 6 barabar gaps bante hain, aur chautha mark 4 gaps par hai, yaani 4/6. Line ke upar wale gap 1/5 ke hain, line ke neeche wale 1/10 ke. 0 se chalte hue pehle kaun aata hai: 3/5 ya 3/10?
  > card: Line ke upar wale gap 1/5 ke hain, line ke neeche wale 1/10 ke. 0 se chalte hue pehle kaun aata hai: 3/5 ya 3/10?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":4,"label":"4/6"}]}}

**child:** 3/10  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t01-s2:c3 · board up · ready 4931 ms · guard long]: Bilkul sahi, kyunki 1/10 ka gap 1/5 ke gap ka aadha hai, toh 3 chhote gap 3/10 tak hi jaate hain, 3/5 se pehle. Zoya ka kehna hai ki 3/4 do number hain, 3 aur 4. 0 se 1 ki line par 3/4 dikhane ke liye kitne mark lagaoge: ek ya do?
  > card: Zoya ka kehna hai ki 3/4 do number hain, 3 aur 4. 0 se 1 ki line par 3/4 dikhane ke liye kitne mark lagaoge: ek ya do?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,10],"from":0,"to":1,"marks":[[3,5],[3,10]]}}

**child:** two marks  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t01-m-not-numbers · board up · ready 2139 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Achha, ise ek baar aise sochte hain. Line par har mark sadak ka ek patthar hai, ek pakki jagah. Ek chaabi wala khilona jis patthar par ruke, wahan uski ek hi jagah hai, toh number bhi ek hi: ek fraction, do alag number nahi. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"target":[3,4]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t01-m-not-numbers · check script:c5-maths-ch02-t01-s2:then:c5-maths-ch02-t01-m-not-numbers · board up · ready 2020 ms]: Har 1/8 kilometre par patthar hai. Khilona teesre patthar par hai: board par us jagah ko ek number mein kaise likhoge?
  > card: Har 1/8 kilometre par patthar hai. Khilona teesre patthar par hai: board par us jagah ko ek number mein kaise likhoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"mark":3}}

**child:** teen bata aath km  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t01-s2:c3 (1 miss) · board up · ready 2360 ms]: Haan, bilkul theek: har patthar 1/8 kilometre aage hai, toh teesra patthar 3/8 kilometre par. Chalo, ab pichhle sawaal par wapas chalte hain. Zoya ka kehna hai ki 3/4 do number hain, 3 aur 4. 0 se 1 ki line par 3/4 dikhane ke liye kitne mark lagaoge: ek ya do?
  > card: Zoya ka kehna hai ki 3/4 do number hain, 3 aur 4. 0 se 1 ki line par 3/4 dikhane ke liye kitne mark lagaoge: ek ya do?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"}],"hop":{"num":3}}}

**child:** one mark  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1043 ms]: Haan, sahi hai, kyunki 3/4 akela ek number hai, toh line par uski sirf ek jagah hai: 0 se 3 gap chalkar, wahi ek mark. Ab fraction 1 ke aage bhi jaayenge: line kabhi 2 tak chalegi, kabhi 3 tak, aur dekhenge ki 1 se bade fraction kahan aate hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":3,"label":"3/4"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t01-s3:ask:e1 · board up · ready 3881 ms · guard mustsay,long]: Yeh rahi 0 se 2 tak ki line. Har poore ke 4 barabar gaps hain, aur 1 wala mark hai 4/4, yaani 4/4 = 1. 1 ke aage bhi gaps usi size mein chalte rehte hain. 1/5 wale gaps ab line ke neeche hain. 0 se 6 gap chalo. 1 se pehle rukoge, ya 1 ke baad?
  > card: 1/5 wale gaps ab line ke neeche hain. 0 se 6 gap chalo. 1 se pehle rukoge, ya 1 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":2,"marks":[{"num":4,"label":"4/4 = 1"}]}}

**child:** before  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t01-m-all-less-than-one · board up · ready 2047 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ise ek alag tareeke se dekhte hain. Line 0 se 2 tak hai, line ke upar har gap 1/8 ka. 8 gap 0 se 1 tak ki saari jagah bhar dete hain, isliye 1 wala mark 8/8 hai. Naunve gap ki jagah andar nahi bachi, toh woh 1 ke aage hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,5],"from":0,"to":2,"marks":[[4,4]]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s3:check:then:c5-maths-ch02-t01-m-all-less-than-one · check script:c5-maths-ch02-t01-s3:then:c5-maths-ch02-t01-m-all-less-than-one · board up · ready 2252 ms]: Line ke neeche har poora 6 barabar gaps mein hai. Ek runner 0 se 7 gap daudta hai. Woh kis fraction par rukta hai?
  > card: Line ke neeche har poora 6 barabar gaps mein hai. Ek runner 0 se 7 gap daudta hai. Woh kis fraction par rukta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,6],"from":0,"to":2,"marks":[[8,8]]}}

**child:** 6/7  _(incorrect)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t01-m-all-less-than-one · check script:c5-maths-ch02-t01-s3:then:c5-maths-ch02-t01-m-all-less-than-one (1 miss) · board up · ready 1170 ms · guard uncorrected]: 6/7 sahi nahi hai. Line ke neeche ek gap poore ka kitna hai, yeh socho, phir dekho runner ne aise kitne gap daude. Har poora 6 barabar gaps mein ho, toh 0 se 7 gap daudkar runner kis fraction par rukta hai?
  > card: Line ke neeche har poora 6 barabar gaps mein hai. Ek runner 0 se 7 gap daudta hai. Woh kis fraction par rukta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,6],"from":0,"to":2,"marks":[[8,8]]}}

**child:** seven sixths  _(correct)_

**Asha** [practice · beat s3:explain:e1 · check script:c5-maths-ch02-t01-s3:ask:e1 (1 miss) · board up · ready 971 ms]: Haan, sahi hai: har gap 1/6 hai, aur runner ne 7 gap daude, toh 7/6. Ab us sawaal par lautte hain jo humne pehle chhoda tha. 1/5 wale gaps ab line ke neeche hain. 0 se 6 gap chalo. 1 se pehle rukoge, ya 1 ke baad?
  > card: 1/5 wale gaps ab line ke neeche hain. 0 se 6 gap chalo. 1 se pehle rukoge, ya 1 ke baad?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,6],"from":0,"to":2,"marks":[[8,8],[7,6]]}}

**child:** baad mein  _(correct)_

**Asha** [explain · beat s3:explain:e2 · board up · ready 1169 ms · guard mustsay]: Bilkul sahi, kyunki 5 gap se 5/5 = 1 aa gaya, toh chhatha gap 1 ke baad, 6/5 par. Line par har gap 1/4 hai. Ab chhe gap aage badho: pehle 4 gap 1 tak, phir do gap aur, aur hum 6/4 par, 1 ke aage. 6/4 ka upar wala number 6, 4 se bada hai, isliye hum 1 ke aage nikal gaye. 6/4 tak pahunchne ke liye 0 se kitne gap chale?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,5],"from":0,"to":2,"marks":[[4,4],[6,5]]}}

**child:** 6 hai na  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c5-maths-ch02-t01-s3:ask:e2 · board up · ready 2087 ms]: Haan, bilkul theek. Line ke neeche har gap 1/2 ka hai. 0 se aise 4 gap chalkar line ke kis number tak pahunchoge?
  > card: Line ke neeche har gap 1/2 ka hai. 0 se aise 4 gap chalkar line ke kis number tak pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":2,"marks":[{"num":6,"label":"6/4"}],"hop":{"num":6}}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s3:explain:e2 · check script:c5-maths-ch02-t01-s3:ask:e2 (1 miss) · board up · ready 2281 ms · guard leak,uncorrected]: 1 nahi, yeh jawab theek nahi baitha. Do aadhe milkar ek poora banate hain. 1/2 wale gaps ko do-do karke gino. 1/2 wale 4 gap 0 se chalkar line ke kis number tak pahunchoge?
  > card: Line ke neeche har gap 1/2 ka hai. 0 se aise 4 gap chalkar line ke kis number tak pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,2],"from":0,"to":2,"marks":[[6,4]]}}

**child:** theek 2 par  _(correct)_

**Asha** [explain · beat s3:explain:e3 · board up · ready 2222 ms · guard mustsay,leak]: Sahi jawab, kyunki 4/2 matlab 1/2 ke 4 gap, aur har 2 gap se ek poora banta hai, toh 4/2 = 2. Yeh line 0 se 3 tak hai, har poore ke 3 barabar gaps. Pehle teen gaps 1 par khatam hote hain, wahan 3/3 = 1. Teen-teen gaps ka ek group, aur har group ek poora. Is line par ek poore mein kitne gap hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,2],"from":0,"to":2,"marks":[[4,2]]}}

**child:** 3  _(correct)_

**Asha** [practice · beat s3:explain:e3 · check script:c5-maths-ch02-t01-s3:ask:e3 · board up · ready 867 ms]: Haan, sahi hai. 7/3 ke 7 gaps ko teen-teen ke group mein rakho. Har group mein theek teen gap hon, toh kitne group bante hain?
  > card: 7/3 ke 7 gaps ko teen-teen ke group mein rakho. Har group mein theek teen gap hon, toh kitne group bante hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":3,"marks":[{"num":3,"label":"3/3 = 1"}]}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s3:explain:e3 · check script:c5-maths-ch02-t01-s3:ask:e3 (1 miss) · board up · ready 3375 ms · guard samecard,uncorrected]: 0 sahi nahi hai. Saat gaps ko teen-teen ke group mein rakhte jao. Jo gap akela bach jaaye, woh group nahi banata. 7/3 ke 7 gaps mein theek teen-teen gaps wale kitne group bante hain?
  > card: 7/3 ke 7 gaps ko teen-teen ke group mein rakho. Har group mein theek teen gap hon, toh kitne group bante hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":3,"marks":[{"num":3,"label":"3/3 = 1"}]}}

**child:** 2 poore group  _(correct)_

**Asha** [repair · beat s3:explain:e3 · board up · ready 1282 ms]: Bilkul sahi: 7/3 ke 7 gaps mein teen-teen gaps ke 2 group bante hain, 6/3 = 2, aur 1 gap bachta hai. Ek-ek kadam karke, agla sawaal milkar dekhein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":3,"marks":[{"num":6,"label":"6/3"},{"num":7,"label":"7/3"}],"hop":{"num":7}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s3:explain:e3 · board up · ready 1954 ms]: 7 laddu teen-teen karke rakho: 3, phir 3, aur 1 bacha; teen wale 2 group, isliye 7/3, 2 ke aage hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":3,"marks":[{"num":6,"label":"6/3"},{"num":7,"label":"7/3"}],"hop":{"num":7}}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step2 · board up · ready 2938 ms]: Ab ek sawaal milkar, ek-ek kadam karke dekhte hain. Ek number line 0 se 2 tak hai. Is par 7/4 ka mark saath mein dhoondhte hain. Har poore ko 4 barabar gaps mein kaato: kul 8 gaps bane, har gap 1/4 ka, kyunki 7/4 ka neeche wala number 4 hai. Har gap 1/4 ka hai. 0 se 4 gap chalkar kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":2,"target":[7,4]}}

**child:** 4/4  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t01-s3:ask:worked · board up · ready 2112 ms · guard long]: Haan, 4/4 par, yaani theek 1, kyunki ek poore mein 4 gap hote hain. Kul 7 gap chalne the, aur 4 gap mein hum 1 tak aa gaye. 1 ke baad aur kitne gap bache?
  > card: Kul 7 gap chalne the, aur 4 gap mein hum 1 tak aa gaye. 1 ke baad aur kitne gap bache?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":2,"target":[7,4]}}

**child:** teen  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t01-s3:c1 · board up · ready 1493 ms]: Haan, sahi hai: 7 = 4 + 3: pehle 4 gap se 1 poora hua, baaki 3 gap 1 ke aage gaye. Toh poora jawab: 7/4, 1 ke baad teesra mark hai, yaani 1 aur 3/4, 2 se bas ek gap pehle. Ek line lo, 0 se 2 tak, har poora 3 barabar gaps mein. 5/3 kaun se do numbers ke beech aata hai: 0 aur 1, ya 1 aur 2?
  > card: Ek line lo, 0 se 2 tak, har poora 3 barabar gaps mein. 5/3 kaun se do numbers ke beech aata hai: 0 aur 1, ya 1 aur 2?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":2,"marks":[{"num":4,"label":"1"}],"hop":{"num":7}}}

**child:** between 0 and 1  _(misconception)_

**Asha** [hint · beat s3:check:c1 · check script:c5-maths-ch02-t01-s3:c1 (1 miss) · board up · ready 2067 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Line par 1 aur 2 ke mark dekho, aur gino ki 0 se har ek tak kitne gap hain. Phir 5/3 ke gap gino. 5/3 kaun se do numbers ke beech aata hai: 0 aur 1, ya 1 aur 2?
  > card: Ek line lo, 0 se 2 tak, har poora 3 barabar gaps mein. 5/3 kaun se do numbers ke beech aata hai: 0 aur 1, ya 1 aur 2?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":2,"target":[5,3]}}

**child:** between 1 and 2  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t01-s3:c2 · board up · ready 1282 ms]: Bilkul sahi, kyunki 3/3 = 1 aur 6/3 = 2, aur 5/3 dono ke beech hai. Line 0 se 2 tak. 1/6 ke 11 gap chalo, ya 1/12 ke 11 gap. 0 se zyada door kaun gaya: 11/6 ya 11/12?
  > card: Line 0 se 2 tak. 1/6 ke 11 gap chalo, ya 1/12 ke 11 gap. 0 se zyada door kaun gaya: 11/6 ya 11/12?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":2,"marks":[{"num":5,"label":"5/3"}]}}

**child:** 1 5/6  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t01-s3:c3 · board up · ready 1414 ms]: Haan, bilkul theek: 1/6 ka gap 1/12 ke gap se do guna hai, toh 11 lambe gap 11/6 tak, 11/12 se kaafi aage. Is line par 0, 1, 2 aur 3 likhe hain, aur har do poore numbers ke beech 5 barabar gaps hain. 2 ke baad doosra mark kaunsa fraction hai?
  > card: Is line par 0, 1, 2 aur 3 likhe hain, aur har do poore numbers ke beech 5 barabar gaps hain. 2 ke baad doosra mark kaunsa fraction hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,12],"from":0,"to":2,"marks":[[11,6],[11,12]]}}

**child:** 2 aur 2/5  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 2 ms]: Sahi jawab, kyunki 2 tak 10 gaps, aur 2 gap aage: 12/5. Aaj jo kuch seekha, us sab par ek aakhri sawaal aa raha hai. Ek line 0 se 2 tak hai. 0 aur 1 ke beech 6 marks hain, aur 1 aur 2 ke beech bhi 6, sab barabar doori par. 0 se 9 gap chalo toh kis fraction par pahunchoge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":3,"marks":[{"num":12,"label":"12/5"}]}}

**child:** 9/7  _(correct)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1316 ms]: Haan, sahi hai, kyunki 6 marks se har poore ke 7 barabar gaps bante hain, toh har gap 1/7; 0 se 9 gap chalkar 9/7 aata hai, jo 1 ke aage hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":2,"marks":[{"num":9}],"hop":{"num":9}}}

**child:** jaise aapne samjhaya tha, waise hi kiya  _(no_evidence)_

**Asha** [wrap · ready 1334 ms]: Aaj humne milkar kaafi kuch dekha. Aaj dekha ki har fraction ki line par ek pakki jagah hoti hai, aur uska naam gaps ginkar milta hai. Phir upar wala number aaya, jo batata hai 0 se kitne gap chalna hai; dono milkar ek jagah batate hain. Aakhir mein dekha: upar wala number neeche wale se bada ho, toh fraction 1 ke aage aata hai. Aaj ki padhai mein kuch aisa tha jo achha laga?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 936 ms]: Kuch baatein aasaan thi, kuch mein mehnat lagi. Aaj ek kaam tumne khud karke dikhaya: 0 se gaps ginkar 2 ke baad doosre mark ka naam rakha. Aaj ke liye itna hi, phir milenge.

## Agent


