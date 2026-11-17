# stuck-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1694 ms]: Aaj hum do fraction mein se bada kaunsa hai, yeh pehchaanna seekhenge. Socho, do bilkul ek jaisi roti. Ek ke 4 barabar hisse kiye, doosri ke 8. Aaj dekhenge ki kis roti ka ek hissa bada hota hai. Ab tak samajh aaya?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 1008 ms]: Koi baat nahi, ise doosre shabdon mein samjhaati hoon. Yeh patti ek poora hai: 4 barabar hisse, aur ek mein rang bhara hai. Woh ek hissa 1/4 hai. 1/4 ka 4 batata hai ki patti ke 4 barabar hisse hain. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 3320 ms]: Ek roti 4 bachche barabar baantein, toh har bachche ko roti ka 1/4 milta hai. Is patti ka rang wala hissa bhi waisa hi hai: chaar barabar mein se ek. Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota?
  > card: Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 2025 ms · guard long]: Upar wali patti ke rangin hisse ke theek neeche dekho, aur neeche wali patti ke jo hisse us jagah mein aate hain, unhe gino. Neeche wali patti ka ek hissa, upar wali patti ke ek hisse se bada hai ya chhota?
  > card: Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":0,"label":""}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 1848 ms]: Achha, isko aur aasaan karke bolti hoon. Rang wala hissa chaar baar ek ke baad ek lagao, toh poori patti ban jaati hai. Isliye woh patti ka 1/4 hai. Neeche wali patti ka ek hissa, upar wali patti ke ek hisse se bada hai ya chhota?
  > card: Neeche wali patti usi lambai ki hai, par 8 barabar hisson mein kati hai. Iska ek hissa upar wali patti ke ek hisse se bada hai ya chhota?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 2256 ms · guard praise,affirms]: Is sawaal ka sahi jawab: neeche wali patti ka hissa chhota, kyunki dono patti barabar lambi hain, par neeche wali 8 hisson mein kati hai aur upar wali sirf 4 mein. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":1,"label":"1/8"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3554 ms · guard long,twoq]: Yeh wahi patti hai jo abhi dekhi: 8 barabar hisse, toh ek hissa 1/8. Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho. Neeche wali patti ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > card: Neeche wali patti ke pehle do 1/8 hisse jodo. Woh milkar upar wali patti ka kaunsa fraction banate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 1/4 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2065 ms]: Bilkul sahi. Dekho, 8 hisson wali patti ke do 1/8 hisse milkar 4 hisson wali patti ka ek hissa, yaani 1/4, banate hain. Patti mein dekha tha ki 1/8 chhota hai. Number line par chhota fraction zero ke zyada paas rukta hai, kyunki line par zero se jitna door, utna bada. Is line par, 0 se 1 tak, upar 3 barabar gap hain aur neeche 7. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":8,"shade":2,"label":"2/8"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 1785 ms]: Yahan wahi line do patti ban gayi hai: upar wali patti teen barabar hisson mein, neeche wali saat mein, aur dono 0 se 1 tak barabar lambi. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/7  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 1959 ms · guard long,uncorrected]: 1/7 sahi nahi hai. Isko thoda doosri tarah se samajhte hain. Socho, do ek jaisi roti hain: ek 2 logon mein bati, doosri 10 logon mein. 10 bada number hai, phir bhi 10 walon ko chhota hissa milta hai. Barabar hisse jitne zyada, har hissa utna chhota. Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > card: Do ek jitni lambi dor: ek 9 barabar hisson mein kati, doosri 11 mein. Kis dor ka ek hissa chhota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/11  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 964 ms]: Haan, bilkul theek, kyunki 11 hisse 9 se zyada hain, toh 11 wali dor ka hissa 1/11, 1/9 se chhota hai. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":1,"label":"1/9"},{"parts":11,"shade":1,"label":"1/11"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (1 miss) · board up · ready 1912 ms]: Dono taraf ka pehla gap dekho, aur socho jis taraf gap kam hain, wahan har gap kitna lamba hoga. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** 1/7  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (2 miss) · board up · ready 2192 ms · guard leak,samecard,uncorrected]: 1/7 nahi, yeh jawab theek nahi baitha. Line ko ek ruler socho: 0 cm se jitna aage mark, utni lambi cheez. Isi tarah line par jo fraction zero se jitna aage ruke, woh utna bada. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 (2 miss) · board up · ready 2536 ms · guard samecard]: Haan, pehle tum try karo. Lo, ab yeh dekho. Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > card: Isi line par, zero se zyada door kaun rukega, 1/3 ya 1/7?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1}}

**child:** one third  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2089 ms · guard leak]: Bilkul sahi, kyunki 1/3 ka gap 1/7 ke gap se bada hai, toh 1/3 zero se aage jaakar rukta hai. Ab agla sawaal kadam-kadam, milkar hal karte hain. Rahul aur Sana ke paas ek-ek chocolate hai, dono bilkul ek jaisi. Rahul ko apni chocolate ka 1/8 mila, Sana ko apni ka 1/2. Saath mein dekhte hain ki bada hissa kiske paas hai. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"dens":[3,7],"from":0,"to":1,"marks":[[1,3],[1,7]]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked:problem · board up · ready 3432 ms · guard affirms,leak]: Yahan dono chocolate ek jaisi hain, toh unhe seedha milaa sakte hain. Hum pehle dekhenge ki dono ko kitne hisse mile, phir ek hisse ka size. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2358 ms]: Cricket ki baat bhi karenge, bilkul. Pehle dono ka upar wala number dekho: dono mein 1, yaani dono ko ek-ek hissa, kyunki upar wala number mile hue hisse ginta hai. Ab dekho, kiski chocolate kitne hisson mein kati: Rahul ki chocolate 8 hisson mein, Sana ki sirf 2 mein, kyunki ginti se hi hisse ka size pata chalta hai. Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** Rahul  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked (1 miss) · board up · ready 1740 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Dono chocolate ek jitni hain; 8 hisson wali patti ka ek hissa aur 2 hisson wali ka ek hissa milaa kar dekho. Rahul ko chocolate ka 1/8 mila aur Sana ko 1/2, toh bada hissa kisko mila?
  > card: Tum batao, bada hissa kisko mila, Rahul ko ya Sana ko?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":0,"label":""},{"parts":2,"shade":0,"label":""}]}}

