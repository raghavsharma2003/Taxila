# steady-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 3671 ms · guard answerinq,long]: Socho: roti aadhi modkar ek aadhe par ghee lagaya; ghee aadhi roti par hai. Kaagaz ki patti par yahi: beech se modi, toh 2 barabar hisse; rang wala hissa patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 1223 ms · guard uncorrected]: 1 sahi nahi hai. Rang wala aadha pehli patti ka ek bada hissa hai, par doosri patti ke hisse chhote hain; ek bade hisse mein kai chhote hisse aate hain. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (2 miss) · board up · ready 764 ms · guard uncorrected]: Nahi, 1 theek nahi. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. Ab tum batao.
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (2 miss) · board up · ready 2163 ms · guard answerinq]: Ek roti do bachche barabar baantein, toh har ek ko aadhi roti milti hai. Is patti ka rang wala hissa bhi waisa hi hai: do barabar mein se ek. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** paanch hisse  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 2543 ms · guard mustsay,answerinq]: Haan, bilkul theek, kyunki 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** 6 hisson mein  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 1281 ms · guard mustsay,noconfirm]: Sahi jawab. 4 × 3 = 12, toh rang wale 2 × 3 = 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** 6 gap chalne honge  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2708 ms · guard noconfirm]: Haan, sahi hai: line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Ab agla sawaal kadam-kadam, milkar hal karte hain. Sana ek chaukor rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** aath hisse  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2010 ms · guard affirms,answerinq]: Haan, kholne par 8 barabar hisse dikhenge. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 3140 ms · guard answerinq,leak,samecard]: Yeh rumal ke teeno mod hain: pehle mod par do hisse, ek mein rang; doosre mod par chaar hisse; teesre par aath. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":4,"shade":2,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 931 ms]: Haan, bilkul theek. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai, kyunki hisse badle, par rumal par rang utna hi raha. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** dono ne  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 1157 ms]: Sahi jawab. 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** chhota hai 1/2 se  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 2124 ms]: Haan, sahi hai: 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [reteach · beat s2:bridge:bridge · board up · ready 2708 ms]: Modne par 1/2 se 2/4 bana, aur rang utna hi raha. Ab yahi kaam modne ki jagah guna karke karenge. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 2403 ms · guard mustsay,long]: Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 3365 ms · guard praise,affirms,samecard]: Haan, pehle tum try karo.
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 4  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 1366 ms · guard mustsay,noconfirm]: Haan, bilkul theek, kyunki har rang wala hissa 2 bana, toh 4. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Neeche 5 × 2 = 10 aur upar 2 × 2 = 4: dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 10 by 12  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 2770 ms · guard mustsay,long,screenmismatch]: Sahi jawab. Dono number 2 se guna hue. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 2028 ms · guard long]: Achha, ise aur seedhe shabdon mein bolti hoon. Pehle socho ki 2/4 kis aur fraction ke barabar hai. Phir woh fraction is line par dhoondo. 1/3 ke upar aur neeche 1 jodkar 2/4 banta hai; 0 se 1 tak 6 gap wali is line par, 2/4 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"}]}}

**child:** beech mein  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1492 ms]: Haan, sahi hai: 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Aao, yeh sawaal main aur tum saath mein karenge. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** isko bhi 2 se guna karenge  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked · board up · ready 1865 ms]: Haan, upar ke 3 ko bhi 2 se guna karna hoga. Upar 3 × 2 = 6 hua, toh 3/5 aur 6/10 barabar hain. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"left":{"title":"3/5","items":["upar 3 × 2 = 6","neeche 5 × 2 = 10"]},"right":{"title":"6/10","items":["dono × 2","barabar"]}}}

**child:** nau  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 · board up · ready 1130 ms]: Haan, bilkul theek. Toh poora jawab: upar ke number 6 aur 9 hain: neeche 5 × 3 = 15 hua, toh upar bhi 3 × 3 = 9, yaani 3/5 = 9/15. Ab agla sawaal tumhare liye. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":3,"title":"3/5 = 6/10 = 9/15"}]}}

**child:** 4  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 · board up · ready 2560 ms · guard noconfirm]: Sahi jawab, kyunki neeche 3 × 4 = 12 hua, toh upar bhi 1 × 4 = 4, yaani 1/3 = 4/12. Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":12,"shade":4,"title":"4/12"}]}}

**child:** 7  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same · board up · ready 3016 ms · guard leak,long,uncorrected]: 7 sahi nahi hai. Ise alag tareeke se dekhte hain. Upar-neeche ek hi number jodne se barabar fraction nahi banta. 4 hisson se 8 banane ke liye har hissa 2 mein kaata, toh rang wala 1 hissa bhi 2 bana: dono 2 se guna hue. 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3}]}}

**child:** 5  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same (1 miss) · board up · ready 1294 ms]: Nahi, 5 theek nahi. 5/6 mein sirf ek chhota hissa khaali hai, par 2/3 mein ek bada hissa khaali hai. Isliye upar 3 jodne se rang badh gaya. 2/3 ke barabar, neeche 6 wale fraction ka upar wala number kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2}]}}

