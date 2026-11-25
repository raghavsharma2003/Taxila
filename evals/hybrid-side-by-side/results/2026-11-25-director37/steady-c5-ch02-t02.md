# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · ready 3154 ms · guard mustsay,long,twoq]: Roti ke 4 hisse karo, waisi doosri ke 8. Yeh patti ek poora hai, 4 barabar hisson mein; rangeen hissa 1/4. Neeche ka 4 batata hai ki kitne hisse. Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > card: Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · ready 2278 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 logon wala hissa chhota hota hai. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** 1/9  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1739 ms · guard leak,uncorrected]: Nahi, 1/9 theek nahi. 9 chhota number hai, par dor utni hi lambi hai. Ek hi dor jitne kam hisson mein bate, har hissa utna lamba. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1864 ms · guard leak]: Dono dor ek jitni lambi hain; socho ki kis dor par zyada baar kainchi chali. Ab tum batao.
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 11 wali ka  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 2375 ms · guard leak]: Sahi jawab, kyunki 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > card: Socho, isi patti jitni lambi doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** 8 wala hissa chhota  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1527 ms · guard mustsay]: Haan, sahi hai. Ek jitni patti mein zyada hisse, toh har hissa chhota. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** 1 hisse ke barabar  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1901 ms · guard mustsay,noconfirm]: Bilkul sahi: do 1/8 hisse, yaani 2/8, milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Number line par zero se jitna door, fraction utna bada. Is line par 0 se 1 tak ek taraf 3 barabar gap hain, doosri taraf 7. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 1/7  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 878 ms · guard twoq,uncorrected]: 1/7 sahi nahi hai. 7 batata hai ki us taraf gap kitne hain, yeh nahi ki gap kitna lamba hai. Dono taraf ka pehla gap saath rakh kar unki lambai milao. Zero se zyada door kaun rukta hai, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 2444 ms · guard leak]: Dono patti ka pehla hissa 0 se shuru hota hai, ek teen hisson wali patti mein aur ek saat hisson wali mein. Ab tumhari baari, apna jawab bolo.
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2065 ms · guard leak]: Sahi jawab, kyunki 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Ab agla sawaal kadam-kadam, milkar hal karte hain. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** kam hisson wali  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 3103 ms · guard affirms,leak]: Haan, kam hisson mein kati chocolate ka hissa bada hota hai. 1/8 aur 1/2 ke neeche wale number lo: Rahul ki chocolate 8 hisson mein kati hai, aur Sana ki 2 mein. Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Rahul  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked (1 miss) · board up · ready 1426 ms · guard twoq,uncorrected]: Abhi yeh sahi nahi hai. Board par 8 mein bati patti ka ek hissa, 2 mein bati patti ke ek hisse ke saamne rakh kar dekho; jo lamba hai, wahi bada hissa. Rahul ko chocolate ka 1/8 mila aur Sana ko 1/2, toh bada hissa kisko mila?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** 1/2  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1007 ms]: Haan, sahi hai. 1/2 ka rang, 1/8 ke rang se chaar guna lamba hai. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Ab agla sawaal tumhare liye. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1458 ms]: Haan, pehle tum try karo.
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 1995 ms · guard praise,uncorrected]: Nahi, 1/10 theek nahi. Tumne bada number dekhkar chuna; par dono roti ek jitni badi hain; socho kis roti ke hisse patle honge. Do ek jaisi roti mein se ek 10 barabar hisson mein kati hai aur ek 5 mein; roti zyada chahiye, toh ek hissa kaunsa loge, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** 1/5 loonga  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 956 ms]: Sahi jawab, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 718 ms]: Bilkul sahi: poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12,"shade":1,"title":"1/12"},{"parts":6,"shade":1,"title":"1/6"},{"parts":3,"shade":1,"title":"1/3"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 2259 ms · guard long]: Achha, ise seedhe shabdon mein bolti hoon. Pehle us mark ka naam socho: 0 se 1 tak ke 3 gap mein se pehla gap. Phir socho ki 1/5 ka gap usse chhota hai ya bada. 0 se 1 tak 3 barabar gap wali line par 1/5, pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** uske pehle  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 777 ms]: Haan, sahi hai, kyunki yeh mark 1/3 hai; gap 3 se zyada hon toh pehla gap chhota hota, aur is mark se pehle khatam hota. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2610 ms · guard mustsay]: Cricket ki baat bhi zaroor karenge, thodi der mein. Ab yeh kaam poora karte hain. Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2260 ms]: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/4  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 929 ms · guard uncorrected]: 7/4 sahi nahi hai. 7/4 ek poori patti se bhi zyada hota, par yahan rang ek hi patti ke andar rehta hai. 7 barabar hisson wali patti ke 4 hisson mein rang bharein, toh woh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** chaar bata saat  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 1790 ms · guard noconfirm]: Sahi jawab. Pehli patti 2/7 thi; hisse wahi 7 hain aur rang ab 4 mein hai, toh 4/7. Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 3164 ms · guard mustsay,twoq]: Wah, chauka! Toh tumhara favourite yahi hai. Achha, ab padhai ki taraf mudte hain. Ab number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Board par zero se chaar gap chalo, toh mark tak pahunchte ho. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 3773 ms · guard long]: Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > card: Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2734 ms · guard long,uncorrected]: Abhi yeh sahi nahi hai. Ek aur raasta aazmaate hain. Do ek jaisi roti hain, dono 5 barabar hisson mein. Ek se 2 hisse liye, doosri se 4. Har hissa ek hi size ka hai, toh 4 hisse matlab zyada roti. Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne 3 liye, Gopi ne 6. Neha ka ribbon Gopi se kam hai ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne 3 liye, Gopi ne 6. Neha ka ribbon Gopi se kam hai ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal (1 miss) · board up · ready 1795 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Neha ka har liya hua hissa Gopi ke ek liye hue hisse ke saamne rakho, aur dekho kiske liye hue hisse bach jaate hain. Neha ne ek ribbon ka 3/7 liya aur Gopi ne utne hi lambe ribbon ka 6/7, toh Neha ka ribbon kam hai ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne 3 liye, Gopi ne 6. Neha ka ribbon Gopi se kam hai ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** less  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) · board up · ready 687 ms]: Sahi jawab, kyunki har hissa 1/7 hai, aur Neha ke 3 hisse Gopi ke 6 hisson se kam hain. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > card: Tarun kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":6,"label":"6/7"}]}}

