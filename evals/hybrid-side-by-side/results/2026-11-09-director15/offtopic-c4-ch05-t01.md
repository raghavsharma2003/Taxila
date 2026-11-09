# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj fractions ko cooking ke equal shares se dekhenge. Tumhe cooking mein kya banana pasand hai?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1890 ms]: Maa ne kitchen mein ek garam roti banayi, aur tum do bhai-behen ho. Roti ke 2 tukde honge. Aaj dekhenge ki dono ka hissa kab sach mein barabar hota hai.

**child:** hmm, achha  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 1863 ms]: Dekho, roti ke 2 barabar tukde hain, aur 1 tukda rangin hai. Yeh tukda roti ka aadha hai, yaani 1/2. Neeche wala 2 batata hai ki poori roti ke kitne barabar tukde bane. Upar wala 1 batata hai ki humne kitne tukde liye. Yahan tak theek hai?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2019 ms]: Virat ki baat hum is sawaal ke baad karenge. Is roti mein 1 tukda rangin hai aur 1 bina rang ka. Kya isliye rangin hissa 1/1 hai, haan ya nahi?
  > card: Is roti mein 1 tukda rangin hai aur 1 bina rang ka. Kya isliye rangin hissa 1/1 hai, haan ya nahi?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** No hai na  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 3220 ms]: Haan, sahi hai, kyunki roti ke 2 barabar tukde hain, toh rangin 1 tukda 1/2 hai, 1/1 nahi.
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2158 ms]: Achha. Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai? Cake A ke bhi 3 tukde hain, Cake B ke bhi 3 tukde. Par Cake A mein 1 bada, 2 chhote hain, toh uska tukda 1/3 nahi hai. Cake B mein sab barabar hain, isliye wahan har tukda 1/3 hai, yaani ek-tihaai. Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {"labels":"Cake A | Cake B"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Cake A"},{"parts":3,"title":"Cake B"}]}}

**child:** No hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2154 ms · guard mustsay]: Bilkul sahi, kyunki pizza ke teeno tukde barabar nahi hain, aur ek-tihaai 3 barabar tukdon mein se ek hota hai. Is circle ke 3 barabar hisse hain, aur 1 hissa rangin hai. Yeh rangin hissa ek-tihaai hai, yaani 1/3. Neeche ka 3 poore circle ke saare barabar hisse batata hai. Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > card: Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > screen: board fraction-parts@1 {"numbers":"1 3","labels":""} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2472 ms]: Phir se dekho: Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > card: Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > screen: board fraction-parts@1 {"numbers":"1 3","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** 2/1  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1182 ms · guard uncorrected]: 2/1 sahi nahi hai. Poori roti ke 4 barabar tukde neeche aate hain, aur khaya hua 1 rangin tukda upar. Bache hue tukde neeche kabhi nahi aate. Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, fraction mein batao.
  > card: Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, fraction mein batao.
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** 3/1  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 966 ms · guard uncorrected]: 3/1 nahi, yeh jawab theek nahi baitha. Neeche bar ke saare barabar tukde aate hain, yaani 4. Upar sirf khaye hue tukde gino. Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, fraction mein batao.
  > card: Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, fraction mein batao.
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":0,"whole":"bar"}}

**child:** three quarters  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 (1 miss) · board up · ready 866 ms]: Haan, sahi hai, kyunki bar ke 4 barabar tukde the aur unme se 3 khaye gaye, yaani 3/4. Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > card: Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > screen: board fraction-parts@1 {"numbers":"1 3","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":3,"whole":"bar"}}

**child:** two thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · board up · ready 1141 ms · guard mustsay,noconfirm]: Bilkul sahi, kyunki circle ke 3 barabar hisse hain aur ab unme se 2 rangin hain, yaani 2/3. Ab circle ke 4 barabar hisse hain. 1 hissa rangin hai, 3 bina rang ke. Rangin hissa ek-chauthaai hai, yaani 1/4. Neeche poore circle ke 4 hisse aate hain, bache hue 3 nahi. Yahan tak theek hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 4134 ms · guard praise,affirms]: Cricket ki baat hum is sawaal ke baad karenge. Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > card: Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2179 ms · guard mustsay]: Neeche hamesha poore ke saare hisse aate hain, yahan 4. Bache hue 3 hisse neeche nahi aate. Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > card: Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2590 ms · guard screenmismatch]: Dekho, yahi 1/4 ab patti par. Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > card: Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > screen: board fraction-parts@1 {"whole":"bar","parts":4,"shaded":1,"fraction":"1/4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** Yes  _(misconception)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 4189 ms · guard affirms,invented,uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka sahi jawab: nahi, kyunki pizza ke 4 barabar slice the aur 1 khaya gaya, toh 1/4 khaya; bache hue 3 neeche nahi aate. Ek lambi barfi ke 3 barabar tukde kiye. Usme se 2 tukde kha liye. Barfi ka kitna hissa khaya gaya? Diya hai: barfi ke 3 barabar tukde hain, aur unmein se 2 khaye gaye. Dhoondhna hai: barfi ka kitna hissa khaya, fraction mein. Ab agla kadam dekhte hain.
  > screen: board shade-grid@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2512 ms]: Virat ki baat hum is sawaal ke baad karenge. Pehla kadam dekho. Pehle neeche wala number likho: 3, kyunki neeche poori barfi ke saare barabar tukde aate hain. Yahan tak theek hai?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [reteach · beat s1:explain:e4 · board up · ready 2122 ms]: Theek hai, ab Hindi mein. Upar khaye hue tukde aate hain aur neeche saare tukde. Dono numbers ke beech ek rekha kheencho.
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2505 ms]: Ab doosra kadam. Ab upar wala number likho: 2, kyunki upar woh tukde aate hain jo khaye gaye. Chalo, aage dekhte hain.
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 3613 ms · guard ask]: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 2205 ms]: Haan, pehle tum try karo — Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 1744 ms]: Phir se dekho: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/1  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked (1 miss) · board up · ready 1871 ms · guard twoq]: 2/1 sahi nahi hai. Upar khaye hue tukde aate hain aur neeche saare tukde. Dono numbers ke beech ek rekha kheencho. Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/3  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 2911 ms]: Haan, sahi hai. Toh poora jawab: barfi ka 2/3 hissa khaya gaya, kyunki barfi ke 3 barabar tukde the aur 2 khaye gaye, bacha hua 1 tukda neeche nahi aata. Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > card: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > screen: board wholes@1 {"labels":"Laddoo"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar"}}

**child:** No  _(correct)_

**Asha** [probe · beat s1:check:c1 · board up · ready 1680 ms]: Bilkul sahi, kyunki laddoo ke 3 tukde barabar nahi hain, ek bada aur do chhote.
  > screen: board wholes@1 {"labels":"Laddoo"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 5078 ms · guard screen,ask,wrap]: Achha. Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > card: Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"bar"}}

