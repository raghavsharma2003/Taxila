# steady-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj cricket pitch ke around boundary, yaani perimeter, naapenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 3045 ms]: Tumne idea pakda: perimeter boundary ke poore edge ka distance hota hai. Pitch ke ek kone se chalna shuru karke, kahan lautoge?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2192 ms]: Ek kone se chalo. Is triangle ki teen bhujayein hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo, teeno bhujaon se hote hue wapas usi kone par aao. Yeh poora raasta hi triangle ka parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1388 ms · guard screenmismatch]: Haan, sahi hai. Haan Riya, tumne teenon sides ko jodkar 15 cm nikala—poora boundary ek baar cover hui.
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2503 ms]: Perimeter matlab kinaare ki sabhi bhujayein jodna. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Baaki bhujaon par kuch likha nahi hai, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja ki lambai judti hai. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1603 ms · guard mustsay,noconfirm]: Haan, sahi hai. Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 centimetres  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 6179 ms · guard invented,long,screenmismatch]: Haan, sahi hai. Ek triangle shape ki phoolon ki kyari hai. Iski bhujayein 7 m, 9 m aur 12 m hain. Kyari ke kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi? Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Dhoondhna hai: baad ki lambai, yaani kyari ka parimap. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 5561 ms · guard invented]: Baad kinaare par lagti hai, toh teeno bhujayein jodo: P = 7 + 9 + 12, kyunki koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 3954 ms · guard affirms,quiz]: Ab 7 plus 9 ko pehle jodo: 16. Pehle do bhujayein jodo: 7 + 9 = 16 m, kyunki ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2164 ms]: Screen par triangle dekho: teen kinaare 7 m, 9 m, 12 m hain. Ab 7 m aur 9 m wale kinaare pehle jodne hain. Unka yog kitna hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2367 ms]: Tum keh rahi ho ki pehle do bhujayein jodne wala kadam samajh aa gaya. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 metres  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1443 ms]: Sahi, 16 m mein 12 m jodkar tumne poora parimap 28 m nikala. Toh poora jawab: kyari ke liye 28 m lambi baad lagegi, kyunki baad kinaare par chalti hai aur teeno bhujayein judi hain, koi nahi chhooti, aur yeh lambai hai, isliye metre mein. Yaad karo: Yeh rectangle 6 cm lamba aur 4 cm chauda hai. Parimap ek dhaage jaisa hai jo kinaare par chalta hai: upar 6 cm, phir 4 cm, neeche 6 cm, phir 4 cm. Andar ki jagah area hai, woh bilkul alag cheez hai. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | ? m | 3 m | ? m","numbers":"8 3 5"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 23 m  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3721 ms · guard long,uncorrected]: 23 m sahi nahi hai. Is khet ke kono ke naam A se F tak hain. A se shuru karo, aur har bhuja ka naam aur uski lambai bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, aur aakhir mein FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Khet ABCDEF mein AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m aur FA 9 m hai. Khet ka parimap kitna hai?
  > card: Khet ABCDEF mein AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m aur FA 9 m hai. Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 4 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"],"trace":true}}

**child:** 38  _(correct)_

**Asha** [probe · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 1673 ms]: Haan, sahi hai. Riya, 38 m sahi hai: tumne chheyon bhujayein jodi—10 + 4 + 6 + 5 + 4 + 9. Ab batao, tumhe kaise pata ki yahi poora parimap hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 4 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"]}}

**child:** mujhe khud try karne do  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3816 ms · guard nowhy,long]: Theek hai Riya, pehle tum khud try karogi. Ab batao, tumhe kaise pata chala ki parimap 38 m hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 4 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"m","sides":[10,4,6,5,4,9],"names":["A","B","C","D","E","F"]}}

