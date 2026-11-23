# offtopic-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1725 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2598 ms · guard leak]: Theek hai, main shuru karti hoon. Ludo board ke kone dekho. Aaj kaagaz do baar mod kar tester banayenge, aur aise kone jaanchenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 883 ms · guard long]: Bilkul sahi: square ke 4 kone, aur har kona right angle. Do baar mode kaagaz ka kona right angle hai; yahi tester hai. Tester kisi kone mein bilkul fit ho, koi khaali jagah na bache, toh woh kona right angle hai. Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** no, it does not fit  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1681 ms · guard mustsay]: Haan, bilkul theek, kyunki table ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli, par uske kone nahi badle. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** sab  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2676 ms · guard screen]: Sahi jawab. Dekho, ghumaya hua square wahi square hai, toh uske 4 kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","4 right angle"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2989 ms · guard screen]: Tile tirchi lagi hai. Socho ki tester ka kona uske kone se kaise milega. Tile tirchi hai: uske kone par tester ko seedha hi rakhna theek hai, ya use bhi ghumana padega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2883 ms · guard screen]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3008 ms · guard screen,dodged]: Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** ghumake  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2377 ms · guard screen,long]: Haan, ghuma kar: tester ka kona tile ke kone par, kinaare bhujaon ke saath. Ghuma kar rakhne par tester tile ke kone mein bilkul fit hua; beech mein koi khaali jagah nahi bachi. Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** galat thi  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1871 ms · guard screen]: Bilkul sahi. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · beat s1:worked:worked · board up · ready 1835 ms]: Cricket ki baari aa gayi: uske baare mein thoda aur batao na?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 1988 ms]: Oh, chauka. Achha. Ab wapas apni padhai par aate hain. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2124 ms]: Kitaab ghumane se sirf uski disha badalti hai. Ab socho, uske kone badle ya wahi rahe. Kya ghuma kar tirchi rakhi kitaab ke kone ab bhi right angle hain?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tircha rakha"]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2476 ms · guard samecard]: Yeh tester hai. Tirchi kitaab ke kone par ise bhi utna hi ghuma kar rakhna hoga. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester"}]}}

**child:** han  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 2699 ms · guard long]: Bilkul sahi. Dekho, ghuma kar rakhne se kitaab ke kone nahi badalte, woh ab bhi right angle hain, toh Zoya sahi hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 1753 ms]: Haan, Hindi mein sunati hoon. Carrom board square hi hai, bas ghumaya gaya hai. Uske har kone ko ek-ek karke socho. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 2738 ms · guard long,uncorrected]: Nahi, yeh jawab nahi hai. Ise alag tareeke se dekhte hain. Ek square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar uske kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 2621 ms · guard samecard,uncorrected]: Yeh jawab sahi nahi hai. Photo wala darwaza bhi wahi darwaza hai, bas tircha chhapa hai. Socho, tircha hone se kone par kya asar hota hai. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 1906 ms]: Haan, pehle tum try karo.
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 1494 ms]: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** yes  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 (1 miss) · board up · ready 820 ms]: Bilkul sahi: photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** No hai na  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 1953 ms]: Haan, bilkul theek, kyunki carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** kam khula  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 2383 ms · guard praise,samecard,uncorrected]: Nahi, yeh jawab nahi hai. Patang ek square hai, bas tirchi ud rahi hai. Yaad karo, ghumane se square ke kone par kya asar hota hai. Tirchi udti square patang ke upar wale kone par tester ghuma kar rakho, toh kona kam khula hoga, bilkul fit, ya zyada khula?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** bilkul fit ho jayega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1932 ms]: Sahi jawab. Dekho, patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2516 ms · guard affirms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2567 ms · guard affirms]: Achha, toh tumhe chauka sabse achha lagta hai. Chalo, ab padhai aage badhate hain. Tester ka kona angle ke kone par rakho, aur uska ek seedha kinaara ek bhuja par. Doosri bhuja tester ke andar rahe toh angle right angle se kam, bahar nikle toh zyada, aur doosre kinaare par pade toh barabar. Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3346 ms · guard praise,affirms,leak]: Tester ka kona nok ke kone par aur ek kinaara ek bhuja par socho, aur dekho ki doosri bhuja kahan padti hai. Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 3148 ms · guard praise,affirms,leak]: Ek kitaab ka cover dheere-dheere kholo. Shuru mein cover aur panne ke beech ka angle right angle se kam hota hai, phir ek jagah tester bilkul fit hota hai, aur usse aage kholo toh angle right angle se zyada ho jaata hai. Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2432 ms · guard praise,affirms,leak]: Tester ko kone par rakh kar sirf doosri bhuja dekho. Wahi batati hai ki angle right angle ke mukable kaisa hai. Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 1421 ms]: Is sawaal ka sahi jawab: kam hai, kyunki cake ki nok par tester rakho toh doosri bhuja tester ke andar rehti hai: nok right angle se kam khuli hai. Yeh hissa saaf hua?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2262 ms · guard mustsay]: Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain aur B ki lambi, par tester dono par bilkul fit hai, toh dono barabar hain. Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > card: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"A","len":"short"},{"deg":90,"name":"B"}]}}

**child:** 3 cm wala angle  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 3772 ms · guard screen,mustsay,long,noconfirm]: Bilkul sahi: 3 cm wala zyada khula hai. Kainchi ke do blade ek angle banate hain. Kainchi ko thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par do kainchiyan hain: ek ke blade 20 cm ke, doosri ke 8 cm ke. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par do kainchiyan hain: ek ke blade 20 cm ke, doosri ke 8 cm ke. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** dono ek jaise  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1691 ms]: Haan, bilkul theek, kyunki 20 cm aur 8 cm blade wali dono kainchiyan ek jitni khuli hain, aur angle khulne se banta hai. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"20 cm blade"},{"deg":40,"name":"8 cm blade","len":"short"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1041 ms]: Aaj ke liye itna hi, phir milte hain!

## Agent


