# steady-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 2969 ms · guard answerinq,long]: Socho, roti ko beech se modkar aadhe par ghee lagaya, phir ek baar aur moda. Yahi kaam kaagaz ki patti par: beech se modi, toh 2 barabar hisse bane; rang wala ek hissa patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 3  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 1142 ms · guard twoq,uncorrected]: 3 sahi nahi hai. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 5 hisse  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 2098 ms · guard mustsay,answerinq,long,twoq]: Haan, bilkul theek, kyunki 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 1733 ms · guard answerinq]: Pehle dekho ki pehli patti ke ek hisse ke neeche doosri patti ke kitne hisse aate hain. Phir rang wale hisson ke neeche dekho. 12 hisson wali patti mein kitne hisson mein rang bharen ki rang pehli patti jitna ho?
  > card: Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 7  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 827 ms]: Nahi, 7 theek nahi. Pehli patti ke har hisse ke neeche doosri patti ke 3 hisse aate hain, aur rang pehli patti ke 2 hisson par hai. Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 6  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 922 ms · guard mustsay,noconfirm]: Sahi jawab. Dekho, 4 × 3 = 12, toh rang wale 2 × 3 = 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** 6  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1297 ms · guard noconfirm]: Haan, sahi hai: line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Ab agla sawaal kadam-kadam, milkar hal karte hain. Sana ek chaukor rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** 8 hai na  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2589 ms · guard answerinq]: Haan, kholne par 8 barabar hisse dikhenge. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2310 ms · guard leak]: Rumal ke hisse yahan do ek jaise gol mein dikhaye hain: pehla gol do barabar hisson mein, ek mein rang, aur doosra aath barabar hisson mein. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** mujhe lagta hai 4  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 3845 ms · guard long,noconfirm]: Haan, bilkul theek. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai, kyunki hisse badle, par rumal par rang utna hi raha. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** Anjali  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more · board up · ready 3008 ms · guard long,uncorrected]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Dono patti ek jitni lambi hain, pehli 2 hisson mein aur doosri 4 mein. Doosri ke hisse chhote hain: uske 2 hisse pehli ke ek hisse jitne hain. Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more (1 miss) · board up · ready 1435 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Chocolate ke 6 hisson ke teen barabar dher socho, aur dekho ki ek dher mein kitne hisse aate hain. Farhan ke 1/3 aur Zoya ke 6 mein se 2 hisson mein, zyada kisne khaya, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** dono ka barabar  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 (1 miss) · board up · ready 2789 ms · guard long]: Sahi jawab. Dekho, 6 barabar hisson mein se 2 hisse 2/6 hain, aur 2/6 = 1/3, isliye dono ne barabar khaya. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 (1 miss) · board up · ready 2411 ms · guard leak]: Haan, pehle tum try karo.
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** the same hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 1517 ms]: Haan, bilkul theek: 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** 1/2 se chhota  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1040 ms]: Haan, sahi hai, kyunki 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 3419 ms · guard mustsay,long]: Achha, cricket par thodi der mein zaroor lautenge. Ab yeh kaam poora karte hain. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 1698 ms]: Haan, Hindi mein kehti hoon. Pehli patti ke ek rang wale hisse ke neeche doosri patti ke hisse gino, phir doosre rang wale hisse ke neeche bhi. Pehli patti ke rang wale 2 hisse, doosri patti ke kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (1 miss) · board up · ready 1905 ms · guard answerinq,uncorrected]: Yeh jawab sahi nahi hai. Fraction ko do baaton ki tarah suno: neeche wala 5 kehta hai ki poore ke 5 barabar hisse hain, aur upar wala 2 kehta hai ki unmein se 2 lo. Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 1513 ms]: Haan, bilkul theek. Dekho, pehli patti ka har hissa doosri mein 2 chhote hisse bana, toh rang wale 2 hisse 2 × 2 = 4 hue. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 3421 ms · guard flat]: Achha, ab cricket ki baat sunti hoon, uske baare mein kuch aur bataoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** fielding karna, catch pakadna  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 2122 ms · guard mustsay]: Achha, toh tumhe catch pakadna sabse achha lagta hai. Ab padhai ki taraf mudte hain. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai: neeche 5 × 2 = 10 aur upar 2 × 2 = 4; dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 10/6  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only · board up · ready 3374 ms · guard leak,long,uncorrected]: Nahi, 10/6 theek nahi. Ek aur raasta aazmaate hain. Patti ka har hissa 2 mein kaato, toh rang wala hissa bhi 2 mein katta hai. Isliye neeche ke saath upar ka number bhi 2 se guna hota hai. 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only (1 miss) · board up · ready 1033 ms · guard uncorrected]: 1 sahi nahi hai. Pehle dekho ki 1/6 ka neeche wala number kis number se guna hokar 12 banta hai. Phir upar wale ko bhi usi se guna karo. Neeche 12 ho, toh 1/6 ke barabar fraction ka upar wala number kya aayega?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1}]}}