**child:** kyunki hisse barabar the, maine wahi dekha  _(incorrect)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2667 ms]: Aur pehle wale sawaal ka jawab 30 m tha. Tumne sabhi kinaaron ki lambai dekhi aur unhe joda—isi se poora parimap milta hai. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | ? cm","numbers":"10"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [repair · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2605 ms]: Cricket mein boundary ke chaar sides hoti hain. Is card ke edges 10, 4, 10, 4 cm hain—sabko jodkar lace kitni hogi? Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | ? cm","numbers":"10"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 cm hai na  _(correct)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2321 ms · guard mustsay]: Haan, sahi hai. Is rectangle mein upar aur neeche ki bhuja 10 m ki hai, yeh lambai hai. Daayein aur baayein ki bhuja 6 m ki hai, yeh chaudai hai. Aamne-saamne ki bhujayein barabar hain. Board par 10 m aur 6 m ek-ek baar likha hai, par kinaare par chalte hue lambai do baar aati hai aur chaudai bhi do baar. Toh is rectangle ka parimap kitna hai?
  > card: Toh is rectangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2175 ms]: Achha, ab Hindi mein baat karte hain. Haan, Riya. Aamne-saamne ki bhujayein barabar hoti hain; parimap ke liye chaaron kinaaron ki lambai jodni hoti hai. Toh is rectangle ka parimap kitna hai?
  > card: Toh is rectangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2663 ms · guard uncorrected]: 16 m sahi nahi hai. Ek cheenti is rectangle ke ek kone se chalti hai, uske paas ek meter hai. 14 m lambai ke baad meter 14 dikhata hai, 6 m chaudai ke baad 20. Ab woh sirf saamne wale kone par hai, aadhe raaste par. Agli lambai ke baad 34, aur aakhri chaudai ke baad 40 m, wapas shuru wale kone par. Cheenti chaar bhujayein chali, lambai + chaudai mein sirf do judti hain. Cheenti 20 m lambe aur 9 m chaude rectangle khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > card: Cheenti 20 m lambe aur 9 m chaude rectangle khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > screen: board measured@1 {"labels":"14 m | 6 m","numbers":"14 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":14,"h":6,"trace":true}}

**child:** 29 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 2157 ms]: 29 m sahi nahi hai. Poore chakkar mein 20 m ki lambai do baar aur 9 m ki chaudai do baar jodni hai. Ab jodkar batao, meter kya dikhayega? Cheenti 20 m lambe aur 9 m chaude rectangle khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > card: Cheenti 20 m lambe aur 9 m chaude rectangle khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > screen: board measured@1 {"labels":"20 m | 9 m","numbers":"20 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":20,"h":9}}

**child:** 58 m hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 2147 ms · guard mustsay]: Haan, sahi hai. Aur pehle wale sawaal ka jawab 32 m tha. Yeh rectangle 12 m lamba aur 5 m chauda hai. Neeche baayein kone se chalo: 12 m lambai, phir 5 m chaudai, aur tum saamne wale kone par ho. Yeh sirf aadha raasta hai. Baaki aadha raasta bhi utna hi hai. Isliye rectangle ka parimap = 2 × (lambai + chaudai). Is rectangle ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Is rectangle ki lambai 12 m aur chaudai 5 m hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34 m  _(correct)_

**Asha** [probe · beat s2:explain:e2 · board up · ready 2456 ms · guard nowhy,flat]: Haan, sahi hai. 34 m sahi. Tumne 12 aur 5 ko jodkar do baar kyon liya?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** shayad hisse gin ke  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 5010 ms · guard long,noconfirm]: Haan, sahi hai. Yeh square hai. Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Toh is square ka parimap kitna hai?
  > card: Toh is square ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 36 cm  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 4637 ms · guard long,screenmismatch,uncorrected]: 36 cm sahi nahi hai. Yeh rectangle 7 cm lamba aur 3 cm chauda hai. Andar 1 cm ke tiles bichhao toh 7 × 3 = 21 tiles aate hain, woh area hai, square cm mein. Dhaaga kinaare par chalta hai, toh 7, 3, 7 aur 3 ko jodna hai, aur jawab cm mein aata hai. 8 cm lambe aur 2 cm chaude bookmark ke kinaare par ek baar dhaaga lagta hai. Dhaaga kitna lamba hai?
  > card: 8 cm lambe aur 2 cm chaude bookmark ke kinaare par ek baar dhaaga lagta hai. Dhaaga kitna lamba hai?
  > screen: board measured@1 {"labels":"7 cm | 3 cm","numbers":"7 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":7,"h":3,"trace":true}}

**child:** 20  _(correct)_

