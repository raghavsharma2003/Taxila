# steady-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 3279 ms · guard mustsay,answerinq,long]: Socho, roti ko beech se modkar aadhe par ghee lagaya, phir ek baar aur moda. Yahi kaam kaagaz ki patti par: beech se modi, toh 2 barabar hisse bane; rang wala ek hissa patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 870 ms · guard uncorrected]: 1 sahi nahi hai. 1 nahi: rang wala aadha pehli patti ka ek bada hissa hai, par doosri patti ke hisse chhote hain, isliye ek bade hisse mein kai chhote hisse aate hain. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (2 miss) · board up · ready 2214 ms · guard level,twoq,uncorrected]: Nahi, 1 theek nahi. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. Ab tum batao.
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (2 miss) · board up · ready 2814 ms · guard answerinq]: Ek roti do bachche barabar baantein, toh har ek ko aadhi roti milti hai. Is patti ka rang wala hissa bhi waisa hi hai: do barabar mein se ek. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** paanch hisse  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 1797 ms · guard mustsay,answerinq]: Haan, bilkul theek, kyunki 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** 6 hisson mein  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 2633 ms · guard answerinq,leak,long]: Sahi jawab. Suno, 4 × 3 = 12, toh rang wale 2 × 3 = 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** 6 gap chalne honge  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2421 ms · guard noconfirm]: Haan, sahi hai: line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Ab agla sawaal kadam-kadam, milkar hal karte hain. Sana ek chaukor rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** aath hisse  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 1805 ms]: Haan, kholne par 8 barabar hisse dikhenge. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 1666 ms]: Rumal ke hisse yahan do ek jaise gol mein dikhaye hain: pehla gol do barabar hisson mein, ek mein rang, aur doosra aath barabar hisson mein. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 787 ms]: Haan, bilkul theek. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai, kyunki hisse badle, par rumal par rang utna hi raha. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** dono ne  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 789 ms]: Sahi jawab. Suno, 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** chhota hai 1/2 se  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1782 ms]: Haan, sahi hai: 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 4062 ms · guard long]: Theek hai, ab agli baat. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 3224 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 4  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 1152 ms · guard mustsay]: Haan, bilkul theek, kyunki har rang wala hissa 2 bana, toh 4. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Neeche 5 × 2 = 10 aur upar 2 × 2 = 4: dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 10/12  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 2430 ms · guard mustsay,long]: Sahi jawab. Suno, dono number 2 se guna hue. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** teesre par aayega  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2289 ms · guard long,noconfirm]: Haan, sahi hai: 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Aao, yeh sawaal main aur tum saath mein karenge. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [reteach · beat s2:worked:worked:step1 · board up · ready 1702 ms]: Haan, Hindi mein kehti hoon. Neeche ab 5 ki jagah 10 hai. Fraction wahi rahe, iske liye upar wale 3 ka kya karna hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1961 ms]: Achha, cricket par thodi der mein zaroor lautenge. Pehle is sawaal ka jawab do.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** haan samajh gayi  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2072 ms · guard wrap]: 3/5 ke barabar fraction mein neeche 5 se 10 bana; ab upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2605 ms · guard long]: Patti socho: neeche ka number badla, matlab har hissa chhote hisson mein kata. Ab socho ki rang wale hisson ka kya hua hoga. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** ise bhi 2 se guna  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked · board up · ready 3468 ms · guard affirms]: Haan, upar ke 3 ko bhi 2 se guna karna hoga. Upar 3 × 2 = 6 hua, toh 3/5 aur 6/10 barabar hain. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** 9  _(correct)_

**Asha** [repair · beat s2:worked:worked · board up · ready 2218 ms · guard flat]: Haan, bilkul theek. Toh poora jawab: upar ke number 6 aur 9 hain: neeche 5 × 3 = 15 hua, toh upar bhi 3 × 3 = 9, yaani 3/5 = 9/15. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 · board up · ready 2012 ms]: Wah, Virat! Toh yeh tumhe achha lagta hai. Achha, ab padhai ki taraf mudte hain. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** 1  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only · board up · ready 2174 ms · guard leak,long,uncorrected]: 1 sahi nahi hai. Ise alag tareeke se dekhte hain. Patti ka har hissa 2 mein kaato, toh kul hisse bhi dugne hote hain aur rang wale hisse bhi. Isliye upar aur neeche, dono number 2 se guna hote hain, koi ek nahi. 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only (1 miss) · board up · ready 1996 ms · guard leak,uncorrected]: Nahi, 1 theek nahi. 12 hisson wali patti ka ek hissa, 6 hisson wali patti ke ek hisse se chhota hai. Isliye upar 1 hi rakhne se rang kam ho jaata hai. Neeche 12 ho, toh 1/6 ke barabar fraction ka upar wala number kya aayega?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1}]}}

