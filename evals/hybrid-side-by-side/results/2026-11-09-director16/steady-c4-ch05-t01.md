# steady-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions mein equal shares dekhenge—cooking mein cake baantne jaisa. Tumhe cooking mein kya banana pasand hai?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 4041 ms]: Socho, Maa ne kitchen mein ek garam roti banayi, aur tum do bhai-behen ho. Roti ke 2 tukde honge. Par dono ka hissa sach mein barabar kab hota hai? Aaj wahi pakadna hai.

**child:** haan  _(no_evidence)_

**Asha** [reteach · beat s1:explain:e1 · board up · ready 2685 ms]: Neeche wala number saare tukde ginta hai, rangin bhi aur saade bhi, yahan kul 2. Upar sirf rangin wale.
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2992 ms]: Yeh roti dekho. 2 barabar tukde, aur ek tukde mein rang hai. Woh tukda roti ka aadha hai, likhte hain 1/2. Neeche ka 2, roti ke kul barabar tukde. Upar ka 1, jitne tukde humne liye. Yahan tak theek hai?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2816 ms]: Ek tukda rangin hai, ek bina rang ka. Toh kya rangin hissa 1/1 hua, haan ya nahi?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh kya rangin hissa 1/1 hua, haan ya nahi?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2383 ms · guard mustsay]: Neeche wala number saare tukde ginta hai, rangin bhi aur saade bhi, yahan kul 2. Upar sirf rangin wale. Ek tukda rangin hai, ek bina rang ka. Toh kya rangin hissa 1/1 hua, haan ya nahi?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh kya rangin hissa 1/1 hua, haan ya nahi?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** no, it is half  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 2908 ms]: Haan, sahi hai, kyunki rangin tukda roti ke 2 barabar tukdon mein se 1 hai, toh woh 1/2 hai, 1/1 nahi.
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2925 ms]: Achha. Do cake hain, dono ke 3-3 tukde. Cake A mein ek tukda bada hai aur do chhote, toh uska koi tukda 1/3 nahi. Cake B ke teeno tukde barabar hain. Wahan har tukda ek-tihaai hai, 1/3. Pizza ki baat karein. Uske 3 tukde hue, ek bada aur do chhote. Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ki baat karein. Uske 3 tukde hue, ek bada aur do chhote. Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {"labels":"Cake A | Cake B"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Cake A"},{"parts":3,"title":"Cake B"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2724 ms]: Phir se dekho: Pizza ki baat karein. Uske 3 tukde hue, ek bada aur do chhote. Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ki baat karein. Uske 3 tukde hue, ek bada aur do chhote. Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {"labels":"Pizza"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 4492 ms · guard leak,samecard]: Dekho, yahi numbers ab patti par. Pizza ki baat karein. Uske 3 tukde hue, ek bada aur do chhote. Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ki baat karein. Uske 3 tukde hue, ek bada aur do chhote. Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {"whole1":"Pizza: 3 unequal parts","view":"strips","labels":"Pizza"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"}]}}

**child:** No hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2643 ms · guard mustsay]: Bilkul sahi, kyunki pizza ke tukde chhote-bade hain, aur ek-tihaai tabhi banta hai jab 3 tukde barabar hon. Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > card: Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > screen: board fraction-parts@1 {"numbers":"1 3","labels":""} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"}]}}