**child:** 4/7 wala  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 2144 ms · guard mustsay,long]: Haan, sahi hai. 4/7 zero se 4 gap door, 2/7 sirf 2. Yeh line 0 se 1 tak 5 barabar gap mein kati hai, har gap 1/5. Upar wala number batata hai ki zero se kitne gap chalna hai. Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 (1 miss) · board up · ready 3275 ms · guard leak,screenmismatch,uncorrected]: Nahi, yeh jawab nahi hai. Gap ek size ke hain, par chale hue gap ginti mein alag hain. Gino, Mona zero se kitne gap chali aur Sonu kitne. Mona zero se 3/5 tak gayi aur Sonu 1/5 tak, toh kaun aage pahuncha, ya dono barabar?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** Mona aage gayi  _(correct)_

**Asha** [explain · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 1832 ms · guard mustsay]: Bilkul sahi: Mona teen gap chali, Sonu sirf ek. Ek patti 3 hisson mein kati aur ek 10 mein, toh hisse alag size ke; yahan sirf ginkar faisla nahi hota. Tab dono ka aadha socho: ek aadhe se aage, doosra peeche, toh aage wala bada. Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Bada kaun hai, 2/3 ya 3/10?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"},{"num":3,"label":"3/5"}]}}

**child:** 3/10  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-tops-only · board up · ready 1846 ms · guard long,uncorrected]: 3/10 sahi nahi hai. Isko doosri tarah se samajhte hain. 3 wali patti ka ek hissa, 9 wali ke teen hisson jitna lamba hai; toh 9 wali ke 2 hisse us ek hisse se bhi chhote hain. Do ek jaisi patti socho: pehli ke 2 barabar hisson mein se 1 rango, doosri ke 6 mein se 2. Rang kis mein zyada hoga?
  > card: Do ek jaisi patti socho: pehli ke 2 barabar hisson mein se 1 rango, doosri ke 6 mein se 2. Rang kis mein zyada hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** 2 hisson wali  _(correct)_