**Asha** [probe · beat s2:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1632 ms]: Sahi, Riya: 8 aur 2 dono do-do baar aate hain, isliye 8 + 2 + 8 + 2 karke 20 cm. Ab batao, is tareeke se tumhe kaise pata chala?
  > screen: board measured@1 {"labels":"8 cm | 2 cm","numbers":"8 2"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":8,"h":2}}

**child:** jodte jodte aaya  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 2807 ms · guard screenmismatch]: Haan, sahi hai. Aur pehle wale sawaal ka jawab 24 cm tha. Ek rectangle notebook cover 24 cm lamba aur 18 cm chauda hai. Iske kinaare par ek baar tape lagani hai. Kitni tape lagegi? Diya hai: cover rectangle shape ka hai, lambai 24 cm hai, chaudai 18 cm hai. Dhoondhna hai: tape ki lambai, yaani cover ka parimap. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2819 ms]: Haan, itna hissa theek hai: rectangle, 24 cm lambai aur 18 cm chaudai. Tape kinaare par lagti hai aur cover rectangle hai, toh parimap 2 × (lambai + chaudai) se nikalo: P = 2 × (24 + 18), kyunki kinaare par lambai do baar aati hai aur chaudai bhi do baar. Ab tak samajh aaya?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 5240 ms · guard invented,long]: 24 aur 18 ko jodo. Pehle bracket mein ek lambai aur ek chaudai jodo: 24 + 18 = 42 cm, kyunki 42 cm sirf aadha kinaara hai, ek kone se saamne wale kone tak. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 3855 ms]: Ab aadha kinaara 42 cm hai. Poore parimap ke liye ise do baar lena hai. Ab is aadhe kinaare ko do baar lo. 2 × 42 kitna hota hai?
  > card: Ab is aadhe kinaare ko do baar lo. 2 × 42 kitna hota hai?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** 84  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c6-maths-ch06-t01-s2:c1 · board up · ready 1365 ms]: Bilkul sahi, Riya: tumne 42 ko do baar lekar 84 cm nikala. Toh poora jawab: cover par 84 cm tape lagegi, kyunki chaaron bhujayein jodne par bhi 24 + 18 + 24 + 18 = 84 cm aata hai, jabki 42 cm sirf aadha kinaara hai aur 24 × 18 andar ka area hota. Yaad karo: Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Ek rectangle playground 40 m lamba aur 25 m chauda hai. Iska parimap kitna hai?
  > card: Ek rectangle playground 40 m lamba aur 25 m chauda hai. Iska parimap kitna hai?
  > screen: board measured@1 {"labels":"? m | 25 m","numbers":"25"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":40,"h":25}}

**child:** 130 m  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c6-maths-ch06-t01-s2:c2 · board up · ready 1484 ms]: Bilkul sahi, Riya: tumne lambai aur chaudai ko do-do baar lekar 130 m nikala. Yaad karo: Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Ek rectangle table mat 9 cm lamba aur 5 cm chauda hai. Iske kinaare par ek baar lace silni hai. Kitni lace chahiye?
  > card: Ek rectangle table mat 9 cm lamba aur 5 cm chauda hai. Iske kinaare par ek baar lace silni hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"9 cm | 5 cm","numbers":"9 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":9,"h":5}}

