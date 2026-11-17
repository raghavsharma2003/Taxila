# stuck-c4-ch05-t01 · c4-maths-ch05-t01

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** pata nahi  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 1915 ms]: Aaj hum ek cheez ko barabar tukdon mein baantna seekhenge, aur un tukdon ke naam. Socho, Maa ne kitchen mein ek garam roti banayi, aur tum do bhai-behen ho. Roti ke 2 tukde honge. Dono ke tukde sach mein barabar kab hote hain, aaj wahi pakadna hai. Ab tak samajh aaya?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 853 ms]: Achha, ise ek aasaan tareeke se kehti hoon. Yeh roti dekho: 2 barabar tukde, aur ek tukde mein rang hai. Dono tukde ek jitne bade hain, kyunki roti barabar kati hai. Fraction mein neeche wala number roti ke kul barabar tukde ginta hai, aur upar wala number, jitne tukde humne liye. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 2313 ms]: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 1127 ms · guard twoq]: Roti ke saare tukde ungli se gino, phir sirf rang wale. Dono gintiyan fraction mein kahan jaati hain, yeh socho. Toh rangin tukda 1/2 hai ya 1/1?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 1629 ms]: Theek hai, ise doosre, aasaan shabdon mein kehti hoon. Ulte kram mein socho, ek laddoo se: tumne laddoo ke jitne tukde uthaye, woh ginti upar likhte hain. Neeche woh ginti jaati hai ki poora laddoo kitne barabar tukdon mein toda gaya tha. Toh rangin tukda 1/2 hai ya 1/1?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c4-maths-ch05-t01-s1:ask:e1 · board up · ready 3082 ms]: Roti ke dono tukde ek jitne hain, isliye dono ka naam ek hi hai. Woh naam is baat se banta hai ki roti kitne tukdon mein kati. Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?
  > card: Ek tukda rangin hai, ek bina rang ka. Toh rangin tukda 1/2 hai ya 1/1?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti","hideResult":true,"legend":true}}

**child:** half  _(correct)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 1315 ms · guard mustsay]: Haan, sahi hai. Dekho, rangin tukda roti ke 2 barabar tukdon mein se 1 hai, toh 1/2, yaani aadha; neeche wala number 2 hai. Yeh pizza aur yeh cake, dono ke 3-3 tukde. Cake ke teeno tukde barabar hain, toh wahan har tukda ek-tihaai hai, 1/3. Pizza mein ek tukda bada hai aur do chhote. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"roti"}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e2 · board up · ready 1850 ms]: Ek-tihaai ki jaanch aise hoti hai: ek tukda utha kar baaki do tukdon se milao. Cake ka har tukda baaki dono se bilkul milta hai, isliye cake ka har tukda 1/3 hai. Yahi jaanch pizza ke tukdon par karke dekho. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 3348 ms · guard leak]: Pizza aur cake ab do patti ban gaye hain, pizza upar wali patti mein aur cake neeche wali mein. Dono pattiyon ke teen-teen tukde hain. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** sawaal kya hai?  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 · board up · ready 2865 ms · guard dodged,samecard]: Phir se dekho: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-unequal-parts · board up · ready 2138 ms]: Nahi, yeh theek nahi hai. Ab isi baat ko doosri tarah samajhte hain. Ek rassi socho, jo ek lambe aur kuch chhote tukdon mein kati. Yeh baant barabar nahi, isliye tukde gin kar fraction naam nahi rakh sakte. Ab ek kaagaz ko theek beech se modo aur kaato: dono tukde ek jaise hain, tabhi har tukda aadha hai. Ab tak samajh aaya?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 2201 ms]: Ek seb ko 3 tukdon mein kaato, ek mota aur do patle. Tukde 3 hain, par inhe ek-tihaai nahi kehte, kyunki ek-tihaai tabhi hota hai jab teeno ek jitne hon. Roti ke 2 tukde hue: ek bada, ek chhota. Kya bada tukda roti ke aadhe se zyada hai?
  > card: Roti ke 2 tukde hue: ek bada, ek chhota. Kya bada tukda roti ke aadhe se zyada hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Seb"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 1021 ms]: Roti ke beech mein ek line socho jo use do barabar aadhon mein baante. Ab dekho, bada tukda us line par rukta hai ya usse aage jaata hai. Kya bada tukda roti ke aadhe se zyada hai?
  > card: Roti ke 2 tukde hue: ek bada, ek chhota. Kya bada tukda roti ke aadhe se zyada hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 1920 ms]: Haan, pehle tum try karo.
  > card: Roti ke 2 tukde hue: ek bada, ek chhota. Kya bada tukda roti ke aadhe se zyada hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"}]}}

