# offtopic-c6-ch06-t01 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Aaj cricket ground jaise rectangles ka perimeter dekhenge. Tumhe cricket mein batting ya bowling zyada pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2010 ms]: Cricket ki pitch socho, lagbhag 20 m lambi aur 3 m chaudi. Ek kone se chalo, kinaare-kinaare poori pitch ghoomo aur wapas wahin aa jao. Jitna chale, utna pitch ka parimap hai.

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c6-maths-ch06-t01-s1:ask:e1 · board up · ready 3272 ms · guard screen,mustsay]: Is triangle ki teen bhujayein hain, 4 cm, 5 cm aur 6 cm. Ek kone par ungli rakho aur kinaare par chalao: pehli bhuja, doosri, teesri, aur wapas usi kone par. Ungli jitna chali, wahi parimap hai. Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > card: Ungli kone se chal ke wapas usi kone tak kul kitne cm chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 15 centimetre  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 871 ms · guard noconfirm,screenmismatch]: Sahi jawab, kyunki 4 + 5 + 6 = 15 cm, teeno bhujayein judi, koi nahi chhooti. Yeh hexagon hai, chhah bhujaon wala. Sab bhujayein barabar hain, par label sirf ek par hai: 5 cm. Baaki par kuch likha nahi, phir bhi woh kinaare ka hissa hain. Parimap mein har bhuja aati hai, likhi ho ya na ho. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e2 · board up · ready 2817 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s1:explain:e2 · check script:c6-maths-ch06-t01-s1:ask:e2 · board up · ready 1594 ms]: Achha, toh tumhe chauka sabse achha lagta hai. Ab wapas apne kaam par. Poore hexagon ka parimap kitna hua?
  > card: Poore hexagon ka parimap kitna hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"hexagon","side":"5 cm"}}

**child:** 30 cm  _(correct)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1084 ms · guard mustsay,screenmismatch]: Haan, sahi hai, kyunki chhah bhujayein, har ek 5 cm ki: 6 × 5 = 30 cm. Ab yeh rectangle dekho, 6 cm lamba aur 4 cm chauda. Parimap ek dhaaga hai jo kinaare par chalta hai: upar 6, bagal ki bhuja 4, neeche 6, phir 4. Andar ki jagah area hai, woh bilkul alag cheez hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"hexagon","unit":"cm","sides":[5,5,5,5,5,5],"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c6-maths-ch06-t01-s1:ask:e3 · board up · ready 2258 ms]: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > card: Kinaare par ek baar dhaaga lapetna hai. Kitna dhaaga lagega?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** 20  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 1024 ms]: Sahi jawab. Dekho, dhaaga sirf kinaare par chalta hai: 6 + 4 + 6 + 4 = 20 cm. Phoolon ki ek kyari triangle jaisi hai, uski bhujayein 7 m, 9 m aur 12 m hain. Uske kinaare-kinaare ek baar baad lagani hai. Kitni lambi baad lagegi?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":6,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:problem · board up · ready 1804 ms]: Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2409 ms]: Achha, toh tumhara favourite hai Virat. Toh ab hum wahin se aage badhte hain. Pehla kadam dekho. Baad kinaare par lagegi, toh teeno bhujayein jodni hain: P = 7 + 9 + 12, kyunki ek bhi bhuja chhooti toh baad mein wahan khaali jagah reh jaayegi. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3746 ms · guard quiz]: Socho baad ki jaali teen roll mein aayi hai: ek 7 m, ek 9 m, ek 12 m. Har bhuja par ek roll khulta hai, toh poori baad teeno roll milakar banti hai. Ab agla kadam dekhte hain.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step2 · board up · ready 2278 ms · guard invented]: Pehle 7 aur 9 jodo: 7 + 9 = 16 m, kyunki do bhujayein ho gayi, teesri abhi baaki hai.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · board up · ready 2195 ms]: Kyari ki baad ko seedha kholo toh aisi dikhegi: 7 m, 9 m aur 12 m, ek ke baad ek.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2170 ms]: Meri apni pasand nahi hoti, main AI hoon. Virat ko tum kiske saath dekhte ho?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 2376 ms]: Oh, chauka. Achha. Ab apni padhai par lautte hain. Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c6-maths-ch06-t01-s1:ask:worked · board up · ready 1001 ms]: 16 m mein abhi sirf do bhujayein hain, 7 m aur 9 m. Teesri bhuja 12 m bhi kinaare par hai, use bhi jodna hai. 16 mein 12 jodo, kitna hua?
  > card: Ab teesri bhuja bachi, 12 m. 16 mein 12 jodo, kitna hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [practice · beat s1:worked:worked · board up · ready 1402 ms]: Theek hai, main yeh Hindi mein bolti hoon. Is sawaal ka jawab 28 m hai, kyunki 7 + 9 + 12 = 28 m, teeno bhujayein judi, poori baad ban gayi. Ab tak samajh aaya?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"m","sides":[7,9,12],"trace":true}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2088 ms]: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · board up · ready 2744 ms · guard affirms]: Haan, pehle tum try karo.
  > card: Ek park ki chaar bhujayein alag-alag lambai ki hain. Ek kone se ghoomo toh: 9 m, 6 m, 7 m aur 4 m. Usi kone par wapas pahunchne tak kitne metre chaloge?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4]}}

