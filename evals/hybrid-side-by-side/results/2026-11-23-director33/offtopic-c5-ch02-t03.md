# offtopic-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 4205 ms · guard answerinq,long]: Socho, roti ko beech se modkar aadhe par ghee lagaya, phir ek baar aur moda. Yahi kaam kaagaz ki patti par: beech se modi, toh 2 barabar hisse bane; rang wala ek hissa patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 1296 ms]: 6 sahi nahi hai. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (2 miss) · board up · ready 1259 ms · guard uncorrected]: Nahi, 4 theek nahi. Rang wala aadha ek bada hissa hai, par doosri patti ke hisse chhote hain. Uske 10 hisson ko do barabar dher mein baanto; ek dher aadhi patti hai. Ab tum batao.
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** five  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 2592 ms · guard mustsay,answerinq,long,twoq,noconfirm]: Haan, sahi hai. Dekho, 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** chhe hisson mein  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 3812 ms · guard mustsay,leak]: Bilkul sahi: 4 × 3 = 12, toh rang wale 2 × 3 = 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 (1 miss) · board up · ready 1332 ms · guard uncorrected]: 4 se baat nahi bani. Pehle dekho ki 0 se 1/4 tak 1/8 wale kitne gap aate hain. Phir socho ki 3/4 mein aise kitne 1/4 hain. 0 se 3/4 tak pahunchne ke liye, is line par 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2 = 2/4 = 4/8"}]}}

**child:** 7  _(incorrect)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 (2 miss) · board up · ready 850 ms · guard uncorrected]: 7 sahi nahi hai. 3/4 ka matlab 3 gap nahi hai: is line ka har gap 1/8 hai, jo 1/4 se chhota hai, isliye 3/4 tak 3 se zyada gap lagenge. Apna jawab tum khud bolo.
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2 = 2/4 = 4/8"}]}}

**child:** 6/8  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1332 ms · guard noconfirm]: Haan, bilkul theek, kyunki line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Aao, yeh sawaal main aur tum saath mein karenge. Sana ek chaukor rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** aath hisse  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2646 ms · guard affirms,answerinq]: Haan, kholne par 8 barabar hisse dikhenge. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more · board up · ready 1186 ms · guard long,uncorrected]: Nahi, 8 theek nahi. Ise alag tareeke se dekhte hain. Dono patti ek jitni lambi hain, pehli 2 hisson mein aur doosri 4 mein. Doosri ke hisse chhote hain: uske 2 hisse pehli ke ek hisse jitne hain. Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** both the same  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 1950 ms]: Haan, sahi hai. Dekho, 6 barabar hisson mein se 2 hisse 2/6 hain, aur 2/6 = 1/3, isliye dono ne barabar khaya. Achha, ab pehle wale sawaal ko phir se dekhte hain. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 2840 ms · guard answerinq,twoq]: Pehle mod ke baad rang ek aadhe mein tha. Agle do mod ne us rang wale aadhe ko bhi kaata; socho woh kitne hisson mein bata. Ab phir se socho, jawab kya hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 1842 ms]: Rumal ke hisse yahan do ek jaise gol mein dikhaye hain: pehla gol do barabar hisson mein, ek mein rang, aur doosra aath barabar hisson mein. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (2 miss) · board up · ready 707 ms · guard uncorrected]: 8 sahi nahi hai. 8 toh rumal ke saare hisse hain, rang wale nahi. Rang modne se phailta nahi: woh sirf usi aadhe ke chhote hisson par hai jismein pehle bhara tha. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 4  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 1301 ms]: Bilkul sahi: hisse badle, par rumal par rang utna hi raha. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 2912 ms · guard ask]: Theek hai, yeh Hindi mein suno. Mohit ko chocolate ka 1/2 mila; Anjali ki waisi chocolate 6 barabar hisson mein thi, usne 3 hisse liye. Kiska hissa bada hai, ya dono ne barabar khaya?
  > card: Mohit ko chocolate ka 1/2 mila; Anjali ki waisi chocolate 6 barabar hisson mein thi, usne 3 hisse liye. Kiska hissa bada hai, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** the same hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 2580 ms]: Haan, sahi hai, kyunki 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** 5/12 kam hai  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1716 ms]: Haan, bilkul theek. Dekho, 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 3353 ms · guard mustsay,answerinq,long]: Achha, cricket par thodi der mein zaroor lautenge. Abhi apne kaam par wapas chalte hain. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 2269 ms]: Haan, pehle tum try karo.
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (1 miss) · board up · ready 1405 ms · guard diagnosis,uncorrected]: 6 sahi nahi hai. Pehli patti ke ek rang wale hisse ke neeche nayi patti ke hisse gino, phir doosre rang wale hisse ke neeche bhi. Pehli patti ke rang wale 2 hisse, nayi patti ke kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 2  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (2 miss) · board up · ready 3235 ms · guard samecard,uncorrected]: Nahi, 2 theek nahi. Har hissa 2 mein kata, toh rang wala har hissa bhi 2 chhote hisse bana. Isliye rang wale hisse utne hi nahi rehte; woh bhi dugne hote hain. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 4 hai na  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 3324 ms · guard flat,noconfirm]: Haan, sahi hai: pehli patti ka har hissa nayi mein 2 chhote hisse bana, toh rang wale 2 hisse 2 × 2 = 4 hue. Achha, ab cricket ki baat sunti hoon, uske baare mein kuch aur bataoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** fielding karna, catch pakadna  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 2311 ms · guard mustsay]: Achha, toh tumhe catch pakadna sabse achha lagta hai. Ab wapas apne kaam par aate hain. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Neeche 5 × 2 = 10 aur upar 2 × 2 = 4: dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** ten twelfths  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 2634 ms · guard mustsay,long]: Bilkul sahi, kyunki dono number 2 se guna hue. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** 2  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same · board up · ready 3048 ms · guard leak,long,uncorrected]: 2 sahi nahi hai. Ek aur raasta aazmaate hain. Patti ke 4 hisson se 8 banane ke liye har hissa 2 mein kaata, toh rang wala 1 hissa bhi 2 hisse bana. Isliye upar aur neeche, dono 2 se guna hue. 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"}]}}