**child:** 4 hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 (1 miss) · board up · ready 5474 ms · guard leak]: Haan, sahi hai. 2/3 ke upar-neeche dono ko 2 se guna kiya: 2 × 2 = 4 aur 3 × 2 = 6, yaani 4/6. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2,"title":"2/3"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** upar 6  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 · board up · ready 2351 ms · guard noconfirm]: Haan, bilkul theek: 8 hisse banane ke liye har hissa do mein bata, toh 3 rang wale hisse 3 × 2 = 6 ho gaye. 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3,"title":"3/4"},{"parts":8,"shade":6,"title":"6/8"}]}}

**child:** 1/12  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only · board up · ready 1434 ms]: Yeh jawab sahi nahi hai. Ek aur raasta aazmaate hain. Patti ka har hissa 2 mein kaato, toh kul hisse bhi dugne hote hain aur rang wale hisse bhi. Isliye upar aur neeche, dono number 2 se guna hote hain, koi ek nahi. 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** upar 2  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 (1 miss) · board up · ready 1452 ms]: Sahi jawab, kyunki neeche 6 × 2 = 12, toh upar bhi 1 × 2 = 2, yaani 2/12. Achha, ab pehle wale sawaal ko phir se dekhte hain. 1/12, 3/12 aur 9/12 mein se 1/4 ke barabar kaun hai?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":12,"shade":2,"title":"2/12"}]}}

**child:** 1/12  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 (2 miss) · board up · ready 3912 ms · guard leak]: Nahi, 1/12 theek nahi. 1/12 mein sirf neeche badla, upar wahi 1 raha. Jab 4 hisse 12 bane, toh rang wale hisse ka kya hua, socho. 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** 3/12 hai na  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1958 ms]: Haan, sahi hai. Neeche 4 × 3 = 12, toh upar 1 × 3 = 3, yaani 3/12; 1/12 mein upar guna nahi hua. Ab barabar fraction banana aa gaya. Ab ulta kaam: do fraction diye hon, toh kaise pata karein ki woh barabar hain ya nahi. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":12,"shade":3,"title":"3/12"}]}}

**child:** jo aapne dikhaya tha, usse socha  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t03-s3:ask:e1 · board up · ready 4468 ms · guard mustsay,long]: Is line par 0 se 3/4 tak 1/8 wale 6 gap hain. Toh 3/4 = 6/8: ek hi mark, do naam. Zoya ka kehna hai ki number alag hain, toh 1/4 aur 2/8 line par alag jagah honge. Line par dekho: 1/4 aur 2/8 ek hi mark par hain ya alag?
  > card: Zoya ka kehna hai ki number alag hain, toh 1/4 aur 2/8 line par alag jagah honge. Line par dekho: 1/4 aur 2/8 ek hi mark par hain ya alag?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":6,"label":"3/4 = 6/8"}]}}

**child:** ek hi jagah par  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c5-maths-ch02-t03-s3:ask:e2 · board up · ready 2050 ms · guard mustsay]: Haan, bilkul theek: 2/8 aur 1/4 ek hi mark par hain. Ek tareeka: dekho ki ek fraction ke upar-neeche ek hi number se guna karke doosra banta hai ya nahi. Jaise upar 2 × 3 = 6, neeche 3 × 3 = 9, toh 2/3 = 6/9. Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > card: Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":2,"label":"1/4 = 2/8"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** 5 se  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c5-maths-ch02-t03-s3:ask:e3 · board up · ready 1288 ms · guard mustsay,noconfirm]: Sahi jawab, kyunki 1 × 5 = 5 aur 2 × 5 = 10. Yeh jaanch nahi bhi bol sakti hai. 2/3 aur 4/9 mein upar 2 × 2 = 4 hua, par neeche 3 × 3 = 9: upar ek number se, neeche doosre se, isliye barabar nahi. Isi tarah jaancho: 1/2 aur 2/6 barabar hain, ya 1/2 bada hai, ya 2/6 bada hai?
  > card: Isi tarah jaancho: 1/2 aur 2/6 barabar hain, ya 1/2 bada hai, ya 2/6 bada hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** half  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 2605 ms · guard leak]: Bilkul sahi. Upar 2 se guna hua, neeche 3 se, isliye barabar nahi; aur 1/2 = 3/6, jo 2/6 se bada hai. Chalo, ab ek sawaal hum saath mein karte hain. Rahul ne ek chikki ka 3/4 khaya, aur Sita ne waisi hi chikki ka 9/12. Dekhte hain ki dono ne barabar chikki khayi ya nahi. Neeche 4 se 12 bana. Upar ke 3 ko kis number se guna karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** teen se  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t03-s3:ask:worked · board up · ready 1409 ms]: Haan, upar ko bhi 3 se guna karna hoga. Upar 3 × 3 = 9 aata hai, aur Sita ke fraction mein bhi upar 9 hai. Isliye 3/4 aur 9/12 barabar hain. Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > card: Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"compare@1","params":{"left":{"title":"3/4","items":["upar 3 × 3 = 9","neeche 4 × 3 = 12"]},"right":{"title":"9/12","items":["dono × 3","barabar"]}}}

