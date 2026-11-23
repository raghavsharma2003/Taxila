# steady-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1797 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Chalo, shuru karein?

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2341 ms · guard long]: Ludo board ke kone dekho. Aaj kaagaz do baar mod kar tester banayenge, aur aise kone jaanchenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 5  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 1523 ms · guard leak,uncorrected]: 5 sahi nahi hai. Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 3542 ms · guard leak]: Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 2  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (2 miss) · board up · ready 3200 ms · guard screen,level,leak,uncorrected]: Nahi, 2 theek nahi. Apni kitaab ka kona dekho. Square ka har kona bilkul waisa hi hai, aur aise kone ka naam right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 4  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 989 ms · guard mustsay,long]: Sahi jawab, kyunki square ke 4 kone, aur har kona right angle. Do baar mode kaagaz ka kona right angle hai; yahi tester hai. Tester kisi kone mein bilkul fit ho, koi khaali jagah na bache, toh woh kona right angle hai. Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1632 ms]: Hamare tester ke paas bane table ke kone ko dekho: kya table ka kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 2958 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. Tester ka kona table ke kone par socho, aur dekho ki dono bhujayein tester ke dono kinaaron ke saath milti hain ya nahi. Ab phir se socho, jawab kya hoga?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 1622 ms]: Ab table ke kone par bhi tester rakha hai: tester ka kona table ke kone par, aur ek seedha kinaara ek bhuja ke saath. Ab table ke kone ki doosri bhuja dekho. Hamare tester ke paas bane table ke kone ko dekho: kya table ka kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** zyada khula hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1763 ms · guard mustsay,noconfirm]: Haan, sahi hai. Dekho, table ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli, par uske kone nahi badle. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** 0  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 1759 ms · guard long,twoq]: Nahi, 0 theek nahi. Ek aur tareeka dekhte hain. Ek square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar uske kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** yes, they are right angles  _(correct)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 (1 miss) · board up · ready 1793 ms]: Sahi jawab, kyunki photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","right angle"]}}

**child:** 4  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1712 ms · guard screen]: Bilkul sahi: ghumaya hua square wahi square hai, toh uske 4 kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","4 right angle"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3310 ms · guard screen]: Haan, pehle tum try karo. Dhyaan se suno. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** tile ke saath ghuma kar  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2585 ms · guard screen,leak,long]: Haan, ghuma kar: tester ka kona tile ke kone par, kinaare bhujaon ke saath. Ghuma kar rakhne par tester tile ke kone mein bilkul fit hua; beech mein koi khaali jagah nahi bachi. Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** nahin  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 3922 ms · guard deny,screen,leak,long]: Haan, sahi hai. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Ab agla sawaal tumhare liye. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** ji haan  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 2456 ms · guard long]: Sahi jawab. Dekho, ghuma kar rakhne se kitaab ke kone nahi badalte, woh ab bhi right angle hain, toh Zoya sahi hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 4659 ms · guard screen,leak]: Haan, Hindi mein sunati hoon. Carrom board square hi hai, bas ghumaya gaya hai. Uske har kone ko ek-ek karke socho. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** nahin  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 764 ms]: Bilkul sahi: carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 1662 ms]: Tirchi udti square patang ke upar wale kone par tester ghuma kar rakho, toh kona kam khula hoga, bilkul fit, ya zyada khula?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** it fits exactly  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1815 ms]: Haan, sahi hai, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3613 ms · guard affirms,twoq]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2772 ms · guard affirms]: Achha, toh tumhe batting sabse achha lagta hai. Chalo, ab padhai aage badhate hain. Tester ka kona angle ke kone par rakho, aur uska ek seedha kinaara ek bhuja par. Doosri bhuja tester ke andar rahe toh angle right angle se kam, bahar nikle toh zyada, aur doosre kinaare par pade toh barabar. Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 4005 ms · guard praise,affirms,leak,twoq]: Tester ka kona nok ke kone par aur ek kinaara ek bhuja par socho, aur dekho ki doosri bhuja kahan padti hai. Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** smaller  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 876 ms]: Sahi jawab. Dekho, doosri bhuja tester ke andar rehti hai. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain aur B ki lambi, par tester dono par bilkul fit hai, toh dono barabar hain. Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > card: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 2118 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Ise alag tareeke se dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > card: Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 16 cm wali  _(misconception)_

