# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions compare karenge, jaise cooking mein kaunsa hissa zyada. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2167 ms]: Socho, do ek jaise cake hain. Ek cake 4 barabar tukdon mein kata hai, doosra 8 barabar tukdon mein. Tumhe kisi ek cake se sirf ek tukda lena hai. Achha, Riya—ab do same-size cakes socho: ek 4 tukdon mein, doosra 8 mein. Sirf ek tukda logi, toh kaunsa cake choose karogi, aur kyun?

**child:** shayad gin ke  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2056 ms · guard mustsay]: Yeh ek poori patti hai. Iske 4 barabar hisse hain, aur ek hissa rang wala hai, woh 1/4 hai. Neeche wala 4 batata hai ki poori patti kitne barabar hisson mein kati hai. Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** chhota hoga  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 746 ms]: Haan, sahi hai. Ab batao, tumne kaise jaana ki 8 tukdon wala ek hissa chhota hoga?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** maine dono ko mila ke dekha  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3452 ms · guard leak]: Achha, ab samajh aaya tumne kaise socha. Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3203 ms · guard mustsay,samecard]: Riya, 1/4 wala tukda 1/8 ke do tukdon jitna hai. 1/8 mein 8 barabar hisse hote hain. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3089 ms · guard samecard,twoq]: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/8  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2156 ms · guard leak,long,uncorrected]: 1/8 sahi nahi hai. Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain. Toh 8 bada number hai, par 1/8 chhota hissa hai. Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 2"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** Ravi ne  _(correct)_

**Asha** [repair · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 901 ms]: Riya, bilkul sahi—7 chhote parts se ek part, 9 parts se ek part se bada hota hai. Aur pehle wale sawaal ka jawab 1/4 tha, kyunki ek 1/4 hissa do 1/8 hisson ke barabar hai. Chalo, aage badhein?
  > screen: board fraction-line@1 {"labels":"1/7 | 1/9","numbers":"0 1 1/7 1/9"} · ref {"template":"fraction-line@1","params":{"dens":[7,9],"from":0,"to":1,"marks":[[1,7],[1,9]]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1925 ms · guard mustsay]: Yeh sankhya rekha 0 se 1 tak hai, aur is par 2 nishaan hain. 1/8 zero ke paas hai, aur 1/4 usse aage. Toh 1/8 < 1/4. Ek hi poore ke jitne zyada barabar hisse, har hissa utna chhota. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 3140 ms]: Ab isi sankhya rekha par 1/3 aur 1/7 ko compare karo. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** 1/3 hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2775 ms · guard invented]: Haan, sahi hai. Diya hai: do ek jaise chocolate bar, Rahul ka hissa: 1/6, Sana ka hissa: 1/3. Dhoondhna hai: kise bada tukda milta hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2720 ms]: Iska shuruaati hissa dekhte hain. Dono bhinnon ka upar ka number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai ki kitne tukde mile, toh ab sirf tukde ka size dekhna hai. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2078 ms · guard screenmismatch]: Haan, tumhari baat theek hai: dono mein ek-ek tukda mila. Ab dono ke tukde ka size likho: Rahul ka tukda 1/6, Sana ka tukda 1/3, kyunki rahul ka bar 6 barabar hisson mein kata hai aur Sana ka sirf 3 barabar hisson mein. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2889 ms · guard long]: Riya, 3 parts wala tukda 6 parts wale se bada hota hai. Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3120 ms · guard praise,affirms]: Theek hai, chalo isi sawaal par wapas aate hain. Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** Sana ka  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 2253 ms · guard nowhy,flat]: Haan, sahi hai. Sana ka—sahi. Tumne kaise jaana ki 1/3 ka tukda 1/6 se bada hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** jo aapne dikhaya tha, usse socha  _(incorrect)_

**Asha** [repair · beat s1:worked:worked · board up · ready 4299 ms · guard affirms,screenmismatch]: Toh poora jawab: Sana ko bada tukda mila, 1/3 wala, kyunki ek hi size ke bar ke jitne zyada hisse, har hissa utna chhota, isliye 6 bada number hote hue bhi 1/6 chhota tukda hai. Chalo, aage badhein?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2511 ms]: Virat ka game dekhna mazedaar hota hai; unki timing par dhyaan do. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | 5 tukdon mein | ek jais","numbers":"10 5"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2008 ms]: Zaroor. Riya, ek hi poori roti ko barabar hisson mein baantne par, jitne zyada hisse honge, har hissa utna chhota hoga. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | 5 tukdon mein | ek jais","numbers":"10 5"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** ek bata paanch  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2159 ms]: Bilkul sahi, tumne 1/5 chuna—kyunki 5 hisso mein har hissa 10 hisso wale se bada hota hai. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1917 ms]: Card par diya sawaal teen bhinnon ko chhote se bade kram mein lagane ka hai. Pehle har bhinn mein poore ke kitne barabar hisse hain, woh dekho. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2273 ms]: Riya, sawaal mein teen bhinn ko chhote se bade kram mein rakhna hai. Har bhinn mein neeche ka number dekho: woh poore ke kitne barabar hisse batata hai. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** kis cheez ka jawab dun?  _(no_evidence)_

**Asha** [repair · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3662 ms · guard samecard]: In teen bhinnon ko chhote tukde se bade tukde tak sajana hai: 1/3, 1/12, 1/6. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** kis cheez ka jawab dun?  _(no_evidence)_

**Asha** [repair · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 3706 ms · guard samecard]: In teen bhinnon ko pehle sabse chhote tukde se shuru karke sabse bade tukde tak rakho: 1/3, 1/12, 1/6. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** kis cheez ka jawab dun?  _(no_evidence)_

