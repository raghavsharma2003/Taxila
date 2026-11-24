# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj cricket pitch ke boundary jaise perimeter padhenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 5193 ms]: Achha, Riya. Pitch ke ek kone se kinaare-kinaare chal kar wahi kone lautna socho: total chali hui distance ko kya kahenge?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 4045 ms · guard mustsay]: Koi baat nahi, Riya. Parimap band shape ki boundary ki kul lambai hai: ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par. Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · check script:c6-maths-ch06-t01-s1:ask:e1 · ready 2151 ms]: Main AI hoon, isliye meri personal favourite nahi hoti. Ab 4, 5 aur 6 cm jodo: total parimap kitna aaya?
  > card: Toh is triangle ka parimap kitna hai?

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3827 ms · guard long,uncorrected]: 9 cm sahi nahi hai. Is khet ke kono ke naam A se F tak hain. A se shuru karo, aur har bhuja ka naam aur uski lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, aur aakhir mein FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Khet ka parimap kitna hai?
  > card: Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 4 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"],"trace":true}}

**child:** 38 m  _(correct)_

**Asha** [probe · ready 1439 ms]: Bilkul, Riya—tumne sabhi 6 sides ko ek baar jodkar 38 m nikala. Ab batao, tumhe kaise pata chala ki yehi perimeter hai?

**child:** neeche wala number dekha, phir socha  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2716 ms]: Tumne neeche diye numbers dekhe, par hexagon mein har bhuja jodni hoti hai. Yeh hexagon hai; iski chhah bhujayein barabar hain, har bhuja 5 cm. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2350 ms · guard mustsay,noconfirm]: Sahi, Riya—tumne 6 bhujayein, har ek 5 cm, jodkar 30 cm nikala. Rectangle kinaare par chalne wali lambai hai; andar ki jagah area hai. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 4329 ms · guard long,uncorrected]: 5 cm lambe aur 3 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 5 cm lambe aur 3 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · ready 2207 ms]: Main AI hoon, isliye meri personal pasand nahi hoti. 5 aur 3 cm ki chaaron sides jodo: ribbon ki lambai kitni hogi?
  > card: 5 cm lambe aur 3 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?

**child:** 16  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1154 ms · guard screenmismatch]: Sahi, Riya: 5 plus 3 plus 5 plus 3, yani ribbon ki lambai 16 cm. Ek triangle shape ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2630 ms]: Triangle ki boundary ke liye 7 m aur 9 m jodkar 16 m mile. Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Baad kinaare par lagti hai, toh yeh parimap ka sawaal hai. Teeno bhujayein jodni hain.: P = 7 + 9 + 12, kyunki Koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Pehle do bhujayein jodo.: 7 + 9 = 16 m, kyunki Ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · check script:c6-maths-ch06-t01-s1:ask:worked · ready 3112 ms · guard level]: Koi baat nahi, isko ek baar aur aaram se dekhte hain. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 3824 ms · guard samecard,screenmismatch]: Theek hai, chalo isi sawaal par wapas aate hain. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · check script:c6-maths-ch06-t01-s1:ask:worked · ready 4120 ms · guard samecard]: Ab 16 m mein 12 m jodne par total kitne metres honge?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?

**child:** 16 m  _(misconception)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 gave · ready 2688 ms · guard uncorrected]: 16 m sahi nahi hai. 16 m mein 12 m jodne par 28 m hota hai. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · check script:c6-maths-ch06-t01-s1:c1 · ready 4248 ms · guard level]: Hindi mein? Zaroor. Parimap ke liye sabhi bhujayon ko jodte hain. Jaise 2 m aur 3 m milkar 5 m: 2 plus 3 = 5. Ab in 6 lambaiyon ko jodo: 8, 3, 5, 4, 3 aur 7 m. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?

**child:** 30 m hai na  _(correct)_

**Asha** [probe · ready 2313 ms]: Haan, 30 m sahi hai—tumne sabhi chhah bhujayein jodi: 8 + 3 + 5 + 4 + 3 + 7. Tumne kaise jaana ki parimap ke liye sabhi bhujayein jodni hain?

**child:** maine screen wala picture dekh ke socha  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · board up · ready 2389 ms · guard screenmismatch]: Chaaron kinaare dekhkar, tumne parimap kaise socha?
  > screen: board measured@1 {"labels":"6 cm | ? cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** pehle main try karun?  _(no_evidence)_

**Asha** [practice · ready 4270 ms · guard nowhy]: Theek hai, Riya. Jo 30 m tumne nikala, usmein sabhi bhujayein jodni hain—tumhe yeh kaise pata chala?

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2806 ms]: Abhi tumne andaza lagaya; parimap mein band kinaare ki har bhuja ko dhyan se jodna hota hai. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | ? cm","numbers":"10"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** mujhe lagta hai 28 cm  _(correct)_

**Asha** [practice · check c6-maths-ch06-t01-i03 · ready 2661 ms]: Sahi, Riya—tumne chaaron bhujayein jodkar 28 cm nikala. Ab agla card dekho aur pehle khud perimeter socho. Ek triangle ki sides 5 cm, 6 cm aur 9 cm hain. Iska perimeter kya hai?
  > card: Ek triangle ki sides 5 cm, 6 cm aur 9 cm hain. Iska perimeter kya hai?

**child:** 20 cm  _(correct)_

**Asha** [probe · check c6-maths-ch06-t01-i09 · ready 1820 ms]: Sahi, Riya—tumne triangle ki teenon sides, 5, 6 aur 9 cm, jodkar 20 cm nikala. Tablecloth ke chaaron taraf lace lagana aur table ko cloth se dhakna: kisme perimeter chahiye, kisme area?
  > card: Tablecloth ke chaaron taraf lace lagana aur table ko cloth se dhakna: kisme perimeter chahiye, kisme area?

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · ready 4914 ms · guard wrap]: Samajh gayi Riya, tum thak gayi ho. Hum aage badhein, thoda viram lein, ya aaj ke liye rok dein—tum kya chunogi?

## Agent


