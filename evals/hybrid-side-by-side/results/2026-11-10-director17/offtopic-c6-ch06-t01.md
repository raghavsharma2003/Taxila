# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Hi Riya, main Asha, tumhari AI teacher. Aaj rectangles, squares aur polygons ka perimeter cricket boundary jaisa naapenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2176 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3310 ms · guard screen,mustsay]: Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Toh ungli kul kitne cm chali?
  > card: Toh ungli kul kitne cm chali?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetre  _(correct)_

**Asha** [probe · beat s1:explain:e1 · board up · ready 1260 ms · guard noconfirm]: Haan, sahi hai, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti.
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e1 · board up · ready 3014 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board measured@1 {"labels":"6 cm | 5 cm | 4 cm","numbers":"6 5 4"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** haan, woh maine bata diya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2714 ms · guard mustsay]: Theek hai. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {"labels":"5 cm","numbers":"5"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 30 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1841 ms · guard mustsay]: Bilkul sahi, kyunki chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, side mein 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {"labels":"6 cm | 4 cm","numbers":"6 4"} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** bees cm  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2455 ms · guard screenmismatch]: Haan, bilkul theek. Dekho, dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4260 ms · guard content_filter_rewrite]: Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi.
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 4126 ms · guard quiz]: Ab doosra kadam. Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2396 ms]: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 metre  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1706 ms]: Haan, sahi hai. Dekho, baad ko teeno kinaaron par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m baad lagegi. Ek kamra L-shape ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-shape ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 9 m | 7 m","numbers":"12 9 7"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2366 ms · guard flat]: Pehle 8 aur 3, phir usme 5, phir 4. Aise hi aakhri 7 tak jodte jao. Ek kamra L-shape ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-shape ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board measured@1 {"labels":"8 m | 3 m | 5 m | 4 m | 7 m","numbers":"8 3 5 4 7"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2844 ms · guard flat]: Is aakaar ki 6 bhujayein seedhi karke ek line par: 8 m, 3 m, 5 m, 4 m, 3 m, 7 m; kul lambai kitni Ek kamra L-shape ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > card: Ek kamra L-shape ka hai, uski 6 bhujayein hain. Ek kone se ghoomo toh: 8 m, 3 m, 5 m, 4 m, 3 m aur 7 m. Kamre ka parimap kitna hai?
  > screen: board unrolled@1 {"shape":"6-sided shape","sides":"6 sides laid in a straight line","lengths":"8 m, 3 m, 5 m, 4 m, 3 m, 7 m","total":"?","labels":"8 m | 3 m | 5 m | 4 m | 7 m"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7]}}

**child:** 30 metres  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1384 ms]: Bilkul sahi, kyunki chhahon bhujayein judti hain: 8 + 3 + 5 + 4 + 3 + 7 = 30 m. Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek rectangle card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"polygon","unit":"m","sides":[8,3,5,4,3,7],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 3196 ms · guard flat,uncorrected]: 40 cm sahi nahi hai. Yeh rectangle 14 cm lamba, 9 cm chauda hai. Kinaare par dhaaga lapeto, phir kholke scale par rakho: woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron kinaare jodte hain, guna nahi. Yahan tak saaf hai?
  > screen: board measured@1 {"labels":"14 cm | 9 cm","numbers":"14 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2557 ms]: Cricket ki baat hum is sawaal ke baad karenge. Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"14 cm | 9 cm","numbers":"14 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1634 ms]: Theek hai, ab Hindi mein. Ribbon andar nahi jaata. 14 do baar aata hai, 9 bhi do baar. Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {"labels":"14 cm | 9 cm","numbers":"14 9"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 46 centimetre  _(correct)_

**Asha** [practice · beat s1:check:c2 · board up · ready 2078 ms · guard ask]: Haan, sahi hai, kyunki ribbon kinaare par lagta hai: 14 + 9 + 14 + 9 = 46 cm. Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"area-grid@1","params":{"w":14,"h":9,"mode":"perimeter","unit":"cm"}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 3696 ms · guard ask]: Achha, yeh jaankar achha laga. Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > card: Ek aayat card ki bhujayein ghoomte hue 10 cm, 4 cm, 10 cm aur 4 cm hain. Kinaare par ek baar lace lagani hai. Kitni lace chahiye?
  > screen: board measured@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** 40 cm  _(misconception)_

