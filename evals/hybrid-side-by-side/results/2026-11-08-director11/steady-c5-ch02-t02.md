# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Hi Riya, main Asha, tumhari AI teacher. Aaj hum fractions compare karenge, bilkul cooking mein kaunsa piece bada hai. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 3091 ms]: Socho, do ek jaise cake hain. Ek cake 4 barabar tukdon mein kata hai, doosra 8 barabar tukdon mein. Tumhe kisi ek cake se sirf ek tukda lena hai. Achha—ab cake socho: ek 4 tukdon mein, doosra 8 mein. Sirf ek tukda lena ho, kaunsa bada hoga?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 4342 ms · guard mustsay,leak]: Yeh ek poori patti hai. Iske 4 barabar hisse hain, aur ek hissa rang wala hai, woh 1/4 hai. Neeche wala 4 batata hai ki poori patti kitne barabar hisson mein kati hai. Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** chhota hoga  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1222 ms]: Sahi—ab apna reason batao: 8 parts karne par har part chhota kyun hota hai, kyunki wahi patti 8 hisson mein bate toh har hissa chhota hota hai, 1/8 wala hissa 1/4 wale hisse ka aadha hai.
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** maine dono ko mila ke dekha  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 5563 ms · guard mustsay,leak]: Achha, ab samajh aaya tumne kaise socha. Dono ko saath rakhna bilkul sahi tareeka hai. Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 4990 ms · guard mustsay,samecard]: Wahi patti ab 8 barabar hisson mein hai, aur ek rang wala hissa 1/8 hai. Pehle ka har hissa ab do tukdon mein bant gaya. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 4384 ms · guard samecard,twoq]: Wahi patti ab 8 barabar hisson mein hai, aur ek rang wala hissa 1/8 hai. Pehle ka har hissa ab do tukdon mein bant gaya. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/8  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2939 ms · guard long,uncorrected]: 1/8 sahi nahi hai. Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain. Toh 8 bada number hai, par 1/8 chhota hissa hai. Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 2"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** Ravi ne  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2701 ms · guard mustsay,leak]: Haan, sahi hai, kyunki ek jaisi bottle ka 1/7 hissa 1/9 hisse se bada hai, isliye Ravi ne zyada nikala. Aur pehle wale sawaal ka jawab 1/4 tha, kyunki ek 1/4 hissa do 1/8 hisson ke barabar hai, isliye 1/4 bada hai. Yeh sankhya rekha 0 se 1 tak hai, aur is par 2 nishaan hain. 1/8 zero ke paas hai, aur 1/4 usse aage. Toh 1/8 < 1/4. Ek hi poore ke jitne zyada barabar hisse, har hissa utna chhota. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1709 ms]: Dekho, yahi 1/8 aur 1/4 ab patti par. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-bars@1 {"wholes":"2 equal bars","bar1":"8 equal parts, 1 shaded = 1/8","bar2":"4 equal parts, 1 shaded = 1/4","labels":"1/8 | 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** 1/3 wala  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1321 ms · guard invented]: Haan, sahi hai, kyunki 1/3 wala hissa 1/7 wale hisse se bada hai, toh 1/3 zero se zyada door rukta hai. Diya hai: do ek jaise chocolate bar, Rahul ka hissa: 1/6, Sana ka hissa: 1/3. Dhoondhna hai: kise bada tukda milta hai. Ab isse aage chalte hain.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2797 ms]: Pehla kadam dekho. Dono bhinnon ka upar ka number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai ki kitne tukde mile, toh ab sirf tukde ka size dekhna hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2863 ms · guard screenmismatch]: Ab doosra kadam. Ab dono ke tukde ka size likho: Rahul ka tukda 1/6, Sana ka tukda 1/3, kyunki rahul ka bar 6 barabar hisson mein kata hai aur Sana ka sirf 3 barabar hisson mein. Chalo, aage dekhte hain.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 4048 ms · guard twoq]: Dono ko ek-ek tukda mila; 3 parts wala tukda 6 parts wale tukde se bada hoga. Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3055 ms · guard praise,affirms]: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** Sana  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1218 ms]: Sana—sahi, kyunki ek hi bar ke jitne zyada hisse, har hissa utna chhota, isliye 6 bada hote hue bhi 1/6 chhota tukda hai. Ab apna reason batao: 1/3 ko 1/6 se bada kyun maana?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pehle wale step se pata chala  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 5044 ms · guard affirms]: Achha, ab samajh aaya tumne kaise socha. Toh poora jawab: Sana ko bada tukda mila, 1/3 wala. Dono roti ek jaisi hain. Jis roti ke kam tukde hain, uska har tukda bada hota hai. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"?"},{"parts":5,"shade":1,"label":"?"}]}}

