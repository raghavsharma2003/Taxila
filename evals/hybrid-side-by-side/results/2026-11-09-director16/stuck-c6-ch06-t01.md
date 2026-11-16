# stuck-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj cricket ground jaise shapes ka perimeter, yani boundary length, dekhenge. Tumhe cricket mein kya pasand hai?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2558 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. Achha Riya, cricket pitch ki boundary karo: ek kone se chal kar har kinaare se guzro aur wahi laut aao.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 6115 ms · guard content_filter_output]: Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Toh ungli kul kitne cm chali?
  > card: Toh ungli kul kitne cm chali?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 1802 ms · guard mustsay]: Pehle 4 cm, phir 5 cm, phir 6 cm. Teeno ko ek ke baad ek jodte jao. Toh ungli kul kitne cm chali?
  > card: Toh ungli kul kitne cm chali?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 2121 ms]: Haan, ab se Hindi mein bolti hoon. Toh ungli kul kitne cm chali?
  > card: Toh ungli kul kitne cm chali?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetres  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 3992 ms · guard nowhy]: Haan, sahi hai, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti.
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2683 ms · guard mustsay]: Achha. Ab hexagon dekho. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1296 ms]: Har bhuja par 5 cm likha hua socho. Ab chhah baar 5 cm jodo. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 2341 ms · guard uncorrected]: 5 cm sahi nahi hai. Kono ke naam A se F tak. A se chalo aur har bhuja bolo: AB 10 m, BC 4 m, CD 6 m, DE 5 m, EF 4 m, FA 9 m. Jod tabhi poora hota hai jab tum wapas A par pahunchte ho. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 4 m | 6 m | 5 m | 9 m","numbers":"10 4 6 5 9"} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 4427 ms]: Dekho, yahi numbers ab patti par. Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > card: Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > screen: board unrolled@1 {"shape":"6-sided shape","sides":"6 sides laid in a straight line","lengths":"10 m, 4 m, 6 m, 5 m, 4 m, 9 m","total":"?","labels":"8 m | 5 m | 7 m | 6 m | 3 m | P"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 metre  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (1 miss) · board up · ready 1263 ms]: Haan, sahi hai, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** mujhe lagta hai 30 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2130 ms · guard mustsay,noconfirm]: Bilkul sahi. Dekho, chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh aayat dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bhuja mein 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 3164 ms · guard mustsay]: Andar ki jagah chhodo. Bas chaaron kinaare jodo: 6, 4, 6 aur 4. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3704 ms · guard leak,flat,long,uncorrected]: 24 cm sahi nahi hai. Is 5 cm lambe, 3 cm chaude aayat ke kinaare par dhaaga lapeto, phir use kholke scale par rakho. Woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein 5, 3, 5, 3 jodte hain, guna nahi. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"5 cm | 3 cm","numbers":"5 3"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2803 ms]: Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"14 cm | 9 cm","numbers":"14 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [repair · board up · ready 1613 ms]: Theek hai, Riya. Tum aaram se khud karo.
  > screen: board measured@1 {"labels":"14 cm | 9 cm","numbers":"14 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 126 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 2786 ms · guard uncorrected]: 126 cm nahi, yeh jawab theek nahi baitha. Ribbon andar nahi jaata. 14 do baar aata hai, 9 bhi do baar. Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"14 cm | 9 cm","numbers":"14 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 46 cm hai na  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 2144 ms]: Haan, sahi hai, kyunki ribbon kinaare par lagta hai: 14 + 9 + 14 + 9 = 46 cm. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"area-grid@1","params":{"w":14,"h":9,"mode":"perimeter","unit":"cm"}}

**child:** 24 cm  _(misconception)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 4495 ms · guard leak,invented]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 20 cm hai, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Phoolon ki ek kyari tribhuj jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2146 ms · guard invented]: Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2862 ms]: Pehla kadam dekho. Kyari ke teeno kinaare dekho: 7 m, 9 m, 12 m. Baad in teeno par lagegi. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2169 ms]: Ab doosra kadam. Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Chalo, aage dekhte hain.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 3124 ms · guard bare]: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 3110 ms · guard level]: 16 m sahi nahi hai. 12 ko 16 ke neeche likho, ikaai ke neeche ikaai. Pehle ikaai jodo, phir dahaai. Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 gave · board up · ready 3481 ms · guard ask,uncorrected]: Nahi, yeh jawab nahi hai. Toh poora jawab: kyari ke liye 28 m baad lagegi, kyunki baad ko teeno kinaaron par chalna hai, ek bhi bhuja chhoot nahi sakti. Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 23 m  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 (1 miss) · board up · ready 1780 ms]: 23 m nahi, yeh jawab theek nahi baitha. Pehle 8 aur 3, phir usme 5, phir 4. Aise hi aakhri 7 tak jodte jao. Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-aakaar ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 23 m  _(misconception)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 gave · board up · ready 3137 ms · guard ask]: Yeh jawab sahi nahi hai. Is sawaal ka jawab 30 m tha, kyunki chhahon bhujayein judti hain: 8 + 3 + 5 + 4 + 3 + 7 = 30 m. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 2539 ms]: 40 cm se baat nahi bani. Lace andar nahi jaati, sirf kinaare par. Do baar 10, do baar 4. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 28 cm hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2067 ms]: Haan, sahi hai. Dekho, lace kinaare par chalti hai: 10 + 4 + 10 + 4 = 28 cm. Har bhuja jodna hamesha chalta hai. Par is 6 cm aur 4 cm wale aayat ko dekho: 6 do baar aata hai, 4 bhi do baar. Agle hisse mein isi ka ek chhota raasta nikalenge. Ab aage chalte hain.
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2664 ms]: Is aayat mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. Board par 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2507 ms]: Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2538 ms · guard uncorrected]: 16 m sahi nahi hai. Ek cheenti aayat ke kone se chalti hai, saath mein meter. 18 m lambai chali, meter 18. 5 m chaudai, meter 23, par yeh sirf aadha raasta hai. Phir lambai aur chaudai dobara: 46 m. Bhujayein chaar chali, lambai + chaudai mein sirf do. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"18 m | 5 m","numbers":"18 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2706 ms]: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Uska meter kitna dikhayega?
  > screen: board measured@1 {"labels":"19 m | 8 m","numbers":"19 8"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 54  _(correct)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (1 miss) · board up · ready 1160 ms]: Haan, sahi hai, kyunki do lambai aur do chaudai: 2 × (19 + 8) = 54 m. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 32 metre  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1540 ms · guard mustsay,noconfirm]: Bilkul sahi. Dekho, 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m. Naya aayat: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum bilkul saamne wale kone par ho, yaani aadha raasta. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Yahan tak theek hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3870 ms · guard wrap,nochoice]: Theek hai Riya—tum chun sakti ho: aage chalna, chhota break lena, ya aaj ke liye rukna.
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

## Agent


