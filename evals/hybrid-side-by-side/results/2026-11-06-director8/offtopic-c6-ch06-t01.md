# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj cricket ground jaise shapes ka perimeter dekhenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2135 ms]: Cricket pitch ek lamba rectangle hoti hai, 22 m lambi aur 3 m chaudi. Groundsman pitch ke ek kone se chalna shuru kare, kinaare-kinaare chale aur wapas usi kone par pahunche, toh jitna woh chala, wahi pitch ka parimap hai. Achha, Riya—ab cricket pitch ka kinaara karo: ek kone se chal kar wahi kone tak lautna kya hoga?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3057 ms · guard screen,mustsay]: Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1722 ms]: Virat ka cover drive kaafi zabardast hai—unke baare mein turant baat karenge. Ab 4, 5, 6 cm jodkar parimap batao. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2718 ms · guard long,uncorrected]: 9 cm sahi nahi hai. Is khet ke kono ke naam A se F tak hain. A se shuru karo, aur har bhuja ka naam aur uski lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, aur aakhir mein FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 4 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"],"trace":true}}

**child:** 29 m  _(correct)_

**Asha** [probe · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1256 ms · guard screenmismatch]: Bilkul, Riya—tumne sabhi paanch sides jodkar 29 m nikala.
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 4470 ms · guard screen]: Aur Virat ki baat: Groundsman pitch ke ek kone se chalna shuru kare, kinaare-kinaare chale aur wapas usi kone par pahunche, toh jitna woh chala, wahi pitch ka parimap hai. Aur pehle wale sawaal ka jawab 15 cm tha, kyunki yeh poora raasta hi triangle ka parimap hai. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1949 ms · guard mustsay]: Haan, sahi hai. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2852 ms · guard long,uncorrected]: 24 cm sahi nahi hai. Yeh rectangle 5 cm lamba aur 3 cm chauda hai. Iske kinaare par dhaaga lapeto, phir use seedha karke scale par napo, woh parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap ke liye kinaare ki bhujayein jodte hain, 5, 3, 5 aur 3, guna nahi karte. 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1669 ms]: Virat ka cover drive kaafi mashhoor hai; is par turant baat karenge. Ab 9 aur 2 ko chaar kinaaron mein kaise lagao? Try karke batao. 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 2 cm","numbers":"9 2"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":2}}

**child:** 18 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 1620 ms · guard uncorrected]: 18 cm sahi nahi hai. 18 cm sirf do lambe kinaaron ka jod hai. Ribbon ko do chhote kinaaron se bhi guzarna hai. 9 aur 2 ko chaar sides mein jodkar try karo. 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 2 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 2 cm","numbers":"9 2"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":2}}

**child:** 22 centimetre  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2044 ms · guard long]: Haan, sahi hai. Virat ka cover drive boundary ke poore round jaisa hai. Aur pehle wale sawaal ka jawab 20 cm tha, kyunki andar ki jagah area hai, woh bilkul alag cheez hai. Ek triangle shape ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3447 ms · guard invented]: Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2737 ms]: Screen par triangle ki teen sides dekho: 7 m, 9 m, 12 m. Baad teenon kinaaron par lagegi. Ab in teen numbers ko jodkar bolo.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2209 ms]: Cricket pasand hai, Riya—pitch ke boundary round jaisa socho. Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2114 ms]: Pehle 7 m aur 9 m jodkar 16 m mila. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 1829 ms]: Hindi mein? Zaroor. Riya, pehle 7 m aur 9 m ko jodkar kul lambai likho: 16 m. Ab teesri bhuja ko bhi isi kul mein milana hai. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 3349 ms · guard samecard,uncorrected]: 16 m sahi nahi hai. 16 m ke baad 12 m aur badhao. Kul lambai kitni hogi, Riya? Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1823 ms]: Haan, sahi hai. Toh poora jawab: kyari ke liye 28 m lambi baad lagegi, kyunki baad kinaare par chalti hai aur teeno bhujayein judi hain, koi nahi chhooti, aur yeh lambai hai, isliye metre mein. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 3 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3475 ms · guard praise,affirms,flat]: Ab tum khud karo: 8, 3, 5, 4, 3 aur 7 m ko jodkar parimap batao. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 3 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 23 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 2015 ms · guard uncorrected]: 23 m sahi nahi hai. 23 m mein kuch bhujayein chhoot gayi hain. 8, 3, 5, 4, 3 aur 7 sabko ek-ek baar jodo. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 3 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 23 m  _(misconception)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 gave · board up · ready 2104 ms · guard uncorrected]: 23 m sahi nahi hai. Pichhle sawaal ka jawab 30 m tha, kyunki jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 40 cm  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 1773 ms]: 40 cm sahi nahi hai. Lace ko chaaron kinaaron se guzarna hai: 10, 4, 10 aur 4. Inhe ek-ek baar jodkar batao. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 3140 ms · guard wrap,nochoice,wrap]: Theek hai, Riya—ab tum chun sakti ho: perimeter jaari rakhein, thoda break lein, ya aaj ke liye rok dein?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

## Agent


