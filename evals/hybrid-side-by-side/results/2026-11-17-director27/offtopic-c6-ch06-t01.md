# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 3042 ms · guard screen,mustsay]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai. Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3863 ms · guard level]: Socho is triangle ka kinaara ek dhaage se bana hai. Ek kone se dhaaga khol ke seedha kar do: 4 cm, phir 5 cm, phir 6 cm, sab ek line mein. Us seedhi line ki poori lambai hi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 9 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 2319 ms · guard screenmismatch,uncorrected]: 9 cm sahi nahi hai. Ek doosri tarah se samajhte hain. Ab ek khet socho, kone P, Q, R, S, T. P par ungli rakho aur har bhuja ka naam lo jaise-jaise uski lambai jodte ho. Ek bhi bhuja chhooti toh jod adhoora. Jod tabhi poora hota hai jab tum wapas P par pahunchte ho. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 2023 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"pentagon","names":["P","Q","R","S","T"]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-missing-sides · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-missing-sides · board up · ready 3147 ms · guard long]: Achha, toh tumhe chauka sabse achha lagta hai. Ab wapas apne kaam par. Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > card: Khet PQRST ki paanch bhujayein hain: PQ 8 m, QR 5 m, RS 7 m, ST 6 m, TP 3 m. Khet ka poora kinaara kitne metre ka hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"pentagon","names":["P","Q","R","S","T"]}}

**child:** 29 m  _(correct)_

**Asha** [practice · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 (1 miss) · board up · ready 1325 ms]: Sahi jawab, kyunki P se wapas P tak paanchon bhujayein: 8 + 5 + 7 + 6 + 3 = 29 m. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"pentagon","unit":"m","sides":[8,5,7,6,3],"names":["P","Q","R","S","T"],"trace":true}}

**child:** mujhe lagta hai 15 cm  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2160 ms · guard mustsay,noconfirm]: Haan, sahi hai. Dekho, 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 2135 ms]: Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (1 miss) · board up · ready 2260 ms · guard uncorrected]: 5 cm sahi nahi hai. Ungli ko hexagon ke kinaare par ek poora chakkar ghumao, aur har bhuja par uski lambai jodte jao. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 5 cm  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 (2 miss) · board up · ready 1822 ms · guard uncorrected]: 5 cm nahi, yeh jawab theek nahi baitha. Shahad ke chhatte ka ek khaana dekho: uski chhah bhujayein hoti hain, sab ek jaisi. Yahan ek bhuja par 5 cm likha hai, toh baaki paanch bhi 5 cm ki hain. Parimap ke liye chhahon bhujayein ginni hain, sirf likhi hui nahi. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2483 ms · guard mustsay,flat,screenmismatch]: Sahi jawab, kyunki chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bagal ki bhuja 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1866 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 1744 ms]: Ek kone se dhaaga lapetna shuru karo aur wapas usi kone tak aao; har bhuja par jitna dhaaga khula, woh jodte jao. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 4044 ms · guard level]: Rectangle ka kinaara ek dhaage ki tarah khul gaya hai: 6 cm, 4 cm, 6 cm, 4 cm. Andar ki jagah is line mein nahi aati. 6 cm lambe, 4 cm chaude rectangle ke kinaare par ek baar lapetne mein kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 24 cm  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · board up · ready 2096 ms]: 24 cm sahi nahi hai. Aao, isko ek naye dhang se dekhein. Kinaare par dhaaga lapeto, phir kholke scale par rakho: woh lambai parimap hai, cm mein. Andar tiles bichhao toh woh area hai. Parimap mein chaaron bhujayein jodte hain, guna nahi. Yeh hissa saaf hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · beat s1:remediation:rem:c6-maths-ch06-t01-m-area-perimeter · ready 1818 ms]: Ab cricket ki baat karte hain: usmein sabse mazedaar kya hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1942 ms]: Achha, toh tumhe sixer sabse achha lagta hai. Theek hai, ab phir se kaam par aate hain. Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1776 ms]: Bilkul, ise doosre, aasaan shabdon mein bolti hoon. Ribbon andar nahi jaata. Pehle dekho kinaare par kitna lagega, phir use 140 mein se ghatao. 140 cm ribbon mein se 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ek baar lagaane ke baad kitna ribbon bachega?
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c6-maths-ch06-t01-m-area-perimeter · check script:c6-maths-ch06-t01-s1:then:c6-maths-ch06-t01-m-area-perimeter · board up · ready 1697 ms]: Haan, pehle tum try karo.
  > card: Tumhare paas 140 cm ribbon hai. 14 cm lambe, 9 cm chaude sticker ke kinaare-kinaare ribbon lagao. Kitna bachega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":14,"h":9}}

