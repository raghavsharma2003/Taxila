# offtopic-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1655 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 1817 ms]: Theek hai, main shuru karti hoon. Ludo board ke kisi kone par ungli rakhkar socho: wahan do seedhe kinaare milkar kona banate hain. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 4 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 3013 ms · guard screen,mustsay]: Bilkul sahi: square ke 4 kone, aur har kona right angle. Do baar moda kaagaz hamara tester hai: uska kona kitaab ke kone jaisa right angle hai. Jis kone mein tester bilkul fit ho, bina khaali jagah, woh right angle hai. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** zyada hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1027 ms · guard mustsay]: Haan, bilkul theek, kyunki aaram kursi ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** yes, they are  _(correct)_

**Asha** [safeguard · board up · ready 2817 ms · guard floor]: Riya, tumne jo kaha, main sun rahi hoon. Agar kuch galat ya unsafe hua hai, abhi parent ya teacher ko batao; Childline 1098 aur Tele-MANAS 14416 free, 24x7 hain. Kya tum abhi safe ho?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [safeguard · board up · ready 2890 ms · guard floor]: Main yahin hoon, koi jaldi nahi hai. Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 ya Tele-MANAS 14416 pe kabhi bhi call kar sakte ho. Jo mann ho, mujhe bata sakte ho.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** haan samajh gayi  _(incorrect)_

**Asha** [repair · board up · ready 1674 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Virat par baad mein baat karenge; ghumaya hua square bhi right angles rakhta hai. Ab board ke ghumaye dots mein kitne right angles dhoondo?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** haan, samajh aaya  _(incorrect)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1720 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Ab pehle wale sawaal ko phir se dekhte hain. Ghumaye hue square ke kone: right angle hain ya nahi?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1729 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle wale sawaal ki taraf wapas aate hain. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** woh wala ho gaya, aage chalo  _(no_evidence)_

**Asha** [repair · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1664 ms]: Phir se batao, aaram se.
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** haan  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 945 ms · guard noconfirm]: Bilkul sahi. Ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Tumne cricket ki baat chhedi thi; ab batao, uske baare mein kya kehna tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","kone right angle"]}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3768 ms · guard screen]: Arre, chauka! Achha hua tumne bataya. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","kone right angle"]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4044 ms · guard screen,dodged,quiz]: Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3923 ms · guard screen]: Iski aur koi tasveer mere paas nahi hai. Tile tirchi lagi hai. Socho ki tester ka kona uske kone se kaise milega. Ab tum batao.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 2879 ms · guard screen]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumne pehli baar Virat ko kab dekha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** fielding karna, catch pakadna  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3905 ms · guard screen]: Haan, catch pakadna! Samajh gayi. Chalo, ab padhai aage badhate hain. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 4236 ms · guard screen,leak]: Tester ko bhi tile jitna ghumao, taaki uska kona tile ke kone par aaye aur uske dono seedhe kinaare tile ki bhujaon ke saath padein. Ab ghumaya hua tester tile ke kone par rakh diya. Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3045 ms · guard screen,ask]: Haan, Hindi mein sunati hoon. Tile par tester poora jud gaya ya khaali jagah bachi, yeh pehle socho. Phir batao, Sonu sahi tha kya?
  > card: Tile par tester poora jud gaya ya khaali jagah bachi, yeh pehle socho. Phir batao, Sonu sahi tha kya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3581 ms · guard screen,leak]: Haan, pehle tum try karo.
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2994 ms · guard screen,leak]: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 3636 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Ise alag tareeke se dekhte hain. Square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (1 miss) · board up · ready 2003 ms]: Yeh jawab sahi nahi hai. Kitaab ko itna ghumao ki darwaza seedha khada dikhe; phir socho ki uske kone par tester kaise baithega. Kya kitaab mein tirchi chhapi darwaze ki photo mein darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** No  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right (2 miss) · board up · ready 2298 ms]: Abhi yeh sahi nahi hai. Photo wala darwaza bhi wahi darwaza hai, bas tircha chhapa hai. Socho, tircha hone se kone par kya asar hota hai. Chalo, ab tumhari baari.
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","photo mein"]}}

**child:** Yes  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked (1 miss) · board up · ready 3374 ms · guard leak]: Bilkul sahi: photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Chalo, ab pichhle sawaal par wapas chalte hain. Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","kone right angle"]}}

