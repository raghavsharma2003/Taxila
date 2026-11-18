# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2230 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2178 ms · guard mustsay]: Main ise aur aasaan nahi bol paa rahi, koi baat nahi. Kitchen mein Maa ne garam roti banayi, aur tum do bhai-behen ho: dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai, aur ek tukde mein rang hai. Fraction mein neeche wala number roti ke kul barabar tukde ginta hai, upar wala number, jitne tukde humne liye. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2124 ms · guard noconfirm]: Haan, bilkul theek. Dekho, rangin tukda roti ke 2 barabar tukdon mein se 1 hai, toh 1/2, yaani aadha; neeche wala number 2 hai. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** nahin  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1968 ms · guard mustsay]: Sahi jawab, kyunki pizza ke tukde chhote-bade hain, aur ek-tihaai tabhi banta hai jab 3 tukde barabar hon. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** two thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2578 ms · guard mustsay,long]: Haan, sahi hai: circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Is patti ke 8 barabar tukde hain, ek mein rang. Rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 3293 ms · guard long]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Socho, chocolate ke saare tukde barabar hain. Neeche wala number batata hai ki poori chocolate kitne tukdon mein bati; tukde kha lo, yeh ginti nahi badalti. Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1879 ms]: Phir se dekho: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** pinky's  _(correct)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 1863 ms]: Haan, bilkul theek. Dekho, khaye hue 2 tukde chocolate ke 4 barabar tukdon mein se hain, toh 2/4; bache hue 2 neeche wala number nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** nahi, 1/6 hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1106 ms]: Sahi jawab. Dekho, Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte. Aao, agla sawaal main aur tum saath mein karenge. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Neeche wale number mein kaunse tukde ginoge: saare, ya sirf khaye hue?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** all pieces  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 2890 ms · guard affirms]: Haan, saare tukde: barfi 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 2 by 5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2943 ms · guard screen]: Haan, sahi hai. Toh poora jawab: bache hue tukde barfi ka 2/5 hain, kyunki 5 barabar tukdon mein se 2 bache; khaye hue 3 tukde neeche wale number mein nahi jaate. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2217 ms]: Dono chhote tukde jodo aur bade tukde se milao. Phir dekho, bada tukda poore laddoo ka kitna gherta hai. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 3113 ms · guard leak]: Laddoo ab ek patti mein hai, teen tukdon mein: ek lamba aur do chhote, aur teeno milkar poora laddoo. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** ek bata do  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 3407 ms · guard answerinq,noconfirm]: Haan, bilkul theek. Dekho, laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Bada tukda 1/2"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 1053 ms · guard uncorrected]: 12 sahi nahi hai. Socho, 1/12 ka neeche wala number kya ginta hai, aur upar wala kya ginta hai. 12 barabar tukdon wali chocolate ka 1/12 khaya gaya, toh kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 3810 ms · guard answerinq]: Koi baat nahi, isse aasaan shabd abhi mere paas nahi hain. 12 barabar tukdon wali chocolate ka 1/12 khaya gaya, toh kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** 12  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 1302 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 11 hai, kyunki 1/12 ka matlab chocolate ke 12 barabar tukdon mein se 1 khaya; 12 mein se 1 gaya, toh 11 bache. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2528 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2904 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2036 ms]: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** 1/4 se kam  _(correct)_

**Asha** [repair · beat s1:check:c3 · board up · ready 2554 ms · guard flat]: Haan, bilkul theek. Dekho, chaaron tukde milkar poora cake hain aur bada tukda baaki se bada hai, toh har chhota tukda 1/4 se kam. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2838 ms · guard mustsay,dodged]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2339 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Do bachche yeh 12 laddoo barabar baantenge. Aadha matlab: dono ke paas ek jitne laddoo, aur ek bachche ke laddoo hi aadha. Jaanch: dono ke laddoo jodo, toh saare 12 wapas. Yahan tak saaf hai?
  > screen: board shade-grid@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2091 ms]: Cricket ki baari aa gayi: uske baare mein thoda aur batao na?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 2131 ms]: Hmm, chauka. Samajh gayi. Toh ab wahin se shuru karte hain jahan ruke the. 12 laddoo ka aadha kitne laddoo hai?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

**child:** six  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 · board up · ready 3020 ms · guard screen,mustsay,answerinq]: Haan, bilkul theek. Dekho, 2 barabar group, har ek mein 6 laddoo. Yeh 24 aam dekho, 6 barabar group mein. 1/6 ka neeche wala 6 kehta hai: 6 barabar group banao. Upar wala 1 kehta hai: ek group lo. Toh 24 ka 1/6 hai 4 aam. 1/3 mein bhi yahi, bas neeche wala number 3 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (1 miss) · board up · ready 2728 ms · guard samecard,uncorrected]: 4 sahi nahi hai. 6 group ko 3 bachchon mein ek-ek karke baanto. Ek bachche ke paas kitne group aaye, woh gino. 24 aam ke 6 barabar group mein se, 24 ka 1/3 lene ke liye kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** 1  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (2 miss) · board up · ready 2562 ms · guard screen,answerinq,uncorrected]: 1 nahi, yeh jawab theek nahi baitha. Socho, 6 bachche yeh 24 aam barabar baantein: har bachche ko ek group milta hai, 4 aam. Yahi 24 ka 1/6 hai. Ab phir se socho, jawab kya hoga?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** mujhe lagta hai 2  _(correct)_

**Asha** [repair · beat s2:explain:e2 · board up · ready 2139 ms]: Sahi jawab. Dekho, 6 group ko jod kar 3 barabar bade group banao: har bade group mein 2 group, yaani 8 aam. Yahan tak theek hai?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 · board up · ready 3730 ms · guard mustsay,long]: Yeh 20 kanche 2 barabar group mein hain. Ek group ke 10 kanche 20 ka aadha hain, 1/2. Group ka size pata ho, toh aise group gino: wahi ginti neeche wala number hai. Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > card: Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[10,10]}}

**child:** 4/1  _(incorrect)_

**Asha** [hint · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 (1 miss) · board up · ready 2828 ms · guard flat,uncorrected]: 4/1 se baat nahi bani. Gino, 20 tak pahunchne ke liye 5 kitni baar jodna padta hai. Utne hi barabar group bante hain. Toh ab batao, kya aayega?
  > card: Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[10,10]}}

**child:** 4/1  _(incorrect)_

**Asha** [hint · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 (2 miss) · board up · ready 2359 ms · guard uncorrected]: 4/1 sahi nahi hai. Dono group ke kanche jodo: 10 aur 10, poore 20 kanche. Do barabar group saare kanche bana dete hain, isliye har group kanchon ka aadha hai. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > card: Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[10,10]}}

**child:** one fourth  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1814 ms]: Haan, bilkul theek. Dekho, 4 × 5 = 20, toh 20 kanche 4 bachchon mein barabar batte hain; har bachche ke 5 kanche 1/4 hain. Chalo, ab ek sawaal hum dono saath mein karte hain. 15 pencil ka 1/3 nikaalna hai. 1/3 ke liye 15 pencil ko kitne barabar group mein baantoge?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":5}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1469 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