**child:** ek hissa kam  _(correct)_

**Asha** [repair · beat s3:worked:worked · board up · ready 1840 ms]: Haan, sahi hai: Rahul ka 3/4, baarah hisson mein 9 hisse hai; Mohan ke sirf 8 hain, yaani ek hissa kam. Toh poora jawab: Sita ne Rahul jitna khaya, aur Mohan ne Rahul se kam. Achha, ab aage chalte hain.
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":9,"label":"9/12"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [practice · beat s3:check:c1 · board up · ready 2754 ms]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":9,"label":"9/12"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t03-s3:c1 · board up · ready 2725 ms]: Achha, toh tumhe sixer pasand hai! Ab phir se seekhne mein lag jaate hain. Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10, 2/6 ya 1/10?
  > card: Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10, 2/6 ya 1/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":9,"label":"9/12"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** 2/10  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t03-s3:c2 · board up · ready 3548 ms · guard long,noconfirm]: Haan, bilkul theek, kyunki 5 × 2 = 10 aur 1 × 2 = 2, toh 2/10; 2/6 mein 1 joda, 1/10 mein upar guna nahi. Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par question mark laga hai. Kya woh mark 4/5 ke barabar hai?
  > card: Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par question mark laga hai. Kya woh mark 4/5 ke barabar hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":10,"shade":2,"label":"2/10"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** yes hai na  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t03-s3:c3 · board up · ready 2800 ms]: Sahi jawab. 0 ke baad aathva mark 8/10 hai, aur 4 × 2 = 8, 5 × 2 = 10, yaani 8/10 = 4/5. Zoya ke hisaab se 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Bada kaun hai: 3/7 ya 4/8, ya dono barabar hain?
  > card: Zoya ke hisaab se 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Bada kaun hai: 3/7 ya 4/8, ya dono barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":8,"label":"8/10 = 4/5"}]}}

**child:** barabar  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s3:then:c5-maths-ch02-t03-m-add-same · board up · ready 3512 ms · guard leak,uncorrected]: Yeh jawab sahi nahi hai. Isko doosri tarah se samajhte hain. Pehli patti 2 hisson mein, doosri 3 mein, aur rang 1/2 aur 2/3 hai. Dono mein neeche wala number upar se 1 zyada hai, phir bhi 2/3 mein rang zyada hai. 2/5 ke barabar fraction ka upar 4 ho, toh neeche kya hoga?
  > card: 2/5 ke barabar fraction ka upar 4 ho, toh neeche kya hoga?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** neeche 10  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t03-s3:c3 (1 miss) · board up · ready 1310 ms]: Haan, sahi hai: upar 2 × 2 = 4 hua, toh neeche bhi 5 × 2 = 10. Chalo, pehle wale sawaal ki taraf wapas aate hain. 3/7 aur 4/8 mein bada kaun hai, ya dono barabar hain?
  > card: Zoya ke hisaab se 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Bada kaun hai: 3/7 ya 4/8, ya dono barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":2,"title":"2/5"},{"parts":10,"shade":4,"title":"4/10"}]}}

**child:** barabar  _(misconception)_

**Asha** [hint · beat s3:check:c3 · check script:c5-maths-ch02-t03-s3:c3 (2 miss) · board up · ready 2011 ms]: Abhi yeh sahi nahi hai. Upar-neeche ka farak ek jaisa hone se fraction barabar nahi hote. 1/2 aur 2/3, dono mein farak 1 hai, par dono barabar nahi. Zoya ke hisaab se 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Bada kaun hai: 3/7 ya 4/8, ya dono barabar hain?
  > card: Zoya ke hisaab se 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Bada kaun hai: 3/7 ya 4/8, ya dono barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":0,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 3/7 kam hai  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 7 ms]: Haan, bilkul theek. 4/8 aadha hai, 3/7 aadhe se kam. Aaj ki saari baatein jodne wala ek hi sawaal bacha hai. Ek patti ke 3 barabar hisse hain aur 2 mein rang hai, yaani 2/3. Ab har hissa 4 chhote barabar hisson mein kaat diya. Fraction mein bolo: ab rang wala hissa 12 chhote hisson mein se kitne hisse hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** 8/12  _(correct)_

**Asha** [wrap · beat end:teachback:teachback:answer · board up · ready 7 ms]: Sahi jawab, kyunki har hissa 4 mein kata, toh kul hisse 3 × 4 = 12 hue aur rang wale 2 × 4 = 8; rang utna hi raha, isliye 2/3 = 8/12. Aaj dekha ki hisson ko barabar chhote hisson mein kaatne se fraction ke number badalte hain, rang nahi. Phir dekha: upar aur neeche ek hi number se guna hon, toh fraction barabar hote hain. Aaj ka paath kaisa laga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** achha laga  _(no_evidence)_

**Asha** [wrap · beat end:teachback:teachback:answer · board up · ready 1528 ms]: Theek hai, achha hua tumne bataya. Aaj tumne 10 gap wali line par 4/5 ka mark pehchaana. Aaj ke liye itna hi, phir milenge!
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":12,"shade":8,"label":"8/12"}]}}

## Agent