**child:** 28 cm  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 · board up · ready 3175 ms · guard screen]: Bilkul sahi, Riya: tumne 9 aur 5 ko do-do baar jodkar 28 cm nikala. Yaad karo: Yeh square hai. Iski chaaron bhujayein 6 cm ki hain, sab barabar. Chaar baar 6 cm jodne ki jagah seedha 4 × bhuja kar sakte ho. Jawab ek lambai hai, isliye cm mein aayega, square cm mein nahi. Ek square tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > screen: board measured@1 {"labels":"11 cm | 11 cm","numbers":"11"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":11,"h":11}}

**child:** 121 cm  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c6-maths-ch06-t01-s2:c3 (1 miss) · board up · ready 4260 ms · guard script,uncorrected]: 121 cm sahi nahi hai. 121 cm andar ka area hota hai: 11 guna 11. Square ka parimap chaar barabar bhujayein jodkar milta hai. 11 ko chaar baar jodo. Kitna? Ek square tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > card: Ek square tile ki bhuja 11 cm hai. Iska parimap kitna hai?
  > screen: board measured@1 {"labels":"11 cm | 11 cm","numbers":"11"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":11,"h":11}}

**child:** mujhe lagta hai 44 cm  _(correct)_

**Asha** [explain · beat s3:explain:e1 · check script:c6-maths-ch06-t01-s3:ask:e1 · board up · ready 4353 ms · guard long]: Haan, sahi hai. Is square ka parimap 60 m hai, aur yeh 60 m chaar barabar bhujaon mein bata hua hai. Isliye ek bhuja nikalne ke liye parimap ko 4 se bhaag karte hain, 2 se nahi. Toh is square ki ek bhuja kitni lambi hai?
  > card: Toh is square ki ek bhuja kitni lambi hai?
  > screen: board shape@1 {"labels":"parimap 60 m","numbers":"60"} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** 15  _(correct)_

**Asha** [probe · beat s3:explain:e1 · board up · ready 3250 ms · guard nowhy,flat]: Haan, sahi hai. Riya, tumne 60 m ko 4 se bhaag karke 15 m nikala. Tumhe kaise pata chala ki 4 se bhaag karna hai?
  > screen: board shape@1 {"labels":"parimap 60 m","numbers":"60"} · ref {"template":"shape@1","params":{"shape":"square","name":"parimap 60 m"}}

**child:** kyunki hisse barabar the, maine wahi dekha  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c6-maths-ch06-t01-s3:ask:e2 · board up · ready 3179 ms · guard mustsay]: Bilkul: tumne dekha ki square ke 4 barabar hisse hain, isliye parimap ko 4 se bhaag kiya. Is rectangle ka parimap 60 m hai aur lambai 20 m. Aadha parimap, yaani 30 m, ek lambai aur ek chaudai ke barabar hota hai. Isliye chaudai ke liye 30 m mein se lambai ghatate hain. Toh is rectangle ki chaudai kitni hai?
  > card: Toh is rectangle ki chaudai kitni hai?
  > screen: board shape@1 {"labels":"20 m | parimap 60 m","numbers":"20 60"} · ref {"template":"shape@1","params":{"shape":"rectangle","side":"20 m","name":"parimap 60 m"}}

**child:** 10 m  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 · board up · ready 1548 ms · guard mustsay]: Sahi, Riya: tumne 30 m mein se 20 m ghatakar chaudai 10 m nikali. Is rectangle plot ki lambai 12 m aur chaudai 8 m hai. Taar poore kinaare par lagegi, toh parimap 2 × (12 + 8) = 40 m. Taar ₹10 per metre hai, toh kharcha 40 × 10 = ₹400. Agar kahin gate ho jahan taar nahi lagti, toh pehle uski lambai parimap se ghatate hain, phir guna karte hain. Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > card: Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > screen: board measured@1 {"labels":"12 m | 8 m","numbers":"12 8"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":8,"trace":true}}

**child:** 42 m  _(incorrect)_

**Asha** [hint · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 (1 miss) · board up · ready 4043 ms · guard samecard,uncorrected]: 42 m sahi nahi hai. Gate ke 2 m hisse ko hata kar, 40 m ki boundary mein kitni taar bachegi? Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > card: Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > screen: board measured@1 {"labels":"12 m | 8 m","numbers":"12 8"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":8,"trace":true}}

**child:** 42 m  _(incorrect)_

**Asha** [hint · beat s3:explain:e3 · check script:c6-maths-ch06-t01-s3:ask:e3 (2 miss) · board up · ready 2440 ms · guard uncorrected]: 42 m sahi nahi hai. Poora kinaara 40 m tha. Gate ke 2 m par taar nahi lagegi. 40 mein se 2 ghatao. Kitna bachega? Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > card: Isi plot mein 2 m ka gate hai jahan taar nahi lagegi. Ab kitne metre taar lagegi?
  > screen: board measured@1 {"labels":"12 m | 8 m","numbers":"12 8"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":8,"trace":true}}

**child:** 38  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:problem · board up · ready 3293 ms · guard leak,invented,long]: Haan, sahi hai. Rani 50 m lambe aur 30 m chaude rectangle park ke 3 chakkar daudti hai. Woh kul kitna daudti hai? Diya hai: park rectangle hai, lambai 50 m hai, chaudai 30 m hai, chakkar 3 hain. Dhoondhna hai: Rani kul kitni doori daudti hai. Yeh kadam saaf hai?
  > screen: board measured@1 {"labels":"50 m | 30 m","numbers":"50 30"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 4733 ms · guard wrap]: Theek hai Riya, aaj ke liye ruk sakte hain. Tum kya chunogi: jaari rakhein, thoda viraam lein, ya aaj band karein?

## Agent


