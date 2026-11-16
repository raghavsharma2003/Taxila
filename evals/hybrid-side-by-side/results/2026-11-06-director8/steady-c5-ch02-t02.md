# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj fractions compare karenge. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1852 ms]: Socho, do ek jaise cake hain. Ek cake 4 barabar tukdon mein kata hai, doosra 8 barabar tukdon mein. Tumhe kisi ek cake se sirf ek tukda lena hai. Theek hai, Riya. Ab socho: ek cake 4 equal pieces mein, doosra 8 mein. Sirf ek piece logi—kaunsa piece bada hoga?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2812 ms · guard mustsay,twoq]: Yeh ek poori patti hai. Iske 4 barabar hisse hain, aur ek hissa rang wala hai, woh 1/4 hai. Neeche wala 4 batata hai ki poori patti kitne barabar hisson mein kati hai. Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** chhota hoga  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 970 ms]: Haan, sahi hai. Haan, chhota hoga. Tumne kaise jaana ki zyada equal parts karne par har part chhota hota hai, Riya?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** maine line par aage-peeche dekh ke socha  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 5230 ms · guard affirms,leak]: Line par aage-peeche dekhna useful tha. Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2868 ms · guard mustsay,samecard]: Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Isi size ki patti mein ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/4 is bigger  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 890 ms · guard mustsay]: Bilkul, Riya—tumne pehchana ki 1/4 ka hissa, 1/8 se bada hai. Yeh sankhya rekha 0 se 1 tak hai, aur is par 2 nishaan hain. 1/8 zero ke paas hai, aur 1/4 usse aage. Toh 1/8 < 1/4. Ek hi poore ke jitne zyada barabar hisse, har hissa utna chhota. Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali sankhya rekha par zero se zyada door kaunsa hoga, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** 1/7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1038 ms · guard uncorrected]: 1/7 sahi nahi hai. Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain. Toh 8 bada number hai, par 1/8 chhota hissa hai. Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Do ek jaisi bottle: Ravi ne ek ka 1/7 nikala, Zoya ne doosri ka 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 2"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** Ravi ne  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2234 ms · guard invented]: Haan, sahi hai. Aur pehle wale sawaal ka jawab 1/3 tha, kyunki ek hi poore ke jitne zyada barabar hisse, har hissa utna chhota. Do ek jaise chocolate bar hain. Rahul ko ek bar ka 1/6 milta hai, Sana ko doosre bar ka 1/3. Kise bada tukda milta hai? Diya hai: do ek jaise chocolate bar, Rahul ka hissa: 1/6, Sana ka hissa: 1/3. Dhoondhna hai: kise bada tukda milta hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 1869 ms]: Screen par board dekho: 1/6 ke chhe tukde, 1/3 ke teen tukde. Dono poore barabar hain. Ek-ek tukda kis taraf bada dikh raha hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1983 ms]: Theek, Riya. Dono bhinnon ka upar ka number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai ki kitne tukde mile, toh ab sirf tukde ka size dekhna hai. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2106 ms]: Theek, Riya. Ab dono ke tukde ka size likho: Rahul ka tukda 1/6, Sana ka tukda 1/3, kyunki rahul ka bar 6 barabar hisson mein kata hai aur Sana ka sirf 3 barabar hisson mein. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 1973 ms]: Do ek jaise chocolate bars mein, 1/6 ka tukda 6 hisson mein, aur 1/3 ka tukda 3 hisson mein banta hai. Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > card: Rahul ka tukda 1/6 hai, Sana ka tukda 1/3. Toh bada tukda kise mila, Rahul ko ya Sana ko?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** Sana ka  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1948 ms]: Sahi, Riya. Tumne numerator same rakhkar denominator compare kiya—3 parts wale tukde bade hote hain. Ab batao, 1/3 bada kyun hai 1/6 se?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** kyunki hisse barabar the, maine wahi dekha  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 4954 ms · guard affirms]: Toh poora jawab: Sana ko bada tukda mila, 1/3 wala, kyunki ek hi size ke bar ke jitne zyada hisse, har hissa utna chhota, isliye 6 bada number hote hue bhi 1/6 chhota tukda hai. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | ? tukdon mein | ek jais","numbers":"10"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 3237 ms · guard praise,affirms]: Ab tum khud compare karo: ek roti 10 parts mein, doosri 5 parts mein—1/10 aur 1/5 mein bada tukda kaunsa hai? Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | ? tukdon mein | ek jais","numbers":"10"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [repair · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 4642 ms · guard samecard]: Cricket pitch ko do ek-jaise strips samjho: ek 10 parts mein, doosri 5 mein. Sirf ek part bada kis strip ka hoga—10 wali ya 5 wali? Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board compare@1 {"labels":"10 tukdon mein | ? tukdon mein | ek jais","numbers":"10"} · ref {"template":"compare@1","params":{"left":{"title":"10 tukdon mein","items":["ek jaisi roti"]},"right":{"title":"5 tukdon mein","items":["ek jaisi roti"]}}}

