# offtopic-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · ready 3719 ms · guard mustsay,long]: Roti ke 4 hisse karo, waisi doosri ke 8. Yeh patti ek poora hai, 4 barabar hisson mein; rangeen hissa 1/4. Neeche ka 4 batata hai ki kitne hisse. Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > card: Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · ready 1853 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Isko doosri tarah se samajhte hain. Do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 logon wala hissa chhota hota hai. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** 11 wali ka  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 2256 ms · guard leak]: Bilkul sahi. 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. 4 barabar hisson wali patti aur utni hi lambi 8 hisson wali patti mein, 8 wali ka ek hissa 4 wali ke ek hisse se bada hai ya chhota?
  > card: Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** bigger  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (2 miss) · ready 1588 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Zyada hisson ka matlab lamba hissa nahi. Ek hi patti 4 log baantein ya 8 log, socho 8 logon mein har ek ke haath kitna aata hai. Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > card: Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** smaller  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1634 ms · guard mustsay,leak]: Haan, bilkul theek: ek jitni patti mein zyada hisse, toh har hissa chhota. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** 2/8 yaani 1/4 hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 925 ms]: Sahi jawab, kyunki do 1/8 hisse, yaani 2/8, milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Number line par zero se jitna door, fraction utna bada. Is line par 0 se 1 tak ek taraf 3 barabar gap hain, doosri taraf 7. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 792 ms · guard noconfirm]: Haan, sahi hai. 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Aao, yeh sawaal main aur tum saath mein karenge. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2692 ms · guard leak]: Socho, do ek jaise cake hain: ek ko thode log baant rahe hain, doosre ko bahut saare log. Ab dekho, kis cake se har ek ke haath bada hissa aata hai. Do ek jaisi chocolate: hissa kiska bada, kam hisson wali ya zyada wali?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2808 ms]: Cricket ki baat bhi zaroor karenge, thodi der mein. Pehle is sawaal ka jawab do.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 1510 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2106 ms]: Achha, toh tumhe chauka pasand hai! Chalo, jahan the wahin se aage chalte hain. Do ek jaisi chocolate: hissa kiska bada, kam hisson wali ya zyada wali?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2905 ms · guard leak]: Dono chocolate ek jaisi hain, toh jo chocolate kam hisson mein kati, uska har hissa bada hota hai. 1/8 aur 1/2 ke neeche wale number lo: Rahul ki chocolate 8 hisson mein kati hai, aur Sana ki 2 mein. Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2453 ms · guard leak]: Pehla gol 8 barabar hisson mein bata hai aur doosra 2 mein, aur dono ek hi size ke hain. Har gol ka ek hissa dekho. Rahul ko chocolate ka 1/8 mila aur Sana ko 1/2, toh bada hissa kisko mila?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana ka zyada  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1537 ms · guard noconfirm]: Bilkul sahi: 1/2 ka rang, 1/8 ke rang se chaar guna lamba hai. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2327 ms · guard long]: Arre wah, Virat! Achha kiya jo bataya. Theek hai, ab wahin se aage badhte hain jahan ruke the. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 3471 ms · guard ask]: Theek hai, Hindi mein bolti hoon. Dono roti barabar badi hain: ek 10 barabar hisson mein kati, ek 5 mein. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > card: Dono roti barabar badi hain: ek 10 barabar hisson mein kati, ek 5 mein. Kaunsa ek hissa bada hai, 1/10 ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 1747 ms · guard praise,leak,uncorrected]: 1/10 sahi nahi hai. Tumne bada number dekhkar chuna; par dono roti ek jitni badi hain; socho kis roti ke hisse patle honge. Ab tum batao.
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (2 miss) · board up · ready 1741 ms · guard praise,uncorrected]: Nahi, 1/10 theek nahi. Board ki roti ke 10 hisse dekho, har hissa kitna patla hai. Ab yahi roti sirf 5 hisson mein kati socho, aur dono ka ek-ek hissa saath rakho. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (2 miss) · board up · ready 1248 ms · guard twoq]: Haan, pehle tum try karo.
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** one fifth  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 981 ms]: Bilkul sahi, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · board up · ready 799 ms · guard uncorrected]: 1/3, 1/6, 1/12 se baat nahi bani. Sabse chhote se shuru karna hai; aur neeche ka bada number bada hissa nahi banata. Ek hi poora 12 logon mein bate, toh har ek ka hissa 3 logon wale hisse se kaafi chhota hota hai. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis order mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12}]}}

