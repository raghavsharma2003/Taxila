# stuck-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1909 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 3445 ms · guard screen,leak]: Achha, pehle main dikhati hoon. Ludo board ke kisi kone par ungli rakhkar socho: wahan do seedhe kinaare milkar kona banate hain. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2089 ms]: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 946 ms]: Board par square ke har kone par ek-ek karke ungli rakho aur gino. Board ke square mein kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2540 ms · guard ask]: Haan, Hindi mein sunati hoon. Is chaukor ka har kona kitaab ke kone jaisa hai. Aise kone ginkar batao?
  > card: Is chaukor ka har kona kitaab ke kone jaisa hai. Aise kone ginkar batao?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 3438 ms · guard leak]: Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Board ke square mein kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** four  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2457 ms · guard screen,mustsay]: Bilkul sahi, kyunki square ke 4 kone, aur har kona right angle. Do baar moda kaagaz hamara tester hai: uska kona kitaab ke kone jaisa right angle hai. Jis kone mein tester bilkul fit ho, bina khaali jagah, woh right angle hai. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2035 ms]: Kya board par aaram kursi ki peeth aur seat ke beech ka kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 4172 ms · guard leak]: Ab aaram kursi ke kone par tester hai: tester ka kona kursi ke kone par, aur ek seedha kinaara ek bhuja ke saath. Ab doosri bhuja dekho. Ab tum batao.
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** No hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 2544 ms · guard mustsay,twoq]: Haan, bilkul theek. Aaram kursi ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** No  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 1747 ms · guard long]: Nahi, yeh jawab nahi hai. Ise doosri tarah samajhte hain. Square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 2033 ms]: Photo wala darwaza bhi wahi darwaza hai, bas tircha chhapa hai. Socho, tircha hone se kone par kya asar hota hai. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 2238 ms]: Yeh jawab sahi nahi hai. Kitaab ko itna ghumao ki darwaza seedha khada dikhe; phir socho ki uske kone par tester kaise baithega. Chalo, ab tumhari baari.
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 1831 ms]: Haan, pehle tum try karo.
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (2 miss) · board up · ready 1809 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Socho, tester ko square ke kone par gond se chipka diya, phir square ghumaya. Tester bhi square ke saath ghoomta hai, aur kone mein waise hi poora baitha rehta hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (3 miss) · board up · ready 2033 ms]: Nahi, yeh jawab nahi hai. Tile ghumane se sirf uski disha badalti hai; uske kone wahi rehte hain. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** han  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 (1 miss) · board up · ready 1827 ms · guard leak]: Bilkul sahi: photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Ghumaye hue square ke kone: right angle hain ya nahi?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","kone right angle"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 (2 miss) · board up · ready 2013 ms]: Yeh jawab sahi nahi hai. Tumne square ko uske tirchhe dikhne se parkha; tester ko square ke saath ghuma kar uske kone par socho, aur dekho woh kaisa baithta hai. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** haan wahi hain  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4033 ms · guard screen,invented]: Haan, bilkul theek, kyunki ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Aao, agla sawaal main aur tum saath mein karenge. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","kone right angle"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4070 ms · guard screen]: Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 4256 ms · guard screen]: Tile tirchi lagi hai. Socho ki tester ka kona uske kone se kaise milega. Aaram se socho, phir apna jawab batao.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 3026 ms · guard screen]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3809 ms · guard screen]: Achha, toh tumhe batting pasand hai! Chalo, ab padhai aage badhate hain. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 1797 ms · guard screen]: Tester ko bhi tile jitna ghumao, taaki uska kona tile ke kone par aaye aur uske dono seedhe kinaare tile ki bhujaon ke saath padein. Ab ghumaya hua tester tile ke kone par rakh diya. Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** nahi  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 1690 ms · guard deny]: Bilkul sahi. Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi. Ab ek sawaal tum akele karo. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** kitaab wali  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 966 ms]: Haan, bilkul theek: samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 (1 miss) · board up · ready 2550 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Jo kone seedhe nahi dikhte, unhe bhi tester ko carrom board ke saath ghuma kar jaancho, aur har kone mein dekho tester kaisa baithta hai. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** nahin  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 910 ms]: Sahi jawab, kyunki carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** kam khula  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 1946 ms]: Yeh jawab sahi nahi hai. Hawa mein tirchi hone se kona patla dikh sakta hai, par patang wahi square hai; kona dikhne se nahi, tester se jaancho. Ghumaya tester tirchi patang ke upar wale kone par: kam khula, bilkul fit, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** poora baith jayega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2283 ms]: Bilkul sahi. Patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** nahi  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 1998 ms]: Tile ya kitaab ghumane se uska kona nahi badalta; tester bilkul fit ho toh right angle. Ab tester se chhote aur bade kone pehchanenge. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2461 ms]: Tester ka kona kone par, seedha kinaara bhuja par. Doosri bhuja seedhe kinaaron ke beech ho toh right angle se kam, doosre kinaare par toh barabar, paar ho toh zyada. Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}],"tester":true}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 (1 miss) · board up · ready 3038 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Zyada tab hota jab doosri bhuja tester ke doosre seedhe kinaare ke us paar jaati; board par dekho ki woh kahan se jaati hai. Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 (2 miss) · board up · ready 2823 ms · guard leak,uncorrected]: Yeh jawab sahi nahi hai. Apni kitaab ka kona nok ke kone mein rakhkar socho, ek kinaara ek bhuja ke saath: doosri bhuja kitaab ke neeche chhup jaaye toh kam, bahar nikle toh zyada. Ab tum batao.
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 (3 miss) · board up · ready 2022 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Kitaab ka cover dheere-dheere kholo. Pehle angle right angle se kam hota hai, phir ek jagah tester bilkul fit hota hai, aur aage kholo toh zyada ho jaata hai. Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** kam khula  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2494 ms · guard screen,mustsay]: Bilkul sahi: tester rakho toh doosri bhuja dono kinaaron ke beech jaayegi. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain, B ki lambi, par tester rakho toh dono par bilkul fit hoga: dono barabar. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 6 cm wala  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 2156 ms · guard screen,mustsay,long,noconfirm]: Haan, bilkul theek, kyunki chhoti bhujayein, par 6 cm wala zyada khula hai. Darwaza aur deewar bhi ek angle banate hain. Darwaza thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** dono ek jaise  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2638 ms · guard long]: Sahi jawab. Gate aur darwaza dono ek jitne khule hain, aur angle khulne se banta hai. Chalo, ab ek sawaal hum dono saath mein karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1218 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain!

## Agent


