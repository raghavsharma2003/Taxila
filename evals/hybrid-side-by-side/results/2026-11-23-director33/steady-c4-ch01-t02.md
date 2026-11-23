# steady-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2411 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2125 ms]: Ludo board ke kone dekho. Aaj kaagaz do baar mod kar tester banayenge, aur aise kone jaanchenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 5  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 2553 ms · guard level,leak,twoq,uncorrected]: 5 sahi nahi hai. Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 4898 ms · guard level,leak]: Right angle utne hi hain jitne square ke kone; koi kona chhoot jaaye ya dobara gina jaaye, toh ginti galat aati hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 2  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (2 miss) · board up · ready 2067 ms · guard level,leak]: Nahi, 2 theek nahi. Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 982 ms · guard mustsay]: Sahi jawab, kyunki square ke 4 kone hain aur har kona kitaab ke kone jaisa right angle hai. Do baar mode kaagaz ka kona right angle hai; yahi tester hai. Tester kisi kone mein bilkul fit ho, koi khaali jagah na bache, toh woh kona right angle hai. Yeh ek table ka kona hai. Kya table ka yeh kona right angle hai?
  > card: Yeh ek table ka kona hai. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1658 ms]: Kya board par bana table ka kona right angle hai?
  > card: Yeh ek table ka kona hai. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"table ka kona"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 2175 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Tester ka kona table ke kone par socho, aur dekho ki dono bhujayein tester ke dono seedhe kinaaron ke saath milti hain ya nahi. Ab phir se socho, jawab kya hoga?
  > card: Yeh ek table ka kona hai. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"table ka kona"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 1900 ms]: Ab table ke kone par tester hai: tester ka kona table ke kone par, aur ek seedha kinaara ek bhuja ke saath. Ab doosri bhuja dekho. Kya board par bana table ka kona right angle hai?
  > card: Yeh ek table ka kona hai. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"table ka kona"}]}}

**child:** tester fit nahi hota  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 2572 ms · guard mustsay,leak]: Haan, sahi hai. Suno, table ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"table ka kona"}]}}

**child:** No  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 1860 ms]: Nahi, yeh theek nahi hai. Ek aur tareeka dekhte hain. Square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** yes, they are right angles  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 (1 miss) · board up · ready 2298 ms]: Sahi jawab, kyunki photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** Yes  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3348 ms · guard screen]: Bilkul sahi: ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","right angle"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3185 ms · guard screen]: Haan, pehle tum try karo. Dhyaan se suno. Tile tirchi hai: uske kone par tester ko seedha hi rakhna theek hai, ya use bhi ghumana padega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 5517 ms · guard screen,affirms]: Ab tum batao.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3719 ms · guard screen]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Abhi apne kaam par wapas chalte hain. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** turn it  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3126 ms · guard screen,leak]: Bilkul, ghuma kar: tester ke seedhe kinaare tile ki bhujaon ke saath. Ghuma kar rakhne par tester tile ke kone mein bilkul fit hua; beech mein koi khaali jagah nahi bachi. Tumhari baari: toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 4150 ms · guard screen,leak,ask]: Haan, Hindi mein sunati hoon. Ghumaya hua tester us kone mein poora baith gaya. Ab batao, Sonu sahi tha kya?
  > card: Ghumaya hua tester us kone mein poora baith gaya. Ab batao, Sonu sahi tha kya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (1 miss) · board up · ready 4343 ms · guard screen,uncorrected]: Abhi yeh sahi nahi hai. Yaad karo, ghuma kar rakhne par tester kaise baitha, aur tester bilkul fit hone ka matlab kya hota hai. Ghuma kar rakhne par tester tile mein fit ho gaya; toh kya Sonu ki baat theek thi?
  > card: Tumhari baari: toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (1 miss) · board up · ready 2683 ms · guard screen,leak]: Tumhari baari: toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** nahin  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 854 ms]: Sahi jawab. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Cricket ki baari aa gayi: uske baare mein thoda aur batao na?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2395 ms]: Hmm, chauka. Samajh gayi. Toh ab wahin se shuru karte hain jahan ruke the. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** kitaab ka kona right angle hai  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 1949 ms]: Haan, sahi hai. Samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 (1 miss) · board up · ready 3144 ms · guard screen,leak]: Abhi yeh sahi nahi hai. Carrom board square hi hai, bas ghumaya gaya hai. Uske har kone ko ek-ek karke socho. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** no, all four are right angles  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 1778 ms]: Bilkul sahi: carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** baith jayega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 840 ms]: Sahi jawab, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3338 ms · guard affirms,long]: Theek hai, abhi aage badhte hain. Tester ka kona kone par, seedha kinaara bhuja par. Doosri bhuja seedhe kinaaron ke beech ho toh right angle se kam, doosre kinaare par toh barabar, paar ho toh zyada. Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** kam niklegi  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2607 ms · guard screen,mustsay]: Haan, sahi hai. Doosri bhuja dono seedhe kinaaron ke beech se jaati hai. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain, B ki lambi, par tester dono par bilkul fit hai: dono barabar. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 6 cm wala angle  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 3908 ms · guard screen,mustsay,long,noconfirm]: Haan, bilkul theek: 6 cm wala zyada khula hai. Darwaza aur deewar bhi ek angle banate hain. Darwaza thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** both the same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1754 ms]: Bilkul sahi, kyunki gate aur darwaza dono ek jitne khule hain, aur angle khulne se banta hai. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** less than a right angle  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch01-t02-s2:ask:worked · board up · ready 3614 ms · guard leak,long]: Haan, kam: P ki doosri bhuja dono seedhe kinaaron ke beech se jaati hai. Q par tester rakho: tester bilkul fit hota hai, toh Q right angle ke barabar hai. Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > card: Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}]}}