**child:** upar 2  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 (1 miss) · board up · ready 790 ms]: Haan, bilkul theek: neeche 6 × 2 = 12, toh upar bhi 1 × 2 = 2, yaani 2/12. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":12,"shade":2,"title":"2/12"}]}}

**child:** ten by twelve  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 3079 ms · guard mustsay,math,long]: Sahi jawab, kyunki dono number 2 se guna hue. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** third  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1017 ms · guard noconfirm]: Haan, sahi hai. Dekho, 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Aao, yeh sawaal main aur tum saath mein karenge. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. 3/5 ke barabar fraction ka neeche 10 hai. 5 kis se guna hua?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** times 2  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked · board up · ready 2046 ms · guard affirms]: Haan, 5 × 2 = 10, toh neeche 2 se guna hua. Neeche 2 se guna hua, toh upar ke 3 ko bhi 2 se: 3 × 2 = 6. Isliye 3/5 = 6/10. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** nau  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 · board up · ready 779 ms]: Bilkul sahi: har baar upar aur neeche ko ek hi number se guna kiya: pehle 2 se, phir 3 se. Toh poora jawab: upar ke number 6 aur 9 hain: 3/5 = 6/10 aur 3/5 = 9/15. Ab agla sawaal tumhare liye. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction ka upar wala number kya hoga?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction ka upar wala number kya hoga?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** mujhe lagta hai 4  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 · board up · ready 2045 ms]: Haan, bilkul theek, kyunki neeche 3 × 4 = 12 hua, toh upar bhi 1 × 4 = 4, yaani 1/3 = 4/12. Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":12,"shade":4,"title":"4/12"}]}}

**child:** chhe  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 · board up · ready 1002 ms]: Sahi jawab. Dekho, neeche 4 × 2 = 8 hua, toh upar bhi 3 × 2 = 6; 4 jodkar 7 nahi. 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3,"title":"3/4"},{"parts":8,"shade":6,"title":"6/8"}]}}

**child:** doosra wala  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1981 ms · guard math]: Haan, sahi hai: neeche 4 × 3 = 12, toh upar 1 × 3 = 3, yaani 3/12; 1/12 mein upar guna nahi hua. Ab barabar fraction banana aa gaya. Ab ulta kaam: do fraction diye hon, toh kaise pata karein ki woh barabar hain ya nahi. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":12,"shade":3,"title":"3/12"}]}}

**child:** maine dobara check kiya  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t03-s3:ask:e1 · board up · ready 3264 ms · guard mustsay,long]: Is number line par 0 se 1 tak 8 barabar gap hain. 6 gap chalkar 6/8 aata hai, aur wahi mark 3/4 bhi hai. Zoya ka kehna hai ki 1/4 aur 2/8 barabar nahi ho sakte, kyunki number alag hain. Isi line ko dekho: kya yeh baat sahi hai, haan ya nahi?
  > card: Zoya ka kehna hai ki 1/4 aur 2/8 barabar nahi ho sakte, kyunki number alag hain. Isi line ko dekho: kya yeh baat sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":6,"label":"3/4 = 6/8"}]}}

