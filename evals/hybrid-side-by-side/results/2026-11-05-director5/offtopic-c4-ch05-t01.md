# offtopic-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions mein equal shares dekhenge. Cooking mein pizza ko barabar tukdon mein kaise baantogi?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2307 ms]: Achha, Riya—barabar tukde hona zaroori hai. Maa ki ek roti do bachchon mein baanto: dono ko kitne equal pieces milenge?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 4965 ms · guard mustsay,leak]: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > screen: board fraction-parts@1 {"numbers":"1 2"} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:ask:e1 · ready 2167 ms]: Main AI hoon, isliye meri personal favourite nahi hoti. Ab dono tukde liye—fraction ke upar ka number kitna hoga?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?

**child:** 1  _(no_evidence)_

**Asha** [repair · check script:c4-maths-ch05-t01-s1:ask:e1 · ready 3059 ms]: Riya, tumne ek tukda socha hai. Roti ke dono tukde tumne liye—ab dono ko ek saath count karo. Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?
  > card: Ab socho, tumne roti ke dono tukde le liye. Tab fraction mein upar wala number kya hoga?

**child:** mujhe lagta hai 2  _(correct)_

**Asha** [probe · ready 1971 ms]: Bilkul, Riya—upar wala number 2, kyunki tumne dono pieces liye. Tumne 2 kaise jaana?

**child:** two  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 4342 ms · guard praise,mustsay,uncorrected]: Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > card: Ek pizza ke 3 tukde kiye: ek bada aur do chhote. Kya chhota tukda pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board compare@1 {"labels":"Cake A | Cake B | 3 tukde | 3 tukde | 1 ","numbers":"3 1 2 1/3"} · ref {"template":"compare@1","params":{"left":{"title":"Cake A","items":["3 tukde","1 bada, 2 chhote","1/3 nahi"]},"right":{"title":"Cake B","items":["3 tukde","sab barabar","har tukda 1/3"]}}}

**child:** Yes  _(incorrect)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · board up · ready 4280 ms · guard leak]: Pehle yeh hissa. Diya hai: 1/3 aur 15. Pehle: 3 barabar hisse. Yeh kadam saaf hai?
  > screen: board compare@1 {"labels":"Tarbooz | Kaagaz ki patti | 1 bada slice","numbers":"1 3 2 1/3"} · ref {"template":"compare@1","params":{"left":{"title":"Tarbooz","items":["1 bada slice","2 chhote slice","barabar nahi, 1/3 nahi"]},"right":{"title":"Kaagaz ki patti","items":["3 barabar hisse","har hissa 1/3"]}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · ready 1873 ms]: Theek hai, Riya. Ab hum picture ko dhyaan se dekhenge, phir fraction ka rule lagayenge. Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > card: Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · ready 3645 ms · guard leak]: Theek hai, chalo isi sawaal par wapas aate hain. Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?
  > card: Ek roti ke 2 tukde hue, ek bada aur ek chhota. Kya chhota tukda roti ka aadha hai?

**child:** no  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 3314 ms · guard mustsay]: Tumne sahi kaha: unequal tukde aadha nahi hote; fraction ke liye parts barabar hone chahiye. Ek roti ka ek tukda 1/3 hai, aur saare tukde barabar hain. Toh poori roti mein kitne tukde hain?
  > card: Ek roti ka ek tukda 1/3 hai, aur saare tukde barabar hain. Toh poori roti mein kitne tukde hain?
  > screen: board fraction-parts@1 {"numbers":"1 3"} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** 3 tukde  _(correct)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 3021 ms · guard mustsay,long]: Bilkul, 3 barabar tukde. Ek pizza ke 4 barabar slice the. Riya ne 1 slice khaya, aur 3 slice bache. Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > card: Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 8660 ms · guard mustsay,long,twoq]: Theek hai Riya, picture ko aur chhota karo: 4 barabar slices mein sirf khaya hua 1 slice rangin hai; bache hue slices ko abhi side mein rakho. Ek pizza ke 4 barabar slice the. Riya ne 1 slice khaya, aur 3 slice bache. Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > card: Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 2521 ms · guard screenmismatch]: Fraction mein denominator total slices hota hai. Khaya hua fraction kya hoga?
  > card: Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > screen: board fraction-parts@1 {"numbers":"1 4"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"circle"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:ask:e4 · ready 7461 ms · guard leak,twoq]: Achha, ab phir isi sawaal ki taraf chalte hain. Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?
  > card: Riya kehti hai ki usne pizza ka 1/3 khaya, kyunki 3 slice bache. Kya Riya sahi hai?

