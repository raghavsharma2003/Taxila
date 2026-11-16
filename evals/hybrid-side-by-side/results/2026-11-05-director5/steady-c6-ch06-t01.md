# steady-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj perimeter, yani boundary ki total length, cricket ground ke chakkar jaisa—tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2749 ms]: Achha, Riya. Pitch ke kone se chal kar har kinaara cover karke wahi lautna, perimeter hota hai. Batao, distance kin sides par chalegi?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 4065 ms · guard mustsay]: Triangle ki teenon bhuja jodni hain: 4 cm, 5 cm aur 6 cm. Ek kone se chalo aur wapas usi kone par aao—yeh poora raasta parimap hai. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15  _(correct)_

**Asha** [probe · ready 2683 ms · guard noconfirm]: Bilkul sahi, Riya—tumne triangle ki teenon sides jodi. Batao, perimeter mein boundary ki har side kyun leni hoti hai?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 3332 ms]: Perimeter matlab poori boundary ki lambai: hexagon ki har bhuja jodni hoti hai. Yeh hexagon hai; chhah bhujayein, sab 5 cm. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 4007 ms · guard mustsay,noconfirm]: Bilkul, Riya—tumne chhah sides ko 5 cm jodkar 30 centimetre nikala. Rectangle ke kinaare par 6, 4, 6, 4 cm; andar ki jagah area hai. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20 centimetres  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 3047 ms · guard long,screenmismatch]: Ab teesri bhuja, 12 m, bhi jodo. Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Baad kinaare par lagti hai, toh yeh parimap ka sawaal hai. Teeno bhujayein jodni hain.: P = 7 + 9 + 12, kyunki Koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Pehle do bhujayein jodo.: 7 + 9 = 16 m, kyunki Ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(incorrect)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 4802 ms · guard flat,uncorrected]: 16 m sahi nahi hai. 16 m sirf pehli do bhujayon ka yog hai; 12 m jodne par parimap kitna hoga?
  > screen: board shape@1 {"labels":"A"} · ref {"template":"shape@1","params":{"shape":"hexagon","names":["A","B","C","D","E","F"]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · ready 2309 ms]: Riya, ab total nikalne ke liye bachi hui side ko bhi pichhle yog mein jodna hoga. Ek chhah bhujaon wale khet ABCDEF mein AB = 10 m, BC = 4 m, CD = 6 m, DE = 5 m, EF = 4 m aur FA = 9 m hai. Khet ka parimap kitna hai?
  > card: Khet ka parimap kitna hai?

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2234 ms]: Dekho, screen par chhah-kone ka khet ABCDEF hai. Kinaare 10, 4, 6, 5, 4, 9 m hain. Sabko jodkar perimeter batao.
  > card: Khet ka parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 38 metre  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 gave · ready 2165 ms]: Pichhla sawaal: Baad kinaare par chalti hai, isliye parimap. Teeno bhujayein judi, koi nahi chhooti. Jawab ek lambai hai, isliye metre mein aata hai, square metre mein nahi., yaani jawab Toh kyari ke liye 28 m lambi baad lagegi.. Sahi, Riya—tumne chhah kinaaron ki lengths jodkar 38 metre nikala. Ek L-shape kamre ki 6 bhujayein hain. Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?
  > card: Ek kone se ghoomte hue unki lambai 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m hai. Kamre ka parimap kitna hai?

**child:** mujhe lagta hai 30 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2187 ms]: Sahi, Riya—tumne L-shape ki sabhi chhah sides ko jodkar 30 m nikala. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Iske kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | ? cm","numbers":"10"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 40 cm  _(incorrect)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 4578 ms · guard flat]: 40 cm nahi: perimeter mein 10, 4, 10 aur 4 jodte hain. Lace ki total lambai kitni hogi?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · ready 3220 ms]: Theek hai, Riya. Ab nayi shape ko dhyan se dekho; har kinaara perimeter mein shaamil hota hai. 5 cm lambe aur 3 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: 5 cm lambe aur 3 cm chaude label ke kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?

