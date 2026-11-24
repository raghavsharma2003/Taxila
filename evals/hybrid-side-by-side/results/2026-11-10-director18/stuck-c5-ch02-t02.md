# stuck-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher hoon. Aaj fractions compare karenge—jaise cricket scores. Tumhe cricket ya cooking, kya zyada pasand hai?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2971 ms]: Socho, do bilkul ek jaise cake. Ek ke 4 barabar tukde kiye, doosre ke 8. Tumhe bas ek tukda milega, kisi bhi cake se.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 4027 ms · guard long]: Upar yeh rahi ek poori patti. 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Bhinn ke neeche ka 4 matlab patti ke 4 barabar tukde. Neeche wahi patti 8 barabar hisson mein kati hai. Ab ek hissa pehle se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab ek hissa pehle se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":"?"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3510 ms · guard mustsay,twoq]: Ek hi roti socho, pehle 4 log baantein, phir 8 log. Log badhe, toh har ek ke haath ka tukda kaisa hua, yeh socho. Neeche wahi patti 8 barabar hisson mein kati hai. Ab ek hissa pehle se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab ek hissa pehle se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":"?"}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 gave · board up · ready 3271 ms · guard mustsay]: Theek hai, ab Hindi mein. Is sawaal ka sahi jawab: chhota, kyunki 2 patti, lambai ek hi, par neeche wali 8 mein bati hai, toh uska har hissa chhota. Ab wahi patti, par 8 barabar hisse, toh ek hissa 1/8. Dekho, upar wali patti ka har hissa neeche beech se do ho gaya. Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > card: Patti ek hi size ki ho, toh kaunsa ek hissa bada hai, 1/4 ya 1/8?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** 1/4 is bigger  _(correct)_

**Asha** [probe · beat s1:explain:e2 · board up · ready 1622 ms]: Haan, sahi hai: do 1/8 jodo tab jaakar ek 1/4 banta hai, matlab 1/4 bada hai.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 3263 ms · guard mustsay]: Achha. Ab ek sankhya rekha lo, 0 se 1 tak. Upar ise 3 barabar hisson mein kaata hai, neeche 7 mein. Rekha ka niyam simple hai: zero se jitna door, utna bada. Isi niyam se, 1/8 aur 1/4 ko kisi bhi rekha par rakho, toh 1/8 zero ke zyada paas rukega: 1/8 < 1/4. Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1507 ms · guard mustsay]: Rekha dekho: upar 3 hisse, neeche 7. Jiske hisse kam, uska pehla kadam lamba. Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1801 ms · guard uncorrected]: 1/7 sahi nahi hai. Rekha dekho, 0 se 1 tak. Neeche ise 12 barabar hisson mein kaata hai. 12 bada number hai, par uska ek hissa, 1/12, zero ke bilkul paas ruk jaata hai, jabki 1/2 rekha ke beech mein hai. Hisse jitne zyada, har tukda utna chhota. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2658 ms]: Do barabar pattiyaan: ek 6 barabar hisson mein; ek 12 barabar hisson mein. Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/12. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > card: Ravi aur Zoya ki bottle ek jaisi. Ravi ne 1/6 nikala, Zoya ne 1/12. Zyada kisne nikala, Ravi ne ya Zoya ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,12],"from":0,"to":1}}

**child:** 1/6 wali  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 1247 ms]: Haan, sahi hai, kyunki 1/6 ka hissa 1/12 ke hisse ka do guna hai, toh ek jaisi bottle mein Ravi ne zyada nikala. Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi rekha par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[6,12],"from":0,"to":1,"marks":[[1,6],[1,12]]}}

