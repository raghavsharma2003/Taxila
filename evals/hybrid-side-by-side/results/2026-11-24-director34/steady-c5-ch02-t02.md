# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · ready 3007 ms · guard mustsay,long,twoq]: Kitchen mein do ek jaisi barfi ki patti kaati: ek ke 4 barabar hisse, doosri ke 8. Yeh patti ek poora hai, 4 barabar hisson mein. Ek rangeen hissa 1/4 hai: 1/4 ka 4 batata hai ki kitne barabar hisse hain. Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > card: Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · ready 2816 ms · guard long,uncorrected]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 logon wala hissa chhota hota hai. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** 1/9  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1076 ms · guard uncorrected]: Nahi, 1/9 theek nahi. 9 chhota number hai, par isse hissa chhota nahi hota: 9 batata hai ki dor kitne hisson mein kati. Ek hi lambi dor ke jitne kam hisse hon, har hissa utna lamba hota hai. 9 aur 11 barabar hisson mein kati ek jitni do dor mein se kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 1099 ms]: Dono dor ek jitni lambi hain; socho ki kis dor par zyada baar kainchi chali. Ab tum batao.
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":11,"shade":0,"label":""}]}}

**child:** 11 wali ka  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 3653 ms · guard leak]: Sahi jawab, kyunki 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > card: Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** 8 wala hissa chhota  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 4225 ms · guard leak]: Haan, sahi hai. Suno, ek jitni patti mein zyada hisse, toh har hissa chhota. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** 1 hisse ke barabar  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 2629 ms · guard mustsay,noconfirm,screenmismatch]: Bilkul sahi: do 1/8 hisse, yaani 2/8, milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Number line par zero se jitna door, fraction utna bada. Is line par 0 se 1 tak ek taraf 3 barabar gap hain, doosri taraf 7. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 1/7  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 1209 ms · guard uncorrected]: 1/7 sahi nahi hai. 7 bada number hai, par isse gap bada nahi hota: 7 batata hai ki line kitne gap mein bati. Ek roti 3 dost baantein ya 7 dost, socho kis baar har dost ka hissa bada hoga. Zero se zyada door kaun rukta hai, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 3094 ms · guard samecard]: Dono patti ka pehla hissa 0 se shuru hota hai, ek teen hisson wali patti mein aur ek saat hisson wali mein. Ab tumhari baari, apna jawab bolo.
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/3  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2374 ms · guard leak]: Sahi jawab, kyunki 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Ab agla sawaal kadam-kadam, milkar hal karte hain. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** kam hisson wali  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2771 ms · guard affirms,leak]: Haan, kam hisson mein kati chocolate ka hissa bada hota hai. Ab neeche wale number dekho: Rahul ki chocolate 8 hisson mein kati hai, aur Sana ki 2 mein. Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Rahul  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked (1 miss) · board up · ready 3044 ms · guard samecard]: Abhi yeh sahi nahi hai. 8 bada number hai, par woh hisson ki ginti hai, ek hisse ka size nahi. Ek chocolate 8 dost baantein aur waisi hi doosri 2 dost, socho kis dost ke haath bada hissa aayega. Rahul ko chocolate ka 1/8 mila aur Sana ko 1/2, toh bada hissa kisko mila?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** 1/2  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1048 ms]: Haan, sahi hai. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Ab agla sawaal tumhare liye. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 2095 ms]: Haan, pehle tum try karo.
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 3339 ms · guard praise,leak,uncorrected]: Nahi, 1/10 theek nahi. 10 bada number hai, par isse hissa bada nahi hota: 10 batata hai ki roti kitne hisson mein kati. Ek roti 10 bachche baantein ya 5, socho kiske haath bada hissa aayega. Do ek jaisi roti mein se ek 10 barabar hisson mein kati hai aur ek 5 mein; roti zyada chahiye, toh ek hissa kaunsa loge, 1/10 ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"}]}}

