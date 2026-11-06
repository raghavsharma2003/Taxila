# offtopic-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions compare karenge—jaise cake ke pieces. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2195 ms]: Socho, do ek jaise cake hain. Ek cake 4 barabar tukdon mein kata hai, doosra 8 barabar tukdon mein. Tumhe kisi ek cake se sirf ek tukda lena hai. Theek—ab cake ka sawaal: 4 pieces wale cake ka ek tukda, ya 8 pieces wale ka ek tukda—kaunsa bada hoga? Sochkar batao.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [reteach · ready 1942 ms]: 4 pieces wale cake ka ek tukda bada hoga, kyunki same cake ko kam parts mein kaata hai. Ab 2/5 aur 2/3 mein kaunsa bada hai?

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3962 ms · guard content_filter_rewrite]: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2735 ms · guard leak,long,uncorrected]: bigger sahi nahi hai. Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain. Toh 8 bada number hai, par 1/8 chhota hissa hai. Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 2"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 2085 ms · guard twoq,uncorrected]: Zoya sahi nahi hai. Riya, dono bottles same hain. Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {"labels":"1/7 | 1/9","numbers":"0 1 1/7 1/9"} · ref {"template":"fraction-line@1","params":{"dens":[7,9],"from":0,"to":1,"marks":[[1,7],[1,9]]}}

**child:** Ravi  _(correct)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1361 ms]: Haan, sahi hai. Aur pehle wale sawaal ka jawab chhota tha, kyunki wahi patti 8 hisson mein bate toh har hissa 4 hisson wale hisse ka aadha hota hai. Ab aage chalein?
  > screen: board fraction-line@1 {"labels":"1/7 | 1/9","numbers":"0 1 1/7 1/9"} · ref {"template":"fraction-line@1","params":{"dens":[7,9],"from":0,"to":1,"marks":[[1,7],[1,9]]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3355 ms · guard mustsay,leak]: Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** ek chauthai  _(correct)_

**Asha** [probe · beat s1:explain:e2 · board up · ready 969 ms]: Sahi, Riya. Tumne kaise jaana ki 1/4, 1/8 se bada hai?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** shayad gin ke  _(incorrect)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2503 ms]: Theek, yeh tumhari soch thi. Ek hi poore ke zyada hisse. Yeh sankhya rekha 0 se 1 tak hai, aur is par 2 nishaan hain. 1/8 zero ke paas hai, aur 1/4 usse aage. Toh 1/8 < 1/4. Ek hi poore ke jitne zyada barabar hisse, har hissa utna chhota. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1859 ms]: Cricket mein distance naapte hain; fractions mein bhi sankhya rekha par distance dekhte hain. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** 1/7  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 1094 ms · guard uncorrected]: 1/7 sahi nahi hai. Sankhya rekha par dekhkar ek baar try karo. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 3007 ms · guard mustsay,leak]: Sankhya rekha par 1/8 < 1/4 dikhta hai: zyada parts mein har tukda chhota hota hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 1790 ms]: Riya, ek 0 se 1 tak seedhi line banao. 0 ko left aur 1 ko right likho; beech mein barabar doori ke nishaan lagao. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** 1/3 wala  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1156 ms · guard invented]: Haan, sahi hai. Diya hai: do ek jaise chocolate bar, Rahul ka hissa: 1/6, Sana ka hissa: 1/3. Dhoondhna hai: kise bada tukda milta hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2433 ms]: Iska shuruaati hissa dekhte hain. Dono bhinnon ka upar ka number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai ki kitne tukde mile, toh ab sirf tukde ka size dekhna hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · ready 1813 ms]: Hindi mein? Zaroor. Riya, upar ka 1 batata hai ek hissa. Neeche ka 6 ya 3 batata hai kul barabar hisse. Kam kul hisse, bada hissa. 1/3 ya 1/6—kaunsa bada?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2587 ms]: Pehla kadam dekho. Dekho, upar ka number batata hai ki kitne tukde mile, toh ab sirf tukde ka size dekhna hai. Isliye dono bhinnon ka upar ka number dekho: dono mein 1, yaani dono ko ek-ek tukda. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 4039 ms]: Theek, dono ko ek-ek tukda mila. Ab dono ke tukde ka size likho: Rahul ka tukda 1/6, Sana ka tukda 1/3, kyunki rahul ka bar 6 barabar hisson mein kata hai aur Sana ka sirf 3 barabar hisson mein. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2355 ms]: Pehle yeh hissa. Dekho, rahul ka bar 6 barabar hisson mein kata hai aur Sana ka sirf 3 barabar hisson mein. Isliye ab dono ke tukde ka size likho: Rahul ka tukda 1/6, Sana ka tukda 1/3. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2151 ms]: Riya, ek hi size ke bar mein 3 tukde karoge toh har tukda, 6 tukdon wale tukde se bada hoga. Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2846 ms · guard praise,affirms]: Dono ek jaise poore hain. Apna jawab do. Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** Sana  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 2107 ms · guard nowhy,flat]: Haan, sahi hai. Sana sahi. Tumne kaise jaana ki 1/3 ka tukda 1/6 se bada hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** jaise aapne samjhaya tha, waise hi kiya  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 3808 ms · guard affirms]: Toh poora jawab: Sana ko bada tukda mila, 1/3 wala, kyunki ek hi size ke bar ke jitne zyada hisse, har hissa utna chhota, isliye 6 bada number hote hue bhi 1/6 chhota tukda hai. Chalo, aage badhein?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2441 ms]: Ab ek naya bhinn dekhenge. Pehle poora aur barabar hisson ka dhyaan rakhenge. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | 5 tukdon mein | ek jais","numbers":"10 5"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 1058 ms · guard uncorrected]: 1/10 sahi nahi hai. Riya, dono roti barabar hain. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | 5 tukdon mein | ek jais","numbers":"10 5"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (2 miss) · board up · ready 924 ms · guard uncorrected]: 1/10 sahi nahi hai. Apna jawab do. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | 5 tukdon mein | ek jais","numbers":"10 5"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** 5 wali roti ka tukda  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2980 ms]: Haan, sahi hai. 5 tukdon wali roti ka ek tukda bada hota hai, yani 1/5. Ab yeh karo: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** kis cheez ka jawab dun?  _(no_evidence)_

**Asha** [repair · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3303 ms · guard samecard]: Riya, in teenon mein sabse chhota hissa pehle aur sabse bada aakhir mein likho: 1/3, 1/12, 1/6. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3148 ms · guard samecard]: In teenon bhinnon ko chhote hisse se bade hisse tak kram mein rakho: 1/3, 1/12, 1/6. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3355 ms · guard samecard]: In bhinn ko size ke hisaab se sabse chhote se sabse bade tak lagao: 1/3, 1/12, 1/6. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2993 ms · guard samecard]: Riya, ek poore ke in teen hisson ko chhote se bade kram mein sajana hai: 1/3, 1/12, 1/6. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** kya poochha, phir se bolo na  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3871 ms · guard samecard]: Tum kram likho. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3304 ms · guard wrap,wrap]: Theek hai Riya, tum keh rahi ho rukna hai. Chuno: aage badhein, thodi der rukhein, ya aaj ke liye band karein?
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

## Agent


