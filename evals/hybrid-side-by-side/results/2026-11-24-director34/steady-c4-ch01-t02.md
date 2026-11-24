# steady-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2367 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 3154 ms · guard screen,leak]: Ludo board ka kona dekho. Kaagaz ko do baar modo, toh bilkul aisa kona banta hai: yeh hamara tester hoga. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 5  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 2017 ms · guard level]: 5 sahi nahi hai. Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 2877 ms · guard level,leak]: Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Ab tum batao.
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 2  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (2 miss) · board up · ready 2920 ms · guard leak,uncorrected]: Nahi, 2 theek nahi. Apni kitaab ka kona dekho. Square ka har kona bilkul waisa hi hai, aur aise kone ka naam right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2039 ms · guard screen,mustsay]: Sahi jawab, kyunki square ke 4 kone, aur har kona right angle. Do baar mode kaagaz ka kona right angle hai; yahi tester hai. Tester kisi kone mein bilkul fit ho, koi khaali jagah na bache, toh woh kona right angle hai. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1770 ms]: Kya board par aaram kursi ki peeth aur seat ke beech ka kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 2308 ms · guard twoq,uncorrected]: Abhi yeh sahi nahi hai. Tester ka kona kursi ke kone par socho, aur dekho ki dono bhujayein tester ke dono seedhe kinaaron ke saath milti hain ya nahi. Chalo, ab tumhari baari.
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 3084 ms · guard leak]: Ab aaram kursi ke kone par tester hai: tester ka kona kursi ke kone par, aur ek seedha kinaara ek bhuja ke saath. Ab doosri bhuja dekho. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** nahi, fit nahi hoga  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1707 ms · guard mustsay,noconfirm]: Haan, sahi hai. Suno, aaram kursi ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** No  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 2062 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Ek aur tareeka dekhte hain. Square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** yes, they are right angles  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 (1 miss) · board up · ready 2251 ms]: Sahi jawab, kyunki photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** Yes  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2086 ms · guard screen]: Bilkul sahi: ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","right angle"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4713 ms · guard screen,affirms]: Haan, pehle tum try karo. Dhyaan se suno. Tile tirchi hai: uske kone par tester ko seedha hi rakhna theek hai, ya use bhi ghumana padega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4111 ms · guard screen]: Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** tile ke saath ghuma kar  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3265 ms · guard screen,affirms,leak]: Bilkul, ghuma kar: tester ke seedhe kinaare tile ki bhujaon ke saath. Ghuma kar rakhne par tester tile ke kone mein bilkul fit hua; beech mein koi khaali jagah nahi bachi. Tumhari baari: toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** Sonu was wrong  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 3678 ms · guard screen]: Sahi jawab. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Ab agla sawaal tumhare liye. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 3122 ms · guard ask]: Haan, Hindi mein sunati hoon. Samosa, pizza aur tedhi rakhi kitaab: kiske kone mein tester poora baithega?
  > card: Samosa, pizza aur tedhi rakhi kitaab: kiske kone mein tester poora baithega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tirchi rakhi"]}}