**child:** 2 hai na  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 (1 miss) · board up · ready 3062 ms]: Sahi jawab, kyunki neeche 6 × 2 = 12, toh upar bhi 1 × 2 = 2, yaani 2/12. Ab us sawaal par lautte hain jo humne pehle chhoda tha. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":12,"shade":2,"title":"2/12"}]}}

**child:** 4 aayega  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 · board up · ready 1484 ms]: Haan, bilkul theek. Neeche 3 × 4 = 12 hua, toh upar bhi 1 × 4 = 4, yaani 1/3 = 4/12. Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":12,"shade":4,"title":"4/12"}]}}

**child:** 7  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same · board up · ready 3727 ms · guard leak,long,uncorrected]: 7 sahi nahi hai. Ek aur raasta aazmaate hain. Patti ke 4 hisson se 8 banane ke liye har hissa 2 mein kaata, toh rang wala 1 hissa bhi 2 hisse bana. Isliye upar aur neeche, dono 2 se guna hue. 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3}]}}

**child:** 4/6  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 (1 miss) · board up · ready 1468 ms]: Haan, sahi hai: neeche 3 × 2 = 6 hua, toh upar bhi 2 × 2 = 4. Achha, ab pehle wale sawaal ko phir se dekhte hain. Neeche 8 ho, toh 3/4 ke barabar fraction ka upar wala number kya hoga?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2,"title":"2/3"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** 7  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 (2 miss) · board up · ready 1613 ms]: Nahi, 7 theek nahi. Neeche ke 4 hisse 8 bane, yaani har hissa 2 mein kata. Toh rang wala har hissa bhi 2 mein katega; upar 4 jodne se aisa nahi hota. Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3}]}}

**child:** 6 hai na  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 · board up · ready 3423 ms]: Sahi jawab, kyunki neeche 4 × 2 = 8 hua, toh upar bhi 3 × 2 = 6. 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3,"title":"3/4"},{"parts":8,"shade":6,"title":"6/8"}]}}

**child:** 3/12 wala  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1071 ms]: Haan, bilkul theek. Neeche 4 × 3 = 12, toh upar 1 × 3 = 3, yaani 3/12; 1/12 mein upar guna nahi hua. Ab barabar fraction banana aa gaya. Ab ulta kaam: do fraction diye hon, toh kaise pata karein ki woh barabar hain ya nahi. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":12,"shade":3,"title":"3/12"}]}}

**child:** jo aapne dikhaya tha, usse socha  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t03-s3:ask:e1 · board up · ready 4824 ms · guard mustsay,long]: Is line par 0 se 3/4 tak 1/8 wale 6 gap hain. Toh 3/4 = 6/8: ek hi mark, do naam. Zoya ka kehna hai ki number alag hain, toh 1/4 aur 2/8 line par alag jagah honge. Line par dekho: 1/4 aur 2/8 ek hi mark par hain ya alag?
  > card: Zoya ka kehna hai ki number alag hain, toh 1/4 aur 2/8 line par alag jagah honge. Line par dekho: 1/4 aur 2/8 ek hi mark par hain ya alag?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":6,"label":"3/4 = 6/8"}]}}