**Asha** [repair · beat s1:check:c2 · board up · ready 2307 ms]: Pichhle sawaal ka jawab 1/12, 1/6, 1/3 tha, kyunki ek hi poore ke 12 hisse sabse chhote hote hain, phir 6 hisse, aur 3 hisse sabse bade. Taiyaar ho aage ke liye?
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | 1/3 | chhote se ","numbers":"1/3 1/12 1/6"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1975 ms]: Theek hai, ab naya sawaal dekho. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > card: Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** smaller  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 (1 miss) · board up · ready 3672 ms · guard samecard,uncorrected]: chhota sahi nahi hai. 0 se 1 tak ki poori doori ko 4 barabar hisson mein baanta gaya hai. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > card: Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** smaller  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 (2 miss) · board up · ready 2087 ms · guard uncorrected]: chhota sahi nahi hai. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > card: Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** it is bigger  _(correct)_

**Asha** [repair · beat s1:check:c3 · board up · ready 1947 ms]: Haan, sahi hai. Ab tak har baar ek hi tukda tha, jaise 1/4 aur 1/8, toh tukde ka size faisla karta tha. Ab dekhenge ki neeche ka number same ho, jaise 3/7 aur 5/7, tab kaise tulna karte hain. Chalo, aage badhein?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2311 ms · guard mustsay]: Yeh patti 7 barabar hisson mein kati hai, toh har hissa 1/7 hai. Isme 3 hisse rang wale hain, yeh 3/7 hai. Upar wala 3 batata hai ki aise kitne hisse liye gaye. Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > card: Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** five sevenths  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 2337 ms · guard nowhy]: Haan, sahi hai. Tumne kaunsa hissa dekha—upar wala ya neeche wala?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 3422 ms · guard affirms,mustsay]: Achha, tumne apna tareeka bataya. Wahi patti, wahi 1/7 wale hisse. Ab 5 hisse rang wale hain, yeh 5/7 hai. Yahan bhi hisson ka size same hai, bas rang wale hisse zyada hain. Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > card: Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 5"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":5,"whole":"bar"}}

**child:** nahi  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 1236 ms · guard mustsay]: Nahi, sahi. Yeh sankhya rekha 0 se 1 tak sevenths mein bati hai, aur is par 2 nishaan hain, 3/7 aur 5/7. 5/7 zero se zyada door hai. Jab neeche ka number same ho, toh upar ka number dekho. Jo zero se zyada door, woh bada. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 1923 ms]: Ab neeche ka number same ho, toh upar ke number dekho. Is tareeke ko agle sawaal mein lagao. Ab sankhya rekha 0 se 1 tak 5 barabar hisson mein bati ho. Zero se zyada door kaunsa hoga, 2/5 ya 4/5?
  > card: Ab sankhya rekha 0 se 1 tak 5 barabar hisson mein bati ho. Zero se zyada door kaunsa hoga, 2/5 ya 4/5?
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** 4/5 zyada hai  _(correct)_

**Asha** [probe · beat s2:explain:e3 · board up · ready 1402 ms]: Sahi—4/5 zyada door hai, kyunki dono mein 5 hisse hain aur 4 hisse, 2 se zyada hain. Ab batao, tumne yeh kaise jaana?
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** maine dhyan se dekh ke socha  _(incorrect)_

**Asha** [explain · beat s2:explain:e4 · board up · ready 2946 ms · guard mustsay]: Tumne sankhya rekha par doori dekhi—sahi tareeka. Baayein taraf neeche ka number same hai, toh same size ke hisse, aur zyada hisse matlab zyada. Daayein taraf neeche ke number alag hain, toh alag size ke hisse, aur sirf hisse ginne se faisla nahi hota. Ab tak samajh aaya?
  > screen: board compare@1 {"labels":"neeche ka | number same | neeche ke | nu"} · ref {"template":"compare@1","params":{"left":{"title":"neeche ka number same","items":["same size ke hisse","zyada hisse matlab zyada"]},"right":{"title":"neeche ke number alag","items":["alag size ke hisse","ginne se faisla nahi"]}}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 2005 ms]: Ab hum alag neeche ke numbers wali bhinnon ko dhyaan se tulna karo karenge. Do ek jaise bar hain: ek ka 2/3, doosre ka 3/10. 3/10 mein zyada hisse hain. Kaunsa bada hai, 2/3 ya 3/10?
  > card: Do ek jaise bar hain: ek ka 2/3, doosre ka 3/10. 3/10 mein zyada hisse hain. Kaunsa bada hai, 2/3 ya 3/10?
  > screen: board compare@1 {"labels":"neeche ka | number same | neeche ke | nu"} · ref {"template":"compare@1","params":{"left":{"title":"neeche ka number same","items":["same size ke hisse","zyada hisse matlab zyada"]},"right":{"title":"neeche ke number alag","items":["alag size ke hisse","ginne se faisla nahi"]}}}

**child:** 2/3  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 1064 ms]: Haan, sahi hai. Diya hai: do ek jaise cake, Meena ka hissa: 5/8, Raju ka hissa: 3/8. Dhoondhna hai: kisne kam cake khaya. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 3287 ms · guard leak]: Neeche ka number same hai, isliye upar ke numbers dekho. Dono bhinnon ka neeche ka number dekho: dono mein 8, toh har tukda 1/8, kyunki dono cake ek jaise hain aur dono 8 barabar tukdon mein bante hain. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 3878 ms · guard leak]: Ab jab neeche ka number same ho, upar ke numbers tulna karo karte hain. Ab upar ka number dekho: Meena ke 1/8 wale 5 tukde, Raju ke 3 tukde, kyunki upar ka number batata hai ki kitne tukde khaye. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · ready 3380 ms · guard nostop,nochoice]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