**child:** R hai na  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch01-t02-s2:c1 · board up · ready 2061 ms]: Sahi jawab. R ki doosri bhuja tester ke doosre seedhe kinaare ke us paar gayi, toh R right angle se bhi zyada khula hai. Toh poora jawab: teeno mein R sabse bada angle hai. Ab agla sawaal tumhare liye. Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai, barabar hai, ya zyada?
  > card: Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai, barabar hai, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}],"mark":{"index":2}}}

**child:** kam hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch01-t02-s2:c2 · board up · ready 3598 ms · guard screen]: Haan, sahi hai, kyunki doosra panna dono seedhe kinaaron ke beech se jaata hai, toh panne kam khule hain; 30 cm ki lambai ise nahi badalti. Ek khilona laptop khula hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > card: Ek khilona laptop khula hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":65,"name":"kitaab ke panne"}]}}

**child:** kam  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 2167 ms]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > card: Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"khilona laptop","len":"short"}]}}

**child:** chhoti  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch01-t02-s2:c2 (1 miss) · board up · ready 5170 ms · guard screen,leak,long,noconfirm]: Bilkul sahi. Suno, 8 cm wali kitaab zyada khuli hai aur 16 cm wali kam, toh 8 cm wali ka angle bada hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. 4 cm lambi screen aur keyboard wala khilona laptop khula hai; unke beech ka angle right angle se kam hai, barabar, ya zyada?
  > card: Ek khilona laptop khula hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"8 cm","len":"short"},{"deg":55,"name":"16 cm"}],"mark":{"index":0}}}

**child:** more than a right angle  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c4-maths-ch01-t02-s2:c3 · board up · ready 1896 ms]: Haan, bilkul theek: khilona laptop ki screen doosre seedhe kinaare ke us paar jaati hai, toh angle right angle se zyada hai. Chhoti aur badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ka angle bada hai. Kis ghadi ka angle bada hai, ya dono ka barabar?
  > card: Chhoti aur badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ka angle bada hai. Kis ghadi ka angle bada hai, ya dono ka barabar?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"khilona laptop","len":"short"}]}}

