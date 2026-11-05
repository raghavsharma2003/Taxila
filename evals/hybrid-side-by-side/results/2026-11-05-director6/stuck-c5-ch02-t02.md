# stuck-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj fractions compare karenge—jaise cooking mein kaunsa hissa zyada. Tumhe cooking mein kya banana pasand hai?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2817 ms]: Theek hai, Riya. Socho, do same-size cakes: ek 4 equal pieces mein, doosra 8 mein. Sirf ek piece lena ho, kis cake ka piece bada hoga?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2377 ms · guard twoq,screenmismatch]: Yeh ek poori patti hai. Iske 4 barabar hisse hain, aur ek hissa rang wala hai, woh 1/4 hai. Neeche wala 4 batata hai ki poori patti kitne barabar hisson mein kati hai. Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 4227 ms · guard leak,long,uncorrected]: bigger sahi nahi hai. Is patti ke 8 barabar hisse hain, aur rang wale 2 hisse milkar theek ek 1/4 jitne lambe hain. Toh 8 bada number hai, par 1/8 chhota hissa hai. Ravi ne apni bottle ka 1/5 juice nikala, Zoya ne apni bottle ka 1/10. Kisne zyada juice nikala, Ravi ne ya Zoya ne?
  > card: Ravi ne apni bottle ka 1/5 juice nikala, Zoya ne apni bottle ka 1/10. Kisne zyada juice nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 2"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · ready 2748 ms]: Haan Riya, ab se sirf saral Hindi mein samjhaungi. Neeche ki sankhya batati hai ki poori cheez kitne barabar hisson mein baanti gayi hai. Ravi aur Zoya ke paas ek jaisi juice ki bottle hai. Ravi ne apni bottle ka 1/5 juice nikala, Zoya ne apni bottle ka 1/10. Kisne zyada juice nikala, Ravi ne ya Zoya ne?
  > card: Ravi ne apni bottle ka 1/5 juice nikala, Zoya ne apni bottle ka 1/10. Kisne zyada juice nikala, Ravi ne ya Zoya ne?

**child:** 1/5 wali  _(correct)_

**Asha** [probe · ready 1322 ms]: Haan Riya, Ravi ne zyada nikala. Tumne kaise jaana ki 1/5, 1/10 se bada hai?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3402 ms · guard mustsay]: 1/5 bada hai, kyunki ek jaisi poori cheez ko 5 hisson mein baantne par har hissa, 10 hisson ke hisse se bada hota hai. 1/8 mein 8 barabar hisse hote hain. Ab wahi patti dekho. Iske 8 barabar hisse hain, aur ek hissa rang wala hai, woh 1/8 hai. Pehle wala har hissa ab aadha-aadha bant gaya hai. Toh ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Toh ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/4 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 4615 ms · guard long]: 1/4 bada hai. Sankhya rekha par 1/8 < 1/4. Yeh sankhya rekha 0 se 1 tak hai, aur is par 2 nishaan hain. 1/8 zero ke paas hai, aur 1/4 usse aage. Toh 1/8 < 1/4. Ek hi poore ke jitne zyada barabar hisse, har hissa utna chhota. Do ek jaise cake hain. Ek cake ka 1/3 tukda, doosre ka 1/7 tukda. Kaunsa tukda bada hai, 1/3 ya 1/7?
  > card: Do ek jaise cake hain. Ek cake ka 1/3 tukda, doosre ka 1/7 tukda. Kaunsa tukda bada hai, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** ek bata teen  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 4186 ms · guard invented]: Bilkul Riya, tumne 1/3 chuna, aur woh sahi hai. Do ek jaise chocolate bar hain. Aman ko ek bar ka 1/6 milta hai, Zoya ko doosre bar ka 1/3. Kise bada tukda milta hai? Diya hai: do ek jaise chocolate bar, Aman ka hissa: 1/6, Zoya ka hissa: 1/3. Dhoondhna hai: kise bada tukda milta hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2592 ms]: Screen par dekho: 1/6 mein chhe chhote tukde, 1/3 mein teen bade tukde. Kaunsa ek tukda bada dikh raha hai—1/6 ya 1/3?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 6085 ms · guard leak,long]: Aman ka tukda 1/6 hai, Zoya ka tukda 1/3. Toh bada tukda kise mila, Aman ko ya Zoya ko?
  > card: Aman ka tukda 1/6 hai, Zoya ka tukda 1/3. Toh bada tukda kise mila, Aman ko ya Zoya ko?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** Aman  _(misconception)_

