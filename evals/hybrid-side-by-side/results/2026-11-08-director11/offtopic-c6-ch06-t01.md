# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya! Main Asha, tumhari AI teacher. Aaj cricket ground ke boundary jaise perimeter (charon taraf ki lambai) dekhenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2433 ms]: Cricket pitch ek lamba rectangle hoti hai, lagbhag 20 m lambi aur 3 m chaudi. Pitch ke ek kone se chalna shuru karo, kinaare-kinaare chalo aur wapas usi kone par pahuncho, toh jitni doori tay hui, wahi pitch ka parimap hai. Achha, Riya. Pitch ke ek kone se boundary par chal kar wahi kone par lautna socho—kitni doori perimeter hogi?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 5052 ms · guard screen,mustsay]: Ek kone se chalo. Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 3799 ms · guard long,uncorrected]: 9 cm sahi nahi hai. A se shuru karke har bhuja ka naam aur lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2732 ms]: Virat ke cover drives ka timing waqai kamaal hai. Is baat par tumse is question ke turant baad baat karungi. Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > card: Paanch kono wale khet PQRST mein PQ 8 m, QR 5 m, RS 7 m, ST 6 m aur TP 3 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 m  _(correct)_

**Asha** [probe · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1225 ms]: Bilkul, Riya—tumne paanchon sides ko jodkar 29 m nikala, kyunki paanchon bhujayein judti hain, 8 + 5 + 7 + 6 + 3 = 29 m. Aur Virat ki baat: Virat Kohli India ke liye batting karte hain, aur unka cover drive bahut mashhoor hai. Ab batao, tumhe kaise pata chala ki perimeter nikalne ke liye sabhi sides jodni hain?
  > screen: board measured@1 {"labels":"8 m | 5 m | 7 m | 6 m | 3 m | P","numbers":"8 5 7 6 3"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** maine dhyan se dekh ke socha  _(incorrect)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2321 ms]: Theek, yeh tumhari soch thi. Aur pehle wale sawaal ka jawab 15 cm tha, kyunki teeno bhujayein judti hain, 4 + 5 + 6 = 15 cm. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1397 ms · guard mustsay]: Bilkul, Riya, kyunki hexagon ki chhah barabar bhujayein 5 cm ki hain, 6 × 5 = 30 cm. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2409 ms · guard mustsay]: Dhaaga sirf kinaare par chalta hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah area hai, use yahan nahi ginte. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2129 ms]: Arre Riya, cricket mein sixer maara—ball seedha boundary ke paar! Is baat par tumse is question ke turant baad baat karungi. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2616 ms · guard uncorrected]: 24 cm sahi nahi hai. Aur cricket ki baat: Cricket mein ek over mein chhe ball hoti hain, aur ek team mein gyarah khiladi. Yeh rectangle 5 cm lamba aur 3 cm chauda hai. Kinaare par dhaaga lapeto, phir seedha karke scale par napo: woh parimap hai, cm mein. Andar tiles bichhao toh area hai. Parimap mein 5, 3, 5 aur 3 jodte hain, guna nahi karte. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2094 ms]: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1359 ms]: Ribbon chaaron kinaaron par lagta hai. Lambai 9 cm do baar aati hai, aur chaudai 4 cm bhi do baar. 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"9 cm | 4 cm","numbers":"9 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2107 ms]: Dekho, yahi numbers ab patti par. 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 9 cm lambe aur 4 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board unrolled@1 {"sides":"4 sides laid in a straight line","lengths":"9 cm, 4 cm, 9 cm, 4 cm","total":"?","labels":"9 cm | 4 cm"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":4}}

**child:** 26 centimetres  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2663 ms · guard long,screenmismatch]: Haan, sahi hai, kyunki ribbon kinaare par lagta hai, 9 + 4 + 9 + 4 = 26 cm. Aur pehle wale sawaal ka jawab 20 cm tha, kyunki dhaaga kinaare par chalta hai, 6 + 4 + 6 + 4 = 20 cm. Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2388 ms]: Virat yaad hai, yeh part khatam karke uspar aate hain. Pehla kadam dekho. Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [reteach · ready 2941 ms]: Hindi mein? Zaroor. Riya, baad ki kul lambai nikalne ke liye teenon bhuja jodo: 7 m, 9 m aur 12 m. Kul kitne meter honge?

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3714 ms · guard invented,long]: Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2788 ms]: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 4294 ms · guard samecard]: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 3564 ms · guard level,uncorrected]: 16 m sahi nahi hai. 16 m mein teesri bhuja, 12 m, bhi jodo. Ikaai pehle jodo, phir dahaai. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 3051 ms · guard ask]: Bilkul sahi, Riya—tumne 16 m mein 12 m jodkar kul 28 m nikala, kyunki baad kinaare par chalti hai, aur teeno bhujayein 7 + 9 + 12 = 28 m judti hain, koi nahi chhooti. Toh poora jawab: kyari ke liye 28 m lambi baad lagegi. Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-aakaar kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 30 m  _(correct)_