**child:** 1/2  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 1246 ms]: 1/2 nahi, yeh jawab theek nahi baitha. Neeche poori chocolate ke saare barabar tukde likho. Upar sirf khaya hua tukda likho. Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > card: Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"bar"}}

**child:** 1/3 hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2850 ms]: Haan, bilkul theek, kyunki chocolate ke 3 barabar tukde the aur unme se 1 khaya gaya, yaani 1/3. Ek cake ke 4 tukde kiye: 1 bada aur 3 chhote. Zoya ne 1 chhota tukda liya. Kya yeh chhota tukda cake ka ek-chauthaai hai?
  > card: Ek cake ke 4 tukde kiye: 1 bada aur 3 chhote. Zoya ne 1 chhota tukda liya. Kya yeh chhota tukda cake ka ek-chauthaai hai?
  > screen: board wholes@1 {"labels":"Cake: | 1 bada, | 3 chhote","numbers":"1 3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"bar"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 5927 ms · guard leak,long,uncorrected]: Nahi, yeh jawab nahi hai. Tarbooz ka 1 bada tukda aur 2 chhote tukde barabar nahi hain, toh kisi tukde ka bhinn naam nahi. Kaagaz ki patti ke 5 barabar hisse hain, toh har hissa 1/5 hai. Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > card: Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > screen: board compare@1 {"labels":"Tarbooz | Kaagaz ki patti | 1 bada tukda","numbers":"1 5 2 1/5"} · ref {"template":"compare@1","params":{"left":{"title":"Tarbooz","items":["1 bada tukda","2 chhote tukde","barabar nahi"]},"right":{"title":"Kaagaz ki patti","items":["5 barabar hisse","har hissa 1/5"]}}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts (1 miss) · board up · ready 4774 ms · guard samecard,uncorrected]: Yeh jawab sahi nahi hai. Aadha tab hota hai jab roti ke 2 tukde bilkul barabar hon. Yahan ek tukda bada hai aur ek chhota. Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > card: Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > screen: board wholes@1 {"labels":"Roti"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}}

**child:** no  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 (1 miss) · board up · ready 5497 ms · guard leak,long]: Haan, sahi hai, kyunki roti ke dono tukde barabar nahi hain, aur aadha 2 barabar tukdon mein se ek hota hai. Ek cake ke 4 tukde kiye: 1 bada aur 3 chhote. Zoya ne 1 chhota tukda liya. Kya yeh chhota tukda cake ka ek-chauthaai hai?
  > card: Ek cake ke 4 tukde kiye: 1 bada aur 3 chhote. Zoya ne 1 chhota tukda liya. Kya yeh chhota tukda cake ka ek-chauthaai hai?
  > screen: board wholes@1 {"labels":"Cake: | 1 bada, | 3 chhote","numbers":"1 3"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** Yes  _(misconception)_

**Asha** [break · board up · ready 2129 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Tumhe cricket pasand hai—achha, cricket mein bhi barabar hisson ka dhyan rakhte hain. Nahi, kyunki cake ke 4 tukde barabar nahi hain. Ab batao: barabar tukde hon, tab ek chhota hissa kya hoga?
  > screen: board wholes@1 {"labels":"Cake: | 1 bada, | 3 chhote","numbers":"1 3"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake: 1 bada, 3 chhote"}]}}

**child:** No hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 3202 ms]: Bilkul sahi, kyunki cake ke 4 tukde barabar nahi hain, aur ek-chauthaai 4 barabar tukdon mein se 1 hota hai. Ab tak humne ek roti ke barabar hisse kiye. Ab bahut saare laddoo ke barabar samooh banakar hissa nikalenge. Niyam wahi hai: barabar hisse. Ab aage chalte hain.
  > screen: board compare@1 {"labels":"Ek roti | Bahut saare | laddoo | barabar"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"title":"Barabar"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 4016 ms · guard floor,wrap,nochoice,wrap]: Theek hai, Riya. Tum chun sakti ho: padhai jaari rakhein, chhota sa break lein, ya aaj ke liye rok dein?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

## Agent