**Asha** [hint · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length (1 miss) · board up · ready 2506 ms · guard samecard,screenmismatch]: Nahi, yeh theek nahi hai. Blade ki lambai mat dekho. Sirf yeh dekho ki tester ke mukable kaun kitni khuli hai. Board par 4 cm wali aur 16 cm wali kainchi khuli hai; in dono mein angle kiska bada hai?
  > card: Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"4 cm blade","len":"short"},{"deg":55,"name":"16 cm blade"}]}}

**child:** 4 cm one  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (1 miss) · board up · ready 734 ms]: Haan, sahi hai: 4 cm blade wali kainchi zyada khuli hai aur 16 cm blade wali kam, toh 4 cm wali ka angle bada hai. Chalo, pehle wale sawaal ki taraf wapas aate hain. Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > card: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"4 cm blade","len":"short"},{"deg":55,"name":"16 cm blade"}],"mark":{"index":0}}}

**child:** 12 cm wala  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (2 miss) · board up · ready 1505 ms]: Nahi, yeh jawab nahi hai. Bhujaon ki lambai abhi chhod do. Dono ka khulna right angle se milao, aur dekho kaun zyada khula hai. Board par 3 cm bhujaon wala aur 12 cm bhujaon wala angle hai; kiska khulna zyada hai?
  > card: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 3 cm  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 1994 ms · guard screen,mustsay]: Sahi jawab, kyunki 3 cm wala zyada khula hai. Kainchi ke do blade ek angle banate hain. Kainchi ko thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par do kainchiyan hain: ek ke blade 20 cm ke, doosri ke 8 cm ke. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par do kainchiyan hain: ek ke blade 20 cm ke, doosri ke 8 cm ke. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1440 ms]: Bilkul sahi. Dekho, 20 cm aur 8 cm blade wali dono kainchiyan ek jitni khuli hain, aur angle khulne se banta hai. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"20 cm blade"},{"deg":40,"name":"8 cm blade","len":"short"}]}}

**child:** less than a right angle  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c4-maths-ch01-t02-s2:ask:worked · board up · ready 3610 ms · guard leak]: Haan, kam: P ki doosri bhuja tester ke andar hi rehti hai. Q par tester rakho: tester bilkul fit hota hai, toh Q right angle ke barabar hai. Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > card: Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}]}}

**child:** R hai na  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c4-maths-ch01-t02-s2:c1 · board up · ready 2879 ms]: Haan, sahi hai. Toh poora jawab: teeno mein R sabse bada angle hai, kyunki R ki doosri bhuja tester se bahar nikli, toh R right angle se bhi zyada khula hai. Ab ek sawaal tum akele karo. Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai ya zyada?
  > card: Ek badi kitaab ke panne 30 cm lambe hain, aur kitaab khuli rakhi hai. Panno ke beech ka yeh angle right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"P"},{"deg":90,"name":"Q","len":"short"},{"deg":130,"name":"R","len":"short"}],"mark":{"index":2}}}

**child:** kam hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c4-maths-ch01-t02-s2:c2 · board up · ready 2650 ms · guard screen]: Haan, bilkul theek. Dekho, doosra panna tester ke andar reh jaata hai, toh panne kam khule hain; 30 cm ki lambai ise nahi badalti. Ek khilona laptop khula rakha hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar hai, ya zyada?
  > card: Ek khilona laptop khula rakha hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar hai, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":65,"name":"kitaab ke panne"}]}}

**child:** kam  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c4-maths-ch01-t02-s2:c2 (1 miss) · board up · ready 2597 ms · guard screen,affirms,leak,samecard]: Abhi yeh sahi nahi hai. Bhujaon ki lambai chhodo. Tester ka ek kinaara keyboard par socho, aur dekho ki screen kahan padti hai. 4 cm lambi screen aur keyboard wala khilona laptop khula hai; unke beech ka angle right angle se kam hai, barabar, ya zyada?
  > card: Ek khilona laptop khula rakha hai; uski screen aur keyboard sirf 4 cm lambe hain. Screen aur keyboard ke beech ka angle right angle se kam hai, barabar hai, ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"khilona laptop","len":"short"}]}}

**child:** zyada khula  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c4-maths-ch01-t02-s2:c3 · board up · ready 975 ms]: Sahi jawab, kyunki khilona laptop ki screen tester se bahar nikalti hai, toh angle right angle se zyada hai; chhoti bhujayein khulna kam nahi karti. Ek chhoti ghadi aur ek badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ki suiyon ke beech ka angle bada hai. Kis ghadi ka angle bada hai, ya dono barabar hain?
  > card: Ek chhoti ghadi aur ek badi ghadi, dono mein 2 baje hain. Zoya ka kehna hai ki badi ghadi ki suiyon ke beech ka angle bada hai. Kis ghadi ka angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"khilona laptop","len":"short"}]}}