**child:** 1/3, 1/6, 1/12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 (2 miss) · board up · ready 809 ms · guard uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Ek hi poore ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai. Isi baat se teeno fraction ke neeche wale number milao. Ab tumhari baari, apna jawab bolo.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 794 ms]: Haan, bilkul theek. Poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12,"shade":1,"title":"1/12"},{"parts":6,"shade":1,"title":"1/6"},{"parts":3,"shade":1,"title":"1/3"}]}}

**child:** before the mark  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2161 ms]: Sahi jawab, kyunki yeh mark 1/3 hai; gap 3 se zyada hon toh pehla gap chhota hota, aur is mark se pehle khatam hota. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2643 ms · guard mustsay]: Arre haan, cricket! Kya baat hai. Achha, ab padhai ki taraf mudte hain. Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Yahan tak theek hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 1994 ms]: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 4/7 hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 1721 ms · guard mustsay]: Bilkul sahi. Hisse wahi 7, rang ab 4 mein: 4/7. Ab number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Board par zero se chaar gap chalo, toh mark tak pahunchte ho. Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > card: Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2680 ms · guard long,uncorrected]: Nahi, yeh jawab nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti hain, dono 5 barabar hisson mein. Ek se 2 hisse liye, doosri se 4. Har hissa ek hi size ka hai, toh 4 hisse matlab zyada roti. Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne 3 liye, Gopi ne 6. Neha ka ribbon Gopi se kam hai ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne 3 liye, Gopi ne 6. Neha ka ribbon Gopi se kam hai ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal (1 miss) · board up · ready 1587 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Neha ka har liya hua hissa Gopi ke ek liye hue hisse ke saamne rakho, aur dekho kiske liye hue hisse bach jaate hain. Neha ne ek ribbon ka 3/7 liya aur Gopi ne utne hi lambe ribbon ka 6/7, toh Neha ka ribbon kam hai ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne 3 liye, Gopi ne 6. Neha ka ribbon Gopi se kam hai ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** less ribbon  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) · board up · ready 3452 ms · guard long]: Haan, bilkul theek: har hissa 1/7 hai, aur Neha ke 3 hisse Gopi ke 6 hisson se kam hain. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > card: Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":6,"label":"6/7"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (2 miss) · board up · ready 2453 ms · guard samecard]: Abhi yeh sahi nahi hai. Neeche ka same 7 batata hai ki dono ke hisse ek size ke hain. Isse dono fraction barabar nahi ho jaate; dekho dono mein kitne-kitne hisse liye. 2/7 aur 4/7 mein bada kaun hai, ya yeh barabar hain?
  > card: Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** chaar bata saat  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 1897 ms · guard mustsay]: Bilkul sahi. 4/7 zero se 4 gap door, 2/7 sirf 2. Yeh line 0 se 1 tak 5 barabar gap mein kati hai, har gap 1/5. Upar wala number batata hai ki zero se kitne gap chalna hai. Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** 3/5 wali  _(correct)_

**Asha** [explain · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 899 ms · guard mustsay]: Sahi jawab, kyunki Mona teen gap chali, Sonu sirf ek. Ek patti 3 hisson mein kati aur ek 10 mein, toh hisse alag size ke; yahan sirf ginkar faisla nahi hota. Tab dono ka aadha socho: ek aadhe se aage, doosra peeche, toh aage wala bada. Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Bada kaun hai, 2/3 ya 3/10?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"},{"num":3,"label":"3/5"}]}}

**child:** 2/3 bada hai  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2077 ms · guard leak]: Haan, sahi hai. 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe tak bhi nahi pahunchta. Chalo, ab ek sawaal hum saath mein karte hain. Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Hisse ek size ke; faisla kaun karega, upar wala number ya neeche wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1156 ms]: Aaj ke liye itna hi, phir milenge!

## Agent


