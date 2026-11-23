# offtopic-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · ready 3834 ms · guard mustsay,long]: Kitchen mein do ek jaisi barfi ki patti kaati: ek ke 4 barabar hisse, doosri ke 8. Yeh patti ek poora hai, 4 barabar hisson mein. Ek rangeen hissa 1/4 hai: 1/4 ka 4 batata hai ki kitne barabar hisse hain. Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > card: Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** bigger  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · ready 2604 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Isko doosri tarah se samajhte hain. Do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 logon wala hissa chhota hota hai. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** doosri wali  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (1 miss) · board up · ready 4057 ms · guard leak]: Bilkul sahi. Dekho, 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. 4 barabar hisson wali patti aur utni hi lambi 8 hisson wali patti mein, 8 wali ka ek hissa 4 wali ke ek hisse se bada hai ya chhota?
  > card: Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** bigger  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 (2 miss) · ready 2902 ms · guard leak,uncorrected]: Yeh jawab sahi nahi hai. Is patti ke ek hisse ko beech se do barabar hisson mein kaato, aur naye hisse ko purane hisse ke saamne rakh kar dekho. Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > card: Socho, isi patti jitni lambi ek doosri patti 8 barabar hisson mein kati hai. Uska ek hissa is patti ke ek hisse se bada hai ya chhota?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** smaller  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 1407 ms · guard mustsay]: Haan, bilkul theek: doosri patti 8 hisson mein kati, pehli sirf 4 mein. Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > card: Doosri patti ke pehle do 1/8 hisse jodo. Woh milkar pehli patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":8,"shade":1,"title":"1/8"}]}}

**child:** 2/8  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1337 ms]: Sahi jawab, kyunki do 1/8 hisse, yaani 2/8, milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Number line par zero se jitna door, fraction utna bada. Is line par 0 se 1 tak ek taraf 3 barabar gap hain, doosri taraf 7. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2853 ms · guard leak]: Haan, sahi hai. 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Aao, yeh sawaal main aur tum saath mein karenge. Rahul aur Sana ke paas ek jaisi chocolate hai. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3238 ms · guard affirms]: Socho, do ek jaise cake hain: ek ko thode log baant rahe hain, doosre ko bahut saare log. Ab dekho, kis cake se har ek ke haath bada hissa aata hai. Do ek jaisi chocolate hon, toh kiska ek hissa bada hoga: kam ya zyada hisson mein kati chocolate ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2262 ms]: Cricket ki baat bhi zaroor karenge, thodi der mein. Ab tum batao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 1717 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2004 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Chalo, jahan the wahin se aage chalte hain. Ek-ek hissa mila; bada hissa kiska: jiski chocolate kam hisson mein kati, ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2997 ms · guard leak]: Dono chocolate ek jaisi hain, toh jo chocolate kam hisson mein kati, uska har hissa bada hota hai. Ab neeche wale number dekho: Rahul ki chocolate 8 hisson mein kati hai, aur Sana ki 2 mein. Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 1892 ms · guard twoq]: Pehla gol 8 barabar hisson mein bata hai aur doosra 2 mein, aur dono ek hi size ke hain. Har gol ka ek hissa dekho. Rahul ko chocolate ka 1/8 mila aur Sana ko 1/2, toh bada hissa kisko mila?
  > card: Tumhari baari: bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Sana ka zyada  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 1989 ms]: Bilkul sahi: 8 bada number hai, par 8 hisson wali chocolate ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Toh poora jawab: Sana ko mila, 1/2 wala hissa. Ab agla sawaal tumhare liye. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** paanch wali  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 1052 ms]: Haan, bilkul theek, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2535 ms]: Ek hi poore ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai. Isi baat se teeno fraction ke neeche wale number milao. 1/3, 1/12 aur 1/6 ko sabse chhote se shuru karke kis order mein lagaoge?
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12}]}}

**child:** 1/12, 1/6, 1/3 hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1759 ms]: Sahi jawab. Dekho, poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":12,"shade":1,"title":"1/12"},{"parts":6,"shade":1,"title":"1/6"},{"parts":3,"shade":1,"title":"1/3"}]}}

**child:** pehle aata  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1445 ms · guard noconfirm]: Haan, sahi hai: mark 1/3 hai, aur 1/3 ka gap 1/5 ke gap se bada hai, isliye 1/5 pehle aata hai. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2012 ms · guard mustsay]: Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2008 ms]: Achha, toh tumhara favourite hai Virat. Ab phir se seekhne mein lag jaate hain. Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2127 ms]: Haan, pehle tum try karo.
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 4/7  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t02-s2:ask:e2 · board up · ready 2871 ms · guard mustsay,leak,long]: Bilkul sahi, kyunki hisse wahi 7, rang ab 4 mein: 4/7. Ab number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Board par zero se chaar gap chalo, toh mark tak pahunchte ho. Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > card: Rohan kehta hai, 2/7 aur 4/7 barabar hain, kyunki dono ka neeche wala number 7 hai. Tum batao: bada kaun hai, 2/7 ya 4/7, ya yeh barabar hain?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** 4/7  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t02-s2:ask:e3 · board up · ready 1360 ms · guard long]: Haan, bilkul theek. Suno, 4/7 zero se 4 gap door, 2/7 sirf 2. Yeh line 0 se 1 tak 5 barabar gap mein kati hai, har gap 1/5. Upar wala number batata hai ki zero se kitne gap chalna hai. Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > card: Do bachche is line par zero se chalte hain: Mona 3/5 tak jaati hai, Sonu 1/5 tak. Kaun aage pahuncha, Mona ya Sonu, ya dono barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1,"marks":[{"num":2,"label":"2/7"},{"num":4,"label":"4/7"}]}}

