# stuck-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2287 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2225 ms · guard mustsay]: Chalo, main batati hoon. Maa ki garam roti do bachche khaayenge, toh dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai. Fraction mein neeche wala number saare barabar tukde ginta hai, aur upar wala rangin tukde. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 1072 ms]: Roti ke saare tukde ungli se gino, phir sirf rang wale. Dono gintiyan fraction mein kahan jaati hain, yeh socho. Rangin tukda roti ka kaunsa fraction hai?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2923 ms · guard ask]: Haan, ise Hindi mein bolti hoon. Roti ke do barabar tukde hain, aur ek par rang laga hai. Rang laga tukda poori roti ka kitna hai, fraction mein?
  > card: Roti ke do barabar tukde hain, aur ek par rang laga hai. Rang laga tukda poori roti ka kitna hai, fraction mein?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2004 ms · guard noconfirm]: Haan, sahi hai. Kul tukde 2, rangin 1: 1/2. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2266 ms]: Pizza ka chhota tukda uske bade tukde ke saath milaa kar dekho. Phir cake ke tukdon ko aapas mein milao. Kya pizza ka ek chhota tukda poore pizza ka ek-tihaai hai?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** nahi, tukde barabar nahi hain  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1902 ms · guard mustsay]: Bilkul sahi: tukde barabar nahi, aur chhota tukda 1/3 se chhota hai. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1966 ms]: Ek aur tukda rangne par, rangin tukde circle ka kaunsa fraction honge?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle","hideResult":true}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1820 ms]: Yahi circle ab ek patti bana hai: teen barabar tukde, unmein se ek rangin. Ab tum batao.
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle","hideResult":true}}

**child:** 2/3  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 1250 ms · guard mustsay,long]: Haan, sahi hai, kyunki circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** 1/5  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1038 ms · guard uncorrected]: 1/5 sahi nahi hai. Ise doosri tarah samajhte hain. Is chocolate ke 10 barabar tukde hain, aur rangin 3 khaye gaye. Neeche wala number saare 10 ginta hai; khaane se woh ginti nahi badalti. Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 2003 ms]: Board par chocolate ke saare tukde gino, rangin bhi aur bina rang ke bhi. Phir sirf rangin tukde gino. Board ki chocolate ke jo tukde khaye gaye, unke liye Pinky ka 2/4 theek hai ya Golu ka 2/2?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 1892 ms · guard uncorrected]: Nahi, yeh theek nahi hai. 2/2 ka matlab poori chocolate hoti, par poori chocolate toh khayi nahi gayi; 2/2 kehne wale ne neeche chocolate ke saare tukde nahi gine. Ab tumhara jawab sunti hoon.
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 2250 ms]: Haan, pehle tum try karo. Ab phir se socho, jawab kya hoga?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (2 miss) · board up · ready 2196 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ek roti 8 barabar tukdon mein kati socho. Usmein se 3 kha lo ya 5, roti phir bhi 8 tukdon se hi bani thi, isliye neeche wala number 8 hi rehta hai. Upar wala number woh tukde ginta hai jinki baat ho rahi hai, yahan khaye hue. Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (3 miss) · board up · ready 2187 ms · guard twoq,uncorrected]: Yeh jawab sahi nahi hai. Pinky-Golu wali chocolate ke bina rang wale tukde bhi usi chocolate ke the, isliye neeche woh bhi gine jaate hain. Aaram se socho, phir batao.
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** pinky  _(correct)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 1079 ms]: Haan, sahi hai. Chocolate ke kul 4 tukde the, 2 khaye gaye: 2/4; neeche saare 4 tukde aate hain, bache hue 2 nahi. Ab pehle wale sawaal ko phir se dekhte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** 1/5  _(misconception)_

