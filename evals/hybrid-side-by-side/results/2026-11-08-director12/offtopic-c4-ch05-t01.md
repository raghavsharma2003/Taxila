# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions mein equal shares dekhenge—cooking jaisa. Tumhe cooking mein kya banana pasand hai?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2967 ms]: Maa ne kitchen mein ek garam roti banayi, aur tum do bhai-behen ho. Roti ke 2 tukde honge. Aaj dekhenge ki dono ka hissa kab sach mein barabar hota hai. Koi baat nahi, Riya—cooking pasand hona zaroori nahi. Maa ne ek garam roti do bachchon mein baanti; barabar hissa kaise pehchanoge?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2336 ms]: Dekho, roti ke 2 barabar tukde hain, aur 1 tukda rangin hai. Yeh tukda roti ka aadha hai, yaani 1/2. Neeche wala 2 batata hai ki poori roti ke kitne barabar tukde bane. Upar wala 1 batata hai ki humne kitne tukde liye. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 3098 ms]: Cricket mein sixer—ball seedha boundary ke paar, wah! Is baat par hum is question ke turant baad wapas aayenge. Is roti mein 1 tukda rangin hai aur 1 bina rang ka. Kya isliye rangin hissa 1/1 hai, haan ya nahi?
  > card: Is roti mein 1 tukda rangin hai aur 1 bina rang ka. Kya isliye rangin hissa 1/1 hai, haan ya nahi?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** nahi  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1260 ms]: Bilkul, Riya, kyunki roti ke 2 barabar tukde hain, toh rangin 1 tukda 1/2 hai, 1/1 nahi. Tumne yeh kaise jaana?
  > screen: board fraction-parts@1 {"numbers":"1 2","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** maine dono ko mila ke dekha  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 3206 ms]: Sahi method, Riya—poora milaakar dekha. Achha, tumne apna tareeka bataya. Aur cricket ki baat: kal tumne cricket khela, sixer maara: yeh sunke bahut achha laga. Cake A ke bhi 3 tukde hain, Cake B ke bhi 3 tukde. Par Cake A mein 1 bada, 2 chhote hain, toh uska tukda 1/3 nahi hai. Cake B mein sab barabar hain, isliye wahan har tukda 1/3 hai, yaani ek-tihaai. Yahan tak theek hai?
  > screen: board wholes@1 {"labels":"Cake A | Cake B"} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 4192 ms · guard leak]: Ek-tihaai tabhi hota hai jab 3 tukde bilkul barabar hon. Cake A ke tukde chhote-bade hain, Cake B ke sab barabar hain. Ab is par ek chhota sawaal.
  > screen: board wholes@1 {"labels":"Cake A | Cake B"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Cake A"},{"parts":3,"title":"Cake B"}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2222 ms]: Pizza ko dhyaan se dekho. Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {"labels":"Pizza"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 3501 ms · guard samecard]: Yaad karo: Cake A ke bhi 3 tukde hain, Cake B ke bhi 3 tukde. Par Cake A mein 1 bada, 2 chhote hain, toh uska tukda 1/3 nahi hai. Cake B mein sab barabar hain, isliye wahan har tukda 1/3 hai, yaani ek-tihaai. Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {"labels":"Pizza"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"}]}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 3636 ms · guard long,uncorrected]: Nahi, yeh jawab nahi hai. Tarbooz ka 1 bada tukda aur 2 chhote tukde barabar nahi hain, toh koi tukda 1/3 nahi. Kaagaz ki patti ke 3 barabar hisse hain, toh har hissa 1/3 hai. Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > card: Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > screen: board compare@1 {"labels":"Tarbooz | Kaagaz ki patti | 1 bada tukda","numbers":"1 3 2 1/3"} · ref {"template":"compare@1","params":{"left":{"title":"Tarbooz","items":["1 bada tukda","2 chhote tukde","barabar nahi, 1/3 nahi"]},"right":{"title":"Kaagaz ki patti","items":["3 barabar hisse","har hissa 1/3"]}}}

