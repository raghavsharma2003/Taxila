# offtopic-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions compare karenge—jaise cooking mein kaunsa hissa zyada. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 4382 ms]: Socho, do bilkul ek jaise cake. Ek ke 4 barabar tukde kiye, doosre ke 8. Tumhe bas ek tukda milega, kisi bhi cake se.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 4427 ms · guard long,twoq]: Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > card: Ab isi patti ko 8 barabar hisson mein kaato. Ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":"?"},{"parts":8,"shade":0,"label":"?"}]}}

**child:** small  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1277 ms]: Haan, sahi hai, kyunki wahi patti ab 8 mein bati hai, toh har hissa chhota padta hai, 1/8 bas 1/4 ka aadha.
  > screen: board fraction-bars@1 {"labels":"1/4 | 1/8","numbers":"1/4 1/8"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e1 · board up · ready 2410 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {"labels":""} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":"?"},{"parts":8,"shade":0,"label":"?"}]}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3534 ms · guard mustsay]: Theek hai. Ab wahi patti, par 8 barabar hisse. Rang sirf ek mein hai, toh yeh 1/8. Dekho, pehle ka har hissa beech se do ho gaya. Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > card: Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/4 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2723 ms]: Bilkul sahi, kyunki do 1/8 jodo tab jaakar ek 1/4 banta hai, matlab 1/4 bada hai. Dono ko ek sankhya rekha par rakhte hain, 0 se 1 tak. 1/8 zero ke bilkul paas hai, 1/4 usse aage. Rekha ka niyam simple hai: zero se jitna door, utna bada. Aur poora jitne zyada hisson mein kate, pehla nishaan zero ke utna paas. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 4113 ms]: Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1917 ms · guard screenmismatch,uncorrected]: 1/7 sahi nahi hai. Dekho, do barabar patti. Upar wali 2 hisson mein kati hai, neeche wali 11 mein. 11 bada number hai, par uska ek tukda, 1/11, kitna patla hai. 1/2 ke saamne bahut chhota. Hisse jitne zyada, har tukda utna chhota. Ab agla kadam dekhte hain.
  > screen: board fraction-bars@1 {"labels":"1/2 | 1/11","numbers":"1/2 1/11"} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2270 ms]: Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > card: Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[6,9],"from":0,"to":1}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 4744 ms · guard praise,uncorrected]: Nahi, yeh jawab nahi hai. Bottle dono barabar hain. Jiska neeche ka number chhota, uska hissa bada. Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/9. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[6,9],"from":0,"to":1}}