**Asha** [practice · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 (1 miss) · board up · ready 887 ms]: Sahi jawab, kyunki 1/2 theek aadhi patti hai, jabki 2/6 aadhi patti tak nahi pahunchta. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ek patti ka 2/3 aur usi size ki doosri patti ka 3/10: bada kaun hai?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 2/3 hai na  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2766 ms · guard leak,screenmismatch]: Haan, sahi hai. 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe tak bhi nahi pahunchta. Aao, yeh sawaal main aur tum saath mein karenge. Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Hisse ek size ke; faisla kaun karega, upar wala number ya neeche wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** top  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked · board up · ready 2314 ms · guard leak]: Haan, upar wala number: woh ginta hai kitne hisse khaye. Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** Raju hai na  _(correct)_

**Asha** [practice · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 · board up · ready 3846 ms · guard leak,long]: Bilkul sahi. Toh poora jawab: Raju ne, sirf 3/8, kyunki hisse ek size ke hain aur Raju ke kam hain, isliye line par bhi 3/8 pehle aata hai, 5/8 baad mein. Ab ek sawaal tum akele karo. Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** 3  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 · board up · ready 1120 ms]: Haan, bilkul theek. Dono ke hisse 1/6 ke hain, toh 4/6 mein se 1/6 hatao, 3 hisse bachte hain. Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 (1 miss) · board up · ready 3027 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. 10 wale cake ke 5 hisse ginti mein zyada hain, par chhote. Dono cake ke hisse ek hi size ke banao: bade hisse ko chhote hisson jitna todo, phir dono ki ginti milao. Ben ke paas cake ka 3/5 hai aur Zoya ke paas 5/10, toh zyada cake kiske paas hai?
  > card: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"title":"Cake"},{"parts":10,"title":"Cake"}]}}

**child:** Ben has more  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 · board up · ready 1459 ms]: Sahi jawab, kyunki Zoya ka 5/10 bas aadha cake hai, jabki Ben ka 3/5 aadhe se aage hai. Do ek jaisi patti socho: pehli ke 3 barabar hisson mein se 2 rango, doosri ke 6 mein se 5. Rangne par dono mein ek-ek hissa khaali rahega. Kis patti mein rang zyada hoga, ya barabar?
  > card: Do ek jaisi patti socho: pehli ke 3 barabar hisson mein se 2 rango, doosri ke 6 mein se 5. Rangne par dono mein ek-ek hissa khaali rahega. Kis patti mein rang zyada hoga, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"shade":3,"title":"3/5"},{"parts":10,"shade":5,"title":"5/10"}]}}

**child:** 5/6 mein zyada  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1067 ms · guard noconfirm]: Haan, sahi hai. 3 wali ka khaali hissa 1/3 hai aur 6 wali ka bas 1/6; chhota khaali hissa, toh 5/6 mein rang zyada. Ab hisson ki ginti ke saath unka size bhi dekhna hoga. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 · board up · ready 4087 ms · guard mustsay,long]: Yeh patti 5 barabar hisson mein hai, toh har hissa 1/5. Teen hisson mein rang hai: 3/5. Doosri patti bhi isi size ki hai, 8 barabar hisson mein kati, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > card: Doosri patti bhi isi size ki hai, 8 barabar hisson mein kati, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

**child:** 3/8  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 · board up · ready 1351 ms · guard mustsay]: Bilkul sahi: 8 hisson mein se 3 mein rang, yaani 3/8. Ab ek number line: 0 se 1 tak ek taraf 5 barabar gap hain, doosri taraf 8. Dono taraf gap ka size alag hai: ek taraf har gap 1/5 ka, doosri taraf 1/8 ka. Isi line par zero se chalein, toh kaun aage rukta hai, 4/5 ya 4/8, ya yeh barabar hain?
  > card: Isi line par zero se chalein, toh kaun aage rukta hai, 4/5 ya 4/8, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"3/8"}]}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t02-m-tops-only · check script:c5-maths-ch02-t02-s3:then:c5-maths-ch02-t02-m-tops-only · board up · ready 2960 ms · guard long]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jitni patti hain, ek 3 barabar hisson mein aur ek 5 mein, toh 3 wali ka har hissa bada hai. Dono mein utne hi hisse rangein, toh 3 wali mein rang zyada hoga. Ravi ko deewar ke 6 barabar hisson mein 4 rangne hain, Kavya ko waisi deewar ke 10 mein 4. Kam rang kiski par lagega?
  > card: Ravi ko deewar ke 6 barabar hisson mein 4 rangne hain, Kavya ko waisi deewar ke 10 mein 4. Kam rang kiski par lagega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1}}

