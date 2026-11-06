# steering-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj rectangles, squares aur polygons ka perimeter dekhenge—cricket ground ki boundary jaisa. Tumhe cricket mein kya pasand hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1962 ms]: Cricket pitch ek lamba rectangle hoti hai, 22 m lambi aur 3 m chaudi. Groundsman pitch ke ek kone se chalna shuru kare, kinaare-kinaare chale aur wapas usi kone par pahunche, toh jitna woh chala, wahi pitch ka parimap hai. Cricket pitch ke kinaare-kinaare ek poora chakkar lagao; jitni doori chale, usse perimeter kehte hain.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1895 ms · guard mustsay]: Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2875 ms · guard long,screenmismatch,uncorrected]: 9 cm sahi nahi hai. Is khet ke kono ke naam A se F tak hain. A se shuru karo, aur har bhuja ka naam aur uski lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, aur aakhir mein FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 4 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2093 ms]: Hindi mein? Zaroor. Parimap ka matlab hota hai kisi aakriti ki sabhi bhujayon ki lambai jodna. Is khet ke paanchon kinaaron ki lambai ek saath jodni hai. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (1 miss) · board up · ready 3195 ms · guard flat]: 26 m nahi. Parimap ke liye paanchon kinaare jodo: 8 m, 5 m, 7 m, 6 m aur 3 m. In sabka kul jod kitna hoga? Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 metre  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1799 ms · guard long,noconfirm]: Haan, sahi hai. Aur pehle wale sawaal ka jawab 15 cm tha, kyunki yeh poora raasta hi triangle ka parimap hai. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1786 ms]: Screen par hexagon dekho: 6 kinaare hain, aur har kinaara 5 cm ka. Chhah kinaaron ko jodkar parimap nikalo. Ab kul kitne cm honge? Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (1 miss) · board up · ready 1775 ms · guard uncorrected]: 5 cm sahi nahi hai. 5 cm sirf ek bhuja ki lambai hai. Hexagon ki 6 barabar bhujayein hain; 5 cm ko 6 baar jodo. Kul parimap kitna hoga? Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 gave · board up · ready 1681 ms · guard mustsay,screenmismatch,uncorrected]: 5 cm sahi nahi hai. Pichhle sawaal ka jawab 30 cm tha, kyunki parimap mein har bhuja ki lambai judti hai. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1923 ms]: Haan Riya, pehle tum try karo. 6 cm aur 4 cm wale rectangle ke chaaron kinaare jodkar kul dhaaga kitna lagega? Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3212 ms · guard long,uncorrected]: 24 cm sahi nahi hai. Yeh rectangle 5 cm lamba aur 3 cm chauda hai. Iske kinaare par dhaaga lapeto, phir use seedha karke scale par napo, woh parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap ke liye kinaare ki bhujayein jodte hain, 5, 3, 5 aur 3, guna nahi karte. 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 4560 ms · guard praise]: Label ki boundary par dhyaan do: 9 cm aur 2 cm ke chaaron kinaare jodne hain. Ribbon kitna hoga? 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 2 cm","numbers":"9 2"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":2}}

**child:** 22 centimetres  _(correct)_

**Asha** [probe · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1191 ms]: Sahi, Riya. Tumne 9 plus 2 plus 9 plus 2 karke 22 cm nikala. Rectangle ki do lambi aur do chaudi bhujayein hoti hain. Ab batao, tumhe kaise pata chala ki yehi chaaron kinaare jodne hain?
  > screen: board measured@1 {"labels":"9 cm | 2 cm","numbers":"9 2"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":2}}

**child:** jodte jodte aaya  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 4003 ms · guard quiz,invented]: Haan, sahi hai. Aur pehle wale sawaal ka jawab 20 cm tha, kyunki andar ki jagah area hai, woh bilkul alag cheez hai. Ek triangle shape ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3195 ms · guard long]: Triangle ki teeno bhujayein jodni hain: 7 m, 9 m aur 12 m. Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3699 ms · guard quiz]: 7 m aur 9 m jodne par 16 m milta hai. Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2483 ms · guard bare]: Theek hai, ab teesri bhuja bhi jodte hain. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m hai na  _(correct)_

**Asha** [probe · beat s1:worked:worked · board up · ready 3210 ms · guard nowhy]: Haan, sahi hai. 28 m sahi aaya.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2499 ms]: Toh poora jawab: kyari ke liye 28 m lambi baad lagegi, kyunki baad kinaare par chalti hai aur teeno bhujayein judi hain, koi nahi chhooti, aur yeh lambai hai, isliye metre mein. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 3 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 30 m hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1915 ms]: Haan, sahi hai. Haan Riya, 30 m sahi hai: tumne L-shape ki sabhi 6 bhujayein jodkar poora parimap nikala. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 centimetres  _(correct)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 1052 ms · guard mustsay,noconfirm]: Haan, sahi hai. Har bhuja jodna hamesha kaam karta hai. Rectangle mein lambai do baar aati hai aur chaudai bhi do baar, isliye agle hisse mein uska ek chhota tareeka dekhenge. Is rectangle mein upar aur neeche ki bhuja 10 m ki hai, yeh lambai hai. Daayein aur baayein ki bhuja 6 m ki hai, yeh chaudai hai. Aamne-saamne ki bhujayein barabar hain. Board par 10 m aur 6 m ek-ek baar likha hai, par kinaare par chalte hue lambai do baar aati hai aur chaudai bhi do baar. Toh is rectangle ka parimap kitna hai?
  > card: Toh is rectangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 m  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 952 ms]: Haan, sahi hai. Haan, Riya, 32 m sahi hai. Ab batao, tumhe kaise pata chala ki 10 m aur 6 m dono do-do baar jodne hain?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** mujhe laga aisa hi hoga  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 3533 ms · guard mustsay,long]: Yeh rectangle 12 m lamba aur 5 m chauda hai. Neeche baayein kone se chalo: 12 m lambai, phir 5 m chaudai, aur tum saamne wale kone par ho. Yeh sirf aadha raasta hai. Baaki aadha raasta bhi utna hi hai. Isliye rectangle ka parimap = 2 × (lambai + chaudai). Is rectangle ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Is rectangle ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** mujhe lagta hai 34 m  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 1777 ms · guard mustsay]: Haan, sahi hai. Yeh square hai. Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Toh is square ka parimap kitna hai?
  > card: Toh is square ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3763 ms · guard wrap,nochoice]: Theek hai Riya, tum thak gayi ho. Tum teen mein se chun sakti ho: aage badhein, chhota break lein, ya aaj ke liye ruk jaayein.
  > screen: board measured@1 {"labels":"6 cm | 6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

## Agent


