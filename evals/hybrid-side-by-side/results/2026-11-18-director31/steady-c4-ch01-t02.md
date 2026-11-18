# steady-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2518 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Chalo, shuru karein?

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 3447 ms · guard screen,long]: Ludo board ke chaaron kone ek jaise hote hain. Aaj aise kone ko kaagaz se jaanchna seekhenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain, Hindi mein samkon. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 5  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 2516 ms · guard screen,leak]: 5 sahi nahi hai. Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 3587 ms · guard screen,level]: Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 2  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (2 miss) · board up · ready 2881 ms · guard leak,uncorrected]: Nahi, 2 theek nahi. Apni kitaab ka kona dekho. Square ka har kona bilkul waisa hi hai, aur aise kone ka naam right angle hai. Toh ab batao, kya aayega?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 4  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1380 ms]: Sahi jawab, kyunki square ke 4 kone, aur har kona right angle. Kaagaz ko do baar modo, toh uska kona right angle banta hai: yahi hamara tester hai. Tester kisi kone mein bilkul fit ho, beech mein koi khaali jagah na bache, tabhi woh kona right angle hai. Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1916 ms]: Tester rakhne par table ke kone mein khaali jagah bachi; kya table ka kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 2341 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Yaad karo, tester kab bilkul fit kehlata hai, aur phir dekho ki table ke kone mein kya bacha. Ab phir se socho, jawab kya hoga?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 1798 ms]: Board par baayein taraf tester ka kona hai, aur daayein taraf table ka kona. Tester rakhne par table ke kone mein khaali jagah bachi; kya table ka kona right angle hai?
  > card: Tester ko table ke ek kone mein rakha, aur beech mein khaali jagah bach gayi. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** right angle nahi hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1932 ms · guard mustsay]: Haan, sahi hai. Dekho, tester aur kone ke beech khaali jagah bachi, toh tester bilkul fit nahi hua, aur woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli, par uske kone nahi badle. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":110,"name":"table ka kona"}]}}

**child:** 0  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 1192 ms]: Nahi, 0 theek nahi. Ek aur tareeka dekhte hain. Ek square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar uske kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** yes  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 (1 miss) · board up · ready 1163 ms]: Sahi jawab, kyunki photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** 4  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3429 ms · guard ignored]: Bilkul sahi: ghumaya hua square wahi square hai, toh uske 4 kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Khidki ka kona right angle hai ya nahi, yeh hamein ek saade kaagaz se jaanchna hai. Kaagaz se tester banane ke liye use kitni baar modna hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","4 right angle"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3001 ms · guard affirms]: Haan, pehle tum try karo. Dhyaan se suno. Kaagaz se tester banane ke liye use kitni baar modna hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** 2 baar  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2100 ms · guard leak]: Bilkul, do baar: pehle aadha, phir usko dobara aadha. Tester ko khidki ke kone mein rakho: tester bilkul fit hua, beech mein koi khaali jagah nahi, kyunki tester ke dono kinaare khidki ke kone se poore mil gaye. Tumhari baari: kya khidki ka kona right angle hai?
  > card: Tumhari baari: kya khidki ka kona right angle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"yeh kona"}}

**child:** Yes hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 3715 ms · guard leak]: Haan, sahi hai. Dekho, do baar moda kaagaz hi right angle ka tester hai, aur khidki ka kona usi jaisa nikla. Toh poora jawab: khidki ka kona right angle hai. Ab agla sawaal tumhare liye. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","name":"khidki","corner":"right angle"}}

