# stuck-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1650 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2677 ms]: Achha, pehle main dikhati hoon. Ludo board ke kone dekho. Aaj kaagaz do baar mod kar tester banayenge, aur aise kone jaanchenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 1875 ms · guard leak]: Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2520 ms · guard screen,level]: Haan, Hindi mein sunati hoon. Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1146 ms · guard long]: Bilkul sahi, kyunki square ke 4 kone, aur har kona right angle. Do baar mode kaagaz ka kona right angle hai; yahi tester hai. Tester kisi kone mein bilkul fit ho, koi khaali jagah na bache, toh woh kona right angle hai. Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2365 ms]: Tester ka kona table ke kone par socho, aur dekho ki dono bhujayein tester ke dono kinaaron ke saath milti hain ya nahi. Hamare tester ke paas bane table ke kone ko dekho: kya table ka kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** no, it does not fit  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1980 ms · guard mustsay]: Haan, bilkul theek. Dekho, table ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli, par uske kone nahi badle. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1852 ms]: Phir se dekho: Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 2750 ms · guard leak]: Yeh hamara tester hai, bada karke: do baar moda kaagaz, jiska kona right angle hai. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester"}]}}

**child:** chaar  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1977 ms · guard screen,leak]: Bilkul sahi, kyunki ghumaya hua square wahi square hai, toh uske 4 kone ab bhi right angle hain. Aao, agla sawaal main aur tum saath mein karenge. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","4 right angle"]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2639 ms · guard screen,leak]: Tile tirchi lagi hai. Socho ki tester ka kona uske kone se kaise milega. Tile tirchi hai: uske kone par tester ko seedha hi rakhna theek hai, ya use bhi ghumana padega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3182 ms · guard screen,long]: Tester ko bhi tile jitna ghumao, taaki uska kona tile ke kone par aaye aur uske dono seedhe kinaare tile ki bhujaon ke saath padein. Ghuma kar rakhne par tester tile ke kone mein bilkul fit hua; beech mein koi khaali jagah nahi bachi. Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2705 ms · guard screen]: Yaad karo, ghuma kar rakhne par tester kaise baitha, aur tester bilkul fit hone ka matlab kya hota hai. Ghuma kar rakhne par tester tile mein fit ho gaya; kya Sonu ka kehna theek tha ki tile ka kona right angle nahi?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2963 ms · guard screen,samecard]: Haan, pehle tum try karo.
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 1779 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ise doosri tarah samajhte hain. Ek square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar uske kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 1748 ms]: Yeh jawab sahi nahi hai. Photo wala darwaza bhi wahi darwaza hai, bas tircha chhapa hai. Socho, tircha hone se kone par kya asar hota hai. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** sahi hai  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (1 miss) · board up · ready 3269 ms · guard screen]: Bilkul sahi. Dekho, photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Ghuma kar rakhne par tester tile mein fit ho gaya; kya Sonu ka kehna theek tha ki tile ka kona right angle nahi?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (2 miss) · board up · ready 3276 ms · guard screen,uncorrected]: Abhi yeh sahi nahi hai. Board par ek tile seedhi hai aur wahi tile tirchi lagi hai. Tirchi wali par Sonu ka tester nahi baitha, toh usne kona right angle nahi maana. Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (3 miss) · board up · ready 2961 ms · guard screen,leak,samecard]: Nahi, yeh theek nahi hai. Tile tirchi hai, aur Sonu ne tester seedha rakha tha. Hamein dekhna hai ki Sonu ka faisla theek tha ya nahi. Ghuma kar rakhne par tester tile mein fit ho gaya; kya Sonu ka kehna theek tha ki tile ka kona right angle nahi?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (3 miss) · board up · ready 2664 ms · guard screen]: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** Yes  _(misconception)_

**Asha** [repair · beat s1:worked:worked · board up · ready 2518 ms · guard screen,uncorrected]: Nahi, tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:check:c1 · board up · ready 1858 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2186 ms]: Achha, toh tumhe batting sabse achha lagta hai. Chalo, ab padhai aage badhate hain. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 (1 miss) · board up · ready 2596 ms · guard samecard,uncorrected]: Nahi, yeh jawab nahi hai. Kitaab ghumane se sirf uski disha badalti hai. Ab socho, uske kone badle ya wahi rahe. Kya ghuma kar tirchi rakhi kitaab ke kone ab bhi right angle hain?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tircha rakha"]}}