**child:** No  _(misconception)_

**Asha** [repair · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 1660 ms · guard uncorrected]: Nahi, do tukde barabar hon tabhi har ek aadha hota; yahan bada tukda chhote se bada hai, toh aadhe se zyada. Yeh hissa saaf hua?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:check:then:c4-maths-ch05-t01-m-unequal-parts · board up · ready 2010 ms]: Aadha tab hota jab dono tukde ek jitne hote; bada tukda chhote se zyada roti le gaya, isliye woh aadhe se aage nikal gaya. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s1:explain:e2 · board up · ready 1790 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** batting  _(no_evidence · aside)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 (1 miss) · board up · ready 1707 ms]: Achha, toh tumhe batting sabse achha lagta hai. Ab seekhne par wapas aate hain. Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":2,"equal":false,"title":"Roti"},{"parts":2,"title":"Barabar"}]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 (2 miss) · board up · ready 1712 ms]: Nahi, yeh theek nahi hai. Pizza ka chhota tukda uske bade tukde ke saath milaa kar dekho. Phir cake ke tukdon ko aapas mein milao. Kya pizza ka ek chhota tukda poore pizza ka ek-tihaai hai?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** phir se bolo  _(no_evidence · repeat)_

**Asha** [practice · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 (2 miss) · board up · ready 3214 ms · guard samecard]: Phir se dekho: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c4-maths-ch05-t01-s1:ask:e2 (3 miss) · board up · ready 1696 ms · guard twoq]: Nahi, yeh jawab nahi hai. Ek-tihaai ka naam do baaton se milta hai: poori cheez ke 3 tukde, aur teeno ek jitne bade. Cake mein yeh dono baatein hain. Kya pizza ka ek chhota tukda poore pizza ka ek-tihaai hai?
  > card: Pizza ka ek chhota tukda lo. Kya woh pizza ka ek-tihaai hai, haan ya nahi?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** Yes  _(misconception)_

**Asha** [repair · beat s1:explain:e2 · board up · ready 1958 ms]: Nahi, pizza ke tukde chhote-bade hain, aur ek-tihaai tabhi banta hai jab 3 tukde barabar hon. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [reteach · beat s1:explain:e2 · board up · ready 1822 ms]: Chhota tukda ek-tihaai hota toh teen chhote tukde milkar poora pizza bana dete, par yahan ek tukda bada hai. Ab tak samajh aaya?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 1901 ms]: Koi baat nahi, aisa sawaal aage phir aayega, tab saath mein dekhenge. Is circle ke 3 barabar tukde hain, ek mein rang. Yeh rangin tukda ek-tihaai hai, 1/3. Neeche wala number 3 isliye hai, kyunki poore circle ke 3 barabar tukde hain. Yeh hissa saaf hua?
  > screen: board fraction-parts@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":3,"equal":false,"title":"Pizza"},{"parts":3,"title":"Cake"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e3 · check script:c4-maths-ch05-t01-s1:ask:e3 · board up · ready 2779 ms]: Ulta chalo: agar tumhe 1/3 banana ho, toh pehle circle ko 3 barabar tukdon mein kaato, phir ek tukde mein rang bharo. Board par theek yahi hua hai. Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > card: Ek aur tukde mein rang bharo. Ab rangin tukde poore circle ka kaunsa fraction hain?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":1,"whole":"circle"}}

