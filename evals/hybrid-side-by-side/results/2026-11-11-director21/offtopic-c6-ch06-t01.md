# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher hoon. Aaj cricket pitch ki boundary se perimeter seekhenge. Tumhe cricket mein kya pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 3087 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 6324 ms · guard mustsay,level]: Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Toh ungli kul kitne cm chali?
  > card: Toh ungli kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1326 ms · guard noconfirm,screenmismatch]: Haan, sahi hai, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 5 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 2866 ms · guard uncorrected]: 5 cm sahi nahi hai. Is khet ke kone P, Q, R, S, T hain. P par ungli rakho aur har bhuja ka naam lo jaise-jaise uski lambai jodte ho. Ek bhi bhuja chhooti toh jod adhoora hai. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 4372 ms]: Cricket ki baat bhi hogi, bas yeh chakkar khatam ho jaaye. Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > card: Khet PQRST ke paanch kone hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"]}}

**child:** 29 m hai na  _(correct)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (1 miss) · board up · ready 2068 ms]: Bilkul sahi, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** 30 cm hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2045 ms · guard mustsay,noconfirm,screenmismatch]: Haan, bilkul theek. Dekho, chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Cricket mein tumhe kya karna sabse achha lagta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** catch pakadna  _(incorrect)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 3619 ms · guard screen]: Achha, catch! Theek hai. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 4025 ms · guard long,uncorrected]: 24 cm sahi nahi hai. Kinaare par dhaaga lapeto, phir kholke scale par rakho: woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron kinaare jodte hain, guna nahi. Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > card: Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 126 cm  _(misconception)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter (1 miss) · board up · ready 2624 ms · guard uncorrected]: 126 cm nahi, yeh jawab theek nahi baitha. Ribbon andar nahi jaata. 14 do baar aata hai, 9 bhi do baar. Ribbon kitna lamba hai?
  > card: Ek label 14 cm lamba aur 9 cm chauda hai. Uske kinaare par ek baar ribbon lagta hai. Ribbon kitna lamba hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 126 cm  _(misconception)_

**Asha** [repair · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2678 ms]: Nahi, yeh jawab nahi hai. Is sawaal ka jawab 46 cm hai, kyunki ribbon kinaare par lagta hai: 14 + 9 + 14 + 9 = 46 cm. Yahan tak saaf hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":14,"h":9,"mode":"perimeter","unit":"cm"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 3695 ms]: Achha. Phir se dekho: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":14,"h":9,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 2443 ms · guard mustsay]: Andar ki jagah chhodo. Bas chaaron kinaare jodo: 6, 4, 6 aur 4. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 2688 ms]: Is rectangle ki 4 bhujayein seedhi karke ek line par rakhi hain: 6 cm, 4 cm, 6 cm, 4 cm. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 4088 ms · guard praise,uncorrected]: Yeh jawab sahi nahi hai. Iska jawab 20 cm hai, kyunki dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 4885 ms · guard quiz,screenmismatch]: Theek hai. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 3421 ms]: Theek hai, main yeh Hindi mein bolti hoon. Kyari ki teen bhujayein hain, 7 m, 9 m aur 12 m. Baad poore kinaare par lagegi, toh dekhna hai kitni lambi.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3274 ms]: Pehla kadam dekho. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 6085 ms · guard invented,long]: Kyari ke teeno kinaare dekho: 7 m, 9 m, 12 m. Baad in teeno par lagegi. Ab agla kadam dekhte hain.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** theek hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2832 ms · guard invented]: Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 4445 ms · guard bare]: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 4313 ms · guard praise,affirms]: Haan, pehle tum try karo — Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked (1 miss) · board up · ready 4893 ms · guard level]: 16 m sahi nahi hai. 16 m mein abhi sirf do bhujayein hain, 7 m aur 9 m. Teesri bhuja 12 m bhi kinaare par hai, use bhi jodna hai. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [repair · beat s1:worked:worked · board up · ready 3713 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Iska jawab hai kyari ke liye 28 m baad lagegi, kyunki baad ko teeno kinaaron par chalna hai, ek bhi bhuja chhoot nahi sakti. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 3394 ms]: Toh poora jawab: kyari ke liye 28 m baad lagegi, kyunki baad ko teeno kinaaron par chalna hai, ek bhi bhuja chhoot nahi sakti. Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2881 ms]: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Park ka parimap kitna hai?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Park ka parimap kitna hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 26 m  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1677 ms]: Haan, sahi hai. Dekho, chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne kaha ki 10 cm lambe, 4 cm chaude card ke kinaare par 10 × 4 = 40 cm tape lagegi. Sahi mein kitne cm tape lagegi?
  > card: Zoya ne kaha ki 10 cm lambe, 4 cm chaude card ke kinaare par 10 × 4 = 40 cm tape lagegi. Sahi mein kitne cm tape lagegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 40 cm  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 (1 miss) · board up · ready 2628 ms]: 40 cm sahi nahi hai. Tape andar nahi jaati, sirf kinaare par. Do baar 10, do baar 4. Sahi mein kitne cm tape lagegi?
  > card: Zoya ne kaha ki 10 cm lambe, 4 cm chaude card ke kinaare par 10 × 4 = 40 cm tape lagegi. Sahi mein kitne cm tape lagegi?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":10,"h":4}}

**child:** mujhe lagta hai 28 cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2593 ms]: Bilkul sahi, kyunki tape kinaare par chalti hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur wahin se ek chhota raasta milta hai.
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2925 ms · guard mustsay]: Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. Board par 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2975 ms]: Chakkar lagao: 10, phir 6, phir 10, phir 6. Chaaron jodo.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 3174 ms]: Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 16 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 3252 ms · guard uncorrected]: 16 m sahi nahi hai. Cheenti ek kone se chalti hai, saath mein ek counter ginti karta hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha raasta. Lambai + chaudai yahin tak hai. Ghar abhi do bhujayein door hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 3430 ms]: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Uska counter kitna dikhayega?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Uska counter kitna dikhayega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** mujhe lagta hai 54 m  _(correct)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 (1 miss) · board up · ready 2535 ms]: Haan, sahi hai, kyunki do lambai aur do chaudai: 2 × (19 + 8) = 54 m. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 32  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1376 ms · guard mustsay,noconfirm]: Bilkul sahi. Dekho, 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum bilkul saamne wale kone par ho, yaani aadha raasta. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [break · board up · ready 4129 ms · guard nostop,nochoice]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

## Agent


