# steady-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Hi Riya, main Asha, tumhari AI teacher. Aaj rectangles, squares aur polygons ka perimeter, cricket ground ki boundary jaisa. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2250 ms]: Cricket pitch ek lamba rectangle hoti hai, 22 m lambi aur 3 m chaudi. Groundsman pitch ke ek kone se chalna shuru kare, kinaare-kinaare chale aur wapas usi kone par pahunche, toh jitna woh chala, wahi pitch ka parimap hai. Theek hai, Riya.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3064 ms · guard screen,long]: Sabhi ko jodkar parimap milega. Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3127 ms · guard long]: Perimeter mein har side jodni hoti hai, sirf do nahi. Is khet ke kono ke naam A se F tak hain. A se shuru karo, aur har bhuja ka naam aur uski lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, aur aakhir mein FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 4 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 938 ms]: Riya, perimeter ke liye khet ki har boundary side jodo: 8, 5, 7, 6 aur 3. In numbers ka addition karke batao. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 metre  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1170 ms · guard noconfirm,screenmismatch]: Haan, sahi hai. Aur pehle wale sawaal ka jawab 15 cm tha, kyunki yeh poora raasta hi triangle ka parimap hai. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [probe · beat s1:explain:e2 · board up · ready 1651 ms · guard screenmismatch]: Sahi—har ek ki lambai 5 cm hai, aur 6 bhujayein hain.
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2930 ms · guard screen,mustsay,screenmismatch]: Kinaare par dhaaga lagega. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2842 ms · guard long,uncorrected]: 24 cm sahi nahi hai. Yeh rectangle 5 cm lamba aur 3 cm chauda hai. Iske kinaare par dhaaga lapeto, phir use seedha karke scale par napo, woh parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap ke liye kinaare ki bhujayein jodte hain, 5, 3, 5 aur 3, guna nahi karte. 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1915 ms]: Riya, screen par rectangle dekho: upar aur neeche 9 cm, dono side 2 cm. Ribbon chaaro kinaaron par chalega. Ab jodo: 9 plus 2 plus 9 plus 2? 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 2 cm","numbers":"9 2"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":2}}

**child:** mujhe lagta hai 22 cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1991 ms · guard screenmismatch]: Bilkul, 22 cm sahi hai: 9 plus 2 plus 9 plus 2, yani ribbon ki lambai 22 cm. Aur pehle wale sawaal ka jawab 20 cm tha, kyunki andar ki jagah area hai, woh bilkul alag cheez hai. Ek triangle shape ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3370 ms · guard invented,long]: Teenon sides jodni hain: 7 plus 9 plus 12. Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 1911 ms]: Haan, step theek hai: ab 7, 9 aur 12 ko jodna hai. Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2176 ms]: Ab 16 m mein teesri bhuja, 12 m, jodni hai, taaki perimeter poora ho. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2740 ms · guard samecard]: Riya, khud try karo: 16 m ke baad 12 m aur jodne par total kitna hoga? Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 1057 ms]: Haan, sahi hai. Haan, 28 m. Ab batao, 28 m kaise mila—16 mein 12 jodte waqt tumne kaunsa step socha?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2190 ms]: Toh poora jawab: kyari ke liye 28 m lambi baad lagegi, kyunki baad kinaare par chalti hai aur teeno bhujayein judi hain, koi nahi chhooti, aur yeh lambai hai, isliye metre mein. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 3 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 30 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1092 ms]: Sahi, 30 m: tumne L-shape ki saari 6 bhujayein jodkar poora perimeter liya. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1990 ms]: Riya, theek hai. Ab se main saral Hindi mein bolungi; parimap ke liye ghoomte hue sabhi bhujayein jodni hoti hain. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 cm hai na  _(correct)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 1894 ms · guard mustsay]: Haan, sahi hai. Har bhuja jodna hamesha kaam karta hai. Rectangle mein lambai do baar aati hai aur chaudai bhi do baar, isliye agle hisse mein uska ek chhota tareeka dekhenge. Is rectangle mein upar aur neeche ki bhuja 10 m ki hai, yeh lambai hai. Daayein aur baayein ki bhuja 6 m ki hai, yeh chaudai hai. Aamne-saamne ki bhujayein barabar hain. Board par 10 m aur 6 m ek-ek baar likha hai, par kinaare par chalte hue lambai do baar aati hai aur chaudai bhi do baar. Toh is rectangle ka parimap kitna hai?
  > card: Toh is rectangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 metre  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 993 ms]: Bilkul, 32 m.
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 3861 ms · guard long]: Yeh rectangle 12 m lamba aur 5 m chauda hai. Neeche baayein kone se chalo: 12 m lambai, phir 5 m chaudai, aur tum saamne wale kone par ho. Yeh sirf aadha raasta hai. Baaki aadha raasta bhi utna hi hai. Isliye rectangle ka parimap = 2 × (lambai + chaudai). Is rectangle ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Is rectangle ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34 m hai na  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 3038 ms · guard screen]: Haan, sahi hai. Riya, yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Toh is square ka parimap kitna hai?
  > card: Toh is square ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 24 cm  _(correct)_