**child:** yes, they are still right angles  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 5674 ms · guard screen,leak]: Sahi jawab, kyunki ghuma kar rakhne se kitaab ke kone nahi badalte, woh ab bhi right angle hain, toh Zoya sahi hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 5131 ms · guard affirms,leak,long,ask]: Achha, ise ek aasaan tareeke se kehti hoon. Square carrom board ko ghuma ke tircha rakh diya. Zoya ka kehna hai ki ab uske bas do kone samkon bache; kya yeh baat theek hai?
  > card: Square carrom board ko ghuma ke tircha rakh diya. Zoya ka kehna hai ki ab uske bas do kone samkon bache; kya yeh baat theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** No hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 3304 ms · guard leak]: Bilkul sahi: carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 2389 ms]: Tirchi udti square patang ke upar wale kone par kya tester bilkul fit hoga?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester rakho: kya tester bilkul fit hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** fit hoga  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1389 ms]: Haan, sahi hai, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai, aur tester us par bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3292 ms · guard long]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2399 ms]: Achha, toh tumhe batting sabse achha lagta hai. Chalo, ab padhai aage badhate hain. Tester ka ek kinaara kone ki ek bhuja par rakho. Doosri bhuja tester ke andar rahe toh angle right angle se kam, bahar nikle toh zyada, aur kinaare par pade toh barabar. Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3767 ms · guard leak]: Tester ke dono kinaare dekho, aur socho ki nok ki doosri bhuja kahan ruki. Cake ke tukde ki nok par tester rakhne se doosri bhuja andar reh gayi; nok ka angle right angle se kam hai ya zyada?
  > card: Cake ke tukde ki nok par tester rakha: doosri bhuja tester ke andar reh gayi. Yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** less than a right angle  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2374 ms · guard long]: Sahi jawab. Dekho, bhuja tester ke andar rahi, toh kam khula. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. P ki bhujayein chhoti hain aur Q ki lambi, par tester dono par bilkul fit hai, toh dono barabar hain. 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > card: 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":45,"name":"cake ki nok"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · board up · ready 2514 ms]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Yahan tak theek hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · board up · ready 2003 ms]: Apni dono baahein V ki tarah phailao, aur phir haathon mein do lambi lakdiyan pakad lo. Baahein ab lambi lagti hain, par kandhe par unke beech ka khulna wahi hai, toh angle bhi wahi hai. Ab tak samajh aaya?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"do pencil","len":"short"},{"deg":50,"name":"pencil jodo"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 2869 ms]: 4 cm blade wali kainchi tester se zyada khuli hai, aur 16 cm blade wali tester se kam. Kiska angle bada hai?
  > card: 4 cm blade wali kainchi tester se zyada khuli hai, aur 16 cm blade wali tester se kam. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"4 cm blade","len":"short"},{"deg":60,"name":"16 cm blade"}]}}

**child:** 4 cm wali hai na  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (1 miss) · board up · ready 2348 ms]: Haan, sahi hai: 4 cm blade wali tester se zyada khuli aur 16 cm blade wali kam, toh 4 cm wali ka angle bada. Chalo, ab pichhle sawaal par wapas chalte hain. 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > card: 3 cm bhujaon wala angle right angle se zyada khula hai, aur 12 cm bhujaon wala right angle se kam. Kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"4 cm blade","len":"short"},{"deg":60,"name":"16 cm blade"}],"mark":{"index":0}}}

**child:** 3 cm  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 1439 ms · guard mustsay,noconfirm]: Sahi jawab, kyunki 3 cm wala zyada khula hai, toh woh bada. Kainchi ke do blade ek angle banate hain. Kainchi ko thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Ek kainchi ke blade 20 cm lambe hain, aur doosri ke 8 cm. Dono ko bilkul utna hi khola gaya. Kiska angle bada hai, ya dono barabar hain?
  > card: Ek kainchi ke blade 20 cm lambe hain, aur doosri ke 8 cm. Dono ko bilkul utna hi khola gaya. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** dono same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2351 ms]: Bilkul sahi. Dekho, khulna ek jitna, toh angle barabar. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Rani ki rangoli mein kone P, Q, R ki bhujayein 9, 4, 3 cm hain. Tester par P ki doosri bhuja andar rahi, Q fit hua, R ki bahar nikli. Sabse bada angle chunne ke liye kya dekhoge: bhujaon ki lambai, ya khulna?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"20 cm blade"},{"deg":40,"name":"8 cm blade","len":"short"}]}}