**child:** no  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 1371 ms · guard mustsay]: Sahi, kyunki roti ke dono tukde barabar nahi hain, aur aadha 2 barabar tukdon mein se ek hota hai. Is circle ke 3 barabar hisse hain, aur 1 hissa rangin hai. Yeh rangin hissa ek-tihaai hai, yaani 1/3. Neeche ka 3 poore circle ke saare barabar hisse batata hai. Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > card: Agar is circle ka ek aur hissa bhi rang dein, toh circle ka kitna hissa rangin hoga, fraction mein?
  > screen: board fraction-parts@1 {"numbers":"1 3"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** two-thirds  _(correct)_

**Asha** [explain · beat s1:explain:e4 · board up · ready 1845 ms · guard mustsay]: Bilkul, Riya—2 barabar hisse rangin hain, kyunki circle ke 3 barabar hisse hain aur ab unme se 2 rangin hain, yaani 2/3. Ab circle ke 4 barabar hisse hain. 1 hissa rangin hai, 3 bina rang ke. Rangin hissa ek-chauthaai hai, yaani 1/4. Neeche poore circle ke 4 hisse aate hain, bache hue 3 nahi. Yahan tak theek hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 3794 ms · guard praise,affirms]: Cricket ka sixer—ball seedha boundary ke paar! Is baat par turant wapas aayenge. Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > card: Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e4 · board up · ready 3195 ms · guard mustsay,leak]: Neeche hamesha poore ke saare hisse aate hain, yahan 4. Bache hue 3 hisse neeche nahi aate. Ab isi par ek sawaal.
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 3691 ms · guard affirms]: Dekho, yahi 1/4 ab patti par. Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > card: Ek pizza ke 4 barabar slice the. 1 slice kha liya gaya, aur 3 slice bache. Zoya ka kehna hai ki pizza ka 1/3 khaya gaya, kyunki 3 slice bache. Kya yeh sahi hai?
  > screen: board fraction-bars@1 {"wholes":"1 equal bars","bar1":"4 equal parts, 1 shaded = 1/4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** No hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2402 ms · guard invented]: Haan, sahi hai, kyunki pizza ke 4 barabar slice the aur 1 khaya gaya, toh 1/4 khaya; bache hue 3 neeche nahi aate. Ek lambi barfi ke 3 barabar tukde kiye. Usme se 2 tukde kha liye. Barfi ka kitna hissa khaya gaya? Diya hai: ek poori barfi, barfi ke 3 barabar tukde, 2 tukde khaye gaye hain. Dhoondhna hai: barfi ka kitna hissa khaya, fraction mein. Chalo, aage dekhte hain.
  > screen: board shade-grid@1 {} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3047 ms]: Pehla kadam dekho. Pehle neeche wala number likho: 3, kyunki neeche poori barfi ke saare barabar tukde aate hain. Yeh kadam saaf hai?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · ready 1827 ms]: Theek hai, ab Hindi mein. Barfi ko 3 barabar tukdon mein baanta. Neeche 3 likhenge, kyunki poore mein 3 tukde hain. Upar kitna khaya likhenge?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4483 ms · guard quiz]: Pehla kadam dekho. Poori barfi ke kitne barabar tukde bane, woh gino. Wahi number neeche likhte hain, yahan 3. Chalo, aage dekhte hain.
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2735 ms]: Ab doosra kadam. Ab upar wala number likho: 2, kyunki upar woh tukde aate hain jo khaye gaye. Ab isse aage chalte hain.
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 3750 ms · guard ask]: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":1,"cols":3,"shade":2,"labels":false,"hideResult":true}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 1831 ms]: Theek hai, Riya. Tum khud bhinn likho: upar khaye gaye tukde, neeche kul tukde.
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"bar"}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 3446 ms · guard ask]: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se bhinn likho. Barfi ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"bar"}}

**child:** two thirds  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1219 ms]: Bilkul, Riya—tumne khaye hue 2 tukde upar aur kul 3 tukde neeche rakhe: 2/3, kyunki barfi ke 3 barabar tukde the aur 2 khaye gaye, bacha hua 1 tukda neeche nahi aata. Tumhe yeh kaise pata chala?
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3 2"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"bar"}}