**child:** 26 m hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c6-maths-ch06-t01-s1:c2 · board up · ready 2428 ms]: Sahi jawab, kyunki chaaron bhujayein judti hain: 9 + 6 + 7 + 4 = 26 m. Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > card: Zoya ne 10 cm lambe, 4 cm chaude card ka parimap 10 × 4 = 40 cm nikala. Sahi parimap kitne centimetre hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"quadrilateral","unit":"m","sides":[9,6,7,4],"trace":true}}

**child:** 28 centimetre  _(correct)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1591 ms · guard mustsay]: Haan, sahi hai. Dekho, parimap kinaara hai: 10 + 4 + 10 + 4 = 28 cm; 10 × 4 andar ki jagah hai. Seedhi bhujaon wali har shape mein har bhuja jodna chalta hai. Ab ek rectangle socho: iski bhujayein jodiyon mein aati hain, aur isse jodne ka ek jaldi wala tareeka milta hai. Is rectangle mein upar aur neeche wali bhuja 10 m ki hai, woh lambai hai. Daayein-baayein wali 6 m ki, woh chaudai. Aamne-saamne ki bhujayein barabar hoti hain. Board par 10 aur 6 ek-ek baar likhe hain, par chakkar lagao toh dono do-do baar milte hain. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":4,"mode":"perimeter","unit":"cm"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 3076 ms · guard flat]: Board par sirf do number likhe hain, par bhujayein chaar hain. Har likhi bhuja ke saamne uski jodidaar bhuja hai, bilkul utni hi lambi.
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c6-maths-ch06-t01-s2:ask:e1 · board up · ready 3093 ms]: Ek poora chakkar kitne metre ka hua?
  > card: Ek poora chakkar kitne metre ka hua?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}}

**child:** mujhe lagta hai 32 m  _(correct)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 3812 ms · guard mustsay,flat]: Bilkul sahi, kyunki 10 aur 6 dono do-do baar aate hain: 10 + 6 + 10 + 6 = 32 m. Naya rectangle: 12 m lamba, 5 m chauda. Neeche baayein kone se chalo, 12 m aage, phir 5 m upar. Ab tum bilkul saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai). Yahan tak saaf hai?
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":10,"h":6,"mode":"perimeter","unit":"m"}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 · board up · ready 2233 ms]: Ab 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: Ab 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 17 m  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2851 ms · guard flat,uncorrected]: 17 m sahi nahi hai. Ek doosri tarah se samajhte hain. Cheenti ek kone se chalti hai aur chalte-chalte metre ginti jaati hai. Pehle lambai chali, phir chaudai: ab woh saamne wale kone par hai, bas aadha chakkar. Lambai + chaudai yahin tak hai. Jis kone se chali thi, woh abhi do bhujayein door hai. Yahan tak theek hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 2204 ms]: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 27 m  _(misconception)_

**Asha** [hint · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · check script:c6-maths-ch06-t01-s2:then:c6-maths-ch06-t01-m-l-plus-b (1 miss) · board up · ready 2943 ms · guard flat,uncorrected]: 27 m nahi, yeh jawab theek nahi baitha. 19 aur 8 jodne se cheenti sirf saamne wale kone tak pahunchti hai. Wapas aane ke liye utna hi aur. 19 m lambe, 8 m chaude khet ka chakkar poora karke cheenti shuru wale kone par lauti; woh kul kitne metre chali?
  > card: Cheenti 19 m lambe aur 8 m chaude khet ka ek poora chakkar lagati hai. Woh kul kitne metre chali?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":19,"h":8}}

**child:** 27 m  _(misconception)_

**Asha** [repair · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 5665 ms · guard flat,uncorrected]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 54 m hai, kyunki do lambai aur do chaudai: 19 + 8 + 19 + 8 = 54 m. Yahan tak saaf hai?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:check:then:c6-maths-ch06-t01-m-l-plus-b · board up · ready 4648 ms · guard praise,affirms]: Cheenti 19 + 8 = 27 m par saamne wale kone par thi, aur shuru wale kone tak phir 27 m: 27 + 27 = 54 m. Yeh hissa saaf hua?
  > screen: board area-grid@1 {} · ref {"template":"area-grid@1","params":{"w":19,"h":8,"mode":"perimeter","unit":"m"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c6-maths-ch06-t01-s2:ask:e2 (1 miss) · board up · ready 2372 ms]: Theek hai, ab wapas usi sawaal par chalte hain. Ab 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > card: Ab 2 × (lambai + chaudai) lagao: is rectangle ke liye yeh kitna banta hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"rect","unit":"m","w":12,"h":5,"trace":true}}

**child:** 34 m hai na  _(correct)_

**Asha** [explain · beat s2:explain:e3 · board up · ready 1641 ms · guard mustsay,noconfirm]: Sahi jawab, kyunki aadha chakkar 12 + 5 = 17 m, aur uska do guna: 2 × 17 = 34 m. Square ki chaaron bhujayein barabar hoti hain, yahan har ek 6 cm. 6 ko chaar baar jodne se achha, seedha 4 × bhuja. Aur jawab ek lambai hai, toh cm mein aayega, square cm mein nahi.
  > screen: board measured@1 {} · ref {"template":"area-grid@1","params":{"w":12,"h":5,"mode":"perimeter","unit":"m"}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 2016 ms]: Aaj ke liye itna hi, phir milte hain.

## Agent