**Asha** [hint · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (2 miss) · board up · ready 1076 ms · guard uncorrected]: Nahi, 1/5 theek nahi. Raju ka kaata hua tukda bhi isi patti ka tha; use wapas rakho toh patti ke kitne tukde hote, neeche wahi ginti aati hai. 6 barabar tukdon wali patti se Raju ne 1 tukda kaata aur 5 bache, toh Raju ne patti ka kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** Raju galat hai, 1/6  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2041 ms]: Bilkul sahi: Raju ne 6 barabar tukdon wali patti se ek tukda liya, toh 1/6; bache hue 5 tukde naam nahi badalte. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Is baar rangin tukde woh hain jo plate par bache. Plate par bache tukdon ke fraction mein neeche wala number kya hoga?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3034 ms · guard quiz]: Bachi barfi ke fraction mein neeche kya aayega?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 2246 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** batting  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3345 ms · guard quiz]: Oho, batting! Isi mein tumhe maza aata hai. Ab seekhne par wapas aate hain. Plate par bache tukdon ke fraction mein neeche wala number kya hoga?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 7  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 1224 ms · guard diagnosis]: Nahi, yeh nahi hai. Neeche wala number saare tukde ginta hai, yaani 5, kyunki khaane se pehle barfi 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** do bata paanch  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 4635 ms · guard screen]: Haan, sahi hai. Toh poora jawab: bache hue tukde barfi ka 2/5 hain. Ab agla sawaal tumhare liye. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** ek bata do  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 3330 ms · guard answerinq]: Bilkul sahi. Laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"shade":1,"title":"Laddoo"},{"parts":2,"shade":1,"title":"1/2"}]}}

**child:** 10  _(incorrect)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 1059 ms · guard uncorrected]: 10 sahi nahi hai. Board ki chocolate ka ek tukda haath se dhak do, woh khaya hua 1/12 hai; ab baaki tukde gino. 12 barabar tukdon wali chocolate ka 1/12 khaya gaya, toh kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** 11 pieces  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 1210 ms]: Haan, bilkul theek: 1/12 matlab 12 barabar tukdon wali chocolate ka ek tukda khaya; 12 mein se 1 gaya, toh 11 bache. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 2156 ms]: Nahi, yeh theek nahi hai. Ek aur tareeka dekhte hain. Rassi ke 3 tukde hain, par ek lamba aur do chhote: inhe gin kar ek-tihaai nahi keh sakte. Kaagaz ke dono tukde ek jaise hain, toh har tukda aadha hai. Roti ke 2 tukde hue, ek bada, ek chhota. Bada tukda aadhe se kam hai, aadha, ya zyada?
  > card: Roti ke 2 tukde hue, ek bada, ek chhota. Bada tukda aadhe se kam hai, aadha, ya zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** aadha  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts (1 miss) · board up · ready 3069 ms · guard samecard,uncorrected]: Nahi, yeh jawab nahi hai. Aadha tab hota jab dono tukde ek jitne hote; yahan dono ek jitne nahi hain. Roti ka bada tukda: aadhe se kam, aadha, ya aadhe se zyada?
  > card: Roti ke 2 tukde hue, ek bada, ek chhota. Bada tukda aadhe se kam hai, aadha, ya zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}}

**child:** aadha  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts (2 miss) · board up · ready 2931 ms · guard leak,uncorrected]: Yeh jawab sahi nahi hai. Roti ke beech mein ek line socho jo use do barabar aadhon mein baante. Ab dekho, bada tukda us line par rukta hai ya usse aage jaata hai. Ab tum batao.
  > card: Roti ke 2 tukde hue, ek bada, ek chhota. Bada tukda aadhe se kam hai, aadha, ya zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}}

**child:** zyada  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 (1 miss) · board up · ready 1087 ms]: Haan, sahi hai, kyunki do tukde barabar hon tabhi har ek aadha hota; yahan bada tukda chhote se bada hai, toh aadhe se zyada. Chalo, pehle wale sawaal ki taraf wapas aate hain. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** less  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1139 ms]: Bilkul sahi. Chaaron tukde milkar poora cake hain; teen chhote barabar hain aur bada unse bada, toh har chhota tukda 1/4 se kam. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"Cake"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1207 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milte hain!

## Agent


