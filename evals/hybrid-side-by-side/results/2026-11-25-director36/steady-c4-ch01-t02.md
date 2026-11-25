# steady-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2344 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2731 ms · guard screen,leak]: Ludo board ke kisi kone par ungli rakhkar socho: wahan do seedhe kinaare milkar kona banate hain. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 5  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 2099 ms · guard leak,uncorrected]: 5 sahi nahi hai. Ek kona do baar gin liya. Jis kone se shuru kiya, wahan wapas pahunchkar ruk jao; har kona ek hi baar gino. Board ke square mein kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 3326 ms · guard leak]: Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab tum batao.
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (2 miss) · board up · ready 3370 ms · guard leak,uncorrected]: Nahi, 2 theek nahi. Kuch kone chhoot gaye. Upar ke kone bhi gino aur neeche ke bhi; ek bhi kona mat chhodo. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1750 ms · guard screen,mustsay]: Sahi jawab, kyunki square ke 4 kone, aur har kona right angle. Do baar moda kaagaz hamara tester hai: uska kona kitaab ke kone jaisa right angle hai. Jis kone mein tester bilkul fit ho, bina khaali jagah, woh right angle hai. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2759 ms]: Kya board par aaram kursi ki peeth aur seat ke beech ka kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 3243 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. Tester ka kona kursi ke kone par socho, aur dekho ki dono bhujayein tester ke dono seedhe kinaaron ke saath milti hain ya nahi. Chalo, ab tumhari baari.
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 2553 ms · guard leak]: Ab aaram kursi ke kone par tester hai: tester ka kona kursi ke kone par, aur ek seedha kinaara ek bhuja ke saath. Ab doosri bhuja dekho. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** peeche jhuki hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1649 ms · guard mustsay,noconfirm]: Haan, sahi hai. Aaram kursi ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** No  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 2330 ms]: Nahi, yeh theek nahi hai. Ek aur tareeka dekhte hain. Square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** yes, they are right angles  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 (1 miss) · board up · ready 2218 ms]: Sahi jawab, kyunki photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Ghumaye hue square ke kone: right angle hain ya nahi?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","kone right angle"]}}

**child:** Yes  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3284 ms · guard screen]: Bilkul sahi: ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","kone right angle"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4353 ms · guard screen]: Haan, pehle tum try karo. Ab phir se socho, jawab kya hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4177 ms · guard screen]: Aaram se socho, phir apna jawab batao.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3795 ms · guard screen]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3237 ms · guard screen]: Tile tirchi lagi hai. Socho ki tester ka kona uske kone se kaise milega. Toh ab batao, kya aayega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 4278 ms · guard screen]: Haan, Hindi mein sunati hoon. Board par ek tile seedhi hai aur wahi tile tirchi lagi hai. Tirchi wali par Sonu ka tester nahi baitha, toh usne kona right angle nahi maana. Tile tedhi lagi hai. Tester ko bhi tile jitna ghumaoge, ya seedha hi rakhoge?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2526 ms · guard screen]: Ab tum batao.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3725 ms · guard screen]: Ab phir se socho, jawab kya hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4029 ms · guard screen]: Chalo, ab tumhari baari.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2661 ms · guard wrap]: Toh ab batao, kya aayega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3473 ms · guard screen,leak,long]: Tester ko bhi tile jitna ghumao, taaki uska kona tile ke kone par aaye aur uske dono seedhe kinaare tile ki bhujaon ke saath padein. Ab ghumaya hua tester tile ke kone par rakh diya. Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3760 ms · guard screen]: Sonu bola tha ki tirchi tile ka kona right angle nahi hai; kya Sonu ki baat theek thi?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** theek nahi  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1987 ms · guard screen]: Sahi jawab. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Cricket ki baari aa gayi: uske baare mein thoda aur batao na?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2053 ms]: Wah, chauka! Yeh batane ke liye shukriya. Toh ab kone aur circle wale kaam par lautte hain. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** koi nahi  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 (1 miss) · board up · ready 2296 ms · guard twoq,uncorrected]: Abhi yeh sahi nahi hai. Har kone par tester rakh kar socho: jis kone mein tester poora baithe, koi khaali jagah na bache, wahi right angle hai. Samose ki nok, pizza ke tukde ki nok aur tirchi kitaab ke kone mein right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tirchi rakhi"]}}

**child:** kitab wala  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 1023 ms]: Haan, sahi hai. Samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 (1 miss) · board up · ready 3569 ms · guard screen,leak]: Nahi, yeh theek nahi hai. Jo kone seedhe nahi dikhte, unhe bhi tester ko carrom board ke saath ghuma kar jaancho, aur har kone mein dekho tester kaisa baithta hai. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** no, all four are right angles  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 2168 ms]: Sahi jawab, kyunki carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** haan fit hoga  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2467 ms]: Bilkul sahi. Patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2050 ms]: Tester ka kona kone par, seedha kinaara bhuja par. Doosri bhuja seedhe kinaaron ke beech ho toh right angle se kam, doosre kinaare par toh barabar, paar ho toh zyada. Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}],"tester":true}}