**child:** dono ek jaise  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 2080 ms]: Bilkul sahi: 2 baje chhoti ghadi aur badi ghadi ki suiyan ek jitni khuli hain, toh dono angle barabar hain. Ab ek aisi shape aayegi jismein koi kona hi nahi hota: circle, jise hum string se banayenge. Ab tak samajh aaya?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"chhoti ghadi","len":"short"},{"deg":60,"name":"badi ghadi"}]}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c4-maths-ch01-t02-s3:ask:e1 · board up · ready 3453 ms · guard screen,leak,long]: String ka ek sira dabao: yahi centre hai. Doosre sire ki pencil ko string tight rakh kar ghumao; pencil har jagah centre se string jitni door rehti hai. Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > card: Is circle ke kinaare ka ek point centre se 4 cm door hai. Zoya ke hisaab se doosra point 5 cm door hai. Kya aisa ho sakta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string"}}

**child:** No  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 · board up · ready 1072 ms · guard mustsay]: Haan, sahi hai, kyunki kinaare ka har point 4 cm door, 5 cm nahi. Sikke ka har kinaare wala point centre se barabar door hai, isliye sikka circle hai. Jis gol cheez mein yeh doori badle, woh circle nahi. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"har point 4 cm"}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c4-maths-ch01-t02-m-round-is-circle · check script:c4-maths-ch01-t02-s3:then:c4-maths-ch01-t02-m-round-is-circle · board up · ready 3457 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. Ise doosri tarah samajhte hain. Ek circle string se banao, ek oval haath se. Dono mein centre se kinaare tak kai jagah naapo: circle mein har jagah wahi doori aati hai, oval mein doori badalti hai. 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > card: 12 cm ki string ghumate waqt beech mein dheeli ho gayi. Kya bani hui gol shape circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"sikka"}}

**child:** no, it is not a circle  _(correct)_

**Asha** [practice · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 (1 miss) · board up · ready 2907 ms · guard noconfirm]: Sahi jawab. Dekho, string tight nahi rahi, beech mein dheeli hui, toh har point 12 cm door nahi raha: gol hai, circle nahi. Chalo, ab pichhle sawaal par wapas chalte hain. Jis roti ka kinaara centre se ek taraf 8 cm aur doosri taraf 10 cm door hai, kya woh circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"12 cm","name":"tight string se"}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s3:explain:e2 · check script:c4-maths-ch01-t02-s3:ask:e2 (2 miss) · board up · ready 1768 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Dono taraf ki doori aapas mein milao, aur yaad karo ki circle mein yeh doori kaisi hoti hai. Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > card: Ek roti ke centre se kinaara ek taraf 8 cm door hai aur doosri taraf 10 cm. Kya yeh roti circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"sikka"}}

**child:** galat  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c4-maths-ch01-t02-s3:ask:e3 · board up · ready 1846 ms · guard mustsay,noconfirm]: Bilkul sahi: doori 8 cm aur 10 cm, barabar nahi. Khoonte se 3 m ki rassi baandho, aur doosre sire par chalk. Rassi tight rakhkar chalo, toh chalk ka har nishaan khoonte se 3 m door aata hai. Zameen par teen nishaan hain: khoonte se 1 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par nahi hain?
  > card: Zameen par teen nishaan hain: khoonte se 1 m, 3 m aur 5 m door. Inmein se kitne nishaan is circle par nahi hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"sikka"}}

**child:** do nishaan  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 1480 ms]: Haan, sahi hai, kyunki 3 m rassi se har nishaan 3 m door banta hai; 1 m aur 5 m wale 2 nishaan circle par nahi. Aao, agla sawaal main aur tum saath mein karenge. Pooja 50 cm ki tight string se rangoli ka circle banati hai. Phir ek kinaare se centre se hote hue doosre kinaare tak seedhi line kheenchti hai. Rangoli ke kinaare ka koi bhi point centre se kitni door hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"3 m"}}

**child:** mujhe lagta hai 50 cm  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked · board up · ready 3401 ms · guard affirms,long]: Bilkul, 50 cm: tight string har point ko utna hi door rakhti hai. Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","name":"rangoli"}}

**child:** 50 cm  _(incorrect)_