**child:** khulna hai na  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch01-t02-s2:ask:worked · board up · ready 4789 ms · guard affirms,leak]: Bilkul, khulna: bhujaon ki lambai se angle bada nahi hota. Tumhari baari: teeno mein sabse bada angle kaunsa hai?
  > card: Tumhari baari: teeno mein sabse bada angle kaunsa hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}]}}

**child:** R  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch01-t02-s2:c1 · board up · ready 1713 ms]: Haan, bilkul theek. Toh poora jawab: teeno mein R sabse bada angle hai, kyunki P ki bhujayein sabse lambi hain, par lambi bhujaon se angle bada nahi hota. Ab ek sawaal tum akele karo. Ek badi kitaab ke panne 30 cm lambe hain. Tester ka ek kinaara ek panne par rakha, toh doosra panna tester ke andar hi reh gaya. Panno ke beech ka angle right angle se kam hai ya zyada?
  > card: Ek badi kitaab ke panne 30 cm lambe hain. Tester ka ek kinaara ek panne par rakha, toh doosra panna tester ke andar hi reh gaya. Panno ke beech ka angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}],"mark":{"index":2}}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:check:c1 · check script:c4-maths-ch01-t02-s2:c1 (1 miss) · board up · ready 3866 ms · guard leak,samecard]: Abhi yeh sahi nahi hai. Panno ki lambai abhi chhod do. Bas yeh dekho ki doosra panna tester ke mukable kahan ruka. 30 cm lambe panno wali kitaab mein doosra panna tester ke andar reh gaya, toh panno ke beech ka angle right angle se kam hai ya zyada?
  > card: Ek badi kitaab ke panne 30 cm lambe hain. Tester ka ek kinaara ek panne par rakha, toh doosra panna tester ke andar hi reh gaya. Panno ke beech ka angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":70,"name":"panne"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** right angle se kam  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch01-t02-s2:c2 · board up · ready 1931 ms]: Sahi jawab. Dekho, doosra panna tester ke andar reh gaya, toh panne kam khule hain, zyada nahi; 30 cm lambai ise nahi badalti. Ek darwaze ke kone ki ek bhuja 2 m lambi hai, aur tester us kone par bilkul fit hota hai. Yeh angle right angle se kam hai, barabar hai, ya zyada?
  > card: Ek darwaze ke kone ki ek bhuja 2 m lambi hai, aur tester us kone par bilkul fit hota hai. Yeh angle right angle se kam hai, barabar hai, ya zyada?
  > screen: board compare@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":70,"name":"panne"},{"deg":90,"name":"tester","len":"short"}]}}

**child:** equal to a right angle  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c4-maths-ch01-t02-s2:c3 · board up · ready 2560 ms]: Haan, sahi hai: tester bilkul fit hai, toh right angle ke barabar. Ab pehle wale sawaal ko phir se dekhte hain. Ghadi ki minute wali sui lambi hoti hai, aur 3 baje dono suiyan right angle banati hain. Zoya ka kehna hai ki minute wali sui aur lambi kar dein, toh 3 baje ka angle right angle se bada ho jaayega. Kya yeh sahi hai?
  > card: Ghadi ki minute wali sui lambi hoti hai, aur 3 baje dono suiyan right angle banati hain. Zoya ka kehna hai ki minute wali sui aur lambi kar dein, toh 3 baje ka angle right angle se bada ho jaayega. Kya yeh sahi hai?
  > screen: board angle@1 {} · ref {"template":"compare@1","params":{"left":{"title":"Bhuja","items":["2 m lambi"]},"right":{"title":"Tester","items":["bilkul fit"]}}}

