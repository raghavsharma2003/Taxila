# stuck-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2018 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 3732 ms · guard mustsay,leak]: Chalo, main batati hoon. Kitchen mein Maa ne garam roti banayi, aur tum do bhai-behen ho: dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai, aur ek tukde mein rang hai. Fraction mein neeche wala number roti ke kul barabar tukde ginta hai, upar wala number, jitne tukde humne liye. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 1195 ms]: Roti ke saare tukde ungli se gino, phir sirf rang wale. Dono gintiyan fraction mein kahan jaati hain, yeh socho. Ab phir se socho, jawab kya hoga?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 3248 ms · guard ask]: Achha, ise ek aasaan tareeke se kehti hoon. Roti ke ek tukde mein rang hai, doosre mein nahi. Rang wala tukda poori roti ka kaunsa fraction hai?
  > card: Roti ke ek tukde mein rang hai, doosre mein nahi. Rang wala tukda poori roti ka kaunsa fraction hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 1940 ms · guard noconfirm]: Haan, sahi hai. Dekho, roti ke 2 barabar tukdon mein se 1, yaani 1/2. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2157 ms]: Pizza ka chhota tukda uske bade tukde ke saath milaa kar dekho. Phir cake ke tukdon ko aapas mein milao. Kya pizza ka ek chhota tukda poore pizza ka ek-tihaai hai?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** nahi  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1408 ms · guard mustsay]: Bilkul sahi: pizza ke tukde chhote-bade hain, aur ek-tihaai tabhi banta hai jab 3 tukde barabar hon. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1830 ms]: Ek aur tukde mein rang bharne ke baad, rangin tukde poore circle ka kaunsa fraction hain?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2290 ms]: Wahi circle ab patti mein khula hai: teen barabar tukde, ek mein rang, do bina rang ke. Ab phir se socho, jawab kya hoga?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** 2/3  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 3459 ms · guard mustsay,long]: Haan, sahi hai, kyunki 3 barabar tukdon mein se 2 mein rang, yaani 2/3. Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 3191 ms · guard long,uncorrected]: Nahi, yeh theek nahi hai. Ise doosri tarah samajhte hain. Socho, chocolate ke saare tukde barabar hain. Neeche wala number poori chocolate ke tukde ginta hai; kuch tukde kha lo, woh ginti wahi rehti hai. Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 3335 ms · guard long]: Board par chocolate ke saare tukde gino, rangin bhi aur bina rang ke bhi. Phir sirf rangin tukde gino. Is chocolate ke rangin tukde khaye gaye: Pinky ka 2/4 sahi hai ya Golu ka 2/2?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 1784 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ek roti 8 barabar tukdon mein kati socho. Usmein se 3 kha lo ya 5, roti phir bhi 8 tukdon se hi bani thi, isliye neeche wala number 8 hi rehta hai, aur upar wala number sirf khaye hue tukde ginta hai. Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 3427 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (2 miss) · board up · ready 1926 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Khaane se pehle wali poori chocolate ke saare tukde neeche wale number mein jaate hain. Upar wale number mein sirf woh tukde, jinki baat poochhi gayi hai. Is chocolate ke rangin tukde khaye gaye: Pinky ka 2/4 sahi hai ya Golu ka 2/2?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [repair · beat s1:check:then:c4-maths-ch05-t01-m-part-part · board up · ready 4036 ms · guard praise,affirms,uncorrected]: Nahi, yeh theek nahi hai. Is sawaal ka jawab: Pinky ki baat sahi hai, kyunki 4 barabar tukdon mein se 2 khaye, toh 2/4; neeche wala number saare 4 tukde ginta hai, bache hue 2 nahi. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e4 · board up · ready 1774 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 3776 ms · guard long]: Achha, toh tumhe batting sabse achha lagta hai. Ab pehle wale sawaal ko phir se dekhte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** no, it is 1/6  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1991 ms]: Haan, sahi hai. Dekho, Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Is baar rangin tukde woh hain jo plate par bache. Neeche wale number mein kaunse tukde ginoge: saare, ya sirf khaye hue?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2664 ms]: Neeche wale number mein kaunse tukde ginoge: saare, ya sirf khaye hue?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3464 ms · guard quiz]: Khaane se pehle wali poori barfi yaad karo, jab ek bhi tukda khaya nahi gaya tha. Neeche wala number usi barfi ki baat karta hai. Neeche wale number mein kaunse tukde ginoge: saare, ya sirf khaye hue?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** yeh step samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 2313 ms]: Neeche wala number poori barfi ke tukde ginta hai: saare tukde: 5, kyunki barfi khaane se pehle 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 2149 ms]: Pehle gino plate par kitne tukde bache; woh ginti upar jaati hai, aur neeche saare 5. Plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/3  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked (1 miss) · board up · ready 1220 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Board par barfi dekho: rangin tukde plate par bache hain, aur bina rang ke tukde kha liye gaye. Hum do gintiyan karenge, saare tukde aur bache hue tukde, aur unhi se fraction banega. Ab phir se socho, jawab kya hoga?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/3  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked (2 miss) · board up · ready 1073 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Pehle ek chhoti baat yaad karo: roti ke 2 barabar tukdon mein se 1 bacha, toh roti ka 1/2 bacha. Barfi mein bhi wahi karna hai: saare tukde neeche wale number mein, bache hue upar wale number mein. Plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/5 hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 3837 ms · guard screen]: Haan, sahi hai: 5 barabar tukdon mein se 2 bache; neeche wala number 5 hai, saare tukde, khaye hue 3 nahi. Toh poora jawab: bache hue tukde barfi ka 2/5 hain. Ab agla sawaal tumhare liye. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** ek bata do  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 3766 ms · guard answerinq]: Bilkul sahi, kyunki laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Bada tukda 1/2"}]}}

**child:** 11 pieces  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 1198 ms]: Haan, bilkul theek. Dekho, 1/12 ka matlab chocolate ke 12 barabar tukdon mein se 1 khaya; 12 mein se 1 gaya, toh 11 bache. Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 2508 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ek aur tareeka dekhte hain. Yeh rassi ek lambe aur do chhote tukdon mein kati, isliye in tukdon ka fraction naam nahi hota. Kaagaz beech se kata, dono tukde ek jaise, toh unka fraction naam hai. Roti ke 2 tukde hue: ek bada, ek chhota. Kya bada tukda roti ke aadhe se zyada hai?
  > card: Roti ke 2 tukde hue: ek bada, ek chhota. Kya bada tukda roti ke aadhe se zyada hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** Yes  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 (1 miss) · board up · ready 1367 ms]: Sahi jawab, kyunki do tukde barabar hon tabhi har ek aadha hota; yahan bada tukda chhote se bada hai, toh aadhe se zyada. Chalo, pehle wale sawaal ki taraf wapas aate hain. Ek bade aur teen chhote tukdon wale cake mein, ek chhota tukda 1/4 se kam hai, barabar hai, ya zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 (2 miss) · board up · ready 2477 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Socho, chaaron tukde barabar hote toh har ek kitna hota. Phir dekho, bade tukde ne baaki teen ke liye kitni jagah chhodi. Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** chhota  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1353 ms]: Haan, sahi hai. Dekho, chaaron tukde milkar poora cake hain aur bada tukda baaki se bada hai, toh har chhota tukda 1/4 se kam. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1330 ms]: Aaj ke liye itna hi, phir milte hain!

## Agent