**child:** 5  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same (1 miss) · board up · ready 1410 ms]: Nahi, 5 theek nahi. 2/3 ke hisson se 6 hisse banane ke liye har hissa kaise kaatna padega, aur tab rang wale hisson ka kya hoga, yeh socho. 2/3 ke barabar, neeche 6 wale fraction ka upar wala number kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2}]}}

**child:** 5  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same (2 miss) · board up · ready 1345 ms · guard uncorrected]: 5 se baat nahi bani. 5/6 mein sirf ek chhota hissa khaali hai, par 2/3 mein ek bada hissa khaali hai. Isliye upar 3 jodne se rang badh gaya. Ab tumhari baat sunti hoon.
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2}]}}

**child:** 4 aayega  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 (1 miss) · board up · ready 1498 ms]: Haan, sahi hai. Suno, neeche 3 × 2 = 6 hua, toh upar bhi 2 × 2 = 4; 2 + 3 = 5 nahi. Chalo, pehle wale sawaal ki taraf wapas aate hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2,"title":"2/3"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** mujhe lagta hai 3  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2483 ms · guard noconfirm]: Bilkul sahi: 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Chalo, ab ek sawaal hum saath mein karte hain. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** 4 se guna  _(incorrect)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked · board up · ready 3423 ms · guard negates,long]: Yeh jawab nahi hai. Neeche 5 ko 2 se guna kiya, isliye upar ke 3 ko bhi 2 se hi guna karenge. Upar 3 × 2 = 6 hua, toh 3/5 aur 6/10 barabar hain. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** upar 9  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 · board up · ready 1272 ms]: Haan, bilkul theek. Toh poora jawab: upar ke number 6 aur 9 hain. Yaani 3/5 = 6/10 aur 3/5 = 9/15. Ab agla sawaal tumhare liye. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** 4 hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 · board up · ready 2152 ms]: Sahi jawab, kyunki neeche 3 × 4 = 12 hua, toh upar bhi 1 × 4 = 4, yaani 1/3 = 4/12. Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":12,"shade":4,"title":"4/12"}]}}

**child:** 7  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 (1 miss) · board up · ready 1462 ms · guard uncorrected]: 7 sahi nahi hai. Pehle dekho ki 3/4 ka neeche wala number kis number se guna hokar 8 banta hai. Phir wahi guna upar wale number par bhi lagao. Neeche 8 ho, toh 3/4 ke barabar fraction ka upar wala number kya hoga?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3}]}}

**child:** 6 hoga  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 · board up · ready 2817 ms · guard noconfirm]: Haan, sahi hai. Neeche 4 × 2 = 8 hua, toh upar bhi 3 × 2 = 6; 4 jodkar 7 nahi. 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3,"title":"3/4"},{"parts":8,"shade":6,"title":"6/8"}]}}

**child:** 3/12  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1465 ms]: Bilkul sahi: neeche 4 × 3 = 12, toh upar 1 × 3 = 3, yaani 3/12; 1/12 mein upar guna nahi hua. Ab barabar fraction banana aa gaya. Ab ulta kaam: do fraction diye hon, toh kaise pata karein ki woh barabar hain ya nahi. Yahan tak saaf hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":12,"shade":3,"title":"3/12"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1066 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milenge!

## Agent


