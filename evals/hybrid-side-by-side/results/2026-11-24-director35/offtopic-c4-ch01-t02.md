# offtopic-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2426 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2367 ms]: Theek hai, main shuru karti hoon. Ludo board ka kona dekho: ekdum seedha, kitaab ke kone jaisa. Aaj aise kono ki baat karenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 4 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2985 ms · guard screen,mustsay]: Bilkul sahi: square ke 4 kone, aur har kona right angle. Do baar mode kaagaz ka kona right angle hai; yahi tester hai. Tester kisi kone mein bilkul fit ho, koi khaali jagah na bache, toh woh kona right angle hai. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** zyada hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1045 ms · guard mustsay]: Haan, bilkul theek, kyunki aaram kursi ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** yes, they are  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4391 ms · guard screen,invented]: Sahi jawab. Ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","kone right angle"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 4698 ms · guard screen]: Tile tirchi lagi hai. Socho ki tester ka kona uske kone se kaise milega. Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4611 ms · guard screen]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Pehle is sawaal ka jawab do.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4220 ms · guard screen]: Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 7100 ms · guard screen]: Cricket wali baat maine likh li hai. Board wala sawaal abhi baaki hai, uska jawab do.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3227 ms · guard screen]: Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4203 ms · guard screen]: Ab phir se socho, jawab kya hoga?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4945 ms · guard screen]: Ab tum batao.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 4467 ms · guard screen]: Iski aur koi tasveer mere paas nahi hai. Board par ek tile seedhi hai aur wahi tile tirchi lagi hai. Tirchi wali par Sonu ka tester nahi baitha, toh usne kona right angle nahi maana. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 6737 ms · guard screen]: Cricket wali baat maine likh li hai. Yeh baad mein; pehle sawaal ka jawab.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4394 ms · guard screen]: Toh ab batao, kya aayega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3938 ms · guard screen]: Haan, Hindi mein sunati hoon. Tile tedhi lagi hai. Tester ko bhi tile jitna ghumaoge, ya seedha hi rakhoge?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 6494 ms · guard screen]: Tester ko bhi tile jitna ghumao, taaki uska kona tile ke kone par aaye aur uske dono seedhe kinaare tile ki bhujaon ke saath padein. Ab ghumaya hua tester tile ke kone par rakh diya. Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 4176 ms · guard screen]: Sonu bola tha ki tirchi tile ka kona right angle nahi hai; kya Sonu ki baat theek thi?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2958 ms · guard screen,affirms,leak]: Yaad karo, ghuma kar rakhne par tester kaise baitha, aur tester bilkul fit hone ka matlab kya hota hai. Chalo, ab tumhari baari.
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 4511 ms · guard praise,screen,affirms]: Haan, pehle tum try karo. Ab phir se socho, jawab kya hoga?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 3196 ms · guard screen,leak]: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** No hai na  _(correct)_

**Asha** [repair · beat s1:worked:worked · board up · ready 3182 ms · guard deny,screen]: Bilkul sahi. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Tumne cricket ki baat chhedi thi; ab batao, uske baare mein kya kehna tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** jab Virat chauka maarta hai, woh  _(no_evidence · aside)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2174 ms]: Wah, chauka! Yeh batane ke liye shukriya. Ab wapas apni padhai par aate hain. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** koi nahi  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 2292 ms]: Nahi, yeh jawab nahi hai. Ise alag tareeke se dekhte hain. Square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tirchi rakhi"]}}

**child:** yes  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 (1 miss) · board up · ready 1084 ms]: Haan, bilkul theek. Photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Samose ki nok, pizza ke tukde ki nok aur tirchi kitaab ke kone mein right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","kone right angle"]}}

**child:** koi nahi  _(misconception)_

**Asha** [hint · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 (2 miss) · board up · ready 2194 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Har kone par tester rakh kar socho: jis kone mein tester poora baithe, koi khaali jagah na bache, wahi right angle hai. Ab phir se socho, jawab kya hoga?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","tirchi rakhi"]}}

**child:** koi nahi  _(misconception)_

**Asha** [repair · beat s1:check:c1 · board up · ready 2424 ms · guard screenmismatch]: Abhi yeh sahi nahi hai. Is sawaal ka sahi jawab: kitaab wala, kyunki samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s1:check:c1 · board up · ready 3561 ms · guard screen,flat]: Teeno mein se ek kona seedha rakhne par tester mein bilkul fit hota; use tircha rakhne se woh kona nahi badalta. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 2213 ms]: Koi baat nahi, isse aasaan shabd abhi mere paas nahi hain. Chalo, ab agli baat dekhte hain. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** nahi, chaaron right angle hain  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 2332 ms]: Bilkul sahi: carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** haan bilkul fit  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2419 ms]: Haan, bilkul theek, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yahan tak saaf hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2203 ms]: Ab kone ko tester se milakar dekhenge ki woh right angle se kam hai ya zyada. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1043 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milte hain!

## Agent