**child:** No  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1459 ms]: Bilkul sahi, kyunki sui lambi kar dein, tab bhi 3 baje suiyon ka khulna nahi badalta, toh angle right angle hi rahega. Ab ek aisi shape aayegi jismein koi kona hi nahi hota: circle, jise hum string se banayenge. Ab tak samajh aaya?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"3 baje"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 · board up · ready 4302 ms · guard affirms,mustsay,long]: String ka ek sira dabakar rakho: yahi centre hai. Doosre sire par pencil baandho, string tight rakhkar ghumao: pencil har jagah centre se string jitni door rehti hai. Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ka kehna hai ki doosra point 5 cm door hai. Kya yeh sahi hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ka kehna hai ki doosra point 5 cm door hai. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string"}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 (1 miss) · board up · ready 2267 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Socho, string tight rakhne par pencil kabhi centre ke paas aati hai ya door jaati hai kya. Jis circle ke kinaare ka ek point centre se 4 cm door hai, kya uska koi doosra point 5 cm door ho sakta hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ka kehna hai ki doosra point 5 cm door hai. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string"}}

**child:** no  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 · board up · ready 1325 ms · guard mustsay]: Sahi jawab. Dekho, kinaare ka har point 4 cm door, 5 cm nahi. Sikke ke kinaare ka har point centre se barabar door hai, isliye sikka circle hai. Jis gol cheez mein yeh doori kahin kam aur kahin zyada ho, woh gol toh hai, par circle nahi. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"har point 4 cm"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle · board up · ready 3593 ms · guard leak,uncorrected]: Nahi, yeh theek nahi hai. Ise doosri tarah samajhte hain. Ek circle string se banao, ek oval haath se. Dono mein centre se kinaare tak kai jagah naapo: circle mein har jagah wahi doori aati hai, oval mein doori badalti hai. 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"sikka"}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s3:check:then:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle (1 miss) · board up · ready 3382 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Circle mein har point centre se string jitna door hota hai. Socho, dheeli string se yeh doori har jagah wahi rahegi kya. 12 cm string beech mein dheeli ho jaane se bani gol shape kya circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","name":"tight string se"}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s3:check:then:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle (2 miss) · board up · ready 2325 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Ek phoola hua balloon do haathon se dabao, toh woh ek taraf lamba ho jaata hai. Ab uske centre se kinaara ek taraf door hai aur doosri taraf paas, isliye dabaa hua balloon gol hai, par circle nahi. Ab phir se socho, jawab kya hoga?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","name":"tight string se"}}

**child:** nahi, circle nahi hai  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 (1 miss) · board up · ready 3840 ms · guard noconfirm]: Haan, sahi hai: string tight nahi rahi, beech mein dheeli hui, toh har point 12 cm door nahi raha: gol hai, circle nahi. Chalo, pehle wale sawaal ki taraf wapas aate hain. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","name":"tight string se"}}

**child:** circle nahi hai  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c4-maths-ch01-t02-s3:ask:e3 · board up · ready 4006 ms · guard mustsay,long]: Sahi jawab, kyunki doori 8 cm aur 10 cm, barabar nahi. Khoonte se 3 m ki rassi baandho, aur doosre sire par chalk. Rassi tight rakhkar chalo, toh chalk ka har nishaan khoonte se 3 m door aata hai. Zameen par teen nishaan hain: khoonte se 3 m, 4 m aur 3 m door. Inmein se kaunsa nishaan is circle par nahi hai?
  > card: Zameen par teen nishaan hain: khoonte se 3 m, 4 m aur 3 m door. Inmein se kaunsa nishaan is circle par nahi hai?
  > screen: board measured@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"sikka"}}

**child:** chaar metre wala  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 2354 ms · guard invented]: Bilkul sahi. Dekho, 3 m ki rassi se har nishaan khoonte se 3 m door aata hai; 4 m wala nishaan circle par nahi. Aao, agla sawaal main aur tum saath mein karenge. Pooja 50 cm ki tight string se rangoli ka circle banati hai. Phir ek kinaare se centre se hote hue doosre kinaare tak seedhi line kheenchti hai. Pehle socho: kinaare ka koi bhi point centre se kitni door hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"circle","unit":"m","r":3}}

**child:** 50 cm  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked · board up · ready 3328 ms · guard affirms]: Bilkul, 50 cm: tight string har point ko utna hi door rakhti hai. Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"circle","unit":"cm","r":50}}

**child:** 50 cm  _(incorrect)_