**child:** tirchi kitaab  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 2057 ms · guard noconfirm]: Haan, sahi hai. Samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 5007 ms · guard leak]: Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** 4 kone  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 1088 ms]: Bilkul sahi: carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** kam khula  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 2930 ms · guard praise,uncorrected]: Abhi yeh sahi nahi hai. Hawa mein tirchi hone se kona patla dikh sakta hai, par patang wahi square hai; kona dikhne se nahi, tester se jaancho. Tirchi udti square patang ke upar wale kone par tester ghuma kar rakho, toh kona kam khula hoga, bilkul fit, ya zyada khula?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** fit ho jayega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2085 ms]: Sahi jawab, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2430 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Abhi apne kaam par wapas chalte hain. Tester ka kona kone par, seedha kinaara bhuja par. Doosri bhuja seedhe kinaaron ke beech ho toh right angle se kam, doosre kinaare par toh barabar, paar ho toh zyada. Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 (1 miss) · board up · ready 2470 ms]: Nahi, yeh theek nahi hai. Zyada tab hota jab doosri bhuja tester ke doosre seedhe kinaare ke us paar jaati; board par dekho ki woh kahan se jaati hai. Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 (2 miss) · board up · ready 1830 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Tester ka kona nok ke kone par aur ek seedha kinaara ek bhuja par socho, aur dekho ki doosri bhuja kahan se jaati hai. Aaram se socho, phir apna jawab batao.
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** kam khule hain  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2864 ms]: Haan, sahi hai. Cake ki nok par tester rakho toh doosri bhuja uske dono kinaaron ke beech se jaayegi: nok right angle se kam hai. Tumne cricket ki baat chhedi thi; ab batao, uske baare mein kya kehna tha?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2281 ms · guard mustsay]: Oho, chauka! Kya baat hai. Toh ab wahin se shuru karte hain jahan ruke the. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain, B ki lambi, par tester rakho toh dono par bilkul fit hoga: dono barabar. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 3292 ms · guard long]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > card: Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 8 cm panno wali  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (1 miss) · board up · ready 4233 ms · guard screen]: Sahi jawab, kyunki 8 cm wali kitaab zyada khuli hai aur 16 cm wali kam, toh 8 cm wali ka angle bada hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Board par 6 cm bhujaon wala aur 12 cm bhujaon wala angle hai; kiska khulna zyada hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"8 cm","len":"short"},{"deg":55,"name":"16 cm"}],"mark":{"index":0}}}

**child:** 6 cm wala hai  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 3405 ms · guard screen,mustsay,leak,long,noconfirm]: Bilkul sahi. Suno, 6 cm wala zyada khula hai, 12 cm wala kam. Darwaza aur deewar bhi ek angle banate hain. Darwaza thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** both the same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2060 ms]: Haan, sahi hai: gate aur darwaza dono ek jitne khule hain, aur angle khulne se banta hai. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** kam hai na  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch01-t02-s2:ask:worked · board up · ready 4525 ms · guard leak]: Haan, kam: P ki bhujayein lambi hain, par uska khulna right angle se kam hai. Q par tester rakho: tester bilkul fit hota hai, toh Q right angle ke barabar hai. Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > card: Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}]}}

**child:** R hai na  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch01-t02-s2:c1 · board up · ready 1793 ms]: Haan, bilkul theek. Toh poora jawab: teeno mein R sabse bada angle hai, kyunki R ki doosri bhuja tester ke doosre seedhe kinaare ke us paar gayi, toh R right angle se bhi zyada khula hai. Ab ek sawaal tum akele karo. Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai, barabar hai, ya zyada?
  > card: Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai, barabar hai, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}],"mark":{"index":2}}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:check:c1 · check script:c4-maths-ch01-t02-s2:c1 (1 miss) · board up · ready 3118 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. 30 cm ke lambe panne dekh kar angle bada lagta hai, par lambai panno ki hai; angle toh panno ke beech ka khulna hai. Board par 30 cm lambe panno wali khuli kitaab hai; panno ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > card: Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai, barabar hai, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":65,"name":"kitaab ke panne"}]}}

**child:** less  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch01-t02-s2:c2 · board up · ready 2462 ms · guard screen]: Sahi jawab. Suno, tester rakho toh doosra panna dono kinaaron ke beech jaayega: panne kam khule hain; 30 cm lambai se yeh nahi badalta. Ek khilona laptop khula hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > card: Ek khilona laptop khula hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":65,"name":"kitaab ke panne"}]}}

**child:** more than a right angle  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c4-maths-ch01-t02-s2:c3 · board up · ready 2050 ms]: Haan, sahi hai: tester rakho toh khilona laptop ki screen uske doosre seedhe kinaare ke us paar jaayegi, toh angle right angle se zyada hai. Chhoti aur badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ka angle bada hai. Kis ghadi ka angle bada hai, ya dono ka barabar?
  > card: Chhoti aur badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ka angle bada hai. Kis ghadi ka angle bada hai, ya dono ka barabar?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"khilona laptop","len":"short"}]}}