**child:** wrong  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c5-maths-ch02-t03-s3:ask:e2 · board up · ready 850 ms · guard mustsay]: Bilkul sahi. Dekho, 2/8 aur 1/4 ek hi mark par hain. Bina tasveer ke jaanchne ka tareeka: dekho ki upar aur neeche, dono ek hi number se guna hue ya nahi. 2/3 aur 6/9 mein upar 2 × 3 = 6, neeche 3 × 3 = 9, toh 2/3 = 6/9. Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > card: Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":2,"label":"1/4 = 2/8"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** 5 se  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c5-maths-ch02-t03-s3:ask:e3 · board up · ready 921 ms · guard mustsay,noconfirm]: Haan, bilkul theek: 1 × 5 = 5 aur 2 × 5 = 10. Yeh jaanch nahi bhi bol sakti hai. 2/3 aur 4/9 mein upar 2 × 2 = 4 hua, par neeche 3 × 3 = 9: upar ek number se, neeche doosre se, isliye barabar nahi. Isi tarah jaancho: 1/2 aur 2/6 barabar fraction hain ya nahi?
  > card: Isi tarah jaancho: 1/2 aur 2/6 barabar fraction hain ya nahi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** no  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 1398 ms · guard long]: Sahi jawab, kyunki upar 1 × 2 = 2 hua par neeche 2 × 3 = 6; ek hi number nahi hai, isliye barabar nahi. Chalo, ab ek sawaal hum saath mein karte hain. Rahul ne ek chikki ka 3/4 khaya, aur Sita ne waisi hi chikki ka 9/12. Dekhte hain ki dono ne barabar chikki khayi ya nahi. Neeche 4 se 12 bana. Upar ke 3 ko kis number se guna karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** three  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t03-s3:ask:worked · board up · ready 2410 ms · guard affirms,long]: Haan, upar ko bhi 3 se guna karna hoga. Upar 3 × 3 = 9 aata hai, aur Sita ke fraction mein bhi upar 9 hai. Isliye 3/4 aur 9/12 barabar hain. Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > card: Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** kam hai  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t03-s3:c1 · board up · ready 1014 ms]: Haan, sahi hai. Dekho, Sita ke 9/12 mein upar-neeche dono 3 se guna hue, isliye barabar; Mohan ke 8/12 mein upar 3 se guna nahi. Toh poora jawab: Sita ne Rahul jitna khaya, 3/4 = 9/12; Mohan ne usse kam khaya, 8/12. Ab ek sawaal tum akele karo. Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10, 2/6 ya 1/10?
  > card: Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10, 2/6 ya 1/10?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** pehla wala  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t03-s3:c2 · board up · ready 2075 ms]: Bilkul sahi: 5 × 2 = 10 aur 1 × 2 = 2, toh 2/10; 2/6 mein 1 joda, 1/10 mein upar guna nahi. Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai?
  > card: Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":10,"shade":2,"label":"2/10"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** no  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t03-m-different-numbers-unequal · check script:c5-maths-ch02-t03-s3:then:c5-maths-ch02-t03-m-different-numbers-unequal · board up · ready 3341 ms · guard leak]: Yeh jawab sahi nahi hai. Isko doosri tarah se samajhte hain. Yeh do patti ek jitni lambi hain, pehli ke 4 hisse aur doosri ke 8. Doosri ke 2 hisse milkar pehli ka 1 hissa banate hain: number alag, par patti utni hi. Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > card: Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"mark":8}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t03-m-different-numbers-unequal · check script:c5-maths-ch02-t03-s3:then:c5-maths-ch02-t03-m-different-numbers-unequal (1 miss) · board up · ready 1961 ms · guard leak,twoq]: Nahi, 0 theek nahi. Har fraction mein dekho ki neeche wala number upar wale ka theek teen guna hai ya nahi. 1/3 ke barabar kitne fraction hain, 3/9, 4/12 aur 5/12 mein se?
  > card: Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t03-m-different-numbers-unequal · check script:c5-maths-ch02-t03-s3:then:c5-maths-ch02-t03-m-different-numbers-unequal (2 miss) · board up · ready 2021 ms · guard leak,twoq]: 0 se baat nahi bani. 1/3 mein neeche wala number upar wale ka teen guna hai; har fraction mein yahi dekho. Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > card: Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** two of them  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t03-s3:c2 (1 miss) · board up · ready 3570 ms · guard leak]: Haan, bilkul theek, kyunki 1/3 ko 3 se guna karke 3/9 aur 4 se guna karke 4/12 banta hai; 5/12 nahi, isliye 2. Chalo, pehle wale sawaal ki taraf wapas aate hain. Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai?
  > card: Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":3,"label":"3/9"},{"parts":12,"shade":4,"label":"4/12"},{"parts":12,"shade":5,"label":"5/12"}]}}

**child:** barabar  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t03-s3:c3 · board up · ready 1101 ms]: Sahi jawab. Dekho, 0 ke baad aathva mark 8/10 hai, aur 4/5 ke upar aur neeche ko 2 se guna karke 8/10 banta hai. Zoya ka kehna hai ki 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Zoya ki baat sahi hai, haan ya nahi?
  > card: Zoya ka kehna hai ki 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Zoya ki baat sahi hai, haan ya nahi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":8,"label":"8/10 = 4/5"}]}}

**child:** sahi nahi  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 3 ms]: Haan, sahi hai: 4/8 theek aadha hai, par 3/7 aadhe se kam hai, kyunki 3 ka dugna 6 hi hai, 7 nahi. Aaj ki saari baatein jodne wala ek hi sawaal bacha hai. Ek patti ke 3 barabar hisse hain aur 2 mein rang hai, yaani 2/3. Ab har hissa 4 chhote barabar hisson mein kaat diya. Rang wale hisse ko ab kaunse fraction se bolenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** 8/12  _(correct)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 1573 ms]: Bilkul sahi, kyunki har hissa 4 mein kata, toh kul hisse 3 × 4 = 12 hue aur rang wale 2 × 4 = 8; rang utna hi raha, isliye 2/3 = 8/12. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** maine dobara check kiya  _(no_evidence)_

**Asha** [wrap · ready 1060 ms]: Theek hai, achha hua tumne bataya. Patti ko modne par hisse badhte hain par rang utna hi rehta hai, isliye 1/2 = 2/4 = 4/8. Ek hi number se upar-neeche guna karne par barabar fraction banta hai; ek hi number jodne par nahi. Alag number wale fraction bhi barabar ho sakte hain: line par dono ka mark ek ho, toh barabar. Aaj ka paath kaisa laga?

**child:** maza aaya  _(no_evidence)_

**Asha** [wrap · ready 1150 ms]: Achha, samajh gayi. Aaj tumne upar aur neeche ke farak wali galti pakdi. Aaj ke liye itna hi, phir milenge!

## Agent


