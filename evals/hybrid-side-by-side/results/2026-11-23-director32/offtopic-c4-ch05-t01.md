# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2098 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 1754 ms · guard mustsay]: Chalo, main batati hoon. Kitchen mein Maa ne garam roti banayi, aur tum do bhai-behen ho: dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai, aur ek tukde mein rang hai. Fraction mein neeche wala number roti ke kul barabar tukde ginta hai, upar wala number, jitne tukde humne liye. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 1482 ms · guard noconfirm]: Haan, bilkul theek. Dekho, roti ke 2 barabar tukdon mein se 1, yaani 1/2. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** nahi, tukde barabar nahi hain  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1854 ms · guard mustsay]: Sahi jawab, kyunki tukde barabar nahi, aur chhota tukda 1/3 se chhota hai. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** two thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2115 ms · guard mustsay,long]: Haan, sahi hai: circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** 1/5  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1734 ms · guard long,uncorrected]: 1/5 sahi nahi hai. Ise alag tareeke se dekhte hain. Is chocolate ke 10 barabar tukde hain, aur rangin 3 khaye gaye. Neeche wala number saare 10 ginta hai; khaane se woh ginti nahi badalti. Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1441 ms]: Board ki chocolate ke jo tukde khaye gaye, unke liye Pinky ka 2/4 theek hai ya Golu ka 2/2?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** pinky ka sahi hai  _(correct)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 1692 ms]: Haan, bilkul theek. Dekho, 4 barabar tukdon mein se 2 khaye, toh 2/4; neeche wala number saare 4 tukde ginta hai, bache hue 2 nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** 1/6 hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 957 ms]: Sahi jawab, kyunki Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte. Aao, agla sawaal main aur tum saath mein karenge. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Is baar rangin tukde woh hain jo plate par bache. Plate par bache tukdon ke fraction mein neeche wala number kya hoga?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** sab tukde  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 888 ms]: Haan, 5: barfi 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 2 by 5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2983 ms · guard screen]: Haan, sahi hai. Dekho, 5 barabar tukdon mein se 2 bache; neeche wala number 5 hai, saare tukde, khaye hue 3 nahi. Toh poora jawab: bache hue tukde barfi ka 2/5 hain. Ab agla sawaal tumhare liye. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2813 ms · guard long]: Dono chhote tukde jodo aur bade tukde se milao. Phir dekho, bada tukda poore laddoo ka kitna gherta hai. Ab phir se socho, jawab kya hoga?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 1601 ms]: Laddoo ab ek patti mein hai, teen tukdon mein: ek lamba aur do chhote, aur teeno milkar poora laddoo. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** 1/2 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 2872 ms · guard answerinq]: Haan, bilkul theek: laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Bada tukda 1/2"}]}}

**child:** 12  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 922 ms · guard uncorrected]: 12 sahi nahi hai. Socho, 1/12 ka neeche wala number kya ginta hai, aur upar wala kya ginta hai. 12 barabar tukdon wali chocolate ka 1/12 khaya gaya, toh kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 2499 ms · guard answerinq]: Achha, ab Hindi mein kehti hoon. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** 12  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 951 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 11 hai, kyunki 1/12 ka matlab chocolate ke 12 barabar tukdon mein se 1 khaya; 12 mein se 1 gaya, toh 11 bache. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2014 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2719 ms · guard leak,twoq]: Haan, pehle tum try karo.
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 1683 ms]: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** kam hai na  _(correct)_

**Asha** [repair · beat s1:check:c3 · board up · ready 2005 ms]: Haan, bilkul theek, kyunki chaaron tukde milkar poora cake hain; teen chhote barabar hain aur bada unse bada, toh har chhota tukda 1/4 se kam. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1825 ms · guard mustsay]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 1625 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab seekhne par wapas aate hain. Do bachche yeh 12 laddoo barabar baantenge. Aadha matlab: dono ke paas ek jitne laddoo, aur ek bachche ke laddoo hi aadha. Dono ke laddoo jodkar dekho, toh saare 12 wapas mil jaate hain. 12 laddoo ka aadha kitne laddoo hai?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"1/4"}]}}

**child:** chhe  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 · board up · ready 2055 ms · guard screen,mustsay]: Sahi jawab. Dekho, 2 barabar group, har ek mein 6 laddoo. 24 aam 6 barabar group mein hain, har group mein 4: ek group 24 ka 1/6 hai. Chhote group jodkar bade barabar group bhi bante hain: teen-teen jodo, toh har bada group 24 ka 1/2 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (1 miss) · board up · ready 1903 ms · guard samecard,uncorrected]: 4 sahi nahi hai. 6 group ko 3 bachchon mein ek-ek karke baanto. Ek bachche ke paas kitne group aaye, woh gino. 24 aam ke 6 barabar group mein se, 24 ka 1/3 lene ke liye kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** 0  _(incorrect)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (2 miss) · board up · ready 2371 ms · guard screen,answerinq,uncorrected]: Nahi, 0 theek nahi. Socho, 6 bachche yeh 24 aam barabar baantein: har bachche ko ek group milta hai, 4 aam. Yahi 24 ka 1/6 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** 2 hai na  _(correct)_