**child:** ek bata paanch  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2062 ms]: Sahi, Riya—tumne pehchana ki 5 parts mein kata ek tukda, 10 parts wale se bada hota hai. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | ? | chhote se ba"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1697 ms]: Zaroor, Riya. Ab se main saral Hindi mein, Roman lipi mein samjhaungi. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | ? | chhote se ba"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** kis cheez ka jawab dun?  _(no_evidence)_

**Asha** [repair · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2883 ms · guard samecard]: Ek poori cheez ke in hisson ko chhote se bade kram mein rakho: 1/3, 1/12, 1/6. Tum pehle kaunsa likhogi? Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | ? | chhote se ba"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 1951 ms · guard leak,uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Tumne kram ulta likha. Chhote se shuru karna hai—neeche wale number ko dekho: 3, 12, 6. Ab phir se kram lagao. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > screen: board compare@1 {"labels":"ek hi poore ke | kram | ? | chhote se ba"} · ref {"template":"compare@1","params":{"left":{"title":"ek hi poore ke","items":["1/3","1/12","1/6"]},"right":{"title":"kram","items":["chhote se bade"]}}}

**child:** kya poochha, phir se bolo na  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 gave · board up · ready 2577 ms]: Pichhle sawaal ka jawab 1/12, 1/6, 1/3 tha, kyunki toh 8 bada number hai, par 1/8 chhota hissa hai. Riya, sawaal tha: diye gaye bhinnon ko chhote se bade kram mein lagana. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > card: Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** bigger hai na  _(correct)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 3094 ms · guard long]: Haan, sahi hai. Ab tak har baar ek hi tukda tha, toh tukde ka size faisla karta tha. Ab dekhenge ki neeche ka number same ho, tab kaise tulna karte hain. Yeh patti 7 barabar hisson mein kati hai, toh har hissa 1/7 hai. Isme 3 hisse rang wale hain, yeh 3/7 hai. Upar wala 3 batata hai ki aise kitne hisse liye gaye. Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > card: Isi patti ke 5 hisse rang dein, toh woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** 5 by 7  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 1486 ms]: Haan, sahi hai. Haan, Riya, 5/7. Kaise jaana ki neeche ka 7 same raha aur upar 5 ho gaya?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** shayad hisse gin ke  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 4623 ms · guard affirms,mustsay,long]: Hisson ka size same rehta hai. Wahi patti, wahi 1/7 wale hisse. Ab 5 hisse rang wale hain, yeh 5/7 hai. Yahan bhi hisson ka size same hai, bas rang wale hisse zyada hain. Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > card: Rohan kehta hai ki 3/7 aur 5/7 barabar hain, kyunki dono sevenths hain. Kya woh sahi hai, haan ya nahi?
  > screen: board fraction-parts@1 {"labels":"7 equal parts","numbers":"7 5"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":5,"whole":"bar"}}

**child:** nahi, 5/7 zyada hai  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 1848 ms]: Haan, sahi hai. Yeh sankhya rekha 0 se 1 tak sevenths mein bati hai, aur is par 2 nishaan hain, 3/7 aur 5/7. 5/7 zero se zyada door hai. Jab neeche ka number same ho, toh upar ka number dekho. Jo zero se zyada door, woh bada. Ab sankhya rekha 0 se 1 tak 5 barabar hisson mein bati ho. Zero se zyada door kaunsa hoga, 2/5 ya 4/5?
  > card: Ab sankhya rekha 0 se 1 tak 5 barabar hisson mein bati ho. Zero se zyada door kaunsa hoga, 2/5 ya 4/5?
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** they are equal  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 3521 ms · guard leak,long,screenmismatch,uncorrected]: they are equal sahi nahi hai. Neeche ka 7 sirf hisse ka size batata hai, toh 2/7 aur 5/7 ke hisse ek hi size ke hain. 5/7 mein aise zyada hisse hain, isliye sankhya rekha par woh zero se zyada door hai aur bada hai. Ek ribbon ke 10 barabar tukde hain. Zoya ne 3 tukde liye, Gopi ne 7. Zyada kiske paas hai, Zoya ke ya Gopi ke?
  > card: Ek ribbon ke 10 barabar tukde hain. Zoya ne 3 tukde liye, Gopi ne 7. Zyada kiske paas hai, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {"labels":"2/7 | 5/7","numbers":"0 1 2/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":5,"label":"5/7"}]}}

