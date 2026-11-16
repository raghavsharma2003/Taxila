# steering-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj fractions compare karenge. Cooking mein tumhe kya banana pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 2546 ms]: Socho, do bilkul ek jaise cake. Ek ke 4 barabar tukde kiye, doosre ke 8. Tumhe bas ek tukda milega, kisi bhi cake se. Do same-size cakes: ek 4 tukdon mein, doosra 8 mein.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 4638 ms · guard mustsay,twoq]: Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > card: Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":"?"},{"parts":8,"shade":0,"label":"?"}]}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2458 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Dekho, do barabar patti. Upar wali 2 hisson mein kati hai, neeche wali 11 mein. 11 bada number hai, par uska ek tukda, 1/11, kitna patla hai. 1/2 ke saamne bahut chhota. Hisse jitne zyada, har tukda utna chhota. Yahan tak theek hai?
  > screen: board fraction-bars@1 {"labels":"1/2 | 1/11","numbers":"1/2 1/11"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2725 ms]: Theek hai, ab Hindi mein. Bottle dono barabar hain. Jiska neeche ka number chhota, uska hissa bada. Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[6,9],"from":0,"to":1}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 2362 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Bottle dono barabar hain. Jiska neeche ka number chhota, uska hissa bada. Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[6,9],"from":0,"to":1}}

**child:** 1/6 wali  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 1034 ms]: Haan, sahi hai, kyunki 1/6 ka hissa 1/9 ke hisse se bada hai, toh ek jaisi bottle mein Ravi ne zyada nikala. Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > card: Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-line@1","params":{"dens":[6,9],"from":0,"to":1,"marks":[[1,6],[1,9]]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 3290 ms]: Dekho: pehle wale ke 4 barabar tukde; doosre wale ke 8 barabar tukde. Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > card: Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > screen: board wholes@1 {"whole1":"4 equal parts","whole2":"8 equal parts","labels":""} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":"?"},{"parts":8,"shade":0,"label":"?"}]}}

