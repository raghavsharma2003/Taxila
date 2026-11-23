# stuck-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1740 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2233 ms · guard mustsay]: Chalo, main batati hoon. Kitchen mein Maa ne garam roti banayi, aur tum do bhai-behen ho: dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai, aur ek tukde mein rang hai. Fraction mein neeche wala number roti ke kul barabar tukde ginta hai, upar wala number, jitne tukde humne liye. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 1080 ms]: Roti ke saare tukde ungli se gino, phir sirf rang wale. Dono gintiyan fraction mein kahan jaati hain, yeh socho. Ab phir se socho, jawab kya hoga?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2213 ms · guard ask]: Haan, ise Hindi mein bolti hoon. Roti ke do barabar tukde hain, aur ek par rang laga hai. Rang laga tukda poori roti ka kitna hai, fraction mein?
  > card: Roti ke do barabar tukde hain, aur ek par rang laga hai. Rang laga tukda poori roti ka kitna hai, fraction mein?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 1649 ms · guard noconfirm]: Haan, sahi hai. Dekho, roti ke 2 barabar tukdon mein se 1, yaani 1/2. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 1579 ms]: Pizza ka chhota tukda uske bade tukde ke saath milaa kar dekho. Phir cake ke tukdon ko aapas mein milao. Kya pizza ka ek chhota tukda poore pizza ka ek-tihaai hai?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** nahi, tukde barabar nahi hain  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1663 ms · guard mustsay]: Bilkul sahi: tukde barabar nahi, aur chhota tukda 1/3 se chhota hai. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1711 ms]: 3 barabar tukdon wale circle mein 1 tukda rangin hai; ek aur rangne par, rangin tukde poore circle ka kaunsa fraction honge?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1785 ms]: Wahi circle ab patti mein khula hai: teen barabar tukde, ek mein rang, do bina rang ke. Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** 2/3  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2494 ms · guard mustsay,long,noconfirm]: Haan, sahi hai, kyunki circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** 1/5  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1660 ms · guard long,uncorrected]: 1/5 sahi nahi hai. Ise doosri tarah samajhte hain. Is chocolate ke 10 barabar tukde hain, aur rangin 3 khaye gaye. Neeche wala number saare 10 ginta hai; khaane se woh ginti nahi badalti. Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1844 ms]: Board par chocolate ke saare tukde gino, rangin bhi aur bina rang ke bhi. Phir sirf rangin tukde gino. Board ki chocolate ke jo tukde khaye gaye, unke liye Pinky ka 2/4 theek hai ya Golu ka 2/2?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 1756 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ek roti 8 barabar tukdon mein kati socho. Usmein se 3 kha lo ya 5, roti phir bhi 8 tukdon se hi bani thi, isliye neeche wala number 8 hi rehta hai. Upar wala number woh tukde ginta hai jinki baat ho rahi hai, yahan khaye hue. Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 2343 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (2 miss) · board up · ready 2352 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Khaane se pehle wali poori chocolate ke saare tukde neeche wale number mein jaate hain. Upar wale number mein sirf woh tukde, jinki baat poochhi gayi hai. Board ki chocolate ke jo tukde khaye gaye, unke liye Pinky ka 2/4 theek hai ya Golu ka 2/2?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [repair · beat s1:check:then:c4-maths-ch05-t01-m-part-part · board up · ready 1938 ms]: Yeh jawab sahi nahi hai. Is sawaal ka jawab: Pinky ki baat sahi hai, kyunki 4 barabar tukdon mein se 2 khaye, toh 2/4; neeche wala number saare 4 tukde ginta hai, bache hue 2 nahi. Yeh hissa saaf hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e4 · board up · ready 1885 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 2350 ms · guard long]: Achha, toh tumhe batting sabse achha lagta hai. Ab pehle wale sawaal ko phir se dekhte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** nahi, 1/6 hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1067 ms]: Haan, sahi hai. Dekho, Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Is baar rangin tukde woh hain jo plate par bache. Plate par bache tukdon ke fraction mein neeche wala number kya hoga?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2418 ms · guard quiz]: Plate par bache tukdon ke fraction mein neeche wala number kya hoga?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 7  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 1133 ms · guard long]: Nahi, yeh nahi hai. Neeche wala number saare tukde ginta hai, yaani 5, kyunki khaane se pehle barfi 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 2/3  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked (1 miss) · board up · ready 831 ms · guard uncorrected]: 2/3 sahi nahi hai. Pehle gino plate par kitne tukde bache; woh ginti upar jaati hai, aur neeche saare 5. 5 barabar tukdon wali barfi ke 3 tukde khaane ke baad, plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/3  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked (2 miss) · board up · ready 1798 ms · guard leak,uncorrected]: Nahi, yeh theek nahi hai. Board par barfi dekho: rangin tukde plate par bache hain, aur bina rang ke tukde kha liye gaye. Hum do gintiyan karenge, aur unhi se fraction banega. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/5 hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2422 ms · guard screen]: Haan, sahi hai: 5 barabar tukdon mein se 2 bache; neeche wala number 5 hai, saare tukde, khaye hue 3 nahi. Toh poora jawab: bache hue tukde barfi ka 2/5 hain. Ab agla sawaal tumhare liye. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** ek bata do  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 2636 ms · guard answerinq]: Bilkul sahi, kyunki laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Bada tukda 1/2"}]}}