**child:** smaller  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 1862 ms · guard screen,mustsay]: Haan, sahi hai: tester rakho toh doosri bhuja dono kinaaron ke beech jaayegi. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain, B ki lambi, par tester rakho toh dono par bilkul fit hoga: dono barabar. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 6 wala  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 1929 ms · guard screen,mustsay,long,noconfirm]: Haan, bilkul theek, kyunki chhoti bhujayein, par 6 cm wala zyada khula hai. Darwaza aur deewar bhi ek angle banate hain. Darwaza thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** dono ek jaise  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2456 ms]: Sahi jawab. Gate aur darwaza dono ek jitne khule hain, aur angle khulne se banta hai. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** less than a right angle  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch01-t02-s2:ask:worked · board up · ready 3373 ms · guard leak,long]: Haan, kam: P ki bhujayein lambi hain, par uska khulna right angle se kam hai. Q par tester rakho: tester bilkul fit hota hai, toh Q right angle ke barabar hai. Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > card: Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"}],"tester":true}}

**child:** R sabse bada  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch01-t02-s2:c1 · board up · ready 1895 ms]: Bilkul sahi. Toh poora jawab: teeno mein R sabse bada angle hai, kyunki R ki doosri bhuja tester ke doosre seedhe kinaare ke us paar gayi, toh R right angle se bhi zyada khula hai. Ab agla sawaal tumhare liye. Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai, barabar hai, ya zyada?
  > card: Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai, barabar hai, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}],"mark":{"index":2}}}

**child:** less  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch01-t02-s2:c2 · board up · ready 3024 ms · guard screen]: Haan, sahi hai. Tester lagane par doosra panna uske andar reh jaata hai: panne right angle se kam khule hain; lambai se yeh nahi badalta. Ek khilona laptop khula hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > card: Ek khilona laptop khula hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":65,"name":"kitaab ke panne"}]}}

**child:** bada  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c4-maths-ch01-t02-s2:c3 · board up · ready 2184 ms · guard screen]: Haan, bilkul theek: khilona laptop ke keyboard par tester ka kinaara rakho toh screen doosre kinaare se aage khuli hai: right angle se zyada. Chhoti aur badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ka angle bada hai. Kis ghadi ka angle bada hai, ya dono ka barabar?
  > card: Chhoti aur badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ka angle bada hai. Kis ghadi ka angle bada hai, ya dono ka barabar?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"khilona laptop","len":"short"}]}}

**child:** ek jaisa  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 844 ms]: Sahi jawab. Chhoti ghadi aur badi ghadi mein ek hi samay hai, toh dono ki suiyan ek jitni khuli hain. Ab ek aisi shape aayegi jismein koi kona hi nahi hota: circle, jise hum string se banayenge. Yahan tak theek hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"chhoti ghadi","len":"short"},{"deg":60,"name":"badi ghadi"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s3:bridge:bridge · board up · ready 2974 ms · guard screen]: Angle jitna zyada khula, utna hi bada; lambi bhujayein use bada nahi banati. Ab gol shape mein beech se kinaare tak doori dekhenge. Yeh hissa saaf hua?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"chhoti ghadi","len":"short"},{"deg":60,"name":"badi ghadi"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 · board up · ready 3764 ms · guard screen,long]: Theek hai, abhi aage badhte hain. String ka ek sira dabao: yahi centre hai. Doosre sire par pencil baandho, string tight rakho aur pencil ko poora ghumao: jo shape banti hai, woh circle hai. Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"chhoti ghadi","len":"short"},{"deg":60,"name":"badi ghadi"}]}}

**child:** nahi  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 · board up · ready 1270 ms · guard noconfirm]: Haan, sahi hai: kinaare ka har point centre se string jitna door hai, toh har point 4 cm door hai, 5 cm nahi. Sikke ka har kinaare wala point centre se barabar door hai, isliye sikka circle hai. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"har point 4 cm"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle · board up · ready 4113 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Ek circle string se banao, ek oval haath se. Dono mein centre se kinaare tak kai jagah naapo: circle mein har jagah wahi doori, oval mein doori badalti hai. 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"uneven","centre":"centre","radii":["8 cm","10 cm"],"name":"roti"}}

**child:** galat  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 (1 miss) · board up · ready 4366 ms · guard leak,noconfirm]: Sahi jawab, kyunki dheeli string kahin chhoti pad gayi, toh kinaara har jagah 12 cm door nahi raha: gol hai, par circle nahi. Chalo, pehle wale sawaal ki taraf wapas aate hain. Jis roti ka kinaara centre se ek taraf 8 cm aur doosri taraf 10 cm door hai, kya woh circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","slack":{"from":20,"to":110,"depth":4},"guide":true,"name":"dheeli string"}}