**child:** ruko, main khud karta hoon  _(no_evidence · thinking)_

**Asha** [repair · ready 2530 ms]: Theek hai, Riya. Tum khud calculate karo.

**child:** 16 cm  _(correct)_

**Asha** [probe · ready 1276 ms]: Bilkul sahi, Riya—tumne 5, 3, 5 aur 3 cm jodkar 16 cm nikala. Tumne kaun-si sides ko do-do baar liya, aur kyun?

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · check c6-maths-ch06-t01-i03 · ready 2393 ms]: Cricket mein boundary rope poori outer line dikhati hai—perimeter bhi shape ki outer boundary hoti hai. Ek triangle ki sides 5 cm, 6 cm aur 9 cm hain. Iska perimeter kya hai?
  > card: Ek triangle ki sides 5 cm, 6 cm aur 9 cm hain. Iska perimeter kya hai?

**child:** mujhe lagta hai 20 cm  _(correct)_

**Asha** [probe · check c6-maths-ch06-t01-i09 · ready 2929 ms]: Sahi, Riya—tumne teenon sides, 5, 6 aur 9 cm, jodkar 20 cm nikala. Tablecloth ke chaaron taraf lace lagana aur table ko cloth se dhakna: kisme perimeter chahiye, kisme area?
  > card: Tablecloth ke chaaron taraf lace lagana aur table ko cloth se dhakna: kisme perimeter chahiye, kisme area?

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [probe · check c6-maths-ch06-t01-i09 · ready 2484 ms]: Ab se main saral Hindi mein, Roman lipi mein bolungi. Ganitiya shabdon ke saath unka angrezi naam bhi bataungi. Tablecloth ke chaaron taraf lace lagana aur table ko cloth se dhakna: kisme perimeter chahiye, kisme area?
  > card: Tablecloth ke chaaron taraf lace lagana aur table ko cloth se dhakna: kisme perimeter chahiye, kisme area?

**child:** lace perimeter, covering area  _(correct)_

**Asha** [probe · check c6-maths-ch06-t01-i10 · ready 2286 ms]: Sahi, Riya—tumne lace ko parimap aur dhakne ko area se joda. Ek L-shape kamre ki sides 6, 2, 3, 2, 3 aur 4 m hain. Riya ne 6 + 2 + 3 + 2 + 3 = 16 m joda. Usne kya chhoda?
  > card: Ek L-shape kamre ki sides 6, 2, 3, 2, 3 aur 4 m hain. Riya ne 6 + 2 + 3 + 2 + 3 = 16 m joda. Usne kya chhoda?

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · check c6-maths-ch06-t01-i10 · ready 2779 ms]: L-shape ki kul chhah sides hain, par usne paanch jodi. 4 m wali side chhoot gayi ya koi aur?
  > card: Ek L-shape kamre ki sides 6, 2, 3, 2, 3 aur 4 m hain. Riya ne 6 + 2 + 3 + 2 + 3 = 16 m joda. Usne kya chhoda?

**child:** The last side of 4 m; the perimeter is 20 m  _(correct)_

**Asha** [teachback · ready 3197 ms]: Bilkul sahi, Riya—tumne chhuti hui 4 m side pehchaani aur kul parimap 20 m nikala. Ab ek square ki har side 6 cm hai; parimap batao.

**child:** achha  _(incorrect)_

**Asha** [teachback · ready 3186 ms · guard uncorrected]: achha sahi nahi hai. Square ki chaaron sides barabar hoti hain. Har side 6 cm hai, isliye 6 ko chaar baar jodo. Parimap kitna hoga?

**child:** haan, samajh aaya  _(incorrect)_

**Asha** [wrap · ready 2793 ms]: Aaj tumne L-shape ki chhuti side pehchaan kar perimeter poora kiya. Parimeter mein har boundary side jodni hoti hai. Achha kaam—alvida!

## Agent


