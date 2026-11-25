# steering-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1709 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2575 ms · guard screen,leak]: Achha, pehle main dikhati hoon. Ludo board ke kisi kone par ungli rakhkar socho: wahan do seedhe kinaare milkar kona banate hain. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 1734 ms]: Apni kitaab ka kona is square ke kone par rakh kar socho: dono bilkul mil jaate hain. Isliye square ka kona bhi right angle hai. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2691 ms · guard ask]: Theek hai, Hindi mein kehti hoon. Board par square ke har kone par ek-ek karke ungli rakho aur gino. Is chaukor ka har kona kitaab ke kone jaisa hai. Aise kone ginkar batao?
  > card: Is chaukor ka har kona kitaab ke kone jaisa hai. Aise kone ginkar batao?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 (1 miss) · board up · ready 3024 ms · guard leak,uncorrected]: 6 sahi nahi hai. Jis kone se shuru karo, use yaad rakho; har naye kone par ek ungli kholo, aur us kone par wapas aate hi ruk jao. Board ke square mein kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** 3  _(incorrect)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 939 ms]: Yeh jawab sahi nahi hai. Square ke 4 kone hain aur har kona kitaab ke kone jaisa right angle hai. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e1 · board up · ready 2741 ms · guard level]: Yeh kitaab ka ek kona hai, bada karke banaya hua: aisa kona right angle hai. Yahan tak saaf hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"kitaab ka kona"}]}}

**child:** ek aur picture dikhao  _(no_evidence · visual)_

**Asha** [explain · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2132 ms · guard mustsay]: Iski aur koi tasveer mere paas nahi hai. Chalo, ab agli baat dekhte hain. Do baar moda kaagaz hamara tester hai: uska kona kitaab ke kone jaisa right angle hai. Jis kone mein tester bilkul fit ho, bina khaali jagah, woh right angle hai. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":90,"name":"kitaab ka kona"}]}}

**child:** jhuki hui hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 2973 ms · guard mustsay,leak]: Haan, bilkul theek. Aaram kursi ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 2865 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["seedha","ghumaya hua"]}}

**child:** yes, they are  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3080 ms · guard screen,leak,invented]: Sahi jawab, kyunki ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","kone right angle"]}}

**child:** ghumaana padega  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2119 ms · guard screen,leak,long]: Bilkul, ghuma kar: tester ke seedhe kinaare tile ki bhujaon ke saath. Ab ghumaya hua tester tile ke kone par rakh diya. Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** no  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 3376 ms · guard deny]: Haan, sahi hai. Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi. Ab agla sawaal tumhare liye. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** teesra  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 911 ms]: Haan, bilkul theek, kyunki samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 3525 ms · guard screen,leak,long]: Carrom board square hi hai, bas ghumaya gaya hai. Uske har kone ko ek-ek karke socho. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** 4 kone  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 778 ms]: Sahi jawab. Carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** fit  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 943 ms]: Bilkul sahi, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2106 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · board up · ready 2177 ms]: Oho, batting! Isi mein tumhe maza aata hai. Chalo, ab padhai aage badhate hain. Tester ka kona kone par, seedha kinaara bhuja par. Doosri bhuja seedhe kinaaron ke beech ho toh right angle se kam, doosre kinaare par toh barabar, paar ho toh zyada. Yeh hissa saaf hua?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 2264 ms]: Kitaab ka cover dheere-dheere kholo. Pehle angle right angle se kam hota hai, phir ek jagah tester bilkul fit hota hai, aur aage kholo toh zyada ho jaata hai. Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":60,"name":"kam"},{"deg":90,"name":"right angle"},{"deg":130,"name":"zyada"}],"tester":true}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 · board up · ready 1808 ms]: Board wali cake ki nok right angle se kam khuli hai, ya zyada khuli?
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** zyada  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c4-maths-ch01-t02-s2:ask:e1 (1 miss) · board up · ready 1911 ms]: Yeh jawab sahi nahi hai. Zyada tab hota jab doosri bhuja tester ke doosre seedhe kinaare ke us paar jaati; board par dekho ki woh kahan se jaati hai. Ab tum batao.
  > card: Yeh cake ke tukde ki nok hai. Is par tester rakhoge, toh nok right angle se kam khuli niklegi ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 90 se kam  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 · board up · ready 2442 ms · guard screen]: Haan, bilkul theek. Tester rakho toh doosri bhuja dono kinaaron ke beech jaayegi. Angle khulne se bada hota hai, bhujaon ki lambai se nahi. A ki bhujayein chhoti hain, B ki lambi, par tester rakho toh dono par bilkul fit hoga: dono barabar. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":50,"name":"cake ki nok"}]}}

