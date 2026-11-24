# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2449 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2020 ms · guard long]: Chalo, main batati hoon. Kitchen mein Maa ne garam roti banayi, aur tum do bhai-behen ho: dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai, aur ek tukde mein rang hai. Fraction mein neeche wala number roti ke kul barabar tukde ginta hai, upar wala number, jitne tukde humne liye. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2208 ms · guard noconfirm]: Haan, bilkul theek. Dekho, roti ke 2 barabar tukdon mein se 1, yaani 1/2. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** nahi, tukde barabar nahi hain  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1692 ms · guard mustsay]: Sahi jawab, kyunki tukde barabar nahi, aur chhota tukda 1/3 se chhota hai. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** two thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 1153 ms · guard mustsay,long]: Haan, sahi hai: circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** 1/5  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 2209 ms · guard long,uncorrected]: 1/5 sahi nahi hai. Ise alag tareeke se dekhte hain. Is chocolate ke 10 barabar tukde hain, aur rangin 3 khaye gaye. Neeche wala number saare 10 ginta hai; khaane se woh ginti nahi badalti. Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 2196 ms]: Board ki chocolate ke jo tukde khaye gaye, unke liye Pinky ka 2/4 theek hai ya Golu ka 2/2?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** pinky sahi  _(correct)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 934 ms]: Haan, bilkul theek. Suno, 4 barabar tukdon mein se 2 khaye, toh 2/4; neeche wala number saare 4 tukde ginta hai, bache hue 2 nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** one upon six  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2107 ms]: Sahi jawab, kyunki Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte. Aao, agla sawaal main aur tum saath mein karenge. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Is baar rangin tukde woh hain jo plate par bache. Plate par bache tukdon ke fraction mein neeche wala number kya hoga?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** sab tukde  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 1224 ms · guard long]: Haan, 5: barfi 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 2 by 5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 1903 ms · guard screen]: Haan, sahi hai. 5 barabar tukdon mein se 2 bache; neeche wala number 5 hai, saare tukde, khaye hue 3 nahi. Toh poora jawab: bache hue tukde barfi ka 2/5 hain. Ab agla sawaal tumhare liye. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 3089 ms · guard twoq]: Dono chhote tukde jodo aur bade tukde se milao. Phir dekho, bada tukda poore laddoo ka kitna gherta hai. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2975 ms · guard leak,samecard]: Laddoo ab ek patti mein hai, teen tukdon mein: ek lamba aur do chhote, aur teeno milkar poora laddoo. Ab tum batao.
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** 1/2 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 2691 ms · guard answerinq]: Haan, bilkul theek: laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 1080 ms · guard uncorrected]: 12 sahi nahi hai. 12 toh khaane se pehle ki ginti hai; jo tukda khaya, woh ab chocolate mein nahi hai. 12 barabar tukdon wali chocolate ka 1/12 khaya gaya, toh kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 2031 ms]: Achha, ab Hindi mein kehti hoon. 12 tukdon wali chocolate ka 1/12 pet mein chala gaya. Plate par ab kitne tukde rahe?
  > card: 12 tukdon wali chocolate ka 1/12 pet mein chala gaya. Plate par ab kitne tukde rahe?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (2 miss) · board up · ready 2397 ms · guard answerinq,uncorrected]: Nahi, 12 theek nahi. Socho, 1/12 ka neeche wala number kya ginta hai, aur upar wala kya ginta hai. Ab tumhara jawab sunti hoon.
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** gyarah  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 978 ms]: Sahi jawab, kyunki 1/12 ka matlab chocolate ke 12 barabar tukdon mein se 1 khaya; 12 mein se 1 gaya, toh 11 bache. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2218 ms]: Haan, pehle tum try karo.
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2073 ms]: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** 1/4 se chhota  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1000 ms · guard noconfirm]: Haan, bilkul theek. Chaaron tukde milkar poora cake hain; teen chhote barabar hain aur bada unse bada, toh har chhota tukda 1/4 se kam. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"Cake"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 4320 ms · guard answerinq]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Do bachche yeh 12 laddoo barabar baantenge. Aadha matlab: dono ke paas ek jitne laddoo, aur ek bachche ke laddoo hi aadha. Dono ke laddoo jodkar dekho, toh saare 12 wapas mil jaate hain. 12 laddoo ka aadha kitne laddoo hai?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"Cake"}]}}