**child:** maine ek ek karke gina  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2856 ms]: Theek, ab hum ek-ek chhote step se karenge. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"?"},{"parts":5,"shade":1,"label":"?"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 3193 ms · guard samecard,twoq]: Achha, ab Hindi mein baat karte hain. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":1,"label":"?"},{"parts":5,"shade":1,"label":"?"}]}}

**child:** 5 wali roti ka tukda  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3514 ms]: Haan, sahi hai, kyunki 5 tukdon wali roti ka har 1/5 tukda 10 tukdon wali roti ke 1/10 tukde se do guna hai. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board fraction-bars@1 {"labels":"1/3 | 1/12 | 1/6"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3455 ms · guard samecard]: Virat ke cricket shots waale examples mazedaar hain; is baat par baad mein baat karenge. Ab 1/3, 1/12 aur 1/6 ko sabse chhote se sabse bade kram mein likho. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board fraction-bars@1 {"labels":"1/3 | 1/12 | 1/6"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** 1/12, 1/6, 1/3 hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 2684 ms · guard noconfirm]: Haan, sahi hai, kyunki ek hi poore ke 1/12 hisse sabse chhote hote hain, phir 1/6, aur 1/3 sabse bade. Aur Virat ki baat: Virat Kohli India ke liye batting karte hain, aur unka cover drive bahut mashhoor hai. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > card: Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** bigger  _(correct)_

**Asha** [repair · beat s1:check:c3 · board up · ready 1337 ms · guard noconfirm]: Haan, sahi hai, kyunki ringed nishaan 1/4 hai, aur 1/4 do 1/8 ke barabar hai, isliye woh 1/8 se bada hai. Ab tak har baar ek hi tukda tha, jaise 1/4 aur 1/8, toh tukde ka size faisla karta tha. Ab dekhenge ki neeche ka number same ho, jaise 3/7 aur 5/7, tab kaise tulna karte hain. Ab agla hissa.
  > screen: board fraction-bars@1 {"labels":"1/4 | 1/8","numbers":"1/4 1/8"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2731 ms]: Yeh patti 7 barabar hisson mein kati hai, toh har hissa 1/7 hai. Isme 3 hisse rang wale hain, yeh 3/7 hai. Upar wala 3 batata hai ki aise kitne hisse liye gaye. Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > card: Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** 7/5  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 1340 ms · guard uncorrected]: 7/5 sahi nahi hai. Patti ke 7 barabar hisse hain, har hissa 1/7. 3 hisse rang wale hain, toh 3/7, kyunki upar ka 3 rang wale hisse ginta hai. Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > card: Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** paanch bata saat  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 3500 ms · guard mustsay,long]: Haan, sahi hai, kyunki patti ke 7 barabar hisson mein se 5 rang wale hain, yaani 5/7. Wahi patti, wahi 1/7 wale hisse. Ab 5 hisse rang wale hain, yeh 5/7 hai. Yahan bhi hisson ka size same hai, bas rang wale hisse zyada hain. Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > card: Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 5"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":5,"whole":"bar"}}

**child:** galat  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 1333 ms]: Haan, sahi hai, kyunki dono mein hisse 1/7 ke hain, par 5/7 mein 5 hisse hain aur 3/7 mein sirf 3. Tumne yeh kaise jaana ki 5/7, 3/7 se bada hai?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 5"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":5,"whole":"bar"}}

**child:** mujhe laga aisa hi hoga  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 2321 ms · guard mustsay]: Theek hai. Neeche ka number same ho. Yeh sankhya rekha 0 se 1 tak sevenths mein bati hai, aur is par 2 nishaan hain, 3/7 aur 5/7. 5/7 zero se zyada door hai. Jab neeche ka number same ho, toh upar ka number dekho. Jo zero se zyada door, woh bada. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 2654 ms]: Ab hum isi niyam ko ek naye prashn mein lagayenge. Pehle neeche ka number dekho, phir upar ka. Ab sankhya rekha 0 se 1 tak 5 barabar hisson mein bati ho. Zero se zyada door kaunsa hoga, 2/5 ya 4/5?
  > card: Ab sankhya rekha 0 se 1 tak 5 barabar hisson mein bati ho. Zero se zyada door kaunsa hoga, 2/5 ya 4/5?
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** chaar bata paanch  _(correct)_

