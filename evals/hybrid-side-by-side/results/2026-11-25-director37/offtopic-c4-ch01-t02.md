# offtopic-c4-ch01-t02 · c4-maths-ch01-t02

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2061 ms]: Aaj hum kaagaz ke tester se kone jaanchenge, aur string se circle banayenge. Toh shuru karte hain?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2776 ms · guard screen]: Theek hai, main shuru karti hoon. Ludo board ke kisi kone par ungli rakhkar socho: wahan do seedhe kinaare milkar kona banate hain. Yeh ek square hai. Iska har kona kitaab ke kone jaisa hai; aise kone ko right angle kehte hain. Yeh hissa saaf hua?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch01-t02-s1:ask:e1 · board up · ready 2044 ms]: Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye. Chalo, pehle yahan se aage badhte hain. Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > card: Is square ke saare kone ek jaise hain. Is square mein kul kitne right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle"}}

**child:** char  _(correct)_

**Asha** [repair · beat s1:explain:e1 · board up · ready 1008 ms]: Bilkul sahi: square ke 4 kone hain aur har kona kitaab ke kone jaisa right angle hai. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** Rohit  _(no_evidence · aside)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2132 ms · guard mustsay]: Achha, toh Rohit! Yeh batane ke liye shukriya. Ab wapas apni padhai par aate hain. Do baar moda kaagaz hamara tester hai: uska kona kitaab ke kone jaisa right angle hai. Jis kone mein tester bilkul fit ho, bina khaali jagah, woh right angle hai. Yahan tak theek hai?
  > screen: board angle@1 {} · ref {"template":"shape@1","params":{"shape":"square","corner":"right angle","name":"4 right angle"}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 2171 ms]: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 · board up · ready 1836 ms]: Kya board par aaram kursi ki peeth aur seat ke beech ka kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (1 miss) · board up · ready 2960 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Tester ka kona kursi ke kone par socho, aur dekho ki dono bhujayein tester ke dono seedhe kinaaron ke saath milti hain ya nahi. Ab tum batao.
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** yes  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch01-t02-s1:ask:e2 (2 miss) · board up · ready 1811 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Dibbe ke kone mein do baar moda kaagaz dabao. Kaagaz kone ko poora bhar de, koi khaali jagah na bache, toh dibbe ka kona right angle hai. Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > card: Board par ek aaram kursi ka kona bana hai: peeth aur seat ke beech ka. Kya yeh kona right angle hai?
  > screen: board angle@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** nahi, zyada hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c4-maths-ch01-t02-s1:ask:e3 · board up · ready 1904 ms · guard mustsay]: Bilkul sahi, kyunki aaram kursi ke kone mein tester rakho toh beech mein khaali jagah bachegi, isliye woh kona right angle nahi hai. Yeh do ek jaise square hain: pehla seedha rakha hai, doosra ghumaya hua hai. Ghumane se square ki disha badli; uske kone ab kaise hain, yeh tester se jaanchenge. Kya ghumaye hue square ke kone ab bhi right angle hain?
  > card: Kya ghumaye hue square ke kone ab bhi right angle hain?
  > screen: board shape@1 {} · ref {"template":"angle@1","params":{"angles":[{"deg":115,"name":"aaram kursi"}]}}

**child:** yes, they are  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2855 ms · guard screen,quiz,long]: Haan, bilkul theek. Ghumaya hua square wahi square hai, toh uske kone ab bhi right angle hain. Chalo, ab ek sawaal hum dono saath mein karte hain. Sonu ki ek tile tirchi lagi hai. Usne tester seedha rakha toh fit nahi hua, aur Sonu bola: is tile ka kona right angle nahi hai. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["square","kone right angle"]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2929 ms · guard screen]: Tile tirchi lagi hai. Socho ki tester ka kona uske kone se kaise milega. Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 3027 ms · guard screen]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** chauka  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4107 ms · guard screen]: Achha, toh tumhe chauka pasand hai! Chalo, ab padhai aage badhate hain. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** screen par dikhao na  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 3522 ms · guard screen]: Iski aur koi tasveer mere paas nahi hai. Board par ek tile seedhi hai aur wahi tile tirchi lagi hai. Tirchi wali par Sonu ka tester nahi baitha, toh usne kona right angle nahi maana. Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [repair · beat s1:worked:worked:step1 · board up · ready 3049 ms · guard screen]: Main AI hoon, meri koi pasand nahi hoti. Virat ko tum kiske saath dekhte ho?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** papa ke saath dekhta hoon  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 5669 ms · guard screen]: Achha, batane ke liye shukriya. Ab phir se apni baat par aate hain. Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 4834 ms · guard screen]: Haan, Hindi mein sunati hoon. Sonu ka tester seedha tha, par tile tirchi. Socho, kya tester ke dono seedhe kinaare tile ki bhujaon ke saath pade the; tester fit na hone ki wajah wahi ho sakti hai. Tile tedhi lagi hai. Tester ko bhi tile jitna ghumaoge, ya seedha hi rakhoge?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** haan  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3308 ms · guard screen]: Chalo, ab tumhari baari.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4529 ms · guard screen,affirms]: Haan, pehle tum try karo.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** hmm, achha  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 4416 ms · guard screen]: Tirchi tile par tester seedha rakhoge, ya ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 3771 ms · guard screen]: Tester tirchi tile ke kone par seedha rakhoge, ya tile ke saath ghuma kar?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c4-maths-ch01-t02-s1:ask:worked · board up · ready 2272 ms · guard screen,leak,long]: Tester ko bhi tile jitna ghumao, taaki uska kona tile ke kone par aaye aur uske dono seedhe kinaare tile ki bhujaon ke saath padein. Ab ghumaya hua tester tile ke kone par rakh diya. Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > card: Tumhari baari: board par dekho, ghumaya tester kone mein kaisa baitha. Toh kya Sonu theek keh raha tha?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","tirchi lagi"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** right angle hai  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c4-maths-ch01-t02-s1:c1 · board up · ready 2598 ms]: Bilkul sahi: Sonu ka tester seedha tha aur tile tirchi, isliye fit nahi hua tha; ghumane se tile ka kona nahi badla. Toh poora jawab: tile ka kona right angle hai; Sonu ki baat theek nahi thi. Ab ek sawaal tum akele karo. Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > card: Samose ki nok, pizza ke tukde ki nok, ya ek tirchi rakhi kitaab ka kona: inmein se right angle kaunsa hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["tile","kona right angle"],"tester":{"on":1,"corner":0,"turned":true}}}