**child:** Mona pahunchi  _(correct)_

**Asha** [explain · beat s2:explain:e4 · check script:c5-maths-ch02-t02-s2:ask:e4 · board up · ready 1215 ms · guard mustsay]: Sahi jawab, kyunki Mona teen gap chali, Sonu sirf ek. Ek patti 3 hisson mein kati, ek 10 mein: hisse alag size ke, ginti kaafi nahi. Yahan aadhi patti se milao: ek aadhe se aage, doosra peeche, aage wala bada. Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > card: Ek patti ka 2/3 lo, aur usi size ki doosri patti ka 3/10. Hisse 3/10 mein zyada hain. Par bada kaun hai, 2/3 ya 3/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":5,"from":0,"to":1,"marks":[{"num":1,"label":"1/5"},{"num":3,"label":"3/5"}]}}

**child:** two thirds  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2251 ms · guard leak]: Haan, sahi hai: 2/3 aadhe se aage nikal jaata hai, aur 3/10 aadhe, yaani 5/10, tak bhi nahi pahunchta. Chalo, ab ek sawaal hum saath mein karte hain. Meena ne apne cake ka 5/8 khaya, aur Raju ne utne hi bade doosre cake ka 3/8. Hisse ek size ke; faisla kaun karega, upar wala number ya neeche wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":10,"shade":3,"label":"3/10"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 2002 ms]: Jab saare hisse ek size ke hon, toh jiske paas zyada hisse, uske paas zyada. Meena ne cake ka 5/8 khaya aur Raju ne 3/8, aur dono ke hisse ek size ke hain; kisne zyada khaya, yeh kaunsa number batayega, upar wala ya neeche wala?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked · board up · ready 3979 ms · guard leak,twoq,screenmismatch]: Dono ka neeche wala number 8 hai, toh hisse ek hi size ke hain. Isliye faisla upar wala number karega, jo ginta hai kitne hisse khaye. Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > card: Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2366 ms · guard screenmismatch,uncorrected]: Nahi, yeh jawab nahi hai. Ise alag tareeke se dekhte hain. Do ek jaisi roti hain, dono 5 barabar hisson mein. Ek se 2 hisse liye, doosri se 4. Har hissa ek hi size ka hai, toh 4 hisse matlab zyada roti. Ab tak samajh aaya?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-same-bottom-equal · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-same-bottom-equal · board up · ready 2393 ms]: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne ek se 3 liye, Gopi ne doosre se 6. Neha ka kam ya zyada?
  > card: Do ek jaise ribbon, dono 7 barabar hisson mein. Neha ne ek se 3 liye, Gopi ne doosre se 6. Neha ka kam ya zyada?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":7,"shade":0,"label":""}]}}

**child:** kam  _(correct)_

**Asha** [practice · beat s2:worked:worked · check script:c5-maths-ch02-t02-s2:ask:worked (1 miss) · board up · ready 1377 ms]: Bilkul sahi. Har hissa 1/7 hai, aur Neha ke 3 hisse Gopi ke 6 hisson se kam hain. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Meena ne cake ka 5/8 khaya aur Raju ne 3/8, toh kam cake kisne khaya?
  > card: Tumhari baari: kam cake kisne khaya, Meena ne ya Raju ne?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":7,"shade":6,"label":"6/7"}]}}

**child:** Raju ne khaya  _(correct)_

**Asha** [practice · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 · board up · ready 5157 ms · guard long]: Haan, bilkul theek: hisse ek size ke hain aur Raju ke kam hain, isliye line par bhi 3/8 pehle aata hai, 5/8 baad mein. Toh poora jawab: Raju ne, sirf 3/8. Ab ek sawaal tum akele karo. Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":3,"label":"3/8"},{"num":5,"label":"5/8"}]}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 (1 miss) · board up · ready 1062 ms]: 0 sahi nahi hai. Cake ek jaise, hisse bhi ek size ke. Ab dono ke hisse gino, aur dekho bhai ke kitne hisse zyada hain. Pinky ne cake ka 1/6 khaya aur bhai ne 4/6, toh bhai ne kitne hisse zyada khaye?
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"title":"Pinky"},{"parts":6,"title":"Bhai"}]}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s2:check:c0 · check script:c5-maths-ch02-t02-s2:c0 (2 miss) · board up · ready 1337 ms · guard uncorrected]: Nahi, 0 theek nahi. Dono ka 6 bas batata hai ki hisse ek size ke hain; isse dono ne barabar nahi khaya. Bhai ka ek hissa Pinky ke ek hisse ke saamne rakho, aur bhai ke baaki hisse dekho. Ab tumhari baari, apna jawab bolo.
  > card: Do ek jaise cake hain, dono 6 barabar hisson mein kate. Pinky ne ek cake se 1/6 khaya, uske bhai ne doosre se 4/6. Bhai ne Pinky se kitne hisse zyada khaye?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"title":"Pinky"},{"parts":6,"title":"Bhai"}]}}

