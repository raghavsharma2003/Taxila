# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj perimeter, yani boundary ki total length, cricket ground ke chakkar jaisa. Tumhe cricket mein kya pasand hai?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2871 ms]: Badhiya, Riya! Cricket pitch ka kinaara karo: ek kone se chalke har side ke along wapas wahi kone. Ye total distance kya kehlaayega?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3560 ms · guard screen,mustsay]: Parimap matlab boundary ki total length. Is triangle ki teen bhujaayein 4 cm, 5 cm aur 6 cm hain; ek kone se chalo, wapas usi kone par aao. Toh is triangle ka parimap kitna hai?
  > card: Toh is triangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(incorrect)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 3037 ms · guard screenmismatch]: 9 cm sahi nahi hai; tumne shayad ek side chhod di.
  > screen: board shape@1 {"labels":"A"} · ref {"template":"shape@1","params":{"shape":"hexagon","names":["A","B","C","D","E","F"]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [reteach · ready 3078 ms]: Hindi mein? Zaroor. Riya, parimap ke liye sabhi bhujaayein jodte hain: 4, 5 aur 6 ka kul 15 cm. Ab batao, parimap kya hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · ready 3054 ms]: Ab isi tarah boundary ki har side ki lambai jodkar kul parimap nikaalenge. Ek chhah bhujaon wale khet ABCDEF mein AB = 10 m, BC = 4 m, CD = 6 m, DE = 5 m, EF = 4 m aur FA = 9 m hai. Khet ka parimap kitna hai?
  > card: Khet ka parimap kitna hai?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · ready 3714 ms · guard flat]: Parimap ke liye sabhi sides jodo: 10, 4, 6, 5, 4 aur 9. Inka kul yog kitna hoga?
  > card: Khet ka parimap kitna hai?

**child:** mujhe lagta hai 38 m  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 4053 ms · guard screen,noconfirm]: Riya, 38 m sahi hai—tumne chhah bhujaon ki lambai jodi. Yeh hexagon hai. Iski chhah bhujayein hain aur sab barabar lambi hain. Label sirf ek bhuja par hai, 5 cm. Toh is hexagon ka parimap kitna hai?
  > card: Toh is hexagon ka parimap kitna hai?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 cm  _(correct)_

**Asha** [probe · ready 3032 ms · guard noconfirm]: Bilkul sahi, Riya—tumne 5 cm ko chhah barabar bhujayon se guna kiya. Is tarah parimap kaise milta hai?

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · board up · ready 2196 ms · guard screenmismatch]: Chaaron kinaaron ki lambai ko jodkar parimap kaise milega?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** mujhe lagta hai 30 cm  _(incorrect)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 4992 ms · guard mustsay,uncorrected]: Nahi, yeh jawab nahi hai. Rectangle ke kinaare par 6, 4, 6, 4 cm jodo. Andar ki jagah area hai. Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > card: Is rectangle ke kinaare par ek baar dhaaga lagana hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2678 ms]: 24 cm sahi hai: 6, 4, 6 aur 4 jodne par 20 cm hota hai, 24 nahi. Dobara kul jodkar batao.
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 3996 ms · guard long]: Riya, pehle 7 m aur 9 m se 16 m hua. Diya hai: kyari triangle shape ki hai, ek band shape, bhujayein 7 m, 9 m aur 12 m hain. Baad kinaare par lagti hai, toh yeh parimap ka sawaal hai. Teeno bhujayein jodni hain.: P = 7 + 9 + 12, kyunki Koi bhi bhuja chhooti toh baad adhoori reh jaayegi. Pehle do bhujayein jodo.: 7 + 9 = 16 m, kyunki Ek kone se chalke do bhujayein poori hui, teesri abhi baaki hai. Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > card: Ab teesri bhuja, 12 m, bhi jodo. 16 m mein 12 m jodkar kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m  _(correct)_