**child:** 1/3 hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2329 ms]: Bilkul sahi. Dekho, 1/3 ka hissa 1/7 ke hisse se bada hai, toh 1/3 zero se aage jaakar rukta hai. Rahul aur Sana ke paas ek jaise chocolate bar hain. Rahul ko apne bar ka 1/6 mila, Sana ko apne ka 1/3. Bada tukda kiske paas hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2006 ms]: Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek tukda, kyunki upar ka number batata hai kitne tukde mile, aur ek-ek mile, toh ab baat sirf size ki hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2865 ms]: Pehle yeh hissa. Phir dekho, kiska bar kitne hisson mein kata: upar wala Rahul ka, neeche wala Sana ka: Rahul ka bar 6 hisson mein, Sana ka sirf 3 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek tukda kitna bada hai.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 4597 ms · guard leak]: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3074 ms · guard twoq]: Bar dono barabar hain. Jo bar kam hisson mein kata, uska tukda mota. Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada tukda kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 2478 ms]: Theek hai Riya, tum khud karo.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** Sana ka  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2610 ms]: Haan, sahi hai. Toh poora jawab: Sana ko mila, 1/3 wala tukda, kyunki 6 bada number hai, par 6 hisson wale bar ka tukda chhota hota hai, isliye 1/6 chhota aur 1/3 bada. Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 2719 ms · guard uncorrected]: 1/10 sahi nahi hai. Roti wahi hai. Jitne kam log baantenge, har ek ko utna bada tukda milega. Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar tukde hain, doosri ke 5. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 gave · board up · ready 2188 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 1/5 tha, kyunki 5 tukdon wali roti ka 1/5, 10 tukdon wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"1/10"},{"parts":5,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 1684 ms · guard uncorrected]: 1/3, 1/6, 1/12 nahi, yeh jawab theek nahi baitha. Sirf neeche ke number dekho: teen, barah, chhe. Jiska neeche sabse bada, uska tukda sabse chhota. Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen bhinn lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 gave · board up · ready 5892 ms · guard long,uncorrected]: Yeh jawab sahi nahi hai. Iska jawab 1/12, 1/6, 1/3 tha, kyunki poora ek ho toh 1/12 ke tukde sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > card: Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** smaller  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 (1 miss) · board up · ready 2001 ms · guard twoq,uncorrected]: Abhi yeh sahi nahi hai. Pehle us nishaan ka naam socho: poore ke 4 hisson mein se pehla hissa. Phir use 1/8 ke saath rakh kar dekho. Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > card: Yeh rekha 0 se 1 tak 4 barabar hisson mein bati hai, aur 0 ke baad pehle nishaan par question mark hai. Woh question mark wala nishaan 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** smaller  _(misconception)_

**Asha** [repair · beat s1:check:c3 · board up · ready 3685 ms · guard flat,uncorrected]: Nahi, yeh theek nahi hai. Is sawaal ka sahi jawab: bada, kyunki woh nishaan 1/4 hai, aur ek 1/4 mein do 1/8 samaate hain, isliye woh 1/8 se bada. Ab tak har baar sirf ek tukda tha, toh tukde ka size hi sab tay karta tha. Agla khel alag hai: neeche ka number same, upar ka alag. Ab aage chalte hain.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s2:explain:e1 · board up · ready 2403 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/5  _(incorrect)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 1608 ms]: Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/5  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 1163 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Bhinn ke neeche wahi 7 rahega, patti waisi hi hai. Upar bas utne gino jitne hisson mein rang bharoge. Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 5 hisson mein rang bhar dein, toh kaunsa bhinn banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/5  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1619 ms · guard mustsay,uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 5/7 hai, kyunki hisse wahi 7 hain, rang ab 5 mein, toh 5/7. Ab yahi hisse ek sankhya rekha par: 0 se 1 tak 7 barabar kadam, har kadam 1/7. 5/7 tak pahunchne mein 5 kadam lagte hain. Kadam sab ek hi size ke, bas ginti badalti hai. Kuch poochna hai ab tak?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":5,"label":"5/7"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2944 ms]: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 3/7 aur 5/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** no  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 3017 ms · guard nowhy]: Haan, sahi hai. Dekho, sevenths dono hain, par ginti alag hai: 5/7 mein 5 hisse, 3/7 mein bas 3.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":3,"label":"3/7"},{"num":5,"label":"5/7"}]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 3092 ms]: Achha. Yeh sankhya rekha 0 se 1 tak 5 barabar hisson mein bati hai. Rekha par zero se jitna door, utna bada. Neeche ka number same ho, toh faisla upar wala number karta hai: woh batata hai kitne kadam chalna hai. Isi rekha par zero se zyada door kaun hoga, 2/5 ya 4/5?
  > card: Isi rekha par zero se zyada door kaun hoga, 2/5 ya 4/5?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** they are equal  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 4679 ms · guard long,uncorrected]: Nahi, yeh jawab nahi hai. Bhinn ke neeche ka 10 bas hisse ka size batata hai: is rekha ke sab kadam 1/10 ke hain, ek hi size ke. 4/10 ho ya 8/10, hisse wahi hain. 8/10 ke paas aise zyada hisse hain, isliye woh zero se door hai, aur bada. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2823 ms]: Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > card: Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1}}