**child:** Kavya ki deewar par  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 (1 miss) · board up · ready 2525 ms]: Sahi jawab, kyunki dono deewar par chaar-chaar hisse, lekin 1/10 wala hissa 1/6 wale se chhota, isliye 4/10 kam, yaani Kavya ki deewar. Chalo, pehle wale sawaal ki taraf wapas aate hain. 5 aur 8 gap wali line par zero se chalo, kaun aage rukta: 4/5, 4/8, ya barabar?
  > card: Isi line par zero se chalein, toh kaun aage rukta hai, 4/5 ya 4/8, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":4,"label":"4/6"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 (2 miss) · board up · ready 1604 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Do bachche chaar-chaar gap chalte hain, ek ke gap bade aur ek ke chhote: bade gap wala aage pahunchta hai. Isi line par zero se chalein, toh kaun aage rukta hai, 4/5 ya 4/8, ya yeh barabar hain?
  > card: Isi line par zero se chalein, toh kaun aage rukta hai, 4/5 ya 4/8, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1}}

**child:** 4/5 zyada hai  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c5-maths-ch02-t02-s3:ask:e3 · board up · ready 2219 ms · guard leak,long]: Haan, sahi hai. 1/5 ke gap bade, toh 4/5 ka mark aage. Ginti barabar ho, toh hisse ka size faisla karta hai. 3/5 ke hisse 1/5 wale hain, jo 1/8 wale hisson se bade hain. Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > card: Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1,"marks":[[4,5],[4,8]]}}

**child:** 2/5 zyada hai  _(correct)_

**Asha** [explain · beat s3:explain:e4 · check script:c5-maths-ch02-t02-s3:ask:e4 · board up · ready 2316 ms · guard mustsay,leak]: Bilkul sahi: 1/5 ka hissa bada, isliye 2/5 zyada. Is line par 0 se 1 tak, ek taraf 4 barabar gap hain aur doosri taraf 8. 4 wali taraf pehla mark 1/4 hai, aur 8 wali taraf theek usi jagah 2/8 aata hai. Isi line par zero se chalo, toh pehle kaun aayega, 2/4 ya 5/8?
  > card: Isi line par zero se chalo, toh pehle kaun aayega, 2/4 ya 5/8?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":2,"label":"2/9"},{"parts":5,"shade":2,"label":"2/5"}]}}

**child:** aadha  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 2342 ms · guard leak,noconfirm]: Haan, bilkul theek, kyunki 2/4 ko 1/8 ke gap mein badlo toh 4/8 banta hai, aur 5/8 usse ek gap aage hai. Chalo, ab ek sawaal hum saath mein karte hain. Isha ne apni chocolate ka 2/3 khaya; Farhan ki chocolate bhi utni hi badi thi, aur usne uska 2/7 khaya. Yahan faisla kaun karega: khaye hue hisson ki ginti, ya hisse ka size?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[2,4],[5,8]]}}

**child:** the size  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t02-s3:ask:worked · board up · ready 2313 ms · guard affirms,leak]: Haan, hisse ka size, kyunki ginti dono mein barabar hai. Ab hisson ka size dekho: Isha ki chocolate 3 hisson mein kati, toh har hissa 1/3; Farhan ki 7 mein, toh har hissa 1/7. Tumhari baari: zyada kisne khaya, Farhan ne ya Isha ne?
  > card: Tumhari baari: zyada kisne khaya, Farhan ne ya Isha ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,3],"from":0,"to":1}}

**child:** Farhan  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s3:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2432 ms · guard long]: Abhi yeh sahi nahi hai. Ek aur raasta aazmaate hain. Do ek jaisi rassi: 2 hisson wali ke ek hisse mein, 8 hisson wali ke chaar aate hain, isliye 8 wala hissa chhota hai. Do ek si sadak: pehli team ne 4 barabar hisson mein se 3 banaye, doosri ne 12 mein se 3. Kisne zyada, pehli ya doosri?
  > card: Do ek si sadak: pehli team ne 4 barabar hisson mein se 3 banaye, doosri ne 12 mein se 3. Kisne zyada, pehli ya doosri?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,3],"from":0,"to":1}}

**child:** pehli ne zyada banayi  _(correct)_