**child:** they have the same  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal (1 miss) · board up · ready 2602 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Dono ke tukde ek hi size ke hain. Kiske paas zyada ribbon hai? Ek ribbon ke 10 barabar tukde hain. Zoya ne 3 tukde liye, Gopi ne 7. Zyada kiske paas hai, Zoya ke ya Gopi ke?
  > card: Ek ribbon ke 10 barabar tukde hain. Zoya ne 3 tukde liye, Gopi ne 7. Zyada kiske paas hai, Zoya ke ya Gopi ke?
  > screen: board fraction-parts@1 {"labels":"10 equal parts","numbers":"10"} · ref {"template":"fraction-parts@1","params":{"parts":10,"shade":0,"whole":"bar"}}

**child:** Gopi, 7/10  _(correct)_

**Asha** [explain · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 2215 ms · guard mustsay,leak,long]: Sahi, Gopi ke paas zyada hai. Aur pehle wale sawaal ka jawab 4/5 tha, kyunki jo zero se zyada door, woh bada. Baayein taraf neeche ka number same hai, toh same size ke hisse, aur zyada hisse matlab zyada. Daayein taraf neeche ke number alag hain, toh alag size ke hisse, aur sirf hisse ginne se faisla nahi hota. Do ek jaise bar hain: ek ka 2/3, doosre ka 3/10. 3/10 mein zyada hisse hain. Kaunsa bada hai, 2/3 ya 3/10?
  > card: Do ek jaise bar hain: ek ka 2/3, doosre ka 3/10. 3/10 mein zyada hisse hain. Kaunsa bada hai, 2/3 ya 3/10?
  > screen: board compare@1 {"labels":"neeche ka | number same | neeche ke | nu"} · ref {"template":"compare@1","params":{"left":{"title":"neeche ka number same","items":["same size ke hisse","zyada hisse matlab zyada"]},"right":{"title":"neeche ke number alag","items":["alag size ke hisse","ginne se faisla nahi"]}}}

**child:** 3/10  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-tops-only · board up · ready 2211 ms · guard leak,long,uncorrected]: 3/10 sahi nahi hai. Ek 1/3 teen 1/9 ke barabar hai, isliye sankhya rekha par 1/3 teen chhote hisson tak jaata hai, aur 2/9 sirf do tak. Hisse tabhi gino jab unka size same ho. Do ek jaise bar: ek ke 5 barabar tukdon mein se 3 tukde lo, doosre ke 10 mein se 4. Kaun zyada hai, 3/5 ya 4/10?
  > card: Do ek jaise bar: ek ke 5 barabar tukdon mein se 3 tukde lo, doosre ke 10 mein se 4. Kaun zyada hai, 3/5 ya 4/10?
  > screen: board fraction-line@1 {"labels":"2/9 | 1/3","numbers":"0 1 2/9 1/3"} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":2,"label":"2/9"},{"num":3,"label":"1/3"}]}}