**Asha** [hint · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked (1 miss) · board up · ready 3100 ms · guard uncorrected]: 50 cm sahi nahi hai. Line centre par rukti nahi; woh centre ke us paar bhi kinaare tak jaati hai. 50 cm string wale circle mein kinaare se centre se hote hue kinaare tak line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board measured@1 {} · ref {"template":"measured@1","params":{"shape":"circle","unit":"cm","r":50}}

**child:** 1 m  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 · board up · ready 1327 ms]: Haan, sahi hai. Toh poora jawab: poori line 100 cm lambi hai, kyunki centre se hokar jaane wali line mein string jitni doori do baar aati hai. Chalo, ab tumhari apni baari. Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > card: Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","diameter":"100 cm"}}

**child:** dono  _(misconception)_

**Asha** [hint · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 (1 miss) · board up · ready 2243 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Gol dikhna kaafi nahi hai. Socho, kiski shape mein har point centre se pakka ek jitna door rahega. Haath se bane gol aur tight string se bane gol mein, pakka circle kaunsa hai?
  > card: Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","name":"rangoli"}}

**child:** string wala  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c4-maths-ch01-t02-s3:c2 · board up · ready 1394 ms]: Sahi jawab. Dekho, Pooja ne tight string se banaya, toh har point barabar door hai; haath se bane gol mein doori badal sakti hai. Chalo, ab pichhle sawaal par wapas chalte hain. Zoya ne ek gol ghadi ke centre se uske kinaare tak kai jagah naapa, aur har baar 7 cm aaya. Zoya ka kehna hai ki ghadi ka kinaara circle hai. Kya yeh sahi hai?
  > card: Zoya ne ek gol ghadi ke centre se uske kinaare tak kai jagah naapa, aur har baar 7 cm aaya. Zoya ka kehna hai ki ghadi ka kinaara circle hai. Kya yeh sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"tight string","name":"Pooja ka"}}

**child:** Yes  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c4-maths-ch01-t02-s3:c3 · board up · ready 1255 ms]: Bilkul sahi, kyunki ghadi ke kinaare ka har point centre se 7 cm door hai, aur circle mein har point barabar door hota hai. Ek chudi aur ek anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > card: Ek chudi aur ek anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"7 cm","name":"ghadi"}}

**child:** chudi hai na  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 801 ms]: Haan, bilkul theek: dono gol hain, par chudi ka kinaara har taraf centre se barabar door hai aur anda ek taraf lamba hai. Jaane se pehle, aaj ki saari baaton par ek aakhri sawaal. Ek square tile ki har bhuja 30 cm hai, aur use ghuma kar tircha rakha hai. Uske ek kone par tester rakhoge, toh kona tester se kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"chudi"}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 1720 ms]: Do baatein ek-ek karke socho: tile ko ghumane se uska kona badla kya, aur lambi bhuja se kona zyada khula kya. Ek square tile ki har bhuja 30 cm hai, aur use ghuma kar tircha rakha hai. Uske ek kone par tester rakhoge, toh kona tester se kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","ghumayi hui"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1328 ms]: Iska jawab hai bilkul fit, kyunki tile square hai, toh uska har kona right angle hai; ghumane se kona nahi badalta, aur 30 cm lambi bhuja se kona zyada nahi khulta, isliye tester bilkul fit hoga. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","bilkul fit"]}}

**child:** pata nahi kaise, bas laga  _(no_evidence)_

**Asha** [wrap · ready 1844 ms]: Theek hai, main yeh yaad rakhungi. Aaj dekha ki right angle kitaab ke kone jaisa hota hai, aur ghumane se kona nahi badalta. Phir tester se dekha ki angle khulne se bada hota hai, bhujaon ki lambai se nahi. Aakhir mein circle aaya: uske kinaare ka har point centre se barabar door hota hai. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 1484 ms]: Hmm, samajh gayi, batane ke liye shukriya. Aaj tumne chudi aur ande mein se circle chuna. Aaj ke liye itna hi, phir milte hain!

## Agent


