# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2006 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2292 ms]: Chalo, main batati hoon. Maa ki garam roti do bachche khaayenge, toh dono ke tukde barabar hone chahiye. Yeh roti 2 barabar tukdon mein kati hai. Fraction mein neeche wala number saare barabar tukde ginta hai, aur upar wala rangin tukde. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukde ke liye kaunsa fraction likhoge?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** ek bata do  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 1950 ms · guard noconfirm]: Haan, bilkul theek. Kul tukde 2, rangin 1: 1/2. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** nahi, tukde barabar nahi hain  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2034 ms · guard mustsay]: Sahi jawab, kyunki tukde barabar nahi, aur chhota tukda 1/3 se chhota hai. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** two thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2143 ms · guard mustsay,long]: Haan, sahi hai. Circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Is patti ka rangin tukda 1/8 hai: 8 saare tukde ginta hai, bache hue 7 nahi. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** 1/5  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1346 ms · guard uncorrected]: 1/5 sahi nahi hai. Ise alag tareeke se dekhte hain. Is chocolate ke 10 barabar tukde hain, aur rangin 3 khaye gaye. Neeche wala number saare 10 ginta hai; khaane se woh ginti nahi badalti. Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1935 ms]: Board ki chocolate ke jo tukde khaye gaye, unke liye Pinky ka 2/4 theek hai ya Golu ka 2/2?
  > card: Doosri chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kaun sahi hai, Pinky ya Golu?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** pinky sahi  _(correct)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 978 ms]: Haan, bilkul theek: chocolate ke kul 4 tukde the, 2 khaye gaye: 2/4; neeche saare 4 tukde aate hain, bache hue 2 nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > card: Doosri patti ke 6 barabar tukde hain. Raju ne 1 tukda liya, 5 bache. Raju kehta hai usne 1/5 liya, kyunki 5 bache. Raju ne asal mein kaunsa fraction liya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** one upon six  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2111 ms]: Sahi jawab. Raju ne 6 barabar tukdon wali patti se ek tukda liya, toh 1/6; bache hue 5 tukde naam nahi badalte. Aao, agla sawaal main aur tum saath mein karenge. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Is baar rangin tukde woh hain jo plate par bache. Plate par bache tukdon ke fraction mein neeche wala number kya hoga?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** sab tukde  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 1027 ms]: Haan, 5: barfi 5 barabar tukdon mein kati thi. Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > card: Tumhari baari: plate par bache tukde poori barfi ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":5,"shade":2,"labels":false,"hideResult":true}}

**child:** 2 by 5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 1814 ms · guard screen]: Haan, sahi hai. Toh poora jawab: bache hue tukde barfi ka 2/5 hain, kyunki 5 barabar tukdon mein se 2 bache; neeche wala number 5 hai, saare tukde, khaye hue 3 nahi. Ab agla sawaal tumhare liye. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2979 ms · guard long,twoq]: Dono chhote tukde jodo aur bade tukde se milao. Phir dekho, bada tukda poore laddoo ka kitna gherta hai. Laddoo ka bada tukda 1/2 hai ya 1/3?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 3034 ms · guard samecard,twoq]: Laddoo ab ek patti mein hai, teen tukdon mein: ek lamba aur do chhote, aur teeno milkar poora laddoo. Ab tum batao.
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Board par dekho: bada tukda laddoo ka 1/2 hai ya 1/3?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** 1/2 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 2924 ms · guard answerinq]: Haan, bilkul theek. Laddoo ke 3 tukdon mein bada tukda theek aadha hai, yaani 1/2; dono chhote milkar baaki aadha. Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"shade":1,"title":"Laddoo"},{"parts":2,"shade":1,"title":"1/2"}]}}

**child:** 13  _(incorrect)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 999 ms]: 13 sahi nahi hai. Board ki chocolate ka ek tukda haath se dhak do, woh khaya hua 1/12 hai; ab baaki tukde gino. 12 barabar tukdon wali chocolate ka 1/12 khaya gaya, toh kitne tukde bache?
  > card: Tumhari chocolate ke 12 barabar tukde hain. Tumne usmein se 1/12 kha liya. Ab kitne tukde bache?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 2005 ms]: Achha, ab Hindi mein kehti hoon. 12 tukdon wali chocolate ka 1/12 pet mein chala gaya. Plate par ab kitne tukde rahe?
  > card: 12 tukdon wali chocolate ka 1/12 pet mein chala gaya. Plate par ab kitne tukde rahe?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":0,"whole":"bar"}}

**child:** eleven  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 928 ms]: Sahi jawab, kyunki 1/12 matlab 12 barabar tukdon wali chocolate ka ek tukda khaya; 12 mein se 1 gaya, toh 11 bache. Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > card: Cake ke 4 tukde hue: ek bada aur teen ek jitne chhote. Ek chhota tukda cake ke 1/4 se kam hai, 1/4 ke barabar hai, ya 1/4 se zyada?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":12,"shade":1,"whole":"bar"}}