**child:** 6 laddoo  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 1432 ms]: Sahi jawab, kyunki 12 laddoo 2 barabar group mein jaayein toh har group mein 6, aur 2 × 6 = 12. Cricket ki baari aa gayi: uske baare mein thoda aur batao na?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** batting sabse achhi lagti hai  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 · board up · ready 3408 ms · guard screen,mustsay,answerinq]: Wah, batting! Toh yeh tumhe achhi lagti hai. Toh ab wahin se shuru karte hain jahan ruke the. 24 aam 6 barabar group mein hain, har group mein 4: ek group 24 ka 1/6 hai. Chhote group jodkar bade barabar group bhi bante hain: teen-teen jodo, toh har bada group 24 ka 1/2 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** 4  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (1 miss) · board up · ready 1215 ms · guard uncorrected]: 4 sahi nahi hai. Ek group mein 4 aam hain, par yahan group ginne hain; 1/3 mein utne group aate hain jitne teen baar lene par poore 6 group ban jaayein. 24 aam ke 6 barabar group mein se, 24 ka 1/3 lene ke liye kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** do group uthaunga  _(correct)_

**Asha** [repair · beat s2:explain:e2 · board up · ready 2148 ms]: Haan, bilkul theek: 6 group ko jod kar 3 barabar bade group banao: har bade group mein 2 group, yaani 8 aam. Yahan tak theek hai?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 1940 ms · guard mustsay]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 · board up · ready 1880 ms]: Wah, chauka! Toh yahi baat tumhe pasand hai. Ab seekhne par wapas aate hain. Yeh 20 kanche 10-10 ke 2 barabar group mein hain, toh 10 kanche 20 ka aadha hain, 1/2. Yahan neeche wala number 2 barabar group ginta hai. Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > card: Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** one upon four  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2266 ms]: Sahi jawab, kyunki 4 × 5 = 20: 20 ke 4 barabar group, har ek mein 5; yeh 1/4 hai, 5/20 bhi sahi. Chalo, ab ek sawaal hum dono saath mein karte hain. 15 pencil ka 1/3 nikaalna hai. 15 pencil ko 3 barabar group mein baantoge, ya 3-3 pencil ke group banaoge?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":5}}

**child:** 3 equal groups  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch05-t01-s2:ask:worked · board up · ready 2408 ms · guard affirms,answerinq]: Sahi: 15 pencil ke 3 barabar group banane hain, aur ek group lena hai. Tumhari baari: ek group mein kitni pencil aayengi?
  > card: Tumhari baari: ek group mein kitni pencil aayengi?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** 5 pencil  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch05-t01-s2:c1 · board up · ready 1698 ms]: Haan, bilkul theek. 3 group mein 5-5 pencil rakho toh poori 15 ho jaati hain, 3 × 5 = 15. Toh poora jawab: 15 pencil ka 1/3 = 5 pencil. Ab ek sawaal tum akele karo. 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Ravi ke paas saare laddoo ka kaunsa fraction gaya?
  > card: 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Ravi ke paas saare laddoo ka kaunsa fraction gaya?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":5}}

**child:** 1/2  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch05-t01-m-part-part · board up · ready 1074 ms]: 1/2 sahi nahi hai. Ise doosri tarah samajhte hain. Board par 5 barabar thaile hain, har ek mein 7 kele. Yahan kele nahi, thaile gino; jo thaila diya, woh 5 thailon mein se ek hai. Yahan tak theek hai?
  > screen: board equal-groups@1 {} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":6,"shade":0,"labels":false,"hideResult":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s2:check:then:c4-maths-ch05-t01-m-part-part · board up · ready 2373 ms]: Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[7,7,7,7,7]}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [practice · beat s2:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s2:then:c4-maths-ch05-t01-m-part-part · board up · ready 2270 ms]: Arre, Virat! Toh tumhara favourite yahi hai. Chalo, ab padhai aage badhate hain. 30 kele 6 thailon mein barabar bhare, aur 1 thaila kisi ko de diya. Woh thaila saare kelon ka 1/5 hai ya 1/6?
  > card: 30 kele 6 thailon mein barabar bhare, aur 1 thaila kisi ko de diya. Woh thaila saare kelon ka 1/5 hai ya 1/6?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[7,7,7,7,7]}}

**child:** ek chhatha  _(correct)_

**Asha** [repair · beat s2:check:then:c4-maths-ch05-t01-m-part-part · board up · ready 1159 ms]: Sahi jawab, kyunki 6 barabar thailon mein se diya hua thaila 1/6 hai; neeche wala number saare 6 thaile ginta hai, bache 5 nahi. Yahan tak saaf hai?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":5}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 935 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":5}}

## Agent


