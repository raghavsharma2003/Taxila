# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj fractions compare karenge. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1911 ms]: Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 1523 ms]: Upar yeh rahi ek poori patti. 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Fraction ke neeche ka 4 matlab patti ke 4 barabar hisse. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2313 ms · guard screenmismatch]: Ek hi roti socho, pehle 4 log baantein, phir 8 log. Log badhe, toh har ek ke haath ka hissa kaisa hua, yeh socho. Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2074 ms · guard mustsay]: Upar yeh rahi ek poori patti. 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. Fraction ke neeche ka 4 matlab patti ke 4 barabar hisse. Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 3065 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Isko thoda doosri tarah se samajhte hain. Line dekho, 0 se 1 tak. Neeche ise 12 barabar hisson mein kaata hai. 12 ek bada number hai, par uska ek hissa zero ke bilkul paas ruk jaata hai. Hisse jitne zyada, har hissa utna chhota. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1958 ms]: Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa hissa lamba, 1/8 wala ya 1/12 wala?
  > card: Patang ki do dor, ek jitni lambi. Ek dor se 1/8 kaata, doosri se 1/12. Kaunsa hissa lamba, 1/8 wala ya 1/12 wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1}}

**child:** the 1/8 one  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 945 ms]: Haan, sahi hai, kyunki ek jitni dor mein 8 hisse 12 hisson se kam hain, toh 1/8 ka hissa 1/12 wale se lamba. Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > card: Neeche wahi patti 8 barabar hisson mein kati hai. Ab iska ek hissa upar wale ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[8,12],"from":0,"to":1,"marks":[[1,8],[1,12]]}}