**child:** haan  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 971 ms]: Bilkul sahi: ghuma kar rakhne se kitaab ke kone nahi badalte, woh ab bhi right angle hain, toh Zoya sahi hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** No hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 1633 ms]: Haan, bilkul theek, kyunki carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** kam khula  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 2950 ms · guard praise,samecard,uncorrected]: Yeh jawab sahi nahi hai. Patang ek square hai, bas tirchi ud rahi hai. Yaad karo, ghumane se square ke kone par kya asar hota hai. Tirchi udti square patang ke upar wale kone par tester ghuma kar rakho, toh kona kam khula hoga, bilkul fit, ya zyada khula?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** bilkul fit hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1682 ms]: Sahi jawab. Dekho, patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2762 ms · guard praise,affirms]: Tester ka kona angle ke kone par rakho, aur uska ek seedha kinaara ek bhuja par. Doosri bhuja tester ke andar rahe toh angle right angle se kam, bahar nikle toh zyada, aur doosre kinaare par pade toh barabar. Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3815 ms · guard praise,affirms]: Tester ka kona nok ke kone par aur ek kinaara ek bhuja par socho, aur dekho ki doosri bhuja kahan padti hai. Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3477 ms · guard praise,affirms]: Ek kitaab ka cover dheere-dheere kholo. Shuru mein cover aur panne ke beech ka angle right angle se kam hota hai, phir ek jagah tester bilkul fit hota hai, aur usse aage kholo toh angle right angle se zyada ho jaata hai. Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2919 ms · guard praise,affirms,twoq]: Tester ko kone par rakh kar sirf doosri bhuja dekho. Wahi batati hai ki angle right angle ke mukable kaisa hai. Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 4223 ms]: Is sawaal ka sahi jawab: kam hai, kyunki cake ki nok par tester rakho toh doosri bhuja tester ke andar rehti hai: nok right angle se kam khuli hai. Yahan tak saaf hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:explain:e1 · board up · ready 1998 ms]: Right angle hota toh doosri bhuja tester ke doosre kinaare par padti; woh usse pehle hi ruk jaati hai. Ab tak samajh aaya?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 1850 ms · guard mustsay]: Main ise aur aasaan nahi bol paa rahi, koi baat nahi. Theek hai, yeh baat hum phir milkar dekhenge; abhi aage badhte hain. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain aur B ki lambi, par tester dono par bilkul fit hai, toh dono barabar hain. Yeh hissa saaf hua?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 1925 ms]: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > card: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 1893 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ek aur tareeka dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > card: Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 16 cm wali  _(misconception)_

**Asha** [hint · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length (1 miss) · board up · ready 2919 ms · guard samecard]: Yeh jawab sahi nahi hai. Blade ki lambai mat dekho. Sirf yeh dekho ki tester ke mukable kaun kitni khuli hai. Board par 4 cm wali aur 16 cm wali kainchi khuli hai; in dono mein angle kiska bada hai?
  > card: Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"4 cm blade","len":"short"},{"deg":55,"name":"16 cm blade"}]}}

**child:** the 4 cm one  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (1 miss) · board up · ready 1608 ms]: Bilkul sahi: 4 cm blade wali kainchi zyada khuli hai aur 16 cm blade wali kam, toh 4 cm wali ka angle bada hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > card: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"4 cm blade","len":"short"},{"deg":55,"name":"16 cm blade"}],"mark":{"index":0}}}

**child:** 3 cm wala  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 2018 ms · guard screen,mustsay,noconfirm]: Haan, bilkul theek, kyunki 3 cm wala zyada khula hai. Kainchi ke do blade ek angle banate hain. Kainchi ko thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par do kainchiyan hain: ek ke blade 20 cm ke, doosri ke 8 cm ke. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par do kainchiyan hain: ek ke blade 20 cm ke, doosri ke 8 cm ke. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** both equal  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2356 ms]: Sahi jawab. Dekho, 20 cm aur 8 cm blade wali dono kainchiyan ek jitni khuli hain, aur angle khulne se banta hai. Chalo, ab ek sawaal hum dono saath mein karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"20 cm blade"},{"deg":40,"name":"8 cm blade","len":"short"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1302 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain!

## Agent