**child:** Rahul  _(misconception)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2085 ms]: Yeh jawab sahi nahi hai. Iska jawab hai Sana ko mila, 1/2 wala hissa, kyunki 8 bada number hai, par 8 hisson wali chocolate ka hissa chhota hota hai, isliye 1/8 chhota aur 1/2 bada. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** yeh step samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 3885 ms · guard leak]: 1/2 aadhi chocolate hai, aur aadhi chocolate banane ke liye 1/8 jaise chaar hisse jodne padte hain. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2764 ms]: Theek hai, is par hum phir saath mein aayenge; ab agli baat. Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 · board up · ready 3526 ms · guard long]: Achha, toh tumhe chauka sabse achha lagta hai. Ab padhai ki taraf mudte hain. Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":2,"shade":1,"label":"1/2"}]}}

**child:** 1/10  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 (1 miss) · board up · ready 2347 ms · guard leak,uncorrected]: 1/10 nahi, yeh jawab theek nahi baitha. Dono roti ek jaisi hain. Board par dono roti ka ek-ek hissa dekho, aur socho kis hisse mein roti zyada hai. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > card: Do roti, bilkul ek jaisi. Ek ke 10 barabar hisse hain, doosri ke 5. Tumhe ek hi hissa milega aur roti zyada chahiye, toh 1/10 loge ya 1/5?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"title":"Roti"},{"parts":5,"title":"Roti"}]}}

**child:** 1/10  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 876 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 1/5 hai, kyunki 5 hisson wali roti ka 1/5, 10 hisson wali roti ke 1/10 se do guna bada hai. Ab tak samajh aaya?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:check:c1 · board up · ready 2034 ms]: 1/10 wale do hisse jodo, tab jaakar 5 hisson wali roti ka ek hissa banta hai. Yeh hissa saaf hua?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":10,"shade":1,"title":"1/10"},{"parts":5,"shade":1,"title":"1/5"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · board up · ready 2062 ms]: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > card: Ek hi poore ke yeh teen fraction lo: 1/3, 1/12, 1/6. Inhe sabse chhote se sabse bade tak order mein lagao.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1291 ms]: Bilkul sahi, kyunki poora ek ho toh 1/12 ke hisse sabse chhote, 1/6 beech mein, aur 1/3 sabse bade. Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":12,"shade":1,"label":"1/12"},{"parts":6,"shade":1,"label":"1/6"},{"parts":3,"shade":1,"label":"1/3"}]}}

**child:** past it  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 (1 miss) · board up · ready 2516 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Pehle us mark ka naam socho: 0 se 1 tak ke 3 gap mein se pehla gap. Phir socho ki 1/5 ka gap usse chhota hai ya bada. 0 se 1 tak 3 barabar gap wali line par 1/5, pehle mark se pehle aayega ya uske aage?
  > card: Yeh line 0 se 1 tak 3 barabar gap mein bati hai, aur 0 ke baad pehle mark par koi number nahi likha. Agar 1/5 ko bhi isi line par rakhein, toh woh is pehle mark se pehle aayega ya uske aage?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"mark":1}}

**child:** mark se pehle  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1735 ms]: Haan, bilkul theek. Dekho, mark 1/3 hai, aur 1/3 ka gap 1/5 ke gap se bada hai, isliye 1/5 pehle aata hai. Ab dekhenge ki hisse ek size ke hon toh ginti kaise faisla karti hai, aur kab sirf ginti se kaam nahi chalta. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":3,"from":0,"to":1,"marks":[{"num":1,"label":"1/3"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 · board up · ready 2361 ms · guard mustsay]: Pehli patti ke 7 barabar hisse hain, har ek 1/7. 2 mein rang hai, toh yeh 2/7. Fraction ka upar wala 2 bas ginta hai ki kitne hisse liye. Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/4  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (1 miss) · board up · ready 1023 ms · guard uncorrected]: 7/4 nahi, yeh jawab theek nahi baitha. Patti ke hisse wahi 7 rehte hain; badalti sirf rang wale hisson ki ginti hai. 7 barabar hisson wali patti ke 4 hisson mein rang bharein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":0,"label":"?"}]}}

**child:** 7/4  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t02-s2:ask:e1 (2 miss) · board up · ready 1096 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Is patti ke rangeen hisse ek-ek karke gino: ek gina toh 1/7, do gine toh 2/7. Fraction ka upar wala number yahi ginti hai. 7 barabar hisson wali patti ke 4 hisson mein rang bharein, toh kaunsa fraction banega?
  > card: Doosri patti bhi bilkul waisi hai. Agar iske 4 hisson mein rang bhar dein, toh kaunsa fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":7,"shade":2,"whole":"bar"}}

**child:** four sevenths  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1387 ms · guard mustsay]: Bilkul sahi, kyunki pehli patti 2/7 thi; hisse wahi 7 hain aur rang ab 4 mein hai, toh 4/7. Ab yahi baat ek number line par: 0 se 1 tak 7 barabar gap, har gap 1/7. Zero se 4/7 tak pahunchne ke liye 4 gap chalna padta hai. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"},{"parts":7,"shade":4,"label":"4/7"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1112 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":7,"from":0,"to":1}}

## Agent