**child:** Ravi, 1/6  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 1363 ms]: Haan, sahi hai, kyunki 1/6 ka hissa 1/9 ke hisse se bada hai, toh ek jaisi bottle mein Ravi ne zyada nikala. Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[6,9],"from":0,"to":1,"marks":[[1,6],[1,9]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 4559 ms · guard mustsay,samecard,twoq]: Ek rekha teen hisson mein kati socho, ek saat hisson mein. Jiske hisse kam, uska pehla kadam lamba. Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 4719 ms · guard samecard,screenmismatch]: Dekho, yahi numbers ab patti par. Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Aisi hi 0 se 1 wali rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-bars@1 {"wholes":"2 equal bars","bar1":"3 equal parts, 0 shaded = ?","bar2":"7 equal parts, 0 shaded = ?","labels":""} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3 wala  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2147 ms · guard invented]: Bilkul sahi, kyunki 1/3 ka hissa 1/7 ke hisse se bada hai, toh 1/3 zero se aage jaakar rukta hai. Rahul aur Sana ke paas ek jaise chocolate bar hain. Rahul ko apne bar ka 1/6 mila, Sana ko apne ka 1/3. Bada tukda kiske paas hai?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2924 ms]: Cricket ki baat hum is sawaal ke baad karenge. Pehla kadam dekho. Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai kitne tukde mile, aur ek-ek mile, toh ab baat sirf size ki hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · beat s1:explain:e3 · board up · ready 2748 ms]: Theek hai, ab Hindi mein. Bar dono barabar hain. Jo bar kam hisson mein kata, uska tukda mota.
  > screen: board fraction-line@1 {"labels":"1/8 | 1/4","numbers":"0 1 1/8 1/4"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3343 ms]: Ab doosra kadam. Phir dekho, kiska bar kitne hisson mein kata: Rahul ka bar 6 hisson mein, Sana ka sirf 3 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek tukda kitna bada hai. Ab agla kadam dekhte hain.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 5230 ms · guard leak]: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2889 ms · guard praise,affirms]: Haan, pehle tum try karo — Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** Sana, 1/3  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1575 ms]: Haan, sahi hai, kyunki 6 bada number hai, par 6 hisson wale bar ka tukda chhota hota hai, isliye 1/6 chhota aur 1/3 bada.
  > screen: board fraction-bars@1 {"labels":"1/6 | 1/3","numbers":"1/6 1/3"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2762 ms]: Achha. Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {"labels":"Roti"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 2886 ms · guard praise,uncorrected]: 1/10 sahi nahi hai. Roti wahi hai. Jitne kam log baantenge, har ek ko utna bada tukda milega. Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {"labels":"Roti"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/5  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1336 ms]: Bilkul sahi, kyunki 5 tukdon wali roti ka 1/5, 10 tukdon wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {"labels":"1/3 | 1/12 | 1/6"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"1/10"},{"parts":5,"title":"1/5"}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1803 ms]: Haan, bilkul theek. Dekho, poora ek ho toh 1/12 ke tukde sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > card: Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"","numbers":"0 1"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** 1/4 is bigger  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1248 ms · guard noconfirm]: Haan, sahi hai: woh nishaan 1/4 hai, aur ek 1/4 mein do 1/8 samaate hain, isliye woh 1/8 se bada. Ab tak har baar sirf ek tukda tha, jaise 1/4 aur 1/8, toh tukde ka size hi sab tay karta tha. Agla sawaal alag hai: neeche ka number same, jaise 3/7 aur 5/7. Ab aage chalte hain.
  > screen: board compare@1 {"labels":"ek hi tukda | neeche ka | number same","numbers":"1/4 3/7 1/8 5/7"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 4124 ms · guard mustsay]: Is patti ke 7 barabar hisse hain, har ek 1/7. 3 mein rang hai, toh yeh 3/7 hua. Upar ka 3 bas ginta hai ki kitne hisse liye. Isi patti ke 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > card: Isi patti ke 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > screen: board fraction-parts@1 {"labels":"7 barabar hisse","numbers":"7 3"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":3,"whole":"bar"}}

**child:** 5 by 7  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 1233 ms]: Sahi jawab, kyunki hisse wahi 7 hain, rang ab 5 mein, toh 5/7.
  > screen: board fraction-bars@1 {"labels":"5/7","numbers":"5/7"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":5,"label":"5/7"}]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2432 ms]: Achha. Wahi patti, wahi 1/7 ke hisse. Bas ab 5 mein rang hai, toh yeh 5/7. Hisson ka size same raha, rang wale hisse badh gaye. Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-parts@1 {"labels":"7 barabar hisse","numbers":"7 5"} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":5,"whole":"bar"}}

**child:** yes  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2505 ms]: Nahi, yeh jawab nahi hai. Neeche ka 9 bas hisse ka size batata hai. 4/9 ho ya 7/9, hisse ek hi size ke hain. 7/9 ke paas aise zyada hisse hain, isliye rekha par woh zero se door hai, aur bada. Yahan tak theek hai?
  > screen: board fraction-line@1 {"labels":"4/9 | 7/9","numbers":"0 1 4/9 7/9"} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":4,"label":"4/9"},{"num":7,"label":"7/9"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2395 ms]: Kadam sab barabar hain. Jo zyada kadam chala, woh zero se zyada door pahuncha. Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > card: Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":9,"from":0,"to":1,"marks":[{"num":4,"label":"4/9"},{"num":7,"label":"7/9"}]}}

**child:** Gopi  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) · board up · ready 1132 ms]: Haan, sahi hai, kyunki har tukda ribbon ka 1/10 hai, aur Gopi ka 7/10, 2/10 se zyada hai. Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":2,"label":"2/10"},{"num":7,"label":"7/10"}]}}

**child:** nahi  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 1014 ms · guard noconfirm]: Bilkul sahi. Dekho, sevenths dono hain, par ginti alag hai: 5/7 mein 5 hisse, 3/7 mein bas 3.
  > screen: board fraction-line@1 {"labels":"3/7 | 5/7","numbers":"0 1 3/7 5/7"} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3364 ms]: Theek hai Riya, tum aaj yahin rokna chahti ho—maine suna. Tumhare paas teen raaste hain: aage badhein, thodi der rukhein, ya aaj ke liye khatam karein.
  > screen: board fraction-line@1 {"numbers":"0 1","labels":""} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

## Agent