**child:** 11 tukde bache  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 813 ms]: Haan, bilkul theek. Dekho, 1/12 ka matlab chocolate ke 12 barabar tukdon mein se 1 khaya; 12 mein se 1 gaya, toh 11 bache. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 1646 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ek aur tareeka dekhte hain. Rassi ke 3 tukde hain, par ek lamba aur do chhote: inhe gin kar ek-tihaai nahi keh sakte. Kaagaz ke dono tukde ek jaise hain, toh har tukda aadha hai. Roti ke 2 tukde hue, ek bada, ek chhota. Bada tukda aadhe se kam hai, aadha, ya zyada?
  > card: Roti ke 2 tukde hue, ek bada, ek chhota. Bada tukda aadhe se kam hai, aadha, ya zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** aadhe se zyada hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 (1 miss) · board up · ready 1494 ms]: Sahi jawab, kyunki do tukde barabar hon tabhi har ek aadha hota; yahan bada tukda chhote se bada hai, toh aadhe se zyada. Chalo, pehle wale sawaal ki taraf wapas aate hain. Ek bade aur teen ek jitne chhote tukdon wale cake mein, ek chhota tukda 1/4 se kam hai, barabar hai, ya zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 (2 miss) · board up · ready 3410 ms · guard content_filter_rewrite]: Nahi, yeh theek nahi hai. Socho, chaaron tukde barabar hote toh har ek kitna hota. Phir dekho, bade tukde ne baaki teen ke liye kitni jagah chhodi. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** ek-chauthaai se kam  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1723 ms]: Haan, sahi hai. Dekho, chaaron tukde milkar poora cake hain; teen chhote barabar hain aur bada unse bada, toh har chhota tukda 1/4 se kam. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Yeh hissa saaf hua?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 1592 ms · guard mustsay]: Theek hai, main shuru karti hoon. Do bachche yeh 12 laddoo barabar baantenge. Aadha matlab: dono ke paas ek jitne laddoo, aur ek bachche ke laddoo hi aadha. Dono ke laddoo jodkar dekho, toh saare 12 wapas mil jaate hain. 12 laddoo ka aadha kitne laddoo hai?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** mujhe lagta hai 6  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 · board up · ready 2804 ms · guard screen,mustsay,leak]: Bilkul sahi: 2 barabar group, har ek mein 6 laddoo. 24 aam 6 barabar group mein hain, har group mein 4: ek group 24 ka 1/6 hai. Chhote group jodkar bade barabar group bhi bante hain: teen-teen jodo, toh har bada group 24 ka 1/2 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (1 miss) · board up · ready 972 ms · guard uncorrected]: 4 sahi nahi hai. 6 group ko 3 bachchon mein ek-ek karke baanto. Ek bachche ke paas kitne group aaye, woh gino. 24 aam ke 6 barabar group mein se, 24 ka 1/3 lene ke liye kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** do group  _(correct)_

**Asha** [repair · beat s2:explain:e2 · board up · ready 1096 ms]: Haan, bilkul theek, kyunki 6 group ko jod kar 3 barabar bade group banao: har bade group mein 2 group, yaani 8 aam. Ab tak samajh aaya?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1264 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

## Agent