**child:** bigger  _(misconception)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 gave · board up · ready 4504 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab chhota tha, kyunki wahi patti ab 8 mein bati hai, toh har hissa chhota padta hai, 1/8 bas 1/4 ka aadha. Ab wahi patti, par 8 barabar hisse. Rang sirf ek mein hai, toh yeh 1/8. Dekho, pehle ka har hissa beech se do ho gaya. Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > card: Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 barabar hisse","numbers":"8 1"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** 1/8  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 (1 miss) · board up · ready 3219 ms · guard leak,samecard]: Abhi yeh sahi nahi hai. Patti par dekho: do chhote 1/8 hisse milkar pehle ke ek hisse jitne hain. Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > card: Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > screen: board fraction-bars@1 {"labels":"1/4 | 1/8","numbers":"1/4 1/8"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 (1 miss) · board up · ready 1983 ms]: Haan, pehle tum try karo — Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > card: Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > screen: board fraction-bars@1 {"labels":"1/4 | 1/8","numbers":"1/4 1/8"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** 1/8  _(misconception)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1107 ms · guard mustsay,uncorrected]: Yeh jawab sahi nahi hai. Iska jawab 1/4 hai, kyunki do 1/8 jodo tab jaakar ek 1/4 banta hai, matlab 1/4 bada hai. Dono ko ek sankhya rekha par rakhte hain, 0 se 1 tak. 1/8 zero ke bilkul paas hai, 1/4 usse aage. Rekha ka niyam simple hai: zero se jitna door, utna bada. Aur poora jitne zyada hisson mein kate, pehla nishaan zero ke utna paas. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 2471 ms]: Cricket ki baat hum is sawaal ke baad karenge. Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [probe · beat s1:explain:e3 · board up · ready 983 ms]: Haan, sahi hai. Dekho, 1/3 ka hissa 1/7 ke hisse se bada hai, toh 1/3 zero se aage jaakar rukta hai.
  > screen: board fraction-line@1 {"labels":"1/3 | 1/7","numbers":"0 1 1/3 1/7"} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 3258 ms · guard invented]: Achha. Rahul aur Sana ke paas ek jaise chocolate bar hain. Rahul ko apne bar ka 1/6 mila, Sana ko apne ka 1/3. Bada tukda kiske paas hai? Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2542 ms]: Pehla kadam dekho. Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai kitne tukde mile, aur ek-ek mile, toh ab baat sirf size ki hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2717 ms · guard screenmismatch]: Ab doosra kadam. Phir dekho, kiska bar kitne hisson mein kata: Rahul ka bar 6 hisson mein, Sana ka sirf 3 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek tukda kitna bada hai. Ab agla kadam dekhte hain.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2267 ms]: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2085 ms · guard twoq]: Bar dono barabar hain. Jo bar kam hisson mein kata, uska tukda mota. Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** Sana hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2854 ms]: Haan, sahi hai. Toh poora jawab: Sana ko mila, 1/3 wala tukda, kyunki 6 bada number hai, par 6 hisson wale bar ka tukda chhota hota hai, isliye 1/6 chhota aur 1/3 bada. Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {"labels":"Roti"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** one fifth  _(correct)_

**Asha** [probe · beat s1:check:c1 · board up · ready 1153 ms]: Bilkul sahi. Dekho, 5 tukdon wali roti ka 1/5, 10 tukdon wali roti ke 1/10 se do guna bada hai.
  > screen: board wholes@1 {"labels":"1/10 | 1/5","numbers":"1/10 1/5"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"1/10"},{"parts":5,"title":"1/5"}]}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2841 ms]: Achha. Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {"labels":"1/3 | 1/12 | 1/6"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** 1/12, phir 1/6, phir 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1171 ms]: Haan, bilkul theek, kyunki poora ek ho toh 1/12 ke tukde sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > card: Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** bigger  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1210 ms]: Sahi jawab. Dekho, woh nishaan 1/4 hai, aur ek 1/4 mein do 1/8 samaate hain, isliye woh 1/8 se bada. Ab tak har baar sirf ek tukda tha, jaise 1/4 aur 1/8, toh tukde ka size hi sab tay karta tha. Agla sawaal alag hai: neeche ka number same, jaise 3/7 aur 5/7. Ab aage chalte hain.
  > screen: board compare@1 {"labels":"ek hi tukda | neeche ka | number same","numbers":"1/4 3/7 1/8 5/7"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 3974 ms · guard affirms,mustsay]: Is patti ke 7 barabar hisse hain, har ek 1/7. 3 mein rang hai, toh yeh 3/7 hua. Upar ka 3 bas ginta hai ki kitne hisse liye. Isi patti ke 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > card: Isi patti ke 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > screen: board fraction-parts@1 {"labels":"7 barabar hisse","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** 7/5  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 1260 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Neeche wahi 7 rahega, patti nahi badli. Upar bas rang wale hisse gino. Isi patti ke 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > card: Isi patti ke 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** 5/7 hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2080 ms]: Haan, sahi hai, kyunki hisse wahi 7 hain, rang ab 5 mein, toh 5/7. Wahi patti, wahi 1/7 ke hisse. Bas ab 5 mein rang hai, toh yeh 5/7. Hisson ka size same raha, rang wale hisse badh gaye. Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-parts@1 {"labels":"7 barabar hisse","numbers":"7 5"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":5,"label":"5/7"}]}}

**child:** yes  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2971 ms]: Yeh jawab sahi nahi hai. Neeche ka 9 bas hisse ka size batata hai. 4/9 ho ya 7/9, hisse ek hi size ke hain. 7/9 ke paas aise zyada hisse hain, isliye rekha par woh zero se door hai, aur bada. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"4/9 | 7/9","numbers":"0 1 4/9 7/9"} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":4,"label":"4/9"},{"num":7,"label":"7/9"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2316 ms]: Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > card: Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1}}

**child:** they have the same  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal (1 miss) · board up · ready 4167 ms · guard samecard,uncorrected]: Abhi yeh sahi nahi hai. Ribbon ke sab tukde ek size ke hain. Toh jiske haath zyada tukde, uske paas zyada ribbon. Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > card: Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1}}

**child:** they have the same  _(misconception)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) gave · board up · ready 3023 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab Gopi ke paas tha, kyunki har tukda ribbon ka 1/10 hai, aur Gopi ka 7/10, 2/10 se zyada hai. Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":2,"label":"2/10"},{"num":7,"label":"7/10"}]}}

**child:** he is wrong  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 2178 ms]: Haan, sahi hai. Dekho, sevenths dono hain, par ginti alag hai: 5/7 mein 5 hisse, 3/7 mein bas 3.
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4923 ms · guard wrap,nochoice,wrap]: Theek hai Riya, thak gayi ho toh teen raaste hain: padhai jaari rakhein, chhota break lein, ya aaj ke liye rok dein.
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

## Agent


