# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2583 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2299 ms · guard mustsay]: Chalo, main batati hoon. Kitchen mein Maa ne garam roti banayi, aur tum do bhai-behen ho: dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai, aur ek tukde mein rang hai. Fraction mein neeche wala number roti ke kul barabar tukde ginta hai, upar wala number, jitne tukde humne liye. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda roti ka kaunsa fraction hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 1765 ms · guard noconfirm]: Haan, bilkul theek. Dekho, roti ke 2 barabar tukdon mein se 1, yaani 1/2. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** nahin  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1254 ms · guard mustsay]: Sahi jawab, kyunki pizza ke tukde chhote-bade hain, aur ek-tihaai tabhi banta hai jab 3 tukde barabar hon. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** two thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2716 ms · guard mustsay,leak,long]: Haan, sahi hai: 3 barabar tukdon mein se 2 mein rang, yaani 2/3. Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 3192 ms · guard long]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Socho, chocolate ke saare tukde barabar hain. Neeche wala number poori chocolate ke tukde ginta hai; kuch tukde kha lo, woh ginti wahi rehti hai. Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 2101 ms]: Is chocolate ke rangin tukde khaye gaye: Pinky ka 2/4 sahi hai ya Golu ka 2/2?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** pinky's  _(correct)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 1327 ms]: Haan, bilkul theek. Dekho, 4 barabar tukdon mein se 2 khaye, toh 2/4; neeche wala number saare 4 tukde ginta hai, bache hue 2 nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** nahi, 1/6 hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1334 ms]: Sahi jawab, kyunki Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte. Aao, agla sawaal main aur tum saath mein karenge. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Is baar rangin tukde woh hain jo plate par bache. Neeche wale number mein kaunse tukde ginoge: saare, ya sirf khaye hue?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** all pieces  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 2579 ms · guard affirms]: Haan, saare tukde: barfi 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 2 by 5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2259 ms · guard screen]: Haan, sahi hai. Dekho, 5 barabar tukdon mein se 2 bache; neeche wala number 5 hai, saare tukde, khaye hue 3 nahi. Toh poora jawab: bache hue tukde barfi ka 2/5 hain. Ab agla sawaal tumhare liye. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 1912 ms]: Dono chhote tukde jodo aur bade tukde se milao. Phir dekho, bada tukda poore laddoo ka kitna gherta hai. Ab phir se socho, jawab kya hoga?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2121 ms]: Laddoo ab ek patti mein hai, teen tukdon mein: ek lamba aur do chhote, aur teeno milkar poora laddoo. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** ek bata do  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 4943 ms · guard answerinq]: Haan, bilkul theek: laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Bada tukda 1/2"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 1080 ms · guard uncorrected]: 12 sahi nahi hai. Socho, 1/12 ka neeche wala number kya ginta hai, aur upar wala kya ginta hai. 12 barabar tukdon wali chocolate ka 1/12 khaya gaya, toh kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 3233 ms · guard answerinq]: Haan, yahi baat aur seedhe tareeke se bolti hoon. Tumhari chocolate mein 12 barabar tukde hain, aur tumne 1/12 kha liya. Ab kitne tukde bache hain?
  > card: Tumhari chocolate mein 12 barabar tukde hain, aur tumne 1/12 kha liya. Ab kitne tukde bache hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** 12  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 1331 ms]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 11 hai, kyunki 1/12 ka matlab chocolate ke 12 barabar tukdon mein se 1 khaya; 12 mein se 1 gaya, toh 11 bache. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2705 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 3370 ms · guard praise,affirms,ratefrac]: Haan, pehle tum try karo.
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 1979 ms]: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** 1/4 se kam  _(correct)_

**Asha** [repair · beat s1:check:c3 · board up · ready 1360 ms]: Haan, bilkul theek, kyunki chaaron tukde milkar poora cake hain aur bada tukda baaki se bada hai, toh har chhota tukda 1/4 se kam. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1938 ms · guard mustsay]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 2351 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab seekhne par wapas aate hain. Do bachche yeh 12 laddoo barabar baantenge. Aadha matlab: dono ke paas ek jitne laddoo, aur ek bachche ke laddoo hi aadha. Dono ke laddoo jodkar dekho, toh saare 12 wapas mil jaate hain. 12 laddoo ka aadha kitne laddoo hai?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** mujhe lagta hai 6  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 · board up · ready 3360 ms · guard screen,mustsay,answerinq,leak,noconfirm]: Sahi jawab. Dekho, 2 barabar group, har ek mein 6 laddoo. 24 aam 6 barabar group mein hain. 1/6 ka matlab: 6 barabar group banao aur ek group lo, toh 24 ka 1/6 hai 4 aam. Chhote group jodkar bade group bhi bante hain: teen-teen milao, toh har bada group 24 ka 1/2 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (1 miss) · board up · ready 1275 ms · guard uncorrected]: 4 sahi nahi hai. 6 group ko 3 bachchon mein ek-ek karke baanto. Ek bachche ke paas kitne group aaye, woh gino. 24 aam ke 6 barabar group mein se, 24 ka 1/3 lene ke liye kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** 0  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (2 miss) · board up · ready 2977 ms · guard screen,answerinq,uncorrected]: Nahi, 0 theek nahi. Socho, 6 bachche yeh 24 aam barabar baantein: har bachche ko ek group milta hai, 4 aam. Yahi 24 ka 1/6 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** do  _(correct)_