**child:** smaller  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2048 ms · guard long]: Bilkul sahi. Dekho, dono patti barabar lambi hain, par upar wali 4 hisson mein hai, neeche wali 8 mein, isliye neeche ka hissa chhota hai. Ab wahi patti, par 8 barabar hisse, toh ek hissa 1/8. Dono patti ek jitni lambi hain, isliye neeche ke hisse upar wale hisson ke theek neeche baithte hain. Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 2594 ms · guard samecard]: Dekho, pehle mein 4 barabar tukde hain, aur doosre mein 8 barabar tukde hain. Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** ek bata chaar  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1983 ms · guard mustsay,screenmismatch]: Haan, bilkul theek, kyunki neeche ke do 1/8 hisse milkar upar ke ek hisse jitne lambe hain, aur upar ka woh hissa 1/4 hai. Ab ek number line lo, 0 se 1 tak. Upar ise 3 barabar hisson mein kaata hai, neeche 7 mein. Line ka niyam simple hai: zero se jitna door, utna bada. Isi niyam se, 1/8 aur 1/4 ko kisi bhi line par rakho, toh 1/8 zero ke zyada paas rukega: 1/8 < 1/4. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1589 ms]: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2100 ms · guard long]: Haan, sahi hai. Dekho, 1/3 ka hissa 1/7 ke hisse se bada hai, toh 1/3 zero se aage jaakar rukta hai. Rahul aur Sana ke paas ek jaise chocolate bar hain. Rahul ko apne bar ka 1/8 mila, Sana ko apne ka 1/2. Bada hissa kiske paas hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2137 ms]: Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek hissa, kyunki upar ka number batata hai kitne hisse mile, aur ek-ek mile, toh ab baat sirf size ki hai. Yeh kadam saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 1982 ms]: Phir dekho, kiska bar kitne hisson mein kata: upar wala Rahul ka, neeche wala Sana ka: Rahul ka bar 8 hisson mein, Sana ka sirf 2 mein, kyunki hisson ki ginti se hi pata chalta hai ki ek hissa kitna bada hai.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3798 ms · guard leak]: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3378 ms · guard praise,affirms,leak]: Haan, pehle tum try karo. Lo, ab yeh dekho. Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana ka  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 923 ms]: Haan, sahi hai. Toh poora jawab: Sana ko mila, 1/2 wala hissa, kyunki 8 bada number hai, par 8 hisson wale bar ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1651 ms]: Achha, isko Hindi mein bolti hoon. Dono roti ek jaisi hain. Jitne kam log baantenge, har ek ko utna bada hissa milega. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 5 wali roti ka tukda  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2303 ms]: Bilkul sahi. Dekho, 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 1837 ms · guard samecard,flat,uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Sirf neeche ke number dekho: teen, barah, chhe. Jiska neeche sabse bada, uska hissa sabse chhota. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis kram mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 3614 ms · guard leak,flat]: Cricket ki baat bhi hogi, bas yeh mukabla khatam ho jaaye. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Sabse chhote se shuru karke kram se lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/12, 1/6, 1/3 hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · board up · ready 2779 ms]: Haan, sahi hai, kyunki poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Cricket mein tumhe kya karna sabse achha lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** catch pakadna  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 5227 ms · guard long]: Achha, toh tumhara favourite hai catch pakadna. Ab wapas apne kaam par aate hain. Yeh line 0 se 1 tak 3 barabar hisson mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Woh pehla mark 1/5 se bada hai ya chhota?
  > card: Yeh line 0 se 1 tak 3 barabar hisson mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Woh pehla mark 1/5 se bada hai ya chhota?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 955 ms · guard noconfirm]: Bilkul sahi. Dekho, mark 1/3 hai; 3 mein kati line ka hissa 5 mein kati line ke hisse se bada, isliye mark 1/5 se bada. Agle khel mein neeche ka number same rahega aur upar ka badlega, toh ab hisse ginne honge.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2088 ms · guard mustsay]: Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ke upar ka 2 bas ginta hai ki kitne hisse liye. Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/4  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 3009 ms · guard flat,uncorrected]: Nahi, yeh jawab nahi hai. Fraction ke neeche wahi 7 rahega, patti waisi hi hai. Upar bas utne gino jitne hisson mein rang bharoge. 7 barabar hisson wali patti ke 4 hisson mein rang bharein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 3986 ms · guard notheard]: Koi baat nahi, isko ek baar aur aaram se dekhte hain. Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 4 by 7  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1615 ms · guard mustsay]: Haan, sahi hai, kyunki hisse wahi 7 hain, rang ab 4 mein, toh 4/7. Ab yahi hisse ek number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. 4/7 tak pahunchne mein 4 gap lagte hain. Gap sab ek hi size ke, bas ginti badalti hai. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2998 ms]: Rohan kehta hai, 2/7 aur 4/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** yes  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 1834 ms]: Yeh jawab sahi nahi hai. Fraction ke neeche ka 7 batata hai ki poore ke 7 barabar hisse hain, toh line ka har gap 1/7 ka hai. Fraction ke upar ka number ginta hai kitne gap paar kiye. Gap ek jaise hon, toh zyada gap matlab zero se zyada door. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2160 ms]: Ribbon ke 7 barabar hisse hain. Zoya ne 2 liye, Gopi ne 6. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > card: Ribbon ke 7 barabar hisse hain. Zoya ne 2 liye, Gopi ne 6. Zyada ribbon kiske paas, Zoya ke ya Gopi ke?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** Gopi hai na  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) · board up · ready 2224 ms]: Bilkul sahi, kyunki har hissa ribbon ka 1/7 hai, aur Gopi ka 6/7, 2/7 se zyada hai. Rohan kehta hai, 2/7 aur 4/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, dono sevenths hi toh hain. Kya Rohan sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":6,"label":"6/7"}]}}

**child:** nahi  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 1022 ms · guard mustsay]: Haan, sahi hai. Dekho, sevenths dono hain, par ginti alag hai: 4/7 mein 4 hisse, 2/7 mein bas 2. Yeh number line 0 se 1 tak 5 barabar hisson mein bati hai. Line par zero se jitna door, utna bada. Neeche ka number same ho, toh faisla upar wala number karta hai: woh batata hai kitne gap paar karne hain. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 2171 ms]: Isi line par zero se zyada door kaun hoga, 2/5 ya 4/5?
  > card: Isi line par zero se zyada door kaun hoga, 2/5 ya 4/5?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** 4/5 zyada hai  _(correct)_