**child:** do bata teen  _(correct)_

**Asha** [explain · beat s1:explain:e4 · board up · ready 1868 ms · guard mustsay]: Haan, sahi hai. Dekho, circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Is baar upar wali patti ke 8 barabar tukde hain. Ek mein rang, saat bina rang ke. Rangin tukda 1/8 hai. Dhyaan do, 1/8 ka 8 saare tukde ginta hai, bache hue 7 nahi. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":3,"shade":2,"whole":"circle"}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 · board up · ready 4463 ms · guard long]: Neeche wali patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Neeche wali patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** Yes  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c4-maths-ch05-t01-m-part-part · board up · ready 1858 ms]: Nahi, yeh theek nahi hai. Ek naye tareeke se socho. Jab chocolate ke saare tukde barabar hon, toh neeche wala number batata hai ki poori chocolate kitne barabar tukdon mein bati thi. Tukde kha lo ya bacha lo, yeh ginti nahi badalti. Upar wala number bas woh tukde ginta hai jinki baat ho rahi hai. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** haan  _(no_evidence)_

**Asha** [practice · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part · board up · ready 2185 ms]: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** Golu  _(misconception)_

**Asha** [hint · beat s1:check:then:c4-maths-ch05-t01-m-part-part · check script:c4-maths-ch05-t01-s1:then:c4-maths-ch05-t01-m-part-part (1 miss) · board up · ready 2188 ms · guard uncorrected]: Nahi, yeh jawab nahi hai. Board par chocolate ke saare tukde gino, rangin bhi aur bina rang ke bhi. Phir sirf rangin tukde gino. 4 barabar tukdon wali chocolate ke 2 tukde khaye gaye, toh Pinky ka 2/4 sahi hai ya Golu ka 2/2?
  > card: Is chocolate ke rangin tukde khaye gaye. Pinky kehti hai 2/4, Golu kehta hai 2/2. Kiska sahi hai, Pinky ka ya Golu ka?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":""}]}}

**child:** pinky ka jawab  _(correct)_

**Asha** [practice · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (1 miss) · board up · ready 1783 ms]: Haan, sahi hai. Dekho, khaye hue 2 tukde chocolate ke 4 barabar tukdon mein se hain, toh 2/4; bache hue 2 neeche wala number nahi. Ab pehle wale sawaal ko phir se dekhte hain. Neeche wali patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > card: Neeche wali patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"}]}}

**child:** Yes  _(misconception)_

**Asha** [hint · beat s1:explain:e4 · check script:c4-maths-ch05-t01-s1:ask:e4 (2 miss) · board up · ready 2397 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Kaatne se pehle neeche wali patti mein kitne tukde the, woh gino. Phir use Raju ke 5 se milao. 6 barabar tukdon wali patti se 1 tukda kata aur 5 bache, toh kya Raju ne patti ka 1/5 liya?
  > card: Neeche wali patti ke 6 barabar tukde hain. Raju ne 1 tukda kaat kar le liya, 5 bache. Raju kehta hai usne patti ka 1/5 liya, kyunki 5 tukde bache. Kya Raju sahi hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"?"}]}}

**child:** No hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:problem · board up · ready 2138 ms]: Bilkul sahi: Raju ka tukda patti ke 6 tukdon mein se 1 hai, toh 1/6, 1/5 nahi; bache hue 5 tukde naam nahi badalte. Ab ek sawaal milkar, kadam-kadam karke hal karte hain. Ek lambi barfi ke 5 barabar tukde kiye, aur 3 tukde kha liye. Ab dekhte hain ki khaye hue tukde poori barfi ka kaunsa fraction hain. Yeh kadam saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":8,"shade":1,"label":"1/8"},{"parts":6,"shade":1,"label":"1/6"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1079 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