**child:** 1/5 loonga  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1083 ms]: Sahi jawab. Suno, 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1042 ms]: Bilkul sahi: poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12,"shade":1,"title":"1/12"},{"parts":6,"shade":1,"title":"1/6"},{"parts":3,"shade":1,"title":"1/3"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c3 · board up · ready 2035 ms]: Achha, ise seedhe shabdon mein bolti hoon. Pehle us mark ka naam socho: 0 se 1 tak ke 3 gap mein se pehla gap. Phir socho ki 1/5 ka gap usse chhota hai ya bada. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1974 ms]: Cricket ki baat bhi zaroor karenge, thodi der mein. Ab us sawaal par lautte hain jo humne pehle chhoda tha. 0 se 1 tak 3 barabar gap wali line par 1/5, pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** before  _(correct)_

**Asha** [repair · beat s1:check:c3 · board up · ready 1227 ms]: Haan, sahi hai, kyunki yeh mark 1/3 hai, aur 1/5 ka gap 1/3 ke gap se chhota hota, isliye 1/5 is mark se pehle aata. Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 3085 ms · guard mustsay]: Wah, chauka! Toh yeh tumhe achha lagta hai. Achha, ab padhai ki taraf mudte hain. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** 4 by 7  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2940 ms · guard leak,long]: Sahi jawab. Hisse wahi 7, rang ab 4 mein: 4/7. Ab number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Board par zero se chaar gap chalo, toh mark tak pahunchte ho. Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 3532 ms · guard long,uncorrected]: Abhi yeh sahi nahi hai. Ek aur raasta aazmaate hain. Do ek jaisi roti hain, dono 5 barabar hisson mein. Ek se 2 hisse liye, doosri se 4. Har hissa ek hi size ka hai, toh 4 hisse matlab zyada roti. Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne ek se 3 liye, Gopi ne doosre se 6. Neha ka kam ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne ek se 3 liye, Gopi ne doosre se 6. Neha ka kam ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

**child:** less  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 (1 miss) · board up · ready 2377 ms]: Bilkul sahi: har hissa 1/7 hai, aur Neha ke 3 hisse Gopi ke 6 hisson se kam hain. Achha, ab pehle wale sawaal ko phir se dekhte hain. 2/7 aur 4/7 mein bada kaun hai, ya yeh barabar hain?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":6,"label":"6/7"}]}}

**child:** 4/7  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 2575 ms · guard mustsay,long]: Haan, sahi hai, kyunki 4/7 zero se 4 gap door, 2/7 sirf 2. Yeh line 0 se 1 tak 5 barabar gap mein kati hai, har gap 1/5. Upar wala number batata hai ki zero se kitne gap chalna hai. Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 (1 miss) · board up · ready 1751 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Dono ka 5 bas batata hai ki gap ek size ke hain; isse dono barabar door nahi jaate. Dekho, dono bachchon ke liye 1 tak kitne-kitne gap bache. Mona zero se 3/5 tak gayi aur Sonu 1/5 tak, toh kaun aage pahuncha, ya dono barabar?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1}}

**child:** Mona zyada door  _(correct)_

**Asha** [explain · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 1944 ms · guard mustsay]: Sahi jawab. Mona teen gap chali, Sonu sirf ek. Ek patti 3 hisson mein kati, ek 10 mein: hisse alag size ke, ginti kaafi nahi. Yahan aadhi patti se milao: ek aadhe se aage, doosra peeche, aage wala bada. Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Bada kaun hai, 2/3 ya 3/10?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"},{"num":3,"label":"3/5"}]}}

**child:** 2/3 bada hai  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2500 ms · guard leak]: Haan, bilkul theek: 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe, yaani 5/10, tak bhi nahi pahunchta. Aao, yeh sawaal main aur tum saath mein karenge. Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Hisse ek size ke; faisla kaun karega, upar wala number ya neeche wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** upar wale  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked · board up · ready 2659 ms · guard affirms,leak,long]: Haan, upar wala number: woh ginta hai kitne hisse khaye. Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** Meena  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked (1 miss) · board up · ready 3383 ms · guard leak,screenmismatch,uncorrected]: Abhi yeh sahi nahi hai. Dono ke hisse ek hi size ke hain, toh bas dono ki ginti milao. Meena ne cake ka 5/8 khaya aur Raju ne 3/8, toh kam cake kisne khaya?
  > card: Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** Raju ne khaya  _(correct)_

