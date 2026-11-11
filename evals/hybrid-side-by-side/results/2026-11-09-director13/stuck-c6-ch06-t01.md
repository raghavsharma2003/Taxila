# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj cricket pitch jaise shapes ka perimeter dekhenge. Tumhe cricket mein batting pasand hai ya bowling?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2872 ms]: Cricket pitch ek lamba rectangle hoti hai, lagbhag 20 m lambi aur 3 m chaudi. Pitch ke ek kone se chalna shuru karo, kinaare-kinaare chalo aur wapas usi kone par pahuncho, toh jitni doori tay hui, wahi pitch ka parimap hai. Achha, Riya—pitch par kinaare-kinaare ek poora chakkar lagao. Jo total doori chale, usse perimeter kehte hain.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 4988 ms · guard content_filter_rewrite]: Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2245 ms · guard mustsay]: Parimap matlab kinaare ka poora raasta. Triangle ki teeno bhujayein, 4 cm, 5 cm aur 6 cm, ek ke baad ek chalo. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3824 ms · guard ask]: Haan, ab se Hindi mein bolti hoon. Toh is tribhuj ka parimap kitna hai?
  > card: Toh is tribhuj ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetres  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 934 ms]: Sahi, Riya—tumne teenon bhujayein jodkar 4 plus 5 plus 6, kul 15 cm nikala, kyunki teeno bhujayein judti hain, 4 + 5 + 6 = 15 cm. Ab batao, tumhe kaise pata chala ki ye parimap hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 3403 ms · guard long]: Theek hai. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2167 ms]: Hexagon ki chhah bhujayein sab barabar hain, har ek 5 cm. Label ek par hai, par parimap mein har bhuja judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 3086 ms · guard mustsay,long]: Haan, sahi hai, kyunki hexagon ki chhah barabar bhujayein 5 cm ki hain, 6 × 5 = 30 cm. Yeh aayat 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 3023 ms]: Dekho, yahi numbers ab patti par. Aamma. Is aayat ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is aayat ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board unrolled@1 {"shape":"rectangle","sides":"4 sides laid in a straight line","lengths":"6 cm, 4 cm, 6 cm, 4 cm","total":"?","labels":"6 cm | 4 cm"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 cm hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2239 ms · guard screenmismatch]: Haan, sahi hai, kyunki dhaaga kinaare par chalta hai, 6 + 4 + 6 + 4 = 20 cm. Ek tribhuj aakaar ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari tribhuj aakaar ki hai, ek band aakaar, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Ab isse aage chalte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3356 ms]: Pehla kadam dekho. Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2717 ms]: Baad poore kinaare par lagti hai. Toh 7 m, 9 m aur 12 m, teeno ko jodna hai. Chalo, aage dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3689 ms · guard script]: Ab doosra kadam. Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Ab isse aage chalte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 3196 ms · guard bare]: Theek hai, Riya. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2962 ms · guard level,leak,samecard]: 16 m mein teesri bhuja, 12 m, bhi jodo. Ikaai pehle jodo, phir dahaai. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 2228 ms]: Theek hai, Riya. Tum khud 16 m mein 12 m jodkar nikaalo; apna hisaab likhkar batao.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2038 ms · guard ask]: Bilkul sahi, Riya—tumne 16 m aur 12 m jodkar 28 m nikala. Toh poora jawab: kyari ke liye 28 m lambi baad lagegi, kyunki baad kinaare par chalti hai, aur teeno bhujayein 7 + 9 + 12 = 28 m judti hain, koi nahi chhooti. Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 23 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 3752 ms · guard flat,uncorrected]: 23 m sahi nahi hai. A se shuru karke har bhuja ka naam aur lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2135 ms]: Virat ke cover drive ki timing aur seedhi batting mashhoor hai. Is baat par tumse is sawaal ke turant baad baat karungi. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides (1 miss) · board up · ready 1547 ms · guard uncorrected]: 26 m sahi nahi hai. Tumhare jod mein 3 m nahi juda. Khet ki paanchon bhujayein jodni hain. 8, 5, 7, 6 aur 3 ko ek-ek karke jodo. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 26 m  _(misconception)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) gave · board up · ready 4031 ms · guard ask,uncorrected]: 26 m sahi nahi hai. Pichhle sawaal ka jawab 29 m tha, kyunki paanchon bhujayein judti hain, 8 + 5 + 7 + 6 + 3 = 29 m. Haan, mujhe Virat pasand hai, woh bahut mehnati cricketer hain. Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 23 m  _(misconception)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 gave · board up · ready 4027 ms · guard ask,uncorrected]: 23 m sahi nahi hai. Pichhle sawaal ka jawab 30 m tha, kyunki kamre ki chhah bhujayein judti hain, 8 + 3 + 5 + 4 + 3 + 7 = 30 m. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3796 ms · guard long]: 40 cm sahi nahi hai. Yeh aayat 5 cm lamba aur 3 cm chauda hai. Kinaare par dhaaga lapeto, phir seedha karke scale par napo: woh parimap hai, cm mein. Andar tiles bichhao toh area hai. Parimap mein 5, 3, 5 aur 3 jodte hain, guna nahi karte. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2526 ms]: Parimap kinaare ka dhaaga hai, andar ki tiles nahi. Isliye 5, 3, 5 aur 3 ko jodo, guna mat karo. 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** 36 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 2517 ms]: 36 cm sahi nahi hai. Ribbon chaaron kinaaron par lagta hai. Lambai 9 cm do baar aati hai, aur chaudai 4 cm bhi do baar. 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** 36 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (2 miss) · board up · ready 2282 ms · guard uncorrected]: 36 cm sahi nahi hai. 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** 26 cm hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 3904 ms · guard ask]: Haan, sahi hai, kyunki ribbon kinaare par lagta hai, 9 + 4 + 9 + 4 = 26 cm. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"area-grid@1","params":{"w":9,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** 28 cm  _(correct)_

**Asha** [probe · beat s1:check:c2 · board up · ready 2716 ms · guard nowhy,flat]: Haan, sahi hai, kyunki lace kinaare par lagti hai, 10 + 4 + 10 + 4 = 28 cm. Riya, tumne 28 cm kaise nikala—kaun-kaun se kinaare jode?
  > screen: board area-grid@1 {"labels":"10 cm | 4 cm","numbers":"10 4 28"} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** thoda guess kiya, pakka nahi  _(no_evidence)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2331 ms]: Har bhuja jodna hamesha kaam karta hai. Is 6 cm lambe aur 4 cm chaude aayat mein lambai 6 cm do baar aati hai aur chaudai 4 cm bhi do baar, isliye agle hisse mein uska ek chhota tareeka dekhenge. Ab aage chalte hain.
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 5272 ms]: Is aayat mein upar aur neeche ki bhuja 10 m ki hai, yeh lambai hai. Daayein aur baayein ki bhuja 6 m ki hai, yeh chaudai hai. Aamne-saamne ki bhujayein barabar hain. Board par 10 m aur 6 m ek-ek baar likha hai, par kinaare par chalte hue lambai do baar aati hai aur chaudai bhi do baar. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 3863 ms · guard ask]: Toh is aayat ka parimap kitna hai?
  > card: Toh is aayat ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 3389 ms · guard flat,uncorrected]: 16 m sahi nahi hai. Cheenti aayat ke ek kone se meter lekar chalti hai. 14 m lambai ke baad meter 14, 6 m chaudai ke baad 20: sirf aadha raasta. Agli lambai aur chaudai ke baad 40 m. Cheenti chaar bhujayein chali, lambai + chaudai mein sirf do hain. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"14 m | 6 m","numbers":"14 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4228 ms · guard wrap]: Theek hai, Riya, tum thak gayi ho. Chuno: jaari rakhein, thoda viraam lein, ya aaj ke liye rok dein?
  > screen: board measured@1 {"labels":"20 m | 9 m","numbers":"20 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":20,"h":9}}

## Agent


