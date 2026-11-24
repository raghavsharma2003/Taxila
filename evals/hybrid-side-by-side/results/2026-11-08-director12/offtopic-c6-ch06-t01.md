# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj cricket ground ki boundary jaise shapes ka perimeter nikaalenge. Tumhe cricket mein batting ya bowling pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2557 ms]: Cricket pitch ek lamba rectangle hoti hai, lagbhag 20 m lambi aur 3 m chaudi. Pitch ke ek kone se chalna shuru karo, kinaare-kinaare chalo aur wapas usi kone par pahuncho, toh jitni doori tay hui, wahi pitch ka parimap hai. Achha, Riya.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2813 ms · guard mustsay]: Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetre  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1385 ms · guard noconfirm]: Haan, sahi hai, kyunki teeno bhujayein judti hain, 4 + 5 + 6 = 15 cm. Batao, tumne perimeter nikalne ke liye teeno sides ko joda—yeh kyun kaam karta hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** thoda guess kiya, pakka nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2381 ms]: Theek hai. Guess nahi—perimeter mein boundary ki har bhuja judti hai. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 3950 ms · guard mustsay,flat]: Haan, sahi hai, kyunki hexagon ki chhah barabar bhujayein 5 cm ki hain, 6 × 5 = 30 cm. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2403 ms]: Arre wah Riya, cricket mein sixer maara! Iska celebration is question ke turant baad karenge—ab pehle card wala maths karte hain. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1181 ms]: Haan, sahi hai, kyunki dhaaga kinaare par chalta hai, 6 + 4 + 6 + 4 = 20 cm. Ek triangle shape ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Ab isse aage chalte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2611 ms]: Pehla kadam dekho. Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2204 ms]: Virat yaad rahega; yeh sawaal khatam karke uspar aate hain. Ab doosra kadam. Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Chalo, aage dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2490 ms]: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 3576 ms · guard flat,uncorrected]: 16 m sahi nahi hai. A se shuru karke har bhuja ka naam aur lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2239 ms]: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1288 ms]: Khet ki paanchon bhujayein jodni hain. 8, 5, 7, 6 aur 3 ko ek-ek karke jodo. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2424 ms]: Dekho, yahi numbers ab patti par. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board unrolled@1 {"shape":"5-sided shape","sides":"5 sides laid in a straight line","lengths":"8 m, 5 m, 7 m, 6 m, 3 m","total":"?","labels":"8 m | 5 m | 7 m | 6 m | 3 m"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 metres  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1962 ms]: Bilkul sahi, Riya—tumne paanchon sides ko jodkar perimeter nikala, kyunki paanchon bhujayein judti hain, 8 + 5 + 7 + 6 + 3 = 29 m. Aur cricket ki baat: kal tumne cricket khela, sixer maara: yeh sunke bahut achha laga. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3600 ms · guard ask]: Zaroor. Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 30 m hai na  _(correct)_

**Asha** [probe · beat s1:check:c1 · board up · ready 2325 ms]: Haan, sahi hai, kyunki kamre ki chhah bhujayein judti hain, 8 + 3 + 5 + 4 + 3 + 7 = 30 m. 30 m sahi hai: parimap ke liye band aakaar ki sabhi bhujayein jodi jaati hain—8, 3, 5, 4, 3 aur 7 m. Tumne kaise jaana ki yeh poora kinaara hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7],"trace":true}}