**Asha** [explain · beat s2:explain:e4 · board up · ready 2332 ms · guard mustsay,leak]: Haan, bilkul theek, kyunki dono ke gap 1/5 ke hain, aur 4/5 chaar gap paar karta hai, 2/5 sirf do. Yeh do barabar patti dekho: upar wali 3 hisson mein kati hai, neeche wali 10 mein. Fraction ke neeche ke number alag hain, toh alag size ke hisse: 10 wali ke hisse patle, 3 wali ke mote. Same size ke hisse tabhi hote hain jab fraction ke neeche ka number same ho. Yahan sirf ginne se faisla nahi hota.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":2,"label":"2/5"},{"num":4,"label":"4/5"}]}}

**child:** achha  _(no_evidence)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 5329 ms · guard long]: Ek bar ka 2/3 lo, aur usi size ke doosre bar ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > card: Ek bar ka 2/3 lo, aur usi size ke doosre bar ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** two thirds  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 1037 ms]: Bilkul sahi. Dekho, 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe, yaani 5/10, tak bhi nahi pahunchta. Meena aur Raju ke cake ek jaise hain. Meena ne apne cake ka 5/8 khaya, Raju ne apne ka 3/8. Kam cake kisne khaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2871 ms]: Pehle dono ka neeche wala number dekho: dono mein 8, toh har hissa 1/8, kyunki dono poore ek jaise hain aur dono 8 barabar hisson mein bate hain. Yeh kadam samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 2110 ms]: Ab upar ke number milao: Meena ne 1/8 wale 5 khaye, Raju ne 3, kyunki upar ka number gin kar batata hai kitne hisse khaye gaye.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked · board up · ready 1874 ms]: Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** they ate the same  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked (1 miss) · board up · ready 2173 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Hisse ek jaise hain, toh kam hisse matlab kam khaya. Ab 5 aur 3 milao. Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Toh kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** Raju ke  _(correct)_

**Asha** [practice · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 · board up · ready 4228 ms · guard leak,long]: Haan, sahi hai. Toh poora jawab: Raju ne, sirf 3/8, kyunki hisse ek size ke hain aur Raju ke kam hain, isliye line par bhi 3/8 pehle aata hai, 5/8 baad mein. Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 (1 miss) · board up · ready 1381 ms]: 0 sahi nahi hai. Cake ek jaise, hisse bhi ek size ke. Bas upar wale numberon ka farak dekho. Pinky ne cake ka 1/6 khaya aur bhai ne 4/6, toh bhai ne kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"title":"Pinky"},{"parts":6,"title":"Bhai"}]}}

**child:** haan, samajh aaya  _(incorrect)_

**Asha** [repair · beat s2:check:c0 · board up · ready 3128 ms · guard praise,uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 3 hai, kyunki dono ke hisse 1/6 ke hain, toh 4/6 mein se 1/6 hatao, 3 hisse bachte hain. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 · board up · ready 2224 ms]: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"title":"Cake"},{"parts":10,"title":"Cake"}]}}

**child:** Ben, 3/5  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 · board up · ready 1142 ms]: Bilkul sahi. Dekho, Zoya ka 5/10 bas aadha cake hai, jabki Ben ka 3/5 aadhe se aage hai. Do ek jaise cake hain: ek ke 4 barabar hisson mein se 3 bache, doosre ke 6 mein se 5. Dono mein poore se ek hissa kam hai. Kaunsa chhota hai, 3/4 ya 5/6?
  > card: Do ek jaise cake hain: ek ke 4 barabar hisson mein se 3 bache, doosre ke 6 mein se 5. Dono mein poore se ek hissa kam hai. Kaunsa chhota hai, 3/4 ya 5/6?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"shade":3,"title":"3/5"},{"parts":10,"shade":5,"title":"5/10"}]}}

