# stuck-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions mein equal shares dekhenge—cooking mein cake baantne jaisa. Tumhe cooking mein kya banana pasand hai?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2775 ms]: Achha, Riya! Maa ki garam roti socho: do bachchon mein baantni hai. Dono tukde same size hon, tabhi share fair hoga. Kaise kaatogi?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 5121 ms · guard leak]: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > screen: board fraction-parts@1 {"numbers":"1 2"} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** 1  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 4118 ms · guard mustsay]: Har tukda aadha, yaani 1/2. Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > screen: board fraction-parts@1 {"numbers":"1 2"} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:ask:e1 · ready 3309 ms · guard samecard]: Hindi mein? Zaroor. Riya, upar ka number liye gaye tukdon ki ginti hota hai. Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?

**child:** 1  _(no_evidence)_

**Asha** [repair · check script:c4-maths-ch05-t01-s1:ask:e1 · ready 3892 ms · guard leak,samecard]: Tumne roti ka pehla aur doosra, dono tukde liye. Upar kitni ginti likhegi?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · check script:c4-maths-ch05-t01-s1:ask:e1 · ready 1006 ms]: Tumne pehla aur doosra, dono tukde liye. Upar wala number liye gaye tukdon ki kul ginti batata hai. Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?

**child:** 2 tukde  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 3007 ms · guard mustsay]: Haan, tumne sahi gina: upar wala number liye gaye tukdon ki kul ginti, 2, hota hai. Par tukde barabar hon tabhi naam ek-tihaai milta hai. Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board compare@1 {"labels":"Cake A | Cake B | 3 tukde | 3 tukde | 1 ","numbers":"3 1 2 1/3"} · ref {"template":"compare@1","params":{"left":{"title":"Cake A","items":["3 tukde","1 bada, 2 chhote","1/3 nahi"]},"right":{"title":"Cake B","items":["3 tukde","sab barabar","har tukda 1/3"]}}}

**child:** nahi  _(correct)_

**Asha** [probe · ready 988 ms]: Sahi. Tumne kaise jaana ki chhota tukda pizza ka ek-tihaai nahi hai?

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · board up · ready 3371 ms · guard nowhy]: Screen par dono cakes dekho: 3 tukde hain, par ek cake mein tukde barabar nahi. Tumne kaise jaana?
  > screen: board compare@1 {"labels":"Cake A | Cake B | 3 tukde | 3 tukde | 1 ","numbers":"3 1 2 1/3"} · ref {"template":"compare@1","params":{"left":{"title":"Cake A","items":["3 tukde","1 bada, 2 chhote","1/3 nahi"]},"right":{"title":"Cake B","items":["3 tukde","sab barabar","har tukda 1/3"]}}}

**child:** Yes  _(incorrect)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 3981 ms · guard leak,uncorrected]: Ek roti ka ek tukda 1/3 hai, aur saare tukde barabar hain. Toh poori roti mein kitne tukde hain?
  > card: Ek roti ka ek tukda 1/3 hai, aur saare tukde barabar hain. Toh poori roti mein kitne tukde hain?
  > screen: board fraction-parts@1 {"numbers":"1 3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** 3  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2825 ms · guard long,noconfirm]: Haan, Riya—3 poore barabar tukde the. Ek pizza ke 4 barabar slice the. Riya ne 1 slice khaya, aur 3 slice bache. Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > card: Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 3987 ms · guard mustsay]: Circle ke 4 barabar hisse the, 1 khaya. Khaya hua hissa kul 4 mein se ek-chauthaai, yaani 1/4, hai ya 1/3?
  > card: Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** Yes  _(incorrect)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · board up · ready 3845 ms · guard praise,affirms,uncorrected]: Pehle yeh hissa. Diya hai: 1/3 aur 15. Pehle: 3 barabar hisse. Yeh kadam saaf hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** ruko, main khud karta hoon  _(no_evidence · thinking)_

**Asha** [repair · ready 2314 ms]: Theek hai, Riya. Tum apna tareeka likho.

**child:** achha  _(no_evidence)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · ready 3618 ms · guard affirms]: Theek hai, Riya. Ek cake ke 3 barabar tukde kiye, aur 2 tukde kha liye. Cake ka kitna hissa khaya, fraction mein batao.
  > card: Ek cake ke 3 barabar tukde kiye, aur 2 tukde kha liye. Cake ka kitna hissa khaya, fraction mein batao.

**child:** 3/2  _(incorrect)_

**Asha** [hint · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · ready 2858 ms · guard uncorrected]: 3/2 sahi nahi hai. Tumne khaye hue 2 tukde upar rakhe. Neeche kul barabar tukde kitne the—3 ya 2?
  > card: Ek cake ke 3 barabar tukde kiye, aur 2 tukde kha liye. Cake ka kitna hissa khaya, fraction mein batao.

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · ready 2546 ms]: Main AI hoon, isliye meri apni pasand nahi hoti. Virat ke cricket shots par hum fractions ke examples bana sakte hain. Ek cake ke 3 barabar tukde kiye, aur 2 tukde kha liye. Cake ka kitna hissa khaya, fraction mein batao.
  > card: Ek cake ke 3 barabar tukde kiye, aur 2 tukde kha liye. Cake ka kitna hissa khaya, fraction mein batao.

**child:** 3/2  _(incorrect)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked gave · board up · ready 4755 ms · guard long,uncorrected]: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"roti"}}

**child:** 2/1  _(no_evidence)_

**Asha** [repair · check script:c4-maths-ch05-t01-s1:ask:worked · ready 2539 ms]: Riya, 2 khaye tukde upar likho, aur roti ke kul 3 barabar tukde neeche. Fraction kya banega?
  > card: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?

**child:** 2/1  _(no_evidence)_

**Asha** [repair · check script:c4-maths-ch05-t01-s1:ask:worked · ready 3591 ms]: Upar 2 khaye gaye tukde likho. Neeche poori roti ke kul barabar tukdon ki ginti likho. Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?

**child:** 2/1  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 gave · ready 3313 ms]: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > card: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · board up · ready 4391 ms · guard affirms,leak,uncorrected]: Pehle yeh hissa. Diya hai: 1/3 aur 15. Pehle: 3 barabar hisse. Yeh kadam saaf hai?
  > screen: board compare@1 {"labels":"Tarbooz | Kaagaz ki patti | 1 bada slice","numbers":"1 3 2 1/3"} · ref {"template":"compare@1","params":{"left":{"title":"Tarbooz","items":["1 bada slice","2 chhote slice","barabar nahi, 1/3 nahi"]},"right":{"title":"Kaagaz ki patti","items":["3 barabar hisse","har hissa 1/3"]}}}

**child:** thak gaya, bye  _(no_evidence · goodbye)_

**Asha** [break · ready 4050 ms · guard wrap,nochoice,wrap]: Theek hai Riya, tum thak gayi ho. Tum chun sakti ho: aage badhein, chhota break lein, ya aaj ke liye rok dein—kya chunogi?

## Agent


