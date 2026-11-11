# offtopic-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj fractions compare karenge. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2400 ms]: Socho, do bilkul ek jaise cake. Ek ke 4 barabar tukde kiye, doosre ke 8. Tumhe bas ek tukda milega, kisi bhi cake se.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3855 ms · guard mustsay,leak]: Upar yeh rahi ek poori patti. 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Bhinn ke neeche ka 4 matlab patti ke 4 barabar tukde. Neeche wahi patti 8 barabar hisson mein kati hai. Ab ek hissa pehle se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab ek hissa pehle se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":"?"}]}}

**child:** small  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 3422 ms · guard nowhy]: Haan, sahi hai, kyunki 2 patti, lambai ek hi, par neeche wali 8 mein bati hai, toh uska har hissa chhota.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e1 · board up · ready 2427 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3304 ms · guard mustsay]: Theek hai. Achha, yeh jaankar achha laga. Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > card: Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 1/4 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 4485 ms]: Bilkul sahi, kyunki do 1/8 jodo tab jaakar ek 1/4 banta hai, matlab 1/4 bada hai. Ab ek sankhya rekha lo, 0 se 1 tak. Upar ise 3 barabar hisson mein kaata hai, neeche 7 mein. Rekha ka niyam simple hai: zero se jitna door, utna bada. Isi niyam se, 1/8 aur 1/4 ko kisi bhi rekha par rakho, toh 1/8 zero ke zyada paas rukega: 1/8 < 1/4. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 2857 ms]: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1940 ms · guard uncorrected]: 1/7 sahi nahi hai. Rekha dekho, 0 se 1 tak. Neeche ise 12 barabar hisson mein kaata hai. 12 bada number hai, par uska ek hissa, 1/12, zero ke bilkul paas ruk jaata hai, jabki 1/2 rekha ke beech mein hai. Hisse jitne zyada, har tukda utna chhota. Ab isi par ek sawaal.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2141 ms]: Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,12],"from":0,"to":1}}

**child:** Zoya  _(misconception)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2143 ms]: Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/12. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/12. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,12],"from":0,"to":1}}

**child:** Ravi, 1/6  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 2610 ms]: Haan, sahi hai, kyunki 1/6 ka hissa 1/12 ke hisse ka do guna hai, toh ek jaisi bottle mein Ravi ne zyada nikala. Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,12],"from":0,"to":1,"marks":[[1,6],[1,12]]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 3839 ms · guard samecard,twoq]: Rekha dekho: upar 3 hisse, neeche 7. Jiske hisse kam, uska pehla kadam lamba. Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 6013 ms · guard samecard]: Do barabar pattiyaan: ek 3 barabar hisson mein; ek 7 barabar hisson mein. Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3 wala  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1298 ms]: Bilkul sahi, kyunki 1/3 ka hissa 1/7 ke hisse se bada hai, toh 1/3 zero se aage jaakar rukta hai. Rahul aur Sana ke paas ek jaise chocolate bar hain. Rahul ko apne bar ka 1/6 mila, Sana ko apne ka 1/3. Bada tukda kiske paas hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3391 ms]: Cricket ki baat hum thodi der mein karenge. Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai kitne tukde mile, aur ek-ek mile, toh ab baat sirf size ki hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2649 ms]: Theek hai, ab Hindi mein. Upar 1 aur 1, matlab dono ke haath ek-ek tukda. Ab socho, kiska tukda mota.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2399 ms]: Pehla kadam dekho. Phir dekho, kiska bar kitne hisson mein kata: upar wala Rahul ka, neeche wala Sana ka: Rahul ka bar 6 hisson mein, Sana ka sirf 3 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek tukda kitna bada hai.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 6069 ms · guard leak]: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 4039 ms · guard praise,affirms]: Haan, pehle tum try karo — Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** Sana, 1/3  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1519 ms]: Haan, sahi hai, kyunki 6 bada number hai, par 6 hisson wale bar ka tukda chhota hota hai, isliye 1/6 chhota aur 1/3 bada.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 3359 ms]: Achha. Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 3636 ms · guard leak,uncorrected]: 1/10 sahi nahi hai. Roti wahi hai. Jitne kam log baantenge, har ek ko utna bada tukda milega. Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/5  _(correct)_

**Asha** [practice · beat s1:check:c2 · board up · ready 1391 ms]: Bilkul sahi, kyunki 5 tukdon wali roti ka 1/5, 10 tukdon wali roti ke 1/10 se do guna bada hai. Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"1/10"},{"parts":5,"title":"1/5"}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1273 ms]: Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 gave · board up · ready 3618 ms]: Is sawaal ka jawab 1/12, 1/6, 1/3 tha, kyunki poora ek ho toh 1/12 ke tukde sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > card: Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** smaller  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 (1 miss) · board up · ready 3993 ms · guard samecard,uncorrected]: Nahi, yeh jawab nahi hai. Pehle us nishaan ka naam socho: poore ke 4 hisson mein se pehla hissa. Phir use 1/8 ke saath rakh kar dekho. Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > card: Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** bada  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1215 ms]: Haan, sahi hai. Dekho, woh nishaan 1/4 hai, aur ek 1/4 mein do 1/8 samaate hain, isliye woh 1/8 se bada. Ab tak har baar sirf ek tukda tha, toh tukde ka size hi sab tay karta tha. Agla khel alag hai: neeche ka number same, upar ka alag. Ab aage chalte hain.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 3091 ms · guard mustsay]: Pehli patti ke 7 barabar hisse hain, har ek 1/7. 3 mein rang hai, toh yeh 3/7. Bhinn ke upar ka 3 bas ginta hai ki kitne hisse liye. Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/5  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 1617 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Bhinn ke neeche wahi 7 rahega, patti waisi hi hai. Upar bas utne gino jitne hisson mein rang bharoge. Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 5 by 7  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1677 ms · guard mustsay]: Bilkul sahi, kyunki hisse wahi 7 hain, rang ab 5 mein, toh 5/7. Ab yahi hisse ek sankhya rekha par: 0 se 1 tak 7 barabar kadam, har kadam 1/7. 5/7 tak pahunchne mein 5 kadam lagte hain. Kadam sab ek hi size ke, bas ginti badalti hai. Kuch poochna hai ab tak?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":5,"label":"5/7"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2906 ms]: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** no hai na  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 2153 ms]: Haan, sahi hai. Dekho, sevenths dono hain, par ginti alag hai: 5/7 mein 5 hisse, 3/7 mein bas 3.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4423 ms · guard wrap,nochoice,wrap]: Theek hai Riya, ruk sakte hain. Tum teen mein se chuno: aage chalein, chhota break lein, ya aaj ke liye ruk jaayein?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

## Agent