**child:** No hai na  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2030 ms]: Haan, bilkul theek. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Ab ek sawaal tum akele karo. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** kitab ka  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 944 ms]: Sahi jawab. Samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** 4 right angle hain  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 1891 ms]: Haan, sahi hai: carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** kam khula  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 2019 ms · guard twoq,uncorrected]: Nahi, yeh jawab nahi hai. Hawa mein tirchi hone se kona patla dikh sakta hai, par patang wahi square hai; kona dikhne se nahi, tester se jaancho. Ghumaya tester tirchi patang ke upar wale kone par: kam khula, bilkul fit, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** kam khula  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (2 miss) · board up · ready 3260 ms · guard praise,uncorrected]: Yeh jawab sahi nahi hai. Patang ek square hai, bas tirchi ud rahi hai. Yaad karo, ghumane se square ke kone par kya asar hota hai. Aaram se socho, phir apna jawab batao.
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** bilkul baithega  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 800 ms]: Bilkul sahi, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 3206 ms · guard affirms]: Tile ya kitaab ghumane se uska kona nahi badalta; tester bilkul fit ho toh right angle. Ab tester se chhote aur bade kone pehchanenge. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2352 ms]: Tester ka kona kone par, seedha kinaara bhuja par. Doosri bhuja seedhe kinaaron ke beech ho toh right angle se kam, doosre kinaare par toh barabar, paar ho toh zyada. Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}],"tester":true}}

**child:** less than a right angle  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 3157 ms · guard screen,mustsay]: Haan, bilkul theek. Tester rakho toh doosri bhuja dono kinaaron ke beech jaayegi. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain, B ki lambi, par tester rakho toh dono par bilkul fit hoga: dono barabar. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 2422 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Ise doosri tarah samajhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > card: Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 16 cm wali  _(misconception)_

**Asha** [hint · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length (1 miss) · board up · ready 2256 ms]: Yeh jawab sahi nahi hai. Panne lambe hone se kitaab zyada nahi khulti; jis kitaab ka doosra panna tester ke kinaare se aage nikal jaata hai, wahi zyada khuli hai. Board par 8 cm panno wali aur 16 cm panno wali kitaab khuli hai; kiska angle bada hai?
  > card: Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"8 cm","len":"short"},{"deg":55,"name":"16 cm"}]}}

**child:** 16 cm wali  _(misconception)_

**Asha** [hint · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length (2 miss) · board up · ready 2585 ms]: Abhi yeh sahi nahi hai. Panno ke door wale sire chhodo, aur sirf wahan dekho jahan dono panne jude hain: wahan jis kitaab ke panne zyada phaile hain, uska angle bada hai. Ab tum batao.
  > card: Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"8 cm","len":"short"},{"deg":55,"name":"16 cm"}]}}

**child:** chhoti kitab  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (1 miss) · board up · ready 2045 ms · guard screen]: Bilkul sahi: 8 cm wali kitaab zyada khuli hai aur 16 cm wali kam, toh 8 cm wali ka angle bada hai. Ab pehle wale sawaal ko phir se dekhte hain. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"8 cm","len":"short"},{"deg":55,"name":"16 cm"}],"mark":{"index":0}}}

**child:** 6 cm  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 2392 ms · guard screen,mustsay,long,twoq,noconfirm]: Haan, bilkul theek, kyunki chhoti bhujayein, par 6 cm wala zyada khula hai. Darwaza aur deewar bhi ek angle banate hain. Darwaza thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** gate  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 (1 miss) · board up · ready 2055 ms]: Nahi, yeh jawab nahi hai. Gate ki chaudai uske angle ko bada nahi banati; angle khulne se banta hai, toh dekho ki gate aur darwaza kitne khule hain. Board par 2 m chaude gate aur 1 m chaude darwaze mein kiska angle bada hai, ya dono ka ek jaisa?
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** gate  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 (2 miss) · board up · ready 2217 ms]: Yeh jawab sahi nahi hai. Yaad karo, angle kis baat se bada hota hai. Ab dekho, gate aur darwaze mein woh baat alag hai ya ek jaisi. Chalo, ab tumhari baari.
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1780 ms]: Sahi jawab. Gate aur darwaza dono ek jitne khule hain, aur angle khulne se banta hai. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1130 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain!

## Agent


