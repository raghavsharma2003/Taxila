# stuck-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2694 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2218 ms]: Achha, pehle main dikhati hoon. Ludo board ke chaaron kone ek jaise hote hain. Aaj aise kone ko kaagaz se jaanchna seekhenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain, Hindi mein samkon. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2169 ms · guard leak]: Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 7805 ms · guard ask]: Achha, ise ek aasaan tareeke se kehti hoon. Is square ke sab kone ek jaise hi hain. Toh ismein poore kitne samkon hain?
  > card: Is square ke sab kone ek jaise hi hain. Toh ismein poore kitne samkon hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1257 ms · guard mustsay]: Bilkul sahi, kyunki square ke 4 kone, aur har kona right angle. Kaagaz ko do baar modo, toh uska kona right angle banta hai: yahi hamara tester hai. Tester kisi kone mein bilkul fit ho, beech mein koi khaali jagah na bache, tabhi woh kona right angle hai. Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 3980 ms · guard leak]: Yaad karo, tester kab bilkul fit kehlata hai, aur phir dekho ki table ke kone mein kya bacha. Tester rakhne par table ke kone mein khaali jagah bachi; kya table ka kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** nahin  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1636 ms · guard mustsay]: Haan, bilkul theek. Dekho, tester aur kone ke beech khaali jagah bachi, toh tester bilkul fit nahi hua, aur woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli, par uske kone nahi badle. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1740 ms]: Phir se dekho: Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 2783 ms · guard leak]: Board par do ek jaise square hain: pehla seedha rakha hai, aur doosra thoda ghuma kar tircha. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** chaar  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2372 ms · guard leak,screenmismatch]: Bilkul sahi, kyunki ghumaya hua square wahi square hai, toh uske 4 kone ab bhi right angle hain. Aao, agla sawaal main aur tum saath mein karenge. Khidki ka kona right angle hai ya nahi, yeh hamein ek saade kaagaz se jaanchna hai. Kaagaz se tester banane ke liye use kitni baar modna hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","4 right angle"]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3310 ms · guard quiz]: Yaad karo, tester banate waqt kaagaz ko ek baar mod kar ruk gaye the, ya usse aage bhi moda tha. Kaagaz se tester banane ke liye use kitni baar modna hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2011 ms]: Kaagaz ko aadha modo, phir dobara aadha modo: do baar moda kaagaz, yaani tester, kyunki do baar modne se kaagaz ka kona right angle banta hai. Tester ko khidki ke kone mein rakho: tester bilkul fit hua, beech mein koi khaali jagah nahi, kyunki tester ke dono kinaare khidki ke kone se poore mil gaye. Tumhari baari: kya khidki ka kona right angle hai?
  > card: Tumhari baari: kya khidki ka kona right angle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 1294 ms]: Socho, tester ke bilkul fit hone ka matlab kya hota hai. Kya khidki ka kona right angle hai?
  > card: Tumhari baari: kya khidki ka kona right angle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2361 ms]: Haan, pehle tum try karo.
  > card: Tumhari baari: kya khidki ka kona right angle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** no  _(incorrect)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (1 miss) · board up · ready 3171 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Board par khidki dekho. Hum ek saade kaagaz se tester banayenge, aur use khidki ke kone mein rakh kar dekhenge. Tumhari baari: kya khidki ka kona right angle hai?
  > card: Tumhari baari: kya khidki ka kona right angle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** no  _(incorrect)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (2 miss) · board up · ready 4174 ms · guard affirms]: Yeh jawab sahi nahi hai. Pehle kaagaz se tester banana hai, phir use khidki ke kone mein rakh kar dekhna hai ki woh kaise baithta hai. Kya khidki ka kona right angle hai?
  > card: Tumhari baari: kya khidki ka kona right angle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** yes, it is a right angle  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2574 ms]: Bilkul sahi. Dekho, do baar moda kaagaz hi right angle ka tester hai, aur khidki ka kona usi jaisa nikla. Toh poora jawab: khidki ka kona right angle hai. Ab ek sawaal tum akele karo. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"right angle"}}