**Asha** [explain · beat s2:explain:e4 · board up · ready 3570 ms · guard mustsay,leak]: Haan, sahi hai, kyunki dono mein hisse 1/5 ke hain, aur 4/5 mein 4 hisse hain, 2/5 ke 2 hisson se zyada. Baayein taraf neeche ka number same hai, toh same size ke hisse, aur zyada hisse matlab zyada. Daayein taraf neeche ke number alag hain, toh alag size ke hisse, aur sirf hisse ginne se faisla nahi hota. Yahan tak theek hai?
  > screen: board compare@1 {"labels":"neeche ka | number same | neeche ke | nu"} · ref {"template":"compare@1","params":{"left":{"title":"neeche ka number same","items":["same size ke hisse","zyada hisse matlab zyada"]},"right":{"title":"neeche ke number alag","items":["alag size ke hisse","ginne se faisla nahi"]}}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 3090 ms]: Do ek jaise bar hain: ek ka 2/3, doosre ka 3/10. 3/10 mein zyada hisse hain. Kaunsa bada hai, 2/3 ya 3/10?
  > card: Do ek jaise bar hain: ek ka 2/3, doosre ka 3/10. 3/10 mein zyada hisse hain. Kaunsa bada hai, 2/3 ya 3/10?
  > screen: board compare@1 {"labels":"neeche ka | number same | neeche ke | nu"} · ref {"template":"compare@1","params":{"left":{"title":"neeche ka number same","items":["same size ke hisse","zyada hisse matlab zyada"]},"right":{"title":"neeche ke number alag","items":["alag size ke hisse","ginne se faisla nahi"]}}}

**child:** 2/3 hai na  _(correct)_

**Asha** [probe · beat s2:explain:e4 · board up · ready 2141 ms]: Haan, sahi hai, kyunki 2/3 aadhe se zyada hai, par 3/10 aadhe yaani 5/10 se bhi kam hai.
  > screen: board compare@1 {"labels":"neeche ka | number same | neeche ke | nu"} · ref {"template":"compare@1","params":{"left":{"title":"neeche ka number same","items":["same size ke hisse","zyada hisse matlab zyada"]},"right":{"title":"neeche ke number alag","items":["alag size ke hisse","ginne se faisla nahi"]}}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 2598 ms]: Theek hai. Haan, woh ho gaya. Diya hai: do ek jaise cake, Meena ka hissa: 5/8, Raju ka hissa: 3/8. Dhoondhna hai: kisne kam cake khaya. Ab agla kadam dekhte hain.
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 4895 ms · guard leak]: Pehla kadam dekho. Dono bhinnon ka neeche ka number dekho: dono mein 8, toh har tukda 1/8, kyunki dono cake ek jaise hain aur dono 8 barabar tukdon mein bante hain. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 4056 ms · guard affirms]: Ab doosra kadam. Ab upar ka number dekho: Meena ke 1/8 wale 5 tukde, Raju ke 3 tukde, kyunki upar ka number batata hai ki kitne tukde khaye. Ab isse aage chalte hain.
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked · board up · ready 2701 ms]: Sab tukde ek jaise hain. Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Sab tukde ek jaise hain. Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** Raju ne  _(correct)_

**Asha** [practice · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 · board up · ready 1604 ms]: Haan, sahi hai, kyunki tukde same size ke hain aur Raju ke tukde kam hain, isliye sankhya rekha par bhi 3/8, 5/8 se pehle aata hai. Toh poora jawab: Raju ne kam cake khaya, sirf 3/8. Meena ne ek cake ka 2/6 khaya aur uske bhai ne usi cake ka 4/6. Zyada kisne khaya: Meena ne ya uske bhai ne, ya dono ne barabar?
  > card: Meena ne ek cake ka 2/6 khaya aur uske bhai ne usi cake ka 4/6. Zyada kisne khaya: Meena ne ya uske bhai ne, ya dono ne barabar?
  > screen: board compare@1 {"labels":"Meena | uske bhai | 2/6 | 4/6","numbers":"2/6 4/6"} · ref {"template":"compare@1","params":{"left":{"title":"Meena","items":["2/6"]},"right":{"title":"uske bhai","items":["4/6"]}}}