**child:** 3/4 chhota hai  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1525 ms]: Haan, sahi hai, kyunki 3/4 mein poore se 1/4 ki kami hai, 5/6 mein bas 1/6 ki, aur jiski kami badi, woh chhota. Agle khel mein upar ka number same rahega aur neeche ka badlega.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,6],"from":0,"to":1,"marks":[[3,4],[5,6]]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 · board up · ready 2541 ms · guard mustsay]: Upar ki patti 5 barabar hisson mein hai, toh har hissa 1/5. Teen hisson mein rang hai: 3/5. Neeche isi size ki patti 8 barabar hisson mein kati hai, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > card: Neeche isi size ki patti 8 barabar hisson mein kati hai, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"?"}]}}

**child:** 8/3  _(incorrect)_

**Asha** [hint · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 (1 miss) · board up · ready 2188 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Fraction mein neeche wahi aata hai jitne hisse kate, upar utne jitne rang wale. Neeche wali patti mein 8 kate, 3 rang wale. 8 barabar hisson wali patti ke 3 hisson mein rang ho, toh kaunsa fraction banta hai?
  > card: Neeche isi size ki patti 8 barabar hisson mein kati hai, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"?"}]}}

**child:** haan, samajh aaya  _(incorrect)_

**Asha** [repair · beat s3:explain:e1 · board up · ready 3231 ms · guard praise,affirms,uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 3/8 hai, kyunki patti 8 hisson mein kati aur 3 mein rang hai, toh 3/8; upar wali 3/5 thi. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"3/8"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s3:explain:e1 · board up · ready 2175 ms]: Iska jawab 3/8 hai, kyunki neeche ka har hissa 1/8 hai, aur aise teen hisse rangeen hain, toh teen 1/8 milkar 3/8. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"3/8"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e2 · board up · ready 2185 ms · guard mustsay]: Ab dono ko ek number line par dekho, 0 se 1 tak: upar 5 barabar hisse, har ek 1/5; neeche 8, har ek 1/8. 3/8 matlab neeche ke teen gap. Ginti dono mein 3 hi hai, par gap ka size alag hai.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 · board up · ready 2753 ms]: Tanvi kehti hai ki 3/5, 3/8 se zyada hai. Kya Tanvi sahi hai, haan ya nahi?
  > card: Tanvi kehti hai ki 3/5, 3/8 se zyada hai. Kya Tanvi sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1}}

**child:** yes hai na  _(correct)_

**Asha** [explain · beat s3:explain:e3 · board up · ready 3237 ms · guard mustsay,leak]: Haan, sahi hai, kyunki ginti dono mein 3 hai, par 1/5 ke hisse 1/8 wale hisson se bade hain, isliye 3/5 zyada, aur Tanvi sahi hai. Jab hisson ki ginti barabar ho, toh hisse ka size faisla karta hai. Jo patti kam hisson mein kati, uske hisse bade hote hain, aur bade hisson ki utni hi ginti zyada hoti hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1,"marks":[[3,5],[3,8]]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s3:explain:e3 · check script:c5-maths-ch02-t02-s3:ask:e3 · board up · ready 1968 ms]: Ginti dono mein 2 hai. Ab bas yeh socho: 5 hisson wali patti ka ek hissa bada hai, ya 9 wali ka. Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > card: Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":5,"shade":0,"label":""}]}}

**child:** 2/5 hai na  _(correct)_

**Asha** [explain · beat s3:explain:e4 · check script:c5-maths-ch02-t02-s3:ask:e4 · board up · ready 3169 ms · guard mustsay,leak]: Bilkul sahi. Dekho, dono mein 2 hisse hain, aur 1/5 ka hissa 1/9 wale se bada, isliye 2/5 zyada. Is line par 0 se 1 tak upar 4 barabar hisse hain, neeche 8. Upar ka pehla mark 1/4 hai, aur neeche theek usi jagah 2/8 aata hai. Isi tarah upar ke har mark ko neeche ke gaps mein gin sakte ho. Isi line par socho: kaunsa bada hai, 2/4 ya 5/8?
  > card: Isi line par socho: kaunsa bada hai, 2/4 ya 5/8?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":2,"label":"2/9"},{"parts":5,"shade":2,"label":"2/5"}]}}