**child:** No  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 2529 ms]: Abhi yeh sahi nahi hai. Ise doosri tarah samajhte hain. Ek square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar uske kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tircha rakha"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 3533 ms]: Nahi, yeh theek nahi hai. Photo wala darwaza bhi wahi darwaza hai, bas tircha chhapa hai. Socho, tircha hone se kone par kya asar hota hai. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 2099 ms]: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (2 miss) · board up · ready 1959 ms]: Nahi, yeh jawab nahi hai. Socho, tester ko ek square ke kone par gond se chipka diya, aur phir square ko ghumaya. Tester bhi square ke saath ghoomta hai, aur kone mein waise hi poora baitha rehta hai. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (3 miss) · board up · ready 1861 ms]: Yeh jawab sahi nahi hai. Tile ghumane se sirf uski disha badalti hai; uske kone wahi rehte hain. Ab phir se socho, jawab kya hoga?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** Yes hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 (1 miss) · board up · ready 4437 ms · guard leak]: Bilkul sahi: photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** Yes hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 6434 ms · guard screen,long,screenmismatch]: Haan, bilkul theek, kyunki ghuma kar rakhne se kitaab ke kone nahi badalte, woh ab bhi right angle hain, toh Zoya sahi hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** galat hai  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 4383 ms · guard leak]: Sahi jawab. Dekho, carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 3160 ms · guard samecard,uncorrected]: Nahi, yeh jawab nahi hai. Patang ek square hai, bas tirchi ud rahi hai. Yaad karo, ghumane se square ke kone par kya asar hota hai. Tirchi udti square patang ke upar wale kone par kya tester bilkul fit hoga?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** Yes hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1843 ms]: Haan, sahi hai: patang square hai, toh tirchi udne par bhi uska har kona right angle hai, aur tester us par bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2369 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Abhi apne kaam par wapas chalte hain. Tester ka ek kinaara kone ki ek bhuja par rakho. Doosri bhuja tester ke andar rahe toh angle right angle se kam, bahar nikle toh zyada, aur kinaare par pade toh barabar. Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2200 ms]: Tester ke dono kinaare dekho, aur socho ki nok ki doosri bhuja kahan ruki. Cake ke tukde ki nok par tester rakhne se doosri bhuja andar reh gayi; nok ka angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3319 ms · guard long]: Ek kitaab ka cover dheere-dheere kholo. Shuru mein cover aur panne ke beech ka angle right angle se kam hota hai, phir ek jagah tester bilkul fit hota hai, aur usse aage kholo toh angle right angle se zyada ho jaata hai. Ab phir se socho, jawab kya hoga?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3839 ms · guard long]: Tester ko kone par rakh kar sirf doosri bhuja dekho. Wahi batati hai ki angle right angle ke mukable kaisa hai. Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2829 ms]: Is sawaal ka sahi jawab: kam hai, kyunki cake ki nok ki doosri bhuja tester ke andar reh gayi, toh nok zyada nahi, kam khuli: right angle se kam. Yahan tak theek hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:explain:e1 · board up · ready 1901 ms]: Right angle hota toh doosri bhuja tester ke kinaare par padti; woh usse pehle hi ruk gayi, isliye nok kam khuli hai. Ab tak samajh aaya?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2311 ms]: Main ise aur aasaan nahi bol paa rahi, koi baat nahi. Cricket ki baari aa gayi: uske baare mein thoda aur batao na?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2674 ms]: Achha, chauka! Theek hai. Ab phir se apne kaam par lagte hain. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. P ki bhujayein chhoti hain aur Q ki lambi, par tester dono par bilkul fit hai, toh dono barabar hain. 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > card: 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · board up · ready 2813 ms · guard long]: Nahi, yeh jawab nahi hai. Ek aur tareeka dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Yahan tak saaf hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 2458 ms]: 4 cm blade wali kainchi tester se zyada khuli hai, aur 16 cm blade wali tester se kam. Kiska angle bada hai?
  > card: 4 cm blade wali kainchi tester se zyada khuli hai, aur 16 cm blade wali tester se kam. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"4 cm blade","len":"short"},{"deg":60,"name":"16 cm blade"}]}}

**child:** 16 cm wali  _(misconception)_

**Asha** [hint · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length (1 miss) · board up · ready 3530 ms · guard flat]: Yeh jawab sahi nahi hai. Blade ki lambai mat dekho. Sirf yeh dekho ki tester ke mukable kaun kitni khuli hai. 4 cm blade wali kainchi tester se zyada aur 16 cm wali kam khuli; kiska angle bada hai?
  > card: 4 cm blade wali kainchi tester se zyada khuli hai, aur 16 cm blade wali tester se kam. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"4 cm blade","len":"short"},{"deg":60,"name":"16 cm blade"}]}}

**child:** 4 cm wali kainchi  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (1 miss) · board up · ready 2380 ms]: Bilkul sahi, kyunki 4 cm blade wali tester se zyada khuli aur 16 cm blade wali kam, toh 4 cm wali ka angle bada. Chalo, ab pichhle sawaal par wapas chalte hain. 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > card: 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"4 cm blade","len":"short"},{"deg":60,"name":"16 cm blade"}],"mark":{"index":0}}}

**child:** 3 cm wala  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 2652 ms · guard mustsay,long]: Haan, bilkul theek. Dekho, 3 cm wala zyada khula hai, toh woh bada. Kainchi ke do blade ek angle banate hain. Kainchi ko thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Ek kainchi ke blade 20 cm lambe hain, aur doosri ke 8 cm. Dono ko bilkul utna hi khola gaya. Kiska angle bada hai, ya dono barabar hain?
  > card: Ek kainchi ke blade 20 cm lambe hain, aur doosri ke 8 cm. Dono ko bilkul utna hi khola gaya. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** dono same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1282 ms]: Sahi jawab, kyunki khulna ek jitna, toh angle barabar. Chalo, ab ek sawaal hum dono saath mein karte hain. Rani ki rangoli mein kone P, Q, R ki bhujayein 9, 4, 3 cm hain. Tester par P ki doosri bhuja andar rahi, Q fit hua, R ki bahar nikli. Sabse bada angle chunne ke liye kya dekhoge: bhujaon ki lambai, ya khulna?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"20 cm blade"},{"deg":40,"name":"8 cm blade","len":"short"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1091 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain!

## Agent