**child:** dono barabar hai na  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 3242 ms · guard screen]: Sahi jawab, kyunki 2 baje chhoti ghadi aur badi ghadi ki suiyan ek jitni khuli hain, toh dono angle barabar hain. Ab ek aisi shape aayegi jismein koi kona hi nahi hota: circle, jise hum string se banayenge. Ab tak samajh aaya?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"chhoti ghadi","len":"short"},{"deg":60,"name":"badi ghadi"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 · board up · ready 4809 ms · guard screen,leak,long]: String ka ek sira dabao: yahi centre hai. Doosre sire par pencil baandho, string tight rakho aur pencil ko poora ghumao: jo shape banti hai, woh circle hai. Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string"}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 (1 miss) · board up · ready 2115 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Socho, string tight rakhne par pencil kabhi centre ke paas aati hai ya door jaati hai kya. Jis circle ke kinaare ka ek point centre se 4 cm door hai, kya uska koi doosra point 5 cm door ho sakta hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string"}}

**child:** nahi ho sakta  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 · board up · ready 1729 ms]: Haan, sahi hai. Suno, kinaare ka har point centre se string jitna door hai, toh har point 4 cm door hai, 5 cm nahi. Sikke ka har kinaare wala point centre se barabar door hai, isliye sikka circle hai. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"har point 4 cm"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle · board up · ready 5140 ms · guard leak,uncorrected]: Nahi, yeh theek nahi hai. Ise doosri tarah samajhte hain. Ek circle string se banao, ek oval haath se. Dono mein centre se kinaare tak kai jagah naapo: circle mein har jagah wahi doori, oval mein doori badalti hai. 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"uneven","centre":"centre","radii":["8 cm","10 cm"],"name":"roti"}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s3:check:then:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle (1 miss) · board up · ready 4478 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Circle mein har point centre se string jitna door hota hai. Socho, dheeli string se yeh doori har jagah wahi rahegi kya. 12 cm string beech mein dheeli ho jaane se bani gol shape kya circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","slack":{"from":20,"to":110,"depth":4},"guide":false,"name":"dheeli string"}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s3:check:then:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle (2 miss) · board up · ready 6557 ms · guard twoq,uncorrected]: Yeh jawab sahi nahi hai. Phoola balloon do haathon se dabao, toh woh ek taraf lamba ho jaata hai. Ab centre se kinaara ek taraf door, doosri taraf paas: dabaa balloon gol hai, circle nahi. Chalo, ab tumhari baari.
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board compare@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","slack":{"from":20,"to":110,"depth":4},"guide":false,"name":"dheeli string"}}

**child:** no, it is not a circle  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 (1 miss) · board up · ready 5507 ms · guard leak,long]: Sahi jawab, kyunki string beech mein dheeli hui, toh har point 12 cm door nahi raha: shape gol dikhti hai, par circle nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","slack":{"from":20,"to":110,"depth":4},"guide":true,"name":"dheeli string"}}

**child:** galat hai  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c4-maths-ch01-t02-s3:ask:e3 · board up · ready 1255 ms · guard mustsay]: Haan, sahi hai: doori 8 cm aur 10 cm, barabar nahi. Khoonte se 3 m ki string baandho, aur doosre sire par chalk. String tight rakhkar chalo, toh chalk ka har nishaan khoonte se 3 m door aata hai. Zameen par teen nishaan hain: khoonte se 2 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par hain?
  > card: Zameen par teen nishaan hain: khoonte se 2 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"uneven","centre":"centre","radii":["8 cm","10 cm"],"name":"roti"}}

**child:** ek hi nishaan  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 1954 ms]: Bilkul sahi. 3 m string se har nishaan 3 m door banta hai; sirf 1 nishaan, 3 m wala, circle par hai. Aao, agla sawaal main aur tum saath mein karenge. Pooja 50 cm ki tight string se rangoli ka circle banati hai. Phir ek kinaare se centre se hote hue doosre kinaare tak seedhi line kheenchti hai. Kinaare se kinaare tak, centre se jaati line mein string kitni baar aati hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"3 m"}}