**child:** 2/1  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 1825 ms · guard uncorrected]: 2/1 sahi nahi hai. Chalo, ek gol roti lete hain, 4 barabar tukde. Poori roti ke 4 tukde neeche jaate hain. Khaya hua 1 rangin tukda upar. Bache hue tukdon ka neeche koi kaam nahi. Chocolate bar ke 4 barabar tukde the, aur 3 kha liye. Bar ka kitna hissa khaya, fraction mein?
  > card: Chocolate bar ke 4 barabar tukde the, aur 3 kha liye. Bar ka kitna hissa khaya, fraction mein?
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** teen-chauthaai  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 (1 miss) · board up · ready 2027 ms]: Haan, sahi hai. Dekho, bar ke 4 barabar tukdon mein se 3 khaye gaye, yaani 3/4. Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > card: Ek aur hissa rang do. Ab circle ka kitna hissa rangin hai, fraction mein batao.
  > screen: board fraction-parts@1 {"numbers":"1 3"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":3,"whole":"bar"}}

**child:** 2/1  _(misconception)_

**Asha** [explain · beat s1:explain:e4 · board up · ready 4023 ms · guard mustsay,leak,uncorrected]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 2/3 hai, kyunki circle ke 3 barabar hisse hain aur ab 2 mein rang hai, yaani 2/3. Is baar circle ke 4 barabar hisse hain. Ek mein rang, teen khaali. Rangin hissa ek-chauthaai hai, 1/4. Dhyaan do, neeche 4 aata hai, saare hisse. Bache hue 3 nahi. Yahan tak theek hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 4567 ms · guard affirms]: Ek pizza ke 4 barabar slice the. 1 slice kha liya, 3 bache. Zoya ka kehna hai ki 1/3 khaya gaya, kyunki 3 bache. Kya yeh sahi hai?
  > card: Ek pizza ke 4 barabar slice the. 1 slice kha liya, 3 bache. Zoya ka kehna hai ki 1/3 khaya gaya, kyunki 3 bache. Kya yeh sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 3223 ms]: Theek hai, khud karke batao.
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** No  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1784 ms · guard invented,noconfirm]: Bilkul sahi. Dekho, pizza ke 4 barabar slice the aur 1 khaya, toh 1/4 khaya; bache hue 3 neeche nahi jaate. Ek lambi barfi ke 3 barabar tukde kiye, aur 2 tukde kha liye. Barfi ka kitna hissa khaya gaya?
  > screen: board shade-grid@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3798 ms]: Cricket ki baat hum is sawaal ke baad karenge. Pehla kadam dekho. Pehle neeche ka number: 3, kyunki woh poori barfi ke saare barabar tukde ginta hai. Ab tak samajh aaya?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [reteach · beat s1:explain:e4 · board up · ready 2551 ms]: Theek hai, ab Hindi mein. Upar ka number tumne abhi nikala, 2. Neeche ka bhi, 3. Bas dono ko ek bhinn mein likh do.
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 4319 ms · guard leak]: Ab doosra kadam. Ab upar ka number: 2, kyunki woh sirf khaye hue tukde ginta hai. Ab agla kadam dekhte hain.
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 5231 ms · guard ask]: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > card: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 3627 ms · guard ask]: Phir se dekho: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > card: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** 2/1  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked (1 miss) · board up · ready 1100 ms · guard uncorrected]: 2/1 sahi nahi hai. Upar ka number tumne abhi nikala, 2. Neeche ka bhi, 3. Bas dono ko ek bhinn mein likh do. Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > card: Dono numbers ko ek saath likho, beech mein rekha. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar","hideResult":true}}

**child:** do tihaai  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 3737 ms]: Haan, sahi hai. Toh poora jawab: barfi ka 2/3 hissa khaya gaya, kyunki 3 barabar tukdon mein se 2 khaye gaye; bacha hua 1 tukda neeche nahi jaata. Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?
  > card: Laddoo toota aur 3 tukde ho gaye, ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > screen: board wholes@1 {"labels":"Laddoo"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar"}}

**child:** No hai na  _(correct)_

**Asha** [probe · beat s1:check:c1 · board up · ready 2333 ms]: Bilkul sahi. Dekho, laddoo ke 3 tukde ek size ke nahi, ek bada hai aur do chhote.
  > screen: board wholes@1 {"labels":"Laddoo"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 3852 ms · guard ask]: Theek hai. Tumhari chocolate ke 3 barabar tukde hue, aur tumne 1 kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > card: Tumhari chocolate ke 3 barabar tukde hue, aur tumne 1 kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"bar"}}

**child:** 1/2  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 (1 miss) · board up · ready 2256 ms · guard uncorrected]: 1/2 nahi, yeh jawab theek nahi baitha. Poori chocolate ke tukde neeche, jo khaya woh upar. Bas itna gino. Tumhari chocolate ke 3 barabar tukde hue, aur tumne 1 kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > card: Tumhari chocolate ke 3 barabar tukde hue, aur tumne 1 kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"bar"}}