**child:** kitaab  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 · board up · ready 995 ms · guard screenmismatch]: Haan, bilkul theek, kyunki samose aur pizza ki nok patli hain; tirchi kitaab ka kona ghumane se nahi badla, woh right angle hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["kitaab","kona right angle"]}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch01-t02-m-tilted-not-right · check script:c4-maths-ch01-t02-s1:then:c4-maths-ch01-t02-m-tilted-not-right · board up · ready 1954 ms]: Nahi, yeh jawab nahi hai. Ise alag tareeke se dekhte hain. Square tile seedhi rakho, phir thoda-thoda ghumao, aur har baar kone par tester rakho. Ghumayi hui tile ki disha badalti hai, par tester har baar bilkul fit hota hai. Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > card: Kitaab mein ek darwaze ki photo tirchi chhapi hai. Kya photo wale darwaze ke kone right angle hain?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** yes  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 (1 miss) · board up · ready 2408 ms · guard long]: Sahi jawab. Photo mein wahi darwaza sirf tircha chhapa hai, aur tircha hone se kone nahi badalte, toh uske kone right angle hain. Ab pehle wale sawaal ko phir se dekhte hain. Kya ghuma kar tirchhe rakhe square carrom board ke sirf do kone right angle hain?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"rectangle","copies":2,"names":["darwaza","kone right angle"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 (2 miss) · board up · ready 2668 ms · guard leak,uncorrected]: Yeh jawab sahi nahi hai. Jo kone seedhe nahi dikhte, unhe bhi tester ko carrom board ke saath ghuma kar jaancho, aur har kone mein dekho tester kaisa baithta hai. Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:check:c2 · check script:c4-maths-ch01-t02-s1:c2 (3 miss) · board up · ready 3108 ms · guard screen,leak]: Abhi yeh sahi nahi hai. Carrom board square hi hai, bas ghumaya gaya hai. Uske har kone ko ek-ek karke socho. Aaram se socho, phir apna jawab batao.
  > card: Ek square carrom board ko ghuma kar tircha rakha. Zoya ka kehna hai ki ab uske sirf do kone right angle hain. Kya Zoya ka kehna theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","tircha rakha"]}}

**child:** chaar kone  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 · board up · ready 943 ms]: Bilkul sahi: carrom board square hai, aur ghumane se uske chaaron kone right angle hi rehte hain, sirf do nahi. Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["carrom board","4 right angle"]}}

**child:** kam khula  _(misconception)_

**Asha** [hint · beat s1:check:c3 · check script:c4-maths-ch01-t02-s1:c3 (1 miss) · board up · ready 3110 ms · guard praise,uncorrected]: Nahi, yeh jawab nahi hai. Hawa mein tirchi hone se kona patla dikh sakta hai, par patang wahi square hai; kona dikhne se nahi, tester se jaancho. Ghumaya tester tirchi patang ke upar wale kone par: kam khula, bilkul fit, ya zyada?
  > card: Ek square patang hawa mein tirchi ud rahi hai. Uske upar wale kone par tester patang ke saath ghuma kar rakho: kona kam khula niklega, bilkul fit hoga, ya zyada?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","hawa mein"]}}

**child:** bilkul fit hoga  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2338 ms]: Haan, bilkul theek, kyunki patang square hai, toh tirchi udne par bhi uska har kona right angle hai; ghuma kar rakha tester bilkul fit hoga. Ab woh kone dekhenge jo tester mein fit nahi hote, jaise cake ki nok, aur unhe right angle se milayenge. Yahan tak theek hai?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1171 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"square","copies":2,"names":["patang","bilkul fit"],"tester":{"on":1,"corner":3,"turned":true}}}

## Agent