**Asha** [repair · beat s1:check:c2 · board up · ready 2012 ms]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 28 cm hai, kyunki lace kinaare par chalti hai: 10 + 4 + 10 + 4 = 28 cm. Har bhuja jodna hamesha chalta hai. Par aayat ki bhujayein jodiyon mein aati hain, aur wahin se ek chhota raasta milta hai. Ab wahi dekhte hain. Ab aage chalte hain.
  > screen: board area-grid@1 {"labels":"10 cm | 4 cm","numbers":"10 4"} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3439 ms · guard long]: Is aayat mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. Board par 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Yahan tak theek hai?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2333 ms]: Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 m  _(correct)_

**Asha** [probe · beat s2:explain:e1 · board up · ready 1492 ms · guard noconfirm]: Haan, sahi hai, kyunki 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m.
  > screen: board measured@1 {"labels":"10 m | 6 m","numbers":"10 6"} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 3873 ms · guard mustsay,ask]: Achha. Naya aayat: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum bilkul saamne wale kone par ho, yaani aadha raasta. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Ab 2 × (lambai + chaudai) lagao. Is aayat ka parimap kitna hai?
  > card: Ab 2 × (lambai + chaudai) lagao. Is aayat ka parimap kitna hai?
  > screen: board measured@1 {"labels":"12 m | 5 m","numbers":"12 5"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** mujhe lagta hai 34 m  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 · board up · ready 3732 ms · guard screen,long,ask]: Bilkul sahi. Dekho, aadha raasta 12 + 5 = 17 m, aur do baar: 2 × 17 = 34 m. Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh cm mein aayega, square cm mein nahi. Is varg ka parimap kitna hua?
  > card: Is varg ka parimap kitna hua?
  > screen: board measured@1 {"labels":"6 cm","numbers":"6"} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** 36 cm  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c6-maths-ch06-t01-s2:ask:e3 (1 miss) · board up · ready 2967 ms · guard samecard,uncorrected]: 36 cm sahi nahi hai. Ek bhuja 6 cm. Bhujayein chaar, toh 6 ko 4 se guna karo. Is varg ka parimap kitna hua?
  > card: Is varg ka parimap kitna hua?
  > screen: board measured@1 {"labels":"6 cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

**child:** 36 cm  _(misconception)_

**Asha** [worked_example · beat s2:worked:worked:problem · board up · ready 1959 ms]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 24 cm hai, kyunki chaar bhujayein, har ek 6 cm: 4 × 6 = 24 cm, lambai hai isliye cm. Ek notebook ka cover aayat hai, 24 cm lamba aur 18 cm chauda. Uske kinaare par ek baar tape lagani hai. Kitni tape lagegi?
  > screen: board area-grid@1 {"labels":"6 cm","numbers":"6 24"} · ref {"template":"area-grid@1","params":{"w":6,"h":6,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2838 ms · guard invented]: Cover aayat hai, toh 2 × (lambai + chaudai) lagao: P = 2 × (24 + 18), kyunki chakkar mein lambai do baar milti hai, chaudai bhi do baar. Yeh kadam samajh aaya?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 7320 ms · guard invented,long]: Lambai 24, chaudai 18. Dono ko bracket mein rakho, aur bracket ke aage 2. Ab agla kadam dekhte hain.
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step2 · board up · ready 1869 ms · guard invented]: Bracket pehle: 24 + 18 = 42 cm, kyunki 42 cm aadha kinaara hai, ek kone se saamne wale kone tak. Chalo, aage dekhte hain.
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked · check script:c6-maths-ch06-t01-s2:ask:worked · board up · ready 2397 ms]: Yeh toh aadha kinaara tha. Poore ke liye 2 × 42 kitna hoga?
  > card: Yeh toh aadha kinaara tha. Poore ke liye 2 × 42 kitna hoga?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

**child:** mujhe lagta hai 84 cm  _(correct)_

**Asha** [probe · beat s2:worked:worked · board up · ready 2267 ms]: Haan, sahi hai. Dekho, aayat ke chakkar mein lambai aur chaudai do-do baar aati hain.
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"area-grid@1","params":{"w":24,"h":18,"mode":"perimeter","unit":"cm"}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 3578 ms · guard wrap]: Theek hai Riya, tum break lena chahti ho. Hum aage chal sakte hain, thodi der ruk sakte hain, ya aaj ke liye rok sakte hain—kya chunogi?
  > screen: board measured@1 {"labels":"24 cm | 18 cm","numbers":"24 18"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}}

## Agent