**child:** teen bata paanch  _(correct)_

**Asha** [probe · beat s2:check:then:c5-maths-ch02-t02-m-tops-only · board up · ready 2214 ms]: Sahi, Riya—3/5 zyada hai. Ab batao, tumne kaise jaana ki 3/5, 4/10 se zyada hai?
  > screen: board compare@1 {"labels":"? barabar | tukdon | 10 tukdon | ? tukde","numbers":"10 4"} · ref {"template":"compare@1","params":{"left":{"title":"5 barabar tukdon","items":["3 tukde lo"]},"right":{"title":"10 tukdon","items":["4 lo"]}}}

**child:** pehle wale step se pata chala  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 4008 ms · guard leak,invented]: Aur pehle wale sawaal ka jawab 2/3 tha, kyunki daayein taraf neeche ke number alag hain, toh alag size ke hisse, aur sirf hisse ginne se faisla nahi hota. Do ek jaise cake mein Meena ne 5/8 aur Raju ne 3/8 khaya. Do ek jaise cake hain. Meena apne cake ka 5/8 khaati hai, Raju apne cake ka 3/8. Kisne kam cake khaya? Diya hai: do ek jaise cake, Meena ka hissa: 5/8, Raju ka hissa: 3/8. Dhoondhna hai: kisne kam cake khaya. Yeh kadam saaf hai?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 3463 ms · guard leak,long]: Jab neeche ka number same ho, upar ke numbers dekho. Dono bhinnon ka neeche ka number dekho: dono mein 8, toh har tukda 1/8, kyunki dono cake ek jaise hain aur dono 8 barabar tukdon mein bante hain. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 3775 ms · guard leak,long]: Do bhinnon mein neeche ka number same ho, toh upar ke numbers dekho. Ab upar ka number dekho: Meena ke 1/8 wale 5 tukde, Raju ke 3 tukde, kyunki upar ka number batata hai ki kitne tukde khaye. Ab tak samajh aaya?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked · board up · ready 2941 ms · guard twoq]: Toh Meena ne 5 tukde khaye, Raju ne 3 tukde. Sab tukde ek jaise hain. Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Sab tukde ek jaise hain. Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {"labels":"3/8 | 5/8","numbers":"0 1 3/8 5/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** Raju ne  _(correct)_

**Asha** [practice · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 · board up · ready 1166 ms]: Bilkul sahi, Riya—tumne same denominator mein 3 aur 5 mein chhota numerator chuna. Toh poora jawab: Raju ne kam cake khaya, sirf 3/8, kyunki tukde same size ke hain aur Raju ke tukde kam hain, isliye sankhya rekha par bhi 3/8, 5/8 se pehle aata hai. Meena ne ek cake ka 2/6 khaya aur uske bhai ne usi cake ka 4/6. Zyada kisne khaya: Meena ne ya uske bhai ne, ya dono ne barabar?
  > card: Meena ne ek cake ka 2/6 khaya aur uske bhai ne usi cake ka 4/6. Zyada kisne khaya: Meena ne ya uske bhai ne, ya dono ne barabar?
  > screen: board compare@1 {"labels":"Meena | uske bhai | 2/6 | ?","numbers":"2/6"} · ref {"template":"compare@1","params":{"left":{"title":"Meena","items":["2/6"]},"right":{"title":"uske bhai","items":["4/6"]}}}

**child:** bhai ne  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 · board up · ready 1007 ms]: Haan, sahi hai. Do ek jaise cake hain. Ben ka cake 4 barabar tukdon mein kata hai aur Ben ne 2 tukde liye. Zoya ka cake 12 barabar tukdon mein kata hai aur Zoya ne 3 tukde liye. Zoya ka kehna hai ki zyada cake uske paas hai, kyunki 3 tukde 2 se zyada hain. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Do ek jaise cake hain. Ben ka cake 4 barabar tukdon mein kata hai aur Ben ne 2 tukde liye. Zoya ka cake 12 barabar tukdon mein kata hai aur Zoya ne 3 tukde liye. Zoya ka kehna hai ki zyada cake uske paas hai, kyunki 3 tukde 2 se zyada hain. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board compare@1 {"labels":"4 barabar | tukdon | 12 barabar | tukdon","numbers":"4 12 2 3"} · ref {"template":"compare@1","params":{"left":{"title":"4 barabar tukdon","items":["2 tukde liye"]},"right":{"title":"12 barabar tukdon","items":["3 tukde liye"]}}}