**child:** one-third  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 1432 ms]: Haan, bilkul theek, kyunki chocolate ke 3 barabar tukdon mein se 1 khaya, yaani 1/3. Cake ke 4 tukde hue, 1 bada aur 3 chhote. Zoya ne ek chhota tukda liya. Kya woh cake ka ek-chauthaai hai?
  > card: Cake ke 4 tukde hue, 1 bada aur 3 chhote. Zoya ne ek chhota tukda liya. Kya woh cake ka ek-chauthaai hai?
  > screen: board wholes@1 {"labels":"Cake: | 1 bada, | 3 chhote","numbers":"1 3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"bar"}}

**child:** no  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1148 ms]: Haan, sahi hai. Dekho, ek-chauthaai ke liye 4 barabar tukde chahiye, aur yahan ek tukda baaki sab se bada hai. Ab tak ek roti ke barabar hisse kiye. Ab bahut saare laddoo lenge, aur unke barabar samooh banayenge. Niyam wahi hai, sab barabar. Ab aage chalte hain.
  > screen: board compare@1 {"labels":"Ek roti | Bahut saare | laddoo | barabar"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"title":"Barabar"}]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 2334 ms]: Yeh 8 laddoo dekho, 2 barabar group mein. Har group mein 4. Ek group hi 8 ka aadha hai, toh 8 ka 1/2 = 4. Jaanch lo: 2 × 4 = 8. Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hoga?
  > card: Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hoga?
  > screen: board equal-groups@1 {"labels":"8 ka | 1/2 = | 4","numbers":"8 1/2 4 2"} · ref {"template":"equal-groups@1","params":{"groups":2,"each":4,"title":"8 ka 1/2 = 4"}}

**child:** 8  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 (1 miss) · board up · ready 1383 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. 12 laddoo do plate mein ek-ek karke rakho, ek idhar, ek udhar. Khatam hone par ek plate gin lo. Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hoga?
  > card: Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hoga?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"equal-groups@1","params":{"groups":2,"each":4,"title":"8 ka 1/2 = 4"}}

**child:** 5  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch05-t01-s2:ask:e2 gave · board up · ready 1324 ms · guard mustsay,uncorrected]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 6 tha, kyunki 12 laddoo 2 barabar group mein jaayein toh har group mein 6, aur 2 × 6 = 12. Yahan 6 kele hain, 3 barabar group mein, har group mein 2. 1/3 ka neeche wala 3 kehta hai: 3 group banao. Upar ka 1: unme se ek lo. Toh 6 ka 1/3 = 2 kele. 21 kele 3 bachchon mein barabar baantne hain. 21 ka 1/3 kitna hua?
  > card: 21 kele 3 bachchon mein barabar baantne hain. 21 ka 1/3 kitna hua?
  > screen: board equal-groups@1 {"labels":"6 ka 1/3 = 2","numbers":"6 1/3 2 3"} · ref {"template":"equal-groups@1","params":{"groups":2,"each":6}}

**child:** saat  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 3111 ms · guard nowhy]: Bilkul sahi. Dekho, 21 kele 3 barabar samooh mein baanto toh har samooh mein 7 aate hain; 3 × 7 = 21.
  > screen: board equal-groups@1 {"numbers":"3 7 21","labels":""} · ref {"template":"equal-groups@1","params":{"groups":3,"each":7}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch05-t01-s2:ask:e3 · board up · ready 3589 ms]: Achha. 12 kanche, 4 barabar group, har group mein 3. Tarika seedha hai: neeche ka number dekho, utne barabar group banao, aur ek group gin lo. Toh 12 ka 1/4 = 3. Kanche badh kar 32 ho gaye. 32 ka 1/4 kitna?
  > card: Kanche badh kar 32 ho gaye. 32 ka 1/4 kitna?
  > screen: board equal-groups@1 {"labels":"12 ka | 1/4 = | 3","numbers":"12 1/4 3 4"} · ref {"template":"equal-groups@1","params":{"groups":4,"each":3,"title":"12 ka 1/4 = 3"}}