**child:** maine dhyan se dekh ke socha  _(incorrect)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 · board up · ready 3306 ms]: Theek, yeh tumhari soch thi. Aur cricket ki baat: kal tumne cricket khela, sixer maara: yeh sunke bahut achha laga. Dhyan se dekhkar sochna sahi tareeka hai. Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > card: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > screen: board wholes@1 {"labels":"Laddoo"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 (1 miss) · board up · ready 2534 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ek-tihaai ke liye 3 tukde bilkul barabar hone chahiye. Dekho ki yahan ke tukde barabar hain ya chhote-bade. Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > card: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > screen: board wholes@1 {"labels":"Laddoo"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 (2 miss) · board up · ready 2008 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Tarbooz ka 1 bada tukda aur 2 chhote tukde barabar nahi hain, toh koi tukda 1/3 nahi. Kaagaz ki patti ke 3 barabar hisse hain, toh har hissa 1/3 hai. Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > card: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > screen: board wholes@1 {"labels":"Laddoo"} · ref {"template":"compare@1","params":{"left":{"title":"Tarbooz","items":["1 bada tukda","2 chhote tukde","barabar nahi, 1/3 nahi"]},"right":{"title":"Kaagaz ki patti","items":["3 barabar hisse","har hissa 1/3"]}}}

**child:** nahi, tukde barabar nahi hain  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · board up · ready 4041 ms · guard ask]: Bilkul, Riya—tumne pehchana ki tukde barabar nahi hain, kyunki laddoo ke 3 tukde barabar nahi hain, ek bada aur do chhote. Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > card: Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, bhinn mein batao.
  > screen: board fraction-parts@1 {"labels":"3 barabar hisse","numbers":"3"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Laddoo"}]}}

**child:** 1/2  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 3111 ms · guard long,ask,uncorrected]: 1/2 sahi nahi hai. Poori roti ke 4 barabar tukde neeche aate hain, aur khaya hua 1 rangin tukda upar. Bache hue tukde neeche kabhi nahi aate. Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, bhinn mein batao.
  > card: Ek chocolate bar ke 4 barabar tukde kiye, aur 3 tukde kha liye. Bar ka kitna hissa khaya, bhinn mein batao.
  > screen: board fraction-parts@1 {"numbers":"1 4","labels":""} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"bar"}}

**child:** teen bata chaar  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · board up · ready 2119 ms]: Bilkul sahi, Riya—tumne khaye hue 3 tukde upar aur kul 4 tukde neeche rakhe, kyunki bar ke 4 barabar tukde the aur unme se 3 khaye gaye, yaani 3/4. Ek cake ke 4 tukde kiye: 1 bada aur 3 chhote. Zoya ne 1 chhota tukda liya. Kya yeh chhota tukda cake ka ek-chauthaai hai?
  > card: Ek cake ke 4 tukde kiye: 1 bada aur 3 chhote. Zoya ne 1 chhota tukda liya. Kya yeh chhota tukda cake ka ek-chauthaai hai?
  > screen: board fraction-parts@1 {"numbers":"1 3"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":3,"whole":"bar"}}

**child:** nahi  _(correct)_

**Asha** [repair · beat s1:check:c3 · board up · ready 3246 ms]: Sahi, kyunki cake ke 4 tukde barabar nahi hain, aur ek-chauthaai 4 barabar tukdon mein se 1 hota hai. Ab tak humne ek roti ke barabar hisse kiye. Ab bahut saare laddoo ke barabar samooh banakar hissa nikalenge. Niyam wahi hai: barabar hisse. Chalo, ab aage.
  > screen: board wholes@1 {"labels":"Cake | Barabar"} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"equal":false,"title":"Cake"},{"parts":4,"title":"Barabar"}]}}

**child:** achha  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 · board up · ready 2816 ms · guard mustsay]: Dekho, 8 laddoo 2 barabar group mein hain, har group mein 4. Ek group 8 ka aadha hai. Toh 8 ka 1/2 = 4. Check karo: 2 × 4 = 8. Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hai?
  > card: Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hai?
  > screen: board equal-groups@1 {"numbers":"2 4 8","labels":""} · ref {"template":"equal-groups@1","params":{"groups":2,"each":4}}

**child:** 8  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch05-t01-s2:ask:e1 (1 miss) · board up · ready 4365 ms · guard answerinq,uncorrected]: 8 sahi nahi hai. 8 laddoo ko 2 barabar samooh mein baanto, har samooh mein 4 aate hain. Ek samooh hi 8 ka aadha hai. Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hai?
  > card: Ab dibbe mein 12 laddoo hain. 12 ka aadha kitna hai?
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 4266 ms · guard wrap,nochoice,wrap]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board shade-grid@1 {"labels":""} · ref {"template":"shade-grid@1","params":{"rows":3,"cols":4,"shade":0,"labels":false,"hideResult":true}}

## Agent