**child:** dono ek hi mark par hain  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c5-maths-ch02-t03-s3:ask:e2 · board up · ready 2335 ms · guard mustsay,long]: Haan, sahi hai: 2/8 aur 1/4 ek hi mark par hain. Ek tareeka: dekho ki ek fraction ke upar-neeche ek hi number se guna karke doosra banta hai ya nahi. Jaise upar 2 × 3 = 6, neeche 3 × 3 = 9, toh 2/3 = 6/9. Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > card: Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":2,"label":"1/4 = 2/8"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** dono 5 se guna hue  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c5-maths-ch02-t03-s3:ask:e3 · board up · ready 2004 ms · guard mustsay]: Bilkul sahi, kyunki 1 × 5 = 5 aur 2 × 5 = 10. Yeh jaanch nahi bhi bol sakti hai. 2/3 aur 4/9 mein upar 2 × 2 = 4 hua, par neeche 3 × 3 = 9: upar ek number se, neeche doosre se, isliye barabar nahi. Isi tarah jaancho: 1/2 aur 2/6 barabar hain, ya 1/2 bada hai, ya 2/6 bada hai?
  > card: Isi tarah jaancho: 1/2 aur 2/6 barabar hain, ya 1/2 bada hai, ya 2/6 bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** aadha zyada hai  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 3748 ms · guard leak,screenmismatch]: Sahi jawab. Upar 2 se guna hua, neeche 3 se, isliye barabar nahi; aur 1/2 = 3/6, jo 2/6 se bada hai. Chalo, ab ek sawaal hum saath mein karte hain. Rahul ne ek chikki ka 3/4 khaya, aur Sita ne waisi hi chikki ka 9/12. Dekhte hain ki dono ne barabar chikki khayi ya nahi. Neeche 4 se 12 bana. Upar ke 3 ko kis number se guna karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** 3 × 3  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t03-s3:ask:worked · board up · ready 2359 ms · guard affirms]: Haan, upar ko bhi 3 se guna karna hoga. Upar 3 × 3 = 9 aata hai, aur Sita ke fraction mein bhi upar 9 hai. Isliye 3/4 aur 9/12 barabar hain. Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > card: Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 9/12 se kam  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t03-s3:c1 · board up · ready 1062 ms]: Haan, bilkul theek: Rahul ka 3/4, baarah hisson mein 9 hisse hai; Mohan ke sirf 8 hain, yaani ek hissa kam. Toh poora jawab: Sita ne Rahul jitna khaya, aur Mohan ne Rahul se kam. Ab agla sawaal tumhare liye. Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10, 2/6 ya 1/10?
  > card: Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10, 2/6 ya 1/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** 2/10 wala  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t03-s3:c2 · board up · ready 3817 ms · guard leak,long]: Haan, sahi hai, kyunki 5 × 2 = 10 aur 1 × 2 = 2, toh 2/10; 2/6 mein 1 joda, 1/10 mein upar guna nahi. Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par question mark laga hai. Kya woh mark 4/5 ke barabar hai?
  > card: Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par question mark laga hai. Kya woh mark 4/5 ke barabar hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":10,"shade":2,"label":"2/10"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** haan, 4/5 ke barabar hai  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t03-s3:c3 · board up · ready 2280 ms]: Bilkul sahi. 0 ke baad aathva mark 8/10 hai, aur 4/5 ke upar aur neeche ko 2 se guna karke 8/10 banta hai. Zoya ka kehna hai ki 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Bada kaun hai: 3/7 ya 4/8, ya dono barabar hain?
  > card: Zoya ka kehna hai ki 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Bada kaun hai: 3/7 ya 4/8, ya dono barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":8,"label":"8/10 = 4/5"}]}}

**child:** 4/8 wala bada hai  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 946 ms]: Sahi jawab, kyunki 4/8 aadha hai, 3/7 aadhe se kam. Aaj ki saari baatein jodne wala ek hi sawaal bacha hai. Ek patti ke 3 barabar hisse hain aur 2 mein rang hai, yaani 2/3. Ab har hissa 4 chhote barabar hisson mein kaat diya. Fraction mein bolo: ab rang wala hissa 12 chhote hisson mein se kitne hisse hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** 8/12  _(correct)_

**Asha** [wrap · beat end:teachback:teachback:answer · board up · ready 4 ms]: Haan, bilkul theek. Dekho, har hissa 4 mein kata, toh kul hisse 3 × 4 = 12 hue aur rang wale 2 × 4 = 8; rang utna hi raha, isliye 2/3 = 8/12. Aaj dekha ki hisson ko barabar chhote hisson mein kaatne se fraction ke number badalte hain, rang nahi. Phir dekha: upar aur neeche ek hi number se guna hon, toh fraction barabar hote hain. Aaj ka paath kaisa laga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** sawaal achhe the  _(incorrect)_

**Asha** [wrap · beat end:teachback:teachback:answer · board up · ready 2175 ms]: Achha, yeh jaanna mere kaam ka hai. Aaj tumne farak se dhokha khaye bina 3/7 aur 4/8 mein bada pehchaana. Aaj ke liye itna hi, phir milenge!
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":12,"shade":8,"label":"8/12"}]}}

## Agent


