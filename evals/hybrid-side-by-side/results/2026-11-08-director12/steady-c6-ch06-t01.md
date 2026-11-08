# steady-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj cricket ground ki boundary jaise shapes ka perimeter padhenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2334 ms]: Cricket pitch ek lamba rectangle hoti hai, lagbhag 20 m lambi aur 3 m chaudi. Pitch ke ek kone se chalna shuru karo, kinaare-kinaare chalo aur wapas usi kone par pahuncho, toh jitni doori tay hui, wahi pitch ka parimap hai. Achha, Riya. Pitch ke kinaare-kinaare ek kone se chal kar wahi kone lautna socho—yeh poori doori kya kehlaayegi?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3500 ms · guard screen,mustsay]: Ek kone se chalo. Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1474 ms]: Bilkul, Riya—tumne teenon sides, 4, 5 aur 6, ko jodkar 15 cm nikala, kyunki teeno bhujayein judti hain, 4 + 5 + 6 = 15 cm. Ab batao, tumhe kaise pata chala ki in teenon ko jodna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** maine dono ko mila ke dekha  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 3000 ms]: Achha, ab samajh aaya tumne kaise socha. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2758 ms]: Hexagon ki chhah bhujayein sab barabar hain, har ek 5 cm. Label ek par hai, par parimap mein har bhuja judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2381 ms]: A se shuru karke har bhuja ka naam aur lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"],"trace":true}}

**child:** 5 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 4094 ms · guard flat,uncorrected]: 5 cm sahi nahi hai. A se shuru karke har bhuja ka naam aur lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2392 ms]: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3341 ms · guard flat]: Dekho, yahi numbers ab patti par. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board unrolled@1 {"shape":"5-sided shape","sides":"5 sides laid in a straight line","lengths":"8 m, 5 m, 7 m, 6 m, 3 m","total":"?","labels":"8 m | 5 m | 7 m | 6 m | 3 m"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 metre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1701 ms · guard mustsay]: Sahi, Riya—tumne kinaare ki paanchon lambai jodi: 8 + 5 + 7 + 6 + 3 = 29 m, kyunki paanchon bhujayein judti hain, 8 + 5 + 7 + 6 + 3 = 29 m. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2525 ms]: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2258 ms · guard uncorrected]: 24 cm sahi nahi hai. Yeh rectangle 5 cm lamba aur 3 cm chauda hai. Kinaare par dhaaga lapeto, phir seedha karke scale par napo: woh parimap hai, cm mein. Andar tiles bichhao toh area hai. Parimap mein 5, 3, 5 aur 3 jodte hain, guna nahi karte. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3090 ms]: Theek hai, Riya. Ab rectangle ke kinaare ki poori lambai nikalne ka tareeka khud lagao. 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 3360 ms · guard praise,affirms]: 9 cm aur 4 cm ke chaar kinaare likho, phir unhe jodo. Tumhara hisaab kya aata hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** 26 cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1195 ms · guard screenmismatch]: Haan, sahi hai, kyunki ribbon kinaare par lagta hai, 9 + 4 + 9 + 4 = 26 cm. Ek triangle shape ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Chalo, aage dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"area-grid@1","params":{"w":9,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2503 ms]: Cricket ke baare mein is sawaal ke baad baat karenge, pakka. Pehla kadam dekho. Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2278 ms · guard invented]: Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [reteach · ready 2302 ms]: Achha, ab Hindi mein baat karte hain. Ab teesri bhuja jodo: 16 m mein 12 m milao. Kul parimap kitna aayega?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2173 ms]: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 2146 ms]: 16 m sahi nahi hai. 16 m mein teesri bhuja, 12 m, bhi jodo. Ikaai pehle jodo, phir dahaai. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 4331 ms · guard ask]: Haan, sahi hai, kyunki baad kinaare par chalti hai, aur teeno bhujayein 7 + 9 + 12 = 28 m judti hain, koi nahi chhooti. Toh poora jawab: kyari ke liye 28 m lambi baad lagegi. Aur cricket ki baat: tumhe cricket pasand hai: yeh sunke bahut achha laga. Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 30 m  _(correct)_