**child:** dono barabar hai na  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 2023 ms]: Bilkul sahi, kyunki 2 baje chhoti ghadi aur badi ghadi ki suiyan ek jitni khuli hain, toh dono angle barabar hain. Ab ek aisi shape aayegi jismein koi kona hi nahi hota: circle, jise hum string se banayenge. Yeh hissa saaf hua?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"chhoti ghadi","len":"short"},{"deg":60,"name":"badi ghadi"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 · board up · ready 3697 ms · guard screen,long]: String ka ek sira dabao: yahi centre hai. Doosre sire par pencil baandho, string tight rakho aur pencil ko poora ghumao: jo shape banti hai, woh circle hai. Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string"}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 (1 miss) · board up · ready 2282 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Socho, string tight rakhne par pencil kabhi centre ke paas aati hai ya door jaati hai kya. Jis circle ke kinaare ka ek point centre se 4 cm door hai, kya uska koi doosra point 5 cm door ho sakta hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string"}}

**child:** nahi ho sakta  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 · board up · ready 3273 ms · guard mustsay,long]: Sahi jawab. Kinaare ka har point centre se string jitna door hai, toh har point 4 cm door hai, 5 cm nahi. Sikke ka har kinaare wala point centre se barabar door hai, isliye sikka circle hai. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"har point 4 cm"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle · board up · ready 3861 ms · guard leak,uncorrected]: Nahi, yeh theek nahi hai. Ise doosri tarah samajhte hain. Ek circle string se banao, ek oval haath se. Dono mein centre se kinaare tak kai jagah naapo: circle mein har jagah wahi doori, oval mein doori badalti hai. 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"uneven","centre":"centre","radii":["8 cm","10 cm"],"name":"roti"}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s3:check:then:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle (1 miss) · board up · ready 3552 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Circle mein har point centre se string jitna door hota hai. Socho, dheeli string se yeh doori har jagah wahi rahegi kya. 12 cm string beech mein dheeli ho jaane se bani gol shape kya circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","slack":{"from":20,"to":110,"depth":4},"guide":false,"name":"dheeli string"}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s3:check:then:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle (2 miss) · board up · ready 2024 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Phoola balloon do haathon se dabao, toh woh ek taraf lamba ho jaata hai. Ab centre se kinaara ek taraf door, doosri taraf paas: dabaa balloon gol hai, circle nahi. Ab tum batao.
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","slack":{"from":20,"to":110,"depth":4},"guide":false,"name":"dheeli string"}}

**child:** no, it is not a circle  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 (1 miss) · board up · ready 3619 ms · guard long]: Haan, sahi hai: string beech mein dheeli hui, toh har point 12 cm door nahi raha: shape gol dikhti hai, par circle nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","slack":{"from":20,"to":110,"depth":4},"guide":true,"name":"dheeli string"}}

**child:** galat hai  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c4-maths-ch01-t02-s3:ask:e3 · board up · ready 1295 ms · guard mustsay]: Sahi jawab, kyunki doori 8 cm aur 10 cm, barabar nahi. Khoonte se 3 m ki string baandho, aur doosre sire par chalk. String tight rakhkar chalo, toh chalk ka har nishaan khoonte se 3 m door aata hai. Zameen par teen nishaan hain: khoonte se 2 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par hain?
  > card: Zameen par teen nishaan hain: khoonte se 2 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"uneven","centre":"centre","radii":["8 cm","10 cm"],"name":"roti"}}

**child:** ek hi nishaan  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 2534 ms]: Bilkul sahi. 3 m string se har nishaan 3 m door banta hai; sirf 1 nishaan, 3 m wala, circle par hai. Aao, agla sawaal main aur tum saath mein karenge. Pooja 50 cm ki tight string se rangoli ka circle banati hai. Phir ek kinaare se centre se hote hue doosre kinaare tak seedhi line kheenchti hai. Kinaare se kinaare tak, centre se jaati line mein string kitni baar aati hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"3 m"}}