**child:** Ben  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 · board up · ready 1016 ms]: Sahi, Riya—tumne tukdon ki sankhya nahi, har tukde ka size bhi dekha. Do ek jaise cake hain: ek ke 4 barabar tukdon mein se 3, doosre ke 6 barabar tukdon mein se 5. Dono mein poore cake se ek tukda kam hai. Kaunsa bada hai, 3/4 ya 5/6?
  > card: Do ek jaise cake hain: ek ke 4 barabar tukdon mein se 3, doosre ke 6 barabar tukdon mein se 5. Dono mein poore cake se ek tukda kam hai. Kaunsa bada hai, 3/4 ya 5/6?
  > screen: board compare@1 {"labels":"4 barabar | tukdon | 6 barabar | tukdon ","numbers":"4 6 3 5"} · ref {"template":"compare@1","params":{"left":{"title":"4 barabar tukdon","items":["3 tukdon","ek tukda kam"]},"right":{"title":"6 barabar tukdon","items":["5 tukdon","ek tukda kam"]}}}

**child:** 5/6  _(correct)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 · board up · ready 802 ms · guard mustsay]: Sahi, Riya—5/6 bada hai. Jab neeche ka number same tha, tab upar wala number dekha. Ab ulta dekhenge, jab upar ka number same ho. Yeh patti 5 barabar hisson mein kati hai, toh har hissa 1/5 hai. Isme 3 hisse rang wale hain, yeh 3/5 hai. Ab isi size ki ek patti ko 8 barabar hisson mein kaatkar 3 hisse rango. Woh kaunsa bhinn hoga?
  > card: Ab isi size ki ek patti ko 8 barabar hisson mein kaatkar 3 hisse rango. Woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"5 equal parts","numbers":"5 3"} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

**child:** 8/3  _(incorrect)_

**Asha** [hint · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 (1 miss) · board up · ready 2077 ms · guard flat,uncorrected]: 8/3 sahi nahi hai. Tumne upar-neeche ulta likha. Neeche kul barabar hisse, upar rang wale hisse. 8 kul hisse, 3 rang wale—bhinn kya hoga? Ab isi size ki ek patti ko 8 barabar hisson mein kaatkar 3 hisse rango. Woh kaunsa bhinn hoga?
  > card: Ab isi size ki ek patti ko 8 barabar hisson mein kaatkar 3 hisse rango. Woh kaunsa bhinn hoga?
  > screen: board fraction-parts@1 {"labels":"5 equal parts","numbers":"5 3"} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

**child:** 3/8 hai na  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 · board up · ready 1990 ms · guard mustsay]: Haan, sahi hai. Wahi size ki patti, ab 8 barabar hisson mein kati hai, toh har hissa 1/8 hai. Ismein bhi 3 hisse rang wale hain, yeh 3/8 hai. Tanvi kehti hai ki 3/5 aur 3/8 barabar hain, kyunki dono mein 3 hisse hain. Kya woh sahi hai, haan ya nahi?
  > card: Tanvi kehti hai ki 3/5 aur 3/8 barabar hain, kyunki dono mein 3 hisse hain. Kya woh sahi hai, haan ya nahi?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 3"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":3,"whole":"bar"}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3576 ms · guard nostop]: Theek hai, Riya. Tum chaaho toh padhai jaari rakhein, thodi der ka chhota break lein, ya aaj ke liye band karein. Tum kya chunogi?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 3"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":3,"whole":"bar"}}

## Agent


