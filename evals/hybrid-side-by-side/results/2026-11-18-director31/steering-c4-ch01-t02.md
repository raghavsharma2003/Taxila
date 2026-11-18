# steering-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1720 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2041 ms]: Achha, pehle main dikhati hoon. Ludo board ke chaaron kone ek jaise hote hain. Aaj aise kone ko kaagaz se jaanchna seekhenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain, Hindi mein samkon. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 2386 ms · guard leak,twoq,uncorrected]: 6 sahi nahi hai. Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 4166 ms · guard screen,level]: Theek hai, ise doosre, aasaan shabdon mein kehti hoon. Is square ke sab kone ek jaise hi hain. Toh ismein poore kitne samkon hain?
  > card: Is square ke sab kone ek jaise hi hain. Toh ismein poore kitne samkon hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (2 miss) · board up · ready 3667 ms · guard screen,level]: Nahi, 6 theek nahi. Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1351 ms · guard mustsay,long]: Haan, bilkul theek. Dekho, square ke 4 kone, aur har kona right angle. Kaagaz ko do baar modo, toh uska kona right angle banta hai: yahi hamara tester hai. Tester kisi kone mein bilkul fit ho, beech mein koi khaali jagah na bache, tabhi woh kona right angle hai. Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2669 ms]: Board par baayein taraf tester ka kona hai, aur daayein taraf table ka kona. Tester rakhne par table ke kone mein khaali jagah bachi; kya table ka kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2326 ms]: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 3534 ms · guard leak,samecard,uncorrected]: Yeh jawab sahi nahi hai. Yaad karo, tester kab bilkul fit kehlata hai, aur phir dekho ki table ke kone mein kya bacha. Tester rakhne par table ke kone mein khaali jagah bachi; kya table ka kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 5092 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** nahi, fit nahi hua  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1863 ms · guard mustsay]: Haan, bilkul theek: tester aur kone ke beech khaali jagah bachi, toh tester bilkul fit nahi hua, aur woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli, par uske kone nahi badle. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** all 4  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2514 ms · guard leak,quiz,screenmismatch]: Sahi jawab, kyunki ghumaya hua square wahi square hai, toh uske 4 kone ab bhi right angle hain. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Khidki ka kona right angle hai ya nahi, yeh hamein ek saade kaagaz se jaanchna hai. Kaagaz se tester banane ke liye use kitni baar modna hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","4 right angle"]}}

**child:** do baar hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 4522 ms · guard leak]: Bilkul, do baar: pehle aadha, phir usko dobara aadha. Tester ko khidki ke kone mein rakho: tester bilkul fit hua, beech mein koi khaali jagah nahi, kyunki tester ke dono kinaare khidki ke kone se poore mil gaye. Tumhari baari: kya khidki ka kona right angle hai?
  > card: Tumhari baari: kya khidki ka kona right angle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** han  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2694 ms · guard leak]: Haan, sahi hai. Dekho, do baar moda kaagaz hi right angle ka tester hai, aur khidki ka kona usi jaisa nikla. Toh poora jawab: khidki ka kona right angle hai. Ab agla sawaal tumhare liye. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"right angle"}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 3489 ms · guard praise,affirms]: Kitaab ghumane se sirf uski disha badalti hai. Ab socho, uske kone badle ya wahi rahe. Kya ghuma kar tirchi rakhi kitaab ke kone ab bhi right angle hain?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tircha rakha"]}}

**child:** yes, they are still right angles  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 7538 ms · guard screen,leak]: Haan, bilkul theek: ghuma kar rakhne se kitaab ke kone nahi badalte, woh ab bhi right angle hain, toh Zoya sahi hai. Ab pehle wale sawaal ko phir se dekhte hain. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya yeh sahi hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** No  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 2652 ms · guard leak]: Sahi jawab, kyunki carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** No  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 2421 ms]: Yeh jawab sahi nahi hai. Ek aur tareeka dekhte hain. Ek square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar uske kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 1992 ms]: Abhi yeh sahi nahi hai. Photo wala darwaza bhi wahi darwaza hai, bas tircha chhapa hai. Socho, tircha hone se kone par kya asar hota hai. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 1997 ms]: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** haan, right angle hain  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 4716 ms · guard leak]: Haan, bilkul theek. Dekho, photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Chalo, pehle wale sawaal ki taraf wapas aate hain. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** yes  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1230 ms]: Sahi jawab, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai, aur tester us par bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2127 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2197 ms]: Achha, toh tumhe batting sabse achha lagta hai. Chalo, ab padhai aage badhate hain. Tester ka ek kinaara kone ki ek bhuja par rakho. Doosri bhuja tester ke andar rahe toh angle right angle se kam, bahar nikle toh zyada, aur kinaare par pade toh barabar. Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3582 ms · guard leak]: Tester ke dono kinaare dekho, aur socho ki nok ki doosri bhuja kahan ruki. Cake ke tukde ki nok par tester rakhne se doosri bhuja andar reh gayi; nok ka angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2033 ms]: Ek kitaab ka cover dheere-dheere kholo. Shuru mein cover aur panne ke beech ka angle right angle se kam hota hai, phir ek jagah tester bilkul fit hota hai, aur usse aage kholo toh angle right angle se zyada ho jaata hai. Ab phir se socho, jawab kya hoga?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 5311 ms · guard ask]: Tester ko kone par rakh kar sirf doosri bhuja dekho. Wahi batati hai ki angle right angle ke mukable kaisa hai. Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2703 ms]: Is sawaal ka sahi jawab: kam hai, kyunki cake ki nok ki doosri bhuja tester ke andar reh gayi, toh nok zyada nahi, kam khuli: right angle se kam. Yahan tak saaf hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 3875 ms · guard leak,long]: Angle khulne se bada hota hai, bhujaon ki lambai se nahi. P ki bhujayein chhoti hain aur Q ki lambi, par tester dono par bilkul fit hai, toh dono barabar hain. 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > card: 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"P","len":"short"},{"deg":90,"name":"Q"}]}}

**child:** 3 cm wala hai na  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 3527 ms · guard mustsay,long,noconfirm]: Haan, bilkul theek. Dekho, 3 cm wala zyada khula hai, toh woh bada. Kainchi ke do blade ek angle banate hain. Kainchi ko thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Ek kainchi ke blade 20 cm lambe hain, aur doosri ke 8 cm. Dono ko bilkul utna hi khola gaya. Kiska angle bada hai, ya dono barabar hain?
  > card: Ek kainchi ke blade 20 cm lambe hain, aur doosri ke 8 cm. Dono ko bilkul utna hi khola gaya. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1610 ms]: Haan, sahi hai: khulna ek jitna, toh angle barabar. Aao, agla sawaal main aur tum saath mein karenge. Rani ki rangoli mein kone P, Q, R ki bhujayein 9, 4, 3 cm hain. Tester par P ki doosri bhuja andar rahi, Q fit hua, R ki bahar nikli. Sabse bada angle chunne ke liye kya dekhoge: bhujaon ki lambai, ya khulna?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"20 cm blade"},{"deg":40,"name":"8 cm blade","len":"short"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1414 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