**Asha** [hint · check script:c5-maths-ch02-t02-s1:ask:worked (1 miss) · ready 2348 ms · guard uncorrected]: Aman sahi nahi hai. Riya, 1/6 mein poori cheez 6 hisson mein banti hai, isliye har hissa chhota hota hai. 1/3 ya 1/6—kaunsa bada?
  > card: Aman ka tukda 1/6 hai, Zoya ka tukda 1/3. Toh bada tukda kise mila, Aman ko ya Zoya ko?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked (1 miss) · board up · ready 2265 ms]: Koi baat nahi, isko ek baar aur aaram se dekhte hain. Aman ka tukda 1/6 hai, Zoya ka tukda 1/3. Toh bada tukda kise mila, Aman ko ya Zoya ko?
  > card: Aman ka tukda 1/6 hai, Zoya ka tukda 1/3. Toh bada tukda kise mila, Aman ko ya Zoya ko?
  > screen: board fraction-line@1 {"labels":"1/6 | 1/3","numbers":"0 1 1/6 1/3"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** Zoya  _(correct)_

**Asha** [probe · ready 1084 ms]: Haan, Zoya ko bada tukda mila. Tumne kaise jaana ki 1/3, 1/6 se bada hai?

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · ready 2228 ms]: Theek hai Riya, tum khud karke dekho।

**child:** Aman  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 gave · ready 7062 ms · guard negates]: Woh wala: jawab Zoya ko bada tukda mila, kyunki 1/3 > 1/6.; Ek hi size ke bar ko jitne zyada hisson mein kaato, har hissa utna chhota. 1/6 toh 1/3 ka aadha hai, isliye 6 bada number hote hue bhi 1/6 chhota tukda hai.. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?

**child:** 1/10  _(misconception)_

**Asha** [hint · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · ready 2785 ms · guard leak,uncorrected]: 1/10 sahi nahi hai. Tum dobara chuno: 1/10 ya 1/5?
  > card: Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [repair · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · ready 4402 ms · guard leak,samecard]: Achha, chalo is sawaal ko ek baar phir dhyaan se padhte hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?

**child:** 1/10  _(misconception)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 gave · ready 1547 ms · guard uncorrected]: Woh wala: jawab 1/5. 1/10 sahi nahi hai. Riya, tumne 1/10 chuna. Neeche ki sankhya badhne par ek tukda chhota hota hai; ab agla abhyas dekho. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · ready 2982 ms · guard flat,uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Neeche ki sankhya dekho: 3, 12, 6. Sabse zyada hisson mein bata hua ek hissa sabse chhota hota hai. Ab kram phir lagao?
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · check script:c5-maths-ch02-t02-s1:c2 (2 miss) · ready 1713 ms · guard uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Tumne kram bada se chhota likha hai. Chhote se bade mein sabse chhota bhinn pehle aayega; neeche ki sankhya dekho. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.

**child:** 1/12, phir 1/6, phir 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1788 ms]: Sahi, Riya—tumne bhinnon ko chhote se bade kram mein theek lagaya. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > card: 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** smaller  _(misconception)_

**Asha** [hint · check script:c5-maths-ch02-t02-s1:c3 (1 miss) · ready 2719 ms · guard uncorrected]: smaller sahi nahi hai. 0 se 1 tak 4 barabar hisse hain, isliye ring wala pehla hissa kaunsa bhinn hai—1/4 ya 1/8?
  > card: 0 ke baad pehla nishaan ringed hai. Woh nishaan 1/8 se bada hai ya chhota?

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · ready 4060 ms · guard wrap,nochoice]: Theek hai Riya, thakawat ho rahi hai. Tum chun sakti ho: jaari rakhein, chhota break lein, ya aaj ke liye rok dein?

## Agent