**Asha** [repair · beat s2:explain:e2 · board up · ready 1427 ms]: Haan, bilkul theek: 6 group ko jod kar 3 barabar bade group banao: har bade group mein 2 group, yaani 8 aam. Yeh hissa saaf hua?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 · board up · ready 2622 ms · guard mustsay]: Haan, sixer maara, yeh tumne bataya tha. Toh ab wahin se shuru karte hain jahan ruke the. Yeh 20 kanche 2 barabar group mein hain. Ek group ke 10 kanche 20 ka aadha hain, 1/2. Group mein kitne hain, yeh pata ho, toh group gino: wahi neeche wala number. Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > card: Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** one quarter  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1264 ms · guard long]: Sahi jawab, kyunki 4 × 5 = 20, toh 20 kanche 4 bachchon mein barabar batte hain; har bachche ke 5 kanche 1/4 hain. Chalo, ab ek sawaal hum dono saath mein karte hain. 15 pencil ka 1/3 nikaalna hai. 1/3 ke liye 15 pencil ko kitne barabar group mein baantoge?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":5}}

**child:** 1  _(incorrect)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch05-t01-s2:ask:worked · board up · ready 2714 ms · guard answerinq]: Yeh jawab nahi hai. 1/3 ka neeche wala number group ginta hai: 3 barabar group, unmein se 1 group lena, kyunki upar wala 1 batata hai kitne group lene hain. Tumhari baari: ek group mein kitni pencil aayengi?
  > card: Tumhari baari: ek group mein kitni pencil aayengi?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** 5  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch05-t01-s2:c1 · board up · ready 1422 ms]: Haan, sahi hai. Dekho, 3 group mein 5-5 pencil rakho toh poori 15 ho jaati hain, 3 × 5 = 15. Toh poora jawab: 15 pencil ka 1/3 = 5 pencil. Ab ek sawaal tum akele karo. 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Ravi ke paas saare laddoo ka kaunsa fraction gaya?
  > card: 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Ravi ke paas saare laddoo ka kaunsa fraction gaya?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":5}}

**child:** one-third  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch05-t01-s2:c2 · board up · ready 5185 ms · guard leak]: Haan, bilkul theek: 18 laddoo 3 barabar plate mein the, har plate mein 6; Ravi ne 1 plate li, yaani 1/3. 16 kanche 4 group mein bate: 7, 3, 3 aur 3. Rani kehti hai 7 wala group saare kanchon ke 1/4 se bada hai. Kya Rani sahi hai?
  > card: 16 kanche 4 group mein bate: 7, 3, 3 aur 3. Rani kehti hai 7 wala group saare kanchon ke 1/4 se bada hai. Kya Rani sahi hai?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":6}}

**child:** No  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s2:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 5282 ms · guard long,screenmismatch]: Yeh jawab sahi nahi hai. Ise doosri tarah samajhte hain. Socho, saari cheezein baari-baari 3 group mein daal rahe ho, jab tak khatam na hon. Ek group mein jitni aayein, 1/3 utna hi hai. 21 pencil 3 doston mein bati: 9, 6 aur 6. Kiske paas theek 1/3 hai: 9 wale ke, 6 wale ke, ya kisi ke nahi?
  > card: 21 pencil 3 doston mein bati: 9, 6 aur 6. Kiske paas theek 1/3 hai: 9 wale ke, 6 wale ke, ya kisi ke nahi?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[7,3,3,3]}}

**child:** 9 wale ke  _(misconception)_

**Asha** [hint · beat s2:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s2:then:c4-maths-ch05-t01-m-unequal-parts (1 miss) · board up · ready 3644 ms · guard answerinq,uncorrected]: Abhi yeh sahi nahi hai. Socho, barabar baant mein har dost ko kitni milti. Phir dekho, kisi ke paas utni hai ya nahi. Ab phir se socho, jawab kya hoga?
  > card: 21 pencil 3 doston mein bati: 9, 6 aur 6. Kiske paas theek 1/3 hai: 9 wale ke, 6 wale ke, ya kisi ke nahi?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[9,6,6]}}

**child:** none  _(correct)_

**Asha** [repair · beat s2:check:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 1484 ms]: Sahi jawab, kyunki 21 ka 1/3 tab hota jab teeno ko 7 milti; yahan kisi ke paas 7 nahi, isliye kisi ke paas 1/3 nahi. Yeh hissa saaf hua?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[9,6,6],"equalTo":{"groups":3,"each":7}}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1009 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[9,6,6],"equalTo":{"groups":3,"each":7}}}

## Agent