**child:** kam hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2151 ms · guard noconfirm]: Haan, sahi hai. Chaaron tukde milkar poora cake hain; teen chhote barabar hain aur bada unse bada, toh har chhota tukda 1/4 se kam. Ab ek cheez ki jagah bahut saari cheezein lenge, jaise laddoo, aam ya kanche, aur unka fraction nikalenge. Niyam wahi rahega: sab barabar. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"Cake"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3188 ms · guard mustsay,answerinq,twoq]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"Cake"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 2404 ms]: Achha, toh tumhe batting pasand hai! Ab seekhne par wapas aate hain. Do bachche yeh 12 laddoo barabar baantenge. Aadha matlab: dono ke paas ek jitne laddoo, aur ek bachche ke laddoo hi aadha. Dono ke laddoo jodkar dekho, toh saare 12 wapas mil jaate hain. 12 laddoo ka aadha kitne laddoo hai?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"shade":1,"title":"Cake"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 3248 ms · guard praise,affirms,answerinq]: Haan, pehle tum try karo.
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 2078 ms]: 12 laddoo ka aadha kitne laddoo hai?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 (1 miss) · board up · ready 1827 ms · guard answerinq,uncorrected]: 2 sahi nahi hai. Aadha matlab 12 laddoo ke do barabar group banana; jawab group ki ginti nahi, ek group ke laddoo hain. 12 laddoo ke aadhe mein kitne laddoo aate hain?
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 (2 miss) · board up · ready 1015 ms · guard uncorrected]: Nahi, 2 theek nahi. Board par laddoo teen qatar mein hain, har qatar mein 4. Har qatar ko beech se do-do mein baanto, aur ek taraf ke laddoo gino. Ab tumhara jawab sunti hoon.
  > card: 12 laddoo ka aadha kitne laddoo hai?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

**child:** 6 laddoo  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 · board up · ready 2746 ms · guard screen,mustsay,leak]: Haan, bilkul theek: 2 barabar group, har ek mein 6 laddoo. 24 aam 6 barabar group mein hain, har group mein 4: ek group 24 ka 1/6 hai. Chhote group jodkar bade barabar group bhi bante hain: teen-teen jodo, toh har bada group 24 ka 1/2 hai. 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** 4  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 (1 miss) · board up · ready 1743 ms · guard answerinq,uncorrected]: 4 se baat nahi bani. Ek group mein 4 aam hain, par yahan group ginne hain; 1/3 mein utne group aate hain jitne teen baar lene par poore 6 group ban jaayein. 24 ka 1/3 lene ke liye 6 group mein se kitne uthaoge?
  > card: 24 ka 1/3 lena hai. Board ke 6 group mein se kitne group uthaoge?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":6,"each":4}}

**child:** do  _(correct)_

**Asha** [repair · beat s2:explain:e2 · board up · ready 1274 ms]: Sahi jawab, kyunki 24 ke 3 barabar group mein 8-8 aam, jaise board par; 8 ke liye 4-4 wale 2 group lagte hain. Chalo, ab agle hisse par chalte hain.
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 · board up · ready 2688 ms · guard mustsay]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Yeh 20 kanche 10-10 ke 2 barabar group mein hain, toh 10 kanche 20 ka aadha hain, 1/2. Yahan neeche wala number 2 barabar group ginta hai. Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > card: Socho, yeh 20 kanche kuch bachchon mein barabar bate, aur har bachche ko 5 mile. 5 kanche saare 20 kanchon ka kaunsa fraction hain?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":8}}

**child:** ek-chauthaai  _(correct)_

**Asha** [repair · beat s2:explain:e3 · board up · ready 1165 ms]: Haan, sahi hai. 4 × 5 = 20: 4 bachchon mein se har ek ko 5 mile; yeh 1/4 hai, 5/20 bhi sahi. Cricket ki baari aa gayi: uske baare mein thoda aur batao na?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":5}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2233 ms · guard invented]: Arre, chauka! Achha hua tumne bataya. Chalo, ab ek sawaal hum dono saath mein karte hain. 15 pencil ka 1/3 nikaalna hai. 15 pencil ko 3 barabar group mein baantoge, ya 3-3 pencil ke group banaoge?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":5}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 3734 ms · guard quiz]: Dono tareeke socho: 3-3 ke group banane par kitne group bante hain, aur 1/3 ka neeche wala 3 kya ginta hai. 1/3 ke liye: 3 barabar group banaoge, ya 3-3 pencil ke group?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s2:worked:worked:step1 · board up · ready 3143 ms · guard flat]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumne pehli baar Virat ko kab dekha tha?
  > screen: board shade-grid@1 {} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1035 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