**child:** 94 cm hai na  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 (1 miss) · board up · ready 2325 ms]: Sahi jawab, kyunki kinaare par 14 + 9 + 14 + 9 = 46 cm lagega, toh 140 − 46 = 94 cm bachega. Theek hai, ab wapas usi sawaal par chalte hain. Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"140 − 46 = 94 cm"}}

**child:** 20 centimetre  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 989 ms · guard noconfirm]: Haan, sahi hai. Dekho, dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Ab ek sawaal milkar, kadam-kadam hal karte hain. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Saath mein nikaalte hain ki kitni lambi baad lagegi. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:worked:worked:problem · board up · ready 2847 ms · guard quiz]: Socho tum kyari ke ek kone par khade ho. 7 m chalo, mudo, 9 m chalo, mudo, phir 12 m chal ke wahin pahunch jao. Baad utni hi lambi chahiye jitna tum chale, toh wahi doori nikalni hai. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2268 ms]: Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai. Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 28 m  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 1059 ms]: Bilkul sahi. Dekho, baad ko teeno bhujaon par chalna hai, ek bhi bhuja chhoot nahi sakti. Toh poora jawab: kyari ke liye 28 m lambi baad. Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** 26 metre  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 1116 ms]: Sahi jawab, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** mujhe lagta hai 28 cm  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2152 ms · guard noconfirm]: Haan, sahi hai: parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2121 ms]: 10 cm wali do bhujayein 20 cm, 4 cm wali do bhujayein 8 cm, toh parimap 20 + 8 = 28 cm; 40 toh card ke andar ke chhote square ginta hai. Yahan tak theek hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2340 ms · guard mustsay]: Achha, yeh baat phir milegi; ab aage chalte hain. Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 2377 ms]: Ek darwaaza socho: upar aur neeche ki bhuja ek jitni lambi, daayein aur baayein ki bhi ek jitni. Yahan bhi wahi baat hai: 10 m wali bhujayein do hain aur 6 m wali bhi do. Ek poora chakkar inhi chaar bhujaon se banta hai. Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** 32 m hai na  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2017 ms · guard mustsay]: Sahi jawab, kyunki 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 1771 ms]: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 3002 ms · guard flat,uncorrected]: 17 m sahi nahi hai. Ise ek alag tareeke se dekhte hain. Cheenti ek kone se chalti hai aur chalte-chalte metre ginti jaati hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha chakkar. Lambai + chaudai yahin tak hai. Jis kone se chali thi, woh abhi do bhujayein door hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 1712 ms]: Ek dhaage se rectangle ka poora kinaara banao, phir dhaage ko beech se mod ke do barabar hisse karo. Ek hisse mein bas ek lambai aur ek chaudai aati hai; lambai + chaudai mude hue dhaage jitna hai, poore dhaage jitna nahi. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2424 ms]: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 54 m  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 2253 ms · guard noconfirm]: Sahi jawab, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Chalo, ab pichhle sawaal par wapas chalte hain. 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** 17 m  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (2 miss) · board up · ready 2993 ms · guard flat,uncorrected]: 17 m nahi, yeh jawab theek nahi baitha. Formula mein bracket pehle: usmein lambai aur chaudai jaati hain. Phir bracket ka do guna. Is rectangle ke liye yeh kitna banta hai?
  > card: 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 1063 ms · guard mustsay]: Haan, sahi hai. Dekho, aadha chakkar 12 + 5 = 17 m, aur uska do guna: 2 × 17 = 34 m. Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh cm mein aayega, square cm mein nahi. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 846 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}}

## Agent