**Asha** [practice · beat s3:worked:worked · check script:c5-maths-ch02-t02-s3:ask:worked (1 miss) · board up · ready 1633 ms]: Sahi jawab. Dono ne teen-teen hisse banaye, par 1/4 ka hissa 1/12 se bada hai, isliye pehli team ne zyada banayi. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Farhan ne chocolate ka 2/7 khaya aur Isha ne 2/3, toh zyada kisne khaya?
  > card: Tumhari baari: zyada kisne khaya, Farhan ne ya Isha ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":3,"label":"3/12"}]}}

**child:** Isha ne khaya  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t02-s3:c1 · board up · ready 1788 ms]: Haan, sahi hai: line par 2/3 ka mark 2/7 ke mark se kaafi aage hai. Toh poora jawab: Isha ne, 2/3. Chalo, ab tumhari apni baari. Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > card: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,3],"from":0,"to":1,"marks":[[2,7],[2,3]]}}

**child:** 4/5, 4/7, 4/9  _(misconception)_

**Asha** [hint · beat s3:check:c1 · check script:c5-maths-ch02-t02-s3:c1 (1 miss) · board up · ready 2018 ms · guard leak,uncorrected]: Nahi, 4/5, 4/7, 4/9 theek nahi. Order chhote se bade ka maanga hai. Teeno se 4-4 hisse liye hain; pehle socho kis chocolate ka ek hissa sabse patla hai. Teen ek jaisi chocolate se 4/5, 4/9 aur 4/7 liya; inhe chhote se bade tak kis order mein lagaoge?
  > card: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":0,"label":""},{"parts":9,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** 4/9 < 4/7 < 4/5  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t02-s3:c2 · board up · ready 1248 ms]: Bilkul sahi, kyunki teeno mein 4 hisse, par 1/9 ka hissa sabse chhota aur 1/5 ka sabse bada; isliye 4/9, phir 4/7, phir 4/5. Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, Imran apna 6 mein kaatkar 5. Kisne zyada ribbon liya, Anjali ne ya Imran ne?
  > card: Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, Imran apna 6 mein kaatkar 5. Kisne zyada ribbon liya, Anjali ne ya Imran ne?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":4,"label":"4/9"},{"parts":7,"shade":4,"label":"4/7"},{"parts":5,"shade":4,"label":"4/5"}]}}

**child:** Imran  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t02-s3:c3 · board up · ready 3973 ms · guard leak]: Haan, bilkul theek. Dono ke paanch-paanch hisse, par Imran ka har hissa Anjali ke hisse ka do guna hai. Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Dono mein poore pizza se bas ek-ek hissa kam hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > card: Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Dono mein poore pizza se bas ek-ek hissa kam hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":5,"label":"5/12"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** 8/9 hai na  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 529 ms]: Sahi jawab, kyunki 8/9 poore se bas 1/9 kam hai, 6/7 poore se 1/7 kam, aur 1/9 chhota hai. Ab poore paath ko yaad karke bas ek sawaal aur karna hai. Do ek jaisi patti hain: ek ke 10 barabar hisson mein se 7 liye, doosri ke 12 mein se 7. Kaunsa chhota hai, 7/10 ya 7/12?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":7,"shade":6,"title":"6/7"},{"parts":9,"shade":8,"title":"8/9"}]}}

**child:** 12/7  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 3 ms]: 12/7 sahi nahi hai. Dono mein 7 hisse liye gaye; ab dekho kis patti ka ek hissa chhota hai. 7/10 aur 7/12, dono ek jaisi patti ke hain; inmein se chhota kaun hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 12/7  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 3 ms]: Nahi, 12/7 theek nahi. Dono se 7 hisse liye, par 12 hisson wali patti ka har hissa chhota hai, isliye 7/12 chhota hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":7,"label":"7/10"},{"parts":12,"shade":7,"label":"7/12"}]}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [wrap · ready 1679 ms]: Achha, sun liya maine. Aaj dekha ki ek poore ke jitne zyada barabar hisse, har hissa utna chhota. Hisse ek size ke hon toh ginti dekhte hain, aur ginti barabar ho toh hisse ka size. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 1540 ms]: Theek hai, samajh gayi. Aaj ke paath mein tumne dekha ki 6/7 aur 8/9 mein poore ke zyada paas kaun. Aaj ke liye itna hi, phir milenge!

## Agent


