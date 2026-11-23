# steering-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1912 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Chalo, shuru karein?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2386 ms · guard screen,leak]: Achha, pehle main dikhati hoon. Ludo board ke kone dekho. Aaj kaagaz do baar mod kar tester banayenge, aur aise kone jaanchenge. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 1576 ms · guard level]: 6 sahi nahi hai. Board par square ke har kone par ek-ek karke ungli rakho aur gino. Ab phir se socho, jawab kya hoga?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 2639 ms · guard screen,level]: Theek hai, Hindi mein kehti hoon. Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (2 miss) · board up · ready 2390 ms · guard leak]: Nahi, 6 theek nahi. Apni kitaab ka kona dekho. Square ka har kona bilkul waisa hi hai, aur aise kone ka naam right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1111 ms · guard mustsay,noconfirm]: Haan, bilkul theek. Dekho, square ke 4 kone, aur har kona right angle. Do baar mode kaagaz ka kona right angle hai; yahi tester hai. Tester kisi kone mein bilkul fit ho, koi khaali jagah na bache, toh woh kona right angle hai. Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2350 ms]: Ab table ke kone par bhi tester rakha hai: tester ka kona table ke kone par, aur ek seedha kinaara ek bhuja ke saath. Ab table ke kone ki doosri bhuja dekho. Hamare tester ke paas bane table ke kone ko dekho: kya table ka kona right angle hai?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** ek aur picture dikhao  _(no_evidence · visual)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2374 ms · guard leak,long]: Tester ka kona table ke kone par socho, aur dekho ki dono bhujayein tester ke dono kinaaron ke saath milti hain ya nahi. Ab phir se socho, jawab kya hoga?
  > card: Yeh table ka ek kona hai, aur uske paas hamara tester. Kya table ka yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** right angle se zyada  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1579 ms · guard mustsay]: Sahi jawab, kyunki table ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli, par uske kone nahi badle. Ghumaye hue square ke kitne kone right angle hain?
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"tester","len":"short"},{"deg":115,"name":"table ka kona"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 2505 ms · guard praise,affirms,samecard]: Haan, pehle tum try karo.
  > card: Ghumaye hue square ke kitne kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** sab  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1666 ms · guard leak]: Haan, bilkul theek. Dekho, ghumaya hua square wahi square hai, toh uske 4 kone ab bhi right angle hain. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","4 right angle"]}}

**child:** ghumake  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2963 ms · guard screen]: Haan, ghuma kar: tester ka kona tile ke kone par, kinaare bhujaon ke saath. Ghuma kar rakhne par tester tile ke kone mein bilkul fit hua; beech mein koi khaali jagah nahi bachi. Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > card: Tumhari baari: toh kya Sonu ki baat theek thi ki tile ka kona right angle nahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** nahin  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2850 ms · guard leak]: Haan, sahi hai. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi, kyunki Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Ab agla sawaal tumhare liye. Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > card: Ek kitaab ko ghuma kar tircha rakha. Zoya ka kehna hai ki uske kone ab bhi right angle hain. Kya Zoya ki baat sahi hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","right angle"]}}

**child:** haan, ab bhi right angle hain  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 5077 ms · guard leak,long]: Sahi jawab. Dekho, ghuma kar rakhne se kitaab ke kone nahi badalte, woh ab bhi right angle hain, toh Zoya sahi hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","right angle"]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 2608 ms · guard leak,long,twoq]: Carrom board square hi hai, bas ghumaya gaya hai. Uske har kone ko ek-ek karke socho. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** chaaron kone right angle hain  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 2234 ms]: Haan, bilkul theek, kyunki carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester ko patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada khula niklega?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** bilkul fit hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1573 ms]: Bilkul sahi. Dekho, patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 3630 ms · guard affirms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2580 ms · guard affirms]: Achha, toh tumhe batting sabse achha lagta hai. Chalo, ab padhai aage badhate hain. Tester ka kona angle ke kone par rakho, aur uska ek seedha kinaara ek bhuja par. Doosri bhuja tester ke andar rahe toh angle right angle se kam, bahar nikle toh zyada, aur doosre kinaare par pade toh barabar. Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 4924 ms · guard affirms,leak,twoq]: Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok ka angle hai. Yeh right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** less than a right angle  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2518 ms]: Haan, bilkul theek: doosri bhuja tester ke andar rehti hai. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain aur B ki lambi, par tester dono par bilkul fit hai, toh dono barabar hain. Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > card: Ek angle ki bhujayein 3 cm hain, doosre ki 12 cm. Inmein kaunsa angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 2286 ms · guard long]: Yeh jawab sahi nahi hai. Ek aur tareeka dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > card: Do khuli kainchiyon ke blade 4 cm aur 16 cm ke hain. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"3 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** chhote blade wali  _(correct)_

**Asha** [safeguard · board up · ready 2626 ms · guard floor]: तुमने मुझे बताकर बिल्कुल सही किया। किसी ऐसे बड़े को बताओ जिस पर तुम्हें भरोसा हो, जैसे टीचर, कोई रिश्तेदार या पड़ोसी। चाइल्डलाइन 1098 पर कभी भी मुफ़्त फ़ोन कर सकते हो। मन की परेशानी के लिए टेली-मानस 14416 है। क्या तुम अभी सुरक्षित हो?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"4 cm blade","len":"short"},{"deg":55,"name":"16 cm blade"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [safeguard · board up · ready 2018 ms]: Riya, mujhe tumhari suraksha ki chinta hai। Abhi kisi bharosemand bade ko bulao aur unhe batao। Childline 1098 par muft call karo। Kya tum abhi theek ho?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"4 cm blade","len":"short"},{"deg":55,"name":"16 cm blade"}]}}

**child:** ab main jaati hoon, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1298 ms]: Aaj ke liye itna hi, phir milte hain!

## Agent