**Asha** [probe · beat s2:explain:e3 · board up · ready 1187 ms]: Haan, sahi hai. Haan, 24 cm bilkul sahi. Ab batao, 4 ko 6 se guna karke parimap kyun milta hai?
  > screen: board measured@1 {"labels":"6 cm | 6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** shayad hisse gin ke  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 5845 ms · guard invented,screenmismatch]: Haan, sahi hai. Ek rectangle notebook cover 24 cm lamba aur 18 cm chauda hai. Iske kinaare par ek baar tape lagani hai. Kitni tape lagegi? Diya hai: cover rectangle shape ka hai, lambai 24 cm hai, chaudai 18 cm hai. Dhoondhna hai: tape ki lambai, yaani cover ka parimap. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 3804 ms · guard quiz,long]: Pehla joda: 24 cm plus 18 cm barabar 42 cm. Tape kinaare par lagti hai aur cover rectangle hai, toh parimap 2 × (lambai + chaudai) se nikalo: P = 2 × (24 + 18), kyunki kinaare par lambai do baar aati hai aur chaudai bhi do baar. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 3684 ms · guard quiz]: 24 plus 18 barabar 42 cm. Pehle bracket mein ek lambai aur ek chaudai jodo: 24 + 18 = 42 cm, kyunki 42 cm sirf aadha kinaara hai, ek kone se saamne wale kone tak. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 2108 ms]: 42 cm ek aadha kinaara hai; poora parimap paane ke liye is aadhe kinaare ko do baar lena hai. Ab is aadhe kinaare ko do baar lo. 2 × 42 kitna hota hai?
  > card: Ab is aadhe kinaare ko do baar lo. 2 × 42 kitna hota hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 84 centimetres  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch06-t01-s2:c1 · board up · ready 1291 ms]: Haan, sahi hai. Toh poora jawab: cover par 84 cm tape lagegi, kyunki chaaron bhujayein jodne par bhi 24 + 18 + 24 + 18 = 84 cm aata hai, jabki 42 cm sirf aadha kinaara hai aur 24 × 18 andar ka area hota. Ek rectangle playground 40 m lamba aur 25 m chauda hai. Iska parimap kitna hai?
  > card: Ek rectangle playground 40 m lamba aur 25 m chauda hai. Iska parimap kitna hai?
  > screen: board measured@1 {"labels":"40 m | 25 m","numbers":"40 25"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":40,"h":25}}

**child:** 130 m hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 · board up · ready 2057 ms]: Haan, sahi hai. Haan, 130 m sahi hai—tumne lambai aur chaudai ko do-do baar joda. Ab ek nayi practice. Ek rectangle table mat 9 cm lamba aur 5 cm chauda hai. Iske kinaare par ek baar lace silni hai. Kitni lace chahiye?
  > card: Ek rectangle table mat 9 cm lamba aur 5 cm chauda hai. Iske kinaare par ek baar lace silni hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"9 cm | 5 cm","numbers":"9 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":5}}

**child:** 28 cm hai na  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 · board up · ready 2630 ms · guard screen]: Haan, sahi hai. Haan, 28 cm sahi. Ek square tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > screen: board measured@1 {"labels":"11 cm | 11 cm","numbers":"11"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":11,"h":11}}

**child:** mujhe lagta hai 44 cm  _(correct)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch06-t01-s3:ask:e1 · board up · ready 3374 ms · guard screen,mustsay,noconfirm]: Sahi, 44 cm: tumne square ki chaar barabar bhujayein pehchaani. Ab tak humne bhujaon se parimap nikala. Agle hisse mein ulta bhi chalenge: parimap pata ho toh bhuja nikalna, aur chakkar aur baad ka kharcha bhi. Is square ka parimap 60 m hai, aur yeh 60 m chaar barabar bhujaon mein bata hua hai. Isliye ek bhuja nikalne ke liye parimap ko 4 se bhaag karte hain, 2 se nahi. Toh is square ki ek bhuja kitni lambi hai?
  > card: Toh is square ki ek bhuja kitni lambi hai?
  > screen: board shape@1 {"labels":"parimap 60 m","numbers":"60"} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** mujhe lagta hai 15 m  _(correct)_