**Asha** [hint · beat s3:worked:worked · check script:c4-maths-ch01-t02-s3:ask:worked (1 miss) · board up · ready 1808 ms · guard uncorrected]: 50 cm sahi nahi hai. Line centre par rukti nahi; woh centre ke us paar bhi kinaare tak jaati hai. 50 cm string wale circle mein kinaare se centre se hote hue kinaare tak line kitni lambi hai?
  > card: Tumhari baari: ek kinaare se doosre kinaare tak poori line kitni lambi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"string","name":"rangoli"}}

**child:** 1 metre  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c4-maths-ch01-t02-s3:c1 · board up · ready 1177 ms]: Sahi jawab. Dekho, centre se hokar jaane wali line mein string jitni doori do baar aati hai. Toh poora jawab: poori line 100 cm lambi hai. Chalo, ab tumhari apni baari. Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > card: Rangoli ke liye Zoya ne haath se ek gol banaya, aur Pooja ne khoonte aur tight string se. Inmein se pakka circle kiska hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","diameter":"100 cm"}}

**child:** string se bana  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c4-maths-ch01-t02-s3:c2 · board up · ready 2758 ms · guard leak]: Bilkul sahi: Pooja ne tight string se banaya, toh har point barabar door hai; haath se bane gol mein doori badal sakti hai. Zoya ne ek gol ghadi ke centre se uske kinaare tak kai jagah naapa, aur har baar 7 cm aaya. Kya ghadi ka kinaara circle hai?
  > card: Zoya ne ek gol ghadi ke centre se uske kinaare tak kai jagah naapa, aur har baar 7 cm aaya. Kya ghadi ka kinaara circle hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"tight string","name":"Pooja ka"}}

**child:** circle hai  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c4-maths-ch01-t02-s3:c3 · board up · ready 1132 ms]: Haan, sahi hai, kyunki ghadi par jitni jagah naapa, har jagah 7 cm aaya; circle mein kinaare ka har point centre se barabar door hota hai. Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > card: Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"7 cm","name":"ghadi"}}

**child:** dono  _(misconception)_

**Asha** [hint · beat s3:check:c3 · check script:c4-maths-ch01-t02-s3:c3 (1 miss) · board up · ready 1307 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Dono ke centre se kinaare tak alag-alag taraf socho, aur dekho ki kiski doori har taraf ek jaisi rehti hai. Ab phir se socho, jawab kya hoga?
  > card: Chudi aur anda, dono gol dikhte hain. Inmein se circle kaunsa hai: chudi ya anda?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar"}}

**child:** chudi wala  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 2 ms]: Haan, bilkul theek. Dekho, chudi har taraf barabar, anda ek taraf lamba. Jaane se pehle, aaj ki saari baaton par ek aakhri sawaal. Ek square tile ki har bhuja 30 cm hai, aur use ghuma kar tircha rakha hai. Uske ek kone par tester ko tile ke saath ghuma kar rakhoge, toh kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"circle","centre":"centre","radius":"barabar door","name":"chudi"}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 1528 ms]: Do baatein ek-ek karke socho: tile ko ghumane se uska kona badla kya, aur lambi bhuja se kona zyada khula kya. Ghuma kar rakhi 30 cm wali square tile ke kone par tester bhi ghuma kar rakho: kona kam khula hoga, bilkul fit, ya zyada khula?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","ghumayi hui"]}}

**child:** pata nahi, shayad wahi  _(no_evidence)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1385 ms]: Iska jawab hai bilkul fit, kyunki tile square hai, toh uska har kona right angle hai; ghumane se kona nahi badalta, aur 30 cm lambi bhuja se kona zyada nahi khulta, isliye tester bilkul fit hoga. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","bilkul fit"]}}

**child:** pehle wale step se pata chala  _(no_evidence)_

**Asha** [wrap · ready 1356 ms]: Hmm, achha, samajh gayi. Aaj dekha ki right angle kitaab ke kone jaisa hota hai, aur ghumane se kona nahi badalta. Phir tester se dekha ki angle khulne se bada hota hai, bhujaon ki lambai se nahi. Aakhir mein circle aaya: uske kinaare ka har point centre se barabar door hota hai. Aaj ka kaam aasaan laga ya thoda mushkil?

**child:** thoda mushkil tha  _(no_evidence)_

**Asha** [wrap · ready 748 ms]: Hmm, samajh gayi, batane ke liye shukriya. Aaj tumne naap se ghadi ke kinaare ko circle pehchana. Aaj ke liye itna hi, phir milte hain!

## Agent