**child:** 8  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 1261 ms · guard invented]: Haan, sahi hai, kyunki 4 barabar samooh banao toh har samooh mein 8 kanche, aur 4 × 8 = 32. 15 pencil ka 1/3 kitni pencil hoti hain?
  > screen: board compare@1 {"labels":"15 pencil | 15 ka | 1/3 | 3 barabar group","numbers":"15 1/3 3 1"} · ref {"template":"equal-groups@1","params":{"groups":4,"each":8}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 3402 ms]: Pehla kadam dekho. Pehle socho 1/3 kya kehta hai: 3 barabar samooh, unme se 1 samooh lena, kyunki neeche ka 3 samooh ki ginti hai, aur upar ka 1 batata hai kitne samooh lene hain. Yahan tak theek hai?
  > screen: board compare@1 {"labels":"15 pencil | 15 ka | 1/3 | 3 barabar group","numbers":"15 1/3 3 1"} · ref {"template":"compare@1","params":{"left":{"title":"15 pencil","items":["3 barabar group","1 group lena"]},"right":{"title":"15 ka 1/3","items":["1 group"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2740 ms]: Socho 3 dost hain aur pencil sabko barabar milni hain. Ek dost ka hissa hi 1/3 hai. Ab agla kadam dekhte hain.
  > screen: board compare@1 {"labels":"15 pencil | 15 ka | 1/3 | 3 barabar group","numbers":"15 1/3 3 1"} · ref {"template":"compare@1","params":{"left":{"title":"15 pencil","items":["3 barabar group","1 group lena"]},"right":{"title":"15 ka 1/3","items":["1 group"]}}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch05-t01-s2:ask:worked · board up · ready 4565 ms · guard answerinq,ask,twoq]: Chalo, 15 pencil ko 3 barabar samooh mein baanto. 3 ka pahada kaam aayega. Ek samooh mein kitni pencil?
  > card: Chalo, 15 pencil ko 3 barabar samooh mein baanto. 3 ka pahada kaam aayega. Ek samooh mein kitni pencil?
  > screen: board compare@1 {"labels":"15 pencil | 15 ka | 1/3 | 3 barabar group","numbers":"15 1/3 3 1"} · ref {"template":"shade-grid@1","params":{"rows":5,"cols":3,"shade":0,"labels":false,"hideResult":true}}

**child:** five  _(correct)_

**Asha** [probe · beat s2:worked:worked · board up · ready 1492 ms]: Bilkul sahi, kyunki 3 samooh mein 5-5 pencil rakho toh poori 15 ho jaati hain, 3 × 5 = 15.
  > screen: board equal-groups@1 {"numbers":"3 5 15","labels":""} · ref {"template":"equal-groups@1","params":{"groups":3,"each":5}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch05-t01-s2:c1 · board up · ready 7362 ms · guard ask]: Achha. 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Saare laddoo ka kitna hissa Ravi ke paas gaya, bhinn mein?
  > card: 18 laddoo 3 plate mein barabar rakhe gaye. Ravi ne 1 plate utha li. Saare laddoo ka kitna hissa Ravi ke paas gaya, bhinn mein?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":6,"shade":0,"labels":false,"hideResult":true}}

**child:** 1/3 hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch05-t01-s2:c2 · board up · ready 3912 ms]: Haan, sahi hai. Dekho, 18 laddoo 3 barabar plate mein the, har plate mein 6; Ravi ne 1 plate li, yaani 1/3. 16 kanche 4 group mein bate: 7, 3, 3 aur 3. Kya 7 wala group saare kanchon ka ek-chauthaai hai?
  > card: 16 kanche 4 group mein bate: 7, 3, 3 aur 3. Kya 7 wala group saare kanchon ka ek-chauthaai hai?
  > screen: board shade-grid@1 {} · ref {"template":"equal-groups@1","params":{"groups":3,"each":6}}

**child:** nahi, group barabar nahi hain  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 3481 ms]: Haan, bilkul theek, kyunki samooh 7, 3, 3, 3 ek jaise nahi hain; 16 ka ek-chauthaai 4 hota, har samooh mein 4. Wahi 8 laddoo phir se. 8 ka 1/2 = 4, par 8 ka 1/4 = 2. Samooh zyada, toh har hissa chhota. Agli baar ek hi cheez ke 1/2, 1/3 aur 1/4 ko aamne-saamne rakhenge. Ab aage chalte hain.
  > screen: board compare@1 {"labels":"8 laddoo | 8 ka | 1/2 = | 4 | 8 k","numbers":"8 1/2 4 1/4 2"} · ref {"template":"equal-groups@1","params":{"sizes":[7,3,3,3],"equalTo":{"groups":4,"each":4}}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3732 ms · guard wrap]: Theek hai Riya, ab tum kya chahti ho: aage badhein, thodi der rukein, ya aaj ke liye rok dein?
  > screen: board fraction-bars@1 {"labels":"1/2","numbers":"1/2"} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":4,"shade":0,"label":"?"}]}}

## Agent