**Asha** [practice · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 · board up · ready 2095 ms]: Haan, sahi hai. Toh poora jawab: Raju ne, sirf 3/8, kyunki hisse ek size ke hain aur Raju ke kam hain, isliye line par bhi 3/8 pehle aata hai, 5/8 baad mein. Ab ek sawaal tum akele karo. Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** 4  _(misconception)_

**Asha** [hint · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 (1 miss) · board up · ready 1210 ms · guard uncorrected]: Nahi, 4 theek nahi. Bhai ne kul 4 hisse khaaye, par sawaal farak ka hai. Pinky ke khaaye 1 hisse ke saamne bhai ka 1 hissa rakho, phir bhai ke baaki khaaye hisse gino. Pinky ne cake ka 1/6 khaya aur bhai ne 4/6, toh bhai ne kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"title":"Pinky"},{"parts":6,"title":"Bhai"}]}}

**child:** teen  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 · board up · ready 1289 ms]: Sahi jawab. Dono ke hisse 1/6 ke hain, toh 4/6 mein se 1/6 hatao, 3 hisse bachte hain. Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** Ben ke  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 · board up · ready 1143 ms]: Bilkul sahi: Zoya ka 5/10 bas aadha cake hai, jabki Ben ka 3/5 aadhe se aage hai. Do ek jaisi patti: ek ke 3 barabar hisson mein se 2 rangeen, doosri ke 6 mein se 5. Dono mein ek-ek hissa khaali hai. Kis patti mein rang zyada hai, ya barabar hai?
  > card: Do ek jaisi patti: ek ke 3 barabar hisson mein se 2 rangeen, doosri ke 6 mein se 5. Dono mein ek-ek hissa khaali hai. Kis patti mein rang zyada hai, ya barabar hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"shade":3,"title":"3/5"},{"parts":10,"shade":5,"title":"5/10"}]}}

**child:** 6 wali patti  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1768 ms]: Haan, bilkul theek, kyunki 3 wali ka khaali hissa 1/3 hai aur 6 wali ka bas 1/6; chhota khaali hissa, toh 5/6 mein rang zyada. Ab hisson ki ginti ke saath unka size bhi dekhna hoga. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t02-s3:ask:e1 · board up · ready 2254 ms · guard mustsay]: Yeh patti 5 barabar hisson mein hai, toh har hissa 1/5. Teen hisson mein rang hai: 3/5. Neeche isi size ki patti 8 barabar hisson mein kati hai, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > card: Neeche isi size ki patti 8 barabar hisson mein kati hai, aur 3 mein rang hai. Yeh kaunsa fraction hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":3,"whole":"bar"}}

**child:** 3 by 8  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c5-maths-ch02-t02-s3:ask:e2 · board up · ready 1307 ms · guard mustsay]: Haan, sahi hai. 8 hisson mein se 3 mein rang, yaani 3/8. Ab ek number line: 0 se 1 tak ek taraf 5 barabar gap hain, doosri taraf 8. Dono taraf gap ka size alag hai: ek taraf har gap 1/5 ka, doosri taraf 1/8 ka. Isi line par zero se chalein, toh kaun aage rukta hai, 4/5 ya 4/8, ya yeh barabar hain?
  > card: Isi line par zero se chalein, toh kaun aage rukta hai, 4/5 ya 4/8, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":"3/5"},{"parts":8,"shade":3,"label":"3/8"}]}}

**child:** 4/5 aage  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c5-maths-ch02-t02-s3:ask:e3 · board up · ready 1576 ms · guard long]: Sahi jawab, kyunki 1/5 ke gap bade, toh 4/5 ka mark aage. Ginti barabar ho, toh hisse ka size faisla karta hai. 3/5 ke hisse 1/5 wale hain, jo 1/8 wale hisson se bade hain. Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > card: Yeh do patti dekho. Ek ke 9 barabar hisson mein se 2, doosri ke 5 mein se 2. Kaunsa zyada hai, 2/9 ya 2/5?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[5,8],"from":0,"to":1,"marks":[[4,5],[4,8]]}}