**Asha** [probe · beat s1:check:c1 · board up · ready 1331 ms · guard noconfirm]: Haan, sahi hai, kyunki kamre ki chhah bhujayein judti hain, 8 + 3 + 5 + 4 + 3 + 7 = 30 m. Riya, tumne chhah bhujayein jodi—8 + 3 + 5 + 4 + 3 + 7. Tumhe 30 m kaise mila?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7],"trace":true}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 4312 ms · guard ask]: Theek hai. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 40 cm  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 3930 ms · guard flat,uncorrected]: 40 cm sahi nahi hai. Lace chaaron bhujaon par lagegi. 10 cm, 4 cm, 10 cm aur 4 cm, chaaron ko jodo. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 cm hai na  _(correct)_

**Asha** [repair · beat s1:check:c2 · board up · ready 2555 ms]: Haan, sahi hai, kyunki lace kinaare par lagti hai, 10 + 4 + 10 + 4 = 28 cm. Har bhuja jodna hamesha kaam karta hai. Is 6 cm lambe aur 4 cm chaude aayat mein lambai 6 cm do baar aati hai aur chaudai 4 cm bhi do baar, isliye agle hisse mein uska ek chhota tareeka dekhenge. Ab agla hissa.
  > screen: board area-grid@1 {"labels":"10 cm | 4 cm","numbers":"10 4 28"} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 4161 ms · guard mustsay,long]: Is aayat mein upar aur neeche ki bhuja 10 m ki hai, yeh lambai hai. Daayein aur baayein ki bhuja 6 m ki hai, yeh chaudai hai. Aamne-saamne ki bhujayein barabar hain. Board par 10 m aur 6 m ek-ek baar likha hai, par kinaare par chalte hue lambai do baar aati hai aur chaudai bhi do baar. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 3920 ms · guard ask]: Toh is aayat ka parimap kitna hai?
  > card: Toh is aayat ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 1648 ms · guard noconfirm]: Haan, sahi hai, kyunki kinaare par lambai do baar aur chaudai do baar aati hai, 10 + 6 + 10 + 6 = 32 m. Ab batao, tumne 10 aur 6 ko do-do baar kyun joda?
  > screen: board area-grid@1 {"labels":"10 m | 6 m","numbers":"10 6 32"} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2241 ms · guard mustsay]: Theek hai. Yeh aayat 12 m lamba aur 5 m chauda hai. Neeche baayein kone se chalo: 12 m lambai, phir 5 m chaudai, aur tum saamne wale kone par ho. Yeh sirf aadha raasta hai. Baaki aadha raasta bhi utna hi hai. Isliye aayat ka parimap = 2 × (lambai + chaudai). Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 3788 ms · guard ask]: Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 3031 ms · guard mustsay,ask]: Sahi, 2 × (12 + 5) = 34 m, kyunki 2 × (12 + 5) = 2 × 17 = 34 m. Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Toh is varg ka parimap kitna hai?
  > card: Toh is varg ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm","numbers":"6"} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** 24 cm  _(correct)_