**Asha** [probe · beat s3:explain:e1 · board up · ready 2212 ms]: Haan, sahi hai. Riya, 15 m sahi hai. Tumne 60 m ko 4 barabar bhujayon mein baanta: 60 ko 4 se bhaag kiya. Ab batao, 4 se bhaag kyun kiya?
  > screen: board shape@1 {"labels":"parimap 60 m","numbers":"60"} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** jodte jodte aaya  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c6-maths-ch06-t01-s3:ask:e2 · board up · ready 3465 ms · guard mustsay]: Haan, sahi hai. Is rectangle ka parimap 60 m hai aur lambai 20 m. Aadha parimap, yaani 30 m, ek lambai aur ek chaudai ke barabar hota hai. Isliye chaudai ke liye 30 m mein se lambai ghatate hain. Toh is rectangle ki chaudai kitni hai?
  > card: Toh is rectangle ki chaudai kitni hai?
  > screen: board shape@1 {"labels":"20 m | parimap 60 m","numbers":"20 60"} · ref {"template":"shape@1","params":{"shape":"rectangle","side":"20 m","name":"parimap 60 m"}}

**child:** 10 m hai na  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 · board up · ready 4030 ms · guard mustsay,long]: Haan, sahi hai. Is rectangle plot ki lambai 12 m aur chaudai 8 m hai. Taar poore kinaare par lagegi, toh parimap 2 × (12 + 8) = 40 m. Taar ₹10 per metre hai, toh kharcha 40 × 10 = ₹400. Agar kahin gate ho jahan taar nahi lagti, toh pehle uski lambai parimap se ghatate hain, phir guna karte hain. Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > card: Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > screen: board measured@1 {"labels":"12 m | 8 m","numbers":"12 8"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":8,"trace":true}}

**child:** 38 metre  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:problem · board up · ready 2829 ms · guard leak,invented,long]: Haan, sahi hai. Rani 50 m lambe aur 30 m chaude rectangle park ke 3 chakkar daudti hai. Woh kul kitna daudti hai? Diya hai: park rectangle hai, lambai 50 m hai, chaudai 30 m hai, chakkar 3 hain. Dhoondhna hai: Rani kul kitni doori daudti hai. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"50 m | 30 m","numbers":"50 30"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 4860 ms · guard quiz]: Pehle ek chakkar ka parimap: 2 guna (50 plus 30) = 160 m. Ek chakkar ko park ke poore kinaare par ek baar daudna samjho: 1 chakkar = park ka parimap, kyunki chakkar kinaare par lagta hai, park ke andar nahi. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"50 m | 30 m","numbers":"50 30"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step2 · board up · ready 3592 ms · guard quiz]: Pehle ek chakkar 160 m tha. Park rectangle hai, toh parimap 2 × (lambai + chaudai) se likho: P = 2 × (50 + 30), kyunki kinaare par lambai do baar aati hai aur chaudai bhi do baar. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"50 m | 30 m","numbers":"50 30"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step3 · board up · ready 3479 ms · guard quiz]: Ek chakkar 160 m tha. Pehle bracket jodo: 50 + 30 = 80 m, kyunki 80 m sirf aadha chakkar hai, ek kone se saamne wale kone tak. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"50 m | 30 m","numbers":"50 30"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step4 · board up · ready 3259 ms · guard quiz,long]: Ise do baar lo: 2 × 80 = 160 m, kyunki aadha chakkar do baar lene se poora chakkar banta hai. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"50 m | 30 m","numbers":"50 30"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s3:worked:worked:step5 · board up · ready 5584 ms · guard affirms]: Ek chakkar 160 m hai. Teeno chakkar barabar hain, toh ek chakkar ko 3 se guna karo: 3 chakkar = 3 × 160 m, kyunki har chakkar mein utni hi doori hai, 160 m. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"50 m | 30 m","numbers":"50 30"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 4415 ms · guard wrap,wrap]: Theek hai Riya, tum aaj rukna chahti ho. Vikalp hain: aage badhein, thodi der ka viram lein, ya aaj ke liye band karein—tum kya chunogi?

## Agent