**child:** maine pehle chhota wala socha, phir bada  _(no_evidence · easier)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 gave · board up · ready 4529 ms · guard ask]: Pichhle sawaal ka jawab 30 m tha. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7],"trace":true}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2377 ms]: Haan Riya, pehle tum try karo. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3765 ms · guard flat,uncorrected]: 40 cm sahi nahi hai. Yeh aayat 5 cm lamba aur 3 cm chauda hai. Kinaare par dhaaga lapeto, phir seedha karke scale par napo: woh parimap hai, cm mein. Andar tiles bichhao toh area hai. Parimap mein 5, 3, 5 aur 3 jodte hain, guna nahi karte. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3258 ms]: Tumhe cricket pasand hai—sixer aur boundaries wali baat yaad hai. Is card ke baad cricket par zaroor lautenge. 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** mujhe lagta hai 26 cm  _(correct)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2380 ms]: Haan, sahi hai, kyunki ribbon kinaare par lagta hai, 9 + 4 + 9 + 4 = 26 cm. Har bhuja jodna hamesha kaam karta hai. Is 6 cm lambe aur 4 cm chaude aayat mein lambai 6 cm do baar aati hai aur chaudai 4 cm bhi do baar, isliye agle hisse mein uska ek chhota tareeka dekhenge. Aur Virat ki baat: tumne mujhse Virat ke baare mein poocha tha; lesson ke baad mujhe Virat ke baare mein aur batana. Ab agla hissa.
  > screen: board area-grid@1 {"labels":"9 cm | 4 cm","numbers":"9 4 26"} · ref {"template":"area-grid@1","params":{"w":9,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2531 ms]: Is aayat mein upar aur neeche ki bhuja 10 m ki hai, yeh lambai hai. Daayein aur baayein ki bhuja 6 m ki hai, yeh chaudai hai. Aamne-saamne ki bhujayein barabar hain. Board par 10 m aur 6 m ek-ek baar likha hai, par kinaare par chalte hue lambai do baar aati hai aur chaudai bhi do baar. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 4215 ms · guard ask]: Toh is aayat ka parimap kitna hai?
  > card: Toh is aayat ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** mujhe lagta hai 32 m  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 2224 ms]: Haan, sahi hai, kyunki kinaare par lambai do baar aur chaudai do baar aati hai, 10 + 6 + 10 + 6 = 32 m. Riya, 32 m sahi hai—tumne 10 m ki do lambai aur 6 m ki do chaudai jodi. Tumne yeh kaise jaana ki dono ko do-do baar lena hai?
  > screen: board area-grid@1 {"labels":"10 m | 6 m","numbers":"10 6 32"} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** shayad gin ke  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2698 ms · guard mustsay]: Theek hai. Aur cricket ki baat: tumhe cricket pasand hai: yeh sunke bahut achha laga. Yeh aayat 12 m lamba aur 5 m chauda hai. Neeche baayein kone se chalo: 12 m lambai, phir 5 m chaudai, aur tum saamne wale kone par ho. Yeh sirf aadha raasta hai. Baaki aadha raasta bhi utna hi hai. Isliye aayat ka parimap = 2 × (lambai + chaudai). Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 4379 ms · guard long]: Ek kone se 12 m aur phir 5 m chalo, yeh aadha raasta hai. Baaki aadha bhi utna hi hai, isliye 2 × (lambai + chaudai). Ab isi par ek sawaal.
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 2774 ms]: Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34 m hai na  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 2570 ms]: Haan, sahi hai, kyunki 2 × (12 + 5) = 2 × 17 = 34 m. Tumne 2 × (12 + 5) lagaya.
  > screen: board area-grid@1 {"labels":"12 m | 5 m","numbers":"12 5 34"} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** woh toh ho gaya na  _(no_evidence)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 5058 ms · guard long,ask]: Theek hai. Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Toh is varg ka parimap kitna hai?
  > card: Toh is varg ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** mujhe lagta hai 24 cm  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 2526 ms · guard invented,screenmismatch]: Haan, sahi hai, kyunki varg ki chaaron bhujayein 6 cm ki hain, 4 × 6 = 24 cm. Ek aayat notebook cover 24 cm lamba aur 18 cm chauda hai. Iske kinaare par ek baar tape lagani hai. Kitni tape lagegi? Diya hai: cover aayat aakaar ka hai, lambai 24 cm hai, chaudai 18 cm hai. Dhoondhna hai: tape ki lambai, yaani cover ka parimap. Ab isse aage chalte hain.
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2612 ms]: Pehla kadam dekho. Tape kinaare par lagti hai aur cover aayat hai, toh parimap 2 × (lambai + chaudai) se nikalo: P = 2 × (24 + 18), kyunki kinaare par lambai do baar aati hai aur chaudai bhi do baar. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · ready 5061 ms · guard content_filter_rewrite]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