**child:** bhai ne  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 · board up · ready 5048 ms · guard long,noconfirm]: Haan, sahi hai, kyunki dono ke tukde 1/6 ke hain, aur bhai ka 4/6 Meena ke 2/6 se zyada hai. Do ek jaise cake hain. Ben ka cake 4 barabar tukdon mein kata hai aur Ben ne 2 tukde liye. Zoya ka cake 12 barabar tukdon mein kata hai aur Zoya ne 3 tukde liye. Zoya ka kehna hai ki zyada cake uske paas hai, kyunki 3 tukde 2 se zyada hain. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Do ek jaise cake hain. Ben ka cake 4 barabar tukdon mein kata hai aur Ben ne 2 tukde liye. Zoya ka cake 12 barabar tukdon mein kata hai aur Zoya ne 3 tukde liye. Zoya ka kehna hai ki zyada cake uske paas hai, kyunki 3 tukde 2 se zyada hain. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board compare@1 {"labels":"4 barabar | tukdon | 12 barabar","numbers":"4 12 2 3"} · ref {"template":"compare@1","params":{"left":{"title":"4 barabar tukdon","items":["2 tukde liye"]},"right":{"title":"12 barabar tukdon","items":["3 tukde liye"]}}}

**child:** Ben ke paas  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 · board up · ready 3688 ms · guard leak]: Haan, sahi hai, kyunki ben ka 2/4 aadha cake hai, par 3/12 sirf 1/4 cake hai, isliye Ben ke paas zyada hai. Do ek jaise cake hain: ek ke 4 barabar tukdon mein se 3, doosre ke 6 barabar tukdon mein se 5. Dono mein poore cake se ek tukda kam hai. Kaunsa bada hai, 3/4 ya 5/6?
  > card: Do ek jaise cake hain: ek ke 4 barabar tukdon mein se 3, doosre ke 6 barabar tukdon mein se 5. Dono mein poore cake se ek tukda kam hai. Kaunsa bada hai, 3/4 ya 5/6?
  > screen: board compare@1 {"labels":"4 barabar | tukdon | 6 barabar","numbers":"4 6 3 5"} · ref {"template":"compare@1","params":{"left":{"title":"4 barabar tukdon","items":["3 tukdon","ek tukda kam"]},"right":{"title":"6 barabar tukdon","items":["5 tukdon","ek tukda kam"]}}}

**child:** 5/6 bada hai  _(correct)_

**Asha** [repair · beat s2:check:c2 · board up · ready 1567 ms]: Haan, sahi hai, kyunki 5/6 mein 1/6 kam hai aur 3/4 mein 1/4 kam, aur 1/6 ka gap 1/4 ke gap se chhota hai. Jab neeche ka number same tha, jaise 3/7 aur 5/7, tab upar wala number dekha. Ab ulta dekhenge, jab upar ka number same ho, jaise 3/5 aur 3/8. Chalo, ab aage.
  > screen: board fraction-line@1 {"labels":"3/4 | 5/6","numbers":"0 1 3/4 5/6"} · ref {"template":"fraction-line@1","params":{"dens":[4,6],"from":0,"to":1,"marks":[[3,4],[5,6]]}}

**child:** theek hai  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 · board up · ready 2793 ms]: Yeh patti 5 barabar hisson mein kati hai, toh har hissa 1/5 hai. Isme 3 hisse rang wale hain, yeh 3/5 hai. Ab isi size ki ek patti ko 8 barabar hisson mein kaatkar 3 hisse rango. Woh kaunsa bhinn hoga?
  > card: Ab isi size ki ek patti ko 8 barabar hisson mein kaatkar 3 hisse rango. Woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"5 equal parts","numbers":"5 3"} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3337 ms]: Theek hai Riya, tum aaj yahin rokna chahti ho—main samajh gayi. Teen vikalp hain: aage badhein, thodi der rukhein, ya aaj ke liye khatam karein. Tum kya chunogi?
  > screen: board fraction-parts@1 {"labels":"5 equal parts","numbers":"5 3"} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

## Agent