**child:** 2  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked · board up · ready 1626 ms · guard long]: Haan, do baar: kinaare se centre tak, aur centre se us paar ke kinaare tak. Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","diameter":"do string","name":"rangoli"}}

**child:** 50 cm  _(misconception)_

**Asha** [hint · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked (1 miss) · board up · ready 2114 ms · guard uncorrected]: 50 cm sahi nahi hai. 50 cm sirf kinaare se centre tak hai; poori line centre ke us paar bhi utna hi aage jaati hai. 50 cm string wale circle mein kinaare se centre se hote hue kinaare tak line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","name":"rangoli"}}

**child:** 1 m  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 · board up · ready 1430 ms]: Haan, sahi hai. Toh poora jawab: poori line 100 cm lambi hai, kyunki centre se hokar jaane wali line mein string jitni doori do baar aati hai. Chalo, ab tumhari apni baari. Rangoli ke liye Meena ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > card: Rangoli ke liye Meena ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","diameter":"100 cm"}}

**child:** dono  _(misconception)_

**Asha** [hint · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 (1 miss) · board up · ready 1922 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Haath se banate waqt pencil kahin centre ke paas aa sakti hai, kahin door ja sakti hai; string tight ho toh aisa nahi hota. Haath se bane gol aur tight string se bane gol mein, pakka circle kaunsa hai?
  > card: Rangoli ke liye Meena ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar","name":"rangoli"}}

**child:** string se bana  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c4-maths-ch01-t02-s3:c2 · board up · ready 2565 ms]: Sahi jawab. Dekho, Pooja ne tight string se banaya, toh har point barabar door hai; haath se bane gol mein doori badal sakti hai. Ek ghadi ka kinaara centre se har taraf 7 cm door hai. Kya ghadi ka kinaara circle hai?
  > card: Ek ghadi ka kinaara centre se har taraf 7 cm door hai. Kya ghadi ka kinaara circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"tight string","name":"Pooja ka"}}

**child:** Yes  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c4-maths-ch01-t02-s3:c3 · board up · ready 1290 ms]: Bilkul sahi, kyunki ghadi ka kinaara har taraf centre se 7 cm door hai; circle mein kinaare ka har point barabar door hota hai. Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > card: Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"7 cm","name":"ghadi"}}

**child:** chudi hai  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 4 ms]: Haan, bilkul theek: dono gol hain, par chudi ka kinaara har taraf centre se barabar door hai aur anda ek taraf lamba hai. Jaane se pehle, aaj ki saari baaton par ek aakhri sawaal. Square tile, har bhuja 30 cm, tirchi rakhi hai. Tester tile ke saath ghuma kar kone par rakho: kona kam khula hoga, bilkul fit, ya zyada khula?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"chudi"}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 1109 ms]: Do baatein ek-ek karke socho: tile ko ghumane se uska kona badla kya, aur lambi bhuja se kona zyada khula kya. 30 cm bhuja wali square tile tirchi rakhi hai. Ghumaya hua tester uske kone mein kaisa baithega: kam khula, bilkul fit, ya zyada khula?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","ghumayi hui"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1114 ms]: Iska jawab hai bilkul fit, kyunki tile square hai, toh uska har kona right angle hai; ghumane se kona nahi badalta, aur 30 cm lambi bhuja se kona zyada nahi khulta, isliye tester bilkul fit hoga. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","bilkul fit"]}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [wrap · ready 1105 ms]: Hmm, achha, samajh gayi. Aaj dekha ki right angle kitaab ke kone jaisa hai, aur ghumane se nahi badalta. Phir angle khulne se parkhe, aur circle dekha: uska har point centre se barabar door. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** thoda mushkil tha  _(incorrect)_

**Asha** [wrap · ready 1184 ms]: Achha, theek hai. Aaj tumne chudi aur ande mein se circle chuna. Aaj ke liye itna hi, phir milte hain!

## Agent