**Asha** [explain · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2465 ms · guard mustsay,screenmismatch]: Rectangle mein lambai aur chaudai do-do baar aati hain, kyunki aamne-saamne ki bhujayein barabar hoti hain. Toh is rectangle ka parimap kitna hai?
  > card: Toh is rectangle ka parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** ruko, main khud karta hoon  _(no_evidence · thinking)_

**Asha** [repair · ready 2508 ms]: Theek hai Riya, tum khud karo; main rukti hoon.

**child:** 16 m  _(incorrect)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 4608 ms · guard flat,uncorrected]: 16 m sahi nahi hai. 16 m mein do bhujayein chhoot gayi hain. Ab 8, 4, 8, 4 jodkar parimap batao?
  > screen: board measured@1 {"labels":"14 m | 6 m","numbers":"14 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":14,"h":6,"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · ready 2823 ms]: Koi baat nahi, Riya. Ek cheenti 20 m lambe aur 9 m chaude rectangle khet ka ek poora chakkar lagati hai. Aakhir mein uska meter kitna dikhayega?
  > card: Aakhir mein uska meter kitna dikhayega?

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · ready 2328 ms]: Arre wah! Sixer ke baad ab 20 m aur 9 m wali kheti ka ek poora chakkar socho—meter mein kul doori kitni hogi?
  > card: Aakhir mein uska meter kitna dikhayega?

**child:** 52 m  _(incorrect)_

**Asha** [hint · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · ready 2293 ms · guard uncorrected]: 52 m sahi nahi hai. 52 m mein kuch doori chhoot gayi. Rectangle ke chaaron kinaare jodne hote hain: lambai do baar, chaudai do baar. Aakhir mein uska meter kitna dikhayega?
  > card: Aakhir mein uska meter kitna dikhayega?

**child:** 64 m  _(incorrect)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 gave · board up · ready 4660 ms · guard mustsay,uncorrected]: Pichhla sawaal: yaani jawab 58 m. 64 m sahi nahi hai. Riya, rectangle ka aadha raasta lambai aur chaudai hai; poora parimap 2 × (lambai + chaudai). Ek rectangle 12 m lamba aur 5 m chauda hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Ek rectangle 12 m lamba aur 5 m chauda hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [hint · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · ready 3217 ms · guard uncorrected]: 17 m sahi nahi hai. Pehle 12 m aur 5 m jodo; phir us yog ko 2 se guna karo. Parimap kitna aayega?
  > card: Ek rectangle 12 m lamba aur 5 m chauda hai. 2 × (lambai + chaudai) se iska parimap kitna hai?

**child:** 17 m  _(misconception)_

**Asha** [hint · check script:c6-maths-ch06-t01-s2:ask:e2 (2 miss) · ready 2581 ms · guard uncorrected]: 17 m sahi nahi hai. 17 m sirf lambai aur chaudai jodne se mila. Ab us yog ko do baar lena hai—parimap mein dono lambai aur dono chaudai aati hain. Ek rectangle 12 m lamba aur 5 m chauda hai. 2 × (lambai + chaudai) se iska parimap kitna hai?
  > card: Ek rectangle 12 m lamba aur 5 m chauda hai. 2 × (lambai + chaudai) se iska parimap kitna hai?

**child:** 17 m  _(misconception)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 gave · board up · ready 3734 ms · guard mustsay,uncorrected]: Pichhla sawaal: yaani jawab 34 m. 17 m sahi nahi hai. 12 m aur 5 m jodne par 17 m aata hai; parimap ke liye 17 m ko 2 baar lena hoga. Yeh square hai: chaaron bhujayein 6 cm ki hain, isliye 4 × bhuja. Toh is square ka parimap kitna hai?
  > card: Toh is square ka parimap kitna hai?
  > screen: board measured@1 {"labels":"6 cm | 6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** ab main jaata hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · ready 4444 ms · guard nochoice]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