**Asha** [repair · beat s2:explain:e2 · board up · ready 2787 ms · guard answerinq]: Haan, bilkul theek: 6 group ko jod kar 3 barabar bade group banao: har bade group mein 2 group, yaani 8 aam. Yeh hissa saaf hua?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 · board up · ready 2403 ms · guard mustsay]: Haan, sixer maara, yeh tumne bataya tha. Toh ab wahin se shuru karte hain jahan ruke the. Yeh 20 kanche 10-10 ke 2 barabar group mein hain, toh 10 kanche 20 ka aadha hain, 1/2. Jitne barabar group bante hain, wahi neeche wala number hai. Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > card: Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** ek-chauthaai  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1328 ms]: Sahi jawab, kyunki 4 × 5 = 20, toh 20 kanche 4 bachchon mein barabar batte hain; har bachche ke 5 kanche 1/4 hain. Chalo, ab ek sawaal hum dono saath mein karte hain. 15 pencil ka 1/3 nikaalna hai. 15 pencil ko 3 barabar group mein baantoge, ya 3-3 pencil ke group banaoge?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":5}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 3948 ms · guard answerinq,quiz]: Dono tareeke socho: 3-3 ke group banane par kitne group bante hain, aur 1/3 ka neeche wala 3 kya ginta hai. 15 pencil ka 1/3 nikaalne ke liye kaunsa theek hai: 15 pencil ke 3 barabar group banana, ya 3-3 pencil ke group banana?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 3258 ms · guard quiz]: 15 pencil ko 3 barabar group mein baantoge, ya 3-3 pencil ke group banaoge?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** 3 barabar group  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch05-t01-s2:ask:worked · board up · ready 1858 ms · guard affirms,answerinq]: Haan, 3 barabar group, aur unmein se ek group lena hai. Tumhari baari: ek group mein kitni pencil aayengi?
  > card: Tumhari baari: ek group mein kitni pencil aayengi?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** 7  _(incorrect)_

**Asha** [hint · beat s2:worked:worked · check script:c4-maths-ch05-t01-s2:ask:worked (1 miss) · board up · ready 1667 ms · guard uncorrected]: 7 sahi nahi hai. Pencil ek-ek karke 3 group mein rakho, baari-baari. Saari khatam, toh ek group gin lo. 15 pencil 3 barabar group mein baanto, toh ek group mein kitni pencil aayengi?
  > card: Tumhari baari: ek group mein kitni pencil aayengi?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** paanch pencil  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch05-t01-s2:c1 · board up · ready 943 ms]: Haan, bilkul theek. Dekho, 3 group mein 5-5 pencil rakho toh poori 15 ho jaati hain, 3 × 5 = 15. Toh poora jawab: 15 pencil ka 1/3 = 5 pencil. Ab ek sawaal tum akele karo. 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Ravi ke paas saare laddoo ka kaunsa fraction gaya?
  > card: 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Ravi ke paas saare laddoo ka kaunsa fraction gaya?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":5}}

**child:** 1/3 hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch05-t01-s2:c2 · board up · ready 1704 ms]: Sahi jawab, kyunki 18 laddoo 3 barabar plate mein the, har plate mein 6; Ravi ne 1 plate li, yaani 1/3. 16 kanche 4 group mein bate: 7, 3, 3 aur 3. 7 wala group saare kanchon ke 1/4 se kam hai, 1/4 ke barabar, ya 1/4 se zyada?
  > card: 16 kanche 4 group mein bate: 7, 3, 3 aur 3. 7 wala group saare kanchon ke 1/4 se kam hai, 1/4 ke barabar, ya 1/4 se zyada?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":6}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s2:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 2935 ms · guard long,uncorrected]: Yeh jawab sahi nahi hai. Ise doosri tarah samajhte hain. Board par 12 toffee baari-baari 3 group mein daali, toh har group mein 4 aayi: 12 ka 1/3 yahi 4 hai. 21 pencil 3 doston mein bati: 9, 6 aur 6. Kiske paas theek 1/3 hai: 9 wale ke, 6 wale ke, ya kisi ke nahi?
  > card: 21 pencil 3 doston mein bati: 9, 6 aur 6. Kiske paas theek 1/3 hai: 9 wale ke, 6 wale ke, ya kisi ke nahi?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[7,3,3,3]}}

**child:** nobody  _(correct)_

**Asha** [repair · beat s2:check:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 902 ms · guard noconfirm]: Haan, sahi hai: 21 ka 1/3 tab hota jab teeno ko 7 milti; yahan kisi ke paas 7 nahi, isliye kisi ke paas 1/3 nahi. Ab tak samajh aaya?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"sizes":[9,6,6],"equalTo":{"groups":3,"each":7}}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 894 ms]: Aaj ke liye itna hi, phir milte hain!

## Agent