**child:** 8/5  _(incorrect)_

**Asha** [hint · beat s3:explain:e4 · check script:c5-maths-ch02-t02-s3:ask:e4 (1 miss) · board up · ready 962 ms]: 8/5 sahi nahi hai. Upar ka har hissa neeche ke do hisson jitna hai. Ab 2/4 ko bhi neeche ke hisson mein gino. Isi line par socho: kaunsa bada hai, 2/4 ya 5/8?
  > card: Isi line par socho: kaunsa bada hai, 2/4 ya 5/8?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1}}

**child:** 5/8 wala  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:problem · board up · ready 1188 ms]: Haan, bilkul theek, kyunki 2/4 ko 1/8 ke hisson mein badlo toh 4/8 banta hai, aur 5/8 usse ek hissa aage. Farhan aur Isha ke chocolate bar ek jaise hain. Farhan ne apne bar ka 2/7 khaya, Isha ne apne ka 2/3. Zyada kisne khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[2,4],[5,8]]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 1787 ms]: Pehle upar ke number dekho: dono mein 2, yaani dono ne do-do hisse khaye, kyunki ginti barabar hai, isliye ab sirf hisse ka size dekhna baaki hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step2 · board up · ready 2165 ms]: Phir har hisse ka size likho: Farhan ka har hissa 1/7, Isha ka 1/3, kyunki Farhan ka bar 7 hisson mein kata hai, Isha ka usi size ka bar sirf 3 mein.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t02-s3:ask:worked · board up · ready 3066 ms · guard leak,long]: Dono ke do-do hisse, par Isha ke hisse 3 hisson wale bar se hain, Farhan ke 7 hisson wale se. Toh zyada kisne khaya, Farhan ne ya Isha ne?
  > card: Dono ke do-do hisse, par Isha ke hisse 3 hisson wale bar se hain, Farhan ke 7 hisson wale se. Toh zyada kisne khaya, Farhan ne ya Isha ne?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":3,"shade":0,"label":""}]}}

**child:** Isha hai na  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t02-s3:c1 · board up · ready 1830 ms]: Haan, sahi hai. Dekho, dono ne 2 hisse khaye, par Isha ke 1/3 wale hisse Farhan ke 1/7 wale hisson se bade the. Toh poora jawab: Isha ne, 2/3. Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. Teeno se chaar-chaar hisse liye gaye. 4/5, 4/9 aur 4/7 ko chhote se bade ke kram mein lagao.
  > card: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. Teeno se chaar-chaar hisse liye gaye. 4/5, 4/9 aur 4/7 ko chhote se bade ke kram mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":3,"shade":2,"label":"2/3"}]}}