**child:** doosri patti  _(correct)_

**Asha** [explain · beat s3:explain:e4 · check script:c5-maths-ch02-t02-s3:ask:e4 · board up · ready 2407 ms · guard mustsay,leak]: Bilkul sahi: 1/5 ka hissa bada, isliye 2/5 zyada. Is line par 0 se 1 tak, ek taraf 4 barabar gap hain aur doosri taraf 8. 4 wali taraf pehla mark 1/4 hai, aur 8 wali taraf theek usi jagah 2/8 aata hai. Isi line par zero se chalo, toh pehle kaun aayega, 2/4 ya 5/8?
  > card: Isi line par zero se chalo, toh pehle kaun aayega, 2/4 ya 5/8?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":2,"label":"2/9"},{"parts":5,"shade":2,"label":"2/5"}]}}

**child:** 2/4  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 1398 ms · guard noconfirm]: Haan, bilkul theek. 2/4 ko 1/8 ke gap mein badlo toh 4/8 banta hai, aur 5/8 usse ek gap aage hai. Chalo, ab ek sawaal hum saath mein karte hain. Isha ne apni chocolate ka 2/3 khaya; Farhan ki chocolate bhi utni hi badi thi, aur usne uska 2/7 khaya. Yahan faisla kaun karega: khaye hue hisson ki ginti, ya hisse ka size?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[4,8],"from":0,"to":1,"marks":[[2,4],[5,8]]}}

**child:** size se  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t02-s3:ask:worked · board up · ready 2664 ms · guard affirms,leak]: Haan, hisse ka size, kyunki ginti dono mein barabar hai. Ab hisson ka size dekho: Isha ki chocolate 3 hisson mein kati, toh har hissa 1/3; Farhan ki 7 mein, toh har hissa 1/7. Tumhari baari: zyada kisne khaya, Farhan ne ya Isha ne?
  > card: Tumhari baari: zyada kisne khaya, Farhan ne ya Isha ne?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[7,3],"from":0,"to":1}}

**child:** Isha ne zyada  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t02-s3:c1 · board up · ready 1962 ms]: Haan, sahi hai. Toh poora jawab: Isha ne, 2/3. Chalo, ab tumhari apni baari. Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > card: Teen ek jaisi chocolate hain: ek ka 4/5 liya, ek ka 4/9, aur ek ka 4/7. In teeno ko chhote se bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":3,"shade":2,"label":"2/3"}]}}

**child:** 4/9 < 4/7 < 4/5  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t02-s3:c2 · board up · ready 1501 ms]: Sahi jawab, kyunki teeno mein 4 hisse, par 1/9 ka hissa sabse chhota aur 1/5 ka sabse bada; isliye 4/9, phir 4/7, phir 4/5. Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, Imran apna 6 mein kaatkar 5. Kisne zyada ribbon liya, Anjali ne ya Imran ne?
  > card: Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, Imran apna 6 mein kaatkar 5. Kisne zyada ribbon liya, Anjali ne ya Imran ne?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":4,"label":"4/9"},{"parts":7,"shade":4,"label":"4/7"},{"parts":5,"shade":4,"label":"4/5"}]}}