**child:** they have the same  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal (1 miss) · board up · ready 4640 ms · guard leak,uncorrected]: Yeh jawab sahi nahi hai. Ribbon ke sab tukde ek size ke hain, jaise rekha ke kadam. Toh jiske haath zyada tukde, uske paas zyada ribbon. Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > card: Ribbon ke 10 barabar tukde hain. Zoya ne 2 liye, Gopi ne 7. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1}}

**child:** Gopi, 7/10  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 (1 miss) · board up · ready 1641 ms]: Haan, sahi hai, kyunki har tukda ribbon ka 1/10 hai, aur Gopi ka 7/10, 2/10 se zyada hai. Isi rekha par zero se zyada door kaun hoga, 2/5 ya 4/5?
  > card: Isi rekha par zero se zyada door kaun hoga, 2/5 ya 4/5?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":2,"label":"2/10"},{"num":7,"label":"7/10"}]}}

**child:** they are equal  _(misconception)_

**Asha** [explain · beat s2:explain:e4 · board up · ready 2960 ms · guard mustsay,uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 4/5 hai, kyunki kadam dono ke 1/5 ke hain, aur 4/5 chaar kadam chalta hai, 2/5 sirf do. Yeh do barabar patti dekho: upar wali 3 hisson mein kati hai, neeche wali 10 mein. Bhinn ke neeche ke number alag hain, toh alag size ke hisse: 10 wali ke hisse patle, 3 wali ke mote. Same size ke hisse tabhi hote hain jab bhinn ke neeche ka number same ho. Yahan sirf ginne se faisla nahi hota. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":2,"label":"2/5"},{"num":4,"label":"4/5"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 2627 ms]: Ek bar ka 2/3 lo, aur usi size ke doosre bar ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > card: Ek bar ka 2/3 lo, aur usi size ke doosre bar ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** 3/10  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-tops-only · board up · ready 3025 ms · guard leak,uncorrected]: 3/10 nahi, yeh jawab theek nahi baitha. Upar ki patti 4 hisson mein kati hai, neeche ki 12 mein. Upar ka ek 1/4 hissa neeche ke teen 1/12 hisson jitna lamba hai. Toh 2/12, do tukde hokar bhi, ek 1/4 se chhota hai. Tukde tabhi gino, jab sab ek size ke hon. Ab isi par ek sawaal.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** achha  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-tops-only · board up · ready 3326 ms]: Do ek jaisi patti: ek ke 4 barabar hisse, doosri ke 12. Kaun zyada hai, 2/4 ya 5/12?
  > card: Do ek jaisi patti: ek ke 4 barabar hisse, doosri ke 12. Kaun zyada hai, 2/4 ya 5/12?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 5/12  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-tops-only (1 miss) · board up · ready 3778 ms · guard leak,samecard]: 5/12 se baat nahi bani. 12 wali patti ke teen tukde, 4 wali patti ke ek tukde jitne hain. Toh 4 wali patti ke tukdon ko 12 wale tukdon mein badal ke dekho. Do ek jaisi patti: ek ke 4 barabar hisse, doosri ke 12. Kaun zyada hai, 2/4 ya 5/12?
  > card: Do ek jaisi patti: ek ke 4 barabar hisse, doosri ke 12. Kaun zyada hai, 2/4 ya 5/12?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 5/12  _(misconception)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 (1 miss) gave · board up · ready 2242 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 2/4 tha, kyunki 2/4 barabar hai 6/12 ke, jo 5/12 se ek hissa aage hai. Ek bar ka 2/3 lo, aur usi size ke doosre bar ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > card: Ek bar ka 2/3 lo, aur usi size ke doosre bar ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":5,"label":"5/12"}]}}

**child:** 2/3 wala  _(correct)_

**Asha** [probe · beat s2:explain:e4 · board up · ready 4029 ms · guard nowhy]: Haan, sahi hai. Dekho, 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe, yaani 5/10, tak bhi nahi pahunchta.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 5186 ms · guard wrap]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

## Agent