**child:** mujhe lagta hai 3  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t02-s2:c1 · board up · ready 2513 ms]: Sahi jawab, kyunki dono ke hisse 1/6 ke hain, toh 4/6 mein se 1/6 hatao, 3 hisse bachte hain. Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > card: Ben aur Zoya ke cake ek jaise hain. Ben ka cake 5 barabar hisson mein kata, usne 3 liye. Zoya ka cake 10 barabar hisson mein kata, Zoya ne 5 liye. Zyada cake kiske paas hai, Ben ke ya Zoya ke?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** Ben hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 · board up · ready 1813 ms]: Bilkul sahi. Zoya ka 5/10 bas aadha cake hai, jabki Ben ka 3/5 aadhe se aage hai. Do ek jaisi patti: ek ke 3 barabar hisson mein se 2 rangeen, doosri ke 6 mein se 5. Dono mein ek-ek hissa khaali hai. Kis patti mein rang zyada hai, ya barabar hai?
  > card: Do ek jaisi patti: ek ke 3 barabar hisson mein se 2 rangeen, doosri ke 6 mein se 5. Dono mein ek-ek hissa khaali hai. Kis patti mein rang zyada hai, ya barabar hai?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":5,"shade":3,"title":"3/5"},{"parts":10,"shade":5,"title":"5/10"}]}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-gap-thinking · board up · ready 2499 ms]: Nahi, yeh jawab nahi hai. Ek aur raasta aazmaate hain. Pehli patti mein 2 mein se 1 hissa rangeen hai, doosri mein 7 mein se 6. Pehli ka aadha khaali hai, aur doosri ka bas 1/7, isliye doosri mein rang zyada hai. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t02-m-gap-thinking · board up · ready 2038 ms]: Do bachche ek jitni lambi race daud rahe hain: ek ki race 3 barabar hisson mein bati hai, doosre ki 5 mein, aur dono ka aakhri ek hissa baaki hai. 5 wali race ka hissa chhota, toh woh finish line ke zyada paas hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":""},{"parts":5,"shade":4,"label":""}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c5-maths-ch02-t02-m-gap-thinking · check script:c5-maths-ch02-t02-s2:then:c5-maths-ch02-t02-m-gap-thinking · board up · ready 5665 ms · guard long]: Do ek jaisi patti: ek ke 8 barabar hisson mein se 7 rangeen, doosri ke 10 mein se 9. Kaunsi poori rangne ke kareeb hai?
  > card: Do ek jaisi patti: ek ke 8 barabar hisson mein se 7 rangeen, doosri ke 10 mein se 9. Kaunsi poori rangne ke kareeb hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":10,"shade":0,"label":""}]}}

**child:** 9/10 hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 (1 miss) · board up · ready 2242 ms]: Haan, bilkul theek, kyunki 9/10 ka khaali hissa bas 1/10 hai, 7/8 ka 1/8, aur 1/10 chhota hai. Achha, ab pehle wale sawaal ko phir se dekhte hain. Do ek jaisi patti: ek ke 3 barabar hisson mein se 2 rangeen, doosri ke 6 mein se 5. Dono mein ek-ek hissa khaali hai. Kis patti mein rang zyada hai, ya barabar hai?
  > card: Do ek jaisi patti: ek ke 3 barabar hisson mein se 2 rangeen, doosri ke 6 mein se 5. Dono mein ek-ek hissa khaali hai. Kis patti mein rang zyada hai, ya barabar hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":7,"label":"7/8"},{"parts":10,"shade":9,"label":"9/10"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c5-maths-ch02-t02-s2:c2 (2 miss) · board up · ready 3623 ms · guard samecard,uncorrected]: Yeh jawab sahi nahi hai. Dono patti ke khaali hisse milao, aur dekho kaunsa bada hai. Ek jaisi do patti par 2/3 aur 5/6 rang hai, aur dono mein ek-ek hissa khaali hai; kis patti mein rang zyada hai, ya barabar hai?
  > card: Do ek jaisi patti: ek ke 3 barabar hisson mein se 2 rangeen, doosri ke 6 mein se 5. Dono mein ek-ek hissa khaali hai. Kis patti mein rang zyada hai, ya barabar hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** doosri patti  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1333 ms]: Bilkul sahi. 3 wali ka khaali hissa 1/3 hai aur 6 wali ka bas 1/6; chhota khaali hissa, toh 5/6 mein rang zyada. Ab hisson ki ginti ke saath unka size bhi dekhna hoga. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":6,"shade":5,"label":"5/6"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1104 ms]: Aaj ke liye itna hi, phir milenge!

## Agent