**Asha** [probe · beat s1:check:c1 · board up · ready 1463 ms]: Haan, sahi hai, kyunki kamre ki chhah bhujayein judti hain, 8 + 3 + 5 + 4 + 3 + 7 = 30 m. 30 m sahi hai, Riya. Ab batao, tumhe kaise pata chala ki parimap nikalne ke liye sabhi bhujayein jodni hain?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** jaise aapne samjhaya tha, waise hi kiya  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 3429 ms · guard affirms,ask]: Theek hai. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** mujhe lagta hai 28 cm  _(correct)_

**Asha** [repair · beat s1:check:c2 · board up · ready 2568 ms]: Haan, sahi hai, kyunki lace kinaare par lagti hai, 10 + 4 + 10 + 4 = 28 cm. Har bhuja jodna hamesha kaam karta hai. Is 6 cm lambe aur 4 cm chaude aayat mein lambai 6 cm do baar aati hai aur chaudai 4 cm bhi do baar, isliye agle hisse mein uska ek chhota tareeka dekhenge. Chalo, ab aage.
  > screen: board area-grid@1 {"labels":"10 cm | 4 cm","numbers":"10 4 28"} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2775 ms]: Is aayat mein upar aur neeche ki bhuja 10 m ki hai, yeh lambai hai. Daayein aur baayein ki bhuja 6 m ki hai, yeh chaudai hai. Aamne-saamne ki bhujayein barabar hain. Board par 10 m aur 6 m ek-ek baar likha hai, par kinaare par chalte hue lambai do baar aati hai aur chaudai bhi do baar. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 3452 ms · guard mustsay,ask]: Aamne-saamne ki bhujayein barabar hain. Kinaare par chalte hue 10 m do baar aata hai, aur 6 m bhi do baar. Toh is aayat ka parimap kitna hai?
  > card: Toh is aayat ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 4168 ms · guard flat]: 16 m sahi nahi hai. Cheenti aayat ke ek kone se meter lekar chalti hai. 14 m lambai ke baad meter 14, 6 m chaudai ke baad 20: sirf aadha raasta. Agli lambai aur chaudai ke baad 40 m. Cheenti chaar bhujayein chali, lambai + chaudai mein sirf do hain. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"14 m | 6 m","numbers":"14 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":14,"h":6,"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 4286 ms · guard ask]: Cheenti chaar bhujayein chalti hai. 14 m aur 6 m ke baad woh sirf aadhe raaste par hai, 20 m. Poora chakkar 40 m hai. Cheenti 20 m lambe aur 9 m chaude aayat khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > card: Cheenti 20 m lambe aur 9 m chaude aayat khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > screen: board measured@1 {"labels":"20 m | 9 m","numbers":"20 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":20,"h":9}}

**child:** 58 m hai na  _(correct)_

**Asha** [probe · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2437 ms]: Haan, sahi hai, kyunki poore chakkar mein do lambai aur do chaudai hain, 2 × (20 + 9) = 58 m. : 20 + 9 + 20 + 9 = 58 m. Tumne yeh kaise socha?
  > screen: board measured@1 {"labels":"20 m | 9 m","numbers":"20 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":20,"h":9}}

**child:** jo aapne dikhaya tha, usse socha  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 5712 ms · guard affirms,mustsay]: Tumne do lambai aur do chaudai pehchaani—sahi. Aur pehle wale sawaal ka jawab 32 m tha, kyunki kinaare par lambai do baar aur chaudai do baar aati hai, 10 + 6 + 10 + 6 = 32 m. Yeh aayat 12 m lamba aur 5 m chauda hai. Neeche baayein kone se chalo: 12 m lambai, phir 5 m chaudai, aur tum saamne wale kone par ho. Yeh sirf aadha raasta hai. Baaki aadha raasta bhi utna hi hai. Isliye aayat ka parimap = 2 × (lambai + chaudai). Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 4078 ms · guard long,ask]: Ek kone se 12 m aur phir 5 m chalo, yeh aadha raasta hai. Baaki aadha bhi utna hi hai, isliye 2 × (lambai + chaudai). Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 2104 ms · guard uncorrected]: 17 m sahi nahi hai. Ek kone se 12 m aur phir 5 m chalo, yeh aadha raasta hai. Baaki aadha bhi utna hi hai, isliye 2 × (lambai + chaudai). Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Is aayat ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 2784 ms]: Theek hai, Riya. Aaj ke liye teen vikalp hain: jaari rakhein, thodi der rukhein, ya aaj yahin samaapt karein. Tum kya chunogi?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

## Agent