**child:** they are all equal  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t02-m-tops-only · board up · ready 3298 ms · guard flat,long,uncorrected]: Nahi, yeh jawab nahi hai. Ek aur raasta aazmaate hain. Upar ki patti 6 hisson mein hai, neeche ki 10 mein. Dono patti ek jitni lambi hain. Ek-ek hissa saath rakh kar dekho, kaunsa lamba hai. Ginti same ho, toh hisse ka size hi faisla karta hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":9,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s3:check:then:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s3:then:c5-maths-ch02-t02-m-tops-only · board up · ready 2873 ms]: Patti dono barabar lambi hain. Jo patti kam hisson mein kati, uska ek hissa doosri patti ke ek hisse ke saath rakh kar dekho. Ek jaise do bar. Ek ke 6 barabar hisson mein se 4 rangeen, doosre ke 10 mein se 4. Rang kismein zyada, 4/6 ya 4/10?
  > card: Ek jaise do bar. Ek ke 6 barabar hisson mein se 4 rangeen, doosre ke 10 mein se 4. Rang kismein zyada, 4/6 ya 4/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** they are equal  _(misconception)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s3:then:c5-maths-ch02-t02-m-tops-only (1 miss) · board up · ready 3487 ms · guard leak,samecard,uncorrected]: Yeh jawab sahi nahi hai. Ginti barabar, 4 aur 4. 6 mein kate bar ka hissa 10 mein kate bar ke hisse se lamba. Rang kismein zyada, 4/6 ya 4/10?
  > card: Ek jaise do bar. Ek ke 6 barabar hisson mein se 4 rangeen, doosre ke 10 mein se 4. Rang kismein zyada, 4/6 ya 4/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** four sixths  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t02-s3:c1 (1 miss) · board up · ready 1086 ms]: Bilkul sahi, kyunki chaar-chaar hisse dono mein, par 1/6 ka hissa 1/10 ke hisse se lamba hai, isliye 4/6 zyada hai. Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. Teeno se chaar-chaar hisse liye gaye. 4/5, 4/9 aur 4/7 ko chhote se bade ke kram mein lagao.
  > card: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. Teeno se chaar-chaar hisse liye gaye. 4/5, 4/9 aur 4/7 ko chhote se bade ke kram mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":4,"label":"4/6"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 4/9, phir 4/7, phir 4/5  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t02-s3:c2 · board up · ready 1039 ms]: Haan, sahi hai. Dekho, teeno mein 4 hisse, par 1/9 ka hissa sabse chhota aur 1/5 ka sabse bada; isliye 4/9, phir 4/7, phir 4/5. Anjali aur Gopi ke paas ek jaisi ribbon ki patti hai. Anjali apni patti ko 12 barabar hisson mein kaatkar 5 leti hai, aur Gopi apni patti 6 mein kaatkar 5 leta hai. Kiske paas lamba hissa hai, Anjali ke ya Gopi ke?
  > card: Anjali aur Gopi ke paas ek jaisi ribbon ki patti hai. Anjali apni patti ko 12 barabar hisson mein kaatkar 5 leti hai, aur Gopi apni patti 6 mein kaatkar 5 leta hai. Kiske paas lamba hissa hai, Anjali ke ya Gopi ke?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":4,"label":"4/9"},{"parts":7,"shade":4,"label":"4/7"},{"parts":5,"shade":4,"label":"4/5"}]}}

**child:** Gopi, 5/6  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t02-s3:c3 · board up · ready 3568 ms · guard leak]: Haan, bilkul theek: dono ke paanch-paanch hisse, par Gopi ka har hissa Anjali ke hisse ka do guna, toh Gopi ke paanch zyada lambe. Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Har pizza se bas ek hissa gayab hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > card: Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Har pizza se bas ek hissa gayab hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":5,"label":"5/12"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** 8/9 wala  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 2 ms]: Sahi jawab, kyunki 8/9 mein bas 1/9 ki kami hai, 6/7 mein 1/7 ki, aur 1/9 ki kami chhoti hai. Do ek jaisi patti hain: ek ke 10 barabar hisson mein se 7 liye, doosri ke 12 mein se 7. Kaunsa chhota hai, 7/10 ya 7/12?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,9],"from":0,"to":1,"marks":[[6,7],[8,9]]}}

**child:** pehle wale step se pata chala  _(incorrect)_

**Asha** [wrap · beat end:teachback:teachback:answer · board up · ready 1902 ms]: Iska jawab hai 7/12, kyunki dono se 7 hisse liye, par 12 hisson wali patti ka har hissa chhota hai, isliye 7/12 chhota hai. Aaj ka paath yeh tha ki ek hi poore ko jitne zyada barabar hisson mein kaatein, har hissa utna chhota hota hai. Neeche ka number same ho toh upar ka number faisla karta hai, aur upar ka number same ho toh hisse ka size faisla karta hai. Aaj ke liye itna hi, phir milenge!
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

## Agent