**child:** 12 cm wala  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length · board up · ready 2714 ms · guard long,uncorrected]: Abhi yeh sahi nahi hai. Ek aur tareeka dekhte hain. Do pencil ko angle ki tarah pakdo. Ab dono ke aage ek-ek pencil jodo: bhujayein lambi ho gayi, par khulna wahi raha, toh angle bhi wahi raha. Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > card: Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 16 cm wali  _(misconception)_

**Asha** [hint · beat s2:check:then:c4-maths-ch01-t02-m-arm-length · check script:c4-maths-ch01-t02-s2:then:c4-maths-ch01-t02-m-arm-length (1 miss) · board up · ready 3326 ms · guard leak]: Nahi, yeh theek nahi hai. Panne lambe hone se kitaab zyada nahi khulti; jis kitaab ka doosra panna tester ke kinaare se aage nikal jaata hai, wahi zyada khuli hai. Board par 8 cm panno wali aur 16 cm panno wali kitaab khuli hai; kiska angle bada hai?
  > card: Do kitaabein khuli rakhi hain: ek ke panne 8 cm ke, doosri ke 16 cm ke. Kiska angle bada hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"8 cm","len":"short"},{"deg":55,"name":"16 cm"}]}}

**child:** pehli  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (1 miss) · board up · ready 1978 ms · guard deny,screen]: Sahi jawab, kyunki 8 cm wali kitaab zyada khuli hai aur 16 cm wali kam, toh 8 cm wali ka angle bada hai. Ab pehle wale sawaal ko phir se dekhte hain. Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":110,"name":"8 cm","len":"short"},{"deg":55,"name":"16 cm"}],"mark":{"index":0}}}

**child:** 12 cm wala  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c4-maths-ch01-t02-s2:ask:e2 (2 miss) · board up · ready 2032 ms]: Yeh jawab sahi nahi hai. Tumne bhujaon ki lambai dekhi; angle bhujaon ke beech ka khulna hai, toh dono ka khulna right angle se milao. Board par 6 cm bhujaon wala aur 12 cm bhujaon wala angle hai; kiska khulna zyada hai?
  > card: Board par do angle dekho: ek ki bhujayein 6 cm, doosre ki 12 cm. Kaunsa zyada khula hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}]}}

**child:** 6 cm  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c4-maths-ch01-t02-s2:ask:e3 · board up · ready 2022 ms · guard screen,mustsay,long,noconfirm]: Haan, bilkul theek. Chhoti bhujayein, par 6 cm wala zyada khula hai. Darwaza aur deewar bhi ek angle banate hain. Darwaza thoda kholo toh angle chhota, aur zyada kholo toh angle bada ho jaata hai. Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > card: Board par ek gate hai jo 2 m chauda hai, aur ek darwaza jo 1 m chauda hai; dono khule hain. Kiska angle bada hai, ya dono barabar hain?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":120,"name":"6 cm","len":"short"},{"deg":60,"name":"12 cm"}],"mark":{"index":0}}}

**child:** dono same  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1031 ms]: Haan, sahi hai: gate aur darwaza dono ek jitne khule hain, aur angle khulne se banta hai. Aao, agla sawaal main aur tum saath mein karenge. Rani ki rangoli mein teen kone hain, P, Q aur R, aur P ki bhujayein sabse lambi hain. Hamein inmein sabse bada angle dhoondhna hai. Pehle P ko lo: uska khulna right angle se kam hai ya zyada?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":40,"name":"2 m"},{"deg":40,"name":"1 m","len":"short"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1293 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