**child:** galat hai  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c4-maths-ch01-t02-s3:ask:e3 · board up · ready 1031 ms · guard mustsay,noconfirm]: Bilkul sahi. Doori 8 cm aur 10 cm, barabar nahi. Khoonte se 3 m ki string baandho, aur doosre sire par chalk. String tight rakhkar chalo, toh chalk ka har nishaan khoonte se 3 m door aata hai. Zameen par teen nishaan hain: khoonte se 2 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par hain?
  > card: Zameen par teen nishaan hain: khoonte se 2 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"uneven","centre":"centre","radii":["8 cm","10 cm"],"name":"roti"}}

**child:** sirf 3 m wala  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 2239 ms]: Haan, bilkul theek: 3 m string se har nishaan 3 m door banta hai; sirf 1 nishaan, 3 m wala, circle par hai. Aao, agla sawaal main aur tum saath mein karenge. Pooja 50 cm ki tight string se rangoli ka circle banati hai. Phir ek kinaare se centre se hote hue doosre kinaare tak seedhi line kheenchti hai. Kinaare se kinaare tak, centre se jaati line mein string kitni baar aati hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"3 m"}}

**child:** 2 string  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked · board up · ready 1073 ms · guard long]: Haan, do baar: kinaare se centre tak, aur centre se us paar ke kinaare tak. Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","diameter":"do string","name":"rangoli"}}

**child:** 100 centimetres  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 · board up · ready 1100 ms]: Haan, sahi hai. Toh poora jawab: poori line 100 cm lambi hai, kyunki Pooja ki 50 cm string centre ke is taraf bhi hai aur us taraf bhi: 50 + 50 = 100 cm. Ab ek sawaal tum akele karo. Rangoli ke liye Meena ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > card: Rangoli ke liye Meena ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"50 cm","diameter":"100 cm"}}

**child:** Pooja ka  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c4-maths-ch01-t02-s3:c2 · board up · ready 1109 ms]: Sahi jawab. Pooja ne tight string se banaya, toh har point barabar door hai; haath se bane gol mein doori badal sakti hai. Ek ghadi ka kinaara centre se har taraf 7 cm door hai. Kya ghadi ka kinaara circle hai?
  > card: Ek ghadi ka kinaara centre se har taraf 7 cm door hai. Kya ghadi ka kinaara circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"tight string","name":"Pooja ka"}}

**child:** Yes hai na  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c4-maths-ch01-t02-s3:c3 · board up · ready 2171 ms]: Bilkul sahi: ghadi ka kinaara har taraf centre se 7 cm door hai; circle mein kinaare ka har point barabar door hota hai. Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > card: Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"7 cm","name":"ghadi"}}

**child:** dono  _(misconception)_

**Asha** [hint · beat s3:check:c3 · check script:c4-maths-ch01-t02-s3:c3 (1 miss) · board up · ready 2411 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Dono ke centre se kinaare tak alag-alag taraf socho, aur dekho ki kiski doori har taraf ek jaisi rehti hai. Chudi aur anda dono gol dikhte hain; in dono mein circle kaunsa hai?
  > card: Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar"}}

**child:** chudi hai na  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 1181 ms]: Haan, bilkul theek, kyunki dono gol hain, par chudi ka har point centre se ek jitna door hai, aur anda ek taraf lamba hai. Jaane se pehle, aaj ki saari baaton par ek aakhri sawaal. Square tile, har bhuja 30 cm, tirchi rakhi hai. Tester tile ke saath ghuma kar kone par rakho: kona kam khula hoga, bilkul fit, ya zyada khula?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"chudi"}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 1214 ms]: Do baatein ek-ek karke socho: tile ko ghumane se uska kona badla kya, aur lambi bhuja se kona zyada khula kya. 30 cm bhuja wali square tile tirchi rakhi hai. Ghumaya hua tester uske kone mein kaisa baithega: kam khula, bilkul fit, ya zyada khula?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","ghumayi hui"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1104 ms]: Iska jawab hai bilkul fit, kyunki tile square hai, toh uska har kona right angle hai; ghumane se kona nahi badalta, aur 30 cm lambi bhuja se kona zyada nahi khulta, isliye tester bilkul fit hoga. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","bilkul fit"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** maine pehle chhota wala socha, phir bada  _(no_evidence)_

**Asha** [wrap · ready 2137 ms]: Hmm, achha, samajh gayi. Aaj dekha ki right angle kitaab ke kone jaisa hai, aur ghumane se nahi badalta. Phir angle khulne se parkhe, aur circle dekha: uska har point centre se barabar door. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 1173 ms]: Achha, theek hai. Aaj tumne doori se ghadi ke kinaare ko circle pehchana. Aaj ke liye itna hi, phir milte hain!

## Agent