**child:** 2  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked · board up · ready 1631 ms]: Haan, do baar: kinaare se centre tak, aur centre se us paar ke kinaare tak. Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","name":"rangoli"}}

**child:** 50 cm  _(incorrect)_

**Asha** [hint · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked (1 miss) · board up · ready 2325 ms · guard uncorrected]: 50 cm sahi nahi hai. Pichhle step mein line mein string kitni baar aayi, yaad karo, aur har baar 50 cm lo. 50 cm string wale circle mein kinaare se centre se hote hue kinaare tak line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","name":"rangoli"}}

**child:** 1 m  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 · board up · ready 1137 ms]: Sahi jawab. Toh poora jawab: poori line 100 cm lambi hai, kyunki centre se hokar jaane wali line mein string jitni doori do baar aati hai. Ab ek sawaal tum akele karo. Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > card: Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","diameter":"100 cm"}}

**child:** dono  _(misconception)_

**Asha** [hint · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 (1 miss) · board up · ready 4948 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. Gol dikhna kaafi nahi hai. Socho, kiski shape mein har point centre se pakka ek jitna door rahega. Haath se bane gol aur tight string se bane gol mein, pakka circle kaunsa hai?
  > card: Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar","name":"rangoli"}}

**child:** string se bana  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c4-maths-ch01-t02-s3:c2 · board up · ready 2222 ms]: Haan, sahi hai: Pooja ne tight string se banaya, toh har point barabar door hai; haath se bane gol mein doori badal sakti hai. Zoya ki gol ghadi ka kinaara centre se har taraf 7 cm door hai. Kya ghadi ka kinaara circle hai?
  > card: Zoya ki gol ghadi ka kinaara centre se har taraf 7 cm door hai. Kya ghadi ka kinaara circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"tight string","name":"Pooja ka"}}

**child:** Yes  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c4-maths-ch01-t02-s3:c3 · board up · ready 1247 ms]: Bilkul sahi, kyunki ghadi ka kinaara har taraf centre se 7 cm door hai; circle mein kinaare ka har point barabar door hota hai. Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > card: Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"7 cm","name":"ghadi"}}

**child:** chudi hai  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 4 ms]: Haan, bilkul theek. Dono gol hain, par chudi ka kinaara har taraf centre se barabar door hai aur anda ek taraf lamba hai. Jaane se pehle, aaj ki saari baaton par ek aakhri sawaal. Square tile, har bhuja 30 cm, tirchi rakhi hai. Tester tile ke saath ghuma kar kone par rakho: kona kam khula hoga, bilkul fit, ya zyada khula?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"chudi"}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 1462 ms]: Do baatein ek-ek karke socho: tile ko ghumane se uska kona badla kya, aur lambi bhuja se kona zyada khula kya. 30 cm bhuja wali square tile tirchi rakhi hai. Ghumaya hua tester uske kone mein kaisa baithega: kam khula, bilkul fit, ya zyada khula?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","ghumayi hui"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 964 ms]: Iska jawab hai bilkul fit, kyunki tile square hai, toh uska har kona right angle hai; ghumane se kona nahi badalta, aur 30 cm lambi bhuja se kona zyada nahi khulta, isliye tester bilkul fit hoga. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","bilkul fit"]}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [wrap · ready 1451 ms]: Hmm, achha, samajh gayi. Aaj dekha ki right angle kitaab ke kone jaisa hota hai, aur ghumane se kona nahi badalta. Phir tester se dekha ki angle khulne se bada hota hai, bhujaon ki lambai se nahi. Aakhir mein circle aaya: uske kinaare ka har point centre se barabar door hota hai. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 1309 ms]: Hmm, samajh gayi, batane ke liye shukriya. Aaj tumne chudi aur ande mein se circle chuna. Aaj ke liye itna hi, phir milte hain!

## Agent