**child:** No hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch05-t01-s1:ask:worked · board up · ready 3840 ms · guard invented]: Haan, Riya—kyunki total 3 barabar tukde the aur 1 tukda khaya gaya. Diya hai: ek poori roti, roti ke 3 barabar tukde, 2 tukde khaye gaye hain. Pehle dekho ki tukde barabar hain ya nahi.: haan, 3 barabar tukde, har tukda 1/3, kyunki Fraction sirf barabar tukdon ka hota hai. Neeche wala number likho: poori roti ke barabar tukde.: 3, kyunki Neeche wala number poori roti ke saare tukde batata hai, bacha hua tukda nahi. Upar wala number likho: kitne tukde khaye.: 2, kyunki Upar wala number batata hai ki humne kitne tukde liye. Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":0,"whole":"roti"}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [practice · check script:c4-maths-ch05-t01-s1:ask:worked · ready 2260 ms]: Theek hai. Ab se main saral Hindi mein, Roman lipi mein samjhaungi. Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?

**child:** 2/1  _(no_evidence)_

**Asha** [repair · check script:c4-maths-ch05-t01-s1:ask:worked · ready 2753 ms]: Upar 2 khaye hue tukde hain; neeche poori roti ke 3 barabar tukde. Fraction ka neeche wala number kya hoga?
  > card: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?

**child:** 2/1  _(no_evidence)_

**Asha** [repair · check script:c4-maths-ch05-t01-s1:ask:worked · ready 2608 ms]: Neeche wala number poori roti ke sabhi barabar tukdon ki ginti batata hai. Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?
  > card: Ab in dono numbers se fraction likho. Roti ka kitna hissa khaya gaya?

**child:** ruko, main khud karta hoon  _(no_evidence · thinking)_

**Asha** [repair · ready 2613 ms]: Theek hai, Riya. Aaram se khud karo.

**child:** 2/3  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch05-t01-s1:c1 gave · ready 1209 ms]: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?
  > card: Ek laddoo ke 3 tukde hue: ek bada aur do chhote. Kya har tukda laddoo ka ek-tihaai hai?

**child:** No  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch05-t01-s1:c2 · ready 4484 ms · guard leak]: Tumne 2/3 sahi likha: upar khaye tukde, neeche kul barabar tukde. Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, fraction mein batao.
  > card: Ek chocolate ke 3 barabar tukde kiye, aur 1 tukda kha liya. Chocolate ka kitna hissa khaya, fraction mein batao.

**child:** one-third  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch05-t01-s1:c3 · ready 1280 ms]: Sahi, Riya—tumne khaye hue 1 tukde ko kul 3 barabar tukdon se jodkar one-third likha. Ek cake ke 4 tukde kiye: 2 bade aur 2 chhote. Riya ne 1 chhota tukda liya. Kya Riya ne cake ka ek-chauthaai liya?
  > card: Ek cake ke 4 tukde kiye: 2 bade aur 2 chhote. Riya ne 1 chhota tukda liya. Kya Riya ne cake ka ek-chauthaai liya?

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 2967 ms]: Theek hai, Riya—tum aaj yahin rokna chahti ho. Aage badhein, thodi der rukein, ya aaj khatam karein?

## Agent


