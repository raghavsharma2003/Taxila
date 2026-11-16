# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions mein cheezon ko equal shares baantenge. Tumhe cooking pasand hai?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 3113 ms]: Socho, Maa ne kitchen mein ek garam roti banayi, aur tum do bhai-behen ho. Roti ke 2 tukde honge. Dono ka hissa sach mein barabar kab hota hai, aaj wahi pakadna hai.

**child:** hmm, achha  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2352 ms]: Yeh roti dekho. 2 barabar tukde, aur ek tukde mein rang hai. Woh tukda roti ka aadha hai, likhte hain 1/2. Neeche ka 2, roti ke kul barabar tukde. Upar ka 1, jitne tukde humne liye. Kuch poochna hai ab tak?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e1 · board up · ready 1621 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** No hai na  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 3656 ms · guard leak]: Ek tukda rangin hai, ek bina rang ka. Toh kya rangin hissa 1/1 hua, haan ya nahi?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh kya rangin hissa 1/1 hua, haan ya nahi?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 gave · board up · ready 3002 ms]: Is sawaal ka sahi jawab: nahi, kyunki rangin tukda roti ke 2 barabar tukdon mein se 1 hai, toh woh 1/2 hai, 1/1 nahi. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** No hai na  _(correct)_

**Asha** [probe · beat s1:explain:e2 · board up · ready 2406 ms · guard noconfirm]: Haan, sahi hai. Dekho, pizza ke tukde chhote-bade hain, aur ek-tihaai tabhi banta hai jab 3 tukde barabar hon.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2986 ms · guard mustsay]: Theek hai. Is circle ke 3 barabar hisse hain, ek mein rang. Yeh rangin hissa ek-tihaai hai, 1/3. Neeche 3 isliye, kyunki poore circle ke 3 barabar hisse hain. Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > card: Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2442 ms]: Phir se dekho: Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > card: Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** 2/1  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · board up · ready 1908 ms · guard flat,uncorrected]: 2/1 sahi nahi hai. Is chocolate bar ko dekho, 4 barabar tukde. Har tukde ka naam hai ek-chauthaai, 1/4, kyunki poori bar aise 4 tukdon se bani hai. Khaya ho ya bacha, naam wahi. Neeche ka 4 tukde ka naam hai; upar bas ginti, aise kitne tukde liye. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 2464 ms]: Cricket ki baat hum is sawaal ke baad karenge. Chocolate bar ke 4 barabar tukde the, aur 3 kha liye. Bar ka kitna hissa khaya, fraction mein?
  > card: Chocolate bar ke 4 barabar tukde the, aur 3 kha liye. Bar ka kitna hissa khaya, fraction mein?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":0,"whole":"bar"}}