**Asha** [probe · beat s2:explain:e3 · board up · ready 1751 ms]: Sahi, Riya—4 × 6 = 24 cm, kyunki varg ki chaaron bhujayein 6 cm ki hain, 4 × 6 = 24 cm. Ab batao, tumne chaar se guna kyun kiya?
  > screen: board area-grid@1 {"labels":"6 cm","numbers":"6 24"} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** maine dono ko mila ke dekha  _(incorrect)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 5334 ms · guard quiz,invented,long,screenmismatch]: Theek, yeh tumhari soch thi. Ek aayat notebook cover 24 cm lamba aur 18 cm chauda hai. Iske kinaare par ek baar tape lagani hai. Kitni tape lagegi? Diya hai: cover aayat aakaar ka hai, lambai 24 cm hai, chaudai 18 cm hai. Dhoondhna hai: tape ki lambai, yaani cover ka parimap. Chalo, aage dekhte hain.
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2791 ms]: Pehla kadam dekho. Tape kinaare par lagti hai aur cover aayat hai, toh parimap 2 × (lambai + chaudai) se nikalo: P = 2 × (24 + 18), kyunki kinaare par lambai do baar aati hai aur chaudai bhi do baar. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 4102 ms · guard quiz]: Ab doosra kadam. Pehle bracket mein ek lambai aur ek chaudai jodo: 24 + 18 = 42 cm, kyunki 42 cm sirf aadha kinaara hai, ek kone se saamne wale kone tak. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 2349 ms]: Ab is aadhe kinaare ko do baar lo. 2 × 42 kitna hota hai?
  > card: Ab is aadhe kinaare ko do baar lo. 2 × 42 kitna hota hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 84 centimetre  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch06-t01-s2:c1 · board up · ready 3327 ms · guard ask]: Haan, sahi hai, kyunki poora kinaara 2 × 42 = 84 cm hai, aur 42 cm sirf aadha kinaara tha. Toh poora jawab: cover par 84 cm tape lagegi. Ek aayat playground 40 m lamba aur 25 m chauda hai. Iska parimap kitna hai?
  > card: Ek aayat playground 40 m lamba aur 25 m chauda hai. Iska parimap kitna hai?
  > screen: board measured@1 {"labels":"40 m | 25 m","numbers":"40 25"} · ref {"template":"area-grid@1","params":{"w":24,"h":18,"mode":"perimeter","unit":"cm"}}

**child:** mujhe lagta hai 130 m  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 · board up · ready 4082 ms · guard ask]: Sahi, Riya—tumne parimap ke liye lambai aur chaudai ka yog do baar liya: 130 m, kyunki 2 × (40 + 25) = 2 × 65 = 130 m. Ek aayat table mat 9 cm lamba aur 5 cm chauda hai. Iske kinaare par ek baar lace silni hai. Kitni lace chahiye?
  > card: Ek aayat table mat 9 cm lamba aur 5 cm chauda hai. Iske kinaare par ek baar lace silni hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"9 cm | 5 cm","numbers":"9 5"} · ref {"template":"area-grid@1","params":{"w":40,"h":25,"mode":"perimeter","unit":"m"}}

**child:** 28 centimetre  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 · board up · ready 3057 ms · guard screen,ask]: Haan, sahi hai, kyunki lace kinaare par silti hai, 2 × (9 + 5) = 2 × 14 = 28 cm. Ek varg tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > card: Ek varg tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > screen: board measured@1 {"labels":"11 cm","numbers":"11"} · ref {"template":"area-grid@1","params":{"w":9,"h":5,"mode":"perimeter","unit":"cm"}}

**child:** 44  _(correct)_

**Asha** [repair · beat s2:check:c3 · board up · ready 2944 ms · guard level]: Haan, sahi hai, kyunki varg ki chaaron bhujayein 11 cm ki hain, 4 × 11 = 44 cm. Ab tak humne bhujaon se parimap nikala. Agle hisse mein ulta chalenge, parimap se bhuja nikalenge, aur chakkar aur baad ka kharcha bhi. Ab agla hissa.
  > screen: board area-grid@1 {"labels":"11 cm","numbers":"11 44"} · ref {"template":"area-grid@1","params":{"w":11,"h":11,"mode":"perimeter","unit":"cm"}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4466 ms · guard wrap]: Theek hai Riya, tum thak gayi ho—maine suna. Chun lo: aage badhna, thodi der rukna, ya aaj ke liye rokna?
  > screen: board shape@1 {"labels":"parimap | 60 m","numbers":"60"} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

## Agent