**child:** Anjali  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s3:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 3194 ms · guard long,uncorrected]: Abhi yeh sahi nahi hai. Isko doosri tarah se samajhte hain. Do ek jaisi rassi: 2 hisson wali ke ek hisse mein, 8 hisson wali ke chaar aate hain, isliye 8 wala hissa chhota hai. Do ek si sadak: pehli team ne 4 barabar hisson mein se 3 banaye, doosri ne 12 mein se 3. Kisne zyada, pehli ya doosri?
  > card: Do ek si sadak: pehli team ne 4 barabar hisson mein se 3 banaye, doosri ne 12 mein se 3. Kisne zyada, pehli ya doosri?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** doosri  _(misconception)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s3:then:c5-maths-ch02-t02-m-bigger-denominator (1 miss) · board up · ready 2242 ms · guard uncorrected]: Nahi, yeh theek nahi hai. 12 bada number hai, par uske hisse chhote hain: 4 hisson wali sadak ka ek hissa, 12 wali ke kai hisson jitna lamba hota hai. Ek jaisi do sadak mein se pehli team ne 3/4 banayi aur doosri ne 3/12; zyada sadak kisne banayi, pehli ya doosri?
  > card: Do ek si sadak: pehli team ne 4 barabar hisson mein se 3 banaye, doosri ne 12 mein se 3. Kisne zyada, pehli ya doosri?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** doosri  _(misconception)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s3:then:c5-maths-ch02-t02-m-bigger-denominator (2 miss) · board up · ready 2265 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Teen-teen toh dono team ne banaye; ab 4 hisson wali sadak ka ek hissa aur 12 hisson wali sadak ka ek hissa saath rakh kar dekho. Jo socha hai, woh bol do.
  > card: Do ek si sadak: pehli team ne 4 barabar hisson mein se 3 banaye, doosri ne 12 mein se 3. Kisne zyada, pehli ya doosri?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** the first team  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t02-s3:c2 (1 miss) · board up · ready 2065 ms]: Haan, sahi hai: dono ne teen-teen hisse banaye, par 1/4 ka hissa 1/12 se bada hai, isliye pehli team ne zyada banayi. Chalo, pehle wale sawaal ki taraf wapas aate hain. Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, Imran apna 6 mein kaatkar 5. Kisne zyada ribbon liya, Anjali ne ya Imran ne?
  > card: Anjali aur Imran ke paas ek jaise ribbon hain. Anjali apna ribbon 12 barabar hisson mein kaatkar 5 leti hai, Imran apna 6 mein kaatkar 5. Kisne zyada ribbon liya, Anjali ne ya Imran ne?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":3,"label":"3/12"}]}}

**child:** Imran ko zyada  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t02-s3:c3 · board up · ready 2303 ms]: Sahi jawab, kyunki dono ke paanch-paanch hisse, par Imran ka har hissa Anjali ke hisse ka do guna hai. Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Dono mein poore pizza se bas ek-ek hissa kam hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > card: Do pizza hain, bilkul ek jaise. Ek ke 7 barabar hisson mein se 6 bache, doosre ke 9 mein se 8. Dono mein poore pizza se bas ek-ek hissa kam hai. Poore pizza ke zyada paas kaun hai, 6/7 ya 8/9?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":5,"label":"5/12"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** 9 wala pizza  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 4 ms]: Bilkul sahi. 8/9 poore se bas 1/9 kam hai, 6/7 poore se 1/7 kam, aur 1/9 chhota hai. Ab poore paath ko yaad karke bas ek sawaal aur karna hai. Do ek jaisi patti hain: ek ke 10 barabar hisson mein se 7 liye, doosri ke 12 mein se 7. Kaunsa chhota hai, 7/10 ya 7/12?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":7,"shade":6,"title":"6/7"},{"parts":9,"shade":8,"title":"8/9"}]}}

**child:** 12/7  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 3 ms]: 12/7 sahi nahi hai. Dono mein 7 hisse liye gaye; ab dekho kis patti ka ek hissa chhota hai. 7/10 aur 7/12, dono ek jaisi patti ke hain; inmein se chhota kaun hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 12/7  _(incorrect)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 3 ms]: Nahi, 12/7 theek nahi. Iska jawab hai 7/12, kyunki dono se 7 hisse liye, par 12 hisson wali patti ka har hissa chhota hai, isliye 7/12 chhota hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":10,"shade":7,"label":"7/10"},{"parts":12,"shade":7,"label":"7/12"}]}}

**child:** maine dobara check kiya  _(no_evidence)_

**Asha** [wrap · ready 1418 ms]: Achha, sun liya maine. Aaj dekha ki ek poore ke jitne zyada barabar hisse, har hissa utna chhota. Hisse ek size ke hon toh ginti dekhte hain, aur ginti barabar ho toh hisse ka size. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** aasaan laga  _(incorrect)_

**Asha** [wrap · ready 973 ms]: Hmm, batane ke liye shukriya. Aaj ke paath mein tumne dekha ki 6/7 aur 8/9 mein poore ke zyada paas kaun. Aaj ke liye itna hi, phir milenge!

## Agent