**child:** 3/1  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 1162 ms · guard uncorrected]: 3/1 nahi, yeh jawab theek nahi baitha. Bar kaatne par 4 tukde bane, woh neeche. Upar ke liye sirf khaye hue tukde gino. Chocolate bar ke 4 barabar tukde the, aur 3 kha liye. Bar ka kitna hissa khaya, fraction mein?
  > card: Chocolate bar ke 4 barabar tukde the, aur 3 kha liye. Bar ka kitna hissa khaya, fraction mein?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":0,"whole":"bar"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · board up · ready 2371 ms]: Is sawaal ka jawab 3/4 tha, kyunki bar ke 4 barabar tukdon mein se 3 khaye gaye, yaani 3/4. Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":3,"whole":"bar"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 (1 miss) · board up · ready 1740 ms]: Wahi poora ab patti: 3 barabar hisse, 1 rangin, yaani ek-tihaai. Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > card: Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** two-thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · board up · ready 1465 ms · guard mustsay]: Haan, sahi hai. Dekho, circle ke 3 barabar hisse hain aur ab 2 mein rang hai, yaani 2/3. Is baar circle ke 4 barabar hisse hain. Ek mein rang, teen khaali. Rangin hissa ek-chauthaai hai, 1/4. Dhyaan do, neeche 4 aata hai, saare hisse. Bache hue 3 nahi. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e4 · board up · ready 4088 ms · guard praise,affirms]: Cricket ke baare mein batao: tumhe usmein sabse mazedaar kya lagta hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2919 ms · guard affirms]: Theek hai, ab Hindi mein. Pehle poora pizza socho, khaane se pehle. Tab jitne tukde the, yahan 4, wahi neeche jaate hain. Ek pizza ke 4 barabar tukde the. 1 tukda kha liya, 3 bache. Zoya ka kehna hai ki 1/3 khaya gaya, kyunki 3 bache. Kya yeh sahi hai?
  > card: Ek pizza ke 4 barabar tukde the. 1 tukda kha liya, 3 bache. Zoya ka kehna hai ki 1/3 khaya gaya, kyunki 3 bache. Kya yeh sahi hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** Yes  _(misconception)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 3988 ms · guard long]: Nahi, yeh jawab nahi hai. Is sawaal ka sahi jawab: nahi, kyunki pizza ke 4 barabar tukde the aur 1 khaya, toh 1/4 khaya; bache hue 3 neeche nahi jaate. Ek lambi barfi ke 3 barabar tukde kiye, aur 2 tukde kha liye. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2469 ms]: Pehle neeche ka number: 3, kyunki woh poori barfi ke saare barabar tukde ginta hai. Yahan tak theek hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3049 ms · guard praise,quiz]: Pehle yeh hissa. Ab upar ka number: 2, kyunki woh sirf khaye hue tukde ginta hai.
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 4115 ms · guard ask]: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > card: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 2258 ms]: Theek hai, pehle tum khud likho.
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 4172 ms · guard ask]: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > card: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** do-tihaai  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1513 ms]: Haan, sahi hai, kyunki 3 barabar tukdon mein se 2 khaye gaye; bacha hua 1 tukda neeche nahi jaata.
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar"}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2196 ms]: Achha. Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** nahi, tukde barabar nahi hain  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 3083 ms · guard ask]: Bilkul sahi. Dekho, laddoo ke 3 tukde ek size ke nahi, ek bada hai aur do chhote. Tumhari chocolate ke 3 barabar tukde hue, aur tumne 1 kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > card: Tumhari chocolate ke 3 barabar tukde hue, aur tumne 1 kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** 1/3 hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2379 ms]: Haan, bilkul theek, kyunki chocolate ke 3 barabar tukdon mein se 1 khaya, yaani 1/3. Cake ke 4 tukde hue, 1 bada aur 3 chhote. Zoya ne ek chhota tukda liya. Kya woh cake ka ek-chauthaai hai?
  > card: Cake ke 4 tukde hue, 1 bada aur 3 chhote. Zoya ne ek chhota tukda liya. Kya woh cake ka ek-chauthaai hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"bar"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · board up · ready 3166 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Ek tarbooz socho: 1 bada tukda, 2 chhote tukde. Yeh baant barabar nahi, isliye kisi tukde ka bhinn naam nahi banta. Ab socho, ek kaagaz ko mod kar 8 barabar hisse banaye: har hissa 1/8 hai. Kuch poochna hai ab tak?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 4749 ms · guard leak]: Tukde ek size ke hon, tabhi naam milta hai, jaise kaagaz ka 1/8. Chhote-bade tukdon ka koi naam nahi. Roti tootkar 2 tukde ho gayi, ek bada, ek chhota. Kya chhota tukda roti ka aadha hai?
  > card: Roti tootkar 2 tukde ho gayi, ek bada, ek chhota. Kya chhota tukda roti ka aadha hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts (1 miss) · board up · ready 2878 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Dono tukde ek doosre ke upar rakho. Agar ek bahar nikle, toh woh aadhe nahi hain. Roti tootkar 2 tukde ho gayi, ek bada, ek chhota. Kya chhota tukda roti ka aadha hai?
  > card: Roti tootkar 2 tukde ho gayi, ek bada, ek chhota. Kya chhota tukda roti ka aadha hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}}

**child:** Yes  _(misconception)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 (1 miss) gave · board up · ready 4181 ms · guard long,uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka sahi jawab: nahi, kyunki aadhe ke liye dono tukde barabar chahiye, aur yahan ek bada hai, ek chhota. Cake ke 4 tukde hue, 1 bada aur 3 chhote. Zoya ne ek chhota tukda liya. Kya woh cake ka ek-chauthaai hai?
  > card: Cake ke 4 tukde hue, 1 bada aur 3 chhote. Zoya ne ek chhota tukda liya. Kya woh cake ka ek-chauthaai hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** No hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 3402 ms · guard answerinq]: Haan, sahi hai. Dekho, ek-chauthaai ke liye 4 barabar tukde chahiye, aur yahan ek tukda baaki sab se bada hai. Ab tak ek roti ke barabar hisse kiye. Ab bahut saare laddoo lenge, aur unke barabar samooh banayenge. Niyam wahi hai, sab barabar. Ab aage chalte hain.
  > screen: board equal-groups@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"title":"Barabar"}]}}

**child:** achha  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2627 ms]: Yeh dibbe ke 12 laddoo hain. Board par inke 4 barabar group bane, har group mein 3. Aadha matlab dono ko ek jitna. Toh tum dono ko 2-2 group milenge. Jaanch bhi aasaan hai: dono ke hisse jodo, toh 12 laddoo wapas. Yahan tak theek hai?
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":3}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3559 ms · guard wrap,wrap]: Theek hai Riya, ab teen vikalp hain: aage badhein, thodi der rukein, ya aaj ke liye rok dein.
  > screen: board equal-groups@1 {} · ref {"template":"equal-groups@1","params":{"groups":4,"each":3}}

## Agent


